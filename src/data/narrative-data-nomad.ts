/**
 * 数字游牧民路径 · 完整叙事事件库
 *
 * 三条分支：
 *   nomad_freelancer    — 自由职业线，远程接单，技能变现，客户多元化
 *   nomad_entrepreneur  — 异地创业线，打造地点无关的产品化服务，远程团队
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
      '2026年，远程工作已经不是什么新鲜事了。你在Upwork上投了六十多份提案，终于有一个客户回复了。视频面试那天你穿了最体面的衬衫，背景是出租屋贴满海报的墙。客户是个深圳的创业公司，做跨境电商SaaS，要你帮他们搭一个多语言官网，时薪180块。\n' +
      '面试时对方问你用过哪些AI工具，你说AI编程器、v0、通用大模型都熟。对方眼睛亮了一下："那效率应该很快。"挂掉电话你在屋里转了三圈，算了一笔账：180块一小时，一天8小时就是1440，一个月就是两万八——而你白天在公司加班到秃头一个月才八千。而且你用AI辅助开发，实际工时只有报价的一半。\n' +
      '你没辞职。你知道现在还不是时候——你只有这一个客户，没有缓冲金，没有长期合同。但你心里清楚：这180块一小时的东西，就是你未来的入场券。问题是，白天上班已经够累了，你该怎么分配剩下的时间？',
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
        description: '加入电鸭社区和数字游民Discord群，请教老鸟怎么起步',
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
      '你已经连续三个月白天上班、晚上接单了。白天用公司电脑写CRUD，晚上回家打开AI编程器，让AI帮你把海外客户的活儿干完——以前要熬通宵的量，现在两三个小时就能交差。你的Upwork评分从零涨到了五星，电鸭社区上也接到了两个国内远程小单，客户从一家变成了三家。但代价是：你瘦了八斤，黑眼圈重得遮瑕都盖不住，上班时组长叫你名字你要愣两秒才反应过来。\n' +
      '上周你在公司开会时睡着了，被组长叫到走廊训了一顿。你没敢说原因——总不能告诉他你用通用大模型和v0给海外客户做网站，一个月赚的比他多。2027年了，AI编程工具让你一个人顶半个团队，但组长还不知道这回事。你知道这样下去不是办法：主业和副业在抢你的命，你必须做出取舍。\n' +
      '你打开Upwork看了一眼——又有一个新客户发来消息，问你能不能接一个长期项目。电鸭社区那边也有人在问。你盯着那条消息，心里在算账：接了，副业收入正式超过主业；不接，你就能多睡两个小时。',
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
        log: '23岁，你接下了那个长期项目。从此你的生活变成了：早上9点打卡上班，下午6点下班，7点回家打开AI编程器开始给海外客户干活，AI把开发效率拉满，凌晨2点睡觉。你妈打电话问你"最近怎么样"，你说"挺好的"——你不敢说你好几个月没在凌晨前睡过了。但月底你看了一眼副业收入：28000，已经超过主业了。你攥着手机，觉得这些失眠都值了。',
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
        log: '23岁，你忍住了接新单的冲动。你把现有的三个客户维护好，不再熬夜，改用早起赶工——早上5点起床，用AI编程器和v0干两小时再上班，AI工具让效率比去年翻了一倍。同事问你"怎么最近精神好了"，你笑了笑没回答。你知道慢一点没关系，关键是能走得远。',
      },
      {
        id: 'negotiate_flex_work',
        label: '跟公司谈弹性工作制，争取更多副业时间',
        description: '申请每周两天远程办公，用省下的通勤时间接单',
        hint: '远程能力+8 · 跨文化+5 · 信念+6 · 压力-3 · 月薪+500 · 副业+3000',
        hintColor: 'positive',
        skillGains: { remoteSkill: 8, crossCulturalSkill: 5 },
        salaryChange: 500,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.currentYearSideHustle += 3000; // 省下通勤时间多接了一个海外小单
        },
        log: '23岁，你鼓起勇气找组长谈了弹性工作制。你说"我家离公司远，每周想远程两天"。组长犹豫了一下同意了——因为你的绩效一直不错，AI工具帮你把分内活儿提前干完了，他也没话说。从此每周有两天你在家办公，省下的三小时通勤全部用来接单——Upwork上接海外，电鸭社区上接国内。多出来的时间让你接了一个加急小单，到账3000块。你发现"争取自由"不是一次性的壮举，而是一寸一寸往前挪的过程。',
      },
    ],
  },

  // 23-24岁：文化冲击与语言困境
  {
    id: 'nomad_culture_shock',
    title: '另一套规则',
    sceneTag: 'street',
    pathId: 'digital_nomad',
    ageRange: [28, 30],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    conditions: (s: GameState) => s.isAllInPath === true && s.isGeoArbitrage === true,
    narrative:
      '你以为英语够用就够了，直到你在清迈的移民局排队续签签证，柜台后的官员连珠炮一样说着泰语，你全程听不懂，只能陪着笑把护照递进去。办完出来翻开护照你才发现——他给你盖的不是你申请的那种签证，但你想回去理论，又开不了口。\n' +
      '类似的挫败每天都在发生。房东在LINE上发了一长串泰语语音，你听了三遍才听懂一半；夜市卖芒果糯米饭的阿姨一口一个"farang"（老外）叫你，你笑着纠正了三次她还是这么叫；你想跟本地朋友开个玩笑，但幽默换了一种语言就变味了，他愣了两秒，礼貌地笑了。\n' +
      '巷子深处传来诵经声，混着烤肉的烟火气和芒果的甜香。你站在街角，第一次真正理解了一件事：语言不只是工具，它是一张入场券。没有它，你永远是这座城市的"客人"，而不是"参与者"。',
    options: [
      {
        id: 'learn_local_language',
        label: '死磕泰语，哪怕只会日常对话',
        description: '每天学一小时，去夜市和阿姨们练口语',
        hint: '语言+12 · 跨文化+8 · 幸福+5 · 压力+5 · 信念+4',
        hintColor: 'positive',
        skillGains: { languageSkill: 12, crossCulturalSkill: 8 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '28岁，你能用泰语点菜、砍价、跟双条车师傅讨价还价了。卖芒果糯米饭的阿姨终于不再叫你"farang"，而是叫你的小名。你第一次觉得自己"属于"这条街——哪怕只是一点点。',
        blindBoxTrigger: 'nomad_culture_shock',
      },
      {
        id: 'polish_english',
        label: '把英语磨到接近母语水平',
        description: '英语是游民圈的通用语，把这一门练到极致更划算',
        hint: '语言+12 · 远程能力+5 · 月薪+1500 · 压力+3',
        hintColor: 'positive',
        skillGains: { languageSkill: 12, remoteSkill: 5 },
        salaryChange: 1500,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 3, 0, 100);
        },
        log: '28岁，你的英语从"磕巴但能沟通"变成了"流利且有感染力"。跨国客户开会你终于不用提前写逐字稿了。你发现：在游民圈，英语水平直接等于时薪天花板。',
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
        log: '28岁，你不再执着于"融入"。你用英语工作，用AI翻译耳机生活，用旁观者的眼光看这个世界。你发现自己反而看得更清楚——因为你始终站在文化之外，没有被任何一种规则驯化。',
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
      '凌晨两点，海外客户那边的会议终于结束。你关掉会议软件，AI助手自动生成了会议纪要和待办事项，发到了你的邮箱。屋里安静得能听见冰箱的嗡嗡声。窗外是国内城市的夜，远处偶尔有出租车的喇叭声。\n' +
      '你刷开动态圈：大学室友在晒刚领的结婚证，高中同学在晒刚买的房，连那个最不争气的表弟都晒了孩子的满月照。他们的生活像一条笔直的线——稳定、可预期、被理解。而你的生活像一团毛线——白天打卡上班，深夜给地球另一边的客户写代码，AI编程器和通用大模型帮你把效率拉满，赚着美元却没时间花。没有人看得懂你在干嘛。\n' +
      '你突然很想找人说句话，但翻遍通讯录，发现没有一个人醒着——你在这个时区，你的客户在另一个。你对着AI助手说了一句"陪我聊会儿"，它礼貌地回了一段话，但你关掉了——你要的不是这个。"自由"这个词，你从未像此刻这样掂量过它的分量：它不是免费的，它的标价是孤独。你付得起吗？',
    options: [
      {
        id: 'find_nomad_tribe',
        label: '主动建立游民社交圈，对抗孤独',
        description: '每周组织一次游民聚餐，把"漂着的人"聚到一起',
        hint: '跨文化+8 · 语言+5 · 幸福+10 · 压力-5 · 信念+4 · 存款-2000',
        hintColor: 'positive',
        skillGains: { crossCulturalSkill: 8, languageSkill: 5 },
        savingsChange: -2000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '24岁，你在电鸭社区和游民社群里找到了一群同样在接海外单的"准游民"，组建了一个"深夜接单党"群，每周三在一家常去的咖啡馆聚一次。来的人换了一茬又一茬，但总有人在。你发现这种孤独不是无解的——只要你愿意先伸出手，永远有另一只手会握住你。',
        blindBoxTrigger: 'nomad_community',
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
        log: '24岁，你把孤独变成了工时。凌晨接单，清晨交活，AI工具帮你把活儿干得又快又好，日历上没有一天是空的。月底看着到账的美元你笑了一下，但关掉手机后那间屋子又空了。你用收入买到了安全感，但买不到一个可以一起吃晚饭的人。',
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
        log: '24岁，AI助手提醒你"已经三周没联系家人了"，你拨通了家里的电话。妈妈照例问"什么时候回来"，你照例说"快了"。挂掉电话你哭了一场，不是因为难过，是因为你第一次意识到：你说"快了"的时候，自己都不信。但你还是想接着走——因为你害怕的是"回来"，而不是"回不去"。',
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
      '三年了。你白天上班，晚上接单，周末混游民社群。你的Upwork评分从零涨到了五星，客户从一家变成了七八家，你的美元收入已经快要追上主业工资了。但你的抽屉里除了去过的城市车票存根什么都没有——你还没出去过。\n\n' +
      '2030年了，世界在变。你亲眼看着Upwork上那些简单的建站、数据录入、翻译外包活儿被AI一轮一轮地吃掉——报价越来越低，低到根本不值得接。你之所以还活着，是因为你早就不接那些活了：你用AI编程器和通用大模型把自己变成了一支"一人军团"，专啃那些AI替代不了的硬骨头——需要理解客户业务逻辑的定制开发、跨语言的复杂系统。你看得越来越清楚：入门级的远程工作正在消失，活下来的只会是把技能扎到AI够不着的地方的人。\n\n' +
      '你卡在了一个尴尬的位置：副业收入已经不低，但你还在国内打卡上班，时差让你每天只能睡五六个小时。你看着游民群里的照片——大理的咖啡馆、洱海的湖畔、厦门的落日——心里清楚：只要你愿意All In，那些地方就是你的办公室。但All In意味着辞职、意味着没有退路、意味着你妈会问你"好好的工作为什么要辞"。\n\n' +
      '25岁这年，你坐在出租屋里，面前是三条路。窗外是国内城市的霓虹灯，你的屏幕亮着，等你做一个决定——不是决定去哪里，而是决定在这个AI重新洗牌的世界里，你靠什么活下去。',
    options: [
      {
        id: 'choose_nomad_freelancer',
        label: '走自由职业线，靠技能深度对抗AI',
        description: '深耕一两项AI替代不了的技能，把时薪做高，把客户做稳。你赌的是：当AI吃掉所有入门级远程工作时，技能深度就是你最后的护城河。不冒险，但也不封顶。',
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
        log: '25岁，你选了最"稳"的那条路——把接单做成事业。你开始专注打磨一项AI够不着的核心技能，把零散的活变成系统化的服务。别人在追风口，你在筑地基。你赌的是：当AI把入门级远程工作的门槛压到地板，技能深度就是唯一能让你站着挣钱的东西。',
      },
      {
        id: 'choose_nomad_entrepreneur',
        label: '走异地创业线，做AI原生产品',
        description: '不再卖时间，开始卖产品/订阅。你赌的是：用AI搭建地理位置无关的生意，是这个时代最大的杠杆——一次搭建，全球收费，AI帮你把运营成本压到最低。',
        hint: '远程能力+8 · 跨文化+8 · 存款-20000 · 压力+10 · 信念+8 · 幸福+3',
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
        log: '25岁，你不再满足于"接单"。你把积蓄砸进了第一个AI原生产品的搭建——服务器、域名、支付网关，全用AI工具生成代码和客服话术。没有老板，也没有客户保底。你赌的是：这个时代，一个人加一台电脑加一堆AI，就能做一个跨国公司。',
      },
      {
        id: 'choose_nomad_consultant',
        label: '走跨境咨询线，做AI替代不了的文化桥梁',
        description: '把你的"跨国经验"变成高客单价的咨询。你赌的是：AI能翻译语言，但翻译不了文化、人情和商业潜规则——在两个世界之间当桥梁，比站在任何一边都值钱。',
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
        log: '25岁，你接了第一单付费咨询——帮一家出海企业做南方市场调研，两小时收了800美元。挂掉电话你愣了半天：AI能翻译合同，但翻译不了"这家公司老板跟当地政府关系好，走这条路更快"——原来你这几年攒下的"人肉跨文化经验"，本身就是一种AI替代不了的产品。你赌的是：文化套利，是AI时代最后的护城河。',
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
      '这两年AI工具把你交付的速度提了一倍不止——以前要磨一周的页面，现在AI半天就能出初稿。但客户也开始默认"这个速度是应该的"，甚至有人拿着AI生成的demo来压价。你心里清楚：能被AI加速的部分，早晚会被AI替代；你真正值钱的，是AI算不出来的那部分。\n' +
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
        log: '26岁，你没报工时，而是做了一份"这个网站12个月能帮你们多接多少客户"的测算，然后按收益的10%报价。对方CEO看完说"你比我们市场总监还懂生意"。你拿到了单子，也拿到了一种全新的报价思路——从此你卖的不是时间，是结果。你心里清楚：执行那部分AI迟早能做，但"读懂客户生意"这件事，AI还差得远。',
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
        description: '拒绝实时会议，全部用Loom录屏+AI摘要+文档沟通',
        hint: '远程能力+12 · 压力-8 · 幸福+5 · 健康+4 · 信念+4 · 副业+5000',
        hintColor: 'positive',
        skillGains: { remoteSkill: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 8, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.health = clamp(s.health + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          s.currentYearSideHustle += 5000; // 异步沟通腾出整块时间，多接了一个加急单
        },
        log: '27岁，你跟所有客户立了规矩：除非火烧眉毛，否则不打电话，用Loom录屏+Notion文档沟通。新出的AI异步工具帮了大忙——会议纪要自动生成、多语言团队的视频自动翻译字幕，你悉尼客户的澳洲口音再也不用反复回放猜。最初有客户不适应，但一个月后他们发现"不用约时间开会"反而更高效，AI把语言和时差的鸿沟抹平了大半。你终于能睡整觉了，时区不再是枷锁，只是墙上的一个数字。腾出来的整块时间让你多接了一个加急单，到账5000块。',
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
      '上个月你同时接了四个单子，忙到凌晨，赚了平常三个月的钱。你飘飘然地升级了短租平台，点了几天外卖，还冲动地买了张去杭州的机票。\n' +
      '这个月，四个单子全部结束，新客户一个都没着落。你发了二十封开发信，全部石沉大海。你打开银行账户，看着上个月涌进来的数字，开始精打细算——这个数字能撑几个月？如果三个月没新单，你就得降级住青旅。\n' +
      '自由职业的诅咒就在这里：忙的时候累死，闲的时候慌死。你不是在干活，就是在找活的路上。这两年冒出来的AI匹配平台倒是让找客户容易了些——算法把你推给对口的甲方，省了海投开发信的功夫；可坏处也明显，AI同样把成千上万个"和你差不多"的游民推给了同一个甲方，竞争比三年前惨烈了一倍。你看着日历上空荡荡的这周，第一次怀念起上班时那种"每月固定到账"的安全感。',
    options: [
      {
        id: 'build_pipeline',
        label: '建立"销售漏斗"，永远在找客户',
        description: '忙的时候也每天花一小时开发新客户，平滑周期',
        hint: '远程能力+12 · 跨文化+5 · 压力+5 · 信念+5 · 月薪+1000 · 副业+8000',
        hintColor: 'positive',
        skillGains: { remoteSkill: 12, crossCulturalSkill: 5 },
        salaryChange: 1000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.currentYearSideHustle += 8000; // 漏斗里转化的新客户第一单结款
        },
        log: '28岁，你给自己定了个铁律：不管多忙，每天雷打不动花一小时开发新客户。三个月后，"荒月"再也没出现过——因为你永远在漏斗里养着下一批单子。其中一个新客户的第一单结了8000块，你终于明白：自由职业的核心技能不是干活，是"持续地让人知道你能干活"。',
      },
      {
        id: 'retainer_contracts',
        label: '主攻长期 retainer 合同，锁住基础收入',
        description: '把一次性项目变成月费制长期合作',
        hint: '远程能力+8 · 被动收入+5000/年 · 信念+4 · 压力-4',
        hintColor: 'positive',
        skillGains: { remoteSkill: 8 },
        passiveIncomeChange: 5000,
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
      '你打开报价单，盯着那个数字看了很久。涨价不是改个数字那么简单，它意味着你要重新定义"我值多少"。而这两年AI把基础执行类活计的价格压得越来越低——以前能按工时收钱的活，现在客户心里都有一杆"AI也能做"的秤。你比任何时候都清楚：再不涨价，你就是在和AI比谁更便宜，而那场比赛你赢不了。这个问题的答案，从来不在报价单上，在你心里。',
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
        log: '29岁，你没涨价，而是把服务做成了三个档位的"套餐包"——基础版、专业版、旗舰版。客户买的不再是"你的时间"，而是"一个解决方案"。基础版里那些AI也能干的活，你干脆明码标价让客户自己用AI跑；真正值钱的是专业版和旗舰版里那套"诊断+策略+落地"的组合拳，AI拆不开、复制不了。客单价翻了倍，客户反而觉得更值。你第一次摸到了"产品化"的甜头——也是第一次摸到"AI啃不动"的甜头。',
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
      '你知道该分散风险了，但分散意味着要把精力从"印钞机"客户身上挪走，去开发那些"可能成、可能不成"的新客户。更让人不安的是，你听说好几个老客户开始用AI工具把原本外包给你的活收回去了——以前做不动的运营文案、简单的页面维护，现在他们自己用AI就能对付。这需要勇气——安全感，从来都是自由职业者最贵的奢侈品。',
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
        log: '30岁，你把给不同客户重复做的"建站脚手架"做成了一套模板，挂在网上卖订阅。你用AI把模板的生成、适配、文档全自动化了——买家填个表，AI就能吐出八成可用的成品，剩下两成才是他们要自己动手的。第一个月只有3个买家，但这是你第一次拥有了"睡觉时也在赚钱"的收入。被动收入的种子，种下了。',
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
      '这是一种奇怪的踏实感。前几年你还在Upwork上跟几百人抢单，现在你只需要把活干好，客户自己会来。游民圈这几年也成熟了不少，口碑不再是口口相传的玄学——出现了好几个专门的游民信誉平台，客户评价、交付准时率、合作续约率都成了可查的数据，你的评分常年挂在榜单前列。"声誉"这个词在自由职业里的分量，你算是摸到了门道——它不是虚名，是一台隐形的、24小时运转的销售机器。\n' +
      '但声誉也是把双刃剑：你接得越多，期待越高，一个失误就可能砸了攒了多年的牌子。你看着那些询盘，开始想：是继续全接，还是开始学会说"不"。',
    options: [
      {
        id: 'selective_accept',
        label: '只接能加分的项目，学会拒绝',
        description: '把不符合定位、预算太低、客户难搞的单子拒掉',
        hint: '远程能力+8 · 跨文化+6 · 幸福+6 · 压力-5 · 信念+5 · 副业+12000',
        hintColor: 'positive',
        skillGains: { remoteSkill: 8, crossCulturalSkill: 6 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 6, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.currentYearSideHustle += 12000; // 拒掉低价单后高价接了一个优质项目
        },
        log: '31岁，你第一次对一个询盘说了"No, thank you"。对方预算太低，接了只会消耗你的声誉。拒掉的那一刻你有点心疼，但更多的是释然——你终于有底气挑客户了，而不是被客户挑。腾出的产能接了一个高价位优质项目，12000块落袋，你第一次体会到"拒绝也是一种变现"。',
        blindBoxTrigger: 'nomad_client_referral',
      },
      {
        id: 'collect_testimonials',
        label: '系统化收集好评，做成作品集',
        description: '主动请老客户写推荐语，把口碑变成可见资产',
        hint: '远程能力+6 · 跨文化+8 · 被动收入+5000/年 · 信念+4',
        hintColor: 'positive',
        skillGains: { remoteSkill: 6, crossCulturalSkill: 8 },
        passiveIncomeChange: 5000,
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
        log: '31岁，你接了一个超出你单人产能的大单，把它分包给了两个游民圈的后辈。你从"干活的"变成了"管活的"，赚了差价，也操了心。好在现在有一堆AI协调工具——自动排期、进度同步、跨时区standup都能让AI代办，你管三个时区的人没比管自己累多少。你隐隐摸到了"小工作室"的雏形——也许有一天，你会从一个自由职业者，变成一个小老板。',
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
      '你坐在厦门的一家咖啡馆里，看着海上的夕阳，第一次有了一种"可以喘口气"的感觉。这些年数字游民早就不是什么新鲜词了——厦门、清迈、里斯本、巴厘岛到处都是成群的游民，咖啡馆里一半人在敲代码，签证也早就有了专门的"游民签"通道。你这座城市今年又多了好几个熟面孔，游民圈子的社交软件群每天都在加人。过去十年你一直在"找下一个客户"的treadmill上跑，现在这台机器终于有了"自动模式"。\n' +
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

  // 33岁：一个人还是一群人
  {
    id: 'nomad_freelancer_agency_transition',
    title: '一个人还是一群人',
    sceneTag: 'travel',
    pathId: 'digital_nomad',
    branch: 'nomad_freelancer',
    ageRange: [33, 33],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '你今年第三次拒绝了同一个客户的加急需求——钱你当然想赚，但一个人实在做不过来。一个人的产能到了天花板：白天赶交付，晚上回消息，周末还在改稿。你开始算账，发现今年推掉的单子加起来比你接的还多。\n' +
      '有意思的是，这两年AI把不少"苦力活"接管了——初稿生成、素材整理、批量改图这些以前要熬通宵的活，现在丢给AI半小时就出。理论上一个人加几个AI agent能顶过去三个人。但你渐渐发现，AI做得越多，"人"的部分反而越值钱：客户要的是有人能拍板、能扛事、能读懂他没说出口的需求。这些，AI替不了。\n' +
      '这时一个前同事找上门，说TA也受够了公司里那套，想跟你"一起干"。你看着TA的作品集，心里一动：如果多一双手，那些被你推掉的单子就能接回来。\n' +
      '但你又犹豫了。一个人有一个人的自在——不用分红、不用开会、不用对别人负责。一旦变成"一群人"，你就不再是自由职业者，而是"老板"。你盯着聊天框里那句"考虑一下吗"，迟迟没回。',
    options: [
      {
        id: 'build_mini_agency',
        label: '招两个人，做个小工作室',
        description: '把推掉的单子接回来，从一个人变成一支队',
        hint: '远程+8 · 跨文化+6 · 存款-10000 · 信念+10 · 压力+8',
        hintColor: 'positive',
        skillGains: { remoteSkill: 8, crossCulturalSkill: 6 },
        savingsChange: -10000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
        },
        log: '33岁，你招了两个自由职业者，搭起了一个三人的小工作室。第一个月你忙得脚不沾地——不是做活，是教人、排期、对齐标准。但第三个月，你终于把那些曾被推掉的单子接了回来。你不再是"一个人"，你成了"老板"。这个身份有点重，但你扛住了。',
      },
      {
        id: 'stay_solo_premium',
        label: '继续一个人，涨价控量',
        description: '不养人，靠提价筛掉低质需求，守住自由',
        hint: '远程+6 · 存款+8000 · 信念+5 · 压力-3',
        hintColor: 'neutral',
        skillGains: { remoteSkill: 6 },
        savingsChange: 8000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.stress = clamp(s.stress - 3, 0, 100);
        },
        log: '33岁，你把报价又涨了三成，单子少了，但每个都更值钱。你拒绝了前同事的提议，选择继续一个人。自由比规模重要——至少对现在的你来说。你在日记里写："我不想要一家公司，我想要一种生活。"',
        isRestOption: true,
      },
      {
        id: 'partner_up',
        label: '和前同事合伙，五五分账',
        description: '不雇佣而是合伙，共享客户和风险',
        hint: '远程+7 · 跨文化+8 · 存款+5000 · 被动收入+5000/年 · 信念+8 · 压力+4',
        hintColor: 'positive',
        skillGains: { remoteSkill: 7, crossCulturalSkill: 8 },
        savingsChange: 5000,
        passiveIncomeChange: 5000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.stress = clamp(s.stress + 4, 0, 100);
        },
        log: '33岁，你没招员工，而是跟前同事合伙，五五分账。TA带来一批客户，你带来交付体系，两个人各自做擅长的事。你不用当"老板"，但也不再孤单。你跟TA开玩笑："我们是两个自由职业者凑在一起，假装成一家公司。"TA说："管它叫什么，能接住单子就行。"',
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
      '通才的好处是灵活——什么活都能接，什么风口都能蹭。但坏处也很明显：你的报价永远卡在"还行"的区间，因为客户随时能找到另一个"还行"的人替代你。而更扎心的是，这几年AI把"还行"这条线啃得越来越低——以前还能接的基础建站、简单文案、模板设计，现在客户自己喂给AI就能出八成活，剩下的两成找谁都能补。通才的地盘正在被AI一寸寸吃掉，你认识的好几个老同行已经转行去了。而那些敢报天价的，都是某个细分领域里"只有他能做"的人——AI碰都不敢碰的那种深。\n' +
      '你想起一个前辈的话："通才活在机会里，专家创造机会。通才追风，专家等风来。"在这个AI追着通才跑的年代，你已经"游"了十二年，是时候决定：继续漂，还是扎一根深下去的根。',
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
        log: '34岁，你砍掉了七成不相关的业务，把全部精力砸进了一个细分领域——那些AI啃不动的、需要十年行业直觉和人情判断的活。前半年收入掉了三成，你慌过。但一年后，你成了这个圈子里"提到这个需求第一个想到的人"，客户宁可排队等你也懒得去试AI。客单价翻倍，客户排队。你终于懂了：自由不是什么都做，是有底气只做一件事——而那件事，得是AI做不了的。',
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
      '你坐在成都一家天台酒吧，看着远处的城市天际线。你的retainer收入已经覆盖了你所有的生活开销还有结余，你的客户稳定，你的时薪是十二年前出发时的八倍。\n' +
      '你想起2026年刚上路那会儿——AI还只是个会写邮件的助手，远程工作算"特例"，游民签证全球拢共没几个国家认。这才几年？AI把半个行业洗了一遍，远程办公成了默认选项，连你妈都学会了在视频里问"你那个nomad visa续了没"。世界变了，你也变了。\n' +
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
        log: '35岁，你在动态圈发了一条："从今天起，我只接让我兴奋的活。"下面一堆人问"你财务自由了？"你回了个笑脸。你知道"自由"不是不用工作，是终于有底气对不想做的事说不。十二年前那张去大理的单程票，终于在今天兑现了。',
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
        hint: '跨文化+10 · 语言+6 · 幸福+10 · 信念+8 · 被动收入+4000/年',
        hintColor: 'positive',
        skillGains: { crossCulturalSkill: 10, languageSkill: 6 },
        passiveIncomeChange: 4000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '35岁，你把十二年的游民经验做成了一套免费入门课，挂在YouTube上。第一周播放破十万，评论区全是"谢谢你不收钱"。你看着那些留言，手指停在一条"新人求带"的评论上——当年你也是这样在群里打出第一行字的。原来你也成了当年帮你的人。',
      },
    ],
  },
];

// ============================================================
// 异地创业线事件（nomad_entrepreneur，ages 26-36）
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
      '你把第一个产品化服务挂上了网——一套给跨境卖家的"自动汇率换算+多币种记账"工具，月费19美元。下班后的每个晚上你都在用AI编程器写代码、让通用大模型帮你补全和重构，AI把开发速度提了三四倍，周末全部用来做产品。\n' +
      '上线第一天，0个注册。第二天，3个。第三天，其中一个退订了。你盯着后台那两个孤零零的活跃用户，心情像过山车。其中一个用户给你发了封邮件："这个工具救了我的命，我终于不用每天手动换算汇率了。"\n' +
      '你盯着那封邮件看了很久。就为了这一个用户，你也得把这个东西做下去。但你心里也清楚：Twitter上已经有人用AI在几天内复刻出类似工具，AI驱动的新竞品正在批量冒头——在这个节点上，速度是你目前唯一的护城河，慢一个月可能就被淹没。',
    options: [
      {
        id: 'iterate_fast',
        label: '疯狂迭代，每周发新版本',
        description: '根据那两个用户的反馈，把产品打磨到极致',
        hint: '远程能力+12 · 跨文化+5 · 压力+10 · 健康-4 · 信念+8 · 副业+5000',
        hintColor: 'positive',
        skillGains: { remoteSkill: 12, crossCulturalSkill: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.health = clamp(s.health - 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.currentYearSideHustle += 5000; // 前50个付费用户的订阅费折算
        },
        log: '26岁，你进入了"每周一更"的疯狂节奏。那两个用户成了你的产品顾问，你每个版本都先发给他们试用。三个月后用户涨到了50，留存率80%，月费19美元攒下了第一笔5000块的订阅收入。你发现：早期不缺用户，缺的是"愿意陪你打磨的死忠"。',
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
      '这种感觉很奇怪，也很重。"雇佣"的本质，你总算看清了一点：不是花钱买时间，是花钱买一份信任，然后为这份信任兜底。',
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
      '你的Slack永远在响，每天要处理三个国家的劳动法问题，两个员工的合同要续，一个客户的大单要交付，还有税务、发票、合规一堆你从来没学过的东西。好在AI驱动的项目管理工具能自动汇总各时区进度、分配任务，实时翻译也消掉了大半的语言隔阂——远程协作的工具链比三年前顺手了太多。但工具再聪明，也替不了你去安抚一个情绪崩溃的员工，或去判断两个人之间那点微妙的张力。你从一个"做产品的人"变成了一个"救火的人"，已经两个月没写过一行代码了。\n' +
      '你想起一个创业前辈的话："公司从1到10的阶段，创始人最容易死。市场打不死你，拖垮你的是自己。"你看着镜子里那个憔悴的自己，第一次认真想：是不是该建系统了，而不是继续当那个"什么都管"的超人。',
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
      '你以为做跨境生意最难的是产品，直到你收到一封来自某地税务局的信。你在三个国家有客户、在两个国家有员工、自己又是"户籍地和常住地常年对不上"的游民——这套组合，连会计师都头大。\n' +
      '增值税怎么申报？远程员工的社保在哪交？你的公司注册在哪国最划算？数字产品的跨境税务规则每个国家都不一样，而且年年变。不过比起五年前——2026年那会儿游民还像黑户一样到处打游击——到了2031年，已经有四五十个国家推出了正式的数字游民签证框架，数字公司注册也基本全程线上化了。合规的门槛在降低，但规则的复杂度反而在上升。你发现：做跨境生意，"合规"这门课，比写代码难一百倍。\n' +
      '你坐在一家上海的跨境税务会计师事务所里，对面是个英文流利的老太太，正在跟你解释什么叫"常设机构"。你心里只剩一个念头：当年为什么没好好学点税法。',
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
      '你盯着这份数据，像盯着一个告诉你"你爱错了人"的体检报告。产品市场契合不是你设计出来的，是用户用钱投票投出来的——而他们投的方向，跟你以为的不一样。更让你焦虑的是，这半年AI竞品冒出来七八个，纯自动化的功能它们做得又快又便宜，你的"自动化"模块几乎被免费平替。你越来越确信：能让你活下去的PMF，必须是AI单独解决不了的那部分——人跟人协作时才有的那点摩擦、默契和信任。',
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
      '一个竞争对手抄了你的产品——不只是功能，连定价、文案、官网布局都一模一样，价格还比你低30%。你发现他们时，已经流失了20%的新增用户。最让你后背发凉的是，对方没怎么藏：他们承认是用AI把你整个官网的UI/UX扒下来，几小时就复刻了一遍。2032年了，抄一个产品的壳子，成本已经低到几乎为零。\n' +
      '你气得发抖，给律师朋友发了截图。朋友说"跨境维权成本高、周期长，建议你打不过就跑"。你看着那个抄袭者的官网，像一个看着自己影子被偷走的人——愤怒，但也无力。\n' +
      '深夜你盯着自己的产品后台，问自己一个更狠的问题：如果别人这么容易就能抄走你的生意，说明你的护城河到底在哪里？也许真正该恐惧的不是这个抄袭者，是你一直以为的"先发优势"其实根本不存在的这件事。想了一夜你慢慢想明白：代码和界面AI几小时就能复刻，唯一复刻不走的是用户对你的信任、是社群里那些真人之间的关系——品牌和社区，才是AI时代真正剩下的护城河。',
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
      '你的MRR（月经常性收入）第一次突破了五万美元。你盯着Stripe后台那个数字，算了一下：这意味着即使你下个月什么都不做，也有五万进账。再算上年度订阅的预付，你的现金流第一次"溢出"了你的生活成本。2033年了，数字游民早已不是小众亚文化——你住的co-living空间里一半人都在做远程生意，巴厘岛、里斯本、清迈、大理的游民社区都成了基础设施完备的"据点"，整个远程优先的经济体在成熟，你的MRR就长在这片土壤上。\n' +
      '这是一种陌生而危险的踏实感。过去七年你一直在"拼命让公司活下去"，现在公司不仅活着，还在替你赚钱。一种"可以停下来想想"的奢侈，就这样悄悄落到了你头上。\n' +
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

  // 33岁：第二增长曲线
  {
    id: 'nomad_entrepreneur_second_product',
    title: '第二增长曲线',
    sceneTag: 'startup',
    pathId: 'digital_nomad',
    branch: 'nomad_entrepreneur',
    ageRange: [33, 33],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '你的第一个产品增长开始见顶——用户数还在涨，但增速从每月20%掉到了5%。你盯着后台曲线，认出了那个让所有创始人心里一紧的形状：S曲线的平顶。\n' +
      '你做了几十个用户访谈，发现一个有意思的现象：你的客户在用你的产品解决A问题的同时，几乎都在被一个相邻的B问题折磨。他们甚至在邮件里问你"你们能不能顺便也把B解决了"。\n' +
      '摆在你面前的有三条路：把所有精力砸回去救第一个产品的增长；赌一把做第二个产品，押注这条相邻的痛点；或者干脆买一个现成的竞品，把它整合进来。每一条都赌的是你接下来三年的命。说实话，现在用AI做产品的速度快得离谱——一个想法到MVP可能只要两周。真正的难点早不是"能不能做出来"，而是"这事值不值得做"：你得小心，别花三个月造出一个AI下个月就能免费提供的东西。',
    options: [
      {
        id: 'build_second_product',
        label: '为现有客户做第二个产品',
        description: '押注相邻痛点，把同一批客户再服务一遍',
        hint: '远程+8 · 跨文化+6 · 存款-15000 · 信念+10 · 压力+10',
        hintColor: 'positive',
        skillGains: { remoteSkill: 8, crossCulturalSkill: 6 },
        savingsChange: -15000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.stress = clamp(s.stress + 10, 0, 100);
        },
        log: '33岁，你拉了个小分队，闷头三个月做出了第二个产品。上线那天你紧张得像第一次创业。好在老客户们果然有这个需求，第一批种子用户几乎不用拉——他们已经在排队了。你看着两条增长曲线并排往上走，心里想：原来第二曲线不是找来的，是蹲在第一曲线旁边听用户抱怨听出来的。',
      },
      {
        id: 'double_down_core',
        label: '把第一个产品做到极致',
        description: '不分散精力，深挖护城河，把增长救回来',
        hint: '远程+6 · 存款+5000 · 信念+5 · 压力-2',
        hintColor: 'neutral',
        skillGains: { remoteSkill: 6 },
        savingsChange: 5000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.stress = clamp(s.stress - 2, 0, 100);
        },
        log: '33岁，你按住了想做新产品的冲动，把全部精力砸回第一个产品。你优化了留存、打磨了体验、砍掉了所有分散注意力的功能。增速没回到20%，但稳在了8%，而且利润更厚了。你跟团队说："不是每个曲线都需要立刻找第二条，先把这条走扎实。"',
        isRestOption: true,
      },
      {
        id: 'acquire_small_competitor',
        label: '低价收购一个小竞品，整合进来',
        description: '买现成的技术和用户，省掉从零做的时间',
        hint: '远程+7 · 跨文化+8 · 存款-20000 · 信念+7 · 压力+6',
        hintColor: 'neutral',
        skillGains: { remoteSkill: 7, crossCulturalSkill: 8 },
        savingsChange: -20000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 7, 0, 100);
          s.stress = clamp(s.stress + 6, 0, 100);
        },
        log: '33岁，你没从零做，而是花了一笔钱收购了一个快撑不下去的小竞品——它的技术正好补上你客户念叨的那个B问题。整合的头两个月鸡飞狗跳，代码风格冲突、团队文化打架。但三个月后，两套产品并成了一套，用户的B问题被顺手解决了。你学到了：有时候增长不是"做"出来的，是"买"回来的。',
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
      '但对方有个条件：你要留下来做两年"过渡期"，而且产品会被整合进他们的体系，你的品牌大概率会消失。等于说，你卖掉的不只是公司，是你过去九年的一块身份。谈到后来你慢慢听明白了对方的算盘：他们肯出4倍溢价，恰恰是因为你的生意属于"AI难以替代"的那一类——沉淀了九年的客户关系、跨文化的本地化理解、社群里真人之间的信任，这些是AI再强也复刻不出的资产，所以他们才急着趁早把你买下来。\n' +
      '你想起九年前那个在丽江咖啡馆上线第一个产品的夜晚。那时你一无所有，只有一台电脑和一个想法。现在有人愿意用一笔钱，买走那个"想法长出来的东西"。你该卖吗？还是说，有些东西不该卖？',
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
      '你坐在苏州一家百年老宅里，窗外的枫叶红了。你的公司有12个员工，分布在8个省份，全自动运转，你一个月只需要开两次会。\n' +
      '过去十年你住过二十多个城市，但"地点无关"这四个字，到今天才真正成立——不是因为你能在任何地方工作，而是因为你不再需要在任何地方工作。公司替你赚钱，你替自己生活。\n' +
      '你想起25岁那个在丽江天台上做选择的夜晚。那时"地点无关的生意"只是一个赌注，现在它成了一台机器。这十年世界翻了个个儿：AI接管了大半的远程活计，远程办公从"少数人的特权"变成了默认选项，数字游民签证也从几个国家蔓延到了半个地球。你25岁时还要为自己"不坐班"辩解，35岁时反而是坐班的人开始羡慕你。你看着枫叶飘落，第一次有了一种"够了"的平静——不是赚够了，是终于分清了"想要"和"需要"。',
    options: [
      {
        id: 'become_investor',
        label: '转型做天使投资人，投其他游民创业者',
        description: '用经验和资本，帮下一代"你"少走弯路',
        hint: '远程能力+8 · 跨文化+12 · 语言+6 · 被动收入+15000/年 · 信念+8 · 幸福+6',
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
      '一个在丽江认识的德国创业者在职业社交网络上找到你，说他们的产品想进入南方市场，问你愿不愿意"聊聊"。\n\n' +
      '你原本以为只是一次免费的coffee chat，聊到一半他突然问："你这个咨询怎么收费？"你愣住了——你从来没想过自己的经验可以单独卖钱。\n\n' +
      '你深吸一口气，报了一个自己觉得"有点过分"的数字：每小时200美元。对面沉默了两秒，说："可以，我们先买10个小时。"\n\n' +
      '挂掉视频电话后你坐在 coworking space 的椅子上，心跳得很厉害。两千美元，聊十个小时天。其实AI翻译工具早就把中德之间的语言障碍抹平了，他随便装个插件就能听懂每一句中文——所以他愿意付钱的，从来不是你的德语或英语，而是你对南方市场那套"没写在文档里的东西"的理解。你走过的路、踩过的坑、跨过的文化，本身就是一种产品。',
    options: [
      {
        id: 'accept_consulting',
        label: '接下这单，认真对待',
        description: '把它当成一份真正的咨询项目来做，而不是闲聊',
        hint: '远程能力+6 · 语言+8 · 跨文化+8 · 存款+4000 · 信念+8 · 幸福+5',
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
      {
        id: 'pilot_split',
        label: '5小时付费+5小时试水折扣',
        description: '一半原价一半友情价，既不贱卖也不吓跑客户，换一封推荐信',
        hint: '远程+4 · 语言+6 · 跨文化+6 · 存款+2500 · 信念+6 · 压力+2',
        hintColor: 'neutral',
        skillGains: { remoteSkill: 4, languageSkill: 6, crossCulturalSkill: 6 },
        savingsChange: 2500,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.stress = clamp(s.stress + 2, 0, 100);
        },
        log: '26岁，你把十个小时劈成两半：前五小时按200美元全价收，后五小时算"试水折扣"，但要求客户写一封公开推荐信作为交换。你既没贱卖自己，也没吓跑第一个客户。那封推荐信后来为你引来了三个新客户——你学会了折中：不是非此即彼，是各取一半。',
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
      '一个做了二十年咨询的前辈在 coworking space 的咖啡机旁跟你说："咨询的真谛只有一个：只做一件事——做到别人想到这件事就想到你。你现在的问题不在客户少，在定位太散。"',
    options: [
      {
        id: 'focus_cross_border',
        label: '聚焦"跨境市场进入"咨询',
        description: '只做帮助公司进入新市场的咨询，其他全部拒绝',
        hint: '远程能力+8 · 跨文化+12 · 被动收入+5000/年 · 信念+8 · 压力-5',
        hintColor: 'positive',
        skillGains: { remoteSkill: 8, crossCulturalSkill: 12 },
        passiveIncomeChange: 5000,
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
      {
        id: 'pick_adjacent_niches',
        label: '选2-3个相邻细分领域',
        description: '跨境进入+品牌本土化，窄但不至于太窄，留点弹性',
        hint: '远程+6 · 跨文化+8 · 存款+3000 · 信念+6 · 压力-2',
        hintColor: 'positive',
        skillGains: { remoteSkill: 6, crossCulturalSkill: 8 },
        savingsChange: 3000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.stress = clamp(s.stress - 2, 0, 100);
        },
        log: '27岁，你没把自己绑死在一个领域，也没继续当万金油。你挑了"跨境市场进入"和"品牌本土化"两个相邻的细分方向——既有了辨识度，又留了转身余地。前辈看了你的定位说："这才是聪明人的做法，不把路走窄，也不把路走散。"',
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
      '一家日本上市公司通过朋友介绍找到了你。他们的新产品线想进入南方六个省份，需要一个"懂当地市场又懂日本企业文化"的顾问。对方的项目经理私下跟你说，他们试过几款AI驱动的跨境咨询工具，报告做得漂亮但落地全是雷——文化这层桥，机器搭不起来，所以他们才来找你这个人。\n\n' +
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
      {
        id: 'bring_partner',
        label: '接下合同，请资深搭档共担',
        description: '签下12万大单，但找一位资深前辈联合交付，分账也分险',
        hint: '远程+8 · 跨文化+10 · 语言+6 · 存款+18000 · 信念+8 · 压力+8',
        hintColor: 'neutral',
        skillGains: { remoteSkill: 8, crossCulturalSkill: 10, languageSkill: 6 },
        savingsChange: 18000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
        },
        log: '28岁，你签下了12万的合同，但没一个人扛——你请了一位做过二十年日企项目的资深前辈联合交付，收入五五分账。他补上了你最缺的大型项目交付经验，你贡献了对南方市场的在地理解。项目顺利收官，客户问"下次能不能还是你们俩"。你学到：承认自己不够，比假装自己够更值钱。',
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
      '你在中间当翻译——译的是文化，而非语言。你跟中方说"他们需要看到完整的文档才会行动"，跟德方说"他们需要先建立信任才会分享信息"。\n\n' +
      '一个德国工程师私下跟你说："你是唯一一个既理解我们的方式、又能跟他们沟通的人。"一个中方经理也跟你说："有你在，我们才敢跟德国人提要求。"\n\n' +
      '你也试过把会议记录丢给AI，让它总结"双方的真实立场"，它给你的是一份字面意思的清单——完美，但没用。AI能翻译每一个词，可它读不懂空气：它看不出一个日本工程师沉默着不说话其实是在反对，也读不出中方经理那句"我们研究研究"翻译过来就是"不行"。这些东西从来没写在任何一本词典里——而你这些年攒下来的，全是这些。\n\n' +
      '你突然意识到：你的价值不是"懂某个市场"，而是"同时懂两个世界，并且能让他们彼此懂对方"。这种能力，不是读几本书就能学来的——是你在路上走了七年才磨出来的。也正因为如此，AI再强也取代不了你这一层。',
    options: [
      {
        id: 'deepen_bridge_role',
        label: '把"文化桥梁"做成你的核心品牌',
        description: '不再只做市场进入，而是做跨国团队协作咨询',
        hint: '跨文化+12 · 语言+8 · 被动收入+5000/年 · 信念+10 · 幸福+5 · 副业+15000',
        hintColor: 'positive',
        skillGains: { crossCulturalSkill: 12, languageSkill: 8 },
        passiveIncomeChange: 5000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.currentYearSideHustle += 15000; // 中德合作项目的咨询费尾款到账
        },
        log: '29岁，你找到了自己真正的定位：不做市场分析，做文化翻译。你帮跨国团队拆解误解、建立信任、对齐预期。你的报价单上多了一行字："跨境协作与文化桥接顾问"。客户们开始把你当"不可或缺的人"——不是因为你懂技术，是因为没有你，他们连会都开不起来。中德项目的咨询费尾款15000块到账，你第一次觉得"走了七年弯路"终于变现了。',
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
      {
        id: 'bridge_as_addon',
        label: '市场进入为主，文化桥梁做成加价模块',
        description: '不全面转型，把文化桥接作为高客单的增值附加项',
        hint: '跨文化+10 · 语言+6 · 存款+6000 · 被动收入+2000/年 · 信念+7 · 幸福+3',
        hintColor: 'positive',
        skillGains: { crossCulturalSkill: 10, languageSkill: 6 },
        savingsChange: 6000,
        passiveIncomeChange: 2000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 7, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
        },
        log: '29岁，你没把"文化桥梁"变成全部身家，也没放弃它。你把它打包成一个高客单的增值模块——市场进入咨询照做，客户若需要跨国协作协调，再加价购买"文化桥接"服务。一半客户选了加购。你的主业没断，副线在长。你发现折中 sometimes 是把两条路都走一半，反而都走通了。',
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
      '你的抽屉里又多了一张车票。今年你已经飞了13次航班，去了8个城市，住了23家酒店和17个短租平台。\n' +
      '这是数字游民的成熟时代——候机厅里到处都是和你一样的人：贴着同样的笔记本电脑贴纸，背着同款背包，点着同样的美式咖啡。你们彼此点头致意，像是某个松散俱乐部的成员。可坐在这一片"自己人"中间，你却觉得比一个人时更孤独——人越多的地方，越显出你的无处可归。\n' +
      '你坐在杭州萧山机场的候机厅里，旁边坐着一个带孩子的年轻妈妈。孩子闹觉哭了，她手忙脚乱地冲奶粉。你帮她递了一下纸巾，她笑着说"谢谢啊，一个人出差？"你说"嗯"。她没再说什么，低头哄孩子。\n' +
      '你看着她拍孩子的背影，忽然想起上次见你妈是七个月前。她电话里总说"不用回来，我跟你爸挺好的"，但你听得出她嗓子有点哑——感冒了，没告诉你。你手机日历密密麻麻，找不出一天是"空"的。一个同在咨询圈的朋友说过："这不是倦怠，这是空心。身体在动，心不想动了。"',
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
        log: '30岁，你做了一个"反直觉"的决定：减少了出差。你开始拒绝必须到场的会议，转而用远程协作工具完成交付。收入少了一些，但你终于能在同一个城市待超过两周了。你在厦门租了一个月的公寓，每天早上在阳台上喝咖啡，看着楼下的公交车慢慢驶过。你想起朋友的话——空心，得先停下来才能填满。',
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
      {
        id: 'hire_va',
        label: '雇个远程助理，砍掉一半行程',
        description: '请一位虚拟助理处理行程和排期，保留关键线下会议，砍掉一半出差',
        hint: '远程+8 · 存款-3000 · 压力-8 · 健康+5 · 信念+4',
        hintColor: 'neutral',
        skillGains: { remoteSkill: 8 },
        savingsChange: -3000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress - 8, 0, 100);
          s.health = clamp(s.health + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '30岁，你没彻底停掉出差，也没硬扛。你雇了一位在菲律宾的远程助理，把行程预订、会议排期、发票整理全甩给了TA，自己只保留关键的线下会面，出差砍掉一半。你在同一张候机椅上坐下时，手机里少了一半的红点。你第一次知道：雇人不是偷懒，是把你的时间从"杂事"里赎回来。',
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
      '你在职业社交网络上发了一篇关于"文化智商在跨境商业中的决定性作用"的长文。本来只是随手写的，结果三天内获得了20万阅读量，转发超过3000次。在这个AI能批量生成"深度好文"的年代，反而是你这种带着真实伤疤和亲历细节的故事最稀缺——读者分得清哪些是机器编的，哪些是用脚走出来的。\n\n' +
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
      {
        id: 'quarterly_output',
        label: '每季一篇重头文章，只接1-2个重磅演讲',
        description: '不做全职KOL，也不彻底隐身，精选输出+精选曝光',
        hint: '语言+6 · 跨文化+6 · 被动收入+4000/年 · 信念+7 · 压力+2',
        hintColor: 'positive',
        skillGains: { languageSkill: 6, crossCulturalSkill: 6 },
        passiveIncomeChange: 4000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 7, 0, 100);
          s.stress = clamp(s.stress + 2, 0, 100);
        },
        log: '31岁，你没顺势把自己变成全职KOL，也没躲回幕后。你定了个规矩：每季度只写一篇"压箱底"的长文，演讲只接1-2个收费最高的重磅场次，其余全拒。你的输出少了，但每篇都被反复引用；你的曝光少了，但每次出场都更贵。你学会了：影响力不是靠量堆的，是靠"出现就得值得"。',
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
      '你开始设计一个"跨境成长顾问"的订阅服务——每月固定费用，客户提供随时咨询、季度市场报告、月度战略会议。你用AI搭了一个自动应答层，处理掉客户八成的常规问题，自己只接那两成需要判断、需要文化嗅觉的硬骨头——订阅制之所以跑得通，正是因为AI扛下了那80%，把你腾出来去做那20%真正值钱的事。你给三个老客户发了方案，两个当晚就回了"我要"。',
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
        log: '32岁，你推出了订阅制咨询。五个老客户签约，每月固定收入覆盖了你的全部生活开销。你第一次不必为"下个月的客户在哪里"而焦虑了。你在大理的公寓里对着屏幕笑了很久——这不是退休，但这是"不用再狩猎"的自由。你终于理解了什么叫"被动的心智"。',
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
      {
        id: 'hybrid_model',
        label: '混合模式：老客户订阅，新客户项目制',
        description: '先给三个老客户上订阅试水，新客户继续按项目收费',
        hint: '远程+5 · 跨文化+4 · 存款+5000 · 被动收入+6000/年 · 信念+6 · 幸福+4',
        hintColor: 'neutral',
        skillGains: { remoteSkill: 5, crossCulturalSkill: 4 },
        savingsChange: 5000,
        passiveIncomeChange: 6000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.happiness = clamp(s.happiness + 4, 0, 100);
        },
        log: '32岁，你没把全部身家压在订阅上，也没固守项目制。你给三个最信任的老客户上了订阅，新客户继续按项目收。半年后订阅收入稳了，你才慢慢把更多客户迁过去。你跟朋友说："我不是在赌一个模式，我是在让它先证明自己。"折中不是怯懦，是给自己留退路的同时往前走。',
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
      '一封来自德勤的邮件躺在你的收件箱里。他们想跟你签一份"专家网络合作协议"——当他们的客户需要跨境市场进入方面的深度 expertise 时，会以你的名义出具报告，你拿专家费。四大这些年把基础分析全交给了AI，报告出得又快又便宜，可一旦涉及复杂的文化谈判、跨市场的暗流，机器就抓瞎——这正是他们来找你的原因。\n\n' +
      '这对你的品牌是巨大的背书。德勤的客户都是大型企业，单子大、周期长、收费高。但条件也很苛刻：你需要签署排他性条款，不能同时为他们的竞争对手提供类似服务。\n\n' +
      '你拿着这封邮件坐在青岛的咖啡馆里，面前是一杯已经凉了的cortado。跟大厂合作意味着稳定、高端、有背书；但也意味着你从一个"自由的个体咨询顾问"变成了"大厂生态里的一个节点"。你的自由，会不会被这一纸合同稀释？',
    options: [
      {
        id: 'sign_partnership',
        label: '签约，借大厂的平台起飞',
        description: '用德勤的背书打开大企业客户市场',
        hint: '跨文化+10 · 语言+6 · 被动收入+12000/年 · 信念+8 · 压力+8 · 副业+25000',
        hintColor: 'positive',
        skillGains: { crossCulturalSkill: 10, languageSkill: 6 },
        passiveIncomeChange: 12000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
          s.currentYearSideHustle += 25000; // 德勤转介的第一笔大企业专家费
        },
        log: '33岁，你跟德勤签了专家合作协议。第一次以"德勤合作专家"的身份出现在客户面前时，对方的态度明显不同了——不再是"你一个人靠谱吗"的质疑，而是"大厂都认可你"的信任。你的报价单又涨了30%。德勤转介的第一笔大企业专家费25000块到账，但深夜里你偶尔会想：现在来找你的人，到底是因为你，还是因为你背后的logo？',
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
      {
        id: 'time_limited_exclusive',
        label: '谈18个月限时排他，附复盘条款',
        description: '签排他但不永久，约定18个月后复盘+最低保底量',
        hint: '跨文化+8 · 语言+5 · 被动收入+8000/年 · 存款+4000 · 信念+7 · 压力+5',
        hintColor: 'positive',
        skillGains: { crossCulturalSkill: 8, languageSkill: 5 },
        passiveIncomeChange: 8000,
        savingsChange: 4000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 7, 0, 100);
          s.stress = clamp(s.stress + 5, 0, 100);
        },
        log: '33岁，你没全签也没全拒。你跟德勤谈了18个月的限时排他，加了一条：18个月后复盘，若达不到最低保底转介量，自动转回非排他。大厂的法务磨了你两周，最后同意了。你既拿到了背书，又给未来的自己留了一扇门。你想起一句话：合同里最重要的不是签了什么，是"什么时候能退出"。',
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
      '如果你把它变成一个产品——一本书、一套课程、一个认证体系——你的知识就不再只属于你一个人了。你动过用AI把方法论规模化的念头：让AI来教框架、来批改作业、来打分。可写到认证那一步你停住了——AI能教框架，但它没法判断一个人是不是真的"开了窍"、真的读得懂空气。文化桥接这东西，最后的盖章，还得是人给的人。',
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
      {
        id: 'handbook_first',
        label: '先写内部手册，找2个客户试跑',
        description: '不急着产品化，先把方法论写成手册，明年再决定',
        hint: '远程+5 · 语言+6 · 存款+5000 · 信念+6 · 压力+2',
        hintColor: 'neutral',
        skillGains: { remoteSkill: 5, languageSkill: 6 },
        savingsChange: 5000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.stress = clamp(s.stress + 2, 0, 100);
        },
        log: '34岁，你没急着把方法论做成课程去卖，也没把它锁在抽屉里。你先把它写成一本内部手册，找了两个老客户"试跑"——用手册带着他们走了一遍流程，收集反馈。一年后你才决定要不要产品化。你跟自己说："先把东西磨对，再决定要不要卖。"折中有时就是：不抢跑，也不躺平。',
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
      '你坐在厦门沙坡尾老街的一间短租平台阳台上，看着海面上的落日。你在想一个问题：你要在哪里"退休"？\n\n' +
      '你走过的这些年，从大理到丽江到厦门到杭州到青岛，每个地方都住过，每个地方都有记忆。但"退休"意味着你要停下来——不是停下来不工作，是停下来不再"移动"。\n\n' +
      '登机牌存根在护照夹里磨出了毛边，那个第一次独自过安检时手心出汗的年轻人大概不会想到，自己有一天会为"在哪里停下来"而发愁。TA赌的是"世界很大"。现在世界你已经看够了，接下来的问题是：哪里是你的"家"？\n\n' +
      '回望这十三年——从2026到2039——AI把咨询行业翻了一遍底朝天，能自动化的都被自动化了。可你这条靠"人味儿"起家的路，反倒越走越稳：你卖的不是信息，是机器读不懂的那层文化直觉。你的自由，恰恰建在AI复制不了的东西上。',
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
        log: '35岁，你选了厦门做你的"基地"。不是因为厦门最好，是因为你在厦门有过一段最平静的日子。你签了一年的租约——这是你十三年来第一次签超过三个月的租约。你在阳台上种了一盆罗勒，每天早上浇水时你都会想：原来"停下来的勇气"比"出发的勇气"更难。但你做到了。',
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
        log: '35岁，你没有选基地。你把节奏从"每月一个城市"调到了"每季一个城市"——厦门三个月，大理两个月，杭州一个月。你依然在路上，但不再赶路了。有人问你"家在哪里"，你说："我的家在云端。它不是一个地方，是一种状态。"',
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
      '你翻开护照看了一眼——旅游签证还有7天到期。你本来打算再做一次"签证运行"（visa run，去邻国晃一圈再入境重新盖戳），但移民局官网上挂着一条新政策：免签再入境的间隔从30天延长到了90天，边境官员开始严查"签证跳跃"。\n\n' +
      '这意味着你不能再像以前那样"打擦边球"了。你面前有几个选项：申请一个正式的数字游民签证（2026年之后几十个国家都推出了，需要证明收入和买保险），转到另一个国家重新开始，或者——回国待一段时间。\n\n' +
      '你坐在咖啡馆里，面前的冰拿铁化成了一摊水也没喝。这条路你已经走了五年，但每次签证到期你都会慌。自由是有保质期的，而保质期刻在你的护照上。',
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
        log: '27岁，你第一次走了"正规路"申请数字游民签证。提交了远程工作收入证明、买了覆盖全球的医疗保险、等了三周审批。拿到签证那天你长舒一口气——你终于不用每隔几个月就为"能不能留下来"焦虑了。合法的自由，比灰色地带的自由踏实得多。',
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
        log: '27岁，你拎着行李箱飞去了巴厘岛——印尼的数字游民签证好办，对远程工作者友好。落地苍古那天，你站在街边闻着椰子壳和香茅的气味，心想：每个新国家的第一天都是一样的——兴奋、陌生、和一点点想家。',
        blindBoxTrigger: 'nomad_first_trip',
      },
      {
        id: 'return_home_temporarily',
        label: '先回国待一阵',
        description: '趁这个间隙回家看看父母，顺便歇歇',
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
    sceneTag: 'street',
    pathId: 'digital_nomad',
    ageRange: [29, 30],
    priority: 8,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    conditions: (s: GameState) => s.isAllInPath === true,
    narrative:
      'TA是在成都一个 coworking space 认识的。一个自由撰稿人，跟你一样满世界跑。这些年游民生态已经成熟——每座城市都有 coworking space，游民社群遍布全球，"在哪里工作"早就不是问题了。你们一起吃了串串，一起逛了场当代艺术展，一起在玉林路的街头喝精酿喝到天亮。TA给你看了手机里那套AI写作工具——选题、初稿、润色都靠它，自由撰稿的效率比五年前高了一倍不止。\n\n' +
      '你们在一起三个月了。但问题已经很现实了——TA的下一站是重庆，你的下一站是昆明。你们都"在路上"，但路不一样。\n\n' +
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
        log: '29岁，你为TA在成都多待了半年。你们一起买菜做饭，一起在阳台上看日落，一起吵过架又和好。你第一次体会到"漂泊的人也有日常"是什么感觉。半年后TA跟你说"我们继续走吧"——但你知道你们已经不是一个人了。',
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
        log: '29岁，你选择了自由。你们约定"各自走，路上见"。TA去了重庆，你去了昆明。你们靠视频和消息维系着，但距离像一把钝刀，慢慢割着这段关系。半年后你们在丽江重逢了五天，分别时在机场哭得像生离死别。你知道这条路很难走，但你不知道还有别的走法。',
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
        log: '29岁，你跟TA在成都的最后一天喝了最后一杯精酿。TA说"我理解"，你说"我也是"。你们没有争吵，没有怨恨，只有一种深深的遗憾——两个对的人，在对的时间相遇，却走在不同的路上。你在飞机上看了一路的云。',
      },
    ],
  },

  // 31-32岁：家人催回来
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
      '你妈在电话里说："你爸最近身体不太好，你什么时候回来看看？"语气很平淡，但你知道这已经是她第N次暗示了。她最近学会了用AI翻译看你发在Instagram上的英文动态——一条条翻译过来，截图存到手机相册里，时不时翻出来看。\n\n' +
      '你打开日历看了看——下个月有两个客户交付，一个月后有一个德勤的项目要启动。你算了一下时差，算了一下机票，算了一下回去之后隔离和恢复的时间。视频通话现在有实时AI同传，她说中文你说英文也能无缝对话，沟通从没这么顺畅过——但你也发现，越是无障碍地交流，那些说不出口的话就越无处可藏。技术能翻译语言，翻译不了距离。\n\n' +
      '你弟弟在社交软件上给你发了一条："哥，你到底还回不回来？妈嘴上不说，但她一直在等你。你在外面赚再多钱，也不能替她过生日。"\n\n' +
      '你盯着那条消息看了很久。你选择了这条路，赌的是"世界很大"。但世界再大，你妈的头发也在变白。',
    options: [
      {
        id: 'go_home_extended',
        label: '回来待两个月，陪陪父母',
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
        log: '31岁，你往家里打了5万块钱，告诉弟弟"帮我照顾好爸妈"。你妈收到钱后在电话里说"我们不要钱，要你"。你握着手机在昆明的公寓里沉默了很久，然后打开电脑继续写proposal。钱能解决很多问题，但解决不了思念。',
      },
      {
        id: 'invite_parents_to_visit',
        label: '邀请父母来你所在的城市住一阵',
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
        log: '31岁，你给爸妈订了来大理的机票。他们在大理住了一个月——你爸学会了用Google Maps导航，你妈爱上了过桥米线。走的时候你爸说"原来你在外面过得还行"，你妈说"下次去你说的那个厦门看看"。你笑了，眼眶有点热——他们终于不只是在电话里"想象"你的生活了。',
      },
    ],
  },

  // 33-34岁：异地就医
  {
    id: 'nomad_health_emergency',
    title: '异地急诊室',
    sceneTag: 'hospital',
    pathId: 'digital_nomad',
    ageRange: [33, 34],
    priority: 9,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    conditions: (s: GameState) => s.isAllInPath === true,
    narrative:
      '凌晨三点你被剧烈的腹痛疼醒。你蜷缩在清迈的短租平台床上，冷汗浸透了枕头。你用颤抖的手打开手机查"appendicitis symptoms"，然后用Grab叫了一辆车去最近的医院。\n\n' +
      '急诊室的灯很亮，护士用泰语连珠炮一样交代术前注意事项。你打开手机上的AI翻译App对着听——大意能听懂，但医学术语翻得磕磕绊绊，"阑尾切除术"被翻成了"appendix removal"，你还得再查一遍确认。医生说是急性阑尾炎，需要立刻手术。你签了手术同意书——那份英文和泰文对照的表格你看了三遍，手抖得几乎写不出字。\n\n' +
      '手术很成功，但术后的几天你一个人躺在病房里，没有一个认识的人来看你。护士会说几句简单的英文，更多时候你们靠翻译软件和手势交流。一个问题反复在脑子里转：自由和安全感，到底哪个更重要？你在一个陌生的国度，活蹦乱跳的时候觉得哪里都是家，但躺在异国病床上才发现——你哪里都不是家。',
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
        log: '33岁，出院第一周你就买了一份覆盖全球的商业医疗保险。年费一万，不便宜。但你想起那个凌晨独自在清迈叫车去医院的夜晚——那种"如果出了大事没人管"的恐惧，比任何保险费都贵。你终于明白：自由的前提是有一个安全网。',
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
        log: '33岁，你省下了保险费。阑尾炎的事很快就被新的工作和旅行覆盖了。但偶尔深夜你会想起那个独自在异乡病房的夜晚——那种无力感像一根刺，扎在某个你看不见的地方。',
      },
    ],
  },

  // 28-30岁：落脚点（All In后第一个基地）
  {
    id: 'nomad_post_allin_first_place',
    title: '落脚点',
    sceneTag: 'home',
    pathId: 'digital_nomad',
    ageRange: [28, 35],
    priority: 8,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    conditions: (s: GameState) => s.isAllInPath === true,
    narrative:
      '你已经连续移动了快两年。大理、清迈、巴厘岛、厦门——每个地方住一到三个月，行李箱永远是半打包的状态，牙刷永远放在洗漱袋里。\n\n' +
      '但这个月在清迈，你签了一份六个月的长租合同。不是因为你打算停下来，是因为你在网上看到一间带小阳台的公寓，月租只要一千二，楼下就是一家七点开门的咖啡馆，走路五分钟有一家24小时洗衣店。你看完房的当天就付了定金。\n\n' +
      '你在阳台上挂了一串灯，在二手市场买了一把藤椅和一小盆薄荷。你开始认得巷口卖粿条的阿姨，她会多给你加一勺鱼露。洗衣店的老板知道你用哪种洗衣液。你甚至办了一张当地的健身房月卡。\n\n' +
      '楼下咖啡馆有个常驻的流浪画家叫Maya，加拿大人，留着银色短发，画架永远支在窗边。她在清迈住了三年，靠卖画和教水彩课生活。你们从不约见面，但每天早上你点咖啡时她会抬头笑一下，你会在她画架旁站两分钟看今天画了什么。\n\n' +
      '你坐在藤椅上喝着冰咖啡，看着薄荷叶子在风里晃。你突然意识到：你已经两周没查机票了。这种感觉不是"被困住"，是"踩到底了"——你的脚终于碰到了地面，哪怕只是暂时的。',
    options: [
      {
        id: 'embrace_settling',
        label: '安心住下来，把这里当第一个基地',
        description: '不再急着走，给自己六个月时间扎根，建立日常节奏',
        hint: '幸福+10 · 压力-8 · 健康+5 · 信念+5 · 跨文化+6',
        hintColor: 'positive',
        skillGains: { crossCulturalSkill: 6 },
        stateEffect: (s) => {
          ensureSkills(s);
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.stress = clamp(s.stress - 8, 0, 100);
          s.health = clamp(s.health + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '29岁，你在清迈住了六个月。你有了固定的咖啡馆座位、固定的粿条阿姨、固定的洗衣店、甚至固定的摩托修理师傅。Maya成了你固定的早餐同伴——你们不聊天，就是各坐各的，但有个人在对面翻画册，你就不觉得孤独了。你第一次发现：游牧不是"永远在移动"，而是"有能力在任何地方建立生活"。六个月后你续了约。',
        isRestOption: true,
      },
      {
        id: 'use_as_hub',
        label: '把这里当中转站，继续短途出行',
        description: '签长租但不绑定，以这里为基地辐射周边国家',
        hint: '跨文化+8 · 语言+5 · 幸福+5 · 压力+3 · 信念+6',
        hintColor: 'positive',
        skillGains: { crossCulturalSkill: 8, languageSkill: 5 },
        stateEffect: (s) => {
          ensureSkills(s);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.stress = clamp(s.stress + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '29岁，你把清迈的公寓当成了枢纽。平时在公寓工作，每隔一两个月飞出去一趟——曼谷、河内、吉隆坡、兰卡威。你有了"回来"的地方，也有了"出发"的理由。行李箱不再是你的全部家当，它只是你的旅行包。',
      },
      {
        id: 'keep_moving',
        label: '不签长约，继续保持移动',
        description: '六个月太长了，你还不想在任何地方扎根',
        hint: '跨文化+10 · 信念+4 · 压力+5 · 幸福-3 · 存款+3000',
        hintColor: 'neutral',
        skillGains: { crossCulturalSkill: 10 },
        savingsChange: 3000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 5, 0, 100);
          s.happiness = clamp(s.happiness - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '29岁，你退掉了那间公寓。你跟自己说"还早"。你继续住在短租平台和青旅里，继续每两三个月换一个城市。但你偶尔会想起那盆薄荷——不知道它在阳台上活得好不好。',
      },
    ],
  },

  // 29-32岁：节日（异国独自过节）
  {
    id: 'nomad_post_allin_loneliness',
    title: '节日',
    sceneTag: 'cafe',
    pathId: 'digital_nomad',
    ageRange: [28, 35],
    priority: 8,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    conditions: (s: GameState) => s.isAllInPath === true,
    narrative:
      '今天是春节。你坐在里斯本一家咖啡馆里，外面下着小雨，咖啡馆里只有你和一个在写论文的大学生。\n\n' +
      '你打开社交软件，动态圈里全是年夜饭的照片——你爸做了红烧鱼，你妈包了饺子，你表弟带了女朋友回家。家族群里红包飞了一下午，你抢了三块二。你妈发来一段视频：一桌子菜，她举着杯子说"祝儿子在外面平平安安"。你爸在旁边说了句"别太累了"，然后视频就晃了——他不太会用手机。\n\n' +
      '你跟家里打了个视频电话。你妈问你"吃饺子了吗"，你说"吃了"——你没有。你爸问"那边冷不冷"，你说"不冷"——其实你没有厚外套，里斯本的冬天比你想象的湿冷。你妹妹举着手机转了一圈给你看家里的花，说"哥你什么时候回来"。\n\n' +
      '挂了电话你点了一份pasteis de nata，要了一杯bica。甜的，苦的。窗外的雨停了，街上有几个游客在拍照。你打开电脑，想写点代码，但光标在空白的编辑器里闪了十分钟。你第一次认真地想：自由的代价，是不是每年都有几个这样的夜晚？',
    options: [
      {
        id: 'video_call_more',
        label: '约好每周固定视频，不让距离变成习惯',
        description: '建立固定的家庭沟通节奏，哪怕只是十分钟',
        hint: '幸福+10 · 压力-5 · 信念+3 · 存款-2000',
        hintColor: 'positive',
        savingsChange: -2000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '29岁，你跟家里约好了每周六晚上视频。一开始很生硬——你妈问"吃了吗"，你说"吃了"，然后沉默。但慢慢的，你们有了新的话题：你爸学会了用AI修图，你妈在学广场舞视频剪辑。固定的联系像一根线，把你和那个叫"家"的地方连在一起，不紧，但不断。',
        isRestOption: true,
      },
      {
        id: 'find_community_holiday',
        label: '找当地游民一起过节',
        description: '在Discord群里约同样没回家的游民一起做饭',
        hint: '幸福+8 · 跨文化+8 · 信念+4 · 存款-1000 · 压力-3',
        hintColor: 'positive',
        skillGains: { crossCulturalSkill: 8 },
        savingsChange: -1000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '29岁春节，你在游民群里喊了一句"有人没吃年夜饭吗"，来了七个人——一个成都的产品经理、一个台湾的设计师、两个德国的远程工程师、一个巴西的摄影师、一个日本的自由撰稿人、还有你。你们在短租平台的厨房里凑了一桌菜：川菜、卤肉饭、意大利面、巴西烤肉。没人看春晚，但有人放了音乐。你发现：乡愁是可以分享的，分享了就没那么沉了。',
      },
      {
        id: 'embrace_solitude',
        label: '接受孤独，把它当作自由的一部分',
        description: '不逃避孤独，学会和自己相处',
        hint: '信念+6 · 幸福+3 · 跨文化+4 · 但孤独感持续',
        hintColor: 'neutral',
        skillGains: { crossCulturalSkill: 4 },
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
        },
        log: '29岁春节，你一个人在咖啡馆坐到打烊。你没约人，也没再打电话。你走回公寓的路上，里斯本的石板路被雨打湿了，路灯映在上面像碎金子。你突然觉得：孤独不是自由的敌人，是自由的影子——你走到哪里它跟到哪里，但你不必怕它。你学会了和它共处。',
      },
    ],
  },

  // 30-34岁：同类（遇到其他游民）
  {
    id: 'nomad_post_allin_tribe',
    title: '同类',
    sceneTag: 'co_living',
    pathId: 'digital_nomad',
    ageRange: [28, 35],
    priority: 8,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    conditions: (s: GameState) => s.isAllInPath === true,
    narrative:
      '你在巴厘岛的一个co-working space参加周三的nomad dinner。长桌坐了二十多个人，来自十几个国家——美国的、荷兰的、韩国的、阿根廷的、尼日利亚的。\n\n' +
      '一开始你以为这又是那种表面寒暄的社交活动——"你做什么的""你从哪来""你在这里待多久"。但吃到一半，一个荷兰姑娘说了句话："我有时候会忘记正常上班是什么感觉。"全桌都笑了，然后有人接了一句："我已经三年没设过闹钟了。"另一个人说："我上次见我爸妈是八个月前。"\n\n' +
      '那天晚上你们聊到co-working space关门。你发现这些人跟你一样——他们也在凌晨三点跟客户开会，也在异国的急诊室里独自签过字，也在某个深夜怀疑自己是不是在逃避什么，也在被朋友问"你到底什么时候回来"的时候不知道怎么回答。\n\n' +
      '你们不是游客，不是移民，不是外派员工。你们是一种新的人——没有固定地址，没有固定时区，社保自己交，税自己报，在机场比在客厅更自在。以前你觉得自己是个异类，今晚你发现：你不是一个人。',
    options: [
      {
        id: 'build_together',
        label: '和这群人建立长期联系，组建核心圈子',
        description: '建一个小群，定期聚，互相照应，分享资源',
        hint: '幸福+12 · 跨文化+10 · 压力-8 · 信念+8 · 存款-3000',
        hintColor: 'positive',
        skillGains: { crossCulturalSkill: 10 },
        savingsChange: -3000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.happiness = clamp(s.happiness + 12, 0, 100);
          s.stress = clamp(s.stress - 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '31岁，你和那晚认识的五个人建了一个Signal群。你们不聊工作，聊的是"清迈哪家公寓不发霉""里斯本哪个医生会说英文""日本游民签证怎么办""孤独的时候怎么办"。有人到你的城市你接风，你到他们的城市他们带路。你第一次有了"全球家人"的感觉——不是血缘，是选择。',
      },
      {
        id: 'collaborate_work',
        label: '和遇到的游民合作项目',
        description: '把社交变成协作，一起接单或做产品',
        hint: '远程能力+10 · 跨文化+8 · 被动收入+5000/年 · 信念+6 · 压力+5',
        hintColor: 'positive',
        skillGains: { remoteSkill: 10, crossCulturalSkill: 8 },
        passiveIncomeChange: 5000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '31岁，你和那个成都的产品经理、巴西的摄影师三个人一起做了一个面向游民的SaaS工具——帮数字游民自动计算多国税制和社保方案。你们三个时区协作，用AI做翻译和项目管理，第一个月就有了50个付费用户。你发现：游民不只是一种生活方式，也是一种人脉网络——你身边的每个人都带着一整个世界的资源。',
      },
      {
        id: 'keep_acquaintance',
        label: '保持轻松的关系，不深交',
        description: '聚就聚了，散就散了，不刻意维持',
        hint: '跨文化+5 · 幸福+3 · 信念+2',
        hintColor: 'neutral',
        skillGains: { crossCulturalSkill: 5 },
        stateEffect: (s) => {
          ensureSkills(s);
          s.happiness = clamp(s.happiness + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 2, 0, 100);
        },
        log: '31岁，你们吃完晚饭互加了Instagram，然后各自散了。你没有建群，也没有约下次。你知道你们大概率不会再见面——游民的社交就是这样，像天上的云，碰到了下场雨，然后各飘各的。但那晚的记忆留在了那里——你知道世界上有跟你一样的人，这就够了。',
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
      '上午你最大的客户发来邮件，说因为预算削减，本季度的合同终止了。这家客户占你收入的40%。你还没来得及消化，下午又收到移民局的通知——你所在国家的签证政策变了，你的收入证明不满足新的数字游民签证标准，续签被拒。\n\n' +
      '你有14天离境。你有40%的收入缺口。你的短租平台还有20天到期退不回来。你的存款还够撑三个月——如果你什么都不做的话。\n\n' +
      '你坐在异国的出租屋里，面前的笔记本电脑屏幕亮着，邮箱里是两封让你心慌的邮件。你突然觉得这个世界在提醒你：自由从来不是免费的，而账单总在最不巧的时候到。',
    options: [
      {
        id: 'emergency_pivot',
        label: '紧急转型，快速找新客户+新城',
        description: '72小时内联系所有潜在客户，同时申请另一个国家的签证',
        hint: '远程能力+12 · 跨文化+8 · 存款-5000 · 压力+18 · 信念+8 · 健康-5',
        hintColor: 'danger',
        skillGains: { remoteSkill: 12, crossCulturalSkill: 8 },
        savingsChange: -5000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 18, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
        },
        log: '30岁，你在72小时内做了两件事：给所有认识的人发了消息找新客户，同时申请了另一个国家的数字游民签证。两周后你到了新国家，三个新客户签了约——虽然收入比之前少了30%，但你活下来了。你后来在日记里写："自由不是没有风险，是能在风险中继续前行。"',
      },
      {
        id: 'retreat_home',
        label: '回来休整，等风暴过去',
        description: '暂时放弃游牧生活，回家降低成本、重建客户',
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
        log: '30岁，你回家了。父母的沙发成了你的临时基地。你用老家的低成本生活重建客户群，远程接海外单子。三个月后收入恢复了，但你心里始终有个声音在问：你是因为"暂时回去"还是"回去了就出不来了"？信念值在你心里动摇着——你不确定自己还有没有勇气再买一张单程票。',
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
        log: '30岁，你在数字游民的Discord群组里发了一条求助帖。24小时内你收到了50多条回复——有人给你推荐客户，有人帮你联系新国家的签证代办，有人直接说"我在巴厘岛有间空房，你先来住"。你坐在屏幕前哭了。你以为你是一个人在路上，但你不是——这条路你从来不是一个人走的。',
      },
    ],
  },

  // 32岁：政治动荡
  {
    id: 'nomad_crisis_political',
    title: '政变之夜',
    sceneTag: 'street',
    pathId: 'digital_nomad',
    ageRange: [32, 33],
    priority: 10,
    weight: 9,
    oncePerGame: true,
    eventType: 'crisis',
    conditions: (s) => s.narrativeBranch !== 'unassigned' && s.isAllInPath === true,
    narrative:
      '你选了一个风景优美、物价低廉的东南亚小城作为今年的基地。一切都很完美——便宜的公寓、快速的WiFi、友善的本地人、宽松的签证。\n\n' +
      '直到那天凌晨，你被外面的喧闹声吵醒。你打开Twitter，发现这个国家发生了军事政变。街道上有军队，网络开始不稳定，ATM前排起了长龙。\n\n' +
      '当地政府发来了紧急通知：建议外国人员尽快撤离。你看着你的护照——没有大使馆会来接你，你得自己想办法。\n\n' +
      '你的航班被取消了三次。银行账户因为网络封锁无法转账。你手里只有500美元现金和三天份的泡面。"流离失所"四个字，此刻才有了实打实的重量——不是旅游，不是冒险，是真的不知道明天在哪里。',
    options: [
      {
        id: 'evacuate_immediately',
        label: '不惜一切代价离开',
        description: '花高价买黄牛票，先去一个安全的城市再说',
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
        log: '32岁，你花了三倍价格从黄牛手里买到了一张去曼谷的机票。落地素万那普机场那一刻你双腿发软，直接坐在了地板上。你看着明亮的航站楼和有序的人群，第一次觉得"秩序"是世界上最奢侈的东西。你在曼谷待了两周恢复，然后默默把"选择基地国家"的标准从"便宜"改成了"稳定"。',
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
        log: '32岁，你留在了原地。断网的一周里你靠着泡面和瓶装水过活。你听到了远处的警报声和近处的哭声。两周后局势稳定了，网络恢复了，你打开邮箱发现客户们已经发了无数封"你还好吗"的邮件。你回复了"我还好"，但你知道"还好"这两个字背后藏着多少恐惧。你开始重新审视"自由"的代价。',
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
      '周一你还在 coworking space 跟客户开视频会。周三各个国家开始封锁边境。周五你所在的城市宣布封锁。你被困在一个月租的短租平台里，航班全部取消，签证自动延期但你也无处可去。\n\n' +
      '更糟糕的是经济影响——你的客户开始削减预算，三个项目被暂停，两个被取消。你的收入在一个月内跌了60%。但你注意到一件事：那些做实体生意的人比你惨得多，而你和游民社群里的朋友们——天生就是数字化的，远程办公、线上协作、云端交付，这套东西你们玩了十年。传统公司在手忙脚乱地学"怎么远程"，而你已经在这个赛道上跑了一圈。\n\n' +
      '你看着窗外的空荡荡的街道，突然想起你选择这条路时的一句话："我要在任何地方都能生活。"现在你被"困在"一个地方——这讽刺得让人想笑，又笑不出来。你的自由，在一场全球危机面前不堪一击。但你的数字化生存能力，是你手里唯一的牌。',
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
        log: '34岁，你在封锁的公寓里用两周时间开发了一个线上咨询产品和一个"远程团队管理"课程。你把AI工具用到了极致——用生成式AI快速产出课程大纲、用AI翻译做成多语言版本、用自动化工具搭起了整套交付流程。全球封锁反而成了你的机会——所有公司都在学怎么远程工作，而你是这方面的专家。你的收入在三个月后不仅恢复了，还超过了疫情前。你在日记里写："危机淘汰的是不适应的人。我在路上走了十二年，适应变化是我的本能。"',
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
// 晚期事件（ages 36-42，地缘动荡期 + 归巢期前段）
//
// 五阶段框架第4-5阶段：
//   地缘动荡期 (2040-2049, ages 36-49)：AI大规模替代初级知识工作，
//     地缘政治影响跨境流动，游民生态剧变
//   归巢与传承 (2050-2064, ages 50+)：回归沉淀，经验传承，退休反思
// ============================================================

const lateGameEvents: NarrativeEvent[] = [

  // 36岁：AI替代浪潮（跨分支）
  {
    id: 'nomad_late_ai_replacement',
    title: '你的活儿，AI也能干了',
    sceneTag: 'home',
    pathId: 'digital_nomad',
    ageRange: [36, 36],
    priority: 9,
    weight: 10,
    oncePerGame: true,
    eventType: 'normal',
    conditions: (s) => s.narrativeBranch !== 'unassigned' && s.isAllInPath === true,
    narrative:
      '2040年了。你打开Upwork看了一眼——以前你接的那种"搭一个多语言官网"的单子，现在客户直接用v0或者Lovable生成了，连设计师都不需要。平台上的初级开发单子少了70%，时薪从你当年的180块跌到了50块。\n\n' +
      '你的一个老客户发来消息："我们找到了一个AI方案，成本只有你报价的十分之一，所以这季度的合同就不续了。"你盯着那条消息，想起了十四年前你接的第一单——也是搭官网，时薪180块，你觉得那是你人生的入场券。现在那张入场券被AI撕了。\n\n' +
      '你打开你的收入报表看了一眼。好消息是：你的高级客户还在，他们要的不是"搭网站"，是"理解他们的生意然后给出方案"——这部分AI还做不了。坏消息是：你曾经依赖的"中间层"活儿——那些不太难但量大的单子——已经消失了。你必须在"往上走"和"被淘汰"之间做选择。',
    options: [
      {
        id: 'move_upmarket',
        label: '全面转向高端咨询，放弃执行层',
        description: '只接战略级项目，把执行交给AI工具',
        hint: '远程能力+10 · 跨文化+8 · 被动收入+10000/年 · 压力+10 · 信念+8',
        hintColor: 'positive',
        skillGains: { remoteSkill: 10, crossCulturalSkill: 8 },
        passiveIncomeChange: 10000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '36岁，你做了一个痛苦的决定：砍掉所有执行层的客户，只留战略咨询。头三个月收入跌了40%，你慌得睡不着。但第四个月，一个老客户介绍了一个大企业的新市场进入策略项目——报价是你以前一年执行收入的五倍。你终于明白：AI淘汰的是"干活的人"，不是"想清楚的人"。',
      },
      {
        id: 'leverage_ai_pipeline',
        label: '用AI搭建自动化交付管道',
        description: '把执行层工作全部AI化，用规模补利润',
        hint: '远程能力+12 · 被动收入+8000/年 · 压力+8 · 信念+5 · 健康-3',
        hintColor: 'positive',
        skillGains: { remoteSkill: 12 },
        passiveIncomeChange: 8000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 8, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '36岁，你没放弃执行层，而是用AI把它自动化了。你搭了一套pipeline：客户提需求→AI生成初稿→你审核修改→自动部署。以前一个项目要两周，现在两天。你用同样的时间接了五倍的量，利润率反而比以前高。但你心里清楚：你在跟AI赛跑，总有一天它会跑得比你快。',
      },
      {
        id: 'teach_what_ai_cant',
        label: '转型做培训，教别人"AI学不会的东西"',
        description: '把十四年的跨文化经验打包成课程',
        hint: '跨文化+10 · 语言+6 · 被动收入+12000/年 · 信念+10 · 幸福+5',
        hintColor: 'positive',
        skillGains: { crossCulturalSkill: 10, languageSkill: 6 },
        passiveIncomeChange: 12000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        log: '36岁，你开了一门课："AI时代的跨文化协作"。你教的不是技能——技能AI能教。你教的是"怎么在德国工程师沉默的时候读懂他其实不同意"、"怎么在日本客户说"我们研究研究"的时候知道这是拒绝"。这些东西AI学不会，因为它没有在路上走过十四年。课程上线第一个月卖了200份，你发现：你走过的路本身就是产品。',
      },
    ],
  },

  // 37-38岁：地缘政治收紧（跨分支）
  {
    id: 'nomad_late_geopolitical',
    title: '墙在长高',
    sceneTag: 'street',
    pathId: 'digital_nomad',
    ageRange: [37, 38],
    priority: 9,
    weight: 9,
    oncePerGame: true,
    eventType: 'normal',
    conditions: (s) => s.narrativeBranch !== 'unassigned' && s.isAllInPath === true,
    narrative:
      '这两年世界变了。你常用的三个游民基地——两个收紧了数字游民签证，一个因为地缘冲突被列为了"不建议前往"地区。你认识的游民朋友里，有人因为签证被拒滞留了三个月，有人因为银行账户被冻结差点破产。\n\n' +
      '你坐在成都的共享空间里，看着窗外的银杏叶发呆。你做了一个盘点：过去十五年你住过18个城市，跨越了11个国家。你的护照盖满了戳，你的邮箱里躺着来自20个国家的合同。但现在，"在任何地方生活"这件事，正在变得越来越难。\n\n' +
      '你的一个德国朋友在Signal上给你发消息："我在考虑回慕尼黑了。世界不再适合游荡了。"你盯着那条消息想了很久。你不想到这一天——但你必须面对一个问题：你的"自由"是建立在什么前提上的？那些前提还在吗？',
    options: [
      {
        id: 'domestic_arbitrage',
        label: '把基地转回国内，做"国内地理套利"',
        description: '用一线城市的远程收入，在低成本国内城市生活',
        hint: '远程能力+6 · 信念+5 · 压力-8 · 幸福+5 · 存款+5000',
        hintColor: 'positive',
        skillGains: { remoteSkill: 6 },
        savingsChange: 5000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress - 8, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '37岁，你在成都长租了一间公寓。你发现国内的地理套利依然成立——你的远程收入是成都平均工资的四倍，但生活成本只有一线城市的一半。你不用再办签证、不用再买国际机票、不用再在异国急诊室里独自签手术同意书。你偶尔会想念清迈的椰子壳味道，但你不再需要"永远在路上"来证明自己了。',
        isRestOption: true,
      },
      {
        id: 'keep_international',
        label: '继续国际化，但收缩到友好国家',
        description: '只去签证政策稳定、对游民友好的国家',
        hint: '跨文化+8 · 语言+5 · 信念+8 · 压力+8 · 存款-8000',
        hintColor: 'neutral',
        skillGains: { crossCulturalSkill: 8, languageSkill: 5 },
        savingsChange: -8000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '37岁，你没回头。你把基地收缩到了三个对游民最友好的国家——日本、葡萄牙、马来西亚。你花了更多时间研究签证政策、税务协定、医疗保险。自由的成本变高了，但你愿意付。你在日记里写："墙在长高，但总还有门。找到门是我的工作。"',
      },
      {
        id: 'hybrid_model',
        label: '半游半定：国内为主，海外为辅',
        description: '一年十个月国内、两个月海外，兼顾稳定和自由',
        hint: '远程能力+5 · 跨文化+6 · 信念+6 · 压力-3 · 幸福+8',
        hintColor: 'positive',
        skillGains: { remoteSkill: 5, crossCulturalSkill: 6 },
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress - 3, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '37岁，你找到了一个折中方案：一年十个月在成都或大理，两个月去海外。你在国内有稳定的社区、医保、生活节奏，但每年还有两个月的"在路上"。你发现这种节奏比"永远在路上"更可持续——你不再需要证明什么，你只是享受它。你在清迈的咖啡馆里遇到一个24岁的年轻游民，TA问你"你怎么做到走这么久的"，你笑了："因为我知道什么时候该停。"',
      },
    ],
  },

  // 38-39岁：身体信号（跨分支）
  {
    id: 'nomad_late_body_signal',
    title: '你的腰不干了',
    sceneTag: 'hospital',
    pathId: 'digital_nomad',
    ageRange: [38, 39],
    priority: 8,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    conditions: (s) => s.narrativeBranch !== 'unassigned' && s.isAllInPath === true,
    narrative:
      '你弯腰系鞋带的时候，腰突然"咔"了一声。你整个人僵在那里，冷汗顺着脊背往下淌。你扶着床沿慢慢坐到地上，用了十分钟才站起来。\n\n' +
      '医生看了你的X光片，说："腰椎间盘突出。你这些年是不是经常久坐、背包、睡不规律的床？"你苦笑——这不就是你的全部生活吗？在咖啡馆坐八小时、背着二十公斤的登机箱赶飞机、在各国软硬不一的床垫上翻来覆去。你的身体替你的自由付了十六年的账单，现在它来催收了。\n\n' +
      '医生说需要理疗三个月，不能久坐，不能搬重物。你看着你的日程表——下周有两个客户交付，下个月有一个海外会议。你的身体在说"停下来"，你的工作在说"继续走"。你第一次认真地想：自由和健康，到底怎么平衡？',
    options: [
      {
        id: 'slow_down_health',
        label: '认真养病，调整工作节奏',
        description: '推掉部分项目，用AI接管重复性工作，把身体放在第一位',
        hint: '健康+12 · 压力-10 · 信念+3 · 存款-5000 · 幸福+5',
        hintColor: 'positive',
        savingsChange: -5000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.health = clamp(s.health + 12, 0, 100);
          s.stress = clamp(s.stress - 10, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '38岁，你第一次把"身体"排在了"工作"前面。你推掉了两个项目，买了把人体工学椅，开始每天游泳。你用AI把剩余的重复性工作自动化了——以前要你亲自动手的排版、测试、部署，现在一条prompt就搞定。你发现养病的三个月反而让你的收入没怎么跌，因为AI替你干了你以前"亲力亲为"的那些事。你跟朋友说："身体是本钱这句话，以前觉得是废话，现在觉得是真理。"',
        isRestOption: true,
      },
      {
        id: 'push_through',
        label: '硬扛，吃药继续干',
        description: '吃止疼药撑过这段，等工作忙完再说',
        hint: '健康-10 · 压力+12 · 信念+5 · 存款+3000',
        hintColor: 'danger',
        savingsChange: 3000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.health = clamp(s.health - 10, 0, 100);
          s.stress = clamp(s.stress + 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '38岁，你选择了硬扛。止疼药、膏药、护腰——你把它们塞进登机箱，继续飞。在曼谷的机场你弯不下腰提行李，只好蹲下来一点一点挪。你的客户不知道你疼得冒冷汗还在给他们开会——你以为这是"专业"，其实这是"透支"。三年后你的腰椎彻底出了问题，医生说"早该治的"。你后悔了，但来不及了。',
        blindBoxTrigger: 'nomad_health_issue',
      },
      {
        id: 'hire_help_physical',
        label: '雇人帮你做体力活，自己只做脑力活',
        description: '在当地雇一个助理，帮你跑腿、搬东西、处理杂事',
        hint: '健康+5 · 远程能力+6 · 存款-10000 · 压力-5 · 信念+3',
        hintColor: 'neutral',
        savingsChange: -10000,
        skillGains: { remoteSkill: 6 },
        stateEffect: (s) => {
          ensureSkills(s);
          s.health = clamp(s.health + 5, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '38岁，你雇了一个当地的大学生帮你跑腿——取快递、办手续、搬行李。每个月花两千块，但你的腰不再疼了。你把省下来的精力全部投入高价值工作——跟客户开会、做战略规划、写方案。你发现：花钱买体力劳动的替代，是你这个年纪最值的投资。',
      },
    ],
  },

  // 39-40岁：传承冲动（跨分支）
  {
    id: 'nomad_late_mentorship',
    title: '有人问你怎么走这条路',
    sceneTag: 'co_living',
    pathId: 'digital_nomad',
    ageRange: [39, 40],
    priority: 8,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    conditions: (s) => s.narrativeBranch !== 'unassigned' && s.isAllInPath === true,
    narrative:
      '一个24岁的年轻人在游民Discord里私信你："我看了你写的游民生存指南，我也想走这条路。你能给我一些建议吗？"\n\n' +
      '你看着那条消息，想起了自己22岁时在Upwork上投了六十多份提案的日子。那时候没有人给你指南，你全靠自己摸。你踩过的坑——签证被拒、客户跑路、在异国急诊室独自签字——每一个都能写成一本书。\n\n' +
      '你回了一句"可以聊聊"，然后约了视频通话。聊到一半那个年轻人问你："你觉得这条路还值得走吗？AI都能干你当年干的活了。"你沉默了几秒。这个问题你自己也想过无数次。你怎么回答？',
    options: [
      {
        id: 'mentor_actively',
        label: '认真带TA，把经验传下去',
        description: '当TA的导师，手把手教，甚至合伙接一个项目',
        hint: '跨文化+8 · 信念+10 · 幸福+8 · 压力+3 · 被动收入+5000/年',
        hintColor: 'positive',
        skillGains: { crossCulturalSkill: 8 },
        passiveIncomeChange: 5000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
        },
        log: '39岁，你成了那个年轻人的导师。你带TA接了第一个项目，教TA怎么跟客户谈判、怎么管理时区、怎么在异国买保险。TA第一次拿到美元到账时给你发了张截图，你看着那个数字，想起了自己22岁时手抖着按下回车键的那一刻。你没说"我羡慕你"，你说"你会走得比我远"。这是真话。',
        triggersRetirementCheck: true,
      },
      {
        id: 'write_guide',
        label: '写一本"游民生存手册"，系统化输出经验',
        description: '把十七年的经验写成电子书/课程，被动收入化',
        hint: '远程能力+6 · 跨文化+6 · 被动收入+15000/年 · 信念+8 · 压力+5',
        hintColor: 'positive',
        skillGains: { remoteSkill: 6, crossCulturalSkill: 6 },
        passiveIncomeChange: 15000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '39岁，你花三个月写了一本《游民生存手册：从零到自由》。你写了签证攻略、税务规划、客户管理、跨文化沟通、AI工具链——还有你在清迈急诊室独自签字的那个夜晚。书上线第一天卖了500份。你在后记里写："这本书不是鼓励你上路，是让你知道路上有什么。走不走，是你的事。"',
        triggersRetirementCheck: true,
      },
      {
        id: 'honest_answer',
        label: '诚实告诉TA：这条路比以前难了',
        description: '不粉饰，不劝退，把真实的情况摆出来让TA自己判断',
        hint: '信念+5 · 跨文化+4 · 幸福+3',
        hintColor: 'neutral',
        skillGains: { crossCulturalSkill: 4 },
        stateEffect: (s) => {
          ensureSkills(s);
          s.happiness = clamp(s.happiness + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: "39岁，你跟那个年轻人聊了两个小时。你说：\"AI能干你以前干的活，但不代表这条路走不通了。它只是变了——从'出卖执行力'变成了'出卖判断力'。你要问自己的不是'AI能不能替代我'，是'我有没有AI给不了的判断'。\"年轻人沉默了很久，说\"谢谢你没骗我\"。你挂掉电话，觉得这比接了一个大单子还满足。",
      },
    ],
  },

  // 40岁：回望与选择（跨分支，归巢期开端）
  {
    id: 'nomad_late_reflection',
    title: '十八年',
    sceneTag: 'home',
    pathId: 'digital_nomad',
    ageRange: [40, 40],
    priority: 10,
    weight: 10,
    oncePerGame: true,
    eventType: 'normal',
    conditions: (s) => s.narrativeBranch !== 'unassigned' && s.isAllInPath === true,
    narrative:
      '你40岁了。你坐在大理的阳台上，面前是一杯普洱茶，远处是苍山的轮廓。你打开了一个空白文档，标题写了两个字："十八年"。\n\n' +
      '从22岁在Upwork上投第一份提案，到现在已经十八年了。你住过18个城市，跨越了11个国家，用过从Notion到AI编程器到通用大模型的每一代工具。你的护照换了三本，你的登机箱换了五个，你的腰椎间盘突出了一次。你赚过最贵的一小时是500美元，也经历过连续三个月没有收入的恐慌。\n\n' +
      '你问自己一个问题：如果重来一次，你还会选这条路吗？\n\n' +
      '你想了很久，在文档里写下了一句话："会。但会更早学会停下来。"\n\n' +
      '远处洱海的水面闪着金光。你关掉文档，打开了一个你一直在犹豫的项目——一份给年轻游民的线上课程。也许现在是时候了。',
    options: [
      {
        id: 'create_legacy',
        label: '创建游民学院，把经验变成体系',
        description: '把十八年的知识打包成系统课程+社区，建立传承',
        hint: '跨文化+10 · 远程能力+8 · 被动收入+20000/年 · 信念+12 · 幸福+10',
        hintColor: 'positive',
        skillGains: { crossCulturalSkill: 10, remoteSkill: 8 },
        passiveIncomeChange: 20000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
        },
        log: '40岁，你创建了"游民学院"。不是教技能——技能AI能教。你教的是"怎么在不确定性中生存"、"怎么在异国读懂空气"、"怎么在自由和孤独之间找到平衡"。第一批50个学员里有3个后来成了你认识的游民。你看着他们在群里分享自己的第一单、第一次签证被拒、第一次在异国急诊室独自签字——你想起了自己。火炬传下去了。',
        triggersRetirementCheck: true,
      },
      {
        id: 'settle_down_quietly',
        label: '安静地定居，享受你赚来的自由',
        description: '不再折腾，在一个喜欢的地方过喜欢的生活',
        hint: '幸福+15 · 压力-12 · 健康+8 · 信念+5',
        hintColor: 'positive',
        stateEffect: (s) => {
          ensureSkills(s);
          s.happiness = clamp(s.happiness + 15, 0, 100);
          s.stress = clamp(s.stress - 12, 0, 100);
          s.health = clamp(s.health + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '40岁，你选了大理。长租了一间带院子的房子，养了一条狗，种了一院子的花。你还在工作——远程客户、被动收入、偶尔接一个有意思的咨询。但你不再追了。你坐在院子里喝茶的时候，偶尔想起18个城市和11个国家，觉得像做了一场很长的梦。你醒了，但不后悔梦里的每一个早晨。',
        isRestOption: true,
        triggersRetirementCheck: true,
      },
      {
        id: 'keep_wandering',
        label: '还没到停的时候，继续走',
        description: '你的身体还行，你的心还没累，再走几年',
        hint: '跨文化+8 · 信念+10 · 压力+5 · 健康-3',
        hintColor: 'neutral',
        skillGains: { crossCulturalSkill: 8 },
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 5, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
        },
        log: '40岁，你没停。你买了下一张机票。你的朋友说你"疯了"，你笑了笑。你知道你不是在逃避什么——你只是还没看够。你在登机口排队的时候，看到旁边一个20出头的年轻人也拎着登机箱，眼睛里是你十八年前的那种光。你们对视了一眼，都没说话，但你们都懂。',
      },
    ],
  },

  // 42-47岁：生根（在一个地方住了三年）
  {
    id: 'nomad_late_roots',
    title: '生根',
    sceneTag: 'home',
    pathId: 'digital_nomad',
    ageRange: [40, 55],
    priority: 7,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    conditions: (s) => s.narrativeBranch !== 'unassigned' && s.isAllInPath === true,
    narrative:
      '你翻护照的时候突然意识到：你上一次入境章是三年前盖的。清迈。你在清迈已经住了三年。\n\n' +
      '三年。你以前最长在一个地方待过六个月。你有了固定的公寓——不是短租平台，是签了正式租约的那种，你自己买了冰箱和洗衣机。你有了固定的咖啡馆座位，老板知道你喝美式不加糖。你有了固定的摩托修理师傅、固定的菜市场摊位、固定的深夜喝粥的地方。你甚至在阳台上种了四盆香草——罗勒、薄荷、香茅、迷迭香，每一盆都活得好好的。\n\n' +
      '上周一个刚上路的年轻游民问你："你在这里待多久了？"你说"三年"，对方瞪大了眼睛："你还是数字游民吗？"\n\n' +
      '你被这个问题问住了。你还有远程客户，你的收入还是来自五个不同的国家，你 technically 随时可以打包走人。但你没有。你看着阳台上的香草，想起年轻时候的自己——那个每三个月就查一次机票、永远在准备下一站的人。那个人去哪里了？\n\n' +
      '你是停下来了，还是扎根了？这两者有区别吗？',
    options: [
      {
        id: 'accept_roots',
        label: '承认吧，你已经扎根了',
        description: '买房子（或签长约），正式把这里当作家',
        hint: '幸福+12 · 压力-10 · 健康+5 · 信念+8 · 存款-50000',
        hintColor: 'positive',
        savingsChange: -50000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.happiness = clamp(s.happiness + 12, 0, 100);
          s.stress = clamp(s.stress - 10, 0, 100);
          s.health = clamp(s.health + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '43岁，你在清迈买了一间小公寓——不大，但阳台够放四盆香草和一把藤椅。你终于不再续租了，这是你的。签完合同那天你坐在阳台上喝了一杯美式，第一次理解了"家"不是你出生的地方，是你选择留下来的地方。你还是数字游民吗？你不确定。但你确定的是，你回家了。',
        isRestOption: true,
      },
      {
        id: 'keep_nomad_identity',
        label: '扎根不等于定居，你还是游民',
        description: '保持随时可以走的状态，但不刻意移动',
        hint: '跨文化+8 · 信念+10 · 幸福+5 · 压力+3',
        hintColor: 'positive',
        skillGains: { crossCulturalSkill: 8 },
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.stress = clamp(s.stress + 3, 0, 100);
        },
        log: '43岁，你没买房，但也没走。你把租约续了一年，行李箱还是放在衣柜顶上——没打包，但随时可以拿下来。你跟那个年轻游民说："游民不是永远在移动，是永远有选择移动的自由。"TA不太懂，但你懂。你不再需要用"下一站是哪里"来证明自己是游民了。',
      },
      {
        id: 'shake_up',
        label: '是时候动一动了，卖了东西出发',
        description: '你发现自己在"定居"的惯性里待太久了，需要重新上路',
        hint: '跨文化+10 · 信念+6 · 压力+8 · 幸福-5 · 存款+20000',
        hintColor: 'danger',
        skillGains: { crossCulturalSkill: 10 },
        savingsChange: 20000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 8, 0, 100);
          s.happiness = clamp(s.happiness - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '43岁，你卖掉了冰箱和洗衣机，把四盆香草送给了楼下的咖啡馆老板娘，买了一张去墨西哥城的机票。落地的那一刻你发现——三年没动，你的背包比以前重了，你的心却轻了。你不确定这是"重新出发"还是"逃避"，但你确定的是：路还在脚下。',
      },
    ],
  },

  // 43-49岁：时差（身体跟不上时区变化）
  {
    id: 'nomad_late_body',
    title: '时差',
    sceneTag: 'home',
    pathId: 'digital_nomad',
    ageRange: [40, 55],
    priority: 7,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    conditions: (s) => s.narrativeBranch !== 'unassigned' && s.isAllInPath === true,
    narrative:
      '你从东京飞到里斯本，十二个小时的时差。以前你落地就能开电脑干活，睡一觉就好。这次不一样。\n\n' +
      '落地第一天你失眠了一整夜。第二天白天你困得像被人下了药，灌了三杯浓缩还是在会议上打了个盹——客户礼貌地问你"要不要休息一下"。第三天你凌晨四点醒了，睁着眼睛到天亮，脑子像被浆糊糊住了。第四天才勉强缓过来，但你的颈椎在抗议、你的胃在抗议、你的膝盖在抗议——它们好像在联合起来告诉你：你不再是二十多岁那个在机场地板上裹着睡袋就能睡八个小时的人了。\n\n' +
      '你站在镜子前看着自己。白头发多了几根，眼角的皱纹深了一点。你想起二十八岁那年，你连飞三十个小时从上海到圣保罗，落地当天就给客户做了个demo，结束后还去酒吧喝了一杯caipirinha。那时候你的身体像一台永远不会坏的发动机，时差是什么？不存在的。\n\n' +
      '现在飞一趟要恢复整整一周。你开始认真想：你的身体还能陪你飞多久？',
    options: [
      {
        id: 'slow_travel',
        label: '改成慢旅行，每个地方至少待三个月',
        description: '不再频繁移动，给自己的身体足够的适应时间',
        hint: '健康+10 · 幸福+8 · 压力-10 · 信念+5 · 跨文化+5',
        hintColor: 'positive',
        skillGains: { crossCulturalSkill: 5 },
        stateEffect: (s) => {
          ensureSkills(s);
          s.health = clamp(s.health + 10, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress - 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '45岁，你把旅行节奏从"每月一城"改成了"每季一城"。不再追着便宜机票跑，不再为了多去一个国家而压缩停留时间。你发现慢下来之后，你开始真正"看见"一个城市——不是游客眼里的景点，是当地人去的菜市场、街角的面包店、邻居家的猫。你的身体感谢你，你的灵魂也感谢你。',
        isRestOption: true,
      },
      {
        id: 'pick_timezone',
        label: '选定一个时区，不再跨时区飞',
        description: '把客户和基地都集中在同一个时区范围内',
        hint: '健康+8 · 远程能力+8 · 压力-8 · 信念+4 · 月薪-1000',
        hintColor: 'positive',
        skillGains: { remoteSkill: 8 },
        salaryChange: -1000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.health = clamp(s.health + 8, 0, 100);
          s.stress = clamp(s.stress - 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '45岁，你做了一个艰难的决定：推掉了所有美洲客户，只接欧洲和亚洲的单子。你把基地定在了里斯本——跟亚洲差七八个小时，但跟欧洲完全同步。收入少了一截，但你再也不用凌晨三点开会了。你终于理解了：自由不是什么时区都能工作，是有能力选择对自己好的时区。',
      },
      {
        id: 'push_body',
        label: '靠运动和补药硬扛',
        description: '健身、吃褪黑素、补维生素D，跟时差战斗到底',
        hint: '健康-5 · 远程能力+5 · 信念+5 · 压力+8 · 存款-5000',
        hintColor: 'danger',
        skillGains: { remoteSkill: 5 },
        savingsChange: -5000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.health = clamp(s.health - 5, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '45岁，你办了健身卡，买了GNC全套补剂，学会了用褪黑素和蓝光眼镜管理生物钟。你确实还能飞，但每次落地恢复的时间越来越长。你像一台老旧的机器，靠润滑油和维修勉强运转着。你知道这不是长久之计，但你还不想承认。',
      },
    ],
  },

  // 45-55岁：归处（找到家的感觉——也许不是地方是人）
  {
    id: 'nomad_late_home',
    title: '归处',
    sceneTag: 'home',
    pathId: 'digital_nomad',
    ageRange: [40, 55],
    priority: 7,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    conditions: (s) => s.narrativeBranch !== 'unassigned' && s.isAllInPath === true,
    narrative:
      '你在京都的一间町屋住了半年。这不是你住过最便宜的地方，不是最方便的地方，甚至不是天气最好的地方。\n\n' +
      '但某天早上你在玄关穿鞋准备去咖啡馆的时候，邻居田中太太递过来一盒刚做好的和菓子，说"おはよう、さん、これどうぞ"。你用磕磕巴巴的日语道谢，她笑着摆摆手走了。你捧着那盒和菓子站在玄关，阳光从木格子门里斜照进来，灰尘在光柱里跳舞。\n\n' +
      '你突然想起很多年前在清迈的夜市，卖芒果糯米饭的阿姨叫你"farang"；在里斯本的咖啡馆，服务员永远给你端错咖啡；在巴厘岛的co-working space，你永远是那个"路过的人"。你在很多地方住过，但你永远是客人。\n\n' +
      '这一刻在京都的玄关，你捧着邻居送的和菓子，突然理解了一件事：家不是一个地址。家是有人知道你早上喝美式不加糖、有人给你递一盒刚做的点心、有人在你咳嗽的时候问你"大丈夫ですか"。\n\n' +
      '也许家不是一个地方。也许家是一个人，或者一群人。也许你找了二十年的"归处"，不是地图上的一个点，是那些让你觉得"我属于这里"的瞬间。\n\n' +
      '你拿出手机，翻到了一个号码。是三年前在墨西哥城认识的一个人——TA也是游民，现在在京都大学做研究员。你们一直保持联系，偶尔在某个城市偶遇喝杯咖啡。你盯着那个号码很久，然后发了一条消息："你今天有空吗？我这里有很好吃的和菓子。"',
    options: [
      {
        id: 'settle_for_person',
        label: '为一个人留下来',
        description: '也许归处不是地方，是那个让你想停下来的人',
        hint: '幸福+15 · 信念+10 · 压力-10 · 健康+5 · 跨文化+8',
        hintColor: 'positive',
        skillGains: { crossCulturalSkill: 8 },
        stateEffect: (s) => {
          ensureSkills(s);
          s.happiness = clamp(s.happiness + 15, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.stress = clamp(s.stress - 10, 0, 100);
          s.health = clamp(s.health + 5, 0, 100);
        },
        log: '48岁，你在京都留了下来。不是因为京都有多美——虽然它确实美——是因为TA。你们在町屋附近租了一间带小庭院的房子，你种了一棵枫树，TA养了一只三花猫。你还是远程工作，TA还是去大学做研究。早上你们一起在庭院喝咖啡，晚上你们一起在厨房做饭——你做中餐，TA做日料。你花了二十多年才明白：游牧的终点不是某个地方，是某个人。你终于不用再找了。',
        triggersRetirementCheck: true,
      },
      {
        id: 'build_community_home',
        label: '在社区里找到归属',
        description: '不是为某个人，而是为一群人、一个社区留下来',
        hint: '幸福+12 · 跨文化+12 · 信念+8 · 压力-8 · 被动收入+8000/年',
        hintColor: 'positive',
        skillGains: { crossCulturalSkill: 12 },
        passiveIncomeChange: 8000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.happiness = clamp(s.happiness + 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.stress = clamp(s.stress - 8, 0, 100);
        },
        log: '48岁，你在京都的町屋续了长约。你加入了当地的町内会，学会了在祭典上抬神舆，教田中太太的孙子用AI做作业。你开了一间小小的中文教室，教附近的老人用智能手机跟海外的孙子视频。你的归处不是一栋房子，是这一整条街的人——他们认识你，你认识他们。你的护照上还有很多空白页，但你不急着填满了。',
        triggersRetirementCheck: true,
      },
      {
        id: 'home_is_road',
        label: '路本身就是归处',
        description: '你不需要一个固定的家，在路上的感觉才是家',
        hint: '跨文化+10 · 信念+12 · 幸福+5 · 压力+3 · 健康-3',
        hintColor: 'neutral',
        skillGains: { crossCulturalSkill: 10 },
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.stress = clamp(s.stress + 3, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
        },
        log: '48岁，你谢了田中太太的和菓子，第二天打包了行李。你发了一条消息给那个在京都的朋友："和菓子很好吃，下次我请你喝墨西哥的mezcal。"TA回了一个笑的表情。你买了一张去里斯本的机票——不是为了逃避什么，是因为你终于确认了一件事：有些人的家是一座房子，有些人的家是一个人，而你的家是下一站的风。你不需要归处，因为你从未离开过家。',
      },
    ],
  },

  // 47岁：父母生病你在万里之外
  {
    id: 'nomad_midlife_parents_sick',
    title: '万里之外',
    sceneTag: 'airport',
    pathId: 'digital_nomad',
    ageRange: [47, 47],
    priority: 8,
    weight: 10,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '凌晨三点你的手机震了。你妈在电话里哭：你爸突发脑梗，正在抢救。\n' +
      '你在墨西哥城。飞回去最快也要28个小时——转机两次，机票是你三个月的房租。你一边穿衣服一边查航班，手抖得系不上鞋带。你打开银行APP看了看余额——够买机票，但接下来两个月会很紧。\n' +
      '你坐在去机场的出租车上，窗外是墨西哥城凌晨四点的霓虹。你想起这些年你在清迈、在里斯本、在巴厘岛、在京都发过的朋友圈——阳光、沙滩、咖啡馆、落日，点赞数最高的那些照片里，从来没有医院的走廊。你自由了二十年，但自由的代价是：你爸被推进手术室的时候，你还在地球的另一端打车。',
    options: [
      {
        id: 'fly_back_immediately',
        label: '立刻飞回去，什么都不管了',
        description: '工作可以再找，爸只有一个',
        hint: '幸福+5 · 压力+15 · 存款-30000 · 信念-3 · 跨文化+5',
        hintColor: 'danger',
        skillGains: { crossCulturalSkill: 5 },
        savingsChange: -30000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 3, 0, 100);
        },
        log: '47岁，你在机场等了十二个小时，飞了二十八个小时，赶到医院的时候你爸已经脱离危险了。他看到你第一句话是"你怎么回来了"，嘴上抱怨但手紧紧攥着你的手。你在医院陪了他三个月，远程推掉了一半的客户。你损失了收入和几个长期合同，但你不后悔——你终于明白：自由不是永远不回头，是回头的时候，有人还在。',
      },
      {
        id: 'arrange_remote_care',
        label: '远程安排最好的医院和护工，继续工作',
        description: '你回去也帮不上忙，不如赚钱请最好的人',
        hint: '存款-50000 · 压力+10 · 信念+5 · 幸福-8',
        hintColor: 'neutral',
        savingsChange: -50000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.happiness = clamp(s.happiness - 8, 0, 100);
        },
        log: '47岁，你没飞回去。你远程联系了最好的三甲医院、请了最贵的护工、每天视频三次。你爸恢复得不错，但每次视频你妈都欲言又止。你知道她想说什么——"你就不能回来吗？"你也想。但你算了账：飞回去就意味着丢客户、断收入，你爸后续的康复费谁出？你用金钱换了时间，也知道这是游牧人的宿命——你选择了世界，就必须承受世界离你最远的时候。',
      },
      {
        id: 'return_for_good',
        label: '飞回去，而且不走了',
        description: '二十年的游牧，该回家了',
        hint: '幸福+10 · 信念-10 · 压力-5 · 健康+5',
        hintColor: 'positive',
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 10, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
          s.health = clamp(s.health + 5, 0, 100);
        },
        log: '47岁，你飞到医院，陪了你爸三个月。他出院那天你退掉了所有远程合同，在老家附近租了间房子。你妈以为你疯了——"你不是最喜欢到处跑吗？"你说"跑累了"。你没有完全放弃远程工作，但你不再追着签证和机票跑了。你花了二十年看世界，现在你想陪爸妈慢慢变老。自由是有保质期的，而有些东西过了就没了。',
      },
    ],
  },

];

// ============================================================
// 失败预警事件（isAllInPath=true 且 pathFaith<40 或存款告急时触发）
// ============================================================

const nomadWarningEvents: NarrativeEvent[] = [

  // 预警1：远程客户断了，收入归零，邮箱没人回
  {
    id: 'nomad_warning_income_dry',
    title: '邮箱里的沉默',
    sceneTag: 'co_living',
    pathId: 'digital_nomad',
    ageRange: [28, 50],
    priority: 15,
    weight: 10,
    oncePerGame: true,
    eventType: 'crisis',
    conditions: (s) => s.isAllInPath === true && (s.pathFaith < 40 || s.currentSavings < 50000),
    narrative:
      '你已经连续三天没有收到任何工作邮件了。\n\n' +
      '三天前，你最大的两个客户同时发来了消息——一个说"公司架构调整，本季度暂停所有外包合同"，另一个直接消失了，已读不回。你给他们发了follow-up，发了WhatsApp，甚至打了语音电话，全都石沉大海。\n\n' +
      '你翻遍了通讯录，给所有曾经合作过的客户发了问候。大部分没有回复。两个回复了"暂时没有预算"。一个说"你之前的报价太高了，我们找了个菲律宾的团队，三分之一的价格"。\n\n' +
      '你的银行账户数字在以肉眼可见的速度下降。房租是美元计价的，签证续费的日子在逼近，机票改签费还没退回来。你打开Upwork和Fiverr，发现你的profile已经沉到了第七八页——这个平台永远有更年轻、更便宜、更饥渴的人。\n\n' +
      '凌晨三点，你坐在异国的出租屋里，屏幕的蓝光映在脸上。收件箱空空荡荡，像一个无声的嘲笑。你第一次认真地想：自由职业的"自由"，是不是建立在一种随时可能断裂的钢丝上？',
    options: [
      {
        id: 'slash_rates_rebuild',
        label: '降价抢单，先活下来再说',
        description: '把报价砍掉40%，接所有能接的活，重建客户管道',
        hint: '远程能力+5 · 存款+8000 · 信念-12 · 压力+15 · 健康-6 · 幸福-8',
        hintColor: 'danger',
        skillGains: { remoteSkill: 5 },
        savingsChange: 8000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith - 12, 0, 100);
          s.stress = clamp(s.stress + 15, 0, 100);
          s.health = clamp(s.health - 6, 0, 100);
          s.happiness = clamp(s.happiness - 8, 0, 100);
        },
        log: '你把报价砍了40%，在Upwork上接了一堆你以前看不上的小活。钱是少了，节奏是乱了，尊严是碎了——但你活下来了。三个月后你的客户数量恢复了，虽然客单价只有从前的一半。你学会了一件事：自由不是高傲地站着，是在跪着的时候还能往前走。',
      },
      {
        id: 'pivot_to_local',
        label: '转做本地市场，落地生根',
        description: '不再依赖远程海外客户，在当地找生意、建立线下收入',
        hint: '跨文化+12 · 语言+10 · 存款-15000 · 信念-5 · 压力+10 · 幸福+3',
        hintColor: 'neutral',
        skillGains: { crossCulturalSkill: 12, languageSkill: 10 },
        savingsChange: -15000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
          s.stress = clamp(s.stress + 10, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
        },
        log: '你开始在当地找生意——给本地小店做网站，给旅行社做中英文社交媒体，教当地人做跨境电商。你的语言能力突飞猛进，甚至开始用当地语言讲价和开玩笑。收入没有远程时代高，但你第一次觉得自己不是一个"过客"，而是一个在某个地方扎了根的人。',
      },
      {
        id: 'emergency_fund_dip',
        label: '咬牙撑住，动用积蓄熬过去',
        description: '不降价不转型，相信这只是暂时的低谷，用存款撑到客户回来',
        hint: '存款-30000 · 信念-3 · 压力+20 · 健康-10 · 幸福-5',
        hintColor: 'negative',
        savingsChange: -30000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith - 3, 0, 100);
          s.stress = clamp(s.stress + 20, 0, 100);
          s.health = clamp(s.health - 10, 0, 100);
          s.happiness = clamp(s.happiness - 5, 0, 100);
        },
        log: '你没有降价，也没有转型。你每天早上七点起来刷招聘平台、发cold email、优化作品集。存款在缩水，睡眠在减少，你开始掉头发。但两周后，一个三个月前联系过的客户回了消息——他们拿到了B轮融资，需要有人立刻接手一个大项目。你看着那封邮件，手在发抖。你熬过来了——但你永远忘不了收件箱沉默的那三个星期。',
      },
    ],
  },

  // 预警2：签证快到期，下一站不知道去哪，漂泊感压过来
  {
    id: 'nomad_warning_visa_panic',
    title: '无处可去',
    sceneTag: 'street',
    pathId: 'digital_nomad',
    ageRange: [28, 50],
    priority: 14,
    weight: 10,
    oncePerGame: true,
    eventType: 'crisis',
    conditions: (s) => s.isAllInPath === true && (s.pathFaith < 40 || s.currentSavings < 50000),
    narrative:
      '你的签证还有十二天到期。\n\n' +
      '你已经花了整整一周研究下一个目的地，但每一个选项都在你面前关上了门。泰国的数字游民签证要求月收入证明，你上个月的收入是零。印尼的Bali签证政策突然收紧，所有在途申请被搁置。葡萄牙的D7签证需要半年内的银行流水——你的流水最近三个月全是支出，没有进账。日本的旅游签证只能待九十天，而且不能工作。\n\n' +
      '你甚至认真查了回国的机票。但"回国"两个字在你心里像一块石头——你辞职的时候跟所有人说"我要去看世界"，你动态圈里全是海滩和咖啡馆的照片，你妈妈上次打电话说"你什么时候回来"的时候你还说"快了快了，这边挺好的"。现在带着空空的钱包和失败的狼狈回去？\n\n' +
      '你站在公寓的阳台上，看着楼下陌生的街道和陌生的文字，突然意识到一件事：你不属于这里。你也不属于那里。你不属于任何地方。你是一个没有地址的人，一个在地图上移动的点，一个随时可能被任何国家要求离开的访客。\n\n' +
      '"家"这个字突然变得很沉重。你以前觉得家是一个你随时可以离开的地方，现在你发现它可能是一个你随时回不去的地方。',
    options: [
      {
        id: 'visa_run_desperate',
        label: '做签证跑，先续上身份再说',
        description: '飞到免签/落地签国家，短期停留再想办法',
        hint: '存款-20000 · 跨文化+6 · 信念-5 · 压力+18 · 幸福-10',
        hintColor: 'danger',
        skillGains: { crossCulturalSkill: 6 },
        savingsChange: -20000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
          s.stress = clamp(s.stress + 18, 0, 100);
          s.happiness = clamp(s.happiness - 10, 0, 100);
        },
        log: '你买了一张飞格鲁吉亚的机票——免签，消费低，至少能待一年。飞机落地的时候你只有一个背包和一台电脑，连住处都没订。你在第比利斯的老城区找了间15美元一晚的青旅，在床上躺了两天没出门。第三天你打开电脑，开始重新找客户。漂泊是狼狈的，但至少你还在路上——虽然"路上"这两个字，此刻听起来一点也不浪漫。',
      },
      {
        id: 'return_home_rebuild',
        label: '承认撑不住了，先回去',
        description: '买一张单程机票回家，在低成本环境下重新积累',
        hint: '存款-8000 · 信念-20 · 压力-8 · 健康+5 · 幸福+5',
        hintColor: 'negative',
        savingsChange: -8000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith - 20, 0, 100);
          s.stress = clamp(s.stress - 8, 0, 100);
          s.health = clamp(s.health + 5, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        log: '你买了回国的单程票。飞机落地的那一刻，你闻到了机场里熟悉的中文标识和方便面的味道，眼泪差点掉下来。你没有发动态圈。你住进了父母家的老房间，那张你高中时睡的床还在。妈妈什么都没问，只是每天多煮一碗饭。三个月后你开始在国内远程接单，收入只有从前的六成，但你终于可以睡一个整觉了。你没有放弃这条路——只是换了一个坐标继续走。',
        isRestOption: true,
      },
      {
        id: 'marry_or_apply_longterm',
        label: '想办法拿长期居留，结束漂泊',
        description: '找当地律师办理长期签证/居留权，不管花多少钱',
        hint: '存款-50000 · 语言+8 · 跨文化+8 · 信念+5 · 压力+12 · 幸福+8',
        hintColor: 'neutral',
        skillGains: { languageSkill: 8, crossCulturalSkill: 8 },
        savingsChange: -50000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.stress = clamp(s.stress + 12, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
        },
        log: '你花了一大笔律师费，申请了当地的企业家居留签证。过程繁琐到你想放弃三次——无犯罪记录证明要双认证、银行存款要冻结半年、商业计划书要改五版。但六个月后，你拿到了那张卡。你不再是"游客"，你不再需要每九十天飞一次签证跑。你第一次在一个异国的官方文件上看到了自己的名字和地址。你终于有了一个"地址"——哪怕只是暂时的。',
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
  ...nomadWarningEvents,
  ...lateGameEvents,
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
    narrative: `你在一个细分领域做到了"提到这个需求就想到你"的程度。你的客户名单上有三家上市公司，你的waiting list排到了三个月后。\n\n一个潜在客户在邮件里说："我们问了一圈，所有人都推荐找你。"你看着这句话愣了很久。邮箱里还存着当年那58封"Thank you for your interest"的拒信，最旧的一封日期已经是八年前。原来"不可替代"不是一个状态，是一个过程——你花了八年，终于走到了这里。`,
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
    narrative: `你的被动收入（retainer+订阅）覆盖了你的全部生活开销。你可以在国内任何角落生活，不需要为钱工作。\n\n你在大理的公寓里醒来，阳光透过窗帘洒在笔记本电脑上。你打开邮箱，7个retainer客户的月费已经到账。你不需要今天工作——但你还是打开了Slack，不是因为必须，是因为你想。\n\n第一张单程票还夹在你旧笔记本的最后一页，票根上的字迹已经褪了。那时你赌的是"地理是最大的杠杆"。十三年后你证明了自己：你用小城最低的生活成本，活出了最高的自由度。你的钱赚自海外客户，花在小城物价里，存在多个账户里。没有人能告诉你"你应该在哪里"——因为你在哪里，哪里就是你的办公室。`,
    pathId: 'digital_nomad',
    branch: 'nomad_freelancer',
    level: 3,
    skillRequirements: { remoteSkill: 75, languageSkill: 50, crossCulturalSkill: 40 },
    passiveIncomeChange: 40000,
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 12);
    },
    log: `你的被动收入覆盖了全部生活开销。你在国内任何角落都不需要为钱工作。数字游民的终极形态不是"在路上"，是"在哪里都行"。被动收入+40000/年。`,
    triggersRetirementCheck: true,
  },
];

// ------------------------------------------------------------
// 异地创业线 (nomad_entrepreneur) —— 用产品化服务实现规模化的自由
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
    narrative: `你把公司交给了团队管理，自己只保留股东身份。你在万宁的一个海边小镇住了下来，每天写书、冲浪、发呆。\n\n某个周二下午你打开dashboard看了一眼——月收入又创新高。你的公司在你睡觉的时候、在你冲浪的时候、在你不想管的时候，依然在为你赚钱。你关掉dashboard，去厨房给自己泡了一杯茶。\n\n你想起25岁那年你说"一个人加一台电脑就能做跨城公司"。所有人都觉得你在说梦话。现在你的公司有8个员工、20万月收入、覆盖全国的客户——而你正在海边喝茶。你赌对了：地点无关不是一种生活方式，是一种商业模式的终局。`,
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
    narrative: `你在三个跨境项目中扮演了"翻译官"的角色——不是语言的翻译，是文化的翻译。客户开始把你当"不可或缺的人"。\n\n一个日本客户在项目结束后给你发了一封手写的感谢信（用汉字写的），说"没有你，我们和中国团队的沟通不可能这么顺利"。你把这封信贴在了你短租平台的冰箱上。你走过的每一个国家、学过的每一句当地话、跨过的每一次文化冲击——它们没有白费，它们变成了你的核心竞争力。`,
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
    narrative: `你的LinkedIn文章累计阅读量超过100万。你的CCBM方法论被三所商学院纳入课程。德勤邀请你做年度合作伙伴。\n\n你在一个行业大会上做keynote，台下坐着500人。你讲完最后一页slide时，掌声持续了整整30秒。你站在台上，聚光灯很烫，第一次在coworking space做英文presentation时那种喉咙发紧的感觉忽然涌上来——那时你连英语都说不利索，现在你站在500人面前用英语讲"文化智商"——而且他们在鼓掌。`,
    pathId: 'digital_nomad',
    branch: 'nomad_consultant',
    level: 2,
    skillRequirements: { crossCulturalSkill: 55, languageSkill: 50 },
    passiveIncomeChange: 15000,
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 10);
    },
    log: `你的职业社交网络文章累计阅读100万+，CCBM被三所商学院纳入课程，德勤年度合作伙伴。500人大会keynote获30秒掌声。被动收入+15000/年。`,
  },

  // 终极：知识产品化的终极自由
  {
    id: 'nomad_consultant_3',
    title: '你的知识不再需要你',
    narrative: `CCBM课程有了2000+学员，认证体系覆盖15个国家，你的方法论变成了一种行业标准。你的被动收入——课程、认证费、书籍版税——覆盖了你全部的生活开销。\n\n你在成都的阳台上浇花，手机响了——是CCBM杭州分部的负责人，说他们本月新增了50个认证学员。你回复了"恭喜"，然后放下手机继续浇花。你的知识在杭州运转着，而你在成都浇花。这就是知识产品化的终极自由：你创造了一个比你更大的东西，它在替你工作，替你影响世界，替你赚钱。你终于从"卖时间"进化到了"卖认知"，从"卖认知"进化到了"卖体系"。你的身体可以停下来，但你的知识不会。`,
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
