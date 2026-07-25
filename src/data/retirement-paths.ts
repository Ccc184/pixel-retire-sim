/**
 * 退休路径系统 - 6条赌未来的路径完整剧情数据
 *
 * 每条路径都是对"未来50年世界会变成什么样"的一个判断。
 * 赌对了提前自由，赌错了归零重来。
 * 戏剧性来自赌注本身、中途的信念动摇、以及情感线的冲突。
 */
import type { GameState, RetirementPathId } from '../types/global.d.js';
import { switchCity } from '../utils/math-engine.js';

// ============================================================
// 路径接口定义
// ============================================================
export interface RetirementPath {
  id: RetirementPathId;
  name: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;

  /** 第一年选择后立刻应用的初始效果 */
  initialEffect: (state: GameState) => void;

  /** 卡牌类别权重：>1加权出现，<1降权 */
  cardWeights: Record<string, number>;

  /** 专属十字路口事件ID */
  exclusiveCrossroads: string[];

  /** 年初心境独白库（按年龄段） */
  openingMonologues: {
    ageRange: [number, number];
    texts: string[];
  }[];

  /** 副业阶段（All In前）的心境独白，未定义则回退到openingMonologues */
  sideHustleMonologues?: {
    ageRange: [number, number];
    texts: string[];
  }[];

  /** 信念动摇时的内心独白 */
  faithCrisisMonologues: string[];

  /** 退休成功判定 */
  checkSuccess: (state: GameState) => boolean;

  /** 成功结局标题和正文片段 */
  successTitle: string;
  successEnding: (state: GameState) => string;

  /** 失败结局标题和正文片段 */
  failureTitle: string;
  failureEnding: (state: GameState) => string;

  /** 退休年龄（成功时的预期退休年龄） */
  targetRetireAge: number;
}

// ============================================================
// 路径1：AI共生者
// ============================================================
const aiSymbiote: RetirementPath = {
  id: 'ai_symbiote',
  name: 'AI共生者',
  icon: '🤖',
  color: '#00d4ff',
  subtitle: '赌AI不会取代人，但会取代不用AI的人',
  description: '你决定站在AI这一边。不是对抗它，而是成为最会驾驭它的人。如果AI是浪潮，你要做冲浪的人，而不是被卷走的人。',

  initialEffect: (state) => {
    state.stress = Math.min(100, state.stress + 5);
    // pathFaith 由 selectRetirementPath() 统一设置为40，此处不再覆盖
    state.passiveIncome = 0;
    state.lifeLog.push('22岁这年你做了一个决定：白天上班，晚上All in AI。别人刷短视频的时候你在调提示词，别人聚会的时候你在跑模型。这还只是副业——但你赌它是未来。');
  },

  cardWeights: {
    '技能进修': 2.5,
    '投资理财': 0.4,
    '生活消费': 0.5,
    '健康养生': 1.2,
    '💝 感情': 0.7,
    '社交关系': 0.6,
    '核心决策': 1.5,
    '阶段解锁': 1.0,
  },

  exclusiveCrossroads: [
    'ai_skill_devaluation',   // 28岁：AI跃迁，技能贬值
    'ai_all_in_product',      // 32岁：要不要All in做AI产品
    'ai_ethics_dilemma',      // 35岁：AI训练数据伦理困境
  ],

  openingMonologues: [
    { ageRange: [22, 25], texts: [
      '你已经习惯了和AI对话比和人对话多。它永远在线，永远不烦你，永远给你答案。有时候你会想：如果它有一天有了意识，它会不会记得我？',
      '同事开始叫你"AI大神"，因为什么问题到你手里AI两分钟就解决了。你笑了笑没说什么——你只是比他们早半年开始用而已。',
      '你梦到自己变成了一段提示词，醒来后盯着天花板发了十分钟呆。',
    ]},
    { ageRange: [26, 30], texts: [
      'AI的能力增长速度让你害怕。上个月你还在为某个技巧沾沾自喜，这个月它已经内置了。你不得不跑得更快。',
      '你开始思考一个问题：当AI能做90%的工作时，那剩下的10%到底是什么？是创造力？是判断力？还是只是人类的自我安慰？',
      '你的工资涨了，但你的睡眠少了。你不敢停下来，因为你知道一旦停下，就会被那些"后浪"用AI追上。',
    ]},
    { ageRange: [31, 35], texts: [
      '你已经不再追求"会用AI"了——现在人人都会。你在追求"定义AI应该做什么"，那才是真正不可替代的位置。',
      '公司开始裁员，第一批走的就是那些拒绝用AI的老员工。你看着他们收拾纸箱，心里不是滋味——但你知道这就是你赌的未来。',
      '你的伴侣问你"你天天对着电脑，到底在搞什么"。你想解释什么是Agent、什么是多模态，但话到嘴边变成了"工作"。',
    ]},
    { ageRange: [36, 45], texts: [
      '你不再焦虑了。要么你已经在这条路上走通了，要么你已经接受了走不通的事实。',
      'AI已经像水电一样无处不在。你想起22岁那年做的决定，觉得年轻的自己既天真又勇敢。',
      '你开始带徒弟了，教他们怎么和AI协作。你发现最难教的不是技术，是"什么时候不要用AI"。',
    ]},
  ],

  sideHustleMonologues: [
    { ageRange: [22, 25], texts: [
      '白天你在公司写着重复的代码，晚上回家打开ChatGPT和Cursor，像换了一个人。你的AI副业从帮人写提示词开始，一单50块。不多，但那种"用新东西赚钱"的快感让你上瘾。',
      '你在工位上偷偷跑着一个AI自动化脚本，帮一个客户处理数据。组长路过看了一眼你的屏幕，以为你在写周报。你心里暗笑——你的副业时薪已经是主业的四倍了。',
      '同事聊ChatGPT只会问它"写一首诗"，你已经用它搭了三个自动化工作流、微调了两个模型、写了一套提示词模板被人当教程转发。但没有人知道这些——在公司，你只是一个"会用点AI的普通员工"。',
    ]},
    { ageRange: [26, 30], texts: [
      '你的AI副业收入已经稳定超过主业了。每个月你在Upwork和国内平台上接AI外包，做提示词咨询、模型微调、自动化流程搭建。你算过：如果全职做，收入至少翻三倍。但你还在犹豫——社保、公积金、年终奖，这些"安全绳"让你不敢松手。',
      '你开始在社交媒体上分享AI教程，粉丝涨得很快。有人私信你问"能不能做企业培训"，报价是你两个月的工资。你看着那条消息，又看了看桌上还没写完的周报，第一次认真想：我是不是在浪费时间？',
      '凌晨一点你刚交付一个AI项目，客户发来消息说"太棒了，下个月还有个大单要不要接"。你倒在床上，闹钟还有六小时响——明天还要上班。你的身体在抗议，但你的银行账户在欢呼。',
    ]},
    { ageRange: [31, 35], texts: [
      '你在公司已经心不在焉了。开会的时候你在想AI项目的架构，写周报的时候你在回客户的消息。组长问你"最近状态怎么样"，你说"挺好的"——其实你已经一个月没认真做过主业的事了。',
      '你的AI副业已经不是一个"副业"了——它是一个小生意。你有五个长期客户、一个助手、一套标准化的交付流程。唯一让它还是"副业"的，是你还没递那封辞职信。',
      '你开始觉得上班是在"浪费赚钱的时间"。每天八小时坐在工位上，你能算出这八小时如果用来做AI能赚多少。这个数字让你坐立不安。你知道，辞职只是时间问题——问题是什么时候。',
    ]},
  ],

  faithCrisisMonologues: [
    '你开始怀疑：你是不是只是在给自己制造一种"我不会被取代"的幻觉？也许AI不需要驾驭者，它只需要一个开关。',
    '深夜你关掉所有AI工具，试着用自己的脑子写一段代码。写了三行你就放弃了——你发现自己已经不会独立思考了。',
    '你参加了一个行业聚会，发现每个人都在说同样的话：AI、赋能、范式转移。你突然觉得恶心。',
  ],

  checkSuccess: (state) => {
    // 成功条件：存款>=年支出×12 且 信念值>=40 且 年龄>=30（给时间验证）
    const annualExpense = state.annualBaseCost + (state.currentMortgageCost || 0);
    return state.currentSavings >= annualExpense * 12 && state.pathFaith >= 40 && state.currentAge >= 30;
  },

  successTitle: '浪潮之上',
  successEnding: (state) => {
    const years = state.currentAge - 22;
    return `${state.currentAge}岁这年你提交了退休申请。不是因为你不想工作了，而是你终于不需要为了钱工作了。\n\n回头看这${years}年，你做对了一件事：你没有对抗浪潮，你学会了冲浪。AI确实取代了很多人，但也成就了你。\n\n你银行卡里的数字足够你接下来的人生不工作也能活得不错。你关掉最后一个工作群，深吸一口气。窗外阳光很好。\n\n那些熬夜学AI的夜晚，那些被人说"不务正业"的嘲笑，那些怀疑自己的深夜——都值了。`;
  },

  failureTitle: '浪潮之下',
  failureEnding: (state) => {
    return `${state.currentAge}岁了，你还在打工。\n\n不是你不努力，是浪潮比你想象的更大。你学会了AI工具，但所有人都学会了。你做了AI产品，但竞品三个月就抄了过去。你赌对了方向，但赌错了时机——或者说，浪潮太大，你只是浪里的一滴水。\n\n你看着新来的应届生用你听都没听过的AI框架三下五除二解决了你花一周做的事，你明白了：在这条路上，没有人能永远站在浪尖。\n\n你没有提前退休，但你也没有被淘汰。你只是变成了一个"会用AI的普通人"，就像当年会用Excel的人一样。\n\n也许这就是大多数人的结局吧。`;
  },

  targetRetireAge: 38,
};

// ============================================================
// 路径2：链上原住民
// ============================================================
const chainNative: RetirementPath = {
  id: 'chain_native',
  name: '链上原住民',
  icon: '⛓️',
  color: '#f7931a',
  subtitle: '赌代码即法律，链上即自由',
  description: '你相信去中心化是未来。法币会贬值，公司会倒闭，政府会滥发货币，但区块链不会撒谎。你把命运押在链上。',

  initialEffect: (state) => {
    state.stress = Math.min(100, state.stress + 10);
    // pathFaith 由 selectRetirementPath() 统一设置为40，此处不再覆盖
    state.passiveIncome = 0;
    // 用存款的30%买了初始仓位（从存款中扣）
    const initialBuy = Math.round(state.currentSavings * 0.3);
    state.currentSavings -= initialBuy;
    (state as any).chainHoldings = initialBuy; // 初始持仓价值 = 实际买入金额
    // 链上持仓是独立资产，不占用存款分布百分比；剩余现金全部在余额宝
    state.speculationPct = 0;
    state.bankDepositPct = 100;
    state.lifeLog.push('22岁这年你把第一笔存款的30%换成了加密货币。室友说你疯了，你爸说你被传销骗了。白天你照常上班，凌晨三点你盯着K线——这还只是副业，但你在等一个All in的时机。');
  },

  cardWeights: {
    '技能进修': 0.8,
    '投资理财': 2.5,
    '生活消费': 0.3,
    '健康养生': 1.0,
    '💝 感情': 0.5,
    '社交关系': 0.4,
    '核心决策': 2.0,
    '阶段解锁': 0.8,
  },

  exclusiveCrossroads: [
    'chain_exchange_crash',      // 27岁：交易所暴雷
    'chain_bear_market',         // 30岁：深熊，要不要扛
    'chain_regulation_crackdown',// 33岁：监管铁拳
  ],

  openingMonologues: [
    { ageRange: [22, 25], texts: [
      '你手机里装了8个交易所APP，设了3个价格闹钟。凌晨三点你的手机震动了——不是地震，是行情异动。',
      '过年回家你表哥问你做什么工作，你说"区块链"。他哦了一声说"就是那个传销吧"。你笑了笑没说话。',
      '你第一次经历了20%的暴跌，手在抖但你没卖。你告诉自己：HODL。',
    ]},
    { ageRange: [26, 30], texts: [
      '你参加了第一次线下DAO聚会。来的人都很奇怪——有穿睡衣的极客，有西装革履的传统金融人，有头发染成绿色的大学生。但你们看彼此的眼神是一样的：我们是未来。',
      '你的持仓翻了三倍，又跌回原点。你已经学会不看短期价格了。但凌晨三点还是会醒来刷一下K线。',
      '你女朋友翻你手机看到交易所APP，问你"你到底有多少钱是我看不见的"。你不知道怎么回答。',
    ]},
    { ageRange: [31, 35], texts: [
      '你身边的人分了两拨：一波已经财富自由消失了，另一波爆仓了回去上班了。你还在。',
      '你开始怀疑"去中心化"是不是一个美好的幻想。链上确实没有央行，但也有巨鲸操控。代码确实不会撒谎，但写代码的人会。',
      '你的腰背开始出问题，是长期久坐看盘的代价。你想：就算赚了钱，身体垮了有什么用？但你还是停不下来。',
    ]},
    { ageRange: [36, 45], texts: [
      '你不再跟人解释你在做什么了。懂的人自然懂，不懂的人解释了也没用。',
      '你有过几次"如果当初全卖了就好了"的念头，也有过"幸好没卖"的庆幸。这条路教会你最多的不是技术，是耐心。',
      '你开始考虑要不要把一部分资产转回法币。不是认输，是你终于理解了"落袋为安"四个字。',
    ]},
  ],

  sideHustleMonologues: [
    { ageRange: [22, 25], texts: [
      '白天你坐在格子间里写周报，手机里开着三个交易所的K线。你把屏幕调到最暗，趁组长不注意就瞄一眼。涨了你嘴角上扬，跌了你假装去厕所冷静一下。你活得像个双面间谍。',
      '你把工资的30%换成了加密货币，室友说你疯了。你爸说你被传销骗了。你懒得解释——凌晨三点你盯着K线的时候，只有你自己知道你在等什么。白天的工作只是给你提供子弹的兵工厂。',
      '你在公司偷偷写智能合约，在本地跑测试链。组长以为你在写业务代码，其实你在写一个DeFi协议的原型。你觉得这种"用公司的电费干自己的活"的感觉很刺激——虽然你也知道这不厚道。',
    ]},
    { ageRange: [26, 30], texts: [
      '你的链上资产已经超过你两年的工资了。但你还在上班。你妈打电话问"工资涨了没"，你说"涨了"——你没说的是，你真正的收入来源根本不是工资。',
      '你在Telegram群里和全球的开发者讨论你的DeFi协议设计，白天却在公司开着一个和你完全无关的会。你看着PPT上那些无聊的数字，脑子里全是你的协议的TVL和流动性池。你觉得自己在过两段平行人生。',
      '你的协议上链了，每天处理着几万美金的交易量。你在公司厕所里看数据看板，心跳得很快——不是因为紧张，是因为兴奋。你知道这条路是对的，但你还不敢松开那条叫"工资"的安全绳。',
    ]},
    { ageRange: [31, 35], texts: [
      '你的链上收入已经远超工资了——DeFi赏金、协议手续费分成、社区贡献奖励。但你在公司还要假装一个"正常员工"，参加团建、写年终总结、在年会上鼓掌。你觉得这些仪式荒谬得可笑。',
      '有DAO邀请你做全职贡献者，以稳定币支付年薪，是你现在工资的两倍。你盯着那条消息看了很久。你知道如果接受，你就要彻底告别"上班"这件事了。你怕的不是收入不够，你怕的是失去那条退路之后的自己会变成什么样。',
      '你开始在工位上公开看K线了。不是不在乎了，是实在装不下去了。同事问你"是不是在炒股"，你说"算是吧"。他们不知道，你账户里的数字比他们想象的多了好几个零。',
    ]},
  ],

  faithCrisisMonologues: [
    '某个你信任了五年的交易所卷款跑路了。你损失了40%的资产。你盯着"提币失败"的提示，第一次怀疑这条路是不是从一开始就是错的。',
    '你参加了一个区块链大会，台上的人讲的东西和五年前一模一样——"颠覆""革命""未来已来"。你突然觉得这可能是一场永远不会兑现的承诺。',
    '你妈住院要交手术费，你想卖币但币价正好在谷底。你第一次恨自己为什么要把钱放在"去中心化"的地方。',
  ],

  checkSuccess: (state) => {
    const chainHoldings = (state as any).chainHoldings || 0;
    const annualExpense = state.annualBaseCost + (state.currentMortgageCost || 0);
    // 成功：链上资产>=年支出×20 且 信念值>=40
    return chainHoldings >= annualExpense * 20 && state.pathFaith >= 40 && state.currentAge >= 30;
  },

  successTitle: '链上自由',
  successEnding: (state) => {
    return `${state.currentAge}岁这年你做了一个决定：把一半仓位换成稳定币，生成一个年化收益的理财策略。然后你关掉了所有行情闹钟。\n\n第一次没有设闹钟醒来的早晨，你躺在床上听了很久鸟叫。你已经不记得上次这样是什么时候了。\n\n你没有成为中本聪，没有改变世界金融体系。但你做到了一件事：你的资产在链上，没人能冻结，没人能滥发，没人能拿走。\n\n这就是你年轻时相信的东西——它兑现了。不是全部，但够了。\n\n你给你爸转了一笔钱，附言："爸，这不是传销。"`;
  },

  failureTitle: '链下余生',
  failureEnding: (state) => {
    return `${state.currentAge}岁，你清掉了最后一批币。\n\n不是因为你不信了，是你扛不住了。房贷要还，孩子要养，父母要看病，你不能再等"下一轮牛市"了。\n\n你算过账，这些年在链上赚的和亏的加在一起，基本打平。相当于用了十几年时间做了一场大梦。\n\n但你不后悔。那些凌晨三点看K线的夜晚，那些DAO投票的争论，那些和"同路人"在Telegram里聊到天亮的时刻——它们是真的。\n\n你把硬件钱包放进抽屉最底层。也许十年后它会升值，也许不会。但你已经不需要它来证明什么了。`;
  },

  targetRetireAge: 40,
};

// ============================================================
// 路径3：数字游牧民
// ============================================================
const digitalNomad: RetirementPath = {
  id: 'digital_nomad',
  name: '数字游牧民',
  icon: '🌍',
  color: '#4ade80',
  subtitle: '赌地理是最大的杠杆，赚美元花比索',
  description: '你不想困在一个城市、一个国家、一种生活方式里。你要一边赚钱一边看世界，在全球移动中完成资本积累。哪里成本低就去哪里，哪里能赚钱就在哪里。',

  initialEffect: (state) => {
    // 副业起步：不改变职业/城市/薪资，下班后接海外远程单
    state.stress = Math.min(100, state.stress + 8); // 白天上班+晚上接单，双线作战
    // pathFaith 由 selectRetirementPath() 统一设置为40，此处不再覆盖
    state.passiveIncome = 0;
    state.lifeLog.push('22岁这年你在Upwork上投了六十多份提案，终于拿到了第一个海外客户——时薪25美元。白天你照常上班，晚上熬夜给硅谷的小创业公司做网站。你没辞职，你知道现在还不是时候。但你已经开始研究清迈的物价和巴厘岛的咖啡馆了。');
  },

  sideHustleMonologues: [
    { ageRange: [22, 25], texts: [
      '白天在公司写代码，晚上回家打开Upwork接海外单。你的生物钟被劈成两半：白天用中文开会，晚上用英文谈需求。咖啡越喝越浓，但银行账户的数字也在涨。',
      '你在工位上偷偷回海外客户的消息，心跳得很快——不是紧张，是兴奋。你算过一笔账：这份副业的时薪是你白天工作的三倍。你开始认真想一个问题：什么时候可以辞掉主业？',
      '同事聊周末去哪玩，你说"在家休息"。其实你在赶一个远程项目的ddl。你不觉得苦——因为这是你给自己干的，不是给老板干的。',
    ]},
    { ageRange: [26, 30], texts: [
      '你的副业收入已经快赶上主业了。每次发工资你都算一笔账：如果现在辞职，存款能撑多久？答案一直在变——因为你的副业收入每个月都在涨。',
      '你跟公司请了年假，去清迈待了两周。白天在共享空间工作，晚上在夜市吃Pad Thai。你发现这种生活不仅可行，而且比上班快乐十倍。回国的飞机上你一直在想：下次来，就不回去了。',
      '你妈打电话问"最近忙不忙"，你说"忙"。你没说的是：你在忙两份工作。但你心里清楚，其中一份迟早要被你丢掉。',
    ]},
    { ageRange: [31, 35], texts: [
      '副业早就超过主业了。你每天坐在工位上都在想：我为什么要在这里？你的心思全在远程项目上，白天的工作只是在走过场。',
      '你开始频繁地看机票。不是去旅行，是在规划"如果明天辞职，后天飞哪里"。你的登机箱就放在床边，随时可以出发。',
      '你的海外客户问你"能不能全职合作"，你愣了一下——这句话你等了好几年。但真到了这一步，你又犹豫了：稳定的主业、社保、公积金……说扔就扔？',
    ]},
  ],

  cardWeights: {
    '技能进修': 1.5,
    '投资理财': 0.6,
    '生活消费': 1.0,
    '健康养生': 1.2,
    '💝 感情': 1.5,
    '社交关系': 2.0,
    '核心决策': 1.5,
    '阶段解锁': 0.5,
  },

  exclusiveCrossroads: [
    'nomad_visa_crackdown',    // 28岁：签证收紧
    'nomad_partner_settle',    // 31岁：伴侣想定居
    'nomad_tax_pursuit',       // 34岁：全球征税追讨
  ],

  openingMonologues: [
    { ageRange: [22, 25], texts: [
      '你在巴厘岛的稻田边写代码，抬头就是晚霞。朋友圈里的同学在加班，你想发一张照片但又觉得不太合适。',
      '你的英语从磕磕巴巴到流利只用了一年——因为你每天都在用它买菜、谈合同、吵架、谈恋爱。',
      '你学会了只带一个登机箱生活。你发现人真正需要的东西比想象中少得多。',
    ]},
    { ageRange: [26, 30], texts: [
      '你已经住过7个国家了。每个地方住三个月，新鲜劲刚过就走。你开始分不清"旅行"和"生活"的界限。',
      '你在里斯本认识了一个人，你们一起住了半年。然后你的签证到期了，TA不想走，你不想留。你们在机场告别时都没哭，但你在飞机上哭了。',
      '你妈妈每次打电话都问"你什么时候回来"。你说"快了"，但你知道你说的"快了"和她理解的不一样。',
    ]},
    { ageRange: [31, 35], texts: [
      '你开始感到疲惫。不是身体累，是"永远在路上"的累。每到一个新地方要重新办电话卡、找房子、认识人，这种新鲜感变成了消耗。',
      '你的收入涨了，但你发现消费也在涨。以前住青旅，现在住Airbnb，以前吃路边摊，现在去网红餐厅。你在逃离"生活成本膨胀"，但膨胀追着你跑。',
      '你开始想：如果我生病了怎么办？如果我老了怎么办？我在这个世界上的"根"在哪里？',
    ]},
    { ageRange: [36, 45], texts: [
      '你终于选了一个地方停下来。不是因为你走不动了，是你找到了一个想留下的理由。',
      '你回头看那些年走过的路，不觉得浪费。你见过的世界、遇到的人、经历过的文化冲击，都变成了你看世界的方式。',
      '你偶尔还会买一张机票去一个陌生城市待一周，但你不再需要"永远在路上"来证明什么了。',
    ]},
  ],

  faithCrisisMonologues: [
    '你在一个陌生国家的医院里，不会说当地语言，不知道医保能不能报，身边没有一个认识的人。你突然怀疑这种"自由"的代价是不是太高了。',
    '你回国参加朋友的婚礼，发现他们都有房有车有孩子了。你银行里的存款换算成人民币比他们多，但你没有一个能回去的地方。',
    '你的长期客户突然终止了合同，而你在一个签证即将到期的国家。你坐在咖啡馆里打开招聘网站，发现你已经不知道怎么写一份"正常"的简历了。',
    ],

  checkSuccess: (state) => {
    const annualExpense = state.annualBaseCost + (state.currentMortgageCost || 0);
    // 成功：被动收入>=年支出（真正的地点自由）
    return state.passiveIncome >= annualExpense && state.pathFaith >= 40 && state.currentAge >= 28;
  },

  successTitle: '地球居民',
  successEnding: (state) => {
    return `${state.currentAge}岁这年你实现了真正的地点自由——不是因为你可以去任何地方，而是你不需要待在任何特定地方。\n\n你的被动收入覆盖了所有开销，你可以在里斯本住半年，在清迈住三个月，在东京住一个月，最后回到你最喜欢的那个海边小镇。\n\n你不再需要解释你的生活方式了。那些曾经问你"什么时候安定下来"的人，现在开始问你"怎么才能像你一样"。\n\n你在阳台上种了一盆花。不管你去哪里，你都会带着它。`;
  },

  failureTitle: '候鸟归巢',
  failureEnding: (state) => {
    return `${state.currentAge}岁你回国了。\n\n不是你想回来，是你累了。远程工作竞争越来越激烈，签证越来越难拿，汇率波动让你的收入忽高忽低。你发现地理套利的窗口在关闭。\n\n你在老家找了一份工作，朝九晚五，周末双休。最初几个月你极度不适应——地铁的拥挤、同事的八卦、父母的唠叨。但慢慢你发现，稳定也有稳定的好。\n\n你偶尔会翻那些年在路上的照片。你不后悔那些年，但你也不再怀念了。\n\n人生不是只有一条路。你走过了世界，然后回到了起点。这也是一种完整。`;
  },

  targetRetireAge: 36,
};

// ============================================================
// 路径4：超级IP
// ============================================================
const superIP: RetirementPath = {
  id: 'super_ip',
  name: '超级IP',
  icon: '🎙️',
  color: '#ff6b9d',
  subtitle: '赌个人品牌是未来最大的资产',
  description: '公司会倒闭，行业会消失，但你自己不会。你要把自己变成一个品牌——一个不需要公司背书、不需要平台依赖、只靠名字就能变现的超级个体。',

  initialEffect: (state) => {
    // 副业起步：不削减主业薪资，下班后做内容
    state.stress = Math.min(100, state.stress + 8); // 下班后剪视频到凌晨
    // pathFaith 由 selectRetirementPath() 统一设置为40，此处不再覆盖
    state.passiveIncome = 0;
    (state as any).ipFollowers = 500; // 初始粉丝
    (state as any).ipReputation = 30; // 声誉值
    state.lifeLog.push('22岁这年你注册了第一个内容账号。白天上班，晚上剪视频到凌晨两点。你不知道要发什么，但你知道一件事：如果你在十年后还需要投简历找工作，那你就输了。这还只是副业——但你赌的是个人品牌。');
  },

  cardWeights: {
    '技能进修': 1.8,
    '投资理财': 0.5,
    '生活消费': 1.2,
    '健康养生': 1.0,
    '💝 感情': 0.6,
    '社交关系': 2.5,
    '核心决策': 1.8,
    '阶段解锁': 0.8,
  },

  exclusiveCrossroads: [
    'ip_first_crisis',         // 28岁：第一次舆论危机
    'ip_controversial_ad',     // 31岁：要不要接那个"恰饭"广告
    'ip_cancel_culture',       // 34岁：被翻旧账/断章取义
  ],

  openingMonologues: [
    { ageRange: [22, 25], texts: [
      '你发了一条内容，23个赞。其中18个是你妈你爸你三姑六婆点的。但有5个来自陌生人——那种感觉像中了彩票。',
      '你开始研究什么标题会被点开，什么封面会被点击。你觉得自己在做内容，又觉得自己在研究人性。两者好像是一回事。',
      '凌晨两点你还在剪视频。你问自己值不值。然后你看到一条评论："你的内容改变了我"。你继续剪。',
    ]},
    { ageRange: [26, 30], texts: [
      '你第一次有了"黑粉"。有人骂你恰烂钱，有人说你变了，有人专门写帖子黑你。你想解释，但你发现解释只会让事情更糟。',
      '你在一个行业活动上被认出来了。一个小姑娘跑过来跟你说"我是看着你的内容长大的"。你愣了三秒——你才27岁。',
      '广告主开始找你了。第一条广告报价5000块，你犹豫了三天才接。你怕粉丝说你"变了"。',
    ]},
    { ageRange: [31, 35], texts: [
      '你已经可以靠内容养活自己了。但你发现"做自己喜欢的内容"和"做能赚钱的内容"是两件事。你在两者之间反复横跳。',
      '你的伴侣说"你现在跟谁都像在做内容"。你想反驳，但你意识到TA是对的——你已经分不清什么时候是真实的自己，什么时候是"IP人设"。',
      '你开始被邀请去各种论坛、峰会、播客。你在台上侃侃而谈，下台后一个人在酒店房间吃外卖，感到前所未有的孤独。',
    ]},
    { ageRange: [36, 45], texts: [
      '你不再追求涨粉了。你开始追求"留下来的人"。一万个真心喜欢你的人，比一百万个路过的人重要。',
      '你终于可以拒绝不想接的广告了。这种自由比钱更珍贵。',
      '你开始带新人了。你告诉他们最重要的一句话：做IP不是表演，是把真实的自己放大。你说这话的时候，知道自己花了多少年才真正理解。',
    ]},
  ],

  sideHustleMonologues: [
    { ageRange: [22, 25], texts: [
      '白天你是公司里最普通的员工，晚上你是镜头前手舞足蹈的内容创作者。你在出租屋里支了一个补光灯、一个手机支架、一个几十块的麦克风。室友以为你在搞直播带货，其实你只是在对着一台手机说心里话——然后把它剪成视频发出去。',
      '你发了第47条视频，终于有一条破了十万播放。你看着后台数据曲线，在工位上差点叫出来。组长问你"怎么了"，你说"没事"。你不敢告诉任何人你在做内容——怕被嘲笑，更怕被模仿。',
      '你的第一条广告来了，报价2000块。你犹豫了三天，怕粉丝说你"恰烂钱"。最后你接了，用那2000块买了一个更好的麦克风。你觉得这像在滚雪球——很小的雪球，但它在滚。',
    ]},
    { ageRange: [26, 30], texts: [
      '你的粉丝涨到了五万，月收入稳定在一万出头——快赶上你的主业工资了。但你的睡眠被劈成了两半：白天上班，晚上剪视频到凌晨。你的黑眼圈重得连遮瑕都盖不住，同事问你"是不是身体不好"。',
      '你开始在工位上偷偷回粉丝评论、接商务微信。有一次组长站在你身后你没发现，他看了一眼你的屏幕问"这是你的副业？"你吓得手机差点掉地上。你支吾着说"就玩玩"，但你知道这不是"玩玩"——这是你的未来。',
      '有品牌方找你谈年框合作，报价是你年薪的两倍。条件是：每月四条视频，内容方向由品牌定。你算了一下——如果接了，你的副业收入会超过主业。但你的精力只够做好一件事。你看着那封合作邮件，又看了看桌上堆积的工作，第一次认真想：我该辞职吗？',
    ]},
    { ageRange: [31, 35], texts: [
      '你的内容事业已经不是"副业"了——它是一个真正的生意。你有十万粉丝、固定的广告收入、一个兼职剪辑、一个知识付费课程每月被动收入。唯一让它还是"副业"的，是你每天还要去公司打卡。',
      '你在公司的存在感越来越低。不是因为你不努力，是因为你的心不在那里了。你的灵感、你的热情、你的成就感全都来自下班后的那几个小时。上班变成了一种"waste of time"——你在会议室里想着下一条视频的选题，在写周报的时候回粉丝的私信。',
      '你的搭档问你"到底什么时候辞职"。你说"再等等"。TA说"你每次都说再等等"。你沉默了——你知道TA说得对。你怕的不是没钱，你怕的是失去"上班族"这个身份之后，你要完全为自己负责。打工再苦也有个底线，做IP没有底线。',
    ]},
  ],

  faithCrisisMonologues: [
    '你写了一篇真心的文章，评论区最高赞是"又开始蹭热度了"。你盯着那条评论看了很久，然后关掉了电脑。你开始怀疑：在这个时代，真诚还有意义吗？',
    '你的一个"朋友"把你私下说的话截图发到了网上。一夜之间你成了"三观不正"的代表。你想解释，但没有人想听解释——他们只想要一个可以攻击的靶子。',
    '你看到一个比你年轻五岁的人用你十年前的套路三个月涨了两百万粉。你突然觉得自己过时了。',
  ],

  checkSuccess: (state) => {
    const annualExpense = state.annualBaseCost + (state.currentMortgageCost || 0);
    // 成功：被动收入(内容变现)>=年支出×2 且 声誉>=60
    return state.passiveIncome >= annualExpense * 2 && (state as any).ipReputation >= 60 && state.currentAge >= 30;
  },

  successTitle: '自成一派',
  successEnding: (state) => {
    return `${state.currentAge}岁这年你解散了团队，退掉了办公室，回到了一个人一台电脑的状态。但这一次不一样——你不需要再追热点，不需要再看数据，不需要再讨好任何人。\n\n你的内容就是你的资产。它24小时为你工作，在你睡觉的时候、旅行的时候、发呆的时候，都在为你产生收入。\n\n你经历过被捧上神坛，也经历过被踩在脚下。你被爱过，被恨过，被误解过，被原谅过。但最终你活成了自己——不是那个"人设"，是真实的你。\n\n你在新视频的开头说："大家好，我是XXX，今天我们聊点真的。"你知道，留下来看的人，是真正懂你的人。`;
  },

  failureTitle: '人设崩塌之后',
  failureEnding: (state) => {
    return `${state.currentAge}岁你"过气"了。\n\n不是因为什么大事件，只是慢慢没人看了。新的IP冒出来，比你更年轻、更大胆、更懂算法。你的内容不再被推荐，广告主不再找你，粉丝群慢慢安静了。\n\n你找了一份"正常工作"。简历上你不知道怎么写那几年——"自媒体博主"听起来像无业游民。\n\n但那些年教会你的东西没有白费。你比任何人都懂怎么表达、怎么沟通、怎么理解人性。这些能力在任何工作中都有用。\n\n你偶尔还会发内容，但不再追求流量。只是因为有些话想说。这也许才是做内容最初的意义。`;
  },

  targetRetireAge: 38,
};

// ============================================================
// 路径5：银发收割者
// ============================================================
const silverEconomy: RetirementPath = {
  id: 'silver_economy',
  name: '银发收割者',
  icon: '👴',
  color: '#fbbf24',
  subtitle: '赌老龄化是未来50年唯一的确定性',
  description: '所有人都在盯着年轻人的市场，但你看到了真正的浪潮——老人。中国将有4亿老年人，他们需要服务、需要陪伴、需要尊严。你回老家，做别人看不起的"伺候老人"的生意。',

  initialEffect: (state) => {
    // 副业起步：不改变职业/城市/薪资，周末回老家照顾老人
    state.stress = Math.min(100, state.stress + 12); // 工作日上班+周末做养老，最累
    // pathFaith 由 selectRetirementPath() 统一设置为40，此处不再覆盖
    (state as any).silverBusiness = { clients: 0, reputation: 20, monthlyRevenue: 0 };
    state.lifeLog.push('22岁这年你做了一个所有人都不理解的决定：周末回老家，帮邻居照顾老人。你妈说"供你上大学不是让你回来伺候老人的"。你没反驳——你还在上班，这还只是副业。但你看到了他们看不到的东西：4亿老人，一个被所有人忽视的市场。');
  },

  sideHustleMonologues: [
    { ageRange: [22, 25], texts: [
      '周一到周五你在写字楼里敲键盘，周六周日你骑着电动车穿街走巷，去给独居老人量血压、陪他们聊天。同事问你周末干嘛，你说"回老家看看"。你没说的是，你在试一个未来。',
      '你的第一个客户是隔壁小区的张奶奶，子女在外地，她需要有人陪她去医院。你推轮椅的时候她抓着你的手说"你比我儿子还贴心"。你鼻子一酸——这就是你下班后还在做的事。',
      '你在工位上查养老政策，被领导看到了以为你在摸鱼。你笑了笑关掉页面。你心里在算另一笔账：这个市场有4亿人，但几乎没人认真做。',
    ]},
    { ageRange: [26, 30], texts: [
      '周末的客户从3个涨到了15个，你一个人快忙不过来了。你开始认真想：要不要辞职，回老家把这件事做成正经生意？',
      '你爸中风那次，你用业余学的护理知识照顾了他三天三夜。他出院后第一次说"儿子/女儿，你选的路是对的"。你差点哭出来——这句话你等了好几年。',
      '上班时你在想养老站的事，做养老时你在想明天上班的会。你感觉自己被劈成了两个人，你知道迟早要选一个。',
    ]},
    { ageRange: [31, 35], texts: [
      '你的周末养老站在老家小有名气了，有人专程来找你。但你还在上班，每个周五下班赶最后一班高铁回去，周日晚上再赶回来。你快撑不住了。',
      '民政局的人打电话问你"能不能正式注册一个服务机构"。你握着手机，看了看办公室里的格子间——你知道，做决定的时候到了。',
      '你的存款在涨，但你没有时间花。你把所有周末和假期都投进了养老站。你妈说"你比上班还忙"，你苦笑：这确实比上班忙，但这是给自己忙的。',
    ]},
  ],

  cardWeights: {
    '技能进修': 1.2,
    '投资理财': 0.8,
    '生活消费': 0.7,
    '健康养生': 2.0,
    '💝 感情': 1.0,
    '社交关系': 2.0,
    '核心决策': 2.0,
    '阶段解锁': 1.2,
  },

  exclusiveCrossroads: [
    'silver_giants_entry',     // 30岁：巨头下场
    'silver_parent_illness',   // 33岁：父母生病，你亲手照顾
    'silver_policy_change',    // 36岁：政策补贴/监管变化
  ],

  openingMonologues: [
    { ageRange: [22, 25], texts: [
      '你第一个客户是隔壁小区的张奶奶，子女在外地，她需要有人陪她去医院。你推轮椅的时候她抓着你的手说"你比我儿子还贴心"。你鼻子一酸。',
      '同学聚会你没去。你不知道怎么解释"我在做养老"这件事——在他们眼里，这不是一份"正经工作"。',
      '你在老家租了一间小门面，挂上"社区养老服务站"的牌子。第一个月只有三个客户。第二个月五个。第三个月，门口排起了队。',
    ]},
    { ageRange: [26, 30], texts: [
      '你的父母终于理解了你——不是因为你赚了钱，是因为你爸中风那次，你用专业的护理知识照顾他，他第一次说"儿子/女儿，你选的路是对的"。',
      '你雇了第一个员工。你发现做养老最缺的不是钱，是真正有耐心的人。你面试了二十个人，只留下了一个。',
      '你开始赔钱。老人的付费能力有限，但服务成本很高。你怀疑过自己是不是错判了市场。但每次看到老人的笑脸，你又坚持了下来。',
    ]},
    { ageRange: [31, 35], texts: [
      '互联网巨头入场了。他们做"智慧养老平台"，免费送设备，铺天盖地的广告。你的客户被抢走了一半。你第一次真正感到恐惧。',
      '你发现巨头做不了"重服务"。他们的设备很先进，但老人需要的是有人听他们说话、有人给他们擦身、有人在他们摔倒的第一时间赶到。这些是代码做不到的。',
      '你的服务站变成了区域标杆。民政局的人来考察，电视台来采访。你妈终于敢跟亲戚说"我孩子是做养老的"了。',
    ]},
    { ageRange: [36, 45], texts: [
      '你有了五家服务站，一百多个员工。但你每周还是会抽一天时间亲自去照顾老人。你提醒自己不要忘了为什么出发。',
      '你的第一批客户有的已经不在了。你参加他们的葬礼，家属握着你的手说"谢谢你陪TA走完最后一程"。你知道这不是一份生意，是一份托付。',
      '你开始思考"养老"这件事的终极意义——我们每个人都会老。你今天做的事，也许就是你自己未来的样子。',
    ]},
  ],

  faithCrisisMonologues: [
    '一个你照顾了三年的老人走了。你在TA的葬礼上哭得像个孩子。你开始问自己：做这行每天面对衰老和死亡，你能撑多久？',
    '巨头用免费模式碾压你的时候，你算了一笔账：再撑三个月你就要关门了。你坐在空荡的服务站里，看着墙上老人送你的锦旗，第一次想放弃。',
    '你妈当着亲戚的面说"我孩子没出息，大学毕业回来伺候老头老太太"。你没说话，但你回到房间哭了。',
  ],

  checkSuccess: (state) => {
    const business = (state as any).silverBusiness;
    // 成功：养老生意月营收>=5万 且 声誉>=70
    return business && business.monthlyRevenue >= 50000 && business.reputation >= 70 && state.currentAge >= 33;
  },

  successTitle: '老有所依',
  successEnding: (state) => {
    return `${state.currentAge}岁这年你的养老品牌覆盖了三座城市，服务超过两千位老人。你不再需要亲自上门照顾人了，但你依然记得每一位早期客户的名字。\n\n政府给你颁了奖，媒体称你为"养老先锋"。但你最珍视的时刻是每次去服务站，老人们拉着你的手说"你来了"。\n\n你没有提前退休的概念——因为这不是一份工作，是你想做一辈子的事。但你已经不需要为钱发愁了。\n\n你站在新建的养老社区里，看着老人们在花园里晒太阳、下棋、跳广场舞。你想：这就是你年轻时赌的未来。它不是什么高科技，不是什么金融革命——它只是让人老了以后，活得有尊严。\n\n你爸说得对，你是"伺候老人"的。但你把这件事做到了让人尊敬。`;
  },

  failureTitle: '未尽之事',
  failureEnding: (state) => {
    return `${state.currentAge}岁你关掉了最后一家服务站。\n\n不是你不想撑，是巨头的免费模式加上成本上涨让你实在撑不下去了。你把客户转介给了一家更大的机构，最后那天你在空荡荡的站里坐了很久。\n\n你没有失败——你证明了这个需求存在，只是时机不对，或者规模不对。你比巨头早了五年看到了趋势，但五年在商业世界里是致命的。\n\n你去了一家养老相关的公司做顾问，薪水不低。你把这些年的经验教给更多人。\n\n偶尔在街上遇到以前的客户或他们的子女，他们还会叫你"小X"。那一刻你觉得，那些年没有白费。`;
  },

  targetRetireAge: 42,
};

// ============================================================
// 路径6：生物赌徒
// ============================================================
const bioGambler: RetirementPath = {
  id: 'bio_gambler',
  name: '生物赌徒',
  icon: '🧬',
  color: '#a855f7',
  subtitle: '赌抗衰技术会突破，活得久才是最大的杠杆',
  description: '所有人都在算"存多少钱才能退休"，但你在算另一个账：如果抗衰技术在2035年突破，人能活到120岁，那"退休"这个概念本身就会被重写。你要做的就是——活到那时候，并且手里有筹码。',

  initialEffect: (state) => {
    state.stress = Math.min(100, state.stress + 5);
    // pathFaith 由 selectRetirementPath() 统一设置为40，此处不再覆盖
    state.health = Math.min(100, state.health + 5); // 初期注重健康
    // 一半积蓄投入生物科技股（副业投资）
    const bioInvest = Math.round(state.currentSavings * 0.4);
    state.currentSavings -= bioInvest;
    (state as any).bioPortfolio = bioInvest;
    (state as any).biologicalAge = 0; // 生物年龄偏移（负数=更年轻）
    (state as any).supplementRegime = true;
    // 生科投资是独立资产，不占用存款分布百分比；剩余现金全部在余额宝
    state.stockPct = 0;
    state.bankDepositPct = 100;
    state.lifeLog.push('22岁这年你开始了你的"延寿计划"：白天上班，晚上研究抗衰论文、吃NMN、测基因。你把40%积蓄投了生物科技股。室友说你疯了，你说"十年后你会羡慕我"。这还只是副业——但你在赌一个所有人都觉得遥远的未来。');
  },

  cardWeights: {
    '技能进修': 0.8,
    '投资理财': 2.0,
    '生活消费': 0.8,
    '健康养生': 3.0,
    '💝 感情': 0.8,
    '社交关系': 0.6,
    '核心决策': 1.5,
    '阶段解锁': 1.0,
  },

  exclusiveCrossroads: [
    'bio_clinical_failure',      // 29岁：重仓公司临床失败
    'bio_supplement_damage',     // 32岁：补剂导致肝功能异常
    'bio_have_child_decision',   // 35岁：要不要孩子（在一个寿命可能剧变的世界）
  ],

  openingMonologues: [
    { ageRange: [22, 25], texts: [
      '你每天吃的补剂比饭还多。室友开玩笑说你是药罐子，你说这些都是未来的"长寿币"。',
      '你看到一篇论文说某种分子能延长小鼠寿命30%，你兴奋得一晚上没睡。你知道从小鼠到人还有很长的路，但这是方向。',
      '你拒绝了所有熬夜的团建和喝酒的应酬。同事说你"不合群"，你心里想：等你们五十岁一身病的时候就懂了。',
    ]},
    { ageRange: [26, 30], texts: [
      '你的体检报告比同龄人好一大截。医生说你的生理年龄比实际年龄小5岁。你不知道这是补剂的作用还是运动的作用，但你觉得方向对了。',
      '你投资的一家生物公司倒闭了，损失了八万块。你心疼了一周，但你告诉自己：这是赛道，不是个股。总有一家会跑出来。',
      '你在一个长寿论坛上认识了一群和你一样的人。你们互相分享最新论文、检测数据、补剂方案。你们是这个时代的"不死者"。',
    ]},
    { ageRange: [31, 35], texts: [
      '你开始听到"AI制药"这个词。AI大幅加速了药物研发进程，你之前预估的突破时间可能要提前了。你加仓了。',
      '你的伴侣和你吵了一架。TA说"你天天想着活100岁，但你今天都没过好"。这句话戳到了你——你是不是在为未来牺牲现在？',
      '第一次有同龄人突发疾病去世。你去参加了葬礼，回来后更加坚定了你的路线——生命太脆弱了，你必须做点什么。',
    ]},
    { ageRange: [36, 45], texts: [
      '第一个真正的抗衰老疗法获批上市了。不是你投资的公司，但你比谁都兴奋——因为证明了这条路是通的。',
      '你的生物年龄测试显示你比实际年龄小8岁。你40岁的身体，32岁的器官。你的投资组合也翻了十几倍。',
      '你开始认真思考一个问题：如果人真的能活到150岁，那"退休"意味着什么？也许退休不是终点，而是第二段人生的起点。',
    ]},
  ],

  sideHustleMonologues: [
    { ageRange: [22, 25], texts: [
      '白天你在公司上班，晚上回家打开PubMed搜论文。你的书桌上堆满了NMN、白藜芦醇、NAD+前体的瓶子，室友以为你在考研。你没解释——你确实在学，只不过学的是怎么让自己活得更久。',
      '你把40%的积蓄投了生物科技股。白天上班的时候你会偷偷看盘，看到重仓的那家公司发了一篇一期临床的积极数据，你在工位上握紧拳头——但你不能告诉任何人你在赌什么。',
      '你开始给自己做"生物年龄检测"。结果出来那天你盯着报告看了很久：你的生理年龄比实际年龄小3岁。你第一次觉得那些难喝的补剂、那些被同事嘲笑的早睡早起、那些拒绝喝酒应酬的尴尬——都值了。',
    ]},
    { ageRange: [26, 30], texts: [
      '你的生物科技投资组合已经翻了三倍，但你还在上班。你算过一笔账：如果现在清仓，你能拿到相当于五年工资的钱。但你不会清仓——你信的不是某一只股票，你信的是这条赛道。你在等一个更大的突破。',
      '白天开会的时候你在读预印本论文，晚上回家你在设计自己的"抗衰方案"——补剂组合、运动计划、睡眠优化、冷暴露疗法。你的生活被切割成两半：一半给公司，一半给未来。你觉得公司那一半越来越像在浪费时间。',
      '你在长寿论坛上认识了一群和你一样的人——白天上班，晚上研究抗衰。你们在群里分享最新论文、检测数据、补剂方案。有人说"我们都像是在偷偷准备一场没人相信的考试"。你笑了笑，觉得这比喻真准。',
    ]},
    { ageRange: [31, 35], texts: [
      '你的投资组合已经远超你的工资积累了。你重仓的那家做基因疗法的公司被溢价收购了，你的账面收益足够你不工作三年。但你还在上班——不是因为需要钱，是因为你还没准备好"全职赌命"。',
      '你在公司越来越像一个异类。同事聊房贷车贷孩子学区房，你聊的是NAD+代谢通路和mTOR信号抑制。他们觉得你偏执，你觉得他们短视。这种隔阂让你越来越想离开——不是离开某个公司，是离开那种"为六十岁退休做准备"的思维方式。',
      '你的伴侣说你"天天研究活到150岁，但你今天都没过好"。这句话戳到了你。你确实在牺牲现在换未来——每天吃二十几粒补剂、严格的饮食控制、拒绝一切社交酒局。你有时会想：如果技术不突破，你这些年的自律是不是变成了一场自虐？但你不敢想太久——你押的注太大了。',
    ]},
  ],

  faithCrisisMonologues: [
    '你的肝功能检查出了异常。医生说可能和你长期吃的那些"长寿补剂"有关。你盯着报告，第一次怀疑：你是在延长生命，还是在缩短它？',
    '你重仓的一家抗衰公司三期临床失败，股价一天跌了70%。你的账户缩水了60%。你开始想：如果技术永远不突破怎么办？',
    '你在镜子里看到了一根白头发。你拔了，但第二天又长出两根。你突然意识到：也许你等不到技术突破的那一天。',
  ],

  checkSuccess: (state) => {
    const bioPortfolio = (state as any).bioPortfolio || 0;
    const annualExpense = state.annualBaseCost + (state.currentMortgageCost || 0);
    // 成功：生物投资组合>=年支出×15 且 健康>=70 且 信念>=50
    return bioPortfolio >= annualExpense * 15 && state.health >= 70 && state.pathFaith >= 50 && state.currentAge >= 35;
  },

  successTitle: '明日世界',
  successEnding: (state) => {
    return `${state.currentAge}岁这年，第一个真正意义上的抗衰老疗法进入临床。你不是第一批受试者，但你知道这只是开始。\n\n你的生物科技投资组合翻了几十倍。你不需要为钱发愁了，更重要的是——你的身体状态比同龄人年轻十岁，你有充足的"筹码"等到技术完全成熟的那一天。\n\n有人说你是赌徒，你确实是。你赌的是人类对永生的渴望，你赌的是科学的力量，你赌的是明天会比今天更好。\n\n你看着窗外，想起22岁那年开始吃补剂的自己。TA不知道未来会怎样，但TA选择了相信。你想对TA说：你赌对了。\n\n你打开最新的论文预印本，倒了一杯红酒（白藜芦醇，你笑了），开始阅读。明天又是新的一天——对你来说，"明天"这两个字有了不一样的重量。`;
  },

  failureTitle: '向死而生',
  failureEnding: (state) => {
    return `${state.currentAge}岁你停用了所有补剂，清掉了生物科技仓位。\n\n不是你不信了，是你等不起了。技术的进展比你预期的慢，你的存款撑不到那一天。你需要回归"正常"的理财和生活。\n\n你不再做生物年龄检测了。你开始接受一个事实：你可能活不到150岁，你可能和所有人一样，在七八十岁老去。\n\n但这些年的自律没有白费。你的身体比同龄人好很多，你的生活习惯很健康，你对生命的理解比大多数人深刻。\n\n你开始把每一天当作最后一天过。不是消极，是珍惜。你发现：当你不再执着于"活得更久"，你反而开始"活得更好"。\n\n这也许就是生命最大的反讽。`;
  },

  targetRetireAge: 45,
};

export const RETIREMENT_PATHS: Record<RetirementPathId, RetirementPath> = {
  ai_symbiote: aiSymbiote,
  chain_native: chainNative,
  digital_nomad: digitalNomad,
  super_ip: superIP,
  silver_economy: silverEconomy,
  bio_gambler: bioGambler,
};

/** 根据路径ID获取路径配置 */
export function getPath(pathId: RetirementPathId | null): RetirementPath | null {
  if (!pathId) return null;
  return RETIREMENT_PATHS[pathId];
}

/** 获取所有路径列表 */
export function getAllPaths(): RetirementPath[] {
  return Object.values(RETIREMENT_PATHS);
}

// ============================================================
// 副业收入计算 & All In 转型
// ============================================================

/**
 * 根据路径技能和自定义状态计算当前副业月收入
 * 
 * 副业收入 = 基础收入 + 技能加成
 * - 基础收入确保初期就有体感（几百元/月）
 * - 技能加成随事件积累逐步增长，最终可接近或超过主业工资
 * All In 后返回 0（副业收入已转正为主业薪资）。
 */
export function getPathSideIncome(state: GameState): number {
  if (!state.retirementPath || state.isAllInPath) return 0;

  const skills = state.pathSkills || {};

  switch (state.retirementPath) {
    case 'ai_symbiote': {
      // AI副业：接AI外包、提示词咨询、模型微调服务
      // 合并卡牌的 aiSkillLevel 和事件的 pathSkills.aiSkill（两者都是AI技能积累）
      const cardAiLevel = (state as any).aiSkillLevel || 0;
      const aiSkill = (skills.aiSkill || 0) + cardAiLevel;
      const promptMastery = skills.promptMastery || 0;
      const aiTraining = skills.aiTraining || 0;
      // 提高系数：满技能(各100)时月入约 100*50+100*30+100*15+500 = 10000，可超过主业
      return Math.round(aiSkill * 50 + promptMastery * 30 + aiTraining * 15 + 500);
    }
    case 'chain_native': {
      // 链上副业：DeFi开发赏金、交易策略分享、社区运营、内容创作
      const tradingSkill = skills.tradingSkill || 0;
      const defiSkill = skills.defiSkill || 0;
      const communityInfluence = skills.communityInfluence || 0;
      return Math.round(tradingSkill * 30 + defiSkill * 25 + communityInfluence * 15 + 300);
    }
    case 'digital_nomad': {
      // 游牧副业：下班后接海外远程单（美元收入，汇率换算后更高）
      const remoteSkill = skills.remoteSkill || 0;
      const languageSkill = skills.languageSkill || 0;
      const crossCulturalSkill = skills.crossCulturalSkill || 0;
      // 提高基础值和系数：美元时薪×汇率折算，满技能月入可达 80*50+80*30+80*20+800 = 8800
      return Math.round(remoteSkill * 50 + languageSkill * 30 + crossCulturalSkill * 20 + 800);
    }
    case 'super_ip': {
      // IP副业：广告、付费社群、知识付费（粉丝变现是核心）
      const followers = (state as any).ipFollowers || 0;
      const reputation = (state as any).ipReputation || 0;
      const contentSkill = skills.contentSkill || 0;
      const brandSkill = skills.brandSkill || 0;
      // 粉丝/声誉系数提高：万粉×声誉50/200 = 2500，加上技能收入
      return Math.round(followers * reputation / 200 + contentSkill * 30 + brandSkill * 35 + 300);
    }
    case 'silver_economy': {
      // 银发副业：周末上门照护、社区服务
      // 基础是月营收，但技能加成会提升服务溢价
      const biz = (state as any).silverBusiness;
      const careSkill = skills.careSkill || 0;
      const managementSkill = skills.managementSkill || 0;
      const baseRevenue = biz ? biz.monthlyRevenue : 500;
      // 技能带来的服务溢价：每点技能提升1%收入
      const skillBonus = 1 + (careSkill + managementSkill) * 0.01;
      return Math.round(baseRevenue * skillBonus);
    }
    case 'bio_gambler': {
      // 生物副业：健康咨询、长寿社群付费、科普写作
      const bioKnowledge = skills.bioKnowledge || 0;
      const healthOptSkill = skills.healthOptSkill || 0;
      return Math.round(bioKnowledge * 30 + healthOptSkill * 25 + 300);
    }
  }
  return 0;
}

/**
 * 判断是否满足 All In 条件
 *
 * 设计意图：All In 是人生重大转折，不应轻易触发。
 * 副业阶段应有足够厚度（至少5年积累），玩家需要真实地经历
 * "白天上班+深夜副业"的双重生活，而非匆匆跳过。
 *
 * 条件1：副业月收入 >= 主业月薪×1.2（副业明显超过主业，辞职才有经济基础）
 * 条件2：信念值 >= 90（信念极强，且需长期积累才能达到）
 * 条件3（投资型路径）：链上资产/生物组合 >= 年支出×5
 *
 * 年龄门槛：27岁（至少5年副业积累）
 */
export function canAllIn(state: GameState): boolean {
  if (!state.retirementPath || state.isAllInPath) return false;
  if (state.currentAge < 27) return false; // 至少积累5年副业经验

  // 信念条件（提高阈值：90，需要长期正向积累）
  if (state.pathFaith >= 90) return true;

  // 副业收入条件（需要明显超过主业，而非仅仅持平）
  // 注意：失业状态下薪资为0，不能作为比较基准，否则会误触发
  const sideIncome = getPathSideIncome(state);
  if (sideIncome > 0 && state.currentMonthlySalary > 0 && sideIncome >= state.currentMonthlySalary * 1.2) return true;

  // 投资型路径条件
  const annualExpense = state.annualBaseCost + (state.currentMortgageCost || 0);
  if (state.retirementPath === 'chain_native') {
    const chainHoldings = (state as any).chainHoldings || 0;
    if (chainHoldings >= annualExpense * 5) return true;
  }
  if (state.retirementPath === 'bio_gambler') {
    const bioPortfolio = (state as any).bioPortfolio || 0;
    if (bioPortfolio >= annualExpense * 5) return true;
  }

  return false;
}

/**
 * 执行 All In 转型：辞职，全力投入路径副业
 *
 * 根据路径不同，职业/城市/薪资会有不同变化：
 * - AI共生者：职业→自由职业，薪资=副业收入×1.2（全力投入后接单效率更高）
 * - 链上原住民：职业→自由职业，薪资=副业收入（DeFi赏金），主要靠投资收益
 * - 数字游牧民：职业→自由职业，城市→海外低成本，生活成本降低，薪资=副业收入×1.5
 * - 超级IP：职业→自由职业，薪资=副业收入×1.3（全职后变现效率提升）
 * - 银发收割者：职业→实体创业，城市→避风低洼地，生活成本降低，薪资=银发生意月营收
 * - 生物赌徒：职业→自由职业，薪资=副业收入（咨询/写作），主要靠投资收益
 */
export function applyAllIn(state: GameState): void {
  if (!state.retirementPath || state.isAllInPath) return;

  const sideIncome = getPathSideIncome(state);
  const prevSalary = state.currentMonthlySalary;
  state.isAllInPath = true;

  // All In 后保底收入：不低于原主业薪资的 80%，避免收入断崖导致现金流断裂
  const minGuarantee = Math.round(prevSalary * 0.8);

  switch (state.retirementPath) {
    case 'ai_symbiote': {
      state.currentProfession = '自由职业';
      state.currentMonthlySalary = Math.max(Math.round(sideIncome * 1.2), minGuarantee, 3000);
      state.careerStartSalary = state.currentMonthlySalary;
      break;
    }
    case 'chain_native': {
      state.currentProfession = '自由职业';
      state.currentMonthlySalary = Math.max(sideIncome, minGuarantee, 2000);
      state.careerStartSalary = state.currentMonthlySalary;
      break;
    }
    case 'digital_nomad': {
      state.currentProfession = '自由职业';
      // 迁到海外低成本城市：使用 switchCity 正确调整薪资系数，不再手动打折 annualBaseCost
      // （annualBaseCost 由 CITY_CONFIGS.costMultiplier 在年度结算时自动应用）
      // 先设置薪资（基于副业收入×1.5，因全职后接单效率更高），再迁城让薪资按当地系数调整
      state.currentMonthlySalary = Math.max(Math.round(sideIncome * 1.5), minGuarantee, 3000);
      state.careerStartSalary = state.currentMonthlySalary;
      // 调用 switchCity 正确应用城市系数（薪资×salaryMultiplier）
      switchCity(state, '海外低成本');
      state.isGeoArbitrage = true;
      break;
    }
    case 'super_ip': {
      state.currentProfession = '自由职业';
      state.currentMonthlySalary = Math.max(Math.round(sideIncome * 1.3), minGuarantee, 3000);
      state.careerStartSalary = state.currentMonthlySalary;
      break;
    }
    case 'silver_economy': {
      state.currentProfession = '实体创业';
      // 迁到避风低洼地（回老家创业）：使用 switchCity 正确调整
      const biz = (state as any).silverBusiness;
      const bizRevenue = biz ? biz.monthlyRevenue : 3000;
      state.currentMonthlySalary = Math.max(bizRevenue, minGuarantee, 3000);
      state.careerStartSalary = state.currentMonthlySalary;
      switchCity(state, '避风低洼地');
      break;
    }
    case 'bio_gambler': {
      state.currentProfession = '自由职业';
      state.currentMonthlySalary = Math.max(sideIncome, minGuarantee, 2000);
      state.careerStartSalary = state.currentMonthlySalary;
      break;
    }
  }
}
