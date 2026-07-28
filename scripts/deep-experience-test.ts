/**
 * AI共生者路径 · 深度真实人生体验测试
 * 
 * 出发点：真实的人生
 * 检验维度：
 * 1. 人生阶段合理性（22岁入行→积累期→30岁迷茫→35岁危机→转型/稳定→退休）
 * 2. 收入增长曲线是否真实（真实人生中薪资增长不是线性的，有瓶颈、有断崖）
 * 3. 剧情事件是否符合年龄阶段（什么年龄遇到什么事）
 * 4. 副业收入是否真实（副业从0到1的过程是否合理）
 * 5. All In决策是否真实（辞职创业的风险感、时机感）
 * 6. 生活成本与储蓄是否真实（房租、医疗、父母养老等）
 */

// Node 环境 polyfill
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
import { getPathSideIncome, canAllIn } from '../src/data/retirement-paths.js'

setActivePinia(createPinia())

interface YearSnapshot {
  age: number
  salary: number
  sideIncome: number
  savings: number
  faith: number
  stress: number
  health: number
  happiness: number
  aiSkill: number
  isAllIn: boolean
  isUnemployed: boolean
  eventIds: string[]
  eventTitles: string[]
  salaryChangePct: number // 较上年薪资变化百分比
  savingsChangePct: number
}

interface RealismIssue {
  severity: 'P0' | 'P1' | 'P2'
  category: string
  age: number
  description: string
  whyUnreal: string // 为什么这在真实人生中不合理
}

function runDeepTest(personaName: string, chooseOption: (event: any, state: any) => number, setup: any) {
  const store = useGameStore()
  store.resetGame()
  store.startNewGame()
  store.setupGame(setup.city, setup.profession, setup.salary, 5000000, setup.mbti as any)
  store.selectRetirementPath('ai_symbiote')

  const snapshots: YearSnapshot[] = []
  const issues: RealismIssue[] = []
  const fullLogs: { age: number; type: string; title: string; log: string }[] = []

  for (let age = 22; age <= 65; age++) {
    const s = store.state
    const prevSnapshot = snapshots[snapshots.length - 1]

    // 记录年初状态
    const eventsThisYear: { id: string; title: string }[] = []

    // 处理十字路口
    const crossroad = store.currentCrossroad
    if (crossroad && crossroad.options && crossroad.options.length > 0) {
      eventsThisYear.push({ id: crossroad.id, title: crossroad.title || '' })
      const choiceIdx = chooseOption(crossroad, s)
      const opt = crossroad.options[choiceIdx] || crossroad.options[0]
      store.selectCrossroadOption(opt.id)
      fullLogs.push({ age, type: 'C', title: crossroad.title || '', log: opt.log || '' })
    }

    // 处理叙事事件
    const event = store.currentNarrativeEvent
    if (event && event.options && event.options.length > 0) {
      eventsThisYear.push({ id: event.id || '', title: event.title || '' })
      const choiceIdx = chooseOption(event, s)
      const opt = event.options[choiceIdx] || event.options[0]
      store.selectNarrativeOption(opt.id)
      fullLogs.push({ age, type: 'N', title: event.title || '', log: opt.log || '' })
    }

    // 提交年度
    store.commitYear()
    const postS = store.state

    // 记录年末快照
    const salary = postS.currentMonthlySalary
    const prevSalary = prevSnapshot?.salary || setup.salary
    const savings = postS.currentSavings
    const prevSavings = prevSnapshot?.savings || setup.salary * 6

    const snapshot: YearSnapshot = {
      age,
      salary,
      sideIncome: getPathSideIncome(postS),
      savings,
      faith: postS.pathFaith,
      stress: postS.stress,
      health: postS.health,
      happiness: postS.happiness,
      aiSkill: (postS.pathSkills?.aiSkill || 0) + ((postS as any).aiSkillLevel || 0),
      isAllIn: postS.isAllInPath,
      isUnemployed: postS.isUnemployed,
      eventIds: eventsThisYear.map(e => e.id),
      eventTitles: eventsThisYear.map(e => e.title),
      salaryChangePct: prevSalary > 0 ? ((salary - prevSalary) / prevSalary) * 100 : 0,
      savingsChangePct: prevSavings > 0 ? ((savings - prevSavings) / Math.abs(prevSavings)) * 100 : 0,
    }
    snapshots.push(snapshot)

    // === 真实人生问题检测 ===

    // 1. 薪资暴涨：单年涨幅>30%（真实人生中除非升职/跳槽，否则不会）
    if (snapshot.salaryChangePct > 30 && !snapshot.isAllIn && age > 23) {
      issues.push({
        severity: 'P1',
        category: '收入真实性',
        age,
        description: `薪资单年涨幅${snapshot.salaryChangePct.toFixed(1)}%（¥${prevSalary.toLocaleString()}→¥${salary.toLocaleString()}）`,
        whyUnreal: '真实人生中，除了升职、跳槽到更好公司或All In创业，正常调薪很少超过15-20%。30%+的年度涨幅在打工阶段不现实。'
      })
    }

    // 2. 薪资断崖：单年跌幅>40%（除了裁员/降薪事件，否则不合理）
    if (snapshot.salaryChangePct < -40 && !snapshot.isUnemployed && age > 25) {
      const hasLayoffEvent = eventsThisYear.some(e => e.id.includes('layoff') || e.id.includes('crisis'))
      if (!hasLayoffEvent) {
        issues.push({
          severity: 'P1',
          category: '收入真实性',
          age,
          description: `薪资单年跌幅${Math.abs(snapshot.salaryChangePct).toFixed(1)}%（¥${prevSalary.toLocaleString()}→¥${salary.toLocaleString()}）且无明确裁员/降薪事件`,
          whyUnreal: '真实人生中薪资不会无缘无故暴跌40%+。降薪需要有明确事件（裁员、行业危机、公司倒闭等）。'
        })
      }
    }

    // 3. 失业期间存款反而增长（失业应该消耗存款）
    if (snapshot.isUnemployed && snapshot.savingsChangePct > 10 && prevSavings > 0) {
      const hasWindfall = eventsThisYear.some(e => e.id.includes('windfall') || e.id.includes('borrow') || e.id.includes('scam'))
      if (!hasWindfall) {
        issues.push({
          severity: 'P1',
          category: '收支真实性',
          age,
          description: `失业状态下存款增长${snapshot.savingsChangePct.toFixed(1)}%（¥${prevSavings.toLocaleString()}→¥${savings.toLocaleString()}）`,
          whyUnreal: '失业意味着收入断流，即使有副业收入，也很难在失业状态下让存款增长。真实失业期应该消耗储蓄。'
        })
      }
    }

    // 4. 副业收入超过主业过早（25岁前副业>主业不现实）
    if (!snapshot.isAllIn && snapshot.sideIncome > salary * 0.8 && age < 27 && salary > 0) {
      issues.push({
        severity: 'P2',
        category: '副业真实性',
        age,
        description: `${age}岁副业收入¥${snapshot.sideIncome.toLocaleString()}接近主业¥${salary.toLocaleString()}`,
        whyUnreal: '真实人生中，副业需要时间积累。22岁毕业，25岁前副业能赚到零花钱（几百到一两千）就不错了，接近主业收入需要3-5年深耕。'
      })
    }

    // 5. 存款增速不合理：年储蓄>年薪的80%（存钱速度太快）
    const annualIncome = salary * 12
    const annualSavings = savings - prevSavings
    if (annualSavings > annualIncome * 0.8 && !snapshot.isUnemployed && age > 25 && prevSavings > 0) {
      issues.push({
        severity: 'P1',
        category: '储蓄真实性',
        age,
        description: `年度净储蓄¥${annualSavings.toLocaleString()}，是年薪¥${annualIncome.toLocaleString()}的${((annualSavings/annualIncome)*100).toFixed(0)}%`,
        whyUnreal: '真实人生中，即使极其节俭，扣除房租/房贷、吃饭、社交、医疗等开销，能存下收入的30-40%已经很不错了。存下80%+意味着几乎零消费，这不现实。'
      })
    }

    // 6. 健康急剧下降无事件支撑（健康1年掉15+）
    const healthDrop = (prevSnapshot?.health || 100) - snapshot.health
    if (healthDrop > 15 && age > 25) {
      const hasHealthEvent = eventsThisYear.some(e => 
        e.id.includes('health') || e.id.includes('illness') || e.id.includes('hospital') || e.id.includes('body')
      )
      if (!hasHealthEvent) {
        issues.push({
          severity: 'P2',
          category: '健康真实性',
          age,
          description: `健康1年内从${prevSnapshot?.health}降到${snapshot.health}（-${healthDrop}），无明确健康事件`,
          whyUnreal: '健康是缓慢变化的。除非突发疾病或重大事故，否则1年内健康掉15+需要有明确原因。'
        })
      }
    }

    // 7. All In时存款不足6个月生活费就辞职（风险不真实）
    if (snapshot.isAllIn && !prevSnapshot?.isAllIn) {
      const monthlyCost = Math.round(postS.annualBaseCost / 12)
      const runway = Math.round(savings / monthlyCost)
      if (runway < 6) {
        issues.push({
          severity: 'P2',
          category: 'All In真实性',
          age,
          description: `All In时存款仅够${runway}个月生活费（月支出约¥${monthlyCost.toLocaleString()}）`,
          whyUnreal: '真实人生中，辞职创业/自由职业通常会准备至少6-12个月的生活费作为安全垫。存款不够6个月就裸辞，风险极高，普通人不会这么做。'
        })
      }
    }

    // 8. 30岁前就All In（虽然可能，但比例很低）
    if (snapshot.isAllIn && !prevSnapshot?.isAllIn && age < 28) {
      issues.push({
        severity: 'P2',
        category: '人生阶段真实性',
        age,
        description: `${age}岁就All In辞职做AI自由职业`,
        whyUnreal: '真实人生中，毕业5年内All In的人有，但比例极低。大多数人需要5-8年积累客户、技能、口碑，30岁后All In更普遍。这不是"错"，但如果频繁触发就不真实。'
      })
    }

    // 检查结局
    if (postS.endingTriggered) {
      break
    }
    if (postS.currentSavings < -300000) {
      issues.push({ severity: 'P0', category: '破产', age, description: '存款跌破-30万破产', whyUnreal: '真实破产需要更长时间的财务恶化，不太可能在有工作的情况下迅速负债30万。' })
      break
    }
    if (postS.health < 20) {
      break
    }
  }

  // 全局分析
  const finalState = store.state
  const allInAge = snapshots.find(s => s.isAllIn)?.age
  const unemployCount = snapshots.filter(s => s.isUnemployed).length
  const avgSalaryGrowth = snapshots.slice(1).reduce((sum, s) => sum + s.salaryChangePct, 0) / Math.max(1, snapshots.length - 1)

  // 9. 最终财富分析：退休时存款是否合理
  const retireSnapshot = snapshots[snapshots.length - 1]
  const yearsWorked = retireSnapshot.age - 22
  const finalAnnualSalary = retireSnapshot.salary * 12
  const savingsMultiple = retireSnapshot.savings / Math.max(1, finalAnnualSalary)

  if (retireSnapshot.savings > finalAnnualSalary * 20 && yearsWorked < 35) {
    issues.push({
      severity: 'P1',
      category: '财富真实性',
      age: retireSnapshot.age,
      description: `工作${yearsWorked}年存款¥${retireSnapshot.savings.toLocaleString()}，是年薪${savingsMultiple.toFixed(1)}倍`,
      whyUnreal: `真实人生中，除非创业成功或抓住大机会，普通人工作30年能存下5-10倍年薪已经很不错。20倍年薪需要极高的储蓄率+投资回报，不是常态。`
    })
  }

  return {
    personaName,
    setup,
    snapshots,
    issues,
    fullLogs,
    summary: {
      ending: finalState.endingTriggered ? String((finalState as any).currentEndingId || finalState.endingTriggered) : null,
      retireAge: snapshots[snapshots.length - 1]?.age,
      allInAge: allInAge || null,
      unemploymentYears: unemployCount,
      finalSalary: retireSnapshot.salary,
      finalSavings: retireSnapshot.savings,
      finalAiSkill: retireSnapshot.aiSkill,
      avgAnnualSalaryGrowth: avgSalaryGrowth,
      savingsMultiple,
      peakSalary: Math.max(...snapshots.map(s => s.salary)),
      minSalary: Math.min(...snapshots.filter(s => s.salary > 0).map(s => s.salary)),
    }
  }
}

// ====== 玩家人格 ======
const rationalChooser = (event: any, state: any) => {
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

const zenChooser = (event: any, state: any) => {
  const opts = event.options || []
  let best = 0, bestScore = -999
  opts.forEach((opt: any, i: number) => {
    let score = 0
    if (opt.hint?.includes('压力-') || opt.hint?.includes('压力 −')) score += 8
    if (opt.hint?.includes('健康+')) score += 6
    if (opt.hint?.includes('幸福+')) score += 5
    if (opt.hint?.includes('压力+') || opt.hint?.includes('压力 +')) score -= 6
    if (opt.hintColor === 'danger') score -= 8
    if (opt.hintColor === 'positive') score += 3
    if (opt.label?.includes('安全') || opt.label?.includes('稳定')) score += 4
    if (opt.label?.includes('辞职') || opt.label?.includes('All in')) score -= 6
    if (opt.isRestOption) score += 5
    if (score > bestScore) { bestScore = score; best = i }
  })
  return best
}

const gamblerChooser = (event: any, state: any) => {
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
    if (opt.label?.includes('All In') || opt.label?.includes('辞职') || opt.label?.includes('破釜')) score += 10
    if (score > bestScore) { bestScore = score; best = i }
  })
  return best
}

// ====== 运行测试 ======
console.log('='.repeat(100))
console.log('  AI共生者路径 · 真实人生深度体验测试')
console.log('  检验维度：人生阶段/收入曲线/副业真实性/储蓄逻辑/All In决策')
console.log('='.repeat(100))

const setup = { city: '中坚大后方', profession: '传统私企', salary: 8000, mbti: 'INTJ' }

const personas = [
  { name: '理性奋斗逼', desc: '选技能成长和收入，能扛压力', chooser: rationalChooser },
  { name: '佛系生活家', desc: '选减压健康，不追求极致', chooser: zenChooser },
  { name: '冒险赌徒', desc: '偏好高风险高回报', chooser: gamblerChooser },
]

const allResults = []
for (const p of personas) {
  // 每种人格跑2次取问题最多的
  let bestRun = null, maxIssues = -1
  for (let i = 0; i < 2; i++) {
    const r = runDeepTest(p.name, p.chooser, setup)
    if (r.issues.length > maxIssues) { maxIssues = r.issues.length; bestRun = r }
  }
  if (bestRun) allResults.push(bestRun)
}

// ====== 输出报告 ======
for (const r of allResults) {
  console.log('\n' + '='.repeat(100))
  console.log(`  【${r.personaName}】${r.setup.city}/${r.setup.profession}/¥${r.setup.salary}/月`)
  console.log('='.repeat(100))

  const s = r.summary
  console.log(`\n  结局: ${s.ending || '未触发'} | 退休/结束年龄: ${s.retireAge}岁 | All In: ${s.allInAge ? s.allInAge + '岁' : '未触发'}`)
  console.log(`  最终月薪: ¥${s.finalSalary.toLocaleString()} | 最终存款: ¥${s.finalSavings.toLocaleString()} | AI技能: ${s.finalAiSkill}`)
  console.log(`  失业年数: ${s.unemploymentYears}年 | 平均年薪涨幅: ${s.avgAnnualSalaryGrowth.toFixed(1)}% | 存款/年薪比: ${s.savingsMultiple.toFixed(1)}x`)
  console.log(`  薪资区间: ¥${s.minSalary.toLocaleString()} ~ ¥${s.peakSalary.toLocaleString()}`)

  console.log('\n  ── 人生轨迹（年龄/月薪/副业/存款(万)/信念/压力/健康/事件）──')
  for (const snap of r.snapshots) {
    const sw = (snap.savings / 10000).toFixed(1)
    const flags = [snap.isAllIn ? 'AI' : '  ', snap.isUnemployed ? '失业' : '   '].join('')
    const evShort = snap.eventTitles[0]?.substring(0, 18) || (snap.eventIds[0]?.substring(0, 18) || '')
    const salChg = snap.salaryChangePct !== 0 ? `(${snap.salaryChangePct > 0 ? '+' : ''}${snap.salaryChangePct.toFixed(0)}%)` : ''
    console.log(`  ${snap.age}岁 | ¥${String(Math.round(snap.salary/100)/10).padStart(5)}k${salChg.padEnd(8)} | ¥${String(Math.round(snap.sideIncome/100)/10).padStart(4)}k | ${sw.padStart(6)}万 | 信${String(snap.faith).padStart(3)} 压${String(snap.stress).padStart(3)} 健${String(snap.health).padStart(3)} | ${evShort} ${flags}`)
  }

  console.log(`\n  ── 真实人生问题（共${r.issues.length}个）──`)
  if (r.issues.length === 0) {
    console.log('  ✅ 未发现真实性问题')
  } else {
    for (const iss of r.issues) {
      console.log(`  [${iss.severity}] ${iss.category} (${iss.age}岁)`)
      console.log(`     现象: ${iss.description}`)
      console.log(`     为什么不真实: ${iss.whyUnreal}`)
    }
  }
}

// ====== 跨人格汇总 ======
console.log('\n' + '='.repeat(100))
console.log('  跨人格真实性问题汇总')
console.log('='.repeat(100))

const allIssues = allResults.flatMap(r => r.issues)
const byCategory = new Map<string, { count: number; examples: string[]; severity: string }>()
for (const iss of allIssues) {
  const key = `${iss.severity}:${iss.category}`
  if (!byCategory.has(key)) byCategory.set(key, { count: 0, examples: [], severity: iss.severity })
  const entry = byCategory.get(key)!
  entry.count++
  if (entry.examples.length < 2) entry.examples.push(iss.description.substring(0, 50))
}

for (const [key, val] of [...byCategory.entries()].sort((a, b) => {
  const order = { P0: 0, P1: 1, P2: 2 }
  return order[a[1].severity as keyof typeof order] - order[b[1].severity as keyof typeof order]
})) {
  console.log(`\n  [${key}] ×${val.count}`)
  for (const ex of val.examples) console.log(`    例: ${ex}...`)
}

console.log('\n' + '='.repeat(100))
