/**
 * 验证：投资型成本缩放后的经济合理性
 * 在多个财富档位下，模拟投资型选项（recurring_finance 等）的成本与回报，
 * 计算年化回报率，确认没有引入失衡（成本放大后回报不匹配）。
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

import { scalePerceptibleIncome, scalePerceptibleCost } from '../src/utils/math-engine.js';

const TIERS = [
  { label: '初期 5万', savings: 50000, baseCost: 30000 },
  { label: '成长 50万', savings: 500000, baseCost: 60000 },
  { label: '中产 100万', savings: 1000000, baseCost: 90000 },
  { label: '富裕 300万', savings: 3000000, baseCost: 120000 },
  { label: '自由 1000万', savings: 10000000, baseCost: 150000 },
];

// 模拟 recurring_finance 各投资选项
const INVESTMENTS = [
  { name: '定投指数基金', cost: -5000, passive: 200 },
  { name: '存定期', cost: -10000, passive: 150 },
  { name: '开课(ip_edu_first_course)', cost: -2000, passive: 8000 },
  { name: '转型视频(evangelist_tutorial)', cost: -5000, passive: 2000 },
  { name: '建内容生态(ip_ent_format_pivot)', cost: -20000, passive: 20000 },
  { name: '做量化基金(trader_final_test)', cost: -30000, passive: 0, salary: 0 },
];

function main() {
  console.log('\n' + '='.repeat(110));
  console.log('投资型成本缩放验证 · 成本参照存款(2%下限,12倍上限) · 回报参照年支出(2%下限,8倍上限)');
  console.log('='.repeat(110));

  for (const inv of INVESTMENTS) {
    console.log(`\n■ ${inv.name}（原始成本¥${Math.abs(inv.cost).toLocaleString()} 被动+${inv.passive}/年）`);
    console.log('  档位        放大后成本      放大后被动/年    年化回报率');
    for (const t of TIERS) {
      const cost = scalePerceptibleCost(inv.cost, Math.max(200000, t.savings), 0.02, 12);
      const passive = inv.passive > 0
        ? scalePerceptibleIncome(inv.passive, Math.max(30000, t.baseCost), 0.02, 8)
        : 0;
      const annualPct = passive / Math.abs(cost) * 100;
      console.log(`  ${t.label.padEnd(12)} ¥${Math.abs(cost).toLocaleString().padStart(9)}     ¥${passive.toLocaleString().padStart(7)}/年     ${annualPct.toFixed(1)}%`);
    }
  }

  console.log('\n' + '='.repeat(110));
  console.log('合理性检查：年化回报率应在 2%~15% 区间（太低=纯亏无意义，太高=白捡钱）');
  console.log('='.repeat(110));
}

main();