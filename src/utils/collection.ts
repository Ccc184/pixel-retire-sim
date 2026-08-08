// ================================================================
//  collection.ts — 跨局元进度（多周目收藏图鉴）
// ----------------------------------------------------------------
//  目标：让"玩过一次就丢"变成"想集齐所有结局"。
//  与单局存档（persist.ts，resetGame 会清除）分离，独立持久化，
//  记录所有历史局：解锁的结局、生涯累计统计、元成就。
//  纯模块 + shallowRef，供 Vue 组件直接绑定，无循环依赖。
// ================================================================
import { shallowRef } from 'vue'
import type { GameState, RetirementPathId } from '../types/global.d.js'
import { ENDINGS } from './narrative.js'
import { getPath } from '../data/retirement-paths.js'

const STORAGE_KEY = 'pixel_retire_collection'

export const GRADE_RANK: Record<string, number> = { S: 5, A: 4, B: 3, C: 2, D: 1 }

// ================================================================
//  数据结构
// ================================================================
export interface RunRecord {
  endingId: string
  grade: string
  pathId: RetirementPathId | null
  age: number
  netWealth: number
  targetWealth: number
  year: number            // 现实年份
  title: string
  name: string
  pathName: string
  pathIcon: string
  isNewUnlock: boolean    // 本局是否首次解锁该结局
}

export interface CollectionState {
  version: number
  unlockedEndings: Record<string, { grade: string; unlockedAt: number }>
  // —— 生涯累计统计 ——
  totalRuns: number
  totalYearsSimulated: number
  totalNetWealth: number
  bestNetWealth: number
  bestGrade: string
  bestRetireAge: number
  pathClears: Record<string, number>      // pathId -> 成功次数
  totalPathFrequencies: Record<string, number> // pathId -> 选择次数（含失败）
  // —— 一生巅峰（跨局聚合，用于徽章） ——
  maxMonthlySalary: number
  maxPassiveIncome: number
  maxYearsWorked: number
  maxTotalUnemployedYears: number
  everOwnedProperty: boolean
  everMarried: boolean
  everChild: boolean
  everShop: boolean
  everCar: boolean
  everMBA: boolean
  everGeoArbitrage: boolean
  everCriticalIllness: boolean
  everGold: boolean
  everStockAccount: boolean
  everUnemployed: boolean
  lastRun: RunRecord | null
}

export function emptyCollection(): CollectionState {
  return {
    version: 1,
    unlockedEndings: {},
    totalRuns: 0,
    totalYearsSimulated: 0,
    totalNetWealth: 0,
    bestNetWealth: 0,
    bestGrade: '',
    bestRetireAge: 99,
    pathClears: {},
    totalPathFrequencies: {},
    maxMonthlySalary: 0,
    maxPassiveIncome: 0,
    maxYearsWorked: 0,
    maxTotalUnemployedYears: 0,
    everOwnedProperty: false,
    everMarried: false,
    everChild: false,
    everShop: false,
    everCar: false,
    everMBA: false,
    everGeoArbitrage: false,
    everCriticalIllness: false,
    everGold: false,
    everStockAccount: false,
    everUnemployed: false,
    lastRun: null,
  }
}

// ================================================================
//  图鉴目录（所有可收集结局槽位）
// ================================================================
export interface CollectionEndingSlot {
  id: string
  title: string
  name: string
  pathId: RetirementPathId | null
  pathIcon: string
  isPathSuccess: boolean | null   // null = 普通结局
  grade: string                   // 默认评级（未解锁时的剪影）
}

export function getEndingCatalog(): CollectionEndingSlot[] {
  const slots: CollectionEndingSlot[] = []
  // 6 条路径：成功 / 失败
  const pathIds: RetirementPathId[] = [
    'ai_symbiote', 'chain_native', 'digital_nomad', 'super_ip', 'silver_economy', 'bio_gambler',
  ]
  for (const pid of pathIds) {
    const p = getPath(pid)
    if (!p) continue
    slots.push({
      id: `path_success_${pid}`,
      title: p.successTitle,
      name: '提前退休 · 成功',
      pathId: pid,
      pathIcon: p.icon,
      isPathSuccess: true,
      grade: 'S',
    })
    slots.push({
      id: `path_failure_${pid}`,
      title: p.failureTitle,
      name: '提前退休 · 未竟',
      pathId: pid,
      pathIcon: p.icon,
      isPathSuccess: false,
      grade: 'C',
    })
  }
  // 9 个普通结局
  for (const e of ENDINGS) {
    slots.push({
      id: e.id,
      title: e.title,
      name: e.name,
      pathId: null,
      pathIcon: '◆',
      isPathSuccess: null,
      grade: e.grade,
    })
  }
  return slots
}

// ================================================================
//  持久化
// ================================================================
let cached: CollectionState | null = null
export const collectionState = shallowRef<CollectionState>(load())

function load(): CollectionState {
  if (typeof window === 'undefined') return emptyCollection()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyCollection()
    const parsed = JSON.parse(raw) as CollectionState
    if (!parsed || typeof parsed !== 'object' || parsed.unlockedEndings === undefined) {
      return emptyCollection()
    }
    // 合并缺失字段，保证结构完整
    const base = emptyCollection()
    return { ...base, ...parsed }
  } catch {
    return emptyCollection()
  }
}

function save(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collectionState.value))
  } catch {
    // 忽略写入失败（隐私模式等）
  }
}

/** 重新从 localStorage 载入（供外部需要时刷新） */
export function reloadCollection(): CollectionState {
  cached = load()
  collectionState.value = cached
  return cached
}

// ================================================================
//  记录一局
// ================================================================
export function recordRun(
  state: GameState,
  meta: {
    endingId: string
    grade: string
    title: string
    name: string
    pathId: RetirementPathId | null
    pathName: string
    pathIcon: string
  },
): void {
  const c = collectionState.value
  const net = Math.max(0, state.currentSavings || 0)
  const age = state.currentAge || 60
  const year = 2026 + (age - (state.startAge || 22)) // 与 life-fun 的年份口径一致即可

  const run: RunRecord = {
    endingId: meta.endingId,
    grade: meta.grade,
    pathId: meta.pathId,
    age,
    netWealth: net,
    targetWealth: state.targetWealth || 0,
    year,
    title: meta.title,
    name: meta.name,
    pathName: meta.pathName,
    pathIcon: meta.pathIcon,
    isNewUnlock: false,
  }

  // 解锁结局
  const prev = c.unlockedEndings[meta.endingId]
  if (!prev) {
    c.unlockedEndings[meta.endingId] = { grade: meta.grade, unlockedAt: Date.now() }
    run.isNewUnlock = true
  } else if (GRADE_RANK[meta.grade] > GRADE_RANK[prev.grade]) {
    prev.grade = meta.grade
  }

  // 生涯统计
  c.totalRuns += 1
  c.totalYearsSimulated += Math.max(0, age - (state.startAge || 22))
  c.totalNetWealth += net
  c.bestNetWealth = Math.max(c.bestNetWealth, net)
  c.bestRetireAge = Math.min(c.bestRetireAge, age)
  if (GRADE_RANK[meta.grade] > (GRADE_RANK[c.bestGrade] || 0)) {
    c.bestGrade = meta.grade
  }
  if (meta.pathId) {
    c.totalPathFrequencies[meta.pathId] = (c.totalPathFrequencies[meta.pathId] || 0) + 1
    if (meta.endingId.startsWith('path_success_')) {
      c.pathClears[meta.pathId] = (c.pathClears[meta.pathId] || 0) + 1
    }
  }

  // 一生巅峰聚合
  c.maxMonthlySalary = Math.max(c.maxMonthlySalary, state.currentMonthlySalary || 0)
  c.maxPassiveIncome = Math.max(c.maxPassiveIncome, state.passiveIncome || 0)
  c.maxYearsWorked = Math.max(c.maxYearsWorked, state.totalYearsWorked || 0)
  c.maxTotalUnemployedYears = Math.max(c.maxTotalUnemployedYears, state.totalUnemployedYears || 0)
  c.everOwnedProperty = c.everOwnedProperty || !!state.hasProperty
  c.everMarried = c.everMarried || !!state.isMarried
  c.everChild = c.everChild || !!state.hasChild
  c.everShop = c.everShop || !!state.hasShop
  c.everCar = c.everCar || !!state.hasCar
  c.everMBA = c.everMBA || !!state.hasMBA
  c.everGeoArbitrage = c.everGeoArbitrage || !!state.isGeoArbitrage
  c.everCriticalIllness = c.everCriticalIllness || !!state.hadCriticalIllness
  c.everGold = c.everGold || !!state.hasGold
  c.everStockAccount = c.everStockAccount || !!state.hasStockAccount
  c.everUnemployed = c.everUnemployed || (state.totalUnemployedYears || 0) > 0

  c.lastRun = run
  save()
}

// ================================================================
//  元成就（跨局收藏成就）
// ================================================================
export interface CollectionAchievement {
  id: string
  icon: string
  title: string
  desc: string
  earned: boolean
}

export function collectionAchievements(c: CollectionState): CollectionAchievement[] {
  const unlocked = Object.keys(c.unlockedEndings).length
  const allEndings = getEndingCatalog().length
  const gradesEarned = new Set(Object.values(c.unlockedEndings).map((e) => e.grade))
  const pathCleared = pathIds().filter((p) => (c.pathClears[p] || 0) > 0).length
  const list: CollectionAchievement[] = [
    {
      id: 'first_s',
      icon: '👑',
      title: '传奇初显',
      desc: '达成一个 S 级结局',
      earned: (GRADE_RANK[c.bestGrade] || 0) >= 5,
    },
    {
      id: 'all_grades',
      icon: '🎨',
      title: '五味人生',
      desc: '集齐 S / A / B / C / D 五种评级',
      earned: ['S', 'A', 'B', 'C', 'D'].every((g) => gradesEarned.has(g)),
    },
    {
      id: 'all_paths',
      icon: '🧭',
      title: '六道行者',
      desc: '全部 6 条路径各成功一次',
      earned: pathCleared >= 6,
    },
    {
      id: 'half_endings',
      icon: '📖',
      title: '人生读者',
      desc: `解锁 ${Math.ceil(allEndings / 2)}+ 个结局`,
      earned: unlocked >= Math.ceil(allEndings / 2),
    },
    {
      id: 'early_retire',
      icon: '🚀',
      title: '提前上岸',
      desc: '某局 ≤45 岁退休',
      earned: c.bestRetireAge <= 45,
    },
    {
      id: 'billion',
      icon: '💎',
      title: '亿万富翁',
      desc: '单局净资产 ≥ 1 亿',
      earned: c.bestNetWealth >= 100_000_000,
    },
    {
      id: 'runs_10',
      icon: '♻️',
      title: '十世轮回',
      desc: '累计完成 10 局',
      earned: c.totalRuns >= 10,
    },
    {
      id: 'years_150',
      icon: '⏳',
      title: '百岁人生',
      desc: '累计模拟 150 年',
      earned: c.totalYearsSimulated >= 150,
    },
    {
      id: 'wealth_2e8',
      icon: '🏦',
      title: '财富巨擘',
      desc: '累计净资产 ≥ 2 亿',
      earned: c.totalNetWealth >= 200_000_000,
    },
    {
      id: 'path_devote',
      icon: '🔥',
      title: '执念成狂',
      desc: '同一条路径成功 2 次',
      earned: pathIds().some((p) => (c.pathClears[p] || 0) >= 2),
    },
  ]
  return list
}

function pathIds(): RetirementPathId[] {
  return ['ai_symbiote', 'chain_native', 'digital_nomad', 'super_ip', 'silver_economy', 'bio_gambler']
}