/**
 * 快速统计：chain_native 路径持仓和存款的分布
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

function runOnce(): { maxHoldings: number; maxSavings: number; finalSavings: number; ending: string } {
  const store = useGameStore()
  store.resetGame()
  store.startNewGame()
  store.setupGame('中坚大后方', '传统私企', 8000, 5000000, 'INTJ', 'world_traveler')
  store.selectRetirementPath('chain_native')

  let maxHoldings = 0
  let maxSavings = 0

  for (let age = 22; age <= 62; age++) {
    const s = store.state as any
    if (s.endingTriggered) break
    const event = store.currentNarrativeEvent
    const crossroad = store.currentCrossroad

    if (event && event.options && event.options.length > 0) {
      store.selectNarrativeOption(event.options[playerChoose(event, s)].id)
    }
    if (crossroad && crossroad.options && crossroad.options.length > 0) {
      store.selectCrossroadOption(crossroad.options[playerChoose(crossroad, s)].id)
    }

    store.commitYear()
    const p = store.state as any
    if ((p.chainHoldings || 0) > maxHoldings) maxHoldings = p.chainHoldings || 0
    if (p.currentSavings > maxSavings) maxSavings = p.currentSavings
  }
  return { maxHoldings, maxSavings, finalSavings: (store.state as any).currentSavings, ending: store.state.currentEndingId || '' }
}

const N = 100
let maxH = 0, maxS = 0
let countOver10M = 0, countOver30M = 0, countOver50M = 0
let countNegative = 0
let sumFinal = 0

for (let i = 0; i < N; i++) {
  const r = runOnce()
  sumFinal += r.finalSavings
  if (r.maxHoldings > maxH) maxH = r.maxHoldings
  if (r.maxSavings > maxS) maxS = r.maxSavings
  if (r.maxHoldings > 10000000) countOver10M++
  if (r.maxHoldings > 30000000) countOver30M++
  if (r.maxHoldings > 50000000) countOver50M++
  if (r.finalSavings < 0) countNegative++
}

console.log(`\n=== chain_native ${N}轮统计 ===`)
console.log(`最高持仓: ${Math.round(maxH).toLocaleString()}`)
console.log(`最高存款: ${Math.round(maxS).toLocaleString()}`)
console.log(`平均最终存款: ${Math.round(sumFinal / N).toLocaleString()}`)
console.log(`持仓超1000万: ${countOver10M}/${N} (${(countOver10M/N*100).toFixed(0)}%)`)
console.log(`持仓超3000万: ${countOver30M}/${N} (${(countOver30M/N*100).toFixed(0)}%)`)
console.log(`持仓超5000万: ${countOver50M}/${N} (${(countOver50M/N*100).toFixed(0)}%)`)
console.log(`最终存款为负: ${countNegative}/${N} (${(countNegative/N*100).toFixed(0)}%)`)