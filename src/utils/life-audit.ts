// life-audit.ts — 人生审计报告生成器
// 基于游戏状态分析玩家的决策模式、认知偏差，并给出现实锚点

import type { GameState } from '../types/global.d.js'

// ===== 类型定义 =====
export interface AuditSection {
  id: string
  title: string
  icon: string
  items: AuditItem[]
}

export interface AuditItem {
  label: string
  value: string
  insight: string
  tone: 'positive' | 'warning' | 'neutral' | 'critical'
}

export interface CognitiveBias {
  name: string
  description: string
  evidence: string
  realWorldTip: string
  severity: 'high' | 'medium' | 'low' | 'none'
}

export interface RealityAnchor {
  label: string
  gameValue: string
  realValue: string
  comparison: string
  source: string
}

export interface LifeAudit {
  // 决策画像
  decisionProfile: {
    riskAppetite: string
    riskScore: number
    spendingPattern: string
    workAttitude: string
    summary: string
  }
  // 现实锚点
  realityAnchors: RealityAnchor[]
  // 认知偏差
  cognitiveBiases: CognitiveBias[]
  // 人生启示
  lifeLessons: string[]
  // 量化复盘
  metrics: AuditItem[]
}

// ===== 2025-2026 中国真实数据锚点 =====
const REAL_DATA = {
  // 退休金（月均）
  pensionBeijing: 5800,
  pensionShanghai: 5500,
  pensionNational: 3500,
  pensionTier3: 2200,
  // 平均工作年限
  avgWorkYears: 38,
  // 一线城市房价均价（万/㎡）
  bjHousePrice: 6.5,
  shHousePrice: 6.8,
  // 平均结婚年龄
  avgMarryAge: 28,
  // 生育率
  avgChildAge: 29,
  // 居民人均可支配收入（年）
  avgIncome: 52000,
  // 通胀率
  inflation: 2.5,
  // 35岁职场焦虑
  layoffAge: 35,
}

// ===== 主生成函数 =====
export function generateLifeAudit(state: GameState): LifeAudit {
  const s = state
  const audit: LifeAudit = {
    decisionProfile: analyzeDecisionProfile(s),
    realityAnchors: generateRealityAnchors(s),
    cognitiveBiases: detectCognitiveBiases(s),
    lifeLessons: generateLifeLessons(s),
    metrics: generateMetrics(s),
  }
  return audit
}

// ===== 1. 决策画像分析 =====
function analyzeDecisionProfile(state: GameState) {
  let riskScore = 50 // 基础分50，偏保守-偏激进0-100

  // 投资风险偏好
  const speculation = state.speculationPct || 0
  const indexFund = state.indexFundPct || 0
  const bankDeposit = state.bankDepositPct || 0
  const stock = state.stockPct || 0
  const futures = state.hasFutures ? 10 : 0

  if (speculation > 30) riskScore += 20
  else if (speculation > 15) riskScore += 10
  if (stock > 30) riskScore += 8
  if (bankDeposit > 50) riskScore -= 15
  if (indexFund > 30) riskScore += 5 // 理性风险
  if (futures > 0) riskScore += 10
  if (state.hasGold) riskScore += 3

  // 职业风险
  if (state.currentProfession === '实体创业') riskScore += 15
  if (state.currentProfession === '自由职业') riskScore += 10
  if (state.currentProfession === '体制内') riskScore -= 15
  if (state.retirementPath) riskScore += 12
  if (state.isAllInPath) riskScore += 20

  // 财务决策
  if (state.hasProperty && state.mortgageRemainingYears && state.mortgageRemainingYears > 20) riskScore += 5
  if (state.annualBaseCost < 15000) riskScore -= 8
  if (state.annualBaseCost > 40000) riskScore += 5

  riskScore = Math.max(5, Math.min(95, riskScore))

  let riskAppetite: string
  if (riskScore >= 75) riskAppetite = '激进型'
  else if (riskScore >= 60) riskAppetite = '进取型'
  else if (riskScore >= 40) riskAppetite = '稳健型'
  else if (riskScore >= 25) riskAppetite = '保守型'
  else riskAppetite = '极度保守型'

  // 消费观
  let spendingPattern: string
  const cost = state.annualBaseCost || 0
  if (cost < 12000) spendingPattern = '极简主义者'
  else if (cost < 20000) spendingPattern = '克制消费'
  else if (cost < 35000) spendingPattern = '合理消费'
  else if (cost < 50000) spendingPattern = '品质消费'
  else spendingPattern = '高消费'

  // 工作观
  let workAttitude: string
  const workYears = state.totalYearsWorked || Math.max(0, state.currentAge - (state.startAge || 22))
  const unemployedYears = state.totalUnemployedYears || 0
  const unemploymentRatio = workYears > 0 ? unemployedYears / workYears : 0
  if (state.retirementPath && state.isAllInPath) workAttitude = 'All In创业者'
  else if (unemploymentRatio > 0.3) workAttitude = '自由探索者'
  else if (workYears > 30 && state.consecutiveMaxStressYears > 5) workAttitude = '拼命三郎'
  else if (workYears > 25) workAttitude = '稳扎稳打型'
  else if (state.hasSideHustle) workAttitude = '斜杠青年'
  else workAttitude = '常规打工型'

  // 综合画像
  const profile = `${riskAppetite} · ${spendingPattern} · ${workAttitude}`

  return {
    riskAppetite,
    riskScore,
    spendingPattern,
    workAttitude,
    summary: profile,
  }
}

// ===== 2. 现实锚点 =====
function generateRealityAnchors(state: GameState): RealityAnchor[] {
  const anchors: RealityAnchor[] = []
  const totalWealth = state.currentSavings + (state.propertyValue || 0) + (state.passiveIncome || 0) * 10

  // 资产对比
  const monthlyPension = totalWealth > 0 ? Math.floor(totalWealth / 200) : 0
  let pensionCity = '三线城市'
  let pensionMultiple = 0
  if (monthlyPension >= REAL_DATA.pensionBeijing) {
    pensionCity = '北京'
    pensionMultiple = Math.round(monthlyPension / REAL_DATA.pensionBeijing * 10) / 10
  } else if (monthlyPension >= REAL_DATA.pensionShanghai) {
    pensionCity = '上海'
    pensionMultiple = Math.round(monthlyPension / REAL_DATA.pensionShanghai * 10) / 10
  } else if (monthlyPension >= REAL_DATA.pensionNational) {
    pensionCity = '全国平均水平'
    pensionMultiple = Math.round(monthlyPension / REAL_DATA.pensionNational * 10) / 10
  } else if (monthlyPension >= REAL_DATA.pensionTier3) {
    pensionCity = '三线城市'
    pensionMultiple = Math.round(monthlyPension / REAL_DATA.pensionTier3 * 10) / 10
  }

  anchors.push({
    label: '退休资产 vs 真实退休金',
    gameValue: `¥${totalWealth.toLocaleString()}（月均¥${monthlyPension.toLocaleString()}）`,
    realValue: `2025年北京企业退休人员月均养老金¥${REAL_DATA.pensionBeijing}`,
    comparison: monthlyPension >= REAL_DATA.pensionBeijing
      ? `你的退休资产约等于${pensionCity}退休金的${pensionMultiple}倍${pensionMultiple >= 2 ? '，真正的财务自由' : ''}`
      : monthlyPension >= REAL_DATA.pensionTier3
      ? `你的退休资产约等于${pensionCity}退休金的${pensionMultiple}倍`
      : `低于三线城市退休金水平，退休生活需要更多保障`,
    source: '人社部2025年数据',
  })

  return anchors
}

// ===== 3. 认知偏差检测 =====
function detectCognitiveBiases(state: GameState): CognitiveBias[] {
  const biases: CognitiveBias[] = []

  // 沉没成本谬误：在亏损的投资/路径上坚持太久
  if (state.pathFaith !== undefined && state.pathFaith < 30 && state.retirementPath) {
    biases.push({
      name: '沉没成本谬误',
      description: '在信念值已经很低时仍坚持原路径，不愿止损',
      evidence: `路径信念降至${Math.round(state.pathFaith)}仍未退出`,
      realWorldTip: '现实中，过去的投入不应影响未来决策。问自己：如果今天从零开始，我还会选这条路吗？',
      severity: state.pathFaith < 15 ? 'high' : 'medium',
    })
  }

  // 损失厌恶：存款比例过高，不敢投资
  const bankPct = state.bankDepositPct || 0
  const totalInvestPct = (state.indexFundPct || 0) + (state.speculationPct || 0) + (state.stockPct || 0)
  if (bankPct > 60 && totalInvestPct < 20 && state.currentAge < 50) {
    biases.push({
      name: '损失厌恶',
      description: '过度偏好安全资产，错失长期复利',
      evidence: `银行存款占比${bankPct}%，投资类仅${totalInvestPct}%`,
      realWorldTip: '年化2%的存款跑不赢3%的通胀。年轻时持有适当比例的指数基金，30年复利差距可达3-5倍。',
      severity: 'medium',
    })
  }

  // 过度自信：高投机比例
  const speculationPct = state.speculationPct || 0
  if (speculationPct > 40) {
    biases.push({
      name: '过度自信偏差',
      description: '投机资产占比过高，高估了自己的判断力',
      evidence: `投机类资产占比${speculationPct}%`,
      realWorldTip: '研究显示，散户主动选股的长期收益率中位数跑不赢指数基金。巴菲特十年赌局已证明：低费率指数基金胜过专业对冲基金。',
      severity: speculationPct > 60 ? 'high' : 'medium',
    })
  }

  // 短视偏差：高压力多年仍不改变
  if (state.consecutiveMaxStressYears && state.consecutiveMaxStressYears > 5) {
    biases.push({
      name: '短视偏差（现时偏误）',
      description: '长期忍受高压工作，用健康换取短期收入',
      evidence: `连续${state.consecutiveMaxStressYears}年高压力状态`,
      realWorldTip: 'WHO数据显示，长期高压使心血管疾病风险增加50%。你赚的钱可能不够付未来的医药费。',
      severity: state.consecutiveMaxStressYears > 8 ? 'high' : 'medium',
    })
  }

  // 从众效应：跟风买房/创业
  if (state.hasProperty && state.mortgageRemainingYears && state.mortgageRemainingYears > 25 && state.currentAge < 35) {
    biases.push({
      name: '从众效应',
      description: '在年龄较小时背负超长期房贷',
      evidence: `${state.currentAge}岁背负${state.mortgageRemainingYears}年房贷`,
      realWorldTip: '买房不总是最优解。在一线城市的租售比下，同样的资金投入指数基金30年的收益可能远超房产增值。',
      severity: 'low',
    })
  }

  // 禀赋效应：持有亏损资产不愿卖
  if (state.hasFutures || (state.speculationPct > 0 && state.currentSavings < state.initMonthlySalary * 3)) {
    biases.push({
      name: '禀赋效应',
      description: '对已持有的资产估值偏高，不愿止损',
      evidence: state.hasFutures ? '持有期货等高杠杆工具' : '资产缩水但未调整配置',
      realWorldTip: '设置止损线并严格执行。亏损20%需要25%的涨幅才能回本，亏损50%需要100%。',
      severity: 'low',
    })
  }

  // 如果没检测到偏差，给正面反馈
  if (biases.length === 0) {
    biases.push({
      name: '决策理性度良好',
      description: '未检测到明显的认知偏差',
      evidence: '风险分散、压力可控、投资比例合理',
      realWorldTip: '保持这种决策模式。行为经济学研究表明，避免重大错误比追求卓越收益更重要。',
      severity: 'none',
    })
  }

  return biases
}

// ===== 4. 人生启示 =====
// 从数组中随机取 n 个不重复项
function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr]
  const out: T[] = []
  while (out.length < n && copy.length > 0) {
    const i = Math.floor(Math.random() * copy.length)
    out.push(copy.splice(i, 1)[0])
  }
  return out
}

// 从多个措辞中随机选一个
function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateLifeLessons(state: GameState): string[] {
  const lessons: string[] = []
  const s = state

  // 动态模拟年限：真实覆盖 startAge 到当前结局年龄
  const startAge = s.startAge || 22
  const endAge = s.currentAge || 60
  const simulatedYears = Math.max(2, endAge - startAge)

  const endingId = s.currentEndingId || ''
  const isPathSuccess = endingId.startsWith('path_success_')
  const isPathFailure = endingId.startsWith('path_failure_')

  // 路径结局
  if (isPathSuccess) {
    lessons.push(pickOne([
      `你选择了一条非传统路径并坚持到了成功。现实中，走少有人走的路需要极大的勇气和抗风险能力——但一旦成功，回报也是指数级的。`,
      `你把一条少有人走的路走到了头。成功的路径往往无法复制，但值得坚持的信念可以。现实中，找到你的"坚守"比找到风口更重要。`,
      `你靠押注一条细分赛道赢了。现实中，真正的机会往往藏在被低估的分叉路口——前提是你能扛过不被理解的那段路。`,
    ]))
  }
  if (isPathFailure) {
    lessons.push(pickOne([
      `路径失败不代表人生失败。现实中，创业失败率约90%，币圈淘汰率更高。关键不是避免失败，而是确保失败后仍有翻盘的资本。`,
      `这一条路没走通，但你没被困死。现实中，很多时候真正决定结局的，不是第一选择，而是失败之后你的第二选择。`,
      `你赌过，也输过。现实中，敢于下注的人比从不离席的人走得更远——只要你给自己留了退路。`,
    ]))
  }

  // 财务自由
  if (s.passiveIncome > 0 && s.passiveIncome * 12 >= s.annualBaseCost) {
    lessons.push(pickOne([
      `你的被动收入已经覆盖生活开支——这就是真正的"财务自由"。现实中，FIRE运动的核心公式就是：年支出×25 = 退休所需资产，4%安全提取率。`,
      `被动收入>生活支出，你拥有一台不需要你守在旁边也能运转的机器。现实中，造机器比卖时间辛苦，但回报是持续的。`,
      `你让钱开始替你上班了。现实中，通往自由最短的路，是把"收入-支出"的差额，持续变成能生息的资产。`,
    ]))
  }

  // 人际关系
  if (s.partner && s.partner.affection > 70) {
    lessons.push(pickOne([
      `你和伴侣的感情度${s.partner.affection}，这是游戏中最难量化的财富。哈佛75年追踪研究证明：人生幸福感的最强预测因子不是金钱，而是亲密关系质量。`,
      `钱能算清，感情算不清。你和伴侣的羁绊${s.partner.affection}%，是任何财务报表都装不下的资产。`,
      `在漫长的人生里，有人愿意陪你，比拥有多少存款更能抵御孤独。你这一次，把时间投资对了人。`,
    ]))
  }
  if (s.partner && s.partner.hasDivorced) {
    lessons.push(`你经历了一段婚姻的结束。中国2025年离婚率约40%，离婚对资产的冲击平均达30-50%。选择伴侣的重要性不亚于选择职业。`)
  }

  // 买房 vs 租房
  if (s.hasProperty && s.lifetimeMortgage && s.lifetimeMortgage > s.lifetimeLivingCost * 3) {
    lessons.push(pickOne([
      `你的房贷总支出是生活费的${Math.round(s.lifetimeMortgage / (s.lifetimeLivingCost || 1))}倍。在租售比低于2%的城市，30年租房+定投指数基金的收益可能超过买房。`,
      `一套房透支了你打工生涯的大半收入。现实中，房子是资产也是枷锁——先算清现金流，再谈归属感。`,
    ]))
  }

  // 投资
  if (s.lifetimeInvestmentGain > 0 && s.lifetimeInvestmentGain > s.lifetimeSalary * 0.3) {
    lessons.push(pickOne([
      `投资收益达到了工资收入的${Math.round(s.lifetimeInvestmentGain / (s.lifetimeSalary || 1) * 100)}%——你已经让钱开始为你工作。爱因斯坦说复利是世界第八大奇迹，你的数据证明了这一点。`,
      `你的钱赚的钱，已经快赶上你赚的钱了。现实中，越早开始复利，时间越站在你这边。`,
    ]))
  }

  // 健康
  if (s.health < 40) {
    lessons.push(pickOne([
      `你的健康值跌到了${s.health}。现实中，健康是唯一无法靠"再来一局"刷新的资产——它坏了，别的都归零。`,
      `为钱透支健康，最后往往要用钱赎回健康，还不一定赎得回来。你这一次，把最贵的资产花在了最便宜的身体上。`,
    ]))
  } else if (s.health > 75) {
    lessons.push(`你一直把健康维护得很好。现实中，健康是复利最大的基数——身体好的人，才有资格谈长期主义。`)
  }

  // 压力
  if (s.stress > 70) {
    lessons.push(`你的压力值常年偏高。现实中，长期高压会悄悄侵蚀判断力——适当"开闸"不是懒惰，是给自己续命。`)
  }

  // 幸福感
  if (s.happiness < 30) {
    lessons.push(`你这一生攒下了一些钱，却没能攒下多少快乐。现实中，钱是幸福的燃料，不是幸福本身——别把燃料当目的地。`)
  } else if (s.happiness > 75) {
    lessons.push(`你的幸福感一直很高。现实中，快乐不是财富的副产品，而是一种刻意练习——你显然很擅长。`)
  }

  // 通用启示池（随机抽取，确保每次结局都不同）
  const genericLessons = [
    `每一年都在结算，每一步都不可逆——这不只是游戏规则，这也是人生。区别在于，游戏可以重来，人生只有一次。`,
    `花钱买快乐的日子会被记住，把钱存死的日子只剩数字。人生不是FIRE账本，而是体验的合集。`,
    `你在这个模拟里做的每一个选择，现实中都有一个对应物。下一次做决定前，先问问自己：十年后我会感谢今天的这个选择吗？`,
    `健康、关系、热爱——这三样东西无法用数字衡量，却决定了你数字之外的人生质量。`,
    `人生最大的风险不是选错，而是从不选。守在原地等确定答案的人，往往错过最多。`,
    `你囤下的安全感，和你花出去的幸福感，都是人生的一部分。最好的财务状态，是内心不再焦虑。`,
    `时间才是真正的货币。你花掉的每一分努力，都在买入未来的某一种生活。`,
    `这个模拟里藏着无数平行的人生，你只活了你选的这一条。不必羡慕别人的副本，你的选择已经定义了你。`,
    `别把所有鸡蛋放在一个篮子里——这句话既是投资忠告，也是人生忠告。留一条后路，才能大胆向前。`,
    `钱会贬值，房子会折旧，但你的判断力和抗风险能力，是穿越周期的硬通货。`,
    `你这一生最重要的投资，其实不是任何一只股票，而是你花在自己成长上的那些年。`,
    `人生不是通关游戏，没有标准答案。你唯一能做的，是让每一个选择都对得起当下的自己。`,
  ]
  // 随机补足 2~3 条通用启示，避免每次雷同
  lessons.push(...pickRandom(genericLessons, 2 + Math.floor(Math.random() * 2)))

  // 最后一句话：年限与起始年龄动态化
  lessons.push(`这个游戏模拟了你从${startAge}岁到${endAge}岁、约${simulatedYears}年的人生。现实中你也正在经历——区别是，你没有"再来一局"的按钮。所以，现在就做那个你最想做的选择吧。`)

  return lessons
}

// ===== 5. 量化指标 =====
function generateMetrics(state: GameState): AuditItem[] {
  const items: AuditItem[] = []
  const s = state

  // 财务自由度
  const passiveAnnual = (s.passiveIncome || 0) * 12
  const annualCost = s.annualBaseCost || 0
  const freedomRatio = annualCost > 0 ? passiveAnnual / annualCost : 0
  items.push({
    label: '财务自由度',
    value: freedomRatio >= 1 ? '已达成' : `${Math.round(freedomRatio * 100)}%`,
    insight: freedomRatio >= 1
      ? '被动收入已覆盖全部生活开支'
      : `被动收入覆盖${Math.round(freedomRatio * 100)}%的生活开支`,
    tone: freedomRatio >= 1 ? 'positive' : freedomRatio > 0.5 ? 'neutral' : 'warning',
  })

  // 工作效率
  const workYears = s.totalYearsWorked || Math.max(0, s.currentAge - (s.startAge || 22))
  const totalIncome = s.lifetimeSalary || (s.currentMonthlySalary * workYears * 12)
  const annualAvgIncome = workYears > 0 ? totalIncome / workYears : 0
  items.push({
    label: '年均劳动收入',
    value: `¥${Math.round(annualAvgIncome).toLocaleString()}`,
    insight: annualAvgIncome > REAL_DATA.avgIncome
      ? `高于全国人均可支配收入¥${REAL_DATA.avgIncome.toLocaleString()}/年`
      : `接近全国人均可支配收入¥${REAL_DATA.avgIncome.toLocaleString()}/年`,
    tone: annualAvgIncome > REAL_DATA.avgIncome * 1.5 ? 'positive' : 'neutral',
  })

  // 投资回报率
  const invGain = s.lifetimeInvestmentGain || 0
  const totalInvested = ((s.indexFundPct || 0) + (s.speculationPct || 0) + (s.stockPct || 0)) > 0 ? s.currentSavings * 0.5 : 0
  if (totalInvested > 0 && invGain > 0) {
    const roi = Math.round(invGain / totalInvested * 100)
    items.push({
      label: '投资回报率（估）',
      value: `${roi}%`,
      insight: roi > 100 ? '远超市场平均，但也意味着承担了高风险' : roi > 50 ? '表现优秀，接近巴菲特长期年化20%' : '中规中矩',
      tone: roi > 100 ? 'warning' : roi > 50 ? 'positive' : 'neutral',
    })
  }

  // 社交资产
  const friendCount = s.friends ? s.friends.filter(f => f.relation > 30).length : 0
  const hasPartner = s.partner && s.partner.datingStage !== 'single' && !s.partner.hasDivorced
  items.push({
    label: '社交资产',
    value: `${hasPartner ? '有伴侣' : '单身'} · ${friendCount}个密友`,
    insight: hasPartner && friendCount >= 2
      ? '哈佛75年研究：良好关系是幸福最强预测因子'
      : friendCount < 2 ? '社交网络偏薄，现实中孤立感是健康杀手' : '',
    tone: hasPartner && friendCount >= 2 ? 'positive' : 'neutral',
  })

  return items
}
