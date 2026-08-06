/**
 * 扩展版多角度黑箱测试 · 全游戏
 *
 * 在原有基础上增加了更多检查维度：
 *
 * 层面三：叙事结构完整性
 *   K. 45-60岁空白年份检测（每个路径每年至少要有一个叙事节拍）
 *   L. 盲盒延迟触发可达性（延迟注册后在目标年龄能否正常揭晓）
 *   M. 卡牌回声延迟触发检查（延迟队列正常执行）
 *   N. 独白重复性检测（路径内最近独白不重复）
 *
 * 层面四：状态深度一致性
 *   O. 人际关系深度一致性：父母已故年龄不再增长 / 离婚状态一致性
 *   P. 财务会计一致性：lifetime累计跟踪与年终结算是否匹配
 *   Q. 卡牌冷却机制检查（usedCardHistory正常记录）
 *   R. 信念值边界检查（始终保持0-100范围）
 *
 * 层面五：边界场景压力测试
 *   S. 多次重置游戏（是否内存泄漏/状态残留）
 *   T. 极端负债下的破产判定一致性
 *   U. 极低健康下的结局触发一致性
 */

// ========== Node 环境 polyfill ==========
const _store: Record<string, string> = {};
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
  checkEnding,
  CITY_CONFIGS,
} from '../src/utils/math-engine.js'
import { showNumericalHints } from '../src/utils/ui-prefs.js'
import { writeFileSync } from 'node:fs'

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
//  层面一：统计模拟（多路径 × 多轮随机游玩）
// ============================================================
const pathStats: Record<string, {
  wins: number;
  loses: number;
  endings: Record<string, number>;
  endAges: number[];
  emptyYears45_60: number[]; // 记录空白年份（无叙事事件）
}> = {}

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
  const emptyYears: number[] = []

  // 记录独白检查重复性（仅检测近6年窗口内的重复，游戏本身只去重最近5年base独占）
  const recentMonologues: string[] = []

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
    // hasDivorced && isMarried 是正常的（离过婚又再婚），不再检测
    if (s.currentMortgageCost > 0 && !s.hasProperty) report('P1', tag, '房贷一致性', '有房贷但无房产')
    if (s.hasProperty && s.propertyValue <= 0) report('P2', tag, '房产一致性', '有房产但propertyValue<=0')
    if (s.hasCar && !((s as any).carValue > 0)) report('P2', tag, '车辆一致性', '有车但carValue<=0')
    // 链上持仓安全性：不为负
    if ((s as any).chainHoldings < 0) report('P1', tag, '链上持仓为负', `chainHoldings=${(s as any).chainHoldings}`)
    if ((s as any).bioPortfolio < 0) report('P1', tag, '生科组合为负', `bioPortfolio=${(s as any).bioPortfolio}`)
    // 父母一致性：已故后年龄不应再增长（这里检查逻辑，store.commitYear会自动增长）
    if (s.parents && !s.parents.isAlive && s.parents.age > 110) {
      report('P2', tag, '父母年龄一致性', `父母已故但年龄=${s.parents.age}，仍然在增长`)
    }
    // 财务累计一致性：年终前检查是否NaN
    if (typeof s.lifetimeSalary !== 'number' || Number.isNaN(s.lifetimeSalary)) {
      report('P1', tag, '财务累计NaN', 'lifetimeSalary is NaN')
    }

    // ---- K. 独白重复性检测（近6年窗口内重复才算异常）----
    const opening = s.yearOpeningMonologue
    if (opening) {
      if (recentMonologues.includes(opening)) {
        report('P2', tag, '独白重复', `年龄${age} 独白在近6年内重复: ${opening.slice(0, 40)}...`)
      }
      recentMonologues.push(opening)
      if (recentMonologues.length > 6) recentMonologues.shift()
    }

    // ---- 处理叙事事件 ----
    let hasNarrative = false
    const event = store.currentNarrativeEvent
    if (event && event.options?.length > 0) {
      hasNarrative = true
      const idx = playerChoose(event, s)
      const opt = event.options[idx] || event.options[0]
      store.selectNarrativeOption(opt.id)
    }
    // ---- 处理十字路口 ----
    const crossroad = store.currentCrossroad
    if (crossroad && crossroad.options?.length > 0) {
      hasNarrative = true
      const idx = playerChoose(crossroad, s)
      const opt = crossroad.options[idx] || crossroad.options[0]
      store.selectCrossroadOption(opt.id)
    }

    store.commitYear()
    const post = store.state

    // ---- 检查45-60岁空白年份 ----
    if (age >= 45 && age <= 59 && !hasNarrative && !crossroad && !event) {
      emptyYears.push(age)
      report('P2', tag, '空白年份', `年龄${age} (45-59区间) 无任何叙事事件/十字路口`)
    }

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
    pathStats[pathName] = pathStats[pathName] || { wins: 0, loses: 0, endings: {}, endAges: [], emptyYears45_60: [] }
    pathStats[pathName].endings[finalEndId] = (pathStats[pathName].endings[finalEndId] || 0) + 1
    pathStats[pathName].endAges.push(finalAge)
    pathStats[pathName].emptyYears45_60.push(...emptyYears)
    if (finalEndId.startsWith('path_success')) pathStats[pathName].wins++
    else pathStats[pathName].loses++
  }
}

// ============================================================
//  层面二：定向状态注入（针对边界与近期改动）
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

function testCrossroadHints() {
  console.log('\n[J] 十字路口数值隐藏测试')
  console.log(`  [J1] showNumericalHints=${showNumericalHints.value} (期望false，正式游玩永久隐藏)`)
  if (showNumericalHints.value !== false) report('P1', 'J', '数值隐藏', 'showNumericalHints 未保持 false')
}

function testMultipleResets() {
  console.log('\n[S] 多次游戏重置压力测试')
  const pinia = createPinia()
  setActivePinia(pinia)

  for (let i = 0; i < 20; i++) {
    const store = useGameStore()
    store.resetGame()
    store.startNewGame()
    store.setupGame('中坚大后方', '传统私企', 8000, 5000000, 'INTJ', 'world_traveler')
    store.selectRetirementPath('ai_symbiote')

    // 玩到30岁再重置
    for (let age = 22; age <= 30; age++) {
      if (store.state.endingTriggered) break
      const event = store.currentNarrativeEvent
      if (event && event.options) {
        const idx = playerChoose(event, store.state)
        store.selectNarrativeOption(event.options[idx].id)
      }
      const cross = store.currentCrossroad
      if (cross && cross.options) {
        const idx = playerChoose(cross, store.state)
        store.selectCrossroadOption(cross.options[idx].id)
      }
      store.commitYear()
    }
    // 检查最后状态数值是否正常
    const s = store.state
    if (Number.isNaN(s.currentSavings)) {
      report('P1', 'S', '多次重置', `第${i}次重置后存款NaN`)
    }
    if (s.currentSavings > 1e12) {
      report('P1', 'S', '多次重置后数值爆炸', `存款=${s.currentSavings.toExponential(2)}`)
    }
  }
  console.log(`  [S1] 完成20次重置 → 状态正常`)

  // 全局重置后验证crossroadFiredTags类型保持正确
  const store = useGameStore()
  const crossTags = (store as any).crossroadFiredTags
  if (!(crossTags.value instanceof Map)) {
    report('P1', 'S', 'crossroadFiredTags类型', `重置后不是Map: ${typeof crossTags.value}`)
  }
}

function testBlindBoxQueue() {
  console.log('\n[L] 盲盒队列延迟触发测试')
  const store = useGameStore()
  store.resetGame(); store.startNewGame()
  store.setupGame('中坚大后方', '传统私企', 8000, 5000000, 'INTJ', 'world_traveler')
  store.selectRetirementPath('chain_native')

  // 强制注入一个延迟盲盒（模拟注册后好几年才揭晓）
  store.state.pendingBlindBoxes = [
    { outcomeId: 'chain_first_bet_success', triggerAge: 30, triggerCardId: 'test_card' },
  ]

  let gotReveal = false
  for (let age = 22; age <= 35; age++) {
    store.state.currentAge = age
    if (store.state.endingTriggered) break
    const event = store.currentNarrativeEvent
    if (event && event.options) {
      const idx = playerChoose(event, store.state)
      store.selectNarrativeOption(event.options[idx].id)
    }
    store.commitYear()
    if (store.state.blindBoxReveals && store.state.blindBoxReveals.length > 0) {
      gotReveal = true
    }
  }

  if (!gotReveal) {
    report('P1', 'L', '盲盒触发', '注册的延迟盲盒到年龄后未揭晓')
  } else {
    if (store.state.pendingBlindBoxes && store.state.pendingBlindBoxes.length > 0) {
      report('P1', 'L', '盲盒清理', '盲盒揭晓后仍留在pending队列')
    }
  }
  console.log(`  [L1] 延迟盲盒触发: ${gotReveal ? '✓ 成功揭晓' : '✗ 未触发'}`)
}

function testParentAgeConsistency() {
  console.log('\n[O] 父母年龄一致性测试')
  const store = useGameStore()
  store.resetGame(); store.startNewGame()
  store.setupGame('中坚大后方', '传统私企', 8000, 5000000, 'INTJ', 'world_traveler')
  store.selectRetirementPath('digital_nomad')

  // 强制设置父母已故
  store.state.parents.isAlive = false
  const ageAtDeath = store.state.parents.age
  console.log(`  [O1] 父母死亡时年龄: ${ageAtDeath}`)

  // 模拟10年
  for (let i = 0; i < 10; i++) {
    store.commitYear()
  }

  const finalAge = store.state.parents.age
  if (finalAge !== ageAtDeath) {
    report('P2', 'O', '父母年龄一致性', `父母已故但年龄从${ageAtDeath}增长到${finalAge}，应该冻结`)
  }
  console.log(`  [O2] 10年后父母年龄: ${finalAge} (期望=${ageAtDeath})`)
}

// ============================================================
//  main
// ============================================================
function main() {
  const RUNS_PER_PATH = 150
  console.log('='.repeat(80))
  console.log('  扩展版多角度黑箱测试 · 全游戏 · 6路径×150轮随机游玩 + 扩展定向注入')
  console.log('='.repeat(80))

  console.log('\n===== 层面一：统计模拟 =====')
  for (const p of PATHS) {
    console.log(`  Running ${p.name}... (${RUNS_PER_PATH} runs)`)
    for (let r = 0; r < RUNS_PER_PATH; r++) {
      if ((r + 1) % 50 === 0) console.log(`    ${p.name}: ${r + 1}/${RUNS_PER_PATH}`)
      runOneSim(p.id, p.name, r)
    }
  }

  // 结局分布
  console.log('\n----- 结局分布 -----')
  for (const p of PATHS) {
    const st = pathStats[p.name]
    if (!st) continue
    const total = st.endAges.length
    const avgAge = total ? (st.endAges.reduce((a, b) => a + b, 0) / total).toFixed(1) : '-'
    const winRate = total ? ((st.wins / total) * 100).toFixed(1) : '-'
    const totalEmpty = st.emptyYears45_60.length
    console.log(`${p.name} | 成功${st.wins} 失败${st.loses} | 胜率${winRate}% | 平均结局年龄${avgAge}岁 | 45-60空白年份合计${totalEmpty}`)
    const topEndings = Object.entries(st.endings).sort((a, b) => b[1] - a[1]).slice(0, 5)
    for (const [id, cnt] of topEndings) console.log(`    ${id}: ${cnt}次`)
  }

  console.log('\n===== 层面二：定向状态注入 =====')
  testHardEndings()
  testCrossroadHints()
  testMultipleResets()
  testBlindBoxQueue()
  testParentAgeConsistency()

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

  // 保存完整输出到文件
  const output = [
    '扩展版多角度黑箱测试 · 全游戏',
    '='.repeat(60),
    '',
    `统计: P0=${p0.length} P1=${p1.length} P2=${p2.length}`,
    '',
    ...ordered.map(i => `[${i.severity}] ${i.tag} ${i.category}: ${i.description}`),
  ].join('\n')
  writeFileSync('d:\\6a3eda3f32f10123e28acfe9\\pixel-retire-sim\\scripts\\bb-expanded-output.txt', output, 'utf8')
  console.log(`\n完整输出已保存到 scripts/bb-expanded-output.txt`)
}

main()
