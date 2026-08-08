<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useGameStore } from '../../store/game.store.js'
import type { GameState, YearResult } from '../../types/global.d.js'
import { playTurn, playDing, playBuzz, playBigGain, playBigLoss, playBlindboxReveal, playMilestone, playBreakthrough } from '../../utils/audio.js'
import { fmt, fmtExact, fmtSigned, fmtSalaryDelta } from '../../utils/format.js'
import { generateMilestoneSummary, isMilestoneAge } from '../../data/milestone-summaries.js'
import { interpolateText } from '../../utils/text-interpolate.js'
import AnimatedNumber from '../ui/AnimatedNumber.vue'

const store = useGameStore()

const result = computed<YearResult | null>(() => store.lastYearResult)
const state = computed<GameState>(() => store.state)

// 修复#3：成就展示移到年度结算面板——当年触发的成就在这里展示，不再弹到下一年叙事事件上
const achievementData = computed(() => store.currentAchievement)

// 数字动画状态
const animatedSavingsChange = ref(0)
const animatedCurrentSavings = ref(0)
const numbersReady = ref(false)

function animateNumber(target: { value: number }, to: number, duration: number) {
  const from = target.value
  const start = performance.now()
  const diff = to - from
  function tick(now: number) {
    const elapsed = now - start
    const t = Math.min(1, elapsed / duration)
    // ease-out cubic
    const ease = 1 - Math.pow(1 - t, 3)
    target.value = Math.round(from + diff * ease)
    if (t < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

// 打开年度结算面板时播放翻页音效 + 启动数字动画
watch(() => store.showYearEnd, (newVal) => {
  if (newVal && result.value) {
    playTurn()
    numbersReady.value = true

    const change = actualChange.value
    const isBigGain = change > 50000
    const isBigLoss = change < -30000

    // 存款变化和存款余额动画（错峰：等数字区滑入后再开始滚动计数）
    animatedSavingsChange.value = 0
    animatedCurrentSavings.value = state.value.currentSavings - change

    setTimeout(() => {
      animateNumber(animatedSavingsChange, change, 700)
      animateNumber(animatedCurrentSavings, state.value.currentSavings, 900)
    }, 560)

    // 播放对应音效
    setTimeout(() => {
      if (isBigGain) playBigGain()
      else if (isBigLoss) playBigLoss()
      else if (change >= 0) playDing()
      else playBuzz()
    }, 300)

    // 里程碑年：播放里程碑和弦
    if (isMilestoneAge(result.value?.age || 0)) {
      setTimeout(() => playMilestone(), 500)
    }
    // 有盲盒揭晓：播放盲盒揭晓音
    const bbReveals = result.value?.blindBoxReveals || []
    if (bbReveals.length > 0) {
      setTimeout(() => playBlindboxReveal(), 700)
    }
    // 被动收入/大事件显著突破：播放突破和弦
    const hasBreakthrough = (result.value as any)?.cardDetails?.some((c: any) =>
      /突破|跃升|翻倍|重大|契机|转机/i.test(String(c.title || '')))
    if (hasBreakthrough) {
      setTimeout(() => playBreakthrough(), 900)
    }
  }
})

const showFinanceDetail = ref<boolean>(false)
const showWellbeingDetail = ref<boolean>(false)
const financeDetailEl = ref<HTMLElement | null>(null)
const wellbeingDetailEl = ref<HTMLElement | null>(null)

// 展开/收起明细：展开后把内容滚动到按钮正下方，避免内容跳到可视区下方
function toggleFinanceDetail() {
  showFinanceDetail.value = !showFinanceDetail.value
  if (showFinanceDetail.value) {
    requestAnimationFrame(() => {
      financeDetailEl.value?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })
  }
}

function toggleWellbeingDetail() {
  showWellbeingDetail.value = !showWellbeingDetail.value
  if (showWellbeingDetail.value) {
    requestAnimationFrame(() => {
      wellbeingDetailEl.value?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })
  }
}

// 是否是里程碑年（30/40/50岁，60岁属退休结局）
const isMilestone = computed(() => {
  const age = result.value?.age || state.value.currentAge
  return isMilestoneAge(age)
})

// ================================================================
//  主事件选择逻辑
// ================================================================
function pickMainEvent(r: YearResult): string {
  // 优先级：恋爱大事件 > 关系重大变故(离世/离婚/分手) > 选择剧情(yearLog) > 盲盒揭晓 > 卡片选择 > 日常琐事
  // 黑天鹅事件（被动随机事件）一律不占据主事件，主事件必须是玩家的主动剧情衔接
  // 健康琐事（生病/住院/感冒等）一律从主事件候选池剔除
  const romanceLogs: string[] = (r as any).romanceLogs || []
  const romanceBig = (r as any).romanceBigEvent
  if (romanceBig && romanceLogs.length > 0) {
    // 恋爱大事件作为主事件（遇见/第一次约会/见家长/求婚/分手等）
    return romanceLogs[0]
  }
  // 重大人际关系变故（剔除"住院"等健康琐事，住院类文案不应占据主事件）
  const criticalRelations = r.relationshipChanges.filter(e =>
    e.includes('离世') || e.includes('离婚') || e.includes('分手')
  )
  if (criticalRelations.length > 0) return criticalRelations[0]
  // 叙事型年度总结（选择引发的剧情）作为主事件，保证剧情衔接
  const yearLog = (r as any).yearLog as string | undefined
  // [DEBUG] 主事件选择的 yearLog
  console.log('[DEBUG YearEndPanel] yearLog=', yearLog, 'isNumeric=', yearLog ? isNumericLog(yearLog) : '-', 'isIllness=', yearLog ? isIllnessLog(yearLog) : '-')
  if (yearLog && yearLog.trim() && !isNumericLog(yearLog) && !isIllnessLog(yearLog)) return yearLog
  // 盲盒揭晓文本也可能成为主事件
  const bbReveals = store.lastYearResult?.blindBoxReveals || []
  const importantBB = bbReveals.filter(b => b.emotion === 'crying' || b.emotion === 'bitter' || b.emotion === 'cold')
  if (importantBB.length > 0) return importantBB[0].text
  const importantCards = r.cardLogs.filter(e => e.length > 30 && !isNumericLog(e))
  if (importantCards.length > 0) return importantCards[0]
  // 恋爱小事件也可以是主事件
  if (romanceLogs.length > 0) return romanceLogs[0]
  // 日常琐事作为主事件时，过滤掉生病/感冒等健康琐事，避免占据最显眼位置
  const interestingDailies = r.dailyEvents.filter(e => e.length > 40 && !isNumericLog(e) && !isIllnessLog(e))
  if (interestingDailies.length > 0) return interestingDailies[0]
  return '这一年平平淡淡地过去了。'
}

// 获取主事件
const mainEvent = computed<string>(() => {
  if (!result.value) return ''
  return pickMainEvent(result.value)
})

// 岔路口抉择剧情（额外在主事件下方分割展示，不影响卡片选择作为主事件）
const crossroadStory = computed<string>(() => {
  const raw = (result.value as any)?.crossroadStory || ''
  return interpolateText(raw, state.value)
})

// ================================================================
//  故事流事件（所有剧情事件平铺展示）
// ================================================================
type StoryType = 'blackswan' | 'romance' | 'blindbox' | 'card' | 'echo' | 'daily' | 'relationship' | 'work'

interface StoryEvent {
  type: StoryType
  text: string
  label?: string
}

const allStoryEvents = computed<StoryEvent[]>(() => {
  if (!result.value) return []
  const r = result.value
  const events: StoryEvent[] = []
  // 用前20字做指纹，跨类型去重（包含主事件）
  const shownFingerprints = new Set<string>()
  function fingerprint(text: string): string {
    return text.replace(/^第\d+岁，/, '').replace(/^[📦📎]\s*/, '').trim().slice(0, 20)
  }
  function tryAdd(text: string, type: StoryType, label?: string) {
    if (!text || !text.trim()) return
    const fp = fingerprint(text)
    if (shownFingerprints.has(fp)) return
    events.push({ text, type, label })
    shownFingerprints.add(fp)
  }
  // 主事件先加入指纹集合，故事流不再重复显示
  shownFingerprints.add(fingerprint(mainEvent.value))

  // 按时间线顺序展示（年初 → 年末）：
  // 1. 卡片选择（年初玩家主动决策）
  // 2. 人际关系（家庭/朋友变化）
  // 3. 恋爱（感情线推进）
  // 4. 日常琐事（年中生活细节）
  // 5. 连锁反应（卡片延迟效果）
  // 6. 盲盒揭晓（延迟事件兑现）
  // 7. 突发事件（年末黑天鹅）

  // 1. 卡片选择日志（每张卡的日志单独显示，同一张卡的多段合并）
  const cardDetails = r.cardDetails || []
  const cardGroups: Record<string, string[]> = {}
  const cardOrder: string[] = []
  for (const detail of cardDetails) {
    if (!detail.log || !detail.log.trim()) continue
    if (!cardGroups[detail.title]) {
      cardGroups[detail.title] = []
      cardOrder.push(detail.title)
    }
    cardGroups[detail.title].push(detail.log)
  }
  for (const title of cardOrder) {
    const logs = cardGroups[title]
    // 过滤数值结算日志（如月薪调整、被动收入结算），只保留剧情叙事
    const narrLogs = logs.filter(l => !isNumericLog(l))
    if (narrLogs.length === 0) continue
    // 同一张卡只有一段就直接显示，多段才合并
    const text = narrLogs.length === 1 ? narrLogs[0].replace(/^第\d+岁，/, '') : narrLogs.map(l => l.replace(/^第\d+岁，/, '')).join(' ')
    tryAdd(text, 'card')
  }

  // 2. 人际关系变化（每条单独显示）
  for (const log of r.relationshipChanges) {
    if (!log || !log.trim()) continue
    if (isNumericLog(log)) continue
    tryAdd(log, 'relationship')
  }

  // 3. 恋爱事件（每条单独显示）
  const romanceLogs: string[] = (r as any).romanceLogs || []
  for (const log of romanceLogs) {
    tryAdd(log, 'romance')
  }

  // 4. 日常琐事（每条单独显示）
  for (const log of r.dailyEvents) {
    if (!log || !log.trim()) continue
    if (log.startsWith('📦')) continue
    if (log.startsWith('📎')) continue
    if (isNumericLog(log)) continue
    tryAdd(log, 'daily')
  }

  // 4.5 年度工作小结（一句话概括今年的工作/收入变化）
  const workSummary = (r as any).workSummary as string | undefined
  if (workSummary && workSummary.trim()) {
    events.push({ text: workSummary, type: 'work' })
  }

  // 5. 连锁反应（延迟的卡片后续事件）
  const echoLogs: string[] = (r as any).echoLogs || []
  for (const log of echoLogs) {
    tryAdd(log, 'echo')
  }

  // 6. 盲盒揭晓（每条单独显示）
  const bbReveals = store.lastYearResult?.blindBoxReveals || []
  for (const reveal of bbReveals) {
    tryAdd(reveal.text, 'blindbox')
  }

  // 7. 突发事件（年末，每条单独显示）
  for (let i = 0; i < r.events.length; i++) {
    tryAdd(r.events[i], 'blackswan', r.blackSwanEventNames?.[i] || '突发事件')
  }

  return events
})

// 故事流图标
function storyIcon(type: string): string {
  const map: Record<string, string> = {
    blackswan: '!',
    romance: '◇',
    blindbox: '?',
    card: '◆',
    echo: '▸',
    daily: '·',
    relationship: '◈',
    work: '▲',
  }
  return map[type] || '·'
}

// 故事流左侧竖线颜色
function storyColor(type: string): string {
  const map: Record<string, string> = {
    blackswan: '#ff2d95',
    romance: '#ff8ab8',
    blindbox: '#c900ff',
    card: '#00d4ff',
    echo: '#5b9eff',
    daily: '#6b8299',
    relationship: '#ff8800',
    work: '#4fc3f7',
  }
  return map[type] || '#6b8299'
}

// 判断是否为纯数值变化日志（如"压力 +3（40 -> 43）""幸福感 -4（72 -> 68）""储蓄 +5000（当前：12000）""父母健康 -5（80 -> 75）"）
function isNumericLog(log: string): boolean {
  // 匹配 "XX +/-N（YY -> ZZ）" 或 "XX +/-N（当前：YY）" 格式
  if (/^[\u4e00-\u9fa5a-zA-Z]+\s*[+-]?\d+（.*）$/.test(log.trim())) return true
  // 匹配结算/收入类数值日志（可能带"第X岁，"前缀）：
  // 月薪调整、被动收入结算、专家顾问收入、额外收入等，应作为数值反馈而非剧情主事件
  if (/月薪从¥/.test(log)) return true
  if (/调整为¥/.test(log)) return true
  if (/专业能力得到了市场认可/.test(log)) return true
  if (/额外收入|被动收入/.test(log)) return true
  return false
}

// 判断是否为生病/感冒类健康琐事日志（不应占据年度结算最显眼的位置）
function isIllnessLog(log: string): boolean {
  return /感冒|发烧|生病|流感|咳嗽|支气管炎|肠胃炎|病倒了|住院|打针|吃药/.test(log)
}

// ================================================================
//  来源名称映射（中文标签）
// ================================================================
const sourceLabels: Record<string, string> = {
  cards: '卡片选择',
  relationships: '人际关系',
  dailyEvents: '日常琐事',
  echoes: '连锁反应',
  blindBoxes: '盲盒揭晓',
  blackSwan: '突发事件',
  naturalDrift: '岁月流逝',
}

// ================================================================
//  财务明细计算
// ================================================================
interface FinanceItem {
  label: string
  amount: number
  isIncome: boolean
}

const financeItems = computed<{ income: FinanceItem[]; expense: FinanceItem[]; assetChanges: FinanceItem[] }>(() => {
  if (!result.value) return { income: [], expense: [], assetChanges: [] }
  const r = result.value
  const income: FinanceItem[] = []
  const expense: FinanceItem[] = []
  const assetChanges: FinanceItem[] = []

  // === 固定收入项（现金流入） ===
  if (r.salaryIncome > 0) {
    income.push({ label: '工资薪酬', amount: r.salaryIncome, isIncome: true })
  }
  if ((r as any).sideHustleIncome > 0) {
    income.push({ label: '副业收入', amount: (r as any).sideHustleIncome, isIncome: true })
  }
  if (r.passiveIncome > 0) {
    income.push({ label: '被动收入', amount: r.passiveIncome, isIncome: true })
  }
  // === 理财投资明细（拆分为6个渠道）- 现金类理财（存款内部分布的渠道） ===
  if (r.bankGain > 0) {
    income.push({ label: '◈ 余额宝', amount: r.bankGain, isIncome: true })
  }
  if ((r as any).fixedDepositGain > 0) {
    income.push({ label: '▣ 定期存款', amount: (r as any).fixedDepositGain, isIncome: true })
  }
  if (r.fundGain > 0) {
    income.push({ label: '◆ 基金收益', amount: r.fundGain, isIncome: true })
  } else if (r.fundGain < 0) {
    expense.push({ label: '◆ 基金亏损', amount: -r.fundGain, isIncome: false })
  }
  if ((r as any).stockGain > 0) {
    income.push({ label: '▲ 股票收益', amount: (r as any).stockGain, isIncome: true })
  } else if ((r as any).stockGain < 0) {
    expense.push({ label: '▲ 股票亏损', amount: -(r as any).stockGain, isIncome: false })
  }
  if ((r as any).goldGain > 0) {
    income.push({ label: '★ 黄金收益', amount: (r as any).goldGain, isIncome: true })
  } else if ((r as any).goldGain < 0) {
    expense.push({ label: '★ 黄金亏损', amount: -(r as any).goldGain, isIncome: false })
  }
  if (r.specGain > 0) {
    income.push({ label: '₿ 比特币收益', amount: r.specGain, isIncome: true })
  } else if (r.specGain < 0) {
    expense.push({ label: '₿ 比特币亏损', amount: -r.specGain, isIncome: false })
  }
  // 商铺租金（现金收入）
  if ((r as any).shopRentIncome > 0) {
    income.push({ label: '◆ 商铺租金', amount: (r as any).shopRentIncome, isIncome: true })
  }
  const pensionTotal = (r.pensionIncome || 0) + (r.retireIncome || 0)
  if (pensionTotal > 0) {
    income.push({ label: '养老金', amount: pensionTotal, isIncome: true })
  }

  // === 资产市值变动（非现金，不影响存款，仅改变总资产） ===
  if ((r as any).chainHoldingsGain > 0) {
    assetChanges.push({ label: '◇ 链上持仓增值', amount: (r as any).chainHoldingsGain, isIncome: true })
  } else if ((r as any).chainHoldingsGain < 0) {
    assetChanges.push({ label: '◇ 链上持仓缩水', amount: -(r as any).chainHoldingsGain, isIncome: false })
  }
  if ((r as any).bioPortfolioGain > 0) {
    assetChanges.push({ label: '◊ 生科投资增值', amount: (r as any).bioPortfolioGain, isIncome: true })
  } else if ((r as any).bioPortfolioGain < 0) {
    assetChanges.push({ label: '◊ 生科投资缩水', amount: -(r as any).bioPortfolioGain, isIncome: false })
  }
  if ((r as any).shopValueChange > 0) {
    assetChanges.push({ label: '◆ 商铺增值', amount: (r as any).shopValueChange, isIncome: true })
  } else if ((r as any).shopValueChange < 0) {
    assetChanges.push({ label: '◆ 商铺贬值', amount: -(r as any).shopValueChange, isIncome: false })
  }
  if ((r as any).propertyChange > 0) {
    assetChanges.push({ label: '▣ 房产增值', amount: (r as any).propertyChange, isIncome: true })
  } else if ((r as any).propertyChange < 0) {
    assetChanges.push({ label: '▣ 房产贬值', amount: -(r as any).propertyChange, isIncome: false })
  }
  // 车辆折旧
  if ((r as any).carDepreciation && (r as any).carDepreciation < 0) {
    assetChanges.push({ label: '◎ 车辆折旧', amount: -(r as any).carDepreciation, isIncome: false })
  }

  // === 固定支出项（现金流出） ===
  if (r.livingCost > 0) {
    expense.push({ label: '生活开销', amount: r.livingCost, isIncome: false })
  }
  if (r.mortgageCost > 0) {
    expense.push({ label: '房贷还款', amount: r.mortgageCost, isIncome: false })
  }
  if (r.insuranceCost > 0) {
    expense.push({ label: '保险保费', amount: r.insuranceCost, isIncome: false })
  }
  if ((r as any).carCost > 0) {
    expense.push({ label: '◎ 养车费用', amount: (r as any).carCost, isIncome: false })
  }
  if ((r as any).propertyMaintenanceCost > 0) {
    expense.push({ label: '▣ 房屋维护', amount: (r as any).propertyMaintenanceCost, isIncome: false })
  }
  if (r.cardCost > 0) {
    expense.push({ label: '卡片花费', amount: r.cardCost, isIncome: false })
  }
  if (r.blackSwanLoss > 0) {
    const eventName = r.blackSwanEventNames?.[0] || '突发事件'
    expense.push({ label: eventName, amount: r.blackSwanLoss, isIncome: false })
  } else if (r.blackSwanLoss < 0) {
    const eventName = r.blackSwanEventNames?.[0] || '意外收获'
    income.push({ label: eventName, amount: -r.blackSwanLoss, isIncome: true })
  }

  // === 其他收支（来自日常事件/盲盒/连锁/人际关系的直接储蓄变动）===
  // 注意：blackSwan、cards、naturalDrift 已在上面单独列出，这里跳过避免重复
  // 卡片是逐张记录的（source=卡名），需要用 cardDetails 来判断
  const cardTitles = new Set((r.cardDetails || []).map(d => d.title))
  if (r.wellbeingChanges) {
    for (const entry of r.wellbeingChanges) {
      if (entry.source === 'naturalDrift') continue // 已包含在工资/理财/开销/房贷等固定项中
      if (entry.source === 'blackSwan') continue // 已通过 blackSwanLoss 单独列出
      if (entry.source === 'cards') continue // 已通过 cardCost 单独列出
      if (entry.source === '休养生息') continue // 休养生息不涉及储蓄变化
      if (cardTitles.has(entry.source)) continue // 卡片花费已通过 cardCost 单独列出
      if (entry.savings !== 0) {
        if (entry.savings > 0) {
          income.push({ label: `${sourceLabels[entry.source] || entry.source}`, amount: Math.round(entry.savings), isIncome: true })
        } else {
          expense.push({ label: `${sourceLabels[entry.source] || entry.source}`, amount: Math.round(-entry.savings), isIncome: false })
        }
      }
    }
  }

  return { income, expense, assetChanges }
})

const totalIncome = computed(() => {
  return financeItems.value.income.reduce((s, i) => s + i.amount, 0)
})

const totalExpense = computed(() => {
  return financeItems.value.expense.reduce((s, i) => s + i.amount, 0)
})

const totalAssetChange = computed(() => {
  let total = 0
  for (const item of financeItems.value.assetChanges) {
    total += item.isIncome ? item.amount : -item.amount
  }
  return total
})

// 收支结构占比条（收入绿 / 支出红，像素堆叠条）
const incomeRatio = computed(() => {
  const tot = totalIncome.value + totalExpense.value
  if (tot <= 0) return 50
  return Math.round((totalIncome.value / tot) * 100)
})
const expenseRatio = computed(() => 100 - incomeRatio.value)

const actualChange = computed(() => {
  if (!result.value) return 0
  return result.value.actualSavingsChange ?? (totalIncome.value - totalExpense.value)
})

// 月薪变化
const salaryChange = computed(() => {
  if (!result.value) return 0
  return (result.value as any).salaryChange ?? 0
})

// 薪资变动明细
const salaryDetailRows = computed(() => {
  if (!result.value) return []
  const breakdown = (result.value as any).salaryBreakdown as any[] || []
  return breakdown
    .filter(e => Math.abs(e.amount) >= 1)
    .map(e => ({
      source: e.source,
      note: e.note || '',
      amount: Math.round(e.amount),
    }))
})

// 月被动收入（年被动收入/12，更符合玩家日常认知）
const monthlyPassiveIncome = computed(() => {
  return Math.round((state.value.passiveIncome || 0) / 12)
})

// ================================================================
//  身心变化明细（按来源）
// ================================================================
interface WellbeingRow {
  source: string
  label: string
  stress: number
  happiness: number
  health: number
}

const wellbeingDetailRows = computed<WellbeingRow[]>(() => {
  if (!result.value || !result.value.wellbeingChanges) return []
  return result.value.wellbeingChanges
    .filter(e => e.stress !== 0 || e.happiness !== 0 || e.health !== 0)
    .map(e => ({
      source: e.source,
      label: sourceLabels[e.source] || e.source,
      stress: Math.round(e.stress),
      happiness: Math.round(e.happiness),
      health: Math.round(e.health),
    }))
})

// ================================================================
//  年度独白（从年初独白移入，顶部娱乐元素）
// ================================================================
const resolvedOpeningMonologue = computed(() =>
  interpolateText(store.state.yearOpeningMonologue, store.state)
)

// ================================================================
//  里程碑叙事（30/40/50岁人生小结）
// ================================================================
const milestoneLines = computed<string[]>(() => {
  if (!isMilestone.value || !result.value) return []
  const age = result.value.age
  const lines = generateMilestoneSummary(state.value, age)
  if (lines.length === 0) return []
  return [`── 第${age}岁 · 人生小结 ──`, ...lines]
})

// ================================================================
//  格式化工具（使用公共 utils/format.ts）
// ================================================================
// 模板中使用的格式化函数映射：
// - fmtMoney: 金额（自动万/亿，带¥）—— 用于存款、收支等大数字
// - fmtSalary: 薪资（精确到元，带¥）—— 用于月薪、薪资变动等千级数字
// - fmtSigned: 变动额（带+/-¥，自动万/亿）—— 用于存款变化
// - fmtSalaryDelta: 薪资变动（带↑↓箭头，精确到元）
const fmtMoney = fmt
const fmtSalary = fmtExact
const fmtChange = fmtSigned
const fmtRound = (n: number) => String(Math.round(n))

// 进度条颜色
function barColor(val: number, type: 'health' | 'stress' | 'happiness'): string {
  if (type === 'health') {
    if (val >= 70) return '#00ff88'
    if (val >= 40) return '#ff8800'
    return '#ff2d95'
  }
  if (type === 'stress') {
    if (val >= 70) return '#ff2d95'
    if (val >= 40) return '#ff8800'
    return '#00ff88'
  }
  // happiness
  if (val >= 70) return '#00ff88'
  if (val >= 40) return '#ffec27'
  return '#ff2d95'
}

function deltaClass(v: number, metric?: 'stress' | 'happiness' | 'health'): string {
  if (v === 0) return 'delta-neutral'
  // 压力上升是坏事（红色），下降是好事（绿色）
  if (metric === 'stress') {
    return v > 0 ? 'delta-down' : 'delta-up'
  }
  // 健康/幸福 上升是好事（绿色），下降是坏事（红色）
  return v > 0 ? 'delta-up' : 'delta-down'
}

function formatDelta(v: number): string {
  if (v > 0) return '+' + v
  if (v < 0) return String(v)
  return '0'
}

// ================================================================
//  年度收支汇总（使用实际变化值）
// ================================================================

// 继续按钮
function handleContinue(): void {
  if (actualChange.value > 0) {
    playDing()
  } else if (actualChange.value < 0) {
    playBuzz()
  }
  // 修复#3：关闭年度结算时一并清除成就展示
  if (store.currentAchievement) {
    store.dismissAchievement()
  }
  store.dismissYearEnd()
}
</script>

<template>
  <div class="yearend-overlay">
    <!-- 扫描线 -->
    <div class="scanlines" aria-hidden="true" />

    <div v-if="result" class="yearend-panel" :class="{ milestone: isMilestone }">
      <!-- 四角像素装饰 -->
      <div class="pixel-corner corner-tl" />
      <div class="pixel-corner corner-tr" />
      <div class="pixel-corner corner-bl" />
      <div class="pixel-corner corner-br" />

      <!-- 滚动内容容器：四角固定在面板帧上，内容超高时仅此容器滚动 -->
      <div class="yearend-scroll">

      <!-- ============================================================
           带一：顶部状态条（横向排布）：年龄 | 年结余 | 关键指标
           ============================================================ -->
      <div class="yd-topbar">
        <div class="yd-ageblock">
          <div v-if="isMilestone" class="milestone-tag">人生小结</div>
          <div class="age-hero">
            <span class="age-star" aria-hidden="true">✦</span>
            <span class="age-unit">AGE</span>
            <span class="age-num">{{ result.age }}</span>
            <span class="age-unit">岁</span>
            <span class="age-star" aria-hidden="true">✦</span>
          </div>
        </div>

        <div class="yd-topdivider" aria-hidden="true" />

        <!-- 年度独白（从年初独白移入，顶部娱乐元素） -->
        <div class="yd-monologue">
          <span class="monologue-mark" aria-hidden="true">❝</span>
          <span class="monologue-text">{{ resolvedOpeningMonologue }}</span>
          <span class="monologue-mark" aria-hidden="true">❞</span>
        </div>
      </div>

      <!-- ============================================================
           带二：叙事舞台（全宽横幅）：年度金句 + 岔路口 + 成就
           ============================================================ -->
      <div class="yd-cols">
        <!-- 左列：叙事（年度金句 + 命运岔路口 + 成就） -->
        <div class="yd-col-left">
        <!-- 左栏归类标题：本年度 · 故事 -->
        <div class="yd-cat-header cat-story">
          <span class="cat-mark" aria-hidden="true">◆</span>
          <span class="cat-title">本年度 · 故事</span>
          <span class="cat-en">THIS YEAR'S STORY</span>
        </div>
        <div class="section-quote">
          <div class="section-header">
            <span class="section-tag">◆ 年度金句 · YEARLY QUOTE ◆</span>
          </div>
          <div class="main-event-section">
            <p class="main-event-text">{{ mainEvent }}</p>
          </div>
        </div>

        <!-- 岔路口抉择：不影响卡片选择作为主事件 -->
        <div v-if="crossroadStory" class="section-crossroad">
          <div class="section-header">
            <span class="section-tag">⚡ 命运岔路口 · 你的抉择</span>
          </div>
          <div class="crossroad-story-block">
            <p class="crossroad-story-text">{{ crossroadStory }}</p>
          </div>
        </div>

        <!-- 成就解锁 -->
        <div v-if="achievementData" class="section-achievement">
          <div class="section-header">
            <span class="section-tag achievement-tag">★ 成就解锁 · ACHIEVEMENT ★</span>
          </div>
          <div class="achievement-display">
            <div class="achievement-badge-large">★</div>
            <h3 class="achievement-title-large">{{ achievementData.title }}</h3>
            <div class="achievement-narrative-large">
              <p v-for="(line, i) in achievementData.narrative.split('\n')" :key="'ach-' + i">{{ line }}</p>
            </div>
          </div>
        </div>

        <!-- 事件回顾（故事流，属叙事） -->
        <div class="yd-log">
        <div class="section-header">
          <span class="section-tag">▣ 事件回顾 · EVENT LOG</span>
        </div>

        <!-- 里程碑叙事（30/40/50岁人生小结） -->
        <div v-if="milestoneLines.length > 0" class="milestone-section">
          <p v-for="(line, idx) in milestoneLines" :key="'ms-' + idx" class="milestone-line">
            {{ line }}
          </p>
        </div>

        <!-- 故事流：年度所有事件 -->
        <div v-if="allStoryEvents.length > 0" class="story-stream">
          <div
            v-for="(evt, idx) in allStoryEvents"
            :key="'story-' + idx"
            class="story-line"
            :class="'story-type-' + evt.type"
            :style="{ '--story-color': storyColor(evt.type) }"
          >
            <span class="story-icon">{{ storyIcon(evt.type) }}</span>
            <span class="story-text">{{ evt.text }}</span>
          </div>
        </div>

        <!-- 无事件时的占位 -->
        <div v-else class="no-events-placeholder">
          <span class="no-events-text">—— 这一年风平浪静 ——</span>
        </div>
      </div>
        </div>  <!-- /yd-col-left -->

        <div class="yd-col-right">
        <!-- 右栏归类标题：本年度 · 数据 -->
        <div class="yd-cat-header cat-data">
          <span class="cat-mark" aria-hidden="true">◇</span>
          <span class="cat-title">本年度 · 数据</span>
          <span class="cat-en">THIS YEAR'S DATA</span>
        </div>
        <!-- 财务概览（从顶部移入）：年结余 + 月薪/被动/存款 -->
        <div class="yd-finance">
          <div class="yd-sub-header">
            <span class="sub-mark" aria-hidden="true">▸</span>
            <span class="sub-title">财务概览</span>
          </div>
          <div
            class="finance-hero"
            :class="actualChange >= 0 ? 'hero-gain' : 'hero-loss'"
          >
            <span class="hero-label">⇓ 本年度结余 ⇓</span>
            <span
              class="hero-value"
              :class="{ 'hero-big': Math.abs(actualChange) > 50000 }"
            >
              {{ numbersReady ? fmtChange(animatedSavingsChange) : fmtChange(actualChange) }}
            </span>
          </div>
          <div class="yd-kpis">
            <div class="kpi">
              <span class="kpi-label">月薪</span>
              <span
                class="kpi-value"
                :class="state.currentMonthlySalary > 0 ? 'val-blue' : 'val-red'"
              >
                {{ state.currentMonthlySalary > 0 ? fmtSalary(state.currentMonthlySalary) : '失业' }}
              </span>
              <span
                v-if="salaryChange !== 0"
                class="kpi-sub"
                :class="salaryChange > 0 ? 'val-green' : 'val-red'"
              >
                {{ fmtSalaryDelta(salaryChange) }}
              </span>
            </div>
            <div class="kpi">
              <span class="kpi-label">被动收入</span>
              <span class="kpi-value" :class="monthlyPassiveIncome > 0 ? 'val-green' : ''">
                {{ monthlyPassiveIncome > 0 ? fmtSalary(monthlyPassiveIncome) : '¥0' }}
              </span>
              <span class="kpi-sub unit-label">/月</span>
            </div>
            <div class="kpi">
              <span class="kpi-label">存款</span>
              <span class="kpi-value" :class="state.currentSavings >= 0 ? 'val-green' : 'val-red'">
                {{ numbersReady ? fmtMoney(animatedCurrentSavings) : fmtMoney(state.currentSavings) }}
              </span>
            </div>
          </div>
        </div>

      <!-- ============================================================
           带四：数据条（全宽横向排布）：收支 | 身心健康 | 资产事件
           ============================================================ -->
      <div class="yd-data">
        <!-- 数据子分类标题 -->
        <div class="yd-sub-header">
          <span class="sub-mark" aria-hidden="true">▸</span>
          <span class="sub-title">收支与身心</span>
        </div>
        <!-- 收支与身心健康统计卡 -->
        <div class="yd-stats">
          <div class="yd-stat">
            <span class="yd-stat-label">收入</span>
            <span class="yd-stat-value val-green">{{ fmtMoney(totalIncome) }}</span>
          </div>
          <div class="yd-stat">
            <span class="yd-stat-label">支出</span>
            <span class="yd-stat-value val-red">{{ fmtMoney(totalExpense) }}</span>
          </div>
          <div class="yd-stat">
            <span class="yd-stat-label">健康</span>
            <span class="yd-stat-value" :style="{ color: barColor(state.health, 'health') }">
              <AnimatedNumber :value="state.health" :format="fmtRound" />
            </span>
            <span class="yd-stat-delta" :class="deltaClass(result.healthChange, 'health')">
              ({{ formatDelta(result.healthChange) }})
            </span>
          </div>
          <div class="yd-stat">
            <span class="yd-stat-label">压力</span>
            <span class="yd-stat-value" :style="{ color: barColor(state.stress, 'stress') }">
              <AnimatedNumber :value="state.stress" :format="fmtRound" />
            </span>
            <span class="yd-stat-delta" :class="deltaClass(result.stressChange, 'stress')">
              ({{ formatDelta(result.stressChange) }})
            </span>
          </div>
          <div class="yd-stat">
            <span class="yd-stat-label">幸福</span>
            <span class="yd-stat-value" :style="{ color: barColor(state.happiness, 'happiness') }">
              <AnimatedNumber :value="state.happiness" :format="fmtRound" />
            </span>
            <span class="yd-stat-delta" :class="deltaClass(result.happinessChange, 'happiness')">
              ({{ formatDelta(result.happinessChange) }})
            </span>
          </div>
        </div>

        <!-- 收支结构占比条 -->
        <div class="flow-bar">
          <div class="flow-bar-track">
            <div class="flow-seg flow-income" :style="{ width: incomeRatio + '%' }" />
            <div class="flow-seg flow-expense" :style="{ width: expenseRatio + '%' }" />
          </div>
          <div class="flow-legend">
            <span class="flow-legend-item">
              <i class="dot dot-in" />收入 <b>{{ fmtMoney(totalIncome) }}</b>
            </span>
            <span class="flow-legend-item">
              <i class="dot dot-ex" />支出 <b>{{ fmtMoney(totalExpense) }}</b>
            </span>
          </div>
        </div>

        <!-- 明细展开：按钮与其内容成组，展开内容直接出现在按钮下方 -->
        <div class="yd-toggle-group">
          <button
            class="detail-toggle"
            :class="{ expanded: showFinanceDetail }"
            @click="toggleFinanceDetail"
          >
            <span class="fold-arrow">{{ showFinanceDetail ? '▲' : '▼' }}</span>
            <span>{{ showFinanceDetail ? '收起明细' : '查看收支明细' }}</span>
          </button>
          <!-- 收支明细展开（全宽） -->
          <div ref="financeDetailEl" v-if="showFinanceDetail" class="finance-detail">
          <div class="finance-detail-col">
            <div class="detail-col-title income-title">现金收入</div>
            <div v-for="(item, idx) in financeItems.income" :key="'in-' + idx" class="detail-row">
              <span class="detail-label">{{ item.label }}</span>
              <span class="detail-amount val-green">+{{ fmtMoney(item.amount) }}</span>
            </div>
            <div class="detail-row total-row">
              <span class="detail-label">现金收入合计</span>
              <span class="detail-amount val-blue">{{ fmtMoney(totalIncome) }}</span>
            </div>
          </div>
          <div class="finance-detail-col">
            <div class="detail-col-title expense-title">现金支出</div>
            <div v-for="(item, idx) in financeItems.expense" :key="'ex-' + idx" class="detail-row">
              <span class="detail-label">{{ item.label }}</span>
              <span class="detail-amount val-red">-{{ fmtMoney(item.amount) }}</span>
            </div>
            <div class="detail-row total-row">
              <span class="detail-label">现金支出合计</span>
              <span class="detail-amount val-orange">{{ fmtMoney(totalExpense) }}</span>
            </div>
          </div>
          <!-- 资产市值变动（非现金） -->
          <div v-if="financeItems.assetChanges.length > 0" class="finance-detail-col full-width">
            <div class="detail-col-title asset-title">资产市值变动（非现金，不影响存款）</div>
            <div v-for="(item, idx) in financeItems.assetChanges" :key="'as-' + idx" class="detail-row">
              <span class="detail-label">{{ item.label }}</span>
              <span class="detail-amount" :class="item.isIncome ? 'val-green' : 'val-red'">
                {{ item.isIncome ? '+' : '-' }}{{ fmtMoney(item.amount) }}
              </span>
            </div>
            <div class="detail-row total-row">
              <span class="detail-label">资产市值净变动</span>
              <span class="detail-amount" :class="totalAssetChange >= 0 ? 'val-green' : 'val-red'">
                {{ totalAssetChange >= 0 ? '+' : '' }}{{ fmtMoney(totalAssetChange) }}
              </span>
            </div>
          </div>
          <!-- 月薪变动明细 -->
          <div v-if="salaryDetailRows.length > 0 && salaryChange !== 0" class="finance-detail-col full-width">
            <div class="detail-col-title salary-title">月薪变动明细</div>
            <div v-for="(item, idx) in salaryDetailRows" :key="'sal-' + idx" class="detail-row salary-detail-row">
              <span class="detail-label">
                <span class="salary-source">{{ item.source }}</span>
                <span v-if="item.note" class="salary-note">{{ item.note }}</span>
              </span>
              <span class="detail-amount" :class="item.amount >= 0 ? 'val-green' : 'val-red'">
                {{ item.amount >= 0 ? '+' : '' }}{{ fmtSalary(item.amount) }}
              </span>
            </div>
            <div class="detail-row total-row">
              <span class="detail-label">月薪净变动</span>
              <span class="detail-amount" :class="salaryChange >= 0 ? 'val-green' : 'val-red'">
                {{ fmtSalaryDelta(salaryChange) }}
              </span>
            </div>
          </div>
        </div>
        </div>

        <!-- 身心变化明细：按钮与其内容成组 -->
        <div v-if="wellbeingDetailRows.length > 0" class="yd-toggle-group">
          <button
            class="detail-toggle"
            :class="{ expanded: showWellbeingDetail }"
            @click="toggleWellbeingDetail"
          >
            <span class="fold-arrow">{{ showWellbeingDetail ? '▲' : '▼' }}</span>
            <span>{{ showWellbeingDetail ? '收起变化来源' : '查看变化来源' }}</span>
          </button>
          <div ref="wellbeingDetailEl" v-if="showWellbeingDetail && wellbeingDetailRows.length > 0" class="wellbeing-detail">
          <div class="wb-detail-header">
            <span class="wb-detail-col">来源</span>
            <span class="wb-detail-col">压力</span>
            <span class="wb-detail-col">幸福</span>
            <span class="wb-detail-col">健康</span>
          </div>
          <div v-for="(row, idx) in wellbeingDetailRows" :key="'wb-' + idx" class="wb-detail-row">
            <span class="wb-detail-col wb-source">{{ row.label }}</span>
            <span class="wb-detail-col" :class="deltaClass(row.stress, 'stress')">
              {{ row.stress !== 0 ? formatDelta(row.stress) : '-' }}
            </span>
            <span class="wb-detail-col" :class="deltaClass(row.happiness, 'happiness')">
              {{ row.happiness !== 0 ? formatDelta(row.happiness) : '-' }}
            </span>
            <span class="wb-detail-col" :class="deltaClass(row.health, 'health')">
              {{ row.health !== 0 ? formatDelta(row.health) : '-' }}
            </span>
          </div>
          <div class="wb-detail-row wb-total-row">
            <span class="wb-detail-col wb-source">年度合计</span>
            <span class="wb-detail-col" :class="deltaClass(result.stressChange, 'stress')">
              {{ formatDelta(result.stressChange) }}
            </span>
            <span class="wb-detail-col" :class="deltaClass(result.happinessChange, 'happiness')">
              {{ formatDelta(result.happinessChange) }}
            </span>
            <span class="wb-detail-col" :class="deltaClass(result.healthChange, 'health')">
              {{ formatDelta(result.healthChange) }}
            </span>
          </div>
        </div>
        </div>
      </div>
      </div>  <!-- /yd-col-right -->
      </div>  <!-- /yd-cols -->

      <!-- 继续按钮 -->
      <div class="yearend-footer">
        <button class="btn-continue" @click="handleContinue">
          <span class="btn-arrow">&#9654;</span>
          <span class="btn-text">翻开第 {{ state.currentAge }} 岁 ▸</span>
        </button>
      </div>
      </div>  <!-- /yearend-scroll -->
    </div>
  </div>
</template>

<style scoped>
/* ============================================================
   全屏遮罩层
   ============================================================ */
.yearend-overlay {
  position: fixed;
  inset: 0;
  z-index: 150;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 20px;
  animation: yearendFadeIn 0.3s ease-out;
}

@keyframes yearendFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ============================================================
   扫描线纹理覆盖
   ============================================================ */
.scanlines {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 151;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.08) 0px,
    rgba(0, 0, 0, 0.08) 1px,
    transparent 1px,
    transparent 3px
  );
}

/* ============================================================
   面板主体
   ============================================================ */
.yearend-panel {
  position: relative;
  width: min(520px, 100%);
  max-height: 90%;
  display: flex;
  flex-direction: column;
  padding: 28px 22px;
  background:
    radial-gradient(ellipse at 20% 20%, rgba(201, 0, 255, 0.06) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(0, 212, 255, 0.05) 0%, transparent 50%),
    linear-gradient(160deg, #0d0e1a 0%, #0f0a20 40%, #0a0f1a 100%);
  z-index: 152;

  /* 多层霓虹边框：紫+蓝 */
  box-shadow:
    0 0 16px var(--neon-purple),
    0 0 40px rgba(201, 0, 255, 0.35),
    0 0 80px rgba(201, 0, 255, 0.15),
    inset 0 0 40px rgba(201, 0, 255, 0.03);
  border: 2px solid var(--neon-purple);
  outline: 1px solid rgba(0, 212, 255, 0.2);
  outline-offset: 4px;

  animation: yearendSlideIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 滚动内容容器：承载全部内容，超高时仅此容器滚动，四角固定在面板帧上 */
.yearend-scroll {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
}

/* ============================================================
   顶部状态条（横贯）：年龄 | 年结余 | 关键指标
   ============================================================ */
.yd-topbar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 14px;
  padding: 0 0 10px;
}

.yd-ageblock {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.yd-topdivider {
  align-self: stretch;
  width: 1px;
  background: linear-gradient(180deg, transparent, var(--neon-purple), transparent);
  box-shadow: 0 0 6px var(--neon-purple);
}

/* ============================================================
   年度独白（顶部娱乐元素）
   ============================================================ */
.yd-monologue {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 18px;
  border-radius: 4px;
  background: linear-gradient(135deg, rgba(255, 45, 149, 0.08) 0%, rgba(201, 0, 255, 0.04) 100%);
  border: 1px solid rgba(255, 45, 149, 0.28);
  box-shadow: inset 0 0 16px rgba(255, 45, 149, 0.07), 0 0 10px rgba(255, 45, 149, 0.1);
  position: relative;
  animation: fortuneIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
}
@keyframes fortuneIn {
  from { opacity: 0; transform: translateY(8px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.monologue-mark {
  font-size: 22px;
  line-height: 0;
  color: #ff2d95;
  text-shadow: 0 0 8px #ff2d95, 0 0 18px rgba(255, 45, 149, 0.5);
  user-select: none;
}
.monologue-text {
  font-size: 13px;
  line-height: 1.7;
  color: #f0dce8;
  letter-spacing: 0.5px;
  text-align: center;
}

/* 关键指标 KPI 块（月薪 / 被动收入 / 存款） */
.yd-kpis {
  display: flex;
  gap: 10px;
}

.kpi {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 92px;
  padding: 8px 14px;
  background: linear-gradient(180deg, rgba(10, 5, 30, 0.7) 0%, rgba(10, 5, 30, 0.4) 100%);
  border: 1px solid rgba(201, 0, 255, 0.18);
  position: relative;
  overflow: hidden;
}
.kpi::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(201, 0, 255, 0.25), transparent);
  pointer-events: none;
}
.kpi-label {
  font-size: 10px;
  letter-spacing: 2px;
  color: #94b0c2;
}
.kpi-value {
  font-weight: bold;
  font-size: 16px;
  letter-spacing: 0.5px;
  line-height: 1.1;
}
.kpi-sub {
  font-size: 10px;
}

/* ============================================================
   左右两块容器（竖屏时透明，保持纵向顺序）
   ============================================================ */
.yd-cols {
  display: contents;
}

/* 左列：叙事（年度金句 + 岔路口 + 成就） */
.yd-col-left {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 右列：事件回顾 + 数据总结 */
.yd-col-right {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ============================================================
   事件回顾带（全宽）
   ============================================================ */
.yd-log {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ============================================================
   数据条（全宽）：统计卡 + 占比条 + 资产事件 + 明细
   ============================================================ */
.yd-data {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 横向统计卡（收入/支出/健康/压力/幸福） */
.yd-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.yd-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex: 1 1 auto;
  min-width: 96px;
  padding: 8px 12px;
  background: linear-gradient(180deg, rgba(0, 255, 136, 0.06) 0%, rgba(0, 255, 136, 0.02) 100%);
  border: 1px solid rgba(0, 255, 136, 0.2);
  position: relative;
  overflow: hidden;
}
.yd-stat::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 255, 136, 0.3), transparent);
  pointer-events: none;
}
.yd-stat-label {
  font-size: 10px;
  letter-spacing: 2px;
  color: #94b0c2;
}
.yd-stat-value {
  font-weight: bold;
  font-size: 18px;
  line-height: 1.1;
}
.yd-stat-delta {
  font-size: 10px;
}

/* 明细展开组：按钮与其展开内容紧邻 */
.yd-toggle-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 里程碑年：边框变金色 */
.yearend-panel.milestone {
  border-color: #ffec27;
  outline-color: rgba(255, 236, 39, 0.3);
  box-shadow:
    0 0 16px #ffec27,
    0 0 40px rgba(255, 236, 39, 0.35),
    0 0 80px rgba(255, 136, 0, 0.15),
    0 0 120px rgba(255, 236, 39, 0.1);
}

.yearend-panel.milestone .pixel-corner.corner-tl,
.yearend-panel.milestone .pixel-corner.corner-tr {
  border-color: #ffec27;
  box-shadow: 0 0 8px #ffec27;
}

@keyframes yearendSlideIn {
  from {
    transform: translateY(40px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* ============================================================
   四角像素L形装饰
   ============================================================ */
.pixel-corner {
  position: absolute;
  width: 20px;
  height: 20px;
  pointer-events: none;
}

.pixel-corner.corner-tl {
  top: -2px;
  left: -2px;
  border-top: 3px solid var(--neon-pink);
  border-left: 3px solid var(--neon-pink);
  box-shadow: 0 0 8px var(--neon-pink);
}

.pixel-corner.corner-tr {
  top: -2px;
  right: -2px;
  border-top: 3px solid var(--neon-blue);
  border-right: 3px solid var(--neon-blue);
  box-shadow: 0 0 8px var(--neon-blue);
}

.pixel-corner.corner-bl {
  bottom: -2px;
  left: -2px;
  border-bottom: 3px solid var(--neon-blue);
  border-left: 3px solid var(--neon-blue);
  box-shadow: 0 0 8px var(--neon-blue);
}

.pixel-corner.corner-br {
  bottom: -2px;
  right: -2px;
  border-bottom: 3px solid var(--neon-orange);
  border-right: 3px solid var(--neon-orange);
  box-shadow: 0 0 8px var(--neon-orange);
}

/* ============================================================
   标题区
   ============================================================ */
.yearend-header {
  position: relative;
  z-index: 2;
  text-align: center;
}

.milestone-tag {
  display: inline-block;
  font-size: 10px;
  letter-spacing: 4px;
  color: #ffec27;
  border: 1px solid #ffec27;
  padding: 2px 12px;
  margin-bottom: 8px;
  text-shadow: 0 0 6px #ffec27;
  box-shadow: 0 0 8px rgba(255, 236, 39, 0.4);
  animation: milestonePulse 2s ease-in-out infinite;
}

@keyframes milestonePulse {
  0%, 100% { box-shadow: 0 0 8px rgba(255, 236, 39, 0.4); }
  50% { box-shadow: 0 0 16px rgba(255, 236, 39, 0.7), 0 0 32px rgba(255, 136, 0, 0.3); }
}

/* 年度报告式开篇：大年龄 + 流光星标 */
.age-hero {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 10px;
  padding: 6px 0 2px;
}

.age-unit {
  font-size: 12px;
  letter-spacing: 5px;
  color: var(--neon-blue);
  text-shadow: 0 0 6px var(--neon-blue), 0 0 14px rgba(0, 212, 255, 0.4);
  font-weight: bold;
}

.age-num {
  font-size: 46px;
  line-height: 1;
  font-weight: bold;
  color: var(--neon-pink);
  text-shadow:
    0 0 8px var(--neon-pink),
    0 0 20px var(--neon-pink),
    0 0 40px rgba(255, 45, 149, 0.5);
  animation: ageNumGlow 2.4s ease-in-out infinite;
}

@keyframes ageNumGlow {
  0%, 100% {
    text-shadow: 0 0 8px var(--neon-pink), 0 0 20px var(--neon-pink), 0 0 40px rgba(255, 45, 149, 0.5);
  }
  50% {
    text-shadow: 0 0 12px var(--neon-pink), 0 0 30px var(--neon-pink), 0 0 60px rgba(201, 0, 255, 0.5);
  }
}

.age-star {
  font-size: 16px;
  color: var(--neon-blue);
  text-shadow: 0 0 8px var(--neon-blue), 0 0 16px rgba(0, 212, 255, 0.5);
  animation: starTwinkle 1.8s ease-in-out infinite;
}
.age-hero .age-star:last-child {
  animation-delay: 0.9s;
}

@keyframes starTwinkle {
  0%, 100% { opacity: 0.4; transform: scale(0.85) rotate(0deg); }
  50% { opacity: 1; transform: scale(1.15) rotate(20deg); }
}

/* ============================================================
   分割线
   ============================================================ */
.divider {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 2px 0;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--neon-purple), transparent);
  box-shadow: 0 0 4px var(--neon-purple);
}

.divider-dot {
  width: 5px;
  height: 5px;
  background: var(--neon-blue);
  box-shadow: 0 0 6px var(--neon-blue);
  flex-shrink: 0;
  transform: rotate(45deg);
}

/* ============================================================
   面板分区容器（三大区域）
   ============================================================ */
.panel-section {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 分区一：年度金句 - 品红色霓虹 */
.section-quote {
  padding: 14px 12px 10px;
  background: linear-gradient(135deg, rgba(255, 45, 149, 0.06) 0%, rgba(255, 45, 149, 0.02) 100%);
  border: 1px solid rgba(255, 45, 149, 0.25);
  box-shadow: inset 0 0 14px rgba(255, 45, 149, 0.06), 0 0 10px rgba(255, 45, 149, 0.1);
  position: relative;
}
.section-quote::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 45, 149, 0.4), transparent);
  pointer-events: none;
}

/* 分区二：事件回顾 - 蓝色霓虹 */
.section-events {
  padding: 12px 10px;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.04) 0%, rgba(0, 212, 255, 0.01) 100%);
  border: 1px solid rgba(0, 212, 255, 0.2);
  box-shadow: inset 0 0 12px rgba(0, 212, 255, 0.05);
  position: relative;
}
.section-events::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.3), transparent);
  pointer-events: none;
}

/* 分区三：数字总结 - 绿色霓虹 */
.section-numbers {
  padding: 12px 10px;
  background: linear-gradient(135deg, rgba(0, 255, 136, 0.04) 0%, rgba(0, 255, 136, 0.01) 100%);
  border: 1px solid rgba(0, 255, 136, 0.2);
  box-shadow: inset 0 0 12px rgba(0, 255, 136, 0.05);
  gap: 8px;
  position: relative;
}
.section-numbers::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 255, 136, 0.3), transparent);
  pointer-events: none;
}

/* ============================================================
   错峰入场：标题 → 金句 → 事件 → 数字，逐段滑入
   ============================================================ */
@keyframes sectionReveal {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.yearend-header {
  animation: sectionReveal 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s both;
}
.divider {
  animation: sectionReveal 0.4s ease-out 0.14s both;
}
.section-quote {
  animation: sectionReveal 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
}
.section-events {
  animation: sectionReveal 0.45s ease-out 0.34s both;
}
.section-achievement {
  animation: sectionReveal 0.4s ease-out 0.46s both;
}
.section-numbers {
  animation: sectionReveal 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.56s both;
}
.yearend-footer {
  animation: sectionReveal 0.4s ease-out 0.72s both;
}
@media (prefers-reduced-motion: reduce) {
  .yearend-header,
  .divider,
  .section-quote,
  .section-events,
  .section-achievement,
  .section-numbers,
  .yearend-footer {
    animation: none;
  }
}

/* 分区标题条 */
.section-header {
  text-align: center;
  padding-bottom: 6px;
  margin-bottom: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.section-tag {
  font-size: 10px;
  letter-spacing: 3px;
  font-weight: bold;
  display: inline-block;
  padding: 0 8px;
}

.section-quote .section-tag {
  color: #ff2d95;
  text-shadow: 0 0 6px #ff2d95, 0 0 12px rgba(255, 45, 149, 0.5);
  border: 1px solid rgba(255, 45, 149, 0.15);
  padding: 2px 10px;
}

.section-events .section-tag {
  color: #00d4ff;
  text-shadow: 0 0 6px #00d4ff;
  border: 1px solid rgba(0, 212, 255, 0.12);
  padding: 2px 10px;
}

.section-numbers .section-tag {
  color: #00ff88;
  text-shadow: 0 0 6px #00ff88;
  border: 1px solid rgba(0, 255, 136, 0.12);
  padding: 2px 10px;
}

/* 无事件占位 */
.no-events-placeholder {
  text-align: center;
  padding: 10px 0;
}

.no-events-text {
  font-size: 12px;
  color: #5f6b7a;
  letter-spacing: 2px;
  font-style: italic;
}

/* ============================================================
   里程碑区域
   ============================================================ */
.milestone-section {
  position: relative;
  z-index: 2;
  padding: 14px 14px;
  background: linear-gradient(135deg, rgba(201, 0, 255, 0.06), rgba(0, 212, 255, 0.04));
  border: 1px solid rgba(201, 0, 255, 0.2);
  box-shadow: inset 0 0 12px rgba(201, 0, 255, 0.06);
}
.milestone-section::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(201, 0, 255, 0.3), transparent);
  pointer-events: none;
}

.milestone-line {
  margin: 0 0 8px 0;
  font-size: 13px;
  line-height: 1.85;
  color: #e0d4f0;
  text-shadow: 0 0 3px rgba(201, 0, 255, 0.2);
  word-break: break-word;
}

/* 第一行（标题行）特殊样式 */
.milestone-line:first-child {
  font-size: 14px;
  color: #ffec27;
  text-shadow: 0 0 6px rgba(255, 236, 39, 0.4);
  text-align: center;
  letter-spacing: 2px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 236, 39, 0.15);
}

/* 最后一行（收尾感慨）特殊样式 */
.milestone-line:last-child {
  margin-bottom: 0;
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px solid rgba(201, 0, 255, 0.15);
  color: #c0e0ff;
  font-style: italic;
  text-align: center;
}

/* ============================================================
   分区一：年度金句区 - 大号居中霓虹引号样式
   ============================================================ */
.main-event-section {
  position: relative;
  z-index: 2;
  text-align: center;
  padding: 8px 8px 4px;
}

.main-event-text {
  margin: 0;
  font-size: 20px;
  line-height: 1.8;
  color: #ffe0f0;
  font-family: 'DotGothic16', monospace;
  position: relative;
  display: inline-block;
  max-width: 95%;
  text-shadow:
    0 0 6px #ff2d95,
    0 0 14px rgba(255, 45, 149, 0.6),
    0 0 28px rgba(255, 45, 149, 0.3);
  animation: quoteGlow 3s ease-in-out infinite;
  font-weight: 500;
  letter-spacing: 0.5px;
}

@keyframes quoteGlow {
  0%, 100% {
    text-shadow: 0 0 6px #ff2d95, 0 0 14px rgba(255, 45, 149, 0.6), 0 0 28px rgba(255, 45, 149, 0.3);
  }
  50% {
    text-shadow: 0 0 10px #ff2d95, 0 0 22px rgba(255, 45, 149, 0.8), 0 0 40px rgba(198, 0, 255, 0.4);
  }
}

.main-event-text::before {
  content: '\201C';
  font-size: 40px;
  line-height: 0;
  color: var(--neon-pink);
  text-shadow: 0 0 8px var(--neon-pink), 0 0 20px var(--neon-pink);
  font-family: Georgia, 'Times New Roman', serif;
  vertical-align: -12px;
  margin-right: 4px;
  user-select: none;
}

.main-event-text::after {
  content: '\201D';
  font-size: 40px;
  line-height: 0;
  color: var(--neon-pink);
  text-shadow: 0 0 8px var(--neon-pink), 0 0 20px var(--neon-pink);
  font-family: Georgia, 'Times New Roman', serif;
  vertical-align: -12px;
  margin-left: 4px;
  user-select: none;
}

/* ============================================================
   岔路口抉择分割窗体（主事件下方，独立展示）
   ============================================================ */
.section-crossroad {
  margin-top: 10px;
  border: 1px solid rgba(255, 136, 0, 0.35);
  border-radius: 6px;
  background: rgba(30, 15, 5, 0.35);
  box-shadow: inset 0 0 20px rgba(255, 136, 0, 0.08);
}

.section-crossroad .section-tag {
  color: var(--neon-orange);
  text-shadow: 0 0 6px var(--neon-orange);
}

.crossroad-story-block {
  position: relative;
  z-index: 2;
  padding: 8px 12px;
}

.crossroad-story-text {
  margin: 0;
  font-size: 13px;
  line-height: 1.8;
  color: #f0d9bd;
  text-align: left;
  white-space: pre-wrap;
  max-height: 160px;
  overflow-y: auto;
  padding-right: 4px;
}

/* ============================================================
   故事流区域（日志风格，事件回顾分区内）
   ============================================================ */
.story-stream {
  position: relative;
  z-index: 2;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.story-line {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 5px 0 5px 12px;
  border-left: 2px solid var(--story-color, #6b8299);
  box-shadow: -2px 0 6px -2px var(--story-color, transparent);
  transition: background 0.15s ease;
}
.story-line:hover {
  background: rgba(255, 255, 255, 0.02);
}

.story-icon {
  flex-shrink: 0;
  font-size: 13px;
  line-height: 1.7;
  filter: drop-shadow(0 0 3px var(--story-color, transparent));
  width: 14px;
  text-align: center;
}

.story-text {
  font-size: 12px;
  line-height: 1.7;
  color: #9fb3c8;
  text-shadow: none;
  word-break: break-word;
  flex: 1;
}

.fold-arrow {
  font-size: 10px;
  transition: transform 0.2s ease;
}

@keyframes foldExpand {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 2000px;
  }
}

/* ============================================================
   财务数字区域（数字总结分区内）
   ============================================================ */
.finance-section.compact {
  position: relative;
  z-index: 2;
  padding: 12px 10px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.3) 100%);
  border: 1px solid rgba(0, 255, 136, 0.15);
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.3);
}

.finance-compact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 6px;
}

/* ── 年结余核心主打卡 ── */
.finance-hero {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 18px 12px 14px;
  margin-bottom: 8px;
  overflow: hidden;
  border: 1px solid;
}
.finance-hero::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  pointer-events: none;
}
.finance-hero::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.08) 0%, transparent 70%);
}

.finance-hero.hero-gain {
  border-color: rgba(0, 255, 136, 0.4);
  background: linear-gradient(180deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 255, 136, 0.02) 100%);
  box-shadow: inset 0 0 20px rgba(0, 255, 136, 0.08), 0 0 14px rgba(0, 255, 136, 0.12);
}
.finance-hero.hero-gain::before {
  background: linear-gradient(90deg, transparent, #00ff88, transparent);
}
.finance-hero.hero-loss {
  border-color: rgba(255, 45, 149, 0.4);
  background: linear-gradient(180deg, rgba(255, 45, 149, 0.1) 0%, rgba(255, 45, 149, 0.02) 100%);
  box-shadow: inset 0 0 20px rgba(255, 45, 149, 0.08), 0 0 14px rgba(255, 45, 149, 0.12);
}
.finance-hero.hero-loss::before {
  background: linear-gradient(90deg, transparent, #ff2d95, transparent);
}

.hero-label {
  font-size: 11px;
  letter-spacing: 4px;
  color: #8ab0c8;
  text-shadow: 0 0 4px rgba(0, 212, 255, 0.3);
}

.hero-value {
  font-size: 34px;
  line-height: 1.1;
  font-weight: bold;
  letter-spacing: 1px;
  position: relative;
  z-index: 1;
  animation: heroPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both;
}
.hero-value.hero-big {
  font-size: 40px;
}
.hero-gain .hero-value {
  color: #00ff88;
  text-shadow: 0 0 8px #00ff88, 0 0 20px rgba(0, 255, 136, 0.7), 0 0 40px rgba(0, 255, 136, 0.4);
}
.hero-loss .hero-value {
  color: #ff2d95;
  text-shadow: 0 0 8px #ff2d95, 0 0 20px rgba(255, 45, 149, 0.7), 0 0 40px rgba(255, 45, 149, 0.4);
}

@keyframes heroPop {
  0% { transform: scale(0.4); opacity: 0; }
  55% { transform: scale(1.18); opacity: 1; }
  75% { transform: scale(0.96); }
  100% { transform: scale(1); opacity: 1; }
}

.finance-compact-grid .finance-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 6px 6px;
  background: linear-gradient(180deg, rgba(10, 5, 30, 0.6) 0%, rgba(10, 5, 30, 0.4) 100%);
  border: 1px solid rgba(201, 0, 255, 0.15);
  position: relative;
  overflow: hidden;
}
.finance-compact-grid .finance-item::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(201, 0, 255, 0.2), transparent);
  pointer-events: none;
}

.finance-compact-grid .finance-label {
  font-size: 10px;
  color: #94b0c2;
  letter-spacing: 1px;
}

.finance-compact-grid .finance-value {
  font-weight: bold;
  font-size: 13px;
  letter-spacing: 0.5px;
}

.finance-sub {
  font-size: 10px;
  font-weight: normal;
  letter-spacing: 0;
  margin-top: -1px;
}

.unit-label {
  color: #7a95a8;
  font-size: 10px;
}

.val-green {
  color: #00ff88;
  text-shadow: 0 0 6px #00ff88, 0 0 12px rgba(0, 255, 136, 0.5);
}

.val-red {
  color: #ff2d95;
  text-shadow: 0 0 6px #ff2d95, 0 0 12px rgba(255, 45, 149, 0.5);
}

.val-blue {
  color: #00d4ff;
  text-shadow: 0 0 6px #00d4ff, 0 0 12px rgba(0, 212, 255, 0.5);
}

.val-orange {
  color: #ff8800;
  text-shadow: 0 0 6px #ff8800, 0 0 12px rgba(255, 136, 0, 0.5);
}

/* ============================================================
   身心状态区域（数字总结分区内）
   ============================================================ */
.wellbeing-section.compact {
  position: relative;
  z-index: 2;
  padding: 12px 10px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.3) 100%);
  border: 1px solid rgba(0, 255, 136, 0.15);
}

.wb-compact-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 4px 0;
}

.wb-compact-row .wb-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 6px 14px;
  background: rgba(10, 5, 30, 0.4);
  border: 1px solid rgba(0, 255, 136, 0.08);
}

.wb-compact-row .wb-label {
  color: #94b0c2;
  font-size: 11px;
  letter-spacing: 1px;
}

.wb-compact-row .wb-num {
  font-weight: bold;
  font-size: 15px;
  min-width: 24px;
  text-align: center;
}

.wb-compact-row .wb-delta {
  font-size: 11px;
  font-weight: 500;
}

.delta-up {
  color: #00ff88;
  text-shadow: 0 0 3px rgba(0, 255, 136, 0.4);
}

.delta-down {
  color: #ff2d95;
  text-shadow: 0 0 3px rgba(255, 45, 149, 0.4);
}

.delta-neutral {
  color: #6b8299;
}

/* ============================================================
   明细展开按钮（财务/身心共用）
   ============================================================ */
.detail-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 5px 0;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 212, 255, 0.2);
  color: #7a9bb5;
  font-size: 11px;
  font-family: 'DotGothic16', monospace;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.detail-toggle:hover {
  background: rgba(0, 212, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.4);
  color: #ffffff;
}

.detail-toggle.expanded {
  border-color: rgba(0, 212, 255, 0.4);
  color: #ffffff;
}

/* ============================================================
   财务明细展开区
   ============================================================ */
.finance-detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  animation: foldExpand 0.2s ease-out;
}

.finance-detail-col {
  background: rgba(10, 5, 30, 0.5);
  border: 1px solid rgba(0, 212, 255, 0.12);
  padding: 8px;
}

.detail-col-title {
  font-size: 10px;
  letter-spacing: 2px;
  text-align: center;
  padding-bottom: 6px;
  margin-bottom: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.detail-col-title.income-title {
  color: #00ff88;
  text-shadow: 0 0 4px rgba(0, 255, 136, 0.4);
}

.detail-col-title.expense-title {
  color: #ff8800;
  text-shadow: 0 0 4px rgba(255, 136, 0, 0.4);
}

.detail-col-title.asset-title {
  color: #00d4ff;
  text-shadow: 0 0 4px rgba(0, 212, 255, 0.4);
}

.detail-col-title.salary-title {
  color: #4fc3f7;
  text-shadow: 0 0 4px rgba(79, 195, 247, 0.4);
}

.salary-detail-row .detail-label {
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
}

.salary-source {
  font-weight: bold;
  font-size: 12px;
}

.salary-note {
  font-size: 10px;
  color: #7a95a8;
  font-style: italic;
}

.finance-detail-col.full-width {
  grid-column: 1 / -1;
  border-top: 1px solid rgba(0, 212, 255, 0.2);
  padding-top: 8px;
  margin-top: 4px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 0;
  font-size: 11px;
}

.detail-label {
  color: #94b0c2;
}

.detail-amount {
  font-weight: bold;
  letter-spacing: 0.3px;
}

.detail-row.total-row {
  margin-top: 4px;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-row.total-row .detail-label {
  color: #ffffff;
  font-weight: bold;
}

/* ============================================================
   身心变化明细展开区
   ============================================================ */
.wellbeing-detail {
  background: rgba(10, 5, 30, 0.5);
  border: 1px solid rgba(0, 212, 255, 0.12);
  padding: 8px;
  animation: foldExpand 0.2s ease-out;
}

.wb-detail-header {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1fr;
  gap: 4px;
  padding-bottom: 4px;
  margin-bottom: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 10px;
  color: #7a9bb5;
  letter-spacing: 1px;
  text-align: center;
}

.wb-detail-row {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1fr;
  gap: 4px;
  padding: 3px 0;
  font-size: 11px;
  text-align: center;
}

.wb-detail-col {
  font-variant-numeric: tabular-nums;
}

.wb-detail-col.wb-source {
  text-align: left;
  color: #94b0c2;
}

.wb-detail-row.wb-total-row {
  margin-top: 4px;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: bold;
}

.wb-detail-row.wb-total-row .wb-source {
  color: #ffffff;
}

/* ============================================================
 /* 继续按钮
   ============================================================ */
.yearend-footer {
  position: sticky;
  bottom: 0;
  z-index: 10;
  display: flex;
  justify-content: center;
  padding: 16px 0 10px;
  background: linear-gradient(transparent, rgba(10, 5, 25, 0.95) 30%);
  margin-top: 8px;
  border-top: 1px solid rgba(0, 255, 136, 0.1);
}

.btn-continue {
  font-size: 16px;
  padding: 14px 40px;
  background: rgba(0, 255, 136, 0.1);
  color: #00ff88;
  border: 2px solid #00ff88;
  box-shadow:
    0 0 8px #00ff88,
    0 0 20px rgba(0, 255, 136, 0.4),
    inset 0 0 12px rgba(0, 255, 136, 0.2);
  letter-spacing: 3px;
  font-family: 'DotGothic16', monospace;
  font-weight: bold;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  transition: all 0.15s ease;
  text-shadow: 0 0 6px #00ff88;
  position: relative;
  overflow: hidden;
}

.btn-continue::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px,
    transparent 3px,
    rgba(0, 255, 136, 0.06) 3px,
    rgba(0, 255, 136, 0.06) 4px
  );
  pointer-events: none;
}

.btn-continue::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(90deg,
    transparent,
    rgba(255, 255, 255, 0.12),
    transparent);
  animation: btnSweep 2.5s ease-in-out infinite;
}

@keyframes btnSweep {
  0% { left: -100%; }
  60% { left: 120%; }
  100% { left: 120%; }
}

.btn-continue:hover:not(:disabled) {
  background: rgba(0, 255, 136, 0.2);
  color: #fff;
  border-color: #00ff88;
  box-shadow:
    0 0 12px #00ff88,
    0 0 28px rgba(0, 255, 136, 0.6),
    0 0 50px rgba(0, 212, 255, 0.3),
    inset 0 0 16px rgba(0, 255, 136, 0.3);
  text-shadow: 0 0 8px #00ff88, 0 0 16px #00ff88;
  transform: translateY(-2px);
}

.btn-continue:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow:
    0 0 6px #00ff88,
    0 0 14px rgba(0, 255, 136, 0.5),
    inset 0 0 10px rgba(0, 255, 136, 0.3);
}

.btn-arrow {
  animation: arrowPulse 0.8s ease-in-out infinite;
}

@keyframes arrowPulse {
  0%, 100% { transform: translateX(0); opacity: 1; }
  50% { transform: translateX(4px); opacity: 0.6; }
}

/* ============================================================
   收支结构像素占比条
   ============================================================ */
.flow-bar {
  margin-top: 8px;
  padding: 8px 10px;
  background: rgba(10, 5, 30, 0.4);
  border: 1px solid rgba(0, 212, 255, 0.12);
}

.flow-bar-track {
  display: flex;
  height: 10px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.4);
}

.flow-seg {
  height: 100%;
  transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.flow-income {
  background: repeating-linear-gradient(
    0deg,
    #00ff88 0px,
    #00ff88 2px,
    transparent 2px,
    transparent 4px
  );
  box-shadow: 0 0 6px rgba(0, 255, 136, 0.5);
}
.flow-expense {
  background: repeating-linear-gradient(
    0deg,
    #ff2d95 0px,
    #ff2d95 2px,
    transparent 2px,
    transparent 4px
  );
  box-shadow: 0 0 6px rgba(255, 45, 149, 0.5);
}

.flow-legend {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 6px;
  font-size: 10px;
  color: #94b0c2;
}

.flow-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.flow-legend-item b {
  color: #fff;
  font-weight: bold;
  letter-spacing: 0.3px;
}

.dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  display: inline-block;
}
.dot-in {
  background: #00ff88;
  box-shadow: 0 0 4px rgba(0, 255, 136, 0.6);
}
.dot-ex {
  background: #ff2d95;
  box-shadow: 0 0 4px rgba(255, 45, 149, 0.6);
}

/* ============================================================
   继续按钮：右对齐 + 仪式感
   ============================================================ */
.yearend-footer {
  justify-content: flex-end;
}

/* ============================================================
   里程碑年：金色主题统一（标题/金句/主打卡/按钮）
   ============================================================ */
.yearend-panel.milestone .age-num {
  color: #ffec27;
  text-shadow: 0 0 8px #ffec27, 0 0 20px #ff8800, 0 0 40px rgba(255, 136, 0, 0.5);
}
.yearend-panel.milestone .age-unit {
  color: #ffec27;
  text-shadow: 0 0 6px #ffec27;
}
.yearend-panel.milestone .age-star {
  color: #ffec27;
  text-shadow: 0 0 8px #ffec27;
}
.yearend-panel.milestone .main-event-text {
  color: #fff6d8;
  text-shadow: 0 0 6px #ffec27, 0 0 16px rgba(255, 236, 39, 0.6), 0 0 32px rgba(255, 136, 0, 0.3);
}
.yearend-panel.milestone .hero-gain .hero-value,
.yearend-panel.milestone .hero-loss .hero-value {
  color: #ffec27;
  text-shadow: 0 0 8px #ffec27, 0 0 20px rgba(255, 136, 0, 0.7), 0 0 40px rgba(255, 236, 39, 0.4);
}
.yearend-panel.milestone .btn-continue {
  color: #ffec27;
  border-color: #ffec27;
  background: rgba(255, 236, 39, 0.1);
  box-shadow: 0 0 8px #ffec27, 0 0 20px rgba(255, 236, 39, 0.4), inset 0 0 12px rgba(255, 236, 39, 0.2);
  text-shadow: 0 0 6px #ffec27;
}

/* ============================================================
   成就解锁：强视觉闪光过场
   ============================================================ */
.section-achievement {
  animation: achievementFlash 0.9s ease-out 0.46s both;
}
@keyframes achievementFlash {
  0% { opacity: 0; transform: scale(0.92); box-shadow: 0 0 0 rgba(255, 236, 39, 0); }
  30% { opacity: 1; transform: scale(1.03); box-shadow: 0 0 40px rgba(255, 236, 39, 0.7); }
  100% { opacity: 1; transform: scale(1); box-shadow: 0 0 18px rgba(255, 236, 39, 0.3); }
}

/* 盲盒揭晓：彩色揭示动画 */
.story-line.story-type-blindbox {
  animation: bbReveal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes bbReveal {
  0% { opacity: 0; transform: translateX(-8px); background: rgba(201, 0, 255, 0.25); }
  60% { opacity: 1; transform: translateX(2px); background: rgba(201, 0, 255, 0.12); }
  100% { opacity: 1; transform: translateX(0); background: transparent; }
}

/* ============================================================
   移动端适配
   ============================================================ */
@media (max-width: 520px) {
  .yearend-panel {
    padding: 20px 12px;
  }
  .age-num {
    font-size: 36px;
  }
  .hero-value {
    font-size: 28px;
  }
  .hero-value.hero-big {
    font-size: 32px;
  }
  .hero-label {
    letter-spacing: 2px;
  }
  .finance-compact-grid {
    grid-template-columns: 1fr 1fr 1fr;
    gap: 4px;
  }
  .finance-compact-grid .finance-item {
    padding: 6px 2px;
  }
  .finance-compact-grid .finance-value {
    font-size: 12px;
  }
  .flow-legend {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

.btn-text {
  position: relative;
  z-index: 1;
}

/* ============================================================
   成就解锁区域（绿色霓虹，分区二点五）
   ============================================================ */
.section-achievement {
  padding: 16px 12px;
  background: linear-gradient(135deg, rgba(0, 255, 136, 0.08) 0%, rgba(0, 255, 136, 0.03) 100%);
  border: 1px solid rgba(0, 255, 136, 0.3);
  box-shadow: inset 0 0 16px rgba(0, 255, 136, 0.08), 0 0 12px rgba(0, 255, 136, 0.15);
  animation: achievementSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}
.section-achievement::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 255, 136, 0.4), transparent);
  pointer-events: none;
}

@keyframes achievementSlideIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.achievement-tag {
  color: #00ff88;
  text-shadow: 0 0 6px #00ff88, 0 0 14px rgba(0, 255, 136, 0.5);
  animation: achievementTagPulse 2s ease-in-out infinite;
}

@keyframes achievementTagPulse {
  0%, 100% { text-shadow: 0 0 6px #00ff88, 0 0 14px rgba(0, 255, 136, 0.5); }
  50% { text-shadow: 0 0 10px #00ff88, 0 0 22px rgba(0, 255, 136, 0.8), 0 0 36px rgba(0, 255, 136, 0.3); }
}

.achievement-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px 4px;
  text-align: center;
}

.achievement-badge-large {
  font-size: 28px;
  color: #00ff88;
  text-shadow: 0 0 10px #00ff88, 0 0 20px #00ff88;
  animation: badgeGlowLarge 2s ease-in-out infinite;
}

@keyframes badgeGlowLarge {
  0%, 100% { text-shadow: 0 0 10px #00ff88, 0 0 20px #00ff88; }
  50% { text-shadow: 0 0 14px #00ff88, 0 0 28px #00ff88, 0 0 40px rgba(0, 255, 136, 0.5); }
}

.achievement-title-large {
  margin: 0;
  font-size: 18px;
  color: #fff;
  letter-spacing: 2px;
  text-shadow: 0 0 6px #00ff88;
}

.achievement-narrative-large {
  font-size: 13px;
  color: #c8e6c9;
  line-height: 1.8;
  max-width: 440px;
}

.achievement-narrative-large p {
  margin: 0;
}

.achievement-narrative-large p + p {
  margin-top: 6px;
}

/* ============================================================
   响应式微调
   ============================================================ */
@media (max-width: 520px) {
  .yearend-panel {
    padding: 20px 14px;
  }

  .yearend-scroll {
    gap: 10px;
  }

  .main-event-text {
    font-size: 16px;
  }

  .finance-compact-grid {
    grid-template-columns: 1fr 1fr;
  }

  .wb-compact-row {
    flex-wrap: wrap;
    gap: 8px;
  }
  .wb-compact-row .wb-item {
    padding: 4px 10px;
  }

  .section-quote,
  .section-events,
  .section-numbers {
    padding: 10px 8px;
  }

  .btn-continue {
    font-size: 14px;
    padding: 12px 28px;
  }
}

/* ============================================================
   横屏设备适配（PC / 平板横屏，宽度 > 1000px）
   改为横向带状布局：顶部条 / 叙事横幅 / 事件流 / 数据条 / 底部
   ============================================================ */
@media (min-width: 1000px) {
  .yearend-overlay {
    padding: 24px;
  }

  /* 面板：居中、内容自适应宽度（不占全屏），超高时整体滚动 */
  .yearend-panel {
    width: min(100%, 940px);
    max-height: calc(100% - 48px);
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    padding: 22px 26px 18px;
  }

  .yearend-scroll {
    gap: 14px;
    overflow-y: auto;
    overflow-x: hidden;
  }

  /* 顶部条：年龄 + 运势签，居中 */
  .yd-topbar {
    flex-wrap: nowrap;
    justify-content: center;
    gap: 18px;
    padding: 0 4px 14px;
    border-bottom: 1px solid rgba(201, 0, 255, 0.16);
  }
  .yd-ageblock { flex: 0 0 auto; }
  .yd-topdivider { width: 1px; }
  .yd-monologue { flex: 1 1 auto; justify-content: center; }

  /* 竖屏用的分割线在横向布局里不再需要 */
  .divider { display: none; }

  /* 左右两块：左叙事 / 右事件+数据 */
  .yd-cols {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 22px;
    align-items: start;
  }
  .yd-col-left { gap: 14px; }
  .yd-col-right { gap: 14px; min-width: 0; }

  /* ============================================================
     归类框架：左「故事」/ 右「数据」标题 + 配色统一
     ============================================================ */
  .yd-cat-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 14px;
    position: relative;
    overflow: hidden;
    border-radius: 4px;
  }
  .cat-story {
    background: linear-gradient(90deg, rgba(255, 45, 149, 0.16) 0%, rgba(255, 45, 149, 0.03) 100%);
    border: 1px solid rgba(255, 45, 149, 0.35);
    box-shadow: inset 0 0 18px rgba(255, 45, 149, 0.12);
  }
  .cat-data {
    background: linear-gradient(90deg, rgba(0, 212, 255, 0.16) 0%, rgba(0, 212, 255, 0.03) 100%);
    border: 1px solid rgba(0, 212, 255, 0.35);
    box-shadow: inset 0 0 18px rgba(0, 212, 255, 0.12);
  }
  .cat-story::before,
  .cat-data::before {
    content: '';
    position: absolute;
    top: 0; bottom: 0;
    left: 0;
    width: 3px;
  }
  .cat-story::before { background: #ff2d95; box-shadow: 0 0 10px #ff2d95; }
  .cat-data::before { background: #00d4ff; box-shadow: 0 0 10px #00d4ff; }
  .cat-mark { font-size: 14px; }
  .cat-story .cat-mark { color: #ff2d95; text-shadow: 0 0 8px #ff2d95; }
  .cat-data .cat-mark { color: #00d4ff; text-shadow: 0 0 8px #00d4ff; }
  .cat-title {
    font-size: 15px;
    font-weight: bold;
    letter-spacing: 2px;
    color: #fff;
  }
  .cat-story .cat-title { text-shadow: 0 0 8px rgba(255, 45, 149, 0.6); }
  .cat-data .cat-title { text-shadow: 0 0 8px rgba(0, 212, 255, 0.6); }
  .cat-en {
    margin-left: auto;
    font-size: 9px;
    letter-spacing: 2px;
    color: rgba(255, 255, 255, 0.4);
  }

  /* 数据子分类标签 */
  .yd-sub-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 2px 6px;
    border-bottom: 1px dashed rgba(0, 212, 255, 0.22);
  }
  .sub-mark { color: #00d4ff; font-size: 11px; }
  .sub-title { font-size: 11px; letter-spacing: 2px; color: #9fd9ea; }

  /* 左栏「故事」区：岔路口、成就统一为粉色主题 */
  .yd-col-left .section-crossroad {
    border: 1px solid rgba(255, 45, 149, 0.35);
    background: rgba(30, 5, 20, 0.35);
    box-shadow: inset 0 0 20px rgba(255, 45, 149, 0.08);
  }
  .yd-col-left .section-crossroad .section-tag {
    color: #ff2d95;
    text-shadow: 0 0 6px #ff2d95, 0 0 12px rgba(255, 45, 149, 0.5);
    border-color: rgba(255, 45, 149, 0.15);
  }
  .yd-col-left .section-achievement {
    background: linear-gradient(135deg, rgba(255, 45, 149, 0.08) 0%, rgba(255, 45, 149, 0.03) 100%);
    border: 1px solid rgba(255, 45, 149, 0.3);
    box-shadow: inset 0 0 16px rgba(255, 45, 149, 0.08), 0 0 12px rgba(255, 45, 149, 0.15);
  }
  .yd-col-left .section-achievement::before {
    background: linear-gradient(90deg, transparent, rgba(255, 45, 149, 0.4), transparent);
  }
  .yd-col-left .section-achievement .section-tag {
    color: #ff2d95;
    text-shadow: 0 0 6px #ff2d95, 0 0 14px rgba(255, 45, 149, 0.5);
    border-color: rgba(255, 45, 149, 0.15);
  }
  .yd-col-left .achievement-badge-large {
    color: #ff2d95;
    text-shadow: 0 0 10px #ff2d95, 0 0 20px #ff2d95;
  }
  .yd-col-left .achievement-title-large {
    text-shadow: 0 0 6px #ff2d95;
  }
  .yd-col-left .achievement-narrative-large {
    color: #f0d9e8;
  }

  /* 右栏「数据」区：数据总览统一为青色主题 */
  .yd-col-right .yd-data {
    background: linear-gradient(180deg, rgba(0, 212, 255, 0.04) 0%, rgba(0, 212, 255, 0.01) 100%);
    border: 1px solid rgba(0, 212, 255, 0.18);
  }
  .yd-col-right .yd-stat {
    background: linear-gradient(180deg, rgba(0, 212, 255, 0.06) 0%, rgba(0, 212, 255, 0.02) 100%);
    border: 1px solid rgba(0, 212, 255, 0.2);
  }
  .yd-col-right .yd-stat::after {
    background: linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.3), transparent);
  }

  /* 叙事金句横幅（可读性放大，行长舒适） */
  .yd-col-left .section-quote {
    padding: 16px 18px 14px;
  }
  .main-event-text { font-size: 15px; line-height: 1.8; }

  /* 事件回顾（左栏故事区）：粉色故事主题 */
  .yd-col-left .yd-log {
    gap: 8px;
    padding: 14px 16px;
    background: linear-gradient(180deg, rgba(255, 45, 149, 0.04) 0%, rgba(255, 45, 149, 0.01) 100%);
    border: 1px solid rgba(255, 45, 149, 0.18);
  }
  .yd-col-left .yd-log .section-tag {
    color: #ff2d95;
    text-shadow: 0 0 6px #ff2d95;
    border-color: rgba(255, 45, 149, 0.15);
  }
  .yd-log .story-stream { padding: 4px 2px; }
  .story-line { padding: 4px 0 4px 14px; }
  .story-text { font-size: 13px; line-height: 1.75; }

  /* 财务概览（右栏数据区顶部） */
  .yd-finance {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px 16px;
    background: linear-gradient(180deg, rgba(0, 212, 255, 0.05) 0%, rgba(0, 212, 255, 0.01) 100%);
    border: 1px solid rgba(0, 212, 255, 0.22);
    box-shadow: inset 0 0 18px rgba(0, 212, 255, 0.05);
  }
  .yd-finance .finance-hero {
    padding: 12px 14px;
    margin-bottom: 0;
  }
  .yd-finance .yd-kpis {
    flex-wrap: nowrap;
    gap: 8px;
    justify-content: stretch;
  }
  .yd-finance .kpi {
    flex: 1 1 0;
    min-width: 0;
    padding: 10px 8px;
  }
  .yd-finance .kpi-value { font-size: 15px; }

  /* 数据：统计卡横向 */
  .yd-col-right .yd-data {
    gap: 10px;
    padding: 14px 16px;
    background: linear-gradient(180deg, rgba(0, 212, 255, 0.04) 0%, rgba(0, 212, 255, 0.01) 100%);
    border: 1px solid rgba(0, 212, 255, 0.18);
  }
  .yd-stats { flex-wrap: nowrap; gap: 8px; }
  .yd-stat { min-width: 0; padding: 8px 10px; }
  .yd-stat-value { font-size: 16px; }
  .flow-bar { margin-top: 2px; padding: 6px 8px; }

  /* 底部条 */
  .yearend-footer {
    justify-content: flex-end;
    padding: 14px 0 0;
    border-top: 1px solid rgba(0, 255, 136, 0.1);
  }

  /* 顶部标题区紧凑化 */
  .age-hero { padding: 2px 0; }
  .age-num { font-size: 38px; }

  /* 顶部 KPI 紧凑 */
  .kpi { min-width: 84px; padding: 6px 12px; }
  .kpi-value { font-size: 15px; }

  /* 年结余主打卡紧凑 */
  .finance-hero { padding: 10px 14px 8px; margin-bottom: 0; }
  .hero-value { font-size: 30px; }
  .hero-value.hero-big { font-size: 34px; }

  .btn-continue { padding: 12px 36px; }
}
</style>
