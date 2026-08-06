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
import { fmtExact } from '../utils/format.js';

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
      '你的AI副业收入这个月第一次超过主业工资——不是超了一点，是翻倍。组长拍你肩膀："要不要考虑升职？"你笑了笑。你犹豫的不是钱，是社保、公积金、年终奖，是父母那句"好好的工作为什么要辞"。\n' +
      '可你知道你再也回不去那个"正常上班"的状态了——你的脑子已经被AI重塑。你打开辞职信，删掉"感谢公司三年的培养"，改成："我准备好了。"',
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
          s.lifeLog.push(`你递交了辞职信。组长愣了三秒，问你"想好了？"你说"想了三年了"。走出公司大门那天阳光很好，你深吸一口气——从今天起，你的时间只属于你自己。月薪从${fmtExact(beforeSalary)}变为${fmtExact(afterSalary)}，但你第一次觉得：钱不是最重要的，自由才是。`);
        },
        log: '你递交了辞职信。从今天起，你是一个全职的AI自由职业者。没有退路，只有向前。',
        blindBoxTrigger: 'ai_all_in_product',
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
      '凌晨三点，你盯着屏幕上的K线，手边是一罐温掉的能量饮料。你的链上资产今天又涨了12%——清仓就能拿到打工十年的钱，但你不清仓：你信的不是K线，是这条链。\n' +
      '白天写周报时，你想的是自己那个DeFi协议，每天处理几百万美金的交易量。Telegram里那个DAO在招全职贡献者，年薪以稳定币支付、是你工资的两倍，还完全远程。你清楚辞掉主业就是把所有筹码押在"去中心化"上，可你盯着那条消息，打开了辞职邮件的草稿。',
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
          s.lifeLog.push(`你发了辞职邮件，然后在公司群里留了一句"Going full-time crypto"。有人回了个🚀，有人回了个💀。你笑了笑关掉手机——从今天起，你的收入不再来自任何公司，而是来自代码、协议和链上的每一笔交易。月薪从${fmtExact(beforeSalary)}变为${fmtExact(afterSalary)}，但你真正的赌注是那串链上资产。`);
        },
        log: '你成了全职链上人。没有公司、没有老板、没有打卡——只有链上地址、私钥和行情。',
        blindBoxTrigger: 'chain_all_in',
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
      '行李箱放在工位旁边，同事以为你要出差，里面装着你全部的生活——一台笔记本、三件T恤、一个充电器。你的远程收入已连续三个月超过主业，去大理住共享空间那一周，你第一次觉得自己"像自己"。\n' +
      '回程的高铁上你一直在想：为什么我要回到那个格子间？HR让你更新年度个人信息，你看着"入职日期"——三年前。你一直在过双重生活，现在是时候选一个了。你搜了一张去大理的单程票，日期选在下个月一号。',
    options: [
      {
        id: 'all_in',
        label: 'All In — 辞职，买那张单程票',
        description: '递交辞职信，收拾行李，去低成本城市。你的生活成本减半，你的自由翻倍。',
        hint: '职业→自由职业 · 城市→低成本城市 · 生活成本-50% · 薪资基于远程技能 · 信念+15 · 压力+8 · 幸福+12',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          const beforeSalary = s.currentMonthlySalary;
          const beforeCity = s.currentCity;
          applyAllIn(s);
          const afterSalary = s.currentMonthlySalary;
          s.stress = clamp(s.stress + 8, 0, 100);
          s.happiness = clamp(s.happiness + 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 15, 0, 100);
          s.lifeLog.push(`你递了辞职信，买了去大理的单程票。落地那天是雨季，空气湿得能拧出水。你在青旅办入住时前台小哥问你"住几天"，你说"不知道"——那是你这辈子说过最自由的三个字。月薪从${fmtExact(beforeSalary)}变为${fmtExact(afterSalary)}，但你的月支出也降了一半。从${beforeCity}到另一座城市，你终于成了真正的数字游民。`);
        },
        log: '你成了真正的数字游民。一个行李箱，一台笔记本，哪里都是你的办公室。',
        blindBoxTrigger: 'nomad_all_in',
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
          s.lifeLog.push(`你关掉了订票软件。你说"再攒一年"——但你知道，"再等一年"是一个无底洞。每多等一年，你的存款会多一点，但你的勇气会少一点。你的行李箱在床底落了灰，你的远程客户还在等你回复。你回了一封邮件："抱歉，暂时无法全职合作。"`);
        },
        log: '你选择了等待。行李箱收进了柜子，单程票换成了往返票。你还在两个世界之间摇摆。',
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
      '直播结束，你关掉补光灯瘫在椅子上。后台这个月的收入是主业工资的两倍，粉丝破了十万，品牌方开出年薪三倍的年框。但你还在上班——上午开无关的会，下午干谁都能干的活，晚上回来内容质量在下降，不是江郎才尽，是没有精力。\n' +
      '搭档问你："你到底什么时候辞职？你的粉丝、你的品牌、你的事业都在等你。"你怕——怕辞了职没人给你交社保、没人告诉你"今天该做什么"。自由是可怕的。但你也知道：不迈出这一步，你永远只是"做内容的打工人"，而不是真正的超级IP。',
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
          s.lifeLog.push(`你递了辞职信。组长问你"去做什么"，你说"去做我自己"。走出公司那天你拍了一条短视频："从今天起，我是一个全职创作者。"评论区炸了——有人祝福，有人质疑，有人说"你疯了"。你笑了笑。月薪从${fmtExact(beforeSalary)}变为${fmtExact(afterSalary)}，但你第一次觉得：你的名字本身就是一家公司。`);
        },
        log: '你成了全职创作者。你的内容、你的品牌、你的名字——就是你的全部资产。',
        blindBoxTrigger: 'ip_all_in',
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
  // 银发守夜人 · All In
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
      '周日晚上十点半，你坐在回城的高铁上。你的周末养老站有二十三个固定客户，月营收超过主业，民政局夸你的模式"有推广价值"。你活得像两个人：周一到周五在写字楼敲键盘，周末回老家那个挂"社区养老服务站"牌子的小门面忙活。\n' +
      '今天你妈在站台上送你："你要是能回来就好了。"辞职回老家，同学会说你"想不开"，亲戚会说你"白读了大学"。但你知道那个挂锦旗的小门面、那些拉着你手叫"小X"的老人、那个需要你亲手建立的事业在等你。高铁到站，你拎起行李箱，没有走向出站口——而是走向了退票窗口。',
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
          s.lifeLog.push(`你退掉了返程票。周一你递了辞职信，周五你就站在了老家那个小门面前。你把"社区养老服务站"的牌子换成了正式注册的公司铭牌。你妈站在门口看着你，嘴上说"你这是何苦"，眼眶却红了。月薪从${fmtExact(beforeSalary)}变为${fmtExact(afterSalary)}，从${beforeCity}回到避风低洼地——你终于不再是一个"周末养老人"了。`);
        },
        log: '你退了返程票，辞了职，回了老家。从此你的全部身心都投入到了那间养老站。',
        blindBoxTrigger: 'silver_all_in',
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
      '你站在实验室走廊尽头，透过玻璃窗看里面那些不许你碰的设备。你的生物科技投资组合两年翻了四倍，重仓的NAD+前体公司刚拿到二期临床的积极数据。但让你想辞职的不是钱，是那篇让小鼠"部分返老还童"的论文——你读到的时候手在抖。\n' +
      '你知道这项技术正在加速，你需要真正参与进去，而不是只当个投资者。你的生物年龄比实际年轻6岁，你的身体是筹码、知识是杠杆、投资组合是弹药，可它们全被压在一份朝九晚五的工作之外。伴侣说："你天天研究活到150岁，却连今天都不开心。"你说："因为在这里的每一分钟，我都不在实验室里。"',
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
          const injected = (s as any).injectedSelf === true;
          const injectionLine = injected
            ? '你手臂上的针眼已经三年了，你从没后悔过把自己当第一只小白鼠。'
            : '你坚持不用自己当试验品——你研究抗衰，但你更尊重科学的边界。';
          s.lifeLog.push(`你递了辞职信。同事问你"去哪高就"，你说"去活久一点"。从今天起，你的全部时间都属于抗衰事业——研究论文、管理投资组合、自体实验、参加学术会议。${injectionLine}月薪从${fmtExact(beforeSalary)}变为${fmtExact(afterSalary)}，但你的真正资产是那串生物科技投资组合和比你实际年龄年轻6岁的身体。你在和时间赛跑，而时间是你唯一的对手。`);
        },
        log: '你成了全职的长寿赌徒。你的筹码是身体、知识和投资组合，你的赌注是人类的极限寿命。',
        blindBoxTrigger: 'bio_all_in',
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

  // ============================================================
  // 第二次All In窗口 · 35岁左右"最后一趟车"
  // 触发条件：还没All In，但副业收入已经远超主业，年龄偏大
  // ============================================================
  {
    id: 'allin_second_chance_ai',
    title: '最后一趟车',
    pathId: 'ai_symbiote',
    ageRange: [33, 45],
    priority: 12,
    weight: 80,
    oncePerGame: true,
    eventType: 'milestone',
    sceneTag: 'breakthrough',
    conditions: (s: GameState) => s.isAllInPath === false && s.pathFaith >= 25,
    narrative:
      '你35岁了。AI副业收入是主业工资的三倍，带三个徒弟、十几个客户，开源项目star过千——但你还在上班。新来的主管比你小五岁，说的那套"AI赋能"全是你三年前玩剩下的。你妈问"什么时候升职"，你说"快了"——你没说的是，你根本不想升。\n' +
      '晚上你翻到《35岁还在写代码的人都去哪了》，关掉页面，打开了第四次开口的辞职信文档。你忽然意识到：你不是在等更好的时机，你是在害怕离开公司的名头之后就什么都不是。可如果这次还不跳，以后就真的跳不动了。',
    options: [
      {
        id: 'all_in_now',
        label: '这次真的走——辞职',
        description: '不再等了。35岁了，再等就40了。',
        hint: '职业→自由职业 · 信念+12 · 压力+8 · 幸福+5',
        hintColor: 'danger',
        skillGains: { aiSkill: 5 },
        savingsChange: -10000,
        stateEffect: (s: GameState) => {
          applyAllIn(s);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        blindBoxTrigger: 'ai_all_in_product',
        log: '你递了辞职信。主管说"你会后悔的"，你笑了笑没说话。走出写字楼的时候，阳光和七年前你第一次想辞职那天一模一样——但这次你没有回头。',
      },
      {
        id: 'stay_employed',
        label: '继续两边跑，再等等',
        description: '也许等升职加薪再说？也许等孩子大一点再说？',
        hint: '信念-5 · 压力+5',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
          s.stress = clamp(s.stress + 5, 0, 100);
        },
        log: '你关上了辞职信文档。继续上班，继续接私活，继续两边跑。你告诉自己"再等等"，但你心里清楚："再等等"的意思，大概率是"永远不等了"。',
      },
    ],
  },

  {
    id: 'allin_second_chance_chain',
    title: '最后一趟车',
    pathId: 'chain_native',
    ageRange: [33, 45],
    priority: 12,
    weight: 80,
    oncePerGame: true,
    eventType: 'milestone',
    sceneTag: 'breakthrough',
    conditions: (s: GameState) => s.isAllInPath === false && s.pathFaith >= 25,
    narrative:
      '你35岁了。链上资产经历过两次牛熊，够付首付了——但你还在上班。午休看K线被实习生撞见，他问"哥你也炒币啊"，你说"玩玩"。他不知道你的仓位比他见过的所有钱都多。\n' +
      '你翻到群里一个老网友的动态：他40岁辞了职搬去里斯本，每天冲浪看盘，下面有人评论"羡慕"，有人说"不负责任"。你盯着看了很久，忽然发现：你不是在等牛市，你是在等一个"不会被人说不负责任"的时机——而那种时机，永远不会来。',
    options: [
      {
        id: 'all_in_now',
        label: '辞职——去链上活着',
        description: '不等到"完美时机"了，现在就是时机。',
        hint: '职业→自由职业 · 信念+12 · 压力+8',
        hintColor: 'danger',
        skillGains: { tradingSkill: 5 },
        savingsChange: -10000,
        stateEffect: (s: GameState) => {
          applyAllIn(s);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
        },
        blindBoxTrigger: 'chain_all_in',
        log: '你辞了职，把大部分资产提到了冷钱包，退了一半的群。你给自己定了三条铁律：不杠杆、不碰土狗、不晒单。走的那天你发了一条动态圈："去链上了。"然后关了手机。',
      },
      {
        id: 'stay_employed',
        label: '再等等，稳一点',
        description: '等下一轮牛市再考虑，现在先保住工资',
        hint: '信念-5 · 压力+5',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
          s.stress = clamp(s.stress + 5, 0, 100);
        },
        log: '你把冷钱包又锁回了保险柜。继续定投，继续上班，继续等。你告诉自己"稳一点没坏处"，但你夜里偶尔会想：里斯本的浪现在是什么季节？',
      },
    ],
  },

  {
    id: 'allin_second_chance_nomad',
    title: '最后一趟车',
    pathId: 'digital_nomad',
    ageRange: [33, 45],
    priority: 12,
    weight: 80,
    oncePerGame: true,
    eventType: 'milestone',
    sceneTag: 'breakthrough',
    conditions: (s: GameState) => s.isAllInPath === false && s.pathFaith >= 25,
    narrative:
      '你35岁了。远程客户稳定在5-6个，美元收入换算成人民币是工资的两倍，护照上已经攒了三本盖章的戳。你妈发社交软件说"隔壁小王二胎都生了，你什么时候稳定下来"，你回"快了"，然后打开机票网站——清迈飞曼谷120块，曼谷飞里斯本2300块。\n' +
      '你已经买过十七次"下次就不回去了"的机票，每次假期结束都回来了——不是不想走，是走的那一刻总觉得"还没准备好"。可你已经35了，你到底要准备到什么时候？',
    options: [
      {
        id: 'all_in_now',
        label: '买了单程票——出发',
        description: '这次不买回程。边走边活，边活边走。',
        hint: '职业→数字游民 · 信念+12 · 压力+8 · 幸福+8',
        hintColor: 'danger',
        skillGains: { remoteWorkAbility: 5 },
        savingsChange: -15000,
        stateEffect: (s: GameState) => {
          applyAllIn(s);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
        },
        blindBoxTrigger: 'nomad_all_in',
        log: '你买了一张单程票，目的地是清迈。退了租房，把行李寄存在朋友家，给妈发了条消息："妈，我出去走走，可能久一点。"她回了"注意安全"——比你预想的平静。起飞的时候你靠窗坐着，飞机穿过云层的时候你哭了。不是因为害怕，是因为你终于做了。',
      },
      {
        id: 'stay_employed',
        label: '再攒点钱，明年再说',
        description: '存款再多一点，客户再稳一点，就出发',
        hint: '信念-5 · 压力+5',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
          s.stress = clamp(s.stress + 5, 0, 100);
        },
        log: '你关掉了机票网站。"明年再说"你对自己说。你看了眼护照上最近的一个入境章——那是两年前了。你忽然发现，"明年再说"这句话你已经说了五年了。',
      },
    ],
  },

  {
    id: 'allin_second_chance_ip',
    title: '最后一趟车',
    pathId: 'super_ip',
    ageRange: [33, 45],
    priority: 12,
    weight: 80,
    oncePerGame: true,
    eventType: 'milestone',
    sceneTag: 'breakthrough',
    conditions: (s: GameState) => s.isAllInPath === false && s.pathFaith >= 25,
    narrative:
      '你35岁了。粉丝二十万，月收入稳定在三万以上——是你工资的三倍，但你还在上班。同事都刷到过你的视频，却没人知道那是你：你用了网名、戴了帽子，从不在视频里露工位。\n' +
      'MCN开出七位数的年框让你全职做，你盯着合同看了三天，最后回"再考虑考虑"。晚上剪视频到凌晨两点，第二天顶着黑眼圈开周会，领导讲Q3 OKR，你在下面回粉丝私信。镜子里的你眼底有红血丝、白头发比去年多了不少。你35了，还能这样"两边打"多久？',
    options: [
      {
        id: 'all_in_now',
        label: '辞职——全职做内容',
        description: '签MCN也好不签也罢，先把职辞了。你的名字就是你的公司。',
        hint: '职业→自由职业 · 信念+12 · 压力+8 · 幸福+5',
        hintColor: 'danger',
        skillGains: { contentCreation: 5 },
        savingsChange: -10000,
        stateEffect: (s: GameState) => {
          applyAllIn(s);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        blindBoxTrigger: 'ip_all_in',
        log: '你递了辞职信，拍了一条"我辞职了"的视频。没有煽情，没有鸡汤，就是对着镜头说："从今天起，我只做内容。"那条视频播放量破了你的纪录——因为你眼里有光，那种光你自己很久没见过了。',
      },
      {
        id: 'stay_employed',
        label: '继续两边跑，稳一点',
        description: '等粉丝再多一点，收入再稳一点再说',
        hint: '信念-5 · 压力+5',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
          s.stress = clamp(s.stress + 5, 0, 100);
        },
        log: '你婉拒了MCN。继续白天上班晚上剪视频。你告诉自己"稳一点"，但你越来越清楚：你不是在稳，你是在躲。',
      },
    ],
  },

  {
    id: 'allin_second_chance_silver',
    title: '最后一趟车',
    pathId: 'silver_economy',
    ageRange: [33, 45],
    priority: 12,
    weight: 80,
    oncePerGame: true,
    eventType: 'milestone',
    sceneTag: 'breakthrough',
    conditions: (s: GameState) => s.isAllInPath === false && s.pathFaith >= 25,
    narrative:
      '你35岁了。兼职运营的养老点已服务80多个老人、雇了3个员工、月流水五万多，但你还在上班。民政局找你谈想做大连锁，需要全职投入还要投钱扩建，你说"我考虑考虑"。\n' +
      '这个月走了两个老人，张奶奶的女儿拉着你的手哭："谢谢你陪她最后那两年。"你站在墓碑前忽然想：你照顾了这么多别人的爸妈，自己的爸妈一年见几次？你35了，还在等什么？等爸妈老到需要你时，你才发现自己已经在照顾别人的爸妈了？',
    options: [
      {
        id: 'all_in_now',
        label: '辞职——把养老做成事业',
        description: '这不是副业了，这是你该做一辈子的事。',
        hint: '职业→实体创业 · 信念+12 · 压力+10 · 幸福+5',
        hintColor: 'danger',
        skillGains: { elderlyCare: 5 },
        savingsChange: -30000,
        stateEffect: (s: GameState) => {
          applyAllIn(s);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.stress = clamp(s.stress + 10, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        blindBoxTrigger: 'silver_all_in',
        log: '你辞了职，把所有积蓄投进了扩建。你妈知道后沉默了很久，最后说"我给你炖锅汤送过去"。开业那天来了二十多个老人，王爷爷写了一副字："老吾老以及人之老。"你把它裱起来挂在大厅，没让别人看见你红了的眼眶。',
      },
      {
        id: 'stay_employed',
        label: '再等等，孩子还小/房贷还多',
        description: '家庭责任在这，不敢冒险',
        hint: '信念-5 · 压力+5',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
          s.stress = clamp(s.stress + 5, 0, 100);
        },
        log: '你谢绝了民政局的提议。继续周末跑养老点，继续上班。你告诉自己"责任为重"，但你偶尔会想：那些老人还能等你几年？',
      },
    ],
  },

  {
    id: 'allin_second_chance_bio',
    title: '最后一趟车',
    pathId: 'bio_gambler',
    ageRange: [33, 45],
    priority: 12,
    weight: 80,
    oncePerGame: true,
    eventType: 'milestone',
    sceneTag: 'breakthrough',
    conditions: (s: GameState) => s.isAllInPath === false && s.pathFaith >= 25,
    narrative:
      '你35岁了。生物科技投资组合翻了六倍，你的抗衰方案让生理年龄指标比同龄人好8-10岁，但你还在上班。公司体检让医生惊讶，他问"怎么保养的"，你说"睡觉运动"——没说每天吃12粒补剂、每月抽血测生物标志物、晚上泡冰水浴。\n' +
      '一家长寿基金挖你去做全职投资分析师，薪资翻倍，前提是辞职。你爸今年放了三个血管支架，看着他苍老的脸你忽然想：你最想延长的，是他。可你白天还在给老板写PPT。你的体检报告说你身体像27岁，你却活得像50岁——两边熬，两边都不彻底。',
    options: [
      {
        id: 'all_in_now',
        label: '辞职——全力投入长寿事业',
        description: '要么All In，要么别玩了。人生没有几个35岁。',
        hint: '职业→自由职业 · 信念+12 · 压力+10 · 幸福+5',
        hintColor: 'danger',
        skillGains: { longevityKnowledge: 5 },
        savingsChange: -20000,
        stateEffect: (s: GameState) => {
          applyAllIn(s);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.stress = clamp(s.stress + 10, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        blindBoxTrigger: 'bio_all_in',
        log: '你辞了职，接受了那份offer，也把更多精力投入自实验和研究。你给自己重新做了全套检测，在实验记录本上写下："N=1，第365天。"这次你不再躲躲藏藏——你要把这件事做到底。',
      },
      {
        id: 'stay_employed',
        label: '继续业余研究，工资是安全垫',
        description: '等投资收益够十年生活费再说',
        hint: '信念-5 · 压力+5',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
          s.stress = clamp(s.stress + 5, 0, 100);
        },
        log: '你婉拒了那个offer。继续白天上班晚上研究。你告诉自己"安全第一"，但你偶尔会想：连自己的时间都不敢赌，你凭什么赌人类能活120岁？',
      },
    ],
  },
];

registerNarrativeEvents(allInEvents);
