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
  const workYears = state.totalYearsWorked || Math.max(0, state.currentAge - 22)
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
function generateLifeLessons(state: GameState): string[] {
  const lessons: string[] = []
  const s = state

  // 基于结局等级
  const endingId = s.currentEndingId || ''
  const isPathSuccess = endingId.startsWith('path_success_')
  const isPathFailure = endingId.startsWith('path_failure_')

  if (isPathSuccess) {
    lessons.push(`你选择了一条非传统路径并坚持到了成功。现实中，走少有人走的路需要极大的勇气和抗风险能力——但一旦成功，回报也是指数级的。`)
  }
  if (isPathFailure) {
    lessons.push(`路径失败不代表人生失败。现实中，创业失败率约90%，币圈淘汰率更高。关键不是避免失败，而是确保失败后仍有翻盘的资本。`)
  }

  // 基于被动收入
  if (s.passiveIncome > 0 && s.passiveIncome * 12 >= s.annualBaseCost) {
    lessons.push(`你的被动收入已经覆盖生活开支——这就是真正的"财务自由"。现实中，FIRE运动的核心公式就是：年支出×25 = 退休所需资产，4%安全提取率。`)
  }

  // 基于人际关系
  if (s.partner && s.partner.affection > 70) {
    lessons.push(`你和伴侣的感情度${s.partner.affection}，这是游戏中最难量化的财富。哈佛75年追踪研究证明：人生幸福感的最强预测因子不是金钱，而是亲密关系质量。`)
  }
  if (s.partner && s.partner.hasDivorced) {
    lessons.push(`你经历了一段婚姻的结束。中国2025年离婚率约40%，离婚对资产的冲击平均达30-50%。选择伴侣的重要性不亚于选择职业。`)
  }

  // 基于买房vs租房
  if (s.hasProperty && s.lifetimeMortgage && s.lifetimeMortgage > s.lifetimeLivingCost * 3) {
    lessons.push(`你的房贷总支出是生活费的${Math.round(s.lifetimeMortgage / (s.lifetimeLivingCost || 1))}倍。在租售比低于2%的城市，30年租房+定投指数基金的收益可能超过买房。`)
  }

  // 基于投资
  if (s.lifetimeInvestmentGain > 0 && s.lifetimeInvestmentGain > s.lifetimeSalary * 0.3) {
    lessons.push(`投资收益达到了工资收入的${Math.round(s.lifetimeInvestmentGain / (s.lifetimeSalary || 1) * 100)}%——你已经让钱开始为你工作。爱因斯坦说复利是世界第八大奇迹，你的数据证明了这一点。`)
  }

  // 通用启示
  if (lessons.length === 0) {
    lessons.push(`每一年都在结算，每一步都不可逆——这不只是游戏规则，这也是人生。区别在于，游戏可以重来，人生只有一次。`)
  }

  // 最后一句话
  lessons.push(`这个游戏模拟了38年的人生。现实中你也正在经历——区别是，你没有"再来一局"的按钮。所以，现在就做那个你最想做的选择吧。`)

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
  const workYears = s.totalYearsWorked || Math.max(0, s.currentAge - 22)
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
  const totalInvested = (s.indexFundPct || 0 + s.speculationPct || 0 + s.stockPct || 0) > 0 ? s.currentSavings * 0.5 : 0
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
