/**
 * AI共生者路径 · 玩家视角黑箱体验
 *
 * 不再追求"最优策略"，而是模拟真实玩家的决策过程：
 * - 根据叙事内容做选择（而非数值最优）
 * - 不同"人格"的玩家会做出不同选择
 * - 关注叙事连贯性、选择合理性、数值平衡、情感体验
 * - 记录每个事件的完整文本和选择理由
 */

// Node 环境下 polyfill
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

setActivePinia(createPinia())

// ====== 玩家人格定义 ======
interface PlayerPersona {
  name: string
  desc: string
  // 选择策略：根据事件文本和选项来决定
  chooseOption: (event: any, state: any) => number // 返回选项索引
}

const personas: PlayerPersona[] = [
  {
    name: '理性奋斗逼',
    desc: '优先选技能成长和收入，能扛压力，坚信"年轻就要拼"',
    chooseOption: (event, state) => {
      const opts = event.options || []
      let best = 0, bestScore = -999
      opts.forEach((opt: any, i: number) => {
        let score = 0
        // 技能优先
        if (opt.skillGains) {
          const total = Object.values(opt.skillGains).reduce((a: number, b: any) => a + b, 0)
          score += total * 1.5
        }
        // 收入正相关
        if (opt.savingsChange && opt.savingsChange > 0) score += 3
        // 信念正相关
        if (opt.hint?.includes('信念')) score += 2
        // 高压时回避danger
        if (state.stress > 80 && opt.hintColor === 'danger') score -= 8
        // 偏好positive
        if (opt.hintColor === 'positive') score += 2
        if (score > bestScore) { bestScore = score; best = i }
      })
      return best
    },
  },
  {
    name: '佛系生活家',
    desc: '优先选减压和健康，不追求极致，"活着就好"',
    chooseOption: (event, state) => {
      const opts = event.options || []
      let best = 0, bestScore = -999
      opts.forEach((opt: any, i: number) => {
        let score = 0
        // 减压优先
        if (opt.hint?.includes('压力-') || opt.hint?.includes('压力 −')) score += 8
        if (opt.hint?.includes('健康+')) score += 6
        if (opt.hint?.includes('幸福+')) score += 5
        // 回避高压选项
        if (opt.hint?.includes('压力+') || opt.hint?.includes('压力 +')) score -= 6
        if (opt.hint?.includes('健康-')) score -= 5
        // danger 选项永远扣分（不论压力高低，佛系玩家天生回避风险）
        if (opt.hintColor === 'danger') score -= 8
        if (opt.hintColor === 'danger' && state.stress > 60) score -= 5
        // positive 和 neutral 比 negative 更好
        if (opt.hintColor === 'positive') score += 3
        if (opt.hintColor === 'neutral') score += 1
        // 包含"安全""稳定""保守"关键词加分
        if (opt.label?.includes('安全') || opt.label?.includes('稳定') || opt.label?.includes('保守')) score += 4
        if (opt.description?.includes('安全') || opt.description?.includes('稳定')) score += 2
        // 包含"辞职""All in""赌"关键词扣分
        if (opt.label?.includes('辞职') || opt.label?.includes('All in') || opt.label?.includes('赌')) score -= 6
        // 休息选项加分
        if (opt.isRestOption) score += 5
        if (score > bestScore) { bestScore = score; best = i }
      })
      return best
    },
  },
  {
    name: '冒险赌徒',
    desc: '偏好高风险高回报，"不入虎穴焉得虎子"',
    chooseOption: (event, state) => {
      const opts = event.options || []
      let best = 0, bestScore = -999
      opts.forEach((opt: any, i: number) => {
        let score = 0
        if (opt.hintColor === 'danger') score += 8
        if (opt.savingsChange && opt.savingsChange > 0) score += 4
        if (opt.skillGains) {
          const total = Object.values(opt.skillGains).reduce((a: number, b: any) => a + b, 0)
          score += total
        }
        if (opt.hint?.includes('信念+')) score += 4
        // All In 选项优先
        if (opt.label?.includes('All In') || opt.label?.includes('辞职') || opt.label?.includes('破釜')) score += 10
        if (score > bestScore) { bestScore = score; best = i }
      })
      return best
    },
  },
]

// ====== 游玩日志结构 ======
interface PlayLog {
  age: number
  phase: 'narrative' | 'crossroad' | 'allin' | 'rest' | 'settlement'
  eventId: string
  eventTitle: string
  narrativePreview: string
  chosenOption: string
  chosenReason: string
  hintShown: string
  stateAfter: {
    faith: number
    stress: number
    health: number
    happiness: number
    savings: number
    salary: number
    sideIncome: number
    aiSkill: number
    isAllIn: boolean
    isUnemployed: boolean
    branch: string
  }
}

interface PlaythroughResult {
  persona: string
  personaDesc: string
  setup: { city: string; profession: string; salary: number; mbti: string }
  logs: PlayLog[]
  ending: string | null
  retireAge: number | null
  issues: { severity: 'P0' | 'P1' | 'P2'; category: string; description: string; age?: number; eventId?: string }[]
  // 体验维度评分
  experience: {
    narrativeCoherence: number // 叙事连贯性 1-10
    choiceMeaningful: number // 选择有意义的程度
    difficultyBalance: number // 难度平衡
    emotionalEngagement: number // 情感投入
    pacing: number // 节奏
    endingSatisfaction: number // 结局满意度
  }
  stats: {
    allInAge: number | null
    maxStress: number
    minHealth: number
    maxFaith: number
    minFaith: number
    restYears: number
    totalEvents: number
    crossroadsTriggered: number
    finalSavings: number
    finalSalary: number
    finalAiSkill: number
  }
}

function runPlaythrough(persona: PlayerPersona, setup: { city: string; profession: string; salary: number; mbti: string }): PlaythroughResult {
  const store = useGameStore()
  store.resetGame()
  store.startNewGame()
  store.setupGame(setup.city, setup.profession, setup.salary, 5000000, setup.mbti as any)
  store.selectRetirementPath('ai_symbiote')

  const result: PlaythroughResult = {
    persona: persona.name,
    personaDesc: persona.desc,
    setup,
    logs: [],
    ending: null,
    retireAge: null,
    issues: [],
    experience: {
      narrativeCoherence: 7,
      choiceMeaningful: 7,
      difficultyBalance: 7,
      emotionalEngagement: 7,
      pacing: 7,
      endingSatisfaction: 7,
    },
    stats: {
      allInAge: null,
      maxStress: 0,
      minHealth: 100,
      maxFaith: 0,
      minFaith: 100,
      restYears: 0,
      totalEvents: 0,
      crossroadsTriggered: 0,
      finalSavings: 0,
      finalSalary: 0,
      finalAiSkill: 0,
    },
  }

  let prevFaith = 40
  let prevStress = store.state.stress
  let consecutiveRest = 0
  let lastEventTitle = ''

  for (let age = 22; age <= 65; age++) {
    const s = store.state

    // === 步骤1: 处理十字路口 ===
    const crossroad = store.currentCrossroad
    if (crossroad && crossroad.options && crossroad.options.length > 0) {
      result.stats.crossroadsTriggered++
      const choiceIdx = persona.chooseOption(crossroad, s)
      const opt = crossroad.options[choiceIdx] || crossroad.options[0]
      store.selectCrossroadOption(opt.id)

      const skills = s.pathSkills || {}
      result.logs.push({
        age,
        phase: 'crossroad',
        eventId: crossroad.id,
        eventTitle: crossroad.title,
        narrativePreview: (crossroad.narrative || '').substring(0, 150),
        chosenOption: opt.label || '',
        chosenReason: `[${persona.name}]自动选择`,
        hintShown: opt.hint || '',
        stateAfter: {
          faith: s.pathFaith, stress: s.stress, health: s.health, happiness: s.happiness,
          savings: s.currentSavings, salary: s.currentMonthlySalary,
          sideIncome: getPathSideIncome(s), aiSkill: (skills.aiSkill || 0) + ((s as any).aiSkillLevel || 0),
          isAllIn: s.isAllInPath, isUnemployed: s.isUnemployed, branch: (s as any).narrativeBranch || 'unassigned',
        },
      })
      consecutiveRest = 0
      lastEventTitle = crossroad.title
      // 同步基准值，防止跨事件误报暴涨
      prevFaith = s.pathFaith
      prevStress = s.stress
    }

    // === 步骤2: 处理叙事事件 ===
    const event = store.currentNarrativeEvent
    if (event && event.options && event.options.length > 0) {
      const choiceIdx = persona.chooseOption(event, s)
      const opt = event.options[choiceIdx] || event.options[0]
      store.selectNarrativeOption(opt.id)

      const skills = s.pathSkills || {}
      const isAllInEvent = event.id?.startsWith('allin_')
      const phase: PlayLog['phase'] = isAllInEvent ? 'allin' : (event.id?.startsWith('phil_') ? 'narrative' : 'narrative')

      result.logs.push({
        age,
        phase,
        eventId: event.id || '',
        eventTitle: event.title,
        narrativePreview: (event.narrative || '').substring(0, 200),
        chosenOption: opt.label || '',
        chosenReason: `[${persona.name}]自动选择`,
        hintShown: opt.hint || '',
        stateAfter: {
          faith: s.pathFaith, stress: s.stress, health: s.health, happiness: s.happiness,
          savings: s.currentSavings, salary: s.currentMonthlySalary,
          sideIncome: getPathSideIncome(s), aiSkill: (skills.aiSkill || 0) + ((s as any).aiSkillLevel || 0),
          isAllIn: s.isAllInPath, isUnemployed: s.isUnemployed, branch: (s as any).narrativeBranch || 'unassigned',
        },
      })
      result.stats.totalEvents++
      consecutiveRest = 0
      lastEventTitle = event.title

      // === 问题检测 ===
      // 1. 信念值暴涨
      const faithGain = s.pathFaith - prevFaith
      if (faithGain > 15) {
        result.issues.push({
          severity: 'P1', category: '数值平衡',
          description: `信念值单年暴涨 ${faithGain}（${prevFaith}→${s.pathFaith}），事件: ${event.title}`,
          age, eventId: event.id,
        })
      }
      // 2. 压力暴涨
      const stressGain = s.stress - prevStress
      if (stressGain > 20) {
        result.issues.push({
          severity: 'P1', category: '数值平衡',
          description: `压力单年暴涨 ${stressGain}（${prevStress}→${s.stress}），事件: ${event.title}`,
          age, eventId: event.id,
        })
      }
      // 3. 叙事矛盾：副业阶段出现辞职/全职描述
      // 排除"没辞职""不辞职"等否定语境
      const logText = opt.log || ''
      const hasQuit = logText.includes('辞职') && !logText.includes('没辞职') && !logText.includes('不辞职')
      const hasFullTime = logText.includes('全职') && !logText.includes('没全职') && !logText.includes('不全职')
      if (!s.isAllInPath && (hasQuit || hasFullTime)) {
        // 允许 allin 事件本身含辞职
        if (!isAllInEvent) {
          result.issues.push({
            severity: 'P0', category: '叙事矛盾',
            description: `副业阶段出现辞职/全职描述，事件: ${event.title}，选项: ${opt.label}`,
            age, eventId: event.id,
          })
        }
      }
      // 4. All In 后仍出现"是否辞职"类选项
      if (s.isAllInPath && (opt.label?.includes('辞职') || opt.label?.includes('是否All In'))) {
        result.issues.push({
          severity: 'P0', category: '叙事矛盾',
          description: `All In 后仍出现"辞职/是否All In"选项，事件: ${event.title}`,
          age, eventId: event.id,
        })
      }
      // 5. 事件标题或叙事含"第X岁"但与当前年龄不符
      // 排除信件/回忆等叙事元素中提到的年龄（如"30岁打开"的信）
      // 排除引用他人年龄的语境（如"28岁的同事""23岁的实习生"）
      const ageMention = (event.narrative || '').match(/(\d+)岁/)
      if (ageMention && parseInt(ageMention[1]) !== age && Math.abs(parseInt(ageMention[1]) - age) > 2) {
        // 排除"X岁打开/写给/X岁时"等回忆/信件语境
        const ctx = (event.narrative || '').substring(
          Math.max(0, (event.narrative || '').indexOf(ageMention[0]) - 10),
          (event.narrative || '').indexOf(ageMention[0]) + 15
        )
        // 排除引用他人年龄的语境：同事/实习生/前辈/新人/朋友/小X等
        if (!/打开|写给|时|的信|那年|的同事|的实习|的前辈|的新人|的朋友|叫小|岁，/.test(ctx)) {
          result.issues.push({
            severity: 'P2', category: '年龄标记错乱',
            description: `事件叙事提到"${ageMention[1]}岁"但当前${age}岁，事件: ${event.title}`,
            age, eventId: event.id,
          })
        }
      }
      // 6. 失业状态下月薪仍>0
      if (s.isUnemployed && s.currentMonthlySalary > 0) {
        result.issues.push({
          severity: 'P1', category: '状态不一致',
          description: `失业状态但月薪=${s.currentMonthlySalary}，事件: ${event.title}`,
          age, eventId: event.id,
        })
      }
      // 7. All In 后副业收入为0（设计如此：All In后 getPathSideIncome 语义为"能力估值"，
      //    实际收入已合并进月薪，不再作为独立副业显示。跳过此检查。）

      prevFaith = s.pathFaith
      prevStress = s.stress
    } else if (!crossroad) {
      consecutiveRest++
      result.stats.restYears++
      result.logs.push({
        age,
        phase: 'rest',
        eventId: 'rest',
        eventTitle: '休养生息',
        narrativePreview: '',
        chosenOption: '无事件',
        chosenReason: '',
        hintShown: '',
        stateAfter: {
          faith: s.pathFaith, stress: s.stress, health: s.health, happiness: s.happiness,
          savings: s.currentSavings, salary: s.currentMonthlySalary,
          sideIncome: getPathSideIncome(s), aiSkill: (s.pathSkills?.aiSkill || 0) + ((s as any).aiSkillLevel || 0),
          isAllIn: s.isAllInPath, isUnemployed: s.isUnemployed, branch: (s as any).narrativeBranch || 'unassigned',
        },
      })
    }

    // 记录 All In 首次触发
    if (canAllIn(s) && !result.stats.allInAge && !s.isAllInPath) {
      result.stats.allInAge = age
    }

    result.stats.maxStress = Math.max(result.stats.maxStress, s.stress)
    result.stats.minHealth = Math.min(result.stats.minHealth, s.health)
    result.stats.maxFaith = Math.max(result.stats.maxFaith, s.pathFaith)
    result.stats.minFaith = Math.min(result.stats.minFaith, s.pathFaith)

    // 连续休养生息检测
    if (consecutiveRest >= 3) {
      result.issues.push({
        severity: 'P2', category: '事件密度',
        description: `连续${consecutiveRest}年休养生息（${age - consecutiveRest + 1}-${age}岁），事件密度不足`,
        age,
      })
    }

    // 提交年度
    store.commitYear()

    // 检查结局
    const postS = store.state
    if (postS.endingTriggered) {
      result.ending = String((postS as any).currentEndingId || postS.endingTriggered)
      result.retireAge = age
      break
    }
    if (postS.currentSavings < -300000) {
      result.ending = 'bankrupt'
      result.retireAge = age
      result.issues.push({ severity: 'P0', category: '破产', description: `存款跌破-30万，破产结局`, age })
      break
    }
    if (postS.health < 20) {
      result.ending = 'health_critical'
      result.retireAge = age
      result.issues.push({ severity: 'P0', category: '健康濒死', description: `健康低于20，健康结局`, age })
      break
    }
  }

  // 最终状态
  const finalState = store.state
  result.stats.finalSavings = finalState.currentSavings
  result.stats.finalSalary = finalState.currentMonthlySalary
  result.stats.finalAiSkill = (finalState.pathSkills?.aiSkill || 0) + ((finalState as any).aiSkillLevel || 0)

  // 全局问题检测
  if (!result.ending) {
    result.issues.push({ severity: 'P0', category: '无结局', description: '65岁未触发任何结局' })
  }
  if (result.stats.maxStress >= 100) {
    result.issues.push({ severity: 'P1', category: '压力失控', description: `压力曾达100` })
  }
  if (result.stats.minHealth < 20) {
    result.issues.push({ severity: 'P1', category: '健康濒死', description: `健康曾低于20` })
  }
  if (!result.stats.allInAge && !result.ending?.includes('success')) {
    result.issues.push({ severity: 'P1', category: 'All In未触发', description: '65岁前从未满足All In条件' })
  }
  if (result.stats.maxFaith < 90 && !result.ending?.includes('success')) {
    result.issues.push({ severity: 'P2', category: '信念不足', description: `信念最高仅${result.stats.maxFaith}，未达All In阈值` })
  }

  return result
}

// ====== 运行3种人格的游玩 ======
console.log('='.repeat(90))
console.log('  AI共生者路径 · 玩家视角黑箱体验')
console.log('  3种人格 × 同一开局（中坚大后方/传统私企/月薪8000/INTJ）')
console.log('='.repeat(90))

const setup = { city: '中坚大后方', profession: '传统私企', salary: 8000, mbti: 'INTJ' }
const allResults: PlaythroughResult[] = []

for (const persona of personas) {
  // 每种人格跑3次取代表性结果（选问题最多的那次）
  let bestRun: PlaythroughResult | null = null
  let maxIssues = -1
  for (let i = 0; i < 3; i++) {
    const r = runPlaythrough(persona, setup)
    if (r.issues.length > maxIssues) {
      maxIssues = r.issues.length
      bestRun = r
    }
  }
  if (bestRun) allResults.push(bestRun)
}

// ====== 输出报告 ======
for (const r of allResults) {
  console.log('\n' + '='.repeat(90))
  console.log(`  玩家: ${r.persona}`)
  console.log(`  策略: ${r.personaDesc}`)
  console.log(`  开局: ${r.setup.city}/${r.setup.profession}/¥${r.setup.salary}/月/${r.setup.mbti}`)
  console.log('='.repeat(90))

  console.log('\n【结局】')
  console.log(`  结局ID: ${r.ending || '无'}`)
  console.log(`  退休年龄: ${r.retireAge || '未触发'}`)
  console.log(`  All In年龄: ${r.stats.allInAge || '未触发'}`)

  console.log('\n【数值概览】')
  console.log(`  信念值: ${r.stats.minFaith} ~ ${r.stats.maxFaith}`)
  console.log(`  压力峰值: ${r.stats.maxStress}`)
  console.log(`  健康最低: ${r.stats.minHealth}`)
  console.log(`  最终存款: ¥${r.stats.finalSavings.toLocaleString()}`)
  console.log(`  最终月薪: ¥${r.stats.finalSalary.toLocaleString()}`)
  console.log(`  最终AI技能: ${r.stats.finalAiSkill}`)
  console.log(`  休养生息年数: ${r.stats.restYears}`)
  console.log(`  总事件数: ${r.stats.totalEvents}`)
  console.log(`  十字路口数: ${r.stats.crossroadsTriggered}`)

  console.log('\n【年度游玩日志】')
  console.log('  年龄 | 阶段 | 信念 | 压力 | 健康 | 存款(万) | 月薪 | 副业 | AI技能 | 事件')
  console.log('  ' + '─'.repeat(95))
  for (const log of r.logs) {
    const s = log.stateAfter
    const savingsWan = (s.savings / 10000).toFixed(1)
    const salaryK = String(Math.round(s.salary / 100) / 10).padStart(5)
    const sideK = String(Math.round(s.sideIncome / 100) / 10).padStart(5)
    const aiSkill = String(s.aiSkill).padStart(3)
    const phaseTag = log.phase === 'crossroad' ? '[C]' : log.phase === 'allin' ? '[A]' : log.phase === 'rest' ? '[R]' : '   '
    const evShort = log.eventId ? log.eventId.substring(0, 22) : ''
    const flags = [s.isAllIn ? 'AI' : '  ', s.isUnemployed ? '失业' : '  '].join('')
    console.log(`  ${log.age}岁 | ${phaseTag} | ${String(s.faith).padStart(3)} | ${String(s.stress).padStart(3)} | ${String(s.health).padStart(3)} | ${savingsWan.padStart(7)} | ${salaryK}k | ${sideK}k | ${aiSkill} | ${evShort} ${flags}`)
  }

  console.log('\n【问题列表】')
  if (r.issues.length === 0) {
    console.log('  ✅ 未发现问题')
  } else {
    for (const iss of r.issues) {
      console.log(`  [${iss.severity}] ${iss.category}: ${iss.description}${iss.age ? ` (${iss.age}岁)` : ''}${iss.eventId ? ` [${iss.eventId}]` : ''}`)
    }
  }
}

// ====== 汇总 ======
console.log('\n' + '='.repeat(90))
console.log('  汇总：3种人格的问题统计')
console.log('='.repeat(90))

const allIssues = allResults.flatMap(r => r.issues)
const issueMap = new Map<string, { count: number; severity: string; examples: string[] }>()
for (const iss of allIssues) {
  const key = `${iss.severity}:${iss.category}`
  if (!issueMap.has(key)) {
    issueMap.set(key, { count: 0, severity: iss.severity, examples: [] })
  }
  const entry = issueMap.get(key)!
  entry.count++
  if (entry.examples.length < 2) entry.examples.push(iss.description.substring(0, 60))
}

console.log('\n问题类型统计（跨3次游玩）:')
for (const [key, val] of [...issueMap.entries()].sort((a, b) => {
  const sevOrder = { P0: 0, P1: 1, P2: 2 }
  const aSev = a[0].split(':')[0] as keyof typeof sevOrder
  const bSev = b[0].split(':')[0] as keyof typeof sevOrder
  return sevOrder[aSev] - sevOrder[bSev]
})) {
  console.log(`  [${key}] ×${val.count}`)
  for (const ex of val.examples) {
    console.log(`    └ ${ex}...`)
  }
}

console.log('\n各人格结局:')
for (const r of allResults) {
  console.log(`  ${r.persona}: ${r.ending || '无结局'} (${r.retireAge || '-'}岁)`)
}

console.log('\n' + '='.repeat(90))
console.log('  体验结束')
console.log('='.repeat(90))
