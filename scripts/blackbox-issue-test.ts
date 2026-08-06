/**
 * 黑箱问题检测脚本 · 玩家视角
 *
 * 目标：以"不知道内部实现"的玩家身份，跨6条路径×多轮随机游玩，
 * 系统性地检查游戏里最明显的逻辑问题。
 *
 * 检测维度：
 *  A. 数值健康度：NaN/Infinity/存款异常/状态越界
 *  B. 状态一致性：父母/伴侣/子女/婚姻/住房状态与事件是否矛盾
 *  C. 结局触发：是否在合理年龄触发、是否漏触发/重复触发
 *  D. 路径可达性：是否真的能玩到退休成功，还是必然失败/必然成功
 *  E. 平衡性：存款/收入跨年是否出现离谱跳变
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

setActivePinia(createPinia())

interface Issue {
  severity: 'P0' | 'P1' | 'P2'
  path: string
  age: number
  category: string
  description: string
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
const PROFESSIONS = ['体制内', '红利行业', '传统私企', '自由职业', '实体创业', '一线蓝领', '数字游民', '自由个体'] as const
const MBTIS = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'] as const
const DREAMS = ['world_traveler', 'farm_hermit', 'lifelong_scholar', 'ultimate_otaku', 'square_dance_king', 'silver_volunteer'] as const

const issues: Issue[] = []
const pathStats: Record<string, { wins: number; loses: number; endings: Record<string, number>; endAges: number[] }> = {}

function report(severity: Issue['severity'], path: string, age: number, category: string, description: string) {
  issues.push({ severity, path, age, category, description })
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// 玩家选择策略：随机但带生存本能（存款低时避免大额支出、压力高时避免加压）
function playerChoose(event: any, state: any): number {
  const opts = event?.options || []
  if (opts.length === 0) return 0
  const savings = state?.currentSavings ?? 0
  const stress = state?.stress ?? 0
  const health = state?.health ?? 100
  // 过滤危险选项
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

function runOneRun(pathId: string, pathName: string, runIdx: number) {
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

  for (let age = 22; age <= 65; age++) {
    const s = store.state
    if (s.endingTriggered) { ended = true; endAge = s.currentAge; endId = s.currentEndingId || ''; break }

    // ---- A. 数值健康度检查（每年前）----
    const nums: Record<string, number> = {
      savings: s.currentSavings,
      salary: s.currentMonthlySalary,
      stress: s.stress,
      happiness: s.happiness,
      health: s.health,
      faith: s.pathFaith,
      passive: s.passiveIncome,
    }
    for (const [k, v] of Object.entries(nums)) {
      if (typeof v !== 'number' || Number.isNaN(v)) report('P0', tag, age, '数值NaN', `${k}=${v}`)
      if (typeof v === 'number' && !Number.isFinite(v)) report('P0', tag, age, '数值Infinity', `${k}=${v}`)
    }
    if (s.stress < 0 || s.stress > 100) report('P1', tag, age, '压力越界', `stress=${s.stress}`)
    if (s.happiness < 0 || s.happiness > 100) report('P1', tag, age, '幸福越界', `happiness=${s.happiness}`)
    if (s.health < 0 || s.health > 100) report('P1', tag, age, '健康越界', `health=${s.health}`)
    if (s.pathFaith < 0 || s.pathFaith > 100) report('P1', tag, age, '信念越界', `faith=${s.pathFaith}`)

    // ---- B. 状态一致性检查 ----
    // 已婚则有伴侣
    if (s.isMarried && !s.partner) report('P1', tag, age, '婚姻一致性', 'isMarried=true 但 partner=null')
    if (s.isMarried && s.partner?.datingStage === 'single') report('P1', tag, age, '婚姻一致性', '已婚但 datingStage=single')
    // 有孩子未婚无伴侣
    if (s.hasChild && s.children?.length > 0 && !s.isMarried && !s.partner) report('P2', tag, age, '子女-婚姻', '有孩子但未婚且无伴侣')
    // 伴侣离婚标记
    if (s.partner?.hasDivorced && s.isMarried) report('P1', tag, age, '婚姻一致性', 'hasDivorced=true 但 isMarried=true')
    // 父母已故状态
    if (s.parents && !s.parents.isAlive && s.parents.age) {
      // 父母已故但年龄还在增长
      if (s.parents.age > 100) report('P2', tag, age, '父母年龄', `父母已故但年龄=${s.parents.age}`)
    }
    // 房贷与房产
    if (s.currentMortgageCost > 0 && !s.hasProperty) report('P1', tag, age, '房贷一致性', '有房贷但无房产')
    if (s.hasProperty && s.propertyValue <= 0) report('P2', tag, age, '房产一致性', '有房产但propertyValue<=0')

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

    // ---- D. 存款异常跳变（年度结算前手工检查逻辑）----
    // 结算后检查
    store.commitYear()
    const post = store.state

    // 存款跳变：单年波动超过200万（异常）
    const delta = post.currentSavings - prevSavings
    if (Math.abs(delta) > 2000000) report('P1', tag, age, '存款跳变', `单年存款变化 ${delta.toLocaleString()}`)
    // 薪资跳变：单年涨跌幅>100%（异常）
    const salaryDeltaPct = prevSalary > 0 ? ((post.currentMonthlySalary - prevSalary) / prevSalary) * 100 : 0
    if (post.currentMonthlySalary > 0 && Math.abs(salaryDeltaPct) > 100 && !post.isUnemployed) {
      report('P2', tag, age, '薪资跳变', `单年薪资变化${salaryDeltaPct.toFixed(0)}%`)
    }
    // 压力/健康突然暴跌（异常，无事件支撑时）
    if (post.stress - prevStress > 40) report('P2', tag, age, '压力爆增', `单年压力+${post.stress - prevStress}`)
    if (prevHealth - post.health > 40) report('P2', tag, age, '健康暴跌', `单年健康-${prevHealth - post.health}`)

    prevSavings = post.currentSavings
    prevSalary = post.currentMonthlySalary
    prevStress = post.stress
    prevHealth = post.health
  }

  // 记录调整后的结局
  const s = store.state
  if (!s.endingTriggered && !ended) {
    // 到65岁还没结束——异常（应该60岁强制）
    report('P1', tag, store.state.currentAge, '结局触发', '65岁仍未触发结局')
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

function main() {
  const RUNS_PER_PATH = 200
  console.log('='.repeat(70))
  console.log('  黑箱问题检测 · 玩家视角 · 6路径×200轮随机游玩')
  console.log('='.repeat(70))

  for (const p of PATHS) {
    for (let r = 0; r < RUNS_PER_PATH; r++) {
      runOneRun(p.id, p.name, r)
    }
  }

  // 输出结局分布
  console.log('\n===== 结局分布 =====')
  for (const p of PATHS) {
    const st = pathStats[p.name]
    if (!st) continue
    const total = st.endAges.length
    const avgAge = total ? (st.endAges.reduce((a, b) => a + b, 0) / total).toFixed(1) : '-'
    const winRate = total ? ((st.wins / total) * 100).toFixed(1) : '-'
    console.log(`${p.name} | 成功${st.wins} 失败${st.loses} | 胜率${winRate}% | 平均结局年龄${avgAge}岁`)
    const topEndings = Object.entries(st.endings).sort((a, b) => b[1] - a[1]).slice(0, 5)
    for (const [id, cnt] of topEndings) {
      console.log(`    ${id}: ${cnt}次`)
    }
  }

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

  if (showP0.length) {
    console.log('\n--- P0 致命问题 ---')
    for (const i of showP0) console.log(`[${i.severity}][${i.path}@${i.age}] ${i.category}: ${i.description}`)
  }
  if (showP1.length) {
    console.log('\n--- P1 严重问题 ---')
    for (const i of showP1) console.log(`[${i.severity}][${i.path}@${i.age}] ${i.category}: ${i.description}`)
  }
  if (showP2.length) {
    console.log('\n--- P2 轻微问题 ---')
    for (const i of showP2) console.log(`[${i.severity}][${i.path}@${i.age}] ${i.category}: ${i.description}`)
  }
}

main()