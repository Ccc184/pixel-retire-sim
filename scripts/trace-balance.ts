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
import { getPathSideIncome, canAllIn } from '../src/data/retirement-paths.js';

const TARGET = 5000000;
const pathId = process.argv[2] || 'super_ip';

function chooseNarrativeOption(event: any, state: any): any {
  const opts = event.options || [];
  if (opts.length === 0) return null;
  let best = opts[0]; let bestScore = -999;
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
  let best = opts[0]; let bestScore = -999;
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

setActivePinia(createPinia());
const store = useGameStore();
store.resetGame();
store.startNewGame();
store.setupGame('中坚大后方', '传统私企', 8000, TARGET, 'INTJ' as any, 'farm_hermit' as any);
store.selectRetirementPath(pathId as any);

for (let age = 22; age <= 60; age++) {
  const s = store.state;
  const cr = store.currentCrossroad;
  if (cr && cr.options?.length) { const o = chooseCrossroadOption(cr, s); if (o) store.selectCrossroadOption(o.id); }
  const ev = store.currentNarrativeEvent;
  if (ev && ev.options?.length) { const o = chooseNarrativeOption(ev, s); if (o) store.selectNarrativeOption(o.id); }
  const before = calculateTotalWealth(store.state);
  store.commitYear();
  const after = calculateTotalWealth(store.state);
  const gain = after - before;
  if (gain > 1500000 || age <= 28 || age % 5 === 0 || (age >= 40 && age % 2 === 0)) {
    const side = getPathSideIncome(s);
    console.log(`age=${age} wealth=${Math.round(after/10000)}万 gain=+${Math.round(gain/10000)}万 savings=${Math.round(s.currentSavings/10000)}万 allIn=${s.isAllInPath} salary=${s.currentMonthlySalary} side=${Math.round(side)} faith=${s.pathFaith} canAllIn=${canAllIn(s)} annualCost=${s.annualBaseCost}`);
  }
  if (s.endingTriggered) { console.log(`END at ${age}: ${s.currentEndingId}`); break; }
  if (s.currentSavings < -300000) { console.log(`BANKRUPT at ${age}`); break; }
  if (s.health < 20) { console.log(`HEALTH DEATH at ${age}`); break; }
}
console.log('final wealth=', Math.round(calculateTotalWealth(store.state)/10000), '万, ending=', store.state.currentEndingId);