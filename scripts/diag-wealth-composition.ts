/**
 * 财富构成诊断：定位"为什么成功率都90-100%"的根因
 * 复用最优策略，跑少量轮次，打印最终财富构成（存款/房产/链上/生物/被动收入/被动资本化）
 * 以及被动收入峰值、年支出、目标
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
import { calculateTotalWealth } from '../src/utils/math-engine.js';

const PATHS = [
  { id: 'ai_symbiote', name: 'AI共生者' },
  { id: 'chain_native', name: '链上原住民' },
  { id: 'digital_nomad', name: '数字游牧民' },
  { id: 'super_ip', name: '超级IP' },
  { id: 'silver_economy', name: '银发守夜人' },
  { id: 'bio_gambler', name: '生物赌徒' },
];
const ROUNDS = 30;
const TARGET_WEALTH = 5000000;

const AGGRESSIVE = /All In|all_in|allin|all-in|辞职|裸辞|加大|投入|全力|梭哈|押上|拼一把|创业|all in/i;
const REST = /休息|休养|调整|暂停|慢下来|养精蓄锐|不折腾/i;
const GROWTH = /学习|提升|技能|能力|人脉|社群|圈子|积累|练习|打磨/i;
const MONEY = /赚钱|收入|存款|加薪|涨薪|额外收入|被动收入|接单/i;
const RELIEF = /减压|放松|休息|降低压力|减轻压力|散步|休假/i;
const HEALTH = /健康|锻炼|运动|体检|养生/i;
function scoreOption(option: any, state: any): number {
  let score = 0;
  const text = (option.label || '') + ' ' + (option.description || '');
  if (AGGRESSIVE.test(text)) score += 30;
  const g = text.match(GROWTH) || []; score += g.length * 8;
  const m = text.match(MONEY) || []; score += m.length * 6;
  const s = text.match(RELIEF) || []; score += (state.stress > 70 ? s.length * 20 : s.length * 5);
  const h = text.match(HEALTH) || []; score += (state.health < 30 ? h.length * 20 : h.length * 5);
  if (REST.test(text) && state.stress > 65) score += 15;
  if (state.currentSavings < 50000 && /(花掉|花费|支出|投资|投入资金|拿出|掏出)/i.test(text)) score -= 15;
  if (state.health < 30 && /(熬夜|加班|拼命|透支|损害健康)/i.test(text)) score -= 20;
  return score;
}
function chooseOption(opts: any[], state: any): any {
  const avail = (opts || []).filter((o: any) => {
    if (!o.prerequisites) return true;
    try { return o.prerequisites(state); } catch { return false; }
  });
  if (!avail.length) return null;
  let best = avail[0], bs = -999;
  for (const o of avail) { const sc = scoreOption(o, state); if (sc > bs) { bs = sc; best = o; } }
  return best;
}

function runPath(pathId: string): any {
  setActivePinia(createPinia());
  const store = useGameStore();
  store.resetGame();
  store.startNewGame();
  store.setupGame('中坚大后方', '传统私企', 8000, TARGET_WEALTH, 'INTJ' as any, 'farm_hermit' as any);
  store.selectRetirementPath(pathId as any);

  let peakPassive = 0, peakWealth = 0;
  const passiveTrace: number[] = [];
  for (let age = 22; age <= 60; age++) {
    const s: any = store.state;
    const cr = store.currentCrossroad;
    if (cr && cr.options?.length) { const o = chooseOption(cr.options, s); if (o) store.selectCrossroadOption(o.id); }
    const ev = store.currentNarrativeEvent;
    if (ev && ev.options?.length) { const o = chooseOption(ev.options, s); if (o) store.selectNarrativeOption(o.id); }
    if ((s as any).passiveIncome > peakPassive) peakPassive = (s as any).passiveIncome;
    passiveTrace.push((s as any).passiveIncome || 0);
    store.commitYear();
    (store as any).dismissYearEnd && (store as any).dismissYearEnd();
    const s2: any = store.state;
    const w = calculateTotalWealth(s2);
    if (w > peakWealth) peakWealth = w;
    if (s2.endingTriggered) break;
  }
  const final: any = store.state;
  const tw = calculateTotalWealth(final);
  return {
    peakPassive, peakWealth, finalPassive: final.passiveIncome || 0,
    finalSavings: final.currentSavings || 0, finalProperty: final.propertyValue || 0,
    finalChain: (final as any).chainHoldings || 0, finalBio: (final as any).bioPortfolio || 0,
    annualExpense: final.annualBaseCost + (final.currentMortgageCost || 0),
    passiveCapitalized: (final.passiveIncome || 0) * 12,
    metTarget: tw >= TARGET_WEALTH, tw,
    passiveMedian: passiveTrace.sort((a, b) => a - b)[Math.floor(passiveTrace.length / 2)],
  };
}

console.log('='.repeat(110));
console.log('  财富构成诊断 · 30轮最优策略 · 目标¥500万');
console.log('='.repeat(110));
console.log(`  路径       终局总财富  存款     房产     链上     生物     被动收入(峰值)  被动资本化×12  年支出   达标`);
for (const p of PATHS) {
  const runs: any[] = [];
  for (let r = 0; r < ROUNDS; r++) runs.push(runPath(p.id));
  const avg = (k: string) => Math.round(runs.reduce((a, x) => a + x[k], 0) / runs.length);
  const met = runs.filter(r => r.metTarget).length;
  const passivePeakAvg = Math.round(runs.reduce((a, x) => a + x.peakPassive, 0) / runs.length);
  const passiveCapAvg = Math.round(runs.reduce((a, x) => a + x.passiveCapitalized, 0) / runs.length);
  const expAvg = Math.round(runs.reduce((a, x) => a + x.annualExpense, 0) / runs.length);
  console.log(
    `  ${(p.name + '').padEnd(8)}  ¥${(avg('tw') / 10000).toFixed(0)}万  ¥${(avg('finalSavings') / 10000).toFixed(0)}万  ` +
    `¥${(avg('finalProperty') / 10000).toFixed(0)}万  ¥${(avg('finalChain') / 10000).toFixed(0)}万  ¥${(avg('finalBio') / 10000).toFixed(0)}万  ` +
    `¥${(passivePeakAvg / 10000).toFixed(1)}万   ¥${(passiveCapAvg / 10000).toFixed(0)}万     ¥${(expAvg / 10000).toFixed(1)}万  ${met}/${ROUNDS}`
  );
}