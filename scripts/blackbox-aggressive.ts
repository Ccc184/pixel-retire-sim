/**
 * 激进/最优策略黑箱测试
 *
 * 与 blackbox-v2 的保守策略对比：
 *  - 十字路口：凡提示含"All In/辞职/赌/加大/投入/风险"的 danger 选项一律选中（激进创业/All In）
 *  - 叙事事件：优先选技能增益大、被动收入、月薪提升、正 savingsChange 的选项
 *  - 投资配比：开激进配置（高投机/高指数），模拟敢于梭哈的玩家
 *  - 城市：可迁往低成本城市套利
 *  - 退休：达标即退休（50%概率，与保守版一致便于对比）
 *
 * 统计：成功率(达标并成功退休)、达标率、平均达标年龄、单年峰值、结局分布
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

const PATHS = [
  { id: 'ai_symbiote', name: 'AI共生者' },
  { id: 'chain_native', name: '链上原住民' },
  { id: 'digital_nomad', name: '数字游牧民' },
  { id: 'super_ip', name: '超级IP' },
  { id: 'silver_economy', name: '银发守夜人' },
  { id: 'bio_gambler', name: '生物赌徒' },
];

const ROUNDS = 300;
const TARGET_WEALTH = 5000000;

interface SimRes {
  endingId: string;
  retireAge: number;
  metTarget: boolean;
  targetMetAge: number;
  totalWealth: number;
  maxSingleYearGain: number;
  allIn: boolean;
}

/** 激进策略挑十字路口：优先 All In / 创业 / 高风险高回报 */
function chooseCrossroadOption(cr: any, state: any): any {
  const opts = cr.options || [];
  if (opts.length === 0) return null;
  const AGGRESSIVE_HINTS = /All In|all_in|辞职|赌|加大|投入|梭哈|全力|allin|创业|裸辞|押上|拼一把|all-in/i;
  let best = opts[0];
  let bestScore = -999;
  for (const o of opts) {
    let sc = 0;
    const hint = (o.hint || '') + (o.label || '') + (o.description || '');
    // 激进优先级：命中 All In/辞职/赌 → 最高分
    if (AGGRESSIVE_HINTS.test(hint)) sc += 100;
    if (o.hintColor === 'danger') sc += 30;
    if (o.hintColor === 'positive') sc += 15;
    if (o.hintColor === 'neutral') sc -= 5;
    // 有可用资金时优先激进，否则更保守一点
    if (state.currentSavings < 50000) sc -= 20;
    if (sc > bestScore) { bestScore = sc; best = o; }
  }
  return best;
}

/** 激进策略挑叙事事件：优先技能增益/被动收入/涨薪/高收益 */
function chooseNarrativeOption(event: any, state: any): any {
  const opts = event.options || [];
  if (opts.length === 0) return null;
  let best = opts[0];
  let bestScore = -999;
  for (const o of opts) {
    let sc = 0;
    const hin = (o.hint || '') + (o.label || '');
    // 高风险高回报（danger 但收益大）也考虑
    if (AGGRESSIVE_RE.test(hin)) sc += 60;
    if (o.hintColor === 'positive') sc += 12;
    if (o.skillGains) sc += Object.values(o.skillGains).reduce((a: number, b: any) => a + (b || 0), 0) * 4;
    // 被动收入/涨薪优先
    if (o.passiveIncomeGain) sc += o.passiveIncomeGain / 100;
    if (o.salaryChange && o.salaryChange > 0) sc += o.salaryChange / 1000;
    if (o.savingsChange && o.savingsChange > 0) sc += o.savingsChange / 10000;
    if (o.savingsChange && o.savingsChange < 0 && state.currentSavings < 100000) sc -= 40;
    if (o.isRestOption && state.stress > 85) sc += 15;
    if (sc > bestScore) { bestScore = sc; best = o; }
  }
  return best;
}
const AGGRESSIVE_RE = /all in|all_in|赌|梭哈|加大|投入|高风险|allin|all-in/i;

function runPathAggressive(pathId: string): SimRes {
  setActivePinia(createPinia());
  const store = useGameStore();
  store.resetGame();
  store.startNewGame();
  store.setupGame('中坚大后方', '传统私企', 8000, TARGET_WEALTH, 'INTJ' as any, 'farm_hermit' as any);
  store.selectRetirementPath(pathId as any);

  const res: SimRes = {
    endingId: 'timeout', retireAge: -1, metTarget: false, targetMetAge: -1,
    totalWealth: 0, maxSingleYearGain: 0, allIn: false,
  };

  let prevWealth = initialWealth(store.state);
  res.allIn = (store.state as any).isAllInPath || false;

  for (let age = 22; age <= 60; age++) {
    const s = store.state;

    // 激进投资配比：低存款、高指数、高投机（模拟敢梭哈）
    try { store.setInvestment(20, 40, 40); } catch (e) { /* ignore */ }

    const cr = store.currentCrossroad;
    if (cr && cr.options?.length) {
      const opt = chooseCrossroadOption(cr, s);
      if (opt) store.selectCrossroadOption(opt.id);
    }
    const ev = store.currentNarrativeEvent;
    if (ev && ev.options?.length) {
      const opt = chooseNarrativeOption(ev, s);
      if (opt) store.selectNarrativeOption(opt.id);
    }

    // 达标即可能退休（50%概率，与保守版一致）
    const wealth = calculateTotalWealth(store.state);
    if (wealth >= TARGET_WEALTH && !res.metTarget) { res.metTarget = true; res.targetMetAge = age; }
    if (checkCanRetire(store.state) && wealth >= TARGET_WEALTH) {
      if (Math.random() < 0.5) {
        store.chooseRetire();
        res.retireAge = age;
        res.endingId = String(store.state.currentEndingId || 'retired');
        break;
      }
    }

    store.commitYear();

    const post = store.state;
    if ((post as any).isAllInPath) res.allIn = true;
    const w = calculateTotalWealth(post);
    const gain = w - prevWealth;
    if (gain > res.maxSingleYearGain) res.maxSingleYearGain = gain;
    prevWealth = w;
    res.totalWealth = w;

    if (post.endingTriggered) {
      res.endingId = String(post.currentEndingId || 'unknown');
      res.retireAge = age;
      break;
    }
    if (post.currentSavings < -300000) { res.endingId = 'E8_bankrupt'; res.retireAge = age; break; }
    if (post.health < 20) { res.endingId = 'E4_health'; res.retireAge = age; break; }
  }
  if (res.retireAge === -1) res.retireAge = 60;
  return res;
}

function initialWealth(s: any): number {
  return (s.currentSavings || 0) + (s.propertyValue || 0) + ((s as any).chainHoldings || 0) + ((s as any).bioPortfolio || 0) + (s.shopValue || 0) + (s.passiveIncome || 0) * 20;
}

// ===== 执行 =====
console.log('='.repeat(90));
console.log('  激进策略黑箱测试（最优/高风险玩法）');
console.log(`  条件: 中坚大后方/传统私企/起薪8000/INTJ/目标${(TARGET_WEALTH/10000).toFixed(0)}万 · 达标即退休(50%)`);
console.log('='.repeat(90));

const summary: Record<string, any> = {};
for (const p of PATHS) {
  const dist: Record<string, number> = {};
  let success = 0, failure = 0, metRate = 0, allInCnt = 0;
  let metAgeSum = 0, metCnt = 0;
  let maxSingleYear = 0;
  for (let r = 0; r < ROUNDS; r++) {
    const res = runPathAggressive(p.id);
    dist[res.endingId] = (dist[res.endingId] || 0) + 1;
    if (res.endingId.startsWith('path_success_')) success++;
    if (res.endingId.startsWith('path_failure_')) failure++;
    if (res.metTarget) metRate++;
    if (res.targetMetAge > 0) { metAgeSum += res.targetMetAge; metCnt++; }
    if (res.allIn) allInCnt++;
    if (res.maxSingleYearGain > maxSingleYear) maxSingleYear = res.maxSingleYearGain;
  }
  summary[p.id] = {
    name: p.name, dist, success, failure,
    metRate: metRate / ROUNDS, allInRate: allInCnt / ROUNDS,
    avgMetAge: metCnt ? (metAgeSum / metCnt).toFixed(1) : '-',
    maxSingleYear,
  };
  console.log(`\n── ${p.name} ──`);
  console.log(`  成功:${success}(${(success/ROUNDS*100).toFixed(1)}%) 失败:${failure}(0.0%) 达标率:${(metRate/ROUNDS*100).toFixed(1)}% All In:${(allInCnt/ROUNDS*100).toFixed(0)}%`);
  console.log(`  平均达标年龄:${summary[p.id].avgMetAge} 单年最大增值:¥${(maxSingleYear/10000).toFixed(1)}万`);
  const topEndings = Object.entries(dist).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>`${k}:${v}`).join(', ');
  console.log(`  结局分布: ${topEndings}`);
}

console.log('\n' + '='.repeat(90));
console.log('  成功率对比（激进 vs 保守）');
console.log('='.repeat(90));
PATHS.forEach(p => {
  const s = summary[p.id];
  console.log(`  ${p.name.padEnd(10)}: 激进成功${(s.success/ROUNDS*100).toFixed(1)}% 达标${(s.metRate*100).toFixed(1)}% AllIn${(s.allInRate*100).toFixed(0)}% 峰值¥${(s.maxSingleYear/10000).toFixed(0)}万`);
});