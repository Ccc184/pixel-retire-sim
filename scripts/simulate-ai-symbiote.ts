/**
 * AI共生者路径 · 黑盒模拟测试
 *
 * 基于 simulate-paths.ts，专注AI共生者路径，增强追踪：
 * 1. AI技能成长曲线（aiSkill/promptMastery/aiTraining + aiSkillLevel）
 * 2. 三个专属十字路口触发情况
 * 3. 哲学事件触发情况
 * 4. 分支选择（tech_expert/ai_startup/ai_evangelist）
 * 5. 叙事质量：休养生息频率、事件空档
 */

// Node 环境下 polyfill localStorage 和 window
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
import { canAllIn, getPathSideIncome, getPath } from '../src/data/retirement-paths.js'

// 初始化 Pinia
setActivePinia(createPinia())

interface YearData {
  age: number
  faith: number
  stress: number
  health: number
  happiness: number
  savings: number
  salary: number
  sideIncome: number
  aiSkill: number
  promptMastery: number
  aiTraining: number
  aiSkillLevel: number
  selfAwareness: number
  isAllInPath: boolean
  canAllInNow: boolean
  branch: string
  eventId: string | null
  eventTitle: string | null
  crossroadId: string | null
  crossroadTitle: string | null
}

interface SimResult {
  pathId: string
  pathName: string
  branch: string | null
  allInAge: number | null
  allInReason: string | null
  allInFaith: number | null
  allInSideIncome: number | null
  allInSalary: number | null
  retireAge: number | null
  ending: string | null
  maxFaith: number
  minFaith: number
  maxStress: number
  minHealth: number
  finalSavings: number
  finalSalary: number
  finalSideIncome: number
  finalAiSkill: number
  crossroadsTriggered: string[]
  philosophyEventsTriggered: string[]
  events: Array<{ age: number; type: string; id: string; title: string; chosenOption: string; narrativePreview?: string }>
  issues: string[]
  yearData: YearData[]
  consecutiveRestYears: number
  maxConsecutiveRest: number
}

function simulatePath(): SimResult {
  const store = useGameStore()
  store.resetGame()

  // 开局：选择中坚大后方城市，传统私企，月薪8000
  store.startNewGame()
  store.setupGame('中坚大后方', '传统私企', 8000, 5000000, 'INTJ')
  store.selectRetirementPath('ai_symbiote')

  const result: SimResult = {
    pathId: 'ai_symbiote',
    pathName: getPath('ai_symbiote')?.name || 'AI共生者',
    branch: null,
    allInAge: null,
    allInReason: null,
    allInFaith: null,
    allInSideIncome: null,
    allInSalary: null,
    retireAge: null,
    ending: null,
    maxFaith: 0,
    minFaith: 100,
    maxStress: 0,
    minHealth: 100,
    finalSavings: 0,
    finalSalary: 0,
    finalSideIncome: 0,
    finalAiSkill: 0,
    crossroadsTriggered: [],
    philosophyEventsTriggered: [],
    events: [],
    issues: [],
    yearData: [],
    consecutiveRestYears: 0,
    maxConsecutiveRest: 0,
  }

  for (let age = 22; age <= 65; age++) {
    const s = store.state
    const canAllInNow = canAllIn(s)
    const sideInc = getPathSideIncome(s)
    const skills = s.pathSkills || {}

    // === 步骤1：处理十字路口 ===
    const crossroad = store.currentCrossroad
    if (crossroad && crossroad.options && crossroad.options.length > 0) {
      result.crossroadsTriggered.push(crossroad.id)
      // 理性玩家策略
      let bestOption = crossroad.options[0]
      let bestScore = -999
      for (const opt of crossroad.options) {
        let score = 0
        if (opt.hintColor === 'positive') score += 10
        if (opt.hintColor === 'danger' && s.stress > 75) score -= 15
        if (opt.label?.includes('All In') || opt.label?.includes('加大')) score += 5
        if (score > bestScore) {
          bestScore = score
          bestOption = opt
        }
      }
      store.selectCrossroadOption(bestOption.id)
      result.events.push({
        age,
        type: 'crossroad',
        id: crossroad.id,
        title: crossroad.title,
        chosenOption: bestOption.label || '未知选项',
      })
      result.consecutiveRestYears = 0
    }

    // === 步骤2：处理叙事事件 ===
    const event = store.currentNarrativeEvent
    if (event && event.options && event.options.length > 0) {
      // 记录哲学事件
      if (event.id?.startsWith('phil_')) {
        result.philosophyEventsTriggered.push(event.id)
      }

      // 如果是 All In 事件且可以 All In
      if (canAllInNow && event.id?.startsWith('allin_') && !s.isAllInPath) {
        const allInOption = event.options.find(o => o.id === 'all_in')
        if (allInOption) {
          store.selectNarrativeOption(allInOption.id)
          result.events.push({
            age,
            type: 'allin',
            id: event.id,
            title: event.title,
            chosenOption: allInOption.label,
            narrativePreview: event.narrative?.substring(0, 80),
          })
          result.consecutiveRestYears = 0
        }
      } else {
        // 理性选择：技能优先，高压休息
        let bestOption = event.options[0]
        let bestScore = -999
        for (const opt of event.options) {
          let score = 0
          if (opt.skillGains) {
            score += Object.values(opt.skillGains).reduce((a, b) => a + b, 0) * 2
          }
          if (opt.isRestOption && s.stress > 75) score += 30
          if (s.stress > 85 && opt.hintColor === 'danger') score -= 20
          if (opt.hintColor === 'positive') score += 5
          // 偏好增加信念的选项
          if (opt.hint?.includes('信念')) score += 3
          if (score > bestScore) {
            bestScore = score
            bestOption = opt
          }
        }
        store.selectNarrativeOption(bestOption.id)
        result.events.push({
          age,
          type: event.id?.startsWith('phil_') ? 'philosophy' : 'narrative',
          id: event.id,
          title: event.title,
          chosenOption: bestOption.label || '未知选项',
          narrativePreview: event.narrative?.substring(0, 100),
        })
        result.consecutiveRestYears = 0
      }
    } else if (!crossroad) {
      result.consecutiveRestYears++
      result.maxConsecutiveRest = Math.max(result.maxConsecutiveRest, result.consecutiveRestYears)
    }

    // 记录 All In 首次可触发
    if (canAllInNow && !result.allInAge && !s.isAllInPath) {
      result.allInAge = age
      result.allInFaith = s.pathFaith
      result.allInSideIncome = sideInc
      result.allInSalary = s.currentMonthlySalary
      if (s.pathFaith >= 90) result.allInReason = '信念>=90'
      else if (s.currentMonthlySalary > 0 && sideInc >= s.currentMonthlySalary * 1.2) result.allInReason = '副业>=主业1.2x'
      else result.allInReason = '其他条件'
    }

    result.maxFaith = Math.max(result.maxFaith, s.pathFaith)
    result.minFaith = Math.min(result.minFaith, s.pathFaith)
    result.maxStress = Math.max(result.maxStress, s.stress)
    result.minHealth = Math.min(result.minHealth, s.health)

    // 提交年度
    store.commitYear()

    // 记录年度数据
    const postS = store.state
    result.yearData.push({
      age,
      faith: postS.pathFaith,
      stress: postS.stress,
      health: postS.health,
      happiness: postS.happiness,
      savings: postS.currentSavings,
      salary: postS.currentMonthlySalary,
      sideIncome: getPathSideIncome(postS),
      aiSkill: skills.aiSkill || 0,
      promptMastery: skills.promptMastery || 0,
      aiTraining: skills.aiTraining || 0,
      aiSkillLevel: (postS as any).aiSkillLevel || 0,
      selfAwareness: skills.selfAwareness || 0,
      isAllInPath: postS.isAllInPath,
      canAllInNow: canAllIn(postS),
      branch: (postS as any).narrativeBranch || 'unassigned',
      eventId: event?.id || null,
      eventTitle: event?.title || null,
      crossroadId: crossroad?.id || null,
      crossroadTitle: crossroad?.title || null,
    })

    // 更新分支信息（修复：'unassigned'也应视为未设置）
    const branchVal = (postS as any).narrativeBranch
    if ((!result.branch || result.branch === 'unassigned') && branchVal && branchVal !== 'unassigned') {
      result.branch = branchVal
    }

    // 检查结局
    if (postS.endingTriggered) {
      result.ending = String((postS as any).currentEndingId || postS.endingTriggered)
      result.retireAge = age
      break
    }
    if (postS.currentSavings < -300000) {
      result.ending = 'bankrupt'
      result.retireAge = age
      break
    }
    if (postS.health < 20) {
      result.ending = 'health_critical'
      result.retireAge = age
      break
    }
  }

  // 最终状态
  const finalState = store.state
  result.finalSavings = finalState.currentSavings
  result.finalSalary = finalState.currentMonthlySalary
  result.finalSideIncome = getPathSideIncome(finalState)
  result.finalAiSkill = (finalState.pathSkills?.aiSkill || 0) + ((finalState as any).aiSkillLevel || 0)

  // === 问题检测 ===
  // 1. All In 过早
  if (result.allInAge && result.allInAge < 27) {
    result.issues.push(`All In 触发过早: ${result.allInAge}岁 (应>=27岁)`)
  }
  // 2. 从未触发 All In
  if (!result.allInAge && !result.ending?.includes('success')) {
    result.issues.push('65岁前从未触发 All In 条件')
  }
  // 3. 压力失控
  if (result.maxStress >= 100) {
    result.issues.push(`压力曾达100 (压力失控)`)
  }
  // 4. 健康濒死
  if (result.minHealth < 20) {
    result.issues.push(`健康曾低于20 (健康濒死)`)
  }
  // 5. 连续休养生息
  if (result.maxConsecutiveRest >= 3) {
    result.issues.push(`最长连续${result.maxConsecutiveRest}年休养生息 (事件密度不足)`)
  }
  // 6. 无结局
  if (!result.ending && !result.retireAge) {
    result.issues.push('65岁未触发任何结局')
  }
  // 7. 信念值从未达到90
  if (result.maxFaith < 90) {
    result.issues.push(`信念值最高仅${result.maxFaith} (从未达到90的All In阈值)`)
  }
  // 8. 三个专属十字路口是否都触发
  const expectedCrossroads = ['ai_skill_devaluation', 'ai_all_in_product', 'ai_ethics_dilemma']
  for (const expected of expectedCrossroads) {
    if (!result.crossroadsTriggered.some(c => c === expected)) {
      result.issues.push(`专属十字路口未触发: ${expected}`)
    }
  }
  // 9. 技能成长是否足够
  if (result.finalAiSkill < 50) {
    result.issues.push(`最终AI技能仅${result.finalAiSkill} (突破事件需>=50)`)
  }
  // 10. 退休判定
  if (result.ending?.includes('failure')) {
    result.issues.push(`路径失败结局: ${result.ending}`)
  }

  return result
}

// ==================== 运行模拟 ====================
console.log('='.repeat(80))
console.log('  AI共生者路径 · 黑盒模拟测试')
console.log('  模拟条件: 中坚大后方/传统私企/月薪8000/INTJ/目标60岁退休500万')
console.log('='.repeat(80))

const result = simulatePath()

console.log('\n' + '-'.repeat(70))
console.log('\n[Basic Info]')
console.log('  Branch: ' + (result.branch || 'not selected'))
const allInStr = result.allInAge ? result.allInAge + ' years old' : 'not triggered'
const allInReasonStr = result.allInReason ? ' (' + result.allInReason + ')' : ''
console.log('  AllIn trigger: ' + allInStr + allInReasonStr)
console.log('  AllIn faith: ' + (result.allInFaith ?? 'N/A'))
console.log('  AllIn side income: ' + (result.allInSideIncome?.toLocaleString() ?? 'N/A'))
console.log('  AllIn salary: ' + (result.allInSalary?.toLocaleString() ?? 'N/A'))
console.log('  Ending: ' + (result.ending || 'none') + (result.retireAge ? ' (' + result.retireAge + ')' : ''))

console.log('\n【数值范围】')
console.log(`  信念值: ${result.minFaith} ~ ${result.maxFaith}`)
console.log(`  压力峰值: ${result.maxStress}`)
console.log(`  健康最低: ${result.minHealth}`)
console.log(`  最终存款: ¥${result.finalSavings.toLocaleString()}`)
console.log(`  最终月薪: ¥${result.finalSalary.toLocaleString()}`)
console.log(`  最终副业: ¥${result.finalSideIncome.toLocaleString()}/月`)
console.log(`  最终AI技能: ${result.finalAiSkill} (aiSkill+aiSkillLevel)`)

console.log('\n【十字路口触发】')
const expectedCrossroads = ['ai_skill_devaluation', 'ai_all_in_product', 'ai_ethics_dilemma']
for (const expected of expectedCrossroads) {
  const triggered = result.crossroadsTriggered.find(c => c === expected)
  console.log(`  ${expected}: ${triggered ? '✅ 已触发' : '❌ 未触发'}`)
}
if (result.crossroadsTriggered.length > expectedCrossroads.length) {
  const extra = result.crossroadsTriggered.filter(c => !expectedCrossroads.includes(c))
  console.log(`  额外触发: ${extra.join(', ')}`)
}

console.log('\n【哲学事件触发】')
if (result.philosophyEventsTriggered.length > 0) {
  for (const pid of result.philosophyEventsTriggered) {
    console.log(`  ✅ ${pid}`)
  }
} else {
  console.log('  ❌ 未触发任何哲学事件')
}

console.log('\n【事件密度】')
console.log(`  总事件数: ${result.events.length}`)
console.log(`  最长连续休养生息: ${result.maxConsecutiveRest}年`)

// 信念值和压力曲线
console.log('\n【年度曲线】')
console.log('  年龄 | 信念 | 压力 | 健康 | 存款(万) | 月薪 | 副业 | AI技能 | 事件')
console.log('  ' + '─'.repeat(90))
for (const y of result.yearData) {
  const savingsWan = (y.savings / 10000).toFixed(1)
  const aiSkill = y.aiSkill + y.aiSkillLevel
  const evShort = y.eventId ? y.eventId.substring(0, 20) : (y.crossroadId ? `[C]${y.crossroadId.substring(0, 18)}` : '休养生息')
  console.log(`  ${y.age}岁 | ${String(y.faith).padStart(3)} | ${String(y.stress).padStart(3)} | ${String(y.health).padStart(3)} | ${savingsWan.padStart(7)} | ${String(Math.round(y.salary/100)/10).padStart(5)}k | ${String(Math.round(y.sideIncome/100)/10).padStart(5)}k | ${String(aiSkill).padStart(3)} | ${evShort}`)
}

// 事件详情
console.log('\n【事件详情】')
for (const ev of result.events) {
  console.log(`\n  ${ev.age}岁 [${ev.type}] ${ev.title}`)
  console.log(`    选项: ${ev.chosenOption}`)
  if (ev.narrativePreview) {
    console.log(`    预览: ${ev.narrativePreview}...`)
  }
}

// 问题汇总
console.log('\n' + '─'.repeat(70))
console.log('\n【问题诊断】')
if (result.issues.length > 0) {
  for (let i = 0; i < result.issues.length; i++) {
    console.log(`  ${i + 1}. ${result.issues[i]}`)
  }
} else {
  console.log('  ✅ 未发现明显问题')
}

// ==================== 深度诊断：十字路口为何未触发 ====================
console.log('\n' + '═'.repeat(70))
console.log('  深度诊断：三个专属十字路口为何全部未触发')
console.log('═'.repeat(70))

const aiCrossroads = [
  { id: 'ai_skill_devaluation', name: '跃迁之殇', ageRange: [27, 30], condition: '!isAllInPath' },
  { id: 'ai_all_in_product', name: '造物主的诱惑', ageRange: [31, 34], condition: '!isAllInPath' },
  { id: 'ai_ethics_dilemma', name: '对齐的代价', ageRange: [34, 37], condition: '!isAllInPath' },
]

for (const cr of aiCrossroads) {
  console.log(`\n  ■ ${cr.name} (${cr.id})`)
  console.log(`    ageRange: ${cr.ageRange[0]}-${cr.ageRange[1]}岁, 条件: ${cr.condition}`)
  console.log(`    All In触发年龄: ${result.allInAge}岁`)
  
  // 检查每年是否有机会触发
  for (let age = cr.ageRange[0]; age <= cr.ageRange[1]; age++) {
    const yd = result.yearData.find(y => y.age === age)
    if (!yd) continue
    const blockedByAllIn = yd.isAllInPath
    const hadCrossroad = yd.crossroadId !== null
    const hadEvent = yd.eventId !== null
    let status = ''
    if (blockedByAllIn) status = '❌ 已All In, !isAllInPath条件不满足'
    else if (hadCrossroad) status = `⚠️ 触发了其他十字路口: ${yd.crossroadId}`
    else if (hadEvent) status = `⚠️ 触发了叙事事件: ${yd.eventId}`
    else status = '⚠️ 休养生息年(无事件)'
    console.log(`    ${age}岁: ${status}`)
  }
}

// ==================== 深度诊断：哲学事件为何未触发 ====================
console.log('\n' + '═'.repeat(70))
console.log('  深度诊断：哲学事件为何全部未触发')
console.log('═'.repeat(70))

const philEvents = [
  { id: 'phil_soul_ai', name: '图灵之问', ageRange: [30, 40], priority: 6, condSkill: 30 },
  { id: 'phil_time_30', name: '三十', ageRange: [30, 30], priority: 6, condSkill: 0 },
  { id: 'phil_time_echo', name: '时间回响', ageRange: [33, 45], priority: 6, condSkill: 0 },
]

for (const pe of philEvents) {
  console.log(`\n  ■ ${pe.name} (${pe.id})`)
  console.log(`    ageRange: ${pe.ageRange[0]}-${pe.ageRange[1]}岁, priority: ${pe.priority}`)
  
  for (let age = pe.ageRange[0]; age <= Math.min(pe.ageRange[1], 43); age++) {
    const yd = result.yearData.find(y => y.age === age)
    if (!yd) continue
    const aiSkill = yd.aiSkill + yd.aiSkillLevel
    const skillMet = aiSkill >= pe.condSkill
    const hadEvent = yd.eventId !== null
    let status = ''
    if (!skillMet) status = `❌ 技能不足 (aiSkill=${aiSkill}, 需>=${pe.condSkill})`
    else if (hadEvent) status = `⚠️ 被更高优先级事件抢占: ${yd.eventId} (该年AI技能=${aiSkill})`
    else status = `⚠️ 休养生息 (aiSkill=${aiSkill})`
    console.log(`    ${age}岁: ${status}`)
  }
}

// ==================== 分支追踪 ====================
console.log('\n' + '═'.repeat(70))
console.log('  分支选择追踪')
console.log('═'.repeat(70))
for (const yd of result.yearData) {
  if (yd.branch !== 'unassigned') {
    console.log(`  ${yd.age}岁: branch = ${yd.branch}`)
    break
  }
}
const branchSet = result.yearData.find(y => y.branch !== 'unassigned')
if (!branchSet) {
  console.log('  ❌ 分支始终为 unassigned — branchSwitch 未生效')
  // 检查25岁事件
  const age25 = result.yearData.find(y => y.age === 25)
  if (age25) {
    console.log(`  25岁事件: ${age25.eventId}`)
    console.log(`  25岁后branch: ${age25.branch}`)
  }
}

// ==================== 信念值增长分析 ====================
console.log('\n' + '═'.repeat(70))
console.log('  信念值增长分析（为何29岁就达到All In阈值）')
console.log('═'.repeat(70))
console.log('  年龄 | 信念 | 年增量 | 来源')
console.log('  ' + '─'.repeat(60))
let prevFaith = 40
for (const yd of result.yearData) {
  const delta = yd.faith - prevFaith
  const source = yd.eventId || (yd.crossroadId ? `[C]${yd.crossroadId}` : '休养生息/漂移')
  if (delta !== 0 || yd.age <= 30) {
    console.log(`  ${yd.age}岁 | ${String(yd.faith).padStart(3)} | ${delta >= 0 ? '+' : ''}${String(delta).padStart(3)} | ${source}`)
  }
  prevFaith = yd.faith
}

// ==================== 财务增长分析 ====================
console.log('\n' + '═'.repeat(70))
console.log('  财务增长分析（为何43岁就达成500万目标）')
console.log('═'.repeat(70))
console.log('  年龄 | 存款(万) | 年增(万) | 月薪 | 事件')
console.log('  ' + '─'.repeat(70))
let prevSavings = 0
for (const yd of result.yearData) {
  const delta = yd.savings - prevSavings
  const ev = yd.eventId || yd.crossroadId || '—'
  console.log(`  ${yd.age}岁 | ${(yd.savings/10000).toFixed(1).padStart(7)} | ${(delta/10000).toFixed(1).padStart(6)} | ${String(Math.round(yd.salary/100)/10).padStart(5)}k | ${ev.substring(0, 25)}`)
  prevSavings = yd.savings
}

console.log('\n' + '='.repeat(80))
console.log('  模拟结束')
console.log('='.repeat(80))
