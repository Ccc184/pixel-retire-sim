/**
 * 当前版本数值健康度黑箱审计 v3（异步事件驱动版）
 * 修正：同步循环漏掉异步载入的叙事事件 → 加入 await tick() 等待事件赋值
 * 目的：真实还原压力/健康/财富在完整事件流下的表现
 */
const _store: Record<string, string> = {};
(globalThis as any).localStorage = { getItem: (k: string) => _store[k] ?? null, setItem: (k: string, v: string) => { _store[k] = v }, removeItem: (k: string) => { delete _store[k] }, clear: () => { Object.keys(_store).forEach(k => delete _store[k]) }, };
(globalThis as any).window = globalThis;
(globalThis as any).requestIdleCallback = (cb: () => void) => setTimeout(cb, 0);
(globalThis as any).cancelIdleCallback = (id: any) => clearTimeout(id);
const _origLog = console.log;
console.log = (...args: any[]) => { const s = args.join(' '); if (String(s).includes('[DEBUG')) return; _origLog(...args); };

import { createPinia, setActivePinia } from 'pinia';
import { useGameStore } from '../src/store/game.store.js';
import { computeGradeBreakdown } from '../src/utils/rating.js';
import { calculateTotalWealth } from '../src/utils/math-engine.js';

const PATHS = ['ai_symbiote', 'chain_native', 'digital_nomad', 'super_ip', 'silver_economy', 'bio_gambler'];
const ARCHETYPES = {
  aggressive: { restThreshold: 100, skillWeight: 3, investWeight: 2, explore: 0.05 },
  balanced:   { restThreshold: 75, skillWeight: 2, investWeight: 1.5, explore: 0.15 },
  lazy:       { restThreshold: 55, skillWeight: 0.8, investWeight: 0.6, explore: 0.3 },
  random:     { restThreshold: 50, skillWeight: 1, investWeight: 1, explore: 1.0 },
};
const START_AGES = [22, 28, 35];
const PROFESSIONS = [
  { label: '红利行业', city: '资本修罗场', salary: 15000, target: 8000000 },
  { label: '传统私企', city: '中坚大后方', salary: 8000, target: 5000000 },
];
const ROUNDS_PER_CELL = 10;

interface RunResult {
  arch: string; path: string; startAge: number; prof: string;
  grade: string; score: number; endAge: number; endId: string;
  wealth: number; ratio: number; health: number; stress: number; happiness: number;
  financial: number; life: number; survival: number; early: number; pathBonus: number;
  pathSuccess: boolean; maxStress: number; highStressYears: number; minHealth: number;
  eventYears: number;
}

function tick(): Promise<void> { return new Promise(res => setTimeout(res, 0)); }

function chooseNarrativeOption(ev: any, s: any, cfg: any): any {
  const opts = ev.options || [];
  if (opts.length === 0) return null;
  if (Math.random() < cfg.explore) return opts[Math.floor(Math.random() * opts.length)];
  let best = opts[0], bestScore = -999;
  for (const o of opts) {
    let sc = 0;
    if (o.hintColor === 'positive') sc += 6;
    if (o.hintColor === 'danger' && s.stress > cfg.restThreshold) sc -= 20;
    if (o.skillGains) sc += Object.values(o.skillGains).reduce((a: number, b: any) => a + (b || 0), 0) * cfg.skillWeight;
    if (o.passiveIncomeChange && o.passiveIncomeChange > 0) sc += cfg.investWeight;
    if (o.salaryChange && o.salaryChange > 0) sc += cfg.investWeight;
    if (o.isRestOption && s.stress > cfg.restThreshold) sc += 25;
    if (o.savingsChange && o.savingsChange < 0 && s.currentSavings < 80000) sc -= 25;
    if (sc > bestScore) { bestScore = sc; best = o; }
  }
  return best;
}
function chooseCrossroadOption(cr: any, s: any, cfg: any): any {
  const opts = cr.options || [];
  if (opts.length === 0) return null;
  if (Math.random() < cfg.explore) return opts[Math.floor(Math.random() * opts.length)];
  let best = opts[0], bestScore = -999;
  for (const o of opts) {
    let sc = 0;
    if (o.hintColor === 'positive') sc += 8;
    if (o.hintColor === 'danger' && s.stress > cfg.restThreshold) sc -= 15;
    if (o.passiveIncomeChange && o.passiveIncomeChange > 0) sc += cfg.investWeight;
    if (o.salaryChange && o.salaryChange > 0) sc += cfg.investWeight;
    if (o.savingsChange && o.savingsChange < 0 && s.currentSavings < 80000) sc -= 25;
    if (sc > bestScore) { bestScore = sc; best = o; }
  }
  return best;
}

async function runGame(arch: string, path: string, startAge: number, prof: { label: string; city: string; salary: number; target: number }): Promise<RunResult> {
  setActivePinia(createPinia());
  const store = useGameStore();
  const cfg = ARCHETYPES[arch as keyof typeof ARCHETYPES];
  store.resetGame();
  store.startNewGame();
  store.setupGame(prof.city as any, prof.label as any, prof.salary, prof.target, 'INTJ' as any, 'farm_hermit' as any, startAge);
  store.selectRetirementPath(path as any);

  let maxStress = 0, highStressYears = 0, minHealth = 100, eventYears = 0;
  for (let age = startAge; age <= 60; age++) {
    const s = store.state;
    const cr = store.currentCrossroad;
    if (cr && cr.options?.length) { const opt = chooseCrossroadOption(cr, s, cfg); if (opt) store.selectCrossroadOption(opt.id); }
    const ev = store.currentNarrativeEvent;
    if (ev && ev.options?.length) { eventYears++; const opt = chooseNarrativeOption(ev, s, cfg); if (opt) store.selectNarrativeOption(opt.id); }
    store.commitYear();
    await tick();
    const post = store.state;
    maxStress = Math.max(maxStress, post.stress);
    if (post.stress > 70) highStressYears++;
    minHealth = Math.min(minHealth, post.health);
    if (post.endingTriggered) break;
    if (post.currentSavings < -300000 || post.health < 20) break;
    // 关键：真实游玩中玩家关闭年结面板后才会抽取下一年事件
    store.dismissYearEnd();
    await tick();
  }

  const s = store.state;
  const g = computeGradeBreakdown(s);
  const wealth = calculateTotalWealth(s);
  return {
    arch, path, startAge, prof: prof.label,
    grade: g.grade, score: g.total, endAge: s.currentAge, endId: s.currentEndingId || 'none',
    wealth, ratio: wealth / prof.target,
    health: s.health, stress: s.stress, happiness: s.happiness,
    financial: g.parts.financial, life: g.parts.life, survival: g.parts.survival,
    early: g.parts.earlyBonus, pathBonus: g.parts.pathBonus,
    pathSuccess: (s.currentEndingId || '').startsWith('path_success_'),
    maxStress, highStressYears, minHealth, eventYears,
  };
}

function aggTable(results: RunResult[], keyFn: (r: RunResult) => string, keyLabel: string) {
  const map: Record<string, { n: number; s: number; a: number; b: number; c: number; d: number; score: number; ratio: number; health: number; stress: number; succ: number; maxStress: number; minHealth: number; evY: number }> = {};
  for (const r of results) {
    const k = keyFn(r);
    if (!map[k]) map[k] = { n: 0, s: 0, a: 0, b: 0, c: 0, d: 0, score: 0, ratio: 0, health: 0, stress: 0, succ: 0, maxStress: 0, minHealth: 100, evY: 0 };
    const d = map[k];
    d.n++; d.score += r.score; d.ratio += r.ratio; d.health += r.health; d.stress += r.stress;
    d.maxStress += r.maxStress; d.minHealth = Math.min(d.minHealth, r.minHealth); d.evY += r.eventYears;
    if (r.grade === 'S') d.s++; else if (r.grade === 'A') d.a++; else if (r.grade === 'B') d.b++;
    else if (r.grade === 'C') d.c++; else d.d++;
    if (r.pathSuccess) d.succ++;
  }
  const header = `${keyLabel.padEnd(14)}  S   A   B   C   D  均分  达成%  健康  压力  峰压  低健  事件年/局  路径成功`;
  const rows = Object.entries(map).map(([k, d]) =>
    `${k.padEnd(14)} ${d.s}   ${d.a}   ${d.b}   ${d.c}   ${d.d}  ${(d.score/d.n).toFixed(1)}  ${(d.ratio/d.n*100).toFixed(0)}%  ${(d.health/d.n).toFixed(0)}  ${(d.stress/d.n).toFixed(0)}  ${(d.maxStress/d.n).toFixed(0)}  ${d.minHealth}  ${(d.evY/d.n).toFixed(1)}  ${(d.succ/d.n*100).toFixed(0)}%`);
  return { header, rows };
}

async function main() {
  const results: RunResult[] = [];
  let done = 0;
  const totalCells = Object.keys(ARCHETYPES).length * START_AGES.length * PATHS.length * PROFESSIONS.length;
  for (const arch of Object.keys(ARCHETYPES)) {
    for (const prof of PROFESSIONS) {
      for (const age of START_AGES) {
        for (const path of PATHS) {
          for (let r = 0; r < ROUNDS_PER_CELL; r++) results.push(await runGame(arch, path, age, prof));
          done++; process.stdout.write(`\r进度 ${done}/${totalCells}`);
        }
      }
    }
  }
  process.stdout.write('\n\n');

  const out: string[] = [];
  const W = (s: string) => { out.push(s); console.log(s); };
  const total = results.length;
  const gc: Record<string, number> = {};
  for (const r of results) gc[r.grade] = (gc[r.grade] || 0) + 1;

  W('='.repeat(110));
  W(`  当前版本数值健康度 v3（异步事件版）· 黑箱审计（${total} 局）`);
  W('='.repeat(110));

  W(`\n【一】结局评级分布（全体）`);
  for (const g of ['S', 'A', 'B', 'C', 'D']) {
    const c = gc[g] || 0; const pct = (c / total * 100).toFixed(1);
    W(`  ${g}级: ${c} 局 (${pct}%)  ${'█'.repeat(Math.round(c / total * 60))}`);
  }
  const sa = (gc['S'] || 0) + (gc['A'] || 0); const cd = (gc['C'] || 0) + (gc['D'] || 0);
  W(`  → S+A ${(sa/total*100).toFixed(1)}%   |   C+D ${(cd/total*100).toFixed(1)}%   |   中位分 ${[...results].map(r=>r.score).sort((x,y)=>x-y)[Math.floor(total/2)].toFixed(1)}`);

  W(`\n【二】按画像`);
  const t2 = aggTable(results, r => r.arch, '画像'); W(t2.header); t2.rows.forEach(W);
  W(`\n【三】按起始年龄`);
  const t3 = aggTable(results, r => String(r.startAge) + '岁', '起始年龄'); W(t3.header); t3.rows.forEach(W);
  W(`\n【四】按职业`);
  const t4 = aggTable(results, r => r.prof, '职业'); W(t4.header); t4.rows.forEach(W);
  W(`\n【五】按路径`);
  const t5 = aggTable(results, r => r.path, '路径'); W(t5.header); t5.rows.forEach(W);

  W(`\n【六】评分构成均值（全体）`);
  const f = results.reduce((a, r) => a + r.financial, 0) / total;
  const l = results.reduce((a, r) => a + r.life, 0) / total;
  const su = results.reduce((a, r) => a + r.survival, 0) / total;
  const e = results.reduce((a, r) => a + r.early, 0) / total;
  const pb = results.reduce((a, r) => a + r.pathBonus, 0) / total;
  W(`  财务(0-60): ${f.toFixed(1)} 生活(0-30): ${l.toFixed(1)} 生存(0-10): ${su.toFixed(1)} 提前退休(0-10): ${e.toFixed(1)} 路径(0-10): ${pb.toFixed(1)}`);

  W(`\n【七】压力机制健康度`);
  W(`  平均峰值压力: ${(results.reduce((a,r)=>a+r.maxStress,0)/total).toFixed(1)}`);
  W(`  曾经历高压(>70)的局: ${results.filter(r=>r.highStressYears>0).length} (${(results.filter(r=>r.highStressYears>0).length/total*100).toFixed(1)}%)`);
  W(`  平均最低健康: ${(results.reduce((a,r)=>a+r.minHealth,0)/total).toFixed(1)}`);
  W(`  健康曾<40的局: ${results.filter(r=>r.minHealth<40).length} (${(results.filter(r=>r.minHealth<40).length/total*100).toFixed(1)}%)`);
  W(`  累计事件年/局: ${(results.reduce((a,r)=>a+r.eventYears,0)/total).toFixed(1)}（满局约${(60-22)}年）`);

  W(`\n【八】财富达成代价`);
  W(`  达标且健康<40: ${results.filter(r=>r.ratio>=1 && r.minHealth<40).length}  达标且健康>=60: ${results.filter(r=>r.ratio>=1 && r.minHealth>=60).length}`);

  const fs = await import('node:fs');
  fs.writeFileSync('c:/Users/10693/.trae-cn/work/6a76db5ff0d11f3fe77ad004/audit-current-v3.json', JSON.stringify(results, null, 2), 'utf8');
  W(`\n数据已写入 audit-current-v3.json`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });