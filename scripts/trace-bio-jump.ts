/**
 * 追踪 bio_gambler 存款跳变来源
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
  store.selectRetirementPath('bio_gambler' as any)

  console.log(`\n===== ${tag} =====`)
  for (let age = 22; age <= 62; age++) {
    const s = store.state as any
    if (s.endingTriggered) {
      console.log(`>>> 结局: ${store.state.currentEndingId} @ ${age}岁`)
      break
    }
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
    const beforeBio = s.bioPortfolio || 0
    store.commitYear()
    const p = store.state as any
    const savingsDelta = p.currentSavings - beforeSavings
    const bioDelta = (p.bioPortfolio || 0) - beforeBio
    const yr = store.yearResult

    if (Math.abs(savingsDelta) > 2000000 || Math.abs(bioDelta) > 2000000) {
      console.log(`年龄${age} | ${evTitle}(${evId})`)
      console.log(`  存款:${Math.round(beforeSavings).toLocaleString()} -> ${Math.round(p.currentSavings).toLocaleString()} (Δ${Math.round(savingsDelta).toLocaleString()})`)
      console.log(`  bio:${Math.round(beforeBio).toLocaleString()} -> ${Math.round(p.bioPortfolio || 0).toLocaleString()} (Δ${Math.round(bioDelta).toLocaleString()})`)
      console.log(`  netChange:${Math.round(yr?.netChange || 0).toLocaleString()} salary:${Math.round(yr?.salaryIncome || 0).toLocaleString()} passive:${Math.round(yr?.passiveIncome || 0).toLocaleString()}`)
      console.log(`  investGain:${Math.round(yr?.investmentGain || 0).toLocaleString()} side:${Math.round(yr?.sideHustleIncome || 0).toLocaleString()}`)
    }
  }
}

for (let i = 0; i < 8; i++) {
  runTrace(`RUN-${i + 1}`)
}