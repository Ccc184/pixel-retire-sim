/**
 * 黑箱评级测试 - 综合评估各路径的S/A/B/C/D评级分布
 * 
 * 基于 blackbox-player-optimal.ts 的决策逻辑，
 * 在每局结束时调用 computeGradeBreakdown 计算真实评级，
 * 统计各路径的评级分布、各维度得分均值、以及整体平衡度。
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
import { computeGradeBreakdown } from '../src/utils/rating.js';
import type { FinalGrade, GradeBreakdown } from '../src/utils/rating.js';

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

// ============ 玩家决策算法（同 blackbox-player-optimal.ts） ============

const AGGRESSIVE_WORDS = /All In|all_in|allin|all-in|辞职|裸辞|加大|投入|全力|梭哈|押上|拼一把|创业|all in/i;
const REST_WORDS = /休息|休养|调整|暂停|慢下来|养精蓄锐|不折腾/i;
const GROWTH_WORDS = /学习|提升|技能|能力|人脉|社群|圈子|积累|练习|打磨/i;
const MONEY_WORDS = /赚钱|收入|存款|加薪|涨薪|额外收入|被动收入|接单/i;
const STRESS_RELIEF_WORDS = /减压|放松|休息|降低压力|减轻压力|散步|休假/i;
const HEALTH_WORDS = /健康|锻炼|运动|体检|养生/i;

function scoreNarrativeOption(option: any, state: any): number {
  let score = 0;
  const text = (option.label || '') + ' ' + (option.description || '');
  if (AGGRESSIVE_WORDS.test(text)) score += 30;
  const growthMatches = text.match(GROWTH_WORDS) || [];
  score += growthMatches.length * 8;
  const moneyMatches = text.match(MONEY_WORDS) || [];
  score += moneyMatches.length * 6;
  const stressMatches = text.match(STRESS_RELIEF_WORDS) || [];
  if (state.stress > 70) score += stressMatches.length * 20;
  else score += stressMatches.length * 5;
  const healthMatches = text.match(HEALTH_WORDS) || [];
  if (state.health < 30) score += healthMatches.length * 20;
  else score += healthMatches.length * 5;
  if (REST_WORDS.test(text) && state.stress > 65) score += 15;
  if (state.currentSavings < 50000) {
    if (/(花掉|花费|支出|投资|投入资金|拿出|掏出)/i.test(text)) score -= 15;
  }
  if (state.health < 30) {
    if (/(熬夜|加班|拼命|透支|损害健康)/i.test(text)) score -= 20;
  }
  return score;
}

function scoreCrossroadOption(option: any, state: any): number {
  let score = 0;
  const text = (option.label || '') + ' ' + (option.description || '');
  if (AGGRESSIVE_WORDS.test(text)) score += 40;
  const growthMatches = text.match(GROWTH_WORDS) || [];
  score += growthMatches.length * 8;
  const moneyMatches = text.match(MONEY_WORDS) || [];
  score += moneyMatches.length * 6;
  const stressMatches = text.match(STRESS_RELIEF_WORDS) || [];
  if (state.stress > 70) score += stressMatches.length * 20;
  else score += stressMatches.length * 5;
  const healthMatches = text.match(HEALTH_WORDS) || [];
  if (state.health < 30) score += healthMatches.length * 20;
  else score += healthMatches.length * 5;
  if (REST_WORDS.test(text) && state.stress > 65) score += 15;
  if (state.currentSavings < 50000) {
    if (/(花掉|花费|支出|投资|投入资金|拿出|掏出)/i.test(text)) score -= 15;
  }
  if (state.health < 30) {
    if (/(熬夜|加班|拼命|透支|损害健康)/i.test(text)) score -= 20;
  }
  return score;
}

function chooseNarrativeOption(event: any, state: any): any {
  const opts = (event.options || []).filter((o: any) => {
    if (!o.prerequisites) return true;
    try { return o.prerequisites(state); } catch { return false; }
  });
  if (opts.length === 0) return null;
  let best = opts[0], bestScore = -999;
  for (const o of opts) {
    const sc = scoreNarrativeOption(o, state);
    if (sc > bestScore) { bestScore = sc; best = o; }
  }
  return best;
}

function chooseCrossroadOption(cr: any, state: any): any {
  const opts = (cr.options || []).filter((o: any) => {
    if (!o.prerequisites) return true;
    try { return o.prerequisites(state); } catch { return false; }
  });
  if (opts.length === 0) return null;
  let best = opts[0], bestScore = -999;
  for (const o of opts) {
    const sc = scoreCrossroadOption(o, state);
    if (sc > bestScore) { bestScore = sc; best = o; }
  }
  return best;
}

function initialWealth(s: any): number {
  return (s.currentSavings || 0) + (s.propertyValue || 0) + ((s as any).chainHoldings || 0) + ((s as any).bioPortfolio || 0) + (s.shopValue || 0) + (s.passiveIncome || 0) * 20;
}

interface RatingSimResult {
  endingId: string;
  retireAge: number;
  metTarget: boolean;
  targetMetAge: number;
  totalWealth: number;
  grade: FinalGrade;
  breakdown: GradeBreakdown;
  endingTriggered: boolean;
}

function runPathWithRating(pathId: string): RatingSimResult {
  setActivePinia(createPinia());
  const store = useGameStore();
  store.resetGame();
  store.startNewGame();
  store.setupGame('中坚大后方', '传统私企', 8000, TARGET_WEALTH, 'INTJ' as any, 'farm_hermit' as any);
  store.selectRetirementPath(pathId as any);

  let prevWealth = initialWealth(store.state);

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

    // 退休决策：达标后尽早退休
    const canRetire = checkCanRetire(store.state);
    const wealth = calculateTotalWealth(store.state);
    if (canRetire && wealth >= TARGET_WEALTH) {
      if (Math.random() < 0.8) {
        store.chooseRetire();
        const finalState = store.state;
        const breakdown = computeGradeBreakdown(finalState);
        return {
          endingId: String(finalState.currentEndingId || 'retired'),
          retireAge: age,
          metTarget: true,
          targetMetAge: age,
          totalWealth: wealth,
          grade: breakdown.grade,
          breakdown,
          endingTriggered: true,
        };
      }
    }

    store.commitYear();
    (store as any).dismissYearEnd && (store as any).dismissYearEnd();

    const post = store.state;
    const w = calculateTotalWealth(post);
    prevWealth = w;

    if (post.endingTriggered) {
      const breakdown = computeGradeBreakdown(post);
      return {
        endingId: String(post.currentEndingId || 'unknown'),
        retireAge: age,
        metTarget: w >= TARGET_WEALTH,
        targetMetAge: w >= TARGET_WEALTH ? age : -1,
        totalWealth: w,
        grade: breakdown.grade,
        breakdown,
        endingTriggered: true,
      };
    }
    if (post.currentSavings < -300000) {
      const breakdown = computeGradeBreakdown(post);
      return {
        endingId: 'E8_bankrupt',
        retireAge: age,
        metTarget: false,
        targetMetAge: -1,
        totalWealth: w,
        grade: breakdown.grade,
        breakdown,
        endingTriggered: true,
      };
    }
    if (post.health < 20) {
      const breakdown = computeGradeBreakdown(post);
      return {
        endingId: 'E4_health',
        retireAge: age,
        metTarget: false,
        targetMetAge: -1,
        totalWealth: w,
        grade: breakdown.grade,
        breakdown,
        endingTriggered: true,
      };
    }
  }

  // 到60岁自动结束
  const finalState = store.state;
  const finalWealth = calculateTotalWealth(finalState);
  const breakdown = computeGradeBreakdown(finalState);
  return {
    endingId: String(finalState.currentEndingId || 'timeout'),
    retireAge: 60,
    metTarget: finalWealth >= TARGET_WEALTH,
    targetMetAge: -1,
    totalWealth: finalWealth,
    grade: breakdown.grade,
    breakdown,
    endingTriggered: false,
  };
}

// ============ 执行测试 ============
console.log('='.repeat(90));
console.log('  黑箱评级测试 · 综合S/A/B/C/D评级分布评估');
console.log(`  条件: 中坚大后方/传统私企/起薪8000/INTJ/目标${(TARGET_WEALTH/10000).toFixed(0)}万`);
console.log(`  次数: 每路径 ${ROUNDS} 轮 · 共 ${PATHS.length * ROUNDS} 局模拟`);
console.log('='.repeat(90));

const allResults: Record<string, RatingSimResult[]> = {};
const gradeDist: Record<string, Record<FinalGrade, number>> = {};
const totalGradeDist: Record<FinalGrade, number> = { S: 0, A: 0, B: 0, C: 0, D: 0 };

for (const p of PATHS) {
  allResults[p.id] = [];
  gradeDist[p.id] = { S: 0, A: 0, B: 0, C: 0, D: 0 };

  for (let r = 0; r < ROUNDS; r++) {
    const res = runPathWithRating(p.id);
    allResults[p.id].push(res);
    gradeDist[p.id][res.grade]++;
    totalGradeDist[res.grade]++;
  }

  // 计算各维度平均分
  const totalPts = allResults[p.id].reduce((acc, r) => ({
    financial: acc.financial + r.breakdown.parts.financial,
    pathBonus: acc.pathBonus + r.breakdown.parts.pathBonus,
    earlyBonus: acc.earlyBonus + r.breakdown.parts.earlyBonus,
    life: acc.life + r.breakdown.parts.life,
    survival: acc.survival + r.breakdown.parts.survival,
    total: acc.total + r.breakdown.total,
  }), { financial: 0, pathBonus: 0, earlyBonus: 0, life: 0, survival: 0, total: 0 });

  const avg = {
    financial: (totalPts.financial / ROUNDS).toFixed(1),
    pathBonus: (totalPts.pathBonus / ROUNDS).toFixed(1),
    earlyBonus: (totalPts.earlyBonus / ROUNDS).toFixed(1),
    life: (totalPts.life / ROUNDS).toFixed(1),
    survival: (totalPts.survival / ROUNDS).toFixed(1),
    total: (totalPts.total / ROUNDS).toFixed(1),
  };

  const success = allResults[p.id].filter(r => r.endingId.startsWith('path_success_')).length;
  const avgRetireAge = (allResults[p.id].reduce((s, r) => s + r.retireAge, 0) / ROUNDS).toFixed(1);
  const avgWealth = (allResults[p.id].reduce((s, r) => s + r.totalWealth, 0) / ROUNDS / 10000).toFixed(1);

  console.log(`\n── ${p.name} ──`);
  console.log(`  评级分布: S:${gradeDist[p.id].S} A:${gradeDist[p.id].A} B:${gradeDist[p.id].B} C:${gradeDist[p.id].C} D:${gradeDist[p.id].D}`);
  console.log(`  评级占比: S:${(gradeDist[p.id].S/ROUNDS*100).toFixed(1)}% A:${(gradeDist[p.id].A/ROUNDS*100).toFixed(1)}% B:${(gradeDist[p.id].B/ROUNDS*100).toFixed(1)}% C:${(gradeDist[p.id].C/ROUNDS*100).toFixed(1)}% D:${(gradeDist[p.id].D/ROUNDS*100).toFixed(1)}%`);
  console.log(`  路径成功:${success}(${(success/ROUNDS*100).toFixed(1)}%) 平均退休:${avgRetireAge}岁 平均财富:¥${avgWealth}万`);
  console.log(`  各维度均分: 财务${avg.financial} 路径${avg.pathBonus} 提前退${avg.earlyBonus} 生活${avg.life} 生存${avg.survival} = 总分${avg.total}`);
}

// 整体统计
console.log('\n' + '='.repeat(90));
console.log('  整体评级分布汇总');
console.log('='.repeat(90));
const totalGames = PATHS.length * ROUNDS;
console.log(`  总模拟局数: ${totalGames}`);
console.log(`  S:${totalGradeDist.S}(${(totalGradeDist.S/totalGames*100).toFixed(1)}%)  A:${totalGradeDist.A}(${(totalGradeDist.A/totalGames*100).toFixed(1)}%)  B:${totalGradeDist.B}(${(totalGradeDist.B/totalGames*100).toFixed(1)}%)  C:${totalGradeDist.C}(${(totalGradeDist.C/totalGames*100).toFixed(1)}%)  D:${totalGradeDist.D}(${(totalGradeDist.D/totalGames*100).toFixed(1)}%)`);

// 平衡度
console.log('\n' + '='.repeat(90));
console.log('  平衡度分析');
console.log('='.repeat(90));
const sRates = PATHS.map(p => gradeDist[p.id].S / ROUNDS * 100);
const abRates = PATHS.map(p => (gradeDist[p.id].A + gradeDist[p.id].B) / ROUNDS * 100);
const cdRates = PATHS.map(p => (gradeDist[p.id].C + gradeDist[p.id].D) / ROUNDS * 100);
console.log(`  S率范围: ${Math.min(...sRates).toFixed(1)}% ~ ${Math.max(...sRates).toFixed(1)}% (极差${(Math.max(...sRates)-Math.min(...sRates)).toFixed(1)}pp)`);
console.log(`  A+B率范围: ${Math.min(...abRates).toFixed(1)}% ~ ${Math.max(...abRates).toFixed(1)}% (极差${(Math.max(...abRates)-Math.min(...abRates)).toFixed(1)}pp)`);
console.log(`  C+D率范围: ${Math.min(...cdRates).toFixed(1)}% ~ ${Math.max(...cdRates).toFixed(1)}% (极差${(Math.max(...cdRates)-Math.min(...cdRates)).toFixed(1)}pp)`);

PATHS.forEach(p => {
  const g = gradeDist[p.id];
  console.log(`  ${p.name.padEnd(10)}: S${(g.S/ROUNDS*100).toFixed(1)}% A${(g.A/ROUNDS*100).toFixed(1)}% B${(g.B/ROUNDS*100).toFixed(1)}% C${(g.C/ROUNDS*100).toFixed(1)}% D${(g.D/ROUNDS*100).toFixed(1)}%`);
});

// 尾声
console.log('\n' + '='.repeat(90));
console.log('  评级数据JSON');
console.log('='.repeat(90));
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  config: { rounds: ROUNDS, targetWealth: TARGET_WEALTH },
  paths: Object.fromEntries(PATHS.map(p => [p.id, {
    name: p.name,
    gradeDist: gradeDist[p.id],
    avgWealth: (allResults[p.id].reduce((s, r) => s + r.totalWealth, 0) / ROUNDS).toFixed(0),
    avgRetireAge: (allResults[p.id].reduce((s, r) => s + r.retireAge, 0) / ROUNDS).toFixed(1),
  }])),
  totalGradeDist,
}, null, 2));