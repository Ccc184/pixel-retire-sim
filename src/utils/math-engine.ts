import type { GameState, CityType, Profession, CityConfig, YearResult } from '../types/global.d.js';

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
};

// 随机函数
export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// ========== 年度调薪逻辑（严格按设计书第四章）==========
export function applySalaryRaise(state: GameState): void {
  const initialRealSalary = state.careerStartSalary;
  
  // 全局萧条年修正：非体制内不涨薪
  if (state.economicCycle === 2 && state.currentProfession !== '体制内') {
    return;
  }

  switch (state.currentProfession) {
    case '体制内': {
      // 年涨3%，上限为初始月薪*2.5
      state.currentMonthlySalary = Math.min(
        state.currentMonthlySalary * 1.03,
        initialRealSalary * 2.5
      );
      break;
    }
    case '红利行业': {
      if (state.currentAge < 35) {
        // 35岁前年涨10%，上限初始*4.0
        state.currentMonthlySalary = Math.min(
          state.currentMonthlySalary * 1.10,
          initialRealSalary * 4.0
        );
      } else {
        // 35岁断崖：立即永久乘0.6，后续年涨1%
        // （断崖只触发一次，通过薪资已被打折后的自然增长模拟后续锁死）
        if (state.currentAge === 35) {
          state.currentMonthlySalary = state.currentMonthlySalary * 0.6;
        } else {
          state.currentMonthlySalary = state.currentMonthlySalary * 1.01;
        }
      }
      break;
    }
    case '传统私企': {
      // 年涨4%，上限初始*2.0
      state.currentMonthlySalary = Math.min(
        state.currentMonthlySalary * 1.04,
        initialRealSalary * 2.0
      );
      break;
    }
    case '自由职业': {
      // 1%基础涨薪 + [-0.2, +0.2]随机波动
      const rand = randomRange(-0.2, 0.2);
      state.currentMonthlySalary = state.currentMonthlySalary * 1.01 * (1 + rand);
      break;
    }
    case '实体创业': {
      // 基础年涨幅0%，收入在年度结算中通过randomFactor计算
      break;
    }
    case '一线蓝领': {
      // 年涨1%，上限初始*1.3
      state.currentMonthlySalary = Math.min(
        state.currentMonthlySalary * 1.01,
        initialRealSalary * 1.3
      );
      break;
    }
  }
  
  state.currentMonthlySalary = Math.round(state.currentMonthlySalary);
}

// 获取基础裁员率
export function getBaseLayoffRate(profession: Profession, age: number): number {
  switch (profession) {
    case '体制内': return 0;
    case '红利行业': return age >= 35 ? 0.25 : 0.08;
    case '传统私企': return age >= 40 ? 0.15 : 0.06;
    case '自由职业': return 0;
    case '实体创业': return 0;
    case '一线蓝领': return 0.04;
    default: return 0.05;
  }
}

// ========== 核心年度结算（严格按设计书第三章四步公式）==========
export function calculateYearlySettlement(state: GameState): YearResult {
  const result: YearResult = {
    age: state.currentAge,
    salaryIncome: 0,
    passiveIncome: state.passiveIncome,
    investmentGain: 0,
    bankGain: 0,
    fundGain: 0,
    specGain: 0,
    fixedDepositGain: 0,
    stockGain: 0,
    goldGain: 0,
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
    propertyMaintenanceCost: 0,
    propertyChange: 0,
    actualSavingsChange: 0,
  };

  // ========== 步骤1：地缘套利与大后方通胀判定 ==========
  let baseCost = state.annualBaseCost;
  if (state.isGeoArbitrage) {
    baseCost = state.annualBaseCost * 0.6;
  }
  
  const cityConfig = CITY_CONFIGS[state.currentCity];
  let actualCost = baseCost * cityConfig.costMultiplier;
  
  // 蓝领45岁+身体劳损
  if (state.currentProfession === '一线蓝领' && state.currentAge >= 45) {
    actualCost = actualCost * 1.05;
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
  
  // 健康值影响：如果health < 30，增加5%医疗开销
  if (state.health < 30) {
    const medicalExtra = Math.round(result.livingCost * 0.05);
    result.livingCost += medicalExtra;
  }
  
  // 通胀复利：1.8%（从2.5%下调，避免中后期开销增速远超工资涨幅）
  state.annualBaseCost = state.annualBaseCost * 1.018;

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
    let depreciationRate: number;
    if (carType === '豪车') {
      depreciationRate = state.carAge <= 2 ? 0.20 : state.carAge <= 5 ? 0.12 : 0.07;
    } else {
      depreciationRate = state.carAge <= 3 ? 0.15 : state.carAge <= 7 ? 0.10 : 0.05;
    }
    state.carValue = Math.round(state.carValue * (1 - depreciationRate));
    state.carValue = Math.max(carType === '豪车' ? 20000 : 5000, state.carValue);

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
  const stockReturnRate = -0.3 + Math.random() * 0.7;
  result.stockGain = Math.round(savings * (state.stockPct / 100) * stockReturnRate);

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
  const btcReturnRate = -0.8 + Math.random() * 2.8;
  result.specGain = Math.round(savings * (state.speculationPct / 100) * btcReturnRate);

  // 总投资收益
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
      // 实体创业专属过山车公式
      let randomFactor = randomRange(-0.8, 4.0);
      if (state.economicCycle === 2) {
        randomFactor = randomFactor * 0.3;
      }
      result.salaryIncome = Math.round(state.currentMonthlySalary * 12 * randomFactor);
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

  // 体制内60岁退休福利
  let retireIncome = 0;
  if (state.currentProfession === '体制内' && state.currentAge >= 60) {
    retireIncome = Math.round(state.currentMonthlySalary * 12 * 0.7);
    result.livingCost = 0; // 免疫一切基础开销
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

  // 计算净变化（房贷已计入 totalExpense，不再单独扣减）
  const totalIncome = result.salaryIncome + totalPassiveIncome + pensionIncome + retireIncome + result.investmentGain;
  const totalExpense = result.livingCost + result.insuranceCost + result.mortgageCost + (result.carCost || 0) + (result.propertyMaintenanceCost || 0);
  result.netChange = totalIncome - totalExpense;
  
  state.currentSavings += result.netChange;
  
  // 实体创业破产判定（连续两年负债10万以上才触发）
  if (state.currentProfession === '实体创业' && state.currentSavings < -100000) {
    state.unemployedTurns += 1;
    if (state.unemployedTurns >= 2) {
      state.isUnemployed = true;
      state.preUnemployedSalary = state.currentMonthlySalary;
      state.currentMonthlySalary = 0;
      state.unemployedTurns = 0;
      result.events.push(`第${state.currentAge}岁，你的创业梦碎了一地，员工遣散，办公室退租。你对着空荡荡的工位喝了一罐啤酒，然后删掉了那个叫"创始人"的头衔。`);
    }
  }

  // ========== 身心状态年度自然波动 ==========
  // 记录自然漂移前的值，用于计算 delta
  const preNaturalStress = state.stress;
  const preNaturalHappiness = state.happiness;
  const preNaturalHealth = state.health;

  // 压力：年轻(22-30)+1，中年(31-45)+1，老年(46+)-2；每年基础恢复-1（生活韧性）
  if (state.currentAge <= 45) {
    state.stress = Math.min(100, state.stress + 1);
  } else {
    state.stress = Math.max(0, state.stress - 2);
  }
  // 年度基础恢复：无论年龄，每年都会自然消化一点压力
  state.stress = Math.max(0, state.stress - 1);

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

  // 健康：45岁以上每年-1，有保险每年+1（体检意识），stress>70每年-2
  if (state.currentAge >= 45) {
    state.health = Math.max(0, state.health - 1);
  }
  if (state.isInsured) {
    state.health = Math.min(100, state.health + 1);
  }
  if (state.stress > 70) {
    state.health = Math.max(0, state.health - 2);
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
export function checkEnding(state: GameState): string | null {
  if (state.endingTriggered) return state.currentEndingId;
  
  // 年满targetAge或严重负债
  const reachedAge = state.currentAge >= state.targetAge;
  const bankrupt = state.currentSavings < -300000; // 负债30万以上才触发破产
  
  // 严重负债随时触发破产结局
  if (bankrupt) return 'E8';
  
  // 财富自由结局只在退休年龄后判定（避免45岁就触发）
  const wealthMet = state.currentSavings + state.propertyValue >= state.targetWealth;
  
  if (!reachedAge) return null;
  
  // 以下是退休年龄后的结局判定
  
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
  if (reachedAge) {
    // E4 中道崩殂：真正悲惨——失业>5年+重病+无保险 或 健康<20濒死
    const trulyTragic = (state.totalUnemployedYears > 5 && state.hadCriticalIllness && !state.isInsured) ||
                        state.health < 20;
    if (trulyTragic) return 'E4';
    
    // E9 浮生半日闲：平凡人生——没大富大贵，但也没彻底垮掉
    // 条件：健康>=30 OR 幸福>=40 OR (有房有家庭)
    const decentLife = state.health >= 30 || state.happiness >= 40 || 
                       (state.hasProperty && state.isMarried);
    if (decentLife) return 'E9';
    
    // 介于两者之间：看存款比例，达到目标40%以上也算B级结局
    if (state.currentSavings + state.propertyValue >= state.targetWealth * 0.4) return 'E9';
  }
  
  // 真正的中道崩殂：没到退休年龄但触发了其他结局条件（如重病缠身）
  return 'E4';
}
