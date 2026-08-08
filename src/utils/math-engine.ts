import type { GameState, CityType, Profession, CityConfig, YearResult, SalaryChangeEntry } from '../types/global.d.js';
import { getPath } from '../data/retirement-paths.js';
import { getActiveMBTIMechanics, getMBTIProfessionModifier } from '../data/mbti-system.js';

// ========== 城市配置常量（严格按设计书第三章）==========
export const CITY_CONFIGS: Record<CityType, CityConfig> = {
  '资本修罗场': {
    name: '资本修罗场',
    costMultiplier: 1.8,
    salaryMultiplier: 1.4,
    layoffModifier: 0.05,
    downPayment: 120000,
    annualMortgage: 80000,
    mortgageYears: 20,
    propertyValue: 2000000,
  },
  '中坚大后方': {
    name: '中坚大后方',
    costMultiplier: 1.0,
    salaryMultiplier: 1.0,
    layoffModifier: 0,
    downPayment: 40000,
    annualMortgage: 40000,
    mortgageYears: 20,
    propertyValue: 700000,
  },
  '避风低洼地': {
    name: '避风低洼地',
    costMultiplier: 0.4,
    salaryMultiplier: 0.55,
    layoffModifier: -0.5, // 裁员率减半
    downPayment: 15000,
    annualMortgage: 15000,
    mortgageYears: 10,
    propertyValue: 200000,
  },
  '海外低成本': {
    name: '海外低成本',
    costMultiplier: 0.3,
    salaryMultiplier: 0.4,
    layoffModifier: -0.8, // 远程工作基本不受本地裁员影响
    downPayment: 0,
    annualMortgage: 0,
    mortgageYears: 0,
    propertyValue: 0,
  },
};

// 随机函数
export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * 经济感知缩放：把卡片里写死的"小额固定收益"按玩家当前经济规模放大，
 * 避免后期（存款数十万~上千万时）出现"选=没选"的卡片。
 *
 * 规则（只放大正的收益类效果，成本类与已可感知的大额保持不变）：
 *   - 目标下限 = ref * floorPct（让收益至少占到当前经济规模的一定比例，能被感知）
 *   - 上限 = amount * maxMult（防止小数额被无脑放大到离谱）
 *   - 结果 = max(原值, min(下限, 上限))，即只抬升"过小"的收益，越大越不干预
 *
 * @param amount  卡片里写死的固定收益（正数）
 * @param ref     参照经济规模（如当前存款 / 年支出 / 月薪）
 * @param floorPct  收益下限占参照的比例
 * @param maxMult  最大放大倍数（防爆）
 */
export function scalePerceptibleIncome(amount: number, ref: number, floorPct: number, maxMult: number): number {
  if (amount <= 0) return amount; // 只处理正的收益
  const floor = ref * floorPct;
  const capped = amount * maxMult;
  return Math.max(amount, Math.min(floor, capped));
}

/**
 * 投资成本缩放：把"花钱换钱"的投资型固定成本按玩家当前经济规模放大，
 * 避免后期（存款数十万~上千万时）投资几千万把却毫无感觉（"选=没选"）。
 *
 * 与 scalePerceptibleIncome 对称，但作用于负的成本：
 *   - 目标下限 = ref * floorPct（让投资额至少占到当前经济规模的比例，能被感知）
 *   - 上限 = |cost| * maxMult（防止小成本被放大到离谱，也防止玩家被掏空）
 *   - 结果 = max(|cost|, min(下限, 上限))，即只抬升"过小"的投资额
 *
 * 注意：仅用于"投资型成本"（负 savingsChange 且同时有正回报 passiveIncomeChange/
 * salaryChange）。纯消费成本（请客/体检/家庭开销）不应放大。
 *
 * @param cost  卡片里写死的固定投资成本（负数）
 * @param ref   参照经济规模（如当前存款）
 * @param floorPct  投资额下限占参照的比例
 * @param maxMult  最大放大倍数（防爆）
 */
export function scalePerceptibleCost(cost: number, ref: number, floorPct: number, maxMult: number): number {
  if (cost >= 0) return cost; // 只处理负的投资成本
  const absCost = Math.abs(cost);
  const floor = ref * floorPct;
  const capped = absCost * maxMult;
  const scaled = Math.max(absCost, Math.min(floor, capped));
  return -scaled;
}

/**
 * 链上持仓规模递减因子：持仓越大，正向缩放的边际效果越小
 * 模拟真实加密市场规律：小资金灵活，大资金体量本身就是收益率的敌人
 *
 *   - 100万以下：100%效果（小资金船小好调头）
 *   - 100万~500万：75%（资金量开始影响进出速度）
 *   - 500万~2000万：55%（千万级资金，收益率自然收窄）
 *   - 2000万~1亿：30%（大资金，年化30%已经是神话）
 *   - 1亿~3亿：12%（亿级资金，跑赢指数就是胜利）
 *   - 3亿以上：5%（巨型资金，市场容量本身就是天花板）
 *
 * 仅对 multiplier > 1 的正向缩放生效（收益递减）
 * 负向缩放（亏损）不受规模递减影响
 */
export function getChainScaleDampeningFactor(holdings: number, multiplier: number): number {
  if (multiplier <= 1.0) return 1.0;
  if (holdings <= 1000000) return 1.0;
  if (holdings <= 5000000) return 0.75;
  if (holdings <= 20000000) return 0.55;
  if (holdings <= 100000000) return 0.30;
  if (holdings <= 300000000) return 0.12;
  return 0.05;
}

/**
 * 生物科技持仓规模递减因子：与链上对称。
 * 持仓越大，正向收益率的边际效果越小——大资金的进出、机会成本、市场规模本身都是收益率的天敌。
 *   - 100万以下：100%效果
 *   - 100万~500万：80%
 *   - 500万~2000万：60%
 *   - 2000万~1亿：35%
 *   - 1亿~3亿：15%
 *   - 3亿以上：6%
 * 仅对 multiplier > 1 的正向缩放生效（收益递减）；负向缩放（亏损）不受影响。
 */
export function getBioScaleDampeningFactor(portfolio: number, multiplier: number): number {
  if (multiplier <= 1.0) return 1.0;
  if (portfolio <= 1000000) return 1.0;
  if (portfolio <= 5000000) return 0.8;
  if (portfolio <= 20000000) return 0.6;
  if (portfolio <= 100000000) return 0.35;
  if (portfolio <= 300000000) return 0.15;
  return 0.06;
}

/**
 * 应用带规模递减的生物科技持仓缩放
 * 不再设硬性持仓上限：靠规模递减算法自然收敛峰值，避免数值失真。
 * @returns 实际应用后的新持仓值
 */
export function applyBioScale(portfolio: number, multiplier: number): number {
  const damp = getBioScaleDampeningFactor(portfolio, multiplier);
  const actualMultiplier = 1.0 + (multiplier - 1.0) * damp;
  return Math.max(0, Math.round(portfolio * actualMultiplier));
}

/**
 * 应用带规模递减的链上持仓缩放（不再设硬性持仓上限）
 * @returns 实际应用后的新持仓值
 */
export function applyChainHoldingScale(holdings: number, multiplier: number): number {
  const damp = getChainScaleDampeningFactor(holdings, multiplier);
  const actualMultiplier = 1.0 + (multiplier - 1.0) * damp;
  return Math.max(0, Math.round(holdings * actualMultiplier));
}

/**
 * 突破事件单次收益上限（含现金化/套现收益）
 * 链上/生物路径的突破事件用"年支出×N"或"当前持仓×M"硬放大，后期持仓巨大时
 * 会在单年内产生 2-4 倍于退休目标的爆炸式跳变（如2000万/1300万）。
 * 上限 = 最多一次填满退休目标（targetWealth）：保留"一次突破=退休自由"的爽感，
 * 但杜绝单事件远超目标的多倍复用。
 */
export function capBreakthroughGain(amount: number, state: GameState): number {
  const annualExpense = state.annualBaseCost + (state.currentMortgageCost || 0);
  const ceiling = Math.max(state.targetWealth, annualExpense * 3);
  return Math.max(0, Math.min(Math.round(amount), Math.round(ceiling)));
}

// ========== 年度调薪逻辑（重新设计：更像真实人生）==========
//
// 设计原则：
// 1. 技能驱动涨薪——pathSkills越高，涨薪幅度越大（技能变现）
// 2. 职业天花板大幅提高——允许真正的"崛起"
// 3. 萧条年只是减缓涨薪，不是完全冻结
// 4. 路径信念高的人有额外涨薪加成（创业精神/内驱力）
// 5. 30-45岁是黄金涨薪期，之后逐渐放缓但不会停止
export function applySalaryRaise(state: GameState): SalaryChangeEntry[] {
  const initialRealSalary = state.careerStartSalary;
  if (initialRealSalary <= 0) return [];

  const breakdown: SalaryChangeEntry[] = [];
  const salaryBefore = state.currentMonthlySalary;

  // === All In 后的涨薪逻辑：技能驱动+口碑复利+增长递减，不走职业等级体系 ===
  if (state.isAllInPath) {
    const pathSkills = state.pathSkills || {};
    const maxSkill = Math.max(0, ...Object.values(pathSkills));
    let skillGrowthRate = Math.min(maxSkill / 15 * 0.032, 0.14);
    const faithBonus = state.pathFaith > 70 ? 1.03 : 1.0;
    const salaryMultiple = state.currentMonthlySalary / Math.max(1, initialRealSalary);
    let growthDecay = 1.0;
    if (salaryMultiple >= 5) growthDecay = 0.6;
    else if (salaryMultiple >= 3) growthDecay = 0.75;
    else if (salaryMultiple >= 2) growthDecay = 0.9;
    const reputationBonus = salaryMultiple >= 2 ? 1.02 : 1.0;
    const depressionMult = state.economicCycle === 2 ? 0.5 : 1.0;
    const randomness = 0.95 + Math.random() * 0.1;
    const totalRaise = skillGrowthRate * faithBonus * reputationBonus * growthDecay * depressionMult * randomness;
    const cap = initialRealSalary * 6;
    const newSalary = Math.round(Math.min(state.currentMonthlySalary * (1 + totalRaise), cap));
    const delta = newSalary - salaryBefore;

    if (Math.abs(delta) >= 1) {
      let label = '事业增长';
      let note = '';
      if (state.economicCycle === 2) {
        label = '事业遇冷';
        note = '经济大环境萧条，业务增长放缓';
      } else if (salaryMultiple >= 5) {
        label = '增长瓶颈';
        note = '客户市场趋于饱和，增速放缓';
      } else if (skillGrowthRate >= 0.08) {
        label = '技能驱动';
        note = '专业能力持续提升，收入水涨船高';
      } else if (faithBonus > 1.0) {
        label = '口碑复利';
        note = '信念坚定带来良好口碑，客户转介绍增加';
      } else if (randomness > 1.05) {
        label = '好运连连';
        note = '今年接到几个大单，收入意外增长';
      } else if (randomness < 0.97) {
        label = '平平淡淡';
        note = '今年业务平稳，没有太大起伏';
      } else {
        label = '稳步发展';
        note = '客户和收入稳步增长';
      }
      if (newSalary >= cap && salaryBefore < cap) {
        label = '收入触顶';
        note = '已达到当前赛道的收入天花板';
      }
      breakdown.push({ source: label, amount: delta, note });
    }

    state.currentMonthlySalary = newSalary;
    return breakdown;
  }

  // 技能加成：取路径技能最高值，每5点技能带来1%额外涨薪（v13平衡：技能权重↑↑，不学就掉队）
  const pathSkills = state.pathSkills || {};
  const maxSkill = Math.max(0, ...Object.values(pathSkills));
  const skillBonus = 1 + Math.min(maxSkill / 500, 0.6);

  // 信念加成：信念>70时额外+5%涨薪
  const faithBonus = state.pathFaith > 70 ? 1.05 : 1.0;

  // MBTI人格×职业涨薪微调
  const mbtiProfMod = getMBTIProfessionModifier((state as any).mbtiType, state.currentProfession);
  const mbtiGrowthMult = mbtiProfMod.salaryGrowthMultiplier;

  // 年龄乘数（薪资曲线：黄金期30-45 → 46岁后逐步回落0.7 → 52岁后0.5，避免薪资锁定在35岁峰值）
  const ageMult = state.currentAge >= 30 && state.currentAge <= 45 ? 1.2
    : state.currentAge >= 46 && state.currentAge <= 51 ? 0.7
    : state.currentAge >= 52 ? 0.5
    : 0.8;

  // 萧条修正
  const depressionMult = state.economicCycle === 2 ? 0.5 : 1.0;

  // 基础年涨幅
  let baseRaise: number;
  let capMultiplier: number;

  switch (state.currentProfession) {
    case '体制内': {
      baseRaise = 0.0216;
      capMultiplier = 2.5;
      break;
    }
    case '红利行业': {
      if (state.currentAge < 35) {
        baseRaise = 0.072;
        capMultiplier = 4.5;
      } else if (state.currentAge === 35) {
        // 35岁断崖：乘0.7
        const cliffSalary = Math.round(state.currentMonthlySalary * 0.7);
        const cliffDelta = cliffSalary - state.currentMonthlySalary;
        breakdown.push({ source: '35岁危机', amount: cliffDelta, note: '行业优化结构，你被划入"高龄低潜"名单，薪资下调30%' });
        state.currentMonthlySalary = cliffSalary;
        baseRaise = 0.0216;
        capMultiplier = 2.8;
      } else {
        baseRaise = 0.0216;
        capMultiplier = 2.8;
      }
      break;
    }
    case '传统私企': {
      baseRaise = 0.036;
      capMultiplier = 3.0;
      break;
    }
    case '自由职业': {
      const rand = randomRange(-0.11, 0.10);
      baseRaise = 0.0108 + rand;
      capMultiplier = 3.2;
      break;
    }
    case '实体创业': {
      baseRaise = 0.0144;
      capMultiplier = 6.0;
      break;
    }
    case '一线蓝领': {
      baseRaise = 0.0216;
      capMultiplier = 2.5;
      break;
    }
    default:
      baseRaise = 0.0288;
      capMultiplier = 3.0;
  }

  // 综合涨薪率
  const totalRaise = baseRaise * skillBonus * faithBonus * ageMult * depressionMult * mbtiGrowthMult;
  let newSalary = state.currentMonthlySalary * (1 + totalRaise);
  const cap = initialRealSalary * capMultiplier;
  const wasCapped = newSalary > cap;
  newSalary = Math.round(Math.min(newSalary, cap));
  const totalDelta = newSalary - state.currentMonthlySalary;

  // 分解各因素贡献（按乘法分解为加法近似）
  // 按顺序应用各因子，记录每个因子带来的增量
  let runningSalary = state.currentMonthlySalary;
  // 1. 基础普调
  const afterBase = state.currentMonthlySalary * (1 + baseRaise);
  const baseDelta = Math.round(afterBase - runningSalary);
  runningSalary = afterBase;

  // 2. 技能加成（在基础上额外增加）
  const skillContribution = baseRaise * (skillBonus - 1);
  const afterSkill = state.currentMonthlySalary * (1 + baseRaise + skillContribution);
  const skillDelta = Math.round(afterSkill - runningSalary);
  runningSalary = afterSkill;

  // 3. 年龄乘数
  const ageContribution = (baseRaise + skillContribution) * (ageMult - 1);
  const afterAge = state.currentMonthlySalary * (1 + baseRaise + skillContribution + ageContribution);
  const ageDelta = Math.round(afterAge - runningSalary);
  runningSalary = afterAge;

  // 4. 经济周期
  const prevRaise = baseRaise + skillContribution + ageContribution;
  const cycleContribution = prevRaise * (depressionMult - 1);
  const afterCycle = state.currentMonthlySalary * (1 + prevRaise + cycleContribution);
  const cycleDelta = Math.round(afterCycle - runningSalary);
  runningSalary = afterCycle;

  // 5. 信念+MBTI+随机波动（合并为"其他"小额项）
  const otherDelta = totalDelta - baseDelta - skillDelta - ageDelta - cycleDelta;

  // 生成明细条目（只记录金额绝对值>=1元的项）
  if (Math.abs(baseDelta) >= 1) {
    let label = '年度普调';
    let note = '';
    if (state.currentProfession === '体制内') {
      note = '工资按工龄和级别正常递进';
    } else if (state.currentProfession === '红利行业' && state.currentAge < 35) {
      label = '行业红利';
      note = '行业高速增长，薪资随之上调';
    } else if (state.currentProfession === '红利行业' && state.currentAge > 35) {
      note = '行业进入平稳期，薪资小幅调整';
    } else if (state.currentProfession === '传统私企') {
      note = '公司年度调薪';
    } else if (state.currentProfession === '自由职业') {
      if (baseRaise > 0.08) {
        label = '接单丰收';
        note = '今年客户多、项目顺，收入明显增长';
      } else if (baseRaise < -0.05) {
        label = '接单困难';
        note = '今年客源减少，收入有所下降';
      } else {
        label = '自由职业';
        note = '收入随市场波动，不上不下';
      }
    } else if (state.currentProfession === '实体创业') {
      note = '店铺经营平稳，利润小幅波动';
    } else if (state.currentProfession === '一线蓝领') {
      note = '手艺精进，工资稳步上涨';
    }
    breakdown.push({ source: label, amount: baseDelta, note });
  }

  if (Math.abs(skillDelta) >= 1) {
    breakdown.push({ source: '技能提升', amount: skillDelta, note: '专业技能提升带来的额外涨薪' });
  }

  if (Math.abs(ageDelta) >= 1) {
    if (ageMult > 1.0) {
      breakdown.push({ source: '黄金年龄', amount: ageDelta, note: '正值职业黄金期，经验和精力俱佳，升职加薪' });
    } else if (ageMult < 1.0) {
      breakdown.push({ source: '年龄瓶颈', amount: ageDelta, note: '年龄增长，职场竞争力下降，涨薪停滞' });
    }
  }

  if (Math.abs(cycleDelta) >= 1) {
    if (depressionMult < 1.0) {
      breakdown.push({ source: '经济萧条', amount: cycleDelta, note: '经济下行，公司冻薪或减半涨薪幅度' });
    }
  }

  if (Math.abs(otherDelta) >= 1) {
    if (faithBonus > 1.0 && otherDelta > 0) {
      breakdown.push({ source: '信念回报', amount: otherDelta, note: '对赛道的坚持和信念带来了正向回报' });
    }
    // MBTI微调等小额项不单独列出，避免信息噪音
  }

  if (wasCapped) {
    const capDelta = newSalary - Math.round(state.currentMonthlySalary * (1 + totalRaise));
    if (capDelta < 0) {
      breakdown.push({ source: '薪资触顶', amount: capDelta, note: '已达到当前职业的薪资天花板' });
    }
  }

  // ========== 年度职场意外（v12新增：让财务曲线有真实起伏）==========
  // 非体制内职业每年有概率遇到职场意外事件——好的坏的都有
  // 模拟真实人生中：跳槽、被挖角、公司变动、行业黑天鹅等
  if (!state.isAllInPath && state.currentProfession !== '体制内' && !state.isUnemployed) {
    const surpriseRoll = Math.random();
    let surpriseLabel = '';
    let surpriseNote = '';
    let surpriseRate = 0; // 薪资变化比例（正=涨，负=降）

    if (surpriseRoll < 0.08) {
      // 8%：被挖角/跳槽大涨薪
      surpriseRate = 0.15 + Math.random() * 0.15; // +15%~+30%
      surpriseLabel = '跳槽涨薪';
      surpriseNote = '猎头挖你去竞品公司，开出了一个你无法拒绝的价码';
    } else if (surpriseRoll < 0.16) {
      // 8%：升职/内部晋升
      surpriseRate = 0.08 + Math.random() * 0.08; // +8%~+16%
      surpriseLabel = '升职加薪';
      surpriseNote = '你被提拔到了更高的岗位，薪资水涨船高';
    } else if (surpriseRoll < 0.22) {
      // 6%：公司发了大额年终奖/项目奖金
      surpriseRate = 0.05 + Math.random() * 0.08; // +5%~+13%
      surpriseLabel = '意外奖金';
      surpriseNote = '今年公司效益特别好，发了一大笔奖金，相当于涨了月薪';
    } else if (surpriseRoll < 0.30) {
      // 8%：公司效益不好，降薪
      surpriseRate = -0.05 - Math.random() * 0.10; // -5%~-15%
      surpriseLabel = '效益下滑';
      surpriseNote = '公司今年效益不好，全员降薪，你也没能幸免';
    } else if (surpriseRoll < 0.35) {
      // 5%：被边缘化/调岗
      surpriseRate = -0.10 - Math.random() * 0.10; // -10%~-20%
      surpriseLabel = '明升暗降';
      surpriseNote = '公司调整架构，你被调到了一个不重要的岗位，薪资降了一截';
    } else if (surpriseRoll < 0.38 && state.currentAge >= 35) {
      // 3%（35岁以上才触发）：职场歧视/大龄优化
      surpriseRate = -0.15 - Math.random() * 0.15; // -15%~-30%
      surpriseLabel = '年龄危机';
      surpriseNote = '公司在优化"性价比低"的老员工，你要么接受降薪，要么走人';
    }
    // 其余62-65%：没有意外，正常上班

    if (surpriseRate !== 0) {
      const beforeSurprise = newSalary;
      newSalary = Math.round(newSalary * (1 + surpriseRate));
      // 注意：意外涨薪不受封顶限制（跳槽/升职可以突破天花板）
      // 但意外降薪也不受底部保护
      const surpriseDelta = newSalary - beforeSurprise;
      if (Math.abs(surpriseDelta) >= 1) {
        breakdown.push({ source: surpriseLabel, amount: surpriseDelta, note: surpriseNote });
      }
    }
  }

  state.currentMonthlySalary = newSalary;
  return breakdown;
}

/**
 * 年度薪资涨幅封顶：防止事件涨薪+年度涨薪+成就涨薪叠加导致单年暴涨
 * 在commitYear中所有薪资变化都完成后调用
 * 打工阶段单年涨幅不超过25%（除非All In等特殊状态转换）
 */
export function clampAnnualSalaryGrowth(state: GameState, salaryAtStartOfYear: number): void {
  if (state.isUnemployed || salaryAtStartOfYear <= 0) return;
  
  // All In当年允许大幅变动（职业转换），但之后按正常逻辑
  // 打工阶段：单年涨幅封顶25%（真实人生中除非升职/跳槽，否则很难超过）
  const maxGrowthRate = state.isAllInPath ? 0.5 : 0.25; // All In后允许50%（客户增长快）
  const maxSalary = Math.round(salaryAtStartOfYear * (1 + maxGrowthRate));
  
  // 降薪不封顶（降职/裁员/行业危机可以大幅降薪）
  if (state.currentMonthlySalary > maxSalary) {
    state.currentMonthlySalary = maxSalary;
  }
}

// 获取基础裁员率（v2平衡：体制内也有极小裁员风险，不再绝对安全）
export function getBaseLayoffRate(profession: Profession, age: number): number {
  switch (profession) {
    case '体制内': return age >= 50 ? 0.01 : 0.003; // 极小概率：50岁前0.3%，50岁后1%（机构改革风险）
    case '红利行业': return age >= 35 ? 0.18 : 0.07; // v4：35岁后18%（从22%降低，避免破产率过高）
    case '传统私企': return age >= 40 ? 0.12 : 0.05; // 40岁后12%（从15%略降）
    case '自由职业': return 0;
    case '实体创业': return 0;
    case '一线蓝领': return 0.025; // v9从4%降到2.5%，技术工人岗位相对稳定
    default: return 0.05;
  }
}

// ========== 核心年度结算（严格按设计书第三章四步公式）==========
export function calculateYearlySettlement(state: GameState): YearResult {
  const result: YearResult = {
    age: state.currentAge,
    salaryIncome: 0,
    sideHustleIncome: 0,
    passiveIncome: state.passiveIncome,
    investmentGain: 0,
    bankGain: 0,
    fundGain: 0,
    specGain: 0,
    fixedDepositGain: 0,
    stockGain: 0,
    goldGain: 0,
    chainHoldingsGain: 0,
    bioPortfolioGain: 0,
    shopRentIncome: 0,
    shopValueChange: 0,
    livingCost: 0,
    mortgageCost: 0,
    insuranceCost: 0,
    netChange: 0,
    events: [],
    cardLogs: [],
    dailyEvents: [],
    relationshipChanges: [],
    stressChange: 0,
    happinessChange: 0,
    healthChange: 0,
    cardCost: 0,
    blackSwanLoss: 0,
    blackSwanEventNames: [],
    blindBoxFinancialChange: 0,
    dailyEventFinancialChange: 0,
    echoFinancialChange: 0,
    pensionIncome: 0,
    retireIncome: 0,
    naturalStressChange: 0,
    naturalHappinessChange: 0,
    naturalHealthChange: 0,
    wellbeingChanges: [],
    // 车房年度开销
    carCost: 0,
    carDepreciation: 0,
    propertyMaintenanceCost: 0,
    propertyChange: 0,
    actualSavingsChange: 0,
  };

  // 生物年龄偏移量（统一声明，多处使用）
  const bioAgeOffset = (state as any).biologicalAge || 0;

  // ========== 步骤1：地缘套利与大后方通胀判定 ==========
  let baseCost = state.annualBaseCost;
  if (state.isGeoArbitrage) {
    baseCost = state.annualBaseCost * 0.6;
  }
  
  const cityConfig = CITY_CONFIGS[state.currentCity];
  let actualCost = baseCost * cityConfig.costMultiplier;
  
  // 蓝领45岁+身体劳损（v9从5%降到3%，配合涨薪增强不至于过难）
  if (state.currentProfession === '一线蓝领' && state.currentAge >= 45) {
    actualCost = actualCost * 1.03;
  }
  
  // 后遗症开销加成
  if (state.pendingAftermath) {
    if (state.pendingAftermath.type === '健康警示') actualCost *= 1.15;
    else if (state.pendingAftermath.type === '心理阴影') actualCost *= 1.10;
    else if (state.pendingAftermath.type === '情感创伤') actualCost *= 1.08;
    else if (state.pendingAftermath.type === '认知干扰') actualCost *= 1.12;
    else if (state.pendingAftermath.type === '医疗纠纷') actualCost *= 1.10;
  }
  
  result.livingCost = Math.round(actualCost);

  // 子女年度开销加入 livingCost
  const childCost = state.children.reduce((sum, c) => sum + c.monthlyExpense * 12, 0);
  result.livingCost += childCost;

  // 赡养父母费用（v5新增：中国家庭的重要支出）
  // 35岁前：偶尔孝敬，年均2k-5k
  // 35-45岁：父母渐老，年均5k-12k（医疗+生活费）
  // 45-55岁：父母高龄，年均12k-25k（医疗+护理）
  // 55岁+：平稳或减少（父母可能离世）
  let parentSupportCost = 0;
  if (state.currentAge >= 28 && state.currentAge < 35) {
    parentSupportCost = 2000 + Math.floor(Math.random() * 3000);
  } else if (state.currentAge >= 35 && state.currentAge < 45) {
    parentSupportCost = 5000 + Math.floor(Math.random() * 8000);
  } else if (state.currentAge >= 45 && state.currentAge < 55) {
    parentSupportCost = 12000 + Math.floor(Math.random() * 15000);
  } else if (state.currentAge >= 55) {
    parentSupportCost = 5000 + Math.floor(Math.random() * 5000);
  }
  result.livingCost += parentSupportCost;
  
  // 健康值影响：如果health < 30，增加5%医疗开销
  if (state.health < 30) {
    const medicalExtra = Math.round(result.livingCost * 0.05);
    result.livingCost += medicalExtra;
  }
  // 生物年龄影响：比实际年龄老5岁以上增加抗衰/医疗支出，年轻5岁以上减少基础医疗开销
  if (bioAgeOffset >= 5) {
    const antiAgingCost = Math.round(result.livingCost * 0.08); // 老得快：抗衰治疗、保健品额外支出
    result.livingCost += antiAgingCost;
  } else if (bioAgeOffset <= -10) {
    result.livingCost = Math.round(result.livingCost * 0.92); // 非常年轻：少生病，医疗支出减少8%
  } else if (bioAgeOffset <= -5) {
    result.livingCost = Math.round(result.livingCost * 0.96); // 较年轻：医疗支出略减4%
  }
  
  // ========== 常理生活开销：家庭结构系数（替代"赚得多必须花得多"的消费升级） ==========
  // 生活开销由"城市基本盘 + 家庭结构"决定，不随收入比例强制升降。
  // 赚得多不一定花得多——高品质消费是玩家的主动选择（买房/买车/旅行/培养孩子），
  // 而非被收入自动绑架的生活水准。这才符合普通人的常理。
  // 家庭结构系数只作用于"基础生活成本"部分，子女/赡养/房贷等独立核算不重复放大：
  //   - 已婚/有伴侣：双人生活开销上升（吃饭、居住、生活用品）
  //   - 与父母同住：省下一份房租/居住成本
  const baseLivingCost = result.livingCost - childCost - parentSupportCost;
  let familyMult = 1.0;
  if (state.isMarried && state.partner && !state.partner.hasDivorced) {
    familyMult = 1.25;       // 双人生活
  }
  if (state.parents && state.parents.isAlive && state.parents.livingWithPlayer) {
    familyMult *= 0.85;      // 与父母同住省房钱
  }
  result.livingCost = Math.round(baseLivingCost * familyMult) + childCost + parentSupportCost;

  // 通胀复利：3%（生活成本随年代自然上涨，但只跟时间走，不跟收入走）
  state.annualBaseCost = Math.round(state.annualBaseCost * 1.03);

  // ========== 保护逻辑：All In/有公司/自雇职业的玩家不能被设为失业（自己当老板/没有固定雇主）==========
  // 任何事件如果错误地将这些玩家设为失业，在此纠正
  // 注意：'实体创业' 不在此列表中——它有自己的破产机制（连续两年负债20万以上可倒闭失业）
  const isSelfEmployed = state.isAllInPath || state.hasCompany ||
    state.currentProfession === '自由职业' || state.currentProfession === '数字游民';
  if (isSelfEmployed && state.isUnemployed) {
    state.isUnemployed = false;
    // 如果薪资被清零，恢复到失业前水平或使用保底
    if (state.currentMonthlySalary === 0 && state.preUnemployedSalary) {
      state.currentMonthlySalary = state.preUnemployedSalary;
    }
  }

  // ========== v12平衡：失业期间自动勒紧裤腰带，生活成本缩减25% ==========
  // 真实情况下，人失业后会削减非必要开支（少外卖、少社交、取消订阅等）
  // 自雇职业（已被上面的保护逻辑纠正）不会走到这里
  if (state.isUnemployed) {
    result.livingCost = Math.round(result.livingCost * 0.75);
  }

  // ========== 连续失业年数追踪（totalUnemployedYears 在工资计算段处理）==========
  if (state.isUnemployed) {
    state.unemployedTurns += 1;
  } else {
    state.unemployedTurns = 0;
  }

  // ========== 步骤2：动态房贷记录（不再直接扣减存款，由netChange统一处理）==========
  if (state.mortgageRemainingYears > 0) {
    result.mortgageCost = state.currentMortgageCost;
    // 注意：不再直接修改 state.currentSavings，房贷支出通过 totalExpense 计入 netChange
    state.mortgageRemainingYears -= 1;
    if (state.mortgageRemainingYears <= 0) {
      state.currentMortgageCost = 0;
    }
  }

  // ========== 车辆年度开销与折旧 ==========
  if (state.hasCar && state.carAge >= 0) {
    // 车龄+1
    state.carAge += 1;

    const carType = (state as any).carType || '中级车'; // 兼容旧存档默认中级车

    // 车型系数：豪车开销是经济车的2.5倍，中级车1.5倍
    const carMultiplier = carType === '豪车' ? 2.5 : carType === '中级车' ? 1.5 : 1.0;

    // 城市差异的停车费
    const parkingFee = Math.round((state.currentCity === '资本修罗场' ? 6000 :
                       state.currentCity === '中坚大后方' ? 3000 : 1500) * carMultiplier);

    // 油费/充电费（按城市通勤距离+车型油耗）
    const fuelCost = Math.round((state.currentCity === '资本修罗场' ? 8000 :
                     state.currentCity === '中坚大后方' ? 5000 : 3000) * carMultiplier);

    // 车险（新车高，老车低；豪车保费翻倍）
    const baseInsurance = carType === '豪车' ? 8000 : carType === '中级车' ? 5000 : 3500;
    const insurance = Math.max(baseInsurance * 0.5, baseInsurance - state.carAge * (baseInsurance * 0.05));

    // 保养（新车便宜，老车贵；豪车保养费更高）
    const baseMaintenance = carType === '豪车' ? 6000 : carType === '中级车' ? 3000 : 1500;
    const maintenance = state.carAge <= 2 ? baseMaintenance :
                       state.carAge <= 5 ? baseMaintenance * 1.5 :
                       state.carAge <= 8 ? baseMaintenance * 2.0 : baseMaintenance * 2.5;

    state.annualCarCost = parkingFee + fuelCost + insurance + maintenance;
    result.carCost = state.annualCarCost;

    // 车辆折旧（豪车贬值更快）
    const prevCarValue = state.carValue;
    let depreciationRate: number;
    if (carType === '豪车') {
      depreciationRate = state.carAge <= 2 ? 0.20 : state.carAge <= 5 ? 0.12 : 0.07;
    } else {
      depreciationRate = state.carAge <= 3 ? 0.15 : state.carAge <= 7 ? 0.10 : 0.05;
    }
    state.carValue = Math.round(state.carValue * (1 - depreciationRate));
    state.carValue = Math.max(carType === '豪车' ? 20000 : 5000, state.carValue);
    result.carDepreciation = state.carValue - prevCarValue; // 负数表示贬值

    // 豪车的身心影响
    if (carType === '豪车') {
      if (state.isUnemployed) {
        // 失业养豪车压力极大
        state.stress = Math.min(100, state.stress + 5);
      } else {
        state.happiness = Math.min(100, state.happiness + 1);
      }
    }
  }

  // ========== 房产年度开销（物业费+维修基金）==========
  if (state.hasProperty) {
    const baseMaintenance = state.currentCity === '资本修罗场' ? 6000 :
                            state.currentCity === '中坚大后方' ? 3000 : 1200;
    state.annualPropertyMaintenance = baseMaintenance + Math.floor(Math.random() * 1000); // 随机维修
    result.propertyMaintenanceCost = state.annualPropertyMaintenance;
  }

  // ========== 房产动态估值（经济周期影响）==========
  if (state.hasProperty && state.propertyValue > 0) {
    const cycle = state.economicCycle; // 0=繁荣, 1=平稳, 2=萧条
    let appreciationRate: number;
    if (cycle === 0) {
      appreciationRate = 1.02 + Math.random() * 0.06; // +2%~+8%
    } else if (cycle === 1) {
      appreciationRate = 0.99 + Math.random() * 0.03; // -1%~+2%
    } else {
      appreciationRate = 0.92 + Math.random() * 0.05; // -8%~-3%
    }

    // 城市差异：一线城市波动大，低洼地波动小
    if (state.currentCity === '资本修罗场') {
      appreciationRate += 0.02; // 一线城市涨更多跌也多
    } else if (state.currentCity === '避风低洼地') {
      appreciationRate = Math.max(0.95, appreciationRate); // 低洼地不会跌太多
    }

    const oldPropertyValue = state.propertyValue;
    state.propertyValue = Math.round(state.propertyValue * appreciationRate);

    // 记录房产变化
    if (state.propertyValue !== oldPropertyValue) {
      result.propertyChange = state.propertyValue - oldPropertyValue;
    }
  }

  // ========== 步骤3：存款分布理财收益计算 ==========
  const savings = state.currentSavings;
  // 投资市场年景（概率化，替代复利递减公式）
  // 真实人生：存款越大越容易进入"平稳年"(收益范围收窄、求稳)，但没有硬上限——
  // 仍保留小概率"大牛/黑天鹅年"(收益范围放大)，大资金在牛市照赚，这就是现实中大资金也能一直挣钱的通道。
  // 年景分布：
  //   - 大年 ~6%：×1.6（收益范围放大，牛市/黑天鹅普涨）
  //   - 平稳年(概率随存款上升)：×0.3（收益范围收窄，大资金求稳）
  //   - 正常年：×1.0（全额波动）
  let investRegime = 1.0;
  let flatProb = 0.12;
  if (savings > 100000000) flatProb = 0.5;
  else if (savings > 30000000) flatProb = 0.38;
  else if (savings > 10000000) flatProb = 0.28;
  else if (savings > 5000000) flatProb = 0.2;
  const regimeRoll = Math.random();
  if (regimeRoll < 0.06) investRegime = 1.6;      // 大牛/黑天鹅年
  else if (regimeRoll < 0.06 + flatProb) investRegime = 0.3; // 平稳年

  // 1. 余额宝（活期）收益 - 1.35%固定（v13平衡：理财收益↓）
  result.bankGain = Math.round(savings * (state.bankDepositPct / 100) * 0.0135);

  // 2. 定期存款收益 - 2.7%固定（v13平衡：理财收益↓）
  result.fixedDepositGain = Math.round(savings * (state.fixedDepositPct / 100) * 0.027);

  // 3. 指数基金收益 - 年化-9%~+18%（v13平衡：理财收益↓10%）
  const fundReturnRate = (-0.09 + Math.random() * 0.27) * investRegime;
  result.fundGain = Math.round(savings * (state.indexFundPct / 100) * fundReturnRate);

  // 4. 股票收益 - 年化-27%~+36%（v13平衡：理财收益↓10%）
  // 生物赌徒的生科投资通过 bioPortfolioGain 独立计算，不走 stockGain（避免双重计算）
  const stockReturnRate = (-0.27 + Math.random() * 0.63) * investRegime;
  if (state.retirementPath === 'bio_gambler') {
    result.stockGain = 0; // 生科投资收益走 bioPortfolioGain
  } else {
    result.stockGain = Math.round(savings * (state.stockPct / 100) * stockReturnRate);
  }

  // 5. 黄金收益 - v13平衡：理财收益↓10%
  let goldReturnRate: number;
  if (state.economicCycle === 0) { // 繁荣
    goldReturnRate = (-0.018 + Math.random() * 0.036) * investRegime; // -1.8%~+1.8%
  } else if (state.economicCycle === 2) { // 萧条
    goldReturnRate = (0.072 + Math.random() * 0.126) * investRegime; // +7.2%~+19.8%
  } else { // 平稳
    goldReturnRate = Math.random() * 0.036 * investRegime; // 0%~+3.6%
  }
  result.goldGain = Math.round(savings * (state.goldPct / 100) * goldReturnRate);

  // 6. 比特币/投机收益 - 年化-72%~+180%（v13平衡：理财收益↓10%）
  // 链上原住民的加密资产通过 chainHoldingsGain 独立计算，不走 specGain（避免双重计算）
  const btcReturnRate = (-0.72 + Math.random() * 2.52) * investRegime;
  if (state.retirementPath === 'chain_native') {
    result.specGain = 0; // 加密资产收益走 chainHoldingsGain
  } else {
    result.specGain = Math.round(savings * (state.speculationPct / 100) * btcReturnRate);
  }

  // 6.5 链上持仓年度市值波动（独立于存款分布的 speculationPct）
  // chainHoldings 是链上原住民路径的独立资产，每年随加密市场波动
  // v11校准：收益率基于真实加密市场年化特征，而非把4年周期收益压缩到1年
  // 比特币历史年化：典型年-50%~+150%，极端牛市(2021)+400%，归零风险真实存在
  // 注意：如果玩家已放弃链上投资（hasAbandonedCrypto），不再计算持仓波动
  const chainHoldings = (state as any).chainHoldings || 0;
  // 链上原住民路径已由 applyAnnualChainGrowth 单独执行年度自然增长，此处跳过，避免同一年双重计算回报
  if (chainHoldings > 0 && !(state as any).hasAbandonedCrypto && state.retirementPath !== 'chain_native') {
    const roll = Math.random();
    let chainReturnRate: number;

    // 信念软性护栏：pathFaith 越高，越懂风险控制，归零/深熊概率越低。
    // 此前固定 5% 归零概率，25 年内约 72% 的链上玩家至少遭遇一次总归零，是胜率仅 3.5% 的主因。
    // 信念 40 时归零概率降至 3%，信念 80 时仅 1%。
    const crashProb = Math.max(0.01, 0.05 - state.pathFaith * 0.0005);
    if (roll < crashProb) {
      // 归零或接近归零（交易所跑路 / 杠杆爆仓 / 项目 rug pull / 监管打击）
      // 不再是 -100% 彻底清零，而是 -90%：留一寸生机，玩家仍可煎熬回本或转向，避免"一局报废"
      chainReturnRate = -0.9;
    } else if (roll < 0.25) {
      // 22% 概率：深熊 -50% ~ -20%
      chainReturnRate = -0.5 + Math.random() * 0.3;
    } else if (roll < 0.65) {
      // 40% 概率：横盘/小跌 -20% ~ +15%（真实加密市场多数年份并不普涨）
      chainReturnRate = -0.2 + Math.random() * 0.35;
    } else if (roll < 0.85) {
      // 20% 概率：小牛 +15% ~ +60%
      chainReturnRate = 0.15 + Math.random() * 0.45;
    } else if (roll < 0.97) {
      // 12% 概率：大牛 +60% ~ +120%
      chainReturnRate = 0.6 + Math.random() * 0.6;
    } else {
      // 3% 概率：极端行情 +120% ~ +180%（罕见的年度神话，取代此前最高+400%）
      chainReturnRate = 1.2 + Math.random() * 0.6;
    }

    // 经济周期修正：繁荣年整体偏多，萧条年偏空
    if (state.economicCycle === 0) chainReturnRate += 0.15;
    else if (state.economicCycle === 2) {
      chainReturnRate -= 0.2;
      if (Math.random() < 0.03) chainReturnRate = -0.9; // 萧条期额外3%接近归零风险
    }

    // 下限 -90%
    chainReturnRate = Math.max(-0.9, chainReturnRate);

    // 规模递减效应：持仓越大，正向收益率的边际效果越小
    // 模拟真实市场：小资金可以灵活翻几倍，大资金体量本身就是收益率的敌人
    if (chainReturnRate > 0) {
      const dampFactor = getChainScaleDampeningFactor(chainHoldings, 1 + chainReturnRate);
      chainReturnRate *= dampFactor;
    }

    const beforeHoldings = chainHoldings;
    const afterHoldings = Math.max(0, Math.round(beforeHoldings * (1 + chainReturnRate)));
    result.chainHoldingsGain = afterHoldings - beforeHoldings;
    (state as any).chainHoldings = afterHoldings;
  }

  // 6.6 生物科技投资组合年度市值波动
  const bioPortfolio = (state as any).bioPortfolio || 0;
  if (bioPortfolio > 0) {
    // 生科投资波动：-25%~+40%，长期年化期望约8%（符合生物科技ETF历史收益特征）
    // 繁荣期+10%偏移（融资容易、IPO窗口开放），萧条期-10%偏移（资本寒冬）
    let bioReturnRate = -0.25 + Math.random() * 0.65;  // 基础：-25%~+40%
    if (state.economicCycle === 0) bioReturnRate += 0.10;
    else if (state.economicCycle === 2) bioReturnRate -= 0.10;
    // 生物年龄越小于实际年龄，说明你对生科前沿越了解，投资决策越准确，减少极端亏损概率
    const bioAge = (state as any).biologicalAge || 0;
    if (bioAge < -5) {
      // 生物年龄比实际小5岁以上：投资判断有信息优势，亏损时减少50%损失
      bioReturnRate = bioReturnRate < 0 ? bioReturnRate * 0.5 : bioReturnRate * 1.1;
    }
    // 规模递减效应：持仓越大，正向收益率的边际效果越小（与链上对称）
    if (bioReturnRate > 0) {
      const dampBio = getBioScaleDampeningFactor(bioPortfolio, 1 + bioReturnRate);
      bioReturnRate *= dampBio;
    }
    const beforeBio = bioPortfolio;
    const afterBio = Math.max(0, Math.round(beforeBio * (1 + bioReturnRate)));
    result.bioPortfolioGain = afterBio - beforeBio;
    (state as any).bioPortfolio = afterBio;
  }

  // 总投资收益（仅包含存款分布渠道收益；chainHoldings/bioPortfolio 是独立资产，
  // 其市值波动已直接更新 state，不再计入 investmentGain 以避免双重计算）
  result.investmentGain = result.bankGain + result.fixedDepositGain + result.fundGain + result.stockGain + result.goldGain + result.specGain;

  // 商铺租金
  result.shopRentIncome = state.shopMonthlyRent * 12;

  // 商铺市值随经济周期波动
  if (state.hasShop && state.shopValue > 0) {
    const shopCycleFactor = state.economicCycle === 0 ? 1.05 : state.economicCycle === 2 ? 0.92 : 1.0;
    const shopChange = Math.round(state.shopValue * (shopCycleFactor - 1));
    result.shopValueChange = shopChange;
    state.shopValue = Math.max(0, Math.round(state.shopValue * shopCycleFactor));
  }

  // ========== 步骤4：工资合并与资产总账更新 ==========
  if (state.isUnemployed) {
    result.salaryIncome = 0;
    state.totalUnemployedYears += 1;
  } else {
    state.totalYearsWorked += 1;
    if (state.currentProfession === '实体创业') {
      // 实体创业过山车公式（写实版）：
      // 基础波动：60%~180%（最差年景也有保底，不会亏到负数）
      // 声誉越高越稳定：reputation/100 作为"稳定因子"，收窄波动
      // 萧条期：整体收益×0.7（需求萎缩），但不会归零
      const biz = (state as any).silverBusiness || { reputation: 20, clients: 0 };
      const stabilityFactor = Math.min(1, biz.reputation / 100); // 0~1，声誉越高越接近1
      // 基础随机因子在 0.6~2.0 之间，声誉高时收窄到 0.8~1.5
      const minFactor = 0.6 + stabilityFactor * 0.2;  // 0.6→0.8
      const maxFactor = 2.0 - stabilityFactor * 0.5;  // 2.0→1.5
      let randomFactor = randomRange(minFactor, maxFactor);
      if (state.economicCycle === 2) {
        // 萧条期：整体需求萎缩，收益打7折
        randomFactor = randomFactor * 0.7;
      }
      // 保底：年收入不低于月薪×6（半年工资作为基本运营保底）
      const minYearlyIncome = state.currentMonthlySalary * 6;
      result.salaryIncome = Math.max(minYearlyIncome, Math.round(state.currentMonthlySalary * 12 * randomFactor));
    } else {
      result.salaryIncome = state.currentMonthlySalary * 12;
    }
  }

  // 商业养老金：55岁起每年30000
  let pensionIncome = 0;
  if (state.hasCommercialPension && state.currentAge >= 55) {
    pensionIncome = 30000;
  }
  result.pensionIncome = pensionIncome;

  // 体制内60岁退休福利（v2平衡：不再免一切开销，而是大幅降低生活成本）
  let retireIncome = 0;
  if (state.currentProfession === '体制内' && state.currentAge >= 60) {
    retireIncome = Math.round(state.currentMonthlySalary * 12 * 0.6); // 退休金60%
    result.livingCost = Math.round(result.livingCost * 0.3); // 退休后生活成本降至30%（医保+福利），而非全免
  }
  result.retireIncome = retireIncome;

  // 幸福影响：如果happiness > 70，工作效率bonus（salaryIncome * 1.05）
  if (state.happiness > 70 && result.salaryIncome > 0) {
    const happinessBonus = Math.round(result.salaryIncome * 0.05);
    result.salaryIncome += happinessBonus;
  }

  // All In后被动收入随经验自然增长（分路径复利），代表全职投入后的规模效应
  if (state.isAllInPath && state.retirementPath) {
    // 不同路径被动收入复利不同：依赖团队/粉丝/产品的路径复利更高
    const growthRate: Record<string, number> = {
      ai_symbiote: 1.08,     // AI产品：SaaS/模型复利（8%）
      digital_nomad: 1.08,  // 远程团队：全球客户扩张（8%）
      super_ip: 1.08,       // 内容IP：粉丝复利（8%）
      chain_native: 1.06,   // 链上：持仓有独立波动，被动收入6%
      silver_economy: 1.06, // 银发：月营收有独立增长，被动收入6%
      bio_gambler: 1.06,    // 生物赌徒：投资组合有独立增长，被动收入6%
    };
    const baseRate = growthRate[state.retirementPath] || 1.06;

    // 被动收入自然复利（移除"平台期/停滞年"压制）
    // 真实人生：踏实经营的人，收入会随积累持续增长，不必人为设置"越高越停滞"。
    // 保留"突破年"惊喜（破圈/融资/放大），让偶尔一飞冲天成为合情合理的高光时刻。
    // 年景分布：
    //   - 突破年 ~8%：+25%~+60%（破圈/融资/放大，是"赚到惊喜"的通道）
    //   - 正常年：按路径基础复利全额增长
    const yearRoll = Math.random();
    let rate: number;
    if (yearRoll < 0.08) {
      rate = 1.25 + Math.random() * 0.35; // 突破年：+25%~+60%
    } else {
      rate = baseRate; // 正常年：全额复利
    }
    state.passiveIncome = Math.round(state.passiveIncome * rate);
    // 生物赌徒：投资组合随研究深入和行业发展增长
    if (state.retirementPath === 'bio_gambler') {
      const bioPort = (state as any).bioPortfolio || 0;
      // All In后全职研究：每年复利增长（16%，反映行业增长+个人研究优势+临床进展）
      // All In前：8%趋势增长 + 每月工资的8%定投加仓
      // 规模递减：持仓越大，行业增长率的边际效果越小（避免复利无界爆炸，靠算法自然收敛峰值）
      let growthMultiplier = state.isAllInPath ? 1.16 : 1.08;
      if (growthMultiplier > 1) {
        const dampBio = getBioScaleDampeningFactor(bioPort, growthMultiplier);
        growthMultiplier = Math.max(1.0, 1.0 + (growthMultiplier - 1.0) * dampBio);
      }
      const grown = Math.round(bioPort * growthMultiplier);
      // All In前：每年从工资中拿8%加仓（工资定投生科股）
      // All In后：每年至少追加1.2万新投资（来自咨询/科普的再投入）
      let minNewInvestment = state.isAllInPath ? 12000 : 0;
      if (!state.isAllInPath && !state.isUnemployed && state.currentMonthlySalary > 0) {
        minNewInvestment = Math.round(state.currentMonthlySalary * 12 * 0.08);
      }
      (state as any).bioPortfolio = Math.max(grown, bioPort + minNewInvestment);
    }
    // 链上原住民：持仓随加密市场长期趋势增长（每年+4%长期趋势，短期波动已在上面计算）
    if (state.retirementPath === 'chain_native') {
      const holdings = (state as any).chainHoldings || 0;
      // 长期趋势增长也受规模递减约束：大体量的4%年化不现实
      let trendRate = 0.04;
      if (holdings > 500000000) trendRate = 0.008;      // 5亿以上：0.8%
      else if (holdings > 100000000) trendRate = 0.012; // 1-5亿：1.2%
      else if (holdings > 20000000) trendRate = 0.02;   // 2000万-1亿：2%
      else if (holdings > 5000000) trendRate = 0.03;    // 500-2000万：3%
      let grown = Math.round(holdings * (1 + trendRate));
      // All In前：每年从工资中拿5%定投加仓（工资定投，囤币）
      if (!state.isAllInPath && !state.isUnemployed && state.currentMonthlySalary > 0) {
        const dca = Math.round(state.currentMonthlySalary * 12 * 0.05);
        grown += dca;
      }
      (state as any).chainHoldings = grown;
    }
    // 银发守夜人：月营收随口碑增长（每年+8%，服务业口碑复利）
    if (state.retirementPath === 'silver_economy') {
      const rev = (state as any).silverMonthlyRevenue || 0;
      const newRev = Math.round(rev * 1.08);
      (state as any).silverMonthlyRevenue = newRev;
      const biz = (state as any).silverBusiness;
      if (biz) biz.monthlyRevenue = newRev;
    }
  }

  // 被动收入包含商铺租金
  const totalPassiveIncome = state.passiveIncome + result.shopRentIncome;
  result.passiveIncome = totalPassiveIncome;

  // 保险支出（体制内60岁退休免保费）
  if (state.currentProfession === '体制内' && state.currentAge >= 60) {
    result.insuranceCost = 0;
  } else {
    // 保费随年龄递增（现实中重疾险保费随年龄陡增）
    let insPremium = state.insurancePremium;
    if (state.isInsured) {
      if (state.currentAge >= 56) insPremium = Math.round(insPremium * 4);
      else if (state.currentAge >= 46) insPremium = Math.round(insPremium * 2.5);
      else if (state.currentAge >= 36) insPremium = Math.round(insPremium * 1.5);
    }
    result.insuranceCost = state.isInsured ? Math.round(insPremium) : 0;
    if (state.hasCommercialPension) {
      result.insuranceCost += 10000;
    }
  }

  // === 副业收入（All In 前，由剧情事件在年内累积，年终结算） ===
  // MBTI人格机制（提前声明，供后续压力/幸福修正使用）
  const mbtiMech = getActiveMBTIMechanics(state);
  const sideHustleIncome = state.currentYearSideHustle || 0;
  result.sideHustleIncome = sideHustleIncome;
  if (sideHustleIncome > 0) {
    state.lifetimeSideHustle += sideHustleIncome;
  }

  // 计算净变化（房贷已计入 totalExpense，不再单独扣减）
  const totalIncome = result.salaryIncome + sideHustleIncome + totalPassiveIncome + pensionIncome + retireIncome + result.investmentGain;
  const totalExpense = result.livingCost + result.insuranceCost + result.mortgageCost + (result.carCost || 0) + (result.propertyMaintenanceCost || 0);
  result.netChange = totalIncome - totalExpense;
  
  state.currentSavings += result.netChange;
  
  // 实体创业破产判定（v2平衡：连续两年负债20万以上才触发，从10万提高）
  // hasCompany 的公司化运营（AI工作室/区块链公司等）同样适用破产判定
  if ((state.currentProfession === '实体创业' || state.hasCompany === true) && state.currentSavings < -200000) {
    state.unemployedTurns += 1;
    if (state.unemployedTurns >= 2) {
      state.isUnemployed = true;
      state.preUnemployedSalary = state.currentMonthlySalary;
      state.currentMonthlySalary = 0;
      state.unemployedTurns = 0;
      state.hasCompany = false;
      result.events.push(`第${state.currentAge}岁，你的创业梦碎了一地，员工遣散，办公室退租。你对着空荡荡的工位喝了一罐啤酒，然后删掉了那个叫"创始人"的头衔。`);
    }
  }

  // ========== 身心状态年度自然波动（v11 平衡版） ==========
  // 设计理念（v11 - 彻底消除"正反馈死亡螺旋"，高压区恢复力反而更强）：
  // - 年龄加压：22-50 +1（适应期/责任期），51-60 0（知天命），61+ -2（释怀）
  // - 高压时恢复力大幅提高（求生反弹机制）：
  //   <50: 恢复4 → 净减3（压力自然消散）
  //   50-70: 恢复5 → 净减4（中等压力加速恢复）
  //   70-85: 恢复7 → 净减6（高压区，身体进入应激恢复模式）
  //   85-95: 恢复9 → 净减8（危险区，强制大幅恢复）
  //   95+: 恢复12 → 净减11（极限区，emergency shutdown级别的恢复）
  // - 健康伤害：-1/-1/-1/-1（最高-4/年，阈值70/82/92/98）
  // - 连续2年压力100触发"崩溃重置"：安全阀机制
  const preNaturalStress = state.stress;
  const preNaturalHappiness = state.happiness;
  const preNaturalHealth = state.health;

  // 年龄加压（v10校准：22-28岁不再额外加压，统一+1，防止前期压力螺旋）
  let ageStressAdd = 1; // 默认+1
  if (state.currentAge >= 51 && state.currentAge <= 60) ageStressAdd = 0; // 知天命
  else if (state.currentAge >= 61) ageStressAdd = -2; // 退休后压力释放

  // 基础恢复力（v12校准：自然恢复统一收敛到 game.store 的 v12 机制，此处不再恢复）
  // 修复说明：旧 v11 在此处应用强恢复（4-12），而 game.store 的 v12 自然恢复
  // 又在同一年再次削弱性恢复（0-2），两套机制叠加导致压力几乎无法堆积，
  // 崩溃机制形同虚设。此处将压力恢复收敛到 game.store 的唯一自然恢复来源，
  // 本函数只保留年龄加压（ageStressAdd）与事件/角色状态带来的压力变化。
  const stressRecovery = 0;
  state.stress = Math.min(100, Math.max(0, state.stress + ageStressAdd - stressRecovery));
  if (state.hasSideHustle && (state as any).sideHustleStress) {
    state.stress = Math.min(100, state.stress + (state as any).sideHustleStress);
  }

  // MBTI人格压力修正（NT理性者抗压/SP艺术者释压等）
  if (mbtiMech) {
    state.stress = Math.min(100, Math.max(0, state.stress + mbtiMech.stressModifier));
  }

  // 高压力的健康代价（v10校准：第一档阈值从>65提高到>70，减少中压区健康损耗）
  if (state.stress > 70) {
    state.health = Math.max(0, state.health - 1);
  }
  if (state.stress > 82) {
    state.health = Math.max(0, state.health - 1);
  }
  if (state.stress > 92) {
    state.health = Math.max(0, state.health - 1);
  }
  if (state.stress > 98) {
    state.health = Math.max(0, state.health - 1);
  }

  // 幸福：有伴侣+3，有子女+2，失业-5，高薪+2，低存款-2
  if (state.isMarried && state.partner && !state.partner.hasDivorced) {
    state.happiness = Math.min(100, state.happiness + 3);
  }
  if (state.hasChild && state.children.length > 0) {
    state.happiness = Math.min(100, state.happiness + 2);
  }
  if (state.isUnemployed) {
    state.happiness = Math.max(0, state.happiness - 5);
  }
  if (state.currentMonthlySalary >= 20000) {
    state.happiness = Math.min(100, state.happiness + 2);
  }
  if (state.currentSavings < 50000) {
    state.happiness = Math.max(0, state.happiness - 2);
  }

  // MBTI人格幸福修正（SP艺术者更快乐/NT理性者更内省等）
  if (mbtiMech) {
    state.happiness = Math.min(100, Math.max(0, state.happiness + mbtiMech.happinessModifier));
  }

  // 健康：40岁以上每年衰减（v10校准：从38推迟到40，减缓第一档衰减速度）
  // 40-49(bioAdjusted): 约1.0/年（0和1交替，更缓慢的前期衰老）
  // 50-59(bioAdjusted): 约2.0/年（1和2交替）
  // 60+(bioAdjusted): 约3.0/年（2和3交替）
  // 生物年龄偏移整体平移衰老节奏
  const bioAdjustedAge = state.currentAge + bioAgeOffset;
  if (bioAdjustedAge >= 40 || state.currentAge >= 47) {
    let baseDecay: number;
    if (bioAdjustedAge <= 49) {
      baseDecay = Math.random() < 0.5 ? 0 : 1; // 平均1.0
    } else if (bioAdjustedAge <= 59) {
      baseDecay = Math.random() < 0.5 ? 1 : 2; // 平均2.0
    } else {
      baseDecay = Math.random() < 0.5 ? 2 : 3; // 平均3.0
    }
    state.health = Math.max(0, state.health - baseDecay);
  }
  // 保险：有保险的人健康意识略好，20%概率体检发现小问题早处理+1（v9从30%降低）
  if (state.isInsured && Math.random() < 0.2) {
    state.health = Math.min(100, state.health + 1);
  }

  // 车房对身心状态的影响
  if (state.hasProperty) state.happiness = Math.min(100, state.happiness + 1); // 安居感
  if (state.hasCar) {
    if (state.isUnemployed) state.stress = Math.min(100, state.stress + 2); // 失业养车压力大
    else state.stress = Math.max(0, state.stress - 1); // 通勤便利
  }

  // 记录自然漂移的 delta
  result.naturalStressChange = state.stress - preNaturalStress;
  result.naturalHappinessChange = state.happiness - preNaturalHappiness;
  result.naturalHealthChange = state.health - preNaturalHealth;

  // ========== All In 后数据同步 ==========
  // 银发路径All In后：实体创业月薪=实际营收，事件调整biz.monthlyRevenue后需同步currentMonthlySalary
  if (state.isAllInPath && state.currentProfession === '实体创业') {
    const biz = (state as any).silverBusiness;
    if (biz && biz.monthlyRevenue > 0) {
      // 月薪取月度营收，但有保底（不低于careerStartSalary的60%）
      const floor = Math.round(state.careerStartSalary * 0.6);
      state.currentMonthlySalary = Math.max(floor, Math.round(biz.monthlyRevenue));
    }
  }
  // 数字游牧民All In后：地理套利的副业收入变化同步到月薪
  if (state.isAllInPath && state.retirementPath === 'digital_nomad' && state.isGeoArbitrage) {
    // 月薪基于副业收入×1.2（全职效率加成），v13提高系数与getPathSideIncome一致
    const nomadSideIncome = Math.round(
      (state.pathSkills?.remoteSkill || 0) * 60 +
      (state.pathSkills?.languageSkill || 0) * 35 +
      (state.pathSkills?.crossCulturalSkill || 0) * 25 + 1000
    );
    state.currentMonthlySalary = Math.max(Math.round(state.careerStartSalary * 0.7), Math.round(nomadSideIncome * 1.2));
  }

  // 防御式兜底：确保独立资产不会因任何边界情况变为负数
  if ((state as any).bioPortfolio !== undefined && (state as any).bioPortfolio < 0) {
    (state as any).bioPortfolio = 0;
  }
  if ((state as any).chainHoldings !== undefined && (state as any).chainHoldings < 0) {
    (state as any).chainHoldings = 0;
  }
  // 复利上限：改用规模递减算法自然收敛峰值，不再设硬性持仓上限
  // （链上/生物各自在年度波动与趋势增长处已应用 getChainScaleDampeningFactor / getBioScaleDampeningFactor）

  return result;
}

// 切换城市
export function switchCity(state: GameState, newCity: CityType): void {
  const oldConfig = CITY_CONFIGS[state.currentCity];
  const newConfig = CITY_CONFIGS[newCity];
  
  // 数字游牧民 All In 后为远程工作者：收入锚定在发达市场，不随当地薪资水平波动，
  // 搬家只改变生活成本，不降薪（修复黑箱测试 P2"薪资跳变不连贯"：避免远程收入被城市系数打折）
  const isRemoteWorker = state.retirementPath === 'digital_nomad' && state.isAllInPath;
  if (!isRemoteWorker) {
    // 按城市薪资水平比例折算月薪：搬家意味着你进入了新城市的就业市场
    const salaryRatio = newConfig.salaryMultiplier / oldConfig.salaryMultiplier;
    if (state.currentMonthlySalary > 0) {
      state.currentMonthlySalary = Math.round(state.currentMonthlySalary * salaryRatio);
    }
    // careerStartSalary（薪资上限的计算基准）也按同比例调整，
    // 保证搬家后薪资天花板随市场水平移动，不会出现"搬去大城市立刻碰顶"或"搬去小城市永远涨不上去"
    if (state.careerStartSalary > 0) {
      state.careerStartSalary = Math.round(state.careerStartSalary * salaryRatio);
    }
  }
  
  state.currentCity = newCity;
  
  // 地理套利判定：低成本城市自动启用
  state.isGeoArbitrage = (newCity === '避风低洼地' || newCity === '海外低成本');
}

// 判定结局（纳入身心状态综合评定）
/**
 * 计算总财富（纳入所有资产）
 * 被动收入资本化：用"被动收入 × 倍数"估算其可持续折现价值。
 * 原值 20 倍 + 被动收入自身复利形成双向膨胀，导致后期总财富虚高、人人达标。
 * 调低该倍数更贴近真实：被动收入流本身会波动/触顶，不应按 20 倍永续折现。
 * 该值为可配置项，便于校准脚本测试不同组合。
 */
export let passiveIncomeCapMult = 12;

/** 供校准脚本动态调整被动收入资本化倍数（ESM 导入绑定只读，需走 setter） */
export function setPassiveIncomeCapMult(v: number): void {
  passiveIncomeCapMult = v;
}

/**
 * 链上持仓年度市场自然增长（"链上洼地"修复核心）
 * 此前链上持仓只靠叙事事件驱动、无年度自然增值，导致持仓长期无法积累，
 * 成功率远低于其他路径（30% vs 60-97%）。
 * 真实加密市场：长期向上但波动巨大。这里给链上持仓一个年度自然增值，
 * 用牛熊概率分布模拟波动，靠规模递减（getChainScaleDampeningFactor）防止大资金无限复利，
 * 亏损不衰减（保持高风险风味），但长期期望为正、具备可达成性。
 */
export let chainAnnualGrowthBase = 0.18;

export function setChainAnnualGrowthBase(v: number): void {
  chainAnnualGrowthBase = v;
}

export function applyAnnualChainGrowth(state: GameState): number {
  const holdings = (state as any).chainHoldings || 0;
  if (holdings <= 0) return 0;
  const roll = Math.random();
  let growth: number;
  if (roll < 0.25) growth = chainAnnualGrowthBase + Math.random() * 0.3;          // 牛市 +10%~+40%
  else if (roll < 0.55) growth = chainAnnualGrowthBase * 0.5 + Math.random() * 0.1; // 温和上涨
  else if (roll < 0.75) growth = 0;                                               // 横盘
  else if (roll < 0.90) growth = -(0.06 + Math.random() * 0.14);                  // 回调 -6%~-20%
  else growth = -(0.2 + Math.random() * 0.2);                                     // 深熊 -20%~-40%
  const damp = getChainScaleDampeningFactor(holdings, 1 + growth);
  const effectiveGrowth = growth * damp;
  const newHoldings = Math.max(0, Math.round(holdings * (1 + effectiveGrowth)));
  (state as any).chainHoldings = newHoldings;
  return newHoldings - holdings;
}

/**
 * 百分比制投资卡辅助：按玩家当前存款的一定比例计算"投入"与"年化被动回报"。
 *
 * 解决"选=没选"：固定金额（如投5000）在存款百万级时毫无感知。
 * 改成按存款比例投入，回报也成正比，任何财富档位下选择都有明确数值反馈。
 *
 * @param investPct    投资额占当前存款的比例（如 0.05 = 投入存款的5%）
 * @param annualReturn 年化被动回报率（相对投入额，如 0.08 = 投入的8%/年）
 * @param minInvest    最低投入额（防止存款极低时投入过小，象征性保底）
 * @param maxInvest    最高投入额（防止存款爆炸时投入过大，防溢出）
 * @returns 一对 dynamic fn，分别用于 savingsChangeFn / passiveIncomeChangeFn
 */
export function pctInvestment(
  investPct: number,
  annualReturn: number,
  minInvest = 5000,
  maxInvest = 5000000,
): { investFn: (s: GameState) => number; returnFn: (s: GameState) => number } {
  const investFn = (s: GameState) => {
    const base = Math.max(0, s.currentSavings || 0);
    const invest = Math.round(base * investPct);
    // 投入额不超过当前存款，避免低存款时 minInvest 保底导致负资产
    return Math.min(base, Math.max(minInvest, Math.min(maxInvest, invest)));
  };
  const returnFn = (s: GameState) => {
    const invest = investFn(s);
    return Math.max(0, Math.round(invest * annualReturn));
  };
  return { investFn, returnFn };
}

export function calculateTotalWealth(state: GameState): number {
  const chainHoldingsValue = (state as any).chainHoldings || 0;
  const bioPortfolioValue = (state as any).bioPortfolio || 0;
  const shopValue = state.shopValue || 0;
  const passiveIncomeCapitalized = state.passiveIncome * passiveIncomeCapMult;
  return state.currentSavings + state.propertyValue + chainHoldingsValue + bioPortfolioValue + shopValue + passiveIncomeCapitalized;
}

/**
 * 财务自由判定（按常理，而非硬性的"目标资产"门槛）
 *
 * 真实人生里，一个人退休不必攒够一个天价的预设数字——只要满足任一：
 *   1. 被动收入 >= 年生活开销（被动收入自己覆盖生活，钱自己转）
 *   2. 可变现净资产 >= 年生活开销 × 20（4%法则：存款够吃二十年）
 *
 * 这样，"暴富/套现/被动收入暴涨"这些剧情波澜会直接点亮提前退休的资格，
 * 而不是被人为卡死在"必须攒够500万"这一条线上。退休时机由剧情自然决定，
 * 玩家可能 35 岁、40 岁、50 岁随时财务自由——这就是惊喜与不确定性。
 */
export function isFinanciallyFree(state: GameState): boolean {
  const annualExpense = Math.max(12000, (state.annualBaseCost || 0) + (state.currentMortgageCost || 0));
  // 被动收入覆盖年开销：被动且可持续，货币自己转
  const passiveCovers = (state.passiveIncome || 0) >= annualExpense;
  // 可变现净资产够吃 20 年（4%法则），含现金/房产/链上/生物/店铺
  const liquidCovers = calculateLiquidWealth(state) >= annualExpense * 20;
  return passiveCovers || liquidCovers;
}

/**
 * 判断玩家是否已满足退休条件（财富达标 或 财务自由）
 * 满足后 UI 会显示"退休"按钮供玩家选择
 */
/**
 * 玩家自愿退休时，根据当前状态返回最佳结局ID
 */
export function getVoluntaryRetirementEnding(state: GameState): string {
  const totalWealth = calculateTotalWealth(state);
  const wealthMet = totalWealth >= state.targetWealth;
  const finFree = isFinanciallyFree(state);
  // 常理退休：达成硬性目标 或 财务自由（被动覆盖 / 存款够吃20年）
  const qualified = wealthMet || finFree;

  // 路径结局：走对应路径 + (达成目标 或 财务自由) + 路径事业真正走通 → 该路径成功结局
  // 修复说明：此前"攒够钱"就直接给 path_success，导致 checkSuccess（如银发营收判定）
  // 形同虚设。现在路径成功 = 财务达标(qualified) && checkSuccess(路径事业走通)。
  if (qualified && state.retirementPath) {
    const path = getPath(state.retirementPath);
    if (path && path.checkSuccess(state)) {
      return `path_success_${state.retirementPath}`;
    }
  }

  // 达成退休资格的各种结局
  if (qualified) {
    // E1 传奇自由人：财富充足 + 幸福>=70 + 健康>=60 + 无伴侣
    if (!state.isMarried && state.happiness >= 70 && state.health >= 60) return 'E1';
    // E2 温馨港湾：财富充足 + 幸福>=50 + 健康>=40 + 有伴侣有孩子
    if (state.isMarried && state.hasChild && state.happiness >= 50 && state.health >= 40) return 'E2';
    // E5 极简行者：财富充足 + 极简 + 幸福>=40
    if (state.usedMinimalism && state.annualBaseCost < 30000 * 0.6 && state.happiness >= 40) return 'E5';
    // E3 平凡微光：财富充足 + 幸福>=30
    if (state.happiness >= 30) return 'E3';
    // 财富充足但身心状态较差，仍归为E3
    return 'E3';
  }

  // E6 创业者之歌
  if (state.currentProfession === '实体创业' && state.currentSavings >= state.careerStartSalary * 12 * 20) return 'E6';

  // E7 体制内银发：60岁 + 体制内 + 幸福>=40
  if (state.currentProfession === '体制内' && state.currentAge >= 60 && state.happiness >= 40) return 'E7';

  // 如果财富没达标但玩家选择退休，给一个普通结局
  const decentLife = state.health >= 30 || state.happiness >= 40 || (state.hasProperty && state.isMarried);
  if (decentLife) return 'E9';
  return 'E4';
}

/**
 * 计算可变现净资产（现金 + 房产 + 链上持仓 + 生物组合 + 店铺）
 * 用于破产判定：链上持仓等资产可覆盖负债，不应只看现金
 */
export function calculateLiquidWealth(state: GameState): number {
  return (state.currentSavings || 0)
    + (state.propertyValue || 0)
    + ((state as any).chainHoldings || 0)
    + ((state as any).bioPortfolio || 0)
    + (state.shopValue || 0);
}

export function checkEnding(state: GameState): string | null {
  if (state.endingTriggered) return state.currentEndingId;

  // 60岁为硬上限：年满60岁强制结局
  const reachedHardCap = state.currentAge >= state.targetAge; // targetAge = 60
  // 破产判定：看可变现净资产（含链上持仓等资产），负债30万以上且资产无法覆盖才破产
  const bankrupt = calculateLiquidWealth(state) < -300000;

  // 严重负债随时触发破产结局
  if (bankrupt) return 'E8';

  const totalWealth = calculateTotalWealth(state);
  const wealthMet = totalWealth >= state.targetWealth;
  const qualified = wealthMet || isFinanciallyFree(state);

  // 60岁硬上限：无论是否达标都强制结局
  if (reachedHardCap) {
    // 到达60岁：走对应路径 + (达成目标 或 财务自由) + 路径事业走通 → 该路径成功结局
    // 修复说明：与 getVoluntaryRetirementEnding 口径一致，路径成功需 checkSuccess 判定。
    if (qualified && state.retirementPath) {
      const path = getPath(state.retirementPath);
      if (path && path.checkSuccess(state)) {
        return `path_success_${state.retirementPath}`;
      }
    }
    if (qualified) {
      if (!state.isMarried && state.happiness >= 70 && state.health >= 60) return 'E1';
      if (state.isMarried && state.hasChild && state.happiness >= 50 && state.health >= 40) return 'E2';
      if (state.usedMinimalism && state.annualBaseCost < 30000 * 0.6 && state.happiness >= 40) return 'E5';
      if (state.happiness >= 30) return 'E3';
      return 'E3';
    }
    if (state.currentProfession === '实体创业' &&
        state.currentSavings >= state.careerStartSalary * 12 * 20) return 'E6';
    // E7 体制内银发：60岁 + 体制内 + 幸福>=40
    if (state.currentProfession === '体制内' && state.happiness >= 40) return 'E7';

    // 60岁未达标——判定人生质量
    // E4 中道崩殂：真正悲惨
    const trulyTragic = (state.totalUnemployedYears > 5 && state.hadCriticalIllness && !state.isInsured) ||
                        state.health < 20;
    if (trulyTragic) return 'E4';

    // E9 浮生半日闲：平凡人生
    const decentLife = state.health >= 30 || state.happiness >= 40 ||
                       (state.hasProperty && state.isMarried);
    if (decentLife) return 'E9';

    // 达到目标40%以上也算B级结局
    if (totalWealth >= state.targetWealth * 0.4) return 'E9';

    return 'E4';
  }

  // 还没到路径退休年龄：只检查破产和重病
  // E4 中道崩殂：没到退休年龄但健康濒死
  if (state.health < 20) return 'E4';
  return null;
}

/**
 * 检查是否处于"延期退休"阶段
 * 即已到达路径目标退休年龄但尚未满足退休条件（未成功），还没到60岁
 */
export function isDelayedRetirementPhase(state: GameState): boolean {
  if (state.endingTriggered) return false;
  if (state.currentAge >= state.targetAge) return false; // 已到60岁，会被强制结局
  if (!state.retirementPath) return false;
  const path = getPath(state.retirementPath);
  if (!path) return false;
  if (state.currentAge < path.targetRetireAge) return false;
  // 到达路径退休年龄但尚未攒够（未达成目标 且 未财务自由）→ 延期退休阶段
  const totalWealth = calculateTotalWealth(state);
  if (totalWealth >= state.targetWealth || isFinanciallyFree(state)) return false;
  return true;
}
