/**
 * 卡片数值平衡黑箱测试 v2（真实游玩观测 · 异步事件加载修复）
 *
 * 目标：跑真实游戏，逐张卡片读取"实际应用到玩家身上的资金冲击"，
 * 与玩家当时的财富对比，找出"选=没选"的卡片——即财务雄厚时，
 * 某项投资/花费的资金冲击小到无感（如三百万存款只投5000）。
 *
 * 关键修复：drawNarrativeEvent 是异步的（ensurePathDataLoaded().then），
 * 且只在 dismissYearEnd() 时重新抽取。旧测试 commitYear 后事件恒为 null，
 * 导致每年都变成"休养生息"，卡片根本不被触发。
 * 本脚本：commitYear → dismissYearEnd() → await 微任务，确保每年事件被正确抽取。
 *
 * 判定：对"投资型"选项（负 savingsChange + 正回报），当年实际资金冲击
 * |delta|/财富 < 阈值且财富足够高 → "选=没选"。
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
const _origLog = console.log;
console.log = (...args: any[]) => {
  const s = args.join(' ');
  if (String(s).includes('[DEBUG')) return;
  _origLog(...args);
};

import { createPinia, setActivePinia } from 'pinia';
import { useGameStore } from '../src/store/game.store.js';

const PATHS = ['ai_symbiote', 'chain_native', 'digital_nomad', 'super_ip', 'silver_economy', 'bio_gambler'];
const ROUNDS = 40; // 每路径轮数
const WEALTH_THRESHOLD = 1500000; // 财富超过此值才判定"富有"
const DELTA_PCT_THRESHOLD = 0.01; // 资金冲击占财富 < 1% 视为选=没选

interface Hit {
  path: string;
  age: number;
  eventId: string;
  eventTitle: string;
  optionLabel: string;
  wealth: number;
  delta: number;
  pct: number;
  returnType: string[];
}

function isInvestmentOption(opt: any): string[] {
  const hasCost = opt.savingsChange !== undefined && opt.savingsChange < 0;
  if (!hasCost) return [];
  const ret: string[] = [];
  if (opt.passiveIncomeChange && opt.passiveIncomeChange > 0) ret.push('被动收入');
  if (opt.salaryChange && opt.salaryChange > 0) ret.push('加薪');
  if (opt.skillGains) ret.push('技能');
  return ret;
}

function chooseNarrativeOption(event: any, state: any): any {
  const opts = event.options || [];
  if (opts.length === 0) return null;
  let best = opts[0], bestScore = -999;
  for (const o of opts) {
    let sc = 0;
    if (o.hintColor === 'positive') sc += 8;
    if (o.hintColor === 'danger' && state.stress > 75) sc -= 15;
    if (o.skillGains) sc += Object.values(o.skillGains).reduce((a: number, b: any) => a + (b || 0), 0) * 3;
    if (o.savingsChange && o.savingsChange < 0 && state.currentSavings < 100000) sc -= 30;
    if (Math.random() < 0.3) return o; // 30%随机探索，覆盖更多选项
    if (sc > bestScore) { bestScore = sc; best = o; }
  }
  return best;
}

function chooseCrossroadOption(cr: any, state: any): any {
  const opts = cr.options || [];
  if (opts.length === 0) return null;
  let best = opts[0], bestScore = -999;
  for (const o of opts) {
    let sc = 0;
    if (o.hintColor === 'positive') sc += 10;
    if (o.savingsChange && o.savingsChange < 0 && state.currentSavings < 100000) sc -= 30;
    if (sc > bestScore) { bestScore = sc; best = o; }
  }
  return best;
}

// 等待 drawNarrativeEvent 的异步 .then 完成（微任务 + 宏任务兜底）
function tick(): Promise<void> {
  return new Promise(res => setTimeout(res, 0));
}

async function runPath(pathId: string, hits: Hit[]) {
  setActivePinia(createPinia());
  const store = useGameStore();
  store.resetGame();
  store.startNewGame();
  store.setupGame('中坚大后方', '传统私企', 8000, 5000000, 'INTJ' as any, 'farm_hermit' as any);
  store.selectRetirementPath(pathId as any);
  await tick(); // 等待首个事件抽取

  for (let age = 22; age <= 60; age++) {
    const s = store.state;

    // 十字路口
    const cr = store.currentCrossroad;
    if (cr && cr.options?.length) {
      const opt = chooseCrossroadOption(cr, s);
      if (opt) store.selectCrossroadOption(opt.id);
    }

    // 叙事事件：记录被选选项的实际资金冲击
    const ev = store.currentNarrativeEvent;
    let chosenOpt: any = null;
    if (ev && ev.options?.length) {
      chosenOpt = chooseNarrativeOption(ev, s);
      if (chosenOpt) store.selectNarrativeOption(chosenOpt.id);
    }

    const wealthBefore = s.currentSavings;
    const eventTitle = ev?.title || '日常';
    store.commitYear();

    // 从结算结果读取该事件实际应用的存款增量
    const result = (store as any).lastYearResult;
    let delta = 0;
    if (result && result.wellbeingChanges && Array.isArray(result.wellbeingChanges)) {
      const entry = result.wellbeingChanges.find((w: any) => w.source === eventTitle);
      if (entry) delta = entry.savings;
    }
    // 兜底：用前后存款差（可能含其他来源，仅当wellbeing缺省时）
    if (delta === 0 && chosenOpt) {
      delta = store.state.currentSavings - wealthBefore;
    }

    // 记录投资型选项在高财富下的资金冲击
    if (chosenOpt) {
      const ret = isInvestmentOption(chosenOpt);
      if (ret.length > 0 && wealthBefore >= WEALTH_THRESHOLD && delta !== 0) {
        const pct = Math.abs(delta) / wealthBefore;
        if (pct < DELTA_PCT_THRESHOLD) {
          hits.push({
            path: pathId, age, eventId: ev!.id, eventTitle,
            optionLabel: chosenOpt.label, wealth: wealthBefore, delta, pct,
            returnType: ret,
          });
        }
      }
    }

    // 重新抽取下一年事件（必须是 dismissYearEnd 触发，且等待异步）
    await tick();
    store.dismissYearEnd();
    await tick();

    const post = store.state;
    if (post.endingTriggered) return;
    if (post.currentSavings < -300000 || post.health < 20) return;
  }
}

async function main() {
  const hits: Hit[] = [];
  for (const p of PATHS) {
    for (let r = 0; r < ROUNDS; r++) await runPath(p, hits);
  }

  const out: string[] = [];
  const W = (s: string) => { out.push(s); console.log(s); };

  W('\n' + '='.repeat(100));
  W(`  黑箱实测 v2 · ${PATHS.length}路径×${ROUNDS}轮 · 财富≥¥${(WEALTH_THRESHOLD/10000).toFixed(0)}万时`);
  W(`  投资型选项资金冲击<${(DELTA_PCT_THRESHOLD*100).toFixed(1)}%财富 → "选=没选"`);
  W('='.repeat(100));

  // 按事件聚合
  const byEvent: Record<string, { count: number; worstPct: number; worstDelta: number; worstWealth: number; options: Map<string, number>; paths: Set<string>; ages: Set<number>; title: string }> = {};
  for (const h of hits) {
    if (!byEvent[h.eventId]) byEvent[h.eventId] = { count: 0, worstPct: Infinity, worstDelta: 0, worstWealth: 0, options: new Map(), paths: new Set(), ages: new Set(), title: h.eventTitle };
    const d = byEvent[h.eventId];
    d.count++;
    d.worstPct = Math.min(d.worstPct, h.pct);
    d.paths.add(h.path);
    d.ages.add(h.age);
    d.options.set(h.optionLabel, (d.options.get(h.optionLabel) || 0) + 1);
    if (h.delta < d.worstDelta) { d.worstDelta = h.delta; d.worstWealth = h.wealth; }
  }

  const sorted = Object.entries(byEvent).sort((a, b) => a[1].worstPct - b[1].worstPct);
  W(`共 ${hits.length} 次命中，涉及 ${sorted.length} 个事件。\n`);
  for (const [evId, d] of sorted) {
    const optStr = [...d.options.entries()].map(([o, c]) => `${o}×${c}`).join(' | ');
    W(`[${evId}] "${d.title || ''}" ${d.count}次 · 最差冲击占财富${(d.worstPct*100).toFixed(2)}%`);
    W(`    选项: ${optStr}`);
    W(`    最差: 财富¥${(d.worstWealth/10000).toFixed(0)}万 实际资金¥${d.worstDelta.toLocaleString()} 路径:${[...d.paths].join(',')} 年龄:${[...d.ages].join(',')}`);
  }

  W('\n' + '='.repeat(100));
  W(`最差案例 Top8：`);
  const worst = [...hits].sort((a, b) => a.pct - b.pct).slice(0, 8);
  for (const h of worst) {
    W(`  [${h.eventTitle}] "${h.optionLabel}" 财富¥${(h.wealth/10000).toFixed(0)}万 实际资金¥${h.delta.toLocaleString()} 占${(h.pct*100).toFixed(3)}%`);
  }

  const fs = await import('node:fs');
  fs.writeFileSync('c:/Users/10693/.trae-cn/work/6a75f2d14689529c298a29b8/card-balance-report.txt', '\ufeff' + out.join('\n'), 'utf8');
}

main().then(() => process.exit(0));