/**
 * 银发守夜人路径 · 完整叙事事件库
 *
 * 三条分支：
 *   silver_caregiver  — 护理服务线，亲手照顾老人，用服务质量建立品牌，重运营
 *   silver_tech       — 智慧养老线，智能设备与平台，可规模化但缺温度
 *   silver_community  — 社区运营线，日间照料中心、社交活动、政府合作
 *
 * 三个技能维度：
 *   careSkill         护理专业能力（医学知识、照护技术、共情、耐心）
 *   managementSkill   运营管理能力（招聘、培训、扩张、财务管理）
 *   policySkill       政策资源能力（政府关系、补贴、合规、行业人脉）
 *
 * 自定义状态字段：
 *   state.silverBusiness = { clients, reputation, monthlyRevenue }
 *
 * ================================================================
 * 效果应用约定：
 *   skillGains / savingsChange / salaryChange / passiveIncomeChange
 *   为声明式字段，由 store 统一应用到 state（pathSkills / currentSavings 等）。
 *   stateEffect 仅负责 stress / happiness / health / pathFaith 以及
 *   条件分支逻辑和自定义字段（silverBusiness）的初始化与调整，不重复修改
 *   上述声明式字段，以避免双重计算。
 * ================================================================
 */
import type { NarrativeEvent, NarrativeAchievement, GameState } from '../types/global.d.js';
import { registerNarrativeEvents } from './narrative-registry.js';
import { registerAchievements } from './narrative-achievements.js';
import { clamp } from '../utils/clamp.js';

// ============================================================
// 辅助函数
// ============================================================

/** 确保 pathSkills 已初始化 */
function ensureSkills(state: GameState): void {
  if (!state.pathSkills) {
    (state as any).pathSkills = {};
  }
}

/** 银发生意状态结构 */
interface SilverBusiness {
  clients: number;
  reputation: number;
  monthlyRevenue: number;
}

/** 读取银发生意状态（自定义字段，可能未初始化） */
function getSilverBusiness(state: GameState): SilverBusiness {
  return (state as any).silverBusiness || { clients: 0, reputation: 20, monthlyRevenue: 0 };
}

/** 调整客户数 */
function adjustSilverClients(state: GameState, delta: number): void {
  const biz = getSilverBusiness(state);
  biz.clients = Math.max(0, biz.clients + delta);
  (state as any).silverBusiness = biz;
}

/** 调整声誉值（0-100） */
function adjustSilverReputation(state: GameState, delta: number): void {
  const biz = getSilverBusiness(state);
  biz.reputation = clamp(biz.reputation + delta, 0, 100);
  (state as any).silverBusiness = biz;
}

/** 调整月营收 */
function adjustSilverRevenue(state: GameState, delta: number): void {
  const biz = getSilverBusiness(state);
  biz.monthlyRevenue = Math.max(0, biz.monthlyRevenue + delta);
  (state as any).silverBusiness = biz;
}

// ============================================================
// 通用事件（ages 22-24，分支选择前）
// ============================================================

const commonEvents: NarrativeEvent[] = [

  // 22岁：第一个老人客户（副业起步）
  {
    id: 'silver_first_client',
    title: '轮椅上的手',
    sceneTag: 'street',
    pathId: 'silver_economy',
    ageRange: [22, 22],
    priority: 7,
    weight: 10,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '你在老家的街道办有一份体面的工作，但每个周末都骑电动车穿街走巷，去给独居老人量血压、陪他们聊天。张奶奶是你接手的第一个正式客户：八十一岁，股骨颈骨折后卧床，女儿在深圳打工，每月给你转800块，托你每周推她去医院换药复查。\n' +
      '推着轮椅走在老家的街上，张奶奶枯瘦的手攥着你的胳膊，指甲嵌进皮肤，忽然抬头说："小伙子，你比我亲儿子还贴心。"你鼻子一酸，没接话——你怕一开口就哭出来。',
    options: [
      {
        id: 'all_in_care',
        label: '把张奶奶当亲人一样照顾',
        description: '周末全程陪护，换药、擦身、陪聊、记录每天的药量和饮食',
        hint: '护理+12 · 压力+8 · 幸福+5 · 声誉+10 · 客户+1 · 信念+5 · 副业+3000(照护费)',
        hintColor: 'positive',
        skillGains: { careSkill: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          adjustSilverClients(s, 1);
          adjustSilverReputation(s, 10);
          s.currentYearSideHustle += 3000; // 张奶奶女儿按月转的照护费，本季度到账
        },
        log: '{startAge}岁，你把张奶奶当成了自己的奶奶。每周六日准时上门，换药、翻身、记药量。张奶奶的女儿按月转来照护费，本季度到账3000元。一个月后张奶奶的女儿寄来一面锦旗，那是你人生收到的第一面锦旗。你把它藏在衣柜里——不敢让同事看到，怕他们问你周末在干什么。',
        blindBoxTrigger: 'silver_first_death',
      },
      {
        id: 'professional_distance',
        label: '保持专业距离，按合同办事',
        description: '不投入太多感情，先把周末照护流程跑通',
        hint: '护理+6 · 管理+5 · 压力+3 · 声誉+5 · 客户+1 · 信念+2',
        hintColor: 'neutral',
        skillGains: { careSkill: 6, managementSkill: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 2, 0, 100);
          adjustSilverClients(s, 1);
          adjustSilverReputation(s, 5);
        },
        log: '{startAge}岁，你给自己定了规矩：服务归服务，感情归感情。你按约定把张奶奶照顾得妥妥当当，但每次她拉着你说话时你都会看表——周一还要上班。你觉得这样是对的，但夜里偶尔会想起她攥着你胳膊的手。',
      },
      {
        id: 'study_medical',
        label: '边照顾边自学护理和医学知识',
        description: '你不懂的东西太多了，工作日晚上补课才能周末不害人',
        hint: '护理+12 · 压力+10 · 健康-3 · 声誉+5 · 客户+1 · 信念+4',
        hintColor: 'positive',
        skillGains: { careSkill: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          adjustSilverClients(s, 1);
          adjustSilverReputation(s, 5);
        },
        log: '{startAge}岁，你买了一摞护理教材和老年医学的书。工作日下班后啃到深夜，周末现学现用。褥疮怎么防、鼻饲怎么喂、降压药不能和什么同吃——你把每一条都抄在小本子上。你越学越害怕：原来照顾老人有这么多门道，你差点因为无知害了人。',
      },
    ],
  },

  // 23岁：家人的不解与羞耻
  {
    id: 'silver_family_shame',
    title: '供你上大学',
    sceneTag: 'home',
    pathId: 'silver_economy',
    ageRange: [23, 23],
    priority: 6,
    weight: 9,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '过年，亲戚聚在你家。三姨问你妈"你家孩子大学毕业在那边做什么？"你妈端菜的手顿了一下，支吾说"在……在街道办上班"。三姨点头："那挺好，稳定。"你爸接了一句："好什么好，周末还去给人家老头老太太换尿垫！"三姨压低声音："念了四年大学，周末去当保姆？\n' +
      '你没说话，低头扒饭。饭后你妈把你拉进厨房，红着眼说："供你上大学不是让你周末去伺候人的。你要是缺钱，妈去跟人借。"你张了张嘴，发现自己不知道怎么解释——你看到的那个未来，用一句话说不清。',
    options: [
      {
        id: 'prove_with_money',
        label: '憋着这口气，用收入证明自己',
        description: '你说不出大道理，那就让钱包替你说话',
        hint: '管理+10 · 压力+12 · 幸福-5 · 信念+6 · 月薪+500 · 副业+5000(加单收入)',
        hintColor: 'positive',
        skillGains: { managementSkill: 10 },
        salaryChange: 500,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.happiness = clamp(s.happiness - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.currentYearSideHustle += 5000; // 拼命接单后新增三四个客户的照护费
        },
        log: '{age}岁，三姨那句话像根刺扎在你心里。你开始拼命接单、算账、压成本，三个月后又接了三四个客户，副业月收入翻了一倍，到账5000元。过年你给妈塞了一个厚红包，她数了数眼圈又红了，什么都没说。',
      },
      {
        id: 'explain_vision',
        label: '认真跟父母讲你看到的老龄化趋势',
        description: '他们不懂趋势，但你能让他们懂你的决心',
        hint: '政策+8 · 管理+3 · 信念+8 · 幸福+3',
        hintColor: 'neutral',
        skillGains: { policySkill: 8, managementSkill: 3 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
        },
        log: '{age}岁，你跟爸妈在客厅聊到凌晨一点。你翻开手机里查到的数据：中国60岁以上人口将突破4亿，养老护理员缺口上千万。你妈听完沉默很久，最后说："妈不懂大道理，但你要是想好了，就去做。别丢了良心就行。"',
        blindBoxTrigger: 'silver_family_doubt',
      },
      {
        id: 'waver_secretly',
        label: '表面坚持，偷偷看公务员招考',
        description: '看不到头的日子，把人的骨气一点点磨没了',
        hint: '管理+3 · 压力+5 · 信念-8 · 幸福-3',
        hintColor: 'negative',
        skillGains: { managementSkill: 3 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.happiness = clamp(s.happiness - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 8, 0, 100);
        },
        log: '{age}岁，你在手机里存了一份省考职位表，每天睡前翻两眼。你投了两次简历给隔壁县的民政局临时岗，都没回音。你把这事烂在肚子里，白天继续推轮椅、换尿垫，夜里盯着天花板想：我是不是真的错了。',
      },
    ],
  },

  // 23-24岁：照顾老人的情感重量
  {
    id: 'silver_emotional_weight',
    title: '拖累',
    sceneTag: 'elderly_home',
    pathId: 'silver_economy',
    ageRange: [23, 24],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '白天你在街道办敲材料，脑子里却全是李爷爷的药量和饮食。那个周六你正给他擦背，他忽然抓住你的手，浑浊的眼睛里蓄满了泪："小伙子，你说我活成这样……是不是该早点走了？省得拖累人。"\n' +
      '你手里的毛巾停住了——安慰的话太轻，沉默又太重。你想起他床头柜上那张全家福，照片里的他还站着，笑容硬朗。你忽然意识到：衰老最残忍的不是身体的崩塌，而是一个清醒的灵魂被困在一具不听使唤的身体里。',
    options: [
      {
        id: 'empathy_presence',
        label: '什么都不说，握着他的手坐了一会儿',
        description: '有些痛苦不需要被开解，只需要被看见',
        hint: '护理+10 · 幸福+4 · 压力+6 · 信念+5 · 声誉+8',
        hintColor: 'positive',
        skillGains: { careSkill: 10 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 4, 0, 100);
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          adjustSilverReputation(s, 8);
        },
        log: '{age}岁，你什么都没说，握着李爷爷的手坐了半个小时。后来他没再提"走"的事，每次你去他都笑。他女儿偷偷给你转了红包，你没收。你知道你给不了他健康，但你能给他一个"被在乎着"的下午。',
      },
      {
        id: 'professional_reframe',
        label: '用专业的话开导他，帮他找到价值感',
        description: '教他做力所能及的康复训练，让他觉得自己还在进步',
        hint: '护理+12 · 管理+4 · 压力+8 · 信念+3 · 声誉+5 · 副业+4000(康复指导)',
        hintColor: 'neutral',
        skillGains: { careSkill: 12, managementSkill: 4 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
          adjustSilverReputation(s, 5);
          s.currentYearSideHustle += 4000; // 李爷爷女儿额外付的康复训练指导费
        },
        log: '{age}岁，你给李爷爷设计了一套床上康复操，每天做十分钟。一个月后他的左手能自己端碗了，他举着碗给你看的时候像个孩子。他女儿听说你懂康复训练，额外塞了4000元请你每周指导两次。你说"李爷爷你在进步"，他咧着歪掉的嘴笑了。那一刻你忽然觉得，专业知识原来是有温度的。',
      },
      {
        id: 'set_boundary',
        label: '告诉自己不能太共情，否则会垮掉',
        description: '同情疲劳是这行最大的职业病，你得先保护好自己',
        hint: '管理+8 · 护理+4 · 压力-3 · 信念-3 · 幸福-2',
        hintColor: 'neutral',
        skillGains: { managementSkill: 8, careSkill: 4 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 3, 0, 100);
          s.happiness = clamp(s.happiness - 2, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 3, 0, 100);
        },
        log: '{age}岁，你学会了一件事：照顾老人可以用心，但不能用命。你给自己定了规矩——不参加客户的葬礼，不留客户的联系方式在私人手机里，下班后不回忆白天的事。你觉得这让你活得更久，但偶尔夜里会觉得自己变得冷了。',
      },
    ],
  },

  // 24岁：副业扩张的临界点
  {
    id: 'silver_first_employee',
    title: '周末不够用了',
    sceneTag: 'office',
    pathId: 'silver_economy',
    ageRange: [24, 24],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '客户涨到了五个，你一个人快扛不住了。周一到周五在街道办上班，周六日从早跑到晚，电动车跑得快没电了你还没跑完。你已经在办公室打过三次瞌睡被领导看见了。有客户介绍来第六个老人——接了就要想办法分身，不接就等于把口碑往外推。\n' +
      '午休时你偷偷发了一条动态圈找周末帮工，真愿意干的只有一个叫秀兰的嫂子——四十出头，手粗得像砂纸，说"我妈瘫了三年是我伺候走的，这活我干得了"。',
    options: [
      {
        id: 'hire_xiulan_weekend',
        label: '周末雇秀兰帮忙，自己接第六个客户',
        description: '用副业收入付工资，先跑通"两个人"的模式',
        hint: '管理+10 · 护理+5 · 存款-4000 · 压力-5 · 信念+4 · 客户+2 · 月营收+800 · 副业+8000(照护费)',
        hintColor: 'positive',
        skillGains: { managementSkill: 10, careSkill: 5 },
        savingsChange: -4000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          adjustSilverClients(s, 2);
          adjustSilverRevenue(s, 800);
          s.currentYearSideHustle += 8000; // 六个客户的周末照护费，扣除秀兰日薪后净到账
        },
        log: '{age}岁，你用周末副业的收入给秀兰开了日薪。她第一次给老人翻身时轻得像托着一片叶子，你心里一块石头落了地。六个客户本季度的照护费到账8000元，扣掉秀兰的工资还剩大半。有了她，周六日终于能喘口气，但你清楚：你现在的身份还是"街道办上班族"，秀兰只知道你周末干这个，不知道你脑子里已经在想更大的事了。',
      },
      {
        id: 'train_xiulan_expand',
        label: '手把手教秀兰，让她能独立上门',
        description: '花两个月培训她，把部分客户交出去，自己腾出手跑新客户',
        hint: '管理+12 · 护理+8 · 压力+10 · 健康-3 · 信念+5 · 客户+3 · 月营收+1200 · 副业+12000(照护费)',
        hintColor: 'positive',
        skillGains: { managementSkill: 12, careSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          adjustSilverClients(s, 3);
          adjustSilverRevenue(s, 1200);
          s.currentYearSideHustle += 12000; // 八个客户的照护费，秀兰分担后净到账
        },
        log: '{age}岁，你花了两个月把翻身、鼻饲、压疮护理一项项教给秀兰。工作日晚上写培训笔记，周末现场带教。累得嗓子哑了半个月，但两个月后秀兰能独立上门了。客户涨到八个，本季度照护费到账12000元。这事能成——你自己能干，现在还能复制。白天在办公室你嘴角带着笑，同事以为你谈恋爱了。',
      },
      {
        id: 'solo_grind',
        label: '不雇人，自己扛，减少睡眠硬撑',
        description: '怕雇了人管不住反而砸招牌，宁可自己累',
        hint: '护理+8 · 压力+10 · 健康-5 · 信念+3 · 客户+1',
        hintColor: 'negative',
        skillGains: { careSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
          adjustSilverClients(s, 1);
        },
        log: '{age}岁，你没雇人，咬着牙又扛了一年。周一到周五上班，周六日从早跑到晚，每天只睡四五个小时。有次在办公室打瞌睡被领导拍了桌子，有次给老人翻身时眼前一黑差点摔倒。秀兰发社交软件问你还需不需要人，你回了句"再等等"——心里知道她是对的，但你还没准备好当"老板"。',
      },
    ],
  },
];

// ============================================================
// 分支选择事件（age 25）
// ============================================================

const branchSelectEvent: NarrativeEvent[] = [

  {
    id: 'silver_branch_select',
    title: '岔路',
    sceneTag: 'community_care',
    pathId: 'silver_economy',
    ageRange: [25, 25],
    priority: 10,
    weight: 10,
    oncePerGame: true,
    eventType: 'branch_select',
    conditions: (s) => !s.narrativeBranch || s.narrativeBranch === 'unassigned',
    narrative:
      '三年了。你白天还在街道办上班，但所有人都知道你周末"有别的安排"。你的周末照护从一个人跑变成了带着秀兰一起跑，七八个固定客户，镇上开始有人叫你"那个搞养老的小伙子"。但你心里清楚，这只是个开始——周末两天的时间是有上限的，靠"多接一单"的增长模式走不远。{age}岁这年，你必须想清楚：如果有一天要辞职全力做这件事，它到底要长成什么样。\n\n' +
      '深夜你坐在居委会借你的那间旧房里——周末用来放轮椅和血压计。面前摆着三样东西：一本护理操作手册、一台朋友寄来的智能手环样品、一张民政局发的社区养老试点文件。三个方向，三条路，你只能选一条走到黑。窗外老家的夜很静，偶尔有狗叫，你想：每个人都会老，但每个人想要的"老"是不一样的。',
    options: [
      {
        id: 'choose_caregiver',
        label: '深耕护理服务，把"伺候人"做到极致',
        description: '死磕护理质量，培训专业团队，做那个"把老人交给他就放心"的品牌。你赌的是：养老的本质是人和人之间的照护，机器替代不了。',
        hint: '护理+12 · 管理+5 · 压力+5 · 信念+6 · 月薪+1000',
        hintColor: 'positive',
        skillGains: { careSkill: 12, managementSkill: 5 },
        salaryChange: 1000,
        branchSwitch: 'silver_caregiver',
        memorySet: { choseCaregiver: true, choseTech: false, choseCommunity: false },
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          adjustSilverReputation(s, 5);
        },
        log: '{age}岁，你选了最难走的那条路——亲手把"伺候人"这件事做成一门专业。你把护理手册翻烂了，开始写自己的操作规范。别人觉得这活又脏又累，你觉得这里头有别人看不见的尊严。',
      },
      {
        id: 'choose_tech',
        label: '用技术赋能养老，做智慧养老平台',
        description: '智能手环、跌倒报警、远程监护——用技术把一个护理员的能力放大十倍。你赌的是：老龄化是确定性趋势，而技术是唯一能让服务规模化的杠杆。',
        hint: '管理+12 · 护理+5 · 存款-15000 · 压力+8 · 信念+8 · 月营收+1500',
        hintColor: 'danger',
        skillGains: { managementSkill: 12, careSkill: 5 },
        savingsChange: -15000,
        branchSwitch: 'silver_tech',
        memorySet: { choseCaregiver: false, choseTech: true, choseCommunity: false },
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          adjustSilverRevenue(s, 1500);
        },
        log: '{age}岁，你把积蓄砸进了第一批智能手环的采购和系统开发。你相信技术能让养老这件事不再只靠"人多"，而是靠"看得见"。设备到货那天你拆了一整夜的箱子，像拆一个未来。',
      },
      {
        id: 'choose_community',
        label: '做社区养老，和政府合作铺开',
        description: '日间照料中心、老年食堂、社交活动——让老人不必离开熟悉的家，在社区里安度晚年。你赌的是：政府的钱和政策是最稳定的燃料。',
        hint: '政策+12 · 管理+5 · 压力+3 · 信念+6 · 声誉+8 · 月营收+1000',
        hintColor: 'positive',
        skillGains: { policySkill: 12, managementSkill: 5 },
        branchSwitch: 'silver_community',
        memorySet: { choseCaregiver: false, choseTech: false, choseCommunity: true },
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          adjustSilverReputation(s, 8);
          adjustSilverRevenue(s, 1000);
        },
        log: '{age}岁，你揣着那份民政局文件跑了一个月的审批。日间照料中心的牌照批下来那天，你在服务站门口站了很久。你选的不是最快赚钱的路，但你相信：让老人留在熟悉的地方，才是养老该有的样子。',
      },
    ],
  },
];

// ============================================================
// 护理服务线事件（silver_caregiver，ages 26-42）
// ============================================================

const caregiverEvents: NarrativeEvent[] = [

  // 26岁：建立护理质量标准
  {
    id: 'silver_care_quality_standard',
    title: '一本手册',
    sceneTag: 'community_care',
    pathId: 'silver_economy',
    branch: 'silver_caregiver',
    ageRange: [26, 26],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.narrativeBranch === 'silver_caregiver',
    narrative:
      '你发现秀兰和另外两个护理员各干各的：秀兰先左侧翻身，老刘先右侧；有人喂饭前量血压，有人喂完才量。同一个老人被三个人用三种方式照顾，出了问题根本说不清是谁的环节。\n' +
      '你花了一个月把两年来的护理经验写成一本四十七页的《居家养老护理操作规范》，每一条都配了你自己画的简图。发给护理员时秀兰翻了两页问："你是要我们照着这个干？"你说："让每个老人不管谁来照顾，都享同样的好——这就是手册的意思。"',
    options: [
      {
        id: 'enforce_strictly',
        label: '严格执行手册，不达标就扣钱',
        description: '质量是品牌的地基，没有规矩不成方圆',
        hint: '护理+12 · 管理+10 · 压力+8 · 信念+5 · 声誉+10 · 客户+2',
        hintColor: 'positive',
        skillGains: { careSkill: 12, managementSkill: 10 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          adjustSilverReputation(s, 10);
          adjustSilverClients(s, 2);
        },
        log: '{age}岁，你把那本手册变成了铁律。第一个月有两个护理员因为不按规范操作被扣了钱，其中一个赌气辞了职。但留下的人开始服你——因为你每一条规范都是自己用命试出来的。半年后，"你家护理正规"的口碑传了出去。',
      },
      {
        id: 'iterative_training',
        label: '不扣钱，改成每周培训+考核',
        description: '用教代替罚，让标准变成肌肉记忆',
        hint: '护理+12 · 管理+8 · 压力+5 · 信念+6 · 声誉+8 · 客户+2 · 月薪+500',
        hintColor: 'positive',
        skillGains: { careSkill: 12, managementSkill: 8 },
        salaryChange: 500,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          adjustSilverReputation(s, 8);
          adjustSilverClients(s, 2);
        },
        log: '{age}岁，你把每周三晚上定为"培训夜"，亲自教翻身、教鼻饲、教急救。护理员们一开始嫌烦，但三个月后她们发现自己干活更顺了，老人反馈也好了。秀兰说"以前是凭感觉，现在心里有谱了"。',
      },
    ],
  },

  // 28岁：护理技能精进——失能老人照护
  {
    id: 'silver_care_advanced_skills',
    title: '胃管与尊严',
    sceneTag: 'clinic',
    pathId: 'silver_economy',
    branch: 'silver_caregiver',
    ageRange: [28, 28],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '新接的一个客户是周奶奶，八十四岁，阿尔茨海默症晚期加吞咽功能障碍，插着胃管。她儿子说之前请的护理员不会弄胃管，营养液推快了老人家呕吐，推慢了又堵管。\n' +
      '你之前没操作过胃管，花三天去县医院的护理科旁听，学会了冲管、营养液温度控制和回抽检查。第一次给周奶奶推营养液时你的手在抖——怕弄疼她，更怕出错。推完之后她嘴里溢出一丝笑意，虽然她可能已经不认识你是谁了。你把流速又调慢一格，在床边多坐了一会儿。',
    options: [
      {
        id: 'master_medical_care',
        label: '死磕医疗护理，啃下所有高难度操作',
        description: '胃管、尿管、气切护理、造口护理——别人不敢接的你都接',
        hint: '护理+12 · 压力+12 · 健康-4 · 信念+8 · 声誉+12 · 客户+3 · 月营收+3000',
        hintColor: 'positive',
        skillGains: { careSkill: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.health = clamp(s.health - 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          adjustSilverReputation(s, 12);
          adjustSilverClients(s, 3);
          adjustSilverRevenue(s, 3000);
        },
        log: '{age}岁，你成了镇上唯一会做医疗级护理的人。别的服务站不敢接的插管老人、气切老人全转给了你。你累得瘦了一圈，但你知道：这些最难照顾的老人，恰恰最需要专业的人。',
      },
      {
        id: 'partner_with_hospital',
        label: '和医院护理科建立转介合作',
        description: '不自己硬扛，让医院培训你的团队',
        hint: '护理+10 · 管理+12 · 政策+6 · 压力+4 · 信念+5 · 声誉+8 · 客户+2',
        hintColor: 'neutral',
        skillGains: { careSkill: 10, managementSkill: 12, policySkill: 6 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          adjustSilverReputation(s, 8);
          adjustSilverClients(s, 2);
        },
        log: '{age}岁，你跑断了腿终于让县医院护理科松了口：出院需要居家护理的老人可以转介给你，他们定期派人培训你的团队。你从一个"野路子"变成了有医院背书的正规军。',
      },
    ],
  },

  // 30岁：突发医疗紧急情况
  {
    id: 'silver_care_emergency',
    title: '三分钟',
    sceneTag: 'elderly_home',
    pathId: 'silver_economy',
    branch: 'silver_caregiver',
    ageRange: [30, 30],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '那天下午秀兰在给刘爷爷翻身时突然尖叫。你冲过去，看到刘爷爷嘴唇发紫、瞳孔放大——心梗。你的脑子一片空白，但身体比脑子快：你拨了120，然后跪下来做心肺复苏，一下、两下、三下……\n' +
      '你不知道按了多久，直到救护车来。医生后来说"再晚三分钟人就没了"。你坐在急诊室走廊的地上，双手还在抖，秀兰蹲在旁边哭。你忽然意识到：你每天面对的是随时可能离开的生命——每一个护理员都会遇到这种时刻，她们准备好了吗？',
    options: [
      {
        id: 'first_aid_training_all',
        label: '全员急救培训，每人必须拿到红十字证书',
        description: '三分钟决定生死，不能靠运气',
        hint: '护理+12 · 管理+10 · 存款-5000 · 压力+6 · 信念+8 · 声誉+10',
        hintColor: 'positive',
        skillGains: { careSkill: 12, managementSkill: 10 },
        savingsChange: -5000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          adjustSilverReputation(s, 10);
        },
        log: '{age}岁，你把所有护理员送去考了红十字急救证，你自己也考了。刘爷爷出院后他儿子送来一封感谢信，你把它裱起来挂在墙上——只是一封普通信，但上面写着"谢谢你救了我爸的命"，你觉得它比什么都重。',
        blindBoxTrigger: 'silver_accident',
      },
      {
        id: 'buy_aed_equipment',
        label: '花钱配AED和急救药箱到每个服务点',
        description: '设备+培训双保险，宁可备而不用',
        hint: '护理+8 · 管理+8 · 存款-12000 · 压力+4 · 信念+6 · 声誉+8',
        hintColor: 'neutral',
        skillGains: { careSkill: 8, managementSkill: 8 },
        savingsChange: -12000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          adjustSilverReputation(s, 8);
        },
        log: '{age}岁，你花了一万二给每个服务点配了AED和急救药箱。秀兰说"这钱花得冤枉，哪有那么多心梗"，你说"花一万二买一个万一，值"。后来那台AED真的用上了两次，你想：命不是用钱算的。',
      },
    ],
  },

  // 31岁：第一次送走客户
  {
    id: 'silver_care_first_death',
    title: '最后一程',
    sceneTag: 'funeral',
    pathId: 'silver_economy',
    branch: 'silver_caregiver',
    ageRange: [31, 31],
    priority: 7,
    weight: 9,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '张奶奶走了。凌晨四点，她女儿打来电话，声音平静得像在说一件别人的事："妈走的时候没受罪，谢谢你。"你说了句"节哀"，挂了电话，坐在床边，发现窗外的天还没亮。\n' +
      '葬礼那天你站在人群最后面。她女儿没认出你——你们只在社交软件上说过话。遗照上的张奶奶比你记忆中年轻，笑着，像是别人。你口袋里还揣着她最后一次给你的硬糖，揣了一个月了，糖纸都粘在口袋里。你没扔。',
    options: [
      {
        id: 'attend_funeral_process_grief',
        label: '参加葬礼，允许自己悲伤',
        description: '你不是机器人，你把她当过亲人',
        hint: '护理+8 · 幸福-8 · 压力+12 · 健康-3 · 信念+6 · 声誉+5',
        hintColor: 'neutral',
        skillGains: { careSkill: 8 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness - 8, 0, 100);
          s.stress = clamp(s.stress + 12, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          adjustSilverReputation(s, 5);
        },
        log: '{age}岁，你站在张奶奶的葬礼上哭得像个孩子。九年的陪伴不是一句"节哀"能带过的。回家后你在日记里写："今天送走了第一个像亲人一样的老人。我不后悔照顾她，但我第一次知道，这份工作会让我一次次经历离别。"',
      },
      {
        id: 'channel_into_hospice',
        label: '化悲痛为力量，开始研究临终关怀',
        description: '让每一个老人走得不疼、不孤单、有尊严',
        hint: '护理+12 · 管理+5 · 压力+8 · 信念+10 · 声誉+8',
        hintColor: 'positive',
        skillGains: { careSkill: 12, managementSkill: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          adjustSilverReputation(s, 8);
        },
        log: '{age}岁，张奶奶的走让你开始读临终关怀的书。你学到"尊严死"的概念——让老人在生命的最后阶段不被过度抢救、不被插满管子、不被孤零零地丢在ICU。你开始跟家属谈"如果到了那一天"，虽然每次开口都很难。',
      },
    ],
  },

  // 32岁：秀兰发脾气
  {
    id: 'silver_care_xiulan_breaks',
    title: '那一下',
    sceneTag: 'community_care',
    pathId: 'silver_economy',
    branch: 'silver_caregiver',
    ageRange: [32, 32],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '秀兰跪在你面前哭。她三天没睡了——孩子发烧39度5，老公在工地不接电话，她白天还要给六个老人翻身喂饭。昨天下午，那个失智后总把排泄物抹在墙上的李大爷，第五次把饭碗扣在地上。秀兰推了他一把。\n' +
      '李大爷没受伤，但被来看望的儿媳妇看到了："你们这是虐待老人！"她拍了视频，说要发到网上，秀兰当场就跪下了。你看着秀兰——她跟了你四年，从没出过差错；你看着李大爷——他坐在床上，茫然地看着所有人，根本不知道发生了什么。你该怎么办？',
    options: [
      {
        id: 'fire_xiulan',
        label: '开除秀兰，给家属交代',
        description: '标准就是标准，没有例外',
        hint: '管理+10 · 声誉+5 · 压力+12 · 信念-8 · 客户-10%',
        hintColor: 'danger',
        skillGains: { managementSkill: 10 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 8, 0, 100);
          adjustSilverReputation(s, 5);
          adjustSilverClients(s, -Math.max(1, Math.floor(getSilverBusiness(s).clients * 0.1)));
        },
        log: '{age}岁，你开了秀兰。她走的时候没说话，只是把围裙叠好放在桌上。你看着她的背影，知道她孩子的烧还没退。李大爷的儿媳妇删了视频，但你在行业内的口碑已经裂了一道缝。你对剩下的护工说"以后再累也不许碰老人"，她们点头，但眼神里多了一层东西——你说不清是恐惧还是失望。',
      },
      {
        id: 'protect_xiulan',
        label: '保秀兰，私下安抚家属',
        description: '她三天没睡，你不能再逼她',
        hint: '管理+5 · 声誉-8 · 压力+8 · 信念+3 · 存款-20000(赔偿)',
        hintColor: 'neutral',
        skillGains: { managementSkill: 5 },
        savingsChange: -20000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
          adjustSilverReputation(s, -8);
        },
        log: '{age}岁，你私下赔了李大爷家属两万块，求他们删视频。他们收了钱，但从此换了别家。秀兰留下来了，但你给她排了强制轮休。她第一天休息就带孩子去了医院。你看着排班表，想：如果每个护工都需要轮休，你的人手就不够了。但不开轮休，下一个"推一把"只是时间问题。',
      },
      {
        id: 'systemic_fix',
        label: '不开也不保，建轮休制度+装监控',
        description: '治标治本，花钱买规矩',
        hint: '管理+12 · 政策+8 · 声誉+3 · 存款-40000 · 压力+6 · 信念+5',
        hintColor: 'positive',
        skillGains: { managementSkill: 12, policySkill: 8 },
        savingsChange: -40000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          adjustSilverReputation(s, 3);
        },
        log: '{age}岁，你没开除秀兰，也没假装没看见。你花四万装了全覆盖监控，同时推行强制轮休制——每个护工连续上岗不得超过五天。秀兰写了检讨，李大爷家属拿到了监控录像和赔偿。行业里有人说"这小子规矩做得好"，也有人说"装监控是不信任员工"。你不知道哪个对。但秀兰轮休那天，她终于带孩子去了医院。',
      },
    ],
  },

  // 33岁：失智症照护
  {
    id: 'silver_care_dementia',
    title: '她不认识我了',
    sceneTag: 'elderly_home',
    pathId: 'silver_economy',
    branch: 'silver_caregiver',
    ageRange: [33, 33],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '王奶奶六十七岁，确诊阿尔茨海默症三年了。她的女儿哭着找到你："我妈把我忘了，她昨天拿着菜刀说要给她女儿做饭，但她以为我是小偷。我一个人真的扛不住了。"\n' +
      '你接下了王奶奶。最让你心碎的是有天她忽然认出你，喊了一声"小X"，然后说"我好像……快要把自己弄丢了"。你强忍着没哭，给她削了一个苹果。她接过苹果，又忘了你是谁。',
    options: [
      {
        id: 'dementia_specialist',
        label: '专攻失智症照护，做这个最难的细分',
        description: '失智症是最让家属崩溃的，也是最缺专业照护的',
        hint: '护理+12 · 压力+15 · 健康-5 · 信念+10 · 声誉+12 · 客户+4 · 月营收+4000',
        hintColor: 'positive',
        skillGains: { careSkill: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          adjustSilverReputation(s, 12);
          adjustSilverClients(s, 4);
          adjustSilverRevenue(s, 4000);
        },
        log: '{age}岁，你把失智症照护做成了你的招牌。你学了认知刺激疗法、怀旧疗法、音乐疗法，在服务站布置了"记忆走廊"——墙上贴满老照片和老物件，帮老人找回正在消散的记忆。家属们说"把你家当成了最后的希望"。',
      },
      {
        id: 'support_caregiver_families',
        label: '成立失智症家属互助小组',
        description: '照顾失智老人，家属的心理比老人更需要支持',
        hint: '护理+10 · 管理+10 · 政策+5 · 信念+8 · 声誉+10 · 客户+3',
        hintColor: 'neutral',
        skillGains: { careSkill: 10, managementSkill: 10, policySkill: 5 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          adjustSilverReputation(s, 10);
          adjustSilverClients(s, 3);
        },
        log: '{age}岁，你每个月办一次"失智症家属下午茶"，让那些独自扛着的儿女们坐在一起哭、一起笑、一起骂。有人说"终于有人懂我了"。你发现：养老不只是照顾老人，也是照顾那些照顾老人的人。',
      },
    ],
  },

  // 35岁：居家上门服务扩展
  {
    id: 'silver_care_home_expansion',
    title: '十二个网格',
    sceneTag: 'community_care',
    pathId: 'silver_economy',
    branch: 'silver_caregiver',
    ageRange: [35, 35],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '你站在地图前，把整个县城划成了十二个网格，尝试把"一个服务站"变成"十二个"。但复制不是复印——新招的三十多个护理员良莠不齐，有人给老人喂饭不抬头、有人记不清药量、有人上班刷手机被家属投诉。你一天跑四个网格，晚上回到办公室看到投诉表，想把地图撕了。\n' +
      '秀兰说："你一个人盯十二个点，不现实。"你知道她说得对，但你不知道怎么放手——你怕一松手，那些老人就照顾不好了。护理这行的质量，太依赖"人"了。',
    options: [
      {
        id: 'build_qc_system',
        label: '建立质检体系，抽查+回访+奖惩',
        description: '用制度管人，而不是你一个人盯所有点',
        hint: '管理+12 · 护理+5 · 政策+5 · 压力+8 · 信念+6 · 声誉+8 · 客户+5 · 月营收+5000',
        hintColor: 'positive',
        skillGains: { managementSkill: 12, careSkill: 5, policySkill: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          adjustSilverReputation(s, 8);
          adjustSilverClients(s, 5);
          adjustSilverRevenue(s, 5000);
        },
        log: '{age}岁，你建了一套质检体系：每月随机抽查20%的老人，每周电话回访家属，投诉三次直接换人。你从一个"亲自干"的人变成了"定标准、盯结果"的人。十二个网格终于稳住了，虽然你不亲手照顾老人了，但你知道她们被照顾得不错。',
      },
      {
        id: 'stay_hands_on',
        label: '缩小规模，宁可少赚也要亲自盯质量',
        description: '你不信任别人能照顾好你的老人',
        hint: '护理+12 · 压力-3 · 信念+4 · 声誉+5 · 客户+2',
        hintColor: 'neutral',
        skillGains: { careSkill: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          adjustSilverReputation(s, 5);
          adjustSilverClients(s, 2);
        },
        log: '{age}岁，你把扩张计划砍了一半，只做六个网格。别人笑你"小富即安"，你心想：我这行赢的从来不是规模，是每一个老人都被照顾好。你每周还是会亲自上门，那些早期的老客户只认你。',
      },
    ],
  },

  // 37岁：临终关怀与尊严
  {
    id: 'silver_care_hospice_dignity',
    title: '不疼',
    sceneTag: 'elderly_home',
    pathId: 'silver_economy',
    branch: 'silver_caregiver',
    ageRange: [37, 37],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '陈爷爷七十九岁，胰腺癌晚期，医生说最多三个月。他不愿意在医院躺着，想回家，但回家后疼得整夜哼哼，女儿不忍心看，找到你。\n' +
      '你联系了县医院的安宁疗护团队，学会疼痛评估和镇痛泵的家庭管理，每天去两次。走的那天清晨他忽然清醒了，拉着你的手说"不疼了"，然后闭上了眼。你站在门口，眼泪也下来了——人这一辈子最后的要求，其实不高：不疼，不脏，不孤单。',
    options: [
      {
        id: 'build_hospice_program',
        label: '把临终关怀做成正式服务项目',
        description: '让更多老人能在家里、在熟悉的人身边走完最后一程',
        hint: '护理+12 · 政策+10 · 管理+8 · 压力+10 · 信念+12 · 声誉+12 · 月营收+3000',
        hintColor: 'positive',
        skillGains: { careSkill: 12, policySkill: 10, managementSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          adjustSilverReputation(s, 12);
          adjustSilverRevenue(s, 3000);
        },
        log: '{age}岁，你成立了"安宁照护"项目组，专门服务临终老人。你跟医院签了合作协议，培训了八名安宁疗护专员。你跟家属们说"我不能让他不死，但我能让他不疼、不脏、不害怕"。这句话后来被写进了你们公司的服务承诺里。',
      },
      {
        id: 'personal_mission',
        label: '不做成项目，自己坚持做',
        description: '临终关怀太重，你怕团队扛不住，先自己扛',
        hint: '护理+12 · 压力+15 · 健康-5 · 信念+8 · 声誉+10',
        hintColor: 'neutral',
        skillGains: { careSkill: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          adjustSilverReputation(s, 10);
        },
        log: '{age}岁，你一个人扛着临终关怀的活。每个走掉的老人都在你心里留一道痕，你开始失眠，开始怕接电话。秀兰说"你这样下去要垮的"，你说"我没事"。但你知道你不太好。',
      },
    ],
  },

  // 41岁：护理品牌化（从40岁错开，避免挤占40岁中期再分叉）
  {
    id: 'silver_care_brand',
    title: '一块牌子',
    sceneTag: 'community_care',
    pathId: 'silver_economy',
    branch: 'silver_caregiver',
    ageRange: [41, 41],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '十八年了。你从一间小门面、一块手写牌子，做到了覆盖半个县的专业护理品牌——六十多个护理员、两百多个固定客户，墙上挂满了锦旗和感谢信。采访播出后，隔壁两个县的人也来找你。\n' +
      '你站在新建的培训中心门口，看着新一批护理员在练习翻身操作。第一块手写牌子的墨迹仿佛还在眼前——那时候你什么都没有，只有一盆消毒水、一块抹布和一颗不服气的心。',
    options: [
      {
        id: 'franchise_model',
        label: '开放加盟，把品牌和标准输出到更多地方',
        description: '你一个人管不了所有老人，但你的标准可以',
        hint: '管理+12 · 政策+10 · 存款+30000 · 压力+6 · 信念+8 · 客户+10 · 月营收+8000',
        hintColor: 'positive',
        skillGains: { managementSkill: 12, policySkill: 10 },
        savingsChange: 30000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          adjustSilverClients(s, 10);
          adjustSilverRevenue(s, 8000);
        },
        log: '{age}岁，你的护理品牌开始输出加盟。你给加盟商定了铁规矩：用你的手册、考你的证、接受你的质检。有人嫌你管太宽，你说"这块牌子是用十八年命换出来的，不能毁在别人手里"。',
      },
      {
        id: 'stay_independent',
        label: '不加盟，坚持自营，保住质量底线',
        description: '加盟一多就管不住，你不拿老人的命冒险',
        hint: '护理+10 · 管理+8 · 压力-2 · 信念+6 · 声誉+10 · 客户+5 · 月营收+5000',
        hintColor: 'neutral',
        skillGains: { careSkill: 10, managementSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 2, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          adjustSilverReputation(s, 10);
          adjustSilverClients(s, 5);
          adjustSilverRevenue(s, 5000);
        },
        log: '{age}岁，你拒绝了所有加盟请求。你宁可慢，也不冒质量的风险。你把新赚的钱投进了护理员培训学校——你要从源头解决"缺人"的问题。你妈说"你这辈子就交代在这上面了"，你笑了笑，没反驳。',
      },
    ],
  },
];

// ============================================================
// 智慧养老线事件（silver_tech，ages 26-42）
// ============================================================

const techEvents: NarrativeEvent[] = [

  // 26岁：第一个智能设备——跌倒检测手环
  {
    id: 'silver_tech_first_device',
    title: '手环亮了',
    sceneTag: 'elderly_home',
    pathId: 'silver_economy',
    branch: 'silver_tech',
    ageRange: [26, 26],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.narrativeBranch === 'silver_tech',
    narrative:
      '你花了一个月的工资进了二十台跌倒检测手环，给二十个独居老人戴上。第一个月手环响了六次，其中四次是误报——老人弯腰捡东西、拍被子、手环没戴紧。你被半夜叫醒四次，开始怀疑这东西到底靠不靠谱。\n' +
      '直到第二十七天凌晨两点，手环响了。你冲到赵爷爷家，发现他摔在卫生间地上，髋骨骨折，已经疼得说不出话。救护车来的时候医生说"再晚一小时就危险了"。你看着赵爷爷手腕上那个亮着红灯的塑料圈，忽然觉得这东西值了。',
    options: [
      {
        id: 'iterate_device',
        label: '跟厂商反馈误报问题，推动产品迭代',
        description: '误报不解决，老人迟早会把这东西扔了',
        hint: '管理+12 · 护理+5 · 压力+8 · 信念+8 · 声誉+5 · 客户+3 · 月营收+2000',
        hintColor: 'positive',
        skillGains: { managementSkill: 12, careSkill: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          adjustSilverReputation(s, 5);
          adjustSilverClients(s, 3);
          adjustSilverRevenue(s, 2000);
        },
        log: '{age}岁，你成了那家手环厂商的"最烦人的客户"——每周发一份误报分析报告，要求改算法。三个月后新固件上线，误报率降了70%。厂商老板说"你比我们的产品经理还懂老人"，你说"因为我是真的在用"。',
      },
      {
        id: 'manual_plus_device',
        label: '手环+人工回访，双保险',
        description: '不指望设备万无一失，用人工补漏洞',
        hint: '护理+10 · 管理+8 · 压力+10 · 信念+5 · 声誉+8 · 客户+2',
        hintColor: 'neutral',
        skillGains: { careSkill: 10, managementSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          adjustSilverReputation(s, 8);
          adjustSilverClients(s, 2);
        },
        log: '{age}岁，你给手环配了人工回访：每天上午给戴手环的老人打一个电话，确认平安。老人其实不太在乎手环，但每天那个电话让他们觉得"有人惦记着"。你发现技术是骨架，温度是血肉。',
      },
    ],
  },

  // 28岁：社区试点项目
  {
    id: 'silver_tech_pilot',
    title: '试点',
    sceneTag: 'office',
    pathId: 'silver_economy',
    branch: 'silver_tech',
    ageRange: [28, 28],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '街道办主任找到了你："省里在推智慧养老试点，需要一个落地单位。你做不做？"你心跳加速——这是政府背书的机会。但试点意味着要给一个社区的两百多位独居老人全装上设备，还要搭数据后台、培训社区干部，街道办只给了三个月，补贴要等验收后才拨。\n' +
      '你算了一笔账：前期投入要十万上下，你的全部积蓄都得押进去，可能还要找朋友凑。验收不过，这些钱就打水漂了。你站在街道办门口抽了半包烟，最后掐灭烟头走了进去："我接。"',
    options: [
      {
        id: 'go_big_pilot',
        label: '全力投入，做全省标杆试点',
        description: '赌一把，成了你就有了政府背书的护城河',
        hint: '管理+12 · 政策+10 · 护理+5 · 存款-100000 · 压力+14 · 信念+10 · 客户+20 · 月营收+8000',
        hintColor: 'danger',
        skillGains: { managementSkill: 12, policySkill: 10, careSkill: 5 },
        savingsChange: -100000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 14, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          adjustSilverClients(s, 20);
          adjustSilverRevenue(s, 8000);
        },
        log: '{age}岁，你把身家押进了这个试点。三个月没睡过一个整觉，你带着团队挨家挨户装设备、教老人用、调后台，还找朋友借了钱周转。验收那天省里来了三辆车，领导看着大屏上跳动的实时数据说"这就是智慧养老的样子"。补贴到账那天你终于还清了借款，手里还多了一块金光闪闪的"省级示范"牌匾。',
      },
      {
        id: 'conservative_pilot',
        label: '只做五十户的小范围试点',
        description: '稳妥起见，先跑通流程再扩大',
        hint: '管理+10 · 政策+8 · 存款-30000 · 压力+10 · 信念+6 · 客户+8 · 月营收+3000',
        hintColor: 'neutral',
        skillGains: { managementSkill: 10, policySkill: 8 },
        savingsChange: -30000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          adjustSilverClients(s, 8);
          adjustSilverRevenue(s, 3000);
        },
        log: '{age}岁，你跟街道办谈妥只做五十户。规模小了点，投入也控制在三万块，但你把每一户都做成了"样板"。验收时领导看了三户就满意了，虽然补贴不多，但你没背债。你心想：步子小点没关系，别摔。',
      },
    ],
  },

  // 30岁：技术vs人工护理的张力
  {
    id: 'silver_tech_vs_human',
    title: '冰冷的精准',
    sceneTag: 'office',
    pathId: 'silver_economy',
    branch: 'silver_tech',
    ageRange: [30, 30],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '你的智慧养老平台已经接入了三百多位老人，后台数据跑得很漂亮——心率、睡眠、跌倒、用药提醒，全在屏幕上。\n' +
      '但那天你收到一封投诉信。孙奶奶的孙子说："你们的系统每天准时提醒我奶奶吃药，但她跟我说，她最期待的不是那个提醒，而是以前那个会上门的小姑娘——她走了以后，奶奶再没人说话了。你们的数据很准，但我奶奶很孤独。"你盯着那封信看了很久：你的系统能监测心率，但监测不到孤独。你忽然问自己：你到底是在用技术照顾老人，还是在用技术替代照顾？',
    options: [
      {
        id: 'hybrid_model',
        label: '做"技术+人工"的混合模式',
        description: '设备负责监测，人工负责陪伴，两者缺一不可',
        hint: '管理+12 · 护理+10 · 压力+8 · 信念+10 · 声誉+10 · 客户+5 · 月营收+3000',
        hintColor: 'positive',
        skillGains: { managementSkill: 12, careSkill: 10 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          adjustSilverReputation(s, 10);
          adjustSilverClients(s, 5);
          adjustSilverRevenue(s, 3000);
        },
        log: '{age}岁，你重新设计了服务模型：设备做"眼睛"，护理员做"手和心"。系统发现异常自动派单给最近的护理员上门，每个老人每周至少有一次面对面的探访。成本上去了，但孙奶奶的孙子再没投诉过。你把系统后台打开，看了一眼今天的派单——十二个老人的上门探访，每一个后面都跟着一个护理员的名字。',
      },
      {
        id: 'pure_tech_scale',
        label: '坚持纯技术路线，靠规模摊薄成本',
        description: '人工太贵了，只有纯技术才能做到人人用得起',
        hint: '管理+12 · 压力+5 · 信念-5 · 声誉-5 · 客户+8 · 月营收+4000',
        hintColor: 'neutral',
        skillGains: { managementSkill: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
          adjustSilverReputation(s, -5);
          adjustSilverClients(s, 8);
          adjustSilverRevenue(s, 4000);
        },
        log: '{age}岁，你把人工探访改成了"可选增值服务"，基础套餐只卖设备+APP。客户数涨了，营收也涨了，但投诉也多了——老人不会用APP，子女嫌数据看不懂，有些独居老人十天半个月没跟活人说过话。你看着增长的KPI，心里不太踏实。',
      },
    ],
  },

  // 32岁：数据隐私争议
  {
    id: 'silver_tech_privacy',
    title: '谁在看奶奶的数据',
    sceneTag: 'office',
    pathId: 'silver_economy',
    branch: 'silver_tech',
    ageRange: [32, 32],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '一个老人家属在群里发了一篇长文，质问你："你们的摄像头装在我妈卧室里，她的隐私谁保证？你们后台谁在看？数据卖不卖？"群里炸了，十几个家属跟着质疑，有人要求拆设备。\n' +
      '更糟的是，你发现合作的一家保健品公司在偷偷问你的运营人员要老人健康数据做"精准营销"。你坐在办公室里，面前摆着两份合同：一份是保健品公司开价二十万的数据合作，一份是你准备起草的隐私保护承诺书。你知道该选哪一份。但选了承诺书，就意味着砍掉一笔不小的收入。',
    options: [
      {
        id: 'privacy_first',
        label: '断绝数据合作，公开隐私保护承诺',
        description: '老人的信任比二十万贵',
        hint: '管理+10 · 政策+8 · 压力+5 · 信念+12 · 声誉+12 · 客户+3',
        hintColor: 'positive',
        skillGains: { managementSkill: 10, policySkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          adjustSilverReputation(s, 12);
          adjustSilverClients(s, 3);
        },
        log: '{age}岁，你当着家属的面签了隐私保护承诺书：卧室只装姿态识别不存画面，数据加密存储不对外分享，家属随时可查可删。那家保健品公司被你拉黑了。少了二十万，但你换来了一句话——"你家靠谱，老人的事交给你放心"。',
      },
      {
        id: 'gray_area_deal',
        label: '签数据合作，但脱敏后只给 aggregate 数据',
        description: '行业都在做，你不做别人也会做',
        hint: '管理+8 · 存款+20000 · 压力+10 · 信念-10 · 声誉-8',
        hintColor: 'negative',
        skillGains: { managementSkill: 8 },
        savingsChange: 20000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 10, 0, 100);
          adjustSilverReputation(s, -8);
        },
        log: '{age}岁，你签了那份合同。脱敏数据、聚合统计，听起来冠冕堂皇。但你知道保健品公司拿到数据后会精准推销，那些老人会被电话骚扰。你在合同上签字时手有点抖，你告诉自己"行业都这样"，但那天晚上你失眠了。',
      },
    ],
  },

  // 34岁：平台化
  {
    id: 'silver_tech_platform',
    title: '一个后台',
    sceneTag: 'community_care',
    pathId: 'silver_economy',
    branch: 'silver_tech',
    ageRange: [34, 34],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '你做了一个决定：把你的系统开放成一个平台，让其他养老机构也能接入。你提供设备、后台、培训，他们提供线下服务，你抽成。但你低估了一件事——接入的机构质量参差不齐。有一家机构为了省钱，把跌倒检测手环换成了山寨货，结果一个老人摔了没报警，住了三天院才被发现。\n' +
      '家属把责任甩给了你——"我们用的是你的平台"。你站在被投诉的机构门口，看着那面印着你logo的招牌，第一次觉得"平台"两个字重得喘不过气。',
    options: [
      {
        id: 'strict_access_control',
        label: '建立准入和退出机制，不合格就踢',
        description: '平台不能只抽成不管事，出了事砸的是你的牌子',
        hint: '管理+12 · 政策+8 · 压力+8 · 信念+8 · 声誉+10 · 客户+8 · 月营收+6000',
        hintColor: 'positive',
        skillGains: { managementSkill: 12, policySkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          adjustSilverReputation(s, 10);
          adjustSilverClients(s, 8);
          adjustSilverRevenue(s, 6000);
        },
        log: '{age}岁，你花了一个月制定了平台准入标准：设备必须用你指定的型号、护理员必须持证、后台数据必须实时同步。三个月内你踢掉了五家不达标的机构，有人骂你"独裁"，你说"拿老人的命做生意，我不敢不独裁"。',
      },
      {
        id: 'exit_platform_stay_direct',
        label: '放弃平台化，回到直营',
        description: '管不了别人，只管自己',
        hint: '护理+10 · 管理+8 · 压力-5 · 信念+5 · 声誉+8 · 客户+3',
        hintColor: 'neutral',
        skillGains: { careSkill: 10, managementSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          adjustSilverReputation(s, 8);
          adjustSilverClients(s, 3);
        },
        log: '{age}岁，你关掉了平台开放，回到直营。你少赚了平台抽成的钱，但你睡得着觉了。你告诉自己：养老这行，慢就是快，少就是多。你管不了全行业的老人，但你能管好你的那些。',
      },
    ],
  },

  // 36岁：数据隐私丑闻（与34岁巨头免费价格战区分，聚焦数据主权议题）
  {
    id: 'silver_tech_giant_battle',
    title: '数据黑市',
    sceneTag: 'community_care',
    pathId: 'silver_economy',
    branch: 'silver_tech',
    ageRange: [36, 36],
    priority: 7,
    weight: 9,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '巨头被曝光了——他们把免费设备收集的老人健康数据卖给了保险公司和保健品商。你一位客户的儿子发现，父亲因"心率异常记录"被保险公司拒保重疾险。消息在社区炸了锅。\n' +
      '客户们恐慌地来找你："你的系统会不会也卖我们的数据？"运营总监说这是机会——"巨头自毁了，客户会回来"。但你看着那些愤怒又无助的家属，觉得这不是抢客户的时候。你面临的问题不在"怎么赢"，而在"怎么证明你和他们不一样"。',
    options: [
      {
        id: 'data_sovereignty',
        label: '建立数据主权体系，数据本地加密、用户自主授权',
        description: '把"你的数据归你"做成核心卖点',
        hint: '政策+12 · 管理+10 · 存款-25000 · 压力+10 · 信念+12 · 声誉+10',
        hintColor: 'positive',
        skillGains: { policySkill: 12, managementSkill: 10 },
        savingsChange: -25000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          adjustSilverReputation(s, 10);
          // 巨头丑闻后部分客户回流，但数据系统投入大，营收净降约10%
          const biz = getSilverBusiness(s);
          adjustSilverClients(s, Math.round(biz.clients * 0.1));
          adjustSilverRevenue(s, -Math.round(biz.monthlyRevenue * 0.1));
        },
        log: '{age}岁，你没有趁火打劫抢客户，而是花了一个季度建了一套数据主权体系——所有健康数据本地加密，老人或家属授权才能查看，每次访问都有日志。你把"你的数据归你"印在了每一台设备上。半年后，那些从巨头逃回来的客户，回来是因为你说到做到了——跟便宜没关系。',
      },
      {
        id: 'open_source_audit',
        label: '开源数据处理流程，邀请第三方审计',
        description: '用彻底的透明换取信任',
        hint: '政策+10 · 管理+8 · 存款-15000 · 压力+8 · 信念+8 · 声誉+8',
        hintColor: 'neutral',
        skillGains: { policySkill: 10, managementSkill: 8 },
        savingsChange: -15000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          adjustSilverReputation(s, 8);
          // 开源赢得信任但客户增长有限，营收净降约5%
          const biz = getSilverBusiness(s);
          adjustSilverClients(s, Math.round(biz.clients * 0.05));
          adjustSilverRevenue(s, -Math.round(biz.monthlyRevenue * 0.05));
        },
        log: '{age}岁，你做了一个同行觉得疯了的决定——把数据处理流程全部开源，请了一家第三方安全公司做审计，报告全文公开。有人说你"把底裤都给别人看了"，但那些被巨头出卖过的老人家属看完审计报告后说："就冲你这份坦诚，我信你。"透明换来的信任，比营销费贵，但比营销费真。',
      },
    ],
  },

  // 38岁：远程监护系统
  {
    id: 'silver_tech_remote_monitor',
    title: '一千公里外的心跳',
    sceneTag: 'office',
    pathId: 'silver_economy',
    branch: 'silver_tech',
    ageRange: [38, 38],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '你在北上广深打了一个广告："你在外打拼，父母在家养老，我们做你和父母之间的那双眼睛。"这个广告精准击中了千万在外打工的子女的痛点。一个在深圳打工的女儿发来消息："我每天早上打开APP看我妈的心率，就像她还在我身边一样。谢谢你们。"\n' +
      '但你心里清楚，这双"眼睛"也有局限。有次系统显示一个老人整夜未动，你打电话没人接，派人上门发现老人只是在沙发上睡了一夜——没事。但另一次同样的数据，上门后发现老人已经走了。你坐在办公室里盯着屏幕上跳动的数字，分不清哪个是活着的心跳，哪个是沉默。',
    options: [
      {
        id: 'ai_prediction',
        label: '开发AI健康预警，提前发现风险',
        description: '从"事后报警"升级到"事前预警"',
        hint: '管理+12 · 护理+8 · 存款-15000 · 压力+8 · 信念+8 · 声誉+10 · 客户+8 · 月营收+5000',
        hintColor: 'positive',
        skillGains: { managementSkill: 12, careSkill: 8 },
        savingsChange: -15000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          adjustSilverReputation(s, 10);
          adjustSilverClients(s, 8);
          adjustSilverRevenue(s, 5000);
        },
        log: '{age}岁，你投了十五万开发了AI健康预警模型，能从心率变异性、睡眠质量、活动量的微小变化中预测心梗和中风风险。第一个月就提前预警了三例，两个老人被及时送医。那个深圳的女儿说"是你们让我妈多活了好几年"。',
      },
      {
        id: 'human_check_in',
        label: '加人工巡查，技术+人力的双重确认',
        description: 'AI再聪明也不能替代一双真实的眼睛',
        hint: '护理+12 · 管理+8 · 压力+6 · 信念+6 · 声誉+8 · 客户+5 · 月营收+3000',
        hintColor: 'neutral',
        skillGains: { careSkill: 12, managementSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          adjustSilverReputation(s, 8);
          adjustSilverClients(s, 5);
          adjustSilverRevenue(s, 3000);
        },
        log: '{age}岁，你在系统里加了"人工巡查确认"环节：任何异常数据先由护理员上门核实，再决定是否通知家属。成本高了，但再没出过"整夜未动"的误判。你想：技术跑得快，但得有人跟在后面兜底。',
      },
    ],
  },

  // 41岁：AI辅助健康预警的成熟
  {
    id: 'silver_tech_ai_mature',
    title: '它比我先看见',
    sceneTag: 'office',
    pathId: 'silver_economy',
    branch: 'silver_tech',
    ageRange: [41, 41],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '你的AI健康预警系统接入了八千多位老人的数据，每天处理上百万条生命体征。\n' +
      '那天系统给一个老人标了红色预警：连续三天深睡眠下降40%、静息心率升高8次/分、凌晨三点有异常体动。护理员坚持送医，查出早期心衰——如果再晚一个月，后果不堪设想。你站在大屏前想：你{startAge}岁回老家时什么都没有，如今一台服务器守护着八千个人的晚年。技术不冷，冷的是不用它的人。',
    options: [
      {
        id: 'open_api_ecosystem',
        label: '开放API，让全行业的养老机构都能用',
        description: '好东西不该只有你有，八千个变八百万个',
        hint: '管理+12 · 政策+12 · 存款+40000 · 压力+5 · 信念+10 · 声誉+12 · 客户+15 · 月营收+10000',
        hintColor: 'positive',
        skillGains: { managementSkill: 12, policySkill: 12 },
        savingsChange: 40000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          adjustSilverReputation(s, 12);
          adjustSilverClients(s, 15);
          adjustSilverRevenue(s, 10000);
        },
        log: '{age}岁，你把预警系统做成了开放平台，免费给中小养老机构用，只收技术服务费。有人说你傻"白送核心竞争力"，你说"八千个老人我护得住，八百万个我护不住，得让更多人一起护"。你从"做养老的"变成了"给养老行业造工具的"。',
      },
      {
        id: 'keep_moat',
        label: '保持技术壁垒，做最贵最好的那一家',
        description: '开放了就不值钱了，高端市场才是你的菜',
        hint: '管理+12 · 护理+8 · 压力-2 · 信念+5 · 声誉+10 · 客户+5 · 月营收+8000',
        hintColor: 'neutral',
        skillGains: { managementSkill: 12, careSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 2, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          adjustSilverReputation(s, 10);
          adjustSilverClients(s, 5);
          adjustSilverRevenue(s, 8000);
        },
        log: '{age}岁，你把系统做成了高端品牌，只服务付得起月费的中高端家庭。客户少了，但客单价高了，利润也好了。你知道那些付不起费用的老人怎么办，但你说服自己"我做不了所有人"。这句话你说了很多遍，但每次说都觉得少了点什么。',
      },
    ],
  },
];

// ============================================================
// 社区运营线事件（silver_community，ages 26-42）
// ============================================================

const communityEvents: NarrativeEvent[] = [

  // 26岁：第一个日间照料中心
  {
    id: 'silver_community_first_center',
    title: '一盏灯',
    sceneTag: 'community_care',
    pathId: 'silver_economy',
    branch: 'silver_community',
    ageRange: [26, 26],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.narrativeBranch === 'silver_community',
    narrative:
      '你把社区门口一间废弃的棋牌室改成了日间照料中心。刷了墙，铺了防滑地胶，买了五张躺椅、两张麻将桌、一台血压计。开业第一天来了三个老人，第二天五个，第三天八个——与其说来"被照顾"，不如说她们是来找人说话的。\n' +
      '你站在门口看着老人们打牌、量血压、晒太阳，忽然觉得：养老不一定意味着"卧床"和"失能"。更多老人的需求其实很简单——白天有个去处，有人说话，晚上回家睡觉。你给她们亮了一盏白天的灯。',
    options: [
      {
        id: 'enrich_activities',
        label: '丰富活动内容，做成"老年幼儿园"',
        description: '不只是坐着，要让老人动起来、笑起来',
        hint: '管理+12 · 护理+5 · 政策+5 · 压力+6 · 信念+8 · 声誉+10 · 客户+5 · 月营收+2000',
        hintColor: 'positive',
        skillGains: { managementSkill: 12, careSkill: 5, policySkill: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          adjustSilverReputation(s, 10);
          adjustSilverClients(s, 5);
          adjustSilverRevenue(s, 2000);
        },
        log: '{age}岁，你把日间照料中心做成了"老年幼儿园"：上午做手指操、唱歌，下午下棋、做手工，每周五办一次生日会。老人们每天早上准时来"报到"，比上班还积极。有人说"来这比在家等死强"，你听了心里一酸，但也知道她说的是真话。',
      },
      {
        id: 'focus_meals_service',
        label: '先把老年食堂做起来，解决吃饭问题',
        description: '很多独居老人最大的困难，是吃不上热饭——陪伴反而是其次',
        hint: '管理+10 · 政策+8 · 压力+4 · 信念+6 · 声誉+8 · 客户+4 · 月营收+1500',
        hintColor: 'neutral',
        skillGains: { managementSkill: 10, policySkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          adjustSilverReputation(s, 8);
          adjustSilverClients(s, 4);
          adjustSilverRevenue(s, 1500);
        },
        log: '{age}岁，你支起了一口大锅，开始给社区老人做午饭。三菜一汤，软烂少盐，一顿十块钱。第一周来了三十多人，有个奶奶吃了两口就哭了，说"我老伴走了以后，我再没吃过热乎饭"。你转身去厨房，偷偷抹了把眼。',
      },
    ],
  },

  // 28岁：政府合作/民政局对接
  {
    id: 'silver_community_gov_partner',
    title: '红头文件',
    sceneTag: 'office',
    pathId: 'silver_economy',
    branch: 'silver_community',
    ageRange: [28, 28],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '民政局的科长来调研，看了你的日间照料中心后说"不错，但规模太小了。省里有社区养老补贴，一个中心补二十万，条件是面积达标、服务达标、台账齐全"。你心跳加速——二十万能让你再开三个中心。但你翻了翻申报条件：面积、持证护理员、每月服务人次、细化台账……你现在一条都不够。\n' +
      '更难的是"走流程"。科长暗示你"得跟街道、社区、民政三方都打通"。你一个回老家创业的年轻人，没有体制内的人脉，连门朝哪开都不清楚。你站在民政局大门口，看着进进出出的人，不知道该先迈哪只脚。',
    options: [
      {
        id: 'hustle_gov_relations',
        label: '硬着头皮跑关系，把补贴拿下来',
        description: '二十万能让你的事业上一个台阶，值得放下身段',
        hint: '政策+12 · 管理+8 · 压力+12 · 信念+6 · 声誉+5 · 客户+8 · 月营收+3000',
        hintColor: 'positive',
        skillGains: { policySkill: 12, managementSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          adjustSilverReputation(s, 5);
          adjustSilverClients(s, 8);
          adjustSilverRevenue(s, 3000);
        },
        log: '{age}岁，你用了半年跑通了三方关系。你学会了在饭局上敬酒、在办公室门口等两个小时只为说五分钟的话、把台账做到连标点符号都挑不出毛病。补贴批下来那天你喝醉了，哭着说"为这二十万我把脸都丢光了"。但你第二天擦干眼泪，拿着钱开了第二家中心。',
      },
      {
        id: 'self_fund_grow',
        label: '不跑关系，靠自己慢慢攒',
        description: '补贴的条件太苛刻，不值得为它变形',
        hint: '管理+10 · 护理+5 · 压力+5 · 信念+8 · 声誉+8 · 客户+3',
        hintColor: 'neutral',
        skillGains: { managementSkill: 10, careSkill: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          adjustSilverReputation(s, 8);
          adjustSilverClients(s, 3);
        },
        log: '{age}岁，你没去跑补贴。你把精力全花在把第一家中心做好上——口碑传出去后，社区主动来找你合作，免房租给你场地。你少拿了二十万补贴，但你保住了自己的底线。后来科长说"你这人，轴，但靠谱"。',
      },
    ],
  },

  // 30岁：志愿者项目
  {
    id: 'silver_community_volunteer',
    title: '一老一小',
    sceneTag: 'community_care',
    pathId: 'silver_economy',
    branch: 'silver_community',
    ageRange: [30, 30],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '你的人手永远不够。你管着三个日间照料中心，一百多个老人，但护理员只有十几个。退休教师老刘随口一句"我们这些退休的也算劳动力啊，身体好的可以帮身体差的"点醒了你。\n' +
      '你设计了一个"低龄老人帮高龄老人"的志愿者互助项目：健康的老人经过培训，去照顾失能老人，每次服务换"时间币"，将来自己需要照顾时可以兑换回来。第一期招了二十个志愿者，最大的七十三岁。你看着这些银发志愿者戴上红袖章去给更老的老人送饭、量血压，忽然觉得：每个人都在变老，但变老不等于没用。',
    options: [
      {
        id: 'time_bank_model',
        label: '把"时间银行"做成制度，推广开来',
        description: '今天我帮人，明天人帮我，让互助可持续',
        hint: '管理+12 · 政策+12 · 护理+5 · 压力+6 · 信念+10 · 声誉+12 · 客户+6 · 月营收+2000',
        hintColor: 'positive',
        skillGains: { managementSkill: 12, policySkill: 12, careSkill: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          adjustSilverReputation(s, 12);
          adjustSilverClients(s, 6);
          adjustSilverRevenue(s, 2000);
        },
        log: '{age}岁，你的"时间银行"上了省报。标题写的是"低龄老人当志愿者，时间币存进未来"。半年后全省有十几个社区来学习你的模式。你站在讲台上分享时，底下坐着一排白发苍苍的志愿者，他们冲你竖大拇指。你忽然觉得：这才是养老该有的样子——不是被照顾，是被需要。',
      },
      {
        id: 'partner_university',
        label: '跟大学合作，让大学生来做志愿者',
        description: '年轻人有热情有精力，老人也需要新鲜的面孔',
        hint: '管理+10 · 政策+8 · 压力+4 · 信念+8 · 声誉+10 · 客户+4',
        hintColor: 'neutral',
        skillGains: { managementSkill: 10, policySkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          adjustSilverReputation(s, 10);
          adjustSilverClients(s, 4);
        },
        log: '{age}岁，你跟隔壁师范大学签了合作协议，每周三下午大学生来中心陪老人做活动。老人们管那些大学生叫"孙子孙女"，大学生管老人叫"爷爷奶奶"。有个老人跟一个大四女生说"你长得像我孙女"，女生红了眼眶。你想：代际之间的温度，是任何专业服务都替代不了的。',
      },
    ],
  },

  // 32岁：代际互动活动
  {
    id: 'silver_community_intergen',
    title: '一碗汤的距离',
    sceneTag: 'park',
    pathId: 'silver_economy',
    branch: 'silver_community',
    ageRange: [32, 32],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '你在社区里推动一个大胆的计划：把日间照料中心和社区幼儿园建在一起，让老人和孩子共享一个院子。有人觉得荒唐——"老人和孩子混在一起多危险"，但你想试试。\n' +
      '效果出乎意料。老人们每天下午趴在栏杆上看孩子们做操、画画、打闹，脸上有了活气；坐轮椅的爷爷教孩子们下棋，奶奶给小姑娘扎辫子。一个妈妈跟你说："我儿子以前怕老人，现在天天吵着要来找爷爷下棋。他终于知道，老人不可怕，只是慢了一点。"你站在院子中间，想起一句话：最好的养老，不是把老人隔离起来照顾，而是让他们还活在生活里。',
    options: [
      {
        id: 'formalize_intergen',
        label: '把代际融合做成正式项目，申报示范点',
        description: '这种模式值得被更多人看到、复制',
        hint: '政策+12 · 管理+10 · 压力+5 · 信念+12 · 声誉+12 · 客户+5 · 月营收+2000',
        hintColor: 'positive',
        skillGains: { policySkill: 12, managementSkill: 10 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          adjustSilverReputation(s, 12);
          adjustSilverClients(s, 5);
          adjustSilverRevenue(s, 2000);
        },
        log: '{age}岁，你的"代际融合"项目被省里评为创新示范点。媒体来拍了一组照片：轮椅上的老人和蹦蹦跳跳的孩子在同一个院子里，阳光把两代人的影子叠在一起。那张照片后来挂在你办公室墙上，每次累到想放弃时你就看一眼——那才是你做养老的理由。',
      },
      {
        id: 'keep_small_warm',
        label: '不申报，保持小而暖的状态',
        description: '一申报就要应付检查、做台账，怕变了味',
        hint: '管理+8 · 护理+5 · 压力-2 · 信念+6 · 声誉+8 · 客户+3',
        hintColor: 'neutral',
        skillGains: { managementSkill: 8, careSkill: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 2, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          adjustSilverReputation(s, 8);
          adjustSilverClients(s, 3);
        },
        log: '{age}岁，你没去申报示范点。你怕一旦变成"样板"就要应付无穷无尽的检查和接待，老人们反而成了道具。你把那个院子守得小小的、暖暖的，只在社区内部口口相传。有人说你没出息，你觉得：出息不重要，那些老人和孩子脸上的笑是真的。',
      },
    ],
  },

  // 34岁：政策倡导
  {
    id: 'silver_community_advocacy',
    title: '一封信',
    sceneTag: 'conference',
    pathId: 'silver_economy',
    branch: 'silver_community',
    ageRange: [34, 34],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '你写了一封信，寄给省民政厅。信里没有客套话，只有你十二年来的观察：补贴门槛太高、护理员没有资格认定、独居老人的精神慰藉在政策里几乎是空白。你原以为会石沉大海，但一个月后，民政厅处长打来电话，说省里在起草新条例，请你来参加座谈会。\n' +
      '你坐在省城的会议室里，对面是一排西装革履的官员和专家，手心全是汗。但你开口的第一句话就让全桌安静了："在座的各位可能没有亲手给老人换过尿垫，我换过十二年。我来说说一线的真相。"',
    options: [
      {
        id: 'become_advocate',
        label: '抓住机会，成为养老政策的民间代言人',
        description: '你的十二年一线经验是任何专家都替代不了的',
        hint: '政策+12 · 管理+8 · 压力+8 · 信念+12 · 声誉+12 · 客户+5 · 月营收+3000',
        hintColor: 'positive',
        skillGains: { policySkill: 12, managementSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          adjustSilverReputation(s, 12);
          adjustSilverClients(s, 5);
          adjustSilverRevenue(s, 3000);
        },
        log: '{age}岁，你从一个小镇创业者变成了省里养老政策座谈会的常客。你提的"降低社区养老补贴门槛""建立护理员分级认证""将精神慰藉纳入服务标准"三条建议，有两条写进了新条例。你把那份条例复印了一份贴在办公室——这份底气，是那些你照顾过的老人们给你的。',
        blindBoxTrigger: 'silver_policy_win',
      },
      {
        id: 'stay_grassroots',
        label: '提完意见就回来，不做"活动家"',
        description: '你不想变成开会的人，你想留在一线',
        hint: '政策+8 · 护理+8 · 压力-2 · 信念+6 · 声誉+8 · 客户+3',
        hintColor: 'neutral',
        skillGains: { policySkill: 8, careSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 2, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          adjustSilverReputation(s, 8);
          adjustSilverClients(s, 3);
        },
        log: '{age}岁，你去了一次座谈会就回来了。处长打电话叫你再参加，你说"我得回去照顾老人了"。你知道政策很重要，但你更知道自己擅长什么。你把意见提了，剩下的交给该管的人。你回到社区，继续推轮椅、量血压、陪老人晒太阳。',
      },
    ],
  },

  // 37岁：区域扩张
  {
    id: 'silver_community_expansion',
    title: '五个镇',
    sceneTag: 'community_care',
    pathId: 'silver_economy',
    branch: 'silver_community',
    ageRange: [37, 37],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '你的社区养老模式已经在三个镇跑通了，现在周边两个镇的镇长主动来找你，说"我们也想搞，你能不能来开？"跨出这一步就是跨区域扩张，你招了三个"站长"，每镇一个，把你的手册和制度复制过去。\n' +
      '但复制的不只是制度，还有"味道"。第一个新站开业那天你去视察，站长很努力，但老人们的笑不如老站开心，志愿者没有老站那种自发的热情。你想起老站门口那棵老槐树——树下的老人们一坐就是一下午，谁也不用招呼谁。这种自在，这里还没有。',
    options: [
      {
        id: 'patient_replication',
        label: '一个镇一个镇慢慢来，不急着铺开',
        description: '每个站都要养出"家"的味道，急不得',
        hint: '管理+12 · 政策+8 · 护理+5 · 压力+5 · 信念+8 · 声誉+10 · 客户+8 · 月营收+4000',
        hintColor: 'positive',
        skillGains: { managementSkill: 12, policySkill: 8, careSkill: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          adjustSilverReputation(s, 10);
          adjustSilverClients(s, 8);
          adjustSilverRevenue(s, 4000);
        },
        log: '{age}岁，你定了一条规矩：新站开业第一年，你每月至少去待一周，亲自带站长融入社区。五个站花了三年才全部养"熟"。有人说你太慢，你说"社区养老不是开店，是种树——根扎不深，风一吹就倒"。',
        blindBoxTrigger: 'silver_expand',
      },
      {
        id: 'rapid_franchise',
        label: '快速复制，先占住市场再说',
        description: '趁政策东风赶紧铺，晚了别人就抢了',
        hint: '管理+12 · 政策+10 · 压力+12 · 信念+3 · 声誉+3 · 客户+12 · 月营收+6000',
        hintColor: 'neutral',
        skillGains: { managementSkill: 12, policySkill: 10 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
          adjustSilverReputation(s, 3);
          adjustSilverClients(s, 12);
          adjustSilverRevenue(s, 6000);
        },
        log: '{age}岁，你一口气开了五个新站。数量上去了，但质量参差不齐。有两个站因为站长不行、老人不满意，口碑反而下滑了。你开始疲于"救火"，从一个站跑到另一个站灭火。你想起自己说过"急不得"，苦笑了一下。',
      },
    ],
  },

  // 40岁：模式输出
  {
    id: 'silver_community_model_export',
    title: '标准答案',
    sceneTag: 'conference',
    pathId: 'silver_economy',
    branch: 'silver_community',
    ageRange: [40, 40],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '十八年了。你的"社区嵌入式养老"模式被省里列为推广样板，民政厅出了一本手册发到全省每一个街道。但你心里清楚，"模式"这两个字轻飘飘的，真正重的，是十八年里那些没法写进手册的东西——秀兰的手、张奶奶的笑、陈爷爷最后那句"不疼了"。手册能复制流程，复制不了人心。\n' +
      '培训结束后，一个年轻的社区干部找到你："我也想回老家做社区养老，你有什么建议？"你看着他，像看到了十八年前的自己。你想了很久，说了八个字："从一碗饭开始，别急。"',
    options: [
      {
        id: 'mentor_next_gen',
        label: '成立孵化营，手把手教年轻人做社区养老',
        description: '一个人的力量有限，但一群人可以改变一个行业',
        hint: '政策+12 · 管理+12 · 压力+5 · 信念+12 · 声誉+12 · 客户+10 · 月营收+5000',
        hintColor: 'positive',
        skillGains: { policySkill: 12, managementSkill: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          adjustSilverReputation(s, 12);
          adjustSilverClients(s, 10);
          adjustSilverRevenue(s, 5000);
        },
        log: '{age}岁，你办了第一期"社区养老孵化营"，招了二十个想回老家做养老的年轻人。你把十八年的经验倾囊相授——从怎么跟街道办打交道到怎么给老人翻身。有个学员说"你是我们这代人的灯塔"，你说"别当灯塔，当火把——自己烧着，照亮一小片就行"。',
      },
      {
        id: 'scale_platform',
        label: '做连锁品牌，把社区养老做成连锁生意',
        description: '用品牌力覆盖更多社区',
        hint: '管理+12 · 政策+8 · 存款+25000 · 压力+8 · 信念+5 · 客户+10 · 月营收+7000',
        hintColor: 'neutral',
        skillGains: { managementSkill: 12, policySkill: 8 },
        savingsChange: 25000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          adjustSilverClients(s, 10);
          adjustSilverRevenue(s, 7000);
        },
        log: '{age}岁，你的社区养老品牌开到了第十个镇。你注册了商标、统一了VI、做了小程序。投资人开始找你谈融资。你从"做养老的"变成了"做养老连锁的"。但你偶尔会想起当年那间废弃棋牌室——那时候什么都没有，但每个老人的名字你都记得。',
      },
    ],
  },

  // 42岁：养老社区建成
  {
    id: 'silver_community_village',
    title: '花园里的人',
    sceneTag: 'community_care',
    pathId: 'silver_economy',
    branch: 'silver_community',
    ageRange: [42, 42],
    priority: 6,
    weight: 9,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '二十年了。你终于建成了一个真正的"养老社区"——有花园、有菜地、有活动室、有食堂、有医务室，老人们住自己的小屋，白天在社区里活动，需要帮助时按一下铃就有人来。\n' +
      '开业那天你站在花园里，想起了二十年前你推着第一个张奶奶的轮椅走在街上，她攥着你的胳膊说"你比我儿子还贴心"。你妈站在你旁边，忽然说了一句："当年我说你回来伺候人是没出息。现在我觉得，你做的这事，比考上公务员有出息多了。"你没说话，但眼眶热了。',
    options: [
      {
        id: 'continue_mission',
        label: '继续做下去，终点也是新的起点',
        description: '你还有想做的事——让每个乡镇都有一个这样的社区',
        hint: '政策+12 · 管理+10 · 信念+12 · 声誉+10 · 客户+5 · 月营收+3000',
        hintColor: 'positive',
        skillGains: { policySkill: 12, managementSkill: 10 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          adjustSilverReputation(s, 10);
          adjustSilverClients(s, 5);
          adjustSilverRevenue(s, 3000);
        },
        log: '{age}岁，你没有停下。你开始计划把养老社区复制到更多的乡镇。你知道这一辈子可能做不完，但你想起那个年轻的社区干部问你"有什么建议"时你说的那八个字——"从一碗饭开始，别急"。你笑了笑，继续走。',
      },
      {
        id: 'step_back_mentor',
        label: '退到幕后，让年轻人接班',
        description: '你已经把路趟出来了，该让更年轻的人走下去了',
        hint: '管理+12 · 政策+8 · 压力-8 · 幸福+8 · 信念+10 · 声誉+8',
        hintColor: 'neutral',
        skillGains: { managementSkill: 12, policySkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 8, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          adjustSilverReputation(s, 8);
        },
        log: '{age}岁，你把日常运营交给了你培养的站长们，自己只做战略和培训。你终于有了周末，第一次在周六的早晨睡到自然醒。你走到花园里，老人们冲你招手"小X来了"，你笑了——二十年了，他们还叫你"小X"。',
      },
    ],
  },
];

// ============================================================
// 跨分支事件（所有分支均可触发）
// ============================================================

const crossBranchEvents: NarrativeEvent[] = [

  // 29岁：父亲中风
  {
    id: 'silver_cross_parent_illness',
    title: '轮到你爸了',
    sceneTag: 'hospital',
    pathId: 'silver_economy',
    ageRange: [29, 29],
    priority: 7,
    weight: 9,
    oncePerGame: true,
    narrative:
      '你爸中风了。左半边身子动不了，说话含含糊糊。你站在医院的走廊里，手机还响着——服务站那边有三个老人等着你上门。你妈哭着说"你爸一直不肯去做体检，说没事，现在……"。你看着病床上那个倔强的老头，忽然发现他老了：头发全白了，脸上的皱纹像干裂的河床。\n' +
      '你忽然意识到一个残忍的事实：你照顾了七年别人的父母，现在轮到照顾自己的父母了。你用专业的护理知识给别人翻身、喂药、做康复——现在这些技能要用在你爸身上了。你不知道该庆幸自己有这个本事，还是该哭。',
    options: [
      {
        id: 'care_own_father',
        label: '亲自照顾父亲，用你的专业',
        description: '这些年你学了那么多，现在用在自己家人身上',
        hint: '护理+10 · 压力+15 · 健康-5 · 幸福+5 · 信念+10 · 声誉+5',
        hintColor: 'neutral',
        skillGains: { careSkill: 10 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          adjustSilverReputation(s, 5);
        },
        log: '{age}岁，你每天下班后赶去医院给你爸做康复训练。你给他翻身、活动关节、练发音。一个月后他能含糊地叫你名字了，你眼泪差点掉下来。他忽然用能动的右手抓住你的手，说"儿……子，你选……的路……是对的"。这是你爸第一次认可你。',
      },
      {
        id: 'hire_caregiver_for_dad',
        label: '请秀兰去照顾父亲，你专心忙事业',
        description: '你最信任的人照顾你最亲的人',
        hint: '管理+10 · 压力+8 · 幸福+3 · 信念+6',
        hintColor: 'neutral',
        skillGains: { managementSkill: 10 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '{age}岁，你让秀兰每天去照顾你爸。她比你还有耐心，你爸脾气不好时她不恼，还逗他笑。你妈说"秀兰比亲闺女还亲"。你心里感激，但也有点愧疚——你照顾了那么多别人的父母，自己的爸却交给了别人。',
      },
      {
        id: 'balance_both',
        label: '两边跑，白天忙事业晚上陪父亲',
        description: '哪个都不想放下，硬扛',
        hint: '护理+8 · 管理+5 · 压力+13 · 健康-6 · 信念+8',
        hintColor: 'danger',
        skillGains: { careSkill: 8, managementSkill: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 13, 0, 100);
          s.health = clamp(s.health - 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '{age}岁，你白天跑五个服务点，晚上去医院陪夜。你瘦了十五斤，黑眼圈深得像两个洞。秀兰说"你再这样你也要躺医院了"，你说"我没事"。但有一天你在给老人翻身时眼前一黑，差点摔倒——你知道你不好了。',
      },
    ],
  },

  // 31岁：张奶奶走了（跨分支版本——非护理线也能经历这个情感节点）
  {
    id: 'silver_cross_first_death',
    title: '九年',
    sceneTag: 'funeral',
    pathId: 'silver_economy',
    ageRange: [31, 31],
    priority: 7,
    weight: 9,
    oncePerGame: true,
    conditions: (s) => s.narrativeBranch !== 'silver_caregiver' && s.isAllInPath === true,
    narrative:
      '张奶奶走了。你认识她九年了。从{startAge}岁那年你推着轮椅走进老人家的门，到现在你的养老站/智慧平台/社区中心已经服务了几百个老人——张奶奶始终是那个最开始的人。她女儿打电话来的时候声音很平静："妈走的时候没受罪。这些年谢谢你。"你挂了电话，在办公室坐了很久。\n' +
      '九年前她攥着你的手说"你比我儿子还贴心"的时候，你以为自己只是接了一单副业。现在你明白了：你不是在做生意，你是在陪一群人走最后一段路。张奶奶走了，但她推轮椅时指过的那棵桂花树还在院子里。',
    options: [
      {
        id: 'attend_funeral_grieve',
        label: '去送她最后一程',
        description: '不管你现在做的是平台还是社区，她是你的起点',
        hint: '护理+10 · 幸福-8 · 压力+10 · 信念+8',
        hintColor: 'neutral',
        skillGains: { careSkill: 10 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness - 8, 0, 100);
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '{age}岁，你去参加了张奶奶的葬礼。你站在人群后面，看着遗照上那个笑了九年的老人。你想起第一天上门时她塞给你的橘子，想起她推轮椅时指过的桂花树。你没有哭，但回家的路上你绕路去看了那棵树——它还在，秋天了，满树桂花。',
      },
      {
        id: 'establish_memorial',
        label: '以她的名字设一个纪念项目',
        description: '让更多老人像她一样被好好对待',
        hint: '管理+8 · 护理+8 · 存款-8000 · 压力+6 · 信念+12 · 声誉+10',
        hintColor: 'positive',
        skillGains: { careSkill: 8, managementSkill: 8 },
        savingsChange: -8000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          adjustSilverReputation(s, 10);
        },
        log: '{age}岁，你以张奶奶的名字设立了一个"桂花基金"，专门补贴独居失能老人的照护费用。你在启动仪式上说："张奶奶让我知道，养老不是生意，是陪伴。"基金的第一笔钱是你自己掏的。你妈说"你疯了"，但你知道张奶奶在天上会笑。',
      },
    ],
  },

  // 33岁：行业大会
  {
    id: 'silver_cross_conference',
    title: '众生相',
    sceneTag: 'conference',
    pathId: 'silver_economy',
    ageRange: [33, 33],
    priority: 5,
    weight: 6,
    oncePerGame: true,
    narrative:
      '你受邀参加全国养老行业发展大会，在省城的大酒店里。你穿着最好的衣服走进会场，满眼都是西装革履，PPT上写满了"银发经济""万亿市场""蓝海赛道"。\n' +
      '一个投资人说"养老是下一个房地产"，一个创业者说"我们用AI颠覆传统养老"。你坐在角落里，觉得他们说的养老和你做的养老好像不是同一个东西。茶歇时一个老教授认出你，拉着你的手说："满会场都在谈银发经济，但没几个人谈银发的人。你是少数在谈人的。"你愣了一下，忽然觉得自己没那么孤单了。',
    options: [
      {
        id: 'speak_truth',
        label: '在提问环节站起来，说一线的真话',
        description: '他们需要听到一个真正给老人换过尿垫的人的声音',
        hint: '政策+12 · 管理+5 · 压力+8 · 信念+12 · 声誉+10 · 客户+3',
        hintColor: 'positive',
        skillGains: { policySkill: 12, managementSkill: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          adjustSilverReputation(s, 10);
          adjustSilverClients(s, 3);
        },
        log: '{age}岁，你站起来说："你们谈的银发经济，是万亿市场、是蓝海赛道。但我看到的银发经济，是一个老人摔倒后没人扶、是一个失智老人忘了自己女儿的名字、是一个护理员月薪三千块干着最脏最累的活。如果这个行业连这些都解决不了，万亿市场就是个笑话。"全场安静了五秒，然后掌声响起。',
      },
      {
        id: 'network_investors',
        label: '低调混圈子，积累人脉和资源',
        description: '会上的关系可能比真话更值钱',
        hint: '政策+10 · 管理+8 · 压力+3 · 信念+3 · 声誉+5 · 客户+2 · 月营收+2000 · 副业+15000(新客户预付)',
        hintColor: 'neutral',
        skillGains: { policySkill: 10, managementSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
          adjustSilverReputation(s, 5);
          adjustSilverClients(s, 2);
          adjustSilverRevenue(s, 2000);
          s.currentYearSideHustle += 15000; // 会上对接的异地客户预付的一季度照护费
        },
        log: '{age}岁，你在茶歇时加了三十个社交软件——投资人、地产商、政府官员。你学会了说场面话，学会了"合作共赢"。有两个外地的民政干部介绍了当地的独居老人家庭给你，预付了一季度的照护费15000元。回程的火车上你翻着那些名片，心想：这些人能帮你把事业做大，但他们不会理解你为什么做这件事。你把手机收起来，看着窗外发呆。',
      },
    ],
  },

  // 35岁：本地竞争者入局
  {
    id: 'silver_cross_competitor',
    title: '隔壁老李',
    sceneTag: 'community_care',
    pathId: 'silver_economy',
    ageRange: [35, 35],
    priority: 5,
    weight: 6,
    oncePerGame: true,
    narrative:
      '镇上开了一家新的养老服务机构，老板叫老李，以前做建材的，看养老赚钱就转了行。他的价格比你低30%，还打广告说"五星级服务，白菜价格"。你的客户走了十几个，有家属说"老李那边便宜，我们先去试试"。你嘴上说理解，心里不是滋味——你知道老李那边用的护理员都是临时招的，没培训过，但家属只看价格。\n' +
      '三个月后，那些走的客户陆续回来了："老李那边是便宜，但护理员三天两头换，老人认生；有次老人发烧没人发现，烧了两天才送医。"你没有幸灾乐祸，只是默默把老人重新接回来。你知道：价格能抢走客户，但质量才能留住人心。',
    options: [
      {
        id: 'compete_on_quality',
        label: '不打价格战，用质量和服务说话',
        description: '低价抢市场是死路，养老不是卖白菜',
        hint: '管理+10 · 护理+8 · 存款-10000 · 压力+10 · 信念+8 · 声誉+10 · 副业+18000(回流客户付费)',
        hintColor: 'positive',
        skillGains: { managementSkill: 10, careSkill: 8 },
        savingsChange: -10000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          adjustSilverReputation(s, 10);
          // 价格战初期流失约25%客户，靠质量赢回大部分，净流失约10%
          const biz = getSilverBusiness(s);
          const lostClients = Math.round(biz.clients * 0.25);
          const recoveredClients = Math.round(lostClients * 0.6);
          adjustSilverClients(s, -lostClients + recoveredClients);
          // 营收短期下降约15%（为留住客户做增值服务，成本增加）
          adjustSilverRevenue(s, -Math.round(biz.monthlyRevenue * 0.15));
          s.currentYearSideHustle += 18000; // 流失客户回流后补交的照护费，口碑带来新客户付费
        },
        log: '{age}岁，你没降价。你把精力花在提升服务质量上——增加上门回访、建立家属社交软件群每日汇报、给每个老人建健康档案。这半年你自掏腰包加服务，收入掉了一截。但口碑回来了，回来的客户还带了新客户，补交和预付的照护费到账18000元。老李的店撑了一年关了——低价换来的客户留不住，劣质服务出了事谁也担不起。你叹了口气：又多了一批被伤害过的老人。',
      },
      {
        id: 'collaborate_with_competitor',
        label: '主动找老李合作，帮他提升质量',
        description: '与其恶性竞争，不如把蛋糕一起做大',
        hint: '管理+12 · 政策+8 · 存款-5000 · 压力+5 · 信念+10 · 声誉+12',
        hintColor: 'neutral',
        skillGains: { managementSkill: 12, policySkill: 8 },
        savingsChange: -5000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          adjustSilverReputation(s, 12);
          // 合作期间仍有约20%客户被低价吸引，部分回流，净流失约15%
          const biz = getSilverBusiness(s);
          const lostClients = Math.round(biz.clients * 0.2);
          const recoveredClients = Math.round(lostClients * 0.25);
          adjustSilverClients(s, -lostClients + recoveredClients);
          adjustSilverRevenue(s, -Math.round(biz.monthlyRevenue * 0.18));
        },
        log: '{age}岁，你主动去找了老李。他以为你来叫板，没想到你递过去一本护理手册说"用这个，能少出事"。老李愣了半天，问"你不怕我抢你生意？"你说"养老的生意大着呢，我一个人做不完。但老人出事，是所有人的事"。你花了些精力帮他培训人员，虽然还是丢了一些客户，但后来老李成了你的合作伙伴——他接中低端客户，你做专业照护，互不抢生意。',
      },
    ],
  },

  // 38岁：媒体关注
  {
    id: 'silver_cross_media',
    title: '聚光灯',
    sceneTag: 'community_care',
    pathId: 'silver_economy',
    ageRange: [38, 38],
    priority: 5,
    weight: 6,
    oncePerGame: true,
    narrative:
      '省台的记者来了，说要给你拍一个专题片。摄像机架在你的服务站里，记者举着话筒问你："是什么让你坚持了十六年？"你对着镜头说了很多——老龄化趋势、社区养老的价值、护理专业化的重要性。但你心里知道，镜头前的你和真实的你之间隔着一段距离：真实的你凌晨三点给老人换尿垫、蹲在葬礼上哭、被家属指着鼻子骂"你们怎么照顾的"。\n' +
      '专题片播出后，你"火"了。社交软件里涌入几百条消息，有人要合作、有人要投资、有人要入职。但也有以前的同学发来消息："你现在是名人了啊，还记得我们吗？"你不知道怎么回。你最怕的，是被看见之后，再也回不到那个安安静静推轮椅的下午。',
    options: [
      {
        id: 'use_platform_for_good',
        label: '借势发声，为整个行业争取关注',
        description: '既然被看见了，就让更多人看到养老的真问题',
        hint: '政策+12 · 管理+8 · 压力+8 · 信念+10 · 声誉+12 · 客户+8 · 月营收+3000 · 副业+20000(新客户付费)',
        hintColor: 'positive',
        skillGains: { policySkill: 12, managementSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          adjustSilverReputation(s, 12);
          adjustSilverClients(s, 8);
          adjustSilverRevenue(s, 3000);
          s.currentYearSideHustle += 20000; // 专题片播出后涌入的新客户预付照护费
        },
        log: '{age}岁，你开始接受更多采访，但每次都不说"我多伟大"，而是说"护理员工资太低了""失智老人家庭需要更多支持""农村养老是被遗忘的角落"。专题片播出后找你的家庭暴增，新客户预付了20000元照护费。你的声音被更多人听到了，省里的领导开始关注你提的问题。你知道聚光灯不会永远亮，但趁亮的时候，能照亮多少是多少。',
      },
      {
        id: 'decline_spotlight',
        label: '婉拒后续采访，回到一线',
        description: '你不适合做公众人物，你适合做护理员',
        hint: '护理+8 · 管理+5 · 压力-5 · 信念+8 · 声誉+8 · 客户+3',
        hintColor: 'neutral',
        skillGains: { careSkill: 8, managementSkill: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          adjustSilverReputation(s, 8);
          adjustSilverClients(s, 3);
        },
        log: '{age}岁，你拒绝了第二批采访请求。记者不理解，你说"上电视改变不了老人吃药的问题，我得回去干活了"。你回到服务站，秀兰说你"傻，出名了不好吗"，你笑了笑。你知道自己要的，从来都是每一个老人都被好好对待——出名算什么。',
      },
    ],
  },

  // 日常缝隙：台阶上的盒饭
  {
    id: 'silver_cross_doorstep_lunch',
    title: '台阶上的盒饭',
    sceneTag: 'home',
    pathId: 'silver_economy',
    ageRange: [27, 27],
    priority: 3,
    weight: 5,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '周六下午四点，你刚给陈爷爷换完药，下一家还有半小时。你没走远，就坐在他家门口的台阶上，扒一份八块钱的盒饭。\n' +
      '夕阳把整条巷子染成橘红色，隔壁老太婆在阳台上浇花，水滴打在晾衣杆上叮叮当当。陈爷爷在屋里咳了两声，你竖起耳朵听了一会儿——没事，是清嗓子。你把最后一口饭扒完，靠在门框上看了一会儿天。这种什么都不用想的一刻，难得。',
    options: [
      {
        id: 'sit_a_bit_longer',
        label: '多坐一会儿，看夕阳落下去',
        description: '难得发一次呆',
        hint: '压力-6 · 健康+3 · 幸福+3',
        hintColor: 'positive',
        skillGains: {},
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 6, 0, 100);
          s.health = clamp(s.health + 3, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
        },
        log: '{age}岁，你在台阶上多坐了十分钟。夕阳从橘红变成暗红，巷子里的灯一盏盏亮起来。你什么都没想，就看着天色变暗。站起来的时候腿有点麻，但心里轻了不少。',
      },
      {
        id: 'chat_with_grandpa',
        label: '回屋陪陈爷爷说说话',
        description: '他一个人住，话都没人说',
        hint: '护理+4 · 声誉+2 · 幸福+2 · 信念+2',
        hintColor: 'positive',
        skillGains: { careSkill: 4 },
        stateEffect: (s) => {
          adjustSilverReputation(s, 2);
          s.happiness = clamp(s.happiness + 2, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 2, 0, 100);
        },
        log: '{age}岁，你回去陪陈爷爷聊了会儿。他讲他年轻时在工厂当钳工的事，讲他老伴怎么追的他。你听了一半就听出他说过——但他说得高兴，你就当第一次听。临走时他说"小X，下次来多坐会儿"。你答应了。',
      },
      {
        id: 'plan_next_steps',
        label: '边吃边盘算下一步',
        description: '难得有空，想想以后',
        hint: '管理+3 · 信念+3',
        hintColor: 'neutral',
        skillGains: { managementSkill: 3 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '{age}岁，你在台阶上把下一步想了想：客户再涨两个就该招人了，秀兰一个人忙不过来。你在手机备忘录里敲了几个字，太阳已经落到房顶下面去了。你站起来，拍拍裤子上的灰，往下一家走去。',
      },
    ],
  },

  // 36岁：AI护理机器人进院——温度vs效率
  {
    id: 'silver_cross_carebot',
    title: '铁手',
    sceneTag: 'community_care',
    pathId: 'silver_economy',
    ageRange: [36, 36],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '区里拨了一笔"智慧养老"专项款，给你的服务站配了两台AI护理机器人。白色外壳、温柔女声、能精准翻身、喂饭、量血压，24小时不休息，还不闹情绪。秀兰第一天就跟它杠上了——机器人给李爷爷翻身动作标准得像教科书，但李爷爷皱着眉头不说话；秀兰走过去，把手垫在他腰下面说"还是我来吧"，他手才放松了。\n' +
      '厂商代表跟你算账：一台机器人顶三个护工，两年回本。你看着机器人给老人喂饭——勺子精准递到嘴边，不会洒、不会烫，但老人的目光是空的。你忽然明白：体力活它能做，但它不会在老人哭的时候握住他们的手，不会记得谁不吃香菜，也不会在凌晨三点陪一个怕黑的奶奶说话。',
    options: [
      {
        id: 'adopt_robot_human_hybrid',
        label: '机器人做体力活，人做温度活',
        description: '用机器人分担重体力，让护工专注陪伴和情感',
        hint: '管理+12 · 护理+8 · 存款-20000 · 压力+6 · 信念+8 · 声誉+8 · 月营收+5000',
        hintColor: 'positive',
        skillGains: { managementSkill: 12, careSkill: 8 },
        savingsChange: -20000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          adjustSilverReputation(s, 8);
          adjustSilverRevenue(s, 5000);
        },
        log: '{age}岁，你重新分配了工作：机器人负责翻身、搬运、夜间巡房等重体力活，护工负责陪聊、喂饭（老人愿意的话）、临终陪伴。秀兰一开始不乐意，但一个月后她承认"腰不疼了"。老人们慢慢习惯了——机器人推轮椅，秀兰牵着手。你想：也许未来不是机器取代人，是机器托举人。',
      },
      {
        id: 'reject_robot_preserve_human',
        label: '退掉机器人，坚持全人工',
        description: '养老这行，温度比效率重要',
        hint: '护理+10 · 信念+10 · 压力+8 · 声誉+10 · 但月营收-2000',
        hintColor: 'neutral',
        skillGains: { careSkill: 10 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          adjustSilverReputation(s, 10);
          adjustSilverRevenue(s, -2000);
        },
        log: '{age}岁，你把机器人退回了区里。你写了一份报告："护理工作中30%是体力，70%是情感。体力可替代，情感不可替代。"有人说你保守，有人说你有人情味。秀兰没说什么，但那天晚饭她多给你盛了一碗汤。你知道这个决定会让你更累、更慢、更难扩张——但有些东西，慢才对。',
      },
      {
        id: 'pilot_robot_evaluate',
        label: '先试点三个月，用数据说话',
        description: '不急于决定，让老人和数据告诉你答案',
        hint: '管理+10 · 政策+5 · 压力+5 · 信念+5 · 声誉+5',
        hintColor: 'neutral',
        skillGains: { managementSkill: 10, policySkill: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          adjustSilverReputation(s, 5);
        },
        log: '{age}岁，你留了一台机器人做三个月试点。你设计了一套评估表：老人满意度、护工腰椎损伤率、夜间响应速度、意外发生率。三个月后数据显示：老人满意度降了15%，护工工伤率降了60%，夜间响应速度提升了三倍。你把报告发给区里——没有结论，只有数据。结论他们自己得出：人和机器，各有位置。',
      },
    ],
  },
];

// ============================================================
// 危机事件（crisis，ages 26-42）
// ============================================================

const crisisEvents: NarrativeEvent[] = [

  // 31岁：客户去世引发的家属诉讼
  {
    id: 'silver_crisis_lawsuit',
    title: '法庭传票',
    sceneTag: 'courtroom',
    pathId: 'silver_economy',
    ageRange: [31, 31],
    priority: 9,
    weight: 10,
    oncePerGame: true,
    eventType: 'crisis',
    narrative:
      '一纸法院传票送到你手上。你照顾了两年的一位老人——孙爷爷——在睡梦中走了。他的儿子把你告了，理由是"你的护理员当晚没有按规定每两小时巡一次房，导致老人未能得到及时救治"。\n' +
      '你调了当晚的记录，护理员确实在凌晨两点到四点之间少巡了一次——因为同时要照顾另一位突发高烧的老人。你没有辩解的余地，记录上白纸黑字。你站在被告席上，浑身发冷：你拼了命照顾老人，但你管不了所有护理员的每一分钟。一个疏忽，就是你和家属之间的一道天堑。',
    options: [
      {
        id: 'settle_and_reform',
        label: '赔钱和解，然后彻查制度漏洞',
        description: '先止血，再堵住漏洞',
        hint: '管理+12 · 存款-30000 · 压力+15 · 健康-5 · 信念+5 · 声誉-5',
        hintColor: 'danger',
        skillGains: { managementSkill: 12 },
        savingsChange: -30000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          adjustSilverReputation(s, -5);
        },
        log: '{age}岁，你赔了三万块和解。然后你花了两个月重写了巡房制度：电子巡更打卡、双人值班、异常自动报警。你跟所有护理员说"以后再出这种事，不是扣钱，是走人"。你知道这话很重，但人命比饭碗重。',
      },
      {
        id: 'fight_in_court',
        label: '应诉，用完整的护理记录辩护',
        description: '你没有失职，只是分身乏术，法庭上见真章',
        hint: '管理+8 · 政策+10 · 压力+18 · 健康-8 · 信念+3 · 声誉-8 · 存款-15000',
        hintColor: 'danger',
        skillGains: { managementSkill: 8, policySkill: 10 },
        savingsChange: -15000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 18, 0, 100);
          s.health = clamp(s.health - 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
          adjustSilverReputation(s, -8);
        },
        log: '{age}岁，你请了律师上法庭。律师用你两年的护理记录证明你已尽到合理注意义务，孙爷爷的死是自然衰老而非护理过失。法院判你承担次要责任，赔了一万五。赢了但赢得狼狈——镇上的人议论纷纷，有人说"做养老的出事了"。你那段时间不敢去服务站，怕看到老人家属异样的眼光。',
      },
      {
        id: 'insurance_first',
        label: '以后所有客户必须买护理责任险',
        description: '不能让一次意外毁掉整个事业',
        hint: '管理+10 · 政策+8 · 存款-8000 · 压力+10 · 信念+6 · 声誉-3',
        hintColor: 'neutral',
        skillGains: { managementSkill: 10, policySkill: 8 },
        savingsChange: -8000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          adjustSilverReputation(s, -3);
        },
        log: '{age}岁，你给所有客户都上了护理责任险，保费你出一半家属出一半。有人说"你这是推卸责任"，你说"我是给老人和你们一个兜底"。后来又出过两次意外，有了保险，家属的情绪缓和了很多。你想：做这行不能只靠良心，还得靠制度兜底。',
      },
    ],
  },

  // 34岁：巨头免费模式碾压（价格战）
  {
    id: 'silver_crisis_giant_free',
    title: '免费',
    sceneTag: 'community_care',
    pathId: 'silver_economy',
    ageRange: [34, 34],
    priority: 9,
    weight: 10,
    oncePerGame: true,
    eventType: 'crisis',
    narrative:
      '一家估值百亿的互联网公司宣布"进军养老"，模式是"设备免费+服务免费+APP免费"，靠卖老人健康数据和精准广告赚钱。社区里到处是地推，免费鸡蛋、免费体检——老人们被一车车拉去"推介会"。\n' +
      '你的客户一夜之间走了大半，有家属直接说"人家不要钱，你凭什么收？"你算了一笔账：客户继续流失，三个月后现金流就断。你打开他们的APP——客服是机器人，紧急呼叫要排队，健康数据直接卖给保险公司。他们的"免费"是有代价的，但老人不知道。你怎么跟"免费"竞争？',
    options: [
      {
        id: 'differentiate_service',
        label: '死磕巨头做不到的——真实的人',
        description: '设备免费不难，难的是凌晨三点有人上门',
        hint: '管理+12 · 护理+10 · 政策+8 · 存款-40000 · 压力+18 · 信念+12 · 声誉+10',
        hintColor: 'danger',
        skillGains: { managementSkill: 12, careSkill: 10, policySkill: 8 },
        savingsChange: -40000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 18, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          adjustSilverReputation(s, 10);
          // 价格战直接卷走40%客户，靠服务质量挽回一部分，净流失约25%
          const biz = getSilverBusiness(s);
          const lostClients = Math.round(biz.clients * 0.4);
          const recoveredClients = Math.round(lostClients * 0.4);
          adjustSilverClients(s, -lostClients + recoveredClients);
          // 营收随客户流失比例下降，涨价后部分恢复
          const revenueLoss = Math.round(biz.monthlyRevenue * 0.35);
          adjustSilverRevenue(s, -revenueLoss);
        },
        log: '{age}岁，你没有降价，反而涨价了——涨在了"人工上门"上。你打出"7×24小时真人响应"的招牌，跟巨头的"机器人客服"对着干。你自掏腰包加了三个月的夜班补贴，让护理员随叫随到。这一仗打光了你大半积蓄，但半年后，第一批用免费设备的老人开始出事——跌倒没人管、药吃错没人知。家属们又回来了，说"免费的才是最贵的"。你活下来了，但你知道巨头不会走，这只是第一回合。',
      },
      {
        id: 'seek_gov_protection',
        label: '找政府求助，推动限制数据变现的监管',
        description: '靠政策挡住巨头的野蛮入侵',
        hint: '政策+12 · 管理+8 · 存款-30000 · 压力+15 · 信念+8 · 声誉+8',
        hintColor: 'neutral',
        skillGains: { policySkill: 12, managementSkill: 8 },
        savingsChange: -30000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          adjustSilverReputation(s, 8);
          // 游说期间客户继续流失约35%，政策出台后缓慢回流，净流失约30%
          const biz = getSilverBusiness(s);
          const lostClients = Math.round(biz.clients * 0.35);
          const recoveredClients = Math.round(lostClients * 0.15);
          adjustSilverClients(s, -lostClients + recoveredClients);
          const revenueLoss = Math.round(biz.monthlyRevenue * 0.3);
          adjustSilverRevenue(s, -revenueLoss);
        },
        log: '{age}岁，你花了三个月跑民政局、递报告、联合同行上书，详述巨头免费模式背后出卖老人健康数据的隐患。跑关系花了不少钱，但一个月后省里出了个"养老数据保护指引"，巨头被迫调整模式。你松了一口气，但客户已经流失了三成。你心里清楚：政策是挡箭牌，不是护城河。你得趁这个窗口期把自己的服务做到别人抢不走。',
      },
      {
        id: 'merge_or_die',
        label: '考虑被巨头收购，换取生存',
        description: '打不过就加入，至少你的团队和老人还能被照顾',
        hint: '管理+10 · 压力+8 · 信念-15 · 声誉-15 · 存款+50000',
        hintColor: 'negative',
        skillGains: { managementSkill: 10 },
        savingsChange: 50000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 15, 0, 100);
          adjustSilverReputation(s, -15);
          // 卖掉后客户不再属于你，只保留极少部分
          const biz = getSilverBusiness(s);
          adjustSilverClients(s, -Math.round(biz.clients * 0.85));
          adjustSilverRevenue(s, -Math.round(biz.monthlyRevenue * 0.7));
        },
        log: '{age}岁，你跟巨头谈了收购。他们开价十二万买你的团队和客户资源——这比你当初预想的少了很多，因为客户已经在流失，你的牌越来越少。你拿着那份协议看了一整夜，最后签了字。你的服务站换了巨头的logo，你的护理员穿上了巨头的工服。钱到手了，但你觉得自己的什么东西丢了。秀兰问你"以后我们还按以前的标准干吗？"你说"当然"。但你知道，说了不算了。',
      },
    ],
  },

  // 37岁：供应商跑路
  {
    id: 'silver_supply_chain',
    title: '人去楼空',
    sceneTag: 'street',
    pathId: 'silver_economy',
    ageRange: [37, 37],
    priority: 9,
    weight: 10,
    oncePerGame: true,
    eventType: 'crisis',
    narrative:
      '你合作了三年的供应商——供护理耗材、医疗器械、食堂食材的老板——跑路了。你上个月刚打了二十万货款，约定这个月送货。电话打不通，社交软件拉黑，跑到仓库一看——门锁换了，里面空了。\n' +
      '你坐在仓库门口，脑子一片空白。那二十万里有下季度预付费、员工工资、老人换季被褥的钱。你不仅要花高价紧急补货，还面临物资断供的风险——胃管、尿管、消毒用品，断一天就是人命关天。秀兰打电话问"工资还能发吗"，你说"能"，但不确定。你这才意识到：在这条产业链上，你也是弱者。',
    options: [
      {
        id: 'emergency_procure_debt',
        label: '借钱高价紧急补货，先保住老人照护不断供',
        description: '不管花多少钱，老人的东西不能断',
        hint: '管理+10 · 压力+18 · 健康-5 · 信念+8 · 声誉+5',
        hintColor: 'danger',
        skillGains: { managementSkill: 10 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 18, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          adjustSilverReputation(s, 5);
          // 损失当前存款的20%（货款+高价补货+借钱利息），最多30000
          const loss = Math.min(30000, Math.max(15000, Math.round(s.currentSavings * 0.2)));
          s.currentSavings = Math.max(0, s.currentSavings - loss);
          // 紧急补货期间流失约10%客户（因物资临时紧张导致服务质量下降）
          const biz = getSilverBusiness(s);
          adjustSilverClients(s, -Math.round(biz.clients * 0.1));
          adjustSilverRevenue(s, -Math.round(biz.monthlyRevenue * 0.1));
        },
        log: '{age}岁，你到处借钱，以1.5倍的价格从别的供应商那里紧急调货。胃管、尿管、消毒水、老人的冬季被褥——你咬着牙把钱付了，老人那边一天都没断供。但你自己背了一身债，存款蒸发了三成，员工的年终奖也没了。有人说你傻，说"你完全可以让老人等几天"，但你说"等不了，有些老人等一天就没了"。',
      },
      {
        id: 'legal_pursuit',
        label: '报警+联合其他受害者起诉，追讨货款',
        description: '不能就这么算了，走法律途径追钱',
        hint: '政策+12 · 管理+8 · 存款-20000 · 压力+15 · 信念+5 · 声誉-5',
        hintColor: 'neutral',
        skillGains: { policySkill: 12, managementSkill: 8 },
        savingsChange: -20000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          adjustSilverReputation(s, -5);
          // 打官司期间物资紧张，损失约15%客户
          const biz = getSilverBusiness(s);
          const lostClients = Math.round(biz.clients * 0.15);
          adjustSilverClients(s, -lostClients);
          adjustSilverRevenue(s, -Math.round(biz.monthlyRevenue * 0.15));
          // 有概率追回部分款项（40%概率追回40%，60%概率血本无归）
          if (Math.random() < 0.4) {
            s.currentSavings += Math.round(s.currentSavings * 0.15);
          }
        },
        log: '{age}岁，你报了警，联合了七八个受害者一起请律师起诉。律师费花了两万，官司打了半年。期间你东拼西凑勉强维持着物资供应，但还是有几个老人因为换了便宜替代品而出了小问题，家属颇有微词。最终那个人被抓了，但钱已经被他挥霍得差不多了，你只追回了一小部分。你把追回来的钱数了数，还不够填那半年的窟窿。你把合作方的合同从头到尾又看了一遍，这次一个字都没放过。',
      },
      {
        id: 'cut_costs_survive',
        label: '缩减服务规模，砍掉不赚钱的项目保现金流',
        description: '先活下来，再谈发展',
        hint: '管理+12 · 压力+18 · 信念-10 · 声誉-10 · 客户-20% · 月营收-25%',
        hintColor: 'negative',
        skillGains: { managementSkill: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 18, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 10, 0, 100);
          adjustSilverReputation(s, -10);
          // 损失当前存款的15%（无法追回的货款+应急成本），最多30000
          const loss = Math.min(30000, Math.max(10000, Math.round(s.currentSavings * 0.15)));
          s.currentSavings = Math.max(0, s.currentSavings - loss);
          // 砍掉约20%客户和25%营收
          const biz = getSilverBusiness(s);
          adjustSilverClients(s, -Math.round(biz.clients * 0.2));
          adjustSilverRevenue(s, -Math.round(biz.monthlyRevenue * 0.25));
        },
        log: '{age}岁，你不得不关掉了两个最远的服务点，停掉了上门送餐服务，把所有资源集中在核心站点保命。二十万货款打了水漂，你看着被裁掉的护理员红着眼圈收拾东西，心里像被刀割。但你知道不断臂就活不下去。半年后你的现金流稳了，但你只剩了半壁江山。你站在缩小了一半的服务区里，告诉自己：活下来，就还有机会。',
      },
    ],
  },

  // 39岁：监管整顿
  {
    id: 'silver_crisis_regulation',
    title: '一刀切',
    sceneTag: 'office',
    pathId: 'silver_economy',
    ageRange: [39, 39],
    priority: 9,
    weight: 10,
    oncePerGame: true,
    eventType: 'crisis',
    conditions: (s) => s.pathFaith <= 70,
    narrative:
      '省里突然下发文件：所有社区养老机构必须在三个月内完成"三证齐全"重新备案（消防证、食品经营证、医疗机构执业许可），否则关停。起因是外地一家养老院火灾死了人，全省严打。\n' +
      '你看着文件，手在抖：你有消防证，但食品证过期了没来得及续；医务室有护士但没有执业许可。三个月内补齐三证，意味着要花至少十万块改造、招人、走审批。更让你窒息的是，文件还有一条"从业人员须持养老护理员职业资格证"——你的十五个护理员里只有三个有证，其他都是四五十岁的下岗女工，让她们去考试比登天还难。一刀切下来，你的半个团队可能要被砍掉。',
    options: [
      {
        id: 'comply_full',
        label: '全力合规，该花的钱花该裁的人裁',
        description: '合规是底线，不合规连牌都保不住',
        hint: '管理+12 · 政策+12 · 存款-100000 · 压力+18 · 健康-3 · 信念+5 · 声誉+5',
        hintColor: 'danger',
        skillGains: { managementSkill: 12, policySkill: 12 },
        savingsChange: -100000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 18, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          adjustSilverReputation(s, 5);
          // 合规改造期间服务受影响，部分无证护理员离职导致约15%客户流失
          const biz = getSilverBusiness(s);
          adjustSilverClients(s, -Math.round(biz.clients * 0.15));
          adjustSilverRevenue(s, -Math.round(biz.monthlyRevenue * 0.12));
        },
        log: '{age}岁，你花了三个月和十万块把三证补齐了。消防改造、食品证续期、医务室请兼职医生挂证——每一项都是钱。那十二个没证的护理员你花钱请人来培训考证，八个过了，四个没过。没过的四个你降薪留用做保洁和送餐，但还是走了两个。整改期间服务质量打了折扣，丢了一成半的客户，但牌照保住了。秀兰说"你心太软"，你说"她们也有家要养"。',
      },
      {
        id: 'advocate_reform',
        label: '联合同行上书，争取过渡期和分级管理',
        description: '一刀切会害死一批认真做养老的人',
        hint: '政策+12 · 管理+8 · 存款-15000 · 压力+15 · 信念+10 · 声誉+10',
        hintColor: 'positive',
        skillGains: { policySkill: 12, managementSkill: 8 },
        savingsChange: -15000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          adjustSilverReputation(s, 10);
          // 政策缓冲期仍有不确定性，约10%客户被合规机构抢走
          const biz = getSilverBusiness(s);
          adjustSilverClients(s, -Math.round(biz.clients * 0.1));
          adjustSilverRevenue(s, -Math.round(biz.monthlyRevenue * 0.08));
        },
        log: '{age}岁，你联合了全县十二家养老机构写联名信递给省人大，花了不少钱跑关系、找律师、请专家论证。信里说"我们支持监管，但请给过渡期，不要一刀切"。两周后省里出了补充文件：给一年过渡期，允许"先上岗后考证"。过渡期内仍有一成客户被拿到新牌照的大机构抢走，但你保住了团队，保住了大部分老人。你松了一口气，知道这只是缓刑，该补的课一天都不能拖。',
      },
      {
        id: 'cut_losses_close',
        label: '关掉不合规的站点，保住主力',
        description: '壮士断腕，先活下来再说',
        hint: '管理+10 · 压力+15 · 信念-10 · 声誉-8 · 客户-30% · 月营收-35%',
        hintColor: 'negative',
        skillGains: { managementSkill: 10 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 10, 0, 100);
          adjustSilverReputation(s, -8);
          // 关掉不合规站点意味着丢失约30%客户和35%营收
          const biz = getSilverBusiness(s);
          adjustSilverClients(s, -Math.round(biz.clients * 0.3));
          adjustSilverRevenue(s, -Math.round(biz.monthlyRevenue * 0.35));
          // 关店止损回拢一部分资金
          s.currentSavings += Math.round(biz.monthlyRevenue * 2);
        },
        log: '{age}岁，你关掉了两个达不到新标准的站点。那些站点的老人被迫转介到其他机构，有家属骂你"说好的照顾一辈子呢"。裁掉了八个护理员，关店的损失让你心疼得睡不着觉。你站在关掉的站点门口，看着工人拆招牌，心里像被剜了一块。三成客户没了，三成五月营收没了，但主力站点保住了，牌照保住了。你知道这是对的，但"对"的事有时候也很疼。',
      },
    ],
  },
];

// ============================================================
// 失败预警事件（isAllInPath=true 且 pathFaith<40 或存款告急时触发）
// ============================================================

const silverWarningEvents: NarrativeEvent[] = [

  // 预警1：护工/员工接连辞职，招人招不到
  {
    id: 'silver_warning_staff_quit',
    title: '人都走了',
    sceneTag: 'community_care',
    pathId: 'silver_economy',
    ageRange: [28, 50],
    priority: 15,
    weight: 10,
    oncePerGame: true,
    eventType: 'crisis',
    conditions: (s) => s.isAllInPath === true && (s.pathFaith < 40 || s.currentSavings < 50000),
    narrative:
      '小周走了。那个跟了你两年、最会哄张奶奶吃饭的护工，昨晚发一条消息说"不好意思，我不做了"，今天就没来。这是这个月第三个走的了。你翻遍招聘软件，发了十六条招聘信息，只收到三份简历——一个没经验，一个开口要八千，一个面试完再无消息。\n\n' +
      '你自己顶了三天班。帮老人翻身、喂饭、换尿布、洗澡，一天下来腰快断了。晚上十一点你终于把最后一个老人安顿睡下，坐在前台想喝口水，发现水桶空了。你没有力气换水，就那么坐着，听着走廊里老人的鼾声和呼叫铃。你想：如果明天又有人走，你还能撑多久？',
    options: [
      {
        id: 'raise_wages_recruit',
        label: '涨工资，哪怕自己少赚也要留住人',
        description: '把护工工资提高30%，改善排班，用诚意留人',
        hint: '运营管理+10 · 存款-40000 · 信念-5 · 压力+10 · 声誉+10 · 幸福+3',
        hintColor: 'neutral',
        skillGains: { managementSkill: 10 },
        savingsChange: -40000,
        stateEffect: (s) => {
          adjustSilverReputation(s, 10);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
          s.stress = clamp(s.stress + 10, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
        },
        log: '你咬牙把护工工资涨了30%，还排了一个做一休一的班表。钱少赚了，成本上去了，但走了的人有两个回来了。新招来的护工听说你这里待遇好，也愿意来。你发现：养老这个行业，人不是成本——人就是一切。你对人好，人就会对老人好。这个道理你以前知道，现在是用真金白银验证了。',
      },
      {
        id: 'do_it_all_yourself',
        label: '先自己顶着，省人工费',
        description: '不招人了，自己和家人顶上，熬过这段再说',
        hint: '护理能力+15 · 信念-8 · 压力+22 · 健康-15 · 幸福-12 · 存款+0',
        hintColor: 'danger',
        skillGains: { careSkill: 15 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith - 8, 0, 100);
          s.stress = clamp(s.stress + 22, 0, 100);
          s.health = clamp(s.health - 15, 0, 100);
          s.happiness = clamp(s.happiness - 12, 0, 100);
        },
        log: '你一个人顶了两个月。白天做护理，晚上做行政，半夜还要起来巡房。你瘦了十二斤，眼圈黑得像被打了一拳。有一次你帮老人洗澡的时候差点晕倒在浴室里，是老人按了呼叫铃把你"救"了。你妈从老家赶过来帮忙做饭，看到你的样子当场就哭了。你知道这不是长久之计——但眼下，你没有别的选择。',
      },
      {
        id: 'automate_and_simplify',
        label: '引入智能设备，减少人力依赖',
        description: '买智能床垫、监控设备、自动喂药机，用科技替代部分人工',
        hint: '管理能力+8 · 政策资源+5 · 存款-60000 · 信念+3 · 压力+5 · 声誉-5',
        hintColor: 'neutral',
        skillGains: { managementSkill: 8, policySkill: 5 },
        savingsChange: -60000,
        stateEffect: (s) => {
          adjustSilverReputation(s, -5);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
          s.stress = clamp(s.stress + 5, 0, 100);
        },
        log: '你贷款买了一批智能养老设备——智能床垫能监测心率和翻身，自动喂药机到点提醒，走廊装了防跌倒雷达。设备到位后，夜间巡房从四次减到一次，一个护工能管的老人从六个增加到十个。但有个奶奶说"那个垫子睡着不舒服"，有个爷爷拒绝用自动喂药机说"我要活人给我递药"。你意识到：科技能解决效率问题，但解决不了温度问题——养老最终还是人和人的事。',
      },
    ],
  },

  // 预警2：亲戚说你"赚老人钱"，回家吃饭被冷遇
  {
    id: 'silver_warning_family_accusation',
    title: '饭桌上的沉默',
    sceneTag: 'social',
    pathId: 'silver_economy',
    ageRange: [28, 50],
    priority: 14,
    weight: 10,
    oncePerGame: true,
    eventType: 'crisis',
    conditions: (s) => s.isAllInPath === true && (s.pathFaith < 40 || s.currentSavings < 50000),
    narrative:
      '中秋节，你回了趟老家。一桌子菜都是你爱吃的，但饭桌上的气氛不对。二舅喝了两杯白酒后说："听说你现在做养老生意？赚不少吧？我跟你说，赚什么钱别赚老人的钱。老人的钱好赚，但那钱烫手。"\n\n' +
      '你想解释——你做的是正经照护，站里老人都是子女实在没时间照顾才送来的。但你话还没出口，大姨接了一句："隔壁老王家的老头被养老院骗了十万块买保健品。你们那个行业啊……"她没往下说，但那个眼神你看懂了。你妈没说话一直给你夹菜，你爸低头喝酒，表弟故意大声说"现在的养老机构都是吸血的"。你想起你送去太平间的那个老人、手机里存着的二十多个老人的生日和吃药时间——这些你都没法在饭桌上说。说了他们也不会信。',
    options: [
      {
        id: 'bring_family_to_visit',
        label: '带他们来站里看看，亲眼所见',
        description: '邀请亲戚来你的养老站参观，让他们看到真实的情况',
        hint: '共情能力+10 · 声誉+15 · 信念+10 · 压力-10 · 幸福+12 · 存款-5000',
        hintColor: 'positive',
        skillGains: { careSkill: 10 },
        savingsChange: -5000,
        stateEffect: (s) => {
          adjustSilverReputation(s, 15);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.stress = clamp(s.stress - 10, 0, 100);
          s.happiness = clamp(s.happiness + 12, 0, 100);
        },
        log: '国庆节你邀请了所有亲戚来站里吃饭。你二舅看到你给失能老人翻身的手法不说话了。你大姨看到墙上贴满了老人的手工和家属的感谢信，红了眼眶。你表弟帮一个爷爷调了一下午手机，临走的时候说"姐，你这儿真不容易"。你妈那天笑得最开心，到处跟人说"这是我女儿开的"。你明白了：误解的根源不是恶意，是不了解。让人看见，比解释一万句都有用。',
      },
      {
        id: 'shut_down_and_career_on',
        label: '不解释，用结果说话',
        description: '他们不理解就算了，把事情做好比什么都重要',
        hint: '运营管理+8 · 信念+5 · 压力+12 · 幸福-10 · 健康-3',
        hintColor: 'neutral',
        skillGains: { managementSkill: 8 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.stress = clamp(s.stress + 12, 0, 100);
          s.happiness = clamp(s.happiness - 10, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
        },
        log: '你没有解释。吃完饭你提前走了，开车回站里的路上哭了一场。但从那以后你更加拼命——你把站里的服务做到了区里最好，你评上了示范单位，你上了本地电视台的新闻。你二舅后来看到了那个新闻，在家族群里发了一个大拇指。你没有回复，但你截了图。有些认可不需要嘴上说，有些理解不需要当面讲。你做的事，时间会替你说话。',
      },
      {
        id: 'quit_and_question',
        label: '他们说得对，我是不是真的在赚黑心钱？',
        description: '自我怀疑，开始反思这个行业和自己的选择',
        hint: '信念-20 · 压力+8 · 幸福-15 · 护理能力+5 · 健康-5',
        hintColor: 'negative',
        skillGains: { careSkill: 5 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith - 20, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
          s.happiness = clamp(s.happiness - 15, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
        },
        log: '那天晚上你失眠了。你开始翻来覆去地想：我是不是真的在利用老人？我的定价是不是太高了？我是不是在别人最脆弱的时候赚钱？你查了三个月的账目，甚至去问了三个老人的家属"你觉得我们收费合理吗"。一个家属说"如果不是你们，我早就辞职了"。另一个说"我妈在这儿比在家开心"。第三个说"贵是贵，但值得"。你没有完全释怀，但你知道了一件事：这个世界上有人需要你做的事，而你在尽力做好它。这就够了。',
      },
    ],
  },

];

// ============================================================
// All In 后早期事件（ages 28-36）
// ============================================================

const postAllInEvents: NarrativeEvent[] = [

  // 28-36岁：辞职后第一天开门
  {
    id: 'silver_post_allin_daily',
    title: '开门第一天',
    sceneTag: 'community_care',
    pathId: 'silver_economy',
    ageRange: [28, 36],
    priority: 8,
    weight: 9,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '辞职后的第一个周一，六点半你就站在那间小门面门口，钥匙插进锁孔的时候手有点抖——从今天起，这里就是你的全部了。\n' +
      '你拉开卷闸门，一抬头门口站着五个老人。张奶奶拄着拐杖，李爷爷被女儿扶着，都是以前周末你上门服务过的。张奶奶笑着说："听说你不上班了？那以后天天能见到你了？"中午你给老人们煮了一锅面。张奶奶把自己碗里的鸡蛋夹给你："小X，你以后就是给自己打工了，多吃点。"你咬了一口，觉得这是你这辈子吃过的最好吃的鸡蛋。',
    options: [
      {
        id: 'embrace_first_day',
        label: '记住今天的感觉，这就是你回来的理由',
        description: '老人们在等你，你不能让他们失望',
        hint: '护理+8 · 信念+10 · 幸福+8 · 压力-5 · 声誉+8 · 客户+3',
        hintColor: 'positive',
        skillGains: { careSkill: 8 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          adjustSilverReputation(s, 8);
          adjustSilverClients(s, 3);
        },
        log: '辞职第一天，你打开门，老人们已经在等你了。你煮了一锅面，张奶奶给你夹了鸡蛋。你在日记里写："今天我明白了，我回来不是为了创业，是为了这些人。"秀兰说你第一天就红了三次眼眶，你说"沙子进眼了"。',
      },
      {
        id: 'get_to_work_immediately',
        label: '别感动了，今天还有一堆活要干',
        description: '情怀不能当饭吃，先把制度和流程建起来',
        hint: '管理+10 · 护理+5 · 压力+3 · 信念+5 · 声誉+5 · 月营收+1000',
        hintColor: 'neutral',
        skillGains: { managementSkill: 10, careSkill: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          adjustSilverReputation(s, 5);
          adjustSilverRevenue(s, 1000);
        },
        log: '第一天你没让自己沉浸在感动里。老人们吃完面，你就拉着秀兰列了一张清单：排班表、收费标准、服务项目、应急流程。你说"从今天起我们不是副业了，是正经生意"。秀兰看着你认真的样子，偷偷笑了。',
      },
    ],
  },

  // 28-36岁：账上的数字——营收与成本
  {
    id: 'silver_post_allin_doubt',
    title: '账上的数字',
    sceneTag: 'office',
    pathId: 'silver_economy',
    ageRange: [28, 36],
    priority: 8,
    weight: 9,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '晚上十点，老人们都走了。你一个人坐在那张掉漆的办公桌前，翻开账本。台灯昏黄的光打在一页页数字上：这个月收入两万三，支出两万七——你算了三遍，亏四千。\n' +
      '你靠在椅背上盯着天花板。以前上班每个月工资按时到账，你从不用算这些。现在每一分钱都是你自己的：少一个客户就少一份收入，多一个老人生病就要多跑一趟医院。银行卡里的余额是你全部的积蓄——十二万。如果每月亏四千，你能撑两年半。两年半之后呢？你不敢想。你打开手机，看到张奶奶女儿发来的消息："我妈今天说你比以前更爱笑了，谢谢你。"你看了很久，然后关掉手机，翻开账本重新算。',
    options: [
      {
        id: 'optimize_costs_carefully',
        label: '仔细算每一笔账，抠成本但不抠服务质量',
        description: '省能省的，但老人的东西一分钱不能少',
        hint: '管理+12 · 压力+8 · 信念+6 · 声誉+5 · 月营收+2000',
        hintColor: 'positive',
        skillGains: { managementSkill: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          adjustSilverReputation(s, 5);
          adjustSilverRevenue(s, 2000);
        },
        log: '你花了整整一个晚上重做了预算：换更便宜的耗材供应商但护理用品绝不降级，调整排班减少空窗期，砍掉不必要的办公用品但老人的伙食标准不降反升。第二个月你算账——亏一千五。第三个月，赚了八百。你把那八百块存起来，在账本上画了个笑脸。这是你赚的第一笔"正经钱"。',
      },
      {
        id: 'raise_price_slightly',
        label: '适度涨价，把服务品质做上去',
        description: '便宜没好货，好货不便宜，让客户理解你的价值',
        hint: '管理+8 · 政策+5 · 压力+10 · 信念+3 · 声誉-3 · 客户-2 · 月营收+3000',
        hintColor: 'neutral',
        skillGains: { managementSkill: 8, policySkill: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
          adjustSilverReputation(s, -3);
          adjustSilverClients(s, -2);
          adjustSilverRevenue(s, 3000);
        },
        log: '你把服务费涨了15%。两个客户走了，说"别家更便宜"。你没挽留，因为你知道你提供的东西值这个价——24小时开机、随叫随到、每个老人的用药禁忌你倒背如流。留下来的客户没一个有意见，因为他们亲眼看到你是怎么照顾他们爸妈的。账上的数字慢慢好看了，但你知道，这是拿命换的。',
      },
    ],
  },

  // 28-36岁：第一个正式员工
  {
    id: 'silver_post_allin_first_team',
    title: '第一个员工',
    sceneTag: 'community_care',
    pathId: 'silver_economy',
    ageRange: [28, 36],
    priority: 8,
    weight: 9,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '秀兰一个人快扛不住了。你和她要管十几个老人，白天你跑外勤、对接政府，她在服务站里照顾老人、做饭、打扫，已经连续三周没休息过。\n' +
      '你贴了招聘启事，来了个叫小梅的姑娘，二十五岁，卫校毕业，在县医院急诊科干过两年，说"我奶奶是摔了没人发现走的，我想做这行"。一周后你让她独立给周爷爷做晨间护理，透过门缝看到她熟练地翻身、量血压、喂药，周爷爷拉着她的手说"闺女你手轻"。你忽然觉得：你不是在雇一个人，你是把你的一部分责任交给另一个人。',
    options: [
      {
        id: 'train_mentor_patiently',
        label: '耐心带教，把你的本事全部教给她',
        description: '她是你的第一个"复制体"，她好你才能好',
        hint: '管理+12 · 护理+8 · 压力+5 · 信念+8 · 声誉+8 · 客户+2 · 月营收+1500',
        hintColor: 'positive',
        skillGains: { managementSkill: 12, careSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          adjustSilverReputation(s, 8);
          adjustSilverClients(s, 2);
          adjustSilverRevenue(s, 1500);
        },
        log: '你花了一个月手把手带小梅。她很争气，三个月后就能独立上门了。有次你听到周爷爷跟别的老人说"小梅姑娘跟小X一样细心"，你偷偷笑了。秀兰终于能休周日了，她第一天休息就带孩子去了游乐园，给你发了张孩子坐旋转木马的照片。你第一次觉得：你不是一个人在扛了。',
      },
      {
        id: 'trust_but_verify',
        label: '信任但要验证，建立监督和考核机制',
        description: '感情归感情，制度归制度，老人的事不能赌',
        hint: '管理+12 · 政策+5 · 存款-3000 · 压力+8 · 信念+5 · 声誉+5',
        hintColor: 'neutral',
        skillGains: { managementSkill: 12, policySkill: 5 },
        savingsChange: -3000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          adjustSilverReputation(s, 5);
        },
        log: '你给小梅做了一张考核表：每天的护理记录必须签字、家属每周回访一次、你随机抽查。小梅一开始觉得你不信任她，有点委屈。你说"不是不信任你，是老人的命经不起试错"。一个月后她理解了——她亲眼看到隔壁镇一家养老站因为护理员操作不当出了事。她开始主动写护理日志，比你要求的还详细。',
      },
    ],
  },
];

// ============================================================
// 晚年事件（ages 42-55）
// ============================================================

const lateGameEvents: NarrativeEvent[] = [

  // 45岁：送走你全职后第一位老人——生死和职业意义
  {
    id: 'silver_midlife_first_death_allin',
    title: '第一个',
    sceneTag: 'funeral',
    pathId: 'silver_economy',
    ageRange: [45, 45],
    priority: 8,
    weight: 10,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '周爷爷走了。他是你辞职全职做养老之后接手的第一个老人。第一天他拎着一个旧布包，里面装着一套换洗衣物和一个搪瓷缸，说"我儿子在深圳，半年回来一次"，你说"以后我陪你"——这一陪就是十八年。\n' +
      '十八年里你给他过了十八个生日，替他接了三十多通他儿子"忙，回不来"的电话。他走的时候你就在旁边，最后一句话是"小X，谢谢你"。葬礼上他儿子跪在灵前哭，你站在后面，没有哭。回到站里，看到他常坐的位置空着，搪瓷缸还在桌上——你终于绷不住了。你做这行二十三年了，第一次认真问自己：你做的一切，到底有什么意义？',
    options: [
      {
        id: 'meaning_in_companionship',
        label: '意义就是——他走的时候不是一个人',
        description: '你陪他走完了最后一段路，这就是意义',
        hint: '护理+10 · 信念+12 · 幸福+5 · 压力-8 · 声誉+10',
        hintColor: 'positive',
        skillGains: { careSkill: 10 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.stress = clamp(s.stress - 8, 0, 100);
          adjustSilverReputation(s, 10);
        },
        log: '{age}岁，你擦干眼泪把周爷爷的搪瓷缸收进了纪念柜——那里面已经摆了七八个老人们留下的小东西：一个放大镜、一副老花镜、一个布偶。你终于懂了：你做的这一切，不是为了"战胜死亡"——没有人能战胜死亡。你做的是让他们走的时候不害怕、不孤单、有人握着他们的手。十八年的陪伴不是一场空，它是一个人晚年里最长的温暖。你跟秀兰说："我们继续干。"',
      },
      {
        id: 'meaning_in_system',
        label: '把悲伤变成动力——建立临终关怀标准',
        description: '一个人陪不够，要让每个老人都走得有尊严',
        hint: '管理+12 · 护理+8 · 政策+5 · 信念+8 · 压力+5 · 月营收+3000 · 存款-20000',
        hintColor: 'positive',
        skillGains: { managementSkill: 12, careSkill: 8, policySkill: 5 },
        savingsChange: -20000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.stress = clamp(s.stress + 5, 0, 100);
          adjustSilverReputation(s, 8);
          adjustSilverRevenue(s, 3000);
        },
        log: '{age}岁，你花了半年制定了一套临终关怀标准流程：最后72小时必须有人全程陪伴、必须帮老人完成最后的心愿、必须让家属在老人走之前赶到（如果赶不到就视频）。你自费培训了所有护理员。有人说你"花这个钱不值"，你说"这不是钱的事"。周爷爷走后的第三个月，这套流程第一次完整执行——走的是张奶奶。她走的时候女儿在视频里叫"妈"，你握着她的手。她走得很安静。',
      },
      {
        id: 'emotional_burnout',
        label: '承认自己累了——你需要休息',
        description: '送了太多人，你需要喘口气',
        hint: '幸福-5 · 信念-5 · 压力-12 · 健康+5',
        hintColor: 'neutral',
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
          s.stress = clamp(s.stress - 12, 0, 100);
          s.health = clamp(s.health + 5, 0, 100);
        },
        log: '{age}岁，你给自己放了一周假，把站里的事交给秀兰和小陈，一个人去了海边。你在沙滩上坐了一整天，什么都没想。回来之后你没有辞职，但你开始强制自己每周休一天——以前你从来不肯休息。你明白了一件事：你不是铁打的，送走每一个老人都会在你心里留一道痕。你必须允许自己疼，否则迟早有一天你会麻木，而麻木的人做不好这行。',
      },
    ],
  },

  // 42-55岁：镜子——发现自己也在变老
  {
    id: 'silver_late_mirror',
    title: '镜子',
    sceneTag: 'home',
    pathId: 'silver_economy',
    ageRange: [42, 55],
    priority: 7,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '那天你帮陈爷爷剪完头发，顺手拿起他桌上的镜子照了一下——想看看脸上有没有沾碎头发。镜子里的人让你愣了几秒：鬓角白了一片，眼角的皱纹深得像刀刻。你今年四十五了，做养老做了二十三年。\n' +
      '你忽然想起自己二十多岁时，觉得"老"是别人的事。张奶奶、李爷爷、王奶奶是"老人"，你是"照顾老人的人"。你从来没想过，有一天你也会老。陈爷爷看你发呆，笑了："小X，白头发不少了吧？我像你这岁数的时候，也不觉得自己会老。"你放下镜子，膝盖蹲久了会咯吱响，看小字要拿远一点。你照顾了半辈子别人的晚年，忽然意识到：你自己的晚年，也在一步步走来。',
    options: [
      {
        id: 'face_aging_gracefully',
        label: '正视自己的衰老，照顾老人的同时也照顾自己',
        description: '你不倒，才能照顾更多人',
        hint: '护理+10 · 信念+10 · 幸福+5 · 健康+8 · 压力-8 · 声誉+5',
        hintColor: 'positive',
        skillGains: { careSkill: 10 },
        stateEffect: (s) => {
          s.health = clamp(s.health + 8, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.stress = clamp(s.stress - 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          adjustSilverReputation(s, 5);
        },
        log: '你第一次给自己挂了个号——体检。医生说你腰椎有轻度突出、血压偏高、睡眠不足。你开始每周抽时间游泳，强迫自己十二点前睡觉。秀兰笑你"终于知道惜命了"，你说"我要是倒了，这些老人谁管？"你开始在员工培训里加了一节："护理员先照顾好自己，才能照顾好别人。"',
      },
      {
        id: 'keep_pushing_ignore_signs',
        label: '不管它，还有那么多老人等着你，没时间老',
        description: '老就老吧，活干完了再说',
        hint: '信念+8 · 压力+10 · 健康-8 · 幸福-3',
        hintColor: 'negative',
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.health = clamp(s.health - 8, 0, 100);
          s.happiness = clamp(s.happiness - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '你没把白头发和腰疼当回事。你照样每天第一个到最后一个走，照样给老人翻身、背老人下楼、熬夜写方案。有次你在给老人量血压时眼前一黑，扶着墙站了半分钟才缓过来。秀兰急了，说"你要是倒下了我们怎么办"，你说"没事，老毛病了"。但你晚上偷偷在手机上搜了"腰椎间盘突出自我调理"。',
      },
    ],
  },

  // 42-55岁：交班——培养接班人
  {
    id: 'silver_late_handover',
    title: '交班',
    sceneTag: 'community_care',
    pathId: 'silver_economy',
    ageRange: [42, 55],
    priority: 7,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '站里来了个年轻人，叫小陈，二十八岁，医科大学护理系毕业，在三甲医院干了三年，说"想做一点不一样的事"。你带他巡站，他问的问题你答不上来——"你们的护理评估量表用的是哪个版本？""失智症的BPSD干预有没有标准化流程？"你忽然觉得自己老了。\n' +
      '晚上你跟秀兰聊起这事。秀兰说："你二十三岁的时候连鼻饲都不会，现在不什么都会了？他比你当年强，但你有他没有的东西——你记得每个老人的生日、记得谁不吃香菜、记得谁的女儿在深圳多久打一次电话。这些东西书上没有。"你看着小陈蹲在轮椅旁边，耐心地听一个耳背的爷爷讲了三遍同一个故事。你忽然觉得：也许是时候把接力棒交出去了。不是现在，但该开始准备了。',
    options: [
      {
        id: 'mentor_successor',
        label: '把他当接班人培养，倾囊相授',
        description: '你总有一天要退，这把椅子得有人坐',
        hint: '管理+12 · 护理+8 · 政策+5 · 压力+3 · 信念+12 · 声誉+10 · 月营收+3000',
        hintColor: 'positive',
        skillGains: { managementSkill: 12, careSkill: 8, policySkill: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          adjustSilverReputation(s, 10);
          adjustSilverRevenue(s, 3000);
        },
        log: '你开始系统地带小陈。从怎么跟街道办打交道到怎么给临终老人擦身，从哪些家属好沟通到哪些老人的子女有矛盾——你把二十多年的经验一点一点倒给他。他学得很快，半年后就能独立带一个站了。有次你听到他跟新员工说"老人不吃香菜是因为小时候穷，吃伤了，不是挑嘴"——他已经在记那些"书上没有的东西"了。你知道，这根接力棒，传得下去。',
      },
      {
        id: 'stay_in_control',
        label: '先观察，关键决策还是自己说了算',
        description: '年轻人有冲劲但没阅历，不能急着交权',
        hint: '管理+8 · 压力+8 · 信念+5 · 声誉+5',
        hintColor: 'neutral',
        skillGains: { managementSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          adjustSilverReputation(s, 5);
        },
        log: '你让小陈先做站长助理，大事还是你拍板。他有些想法很激进——想做连锁加盟、想引入资本、想三年开到十个站。你没否决，但也没点头。你见过太多"做大了就变味"的例子。你跟他说"养老不是互联网，慢就是快"，他嘴上说好，眼神里却有不甘。你知道这是必经的过程——你年轻时也急过。',
      },
    ],
  },

  // 42-55岁：又送走一个——熟悉的离别
  {
    id: 'silver_late_goodbye',
    title: '又送走一个',
    sceneTag: 'funeral',
    pathId: 'silver_economy',
    ageRange: [42, 55],
    priority: 7,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '李爷爷走了。八十四岁，走的时候很安静——睡梦中走的，没受罪。\n' +
      '你站在葬礼上，这是你送过的第几个老人了？你数不清了。张奶奶、周爷爷、王奶奶、陈爷爷……每一个你都记得：记得他们爱吃什么、记得他们讲过的故事、记得他们临走前握着你的手说过的话。\n' +
      '李爷爷的儿子给你鞠了一躬，说"谢谢你照顾我爸最后五年"。你说了句"节哀"，声音很平静——你已经说过太多次这两个字了。秀兰站在你旁边，眼圈红红的。她跟着你这么多年，送走的老人不比你少，但她每次都哭。你羡慕她还能哭。\n' +
      '葬礼结束后你一个人去了老站门口那棵槐树下坐了一会儿。这棵树是你第一年回来的时候种的，现在已经枝繁叶茂了，夏天老人们在树下下棋、打麻将、聊天。李爷爷以前总坐在那个朝北的位置，说那里风大凉快。\n' +
      '你以为自己已经习惯了离别，但风吹过来的时候，你还是红了眼眶。',
    options: [
      {
        id: 'grieve_openly',
        label: '允许自己难过，这不是脆弱是真实',
        description: '每一个走掉的老人都值得被好好告别',
        hint: '护理+8 · 幸福-5 · 压力+8 · 健康-3 · 信念+10 · 声誉+8',
        hintColor: 'neutral',
        skillGains: { careSkill: 8 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness - 5, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          adjustSilverReputation(s, 8);
        },
        log: '你在槐树下坐了很久，哭了。不是嚎啕大哭，是眼泪无声地流。二十年了，你以为自己已经刀枪不入了，但每一次告别还是像第一次那样疼。你给秀兰发了条社交软件："明天李爷爷常坐的那个位置，留着吧。"秀兰回了一个"好"字。第二天你去站里，那个位置放了一杯茶——李爷爷最爱喝的大叶茶。',
      },
      {
        id: 'channel_into_mission',
        label: '把悲伤化为继续走下去的力量',
        description: '他们走了，但还有更多老人在等你',
        hint: '护理+10 · 管理+8 · 压力+5 · 信念+12 · 声誉+10',
        hintColor: 'positive',
        skillGains: { careSkill: 10, managementSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          adjustSilverReputation(s, 10);
        },
        log: '你擦干眼泪，回到站里。有新的老人在等你评估，有护理员在等你培训，有家属在等你回电话。李爷爷走了，但活着的人还需要你。你把李爷爷的名字写在那本已经很厚的纪念册里——每一个你送走的老人，你都记下了他们的名字和故事。你跟小陈说："将来我走了，你接着记。这本册子不能断。"',
      },
    ],
  },

  // 55岁：守夜人自己也老了 —— 银发守夜人的黄昏
  {
    id: 'silver_late_caregiver_age',
    title: '守夜人自己也老了',
    sceneTag: 'community_care',
    pathId: 'silver_economy',
    ageRange: [55, 55],
    priority: 8,
    weight: 10,
    oncePerGame: true,
    eventType: 'milestone',
    narrative:
      '你在日间照料中心门口扶着墙，缓了好一会儿才直起腰。才扶着一个老人做完康复训练，腰椎忽然发出一声闷响，像一把旧椅子终于撑不住了。\n' +
      '你把站里的老人照顾了几十年——给他们翻身、喂饭、擦洗、陪他们走完最后一程。你记得他们每一个人的名字，记得谁爱吃咸、谁怕冷、谁睡前要听收音机。可今天你照镜子，鬓角的白发不知什么时候已经盖不住了。\n' +
      '有个刚来的护理员小姑娘跑过来问："老师傅，您今年多大了？"你愣了一下，笑着答："我啊，我是今晚的守夜人。"你忽然明白，你守了别人的夜一辈子，现在，轮到你了——你也要开始学着，怎么被这个行业里的人记住。',
    options: [
      {
        id: 'silver_legacy_train',
        label: '把手艺传下去，培养新一代守夜人',
        description: '灯不会灭，只要有人愿意接着守',
        hint: '管理+10 · 信念+12 · 声誉+8 · 幸福+6',
        hintColor: 'positive',
        skillGains: { managementSkill: 10 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.happiness = clamp(s.happiness + 6, 0, 100);
          adjustSilverReputation(s, 8);
        },
        log: '{age}岁，你开始手把手带年轻护理员。你教他们怎么翻身不伤腰、怎么给失能老人擦身不尴尬、怎么在老人握住你的手说胡话时忍住眼泪。你不只教技术，还教他们"这个行业最值钱的不是工资，是被人记住"。你带的第一个徒弟后来成了站点主管，她逢人就说"是那个老师傅教我的"。你坐在走廊里听着，觉得比自己年轻时拿奖还高兴。灯，有人接了。',
      },
      {
        id: 'silver_legacy_keep',
        label: '继续守，守到守不动那天',
        description: '你放不下这些老人，他们也需要你',
        hint: '信念+15 · 压力+10 · 健康-5 · 幸福+3',
        hintColor: 'danger',
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 15, 0, 100);
          s.stress = clamp(s.stress + 10, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
        },
        log: '{age}岁，你拒绝了所有"退休"的建议，继续每天六点起床查房。你膝盖不好，就戴着护膝；腰椎不好，就改用机械腰托。有一天你正在给王奶奶喂饭，她忽然握住你的手说："小年轻，你比我还老呢，该你歇歇了。"你鼻头一酸，笑着说"我还能守"。你守的不是这份工作，是这些老人最后一段路里的光。你决定，守到守不动的那天。',
      },
      {
        id: 'silver_legacy_rest',
        label: '把站交给年轻人，自己开始"养老"',
        description: '你守了别人一辈子，也该被人守了',
        hint: '幸福+10 · 压力-12 · 信念-8',
        hintColor: 'positive',
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.stress = clamp(s.stress - 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 8, 0, 100);
        },
        log: '{age}岁，你把日间照料中心交给了小陈，自己搬进了养老社区。你第一次以"被照顾的人"的身份住在里面，总觉得别扭——你照顾了别人一辈子，如今却要别人照顾你。有天晚上，曾经的护理员们来看你，你红着脸说"我没事，你们别耽误工作"。他们走的时候，你在窗口看着他们的背影，忽然笑了。你守了一辈子夜，今晚，终于可以安心地睡一觉了。',
      },
    ],
  },

  // 48岁：双重身份——你从"照顾别人的人"慢慢变成"也被照顾的人"
  {
    id: 'silver_late_dual_identity',
    title: '我也是被照顾的人了',
    sceneTag: 'hospital',
    pathId: 'silver_economy',
    ageRange: [48, 48],
    priority: 8,
    weight: 10,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '你第一次以"患者"的身份走进自己熟得不能再熟的医院。给老人办了二十几年转诊，你闭着眼都知道哪层楼做CT、哪层楼办住院。这回轮到自己了——腰椎间盘突出。医生盯着片子说："这个年纪了，别再硬撑了，你照顾了那么多老人，也该让人照顾照顾你。"\n' +
      '你很想反驳一句"我还能扛"，但膝盖蹲下去时那声脆响替你答了。你忽然意识到，你照顾别人的这半辈子，其实一直在拿自己的身体当损耗品。你站在医院走廊里，看着来来往往的护工推着老人，第一次觉得——原来我也是他们中的一个了。',
    options: [
      {
        id: 'silver_dual_rest_body',
        label: '先把腰养好',
        description: '你不倒下，才能继续守他们',
        hint: '健康+10 · 压力-8 · 护理+6 · 信念+6',
        hintColor: 'positive',
        skillGains: { careSkill: 6 },
        stateEffect: (s) => {
          s.health = clamp(s.health + 10, 0, 100);
          s.stress = clamp(s.stress - 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '{age}岁，你第一次认真给自己放了个病假。腰托戴上后就老实做了几周康复，每天雷打不动做拉伸。秀兰说"你终于把自己当个人了"，你没反驳——你照顾了那么多老人，要是自己先垮了，那才是最大的失职。你开始把"护理员先护好自己"写进制度，因为你终于信了。',
      },
      {
        id: 'silver_dual_keep_going',
        label: '不管它，老人还等着我',
        description: '老就老吧，活干完了再说',
        hint: '信念+8 · 压力+10 · 健康-8 · 幸福-3',
        hintColor: 'negative',
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.stress = clamp(s.stress + 10, 0, 100);
          s.health = clamp(s.health - 8, 0, 100);
          s.happiness = clamp(s.happiness - 3, 0, 100);
        },
        log: '{age}岁，你把医生的叮嘱塞进口袋，第二天照常六点起来查房。有次给赵大爷翻身，腰一吃劲眼前发黑，扶着床边缓了半天。你骗自己说"老毛病"，可夜里躺下，你摸着那节疼到发麻的腰椎，第一次有点怕。你照顾了那么多老人，却还没学会心疼自己。',
      },
      {
        id: 'silver_dual_hand_off',
        label: '把亲手照顾的活交给年轻人，自己退到管理位',
        description: '你陪了半辈子床前，该让手歇歇、脑子多用用',
        hint: '管理+10 · 压力-6 · 幸福+4 · 健康+4',
        hintColor: 'positive',
        prerequisites: (s) => !!s.branchMemory?.choseCaregiver,
        skillGains: { managementSkill: 10 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 6, 0, 100);
          s.happiness = clamp(s.happiness + 4, 0, 100);
          s.health = clamp(s.health + 4, 0, 100);
        },
        log: '{age}岁，曾亲手握着老人走完最后一程的你，这回把手交了出去。你把床前的活交给年轻护理员，自己退到培训、排班、制度这边。头三个月你坐不住，总想往床边跑；可你渐渐发现，教出十个能握住老人的手，比你自己握一双更有用。你巡视时看见年轻人给王奶奶翻身，忽然有点释然——你不离开这个行业，只是换了个守夜的方式。',
      },
      {
        id: 'silver_dual_hire_carer',
        label: '给自己也请个护工，体验一回被照顾',
        description: '你守了别人一辈子，也该尝尝被人守的滋味',
        hint: '健康+6 · 幸福+8 · 压力-5 · 存款-8000',
        hintColor: 'neutral',
        savingsChange: -8000,
        stateEffect: (s) => {
          s.health = clamp(s.health + 6, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
        },
        log: '{age}岁，你瞒着秀兰给自己请了个护工，每周来两回。头一回一个二十出头的姑娘要扶你起床，你浑身不自在——你照顾了别人一辈子，哪受得了被照顾。可当她轻轻垫好腰托、扶你慢慢坐起来时，你忽然懂了你那些老人的感受：被好好对待，是会让人软下来的。你看着镜子里自己，笑了。原来你也有资格被人护着。',
      },
    ],
  },

  // 58岁：资本与情怀的博弈，和陪伴过无数老人后对死亡的思考与和解
  {
    id: 'silver_late_death_reconcile',
    title: '和解',
    sceneTag: 'crisis',
    pathId: 'silver_economy',
    ageRange: [58, 58],
    priority: 8,
    weight: 10,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '{age}岁，一家连锁养老资本找上门，要收购你的站。开价很可观，账也算得很漂亮——"你们三倍人力成本，我们现在用AI和标准化能省掉一半""临终陪伴没有产出，该砍就砍"。你陪了无数老人走到生命最后一刻，你知道这句话有多冷血。\n' +
      '夜里你去查房，见刚入住的刘奶奶屋里的灯还亮着——她怕黑，以前你总会在她门口多站一会儿。你忽然想：你照顾了别人一辈子，再过几年，你也会躺进这个行业的某张床上。资本要的是数字，你放不下的是一个一个有名有姓的人。你站在58岁的路口，第一次认真问自己：等我自己老了，我希望被怎样对待？',
    options: [
      {
        id: 'silver_death_stand_ground',
        label: '拒绝收购，守住这张床边的温度',
        description: '有些东西，多少钱都换不来',
        hint: '信念+12 · 幸福+6 · 压力+8 · 声誉+10',
        hintColor: 'positive',
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.happiness = clamp(s.happiness + 6, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
          adjustSilverReputation(s, 10);
        },
        log: '{age}岁，你拒绝了收购。对方高管临走撂下"你会后悔的"，你笑了笑，回头继续去给刘奶奶掖被角。你守的不是这家站，是"人老了，得有个人握着你的手"这件事。你见过太多被资本"优化"掉的陪伴，也见过太多老人在最后时刻抓着一个陌生护工的手。你不后悔——你陪过那么多老人走到终点，你知道什么才是他们真正需要的。',
      },
      {
        id: 'silver_death_negotiate_terms',
        label: '坐下谈，但临终陪伴和人手一条都不能砍',
        description: '资本进得来，但床边的温度得你说了算',
        hint: '管理+12 · 被动收入+6000/年 · 压力-6 · 信念-6',
        hintColor: 'neutral',
        skillGains: { managementSkill: 12 },
        passiveIncomeChange: 6000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 6, 0, 100);
        },
        log: '{age}岁，你坐下来跟他们谈。你列了一长串条件：人手不能砍、临终陪伴必须保留、评估标准你说了算。对方皱眉"你这不是卖，是雇我做慈善"，你回"那你可以不买"。最后各退一步，站保住了，老人没散，你也拿到一笔钱添置设备。你对自己说：只要床边的温度还在，这笔账怎么算你都认。',
      },
      {
        id: 'silver_death_handover',
        label: '趁机真正放手，把站交给信得过的人',
        description: '你守了半辈子夜，也该学会体面地退场',
        hint: '幸福+10 · 压力-8 · 信念+8 · 被动收入+4000/年',
        hintColor: 'positive',
        passiveIncomeChange: 4000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.stress = clamp(s.stress - 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '{age}岁，你没卖，但也开始真正放手。你把站交给跟了你十几年的小陈，自己退到顾问的位置。你陪完最后一个老人，然后坐在老站的院子里，看着新来的护理员忙进忙出。你照顾了半辈子别人的晚年，现在终于轮到自己学着接受"被好好安排"。你忽然不慌了——你亲手种下的这片灯火，会替你把夜一直守下去。',
      },
      {
        id: 'silver_death_write_standard',
        label: '把半生的经验写成标准，让"临终陪伴"被看见',
        description: '你改不了资本，但能让更多人知道这件事值钱',
        hint: '政策+10 · 管理+6 · 被动收入+8000/年 · 幸福+6 · 信念+8',
        hintColor: 'positive',
        skillGains: { policySkill: 10, managementSkill: 6 },
        passiveIncomeChange: 8000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '{age}岁，你把半辈子陪人走完最后一程的经验，整理成一套《临终陪伴标准手册》。你免费发给县里每一家养老机构，扉页写了一行字："一个人走的时候不孤单，是养老行业最值钱、也最不能删的成本。"出版社找上门要出书，你犹豫了一下，收了版税——你想让更多年轻护理员知道，自己做的这件事，值这个价。陪过无数老人走完最后一程的你，终于和死亡和解了，也终于和"钱"和解了。',
      },
    ],
  },
];

// ============================================================
// 40岁再分叉事件（silver_midlife_rebranch）
// 三条主线之外的"中年再选一次"，让玩家带着积累重新出发
// ============================================================

const silverMidlifeRebranchEvents: NarrativeEvent[] = [
  {
    id: 'silver_midlife_rebranch',
    title: '四十，再选一次',
    sceneTag: 'home',
    pathId: 'silver_economy',
    ageRange: [40, 40],
    priority: 8,
    weight: 100,
    eventType: 'milestone',
    oncePerGame: true,
    conditions: (s) =>
      s.narrativeBranch === 'silver_caregiver' ||
      s.narrativeBranch === 'silver_tech' ||
      s.narrativeBranch === 'silver_community',
    narrative:
      '{age}岁这年，你做的养老事业从"镇上有人做"变成了"行业里有人做"。隔壁县的同行一个个起来，资本也开始下场，曾经靠"熟人信任"和"先发优势"撑起来的护城河，不再像以前那么稳了。你在这条路上走了十五年，照顾过几百个老人，攒下别人偷不走的东西——但深夜你坐在老站的院子里，还是会问自己同一个问题：\n' +
      '我还在做我想做的事吗？还是只是惯性替我把路走完了？\n' +
      '这不是二十多岁那种"这条路能不能走通"的焦虑，而是"我明明还有选择"的清醒。你知道自己累了，但你没认输。你只是模糊地感觉到：四十岁不是终点，是另一条路的街角。你站在这里，还能再选一次——不是从零开始，是带着这十五年捡来的所有东西，重新出发。',
    options: [
      {
        id: 'silver_deepen_path',
        label: '不换了，把这条路走穿',
        description: '你的积累已经足够深，继续把它凿到别人够不到的地方',
        hint: '信念+12 · 幸福+8 · 压力-4 · 相关技能+8',
        hintColor: 'positive',
        memorySet: { reinforcedSilverPath: true },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress - 4, 0, 100);
          const branch = s.narrativeBranch;
          ensureSkills(s);
          if (branch === 'silver_caregiver') {
            s.pathSkills['careSkill'] = Math.min(100, (s.pathSkills['careSkill'] || 0) + 8);
          } else if (branch === 'silver_tech') {
            s.pathSkills['managementSkill'] = Math.min(100, (s.pathSkills['managementSkill'] || 0) + 8);
          } else if (branch === 'silver_community') {
            s.pathSkills['policySkill'] = Math.min(100, (s.pathSkills['policySkill'] || 0) + 8);
          }
        },
        log: '{age}岁，你没换方向。不是不敢，是你想明白了——你在这条路上攒下的照护、判断和信任，不是别人轻易能偷走的。你关掉那些"转行"的念头，把十五年的积累又往下凿了一层。浪退了，你才发现自己从没被冲走，你一直站在礁石上。',
      },
      {
        id: 'silver_switch_to_caregiver',
        label: '收回锋芒，回到那张床边',
        description: '技术和盘子都做够了，你忽然想回到那个"亲手握住老人手"的地方',
        hint: '护理+10 · 管理+4 · 压力-6 · 信念+8 · 切换至护理服务线',
        hintColor: 'positive',
        prerequisites: (s) => s.narrativeBranch !== 'silver_caregiver',
        skillGains: { careSkill: 10, managementSkill: 4 },
        branchSwitch: 'silver_caregiver',
        memorySet: { switchedToCaregiverMid: true },
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress - 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.happiness = clamp(s.happiness + 6, 0, 100);
          adjustSilverReputation(s, 5);
        },
        log: '{age}岁，你收回了那些看大屏、跑关系、谈模式的锋芒，决定回到那张床边。过去你把"照顾"委托给团队、交给系统、制度，现在你想自己再亲手握住一次老人的手。你脱掉西装换回护理服，第一天就给张奶奶翻身、喂饭、擦身。你做得有些生疏了，但张奶奶说"小X，你手还是这么稳"。你笑了笑——有些东西，从来不会因为换过跑道就丢。',
      },
      {
        id: 'silver_switch_to_tech',
        label: '把积累变成技术和系统',
        description: '你比多数人更懂养老到底缺什么，那就把它做成看得见的工具',
        hint: '管理+10 · 政策+4 · 压力+8 · 信念+6 · 切换至智慧养老线',
        hintColor: 'neutral',
        prerequisites: (s) => s.narrativeBranch !== 'silver_tech',
        skillGains: { managementSkill: 10, policySkill: 4 },
        branchSwitch: 'silver_tech',
        memorySet: { switchedToTechMid: true },
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          adjustSilverRevenue(s, 3000);
        },
        log: '{age}岁，你决定不再只做那个"人海战术"的人。那些年你见过太多老人因为"没人发现"而错过最佳照护时机，你受够了"靠记忆、靠盯班"的笨办法。你开始把脑子里的经验写成系统——跌倒预警、用药提醒、生命体征曲线。你比{startAge}岁那年更懂技术该放在哪里：不是取代那一双手，是让那一双手永远来得及。你发现当养老有了"看得见"的底座，钱和发展会自己找上门。',
      },
      {
        id: 'silver_switch_to_community',
        label: '把积累变成模式和影响力',
        description: '你比多数人更懂社区养老这门生意，那就让一个镇、一个县、更多地方都做得起来',
        hint: '政策+10 · 管理+6 · 被动收入+6000/年 · 压力+6 · 切换至社区养老线',
        hintColor: 'positive',
        prerequisites: (s) => s.narrativeBranch !== 'silver_community',
        skillGains: { policySkill: 10, managementSkill: 6 },
        passiveIncomeChange: 6000,
        branchSwitch: 'silver_community',
        memorySet: { switchedToCommunityMid: true },
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          adjustSilverReputation(s, 8);
        },
        log: '{age}岁，你决定不再只做那个"守着一亩三分地的人"，而要成为那个"让更多人做得起来的人"。你开始把模式复制出去——不是二十多岁那种跑政府要牌照的忐忑，是带着十五年摸透的门道、踩过的坑做出来的模板。你发现当你的模式有了分量，钱、政策和影响力会自己找上门。',
      },
    ],
  },
];

// ============================================================
// 分支记忆回声事件（silver 42-44岁，后期"翻旧账"，形成叙事闭环）
// ============================================================

const silverEchoEvents: NarrativeEvent[] = [

  // 42岁：当年一起入行的老伙计
  {
    id: 'silver_echo_old_partner',
    title: '老伙计',
    sceneTag: 'community_care',
    pathId: 'silver_economy',
    ageRange: [42, 42],
    priority: 6,
    oncePerGame: true,
    memoryAnyOf: ['choseCaregiver', 'choseTech', 'choseCommunity'],
    narrative:
      '你刷到一条动态：当年那个和你一起揣着旧护理手册、在居委会旧房里研究养老事业的"老伙计"，现在去了大城市一家养老连锁集团做高管，照片里他西装革履，身后是崭新的写字楼和一行"重新定义中国养老"的标语，但鬓角白了，眼神也倦了。\n' +
      '你们已经很久没联系了。你盯着那张照片，忽然想起：当年如果不是他拉你一起入行，你可能现在还守在街道办那间办公室里。你打开聊天框，光标闪了很久。',
    options: [
      {
        id: 'silver_reach_out_partner',
        label: '发条消息，约他回老家坐坐',
        description: '有些过命的交情，不该只活在朋友圈里',
        hint: '幸福+8 · 压力-5 · 存款-2000',
        hintColor: 'positive',
        savingsChange: -2000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
        },
        log: '你给他发了条消息，他秒回："我还以为你把我忘了。"他坐高铁回了老家，你们在镇上那家老面馆坐了一下午。他感叹"在大城市做养老，离老人越来越远了"，你劝他"哪天干累了就回来，镇上还缺个能写方案的人"。聊到傍晚，他问你当年要是没一起入行会怎样，你笑着说"那我可能还在街道办给人盖公章"。他拍你的肩："那你就错过了这么多老人。"两个都不再年轻的人，在夕阳下笑得很开。',
      },
      {
        id: 'silver_watch_quietly',
        label: '看看就好，不打扰',
        description: '各自安好，就是最好的结局',
        hint: '幸福+3 · 压力-2',
        hintColor: 'neutral',
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 3, 0, 100);
          s.stress = clamp(s.stress - 2, 0, 100);
        },
        log: '你点了个赞，关掉了动态。你们已经很久没联系了，但你知道他在大城市也做养老，你也知道他在自己的路上走得不错。成年人的友谊有时候就是这样——不打扰，但心里一直有那个位置。你把手机放进口袋，转身走进站里，一个老人正招手喊你过去。',
      },
    ],
  },

  // 43岁：那扇没推开的门
  {
    id: 'silver_echo_unopened_door',
    title: '那扇门',
    sceneTag: 'home',
    pathId: 'silver_economy',
    ageRange: [43, 43],
    priority: 6,
    oncePerGame: true,
    memoryAnyOf: ['choseCaregiver', 'choseTech', 'choseCommunity'],
    narrative:
      '深夜整理旧柜子，你翻出一份当年给县里写的《社区养老发展规划》初稿。那是你研究了很久、最后因为"时机不成熟"没推下去的一个方案——现在邻省一个县照着你当年的思路做成了全国样板，新闻里白发苍苍的专家们围着那块牌子鼓掌。\n' +
      '十五年前你面前有过这么一扇门，你犹豫过，最后没推开。你从不后悔自己的选择——你现在的路也很好。只是偶尔，在这样安静的深夜，你会好奇门后面的那条路，会把你带到哪里。你合上那份初稿，不是留恋，是想知道，那个平行的自己，过得好不好。',
    options: [
      {
        id: 'silver_close_forever',
        label: '合上初稿，回到自己的站',
        description: '不回顾，不内耗，专注脚下',
        hint: '信念+8 · 压力-4 · 幸福+3',
        hintColor: 'positive',
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.stress = clamp(s.stress - 4, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
        },
        log: '你把那份初稿放回柜子，关掉灯。这扇门你已经看了十五年，该合上了。你走回老站的院子，那里有你的老人、你的事业、你亲手选的人生。你不再回望——不是不想，是终于明白，每条路都有它独一无二的风景。院角那棵你年轻时种的槐树，又开了一季花。',
      },
      {
        id: 'silver_open_again',
        label: '顺着那扇门，去做当年没做的事',
        description: '中年再去补上当年的遗憾，做点真正想做的事',
        hint: '幸福+10 · 压力+6 · 信念+6 · 存款-8000',
        hintColor: 'neutral',
        savingsChange: -8000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '你花了一个月把当年那个方案重新推演了一遍。它已经不再是当年的样子了——但你这些年的经验和底气也不再是十五年前的样子。你重新给县里递了一份报告，结合这些年踩过的坑，补上了当年没想清楚的落地细节。你四十多岁了，本该求稳，可你发现，当你真的想推开一扇门的时候，你依然会心跳加速。你决定去看看——不是逃回过去，是带着这半生的重量，去补一个当年没舍得做的梦。',
      },
    ],
  },

  // 44岁：换过航向的人
  {
    id: 'silver_echo_switched_path',
    title: '换过的路',
    sceneTag: 'home',
    pathId: 'silver_economy',
    ageRange: [44, 44],
    priority: 6,
    oncePerGame: true,
    conditions: (s) => (s.branchHistory || []).length > 1,
    narrative:
      '整理旧纸箱时，你翻到一本十五年前的护理笔记。那是你刚入行时写的，字迹潦草，满是"翻身要托住腰""喂饭先试温度"这样朴素的提醒，每一页都画着你拙劣的简图。你忽然想起自己换过多少次方向——从一手一脚的护理，到搭系统做技术，再到跑政府铺社区，又或者反着来。\n' +
      '外人看你，是一个"一直很专注的人"。只有你知道，你其实一直在换路，只是一次比一次更笃定。那些曾让你彻夜难眠的"错误选择"，回头看都成了下一个路口的路标。你保存好那本笔记，像保存一枚旧徽章。不是遗憾，是纪念——纪念那个愿意一次次重新出发的自己。',
    options: [
      {
        id: 'silver_accept_own_path',
        label: '坦然接受，这就是我的人生',
        description: '换过路，绕了远，但每一步都算数',
        hint: '信念+10 · 幸福+8 · 压力-5',
        hintColor: 'positive',
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
        },
        log: '你合上那本笔记，给自己泡了杯茶。窗外是黄昏，你就着夕阳想：你换过路，绕过远，走过别人觉得"折腾"的弯路——但正是那些弯路，让你在四十多岁的时候，比那些从未下过车的人，更清楚自己想去哪。你吹了吹茶上的热气。这条路是你自己绕出来的，每一段都算数。',
      },
      {
        id: 'silver_share_winding_path',
        label: '把换路的经验讲给新人听',
        description: '你的弯路，是别人最好的路灯',
        hint: '幸福+8 · 政策+4 · 被动收入+4000/年 · 压力+3',
        hintColor: 'positive',
        skillGains: { policySkill: 4 },
        passiveIncomeChange: 4000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress + 3, 0, 100);
        },
        log: '你受邀在县里的养老从业者交流会上分享自己换路的心路。你讲了那些绕过的弯、吃过的亏、推翻重来的决定。讲完掌声响了很久。散场后一个刚入行的年轻人红着眼眶说："谢谢你，我正纠结要不要换个方向。"你拍拍他的肩："换不换都对，只要别骗自己。"你忽然觉得，你这半生的蜿蜒，原来也可以成为别人的坦途。',
      },
    ],
  },
];

// ============================================================
// 合并所有事件
// ============================================================

export const SILVER_NARRATIVE_EVENTS: NarrativeEvent[] = [
  ...commonEvents,
  ...branchSelectEvent,
  ...caregiverEvents,
  ...techEvents,
  ...communityEvents,
  ...crossBranchEvents,
  ...crisisEvents,
  ...silverWarningEvents,
  ...postAllInEvents,
  ...lateGameEvents,
  ...silverMidlifeRebranchEvents,
  ...silverEchoEvents,
];

// ============================================================
// 银发守夜人路径 - 叙事成就触发系统
//
// 3条分支 × 3个等级 = 9个成就。
// 技能达标后自动触发，给玩家里程碑式的成就感。
// 初级/中级成就改变人生轨迹，终极成就触发退休判定。
//
// 技能维度：
//   - careSkill         护理专业能力 (0-100)
//   - managementSkill   运营管理能力 (0-100)
//   - policySkill       政策资源能力 (0-100)
// ============================================================

// ------------------------------------------------------------
// 护理服务线 (silver_caregiver) —— 用双手守护尊严
// ------------------------------------------------------------
const caregiverAchievements: NarrativeAchievement[] = [
  // 初级：专业护理师
  {
    id: 'silver_economy_caregiver_1',
    title: '专业护理师',
    narrative: `你拿到了高级养老护理员职业资格证书。从"凭良心干"到"凭专业干"，你用了四年。\n\n证书发下来那天你摩挲了很久。你想起了{startAge}岁那个连胃管都不会推、手抖得像筛糠的自己。现在你能闭着眼睛完成鼻饲操作、能一眼分辨压疮的分期、能在三分钟内完成心肺复苏。你不再只是一个"伺候人的人"，你是一个专业护理师。秀兰说"你变了"，你说"我哪是变了——我只是终于配得上这份工了"。`,
    pathId: 'silver_economy',
    branch: 'silver_caregiver',
    level: 1,
    skillRequirements: { careSkill: 35 },
    stateEffect: (state) => {
      // 月薪×1.3（乘性加薪）
      state.currentMonthlySalary = Math.round(state.currentMonthlySalary * 1.3);
      state.pathFaith = Math.min(100, state.pathFaith + 10);
      adjustSilverReputation(state, 10);
    },
    log: `你拿到了高级养老护理员证书。从"凭良心干"到"凭专业干"，月薪涨了30%。`,
  },

  // 中级：区域护理标杆
  {
    id: 'silver_economy_caregiver_2',
    title: '区域护理标杆',
    narrative: `你的护理团队被县民政局评为"区域居家护理示范单位"。别的机构开始来学习你的操作手册和质检体系。\n\n那天你站在培训室里，给二十多个外机构来的护理员讲翻身扣背的操作要点。你忽然想起26岁写那本手册时秀兰说的"你是要我们照着这个干"。现在，不只是你的团队照着干，半个县的护理员都在照着干。你没有觉得骄傲，反而觉得肩上更重了——因为你定的标准，别人在用，你就不能让它出错。`,
    pathId: 'silver_economy',
    branch: 'silver_caregiver',
    level: 2,
    skillRequirements: { careSkill: 55, managementSkill: 30 },
    passiveIncomeChange: 15000, // 培训费收入
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 8);
      adjustSilverReputation(state, 12);
      adjustSilverRevenue(state, 3000);
    },
    log: `你的护理团队被评为区域示范单位。你的操作手册成了半个县的护理标准。培训费带来被动收入+15000/年。`,
  },

  // 终极：养老护理之魂
  {
    id: 'silver_economy_caregiver_3',
    title: '养老护理之魂',
    narrative: `你的护理品牌覆盖了三座城市，服务超过两千位老人。但你每周还是会抽一天时间亲自去照顾老人——你提醒自己不要忘了为什么出发。\n\n那天你照常去给一位九十二岁的奶奶翻身。她拉着你的手说"你是谁啊"，你说"我是小X"。她笑了，说"小X啊，我记不住人了，但我记得你的手——你的手是暖的"。你走出她家，站在走廊里红了眼眶。二十年了，从一块手写牌子到三座城市，你一直在用同一双手握住那些枯瘦的手。你赌的不是银发经济，你赌的是——每个人老了以后，都值得有一双温暖的手。你赢了。`,
    pathId: 'silver_economy',
    branch: 'silver_caregiver',
    level: 3,
    skillRequirements: { careSkill: 75, managementSkill: 50, policySkill: 30 },
    passiveIncomeChange: 40000,
    stateEffect: (state) => {
      state.currentMonthlySalary = Math.round(state.currentMonthlySalary * 1.5);
      state.pathFaith = Math.min(100, state.pathFaith + 12);
      adjustSilverReputation(state, 12);
      adjustSilverRevenue(state, 8000);
    },
    log: `你的护理品牌覆盖三座城市，服务超两千位老人。签约奖金15万到账，被动收入+40000/年，月薪涨50%。但你每周仍亲自上门——你忘不了那双说"你的手是暖的"的枯瘦的手。`,
    triggersRetirementCheck: true,
    savingsChange: 150000,
  },
];

// ------------------------------------------------------------
// 智慧养老线 (silver_tech) —— 用技术守护晚年
// ------------------------------------------------------------
const techAchievements: NarrativeAchievement[] = [
  // 初级：智慧养老产品落地
  {
    id: 'silver_economy_tech_1',
    title: '智慧养老产品落地',
    narrative: `你的智慧养老系统接入了第一个完整社区——三百位独居老人全部佩戴了你的设备，后台数据跑通了。\n\n你坐在服务站里盯着大屏，看着那三百个绿点此起彼伏地闪烁，像一个城市的心跳。每一个绿点背后都是一个活生生的人——有人在下棋，有人在睡觉，有人在散步。你知道这些绿点偶尔会变红，而每一次变红都可能是一条命。你忽然感到技术的重量：它不只是代码和传感器，它是三百个家庭的"放心"。`,
    pathId: 'silver_economy',
    branch: 'silver_tech',
    level: 1,
    skillRequirements: { managementSkill: 35, careSkill: 15 },
    savingsChange: -10000, // 设备投入
    passiveIncomeChange: 8000, // 服务费
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 10);
      adjustSilverReputation(state, 8);
      adjustSilverClients(state, 10);
    },
    log: `你的智慧养老系统接入第一个完整社区，三百位老人全覆盖。服务费带来被动收入+8000/年。`,
  },

  // 中级：平台规模化
  {
    id: 'silver_economy_tech_2',
    title: '平台规模化',
    narrative: `你的平台接入了五家养老机构，覆盖超过两千位老人。你的AI预警系统提前发现了十七例健康风险，其中三例是心梗前期。\n\n投资人说"你们是养老行业的SaaS"。你不太懂SaaS，但你知道那十七个被提前发现的老人，有三个因为及时送医而活了下来。你把那三个老人的名字写在一张便签纸上，贴在电脑旁边。每次有人问你"你的产品价值是什么"，你就指着那张便签——价值，就是那三个还活着的人。估值算什么。`,
    pathId: 'silver_economy',
    branch: 'silver_tech',
    level: 2,
    skillRequirements: { managementSkill: 55, careSkill: 30 },
    passiveIncomeChange: 15000,
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 8);
      adjustSilverReputation(state, 10);
      adjustSilverRevenue(state, 5000);
    },
    log: `你的智慧养老平台接入五家机构，覆盖超两千老人。AI预警提前发现十七例风险，救回三条命。被动收入+15000/年。`,
  },

  // 终极：智慧养老基础设施
  {
    id: 'silver_economy_tech_3',
    title: '智慧养老基础设施',
    narrative: `你的AI健康预警系统成了全省养老行业的基础设施——八千多位老人的数据在你的服务器上跳动，每个月提前预警上百例健康风险。\n\n省领导来视察时指着大屏说"这就是智慧养老的样子"。你站在旁边，却在想那个凌晨两点变红的绿点——赵爷爷摔在卫生间地上，手环亮了，你冲过去救回一条命。现在你有八千多个绿点了，每天打开后台，看着它们整整齐齐地闪烁，像一片由心跳组成的星海。你想：你{startAge}岁回老家时什么都没有，如今一台服务器守护着八千个人的晚年。技术不冷，冷的是不用它的人。`,
    pathId: 'silver_economy',
    branch: 'silver_tech',
    level: 3,
    skillRequirements: { managementSkill: 75, careSkill: 50, policySkill: 30 },
    savingsChange: 150000, // 政府采购+融资
    passiveIncomeChange: 40000,
    stateEffect: (state) => {
      state.currentMonthlySalary = Math.round(state.currentMonthlySalary * 1.5);
      state.pathFaith = Math.min(100, state.pathFaith + 12);
      adjustSilverReputation(state, 12);
      adjustSilverRevenue(state, 10000);
    },
    log: `你的AI预警系统成为全省养老基础设施，守护八千多位老人。政府采购+融资15万到账，被动收入+40000/年，月薪涨50%。`,
    triggersRetirementCheck: true,
  },
];

// ------------------------------------------------------------
// 社区运营线 (silver_community) —— 让老人活在生活里
// ------------------------------------------------------------
const communityAchievements: NarrativeAchievement[] = [
  // 初级：社区养老模式跑通
  {
    id: 'silver_economy_community_1',
    title: '社区养老模式跑通',
    narrative: `你的第一家日间照料中心稳定运营了一年，每月服务老人超过六十人，老年食堂成了社区最热闹的地方。\n\n民政局的科长来验收时翻了翻你的签到本，六十多个名字整整齐齐。他说"你这模式可以复制"。你笑了——你做的哪是什么"模式"，你是在给那些白天没处去的老人一个"家"。但你也知道，如果能让更多老人有这个"家"，"模式"这个词也算好事。`,
    pathId: 'silver_economy',
    branch: 'silver_community',
    level: 1,
    skillRequirements: { policySkill: 35, managementSkill: 20 },
    passiveIncomeChange: 10000, // 政府补贴
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 10);
      adjustSilverReputation(state, 10);
      adjustSilverClients(state, 8);
    },
    log: `你的日间照料中心稳定运营，月服务超六十人。模式被认可，政府补贴带来被动收入+10000/年。`,
  },

  // 中级：政府示范项目
  {
    id: 'silver_economy_community_2',
    title: '政府示范项目',
    narrative: `你的"社区嵌入式养老"被省里评为示范项目，民政厅出了一本手册叫《XX模式》，发到了全省每个街道。你被请去给全省社区干部做培训。\n\n你站在讲台上，台下坐着两百多个来自各地的社区干部。你讲完最后一个案例时，一个头发花白的老镇长站起来说"我在基层干了三十年，头一次觉得养老这事有解了"。你愣了一下，忽然意识到：你不只是在一个镇上做养老了，你的经验正在变成一种"可能性"——让更多老人留在社区里、留在生活里的可能性。`,
    pathId: 'silver_economy',
    branch: 'silver_community',
    level: 2,
    skillRequirements: { policySkill: 55, managementSkill: 35 },
    passiveIncomeChange: 15000, // 培训+咨询
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 8);
      adjustSilverReputation(state, 12);
      adjustSilverRevenue(state, 4000);
    },
    log: `你的社区养老模式被省里评为示范项目。你的经验成了全省的"可能性"。培训+咨询带来被动收入+15000/年。`,
  },

  // 终极：养老生态构建者
  {
    id: 'silver_economy_community_3',
    title: '养老生态构建者',
    narrative: `你的养老社区开业了。不是养老院——是一个让老人可以继续"生活"的地方。有花园、有菜地、有活动室、有食堂、有医务室。老人们住自己的小屋，白天在社区里活动，需要帮助时按一下铃就有人来。\n\n开业那天你站在花园里，看着老人们下棋、种菜、跳广场舞。你妈站在你旁边说"当年我说你回来伺候人是没出息，现在我觉得你做的这事比考上公务员有出息多了"。你没说话，但眼眶热了。二十年了，从一块手写牌子到一个社区，你赌的一直是一件事：每个人都会老，而每个人都值得在老去的时候，还有一个像"家"的地方。你做到了。也许有一天你自己也会住进来，安心地变老——这就是你留给所有人的答案。`,
    pathId: 'silver_economy',
    branch: 'silver_community',
    level: 3,
    skillRequirements: { policySkill: 75, managementSkill: 50, careSkill: 30 },
    savingsChange: 150000,
    passiveIncomeChange: 40000,
    stateEffect: (state) => {
      state.currentMonthlySalary = Math.round(state.currentMonthlySalary * 1.5);
      state.pathFaith = Math.min(100, state.pathFaith + 12);
      adjustSilverReputation(state, 12);
      adjustSilverRevenue(state, 8000);
    },
    log: `你的养老社区开业了——一个让老人继续"生活"的地方。政府奖金+社会捐赠15万到账，被动收入+40000/年，月薪涨50%。你妈终于说"你有出息"。`,
    triggersRetirementCheck: true,
  },
];

// ============================================================
// 汇总：银发守夜人全部成就（按 分支 → 等级 排序）
// ============================================================
export const SILVER_ACHIEVEMENTS: NarrativeAchievement[] = [
  ...caregiverAchievements,
  ...techAchievements,
  ...communityAchievements,
];

// ============================================================
// 自动注册
// ============================================================
registerNarrativeEvents(SILVER_NARRATIVE_EVENTS);
registerAchievements(SILVER_ACHIEVEMENTS);
