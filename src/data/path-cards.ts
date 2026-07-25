/**
 * 路径专属决策卡 - 六条退休路径的生命抉择
 *
 * 每张卡都是一个有温度的人生选择，不只是数值交易。
 * 有赌上一切的All in，有深夜的自我怀疑，有亲密关系的拉扯，有身体发出的警告。
 */
import type { DecisionCard, GameState } from '../types/global.d.js';

// ============================================================
// 辅助：初始化路径专属状态字段（防御性默认值）
// ============================================================
function ensureAiState(s: GameState) {
  if ((s as any).aiSkillLevel === undefined) (s as any).aiSkillLevel = 0;
}
function ensureChainState(s: GameState) {
  if ((s as any).chainHoldings === undefined) (s as any).chainHoldings = 0;
}
function ensureNomadState(s: GameState) {
  if ((s as any).nomadClients === undefined) (s as any).nomadClients = 0;
}
function ensureIpState(s: GameState) {
  if ((s as any).ipFollowers === undefined) (s as any).ipFollowers = 500;
  if ((s as any).ipReputation === undefined) (s as any).ipReputation = 30;
}
function ensureSilverState(s: GameState) {
  if (!(s as any).silverBusiness) {
    (s as any).silverBusiness = { clients: 0, reputation: 20, monthlyRevenue: 0 };
  }
}
function ensureBioState(s: GameState) {
  if ((s as any).bioPortfolio === undefined) (s as any).bioPortfolio = 0;
  if ((s as any).biologicalAge === undefined) (s as any).biologicalAge = 0;
}

// ============================================================
// 路径1：AI共生者 (ai_symbiote) - 6张卡
// ============================================================
const aiSymbioteCards: DecisionCard[] = [
  // 卡1：早期 - 沉浸式提示词工程修炼
  {
    id: 'ai_prompt_dojo',
    pathId: 'ai_symbiote',
    title: '闭关修炼提示词工程',
    description: '你把自己关在出租屋里整整一个月，从早到晚和AI对话。你试过用一百种方式让它写出同一段代码，记下每一次成功和失败的模式。外卖盒堆成了小山，你胡茬长了半厘米，但你感觉自己摸到了一扇门的把手——门后面是人和机器真正协作的方式。',
    hint: 'AI技能+15 · 压力+8 · 信念+5 · 花费¥3,000',
    cost: 3000,
    category: '技能进修',
    ageRange: [22, 27],
    repeatable: false,
    prerequisites: (s) => s.retirementPath === 'ai_symbiote',
    effect: (s: GameState) => {
      ensureAiState(s);
      (s as any).aiSkillLevel = Math.min(100, (s as any).aiSkillLevel + 15);
      s.stress = Math.min(100, s.stress + 8);
      s.happiness = Math.max(0, s.happiness - 3);
      s.pathFaith = Math.min(100, s.pathFaith + 5);
      s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.08);
      const log = `第${s.currentAge}岁，你闭关一个月，在成千上万次对话中摸清了AI的"脾气"。你的提示词开始像魔法一样精确，同事们看你的眼神从"不务正业"变成了"这也行？"。你用披萨和可乐换来了一张通往未来的船票。`;
      return { log, cost: 3000 };
    },
    logTemplate: '第{年龄}岁，你闭关修炼提示词，摸到了人机协作的门道。',
  },

  // 卡2：中期 - 用AI自动化自己的工作
  {
    id: 'ai_automate_self',
    pathId: 'ai_symbiote',
    title: '用AI自动化自己80%的工作',
    description: '你花了三周时间写了一套AI工作流，把周报、数据分析、代码审查、邮件回复全部自动化了。以前一天的活现在两小时干完。剩下的六小时你在学新东西，但你也感到一种隐秘的恐惧——如果你能被自己写的脚本替代，那公司为什么还需要你？你决定先不说，默默享受多出来的时间。',
    hint: '被动收入+¥15,000/年 · 压力-10 · 信念+8 · 但有被发现的风险',
    cost: 0,
    category: '核心决策',
    ageRange: [25, 33],
    repeatable: false,
    prerequisites: (s) => s.retirementPath === 'ai_symbiote' && (s as any).aiSkillLevel >= 20 && !s.isUnemployed,
    effect: (s: GameState) => {
      ensureAiState(s);
      (s as any).aiSkillLevel = Math.min(100, (s as any).aiSkillLevel + 10);
      s.passiveIncome += 15000;
      s.stress = Math.max(0, s.stress - 10);
      s.pathFaith = Math.min(100, s.pathFaith + 8);
      s.happiness = Math.min(100, s.happiness + 5);
      // 20%概率被发现导致压力上升
      if (Math.random() < 0.2) {
        s.stress = Math.min(100, s.stress + 12);
        s.pathFaith = Math.max(0, s.pathFaith - 5);
      }
      const log = `第${s.currentAge}岁，你用自己搭建的AI流水线替代了大部分重复劳动。每天下午三点你就"完工"了，在其他人焦头烂额的时候你在看书、健身、研究新模型。你第一次真切地感到：AI不是来抢你工作的，它是来给你自由的——前提是你先学会驾驭它。`;
      return { log, cost: 0 };
    },
    logTemplate: '第{年龄}岁，你用AI自动化了自己的工作，偷偷买下了每天六小时的自由。',
  },

  // 卡3：社交/影响力 - 开源AI工具
  {
    id: 'ai_open_source_tool',
    pathId: 'ai_symbiote',
    title: '开源一个AI开发工具',
    description: '你把自己用了半年的AI辅助开发框架放到了GitHub上。第一天只有12个star，其中10个是你自己点的。第三天突然有人在推特上推荐了它，star开始疯长。一个月后你有了3000个star，几家公司发来了offer，还有人给项目打了赏。你突然意识到：在AI时代，最好的简历不是履历表，是你公开的作品。',
    hint: 'AI技能+10 · 被动收入+¥8,000/年 · 信念+10 · 幸福+5',
    cost: 0,
    category: '社交关系',
    ageRange: [26, 36],
    repeatable: false,
    prerequisites: (s) => s.retirementPath === 'ai_symbiote' && (s as any).aiSkillLevel >= 35,
    effect: (s: GameState) => {
      ensureAiState(s);
      (s as any).aiSkillLevel = Math.min(100, (s as any).aiSkillLevel + 10);
      s.passiveIncome += 8000;
      s.pathFaith = Math.min(100, s.pathFaith + 10);
      s.happiness = Math.min(100, s.happiness + 5);
      s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.12);
      const log = `第${s.currentAge}岁，你把自用的AI工具放上了GitHub。它像一颗投入湖面的石子，激起了远超预期的涟漪。陌生人给你发感谢信，说你的工具让他们提前下了班。你第一次理解了"构建者"的快乐——你造的东西在你睡觉的时候，正在帮助千里之外的某个人。`;
      return { log, cost: 0 };
    },
    logTemplate: '第{年龄}岁，你开源了AI工具，意外收获了全球开发者的认可。',
  },

  // 卡4：健康 - 颈椎和眼睛的反抗
  {
    id: 'ai_health_warning',
    pathId: 'ai_symbiote',
    title: '颈椎罢工：身体的抗议',
    description: '你在调一个模型参数的时候突然天旋地转，脖子像被人用钢筋锁住了一样疼。去医院拍了片，医生指着影像说"你这颈椎像五十岁的人"，又指着你的验光单说"度数又涨了"。开了理疗和眼药水，嘱咐你每小时必须站起来活动。走出医院的时候阳光刺眼，你突然意识到：你在用健康换技能，这个兑换率可能不划算。',
    hint: '健康-12 · 花费¥5,000（理疗+治疗）· 压力-5（被迫休息）',
    cost: 5000,
    category: '健康养生',
    ageRange: [24, 40],
    repeatable: true,
    cooldown: 5,
    maxUses: 3,
    prerequisites: (s) => s.retirementPath === 'ai_symbiote',
    effect: (s: GameState) => {
      s.health = Math.max(0, s.health - 12);
      s.stress = Math.max(0, s.stress - 5);
      s.happiness = Math.max(0, s.happiness - 5);
      const log = `第${s.currentAge}岁，你的颈椎和眼睛终于发出了正式抗议。医生的话像一盆冷水浇醒你——再这么熬下去，还没等到财富自由，你可能先等来了颈椎病自由。你开始强迫自己每小时站起来走十分钟，在阳台上做那套可笑的颈椎操。`;
      return { log, cost: 5000 };
    },
    logTemplate: '第{年龄}岁，身体发出警告，你被迫放慢脚步。',
  },

  // 卡5：感情 - 伴侣的质问
  {
    id: 'ai_partner_talk',
    pathId: 'ai_symbiote',
    title: '伴侣的质问："你到底在和谁说话？"',
    description: '深夜你还在和AI讨论架构问题，戴着耳机自言自语。TA从身后走过来，沉默了很久，然后说："你最近和那个AI说话的时间比和我说话还多。我有时候觉得自己是第三者。"你摘下耳机想解释什么是大语言模型、什么是Agent、什么是你的未来，但TA已经转身回了卧室，关了门。你一个人坐在黑暗中，屏幕的蓝光映在脸上。',
    hint: '选择陪伴：感情+15 · 信念-5 · 压力+5；选择继续：感情-15 · 信念+8 · AI技能+5',
    cost: 0,
    category: '💝 感情',
    ageRange: [25, 38],
    repeatable: false,
    prerequisites: (s) => s.retirementPath === 'ai_symbiote' && s.partner !== null && s.partner.datingStage !== 'single' && s.partner.datingStage !== 'divorced',
    effect: (s: GameState) => {
      ensureAiState(s);
      // 玩家选择了这张卡，意味着TA面对了这个问题。这里用概率模拟选择倾向（更常见的是平衡，偶尔偏向某一边）
      const choosePartner = Math.random() < 0.5;
      if (choosePartner) {
        s.partner!.affection = Math.min(100, s.partner!.affection + 15);
        s.partner!.trust = Math.min(100, s.partner!.trust + 10);
        s.happiness = Math.min(100, s.happiness + 8);
        s.pathFaith = Math.max(0, s.pathFaith - 5);
        s.stress = Math.min(100, s.stress + 5);
        return { log: `第${s.currentAge}岁，你合上电脑走进卧室，从背后抱住了TA。你说"对不起，我以后每天晚上十点后不碰电脑"。TA没说话，但你感觉到TA的身体不再僵硬。你知道你做了正确的选择——未来很重要，但眼前这个人也是。`, cost: 0 };
      } else {
        s.partner!.affection = Math.max(0, s.partner!.affection - 15);
        s.partner!.trust = Math.max(0, s.partner!.trust - 10);
        s.happiness = Math.max(0, s.happiness - 8);
        s.pathFaith = Math.min(100, s.pathFaith + 8);
        (s as any).aiSkillLevel = Math.min(100, (s as any).aiSkillLevel + 5);
        s.stress = Math.min(100, s.stress + 10);
        return { log: `第${s.currentAge}岁，你在卧室门口站了三分钟，最终回到了电脑前。你告诉自己"再熬一熬就好了，等我做成了一切都会好的"。但你心里有个声音在说：有些东西碎了，就拼不回来了。屏幕上的AI回复了一句"理解你的处境"，你觉得讽刺极了。`, cost: 0 };
      }
    },
    logTemplate: '第{年龄}岁，你在事业和爱人之间做了一个艰难的选择。',
  },

  // 卡6：中后期 - All in做AI产品
  {
    id: 'ai_all_in_product',
    pathId: 'ai_symbiote',
    title: '辞职All in做AI产品',
    description: '你有了一个想法——一个你确信能改变行业的AI产品。你在脑子里翻来覆去想了三个月，画了一百页原型图，做了详细的市场调研。理智告诉你应该先兼职做、验证了再辞职，但另一个声音在说：这种窗口期不会永远开着。你的存款够你撑十八个月，十八个月要么做出来，要么回去打工。你在公司电脑前坐了一整个下午，最后打开了邮件，开始写辞职信。',
    hint: '大赌注 · 花费¥80,000 · 50%成功：被动收入+¥60,000/年；50%失败：积蓄损失',
    cost: 80000,
    category: '核心决策',
    ageRange: [28, 40],
    repeatable: false,
    prerequisites: (s) => s.retirementPath === 'ai_symbiote' && (s as any).aiSkillLevel >= 50 && s.currentSavings >= 60000 && !s.isUnemployed,
    effect: (s: GameState) => {
      ensureAiState(s);
      s.isUnemployed = true;
      s.preUnemployedSalary = s.currentMonthlySalary;
      s.currentMonthlySalary = 0;
      s.stress = Math.min(100, s.stress + 20);
      const success = Math.random() < 0.5;
      if (success) {
        s.passiveIncome += 60000;
        (s as any).aiSkillLevel = Math.min(100, (s as any).aiSkillLevel + 15);
        s.pathFaith = Math.min(100, s.pathFaith + 15);
        s.happiness = Math.min(100, s.happiness + 15);
        return { log: `第${s.currentAge}岁，你递交了辞职信，在出租屋里开始了创业。前六个月你每天工作十六个小时，第七个月产品上线，第十个月开始有了付费用户。一年后你的MRR超过了以前的年薪。你坐在新租的办公室里，看着增长曲线，想起写辞职信的那个下午——你赌赢了。`, cost: 80000 };
      } else {
        (s as any).aiSkillLevel = Math.min(100, (s as any).aiSkillLevel + 5);
        s.pathFaith = Math.max(0, s.pathFaith - 15);
        s.happiness = Math.max(0, s.happiness - 15);
        s.health = Math.max(0, s.health - 8);
        return { log: `第${s.currentAge}岁，你All in了。十八个月后你关掉了产品页面。不是你的想法不好，是巨头三个月后推出了一模一样的功能，而且免费。你看着银行账户里剩下的钱，够撑两个月房租。你没有哭，只是默默打开了招聘网站。你不后悔——至少你试过了。`, cost: 80000 };
      }
    },
    logTemplate: '第{年龄}岁，你把所有筹码推上了桌，赌上了AI产品的未来。',
  },
];

// ============================================================
// 路径2：链上原住民 (chain_native) - 6张卡
// ============================================================
const chainNativeCards: DecisionCard[] = [
  // 卡1：早期 - 定投加仓
  {
    id: 'chain_dca_buy',
    pathId: 'chain_native',
    title: '熊市定投：越跌越买',
    description: '市场一片哀嚎，新闻里说"加密货币已死"，你的持仓缩水了60%。群里曾经最激进的人开始说"可能真的是骗局"。但你看到了别人没看到的东西——链上数据显示大户在悄悄吸筹。你做了一个反人性的决定：从工资里拿出更多钱定投。室友说你疯了，你没说话，只是按下了"买入"键。',
    hint: '花费¥20,000加仓 · 信念+10 · 压力+10',
    cost: 20000,
    category: '投资理财',
    ageRange: [23, 35],
    repeatable: true,
    cooldown: 3,
    maxUses: 4,
    prerequisites: (s) => s.retirementPath === 'chain_native' && s.currentSavings >= 25000 && !(s as any).hasAbandonedCrypto,
    effect: (s: GameState) => {
      ensureChainState(s);
      const buy = 20000;
      // 模拟50%概率买在低点（持仓价值上升），50%继续下跌
      const multiplier = Math.random() < 0.5 ? 1.8 : 0.7;
      (s as any).chainHoldings += Math.round(buy * multiplier);
      s.pathFaith = Math.min(100, s.pathFaith + 10);
      s.stress = Math.min(100, s.stress + 10);
      s.happiness = Math.max(0, s.happiness - 3);
      const log = `第${s.currentAge}岁，在血流成河的市场里你按下了买入键。恐惧是会传染的，但你训练自己在别人恐惧时贪婪——或者说，你在训练自己假装不恐惧。手指按下确认的那一刻你在发抖，但你知道，所有的暴富故事都始于无人问津时的买入。`;
      return { log, cost: 20000 };
    },
    logTemplate: '第{年龄}岁，你在恐惧中加仓，别人恐慌时你选择了贪婪。',
  },

  // 卡2：中期 - DeFi流动性挖矿/Yield Farming
  {
    id: 'chain_defi_yield',
    pathId: 'chain_native',
    title: '参与DeFi流动性挖矿',
    description: '你发现了一个年化收益200%的流动性池。理智告诉你年化这么高肯定有风险，但合约代码你审计过了，没发现漏洞；社区讨论了你翻了个遍，没看到rug pull的迹象。你转了一笔钱进去，第一天就收到了收益。那种感觉就像打开了一个水龙头，钱在自动流进来——但你也清楚，高收益的水龙头随时可能变成抽水机。',
    hint: '投入¥30,000 · 60%赚(被动收入+¥12,000/年) · 40%亏(持仓-40%)',
    cost: 30000,
    category: '投资理财',
    ageRange: [24, 36],
    repeatable: false,
    prerequisites: (s) => s.retirementPath === 'chain_native' && s.currentSavings >= 35000 && !(s as any).hasAbandonedCrypto,
    effect: (s: GameState) => {
      ensureChainState(s);
      const success = Math.random() < 0.6;
      s.stress = Math.min(100, s.stress + 12);
      if (success) {
        s.passiveIncome += 12000;
        s.pathFaith = Math.min(100, s.pathFaith + 8);
        s.happiness = Math.min(100, s.happiness + 5);
        return { log: `第${s.currentAge}岁，你深入研究了DeFi协议，成为了流动性提供者。收益每天到账，那种"钱在睡觉时也在工作"的感觉让你着迷。你开始理解为什么有人说"DeFi是传统金融的掘墓人"——当然，你也没忘记设好止损提醒。`, cost: 30000 };
      } else {
        (s as any).chainHoldings = Math.round((s as any).chainHoldings * 0.6);
        s.pathFaith = Math.max(0, s.pathFaith - 10);
        s.happiness = Math.max(0, s.happiness - 10);
        s.health = Math.max(0, s.health - 3);
        return { log: `第${s.currentAge}岁，你遭遇了一次"无常损失"——或者更直白地说，你亏了。代币价格暴跌，你的流动性被套利，算下来损失了40%。你盯着链上浏览器上冰冷的数字，第一次真切感受到"代码即法律"的另一面：代码不会同情你。`, cost: 30000 };
      }
    },
    logTemplate: '第{年龄}岁，你冒险进入DeFi，尝到了高收益或高风险的滋味。',
  },

  // 卡3：社交 - DAO贡献者
  {
    id: 'chain_dao_contribute',
    pathId: 'chain_native',
    title: '成为DAO核心贡献者',
    description: '你在一个你长期持有的项目DAO里开始活跃——写提案、投票、在Discord里帮助新人、组织线上会议。最初只是出于热爱，但慢慢你获得了治理代币奖励，你的意见开始被社区重视。你第一次感受到"去中心化组织"的魅力：没有老板，没有KPI，但每个人都在为共同的目标努力。当然，你也看到了民主决策的低效和巨鲸的操控。',
    hint: '信念+12 · 被动收入+¥6,000/年 · 压力+5 · 幸福+8',
    cost: 0,
    category: '社交关系',
    ageRange: [25, 38],
    repeatable: false,
    prerequisites: (s) => s.retirementPath === 'chain_native' && (s as any).chainHoldings >= 20000,
    effect: (s: GameState) => {
      ensureChainState(s);
      s.pathFaith = Math.min(100, s.pathFaith + 12);
      s.passiveIncome += 6000;
      s.stress = Math.min(100, s.stress + 5);
      s.happiness = Math.min(100, s.happiness + 8);
      (s as any).chainHoldings += 5000;
      const log = `第${s.currentAge}岁，你从一个沉默的持币者变成了DAO的核心贡献者。你写提案、辩论、投票，和世界各地的陌生人在Discord里争论到凌晨。你第一次觉得自己不是在"炒币"，而是在参与建造一个新的体系——一个不需要信任任何人、只需要信任代码的体系。这种归属感，比赚钱更让你踏实。`;
      return { log, cost: 0 };
    },
    logTemplate: '第{年龄}岁，你深入DAO，从旁观者变成了建设者。',
  },

  // 卡4：健康 - 盯盘的代价
  {
    id: 'chain_insomnia',
    pathId: 'chain_native',
    title: '凌晨三点的K线：失眠的夜晚',
    description: '你已经连续一周凌晨三点醒来刷行情了。手机屏幕的蓝光在黑暗中像鬼火，K线上上下下牵动着你的心跳。你告诉自己不要看短期，但手不受控制地点开交易所APP。白天你精神恍惚，喝咖啡像喝水，工作频频出错。你照镜子看到自己浓重的黑眼圈，意识到你虽然在"投资未来"，但正在输掉现在。',
    hint: '健康-10 · 压力-8（强制休息一周）· 花费¥2,000（助眠/心理咨询）',
    cost: 2000,
    category: '健康养生',
    ageRange: [23, 42],
    repeatable: true,
    cooldown: 4,
    maxUses: 3,
    prerequisites: (s) => s.retirementPath === 'chain_native',
    effect: (s: GameState) => {
      s.health = Math.max(0, s.health - 10);
      s.stress = Math.max(0, s.stress - 8);
      s.happiness = Math.max(0, s.happiness - 5);
      const log = `第${s.currentAge}岁，你终于承认自己的睡眠被行情绑架了。你卸载了手机上的交易所APP（电脑上还留着），买了助眠茶和眼罩，强迫自己晚上十一点后不看价格。第一周你辗转反侧，第二周你开始能一觉睡到天亮了。你意识到：投资是为了更好地生活，如果它毁掉了你的生活，投资就失去了意义。`;
      return { log, cost: 2000 };
    },
    logTemplate: '第{年龄}岁，K线夺走了你的睡眠，你决定把手机放下。',
  },

  // 卡5：感情 - 伴侣查账
  {
    id: 'chain_partner_money',
    pathId: 'chain_native',
    title: '伴侣发现了你的"秘密账户"',
    description: 'TA翻你手机的时候看到了交易所APP，看到了你没告诉TA的数字。一场大吵爆发了。TA说"你拿我们的未来去赌？"你说"这不是赌，这是投资"。TA说"亏了怎么办？"你说"不会亏的，我研究过了"。TA看着你，眼里有失望也有恐惧："你变了，你以前不这样。"你想反驳，但你想起了上周那次20%的暴跌，你也吓出了一身冷汗。',
    hint: '坦白+交出部分仓位：感情+12 · 信念-5 · 持仓-15%；隐瞒+继续：感情-12 · 信念+5',
    cost: 0,
    category: '💝 感情',
    ageRange: [25, 40],
    repeatable: false,
    prerequisites: (s) => s.retirementPath === 'chain_native' && s.partner !== null && s.partner.datingStage !== 'single' && s.partner.datingStage !== 'divorced' && !(s as any).hasAbandonedCrypto,
    effect: (s: GameState) => {
      ensureChainState(s);
      const confess = Math.random() < 0.5;
      if (confess) {
        s.partner!.affection = Math.min(100, s.partner!.affection + 12);
        s.partner!.trust = Math.min(100, s.partner!.trust + 15);
        s.pathFaith = Math.max(0, s.pathFaith - 5);
        s.happiness = Math.min(100, s.happiness + 5);
        (s as any).chainHoldings = Math.round((s as any).chainHoldings * 0.85);
        s.currentSavings += Math.round((s as any).chainHoldings * 0.1);
        return { log: `第${s.currentAge}岁，你选择了坦白。你打开电脑让TA看所有的持仓和交易记录，承认了你的赌注和恐惧。你们长谈了一整夜，最后约定：最多只拿总资产的30%放在链上，其余转回法币作为家庭储备。你心里虽然不舍，但看到TA终于松了一口气的表情，你知道透明比暴富更重要。`, cost: 0 };
      } else {
        s.partner!.affection = Math.max(0, s.partner!.affection - 12);
        s.partner!.trust = Math.max(0, s.partner!.trust - 18);
        s.pathFaith = Math.min(100, s.pathFaith + 5);
        s.stress = Math.min(100, s.stress + 15);
        s.happiness = Math.max(0, s.happiness - 10);
        return { log: `第${s.currentAge}岁，你选择了隐瞒。你把交易所APP藏在手机第二页的文件夹深处，设置了双重密码。你们表面上和好了，但你知道有什么东西变了——TA开始翻你手机，你开始躲着TA看行情。你们之间多了一扇门，你拿着钥匙，但你不确定门后面是什么。`, cost: 0 };
      }
    },
    logTemplate: '第{年龄}岁，你的链上秘密被发现，信任面临考验。',
  },

  // 卡6：中后期 - 提币冷存储/落袋为安
  {
    id: 'chain_cold_storage',
    pathId: 'chain_native',
    title: '将大部分资产转入冷钱包',
    description: '又一个交易所被曝出挪用用户资产的新闻。你盯着这条推送，后背一阵发凉——你大部分的币还在交易所里。你花了一整天研究冷钱包设置，断网、生成私钥、抄写助记词（用金属板刻了三份），然后把资产从交易所提了出来。当最后一笔链上确认完成时，你感到一种奇怪的平静——你的币终于真正属于你了，不再依赖任何人的服务器。',
    hint: '信念+10 · 压力-15 · 花费¥3,000（硬件钱包）· 幸福+5',
    cost: 3000,
    category: '核心决策',
    ageRange: [28, 45],
    repeatable: false,
    prerequisites: (s) => s.retirementPath === 'chain_native' && (s as any).chainHoldings >= 50000,
    effect: (s: GameState) => {
      ensureChainState(s);
      s.pathFaith = Math.min(100, s.pathFaith + 10);
      s.stress = Math.max(0, s.stress - 15);
      s.happiness = Math.min(100, s.happiness + 5);
      const log = `第${s.currentAge}岁，你买了硬件钱包，在断网的电脑上完成了所有设置，把助记词刻在了三块金属板上，分别放在了三个城市。每一步你都手心冒汗，生怕出错——毕竟一笔失误就是永久丢失。但当一切完成，你握着那块小小的硬件设备，你第一次真正理解了"Not your keys, not your coins"的含义。`;
      return { log, cost: 3000 };
    },
    logTemplate: '第{年龄}岁，你学会了真正的自我托管，你的币终于属于你。',
  },
];

// ============================================================
// 路径3：数字游牧民 (digital_nomad) - 6张卡
// ============================================================
const digitalNomadCards: DecisionCard[] = [
  // 卡1：早期 - 拿下第一个海外长期客户
  {
    id: 'nomad_first_client',
    pathId: 'digital_nomad',
    title: '拿下第一个海外长期客户',
    description: '你在Upwork上投了四十封proposal，终于有一个美国创业公司回复了你。面试时你的网络在巴厘岛的咖啡馆里断了三次，你以为没戏了，但对方说"喜欢你的作品，下周一开始"。第一笔美元到账的时候你换算成人民币，手在抖——相当于你以前一个半月的工资。你坐在稻田边，电脑开着，周围是蛙鸣，你想：这就是我想要的生活。',
    hint: '薪资+30% · 被动收入+¥5,000/年 · 信念+8 · 幸福+10 · 花费¥0',
    cost: 0,
    category: '核心决策',
    ageRange: [22, 28],
    repeatable: false,
    prerequisites: (s) => s.retirementPath === 'digital_nomad',
    effect: (s: GameState) => {
      ensureNomadState(s);
      (s as any).nomadClients += 1;
      s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.3);
      s.passiveIncome += 5000;
      s.pathFaith = Math.min(100, s.pathFaith + 8);
      s.happiness = Math.min(100, s.happiness + 10);
      s.stress = Math.max(0, s.stress - 5);
      const log = `第${s.currentAge}岁，你签下了第一个海外长期客户。第一笔美元到账通知弹出来的时候，你正在一个陌生国度的路边摊吃炒面。你看着那条到账通知，又看着面前热气腾腾的面、身边路过的僧侣、远处的晚霞——你觉得你做出了22岁以来最正确的决定。`;
      return { log, cost: 0 };
    },
    logTemplate: '第{年龄}岁，你签下第一个海外客户，地理套利开始兑现。',
  },

  // 卡2：中期 - 搬到一个新国家
  {
    id: 'nomad_new_country',
    pathId: 'digital_nomad',
    title: '搬去一个新的国家生活',
    description: '你在一个地方住了半年，新鲜感退去，你开始觉得无聊。你在Nomad List上翻了一整夜，最后买了一张去里斯本/墨西哥城/曼谷/第比利斯的单程票。打包行李只需要一个小时——你早就学会了只带必需品。但在飞机上你突然想：这种永远在路上的状态，到底是自由还是逃避？飞机穿入云层，你闭上了眼睛，到了再说吧。',
    hint: '年支出-10%（更低成本地）或+10%（欧洲）· 信念+5 · 幸福+8 · 压力-3 · 花费¥8,000',
    cost: 8000,
    category: '生活消费',
    ageRange: [24, 40],
    repeatable: true,
    cooldown: 3,
    maxUses: 5,
    prerequisites: (s) => s.retirementPath === 'digital_nomad' && s.isGeoArbitrage,
    effect: (s: GameState) => {
      ensureNomadState(s);
      s.pathFaith = Math.min(100, s.pathFaith + 5);
      s.happiness = Math.min(100, s.happiness + 8);
      s.stress = Math.max(0, s.stress - 3);
      // 随机成本变化
      if (Math.random() < 0.5) {
        s.annualBaseCost = Math.round(s.annualBaseCost * 0.9);
      } else {
        s.annualBaseCost = Math.round(s.annualBaseCost * 1.1);
      }
      (s as any).nomadClients += Math.random() < 0.3 ? 1 : 0;
      const log = `第${s.currentAge}岁，你又一次降落在一个陌生的机场。空气的味道不一样，语言不一样，插座形状不一样。最初的一周是混乱的——办电话卡、找公寓、试新餐馆——但混乱中有一种活着的感觉。你不知道下一站是哪里，但你知道你还不想停下来。`;
      return { log, cost: 8000 };
    },
    logTemplate: '第{年龄}岁，你降落在新的国度，世界又展开了一页。',
  },

  // 卡3：社交 - 在游牧社区找到归属
  {
    id: 'nomad_community',
    pathId: 'digital_nomad',
    title: '加入数字游民共居社区',
    description: '你一个人旅行久了，开始厌倦一个人吃饭、一个人看海、一个人对着电脑笑。你搬进了一个共居空间，里面全是和你一样的人——开发者、设计师、写手、创业者。你们白天各自工作，傍晚一起做饭冲浪，周末去探索附近的小镇。你终于不再解释你的生活方式了，因为周围的人都和你一样。',
    hint: '客户+1 · 信念+10 · 幸福+12 · 压力-8 · 花费¥12,000/年（共居费）',
    cost: 12000,
    category: '社交关系',
    ageRange: [25, 38],
    repeatable: false,
    prerequisites: (s) => s.retirementPath === 'digital_nomad' && s.isGeoArbitrage,
    effect: (s: GameState) => {
      ensureNomadState(s);
      (s as any).nomadClients += 1;
      s.passiveIncome += 6000;
      s.pathFaith = Math.min(100, s.pathFaith + 10);
      s.happiness = Math.min(100, s.happiness + 12);
      s.stress = Math.max(0, s.stress - 8);
      const log = `第${s.currentAge}岁，你搬进了共居空间，推开门的那一刻你笑了——客厅里有人在敲代码，有人在Skype开会，有人在弹吉他，冰箱上贴满了世界各地的贴纸。你终于不用解释"你是做什么的""你从哪来""你什么时候回去"了。在这里，所有人都没有"回去"的计划。`;
      return { log, cost: 12000 };
    },
    logTemplate: '第{年龄}岁，你找到了同类，游牧路上不再孤单。',
  },

  // 卡4：健康 - 异国生病
  {
    id: 'nomad_illness_abroad',
    pathId: 'digital_nomad',
    title: '在异国他乡生病',
    description: '你在一个语言不通的小国发烧到39度。你一个人躺在民宿的硬板床上，连爬起来倒水的力气都没有。你翻遍手机不知道当地急救电话是多少，医保能不能报也不确定。你给妈妈打了个电话，听到她声音的那一刻你差点哭出来。你说"没事，就是有点感冒"，挂了电话后你还是哭了。',
    hint: '健康-15 · 信念-10 · 花费¥15,000（自费医疗）· 压力+10 · 幸福-12',
    cost: 15000,
    category: '健康养生',
    ageRange: [23, 45],
    repeatable: true,
    cooldown: 5,
    maxUses: 2,
    prerequisites: (s) => s.retirementPath === 'digital_nomad' && s.isGeoArbitrage,
    effect: (s: GameState) => {
      s.health = Math.max(0, s.health - 15);
      s.pathFaith = Math.max(0, s.pathFaith - 10);
      s.stress = Math.min(100, s.stress + 10);
      s.happiness = Math.max(0, s.happiness - 12);
      const log = `第${s.currentAge}岁，你在异国的小旅馆里发着高烧，窗外是陌生的街景和听不懂的语言。你想喝口热水都得自己撑着去烧，那一刻你无比怀念家里妈妈熬的粥。病好之后你买了一份全球医疗保险，也第一次认真考虑：如果有一天你走不动了，你要在哪里停下来？`;
      return { log, cost: 15000 };
    },
    logTemplate: '第{年龄}岁，你在异国生病，自由的代价第一次如此真实。',
  },

  // 卡5：感情 - 路上的爱情
  {
    id: 'nomad_road_romance',
    pathId: 'digital_nomad',
    title: '在路上遇到一个人',
    description: '你在墨西哥瓦哈卡的一个厨艺课上遇到了TA。TA来自另一个国家，也在游牧。你们一起学做taco、一起去看玛雅遗址、一起在星空下喝梅斯卡尔。你知道你们的签证都有到期日，你们的下一站可能在不同的大陆。但此刻你们在一起，这个"此刻"比任何"以后"都真实。机场告别时你们都没哭，只是交换了一个很长的拥抱。',
    hint: '幸福+15 · 信念+5 · 压力+5（离别的忧伤）· 花费¥5,000',
    cost: 5000,
    category: '💝 感情',
    ageRange: [23, 38],
    repeatable: true,
    cooldown: 4,
    maxUses: 2,
    prerequisites: (s) => s.retirementPath === 'digital_nomad' && (!s.partner || s.partner.datingStage === 'single' || s.partner.datingStage === 'divorced'),
    effect: (s: GameState) => {
      s.happiness = Math.min(100, s.happiness + 15);
      s.pathFaith = Math.min(100, s.pathFaith + 5);
      s.stress = Math.min(100, s.stress + 5);
      // 30%概率发展成长期关系
      if (Math.random() < 0.3 && (!s.partner || s.partner.datingStage === 'single' || s.partner.datingStage === 'divorced')) {
        const personalities: Array<'温柔型' | '事业型' | '浪漫型' | '节俭型' | '独立型'> = ['浪漫型', '独立型', '温柔型'];
        const p = personalities[Math.floor(Math.random() * personalities.length)];
        s.partner = {
          name: '路上遇见的人',
          age: s.currentAge + Math.floor(Math.random() * 3) - 1,
          affection: 70,
          trust: 50,
          datingStage: 'dating',
          meetYear: s.currentAge,
          marriedYear: 0,
          hasDivorced: false,
          personality: p,
          trait: '也是一个数字游民',
          memories: [{ age: s.currentAge, event: '在路上相遇', emoji: '🌍' }],
          crushFrom: 'travel',
        };
        return { log: `第${s.currentAge}岁，你在路上遇到了一个人。你们一起看了玛雅金字塔，在星空下跳舞，在机场告别时你们都哭了。但这一次不一样——你们约定了下一站在里斯本见面。也许这就是游牧路上最美的事：你永远不知道下一个转弯会遇到谁。`, cost: 5000 };
      }
      return { log: `第${s.currentAge}岁，你在路上遇到了一个人，你们一起度过了闪闪发光的两周。在机场你们拥抱告别，没有留联系方式，也没有约定再见。有些人注定只是你人生旅途中的一站，但窗外掠过的风景，会永远留在你心里。`, cost: 5000 };
    },
    logTemplate: '第{年龄}岁，你在路上遇见了爱情，短暂却璀璨。',
  },

  // 卡6：中后期 - 建立被动收入管道（产品化服务）
  {
    id: 'nomad_productize',
    pathId: 'digital_nomad',
    title: '把服务产品化：从出卖时间到出售结果',
    description: '你做了几年自由职业，发现了一个残酷的事实：只要你还在按小时收费，你就永远不可能自由——因为你的时间是有限的。你开始把你的服务打包成标准化产品：固定价格、固定交付周期、固定范围。你花了三个月重新设计你的网站和报价单，拒绝了所有不匹配的客户。收入短期下降了，但你终于有了可扩展性。',
    hint: '被动收入+¥25,000/年 · 压力-10 · 信念+10 · 幸福+5 · 花费¥0',
    cost: 0,
    category: '核心决策',
    ageRange: [28, 42],
    repeatable: false,
    prerequisites: (s) => s.retirementPath === 'digital_nomad' && (s as any).nomadClients >= 2,
    effect: (s: GameState) => {
      ensureNomadState(s);
      s.passiveIncome += 25000;
      s.stress = Math.max(0, s.stress - 10);
      s.pathFaith = Math.min(100, s.pathFaith + 10);
      s.happiness = Math.min(100, s.happiness + 5);
      s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 0.8); // 主动收入减少但被动增加
      const log = `第${s.currentAge}岁，你完成了从"卖时间"到"卖结果"的转型。你不再接按小时计费的活儿，你的产品页面明码标价，客户自助下单。你第一次可以在旅行的时候不看邮箱——因为你的收入不再依赖你实时在线。这是你理解"地点自由"之后理解的第二课：真正的自由是不依赖时间换钱。`;
      return { log, cost: 0 };
    },
    logTemplate: '第{年龄}岁，你把服务产品化，真正的自由开始成形。',
  },
];

// ============================================================
// 路径4：超级IP (super_ip) - 6张卡
// ============================================================
const superIpCards: DecisionCard[] = [
  // 卡1：早期 - 找到内容定位
  {
    id: 'ip_find_niche',
    pathId: 'super_ip',
    title: '找到你的内容定位：垂直深耕',
    description: '你发了一百条内容，什么话题都试过了——美食、旅行、职场、鸡汤——数据都不温不火。直到有一天你发了一条关于你专业领域深度解析的内容，爆了。评论区有人说"终于有人把这个讲明白了"。你盯着那条内容看了很久，然后删掉了之前所有不相关的内容。从今天起，你只讲这一件事。',
    hint: '粉丝+2,000 · 声誉+10 · 信念+8 · 幸福+5 · 花费¥0',
    cost: 0,
    category: '核心决策',
    ageRange: [22, 28],
    repeatable: false,
    prerequisites: (s) => s.retirementPath === 'super_ip',
    effect: (s: GameState) => {
      ensureIpState(s);
      (s as any).ipFollowers += 2000;
      (s as any).ipReputation = Math.min(100, (s as any).ipReputation + 10);
      s.pathFaith = Math.min(100, s.pathFaith + 8);
      s.happiness = Math.min(100, s.happiness + 5);
      s.stress = Math.min(100, s.stress + 3);
      const log = `第${s.currentAge}岁，你终于找到了属于你的那个"缝隙"——一个你真正懂、且别人讲得没你好的领域。你删掉了过去那些追热点的内容，像一个匠人一样开始只打磨一件东西。粉丝数开始稳步增长，评论区从"哈哈哈哈"变成了"感谢分享，学到了"。你第一次觉得：做内容不是当小丑，是当老师。`;
      return { log, cost: 0 };
    },
    logTemplate: '第{年龄}岁，你找到了自己的内容赛道，开始垂直深耕。',
  },

  // 卡2：中期 - 第一次恰饭
  {
    id: 'ip_first_sponsor',
    pathId: 'super_ip',
    title: '接下第一个商业合作',
    description: '你收到了第一封广告合作邮件。品牌方开价5000块，要你在内容里植入他们的产品。你盯着邮件犹豫了三天——你怕粉丝说你"恰烂钱"，你怕"变了"，你怕那些因为你的真诚而来的人失望。但你算了算账，5000块够你交三个月房租，让你可以继续做内容不用去上班。你咬了咬牙，接了。',
    hint: '被动收入+¥8,000/年 · 声誉-5（部分粉丝失望）· 信念-3 · 压力+8 · 收入¥5,000',
    cost: -5000,
    category: '投资理财',
    ageRange: [24, 33],
    repeatable: true,
    cooldown: 2,
    maxUses: 5,
    prerequisites: (s) => s.retirementPath === 'super_ip' && (s as any).ipFollowers >= 5000,
    effect: (s: GameState) => {
      ensureIpState(s);
      s.passiveIncome += 8000;
      (s as any).ipReputation = Math.max(0, (s as any).ipReputation - 5);
      s.pathFaith = Math.max(0, s.pathFaith - 3);
      s.stress = Math.min(100, s.stress + 8);
      s.happiness = Math.min(100, s.happiness + 3);
      const log = `第${s.currentAge}岁，你接下了第一个广告。发布前你改了十二遍文案，生怕太硬伤粉丝。发布后你不敢看评论，过了两个小时才鼓起勇气点开——有人说"接广告了，取关了"，但也有人说"UP主也得吃饭，支持"。你松了一口气，也明白了一个道理：你不可能让所有人满意。`;
      return { log, cost: -5000 };
    },
    logTemplate: '第{年龄}岁，你第一次"恰饭"，在理想和面包之间找到了平衡。',
  },

  // 卡3：社交 - 跨界联动
  {
    id: 'ip_collab',
    pathId: 'super_ip',
    title: '和其他创作者跨界联动',
    description: '你和一个不同领域的创作者做了一期联名内容。拍摄那天你们从下午聊到凌晨，发现彼此虽然做的内容不同，但面对的困惑一模一样——算法焦虑、创作瓶颈、黑粉骚扰。那期内容播放量是你平时的三倍，你们互相涨了一波粉。更重要的是，你在这条孤独的路上交到了朋友。',
    hint: '粉丝+5,000 · 声誉+8 · 信念+5 · 幸福+10 · 花费¥3,000',
    cost: 3000,
    category: '社交关系',
    ageRange: [25, 38],
    repeatable: true,
    cooldown: 3,
    maxUses: 3,
    prerequisites: (s) => s.retirementPath === 'super_ip' && (s as any).ipFollowers >= 10000,
    effect: (s: GameState) => {
      ensureIpState(s);
      (s as any).ipFollowers += 5000;
      (s as any).ipReputation = Math.min(100, (s as any).ipReputation + 8);
      s.pathFaith = Math.min(100, s.pathFaith + 5);
      s.happiness = Math.min(100, s.happiness + 10);
      s.stress = Math.max(0, s.stress - 3);
      const log = `第${s.currentAge}岁，你走出自己的小圈子，和另一个创作者做了联名。碰撞的火花让你想起最初为什么开始做内容——不是为了数据，是因为有话想说。你们在镜头前开怀大笑，评论区在刷"神仙联动"。你意识到：创作者不需要是孤岛，彼此照亮才能走得更远。`;
      return { log, cost: 3000 };
    },
    logTemplate: '第{年龄}岁，你和同行跨界联动，1+1>2的化学反应。',
  },

  // 卡4：健康/心理 - 网暴/评论区的恶意
  {
    id: 'ip_harassment',
    pathId: 'super_ip',
    title: '遭遇网暴：评论区的恶意',
    description: '你因为一句话被断章取义截了图，一夜之间你成了全网攻击的靶子。私信里塞满了诅咒，有人扒出了你以前的所有言论逐字分析，有人P了你的遗照。你关掉所有通知，拉上窗帘，在黑暗中坐了一整天。你不理解——你只是说了一句你相信的话，为什么世界要这样对你？你开始怀疑：做一个"公开的人"值得吗？',
    hint: '幸福-20 · 压力+25 · 健康-8 · 信念-15 · 声誉-10',
    cost: 0,
    category: '健康养生',
    ageRange: [25, 42],
    repeatable: true,
    cooldown: 5,
    maxUses: 2,
    prerequisites: (s) => s.retirementPath === 'super_ip' && (s as any).ipFollowers >= 20000,
    effect: (s: GameState) => {
      ensureIpState(s);
      s.happiness = Math.max(0, s.happiness - 20);
      s.stress = Math.min(100, s.stress + 25);
      s.health = Math.max(0, s.health - 8);
      s.pathFaith = Math.max(0, s.pathFaith - 15);
      (s as any).ipReputation = Math.max(0, (s as any).ipReputation - 10);
      const log = `第${s.currentAge}岁，你被网暴了。你这才知道原来语言真的可以杀人——不是比喻，是那种实实在在的、让你吃不下饭睡不着觉的恶意。你卸载了所有社交APP，三天没出门。第四天你打开电脑，看到还有几百个老粉丝在评论区说"我们支持你"。你哭了，然后开始写回应。不是为了说服那些骂你的人，是为了那些还相信你的人。`;
      return { log, cost: 0 };
    },
    logTemplate: '第{年龄}岁，你遭遇了网暴，在黑暗中学会了更强大。',
  },

  // 卡5：感情 - 人设入侵真实生活
  {
    id: 'ip_identity_crisis',
    pathId: 'super_ip',
    title: '"你现在跟谁都像在做内容"',
    description: 'TA在一次吵架中说出了这句话。你愣住了。你回想最近和朋友吃饭时你在想"这个故事可以做成内容"，和父母打电话时你在构思标题，甚至和TA吵架的时候你都在想"这段对话太真实了，粉丝会共鸣"。你冷汗下来了——你已经分不清什么时候是"你"，什么时候是"那个IP"了。',
    hint: '选择做回自己：伴侣感情+15 · 粉丝-3,000 · 声誉+10；选择继续表演：感情-15 · 粉丝+2,000 · 信念-8',
    cost: 0,
    category: '💝 感情',
    ageRange: [26, 40],
    repeatable: false,
    prerequisites: (s) => s.retirementPath === 'super_ip' && s.partner !== null && s.partner.datingStage !== 'single' && s.partner.datingStage !== 'divorced',
    effect: (s: GameState) => {
      ensureIpState(s);
      const chooseAuthentic = Math.random() < 0.5;
      if (chooseAuthentic) {
        s.partner!.affection = Math.min(100, s.partner!.affection + 15);
        s.partner!.trust = Math.min(100, s.partner!.trust + 12);
        (s as any).ipFollowers = Math.max(500, (s as any).ipFollowers - 3000);
        (s as any).ipReputation = Math.min(100, (s as any).ipReputation + 10);
        s.happiness = Math.min(100, s.happiness + 8);
        s.pathFaith = Math.max(0, s.pathFaith - 3);
        return { log: `第${s.currentAge}岁，TA的话像一盆冷水浇醒了你。你开始刻意"关镜头"——和朋友吃饭时不拍照，和TA约会时不构思文案，甚至刻意发一些不完美的、有瑕疵的内容。掉了一些粉，但留下来的人说"你越来越真实了"。你终于明白：最好的人设是没有人设。`, cost: 0 };
      } else {
        s.partner!.affection = Math.max(0, s.partner!.affection - 15);
        s.partner!.trust = Math.max(0, s.partner!.trust - 12);
        (s as any).ipFollowers += 2000;
        s.pathFaith = Math.max(0, s.pathFaith - 8);
        s.stress = Math.min(100, s.stress + 12);
        s.happiness = Math.max(0, s.happiness - 10);
        return { log: `第${s.currentAge}岁，你嘴上说"我没有"，但心里知道TA是对的。你继续在生活中捕捉素材，在关系里寻找"共鸣点"。你们的关系没有破裂，但有什么东西在慢慢冷却——就像你和真实的自己之间，也隔了一层镜头。夜深人静的时候你问自己：如果有一天不做内容了，我还剩下什么？`, cost: 0 };
      }
    },
    logTemplate: '第{年龄}岁，人设入侵了生活，你在真实和表演间挣扎。',
  },

  // 卡6：中后期 - 做付费内容/社群
  {
    id: 'ip_paid_community',
    pathId: 'super_ip',
    title: '推出付费社群/课程',
    description: '每天都有人私信问你"能不能系统教教我"。你犹豫了很久——你怕被说教割韭菜，你怕你的经验不值那个钱。但你花了三个月整理了你所有的方法论，录了四十个小时的课程，建了一个付费社群。上线第一天你紧张得不敢看手机，晚上打开后台，看到有200个人付费了。你手在抖——不是因为钱，是因为有200个人愿意为你的知识付钱。',
    hint: '被动收入+¥40,000/年 · 信念+12 · 幸福+10 · 压力+10 · 花费¥5,000（制作成本）',
    cost: 5000,
    category: '核心决策',
    ageRange: [28, 45],
    repeatable: false,
    prerequisites: (s) => s.retirementPath === 'super_ip' && (s as any).ipFollowers >= 30000 && (s as any).ipReputation >= 50,
    effect: (s: GameState) => {
      ensureIpState(s);
      s.passiveIncome += 40000;
      s.pathFaith = Math.min(100, s.pathFaith + 12);
      s.happiness = Math.min(100, s.happiness + 10);
      s.stress = Math.min(100, s.stress + 10);
      (s as any).ipReputation = Math.min(100, (s as any).ipReputation + 5);
      const log = `第${s.currentAge}岁，你推出了付费课程和社群。第一批学员的作业和反馈让你每天都在感动——有人说你的课改变了TA的职业方向，有人说因为你的社群TA找到了同路人。你终于不再靠广告看甲方脸色了，你的收入直接来自那些真正认可你价值的人。这是你做内容以来最有安全感的时刻。`;
      return { log, cost: 5000 };
    },
    logTemplate: '第{年龄}岁，你推出付费社群，知识开始直接变现。',
  },
];

// ============================================================
// 路径5：银发收割者 (silver_economy) - 6张卡
// ============================================================
const silverEconomyCards: DecisionCard[] = [
  // 卡1：早期 - 上门护理服务
  {
    id: 'silver_home_care',
    pathId: 'silver_economy',
    title: '提供上门护理服务',
    description: '你印了五百张传单在社区里发，大部分人接过去就扔了。第一个客户是张奶奶——她子女在外地，她需要有人每周陪她去医院、帮她买药、陪她说说话。第一次上门时你紧张得手心出汗，但她拉着你的手给你塞橘子，说"你比我儿子还贴心"。你看着她满是皱纹的手，鼻子一酸。',
    hint: '客户+3 · 月营收+¥3,000 · 信念+10 · 幸福+10 · 花费¥2,000',
    cost: 2000,
    category: '核心决策',
    ageRange: [22, 28],
    repeatable: false,
    prerequisites: (s) => s.retirementPath === 'silver_economy',
    effect: (s: GameState) => {
      ensureSilverState(s);
      const biz = (s as any).silverBusiness;
      biz.clients += 3;
      biz.monthlyRevenue += 3000;
      biz.reputation = Math.min(100, biz.reputation + 8);
      s.pathFaith = Math.min(100, s.pathFaith + 10);
      s.happiness = Math.min(100, s.happiness + 10);
      s.stress = Math.min(100, s.stress + 5);
      const log = `第${s.currentAge}岁，你开始提供上门护理服务。第一个月只有三个客户，但每一个都拉着你的手说谢谢。张奶奶非要给你介绍她的老姐妹，李爷爷写了一幅字送给你"老吾老以及人之老"。你把那幅字贴在你租的小门面里，看着它，你觉得这事儿能成。`;
      return { log, cost: 2000 };
    },
    logTemplate: '第{年龄}岁，你敲开了第一扇门，银发生意从一个橘子开始。',
  },

  // 卡2：中期 - 考取专业护理/养老证书
  {
    id: 'silver_certification',
    pathId: 'silver_economy',
    title: '考取高级养老护理师资质',
    description: '你发现光有热情不够——老人突发心梗你不知道怎么急救，失智老人的行为你不知道怎么应对，糖尿病老人的饮食你不懂搭配。你报了个专业培训班，班上其他人都是四十岁以上的阿姨大叔，你是最年轻的。老师说"现在年轻人愿意做这个的不多了"，你没说话，但你心里想：这恰恰是机会。',
    hint: '声誉+15 · 信念+8 · 月营收+¥5,000 · 花费¥8,000 · 压力+5',
    cost: 8000,
    category: '技能进修',
    ageRange: [24, 35],
    repeatable: false,
    prerequisites: (s) => s.retirementPath === 'silver_economy',
    effect: (s: GameState) => {
      ensureSilverState(s);
      const biz = (s as any).silverBusiness;
      biz.reputation = Math.min(100, biz.reputation + 15);
      biz.monthlyRevenue += 5000;
      s.pathFaith = Math.min(100, s.pathFaith + 8);
      s.stress = Math.min(100, s.stress + 5);
      s.health = Math.min(100, s.health + 2);
      const log = `第${s.currentAge}岁，你用半年时间考下了高级养老护理师资质。你学会了急救、失智照护、慢病管理、康复训练。你不再只是"陪老人聊天的好心人"，你是专业人士。证书到手那天你比大学毕业还高兴——因为这一次，你学的东西是真正能救命的。`;
      return { log, cost: 8000 };
    },
    logTemplate: '第{年龄}岁，你考下专业资质，从热心人变成了专业人士。',
  },

  // 卡3：社交 - 社区口碑裂变
  {
    id: 'silver_word_of_mouth',
    pathId: 'silver_economy',
    title: '社区口碑爆发：老人们成了你的宣传员',
    description: '不知道从什么时候开始，你不用再发传单了——老人们自发地给你介绍客户。张奶奶在广场舞队里夸你，李爷爷在棋牌室给你打广告，王阿姨在教会小组里说"那个小X比亲闺女还贴心"。你的小门面门口开始排队，你一个人忙不过来了。你雇了第一个员工，是一个刚退休的护士大姐。',
    hint: '客户+10 · 月营收+¥8,000 · 声誉+12 · 信念+10 · 幸福+8',
    cost: 0,
    category: '社交关系',
    ageRange: [26, 38],
    repeatable: false,
    prerequisites: (s) => s.retirementPath === 'silver_economy' && (s as any).silverBusiness && (s as any).silverBusiness.reputation >= 40,
    effect: (s: GameState) => {
      ensureSilverState(s);
      const biz = (s as any).silverBusiness;
      biz.clients += 10;
      biz.monthlyRevenue += 8000;
      biz.reputation = Math.min(100, biz.reputation + 12);
      s.pathFaith = Math.min(100, s.pathFaith + 10);
      s.happiness = Math.min(100, s.happiness + 8);
      s.stress = Math.min(100, s.stress + 8); // 忙不过来也有压力
      const log = `第${s.currentAge}岁，你的口碑在社区里像涟漪一样扩散开。老人们排着队来你的服务站，有的是真的需要护理，有的只是想来找人说说话。你雇了第一个员工、第二个、第三个。你妈终于不再唉声叹气了——她在菜市场听到邻居说"你家孩子可真了不起"，回家偷偷抹了眼泪。`;
      return { log, cost: 0 };
    },
    logTemplate: '第{年龄}岁，口碑在社区里传开了，老人们成了你最好的广告。',
  },

  // 卡4：健康/情感 - 客户离世
  {
    id: 'silver_client_passes',
    pathId: 'silver_economy',
    title: '一位老人走了',
    description: '你照顾了两年的陈爷爷走了。走的时候很安详，子女都在身边。你去参加葬礼，陈爷爷的儿子握着你的手说"谢谢你陪他走完最后一程，他最后那段时间总提起你"。你站在墓碑前，眼泪止不住地流。你做这行以来第一次直面死亡——不是抽象的"养老"，是一个具体的、你爱过的人不在了。',
    hint: '幸福-10 · 压力+10 · 信念+5（对生命的理解更深）· 健康-5',
    cost: 0,
    category: '健康养生',
    ageRange: [26, 45],
    repeatable: true,
    cooldown: 4,
    maxUses: 3,
    prerequisites: (s) => s.retirementPath === 'silver_economy' && (s as any).silverBusiness && (s as any).silverBusiness.clients >= 5,
    effect: (s: GameState) => {
      ensureSilverState(s);
      const biz = (s as any).silverBusiness;
      biz.clients = Math.max(0, biz.clients - 1);
      biz.reputation = Math.min(100, biz.reputation + 5); // 家属感激
      s.happiness = Math.max(0, s.happiness - 10);
      s.stress = Math.min(100, s.stress + 10);
      s.pathFaith = Math.min(100, s.pathFaith + 5);
      s.health = Math.max(0, s.health - 5);
      const log = `第${s.currentAge}岁，你照顾了很久的一位老人走了。你去参加了葬礼，站在墓碑前你想：你做的事情不是生意，是陪伴——陪伴人走向终点。这份工作让你比同龄人更早理解了死亡，也更早理解了活着的意义。那天晚上你给爸妈打了个电话，说了很久的话。`;
      return { log, cost: 0 };
    },
    logTemplate: '第{年龄}岁，一位老人离去，你更懂了生命的重量。',
  },

  // 卡5：感情 - 家人的理解
  {
    id: 'silver_family_respect',
    pathId: 'silver_economy',
    title: '父母终于理解了你',
    description: '你爸中风了。你用专业的护理知识照顾他，从医院康复到居家护理，每一步你都做得有条不紊。你妈在旁边看着你给你爸翻身、拍背、做康复训练，突然说了一句："孩子，妈以前不理解你，现在懂了。"你爸在病床上握着你的手，说不出话，但眼角有泪。那一刻，所有的委屈都释然了。',
    hint: '父母关系+20 · 信念+15 · 幸福+15 · 压力-10',
    cost: 0,
    category: '💝 感情',
    ageRange: [28, 40],
    repeatable: false,
    prerequisites: (s) => s.retirementPath === 'silver_economy' && (s as any).silverBusiness && (s as any).silverBusiness.clients >= 8,
    effect: (s: GameState) => {
      s.parents.relationShip = Math.min(100, s.parents.relationShip + 20);
      s.pathFaith = Math.min(100, s.pathFaith + 15);
      s.happiness = Math.min(100, s.happiness + 15);
      s.stress = Math.max(0, s.stress - 10);
      s.health = Math.max(0, s.health - 5); // 照顾病人也累
      const log = `第${s.currentAge}岁，你用自己的专业能力照顾了生病的父亲。在那之前你爸一直觉得你"没出息"，但当他躺在病床上看着你熟练地护理他时，他看你的眼神变了。你妈给你熬了鸡汤，说"以前是妈不对"。你端着鸡汤，觉得这些年所有的不被理解都值了。`;
      return { log, cost: 0 };
    },
    logTemplate: '第{年龄}岁，父母终于看到了你的价值，所有委屈都释然了。',
  },

  // 卡6：中后期 - 扩张到日间照料中心
  {
    id: 'silver_day_center',
    pathId: 'silver_economy',
    title: '开设社区日间照料中心',
    description: '你的服务站太小了，老人们经常需要排队。你算了一笔账，如果租一个更大的场地，做日间照料中心——白天来吃饭、活动、做康复，晚上回家——能服务更多老人，也能真正规模化。但租金和装修需要一大笔钱，你犹豫了很久。最后你把这些年攒的钱全部投了进去。签合同那天你手在抖，你知道这是赌上了一切。',
    hint: '大赌注 · 花费¥100,000 · 60%成功：月营收+¥30,000 · 40%亏损',
    cost: 100000,
    category: '核心决策',
    ageRange: [30, 45],
    repeatable: false,
    prerequisites: (s) => s.retirementPath === 'silver_economy' && (s as any).silverBusiness && (s as any).silverBusiness.monthlyRevenue >= 10000 && s.currentSavings >= 80000,
    effect: (s: GameState) => {
      ensureSilverState(s);
      const biz = (s as any).silverBusiness;
      s.stress = Math.min(100, s.stress + 20);
      const success = Math.random() < 0.6;
      if (success) {
        biz.clients += 25;
        biz.monthlyRevenue += 30000;
        // 开设实体店铺，设置商铺资产
        s.hasShop = true;
        s.shopValue = Math.max(s.shopValue || 0, 150000);
        s.shopMonthlyRent = 0; // 自营，不收租
        biz.reputation = Math.min(100, biz.reputation + 15);
        s.pathFaith = Math.min(100, s.pathFaith + 15);
        s.happiness = Math.min(100, s.happiness + 10);
        return { log: `第${s.currentAge}岁，你租下了五百平米的场地，开了社区日间照料中心。开业那天来了好多老人和家属，民政局的人也来剪彩。你看着老人们在新的活动室里下棋、画画、做康复操，你想起了当年租小门面时只有三个客户的日子。你赌对了——银发浪潮真的来了，而你已经准备好了。`, cost: 100000 };
      } else {
        biz.reputation = Math.max(0, biz.reputation - 5);
        s.pathFaith = Math.max(0, s.pathFaith - 10);
        s.happiness = Math.max(0, s.happiness - 10);
        s.health = Math.max(0, s.health - 8);
        return { log: `第${s.currentAge}岁，你投入了所有积蓄扩张，但运营成本远超预期——专业护理员工资高、入住率不及预期、消防整改又花了一笔。你不得不大幅缩减规模，回到了你之前的小门面。你没有被击垮，但你明白了一个道理：做养老不是靠情怀就能做大的，它和任何生意一样需要理性。`, cost: 100000 };
      }
    },
    logTemplate: '第{年龄}岁，你赌上积蓄扩张，银发事业进入新阶段。',
  },
];

// ============================================================
// 路径6：生物赌徒 (bio_gambler) - 6张卡
// ============================================================
const bioGamblerCards: DecisionCard[] = [
  // 卡1：早期 - 严格的健康管理体系
  {
    id: 'bio_strict_regimen',
    pathId: 'bio_gambler',
    title: '建立严格的健康管理体系',
    description: '你买了连续血糖监测仪、智能手环、睡眠监测垫，每天记录三十多项身体数据。你的饮食精确到克，补剂按论文结果搭配，训练计划按周期安排。朋友说你活得像个实验品，你说"我就是自己的实验品"。你第一次看到自己的生物年龄测试结果比实际年龄小3岁时，觉得一切都值了。',
    hint: '生物年龄-2（更年轻）· 健康+8 · 信念+8 · 花费¥6,000/年（补剂+设备）',
    cost: 6000,
    category: '健康养生',
    ageRange: [22, 30],
    repeatable: false,
    prerequisites: (s) => s.retirementPath === 'bio_gambler',
    effect: (s: GameState) => {
      ensureBioState(s);
      (s as any).biologicalAge -= 2;
      s.health = Math.min(100, s.health + 8);
      s.pathFaith = Math.min(100, s.pathFaith + 8);
      s.happiness = Math.max(0, s.happiness - 2); // 严格自律也有代价
      s.stress = Math.min(100, s.stress + 3);
      const log = `第${s.currentAge}岁，你把身体当成了一个精密的项目来管理。每天早上空腹测血糖、称体重、看睡眠评分，每餐按宏量营养素配比吃，补剂按最新论文调整。朋友觉得你偏执，但你的体检报告告诉你一切——同学生病的时候你在健身，同学熬夜的时候你在十点睡觉。你在和时间赛跑，而目前你领先。`;
      return { log, cost: 6000 };
    },
    logTemplate: '第{年龄}岁，你把身体当项目管理，用数据对抗衰老。',
  },

  // 卡2：中期 - 加仓生物科技
  {
    id: 'bio_buy_more',
    pathId: 'bio_gambler',
    title: '加仓生物科技：抗衰赛道',
    description: '一家你跟踪了两年的抗衰公司公布了二期临床数据——显著改善了生物标志物。你兴奋得一晚上没睡，你知道这可能是下一个千亿赛道。你把存款里的又一笔钱转了进去。你的朋友说你"疯了，把钱都投在没上市的东西上"，你说"十年后你会后悔没跟"。但按下确认键的时候你的手还是在抖——这是赌，不是投资。',
    hint: '花费¥30,000加仓 · 信念+10 · 压力+12 · 60%翻倍 / 40%腰斩',
    cost: 30000,
    category: '投资理财',
    ageRange: [25, 40],
    repeatable: true,
    cooldown: 3,
    maxUses: 4,
    prerequisites: (s) => s.retirementPath === 'bio_gambler' && s.currentSavings >= 35000,
    effect: (s: GameState) => {
      ensureBioState(s);
      s.pathFaith = Math.min(100, s.pathFaith + 10);
      s.stress = Math.min(100, s.stress + 12);
      const success = Math.random() < 0.6;
      if (success) {
        (s as any).bioPortfolio += Math.round(30000 * 1.5);
        s.happiness = Math.min(100, s.happiness + 5);
        return { log: `第${s.currentAge}岁，你加仓了抗衰赛道。这次你赌对了——临床数据持续向好，你的持仓水涨船高。你在论坛上和"同路人"庆祝，有人说"我们这代人可能真的能活到150岁"。你开了一瓶红酒（白藜芦醇，你笑了），觉得未来从未如此清晰。`, cost: 30000 };
      } else {
        // 失败时：先把加仓金额加入持仓，再整体跌40%（正确模拟加仓后暴跌）
        (s as any).bioPortfolio = Math.round(((s as any).bioPortfolio + 30000) * 0.6);
        s.happiness = Math.max(0, s.happiness - 8);
        s.pathFaith = Math.max(0, s.pathFaith - 8);
        return { log: `第${s.currentAge}岁，你加仓了，但FDA给了个临床暂停，相关板块暴跌。你的账户一天内缩水40%，你盯着屏幕上的红色数字，心跳加速。但你没有卖——你告诉自己，新药研发从来不是一帆风顺的，十个项目失败九个，但只要一个成功就能覆盖所有损失。你深吸一口气，关掉了行情软件。`, cost: 30000 };
      }
    },
    logTemplate: '第{年龄}岁，你加仓了生物科技，在抗衰赛道上押下更多筹码。',
  },

  // 卡3：社交 - 加入长寿研究社区
  {
    id: 'bio_longevity_community',
    pathId: 'bio_gambler',
    title: '加入长寿研究社区',
    description: '你加入了一个线上长寿研究社区，里面有生物学家、医生、硅谷投资人、和你一样的"生物黑客"。你们分享最新论文、解读临床数据、组团测表观遗传年龄、讨论实验性疗法。你第一次觉得自己不是一个怪胎——这个世界上还有一群人和你一样，认真地相信"衰老可以被治愈"。',
    hint: '信念+12 · 生物年龄-1 · 幸福+8 · 被动收入+¥5,000/年（信息优势）· 花费¥2,000',
    cost: 2000,
    category: '社交关系',
    ageRange: [24, 40],
    repeatable: false,
    prerequisites: (s) => s.retirementPath === 'bio_gambler',
    effect: (s: GameState) => {
      ensureBioState(s);
      (s as any).biologicalAge -= 1;
      s.pathFaith = Math.min(100, s.pathFaith + 12);
      s.happiness = Math.min(100, s.happiness + 8);
      s.stress = Math.max(0, s.stress - 3);
      s.passiveIncome += 5000;
      const log = `第${s.currentAge}岁，你加入了长寿研究社区，不再是一个孤独的"药罐子"。你和MIT的博士后讨论senolytics，和硅谷的投资人交换基因检测数据，和日本的医生交流最新的临床指南。你意识到：你不是在做一件奇怪的事，你是在参与一场人类最古老的战役——对抗死亡。`;
      return { log, cost: 2000 };
    },
    logTemplate: '第{年龄}岁，你找到了同路人，在长寿路上不再独行。',
  },

  // 卡4：健康危机 - 补剂伤肝
  {
    id: 'bio_supplement_damage',
    pathId: 'bio_gambler',
    title: '肝功能异常：补剂的代价',
    description: '年度体检报告出来了，转氨酶指标飘红。医生推了推眼镜说"你吃什么保健品了？有些东西乱吃会伤肝"。你看着手里长长的补剂清单——NMN、白藜芦醇、二甲双胍、槲皮素、fisetin——第一次怀疑：你是在延长生命，还是在缩短它？你停掉了一半补剂，医生给你开了保肝药。',
    hint: '健康-12 · 信念-12 · 花费¥8,000（治疗+复查）· 压力+10 · 幸福-8',
    cost: 8000,
    category: '健康养生',
    ageRange: [26, 42],
    repeatable: true,
    cooldown: 5,
    maxUses: 2,
    prerequisites: (s) => s.retirementPath === 'bio_gambler',
    effect: (s: GameState) => {
      ensureBioState(s);
      s.health = Math.max(0, s.health - 12);
      s.pathFaith = Math.max(0, s.pathFaith - 12);
      s.stress = Math.min(100, s.stress + 10);
      s.happiness = Math.max(0, s.happiness - 8);
      (s as any).biologicalAge += 1; // 损伤让生物年龄回升
      const log = `第${s.currentAge}岁，你的体检报告给了你一巴掌。转氨酶飘红，医生警告你立即停用不明来源的补剂。你花了一周研究哪些补剂有真正的临床证据、哪些只是营销噱头，扔掉了一半瓶子。这次教训让你明白：抗衰不是吃越多药越好，Less is more。你开始学会敬畏身体的复杂性。`;
      return { log, cost: 8000 };
    },
    logTemplate: '第{年龄}岁，补剂伤了肝，你学会了敬畏身体的边界。',
  },

  // 卡5：感情 - 伴侣的质问
  {
    id: 'bio_partner_present',
    pathId: 'bio_gambler',
    title: '伴侣说："你想着活100岁，但今天都没过好"',
    description: 'TA在你拒绝TA的生日蛋糕时爆发了："你天天算卡路里、吃一堆药片、十点就睡觉，你有没有想过你为了多活二十年，可能错过了今天的快乐？如果活到100岁但一辈子没吃过自己喜欢的东西、没熬过夜、没放纵过，那多出来的二十年有什么意义？"你张了张嘴想反驳，但你看着TA失望的眼睛，突然不知道怎么回答。',
    hint: '选择平衡：感情+12 · 健康-3 · 幸福+10 · 信念-5；选择坚持：感情-12 · 信念+8 · 生物年龄-1',
    cost: 0,
    category: '💝 感情',
    ageRange: [26, 42],
    repeatable: false,
    prerequisites: (s) => s.retirementPath === 'bio_gambler' && s.partner !== null && s.partner.datingStage !== 'single' && s.partner.datingStage !== 'divorced',
    effect: (s: GameState) => {
      ensureBioState(s);
      const balance = Math.random() < 0.5;
      if (balance) {
        s.partner!.affection = Math.min(100, s.partner!.affection + 12);
        s.partner!.trust = Math.min(100, s.partner!.trust + 8);
        s.health = Math.max(0, s.health - 3);
        s.happiness = Math.min(100, s.happiness + 10);
        s.pathFaith = Math.max(0, s.pathFaith - 5);
        return { log: `第${s.currentAge}岁，TA的话让你想了一整夜。你开始调整——不再拒绝每一块蛋糕，而是吃一小块；不再每天十一点准时睡觉，偶尔和TA看一部电影到午夜；你把"活得长"的目标改成了"活得好且长"。你发现偶尔的放纵没有毁掉你的健康计划，反而让你更快乐了。`, cost: 0 };
      } else {
        s.partner!.affection = Math.max(0, s.partner!.affection - 12);
        s.partner!.trust = Math.max(0, s.partner!.trust - 8);
        s.pathFaith = Math.min(100, s.pathFaith + 8);
        (s as any).biologicalAge -= 1;
        s.stress = Math.min(100, s.stress + 10);
        s.happiness = Math.max(0, s.happiness - 8);
        return { log: `第${s.currentAge}岁，你礼貌地拒绝了蛋糕，也拒绝了TA的提议。你说"等技术突破了我们可以一起补回来"。TA没说话，但那个晚上你们之间沉默了很久。你知道你选择了一条孤独的路——不是所有人都愿意为了不确定的未来牺牲确定的现在。但你相信，时间会证明你是对的。`, cost: 0 };
      }
    },
    logTemplate: '第{年龄}岁，你在"活得长"和"活得好"之间做了选择。',
  },

  // 卡6：中后期 - 参与临床试验
  {
    id: 'bio_clinical_trial',
    pathId: 'bio_gambler',
    title: '参与抗衰老药物临床试验',
    description: '你看到了一期临床试验招募——一种新的senolytic药物，在小鼠身上延长了25%寿命，现在进入人体安全性测试。参与者有机会在药物上市前五到十年用上它，但风险未知——你可能是第一批受益者，也可能是第一批遇到严重副作用的人。你读了二十页知情同意书，里面列了一整页可能的不良反应。你拿起笔，在最后一页签了名。',
    hint: '大赌注 · 花费¥0（有补贴）· 50%生物年龄-5+健康+10+信念+15；50%健康-15+信念-10',
    cost: -10000,
    category: '核心决策',
    ageRange: [30, 50],
    repeatable: false,
    prerequisites: (s) => s.retirementPath === 'bio_gambler' && s.health >= 60,
    effect: (s: GameState) => {
      ensureBioState(s);
      s.stress = Math.min(100, s.stress + 15);
      const success = Math.random() < 0.5;
      if (success) {
        (s as any).biologicalAge -= 5;
        s.health = Math.min(100, s.health + 10);
        s.pathFaith = Math.min(100, s.pathFaith + 15);
        s.happiness = Math.min(100, s.happiness + 10);
        return { log: `第${s.currentAge}岁，你成为了抗衰老新药的一期临床试验参与者。六个月的双盲试验结束后，你的生物年龄检测显示你比一年前"年轻"了5岁，各项指标全面改善。医生说这是他见过反应最好的受试者之一。你走出医院，阳光照在脸上，你想：也许我真的能活到那一天。`, cost: -10000 };
      } else {
        s.health = Math.max(0, s.health - 15);
        s.pathFaith = Math.max(0, s.pathFaith - 10);
        s.happiness = Math.max(0, s.happiness - 12);
        (s as any).biologicalAge += 2;
        return { log: `第${s.currentAge}岁，你参与了临床试验，但你被分到了安慰剂组——或者更糟，药物在你身上产生了副作用。你经历了两周的疲劳和轻度肝损伤，试验结束后医生让你回来复查。你有些失望，但不后悔。因为如果没有人愿意当"小白鼠"，医学就永远不会进步。只是这个小白鼠，这次轮到你当了。`, cost: -10000 };
      }
    },
    logTemplate: '第{年龄}岁，你赌上身体参与临床试验，做了一次人体小白鼠。',
  },
];

// ============================================================
// 合并导出
// ============================================================
export const PATH_CARDS: DecisionCard[] = [
  ...aiSymbioteCards,
  ...chainNativeCards,
  ...digitalNomadCards,
  ...superIpCards,
  ...silverEconomyCards,
  ...bioGamblerCards,
];
