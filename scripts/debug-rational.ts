/**
 * 调试脚本：追踪理性奋斗逼的checkSuccess失败原因
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
import { getPath } from '../src/data/retirement-paths.js'
import { calculateTotalWealth } from '../src/utils/math-engine.js'

setActivePinia(createPinia())

const store = useGameStore()
store.resetGame()
store.startNewGame()
store.setupGame('中坚大后方', '传统私企', 8000, 5000000, 'INTJ' as any)
store.selectRetirementPath('ai_symbiote')

// 理性奋斗逼选择策略
function chooseOption(event: any, state: any): number {
  const opts = event.options || []
  let best = 0, bestScore = -999
  opts.forEach((opt: any, i: number) => {
    let score = 0
    if (opt.skillGains) {
      const total = Object.values(opt.skillGains).reduce((a: number, b: any) => a + b, 0)
      score += total * 1.5
    }
    if (opt.savingsChange && opt.savingsChange > 0) score += 3
    if (opt.hint?.includes('信念')) score += 2
    if (state.stress > 80 && opt.hintColor === 'danger') score -= 8
    if (opt.hintColor === 'positive') score += 2
    if (score > bestScore) { bestScore = score; best = i }
  })
  return best
}

console.log('年龄 | 信念 | 压力 | 健康 | 存款(万) | 月薪 | annualBaseCost | mortgage | passiveInc | totalWealth | checkSuccess | canRetire')
console.log('-'.repeat(150))

for (let age = 22; age <= 52; age++) {
  const s = store.state

  // 处理十字路口
  const crossroad = store.currentCrossroad
  if (crossroad && crossroad.options && crossroad.options.length > 0) {
    const choiceIdx = chooseOption(crossroad, s)
    const opt = crossroad.options[choiceIdx] || crossroad.options[0]
    store.selectCrossroadOption(opt.id)
  }

  // 处理叙事事件
  const event = store.currentNarrativeEvent
  if (event && event.options && event.options.length > 0) {
    const choiceIdx = chooseOption(event, s)
    const opt = event.options[choiceIdx] || event.options[0]
    store.selectNarrativeOption(opt.id)
  }

  // 记录commitYear前的状态
  const preState = store.state
  const path = getPath('ai_symbiote')!

  // 手动调用checkSuccess看结果
  const checkResult = path.checkSuccess(preState)
  const totalWealth = calculateTotalWealth(preState)

  console.log(
    `${String(age).padStart(3)} | ${String(preState.pathFaith).padStart(3)} | ${String(preState.stress).padStart(3)} | ${String(preState.health).padStart(3)} | ${String((preState.currentSavings / 10000).toFixed(1)).padStart(8)} | ${String(preState.currentMonthlySalary).padStart(6)} | ${String(Math.round(preState.annualBaseCost)).padStart(14)} | ${String(preState.currentMortgageCost || 0).padStart(8)} | ${String(preState.passiveIncome || 0).padStart(10)} | ${String(Math.round(totalWealth)).padStart(12)} | ${checkResult ? 'TRUE' : 'false'} | ${preState.canRetire ? 'YES' : 'no'}`
  )

  // 提交年度
  store.commitYear()

  // 检查结局
  const postS = store.state
  if (postS.endingTriggered) {
    console.log(`\n结局触发: ${postS.currentEndingId} (年龄${age})`)
    console.log(`  canRetire: ${postS.canRetire}`)
    console.log(`  pathEndgameTriggered: ${postS.pathEndgameTriggered}`)
    break
  }
}

// 打印最终状态详情
const finalS = store.state
console.log('\n=== 最终状态 ===')
console.log(`年龄: ${finalS.currentAge}`)
console.log(`存款: ¥${finalS.currentSavings.toLocaleString()}`)
console.log(`房产价值: ¥${(finalS.propertyValue || 0).toLocaleString()}`)
console.log(`被动收入: ¥${finalS.passiveIncome || 0}/月`)
console.log(`annualBaseCost: ¥${Math.round(finalS.annualBaseCost).toLocaleString()}`)
console.log(`mortgage: ¥${finalS.currentMortgageCost || 0}/年`)
console.log(`pathFaith: ${finalS.pathFaith}`)
console.log(`canRetire: ${finalS.canRetire}`)
console.log(`isAllInPath: ${finalS.isAllInPath}`)
console.log(`totalWealth: ¥${calculateTotalWealth(finalS).toLocaleString()}`)

const path = getPath('ai_symbiote')!
const annualExpense = finalS.annualBaseCost + (finalS.currentMortgageCost || 0)
console.log(`\n=== checkSuccess 分析 ===`)
console.log(`annualExpense (annualBaseCost + mortgage): ¥${annualExpense.toLocaleString()}`)
console.log(`annualExpense * 20: ¥${(annualExpense * 20).toLocaleString()}`)
console.log(`currentSavings: ¥${finalS.currentSavings.toLocaleString()}`)
console.log(`passiveIncome * 20: ¥${((finalS.passiveIncome || 0) * 20).toLocaleString()}`)
console.log(`checkSuccess wealth part: ${finalS.currentSavings + (finalS.passiveIncome || 0) * 20 >= annualExpense * 20}`)
console.log(`checkSuccess faith part: ${finalS.pathFaith >= 50}`)
console.log(`checkSuccess age part: ${finalS.currentAge >= 35}`)
console.log(`checkSuccess total: ${path.checkSuccess(finalS)}`)
