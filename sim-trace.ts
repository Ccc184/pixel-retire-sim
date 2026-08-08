// 临时无头模拟：追踪 AI / 银发路径 25-60 岁完整剧情流，检查叙事连贯性
import { selectNarrativeEvent, getAvailableEvents } from './src/data/narrative-events.js';
import './src/data/narrative-data-silver.js'; // 注册银发事件
import type { GameState, NarrativeOption } from './src/types/global.d.js';

function makeState(path: string): GameState {
  const s: any = {
    currentAge: 25,
    targetAge: 60,
    targetWealth: 3000000,
    currentSavings: 500000,
    initMonthlySalary: 8000,
    currentMonthlySalary: 8000,
    preUnemployedSalary: 8000,
    careerStartSalary: 8000,
    currentProfession: 'engineer',
    currentCity: 'beijing',
    economicCycle: 'boom',
    isUnemployed: false,
    isInsured: true,
    isMarried: false,
    hasChild: false,
    hasSideHustle: true,
    hasProperty: false,
    hasCommercialPension: false,
    isUpskilled: false,
    isGeoArbitrage: false,
    hasCar: false,
    carValue: 0,
    carAge: 0,
    annualCarCost: 0,
    hasHedgeOption: false,
    didHealthCheck: false,
    usedMinimalism: false,
    hasMBA: false,
    hasRetirementPlan: false,
    annualBaseCost: 60000,
    passiveIncome: 0,
    currentMortgageCost: 0,
    mortgageRemainingYears: 0,
    propertyValue: 0,
    annualPropertyMaintenance: 0,
    bankDepositPct: 0,
    indexFundPct: 0,
    speculationPct: 0,
    fixedDepositPct: 0,
    stockPct: 0,
    goldPct: 0,
    shopValue: 0,
    shopMonthlyRent: 0,
    hasStockAccount: false,
    hasFutures: false,
    hasGold: false,
    hasShop: false,
    unemployedTurns: 0,
    totalYearsWorked: 0,
    totalUnemployedYears: 0,
    hadCriticalIllness: false,
    insurancePremium: 0,
    parents: {},
    partner: null,
    children: [],
    friends: [],
    stress: 35,
    happiness: 60,
    health: 80,
    consecutiveMaxStressYears: 0,
    dailyEventLog: [],
    thisYearMilestones: [],
    lifeLog: [],
    originChoices: {},
    endingTriggered: false,
    lastEventId: null,
    pendingAftermath: null,
    unlockedAchievements: [],
    retirementPath: path,
    pathChoiceYear: 25,
    pathFaith: 80,
    pathMilestones: [],
    pathCrisisTriggered: false,
    pathEndgameTriggered: false,
    isAllInPath: true,
    hasCompany: true,
    canRetire: false,
    recentShownCards: [],
    yearOpeningMonologue: '',
    mbtiType: null,
    retirementDream: null,
    narrativeBranch: 'unassigned',
    pathSkills: {
      aiSkill: 55, promptMastery: 55, aiTraining: 55,
      careSkill: 55, managementSkill: 55, policySkill: 55,
    },
    narrativeEventFired: {},
    triggeredAchievements: [],
    branchMemory: {},
    branchHistory: [],
    // 路径专属
    chainHoldings: 500000,
    hasAbandonedCrypto: false,
    bioPortfolio: 300000,
    biologicalAge: 0,
    supplementRegime: false,
    silverBusiness: { clients: 200, reputation: 60, monthlyRevenue: 20000 },
    ipFollowers: 50000,
    ipReputation: 60,
    aiSkillLevel: 40,
  };
  return s as GameState;
}

function firstBranchOption(opts: NarrativeOption[]): NarrativeOption {
  // branch_select 取第一个选项
  return opts[0];
}

function pickDeepen(opts: NarrativeOption[]): NarrativeOption {
  // 优先"不换/走穿"（深化），否则第一个
  const deepen = opts.find((o) => o.label.includes('不换') || o.label.includes('走穿'));
  return deepen || opts[0];
}

function pickSwitch(opts: NarrativeOption[]): NarrativeOption {
  // 优先切换线（非加深且可用），否则第一个
  const sw = opts.find((o) => !o.label.includes('不换') && !o.label.includes('走穿') && (!o.prerequisites || true));
  return sw || opts[0];
}

function applyOption(state: any, option: NarrativeOption) {
  if (option.branchSwitch) {
    if (state.narrativeBranch !== option.branchSwitch) {
      state.branchHistory.push(option.branchSwitch);
    }
    state.narrativeBranch = option.branchSwitch;
  }
  if (option.memorySet) {
    Object.assign(state.branchMemory, option.memorySet);
  }
  if (option.skillGains) {
    for (const [k, v] of Object.entries(option.skillGains)) {
      state.pathSkills[k] = Math.min(100, (state.pathSkills[k] || 0) + (v as number));
    }
  }
  if (typeof option.stateEffect === 'function') {
    try { option.stateEffect(state); } catch {}
  }
}

function runScenario(path: string, label: string, branchPick: (o: NarrativeOption[]) => NarrativeOption, midPick: (o: NarrativeOption[]) => NarrativeOption) {
  const state = makeState(path);
  const fired: Record<string, number> = {};
  const rows: { age: number; event: string; option: string; branch: string }[] = [];
  let restCount = 0;

  for (let age = 25; age <= 60; age++) {
    state.currentAge = age;
    const ev = selectNarrativeEvent(state, fired);
    if (!ev) {
      restCount++;
      rows.push({ age, event: '(休养生息·无事件)', option: '', branch: state.narrativeBranch });
      continue;
    }
    if (!ev.options || ev.options.length === 0) {
      console.log(`[WARN] age ${age} 事件 ${ev.id} 无选项，跳过: ${ev.title}`);
      fired[ev.id] = age;
      continue;
    }
    let opt: NarrativeOption;
    if (ev.eventType === 'branch_select') {
      opt = branchPick(ev.options);
    } else if (ev.id.includes('midlife_rebranch')) {
      opt = midPick(ev.options);
    } else {
      opt = ev.options[0];
    }
    applyOption(state, opt);
    fired[ev.id] = age;
    rows.push({ age, event: `[${ev.title}]`, option: opt.label, branch: state.narrativeBranch });
  }

  console.log(`\n========== ${label} ==========`);
  console.log(`分支历史: ${state.branchHistory.join(' → ') || '(无)'}`);
  console.log(`记忆键: ${Object.entries(state.branchMemory).filter(([,v]) => v).map(([k]) => k).join(', ') || '(无)'}`);
  for (const r of rows) {
    const flag = r.event.startsWith('(休养生息') ? '  ⚠️' : '';
    console.log(`${r.age}岁  ${r.event}${r.option ? ' → ' + r.option : ''}  [${r.branch}]${flag}`);
  }
  return { rows, restCount, branchHistory: state.branchHistory, memory: state.branchMemory };
}

// ===== AI 路径 =====
runScenario('ai_symbiote', 'AI·坚守线（技术专家→不换）', firstBranchOption, pickDeepen);
runScenario('ai_symbiote', 'AI·换路线（技术专家→40岁切布道师）', firstBranchOption, pickSwitch);

// ===== 银发路径 =====
runScenario('silver_economy', '银发·坚守线（护理→不换）', firstBranchOption, pickDeepen);
runScenario('silver_economy', '银发·换路线（护理→40岁切社区）', firstBranchOption, pickSwitch);

console.log('\n模拟完成');