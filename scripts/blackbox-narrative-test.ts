/**
 * 全路径黑盒叙事测试 · 玩家视角
 *
 * 以"不知道内部实现"的玩家身份体验6条路径，
 * 收集玩家实际看到的所有叙事文本：
 *   - 每年的叙事事件（标题+选择的选项log）
 *   - 十字路口事件
 *   - 盲盒揭晓文本
 *   - 心境独白
 *   - 日常事件
 *   - 最终结局文本
 *
 * 输出按年份排列的"剧本"，供小说家视角审阅。
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

interface StoryBeat {
  age: number
  type: 'narrative' | 'crossroad' | 'blindbox' | 'monologue' | 'daily' | 'achievement' | 'ending'
  title: string
  text: string
}

const PATHS = [
  { id: 'ai_symbiote', name: 'AI共生者', desc: '驾驭AI浪潮的冲浪者' },
  { id: 'chain_native', name: '链上原住民', desc: '把命运押在区块链上' },
  { id: 'digital_nomad', name: '数字游牧民', desc: '地理套利的自由人' },
  { id: 'super_ip', name: '超级IP', desc: '把自己变成品牌' },
  { id: 'silver_economy', name: '银发收割者', desc: '回老家做老人生意' },
  { id: 'bio_gambler', name: '生物赌徒', desc: '赌抗衰技术突破' },
] as const

// 玩家选择策略（v12平衡版）：
// - 70%概率选log最长（故事感强）
// - 30%概率随机
// - 生存本能：存款<5万时避免savingsChange<-20000的选项（不把自己搞破产）
// - 压力>80时避免stress+10以上的选项（防止压力崩溃螺旋）
function playerChoose(event: any, state: any): number {
  const opts = event.options || []
  if (opts.length === 0) return 0
  const savings = state?.currentSavings ?? 100000
  const stress = state?.stress ?? 0

  // 先过滤掉危险选项（生存本能）
  const allOpts = opts.map((o: any, i: number) => ({ opt: o, idx: i }))
  const dangerous: { opt: any; idx: number }[] = []
  for (const item of allOpts) {
    const o = item.opt
    let isDangerous = false
    // 存款<5万时，避免大额支出
    if (savings < 50000 && typeof o.savingsChange === 'number' && o.savingsChange < -20000) {
      isDangerous = true
    }
    // 压力>80时，避免压力+10以上
    if (stress > 80) {
      if (typeof o.stressChange === 'number' && o.stressChange >= 10) isDangerous = true
      if (o.stateEffect) {
        // 无法执行stateEffect，但可通过hint文本推断
        const hint = (o.hint || '') + ' ' + (o.description || '')
        if (/压力\+(1\d|2\d)/.test(hint)) isDangerous = true
      }
    }
    if (isDangerous) dangerous.push(item)
  }

  // 如果全是危险选项，不得不选（没办法）
  let candidates = allOpts
  if (dangerous.length < allOpts.length) {
    candidates = allOpts.filter((item: any) => !dangerous.includes(item))
  }

  // 30%随机
  if (Math.random() < 0.3) {
    return candidates[Math.floor(Math.random() * candidates.length)].idx
  }
  // 70%选log最长（故事感最强）
  let best = candidates[0].idx, bestLen = -1
  for (const item of candidates) {
    const o = item.opt
    const len = (o.log || o.text || o.hint || '').length
    if (len > bestLen) { bestLen = len; best = item.idx }
  }
  return best
}

function runPath(pathId: string, pathName: string, pathDesc: string): { beats: StoryBeat[]; endingId: string | null; finalAge: number } {
  const store = useGameStore()
  store.resetGame()
  store.startNewGame()
  // 统一开局设定：中坚大后方，传统私企，8000月薪
  store.setupGame('中坚大后方', '传统私企', 8000, 5000000, 'INTJ' as any)
  store.selectRetirementPath(pathId as any)

  const beats: StoryBeat[] = []

  for (let age = 22; age <= 65; age++) {
    const s = store.state

    // 收集心境独白
    const monologue = (s as any).yearOpeningMonologue || (store as any).currentYearOpeningMonologue
    if (monologue) {
      beats.push({ age, type: 'monologue', title: '【心境】', text: typeof monologue === 'string' ? monologue : (monologue.text || monologue.content || JSON.stringify(monologue)) })
    }

    // 处理十字路口
    const crossroad = store.currentCrossroad
    if (crossroad && crossroad.options && crossroad.options.length > 0) {
      const choiceIdx = playerChoose(crossroad, s)
      const opt = crossroad.options[choiceIdx] || crossroad.options[0]
      beats.push({ age, type: 'crossroad', title: `【十字路口】${crossroad.title || ''}`, text: `选项：${opt.label || ''} → ${opt.log || opt.hint || ''}` })
      store.selectCrossroadOption(opt.id)
    }

    // 处理叙事事件
    const event = store.currentNarrativeEvent
    if (event && event.options && event.options.length > 0) {
      const choiceIdx = playerChoose(event, s)
      const opt = event.options[choiceIdx] || event.options[0]
      beats.push({ age, type: 'narrative', title: `【事件】${event.title || event.id || ''}`, text: `选项：${opt.label || ''} → ${opt.log || opt.hint || ''}` })
      store.selectNarrativeOption(opt.id)
    }

    // 玩家选卡：从当年抽到的3张卡中选1-2张（模拟真实玩家行为）
    const availableCards = store.currentCards || []
    if (availableCards.length > 0) {
      // 优先选路径专属卡，其次选通用卡
      const pathCards = availableCards.filter((c: any) => c.pathId === pathId)
      const generalCards = availableCards.filter((c: any) => !c.pathId)
      const cardsToSelect = [...pathCards, ...generalCards].slice(0, Math.random() < 0.5 ? 1 : 2)
      for (const card of cardsToSelect) {
        // 检查前置条件
        if (card.prerequisites && !card.prerequisites(s)) continue
        store.toggleCard(card.id)
        beats.push({ age, type: 'crossroad', title: `【决策卡】${card.title || card.id}`, text: card.description || card.text || '' })
      }
    }

    // 提交年度
    store.commitYear()
    const postS = store.state

    // 收集年度结果中的盲盒揭晓
    const result = store.lastYearResult
    if (result) {
      // 盲盒揭晓
      const reveals = (result as any).blindBoxReveals
      if (reveals && Array.isArray(reveals) && reveals.length > 0) {
        for (const r of reveals) {
          beats.push({ age, type: 'blindbox', title: `【盲盒揭晓】`, text: r.text || r.description || JSON.stringify(r) })
        }
      }
      // 成就
      const achievements = (result as any).newAchievements
      if (achievements && Array.isArray(achievements) && achievements.length > 0) {
        for (const a of achievements) {
          beats.push({ age, type: 'achievement', title: `【成就】${a.title || ''}`, text: a.log || a.narrative || '' })
        }
      }
      // 日常事件
      const dailyEvents = (result as any).dailyEvents
      if (dailyEvents && Array.isArray(dailyEvents) && dailyEvents.length > 0) {
        for (const d of dailyEvents) {
          const dText = d.text || d.description || d.log || ''
          if (dText) beats.push({ age, type: 'daily', title: `【日常】${d.label || ''}`, text: dText })
        }
      }
      // 回声日志（卡牌回声）
      const echoLogs = (result as any).echoLogs
      if (echoLogs && Array.isArray(echoLogs) && echoLogs.length > 0) {
        for (const e of echoLogs) {
          beats.push({ age, type: 'blindbox', title: `【回声】${e.title || ''}`, text: e.log || e.text || '' })
        }
      }
      // 卡片效果日志（含悬念提示）
      const cardDetails = (result as any).cardDetails
      if (cardDetails && Array.isArray(cardDetails) && cardDetails.length > 0) {
        for (const c of cardDetails) {
          beats.push({ age, type: 'daily', title: `【决策】${c.title || ''}`, text: c.log || '' })
        }
      }
    }

    // 检查结局
    if (postS.endingTriggered) {
      const endingText = (postS as any).currentEndingText || (store as any).currentEndingText || ''
      const endingId = String((postS as any).currentEndingId || postS.endingTriggered || 'unknown')
      beats.push({ age, type: 'ending', title: `【结局】${endingId}`, text: typeof endingText === 'string' ? endingText : JSON.stringify(endingText) })
      return { beats, endingId, finalAge: age }
    }
    if (postS.currentSavings < -500000 || postS.health < 15) {
      beats.push({ age, type: 'ending', title: `【结局】forced_end`, text: `存款¥${postS.currentSavings.toLocaleString()} 健康${postS.health}` })
      return { beats, endingId: 'forced_end', finalAge: age }
    }
  }

  return { beats, endingId: null, finalAge: 65 }
}

// ====== 主程序 ======
console.log('='.repeat(80))
console.log('  全路径黑盒叙事测试 · 玩家视角')
console.log('  以"不知道内部实现"的玩家身份体验6条路径，收集所有叙事文本')
console.log('='.repeat(80))

const allResults: { pathId: string; pathName: string; pathDesc: string; beats: StoryBeat[]; endingId: string | null; finalAge: number; beatCount: number }[] = []

for (const path of PATHS) {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`  【${path.name}】${path.desc}`)
  console.log(`${'='.repeat(80)}`)

  const { beats, endingId, finalAge } = runPath(path.id, path.name, path.desc)

  // 统计
  const typeCount: Record<string, number> = {}
  for (const b of beats) {
    typeCount[b.type] = (typeCount[b.type] || 0) + 1
  }

  console.log(`  结局: ${endingId || '无'} | 结束年龄: ${finalAge}岁 | 叙事节拍数: ${beats.length}`)
  console.log(`  节拍分布: ${Object.entries(typeCount).map(([k, v]) => `${k}:${v}`).join('  ')}`)

  // 输出前30个节拍（避免输出过长）
  console.log(`\n  ── 剧本（前30个节拍）──`)
  const shown = beats.slice(0, 30)
  for (const b of shown) {
    const textPreview = b.text.length > 120 ? b.text.slice(0, 120) + '...' : b.text
    console.log(`  ${b.age}岁 ${b.title} ${textPreview}`)
  }
  if (beats.length > 30) {
    console.log(`  ... 还有 ${beats.length - 30} 个节拍未显示`)
  }

  allResults.push({ pathId: path.id, pathName: path.name, pathDesc: path.desc, beats, endingId, finalAge, beatCount: beats.length })
}

// ====== 汇总对比 ======
console.log(`\n${'='.repeat(80)}`)
console.log('  全路径汇总对比')
console.log(`${'='.repeat(80)}`)
console.log('路径            | 结局                | 年龄 | 节拍数 | 叙事事件 | 十字路口 | 盲盒 | 日常 | 独白 | 成就')
console.log('-'.repeat(120))
for (const r of allResults) {
  const tc: Record<string, number> = {}
  for (const b of r.beats) tc[b.type] = (tc[b.type] || 0) + 1
  console.log(
    `${r.pathName.padEnd(14)} | ${(r.endingId || '无').padEnd(18)} | ${String(r.finalAge).padEnd(4)} | ${String(r.beatCount).padEnd(6)} | ${String(tc.narrative || 0).padEnd(8)} | ${String(tc.crossroad || 0).padEnd(8)} | ${String(tc.blindbox || 0).padEnd(4)} | ${String(tc.daily || 0).padEnd(4)} | ${String(tc.monologue || 0).padEnd(4)} | ${String(tc.achievement || 0)}`
  )
}

// ====== 叙事密度分析 ======
console.log(`\n${'='.repeat(80)}`)
console.log('  叙事密度分析（每年平均节拍数）')
console.log(`${'='.repeat(80)}`)
for (const r of allResults) {
  const years = r.finalAge - 22 + 1
  const density = r.beatCount / years
  // 检查空白年份
  const yearsWithBeats = new Set(r.beats.map(b => b.age))
  const emptyYears: number[] = []
  for (let a = 22; a <= r.finalAge; a++) {
    if (!yearsWithBeats.has(a)) emptyYears.push(a)
  }
  console.log(`  ${r.pathName}: ${density.toFixed(1)}节拍/年 | 空白年份: ${emptyYears.length}个${emptyYears.length > 0 && emptyYears.length <= 10 ? ` (${emptyYears.join(',')})` : ''}`)
}

// ====== 输出完整剧本到文件 ======
import { writeFileSync } from 'fs'
let output = ''
for (const r of allResults) {
  output += `\n${'='.repeat(80)}\n`
  output += `  【${r.pathName}】${r.pathDesc}\n`
  output += `  结局: ${r.endingId || '无'} | 结束年龄: ${r.finalAge}岁\n`
  output += `${'='.repeat(80)}\n\n`
  for (const b of r.beats) {
    output += `[${b.age}岁] ${b.title}\n${b.text}\n\n`
  }
  output += `\n${'-'.repeat(80)}\n\n`
}
writeFileSync('scripts/blackbox-output.txt', output, 'utf-8')
console.log(`\n完整剧本已输出到 scripts/blackbox-output.txt`)
