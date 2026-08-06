/**
 * 定位 chain_native 巨额负存款跳变的精确事件源
 * 逐秒追踪：当单年存款变化 < -1M 时，打印完整结算明细
 */
const _store: Record<string, string> = {}
;(globalThis as any).localStorage = {
  getItem: (key: string) => _store[key] ?? null,
  setItem: (key: string, val: string) => { _store[key] = val },
  removeItem: (key: string) => { delete _store[key] },
  clear: () => { Object.keys(_store).forEach(k => delete _store[k]) },
}
;(globalThis as any).window = globalThis
;(globalThis as any).requestIdleCallback = (cb: () => void) => setTimeout(cb, 0)
;(globalThis as any).cancelIdleCallback = (id: any) => clearTimeout(id)

import { createPinia, setActivePinia } from 'pinia'
import { useGameStore } from '../src/store/game.store.js'

setActivePinia(createPinia())

// 生存本能AI（与主测试一致）：存款低时避免大额支出
function playerChoose(event: any, state: any): number {
  const opts = event?.options || []
  if (opts.length === 0) return 0
  const savings = state?.currentSavings ?? 0
  const stress = state?.stress ?? 0
  const health = state?.health ?? 100
  const safe = opts.map((o: any, i: number) => {
    const hint = o.hint || o.description || ''
    let danger = 0
    if (savings < 50000 && /-\s*\d[\d,]*万|存款归零|掏空|借.*高利|负债/.test(hint)) danger += 3
    if (stress > 80 && /压力\s*\+|压力\+|stress\s*\+/.test(hint)) danger += 2
    if (health < 30 && /健康\s*-|健康-|health\s*-/.test(hint)) danger += 2
    return { o, i, danger }
  })
  const safeChoices = safe.filter((x: any) => x.danger === 0)
  const pool = safeChoices.length > 0 ? safeChoices : safe
  return pool[Math.floor(Math.random() * pool.length)].i
}

function runTrace(tag: string) {
  const store = useGameStore()
  store.resetGame()
  store.startNewGame()
  store.setupGame('中坚大后方', '传统私企', 8000, 5000000, 'INTJ', 'world_traveler')
  store.selectRetirementPath('chain_native')

  console.log(`\n===== ${tag} =====`)
  for (let age = 22; age <= 62; age++) {
    const s = store.state as any
    if (s.endingTriggered) {
      console.log(`>>> 结局: ${store.state.currentEndingId} @ ${age}岁`)
      break
    }
    const event = store.currentNarrativeEvent
    const eventTitle = event?.title || ''
    const crossroad = store.currentCrossroad
    const crossTitle = crossroad?.title || ''

    if (event && event.options && event.options.length > 0) {
      const idx = playerChoose(event, s)
      const opt = event.options[idx]
      store.selectNarrativeOption(opt.id)
    }
    if (crossroad && crossroad.options && crossroad.options.length > 0) {
      const idx = playerChoose(crossroad, s)
      const opt = crossroad.options[idx]
      store.selectCrossroadOption(opt.id)
    }

    const beforeSavings = s.currentSavings
    const beforeHoldings = s.chainHoldings || 0
    store.commitYear()
    const p = store.state as any
    const savingsDelta = p.currentSavings - beforeSavings
    const holdingsDelta = (p.chainHoldings || 0) - beforeHoldings

    if (savingsDelta < -1000000 || savingsDelta > 1000000 || holdingsDelta < -1000000 || holdingsDelta > 1000000) {
      console.log(`年龄${age} | 事件:${eventTitle || crossTitle || '-'}`)
      console.log(`  存款 ${Math.round(beforeSavings).toLocaleString()} -> ${Math.round(p.currentSavings).toLocaleString()} (Δ${Math.round(savingsDelta).toLocaleString()})`)
      console.log(`  持仓 ${Math.round(beforeHoldings).toLocaleString()} -> ${Math.round(p.chainHoldings || 0).toLocaleString()} (Δ${Math.round(holdingsDelta).toLocaleString()})`)
      console.log(`  被动收入:${Math.round(p.passiveIncome).toLocaleString()} 月薪:${Math.round(p.currentMonthlySalary).toLocaleString()}`)
    }
  }
}

// 跑多轮找命中
for (let i = 0; i < 8; i++) {
  runTrace(`RUN-${i + 1}`)
}