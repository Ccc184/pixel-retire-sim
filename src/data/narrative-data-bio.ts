/**
 * 生物赌徒路径 · 完整叙事事件库
 *
 * 三条分支：
 *   bio_investor     — 生物科技投资线，押注抗衰公司、长寿基金、初创股权
 *   bio_experimenter — 自体实验线，补剂、方案、生物黑客、N=1试验
 *   bio_researcher   — 科研参与线，参与研究、公民科学、积累知识、影响领域
 *
 * 三个技能维度：
 *   healthOptSkill   健康优化能力（营养、运动科学、睡眠优化、生物标志物追踪）
 *   bioKnowledge     生物知识（分子生物学、衰老研究、临床试验素养、科学方法）
 *   investmentSkill  投资分析能力（生科股分析、初创评估、组合管理）
 *
 * 自定义状态字段：
 *   state.bioPortfolio     生物科技投资组合价值
 *   state.biologicalAge    生物年龄偏移（负数=更年轻）
 *   state.supplementRegime 是否坚持补剂方案（boolean）
 *
 * ================================================================
 * 效果应用约定：
 *   skillGains / savingsChange / salaryChange / passiveIncomeChange
 *   为声明式字段，由 store 统一应用到 state（pathSkills / currentSavings 等）。
 *   stateEffect 仅负责 stress / happiness / health / pathFaith 以及
 *   条件分支逻辑和自定义字段（bioPortfolio / biologicalAge /
 *   supplementRegime）的初始化与调整，不重复修改上述声明式字段，
 *   以避免双重计算。
 * ================================================================
 */
import type { NarrativeEvent, NarrativeAchievement, GameState } from '../types/global.d.js';
import { registerNarrativeEvents } from './narrative-registry.js';
import { registerAchievements } from './narrative-achievements.js';
import { clamp } from '../utils/clamp.js';
import { pctInvestment } from '../utils/math-engine.js';

// ============================================================
// 辅助函数
// ============================================================

/** 确保 pathSkills 已初始化 */
function ensureSkills(state: GameState): void {
  if (!state.pathSkills) {
    (state as any).pathSkills = {};
  }
}

/** 读取生物科技投资组合价值 */
function getBioPortfolio(state: GameState): number {
  return (state as any).bioPortfolio || 0;
}

/** 调整生物科技投资组合价值（正=增值/投入，负=缩水/撤出） */
function adjustBioPortfolio(state: GameState, delta: number): void {
  const cur = (state as any).bioPortfolio || 0;

  if (delta > 0) {
    // 加仓：从存款扣除，bioPortfolio 增加（受存款上限约束，不能凭空造币）
    const buyAmount = Math.min(delta, state.currentSavings);
    state.currentSavings -= buyAmount;
    (state as any).bioPortfolio = cur + buyAmount;
    updateBioAllocation(state);
  } else if (delta < 0) {
    // 减仓：bioPortfolio 减少，现金回血（不能卖出超过持仓量）
    const sellAmount = Math.min(Math.abs(delta), cur);
    (state as any).bioPortfolio = cur - sellAmount;
    state.currentSavings += sellAmount;
    updateBioAllocation(state);
  } else {
    (state as any).bioPortfolio = cur;
  }
}

/**
 * 更新存款分布：生科投资是独立资产（bioPortfolio），不占用 currentSavings 的百分比。
 * stockPct = 0（生科投资不在存款中，而在 bioPortfolio 中）
 * bankDepositPct = 100 - 其他渠道百分比
 * UI 显示时再按总流动资产（savings + bioPortfolio）重新计算各渠道占比。
 */
function updateBioAllocation(state: GameState): void {
  // 生科投资是独立资产，不占用 currentSavings 的百分比
  state.stockPct = 0;
  // 其他渠道（基金/比特币/黄金/定期）的百分比保持不变，余额宝吸收剩余
  const otherPct = (state.indexFundPct || 0) + (state.speculationPct || 0) + (state.goldPct || 0) + (state.fixedDepositPct || 0);
  state.bankDepositPct = Math.max(0, 100 - otherPct);
}

/** 调整生物年龄偏移（负delta=变年轻，正delta=变老） */
function adjustBiologicalAge(state: GameState, delta: number): void {
  const cur = (state as any).biologicalAge || 0;
  (state as any).biologicalAge = cur + delta;
}

// ============================================================
// 通用事件（ages 22-24，分支选择前）
// ============================================================

const commonEvents: NarrativeEvent[] = [

  // 22岁：开启延寿计划，第一瓶NMN
  {
    id: 'bio_first_protocol',
    title: '第一粒',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    ageRange: [22, 22],
    priority: 7,
    weight: 10,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '快递到了，一瓶NMN、一瓶维生素D3+K2、一袋深海鱼油，在宿舍书桌上一字排开，像仪式的法器。你读完了《Lifespan》，又翻了几十篇关于NAD+（细胞能量货币）前体的论文——你相信，衰老不是命运，而是一种可以治疗的疾病。\n' +
      '你吞下第一粒，胶囊滑过喉咙的瞬间，你忽然觉得从这一刻起，你和同龄人走上了不同的时间轴。也许这粒药什么用都没有，也许它是你活到一百二十岁的第一块砖。',
    options: [
      {
        id: 'full_protocol_commit',
        label: '全速启动：断食、运动、补剂、睡眠',
        description: '16:8间歇性断食、每周四次力量训练、严格睡眠窗口、全套补剂',
        hint: '健康优化+10 · 生物知识+5 · 健康+5 · 压力+5 · 存款-3000',
        hintColor: 'positive',
        skillGains: { healthOptSkill: 10, bioKnowledge: 5 },
        savingsChange: -3000,
        stateEffect: (s) => {
          s.health = clamp(s.health + 5, 0, 100);
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          (s as any).supplementRegime = true;
        },
        log: '{startAge}岁，你的人生被切割成十六小时的进食窗口和八小时的禁食。室友吃夜宵时你喝水，同事喝奶茶时你泡绿茶。你的床头多了一个补剂分装盒，每周日填好七天份。你觉得自己在和时间为敌。',
        blindBoxTrigger: 'bio_first_protocol',
      },
      {
        id: 'ease_into_it',
        label: '循序渐进，先从睡眠和运动开始',
        description: '不急着上全套补剂，先把地基打好',
        hint: '健康优化+6 · 健康+4 · 幸福+3 · 信念+3',
        hintColor: 'neutral',
        skillGains: { healthOptSkill: 6 },
        stateEffect: (s) => {
          s.health = clamp(s.health + 4, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '{startAge}岁，你没急着当"药罐子"。你先戒了熬夜，每天十一点准时关灯，早晨七点起来跑步。两周后你发现自己白天不再犯困，皮肤也好了。你把那瓶NMN收进抽屉——药片先放着，觉先睡够再说。',
      },
      {
        id: 'study_first',
        label: '先把论文读透，再决定吃什么',
        description: '不盲从网红方案，自己查文献、看机制',
        hint: '生物知识+12 · 健康优化+3 · 信念+4 · 压力+3',
        hintColor: 'neutral',
        skillGains: { bioKnowledge: 12, healthOptSkill: 3 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '{startAge}岁，你把Pubmed翻了个底朝天。你发现NMN的人体数据少得可怜，白藜芦醇的临床结果互相打架，二甲双胍抗衰还停留在动物实验。你叹了口气，但还是下单了——因为哪怕只有十分之一的概率，你也愿意赌。',
      },
    ],
  },

  // 23岁：社交摩擦——拒绝喝酒和垃圾食品
  {
    id: 'bio_social_friction',
    title: '不合群',
    sceneTag: 'restaurant',
    pathId: 'bio_gambler',
    ageRange: [23, 23],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '部门聚餐，领导举杯："来，新人走一个！"你端着白开水，全桌的目光像聚光灯打在你身上。"酒精是一类致癌物，而且会破坏睡眠和肌肉合成。"空气安静了两秒，有人打圆场："人家养生嘛，理解理解。"那顿饭，你明显被边缘化了。\n' +
      '回家的地铁上你盯着车窗里的倒影：酒精确实有害，但你不确定这种"正确"值不值得被孤立。也许十年后他们会羡慕你的身体，但今晚，你只有自己。',
    options: [
      {
        id: 'stay_strict',
        label: '坚持原则，宁可被孤立',
        description: '你的身体是你的筹码，不为任何社交妥协',
        hint: '健康优化+8 · 健康+3 · 幸福-5 · 信念+5 · 压力+4',
        hintColor: 'neutral',
        skillGains: { healthOptSkill: 8 },
        stateEffect: (s) => {
          s.health = clamp(s.health + 3, 0, 100);
          s.happiness = clamp(s.happiness - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.stress = clamp(s.stress + 4, 0, 100);
        },
        log: '{age}岁，你成了公司里"那个不喝酒的怪人"。聚餐时你永远端着茶杯，应酬能推就推。有人说你清高，有人说你装。你不在乎——你在乎的是二十年后的体检报告，而不是今晚谁的面子。',
      },
      {
        id: 'compromise_occasionally',
        label: '偶尔妥协，喝一点点维持关系',
        description: '一年喝两三次无伤大雅，但平时坚决守住',
        hint: '健康优化+4 · 幸福+4 · 信念+2 · 健康+1',
        hintColor: 'neutral',
        skillGains: { healthOptSkill: 4 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 4, 0, 100);
          s.health = clamp(s.health + 1, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 2, 0, 100);
        },
        log: '{age}岁，你学会了"战略性饮酒"——一年只喝三次，每次半杯，举着杯子抿一抿。领导和同事觉得你"给面子"，你也守住了底线。你发现：对抗衰老不一定要对抗全世界，留一点弹性，路反而走得更远。',
      },
      {
        id: 'convert_friends',
        label: '把同事也拉进健康生活',
        description: '与其被孤立，不如拉几个人一起养生',
        hint: '健康优化+6 · 幸福+5 · 生物知识+4 · 压力+2 · 月薪+500',
        hintColor: 'positive',
        skillGains: { healthOptSkill: 6, bioKnowledge: 4 },
        salaryChange: 500,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.stress = clamp(s.stress + 2, 0, 100);
        },
        log: '{age}岁，你组了一个"午休散步群"，每天拉着三四个同事绕写字楼走半小时。你给他们科普血糖曲线和深度睡眠，有人觉得你烦，但也有人开始跟着你吃轻食。你发现：怪人凑成一群，"怪"字就慢慢被人读成了"潮"。',
      },
    ],
  },

  // 23-24岁：第一次生物标志物检测结果
  {
    id: 'bio_first_biomarker',
    title: '数据',
    sceneTag: 'clinic',
    pathId: 'bio_gambler',
    ageRange: [23, 24],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '你戴上一枚连续血糖监测仪（CGM），又花了半个月工资做了一套深度血液检测，报告有三十多页。大部分指标正常，但几个亮了红灯——空腹胰岛素偏高，维生素D严重不足，同型半胱氨酸略高。医生说"没什么大问题，注意饮食"，但你知道这些"正常"的边界正在悄悄移动。\n' +
      '你把数据录入表格，和同龄人的平均值对比。身体不再是模糊的感觉，而是一组可以追踪、可以优化的数字——既让人安心，又让人上瘾。',
    options: [
      {
        id: 'optimize_every_marker',
        label: '针对每个异常指标制定方案',
        description: '维生素D补到60ng/ml，胰岛素用低碳水压下去，同型半胱氨酸加B族',
        hint: '健康优化+12 · 生物知识+6 · 健康+6 · 压力+6 · 存款-4000',
        hintColor: 'positive',
        skillGains: { healthOptSkill: 12, bioKnowledge: 6 },
        savingsChange: -4000,
        stateEffect: (s) => {
          s.health = clamp(s.health + 6, 0, 100);
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          adjustBiologicalAge(s, -1);
        },
        log: '{age}岁，你给自己做了一张"指标作战图"，每个异常值后面跟着一行行动方案。三个月后复查，维生素D从18升到了58，空腹胰岛素降了一半。你盯着对比报告，像盯着一局赢了的牌——原来身体真的是可以被"管理"的。',
      },
      {
        id: 'track_trends_only',
        label: '只追踪趋势，不纠结单个数字',
        description: '数据是参考不是圣经，别把自己逼疯',
        hint: '健康优化+6 · 生物知识+8 · 幸福+3 · 信念+3',
        hintColor: 'neutral',
        skillGains: { healthOptSkill: 6, bioKnowledge: 8 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '{age}岁，你学会了看趋势而不是单点。你每季度测一次，把数据画成折线图贴在冰箱上。你发现：比起某一天的数字，三个月的方向更重要。你开始理解一句话——"你不能管理你测量的，但你也可能迷失在你测量的里"。',
      },
      {
        id: 'get_cgm_obsessed',
        label: '戴上CGM，研究每一顿饭的血糖曲线',
        description: '实时看着血糖起伏，像盯着股市K线一样上瘾',
        hint: '健康优化+10 · 生物知识+5 · 健康+3 · 压力+5 · 存款-2500',
        hintColor: 'neutral',
        skillGains: { healthOptSkill: 10, bioKnowledge: 5 },
        savingsChange: -2500,
        stateEffect: (s) => {
          s.health = clamp(s.health + 3, 0, 100);
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '{age}岁，你的手机里多了一个血糖曲线APP。你发现吃白米饭血糖飙到9.5，换成糙米只到7.2。你开始对每一顿饭精打细算，吃饭前先在脑子里算升糖负荷。朋友说你"活得像个体外实验"，你没反驳，低头又记了一笔数据。',
      },
    ],
  },

  // 24岁：基因检测结果
  {
    id: 'bio_gene_test',
    title: '命运',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    ageRange: [24, 24],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '基因检测报告出来了。你颤抖着点开PDF，先翻到阿尔茨海默相关的APOE基因——谢天谢地，你是APOE3/3，中性。再翻到MTHFR，你是C677T杂合突变，叶酸代谢能力只有正常的65%。还有COMT、ACTN3、FTO，一串让人不安的条目。\n' +
      '你盯着屏幕，这些ATCG的字母像一份提前写好的判决书。基因不能改，但表达可以调——这是表观遗传学给你的安慰。你加了一瓶甲基化叶酸进购物车：命运发牌，但怎么打，由你。',
    options: [
      {
        id: 'precision_supplements',
        label: '根据基因定制补剂方案',
        description: 'MTHFR补甲基叶酸，COMT少咖啡因，FTO控碳水',
        hint: '健康优化+10 · 生物知识+10 · 健康+4 · 存款-3500 · 信念+5',
        hintColor: 'positive',
        skillGains: { healthOptSkill: 10, bioKnowledge: 10 },
        savingsChange: -3500,
        stateEffect: (s) => {
          s.health = clamp(s.health + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          adjustBiologicalAge(s, -1);
        },
        log: '{age}岁，你的补剂方案从"别人吃什么我吃什么"变成了"我的基因要我吃什么"。你换了甲基化叶酸，把咖啡减到每天一杯，碳水压到总热量30%。嘴里有了点"工程学"的味道——养生原来可以这样拆着算。',
      },
      {
        id: 'focus_on_epigenetics',
        label: '研究表观遗传，用生活方式改写表达',
        description: '基因是剧本，但生活方式是导演',
        hint: '生物知识+12 · 健康优化+5 · 信念+6 · 压力+3',
        hintColor: 'neutral',
        skillGains: { bioKnowledge: 12, healthOptSkill: 5 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.stress = clamp(s.stress + 3, 0, 100);
        },
        log: '{age}岁，你迷上了表观遗传学。你读到一项研究：运动能改变肌肉细胞的甲基化模式，让"衰老基因"沉默。你突然觉得，你在跑步机上流的每一滴汗，都是在改写自己的源代码。基因不是终点，是起点。',
      },
      {
        id: 'accept_and_live',
        label: '接受基因，不被数字绑架',
        description: '基因只是风险提示，不是判决书，该吃吃该练练',
        hint: '健康优化+4 · 幸福+6 · 信念+2 · 健康+2',
        hintColor: 'neutral',
        skillGains: { healthOptSkill: 4 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 6, 0, 100);
          s.health = clamp(s.health + 2, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 2, 0, 100);
        },
        log: '{age}岁，你合上报告，决定不被一串字母绑架。APOE4携带者里也有活到九十的，FTO变异的人里也有瘦的——基因递给你的是概率，不是判决书。你继续跑步、继续断食，但不再每隔五分钟查一次自己的风险等级。你学会了一个词：洒脱。',
      },
    ],
  },
];

// ============================================================
// 分支选择事件（age 25）
// ============================================================

const branchSelectEvent: NarrativeEvent[] = [

  {
    id: 'bio_branch_select',
    title: '赌注',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    ageRange: [25, 25],
    priority: 10,
    weight: 10,
    oncePerGame: true,
    eventType: 'branch_select',
    conditions: (s) => !s.narrativeBranch || s.narrativeBranch === 'unassigned',
    narrative:
      '三年了。你从那个吞下第一粒NMN的年轻人，变成动态圈里"最懂养生"也"最不像二十五岁"的人。体检报告比同龄人好看一截，补剂柜比药店的货架还齐全。但"懂"和"养生"都是模糊的词——光靠自己吃药和跑步，上限太低。抗衰这场赌局，你得以更深的姿态入局。\n' +
      '深夜你打开备忘录，写下三个词：投资、实验、研究。选了哪条路，就意味着把另外两条暂时搁下。如果你真能活到一百二十岁，那你现在选的这条路，将决定你是那场革命的参与者、见证者，还是被甩在身后的普通人。',
    options: [
      {
        id: 'choose_bio_investor',
        label: '投资生物科技，用资本押注未来',
        description: '把积蓄押向抗衰公司和长寿基金。你赌的是：谁能最早押中突破性技术，谁就能获得百倍回报，而你需要足够的筹码撑到那天。',
        hint: '投资分析+12 · 生物知识+5 · 压力+6 · 信念+6 · bioPortfolio+20000',
        hintColor: 'positive',
        skillGains: { investmentSkill: 12, bioKnowledge: 5 },
        branchSwitch: 'bio_investor',
        memorySet: { choseInvestor: true, choseExperimenter: false, choseResearcher: false },
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          adjustBioPortfolio(s, 20000);
        },
        log: '{age}岁，你决定做这场赌局的庄家——不，是赌徒里最清醒的那种。你把积蓄的一半调进了生物科技组合，开始研究管线、看临床数据、读招股书。你赌的是：下一个改变人类的药，会从你的投资组合里诞生。',
      },
      {
        id: 'choose_bio_experimenter',
        label: '把自己当试验田，极致自体实验',
        description: '没人比你的身体更值得研究。你赌的是：最前沿的方案来不及等FDA，你要在自己身上先试出来。',
        hint: '健康优化+12 · 生物知识+5 · 健康+4 · 压力+5 · 信念+6',
        hintColor: 'danger',
        skillGains: { healthOptSkill: 12, bioKnowledge: 5 },
        branchSwitch: 'bio_experimenter',
        memorySet: { choseInvestor: false, choseExperimenter: true, choseResearcher: false },
        stateEffect: (s) => {
          ensureSkills(s);
          s.health = clamp(s.health + 4, 0, 100);
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          adjustBiologicalAge(s, -1);
        },
        log: '{age}岁，你把自己签给了自己当受试者。你开始系统记录每一个变量：补剂剂量、睡眠时长、心率变异性、晨起体温。你在身上贴满了传感器，像一台行走的生物实验室。你赌的是：N=1的实验，样本虽小，但反馈最快。',
      },
      {
        id: 'choose_bio_researcher',
        label: '参与科研，用知识影响这个领域',
        description: '与其赌单个公司或单个方案，不如成为这个领域的一部分。你赌的是：知识本身就是最稳健的复利。',
        hint: '生物知识+12 · 健康优化+5 · 信念+6 · 压力+3 · 月薪+1000',
        hintColor: 'positive',
        skillGains: { bioKnowledge: 12, healthOptSkill: 5 },
        salaryChange: 1000,
        branchSwitch: 'bio_researcher',
        memorySet: { choseInvestor: false, choseExperimenter: false, choseResearcher: true },
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '{age}岁，你注册成了一个衰老研究项目的志愿者，又报名了一个生物信息学的在线课程。这回你的赌注换了——不再押哪只票、哪粒药，押的是"懂行"两个字。你把课程笔记存进文件夹，标了星。在这个圈子里，钱是最不值钱的筹码，判断力才是——而判断力，得一笔一笔攒出来。',
      },
    ],
  },
];

// ============================================================
// 生物科技投资线事件（ages 26-45）
// ============================================================

const investorEvents: NarrativeEvent[] = [

  // 26岁：买入第一只生物科技股
  {
    id: 'bio_inv_first_stock',
    title: '开仓',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    branch: 'bio_investor',
    ageRange: [26, 26],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你盯着券商APP，手指悬在"买入"键上方。这家做NAD+（能量货币）前体人体临床试验的公司，Phase II数据下个月公布。你读了它的管线、看了管理层背景、算了现金流——所有指标都指向"值得赌"。但生物科技股的波动比过山车还猛：一期临床成功率不到10%，三期也只有30%多。\n' +
      '你深吸一口气，按下了买入。成交提示音响起时，你的心跳比做完一组深蹲还快。从这一刻起，你不只是在吃补剂，你是在用钱押注人类的未来——以及你自己的。',
    options: [
      {
        id: 'concentrated_bet',
        label: '集中仓位，重押这一只',
        description: '看懂了就敢下重注，分散是给不懂的人的',
        hint: '投资分析+10 · 信念+6 · 压力+10 · bioPortfolio风险↑',
        hintColor: 'danger',
        skillGains: { investmentSkill: 10 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          adjustBioPortfolio(s, -15000);
          adjustBioPortfolio(s, 22000);
        },
        log: '{age}岁，你把组合里四成的仓位压在了那只NAD+公司上。同事说你疯了，你说"看懂了就不叫赌"。下个月数据公布，你紧张得三天没睡好。结果还行——股价涨了四成。你卖出了一半落袋，剩下的留着赌三期。"研究变现"这四个字，你总算亲口尝到了甜。',
        blindBoxTrigger: 'bio_big_bet',
      },
      {
        id: 'diversified_portfolio',
        label: '分散买入三只，降低单一风险',
        description: '生科股单只风险太高，建一个迷你组合',
        hint: '投资分析+8 · 生物知识+4 · 信念+4 · 压力+4 · bioPortfolio稳健↑',
        hintColor: 'positive',
        skillGains: { investmentSkill: 8, bioKnowledge: 4 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          adjustBioPortfolio(s, -10000);
          adjustBioPortfolio(s, 11500);
        },
        log: '{age}岁，你没有把鸡蛋放一个篮子。你挑了三只不同方向的抗衰股：一个做NAD+，一个做衰老细胞清除，一个做表观遗传重编程。其中一只跌了，一只涨了，一只平。组合的意义，你这一回才算摸到一点门道——赌对一只靠运气，让概率站在你这边才靠本事。',
      },
      {
        id: 'index_longevity_fund',
        label: '买长寿主题ETF，赚赛道beta',
        description: '不会选股就买整个赛道，赌的是方向不是个股',
        hint: '投资分析+6 · 信念+3 · 压力+2 · bioPortfolio缓慢↑',
        hintColor: 'neutral',
        skillGains: { investmentSkill: 6 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 2, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
          adjustBioPortfolio(s, -8000);
          adjustBioPortfolio(s, 8800);
        },
        log: '{age}岁，你买了只长寿主题ETF，一篮子装了二十多家抗衰公司。你不用每天盯盘，只需相信一个判断：人类对延寿的渴望不会消失。一年后涨了一成，不多，但你睡得很安稳。你把APP推送关了，手机扣在桌上，泡了杯茶。',
      },
    ],
  },

  // 28岁：临床试验结果——赢
  {
    id: 'bio_inv_clinical_win',
    title: '中奖',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    branch: 'bio_investor',
    ageRange: [28, 28],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    narrative:
      '凌晨三点，你的手机疯狂震动。你重仓的那家做衰老细胞清除的公司——senolytics（衰老细胞清除剂，像给身体做大扫除）——刚公布二期临床数据：主要终点达成，安全性良好，效果比预期还好。盘前股价跳空高开80%，你的组合一夜之间涨了十几万。\n' +
      '兴奋过后，一个念头爬上来：这真的是你的能力，还是运气？生物科技的临床试验本质上就是抛硬币——只是你这次抛到了正面。下一次呢？',
    options: [
      {
        id: 'take_profit_reinvest',
        label: '获利了结，把利润分散到其他标的',
        description: '落袋为安，别让一次好运变成下次的赌资',
        hint: '投资分析+8 · 存款+80000 · 信念+5 · 压力-5 · bioPortfolio调整',
        hintColor: 'positive',
        skillGains: { investmentSkill: 8 },
        // adjustBioPortfolio负值=卖出（自动加现金），正值=买入（自动扣现金），不使用savingsChange避免双重扣费
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
          adjustBioPortfolio(s, -120000); // 卖出12万落袋
          adjustBioPortfolio(s, 40000);   // 用4万分散布局其他标的
        },
        log: '{age}岁，你卖掉了一半仓位，把利润落袋。你用这笔钱又布局了三家不同阶段的生科公司。同事问你怎么不梭哈，你说："赌赢一次是运气，赌赢一辈子才叫本事。留住利润，才有下一局的筹码。"',
      },
      {
        id: 'double_down',
        label: '加仓，赌三期临床继续成功',
        description: '趋势确立了就该上杠杆，机会不等人',
        hint: '投资分析+6 · 信念+8 · 压力+12 · bioPortfolio激增↑↑',
        hintColor: 'danger',
        skillGains: { investmentSkill: 6 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.stress = clamp(s.stress + 12, 0, 100);
          adjustBioPortfolio(s, -40000);
          adjustBioPortfolio(s, 90000);
        },
        log: '{age}岁，你没止盈，反而加了仓。你觉得二期都过了，三期还会远吗？你的组合市值冲到了三十多万。你给自己倒了一杯红酒——白藜芦醇嘛，你笑着说。但你心里清楚：三期临床的成功率只有三成，你现在的每一分浮盈，都悬在三期结果的那一根线上。',
      },
      {
        id: 'study_the_data',
        label: '深入研究临床数据，判断是真是假',
        description: '有些二期成功是统计学幻象，得看细节',
        hint: '投资分析+12 · 生物知识+8 · 信念+3 · 压力+4',
        hintColor: 'neutral',
        skillGains: { investmentSkill: 12, bioKnowledge: 8 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
          s.stress = clamp(s.stress + 4, 0, 100);
        },
        log: '{age}岁，你没急着数钱，而是把那篇临床报告逐字读了一遍。你发现样本量只有48人，主要终点的p值卡在0.04边缘，脱落率偏高。你心里咯噔一下——这数据漂亮，但不够硬。你减持了三成，留着观察。你学会了一件事：在生物科技里，"成功"和"看起来成功"是两回事。',
      },
    ],
  },

  // 30岁：结识长寿创业者
  {
    id: 'bio_inv_founder_meeting',
    title: '布道者',
    sceneTag: 'conference',
    pathId: 'bio_gambler',
    branch: 'bio_investor',
    ageRange: [30, 30],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    narrative:
      '一场长寿科技峰会的茶歇时间，你端着咖啡，忽然有人拍了拍你的肩——一位头发花白但眼神锐利的中年人，做表观遗传重编程的初创公司创始人，你读过他的论文。"你就是那个在雪球写抗衰投资系列的人吧？写得不错，比大多数分析师懂生物学。"\n' +
      '你们聊了两个小时。他的激情像火焰，你几乎要被点燃——但你也注意到，他回避了关于现金流的提问，对监管风险轻描淡写。先知还是骗子？有时候连他们自己都分不清。',
    options: [
      {
        id: 'invest_in_his_startup',
        label: '投他的天使轮，赌这个人',
        description: '赛道对、人对，值得用早期价格博一个未来',
        hint: '投资分析+10 · 信念+8 · 压力+8 · 存款-50000(买入bioPortfolio)',
        hintColor: 'danger',
        skillGains: { investmentSkill: 10 },
        // 注意：adjustBioPortfolio(50000)已自动从存款扣钱，不需要savingsChange
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
          adjustBioPortfolio(s, 50000);
        },
        log: '{age}岁，你把五万块投进了他的天使轮，拿到0.5%的股权。没尽调、没对赌、没退出条款——你赌的是这个人。签完字那天你在动态圈发了一句"all in 人类未来"，然后默默设了个提醒：三年后回头看，这是个先知，还是个故事。',
      },
      {
        id: 'advise_not_invest',
        label: '做他的顾问，但不投钱',
        description: '保持距离，用专业知识换信息和人情',
        hint: '投资分析+8 · 生物知识+8 · 信念+4 · 月薪+2000',
        hintColor: 'neutral',
        skillGains: { investmentSkill: 8, bioKnowledge: 8 },
        salaryChange: 2000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '{age}岁，你成了他的"外部科学顾问"，每月开一次会，帮他看数据、理管线。你没投一分钱，但你拿到了行业内幕的第一手信息。通讯录里多了几十个名字，你把其中几个标了星——先混进去，下不下注，以后再说。',
      },
      {
        id: 'stay_skeptical',
        label: '保持警惕，他回避的问题就是答案',
        description: '回避现金流和监管的人，多半有问题',
        hint: '投资分析+10 · 生物知识+4 · 信念-2 · 压力+2',
        hintColor: 'neutral',
        skillGains: { investmentSkill: 10, bioKnowledge: 4 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith - 2, 0, 100);
          s.stress = clamp(s.stress + 2, 0, 100);
        },
        log: '{age}岁，你和他加了社交软件，但没投钱。回去后你查了他的上一家公司——倒闭了，投资人血本无归。你倒吸一口凉气。你给他发了条"再观察观察"，他再没回过你。你把他发来的那份BP删了，清空了回收站。屏幕暗下来，映出你自己的脸。',
      },
    ],
  },

  // 33岁：生物科技泡沫
  {
    id: 'bio_inv_bubble',
    title: '泡沫',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    branch: 'bio_investor',
    ageRange: [33, 33],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    narrative:
      '一夜之间，"长寿"成了资本市场的宠儿。连做保健品的、卖假药的、搞微商的，都给自己贴上"抗衰科技"的标签。你关注的几只生科股，市销率炒到了两百倍，有的连产品都没有就市值百亿。出租车司机都在聊"衰老细胞清除"，你妈问你"那个延长寿命的股票能不能买"。\n' +
      '你知道这意味着泡沫——但泡沫里也有真金，1999年互联网泡沫破裂，可亚马逊和谷歌活了下来。问题在于：谁是亚马逊，谁是Pets.com？潮水退去的时候，没穿裤子的会很难看。',
    options: [
      {
        id: 'take_profits_now',
        label: '大幅减仓，落袋为安',
        description: '泡沫破裂只是时间问题，先把利润锁住',
        hint: '投资分析+8 · 存款+150000 · 信念-2 · 压力-8 · bioPortfolio↓',
        hintColor: 'positive',
        skillGains: { investmentSkill: 8 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith - 2, 0, 100);
          s.stress = clamp(s.stress - 8, 0, 100);
          adjustBioPortfolio(s, -150000); // 卖出15万落袋
        },
        log: '{age}岁，你把组合砍到了三成仓位，落袋了十五万利润。三个月后，生科板块崩盘，你重仓过的那只明星股从高点跌了七成。你看着账户里剩下的三成仓位——也腰斩了，但比起那些满仓的人，你已经赢了。你想起一句话：会买的是徒弟，会卖的是师傅。',
      },
      {
        id: 'rotate_to_quality',
        label: '换仓到真正有管线的龙头',
        description: '泡沫会破，但好公司会穿越周期',
        hint: '投资分析+12 · 生物知识+6 · 信念+4 · 压力+6 · bioPortfolio重组',
        hintColor: 'neutral',
        skillGains: { investmentSkill: 12, bioKnowledge: 6 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          s.stress = clamp(s.stress + 6, 0, 100);
          adjustBioPortfolio(s, -30000);
          adjustBioPortfolio(s, 35000);
        },
        log: '{age}岁，你没逃，而是换仓。你卖掉了那些PPT公司，把钱集中到三四家有真实管线、有现金流、有FDA孤儿药资格的龙头上。泡沫破裂时它们也跌，但跌得少、回得快。两年后你的组合创新高。你关掉行情软件，泡了杯茶。窗外有人在放风筝，线很细，但你看得见它一直在那。',
      },
      {
        id: 'ride_the_wave',
        label: '顺势加仓，泡沫里也能赚钱',
        description: '只要音乐没停，就接着跳',
        hint: '投资分析+4 · 信念+6 · 压力+12 · bioPortfolio大起大落',
        hintColor: 'danger',
        skillGains: { investmentSkill: 4 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.stress = clamp(s.stress + 12, 0, 100);
          adjustBioPortfolio(s, 80000);
          adjustBioPortfolio(s, -40000);
        },
        log: '{age}岁，你选择了贪婪。你加了仓，甚至上了两倍杠杆。前半年你赚得盆满钵满，账户浮盈翻倍。但崩盘来得比你想的快——一周内你的利润蒸发殆尽，本金也折了三成。你盯着那条垂直下跌的K线，第一次明白：泡沫里赚的钱，是借来的，迟早要还。',
      },
    ],
  },

  // 35岁：组合再平衡
  {
    id: 'bio_inv_rebalance',
    title: '天平',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    branch: 'bio_investor',
    ageRange: [35, 35],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你打开账户，组合已经膨胀到一个让你自己都心慌的数字。但仔细看，七成的仓位集中在两只股票上——一只做线粒体健康的，一只做衰老细胞清除的。它们都涨得好，但命运绑在同一个赌注上：抗衰技术会在十年内突破。你做了一个压力测试——如果这两只同时腰斩，你的组合会回到三年前。\n' +
      '你在白板上画了一个天平，左边写"集中"，右边写"分散"。你想起巴菲特那句话："分散是无知的保护伞。"但你不是巴菲特，你赌的是一个还没验证的赛道。',
    options: [
      {
        id: 'rebalance_to_60_40',
        label: '再平衡到60%生科/40%宽基',
        description: '留足子弹，抗衰是长期赌注，不必all in',
        hint: '投资分析+10 · 信念+2 · 压力-8 · bioPortfolio稳健',
        hintColor: 'positive',
        skillGains: { investmentSkill: 10 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 2, 0, 100);
          s.stress = clamp(s.stress - 8, 0, 100);
          adjustBioPortfolio(s, -80000);
        },
        log: '{age}岁，你把四成仓位挪到了指数基金和债券上。生科组合还是主力，但不再赌命。你跟自己说："抗衰是马拉松，不是百米冲刺。留着退路，才能跑完全程。"那天晚上你睡了这两年最踏实的一觉。',
      },
      {
        id: 'stay_concentrated',
        label: '维持集中，信念不变',
        description: '看懂了就该重仓，分散是投降',
        hint: '投资分析+6 · 信念+8 · 压力+6 · bioPortfolio不动',
        hintColor: 'neutral',
        skillGains: { investmentSkill: 6 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.stress = clamp(s.stress + 6, 0, 100);
        },
        log: '{age}岁，你看着那个天平，最终没动。你想：你之所以能走到今天，靠的就是集中下注的勇气。现在分散，等于否定过去十年的自己。你告诉自己："信念不是用来动摇的，是用来兑现的。"但你睡前还是多看了一眼手机上的股价。',
      },
      {
        id: 'hedge_with_puts',
        label: '买入看跌期权对冲尾部风险',
        description: '不卖股票，但花小钱买个保险',
        hint: '投资分析+12 · 信念+3 · 压力+2 · 存款-15000 · bioPortfolio受保护',
        hintColor: 'neutral',
        skillGains: { investmentSkill: 12 },
        savingsChange: -15000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
          s.stress = clamp(s.stress + 2, 0, 100);
        },
        log: '{age}岁，你花了点小钱买了两只重仓股的看跌期权。你说不清这是保险还是心虚，但你知道：在这个赛道，黑天鹅比白马常见。三个月后其中一只出了临床事故，期权让你的损失减半。你喝了口茶，心想：花小钱买心安，值。',
      },
    ],
  },

  // 37岁：Pre-IPO打新机会
  {
    id: 'bio_inv_ipo',
    title: '入场券',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    branch: 'bio_investor',
    ageRange: [37, 37],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你的投行朋友发来一条加密消息："有一家做线粒体疗法的公司要IPO了，基石投资者还差一点额度，你要不要？"你研究了一周：技术是真技术，管线是实管线，团队是顶尖团队。估值不便宜，但比起二级市场炒起来的那些，合理得多。问题是，基石投资者有锁定期——上市后半年不能卖，半年里什么都有可能发生。\n' +
      '这是一张稀有的入场券，但门槛是把一大笔钱锁住半年。十年前你赌的是方向；现在你赌的是时机。',
    options: [
      {
        id: 'take_ipo_allocation',
        label: '拿下基石额度，重仓打新',
        description: '这种机会几年才有一次，错过可能再没有',
        hint: '投资分析+8 · 信念+6 · 压力+8 · 存款-50000 · 禁售期后bioPortfolio≈170000(赚12万)',
        hintColor: 'danger',
        skillGains: { investmentSkill: 8 },
        // 注意：adjustBioPortfolio(50000)会自动从存款扣5万并加到bioPortfolio，不需要savingsChange
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
          // 基石投资：5万锁仓半年
          adjustBioPortfolio(s, 50000);
          // 半年解禁后赚了十多万：5万本金变成约17万（+12万浮盈兑现后仍留在组合里）
          // 直接给bioPortfolio加12万收益（不从存款扣，这是投资增值）
          (s as any).bioPortfolio = ((s as any).bioPortfolio || 0) + 120000;
          updateBioAllocation(s);
        },
        log: '{age}岁，你签了基石协议，把五万锁进了半年不能动的仓位。上市首日涨了三成，你在禁售期里每天盯着那条曲线，既期待又煎熬。半年解禁那天，你赚了十多万。你把那张基石协议的电子合同存进了网盘的"里程碑"文件夹——财富的跃迁，有时就靠几张盖了章的入场券。',
      },
      {
        id: 'buy_after_ipo',
        label: '放弃基石，上市后二级市场买',
        description: '不锁定，灵活进出，代价是买得贵',
        hint: '投资分析+6 · 信念+2 · 压力+3 · 存款-20000 · bioPortfolio买入2万(溢价20%)',
        hintColor: 'neutral',
        skillGains: { investmentSkill: 6 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 2, 0, 100);
          s.stress = clamp(s.stress + 3, 0, 100);
          // 在二级市场花2万买入（买得贵了两成=同样钱买到更少份额）
          adjustBioPortfolio(s, 20000);
        },
        log: '{age}岁，你没拿基石，而是等它上市后在二级市场买了一些。买得贵了两成，但你睡得着觉——钱在自己手里，随时能跑。后来它涨了，你没赚最多，但你也没被锁死在某个暴跌的夜晚。你学会接受：安稳的代价，是少赚。',
      },
      {
        id: 'pass_and_observe',
        label: '放弃，继续观察它的管线进展',
        description: '估值已透支预期，等回调或等数据',
        hint: '投资分析+10 · 生物知识+5 · 信念+1 · 压力-2',
        hintColor: 'neutral',
        skillGains: { investmentSkill: 10, bioKnowledge: 5 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 1, 0, 100);
          s.stress = clamp(s.stress - 2, 0, 100);
        },
        log: '{age}岁，你算了算估值，觉得贵了。你选择观望。三个月后它的二期数据不及预期，股价腰斩。你躲过一劫。朋友说你"神机妙算"，你知道不是——你只是被过去十年的教训教会了：不属于自己的钱，不眼红。',
      },
    ],
  },

  // 39岁：加入/组建长寿基金
  {
    id: 'bio_inv_longevity_fund',
    title: '庄家',
    sceneTag: 'cafe',
    pathId: 'bio_gambler',
    branch: 'bio_investor',
    ageRange: [39, 39],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '一个家族办公室的人找上你："我们想设一支长寿主题基金，需要一个既懂生物学又懂投资的人来管。你愿意聊聊吗？"你在这行浸了十几年，从散户做到了有一群跟随者的"抗衰投资KOL"。雪球专栏每篇阅读十万加，组合年化跑赢所有生科指数。现在有人要把几个亿交给你管，抽成2%+20%。\n' +
      '但你清楚，管自己的钱和管理别人的钱是两回事——赚了你分两成，亏了你不用赔，但名声会碎。这不再是赌自己的未来，而是把"赌抗衰"变成你的事业。',
    options: [
      {
        id: 'launch_fund',
        label: '出来单干，成立自己的基金',
        description: '拿出存款的一部分作为启动资金，把十几年积累变成事业，投得越多盘子越大，赌一把大的',
        hint: '投资分析+12 · 生物知识+5 · 信念+10 · 压力+12 · 投入存款50% · 被动收入+年化50%',
        hintColor: 'danger',
        skillGains: { investmentSkill: 12, bioKnowledge: 5 },
        savingsChangeFn: (s: GameState) => -pctInvestment(0.50, 0.50).investFn(s),
        passiveIncomeChangeFn: (s: GameState) => pctInvestment(0.50, 0.50).returnFn(s),
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.stress = clamp(s.stress + 12, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          // 成立基金后，bioPortfolio大幅跃升（管理别人的钱+跟投，你的生物投资组合质变）
          const port = (s as any).bioPortfolio || 0;
          (s as any).bioPortfolio = Math.round(port * 2.5 + 100000);
          s.currentProfession = '自由职业'; // 基金经理是自由职业，不触发通用公司事件
        },
        log: '{age}岁，你拿出积蓄的一半作为启动资金，辞了职，注册了一家小型基金。第一批LP是你雪球的铁粉和几个家族办公室。你拿着两亿的盘子，每一笔投的都是你研究过的抗衰公司。投入越多，基金的初始盘子就越大。你不再是赌徒，你是这场赌局的庄家之一。你跟自己说：这次，你不只是在赌自己的命，你在赌整个行业的命。',
      },
      {
        id: 'be_lp_only',
        label: '只做LP，把钱交给专业机构管',
        description: '拿出存款的一部分投入基金做LP，享受赛道收益，不背运营压力，投得越多分红越多',
        hint: '投资分析+8 · 信念+4 · 压力+2 · 投入存款50% · 被动收入+年化30%',
        hintColor: 'neutral',
        skillGains: { investmentSkill: 8 },
        savingsChangeFn: (s: GameState) => -pctInvestment(0.50, 0.30).investFn(s),
        passiveIncomeChangeFn: (s: GameState) => pctInvestment(0.50, 0.30).returnFn(s),
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          s.stress = clamp(s.stress + 2, 0, 100);
        },
        log: '{age}岁，你没出来创业，而是拿出积蓄的一半投进了那支长寿基金做LP。投入越多，你拿到的基金份额就越大。你享受赛道收益，但不用操心尽调、路演、LP关系。你继续写你的专栏，继续管自己的组合。LP的份额确认邮件躺在收件箱里，你回了句"合作愉快"，关上电脑去遛了圈狗。当不了将军也没关系，做将军背后那个递子弹的人，也挺好。',
      },
      {
        id: 'stay_independent',
        label: '保持独立，只管自己的钱',
        description: '管别人的钱会扭曲判断，宁可少赚也要自由',
        hint: '投资分析+10 · 信念+5 · 幸福+6 · 压力-4',
        hintColor: 'neutral',
        skillGains: { investmentSkill: 10 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.happiness = clamp(s.happiness + 6, 0, 100);
          s.stress = clamp(s.stress - 4, 0, 100);
        },
        log: '{age}岁，你拒绝了那个offer。你想起一句话："管别人的钱，你就不再自由。"你继续用自己研究、自己下注、自己承担。赚的不如基金经理多，但你看盘的时候不用想"LP会怎么想"。收盘后你关掉软件，下楼跑了五公里——少赚的那部分，换来的是晚上能睡整觉。',
      },
    ],
  },

  // 41岁：AI制药浪潮
  {
    id: 'bio_inv_ai_drug_discovery',
    title: '加速',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    branch: 'bio_investor',
    ageRange: [41, 41],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你关注的一个做AI制药的公司，用大模型筛选靶点，把一个抗衰候选药物的发现周期从五年压缩到了八个月，临床前数据好得离谱。你赌了十几年的"抗衰技术会突破"，可能等不到慢慢来了——它会被AI一把引爆。原本你预估突破要等到五十岁，现在可能四十多岁就能看到曙光。\n' +
      '但你也警惕：AI制药的概念股已经炒了一轮，泥沙俱下，真正的赢家可能只有两三家。这是一次范式转移，也是一次重新洗牌——你过去的经验，可能正好是你最大的障碍。',
    options: [
      {
        id: 'invest_ai_drug_leader',
        label: '重仓AI制药龙头',
        description: '范式转移的赢家通吃，要上就上最强的',
        hint: '投资分析+12 · 生物知识+8 · 信念+8 · 压力+8 · bioPortfolio+80000',
        hintColor: 'positive',
        skillGains: { investmentSkill: 12, bioKnowledge: 8 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
          adjustBioPortfolio(s, -50000);
          adjustBioPortfolio(s, 130000);
        },
        log: '{age}岁，你把组合里三成调到了那家AI制药龙头。你的判断是：药物发现周期的缩短，会让抗衰突破比你预期的早五到十年。一年后它和一家大药企达成授权合作，股价翻倍。你看着账户，心想：原来你赌了十几年的"未来"，是被一行代码加速到来的。',
      },
      {
        id: 'invest_pick_and_shovel',
        label: '投资"卖铲子"的AI平台公司',
        description: '不赌谁能发现药，赌谁在提供发现药的工具',
        hint: '投资分析+10 · 生物知识+6 · 信念+5 · 压力+4 · bioPortfolio+40000',
        hintColor: 'neutral',
        skillGains: { investmentSkill: 10, bioKnowledge: 6 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.stress = clamp(s.stress + 4, 0, 100);
          adjustBioPortfolio(s, -30000);
          adjustBioPortfolio(s, 70000);
        },
        log: '{age}岁，你没赌谁能做出药，而是投了一家给所有药企提供AI靶点筛选平台的公司。你没急着数钱，先把它写进了专栏：淘金热里最稳的，是卖铲子的。两年后它的客户从五家涨到五十家，你的仓位稳步上涨。你把"卖铲子"三个字设成了文章的标签——在不确定里找确定，这招比挖金子靠谱。',
      },
      {
        id: 'wait_for_clarity',
        label: '观望，等技术路线分化后再下注',
        description: '现在太早太乱，等第一轮淘汰后再进',
        hint: '投资分析+8 · 生物知识+10 · 信念+2 · 压力-2',
        hintColor: 'neutral',
        skillGains: { investmentSkill: 8, bioKnowledge: 10 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 2, 0, 100);
          s.stress = clamp(s.stress - 2, 0, 100);
        },
        log: '{age}岁，你忍住了冲动，选择观望。你看了十几家AI制药公司，发现技术路线五花八门，谁也说服不了谁。你决定等两年，等第一轮临床数据淘汰掉骗子公司再进。后来你确实错过了最早的涨幅，但你也没踩到那些归零的雷。你接受：不赚第一个铜板，是为了不亏最后一个。',
      },
    ],
  },

  // 43岁：突破性疗法获批
  {
    id: 'bio_inv_breakthrough_approval',
    title: '兑现',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    branch: 'bio_investor',
    ageRange: [43, 43],
    priority: 7,
    weight: 10,
    oncePerGame: true,
    eventType: 'milestone',
    narrative:
      'FDA批准了第一个真正意义上的"抗衰老"疗法——它瞄准衰老机制本身，清除衰老细胞，用于延缓与年龄相关的功能衰退。虽然不是你重仓的那家，但你比谁都兴奋——因为这意味着路是通的。整个板块沸腾，你的组合一天涨了六成。\n' +
      '你打开窗户，深吸一口气。多年前那个在出租屋台灯下对着论文摘要皱眉头的年轻人，大概没想到它变成了FDA盖章的现实。你赌的不是某只股票，你赌的是人类不会向衰老投降。你赌对了。',
    options: [
      {
        id: 'realize_gains',
        label: '大幅获利了结，锁定这场赌局的果实',
        description: '十几年了，是时候把账面数字变成真金白银',
        hint: '投资分析+8 · 存款+120000 · 信念+10 · 幸福+10 · 压力-10',
        hintColor: 'positive',
        skillGains: { investmentSkill: 8 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.stress = clamp(s.stress - 10, 0, 100);
          adjustBioPortfolio(s, -120000); // 卖出12万利润落袋
        },
        log: '{age}岁，你按下了"卖出"。十二万利润落袋，你的银行账户第一次有了一个让你安心的数字。你没有全清——你还留了三成仓位，赌接下来的十年会有更多突破。但你知道，从今天起，你已经不是一个纯粹的赌徒了。你是一个赢了赌局的赌徒。',
      },
      {
        id: 'reinvest_in_wave2',
        label: '把利润投入第二波抗衰公司',
        description: '第一个获批只是开始，真正的浪潮还在后面',
        hint: '投资分析+12 · 生物知识+8 · 信念+8 · 压力+6 · bioPortfolio重构↑',
        hintColor: 'positive',
        skillGains: { investmentSkill: 12, bioKnowledge: 8 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.stress = clamp(s.stress + 6, 0, 100);
          adjustBioPortfolio(s, 80000);
        },
        log: '{age}岁，你没止盈，而是换仓。你卖掉已经兑现的，把资金投进了做表观遗传重编程、线粒体疗法、器官再生的新一批公司。你把新标的逐个加入自选，敲下回车。第一个获批证明路通了，接下来是一整条高速公路——你不图一辆车的票价，图的是整条公路的过路费。',
      },
      {
        id: 'become_advocate',
        label: '用投资人的身份推动抗衰普及',
        description: '钱赚够了，现在想让更多人受益',
        hint: '投资分析+6 · 生物知识+10 · 信念+12 · 幸福+8 · 被动收入+10000',
        hintColor: 'positive',
        skillGains: { investmentSkill: 6, bioKnowledge: 10 },
        passiveIncomeChange: 10000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
        },
        log: '{age}岁，你开始用你的影响力做另一件事——推动抗衰疗法的可及性。你写了篇长文，呼吁把抗衰纳入医保讨论，又捐了一笔钱给做衰老科普的机构。文章发出后转发涨得很快，你刷新了几次，关掉页面。这项技术若只属于富人，赢的也只是少数人——你押的从来是更多的人能多活几年。',
      },
    ],
  },

  // 45岁：组合市值创新高，面临退休抉择
  {
    id: 'bio_inv_portfolio_peak',
    title: '丰收',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    branch: 'bio_investor',
    ageRange: [45, 45],
    priority: 7,
    weight: 10,
    oncePerGame: true,
    narrative:
      '{age}岁，你的生科组合市值来到了一个你{startAge}岁时想都不敢想的数字。二十多年的复利、十几年的赛道押注、无数次临床数据的惊魂，全都凝结在这个数字里。你的身体状态比同龄人年轻七八岁，补剂柜还在，CGM还在手腕上——抗衰技术不是幻想了，它正在变成现实。\n' +
      '但"退休"在这里有另一层含义：你不是要停下来，你是有资格停下来思考了。如果人能活到一百二，那四十五岁算什么？算前半场结束。问题是：后半场，你要怎么打？',
    options: [
      {
        id: 'semi_retire_invest',
        label: '半退休，只留核心仓位继续观察',
        description: '钱够了，把时间还给生活和健康',
        hint: '投资分析+6 · 信念+8 · 幸福+10 · 压力-12 · 健康+5 · bioPortfolio保留',
        hintColor: 'positive',
        skillGains: { investmentSkill: 6 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.stress = clamp(s.stress - 12, 0, 100);
          s.health = clamp(s.health + 5, 0, 100);
        },
        log: '{age}岁，你把大部分仓位变现，只留了两只最看好的长期持有。你不再每天盯盘，而是把时间还给了运动、睡眠、家人和那本一直想写的书。书的开头你写得很慢，但每天写一点。剩下的那两只仓位没动，就当给"活到一百二"留的期权费。',
      },
      {
        id: 'full_retire_enjoy',
        label: '彻底退休，享受延长的健康寿命',
        description: '钱够了，身体也好，是时候活了',
        hint: '信念+10 · 幸福+10 · 压力-12 · 健康+8 · bioPortfolio变现',
        hintColor: 'positive',
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.stress = clamp(s.stress - 12, 0, 100);
          s.health = clamp(s.health + 8, 0, 100);
          adjustBioPortfolio(s, -getBioPortfolio(s));
        },
        log: '{age}岁，你清了仓。二十多年的赌局，到此为止。你把钱分成了三份：一份生活，一份健康，一份留给未来可能的抗衰疗法。你约了个体检，又订了去冰岛的机票——赌了半辈子"活得更久"，现在该去看看极光了，趁还看得见。',
      },
      {
        id: 'keep_going',
        label: '不退休，这场赌局还没结束',
        description: '抗衰才刚开始，你要参与到底',
        hint: '投资分析+10 · 信念+12 · 压力+4 · bioPortfolio继续↑',
        hintColor: 'neutral',
        skillGains: { investmentSkill: 10 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.stress = clamp(s.stress + 4, 0, 100);
          adjustBioPortfolio(s, 60000);
        },
        log: '{age}岁，你没退休。你跟自己说：第一个抗衰疗法获批只是开了个头，后面的二十年才是正戏。你继续研究、继续下注、继续写专栏。有些人退休是为了停，你"不退休"是为了不停——赌徒最怕的不是输，是没得赌了。',
      },
    ],
  },
];

// ============================================================
// 自体实验线事件（ages 26-45）
// ============================================================

const experimenterEvents: NarrativeEvent[] = [

  // 26岁：第一次系统自体实验
  {
    id: 'bio_exp_first_self_experiment',
    title: '小白鼠',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    branch: 'bio_experimenter',
    ageRange: [26, 26],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你在Excel里设计了一份实验方案：基线期两周，干预期四周，洗脱期两周。变量是雷帕霉素的低剂量间歇给药，终点是炎症因子和自噬标志物的变化。室友路过看了一眼，倒吸一口凉气："你这是要给自己治病？"你说："不，是给自己升级。"\n' +
      '第一次给自己指尖采血，针扎下去那一下比想象中疼。你挤出几滴血滴进试剂卡，等待结果的十五分钟里，你忽然有一种奇异的感觉——你既是实验者，也是受试者；既是医生，也是病人。这世上没有比这更纯粹的科学了。',
    options: [
      {
        id: 'rigorous_protocol',
        label: '严格按方案执行，记录每个变量',
        description: '控制饮食、睡眠、运动，只让一个变量变化',
        hint: '健康优化+12 · 生物知识+8 · 健康+4 · 压力+8 · 信念+5 · biologicalAge-1',
        hintColor: 'positive',
        skillGains: { healthOptSkill: 12, bioKnowledge: 8 },
        stateEffect: (s) => {
          s.health = clamp(s.health + 4, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          adjustBiologicalAge(s, -1);
        },
        log: '{age}岁，你完成了人生第一个N=1实验。六周后，你的炎症因子降了三成，自噬标志物升高了。你不确定是雷帕霉素的作用，还是你这六周作息更规律了。但数据是真实存在的。你在笔记本上写下："实验1完成。结论：方向对，需重复。"',
        blindBoxTrigger: 'bio_self_experiment',
      },
      {
        id: 'learn_lab_skills',
        label: '先学采血和检测技术，保证数据质量',
        description: '垃圾进垃圾出，数据不准等于没做',
        hint: '生物知识+12 · 健康优化+5 · 信念+4 · 压力+4',
        hintColor: 'neutral',
        skillGains: { bioKnowledge: 12, healthOptSkill: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '{age}岁，你没急着给药，而是花了一个月学采血、学检测、学统计。你发现自己之前的采血手法会导致溶血，数据根本不能用。你重新做了基线，这回的数据干净多了。吃补剂容易，对着自己跑出来的烂数据说"这不能用"，才真难。',
      },
      {
        id: 'join_n_of_many',
        label: '加入群体自体实验社区，用样本量换信度',
        description: '一个人的数据不可靠，一群人的数据有意义',
        hint: '健康优化+8 · 生物知识+10 · 幸福+4 · 信念+5',
        hintColor: 'neutral',
        skillGains: { healthOptSkill: 8, bioKnowledge: 10 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '{age}岁，你加入了一个"N=many"的自体实验社区。你们共享方案、共享数据、互相复核。你的雷帕霉素实验和另外十二个人的数据合并后，趋势变得清晰了。十二条曲线叠在一起，噪声被压平——一个人的实验是故事，叠成一摞，才像点科学的样子。',
      },
    ],
  },

  // 28岁：补剂堆栈优化
  {
    id: 'bio_exp_supplement_stack',
    title: '鸡尾酒',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    branch: 'bio_experimenter',
    ageRange: [28, 28],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你的补剂柜已经像一个微型药房了：NMN、NR、白藜芦醇、槲皮素、二甲双胍、雷帕霉素……每天早中晚三顿，每顿六七粒。上周体检报告出来——ALT偏高，肝功能异常。医生说"可能跟补剂有关，停几种看看"。你停了三天，晚上焦虑得睡不着，又把它们加回来了。ALT还是高，但你不去复查。\n' +
      '你盯着那一排瓶子，忽然分不清自己是在优化身体，还是在用补剂管理焦虑。也许有一半是安慰剂，但你不敢停——万一停了那一个是有效的呢？',
    options: [
      {
        id: 'streamline_stack',
        label: '精简到有证据的核心几样',
        description: '只留人体数据最充分的，其余停掉',
        hint: '健康优化+10 · 生物知识+8 · 健康+4 · 压力-6 · 存款+3000 · 信念+4',
        hintColor: 'positive',
        skillGains: { healthOptSkill: 10, bioKnowledge: 8 },
        savingsChange: 3000,
        stateEffect: (s) => {
          s.health = clamp(s.health + 4, 0, 100);
          s.stress = clamp(s.stress - 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '{age}岁，你把补剂从二十几种砍到了六种：NMN、维D、Omega-3、镁、二甲双胍、雷帕霉素。停掉那些的瞬间你有点慌，但两个月后复查，指标没变差，反而肝肾负担轻了。你把那十几瓶排成一排，挑出六瓶，其余扔进了垃圾桶。玻璃碰撞的声音很脆。',
      },
      {
        id: 'test_interactions',
        label: '系统测试相互作用，逐个加减',
        description: '每两周只增减一种，看指标变化',
        hint: '健康优化+12 · 生物知识+10 · 健康+3 · 压力+8 · 存款-2000',
        hintColor: 'neutral',
        skillGains: { healthOptSkill: 12, bioKnowledge: 10 },
        savingsChange: -2000,
        stateEffect: (s) => {
          s.health = clamp(s.health + 3, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '{age}岁，你花了一年做"加减法实验"。你发现停掉白藜芦醇后炎症反而降了，加上非瑟酮后关节舒服了。你画出了一张"补剂效果地图"，标注了每种对你个人的真实影响。精准比堆量重要得多——你把地图贴在冰箱上，每天看一眼。',
      },
      {
        id: 'embrace_the_stack',
        label: '相信整体效应，继续全栈服用',
        description: '也许单独无效，组合起来有协同',
        hint: '健康优化+6 · 健康+2 · 压力+5 · 存款-4000 · 信念+3',
        hintColor: 'neutral',
        skillGains: { healthOptSkill: 6 },
        savingsChange: -4000,
        stateEffect: (s) => {
          s.health = clamp(s.health + 2, 0, 100);
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '{age}岁，你选择相信"鸡尾酒效应"。你没精简，反而又加了两种。你跟自己说：也许每一种单独都微弱，但合在一起就是复利。但你心里隐隐知道，你停不下来的原因，不全是科学，是恐惧——怕停了就输了。',
      },
    ],
  },

  // 29岁：CGM/可穿戴数据沉迷
  {
    id: 'bio_exp_cgm_obsession',
    title: '上瘾',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    branch: 'bio_experimenter',
    ageRange: [29, 29],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你身上挂着三个设备：手臂上的CGM、手腕上的心率表、戒指里的睡眠追踪器，手机里有七八个APP分别监测血糖、HRV、血氧、深睡时长、体温。你开始对数字产生依赖——某天HRV比平时低10，你就焦虑一整天；某天深睡少了一刻钟，你就推掉所有应酬。你的生活不再是"为了活得好"，而是"为了让数字好看"。\n' +
      '伴侣看你睡前花二十分钟同步三个设备的数据，叹了口气："你测了这么多，你快乐吗？"你愣住了。你忽然意识到，你正在用"健康"的名义，把自己关进一个由数字围成的笼子。',
    options: [
      {
        id: 'digital_detox',
        label: '戒掉部分设备，回归身体感受',
        description: '数据是工具不是主人，学会听身体的声音',
        hint: '健康优化+8 · 幸福+8 · 健康+3 · 压力-8 · 信念+2',
        hintColor: 'positive',
        skillGains: { healthOptSkill: 8 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.health = clamp(s.health + 3, 0, 100);
          s.stress = clamp(s.stress - 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 2, 0, 100);
        },
        log: '{age}岁，你摘掉了戒指和心率表，只留CGM。前三天你浑身不自在，像丢了魂。但一周后你发现，没有那些数字，你反而更放松了，睡得更好了。你重新学会了一件失传的技能：感觉累就去睡，感觉饱就停下。身体本来就有一套反馈系统，你只是太久没听了。',
      },
      {
        id: 'data_driven_optimization',
        label: '用数据做更精细的优化',
        description: '沉迷是问题，但数据本身没错，优化使用方式',
        hint: '健康优化+12 · 生物知识+6 · 健康+4 · 压力+6 · 信念+4 · biologicalAge-1',
        hintColor: 'neutral',
        skillGains: { healthOptSkill: 12, bioKnowledge: 6 },
        stateEffect: (s) => {
          s.health = clamp(s.health + 4, 0, 100);
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          adjustBiologicalAge(s, -1);
        },
        log: '{age}岁，你没戒设备，但立了规矩：只看周均值的趋势，不看单日波动。你用三个月的HRV数据发现，冷水澡和深睡正相关，酒精和深睡负相关。你把酒戒了，把冷水澡固定了。数据没让你自由，但让你精确。',
      },
      {
        id: 'accept_imperfection',
        label: '接受数据的不完美，不再追求满分',
        description: '人是活的，数字是死的，别本末倒置',
        hint: '健康优化+6 · 幸福+6 · 信念+3 · 压力-4',
        hintColor: 'neutral',
        skillGains: { healthOptSkill: 6 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
          s.stress = clamp(s.stress - 4, 0, 100);
        },
        log: '{age}岁，你给所有APP设了通知静默，只在每周日看一次数据。你跟自己说：身体的目的是生活，不是生产数据。偶尔HRV低一点，也许只是因为昨晚做了个噩梦。你开始允许自己"不完美"——这反而让你更健康了。',
      },
    ],
  },

  // 30岁：冷暴露与桑拿等极端方案
  {
    id: 'bio_exp_cold_sauna',
    title: '冰与火',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    branch: 'bio_experimenter',
    ageRange: [30, 30],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你在浴缸里放满了冰水，温度计显示4度。你深吸一口气，把自己浸了进去——冷得像被针扎，呼吸瞬间急促，大脑一片空白。两分钟后爬出来，浑身通红，却莫名地兴奋。这是你新的"鸡尾酒"：每周三次冷水澡，两次桑拿。你读到棕色脂肪、热休克蛋白的研究，相信这些"压力"能激活身体的抗衰机制（毒物兴奋效应）。\n' +
      '但你也会在凌晨四点冻得睡不着时怀疑：那些百岁老人，有几个是泡冰水泡出来的？也许他们只是晒太阳、种地、和家人吃饭、不焦虑。也许"健康"没那么复杂，是你把它搞复杂了。',
    options: [
      {
        id: 'commit_to_protocol',
        label: '坚持冷热交替方案',
        description: '相信hormesis，把不适当成训练',
        hint: '健康优化+12 · 健康+5 · 压力+4 · 幸福-2 · 信念+5 · biologicalAge-1',
        hintColor: 'positive',
        skillGains: { healthOptSkill: 12 },
        stateEffect: (s) => {
          s.health = clamp(s.health + 5, 0, 100);
          s.stress = clamp(s.stress + 4, 0, 100);
          s.happiness = clamp(s.happiness - 2, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          adjustBiologicalAge(s, -1);
        },
        log: '{age}岁，你把冰水浴和桑拿变成了雷打不动的仪式。三个月后你的基础代谢升了，冬天不怕冷了，连感冒都少了。你承认它有用，但你也在凌晨四点冻醒时问自己：这真的值得吗？你不确定，但你停不下来——因为你已经把"不舒服"当成了"有效"的证据。',
      },
      {
        id: 'moderate_version',
        label: '用温和版本：冷水澡+远红外桑拿',
        description: '不必极限，适度刺激即可',
        hint: '健康优化+8 · 健康+4 · 幸福+3 · 压力+1 · 信念+3',
        hintColor: 'neutral',
        skillGains: { healthOptSkill: 8 },
        stateEffect: (s) => {
          s.health = clamp(s.health + 4, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
          s.stress = clamp(s.stress + 1, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '{age}岁，你没买冰块，而是把淋浴最后两分钟调成冷水。桑拿也换成了温和的远红外。效果没有极限版那么"猛"，但你坚持得下来，也不至于半夜冻醒。你把"坚持"两个字写在浴室镜子上，水汽一蒸，第二天又得重写。',
      },
      {
        id: 'question_the_science',
        label: '质疑：这些真的有抗衰证据吗？',
        description: 'hormesis在小鼠身上有效，人体证据薄弱',
        hint: '生物知识+12 · 健康优化+4 · 信念-2 · 压力-2',
        hintColor: 'neutral',
        skillGains: { bioKnowledge: 12, healthOptSkill: 4 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith - 2, 0, 100);
          s.stress = clamp(s.stress - 2, 0, 100);
        },
        log: '{age}岁，你查了文献，发现冷暴露的人体抗衰证据几乎为零——大部分是小鼠和机制推测。你停了冰水浴，改成了规律的快走和阻力训练——这些有人体证据。冰桶送了人，跑步机留下了。你跟自己说，你反的从来不是传统，是"没证据的传统"。无聊的方案，反倒最靠得住。',
      },
    ],
  },

  // 32岁：延长断食
  {
    id: 'bio_exp_fasting',
    title: '空',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    branch: 'bio_experimenter',
    ageRange: [32, 32],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你已经做了两年16:8断食，现在想试更长——五天清水断食，触发更深层的自噬。你读完了Valter Longo关于模拟断食饮食（FMD）的研究，准备了电解质和监测计划。\n' +
      '第三天最难：头晕、乏力、嘴里有金属味，但大脑却异常清明——那种饥饿带来的、近乎禅定的清醒。第五天结束复食，复查显示干细胞标志物升高、炎症降了，但你也瘦了四斤，其中一半是肌肉。你盯着镜子：你是在重启身体，还是在透支它？饥饿也许是良药，但良药和毒药，往往只差剂量。',
    options: [
      {
        id: 'quarterly_long_fast',
        label: '每季度做一次五天断食',
        description: '相信自噬的清理效应，定期重启',
        hint: '健康优化+12 · 生物知识+6 · 健康+4 · 压力+8 · 幸福-3 · biologicalAge-2',
        hintColor: 'neutral',
        skillGains: { healthOptSkill: 12, bioKnowledge: 6 },
        stateEffect: (s) => {
          s.health = clamp(s.health + 4, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
          s.happiness = clamp(s.happiness - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          adjustBiologicalAge(s, -2);
        },
        log: '{age}岁，你把五天断食变成了每季度的仪式。每次结束你都有一种"重置"的感觉，指标也确实在改善。但你也在每个断食周的深夜里，盯着天花板想：你到底是在追求健康，还是在追求一种"我能控制自己身体"的掌控感？也许两者是一回事。',
      },
      {
        id: 'monthly_fmd',
        label: '改用每月一次模拟断食饮食',
        description: 'Longo的FMD方案，不那么极端也有自噬',
        hint: '健康优化+10 · 生物知识+8 · 健康+4 · 压力+3 · 信念+4 · biologicalAge-1',
        hintColor: 'positive',
        skillGains: { healthOptSkill: 10, bioKnowledge: 8 },
        stateEffect: (s) => {
          s.health = clamp(s.health + 4, 0, 100);
          s.stress = clamp(s.stress + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          adjustBiologicalAge(s, -1);
        },
        log: '{age}岁，你没硬撑清水断食，而是用了FMD——五天低热量、低蛋白、植物为主的饮食。没那么"纯"，但能坚持，肌肉也没掉那么多。你把Longo那本书翻到折角的那页又看了一遍——他设计这个方案，图的就是让人能坚持下来。能坚持的科学，才叫科学。',
      },
      {
        id: 'stick_to_daily_fast',
        label: '只保持日常16:8，不做极端断食',
        description: '极端断食伤肌肉，日常限制已足够',
        hint: '健康优化+8 · 健康+3 · 幸福+4 · 压力-3 · 信念+2',
        hintColor: 'neutral',
        skillGains: { healthOptSkill: 8 },
        stateEffect: (s) => {
          s.health = clamp(s.health + 3, 0, 100);
          s.happiness = clamp(s.happiness + 4, 0, 100);
          s.stress = clamp(s.stress - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 2, 0, 100);
        },
        log: '{age}岁，你试了一次五天断食，瘦了四斤，回来花了两个月才恢复肌肉。你决定不再做极端断食，只保持16:8。镜子里的自己瘦了一圈，但力量掉了。自噬是好事，可身体到底不是培养皿——你宁可慢一点、稳一点，也不拿透支换指标。',
      },
    ],
  },

  // 34岁：副作用
  {
    id: 'bio_exp_side_effects',
    title: '代价',
    sceneTag: 'clinic',
    pathId: 'bio_gambler',
    branch: 'bio_experimenter',
    ageRange: [34, 34],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    narrative:
      '最近你总觉得嘴里有溃疡，伤口愈合变慢，还动不动就感冒。免疫全套结果让你心凉：淋巴细胞计数偏低，CD4/CD8比值异常。医生问你最近在吃什么药，你报出一串名字，他皱起眉头："雷帕霉素是免疫抑制剂，你长期低剂量吃，相当于一直在压制自己的免疫系统。你觉得它在抗衰，它也在让你更容易感染。"\n' +
      '你坐在诊室里，第一次感到恐惧。你以为你在升级身体，也许你在拆解它。每一粒"抗衰"的药都是一把双刃剑——你只看了它锋利的那一面，忘了它会割伤握剑的手。',
    options: [
      {
        id: 'stop_rapamycin',
        label: '立即停用雷帕霉素，让免疫恢复',
        description: '抗衰不能以牺牲免疫为代价',
        hint: '健康优化+8 · 生物知识+6 · 健康+8 · 信念-4 · 压力-4',
        hintColor: 'positive',
        skillGains: { healthOptSkill: 8, bioKnowledge: 6 },
        stateEffect: (s) => {
          s.health = clamp(s.health + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 4, 0, 100);
          s.stress = clamp(s.stress - 4, 0, 100);
        },
        log: '{age}岁，你停了雷帕霉素。两个月后复查，免疫指标回到了正常。你把那瓶药收进了抽屉最深处。你心想：你赌了十二年"抗衰"，第一次被"抗衰"反噬。也许真正的智慧，不是知道吃什么，是知道什么时候该停。',
        blindBoxTrigger: 'bio_friend_warning',
      },
      {
        id: 'adjust_dose',
        label: '降低剂量、拉长间隔，继续观察',
        description: '不停，但更谨慎地用',
        hint: '健康优化+10 · 生物知识+8 · 健康+3 · 信念+2 · 压力+3',
        hintColor: 'neutral',
        skillGains: { healthOptSkill: 10, bioKnowledge: 8 },
        stateEffect: (s) => {
          s.health = clamp(s.health + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 2, 0, 100);
          s.stress = clamp(s.stress + 3, 0, 100);
        },
        log: '{age}岁，你没停雷帕霉素，但把频率从每周一次改成了每两周一次，剂量减半。你加了免疫监测，每个月查一次。日历上标满了抽血的日子，红点排成一串。药物没有绝对的安全，你要做的，是在收益和风险之间，把那根钢丝走稳。',
      },
      {
        id: 'consult_expert',
        label: '去找真正的抗衰医生咨询',
        description: '别自己瞎试了，让专业的人把关',
        hint: '生物知识+12 · 健康优化+6 · 健康+4 · 信念+3 · 存款-5000',
        hintColor: 'positive',
        skillGains: { bioKnowledge: 12, healthOptSkill: 6 },
        savingsChange: -5000,
        stateEffect: (s) => {
          s.health = clamp(s.health + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '{age}岁，你飞去见了一位做抗衰临床的医生。他看了你的方案，摇头说："你把自己当成了试验田，但没有试验田是没人照看的。"他帮你重新设计了方案，停掉了雷帕霉素，加了规律的运动和睡眠优先。走出诊室那天，你肩膀松了下来——承认自己不是专家，也许是这十二年最重要的一课。',
      },
    ],
  },

  // 36岁：生物黑客社群
  {
    id: 'bio_exp_biohacking_community',
    title: '部落',
    sceneTag: 'video_call',
    pathId: 'bio_gambler',
    branch: 'bio_experimenter',
    ageRange: [36, 36],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你被拉进一个加密的Telegram群"不死者"，三百多个和你一样的生物黑客，分享论文、自体实验数据、补剂渠道，还有更激进的东西——多肽自助注射、年轻血浆输注、未经批准的基因疗法。群里有个ID"陈医生"，某三甲医院再生医学中心副研究员，每当有人想试新东西，他会冷不丁贴一段内部数据："这个载体在小鼠身上致瘤率12%，建议等。"\n' +
      '你终于找到你的部落了。但你也清楚，部落有部落的疯狂——当一群人都相信同一件事，理性的边界就会被推得更远。你给陈医生发了一条私信："你为什么在这个群里？"他回了五个字："看着你们死。"',
    options: [
      {
        id: 'try_peptides',
        label: '尝试多肽方案（BPC-157等）',
        description: '群里都说有效，自己也想试',
        hint: '健康优化+10 · 生物知识+4 · 健康+3 · 压力+6 · 存款-4000 · 信念+4',
        hintColor: 'danger',
        skillGains: { healthOptSkill: 10, bioKnowledge: 4 },
        savingsChange: -4000,
        stateEffect: (s) => {
          s.health = clamp(s.health + 3, 0, 100);
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          (s as any).injectedSelf = true;
        },
        log: '{age}岁，你从群里的渠道买了一些BPC-157，自己皮下注射。关节确实舒服了些，但你不知道是心理作用还是真的。你也没敢告诉任何人——因为这些东西没有监管，没有标准，你注射进身体的，是信任。针管收进盒子那天，你盯着它看了很久。自由和风险，原来共用同一枚硬币。',
      },
      {
        id: 'share_data_only',
        label: '只分享数据，不碰激进方案',
        description: '保持理性，做社群里的清醒者',
        hint: '健康优化+6 · 生物知识+12 · 幸福+4 · 信念+5 · 副业+10000(方案评估)',
        hintColor: 'neutral',
        skillGains: { healthOptSkill: 6, bioKnowledge: 12 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.currentYearSideHustle += 10000; // 社群成员付费请你评估他们的补剂方案
        },
        log: '{age}岁，你成了群里那个"泼冷水"的人。有人想试年轻血浆，你贴出风险研究；有人推荐新型多肽，你问"人体数据在哪"。有人嫌你扫兴，但也有人私信谢你"救了他一命"。渐渐地有人主动付费请你评估他们的补剂方案，一年下来零零散散也收了10000块。群里又有人喊"冲"，你敲了两个字"等一下"，然后删掉，改成"先看数据"。',
      },
      {
        id: 'leave_community',
        label: '退群，回归主流医学',
        description: '这个圈子太野，风险不可控',
        hint: '健康优化+6 · 生物知识+6 · 幸福+5 · 压力-5 · 信念-2',
        hintColor: 'neutral',
        skillGains: { healthOptSkill: 6, bioKnowledge: 6 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 2, 0, 100);
        },
        log: '{age}岁，你退了群。你看着群里越来越激进的实验，觉得背脊发凉——这帮人已经不是在做科学了。你回归了有循证基础的方案——运动、睡眠、营养、有证据的补剂。你觉得无聊了些，但也安心了些。长寿这件事，急不得，得像跑马拉松一样磨。',
      },
    ],
  },

  // 38岁：表观遗传时钟检测
  {
    id: 'bio_exp_epigenetic_clock',
    title: '判决书',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    branch: 'bio_experimenter',
    ageRange: [38, 38],
    priority: 7,
    weight: 10,
    oncePerGame: true,
    eventType: 'milestone',
    narrative:
      '你花了八千块，做了Horvath表观遗传时钟检测——通过DNA甲基化模式，估算你的细胞有多大年纪。等待结果的两周，你比等任何体检都紧张。你{years}年的自律、上万的补剂、无数次的冰水浴和断食，全都凝结在这一个数字上。\n' +
      '报告打开的那一刻，你的手在抖——你的生物年龄比实际年龄小6.2岁，{age}岁的身体，细胞层面像31.8岁。你盯着那个数字，眼眶忽然湿了。你赌了{years}年，第一次拿到"判决书"，而它说：你赌对了。',
    options: [
      {
        id: 'double_down',
        label: '乘胜追击，把生物年龄再压低',
        description: '既然有效，就做得更狠',
        hint: '健康优化+12 · 生物知识+6 · 健康+4 · 压力+6 · 信念+10 · biologicalAge-2',
        hintColor: 'positive',
        skillGains: { healthOptSkill: 12, bioKnowledge: 6 },
        stateEffect: (s) => {
          s.health = clamp(s.health + 4, 0, 100);
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          adjustBiologicalAge(s, -2);
        },
        log: '{age}岁，生物年龄31.8。你拿着报告，像拿着一张奖状。你决定加大投入：更严格的断食、更精细的补剂、更密集的监测。你要在下一次检测时，把这个数字压到30以下。报告被你贴在了冰箱上，旁边是下一轮检测的倒计时。',
      },
      {
        id: 'maintain_balance',
        label: '保持现状，享受这个成果',
        description: '有效就够，不必走极端',
        hint: '健康优化+8 · 幸福+8 · 健康+4 · 信念+8 · 压力-4',
        hintColor: 'positive',
        skillGains: { healthOptSkill: 8 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.health = clamp(s.health + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.stress = clamp(s.stress - 4, 0, 100);
        },
        log: '{age}岁，生物年龄31.8。你没加码，而是长舒一口气。你保持现在的节奏，把省下的精力还给生活——多陪家人，多看几场日落。那个数字你锁进了抽屉，没再贴出来。延长寿命是为了更好地活，不是为了更累地活。',
      },
      {
        id: 'question_validity',
        label: '质疑：一个时钟能代表全部吗？',
        description: '甲基化时钟也有误差，别被一个数字绑架',
        hint: '生物知识+12 · 健康优化+4 · 信念+4 · 压力-2',
        hintColor: 'neutral',
        skillGains: { bioKnowledge: 12, healthOptSkill: 4 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          s.stress = clamp(s.stress - 2, 0, 100);
        },
        log: '{age}岁，生物年龄31.8。你高兴了十分钟，然后开始查这个时钟的局限性：不同组织结果不同，检测有技术误差，甲基化和真实健康的关系还没完全搞清。你把这个数字当成"参考"而不是"判决"。你关掉报告，做了二十个俯卧撑，喘得比去年慢了一点。',
      },
    ],
  },

  // 40岁：衰老细胞清除等极端方案
  {
    id: 'bio_exp_senolytics',
    title: '清道夫',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    branch: 'bio_experimenter',
    ageRange: [40, 40],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    narrative:
      '衰老细胞——那些停止分裂却不死的"僵尸细胞"，被认为是衰老的核心驱动力之一。清除它们的药物叫senolytics，最经典的是达沙替尼+槲皮素的组合。这个方案还在临床试验阶段，但生物黑客圈已经有人在自己身上试了。你读了Mayo Clinic的早期数据：风险可控，效果诱人。你拿到了药，准备做一个为期三天的清除周期。\n' +
      '药片在你掌心——这不是维生素，这是化疗药的衍生组合。二十年前你赌"也许有用"，现在你赌"大概率有用但可能有害"。你的赌注越来越大，胆子却越来越小。这是衰老，还是成熟？',
    options: [
      {
        id: 'do_senolytic_cycle',
        label: '完成清除周期，赌一次深层清理',
        description: '风险可控，潜在收益巨大',
        hint: '健康优化+12 · 生物知识+8 · 健康+5 · 压力+8 · 存款-6000 · 信念+6 · biologicalAge-2',
        hintColor: 'danger',
        skillGains: { healthOptSkill: 12, bioKnowledge: 8 },
        savingsChange: -6000,
        stateEffect: (s) => {
          s.health = clamp(s.health + 5, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          adjustBiologicalAge(s, -2);
        },
        log: '{age}岁，你吞下了那三天的senolytic组合。第二天你全身酸痛、低烧，像得了一场重感冒——据说这是衰老细胞死亡释放的炎症反应。三天后你恢复了，一个月后复查，炎症标志物降了一截，关节也轻快了。你不知道这是不是安慰剂，但报告上的箭头确实少了一个。清道夫进场了，垃圾总会少一些。',
      },
      {
        id: 'use_natural_senolytics',
        label: '只用天然的：非瑟酮+槲皮素',
        description: '不碰化疗药，用植物提取物',
        hint: '健康优化+10 · 生物知识+6 · 健康+4 · 压力+3 · 存款-3000 · 信念+4',
        hintColor: 'neutral',
        skillGains: { healthOptSkill: 10, bioKnowledge: 6 },
        savingsChange: -3000,
        stateEffect: (s) => {
          s.health = clamp(s.health + 4, 0, 100);
          s.stress = clamp(s.stress + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          adjustBiologicalAge(s, -1);
        },
        log: '{age}岁，你没碰达沙替尼，只用了非瑟酮和槲皮素——草莓和苹果里的天然成分。效果温和得多，但你睡得着觉。药盒搁在床头，你摸了摸，没打开。你不是病人，没必要用治病的药来"防病"。温和的清道夫清扫得慢，但不会把地板砸坏。',
      },
      {
        id: 'wait_for_approval',
        label: '等临床验证后再用',
        description: '现在太早，等数据成熟',
        hint: '生物知识+12 · 健康优化+4 · 信念+2 · 压力-2',
        hintColor: 'neutral',
        skillGains: { bioKnowledge: 12, healthOptSkill: 4 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 2, 0, 100);
          s.stress = clamp(s.stress - 2, 0, 100);
        },
        log: '{age}岁，你把药收了起来，决定等三年后的三期临床结果。你想起二十岁出头时，什么新东西都敢往嘴里塞；现在你学会了等。能等的人，才能活得久——你把药瓶放进抽屉最里面，关上的时候手指停了一下，然后松开了。',
      },
    ],
  },

  // 42岁：身体数据全面领先同龄人
  {
    id: 'bio_exp_body_age_leap',
    title: '逆转',
    sceneTag: 'gym',
    pathId: 'bio_gambler',
    branch: 'bio_experimenter',
    ageRange: [42, 42],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    narrative:
      '{age}岁这年，你做了一次全面评估：最大摄氧量（VO2max）相当于30岁的水平，握力在同龄人前5%，骨密度正常，反应速度像35岁，表观遗传时钟显示生物年龄33.6。你的同龄人开始出现三高、脂肪肝、腰围失控，而你还能跑半马、还能硬拉自体重。\n' +
      '但你也会在深夜里想：你用二十年的自律，换来了"比同龄人年轻八岁"。可如果抗衰技术真的突破了，你这点优势还算什么？你是在和同龄人赛跑，还是和时间赛跑？也许真正的对手，从来不是别人。',
    options: [
      {
        id: 'share_method',
        label: '把你的方案整理成系统方法公开',
        description: '二十年经验值得分享，也帮别人少走弯路',
        hint: '健康优化+10 · 生物知识+10 · 幸福+8 · 信念+8 · 被动收入+8000',
        hintColor: 'positive',
        skillGains: { healthOptSkill: 10, bioKnowledge: 10 },
        passiveIncomeChange: 8000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '{age}岁，你把二十年的自体实验整理成了一份公开文档：哪些有效、哪些没用、哪些有风险。你没有贩卖方案，只是诚实记录。文档被转了几万次，有人照着做，有人骂你"伪科学"。文档的评论区你只置顶了一条："这是我的N=1，不是真理——但二十年的真实数据，总比空谈强。"',
      },
      {
        id: 'push_to_extreme',
        label: '冲击生物年龄30岁以下',
        description: '你已经接近了，再努力一把',
        hint: '健康优化+12 · 健康+4 · 压力+8 · 信念+6 · biologicalAge-2',
        hintColor: 'neutral',
        skillGains: { healthOptSkill: 12 },
        stateEffect: (s) => {
          s.health = clamp(s.health + 4, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          adjustBiologicalAge(s, -2);
        },
        log: '{age}岁，生物年龄33.6。你没满足，而是向30发起冲击。你加了高压训练、加了更密集的监测、把方案调到极致。半年后你到了31.4。你盯着那个数字，既骄傲又疲惫。训练日志越写越厚，可你也发现：时间不需要睡觉，你需要。',
      },
      {
        id: 'pivot_to_quality',
        label: '从"更年轻"转向"更健康地活"',
        description: '数字够好了，现在关注生活质量',
        hint: '健康优化+8 · 幸福+10 · 健康+4 · 信念+6 · 压力-6',
        hintColor: 'positive',
        skillGains: { healthOptSkill: 8 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.health = clamp(s.health + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.stress = clamp(s.stress - 6, 0, 100);
        },
        log: '{age}岁，你决定不再追求"更年轻"，而是追求"更完整"。你把一部分训练时间换成了徒步、冥想、和伴侣做饭。数字没再降，但你更快乐了。早上睁开眼的时候，你会在床上多躺十秒，感受身体还没醒来的那种松弛。今天值得过——这感觉比任何指标都诚实。',
      },
    ],
  },

  // 44岁：你的身体成了最好的广告
  {
    id: 'bio_exp_living_proof',
    title: '活证',
    sceneTag: 'gym',
    pathId: 'bio_gambler',
    branch: 'bio_experimenter',
    ageRange: [44, 44],
    priority: 7,
    weight: 10,
    oncePerGame: true,
    eventType: 'milestone',
    narrative:
      '你{age}岁了。大学同学聚会上，你发现自己是唯一一个没有啤酒肚、没有白发、不需要扶着膝盖站起来的人。有人问你"是不是整容了"，有人问你"吃的什么仙丹"。你的体检报告全是绿箭头，医生反复看了两遍片子，问你"平时做什么运动"。\n' +
      '你忽然意识到：你不需要等什么革命性的疗法获批。你已经是活证据了——二十二年的自律、监测、迭代，你用自己的身体证明了：人确实可以老得更慢。你每天在做的事，比任何科幻小说都真实。',
    options: [
      {
        id: 'open_clinic',
        label: '开一家健康优化工作室',
        description: '把你的方案变成服务，帮别人也做到',
        hint: '健康优化+10 · 生物知识+10 · 信念+12 · 被动收入+15000 · 幸福+10',
        hintColor: 'positive',
        skillGains: { healthOptSkill: 10, bioKnowledge: 10 },
        passiveIncomeChange: 15000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
        },
        log: '{age}岁，你开了一间小工作室，不叫"抗衰中心"，叫"健康优化实验室"。你不卖药，不卖方案，只做评估和指导。第一批客户是你的朋友和朋友的朋友。看着他们体检报告上的箭头一个个变绿，你把那些报告复印了一份，钉成了册——这就是你赌了二十二年想看到的东西。',
      },
      {
        id: 'stay_private',
        label: '保持低调，继续自己的节奏',
        description: '你的身体是你自己的，不需要证明给谁看',
        hint: '健康优化+8 · 幸福+12 · 压力-8 · 信念+8 · 健康+5',
        hintColor: 'positive',
        skillGains: { healthOptSkill: 8 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 12, 0, 100);
          s.stress = clamp(s.stress - 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.health = clamp(s.health + 5, 0, 100);
        },
        log: '{age}岁，你婉拒了所有采访和合作邀约。你对自己说：我优化身体是为了自己，当榜样只是顺带的。你继续清晨跑步、按时睡觉、定期检测。你不再是{startAge}岁那个急着证明自己对的年轻人了。你不需要证明。你每天醒来感觉很好，这就够了。',
      },
      {
        id: 'join_longevity_fund',
        label: '以顾问身份加入长寿基金',
        description: '用N=1的实战经验帮基金筛选项目',
        hint: '投资分析+8 · 生物知识+10 · 信念+8 · 被动收入+12000 · 压力+5',
        hintColor: 'neutral',
        skillGains: { investmentSkill: 8, bioKnowledge: 10 },
        passiveIncomeChange: 12000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.stress = clamp(s.stress + 5, 0, 100);
        },
        log: '{age}岁，你成了一只长寿基金的科学顾问。你不做投资决策，只做一件事：哪些项目在生理学上说得通，哪些是忽悠。你用自己二十二年的N=1数据当标尺，帮基金避开了好几个"看起来很美"的坑。尽调会上你投了反对票的那一栏，后来果然爆了雷。从自体实验者到守门人，这条路你走对了。',
      },
    ],
  },

  // 45岁：人生的下半场
  {
    id: 'bio_exp_retirement_choice',
    title: '时间的礼物',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    branch: 'bio_experimenter',
    ageRange: [45, 45],
    priority: 8,
    weight: 10,
    oncePerGame: true,
    eventType: 'milestone',
    narrative:
      '{age}岁生日那天，你跑完了今年的第二个半马。冲过终点线时看了一眼手表：比去年快了两分钟。你的生物年龄是31岁，存款、被动收入、健康状态都允许你不再为钱工作。如果你的抗衰方案有效，你可能还有五十年甚至更久。\n' +
      '当年赌的是"我能活得更久"，现在你知道赌对了，但问题变成了：多出来的时间，你要用来做什么？时间是礼物，但也是一张空白试卷。',
    options: [
      {
        id: 'retire_early',
        label: '提前退休，享受多出来的健康时间',
        description: '你已经赢了赌局，是时候享受战利品了',
        hint: '幸福+15 · 压力-15 · 信念+10 · 触发退休判定',
        hintColor: 'positive',
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 15, 0, 100);
          s.stress = clamp(s.stress - 15, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
        },
        log: '{age}岁，你正式退休了。你没有搬到什么热带岛屿，只是把工作时间砍到了每周一天——偶尔去工作室看看，偶尔给基金写点建议。其余时间你跑步、读书、做饭、旅行。{startAge}岁那年你赌"我能活得更久"，二十三年过去，答案写在每天的清晨里——你不仅活了更久，你活得更好。',
        triggersRetirementCheck: true,
      },
      {
        id: 'continue_experimenting',
        label: '继续探索，推动边界',
        description: '你才刚摸到门槛，停下来太可惜了',
        hint: '健康优化+10 · 生物知识+10 · 信念+10 · 压力+5 · biologicalAge-1',
        hintColor: 'positive',
        skillGains: { healthOptSkill: 10, bioKnowledge: 10 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.stress = clamp(s.stress + 5, 0, 100);
          adjustBiologicalAge(s, -1);
        },
        log: '{age}岁，你没有退休。你开始尝试新的方案——高压氧舱、基因表达分析、AI定制营养。你的朋友们说你"停不下来"，你笑着说"前面的路太有意思了，停什么"。你知道你可能永远达不到"永生"，但每往前走一步，人类就离那个目标近一寸。',
        triggersRetirementCheck: true,
      },
      {
        id: 'focus_on_teaching',
        label: '把重心转向传承和教学',
        description: '一个人走得快，一群人走得远',
        hint: '健康优化+8 · 生物知识+8 · 幸福+12 · 信念+12 · 被动收入+10000',
        hintColor: 'positive',
        skillGains: { healthOptSkill: 8, bioKnowledge: 8 },
        passiveIncomeChange: 10000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
        },
        log: '{age}岁，你开始带徒弟。每年收三四个真心想学习健康优化的人，手把手教，比课堂上那种实在多了。你把二十二年的笔记整理成了一本手册，免费公开。你一个人多活二十年是二十年，但如果你教会一百个人各自多活十年，那就是一千年。',
        triggersRetirementCheck: true,
      },
    ],
  },
];

// ============================================================
// 科研参与线事件（ages 26-45）
// ============================================================

const researcherEvents: NarrativeEvent[] = [

  // 26岁：加入一项衰老研究
  {
    id: 'bio_res_join_study',
    title: '入组',
    sceneTag: 'lab',
    pathId: 'bio_gambler',
    branch: 'bio_researcher',
    ageRange: [26, 26],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你在一所大学的衰老研究中心报了名，成为一项纵向研究的受试者。每三个月去一次实验室：抽血、测认知、做体成分、填问卷，作为回报拿到自己的全套数据。第一次去实验室，你看着那些穿白大褂的研究生，心想：你不再是旁观者，你成了数据点，成了这条知识链条上的一环。\n' +
      '负责项目的PI是个五十多岁的女教授，她看着你的数据说："年轻人，你的指标比同龄人好很多。你做了什么？"你递上补剂清单。她推了推眼镜："有意思。但记住，个案不是证据。"你点了点头——你知道，但至少你是那个有趣的个案。',
    options: [
      {
        id: 'be_exemplary_subject',
        label: '做最配合的受试者，提供高质量数据',
        description: '严格遵守方案，每次准时、如实记录',
        hint: '生物知识+10 · 健康优化+6 · 信念+4 · 压力+2 · 月薪+500',
        hintColor: 'positive',
        skillGains: { bioKnowledge: 10, healthOptSkill: 6 },
        salaryChange: 500,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 2, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '{age}岁，你成了那个实验室最靠谱的受试者。三年里你没缺席过一次随访，数据完整得让研究生感动。PI在论文致谢里写上了你的编号。你把那行致谢截图存了下来——当不成科学家没关系，你做的那块拼图，缺了不行。',
      },
      {
        id: 'ask_questions',
        label: '不断提问，趁机学方法学',
        description: '不只是被测，要搞懂为什么这么测',
        hint: '生物知识+12 · 健康优化+4 · 信念+5 · 压力+3',
        hintColor: 'neutral',
        skillGains: { bioKnowledge: 12, healthOptSkill: 4 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '{age}岁，你把每次去实验室变成了上课。你问为什么用ELISA而不是质谱，问为什么控制这个变量不控制那个，问p值和效应量哪个更重要。研究生开始躲你，但PI喜欢你，邀请你参加组会。你攥着一沓打印出来的文献走出实验室，走廊灯坏了，你借着手机光又翻了两页。',
      },
      {
        id: 'suggest_self_data',
        label: '主动提供你的自体实验数据给研究',
        description: '你的N=1数据也许能启发新的假设',
        hint: '生物知识+10 · 健康优化+8 · 信念+4 · 幸福+3',
        hintColor: 'neutral',
        skillGains: { bioKnowledge: 10, healthOptSkill: 8 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
        },
        log: '{age}岁，你把三年的自体实验数据整理成表格，发给了PI。她看了很惊讶："这些虽然不能直接用，但能帮我们生成假设。"后来她真的基于你的数据，设计了一个新实验。你盯着她回信里的"谢谢你的数据"四个字看了很久，然后把它存进了一个叫"值得"的文件夹。',
      },
    ],
  },

  // 28岁：第一次被引用/共同署名
  {
    id: 'bio_res_first_paper',
    title: '署名',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    branch: 'bio_researcher',
    ageRange: [28, 28],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    narrative:
      'PI发来一封邮件，附件是一篇论文的预印本，题目关于某种补剂对健康人群生物标志物的影响。她在致谢后面加了一行："我们感谢[你的名字]提供的纵向自体监测数据。"虽然不是正式署名，但你的名字第一次出现在了一篇学术论文上。\n' +
      '你把PDF下载下来，盯着那行字看了很久。二十八岁，同龄人在卷KPI、卷房贷，你在卷论文致谢。也许这算不上什么成就，但对你来说，它意味着一件事：你的数据是有价值的，你的参与是被认可的。你不是边缘人，你是这个领域里一个微小的、但真实的齿轮。',
    options: [
      {
        id: 'aim_for_authorship',
        label: '争取成为正式共同作者',
        description: '从致谢到署名，需要更多实质贡献',
        hint: '生物知识+12 · 健康优化+6 · 信念+6 · 压力+6 · 月薪+1000',
        hintColor: 'positive',
        skillGains: { bioKnowledge: 12, healthOptSkill: 6 },
        salaryChange: 1000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '{age}岁，你跟PI说："我想做更多，不只是提供数据。"她让你参与了一项新实验的数据清洗和分析。半年后你的名字出现在了作者列表的倒数第二位。虽然只是二作，但你拿到了人生第一个ORCID。你把那串ORCID号背了下来——在学术的世界里，名字的位置就是位置。',
      },
      {
        id: 'start_writing',
        label: '开始自己写科普，把论文翻译成人话',
        description: '做学术界和公众之间的桥梁',
        hint: '生物知识+10 · 信念+5 · 幸福+5 · 被动收入+5000',
        hintColor: 'positive',
        skillGains: { bioKnowledge: 10 },
        passiveIncomeChange: 5000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '{age}岁，你开了一个公众号，专门把晦涩的衰老论文翻译成普通人能懂的话。第一篇阅读量只有三百，但有人留言说"终于看懂了自噬是什么"。你把那条留言收藏了——科学的进步不只靠实验室，也靠有人把火种递出去。',
      },
      {
        id: 'deepen_methods',
        label: '深入学习统计和实验设计',
        description: '看懂数据还不够，要会判断数据好坏',
        hint: '生物知识+12 · 信念+4 · 压力+5 · 健康-2 · 副业+5000(避坑稿费)',
        hintColor: 'neutral',
        skillGains: { bioKnowledge: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.health = clamp(s.health - 2, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          s.currentYearSideHustle += 5000; // 一家健康媒体付费请写的"抗衰研究避坑"专栏稿费
        },
        log: '{age}岁，你啃起了生物统计学和实验设计。你学会了看置信区间、看样本量计算、看偏倚来源。你回头再看那些网红抗衰研究，发现一半都站不住脚。一家健康媒体看到你在公众号上的吐槽，付费5000块请你写了一篇"抗衰研究避坑指南"。稿费到账那天你盯着余额看了会儿——知识最危险的地方是让你看见多少东西是假的，可这也正是它值钱的地方。',
      },
    ],
  },

  // 30岁：联系你仰慕的科学家
  {
    id: 'bio_res_connect_scientists',
    title: '回信',
    sceneTag: 'video_call',
    pathId: 'bio_gambler',
    branch: 'bio_researcher',
    ageRange: [30, 30],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你给一位做表观遗传重编程的科学家发了邮件，附上你整理的一份数据综述，以为会石沉大海。三天后你收到回复，只有两行："你的综述很清楚，有一个细节我们正好在争论。方便周四视频聊聊吗？"\n' +
      '周四的视频会议，这位头发花白的教授认真听了你四十分钟的判断，没把你当外行。临别他说："学术界需要更多像你这样懂生物学又懂实践的人。你有没有想过读个在职博士？"你愣住了——原来知识真的能敲开任何一扇门，只要你敲得够久、够真诚。',
    options: [
      {
        id: 'part_time_phd',
        label: '申请在职博士，正式进入学术体系',
        description: '把爱好变成事业，但代价是时间和精力',
        hint: '生物知识+12 · 信念+10 · 压力+12 · 健康-4 · 月薪-2000',
        hintColor: 'positive',
        skillGains: { bioKnowledge: 12 },
        salaryChange: -2000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.health = clamp(s.health - 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
        },
        log: '{age}岁，你成了那位教授的在职博士生。白天上班，晚上和周末做课题。你比同门大七八岁，但他们尊敬你——你是为问题来的，文凭只是顺带的。三十岁重新当学生，像是把人生重置了一次。你在实验室的工位上贴了张便签："别急，你比他们多跑了八年。"',
      },
      {
        id: 'collaborate_only',
        label: '不读博，但建立长期合作',
        description: '保持自由身，做学术界的外援',
        hint: '生物知识+12 · 健康优化+6 · 信念+6 · 幸福+4 · 副业+8000(数据咨询)',
        hintColor: 'neutral',
        skillGains: { bioKnowledge: 12, healthOptSkill: 6 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.currentYearSideHustle += 8000; // 帮教授整理真实世界依从性数据，拿到一笔咨询费
        },
        log: '{age}岁，你没读博，但和那位教授建立了长期合作。你帮他收集真实世界的依从性数据，他让你参与组会和论文讨论。教授从课题经费里拨了8000块咨询费给你——钱不多，可这是头一回，你靠"懂生物学"吃上了饭。你把顾问聘书收进文件夹，没发动态圈。进不进体制不打紧，你人在场，你出的力在场，这就够了。',
      },
      {
        id: 'build_own_network',
        label: '借机拓展整个科学家网络',
        description: '一个连接带来十个连接',
        hint: '生物知识+12 · 信念+6 · 幸福+5 · 被动收入+3000',
        hintColor: 'positive',
        skillGains: { bioKnowledge: 12 },
        passiveIncomeChange: 3000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '{age}岁，那位教授把你拉进了一个衰老研究的国际协作网络。你认识了二十多位科学家，有的是做线粒体的，有的是做干细胞的老的。你成了这个网络里唯一的"民间科学家"，但他们需要你——因为你懂实践，他们懂理论。协作群的未读消息每天99+，你的头像混在一堆博士头衔里——桥梁这东西，站得低，可它连着两岸。',
      },
    ],
  },

  // 32岁：发起公民科学项目
  {
    id: 'bio_res_citizen_science',
    title: '众声',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    branch: 'bio_researcher',
    ageRange: [32, 32],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你发起了一个公民科学项目：招募两百个像你一样做自体监测的人，统一方案、统一指标，追踪一年。你想证明：散落民间的N=1数据，聚合起来也能产生有意义的发现。招募比想象中难——三个月后只剩一百二十个有效样本。但你坚持下来，写了协议、做了质控、建了数据库。\n' +
      '一年后，数据出来了。你发现一个有趣的信号：某种补剂的效果，和受试者的基线炎症水平相关——基线高的人受益明显，基线低的几乎没变化。这个"异质性"的发现也许微不足道，但它是真实的。把一百多个人的故事，变成一个可以讨论的结论，这就是科学的力量。',
    options: [
      {
        id: 'publish_findings',
        label: '写成论文投预印本',
        description: '让发现接受同行审视',
        hint: '生物知识+12 · 信念+8 · 压力+8 · 幸福+5 · 副业+12000(数据咨询)',
        hintColor: 'positive',
        skillGains: { bioKnowledge: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.currentYearSideHustle += 12000; // 一家补剂公司付费请你基于公民科学数据做人群分层咨询
        },
        log: '{age}岁，你把公民科学项目的结果投到了预印本。审稿意见褒贬不一——有人夸"开创性"，有人批"样本质量参差"。但你的发现被几位科学家注意到了，有人邀请你合作验证。一家补剂公司看中你那个"基线炎症水平决定补剂效果"的发现，付费12000块请你帮忙做人群分层咨询。你在邮件里写"合作愉快"，删掉，改成"期待数据说话"。',
      },
      {
        id: 'build_platform',
        label: '把项目做成一个长期平台',
        description: '一次性的项目变成持续的数据库',
        hint: '生物知识+12 · 信念+6 · 压力+6 · 被动收入+8000 · 幸福+4',
        hintColor: 'positive',
        skillGains: { bioKnowledge: 12 },
        passiveIncomeChange: 8000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.happiness = clamp(s.happiness + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '{age}岁，你没让项目结束，而是搭了一个平台，让更多自体实验者上传数据。两年后平台有了五千用户，成了全球最大的民间衰老数据库之一。后台的注册曲线一路上扬——一个人是数据点，五千个人叠起来，就成了科学听得懂的一句话。',
      },
      {
        id: 'focus_on_quality',
        label: '先提升数据质量，不急着发表',
        description: '垃圾数据只会伤害科学',
        hint: '生物知识+12 · 信念+4 · 压力+3 · 健康+2',
        hintColor: 'neutral',
        skillGains: { bioKnowledge: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 3, 0, 100);
          s.health = clamp(s.health + 2, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '{age}岁，你看着参差不齐的数据，决定先做质控而不是急着发表。你重新培训了参与者，统一了检测方法，剔除了不合格样本。速度慢了，但数据的可信度高了。进度条停在质控那一栏很久——在科学里，慢就是快，一个可信的结论，胜过一百个哗众的发现。',
      },
    ],
  },

  // 34岁：参加长寿大会
  {
    id: 'bio_res_conference',
    title: '盛会',
    sceneTag: 'conference',
    pathId: 'bio_gambler',
    branch: 'bio_researcher',
    ageRange: [34, 34],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你飞去参加了一场国际长寿科技大会。会场里人山人海——白发苍苍的院士、年轻的创业者、西装革履的投资人、还有像你一样的民间研究者。茶歇时你听到两个科学家争论——一个说衰老是程序，一个说衰老是损伤积累。你听懂了他们的论点，甚至想插嘴。你忽然意识到：你不再是那个看论文只看摘要的外行了。\n' +
      '但你也看到了另一面：会场外的展台，有人在卖两万块一次的"年轻血浆输注"，有人在推销没有数据的"抗衰神药"。科学的激情和商业的贪婪在同一片屋顶下交织。先知和骗子同台，而你这种人，正站在分辨他们的位置上。',
    options: [
      {
        id: 'present_poster',
        label: '展示你的公民科学海报',
        description: '让更多人看到民间数据的价值',
        hint: '生物知识+12 · 信念+8 · 幸福+6 · 压力+4 · 副业+15000(技术咨询)',
        hintColor: 'positive',
        skillGains: { bioKnowledge: 12 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 6, 0, 100);
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.currentYearSideHustle += 15000; // 一家生科公司付费请你做生物标志物选型的技术咨询
        },
        log: '{age}岁，你站在自己的海报前，给路过的人讲解你的公民科学项目。有人匆匆走过，有人停下来认真听，有位诺奖得主问了你三个问题。会议结束你收到了二十多张名片。其中一家做衰老检测的生科公司，付费15000块请你帮忙做生物标志物选型的技术咨询。名片你理成一摞，用皮筋扎好——你不属于任何机构，可你的工作，配得上这个会场。',
      },
      {
        id: 'build_alliances',
        label: '重点建立跨机构合作',
        description: '认识人比认识知识更重要',
        hint: '生物知识+10 · 信念+6 · 幸福+5 · 被动收入+4000',
        hintColor: 'neutral',
        skillGains: { bioKnowledge: 10 },
        passiveIncomeChange: 4000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '{age}岁，你把大会当成了社交场。你约了七位科学家喝咖啡，聊合作、聊数据共享、聊未来的项目。回程的飞机上你整理了一页"潜在合作清单"，每一条都是一个可能性。飞机降落时你还没写完，空姐提醒收起小桌板，你合上电脑，嘴角带笑。',
      },
      {
        id: 'expose_quacks',
        label: '记录并揭露会场的伪科学',
        description: '这场革命需要清醒的守门人',
        hint: '生物知识+12 · 信念+5 · 幸福+2 · 压力+6',
        hintColor: 'neutral',
        skillGains: { bioKnowledge: 12 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 2, 0, 100);
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '{age}岁，你在大会现场悄悄记录了那些没有数据支撑的产品和宣称，回去后写成了一篇"长寿大会上的科学与伪科学"。文章引发了争议，有人骂你"泼冷水"，有人谢你"省了他们几万块"。评论区你置顶了那条骂你最狠的——守护一场革命的纯洁，比发动它更难，但总得有人做。',
      },
    ],
  },

  // 36岁：影响政策——把衰老定义为疾病
  {
    id: 'bio_res_influence_policy',
    title: '定义',
    sceneTag: 'conference',
    pathId: 'bio_gambler',
    branch: 'bio_researcher',
    ageRange: [36, 36],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    narrative:
      '一个根本性的问题困扰着抗衰领域：衰老算不算"疾病"？如果不算，抗衰疗法就无法走医保、无法大规模推广、无法被严肃对待。你参与一个倡导组织，推动把衰老纳入疾病分类讨论。你写文章、做演讲，用最朴素的话解释："如果高血压是病，那导致高血压的衰老过程为什么不是？"\n' +
      '一次研讨会上，卫生官员问你："把衰老定义为疾病，会不会制造恐慌？"你想了想，回答："不定义它，才会制造恐慌——因为人们会去相信那些承诺治愈衰老的骗子。"会议结束后，他来找你要了你的文章。',
    options: [
      {
        id: 'push_classification',
        label: '全力推动衰老的疾病分类',
        description: '这是抗衰疗法普及的前提',
        hint: '生物知识+12 · 信念+10 · 压力+8 · 幸福+4 · 副业+20000(智库咨询)',
        hintColor: 'positive',
        skillGains: { bioKnowledge: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.happiness = clamp(s.happiness + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.currentYearSideHustle += 20000; // 一家健康智库付费请你做衰老疾病分类的咨询报告
        },
        log: '{age}岁，你成了推动衰老分类讨论的活跃声音。你的文章被翻译成五种语言，你被邀请参加WHO的旁听会议。一家关注老龄化政策的健康智库付费20000块请你做了一份"衰老纳入疾病分类的影响评估"报告。报告交稿那天你在封皮上按了个指印——科学发现分子，可分子能不能到人手里，政策说了算。',
      },
      {
        id: 'focus_on_education',
        label: '转向公众教育，提升科学素养',
        description: '政策太慢，先让普通人懂行',
        hint: '生物知识+12 · 信念+6 · 幸福+8 · 被动收入+6000 · 压力+2',
        hintColor: 'neutral',
        skillGains: { bioKnowledge: 12 },
        passiveIncomeChange: 6000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress + 2, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '{age}岁，你发现政策的齿轮转得太慢，于是转向了更直接的事——教育。你做了一系列免费课程，教普通人看懂衰老研究、识别抗衰骗局。两年内你的课程被五十万人学过。后台的学习时长数字每天往上跳——等政策来保护人，不如先让人自己长出盔甲。',
      },
      {
        id: 'advocate_responsibly',
        label: '谨慎发声，避免过度承诺',
        description: '抗衰领域最怕的就是吹过头',
        hint: '生物知识+12 · 信念+4 · 压力+3 · 幸福+3',
        hintColor: 'neutral',
        skillGains: { bioKnowledge: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 3, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '{age}岁，你在所有公开发言里都坚持一个原则：说证据，不说愿景。有人嫌你"不够振奋人心"，但你也挡住了一批想借你名声炒作的产品。演讲稿里你划掉了所有"未来""革命""颠覆"——在这个最容易吹牛的领域，克制本身就是贡献。吹出去的牛，最后都会变成砸向科学的石头。',
      },
    ],
  },

  // 38岁：建立知识平台
  {
    id: 'bio_res_knowledge_platform',
    title: '灯塔',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    branch: 'bio_researcher',
    ageRange: [38, 38],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '你花了一年，建了一个衰老科学的中文知识平台：论文解读、补剂证据分级、公民科学项目入口、"抗衰真伪"核查专栏。你把十几年积累全倒进了这个平台。上线三个月月活破十万，私信上千条——有人问"我妈该不该吃NMN"，有人说"你的文章让我没被骗"，有人骂你"资本的走狗"。\n' +
      '你在平台首页写了一句："这里不卖任何东西，也不承诺任何奇迹。我们只提供证据，让你自己判断。"你建了一座灯塔——不图指路，只图让人在迷雾里看见，还有方向这回事。',
    options: [
      {
        id: 'grow_platform',
        label: '全职运营平台，做成权威入口',
        description: '这是你的事业，也是你的使命',
        hint: '生物知识+12 · 信念+10 · 幸福+8 · 压力+8 · 被动收入+20000',
        hintColor: 'positive',
        skillGains: { bioKnowledge: 12 },
        passiveIncomeChange: 20000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
        },
        log: '{age}岁，你辞了职，全职运营平台。你组了五人团队，做了证据分级系统、做了专家审核机制、做了防骗举报通道。两年后它成了中文世界最被信任的衰老科普来源。团队的群名你改成了"看门人"——你不做研究了，但你让更多人的研究被看见，被正确地看见。',
      },
      {
        id: 'partner_academia',
        label: '和高校合作，提升平台学术权威',
        description: '民间平台需要学术背书',
        hint: '生物知识+12 · 信念+6 · 幸福+4 · 被动收入+10000',
        hintColor: 'neutral',
        skillGains: { bioKnowledge: 12 },
        passiveIncomeChange: 10000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '{age}岁，你和三所大学的衰老实验室建立了合作：他们提供学术审核，你提供传播渠道。平台的文章从"民间解读"升级为"学术把关"。合作意向书签完那天，你把三份合同并排摆在桌上，拍了张照，发给{startAge}岁的自己——可惜发不出去。',
      },
      {
        id: 'keep_independent',
        label: '保持独立运营，不接广告',
        description: '独立性是平台最大的资产',
        hint: '生物知识+10 · 信念+8 · 幸福+6 · 压力+4 · 被动收入+4000',
        hintColor: 'neutral',
        skillGains: { bioKnowledge: 10 },
        passiveIncomeChange: 4000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 6, 0, 100);
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '{age}岁，你拒绝了所有抗衰产品的广告和赞助。平台靠读者小额订阅维持，钱不多，但你睡得着觉。一旦收了钱，你的"证据"就会被人质疑动机。穷一点没关系，干净最重要——抗衰领域最稀缺的，公信力算一个。你关掉又一封赞助邮件，拉黑，然后去睡了。',
      },
    ],
  },

  // 40岁：指导新人
  {
    id: 'bio_res_mentor',
    title: '薪火',
    sceneTag: 'video_call',
    pathId: 'bio_gambler',
    branch: 'bio_researcher',
    ageRange: [40, 40],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你的公民科学平台和知识专栏，吸引了一批年轻人——医学生、像我当年一样的"民间生物爱好者"、想转行做衰老研究的程序员。他们给你写信、问你问题、想跟你做项目。你忽然意识到，你已经从"提问的人"变成了"被提问的人"；十几年前你给那位科学家发邮件时的忐忑，现在轮到别人对你忐忑了。\n' +
      '你开始每周抽两个晚上做线上答疑。你不教"吃什么补剂"，教的是"怎么判断一个研究靠不靠谱"。你能留给这个领域最好的东西，也许就是一群会独立思考的人。火种比火焰更持久——你在屏幕这头看着弹幕里那些认真提问的脸，觉得值。',
    options: [
      {
        id: 'mentor_seriously',
        label: '认真带几个有潜力的年轻人',
        description: '把经验传下去，培养下一代',
        hint: '生物知识+12 · 信念+8 · 幸福+10 · 压力+4',
        hintColor: 'positive',
        skillGains: { bioKnowledge: 12 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '{age}岁，你正式带了三个"徒弟"。你教他们读文献、设计实验、写综述。两年后一个考上了衰老生物学的博士，一个进了生科公司做研发，一个接手了你的公民科学平台。你把自己拆成了三份，种进了三块更年轻的土壤。冬天收到三张贺卡，你把它们夹进了那本笔记里。',
      },
      {
        id: 'open_course',
        label: '做一门系统的衰老科学公开课',
        description: '影响更多人，而不只是几个人',
        hint: '生物知识+12 · 信念+6 · 幸福+6 · 被动收入+12000 · 压力+5',
        hintColor: 'positive',
        skillGains: { bioKnowledge: 12 },
        passiveIncomeChange: 12000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 6, 0, 100);
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '{age}岁，你录了一门三十讲的衰老科学公开课，从端粒（保护帽）到表观遗传，从自噬到衰老细胞。免费放在网上，一年内被三十万人学过。你把知识做成了种子，风会把它带到任何需要的地方——后台留言区有人写"我决定考衰老生物学的研究生了"，你截了图，存进了那个叫"值得"的文件夹。',
      },
      {
        id: 'focus_own_research',
        label: '把精力放回自己的研究上',
        description: '传承重要，但你的研究窗口也在关闭',
        hint: '生物知识+12 · 信念+5 · 压力+6 · 健康-2',
        hintColor: 'neutral',
        skillGains: { bioKnowledge: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.health = clamp(s.health - 2, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '{age}岁，你婉拒了带徒弟的请求，把时间全砸在了自己的研究上。你知道传承很重要，但你也知道：你的精力有限，与其分散，不如集中。等你做出了真正重要的发现，那本身就是最好的传承——用一个能被引用二十年的结论，胜过带二十个徒弟。你关掉邮件，打开数据分析软件，窗外的天已经亮了。',
      },
    ],
  },

  // 42岁：参与的重磅论文发表
  {
    id: 'bio_res_breakthrough_paper',
    title: '留名',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    branch: 'bio_researcher',
    ageRange: [42, 42],
    priority: 7,
    weight: 10,
    oncePerGame: true,
    eventType: 'milestone',
    narrative:
      '这项研究用你帮忙搭建的公民科学数据库，验证了一种新的衰老生物标志物，发在了顶级期刊上——你的名字在作者列表里，虽然排在中后段，但它在那里。论文上线那天，手机被祝贺信息塞满，还有当年劝你别"不务正业"的亲戚。你盯着屏幕，杯壁上的水汽模糊了视线。\n' +
      '二十年前你以为科学的殿堂离"民间人士"很远，现在你的名字和殿堂里的人印在同一页纸上。你证明了：知识面前，真的没有门第。',
    options: [
      {
        id: 'lead_next_study',
        label: '牵头下一项更大规模的研究',
        description: '从参与者变成主导者',
        hint: '生物知识+12 · 信念+10 · 压力+10 · 健康-3',
        hintColor: 'positive',
        skillGains: { bioKnowledge: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
        },
        log: '{age}岁，你成了下一项千人规模衰老纵向研究的共同PI。你从"被研究的人"变成了"研究别人的人"。你在启动会上说："二十年前我是受试者，今天我是研究者。这条路走到尽头，能让每个人更健康地老去，就够了。"',
      },
      {
        id: 'translate_to_public',
        label: '把成果翻译成公众能用的知识',
        description: '论文在象牙塔里，得把它搬出来',
        hint: '生物知识+12 · 信念+8 · 幸福+8 · 被动收入+10000',
        hintColor: 'positive',
        skillGains: { bioKnowledge: 12 },
        passiveIncomeChange: 10000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '{age}岁，你把那篇论文拆成了十篇科普，讲清楚了这个新标志物意味着什么、普通人怎么测、怎么用。你的平台流量翻倍，有人照着做了检测，提前发现了风险。你打开私信，一条写着"谢谢你，我去查了，果然偏高"。你回了个笑脸，关掉，又打开下一篇草稿。',
      },
      {
        id: 'reflect_on_legacy',
        label: '停下来想想：这一切的意义是什么',
        description: '不是每一步都要往前冲',
        hint: '生物知识+10 · 信念+10 · 幸福+10 · 压力-6 · 健康+4',
        hintColor: 'positive',
        skillGains: { bioKnowledge: 10 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.stress = clamp(s.stress - 6, 0, 100);
          s.health = clamp(s.health + 4, 0, 100);
        },
        log: '{age}岁，论文发表后你没急着做下一个项目，而是去山里待了一周。你问自己：你追求的到底是"留名"还是"有用"？答案慢慢清晰——比起被记住，你更想让某个人因为你的工作，多健康地活几年。你想：这才是"延长寿命"四个字最朴素、也最深刻的含义。',
      },
    ],
  },

  // 44岁：你的研究开始改变政策
  {
    id: 'bio_res_policy_impact',
    title: '涟漪',
    sceneTag: 'conference',
    pathId: 'bio_gambler',
    branch: 'bio_researcher',
    ageRange: [44, 44],
    priority: 7,
    weight: 10,
    oncePerGame: true,
    eventType: 'milestone',
    narrative:
      '你搭建的衰老标志物数据库，被国家卫健委引用了——他们制定老年健康评估指南时，用了你们的数据做参考。消息传来那天你正在实验室整理样本，年轻的研究员跑进来告诉你，你愣了一下，继续把试管放进架子，但放试管的手在抖。\n' +
      '那些被人说"民科也配谈科学"的夜晚，那些周末泡在实验室只为求一个答案的时光，忽然都有了落点。你的工作变成了指南里的一个数字、一个标准、一个会影响几千万老年人健康评估的依据。',
    options: [
      {
        id: 'push_for_more',
        label: '推动更多研究转化为政策',
        description: '论文是起点，政策才是真正改变世界的杠杆',
        hint: '生物知识+10 · 信念+12 · 压力+8 · 被动收入+8000',
        hintColor: 'positive',
        skillGains: { bioKnowledge: 10 },
        passiveIncomeChange: 8000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
        },
        log: '{age}岁，你成了卫健委老年健康专家委员会的外聘顾问。你开始在政策制定会议上发言，用数据说话，用你二十年的民间研究经验提醒那些专家："指南上的每一个数字，背后都是一个真实的老人。"你知道你改变不了一切，但你至少能让一些数字更准确，一些评估更人性化。',
      },
      {
        id: 'focus_on_data',
        label: '回到实验室，继续做基础研究',
        description: '政策是别人的事，你的战场是数据和论文',
        hint: '生物知识+12 · 信念+8 · 幸福+8 · 压力-5',
        hintColor: 'positive',
        skillGains: { bioKnowledge: 12 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
        },
        log: '{age}岁，你礼貌地拒绝了所有政策顾问的邀请。你对邀请你的人说："我擅长的是找答案，不是写文件。"你回到了数据库、回到了实验室、回到了那个你最舒服的位置。你点亮灯就够了——有人需要在聚光灯下，你做那个站在灯旁边的人。',
      },
      {
        id: 'train_next_gen',
        label: '把精力放在培养年轻研究者上',
        description: '你一个人能做的有限，但一百个人可以',
        hint: '生物知识+8 · 信念+10 · 幸福+10 · 压力-3 · 被动收入+10000',
        hintColor: 'positive',
        skillGains: { bioKnowledge: 8 },
        passiveIncomeChange: 10000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.stress = clamp(s.stress - 3, 0, 100);
        },
        log: '{age}岁，你开始带研究生——在你搭建的公民科学平台上，而非大学的教室里。你每年选五个真正有热情的年轻人，免费教他们研究方法、论文写作、数据分析。有人问你图什么，你说"图他们比我走得远"。当年那个在论坛上发帖无人回复的门外汉，现在成了那个主动伸出手的人。',
      },
    ],
  },

  // 45岁：回答最初的问题
  {
    id: 'bio_res_retirement_choice',
    title: '答案',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    branch: 'bio_researcher',
    ageRange: [45, 45],
    priority: 8,
    weight: 10,
    oncePerGame: true,
    eventType: 'milestone',
    narrative:
      '{age}岁，你在整理书房时翻出一本{startAge}岁的笔记本，扉页写着一行字："我要搞清楚人到底能不能活更久。"你坐在地上翻了很久，那些被划掉又重写的假设、贴满便签的论文打印件——二十三年前你问了一个问题，现在你有了一部分答案：能，但靠的是自律、监测、科学进步和一点运气，而不是一颗神药。\n' +
      '你自己的生物年龄是36岁。你参与的研究改变了政策、帮助了人、培养了后来者。你从一个害怕死亡的年轻人，变成了一个理解衰老的研究者。问题还没有完全回答，但你已经不害怕了。',
    options: [
      {
        id: 'retire_write_book',
        label: '退休，把这一切写成一本书',
        description: '论文只有同行读，书可以给所有人看',
        hint: '幸福+15 · 压力-15 · 信念+10 · 被动收入+12000 · 触发退休判定',
        hintColor: 'positive',
        passiveIncomeChange: 12000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 15, 0, 100);
          s.stress = clamp(s.stress - 15, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
        },
        log: '{age}岁，你退休了。你没有去海边，而是在家写了一本书——《一个普通人的二十三年抗衰笔记》。一个门外汉用二十三年时间、自己的身体、和无数个深夜换来的诚实记录。书出版那天你翻到扉页，把{startAge}岁那行字抄在了最后一页下面："能。而且值得。"',
        triggersRetirementCheck: true,
      },
      {
        id: 'continue_research',
        label: '继续研究，还有太多未知',
        description: '你回答了一个问题，但还有一百个问题在等你',
        hint: '生物知识+10 · 信念+10 · 压力+5 · biologicalAge-1',
        hintColor: 'positive',
        skillGains: { bioKnowledge: 10 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.stress = clamp(s.stress + 5, 0, 100);
          adjustBiologicalAge(s, -1);
        },
        log: '{age}岁，你没有退休。你把那本旧笔记本放回书架，打开了一个新的文档。你正在研究的新课题是"生物年龄逆转的上限在哪里"——这是你42岁之后一直在想的问题。你知道可能这辈子都看不到最终答案，但你也知道：每往前走一步，后面的人就少走一步。',
        triggersRetirementCheck: true,
      },
      {
        id: 'retire_mentor',
        label: '半退休，做平台和导师',
        description: '让年轻人冲锋，你在后方提供经验和方向',
        hint: '幸福+12 · 信念+12 · 压力-10 · 被动收入+10000',
        hintColor: 'positive',
        passiveIncomeChange: 10000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.stress = clamp(s.stress - 10, 0, 100);
        },
        log: '{age}岁，你选择了半退休。你不再亲自跑样本、写论文，但你每周会抽两天在平台上回答年轻研究者的问题，每月给委员会提供一次咨询意见。你在自家阳台上种了花，开始学做饭。人生的答案不在于活多久，在于活着的时候在做什么——你做的事让你觉得没有白活，这就够了。',
        triggersRetirementCheck: true,
      },
    ],
  },
];

// ============================================================
// 跨分支事件（ages 26-45，所有分支均可触发）
// ============================================================

const crossBranchEvents: NarrativeEvent[] = [

  // 27岁：日常缝隙——深夜整理补剂柜
  {
    id: 'bio_daily_midnight_cabinet',
    title: '凌晨两点的药柜',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    ageRange: [27, 27],
    priority: 3,
    weight: 5,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '失眠。台灯亮着，光圈打在厨房台面上，水龙头没拧紧，每隔十几秒滴一下。你站在补剂柜前，瓶瓶罐罐排了两排——NMN、维D、Omega-3、镁、锌、白藜芦醇……有些你记得为什么开始吃，有些你已经忘了。你拿起一瓶NMN，翻到背面，保质期上个月刚过。\n' +
      '你盯着那个日期，没扔，也没放回去。就那么拿着，站在冰箱的嗡嗡声里，发了会儿呆。',
    options: [
      {
        id: 'toss_expired_bottle',
        label: '扔了它，顺便把柜子理一遍',
        description: '过期的就别吃了，顺便清一清',
        hint: '压力-2 · 幸福+2 · biologicalAge+0.5',
        hintColor: 'positive',
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 2, 0, 100);
          s.happiness = clamp(s.happiness + 2, 0, 100);
          adjustBiologicalAge(s, 0.5);
        },
        log: '{age}岁，凌晨两点，你把那瓶过期NMN扔进了垃圾桶。玻璃瓶撞到桶壁，闷响了一声。你又花了半小时把柜子理了一遍，过期的扔、快过期的标记、还能吃的前排。理完之后你看了眼干净了不少的柜子，关上灯，回了卧室。水龙头还在滴。',
      },
      {
        id: 'just_stare',
        label: '就坐着发呆',
        description: '什么都不想，就坐一会儿',
        hint: '压力-3 · 幸福+1',
        hintColor: 'neutral',
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 3, 0, 100);
          s.happiness = clamp(s.happiness + 1, 0, 100);
        },
        log: '{age}岁，凌晨两点，你拿着那瓶过期NMN，在厨房的凳子上坐了下来。台灯把你的影子拉得很长。水龙头滴答滴答，冰箱嗡嗡地响。你什么都不想，就坐着，手里攥着那个凉了的玻璃瓶。不知道过了多久，你站起来，把药放回了柜子里——没扔，也没吃。你回了床，竟然睡着了。',
      },
      {
        id: 'take_anyway',
        label: '过期也没多久，吃了算了',
        description: 'NMN很贵的，过期一两周应该没事',
        hint: '压力+2 · 健康-1 · 生物知识+2',
        hintColor: 'danger',
        skillGains: { bioKnowledge: 2 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 2, 0, 100);
          s.health = clamp(s.health - 1, 0, 100);
        },
        log: '{age}岁，凌晨两点，你拧开那瓶过期NMN，倒了一粒在手心。犹豫了两秒，还是吞了。NMN很贵，过期一两周应该没事——你这样说服自己。药片滑下喉咙的时候，你忽然觉得有点荒唐：你花了这么多钱、这么多精力想要活得更久，却在凌晨两点吃一粒过期的药。你关了灯，水龙头还在滴。',
      },
    ],
  },

  // 30-35岁：镜像角色——老沈
  {
    id: 'bio_mirror_laoshen',
    title: '另一条路的我',
    sceneTag: 'video_call',
    pathId: 'bio_gambler',
    ageRange: [30, 35],
    priority: 5,
    weight: 6,
    oncePerGame: true,
    narrative:
      '你在一次生物黑客线下聚会认识了老沈。他比你大五岁，入坑比你早三年，做的实验比你激进十倍——吃还在动物实验阶段的NAD+前体类似物、某课题组"内部流出来"的多肽、自己混的"配方"，每周抽三次血，胳膊上全是针眼。"你太保守了，"他拍你肩膀，"等我生物年龄降到比实际小十五岁，你还在那磨蹭NMN剂量。"\n' +
      '但你也注意到：他黑眼圈很重，手偶尔会抖，最近刚查出甲状腺指标异常。聚会散场，你看着他匆匆离去的背影，忽然一种奇怪的感觉——他像你，又不像。他走了你差一点就走上的那条路，更猛更快更不留余地。你不确定他是领先了，还是跑偏了。',
    options: [
      {
        id: 'warn_laoshen',
        label: '劝老沈悠着点，别拿自己当试验场',
        description: '他太激进了，得有人拉一把',
        hint: '生物知识+6 · 信念+4 · 幸福+2 · 压力+2',
        hintColor: 'neutral',
        skillGains: { bioKnowledge: 6 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          s.happiness = clamp(s.happiness + 2, 0, 100);
          s.stress = clamp(s.stress + 2, 0, 100);
        },
        log: '{age}岁，你拉住老沈，跟他说了你的担忧。他听完笑了："你们这些保守派都一样，总怕出事。出了事再说嘛。"但他没走，听你讲了十五分钟甲状腺和多肽之间的可能关联。末了他说"我查查"，语气比之前轻了些。你不确定他真会查，但至少你说了。回家的地铁上你看着车窗里自己的脸，觉得比老沈的从容了一些。',
      },
      {
        id: 'learn_from_laoshen',
        label: '跟他取经，看看有没有能借鉴的',
        description: '他的激进里也许有值得学的',
        hint: '健康优化+8 · 生物知识+6 · 健康-2 · 压力+4 · biologicalAge-1',
        hintColor: 'neutral',
        skillGains: { healthOptSkill: 8, bioKnowledge: 6 },
        stateEffect: (s) => {
          s.health = clamp(s.health - 2, 0, 100);
          s.stress = clamp(s.stress + 4, 0, 100);
          adjustBiologicalAge(s, -1);
        },
        log: '{age}岁，你跟老沈聊了两个小时，记了三页笔记。他的某些思路确实给你打开了新角度——比如用连续血糖监测来评估补剂的代谢影响，比如把睡眠数据和炎症标志物交叉分析。但你也注意到他提到那些"实验性物质"时眼里闪的光，那种光你认识，你在{startAge}岁第一次按"买入"时也有过。你回去了，试了他的一部分方法，那些激进的你没碰。',
      },
      {
        id: 'reflect_on_divergence',
        label: '什么都不说，静静观察',
        description: '老沈的选择是他的，你有你的路',
        hint: '生物知识+4 · 信念+6 · 幸福+4 · 压力-2',
        hintColor: 'positive',
        skillGains: { bioKnowledge: 4 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.happiness = clamp(s.happiness + 4, 0, 100);
          s.stress = clamp(s.stress - 2, 0, 100);
        },
        log: '{age}岁，你没劝老沈，也没跟他取经。你只是看着他，像看着另一个版本的自己——那个没踩刹车的版本。聚会散场后你一个人走了很长一段路。路灯把你的影子拉长又缩短，拉长又缩短。你想起自己25岁时也差点买了一瓶来路不明的"实验级"多肽，最后没买。那个"没买"的瞬间，也许就是你和老沈的分岔路口。你把外套拉链拉到了最高，走快了两步。',
      },
    ],
  },

  // 30岁：重大突破新闻
  {
    id: 'bio_cross_breakthrough_news',
    title: '破晓',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    ageRange: [30, 30],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    narrative:
      '一条新闻炸了整个抗衰圈：一家公司的基因疗法在小鼠身上逆转了衰老标志，毛色变黑，握力恢复，寿命延长25%——虽然只是动物实验，却是迄今为止最接近"逆转衰老"的结果。你的社群沸腾了，而你盯着那张白毛小鼠重长黑毛的对比图，心跳加速。\n' +
      '你赌了八年，一直在等这一刻。可当它真的来了，你反而冷静了——你知道从一只黑毛小鼠到一个能让人活到一百二的疗法，中间隔着二十年临床、几百亿投入、无数次失败。但这道光真实存在，你赌的方向终于亮了。',
    options: [
      {
        id: 'double_down_faith',
        label: '更加坚定，加大投入',
        description: '方向被验证了，现在该全力以赴',
        hint: '信念+12 · 压力+4 · 健康+2 · bioPortfolio+20000',
        hintColor: 'positive',
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.stress = clamp(s.stress + 4, 0, 100);
          s.health = clamp(s.health + 2, 0, 100);
          adjustBioPortfolio(s, 20000);
        },
        log: '{age}岁，那条新闻像一针强心剂。你加仓了生科组合，加码了自体方案，连夜写了一篇解读。你赌的不是某只小鼠，是人类不愿向衰老低头的那口气——这口气，今天被证明是通的。',
        blindBoxTrigger: 'bio_breakthrough_news',
      },
      {
        id: 'stay_cautious',
        label: '保持冷静，等人体数据',
        description: '小鼠到人，还有太远的路',
        hint: '生物知识+8 · 信念+4 · 压力-2',
        hintColor: 'neutral',
        skillGains: { bioKnowledge: 8 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          s.stress = clamp(s.stress - 2, 0, 100);
        },
        log: '{age}岁，你发了条动态圈："小鼠不是人，别急着庆祝。"被几个人取关了，但你不后悔。你见过太多小鼠有效、人没效的例子。真正的赌徒，不是看到希望就梭哈，是知道希望和现实之间隔着多少个深夜。你关掉动态圈，又去翻了一篇临床数据。',
      },
      {
        id: 'reflect_meaning',
        label: '思考：活得久，然后呢？',
        description: '方向对了，但你开始问为什么',
        hint: '生物知识+6 · 信念+6 · 幸福+6 · 压力-4',
        hintColor: 'neutral',
        skillGains: { bioKnowledge: 6 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.happiness = clamp(s.happiness + 6, 0, 100);
          s.stress = clamp(s.stress - 4, 0, 100);
        },
        log: '{age}岁，你在那条新闻下面没转发、没评论，而是打开备忘录写了一行："如果人能活到一百二，多出来的四十年，你想用来做什么？"你写不出答案。你忽然发现：你一直在赌"能活多久"，却很少想"活了之后做什么"。也许这才是更大的赌注。',
      },
    ],
  },

  // 33岁：家人健康危机
  {
    id: 'bio_cross_family_crisis',
    title: '倒计时',
    sceneTag: 'hospital',
    pathId: 'bio_gambler',
    ageRange: [33, 33],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你爸住院了。心梗，幸好送得及时，捡回一条命。你在ICU外的走廊上坐了一夜，手里攥着他的体检报告——高血压、高血脂、脂肪肝、颈动脉斑块。他五十八岁，抽烟喝酒不运动爱吃红烧肉，你说过他无数次，他总说"你那套养生是年轻人搞的，我老了改不了"。现在他躺在病床上，管子插满全身。\n' +
      '你看着他那张蜡黄的脸，第一次感到深入骨髓的无力。你能优化自己的生物年龄，却优化不了他的。衰老最残忍的地方就在于——它不会因为你懂科学，就放过你爱的人。',
    options: [
      {
        id: 'help_father_recover',
        label: '用你的知识帮爸康复和改变',
        description: '管不了他自己，但能管他的康复方案',
        hint: '健康优化+10 · 生物知识+6 · 信念+6 · 压力+8 · 幸福+4',
        hintColor: 'positive',
        skillGains: { healthOptSkill: 10, bioKnowledge: 6 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.happiness = clamp(s.happiness + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.parents.health = clamp(s.parents.health + 8, 0, 100);
        },
        log: '{age}岁，你接管了爸爸的康复。你给他配了地中海饮食的食谱，盯着他每天走路，把烟酒断了。他骂你"比医生还烦"，但半年后他的指标好了一截。有天他忽然说"早听你的就好了"。你没接话，只是又给他盛了一碗燕麦。碗磕在桌上，响了一声。',
      },
      {
        id: 'focus_on_self',
        label: '更拼命地优化自己，别重蹈覆辙',
        description: '爸的遭遇是警钟，你要更自律',
        hint: '健康优化+8 · 信念+4 · 压力+10 · 健康+3 · biologicalAge-1',
        hintColor: 'neutral',
        skillGains: { healthOptSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.health = clamp(s.health + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          adjustBiologicalAge(s, -1);
        },
        log: '{age}岁，爸爸出院后，你把自己逼得更紧了。你把每一项指标都当成了和他命运的对赌——你赢一分，就少一分像他那样倒下的可能。但夜深时你也想：你是在爱惜身体，还是在用自律对抗恐惧？',
      },
      {
        id: 'rethink_priorities',
        label: '重新思考：健康是为了什么',
        description: '爸躺在那里，让你想了很多',
        hint: '健康优化+4 · 生物知识+4 · 信念+4 · 幸福+8 · 压力-6',
        hintColor: 'neutral',
        skillGains: { healthOptSkill: 4, bioKnowledge: 4 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress - 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '{age}岁，在ICU外的长椅上，你想通了一件事：你优化健康，不该是为了"赢过时间"，而是为了"有时间陪所爱的人"。你给爸爸订了束花，给自己放了三天假，去陪了他一整天。你想：活得久很重要，但活着的每一天，有人在等你回家，才更重要。',
      },
    ],
  },

  // 35岁：伴侣对你生活方式的担忧
  {
    id: 'bio_cross_partner_concern',
    title: '两个人的时间',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    ageRange: [35, 35],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.isMarried || (s.partner !== null && s.partner.datingStage !== 'single'),
    narrative:
      '一个平常的周末晚上，伴侣放下筷子，看着你："我们能谈谈吗？你每天花两个小时量血压、测血糖、配补剂、记数据。上一次一起吃顿火锅是什么时候？你说你想活到一百二，但和你一起的那个人，现在过得开心吗？"\n' +
      '你愣住了。你以为你在为"两个人更长的未来"努力，可言下之意是"现在的我们"。你忽然意识到一个悖论：你赌的是"未来"，却在透支"现在"。如果未来真的来了，身边那个人还在吗？',
    options: [
      {
        id: 'rebalance_relationship',
        label: '给关系腾出时间，健康让步于生活',
        description: '伴侣说得对，现在比未来更重要',
        hint: '幸福+10 · 健康+2 · 信念+2 · 压力-8 · 伴侣感情+10',
        hintColor: 'positive',
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.health = clamp(s.health + 2, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 2, 0, 100);
          s.stress = clamp(s.stress - 8, 0, 100);
          if (s.partner) s.partner.affection = clamp(s.partner.affection + 10, 0, 100);
        },
        log: '{age}岁，你把补剂柜精简了一半，每天只花半小时搞健康，剩下的还给生活。你陪伴侣吃了火锅、看了电影、熬了一次夜。你说："我赌未来，但不能输掉现在。"伴侣笑了，给你夹了块毛肚。锅里的汤底咕嘟嘟冒着泡，你们都没看手机。',
      },
      {
        id: 'explain_vision',
        label: '解释你的愿景，争取伴侣理解',
        description: '让TA懂你为什么这么做',
        hint: '信念+6 · 幸福+4 · 压力+2 · 伴侣感情+4',
        hintColor: 'neutral',
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.happiness = clamp(s.happiness + 4, 0, 100);
          s.stress = clamp(s.stress + 2, 0, 100);
          if (s.partner) {
            s.partner.affection = clamp(s.partner.affection + 4, 0, 100);
            s.partner.trust = clamp(s.partner.trust + 6, 0, 100);
          }
        },
        log: '{age}岁，你把伴侣拉到桌前，讲了两个小时你的"延寿计划"。TA听完沉默了很久，说："我不完全懂，但我信你是认真的。只是，别把我排除在外。"你们达成了一个妥协：周末两天，一天给你做实验，一天给两个人。你在日历上标了两种颜色——蓝色是你，红色是你们。',
      },
      {
        id: 'stay_the_course',
        label: '坚持自己的节奏，不愿妥协',
        description: '现在让一步，未来就少十年',
        hint: '健康优化+6 · 信念+8 · 幸福-6 · 压力+6 · 伴侣感情-8',
        hintColor: 'danger',
        skillGains: { healthOptSkill: 6 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.happiness = clamp(s.happiness - 6, 0, 100);
          s.stress = clamp(s.stress + 6, 0, 100);
          if (s.partner) s.partner.affection = clamp(s.partner.affection - 8, 0, 100);
        },
        log: '{age}岁，你没妥协。你跟伴侣说："我现在受的苦，是为了我们将来能多活二十年。"伴侣没说话，起身收拾了碗筷。那之后的几个月，家里的空气都是冷的。你想：你也许是对的，但"对"有时候很孤独。',
      },
    ],
  },

  // 38岁：父母衰老加速
  {
    id: 'bio_cross_aging_parent',
    title: '镜子',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    ageRange: [38, 38],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.parents.isAlive,
    narrative:
      '今年过年回家，你发现妈妈老了。不是慢慢变老，是忽然的——头发全白，背驼了，走路要扶墙，你说话得大声她才听得见。她才六十多岁，却像八十岁的人。她颤巍巍地给你盛饭，手抖得汤洒了一半，你想帮她，她推开你的手说"我自己来"，那一瞬间你眼眶热了。\n' +
      '你赌了十六年抗衰，生物年龄比实际小六岁。但你的妈妈，正在以两倍的速度老去。衰老不是你一个人的敌人，它是所有人的命运——你能做的，只是在它带走你爱的人之前，多陪陪他们。',
    options: [
      {
        id: 'spend_time_with_parents',
        label: '多回家陪伴，把时间还给父母',
        description: '健康可以等，父母等不了',
        hint: '幸福+10 · 信念+4 · 压力-6 · 父母关系+10 · 健康+2',
        hintColor: 'positive',
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          s.stress = clamp(s.stress - 6, 0, 100);
          s.health = clamp(s.health + 2, 0, 100);
          s.parents.relationShip = clamp(s.parents.relationShip + 10, 0, 100);
        },
        log: '{age}岁，你把回家的频率从一年一次改成了一季度一次。你陪妈妈买菜、陪爸爸下棋、给他们做你研究的健康餐。妈妈说"你做的菜没味道"，但每顿都吃光。你给不了她多二十年，但你能给她多二十个快乐的周末——你把碗洗了，又听她讲了一遍你小时候的事。',
      },
      {
        id: 'apply_knowledge_to_parents',
        label: '用你的知识延缓父母的衰老',
        description: '对症下药，帮他们也能慢一点老',
        hint: '健康优化+10 · 生物知识+6 · 信念+6 · 压力+6 · 父母健康+10',
        hintColor: 'neutral',
        skillGains: { healthOptSkill: 10, bioKnowledge: 6 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.parents.health = clamp(s.parents.health + 10, 0, 100);
        },
        log: '{age}岁，你给父母量身定制了一套方案：妈妈补钙和维D防骨质疏松，爸爸控血压加阻力训练。他们嫌麻烦，但拗不过你。半年后妈妈走路稳了，爸爸血压降了。你改变不了他们的基因，但能改变他们的习惯——你把方案写在一张A4纸上，贴在他们家冰箱上，旁边就是你的照片。',
      },
      {
        id: 'accept_mortality',
        label: '接受父母的衰老，学会告别',
        description: '有些东西抗衰技术也救不了',
        hint: '生物知识+6 · 信念+8 · 幸福+4 · 压力-4',
        hintColor: 'neutral',
        skillGains: { bioKnowledge: 6 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.happiness = clamp(s.happiness + 4, 0, 100);
          s.stress = clamp(s.stress - 4, 0, 100);
        },
        log: '{age}岁，你看着妈妈颤抖的手，第一次接受了"她会老去"这件事。你没有更强推你的方案，而是坐下来，听她讲了一下午年轻时的故事。你想：你赌的是"活得更久"，但也许更重要的事，是在还来得及的时候，好好说说话。延长寿命的终极意义，不是逃避告别，是有更多时间准备告别。',
      },
    ],
  },
];

// ============================================================
// 危机事件（ages 26-45）
// ============================================================

const crisisEvents: NarrativeEvent[] = [

  // 32岁：补剂导致肝损伤
  {
    id: 'bio_crisis_liver_damage',
    title: '反噬',
    sceneTag: 'clinic',
    pathId: 'bio_gambler',
    ageRange: [32, 32],
    priority: 9,
    weight: 10,
    oncePerGame: true,
    eventType: 'crisis',
    conditions: (s) => (s as any).supplementRegime === true,
    narrative:
      '体检报告上，谷丙转氨酶（ALT）和谷草转氨酶（AST）飙到了正常值的三倍。医生看着你的补剂清单，脸色凝重："白藜芦醇高剂量伤肝，烟酸会升高转氨酶，你自己在网上买的那瓶"复合抗衰配方"成分都不全——你把肝当试验场了。"你坐在诊室里，手脚冰凉。你赌了十年"延长生命"，现在负责代谢所有补剂的肝正在罢工。\n' +
      '医生说："停掉所有补剂，两个月后复查，还高就要做肝穿刺。"你走出医院，阳光很刺眼。你这才怀疑：你到底是在对抗衰老，还是在加速它？',
    options: [
      {
        id: 'stop_all_supplements',
        label: '立刻停掉所有补剂，让肝恢复',
        description: '保命要紧，补剂以后再说',
        hint: '健康+8 · 信念-8 · 压力-6 · biologicalAge+2 · supplementRegime=false',
        hintColor: 'positive',
        stateEffect: (s) => {
          s.health = clamp(s.health + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 8, 0, 100);
          s.stress = clamp(s.stress - 6, 0, 100);
          adjustBiologicalAge(s, 2);
          (s as any).supplementRegime = false;
        },
        log: '{age}岁，你把补剂柜清空了。前两周你浑身不自在，像丢了什么。但两个月后复查，转氨酶回到了正常。你盯着报告，长舒一口气，又叹了口气。你赌了十年，差点把自己赌进ICU。你把空了的药格擦干净，关上柜门，手在门把上停了几秒。',
      },
      {
        id: 'identify_culprit',
        label: '逐个排查，找出元凶后精简',
        description: '不全停，但找出是哪个伤的肝',
        hint: '健康优化+10 · 生物知识+10 · 健康+8 · 信念-4 · 压力+4',
        hintColor: 'neutral',
        skillGains: { healthOptSkill: 10, bioKnowledge: 10 },
        stateEffect: (s) => {
          s.health = clamp(s.health + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 4, 0, 100);
          s.stress = clamp(s.stress + 4, 0, 100);
        },
        log: '{age}岁，你用了三个月做排除法：每周停一种，测一次肝功能。最后锁定是那瓶来路不明的"复合配方"和白藜芦醇高剂量。你扔了它们，留下了证据充分的几样。肝功能恢复了，你的方案也更干净了。这次反噬帮你去掉了垃圾，代价是一座医院的账单和三个月的恐惧——你把药瓶扔进垃圾桶，盖子没盖严。',
      },
      {
        id: 'see_specialist',
        label: '去看肝病专家，系统评估所有补剂',
        description: '别自己瞎搞了，让专业的人把关',
        hint: '生物知识+12 · 健康+8 · 信念-2 · 压力-2 · 存款-5000',
        hintColor: 'positive',
        skillGains: { bioKnowledge: 12 },
        savingsChange: -5000,
        stateEffect: (s) => {
          s.health = clamp(s.health + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 2, 0, 100);
          s.stress = clamp(s.stress - 2, 0, 100);
        },
        log: '{age}岁，你花了一个月挂了三个专家号。肝病专家帮你逐项评估了补剂的肝毒性风险，划掉了六种，调整了三种的剂量。你说："早该来的。"专家说："大多数生物黑客都是出了事才来。"你攥着那张划满红线的清单走出医院，门口的银杏叶落了一地，踩上去很脆。',
      },
    ],
  },

  // 36岁：重大生物科技欺诈丑闻
  {
    id: 'bio_crisis_fraud_scandal',
    title: '纸牌屋',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    ageRange: [36, 36],
    priority: 9,
    weight: 10,
    oncePerGame: true,
    eventType: 'crisis',
    narrative:
      '一夜之间，抗衰圈的地标塌了。那家被奉为"下一个Theranos反面"的明星公司——号称用表观遗传重编程逆转衰老——被查出核心数据造假。那位曾在TED上演讲的创始人连夜删了所有社交媒体。你重仓过这只股票，虽然泡沫时减了仓，剩下的部分一天内也跌了85%。让你心寒的不仅是钱，是信任——你信过这个人，你甚至在自己的专栏里推荐过他。\n' +
      '你打开当年写的那篇推荐文章，看着屏幕上自己写的"这是我见过最诚实的创业者"，胃里一阵翻涌。你赌了十几年抗衰，第一次被人从内部捅了一刀。技术没失败，失败的是人心——这个领域最大的风险，不是科学的不确定，是骗子混在先知里。',
    options: [
      {
        id: 'admit_mistake',
        label: '公开认错，重建公信力',
        description: '你推荐过他，你得负责',
        hint: '信念+8 · 幸福+4 · 压力+6 · 存款-30000',
        hintColor: 'positive',
        savingsChange: -30000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.happiness = clamp(s.happiness + 4, 0, 100);
          s.stress = clamp(s.stress + 6, 0, 100);
        },
        log: '{age}岁，你写了一篇长文："我错了。我被骗了，我也可能误导了你们。"文章发出后被骂了三天，但也有人说"谢谢你诚实"。你的信誉反而涨了——因为在这个满是吹牛的领域，认错比吹牛稀缺。你想：公信力碎了可以重建，但前提是你敢承认它碎过。',
      },
      {
        id: 'toughen_due_diligence',
        label: '痛定思痛，建立更严格的尽调流程',
        description: '以后只信数据，不信故事',
        hint: '投资分析+12 · 生物知识+10 · 信念+4 · 压力+4',
        hintColor: 'neutral',
        skillGains: { investmentSkill: 12, bioKnowledge: 10 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          s.stress = clamp(s.stress + 4, 0, 100);
        },
        log: '{age}岁，你没写文章，而是写了一份"抗衰投资尽调清单"——二十七个必查项，从原始数据到利益冲突。你把它开源了，成了圈里的标准工具。你被骗一次，就让骗子以后更难骗人。清单最后一条写着："如果你不愿意查完这27项，就别投。"你加了个感叹号，又删了，改成句号。',
      },
      {
        id: 'doubt_everything',
        label: '怀疑一切，大幅收缩抗衰投入',
        description: '连"诚实的人"都骗了你，还能信谁',
        hint: '信念-12 · 幸福-6 · 压力+8 · bioPortfolio↓',
        hintColor: 'danger',
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith - 12, 0, 100);
          s.happiness = clamp(s.happiness - 6, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
          adjustBioPortfolio(s, -50000);
        },
        log: '{age}岁，你清掉了一半仓位，停了大部分自体实验。你开始怀疑：也许整个抗衰领域，都是一场精心包装的骗局。你失眠了一周，反复问自己"我赌了十四年，到底赌的是什么"。答案没有来。你只是更累了，更冷了，更不敢相信了。',
      },
    ],
  },

  // 40岁：重仓公司三期临床失败
  {
    id: 'bio_crisis_portfolio_wipeout',
    title: '归零',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    ageRange: [40, 40],
    priority: 9,
    weight: 10,
    oncePerGame: true,
    eventType: 'crisis',
    conditions: (s) => getBioPortfolio(s) > 50000,
    narrative:
      '你重仓了六年的那家公司——那个你逢人就夸的"抗衰希望"——三期临床失败了。主要终点没达到，安全性还出了问题，两个受试者出现严重不良反应。盘后股价跌了72%，你的组合一夜蒸发大半。你为这家公司写过分析、参加过股东大会、在评论区和人争论过它的管线，你比大多数分析师都懂它——但科学不care你懂不懂，它就是失败了。\n' +
      '你十八年的赌注，在这一刻显得特别脆弱。你忽然想：也许你从来就不是在"投资"，你是在"信仰"。而信仰，是会归零的。',
    options: [
      {
        id: 'accept_and_rebuild',
        label: '接受失败，用剩下的筹码重建',
        description: '赌局没结束，你还有本钱',
        hint: '投资分析+10 · 信念+6 · 压力+4 · 幸福+4 · bioPortfolio缓慢恢复',
        hintColor: 'positive',
        skillGains: { investmentSkill: 10 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.stress = clamp(s.stress + 4, 0, 100);
          s.happiness = clamp(s.happiness + 4, 0, 100);
          adjustBioPortfolio(s, -100000);
          adjustBioPortfolio(s, 30000);
        },
        log: '{age}岁，你在损失了一大半后，没崩溃。你把剩下的仓位重新配置，分散到五家不同阶段的公司。你赌的是"抗衰会突破"，赌的不是"这一家会成功"。一家失败不代表方向错，只是说明你把太多筹码压在了同一个故事上。你舔了舔伤口，重新发牌。',
      },
      {
        id: 'analyze_failure',
        label: '深挖失败原因，变成知识',
        description: '失败也是数据，别浪费',
        hint: '投资分析+12 · 生物知识+12 · 信念+4 · 压力+6',
        hintColor: 'neutral',
        skillGains: { investmentSkill: 12, bioKnowledge: 12 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          s.stress = clamp(s.stress + 6, 0, 100);
          adjustBioPortfolio(s, -100000);
        },
        log: '{age}岁，你没急着重建，而是花了一个月研究它为什么失败。你发现它的动物模型有缺陷，二期数据被过度解读，安全性信号早被忽略。你把这些写成了报告，在圈里流传。学费很贵，但学到了就是赚了——你把报告最后改了一遍，标题从"失败分析"改成了"下一次怎么赢"。',
      },
      {
        id: 'question_the_bet',
        label: '质问自己：还要继续赌吗',
        description: '也许该认输，回归正常生活',
        hint: '信念-12 · 幸福-8 · 压力+10 · bioPortfolio变现',
        hintColor: 'danger',
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith - 12, 0, 100);
          s.happiness = clamp(s.happiness - 8, 0, 100);
          s.stress = clamp(s.stress + 10, 0, 100);
          adjustBioPortfolio(s, -getBioPortfolio(s));
        },
        log: '{age}岁，你清了仓。你坐在空荡荡的书房里，看着那个归零的补剂柜和清空的股票账户，问自己："值吗？"十八年，你错过了多少火锅、多少电影、多少个不该错过的夜晚？你赌的是"活得更久"，但你好像忘了"活着"本身。你没找到答案，但你终于允许自己把这个问题问出口。',
      },
    ],
  },
];

// ============================================================
// 失败预警事件（isAllInPath=true 且 pathFaith<40 或存款告急时触发）
// ============================================================

const bioWarningEvents: NarrativeEvent[] = [

  // 预警1：实验数据没有突破，钱烧得很快，投资人开始催
  {
    id: 'bio_warning_no_result',
    title: '没有p值的日子',
    sceneTag: 'lab',
    pathId: 'bio_gambler',
    ageRange: [28, 50],
    priority: 15,
    weight: 10,
    oncePerGame: true,
    eventType: 'crisis',
    conditions: (s) => s.isAllInPath === true && (s.pathFaith < 40 || s.currentSavings < 50000),
    narrative:
      '第十八次实验了。小鼠握力没有统计学差异，DNA甲基化时钟和对照组几乎重合，端粒长度的变化在误差范围内。你盯着那个0.07的p值看了很久——差一点，但科学不相信"差一点"。你投进去的钱已经超过所有积蓄，试剂贵得像液体黄金，按目前的烧钱速度还能撑四个月。\n\n' +
      '投资人发来消息："进度怎么样了？"只有五个字，你却读懂了背后的意思。实验室很安静，只有离心机的嗡鸣和-80度冰箱的压缩机声。你看着笼子里那些小鼠，它们不知道自己正在吃一个普通人一辈子的积蓄——如果这些实验永远做不出阳性结果呢？如果衰老根本没有"开关"呢？如果我花的所有钱、所有时间，最后只证明了一件事——人总是会老的？',
    options: [
      {
        id: 'double_down_experiment',
        label: '追加投入，扩大样本量',
        description: '再投一笔钱买更多小鼠、做更多测序，用样本量砸出显著性',
        hint: '生物知识+12 · 投资分析+5 · 存款-80000 · 信念-5 · 压力+18 · 健康-8',
        hintColor: 'danger',
        skillGains: { bioKnowledge: 12, investmentSkill: 5 },
        savingsChange: -80000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
          s.stress = clamp(s.stress + 18, 0, 100);
          s.health = clamp(s.health - 8, 0, 100);
        },
        log: '你又买了六十只小鼠，加了三个实验组，送了九十六个样本去做全基因组甲基化测序。信用卡刷爆了两张，你找朋友借了一笔钱。六周后数据出来了——p值0.03，显著。你坐在实验室里看着那个0.03，没有狂喜，只有一种虚脱的感觉。你知道这只是开始，后面还有验证、重复、机制实验……但至少，你又有理由继续走下去了。',
      },
      {
        id: 'pivot_approach',
        label: '换方向，承认这条路走不通',
        description: '放弃当前靶点，转向更有前景的方向，及时止损',
        hint: '生物知识+15 · 健康优化+8 · 信念-15 · 压力+10 · 存款-20000 · 幸福+3',
        hintColor: 'neutral',
        skillGains: { bioKnowledge: 15, healthOptSkill: 8 },
        savingsChange: -20000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith - 15, 0, 100);
          s.stress = clamp(s.stress + 10, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
        },
        log: '你停掉了做了十八个月的mTOR（细胞生长开关，控制身体是修复还是生长）通路实验，把数据整理成一篇阴性结果的论文投了出去——科学界需要阴性结果，虽然它们发不了顶刊。你转向了一个新的方向：senolytics（清理剂）。新靶点的前期数据好得让你想哭。你发现：放弃不是失败，是给自己一个走到正确道路上的机会。在科研上，死磕和死胡同只有一线之隔。',
      },
      {
        id: 'publish_anyway_seed',
        label: '先把现有数据整理发表，争取下一轮 funding',
        description: '不管结果好不好，先出论文，用论文去申请新的资金',
        hint: '生物知识+8 · 投资分析+10 · 信念+5 · 压力+12 · 存款-10000',
        hintColor: 'positive',
        skillGains: { bioKnowledge: 8, investmentSkill: 10 },
        savingsChange: -10000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.stress = clamp(s.stress + 12, 0, 100);
        },
        log: '你花了两个月把已有的数据整理成一篇论文，投了一个三分的开源期刊。审稿意见不算好，但给了大修。你同时写了一份基金申请和一份商业计划书，发给了十几个投资人和机构。一个做长寿基金的合伙人回了邮件："你的思路有意思，我们约个时间聊聊。"你看着那封邮件，想起了做科研最重要的一课：p值不显著不代表没有价值——故事讲得好，阴性结果也能打开下一扇门。',
      },
    ],
  },

  // 预警2：自己的身体出了问题，长期自实验的副作用
  {
    id: 'bio_warning_body_rebel',
    title: 'N=1的反噬',
    sceneTag: 'illness',
    pathId: 'bio_gambler',
    ageRange: [28, 50],
    priority: 14,
    weight: 10,
    oncePerGame: true,
    eventType: 'crisis',
    conditions: (s) => s.isAllInPath === true && (s.pathFaith < 40 || s.currentSavings < 50000),
    narrative:
      '你在凌晨四点被心悸弄醒。心跳快得像刚跑完马拉松，但你平躺在床上，数了一下脉搏——130次/分。胸口有一种紧缩感，左臂微微发麻。你的第一反应不是"我可能心脏病发作了"，而是"这会不会是NMN叠加雷帕霉素的交互作用？"你已经在自己身上做了三年实验，数据库里有四百多份血检报告——你曾骄傲地跟人说"我是自己最好的实验对象"。\n\n' +
      '但现在你躺在黑暗中，心脏乱撞，你突然害怕了。你想起去年肝功能异常你告诉自己"只是一过性的"，三个月前开始的耳鸣你归因于"压力大"，最近一直腹泻但你没停任何补剂——因为你需要连续的数据。你打开手机搜索"rapamycin tachycardia side effects"，第一条是一个Reddit帖子："I almost killed myself self-experimenting"。你看着那个标题，心悸还在继续——我在对抗衰老，但如果我先把自己搞死了，一切数据还有什么意义？',
    options: [
      {
        id: 'stop_all_supplements',
        label: '立即停止所有自实验，去医院检查',
        description: '停掉所有补剂和实验方案，做一次全面体检，听医生的话',
        hint: '健康+20 · 幸福+8 · 压力-15 · 信念-12 · 存款-15000 · 生物年龄+2',
        hintColor: 'positive',
        savingsChange: -15000,
        stateEffect: (s) => {
          s.health = clamp(s.health + 20, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress - 15, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 12, 0, 100);
          adjustBiologicalAge(s, 2);
          s.supplementRegime = false;
        },
        log: '你当天早上就把所有补剂收进了柜子，预约了全套体检。心电图显示偶发早搏，医生说跟过度刺激和睡眠不足有关，没有器质性病变，但命令你"立即停止一切自行服用的物质"。你遵医嘱停了三个月。身体恢复了正常，心悸消失了，肝功能回到了基线。你学到了一个用健康换来的教训：在自己身上做实验，n=1的代价是你自己的身体。科学需要勇气，但不需要烈士。',
        isRestOption: true,
      },
      {
        id: 'reduce_dosage_careful',
        label: '减量不减停，精细化调整方案',
        description: '降低剂量、去掉风险最高的补剂，在安全边界内继续',
        hint: '健康优化+12 · 生物知识+8 · 信念+3 · 压力+8 · 健康+5 · 存款-5000',
        hintColor: 'neutral',
        skillGains: { healthOptSkill: 12, bioKnowledge: 8 },
        savingsChange: -5000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
          s.health = clamp(s.health + 5, 0, 100);
        },
        log: '你停了雷帕霉素，把NMN剂量减半，加了辅酶Q10和镁，开始每天早上测静息心率并做记录。心悸在一周内消失了。你设计了一个更保守的方案——每种新补剂单独引入，观察两周再加下一种，并且每季度做一次全面血检。自实验没有停止，但你学会了敬畏。你在实验笔记的扉页上写了一行字："First, do no harm——对实验对象负责，哪怕那个实验对象是你自己。"',
      },
      {
        id: 'push_through_n1',
        label: '这只是调整反应，继续原方案',
        description: '身体在适应，过了Herxheimer反应就好了，数据不能断',
        hint: '信念-3 · 压力+15 · 健康-20 · 幸福-12 · 生物年龄+1 · 存款+0',
        hintColor: 'danger',
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith - 3, 0, 100);
          s.stress = clamp(s.stress + 15, 0, 100);
          s.health = clamp(s.health - 20, 0, 100);
          s.happiness = clamp(s.happiness - 12, 0, 100);
          adjustBiologicalAge(s, 1);
        },
        log: '你告诉自己这是Herxheimer反应（愈合反应），是补剂在起作用的表现。你没有停任何东西，甚至加了剂量。两周后你在实验室里晕倒了，被学生送到急诊。诊断结果是药物性肝损伤加窦性心律不齐。你在病床上躺了三天，看着天花板想：如果David Sinclair在自己身上实验的时候出了这种事，他会怎么选？答案你不知道，但你知道自己不是David Sinclair——你只是一个拿自己身体下注的普通人，而赌注太高了。',
      },
    ],
  },

];

// ============================================================
// All In 后事件（ages 28-36, conditions: s.isAllInPath === true, priority 8）
// ============================================================

const postAllInEvents: NarrativeEvent[] = [

  // 第一次学术会议
  {
    id: 'bio_post_allin_conference',
    title: '第一次学术会议',
    sceneTag: 'conference',
    pathId: 'bio_gambler',
    ageRange: [28, 36],
    priority: 8,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '你站在衰老生物学学术会议的注册台前，手里攥着印着"独立研究者/投资顾问"的名片——不是博士生、不是教授、不是任何机构的研究员，但你买了全票，坐在第一排。以前你只能在视频平台看这些会议的录像，现在你就在会场里，走廊飘着咖啡和投影的味道，白板笔在幕布上沙沙画着通路图。你不再是那个在宿舍啃综述的业余爱好者了。\n' +
      '茶歇时，一个白发教授主动过来聊起来——他看过你写的那篇NAD+前体临床数据的荟萃分析，说"有些观点挺尖锐，但数据梳理得不错"。你端着咖啡的手微微发抖，你等这句话等了六年。你不是来蹭会的，你是来证明：一个没有博士学位的人，也能坐在这张桌子前。',
    options: [
      {
        id: 'network_actively',
        label: '主动社交，认识每一个能聊的人',
        description: '全职入局者，人脉就是情报网',
        hint: '生物知识+8 · 投资分析+5 · 信念+6 · 压力+4 · 幸福+5',
        hintColor: 'positive',
        skillGains: { bioKnowledge: 8, investmentSkill: 5 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.stress = clamp(s.stress + 4, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        log: '你发出去了四十张名片，加了二十多个社交软件，约了五个一对一的咖啡。你发现那些教授并不像你想象中高高在上——他们也关心投资机会，也好奇民间的自体实验数据。会议结束后你在高铁上整理笔记，写满了十二页。窗外的风景飞速后退，你第一次觉得：你不再是门外汉了，你是这个领域的一分子。',
      },
      {
        id: 'soak_it_all_in',
        label: '安静听讲，把每一个报告吃透',
        description: '先别急着社交，把知识装满再说话',
        hint: '生物知识+12 · 健康优化+5 · 信念+4 · 压力+2',
        hintColor: 'neutral',
        skillGains: { bioKnowledge: 12, healthOptSkill: 5 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          s.stress = clamp(s.stress + 2, 0, 100);
        },
        log: '三天的会议你一场没落下，笔记写了满满一本。你没怎么社交，但在最后一场圆桌讨论时，你站起来问了一个关于 senolytics 临床试验设计的问题。讲者愣了一下，然后认真回答了三分钟。坐下的时候你手心全是汗，但旁边一个博士生转头小声说："好问题。"你没说话，只是在笔记本的空白处画了一个小小的星号。',
      },
      {
        id: 'feel_like_imposter',
        label: '有些恍惚——我真的属于这里吗？',
        description: '没有博士学位，没有实验室，你是个局外人',
        hint: '生物知识+6 · 压力+6 · 信念-2 · 幸福+2',
        hintColor: 'neutral',
        skillGains: { bioKnowledge: 6 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 2, 0, 100);
          s.happiness = clamp(s.happiness + 2, 0, 100);
        },
        log: '你坐在会场里，周围全是PhD和MD，忽然有一种强烈的冒名顶替感。你没有实验室、没有课题组、没有NSF的经费——你只是一个辞职了的普通人，用自己的钱和身体在赌。但茶歇时那个白发教授说的那句话一直在你脑子里转："科学不问你从哪来，只问你看到了什么。"你深吸一口气，把"局外人"三个字从笔记本上划掉了。',
      },
    ],
  },

  // 数据说话——最新生物标志物结果
  {
    id: 'bio_post_allin_test_results',
    title: '数据说话',
    sceneTag: 'clinic',
    pathId: 'bio_gambler',
    ageRange: [28, 36],
    priority: 8,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '你辞职后第一次全套生物标志物检测报告出来了。你坐在书桌前，深呼吸，点开PDF。辞职后的这一年，你把以前挤在晚上和周末的事全放进了白天——每天七点测心率变异性、每周三次力量训练加两次有氧、严格的16:8断食、精准到毫克的补剂、每月一次抽血复查。\n' +
      '趋势线在说话：你的生物年龄偏移比辞职前多了-2.3岁，炎症指标持续下降，胰岛素敏感性回到了二十出头。但有几个指标也亮了黄灯——TSH偏高，提示甲状腺在长期热量限制下承受了压力；睡眠评分比上班时还差，因为你总在半夜醒来查论文。你盯着那些数字，忽然意识到：全职投入不等于盲目加码。你的身体是你唯一的实验对象，赌不起失败。',
    options: [
      {
        id: 'double_down_optimization',
        label: '根据数据全面加码，把异常指标也修正',
        description: '全职了就该做到极致，每个指标都要优化',
        hint: '健康优化+12 · 生物知识+6 · 健康+4 · 压力+8 · 信念+8 · biologicalAge-2',
        hintColor: 'positive',
        skillGains: { healthOptSkill: 12, bioKnowledge: 6 },
        stateEffect: (s) => {
          s.health = clamp(s.health + 4, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          adjustBiologicalAge(s, -2);
        },
        log: '你针对异常指标重新设计了方案：降低训练量给甲状腺减负、加入冥想改善睡眠、调整断食窗口避免皮质醇长期偏高。三个月后复查，TSH回到正常范围，睡眠评分提升了40%。你在对比表的最右边加了一列——"目标值"。全职的好处就是：你有时间把每一个数字都追到它该在的位置。',
      },
      {
        id: 'adjust_for_balance',
        label: '修正方案，不再追求所有指标满分',
        description: '身体是一个系统，不是一张成绩单',
        hint: '健康优化+8 · 幸福+8 · 健康+6 · 压力-6 · 信念+4 · biologicalAge-1',
        hintColor: 'positive',
        skillGains: { healthOptSkill: 8 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.health = clamp(s.health + 6, 0, 100);
          s.stress = clamp(s.stress - 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          adjustBiologicalAge(s, -1);
        },
        log: '你删掉了Excel里的"目标值"列，改成了"舒适区间"。你不再为了0.2的炎症因子浮动而焦虑，不再设闹钟半夜起来喝水。你学会了接受：有些数字不完美，但整个人感觉更好了。一个月后你意外发现——放松下来之后，那些你不再死磕的指标反而变好了。身体不是考试，你不需要考满分。',
      },
      {
        id: 'data_doubts',
        label: '看着数据，第一次怀疑这一切是否值得',
        description: '花了这么多钱和时间，只年轻了两岁多？',
        hint: '生物知识+8 · 信念-6 · 压力+4 · 幸福-2',
        hintColor: 'danger',
        skillGains: { bioKnowledge: 8 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith - 6, 0, 100);
          s.stress = clamp(s.stress + 4, 0, 100);
          s.happiness = clamp(s.happiness - 2, 0, 100);
        },
        log: '你盯着-2.3岁那个数字，忽然觉得它太小了。六年的自律、几十万的补剂、辞职的勇气，只换来了不到三岁的生物年龄差？你把报告扔进抽屉，一个星期没测任何数据。但第八天早上你醒来，发现自己还是习惯性地戴上了心率戒指——原来怀疑归怀疑，你已经停不下来了。也许这就是赌徒的宿命：你可以质疑赌注，但你无法离开牌桌。',
      },
    ],
  },

  // 不被理解——朋友觉得你疯了
  {
    id: 'bio_post_allin_isolation',
    title: '不被理解',
    sceneTag: 'restaurant',
    pathId: 'bio_gambler',
    ageRange: [28, 36],
    priority: 8,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => s.isAllInPath === true,
    narrative:
      '大学同学聚会，你坐在圆桌旁，面前是一杯温水。点菜时你说"我不吃精制碳水"，有人笑了："你还在搞你那套养生啊？"喝酒时你端着水杯，有人起哄："辞职了连酒都不喝了？"你说你在做抗衰研究，有人问你赚多少钱——比上班时少，不稳定，全桌安静了两秒，然后有人打圆场："理想主义嘛，可以理解。"\n' +
      '饭局散场，一个曾经关系最好的朋友拉着你说："你以前在公司前途好好的，辞职搞什么长生不老，你不觉得有点走火入魔了吗？"你想解释——解释能量货币、解释表观遗传——但看着他的眼神，你知道解释没用。在他眼里，你就是被伪科学骗了、往水里扔钱的人。地铁上你刷到群里有人发了一张你端着水杯的照片，配文"我们的养生达人"，后面一串哈哈哈。你关了屏幕，靠在车窗上——车窗里你的脸比他们都年轻，但表情比他们都老。',
    options: [
      {
        id: 'stand_firm',
        label: '不解释，用结果说话',
        description: '十年后他们会明白的，现在说什么都没用',
        hint: '信念+10 · 压力+6 · 幸福-4 · 健康+2 · biologicalAge-1',
        hintColor: 'neutral',
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.stress = clamp(s.stress + 6, 0, 100);
          s.happiness = clamp(s.happiness - 4, 0, 100);
          s.health = clamp(s.health + 2, 0, 100);
          adjustBiologicalAge(s, -1);
        },
        log: '你没在群里回任何消息。你把手机调成静音，回家做了一组训练，睡前读了两篇论文。你跟自己说："等你五十岁的时候，看着他们吃降压药、查血糖、抱怨关节痛——你不需要说任何话，你的存在本身就是回答。"但关灯之后你还是躺了很久才睡着。孤独不是不被理解，是你明明知道自己是对的，却无法证明。',
      },
      {
        id: 'try_to_explain',
        label: '认真写一篇长文解释给朋友听',
        description: '也许他们只是不了解，不是故意嘲笑',
        hint: '生物知识+8 · 幸福+4 · 信念+4 · 压力+4',
        hintColor: 'positive',
        skillGains: { bioKnowledge: 8 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          s.stress = clamp(s.stress + 4, 0, 100);
        },
        log: '你花了一个晚上写了一篇长文，从基础生物学讲起，解释你为什么辞职、为什么相信抗衰不是伪科学、你到底在做什么。发出去之后，有三个人认真看完了，其中一个私聊你说"我之前不理解，现在有点懂了"。其他的人没回。你看着那条私聊，忽然觉得够了——你不需要所有人理解你，有三个人愿意听，就比没有人强。',
      },
      {
        id: 'compromise_socially',
        label: '偶尔妥协，聚会时别太格格不入',
        description: '信仰是自己的，没必要在饭桌上树敌',
        hint: '幸福+8 · 信念-2 · 压力-4 · 健康-1',
        hintColor: 'neutral',
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 2, 0, 100);
          s.stress = clamp(s.stress - 4, 0, 100);
          s.health = clamp(s.health - 1, 0, 100);
        },
        log: '下次聚会你没再拒绝——你喝了小半杯红酒，吃了两口蛋糕，没解释任何东西。你发现偶尔破戒并没有让你的指标天塌下来，反而让你和朋友之间的空气松快了很多。你回家后测了血糖，确实飙高了，但第二天就恢复了。你在笔记本上写了一行："坚持原则，但不要让原则变成牢笼。"你把"偶尔"两个字圈了起来。',
      },
    ],
  },

  // v13新增：AI制药突破——中期投资组合增长事件
  {
    id: 'bio_ai_pharma_breakthrough',
    title: 'AI加速',
    sceneTag: 'clinic',
    pathId: 'bio_gambler',
    ageRange: [33, 44],
    priority: 7,
    weight: 10,
    oncePerGame: true,
    conditions: (s) => (s.pathSkills?.bioKnowledge || 0) >= 35,
    narrative:
      '你关注了三年的那家AI制药公司发布了二期临床数据——他们用AI设计的候选药物，在衰老相关适应症上达到主要终点。消息出来那天你整夜没睡。你从B轮就开始跟踪，C轮时重仓买入——不是跟风，你读过他们团队每一篇预印本，对照过靶点的生物学机制，你判断他们的分子设计逻辑是对的。市场花了两天才反应过来，第三天开盘股价跳涨。\n' +
      '这不是运气，是你十年读的每一篇论文、跟踪的每一个靶点帮你做出的判断。但你也清楚：二期成功不等于上市，后面还有三期、FDA审批、商业化，任何一步都可能翻车。你现在要决定：落袋为安，还是继续持有赌更大的？',
    options: [
      {
        id: 'take_profits',
        label: '减持一半，锁定利润',
        description: '先把本金和部分利润收回，剩下的继续赌',
        hint: '投资分析+8 · 生物知识+6 · bioPortfolio稳健增长 · 信念+6 · 压力-4',
        hintColor: 'positive',
        skillGains: { investmentSkill: 8, bioKnowledge: 6 },
        stateEffect: (s) => {
          const cur = getBioPortfolio(s);
          // 卖出30%落袋为安（现金自动回到savings），剩下的70%继续上涨80%
          const sellAmount = Math.round(cur * 0.3);
          adjustBioPortfolio(s, -sellAmount);
          (s as any).bioPortfolio = Math.round((s as any).bioPortfolio * 1.8);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.stress = clamp(s.stress - 4, 0, 100);
        },
        log: '你减持了四成仓位，本金回来还落了一笔利润。剩下的六成继续持有——结果半个月后股价又涨了30%。你没有后悔。落袋不是看空，是让自己"不管涨跌都睡得着"。半年后这款药物进入三期临床，你的剩余仓位又翻了一倍。你学到了最重要的一课：在这个赛道上，活着比赚最多更重要。',
      },
      {
        id: 'hold_position',
        label: '继续持有，赌三期成功',
        description: '相信判断，让利润奔跑',
        hint: '生物知识+8 · 信念+8 · bioPortfolio可能大增或大减 · 压力+6',
        hintColor: 'danger',
        skillGains: { bioKnowledge: 8 },
        stateEffect: (s) => {
          const cur = getBioPortfolio(s);
          const roll = Math.random();
          if (roll < 0.35) {
            // 大涨：三期前景乐观
            (s as any).bioPortfolio = Math.round(cur * 2.0);
            s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
            s.happiness = clamp(s.happiness + 10, 0, 100);
          } else if (roll < 0.7) {
            // 温和上涨
            (s as any).bioPortfolio = Math.round(cur * 1.4);
            s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          } else {
            // 回调：市场质疑可复制性
            (s as any).bioPortfolio = Math.round(cur * 0.7);
            s.stress = clamp(s.stress + 10, 0, 100);
            s.pathFaith = clamp(s.pathFaith - 3, 0, 100);
          }
          s.stress = clamp(s.stress + 6, 0, 100);
        },
        log: '你选择持有。接下来的半年像坐过山车——股价先涨了40%，然后因为一篇质疑文章跌了25%，然后在FDA突破性疗法认定的消息出来后又涨回来。年底结算时，你的仓位涨了40%到翻倍不等。你在日记里写："赌徒的勇气不是敢下注，是敢等。"',
      },
      {
        id: 'diversify_holdings',
        label: '减持个股，加仓生科ETF分散风险',
        description: '不赌单一公司，押注整个赛道',
        hint: '投资分析+12 · 生物知识+5 · bioPortfolio稳健+30% · 信念+5 · 压力-2',
        hintColor: 'positive',
        skillGains: { investmentSkill: 12, bioKnowledge: 5 },
        stateEffect: (s) => {
          const cur = getBioPortfolio(s);
          (s as any).bioPortfolio = Math.round(cur * 1.3);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.stress = clamp(s.stress - 2, 0, 100);
        },
        log: '你减持了单一公司的仓位，把资金分散到一篮子生科ETF和几个不同靶点的公司。单个公司的暴涨你吃不到全部，但任何一个暴雷也不会让你归零。年底ETF涨了30%，你的总组合稳稳上涨。你意识到：从赌一家公司到赌整个赛道，是从赌徒到投资者的蜕变。',
      },
    ],
  },
];

// ============================================================
// 后期事件（ages 42-55, priority 7）
// ============================================================

const lateGameEvents: NarrativeEvent[] = [

  // 同龄人——你看起来年轻10岁但钱更少
  {
    id: 'bio_late_younger_peers',
    title: '同龄人',
    sceneTag: 'restaurant',
    pathId: 'bio_gambler',
    ageRange: [42, 55],
    priority: 7,
    weight: 8,
    oncePerGame: true,
    narrative:
      '毕业{years}周年聚会，你走进包间的那一刻，有几秒钟没人认出你。当年睡你上铺的兄弟胖了三十斤正吃降压药，班长白了一半头发，当年追过的女生在聊更年期——而你上个月刚测的表观遗传时钟说你的生物年龄是34岁。"你是不是整容了？"有人问。但聊到收入和房产，空气微妙地变了：当年成绩不如你的人已是总监、VP，年薪七位数、两套房，而你辞职了十几年，存款不多，房子是小公寓。\n' +
      '有人问"那你这些年在干什么"，你说"在研究抗衰老"，全桌笑了。你端着水杯，忽然不知道该骄傲还是该心酸——你赌了{years}年，赢了年龄，输了世俗的成功。这笔交易值吗？饭局结束，班长走在你旁边小声说："说真的……你那套……真的有用吗？"你看着他眼里的光，那不是嘲讽，是一个中年男人对时间的恐惧。',
    options: [
      {
        id: 'pride_in_health',
        label: '健康就是最大的财富，不后悔',
        description: '他们有钱，但你有他们买不到的东西',
        hint: '信念+10 · 幸福+8 · 健康+4 · 压力-4',
        hintColor: 'positive',
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.health = clamp(s.health + 4, 0, 100);
          s.stress = clamp(s.stress - 4, 0, 100);
        },
        log: '你没跟他们比存款。你知道他们深夜会被胸痛惊醒、会在体检前焦虑失眠、会在看着孩子长大时害怕自己看不到那一天。而你每天早上醒来精力充沛，静息心率52，VO2max比十年前还好。你端着水杯跟班长碰了一下："有用。等你想认真聊聊的时候找我。"他掏出手机加了你社交软件。你知道，又一个人开始问那个问题了。',
      },
      {
        id: 'bittersweet_truth',
        label: '五味杂陈——年轻但贫穷，这是代价',
        description: '你赢了一些，也输了一些',
        hint: '生物知识+6 · 信念+4 · 幸福+2 · 压力+4',
        hintColor: 'neutral',
        skillGains: { bioKnowledge: 6 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          s.happiness = clamp(s.happiness + 2, 0, 100);
          s.stress = clamp(s.stress + 4, 0, 100);
        },
        log: '回家的地铁上你看着车窗里自己的脸——确实比同龄人年轻很多。但你也想了想存款数字、房子面积、退休账户。你不能说不羡慕他们的财务自由。你翻开手机看了看自己的生物标志物报告，又看了看银行卡余额。然后你关上手机，跟自己说："每条路都有代价，你的代价是钱，他们的代价是身体。只是你的代价看得见，他们的还在来的路上。"',
      },
      {
        id: 'rebalance_life',
        label: '开始重新考虑赚钱——健康和钱都要有',
        description: '也许不必二选一，你可以两者兼得',
        hint: '投资分析+8 · 健康优化+5 · 信念+4 · 压力+6 · 被动收入+8000',
        hintColor: 'neutral',
        skillGains: { investmentSkill: 8, healthOptSkill: 5 },
        passiveIncomeChange: 8000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          s.stress = clamp(s.stress + 6, 0, 100);
        },
        log: '那次聚会之后你开始认真思考钱的问题。你用二十年积累的知识开了付费咨询、做了线上课程、重新调整了投资组合。你发现——你不需要在健康和财富之间二选一。你的知识本身就是财富，只是你之前不好意思变现。半年后你的被动收入追平了上班时的工资，而你的训练计划一天没落下。你终于懂了：长寿不是苦行，是让自己有足够的时间和本钱，等到那一天。',
      },
    ],
  },

  // 讣告——同龄人去世
  {
    id: 'bio_late_death',
    title: '讣告',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    ageRange: [42, 55],
    priority: 7,
    weight: 8,
    oncePerGame: true,
    narrative:
      '大学班级群里弹出一条消息："各位同学，张伟于昨晚因心肌梗死去世，享年45岁。"你盯着那条消息看了很久。张伟——当年篮球队的中锋，身体壮得像头牛，毕业后进了互联网公司一路做到高管。你对他最后的印象是去年聚会上他端着白酒一杯接一杯，笑着说"等我赚够了就退休养生"。他的动态圈最后一条停在两周前，是一张加班到凌晨的工位照片，配文"又一个通宵，命真苦"，下面他回"没事，年轻扛得住"。\n' +
      '你站起来走到镜子前。你和张伟同岁。{years}年前你吞下第一粒NMN时有人说你"怕死、交智商税"，张伟也笑过你："等你研究出长生不老药我都七老八十了。"他没有等到。你赌了{years}年"活久一点"，此刻你终于明白你为什么赌——不是为了永生，是为了不在四十五岁就变成群里的一条讣告。你打开补剂柜，把每一瓶检查了一遍保质期。手有点抖。',
    options: [
      {
        id: 'renewed_purpose',
        label: '更加坚定，帮更多人避开这条路',
        description: '张伟的死不是终点，是你加倍努力的理由',
        hint: '信念+12 · 健康优化+8 · 生物知识+5 · 压力+6 · 幸福+4',
        hintColor: 'positive',
        skillGains: { healthOptSkill: 8, bioKnowledge: 5 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.stress = clamp(s.stress + 6, 0, 100);
          s.happiness = clamp(s.happiness + 4, 0, 100);
        },
        log: '你去了追悼会，送了张伟最后一程。出来之后你做了两件事：第一，给自己的抗衰方案做了一次全面复盘，加入了心血管风险评估；第二，你开了一个免费的中年健康科普专栏，第一篇文章的标题是"你不需要等心梗之后才开始养生"。评论区有人说"太晚了"，你回了一句："不晚。看到这篇文章的人，比张伟多了一次机会。"你把张伟的毕业照存进了一个叫"为什么"的文件夹。',
      },
      {
        id: 'quiet_sadness',
        label: '沉默，把悲伤转化为更自律的生活',
        description: '不需要说什么，好好活着就是回答',
        hint: '健康+6 · 信念+6 · 幸福-4 · 压力+8 · biologicalAge-1',
        hintColor: 'neutral',
        stateEffect: (s) => {
          s.health = clamp(s.health + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.happiness = clamp(s.happiness - 4, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
          adjustBiologicalAge(s, -1);
        },
        log: '你没在群里发任何悼念的话，也没写文章。那天晚上你提前一小时睡觉，第二天早上加了二十分钟有氧。你比平时更认真地吃了早餐、服了补剂、做了冥想。妻子问你怎么了，你说"没什么，一个同学走了"。她没再问，只是给你倒了一杯温水。有些提醒不需要语言，它会沉进你每一次呼吸、每一口饭、每一步路里。你比昨天更认真地活着——这是你能给张伟唯一的回答。',
      },
      {
        id: 'existential_crisis',
        label: '陷入深思——如果明天走的是你呢？',
        description: '你再怎么优化，也躲不过命运的无常',
        hint: '信念-6 · 幸福-6 · 压力+10 · 生物知识+8',
        hintColor: 'danger',
        skillGains: { bioKnowledge: 8 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith - 6, 0, 100);
          s.happiness = clamp(s.happiness - 6, 0, 100);
          s.stress = clamp(s.stress + 10, 0, 100);
        },
        log: '张伟的追悼会你没去。你一个人在河边走了三个小时，想了很多。你想：就算你生物年龄年轻十岁、就算你严格执行每一个方案——一个意外、一个车祸、一个你没检测到的动脉瘤，照样可以让你变成群里的下一条讣告。你赌的是概率，但概率不保证任何事。那天晚上你第一次没有按方案吃补剂，而是陪妻子看了一部老电影。你还是会继续抗衰，但你终于承认了一件事：你能控制的只有概率，不是结局。',
      },
    ],
  },

  // 有限与无限——接受可能活不到150，但旅程本身有意义
  {
    id: 'bio_late_perspective',
    title: '有限与无限',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    ageRange: [42, 55],
    priority: 7,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你{age}岁生日那天，独自坐在书房翻着{years}年来的健康日志。第一本是{startAge}岁记的，字迹潦草，满页是"今天开始吃NMN！""断食第三天好饿"；后来的越来越专业——数据表格、趋势图、补剂调整记录。{years}年，一本本日志堆在桌上像一座小型的塔。你最新的表观遗传报告显示生物年龄41岁，比同龄人年轻九岁——这是你用无数个小时的运动、断食、抽血换来的。\n' +
      '但你也清楚地知道：你大概率活不到150岁。二十岁时相信的"逆转衰老近在咫尺"没有到来，进展比你预期的慢了十年、十五年。你以为你会失落，却出奇地平静。你翻回第一本日志的扉页，上面是{startAge}岁的你写的一行字："我要活到120岁。"你笑了——那个年轻人不知道未来会怎样，但他敢赌。你忽然想通了：你赌的从来不是一个岁数，是"不向衰老投降"这件事本身。即使最终还是会老、会死——你是站着死的，不是跪着等死的。这场赌局从一开始就没有"赢"的终点，只有"一直在打"的过程。而这，已经够了。',
    options: [
      {
        id: 'accept_and_enjoy',
        label: '接受有限，享受当下的每一天',
        description: '目标从"活得最长"变成"活得最好"',
        hint: '幸福+12 · 信念+8 · 健康+4 · 压力-10',
        hintColor: 'positive',
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.health = clamp(s.health + 4, 0, 100);
          s.stress = clamp(s.stress - 10, 0, 100);
        },
        log: '你把日志收进了书架，不再每天测三次数据。你保留了核心的运动、饮食和补剂方案，但把那些让你焦虑的精细优化砍掉了一半。你开始花更多时间陪妻子散步、和朋友吃饭、读和抗衰无关的书。你发现——当你不再把每一分钟都当成"为长寿服务的工具"，日子反而过得更有味道。你可能活不到150岁，但你确定：你活着的每一天，都是真正活着的。',
      },
      {
        id: 'pass_the_torch',
        label: '把经验传下去，帮更多人延长健康寿命',
        description: '一个人活到100岁不如让一万个人多活10年',
        hint: '生物知识+10 · 健康优化+8 · 信念+10 · 幸福+8 · 被动收入+15000',
        hintColor: 'positive',
        skillGains: { bioKnowledge: 10, healthOptSkill: 8 },
        passiveIncomeChange: 15000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
        },
        log: '你开始写一本关于健康长寿的书——不是教你"活到150岁"的神话，而是基于你{years}年自体实验的真实经验：什么有用、什么没用、什么是骗局、什么值得坚持。书出版后出乎意料地畅销，你收到了无数封读者来信——有人因为你的书开始运动、有人停掉了没用的补剂、有人说"你让我不再害怕变老"。你翻着那些信，忽然明白了：你一个人活多久不重要，重要的是你让多少人的生命变得更长、更好。你的筹码已经从"自己的寿命"变成了"所有人的可能"。',
      },
      {
        id: 'keep_pushing',
        label: '继续加码——万一突破就在明天呢？',
        description: '二十八年都赌了，最后一段路更不能松',
        hint: '健康优化+12 · 生物知识+8 · 信念+10 · 压力+8 · biologicalAge-2',
        hintColor: 'neutral',
        skillGains: { healthOptSkill: 12, bioKnowledge: 8 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
          adjustBiologicalAge(s, -2);
        },
        log: '你没有放慢脚步，反而加入了最新的临床试验——一种新的senolytics联合疗法正在做人体测试，你符合入组条件。妻子说你"一辈子都在赌"，你说"对，但我赌得越来越聪明了"。你知道150岁可能是奢望，但每多健康活一年，就多一年等到真正突破的机会。你在最新一本日志的第一页写："{startAge}岁的我，{age}岁的我还在赌。别失望。"窗外的夕阳落下去了，你打开台灯，开始读今天新到的论文。灯亮着，你就还在牌桌上。',
      },
    ],
  },

  // 48岁：同龄人的葬礼——生物黑客同伴的离世
  {
    id: 'bio_midlife_peer_funeral',
    title: '葬礼',
    sceneTag: 'funeral',
    pathId: 'bio_gambler',
    ageRange: [48, 48],
    priority: 8,
    weight: 10,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '陈医生给你发了条消息：老周走了。老周是你在"不死者"群里认识的第一批生物黑客，比你大三岁，也更激进——多肽自助注射、年轻血浆输注、未经批准的基因疗法，他全试过。三个月前他还在群里兴奋地说搞到一种新的基因重编程载体，"小鼠实验返老还童"，然后就没了消息。\n' +
      '葬礼上来了二十多个生物黑客，大多是网上认识十几年、现实中第一次见面的人。没人穿黑西装——老周生前最讨厌"装"。陈医生红着眼睛跟你说："他注射后第三天开始发烧，第七天多器官衰竭。那种载体根本没做过安全剂量测试。"你站在墓碑前，想起他最后一条朋友圈——一张给自己注射的照片，配文"离永生又近了一步"。你低头看了看手臂上自体实验留下的淡淡针痕，忽然觉得很冷：你和他之间，也许只差一个"还没出事"的距离。',
    options: [
      {
        id: 'reassess_protocol',
        label: '重新审视自己的方案——安全第一',
        description: '老周的死让你清醒：赌命不是勇敢是鲁莽',
        hint: '生物知识+10 · 健康优化+8 · 信念+5 · 健康+5 · 压力-8 · 存款-10000（做全面体检）',
        hintColor: 'positive',
        skillGains: { bioKnowledge: 10, healthOptSkill: 8 },
        savingsChange: -10000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.health = clamp(s.health + 5, 0, 100);
          s.stress = clamp(s.stress - 8, 0, 100);
        },
        log: '{age}岁，你花了一万块做了一次最全面的体检。你停掉了所有没有三期临床数据的方案，把自体实验的频率降到了每年一次。你在日志里写："老周，我替你慢下来。"激进的抗衰方案不是勇敢，是对生命的不尊重。你还是会赌，但你学会了不下那种可能输光一切的注。',
      },
      {
        id: 'continue_but_smarter',
        label: '继续，但把老周的教训记下来',
        description: '他的错不是赌，是赌得太蠢',
        hint: '生物知识+12 · 信念+8 · 压力+5 · 健康-2',
        hintColor: 'neutral',
        skillGains: { bioKnowledge: 12 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.stress = clamp(s.stress + 5, 0, 100);
          s.health = clamp(s.health - 2, 0, 100);
        },
        log: '{age}岁，你写了一篇长文分析老周的案例——哪里出了错、哪个环节可以避免、什么红线绝不能越。文章在生物黑客圈传了十万次。你没有停，但你把"安全边际"四个字刻进了每一个实验方案的第一行。陈医生说"你这样他也算没白走"，你没说话。你知道这条路还长，而老周成了路边一块警示牌。',
      },
      {
        id: 'deep_doubt_gamble',
        label: '动摇——你拿寿命做赌注，值得吗？',
        description: '如果终点都是死亡，早走晚走有什么区别？',
        hint: '信念-10 · 压力+10 · 幸福-8 · 健康-3',
        hintColor: 'negative',
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith - 10, 0, 100);
          s.stress = clamp(s.stress + 10, 0, 100);
          s.happiness = clamp(s.happiness - 8, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
        },
        log: '{age}岁，你从葬礼回来后把补剂柜锁了一个月。你不去看论文、不去测数据、甚至停了晨跑。你妻子什么都没说，只是每天晚上多做一个菜。一个月后你打开了柜子，把过期的补剂扔了，没过期的重新摆好。你没有答案，但你知道——你停不下来，不是因为你不怕死，是因为你已经走了太远，回不了头了。',
      },
    ],
  },

  // 58岁：长寿的尽头 —— 生物赌徒的黄昏
  {
    id: 'bio_late_longevity',
    title: '活下来的意义',
    sceneTag: 'lab',
    pathId: 'bio_gambler',
    ageRange: [58, 58],
    priority: 8,
    weight: 10,
    oncePerGame: true,
    eventType: 'milestone',
    narrative:
      '实验室的离心机低低地转着。你站在一排排写着编号的培养皿前，第一次觉得它们像一个个墓碑——不是你也要死了，恰恰相反，是你的项目可能真的成了。\n' +
      '这些年你赌衰老可以逆转、赌死亡是个可以被改写的Bug。你烧光过钱，骗过投资人，被同行嘲笑是"民科"。但今天，你团队的小白鼠比对照组长了正常寿命的40%，数据就摆在屏幕上，黑白分明。\n' +
      '你本该欢呼。可你盯着那组数据，忽然想起上个月在养老院看护床上咽气的母亲。她没等到你成功。你忽然明白了一件你一直回避的事：你赌了整整一辈子"活得更久"，可你从来没想清楚——如果真能长生，多出来的那些年，到底为什么而活？',
    options: [
      {
        id: 'bio_legacy_cure',
        label: '放弃专利，把配方公开',
        description: '你赌了一辈子永生，最后赌的是"人人都能活"',
        hint: '信念+15 · 幸福+8 · 存款-500000 · 压力-8',
        hintColor: 'positive',
        savingsChange: -500000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 15, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress - 8, 0, 100);
        },
        log: '{age}岁，你撕掉了那份价值数十亿的专利申请书，把全部配方和数据开源。整个行业都疯了，合伙人在会议室里摔了杯子。三个月后，全球数百家实验室开始用你的方法做试验，价格被压到了普通人负担得起的水平。你收到一封来自偏远山区县医院的邮件，附着一张照片：几个医生在照着你的论文做早期筛查。你看着那张照片，忽然觉得，这才是你赌了半辈子想赢的东西。',
      },
      {
        id: 'bio_legacy_company',
        label: '坚持商业化，让成果真正落地',
        description: '没有资本，再伟大的科学也走不进医院',
        hint: '存款+1500000 · 压力+8 · 信念+8 · 幸福+3',
        hintColor: 'neutral',
        savingsChange: 1500000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
        },
        log: '{age}岁，你顶住了压力，把成果做成了全球第三家拿到临床批件的抗衰老项目。资本蜂拥而至，你从"民科"变成了"先知"。庆功宴上觥筹交错，你举杯的时候忽然想起母亲看护床上那张安静的脸。你回到实验室，坐到凌晨，没开灯。你赢了，但你不知道这个"赢"到底够不够重。',
      },
      {
        id: 'bio_legacy_quit',
        label: '停下来，去把欠下的生活补回来',
        description: '你研究了一辈子怎么多活几年，却忘了怎么活',
        hint: '幸福+12 · 压力-12 · 信念-10 · 存款-200000',
        hintColor: 'positive',
        savingsChange: -200000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 12, 0, 100);
          s.stress = clamp(s.stress - 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 10, 0, 100);
        },
        log: '{age}岁，你把实验室交给了团队，自己飞回老家，在母亲住过的那条街上租了间小房子。你每天早起去菜市场，和摊主闲聊，傍晚去江边散步。你不再研究长寿，改成了给社区的老人义务做体检。有个大爷问你"你是医生吗？"你说"算是吧，不过我研究的东西，可能一辈子也用不上了。"说完你笑了。你活了快六十年，第一次觉得，有些日子值得慢慢过。',
      },
    ],
  },

  // 51岁：临床扑空——八年白熬的研发与透支的身体
  {
    id: 'bio_late_clinical_miss',
    title: '临床扑空',
    sceneTag: 'lab',
    pathId: 'bio_gambler',
    ageRange: [51, 51],
    priority: 8,
    weight: 10,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '第11个季度的临床监控报告发到邮箱时，你已经猜到结果了。这个你跟了八年的候选药，在三期临床的关键终点上宣布"未达到统计学显著"。审阅数据的人用邮件里最冷静的措辞，宣判了一条管线八年的死刑——从分子设计、细胞实验、动物模型，到上百个受试者的随访，全部归零。\n' +
      '你关了电脑，在实验室楼道的长椅上坐了很久。这八年你没休过一个完整的长假，体检报告上逐年上移的血压和那个甲状腺结节，就是这八年最诚实的年终总结。你的学生小林端着咖啡过来，试探着问"老师，接下来怎么办"。你看着他，忽然想起自己三十岁那年，也是这样站在一位老导师门口，等一个"还能不能继续"的答案。楼下生科创业园又挂起了新的庆功横幅，隔壁公司刚融完B轮。你低头看了看自己花白的鬓角，第一次觉得，"赌"这个字，重得有点抬不起头。',
    options: [
      {
        id: 'close_pipeline_smart',
        label: '止损，把研发重心交给更年轻的人',
        description: '你赌了八年，但你知道什么时候该认输',
        hint: '生物知识+8 · 健康优化+6 · 压力-8 · 幸福+4 · 被动收入+8000',
        hintColor: 'positive',
        skillGains: { bioKnowledge: 8, healthOptSkill: 6 },
        passiveIncomeChange: 8000,
        stateEffect: (s) => {
          s.health = clamp(s.health + 4, 0, 100);
          s.stress = clamp(s.stress - 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          s.happiness = clamp(s.happiness + 4, 0, 100);
        },
        log: '{age}岁，你亲手把那条烧掉八年心血的管线封存归档，把团队重组，把研发重心和话语权一并交给了实验室里三个三十岁出头的年轻人。你不觉得这是认输，你只是学会了止损——赌了这么多年，你至少该赢下这一样。你把电脑桌面换成一张全家福，给小林发了条消息："新管线你说了算，我兜底。"',
      },
      {
        id: 'redesign_rebet',
        label: '连夜复盘，改靶点再押一注',
        description: '你赌了整个下半生，不差这一注',
        hint: '生物知识+10 · 压力+12 · 健康-4 · 信念+6',
        hintColor: 'neutral',
        skillGains: { bioKnowledge: 10 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.health = clamp(s.health - 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '{age}岁，你在实验室待了三个通宵，把八年的数据重新翻了个底朝天。你找到一个可能被忽略的亚群信号，决定改靶点、重新设计二期。小林的妻子半夜来送饭，你才想起今天是周六。你站在落地窗前，看着楼下写字楼一盏盏熄灭的灯，跟年轻的负责人说："八年前我赌的是方向，现在赌的是可行性。"你不知道这一注会不会中，但你确定，你还没到认命的时候。',
      },
      {
        id: 'body_warning_rest',
        label: '身体报警，先把自己养回来',
        description: '命都没了，还拿什么赌',
        hint: '健康+8 · 压力-10 · 幸福+3 · 存款-15000',
        hintColor: 'positive',
        savingsChange: -15000,
        stateEffect: (s) => {
          s.health = clamp(s.health + 8, 0, 100);
          s.stress = clamp(s.stress - 10, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 2, 0, 100);
        },
        log: '{age}岁，体检报告上那个逐渐上移的血压数值和甲状腺结节，终于让你按下了暂停键。你请了半个月假，把手机交给小林，去山里住了两周。你在日志里写："我研究了半辈子怎么让人多活几年，结果差点把自己耗死。"回来之后你重新排了作息，把实验室的夜班甩了出去。你终于承认：赌局再大，也得有命下场。',
      },
      {
        id: 'reflect_high_risk',
        label: '反思高投入高风险，精简烧钱方向',
        description: '你赌了太久，该静下来算算账了',
        hint: '生物知识+6 · 压力-6 · 信念-4 · 存款+300000',
        hintColor: 'neutral',
        skillGains: { bioKnowledge: 6 },
        savingsChange: 300000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 4, 0, 100);
          s.happiness = clamp(s.happiness + 2, 0, 100);
        },
        log: '{age}岁，你把公司在研项目列了一张表，一笔一笔地算投入产出。你砍掉三个高风险低概率的管线，保留两条扎实的。合伙人说你"老了，不敢赌了"，你没反驳。你只是终于想明白：这些年你赌赢了运气，赌输了概率——年轻时那股"all in"的狠劲，现在该换成"算清楚再下注"的清醒。你看着那张精简后的表，第一次觉得，账本比理想可靠。',
      },
    ],
  },

  // 55岁：交接班——把牌桌让给更年轻的人
  {
    id: 'bio_late_handover',
    title: '交接班',
    sceneTag: 'office',
    pathId: 'bio_gambler',
    ageRange: [55, 55],
    priority: 8,
    weight: 10,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '实验室年终总结会上，你坐在主位，第一次觉得自己是全场最老的那个。三十岁的研究员在讲最新一代的类器官平台，数据漂亮，概念超前——一半你听得懂，一半需要他放慢再讲一遍。你想起二十八年前，你也是这样站在讲台上，用一套别人听不懂的生物信息学模型，把台下资历更深的老人讲得面面相觑。\n' +
      '会后，小林——现在是实验室副主任——抱着一沓资料来找你，措辞很小心：他想让你把首席科学家的位置交出来，退居顾问。意思是这个东西这个赛道已经跑进了你年轻时没见过的深水区，需要更年轻的掌舵人。你站在办公室窗前，楼下是这几十年来你看着长起来的一座座生物医药产业园。你忽然意识到，你赌了半辈子"抗衰会突破"，现在突破真的在路上了，而牌桌上，轮到你主动或被动地，把位置让出去了。',
    options: [
      {
        id: 'mentor_next_gen',
        label: '放心交接，退居二线做他们的后盾',
        description: '你赌赢了赛道，也该让年轻人赌他们那一场了',
        hint: '幸福+10 · 压力-8 · 健康+6 · 被动收入+20000',
        hintColor: 'positive',
        skillGains: { bioKnowledge: 6 },
        passiveIncomeChange: 20000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.stress = clamp(s.stress - 8, 0, 100);
          s.health = clamp(s.health + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '{age}岁，你郑重地把首席科学家的铭牌交给了小林。交接那天你只说了三句话："数据永远比直觉可靠""别怕失败，怕的是不试""门诊挂号我还教得动"。你退居顾问，每周去半天，剩下的时间钓鱼、陪外孙、把二十八年手写的研究笔记整理成册。你终于不用天天盯着临床进度——你赌了半辈子的赛道，现在有一整代年轻人替你接着赌。你站在岸边看着他们下水，心里是踏实。',
      },
      {
        id: 'keep_leading',
        label: '不让，我还想再赌最后一程',
        description: '突破就在眼前，你不想在黎明前下桌',
        hint: '生物知识+8 · 压力+12 · 健康-3 · 信念+8',
        hintColor: 'neutral',
        skillGains: { bioKnowledge: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.happiness = clamp(s.happiness - 2, 0, 100);
        },
        log: '{age}岁，你婉拒了退居二线的提议。你说："我研究了半辈子，等就是等这个黎明。"你给小林加了股权，把执行层面交给他，自己专职盯最前沿的原始创新。你比十年前更忙，但眼睛里那点光也回来了。你知道体力拼不过年轻人，但你赌的是判断力——这二十八年看过的失败、绕过的坑、踩过的雷，是你手里别人拿不走的筹码。你还坐在牌桌上。',
      },
      {
        id: 'switch_career',
        label: '顺势转行，把这半生变成另一种活法',
        description: '你赌够了科学，是时候赌自己真正想要的生活',
        hint: '幸福+12 · 压力-10 · 信念-8 · 存款-200000',
        hintColor: 'positive',
        savingsChange: -200000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 12, 0, 100);
          s.stress = clamp(s.stress - 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 8, 0, 100);
          s.health = clamp(s.health + 4, 0, 100);
        },
        log: '{age}岁，你把首席科学家的位置让了出去，转身开了一家面向普通人的健康科普工作室。不追热点、不卖课割韭菜，只讲你这些年用身体换来的真话：什么有用、什么没用、什么是骗局。一开始没什么人看，慢慢有了口碑。你发现，比起在实验室赌下一个分子，跟普通人讲"怎么好好活"这件事，更让你踏实。你赌了半辈子人类的未来，现在终于轮到正视自己的日子。你没后悔。',
      },
      {
        id: 'pass_portfolio',
        label: '把积累打包交给年轻人，做他们的投资人',
        description: '你不做实验了，但你还能用钱和判断帮他们',
        hint: '投资分析+10 · 生物知识+6 · 被动收入+30000 · 压力+6',
        hintColor: 'neutral',
        skillGains: { investmentSkill: 10, bioKnowledge: 6 },
        passiveIncomeChange: 30000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.happiness = clamp(s.happiness + 4, 0, 100);
        },
        log: '{age}岁，你把积累的专利、数据和判断力一并打包，成立了一只小规模的生物医药天使基金，主要投小林他们那一代年轻科研人。你不再亲手做实验，但你用二十八年攒下的火眼金睛帮他们避坑。你发现，把自己变成平台，比把自己钉在台前更有价值。签合同那天你笑着跟小林说："我赌了你们这代人一次，可别让我亏得倾家荡产。"他笑了，你也笑了。你终于从赌徒，变成了给赌徒发筹码的人。',
      },
    ],
  },
];

// ============================================================
// 成就事件（3分支 × 3等级 = 9个）
// ============================================================

// ---- 生物科技投资线 (bio_investor) ----
const investorAchievements: NarrativeAchievement[] = [
  // 初级：第一桶抗衰金
  {
    id: 'bio_gambler_investor_1',
    title: '第一桶抗衰金',
    narrative: `你的生物科技组合第一次突破了六位数。这背后是你读了上百份管线报告、熬了无数个看临床数据的深夜。\n\n你打开账户，看着那个数字，想起26岁第一次按"买入"时发抖的手指。从那一粒NMN到这串数字，你走了十年。你知道这还只是开始——抗衰的真正爆发还在后面。但你已经证明了一件事：在这个赛道上，研究和耐心，是能变现的。`,
    pathId: 'bio_gambler',
    branch: 'bio_investor',
    level: 1,
    skillRequirements: { investmentSkill: 35 },
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 10);
      adjustBioPortfolio(state, 40000);
    },
    log: `你的生物科技组合突破六位数。十年研究变现，第一桶抗衰金到手。`,
  },

  // 中级：抗衰投资圈的意见领袖
  {
    id: 'bio_gambler_investor_2',
    title: '抗衰投资的意见领袖',
    narrative: `你的抗衰投资专栏成了圈内必读。有机构开始请你做顾问，有创业者拿着BP来找你，有媒体把你称为"最懂生物学的投资人"。\n\n你不全是高兴。影响力意味着责任——你推荐的东西，会有人照着买。你开始更谨慎地措辞，更严格地标注"不构成投资建议"。但你承认：你已经不是当年那个散户了，你成了这个赛道的一个节点。信息和资金，开始通过你流动。`,
    pathId: 'bio_gambler',
    branch: 'bio_investor',
    level: 2,
    skillRequirements: { investmentSkill: 55, bioKnowledge: 40 },
    passiveIncomeChange: 25000,
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 10);
    },
    log: `你成了抗衰投资圈的意见领袖。机构请你做顾问，创业者带着BP来找你。`,
  },

  // 终极：抗衰突破的最大赢家
  {
    id: 'bio_gambler_investor_3',
    title: '时间的朋友',
    narrative: `第一个真正意义上的抗衰老疗法获批了。你重仓的那家公司是核心受益者，组合在消息公布后翻了十几倍。你看着账户里那个天文数字，没有狂喜，只有一种长途跋涉后到达的平静——你赌了二十年，赌抗衰会突破，赌人类不会向衰老投降，赌你能在黎明前活下来。现在，黎明来了。\n\n多年前那个在出租屋里对着券商APP按下"全仓买入"的年轻人似乎在某处点了点头。TA不知道会不会赢，但TA选择了相信。这串数字不只是钱，是一张通往未来的船票——你有足够的筹码，等到技术完全成熟的那一天。你赌对了，时间站在了你这边。`,
    pathId: 'bio_gambler',
    branch: 'bio_investor',
    level: 3,
    skillRequirements: { investmentSkill: 75, bioKnowledge: 55 },
    savingsChange: 200000,
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 12);
      adjustBioPortfolio(state, 300000);
    },
    log: `抗衰疗法获批，你的组合翻十几倍。二十年赌注兑现——你成了时间的朋友。`,
    triggersRetirementCheck: true,
  },
];

// ---- 自体实验线 (bio_experimenter) ----
const experimenterAchievements: NarrativeAchievement[] = [
  // 初级：逆转生物年龄5岁
  {
    id: 'bio_gambler_experimenter_1',
    title: '逆转时钟',
    narrative: `你的表观遗传时钟检测回来了——生物年龄比实际年龄小5岁。你{age}岁的身体，细胞层面像30岁。\n\n你盯着那个数字，手有点抖。你吃了十几年的补剂、做了无数次冰水浴、断了几百天的食，终于在一个数字上看到了回报。你知道这也许是误差，也许是安慰剂，但此刻你选择相信——你赌的东西，开始有回音了。`,
    pathId: 'bio_gambler',
    branch: 'bio_experimenter',
    level: 1,
    skillRequirements: { healthOptSkill: 35 },
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 10);
      state.health = Math.min(100, state.health + 5);
      adjustBiologicalAge(state, -2);
    },
    log: `你的生物年龄比实际小5岁。十几年的自体实验，第一次在数字上看到回报。`,
  },

  // 中级：生物黑客的标杆
  {
    id: 'bio_gambler_experimenter_2',
    title: '生物黑客的标杆',
    narrative: `你的自体实验数据和方法论，被全球的生物黑客社群奉为标杆。有人照着你的方案做，有人来请教你，有媒体想给你拍纪录片。\n\n你成了一面旗帜——N=1实验能做到什么程度，你给出了答案。但你也在深夜里想：你的方法只对你自己验证过，别人照搬未必有效。你开始更强调"方法"而不是"方案"——教人怎么测，而不是测什么。授人以鱼不如授人以渔，在生物黑客的世界里，这条法则一样成立。你把方法论文档的标题改了，从"我的方案"改成了"你的方案：一份框架"。`,
    pathId: 'bio_gambler',
    branch: 'bio_experimenter',
    level: 2,
    skillRequirements: { healthOptSkill: 55, bioKnowledge: 40 },
    passiveIncomeChange: 15000,
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 10);
      adjustBiologicalAge(state, -2);
    },
    log: `你成了全球生物黑客社群的标杆。你的方法论被无数人学习和效仿。`,
  },

  // 终极：45岁的身体，30岁的细胞
  {
    id: 'bio_gambler_experimenter_3',
    title: '不老之身',
    narrative: `{age}岁这年，你做了一次全面评估。VO2max、握力、骨密度、反应速度、表观遗传时钟——每一项都指向同一个结论：你的身体，像三十岁出头的人。你站在镜子前，看着一张没有白发的脸、一个没有啤酒肚的身体。你赌了{years}年，从一粒NMN开始，到今天这一身"不老之身"。你不是超人，你只是一个赌徒——赌自律能跑赢时间，赌科学能改写命运。\n\n你想起{startAge}岁那个吞下第一粒胶囊的自己。TA不知道这粒药有没有用，但TA选择了相信。你想对TA说：你赌对了。你的身体，就是你的奖杯——你不是在逃避衰老，你是在和它谈判，而谈判桌上，你终于有了筹码。`,
    pathId: 'bio_gambler',
    branch: 'bio_experimenter',
    level: 3,
    skillRequirements: { healthOptSkill: 75, bioKnowledge: 55 },
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 12);
      state.health = Math.min(100, state.health + 8);
      adjustBiologicalAge(state, -5);
    },
    log: `45岁的你，身体像30岁。二十三年自律兑现——你赌赢了时间。`,
    triggersRetirementCheck: true,
  },
];

// ---- 科研参与线 (bio_researcher) ----
const researcherAchievements: NarrativeAchievement[] = [
  // 初级：第一篇共同署名论文
  {
    id: 'bio_gambler_researcher_1',
    title: '学术入场券',
    narrative: `你的名字第一次出现在了一篇正式发表的学术论文的作者列表里。虽然是倒数位置，但它在那里。\n\n你下载了PDF，把那一页打印出来，贴在了书桌上方。从一个在宿舍里啃论文的外行，到一个名字能印在论文上的人，你走了十年。这张纸不大，但它是一张入场券——从此，你不只是抗衰的消费者，你是它的创造者之一。`,
    pathId: 'bio_gambler',
    branch: 'bio_researcher',
    level: 1,
    skillRequirements: { bioKnowledge: 35 },
    salaryChange: 1000,
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 10);
    },
    log: `你的名字第一次出现在正式论文的作者列表。从外行到创造者，十年。`,
  },

  // 中级：被认可的公民科学家
  {
    id: 'bio_gambler_researcher_2',
    title: '公民科学家',
    narrative: `你发起的公民科学项目，被三所大学的研究组采纳为合作数据源。你不再是"提供数据的受试者"，而是"被邀请合作的研究伙伴"。\n\n在一次学术会议上，一位资深教授公开说："这个领域需要更多像他这样的人——懂科学，又懂真实世界。"你坐在台下，眼眶热了。你用了十几年，从被当成"民科"的边缘人，走到了被学术界认可的公民科学家。知识真的没有门第，只要你够真诚、够坚持，门会开的——你鼓掌的时候手拍得很响，旁边的人看了你一眼。`,
    pathId: 'bio_gambler',
    branch: 'bio_researcher',
    level: 2,
    skillRequirements: { bioKnowledge: 55, healthOptSkill: 40 },
    passiveIncomeChange: 18000,
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 10);
    },
    log: `你的公民科学项目被三所大学采纳。从"民科"到被认可的公民科学家。`,
  },

  // 终极：影响整个领域
  {
    id: 'bio_gambler_researcher_3',
    title: '改写定义的人',
    narrative: `你参与推动的"将衰老纳入疾病分类"的倡导，终于取得了阶段性进展——一个国际卫生组织发布了关于衰老分类的讨论文件，你的工作被引用为核心参考。你看着那份文件，上面有你的名字。你忽然意识到，你做的事不只是"活得更久"——你在改变人类看待衰老的方式。从"衰老是自然规律，只能接受"到"衰老是可以干预的过程"，这个观念的转变，会惠及几十亿人。\n\n那个在宿舍台灯下翻开《Lifespan》、用荧光笔划出第一段的年轻人，大概没想到二十三年后会有人在学术会议上引用TA整理的数据。你赌的不只是自己的寿命，是人类对抗衰老的认知边界。而你，从一个读者，变成了一个改写定义的人——观念的改变，会比你活得更久。`,
    pathId: 'bio_gambler',
    branch: 'bio_researcher',
    level: 3,
    skillRequirements: { bioKnowledge: 75, healthOptSkill: 55 },
    passiveIncomeChange: 25000,
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 12);
      state.happiness = Math.min(100, state.happiness + 10);
    },
    log: `你参与推动的衰老分类倡导取得进展，工作被国际组织引用。你改写了人类看待衰老的方式。`,
    triggersRetirementCheck: true,
  },
];

// ============================================================
// 40岁再分叉事件（bio_midlife_rebranch）
// 参照 AI 路径：投资线/科研线在中年可再选一次，自体实验线不重复触发
// ============================================================

const midlifeRebranchEvents: NarrativeEvent[] = [
  {
    id: 'bio_midlife_rebranch',
    title: '四十，再选一次',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    ageRange: [40, 40],
    priority: 8,
    weight: 100,
    eventType: 'milestone',
    oncePerGame: true,
    conditions: (s) =>
      s.narrativeBranch === 'bio_investor' || s.narrativeBranch === 'bio_researcher',
    narrative:
      '{age}岁这年，抗衰赛道从人人押注的万亿风口，进入了大浪淘沙的洗牌期。蹭概念的讲故事，临床不过的跳票，真正活下来的反而是那些慢慢来、把数据做扎实的人。你在这条路上走了十五年，赚过也亏过，信过也怀疑过，你比多数人更懂这场赌局——但深夜你数着生物年龄和存款，还是会问自己同一个问题：\n' +
      '我还在做我想做的事吗？还是只是惯性替我把路走完了？\n' +
      '这不是二十多岁那种"下一支药能不能中"的焦虑，而是"我明明还有选择"的清醒。你知道自己累了，但你没认输。你只是模糊地感觉到：四十岁不是终点，是另一条路的街角。你站在这里，还能再选一次——不是从零开始，是带着这十五年捡来的所有东西，重新出发。',
    options: [
      {
        id: 'bio_deepen_path',
        label: '不换了，把这条路走穿',
        description: '你的积累已经足够深，继续把它凿到别人够不到的地方',
        hint: '信念+12 · 幸福+8 · 压力-4 · 相关技能+8',
        hintColor: 'positive',
        memorySet: { reinforcedBioPath: true },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress - 4, 0, 100);
          const branch = s.narrativeBranch;
          ensureSkills(s);
          if (branch === 'bio_investor') {
            s.pathSkills['investmentSkill'] = Math.min(100, (s.pathSkills['investmentSkill'] || 0) + 8);
          } else if (branch === 'bio_researcher') {
            s.pathSkills['bioKnowledge'] = Math.min(100, (s.pathSkills['bioKnowledge'] || 0) + 8);
          }
        },
        log: '{age}岁，你没换方向。不是不敢，是你想明白了——你在这条路上攒下的判断、知识和数据，不是别人轻易能偷走的。你关掉那些"转行"的念头，把十五年的积累又往下凿了一层。浪退了，你才发现自己从没被冲走，你一直站在礁石上。',
      },
      {
        id: 'bio_switch_to_experimenter',
        label: '把自己当试验田，极致自体实验',
        description: '判断/知识你都攒够了，是时候在自己身上验证最前沿的方案',
        hint: '健康+4 · 压力+15 · 信念+8 · 切换至自体实验线',
        hintColor: 'danger',
        branchSwitch: 'bio_experimenter',
        memorySet: { switchedToExperimenterMid: true },
        stateEffect: (s) => {
          ensureSkills(s);
          s.health = clamp(s.health + 4, 0, 100);
          s.stress = clamp(s.stress + 15, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.happiness = clamp(s.happiness + 6, 0, 100);
          adjustBiologicalAge(s, -1);
        },
        log: '{age}岁，你决定不再只当旁观者。过去你研究别人的数据、押注别人的管线，现在你把最前沿的方案用在自己身上。监管追不上你，你比FDA跑得快。你比25岁那次更平静——那一次是赌，这一次是算。你开始记录每一个变量，像一台行走的生物实验室。',
      },
      {
        id: 'bio_switch_to_investor',
        label: '收回锋芒，用资本押注整个赛道',
        description: '台前研究了太久，你想回到那个"用钱投票"的战场',
        hint: '投资分析+8 · 生物知识+4 · 压力+8 · 信念+6 · 切换至投资线',
        hintColor: 'neutral',
        skillGains: { investmentSkill: 8, bioKnowledge: 4 },
        branchSwitch: 'bio_investor',
        memorySet: { switchedToInvestorMid: true },
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '{age}岁，你收回了聚光灯下的锋芒，决定回到那个"用钱投票"的战场。那些年你在实验室里泡了太久，忽然想回到投资这个更直接的地方。你开始系统性地配置抗衰组合——不是因为你怕被淘汰，是你终于想通：有时候，判断力最好的兑现方式，就是把它变成仓位。',
      },
      {
        id: 'bio_switch_to_researcher',
        label: '把积累变成知识和影响力',
        description: '你比多数人更懂这个领域，也更能研究清楚它——那就让更多人相信它',
        hint: '生物知识+10 · 健康优化+5 · 被动收入+6000/年 · 压力+6 · 切换至科研线',
        hintColor: 'positive',
        skillGains: { bioKnowledge: 10, healthOptSkill: 5 },
        passiveIncomeChange: 6000,
        branchSwitch: 'bio_researcher',
        memorySet: { switchedToResearcherMid: true },
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '{age}岁，你决定不再只做那个"押注的人"，而要成为那个"研究清楚的人"。你开始系统性地输出——不是二十多岁那种转帖，是带着十五年看过的数据、做过的判断写出来的东西。你的专栏开始有人追着看。你发现当你的判断有了分量，钱和影响力会自己找上门。',
      },
    ],
  },
];

// ============================================================
// 分支记忆回声事件（bio 42-44岁，后期"翻旧账"，形成叙事闭环）
// ============================================================

const bioEchoEvents: NarrativeEvent[] = [

  // 42岁：当年一起入坑的赌友
  {
    id: 'bio_echo_old_bettor',
    title: '老赌友',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    ageRange: [42, 42],
    priority: 6,
    oncePerGame: true,
    memoryAnyOf: ['choseInvestor', 'choseExperimenter', 'choseResearcher'],
    narrative:
      '你刷到一条动态：当年那个和你一起研究补剂、一起看临床数据的"老赌友"，现在头发花白，但体检报告比同龄人年轻十岁。他发了一张照片，配文："十八年了，我们赌对了方向。"\n' +
      '你们已经很久没联系了。你盯着那张照片，忽然想起：当年如果不是他拉你入坑，你可能现在还在靠想象研究长寿。你打开聊天框，光标闪了很久。',
    options: [
      {
        id: 'bio_reach_out_bettor',
        label: '发条消息，约他喝一杯',
        description: '有些过命的交情，不该只活在朋友圈里',
        hint: '幸福+8 · 压力-5 · 存款-2000',
        hintColor: 'positive',
        savingsChange: -2000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
        },
        log: '你给他发了条消息，他秒回："我还以为你把我忘了。"你们约在当年常去的那家茶馆，他还是点他常喝的那杯。聊到深夜，他问你当年要是没一起入坑会怎样，你笑着说"那我可能还相信人只能活到八十"。他举杯："那你就赌错了自己。"两个不再年轻的人，在深夜的灯光下笑得跟二十年前一样。',
      },
      {
        id: 'bio_watch_quietly',
        label: '看看就好，不打扰',
        description: '各自安好，就是最好的结局',
        hint: '幸福+3 · 压力-2',
        hintColor: 'neutral',
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 3, 0, 100);
          s.stress = clamp(s.stress - 2, 0, 100);
        },
        log: '你点了个赞，关掉了动态。你们已经很久没联系了，但你知道他过得很好，他也知道你在自己的路上走得不错。成年人的友谊有时候就是这样——不打扰，但心里一直有那个位置。你把手机放进口袋，继续研究你的下一份数据。',
      },
    ],
  },

  // 43岁：那扇没推开的门
  {
    id: 'bio_echo_unopened_door',
    title: '那扇门',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    ageRange: [43, 43],
    priority: 6,
    oncePerGame: true,
    memoryAnyOf: ['choseInvestor', 'choseExperimenter', 'choseResearcher'],
    narrative:
      '深夜整理资料，你翻出一份当年的投资备忘录。那是一个你研究了很久、最后因为"太激进"没投的长寿公司——现在它的市值已经翻了上百倍。你盯着那个数字看了很久。\n' +
      '十五年前你面前有过这么一扇门，你犹豫过，最后没推开。你从不后悔自己的选择——你现在的路也很好。只是偶尔，在这样安静的深夜，你会好奇门后面的那条路，会把你带到哪里。你合上备忘录，不是留恋，是想知道，那个平行的自己，过得好不好。',
    options: [
      {
        id: 'bio_close_forever',
        label: '合上备忘录，回到自己的路',
        description: '不回顾，不内耗，专注脚下',
        hint: '信念+8 · 压力-4 · 幸福+3',
        hintColor: 'positive',
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.stress = clamp(s.stress - 4, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
        },
        log: '你把备忘录放回抽屉，关掉灯。这扇门你已经看了十五年，该合上了。你走回自己的研究台，那里有你的数据、你的事业、你亲手选的人生。你不再回望——不是不想，是终于明白，每条路都有它独一无二的风景。',
      },
      {
        id: 'bio_open_again',
        label: '顺着记忆，重新研究那个方向',
        description: '中年再去补上当年的遗憾，做点真正想做的事',
        hint: '幸福+10 · 压力+6 · 信念+6 · 存款-8000',
        hintColor: 'neutral',
        savingsChange: -8000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '你花了一个月把当年那个方向重新研究了一遍。它已经不再是当年的样子了——但你的判断力也不再是十五年前的样子。你决定不再只当旁观者。你拿起电话，开始联系当年那个项目的人。你四十多岁了，本该求稳，可你发现，当你真的想推开一扇门的时候，你依然会心跳加速。你决定去看看——不是逃回过去，是带着这半生的重量，去补一个当年没舍得做的梦。',
      },
    ],
  },

  // 44岁：换过航向的人
  {
    id: 'bio_echo_switched_path',
    title: '换过的路',
    sceneTag: 'home',
    pathId: 'bio_gambler',
    ageRange: [44, 44],
    priority: 6,
    oncePerGame: true,
    conditions: (s) => (s.branchHistory || []).length > 1,
    narrative:
      '整理旧电脑时，你翻到一份十五年前的投资日志。那是你刚入行时写的，激进、毛躁，满是没经历过周期的人才有的乐观。你忽然想起自己换过多少次方向——从投资，到自体实验，再到转身做研究，又或者反着来。\n' +
      '外人看你，是一个"一直很笃定"的人。只有你知道，你其实一直在换路，只是一次比一次更笃定。那些曾让你彻夜难眠的"错误选择"，回头看都成了下一个路口的路标。你保存好那份旧日志，像保存一枚旧徽章。不是遗憾，是纪念——纪念那个愿意一次次重新出发的自己。',
    options: [
      {
        id: 'bio_accept_own_path',
        label: '坦然接受，这就是我的人生',
        description: '换过路，绕了远，但每一步都算数',
        hint: '信念+10 · 幸福+8 · 压力-5',
        hintColor: 'positive',
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
        },
        log: '你关掉旧日志，给自己倒了杯茶。窗外是黄昏，你就着夕阳想：你换过路，绕过远，走过别人觉得"浪费"的弯路——但正是那些弯路，让你在四十岁的时候，比那些从未下过车的人，更清楚自己想去哪。你吹了吹茶上的热气。这条路是你自己绕出来的，每一段都算数。',
      },
      {
        id: 'bio_share_winding_path',
        label: '把换路的经验讲给新人听',
        description: '你的弯路，是别人最好的路灯',
        hint: '幸福+8 · 生物知识+4 · 被动收入+4000/年 · 压力+3',
        hintColor: 'positive',
        skillGains: { bioKnowledge: 4 },
        passiveIncomeChange: 4000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress + 3, 0, 100);
        },
        log: '你受邀在一个长寿社群里分享自己换路的心路。你讲了那些绕过的弯、吃过的亏、推翻重来的决定。讲完掌声响了很久。散场后一个年轻人红着眼眶说："谢谢你，我正纠结要不要换个方向。"你拍拍他的肩："换不换都对，只要别骗自己。"你忽然觉得，你这半生的蜿蜒，原来也可以成为别人的坦途。',
      },
    ],
  },
];

// ============================================================
// 汇总导出
// ============================================================

export const BIO_NARRATIVE_EVENTS: NarrativeEvent[] = [
  ...commonEvents,
  ...branchSelectEvent,
  ...investorEvents,
  ...experimenterEvents,
  ...researcherEvents,
  ...crossBranchEvents,
  ...crisisEvents,
  ...bioWarningEvents,
  ...postAllInEvents,
  ...lateGameEvents,
  ...midlifeRebranchEvents,
  ...bioEchoEvents,
];

export const BIO_ACHIEVEMENTS: NarrativeAchievement[] = [
  ...investorAchievements,
  ...experimenterAchievements,
  ...researcherAchievements,
];

// ============================================================
// 自动注册（模块加载时执行）
// ============================================================
registerNarrativeEvents(BIO_NARRATIVE_EVENTS);
registerAchievements(BIO_ACHIEVEMENTS);