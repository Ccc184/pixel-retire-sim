/**
 * 追踪 AI共生者 逐年收入构成，定位"为什么任何杠杆都压不低其成功率"
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

const TARGET_WEALTH = 5000000;
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

setActivePinia(createPinia());
const store = useGameStore();
store.resetGame();
store.startNewGame();
store.setupGame('中坚大后方', '传统私企', 8000, TARGET_WEALTH, 'INTJ' as any, 'farm_hermit' as any);
store.selectRetirementPath('ai_symbiote' as any);

console.log('年龄  月薪      被动收入    存款      生活成本  总财富   AllIn?  技能');
for (let age = 22; age <= 60; age++) {
  const s: any = store.state;
  const cr = store.currentCrossroad;
  if (cr && cr.options?.length) { const o = chooseOption(cr.options, s); if (o) store.selectCrossroadOption(o.id); }
  const ev = store.currentNarrativeEvent;
  if (ev && ev.options?.length) { const o = chooseOption(ev.options, s); if (o) store.selectNarrativeOption(o.id); }
  const skill = Object.values(s.pathSkills || {}).reduce((a: number, b: any) => a + (b || 0), 0);
  console.log(`${age}  ${String(s.currentMonthlySalary || 0).padStart(8)}  ${String((s.passiveIncome || 0)).padStart(8)}  ${String(s.currentSavings || 0).padStart(9)}  ${String(s.annualBaseCost || 0).padStart(8)}  ${String(calculateTotalWealth(s)).padStart(9)}  ${s.isAllInPath ? 'Y' : 'N'}  ${skill}`);
  store.commitYear();
  (store as any).dismissYearEnd && (store as any).dismissYearEnd();
  if ((store.state as any).endingTriggered) break;
}