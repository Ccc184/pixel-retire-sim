/**
 * 追踪 chain_native 的 chainHoldings / savings / passiveIncome 逐年变化
 * 定位"存款跳到亿级"的根因
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

function runTrace(seedPrefix: string) {
  const store = useGameStore()
  store.resetGame()
  store.startNewGame()
  store.setupGame('中坚大后方', '传统私企', 8000, 5000000, 'INTJ', 'world_traveler')
  store.selectRetirementPath('chain_native')

  console.log(`\n===== ${seedPrefix} 追踪 =====`)
  console.log(`年龄 | 存款 | 持仓 | 被动收入 | 月薪 | AllIn | hasAbandoned | 事件`)

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
      store.selectNarrativeOption(event.options[idx].id)
    }
    if (crossroad && crossroad.options && crossroad.options.length > 0) {
      const idx = playerChoose(crossroad, s)
      store.selectCrossroadOption(crossroad.options[idx].id)
    }

    const before = {
      savings: s.currentSavings,
      holdings: s.chainHoldings || 0,
      passive: s.passiveIncome,
      allIn: s.isAllInPath,
    }

    store.commitYear()

    const p = store.state as any
    const savingsDelta = p.currentSavings - before.savings
    const holdingsDelta = (p.chainHoldings || 0) - before.holdings
    const huge = Math.abs(savingsDelta) > 1000000 || Math.abs(holdingsDelta) > 1000000
    const marker = huge ? ' <<<' : ''
    console.log(
      `${age} | ${Math.round(p.currentSavings).toLocaleString()} | ${Math.round(p.chainHoldings || 0).toLocaleString()}` +
      ` | ${Math.round(p.passiveIncome).toLocaleString()} | ${Math.round(p.currentMonthlySalary).toLocaleString()}` +
      ` | ${p.isAllInPath ? 'Y' : 'N'} | ${p.hasAbandonedCrypto ? 'Y' : 'N'}` +
      ` | Δ存款${Math.round(savingsDelta).toLocaleString()} Δ持仓${Math.round(holdingsDelta).toLocaleString()} ${eventTitle || crossTitle || '-'}${marker}`
    )
  }
}

runTrace('RUN-1')
runTrace('RUN-2')