import { defineStore } from 'pinia';
import { ref, computed, nextTick, shallowRef } from 'vue';
import { matchStoryboardScenes, type SceneContext } from '../data/storyboard-scenes.js';
import type { GameState, Profession, CityType, OriginChoices, YearResult, CrossroadEvent, NarrativeEvent, MBTIType, SalaryChangeEntry, RetirementDream } from '../types/global.d.js';
import { CITY_CONFIGS, applySalaryRaise, calculateYearlySettlement, checkEnding, switchCity, checkCanRetire, getVoluntaryRetirementEnding, calculateTotalWealth, clampAnnualSalaryGrowth, isDelayedRetirementPhase, applyAnnualChainGrowth } from '../utils/math-engine.js';
import { rollRandomEvents } from '../data/events.js';
import { rollDailyEvents, applyDailyEventEffects } from '../data/daily-events.js';
import { ENDINGS, buildEndingText } from '../utils/narrative.js';
import { computeFinalGrade, type FinalGrade } from '../utils/rating.js';
import { initParents, initFriends, processRelationships, resetMarriedFriendSet } from '../utils/relationships.js';
import { resetSharedNarrativeLru, filterSharedRecent } from '../utils/shared-narrative-lru.js';
import { scheduleSave, loadSave, clearSave } from './persist.js';
import { recordRun } from '../utils/collection.js';
import { detectCrossroad } from '../data/crossroads.js';
import { detectCardEchoes } from '../data/card-echoes.js';
import { BLIND_BOX_OUTCOMES, detectBlindBoxOutcomes } from '../data/blind-box-outcomes.js';
import { processRomanceYear } from '../data/romance.js';
import { checkAchievements } from '../data/achievements.js';
import { getPath } from '../data/retirement-paths.js';
import { selectNarrativeEvent } from '../data/narrative-events.js';
import { checkAchievements as checkNarrativeAchievements } from '../data/narrative-achievements.js';
import { getMBTIProfessionModifier, getActiveMBTIMechanics, getActiveMBTITrait } from '../data/mbti-system.js';
import { RETIREMENT_DREAMS } from '../data/retirement-dreams.js';
import type { RetirementPathId } from '../types/global.d.js';

// 创建初始状态
function createInitialState(): GameState {
  return {
    // 核心数值
    currentAge: 22,
    targetAge: 60,
    targetWealth: 5000000,
    currentSavings: 0,
    initMonthlySalary: 10000,
    currentMonthlySalary: 0,
    preUnemployedSalary: 0,
    careerStartSalary: 0,
    // 职业与城市
    currentProfession: '传统私企',
    currentCity: '中坚大后方',
    economicCycle: 1,
    // 布尔状态
    isUnemployed: false,
    isInsured: false,
    isMarried: false,
    hasChild: false,
    hasSideHustle: false,
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
    // 财务（v10平衡：基础年支出4.8万=4000/月，更符合二线城市年轻人的实际生活成本）
    annualBaseCost: 48000,
    passiveIncome: 0,
    currentMortgageCost: 0,
    mortgageRemainingYears: 0,
    propertyValue: 0,
    annualPropertyMaintenance: 0,
    bankDepositPct: 100,
    indexFundPct: 0,
    speculationPct: 0,
    // 存款分布
    fixedDepositPct: 0,
    stockPct: 0,
    goldPct: 0,
    // 资产
    shopValue: 0,
    shopMonthlyRent: 0,
    // 理财状态标记
    hasStockAccount: false,
    hasFutures: false,
    hasGold: false,
    hasShop: false,
    unemployedTurns: 0,
    totalYearsWorked: 0,
    totalUnemployedYears: 0,
    hadCriticalIllness: false,
    insurancePremium: 0,
    // 人际关系系统
    parents: initParents(),
    partner: null,
    children: [],
    friends: initFriends(),
    // 身心状态
    stress: 20 + Math.floor(Math.random() * 20),     // 初始20-40
    happiness: 60 + Math.floor(Math.random() * 20),   // 初始60-80
    health: 85 + Math.floor(Math.random() * 15),      // 初始85-100
    consecutiveMaxStressYears: 0,                     // v3: 连续压力100计数器
    // 日常琐事
    dailyEventLog: [],
    thisYearMilestones: [],
    // 剧情
    lifeLog: [],
    originChoices: { cityReason: 1, careerMotivation: 1, riskAttitude: 1 },
    endingTriggered: false,
    lastEventId: null,
    pendingAftermath: null,
    unlockedAchievements: [],
    // === 提前退休路径系统 ===
    retirementPath: null,
    pathChoiceYear: 0,
    pathFaith: 50,
    pathMilestones: [],
    pathCrisisTriggered: false,
    pathEndgameTriggered: false,
    isAllInPath: false,
    hasCompany: false,
    canRetire: false,
    recentShownCards: [],
    yearOpeningMonologue: '',
    // === 叙事分支与技能系统 ===
    mbtiType: null,
    retirementDream: null,
    narrativeBranch: 'unassigned',
    pathSkills: {},
    narrativeEventFired: {},
    triggeredAchievements: [],
    // 游戏阶段
    gamePhase: 'intro',
    currentEndingId: null,
    // 十字路口系统
    crossroadFired: {},
    // 卡片使用历史
    usedCardHistory: {},
    // 卡片连锁反应待触发队列
    pendingCardEchoes: [] as { cardId: string; triggerAge: number; delayYears: number }[],
    // 盲盒待揭晓队列
    pendingBlindBoxes: [] as { outcomeId: string; triggerAge: number; triggerCardId?: string; delayYears?: number }[],
    // 人生总账单累计追踪
    lifetimeSalary: 0,
    lifetimeInvestmentGain: 0,
    lifetimeSideHustle: 0,
    currentYearSideHustle: 0,
    lifetimeLivingCost: 0,
    lifetimeMortgage: 0,
    lifetimeChildCost: 0,
    lifetimeParentCost: 0,
    lifetimeMedicalCost: 0,
    lifetimeCardCost: 0,
    lifetimeGiftMoney: 0,
    lifetimeInsuranceCost: 0,
    // 日常事件去重与感冒免疫
    firedDailyEvents: {},
    lastColdYear: 0,
  };
}

export const useGameStore = defineStore('game', () => {
  // 加载存档或初始化（兼容旧存档：补充缺失字段）
  const savedState = loadSave();
  const freshState = createInitialState();
  const initialState: GameState = savedState ? { ...freshState, ...savedState } : freshState;
  // 兼容旧存档：确保 lifetime 字段存在
  const lifetimeFields = [
    'lifetimeSalary', 'lifetimeInvestmentGain', 'lifetimeSideHustle',
    'lifetimeLivingCost', 'lifetimeMortgage', 'lifetimeChildCost',
    'lifetimeParentCost', 'lifetimeMedicalCost', 'lifetimeCardCost',
    'lifetimeGiftMoney', 'lifetimeInsuranceCost',
    'carValue', 'carAge', 'annualCarCost', 'annualPropertyMaintenance',
  ];
  for (const f of lifetimeFields) {
    if ((initialState as any)[f] === undefined || (initialState as any)[f] === null) {
      (initialState as any)[f] = 0;
    }
  }
  // 兼容旧存档：确保 isAllInPath 字段存在
  if (initialState.isAllInPath === undefined) {
    initialState.isAllInPath = false;
  }
  // 兼容旧存档：确保 hasCompany 字段存在
  if (initialState.hasCompany === undefined) {
    initialState.hasCompany = false;
  }
  // 兼容旧存档：确保 firedDailyEvents 字段存在
  if (!initialState.firedDailyEvents) {
    initialState.firedDailyEvents = {};
  }
  // 兼容旧存档：确保 lastColdYear 字段存在
  if (initialState.lastColdYear === undefined || initialState.lastColdYear === null) {
    initialState.lastColdYear = 0;
  }
  const state = ref<GameState>(initialState);
  
  // 年度结算结果
  const lastYearResult = ref<YearResult | null>(null);
  // 当年电视窗口情绪（剧情驱动）
  const yearMood = ref<'rain' | 'hearts' | 'gold' | 'gloom' | 'vignette' | 'snow' | 'thunder' | 'fog' | 'glitch' | 'clear'>('clear');
  // 事件弹窗信息
  const eventPopup = ref<{ title: string; description: string; isDanger: boolean } | null>(null);
  // 显示城市选择弹窗
  const showCitySelect = ref(false);
  // 十字路口状态
  const currentCrossroad = ref<CrossroadEvent | null>(null);
  const crossroadFiredTags = ref<Map<string, number>>(new Map(Object.entries(state.value.crossroadFired || {})));
  const showCrossroad = ref(false);
  // 年度结算弹窗
  const showYearEnd = ref(false);

  // 资产获得动画通知（买房/买车等即时视觉反馈）
  const assetAcquired = ref<{ type: 'house' | 'car' | 'job' | 'love' | 'money'; label: string } | null>(null);

  // 卡片转场动画类型
  const cardTransitionType = ref<string | null>(null);
  function setCardTransition(type: string | null) {
    cardTransitionType.value = type;
  }

  // ========== 三分镜队列 ==========
  // 当年触发的剧情事件，次年对应窗口展示像素动画场景
  const pendingStoryboards = ref<{ family: string[]; life: string[]; career: string[] }>({
    family: [],
    life: [],
    career: [],
  });

  /** 构建场景匹配上下文（从当前游戏状态） */
  function buildSceneContext(): SceneContext {
    const s = state.value
    return {
      age: s.currentAge,
      hasChild: s.hasChild || s.children.length > 0,
      isEmployed: !s.isUnemployed,
      datingStage: s.partner?.datingStage ?? null,
      hasProperty: s.propertyValue > 0,
    }
  }

  /** 将本年度日志分类到三分镜队列（单年模式：每年替换为新场景，不累积） */
  function classifyStoryboards(logs: string[]) {
    pendingStoryboards.value = matchStoryboardScenes(logs, buildSceneContext());
  }

  // ========== 叙事事件系统（替代三卡） ==========
  const currentNarrativeEvent = shallowRef<NarrativeEvent | null>(null);
  const selectedNarrativeOptionId = ref<string | null>(null);
  // 当前触发的成就（如果有）
  const currentAchievement = shallowRef<{ title: string; narrative: string; log: string } | null>(null);

  function dismissAchievement() {
    currentAchievement.value = null;
  }

  // 计算属性
  const totalWealth = computed(() => calculateTotalWealth(state.value));
  const progressToTarget = computed(() => Math.min(100, (totalWealth.value / state.value.targetWealth) * 100));
  // 是否可以退休——人生不被定义，玩家随时可自主决定退休，不做任何达标条件限制
  const canRetireNow = computed(() => {
    return state.value.endingTriggered === false && state.value.gamePhase === 'playing';
  });
  const monthlySalaryDisplay = computed(() => state.value.isUnemployed ? 0 : state.value.currentMonthlySalary);
  const yearlyIncomeDisplay = computed(() => {
    if (state.value.isUnemployed) return state.value.passiveIncome;
    if (state.value.currentProfession === '体制内' && state.value.currentAge >= 60) {
      return Math.round(state.value.currentMonthlySalary * 12 * 0.7);
    }
    return state.value.currentMonthlySalary * 12 + state.value.passiveIncome;
  });

  // ========== 身心状态计算属性 ==========
  const stressLevel = computed(() => {
    const s = state.value.stress;
    if (s > 70) return 'high';
    if (s > 40) return 'medium';
    return 'low';
  });
  const happinessLevel = computed(() => {
    const h = state.value.happiness;
    if (h > 70) return 'high';
    if (h > 40) return 'medium';
    return 'low';
  });
  const healthLevel = computed(() => {
    const hp = state.value.health;
    if (hp > 70) return 'good';
    if (hp > 40) return 'warning';
    return 'danger';
  });
  const totalChildExpense = computed(() =>
    state.value.children.reduce((sum, c) => sum + c.monthlyExpense * 12, 0)
  );
  
  // ========== 游戏初始化 ==========
  function startNewGame(originChoices?: OriginChoices) {
    const fresh = createInitialState();
    // 重置跨局模块级状态，避免上一局的"已结婚朋友"集合泄漏到新局
    resetMarriedFriendSet();
    // 如果没有传originChoices（删除了问卷），随机生成
    fresh.originChoices = originChoices || {
      cityReason: Math.floor(Math.random() * 3) as 0 | 1 | 2,
      careerMotivation: Math.floor(Math.random() * 3) as 0 | 1 | 2,
      riskAttitude: Math.floor(Math.random() * 3) as 0 | 1 | 2,
    };
    fresh.gamePhase = 'setup';
    state.value = fresh;
    currentNarrativeEvent.value = null;
    selectedNarrativeOptionId.value = null;
    currentAchievement.value = null;
    lastYearResult.value = null;
    eventPopup.value = null;
    showCitySelect.value = false;
    currentCrossroad.value = null;
    showCrossroad.value = false;
    showYearEnd.value = false;
    crossroadFiredTags.value = new Map();
    assetAcquired.value = null;
    cardTransitionType.value = null;
    pendingStoryboards.value = { family: [], life: [], career: [] };
    clearSave();
  }
  
  function setupGame(city: CityType, profession: Profession, initSalary: number, targetWealth: number, mbtiType: MBTIType | null, retirementDream: RetirementDream | null) {
    state.value.currentCity = city;
    state.value.currentProfession = profession;
    state.value.initMonthlySalary = initSalary;
    state.value.targetAge = 60; // 统一硬上限：60岁强制结算，退休时机由玩家自主决定
    state.value.targetWealth = targetWealth;
    state.value.mbtiType = mbtiType;
    state.value.retirementDream = retirementDream;

    // 应用MBTI×职业微调：初始薪资微调（可选，未选MBTI时不修正）
    // 注意：城市薪资系数不在开局乘——玩家输入的initSalary就是所选城市的实际月薪。
    // 城市差异体现在生活成本(costMultiplier)上；搬家时才按系数比例折算薪资。
    const actualStartSalary = mbtiType
      ? Math.round(initSalary * getMBTIProfessionModifier(mbtiType, profession).startingSalaryMultiplier)
      : initSalary;

    state.value.careerStartSalary = actualStartSalary;
    state.value.currentMonthlySalary = actualStartSalary;
    state.value.currentAge = 22;
    state.value.currentSavings = Math.round(actualStartSalary * 6); // 初始6个月工资作为缓冲

    // 根据起薪和城市合理设定年基础生活费（annualBaseCost）
    // 不同城市有不同的"基础消费占收入比"，保证开局储蓄率合理：
    //   资本修罗场≈55%支出/45%储蓄（高消费城市，存得少但涨薪快）
    //   中坚大后方≈45%支出/55%储蓄（平衡）
    //   避风低洼地≈30%支出/70%储蓄（地理套利，存得多）
    //   海外低成本≈25%支出/75%储蓄（远程+低成本，最优储蓄率）
    // annualBaseCost 是"真实消费基准"，乘以 costMultiplier 才是该城市的名义支出
    const cityConfig = CITY_CONFIGS[city];
    const spendingRatioByCity: Record<CityType, number> = {
      '资本修罗场': 0.55,
      '中坚大后方': 0.45,
      '避风低洼地': 0.30,
      '海外低成本': 0.25,
    };
    const targetSpendingRatio = spendingRatioByCity[city] ?? 0.45;
    const annualSalary = actualStartSalary * 12;
    state.value.annualBaseCost = Math.round((annualSalary * targetSpendingRatio) / cityConfig.costMultiplier);

    // 地理套利判定
    state.value.isGeoArbitrage = city === '避风低洼地' || city === '海外低成本';

    // 进入路径选择阶段
    state.value.gamePhase = 'path_select';
    state.value.lifeLog = [];
    state.value.crossroadFired = {};
    state.value.retirementPath = null;
    state.value.pathFaith = 50;
    state.value.pathMilestones = [];
    state.value.pathCrisisTriggered = false;
    state.value.pathEndgameTriggered = false;
    state.value.isAllInPath = false;
    state.value.canRetire = false;
    state.value.recentShownCards = [];
    state.value.narrativeBranch = 'unassigned';
    state.value.pathSkills = {};
    state.value.narrativeEventFired = {};
    state.value.triggeredAchievements = [];
    // 重置三分镜队列
    pendingStoryboards.value = { family: [], life: [], career: [] };
    crossroadFiredTags.value = new Map();

    addLog(`第22岁，你在${city}开始了${profession}的职业生涯，初始月薪${actualStartSalary}元。像素人生，正式开局。`);

    // 开局立即触发分镜分类，让22岁就能显示匹配的场景
    nextTick(() => {
      classifyStoryboards([`第${state.value.currentAge}岁，你在${city}入职上班，开始了${profession}的职业生涯`]);
    });

    // 路径选择阶段不抽事件，等玩家选完路径再抽
    currentNarrativeEvent.value = null;
    selectedNarrativeOptionId.value = null;
    scheduleSave(state.value);
  }

  /** 玩家选择退休路径 */
  function selectRetirementPath(pathId: RetirementPathId) {
    const path = getPath(pathId);
    if (!path) return;

    state.value.retirementPath = pathId;
    state.value.pathChoiceYear = state.value.currentAge;
    state.value.pathFaith = 35; // 初始信念值：需要长期积累+经历重大考验才能达到All In阈值(95)
    // targetAge保持60不变——退休时机由玩家自主决定，路径不再绑定年龄
    state.value.pathMilestones = [];
    state.value.pathCrisisTriggered = false;
    state.value.pathEndgameTriggered = false;

    // 应用路径初始效果
    path.initialEffect(state.value);

    // 生成第一年的心境独白
    generateYearOpeningMonologue();

    state.value.gamePhase = 'playing';

    // 开局首年（22岁）直接展示入职/工作场景，确保三分镜立即可见
    // 修复：setupGame中的nextTick classifyStoryboards在path_select阶段执行，
    // 此时StoryboardScene组件尚未挂载。现在在gamePhase变为'playing'后同步分类，
    // 确保组件挂载时pendingStoryboards已包含首年场景数据。
    classifyStoryboards([`第${state.value.currentAge}岁，你在${state.value.currentCity}入职上班，开始了${state.value.currentProfession}的职业生涯`]);

    // 抽取第一年的叙事事件
    drawNarrativeEvent();
    scheduleSave(state.value);
  }

  /** 生成年初心境独白 */
  // 独白去重：用"最近使用序号"追踪每个文本，保证去重窗口内不重复同一文本；
  // 当池子内的文本全部用过时，优先复用"最久未用"的文本（LRU），
  // 而不是随机回退——最大化重复间隔，避免短期内循环重复。
  const DEDUP_WINDOW = 8; // 去重窗口：某个文本被使用后，此后 DEDUP_WINDOW 次内不再选它

  interface RecentTracker {
    pick<T>(pool: T[]): T;
  }

  function createRecentTracker(): RecentTracker {
    let counter = 0;
    const lastUsed = new Map<string, number>();
    return {
      pick<T>(pool: T[]): T {
        counter++;
        const now = counter;
        // 优先选最近 DEDUP_WINDOW 次内没用过的文本
        const aged = pool.filter(item => {
          const last = lastUsed.get(String(item));
          return last === undefined || now - last > DEDUP_WINDOW;
        });
        let candidate: T;
        if (aged.length > 0) {
          candidate = aged[Math.floor(Math.random() * aged.length)];
        } else {
          // 全部都在窗口内用过：选"最久未用"的文本（LRU），保证不立即重复
          let oldest: T = pool[0];
          let oldestUse = Infinity;
          for (const item of pool) {
            const last = lastUsed.get(String(item));
            const use = last === undefined ? -1 : last;
            if (use < oldestUse) {
              oldestUse = use;
              oldest = item;
            }
          }
          candidate = oldest;
        }
        lastUsed.set(String(candidate), now);
        return candidate;
      },
    };
  }

  // 基础独白 与 MBTI前缀 各自独立去重
  const baseMonologueTracker = createRecentTracker();
  const mbtiPrefixTracker = createRecentTracker();

  function generateYearOpeningMonologue() {
    const path = getPath(state.value.retirementPath);
    if (!path) {
      state.value.yearOpeningMonologue = '';
      return;
    }
    const age = state.value.currentAge;
    // 副业阶段（All In 前）优先使用 sideHustleMonologues，无定义则回退到 openingMonologues
    const monologueSource = (!state.value.isAllInPath && path.sideHustleMonologues)
      ? path.sideHustleMonologues
      : path.openingMonologues;
    let baseMonologue = '';
    for (const group of monologueSource) {
      if (age >= group.ageRange[0] && age <= group.ageRange[1]) {
        baseMonologue = baseMonologueTracker.pick(group.texts);
        break;
      }
    }
    if (!baseMonologue) {
      // 超龄后用最后一段
      const lastGroup = monologueSource[monologueSource.length - 1];
      baseMonologue = baseMonologueTracker.pick(lastGroup.texts);
    }

    // MBTI人格独白上色：以气质群风格 + 路径基调 为独白添加存在主义前缀
    const mbtiTrait = getActiveMBTITrait(state.value);
    if (mbtiTrait) {
      const style = mbtiTrait.monologueStyle;
      const currentPathId = state.value.retirementPath;

      // 通用前缀池（适用于所有路径，不含强职业/技术视角）
      const universalPrefixPools: Record<string, string[]> = {
        '冷峻': [
          '你看着窗外的城市，像看一个等待被解构的系统。',
          '逻辑是干净的，生活是脏的。你习惯了这种落差。',
          '你把情绪折叠好，放进抽屉。今天也要运转。',
          '你见过太多承诺化为乌有，只信自己亲眼看到的。',
          '沉默是你最熟练的语言。',
          '你习惯了把感受压到最底层，先处理该处理的事。',
          '有些问题没有答案，你已经接受了这件事。',
        ],
        '炽热': [
          '有什么东西在你胸腔里燃烧，你说不清那是什么。',
          '你用力活着，像怕来不及似的。',
          '今天的阳光打在脸上，你突然想拥抱什么。',
          '你觉得自己能改变世界，至少能改变点什么。',
          '那团火还在，只是烧得更稳了。',
          '你握紧拳头又松开，手心有汗。',
          '你不再想改变世界，只想让今天不白过。',
          '火小了，但还没灭。余温也是温。',
        ],
        '沉稳': [
          '闹钟响了。你起身，叠被，倒水。秩序是一种安慰。',
          '日子像砖块，一块一块垒起来，你信这个。',
          '你把昨天的事在脑子里过一遍，确认没有遗漏。',
          '你列了今天的待办清单，一件一件来。',
          '你不再追求速度，开始追求可持续。',
          '保温杯里的茶温度刚好，你喝了一口。',
          '清单短了，但每件都更重要了。',
          '你学会了说"不"，这比说"好"难多了。',
        ],
        '灵动': [
          '风从窗口灌进来，你的念头跟着跑了一会儿。',
          '你突然想起一件不相干的事，笑了。',
          '今天的可能性是敞开的，你喜欢这种感觉。',
          '你想试试所有的门，哪怕大部分是锁着的。',
          '好奇心还在，但不再漫无目的。',
          '楼下有人在唱歌，跑调了，但很好听。',
          '你找到了几扇能推开的门，不再敲那些关着的。',
          '你对新鲜事物保持兴趣，但已经知道大部分是噪音。',
        ],
        '温柔': [
          '你泡了一杯茶，看着茶叶在水里慢慢展开。',
          '你注意到路边有朵花开了，停下来看了一会儿。',
          '你给在乎的人发了一条消息，然后安静地等。',
          '你想对世界好一点，虽然世界不总是回报你。',
          '温柔不是软弱，是选择不伤害。',
          '猫蹭了蹭你的腿，你蹲下来摸了摸它。',
          '你学会了先对自己好一点，再对别人好。',
          '你不再急着证明什么，安静本身就是力量。',
        ],
        '锐利': [
          '你的目光扫过房间，自动标记了三个待解决的问题。',
          '你讨厌浪费时间，所以你已经在想了。',
          '你闻到了空气里的机会，也闻到了风险。',
          '你能一眼看穿别人的敷衍，这让你不太受欢迎。',
          '你的判断力越来越准，但开口越来越少。',
          '你在三秒内评估了今天的优先级，然后开始做第一件。',
          '你看穿了也不说了，有些真相不值得。',
          '你不再试图说服任何人，用结果说话。',
        ],
      };

      // 路径专属前缀（按路径基调定制，与通用池合并使用）
      const pathPrefixPools: Record<string, Record<string, string[]>> = {
        // AI共生者 / 链上原住民 —— 程序员/技术视角
        ai_symbiote: {
          '冷峻': [
            '代码不会撒谎，人会。你更愿意和代码待着。',
            '系统可以优化，人生不行。你接受了这个bug。',
            '窗外的城市是一个巨型状态机，每个人都是一个节点。',
            '你学会了不在无法解决的问题上消耗算力。',
            '终端里跳动的日志比任何人的承诺都可靠。',
            'debug到凌晨三点，你和bug之间总有一个要先投降。',
          ],
          '炽热': [
            '你想让AI理解你，又怕它真的理解了。',
            '模型跑通的那一刻，你差点叫出声来。',
          ],
          '沉稳': [
            '你把prompt改了第十七版，还是不满意。',
            '服务器没报警，今天就是好日子。',
          ],
          '灵动': [
            'AI又生成了一段意想不到的回答，你笑了。',
            '你突然想到一个新的模型调优思路，手指已经开始敲键盘了。',
          ],
          '温柔': [
            '你给AI助手起了个名字，虽然知道它只是在预测下一个token。',
            '深夜debug的时候，你习惯放一首老歌陪着。',
          ],
          '锐利': [
            '你一眼看出了那段代码的问题，三行修改，线上事故平息。',
            '技术栈更新了，你评估了迁移成本，决定再等等。',
          ],
        },
        chain_native: {
          '冷峻': [
            '代码不会撒谎，人会。你更愿意和链上数据待着。',
            '链上的交易不可逆，人生的选择也是。',
            '窗外的城市是一个巨型状态机，每个人都是一个节点。',
            '你学会了不在无法解决的问题上消耗算力。',
            '私钥即产权，你比谁都清楚这句话的重量。',
            '白皮书看了三遍，你还是没找到那个隐藏的陷阱。',
          ],
          '炽热': [
            'K线翻红的时候，你有一种心跳加速的感觉。',
            '你信去中心化，信得有点像信宗教。',
          ],
          '沉稳': [
            '你把仓位分成了五份，按纪律执行，不看情绪。',
            'Gas费又涨了，你等了一个低谷才按下确认。',
          ],
          '灵动': [
            '新公链又发空投了，你嘴角上扬，手指已经在连接钱包。',
            '社区里又吵起来了，你搬了个小板凳看热闹。',
          ],
          '温柔': [
            '你给持有的币写了持有日记，虽然没人看。',
            '朋友被套了，你没说"我早说了"，只是转了一笔U过去。',
          ],
          '锐利': [
            '你在三秒内判断了这条消息是利好还是利空，然后下单。',
            '合约审计报告扫了一眼，你找到了那个重入漏洞。',
          ],
        },
        // 数字游牧民 —— 漂泊、自由、远方
        digital_nomad: {
          '冷峻': [
            '机场广播又在催登机了，你已经习惯了这种催促。',
            '手机里第三国的SIM卡还没激活。',
            '地图上的图钉又多了一个，但没有一个是家。',
            '汇率在脑子里自动换算，你已经忘了用哪种货币思考。',
            '行李箱的轮子又磨坏了一个，这是第三个了。',
            'VPN断了，你和世界失联了两小时。',
          ],
          '炽热': [
            '飞机起飞的时候，你有一种想大喊的冲动。',
            '陌生街道上的阳光打在脸上，你想记住这个温度。',
            '你踩在一片从未到过的土地上，心跳加速。',
          ],
          '沉稳': [
            '你在新城市的公寓里煮了第一顿饭，味道和家里不一样，但能吃。',
            '时差还没倒过来，你按当地时间设了闹钟，逼自己适应。',
            '你列了这个月要去的三个地方，排好了行程。',
          ],
          '灵动': [
            '街角的艺人在弹一首你没听过的歌，你站着听了很久。',
            '你用刚学会的当地语言点了一杯咖啡，居然对了。',
            '行李箱里多了一件当地手工艺品，你已经想好了放哪。',
          ],
          '温柔': [
            '你给妈妈发了一张窗外的风景，她回了个"好美"。',
            '旅馆的猫跳上你的膝盖，你摸了摸它，它没走。',
            '你在异国的超市里找到了熟悉的泡面，差点哭出来。',
          ],
          '锐利': [
            '你一眼看出这个 coworking space 的网不够快，换了一家。',
            '当地房东想多收你钱，你三句话搞定了。',
            '你评估了这个城市的生活成本，决定再待三个月。',
          ],
        },
        // 超级IP —— 表演、流量、镜头
        super_ip: {
          '冷峻': [
            '镜头亮了，你自动切换成那个大家喜欢的你。',
            '评论区又在吵，你关了手机。',
            '后台数据跳了一下，你告诉自己别在意。',
            '滤镜后面的你和真实的你，已经分不清了。',
            '热搜上得快，下得也快，你早就习惯了。',
            '私信99+，你一条都没点开。',
          ],
          '炽热': [
            '点赞破万的那一刻，你还是没忍住笑了。',
            '粉丝说"你救了我"，你眼眶热了一下。',
            '直播的时候你感觉自己在发光，那种感觉上瘾。',
          ],
          '沉稳': [
            '你按排期拍了三条视频，一条没剪完，明天继续。',
            '你列了本周的内容计划，和上周差不多。',
            '数据复盘了半小时，转化率比上周高了0.5%。',
          ],
          '灵动': [
            '评论区一个梗让你笑了十分钟，决定下次用在视频里。',
            '你突然想到一个新选题，手机备忘录里又多了一条。',
            '粉丝的二创比你的原作还有意思，你转发了。',
          ],
          '温柔': [
            '一个老粉丝从你第一天就关注你，你记得他的ID。',
            '你给黑粉也点了赞，有时候理解比对抗更有力。',
            '下播之后你坐在黑暗里，安静地待了五分钟。',
          ],
          '锐利': [
            '你一眼看出这个合作是坑，礼貌地拒绝了。',
            '数据告诉你哪类内容会火，但你决定发自己真正想发的。',
            '你在三秒内判断了这个热点该不该蹭，然后放下了手机。',
          ],
        },
        // 银发守夜人 —— 衰老、陪伴、灯火
        silver_economy: {
          '冷峻': [
            '走廊的灯又坏了一盏，你记下来明天要修。',
            '老人的手比你奶奶的还粗糙，你握了握。',
            '家属在走廊哭，你递了一杯热水，什么都没说。',
            '夜班的值班室很安静，只有监护仪在滴滴响。',
            '又一位老人走了，家属说谢谢，你点了点头。',
            '你见过太多告别，已经学会了不在当班的时候哭。',
          ],
          '炽热': [
            '老人拉着你的手说"你比我亲闺女还亲"，你鼻子酸了。',
            '张爷爷今天终于肯吃饭了，你比谁都高兴。',
            '你觉得做这件事是有意义的，虽然工资不高。',
          ],
          '沉稳': [
            '你按流程检查了每位老人的用药记录，确认无误。',
            '保温杯泡了枸杞，你喝了一口，继续巡房。',
            '排班表贴在墙上，你看了一眼这周的夜班。',
          ],
          '灵动': [
            '李奶奶今天唱了一段老歌，大家都跟着哼起来。',
            '养老院新来的小猫成了团宠，你也去摸了摸。',
            '你教老人用智能手机视频通话，他们学得很慢，但很认真。',
          ],
          '温柔': [
            '你给王奶奶梳了头发，她对着镜子笑了。',
            '老人睡了，你帮他们掖了掖被角。',
            '你记得每位老人的口味和禁忌，像记得自己家人的。',
          ],
          '锐利': [
            '你一眼看出那位家属在隐瞒什么，但没有揭穿。',
            '护工偷懒被你看到了，你三句话处理完了。',
            '你评估了老人的状况，知道该联系家属了。',
          ],
        },
        // 生物赌徒 —— 数据、药丸、寿命
        bio_gambler: {
          '冷峻': [
            '今天的血糖比昨天高0.3，你在本子上记下来。',
            '药盒又空了一格。',
            '论文又更新了，结论和上个月相反。',
            '体检报告上有个箭头，你查了一下午文献。',
            '补剂摆满了一桌，你按顺序吃下去，像执行一段程序。',
            '你追踪了自己的睡眠数据，深睡比例又降了。',
          ],
          '炽热': [
            '新的临床试验出结果了，你心跳加速。',
            '你赌人类能赢衰老这场仗，信得有点偏执。',
            '某项指标改善了，你差点把报告发给所有朋友。',
          ],
          '沉稳': [
            '你按计划吃了今天的补剂，量了血压，记了数据。',
            '运动手环震了一下，你站起来走了十分钟。',
            '你列了本季度要测的血液指标，预约了体检。',
          ],
          '灵动': [
            '新出的生物黑客播客讲了一个有趣的方案，你决定试试。',
            '你发现一种便宜的食物含有稀有微量元素，兴奋地加进了食谱。',
            '自量化数据里出现了一个有趣的相关性，你决定追踪下去。',
          ],
          '温柔': [
            '你给爸妈也买了同款补剂，虽然他们不信这些。',
            '你知道有些东西数据测不出来，比如一顿好饭和一夜好眠。',
            '你不再焦虑那个箭头了，身体不是只有数字。',
          ],
          '锐利': [
            '你一眼看出那篇抗衰老论文的样本量不够，结论不可信。',
            '某个补剂营销话术被你三秒识破，扔进了垃圾桶。',
            '你评估了风险收益比，决定不参加这次临床试验。',
          ],
        },
      };

      // 合并通用前缀 + 当前路径专属前缀
      const universalPool = universalPrefixPools[style] || universalPrefixPools['沉稳'];
      const pathPool = (currentPathId && pathPrefixPools[currentPathId] && pathPrefixPools[currentPathId][style]) || [];
      const pool = [...universalPool, ...pathPool];

      const mbtiPrefix = mbtiPrefixTracker.pick(pool);
      state.value.yearOpeningMonologue = mbtiPrefix + baseMonologue;
    } else {
      state.value.yearOpeningMonologue = baseMonologue;
    }
  }

  function continueGame() {
    if (savedState) {
      // 兼容旧存档：补充缺失字段
      const fresh = createInitialState();
      const merged: GameState = { ...fresh, ...savedState };
      merged.gamePhase = 'playing';
      state.value = merged;
      // 从持久化的 crossroadFired 恢复 Map
      crossroadFiredTags.value = new Map(Object.entries(state.value.crossroadFired || {}));
      if (!currentNarrativeEvent.value) {
        drawNarrativeEvent();
      }
    }
  }
  
  // ========== 盲盒系统共享变量（applyNarrativeOption 使用） ==========
  const registeredBlindBoxKeys = new Set<string>();
  function matchTrigger(triggerId: string, cardId: string): boolean {
    if (triggerId.endsWith('*')) {
      return cardId.startsWith(triggerId.slice(0, -1));
    }
    return triggerId === cardId;
  }
  const suspenseHints: Record<string, string> = {
    'insurance': '签完保单的那一刻，你有一种说不清的预感——这份保险，迟早会派上用场。',
    'minimalism': '房间空了，但你的心里好像多了一些说不清的东西。也许，这种生活方式的真正效果，要过些年才能感受到。',
    'side_hustle': '深夜的服务器指示灯一闪一闪，像一颗小心脏在跳动。你有一种预感——这台机器的命运，和你的人生绑在了一起。',
    'marry': '领了证，你以为这就是故事的结局。后来你才明白，这其实只是第一章。',
    'have_child': '那个小小的生命安静地睡着了。你看着天花板想——这个孩子会给你的人生带来什么？你不知道。但你知道，一切都不一样了。',
    'buy_house': '钥匙在手里沉甸甸的。三十年的贷款合同压在抽屉最底层。你有一种预感——这套房子会改变你的生活，但怎么改变，你现在还不知道。',
    'buy_house*': '钥匙在手里沉甸甸的。三十年的贷款合同压在抽屉最底层。你有一种预感——这套房子会改变你的生活，但怎么改变，你现在还不知道。',
    'resign': '走出写字楼的那一刻，阳光很刺眼。你不知道这个决定是对的、还是错的——但你知道答案不会马上来。',
    'gym': '健身卡挂在包里，你摸了摸它。它现在只是一张塑料卡片，但也许有一天，它会变成某种更重要的东西。',
    'buy_car': '坐进驾驶座的那一刻，你觉得自己拥有了整条路。但你还不知道——路，也会改变你。',
    'buy_car*': '坐进驾驶座的那一刻，你觉得自己拥有了整条路。但你还不知道——路，也会改变你。',
    'buy_lottery': '你把彩票小心翼翼地夹进钱包最里层。五十块钱买来的不是一张数字，是一整年的幻想权。',
    'windfall_gamble': '你按下确认键的那一刻，账户里少了三十万。你关掉电脑，走到阳台上深呼吸了三次。命运已经下注了。',
    'travel': '火车开动了，窗外的风景开始后退。你望着窗外想——这次旅行的意义，也许现在还看不到。',
    'crypto_bet': '你按下了"买入"键。屏幕上那串数字开始跳动。你告诉自己"就赌这一次"——但你心里知道，故事不会这么简单就结束。',
    'therapy': '走出咨询室的时候，你深吸了一口气。天空好像蓝了一点。也许，改变已经在悄悄发生了。',
    'upskill': '培训结束了，你拿到证书的那一刻觉得自己升级了。但真正的考验，从来不在课堂上。',
    'hedge_option': '期权合同签完了。你祈祷它永远用不上，但你清楚，有些事情不是祈祷就能避免的。',
    'mba': '开学的第一天，你坐在教室最后一排。你不知道这两年会给你带来什么——但你知道，人生不会因为没有尝试而后悔。',
    'buy_second_house': '第二份贷款合同签完了。你看着两个房子的钥匙，心里五味杂陈。投资的对错，要交给时间来评判。',
    'treat_parents': '爸妈吃得开心，你也开心。但看着他们花白的头发，你心里隐隐有一种不安——你好像应该为他们做更多。',
    'dinner_friends': '散场的时候你发了条动态圈"青春不散场"。但你知道，有些人走着走着就散了。这一次，会不一样吗？',
    'hobby_class': '第一节课结束了，老师夸你"有天赋"还是"有勇气"？你分不清。但至少，你开始了一段新的旅程。',
    'health_food': '你做的第一顿饭虽然不怎么样，但冰箱里终于有了新鲜蔬菜。你隐隐觉得——这也许会改变你的生活。',
    'cut_social': '退完最后一个群的时候，你的手指停了两秒。你告诉自己这是"断舍离"，但心里隐隐觉得——有些后果，现在还看不到。',
    'geo_arbitrage': '火车带着你离开旧城市。窗外的风景变了，你的生活也会变。但变成什么样，现在还说不清。',
    'parent_travel': '旅行结束了，照片存了三百多张。你看着爸妈的笑脸，心里暖暖的。这种温暖，也许会在未来的某个时刻，变成更重要的力量。',
    'child_tutoring': '辅导班报名表交了，钱也付了。你看着孩子不情愿的背影想——这笔投入，最终会开花吗？',
    'invest_fund': '定投设置好了，每个月自动扣款。你告诉自己"坚持就是胜利"——但真正的考验，是坚持过程中的那些跌跌撞撞。',
    'side_gig': '私活交稿的那一刻，你松了口气。你有一种预感——这次经历，也许会在未来某个时刻以意想不到的方式回报你。',
    'volunteer': '做义工回来的时候，天色已暗。你在路边站了一会儿，心里有种说不清的感觉。也许，这份善意终会以某种方式回到你身上。',
    'gift_partner': '惊喜送出去了，对方笑了。你心里也有一种说不清的感觉——也许是甜蜜，也许是别的什么。时间会告诉你。',
    'mentor': '新人学会了，对你说的第一句话是"谢谢老师"。你笑了，但心里隐隐觉得——带新人这件事，也许会给你带来意想不到的收获。',
    'upgrade_side_hustle': '新方向探索开始了。你有一种预感——这条路的终点，和你想象的可能完全不同。',
    'invest_fixed_deposit': '定期存款确认存入。你看着"年化3%"的数字，心想——钱这东西，慢慢来也是一种力量。',
    'commercial_pension': '养老保险签了。你想象着60岁的自己收到这笔钱时的样子。也许到那时，你才能理解今天的这个决定有多重要。',
    'upgrade_server': '服务器升级完成，风扇安静地转着。你有一种预感——这台机器的命运，和你的人生轨迹，正在悄悄交汇。',
    // AI共生者路径专属悬念提示
    // 原则：写当下的具体细节，不写"将来会怎样"。让玩家当时觉得只是句感慨，
    // 盲盒触发时才意识到这句平淡的话原来埋了伏笔。
    'ai_prompt_dojo': '外卖盒堆成小山的那个月结束了。你把记满提示词的文档命名为"杂记.docx"，随手丢进D盘一个叫"乱七八糟"的文件夹。',
    'ai_automate_self': '脚本跑起来了。测试环境里一个小小的绿色"通过"。你截了张图，没发动态圈，存进了相册深处。',
    'ai_open_source_tool': '项目上线了，12个star，10个是你自己点的。第11个star来自一个你叫不出名字的账号，头像是一只猫。',
    'ai_health_warning': '医生让你少熬夜多运动。你点了点头，出门就去便利店买了一杯冰美式。',
    'ai_partner_talk': '她最后说了句"你自己想清楚吧"，然后去阳台抽烟了。你觉得这事就算过去了。',
    'ai_all_in_product': '辞职信发出去了。你盯着"已发送"看了十秒，然后下楼去便利店买了包烟。你已经三年没抽了。',
    // 链上原住民路径专属悬念提示
    'chain_first_bet': '你按下了"买入"键。窗外的路灯亮了，你的手指在确认键上停了一秒。',
    'chain_hodl_crisis': '你关掉了交易软件。屏幕黑了，你的脸映在上面，表情很平静。',
    'chain_build_defi': '合约部署成功。区块确认数在跳，你靠在椅背上，喝了一口凉掉的咖啡。',
    'chain_all_in': '辞职邮件发出去了。你在公司群里留了一句"Going full-time crypto"，然后关掉了手机。',
    'chain_friend_call': '你看着他发的那条消息，想了想，还是转了一笔U过去。不多，就当支持朋友。',
    'chain_regulation': '你看完了那篇监管文章，把链接存进了一个叫"重要"的文件夹。',
    // 数字游牧民路径专属悬念提示
    'nomad_first_trip': '机票确认了。你看着行程单上那个陌生的城市名字，把行李箱从床底拖了出来。',
    'nomad_client_referral': '交付了。客户回了一个"赞"的表情。你关了电脑，走到阳台上看了一会儿远处的山。',
    'nomad_culture_shock': '你用刚学会的泰语点了一碗面。阿姨笑着点头，端上来的东西和你想的不太一样。',
    'nomad_all_in': '单程票买好了。日期是下个月一号。你把订票截图发给了妈妈，她回了一个"注意安全"。',
    'nomad_health_issue': '按摩师说你的腰椎"不太好"。你笑着说没事，回去贴了块膏药继续干活。',
    'nomad_community': '群建好了，第一句话是你发的："有没有在清迈的朋友？"五分钟没人回复。',
    // 超级IP路径专属悬念提示
    'ip_first_viral': '你刷新了一下页面。播放量从三百跳到了三千。你又刷新了一下，一万。',
    'ip_brand_deal': '合同签了。钱到账的那天你请自己吃了一顿好的，但发出去的广告你自己没转发。',
    'ip_all_in': '辞职信递了。走出公司的时候你拍了一条短视频，手有点抖。',
    'ip_controversy': '你发了那条回应。关掉评论区，把手机调成了勿扰模式。',
    'ip_algorithm_change': '后台数据掉了一半。你盯着曲线看了很久，然后打开了一个新文档。',
    'ip_mentor_betrayal': '你看着那条消息，沉默了很久。最后你只回了一个字："好。"',
    // 银发守夜人路径专属悬念提示
    'silver_first_death': '你帮她整理了遗物。床头柜里有一张你的照片，背后写着"好小伙子"。',
    'silver_expand': '新站的钥匙拿到了。你站在空荡荡的房间里，闻着新刷的墙漆味。',
    'silver_all_in': '返程票退了。你站在退票窗口前，手里攥着找零的硬币。',
    'silver_family_doubt': '你爸没说话，转身进了屋。你妈在背后说了一句"吃饭吧"。',
    'silver_policy_win': '提案交上去了。接待的人说"回去等消息"，你点了点头。',
    'silver_accident': '你在急救室外坐了四个小时。走廊的灯很白，白得让你睁不开眼。',
    // 生物赌徒路径专属悬念提示
    'bio_first_protocol': '你把补剂按天数分装好，放进了一个印着"实验中"的药盒。',
    'bio_big_bet': '转账确认了。你在投资备忘录上写了一行字："高风险，高不确定性，高信念。"',
    'bio_self_experiment': '你抽了今天的第一管血，贴好标签放进冰箱。样本编号是N=1-037。',
    'bio_all_in': '辞职了。你把工牌放在桌上，带走的只有一个装着论文的U盘。',
    'bio_breakthrough_news': '你读完那篇论文，在页边空白处写了三个字："等三年。"',
    'bio_friend_warning': '他说完"你疯了"就挂了电话。你看了看桌上的补剂，没动。',
  };

  function applyGeoArbitrage(newCity: CityType) {
    if (newCity === state.value.currentCity) {
      showCitySelect.value = false;
      return;
    }
    const cost = 20000;
    state.value.currentSavings -= cost;
    switchCity(state.value, newCity);
    addLog(`第${state.value.currentAge}岁，你从原来的城市移居到${newCity}，搬家安置花费${cost}元，开启地缘套利模式。`);
    showCitySelect.value = false;
  }
  
  // ========== 十字路口选择 ==========
  // #1修复：暂存十字路口效果，供commitYear追踪wellbeingChanges
  const pendingCrossroadEffect = ref<{ savings: number; stress: number; happiness: number; health: number; passiveIncome: number; salary: number } | null>(null);

  function selectCrossroadOption(optionId: string) {
    const crossroad = currentCrossroad.value;
    if (!crossroad) return;
    
    const option = crossroad.options.find(o => o.id === optionId);
    if (!option) return;

    // #1修复：记录十字路口前的快照
    const snap = {
      savings: state.value.currentSavings,
      stress: state.value.stress,
      happiness: state.value.happiness,
      health: state.value.health,
      passiveIncome: state.value.passiveIncome,
      salary: state.value.currentMonthlySalary,
    };

    // 应用选项效果
    const stressBeforeCross = state.value.stress;
    const salaryBeforeCross = state.value.currentMonthlySalary;
    const result = option.effect(state.value);
    addLog(result.log);
    // 记录十字路口选项导致的薪资变化
    const salaryDiffCross = state.value.currentMonthlySalary - salaryBeforeCross;
    if (salaryDiffCross !== 0) {
      const sign = salaryDiffCross > 0 ? '+' : '-';
      addLog(`第${state.value.currentAge}岁，月薪从¥${salaryBeforeCross.toLocaleString()}调整为¥${state.value.currentMonthlySalary.toLocaleString()}（${sign}¥${Math.abs(salaryDiffCross).toLocaleString()}）。`);
    }

    // v11: 压力抑制机制——高压时十字路口压力加成也被削减
    if (state.value.stress > stressBeforeCross) {
      const stressAdd = state.value.stress - stressBeforeCross;
      let dampenedAdd = stressAdd;
      if (stressBeforeCross > 90) {
        dampenedAdd = Math.round(stressAdd * 0.30);
      } else if (stressBeforeCross > 75) {
        dampenedAdd = Math.round(stressAdd * 0.60);
      }
      state.value.stress = Math.min(100, stressBeforeCross + dampenedAdd);
    }

    // #1修复：暂存十字路口效果差值，供commitYear的wellbeingChanges追踪
    pendingCrossroadEffect.value = {
      savings: state.value.currentSavings - snap.savings,
      stress: state.value.stress - snap.stress,
      happiness: state.value.happiness - snap.happiness,
      health: state.value.health - snap.health,
      passiveIncome: state.value.passiveIncome - snap.passiveIncome,
      salary: state.value.currentMonthlySalary - snap.salary,
    };

    // 记录冷却
    crossroadFiredTags.value.set(crossroad.tag, state.value.currentAge);
    
    // 同步 Map 到 state（用于持久化）
    state.value.crossroadFired = Object.fromEntries(crossroadFiredTags.value);
    
    // 清除十字路口状态
    currentCrossroad.value = null;
    showCrossroad.value = false;

    // #2修复：十字路口年不再强制抽取叙事事件——给玩家喘息空间
    // 玩家直接进入"度过这一年"流程，commitYear会处理结算
    currentNarrativeEvent.value = null;
    selectedNarrativeOptionId.value = null;

    scheduleSave(state.value);
  }
  
  // ========== 叙事事件系统（替代三卡抽卡） ==========

  // 平静/休养生息年份文本池（按年龄段分配）
  const CALM_YEAR_TEXTS: Record<string, string[]> = {
    // 22-30岁：适应、摸索、习惯成年人节奏
    young: [
      '这一年没什么大事，但你开始习惯了成年人的节奏。',
      '日子像按了快进键，周末总是来得太快。',
      '学会了一个人吃饭，一个人去医院。',
      '工作慢慢上手了，但也说不上喜欢，只是不那么慌了。',
      '房租又涨了，你换了个更远的地方，每天通勤多了二十分钟。',
      '这一年你搬了两次家，终于明白"定居"两个字有多奢侈。',
      '朋友聚会越来越少，大家都开始忙了。',
      '你开始记账了，虽然月底还是不知道钱花哪了。',
      '给家里打电话的频率从一周一次变成了两周一次，你有点愧疚。',
      '这一年你学会了很多小事：换灯泡、通下水道、跟中介砍价。',
    ],
    // 31-40岁：疲惫、小确幸、中年初体验
    middle: [
      '生活没什么惊喜也没什么意外，你开始觉得这就是幸福。',
      '体检报告上多了两个箭头，你默默加了个早睡闹钟。',
      '周末哪儿都不想去，在家躺着就是最好的度假。',
      '你开始喝热水了，不用别人提醒。',
      '发现自己熬不动夜了，十二点前必须睡。',
      '偶尔会想起年轻时的梦想，然后摇摇头继续搬砖。',
      '工资涨了，但快乐好像没怎么涨。',
      '这一年去了好几次医院，不是自己就是家人。',
      '你开始认真考虑买房的事了，虽然首付还差很远。',
      '老同学的朋友圈从晒自拍变成了晒娃，你有点恍惚。',
      '发现自己开始掉头发了，网购了第一瓶防脱洗发水。',
    ],
    // 41-50岁：平静、接受、与自己和解
    mature: [
      '平静是这个年纪最大的奢侈品。',
      '不再强求什么，日子过一天是一天但也没什么不好。',
      '老朋友越来越少，剩下的越来越重要。',
      '你终于接受了自己是个普通人这件事。',
      '开始喜欢在家做饭，外面的饭吃不动了。',
      '话变少了，不是没话说，是觉得没必要说了。',
      '身体开始各种小毛病，但你已经学会和它们共处。',
      '看着镜子里的自己，白头发又多了几根。',
      '对很多事都看开了，不再争强好胜。',
      '这一年你推掉了很多应酬，回家陪家人的时间多了。',
    ],
    // 51-60岁：回忆、感恩、等待退休
    senior: [
      '开始喜欢翻旧照片了。',
      '日子慢了下来，你开始享受这种慢。',
      '等退休的日子里，每天都在数倒计时。',
      '你开始整理这些年的东西，该扔的扔，该留的留。',
      '和老同事聊天的话题从"升职"变成了"退休金"。',
      '早上醒得越来越早，起来去公园散散步。',
      '开始研究养生了，枸杞泡茶成了标配。',
      '对年轻人的世界越来越看不懂了，但也不想懂了。',
      '这一年你回了好几次老家，发现父母真的老了。',
      '你开始想退休后要做什么，却发现想做的事其实不多。',
      '时间过得越来越快，一年像一个月。',
    ],
    // 延期退休阶段专用（已过路径退休年龄但未达标）
    delayed: [
      '退休的目标似乎越来越近，又好像越来越远。',
      '你告诉自己再多撑一年，就一年。',
      '看着存款数字，你深吸一口气，继续干吧。',
      '同龄人中有人已经退休了，你嘴上说不急，心里还是有点慌。',
      '这一年你比以前更拼命了，时间不等人。',
      '你开始认真考虑是不是该降低退休预期了。',
      '身体在提醒你不年轻了，但钱包还没准备好。',
      '又过了一年，离60岁又近了一步。',
    ],
  };

  function getCalmYearText(age: number, delayed: boolean = false): string {
    if (delayed) {
      const pool = CALM_YEAR_TEXTS.delayed;
      return `第${age}岁，${pool[Math.floor(Math.random() * pool.length)]}`;
    }
    let pool: string[];
    if (age <= 30) pool = CALM_YEAR_TEXTS.young;
    else if (age <= 40) pool = CALM_YEAR_TEXTS.middle;
    else if (age <= 50) pool = CALM_YEAR_TEXTS.mature;
    else pool = CALM_YEAR_TEXTS.senior;
    return `第${age}岁，${pool[Math.floor(Math.random() * pool.length)]}`;
  }

  // 休养生息专用文本（更强调恢复、放松）
  const REST_YEAR_TEXTS: Record<string, string[]> = {
    young: [
      '这一年你没有刻意追求什么。推掉了不必要的应酬，每天早睡早起，周末去公园散步。压力像退潮的海水慢慢退去，你重新感受到了生活的质感。',
      '这一年你按下了暂停键。读了几本一直想读的书，给家人做了很多顿饭。虽然存款没怎么涨，但心里那块紧绷的弦终于松了。',
      '休养生息的一年。你学会了对不必要的事情说"不"，把时间还给了自己。体检报告上的箭头少了几个，镜子里的自己看起来精神了不少。',
      '这一年你刻意放慢了脚步。学会了做饭，开始跑步，周末不再宅在家里叫外卖。虽然没赚什么大钱，但状态好了很多。',
    ],
    middle: [
      '这一年你学着放过自己。不再跟别人比薪资、比职位、比房子，周末带家人去郊外走走，发现幸福其实不需要那么多钱。',
      '休养生息的一年。戒了一段时间的酒，每天饭后散步半小时，晚上十点准时睡觉。身体的各种小毛病好像都安分了一些。',
      '这一年你减少了加班，推掉了很多无意义的饭局。晚上陪孩子写作业，周末陪老人聊聊天。日子平淡，但心里踏实。',
      '你给自己放了个假，去了一趟一直想去的地方。回来后发现很多事情没你想的那么重要，身体才是革命的本钱。',
    ],
    mature: [
      '这一年你开始真正关注自己的身体。每天晨练，饮食清淡，定期体检。有些东西是时候放下了，包括那些不必要的执念。',
      '平静的一年。你不再勉强自己融入不喜欢的圈子，不再为了面子消费。日子简单了，反而轻松了。',
      '休养生息的一年。种花、养鱼、听戏，你开始培养一些"没用"的爱好。朋友说你变佛系了，你笑笑不说话。',
      '这一年你想通了很多事。工作不是生活的全部，健康地活着、陪爱的人在一起，比什么都重要。',
    ],
    senior: [
      '这一年你开始为退休做准备了。调整了作息，培养了几个爱好，甚至开始研究养老金怎么领。虽然还没退，但心已经开始慢下来了。',
      '休养生息的一年。每天早起打太极，买菜做饭，下午看报纸晒太阳。同事说你越来越像退休老头了，你说这叫未雨绸缪。',
      '这一年你把很多事情交给了年轻人，自己只做最重要的事。不再争强好胜，身体要紧，平安是福。',
      '你开始清理自己的社交圈，只留下最重要的几个人。其余的，随缘吧。',
    ],
  };

  function getRestYearText(age: number): string {
    let pool: string[];
    if (age <= 30) pool = REST_YEAR_TEXTS.young;
    else if (age <= 40) pool = REST_YEAR_TEXTS.middle;
    else if (age <= 50) pool = REST_YEAR_TEXTS.mature;
    else pool = REST_YEAR_TEXTS.senior;
    return `第${age}岁，${pool[Math.floor(Math.random() * pool.length)]}`;
  }

  /** 抽取当年的叙事事件 */
  function drawNarrativeEvent() {
    // 生成新年的心境独白
    generateYearOpeningMonologue();

    // 先检测是否触发十字路口
    const crossroad = detectCrossroad(state.value, crossroadFiredTags.value);
    if (crossroad) {
      currentCrossroad.value = crossroad;
      showCrossroad.value = true;
      currentNarrativeEvent.value = null;
      selectedNarrativeOptionId.value = null;
      return;
    }

    // 没有十字路口，正常抽取叙事事件
    currentCrossroad.value = null;
    showCrossroad.value = false;

    // 延期退休阶段：50%概率为平静年份（不抽事件，直接休养生息）
    if (isDelayedRetirementPhase(state.value) && Math.random() < 0.5) {
      currentNarrativeEvent.value = null;
      selectedNarrativeOptionId.value = null;
      return;
    }

    const event = selectNarrativeEvent(state.value, state.value.narrativeEventFired || {});
    currentNarrativeEvent.value = event;
    selectedNarrativeOptionId.value = null;
  }

  /** 玩家选择叙事事件的某个选项 */
  function selectNarrativeOption(optionId: string) {
    selectedNarrativeOptionId.value = optionId;
  }

  /** 应用选中的叙事选项（内部函数，由commitYear调用） */
  function applyNarrativeOption(): {
    logs: string[];
    totalCost: number;
    isRestYear: boolean;
    cardDetails: { title: string; log: string; before: { stress: number; happiness: number; health: number; savings: number } }[];
  } {
    const logs: string[] = [];
    const cardDetails: { title: string; log: string; before: { stress: number; happiness: number; health: number; savings: number } }[] = [];
    let totalCost = 0;

    const event = currentNarrativeEvent.value;
    const optionId = selectedNarrativeOptionId.value;

    // 没有事件或没选选项 = 休养生息（v10校准：增强恢复效果，高压时恢复更多）
    if (!event || !optionId) {
      let stressRelief = 14;
      let healthGain = 8;
      let happinessGain = 6;
      if (state.value.stress > 95) { stressRelief += 12; healthGain += 4; happinessGain += 3; }
      else if (state.value.stress > 85) { stressRelief += 8; healthGain += 3; happinessGain += 2; }
      else if (state.value.stress > 70) { stressRelief += 5; healthGain += 2; }
      // MBTI人格休养加成（INTP/ISFP等内省型恢复更快）
      const mbtiRestMech = getActiveMBTIMechanics(state.value);
      if (mbtiRestMech) stressRelief += mbtiRestMech.restBonus;
      state.value.stress = Math.max(0, state.value.stress - stressRelief);
      state.value.health = Math.min(100, state.value.health + healthGain);
      state.value.happiness = Math.min(100, state.value.happiness + happinessGain);
      // 使用按年龄段分配的休养生息文本
      const restLog = getRestYearText(state.value.currentAge);
      logs.push(restLog);
      // 不直接addLog，yearLog会包含它
      return { logs, totalCost, isRestYear: true, cardDetails };
    }

    const option = event.options.find(o => o.id === optionId);
    if (!option) {
      // 无效选项，当作休养生息
      return { logs, totalCost, isRestYear: true, cardDetails };
    }

    const beforeOption = {
      stress: state.value.stress,
      happiness: state.value.happiness,
      health: state.value.health,
      savings: state.value.currentSavings,
    };

    // 应用技能增益（上限100，50以上边际递减）
    if (option.skillGains) {
      if (!state.value.pathSkills) state.value.pathSkills = {};
      for (const [skill, gain] of Object.entries(option.skillGains)) {
        const current = state.value.pathSkills[skill] || 0;
        if (current >= 100) continue; // 已达上限，不再增长
        let effectiveGain = gain;
        if (current > 50) {
          // 50以上边际递减：每超1点衰减1%，最低保留10%
          const decay = Math.max(0.1, 1 - (current - 50) / 100);
          effectiveGain = Math.round(gain * decay);
        }
        state.value.pathSkills[skill] = Math.min(100, current + effectiveGain);
      }
    }

    // 应用存款变化
    if (option.savingsChange) {
      state.value.currentSavings += option.savingsChange;
      // 负的 savingsChange = 支出，正的 = 收入
      if (option.savingsChange < 0) {
        totalCost = Math.abs(option.savingsChange);
      }
    }

    // 应用月薪变化
    if (option.salaryChange) {
      const salaryBefore = state.value.currentMonthlySalary;
      state.value.currentMonthlySalary = Math.max(0, state.value.currentMonthlySalary + option.salaryChange);
      const salaryAfter = state.value.currentMonthlySalary;
      const diff = salaryAfter - salaryBefore;
      if (diff !== 0) {
        const sign = diff > 0 ? '+' : '-';
        // 注意：薪资变动日志不直接addLog到lifeLog，避免与yearLog重复；
        // 但为了保持记录完整性，添加年龄前缀后放入logs数组供yearLog参考
        logs.push(`第${state.value.currentAge}岁，月薪从¥${salaryBefore.toLocaleString()}调整为¥${salaryAfter.toLocaleString()}（${sign}¥${Math.abs(diff).toLocaleString()}）。`);
      }
    }

    // 应用被动收入变化
    if (option.passiveIncomeChange) {
      state.value.passiveIncome += option.passiveIncomeChange;
    }

    // 应用自定义状态效果
    if (option.stateEffect) {
      const stressBefore = state.value.stress;
      option.stateEffect(state.value);

      // v12: 压力抑制机制重做——大幅削弱，让压力爆表成为真实威胁
      // 旧版>75就砍40%、>90砍70%，导致压力永远到不了100，精神崩溃形同虚设
      // 新版：只在极高压力（>95）时轻微削减，给玩家真实的崩溃风险
      if (state.value.stress > stressBefore) {
        const stressAdd = state.value.stress - stressBefore;
        let dampenedAdd = stressAdd;
        if (stressBefore > 95) {
          // 压力>95时，事件压力加成只保留60%（给最后一线喘息空间）
          dampenedAdd = Math.round(stressAdd * 0.60);
        } else if (stressBefore > 88) {
          // 压力>88时，事件压力加成只保留80%（接近极限时轻微缓冲）
          dampenedAdd = Math.round(stressAdd * 0.80);
        }
        state.value.stress = Math.min(100, stressBefore + dampenedAdd);
      }
    }

    // 分支切换
    if (option.branchSwitch) {
      state.value.narrativeBranch = option.branchSwitch;
    }

    // 如果选项标记触发退休判定
    if (option.triggersRetirementCheck) {
      const path = getPath(state.value.retirementPath);
      if (path && path.checkSuccess(state.value)) {
        state.value.pathEndgameTriggered = true;
        // 不再自动结算退休——只标记"你已走通这条路"，退休按钮由玩家自主决定
        if (!state.value.canRetire) {
          state.value.canRetire = true;
          addLog(`第${state.value.currentAge}岁，你终于走通了这条路的后半段。曾经的"也许某天"变成了"就是今天"。但你突然不那么急着按下退休键了——你花了半辈子追这条路，现在终于站在了终点，你想多站一会儿，好好看看沿途没来得及看的风景。退休键一直闪着，由你决定何时按下。`);
        }
      }
    }

    const isRestYear = option.isRestOption || false;

    // 记录日志（注意：option.log 通过 logs 数组传给 buildYearLog 作为年度总结，
    // 不直接 addLog，避免在 lifeLog 中与 yearLog 重复显示）
    logs.push(option.log);
    // 兜底：如果事件标题为空，使用默认标题
    const eventTitle = (event.title && event.title.trim()) || '日常';
    cardDetails.push({ title: eventTitle, log: option.log, before: beforeOption });

    // 标记事件已触发
    if (!state.value.narrativeEventFired) state.value.narrativeEventFired = {};
    state.value.narrativeEventFired[event.id] = state.value.currentAge;

    // === 盲盒注册：当选项标记了 blindBoxTrigger 时，注册对应的延迟盲盒 ===
    if (option.blindBoxTrigger) {
      const triggerId = option.blindBoxTrigger;
      const outcomes = BLIND_BOX_OUTCOMES.filter(o => matchTrigger(o.triggerCardId, triggerId));
      const sorted = outcomes.sort((a, b) => a.delayYears - b.delayYears);
      const matched = sorted.find(o => o.condition(state.value));
      if (matched) {
        if (!state.value.pendingBlindBoxes) state.value.pendingBlindBoxes = [];
        // 防重复：同一triggerId同一delayYears只注册一次
        const key = `${triggerId}:${matched.delayYears}`;
        if (!registeredBlindBoxKeys.has(key)) {
          state.value.pendingBlindBoxes.push({
            outcomeId: matched.id,
            triggerAge: state.value.currentAge + matched.delayYears,
            // 修复#4：存储触发卡片ID和延迟年数，揭晓时根据当前状态重新评估条件
            triggerCardId: triggerId,
            delayYears: matched.delayYears,
          });
          registeredBlindBoxKeys.add(key);
          // 添加悬念提示
          const hint = suspenseHints[triggerId] || '你做了一个决定。这个决定会在未来某个时刻，以你意想不到的方式产生影响。';
          addLog(hint);
          logs.push(hint);
        }
      }
    }

    // 清除当前事件
    currentNarrativeEvent.value = null;
    selectedNarrativeOptionId.value = null;

    return { logs, totalCost, isRestYear, cardDetails };
  }

  // ========== 年度工作小结生成 ==========
  // 根据薪资变动明细生成一句话叙事，让玩家感知到今年工作上发生了什么
  function generateWorkSummary(state: GameState, breakdown: SalaryChangeEntry[], totalDelta: number): string {
    if (state.isUnemployed && state.currentMonthlySalary === 0) {
      return '今年失去了工作来源，正在寻找新的机会。';
    }
    if (totalDelta === 0) {
      return '今年工作按部就班，薪资没有变化。';
    }

    // 找出影响最大的因素
    const sorted = [...breakdown].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    const mainFactor = sorted[0];

    if (totalDelta > 0) {
      const pct = state.currentMonthlySalary > 0
        ? Math.round(totalDelta / (state.currentMonthlySalary - totalDelta) * 100)
        : 0;
      if (mainFactor?.source === '35岁危机') {
        return `今年遭遇了职场的35岁关口，薪资有所调整，但仍在坚持。`;
      }
      if (mainFactor?.source === '涨薪封顶') {
        return `今年虽然表现不错，但薪资已到天花板，增长受限。`;
      }
      if (mainFactor?.source === '工作突破') {
        return `${mainFactor.note || '今年工作上迎来了重要突破'}，月薪增长${pct}%。`;
      }
      if (mainFactor?.source === '技能提升' || mainFactor?.source === '技能驱动') {
        return `专业能力持续精进，带动薪资稳步提升${pct > 0 ? '约' + pct + '%' : ''}。`;
      }
      if (mainFactor?.source === '黄金年龄') {
        return `正值职业黄金期，经验和精力都在最佳状态，薪资水涨船高。`;
      }
      if (mainFactor?.source === '行业红利') {
        return `赶上了行业的红利期，薪资跟着行业大势上涨。`;
      }
      if (mainFactor?.source === '经济萧条' || mainFactor?.source === '事业遇冷') {
        return `虽然大环境不景气，但你的收入依然保持了小幅增长。`;
      }
      if (mainFactor?.source === '接单丰收' || mainFactor?.source === '好运连连') {
        return `今年运势不错，接到了好项目/好客户，收入有明显提升。`;
      }
      if (mainFactor?.source === '成就达成') {
        return `能力突破带来了薪资的跃升。`;
      }
      if (mainFactor?.source === '增长瓶颈' || mainFactor?.source === '收入触顶') {
        return `事业进入平台期，收入增速放缓。`;
      }
      if (state.isAllInPath) {
        return `事业稳步推进，收入${pct > 0 ? '增长约' + pct + '%' : '小幅调整'}。`;
      }
      return `今年薪资稳步上调${pct > 0 ? '约' + pct + '%' : ''}，${mainFactor?.note || '工作表现获得认可'}。`;
    } else {
      // 降薪
      const pct = Math.round(Math.abs(totalDelta) / (state.currentMonthlySalary - totalDelta) * 100);
      if (mainFactor?.source === '35岁危机') {
        return `35岁这一年，行业优化来袭，薪资下调约${pct}%，前路变得艰难。`;
      }
      if (mainFactor?.source === '经济萧条') {
        return `经济大环境不景气，公司冻薪降薪，收入缩水约${pct}%。`;
      }
      if (mainFactor?.source === '接单困难') {
        return `今年客源减少、项目不顺，收入下降约${pct}%。`;
      }
      if (mainFactor?.source === '年龄瓶颈') {
        return `年龄增长带来职场竞争力下降，薪资停滞不前。`;
      }
      if (mainFactor?.source === '事业遇冷') {
        return `事业遭遇寒流，收入下降约${pct}%。`;
      }
      if (mainFactor?.source === '薪资调整') {
        return `${mainFactor.note || '工作发生变动'}，薪资下调约${pct}%。`;
      }
      if (mainFactor?.source === '失业') {
        return '失去了工作，月薪归零。';
      }
      return `今年薪资有所下调${pct > 0 ? '约' + pct + '%' : ''}，需要加倍努力。`;
    }
  }

  // ========== 年度结算防重复执行守卫 ==========
  let isCommitting = false;

  // ========== 年度结算核心 ==========
  function commitYear() {
    if (state.value.endingTriggered) return;
    if (isCommitting) return; // 防重复执行守卫
    isCommitting = true;

    try {
    // 判断叙事转场类型
    let transition = 'default';
    const narrEvent = currentNarrativeEvent.value;
    if (narrEvent?.eventType === 'crisis') transition = 'crisis';
    else if (narrEvent?.eventType === 'milestone') transition = 'gold';
    else if (state.value.pendingAftermath || state.value.health < 25 || state.value.stress > 90) {
      transition = 'crisis';
    }

    cardTransitionType.value = transition;

    // 记录年初基准值
    const yearStartSavings = state.value.currentSavings;
    const prevStress = state.value.stress;
    const prevHappiness = state.value.happiness;
    const prevHealth = state.value.health;
    const prevPassiveIncome = state.value.passiveIncome;
    const prevMonthlySalary = state.value.currentMonthlySalary; // 年初月薪，用于结算面板显示薪资变化
    const yearStartSalary = state.value.currentMonthlySalary; // 年度涨薪封顶用：记录年初薪资基准
    // 保存年初技能快照，用于信念值漂移判断
    (state.value as any)._prevPathSkills = { ...(state.value.pathSkills || {}) };
    const prevUnemployed = state.value.isUnemployed;
    const wasMarried = state.value.isMarried;
    const hadProperty = state.value.hasProperty;
    // 初始化成就集合
    if (!state.value.unlockedAchievements) state.value.unlockedAchievements = [];
    const achievementSet = new Set(state.value.unlockedAchievements);

    // 用于按来源追踪变化
    const wellbeingChanges: { source: string; stress: number; happiness: number; health: number; savings: number }[] = [];
    // 薪资变动明细收集
    const salaryBreakdown: SalaryChangeEntry[] = [];

    // 辅助函数：快照当前值
    const snapshot = () => ({
      stress: state.value.stress,
      happiness: state.value.happiness,
      health: state.value.health,
      savings: state.value.currentSavings,
    });

    // 辅助函数：记录某来源带来的变化
    const recordChange = (source: string, before: { stress: number; happiness: number; health: number; savings: number }) => {
      const entry = {
        source,
        stress: state.value.stress - before.stress,
        happiness: state.value.happiness - before.happiness,
        health: state.value.health - before.health,
        savings: state.value.currentSavings - before.savings,
      };
      if (entry.stress !== 0 || entry.happiness !== 0 || entry.health !== 0 || entry.savings !== 0) {
        wellbeingChanges.push(entry);
      }
      return entry;
    };

    // 1. 应用选中的叙事选项
    const beforeCards = snapshot();
    const cardResult = applyNarrativeOption();
    const cardLogs = cardResult.logs;
    const cardCost = cardResult.totalCost;
    const isRestYear = cardResult.isRestYear;
    if (isRestYear) {
      recordChange('休养生息', beforeCards);
    } else {
      // 逐张卡片记录变化
      for (const detail of cardResult.cardDetails) {
        recordChange(detail.title, detail.before);
      }
    }

    // 2. 处理体检buff重置
    state.value.didHealthCheck = false; // 体检只保护一年

    // 2.5 处理人际关系年度结算（可能修改 savings/stress/happiness/health）
    const beforeRelationships = snapshot();
    // 跨系统去重：过滤与最近渲染文本重复的关系日志
    const relationshipLogs = filterSharedRecent(processRelationships(state.value));
    recordChange('relationships', beforeRelationships);
    for (const log of relationshipLogs) {
      addLog(log);
    }

    // 2.6 恋爱系统：处理遇见、约会、暧昧、分手、求婚等
    const beforeRomance = snapshot();
    const romanceResult = processRomanceYear(state.value);
    // 跨系统去重：过滤与最近渲染文本重复的恋爱日志（不影响大事件/阶段推进）
    const romanceLogs = filterSharedRecent(romanceResult.logs);
    recordChange('romance', beforeRomance);
    for (const log of romanceLogs) {
      addLog(log);
    }

    // 3. 年度调薪（在结算前）
    if (!state.value.isUnemployed) {
      const salaryBefore = state.value.currentMonthlySalary;
      const raiseBreakdown = applySalaryRaise(state.value);
      const salaryAfter = state.value.currentMonthlySalary;
      const salaryDiff = salaryAfter - salaryBefore;
      // 收集系统调薪的明细
      salaryBreakdown.push(...raiseBreakdown);
      if (salaryDiff > 0) {
        addLog(`第${state.value.currentAge}岁，月薪从¥${salaryBefore.toLocaleString()}调整为¥${salaryAfter.toLocaleString()}（+¥${salaryDiff.toLocaleString()}）。`);
      } else if (salaryDiff < 0) {
        addLog(`第${state.value.currentAge}岁，月薪从¥${salaryBefore.toLocaleString()}调整为¥${salaryAfter.toLocaleString()}（-¥${Math.abs(salaryDiff).toLocaleString()}）。`);
      }
    }

    // 4. 经济周期随机变化
    const cycleRoll = Math.random();
    if (cycleRoll < 0.15) state.value.economicCycle = 0; // 繁荣
    else if (cycleRoll < 0.75) state.value.economicCycle = 1; // 平稳
    else state.value.economicCycle = 2; // 萧条

    // 4.5 链上持仓年度市场自然增长（"链上洼地"修复：持仓此前只靠事件驱动、无法积累）
    if (state.value.retirementPath === 'chain_native') {
      applyAnnualChainGrowth(state.value);
    }

    // 4.5 滚动日常琐事（削减为每年1条，腾出空间给恋爱/大事件）
    // 按每条事件逐条记录变化，用于收支/变化来源面板展示
    const dailyLogs: string[] = [];
    // 过滤近3年已触发过的日常事件 + 感冒免疫检查
    const allDailyEvents = rollDailyEvents(state.value, 10); // 多取一些用于过滤
    const nowAge = state.value.currentAge;
    const firedDaily = state.value.firedDailyEvents;
    const lastColdYear = state.value.lastColdYear || 0;
    const filteredDailyEvents = allDailyEvents.filter(evt => {
      // 近5年去重
      if (firedDaily && firedDaily[evt.id] !== undefined) {
        if (nowAge - firedDaily[evt.id] < 5) return false;
      }
      // 感冒/生病类事件免疫检查（label含"病"或text含"感冒""发烧""生病"且effects.health<0）
      const isIllnessEvent = (evt.label?.includes('病') || /感冒|发烧|生病|流感/.test(evt.text))
        && (evt.effects?.health !== undefined && evt.effects.health < 0);
      if (isIllnessEvent && lastColdYear > 0 && nowAge - lastColdYear < 3) {
        return false;
      }
      return true;
    });
    const dailyEvents = filteredDailyEvents.slice(0, 1);
    for (const evt of dailyEvents) {
      const beforeEvt = snapshot();
      const evtLogs = applyDailyEventEffects(state.value, evt);
      dailyLogs.push(evt.text, ...evtLogs);
      recordChange(evt.label || '日常琐事', beforeEvt);
      // 记录已触发的日常事件（用于年度去重）
      state.value.firedDailyEvents[evt.id] = nowAge;
      // 感冒/生病类事件记录lastColdYear
      const isIllnessEvent = (evt.label?.includes('病') || /感冒|发烧|生病|流感/.test(evt.text))
        && (evt.effects?.health !== undefined && evt.effects.health < 0);
      if (isIllnessEvent) {
        state.value.lastColdYear = nowAge;
      }
    }
    // 清理5年以前的firedDailyEvents记录
    for (const eid of Object.keys(state.value.firedDailyEvents)) {
      if (nowAge - state.value.firedDailyEvents[eid] >= 5) {
        delete state.value.firedDailyEvents[eid];
      }
    }
    const dailyEventFinancialChange = dailyLogs.length > 0
      ? wellbeingChanges.filter(e => !['naturalDrift', 'cards', 'blackSwan', 'echoes', 'blindBoxes', 'relationships', 'romance'].includes(e.source))
          .reduce((sum, e) => sum + e.savings, 0)
      : 0;
    state.value.dailyEventLog = dailyLogs;
    // 只addLog叙事文本（evt.text），不addLog数值变化日志（如"压力+3（40->43）"）
    // 跨系统去重：过滤与最近渲染文本重复的日常叙事
    const dailyTexts = filterSharedRecent(dailyEvents.map(evt => evt.text));
    for (const t of dailyTexts) {
      addLog(t);
    }

    // 4.6 检测并执行卡片连锁反应（可能修改 state）
    const beforeEchoes = snapshot();
    const echoResult = detectCardEchoes(state.value, state.value.pendingCardEchoes ?? []);
    state.value.pendingCardEchoes = echoResult.remaining;
    const echoLogs: string[] = [];
    for (const echo of echoResult.echoes) {
      echo.applyEffect(state.value);
      const echoText = echo.getText(state.value);
      echoLogs.push(echoText);
    }
    // 跨系统去重：过滤与最近渲染文本重复的回声连锁日志
    const filteredEchoLogs = filterSharedRecent(echoLogs);
    for (const t of filteredEchoLogs) {
      addLog(t);
    }
    const echoChange = recordChange('echoes', beforeEchoes);
    const echoFinancialChange = echoChange.savings;

    // 4.7 检测并执行盲盒揭晓（可能修改 savings/stress/happiness/health/passiveIncome）
    const beforeBlindBoxes = snapshot();
    const blindBoxResult = detectBlindBoxOutcomes(state.value, state.value.pendingBlindBoxes || []);
    state.value.pendingBlindBoxes = blindBoxResult.remaining;
    const blindBoxReveals: { text: string; emotion: string; effectSummary: string }[] = [];
    for (const outcome of blindBoxResult.outcomes) {
      // 记录每个盲盒的数值变化前
      const prevSavingsBB = state.value.currentSavings;
      const prevStressBB = state.value.stress;
      const prevHappinessBB = state.value.happiness;
      const prevHealthBB = state.value.health;
      const prevPassive = state.value.passiveIncome;

      outcome.applyEffect(state.value);
      const blindBoxText = outcome.getText(state.value);
      addLog(`📦 ${blindBoxText}`);
      // 不再推入dailyLogs，避免与blindBoxReveals重复

      // 生成数值变化摘要
      const changes: string[] = [];
      const savingsDiff = state.value.currentSavings - prevSavingsBB;
      const stressDiff = state.value.stress - prevStressBB;
      const happinessDiff = state.value.happiness - prevHappinessBB;
      const healthDiff = state.value.health - prevHealthBB;
      const passiveDiff = state.value.passiveIncome - prevPassive;

      if (savingsDiff !== 0) changes.push(`存款 ${prevSavingsBB.toLocaleString()} → ${state.value.currentSavings.toLocaleString()}`);
      if (stressDiff !== 0) changes.push(`压力 ${prevStressBB}→${state.value.stress}`);
      if (happinessDiff !== 0) changes.push(`幸福 ${prevHappinessBB}→${state.value.happiness}`);
      if (healthDiff !== 0) changes.push(`健康 ${prevHealthBB}→${state.value.health}`);
      if (passiveDiff !== 0) changes.push(`被动收入 +¥${passiveDiff.toLocaleString()}/年`);

      blindBoxReveals.push({
        text: blindBoxText,
        emotion: outcome.emotion,
        effectSummary: changes.length > 0 ? changes.join(' · ') : '',
      });
    }
    const blindBoxChange = recordChange('blindBoxes', beforeBlindBoxes);
    const blindBoxFinancialChange = blindBoxChange.savings;

    // 5. 触发黑天鹅事件
    const beforeBlackSwan = snapshot();
    const eventResult = rollRandomEvents(state.value);
    // 感冒免疫：如果触发了minor_illness（急性小病/感冒）且在免疫期内，撤销该事件
    const lastColdYearBS = state.value.lastColdYear || 0;
    if (eventResult.eventNames.includes('急性小病侵袭') && lastColdYearBS > 0 && nowAge - lastColdYearBS < 3) {
      // 撤销感冒事件的效果（minor_illness只扣6000元，不修改其他状态）
      eventResult.logs = eventResult.logs.filter(l => !l.includes('感冒把你按在床上'));
      eventResult.eventNames = eventResult.eventNames.filter(n => n !== '急性小病侵袭');
      eventResult.totalLoss = eventResult.totalLoss - 6000; // 感冒事件固定损失6000
    } else if (eventResult.eventNames.includes('急性小病侵袭')) {
      // 记录感冒年份
      state.value.lastColdYear = nowAge;
    }
    let blackSwanLoss = eventResult.totalLoss;
    if (eventResult.totalLoss !== 0) {
      // totalLoss > 0 表示损失，< 0 表示收益
      // apply the loss/gain: 损失即减去 totalLoss（正数时扣钱），负数时 totalLoss<0 表示 -负数 = +钱
      state.value.currentSavings -= eventResult.totalLoss;
    }
    if (eventResult.newAftermath) {
      state.value.pendingAftermath = {
        type: eventResult.newAftermath,
        remainingYears: eventResult.aftermathDuration || 2,
      };
    }
    recordChange('blackSwan', beforeBlackSwan);

    // 5.5 年度薪资涨幅封顶：防止事件涨薪+年度涨薪+成就涨薪叠加导致单年暴涨
    // 打工阶段单年涨幅不超过25%，All In后不超过50%（降薪不封顶）
    if (!state.value.isUnemployed && yearStartSalary > 0) {
      const beforeClamp = state.value.currentMonthlySalary;
      clampAnnualSalaryGrowth(state.value, yearStartSalary);
      const afterClamp = state.value.currentMonthlySalary;
      if (afterClamp < beforeClamp) {
        const clampDelta = afterClamp - beforeClamp;
        salaryBreakdown.push({ source: '涨薪封顶', amount: clampDelta, note: '单年涨幅过高，部分涨薪被封顶限制' });
      }
    }

    // 6. 执行年度财务结算（calculateYearlySettlement 内部会：
    //    - 记录 mortgageCost（不再直接扣减 savings）
    //    - 计算 netChange = totalIncome - (livingCost + insuranceCost + mortgageCost)
    //    - 将 netChange 加到 state.currentSavings
    //    - 应用身心自然漂移，并记录 naturalStressChange/HappinessChange/HealthChange
    // )
    const beforeSettlement = snapshot();
    const result = calculateYearlySettlement(state.value);
    recordChange('naturalDrift', beforeSettlement);
    // 注意：calculateYearlySettlement 中的身心变化就是"自然漂移"，
    // 其 savings 变化就是 netChange（已包含房贷扣减）。
    // 填充 result 的追踪字段
    result.cardLogs = cardLogs;
    result.cardDetails = cardResult.cardDetails.map(d => ({ title: d.title, log: d.log }));
    result.events = eventResult.logs;
    result.cardCost = cardCost;
    result.blackSwanLoss = blackSwanLoss;
    result.blackSwanEventNames = eventResult.eventNames;
    result.blindBoxFinancialChange = blindBoxFinancialChange;
    result.dailyEventFinancialChange = dailyEventFinancialChange;
    result.echoFinancialChange = echoFinancialChange;
    result.wellbeingChanges = wellbeingChanges;

    // 副业收入已结算入账，重置本年累积
    state.value.currentYearSideHustle = 0;

    // 记录日常琐事、人际关系、恋爱日志到 YearResult
    result.dailyEvents = dailyLogs;
    result.relationshipChanges = relationshipLogs;
    (result as any).romanceLogs = romanceLogs;
    (result as any).romanceBigEvent = romanceResult.isBigEvent;
    (result as any).romanceSceneAnimation = romanceResult.sceneAnimation;
    (result as any).echoLogs = echoLogs;

    // === 财务一致性校验 ===
    const trackedSavingsSum = wellbeingChanges.reduce((sum, e) => sum + e.savings, 0);
    const actualSavingsChange = state.value.currentSavings - yearStartSavings;
    const discrepancy = actualSavingsChange - trackedSavingsSum;
    if (Math.abs(discrepancy) > 1) {
      console.warn(`[财务校验] 追踪储蓄变化: ${trackedSavingsSum}, 实际变化: ${actualSavingsChange}, 差额: ${discrepancy}`);
    }

    // 最终变化
    result.stressChange = state.value.stress - prevStress;
    result.happinessChange = state.value.happiness - prevHappiness;
    result.healthChange = state.value.health - prevHealth;
    // 实际存款变化（包含所有因素：工资、开销、卡片、事件、盲盒等）
    (result as any).actualSavingsChange = state.value.currentSavings - yearStartSavings;
    // 年度月薪变化（涨薪/降薪/事件导致的薪资变化）
    const totalSalaryChange = state.value.currentMonthlySalary - prevMonthlySalary;
    (result as any).salaryChange = totalSalaryChange;

    // 补齐薪资变动明细：计算已追踪项总和，差额归入"事件影响"（卡片选择/盲盒/黑天鹅/失业/All In同步等）
    const trackedSalaryDelta = salaryBreakdown.reduce((sum, e) => sum + e.amount, 0);
    const residualDelta = totalSalaryChange - trackedSalaryDelta;
    if (Math.abs(residualDelta) >= 1) {
      // 判断是什么导致的差额
      let residualLabel = '事件影响';
      let residualNote = '本年卡片选择、盲盒或突发事件带来的薪资变动';
      if (state.value.isUnemployed && state.value.currentMonthlySalary === 0) {
        residualLabel = '失业';
        residualNote = '失去工作，月薪归零';
      } else if (residualDelta < -5000) {
        residualLabel = '薪资调整';
        residualNote = '工作变动或突发事件导致薪资下调';
      } else if (residualDelta > 5000) {
        residualLabel = '工作突破';
        residualNote = '重要选择或机遇带来薪资跃升';
      }
      salaryBreakdown.push({ source: residualLabel, amount: residualDelta, note: residualNote });
    }
    (result as any).salaryBreakdown = salaryBreakdown;

    // 生成年度工作小结（一句话叙事）
    const workSummary = generateWorkSummary(state.value, salaryBreakdown, totalSalaryChange);
    (result as any).workSummary = workSummary;

    lastYearResult.value = result;

    // 6.5 写入盲盒揭晓数据到YearResult
    if (blindBoxReveals.length > 0) {
      lastYearResult.value.blindBoxReveals = blindBoxReveals;
    }

    // 7. 后遗症年份递减
    if (state.value.pendingAftermath) {
      state.value.pendingAftermath.remainingYears -= 1;
      if (state.value.pendingAftermath.remainingYears <= 0) {
        const type = state.value.pendingAftermath.type;
        state.value.pendingAftermath = null;
        if (type === '心理阴影') {
          addLog(`第${state.value.currentAge}岁，你终于从那次心理阴影里走了出来，虽然想起还是会心痛，但你开始愿意接听陌生电话了。——后遗症【心理阴影】消退。`);
        } else if (type === '情感创伤') {
          addLog(`第${state.value.currentAge}岁，时间洗刷了情感的伤口，你重新开始参加朋友聚会，甚至愿意在菜单上点一份双人套餐。——后遗症【情感创伤】消退。`);
        } else if (type === '健康警示') {
          addLog(`第${state.value.currentAge}岁，你养成了定期体检的习惯，那个因为重病留下的'健康警示'终于被你用自律彻底拔除。——后遗症【健康警示】消退。`);
        } else if (type === '认知干扰') {
          addLog(`第${state.value.currentAge}岁，最后一层神经广告残留终于被认知清洗清除，你不再在梦里听见推销话术，记忆重新属于自己。——后遗症【认知干扰】消退。`);
        } else if (type === '医疗纠纷') {
          addLog(`第${state.value.currentAge}岁，官司终于落槌，不管结果如何，你从这场漫长的纠纷中解脱出来。——后遗症【医疗纠纷】消退。`);
        }
      }
    }

    // 7.5 检测成就解锁
    const newAchievements = checkAchievements(state.value, {
      prevSavings: yearStartSavings,
      prevPassiveIncome,
      prevHealth,
      prevUnemployed,
      wasMarried,
      hadProperty,
      age: state.value.currentAge,
    }, achievementSet);
    state.value.unlockedAchievements = Array.from(achievementSet);
    (result as any).newAchievements = newAchievements;

    // 7.6 检测叙事成就（技能达标触发）
    const narrAchievement = checkNarrativeAchievements(state.value);
    if (narrAchievement) {
      // 应用成就效果
      if (narrAchievement.savingsChange) {
        state.value.currentSavings += narrAchievement.savingsChange;
      }
      if (narrAchievement.salaryChange) {
        const achSalaryBefore = state.value.currentMonthlySalary;
        state.value.currentMonthlySalary = Math.max(0, state.value.currentMonthlySalary + narrAchievement.salaryChange);
        const achDiff = state.value.currentMonthlySalary - achSalaryBefore;
        if (achDiff !== 0) {
          salaryBreakdown.push({ source: '成就达成', amount: achDiff, note: `达成成就「${narrAchievement.title}」带来的薪资变化` });
          const sign = achDiff > 0 ? '+' : '-';
          addLog(`第${state.value.currentAge}岁，【成就】月薪从¥${achSalaryBefore.toLocaleString()}调整为¥${state.value.currentMonthlySalary.toLocaleString()}（${sign}¥${Math.abs(achDiff).toLocaleString()}）。`);
        }
      }
      if (narrAchievement.passiveIncomeChange) {
        state.value.passiveIncome += narrAchievement.passiveIncomeChange;
      }
      if (narrAchievement.stateEffect) {
        narrAchievement.stateEffect(state.value);
      }

      // 记录已触发成就
      if (!state.value.triggeredAchievements) state.value.triggeredAchievements = [];
      state.value.triggeredAchievements.push(narrAchievement.id);

      // 存储当前成就用于UI展示
      currentAchievement.value = {
        title: narrAchievement.title,
        narrative: narrAchievement.narrative,
        log: narrAchievement.log,
      };

      addLog(`★ ${narrAchievement.log}`);

      // 如果是终极成就，触发退休判定
      if (narrAchievement.triggersRetirementCheck) {
        const path = getPath(state.value.retirementPath);
        if (path && path.checkSuccess(state.value)) {
          state.value.pathEndgameTriggered = true;
          // 不再自动结算退休——只标记"你已走通这条路"，退休按钮由玩家自主决定
          if (!state.value.canRetire) {
            state.value.canRetire = true;
            addLog(`第${state.value.currentAge}岁，你完成了心中的那个终极目标。曾以为抵达终点就是终点，现在才发现，抵达只是给了你一个更从容的选择权。退休键一直闪着，由你决定何时按下。`);
          }
          return;
        }
      }
    }

    // 7.7 修复#7：成就涨薪纳入封顶计算——在成就处理之后再执行一次封顶
    // 防止年度涨薪+成就涨薪叠加导致单年暴涨（与5.5的封顶共用同一基准 yearStartSalary）
    if (!state.value.isUnemployed && yearStartSalary > 0) {
      const beforeAchClamp = state.value.currentMonthlySalary;
      clampAnnualSalaryGrowth(state.value, yearStartSalary);
      const afterAchClamp = state.value.currentMonthlySalary;
      if (afterAchClamp < beforeAchClamp) {
        const achClampDelta = afterAchClamp - beforeAchClamp;
        salaryBreakdown.push({ source: '涨薪封顶', amount: achClampDelta, note: '成就涨薪叠加后超出年度上限，部分涨薪被封顶' });
        // 同步更新 salaryChange
        (result as any).salaryChange = state.value.currentMonthlySalary - prevMonthlySalary;
      }
    }

    // 8. 记录日志（整合日常琐事和人际关系）
    // 注意：必须在递增 currentAge 之前调用 buildYearLog，否则日志里的年龄会偏移一年
    const yearLog = buildYearLog(state.value, result, cardLogs, eventResult.logs);
    addLog(yearLog);

    // 9. 年龄增长
    state.value.currentAge += 1;

    // 9.5 人生总账单：累计当年收入与支出到 lifetime 字段（结算完成后、检查结局之前）
    state.value.lifetimeSalary += result.salaryIncome || 0;
    state.value.lifetimeInvestmentGain += result.investmentGain || 0;
    // 副业收入 ≈ 被动收入 - 商铺租金（其余被动收入主要来自副业/二套房等）
    state.value.lifetimeSideHustle += Math.max(0, (result.passiveIncome || 0) - (result.shopRentIncome || 0));
    state.value.lifetimeLivingCost += result.livingCost || 0;
    state.value.lifetimeMortgage += result.mortgageCost || 0;
    // 养娃支出：从当前子女月开销推算（注意：已包含在 livingCost 中，账单展示时会从 livingCost 中拆出）
    state.value.lifetimeChildCost += state.value.children.reduce((sum, c) => sum + c.monthlyExpense * 12, 0);
    // 给父母支出：从人际关系来源的储蓄变化中提取（负值表示支出）
    const relChange = wellbeingChanges.find(e => e.source === 'relationships');
    if (relChange && relChange.savings < 0) {
      state.value.lifetimeParentCost += Math.abs(relChange.savings);
    }
    // 医疗支出：暂无独立字段，部分已包含在 livingCost（health<30 时额外5%）和黑天鹅事件中
    state.value.lifetimeMedicalCost += 0;
    state.value.lifetimeCardCost += result.cardCost || 0;
    state.value.lifetimeGiftMoney += 0;
    state.value.lifetimeInsuranceCost += result.insuranceCost || 0;

    // 10. 记录"财务自由达成"时刻（不拦截退休，仅作为叙事提示）
    if (state.value.retirementPath && !state.value.pathEndgameTriggered) {
      // 仅当达到财富/路径成功条件时，标记 canRetire 并给出"攒够了"的叙事提示。
      // 注意：退休按钮始终可用，canRetire 只是"财务底气已足"的成就标记，不构成门槛。
      if (checkCanRetire(state.value)) {
        if (!state.value.canRetire) {
          state.value.canRetire = true;
          addLog(`第${state.value.currentAge}岁，你已经攒够了退休的资本。数字告诉你"可以了"，但你的心还在问"够了吗"。也许"够了"从来不是一个数字，而是一个决定——一个你只能自己做的决定。退休的按钮从一开始就亮着，只是这一次，你真的有资格坦然按下它了。你可以继续，也可以停下。没有对错，只有你选择承担的那一种人生。`);
        }
      }
    }

    // 10.5 信念值自然漂移（v4平衡：增加正向来源，确保不同玩法都能逐步积累信念）
    if (state.value.retirementPath) {
      // 每年信念值缓慢漂移，压力高时下降，幸福高时上升
      let drift = 0;
      // 负向：压力与健康
      if (state.value.stress > 80) drift -= 2;  // 极高压轻微动摇（门槛从70提高到80）
      if (state.value.stress > 90) drift -= 1;  // 濒危压力再-1
      if (state.value.health < 30) drift -= 1;  // 健康很差时动摇（门槛从40降到30）
      if (result.netChange < 0) drift -= 1;     // 入不敷出时焦虑

      // 正向：多维度信念来源（确保不同玩法都能积累）
      if (state.value.happiness > 60) drift += 1; // 幸福时信念坚定（门槛从70降到60）
      if (state.value.happiness > 80) drift += 1; // 非常幸福再+1
      // 技能成长带来信念（只要有在成长，就坚定信心）
      const prevSkills = (state.value as any)._prevPathSkills;
      const currSkills = state.value.pathSkills || {};
      let skillGrew = false;
      if (prevSkills) {
        for (const k of Object.keys(currSkills)) {
          if ((currSkills as any)[k] > (prevSkills as any)[k]) { skillGrew = true; break; }
        }
      }
      if (skillGrew) drift += 1;
      // 存款增长带来安全感（年净收入为正且有一定积蓄）
      if (result.netChange > 0 && state.value.currentSavings > 200000) drift += 1;
      // 长期坚持带来信念（同一职业工作10年以上，每年缓慢积累信心）
      // 这帮助佛系玩家通过"坚持"来积累信念，而非只靠冒险选择
      if (state.value.totalYearsWorked >= 10 && !state.value.isUnemployed) drift += 1;
      // 信念值很低时的触底反弹（适度求生本能，但不过强，让信念崩塌成为真实威胁）
      if (state.value.pathFaith < 15) drift += 2;   // 信念极低：适度反思，+2
      if (state.value.pathFaith < 8) drift += 1;    // 濒临崩溃：最后挣扎，+1

      // 边际递减（v5：大幅增强递减，防止信念过快涨到90+触发All In）
      const faith = state.value.pathFaith;
      if (faith >= 70) {
        // 70-79: 正向漂移×0.7
        if (drift > 0) drift = Math.max(1, Math.floor(drift * 0.7));
      }
      if (faith >= 80) {
        // 80-84: 正向漂移×0.5
        if (drift > 0) drift = Math.max(1, Math.floor(drift * 0.5));
      }
      if (faith >= 85) {
        // 85-89: 正向漂移再-1
        if (drift > 0) drift = Math.max(1, drift - 1);
      }
      if (faith >= 90) {
        // 90-94: 正向漂移再-2，最低为0（可能不增长）
        if (drift > 0) drift = Math.max(0, drift - 2);
      }
      if (faith >= 95) {
        // 95+: 几乎不增长，正向漂移-5，最低为0
        if (drift > 0) drift = Math.max(0, drift - 5);
      }

      // MBTI人格信念修正：faithMultiplier>1时信念更坚定（正向漂移增强，负向漂移减弱）
      const mbtiMech = getActiveMBTIMechanics(state.value);
      if (mbtiMech) {
        drift = drift > 0 ? Math.round(drift * mbtiMech.faithMultiplier) : Math.round(drift / mbtiMech.faithMultiplier);
      }
      state.value.pathFaith = Math.max(0, Math.min(100, state.value.pathFaith + drift));

      // 信念崩塌：信念值跌到0，路径失败
      if (state.value.pathFaith <= 0 && !state.value.pathEndgameTriggered) {
        state.value.pathEndgameTriggered = true;
        addLog(`第${state.value.currentAge}岁，你看着镜子里的自己，突然意识到——你不再相信这条路了。不是因为它太难，而是因为你终于看清了：你一直在追的不是路，是路尽头的那个"更好的自己"。但那个自己从未存在过，它只是你用来逃避"现在的自己"的借口。你认输了。不是向命运认输——是向自己认输。`);
        triggerEarlyRetirement(false);
        return;
      }

      // 注：旧版有"超过路径退休年龄+5年自动失败"机制，
      // 现已移除——退休时机由玩家自主决定，60岁统一封顶。
      // 信念崩塌(pathFaith<=0)仍保留为唯一的路径失败触发器。
    }

    // 10.55 v12: 技能溢出转化——技能满级后仍有追求
    // 当最高技能>=80时，开始获得"专家级收入"（咨询费、讲课、专栏、顾问等）
    // 技能越高，收入越多，模拟真实人生中"成为专家后钱来找你"的效应
    if (state.value.retirementPath && state.value.pathSkills) {
      const skills = state.value.pathSkills;
      const maxSkill = Math.max(0, ...Object.values(skills));
      if (maxSkill >= 80) {
        // 80-89: 小有名气，每年少量专家收入
        // 90-94: 行业知名，中等专家收入
        // 95-100: 顶级专家，高额专家收入
        let expertIncome = 0;
        if (maxSkill >= 95) {
          expertIncome = 30000 + Math.floor(Math.random() * 50000); // 3-8万/年
        } else if (maxSkill >= 90) {
          expertIncome = 12000 + Math.floor(Math.random() * 20000); // 1.2-3.2万/年
        } else if (maxSkill >= 80) {
          expertIncome = 3000 + Math.floor(Math.random() * 8000); // 3000-1.1万/年
        }
        if (expertIncome > 0) {
          state.value.currentSavings += expertIncome;
          addLog(`第${state.value.currentAge}岁，你的专业能力得到了市场认可——有人找你做顾问、约你讲课、请你写专栏。这些额外收入${expertIncome.toLocaleString()}元，不算多，但它们是一种信号：你不再只是用时间换钱的人了。`);
        }
      }
    }

    // 10.6 自然年度恢复（v12重做：大幅削弱，让压力真的能压垮人）
    // 旧版高压下每年自动恢复3-5点，加上抑制机制，压力几乎到不了100
    // 新版：自然恢复减半，让高压状态更难缓解
    if (!isRestYear) {
      // 压力自然恢复：压力越高，恢复越多（但大幅减少）
      let naturalStressRelief = 0;
      if (state.value.stress > 85) naturalStressRelief = 2;
      else if (state.value.stress > 70) naturalStressRelief = 1;
      else if (state.value.stress > 50) naturalStressRelief = 0; // 50-70不自然恢复
      // MBTI人格日常调节（restBonus的1/3，不是1/2）
      const mbtiRestMechNatural = getActiveMBTIMechanics(state.value);
      if (mbtiRestMechNatural) naturalStressRelief += Math.floor(mbtiRestMechNatural.restBonus / 3);
      state.value.stress = Math.max(0, state.value.stress - naturalStressRelief);

      // 健康自然恢复：健康越差，恢复越多（身体的自愈机制）
      let naturalHealthGain = 0;
      if (state.value.health < 30) naturalHealthGain = 4;
      else if (state.value.health < 50) naturalHealthGain = 2;
      else if (state.value.health < 70 && state.value.stress < 50) naturalHealthGain = 1;
      state.value.health = Math.min(100, state.value.health + naturalHealthGain);

      // 幸福适应：极低幸福时缓慢回升（享乐适应）
      if (state.value.happiness < 30) {
        state.value.happiness = Math.min(100, state.value.happiness + 2);
      }
    }

    // 10.7 v12: 压力崩溃机制重做——降低门槛，让崩溃成为真实风险
    // 旧版：需要连续2年压力=100，但因为抑制机制几乎到不了100
    // 新版：连续2年压力≥95就触发，给玩家真实的"撑不住了"的风险
    if (state.value.stress >= 95) {
      state.value.consecutiveMaxStressYears = (state.value.consecutiveMaxStressYears || 0) + 1;
      if (state.value.consecutiveMaxStressYears >= 2) {
        // 触发崩溃（代价加重：身体真的垮了）
        const breakdownCost = 30000 + Math.floor(Math.random() * 30000); // 3-6万
        state.value.currentSavings = Math.max(-400000, state.value.currentSavings - breakdownCost);
        state.value.stress = 20 + Math.floor(Math.random() * 20); // 压力降到20-40（崩溃后大休整）
        state.value.health = Math.max(10, state.value.health - 12); // 健康-12（加重代价）
        state.value.happiness = Math.max(5, state.value.happiness - 15); // 幸福-15
        state.value.pathFaith = Math.max(0, state.value.pathFaith - 10); // 信念-10（崩溃会动摇信念）
        state.value.consecutiveMaxStressYears = 0; // 重置计数器
        const breakdownLogs = [
          `第${state.value.currentAge}岁，你终于撑不住了。在某个加班到凌晨的夜晚，你看着屏幕突然眼前一黑——醒来时已经在医院。医生说你需要彻底休息，什么都别想，什么都别做。这一次，身体替你做出了选择。`,
          `第${state.value.currentAge}岁，一根弦断了。你开始整夜失眠，白天对着屏幕发呆，什么都做不了。朋友帮你预约了心理咨询，你不得不停下来，面对那些你一直逃避的东西。`,
          `第${state.value.currentAge}岁，你崩溃了。没有任何预兆，只是某个普通的周二早上，你坐在床边，突然就哭了出来。你请了长假，关掉手机，回到了老家。你需要时间，很多很多时间。`,
          `第${state.value.currentAge}岁，体检报告上的箭头比去年多了一倍。医生看着报告皱眉头："你才多大啊，怎么把身体搞成这样？"你拿着报告走出医院，阳光很刺眼，你突然意识到——再这么拼下去，钱还没赚到，人先没了。`,
          `第${state.value.currentAge}岁，你在公司年会上喝多了，当着全公司的面吐了，然后就哭了。没人知道你为什么哭，你自己也不知道。第二天你提交了辞职信，不是因为想好了后路，只是因为——你真的撑不住了。`,
        ];
        addLog(breakdownLogs[Math.floor(Math.random() * breakdownLogs.length)]);
        // 崩溃年视为休养生息（不触发其他事件的额外处理）
        state.value.pendingAftermath = { type: '健康警示', remainingYears: 2 };
      }
    } else {
      state.value.consecutiveMaxStressYears = 0; // 没到100就重置
    }

    // ========== 数值整形（防御式兜底）==========
    // 城市系数乘法、通胀复利、叙事事件对薪资/生活成本的调整可能产生浮点小数，
    // 统一在年度结算前取整，杜绝浮点泄漏渗出到 UI 文本（45358.3675 / 13087.1999 等）
    state.value.annualBaseCost = Math.round(state.value.annualBaseCost);
    state.value.currentMonthlySalary = Math.round(state.value.currentMonthlySalary);
    state.value.passiveIncome = Math.round(state.value.passiveIncome);
    state.value.currentSavings = Math.round(state.value.currentSavings);
    if ((state.value as any).chainHoldings !== undefined) {
      (state.value as any).chainHoldings = Math.round((state.value as any).chainHoldings);
    }
    if ((state.value as any).bioPortfolio !== undefined) {
      (state.value as any).bioPortfolio = Math.round((state.value as any).bioPortfolio);
    }

    // 11. 检查结局
    const endingId = checkEnding(state.value);
    if (endingId) {
      triggerEnding(endingId);
      return;
    }

    // === 年份味道计算 ===
    // (已删除：年份味道标签系统和快进机制)

    // === 计算年度主事件文本（与 YearEndPanel.pickMainEvent 逻辑一致）====
    // 用于动画匹配优先使用年度金句文本，避免动画与年度结算显示的剧情不匹配
    const bbRevealsForMain = blindBoxReveals || [];
    const importantBB = bbRevealsForMain.filter(b => b.emotion === 'crying' || b.emotion === 'bitter' || b.emotion === 'cold');
    const criticalRelations = relationshipLogs.filter(e =>
      e.includes('离世') || e.includes('离婚') || e.includes('住院') || e.includes('分手')
    );
    const importantCards = cardLogs.filter(e => e.length > 30);
    const interestingDailies = dailyLogs.filter(e => e.length > 40);
    let mainEventText = '';
    if ((result as any).romanceBigEvent && romanceLogs.length > 0) {
      mainEventText = romanceLogs[0];
    } else if (criticalRelations.length > 0) {
      mainEventText = criticalRelations[0];
    } else if (eventResult.logs.length > 0) {
      mainEventText = eventResult.logs[0];
    } else if (importantBB.length > 0) {
      mainEventText = importantBB[0].text;
    } else if (importantCards.length > 0) {
      mainEventText = importantCards[0];
    } else if (romanceLogs.length > 0) {
      mainEventText = romanceLogs[0];
    } else if (interestingDailies.length > 0) {
      mainEventText = interestingDailies[0];
    } else {
      mainEventText = yearLog;
    }

    // === 剧情驱动的电视窗口情绪 ===
    // 补全所有日志源：romanceLogs（恋爱）、echoLogs（连锁反应）、blindBoxReveals（盲盒）、workSummary（工作小结）
    const allLogsForMood = [
      ...eventResult.logs,
      ...relationshipLogs,
      ...romanceLogs,
      ...cardLogs,
      ...dailyLogs,
      ...echoLogs,
      ...bbRevealsForMain.map(b => b.text),
      workSummary,
      yearLog,
    ].filter(Boolean);
    const mood = detectYearMood(allLogsForMood, result);
    yearMood.value = mood;

    // === 分镜分类：将本年度日志分到 家庭/生活/事业 三个窗口 ===
    // 关键修复1：主事件文本（年度金句）加入3次以获得足够评分权重，确保动画与年度金句匹配
    // 关键修复2：过滤纯数值变化日志（薪资调整等），避免关键词误触发动画
    const numericLogPattern = /^[压力幸福健康储蓄被动收入月薪]+[+\-]?\d|月薪从¥\d|被动收入[+\-]|储蓄[+\-¥]|^压力[+\-]|^幸福[+\-]|^健康[+\-]/;
    const isNarrativeLog = (log: string) => log && log.length > 10 && !numericLogPattern.test(log);
    const allLogsForStoryboard = [
      ...eventResult.logs.filter(isNarrativeLog),
      ...relationshipLogs.filter(isNarrativeLog),
      ...romanceLogs.filter(isNarrativeLog),
      ...cardLogs.filter(isNarrativeLog),
      ...dailyLogs.filter(isNarrativeLog),
      ...echoLogs.filter(isNarrativeLog),
      ...bbRevealsForMain.map(b => b.text).filter(isNarrativeLog),
      workSummary,
      yearLog,
      mainEventText,  // 权重x3：年度金句应该决定动画
      mainEventText,
      mainEventText,
    ].filter(Boolean);
    classifyStoryboards(allLogsForStoryboard);

    // 11. 显示年度结算弹窗（立刻清除转场动画，不再等待动画播完）
    cardTransitionType.value = null;
    showYearEnd.value = true;

    // 12. 保存（同步十字路口Map到state）
    state.value.crossroadFired = Object.fromEntries(crossroadFiredTags.value);
    scheduleSave(state.value);
    } finally {
      isCommitting = false; // 重置防重复守卫
    }
  }
  
  // ========== 剧情驱动的电视窗口情绪推断 ==========
  function detectYearMood(logs: string[], result: YearResult): typeof yearMood.value {
    const text = logs.join(' ');

    // 苦：裁员/失业/离婚/生病/离世/被裁/降薪/亏损
    if (/裁员|失业|被裁|降薪|亏损|离婚|生病|住院|离世|去世|破产|爆仓|诈骗/.test(text)) {
      return 'rain';
    }
    // 暗：健康极差
    if (result.healthChange < -10 || state.value.health < 30) {
      return 'vignette';
    }
    // 甜：恋爱/结婚/升职/加薪/买房/生子
    if (/恋爱|表白|结婚|升职|加薪|买房|搬家|生子|宝宝|退休|自由/.test(text)) {
      return 'hearts';
    }
    // 金：牛市/暴富/投资大赚
    if (/牛市|暴富|翻倍|大涨|中签|涨停/.test(text)) {
      return 'gold';
    }
    // 暗：萧条/经济寒冬
    const hasGloom = /萧条|寒冬|行业|缩编|倒闭|暴雷/.test(text);
    if (hasGloom) {
      // 雷暴版萧条：已匹配 gloom 且含裁员/失业/寒冬/倒闭 → 50%升级为 thunder
      if (/裁员|失业|寒冬|倒闭/.test(text) && Math.random() < 0.5) {
        return 'thunder';
      }
      return 'gloom';
    }
    // 雪：雪/冬/冷/寒
    if (/雪|冬|冷|寒/.test(text)) {
      return 'snow';
    }
    // 雷：雷/闪电/暴击/暴涨
    if (/雷|闪电|暴击|暴涨/.test(text)) {
      return 'thunder';
    }
    // 雾：雾/迷茫/看不清/朦胧
    if (/雾|迷茫|看不清|朦胧/.test(text)) {
      return 'fog';
    }
    // 故障：故障/信号/花屏/错乱
    if (/故障|信号|花屏|错乱/.test(text)) {
      return 'glitch';
    }

    return 'clear';
  }

  function buildYearLog(
    state: GameState,
    _result: YearResult,
    cardLogs: string[],
    eventLogs: string[],
  ): string {
    const age = state.currentAge;
    const delayed = isDelayedRetirementPhase(state);

    // 优先使用cardLogs（玩家选择的叙事选项日志）作为年度总结
    if (cardLogs && cardLogs.length > 0) {
      // 取第一条叙事日志（卡片选择的叙事文本），过滤掉纯数值日志
      const narrativeLog = cardLogs.find(log =>
        !/^[压力幸福健康储蓄被动收入月薪]+[+\-]?\d/.test(log) &&
        !/^月薪从¥/.test(log) &&
        log.length > 10
      );
      if (narrativeLog) {
        return narrativeLog;
      }
    }

    // 其次使用eventResult.logs（黑天鹅事件日志）
    if (eventLogs && eventLogs.length > 0) {
      return eventLogs[0];
    }

    if (state.isUnemployed) {
      if (state.totalUnemployedYears === 1) {
        return `第${age}岁，你依然没有收到任何offer。简历像丢进海里的石子，你开始习惯白天睡觉、晚上投递的错位人生。`;
      }
      return `第${age}岁，你在待业中度过，存款缓慢消耗。你告诉自己，机会总会来的。`;
    }

    // 以上都没有时，使用按年龄段分配的平淡模板
    return getCalmYearText(age, delayed);
  }
  
  function addLog(message: string) {
    // 去重：如果新日志与最近一条完全相同则跳过（避免同一年份重复写入相同日志）
    const logs = state.value.lifeLog;
    if (logs.length > 0 && logs[logs.length - 1] === message) {
      return;
    }
    logs.push(message);
    if (logs.length > 80) {
      logs.shift();
    }
  }
  
  // ========== 结局系统 ==========
  // 跨局图鉴：把这一局写入收藏（独立于单局存档，resetGame 不清除）
  function recordEndingRun() {
    const eid = state.value.currentEndingId;
    if (!eid) return;
    const info = getEndingInfo();
    if (!info) return;
    const isPath = eid.startsWith('path_success_') || eid.startsWith('path_failure_');
    const pathId = isPath ? (eid.replace(/^path_(success|failure)_/, '') as RetirementPathId) : null;
    const path = pathId ? getPath(pathId) : null;
    recordRun(state.value, {
      endingId: eid,
      grade: info.grade,
      title: info.title,
      name: info.name,
      pathId,
      pathName: path?.name || '',
      pathIcon: path?.icon || '',
    });
  }

  function triggerEarlyRetirement(success: boolean) {
    const path = getPath(state.value.retirementPath);
    if (!path) return;
    state.value.endingTriggered = true;
    state.value.currentEndingId = success ? `path_success_${state.value.retirementPath}` : `path_failure_${state.value.retirementPath}`;
    state.value.gamePhase = 'ending';
    addLog(success ? `第${state.value.currentAge}岁，你做到了。` : `第${state.value.currentAge}岁，这条路没有走通。`);
    scheduleSave(state.value);
    recordEndingRun();
  }

  // 玩家主动选择退休——随时可退休，不做任何达标条件拦截
  function chooseRetire() {
    const endingId = getVoluntaryRetirementEnding(state.value);
    addLog(`第${state.value.currentAge}岁，你决定退休了。不是因为你做完了所有该做的事，而是因为你终于分清了"该做"和"想做"。你放下了一个东西——也许叫野心，也许叫恐惧——然后空出的那只手，你用来握住了自己。`);
    triggerEnding(endingId);
  }

  function triggerEnding(endingId: string) {
    state.value.endingTriggered = true;
    state.value.currentEndingId = endingId;
    state.value.gamePhase = 'ending';
    scheduleSave(state.value);
    recordEndingRun();
  }
  
  function getEndingText(): string {
    if (!state.value.currentEndingId) return '';
    // 路径专属结局：使用路径定义的结局文本（可访问完整state）
    if (state.value.currentEndingId.startsWith('path_success_') || state.value.currentEndingId.startsWith('path_failure_')) {
      const isSuccess = state.value.currentEndingId.startsWith('path_success_');
      const pathId = state.value.currentEndingId.replace(/^path_(success|failure)_/, '') as RetirementPathId;
      const path = getPath(pathId);
      if (path) {
        const title = isSuccess ? path.successTitle : path.failureTitle;
        const body = isSuccess ? path.successEnding(state.value) : path.failureEnding(state.value);
        // 一句简洁的起源回响
        const echoes = [
          ['那年义无反顾踏上的列车，终究带你到了一个你不曾预想的站台。', '你并非为野心而来，却在这座城市里长出了自己的根。', '你循着一个人来，最后发现能让自己站稳的，从来不是别人的脚步。'],
          ['你算计着、忍耐着，每一步都算数。', '你死死抱住的那根浮木，最终真的托住了你。', '饿着肚子也要把灵魂喂饱的人，往往真的能找到饭吃。'],
          ['你从未在牌桌下蜷缩过，这就够了。', '你走在不偏不倚的窄路上，身后是刚刚好的月光。', '活着本身需要最多的勇气，你做到了。'],
        ];
        const cr = state.value.originChoices.cityReason;
        const cm = state.value.originChoices.careerMotivation;
        const ra = state.value.originChoices.riskAttitude;
        const seed = (cr * 7 + cm * 13 + ra * 3) % 3;
        const echoList = [echoes[0][cr], echoes[1][cm], echoes[2][ra]];
        const echo = echoList[seed];
        return `【${title}】\n\n${body}\n\n${echo}`;
      }
    }
    return buildEndingText(state.value.currentEndingId, state.value.originChoices, state.value.targetWealth);
  }

  function getEndingInfo() {
    if (!state.value.currentEndingId) return null;
    // 路径专属结局
    if (state.value.currentEndingId.startsWith('path_success_') || state.value.currentEndingId.startsWith('path_failure_')) {
      const isSuccess = state.value.currentEndingId.startsWith('path_success_');
      const pathId = state.value.currentEndingId.replace(/^path_(success|failure)_/, '') as RetirementPathId;
      const path = getPath(pathId);
      if (path) {
        return {
          id: state.value.currentEndingId,
          title: isSuccess ? path.successTitle : path.failureTitle,
          name: isSuccess ? '提前退休·成功' : '提前退休·失败',
          grade: computeFinalGrade(state.value) as FinalGrade,
          mood: isSuccess ? 'freedom' : 'melancholy',
          yearsOld: state.value.currentAge,
          skeleton: '',
          condition: () => false,
        };
      }
    }
    // 普通结局（E1-E9）：统一按终局状态动态评级，不再依赖硬编码等级
    const ending = ENDINGS.find(e => e.id === state.value.currentEndingId);
    if (ending) {
      return { ...ending, grade: computeFinalGrade(state.value) as FinalGrade };
    }
    return null;
  }
  
  // ========== 投资配置调整 ==========
  function setInvestment(bank: number, fund: number, spec: number) {
    if (bank + fund + spec !== 100) return;
    state.value.bankDepositPct = bank;
    state.value.indexFundPct = fund;
    state.value.speculationPct = spec;
  }

  // ========== 重置游戏 ==========
  function resetGame() {
    state.value = createInitialState();
    // 重置跨局模块级状态，避免上一局的"已结婚朋友"集合泄漏到新局
    resetMarriedFriendSet();
    // 重置跨系统叙事文本去重缓存，避免上一局残留导致本局漏渲染
    resetSharedNarrativeLru();
    currentNarrativeEvent.value = null;
    selectedNarrativeOptionId.value = null;
    currentAchievement.value = null;
    lastYearResult.value = null;
    eventPopup.value = null;
    showCitySelect.value = false;
    // 清除十字路口状态
    currentCrossroad.value = null;
    showCrossroad.value = false;
    crossroadFiredTags.value = new Map();
    showYearEnd.value = false;
    assetAcquired.value = null;
    cardTransitionType.value = null;
    clearSave();
  }

  // ========== 测试：快速跳到退休 ==========
  function testSkipToRetirement() {
    // 初始化一个60岁的状态
    const fresh = createInitialState();
    fresh.originChoices = {
      cityReason: 0, careerMotivation: 0, riskAttitude: 1,
    };
    fresh.currentAge = 60;
    fresh.targetAge = 60;
    fresh.gamePhase = 'playing';
    // 随机选一个退休梦想，让测试也能看到梦想换算效果
    const dream = RETIREMENT_DREAMS[Math.floor(Math.random() * RETIREMENT_DREAMS.length)];
    fresh.retirementDream = dream.id;
    fresh.targetWealth = dream.targetWealth;
    // 模拟一辈子的积累（资产围绕梦想目标波动，让进度条有看头）
    const progress = 0.45 + Math.random() * 0.7; // 45%~115% 达成度
    const totalAssets = Math.floor(dream.targetWealth * progress);
    fresh.currentSavings = Math.max(0, totalAssets - 4000000);
    fresh.propertyValue = Math.min(4000000, totalAssets);
    fresh.health = 60 + Math.floor(Math.random() * 20);
    fresh.stress = 40 + Math.floor(Math.random() * 20);
    fresh.happiness = 55 + Math.floor(Math.random() * 20);
    fresh.currentProfession = '红利行业';
    fresh.currentCity = '资本修罗场';
    // 模拟累计数据
    fresh.lifetimeSalary = 6200000;
    fresh.lifetimeInvestmentGain = 1180000;
    fresh.lifetimeSideHustle = 892000;
    fresh.lifetimeLivingCost = 1840000;
    fresh.lifetimeMortgage = 1600000;
    fresh.lifetimeChildCost = 980000;
    fresh.lifetimeParentCost = 420000;
    fresh.lifetimeMedicalCost = 187000;
    fresh.lifetimeCardCost = 324000;
    fresh.lifetimeGiftMoney = 134000;
    fresh.lifetimeInsuranceCost = 120000;
    // 有房有贷款已还清
    fresh.hasProperty = true;
    fresh.mortgageRemainingYears = 0;
    // 触发退休结局
    state.value = fresh;
    const endingId = checkEnding(state.value) || 'E1';
    triggerEnding(endingId);
  }

  // ========== 年度结算弹窗 ==========
  function dismissYearEnd() {
    showYearEnd.value = false;
    // 新一年的叙事事件推迟到年结关闭后再抽取，避免叙事面板被年结 overlay 遮挡
    // （此前在 commitYear 内抽取，叙事面板 position:static 会被 fixed 的年结遮罩盖住，选项无法点击）
    drawNarrativeEvent();
  }

  return {
    state,
    lastYearResult,
    yearMood,
    eventPopup,
    showCitySelect,
    // 十字路口
    currentCrossroad,
    crossroadFiredTags,
    showCrossroad,
    selectCrossroadOption,
    // 年度结算弹窗
    showYearEnd,
    dismissYearEnd,
    // 资产获得动画
    assetAcquired,
    // 卡片转场动画
    cardTransitionType,
    setCardTransition,
    // 三分镜队列
    pendingStoryboards,
    // 叙事事件系统
    currentNarrativeEvent,
    selectedNarrativeOptionId,
    currentAchievement,
    dismissAchievement,
    drawNarrativeEvent,
    selectNarrativeOption,
    // 计算属性
    totalWealth,
    progressToTarget,
    canRetireNow,
    monthlySalaryDisplay,
    yearlyIncomeDisplay,
    stressLevel,
    happinessLevel,
    healthLevel,
    totalChildExpense,
    startNewGame,
    setupGame,
    continueGame,
    selectRetirementPath,
    generateYearOpeningMonologue,
    applyGeoArbitrage,
    commitYear,
    chooseRetire,
    triggerEnding,
    getEndingText,
    getEndingInfo,
    setInvestment,
    resetGame,
    testSkipToRetirement,
    addLog,
    ENDINGS,
  };
});
