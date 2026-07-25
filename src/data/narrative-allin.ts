/**
 * All In 转折事件 · 6条路径
 *
 * 当满足以下任一条件时触发（年龄门槛：27岁，至少5年副业积累）：
 *   1. 副业月收入 >= 主业月薪×1.2
 *   2. 信念值 >= 90
 *   3.（投资型路径）链上资产/生物组合 >= 年支出×5
 *
 * 玩家可以选择：
 *   - All In：辞职，全力投入路径（职业/城市/薪资变化）
 *   - 继续：保持副业状态（压力增加，但稳定）
 *
 * 每条路径的 All In 都是一段独立的辞职叙事。
 * ================================================================
 */
import type { NarrativeEvent, GameState } from '../types/global.d.js';
import { registerNarrativeEvents } from './narrative-registry.js';
import { canAllIn, applyAllIn } from './retirement-paths.js';
import { clamp } from '../utils/clamp.js';

const allInEvents: NarrativeEvent[] = [

  // ============================================================
  // AI共生者 · All In
  // ============================================================
  {
    id: 'allin_ai_symbiote',
    title: '辞职信',
    pathId: 'ai_symbiote',
    ageRange: [27, 50],
    priority: 10,
    weight: 100,
    oncePerGame: true,
    eventType: 'milestone',
    sceneTag: 'breakthrough',
    conditions: (s: GameState) => canAllIn(s),
    narrative:
      '你坐在工位上，手边是一封写了三遍的辞职信。\n' +
      '你的AI副业收入这个月第一次超过了主业工资。不是超了一点——是翻倍。你的客户排队等你出方案，你的提示词模板被人当教程传，你做的AI自动化流程帮一家公司省了三个人力。\n' +
      '组长走过来拍你肩膀："最近状态不错啊，要不要考虑升职？"你笑了笑，没回答。升职？你的副业一个月赚的比他一年都多。\n' +
      '但你犹豫的不是钱。你犹豫的是：一旦辞职，就没有退路了。社保断了、公积金没了、年终奖飞了。你的父母会问你"好好的工作为什么要辞"。你的同事会用一种"你疯了吧"的眼神看你。\n' +
      '可你心里清楚：你再也回不去那个"正常上班"的状态了。你的脑子已经被AI重塑了，你看待问题的方式、解决问题的效率、甚至思考的维度，都和三个月前不一样了。\n' +
      '你打开辞职信的最后一行，上面写着："感谢公司三年的培养。"你删掉了这行，改成："我准备好了。"',
    options: [
      {
        id: 'all_in',
        label: 'All In — 辞职，全力做AI',
        description: '交辞职信，把所有时间投入到AI事业中。没有退路，只有向前。',
        hint: '职业→自由职业 · 薪资基于AI技能 · 信念+15 · 压力+10 · 幸福+8',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          const beforeSalary = s.currentMonthlySalary;
          applyAllIn(s);
          const afterSalary = s.currentMonthlySalary;
          s.stress = clamp(s.stress + 10, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 15, 0, 100);
          s.lifeLog.push(`你递交了辞职信。组长愣了三秒，问你"想好了？"你说"想了三年了"。走出公司大门那天阳光很好，你深吸一口气——从今天起，你的时间只属于你自己。月薪从${beforeSalary}变为${afterSalary}，但你第一次觉得：钱不是最重要的，自由才是。`);
        },
        log: '你递交了辞职信。从今天起，你是一个全职的AI自由职业者。没有退路，只有向前。',
      },
      {
        id: 'stay',
        label: '再等等，稳一手',
        description: '继续白天上班晚上做AI。虽然累，但至少有两份收入。',
        hint: '压力+8 · 信念-5 · 但保持双份收入',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
          s.lifeLog.push(`你把辞职信收进了抽屉。组长问你"考虑得怎么样了"，你说"再想想"。其实你已经想好了——只是还没鼓起勇气。你继续白天上班、晚上做AI，两份收入让你存款涨得很快，但你的身体开始发出警告。`);
        },
        log: '你收起了辞职信。双线作战很累，但两份收入让你感到安全。你知道这个决定迟早要做。',
      },
    ],
  },

  // ============================================================
  // 链上原住民 · All In
  // ============================================================
  {
    id: 'allin_chain_native',
    title: '最后一根K线',
    pathId: 'chain_native',
    ageRange: [27, 50],
    priority: 10,
    weight: 100,
    oncePerGame: true,
    eventType: 'milestone',
    sceneTag: 'breakthrough',
    conditions: (s: GameState) => canAllIn(s),
    narrative:
      '凌晨三点，你盯着屏幕上的K线，手边是一罐已经温掉的能量饮料。\n' +
      '你的链上资产今天又涨了12%。你算了一下：如果现在清仓，你能拿到相当于你打工十年的钱。但你不会清仓——你信的不是这一根K线，你信的是这条链。\n' +
      '白天在公司开会的时候，你满脑子都是你参与开发的那个DeFi协议。你的代码在链上跑着，每天处理着几百万美金的交易量——而你白天还在格子间里写周报。这种撕裂感越来越强。\n' +
      '你在Telegram群里看到一条消息：你关注的那个DAO在招全职贡献者，年薪以稳定币支付，是你现在工资的两倍。而且——完全远程，不用打卡，不用周报，不用看任何人的脸色。\n' +
      '你盯着那条消息看了很久。你知道这不是一个普通的选择。辞掉主业意味着你把所有筹码都压在了"去中心化"这条路上。如果链上世界崩塌，你连饭都吃不上。但如果它成功——你已经看到了那个未来。\n' +
      '你打开了辞职邮件的草稿。',
    options: [
      {
        id: 'all_in',
        label: 'All In — 辞职，住到链上去',
        description: '交辞职信，全职投入链上世界。你的资产、你的技能、你的未来，全在链上。',
        hint: '职业→自由职业 · 薪资基于DeFi技能 · 信念+15 · 压力+12 · 幸福+5 · 风险极高',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          const beforeSalary = s.currentMonthlySalary;
          applyAllIn(s);
          const afterSalary = s.currentMonthlySalary;
          s.stress = clamp(s.stress + 12, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 15, 0, 100);
          s.lifeLog.push(`你发了辞职邮件，然后在公司群里留了一句"Going full-time crypto"。有人回了个🚀，有人回了个💀。你笑了笑关掉手机——从今天起，你的收入不再来自任何公司，而是来自代码、协议和链上的每一笔交易。月薪从${beforeSalary}变为${afterSalary}，但你真正的赌注是那串链上资产。`);
        },
        log: '你成了全职链上人。没有公司、没有老板、没有打卡——只有链上地址、私钥和行情。',
      },
      {
        id: 'stay',
        label: '稳住，工资是最后的防线',
        description: '继续白天上班晚上看盘。工资是你的稳定币，链上资产是你的赌注。',
        hint: '压力+6 · 信念-5 · 工资+链上双保险',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
          s.lifeLog.push(`你关掉了辞职邮件的草稿。你对自己说"再等等"——等下一个牛市，等资产再翻一倍，等时机更成熟。你继续白天上班、晚上看盘，工资是你的稳定币，链上资产是你的赌注。但你知道，每多等一天，你就多浪费一天本可以All in的时间。`);
        },
        log: '你选择了等待。工资是安全网，链上是赌注。你在两个世界之间走钢丝。',
      },
    ],
  },

  // ============================================================
  // 数字游牧民 · All In
  // ============================================================
  {
    id: 'allin_digital_nomad',
    title: '单程票',
    pathId: 'digital_nomad',
    ageRange: [27, 50],
    priority: 10,
    weight: 100,
    oncePerGame: true,
    eventType: 'milestone',
    sceneTag: 'breakthrough',
    conditions: (s: GameState) => canAllIn(s),
    narrative:
      '你的登机箱就放在工位旁边。同事以为你要出差，其实里面装着你全部的生活——一台笔记本、三件T恤、一个充电器。\n' +
      '你的海外远程收入已经连续三个月超过主业了。你手里有三个长期客户，每一个都希望你全职合作。你算过账：如果辞职，你的远程收入不仅能覆盖生活开销，还能让你住在清迈或者巴厘岛——那里的物价只有这里的三分之一。\n' +
      '但真正让你下定决心的不是钱。是上个月你请了五天年假去清迈，在共享空间工作了一周。你发现自己在那里效率更高、心情更好、甚至比在公司更"像你自己"。回国的飞机上你一直在想：为什么我要回到那个格子间？\n' +
      '今天HR发了一封邮件，让你更新年度个人信息。你看着"入职日期"那一栏——三年前。三年了，你一直在过双重生活：白天是员工，晚上是数字游民。现在是时候选一个了。\n' +
      '你打开订票软件，搜了一张去清迈的单程票。日期选在了下个月一号。',
    options: [
      {
        id: 'all_in',
        label: 'All In — 辞职，买那张单程票',
        description: '递交辞职信，收拾行李，飞往低成本国家。你的生活成本减半，你的自由翻倍。',
        hint: '职业→自由职业 · 城市→海外低成本 · 生活成本-50% · 薪资基于远程技能 · 信念+15 · 压力+8 · 幸福+12',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          const beforeSalary = s.currentMonthlySalary;
          const beforeCity = s.currentCity;
          applyAllIn(s);
          const afterSalary = s.currentMonthlySalary;
          s.stress = clamp(s.stress + 8, 0, 100);
          s.happiness = clamp(s.happiness + 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 15, 0, 100);
          s.lifeLog.push(`你递了辞职信，买了去清迈的单程票。落地那天是雨季，空气湿得能拧出水。你在青旅办入住时前台小哥问你"住几天"，你说"不知道"——那是你这辈子说过最自由的三个字。月薪从${beforeSalary}变为${afterSalary}，但你的月支出也降了一半。从${beforeCity}到海外，你终于成了真正的数字游民。`);
        },
        log: '你成了真正的数字游民。一个登机箱，一台笔记本，全世界都是你的办公室。',
      },
      {
        id: 'stay',
        label: '再攒一年，多存点缓冲金',
        description: '不急。再干一年，多攒点钱，明年再走也不迟。',
        hint: '压力+6 · 信念-8 · 但存款继续增长',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 8, 0, 100);
          s.lifeLog.push(`你关掉了订票软件。你说"再攒一年"——但你知道，"再等一年"是一个无底洞。每多等一年，你的存款会多一点，但你的勇气会少一点。你的登机箱在床底落了灰，你的远程客户还在等你回复。你回了一封邮件："抱歉，暂时无法全职合作。"`);
        },
        log: '你选择了等待。登机箱收进了柜子，单程票换成了往返票。你还在两个世界之间摇摆。',
      },
    ],
  },

  // ============================================================
  // 超级IP · All In
  // ============================================================
  {
    id: 'allin_super_ip',
    title: '下播之后',
    pathId: 'super_ip',
    ageRange: [27, 50],
    priority: 10,
    weight: 100,
    oncePerGame: true,
    eventType: 'milestone',
    sceneTag: 'breakthrough',
    conditions: (s: GameState) => canAllIn(s),
    narrative:
      '直播结束，你关掉补光灯，瘫在椅子上。屏幕上的在线人数从峰值的三万慢慢归零，弹幕还在飘——"下次什么时候播""太有收获了""已三连"。\n' +
      '你打开后台看了一眼这个月的收入：广告费、打赏、知识付费课程销售——加起来是你主业工资的两倍还多。你的粉丝数已经突破了十万，声誉值在行业里数一数二。有品牌方直接找你谈年框合作，报价是你年薪的三倍。\n' +
      '但你还在上班。每天上午开那些和你无关的会，下午处理那些谁都能做的活，晚上回家才能做你真正想做的事。你的内容质量在下降——不是因为你江郎才尽，是因为你没有足够的精力。\n' +
      '你的搭档在微信上问你："你到底什么时候辞职？你的粉丝在等你，你的品牌在等你，你的事业在等你。你一个人分成两半，哪半都做不好。"\n' +
      '你盯着这句话看了很久。你知道TA是对的。但你怕——怕辞了职之后，没有人给你交社保，没有人给你定闹钟，没有人告诉你"今天该做什么"。自由是可怕的，因为你必须为自己的一切选择负责。\n' +
      '但你也知道：如果不迈出这一步，你永远只是一个"做内容的打工人"，而不是一个真正的超级IP。',
    options: [
      {
        id: 'all_in',
        label: 'All In — 辞职，成为全职创作者',
        description: '交辞职信，把所有精力投入到内容创作和个人品牌中。你就是你的公司。',
        hint: '职业→自由职业 · 薪资基于IP变现 · 信念+15 · 压力+8 · 幸福+10',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          const beforeSalary = s.currentMonthlySalary;
          applyAllIn(s);
          const afterSalary = s.currentMonthlySalary;
          s.stress = clamp(s.stress + 8, 0, 100);
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 15, 0, 100);
          s.lifeLog.push(`你递了辞职信。组长问你"去做什么"，你说"去做我自己"。走出公司那天你拍了一条短视频："从今天起，我是一个全职创作者。"评论区炸了——有人祝福，有人质疑，有人说"你疯了"。你笑了笑。月薪从${beforeSalary}变为${afterSalary}，但你第一次觉得：你的名字本身就是一家公司。`);
        },
        log: '你成了全职创作者。你的内容、你的品牌、你的名字——就是你的全部资产。',
      },
      {
        id: 'stay',
        label: '不急，先把粉丝做到五十万',
        description: '继续白天上班晚上做内容。等粉丝更多了、收入更稳了再辞职。',
        hint: '压力+8 · 信念-6 · 但双份收入继续',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 6, 0, 100);
          s.lifeLog.push(`你回复搭档："再等等。"TA发了一个叹气的表情。你知道TA的意思——你在浪费时间。每多上一天班，你就少做一条内容，少回一条评论，少陪一次粉丝。你说"先把粉丝做到五十万"，但你自己都知道：这只是一个借口。真正拦住你的不是数字，是恐惧。`);
        },
        log: '你选择了等待。但你知道，每多上一天班，你就离真正的超级IP远一步。',
      },
    ],
  },

  // ============================================================
  // 银发收割者 · All In
  // ============================================================
  {
    id: 'allin_silver_economy',
    title: '最后一班高铁',
    pathId: 'silver_economy',
    ageRange: [27, 50],
    priority: 10,
    weight: 100,
    oncePerGame: true,
    eventType: 'milestone',
    sceneTag: 'breakthrough',
    conditions: (s: GameState) => canAllIn(s),
    narrative:
      '周日晚上十点半，你坐在回城的高铁上，窗外是飞速后退的黑暗。\n' +
      '你的周末养老站现在有二十三个固定客户，月营收已经超过了你的主业工资。民政局的人上周来考察过，说你的模式"有推广价值"，问你要不要正式注册一个服务机构。你爸中风后恢复得不错，现在每天在你的养老站帮忙——他说"闲着也是闲着"。\n' +
      '但你还在上班。每个周五下班你赶最后一班高铁回老家，周日晚上再赶回来。周一到周五你在写字楼里敲键盘，心却在老家那个挂着"社区养老服务站"牌子的小门面。你的同事不知道你周末在做什么，你的客户不知道你平时在上班。你活得像两个人。\n' +
      '今天你妈在站台上送你，说了一句："你要是能回来就好了。"你没回答，只是上了车。现在你坐在车厢里，手机里是民政局发来的注册材料清单，旁边是一封没写完的辞职信。\n' +
      '你知道，如果你辞职回老家做养老，你的同学会说你"想不开"，你妈的亲戚会说你"白读了大学"。但你也知道——那个挂着锦旗的小门面，那些拉着你的手叫"小X"的老人，那个你需要亲手建立的事业——它们在等你。\n' +
      '高铁到站了。你站起来，拎起行李箱。这一次，你没有走向出站口的方向——你走向了退票窗口。',
    options: [
      {
        id: 'all_in',
        label: 'All In — 辞职回老家，把养老做成事业',
        description: '退掉返程票，递交辞职信，回老家注册服务机构。这条路没人走过，但你看得到终点。',
        hint: '职业→实体创业 · 城市→避风低洼地 · 生活成本-40% · 薪资基于养老生意 · 信念+15 · 压力+10 · 幸福+6',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          const beforeSalary = s.currentMonthlySalary;
          const beforeCity = s.currentCity;
          applyAllIn(s);
          const afterSalary = s.currentMonthlySalary;
          s.stress = clamp(s.stress + 10, 0, 100);
          s.happiness = clamp(s.happiness + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 15, 0, 100);
          s.lifeLog.push(`你退掉了返程票。周一你递了辞职信，周五你就站在了老家那个小门面前。你把"社区养老服务站"的牌子换成了正式注册的公司铭牌。你妈站在门口看着你，嘴上说"你这是何苦"，眼眶却红了。月薪从${beforeSalary}变为${afterSalary}，从${beforeCity}回到避风低洼地——你终于不再是一个"周末养老人"了。`);
        },
        log: '你退了返程票，辞了职，回了老家。从此你的全部身心都投入到了那间养老站。',
      },
      {
        id: 'stay',
        label: '再熬两年，多攒点启动资金',
        description: '继续两地奔波。等存款再多一点、客户再多一点，再辞职也不迟。',
        hint: '压力+10 · 信念-8 · 但工资+养老双收入',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 8, 0, 100);
          s.lifeLog.push(`你走向了出站口。退票窗口的灯在你身后慢慢变远。你对自己说"再熬两年"——但你心里清楚，两地奔波正在榨干你。你的身体在抗议，你的客户在等你，你爸站在养老站门口等你回来。每多一个周末，你就多消耗一份精力，少陪伴一天那些需要你的人。`);
        },
        log: '你继续两地奔波。高铁票攒了一抽屉，但你知道这条路走不了太久。',
      },
    ],
  },

  // ============================================================
  // 生物赌徒 · All In
  // ============================================================
  {
    id: 'allin_bio_gambler',
    title: '实验室的灯',
    pathId: 'bio_gambler',
    ageRange: [27, 50],
    priority: 10,
    weight: 100,
    oncePerGame: true,
    eventType: 'milestone',
    sceneTag: 'breakthrough',
    conditions: (s: GameState) => canAllIn(s),
    narrative:
      '你站在实验室走廊的尽头，透过玻璃窗看着里面忙碌的研究员。他们穿着白大褂，操作着你不被允许碰的设备。\n' +
      '你的生物科技投资组合在过去两年翻了四倍。你重仓的那家做NAD+前体的公司刚拿到了二期临床的积极数据，你押注的基因疗法平台被某大药厂溢价收购了。你的账面收益已经远超你打工十年的积蓄。\n' +
      '但让你想辞职的不是钱。是上周那篇预印本论文——一种新的表观遗传重编程方法，在小鼠身上实现了"部分返老还童"。你读到的时候手在抖。你知道这项技术从实验室到临床还有很长的路，但你比任何人都清楚：它正在加速。\n' +
      '白天上班的时候你在想：如果这项技术五年内进入人体试验，你需要做什么？你需要更深入地参与这个领域——不是作为投资者，而是作为真正的参与者。你需要时间去学习、去实验、去和研究员对话、去参加每一个重要的学术会议。\n' +
      '你的生物年龄检测显示你比实际年龄年轻6岁。你的身体是你的筹码，你的知识是你的杠杆，你的投资组合是你的弹药。但你把它们全压在了一份朝九晚五的工作之外。\n' +
      '你的伴侣说："你天天研究活到150岁，但你连今天都不开心。"你说："因为我在浪费时间。在这里的每一分钟，我都不在实验室里。"',
    options: [
      {
        id: 'all_in',
        label: 'All In — 辞职，全力投入长寿事业',
        description: '辞掉主业，把所有时间投入到抗衰研究、投资和自体实验中。你在和时间赛跑。',
        hint: '职业→自由职业 · 薪资基于咨询/写作 · 信念+15 · 压力+10 · 幸福+5 · 健康+5',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          const beforeSalary = s.currentMonthlySalary;
          applyAllIn(s);
          const afterSalary = s.currentMonthlySalary;
          s.stress = clamp(s.stress + 10, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 15, 0, 100);
          s.health = clamp(s.health + 5, 0, 100);
          s.lifeLog.push(`你递了辞职信。同事问你"去哪高就"，你说"去活久一点"。从今天起，你的全部时间都属于抗衰事业——研究论文、管理投资组合、自体实验、参加学术会议。月薪从${beforeSalary}变为${afterSalary}，但你的真正资产是那串生物科技投资组合和比你实际年龄年轻6岁的身体。你在和时间赛跑，而时间是你唯一的对手。`);
        },
        log: '你成了全职的长寿赌徒。你的筹码是身体、知识和投资组合，你的赌注是人类的极限寿命。',
      },
      {
        id: 'stay',
        label: '继续业余研究，保住现金流',
        description: '不辞职。继续白天上班、晚上研究。至少工资能让你慢慢加仓。',
        hint: '压力+5 · 信念-6 · 但有稳定现金流',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 6, 0, 100);
          s.lifeLog.push(`你收回了目光。走廊尽头的玻璃窗映着你的脸——一张比实际年龄年轻的脸，但带着一丝疲惫。你说"再等等"——等下一个临床数据，等投资组合再涨一波，等时机更成熟。但你知道，时间是你最输不起的东西。每多上一天班，你就少一天研究抗衰的时间——而你在赌的，恰恰是时间本身。`);
        },
        log: '你选择了继续。工资是安全网，但你在和时间赛跑——而时间不等人。',
      },
    ],
  },
];

registerNarrativeEvents(allInEvents);
