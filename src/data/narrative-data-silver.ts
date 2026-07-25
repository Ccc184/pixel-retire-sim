/**
 * 银发收割者路径 · 完整叙事事件库
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
      '你在老家的街道办有一份体面的工作，每天朝九晚五。但每个周末你都骑着电动车穿街走巷，去给独居老人量血压、陪他们聊天。同事以为你在"看望长辈"，其实你在试一个未来。\n' +
      '张奶奶是你接手的第一个正式客户。她八十一岁，股骨颈骨折后卧床半年，女儿在深圳打工回不来，托人找一个"信得过的人"每周推她去医院换药复查。女儿每月给你转800块——不多，但这是你第一次靠"伺候人"赚到钱。\n' +
      '你第一次推着轮椅走在老家的街上，张奶奶枯瘦的手攥着你的胳膊，指甲嵌进你的皮肤。她忽然抬头说："小伙子，你比我亲儿子还贴心。"你鼻子一酸，没接话——你怕一开口就哭出来。',
    options: [
      {
        id: 'all_in_care',
        label: '把张奶奶当亲人一样照顾',
        description: '周末全程陪护，换药、擦身、陪聊、记录每天的药量和饮食',
        hint: '护理+12 · 压力+8 · 幸福+5 · 声誉+10 · 客户+1 · 信念+5',
        hintColor: 'positive',
        skillGains: { careSkill: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          adjustSilverClients(s, 1);
          adjustSilverReputation(s, 10);
        },
        log: '22岁，你把张奶奶当成了自己的奶奶。每周六日准时上门，换药、翻身、记药量。一个月后张奶奶的女儿寄来一面锦旗，那是你人生收到的第一面锦旗。你把它藏在衣柜里——不敢让同事看到，怕他们问你周末在干什么。',
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
        log: '22岁，你给自己定了规矩：服务归服务，感情归感情。你按约定把张奶奶照顾得妥妥当当，但每次她拉着你说话时你都会看表——周一还要上班。你觉得这样是对的，但夜里偶尔会想起她攥着你胳膊的手。',
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
        log: '22岁，你买了一摞护理教材和老年医学的书。工作日下班后啃到深夜，周末现学现用。褥疮怎么防、鼻饲怎么喂、降压药不能和什么同吃——你把每一条都抄在小本子上。你越学越害怕：原来照顾老人有这么多门道，你差点因为无知害了人。',
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
      '过年，亲戚聚在你家。三姨问："你家孩子大学毕业在那边做什么呀？"你妈端菜的手顿了一下，支吾着说"在……在街道办上班"。\n' +
      '三姨点点头："那挺好，稳定。"然后你爸接了一句："好什么好，周末还去给人家老头老太太换尿垫！"满桌安静了两秒，然后三姨压低声音："念了四年大学，周末去当保姆？是不是工资太低了？要不要让你三姨夫帮你问问？"\n' +
      '你没说话，低头扒饭。饭后你妈把你拉进厨房，红着眼说："供你上大学不是让你周末去伺候人的。你要是缺钱，妈去跟人借。"你张了张嘴，发现自己不知道怎么解释——你看到的那个未来，用一句话说不清。',
    options: [
      {
        id: 'prove_with_money',
        label: '憋着这口气，用收入证明自己',
        description: '你说不出大道理，那就让钱包替你说话',
        hint: '管理+10 · 压力+12 · 幸福-5 · 信念+6 · 月薪+500',
        hintColor: 'positive',
        skillGains: { managementSkill: 10 },
        salaryChange: 500,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.happiness = clamp(s.happiness - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '23岁，三姨那句话像根刺扎在你心里。你开始拼命接单、算账、压成本，三个月后月收入翻了一倍。过年你给妈塞了一个厚红包，她数了数眼圈又红了，什么都没说。',
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
        log: '23岁，你跟爸妈在客厅聊到凌晨一点。你翻开手机里查到的数据：中国60岁以上人口将突破4亿，养老护理员缺口上千万。你妈听完沉默很久，最后说："妈不懂大道理，但你要是想好了，就去做。别丢了良心就行。"',
      },
      {
        id: 'waver_secretly',
        label: '表面坚持，偷偷看公务员招考',
        description: '不是没骨气，是看不到头的日子太难熬了',
        hint: '管理+3 · 压力+5 · 信念-8 · 幸福-3',
        hintColor: 'negative',
        skillGains: { managementSkill: 3 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.happiness = clamp(s.happiness - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 8, 0, 100);
        },
        log: '23岁，你在手机里存了一份省考职位表，每天睡前翻两眼。你投了两次简历给隔壁县的民政局临时岗，都没回音。你把这事烂在肚子里，白天继续推轮椅、换尿垫，夜里盯着天花板想：我是不是真的错了。',
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
      '白天你在街道办对着电脑敲材料，脑子里却全是李爷爷的药量和饮食记录。李爷爷七十八岁，中风后半身不遂，右半边身子动不了。你每个周末去给他擦身、换成人纸尿裤、做关节活动度训练，工作日晚上还要打电话叮嘱他按时吃药。\n' +
      '那个周六你正给他擦背，他忽然抓住你的手，浑浊的眼睛里蓄满了泪："小伙子，你说我活成这样……是不是该早点走了？省得拖累人。"\n' +
      '你手里的毛巾停住了。你不知道该说什么——安慰的话太轻，沉默又太重。你想起他床头柜上摆的全家福，照片里的他还站着，笑容硬朗。你忽然意识到：衰老最残忍的不是身体的崩塌，而是一个清醒的灵魂被困在一具不听使唤的身体里。你也很累——周一到周五上班，周末全部搭进去，你已经记不清上一次休息是什么时候了。',
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
        log: '23岁，你什么都没说，握着李爷爷的手坐了半个小时。后来他没再提"走"的事，每次你去他都笑。他女儿偷偷给你转了红包，你没收。你知道你给不了他健康，但你能给他一个"被在乎着"的下午。',
      },
      {
        id: 'professional_reframe',
        label: '用专业的话开导他，帮他找到价值感',
        description: '教他做力所能及的康复训练，让他觉得自己还在进步',
        hint: '护理+12 · 管理+4 · 压力+8 · 信念+3 · 声誉+5',
        hintColor: 'neutral',
        skillGains: { careSkill: 12, managementSkill: 4 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
          adjustSilverReputation(s, 5);
        },
        log: '23岁，你给李爷爷设计了一套床上康复操，每天做十分钟。一个月后他的左手能自己端碗了，他举着碗给你看的时候像个孩子。你说"李爷爷你在进步"，他咧着歪掉的嘴笑了。你第一次觉得专业知识是有温度的。',
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
        log: '23岁，你学会了一件事：照顾老人可以用心，但不能用命。你给自己定了规矩——不参加客户的葬礼，不留客户的联系方式在私人手机里，下班后不回忆白天的事。你觉得这让你活得更久，但偶尔夜里会觉得自己变得冷了。',
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
      '客户涨到了五个，你一个人快扛不住了。周一到周五在街道办上班，周六日从早上六点跑到晚上九点，五个老人换药、翻身、量血压，电动车跑得快没电了你还没跑完。\n' +
      '你已经在办公室打过三次瞌睡被领导看见了。科长把你叫去谈话："年轻人是不是晚上熬夜玩手机？注意形象。"你点头说改，心里清楚：你根本没有晚上，下班就直接变成另一个身份。\n' +
      '有客户介绍来第六个老人，你接不接？接了就要想办法分身，不接就等于把口碑往外推。你在午休时偷偷发了一条朋友圈找周末帮工，来了几个人问，大多是好奇的，真愿意干的只有一个叫秀兰的嫂子——四十出头，手粗得像砂纸，说"我妈瘫了三年是我伺候走的，这活我干得了"。',
    options: [
      {
        id: 'hire_xiulan_weekend',
        label: '周末雇秀兰帮忙，自己接第六个客户',
        description: '用副业收入付工资，先跑通"两个人"的模式',
        hint: '管理+10 · 护理+5 · 存款-4000 · 压力-5 · 信念+4 · 客户+2 · 月营收+800',
        hintColor: 'positive',
        skillGains: { managementSkill: 10, careSkill: 5 },
        savingsChange: -4000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          adjustSilverClients(s, 2);
          adjustSilverRevenue(s, 800);
        },
        log: '24岁，你用周末副业的收入给秀兰开了日薪。她第一次给老人翻身时轻得像托着一片叶子，你心里一块石头落了地。有了她，周六日终于能喘口气，但你清楚：你现在的身份还是"街道办上班族"，秀兰只知道你周末干这个，不知道你脑子里已经在想更大的事了。',
      },
      {
        id: 'train_xiulan_expand',
        label: '手把手教秀兰，让她能独立上门',
        description: '花两个月培训她，把部分客户交出去，自己腾出手跑新客户',
        hint: '管理+12 · 护理+8 · 压力+10 · 健康-3 · 信念+5 · 客户+3 · 月营收+1200',
        hintColor: 'positive',
        skillGains: { managementSkill: 12, careSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          adjustSilverClients(s, 3);
          adjustSilverRevenue(s, 1200);
        },
        log: '24岁，你花了两个月把翻身、鼻饲、压疮护理一项项教给秀兰。工作日晚上写培训笔记，周末现场带教。累得嗓子哑了半个月，但两个月后秀兰能独立上门了。你第一次觉得这事能成——不只是你自己能干，而是能复制。白天在办公室你嘴角带着笑，同事以为你谈恋爱了。',
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
        log: '24岁，你没雇人，咬着牙又扛了一年。周一到周五上班，周六日从早跑到晚，每天只睡四五个小时。有次在办公室打瞌睡被领导拍了桌子，有次给老人翻身时眼前一黑差点摔倒。秀兰发微信问你还需不需要人，你回了句"再等等"——心里知道她是对的，但你还没准备好当"老板"。',
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
      '三年了。你白天还在街道办上班，但所有人都知道你周末"有别的安排"。你的周末照护从一个人跑变成了带着秀兰一起跑，七八个固定客户，镇上开始有人叫你"那个搞养老的小伙子"。你妈终于敢跟亲戚说"我孩子在社区做养老"了，虽然还是会补一句"不是保姆，是……是那种，有牌照的"。\n\n' +
      '但你心里清楚，这只是个开始。周末两天的时间是有上限的——你的体力有上限，秀兰的耐心有上限，靠"多接一单"的增长模式走不远。25岁这年，你必须想清楚：如果有一天要辞职全力做这件事，它到底要长成什么样。\n\n' +
      '深夜你坐在租来的那间小工作室里——说是工作室，其实就是居委会借你的一间旧房，周末用来放轮椅和血压计。面前摆着三样东西：一本护理操作手册、一台朋友寄来的智能手环样品、一张民政局发的社区养老试点文件。三个方向，三条路。你只能选一条，走到黑。窗外老家的夜很静，偶尔有狗叫，你想：每个人都会老，但每个人想要的"老"是不一样的。',
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
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          adjustSilverReputation(s, 5);
        },
        log: '25岁，你选了最难走的那条路——亲手把"伺候人"这件事做成一门专业。你把护理手册翻烂了，开始写自己的操作规范。别人觉得这活又脏又累，你觉得这里头有别人看不见的尊严。',
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
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          adjustSilverRevenue(s, 1500);
        },
        log: '25岁，你把积蓄砸进了第一批智能手环的采购和系统开发。你相信技术能让养老这件事不再只靠"人多"，而是靠"看得见"。设备到货那天你拆了一整夜的箱子，像拆一个未来。',
      },
      {
        id: 'choose_community',
        label: '做社区养老，和政府合作铺开',
        description: '日间照料中心、老年食堂、社交活动——让老人不必离开熟悉的家，在社区里安度晚年。你赌的是：政府的钱和政策是最稳定的燃料。',
        hint: '政策+12 · 管理+5 · 压力+3 · 信念+6 · 声誉+8 · 月营收+1000',
        hintColor: 'positive',
        skillGains: { policySkill: 12, managementSkill: 5 },
        branchSwitch: 'silver_community',
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          adjustSilverReputation(s, 8);
          adjustSilverRevenue(s, 1000);
        },
        log: '25岁，你揣着那份民政局文件跑了一个月的审批。日间照料中心的牌照批下来那天，你在服务站门口站了很久。你选的不是最快赚钱的路，但你相信：让老人留在熟悉的地方，才是养老该有的样子。',
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
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '你发现秀兰和另外两个护理员各干各的：秀兰翻身时先左侧再右侧，老刘翻身时先右侧再左侧；有人喂饭前量血压，有人喂完才量。同一个老人被三个人用三种方式照顾，出了问题根本说不清是谁的环节。\n' +
      '你花了整整一个月，把两年来的护理经验写成了一本手册——《居家养老护理操作规范》。从洗手七步法到翻身扣背的节律，从鼻饲温度到压疮分期，四十七页，每一条都配了你自己画的简图。\n' +
      '你把手册发给护理员时，秀兰翻了两页说："你是要我们照着这个干？"你说："不是要你们照着干，是让每个老人不管谁来照顾，都享同样的好。"',
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
        log: '26岁，你把那本手册变成了铁律。第一个月有两个护理员因为不按规范操作被扣了钱，其中一个赌气辞了职。但留下的人开始服你——因为你每一条规范都是自己用命试出来的。半年后，"你家护理正规"的口碑传了出去。',
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
        log: '26岁，你把每周三晚上定为"培训夜"，亲自教翻身、教鼻饲、教急救。护理员们一开始嫌烦，但三个月后她们发现自己干活更顺了，老人反馈也好了。秀兰说"以前是凭感觉，现在心里有谱了"。',
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
      '你之前没操作过胃管。你花了三天去县医院的护理科旁听，学会了胃管冲管、营养液温度控制、回抽检查胃残余量。第一次给周奶奶推营养液时你的手在抖——你怕弄疼她，更怕出错。\n' +
      '推完之后周奶奶的嘴里溢出一丝笑意，虽然她可能已经不认识你是谁了。你忽然明白：所谓专业，就是让一个连话都说不出来的人，也能感到舒服。',
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
        log: '28岁，你成了镇上唯一会做医疗级护理的人。别的服务站不敢接的插管老人、气切老人全转给了你。你累得瘦了一圈，但你知道：这些最难照顾的老人，恰恰最需要专业的人。',
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
        log: '28岁，你跑断了腿终于让县医院护理科松了口：出院需要居家护理的老人可以转介给你，他们定期派人培训你的团队。你从一个"野路子"变成了有医院背书的正规军。',
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
      '你不知道按了多久，直到救护车来。医生后来说"再晚三分钟人就没了"。你坐在急诊室走廊的地上，双手还在抖。秀兰蹲在旁边哭，说"我以为他要死在我手上了"。\n' +
      '你忽然意识到：你每天面对的是随时可能离开的生命。你救回来了这一次，但下一次呢？每一个护理员都会遇到这种时刻——她们准备好了吗？',
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
        log: '30岁，你把所有护理员送去考了红十字急救证，你自己也考了。刘爷爷出院后他儿子送来一封感谢信，你把它裱起来挂在墙上——那不是锦旗，是一封写着"谢谢你救了我爸的命"的普通信，但你觉得它比什么都重。',
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
        log: '30岁，你花了一万二给每个服务点配了AED和急救药箱。秀兰说"这钱花得冤枉，哪有那么多心梗"，你说"花一万二买一个万一，值"。后来那台AED真的用上了两次，你想：命不是用钱算的。',
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
      '张奶奶走了。你照顾了她整整九年。\n' +
      '最后那一个月她已经认不出人了，但每次你去她都会咧嘴笑。走的那天是凌晨，她女儿打电话来时声音很平静："妈走的时候没受罪，谢谢你这些年。"你挂了电话，坐在床边发了很久的呆。\n' +
      '你去参加了葬礼。你站在人群最后面，看着遗照上那个你推了九年轮椅的老人。九年前她攥着你的胳膊说"你比我儿子还贴心"，九年后她安静地躺在那里，像是睡着了。你第一次真切地感受到：做这行，你陪伴的不只是老人的晚年，也是他们的终点。',
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
        log: '31岁，你站在张奶奶的葬礼上哭得像个孩子。九年的陪伴不是一句"节哀"能带过的。回家后你在日记里写："今天送走了第一个像亲人一样的老人。我不后悔照顾她，但我第一次知道，这份工作会让我一次次经历离别。"',
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
        log: '31岁，张奶奶的走让你开始读临终关怀的书。你学到"尊严死"的概念——让老人在生命的最后阶段不被过度抢救、不被插满管子、不被孤零零地丢在ICU。你开始跟家属谈"如果到了那一天"，虽然每次开口都很难。',
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
      '王奶奶六十七岁，确诊阿尔茨海默症三年了。她的女儿哭着找到你："我妈把我忘了，她昨天拿着菜刀说要给\u2018她女儿\u2019做饭，但她以为我是小偷。我一个人真的扛不住了。"\n' +
      '你接下了王奶奶。第一个月她每天问你"你是谁"，你每天回答"我是小X，来陪您的"。有时候她突然清醒，拉着女儿的手叫名字，然后下一秒又问"你是谁"。清醒与混沌交替，像一个在迷雾里时隐时现的人。\n' +
      '最让你心碎的是有天她忽然认出你，喊了一声"小X"，然后说"我好像……快要把自己弄丢了"。你强忍着没哭，给她削了一个苹果。她接过苹果，又忘了你是谁。',
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
        log: '33岁，你把失智症照护做成了你的招牌。你学了认知刺激疗法、怀旧疗法、音乐疗法，在服务站布置了"记忆走廊"——墙上贴满老照片和老物件，帮老人找回正在消散的记忆。家属们说"把你家当成了最后的希望"。',
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
        log: '33岁，你每个月办一次"失智症家属下午茶"，让那些独自扛着的儿女们坐在一起哭、一起笑、一起骂。有人说"终于有人懂我了"。你发现：养老不只是照顾老人，也是照顾那些照顾老人的人。',
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
      '你站在地图前，把整个县城划成了十二个网格。每个网格设一个服务小组，覆盖方圆两公里的居家老人。这是你第一次尝试"复制"——把一个服务站变成十二个。\n' +
      '但复制不是复印。新招的三十多个护理员良莠不齐，有人给老人喂饭不抬头、有人记不清药量、有人上班刷手机被家属投诉。你一天跑四个网格，嗓子喊哑了，晚上回到办公室看到投诉表，想把地图撕了。\n' +
      '秀兰说："你一个人盯十二个点，不现实。"你知道她说得对。但你不知道怎么放手——你怕一松手，那些老人就照顾不好了。护理这行的质量，太依赖"人"了。',
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
        log: '35岁，你建了一套质检体系：每月随机抽查20%的老人，每周电话回访家属，投诉三次直接换人。你从一个"亲自干"的人变成了"定标准、盯结果"的人。十二个网格终于稳住了，虽然你不亲手照顾老人了，但你知道她们被照顾得不错。',
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
        log: '35岁，你把扩张计划砍了一半，只做六个网格。别人笑你"小富即安"，你心想：我这行不是靠规模赢的，是靠每一个老人都被照顾好赢的。你每周还是会亲自上门，那些早期的老客户只认你。',
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
      '陈爷爷七十九岁，胰腺癌晚期，医生说最多三个月。他不愿意在医院躺着，想回家。但他回家后疼得整夜哼哼，女儿不忍心看，找到你。\n' +
      '你联系了县医院的安宁疗护团队，学会了疼痛评估和镇痛泵的家庭管理。你每天去两次，帮他调药、擦洗、翻身，陪他说话——虽然他大部分时候只是在哼。\n' +
      '走的那天清晨，他忽然清醒了，拉着你的手说"不疼了"，然后闭上了眼。他女儿趴在床边哭，你站在门口，眼泪也下来了。你想：人这一辈子最后的要求，其实不高——不疼，不脏，不孤单。',
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
        log: '37岁，你成立了"安宁照护"项目组，专门服务临终老人。你跟医院签了合作协议，培训了八名安宁疗护专员。你跟家属们说"我不能让他不死，但我能让他不疼、不脏、不害怕"。这句话后来被写进了你们公司的服务承诺里。',
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
        log: '37岁，你一个人扛着临终关怀的活。每个走掉的老人都在你心里留一道痕，你开始失眠，开始怕接电话。秀兰说"你这样下去要垮的"，你说"我没事"。但你知道你不太好。',
      },
    ],
  },

  // 40岁：护理品牌化
  {
    id: 'silver_care_brand',
    title: '一块牌子',
    sceneTag: 'community_care',
    pathId: 'silver_economy',
    branch: 'silver_caregiver',
    ageRange: [40, 40],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '十八年了。你从一间小门面、一块手写牌子，做到了覆盖半个县的专业护理品牌。你有了六十多个护理员、两百多个固定客户，墙上挂满了锦旗和感谢信。\n' +
      '民政局的人来考察时说"你们是全省做得最扎实的居家护理品牌"。电视台来采访你，记者问你"是什么让你坚持了十八年"，你想了很久，说："因为每一个老人都值得被好好对待。"\n' +
      '采访播出后，隔壁两个县的人也来找你。你站在新建的培训中心门口，看着新一批护理员在练习翻身操作，忽然想起22岁那个擦护理床擦到能照见人影的下午。那时候你什么都没有，只有一块手写的牌子和一颗不服气的心。',
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
        log: '40岁，你的护理品牌开始输出加盟。你给加盟商定了铁规矩：用你的手册、考你的证、接受你的质检。有人嫌你管太宽，你说"这块牌子是用十八年命换出来的，不能毁在别人手里"。',
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
        log: '40岁，你拒绝了所有加盟请求。你宁可慢，也不冒质量的风险。你把新赚的钱投进了护理员培训学校——你要从源头解决"缺人"的问题。你妈说"你这辈子就交代在这上面了"，你笑了笑，没反驳。',
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
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '你花了一个月的工资进了二十台跌倒检测手环，给二十个独居老人戴上。手环连着你的手机APP，老人一摔倒，你的手机就响。\n' +
      '第一个月手环响了六次，其中四次是误报——老人弯腰捡东西、拍被子、手环没戴紧。你被半夜叫醒四次，跑到老人家里发现人家睡得好好的。你开始怀疑这东西到底靠不靠谱。\n' +
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
        log: '26岁，你成了那家手环厂商的"最烦人的客户"——每周发一份误报分析报告，要求改算法。三个月后新固件上线，误报率降了70%。厂商老板说"你比我们的产品经理还懂老人"，你说"因为我是真的在用"。',
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
        log: '26岁，你给手环配了人工回访：每天上午给戴手环的老人打一个电话，确认平安。老人其实不太在乎手环，但每天那个电话让他们觉得"有人惦记着"。你发现技术是骨架，温度是血肉。',
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
      '街道办主任找到了你："省里在推智慧养老试点，需要一个落地单位。你做不做？"你心跳加速——这是政府背书的机会，也是把你的设备铺开的机会。\n' +
      '但试点意味着你要给一个社区的两百多位独居老人全装上设备，还要搭建数据后台、培训社区干部使用。街道办只给了三个月时间，补贴要等验收后才拨。\n' +
      '你算了一笔账：前期投入要十万上下，你的全部积蓄都得押进去，可能还要找朋友凑一点。如果验收不过，这些钱就打水漂了。你站在街道办门口抽了半包烟，最后掐灭烟头走了进去："我接。"',
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
        log: '28岁，你把身家押进了这个试点。三个月没睡过一个整觉，你带着团队挨家挨户装设备、教老人用、调后台，还找朋友借了钱周转。验收那天省里来了三辆车，领导看着大屏上跳动的实时数据说"这就是智慧养老的样子"。补贴到账那天你终于还清了借款，手里还多了一块金光闪闪的"省级示范"牌匾。',
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
        log: '28岁，你跟街道办谈妥只做五十户。规模小了点，投入也控制在三万块，但你把每一户都做成了"样板"。验收时领导看了三户就满意了，虽然补贴不多，但你没背债。你心想：步子小点没关系，别摔。',
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
      '你的智慧养老平台已经接入了三百多位老人，后台数据跑得很漂亮——心率、睡眠、跌倒、用药提醒，全在屏幕上。投资人说"这是真正的可规模化"。\n' +
      '但那天你收到了一封投诉信。写信的是孙奶奶的孙子，信里说："你们的系统每天准时提醒我奶奶吃药，但她跟我说，她最期待的不是那个提醒，而是以前那个会上门的小姑娘——她走了以后，奶奶再没人说话了。你们的数据很准，但我奶奶很孤独。"\n' +
      '你盯着那封信看了很久。你的系统能监测心率，但监测不到孤独；能报警跌倒，但抱不起一个摔倒的老人。你忽然问自己：你到底是在用技术照顾老人，还是在用技术替代照顾？',
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
        log: '30岁，你重新设计了服务模型：设备做"眼睛"，护理员做"手和心"。系统发现异常自动派单给最近的护理员上门，每个老人每周至少有一次面对面的探访。成本上去了，但孙奶奶的孙子再没投诉过。你明白了一件事：技术是放大器，但放大的是人的温度，不是替代它。',
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
        log: '30岁，你把人工探访改成了"可选增值服务"，基础套餐只卖设备+APP。客户数涨了，营收也涨了，但投诉也多了——老人不会用APP，子女嫌数据看不懂，有些独居老人十天半个月没跟活人说过话。你看着增长的KPI，心里不太踏实。',
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
      '你慌了。你的确在卧室装了跌倒检测摄像头（带红外），虽然承诺不开通实时画面、只做姿态识别，但家属不信任。更糟的是，你发现合作的一家保健品公司在偷偷问你的运营人员要老人健康数据做"精准营销"。\n' +
      '你坐在办公室里，面前摆着两份合同：一份是那家保健品公司开价二十万的数据合作，一份是你准备起草的隐私保护承诺书。你知道选哪一份。但选了承诺书，就意味着砍掉一笔不小的收入。',
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
        log: '32岁，你当着家属的面签了隐私保护承诺书：卧室只装姿态识别不存画面，数据加密存储不对外分享，家属随时可查可删。那家保健品公司被你拉黑了。少了二十万，但你换来了一句话——"你家靠谱，老人的事交给你放心"。',
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
        log: '32岁，你签了那份合同。脱敏数据、聚合统计，听起来冠冕堂皇。但你知道保健品公司拿到数据后会精准推销，那些老人会被电话骚扰。你在合同上签字时手有点抖，你告诉自己"行业都这样"，但那天晚上你失眠了。',
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
      '你做了一个决定：把你的系统开放成一个平台，让其他养老机构也能接入。你提供设备、后台、培训，他们提供线下服务，你抽成。\n' +
      '听起来很美——从"自己干"变成"赋能别人干"，这是所有平台梦寐以求的跃迁。但你低估了一件事：接入的机构质量参差不齐。有一家机构为了省钱，把跌倒检测手环换成了山寨货，结果一个老人摔了没报警，住了三天院才被发现。\n' +
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
        log: '34岁，你花了一个月制定了平台准入标准：设备必须用你指定的型号、护理员必须持证、后台数据必须实时同步。三个月内你踢掉了五家不达标的机构，有人骂你"独裁"，你说"拿老人的命做生意，我不敢不独裁"。',
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
        log: '34岁，你关掉了平台开放，回到直营。你少赚了平台抽成的钱，但你睡得着觉了。你告诉自己：养老这行，慢就是快，少就是多。你管不了全行业的老人，但你能管好你的那些。',
      },
    ],
  },

  // 36岁：与巨头正面竞争
  {
    id: 'silver_tech_giant_battle',
    title: '他们不要钱',
    sceneTag: 'community_care',
    pathId: 'silver_economy',
    branch: 'silver_tech',
    ageRange: [36, 36],
    priority: 7,
    weight: 9,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '一家互联网巨头宣布进军智慧养老，推出"免费送设备+免费APP"计划，铺天盖地的广告。你最大的三个社区客户在同一天通知你"我们换成巨头的了"。\n' +
      '你打开他们的产品看了一眼——界面比你漂亮十倍，功能比你多三倍，而且真的不要钱。你的运营总监说"我们拿什么跟免费打？"你沉默了很久。\n' +
      '但第二天你接到了一个电话，是之前被巨头接手的社区护理员打来的："他们的设备是免费，但出了事打客服永远排队，APP更新把老人药提醒给删了，老人三天没吃药没人管。你能不能……再回来？"',
    options: [
      {
        id: 'compete_on_service',
        label: '打"有人管"的牌，做巨头做不到的重服务',
        description: '免费的不值钱，值钱的是出了事有人管',
        hint: '管理+12 · 护理+10 · 政策+8 · 存款-30000 · 压力+15 · 信念+10 · 声誉+12',
        hintColor: 'danger',
        skillGains: { managementSkill: 12, careSkill: 10, policySkill: 8 },
        savingsChange: -30000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          adjustSilverReputation(s, 12);
          // 三个B端社区客户被抢走，约流失30%客户；靠服务赢回部分，净流失约15%
          const biz = getSilverBusiness(s);
          const lostClients = Math.round(biz.clients * 0.3);
          const recoveredClients = Math.round(lostClients * 0.5);
          adjustSilverClients(s, -lostClients + recoveredClients);
          // 营收先降后升，净下降约20%（重服务成本高）
          adjustSilverRevenue(s, -Math.round(biz.monthlyRevenue * 0.2));
        },
        log: '36岁，你把slogan改成了"设备免费不难，难的是出了事有人管"。你自掏腰包组建了快速响应团队，接巨头丢下的烂摊子——那些设备报了警没人响应的老人、APP不会用被遗忘的老人。半年后，三个社区又回来了，还带来了两个新的。你明白了一个道理：巨头卖的是设备，你卖的是"放心"。但这一仗打光了你不少积蓄。',
      },
      {
        id: 'pivot_to_b2b',
        label: '转型做to B，给机构卖系统而不是to C',
        description: 'C端打不过免费的，做B端系统供应商',
        hint: '管理+12 · 存款-30000 · 压力+10 · 信念+3 · 声誉+5',
        hintColor: 'neutral',
        skillGains: { managementSkill: 12 },
        savingsChange: -30000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
          adjustSilverReputation(s, 5);
          // 三个社区客户丢失，约流失30%客户；转型B端获得新客户但数量有限，净流失约20%
          const biz = getSilverBusiness(s);
          adjustSilverClients(s, -Math.round(biz.clients * 0.25));
          // B端客单价高但数量少，营收净下降约10%
          adjustSilverRevenue(s, -Math.round(biz.monthlyRevenue * 0.1));
        },
        log: '36岁，你不再跟巨头抢C端老人，而是把你的系统卖给了那些被巨头设备坑过的养老机构。转型花了不少钱做产品适配和商务拓展，但你成了"养老机构的IT部"。C端客户丢了不少，但B端利润上来了。你离老人远了——你开始怀念那些手把手教老人戴手环的日子。',
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
      '你在北上广深打了一个广告："你在外打拼，父母在家养老，我们做你和父母之间的那双眼睛。"这个广告精准击中了千万在外打工的子女的痛点。\n' +
      '你的远程监护系统让子女可以在手机上看到父母的健康数据、活动轨迹、用药记录。一个在深圳打工的女儿发来消息："我每天早上打开APP看我妈的心率，就像她还在我身边一样。谢谢你们。"\n' +
      '但你心里清楚，这双"眼睛"也有它的局限。有次系统显示一个老人整夜未动，你打电话过去没人接，派人上门发现老人只是在沙发上睡了一夜——没事。但另一次同样的数据，上门后发现老人已经走了。你坐在办公室里盯着屏幕上跳动的数字，分不清哪个是活着的心跳，哪个是沉默。',
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
        log: '38岁，你投了十五万开发了AI健康预警模型，能从心率变异性、睡眠质量、活动量的微小变化中预测心梗和中风风险。第一个月就提前预警了三例，两个老人被及时送医。那个深圳的女儿说"是你们让我妈多活了好几年"。',
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
        log: '38岁，你在系统里加了"人工巡查确认"环节：任何异常数据先由护理员上门核实，再决定是否通知家属。成本高了，但再没出过"整夜未动"的误判。你想：技术跑得快，但得有人跟在后面兜底。',
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
      '你的AI健康预警系统接入了八千多位老人的数据，每天处理上百万条生命体征。它比任何护理员都"勤奋"——24小时不眨眼，不会累，不会走神。\n' +
      '那天系统给一个老人标了红色预警：连续三天深睡眠时长下降40%、静息心率升高8次/分、凌晨三点有异常体动。护理员上门，老人说自己"就是最近睡不好"。但护理员坚持送医，查出早期心衰——如果再晚一个月，后果不堪设想。\n' +
      '你站在后台大屏前，看着那八千多个跳动的绿点，偶尔有一个变红。你想：你22岁回老家时什么都没有，现在你用一台服务器守护着八千个人的晚年。技术不冷，冷的是不用它的人。',
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
        log: '41岁，你把预警系统做成了开放平台，免费给中小养老机构用，只收技术服务费。有人说你傻"白送核心竞争力"，你说"八千个老人我护得住，八百万个我护不住，得让更多人一起护"。你从"做养老的"变成了"给养老行业造工具的"。',
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
        log: '41岁，你把系统做成了高端品牌，只服务付得起月费的中高端家庭。客户少了，但客单价高了，利润也好了。你知道那些付不起费用的老人怎么办，但你说服自己"我做不了所有人"。这句话你说了很多遍，但每次说都觉得少了点什么。',
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
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '你把社区门口一间废弃的棋牌室改成了日间照料中心。刷了墙，铺了防滑地胶，买了五张躺椅、两张麻将桌、一台血压计。门口挂了一块新牌子："社区老年日间照料中心"。\n' +
      '开业第一天来了三个老人，第二天五个，第三天八个。她们不是来"被照顾"的，她们是来找人说话的。张阿姨说"在家一个人对着电视发呆，来这好歹有人聊天"。王大爷说"我闺女在外地，知道我白天有地方去，她放心"。\n' +
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
        log: '26岁，你把日间照料中心做成了"老年幼儿园"：上午做手指操、唱歌，下午下棋、做手工，每周五办一次生日会。老人们每天早上准时来"报到"，比上班还积极。有人说"来这比在家等死强"，你听了心里一酸，但也知道她说的是真话。',
      },
      {
        id: 'focus_meals_service',
        label: '先把老年食堂做起来，解决吃饭问题',
        description: '很多独居老人最大的困难不是没人陪，是吃不上热饭',
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
        log: '26岁，你支起了一口大锅，开始给社区老人做午饭。三菜一汤，软烂少盐，一顿十块钱。第一周来了三十多人，有个奶奶吃了两口就哭了，说"我老伴走了以后，我再没吃过热乎饭"。你转身去厨房，偷偷抹了把眼。',
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
      '民政局的科长来调研，看了你的日间照料中心后说"不错，但规模太小了。省里有社区养老补贴，你们可以申报，一个中心补二十万，条件是面积达标、服务达标、台账齐全"。\n' +
      '你心跳加速。二十万能让你再开三个中心。但你翻了翻申报条件：面积不少于两百平、护理员不少于五人持证、每月服务老人不少于六十人、台账要细化到每日签到记录……你现在一条都不够。\n' +
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
        log: '28岁，你用了半年跑通了三方关系。你学会了在饭局上敬酒、在办公室门口等两个小时只为说五分钟的话、把台账做到连标点符号都挑不出毛病。补贴批下来那天你喝醉了，哭着说"为这二十万我把脸都丢光了"。但你第二天擦干眼泪，拿着钱开了第二家中心。',
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
        log: '28岁，你没去跑补贴。你把精力全花在把第一家中心做好上——口碑传出去后，社区主动来找你合作，免房租给你场地。你少拿了二十万补贴，但你保住了自己的底线。后来科长说"你这人，轴，但靠谱"。',
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
      '你的人手永远不够。你管着三个日间照料中心，一百多个老人，但护理员只有十几个。你跟社区的退休教师老刘聊天时，她随口说了一句"我们这些退休的也算劳动力啊，身体好的可以帮身体差的"。\n' +
      '这句话点醒了你。你设计了一个"低龄老人帮高龄老人"的志愿者互助项目：六七十岁的健康老人经过培训后，去照顾八九十岁的失能老人，每次服务换"时间币"，将来自己需要照顾时可以兑换回来。\n' +
      '第一期招了二十个志愿者，最大的七十三岁。你看着这些银发志愿者戴上红袖章去给更老的老人送饭、量血压、聊天，忽然觉得：养老不一定是"年轻人照顾老人"，也可以是"老人帮老人"。每个人都在变老，但变老不等于没用。',
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
        log: '30岁，你的"时间银行"上了省报。标题写的是"低龄老人当志愿者，时间币存进未来"。半年后全省有十几个社区来学习你的模式。你站在讲台上分享时，底下坐着一排白发苍苍的志愿者，他们冲你竖大拇指。你忽然觉得：这才是养老该有的样子——不是被照顾，是被需要。',
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
        log: '30岁，你跟隔壁师范大学签了合作协议，每周三下午大学生来中心陪老人做活动。老人们管那些大学生叫"孙子孙女"，大学生管老人叫"爷爷奶奶"。有个老人跟一个大四女生说"你长得像我孙女"，女生红了眼眶。你想：代际之间的温度，是任何专业服务都替代不了的。',
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
      '效果出乎意料。老人们每天下午趴在栏杆上看孩子们做操、画画、打闹，脸上有了活气。有个坐轮椅的爷爷教孩子们下棋，有个奶奶给小姑娘扎辫子。孩子们叫老人"爷爷""奶奶"，老人们笑得眼睛都没了缝。\n' +
      '一个妈妈跟你说"我儿子以前怕老人，现在天天吵着要来找爷爷下棋。他终于知道，老人不可怕，只是慢了一点"。你站在院子中间，看着白发和黑发混在一起，想起一句话："最好的养老，不是把老人隔离起来照顾，而是让他们还活在生活里。"',
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
        log: '32岁，你的"代际融合"项目被省里评为创新示范点。媒体来拍了一组照片：轮椅上的老人和蹦蹦跳跳的孩子在同一个院子里，阳光把两代人的影子叠在一起。那张照片后来挂在你办公室墙上，每次累到想放弃时你就看一眼——那才是你做养老的理由。',
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
        log: '32岁，你没去申报示范点。你怕一旦变成"样板"就要应付无穷无尽的检查和接待，老人们反而成了道具。你把那个院子守得小小的、暖暖的，只在社区内部口口相传。有人说你没出息，你觉得：出息不重要，那些老人和孩子脸上的笑是真的。',
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
      '你写了一封信，寄给了省民政厅。信里没有客套话，只有你十二年来的观察：社区养老补贴的申请门槛太高，小型机构够不着；护理员没有职业资格认定体系，好坏不分；独居老人的精神慰藉在政策里几乎是空白。\n' +
      '你以为这封信会石沉大海。但一个月后，民政厅的处长给你打了电话，说"你的信我们认真看了，有些意见很中肯。省里在起草新的社区养老条例，你愿不愿意来参加座谈会？"\n' +
      '你坐在省城的会议室里，对面是一排西装革履的官员和专家。你穿着你最好的衣服，手心全是汗。但你开口说的第一句话就让全桌安静了："在座的各位可能没有亲手给老人换过尿垫，我换过十二年。我来说说一线的真相。"',
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
        log: '34岁，你从一个小镇创业者变成了省里养老政策座谈会的常客。你提的"降低社区养老补贴门槛""建立护理员分级认证""将精神慰藉纳入服务标准"三条建议，有两条写进了新条例。你把那份条例复印了一份贴在办公室——那不是你的荣誉，是那些你照顾过的老人们给你的底气。',
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
        log: '34岁，你去了一次座谈会就回来了。处长打电话叫你再参加，你说"我得回去照顾老人了"。你知道政策很重要，但你更知道自己擅长什么。你把意见提了，剩下的交给该管的人。你回到社区，继续推轮椅、量血压、陪老人晒太阳。',
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
      '你的社区养老模式已经在三个镇跑通了，现在周边两个镇的镇长主动来找你，说"我们也想搞，你能不能来开？"\n' +
      '这是你第一次跨区域扩张。以前你在一个镇上，谁都认识你，老人叫你"小X"。现在要管五个镇，你分身乏术。你招了三个"站长"，每镇一个，把你的手册和制度复制过去。\n' +
      '但复制的不只是制度，还有"味道"。第一个新站开业那天你去视察，站长很努力但总差了点什么——老人们的笑不如老站的开心，志愿者没有老站那种自发的热情。你忽然明白：社区养老的灵魂不是流程，是人和人之间日积月累的信任。这个东西，没法速成。',
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
        log: '37岁，你定了一条规矩：新站开业第一年，你每月至少去待一周，亲自带站长融入社区。五个站花了三年才全部养"熟"。有人说你太慢，你说"社区养老不是开店，是种树——根扎不深，风一吹就倒"。',
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
        log: '37岁，你一口气开了五个新站。数量上去了，但质量参差不齐。有两个站因为站长不行、老人不满意，口碑反而下滑了。你开始疲于"救火"，从一个站跑到另一个站灭火。你想起自己说过"急不得"，苦笑了一下。',
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
      '十八年了。你的"社区嵌入式养老"模式被省里列为推广样板，民政厅出了一本手册叫《XX模式》，发到了全省每一个街道。你被请去给全省的社区干部做培训，台下的听众从镇长变成了市长。\n' +
      '但你心里清楚，"模式"这两个字轻飘飘的，真正重的是十八年里那些没法写进手册的东西——秀兰的手、张奶奶的笑、陈爷爷最后那句"不疼了"。手册能复制流程，复制不了人心。\n' +
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
        log: '40岁，你办了第一期"社区养老孵化营"，招了二十个想回老家做养老的年轻人。你把十八年的经验倾囊相授——从怎么跟街道办打交道到怎么给老人翻身。有个学员说"你是我们这代人的灯塔"，你说"别当灯塔，当火把——自己烧着，照亮一小片就行"。',
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
        log: '40岁，你的社区养老品牌开到了第十个镇。你注册了商标、统一了VI、做了小程序。投资人开始找你谈融资。你从"做养老的"变成了"做养老连锁的"。但你偶尔会想起当年那间废弃棋牌室——那时候什么都没有，但每个老人的名字你都记得。',
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
      '二十年了。你终于建成了一个真正的"养老社区"——不是养老院，是一个让老人可以继续"生活"而不是"被照顾"的地方。有花园、有菜地、有活动室、有食堂、有医务室，老人们住自己的小屋，白天在社区里活动，需要帮助时按一下铃就有人来。\n' +
      '开业那天你站在花园里，看着老人们下棋、种菜、跳广场舞。张奶奶的女儿带着孩子来看她，三代人在花园里拍了张合照。你想起了二十年前你推着第一个张奶奶的轮椅走在街上，她攥着你的胳膊说"你比我儿子还贴心"。\n' +
      '二十年，你从一块手写牌子变成了一个社区。你妈站在你旁边，看着花园里的老人们，忽然说了一句："当年我说你回来伺候人是没出息。现在我觉得，你做的这事，比考上公务员有出息多了。"你没说话，但眼眶热了。',
    options: [
      {
        id: 'continue_mission',
        label: '继续做下去，这不是终点是起点',
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
        log: '42岁，你没有停下。你开始计划把养老社区复制到更多的乡镇。你知道这一辈子可能做不完，但你想起那个年轻的社区干部问你"有什么建议"时你说的那八个字——"从一碗饭开始，别急"。你笑了笑，继续走。',
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
        log: '42岁，你把日常运营交给了你培养的站长们，自己只做战略和培训。你终于有了周末，第一次在周六的早晨睡到自然醒。你走到花园里，老人们冲你招手"小X来了"，你笑了——二十年了，他们还叫你"小X"。',
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
      '你爸中风了。左半边身子动不了，说话含含糊糊。\n' +
      '你站在医院的走廊里，手机还响着——服务站那边有三个老人等着你上门。你妈哭着说"你爸一直不肯去做体检，说没事，现在……"你看着病床上那个倔强的老头，忽然发现他老了。他头发全白了，脸上的皱纹像干裂的河床。\n' +
      '你忽然意识到一个残忍的事实：你照顾了七年别人的父母，现在轮到你照顾自己的父母了。你用专业的护理知识给别人翻身、喂药、做康复——现在这些技能要用在你爸身上了。你不知道该庆幸自己有这个本事，还是该哭。',
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
        log: '29岁，你每天下班后赶去医院给你爸做康复训练。你给他翻身、活动关节、练发音。一个月后他能含糊地叫你名字了，你眼泪差点掉下来。他忽然用能动的右手抓住你的手，说"儿……子，你选……的路……是对的"。这是你爸第一次认可你。',
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
        log: '29岁，你让秀兰每天去照顾你爸。她比你还有耐心，你爸脾气不好时她不恼，还逗他笑。你妈说"秀兰比亲闺女还亲"。你心里感激，但也有点愧疚——你照顾了那么多别人的父母，自己的爸却交给了别人。',
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
        log: '29岁，你白天跑五个服务点，晚上去医院陪夜。你瘦了十五斤，黑眼圈深得像两个洞。秀兰说"你再这样你也要躺医院了"，你说"我没事"。但有一天你在给老人翻身时眼前一黑，差点摔倒——你知道你不好了。',
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
      '你第一次被邀请参加全国养老行业发展大会，在省城的大酒店里。你穿着你最好的衣服走进会场，发现满眼都是西装革履的人，PPT上写满了"银发经济""万亿市场""蓝海赛道"。\n' +
      '一个投资人在台上说"养老是下一个房地产"。一个创业者说"我们用AI颠覆传统养老"。一个地产商说"康养地产是未来十年最大的红利"。你坐在角落里，觉得他们说的养老和你做的养老好像不是同一个东西。\n' +
      '茶歇时一个老教授认出了你——他看过你的社区养老报道。他拉着你的手说："满会场都在谈\u2018银发经济\u2019，但没几个人谈\u2018银发的人\u2019。你是少数在谈人的。"你愣了一下，忽然觉得自己没那么孤单了。',
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
        log: '33岁，你站起来说："你们谈的银发经济，是万亿市场、是蓝海赛道。但我看到的银发经济，是一个老人摔倒后没人扶、是一个失智老人忘了自己女儿的名字、是一个护理员月薪三千块干着最脏最累的活。如果这个行业连这些都解决不了，万亿市场就是个笑话。"全场安静了五秒，然后掌声响起。',
      },
      {
        id: 'network_investors',
        label: '低调混圈子，积累人脉和资源',
        description: '会上的关系可能比真话更值钱',
        hint: '政策+10 · 管理+8 · 压力+3 · 信念+3 · 声誉+5 · 客户+2 · 月营收+2000',
        hintColor: 'neutral',
        skillGains: { policySkill: 10, managementSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
          adjustSilverReputation(s, 5);
          adjustSilverClients(s, 2);
          adjustSilverRevenue(s, 2000);
        },
        log: '33岁，你在茶歇时加了三十个微信——投资人、地产商、政府官员。你学会了说场面话，学会了"合作共赢"。回程的火车上你翻着那些名片，心想：这些人能帮你把事业做大，但他们不会理解你为什么做这件事。你把手机收起来，看着窗外发呆。',
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
      '镇上开了一家新的养老服务机构，老板叫老李，以前是做建材的，看养老赚钱就转行了。他的价格比你低30%，还打广告说"五星级服务，白菜价格"。\n' +
      '你的客户走了十几个。有家属跟你说"老李那边便宜，我们先去试试"。你嘴上说"理解"，心里不是滋味。你知道老李那边用的护理员都是临时招的，没培训过，但家属只看价格。\n' +
      '三个月后，那些走的客户陆续回来了。有人跟你说"老李那边是便宜，但护理员三天两头换，老人认生；有次老人发烧没人发现，烧了两天才送医"。你没有幸灾乐祸，只是默默把老人重新接回来。你知道：价格能抢走客户，但质量才能留住人心。',
    options: [
      {
        id: 'compete_on_quality',
        label: '不打价格战，用质量和服务说话',
        description: '低价抢市场是死路，养老不是卖白菜',
        hint: '管理+10 · 护理+8 · 存款-10000 · 压力+10 · 信念+8 · 声誉+10',
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
        },
        log: '35岁，你没降价。你把精力花在提升服务质量上——增加上门回访、建立家属微信群每日汇报、给每个老人建健康档案。这半年你自掏腰包加服务，收入掉了一截。但口碑回来了，回来的客户还带了新客户。老李的店撑了一年关了——低价换来的客户留不住，劣质服务出了事谁也担不起。你叹了口气：又多了一批被伤害过的老人。',
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
        log: '35岁，你主动去找了老李。他以为你来叫板，没想到你递过去一本护理手册说"用这个，能少出事"。老李愣了半天，问"你不怕我抢你生意？"你说"养老的生意大着呢，我一个人做不完。但老人出事，是所有人的事"。你花了些精力帮他培训人员，虽然还是丢了一些客户，但后来老李成了你的合作伙伴——他接中低端客户，你做专业照护，互不抢生意。',
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
      '省台的记者来了，说要给你拍一个专题片。摄像机架在你的服务站里，记者举着话筒问你："是什么让你坚持了十六年？"\n' +
      '你对着镜头说了很多——老龄化趋势、社区养老的价值、护理专业化的重要性。记者频频点头。但你心里知道，镜头前的你和真实的你之间隔着一段距离。真实的你凌晨三点给老人换尿垫、蹲在葬礼上哭、被家属指着鼻子骂"你们怎么照顾的"。\n' +
      '专题片播出后，你"火"了。微信里涌入几百条消息，有人要合作、有人要投资、有人要入职。但也有以前的同学发来消息："你现在是名人了啊，还记得我们吗？"你不知道怎么回。你最怕的不是被看见，而是被看见之后，再也回不到那个安安静静推轮椅的下午了。',
    options: [
      {
        id: 'use_platform_for_good',
        label: '借势发声，为整个行业争取关注',
        description: '既然被看见了，就让更多人看到养老的真问题',
        hint: '政策+12 · 管理+8 · 压力+8 · 信念+10 · 声誉+12 · 客户+8 · 月营收+3000',
        hintColor: 'positive',
        skillGains: { policySkill: 12, managementSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          adjustSilverReputation(s, 12);
          adjustSilverClients(s, 8);
          adjustSilverRevenue(s, 3000);
        },
        log: '38岁，你开始接受更多采访，但每次都不说"我多伟大"，而是说"护理员工资太低了""失智老人家庭需要更多支持""农村养老是被遗忘的角落"。你的声音被更多人听到了，省里的领导开始关注你提的问题。你知道聚光灯不会永远亮，但趁亮的时候，能照亮多少是多少。',
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
        log: '38岁，你拒绝了第二批采访请求。记者不理解，你说"上电视改变不了老人吃药的问题，我得回去干活了"。你回到服务站，秀兰说你"傻，出名了不好吗"，你笑了笑。你知道你要的不是出名，是每一个老人都被好好对待。',
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
      '一纸法院传票送到你手上。你照顾了两年的一位老人——孙爷爷，在睡梦中走了。他的儿子把你告了，理由是"你的护理员当晚没有按规定每两小时巡一次房，导致老人未能得到及时救治"。\n' +
      '你调了当晚的记录，护理员确实在凌晨两点到四点之间少巡了一次——因为同时要照顾另一位突发高烧的老人。你没有辩解的余地，记录上白纸黑字。孙爷爷的儿子在法庭上说"我爸交了钱，你们就该负责到底"，你站在被告席上，浑身发冷。\n' +
      '你忽然意识到：你做的这件事，一不小心就是人命关天的责任。你拼了命照顾老人，但你管不了所有护理员的每一分钟。一个疏忽，就是你和家属之间的一道天堑。',
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
        log: '31岁，你赔了三万块和解。然后你花了两个月重写了巡房制度：电子巡更打卡、双人值班、异常自动报警。你跟所有护理员说"以后再出这种事，不是扣钱，是走人"。你知道这话很重，但人命比饭碗重。',
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
        log: '31岁，你请了律师上法庭。律师用你两年的护理记录证明你已尽到合理注意义务，孙爷爷的死是自然衰老而非护理过失。法院判你承担次要责任，赔了一万五。赢了但赢得狼狈——镇上的人议论纷纷，有人说"做养老的出事了"。你那段时间不敢去服务站，怕看到老人家属异样的眼光。',
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
        log: '31岁，你给所有客户都上了护理责任险，保费你出一半家属出一半。有人说"你这是推卸责任"，你说"我是给老人和你们一个兜底"。后来又出过两次意外，有了保险，家属的情绪缓和了很多。你想：做这行不能只靠良心，还得靠制度兜底。',
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
      '一家估值百亿的互联网公司宣布"进军养老"，模式是"设备免费+服务免费+APP免费"，靠卖老人健康数据和精准广告赚钱。铺天盖地的广告，社区里到处是他们的地推人员，免费鸡蛋、免费体检、免费旅游——老人们被一车一车拉去"推介会"。\n' +
      '你的客户一夜之间走了大半。有家属直接说"人家不要钱，你凭什么收？"你算了一笔账：如果客户继续流失，三个月后你的现金流就断了。你坐在空了一半的服务站里，看着墙上那些锦旗，第一次真真切切地感到恐惧——你不是在跟另一家养老院竞争，你是在跟百亿资本打一场不对称的战争。\n' +
      '你打开他们的APP看了一眼——界面很漂亮，功能很全，但客服是机器人的，紧急呼叫要排队，健康数据直接卖给保险公司和保健品商。你知道他们的"免费"是有代价的，但老人不知道，家属也不知道。你怎么跟"免费"竞争？',
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
        log: '34岁，你没有降价，反而涨价了——涨在了"人工上门"上。你打出"7×24小时真人响应"的招牌，跟巨头的"机器人客服"对着干。你自掏腰包加了三个月的夜班补贴，让护理员随叫随到。这一仗打光了你大半积蓄，但半年后，第一批用免费设备的老人开始出事——跌倒没人管、药吃错没人知。家属们又回来了，说"免费的才是最贵的"。你活下来了，但你知道巨头不会走，这只是第一回合。',
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
        log: '34岁，你花了三个月跑民政局、递报告、联合同行上书，详述巨头免费模式背后出卖老人健康数据的隐患。跑关系花了不少钱，但一个月后省里出了个"养老数据保护指引"，巨头被迫调整模式。你松了一口气，但客户已经流失了三成。你心里清楚：政策是挡箭牌，不是护城河。你得趁这个窗口期把自己的服务做到别人抢不走。',
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
        log: '34岁，你跟巨头谈了收购。他们开价十二万买你的团队和客户资源——这比你当初预想的少了很多，因为客户已经在流失，你的牌越来越少。你拿着那份协议看了一整夜，最后签了字。你的服务站换了巨头的logo，你的护理员穿上了巨头的工服。钱到手了，但你觉得自己的什么东西丢了。秀兰问你"以后我们还按以前的标准干吗？"你说"当然"。但你知道，说了不算了。',
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
      '你合作了三年的供应商——那个给你供护理耗材、医疗器械、食堂食材的老板——跑路了。\n' +
      '你上个月刚打了二十万的货款过去，约定这个月送货。电话打不通，微信拉黑，你跑到他的仓库一看——门锁换了，里面空了。门口还聚集了七八个跟你一样来要货要钱的小老板，一打听才知道，他欠了高利贷，把所有人的预付款卷走了。\n' +
      '你坐在仓库门口的台阶上，脑子一片空白。那二十万里有你刚收的下个季度的预付费、有员工工资预备金、有准备给老人换冬季被褥的钱。你不仅要重新找供应商花高价紧急补货，还面临老人物资断供的风险——胃管、尿管、消毒用品，这些东西断一天就是人命关天的事。\n' +
      '秀兰打电话来问"这个月工资还能发吗"，你握着手机说"能"，但你不确定。你第一次意识到：在这条产业链上，你也是弱者。',
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
        log: '37岁，你到处借钱，以1.5倍的价格从别的供应商那里紧急调货。胃管、尿管、消毒水、老人的冬季被褥——你咬着牙把钱付了，老人那边一天都没断供。但你自己背了一身债，存款蒸发了三成，员工的年终奖也没了。有人说你傻，说"你完全可以让老人等几天"，但你说"等不了，有些老人等一天就没了"。',
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
        log: '37岁，你报了警，联合了七八个受害者一起请律师起诉。律师费花了两万，官司打了半年。期间你东拼西凑勉强维持着物资供应，但还是有几个老人因为换了便宜替代品而出了小问题，家属颇有微词。最终那个人被抓了，但钱已经被他挥霍得差不多了，你只追回了一小部分。你明白了一个道理：在小地方做生意，选错一个合作方，就能让你赔掉好几年的积蓄。',
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
        log: '37岁，你不得不关掉了两个最远的服务点，停掉了上门送餐服务，把所有资源集中在核心站点保命。二十万货款打了水漂，你看着被裁掉的护理员红着眼圈收拾东西，心里像被刀割。但你知道不断臂就活不下去。半年后你的现金流稳了，但你只剩了半壁江山。你站在缩小了一半的服务区里，告诉自己：活下来，就还有机会。',
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
      '你看着文件，手在抖。你有消防证，但食品证过期了没来得及续；你的医务室有护士但没有执业许可，因为你觉得配个全职医生太贵了。三个月内补齐三证，意味着你要花至少十万块改造、招人、走审批。\n' +
      '更让你窒息的是，文件里还有一条"从业人员须持养老护理员职业资格证"。你的十五个护理员里只有三个有证——其他十二个都是四五十岁的下岗女工，让她们去考试比登天还难。一刀切下来，你的半个团队可能要被砍掉。',
    options: [
      {
        id: 'comply_full',
        label: '全力合规，该花的钱花该裁的人裁',
        description: '合规是底线，不合规连牌都保不住',
        hint: '管理+12 · 政策+12 · 存款-50000 · 压力+18 · 健康-3 · 信念+5 · 声誉+5',
        hintColor: 'danger',
        skillGains: { managementSkill: 12, policySkill: 12 },
        savingsChange: -50000,
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
        log: '39岁，你花了三个月和十万块把三证补齐了。消防改造、食品证续期、医务室请兼职医生挂证——每一项都是钱。那十二个没证的护理员你花钱请人来培训考证，八个过了，四个没过。没过的四个你降薪留用做保洁和送餐，但还是走了两个。整改期间服务质量打了折扣，丢了一成半的客户，但牌照保住了。秀兰说"你心太软"，你说"她们也有家要养"。',
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
        log: '39岁，你联合了全县十二家养老机构写联名信递给省人大，花了不少钱跑关系、找律师、请专家论证。信里说"我们支持监管，但请给过渡期，不要一刀切"。两周后省里出了补充文件：给一年过渡期，允许"先上岗后考证"。过渡期内仍有一成客户被拿到新牌照的大机构抢走，但你保住了团队，保住了大部分老人。你松了一口气，知道这只是缓刑，该补的课一天都不能拖。',
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
        log: '39岁，你关掉了两个达不到新标准的站点。那些站点的老人被迫转介到其他机构，有家属骂你"说好的照顾一辈子呢"。裁掉了八个护理员，关店的损失让你心疼得睡不着觉。你站在关掉的站点门口，看着工人拆招牌，心里像被剜了一块。三成客户没了，三成五月营收没了，但主力站点保住了，牌照保住了。你知道这是对的，但"对"的事有时候也很疼。',
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
];

// ============================================================
// 银发收割者路径 - 叙事成就触发系统
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
    narrative: `你拿到了高级养老护理员职业资格证书。从"凭良心干"到"凭专业干"，你用了四年。\n\n证书发下来那天你摩挲了很久。你想起了22岁那个连胃管都不会推、手抖得像筛糠的自己。现在你能闭着眼睛完成鼻饲操作、能一眼分辨压疮的分期、能在三分钟内完成心肺复苏。你不再只是一个"伺候人的人"，你是一个专业护理师。秀兰说"你变了"，你说"不是我变了，是我终于配得上这份工了"。`,
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
    narrative: `你的护理品牌覆盖了三座城市，服务超过两千位老人。但你每周还是会抽一天时间亲自去照顾老人——你提醒自己不要忘了为什么出发。\n\n那天你照常去给一位九十二岁的奶奶翻身。她拉着你的手说"你是谁啊"，你说"我是小X"。她笑了，说"小X啊，我记不住人了，但我记得你的手——你的手是暖的"。\n\n你走出她家，站在走廊里红了眼眶。二十年了，从一块手写牌子到三座城市，你一直在用同一双手推轮椅、换尿垫、握住那些枯瘦的手。你想：你赌的不是老龄化趋势，不是银发经济，你赌的是——每个人老了以后，都值得有一双温暖的手。你赢了。`,
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
    narrative: `你的智慧养老系统接入了第一个完整社区——三百位独居老人全部佩戴了你的设备，后台数据跑通了。\n\n你坐在服务站里盯着大屏，看着那三百个绿点此起彼伏地闪烁，像一个城市的心跳。每一个绿点背后都是一个活生生的人——有人在下棋，有人在睡觉，有人在散步。你知道这些绿点偶尔会变红，而每一次变红都可能是一条命。你第一次感到技术的重量：它不只是代码和传感器，它是三百个家庭的"放心"。`,
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
    narrative: `你的平台接入了五家养老机构，覆盖超过两千位老人。你的AI预警系统提前发现了十七例健康风险，其中三例是心梗前期。\n\n投资人说"你们是养老行业的SaaS"。你不太懂SaaS，但你知道那十七个被提前发现的老人，有三个因为及时送医而活了下来。你把那三个老人的名字写在一张便签纸上，贴在电脑旁边。每次有人问你"你的产品价值是什么"，你就指着那张便签——价值不是估值，是那三个还活着的人。`,
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
    narrative: `你的AI健康预警系统成了全省养老行业的基础设施——八千多位老人的数据在你的服务器上跳动，每个月提前预警上百例健康风险。\n\n省领导来视察时指着大屏说"这就是智慧养老的样子"。你站在旁边没说话，因为你在想那个凌晨两点变红的绿点——赵爷爷摔在卫生间地上，手环亮了，你冲过去，救回了一条命。那是你的第一个"绿点变红"，也是你相信技术能救人的起点。\n\n现在你有八千多个绿点了。你每天早上打开后台，看着它们整整齐齐地闪烁，像一片由心跳组成的星海。你想：你22岁回老家时什么都没有，现在你用一台服务器守护着八千个人的晚年。技术不冷，冷的是不用它的人。`,
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
    narrative: `你的第一家日间照料中心稳定运营了一年，每月服务老人超过六十人，老年食堂成了社区最热闹的地方。\n\n民政局的科长来验收时翻了翻你的签到本，六十多个名字整整齐齐。他说"你这模式可以复制"。你笑了——你不是在做"模式"，你是在给那些白天没处去的老人一个"家"。但你也知道，如果能让更多老人有这个"家"，"模式"这个词也不是坏事。`,
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
    narrative: `你的养老社区开业了。不是养老院——是一个让老人可以继续"生活"的地方。有花园、有菜地、有活动室、有食堂、有医务室。老人们住自己的小屋，白天在社区里活动，需要帮助时按一下铃就有人来。\n\n开业那天你站在花园里，看着老人们下棋、种菜、跳广场舞。你妈站在你旁边说"当年我说你回来伺候人是没出息，现在我觉得你做的这事比考上公务员有出息多了"。\n\n你没说话，但眼眶热了。二十年了，从一块手写牌子到一个社区，你赌的不是"银发经济"——你赌的是：每个人都会老，而每个人都值得在老去的时候，还有一个像"家"的地方。你做到了。你想：也许有一天你自己也会住进这样的社区，被你培养的年轻人照顾着，安心地变老。这就是你留给自己的，也是留给所有人的答案。`,
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
// 汇总：银发收割者全部成就（按 分支 → 等级 排序）
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
