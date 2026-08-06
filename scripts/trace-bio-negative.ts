/**
 * 追踪 bio_gambler 路径 bioPortfolio 变负的来源
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
  return Math.floor(Math.random() * opts.length)
}

function runTrace(runIdx: number): boolean {
  const store = useGameStore()
  store.resetGame()
  store.startNewGame()
  store.setupGame('中坚大后方', '传统私企', 8000, 500000, 'INTJ', 'world_traveler')
  store.selectRetirementPath('bio_gambler')

  let prevBio = 0
  let foundNegative = false

  for (let age = 22; age <= 62; age++) {
    const s = store.state as any
    if (s.endingTriggered) break
    const event = store.currentNarrativeEvent
    const crossroad = store.currentCrossroad
    const evTitle = event?.title || crossroad?.title || '-'
    const evId = event?.id || crossroad?.id || '-'

    const beforeBio = s.bioPortfolio || 0

    if (event && event.options && event.options.length > 0) {
      store.selectNarrativeOption(event.options[playerChoose(event, s)].id)
    }
    if (crossroad && crossroad.options && crossroad.options.length > 0) {
      store.selectCrossroadOption(crossroad.options[playerChoose(crossroad, s)].id)
    }

    const afterEventBio = (store.state as any).bioPortfolio || 0
    const eventDelta = afterEventBio - beforeBio

    store.commitYear()
    const afterYearBio = (store.state as any).bioPortfolio || 0
    const yearDelta = afterYearBio - afterEventBio

    if (afterYearBio < 0) {
      console.log(`\n★ RUN${runIdx} 年龄${age} bio变负! ${evTitle}(${evId})`)
      console.log(`  事件前: ${Math.round(beforeBio).toLocaleString()}`)
      console.log(`  事件后: ${Math.round(afterEventBio).toLocaleString()} (Δ${Math.round(eventDelta).toLocaleString()})`)
      console.log(`  年度后: ${Math.round(afterYearBio).toLocaleString()} (Δ${Math.round(yearDelta).toLocaleString()})`)
      console.log(`  存款: ${Math.round((store.state as any).currentSavings).toLocaleString()}`)
      foundNegative = true
      break
    }

    prevBio = afterYearBio
  }
  return foundNegative
}

let found = 0
for (let i = 1; i <= 50 && found < 3; i++) {
  if (runTrace(i)) found++
}
if (found === 0) console.log('50轮内未发现 bioPortfolio 为负的情况')