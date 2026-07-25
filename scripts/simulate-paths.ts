/**
 * 路径模拟脚本 v2：正确处理十字路口事件
 *
 * 检查项：
 * 1. All In 触发年龄（是否过早/过晚）
 * 2. 信念值增长曲线
 * 3. 副业收入 vs 主业薪资
 * 4. 事件触发频率和分布
 * 5. 压力/健康是否合理
 * 6. 退休是否可达成
 */

// Node 环境下 polyfill localStorage 和 window
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

// 初始化 Pinia
setActivePinia(createPinia())

const PATHS: Array<'chain_native' | 'digital_nomad' | 'super_ip' | 'silver_economy' | 'bio_gambler'> = [
  'chain_native', 'digital_nomad', 'super_ip', 'silver_economy', 'bio_gambler'
]

interface YearData {
  age: number
  faith: number
  stress: number
  health: number
  happiness: number
  savings: number
  salary: number
  sideIncome: number
  isAllInPath: boolean
  canAllInNow: boolean
  eventId: string | null
  eventTitle: string | null
  crossroadId: string | null
  crossroadTitle: string | null
}

interface SimResult {
  pathId: string
  pathName: string
  allInAge: number | null
  allInReason: string | null
  allInFaith: number | null
  allInSideIncome: number | null
  allInSalary: number | null
  retireAge: number | null
  ending: string | null
  maxFaith: number
  minFaith: number
  maxStress: number
  minHealth: number
  events: Array<{ age: number; type: string; id: string; title: string; chosenOption: string }>
  issues: string[]
  faithCurve: Array<{ age: number; faith: number; stress: number; health: number; savings: number; sideIncome: number; salary: number; canAllIn: boolean }>
}

function simulatePath(pathId: typeof PATHS[number]): SimResult {
  const store = useGameStore()
  store.resetGame()

  // 开局
  store.startNewGame()
  store.setupGame('中坚大后方', '传统私企', 8000, 60, 5000000, 'INTJ')
  store.selectRetirementPath(pathId)

  const result: SimResult = {
    pathId,
    pathName: getPath(pathId)?.name || pathId,
    allInAge: null,
    allInReason: null,
    allInFaith: null,
    allInSideIncome: null,
    allInSalary: null,
    retireAge: null,
    ending: null,
    maxFaith: 0,
    minFaith: 100,
    maxStress: 0,
    minHealth: 100,
    events: [],
    issues: [],
    faithCurve: [],
  }

  let consecutiveRestYears = 0

  for (let age = 22; age <= 65; age++) {
    const s = store.state
    const canAllInNow = canAllIn(s)
    const sideInc = getPathSideIncome(s)

    // === 步骤1：处理十字路口（如果有）===
    const crossroad = store.currentCrossroad
    if (crossroad && crossroad.options && crossroad.options.length > 0) {
      // 模拟理性玩家：选择压力最小或收益最大的选项
      let bestOption = crossroad.options[0]
      let bestScore = -999
      for (const opt of crossroad.options) {
        let score = 0
        // 偏好不增加压力的选项
        if (opt.hintColor === 'positive') score += 10
        if (opt.hintColor === 'danger' && s.stress > 75) score -= 15
        // 偏好增加信念的选项
        if (opt.label?.includes('All In') || opt.label?.includes('加大')) score += 5
        if (score > bestScore) {
          bestScore = score
          bestOption = opt
        }
      }
      store.selectCrossroadOption(bestOption.id)
      result.events.push({
        age,
        type: 'crossroad',
        id: crossroad.id,
        title: crossroad.title,
        chosenOption: bestOption.label || '未知选项',
      })
      consecutiveRestYears = 0
    }

    // === 步骤2：处理叙事事件 ===
    const event = store.currentNarrativeEvent
    if (event && event.options && event.options.length > 0) {
      // 如果是 All In 事件且可以 All In，选择 All In
      if (canAllInNow && event.id?.startsWith('allin_') && !s.isAllInPath) {
        const allInOption = event.options.find(o => o.id === 'all_in')
        if (allInOption) {
          store.selectNarrativeOption(allInOption.id)
          result.events.push({
            age,
            type: 'allin',
            id: event.id,
            title: event.title,
            chosenOption: allInOption.label,
          })
          consecutiveRestYears = 0
        }
      } else {
        // 优先选技能提升选项，高压时选休息
        let bestOption = event.options[0]
        let bestScore = -999
        for (const opt of event.options) {
          let score = 0
          if (opt.skillGains) {
            score += Object.values(opt.skillGains).reduce((a, b) => a + b, 0) * 2
          }
          if (opt.isRestOption && s.stress > 75) score += 30
          if (s.stress > 85 && opt.hintColor === 'danger') score -= 20
          if (opt.hintColor === 'positive') score += 5
          if (score > bestScore) {
            bestScore = score
            bestOption = opt
          }
        }
        store.selectNarrativeOption(bestOption.id)
        result.events.push({
          age,
          type: 'narrative',
          id: event.id,
          title: event.title,
          chosenOption: bestOption.label || '未知选项',
        })
        consecutiveRestYears = 0
      }
    } else if (!crossroad) {
      // 没有十字路口也没有叙事事件 = 休养生息
      consecutiveRestYears++
    }

    // 记录 All In 首次可触发
    if (canAllInNow && !result.allInAge && !s.isAllInPath) {
      result.allInAge = age
      result.allInFaith = s.pathFaith
      result.allInSideIncome = sideInc
      result.allInSalary = s.currentMonthlySalary
      if (s.pathFaith >= 90) result.allInReason = '信念>=90'
      else if (s.currentMonthlySalary > 0 && sideInc >= s.currentMonthlySalary * 1.2) result.allInReason = '副业>=主业1.2x'
      else result.allInReason = '投资资产条件'
    }

    result.maxFaith = Math.max(result.maxFaith, s.pathFaith)
    result.minFaith = Math.min(result.minFaith, s.pathFaith)
    result.maxStress = Math.max(result.maxStress, s.stress)
    result.minHealth = Math.min(result.minHealth, s.health)

    // 提交年度
    store.commitYear()

    // 记录年度数据
    result.faithCurve.push({
      age,
      faith: s.pathFaith,
      stress: s.stress,
      health: s.health,
      savings: s.currentSavings,
      sideIncome: getPathSideIncome(s),
      salary: s.currentMonthlySalary,
      canAllIn: canAllIn(s),
    })

    // 检查结局
    if (s.endingTriggered) {
      result.ending = String(s.endingTriggered)
      result.retireAge = age
      break
    }
    if (s.currentSavings < -300000) {
      result.ending = 'bankrupt'
      result.retireAge = age
      break
    }
    if (s.health < 20) {
      result.ending = 'health_critical'
      result.retireAge = age
      break
    }
  }

  // 问题检测
  if (result.allInAge && result.allInAge < 27) {
    result.issues.push(`All In 触发过早: ${result.allInAge}岁 (应>=27岁)`)
  }
  if (!result.allInAge && !result.ending?.includes('success')) {
    result.issues.push('65岁前从未触发 All In')
  }
  if (result.maxStress >= 100) {
    result.issues.push(`压力曾达100 (压力失控)`)
  }
  if (result.minHealth < 20) {
    result.issues.push(`健康曾低于20 (健康濒死)`)
  }
  if (consecutiveRestYears >= 3) {
    result.issues.push(`连续${consecutiveRestYears}年休养生息 (事件不足)`)
  }
  if (!result.ending && !result.retireAge) {
    result.issues.push('65岁未触发任何结局')
  }

  return result
}

// ==================== 运行模拟 ====================
console.log('='.repeat(80))
console.log('  路径模拟测试 v2: 5条路径完整游玩（含十字路口处理）')
console.log('='.repeat(80))

const allResults: SimResult[] = []

for (const pathId of PATHS) {
  console.log('\n' + '─'.repeat(70))
  const result = simulatePath(pathId)
  allResults.push(result)

  console.log(`\n【${result.pathName}】`)
  console.log(`  All In 触发: ${result.allInAge ? result.allInAge + '岁' : '未触发'} ${result.allInReason ? '(' + result.allInReason + ')' : ''}`)
  console.log(`  All In 时信念值: ${result.allInFaith ?? 'N/A'}`)
  console.log(`  All In 时副业月入: ¥${result.allInSideIncome?.toLocaleString() ?? 'N/A'}`)
  console.log(`  All In 时主业月薪: ¥${result.allInSalary?.toLocaleString() ?? 'N/A'}`)
  console.log(`  信念值范围: ${result.minFaith} ~ ${result.maxFaith}`)
  console.log(`  压力峰值: ${result.maxStress}`)
  console.log(`  健康最低: ${result.minHealth}`)
  console.log(`  结局: ${result.ending || '无'} ${result.retireAge ? '(' + result.retireAge + '岁)' : ''}`)
  console.log(`  触发事件数: ${result.events.length}`)

  if (result.issues.length > 0) {
    console.log(`  发现问题:`)
    for (const issue of result.issues) {
      console.log(`    [!] ${issue}`)
    }
  } else {
    console.log(`  [OK] 未发现问题`)
  }

  // 信念值曲线
  console.log(`\n  信念值曲线:`)
  const curve = result.faithCurve.map(y => `${y.age}:${y.faith}`).join(' ')
  console.log(`    ${curve}`)

  // 副业收入 vs 主业薪资
  console.log(`\n  副业收入 vs 主业月薪:`)
  const incCurve = result.faithCurve.map(y => `${y.age}:(副${Math.round(y.sideIncome/100)/10}k/主${Math.round(y.salary/100)/10}k)`).join(' ')
  console.log(`    ${incCurve}`)

  // 事件列表
  console.log(`\n  事件列表:`)
  for (const ev of result.events) {
    console.log(`    ${ev.age}岁 [${ev.type}] ${ev.title} -> ${ev.chosenOption}`)
  }
}

// ==================== 汇总 ====================
console.log('\n' + '='.repeat(80))
console.log('  汇总')
console.log('='.repeat(80))
console.log('\n路径                | All In年龄 | 信念范围   | 压力峰 | 健康低 | 结局')
console.log('─'.repeat(80))
for (const r of allResults) {
  const name = r.pathName.padEnd(20)
  const allIn = (r.allInAge ? r.allInAge + '岁' : '未触发').padEnd(10)
  const faith = `${r.minFaith}-${r.maxFaith}`.padEnd(10)
  const stress = String(r.maxStress).padEnd(6)
  const health = String(r.minHealth).padEnd(6)
  const ending = r.ending || '无'
  console.log(`${name} | ${allIn} | ${faith} | ${stress} | ${health} | ${ending}`)
}

console.log('\n问题汇总:')
let totalIssues = 0
for (const r of allResults) {
  for (const issue of r.issues) {
    console.log(`  [${r.pathName}] ${issue}`)
    totalIssues++
  }
}
if (totalIssues === 0) {
  console.log('  所有路径均未发现问题!')
} else {
  console.log(`\n共发现 ${totalIssues} 个问题`)
}
