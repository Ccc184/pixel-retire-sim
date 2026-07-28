/**
 * 单步追踪bio All In时的bioPortfolio值
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
const store = useGameStore()
store.resetGame()
store.startNewGame()
store.setupGame('中坚大后方', '传统私企', 8000, 5000000, 'INTJ' as any)
store.selectRetirementPath('bio_gambler' as any)

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

for (let age = 22; age <= 65; age++) {
  const s = store.state as any
  const event = store.currentNarrativeEvent
  const eventTitle = event?.title || ''
  if (event && event.options && event.options.length > 0) {
    const preBio = s.bioPortfolio
    const idx = playerChoose(event, s)
    const opt = event.options[idx] || event.options[0]
    store.selectNarrativeOption(opt.id)
    const postBio = s.bioPortfolio
    if (eventTitle.includes('实验室') || eventTitle.includes('最后一趟车') || opt.id?.includes('all_in')) {
      console.log(`[${age}岁] 事件:${eventTitle} 选项:${opt.id} bio:${preBio}→${postBio} AllIn:${s.isAllInPath}`)
    }
  }
  const crossroad = store.currentCrossroad
  if (crossroad && crossroad.options && crossroad.options.length > 0) {
    const idx = playerChoose(crossroad, s)
    const opt = crossroad.options[idx] || crossroad.options[0]
    store.selectCrossroadOption(opt.id)
  }
  const availableCards = store.currentCards || []
  if (availableCards.length > 0) {
    const pathCards = availableCards.filter((c: any) => c.pathId === 'bio_gambler')
    const generalCards = availableCards.filter((c: any) => !c.pathId)
    const cardsToSelect = [...pathCards, ...generalCards].slice(0, Math.random() < 0.5 ? 1 : 2)
    for (const card of cardsToSelect) {
      if (card.prerequisites && !card.prerequisites(s)) continue
      store.toggleCard(card.id)
    }
  }
  store.commitYear()
  const postS = store.state as any
  if (postS.endingTriggered) {
    console.log(`>>> 结局: ${postS.currentEndingId} @ ${age}岁 bio:${postS.bioPortfolio}`)
    break
  }
}
