/**
 * 综合黑箱测试 · 数值平衡审计
 *
 * 目标一：「选=没选」检测 —— 每张卡片/选项的实际资金冲击 vs 当时财富，
 *        冲击 <1% 且财富高 → 选与不选无感知。
 * 目标二：「自然增长 vs 主动选择」占比 —— 年度财富净增长里，
 *        多少来自工资/被动/投资复利（自然），多少来自卡片/事件选择（主动）。
 *        自然占比过高 → 游戏推进全靠时间，选择无意义。
 *
 * 运行: npx tsx scripts/blackbox-balance-audit.ts
 * 输出: blackbox-balance-report.txt
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
const ROUNDS = 60; // 每路径轮数
const WEALTH_THRESHOLD = 1500000; // 财富超过此值才判定"富有"
const DELTA_PCT_THRESHOLD = 0.01; // 资金冲击占财富 <1% 视为选=没选

interface Hit {
  path: string; age: number; eventId: string; eventTitle: string;
  optionLabel: string; wealth: number; delta: number; pct: number;
  returnType: string[];
}
interface NatSample {
  path: string; age: number; totalGain: number;
  naturalGain: number; activeGain: number; naturalPct: number;
  salary: number; passive: number; invest: number; shopRent: number;
  cardCost: number; eventGain: number;
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
    if (Math.random() < 0.3) return o;
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
function tick(): Promise<void> {
  return new Promise(res => setTimeout(res, 0));
}

async function runPath(pathId: string, hits: Hit[], natSamples: NatSample[]) {
  setActivePinia(createPinia());
  const store = useGameStore();
  store.resetGame();
  store.startNewGame();
  store.setupGame('中坚大后方', '传统私企', 8000, 5000000, 'INTJ' as any, 'farm_hermit' as any);
  store.selectRetirementPath(pathId as any);
  await tick();

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
    const eventTitle = ev?.title || '日常';
    store.commitYear();

    const result = (store as any).lastYearResult;
    let delta = 0;
    if (result && result.wellbeingChanges && Array.isArray(result.wellbeingChanges)) {
      const entry = result.wellbeingChanges.find((w: any) => w.source === eventTitle);
      if (entry) delta = entry.savings;
    }
    if (delta === 0 && chosenOpt) {
      delta = store.state.currentSavings - wealthBefore;
    }

    // ===== 目标一：「选=没选」=====
    if (chosenOpt) {
      const ret = isInvestmentOption(chosenOpt);
      if (ret.length > 0 && wealthBefore >= WEALTH_THRESHOLD && delta !== 0) {
        const pct = Math.abs(delta) / wealthBefore;
        if (pct < DELTA_PCT_THRESHOLD) {
          hits.push({ path: pathId, age, eventId: ev!.id, eventTitle,
            optionLabel: chosenOpt.label, wealth: wealthBefore, delta, pct, returnType: ret });
        }
      }
    }

    // ===== 目标二：自然增长 vs 主动选择 =====
    // 自然 = 工资 + 被动收入 + 投资增益 + 商铺租金 + 养老金/退休金
    // 主动 = 卡片花费(负) + 事件副业 + 盲盒 + 日常事件 + 黑天鹅 + 回声
    if (result) {
      const salary = result.salaryIncome || 0;
      const passive = result.passiveIncome || 0;
      const invest = result.investmentGain || 0;
      const shopRent = result.shopRentIncome || 0;
      const pension = result.pensionIncome || 0;
      const retire = result.retireIncome || 0;
      const naturalGain = salary + passive + invest + shopRent + pension + retire;
      const cardCost = Math.abs(result.cardCost || 0); // 卡片花费（正数）
      const blindBox = Math.abs(result.blindBoxFinancialChange || 0);
      const daily = Math.abs(result.dailyEventFinancialChange || 0);
      const echo = Math.abs(result.echoFinancialChange || 0);
      const sideHustle = result.sideHustleIncome || 0;
      const blackSwan = Math.abs(result.blackSwanLoss || 0);
      const activePosGain = sideHustle + blindBox + daily + echo + (result.actualSavingsChange && result.actualSavingsChange > naturalGain
        ? Math.max(0, result.actualSavingsChange - naturalGain - cardCost - blackSwan) : 0);
      const totalGain = Math.abs(result.actualSavingsChange || 0);
      const activeGain = Math.max(0, totalGain - naturalGain);
      const naturalPct = totalGain > 0 ? naturalGain / totalGain : 0;
      const isUnemployed = s.isUnemployed;
      // 只记录有意义的增长年（排除失业年/亏损年）
      if (totalGain > 5000) {
        natSamples.push({
          path: pathId, age, totalGain, naturalGain, activeGain, naturalPct,
          salary, passive, invest, shopRent, cardCost,
          eventGain: activePosGain,
        });
      }
      // eslint-disable-next-line no-unused-vars
      void isUnemployed;
    }

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
  const natSamples: NatSample[] = [];
  for (const p of PATHS) {
    for (let r = 0; r < ROUNDS; r++) await runPath(p, hits, natSamples);
  }

  const out: string[] = [];
  const W = (s: string) => { out.push(s); console.log(s); };

  // ============ 目标一：选=没选 ============
  W('\n' + '='.repeat(100));
  W(`  【一】"选=没选"检测 · ${PATHS.length}路径×${ROUNDS}轮 · 财富≥¥${(WEALTH_THRESHOLD/10000).toFixed(0)}万`);
  W(`  投资型选项资金冲击<${(DELTA_PCT_THRESHOLD*100).toFixed(1)}%财富 → 无感知`);
  W('='.repeat(100));
  const byEvent: Record<string, { count: number; worstPct: number; worstDelta: number; worstWealth: number; options: Map<string, number>; paths: Set<string>; ages: Set<number>; title: string }> = {};
  for (const h of hits) {
    if (!byEvent[h.eventId]) byEvent[h.eventId] = { count: 0, worstPct: Infinity, worstDelta: 0, worstWealth: 0, options: new Map(), paths: new Set(), ages: new Set(), title: h.eventTitle };
    const d = byEvent[h.eventId];
    d.count++; d.worstPct = Math.min(d.worstPct, h.pct);
    d.paths.add(h.path); d.ages.add(h.age);
    d.options.set(h.optionLabel, (d.options.get(h.optionLabel) || 0) + 1);
    if (h.delta < d.worstDelta) { d.worstDelta = h.delta; d.worstWealth = h.wealth; }
  }
  const sorted = Object.entries(byEvent).sort((a, b) => a[1].worstPct - b[1].worstPct);
  W(`共 ${hits.length} 次命中，涉及 ${sorted.length} 个事件。\n`);
  for (const [evId, d] of sorted) {
    const optStr = [...d.options.entries()].map(([o, c]) => `${o}×${c}`).join(' | ');
    W(`[${evId}] "${d.title}" ${d.count}次 · 最差冲击占财富${(d.worstPct*100).toFixed(2)}%`);
    W(`    选项: ${optStr}`);
    W(`    最差: 财富¥${(d.worstWealth/10000).toFixed(0)}万 实际资金¥${d.worstDelta.toLocaleString()} 路径:${[...d.paths].join(',')}`);
  }

  // ============ 目标二：自然增长 vs 主动选择 ============
  W('\n' + '='.repeat(100));
  W(`  【二】自然增长 vs 主动选择 · 年度财富净增长构成`);
  W('='.repeat(100));
  const byPath: Record<string, { n: number; natSum: number; actSum: number; salSum: number; pasSum: number; invSum: number; shopSum: number; cardSum: number; totSum: number }> = {};
  for (const s of natSamples) {
    if (!byPath[s.path]) byPath[s.path] = { n: 0, natSum: 0, actSum: 0, salSum: 0, pasSum: 0, invSum: 0, shopSum: 0, cardSum: 0, totSum: 0 };
    const d = byPath[s.path];
    d.n++; d.natSum += s.naturalGain; d.actSum += s.activeGain;
    d.salSum += s.salary; d.pasSum += s.passive; d.invSum += s.invest;
    d.shopSum += s.shopRent; d.cardSum += s.cardCost; d.totSum += s.totalGain;
  }
  let allNat = 0, allAct = 0, allTot = 0;
  W(`\n路径          年均财富增长     自然增长(% )   主动增长(% )   其中:工资/被动/息/铺租   卡片花费`);
  for (const p of PATHS) {
    const d = byPath[p];
    if (!d || d.n === 0) continue;
    const avgTot = d.totSum / d.n;
    const avgNat = d.natSum / d.n;
    const avgAct = d.actSum / d.n;
    const avgSal = d.salSum / d.n, avgPas = d.pasSum / d.n, avgInv = d.invSum / d.n, avgShop = d.shopSum / d.n;
    const avgCard = d.cardSum / d.n;
    const natPct = avgTot > 0 ? avgNat / avgTot * 100 : 0;
    W(`${p.padEnd(12)}¥${(avgTot/10000).toFixed(1)}万  ¥${(avgNat/10000).toFixed(1)}万(${natPct.toFixed(0)}%)  ¥${(avgAct/10000).toFixed(1)}万(${(100-natPct).toFixed(0)}%)   ${(avgSal/10000).toFixed(1)}/${(avgPas/10000).toFixed(1)}/${(avgInv/10000).toFixed(1)}/${(avgShop/10000).toFixed(1)}万  ¥${(avgCard/10000).toFixed(1)}万`);
    allNat += d.natSum; allAct += d.actSum; allTot += d.totSum;
  }
  if (allTot > 0) {
    W(`\n合计: 自然增长占比 ${(allNat/allTot*100).toFixed(1)}% · 主动选择占比 ${(allAct/allTot*100).toFixed(1)}%`);
    W(`（主动选择含：副业收入/盲盒/日常事件/回声及事件带来的额外收益；卡片花费计入自然侧的对立面）`);
  }

  const fs = await import('node:fs');
  fs.writeFileSync('c:/Users/10693/.trae-cn/work/6a75f2d14689529c298a29b8/blackbox-balance-report.txt', '\ufeff' + out.join('\n'), 'utf8');
}

main().then(() => process.exit(0));