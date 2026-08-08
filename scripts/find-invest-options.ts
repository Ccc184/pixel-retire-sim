/**
 * 找出所有"花钱换钱"的投资型选项：负 savingsChange + 正被动收入/加薪回报。
 * 这些才需要改成百分比制。纯技能投资（负存款+skillGains）保留token消费。
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

const all = [...AI_NARRATIVE_EVENTS, ...getAllExtraEvents()];

interface Hit { eventId: string; eventTitle: string; optionLabel: string; cost: number; returnStr: string; file: string }
const hits: Hit[] = [];

for (const ev of all) {
  for (const opt of ev.options || []) {
    const hasCost = opt.savingsChange !== undefined && opt.savingsChange < 0;
    if (!hasCost) continue;
    const retParts: string[] = [];
    if (opt.passiveIncomeChange && opt.passiveIncomeChange > 0) retParts.push(`被动+${opt.passiveIncomeChange}/年`);
    if (opt.salaryChange && opt.salaryChange > 0) retParts.push(`加薪+${opt.salaryChange}/月`);
    if (opt.salaryChange && opt.salaryChange < 0) retParts.push(`降薪${opt.salaryChange}`);
    // 只算"花钱换钱"：有正的钱回报
    const hasMoneyReturn = retParts.length > 0;
    if (!hasMoneyReturn) continue;
    hits.push({
      eventId: ev.id, eventTitle: ev.title, optionLabel: opt.label,
      cost: opt.savingsChange, returnStr: retParts.join('，'),
      file: (ev as any).__file || '',
    });
  }
}

console.log('\n' + '='.repeat(100));
console.log(`一共 ${hits.length} 个"花钱换钱"投资型选项：`);
console.log('='.repeat(100));
hits.sort((a, b) => a.cost - b.cost).forEach(h => {
  console.log(`[${h.eventId}] "${h.eventTitle}" → "${h.optionLabel}" 花¥${Math.abs(h.cost).toLocaleString()} → ${h.returnStr}`);
});

const fs = await import('node:fs');
fs.writeFileSync('c:/Users/10693/.trae-cn/work/6a75f2d14689529c298a29b8/invest-options.txt',
  '\ufeff' + hits.map(h => `[${h.eventId}] "${h.eventTitle}" → "${h.optionLabel}" 花¥${Math.abs(h.cost).toLocaleString()} → ${h.returnStr}`).join('\n'), 'utf8');