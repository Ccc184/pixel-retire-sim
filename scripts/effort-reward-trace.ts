/**
 * 努力→回报 专项分析
 * 复用 blackbox-player-optimal.ts 已验证的决策逻辑（能触发All In/技能积累）
 * 追踪各路径逐年：技能总量 / 副业月收入 / 月薪 / 存款 / 总财富
 * 回答：努力上进是否有真实回报？是否像真实人生？是否正能量？
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
import { getPathSideIncome } from '../src/data/retirement-paths.js';

const PATHS = [
  { id: 'ai_symbiote', name: 'AI共生者' },
  { id: 'chain_native', name: '链上原住民' },
  { id: 'digital_nomad', name: '数字游牧民' },
  { id: 'super_ip', name: '超级IP' },
  { id: 'silver_economy', name: '银发守夜人' },
  { id: 'bio_gambler', name: '生物赌徒' },
];
const ROUNDS = 120;
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

function totalSkill(state: any): number {
  const sk = state.pathSkills || {};
  return Object.values(sk).reduce((a: number, b: any) => a + (b || 0), 0);
}

function runPath(pathId: string): any {
  setActivePinia(createPinia());
  const store = useGameStore();
  store.resetGame();
  store.startNewGame();
  store.setupGame('中坚大后方', '传统私企', 8000, TARGET_WEALTH, 'INTJ' as any, 'farm_hermit' as any);
  store.selectRetirementPath(pathId as any);

  const trace: any[] = [];
  let allInAge = -1, allInSkill = 0, allInWealth = 0, sideIncomeAtAllIn = 0;
  let peakSideIncome = 0, peakWealth = 0, peakSkill = 0, peakSalary = 0;
  let finalWealth = 0, finalSkill = 0;
  // 诊断计数器
  let firedEvents = 0, skillEvents = 0, skillOptionsPicked = 0, crossroadCount = 0;
  let maxFaith = 0, maxSideVsSalary = 0, allInBlockReason = '';
  const faithTrace: number[] = [];

  for (let age = 22; age <= 60; age++) {
    const s: any = store.state;
    const cr = store.currentCrossroad;
    if (cr && cr.options?.length) { crossroadCount++; const o = chooseOption(cr.options, s); if (o) store.selectCrossroadOption(o.id); }
    const ev = store.currentNarrativeEvent;
    if (ev && ev.options?.length) {
      firedEvents++;
      const hasSkillOpt = ev.options.some((o: any) => o.skillGains && Object.keys(o.skillGains).length);
      if (hasSkillOpt) skillEvents++;
      const o = chooseOption(ev.options, s);
      if (o) { store.selectNarrativeOption(o.id); if (o.skillGains && Object.keys(o.skillGains).length) skillOptionsPicked++; }
    }

    // 诊断 All In 阻断原因
    if (allInAge === -1 && age >= 27 && !s.isAllInPath && !s.isUnemployed) {
      const side = getPathSideIncome(s);
      const salary = s.currentMonthlySalary || 0;
      const ratio = salary > 0 ? side / salary : 0;
      if (ratio > maxSideVsSalary) maxSideVsSalary = ratio;
      if (s.pathFaith > maxFaith) maxFaith = s.pathFaith;
      if (s.pathFaith >= 90) { allInBlockReason = 'faith达标'; }
      else if (side > 0 && ratio >= 1.2) { allInBlockReason = '副业收入达标'; }
      else if (age >= 57 && !allInBlockReason) { allInBlockReason = `faith峰值${maxFaith} 副业/月薪峰值${(maxSideVsSalary).toFixed(2)}`; }
    }

    if (allInAge === -1 && s.isAllInPath) {
      allInAge = age; allInSkill = totalSkill(s); allInWealth = calculateTotalWealth(s);
      sideIncomeAtAllIn = getPathSideIncome(s);
    }

    const skill = totalSkill(s);
    const side = getPathSideIncome(s);
    const wealth = calculateTotalWealth(s);
    peakSkill = Math.max(peakSkill, skill);
    peakSideIncome = Math.max(peakSideIncome, side);
    peakWealth = Math.max(peakWealth, wealth);
    peakSalary = Math.max(peakSalary, s.currentMonthlySalary || 0);

    trace.push({
      age, skill, sideIncome: side, salary: s.currentMonthlySalary || 0,
      savings: s.currentSavings || 0, wealth, passive: s.passiveIncome || 0,
      allIn: s.isAllInPath, faith: s.pathFaith || 0,
    });
    faithTrace.push(s.pathFaith || 0);

    store.commitYear();
    // 真实玩家流程：年结后关闭面板 → 才会抽取下一年叙事事件
    (store as any).dismissYearEnd && (store as any).dismissYearEnd();
    const s2: any = store.state;
    finalWealth = calculateTotalWealth(s2);
    finalSkill = totalSkill(s2);
    if (s2.endingTriggered) break;
  }

  const firstSkill = trace[0]?.skill || 0;
  const lastSkill = trace[trace.length - 1]?.skill || 0;
  const firstSide = trace[0]?.sideIncome || 0;
  const lastSide = trace[trace.length - 1]?.sideIncome || 0;
  const skillDelta = Math.max(1, lastSkill - firstSkill);
  const sideDelta = lastSide - firstSide;
  const effortPayoff = sideDelta / skillDelta;

  return { trace, allInAge, allInSkill, allInWealth, sideIncomeAtAllIn,
    peakSkill, peakSideIncome, peakWealth, peakSalary, finalWealth, finalSkill, effortPayoff,
    firedEvents, skillEvents, skillOptionsPicked, crossroadCount, maxFaith, maxSideVsSalary, allInBlockReason };
}

console.log('='.repeat(90));
console.log('  努力→回报 专项分析（复用已验证最优策略）');
console.log('='.repeat(90));

const all: Record<string, any> = {};
for (const p of PATHS) {
  const runs: any[] = [];
  for (let r = 0; r < ROUNDS; r++) runs.push(runPath(p.id));

  const allInRates = runs.map(r => r.allInAge).filter(a => a > 0);
  const effortPayoffs = runs.map(r => r.effortPayoff);
  const finalWealths = runs.map(r => r.finalWealth).sort((a, b) => a - b);
  const successRuns = runs.filter(r => r.finalWealth >= TARGET_WEALTH);
  const allInRuns = runs.filter(r => r.allInAge > 0);
  const noAllInRuns = runs.filter(r => r.allInAge === -1);

  const avgTrace: any[] = [];
  for (let age = 22; age <= 60; age++) {
    const vals = runs.map(r => r.trace.find((t: any) => t.age === age)).filter(Boolean);
    if (!vals.length) continue;
    avgTrace.push({
      age,
      wealth: Math.round(vals.reduce((a: any, t: any) => a + t.wealth, 0) / vals.length),
      sideIncome: Math.round(vals.reduce((a: any, t: any) => a + t.sideIncome, 0) / vals.length),
      skill: Math.round(vals.reduce((a: any, t: any) => a + t.skill, 0) / vals.length),
      salary: Math.round(vals.reduce((a: any, t: any) => a + t.salary, 0) / vals.length),
    });
  }

  const avgAllInWealth = allInRuns.length ? Math.round(allInRuns.reduce((a, r) => a + r.allInWealth, 0) / allInRuns.length) : 0;
  const avgAllInSkill = allInRuns.length ? Math.round(allInRuns.reduce((a, r) => a + r.allInSkill, 0) / allInRuns.length) : 0;
  const avgFinalAllInWealth = allInRuns.length ? Math.round(allInRuns.reduce((a, r) => a + r.finalWealth, 0) / allInRuns.length) : 0;
  const avgFinalNoAllInWealth = noAllInRuns.length ? Math.round(noAllInRuns.reduce((a, r) => a + r.finalWealth, 0) / noAllInRuns.length) : 0;

  all[p.id] = {
    name: p.name,
    allInRate: (allInRates.length / ROUNDS * 100).toFixed(1),
    avgAllInAge: allInRates.length ? (allInRates.reduce((a, b) => a + b, 0) / allInRates.length).toFixed(1) : '-',
    allInSideIncome: Math.round(runs.reduce((a, r) => a + r.sideIncomeAtAllIn, 0) / ROUNDS),
    avgEffortPayoff: (effortPayoffs.reduce((a, b) => a + b, 0) / ROUNDS).toFixed(1),
    medianFinalWealth: Math.round(finalWealths[Math.floor(finalWealths.length / 2)]),
    successRate: (successRuns.length / ROUNDS * 100).toFixed(1),
    avgAllInWealth, avgAllInSkill, avgFinalAllInWealth, avgFinalNoAllInWealth,
    avgTrace, peakSideIncome: Math.round(runs.reduce((a, r) => a + r.peakSideIncome, 0) / ROUNDS),
    peakSkill: Math.round(runs.reduce((a, r) => a + r.peakSkill, 0) / ROUNDS),
    peakSalary: Math.round(runs.reduce((a, r) => a + r.peakSalary, 0) / ROUNDS),
    diag: {
      firedEvents: Math.round(runs.reduce((a, r) => a + r.firedEvents, 0) / ROUNDS),
      skillEventsFired: Math.round(runs.reduce((a, r) => a + r.skillEvents, 0) / ROUNDS),
      skillOptsPicked: Math.round(runs.reduce((a, r) => a + r.skillOptionsPicked, 0) / ROUNDS),
      crossroads: Math.round(runs.reduce((a, r) => a + r.crossroadCount, 0) / ROUNDS),
      maxFaith: Math.round(runs.reduce((a, r) => a + r.maxFaith, 0) / ROUNDS),
      maxSideVsSalary: (runs.reduce((a, r) => a + r.maxSideVsSalary, 0) / ROUNDS).toFixed(2),
      blockReason: runs[0]?.allInBlockReason || '',
    },
  };

  console.log(`\n── ${p.name} ──`);
  console.log(`  All In率:${all[p.id].allInRate}% 平均触发:${all[p.id].avgAllInAge}岁 (副业月入¥${(all[p.id].allInSideIncome/10000).toFixed(2)}万)`);
  console.log(`  技能每+1 → 副业+¥${Number(all[p.id].avgEffortPayoff).toFixed(1)}`);
  console.log(`  All In组: 触发技能${all[p.id].avgAllInSkill} 财富¥${(all[p.id].avgAllInWealth/10000).toFixed(0)}万 → 终局¥${(all[p.id].avgFinalAllInWealth/10000).toFixed(0)}万`);
  console.log(`  未All In组: 终局¥${(all[p.id].avgFinalNoAllInWealth/10000).toFixed(0)}万`);
  console.log(`  终局中位¥${(all[p.id].medianFinalWealth/10000).toFixed(0)}万 成功率${all[p.id].successRate}%`);
  console.log(`  峰值: 技能${all[p.id].peakSkill} 副业月入¥${(all[p.id].peakSideIncome/10000).toFixed(2)}万 月薪¥${(all[p.id].peakSalary/10000).toFixed(2)}万`);
  const d = all[p.id].diag;
  console.log(`  诊断: 触发事件${d.firedEvents}条(含技能${d.skillEventsFired}条,选中技能选项${d.skillOptsPicked}次) 岔路${d.crossroads}次`);
  console.log(`        信念峰值${d.maxFaith} 副业/月薪峰值${d.maxSideVsSalary} 阻断原因:${d.blockReason}`);
}

console.log('\n' + '='.repeat(90));
console.log('  逐年平均财富曲线 (22/28/34/40/46/52/58岁)');
console.log('='.repeat(90));
for (const p of PATHS) {
  const mk = (age: number) => {
    const t = all[p.id].avgTrace.find((x: any) => x.age === age);
    return t ? `¥${(t.wealth / 10000).toFixed(0)}万(sk${t.skill},侧¥${(t.sideIncome / 10000).toFixed(2)}万)` : '-';
  };
  console.log(`  ${(p.name + '').padEnd(10)}: 22${mk(22)} | 28${mk(28)} | 34${mk(34)} | 40${mk(40)} | 46${mk(46)} | 52${mk(52)} | 58${mk(58)}`);
}

console.log('\n' + '='.repeat(90));
console.log('  JSON');
console.log('='.repeat(90));
console.log(JSON.stringify({ config: { rounds: ROUNDS, targetWealth: TARGET_WEALTH }, paths: all }, null, 2));