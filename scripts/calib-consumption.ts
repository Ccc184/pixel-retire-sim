/**
 * 参数化校准：消费压力系数（consumptionPressureMult）对成功率的影响
 * 复用修正后的模拟器（commitYear 后 dismissYearEnd 抽事件）
 * 遍历 consumptionPressureMult ∈ {1.0, 1.2, 1.4, 1.6, 1.8, 2.0}，测各路径成功率
 * 找到能收敛到 60 左右的组合
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
import { checkCanRetire, calculateTotalWealth, setConsumptionPressureMult } from '../src/utils/math-engine.js';

const PATHS = [
  { id: 'ai_symbiote', name: 'AI共生者' },
  { id: 'chain_native', name: '链上原住民' },
  { id: 'digital_nomad', name: '数字游牧民' },
  { id: 'super_ip', name: '超级IP' },
  { id: 'silver_economy', name: '银发守夜人' },
  { id: 'bio_gambler', name: '生物赌徒' },
];
const ROUNDS = 60;
const TARGET_WEALTH = 5000000;

// === 复用已验证的最优策略评分逻辑 ===
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

function floatSerialize(v: any): boolean {
  if (typeof v === 'number' && !Number.isInteger(v) && Math.abs(v) > 0 && Math.abs(Math.round(v) - v) > 1e-6) return true;
  return false;
}

function runPath(pathId: string): any {
  setActivePinia(createPinia());
  const store = useGameStore();
  store.resetGame();
  store.startNewGame();
  store.setupGame('中坚大后方', '传统私企', 8000, TARGET_WEALTH, 'INTJ' as any, 'farm_hermit' as any);
  store.selectRetirementPath(pathId as any);

  let success = false, retireAge = -1, metTarget = false, floatLeak = 0;
  let finalWealth = 0, maxYearPeak = 0;

  for (let age = 22; age <= 60; age++) {
    const s: any = store.state;
    const cr = store.currentCrossroad;
    if (cr && cr.options?.length) { const o = chooseOption(cr.options, s); if (o) store.selectCrossroadOption(o.id); }
    const ev = store.currentNarrativeEvent;
    if (ev && ev.options?.length) { const o = chooseOption(ev.options, s); if (o) store.selectNarrativeOption(o.id); }

    const canRetire = checkCanRetire(store.state);
    const prevW = calculateTotalWealth(store.state);
    if (!metTarget && prevW >= TARGET_WEALTH) { metTarget = true; }
    if (canRetire && prevW >= TARGET_WEALTH && Math.random() < 0.8) {
      store.chooseRetire();
      retireAge = age;
      success = String(store.state.currentEndingId || '').startsWith('path_success_');
      finalWealth = prevW;
      break;
    }

    store.commitYear();
    (store as any).dismissYearEnd && (store as any).dismissYearEnd();
    const post: any = store.state;
    const afterW = calculateTotalWealth(post);
    const gain = afterW - prevW;
    if (gain > maxYearPeak) maxYearPeak = gain;
    finalWealth = afterW;
    if (floatSerialize(post.currentSavings)) floatLeak++;
    if (floatSerialize(post.propertyValue)) floatLeak++;
    if (post.endingTriggered) {
      success = String(post.currentEndingId || '').startsWith('path_success_');
      retireAge = age;
      break;
    }
    if (post.currentSavings < -300000) { retireAge = age; break; }
    if (post.health < 20) { retireAge = age; break; }
  }
  if (retireAge === -1) retireAge = 60;
  return { success, retireAge, metTarget, floatLeak, finalWealth, maxYearPeak };
}

console.log('='.repeat(90));
console.log('  参数化校准 · 消费压力系数 consumptionPressureMult');
console.log('  修正模拟器 · 最优策略 · 60轮/路径/系数');
console.log('='.repeat(90));

const RESULTS: { mult: number; paths: Record<string, any> }[] = [];
for (const mult of [1.0, 1.2, 1.4, 1.6, 1.8, 2.0]) {
  setConsumptionPressureMult(mult);
  const row: Record<string, any> = {};
  for (const p of PATHS) {
    let success = 0, met = 0, retireSum = 0, floatLeak = 0, peak = 0;
    for (let r = 0; r < ROUNDS; r++) {
      const res = runPath(p.id);
      if (res.success) success++;
      if (res.metTarget) met++;
      retireSum += res.retireAge;
      floatLeak += res.floatLeak;
      if (res.maxYearPeak > peak) peak = res.maxYearPeak;
    }
    row[p.id] = {
      name: p.name,
      successRate: (success / ROUNDS * 100).toFixed(1),
      metRate: (met / ROUNDS * 100).toFixed(1),
      avgRetireAge: (retireSum / ROUNDS).toFixed(1),
      floatLeak, peakWealth: Math.round(peak / 10000),
    };
  }
  RESULTS.push({ mult, paths: row });
  console.log(`\n── 消费压力 ×${mult} ──`);
  for (const p of PATHS) {
    const d = row[p.id];
    console.log(`  ${(p.name + '').padEnd(10)}: 成功${d.successRate}% 达标${d.metRate}% 退休${d.avgRetireAge}岁 峰值¥${d.peakWealth}万 浮点${d.floatLeak}`);
  }
}

console.log('\n' + '='.repeat(90));
console.log('  平衡度汇总（成功率%）');
console.log('='.repeat(90));
console.log('  压力  ' + PATHS.map(p => p.name.padEnd(6)).join(' '));
for (const r of RESULTS) {
  const rates = PATHS.map(p => r.paths[p.id].successRate.padStart(6));
  console.log(`  ×${String(r.mult).padEnd(3)}  ${rates.join(' ')}`);
}