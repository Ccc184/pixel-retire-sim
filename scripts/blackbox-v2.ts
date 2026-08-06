/**
 * 黑箱测试 v2 - 基于当前版本（6参数setupGame / 自由退休 / targetWealth判定）
 * 6路径 × N轮蒙特卡洛，统计结局分布、平衡、退休、数值健康度
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

const ROUNDS = 200;
const TARGET_WEALTH = 5000000;

interface SimRes {
  endingId: string;
  retireAge: number;
  metTarget: boolean;
  targetMetAge: number;
  totalWealth: number;
  maxSingleYearGain: number;
  maxExposure: number; // 单年存款增量峰值
  floatLeak: string[]; // 浮点泄漏样本
  repeatLogs: string[]; // 重复叙事样本
}

function chooseNarrativeOption(event: any, state: any): any {
  const opts = event.options || [];
  if (opts.length === 0) return null;
  let best = opts[0];
  let bestScore = -999;
  for (const o of opts) {
    let sc = 0;
    if (o.skillGains) sc += Object.values(o.skillGains).reduce((a: number, b: any) => a + (b || 0), 0) * 3;
    if (o.hintColor === 'positive') sc += 8;
    if (o.hintColor === 'danger' && state.stress > 75) sc -= 15;
    if (o.isRestOption && state.stress > 70) sc += 25;
    if (o.hint?.includes('信念')) sc += 4;
    if (o.savingsChange && o.savingsChange > 0) sc += o.savingsChange / 10000;
    if (o.savingsChange && o.savingsChange < 0 && state.currentSavings < 100000) sc -= 30;
    if (sc > bestScore) { bestScore = sc; best = o; }
  }
  return best;
}

function chooseCrossroadOption(cr: any, state: any): any {
  const opts = cr.options || [];
  if (opts.length === 0) return null;
  let best = opts[0];
  let bestScore = -999;
  for (const o of opts) {
    let sc = 0;
    if (o.hintColor === 'positive') sc += 10;
    if (o.hintColor === 'danger' && state.stress > 75) sc -= 15;
    if (o.label?.includes('All In') || o.label?.includes('加大')) sc += 5;
    if (o.savingsChange && o.savingsChange < 0 && state.currentSavings < 100000) sc -= 30;
    if (sc > bestScore) { bestScore = sc; best = o; }
  }
  return best;
}

function floatSerialize(v: any): boolean {
  if (typeof v === 'number' && !Number.isInteger(v) && Math.abs(v) > 0 && Math.abs(Math.round(v) - v) > 1e-6) return true;
  return false;
}

function runPath(pathId: string, retireOnMet: boolean): SimRes {
  setActivePinia(createPinia());
  const store = useGameStore();
  store.resetGame();
  store.startNewGame();
  store.setupGame('中坚大后方', '传统私企', 8000, TARGET_WEALTH, 'INTJ' as any, 'farm_hermit' as any);
  store.selectRetirementPath(pathId as any);

  const res: SimRes = {
    endingId: 'timeout', retireAge: -1, metTarget: false, targetMetAge: -1,
    totalWealth: 0, maxSingleYearGain: 0, maxExposure: 0, floatLeak: [], repeatLogs: [],
  };

  let prevWealth = initialWealth(store.state);
  const seenLogs = new Set<string>();

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

    // 退休决策
    if (retireOnMet) {
      const canRetire = checkCanRetire(store.state);
      const wealth = calculateTotalWealth(store.state);
      if (wealth >= TARGET_WEALTH && !res.metTarget) {
        res.metTarget = true;
        res.targetMetAge = age;
      }
      if (canRetire && wealth >= TARGET_WEALTH) {
        // 达标后以50%概率退休，否则继续观察
        if (Math.random() < 0.5) {
          store.chooseRetire();
          res.retireAge = age;
          res.endingId = String(store.state.currentEndingId || 'retired');
          break;
        }
      }
    }

    store.commitYear();

    const post = store.state;
    // 数值健康检查
    const w = calculateTotalWealth(post);
    const gain = w - prevWealth;
    if (gain > res.maxSingleYearGain) res.maxSingleYearGain = gain;
    prevWealth = w;
    res.totalWealth = w;

    // 浮点泄漏检测
    if (!res.metTarget && w >= TARGET_WEALTH) { res.metTarget = true; res.targetMetAge = age; }

    // 叙事重复检测（lifeLog尾部）
    const logs = post.lifeLog || [];
    if (logs.length > 0) {
      const recent = logs.slice(0, 12);
      for (const l of recent) {
        if (l && l.length > 12) {
          const key = l.replace(/[第\d+岁，。、]/g, '');
          if (seenLogs.has(key)) {
            if (!res.repeatLogs.includes(key)) res.repeatLogs.push(key);
          } else seenLogs.add(key);
        }
      }
    }

    // 浮点泄漏
    if (floatSerialize(post.currentSavings)) {
      if (!res.floatLeak.includes(String(post.currentSavings))) res.floatLeak.push(String(post.currentSavings));
    }

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

// ===== 执行：策略A 达标即可能退休 =====
console.log('='.repeat(90));
console.log('  黑箱测试 v2 · 策略A(达标即退休, 50%概率)');
console.log(`  条件: 中坚大后方/传统私企/起薪8000/INTJ/目标${(TARGET_WEALTH/10000).toFixed(0)}万`);
console.log('='.repeat(90));

const summaryA: Record<string, any> = {};
for (const p of PATHS) {
  const dist: Record<string, number> = {};
  let success = 0, failure = 0, retiredUntarget = 0, metRate = 0;
  let metAgeSum = 0, metCnt = 0, retireAgeSum = 0;
  let maxSingleYear = 0, floatCount = 0, repeatCount = 0;
  const floats: string[] = [];
  for (let r = 0; r < ROUNDS; r++) {
    const res = runPath(p.id, true);
    dist[res.endingId] = (dist[res.endingId] || 0) + 1;
    if (res.endingId.startsWith('path_success_')) success++;
    if (res.endingId.startsWith('path_failure_')) failure++;
    if (res.metTarget) { metRate++; }
    if (res.targetMetAge > 0) { metAgeSum += res.targetMetAge; metCnt++; }
    retireAgeSum += res.retireAge;
    if (res.maxSingleYearGain > maxSingleYear) maxSingleYear = res.maxSingleYearGain;
    floatCount += res.floatLeak.length;
    if (res.floatLeak[0]) floats.push(res.floatLeak[0]);
    repeatCount += res.repeatLogs.length;
  }
  summaryA[p.id] = {
    name: p.name, dist, success, failure, metRate: metRate / ROUNDS,
    avgMetAge: metCnt ? (metAgeSum / metCnt).toFixed(1) : '-',
    avgRetireAge: (retireAgeSum / ROUNDS).toFixed(1),
    maxSingleYear: maxSingleYear, floatCount, repeatCount,
  };
  console.log(`\n── ${p.name} ──`);
  console.log(`  成功:${success}(${(success/ROUNDS*100).toFixed(1)}%) 失败:${failure}(${(failure/ROUNDS*100).toFixed(1)}%) 达标率:${(metRate/ROUNDS*100).toFixed(1)}%`);
  console.log(`  平均达标年龄:${summaryA[p.id].avgMetAge} 平均退休年龄:${summaryA[p.id].avgRetireAge}`);
  console.log(`  单年最大增值:¥${(maxSingleYear/10000).toFixed(1)}万 浮点泄漏:${floatCount}条 叙事重复:${repeatCount}条`);
  const topEndings = Object.entries(dist).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>`${k}:${v}`).join(', ');
  console.log(`  结局分布: ${topEndings}`);
}

// 平衡度
console.log('\n' + '='.repeat(90));
console.log('  平衡度对比');
console.log('='.repeat(90));
const successRates = PATHS.map(p => summaryA[p.id].success / ROUNDS * 100);
const maxS = Math.max(...successRates), minS = Math.min(...successRates);
console.log(`  成功率范围: ${minS.toFixed(1)}% ~ ${maxS.toFixed(1)}% (极差${(maxS-minS).toFixed(1)}pp)`);
PATHS.forEach(p => console.log(`  ${p.name.padEnd(10)}: 成功${(summaryA[p.id].success/ROUNDS*100).toFixed(1)}% 达标${(summaryA[p.id].metRate*100).toFixed(1)}% 退休${summaryA[p.id].avgRetireAge}岁`));

// 数值爆炸
console.log('\n' + '='.repeat(90));
console.log('  数值健康');
console.log('='.repeat(90));
PATHS.forEach(p => {
  const s = summaryA[p.id];
  console.log(`  ${p.name.padEnd(10)}: 单年峰值¥${(s.maxSingleYear/10000).toFixed(1)}万 浮点${s.floatCount}条 重复${s.repeatCount}条`);
});