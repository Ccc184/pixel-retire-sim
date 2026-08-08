// 职业类型
export type Profession = '体制内' | '红利行业' | '传统私企' | '自由职业' | '实体创业' | '一线蓝领' | '数字游民' | '自由个体'
  // All In 后开公司专属职业（hasCompany === true 时持有）
  | 'AI工作室创始人' | '区块链公司CEO' | '远程公司创始人' | 'MCN创始人' | '长寿科技公司CEO';

// 退休路径ID
export type RetirementPathId = 'ai_symbiote' | 'chain_native' | 'digital_nomad' | 'super_ip' | 'silver_economy' | 'bio_gambler';

// 退休梦想ID（开局选择，决定最终退休报告的换算维度）
export type RetirementDream = 'world_traveler' | 'farm_hermit' | 'lifelong_scholar' | 'ultimate_otaku' | 'square_dance_king' | 'silver_volunteer';

// MBTI人格类型
export type MBTIType = 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP' | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP' | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ' | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP';

// 叙事事件分支（每条路径有3条分支）
export type NarrativeBranch =
  // AI共生者
  | 'tech_expert' | 'ai_startup' | 'ai_evangelist'
  // 链上原住民
  | 'chain_trader' | 'chain_builder' | 'chain_hodler'
  // 数字游牧民
  | 'nomad_freelancer' | 'nomad_entrepreneur' | 'nomad_consultant'
  // 超级IP
  | 'ip_educator' | 'ip_entertainer' | 'ip_thought_leader'
  // 银发守夜人
  | 'silver_caregiver' | 'silver_tech' | 'silver_community'
  // 生物赌徒
  | 'bio_investor' | 'bio_experimenter' | 'bio_researcher'
  | 'unassigned';

// 城市类型
export type CityType = '资本修罗场' | '中坚大后方' | '避风低洼地' | '海外低成本';

// 经济周期
export type EconomicCycle = 0 | 1 | 2; // 0=繁荣, 1=平稳, 2=萧条

// 后遗症类型
export type AftermathType = '心理阴影' | '情感创伤' | '健康警示' | '认知干扰' | '医疗纠纷' | null;

// 后遗症状态
export interface PendingAftermath {
  type: AftermathType;
  remainingYears: number;
}

// 开局问卷选择
export interface OriginChoices {
  cityReason: 0 | 1 | 2;      // 0=梦想, 1=被迫, 2=家人
  careerMotivation: 0 | 1 | 2; // 0=财富, 1=安稳, 2=自由
  riskAttitude: 0 | 1 | 2;    // 0=激进, 1=中庸, 2=保守
}

// 地缘板块配置
export interface CityConfig {
  name: CityType;
  costMultiplier: number;      // 生存成本开销乘数
  salaryMultiplier: number;    // 薪资溢价泡沫乘数
  layoffModifier: number;      // 裁员率修正 (额外+/-)
  downPayment: number;         // 首付
  annualMortgage: number;      // 年供
  mortgageYears: number;       // 贷款年限
  propertyValue: number;       // 房产估值
}

// 决策卡分类
export type DecisionCardCategory = '核心决策' | '生活消费' | '社交关系' | '投资理财' | '健康养生' | '技能进修' | '阶段解锁';

// 决策卡定义
export interface DecisionCard {
  id: string;
  title: string;
  description: string;
  storyDescription?: string;
  hint?: string;
  cost: number;
  // 新增字段
  category?: '核心决策' | '生活消费' | '社交关系' | '投资理财' | '健康养生' | '技能进修' | '阶段解锁' | '💝 感情';
  pathId?: RetirementPathId;  // 路径专属卡，仅该路径可抽到
  repeatable?: boolean;        // 是否可重复选择（如体检、旅行）
  maxUses?: number;             // 最大使用次数（undefined=无限）
  ageRange?: [number, number]; // 适用年龄范围（undefined=全年龄）
  cooldown?: number;           // 使用后冷却轮数（0=无冷却）
  prerequisites?: (state: GameState) => boolean;
  effect: (state: GameState) => { log: string; cost: number };
  logTemplate: string;
}

// 黑天鹅事件定义
export interface BlackSwanEvent {
  id: string;
  eventName: string;
  description: string;
  probability: (state: GameState) => number;
  condition?: (state: GameState) => boolean;
  effect: (state: GameState) => { log: string; loss?: number; aftermath?: AftermathType };
  aftermath?: AftermathType;
  aftermathDuration?: number;
}

// 结局定义
export interface Ending {
  id: string;
  title: string;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  name: string;
  skeleton: string;
  condition: (state: GameState) => boolean;
}

// 全局游戏状态 (对应设计书第二章全量变量)
export interface GameState {
  // 核心数值
  currentAge: number;
  startAge: number;   // 玩家选择的起始年龄（现实映射：开局就从这个年龄开始）
  targetAge: number;
  targetWealth: number;
  currentSavings: number;
  initMonthlySalary: number;
  currentMonthlySalary: number;
  preUnemployedSalary: number;
  careerStartSalary: number;
  
  // 职业与城市
  currentProfession: Profession;
  currentCity: CityType;
  economicCycle: EconomicCycle;
  
  // 布尔状态
  isUnemployed: boolean;
  isInsured: boolean;
  isMarried: boolean;
  hasChild: boolean;
  hasSideHustle: boolean;
  hasProperty: boolean;
  hasCommercialPension: boolean;
  isUpskilled: boolean;
  isGeoArbitrage: boolean;
  hasCar: boolean;
  carValue: number;               // 车辆当前市值（初始0，买车时设为购买价的80%）
  carAge: number;                 // 车龄（年），买车时设为0，每年+1
  annualCarCost: number;          // 年度车务总开销（油费+保险+保养+停车）
  hasHedgeOption: boolean;
  didHealthCheck: boolean;
  usedMinimalism: boolean;
  hasMBA: boolean;
  hasRetirementPlan: boolean;
  
  // 财务相关
  annualBaseCost: number;
  passiveIncome: number;
  currentMortgageCost: number;
  mortgageRemainingYears: number;
  propertyValue: number;
  annualPropertyMaintenance: number;  // 年度物业费+维修基金
  bankDepositPct: number;
  indexFundPct: number;
  speculationPct: number;
  
  // 存款分布（百分比，总和=100）
  fixedDepositPct: number;    // 银行定期存款，初始0
  stockPct: number;            // 股票，初始0
  goldPct: number;             // 黄金，初始0

  // 资产（固定资产，市值）
  shopValue: number;           // 商铺市值，初始0
  shopMonthlyRent: number;     // 商铺月租金，初始0

  // 理财状态标记
  hasStockAccount: boolean;    // 是否开了股票账户
  hasFutures: boolean;         // 是否炒期货
  hasGold: boolean;            // 是否持有黄金
  hasShop: boolean;            // 是否持有商铺

  unemployedTurns: number;
  totalYearsWorked: number;
  totalUnemployedYears: number;
  hadCriticalIllness: boolean;
  insurancePremium: number;
  
  // 人际关系系统
  parents: ParentState;
  partner: PartnerState | null;
  children: ChildState[];
  friends: FriendState[];

  // 身心状态
  stress: number;         // 压力值 0-100
  happiness: number;      // 幸福感 0-100
  health: number;         // 健康值 0-100
  consecutiveMaxStressYears: number; // 连续压力100的年数（崩溃机制计数器）

  // 日常琐事
  dailyEventLog: string[];       // 本年度日常琐事（不进lifeLog）
  thisYearMilestones: string[]; // 本年度里程碑

  // 剧情相关
  lifeLog: string[];
  originChoices: OriginChoices;
  endingTriggered: boolean;
  lastEventId: string | null;
  pendingAftermath: PendingAftermath | null;
  unlockedAchievements: string[]; // 已解锁成就ID列表

  // === 提前退休路径系统 ===
  retirementPath: RetirementPathId | null;  // 当前选择的退休路径
  pathChoiceYear: number;                   // 选择路径的年份
  pathFaith: number;                        // 信念值 0-100，低于30触发信念动摇
  pathMilestones: string[];                 // 已触发的路径里程碑事件ID
  pathCrisisTriggered: boolean;             // 中期危机是否已触发
  pathEndgameTriggered: boolean;            // 终局判定是否已触发
  isAllInPath: boolean;                     // 是否已All In（辞职全力投入路径副业）
  hasCompany: boolean;                      // All In 后是否已注册公司（公司化运营深化线）
  canRetire: boolean;                       // 是否已满足退休条件（玩家可选择何时退休）
  recentShownCards: string[];               // 最近2-3年展示过的卡ID（防重复）
  yearOpeningMonologue: string;             // 今年的心境开场白
  
  // === MBTI人格系统 ===
  mbtiType: MBTIType | null;                // 玩家的MBTI人格类型（开局选择，影响独白语气/专属事件/职业微调）
  
  // === 退休梦想系统 ===
  retirementDream: RetirementDream | null;  // 开局选择的退休梦想，决定最终报告换算维度
  
  // === 叙事事件系统（替代三卡） ===
  narrativeBranch: NarrativeBranch;         // 当前分支（路径内的故事线）
  pathSkills: Record<string, number>;       // 技能值（如 { aiSkill: 30, promptMastery: 20 }）
  narrativeEventFired: Record<string, number>; // 已触发的叙事事件ID → 触发时的年龄
  triggeredAchievements: string[];          // 已触发的成就事件ID列表
  // === 分支记忆系统（中期再分叉与回声） ===
  branchMemory: Record<string, boolean>;    // 关键分支选择记忆（如 joinedFriend/chooseMedicalAI），供后期回声事件"翻旧账"
  branchHistory: NarrativeBranch[];         // 分支切换历史（从初始分支起，含每次切换），用于叙事回望与结局差异化

  // === 路径专属动态状态（各路径初始化，非全局必填） ===
  chainHoldings?: number;                   // 链上原住民：持仓市值（现金等价）
  hasAbandonedCrypto?: boolean;             // 链上原住民：是否已放弃链上（阻止后续持仓操作）
  bioPortfolio?: number;                    // 生物赌徒：生科投资组合市值
  biologicalAge?: number;                   // 生物赌徒：生物年龄偏移（负数=更年轻）
  supplementRegime?: boolean;               // 生物赌徒：是否正在执行补剂方案
  silverBusiness?: { clients: number; reputation: number; monthlyRevenue: number }; // 银发守夜人：生意状态
  ipFollowers?: number;                     // 超级IP：粉丝数
  ipReputation?: number;                    // 超级IP：声誉值（0-100）
  aiSkillLevel?: number;                    // AI共生者：卡牌系统积累的AI技能（与pathSkills.aiSkill合并使用）
  nomadClients?: number;                    // 数字游牧民：固定客户数量
  
  // 游戏阶段
  gamePhase: 'intro' | 'quiz' | 'setup' | 'path_select' | 'playing' | 'ending';
  currentEndingId: string | null;

  // 十字路口系统
  crossroadFired: Record<string, number>; // tag -> 触发时的age

  // 卡片使用历史（用于冷却和重复判断）
  usedCardHistory: Record<string, number>; // cardId -> 最后使用的年龄

  // 卡片连锁反应待触发队列
  pendingCardEchoes?: { cardId: string; triggerAge: number; delayYears: number }[];

  // 盲盒待揭晓队列
  pendingBlindBoxes?: { outcomeId: string; triggerAge: number; triggerCardId?: string; delayYears?: number }[];

  // 人生总账单累计追踪
  lifetimeSalary: number;        // 总工资收入
  lifetimeInvestmentGain: number; // 总理财收益
  lifetimeSideHustle: number;    // 总副业收入
  currentYearSideHustle: number; // 本年剧情事件累积的副业收入（年终结算后重置）
  lifetimeLivingCost: number;    // 总生活开销
  lifetimeMortgage: number;      // 总房贷
  lifetimeChildCost: number;     // 总养娃支出
  lifetimeParentCost: number;    // 总给父母支出
  lifetimeMedicalCost: number;   // 总医疗支出
  lifetimeCardCost: number;      // 总卡片花费
  lifetimeGiftMoney: number;     // 总份子钱
  lifetimeInsuranceCost: number; // 总保险费

  // 日常事件去重与感冒免疫
  firedDailyEvents: Record<string, number>; // 日常事件ID -> 最近触发年龄（近3年去重）
  lastColdYear: number; // 上次感冒/生病年份，感冒后2年免疫
}

// 年度各来源的身心/财务变化记录
export interface WellbeingChangeEntry {
  source: string;
  stress: number;
  happiness: number;
  health: number;
  savings: number;
}

// 薪资变动明细条目
export interface SalaryChangeEntry {
  source: string;        // 来源标签：普调/技能加成/年龄黄金期/35岁断崖/经济周期/事件涨薪/事件降薪/跳槽/裁员等
  amount: number;        // 变动金额（正数涨薪，负数降薪）
  note?: string;         // 可选的一句话解释（用于工作小结叙事）
}

// 年度结算结果
export interface YearResult {
  age: number;
  salaryIncome: number;
  sideHustleIncome: number;      // 路径副业收入（All In 前）
  passiveIncome: number;
  investmentGain: number;
  bankGain: number;
  fundGain: number;
  specGain: number;
  fixedDepositGain: number;   // 定期存款收益
  stockGain: number;           // 股票收益
  goldGain: number;            // 黄金收益/亏损
  chainHoldingsGain: number;   // 链上持仓年度市值变化
  bioPortfolioGain: number;    // 生物投资组合年度市值变化
  shopRentIncome: number;      // 商铺租金收入
  shopValueChange: number;     // 商铺市值变化
  livingCost: number;
  mortgageCost: number;
  insuranceCost: number;
  netChange: number;
  events: string[];
  cardLogs: string[];
  cardDetails?: { title: string; log: string }[];  // 每张卡的标题和日志（用于故事流分组）
  newAftermath?: AftermathType;
  dailyEvents: string[];              // 本年度日常琐事
  relationshipChanges: string[];     // 人际关系变化日志
  stressChange: number;
  happinessChange: number;
  healthChange: number;
  blindBoxReveals?: { text: string; emotion: string; effectSummary: string }[];
  // === 新增字段：财务变化分项追踪 ===
  cardCost: number;
  blackSwanLoss: number;
  blackSwanEventNames: string[];  // 黑天鹅事件名称列表（用于结算面板醒目展示）
  blindBoxFinancialChange: number;
  dailyEventFinancialChange: number;
  echoFinancialChange: number;
  pensionIncome: number;
  retireIncome: number;
  // === 新增字段：自然漂移分项 ===
  naturalStressChange: number;
  naturalHappinessChange: number;
  naturalHealthChange: number;
  // === 新增字段：按来源追踪身心/财务变化 ===
  wellbeingChanges: WellbeingChangeEntry[];
  // === 新增字段：车房年度开销 ===
  carCost: number;
  carDepreciation: number;
  propertyMaintenanceCost: number;
  propertyChange: number;
  // 实际存款变化（包含所有因素，用于显示"存款变化"准确值）
  actualSavingsChange?: number;
  // 年度月薪变化（涨薪/降薪/事件导致的薪资变化）
  salaryChange?: number;
  // 薪资变动明细（按来源拆解）
  salaryBreakdown?: SalaryChangeEntry[];
  // 年度工作小结（一句话叙事，解释今年工作/收入的主要变化）
  workSummary?: string;
}

// 父母状态
export interface ParentState {
  age: number;                // 父母年龄（玩家22岁时约48-55岁）
  health: number;             // 0-100，每年自然下降
  isAlive: boolean;           // 是否在世
  livingWithPlayer: boolean;  // 是否与玩家同住
  relationShip: number;       // 关系度 0-100
}

// 伴侣性格类型
export type PartnerPersonality = '温柔型' | '事业型' | '浪漫型' | '节俭型' | '独立型';

// 恋爱阶段
export type DatingStage = 'single' | 'crush' | 'dating' | 'serious' | 'married' | 'divorced';

// 恋爱记忆（重要时刻）
export interface RomanceMemory {
  age: number;
  event: string;
  emoji: string;
}

// 伴侣状态
export interface PartnerState {
  name: string;
  age: number;
  affection: number;    // 感情度 0-100
  trust: number;         // 信任度 0-100
  marriedYear: number;   // 结婚年份（玩家年龄）
  hasDivorced: boolean;
  // 新增：恋爱系统
  personality: PartnerPersonality;
  datingStage: DatingStage;
  meetYear: number;
  trait: string;  // 一个特征标签，如"爱笑""做饭好吃""工作狂""猫奴"
  memories: RomanceMemory[];  // 重要回忆
  crushFrom?: 'friend' | 'work' | 'blind_date' | 'app' | 'travel';  // 怎么认识的
  exName?: string;  // 前任名字（分手的话记录）
}

// 子女状态
export interface ChildState {
  birthYear: number;     // 出生年份（玩家年龄）
  gender: '男' | '女';
  growthStage: '婴儿' | '幼儿' | '幼儿园' | '小学' | '初中' | '高中' | '大学' | '成年';
  academicPerformance: number; // 学业表现 0-100（小学以上有意义）
  rebelliousness: number;     // 叛逆度 0-100（初中以上有意义）
  monthlyExpense: number;     // 月开销
}

// 朋友状态
export interface FriendState {
  name: string;
  relation: number;       // 关系度 0-100
  type: '大学同学' | '同事' | '发小' | '邻居';
  borrowedAmount: number; // 欠玩家钱数（>0表示欠钱）
  lastContactAge: number; // 上次联系时的玩家年龄
}

// 日常琐事事件
export interface DailyEvent {
  id: string;
  text: string;                // 事件叙述文本
  label: string;               // 简称标签（用于收支明细/变化来源面板，如"重感冒"、"动态圈焦虑"）
  ageRange: [number, number]; // 适用年龄范围
  conditions?: (state: GameState) => boolean;  // 触发条件
  effects?: {                  // 可选效果
    stress?: number;
    happiness?: number;
    health?: number;
    savings?: number;
    parents?: Partial<ParentState>;
    partner?: Partial<PartnerState>;
  };
  priority: number;            // 优先级，数字越大越优先展示
}

// 十字路口选项
export interface CrossroadOption {
  id: string;
  label: string;             // 选项标签，如 "接受外派"
  description: string;       // 选项详细描述
  hint: string;              // 提示文本，如 "薪资+80%，但生活成本+50%"
  hintColor: 'positive' | 'negative' | 'neutral' | 'danger';
  prerequisites?: (state: GameState) => boolean;  // 选项前置条件（不满足时显示为禁用）
  disabledReason?: string | ((state: GameState) => string);   // 不满足条件时显示的禁用原因
  effect: (state: GameState) => { log: string; cost: number };
}

// 十字路口事件（人生重大选择）
export interface CrossroadEvent {
  id: string;
  title: string;              // 事件标题，如 "命运的第一次分岔"
  narrative: string;          // 叙事文本（支持换行\n）
  ageRange: [number, number]; // 适用年龄范围
  priority: number;           // 优先级，数字越大越优先
  cooldown: number;           // 冷却轮数（触发后多少轮不再触发同类事件）
  conditions: (state: GameState) => boolean;  // 触发条件
  options: CrossroadOption[]; // 2-4个选项
  tag: string;               // 标签用于冷却判定，同tag的事件共享冷却
}

// ============================================================
// 叙事事件系统（替代三卡抽卡）
// ============================================================

// 叙事事件选项
export interface NarrativeOption {
  id: string;
  label: string;             // 选项简短标签
  description: string;       // 选项详细描述
  hint: string;              // 提示文本，如 "AI技能+15，压力+8"
  hintColor: 'positive' | 'negative' | 'neutral' | 'danger';
  prerequisites?: (state: GameState) => boolean;
  disabledReason?: string;
  // 技能变化（如 { aiSkill: 15, promptMastery: 5 }）
  skillGains?: Record<string, number>;
  // 财务影响：正=收入，负=支出
  savingsChange?: number;
  // 月薪变化（如加薪/降薪）
  salaryChange?: number;
  // 被动收入变化
  passiveIncomeChange?: number;
  // 动态金额函数：按当前状态实时计算存款变化（优先于 savingsChange，用于"按资产比例投资"等场景）
  savingsChangeFn?: (state: GameState) => number;
  // 动态被动收入函数：按当前状态实时计算被动收入变化
  passiveIncomeChangeFn?: (state: GameState) => number;
  // 状态效果
  stateEffect?: (state: GameState) => void;
  // 选择后切换分支
  branchSwitch?: NarrativeBranch;
  // 选择后写入分支记忆（供后期回声事件翻旧账）
  memorySet?: Record<string, boolean>;
  // 日志文本
  log: string;
  // 是否标记为"休养生息"选项
  isRestOption?: boolean;
  // 是否触发退休判定（终极事件选项）
  triggersRetirementCheck?: boolean;
  // 盲盒触发标记：选了这个选项后，注册对应triggerCardId的延迟盲盒
  blindBoxTrigger?: string;
}

// 叙事事件（每年的情境选择，替代三卡）
export interface NarrativeEvent {
  id: string;
  title: string;
  narrative: string;          // 叙事文本（支持换行\n）
  pathId: RetirementPathId;   // 所属路径
  branch?: NarrativeBranch;   // 分支限定，undefined=所有分支可触发
  ageRange: [number, number]; // 适用年龄范围
  priority: number;           // 优先级，数字越大越优先
  weight?: number;            // 随机权重（默认1）
  conditions?: (state: GameState) => boolean;
  oncePerGame?: boolean;      // 是否只触发一次
  options: NarrativeOption[]; // 2-4个选项
  // 事件类型标记
  eventType?: 'branch_select' | 'normal' | 'crisis' | 'milestone';
  // 场景标签：触发特定CSS场景效果（如 'job_loss' | 'promotion' | 'breakup' | 'lottery' | 'illness' | 'wedding'）
  sceneTag?: string;
  // MBTI专属事件：设置后跨所有路径触发，仅当玩家mbtiType匹配时可用
  mbtiExclusive?: MBTIType;
  // 跨路径事件：设置后忽略pathId过滤（用于MBTI/哲学等通用事件）
  crossPath?: boolean;
  // 分支记忆要求：设置后事件仅在指定记忆全部命中时才可触发（用于回声事件）
  memoryRequired?: Record<string, boolean>;
  // 分支记忆任一命中：设置后事件在任一指定记忆存在时即可触发
  memoryAnyOf?: string[];
  // 知识卡片：将剧情内容翻译成可迁移的理财/心理等知识；若未配置，面板会按事件id从知识库自动匹配
  knowledge?: {
    category: 'financial' | 'psychology' | 'career' | 'health';
    title: string;
    content: string;
    tip?: string;   // 现实建议
  };
}

// 成就事件（技能达标后触发的重大成就剧情）
export interface NarrativeAchievement {
  id: string;
  title: string;
  narrative: string;          // 成就触发的叙事文本
  pathId: RetirementPathId;
  branch: NarrativeBranch;    // 所属分支
  level: 1 | 2 | 3;           // 成就等级（1=初级, 2=中级, 3=终极）
  // 触发条件：技能阈值
  skillRequirements: Record<string, number>;
  // 触发后的效果
  savingsChange?: number;
  salaryChange?: number;
  passiveIncomeChange?: number;
  stateEffect?: (state: GameState) => void;
  // 成就日志
  log: string;
  // 是否触发退休判定（终极成就）
  triggersRetirementCheck?: boolean;
}
