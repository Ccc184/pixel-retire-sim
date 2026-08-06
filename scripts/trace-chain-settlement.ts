/**
 * 打印 chain_native 每年结算的 netChange 分项，定位存款跳变来源
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

function runTrace(tag: string) {
  const store = useGameStore()
  store.resetGame()
  store.startNewGame()
  store.setupGame('中坚大后方', '传统私企', 8000, 5000000, 'INTJ', 'world_traveler')
  store.selectRetirementPath('chain_native')

  console.log(`\n===== ${tag} =====`)
  console.log(`年龄 | 存款 | 持仓 | 结算netChange | salary | passive | side | investGain | livingCost | 事件`)

  for (let age = 22; age <= 62; age++) {
    const s = store.state as any
    if (s.endingTriggered) {
      console.log(`>>> 结局: ${store.state.currentEndingId} @ ${age}岁`)
      break
    }
    const event = store.currentNarrativeEvent
    const crossroad = store.currentCrossroad
    const evId = event?.id || crossroad?.id || '-'
    const evTitle = event?.title || crossroad?.title || '-'

    if (event && event.options && event.options.length > 0) {
      const opt = event.options[playerChoose(event, s)]
      store.selectNarrativeOption(opt.id)
    }
    if (crossroad && crossroad.options && crossroad.options.length > 0) {
      const opt = crossroad.options[playerChoose(crossroad, s)]
      store.selectCrossroadOption(opt.id)
    }

    const beforeSavings = s.currentSavings
    store.commitYear()
    const p = store.state as any
    const yr = store.yearResult
    const savingsDelta = p.currentSavings - beforeSavings

    if (Math.abs(savingsDelta) > 500000) {
      console.log(`年龄${age} | 存款 ${Math.round(beforeSavings).toLocaleString()} -> ${Math.round(p.currentSavings).toLocaleString()} (Δ${Math.round(savingsDelta).toLocaleString()})`)
      console.log(`  持仓:${Math.round(p.chainHoldings || 0).toLocaleString()} | netChange:${Math.round(yr?.netChange || 0).toLocaleString()}`)
      console.log(`  salary:${Math.round(yr?.salaryIncome || 0).toLocaleString()} passive:${Math.round(yr?.passiveIncome || 0).toLocaleString()} side:${Math.round(yr?.sideHustleIncome || 0).toLocaleString()}`)
      console.log(`  investGain:${Math.round(yr?.investmentGain || 0).toLocaleString()} livingCost:${Math.round(yr?.livingCost || 0).toLocaleString()} ins:${Math.round(yr?.insuranceCost || 0).toLocaleString()} mort:${Math.round(yr?.mortgageCost || 0).toLocaleString()}`)
      console.log(`  事件:${evTitle}(${evId}) | 月薪:${Math.round(p.currentMonthlySalary).toLocaleString()} AllIn:${p.isAllInPath} 失业:${p.isUnemployed}`)
    }
  }
}

for (let i = 0; i < 6; i++) {
  runTrace(`RUN-${i + 1}`)
}