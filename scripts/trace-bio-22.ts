/**
 * 专门追踪 bio_gambler 22岁的存款跳变
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

function runTrace() {
  const store = useGameStore()
  store.resetGame()
  store.startNewGame()
  store.setupGame('中坚大后方', '传统私企', 8000, 5000000, 'INTJ', 'world_traveler')
  store.selectRetirementPath('bio_gambler' as any)

  const s0 = store.state as any
  console.log(`初始存款: ${s0.currentSavings.toLocaleString()} 月薪:${s0.currentMonthlySalary}`)

  for (let age = 22; age <= 25; age++) {
    const s = store.state as any
    if (s.endingTriggered) { console.log(`结局@${age}`); break }
    const event = store.currentNarrativeEvent
    const crossroad = store.currentCrossroad
    const evTitle = event?.title || crossroad?.title || '-'
    const evId = event?.id || crossroad?.id || '-'

    console.log(`\n年龄${age}初: 存款=${Math.round(s.currentSavings).toLocaleString()} bio=${Math.round(s.bioPortfolio || 0).toLocaleString()}`)
    console.log(`  事件: ${evTitle} (${evId})`)

    if (event && event.options && event.options.length > 0) {
      const idx = playerChoose(event, s)
      const opt = event.options[idx]
      console.log(`  选项: ${opt.id} / ${opt.label} / hint=${opt.hint}`)
      store.selectNarrativeOption(opt.id)
      const afterEv = store.state as any
      console.log(`  选后: 存款=${Math.round(afterEv.currentSavings).toLocaleString()} bio=${Math.round(afterEv.bioPortfolio || 0).toLocaleString()}`)
    }
    if (crossroad && crossroad.options && crossroad.options.length > 0) {
      const opt = crossroad.options[playerChoose(crossroad, s)]
      store.selectCrossroadOption(opt.id)
    }

    store.commitYear()
    const p = store.state as any
    const yr = store.lastYearResult
    console.log(`  年终: 存款=${Math.round(p.currentSavings).toLocaleString()} (Δ${Math.round(p.currentSavings - s.currentSavings).toLocaleString()})`)
    console.log(`  bio=${Math.round(p.bioPortfolio || 0).toLocaleString()} netChange=${Math.round(yr?.netChange || 0).toLocaleString()}`)
    console.log(`  salaryInc=${Math.round(yr?.salaryIncome || 0).toLocaleString()} livingCost=${Math.round(yr?.livingCost || 0).toLocaleString()}`)
  }
}

// 跑多轮，找22岁就跳变的
for (let i = 0; i < 20; i++) {
  console.log(`\n=========== RUN-${i + 1} ===========`)
  runTrace()
  const store = useGameStore()
  const s = store.state as any
  if (s.currentSavings > 1000000 && s.currentAge <= 23) {
    console.log('*** 找到异常！23岁前存款破百万 ***')
    break
  }
}