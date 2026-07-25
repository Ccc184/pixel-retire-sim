import type { GameState, CityType, Profession, CityConfig, YearResult } from '../types/global.d.js';
import { getPathSideIncome, getPath } from '../data/retirement-paths.js';
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

// ========== 年度调薪逻辑（重新设计：更像真实人生）==========
//
// 设计原则：
// 1. 技能驱动涨薪——pathSkills越高，涨薪幅度越大（技能变现）
// 2. 职业天花板大幅提高——允许真正的"崛起"
// 3. 萧条年只是减缓涨薪，不是完全冻结
// 4. 路径信念高的人有额外涨薪加成（创业精神/内驱力）
// 5. 30-45岁是黄金涨薪期，之后逐渐放缓但不会停止
export function applySalaryRaise(state: GameState): void {
  const initialRealSalary = state.careerStartSalary;
  if (initialRealSalary <= 0) return;

  // === All In 后的涨薪逻辑：技能驱动，不走职业等级体系 ===
  if (state.isAllInPath) {
    const pathSkills = state.pathSkills || {};
    const maxSkill = Math.max(0, ...Object.values(pathSkills));
    // 每年根据技能成长涨薪：每100点技能带来5%涨薪，上限30%
    const skillGrowthRate = Math.min(maxSkill / 1000 * 0.05, 0.3);
    const faithBonus = state.pathFaith > 70 ? 1.05 : 1.0;
    const depressionMult = state.economicCycle === 2 ? 0.5 : 1.0;
    const totalRaise = skillGrowthRate * faithBonus * depressionMult;
    // All In 后上限放宽：初始薪资×10（自由职业/创业天花板高）
    const cap = initialRealSalary * 10;
    const newSalary = state.currentMonthlySalary * (1 + totalRaise);
    state.currentMonthlySalary = Math.round(Math.min(newSalary, cap));
    return;
  }

  // 技能加成：取路径技能最高值，每10点技能带来1%额外涨薪
  const pathSkills = state.pathSkills || {};
  const maxSkill = Math.max(0, ...Object.values(pathSkills));
  const skillBonus = 1 + Math.min(maxSkill / 1000, 0.3); // 最多+30%

  // 信念加成：信念>70时额外+5%涨薪
  const faithBonus = state.pathFaith > 70 ? 1.05 : 1.0;

  // MBTI人格×职业涨薪微调（2-5%，不改变平衡只增加人格感）
  const mbtiProfMod = getMBTIProfessionModifier((state as any).mbtiType, state.currentProfession);
  const mbtiGrowthMult = mbtiProfMod.salaryGrowthMultiplier;

  // 年龄乘数：30-45黄金期×1.2，45-55×1.0，55+×0.8
  const ageMult = state.currentAge >= 30 && state.currentAge <= 45 ? 1.2
    : state.currentAge >= 46 && state.currentAge <= 55 ? 1.0
    : 0.8;

  // 萧条修正：涨薪幅度减半（而不是完全冻结）
  const depressionMult = state.economicCycle === 2 ? 0.5 : 1.0;

  // 基础年涨幅
  let baseRaise: number;
  let capMultiplier: number;

  switch (state.currentProfession) {
    case '体制内': {
      baseRaise = 0.03;
      capMultiplier = 2.5; // v2平衡：上限2.5倍（从3.0降低，安全但不会暴富）
      break;
    }
    case '红利行业': {
      if (state.currentAge < 35) {
        baseRaise = 0.10;
        capMultiplier = 4.5;
      } else if (state.currentAge === 35) {
        // 35岁断崖：乘0.7（v4从0.65调回0.7，避免破产率过高）
        state.currentMonthlySalary = Math.round(state.currentMonthlySalary * 0.7);
        baseRaise = 0.03;
        capMultiplier = 3.5;
      } else {
        baseRaise = 0.03;
        capMultiplier = 3.5;
      }
      break;
    }
    case '传统私企': {
      baseRaise = 0.05; // v2：年涨5%（从6%略降）
      capMultiplier = 3.0; // 上限3.0倍（从3.5降低）
      break;
    }
    case '自由职业': {
      // v9校准：上限3.2，波动微负偏(-14%~+13%)，降低暴富概率同时保留上升空间
      const rand = randomRange(-0.14, 0.13); // 坏年景更差，好年景略好，但整体期望微正
      baseRaise = 0.015 + rand;
      capMultiplier = 3.2;
      break;
    }
    case '实体创业': {
      baseRaise = 0.02;
      capMultiplier = 6.0;
      break;
    }
    case '一线蓝领': {
      baseRaise = 0.03; // v9从2.5%提升到3%，技术工人凭手艺涨薪
      capMultiplier = 2.5; // v9从2.3提升到2.5，高级蓝领也能有体面收入
      break;
    }
    default:
      baseRaise = 0.04;
      capMultiplier = 3.0;
  }

  // 综合涨薪率（含MBTI人格×职业微调）
  const totalRaise = baseRaise * skillBonus * faithBonus * ageMult * depressionMult * mbtiGrowthMult;
  const newSalary = state.currentMonthlySalary * (1 + totalRaise);
  const cap = initialRealSalary * capMultiplier;

  state.currentMonthlySalary = Math.round(Math.min(newSalary, cap));
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
  
  // 通胀复利：3%（v5从2.5%提升：真实通胀+消费升级，长期理财必须跑赢通胀）
  state.annualBaseCost = state.annualBaseCost * 1.03;

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

  // 1. 余额宝（活期）收益 - 1.5%固定
  result.bankGain = Math.round(savings * (state.bankDepositPct / 100) * 0.015);

  // 2. 定期存款收益 - 3%固定
  result.fixedDepositGain = Math.round(savings * (state.fixedDepositPct / 100) * 0.03);

  // 3. 指数基金收益 - 年化-10%~+20%
  const fundReturnRate = -0.1 + Math.random() * 0.3;
  result.fundGain = Math.round(savings * (state.indexFundPct / 100) * fundReturnRate);

  // 4. 股票收益 - 年化-30%~+40%
  // 生物赌徒的生科投资通过 bioPortfolioGain 独立计算，不走 stockGain（避免双重计算）
  const stockReturnRate = -0.3 + Math.random() * 0.7;
  if (state.retirementPath === 'bio_gambler') {
    result.stockGain = 0; // 生科投资收益走 bioPortfolioGain
  } else {
    result.stockGain = Math.round(savings * (state.stockPct / 100) * stockReturnRate);
  }

  // 5. 黄金收益 - 通胀年+8%，萧条年+15%，平稳年0~2%
  let goldReturnRate: number;
  if (state.economicCycle === 0) { // 繁荣
    goldReturnRate = -0.02 + Math.random() * 0.04; // -2%~+2%
  } else if (state.economicCycle === 2) { // 萧条
    goldReturnRate = 0.08 + Math.random() * 0.14; // +8%~+22%
  } else { // 平稳
    goldReturnRate = Math.random() * 0.04; // 0%~+4%
  }
  result.goldGain = Math.round(savings * (state.goldPct / 100) * goldReturnRate);

  // 6. 比特币/投机收益 - 年化-80%~+200%（极端波动）
  // 链上原住民的加密资产通过 chainHoldingsGain 独立计算，不走 specGain（避免双重计算）
  const btcReturnRate = -0.8 + Math.random() * 2.8;
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
  if (chainHoldings > 0 && !(state as any).hasAbandonedCrypto) {
    const roll = Math.random();
    let chainReturnRate: number;

    if (roll < 0.03) {
      // 3% 概率：归零或接近归零（交易所跑路 / 杠杆爆仓 / 项目 rug pull）
      // v12校准：从8%降到3%，真实归零是低概率事件，过高会让链上路径不可玩
      chainReturnRate = -1.0;
    } else if (roll < 0.21) {
      // 18% 概率：熊市深跌 -60% ~ -25%（v12从-70%~-30%调温和）
      chainReturnRate = -0.6 + Math.random() * 0.35;
    } else if (roll < 0.68) {
      // 38% 概率：常态波动 -30% ~ +60%（多数年份的真实样子）
      chainReturnRate = -0.3 + Math.random() * 0.9;
    } else if (roll < 0.88) {
      // 20% 概率：牛市上涨 +60% ~ +200%（约2-3年一次的级别）
      chainReturnRate = 0.6 + Math.random() * 1.4;
    } else if (roll < 0.97) {
      // 9% 概率：大牛市 +200% ~ +500%（周期顶点级别，约4年一次）
      chainReturnRate = 2.0 + Math.random() * 3.0;
    } else {
      // 3% 概率：极端行情 +500% ~ +1000%（极小概率的年度神话）
      chainReturnRate = 5.0 + Math.random() * 5.0;
    }

    // 经济周期修正：繁荣年整体偏多，萧条年偏空，且提升归零概率
    if (state.economicCycle === 0) chainReturnRate += 0.2;  // 繁荣年偏多
    else if (state.economicCycle === 2) chainReturnRate -= 0.3; // 萧条年偏空更深

    // 下限 -100%（不能跌成负数）
    chainReturnRate = Math.max(-1.0, chainReturnRate);

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

  // 被动收入包含商铺租金
  const totalPassiveIncome = state.passiveIncome + result.shopRentIncome;
  result.passiveIncome = totalPassiveIncome;

  // 保险支出（体制内60岁退休免保费）
  if (state.currentProfession === '体制内' && state.currentAge >= 60) {
    result.insuranceCost = 0;
  } else {
    result.insuranceCost = state.isInsured ? Math.round(state.insurancePremium) : 0;
    if (state.hasCommercialPension) {
      result.insuranceCost += 10000;
    }
  }

  // === 副业收入（All In 前的路径副业，按月计算） ===
  // MBTI人格机制（提前声明，供后续副业收入/压力/幸福修正使用）
  const mbtiMech = getActiveMBTIMechanics(state);
  let sideHustleIncome = getPathSideIncome(state) * 12;
  // MBTI人格副业收入修正（ENTJ/ENFP创业天赋/INTJ技术变现等）
  if (mbtiMech && sideHustleIncome > 0) {
    sideHustleIncome = Math.round(sideHustleIncome * mbtiMech.sideHustleMultiplier);
  }
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
  if (state.currentProfession === '实体创业' && state.currentSavings < -200000) {
    state.unemployedTurns += 1;
    if (state.unemployedTurns >= 2) {
      state.isUnemployed = true;
      state.preUnemployedSalary = state.currentMonthlySalary;
      state.currentMonthlySalary = 0;
      state.unemployedTurns = 0;
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

  // 基础恢复力（v11校准：高压区恢复力大幅提高，彻底消除死亡螺旋）
  // 设计逻辑：压力越高，身体的"求生反弹"越强——不是越难恢复，而是更努力地恢复
  // <50: 恢复4（低压力时不需要太多恢复）
  // 50-70: 恢复5（中压区开始加速恢复）
  // 70-85: 恢复7（高压区，身体进入应激恢复模式）
  // 85-95: 恢复9（危险区，强制大幅恢复）
  // 95+: 恢复12（极限区，emergency shutdown级别的恢复）
  let stressRecovery = 4;
  if (state.stress > 95) stressRecovery = 12;
  else if (state.stress > 85) stressRecovery = 9;
  else if (state.stress > 70) stressRecovery = 7;
  else if (state.stress > 50) stressRecovery = 5;

  state.stress = Math.min(100, Math.max(0, state.stress + ageStressAdd - stressRecovery));

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
      state.currentMonthlySalary = Math.max(floor, biz.monthlyRevenue);
    }
  }
  // 数字游牧民All In后：地理套利的副业收入变化同步到月薪
  if (state.isAllInPath && state.retirementPath === 'digital_nomad' && state.isGeoArbitrage) {
    // 月薪基于副业收入×1.2（全职效率加成）
    const nomadSideIncome = Math.round(
      (state.pathSkills?.remoteSkill || 0) * 50 +
      (state.pathSkills?.languageSkill || 0) * 30 +
      (state.pathSkills?.crossCulturalSkill || 0) * 20 + 800
    );
    state.currentMonthlySalary = Math.max(state.careerStartSalary * 0.7, Math.round(nomadSideIncome * 1.2));
  }

  return result;
}

// 切换城市
export function switchCity(state: GameState, newCity: CityType): void {
  const oldConfig = CITY_CONFIGS[state.currentCity];
  const newConfig = CITY_CONFIGS[newCity];
  
  // 按薪资比例折算
  if (state.currentMonthlySalary > 0) {
    state.currentMonthlySalary = Math.round(
      state.currentMonthlySalary * (newConfig.salaryMultiplier / oldConfig.salaryMultiplier)
    );
  }
  
  state.currentCity = newCity;
  
  if (newCity === '避风低洼地') {
    state.isGeoArbitrage = true;
  }
}

// 判定结局（纳入身心状态综合评定）
/**
 * 计算总财富（纳入所有资产）
 */
export function calculateTotalWealth(state: GameState): number {
  const chainHoldingsValue = (state as any).chainHoldings || 0;
  const bioPortfolioValue = (state as any).bioPortfolio || 0;
  const shopValue = state.shopValue || 0;
  const passiveIncomeCapitalized = state.passiveIncome * 20;
  return state.currentSavings + state.propertyValue + chainHoldingsValue + bioPortfolioValue + shopValue + passiveIncomeCapitalized;
}

/**
 * 判断玩家是否已满足退休条件（财富达标 或 路径成功）
 * 满足后 UI 会显示"退休"按钮供玩家选择
 */
export function checkCanRetire(state: GameState): boolean {
  if (state.endingTriggered) return false;
  const totalWealth = calculateTotalWealth(state);
  const wealthMet = totalWealth >= state.targetWealth;
  // 路径成功判定
  if (state.retirementPath) {
    const path = getPath(state.retirementPath);
    if (path && path.checkSuccess(state)) return true;
  }
  // 普通财富自由判定
  if (wealthMet) return true;
  // 实体创业特殊判定
  if (state.currentProfession === '实体创业' && state.currentSavings >= state.careerStartSalary * 12 * 20) return true;
  return false;
}

/**
 * 玩家自愿退休时，根据当前状态返回最佳结局ID
 */
export function getVoluntaryRetirementEnding(state: GameState): string {
  const totalWealth = calculateTotalWealth(state);
  const wealthMet = totalWealth >= state.targetWealth;

  // 路径成功结局
  if (state.retirementPath) {
    const path = getPath(state.retirementPath);
    if (path && path.checkSuccess(state)) {
      return `path_success_${state.retirementPath}`;
    }
  }

  // 财富达标的各种结局
  if (wealthMet) {
    // E1 传奇自由人：财富达标 + 幸福>=70 + 健康>=60 + 无伴侣
    if (!state.isMarried && state.happiness >= 70 && state.health >= 60) return 'E1';
    // E2 温馨港湾：财富达标 + 幸福>=50 + 健康>=40 + 有伴侣有孩子
    if (state.isMarried && state.hasChild && state.happiness >= 50 && state.health >= 40) return 'E2';
    // E5 极简行者：财富达标 + 极简 + 幸福>=40
    if (state.usedMinimalism && state.annualBaseCost < 30000 * 0.6 && state.happiness >= 40) return 'E5';
    // E3 平凡微光：财富达标 + 幸福>=30
    if (state.happiness >= 30) return 'E3';
    // 财富达标但身心状态较差，仍归为E3
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

export function checkEnding(state: GameState): string | null {
  if (state.endingTriggered) return state.currentEndingId;

  // 年满targetAge或严重负债
  const reachedAge = state.currentAge >= state.targetAge;
  const bankrupt = state.currentSavings < -500000; // v2平衡：负债50万以上才触发破产（从30万提高，给玩家更多缓冲）

  // 严重负债随时触发破产结局
  if (bankrupt) return 'E8';

  const totalWealth = calculateTotalWealth(state);
  const wealthMet = totalWealth >= state.targetWealth;

  // 到达退休年龄前：不自动触发财富结局，只检查破产和重病
  if (!reachedAge) {
    // E4 中道崩殂：没到退休年龄但健康濒死
    if (state.health < 20) return 'E4';
    return null;
  }

  // ========== 以下是退休年龄后的自动结局判定 ==========

  // E1 传奇自由人：财富达标 + 幸福>=70 + 健康>=60 + 无伴侣
  if (wealthMet && !state.isMarried && state.happiness >= 70 && state.health >= 60) return 'E1';

  // E2 温馨港湾：财富达标 + 幸福>=50 + 健康>=40 + 有伴侣有孩子
  if (wealthMet && state.isMarried && state.hasChild && state.happiness >= 50 && state.health >= 40) return 'E2';

  // E6 创业者之歌
  if (state.currentProfession === '实体创业' &&
      state.currentSavings >= state.careerStartSalary * 12 * 20) return 'E6';

  // E7 体制内银发：60岁 + 体制内 + 幸福>=40（不再只看钱）
  if (state.currentProfession === '体制内' && state.currentAge >= 60 && state.happiness >= 40) return 'E7';

  // E5 极简行者：财富达标 + 极简 + 幸福>=40
  if (wealthMet && state.usedMinimalism &&
      state.annualBaseCost < 30000 * 0.6 && state.happiness >= 40) return 'E5';

  // E3 平凡微光：财富达标 + 幸福>=30（身心状态一般也能达到）
  if (wealthMet && state.happiness >= 30) return 'E3';

  // 财富达标但身心状态较差，仍归为E3
  if (wealthMet) return 'E3';

  // 年满60但财富未达标——判定人生质量
  // E4 中道崩殂：真正悲惨——失业>5年+重病+无保险 或 健康<20濒死
  const trulyTragic = (state.totalUnemployedYears > 5 && state.hadCriticalIllness && !state.isInsured) ||
                      state.health < 20;
  if (trulyTragic) return 'E4';

  // E9 浮生半日闲：平凡人生——没大富大贵，但也没彻底垮掉
  // 条件：健康>=30 OR 幸福>=40 OR (有房有家庭)
  const decentLife = state.health >= 30 || state.happiness >= 40 ||
                     (state.hasProperty && state.isMarried);
  if (decentLife) return 'E9';

  // 介于两者之间：看总财富比例，达到目标40%以上也算B级结局
  if (totalWealth >= state.targetWealth * 0.4) return 'E9';

  // 真正的中道崩殂：没到退休年龄但触发了其他结局条件（如重病缠身）
  return 'E4';
}
