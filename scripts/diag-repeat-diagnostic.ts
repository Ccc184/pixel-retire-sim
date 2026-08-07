/**
 * 叙事重复诊断脚本
 *
 * 目的：确认黑箱测试报告中的"叙事重复严重"到底是真重复还是误判
 *
 * 方法：
 * 1. 模拟完整一局游戏（同 blackbox-player-optimal.ts 的初始条件）
 * 2. 记录每年 lifeLog 完整列表（带年龄和原文）
 * 3. 应用 blackbox-player-optimal.ts 中的 repeatLogs 检测逻辑
 *    - 归一化：去数字、标点、空白、年份，保留完整文本
 *    - 排除年度固定模板（开局旁白/月薪调整/通用资产流水）
 * 4. 对判定为"重复"的条目，显示原文对比
 * 5. 显示未被过滤的年度固定模板
 * 6. 人工可判断：是真重复（同一事件反复触发）还是误判（归一化过度/模板文本）
 */

const _store: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => _store[k] ?? null,
  setItem: (k: string, v: string) => { _store[k] = v },
  removeItem: (k: string) => { delete _store[k] },
  clear: () => { Object.keys(_store).forEach(k => delete _store[k]) },
};
(globalThis as any).window = globalThis;
(globalThis as any).requestIdleCallback = (cb: () => void) => setTimeout(cb, 0);
(globalThis as any).cancelIdleCallback = (id: any) => clearTimeout(id);

import { createPinia, setActivePinia } from 'pinia';
import { useGameStore } from '../src/store/game.store.js';
import { checkCanRetire, calculateTotalWealth } from '../src/utils/math-engine.js';

// ============ 配置 ============
const TARGET_WEALTH = 5000000;

// 从 blackbox-player-optimal.ts 复制的评分函数
const AGGRESSIVE_WORDS = /All In|all_in|allin|all-in|辞职|裸辞|加大|投入|全力|梭哈|押上|拼一把|创业|all in/i;
const REST_WORDS = /休息|休养|调整|暂停|慢下来|养精蓄锐|不折腾/i;
const GROWTH_WORDS = /学习|提升|技能|能力|人脉|社群|圈子|积累|练习|打磨/i;
const MONEY_WORDS = /赚钱|收入|存款|加薪|涨薪|额外收入|被动收入|接单/i;
const STRESS_RELIEF_WORDS = /减压|放松|休息|降低压力|减轻压力|散步|休假/i;
const HEALTH_WORDS = /健康|锻炼|运动|体检|养生/i;

function scoreNarrativeOption(option: any, state: any): number {
  let score = 0;
  const text = (option.label || '') + ' ' + (option.description || '');
  if (AGGRESSIVE_WORDS.test(text)) score += 30;
  const growthMatches = text.match(GROWTH_WORDS) || [];
  score += growthMatches.length * 8;
  const moneyMatches = text.match(MONEY_WORDS) || [];
  score += moneyMatches.length * 6;
  const stressMatches = text.match(STRESS_RELIEF_WORDS) || [];
  if (state.stress > 70) { score += stressMatches.length * 20; } else { score += stressMatches.length * 5; }
  const healthMatches = text.match(HEALTH_WORDS) || [];
  if (state.health < 30) { score += healthMatches.length * 20; } else { score += healthMatches.length * 5; }
  if (REST_WORDS.test(text) && state.stress > 65) score += 15;
  if (state.currentSavings < 50000) {
    if (/(花掉|花费|支出|投资|投入资金|拿出|掏出)/i.test(text)) score -= 15;
  }
  if (state.health < 30) {
    if (/(熬夜|加班|拼命|透支|损害健康)/i.test(text)) score -= 20;
  }
  return score;
}

function chooseNarrativeOption(event: any, state: any): any {
  const opts = (event.options || []).filter((o: any) => {
    if (!o.prerequisites) return true;
    try { return o.prerequisites(state); } catch { return false; }
  });
  if (opts.length === 0) return null;
  let best = opts[0];
  let bestScore = -999;
  for (const o of opts) {
    const sc = scoreNarrativeOption(o, state);
    if (sc > bestScore) { bestScore = sc; best = o; }
  }
  return best;
}

function scoreCrossroadOption(option: any, state: any): number {
  let score = 0;
  const text = (option.label || '') + ' ' + (option.description || '');
  if (AGGRESSIVE_WORDS.test(text)) score += 40;
  const growthMatches = text.match(GROWTH_WORDS) || [];
  score += growthMatches.length * 8;
  const moneyMatches = text.match(MONEY_WORDS) || [];
  score += moneyMatches.length * 6;
  const stressMatches = text.match(STRESS_RELIEF_WORDS) || [];
  if (state.stress > 70) { score += stressMatches.length * 20; } else { score += stressMatches.length * 5; }
  const healthMatches = text.match(HEALTH_WORDS) || [];
  if (state.health < 30) { score += healthMatches.length * 20; } else { score += healthMatches.length * 5; }
  if (REST_WORDS.test(text) && state.stress > 65) score += 15;
  if (state.currentSavings < 50000) {
    if (/(花掉|花费|支出|投资|投入资金|拿出|掏出)/i.test(text)) score -= 15;
  }
  if (state.health < 30) {
    if (/(熬夜|加班|拼命|透支|损害健康)/i.test(text)) score -= 20;
  }
  return score;
}

function chooseCrossroadOption(cr: any, state: any): any {
  const opts = (cr.options || []).filter((o: any) => {
    if (!o.prerequisites) return true;
    try { return o.prerequisites(state); } catch { return false; }
  });
  if (opts.length === 0) return null;
  let best = opts[0];
  let bestScore = -999;
  for (const o of opts) {
    const sc = scoreCrossroadOption(o, state);
    if (sc > bestScore) { bestScore = sc; best = o; }
  }
  return best;
}

// ============ 归一化函数（同 blackbox-player-optimal.ts） ============
function normalizeLog(text: string): string {
  return text.replace(/[\d，。、！？\s：:；;（）()【】\[\]“”"'\n]/g, '');
}

// 排除模式（同 blackbox-player-optimal.ts）
const EXCLUDE_PATTERN = /(职业生涯正式开局|月薪从¥调整为|累计支出|年度支出|存款总额|被动收入|本月生活费)/;

// ============ 入口 ============
const PATH_IDS = [
  'ai_symbiote', 'chain_native', 'digital_nomad', 'super_ip', 'silver_economy', 'bio_gambler'
];
const PATH_NAMES: Record<string, string> = {
  ai_symbiote: 'AI共生者', chain_native: '链上原住民', digital_nomad: '数字游牧民',
  super_ip: '超级IP', silver_economy: '银发守夜人', bio_gambler: '生物赌徒',
};

function runOneGame(pathId: string): void {
  setActivePinia(createPinia());
  const store = useGameStore();
  store.resetGame();
  store.startNewGame();
  store.setupGame('中坚大后方', '传统私企', 8000, TARGET_WEALTH, 'INTJ' as any, 'farm_hermit' as any);
  store.selectRetirementPath(pathId as any);

  // 记录完整 lifeLog
  const allLogs: Array<{ age: number; text: string; normalized: string }> = [];

  // 记录开局 lifeLog
  const initialLogs = store.state.lifeLog || [];
  for (const l of initialLogs) {
    allLogs.push({ age: 22, text: l, normalized: normalizeLog(l) });
  }

  let prevLogCount = initialLogs.length;

  for (let age = 22; age <= 60; age++) {
    const s = store.state;

    // 十字路口
    const cr = store.currentCrossroad;
    if (cr && cr.options?.length) {
      const opt = chooseCrossroadOption(cr, s);
      if (opt) store.selectCrossroadOption(opt.id);
    }
    // 叙事事件
    const ev = store.currentNarrativeEvent;
    if (ev && ev.options?.length) {
      const opt = chooseNarrativeOption(ev, s);
      if (opt) store.selectNarrativeOption(opt.id);
    }

    store.commitYear();
    (store as any).dismissYearEnd && (store as any).dismissYearEnd();

    // 记录新增的 lifeLog
    const currentLogs = store.state.lifeLog || [];
    for (let i = prevLogCount; i < currentLogs.length; i++) {
      allLogs.push({ age, text: currentLogs[i], normalized: normalizeLog(currentLogs[i]) });
    }
    prevLogCount = currentLogs.length;

    // 检查游戏结束
    const post = store.state;
    if (post.endingTriggered) break;
    if (post.currentSavings < -300000) break;
    if (post.health < 20) break;
  }

  // ============ 执行重复检测 ============
  const seenLogs = new Set<string>();
  const repeatEntries: Array<{
    age: number;
    text: string;
    normalized: string;
    firstAge: number;
    firstText: string;
    firstIndex: number;
    currentIndex: number;
  }> = [];
  const filteredEntries: Array<{ age: number; text: string; normalized: string; reason: string }> = [];
  const uniqueEntries: Array<{ age: number; text: string; normalized: string }> = [];

  for (let i = 0; i < allLogs.length; i++) {
    const entry = allLogs[i];
    const key = entry.normalized;

    // 检查长度
    if (entry.text.length <= 20) {
      filteredEntries.push({ ...entry, reason: '文本过短(<=20字符)' });
      continue;
    }

    // 检查排除模式
    if (EXCLUDE_PATTERN.test(key)) {
      filteredEntries.push({ ...entry, reason: '年度固定模板(被排除)' });
      continue;
    }

    // 检查重复
    if (seenLogs.has(key)) {
      const firstMatch = uniqueEntries.find(u => u.normalized === key);
      repeatEntries.push({
        age: entry.age,
        text: entry.text,
        normalized: key,
        firstAge: firstMatch?.age ?? -1,
        firstText: firstMatch?.text ?? '',
        firstIndex: uniqueEntries.findIndex(u => u.normalized === key),
        currentIndex: i,
      });
    } else {
      seenLogs.add(key);
      uniqueEntries.push(entry);
    }
  }

  // ============ 输出结果 ============
  const pathName = PATH_NAMES[pathId] || pathId;
  console.log('\n' + '='.repeat(100));
  console.log(`  路径: ${pathName} (${pathId})`);
  console.log('='.repeat(100));
  console.log(`  总 lifeLog 条目数: ${allLogs.length}`);
  console.log(`  被过滤(年度模板/过短): ${filteredEntries.length}`);
  console.log(`  判定为重复的条目数: ${repeatEntries.length}`);
  console.log(`  唯一(非重复)条目数: ${uniqueEntries.length}`);

  // 按重复类型统计
  const byNormalized = new Map<string, { text: string; ages: number[]; firstAge: number; firstText: string }>();
  for (const r of repeatEntries) {
    if (!byNormalized.has(r.normalized)) {
      byNormalized.set(r.normalized, {
        text: r.text,
        ages: [r.firstAge, r.age],
        firstAge: r.firstAge,
        firstText: r.firstText,
      });
    } else {
      const existing = byNormalized.get(r.normalized)!;
      existing.ages.push(r.age);
    }
  }

  if (repeatEntries.length > 0) {
    console.log('\n' + '='.repeat(100));
    console.log('【重复分析：按归一化文本分组】');
    console.log('='.repeat(100));
    for (const [key, info] of byNormalized) {
      console.log(`\n  归一化文本: "${key}"`);
      console.log(`  首次出现年龄: ${info.firstAge} · 重复出现年龄: ${info.ages.map(a => a + '岁').join(', ')}`);
      console.log(`  首次原文: ${info.firstText}`);
      console.log(`  重复原文: ${info.text}`);
      // 判断类型
      if (info.text.includes('月薪从') || info.text.includes('调整为')) {
        console.log(`  >> 类型: 月薪调整模板 (本应被排除但未匹配到排除模式)`);
      } else if (info.text.includes('第') && info.text.includes('岁，')) {
        console.log(`  >> 类型: 年度叙事/开场白模板`);
      } else if (info.text.includes('决定') || info.text.includes('按钮')) {
        console.log(`  >> 类型: 系统提示(退休/攒够等)`);
      } else if (info.text.includes('你') && info.text.length > 30) {
        console.log(`  >> 类型: 叙事事件日志`);
      }
    }
  }

  // 输出完整 lifeLog 列表（简短版）
  console.log('\n' + '─'.repeat(100));
  console.log('【完整 lifeLog 时间线】');
  console.log('─'.repeat(100));
  for (let i = 0; i < allLogs.length; i++) {
    const e = allLogs[i];
    const isDup = repeatEntries.some(r => r.currentIndex === i);
    const isFiltered = filteredEntries.some(f => f.age === e.age && f.text === e.text && f.normalized === e.normalized);
    let tag = '';
    if (isDup) tag = ' <<< 重复';
    else if (isFiltered) tag = ' [已过滤]';
    console.log(`  #${i.toString().padStart(2)} 年龄${e.age.toString().padStart(2)}${tag}`);
    console.log(`    ${e.text}`);
  }

  // 输出被过滤的条目
  if (filteredEntries.length > 0) {
    console.log('\n' + '─'.repeat(100));
    console.log('【被过滤的年度固定模板列表】');
    console.log('─'.repeat(100));
    for (const f of filteredEntries) {
      console.log(`  [年龄${f.age}] ${f.reason}`);
      console.log(`    ${f.text}`);
    }
  }

  console.log('\n' + '='.repeat(100));
  console.log(`  ${pathName} 诊断完成`);
  console.log('='.repeat(100));
}

// ============ 执行 ============
for (const pid of PATH_IDS) {
  runOneGame(pid);
}