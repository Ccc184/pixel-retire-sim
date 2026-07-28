/**
 * 单路径详细追踪 - 打印每年关键指标
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

const PATH_ID = process.argv[2] || 'digital_nomad'

setActivePinia(createPinia())
const store = useGameStore()
store.resetGame()
store.startNewGame()
store.setupGame('中坚大后方', '传统私企', 8000, 5000000, 'INTJ' as any)
store.selectRetirementPath(PATH_ID as any)

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

console.log(`\n========== 追踪路径: ${PATH_ID} ==========\n`)
console.log('年龄 | 存款      | 月薪    | 被动收入 | 信念 | 幸福 | 压力 | 健康 | 事件')
console.log('-'.repeat(100))

for (let age = 22; age <= 65; age++) {
  const s = store.state
  const events: string[] = []

  const event = store.currentNarrativeEvent
  if (event && event.options && event.options.length > 0) {
    const idx = playerChoose(event, s)
    const opt = event.options[idx] || event.options[0]
    events.push(`叙事:${event.title || event.id}→${opt.label?.slice(0, 20)}`)
    store.selectNarrativeOption(opt.id)
  }
  const crossroad = store.currentCrossroad
  if (crossroad && crossroad.options && crossroad.options.length > 0) {
    const idx = playerChoose(crossroad, s)
    const opt = crossroad.options[idx] || crossroad.options[0]
    events.push(`十字:${crossroad.title?.slice(0, 15)}→${opt.label?.slice(0, 20)}`)
    store.selectCrossroadOption(opt.id)
  }
  const availableCards = store.currentCards || []
  if (availableCards.length > 0) {
    const pathCards = availableCards.filter((c: any) => c.pathId === PATH_ID)
    const generalCards = availableCards.filter((c: any) => !c.pathId)
    const cardsToSelect = [...pathCards, ...generalCards].slice(0, Math.random() < 0.5 ? 1 : 2)
    for (const card of cardsToSelect) {
      if (card.prerequisites && !card.prerequisites(s)) continue
      events.push(`卡:${card.title?.slice(0, 20)}`)
      store.toggleCard(card.id)
    }
  }
  store.commitYear()
  const postS = store.state

  // 打印路径专属指标
  const extra: string[] = []
  const anyState = postS as any
  if (anyState.nomadClients) extra.push(`客户:${anyState.nomadClients}`)
  if (anyState.ipFollowers) extra.push(`粉丝:${(anyState.ipFollowers/10000).toFixed(1)}万`)
  if (anyState.ipReputation) extra.push(`声誉:${anyState.ipReputation}`)
  if (anyState.bioPortfolio) extra.push(`bio投资:${(anyState.bioPortfolio/10000).toFixed(1)}万`)
  if (anyState.silverMonthlyRevenue) extra.push(`月营收:${(anyState.silverMonthlyRevenue/10000).toFixed(1)}万`)
  if (anyState.isAllInPath) extra.push('AllIn')

  console.log(
    `${age}岁`.padEnd(5) +
    `| ${Math.round(postS.currentSavings/10000).toString().padStart(4)}万` +
    `| ${Math.round((postS.isUnemployed ? 0 : postS.currentMonthlySalary)/1000).toString().padStart(4)}k` +
    `| ${Math.round(postS.passiveIncome/10000).toString().padStart(4)}万/年` +
    `| ${Math.round(postS.pathFaith).toString().padStart(3)}` +
    `| ${Math.round(postS.happiness).toString().padStart(3)}` +
    `| ${Math.round(postS.stress).toString().padStart(3)}` +
    `| ${Math.round(postS.health).toString().padStart(3)}` +
    `| ${events.join('; ').slice(0, 60)} | ${extra.join(' ')}`
  )

  if (postS.endingTriggered) {
    console.log(`\n>>> 结局: ${postS.currentEndingId} @ ${age}岁`)
    break
  }
  if (postS.currentSavings < -500000 || postS.health < 15) {
    console.log(`\n>>> 破产/死亡 @ ${age}岁, 存款=${postS.currentSavings}, 健康=${postS.health}`)
    break
  }
}
