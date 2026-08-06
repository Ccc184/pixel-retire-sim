/**
 * 精确追踪：持仓从 1000万 涨到 1.1亿 的完整路径
 * 输出每一年的持仓变化和来源
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

function runTrace(runIdx: number): { maxHoldings: number; maxAge: number } {
  const store = useGameStore()
  store.resetGame()
  store.startNewGame()
  store.setupGame('中坚大后方', '传统私企', 8000, 5000000, 'INTJ', 'world_traveler')
  store.selectRetirementPath('chain_native')

  let maxHoldings = 0
  let maxAge = 0
  let prevHoldings = 0

  for (let age = 22; age <= 62; age++) {
    const s = store.state as any
    if (s.endingTriggered) break
    const event = store.currentNarrativeEvent
    const crossroad = store.currentCrossroad
    const evTitle = event?.title || crossroad?.title || '-'
    const evId = event?.id || crossroad?.id || '-'

    const beforeEventHoldings = s.chainHoldings || 0

    if (event && event.options && event.options.length > 0) {
      const opt = event.options[playerChoose(event, s)]
      store.selectNarrativeOption(opt.id)
    }
    if (crossroad && crossroad.options && crossroad.options.length > 0) {
      const opt = crossroad.options[playerChoose(crossroad, s)]
      store.selectCrossroadOption(opt.id)
    }

    const afterEventHoldings = (store.state as any).chainHoldings || 0
    const eventDelta = afterEventHoldings - beforeEventHoldings

    const beforeYearHoldings = (store.state as any).chainHoldings || 0
    store.commitYear()
    const afterYearHoldings = (store.state as any).chainHoldings || 0
    const yearDelta = afterYearHoldings - beforeYearHoldings

    const totalDelta = afterYearHoldings - prevHoldings

    if (afterYearHoldings > maxHoldings) {
      maxHoldings = afterYearHoldings
      maxAge = age
    }

    // 只打印变化大的年份或每5年
    if (Math.abs(totalDelta) > 2000000 || age % 5 === 0 || age === 22) {
      const pct = prevHoldings > 0 ? ((totalDelta / prevHoldings) * 100).toFixed(1) + '%' : 'N/A'
      console.log(`RUN${runIdx} 年龄${age} | ${evTitle.substring(0, 20)}(${evId.substring(0, 20)})`)
      console.log(`  持仓: ${Math.round(prevHoldings).toLocaleString()} -> ${Math.round(afterYearHoldings).toLocaleString()} (Δ${Math.round(totalDelta).toLocaleString()}, ${pct})`)
      if (Math.abs(eventDelta) > 100000) {
        console.log(`    事件Δ: ${Math.round(eventDelta).toLocaleString()}`)
      }
      if (Math.abs(yearDelta) > 100000) {
        console.log(`    年度Δ: ${Math.round(yearDelta).toLocaleString()}`)
      }
    }

    prevHoldings = afterYearHoldings
  }
  return { maxHoldings, maxAge }
}

// 找一次持仓超过 5000 万的
for (let i = 1; i <= 15; i++) {
  const r = runTrace(i)
  if (r.maxHoldings > 30000000) {
    console.log(`\n★ RUN-${i}: 最高持仓 ${Math.round(r.maxHoldings).toLocaleString()} @ ${r.maxAge}岁`)
    break
  }
  console.log(`\n--- RUN-${i} 最高: ${Math.round(r.maxHoldings).toLocaleString()} ---\n`)
}