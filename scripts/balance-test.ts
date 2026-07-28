/**
 * 批量平衡测试 - 跑N轮统计各路径结局分布
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

const PATHS = [
  { id: 'ai_symbiote', name: 'AI共生者' },
  { id: 'chain_native', name: '链上原住民' },
  { id: 'digital_nomad', name: '数字游牧民' },
  { id: 'super_ip', name: '超级IP' },
  { id: 'silver_economy', name: '银发守夜人' },
  { id: 'bio_gambler', name: '生物赌徒' },
]

const ROUNDS = 100
const results: Record<string, Record<string, number>> = {}
const ages: Record<string, number[]> = {}
PATHS.forEach(p => { results[p.id] = {}; ages[p.id] = [] })

function playerChoose(event: any, state: any): number {
  const opts = event.options || []
  if (opts.length === 0) return 0
  let safeOpts = opts.map((o: any, i: number) => ({ o, i }))
  if (state.currentSavings < 50000) {
    const filtered = safeOpts.filter(({ o }: any) => !o.savingsChange || o.savingsChange >= -20000)
    if (filtered.length > 0) safeOpts = filtered
  }
  if (state.stress > 80) {
    const filtered = safeOpts.filter(({ o }: any) => {
      const hint = (o.hint || '').toString()
      return !hint.includes('压力+1') && !hint.includes('压力+2')
    })
    if (filtered.length > 0) safeOpts = filtered
  }
  if (Math.random() < 0.3) {
    return safeOpts[Math.floor(Math.random() * safeOpts.length)].i
  }
  let best = safeOpts[0].i, bestLen = -1
  safeOpts.forEach(({ o, i }: any) => {
    const len = (o.log || o.text || o.hint || '').toString().length
    if (len > bestLen) { bestLen = len; best = i }
  })
  return best
}

function runPath(pathId: string): { endingId: string; finalAge: number } {
  // 每轮使用全新的pinia实例避免状态污染
  setActivePinia(createPinia())
  const store = useGameStore()
  store.resetGame()
  store.startNewGame()
  store.setupGame('中坚大后方', '传统私企', 8000, 5000000, 'INTJ' as any)
  store.selectRetirementPath(pathId as any)

  for (let age = 22; age <= 65; age++) {
    const s = store.state
    const event = store.currentNarrativeEvent
    if (event && event.options && event.options.length > 0) {
      const idx = playerChoose(event, s)
      const opt = event.options[idx] || event.options[0]
      store.selectNarrativeOption(opt.id)
    }
    const crossroad = store.currentCrossroad
    if (crossroad && crossroad.options && crossroad.options.length > 0) {
      const idx = playerChoose(crossroad, s)
      const opt = crossroad.options[idx] || crossroad.options[0]
      store.selectCrossroadOption(opt.id)
    }
    const availableCards = store.currentCards || []
    if (availableCards.length > 0) {
      const pathCards = availableCards.filter((c: any) => c.pathId === pathId)
      const generalCards = availableCards.filter((c: any) => !c.pathId)
      const cardsToSelect = [...pathCards, ...generalCards].slice(0, Math.random() < 0.5 ? 1 : 2)
      for (const card of cardsToSelect) {
        if (card.prerequisites && !card.prerequisites(s)) continue
        store.toggleCard(card.id)
      }
    }
    store.commitYear()
    const postS = store.state
    if (postS.endingTriggered) {
      return { endingId: String(postS.currentEndingId || 'unknown'), finalAge: age }
    }
    if (postS.currentSavings < -500000 || postS.health < 15) {
      return { endingId: 'forced_end', finalAge: age }
    }
  }
  return { endingId: 'timeout', finalAge: 65 }
}

// 执行N轮
for (let r = 0; r < ROUNDS; r++) {
  for (const p of PATHS) {
    const result = runPath(p.id)
    results[p.id][result.endingId] = (results[p.id][result.endingId] || 0) + 1
    ages[p.id].push(result.finalAge)
  }
}

// 输出结果
console.log(`\n========== ${ROUNDS}轮平衡测试结果 ==========\n`)
console.log('路径'.padEnd(14) + '| 成功   | 失败   | 退休     | 破产   | 平均年龄')
console.log('-'.repeat(75))

for (const p of PATHS) {
  const r = results[p.id]
  const success = Object.keys(r).filter(k => k.startsWith('path_success')).reduce((sum, k) => sum + r[k], 0)
  const failure = Object.keys(r).filter(k => k.startsWith('path_failure')).reduce((sum, k) => sum + r[k], 0)
  const retired = Object.keys(r).filter(k => k.match(/^E\d$/)).reduce((sum, k) => sum + r[k], 0)
  const forced = (r['forced_end'] || 0) + (r['unknown'] || 0) + (r['timeout'] || 0)
  const avgAge = ages[p.id].reduce((a, b) => a + b, 0) / ages[p.id].length
  const successRate = Math.round(success / ROUNDS * 100)
  const failureRate = Math.round(failure / ROUNDS * 100)
  const retiredRate = Math.round(retired / ROUNDS * 100)
  const forcedRate = Math.round(forced / ROUNDS * 100)
  console.log(
    p.name.padEnd(14) + 
    `| ${success}(${successRate}%)`.padEnd(8) +
    `| ${failure}(${failureRate}%)`.padEnd(8) +
    `| ${retired}(${retiredRate}%)`.padEnd(10) +
    `| ${forced}(${forcedRate}%)`.padEnd(8) +
    `| ${avgAge.toFixed(1)}岁`
  )
}

console.log('\n--- 详细结局分布 ---')
for (const p of PATHS) {
  const r = results[p.id]
  const parts = Object.entries(r).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(', ')
  console.log(`${p.name}: ${parts}`)
}
