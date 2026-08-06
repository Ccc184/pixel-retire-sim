/**
 * 专门追踪 chain_native 存款跳变到 2.6 亿的来源
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

function runTrace(runIdx: number) {
  const store = useGameStore()
  store.resetGame()
  store.startNewGame()
  store.setupGame('中坚大后方', '传统私企', 8000, 5000000, 'INTJ', 'world_traveler')
  store.selectRetirementPath('chain_native')

  let maxSavings = 0
  let hasBigJump = false

  for (let age = 22; age <= 62; age++) {
    const s = store.state as any
    if (s.endingTriggered) break
    const event = store.currentNarrativeEvent
    const crossroad = store.currentCrossroad
    const evTitle = event?.title || crossroad?.title || '-'
    const evId = event?.id || crossroad?.id || '-'

    if (event && event.options && event.options.length > 0) {
      const opt = event.options[playerChoose(event, s)]
      store.selectNarrativeOption(opt.id)
    }
    if (crossroad && crossroad.options && crossroad.options.length > 0) {
      const opt = crossroad.options[playerChoose(crossroad, s)]
      store.selectCrossroadOption(opt.id)
    }

    const beforeSavings = s.currentSavings
    const beforeHoldings = s.chainHoldings || 0
    store.commitYear()
    const p = store.state as any
    const savingsDelta = p.currentSavings - beforeSavings
    const holdingsDelta = (p.chainHoldings || 0) - beforeHoldings

    if (p.currentSavings > maxSavings) maxSavings = p.currentSavings

    if (savingsDelta > 50000000 || p.currentSavings > 100000000) {
      hasBigJump = true
      console.log(`\nRUN-${runIdx} 年龄${age} | ${evTitle}(${evId})`)
      console.log(`  存款: ${Math.round(beforeSavings).toLocaleString()} -> ${Math.round(p.currentSavings).toLocaleString()} (Δ${Math.round(savingsDelta).toLocaleString()})`)
      console.log(`  持仓: ${Math.round(beforeHoldings).toLocaleString()} -> ${Math.round(p.chainHoldings || 0).toLocaleString()} (Δ${Math.round(holdingsDelta).toLocaleString()})`)
      console.log(`  被动收入:${Math.round(p.passiveIncome).toLocaleString()} 月薪:${Math.round(p.currentMonthlySalary).toLocaleString()} AllIn:${p.isAllInPath}`)
    }
    if (holdingsDelta > 10000000) {
      console.log(`  [持仓暴涨] 年龄${age} ${evTitle}: Δ${Math.round(holdingsDelta).toLocaleString()}`)
    }
  }
  return { maxSavings, hasBigJump, finalSavings: (store.state as any).currentSavings }
}

// 跑多轮找命中
for (let i = 0; i < 20; i++) {
  const r = runTrace(i + 1)
  if (r.maxSavings > 50000000) {
    console.log(`\n>>> RUN-${i+1}: 最大存款 ${Math.round(r.maxSavings).toLocaleString()} ← 找到异常`)
  }
}