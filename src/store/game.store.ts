import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { shallowRef } from 'vue';
import type { GameState, Profession, CityType, OriginChoices, YearResult, DecisionCard, CrossroadEvent, AftermathType } from '../types/global.d.js';
import { CITY_CONFIGS, applySalaryRaise, calculateYearlySettlement, checkEnding, switchCity } from '../utils/math-engine.js';
import { DECISION_CARDS, drawRandomCards, trackCardUsage } from '../data/cards.js';
import { rollRandomEvents } from '../data/events.js';
import { rollDailyEvents, applyDailyEventEffects } from '../data/daily-events.js';
import { ENDINGS, buildEndingText } from '../utils/narrative.js';
import { initParents, initFriends, processRelationships, resetMarriedFriendSet } from '../utils/relationships.js';
import { scheduleSave, loadSave, clearSave } from './persist.js';
import { detectCrossroad } from '../data/crossroads.js';
import { CARD_ECHOS, detectCardEchoes } from '../data/card-echoes.js';
import { BLIND_BOX_OUTCOMES, detectBlindBoxOutcomes } from '../data/blind-box-outcomes.js';
import { processRomanceYear } from '../data/romance.js';
import { checkAchievements } from '../data/achievements.js';

// 伴侣候选名字池（保留用于结婚卡兜底）
const partnerNames = ['晓芸', '佳慧', '雨萱', '思琪', '子涵', '浩然', '宇轩', '俊杰', '天翔', '明远'];

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
    // 财务
    annualBaseCost: 30000,
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
    pendingBlindBoxes: [] as { outcomeId: string; triggerAge: number }[],
    // 人生总账单累计追踪
    lifetimeSalary: 0,
    lifetimeInvestmentGain: 0,
    lifetimeSideHustle: 0,
    lifetimeLivingCost: 0,
    lifetimeMortgage: 0,
    lifetimeChildCost: 0,
    lifetimeParentCost: 0,
    lifetimeMedicalCost: 0,
    lifetimeCardCost: 0,
    lifetimeGiftMoney: 0,
    lifetimeInsuranceCost: 0,
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
  const state = ref<GameState>(initialState);
  
  // 当前抽取的卡片
  const currentCards = shallowRef<DecisionCard[]>([]);
  // 选中的卡片ID
  const selectedCardIds = ref<string[]>([]);
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
  
  // 场景事件动画通知
  const pendingSceneAnimation = ref<{ type: string; duration: number } | null>(null);
  
  // 场景重绘标记（递增即触发 PixelCanvas 立即重绘像素场景）
  const sceneDirty = ref(0);
  function markSceneDirty() { sceneDirty.value++; }

  // 资产获得动画通知（买房/买车等即时视觉反馈）
  const assetAcquired = ref<{ type: 'house' | 'car' | 'job' | 'love' | 'money'; label: string } | null>(null);
  function setAssetAcquired(type: 'house' | 'car' | 'job' | 'love' | 'money', label: string) {
    assetAcquired.value = { type, label };
    setTimeout(() => { assetAcquired.value = null; }, 1500);
  }

  // 卡片转场动画类型
  const cardTransitionType = ref<string | null>(null);
  function setCardTransition(type: string | null) {
    cardTransitionType.value = type;
  }

  // 计算属性
  const totalWealth = computed(() => state.value.currentSavings + state.value.propertyValue);
  const progressToTarget = computed(() => Math.min(100, (totalWealth.value / state.value.targetWealth) * 100));
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
    currentCards.value = [];
    selectedCardIds.value = [];
    lastYearResult.value = null;
    eventPopup.value = null;
    showCitySelect.value = false;
    currentCrossroad.value = null;
    showCrossroad.value = false;
    showYearEnd.value = false;
    crossroadFiredTags.value = new Map();
    sceneDirty.value = 0;
    assetAcquired.value = null;
    cardTransitionType.value = null;
    clearSave();
  }
  
  function setupGame(city: CityType, profession: Profession, initSalary: number, targetAge: number, targetWealth: number) {
    const cityConfig = CITY_CONFIGS[city];
    state.value.currentCity = city;
    state.value.currentProfession = profession;
    state.value.initMonthlySalary = initSalary;
    state.value.targetAge = targetAge;
    state.value.targetWealth = targetWealth;
    state.value.careerStartSalary = Math.round(initSalary * cityConfig.salaryMultiplier);
    state.value.currentMonthlySalary = state.value.careerStartSalary;
    state.value.currentAge = 22;
    state.value.currentSavings = Math.round(initSalary * 3); // 初始3个月工资
    state.value.gamePhase = 'playing';
    state.value.lifeLog = [];
    state.value.crossroadFired = {};
    crossroadFiredTags.value = new Map();
    
    addLog(`第22岁，你在${city}开始了${profession}的职业生涯，初始月薪${state.value.currentMonthlySalary}元。像素人生，正式开局。`);
    
    // 抽取第一年的卡片
    drawNewCards();
    scheduleSave(state.value);
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
      if (currentCards.value.length === 0) {
        drawNewCards();
      }
    }
  }
  
  // ========== 卡片系统 ==========
  function drawNewCards() {
    // 先检测是否触发十字路口
    const crossroad = detectCrossroad(state.value, crossroadFiredTags.value);
    if (crossroad) {
      currentCrossroad.value = crossroad;
      showCrossroad.value = true;
      // 不再抽取普通卡片，等玩家选择完十字路口
      currentCards.value = [];
      selectedCardIds.value = [];
      return;
    }
    
    // 没有十字路口，正常抽卡
    currentCrossroad.value = null;
    showCrossroad.value = false;
    currentCards.value = drawRandomCards(state.value, 3);
    selectedCardIds.value = [];
  }
  
  function toggleCard(cardId: string) {
    const idx = selectedCardIds.value.indexOf(cardId);
    if (idx >= 0) {
      selectedCardIds.value.splice(idx, 1);
    } else {
      selectedCardIds.value.push(cardId);
    }
  }
  
  function applySelectedCards(): { logs: string[]; totalCost: number; isRestYear: boolean; cardDetails: { title: string; log: string; before: { stress: number; happiness: number; health: number; savings: number } }[] } {
    const logs: string[] = [];
    const cardDetails: { title: string; log: string; before: { stress: number; happiness: number; health: number; savings: number } }[] = [];
    let totalCost = 0;
    
    // 没有选任何卡 = 休养生息
    const isRestYear = selectedCardIds.value.length === 0;
    if (isRestYear) {
      state.value.stress = Math.max(0, state.value.stress - 5);
      state.value.health = Math.min(100, state.value.health + 3);
      state.value.happiness = Math.min(100, state.value.happiness + 2);
      const restLogs = [
        `第${state.value.currentAge}岁，这一年你没有刻意追求什么。推掉了不必要的应酬，每天早睡早起，周末去公园散步。压力像退潮的海水慢慢退去，你重新感受到了生活的质感。`,
        `第${state.value.currentAge}岁，这一年你按下了暂停键。读了几本一直想读的书，给家人做了很多顿饭。虽然存款没怎么涨，但心里那块紧绷的弦终于松了。`,
        `第${state.value.currentAge}岁，休养生息的一年。你学会了对不必要的事情说"不"，把时间还给了自己。体检报告上的箭头少了几个，镜子里的自己看起来精神了不少。`,
      ];
      const restLog = restLogs[Math.floor(Math.random() * restLogs.length)];
      logs.push(restLog);
      addLog(restLog);
      return { logs, totalCost, isRestYear: true, cardDetails };
    }
    
    for (const cardId of selectedCardIds.value) {
      // 特殊处理：地理套利需要城市选择
      if (cardId === 'geo_arbitrage') {
        showCitySelect.value = true;
        continue;
      }
      
      const card = currentCards.value.find(c => c.id === cardId);
      if (!card) continue;
      
      // 检查前置条件
      if (card.prerequisites && !card.prerequisites(state.value)) continue;
      
      const beforeCard = { stress: state.value.stress, happiness: state.value.happiness, health: state.value.health, savings: state.value.currentSavings };
      const result = card.effect(state.value);
      totalCost += result.cost;
      logs.push(result.log);
      // 同时把卡片效果日志加入 lifeLog，确保LifeLog面板能看到
      addLog(result.log);
      cardDetails.push({ title: card.title, log: result.log, before: beforeCard });
    }

    // 拦截结婚卡 → 与现有恋人结婚或闪婚
    if (selectedCardIds.value.includes('marry')) {
      if (state.value.partner && !state.value.partner.hasDivorced && 
          state.value.partner.datingStage !== 'single' && state.value.partner.datingStage !== 'divorced' &&
          state.value.partner.datingStage !== 'married') {
        // 与现有恋人结婚：快速推进到已婚
        state.value.partner.datingStage = 'married';
        state.value.partner.marriedYear = state.value.currentAge;
        state.value.partner.affection = Math.min(100, state.value.partner.affection + 15);
        state.value.partner.trust = Math.min(100, state.value.partner.trust + 10);
        state.value.isMarried = true;
      } else if (!state.value.partner || state.value.partner.datingStage === 'single' || state.value.partner.datingStage === 'divorced') {
        // 闪婚：没有恋人就选结婚卡 = 相亲闪婚
        const personality = ['温柔型','事业型','浪漫型','节俭型','独立型'][Math.floor(Math.random()*5)] as any;
        state.value.partner = {
          name: partnerNames[Math.floor(Math.random() * partnerNames.length)],
          age: state.value.currentAge + Math.floor(Math.random() * 4) - 1,
          affection: 50 + Math.floor(Math.random() * 20),  // 闪婚感情基础弱一些
          trust: 40 + Math.floor(Math.random() * 20),
          marriedYear: state.value.currentAge,
          hasDivorced: false,
          personality,
          datingStage: 'married',
          meetYear: state.value.currentAge,
          trait: '相亲认识的',
          memories: [{ age: state.value.currentAge, event: '闪婚', emoji: '💍' }],
          crushFrom: 'blind_date',
        };
        state.value.isMarried = true;
      }
    }

    // 拦截生育卡 → 初始化子女
    if (selectedCardIds.value.includes('have_child')) {
      if (state.value.children.length === 0) {
        state.value.children.push({
          birthYear: state.value.currentAge,
          gender: Math.random() < 0.5 ? '男' : '女',
          growthStage: '婴儿',
          academicPerformance: 50,
          rebelliousness: 0,
          monthlyExpense: 2000,
        });
      }
    }
    
    state.value.currentSavings -= totalCost;
    
    // 记录卡片使用历史（用于冷却和重复判断，写入可序列化的 usedCardHistory）
    for (const cardId of selectedCardIds.value) {
      trackCardUsage(state.value, cardId);
    }

    // 注册连锁反应 + 盲盒（统一处理，避免echo和盲盒在同一年重复触发）
    // 先注册盲盒，记录已占用的 (cardId, delayYears) 组合，echo跳过冲突项
    const registeredBlindBoxKeys = new Set<string>();

    // 注册盲盒结果 + 生成悬念提示
    // 选卡时根据当前状态只注册第一条满足条件的分支
    // 只有当盲盒成功注册（matched 存在）时才生成悬念提示
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
      'dinner_friends': '散场的时候你发了条朋友圈"青春不散场"。但你知道，有些人走着走着就散了。这一次，会不一样吗？',
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
    };
    // triggerCardId 匹配辅助：支持 'buy_house*' 前缀通配
    function matchTrigger(triggerId: string, cardId: string): boolean {
      if (triggerId.endsWith('*')) {
        return cardId.startsWith(triggerId.slice(0, -1));
      }
      return triggerId === cardId;
    }
    for (const cardId of selectedCardIds.value) {
      const outcomes = BLIND_BOX_OUTCOMES.filter(o => matchTrigger(o.triggerCardId, cardId));
      // 按 delayYears 排序，优先注册延迟较短的分支
      const sorted = outcomes.sort((a, b) => a.delayYears - b.delayYears);
      const matched = sorted.find(o => o.condition(state.value));
      if (matched) {
        state.value.pendingBlindBoxes!.push({
          outcomeId: matched.id,
          triggerAge: state.value.currentAge + matched.delayYears,
        });
        registeredBlindBoxKeys.add(`${cardId}:${matched.delayYears}`);
        // 只有盲盒成功注册时才生成悬念提示
        const hint = suspenseHints[cardId] || suspenseHints[matched.triggerCardId] || '你做了一个决定。这个决定会在未来某个时刻，以你意想不到的方式产生影响。';
        addLog(hint);
        logs.push(hint);
      }
    }

    // 注册echo连锁反应（跳过与盲盒同cardId+同delayYears的，避免重复触发）
    for (const cardId of selectedCardIds.value) {
      const echoes = CARD_ECHOS.filter(e => matchTrigger(e.triggerCardId, cardId));
      for (const echo of echoes) {
        const key = `${cardId}:${echo.delayYears}`;
        if (registeredBlindBoxKeys.has(key)) continue;
        state.value.pendingCardEchoes!.push({
          cardId: cardId,
          triggerAge: state.value.currentAge,
          delayYears: echo.delayYears,
        });
      }
    }
    
    // 检测重大状态变化，触发场景即时重绘与资产获得动画
    let hasMajorSceneChange = false;
    for (const cid of selectedCardIds.value) {
      if (cid.startsWith('buy_house')) {
        hasMajorSceneChange = true;
        setAssetAcquired('house', '喜提新居!');
      } else if (cid.startsWith('buy_car')) {
        hasMajorSceneChange = true;
        setAssetAcquired('car', '喜提爱车!');
      } else if (cid === 'resign' || cid === 'marry' || cid === 'have_child') {
        hasMajorSceneChange = true;
      }
    }
    if (hasMajorSceneChange) {
      markSceneDirty();
    }

    selectedCardIds.value = [];
    return { logs, totalCost, isRestYear: false, cardDetails };
  }
  
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
    markSceneDirty();
  }
  
  // ========== 十字路口选择 ==========
  function selectCrossroadOption(optionId: string) {
    const crossroad = currentCrossroad.value;
    if (!crossroad) return;
    
    const option = crossroad.options.find(o => o.id === optionId);
    if (!option) return;
    
    // 快照关键状态（用于检测重大场景变化）
    const beforeCity = state.value.currentCity;
    const beforeMarried = state.value.isMarried;
    const beforeUnemployed = state.value.isUnemployed;
    const beforeHasChild = state.value.hasChild;
    const beforeHasProperty = state.value.hasProperty;
    const beforeHasCar = state.value.hasCar;

    // 应用选项效果
    const result = option.effect(state.value);
    addLog(result.log);

    // 如果关键场景状态发生变化，立即标记场景重绘
    if (state.value.currentCity !== beforeCity ||
        state.value.isMarried !== beforeMarried ||
        state.value.isUnemployed !== beforeUnemployed ||
        state.value.hasChild !== beforeHasChild ||
        state.value.hasProperty !== beforeHasProperty ||
        state.value.hasCar !== beforeHasCar) {
      markSceneDirty();
    }

    // 记录冷却
    crossroadFiredTags.value.set(crossroad.tag, state.value.currentAge);
    
    // 同步 Map 到 state（用于持久化）
    state.value.crossroadFired = Object.fromEntries(crossroadFiredTags.value);
    
    // 清除十字路口状态
    currentCrossroad.value = null;
    showCrossroad.value = false;
    
    // 抽取当年度的普通卡片
    currentCards.value = drawRandomCards(state.value, 3);
    selectedCardIds.value = [];
    
    scheduleSave(state.value);
  }
  
  // ========== 年度结算核心 ==========
  function commitYear() {
    if (state.value.endingTriggered) return;

    // 判断选卡转场类型
    const selectedIds = selectedCardIds.value;
    let transition = 'default';

    if (selectedIds.some(id => id.startsWith('buy_house'))) transition = 'house';
    else if (selectedIds.some(id => id.startsWith('buy_car'))) transition = 'car';
    else if (selectedIds.some(id => ['gym', 'health_check', 'healthy_diet'].includes(id))) transition = 'health';
    else if (selectedIds.some(id => id === 'travel')) transition = 'travel';
    else if (selectedIds.some(id => ['resign', 'job_hopping', 'civil_service_exam', 'headhunter'].includes(id))) transition = 'job';
    else if (selectedIds.some(id => ['date_night', 'marry', 'have_child'].includes(id))) transition = 'love';
    else if (selectedIds.some(id => ['buy_lottery', 'windfall_gamble', 'add_stock'].includes(id))) transition = 'money';
    else if (selectedIds.some(id => ['hobby_class', 'read_books', 'learn_skill'].includes(id))) transition = 'study';
    else if (selectedIds.length > 0) transition = 'daily';

    // 如果有高风险负面事件，用 crisis（在 random event 前预判：只看已有后遗症或当前健康极差）
    if (state.value.pendingAftermath || state.value.health < 25 || state.value.stress > 90) {
      transition = 'crisis';
    }

    cardTransitionType.value = transition;

    // 记录年初基准值
    const yearStartSavings = state.value.currentSavings;
    const prevStress = state.value.stress;
    const prevHappiness = state.value.happiness;
    const prevHealth = state.value.health;
    const prevPassiveIncome = state.value.passiveIncome;
    const prevUnemployed = state.value.isUnemployed;
    const wasMarried = state.value.isMarried;
    const hadProperty = state.value.hasProperty;
    // 初始化成就集合
    if (!state.value.unlockedAchievements) state.value.unlockedAchievements = [];
    const achievementSet = new Set(state.value.unlockedAchievements);

    // 用于按来源追踪变化
    const wellbeingChanges: { source: string; stress: number; happiness: number; health: number; savings: number }[] = [];

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

    // 1. 应用选中的卡片（逐张记录变化，让明细里显示具体卡名）
    const beforeCards = snapshot();
    const cardResult = applySelectedCards();
    const cardLogs = cardResult.logs;
    const cardCost = cardResult.totalCost;
    const isRestYear = cardResult.isRestYear;
    if (isRestYear) {
      pendingSceneAnimation.value = { type: 'hearts', duration: 2 };
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
    const relationshipLogs = processRelationships(state.value);
    recordChange('relationships', beforeRelationships);
    for (const log of relationshipLogs) {
      addLog(log);
    }

    // 2.6 恋爱系统：处理遇见、约会、暧昧、分手、求婚等
    const beforeRomance = snapshot();
    const romanceResult = processRomanceYear(state.value);
    const romanceLogs = romanceResult.logs;
    recordChange('romance', beforeRomance);
    for (const log of romanceLogs) {
      addLog(log);
    }

    // 3. 年度调薪（在结算前）
    if (!state.value.isUnemployed) {
      applySalaryRaise(state.value);
    }

    // 4. 经济周期随机变化
    const cycleRoll = Math.random();
    if (cycleRoll < 0.15) state.value.economicCycle = 0; // 繁荣
    else if (cycleRoll < 0.75) state.value.economicCycle = 1; // 平稳
    else state.value.economicCycle = 2; // 萧条

    // 4.5 滚动日常琐事（削减为每年1条，腾出空间给恋爱/大事件）
    // 按每条事件逐条记录变化，用于收支/变化来源面板展示
    const dailyLogs: string[] = [];
    const dailyEvents = rollDailyEvents(state.value, 1);
    for (const evt of dailyEvents) {
      const beforeEvt = snapshot();
      const evtLogs = applyDailyEventEffects(state.value, evt);
      dailyLogs.push(evt.text, ...evtLogs);
      recordChange(evt.label || '日常琐事', beforeEvt);
    }
    const dailyEventFinancialChange = dailyLogs.length > 0
      ? wellbeingChanges.filter(e => !['naturalDrift', 'cards', 'blackSwan', 'echoes', 'blindBoxes', 'relationships', 'romance'].includes(e.source))
          .reduce((sum, e) => sum + e.savings, 0)
      : 0;
    state.value.dailyEventLog = dailyLogs;
    for (const log of dailyLogs) {
      addLog(log);
    }

    // 4.6 检测并执行卡片连锁反应（可能修改 state）
    const beforeEchoes = snapshot();
    const echoResult = detectCardEchoes(state.value, state.value.pendingCardEchoes ?? []);
    state.value.pendingCardEchoes = echoResult.remaining;
    const echoLogs: string[] = [];
    for (const echo of echoResult.echoes) {
      echo.applyEffect(state.value);
      const echoText = echo.getText(state.value);
      addLog(echoText);
      echoLogs.push(echoText); // 单独收集echo日志，不混入dailyLogs
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

    // 8. 记录日志（整合日常琐事和人际关系）
    // 注意：必须在递增 currentAge 之前调用 buildYearLog，否则日志里的年龄会偏移一年
    const yearLog = buildYearLog(state.value, result, eventResult.logs, relationshipLogs, dailyLogs);
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

    // 10. 检查结局
    const endingId = checkEnding(state.value);
    if (endingId) {
      triggerEnding(endingId);
      return;
    }

    // === 年份味道计算 ===
    // (已删除：年份味道标签系统和快进机制)

    // === 剧情驱动的电视窗口情绪 ===
    const allLogs = [...eventResult.logs, ...relationshipLogs, ...cardLogs, ...dailyLogs, yearLog];
    const mood = detectYearMood(allLogs, result);
    yearMood.value = mood;

    // 10.5 检测重大事件，触发场景动画
    detectAndTriggerSceneAnimation(result, relationshipLogs, eventResult, romanceResult);

    // 11. 显示年度结算弹窗
    showYearEnd.value = true;

    // 12. 抽取新一年的卡片
    drawNewCards();

    // 12. 保存（同步十字路口Map到state）
    state.value.crossroadFired = Object.fromEntries(crossroadFiredTags.value);
    scheduleSave(state.value);
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
    eventLogs: string[],
    relationshipLogs: string[] = [],
    dailyLogs: string[] = [],
  ): string {
    // 优先展示重大事件
    if (eventLogs.length > 0) {
      return eventLogs[0];
    }

    // 其次展示人际关系重大变化
    const majorRelationshipEvents = relationshipLogs.filter(log =>
      log.includes('离世') || log.includes('离婚') || log.includes('高考') || log.includes('住院')
    );
    if (majorRelationshipEvents.length > 0) {
      return majorRelationshipEvents[0];
    }

    if (state.isUnemployed) {
      if (state.totalUnemployedYears === 1) {
        return `第${state.currentAge}岁，你依然没有收到任何offer。简历像丢进海里的石子，你开始习惯白天睡觉、晚上投递的错位人生。`;
      }
      return `第${state.currentAge}岁，你在待业中度过，存款缓慢消耗。你告诉自己，机会总会来的。`;
    }

    // 合并叙事：把日常琐事串成一段故事
    const age = state.currentAge;
    const savings = Math.round(state.currentSavings);
    const profession = state.currentProfession;

    // 如果有日常事件，用它们构建叙事
    if (dailyLogs.length > 0) {
      const picks: string[] = [];
      // 取1-2条日常事件
      const shuffled = [...dailyLogs].sort(() => Math.random() - 0.5);
      picks.push(shuffled[0]);
      if (shuffled.length > 1 && Math.random() < 0.4) {
        picks.push(shuffled[1]);
      }
      // 把日常事件的描述串成一段
      const dailyText = picks.map(l => l.replace(/^第\d+岁，/, '').replace(/。$/, '')).join('，后来');
      return `第${age}岁，${dailyText}。`;
    }

    // 没有日常事件的平淡年份
    const templates = [
      `第${age}岁，这一年像一杯白开水，喝的时候没感觉，但渴的时候才知道它的好。你在${profession}的岗位上日复一日，存款涨到了${savings}元。`,
      `第${age}岁，你把生活过成了循环播放——地铁、工位、外卖、床。偶尔刷到朋友的朋友圈，他们好像都比你过得精彩，但你关掉手机后，觉得自己的日子也还行。`,
      `第${age}岁，你学会了在加班的间隙里找乐子：偷吃零食、摸鱼刷手机、跟同事吐槽甲方。日子虽然重复，但这些小事让你觉得还没被生活完全磨平。`,
      `第${age}岁，你开始理解什么叫"日子是用来过的，不是用来熬的"。买菜、做饭、洗碗、倒垃圾，这些琐碎的事情里居然藏着一种奇怪的安全感。存款${savings}元，不多不少。`,
      `第${age}岁，你这一年没什么好说的。工作还行，身体还行，感情还行。三个"还行"凑在一起，就是大多数人的一年。`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }
  
  function addLog(message: string) {
    state.value.lifeLog.push(message);
    if (state.value.lifeLog.length > 80) {
      state.value.lifeLog.shift();
    }
  }
  
  // ========== 结局系统 ==========
  function triggerEnding(endingId: string) {
    state.value.endingTriggered = true;
    state.value.currentEndingId = endingId;
    state.value.gamePhase = 'ending';
    scheduleSave(state.value);
  }
  
  function getEndingText(): string {
    if (!state.value.currentEndingId) return '';
    return buildEndingText(state.value.currentEndingId, state.value.originChoices);
  }
  
  function getEndingInfo() {
    if (!state.value.currentEndingId) return null;
    return ENDINGS.find(e => e.id === state.value.currentEndingId) || null;
  }
  
  // ========== 投资配置调整 ==========
  function setInvestment(bank: number, fund: number, spec: number) {
    if (bank + fund + spec !== 100) return;
    state.value.bankDepositPct = bank;
    state.value.indexFundPct = fund;
    state.value.speculationPct = spec;
  }
  
  // ========== 场景事件动画触发 ==========
  function triggerSceneAnimation(type: string, duration: number = 2.5) {
    pendingSceneAnimation.value = { type, duration };
  }

  function detectAndTriggerSceneAnimation(
    result: YearResult,
    relationshipLogs: string[],
    eventResult: { totalLoss: number; logs: string[]; newAftermath?: AftermathType; aftermathDuration?: number },
    romanceResult?: { sceneAnimation?: string; isBigEvent?: boolean },
  ) {
    // 恋爱系统动画优先
    if (romanceResult?.sceneAnimation === 'wedding') {
      triggerSceneAnimation('fireworks', 3.5);
    } else if (romanceResult?.sceneAnimation === 'hearts') {
      triggerSceneAnimation('hearts', 2.5);
    } else if (romanceResult?.sceneAnimation === 'heartbreak') {
      triggerSceneAnimation('tears', 3);
    }
    // 黑天鹅事件（有损失或后遗症）
    else if (eventResult.totalLoss > 0 || eventResult.newAftermath) {
      triggerSceneAnimation('lightning', 2);
    }

    // 卡片日志中检测事件
    const allCardLogs = (result.cardLogs ?? []).join(' ');
    const allRelLogs = relationshipLogs.join(' ');

    if (allCardLogs.includes('结婚') || allCardLogs.includes('婚礼')) {
      triggerSceneAnimation('confetti', 2.5);
    } else if (allCardLogs.includes('购房') || allCardLogs.includes('房子')) {
      triggerSceneAnimation('house_build', 3);
    } else if (allCardLogs.includes('提了') || allCardLogs.includes('买车')) {
      triggerSceneAnimation('fireworks', 2);
    } else if (allCardLogs.includes('彩票') || allCardLogs.includes('暴富')) {
      triggerSceneAnimation('gold_burst', 3);
    } else if (allRelLogs.includes('离世')) {
      triggerSceneAnimation('tears', 3);
    } else if (allRelLogs.includes('离婚')) {
      triggerSceneAnimation('tears', 2.5);
    } else if (allRelLogs.includes('高考')) {
      triggerSceneAnimation('confetti', 2);
    }

    // 里程碑年龄（25/30/35/40/45/50/55）
    const milestoneAges = [25, 30, 35, 40, 45, 50, 55];
    if (milestoneAges.includes(state.value.currentAge)) {
      triggerSceneAnimation('confetti', 2);
    }

    // 35岁危机：增强版闪电
    if (state.value.currentAge === 35) {
      triggerSceneAnimation('lightning', 3);
    }

    // 幸福感高且非危机年
    if (state.value.happiness > 70 && eventResult.totalLoss <= 0 && !eventResult.newAftermath && !romanceResult?.sceneAnimation) {
      triggerSceneAnimation('hearts', 1.5);
    }

    // 选了辞职卡（失业）
    if (allCardLogs.includes('辞职')) {
      triggerSceneAnimation('rain', 2);
    }

    // 重大疾病
    if (state.value.hadCriticalIllness) {
      triggerSceneAnimation('skull', 3);
    }

    // 连续2年压力>80
    const prevStress = state.value.stress - result.stressChange;
    if (state.value.stress > 80 && prevStress > 80) {
      triggerSceneAnimation('skull', 2.5);
    }
  }

  // ========== 重置游戏 ==========
  function resetGame() {
    state.value = createInitialState();
    // 重置跨局模块级状态，避免上一局的"已结婚朋友"集合泄漏到新局
    resetMarriedFriendSet();
    currentCards.value = [];
    selectedCardIds.value = [];
    lastYearResult.value = null;
    eventPopup.value = null;
    showCitySelect.value = false;
    // 清除十字路口状态
    currentCrossroad.value = null;
    showCrossroad.value = false;
    crossroadFiredTags.value = new Map();
    showYearEnd.value = false;
    sceneDirty.value = 0;
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
    // 模拟一辈子的积累
    fresh.currentSavings = 2870000 + Math.floor(Math.random() * 500000);
    fresh.propertyValue = 4000000;
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
  }

  return {
    state,
    currentCards,
    selectedCardIds,
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
    // 场景事件动画
    pendingSceneAnimation,
    triggerSceneAnimation,
    // 场景即时重绘
    sceneDirty,
    markSceneDirty,
    // 资产获得动画
    assetAcquired,
    // 卡片转场动画
    cardTransitionType,
    setCardTransition,
    // 计算属性
    totalWealth,
    progressToTarget,
    monthlySalaryDisplay,
    yearlyIncomeDisplay,
    stressLevel,
    happinessLevel,
    healthLevel,
    totalChildExpense,
    startNewGame,
    setupGame,
    continueGame,
    drawNewCards,
    toggleCard,
    applySelectedCards,
    applyGeoArbitrage,
    commitYear,
    triggerEnding,
    getEndingText,
    getEndingInfo,
    setInvestment,
    resetGame,
    testSkipToRetirement,
    addLog,
    DECISION_CARDS,
    ENDINGS,
  };
});
