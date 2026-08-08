/**
 * 卡片数值平衡审计（确定性 · 覆盖全部事件）
 *
 * 目标：找出"选=没选"的卡片——某项金钱投资/花费的资金冲击相对于玩家财富
 * 小到无感（如三百万存款时只投5000）。
 *
 * 聚焦"金钱投资型"选项：负 savingsChange（花钱），同时有正回报
 * passiveIncomeChange 或 salaryChange（拿到的是钱，不是技能）。
 * 纯技能投资（负存款+skillGains）不在此列——技能回报不体现在钱上，成本小合理。
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

import '../src/data/narrative-data-chain.js';
import '../src/data/narrative-data-nomad.js';
import '../src/data/narrative-data-ip.js';
import '../src/data/narrative-data-bio.js';
import '../src/data/narrative-data-silver.js';
import '../src/data/narrative-data-mbti.js';
import '../src/data/narrative-data-philosophy.js';
import '../src/data/narrative-recurring.js';
import '../src/data/narrative-allin.js';
import '../src/data/narrative-company.js';
import '../src/data/narrative-breakthrough.js';
import '../src/data/narrative-unemployed.js';
import { getAllExtraEvents } from '../src/data/narrative-registry.js';
import { AI_NARRATIVE_EVENTS } from '../src/data/narrative-events.js';
import { scalePerceptibleIncome, scalePerceptibleCost } from '../src/utils/math-engine.js';

const SAVINGS_FLOOR = 200000;
const SAVINGS_PCT = 0.02;
const SAVINGS_MAXMULT = 12;
const PASSIVE_FLOOR = 30000;
const PASSIVE_PCT = 0.02;
const PASSIVE_MAXMULT = 8;

// 判定档位：只关心财富足够高时投资是否无感
const WEALTH_TIERS = [
  { label: '100万', savings: 1000000, baseCost: 90000 },
  { label: '300万', savings: 3000000, baseCost: 120000 },
  { label: '1000万', savings: 10000000, baseCost: 150000 },
];

// 投资成本占财富比低于该值 → 选=没选
const COST_PCT_LOOSE = 0.01;   // 1%（宽松，用于初筛）
const COST_PCT_STRICT = 0.02;  // 2%（严格，标注明显问题）

interface Row {
  eventId: string; eventTitle: string; optionLabel: string;
  rawCost: number; rawReturn: string;
  tier: string; costPct: number;
}

function isMoneyInvestment(opt: any): boolean {
  const hasCost = opt.savingsChange !== undefined && opt.savingsChange < 0;
  if (!hasCost) return false;
  const moneyReturn = (opt.passiveIncomeChange && opt.passiveIncomeChange > 0)
    || (opt.salaryChange && opt.salaryChange > 0);
  return moneyReturn; // 只要"花钱换钱"的投资型
}

function main() {
  const all = [...AI_NARRATIVE_EVENTS, ...getAllExtraEvents()];
  const rows: Row[] = [];

  for (const ev of all) {
    for (const opt of ev.options || []) {
      if (!isMoneyInvestment(opt)) continue;
      const rawCost = opt.savingsChange;
      const retParts: string[] = [];
      if (opt.passiveIncomeChange && opt.passiveIncomeChange > 0) retParts.push(`被动+${opt.passiveIncomeChange}/年`);
      if (opt.salaryChange && opt.salaryChange > 0) retParts.push(`加薪+${opt.salaryChange}/月`);
      const rawReturn = retParts.join('，');

      for (const t of WEALTH_TIERS) {
        const base = Math.max(SAVINGS_FLOOR, t.savings);
        // 新逻辑：投资型成本会被 scalePerceptibleCost 放大（与游戏 store 一致）
        const appliedCost = scalePerceptibleCost(rawCost, base, 0.02, 12);
        const costPct = Math.abs(appliedCost) / base;
        if (costPct < COST_PCT_LOOSE) {
          rows.push({ eventId: ev.id, eventTitle: ev.title, optionLabel: opt.label, rawCost, rawReturn, tier: t.label, costPct });
        }
      }
    }
  }

  console.log('\n' + '='.repeat(100));
  console.log(`  卡片数值平衡审计 · 共${all.length}事件`);
  console.log(`  "花钱换钱"投资型选项共 ${rows.length} 处成本冲击<${COST_PCT_LOOSE*100}%`);
  console.log('='.repeat(100));

  // 按事件去重汇总最差档位
  const byEvent: Record<string, { rows: Row[]; worstCost: number; label: string }> = {};
  for (const r of rows) {
    if (!byEvent[r.eventId]) byEvent[r.eventId] = { rows: [], worstCost: Infinity, label: r.eventTitle };
    byEvent[r.eventId].rows.push(r);
    byEvent[r.eventId].worstCost = Math.min(byEvent[r.eventId].worstCost, r.costPct);
  }

  const sorted = Object.entries(byEvent).sort((a, b) => a[1].worstCost - b[1].worstCost);
  console.log(`\n【严格问题 · 财富300万时投资成本<${COST_PCT_STRICT*100}%】`);
  const strict = sorted.filter(([, d]) => d.rows.some(r => r.tier === '300万' && r.costPct < COST_PCT_STRICT));
  for (const [evId, d] of strict) {
    console.log(`\n  [${evId}] ${d.label}`);
    for (const r of d.rows) {
      if (!(r.tier === '300万' && r.costPct < COST_PCT_STRICT)) continue;
      console.log(`     ${r.optionLabel}：花¥${Math.abs(r.rawCost).toLocaleString()} → ${r.rawReturn}  @300万时占${(r.costPct*100).toFixed(2)}%`);
    }
  }

  console.log(`\n【全部命中（含宽松）】共${rows.length}处`);
  for (const [evId, d] of sorted) {
    const worst = d.rows.reduce((a, b) => a.costPct < b.costPct ? a : b);
    console.log(`  [${evId}] ${d.label} → "${worst.optionLabel}" 花¥${Math.abs(worst.rawCost).toLocaleString()} @ ${worst.tier} 占${(worst.costPct*100).toFixed(2)}%`);
  }
}

main();