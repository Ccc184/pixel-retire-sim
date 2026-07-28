/**
 * 单路径详细追踪 - 带debug数值
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

console.log(`\n========== DEBUG追踪: ${PATH_ID} ==========\n`)

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
    const pathCards = availableCards.filter((c: any) => c.pathId === PATH_ID)
    const generalCards = availableCards.filter((c: any) => !c.pathId)
    const cardsToSelect = [...pathCards, ...generalCards].slice(0, Math.random() < 0.5 ? 1 : 2)
    for (const card of cardsToSelect) {
      if (card.prerequisites && !card.prerequisites(s)) continue
      store.toggleCard(card.id)
    }
  }
  store.commitYear()
  const postS = store.state as any

  if (age >= 34 && age <= 50) {
    const extra: string[] = []
    if (postS.nomadClients) extra.push(`客户:${postS.nomadClients}`)
    if (postS.ipFollowers) extra.push(`粉:${(postS.ipFollowers/10000).toFixed(1)}万`)
    if (postS.ipReputation) extra.push(`声誉:${postS.ipReputation}`)
    if (postS.bioPortfolio) extra.push(`bio:${(postS.bioPortfolio/10000).toFixed(1)}万`)
    if (postS.silverMonthlyRevenue) extra.push(`月营收:${(postS.silverMonthlyRevenue/10000).toFixed(1)}万`)
    if (postS.silverBusiness?.reputation) extra.push(`养誉:${postS.silverBusiness.reputation}`)
    if (postS.chainHoldings) extra.push(`持仓:${(postS.chainHoldings/10000).toFixed(1)}万`)
    if (postS.isAllInPath) extra.push('AllIn')
    if (postS.hasCompany) extra.push('有公司')
    const annualExpense = postS.annualBaseCost + (postS.currentMortgageCost || 0)
    const mult = PATH_ID === 'digital_nomad' ? 0.5 : PATH_ID === 'super_ip' ? 0.9 : PATH_ID === 'bio_gambler' ? 0 : PATH_ID === 'chain_native' ? 15 : PATH_ID === 'silver_economy' ? 0 : 17
    const threshold = PATH_ID === 'bio_gambler' ? 2000000 : (mult > 0 ? annualExpense * mult : 0)
    const silverTarget = PATH_ID === 'silver_economy' ? 50000 : 0
    console.log(`${age}岁: 存款${(postS.currentSavings/10000).toFixed(0)}万 被动${(postS.passiveIncome/10000).toFixed(1)}万 年支出${(annualExpense/10000).toFixed(1)}万 ${mult>0?'阈值'+(threshold/10000).toFixed(1)+'万 ':''}信念${Math.round(postS.pathFaith)} 健康${Math.round(postS.health)} ${extra.join(' ')}`)
  }

  if (postS.endingTriggered) {
    console.log(`\n>>> 结局: ${postS.currentEndingId} @ ${age}岁`)
    console.log(`    canRetire=${postS.canRetire}, totalWealth=${postS.totalWealth}, targetWealth=${postS.targetWealth}`)
    break
  }
  if (postS.currentSavings < -500000 || postS.health < 15) {
    console.log(`\n>>> 破产/死亡 @ ${age}岁`)
    break
  }
}
