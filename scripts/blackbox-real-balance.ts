/**
 * 黑箱卡片数值平衡测试（真实游玩观测）
 *
 * 目标：跑真实游戏，从每次结算的 wellbeingChanges 里读出每个叙事选项（卡片）
 * 实际应用到玩家身上的存款增量（含缩放），与玩家当时的财富对比，
 * 找出"选=没选"的卡片——即财力雄厚时，某项投资/花费的资金冲击小到无感。
 *
 * 判定：对"投资型"选项（同时有负 savingsChange 与正回报 passiveIncomeChange/
 * salaryChange/skillGains），当玩家财富超过一定档位后，若实际资金冲击
 * |delta|/wealth < 阈值，则视为"选=没选"。
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
// 抑制游戏内部 DEBUG 日志
const _origLog = console.log;
console.log = (...args: any[]) => {
  const s = args.join(' ');
  if (String(s).includes('[DEBUG')) return; // 过滤游戏调试日志
  _origLog(...args);
};

import { createPinia, setActivePinia } from 'pinia';
import { useGameStore } from '../src/store/game.store.js';

const PATHS = ['ai_symbiote', 'chain_native', 'digital_nomad', 'super_ip', 'silver_economy', 'bio_gambler'];
const ROUNDS = 30; // 每路径轮数
const WEALTH_THRESHOLD = 3000000; // 判定"富有"的财富门槛
const DELTA_PCT_THRESHOLD = 0.005; // 资金冲击占财富比例低于0.5%视为选=没选

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

function isInvestmentOption(opt: any): boolean {
  const hasSpend = opt.savingsChange !== undefined && opt.savingsChange < 0;
  if (!hasSpend) return false;
  const ret: string[] = [];
  if (opt.passiveIncomeChange && opt.passiveIncomeChange > 0) ret.push('被动收入');
  if (opt.salaryChange && opt.salaryChange > 0) ret.push('加薪');
  if (opt.skillGains) ret.push('技能');
  return ret.length > 0;
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
    if (Math.random() < 0.3) return o; // 30%随机探索
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

function runPath(pathId: string, hits: Hit[]) {
  setActivePinia(createPinia());
  const store = useGameStore();
  store.resetGame();
  store.startNewGame();
  store.setupGame('中坚大后方', '传统私企', 8000, 5000000, 'INTJ' as any, 'farm_hermit' as any);
  store.selectRetirementPath(pathId as any);

  for (let age = 22; age <= 60; age++) {
    const s = store.state;
    const cr = store.currentCrossroad;
    if (cr && cr.options?.length) {
      const opt = chooseCrossroadOption(cr, s);
      if (opt) store.selectCrossroadOption(opt.id);
    }
    const ev = store.currentNarrativeEvent;
    let chosenOpt: any = null;
    if (ev && ev.options?.length) {
      chosenOpt = chooseNarrativeOption(ev, s);
      if (chosenOpt) store.selectNarrativeOption(chosenOpt.id);
    }

    const wealthBefore = s.currentSavings;
    store.commitYear();

    // 从结算结果读取该事件实际应用的存款增量
    const result = store.lastYearResult;
    let delta = 0;
    if (result && result.wellbeingChanges && chosenOpt) {
      const entry = result.wellbeingChanges.find((w: any) => w.source === (ev!.title || '日常'));
      if (entry) delta = entry.savings;
    }
    // 若找不到，用前后存款差（可能有其他来源干扰，仅兜底）
    if (delta === 0 && chosenOpt) {
      delta = s.currentSavings - wealthBefore;
    }

    // 记录投资型选项在高财富下的资金冲击
    if (chosenOpt && isInvestmentOption(chosenOpt) && wealthBefore >= WEALTH_THRESHOLD && Math.abs(delta) > 0) {
      const pct = Math.abs(delta) / wealthBefore;
      if (pct < DELTA_PCT_THRESHOLD) {
        hits.push({
          path: pathId, age, eventId: ev!.id, eventTitle: ev!.title,
          optionLabel: chosenOpt.label, wealth: wealthBefore, delta, pct,
          returnType: isInvestmentOption(chosenOpt),
        });
      }
    }

    const post = store.state;
    if (post.endingTriggered) return;
    if (post.currentSavings < -300000 || post.health < 20) return;
  }
}

function main() {
  const hits: Hit[] = [];
  for (const p of PATHS) {
    for (let r = 0; r < ROUNDS; r++) runPath(p, hits);
  }

  console.log('\n' + '='.repeat(100));
  console.log(`  黑箱实测 · ${PATHS.length}路径×${ROUNDS}轮 · 财富≥${(WEALTH_THRESHOLD/10000).toFixed(0)}万时` +
    ` · 资金冲击<${(DELTA_PCT_THRESHOLD*100).toFixed(1)}%的"投资型"选择`);
  console.log('='.repeat(100));

  // 按事件聚合
  const byEvent: Record<string, { count: number; worstPct: number; worstDelta: number; worstWealth: number; options: Set<string>; paths: Set<string> }> = {};
  for (const h of hits) {
    const key = `${h.eventId}`;
    if (!byEvent[key]) byEvent[key] = { count: 0, worstPct: Infinity, worstDelta: 0, worstWealth: 0, options: new Set(), paths: new Set() };
    byEvent[key].count++;
    byEvent[key].worstPct = Math.min(byEvent[key].worstPct, h.pct);
    byEvent[key].paths.add(h.path);
    byEvent[key].options.add(h.optionLabel);
    if (h.delta < byEvent[key].worstDelta) { byEvent[key].worstDelta = h.delta; byEvent[key].worstWealth = h.wealth; }
  }

  const sorted = Object.entries(byEvent).sort((a, b) => a[1].worstPct - b[1].worstPct);
  console.log(`共 ${hits.length} 次命中，涉及 ${sorted.length} 个事件。\n`);
  for (const [evId, d] of sorted) {
    console.log(`[${evId}] ${d.count}次 · 最差资金冲击占财富${(d.worstPct*100).toFixed(2)}%`);
    console.log(`    路径: ${[...d.paths].join(',')}`);
    console.log(`    选项: ${[...d.options].join(' | ')}`);
  }

  console.log('\n' + '='.repeat(100));
  console.log(`最差案例前三：`);
  const worst = [...hits].sort((a, b) => a.pct - b.pct).slice(0, 3);
  for (const h of worst) {
    console.log(`  [${h.eventTitle}] "${h.optionLabel}" 财富¥${(h.wealth/10000).toFixed(0)}万 实际资金¥${h.delta.toLocaleString()} 占${(h.pct*100).toFixed(2)}%`);
  }
}

main();