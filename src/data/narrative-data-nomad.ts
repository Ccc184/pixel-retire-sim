/**
 * 数字游牧民路径 · 完整叙事事件库
 *
 * 三条分支：
 *   nomad_freelancer    — 自由职业线，远程接单，技能变现，客户多元化
 *   nomad_entrepreneur  — 海外创业线，打造地点无关的产品化服务，远程团队
 *   nomad_consultant    — 跨境咨询线，知识套利，文化桥梁，高客单价咨询
 *
 * 三个技能维度：
 *   remoteSkill        远程协作能力（异步沟通、自我管理、数字工具）
 *   languageSkill      语言能力（英语流利度、当地语言、跨文化沟通）
 *   crossCulturalSkill 跨文化能力（文化适应、谈判、全球人脉）
 *
 * ================================================================
 * 效果应用约定：
 *   skillGains / savingsChange / salaryChange / passiveIncomeChange
 *   为声明式字段，由 store 统一应用到 state（pathSkills / currentSavings 等）。
 *   stateEffect 仅负责 stress / happiness / health / pathFaith 以及
 *   条件分支逻辑和自定义字段的初始化，不重复修改上述声明式字段，
 *   以避免双重计算。
 * ================================================================
 */
import type { NarrativeEvent, NarrativeAchievement, GameState } from '../types/global.d.js';
import { registerNarrativeEvents } from './narrative-registry.js';
import { registerAchievements } from './narrative-achievements.js';

// ============================================================
// 辅助函数
// ============================================================

/** 确保 pathSkills 已初始化 */
function ensureSkills(state: GameState): void {
  if (!state.pathSkills) {
    (state as any).pathSkills = {};
  }
}

/** 数值钳制 */
function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// ============================================================
// 通用事件（ages 22-24，分支选择前）
// ============================================================

const commonEvents: NarrativeEvent[] = [

  // 22岁：第一份远程合同（副业起步）
  {
    id: 'nomad_first_remote_gig',
    title: '第一单',
    sceneTag: 'home',
    pathId: 'digital_nomad',
    ageRange: [22, 22],
    priority: 7,
    weight: 10,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '你在Upwork上投了六十多份提案，终于有一个客户回复了。视频面试那天你穿了最体面的衬衫，背景是出租屋贴满海报的墙。客户是个硅谷的小创业公司，要你做一个网站，时薪25美元。\n' +
      '面试结束，对方说"You\'re hired"。你挂掉电话，在屋里转了三圈，然后算了一笔账：25美元一小时，一天8小时就是200美元，一个月就是4000美元，换算成人民币将近三万——而你白天在公司加班到秃头一个月才八千。\n' +
      '你没辞职。你知道现在还不是时候——你只有这一个客户，没有缓冲金，没有长期合同。但你心里清楚：这25美元一小时的东西，就是你未来的入场券。问题是，白天上班已经够累了，你该怎么分配剩下的时间？',
    options: [
      {
        id: 'night_owl',
        label: '熬夜接单，白天上班晚上干活',
        description: '硬扛时差，用下班时间接海外单，赚美元存人民币',
        hint: '远程能力+10 · 语言+4 · 存款+8000 · 信念+5 · 压力+10 · 健康-3',
        hintColor: 'positive',
        skillGains: { remoteSkill: 10, languageSkill: 4 },
        savingsChange: 8000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '22岁，你开始了双线作战。白天在公司写代码，晚上回家打开Upwork接海外单。你的生物钟被劈成两半：白天用中文开会，晚上用英文谈需求。凌晨三点对着英文文档查单词的时候，你偶尔会想：这种日子能撑多久？但每次看到美元到账的数字，你又觉得值了。',
      },
      {
        id: 'weekend_warrior',
        label: '周末集中接单，工作日养精蓄锐',
        description: '不熬夜，把周末全部投入远程工作，稳扎稳打',
        hint: '远程能力+7 · 跨文化+3 · 存款+5000 · 信念+3 · 压力+5',
        hintColor: 'neutral',
        skillGains: { remoteSkill: 7, crossCulturalSkill: 3 },
        savingsChange: 5000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '22岁，你没选择熬夜——你知道身体是革命的本钱。你把周六周日全部留给远程工作，工作日认真上班养精蓄锐。同事约你周末出去玩，你说"有事"。他们不知道你的"事"是在给硅谷的小公司做网站，赚他们一个月的工资。进度慢了点，但你活得久。',
      },
      {
        id: 'find_community',
        label: '先混进游民社群，找人带路',
        description: '加入Facebook和Telegram的数字游民群，请教老鸟怎么起步',
        hint: '远程能力+5 · 跨文化+8 · 语言+5 · 信念+4 · 幸福+3',
        hintColor: 'neutral',
        skillGains: { remoteSkill: 5, crossCulturalSkill: 8, languageSkill: 5 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
        },
        log: '22岁，你在游民群里问了一句"新人怎么开始接海外单"，收到了几十条回复。有人发来了整份"Upwork接单攻略"，有人分享了自己第一个客户的故事，有人约你以后面基喝杯咖啡聊聊经验。你第一次发现：游民圈子比你想的更抱团——因为每个人都知道"从零开始"是什么滋味。',
      },
    ],
  },

  // 23岁：副业与主业的冲突（副业阶段）
  {
    id: 'nomad_arrive_new_country',
    title: '两个世界',
    sceneTag: 'office',
    pathId: 'digital_nomad',
    ageRange: [23, 23],
    priority: 6,
    weight: 9,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '你已经连续三个月白天上班、晚上接海外单了。你的Upwork评分从零涨到了五星，客户从一家变成了三家。但代价是：你瘦了八斤，黑眼圈重得遮瑕都盖不住，上班时组长叫你名字你要愣两秒才反应过来。\n' +
      '上周你在公司开会时睡着了，被组长叫到走廊训了一顿。你没敢说原因——总不能告诉他你在给硅谷的公司做网站，赚的比他多。但你知道这样下去不是办法：主业和副业在抢你的命，你必须做出取舍。\n' +
      '你打开Upwork看了一眼——又有一个新客户发来消息，问你能不能接一个长期项目。你盯着那条消息，心里在算账：接了，副业收入正式超过主业；不接，你就能多睡两个小时。',
    options: [
      {
        id: 'take_more_clients',
        label: '接下长期项目，副业正式超过主业',
        description: '再累也要接，副业收入超过主业的那一刻就是你未来的起点',
        hint: '远程能力+12 · 语言+4 · 存款+12000 · 信念+8 · 压力+12 · 健康-5',
        hintColor: 'positive',
        skillGains: { remoteSkill: 12, languageSkill: 4 },
        savingsChange: 12000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '23岁，你接下了那个长期项目。从此你的生活变成了：早上9点打卡上班，下午6点下班，7点回家打开电脑开始给海外客户干活，凌晨2点睡觉。你妈打电话问你"最近怎么样"，你说"挺好的"——你不敢说你好几个月没在凌晨前睡过了。但月底你看了一眼副业收入：28000，已经超过主业了。你攥着手机，觉得这些失眠都值了。',
      },
      {
        id: 'pace_yourself',
        label: '稳住节奏，不接新单先保身体',
        description: '健康比钱重要，等现有项目稳定了再说',
        hint: '远程能力+6 · 存款+5000 · 信念+3 · 压力-5 · 健康+5',
        hintColor: 'neutral',
        skillGains: { remoteSkill: 6 },
        savingsChange: 5000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 5, 0, 100);
          s.health = clamp(s.health + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '23岁，你忍住了接新单的冲动。你把现有的三个客户维护好，不再熬夜，改用早起赶工——早上5点起床干两小时再上班。同事问你"怎么最近精神好了"，你笑了笑没回答。你知道慢一点没关系，关键是能走得远。',
      },
      {
        id: 'negotiate_flex_work',
        label: '跟公司谈弹性工作制，争取更多副业时间',
        description: '申请每周两天远程办公，用省下的通勤时间接单',
        hint: '远程能力+8 · 跨文化+5 · 信念+6 · 压力-3 · 月薪+500',
        hintColor: 'positive',
        skillGains: { remoteSkill: 8, crossCulturalSkill: 5 },
        salaryChange: 500,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '23岁，你鼓起勇气找组长谈了弹性工作制。你说"我家离公司远，每周想远程两天"。组长犹豫了一下同意了——因为你的绩效一直不错。从此每周有两天你在家办公，省下的三小时通勤全部用来接海外单。你发现"争取自由"不是一次性的壮举，而是一寸一寸往前挪的过程。',
      },
    ],
  },

  // 23-24岁：文化冲击与语言困境
  {
    id: 'nomad_culture_shock',
    title: '另一套规则',
    sceneTag: 'overseas_street',
    pathId: 'digital_nomad',
    ageRange: [23, 24],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    conditions: (s: GameState) => s.isAllInPath === true && s.isGeoArbitrage === true,
    narrative:
      '你以为英语够用就够了，直到你在泰国移民局排队办签证，工作人员连珠炮一样说泰语，你全程听不懂，只能陪着笑递材料。办完出来你才发现：他给你的不是你申请的那种签证，但你想回去理论，又开不了口。\n' +
      '类似的挫败每天都在发生。房东用Line发了一堆泰语语音，你只能截图丢进翻译软件；菜市场的大妈把你说成"日本人"，你纠正了三次她还是这么叫；你想跟本地朋友开个玩笑，但幽默在翻译之后就死了。\n' +
      '你开始理解一件事：语言不只是工具，它是一张入场券。没有它，你永远是这个国家的"客人"，而不是"参与者"。',
    options: [
      {
        id: 'learn_local_language',
        label: '死磕当地语言，哪怕只会日常对话',
        description: '每天学一小时泰语，去菜市场练口语',
        hint: '语言+12 · 跨文化+8 · 幸福+5 · 压力+5 · 信念+4',
        hintColor: 'positive',
        skillGains: { languageSkill: 12, crossCulturalSkill: 8 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '24岁，你能用泰语点菜、砍价、跟突突车司机吵架了。菜市场的大妈终于不再叫你"日本人"，而是叫你的泰语小名。你第一次觉得自己"属于"这条街——哪怕只是一点点。',
      },
      {
        id: 'polish_english',
        label: '把英语磨到接近母语水平',
        description: '反正英语是全球通用语，把这一门练到极致更划算',
        hint: '语言+12 · 远程能力+5 · 月薪+1500 · 压力+3',
        hintColor: 'positive',
        skillGains: { languageSkill: 12, remoteSkill: 5 },
        salaryChange: 1500,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 3, 0, 100);
        },
        log: '24岁，你的英语从"磕巴但能沟通"变成了"流利且有感染力"。客户那边开会你终于不用提前写逐字稿了。你发现：在游民圈，英语水平直接等于时薪天花板。',
      },
      {
        id: 'embrace_isolation',
        label: '接受"永远是外人"的身份',
        description: '不强求融入，享受旁观者的视角',
        hint: '跨文化+6 · 幸福+3 · 信念+2 · 但社交圈受限',
        hintColor: 'neutral',
        skillGains: { crossCulturalSkill: 6 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 2, 0, 100);
        },
        log: '24岁，你不再执着于"融入"。你用英语工作，用翻译软件生活，用旁观者的眼光看这个世界。你发现自己反而看得更清楚——因为你始终站在文化之外，没有被任何一种规则驯化。',
      },
    ],
  },

  // 24岁：孤独与自由的辩证
  {
    id: 'nomad_loneliness_vs_freedom',
    title: '自由的重量',
    sceneTag: 'home',
    pathId: 'digital_nomad',
    ageRange: [24, 24],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '凌晨两点，海外客户那边的会议终于结束。你关掉Zoom，屋里安静得能听见冰箱的嗡嗡声。窗外是国内城市的夜，远处偶尔有出租车的喇叭声。\n' +
      '你刷开朋友圈：大学室友在晒刚领的结婚证，高中同学在晒刚买的房，连那个最不争气的表弟都晒了孩子的满月照。他们的生活像一条笔直的线——稳定、可预期、被理解。而你的生活像一团毛线——白天打卡上班，深夜给地球另一边的客户写代码，赚着美元却没时间花。没有人看得懂你在干嘛。\n' +
      '你突然很想找人说句话，但翻遍通讯录，发现没有一个人醒着——你在这个时区，你的客户在另一个。你第一次认真想了想"自由"这个词：它不是免费的，它的标价是孤独。你付得起吗？',
    options: [
      {
        id: 'find_nomad_tribe',
        label: '主动建立游民社交圈，对抗孤独',
        description: '每周组织一次游民聚餐，把"漂着的人"聚到一起',
        hint: '跨文化+8 · 语言+5 · 幸福+10 · 压力-5 · 存款-2000',
        hintColor: 'positive',
        skillGains: { crossCulturalSkill: 8, languageSkill: 5 },
        savingsChange: -2000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '24岁，你在网上找到了一群同样在接海外单的"准游民"，组建了一个"深夜接单党"群，每周三在一家常去的咖啡馆聚一次。来的人换了一茬又一茬，但总有人在。你发现这种孤独不是无解的——只要你愿意先伸出手，永远有另一只手会握住你。',
      },
      {
        id: 'double_down_work',
        label: '用工作填满孤独的缝隙',
        description: '既然没人陪，就多接点活，用收入麻痹自己',
        hint: '远程能力+10 · 月薪+2000 · 压力+10 · 幸福-5 · 健康-3',
        hintColor: 'danger',
        skillGains: { remoteSkill: 10 },
        salaryChange: 2000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.happiness = clamp(s.happiness - 5, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
        },
        log: '24岁，你把孤独变成了工时。凌晨接单，清晨交活，日历上没有一天是空的。月底看着到账的美元你笑了一下，但关掉手机后那间屋子又空了。你用收入买到了安全感，但买不到一个可以一起吃晚饭的人。',
      },
      {
        id: 'call_home',
        label: '给家里打个电话，哪怕被唠叨',
        description: '听听妈妈的声音，哪怕她又会问"什么时候回来"',
        hint: '幸福+8 · 信念-2 · 压力-3 · 但加剧思乡',
        hintColor: 'neutral',
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 2, 0, 100);
        },
        log: '24岁，你拨通了家里的电话。妈妈照例问"什么时候回来"，你照例说"快了"。挂掉电话你哭了一场，不是因为难过，是因为你第一次意识到：你说"快了"的时候，自己都不信。但你还是想接着走——因为你害怕的是"回来"，而不是"回不去"。',
      },
    ],
  },
];

// ============================================================
// 分支选择事件（age 25）
// ============================================================

const branchSelectEvent: NarrativeEvent[] = [

  {
    id: 'nomad_branch_select',
    title: '岔路',
    sceneTag: 'home',
    pathId: 'digital_nomad',
    ageRange: [25, 25],
    priority: 10,
    weight: 10,
    oncePerGame: true,
    eventType: 'branch_select',
    conditions: (s) => !s.narrativeBranch || s.narrativeBranch === 'unassigned',
    narrative:
      '三年了。你白天上班，晚上接海外单，周末混游民社群。你的Upwork评分从零涨到了五星，客户从一家变成了七八家，你的美元收入已经快要追上主业工资了。但你的护照上除了出入境盖章什么都没有——你还没出去过。\n\n' +
      '你卡在了一个尴尬的位置：副业收入已经不低，但你还在国内打卡上班，时差让你每天只能睡五六个小时。你看着游民群里的照片——清迈的咖啡馆、巴厘岛的海滩、里斯本的落日——心里清楚：只要你愿意All In，那些地方就是你的办公室。但All In意味着辞职、意味着没有退路、意味着你妈会问你"好好的工作为什么要辞"。\n\n' +
      '25岁这年，你坐在出租屋里，面前是三个方向：把接单做稳、做个产品出来、把经验变成课卖。窗外是国内城市的霓虹灯，你的屏幕亮着，等你做一个决定——不是决定去哪里，而是决定用什么方式"出去"。',
    options: [
      {
        id: 'choose_nomad_freelancer',
        label: '走自由职业线，靠技能稳定接单',
        description: '深耕一两项技能，把时薪做高，把客户做稳。你赌的是：技能深度+客户多元化=可持续的自由。不冒险，但也不封顶。',
        hint: '远程能力+12 · 月薪+2000 · 压力+5 · 信念+5',
        hintColor: 'positive',
        skillGains: { remoteSkill: 12 },
        salaryChange: 2000,
        branchSwitch: 'nomad_freelancer',
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '25岁，你选了最"稳"的那条路——把接单做成事业。你开始专注打磨一项核心技能，把零散的活变成系统化的服务。别人在追风口，你在筑地基。你赌的是：自由职业不是临时方案，是一种可以走通一辈子的事业。',
      },
      {
        id: 'choose_nomad_entrepreneur',
        label: '走海外创业线，做地点无关的产品',
        description: '不再卖时间，开始卖产品/订阅。你赌的是：地理位置无关的生意，是这个时代最大的杠杆——一次搭建，全球收费。',
        hint: '远程能力+8 · 跨文化+8 · 存款-20000 · 压力+10 · 信念+8',
        hintColor: 'danger',
        skillGains: { remoteSkill: 8, crossCulturalSkill: 8 },
        savingsChange: -20000,
        branchSwitch: 'nomad_entrepreneur',
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
        },
        log: '25岁，你不再满足于"接单"。你把积蓄砸进了第一个产品化服务的搭建——服务器、域名、支付网关、客服系统。没有老板，也没有客户保底。你赌的是：这个时代，一个人加一台电脑，就能做一个跨国公司。',
      },
      {
        id: 'choose_nomad_consultant',
        label: '走跨境咨询线，做知识套利',
        description: '把你的"跨国经验"变成高客单价的咨询。你赌的是：在两个世界之间当桥梁，比站在任何一边都值钱——信息差，是这个时代最后的套利空间。',
        hint: '语言+10 · 跨文化+10 · 被动收入+4000/年 · 信念+6 · 压力+3',
        hintColor: 'positive',
        skillGains: { languageSkill: 10, crossCulturalSkill: 10 },
        passiveIncomeChange: 4000,
        branchSwitch: 'nomad_consultant',
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '25岁，你接了第一单付费咨询——帮一家出海企业做东南亚市场调研，两小时收了800美元。挂掉电话你愣了半天：原来你这几年攒下的"游民经验"，本身就是一种可以卖的产品。你赌的是：知识套利，是地理位置无关的复利。',
      },
    ],
  },
];

// ============================================================
// 自由职业线事件（nomad_freelancer，ages 26-36）
// ============================================================

const freelancerEvents: NarrativeEvent[] = [

  // 26岁：第一个大客户与报价
  {
    id: 'nomad_freelancer_first_client',
    title: '报价单',
    sceneTag: 'video_call',
    pathId: 'digital_nomad',
    branch: 'nomad_freelancer',
    ageRange: [26, 26],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    narrative:
      '一个中型公司通过你以前的客户找上门，要做一整套品牌官网。这是你接过最大的单子。视频会议里对方问"你的报价是多少"，你心里慌得要命——以前都是按小时收，这次你想报个项目价，但不知道报多少才"显得专业又不吓跑人"。\n' +
      '你想起一个游民前辈说过的话："永远报你觉得自己不配的那个数字，然后再加20%。"\n' +
      '你深吸一口气，在聊天框里打下一个数字，手指悬在回车键上迟迟没按下去。这个数字是你以前时薪算下来的一倍半。你怕对方觉得贵，更怕对方一口答应——因为那就意味着，你这三年的时薪，原来一直被自己低估了。',
    options: [
      {
        id: 'quote_high',
        label: '报高价，赌对方会还价',
        description: '按前辈说的，报那个让你手抖的数字再加20%',
        hint: '远程能力+8 · 跨文化+6 · 存款+15000 · 压力+6 · 信念+5',
        hintColor: 'positive',
        skillGains: { remoteSkill: 8, crossCulturalSkill: 6 },
        savingsChange: 15000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '26岁，你报了一个让自己手抖的价。对方沉默了三秒，说"可以，我们签合同"。挂掉电话你瘫在椅子上，又想笑又想哭——原来不是你不够好，是你一直不敢要。从今天起，你的时薪翻了一倍。',
      },
      {
        id: 'quote_safe',
        label: '报稳妥价，先拿下再说',
        description: '报一个有把握的数字，用性价比换长期合作',
        hint: '远程能力+6 · 存款+8000 · 月薪+1000 · 信念+2',
        hintColor: 'neutral',
        skillGains: { remoteSkill: 6 },
        savingsChange: 8000,
        salaryChange: 1000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 2, 0, 100);
        },
        log: '26岁，你报了一个"安全价"，对方秒答应。合同签了你却有点失落——你不知道自己是不是卖便宜了。但这个客户后来成了你的长期金主，连续合作了两年。有时候，"稳"也是一种策略。',
      },
      {
        id: 'value_based_pricing',
        label: '报"价值定价"，按能给客户赚多少算',
        description: '不按工时，按"这个网站能帮你多接多少单"来报价',
        hint: '远程能力+10 · 跨文化+8 · 存款+20000 · 压力+8 · 信念+6',
        hintColor: 'positive',
        skillGains: { remoteSkill: 10, crossCulturalSkill: 8 },
        savingsChange: 20000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '26岁，你没报工时，而是做了一份"这个网站12个月能帮你们多接多少客户"的测算，然后按收益的10%报价。对方CEO看完说"你比我们市场总监还懂生意"。你拿到了单子，也拿到了一种全新的报价思路——从此你卖的不是时间，是结果。',
      },
    ],
  },

  // 27岁：时区战争
  {
    id: 'nomad_freelancer_timezone',
    title: '时区战争',
    sceneTag: 'home',
    pathId: 'digital_nomad',
    branch: 'nomad_freelancer',
    ageRange: [27, 27],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '你的客户在纽约、伦敦、悉尼各有一个。国内和纽约差12小时，和伦敦差8小时，和悉尼差2小时。这意味着你的日历上永远有会议在凌晨、清晨或深夜。\n' +
      '这周你凌晨三点跟纽约开了个会，早上六点跟悉尼对了个需求，下午跟伦敦发了封邮件，晚上九点又被纽约拉进一个紧急群。你已经连续四天没在同一个时间睡觉了。镜子里的你眼圈发黑，脸色蜡黄，像一个被时区撕碎又草草粘起来的人。\n' +
      '你开始怀疑：所谓的"地点自由"，是不是只是把"办公室"换成了"全世界"？你自由了，但你被时区绑架了。',
    options: [
      {
        id: 'async_first',
        label: '全面转向异步沟通',
        description: '拒绝实时会议，全部用Loom录屏+文档沟通',
        hint: '远程能力+12 · 压力-8 · 幸福+5 · 健康+4 · 信念+4',
        hintColor: 'positive',
        skillGains: { remoteSkill: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 8, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.health = clamp(s.health + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '27岁，你跟所有客户立了规矩：除非火烧眉毛，否则不打电话，用Loom录屏+Notion文档沟通。最初有客户不适应，但一个月后他们发现"不用约时间开会"反而更高效。你终于能睡整觉了，时区不再是枷锁，只是墙上的一个数字。',
      },
      {
        id: 'consolidate_timezone',
        label: '把客户集中到一个时区',
        description: '以后只接美洲客户，放弃其他时区',
        hint: '远程能力+8 · 压力-5 · 健康+3 · 但收入受限',
        hintColor: 'neutral',
        skillGains: { remoteSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 5, 0, 100);
          s.health = clamp(s.health + 3, 0, 100);
        },
        log: '27岁，你狠心砍掉了欧洲和澳洲的客户，只留美洲。收入少了一截，但你终于有了固定的"工作时间"——你的晚上是纽约的白天，你成了夜行动物，至少是规律的那种。',
      },
      {
        id: 'embrace_chaos',
        label: '硬扛，用咖啡和褪黑素维持',
        description: '反正年轻，扛得住，多接一单是一单',
        hint: '远程能力+5 · 月薪+1500 · 压力+12 · 健康-8 · 信念-2',
        hintColor: 'danger',
        skillGains: { remoteSkill: 5 },
        salaryChange: 1500,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.health = clamp(s.health - 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 2, 0, 100);
        },
        log: '27岁，你用浓缩咖啡和褪黑素把自己焊在了时区的接缝上。多赚了钱，但体检报告上多了几个箭头。某个凌晨四点开完会，你在浴室吐了——不是生病，是身体在抗议。你开始明白：用健康换的自由，不叫自由，叫透支。',
      },
    ],
  },

  // 28岁：丰俭周期
  {
    id: 'nomad_freelancer_feast_famine',
    title: '丰与荒',
    sceneTag: 'co_living',
    pathId: 'digital_nomad',
    branch: 'nomad_freelancer',
    ageRange: [28, 28],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '上个月你同时接了四个单子，忙到凌晨，赚了平常三个月的钱。你飘飘然地升级了Airbnb，点了几天外卖，还冲动地买了张去东京的机票。\n' +
      '这个月，四个单子全部结束，新客户一个都没着落。你发了二十封开发信，全部石沉大海。你打开银行账户，看着上个月涌进来的数字，开始精打细算——这个数字能撑几个月？如果三个月没新单，你就得降级住青旅。\n' +
      '自由职业的诅咒就在这里：忙的时候累死，闲的时候慌死。你不是在干活，就是在找活的路上。你看着日历上空荡荡的这周，第一次怀念起上班时那种"每月固定到账"的安全感。',
    options: [
      {
        id: 'build_pipeline',
        label: '建立"销售漏斗"，永远在找客户',
        description: '忙的时候也每天花一小时开发新客户，平滑周期',
        hint: '远程能力+12 · 跨文化+5 · 压力+5 · 信念+5 · 月薪+1000',
        hintColor: 'positive',
        skillGains: { remoteSkill: 12, crossCulturalSkill: 5 },
        salaryChange: 1000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '28岁，你给自己定了个铁律：不管多忙，每天雷打不动花一小时开发新客户。三个月后，"荒月"再也没出现过——因为你永远在漏斗里养着下一批单子。你终于明白：自由职业的核心技能不是干活，是"持续地让人知道你能干活"。',
      },
      {
        id: 'retainer_contracts',
        label: '主攻长期 retainer 合同，锁住基础收入',
        description: '把一次性项目变成月费制长期合作',
        hint: '远程能力+8 · 被动收入+3000/年 · 信念+4 · 压力-4',
        hintColor: 'positive',
        skillGains: { remoteSkill: 8 },
        passiveIncomeChange: 3000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          s.stress = clamp(s.stress - 4, 0, 100);
        },
        log: '28岁，你把两个老客户谈成了月费制retainer——每月固定收一笔，负责他们的日常维护。从此你的收入有了"底"，丰荒周期被熨平了一半。你终于敢在闲月里安心看本书，而不是焦虑地刷新邮箱。',
      },
      {
        id: 'save_buffer',
        label: '存够12个月的生活费再说',
        description: '趁丰月疯狂存钱，把荒月的风险降到最低',
        hint: '存款+12000 · 压力-3 · 幸福-3 · 信念+2',
        hintColor: 'neutral',
        savingsChange: 12000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 3, 0, 100);
          s.happiness = clamp(s.happiness - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 2, 0, 100);
        },
        log: '28岁，你在丰月把一半收入锁进了"荒月基金"。生活质量降了一档，但心里踏实了。你跟自己说：自由的前提，是兜里有粮。没有安全感的自由，只是另一种流浪。',
      },
    ],
  },

  // 29岁：涨价恐惧
  {
    id: 'nomad_freelancer_rate_raise',
    title: '涨价',
    sceneTag: 'home',
    pathId: 'digital_nomad',
    branch: 'nomad_freelancer',
    ageRange: [29, 29],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '你已经两年没涨过价了。你的技能涨了一大截，作品集越来越厚，但报价单还是两年前那个数字。每次想涨价，你都会被一种莫名的恐惧按住——怕老客户跑了，怕新客户觉得贵，怕"一旦涨价就再也接不到单"。\n' +
      '上周一个新客户看了你的报价，直接说"这个价位我以为会更贵"。你愣了一下——原来在别人眼里，你一直卖便宜了。\n' +
      '你打开报价单，盯着那个数字看了很久。涨价不是改个数字那么简单，它意味着你要重新定义"我值多少"。而这个问题的答案，从来不在报价单上，在你心里。',
    options: [
      {
        id: 'raise_for_new_only',
        label: '老客户不涨，新客户按新价',
        description: '用"价格双轨制"平稳过渡，不伤老关系',
        hint: '远程能力+6 · 月薪+2500 · 信念+5 · 压力+3',
        hintColor: 'positive',
        skillGains: { remoteSkill: 6 },
        salaryChange: 2500,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.stress = clamp(s.stress + 3, 0, 100);
        },
        log: '29岁，你给新客户报了涨50%的价，老客户维持原价。新客户一口答应，老客户那边也没人因为你"涨价"而跑——因为他们根本不知道。半年后你的客户结构自然换血，时薪悄无声息地上了一个台阶。',
      },
      {
        id: 'raise_everyone',
        label: '全员涨价，涨不动的就放手',
        description: '发一封邮件告诉所有客户下月起涨价，能留的留，留不住的走',
        hint: '远程能力+8 · 月薪+3000 · 压力+8 · 信念+8 · 风险',
        hintColor: 'danger',
        skillGains: { remoteSkill: 8 },
        salaryChange: 3000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '29岁，你给所有客户发了涨价邮件。有两个老客户没续约，你心痛了一周。但新价带来的新客户很快填上了空缺，而且质量更高。你学到一句话：涨价的本质不是多收钱，是筛选出真正认可你价值的人。',
      },
      {
        id: 'package_service',
        label: '不涨价，改成"产品化服务"打包卖',
        description: '把零散服务做成固定套餐，单价自然上去',
        hint: '远程能力+12 · 跨文化+5 · 月薪+2000 · 信念+6 · 压力+4',
        hintColor: 'positive',
        skillGains: { remoteSkill: 12, crossCulturalSkill: 5 },
        salaryChange: 2000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.stress = clamp(s.stress + 4, 0, 100);
        },
        log: '29岁，你没涨价，而是把服务做成了三个档位的"套餐包"——基础版、专业版、旗舰版。客户买的不再是"你的时间"，而是"一个解决方案"。客单价翻了倍，客户反而觉得更值。你第一次摸到了"产品化"的甜头。',
      },
    ],
  },

  // 30岁：客户多元化 vs 依赖
  {
    id: 'nomad_freelancer_diversify',
    title: '不要把鸡蛋放在一个客户里',
    sceneTag: 'home',
    pathId: 'digital_nomad',
    branch: 'nomad_freelancer',
    ageRange: [30, 30],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '你最大的客户占了你70%的收入。这家公司对你很好，付款准时，需求清晰，几乎是你梦寐以求的"金主"。但你心里一直有根刺——万一哪天他们砍预算呢？万一换了个不喜欢外包的CTO呢？万一公司被收购了呢？\n' +
      '上个月他们的项目进入了维护期，给你的单子少了八成。你看着银行流水，第一次真切地感到"依赖"的滋味：你的自由，建立在一个你无法掌控的变量上。\n' +
      '你知道该分散风险了，但分散意味着要把精力从"印钞机"客户身上挪走，去开发那些"可能成、可能不成"的新客户。这需要勇气——安全感，从来都是自由职业者最贵的奢侈品。',
    options: [
      {
        id: 'aggressive_diversify',
        label: '主动开发5个以上客户，单客不超过30%',
        description: '哪怕累一点，也要把依赖降下来',
        hint: '远程能力+10 · 跨文化+8 · 压力+8 · 信念+6 · 月薪+1500',
        hintColor: 'positive',
        skillGains: { remoteSkill: 10, crossCulturalSkill: 8 },
        salaryChange: 1500,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '30岁，你花了三个月把客户数从3个拓展到了7个，最大的客户占比降到了25%。累是真累，但月底看着多元化的收入结构，你睡得着觉了。你终于理解了那句话：自由职业的安全感，不在于某个客户多大，在于你能失去任何一个客户都不崩盘。',
      },
      {
        id: 'deepen_anchor',
        label: '加深和大客户的绑定，转成深度合作',
        description: '干脆 all in 这个客户，争取转正/股权',
        hint: '远程能力+6 · 月薪+3000 · 压力+5 · 但风险集中 · 信念+3',
        hintColor: 'danger',
        skillGains: { remoteSkill: 6 },
        salaryChange: 3000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '30岁，你没分散，反而跟大客户谈成了更深的合作——固定月薪+项目分红。收入涨了，但你心里清楚：你正在从"自由职业"滑向"远程员工"。自由的边界，在悄悄变窄。',
      },
      {
        id: 'build_passive',
        label: '把重复性工作做成模板/工具卖',
        description: '把给客户做的通用部分抽出来，做成产品卖订阅',
        hint: '远程能力+8 · 被动收入+5000/年 · 信念+5 · 压力+4',
        hintColor: 'positive',
        skillGains: { remoteSkill: 8 },
        passiveIncomeChange: 5000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.stress = clamp(s.stress + 4, 0, 100);
        },
        log: '30岁，你把给不同客户重复做的"建站脚手架"做成了一套模板，挂在网上卖订阅。第一个月只有3个买家，但这是你第一次拥有了"睡觉时也在赚钱"的收入。被动收入的种子，种下了。',
      },
    ],
  },

  // 31岁：声誉与转介绍
  {
    id: 'nomad_freelancer_reputation',
    title: '口碑',
    sceneTag: 'co_living',
    pathId: 'digital_nomad',
    branch: 'nomad_freelancer',
    ageRange: [31, 31],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '你已经不需要主动找客户了。新客户都是老客户介绍来的——"我朋友说你做得好，能不能帮我们也做一个"。你的收件箱里躺着好几个这样的询盘，你的日历排到了两个月后。\n' +
      '这是一种奇怪的踏实感。前几年你还在Upwork上跟几百人抢单，现在你只需要把活干好，客户自己会来。你第一次理解了"声誉"这个词在自由职业里的分量——它不是虚名，是一台隐形的、24小时运转的销售机器。\n' +
      '但声誉也是把双刃剑：你接得越多，期待越高，一个失误就可能砸了攒了多年的牌子。你看着那些询盘，开始想：是继续全接，还是开始学会说"不"。',
    options: [
      {
        id: 'selective_accept',
        label: '只接能加分的项目，学会拒绝',
        description: '把不符合定位、预算太低、客户难搞的单子拒掉',
        hint: '远程能力+8 · 跨文化+6 · 幸福+6 · 压力-5 · 信念+5',
        hintColor: 'positive',
        skillGains: { remoteSkill: 8, crossCulturalSkill: 6 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 6, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '31岁，你第一次对一个询盘说了"No, thank you"。对方预算太低，接了只会消耗你的声誉。拒掉的那一刻你有点心疼，但更多的是释然——你终于有底气挑客户了，而不是被客户挑。',
      },
      {
        id: 'collect_testimonials',
        label: '系统化收集好评，做成作品集',
        description: '主动请老客户写推荐语，把口碑变成可见资产',
        hint: '远程能力+6 · 跨文化+8 · 被动收入+3000/年 · 信念+4',
        hintColor: 'positive',
        skillGains: { remoteSkill: 6, crossCulturalSkill: 8 },
        passiveIncomeChange: 3000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '31岁，你给每个合作过的客户发了一封"求推荐信"的邮件，收到了十几封热情洋溢的回复。你把它们整理成了作品集页面，挂在个人网站上。从此新客户的转化率翻了倍——别人不再问你"能不能做"，而是问"什么时候能开始"。',
      },
      {
        id: 'scale_with_subcontractors',
        label: '开始分包，带新人一起接单',
        description: '自己接大单，把执行分包给其他游民',
        hint: '远程能力+10 · 跨文化+5 · 月薪+2500 · 压力+8 · 信念+4',
        hintColor: 'neutral',
        skillGains: { remoteSkill: 10, crossCulturalSkill: 5 },
        salaryChange: 2500,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '31岁，你接了一个超出你单人产能的大单，把它分包给了两个游民圈的后辈。你从"干活的"变成了"管活的"，赚了差价，也操了心。你隐隐摸到了"小工作室"的雏形——也许有一天，你会从一个自由职业者，变成一个小老板。',
      },
    ],
  },

  // 32岁：长期 retainer 与稳定
  {
    id: 'nomad_freelancer_retainer',
    title: '锚',
    sceneTag: 'cafe',
    pathId: 'digital_nomad',
    branch: 'nomad_freelancer',
    ageRange: [32, 32],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '你终于谈下了两个长期retainer客户——每月固定一笔，负责他们的持续维护和迭代。加上几个项目单，你的月收入第一次稳定在了一个让你安心的数字。\n' +
      '你坐在里斯本的一家咖啡馆里，看着特茹河上的夕阳，第一次有了一种"可以喘口气"的感觉。过去十年你一直在"找下一个客户"的treadmill上跑，现在这台机器终于有了"自动模式"。\n' +
      '但你也注意到一种微妙的变化：稳定的收入带来稳定的安心，也带来稳定的惯性。你已经三个月没主动开发新客户了。你问自己：这份"稳定"，是你的港湾，还是你的温水？',
    options: [
      {
        id: 'enjoy_stability',
        label: '享受来之不易的稳定，把精力投到生活上',
        description: '收入稳了，终于有时间谈恋爱、健身、学点喜欢的',
        hint: '幸福+10 · 健康+5 · 压力-8 · 信念+2 · 跨文化+4',
        hintColor: 'positive',
        skillGains: { crossCulturalSkill: 4 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.health = clamp(s.health + 5, 0, 100);
          s.stress = clamp(s.stress - 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 2, 0, 100);
        },
        log: '32岁，你第一次有了"下班后不想工作"的奢侈。你报了葡语课，开始规律健身，周末跟新认识的朋友去冲浪。收入没涨，但生活质感涨了。你发现：自由职业的终极目的，不是为了赚更多，是为了有资格"不赚"。',
      },
      {
        id: 'push_higher',
        label: '趁稳定，冲击更高客单价',
        description: '用稳定的底托住风险，去谈更大的单子',
        hint: '远程能力+10 · 跨文化+6 · 月薪+3000 · 压力+6 · 信念+6',
        hintColor: 'positive',
        skillGains: { remoteSkill: 10, crossCulturalSkill: 6 },
        salaryChange: 3000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '32岁，你用retainer托底，大胆去谈了一个过去不敢碰的大单——给一家上市公司做年度品牌系统。对方看了你的作品集和retainer客户名单，觉得"这人靠谱"，签了。你的年收入第一次突破了六位数美元。',
      },
      {
        id: 'mentor_others',
        label: '开始带徒弟，把经验传承下去',
        description: '收一两个游民新人，手把手教，收点拜师费',
        hint: '跨文化+8 · 语言+5 · 被动收入+4000/年 · 幸福+6 · 信念+5',
        hintColor: 'positive',
        skillGains: { crossCulturalSkill: 8, languageSkill: 5 },
        passiveIncomeChange: 4000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '32岁，你收了第一个"徒弟"——一个刚辞职想做游民的年轻人。你把自己踩过的坑、报过的价、谈过的客户全教给了TA。看着TA从磕磕绊绊到独当一面，你有一种奇怪的满足感：原来"被需要"，比"赚钱"更让人踏实。',
      },
    ],
  },

  // 34岁：专业化 vs 通才
  {
    id: 'nomad_freelancer_specialist',
    title: '深井',
    sceneTag: 'cafe',
    pathId: 'digital_nomad',
    branch: 'nomad_freelancer',
    ageRange: [34, 34],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '你站在一个分岔口：继续做"什么都会一点"的通才，还是往一个领域深扎成"不可替代的专家"。\n' +
      '通才的好处是灵活——什么活都能接，什么风口都能蹭。但坏处也很明显：你的报价永远卡在"还行"的区间，因为客户随时能找到另一个"还行"的人替代你。而那些敢报天价的，都是某个细分领域里"只有他能做"的人。\n' +
      '你想起一个前辈的话："通才活在机会里，专家创造机会。通才追风，专家等风来。"你已经"游"了十二年，是时候决定：继续漂，还是扎一根深下去的根。',
    options: [
      {
        id: 'go_specialist',
        label: '往一个细分领域深扎，做"唯一的选择"',
        description: '选定一个垂直方向，三年内成为该领域Top',
        hint: '远程能力+12 · 跨文化+5 · 月薪+4000 · 压力+8 · 信念+8',
        hintColor: 'positive',
        skillGains: { remoteSkill: 12, crossCulturalSkill: 5 },
        salaryChange: 4000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '34岁，你砍掉了七成不相关的业务，把全部精力砸进了一个细分领域。前半年收入掉了三成，你慌过。但一年后，你成了这个圈子里"提到这个需求第一个想到的人"。客单价翻倍，客户排队。你终于懂了：自由不是什么都做，是有底气只做一件事。',
      },
      {
        id: 'stay_generalist',
        label: '保持通才，用多元对冲风险',
        description: '什么都会才是游民的优势，不把鸡蛋放一个篮子',
        hint: '远程能力+6 · 跨文化+8 · 月薪+1000 · 压力+2 · 信念+3',
        hintColor: 'neutral',
        skillGains: { remoteSkill: 6, crossCulturalSkill: 8 },
        salaryChange: 1000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 2, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '34岁，你没专业化，继续做"瑞士军刀"。任何一个领域风吹草动，你都能切到另一个。收入没爆发，但也从没断过。你安慰自己：游民的本质就是"不把根扎死"，这样风来了你能飞，风停了你也不会倒。',
      },
      {
        id: 'build_personal_brand',
        label: '用内容建立个人品牌，让客户主动找你',
        description: '写博客/做视频，把"什么都会"变成"什么都被看见"',
        hint: '远程能力+8 · 跨文化+10 · 语言+6 · 被动收入+6000/年 · 信念+6',
        hintColor: 'positive',
        skillGains: { remoteSkill: 8, crossCulturalSkill: 10, languageSkill: 6 },
        passiveIncomeChange: 6000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '34岁，你开始系统性地输出内容——每周一篇深度复盘，每月一次公开直播。半年后你的名字开始出现在行业媒体上，客户从"你找他"变成了"他找你"。你发现：通才的护城河不是某项技能，是"被足够多的人知道你什么都会"。',
      },
    ],
  },

  // 35岁：自由职业的终局思考
  {
    id: 'nomad_freelancer_endgame',
    title: '够了吗',
    sceneTag: 'restaurant',
    pathId: 'digital_nomad',
    branch: 'nomad_freelancer',
    ageRange: [35, 35],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你坐在墨西哥城一家天台酒吧，看着远处的火山口。你的retainer收入已经覆盖了你所有的生活开销还有结余，你的客户稳定，你的时薪是十二年前出发时的八倍。\n' +
      '你打开计算器算了一笔账：如果现在把被动收入和retainer加起来，你已经不需要再"主动接单"了。你可以继续接，但那是为了"想做"，不是为了"得做"。\n' +
      '这是你十二年前出发时做梦都想不到的位置。但你没有想象中那么兴奋——反而有一丝茫然。当"为了自由而奋斗"的目标快要达成时，你突然不知道：自由之后，你要做什么？',
    options: [
      {
        id: 'declare_financial_free',
        label: '宣布"财务自由"，进入半退休',
        description: '只接喜欢的活，把剩余精力投到生活和非营利项目',
        hint: '幸福+12 · 压力-10 · 健康+5 · 信念+10 · 跨文化+5',
        hintColor: 'positive',
        skillGains: { crossCulturalSkill: 5 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 12, 0, 100);
          s.stress = clamp(s.stress - 10, 0, 100);
          s.health = clamp(s.health + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
        },
        log: '35岁，你在朋友圈发了一条："从今天起，我只接让我兴奋的活。"下面一堆人问"你财务自由了？"你回了个笑脸。你知道"自由"不是不用工作，是终于有底气对不想做的事说不。十二年前那张去清迈的单程票，终于在今天兑现了。',
      },
      {
        id: 'keep_grinding',
        label: '继续接单，趁能赚多赚点',
        description: '自由是有了，但安全感永远不嫌多',
        hint: '远程能力+8 · 月薪+3000 · 压力+6 · 幸福-3 · 信念+2',
        hintColor: 'neutral',
        skillGains: { remoteSkill: 8 },
        salaryChange: 3000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.happiness = clamp(s.happiness - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 2, 0, 100);
        },
        log: '35岁，你没停下来。你跟自己说"再干几年，攒够FIRE的数字再说"。但你心里隐隐知道：安全感的数字会随着你的收入一起涨，你永远到不了那个"够了"。也许"够"从来不是一个数字，是一个决定。',
      },
      {
        id: 'give_back_community',
        label: '回馈游民社群，做免费的入门课',
        description: '把十二年踩过的坑做成免费课程，帮新人少走弯路',
        hint: '跨文化+10 · 语言+6 · 幸福+10 · 信念+8 · 被动收入+2000/年',
        hintColor: 'positive',
        skillGains: { crossCulturalSkill: 10, languageSkill: 6 },
        passiveIncomeChange: 2000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '35岁，你把十二年的游民经验做成了一套免费入门课，挂在YouTube上。第一周播放破十万，评论区全是"谢谢你不收钱"。你看着那些留言，想起22岁那个在群里问"新人要注意什么"的自己。原来你也成了当年帮你的人。',
      },
    ],
  },
];

// ============================================================
// 海外创业线事件（nomad_entrepreneur，ages 26-36）
// ============================================================

const entrepreneurEvents: NarrativeEvent[] = [

  // 26岁：第一个产品上线
  {
    id: 'nomad_entrepreneur_first_product',
    title: '上线',
    sceneTag: 'home',
    pathId: 'digital_nomad',
    branch: 'nomad_entrepreneur',
    ageRange: [26, 26],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你把第一个产品化服务挂上了网——一套给跨境卖家的"自动汇率换算+多币种记账"工具，月费19美元。下班后的每个晚上你都在写代码，周末全部用来做产品。\n' +
      '上线第一天，0个注册。第二天，3个。第三天，其中一个退订了。你盯着后台那两个孤零零的活跃用户，心情像过山车。其中一个用户给你发了封邮件："这个工具救了我的命，我终于不用每天手动换算汇率了。"\n' +
      '你盯着那封邮件看了很久。就为了这一个用户，你也得把这个东西做下去。',
    options: [
      {
        id: 'iterate_fast',
        label: '疯狂迭代，每周发新版本',
        description: '根据那两个用户的反馈，把产品打磨到极致',
        hint: '远程能力+12 · 跨文化+5 · 压力+10 · 健康-4 · 信念+8',
        hintColor: 'positive',
        skillGains: { remoteSkill: 12, crossCulturalSkill: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.health = clamp(s.health - 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '26岁，你进入了"每周一更"的疯狂节奏。那两个用户成了你的产品顾问，你每个版本都先发给他们试用。三个月后用户涨到了50，留存率80%。你发现：早期不缺用户，缺的是"愿意陪你打磨的死忠"。',
      },
      {
        id: 'find_seed_users',
        label: '暂停开发，先去找更多种子用户',
        description: '在跨境卖家社群里混脸熟，手动拉人试用',
        hint: '远程能力+8 · 跨文化+10 · 语言+5 · 压力+5 · 信念+5',
        hintColor: 'neutral',
        skillGains: { remoteSkill: 8, crossCulturalSkill: 10, languageSkill: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '26岁，你没急着写代码，而是跑去跨境卖家群里当起了"客服"。谁有汇率换算的痛点你立刻私信安利。一个月手动拉来了40个用户，其中8个成了付费。你学到一句话：产品冷启动，前100个用户只能靠手动一个一个搬。',
      },
      {
        id: 'pivot_problem',
        label: '根据反馈果断转向',
        description: '发现真正的痛点不是记账，是多币种收款',
        hint: '远程能力+10 · 跨文化+6 · 压力+8 · 存款-5000 · 信念+6',
        hintColor: 'danger',
        skillGains: { remoteSkill: 10, crossCulturalSkill: 6 },
        savingsChange: -5000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '26岁，你跟用户聊深了发现：他们真正头疼的不是记账，是收不同国家的钱。你狠心把做了一半的记账功能砍掉，转向做"多币种收款"。这次转向让你晚两个月上线，但用户数两周翻了十倍——因为你终于戳中了真痛点。',
      },
    ],
  },

  // 27岁：招第一个远程员工
  {
    id: 'nomad_entrepreneur_first_hire',
    title: '第一个员工',
    sceneTag: 'video_call',
    pathId: 'digital_nomad',
    branch: 'nomad_entrepreneur',
    ageRange: [27, 27],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你一个人扛了半年，客服、开发、营销、财务全是你。每天睡五小时，靠咖啡和焦虑续命。终于你承认了：一个人做不了一家公司的所有事。\n' +
      '你在菲律宾招了第一个远程员工——一个刚毕业的客服，月薪400美元。视频面试时她紧张得英语都说不利索，但你看到她眼睛里的认真。你给她发了offer，挂掉电话后你愣了很久：从今天起，你不只是"自由职业者"了，你成了"老板"——一个要为另一个人的生计负责的人。\n' +
      '这种感觉很奇怪，也很重。你第一次理解了"雇佣"的本质：不是花钱买时间，是花钱买一份信任，然后为这份信任兜底。',
    options: [
      {
        id: 'hire_vetted_pro',
        label: '加钱招有经验的远程老兵',
        description: '宁可多花钱，也要一个能独立干活的人',
        hint: '远程能力+10 · 跨文化+6 · 月薪-1500 · 压力-4 · 信念+5',
        hintColor: 'positive',
        skillGains: { remoteSkill: 10, crossCulturalSkill: 6 },
        salaryChange: -1500,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '27岁，你没贪便宜，花了双倍价钱招了个有三年远程经验的菲律宾姑娘。她上班第一周就把你的客服流程理顺了，第二周开始主动优化FAQ。你第一次体会到了"花钱买回自己时间"的爽感——贵，但值。',
      },
      {
        id: 'hire_cheap_train',
        label: '招便宜的新人，自己手把手带',
        description: '省成本，但你要投入大量时间培训',
        hint: '远程能力+12 · 跨文化+8 · 压力+10 · 信念+4 · 但费精力',
        hintColor: 'neutral',
        skillGains: { remoteSkill: 12, crossCulturalSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '27岁，你招了那个英语磕巴但眼里有光的菲律宾新人。前两个月你几乎是在"教英语+教业务"，累到怀疑人生。但第四个月她能独立处理80%的工单了，第六个月她成了你最得力的左手。你发现：带新人最大的回报不是省下的钱，是她成长时你眼里那点光。',
      },
      {
        id: 'outsource_not_hire',
        label: '不雇人，全部外包给其他游民',
        description: '保持"零员工"的轻盈，按项目发包',
        hint: '远程能力+8 · 跨文化+6 · 存款-8000 · 压力+4 · 灵活',
        hintColor: 'neutral',
        skillGains: { remoteSkill: 8, crossCulturalSkill: 6 },
        savingsChange: -8000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 4, 0, 100);
        },
        log: '27岁，你没雇人，而是把设计、文案、测试全发包给了游民圈的朋友。保持了"一人公司"的轻盈，但协调成本高得吓人。你成了"项目经理"，每天一半时间在催稿。你开始理解：外包省的是固定成本，费的是管理精力。',
      },
    ],
  },

  // 28岁：扩张的阵痛
  {
    id: 'nomad_entrepreneur_scaling',
    title: '扩张的阵痛',
    sceneTag: 'home',
    pathId: 'digital_nomad',
    branch: 'nomad_entrepreneur',
    ageRange: [28, 28],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '用户涨到了500，团队有了4个人（分布在4个时区），月收入破了两万美元。听起来很美，但你快被管理耗干了。\n' +
      '你的Slack永远在响，每天要处理三个国家的劳动法问题，两个员工的合同要续，一个客户的大单要交付，还有税务、发票、合规一堆你从来没学过的东西。你从一个"做产品的人"变成了一个"救火的人"，已经两个月没写过一行代码了。\n' +
      '你想起一个创业前辈的话："公司从1到10的阶段，创始人最容易死。不是被市场打死，是被自己累死。"你看着镜子里那个憔悴的自己，第一次认真想：是不是该建系统了，而不是继续当那个"什么都管"的超人。',
    options: [
      {
        id: 'build_sop_system',
        label: '把所有流程SOP化，建系统不靠人',
        description: '写文档、做模板、上自动化工具，让公司能脱离你运转',
        hint: '远程能力+12 · 压力-6 · 幸福+4 · 信念+6 · 月薪-1000',
        hintColor: 'positive',
        skillGains: { remoteSkill: 12 },
        salaryChange: -1000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 6, 0, 100);
          s.happiness = clamp(s.happiness + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '28岁，你花了三个月把客服、交付、财务全写成了SOP，上了Notion+Zapier+Loom的组合拳。最初员工不适应"按文档办事"，但一个月后你发现：你请假三天，公司居然没塌。你第一次尝到了"系统比人可靠"的甜头。',
      },
      {
        id: 'hire_ops_lead',
        label: '招一个运营负责人，把管理交出去',
        description: '承认自己不擅长管理，花钱请专业的人',
        hint: '远程能力+8 · 跨文化+6 · 月薪-2000 · 压力-8 · 信念+4',
        hintColor: 'positive',
        skillGains: { remoteSkill: 8, crossCulturalSkill: 6 },
        salaryChange: -2000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '28岁，你招了个远程运营负责人——一个在欧洲的前大厂PM。她上班第二周就把你那堆乱七八糟的流程理成了甘特图。你从"救火队长"变回了"产品负责人"，终于又能写代码了。你学到：创始人的第一课，是承认自己不是全能的。',
      },
      {
        id: 'stay_solo_capscale',
        label: '不扩张，主动控制规模',
        description: '做一个高利润的"小而美"，不要把自己累死',
        hint: '远程能力+6 · 幸福+8 · 压力-10 · 信念+3 · 但放弃增长',
        hintColor: 'neutral',
        skillGains: { remoteSkill: 6 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress - 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '28岁，你没扩张，反而砍掉了一半低利润客户，把团队精简到2人。收入少了，但利润率涨了，你每周能睡够七小时。你跟自己说：不是所有公司都要做大，"小而美"也是一种成功。你赌的是：活得久，比长得快重要。',
      },
    ],
  },

  // 29岁：跨境税务与合规
  {
    id: 'nomad_entrepreneur_legal_tax',
    title: '税',
    sceneTag: 'bank',
    pathId: 'digital_nomad',
    branch: 'nomad_entrepreneur',
    ageRange: [29, 29],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你以为做跨境生意最难的是产品，直到你收到一封来自某国税务局的信。你在三个国家有客户、在两个国家有员工、自己又是"哪里都不算税务居民"的游民——这套组合，连会计师都头大。\n' +
      '增值税怎么申报？远程员工的社保在哪交？你的公司注册在哪国最划算？数字产品的跨境税务规则每个国家都不一样，而且年年变。你发现：做跨境生意，"合规"这门课，比写代码难一百倍。\n' +
      '你坐在一家立陶宛的会计师办公室里，对面是个英文流利的老太太，正在跟你解释什么叫"常设机构"。你第一次后悔：当年为什么没好好学点税法。',
    options: [
      {
        id: 'incorporate_offshore',
        label: '注册离岸公司，用结构解决税务',
        description: '在爱沙尼亚/新加坡/开曼注册数字公司',
        hint: '远程能力+6 · 跨文化+10 · 存款-15000 · 压力-5 · 信念+5',
        hintColor: 'positive',
        skillGains: { remoteSkill: 6, crossCulturalSkill: 10 },
        savingsChange: -15000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '29岁，你在爱沙尼亚注册了e-Residency公司，全套数字化运营，全球收付。注册费花了一万五，但从此你的税务结构清晰了，合规成本降了一半。你第一次理解了：对数字游民来说，"公司注册地"也是一种地理位置选择——而且是最重要的一种。',
      },
      {
        id: 'hire_pro_advisor',
        label: '花钱请跨境税务顾问，别自己瞎搞',
        description: '专业的事交给专业的人，省心也防雷',
        hint: '远程能力+5 · 跨文化+8 · 存款-8000 · 压力-6 · 信念+4',
        hintColor: 'positive',
        skillGains: { remoteSkill: 5, crossCulturalSkill: 8 },
        savingsChange: -8000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '29岁，你花了八千请了个专门做跨境数字生意的税务顾问。她帮你把三个国家的申报理顺了，还发现了两个你一直在多交的税。你看着省下来的钱，心想：这八千花得比任何营销费都值。合规不是成本，是保险。',
      },
      {
        id: 'ignore_risk',
        label: '先不管，赚到钱再说',
        description: '小公司没人查，等做大了再处理',
        hint: '远程能力+3 · 存款+5000 · 压力+8 · 信念-4 · 埋雷',
        hintColor: 'danger',
        skillGains: { remoteSkill: 3 },
        savingsChange: 5000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 4, 0, 100);
        },
        log: '29岁，你把那封税务局的信塞进了抽屉，安慰自己"小生意没人管"。省下了顾问费，但每个深夜你都会想起那封信。你知道这是颗定时炸弹，只是你选择假装它不存在。一年后它真的炸了——罚款比顾问费贵了十倍。',
      },
    ],
  },

  // 30岁：产品市场契合的拉锯
  {
    id: 'nomad_entrepreneur_pmfi',
    title: '契合',
    sceneTag: 'home',
    pathId: 'digital_nomad',
    branch: 'nomad_entrepreneur',
    ageRange: [30, 30],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '你的产品有了3000用户，但增长停滞了三个月。你试过降价、加功能、投广告，数据纹丝不动。你开始怀疑：到底是市场不够大，还是你的产品没真正戳中痛点？\n' +
      '你翻了500条用户反馈，发现一个反直觉的事：付费最多的那批用户，用的功能是你当初最不看好的"团队协作"模块；而你花最多心血做的"自动化"模块，付费用户几乎不用。\n' +
      '你盯着这份数据，像盯着一个告诉你"你爱错了人"的体检报告。产品市场契合不是你设计出来的，是用户用钱投票投出来的——而他们投的方向，跟你以为的不一样。',
    options: [
      {
        id: 'double_down_real_pmfi',
        label: '壮士断腕，all in 用户真正付费的功能',
        description: '砍掉一半功能，把协作模块做到极致',
        hint: '远程能力+12 · 跨文化+6 · 压力+8 · 信念+8 · 月薪+2000',
        hintColor: 'positive',
        skillGains: { remoteSkill: 12, crossCulturalSkill: 6 },
        salaryChange: 2000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '30岁，你忍痛砍掉了自己最得意的自动化模块，把全公司精力压在协作功能上。前两周有老用户骂你"阉割产品"，但一个月后新增付费涨了40%。你学到一句话：PMF不是你以为的好，是用户愿意续费的好。放下执念，是创始人最难的修行。',
      },
      {
        id: 'pivot_new_segment',
        label: '换个目标用户群，找新增长',
        description: '现有市场到顶了，把产品卖给另一群人',
        hint: '远程能力+10 · 跨文化+10 · 语言+5 · 压力+10 · 信念+5',
        hintColor: 'neutral',
        skillGains: { remoteSkill: 10, crossCulturalSkill: 10, languageSkill: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '30岁，你发现跨境卖家市场到顶了，但同一个产品卖给"远程团队"反而需求更旺。你重新写了所有营销文案，换了个赛道。三个月后用户翻倍——你赌对了：同一个功能，换个人群，就是一门新生意。',
      },
      {
        id: 'accept_plateau',
        label: '接受增长停滞，做成"现金牛"',
        description: '不再追求增长，把现有业务做成稳定利润机器',
        hint: '远程能力+6 · 幸福+6 · 压力-8 · 信念+2 · 被动收入+4000/年',
        hintColor: 'neutral',
        skillGains: { remoteSkill: 6 },
        passiveIncomeChange: 4000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 6, 0, 100);
          s.stress = clamp(s.stress - 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 2, 0, 100);
        },
        log: '30岁，你停止了追增长，把产品变成了"印钞机"——不再加功能，只做维护和留存。利润稳定，你解放了出来。有投资人劝你"该冲一波了"，你笑了笑：不是每家公司都要上市，能稳定下蛋的鹅，也是好鹅。',
      },
    ],
  },

  // 31岁：被抄袭
  {
    id: 'nomad_entrepreneur_copycat',
    title: '影子',
    sceneTag: 'home',
    pathId: 'digital_nomad',
    branch: 'nomad_entrepreneur',
    ageRange: [31, 31],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '一个竞争对手抄了你的产品——不只是功能，连定价、文案、官网布局都一模一样，价格还比你低30%。你发现他们时，已经流失了20%的新增用户。\n' +
      '你气得发抖，给律师朋友发了截图。朋友说"跨境维权成本高、周期长，建议你打不过就跑"。你看着那个抄袭者的官网，像一个看着自己影子被偷走的人——愤怒，但也无力。\n' +
      '深夜你盯着自己的产品后台，问自己一个更狠的问题：如果别人这么容易就能抄走你的生意，说明你的护城河到底在哪里？也许真正该恐惧的不是这个抄袭者，是你一直以为的"先发优势"其实根本不存在的这件事。',
    options: [
      {
        id: 'moat_with_brand',
        label: '用品牌和社群筑护城河',
        description: '功能能抄，品牌和用户关系抄不走',
        hint: '远程能力+8 · 跨文化+12 · 语言+6 · 压力+6 · 信念+6',
        hintColor: 'positive',
        skillGains: { remoteSkill: 8, crossCulturalSkill: 12, languageSkill: 6 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '31岁，你没去打官司，而是把全部精力投到了"做品牌"上——办线上社群、做用户访谈直播、写深度行业内容。半年后你的用户开始自发安利："抄的那个便宜但没人理，这家的创始人是真人。"你发现：功能是商品，信任是资产。抄得走代码，抄不走关系。',
      },
      {
        id: 'out_innovate',
        label: '用更快的迭代甩开抄袭者',
        description: '他们抄的是你三个月前的版本，你领先三个月就够了',
        hint: '远程能力+12 · 压力+12 · 健康-5 · 信念+5 · 月薪+1500',
        hintColor: 'positive',
        skillGains: { remoteSkill: 12 },
        salaryChange: 1500,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '31岁，你进入了"两周一个大版本"的节奏，把抄袭者永远甩在身后。他们抄的是你上个月的，你已经上线了下个月的功能。代价是你的发际线和睡眠。你赢了，但你不确定这种"领先"能撑多久——毕竟你也终会累。',
      },
      {
        id: 'acquire_or_partner',
        label: '主动联系抄袭者，谈合作或收购',
        description: '打不过就收编，化敌为友',
        hint: '远程能力+8 · 跨文化+10 · 语言+8 · 压力+4 · 信念+4',
        hintColor: 'neutral',
        skillGains: { remoteSkill: 8, crossCulturalSkill: 10, languageSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '31岁，你给那个抄袭者发了封邮件："与其互相消耗，不如聊聊？"对方震惊了一周才回。最后你们没合并，但达成了"差异化定位"的默契——你做高端，他做下沉，各赚各的。你学到：商业里最大的杠杆不是打败对手，是把对手变成生态的一部分。',
      },
    ],
  },

  // 32岁：recurring revenue 里程碑
  {
    id: 'nomad_entrepreneur_recurring',
    title: '复利',
    sceneTag: 'home',
    pathId: 'digital_nomad',
    branch: 'nomad_entrepreneur',
    ageRange: [32, 32],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '你的MRR（月经常性收入）第一次突破了五万美元。你盯着Stripe后台那个数字，算了一下：这意味着即使你下个月什么都不做，也有五万进账。再算上年度订阅的预付，你的现金流第一次"溢出"了你的生活成本。\n' +
      '这是一种陌生而危险的踏实感。过去七年你一直在"拼命让公司活下去"，现在公司不仅活着，还在替你赚钱。你第一次有了一种"可以停下来想想"的奢侈。\n' +
      '但你也敏锐地察觉到一种新风险：当你不再"饿"的时候，你的野心会不会也一起睡着？复利是甜的，也是催眠的。',
    options: [
      {
        id: 'reinvest_growth',
        label: '把利润全部再投入，赌更大增长',
        description: '趁势扩张，把MRR做到六位数',
        hint: '远程能力+10 · 跨文化+6 · 压力+8 · 信念+6 · 月薪+3000',
        hintColor: 'positive',
        skillGains: { remoteSkill: 10, crossCulturalSkill: 6 },
        salaryChange: 3000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '32岁，你没分红，把利润全砸进了新市场和团队扩张。一年后MRR破了十万，但也养出了一支臃肿的团队和失控的成本。你学到了"增长瘾"的代价——不是所有增长都是好增长，有些只是虚荣指标在膨胀。',
      },
      {
        id: 'optimize_profit',
        label: '不追增长，把利润率做到极致',
        description: '砍掉烧钱项目，做一台高利润的机器',
        hint: '远程能力+8 · 被动收入+15000/年 · 压力-6 · 信念+5',
        hintColor: 'positive',
        skillGains: { remoteSkill: 8 },
        passiveIncomeChange: 15000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '32岁，你停止了烧钱获客，转而把留存和续费做到极致。MRR没涨多少，但利润率翻倍，分红进了口袋。你第一次给自己发了笔"老板工资"之外的分红，看着到账的数字想：原来"赚钱"和"长大"是两件事。',
      },
      {
        id: 'delegate_stepback',
        label: '把日常交给团队，自己退到战略层',
        description: '从CEO变"董事会主席"，买回自己的时间',
        hint: '远程能力+12 · 跨文化+8 · 幸福+8 · 压力-8 · 信念+6',
        hintColor: 'positive',
        skillGains: { remoteSkill: 12, crossCulturalSkill: 8 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress - 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '32岁，你提拔了运营负责人做"代理CEO"，自己退到只管战略和融资。第一周你无所事事到焦虑，第二周你开始享受"不被会议绑架"的清晨。你第一次相信了一句话：创始人最高级的成功，是让自己变得"不重要"。',
      },
    ],
  },

  // 34岁：退出机会
  {
    id: 'nomad_entrepreneur_exit',
    title: '套现',
    sceneTag: 'cafe',
    pathId: 'digital_nomad',
    branch: 'nomad_entrepreneur',
    ageRange: [34, 34],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    narrative:
      '一家更大的公司找上门，想收购你的产品。开价是你年利润的4倍，一次性买断。你看着那个数字，手心出汗——这是一笔能让你瞬间"上岸"的钱。\n' +
      '但对方有个条件：你要留下来做两年"过渡期"，而且产品会被整合进他们的体系，你的品牌大概率会消失。等于说，你卖掉的不只是公司，是你过去九年的一块身份。\n' +
      '你想起九年前那个在巴厘岛咖啡馆上线第一个产品的夜晚。那时你一无所有，只有一台电脑和一个想法。现在有人愿意用一笔钱，买走那个"想法长出来的东西"。你该卖吗？还是说，有些东西不该卖？',
    options: [
      {
        id: 'take_the_exit',
        label: '卖掉，落袋为安',
        description: '拿钱走人，用这笔钱实现真正的财务自由',
        hint: '存款+200000 · 幸福+10 · 压力-12 · 信念+8 · 健康+5',
        hintColor: 'positive',
        savingsChange: 200000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.stress = clamp(s.stress - 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.health = clamp(s.health + 5, 0, 100);
        },
        log: '34岁，你签了收购协议。交割那天你看着银行账户多出来的零，有一种不真实感。你在过渡期帮新东家整合产品，两年后彻底脱手。从此你不再是"那个做XX的创始人"，但你银行里的数字，足够你做任何想做的事——包括什么都不做。',
      },
      {
        id: 'reject_stay_independent',
        label: '不卖，保持独立',
        description: '这笔钱不够买你的自由，你要自己掌控命运',
        hint: '远程能力+8 · 跨文化+6 · 信念+12 · 压力+4 · 但保留资产',
        hintColor: 'neutral',
        skillGains: { remoteSkill: 8, crossCulturalSkill: 6 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.stress = clamp(s.stress + 4, 0, 100);
        },
        log: '34岁，你拒了那个offer。朋友说你"疯了"，但你心里清楚：你做这家公司从来不是为了卖掉它。你要的是一个"完全属于自己"的东西——这种所有权，比任何套现都值钱。你赌的是：独立带来的复利，会超过一次性套现。',
      },
      {
        id: 'partial_exit',
        label: '卖一部分股权，套现+保留控制权',
        description: '卖给投资人少数股权，拿钱但留控制权',
        hint: '远程能力+6 · 跨文化+8 · 存款+80000 · 信念+6 · 压力+2',
        hintColor: 'positive',
        skillGains: { remoteSkill: 6, crossCulturalSkill: 8 },
        savingsChange: 80000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.stress = clamp(s.stress + 2, 0, 100);
        },
        log: '34岁，你没全卖，而是出让了30%股权给一家成长型基金。拿了一笔可观的现金落袋，同时保留了对公司的控制权。你既有了"上岸"的安全感，又没失去"船长"的身份。你发现：商业里最高级的操作，不是非黑即白，是找到那个"既要又要"的平衡点。',
      },
    ],
  },

  // 35岁：地点无关的真正含义
  {
    id: 'nomad_entrepreneur_location_free',
    title: '真正的自由',
    sceneTag: 'co_living',
    pathId: 'digital_nomad',
    branch: 'nomad_entrepreneur',
    ageRange: [35, 35],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你坐在京都一家百年町屋里，窗外的枫叶红了。你的公司有12个员工，分布在8个国家，全自动运转，你一个月只需要开两次会。\n' +
      '过去十年你住过二十多个国家，但"地点无关"这四个字，到今天才真正成立——不是因为你能在任何地方工作，而是因为你不再需要在任何地方工作。公司替你赚钱，你替自己生活。\n' +
      '你想起25岁那个在巴厘岛天台上做选择的夜晚。那时"地点无关的生意"只是一个赌注，现在它成了一台机器。你看着枫叶飘落，第一次有了一种"够了"的平静——不是赚够了，是终于分清了"想要"和"需要"。',
    options: [
      {
        id: 'become_investor',
        label: '转型做天使投资人，投其他游民创业者',
        description: '用经验和资本，帮下一代"你"少走弯路',
        hint: '远程能力+8 · 跨文化+12 · 语言+6 · 被动收入+15000/年 · 信念+8',
        hintColor: 'positive',
        skillGains: { remoteSkill: 8, crossCulturalSkill: 12, languageSkill: 6 },
        passiveIncomeChange: 15000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.happiness = clamp(s.happiness + 6, 0, 100);
        },
        log: '35岁，你开始用赚来的钱投早期的游民创业者。你投的不只是钱，是你十年踩坑换来的"避雷指南"。看着那些年轻的脸像当年的你一样眼里有光，你有一种奇妙的传承感——你的自由，正在通过别人的事业继续复利。',
      },
      {
        id: 'write_the_playbook',
        label: '写一本"游民创业指南"，把方法论沉淀下来',
        description: '把你十年的跨境创业经验写成书/课',
        hint: '跨文化+10 · 语言+8 · 被动收入+15000/年 · 幸福+8 · 信念+6',
        hintColor: 'positive',
        skillGains: { crossCulturalSkill: 10, languageSkill: 8 },
        passiveIncomeChange: 15000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '35岁，你花了半年写完了《地理套利者》。书出版那天你收到上百条私信："谢谢你，我终于敢出发了。"你看着那些留言，眼眶有点湿——原来你十年走过的弯路，最大的价值不是让你少走，是让别人不必走。',
      },
      {
        id: 'truly_retire',
        label: '真正退休，把公司交给团队',
        description: '彻底退出日常，做一个"前创始人"',
        hint: '幸福+12 · 压力-15 · 健康+8 · 信念+10 · 被动收入+10000/年',
        hintColor: 'positive',
        passiveIncomeChange: 10000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 12, 0, 100);
          s.stress = clamp(s.stress - 15, 0, 100);
          s.health = clamp(s.health + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
        },
        log: '35岁，你把CEO的位置交给了跟了你六年的运营负责人，自己只保留股东身份。交棒那天你清理了Slack通知，关掉了邮箱推送。走出办公室那一刻，你回头看了眼这台运转良好的机器——它不再需要你了。这就是你十年前赌的"地点无关"的终极形态：连你自己都可以不在场。',
      },
    ],
  },
];

// ============================================================
// 跨境咨询线事件（nomad_consultant，ages 26-36）
// ============================================================

const consultantEvents: NarrativeEvent[] = [

  // 26岁：第一笔咨询费
  {
    id: 'nomad_consultant_first_engagement',
    title: '第一笔咨询费',
    sceneTag: 'co_living',
    pathId: 'digital_nomad',
    branch: 'nomad_consultant',
    ageRange: [26, 26],
    priority: 8,
    weight: 10,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '一个在巴厘岛认识的德国创业者在LinkedIn上找到你，说他们的产品想进入东南亚市场，问你愿不愿意"聊聊"。\n\n' +
      '你原本以为只是一次免费的coffee chat，聊到一半他突然问："你这个咨询怎么收费？"你愣住了——你从来没想过自己的经验可以单独卖钱。\n\n' +
      '你深吸一口气，报了一个自己觉得"有点过分"的数字：每小时200美元。对面沉默了两秒，说："可以，我们先买10个小时。"\n\n' +
      '挂掉视频电话后你坐在 coworking space 的椅子上，心跳得很厉害。两千美元，聊十个小时天。你第一次意识到：你走过的路、踩过的坑、跨过的文化，本身就是一种产品。',
    options: [
      {
        id: 'accept_consulting',
        label: '接下这单，认真对待',
        description: '把它当成一份真正的咨询项目来做，而不是闲聊',
        hint: '远程能力+6 · 语言+8 · 跨文化+8 · 存款+4000 · 信念+8',
        hintColor: 'positive',
        skillGains: { remoteSkill: 6, languageSkill: 8, crossCulturalSkill: 8 },
        savingsChange: 4000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        log: '26岁，你接了人生第一笔咨询单——每小时200美元，10小时。你认真做了proposal、列了交付物清单。对方收到后回复："比我们请过的咨询公司还专业。"你这才明白：你的经验不是闲聊素材，是真金白银的知识资产。',
      },
      {
        id: 'discount_consulting',
        label: '给个友情价，先攒口碑',
        description: '报低一点，用这个案例去吸引更多客户',
        hint: '语言+5 · 跨文化+5 · 存款+1500 · 信念+4 · 压力+3',
        hintColor: 'neutral',
        skillGains: { languageSkill: 5, crossCulturalSkill: 5 },
        savingsChange: 1500,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          s.stress = clamp(s.stress + 3, 0, 100);
        },
        log: '26岁，你给了个半价"友情价"接下了第一单咨询。交付时客户很满意，但你心里清楚：你贱卖了自己的经验。下次绝不再这样了。',
        isRestOption: true,
      },
    ],
  },

  // 27岁：找到定位
  {
    id: 'nomad_consultant_positioning',
    title: '你到底咨询什么',
    sceneTag: 'co_living',
    pathId: 'digital_nomad',
    branch: 'nomad_consultant',
    ageRange: [27, 27],
    priority: 7,
    weight: 9,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '第一单咨询做完后，陆续有人找上门来。但问题也随之而来——有人问你做不做技术选型，有人问你做不做品牌出海，有人问你做不做供应链对接。\n\n' +
      '你什么都接了，什么都做了，然后发现自己累得半死，做的每件事都只有60分。\n\n' +
      '一个做了二十年咨询的前辈在 coworking space 的咖啡机旁跟你说："咨询不是什么都做，是只做一件事——做到别人想到这件事就想到你。你现在的问题不是客户太少，是定位太散。"',
    options: [
      {
        id: 'focus_cross_border',
        label: '聚焦"跨境市场进入"咨询',
        description: '只做帮助公司进入新市场的咨询，其他全部拒绝',
        hint: '远程能力+8 · 跨文化+12 · 被动收入+3000/年 · 信念+8 · 压力-5',
        hintColor: 'positive',
        skillGains: { remoteSkill: 8, crossCulturalSkill: 12 },
        passiveIncomeChange: 3000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
        },
        log: '27岁，你做了一个痛苦但正确的决定：拒绝所有非"跨境市场进入"的咨询需求。头两个月收入暴跌，你慌得睡不着。但第三个月，三个客户主动找上门——因为他们听说你是"做跨境进入最专业的那个人"。你终于明白了前辈的话：定位就是放弃。',
      },
      {
        id: 'stay_generalist',
        label: '继续什么单都接',
        description: '先把收入做上去，定位以后再说',
        hint: '远程能力+5 · 语言+5 · 存款+5000 · 压力+12 · 信念-3',
        hintColor: 'negative',
        skillGains: { remoteSkill: 5, languageSkill: 5 },
        savingsChange: 5000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 3, 0, 100);
        },
        log: '27岁，你选择继续当"万金油"咨询师。收入确实更高了，但每天在完全不同的领域之间切换，脑子像被人搅拌过。你开始怀疑：到底是在做咨询，还是在打零工？',
      },
    ],
  },

  // 28岁：高客单价客户
  {
    id: 'nomad_consultant_high_ticket',
    title: '一份不敢接的合同',
    sceneTag: 'video_call',
    pathId: 'digital_nomad',
    branch: 'nomad_consultant',
    ageRange: [28, 28],
    priority: 8,
    weight: 9,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '一家日本上市公司通过朋友介绍找到了你。他们的新产品线想进入东南亚六个国家，需要一个"懂当地市场又懂日本企业文化"的顾问。\n\n' +
      '前期沟通很顺利。直到对方发来了合同草案——三个月的项目，报价12万美元。\n\n' +
      '你盯着那个数字看了整整五分钟。你上一年的总收入都没这么多。你的手心开始出汗，脑子里冒出一连串问题：我值这个价吗？万一搞砸了怎么办？他们会不会发现我其实没那么厉害？\n\n' +
      '但另一个声音说：如果你连这个都不敢接，你凭什么说自己是个咨询顾问？',
    options: [
      {
        id: 'take_big_contract',
        label: '签下它，拼了',
        description: '接下12万美元的大单，用成果证明自己',
        hint: '远程能力+10 · 跨文化+12 · 语言+8 · 存款+30000 · 压力+15 · 信念+10',
        hintColor: 'positive',
        skillGains: { remoteSkill: 10, crossCulturalSkill: 12, languageSkill: 8 },
        savingsChange: 30000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 15, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
        },
        log: '28岁，你签下了人生第一份六位数美元的咨询合同。手抖着签完字那天你吐了——不是夸张，是真的吐了。但三个月后交付完毕，客户CFO发邮件说："你给我们省了至少两百万美元的试错成本。"你把那封邮件截图保存了下来，每次自我怀疑时就翻出来看看。',
      },
      {
        id: 'negotiate_down',
        label: '谈一个更安全的范围',
        description: '缩小项目范围，降低报价，减少风险',
        hint: '远程能力+6 · 跨文化+8 · 存款+12000 · 信念+5 · 压力+5',
        hintColor: 'neutral',
        skillGains: { remoteSkill: 6, crossCulturalSkill: 8 },
        savingsChange: 12000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '28岁，你把12万的合同砍到了4万，只做自己最有把握的部分。项目顺利完成，但你心里一直有个"如果"：如果当初全接了，会怎样？你告诉自己这是稳健，但深夜里你知道那不全是稳健，还有怕。',
        isRestOption: true,
      },
    ],
  },

  // 29岁：文化桥梁
  {
    id: 'nomad_consultant_cultural_bridge',
    title: '两个世界的翻译官',
    sceneTag: 'conference',
    pathId: 'digital_nomad',
    branch: 'nomad_consultant',
    ageRange: [29, 29],
    priority: 7,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '你正在协调一个中德合作项目。中方团队觉得德方"太慢、太死板"，德方团队觉得中方"太急、太随意"。\n\n' +
      '你在中间当翻译——不是语言的翻译，是文化的翻译。你跟中方说"他们需要看到完整的文档才会行动"，跟德方说"他们需要先建立信任才会分享信息"。\n\n' +
      '一个德国工程师私下跟你说："你是唯一一个既理解我们的方式、又能跟他们沟通的人。"一个中方经理也跟你说："有你在，我们才敢跟德国人提要求。"\n\n' +
      '你突然意识到：你的价值不是"懂某个市场"，而是"同时懂两个世界，并且能让他们彼此懂对方"。这种能力，不是读几本书就能学来的——是你在路上走了七年才磨出来的。',
    options: [
      {
        id: 'deepen_bridge_role',
        label: '把"文化桥梁"做成你的核心品牌',
        description: '不再只做市场进入，而是做跨国团队协作咨询',
        hint: '跨文化+12 · 语言+8 · 被动收入+5000/年 · 信念+10 · 幸福+5',
        hintColor: 'positive',
        skillGains: { crossCulturalSkill: 12, languageSkill: 8 },
        passiveIncomeChange: 5000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        log: '29岁，你找到了自己真正的定位：不做市场分析，做文化翻译。你帮跨国团队拆解误解、建立信任、对齐预期。你的报价单上多了一行字："跨境协作与文化桥接顾问"。客户们开始把你当"不可或缺的人"——不是因为你懂技术，是因为没有你，他们连会都开不起来。',
      },
      {
        id: 'stay_market_focus',
        label: '继续做市场进入，不转型',
        description: '文化桥梁太虚了，还是市场分析更实在',
        hint: '远程能力+6 · 跨文化+6 · 存款+8000 · 信念+3',
        hintColor: 'neutral',
        skillGains: { remoteSkill: 6, crossCulturalSkill: 6 },
        savingsChange: 8000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '29岁，你选择不转型。市场进入咨询虽然"硬核"但好交付、好报价。你在中德项目里扮演的"文化翻译"角色让你印象深刻，但你没有把它变成主业。也许某天你会后悔这个选择——也许不会。',
        isRestOption: true,
      },
    ],
  },

  // 30岁：旅途倦怠
  {
    id: 'nomad_consultant_burnout',
    title: '第十三个机场',
    sceneTag: 'airport',
    pathId: 'digital_nomad',
    branch: 'nomad_consultant',
    ageRange: [30, 30],
    priority: 8,
    weight: 9,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '你的护照上又多了一个章。今年你已经飞了13次国际航班，去了8个国家，住了23家酒店和17个Airbnb。\n\n' +
      '你的收入很好，你的客户很好，你的评价很好。但你坐在东京羽田机场的候机厅里，看着航班信息板发呆，突然什么都感觉不到了。\n\n' +
      '不是累，是空。你开始分不清自己在哪个城市、哪个时区。你的生物钟彻底紊乱了，凌晨三点醒来不知道该吃早饭还是晚饭。你手机里的日历密密麻麻，但找不到一天是"空"的。\n\n' +
      '一个同在咨询圈的朋友说："这不是倦怠，这是空心。你的身体在动，但你的心已经不想动了。"',
    options: [
      {
        id: 'slow_down',
        label: '减少出差，转为远程交付',
        description: '把50%的线下会议改成视频，给自己喘息空间',
        hint: '远程能力+10 · 健康+10 · 压力-15 · 存款-8000 · 信念+5',
        hintColor: 'positive',
        skillGains: { remoteSkill: 10 },
        savingsChange: -8000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.health = clamp(s.health + 10, 0, 100);
          s.stress = clamp(s.stress - 15, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '30岁，你做了一个"反直觉"的决定：减少了出差。你开始拒绝必须到场的会议，转而用远程协作工具完成交付。收入少了一些，但你终于能在同一个城市待超过两周了。你在里斯本租了一个月的公寓，每天早上在阳台上喝咖啡，看着楼下的电车慢慢驶过。你想起朋友的话——空心，得先停下来才能填满。',
        isRestOption: true,
      },
      {
        id: 'push_through',
        label: '咬咬牙继续跑',
        description: '现在正是上升期，不能停',
        hint: '跨文化+8 · 存款+15000 · 压力+15 · 健康-10 · 信念-5',
        hintColor: 'danger',
        skillGains: { crossCulturalSkill: 8 },
        savingsChange: 15000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 15, 0, 100);
          s.health = clamp(s.health - 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
        },
        log: '30岁，你选择了继续跑。收入确实在涨，但你开始忘记自己为什么出发了。每次落地一个新城市，你不再兴奋，只剩疲惫。你在飞机上吃安眠药，在会议室里喝双倍浓缩，在酒店里对着天花板失眠。你赚到了钱，但花在了买褪黑素上。',
      },
    ],
  },

  // 31岁：思想领导力
  {
    id: 'nomad_consultant_thought_leader',
    title: '有人开始引用你的话',
    sceneTag: 'conference',
    pathId: 'digital_nomad',
    branch: 'nomad_consultant',
    ageRange: [31, 31],
    priority: 7,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '你在LinkedIn上发了一篇关于"文化智商在跨境商业中的决定性作用"的长文。本来只是随手写的，结果三天内获得了20万阅读量，转发超过3000次。\n\n' +
      '更让你意外的是，几个行业大会开始邀请你做演讲。一家商学院请你去做客座讲师。一个播客主理人专程飞到你的城市采访你。\n\n' +
      '你发现自己的角色在悄悄变化——从"帮人做事的顾问"变成了"帮人想事的专家"。来找你的人不再只是问"你能帮我们做什么"，而是问"你怎么看这个问题"。\n\n' +
      '你有点不适应。当顾问是交付，当专家是输出。前者有边界，后者没有。你不确定自己准备好了。',
    options: [
      {
        id: 'build_personal_brand',
        label: '顺势打造个人品牌',
        description: '开始系统化输出内容，建立行业影响力',
        hint: '语言+8 · 跨文化+8 · 被动收入+8000/年 · 信念+10 · 压力+5',
        hintColor: 'positive',
        skillGains: { languageSkill: 8, crossCulturalSkill: 8 },
        passiveIncomeChange: 8000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.stress = clamp(s.stress + 5, 0, 100);
        },
        log: '31岁，你开始认真经营个人品牌。每周一篇长文，每月一次播客，每季度一次公开演讲。你的关注者从几千涨到了几万。你的咨询报价翻了一倍——因为"你不是在卖时间，是在卖认知"。有客户跟你说："我们找你不是因为你便宜，是因为你在这个领域有声音。"你第一次体会到了"思想也能变现"的感觉。',
      },
      {
        id: 'stay_behind_scenes',
        label: '保持低调，只做交付',
        description: '影响力是双刃剑，专注做项目就好',
        hint: '远程能力+6 · 跨文化+6 · 存款+10000 · 信念+3',
        hintColor: 'neutral',
        skillGains: { remoteSkill: 6, crossCulturalSkill: 6 },
        savingsChange: 10000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '31岁，你选择了低调。文章火了之后你没有继续输出，而是默默回到了项目交付中。客户质量在提升，但你始终是一个"行业内知名、行业外无名"的人。有时候你会想：如果我当初顺势做了个人品牌，现在会是什么样？',
        isRestOption: true,
      },
    ],
  },

  // 32岁：把一次性变成长期
  {
    id: 'nomad_consultant_recurring',
    title: '从卖项目到卖订阅',
    sceneTag: 'home',
    pathId: 'digital_nomad',
    branch: 'nomad_consultant',
    ageRange: [32, 32],
    priority: 7,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '你做了一个计算：过去三年你做了14个咨询项目，收入不错，但每个项目结束后都要重新找下一个客户。你永远在"狩猎模式"，从不在"农耕模式"。\n\n' +
      '一个做SaaS的朋友说了一句话点醒了你："你应该卖订阅，不是卖项目。把你的知识变成一个持续的服务，让客户每月付费。"\n\n' +
      '你开始设计一个"跨境成长顾问"的订阅服务——每月固定费用，客户提供随时咨询、季度市场报告、月度战略会议。你给三个老客户发了方案，两个当晚就回了"我要"。',
    options: [
      {
        id: 'launch_subscription',
        label: '推出订阅制咨询服务',
        description: '把一次性项目变成月度订阅，创造稳定收入',
        hint: '远程能力+8 · 被动收入+15000/年 · 信念+10 · 幸福+8 · 压力-5',
        hintColor: 'positive',
        skillGains: { remoteSkill: 8 },
        passiveIncomeChange: 15000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
        },
        log: '32岁，你推出了订阅制咨询。五个老客户签约，每月固定收入覆盖了你的全部生活开销。你第一次不必为"下个月的客户在哪里"而焦虑了。你在清迈的公寓里对着屏幕笑了很久——这不是退休，但这是"不用再狩猎"的自由。你终于理解了什么叫"被动的心智"。',
      },
      {
        id: 'keep_project_based',
        label: '继续做项目制',
        description: '订阅太重了，项目制更灵活',
        hint: '跨文化+5 · 存款+12000 · 信念+3',
        hintColor: 'neutral',
        skillGains: { crossCulturalSkill: 5 },
        savingsChange: 12000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '32岁，你选择继续做项目制咨询。灵活是灵活了，但你依然在每个项目间隙焦虑地找下一个。你偶尔会想起朋友说的"卖订阅"那句话，然后摇摇头继续写proposal。',
        isRestOption: true,
      },
    ],
  },

  // 33岁：与大厂合作
  {
    id: 'nomad_consultant_partnership',
    title: '四大要跟你合作',
    sceneTag: 'cafe',
    pathId: 'digital_nomad',
    branch: 'nomad_consultant',
    ageRange: [33, 33],
    priority: 8,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '一封来自德勤的邮件躺在你的收件箱里。他们想跟你签一份"专家网络合作协议"——当他们的客户需要跨境市场进入方面的深度 expertise 时，会以你的名义出具报告，你拿专家费。\n\n' +
      '这对你的品牌是巨大的背书。德勤的客户都是大型企业，单子大、周期长、收费高。但条件也很苛刻：你需要签署排他性条款，不能同时为他们的竞争对手提供类似服务。\n\n' +
      '你拿着这封邮件坐在巴塞罗那的咖啡馆里，面前是一杯已经凉了的cortado。跟大厂合作意味着稳定、高端、有背书；但也意味着你从一个"自由的个体咨询顾问"变成了"大厂生态里的一个节点"。你的自由，会不会被这一纸合同稀释？',
    options: [
      {
        id: 'sign_partnership',
        label: '签约，借大厂的平台起飞',
        description: '用德勤的背书打开大企业客户市场',
        hint: '跨文化+10 · 语言+6 · 被动收入+12000/年 · 信念+8 · 压力+8',
        hintColor: 'positive',
        skillGains: { crossCulturalSkill: 10, languageSkill: 6 },
        passiveIncomeChange: 12000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
        },
        log: '33岁，你跟德勤签了专家合作协议。第一次以"德勤合作专家"的身份出现在客户面前时，对方的态度明显不同了——不再是"你一个人靠谱吗"的质疑，而是"大厂都认可你"的信任。你的报价单又涨了30%。但深夜里你偶尔会想：现在来找你的人，到底是因为你，还是因为你背后的logo？',
      },
      {
        id: 'stay_independent',
        label: '保持独立，拒绝排他',
        description: '你可以合作，但不能被绑死',
        hint: '远程能力+6 · 跨文化+6 · 存款+6000 · 信念+6 · 幸福+5',
        hintColor: 'neutral',
        skillGains: { remoteSkill: 6, crossCulturalSkill: 6 },
        savingsChange: 6000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        log: '33岁，你拒绝了排他条款，只签了非排他性的项目合作。德勤的项目你做，别的客户你也做。收入不如全签来得多，但你保住了最看重的东西——自由选择客户的权利。你在日记里写："我不想成为任何人的附属品。包括德勤。"',
        isRestOption: true,
      },
    ],
  },

  // 34岁：建立方法论
  {
    id: 'nomad_consultant_methodology',
    title: '你的方法叫什么名字',
    sceneTag: 'home',
    pathId: 'digital_nomad',
    branch: 'nomad_consultant',
    ageRange: [34, 34],
    priority: 7,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '一个客户在项目复盘时问你："你每次帮我们分析市场用的那套框架，有名字吗？我想在内部推广。"\n\n' +
      '你愣了一下。那套框架是你这些年摸索出来的——结合了文化智商模型、市场进入分析和个人经验——但你从来没给它起过名字。\n\n' +
      '那天晚上你坐在电脑前，把这套框架从头到尾写了下来。六个阶段，每个阶段有工具、有模板、有评估标准。你越写越兴奋：这不是一次咨询的方法，这是一套可以被复制、被教授、被授权的体系。\n\n' +
      '如果你把它变成一个产品——一本书、一套课程、一个认证体系——你的知识就不再只属于你一个人了。',
    options: [
      {
        id: 'productize_methodology',
        label: '把方法论产品化',
        description: '写书、做课程、建认证体系，让你的方法独立运转',
        hint: '远程能力+8 · 语言+10 · 被动收入+15000/年 · 信念+12 · 压力+8',
        hintColor: 'positive',
        skillGains: { remoteSkill: 8, languageSkill: 10 },
        passiveIncomeChange: 15000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
        },
        log: '34岁，你把那套框架命名为"跨境文化桥接模型"（CCBM），写成了一本书、做了一套在线课程、还建了一个认证体系。第一批100个学员里，有3个人后来成了你的合作顾问。你的知识第一次脱离你的身体独立运转了——就算你明天去海岛躺一个月，CCBM的课程还在为你赚钱，你的方法论还在帮别人解决问题。这就是知识产品化的终极自由。',
      },
      {
        id: 'keep_methodology_personal',
        label: '留给自己用就好',
        description: '产品化太累了，而且一旦公开就不再独特',
        hint: '跨文化+6 · 存款+8000 · 信念+4',
        hintColor: 'neutral',
        skillGains: { crossCulturalSkill: 6 },
        savingsChange: 8000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '34岁，你选择把方法论留在自己手里。你用它服务客户，但从不对外公开。你的咨询质量因此一直很高——因为只有你能用这套方法。但你也知道：这意味着你的收入永远跟你的时间绑定。你想自由，却选择了不自由的方式保护自由。',
        isRestOption: true,
      },
    ],
  },

  // 35-36岁：终极选择
  {
    id: 'nomad_consultant_endgame',
    title: '你在哪里退休',
    sceneTag: 'co_living',
    pathId: 'digital_nomad',
    branch: 'nomad_consultant',
    ageRange: [35, 36],
    priority: 9,
    weight: 10,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '你的订阅制咨询有8个长期客户，CCBM课程的年收入超过了你的咨询费，德勤的合作项目排到了明年。你的被动收入已经覆盖了你全部的生活开销——不管你在世界的哪个角落。\n\n' +
      '你坐在里斯本阿尔法玛老城的一间Airbnb阳台上，看着特茹河入海口的落日。你在想一个问题：你要在哪里"退休"？\n\n' +
      '你走过的这些年，从清迈到巴厘岛到里斯本到东京到巴塞罗那，每个地方都住过，每个地方都有记忆。但"退休"意味着你要停下来——不是停下来不工作，是停下来不再"移动"。\n\n' +
      '你想起22岁出发时的自己，那个抱着单程票在机场发抖的年轻人。TA赌的是"世界很大"。现在世界你已经看够了，接下来的问题是：哪里是你的"家"？',
    options: [
      {
        id: 'choose_base_city',
        label: '选一个城市做"基地"，开始半定居',
        description: '不再每三个月搬家，选一个地方作为"家"',
        hint: '健康+10 · 幸福+12 · 压力-12 · 信念+10 · 被动收入+5000/年',
        hintColor: 'positive',
        passiveIncomeChange: 5000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.health = clamp(s.health + 10, 0, 100);
          s.happiness = clamp(s.happiness + 12, 0, 100);
          s.stress = clamp(s.stress - 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
        },
        log: '35岁，你选了里斯本做你的"基地"。不是因为里斯本最好，是因为你在里斯本有过一段最平静的日子。你签了一年的租约——这是你十三年来第一次签超过三个月的租约。你在阳台上种了一盆罗勒，每天早上浇水时你都会想：原来"停下来的勇气"比"出发的勇气"更难。但你做到了。',
      },
      {
        id: 'keep_nomading',
        label: '继续游牧，只是节奏慢下来',
        description: '不设基地，每年只在2-3个城市轮转',
        hint: '跨文化+8 · 幸福+5 · 信念+6 · 被动收入+3000/年',
        hintColor: 'positive',
        skillGains: { crossCulturalSkill: 8 },
        passiveIncomeChange: 3000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '35岁，你没有选基地。你把节奏从"每月一个城市"调到了"每季一个城市"——里斯本三个月，清迈两个月，东京一个月。你依然在路上，但不再赶路了。有人问你"家在哪里"，你说："我的家在云端。它不是一个地方，是一种状态。"',
      },
      {
        id: 'build_consulting_firm',
        label: '趁势建一个小型咨询公司',
        description: '把个人品牌升级为机构，招募团队接更多单',
        hint: '远程能力+8 · 跨文化+8 · 存款-30000 · 被动收入+15000/年 · 信念+8 · 压力+10',
        hintColor: 'danger',
        skillGains: { remoteSkill: 8, crossCulturalSkill: 8 },
        savingsChange: -30000,
        passiveIncomeChange: 15000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.stress = clamp(s.stress + 10, 0, 100);
        },
        log: '35岁，你把个人咨询升级成了一家小型精品咨询公司。招了三个你信任的CCBM认证学员，接了更大的单子。你从"一个人"变成了"一个品牌"。白天开会带团队，晚上写书做课程。你比做游民时更忙了，但你忙得心甘情愿——因为你在建造一个比你更大的东西。',
      },
    ],
  },

];

// ============================================================
// 跨分支事件（ages 26-36，所有分支共享）
// ============================================================

const crossBranchEvents: NarrativeEvent[] = [

  // 27-28岁：签证问题
  {
    id: 'nomad_visa_issues',
    title: '你的签证还有7天到期',
    sceneTag: 'cafe',
    pathId: 'digital_nomad',
    ageRange: [27, 28],
    priority: 8,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    conditions: (s: GameState) => s.isAllInPath === true,
    narrative:
      '你打开护照看了一眼——签证还有7天到期。你本来打算再做一次"visa run"（去邻国晃一圈再回来续签），但移民局网站上挂着一条新政策：持旅游签续签的间隔从30天延长到了90天。\n\n' +
      '这意味着你不能再像以前那样"打擦边球"了。你面前有几个选项：办一个正式的数字游民签证（需要证明收入和买保险），转到另一个国家重新开始，或者——回国待一段时间。\n\n' +
      '你坐在咖啡馆里，面前的咖啡凉了也没喝。这条路你已经走了五年，但每次签证到期你都会慌。自由是有保质期的，而保质期刻在你的护照上。',
    options: [
      {
        id: 'apply_digital_nomad_visa',
        label: '申请正式的数字游民签证',
        description: '走正规渠道，证明收入，买保险，换取合法居留',
        hint: '远程能力+6 · 存款-5000 · 压力+8 · 信念+6 · 幸福+5',
        hintColor: 'positive',
        skillGains: { remoteSkill: 6 },
        savingsChange: -5000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        log: '27岁，你第一次走了"正规路"申请数字游民签证。提交了收入证明、买了国际医疗保险、等了三周审批。拿到签证那天你长舒一口气——你终于不用每隔几个月就为"能不能留下来"焦虑了。合法的自由，比灰色地带的自由踏实得多。',
      },
      {
        id: 'move_to_new_country',
        label: '换个国家重新开始',
        description: '去一个签证政策更宽松的国家',
        hint: '跨文化+8 · 语言+5 · 存款-3000 · 压力+10 · 信念+3',
        hintColor: 'neutral',
        skillGains: { crossCulturalSkill: 8, languageSkill: 5 },
        savingsChange: -3000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '27岁，你拎着行李箱飞去了格鲁吉亚——免签一年，对数字游民友好。落地第比利斯那天，你站在老城区的街头闻着 khachapuri 的香味，心想：每个新城市的第一天都是一样的——兴奋、陌生、和一点点想家。',
      },
      {
        id: 'return_home_temporarily',
        label: '先回国待一阵',
        description: '趁这个间隙回国看看父母，顺便歇歇',
        hint: '幸福+8 · 压力-10 · 健康+5 · 信念-5 · 存款-2000',
        hintColor: 'neutral',
        stateEffect: (s) => {
          ensureSkills(s);
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress - 10, 0, 100);
          s.health = clamp(s.health + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
        },
        savingsChange: -2000,
        log: '27岁，签证到期你回了国。父母看到你回来高兴得做了一大桌子菜。你在老家的床上睡了一个月以来最踏实的一觉。但两周后你开始坐立不安——你发现自己已经不适应"静止"了。你订了下一张机票。',
        isRestOption: true,
      },
    ],
  },

  // 29-30岁：旅途中的爱情
  {
    id: 'nomad_romance_road',
    title: '你在路上遇到了一个人',
    sceneTag: 'overseas_street',
    pathId: 'digital_nomad',
    ageRange: [29, 30],
    priority: 8,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    conditions: (s: GameState) => s.isAllInPath === true,
    narrative:
      'TA是在墨西哥城一个 coworking space 认识的。一个自由撰稿人，跟你一样满世界跑。你们一起吃了taco，一起看了Frida Kahlo的展览，一起在Roma Norte的街头喝mezcal喝到天亮。\n\n' +
      '你们在一起三个月了。但问题已经很现实了——TA的下一站是布宜诺斯艾利斯，你的下一站是曼谷。你们都"在路上"，但路不一样。\n\n' +
      'TA昨晚问你："你愿意为我在一个城市待久一点吗？"你想了很久，说不出"愿意"，也说不出"不愿意"。你的自由和你的感情，第一次站在了对立面。',
    options: [
      {
        id: 'sacrifice_freedom_for_love',
        label: '为TA放慢脚步，尝试共同生活',
        description: '选一个城市一起住半年，看看这段关系能不能落地',
        hint: '幸福+12 · 压力-5 · 信念-5 · 跨文化+5 · 语言+5',
        hintColor: 'positive',
        skillGains: { crossCulturalSkill: 5, languageSkill: 5 },
        stateEffect: (s) => {
          ensureSkills(s);
          s.happiness = clamp(s.happiness + 12, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
        },
        log: '29岁，你为TA在墨西哥城多待了半年。你们一起买菜做饭，一起在阳台上看日落，一起吵过架又和好。你第一次体会到"漂泊的人也有日常"是什么感觉。半年后TA跟你说"我们继续走吧"——但你知道你们已经不是一个人了。',
      },
      {
        id: 'keep_independence',
        label: '保持各自的节奏，异地恋',
        description: '自由是你的一切，你不能为任何人停下',
        hint: '跨文化+8 · 信念+5 · 幸福-8 · 压力+8',
        hintColor: 'negative',
        skillGains: { crossCulturalSkill: 8 },
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.happiness = clamp(s.happiness - 8, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
        },
        log: '29岁，你选择了自由。你们约定"各自走，路上见"。TA去了布宜诺斯艾利斯，你去了曼谷。你们靠视频和消息维系着，但时差和距离像一把钝刀，慢慢割着这段关系。半年后你们在巴厘岛重逢了五天，分别时在机场哭得像生离死别。你知道这条路很难走，但你不知道还有别的走法。',
      },
      {
        id: 'let_go',
        label: '和平分手，各自安好',
        description: '你们的世界太不一样了，不如在最美的时候结束',
        hint: '信念+8 · 幸福-12 · 压力+3 · 健康-3',
        hintColor: 'danger',
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.happiness = clamp(s.happiness - 12, 0, 100);
          s.stress = clamp(s.stress + 3, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
        },
        log: '29岁，你跟TA在墨西哥城的最后一天喝了最后一杯mezcal。TA说"我理解"，你说"我也是"。你们没有争吵，没有怨恨，只有一种深深的遗憾——两个对的人，在对的时间相遇，却走在不同的路上。你在飞机上看了一路的云。',
      },
    ],
  },

  // 31-32岁：家人催回国
  {
    id: 'nomad_family_pressure',
    title: '你妈说想你了',
    sceneTag: 'video_call',
    pathId: 'digital_nomad',
    ageRange: [31, 32],
    priority: 7,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '你妈在电话里说："你爸最近身体不太好，你什么时候回来看看？"语气很平淡，但你知道这已经是她第N次暗示了。\n\n' +
      '你打开日历看了看——下个月有两个客户交付，一个月后有一个德勤的项目要启动。你算了一下时差，算了一下机票，算了一下回去之后隔离和恢复的时间。\n\n' +
      '你弟弟在微信上给你发了一条："哥，你到底还回不回来？妈嘴上不说，但她一直在等你。你在外面赚再多钱，也不能替她过生日。"\n\n' +
      '你盯着那条消息看了很久。你选择了这条路，赌的是"世界很大"。但世界再大，你妈的头发也在变白。',
    options: [
      {
        id: 'go_home_extended',
        label: '回国待两个月，陪陪父母',
        description: '调整工作安排，远程交付，回家好好陪父母',
        hint: '幸福+12 · 压力-8 · 健康+5 · 信念-3 · 存款-8000',
        hintColor: 'positive',
        savingsChange: -8000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.happiness = clamp(s.happiness + 12, 0, 100);
          s.stress = clamp(s.stress - 8, 0, 100);
          s.health = clamp(s.health + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 3, 0, 100);
        },
        log: '31岁，你订了回家的机票。你跟客户说明了情况，调整了交付节奏。你在国内待了两个月——陪爸爸去医院体检，陪妈妈去菜市场买菜，陪弟弟喝了顿酒。临走那天你妈在机场哭了，你说"我会常回来的"。但你知道你和她对"常"的理解不一样。',
        isRestOption: true,
      },
      {
        id: 'send_money_stay_away',
        label: '寄钱回去，继续在外面忙',
        description: '事业正处在关键期，不能停',
        hint: '存款-30000 · 压力+12 · 信念+3 · 幸福-10',
        hintColor: 'negative',
        savingsChange: -30000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
          s.happiness = clamp(s.happiness - 10, 0, 100);
        },
        log: '31岁，你往家里打了5万块钱，告诉弟弟"帮我照顾好爸妈"。你妈收到钱后在电话里说"我们不要钱，要你"。你握着手机在曼谷的公寓里沉默了很久，然后打开电脑继续写proposal。钱能解决很多问题，但解决不了思念。',
      },
      {
        id: 'invite_parents_to_visit',
        label: '邀请父母来你所在的国家住一阵',
        description: '让他们来看看你的世界，也让他们知道你过得好',
        hint: '跨文化+6 · 幸福+10 · 存款-15000 · 压力+5 · 信念+5',
        hintColor: 'positive',
        skillGains: { crossCulturalSkill: 6 },
        savingsChange: -15000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '31岁，你给爸妈订了来清迈的机票。他们在清迈住了一个月——你爸学会了用Google Maps导航，你妈爱上了冬阴功汤。走的时候你爸说"原来你在外面过得还行"，你妈说"下次去你说的那个里斯本看看"。你笑了，眼眶有点热——他们终于不只是在电话里"想象"你的生活了。',
      },
    ],
  },

  // 33-34岁：海外就医
  {
    id: 'nomad_health_emergency',
    title: '异国急诊室',
    sceneTag: 'hospital',
    pathId: 'digital_nomad',
    ageRange: [33, 34],
    priority: 9,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    conditions: (s: GameState) => s.isAllInPath === true,
    narrative:
      '凌晨三点你被剧烈的腹痛疼醒。你蜷缩在巴厘岛的Airbnb床上，冷汗浸透了枕头。你用颤抖的手打开Google Translate查"appendicitis"的印尼语怎么说，然后叫了一辆Grab去了最近的国际医院。\n\n' +
      '急诊室的灯很亮，护士说的英语你只听懂了一半。医生说是急性阑尾炎，需要立刻手术。你签了手术同意书——手抖得几乎写不出字。\n\n' +
      '手术很成功，但术后的几天你一个人躺在病房里，没有一个认识的人来看你。你第一次认真思考一个问题：自由和安全感，到底哪个更重要？你在世界的另一端，活蹦乱跳的时候觉得哪里都是家，但躺在病床上才发现——你哪里都不是家。',
    options: [
      {
        id: 'buy_global_insurance',
        label: '立刻买一份全球医疗保险',
        description: '这次是阑尾炎，下次不知道是什么',
        hint: '健康+8 · 存款-10000/年 · 压力-8 · 信念+5',
        hintColor: 'positive',
        savingsChange: -10000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.health = clamp(s.health + 8, 0, 100);
          s.stress = clamp(s.stress - 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '33岁，出院第一周你就买了一份覆盖全球的医疗保险。年费一万，不便宜。但你想起那个凌晨独自打Grab去医院的夜晚——那种"如果出了大事没人管"的恐惧，比任何保险费都贵。你终于明白：自由的前提是有一个安全网。',
        isRestOption: true,
      },
      {
        id: 'ignore_health_risks',
        label: '省下保险费，自己注意就好',
        description: '年轻人哪有那么脆弱，阑尾都切了还能出什么事',
        hint: '健康-5 · 存款+5000 · 信念+3 · 压力+5',
        hintColor: 'danger',
        savingsChange: 5000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.health = clamp(s.health - 5, 0, 100);
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '33岁，你省下了保险费。阑尾炎的事很快就被新的工作和旅行覆盖了。但偶尔深夜你会想起那个独自在异国病房的夜晚——那种无力感像一根刺，扎在某个你看不见的地方。',
      },
    ],
  },

];

// ============================================================
// 危机事件（ages 26-36，eventType: 'crisis'）
// ============================================================

const crisisEvents: NarrativeEvent[] = [

  // 30岁：客户流失 + 签证到期
  {
    id: 'nomad_crisis_client_visa',
    title: '雪崩的时候没有一片雪花是无辜的',
    sceneTag: 'co_living',
    pathId: 'digital_nomad',
    ageRange: [30, 31],
    priority: 10,
    weight: 10,
    oncePerGame: true,
    eventType: 'crisis',
    conditions: (s) => s.narrativeBranch !== 'unassigned' && s.isAllInPath === true,
    narrative:
      '同一天发生了两件事。\n\n' +
      '上午你最大的客户发来邮件，说因为预算削减，本季度的合同终止了。这家客户占你收入的40%。你还没来得及消化，下午又收到移民局的通知——你所在国家的数字游民签证政策变了，你的收入证明不满足新标准，续签被拒。\n\n' +
      '你有14天离境。你有40%的收入缺口。你的Airbnb还有20天到期退不回来。你的存款还够撑三个月——如果你什么都不做的话。\n\n' +
      '你坐在出租屋里，面前的笔记本电脑屏幕亮着，邮箱里是两封让你心慌的邮件。你突然觉得这个世界在提醒你：自由从来不是免费的，而账单总在最不巧的时候到。',
    options: [
      {
        id: 'emergency_pivot',
        label: '紧急转型，快速找新客户+新国家',
        description: '72小时内联系所有潜在客户，同时申请另一个国家的签证',
        hint: '远程能力+12 · 跨文化+8 · 存款-5000 · 压力+18 · 信念+8',
        hintColor: 'danger',
        skillGains: { remoteSkill: 12, crossCulturalSkill: 8 },
        savingsChange: -5000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 18, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
        },
        log: '30岁，你在72小时内做了两件事：给所有认识的人发了消息找新客户，同时申请了葡萄牙的数字游民签证。两周后你落地里斯本，三个新客户签了约——虽然收入比之前少了30%，但你活下来了。你后来在日记里写："自由不是没有风险，是能在风险中继续前行。"',
      },
      {
        id: 'retreat_home',
        label: '回国休整，等风暴过去',
        description: '暂时放弃游牧生活，回国降低成本、重建客户',
        hint: '健康+8 · 压力-10 · 信念-15 · 存款-3000 · 幸福-5',
        hintColor: 'negative',
        savingsChange: -3000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.health = clamp(s.health + 8, 0, 100);
          s.stress = clamp(s.stress - 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 15, 0, 100);
          s.happiness = clamp(s.happiness - 5, 0, 100);
        },
        log: '30岁，你回国了。父母的沙发成了你的临时基地。你用国内的低成本生活重建客户群，远程接海外单子。三个月后收入恢复了，但你心里始终有个声音在问：你是因为"暂时回去"还是"回去了就出不来了"？信念值在你心里动摇着——你不确定自己还有没有勇气再买一张单程票。',
        isRestOption: true,
      },
      {
        id: 'ask_community_help',
        label: '向数字游民社区求助',
        description: '在游民社群里发求助帖，看看有没有人能帮忙',
        hint: '跨文化+10 · 语言+5 · 存款-2000 · 压力+10 · 信念+12 · 幸福+5',
        hintColor: 'positive',
        skillGains: { crossCulturalSkill: 10, languageSkill: 5 },
        savingsChange: -2000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        log: '30岁，你在数字游民的Discord群组里发了一条求助帖。24小时内你收到了50多条回复——有人给你推荐客户，有人帮你联系葡萄牙的签证律师，有人直接说"我在里斯本有间空房，你先来住"。你坐在屏幕前哭了。你以为你是一个人在路上，但你不是——这条路你从来不是一个人走的。',
      },
    ],
  },

  // 32岁：政治动荡
  {
    id: 'nomad_crisis_political',
    title: '窗外响起了枪声',
    sceneTag: 'overseas_street',
    pathId: 'digital_nomad',
    ageRange: [32, 33],
    priority: 10,
    weight: 9,
    oncePerGame: true,
    eventType: 'crisis',
    conditions: (s) => s.narrativeBranch !== 'unassigned' && s.isAllInPath === true,
    narrative:
      '你选了一个风景优美、物价低廉的东南亚国家作为今年的基地。一切都很完美——便宜的公寓、快速的WiFi、友善的本地人。\n\n' +
      '直到那天凌晨，你被外面的喧闹声吵醒。你打开Twitter，发现这个国家发生了军事政变。街道上有军队，网络开始不稳定，ATM前排起了长龙。\n\n' +
      '大使馆发来了紧急通知：建议本国公民尽快撤离。你看着你的护照——你的国家没有撤侨能力，你得自己想办法。\n\n' +
      '你的航班被取消了三次。银行账户因为网络封锁无法转账。你手里只有500美元现金和三天份的泡面。你第一次理解了"流离失所"四个字的重量——不是旅游，不是冒险，是真的不知道明天在哪里。',
    options: [
      {
        id: 'evacuate_immediately',
        label: '不惜一切代价离开',
        description: '花高价买黑市机票，先去一个安全的国家再说',
        hint: '存款-12000 · 压力+18 · 健康-8 · 信念+5 · 跨文化+6',
        hintColor: 'danger',
        savingsChange: -12000,
        skillGains: { crossCulturalSkill: 6 },
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 18, 0, 100);
          s.health = clamp(s.health - 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '32岁，你花了三倍价格从黄牛手里买到了一张去新加坡的机票。落地樟宜机场那一刻你双腿发软，直接坐在了地板上。你看着明亮的航站楼和有序的人群，第一次觉得"秩序"是世界上最奢侈的东西。你在新加坡待了两周恢复，然后默默把"选择基地国家"的标准从"便宜"改成了"稳定"。',
      },
      {
        id: 'shelter_in_place',
        label: '留在原地，等局势稳定',
        description: '走不了也走不起，不如囤好物资等一等',
        hint: '健康-10 · 压力+18 · 信念-10 · 存款-3000 · 幸福-8',
        hintColor: 'danger',
        savingsChange: -3000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.health = clamp(s.health - 10, 0, 100);
          s.stress = clamp(s.stress + 18, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 10, 0, 100);
          s.happiness = clamp(s.happiness - 8, 0, 100);
        },
        log: '32岁，你留在了原地。断网的一周里你靠着泡面和瓶装水过活。你听到了远处的枪声和近处的哭声。两周后局势稳定了，网络恢复了，你打开邮箱发现客户们已经发了无数封"你还好吗"的邮件。你回复了"我还好"，但你知道"还好"这两个字背后藏着多少恐惧。你开始重新审视"自由"的代价。',
      },
    ],
  },

  // 34岁：全球性危机（疫情式）
  {
    id: 'nomad_crisis_pandemic',
    title: '全世界突然停了下来',
    sceneTag: 'co_living',
    pathId: 'digital_nomad',
    ageRange: [34, 35],
    priority: 10,
    weight: 10,
    oncePerGame: true,
    eventType: 'crisis',
    conditions: (s) => s.narrativeBranch !== 'unassigned' && s.isAllInPath === true,
    narrative:
      '一切发生得太快了。\n\n' +
      '周一你还在 coworking space 跟客户开视频会。周三各个国家开始关闭边境。周五你所在的城市宣布封锁。你被困在一个月租的Airbnb里，航班全部取消，签证自动延期但你也无处可去。\n\n' +
      '更糟糕的是经济影响——你的客户开始削减预算，三个项目被暂停，两个被取消。你的收入在一个月内跌了60%。\n\n' +
      '你看着窗外的空荡荡的街道，突然想起你选择这条路时的一句话："我要在任何地方都能生活。"现在你被"困在"一个地方——这讽刺得让人想笑，又笑不出来。你的自由，在一场全球危机面前不堪一击。',
    options: [
      {
        id: 'adapt_to_new_reality',
        label: '快速适应，把业务全面线上化',
        description: '开发远程咨询产品、线上课程，抓住在线经济的机会',
        hint: '远程能力+12 · 被动收入+8000/年 · 信念+10 · 压力+12 · 健康-5',
        hintColor: 'positive',
        skillGains: { remoteSkill: 12 },
        passiveIncomeChange: 8000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 12, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
        },
        log: '34岁，你在封锁的公寓里用两周时间开发了一个线上咨询产品和一个"远程团队管理"课程。全球封锁反而成了你的机会——所有公司都在学怎么远程工作，而你是这方面的专家。你的收入在三个月后不仅恢复了，还超过了疫情前。你在日记里写："危机淘汰的是不适应的人。我在路上走了十二年，适应变化是我的本能。"',
      },
      {
        id: 'wait_it_out',
        label: '削减开支，等风暴过去',
        description: '降低生活成本，用存款撑过去，不冒险',
        hint: '健康+3 · 压力+8 · 信念-8 · 存款-15000 · 幸福-5',
        hintColor: 'negative',
        savingsChange: -15000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.health = clamp(s.health + 3, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 8, 0, 100);
          s.happiness = clamp(s.happiness - 5, 0, 100);
        },
        log: '34岁，你选择了"冬眠"。搬到了更便宜的公寓，取消了一切不必要的订阅，靠着存款和微薄的项目收入过日子。每天在公寓里做饭、运动、看书、发呆。三个月后封锁解除，你走出来的时候阳光很刺眼。你活下来了，但你心里知道：你在最该出击的时候选择了防守。你不后悔，但你记住了这种感觉。',
        isRestOption: true,
      },
      {
        id: 'leverage_community',
        label: '联合游民社群，共建互助网络',
        description: '发起一个游民互助平台，共享资源和客户',
        hint: '跨文化+12 · 远程能力+8 · 被动收入+5000/年 · 信念+12 · 压力+10',
        hintColor: 'positive',
        skillGains: { crossCulturalSkill: 12, remoteSkill: 8 },
        passiveIncomeChange: 5000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
        },
        log: '34岁，你在Discord上发起了一个"游民互助网络"。300多个全球游民加入——有人分享客户资源，有人提供法律咨询，有人帮忙找便宜的住所。你不仅渡过了危机，还建立了一个比任何公司都紧密的全球社区。有人在群里说："我们不是流浪者，我们是新世界的拓荒者。"你把这句话设成了你的签名。',
      },
    ],
  },

];

// ============================================================
// 合并所有事件
// ============================================================

export const NOMAD_NARRATIVE_EVENTS: NarrativeEvent[] = [
  ...commonEvents,
  ...branchSelectEvent,
  ...freelancerEvents,
  ...entrepreneurEvents,
  ...consultantEvents,
  ...crossBranchEvents,
  ...crisisEvents,
];

// ============================================================
// 数字游牧民路径 - 叙事成就触发系统
//
// 3条分支 × 3个等级 = 9个成就。
// 技能达标后自动触发，给玩家里程碑式的成就感。
// 初级/中级成就改变人生轨迹，终极成就触发退休判定。
//
// 技能维度：
//   - remoteSkill        远程协作能力 (0-100)
//   - languageSkill      语言能力 (0-100)
//   - crossCulturalSkill 跨文化能力 (0-100)
// ============================================================

// ------------------------------------------------------------
// 自由职业线 (nomad_freelancer) —— 靠技能深度和客户多元化走通自由
// ------------------------------------------------------------

const freelancerAchievements: NarrativeAchievement[] = [
  // 初级：稳定接单的自由人
  {
    id: 'nomad_freelancer_1',
    title: '稳定接单',
    narrative: `你做到了月入稳定超过5000美元，手里有4个长期客户。你不再需要为"下个月的钱从哪来"失眠了。\n\n你打开收件箱，看到4个active项目的标签整整齐齐地排在那里。三年前你还在Upwork上投60份提案抢一个500美元的单子，现在客户主动找上门。你的时薪从25美元涨到了85美元——不是因为你变聪明了，是因为你学会了拒绝不值的活。`,
    pathId: 'digital_nomad',
    branch: 'nomad_freelancer',
    level: 1,
    skillRequirements: { remoteSkill: 35 },
    stateEffect: (state) => {
      state.currentMonthlySalary = Math.round(state.currentMonthlySalary * 1.3);
      state.pathFaith = Math.min(100, state.pathFaith + 10);
    },
    log: `你做到了月入稳定5000+美元，4个长期客户。时薪从25涨到85。你不再是"找活干的人"，而是"被找的人"。月薪+30%。`,
  },

  // 中级：领域专家
  {
    id: 'nomad_freelancer_2',
    title: '领域专家',
    narrative: `你在一个细分领域做到了"提到这个需求就想到你"的程度。你的客户名单上有三家上市公司，你的waiting list排到了三个月后。\n\n一个潜在客户在邮件里说："我们问了一圈，所有人都推荐找你。"你看着这句话愣了很久。你想起22岁时那个在Upwork上投60份提案只收到2个回复的自己。原来"不可替代"不是一个状态，是一个过程——你花了八年，终于走到了这里。`,
    pathId: 'digital_nomad',
    branch: 'nomad_freelancer',
    level: 2,
    skillRequirements: { remoteSkill: 55, languageSkill: 40 },
    passiveIncomeChange: 12000,
    stateEffect: (state) => {
      state.currentMonthlySalary = Math.round(state.currentMonthlySalary * 1.4);
      state.pathFaith = Math.min(100, state.pathFaith + 8);
    },
    log: `你在细分领域成了"提到需求就想到你"的专家。三家上市公司是你的客户，waiting list排到三个月后。月薪+40%，被动收入+12000/年。`,
  },

  // 终极：真正的地点自由
  {
    id: 'nomad_freelancer_3',
    title: '真正的地点自由',
    narrative: `你的被动收入（retainer+订阅）覆盖了你的全部生活开销。你可以在世界任何角落生活，不需要为钱工作。\n\n你在清迈的公寓里醒来，阳光透过窗帘洒在笔记本电脑上。你打开邮箱，7个retainer客户的月费已经到账。你不需要今天工作——但你还是打开了Slack，不是因为必须，是因为你想。\n\n你想起22岁那张去清迈的单程票。那时你赌的是"地理是最大的杠杆"。十三年后你证明了自己：你用全世界最低的生活成本，活出了全世界最高的自由度。你的钱赚在美元区，花在比索区，存在全球账户里。没有人能告诉你"你应该在哪里"——因为你在哪里，哪里就是你的办公室。`,
    pathId: 'digital_nomad',
    branch: 'nomad_freelancer',
    level: 3,
    skillRequirements: { remoteSkill: 75, languageSkill: 50, crossCulturalSkill: 40 },
    passiveIncomeChange: 40000,
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 12);
    },
    log: `你的被动收入覆盖了全部生活开销。你在世界任何角落都不需要为钱工作。数字游民的终极形态不是"在路上"，是"在哪里都行"。被动收入+40000/年。`,
    triggersRetirementCheck: true,
  },
];

// ------------------------------------------------------------
// 海外创业线 (nomad_entrepreneur) —— 用产品化服务实现规模化的自由
// ------------------------------------------------------------

const entrepreneurAchievements: NarrativeAchievement[] = [
  // 初级：第一个付费用户
  {
    id: 'nomad_entrepreneur_1',
    title: '第一个付费用户',
    narrative: `你的产品化服务上线第30天，收到了第一笔付费订单。$49/月。数字不大，但你在 coworking space 里跳了起来。\n\n你截了图发给所有你认识的人。你的前同事回复"恭喜"，你妈回复"注意身体"，你的合伙人发了一串烟花表情。但你知道这个$49意味着什么——它意味着你的知识可以脱离你的时间独立变现了。这不是咨询费，这是"睡后收入"的第一滴。`,
    pathId: 'digital_nomad',
    branch: 'nomad_entrepreneur',
    level: 1,
    skillRequirements: { remoteSkill: 30, crossCulturalSkill: 25 },
    savingsChange: -5000,
    passiveIncomeChange: 3000,
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 12);
    },
    log: `你的产品化服务上线第30天，第一笔$49/月到账。你跳了起来。这不是钱，是"你的知识可以脱离时间独立变现"的证明。被动收入+3000/年。`,
  },

  // 中级：recurring revenue里程碑
  {
    id: 'nomad_entrepreneur_2',
    title: '月入万美元',
    narrative: `你的产品化服务月度recurring revenue突破了10000美元。你有一支5人的远程团队，分布在4个时区。你的客户来自12个国家。\n\n你在月度团队会议上展示了一张图——那条MRR曲线从左下角缓慢爬升，在最近三个月突然变陡。你的菲律宾开发者、巴西设计师、印度运营、塞尔维亚客服、泰国项目经理一起鼓掌。你看着屏幕上五个不同国家的小窗口，想：这就是"地点无关"的真正含义——不是你一个人在路上，是你建造了一个不需要在同一个地方也能运转的东西。`,
    pathId: 'digital_nomad',
    branch: 'nomad_entrepreneur',
    level: 2,
    skillRequirements: { remoteSkill: 50, crossCulturalSkill: 45 },
    passiveIncomeChange: 15000,
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 10);
    },
    log: `你的产品MRR突破10000美元。5人远程团队，4个时区，12个国家客户。你建造了一个不需要在同一个地方也能运转的东西。被动收入+15000/年。`,
  },

  // 终极：地点无关的真正含义
  {
    id: 'nomad_entrepreneur_3',
    title: '你不在场，它也在转',
    narrative: `你把公司交给了团队管理，自己只保留股东身份。你在葡萄牙的一个海边小镇住了下来，每天写书、冲浪、发呆。\n\n某个周二下午你打开dashboard看了一眼——月收入又创新高。你的公司在你睡觉的时候、在你冲浪的时候、在你不想管的时候，依然在为你赚钱。你关掉dashboard，去厨房给自己泡了一杯茶。\n\n你想起25岁那年你说"一个人加一台电脑就能做跨国公司"。所有人都觉得你在说梦话。现在你的公司有8个员工、20万月收入、覆盖30个国家的客户——而你正在海边喝茶。你赌对了：地点无关不是一种生活方式，是一种商业模式的终局。`,
    pathId: 'digital_nomad',
    branch: 'nomad_entrepreneur',
    level: 3,
    skillRequirements: { remoteSkill: 70, crossCulturalSkill: 55, languageSkill: 40 },
    passiveIncomeChange: 40000,
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 12);
    },
    log: `你把公司交给团队，自己退居幕后。月收入创新高，你在海边喝茶。地点无关不是生活方式，是商业模式的终局。被动收入+40000/年。`,
    triggersRetirementCheck: true,
  },
];

// ------------------------------------------------------------
// 跨境咨询线 (nomad_consultant) —— 用知识和文化桥梁实现认知变现
// ------------------------------------------------------------

const consultantAchievements: NarrativeAchievement[] = [
  // 初级：文化桥梁
  {
    id: 'nomad_consultant_1',
    title: '文化桥梁',
    narrative: `你在三个跨境项目中扮演了"翻译官"的角色——不是语言的翻译，是文化的翻译。客户开始把你当"不可或缺的人"。\n\n一个日本客户在项目结束后给你发了一封手写的感谢信（用汉字写的），说"没有你，我们和中国团队的沟通不可能这么顺利"。你把这封信贴在了你Airbnb的冰箱上。你走过的每一个国家、学过的每一句当地话、跨过的每一次文化冲击——它们没有白费，它们变成了你的核心竞争力。`,
    pathId: 'digital_nomad',
    branch: 'nomad_consultant',
    level: 1,
    skillRequirements: { languageSkill: 35, crossCulturalSkill: 35 },
    passiveIncomeChange: 8000,
    stateEffect: (state) => {
      state.currentMonthlySalary = Math.round(state.currentMonthlySalary * 1.25);
      state.pathFaith = Math.min(100, state.pathFaith + 10);
    },
    log: `你成为跨境项目中的"文化翻译官"。日本客户给你写了手写感谢信。你走过的路变成了核心竞争力。月薪+25%，被动收入+8000/年。`,
  },

  // 中级：行业思想领袖
  {
    id: 'nomad_consultant_2',
    title: '行业思想领袖',
    narrative: `你的LinkedIn文章累计阅读量超过100万。你的CCBM方法论被三所商学院纳入课程。德勤邀请你做年度合作伙伴。\n\n你在一个行业大会上做keynote，台下坐着500人。你讲完最后一页slide时，掌声持续了整整30秒。你站在台上，聚光灯很烫，你想起22岁那个在清迈coworking space 里紧张到说不出话的自己。那时你连英语都说不利索，现在你站在500人面前用英语讲"文化智商"——而且他们在鼓掌。`,
    pathId: 'digital_nomad',
    branch: 'nomad_consultant',
    level: 2,
    skillRequirements: { crossCulturalSkill: 55, languageSkill: 50 },
    passiveIncomeChange: 15000,
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 10);
    },
    log: `你的LinkedIn文章累计阅读100万+，CCBM被三所商学院纳入课程，德勤年度合作伙伴。500人大会keynote获30秒掌声。被动收入+15000/年。`,
  },

  // 终极：知识产品化的终极自由
  {
    id: 'nomad_consultant_3',
    title: '你的知识不再需要你',
    narrative: `CCBM课程有了2000+学员，认证体系覆盖15个国家，你的方法论变成了一种行业标准。你的被动收入——课程、认证费、书籍版税——覆盖了你全部的生活开销。\n\n你在里斯本的阳台上浇花，手机响了——是CCBM东京分部的负责人，说他们本月新增了50个认证学员。你回复了"恭喜"，然后放下手机继续浇花。你的知识在东京运转着，而你在里斯本浇花。这就是知识产品化的终极自由：你创造了一个比你更大的东西，它在替你工作，替你影响世界，替你赚钱。你终于从"卖时间"进化到了"卖认知"，从"卖认知"进化到了"卖体系"。你的身体可以停下来，但你的知识不会。`,
    pathId: 'digital_nomad',
    branch: 'nomad_consultant',
    level: 3,
    skillRequirements: { languageSkill: 70, crossCulturalSkill: 70, remoteSkill: 40 },
    passiveIncomeChange: 40000,
    savingsChange: 100000,
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 12);
    },
    log: `CCBM课程2000+学员，覆盖15个国家。你的知识不再需要你亲自运转——它在替你工作、替你影响世界、替你赚钱。被动收入+40000/年，签约费100000。`,
    triggersRetirementCheck: true,
  },
];

// ============================================================
// 汇总：数字游牧民全部成就（按 分支 → 等级 排序）
// ============================================================
export const NOMAD_ACHIEVEMENTS: NarrativeAchievement[] = [
  ...freelancerAchievements,
  ...entrepreneurAchievements,
  ...consultantAchievements,
];

// ============================================================
// 自动注册（模块加载时执行）
// ============================================================
registerNarrativeEvents(NOMAD_NARRATIVE_EVENTS);
registerAchievements(NOMAD_ACHIEVEMENTS);
