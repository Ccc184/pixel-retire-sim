/**
 * 多角度黑箱测试 · 全游戏
 *
 * 以"不知道内部实现"的玩家视角，分两个层面系统检查游戏：
 *
 * 层面一：统计模拟（多路径 × 多轮随机游玩）
 *   A. 数值健康度：NaN/Infinity/状态越界/存款异常跳变
 *   B. 状态一致性：婚姻/伴侣/子女/住房/资产状态矛盾
 *   C. 结局触发：是否在合理年龄触发、是否漏触发/重复触发
 *   D. 平衡性：存款/薪资/压力/健康跨年跳变
 *   E. 路径可达性：6条路径结局分布与胜率
 *
 * 层面二：定向状态注入（针对边界与近期改动）
 *   F. 三硬性终点：60岁封顶 / 破产(负债>30万) / 健康濒死(<20)
 *   G. 自由退休：任何年龄都能退休、getVoluntaryRetirementEnding 给出合理结局
 *   H. 链上重建：归零→废墟之上→又一次废墟、hasAbandonedCrypto 阻止操作
 *   I. 跨城：switchCity 正确应用城市系数
 *   J. 十字路口数值隐藏：showNumericalHints 永久为 false
 */

// ========== Node 环境 polyfill ==========
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
import {
  switchCity as switchCityFx,
  checkEnding,
  getVoluntaryRetirementEnding,
  calculateTotalWealth,
  calculateLiquidWealth,
  checkCanRetire,
  CITY_CONFIGS,
} from '../src/utils/math-engine.js'
import { getPath } from '../src/data/retirement-paths.js'
import { showNumericalHints } from '../src/utils/ui-prefs.js'

setActivePinia(createPinia())

// ============================================================
//  通用工具
// ============================================================
interface Issue {
  severity: 'P0' | 'P1' | 'P2'
  tag: string
  category: string
  description: string
}
const issues: Issue[] = []
function report(severity: Issue['severity'], tag: string, category: string, description: string) {
  issues.push({ severity, tag, category, description })
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

const PATHS = [
  { id: 'ai_symbiote', name: 'AI共生者' },
  { id: 'chain_native', name: '链上原住民' },
  { id: 'digital_nomad', name: '数字游牧民' },
  { id: 'super_ip', name: '超级IP' },
  { id: 'silver_economy', name: '银发收割者' },
  { id: 'bio_gambler', name: '生物赌徒' },
] as const
const CITIES = ['资本修罗场', '中坚大后方', '避风低洼地', '海外低成本'] as const
const PROFESSIONS = ['体制内', '红利行业', '传统私企', '自由职业', '实体创业', '一线蓝领'] as const
const MBTIS = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'] as const
const DREAMS = ['world_traveler', 'farm_hermit', 'lifelong_scholar', 'ultimate_otaku', 'square_dance_king', 'silver_volunteer'] as const

// 玩家选择策略：随机但带生存本能
function playerChoose(event: any, state: any): number {
  const opts = event?.options || []
  if (opts.length === 0) return 0
  const savings = state?.currentSavings ?? 0
  const stress = state?.stress ?? 0
  const health = state?.health ?? 100
  const safe = opts.map((o: any, i: number) => {
    const hint = o.hint || o.description || ''
    let danger = 0
    if (savings < 50000 && /-\s*\d[\d,]*万|存款归零|掏空|借.*高利|负债/.test(hint)) danger += 3
    if (stress > 80 && /压力\s*\+|压力\+|stress\s*\+/.test(hint)) danger += 2
    if (health < 30 && /健康\s*-|健康-|health\s*-/.test(hint)) danger += 2
    return { o, i, danger }
  })
  const safeChoices = safe.filter((x: any) => x.danger === 0)
  const pool = safeChoices.length > 0 ? safeChoices : safe
  return pool[Math.floor(Math.random() * pool.length)].i
}

// ============================================================
//  层面一：统计模拟
// ============================================================
const pathStats: Record<string, { wins: number; loses: number; endings: Record<string, number>; endAges: number[] }> = {}

function runOneSim(pathId: string, pathName: string, runIdx: number) {
  const store = useGameStore()
  store.resetGame()
  store.startNewGame()
  const city = pick(CITIES)
  const profession = pick(PROFESSIONS)
  const salary = pick([8000, 12000, 18000, 25000])
  const mbti = pick(MBTIS)
  const dream = pick(DREAMS)
  store.setupGame(city, profession, salary, 5000000, mbti, dream)
  store.selectRetirementPath(pathId as any)

  const tag = `${pathName}#${runIdx}`
  let prevSavings = store.state.currentSavings
  let prevSalary = store.state.currentMonthlySalary
  let prevStress = store.state.stress
  let prevHealth = store.state.health
  let ended = false
  let endAge = 0
  let endId = ''

  for (let age = 22; age <= 62; age++) {
    const s = store.state
    if (s.endingTriggered) { ended = true; endAge = s.currentAge; endId = s.currentEndingId || ''; break }

    // ---- A. 数值健康度 ----
    const nums: Record<string, number> = {
      savings: s.currentSavings, salary: s.currentMonthlySalary, stress: s.stress,
      happiness: s.happiness, health: s.health, faith: s.pathFaith, passive: s.passiveIncome,
    }
    for (const [k, v] of Object.entries(nums)) {
      if (typeof v !== 'number' || Number.isNaN(v)) report('P0', tag, '数值NaN', `${k}=${v}`)
      if (typeof v === 'number' && !Number.isFinite(v)) report('P0', tag, '数值Infinity', `${k}=${v}`)
    }
    if (s.stress < 0 || s.stress > 100) report('P1', tag, '压力越界', `stress=${s.stress}`)
    if (s.happiness < 0 || s.happiness > 100) report('P1', tag, '幸福越界', `happiness=${s.happiness}`)
    if (s.health < 0 || s.health > 100) report('P1', tag, '健康越界', `health=${s.health}`)
    if (s.pathFaith < 0 || s.pathFaith > 100) report('P1', tag, '信念越界', `faith=${s.pathFaith}`)

    // ---- B. 状态一致性 ----
    if (s.isMarried && !s.partner) report('P1', tag, '婚姻一致性', 'isMarried=true 但 partner=null')
    if (s.isMarried && s.partner?.datingStage === 'single') report('P1', tag, '婚姻一致性', '已婚但 datingStage=single')
    if (s.partner?.hasDivorced && s.isMarried) report('P1', tag, '婚姻一致性', 'hasDivorced=true 但 isMarried=true')
    if (s.currentMortgageCost > 0 && !s.hasProperty) report('P1', tag, '房贷一致性', '有房贷但无房产')
    if (s.hasProperty && s.propertyValue <= 0) report('P2', tag, '房产一致性', '有房产但propertyValue<=0')
    if (s.hasCar && !((s as any).carValue > 0)) report('P2', tag, '车辆一致性', '有车但carValue<=0')
    // 链上持仓安全性：不为负
    if ((s as any).chainHoldings < 0) report('P1', tag, '链上持仓为负', `chainHoldings=${(s as any).chainHoldings}`)
    if ((s as any).bioPortfolio < 0) report('P1', tag, '生科组合为负', `bioPortfolio=${(s as any).bioPortfolio}`)

    // ---- 处理叙事事件 ----
    const event = store.currentNarrativeEvent
    if (event && event.options?.length > 0) {
      const idx = playerChoose(event, s)
      const opt = event.options[idx] || event.options[0]
      store.selectNarrativeOption(opt.id)
    }
    // ---- 处理十字路口 ----
    const crossroad = store.currentCrossroad
    if (crossroad && crossroad.options?.length > 0) {
      const idx = playerChoose(crossroad, s)
      const opt = crossroad.options[idx] || crossroad.options[0]
      store.selectCrossroadOption(opt.id)
    }

    store.commitYear()
    const post = store.state

    // ---- D. 平衡性：存款/薪资/压力/健康跳变 ----
    // 相对阈值：单年存款变化超过"年初存款的3倍"或"绝对5000万"才算异常
    // （后期被动收入复利可达百万/年，绝对值阈值会误报）
    const delta = post.currentSavings - prevSavings
    const jumpBase = Math.max(prevSavings, 100000)
    if (Math.abs(delta) > 50000000 || (Math.abs(delta) > jumpBase * 3 && Math.abs(delta) > 2000000)) {
      report('P1', tag, '存款跳变', `年龄${age} 存款${prevSavings.toLocaleString()}->${post.currentSavings.toLocaleString()} 单年变化${delta.toLocaleString()}`)
    }
    const salaryDeltaPct = prevSalary > 0 ? ((post.currentMonthlySalary - prevSalary) / prevSalary) * 100 : 0
    if (post.currentMonthlySalary > 0 && Math.abs(salaryDeltaPct) > 100 && !post.isUnemployed) {
      report('P2', tag, '薪资跳变', `单年薪资变化${salaryDeltaPct.toFixed(0)}%`)
    }
    if (post.stress - prevStress > 50) report('P2', tag, '压力爆增', `单年压力+${post.stress - prevStress}`)
    if (prevHealth - post.health > 40) report('P2', tag, '健康暴跌', `单年健康-${prevHealth - post.health}`)

    prevSavings = post.currentSavings
    prevSalary = post.currentMonthlySalary
    prevStress = post.stress
    prevHealth = post.health
  }

  const s = store.state
  if (!s.endingTriggered && !ended) {
    report('P1', tag, '结局触发', '62岁仍未触发结局')
  } else {
    const finalEndId = s.currentEndingId || endId
    const finalAge = s.currentAge || endAge
    pathStats[pathName] = pathStats[pathName] || { wins: 0, loses: 0, endings: {}, endAges: [] }
    pathStats[pathName].endings[finalEndId] = (pathStats[pathName].endings[finalEndId] || 0) + 1
    pathStats[pathName].endAges.push(finalAge)
    if (finalEndId.startsWith('path_success')) pathStats[pathName].wins++
    else pathStats[pathName].loses++
  }
}

// ============================================================
//  层面二：定向状态注入
// ============================================================
function testHardEndings() {
  console.log('\n[F] 三硬性终点测试')
  const store = useGameStore()
  store.resetGame(); store.startNewGame()
  store.setupGame('中坚大后方', '传统私企', 8000, 5000000, 'INTJ', 'world_traveler')
  store.selectRetirementPath('digital_nomad')

  // F1: 60岁硬上限
  store.state.currentAge = 60
  store.state.targetAge = 60
  store.state.currentSavings = 100000  // 未达标
  store.state.health = 80
  const ending60 = checkEnding(store.state)
  console.log(`  [F1] 60岁未达标 => 结局: ${ending60} (期望非null, 且非自动成功)`)
  if (ending60 === null) report('P1', 'F1', '60岁封顶', '60岁未达标却未触发结局')

  // F2: 破产（负债超30万且资产无法覆盖）
  store.resetGame(); store.startNewGame()
  store.setupGame('中坚大后方', '传统私企', 8000, 5000000, 'INTJ', 'world_traveler')
  store.selectRetirementPath('digital_nomad')
  store.state.currentAge = 35
  store.state.currentSavings = -320000
  store.state.propertyValue = 0
  store.state.passiveIncome = 0
  store.state.health = 80
  const endingBankrupt = checkEnding(store.state)
  console.log(`  [F2] 负债32万且无资产 => 结局: ${endingBankrupt} (期望E8破产)`)
  if (endingBankrupt !== 'E8') report('P1', 'F2', '破产判定', `负债32万应破产，实际=${endingBankrupt}`)

  // F2b: 有资产覆盖负债则不破产
  store.state.currentSavings = -320000
  store.state.propertyValue = 500000  // 房产覆盖负债
  const endingCovered = checkEnding(store.state)
  console.log(`  [F2b] 负债32万但有50万房产 => 结局: ${endingCovered} (期望null，资产可覆盖不破产)`)
  if (endingCovered === 'E8') report('P1', 'F2b', '破产判定', '有资产覆盖负债却判定破产')

  // F3: 健康濒死（<20）
  store.resetGame(); store.startNewGame()
  store.setupGame('中坚大后方', '传统私企', 8000, 5000000, 'INTJ', 'world_traveler')
  store.selectRetirementPath('digital_nomad')
  store.state.currentAge = 40
  store.state.currentSavings = 500000
  store.state.health = 15
  const endingHealth = checkEnding(store.state)
  console.log(`  [F3] 健康15 => 结局: ${endingHealth} (期望E4健康濒死)`)
  if (endingHealth !== 'E4') report('P1', 'F3', '健康濒死', `健康15应E4，实际=${endingHealth}`)
}

function testFreeRetirement() {
  console.log('\n[G] 自由退休测试（任何年龄都能退休）')
  const store = useGameStore()

  // G1: 22岁刚开局就退休
  store.resetGame(); store.startNewGame()
  store.setupGame('中坚大后方', '传统私企', 8000, 5000000, 'INTJ', 'world_traveler')
  store.selectRetirementPath('digital_nomad')
  store.state.currentAge = 22
  const end22 = getVoluntaryRetirementEnding(store.state)
  console.log(`  [G1] 22岁一无所有退休 => 结局: ${end22} (期望E9平凡或E4悲剧，非空)`)
  if (!end22) report('P1', 'G1', '自由退休', '22岁退休未返回结局')
  if (end22.startsWith('path_success')) report('P1', 'G1', '自由退休', '22岁一无所有却返回成功结局')

  // G2: 财富达标退休返回合理成功结局
  store.resetGame(); store.startNewGame()
  store.setupGame('中坚大后方', '传统私企', 8000, 5000000, 'INTJ', 'world_traveler')
  store.selectRetirementPath('ai_symbiote')
  store.state.currentSavings = 6000000
  store.state.propertyValue = 0
  store.state.health = 80
  store.state.happiness = 80
  store.state.isMarried = false
  const endRich = getVoluntaryRetirementEnding(store.state)
  console.log(`  [G2] 存款600万+高幸福高健康元伴侣 => 结局: ${endRich} (期望E1或path_success)`)
  if (endRich !== 'E1' && !endRich.startsWith('path_success')) {
    report('P1', 'G2', '自由退休', `高财富低标应E1，实际=${endRich}`)
  }

  // G3: 退休按钮始终可用（canRetire 不构成门槛）
  store.resetGame(); store.startNewGame()
  store.setupGame('中坚大后方', '传统私企', 8000, 5000000, 'INTJ', 'world_traveler')
  store.selectRetirementPath('super_ip')
  store.state.currentSavings = 0
  store.state.health = 50
  const canRetirePoor = checkCanRetire(store.state)
  console.log(`  [G3] 存款0的穷玩家 canRetire(财务标记)=${canRetirePoor}（true=已达财富标准，false=未达标但按钮仍可用）`)
  // chooseRetire 不拦截
  const endPoor = getVoluntaryRetirementEnding(store.state)
  console.log(`  [G3b] 存款0穷玩家退休 => 结局: ${endPoor}（按钮可用，给出平凡结局）`)
  if (!endPoor || endPoor.startsWith('path_success')) {
    report('P1', 'G3', '自由退休', '穷玩家退休应返回非成功结局')
  }
}

function testChainRebuild() {
  console.log('\n[H] 链上重建与放弃链上测试')
  const store = useGameStore()
  store.resetGame(); store.startNewGame()
  store.setupGame('中坚大后方', '传统私企', 8000, 5000000, 'INTJ', 'world_traveler')
  store.selectRetirementPath('chain_native')

  // H1: 初始链上持仓为0时，废墟之上条件是否满足
  ;(store.state as any).chainHoldings = 0
  store.state.currentSavings = 100000
  store.state.pathFaith = 50
  const fired = store.state.narrativeEventFired || {}
  console.log(`  [H1] 持仓归零+存款充足+信念50 => 首次废墟条件可达（依赖事件抽取，黑箱配合统计验证）`)

  // H2: 放弃链上后 investPercent 应被阻止（通过事件效果验证 hasAbandonedCrypto）
  ;(store.state as any).hasAbandonedCrypto = true
  const savingsBefore = store.state.currentSavings
  ;(store.state as any).chainHoldings = 0
  // 尝试触发一个 investPercent 效果（用 chain_rebuild 的选项逻辑替代：直接模拟）
  // 这里直接验证 abandon 后年度结算不再给持仓加仓
  const holdingsBeforeAbandon = (store.state as any).chainHoldings || 0
  store.commitYear()
  const holdingsAfterAbandon = (store.state as any).chainHoldings || 0
  console.log(`  [H2] 放弃链上后年度结算持仓: ${holdingsBeforeAbandon} -> ${holdingsAfterAbandon}（期望保持0不再自动加仓）`)
  if (holdingsAfterAbandon !== 0) {
    report('P1', 'H2', '放弃链上', 'hasAbandonedCrypto后持仓仍被自动加仓')
  }

  // H3: 未放弃时，高信念+持仓归零，年度结算不自动加仓（持仓波动仅在>0时计算）
  store.resetGame(); store.startNewGame()
  store.setupGame('中坚大后方', '传统私企', 8000, 5000000, 'INTJ', 'world_traveler')
  store.selectRetirementPath('chain_native')
  ;(store.state as any).chainHoldings = 100000
  store.state.pathFaith = 50
  const hBefore = (store.state as any).chainHoldings
  store.commitYear()
  const hAfter = (store.state as any).chainHoldings
  console.log(`  [H3] 未放弃+持仓10万 年度波动: ${hBefore} -> ${hAfter}（波动范围内合理）`)
  if (hAfter < 0) report('P0', 'H3', '链上持仓', `持仓为负: ${hAfter}`)
}

function testSwitchCity() {
  console.log('\n[I] 跨城测试（switchCity 正确应用城市系数）')
  const store = useGameStore()
  store.resetGame(); store.startNewGame()
  store.setupGame('资本修罗场', '传统私企', 24000, 5000000, 'INTJ', 'world_traveler')
  store.selectRetirementPath('digital_nomad')
  store.state.currentMonthlySalary = 24000
  store.state.careerStartSalary = 24000
  store.state.annualBaseCost = 48000

  const fromConfig = CITY_CONFIGS['资本修罗场']
  const toConfig = CITY_CONFIGS['避风低洼地']
  const ratio = toConfig.salaryMultiplier / fromConfig.salaryMultiplier
  const expectedSalary = Math.round(24000 * ratio)
  const expectedStart = Math.round(24000 * ratio)

  switchCityFx(store.state, '避风低洼地')
  console.log(`  [I1] 资本(24000) -> 避风低洼: 月薪=${store.state.currentMonthlySalary} (期望≈${expectedSalary})`)
  console.log(`  [I2] careerStartSalary=${store.state.careerStartSalary} (期望≈${expectedStart})`)
  console.log(`  [I3] isGeoArbitrage=${store.state.isGeoArbitrage} (期望true)`)
  console.log(`  [I4] 城市=${store.state.currentCity} (期望'避风低洼地')`)

  if (store.state.currentCity !== '避风低洼地') report('P1', 'I', '跨城', '城市未切换')
  if (store.state.currentMonthlySalary !== expectedSalary) report('P1', 'I', '跨城', `月薪系数错误: ${store.state.currentMonthlySalary} != ${expectedSalary}`)
  if (store.state.careerStartSalary !== expectedStart) report('P1', 'I', '跨城', `careerStartSalary系数错误`)
  if (!store.state.isGeoArbitrage) report('P1', 'I', '跨城', '低成本城市未启用地理套利')

  // 反向：从低成本搬到高成本
  const back = CITY_CONFIGS['资本修罗场'].salaryMultiplier / CITY_CONFIGS['避风低洼地'].salaryMultiplier
  const expectedBack = Math.round(expectedSalary * back)
  switchCityFx(store.state, '资本修罗场')
  console.log(`  [I5] 避风 -> 资本: 月薪=${store.state.currentMonthlySalary} (期望≈${expectedBack})`)
  if (store.state.currentMonthlySalary !== expectedBack) report('P1', 'I', '跨城', `反向月薪系数错误`)
}

function testCrossroadHints() {
  console.log('\n[J] 十字路口数值隐藏测试')
  console.log(`  [J1] showNumericalHints=${showNumericalHints.value} (期望false，正式游玩永久隐藏)`)
  if (showNumericalHints.value !== false) report('P1', 'J', '数值隐藏', 'showNumericalHints 未保持 false')
}

// ============================================================
//  main
// ============================================================
function main() {
  const RUNS_PER_PATH = 150
  console.log('='.repeat(70))
  console.log('  多角度黑箱测试 · 全游戏 · 6路径×150轮随机游玩 + 定向注入')
  console.log('='.repeat(70))

  console.log('\n===== 层面一：统计模拟 =====')
  for (const p of PATHS) {
    for (let r = 0; r < RUNS_PER_PATH; r++) runOneSim(p.id, p.name, r)
  }

  // 结局分布
  console.log('\n----- 结局分布 -----')
  for (const p of PATHS) {
    const st = pathStats[p.name]
    if (!st) continue
    const total = st.endAges.length
    const avgAge = total ? (st.endAges.reduce((a, b) => a + b, 0) / total).toFixed(1) : '-'
    const winRate = total ? ((st.wins / total) * 100).toFixed(1) : '-'
    console.log(`${p.name} | 成功${st.wins} 失败${st.loses} | 胜率${winRate}% | 平均结局年龄${avgAge}岁`)
    const topEndings = Object.entries(st.endings).sort((a, b) => b[1] - a[1]).slice(0, 5)
    for (const [id, cnt] of topEndings) console.log(`    ${id}: ${cnt}次`)
  }

  console.log('\n===== 层面二：定向状态注入 =====')
  testHardEndings()
  testFreeRetirement()
  testChainRebuild()
  testSwitchCity()
  testCrossroadHints()

  // 输出问题
  console.log('\n===== 检测到的问题 =====')
  const ordered = issues.sort((a, b) => {
    const sev = { P0: 0, P1: 1, P2: 2 }
    return sev[a.severity] - sev[b.severity]
  })
  const p0 = ordered.filter(i => i.severity === 'P0')
  const p1 = ordered.filter(i => i.severity === 'P1')
  const p2 = ordered.filter(i => i.severity === 'P2')
  console.log(`P0(致命): ${p0.length} | P1(严重): ${p1.length} | P2(轻微): ${p2.length}`)

  const showP0 = p0.slice(0, 30)
  const showP1 = p1.slice(0, 40)
  const showP2 = p2.slice(0, 20)
  if (showP0.length) { console.log('\n--- P0 致命问题 ---'); for (const i of showP0) console.log(`[${i.severity}][${i.tag}] ${i.category}: ${i.description}`) }
  if (showP1.length) { console.log('\n--- P1 严重问题 ---'); for (const i of showP1) console.log(`[${i.severity}][${i.tag}] ${i.category}: ${i.description}`) }
  if (showP2.length) { console.log('\n--- P2 轻微问题 ---'); for (const i of showP2) console.log(`[${i.severity}][${i.tag}] ${i.category}: ${i.description}`) }
  if (issues.length === 0) console.log('\n  ✓ 未检测到任何问题')
}

main()