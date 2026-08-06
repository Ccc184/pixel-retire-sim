/**
 * 追踪脚本：确认浮点泄漏、叙事重复、数值爆炸的具体来源
 */
const _store: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k) => _store[k] ?? null, setItem: (k, v) => { _store[k] = v },
  removeItem: (k) => { delete _store[k] }, clear: () => { Object.keys(_store).forEach(k => delete _store[k]) },
};
(globalThis as any).window = globalThis;
(globalThis as any).requestIdleCallback = (cb) => setTimeout(cb, 0);
(globalThis as any).cancelIdleCallback = (id) => clearTimeout(id);

import { createPinia, setActivePinia } from 'pinia';
import { useGameStore } from '../src/store/game.store.js';
import { calculateTotalWealth } from '../src/utils/math-engine.js';

function chooseNarrativeOption(event: any, state: any): any {
  const opts = event.options || [];
  if (!opts.length) return null;
  let best = opts[0], bs = -999;
  for (const o of opts) {
    let sc = 0;
    if (o.skillGains) sc += Object.values(o.skillGains).reduce((a: number, b: any) => a + (b || 0), 0) * 3;
    if (o.hintColor === 'positive') sc += 8;
    if (o.hintColor === 'danger' && state.stress > 75) sc -= 15;
    if (o.isRestOption && state.stress > 70) sc += 25;
    if (o.hint?.includes('信念')) sc += 4;
    if (o.savingsChange && o.savingsChange > 0) sc += o.savingsChange / 10000;
    if (sc > bs) { bs = sc; best = o; }
  }
  return best;
}
function chooseCrossroadOption(cr: any, state: any): any {
  const opts = cr.options || [];
  if (!opts.length) return null;
  let best = opts[0], bs = -999;
  for (const o of opts) {
    let sc = 0;
    if (o.hintColor === 'positive') sc += 10;
    if (o.hintColor === 'danger' && state.stress > 75) sc -= 15;
    if (o.label?.includes('All In')) sc += 5;
    if (sc > bs) { bs = sc; best = o; }
  }
  return best;
}

function trace(pathId: string, label: string) {
  setActivePinia(createPinia());
  const store = useGameStore();
  store.resetGame();
  store.startNewGame();
  store.setupGame('中坚大后方', '传统私企', 8000, 5000000, 'INTJ' as any, 'farm_hermit' as any);
  store.selectRetirementPath(pathId as any);

  console.log(`\n════════ ${label} 单局追踪 ════════`);
  let prevW = 0;
  for (let age = 22; age <= 60; age++) {
    const s = store.state;
    const cr = store.currentCrossroad;
    if (cr?.options?.length) { const o = chooseCrossroadOption(cr, s); if (o) store.selectCrossroadOption(o.id); }
    const ev = store.currentNarrativeEvent;
    if (ev?.options?.length) { const o = chooseNarrativeOption(ev, s); if (o) store.selectNarrativeOption(o.id); }
    const evId = (ev?.id || '').slice(0, 30);
    const crId = (cr?.id || '').slice(0, 30);
    store.commitYear();
    const post = store.state;
    const w = calculateTotalWealth(post);
    const gain = w - prevW;
    prevW = w;
    const bio = ((post as any).bioPortfolio || 0);
    const chain = ((post as any).chainHoldings || 0);
    const savings = post.currentSavings;
    const isFloat = !Number.isInteger(savings) && Math.abs(Math.round(savings) - savings) > 1e-6;
    const flag = [];
    if (gain > 2000000) flag.push(`◆大增值+${(gain/10000).toFixed(0)}万`);
    if (isFloat) flag.push(`◆浮点${savings}`);
    if (bio > 0) flag.push(`bio=${(bio/10000).toFixed(0)}万`);
    if (chain > 0) flag.push(`chain=${(chain/10000).toFixed(0)}万`);
    console.log(`  ${age}岁 存款${(savings/10000).toFixed(1)}万 总财富${(w/10000).toFixed(1)}万 事件[${evId}]${crId?'岔路['+crId+']':''} ${flag.join(' ')}`);
    if (post.endingTriggered) { console.log(`  结局: ${post.currentEndingId} @ ${age}岁`); break; }
    if (post.currentSavings < -300000) { console.log(`  破产 @ ${age}岁`); break; }
    if (post.health < 20) { console.log(`  健康濒死 @ ${age}岁`); break; }
  }
}

trace('bio_gambler', '生物赌徒');
trace('chain_native', '链上原住民');
trace('digital_nomad', '数字游牧民');