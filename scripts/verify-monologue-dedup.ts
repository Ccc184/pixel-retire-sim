/**
 * 验证独白去重修复效果：统计 6 年窗口内独白重复次数
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

const PATHS: Array<[string, string, string, string, string]> = [
  ['ai_symbiote', 'AI共生者', '中坚大后方', '传统私企', 'INTJ'],
  ['chain_native', '链上原住民', '中坚大后方', '传统私企', 'INTJ'],
  ['digital_nomad', '数字游牧民', '中坚大后方', '传统私企', 'INTJ'],
  ['super_ip', '超级IP', '中坚大后方', '传统私企', 'INTJ'],
  ['silver_economy', '银发收割者', '中坚大后方', '传统私企', 'INTJ'],
  ['bio_gambler', '生物赌徒', '中坚大后方', '传统私企', 'INTJ'],
]

function playerChoose(event: any): number {
  const opts = event?.options || []
  if (opts.length === 0) return 0
  return Math.floor(Math.random() * opts.length)
}

function runOption(player?: string): number {
  const [pathId, , city, prof, mbti] = player ? PATHS.find(p => p[0] === player)! : PATHS[0]
  const store = useGameStore()
  store.resetGame()
  store.startNewGame()
  store.setupGame(city, prof, 8000, 500000, mbti, 'world_traveler')
  store.selectRetirementPath(pathId)

  // 记录 (年龄, 独白) 序列
  const monologues: Array<[number, string]> = []
  for (let age = 22; age <= 62; age++) {
    const s = store.state as any
    if (s.endingTriggered) break
    const event = store.currentNarrativeEvent
    const crossroad = store.currentCrossroad
    if (event && event.options && event.options.length > 0) {
      store.selectNarrativeOption(event.options[playerChoose(event)].id)
    }
    if (crossroad && crossroad.options && crossroad.options.length > 0) {
      store.selectCrossroadOption(crossroad.options[playerChoose(crossroad)].id)
    }
    // 记录本年独白（commitYear 前是当年独白）
    const mono = store.state.yearOpeningMonologue
    if (mono) monologues.push([age, mono])
    store.commitYear()
  }
  // 统计 6 年窗口内重复
  let dup = 0
  for (let i = 0; i < monologues.length; i++) {
    const [age, text] = monologues[i]
    for (let j = Math.max(0, i - 6); j < i; j++) {
      if (monologues[j][1] === text) {
        dup++
        break
      }
    }
  }
  return dup
}

const RUNS = 30
console.log('=== 独白 6 年窗口重复统计（修复后） ===')
let totalDup = 0
for (const [pathId, name] of PATHS) {
  let sum = 0
  for (let i = 0; i < RUNS; i++) sum += runOption(pathId)
  const avg = (sum / RUNS).toFixed(1)
  totalDup += sum
  console.log(`${name}: 平均每局重复 ${avg} 次`)
}
console.log(`\n总计（${RUNS}局 × 6路径）重复: ${totalDup} 次`)