// life-fun.ts — 结局趣味结算数据计算器
//
// 玩法全部基于 GameState 真实数据确定性推导（无随机、可解释）：
//   1. 数字人生卡片墙（融合"退休购买力"与"一生数字标语"为统一翻牌卡片）
//   2. 成就徽章墙（人生奇葩成就，达成点亮 / 未达成灰暗）
//   3. 身体损耗结算单（反套路体检报告，黑色幽默吐槽）

import type { GameState } from '../types/global.d.js'
import { getDream, type RetirementDreamDef } from '../data/retirement-dreams.js'
import { getPath } from '../data/retirement-paths.js'
import { calculateTotalWealth } from './math-engine.js'

/** 大数字格式化：亿 / 万 / 元 */
export function fmtBig(n: number): string {
  if (n >= 1_0000_0000) return (n / 1_0000_0000).toFixed(1) + '亿'
  if (n >= 1000_0000) return (n / 100_00).toFixed(0) + '万'
  if (n >= 100_0000) return (n / 100_00).toFixed(1) + '万'
  if (n >= 1_0000) return Math.floor(n / 1_0000) + '万'
  return String(Math.floor(n))
}

// ================================================================
//  1. 数字人生卡片墙（退休购买力 + 一生数字标语 融合）
// ================================================================
export interface ConversionCard {
  emoji: string
  title: string   // 卡片名（正面）
  number: string  // 大数字
  unit: string
  joke: string    // 背面梗
  cls: string     // 卡片主题色
  tag: string     // 来源角标：'💎 退休后' / '🙌 这一生'
}

/** 退休购买力：净资产能换多少梦想（基于退休梦想 items）
 * 净资产统一口径 = calculateTotalWealth（现金+房产+链上+生科+店铺+被动收入资本化） */
function dreamCards(state: GameState, dream: RetirementDreamDef | null): ConversionCard[] {
  const net = Math.max(0, calculateTotalWealth(state))

  if (net <= 0) {
    return [
      { emoji: '💸', title: '净资产', number: '0', unit: '元', joke: '梦碎了，打工去', cls: 'danger', tag: '💎 退休后' },
      { emoji: '🏃', title: '还得打工', number: '∞', unit: '年', joke: '梦想先存着吧', cls: 'danger', tag: '💎 退休后' },
      { emoji: '🪦', title: '退休', number: 'NO', unit: '', joke: '梦想是奢侈品', cls: 'danger', tag: '💎 退休后' },
    ]
  }

  if (!dream) {
    return [
      { emoji: '💰', title: '存款', number: fmtBig(net), unit: '元', joke: '数字而已', cls: 'green', tag: '💎 退休后' },
      { emoji: '🍚', title: '够吃饭', number: fmtBig(Math.floor(net / 30)), unit: '天', joke: '民以食为天', cls: 'orange', tag: '💎 退休后' },
      { emoji: '🏠', title: '总资产', number: fmtBig(net), unit: '元', joke: '还行吧', cls: 'cyan', tag: '💎 退休后' },
    ]
  }

  // 只取精选3个（最有梗/最震撼），若该梦想未标记精彩则退化为取前3个
  const featured = dream.items.filter((i) => i.featured)
  const picked = featured.length >= 3 ? featured : dream.items.slice(0, 3)
  const cardColors = ['orange', 'pink', 'cyan', 'purple', 'green', 'yellow']
  return picked.map((item, i) => {
    const count = Math.floor(net / item.unitPrice)
    return {
      emoji: item.emoji,
      title: item.title,
      number: fmtBig(count),
      unit: item.unit,
      joke: pickJoke(item.jokes, count),
      cls: cardColors[i % cardColors.length],
      tag: '💎 退休后',
    }
  })
}

/** Fisher-Yates 洗牌：返回打乱后的新数组（不修改原数组） */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 一生数字标语：把一生累计的收入/开销换算成有梗实体，每次随机抽取 6 张 */
function lifetimeCards(state: GameState): ConversionCard[] {
  const totalSalary = state.lifetimeSalary || 0
  const totalExpense =
    (state.lifetimeLivingCost || 0) +
    (state.lifetimeMortgage || 0) +
    (state.lifetimeChildCost || 0) +
    (state.lifetimeParentCost || 0) +
    (state.lifetimeMedicalCost || 0) +
    (state.lifetimeCardCost || 0) +
    (state.lifetimeGiftMoney || 0) +
    (state.lifetimeInsuranceCost || 0)
  const workYears = state.totalYearsWorked || 0
  const unemployedYears = state.totalUnemployedYears || 0
  const mortgage = state.lifetimeMortgage || 0
  const childCost = state.lifetimeChildCost || 0
  const parentCost = state.lifetimeParentCost || 0
  const giftMoney = state.lifetimeGiftMoney || 0
  const insurance = state.lifetimeInsuranceCost || 0
  const cardCost = state.lifetimeCardCost || 0
  const sideHustle = state.lifetimeSideHustle || 0
  const net = Math.max(0, (state.currentSavings || 0) + (state.propertyValue || 0))

  const colorPool = ['yellow', 'pink', 'cyan', 'purple', 'green', 'orange']
  let colorIdx = 0
  const nextColor = () => colorPool[colorIdx++ % colorPool.length]

  // 候选池：每张卡 = 触发条件 + 构建函数（数据真实、条件满足才可入选）
  const candidates: { test: boolean; build: () => ConversionCard }[] = [
    // 工资 → 茶叶蛋，垒起来=珠峰
    {
      test: totalSalary > 0,
      build: () => {
        const eggs = Math.floor(totalSalary / 2)
        const everest = Math.floor((eggs * 0.05) / 8848)
        return {
          emoji: '🥚', title: '一生的工资', number: fmtBig(eggs), unit: '个茶叶蛋',
          joke: everest >= 1 ? `垒起来 ≈ ${fmtBig(everest)} 座珠穆朗玛峰` : '也就一箩筐的命',
          cls: nextColor(), tag: '🙌 这一生',
        }
      },
    },
    // 总开销 → 顶配 iPhone
    {
      test: totalExpense > 0,
      build: () => {
        const phones = Math.floor(totalExpense / 12000)
        return {
          emoji: '🍱', title: '一生的花销', number: fmtBig(phones), unit: '台顶配iPhone',
          joke: phones >= 1 ? '够把全家几代人的手机都换一遍' : '连台手机都凑不齐',
          cls: nextColor(), tag: '🙌 这一生',
        }
      },
    },
    // 房贷 → 鹤岗神房
    {
      test: mortgage > 0,
      build: () => {
        const houses = Math.floor(mortgage / 150000)
        return {
          emoji: '🏠', title: '交的房贷', number: fmtBig(houses), unit: '套鹤岗神房',
          joke: houses >= 1 ? '够在鹤岗当上整栋楼的房东' : '连鹤岗都买不起',
          cls: nextColor(), tag: '🙌 这一生',
        }
      },
    },
    // 工作年限 → 累计通宵
    {
      test: workYears > 0,
      build: () => {
        const nights = Math.floor(workYears * 365 * 0.15)
        return {
          emoji: '🌙', title: '打工的岁月', number: fmtBig(nights), unit: '个通宵',
          joke: nights >= 365 ? '熬过的夜，能连成一片星空' : '熬夜不多，保重身体',
          cls: nextColor(), tag: '🙌 这一生',
        }
      },
    },
    // 养娃 → 钢琴
    {
      test: childCost > 0,
      build: () => {
        const pianos = Math.floor(childCost / 20000)
        return {
          emoji: '👶', title: '养娃的钱', number: fmtBig(pianos), unit: '架钢琴',
          joke: '每个娃都是行走的钢琴厂',
          cls: nextColor(), tag: '🙌 这一生',
        }
      },
    },
    // 医疗 → 养生壶
    {
      test: (state.lifetimeMedicalCost || 0) > 0,
      build: () => {
        const pots = Math.floor(state.lifetimeMedicalCost! / 500)
        return {
          emoji: '🏥', title: '挂号的钱', number: fmtBig(pots), unit: '个养生壶',
          joke: '早听妈妈的，多喝热水',
          cls: nextColor(), tag: '🙌 这一生',
        }
      },
    },
    // 给父母 → 孝心红包
    {
      test: parentCost > 0,
      build: () => {
        const reds = Math.floor(parentCost / 1000)
        return {
          emoji: '🧧', title: '给父母的钱', number: fmtBig(reds), unit: '个千元红包',
          joke: reds >= 100 ? '爸妈的存折被你塞满了' : '孝心无价，红包有量',
          cls: nextColor(), tag: '🙌 这一生',
        }
      },
    },
    // 份子钱 → 随礼
    {
      test: giftMoney > 0,
      build: () => {
        const gifts = Math.floor(giftMoney / 500)
        return {
          emoji: '🎉', title: '随出去的礼', number: fmtBig(gifts), unit: '个大红包',
          joke: gifts >= 100 ? '你成了朋友圈的"礼金提款机"' : '礼尚往来，肉包子打狗',
          cls: nextColor(), tag: '🙌 这一生',
        }
      },
    },
    // 保险 → 平安符
    {
      test: insurance > 0,
      build: () => {
        const policies = Math.floor(insurance / 3000)
        return {
          emoji: '🛡️', title: '交的保险费', number: fmtBig(policies), unit: '个平安符',
          joke: policies >= 10 ? '你把自己交保成了一个信仰' : '买了份安心，值了',
          cls: nextColor(), tag: '🙌 这一生',
        }
      },
    },
    // 健身卡 → 健身房年卡
    {
      test: cardCost > 0,
      build: () => {
        const years = Math.floor(cardCost / 2000)
        return {
          emoji: '💪', title: '身材投资', number: fmtBig(years), unit: '年健身卡',
          joke: years >= 10 ? '办了卡就是办了，去不去另说' : '办了卡，就当去了',
          cls: nextColor(), tag: '🙌 这一生',
        }
      },
    },
    // 失业 → 躺平
    {
      test: unemployedYears > 0,
      build: () => {
        const days = Math.floor(unemployedYears * 365)
        return {
          emoji: '🛋️', title: '失业躺平', number: fmtBig(days), unit: '天',
          joke: days >= 365 ? '躺出了一片星辰大海' : '偶尔躺躺，有益身心',
          cls: nextColor(), tag: '🙌 这一生',
        }
      },
    },
    // 副业 → 副业收入
    {
      test: sideHustle > 0,
      build: () => {
        const cups = Math.floor(sideHustle / 30)
        return {
          emoji: '☕', title: '副业赚的钱', number: fmtBig(cups), unit: '杯咖啡',
          joke: cups >= 10000 ? '副业撑起了你的咖啡自由' : '主业是生存，副业是梦想',
          cls: nextColor(), tag: '🙌 这一生',
        }
      },
    },
  ]

  // 兜底：若候选不足 6 张且净资产>0，补一张净资产卡
  if (candidates.length < 6 && net > 0) {
    candidates.push({
      test: true,
      build: () => ({
        emoji: '💰', title: '净资产', number: fmtBig(net), unit: '元',
        joke: '钱是数字，快乐是刚需',
        cls: nextColor(), tag: '🙌 这一生',
      }),
    })
  }

  // 过滤满足条件的候选 → 随机打乱 → 抽取前 6 张
  const eligible = candidates.filter((c) => c.test)
  return shuffle(eligible)
    .slice(0, 6)
    .map((c) => c.build())
}

/** 统一数字人生卡片墙：退休购买力 + 一生数字 */
export function generateConversionCards(state: GameState): ConversionCard[] {
  const dream = getDream(state.retirementDream)
  return [...dreamCards(state, dream), ...lifetimeCards(state)]
}

function pickJoke(jokes: [number, string][], val: number): string {
  for (const [threshold, text] of jokes) {
    if (val >= threshold) return text
  }
  return jokes[jokes.length - 1][1]
}

// ================================================================
//  2. 成就徽章墙
// ================================================================
export interface AchievementBadge {
  emoji: string
  name: string
  desc: string
  earned: boolean
}

export function generateAchievements(state: GameState): AchievementBadge[] {
  const net = (state.currentSavings || 0) + (state.propertyValue || 0)
  const friends = (state.friends || []).filter((f) => f.relation > 30).length
  const badges: AchievementBadge[] = []
  const add = (emoji: string, name: string, desc: string, earned: boolean) =>
    badges.push({ emoji, name, desc, earned })

  add('🏆', '财富自由', '存款达标，钱只是数字', net >= (state.targetWealth || 0))
  add('🏠', '有房一族', '从租客升级为房主', !!state.hasProperty)
  add('🚗', '有车一族', '四个轮子的快乐', !!state.hasCar)
  add('🏪', '包租公', '躺着收租的快乐', !!state.hasShop)
  add('💍', '成家立业', '找到了人生合伙人', !!state.isMarried)
  add('👶', '升级奶爸', '人类幼崽饲养员', !!state.hasChild)
  add('🎓', '终身学习', '知识就是力量', !!state.hasMBA)
  add('🧘', '养生达人', '保温杯里泡枸杞', (state.health || 0) >= 70)
  add('💀', '劫后余生', '大难不死必有后福', !!state.hadCriticalIllness)
  add('😵', '高压锅本锅', '压力早就开阀了', (state.stress || 0) >= 70)
  add('🤝', '社交天花板', '好友遍布五湖四海', friends >= 2)
  add('💎', '黄金圣斗士', '乱世买黄金', !!state.hasGold)
  add('🧠', '理财大师', '让钱生钱', !!state.hasStockAccount)
  add('🌍', '地理套利', '在便宜的地方赚你的钱', !!state.isGeoArbitrage)
  add('🐟', '咸鱼翻身', '辞职一时爽，一直辞职一直爽', (state.totalUnemployedYears || 0) >= 3)
  add('⏰', '职场老黄牛', '三十年如一日', (state.totalYearsWorked || 0) >= 25)
  add('🕊️', '提前退休', '比同龄人更早自由', !!state.canRetire)
  add('✨', '精神自由', '独行也自在', !state.isMarried && !state.hasChild)

  return badges
}

// ================================================================
//  3. 身体损耗结算单（反套路体检报告）
// ================================================================
export interface BodyReportItem {
  emoji: string
  part: string
  level: string
  color: string
  note: string
}

export function generateBodyReport(state: GameState): BodyReportItem[] {
  const health = state.health || 0
  const stress = state.stress || 0
  const workYears = state.totalYearsWorked || 0
  const age = state.currentAge || 22
  const items: BodyReportItem[] = []

  // 发际线
  const hair = health >= 80 ? '茂密如初' : health >= 60 ? '略有后退' : '像地中海'
  items.push({
    emoji: '💇',
    part: '发际线',
    level: hair,
    color: health >= 80 ? '#00ff88' : health >= 60 ? '#ff8800' : '#ff004d',
    note: hair === '茂密如初' ? '基因彩票，赢麻了' : hair === '略有后退' ? '熬夜熬出来的' : '风一吹，头皮就凉',
  })

  // 黑眼圈
  const eye = stress >= 70 ? '熊猫级' : stress >= 40 ? '轻度蜡笔' : '神采奕奕'
  items.push({
    emoji: '🐼',
    part: '黑眼圈',
    level: eye,
    color: stress < 40 ? '#00ff88' : stress < 70 ? '#ff8800' : '#ff004d',
    note: eye === '神采奕奕' ? '自带美颜' : eye === '轻度蜡笔' ? '遮瑕膏能救' : '非主流烟熏妆',
  })

  // 颈椎
  const neck = workYears >= 25 ? '富士康级' : workYears >= 15 ? '标准社畜' : '灵活如初'
  items.push({
    emoji: '📱',
    part: '颈椎',
    level: neck,
    color: workYears >= 25 ? '#ff004d' : workYears >= 15 ? '#ff8800' : '#00ff88',
    note: neck === '灵活如初' ? '低头族届清流' : neck === '标准社畜' ? '抬头看天是奢侈' : '低头是职业，抬头是奢望',
  })

  // 腰围
  const waist = stress >= 60 ? '福气满满' : health >= 70 ? '老当益壮' : '仪表得体'
  items.push({
    emoji: '🍺',
    part: '腰围',
    level: waist,
    color: waist === '老当益壮' ? '#00ff88' : waist === '福气满满' ? '#ff8800' : '#94b0c2',
    note: waist === '老当益壮' ? '公园里最能打' : waist === '福气满满' ? '都是福气，不是肥肉' : '还行，继续保持',
  })

  // 膝盖
  const knee = age >= 60 ? '风湿预警' : age >= 50 ? '开始松了' : '还能爬楼'
  items.push({
    emoji: '🦵',
    part: '膝盖',
    level: knee,
    color: knee === '还能爬楼' ? '#00ff88' : knee === '开始松了' ? '#ff8800' : '#ff004d',
    note: knee === '还能爬楼' ? '上十楼不带喘' : knee === '开始松了' ? '阴雨天会预报' : '膝盖比天气预报还准',
  })

  // 心脏
  const heart = stress >= 70 ? '高压锅' : health >= 70 ? '大心脏' : '正常'
  items.push({
    emoji: '❤️',
    part: '心脏',
    level: heart,
    color: heart === '大心脏' ? '#00ff88' : heart === '高压锅' ? '#ff004d' : '#94b0c2',
    note: heart === '大心脏' ? '见过大风大浪' : heart === '高压锅' ? '该放的放放' : '还行，继续蹦跶',
  })

  return items
}

// ================================================================
//  4. 年度人生报告（网易云风格海报，可传播）
//  基于真实数据推导，生成一张"晒得出手"的人生年度总结。
// ================================================================
export interface AnnualReport {
  year: string                      // 结算年份
  title: string                     // 主标题，如"你的人生结算单"
  headline: string                  // 大数字标语（如"挣了 2.3 亿"）
  headlineUnit: string              // 标语单位
  subtitle: string                  // 一句话副标题（黑色幽默）
  core: { label: string; value: string; unit: string; note: string }[]  // 核心数据条
  tags: string[]                    // 人生标签（可传播的身份标签）
  pathName: string                  // 退休路径名
  pathIcon: string                  // 路径图标
  summary: string                   // 结尾金句
}

/** 根据累计数据生成一条"打工人/生活"标签 */
function tagOf(state: GameState): string[] {
  const tags: string[] = []
  const side = state.lifetimeSideHustle || 0
  const child = state.lifetimeChildCost || 0
  const parent = state.lifetimeParentCost || 0
  const gift = state.lifetimeGiftMoney || 0
  const net = Math.max(0, (state.currentSavings || 0) + (state.propertyValue || 0))

  if (side >= 100000) tags.push('斜杠青年')
  if (child >= 500000) tags.push('育儿投资人')
  if (parent >= 200000) tags.push('孝心大户')
  if (gift >= 100000) tags.push('随礼永动机')
  if (net >= 100000000) tags.push('财富自由')
  else if (net >= 5000000) tags.push('小有积蓄')
  else if (net <= 0) tags.push('身无分文')
  if (state.hasProperty) tags.push('有房一族')
  if (state.isMarried) tags.push('已婚')
  if (state.hasChild) tags.push('有娃')
  if (tags.length < 3) tags.push('人生玩家')
  return tags.slice(0, 6)
}

/** 生成年度人生报告 */
export function generateAnnualReport(state: GameState): AnnualReport {
  // 净资产统一口径 = calculateTotalWealth（综合可变现资产），与结算界面"最终净资产"一致
  const net = Math.max(0, calculateTotalWealth(state))
  const salary = state.lifetimeSalary || 0
  const invest = state.lifetimeInvestmentGain || 0
  const side = state.lifetimeSideHustle || 0
  const expense =
    (state.lifetimeLivingCost || 0) +
    (state.lifetimeMortgage || 0) +
    (state.lifetimeChildCost || 0) +
    (state.lifetimeParentCost || 0) +
    (state.lifetimeMedicalCost || 0) +
    (state.lifetimeCardCost || 0) +
    (state.lifetimeGiftMoney || 0) +
    (state.lifetimeInsuranceCost || 0)
  const age = state.currentAge || 60
  const year = 2024 + (age - (state.startAge || 22))

  const path = state.retirementPath ? getPath(state.retirementPath) : null
  const pathName = path?.name || '未知路径'
  const pathIcon = path?.icon || '🎯'

  // 主标语：净资产驱动
  const headline = net >= 100000000 ? fmtBig(net) : net > 0 ? fmtBig(net) : '0'
  const headlineUnit = net >= 100000000 ? '亿 · 净资产' : '元 · 净资产'

  // 核心数据条（全部真实、可传播）
  const core: AnnualReport['core'] = []
  if (salary > 0) core.push({ label: '一生工资', value: fmtBig(salary), unit: '元', note: '打工换来的' })
  if (invest > 0) core.push({ label: '理财收益', value: fmtBig(invest), unit: '元', note: '钱生钱的魔法' })
  if (side > 0) core.push({ label: '副业收入', value: fmtBig(side), unit: '元', note: '主业是生存，副业是梦想' })
  if (expense > 0) core.push({ label: '一生花销', value: fmtBig(expense), unit: '元', note: '有钱也要会花' })
  if (net > 0) core.push({ label: '最终净资产', value: fmtBig(net), unit: '元', note: '留下的底气' })
  // 截取前4条保证版面
  const topCore = core.slice(0, 4)

  // 副标题 + 金句：基于净资产
  let subtitle = ''
  let summary = ''
  if (net >= 100000000) { subtitle = '你把人生玩成了「财富自由」剧本'; summary = '钱是数字，自由是选择的底气。' }
  else if (net >= 5000000) { subtitle = '稳妥人生，攒出了一份小确幸'; summary = '不追求暴富，只求稳稳的幸福。' }
  else if (net >= 1000000) { subtitle = '普通人的一生，也有看得见的答卷'; summary = '不用大富大贵，够用即安。' }
  else { subtitle = '生活不易，但你挺过来了'; summary = '下一段人生，记得先爱自己。' }

  return {
    year: String(year),
    title: '你的人生结算单',
    headline,
    headlineUnit,
    subtitle,
    core: topCore,
    tags: tagOf(state),
    pathName,
    pathIcon,
    summary,
  }
}