/**
 * 黑箱测试 v3 - 完全模拟真实玩家决策
 * 只使用玩家可见信息(label/description/HUD统计)，不访问任何隐藏的内部字段
 * 最优策略：根据语义文本选择最可能导向成功的选项
 * 6路径 × 200轮蒙特卡洛，统计平衡、数值健康、结局分布
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

interface SimRes {
  endingId: string;
  retireAge: number;
  metTarget: boolean;
  targetMetAge: number;
  totalWealth: number;
  maxSingleYearGain: number;
  maxExposure: number;
  floatLeak: string[];
  repeatLogs: string[];
}

// ============ 玩家可见信息决策算法 ============
// 只使用 label + description + 当前HUD状态 来打分，不访问任何隐藏字段

// 激进关键词：路径成功需要All In/持续投入，玩家知道要选这些
const AGGRESSIVE_WORDS = /All In|all_in|allin|all-in|辞职|裸辞|加大|投入|全力|梭哈|押上|拼一把|创业|all in/i;
// 保守/休息关键词：当健康压力差时选
const REST_WORDS = /休息|休养|调整|暂停|慢下来|养精蓄锐|不折腾/i;
// 成长关键词：增加能力/技能/网络
const GROWTH_WORDS = /学习|提升|技能|能力|人脉|社群|圈子|积累|练习|打磨/i;
// 赚钱关键词：直接增加收入/存款
const MONEY_WORDS = /赚钱|收入|存款|加薪|涨薪|额外收入|被动收入|接单/i;
// 减压力关键词
const STRESS_RELIEF_WORDS = /减压|放松|休息|降低压力|减轻压力|散步|休假/i;
// 加健康关键词
const HEALTH_WORDS = /健康|锻炼|运动|体检|养生/i;

function scoreNarrativeOption(option: any, state: any): number {
  let score = 0;
  const text = (option.label || '') + ' ' + (option.description || '');

  // 激进最优策略：优先All In/辞职/加大投入（玩家知道这是路径成功的关键）
  if (AGGRESSIVE_WORDS.test(text)) {
    score += 30;
  }

  // 成长选项加分
  const growthMatches = text.match(GROWTH_WORDS) || [];
  score += growthMatches.length * 8;

  // 赚钱选项加分
  const moneyMatches = text.match(MONEY_WORDS) || [];
  score += moneyMatches.length * 6;

  // 减压选项：压力大时加分很多
  const stressMatches = text.match(STRESS_RELIEF_WORDS) || [];
  if (state.stress > 70) {
    score += stressMatches.length * 20;
  } else {
    score += stressMatches.length * 5;
  }

  // 健康选项：健康差时加分很多
  const healthMatches = text.match(HEALTH_WORDS) || [];
  if (state.health < 30) {
    score += healthMatches.length * 20;
  } else {
    score += healthMatches.length * 5;
  }

  // 休息选项：压力大时加分
  if (REST_WORDS.test(text) && state.stress > 65) {
    score += 15;
  }

  // 没钱时，避免明显亏钱选项（文本说"花掉"、"支出"、"投资"的时候，如果存款少就扣分）
  if (state.currentSavings < 50000) {
    if (/(花掉|花费|支出|投资|投入资金|拿出|掏出)/i.test(text)) {
      score -= 15;
    }
  }

  // 健康差时避免明显损害健康选项
  if (state.health < 30) {
    if (/(熬夜|加班|拼命|透支|损害健康)/i.test(text)) {
      score -= 20;
    }
  }

  return score;
}

function scoreCrossroadOption(option: any, state: any): number {
  let score = 0;
  const text = (option.label || '') + ' ' + (option.description || '');

  // 和叙事选项相同的语义评分逻辑
  if (AGGRESSIVE_WORDS.test(text)) {
    score += 40;
  }

  const growthMatches = text.match(GROWTH_WORDS) || [];
  score += growthMatches.length * 8;

  const moneyMatches = text.match(MONEY_WORDS) || [];
  score += moneyMatches.length * 6;

  const stressMatches = text.match(STRESS_RELIEF_WORDS) || [];
  if (state.stress > 70) {
    score += stressMatches.length * 20;
  } else {
    score += stressMatches.length * 5;
  }

  const healthMatches = text.match(HEALTH_WORDS) || [];
  if (state.health < 30) {
    score += healthMatches.length * 20;
  } else {
    score += healthMatches.length * 5;
  }

  if (REST_WORDS.test(text) && state.stress > 65) {
    score += 15;
  }

  if (state.currentSavings < 50000) {
    if (/(花掉|花费|支出|投资|投入资金|拿出|掏出)/i.test(text)) {
      score -= 15;
    }
  }

  if (state.health < 30) {
    if (/(熬夜|加班|拼命|透支|损害健康)/i.test(text)) {
      score -= 20;
    }
  }

  return score;
}

function chooseNarrativeOption(event: any, state: any): any {
  const opts = (event.options || []).filter((o: any) => {
    // 如果选项有前置条件且不满足，玩家看不到可用的选项
    // 这里需要模拟前置条件检查，和UI行为一致
    if (!o.prerequisites) return true;
    try {
      return o.prerequisites(state);
    } catch {
      return false;
    }
  });
  if (opts.length === 0) return null;

  let best = opts[0];
  let bestScore = -999;

  for (const o of opts) {
    const sc = scoreNarrativeOption(o, state);
    if (sc > bestScore) {
      bestScore = sc;
      best = o;
    }
  }

  return best;
}

function chooseCrossroadOption(cr: any, state: any): any {
  const opts = (cr.options || []).filter((o: any) => {
    if (!o.prerequisites) return true;
    try {
      return o.prerequisites(state);
    } catch {
      return false;
    }
  });
  if (opts.length === 0) return null;

  let best = opts[0];
  let bestScore = -999;

  for (const o of opts) {
    const sc = scoreCrossroadOption(o, state);
    if (sc > bestScore) {
      bestScore = sc;
      best = o;
    }
  }

  return best;
}

// ============ 工具函数 ============

function floatSerialize(v: any): boolean {
  if (typeof v === 'number' && !Number.isInteger(v) && Math.abs(v) > 0 && Math.abs(Math.round(v) - v) > 1e-6) return true;
  return false;
}

function initialWealth(s: any): number {
  return (s.currentSavings || 0) + (s.propertyValue || 0) + ((s as any).chainHoldings || 0) + ((s as any).bioPortfolio || 0) + (s.shopValue || 0) + (s.passiveIncome || 0) * 20;
}

function runPath(pathId: string, retireOnMet: boolean): SimRes {
  setActivePinia(createPinia());
  const store = useGameStore();
  store.resetGame();
  store.startNewGame();
  store.setupGame('中坚大后方', '传统私企', 8000, TARGET_WEALTH, 'INTJ' as any, 'farm_hermit' as any);
  store.selectRetirementPath(pathId as any);

  const res: SimRes = {
    endingId: 'timeout', retireAge: -1, metTarget: false, targetMetAge: -1,
    totalWealth: 0, maxSingleYearGain: 0, maxExposure: 0, floatLeak: [], repeatLogs: [],
  };

  let prevWealth = initialWealth(store.state);
  const seenLogs = new Set<string>();
  const repeatSamples: string[] = [];

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

    // 退休决策：玩家最优策略 - 达标后尽早退休（模拟真实玩家心态）
    // 玩家能在HUD看到进度条，所以知道什么时候达标
    const canRetire = checkCanRetire(store.state);
    const wealth = calculateTotalWealth(store.state);
    if (!res.metTarget && wealth >= TARGET_WEALTH) {
      res.metTarget = true;
      res.targetMetAge = age;
    }
    if (retireOnMet && canRetire && wealth >= TARGET_WEALTH) {
      // 最优玩家：达标就退休，80%概率选择退休（保留20%继续玩的可能性）
      if (Math.random() < 0.8) {
        store.chooseRetire();
        res.retireAge = age;
        res.endingId = String(store.state.currentEndingId || 'retired');
        break;
      }
    }

    store.commitYear();
    // 修正模拟器：真实玩家流程 == 年结后关闭面板才会抽取下一年事件
    (store as any).dismissYearEnd && (store as any).dismissYearEnd();

    const post = store.state;
    const w = calculateTotalWealth(post);
    const gain = w - prevWealth;
    if (gain > res.maxSingleYearGain) {
      res.maxSingleYearGain = gain;
      (res as any).peakBreakdown = {
        age,
        savings: post.currentSavings,
        property: post.propertyValue,
        chain: (post as any).chainHoldings || 0,
        bio: (post as any).bioPortfolio || 0,
        passiveIncome: post.passiveIncome,
        passiveCapitalized: post.passiveIncome * 20,
        prevWealth, w,
      };
    }
    prevWealth = w;
    res.totalWealth = w;

    if (!res.metTarget && w >= TARGET_WEALTH) { res.metTarget = true; res.targetMetAge = age; }

    // 叙事重复检测（精确：仅统计归一化后完全相同的叙事文本）
    const logs = post.lifeLog || [];
    if (logs.length > 0) {
      const recent = logs.slice(-12);
      for (const l of recent) {
        if (l && l.length > 20) {
          // 归一化：去数字、标点、空白、年份，保留完整文本
          const key = l.replace(/[\d，。、！？\s：:；;（）()【】\[\]“”"'\n]/g, '');
          // 排除年度固定模板（开局旁白/月薪调整/通用资产流水），它们重复出现是设计而非叙述冗余
          if (/(职业生涯正式开局|月薪从¥调整为|累计支出|年度支出|存款总额|被动收入|本月生活费)/.test(key)) continue;
          if (seenLogs.has(key)) {
            if (!res.repeatLogs.includes(key)) res.repeatLogs.push(key);
            if (repeatSamples.length < 3 && !repeatSamples.some(x => x === key)) repeatSamples.push(key);
          } else seenLogs.add(key);
        }
      }
    }

    // 浮点泄漏检测
    if (floatSerialize(post.currentSavings)) {
      if (!res.floatLeak.includes(String(post.currentSavings))) res.floatLeak.push(String(post.currentSavings));
    }
    if (floatSerialize(post.propertyValue)) {
      if (!res.floatLeak.includes(String(post.propertyValue))) res.floatLeak.push(String(post.propertyValue));
    }

    if (post.endingTriggered) {
      res.endingId = String(post.currentEndingId || 'unknown');
      res.retireAge = age;
      break;
    }
    if (post.currentSavings < -300000) { res.endingId = 'E8_bankrupt'; res.retireAge = age; break; }
    if (post.health < 20) { res.endingId = 'E4_health'; res.retireAge = age; break; }
  }
  if (res.retireAge === -1) res.retireAge = 60;
  (res as any).repeatSamples = repeatSamples;
  return res;
}

// ============ 执行测试 ============
console.log('='.repeat(90));
console.log('  黑箱测试 v3 · 真实玩家最优策略（只使用可见信息）');
console.log(`  条件: 中坚大后方/传统私企/起薪8000/INTJ/目标${(TARGET_WEALTH/10000).toFixed(0)}万`);
console.log('  方法: 仅基于label+description语义+HUD可见状态决策，不访问隐藏字段');
console.log('='.repeat(90));

const summary: Record<string, any> = {};
for (const p of PATHS) {
  const dist: Record<string, number> = {};
  let success = 0, failure = 0, retiredUntarget = 0, metRate = 0;
  let metAgeSum = 0, metCnt = 0, retireAgeSum = 0;
  let maxSingleYear = 0, floatCount = 0, repeatCount = 0;
  const floats: string[] = [];
  const repeatTextSamples = new Set<string>();
  let peakBreak: any = null;
  for (let r = 0; r < ROUNDS; r++) {
    const res = runPath(p.id, true);
    dist[res.endingId] = (dist[res.endingId] || 0) + 1;
    if (res.endingId.startsWith('path_success_')) success++;
    if (res.endingId.startsWith('path_failure_')) failure++;
    if (res.metTarget) { metRate++; }
    if (res.targetMetAge > 0) { metAgeSum += res.targetMetAge; metCnt++; }
    retireAgeSum += res.retireAge;
    if (res.maxSingleYearGain > maxSingleYear) { maxSingleYear = res.maxSingleYearGain; peakBreak = (res as any).peakBreakdown; }
    floatCount += res.floatLeak.length;
    if (res.floatLeak[0]) floats.push(res.floatLeak[0]);
    repeatCount += res.repeatLogs.length;
    ((res as any).repeatSamples || []).forEach((s: string) => repeatTextSamples.add(s));
  }
  summary[p.id] = {
    name: p.name, dist, success, failure, metRate: metRate / ROUNDS,
    avgMetAge: metCnt ? (metAgeSum / metCnt).toFixed(1) : '-',
    avgRetireAge: (retireAgeSum / ROUNDS).toFixed(1),
    maxSingleYear: maxSingleYear, floatCount, repeatCount,
  };
  console.log(`\n── ${p.name} ──`);
  console.log(`  成功:${success}(${(success/ROUNDS*100).toFixed(1)}%) 失败:${failure}(${(failure/ROUNDS*100).toFixed(1)}%) 达标率:${(metRate/ROUNDS*100).toFixed(1)}%`);
  console.log(`  平均达标年龄:${summary[p.id].avgMetAge} 平均退休年龄:${summary[p.id].avgRetireAge}`);
  console.log(`  单年最大增值:¥${(maxSingleYear/10000).toFixed(1)}万 浮点泄漏:${floatCount}条 叙事重复:${repeatCount}条`);
  const topEndings = Object.entries(dist).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>`${k}:${v}`).join(', ');
  console.log(`  结局分布: ${topEndings}`);
  if (repeatTextSamples.size > 0) {
    console.log(`  重复文本样本(前3):`);
    [...repeatTextSamples].slice(0,3).forEach(t => console.log(`    · ${t.slice(0,60)}`));
  }
  if (peakBreak) {
    console.log(`  峰值构成(时年${peakBreak.age}): 存款¥${((peakBreak.savings||0)/10000).toFixed(0)}万 房产¥${((peakBreak.property||0)/10000).toFixed(0)}万 链上¥${(((peakBreak.chain||0))/10000).toFixed(0)}万 生物¥${(((peakBreak.bio||0))/10000).toFixed(0)}万`);
    console.log(`    被动收入¥${(((peakBreak.passiveIncome||0))/10000).toFixed(0)}万(×20=¥${(((peakBreak.passiveCapitalized||0))/10000).toFixed(0)}万) 上年财富¥${(((peakBreak.prevWealth||0))/10000).toFixed(0)}万 → 当年¥${(((peakBreak.w||0))/10000).toFixed(0)}万`);
  }
}

// 平衡度
console.log('\n' + '='.repeat(90));
console.log('  平衡度对比（真实玩家最优策略）');
console.log('='.repeat(90));
const successRates = PATHS.map(p => summary[p.id].success / ROUNDS * 100);
const maxS = Math.max(...successRates), minS = Math.min(...successRates);
console.log(`  成功率范围: ${minS.toFixed(1)}% ~ ${maxS.toFixed(1)}% (极差${(maxS-minS).toFixed(1)}pp)`);
PATHS.forEach(p => console.log(`  ${(p.name + '').padEnd(10)}: 成功${(summary[p.id].success/ROUNDS*100).toFixed(1)}% 达标${(summary[p.id].metRate*100).toFixed(1)}% 退休${summary[p.id].avgRetireAge}岁`));

// 数值爆炸检测
console.log('\n' + '='.repeat(90));
console.log('  数值健康度');
console.log('='.repeat(90));
PATHS.forEach(p => {
  const s = summary[p.id];
  console.log(`  ${(p.name + '').padEnd(10)}: 单年峰值¥${(s.maxSingleYear/10000).toFixed(1)}万 浮点泄漏${s.floatCount}条 叙事重复${s.repeatCount}条`);
});

// 统计报告输出JSON方便后续生成图表
console.log('\n' + '='.repeat(90));
console.log('  数据摘要JSON（用于报告生成）');
console.log('='.repeat(90));
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  config: { rounds: ROUNDS, targetWealth: TARGET_WEALTH },
  paths: summary
}, null, 2));
