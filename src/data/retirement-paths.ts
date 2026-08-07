/**
 * 退休路径系统 - 6条赌未来的路径完整剧情数据
 *
 * 每条路径都是对"未来50年世界会变成什么样"的一个判断。
 * 赌对了提前自由，赌错了归零重来。
 * 戏剧性来自赌注本身、中途的信念动摇、以及情感线的冲突。
 */
import type { GameState, RetirementPathId } from '../types/global.d.js';
import { switchCity, CITY_CONFIGS, applyChainHoldingScale, passiveIncomeCapMult } from '../utils/math-engine.js';

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
  subtitle: '赌自己是驾驭浪的人，不是被浪冲走的人',
  description: '你把筹码压在AI上。不是对抗它，是学会跟它说话。浪潮来的时候有人造方舟，你选了一块冲浪板。',

  initialEffect: (state) => {
    state.stress = Math.min(100, state.stress + 5);
    // pathFaith 由 selectRetirementPath() 统一设置为40，此处不再覆盖
    state.passiveIncome = 0;
    state.lifeLog.push('22岁这年你试着用AI帮你写代码，它居然跑通了，省了你两个小时。白天上班，晚上琢磨怎么让这东西干活。别人拿它写打油诗的时候，你已经在调提示词跑模型了。这还只是副业，但屏幕上那行跑通的代码让你觉得，有什么东西要变了。');
  },

  cardWeights: {
    '技能进修': 2.5,
    '投资理财': 1.5,  // AI路径需要副业/被动收入（修复：原0.4导致副业卡过难抽）
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
      '凌晨三点还在调prompt，蓝光映脸，你觉得站在潮头。',
      'AI两小时出了你两天的活，你说不清该高兴还是发毛。',
      '给自己打工没有下班时间，你比给老板干活时还拼。',
      '做了个噩梦，梦里你一行代码都不会写了，全是AI写的。',
      'commit图全绿了，那些好想法终于不用浪费在别人项目上。',
    ]},
    { ageRange: [26, 30], texts: [
      '上个月的绝活这个月被内置了，你不得不跑更快。',
      '报价涨了睡眠少了，身后全是更便宜更快的年轻人。',
      'API账单又超了，你安慰自己是研发投入，存款不说话。',
      'AI能做九成的活，剩下那一成到底是什么，你想不明白。',
      'Discord里的哥们说一起商业化，你盯着消息很久没回。',
    ]},
    { ageRange: [31, 35], texts: [
      '不再追求"会用AI"了，你在想AI到底应该做什么。',
      '大厂抄了你的产品，界面一模一样还免费，你手抖了一天。',
      '伴侣问你天天对着电脑搞什么，话到嘴边只剩"工作"。',
      '第一批付费用户晒截图，你第一次觉得这东西是你的。',
      '台上讲的你去年就做过了，你没想到自己离前沿这么近。',
    ]},
    { ageRange: [36, 45], texts: [
      '你不再焦虑了，要么走通了，要么接受了走不通。',
      '带徒弟最难教的不是技术，是什么时候不要用AI。',
      '见过太多人起起落落，马拉松不需要起跑最快的。',
      '大公司fork你的项目没注明来源，你愤怒一天然后释然。',
      '猎头开三倍工资挖你，你拒绝了——不想再帮别人造船。',
      'AI像水电一样无处不在了，你不再为模型升级失眠。',
    ]},
    { ageRange: [46, 50], texts: [
      'AI不再是新东西了，翻出22岁第一个prompt，哭笑不得。',
      '和Discord老友线下聚，头发白了一半，聊debug眼还亮。',
      '你不怎么写代码了，花更多时间想AI该往哪里走。',
      '内部团队请你当顾问，看他们演示像看十年前的自己，你只补了句"先想清楚要解决什么"。',
      '你开始写一本讲"人和机器怎么分工"的书，写到一半删了重写，觉得时机没到。',
    ]},
    { ageRange: [51, 55], texts: [
      '学生问学什么不会被取代，你说"学怎么提出好问题"。',
      '你发了个开源库一周两千star，评论区有人喊老师，你回"是同行"。',
      '大厂请你讲AI伦理，你讲完下台，名片收了，没扫。',
      '老同事转行卖AI课年入百万，你点开目录看了一眼，没往下看。',
      '你不再追每个新模型了，愿意等一个真正改变规则的东西。',
    ]},
    { ageRange: [56, 60], texts: [
      '孙女让你教她用AI做作业，你更想教她什么时候关掉它。',
      '偶尔想如果22岁没选这条路会怎样，没答案也不需要了。',
      '你把最早那个prompt裱起来挂书房，小孙子问是什么，你说"起跑线"。',
      '你关掉所有付费资讯那晚，反而第一次看清AI十年后会变成什么。',
      '带徒弟去爬山，半山腰他问AI会不会取代我们，你说"它替我们算，我们替它想"。',
    ]},
  ],

  sideHustleMonologues: [
    { ageRange: [22, 25], texts: [
      '白天在公司写重复代码，晚上打开AI像换了个人。',
      '工位上偷偷跑AI脚本，组长路过你赶紧切到周报。',
      '同事拿AI写诗的时候，你已经搭了三个自动化工作流。',
      'Discord接了个微调模型的活，200美元，三晚搞定。',
      '开源项目多了几个star，你偷偷截图存着像藏勋章。',
    ]},
    { ageRange: [26, 30], texts: [
      '副业收入超过主业了，但社保公积金拽着你不敢松手。',
      '分享AI教程涨粉很快，有人出两个月工资请你做培训。',
      '凌晨一点刚交付项目，客户说还有大单，闹钟六小时后响。',
      'AI小工具挂网上，醒来80个注册，地铁上刷后台差点坐过站。',
      '公司让你带队做AI项目，你苦笑：晚上做的方向和这不一样。',
    ]},
    { ageRange: [31, 35], texts: [
      '开会想AI架构写周报回客户消息，组长问状态你说挺好。',
      '五个长期客户一个助手一套流程，差的只是那封辞职信。',
      '每天八小时坐工位，你算得出这八小时做AI能赚多少。',
      'SaaS月入两万四，两个Slack窗口，一个公司的一个自己的。',
      '搭档已经全职了问你什么时候来，你说再攒点，缺的是勇气。',
    ]},
    { ageRange: [36, 45], texts: [
      '还在上班但副业养了两个兼职，同事以为你炒股，没人知道那三万用户的产品。',
      '体检出高血压那天坐在医院走廊想，再这样双份活等不到退休。',
      '36岁才认真做AI副业，晚了十年，但你有客户有存款兜底，不怕晚出发。',
    ]},
  ],

  faithCrisisMonologues: [
    '帮被裁的同事收拾纸箱，他的工牌在桌上放了三年。',
    '你做的AI被用来监控员工，你关了电脑在黑暗里坐了很久。',
    '伴侣在阳台说"你有多久没看过日落了"，你答不上来。',
    '深夜关掉所有AI试着自己写代码，三行就放弃了，开了瓶酒到天亮。',
    '镜中黑眼圈白发发胖的脸，若走不通这些年熬的夜全空了。',
  ],

  checkSuccess: (state) => {
    // 成功条件（v16.3）：总财富(存款+被动收入×12) >= 年支出×32 且 信念值>=50 且 年龄>=36
    const annualExpense = state.annualBaseCost + (state.currentMortgageCost || 0);
    const passiveCapitalized = (state.passiveIncome || 0) * passiveIncomeCapMult;
    const totalWealth = state.currentSavings + passiveCapitalized;
    return totalWealth >= annualExpense * 32 && state.pathFaith >= 50 && state.currentAge >= 36;
  },

  successTitle: '浪潮之上',
  successEnding: (state) => {
    return `${state.currentAge}岁。一个普通的早晨。你在论坛上看到一个陌生人的提问——他用你开源的工具卡住了。你花二十分钟帮他调通。他发来一句"谢谢，我折腾了三天"。\n\n你关掉电脑，给自己倒了杯水。窗外鸟在叫。\n\n你没站在领奖台上，没接受采访。银行卡里的数字静静躺在那里，够你过完这辈子。API账单烧完存款的那个月、被大厂抄走产品的那个星期、深夜怀疑自己不会独立思考的那些时刻——它们没有消失，但它们不再疼了。\n\n浪潮还在涌，但你不需要追了。你只是帮了一个人，然后关了机。屏幕黑下去的那一刻，你发现自己在笑。`;
  },

  failureTitle: '浪潮之下',
  failureEnding: (state) => {
    return `${state.currentAge}岁了，你还在打工。\n\n新来的应届生用你听都没听过的框架，半天解决了你花一周做的事。你没有愤怒，只是笑了笑——你想起二十多年前的自己，也是这样让前辈不安的。\n\n你成了一个"会用AI的普通人"，就像当年会用Excel的人一样。浪潮太大了，你只是浪里的一滴水。没有人能永远站在浪尖。\n\n下班路上你买了菜，回家做了碗面。冰箱里的牛奶还没过期。你没提前退休，也没被淘汰。日子还在过。`;
  },

  targetRetireAge: 46,
};

// ============================================================
// 路径2：链上原住民
// ============================================================
const chainNative: RetirementPath = {
  id: 'chain_native',
  name: '链上原住民',
  icon: '⛓️',
  color: '#f7931a',
  subtitle: '赌代码不会撒谎，账本不会归零',
  description: '你信数学不信人。法币会贬值，公司会倒闭，银行会冻结账户，但链上的记录谁也改不了。你把青春和积蓄压在一串24个单词上。',

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
    state.lifeLog.push('22岁这年你把第一笔存款的三成换成了加密货币。室友说你疯了，你爸说你被传销骗了。白天照常上班，凌晨三点盯着K线手心出汗。你抄下24个助记词的那晚，把那张纸看了不下二十遍——这串单词是你的身家，丢了就什么都没了。');
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
      '手机里八个交易所APP，三个价格闹钟，凌晨震动不是地震是行情。',
      '表哥问你做什么工作，你说"区块链"，他哦了一声"传销吧"。',
      '第一次经历两成暴跌，手抖但没卖，你告诉自己HODL。',
      '抄下24个助记词那晚，你把那张纸看了不下二十遍。',
      'Twitter上跟人争区块大小到凌晨两点，第二天上班迟到了。',
    ]},
    { ageRange: [26, 30], texts: [
      '持仓翻三倍又跌回原点，你学会不看短期了，但凌晨三点还是会醒。',
      'DAO聚会上来的人都很怪，但你们看彼此的眼神一样：都在赌。',
      '女朋友翻你手机看到交易所，问"有多少钱是我看不见的"。',
      '冷钱包躺在抽屉最底层，像颗沉默的种子，你等它发芽。',
      '第一次用DeFi质押赚利息，"年化23%"让你既兴奋又害怕。',
    ]},
    { ageRange: [31, 35], texts: [
      '身边的人不是财富自由消失了，就是爆仓回去上班了，你还在。',
      '链上没有央行，但有巨鲸；代码不撒谎，写代码的人会。',
      '腰背开始出问题，是久坐看盘的代价，但你停不下来。',
      'DAO里投了第一个治理提案没通过，你的地址永久留在了链上。',
      '熊市反而更忙，牛市赚钱熊市建仓，建的是信任。',
    ]},
    { ageRange: [36, 45], texts: [
      '不再跟人解释你在做什么了，懂的人自然懂。',
      '有过"当初全卖就好了"的念头，也有"幸好没卖"的庆幸。',
      '开始把一部分资产转回法币，不是认输，是懂了落袋为安。',
      '用DCA定投不再盯盘了，时间比择时重要。',
      '身边有人靠meme币翻百倍有人爆仓欠债，你默默多存了一份备份。',
      '给父母买了套房用法币，爸收到转账沉默十秒说"注意安全"。',
    ]},
    { ageRange: [46, 50], texts: [
      '三轮牛熊了，年轻人问这次有什么不同，你说"每次都一样又不一样"。',
      '资产配了国债和指数基金，不是背叛，是让信仰和安稳并存。',
      '你开始把"守富"当主业，终于学会在行情好的时候也能睡着。',
      '和一个老矿工吃饭，他还在挖，你说够了吧，他说停不下来。',
      '第一次劝年轻人别All In，说完自己愣住——你当年也没听劝。',
    ]},
    { ageRange: [51, 55], texts: [
      'Twitter粉丝几十万但发推越来越少，不再跟人争比特币是不是骗局。',
      '参加早期币友的葬礼，TA的几百个BTC私钥没人找得到。',
      '助记词刻在钢板上和遗嘱放一起，告诉孩子这24个词比房子值钱。',
      '你给孙子开个钱包转了一枚BTC，说"这是爷爷没靠别人赚的"。',
      '链上生日提醒你，你的地址已经活了整整二十年，比很多公司久。',
    ]},
    { ageRange: [56, 60], texts: [
      '打开最早的交易所账户，零碎代币有的翻百倍有的归零，你没动它们。',
      '年轻时骂你疯的表哥来问比特币还能不能买，你说"问自己能不能拿十年"。',
      '你翻出一条2017年的推文"我下注了"，底下没人理你，你也没删。',
      '侄子复制了一份你的助记词，你让他抄三遍背下来，他嫌你啰嗦。',
      '午夜你打开最早的区块浏览器，看那笔十几年前的转账，像看自己的墓志铭。',
    ]},
  ],

  sideHustleMonologues: [
    { ageRange: [22, 25], texts: [
      '格子间里写周报，手机开着三个交易所K线，调到最暗。',
      '工资三成换成币，白天的工作只是给你提供子弹。',
      '在公司偷偷跑测试链写智能合约，组长以为你在写业务代码。',
      '午休刷Twitter看币圈消息，不敢说手机里一半是交易所APP。',
      '第一次DeFi质押"年化23%"，银行定期才2%，真有这么好的事？',
    ]},
    { ageRange: [26, 30], texts: [
      '链上资产超两年工资了还在上班，妈问工资涨了没你说涨了。',
      'Telegram和全球开发者讨论协议设计，白天在公司开无关的会。',
      '协议上链了每天处理几万美金交易量，在公司厕所看数据看板。',
      '白天写CRUD晚上审Solidity，大脑每天在两种语言间切换。',
      '第一次DAO链上投票，手抖着确认了三次地址才点下去。',
    ]},
    { ageRange: [31, 35], texts: [
      '链上收入远超工资了，在公司还要假装正常员工参加团建鼓掌。',
      'DAO邀你做全职贡献者，年薪两倍工资，你盯着消息看了很久。',
      '开始在工位上公开看K线了，同事问是不是炒股，你说"算是吧"。',
      '开会偷偷看Zapper仪表盘，会议室的季度KPI像另一个世界的事。',
      '有人出高价买你的ENS域名，你拒绝了——那是你链上的名字。',
    ]},
    { ageRange: [36, 45], texts: [
      '还在上班但链上资产够退休三次了，同事聊基金定投你在心里换算成BTC。',
      '38岁才辞职All In，不是钱不够，是怕了十六年终于想明白怕就永远不出发。',
      '升到技术总监年薪六十万，但链上收益一天就能波动这么多，递信时老板很惊讶。',
    ]},
  ],

  faithCrisisMonologues: [
    '交易所提不出币的那一周，你刷新了七百次页面。',
    '妈电话里问"你存了多少钱养老"，你看着K线答不上来。',
    '参加老同学婚礼，他们聊房贷学区，你插不上话。',
    '女友收拾东西走了，说受不了你盯K线像盯赌盘，门关上你没动。',
    '币圈大会台上讲的和五年前一模一样，你喝了一晚上酒。',
  ],

  checkSuccess: (state) => {
    const chainHoldings = (state as any).chainHoldings || 0;
    const annualExpense = state.annualBaseCost + (state.currentMortgageCost || 0);
    // 成功（v19校准）：链上资产>=年支出×5 且 信念值>=40 且 年龄>=35
    // 与 checkCanRetire 的退休门槛（×5）对齐，避免"能退休却不算走通"的倒挂。
    // 配合 applyAnnualChainGrowth 的年度自然增长（"洼地"修复），让这条高波动路径具备可达成性。
    return chainHoldings >= annualExpense * 5 && state.pathFaith >= 40 && state.currentAge >= 35;
  },

  successTitle: '链上自由',
  successEnding: (state) => {
    return `${state.currentAge}岁这年你做了一件事：把一半仓位换成稳定币，设了一个自动理财策略。然后你关掉了所有行情闹钟。\n\n第一次没有闹钟醒来的早晨，你躺在床上听了很久鸟叫。你已经不记得上次这样是什么时候了。\n\n钱包里的钱够你过完这辈子。你不需要看K线睡觉了，不需要凌晨三点刷手机了，不需要在暴跌时攥紧拳头了。\n\n交易所暴雷那几次你差点全赔进去，监管铁拳落下时你整夜没睡。你无数次想清仓走人，但没走——不是坚定，是不甘心。\n\n你给爸转了一笔钱，附言没写。他打过来，沉默了十秒，挂了。`;
  },

  failureTitle: '链下余生',
  failureEnding: (state) => {
    return `${state.currentAge}岁，你清掉了最后一批币。\n\n不是不信了，是扛不住了。房贷要还，孩子要养，父母要看病，你不能再等"下一轮牛市"了。这些年赚的亏的加一起，基本打平。\n\n你找了份正常工作，朝九晚五。没跳楼没跑路，日子重新接上了轨道。\n\n偶尔路过以前和币友吃烧烤的摊子，老板换了，招牌也换了。你站了一会儿，没有进去。\n\n硬件钱包放进抽屉最底层。也许十年后它会升值，也许不会。你已经不需要它来证明什么了。`;
  },

  targetRetireAge: 44,
};

// ============================================================
// 路径3：数字游牧民
// ============================================================
const digitalNomad: RetirementPath = {
  id: 'digital_nomad',
  name: '数字游牧民',
  icon: '🌍',
  color: '#4ade80',
  subtitle: '赌哪里便宜哪里就是家，哪里有网哪里就能活',
  description: '你不想困在一个城市里。用远程工作赚一线城市的钱，花低成本城市的生活费——地理是最大的杠杆，机票是最便宜的门票。',

  initialEffect: (state) => {
    // 副业起步：不改变职业/城市/薪资，下班后接远程单
    state.stress = Math.min(100, state.stress + 8); // 白天上班+晚上接单，双线作战
    // pathFaith 由 selectRetirementPath() 统一设置为40，此处不再覆盖
    state.passiveIncome = 0;
    state.lifeLog.push('22岁这年你在Upwork上投了六十多份提案，终于拿到第一个远程客户——时薪180块。白天照常上班，晚上用AI工具帮深圳创业公司做网站。你没辞职，但已经在研究清迈的物价和巴厘岛的共享空间了。登机箱放在床边，你在等一个出发的日子。');
  },

  sideHustleMonologues: [
    { ageRange: [22, 25], texts: [
      '白天写代码晚上接远程单，生物钟被劈成两半。',
      '工位上偷回客户消息，副业时薪是主业三倍，心跳加速。',
      '同事聊周末去哪玩你说在家休息，其实在赶远程ddl。',
      'Upwork的profile改了二十遍，第一个五星好评你截图存了三处。',
      '研究各国数字游民签证，表格密密麻麻像张藏宝图。',
    ]},
    { ageRange: [26, 30], texts: [
      '副业收入快赶上主业了，每次发工资都算辞职后存款撑多久。',
      '年假去大理待了两周，白天共享空间晚上夜市米线，回程想下次不回了。',
      '妈打电话问忙不忙你说忙，没说在忙两份工作。',
      '清迈短租一个月只花三千赚了三万，第一次懂了地理套利。',
      'VPN年费600块，你觉得这是最值的一笔投资。',
    ]},
    { ageRange: [31, 35], texts: [
      '副业早超主业了，每天坐工位上都在想为什么还在这里。',
      '频繁看机票不是旅行，是在规划"辞职后去哪"。',
      '远程客户问能不能全职合作，这句话等了好几年，真到了又犹豫。',
      '刷数字游民Reddit看别人35岁退休，关掉页面看报销单。',
      '算了笔账：辞职后美元收入在泰国花，存款能撑五年以上。',
    ]},
    { ageRange: [36, 45], texts: [
      '37岁还在上班但远程客户稳定五年了，不是不敢辞是父母需要医保给他们安全感。',
      '40岁终于辞职，算过所有数字买好国际医保，登机箱里一台电脑一件冲锋衣。',
      '比别的游民晚出发十年，但你有积蓄有人脉有大公司练出来的靠谱。',
    ]},
  ],

  cardWeights: {
    '技能进修': 1.5,
    '投资理财': 1.2,  // 游牧路径需要副业+理财建立被动收入
    '生活消费': 1.0,
    '健康养生': 1.2,
    '💝 感情': 1.5,
    '社交关系': 2.0,
    '核心决策': 1.5,
    '阶段解锁': 0.5,
  },

  exclusiveCrossroads: [
    'nomad_visa_crackdown',    // 28岁：租约收紧
    'nomad_partner_settle',    // 31岁：伴侣想定居
    'nomad_tax_pursuit',       // 34岁：全球征税追讨
  ],

  openingMonologues: [
    { ageRange: [22, 25], texts: [
      '签了全职远程合同收入三倍，清迈带阳台民宿，开工前先游半小时泳。',
      '一年英语从磕巴到流利，因为每天都在用它吵架和道歉。',
      '只带一个登机箱生活，人真正需要的比想象中少得多。',
      '收到整月美元付款，换算成清迈生活费够活三个月。',
      'VPN断了视频会议戛然而止，手忙脚乱切节点时客户在等。',
    ]},
    { ageRange: [26, 30], texts: [
      '住过七个城市，每个地方三个月，新鲜劲刚过就走。',
      '成都认识一个人住了半年，租约到期TA不走你不留，飞机上哭了。',
      '妈每次问什么时候回来你说快了，你说的快了和她理解的不一样。',
      '巴厘岛coworking里一个德国人一个巴西人一个日本人，Slack比家人熟。',
      '护照盖满入境章，但开始记不清哪个章属于哪个城市了。',
    ]},
    { ageRange: [31, 35], texts: [
      '不是身体累，是"永远在路上"的累，新鲜感变成了消耗。',
      '收入涨了消费也在涨，逃离"生活成本膨胀"但膨胀追着你跑。',
      '客户跨三个时区，日程表永远在东八区美西欧洲之间撕扯。',
      '清迈两千租的公寓比北京五千的好十倍，省下的钱变成了机票。',
      '生病了怎么办老了怎么办，根在哪里，AI回答不了这些问题。',
    ]},
    { ageRange: [36, 45], texts: [
      '选了一个地方停下来，不是走不动了，是找到了想留下的理由。',
      '偶尔还买张机票去陌生城市待一周，但不再需要"永远在路上"证明什么。',
      '登机箱落了灰，你觉得这也挺好的。',
      '海边小镇买了套小公寓，推窗就是海，终于有了可以回来的地方。',
      '不再亲自写每一行代码，花更多时间维护关系判断方向。',
      '带父母去了你住三年的东南亚小镇，妈摸了摸墙说"原来你真在这里生活"。',
    ]},
    { ageRange: [46, 50], texts: [
      '搬到了二十岁根本不会考虑的城市，安静便宜有好医院，开始追日落不追时区。',
      '以前的游牧朋友群里，话题从"下一站去哪"变成了"血压多少"。',
      '做游民mentor告诉年轻人最重要的不是找客户，是漂泊中不丢了自己。',
      '你买了个小院子种菜，浇水时想起二十年前在清迈天台晾衣服。',
      '远程会议里年轻同事问你在哪，你说"家"——停顿了一下，你居然真的说了"家"。',
    ]},
    { ageRange: [51, 55], texts: [
      '翻开旧护照，褪色入境章像旧伤口，有些城市忘了名字但留下了什么。',
      '孩子在两国长大会三种语言，TA问家在哪你说"wherever we are together"。',
      '你带早年那些游民朋友回家吃饭，一屋子人操着六种口音夹同一个锅里的菜。',
      '镇上邮局的大姐认得你，每次都问"娃上学去啦"，你答"回啦"。',
      '你不再更新游民攻略了，老读者私信，你回"去找个地方住下来吧"。',
    ]},
    { ageRange: [56, 60], texts: [
      '阳台喝本地咖啡，杯子里的脸比第一份合同时老了二十岁，眼神一样。',
      '孩子问"你年轻时候为什么老搬家"，你说"因为那时候家是问出来的"。',
      '你给当年帮你修过行李箱轮子的店主寄了张明信片，那个地址你还记得。',
      '旅游杂志采访你，标题写"游民老头"，你笑，随他们去。',
      '你数了数护照上的入境章，一百多个，最值钱的那个是"回家"那天盖的。',
    ]},
  ],

  faithCrisisMonologues: [
    '爸妈住院你在第三国，最近的航班要飞二十六个小时。',
    '行李箱轮子坏在异国路边，你蹲下来修的时候哭了。',
    '遇到想留下的人，但你的机票是后天的。',
    '朋友婚礼赶不回去，你在时差里刷到了现场照片。',
    '翻朋友圈同事晒孩子晒房贷，你在出租屋里空调嗡嗡响身边没人。',
  ],

  checkSuccess: (state) => {
    // 实际年支出 = baseCost × 城市系数 + 房贷
    const cityMult = CITY_CONFIGS[state.currentCity]?.costMultiplier || 1.0;
    const actualAnnualExpense = state.annualBaseCost * cityMult + (state.currentMortgageCost || 0);
    // 成功：被动收入>=实际年支出×1.6（需有足够缓冲），信念>=50，年龄>=36
    return state.passiveIncome >= actualAnnualExpense * 1.6 && state.pathFaith >= 50 && state.currentAge >= 36;
  },

  successTitle: '地球居民',
  successEnding: (state) => {
    return `${state.currentAge}岁，你在一个小城住下来了。\n\n不大的公寓，阳台上种了罗勒，早晨浇水的时候叶子上有露水。楼下咖啡馆老板知道你喝冰美式不加糖，你走到门口他就开始做了。\n\n被动收入覆盖了所有开销。你不需要解释你的生活方式了。那些急诊室独自签字的夜晚、机场哭完又上飞机的时刻、行李箱轮子坏在路边的下午——它们都过去了。\n\n你偶尔还是会买一张机票去一个陌生地方待一周，但登机箱不再放在床边了。你有了一个地址，罗勒在阳台上长着，咖啡馆老板记得你喝什么。\n\n这就是你想要的。不是环游世界八十天，是走到哪里都能停下来，而停下来的时候，有一杯咖啡在等你。`;
  },

  failureTitle: '候鸟归巢',
  failureEnding: (state) => {
    return `${state.currentAge}岁你回来了。\n\n不是认输，是地理套利的窗口在关。AI把远程交付门槛拉得太低，签证越来越难续，汇率波动让收入忽高忽低。你累了。\n\n老家找了份朝九晚五的工作。最初不适应地铁的拥挤和同事的八卦，但慢慢发现，妈妈做的菜比任何国家的都好吃。\n\n你不再提远方了。偶尔翻那些年在路上的照片，不后悔也不怀念。清迈凌晨三点急诊室独自签字的那种孤独，是你带回来的东西。\n\n你走过了世界，然后回到了起点。阳台上没有罗勒，但厨房有妈妈煨的汤。`;
  },

  targetRetireAge: 44,
};

// ============================================================
// 路径4：超级IP
// ============================================================
const superIP: RetirementPath = {
  id: 'super_ip',
  name: '超级IP',
  icon: '🎙️',
  color: '#ff6b9d',
  subtitle: '赌自己的名字比任何公司Logo都值钱',
  description: '公司会倒闭行业会消失，但你不会。你要把自己活成一个品牌——不需要背书不需要依赖，光靠名字就能吃饭。镜头前的那张脸既是盔甲也是软肋。',

  initialEffect: (state) => {
    // 副业起步：不削减主业薪资，下班后做内容
    state.stress = Math.min(100, state.stress + 8); // 下班后剪视频到凌晨
    // pathFaith 由 selectRetirementPath() 统一设置为40，此处不再覆盖
    state.passiveIncome = 0;
    (state as any).ipFollowers = 500; // 初始粉丝
    (state as any).ipReputation = 30; // 声誉值
    state.lifeLog.push('22岁这年你注册了第一个内容账号。白天上班，晚上在出租屋支起补光灯剪视频到凌晨两点。你不知道要发什么，但你知道一件事：如果十年后还需要投简历找工作，你就输了。第一条视频23个赞，18个来自亲戚，但有5个来自陌生人。');
  },

  cardWeights: {
    '技能进修': 1.8,
    '投资理财': 1.2,  // IP路径需要副业+理财建立被动收入
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
      '一条内容23个赞，18个来自亲戚，5个来自陌生人，像中了彩票。',
      '研究什么标题被点开什么封面被点击，你在研究人性。',
      '凌晨两点还在剪，看到一条评论"你的内容改变了我"，你继续剪。',
      '补光灯换了三个位置调出不显脸大的角度，镜中人陌生又熟悉。',
      '三十分钟废话剪成三分钟干货，内容不是你说什么是观众听到什么。',
    ]},
    { ageRange: [26, 30], texts: [
      '第一次有黑粉，骂你恰烂钱说你变了，解释只会更糟。',
      '行业活动被认出来，小姑娘说"看着你内容长大的"，你才27岁。',
      '第一条广告报价五千，犹豫三天才接，怕粉丝说你变了。',
      '后台数据是每天睁眼第一件事，数字跳一下心就跳一下。',
      'MCN签约条件诱人，"内容方向需甲方审核"那行字让你拒绝了。',
    ]},
    { ageRange: [31, 35], texts: [
      '能靠内容养活自己了，但"喜欢的"和"赚钱的"是两件事。',
      '伴侣说"你跟谁都像在做内容"，你意识到TA是对的。',
      '台上侃侃而谈，下台后一个人在酒店房间吃外卖。',
      '算法变了播放量掉七成，你花两周解新逻辑，恨它但离不开。',
      '做了真正想做的内容播放量十分之一，评论区质量前所未有。',
    ]},
    { ageRange: [36, 45], texts: [
      '不再追涨粉了，一万个真心的人比一百万路过的重要。',
      '终于可以拒绝不想接的广告，这种自由比钱珍贵。',
      '带新人说"做IP不是表演是把真实的自己放大"，你花了十年才懂。',
      '拒绝七位数代言，那个产品你自己不用，十年信任不想毁。',
      '开始理解"慢"，年轻时追热点拼频率，现在花一个月打磨一期。',
      '粉丝发长私信说你陪TA走过最难的一年，你坐在电脑前沉默很久。',
    ]},
    { ageRange: [46, 50], texts: [
      '很久没看后台数据了，发内容因为有话想说不是讨好算法。',
      '年轻博主问怎么涨粉，你说"想你能给别人什么"，他们失望了。',
      '你更新得慢了，但每一条都有人回"你还在，真好"。',
      '一个老粉留言说把你当树洞听了十年，你回了句"我也是"。',
      '你删掉了过去所有"爆款标题"的笔记，留着的是半本真话。',
    ]},
    { ageRange: [51, 55], texts: [
      '评论区出现"从小看你视频长大"，第一批粉丝已经为人父母。',
      '开始写书不是为卖，是整理那些年踩过的坑见过的人想通的事。',
      '一场线下分享会，两百人的厅坐满了，你讲完问答环节没人问怎么涨粉。',
      '你第一次做付费社群，不是为钱，是想让真正懂的人聚在一起。',
      '有人翻到你十年前的观点截图打你脸，你转发说"年轻气盛，见谅"。',
    ]},
    { ageRange: [56, 60], texts: [
      '翻到最早的视频，出租屋里补光灯前的年轻人，你想对TA说别怕。',
      '风格变了很多次，从激进到温和，但你还在说话还在表达。',
      '你录了一期"我退休了"的视频，没有告别，只是说以后想聊点真正要紧的。',
      '你给年轻创作者留了言，只写了句"慢慢来，别把热爱熬成KPI"。',
      '你关掉打赏，把最后一个平台的简介改成"还在说话的人"。',
    ]},
  ],

  sideHustleMonologues: [
    { ageRange: [22, 25], texts: [
      '白天最普通的员工，晚上镜头前手舞足蹈的创作者。',
      '第47条视频终于破十万播放，工位上差点叫出来。',
      '第一条广告两千块犹豫三天，接了买了个更好的麦克风。',
      '在公司厕所里录口播，那里回音意外好听，捂着嘴小声说。',
      'AI写初稿做字幕剪粗剪，最后那刀决定灵魂的还得自己来。',
    ]},
    { ageRange: [26, 30], texts: [
      '粉丝五万月入一万出头快赶上工资了，黑眼圈遮瑕盖不住。',
      '工位偷回粉丝评论，组长站身后你没发现，手机差点掉地上。',
      '品牌方年框是年薪两倍，内容方向品牌定，你第一次认真想辞职。',
      '选题本走到哪带到哪，地铁上想到标题立刻记下来。',
      '商务加满两个号但只接自己用过的产品，线很细但不越。',
    ]},
    { ageRange: [31, 35], texts: [
      '内容事业是真正的生意了，唯一让它还是副业的是每天要打卡。',
      '公司存在感越来越低，成就感全来自下班后那几小时。',
      '搭档问什么时候辞职你说再等等，TA说你每次都这么说。',
      '偷偷建Excel对比主业副业时薪成长风险，数据说该辞了手停住了。',
      '雇了兼职剪辑，第一次看到别人剪的视频不习惯，慢慢学会放手。',
    ]},
    { ageRange: [36, 45], texts: [
      '39岁还在上班但内容矩阵月入是工资五倍，同事以为你是普通中层。',
      '41岁终于辞职，不是冲动，是再不下场窗口期就关了。',
      '36岁才认真做内容比同行晚不止一轮，但你有真实阅历有人愿意听过来人说话。',
    ]},
  ],

  faithCrisisMonologues: [
    '恶评翻到凌晨三点，手机屏幕亮着你脸是黑的。',
    '最好的朋友因为你发的一条内容拉黑了你，红色感叹号看了很久。',
    '粉丝说"你变了"三个字比任何恶评都疼。',
    '和伴侣吵到最凶，TA说"你连笑都像在拍视频"。',
    '酒店房间吃外卖看自己刚发的"正能量"视频，突然觉得恶心。',
  ],

  checkSuccess: (state) => {
    const annualExpense = state.annualBaseCost + (state.currentMortgageCost || 0);
    // 成功（v16.4放宽声誉门槛：50→45，提14%→目标20%）：被动收入>=年支出×1.0 且 声誉>=45 且 年龄>=34
    return state.passiveIncome >= annualExpense * 1.0 && (state as any).ipReputation >= 45 && state.currentAge >= 34;
  },

  successTitle: '自成一派',
  successEnding: (state) => {
    return `${state.currentAge}岁。新视频开头你说："大家好，我不知道。"\n\n你顿了一下，然后说今天想聊聊不确定的事。这是你第一次在镜头前说"我不知道"。以前你觉得必须有答案，必须笃定，必须像个"专家"。\n\n评论区第一条："这才是我关注你的原因。"\n\n你关掉后台数据。被捧过被踩过被网暴到不敢出门过，那些熬到凌晨的夜晚和跟伴侣争吵到分手的时刻没有消失，但它们不再能定义你了。\n\n你不需要追热点，不需要看数据，不需要讨好任何人。留下来看的人，是真正懂你的人。你在镜头前坐直了一点，开始说话。`;
  },

  failureTitle: '人设崩塌之后',
  failureEnding: (state) => {
    return `${state.currentAge}岁你"凉了"。\n\n没有什么大事件，只是慢慢没人看了。新IP冒出来更年轻更大胆更懂算法，你的内容不再被推荐，广告主不再找你。\n\n你松了口气。\n\n找了份正常工作，简历上不知道怎么写那几年。去菜市场不用戴口罩了，不用化妆了，不用每句话想能不能发了。\n\n你偶尔还发内容，不追流量，只是有些话想说。这也许才是做内容最初的意思。`;
  },

  targetRetireAge: 44,
};

// ============================================================
// 路径5：银发守夜人
// ============================================================
const silverEconomy: RetirementPath = {
  id: 'silver_economy',
  name: '银发守夜人',
  icon: '👴',
  color: '#fbbf24',
  subtitle: '霓虹照不到的角落，总得有人守着那盏灯',
  description: '四亿老人被隔绝在算法之外，他们的孤独是座被遗忘的岛。你带着AI陪伴设备和护理知识回去，做别人看不起的事。在人人追效率的时代，温情是最稀缺的东西。',

  initialEffect: (state) => {
    // 副业起步：不改变职业/城市/薪资，周末回老家照顾老人
    state.stress = Math.min(100, state.stress + 12); // 工作日上班+周末做养老，最累
    // pathFaith 由 selectRetirementPath() 统一设置为40，此处不再覆盖
    (state as any).silverBusiness = { clients: 0, reputation: 20, monthlyRevenue: 0 };
    state.lifeLog.push('22岁这年你做了所有人不理解的决定：周末回老家，用AI陪伴机器人帮邻居照顾独居老人。你妈说"供你上大学不是让你回来伺候老人的"。你没反驳。帮张奶奶和国外孙子视频通话那一刻，她攥着你的手不放。她的手很干很薄，像一片秋天的叶子。');
  },

  sideHustleMonologues: [
    { ageRange: [22, 25], texts: [
      '周一到周五敲键盘，周六骑电动车穿街走巷量血压。',
      '张奶奶推轮椅时抓你手说"你比我儿子贴心"，你鼻子一酸。',
      '工位上查养老政策被领导看到以为摸鱼，你笑了笑关掉页面。',
      '花一个月工资报护理培训班，同事以为你在学编程。',
      '电动车筐里永远是血压计和记满老人情况的笔记本。',
    ]},
    { ageRange: [26, 30], texts: [
      '周末客户从3个涨到15个，一个人快忙不过来了。',
      '爸中风你用护理知识照顾三天三夜，他第一次说你选的路是对的。',
      '上班想养老站做养老想明天的会，你被劈成两半知道迟早要选。',
      '一个Excel表格管老人信息，后来变成了整个服务站的运营系统。',
      '老人子女从国外回来塞红包你退了，收了有些东西就变了。',
    ]},
    { ageRange: [31, 35], texts: [
      '养老站小有名气但还在上班，周五赶最后一班高铁周日晚回来。',
      '民政局问能不能正式注册机构，你握着手机看了看格子间。',
      '存款在涨但没时间花，所有周末假期都投进了养老站。',
      '高铁上回护工消息邻座以为你处理工作邮件，某种意义上是的。',
      '参观日本养老机构看精细到毫米的流程，既兴奋又焦虑。',
    ]},
    { ageRange: [36, 45], texts: [
      '38岁还在公司但养老服务站已经三家了，同事以为你周末"搞投资"。',
      '父亲走了才辞职，葬礼上想你照顾了那么多别人父母却没多陪他。',
      '40岁All In养老比同行晚十几年，但你带来了大公司的管理经验和流程思维。',
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
      '张奶奶推轮椅时抓你手说"你比我儿子贴心"，你鼻子一酸。',
      '同学聚会没去，不知道怎么解释"我在做养老"这件事。',
      '租了小门面挂"社区养老服务站"牌子，第三个月门口排起队。',
      '第一次帮老人换尿布吐了，尊严是需要别人帮你维护的东西。',
      '李奶奶把你当孙子每次塞糖，糖化了又凝固你从来不吃也不拒绝。',
    ]},
    { ageRange: [26, 30], texts: [
      '爸中风你照顾三天三夜，他第一次说"你选的路是对的"。',
      '雇了第一个员工，面试二十人只留一个，这行最缺的是耐心。',
      '开始赔钱了，老人付费能力有限但服务成本高。',
      '考了高级护理员证贴墙上，亲戚说"大学生怎么干伺候人的活"。',
      '家属闹了两小时走后你坐在空站里，第二天老人拉你手你又觉得值了。',
    ]},
    { ageRange: [31, 35], texts: [
      '互联网巨头入场免费送设备抢走一半客户，你第一次真正恐惧。',
      '巨头做不了"重服务"，老人需要的是有人听他们说话。',
      '服务站成了区域标杆，电视台来采访，妈终于敢跟亲戚说了。',
      '研究政策文件荧光笔划得五颜六色，养老是和制度的对话。',
      '护工辞职因为"家里嫌不体面"，你送TA到车站没劝。',
    ]},
    { ageRange: [36, 45], texts: [
      '五家站一百多员工，每周还是抽一天亲自照顾老人。',
      '第一批客户有的不在了，家属握你手说"谢谢你陪TA最后一程"。',
      '今天做的事，也许就是三十年后你自己的样子。',
      '建了失智老人专门照护区成本翻倍，家属从全国各地赶来。',
      '锦旗挂不下只能叠着放，你不觉得是荣誉是沉甸甸的信任。',
      '自己也有白头发了，量血压时意识到服务的这群人是三十年后的你。',
    ]},
    { ageRange: [46, 50], texts: [
      '企业交给职业经理人每周只去两天，需要体系不是你一个人。',
      '写行业白皮书把踩过的坑记下来，希望后来人不用从零开始。',
      '你开始招年轻院长，面试时问的不是能力，是"能不能坐得住"。',
      '一个床位一个床位地数，你终于明白最好的扩张是让老人安心睡。',
      '行业大会上你不再讲商业模式，讲的是那个总爱坐窗边的老人。',
    ]},
    { ageRange: [51, 55], texts: [
      '母亲住进你自己的养老院，一个月后她说"你做的事是对的"。',
      '当年骂你没出息的亲戚托关系送老人来，你按标准流程安排。',
      '陪你最早的护工阿姨退休了，你给她办了个体面的退休礼。',
      '你推着九十岁的张奶奶散步，她问"你几岁啦"，你说"五十多"，她说"还小"。',
      '你建了张"最后课程表"：教手机、教写遗嘱、教怎么好好告别。',
    ]},
    { ageRange: [56, 60], texts: [
      '推百岁老人晒太阳，TA握你手说"谢谢你"，每一次都像第一次。',
      '坐养老院长椅看老人下棋聊天发呆，想等你老了也住这样一个地方。',
      '你给自己留了个床位，靠窗，阳光好，护士说你"未雨绸缪"。',
      '当年说她"伺候人的活"的亲戚住进来了，你路过他房门口，没停。',
      '你给所有员工立了条规矩：老人走的那天，谁值班都要在。',
    ]},
  ],

  faithCrisisMonologues: [
    '照顾三年的老人走了，子女没来葬礼，你一个人在灵堂坐了很久。',
    '妈在家摔倒你在另一个城市的养老院，赶回去路上手抖开不了车。',
    '深夜急诊签字你笔握不稳，老人家属在外地赶不回来。',
    '伴侣说"你对那些老人比对我好"，你坐沙发到天亮说不出话。',
    '巨头免费碾压你账上只够撑三个月，给妈打电话她没接。',
  ],

  checkSuccess: (state) => {
    const business = (state as any).silverBusiness;
    // 成功（v16.4：门槛从3万调到3.2万，压39%→目标30%）
    // 月营收>=3.2万 且 声誉>=50 且 年龄>=35
    return business && business.monthlyRevenue >= 32000 && business.reputation >= 50 && state.currentAge >= 35;
  },

  successTitle: '老有所依',
  successEnding: (state) => {
    return `${state.currentAge}岁。张奶奶的孙女从国外回来了。\n\n你在花园里陪老人晒太阳，一个三十多岁的女人走过来，站在你面前。你认出了她的眉眼——和张奶奶年轻时照片上一模一样。她抱着你，说了一句"谢谢你陪我奶奶最后一程"。\n\n你拍着她的背，说不出话。张奶奶走了三年了。\n\n你的品牌覆盖了三座城市，服务两千多位老人，政府给颁了奖。但你最珍视的时刻永远是这样的——有人走过来，握着你的手，说谢谢。\n\n你没有上市没有连锁扩张到全国，你只是守着那些霓虹照不到的角落，点着一盏灯。风很大，灯一直没灭。`;
  },

  failureTitle: '未尽之事',
  failureEnding: (state) => {
    return `${state.currentAge}岁你关掉了最后一家服务站。\n\n巨头免费模式加成本上涨实在撑不住了。你把客户转介给更大的机构，最后那天在空荡的站里坐了很久。墙上的锦旗你摘了下来，叠好放进箱子。\n\n你去了一家养老公司做顾问，把这些年经验教给更多人。没失败——你证明了需求存在，只是时机不对。\n\n但你心里有个洞。你帮了那么多别人的父母，最后发现欠最多的是自己的家人。\n\n还来得及。你拿起车钥匙，开去了爸妈家。`;
  },

  targetRetireAge: 48,
};

// ============================================================
// 路径6：生物赌徒
// ============================================================
const bioGambler: RetirementPath = {
  id: 'bio_gambler',
  name: '生物赌徒',
  icon: '🧬',
  color: '#a855f7',
  subtitle: '赌死亡是个可以被黑掉的Bug，活得久才是终极杠杆',
  description: '所有人算存多少钱退休，你在算另一笔账：如果抗衰技术突破人能活到120岁，"退休"这个概念本身会被重写。你要做的就是活到那时候，手里还有筹码。药盒里的补剂是你的子弹。',

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
    state.lifeLog.push('22岁这年你开始了"延寿计划"：白天上班，晚上研究抗衰论文、吃NMN、测基因。四成积蓄买了生物科技股。室友说你疯了。书桌上补剂瓶越堆越多，你在每个瓶盖上贴了标签和服用时间。你自己也不确定是不是疯了，但那篇小鼠寿命延长30%的论文你反复读了七遍。');
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
      '每天吃的补剂比饭还多，室友说你是药罐子。',
      '小鼠寿命延长30%的论文让你兴奋一整晚，从小鼠到人还远但有方向。',
      '推掉所有喝酒熬夜的局，有人说你活得没劲，你笑了笑。',
      'CGM传感器贴胳膊上像小甲壳虫，身体第一次不是黑箱它在说话。',
      'Excel记录每天补剂睡眠心率运动，室友说你走火入魔了。',
    ]},
    { ageRange: [26, 30], texts: [
      '体检报告生理年龄小5岁，不知道是补剂还是运动但方向对了。',
      '投的生物公司倒闭损失八万，心疼一周，告诉自己是赛道不是个股。',
      '长寿论坛上一群和你一样的人，都是拿自己身体做实验的人。',
      '每天三十秒冷水澡前两周都在浴室尖叫，告诉自己在激活褐色脂肪。',
      '在自己身上测试补剂组合和禁食方案，你等不了十年临床试验。',
    ]},
    { ageRange: [31, 35], texts: [
      'AI制药加速了研发，你预估的突破时间可能要提前，加仓了。',
      '伴侣说"你天天想活100岁，但今天都没过好"，这话戳到了你。',
      '第一次同龄人突发疾病走了，葬礼回来你更加坚定也更加恐惧。',
      '体检指标好得医生反复问你是不是职业运动员。',
      '长寿社群做科普有人骂你补剂推销员，你只是想让更多人看到这条路。',
    ]},
    { ageRange: [36, 45], texts: [
      '第一个抗衰老疗法获批上市了，不是你投的公司但比谁都兴奋。',
      '生物年龄小8岁，40岁身体32岁器官，投资翻了十几倍不敢太高兴。',
      '如果人真活到150岁退休意味着什么？也许是第二段人生起点。',
      '补剂从二十几种精简到六种，真正有效的东西不需要那么多。',
      '基因编辑公司二期临床股价月涨三倍没卖，你买的是通往未来的船票。',
      '开始认真练力量不只是有氧，在健身房举铁觉得在和时间拔河。',
    ]},
    { ageRange: [46, 50], texts: [
      '第一批抗衰老疗法来了，不是仙丹是衰老细胞清除和基因编辑。',
      '生物年龄小12岁，50岁身体38岁血管35岁心肺，那些冷水澡也许值了。',
      '你注册了第一个临床试验，填表时手有点抖，护士说"你看起来不像需要"。',
      '你开始规律的跑马拉松，不是比赛，是给这个"年轻的身体"交作业。',
      '你清掉了大部分补剂，留下的只有睡眠、运动和少吃的铁律。',
    ]},
    { ageRange: [51, 55], texts: [
      '从追求"活多久"转向"活多好"，卧病在床三十年不是你要的。',
      '孩子问需不需要吃补剂，你说好好吃饭睡觉运动少焦虑比什么都强。',
      '你的抗衰社群办到第十年，有人退休了，有人还在，你来者不拒。',
      '体检医生看着你的报告自言自语"这个年龄不该有这种数据"，你笑了笑。',
      '你开始写"如何老去"的日记，不是给后代，是给未来的自己。',
    ]},
    { ageRange: [56, 60], texts: [
      '长寿论坛线下聚会当年聊NMN的年轻人都五六十了，看起来年轻十到十五岁。',
      '如果真活150岁多出来的岁月怎么过？答案在变但不虚度。',
      '孙子出生那天你决定戒烟戒酒，虽然你早就不沾了，但仪式感得有。',
      '你站在镜子前，遗憾自己没更早开始，也庆幸自己开始得不算太晚。',
      '你学会了一件事：延长的是生命的长度，但宽度得自己填。',
    ]},
  ],

  sideHustleMonologues: [
    { ageRange: [22, 25], texts: [
      '白天上班晚上搜PubMed，书桌堆满补剂瓶室友以为你在考研。',
      '四成积蓄投了生物科技股，白天偷看重仓公司临床数据握紧拳头。',
      '生物年龄检测小3岁，不确定是补剂还是机构哄你还是存了截图。',
      '工位偷刷论文像追更小说，雷帕霉素小鼠延寿25%满脑子"要是真的"。',
      '写抗衰科普从一个读者到一百个，有人问是不是在卖补剂你没有。',
    ]},
    { ageRange: [26, 30], texts: [
      '生物投资翻了三倍还在上班，不清仓等的是更大的突破。',
      '白天开会读预印本晚上设计抗衰方案，公司那半越来越像浪费时间。',
      '论坛群里有人说"我们像在偷偷准备没人相信的考试"，比喻真准。',
      '第一次全套生物标志物检测花三千，一半术语看不懂回去翻论文。',
      '投资像过山车学会看年线不看日线，像学会看体脂不看体重。',
    ]},
    { ageRange: [31, 35], texts: [
      '投资组合远超工资积累，重仓公司被溢价收购够不工作三年还在上班。',
      '同事聊房贷学区你聊NAD+和mTOR，他们觉得你魔怔你有时也觉得。',
      '伴侣说你研究活150岁但今天都没过好，你在牺牲现在换未来。',
      '长寿社群小有名气有人付费咨询，请病假其实在给客户做抗衰方案。',
      '建了健康数据dashboard，同事问是业务数据吗你说差不多——是你自己的命。',
    ]},
    { ageRange: [36, 45], texts: [
      '37岁还在上班但生物投资是年薪二十倍，同事聊养老金你想退休这个词可能不存在。',
      '42岁辞职，心脏检查出异常让你重新审视时间，要下场近距离参与这个行业。',
      '39岁才系统投生物科技比22岁All In晚17年，但你有资本有判断力，长坡厚雪不怕晚。',
    ]},
  ],

  faithCrisisMonologues: [
    '朋友走了，他比你还年轻两岁，补剂瓶在他桌上还没开盖。',
    '伴侣说"你想着活100岁但今天都没过好"，你摔了筷子。',
    '肝功能异常，医生说可能和补剂有关，你把药瓶倒进垃圾桶第二天捡回来。',
    '重仓公司三期临床失败股价日跌七成，你开了威士忌坐到凌晨三点。',
    '深夜醒了刷论文，黑屏映出憔悴偏执的脸，你问自己是不是疯了。',
  ],

  checkSuccess: (state) => {
    const bioPortfolio = (state as any).bioPortfolio || 0;
    // 成功（v19校准：从120万降到100万，配合高波动路径收敛到60；健康门槛45保持）
    // 生物投资>=100万 且 健康>=45 且 信念>=40 且 年龄>=36
    return bioPortfolio >= 1000000 && state.health >= 45 && state.pathFaith >= 40 && state.currentAge >= 36;
  },

  successTitle: '明日世界',
  successEnding: (state) => {
    return `${state.currentAge}岁。第一个真正意义上的抗衰老疗法进入临床。你不是第一批受试者，但你知道这只是开始。\n\n投资组合翻了几十倍，身体比同龄人年轻十岁，你有足够筹码等技术完全成熟。但最让你安心的不是这些——是你终于学会了今天好好吃饭好好睡觉。\n\n那些临床失败股票暴跌的夜晚、肝功能异常的体检报告、伴侣摔门而去的时刻、深夜对着镜子问自己是不是疯了的瞬间——它们都在你身上留下了什么。\n\n你倒了一杯红酒（白藜芦醇，你笑了），打开最新的论文预印本。窗外阳光很好，你没有急着读。你先喝了一口酒，感受它在嘴里的味道。今天是活着的。这就够了。`;
  },

  failureTitle: '向死而生',
  failureEnding: (state) => {
    return `${state.currentAge}岁你停用了所有补剂，清掉了生物科技仓位。\n\n不是不信了，是等不起了。技术进展比预期慢，存款撑不到那一天。\n\n你把药盒清空了，最后一粒NMN你拿在手里看了很久，然后放进了抽屉。窗外阳光很好，你突然觉得饿了——这是很多年来第一次不看表吃饭。\n\n你比任何人都认真地活过每一天。早睡早起坚持运动定期体检，这些习惯没有白费。你没等到技术突破，但你比谁都清楚：活着不是为了等那个突破，活着本身就是目的。\n\n药盒是空的，桌上有一碗面，窗外阳光很好。`;
  },

  targetRetireAge: 48,
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
      // 软技能（自我觉察/共情力）提升AI内容质量和客户理解力，间接影响收入
      const selfAwareness = skills.selfAwareness || 0;
      const empathy = skills.empathy || 0;
      // 提高系数：满技能时月入约 100*50+100*30+100*15+50*8+50*8+500 ≈ 10800
      return Math.round(aiSkill * 50 + promptMastery * 30 + aiTraining * 15 + selfAwareness * 8 + empathy * 8 + 500);
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
      // v13提高系数和基础值：美元时薪×汇率折算，满技能月入可达 100*60+100*35+100*25+1000 = 13000
      return Math.round(remoteSkill * 60 + languageSkill * 35 + crossCulturalSkill * 25 + 1000);
    }
    case 'super_ip': {
      // IP副业：广告、付费社群、知识付费（粉丝变现是核心）
      const followers = (state as any).ipFollowers || 0;
      const reputation = (state as any).ipReputation || 0;
      const contentSkill = skills.contentSkill || 0;
      const brandSkill = skills.brandSkill || 0;
      // v13提高粉丝/声誉系数和基础值：万粉×声誉45/150 = 3000，加上技能收入，满技能可达更高
      return Math.round(followers * reputation / 150 + contentSkill * 35 + brandSkill * 40 + 500);
    }
    case 'silver_economy': {
      // 银发副业：周末上门照护、社区服务
      // 基础是月营收，但技能加成会提升服务溢价
      const biz = (state as any).silverBusiness;
      const careSkill = skills.careSkill || 0;
      const managementSkill = skills.managementSkill || 0;
      const policySkill = skills.policySkill || 0;
      const baseRevenue = biz ? biz.monthlyRevenue : 500;
      // 技能带来的服务溢价：每点技能提升1%收入（政策技能影响补贴和合规效率）
      const skillBonus = 1 + (careSkill + managementSkill + policySkill * 0.5) * 0.01;
      return Math.round(baseRevenue * skillBonus);
    }
    case 'bio_gambler': {
      // 生物副业：健康咨询、长寿社群付费、科普写作
      const bioKnowledge = skills.bioKnowledge || 0;
      const healthOptSkill = skills.healthOptSkill || 0;
      // v13提高系数：专业知识变现能力增强，满技能月入可达 100*40+100*35+500 = 8000
      return Math.round(bioKnowledge * 40 + healthOptSkill * 35 + 500);
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
  if (state.isUnemployed) return false; // 失业状态下不触发All In（叙事上"辞职"不成立）

  // 信念条件（阈值90：与 narrative-allin.ts 文档一致。
  // 此前误设为95，而实际游戏中信念值长期积累多卡在90附近，导致副业为主的
  // 安全路径（AI/IP/游牧/银发）几乎无法触发All In，解锁不了大额突破事件，
  // 成功率被压到11-15%，而链上/生物因自有资产增长反而更高，平衡倒挂。）
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
    // All In阈值40万（All In后×2+2万=82万，再靠16%年增长约3-4年达150万成功线）
    if (bioPortfolio >= 400000) return true;
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
 * - 银发守夜人：职业→实体创业，城市→避风低洼地，生活成本降低，薪资=银发生意月营收
 * - 生物赌徒：职业→自由职业，薪资=副业收入（咨询/写作），主要靠投资收益
 */
export function applyAllIn(state: GameState): void {
  if (!state.retirementPath || state.isAllInPath) return;

  const sideIncome = getPathSideIncome(state);
  const prevSalary = state.currentMonthlySalary;
  state.isAllInPath = true;

  // All In 后清除失业状态（玩家可能是在失业期间通过信念值达到阈值触发All In）
  state.isUnemployed = false;
  state.unemployedTurns = 0;
  state.totalUnemployedYears = state.totalUnemployedYears || 0; // 保留历史记录

  // All In 后保底收入：不低于原主业薪资的 80%，避免收入断崖导致现金流断裂
  // 若原薪资为0（失业状态触发），使用 preUnemployedSalary 作为参考
  const salaryBase = prevSalary > 0 ? prevSalary : (state.preUnemployedSalary || 8000);
  const minGuarantee = Math.max(Math.round(salaryBase * 0.8), 5000);

  switch (state.retirementPath) {
    case 'ai_symbiote': {
      state.currentProfession = '自由职业';
      state.currentMonthlySalary = Math.max(Math.round(sideIncome * 1.2), minGuarantee, 3000);
      state.careerStartSalary = state.currentMonthlySalary;
      // All In被动收入跃升（v16平衡：10000→5000，防止过高的×20资本化导致85%成功率）
      state.passiveIncome = (state.passiveIncome || 0) + 5000;
      break;
    }
    case 'chain_native': {
      state.currentProfession = '自由职业';
      state.currentMonthlySalary = Math.max(sideIncome, minGuarantee, 2000);
      state.careerStartSalary = state.currentMonthlySalary;
      // 加密资产不靠被动收入，全职后更专注交易，持仓自然增长
      // 规模递减效应：持仓越大，All In带来的边际提升越小
      const curHoldings = (state as any).chainHoldings || 0;
      (state as any).chainHoldings = applyChainHoldingScale(curHoldings, 1.3);
      break;
    }
    case 'digital_nomad': {
      state.currentProfession = '自由职业';
      // 数字游民：远程接单赚发达地区的收入，住在低成本地区——
      // 不通过switchCity降薪（远程收入不受当地薪资水平影响），只切换城市和成本系数
      state.currentMonthlySalary = Math.max(Math.round(sideIncome * 1.5), minGuarantee, 5000);
      state.careerStartSalary = state.currentMonthlySalary;
      state.currentCity = '海外低成本';
      state.isGeoArbitrage = true;
      // All In被动收入跃升（v16平衡：10000→6000，配合门槛×1.5）
      state.passiveIncome = (state.passiveIncome || 0) + 6000;
      break;
    }
    case 'super_ip': {
      state.currentProfession = '自由职业';
      state.currentMonthlySalary = Math.max(Math.round(sideIncome * 1.3), minGuarantee, 3000);
      state.careerStartSalary = state.currentMonthlySalary;
      // All In被动收入跃升：全职后广告/课程/会员收入跃升（v15再降：10000→8000）
      state.passiveIncome = (state.passiveIncome || 0) + 8000;
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
      // 养老是实体生意，走营收：全职投入后客户增长（同步更新silverBusiness.monthlyRevenue以影响checkSuccess）
      const silverRev = (state as any).silverMonthlyRevenue || (biz ? biz.monthlyRevenue : 0);
      // v16.2：All In加成从0.6+6500回调到0.5+5000，抑制银发过快成功
      const silverBonus = Math.round(silverRev * 0.5 + 5000);
      (state as any).silverMonthlyRevenue = silverRev + silverBonus;
      if (biz) {
        biz.monthlyRevenue = biz.monthlyRevenue + silverBonus;
      }
      break;
    }
    case 'bio_gambler': {
      state.currentProfession = '自由职业';
      state.currentMonthlySalary = Math.max(sideIncome, minGuarantee, 2000);
      state.careerStartSalary = state.currentMonthlySalary;
      // All In被动收入跃升：抗衰咨询/科普写作
      state.passiveIncome = (state.passiveIncome || 0) + 8000;
      // 全职研究后投资组合跃升（v16：×2.0+2万 → ×2.2+3万，助力120万门槛）
      const bioPort = (state as any).bioPortfolio || 0;
      (state as any).bioPortfolio = Math.round(bioPort * 2.2 + 30000);
      break;
    }
  }
}
