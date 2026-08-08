import type { CrossroadEvent, GameState } from '../types/global.d.js';

/**
 * 子女状态同步：确保有孩子时伴侣/婚姻状态一致。
 * 当玩家选择生育/领养但当前无伴侣时，补建一位共同抚养的伴侣并置为已婚，
 * 避免"有孩子但未婚且无伴侣"的状态矛盾（黑箱测试报告 P2）。
 * 若已有伴侣但未婚，则置为已婚（共同生育即事实婚姻）。
 */
function ensureChildParentPartner(s: GameState): void {
  if (s.partner) {
    if (!s.isMarried && !s.partner.hasDivorced && s.partner.datingStage !== 'divorced' && s.partner.datingStage !== 'single') {
      s.isMarried = true;
      s.partner.datingStage = 'married';
      s.partner.marriedYear = s.currentAge;
    }
    return;
  }
  // 无伴侣：补建共同抚养的伴侣
  const gender = Math.random() > 0.5 ? '男' : '女';
  s.partner = {
    name: gender === '男' ? '阿哲' : '小满',
    age: s.currentAge - 2,
    affection: 70,
    trust: 65,
    marriedYear: s.currentAge,
    hasDivorced: false,
    personality: '温柔型',
    datingStage: 'married',
    meetYear: s.currentAge - 1,
    trait: '踏实顾家，把孩子看得比什么都重',
    memories: [{ age: s.currentAge, event: '一起迎接新生命', emoji: '👶' }],
    crushFrom: 'work',
  };
  s.isMarried = true;
}

// ========== 路径专属十字路口事件 ==========
// 每个退休路径3个重大人生岔路口，构成该路径的戏剧弧线
// 优先级8-10确保打断正常卡牌流，cooldown=999保证只触发一次
//
// 路径列表：
// 1. ai_symbiote   AI共生者
// 2. chain_native  链上原住民
// 3. digital_nomad 数字游牧民
// 4. super_ip      超级IP
// 5. silver_economy 银发守夜人
// 6. bio_gambler   生物赌徒
//
// 另附6个通用事件（优先级4-6，cooldown=8）

export const PATH_CROSSROADS: CrossroadEvent[] = [

  // ============================================================
  // 路径一：AI共生者 (ai_symbiote)
  // ============================================================

  // AI-1: 28岁 AI跃迁技能贬值
  {
    id: 'ai_skill_devaluation',
    title: '跃迁之殇',
    narrative: '{age}岁这年，AI模型完成了一次你没预料到的跃迁。\n你赖以吃饭的提示工程和模型调优技能，在新版本面前突然变得像十年前的五笔打字——不是没用，是不再值钱了。\n你看着招聘网站上"AI辅助开发"变成了"AI原生开发"，JD里熟悉的框架和工具链一夜之间全换了名字。\n公司新来的应届生用自然语言就能写出你熬三天才能调通的模块。主管看你的眼神开始变了，那种"你是不是已经被淘汰了"的眼神。\n深夜你坐在出租屋里，屏幕上是最新的模型论文，你第一次感到自己在和机器赛跑，而跑道正在你脚下消失。',
    ageRange: [24, 27],
    priority: 10,
    cooldown: 999,
    tag: 'ai_crisis_1',
    conditions: (s: GameState) => s.retirementPath === 'ai_symbiote' && !s.isAllInPath && !s.crossroadFired['ai_crisis_1'],
    options: [
      {
        id: 'ai1_dive_deeper',
        label: 'All in最新技术栈，每天学习16小时',
        description: '疯狂追赶技术前沿，牺牲健康和社交',
        hint: 'AI技能+15 · 月薪×1.3 · 压力+12 · 健康-8',
        hintColor: 'danger',
        effect: (s: GameState) => {
          s.health = Math.max(0, s.health - 8);
          s.stress = Math.min(100, s.stress + 12);
          s.happiness = Math.max(0, s.happiness - 5);
          s.pathFaith = Math.min(100, s.pathFaith + 5);
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.3);
          s.isUpskilled = true;
          if (s.pathSkills) s.pathSkills.aiSkill = Math.min(100, (s.pathSkills.aiSkill || 0) + 15);
          return { log: '你把自己锁在房间里，卸载了所有娱乐APP，每天只睡四五个小时。三个月后你重新掌握了新的技术栈，在公司内部做了一次技术分享，台下的应届生开始用你当年看大牛的眼神看你。但体检报告上多了几个箭头，你很久没和人面对面吃过饭了。你知道你赢了这一局，但你不确定自己还能赢几局。', cost: 0 };
        },
      },
      {
        id: 'ai1_pivot_product',
        label: '转向AI产品方向，不再拼纯技术',
        description: '从技术岗转产品/运营，利用行业认知变现',
        hint: '转型阵痛，但路更宽',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 10);
          s.pathFaith = Math.max(0, s.pathFaith - 5);
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 0.85);
          s.happiness = Math.min(100, s.happiness + 5);
          return { log: '你申请转岗到了AI产品团队。刚开始很不适应，没有代码可写，每天都是开会写文档。但你发现自己对用户需求的理解比纯产品经理深得多——因为你知道模型的边界在哪里。半年后你主导的第一个功能上线了，数据不错。你不再是那个和机器比速度的人，你开始学着指挥机器。', cost: 0 };
        },
      },
      {
        id: 'ai1_teach_others',
        label: '做AI教育，教别人用AI',
        description: '利用信息差做培训/知识付费，赚后知后觉者的钱',
        hint: '存款+5~10万 · 信念-8 · 压力+5',
        hintColor: 'negative',
        prerequisites: (s: GameState) => s.currentSavings >= 20000,
        disabledReason: '需要至少2万启动资金做课程和推广',
        effect: (s: GameState) => {
          s.pathFaith = Math.max(0, s.pathFaith - 8);
          s.hasSideHustle = true;
          s.currentSavings += 50000 + Math.floor(Math.random() * 50000);
          s.happiness = Math.max(0, s.happiness - 5);
          s.stress = Math.min(100, s.stress + 5);
          return { log: '你开了一门"AI实战课"，在各个平台上教人怎么用你已经觉得过时的工具。报名的人比你想象的多得多——大多数人甚至还没到你两年前的水平。钱赚到了，但每次上课你都觉得自己在贩卖焦虑。有学员问你"老师，学完这个会不会被淘汰"，你沉默了几秒说"会，所以你得一直学"。你没说的是，老师也在怕。', cost: 20000 };
        },
      },
      {
        id: 'ai1_accept_fate',
        label: '接受降薪，躺平做AI时代的"打字员"',
        description: '不追了，用AI辅助做基础工作，接受平庸',
        hint: '压力-20 · 健康+5 · 信念-6 · 月薪×0.7',
        hintColor: 'negative',
        effect: (s: GameState) => {
          s.pathFaith = Math.max(0, s.pathFaith - 6);
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 0.7);
          s.stress = Math.max(0, s.stress - 20);
          s.happiness = Math.min(100, s.happiness + 10);
          s.health = Math.min(100, s.health + 5);
          return { log: '你不再追新模型了。每天上班用AI完成分配的任务，到点下班，回家做饭看剧。工资降了一截，但你第一次发现晚上的时间可以这么长。同事们在讨论最新论文的时候你插不上话，但你也不焦虑了。你想，也许做一个AI时代的普通人也没那么可怕——虽然月底看到工资条的时候，心还是揪了一下。', cost: 0 };
        },
      },
    ],
  },

  // AI-2: 32岁 All in做产品
  {
    id: 'ai_all_in_product',
    title: '造物主的诱惑',
    narrative: '{age}岁，你站在一个产品方向的岔路口。\n你团队做的AI工具已经有了第一批用户，但你清楚——如果只是做一个"好用的小工具"，天花板很快就会到。你需要选择一个真正能规模化的方向。\n\n垂直领域的AI产品想法在你脑子里转了三个月。你知道现有方案的所有缺陷，你知道用户在抱怨什么，你甚至知道怎么用一半的成本做到两倍的效果。\n\n但要做出来，你需要做出一个重大决定：是继续做小而美的工具，还是赌一把做平台？是面向企业收大单，还是面向个人做订阅？是坚持独立做，还是接受大厂的战略投资？\n\n你算了一笔账：如果选对了方向并做成了，再过几年可能真的自由；如果选错了，你会浪费最宝贵的两年窗口期。\n身边有人支持你All in产品，也有人劝你"先活着再说"。你站在阳台抽烟到凌晨三点，烟盒空了，天快亮了。',
    ageRange: [34, 40],
    priority: 9,
    cooldown: 999,
    tag: 'ai_all_in',
    conditions: (s: GameState) => s.retirementPath === 'ai_symbiote' && s.isAllInPath && !s.crossroadFired['ai_all_in'],
    options: [
      {
        id: 'ai2_full_send',
        label: '辞职All in，卖房卖车凑启动资金',
        description: '全身心投入创业，赌上一切',
        hint: '信念+15 · 压力+20 · 健康-5 · 失业',
        hintColor: 'danger',
        prerequisites: (s: GameState) => s.currentSavings >= 80000,
        disabledReason: '至少需要8万积蓄才能支撑MVP开发',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 20);
          s.health = Math.max(0, s.health - 5);
          s.pathFaith = Math.min(100, s.pathFaith + 15);
          s.isUnemployed = true;
          s.preUnemployedSalary = s.currentMonthlySalary;
          s.currentMonthlySalary = 0;

          const roll = Math.random();
          if (roll < 0.20) {
            // 20% 大成 → 直接All In成功
            s.currentSavings += 500000 + Math.floor(Math.random() * 500000);
            s.happiness = Math.min(100, s.happiness + 25);
            s.passiveIncome += 8000;
            s.pathFaith = Math.min(100, s.pathFaith + 20);
            // 成功创业 = 正式All In，清除失业状态
            s.isAllInPath = true;
            s.isUnemployed = false;
            s.currentProfession = 'AI工作室创始人';
            s.hasCompany = true;
            s.currentMonthlySalary = Math.round((s.preUnemployedSalary || 10000) * 1.5);
            s.careerStartSalary = s.currentMonthlySalary;
            return { log: '你辞职了。前四个月每天只睡三小时，代码改了又改，第一版产品上线那天服务器崩了三次。但用户数据曲线像火箭一样往上冲。三个月后你拿到了TS，投资人说"这个赛道我们只投你"。你在会议室里强装镇定，出门后在电梯里一个人笑出了声。你终于不是在追浪的人了，你成了造浪的人。', cost: 80000 };
          } else if (roll < 0.50) {
            // 30% 小成 → 也算All In，但收入较低
            s.currentSavings += 50000;
            s.hasSideHustle = true;
            s.happiness = Math.max(0, s.happiness - 5);
            // 小成也正式All In，清除失业状态
            s.isAllInPath = true;
            s.isUnemployed = false;
            s.currentProfession = '自由职业';
            s.currentMonthlySalary = Math.round((s.preUnemployedSalary || 10000) * 0.8);
            s.careerStartSalary = s.currentMonthlySalary;
            return { log: '你做出了产品，有了一些用户，但增长曲线总是差一口气。投资人见了十几个，都说"再看看数据"。你把团队裁到只剩自己和一个合伙人，在共享办公里租了最小的工位。产品没死，但也没活。你开始怀疑自己是不是只适合做0到1，不适合做1到100。每个月看账面数字的时候，都像在看倒计时。', cost: 80000 };
          } else {
            // 50% 失败 → 保持失业，通过失业事件链恢复
            s.currentSavings = Math.max(0, s.currentSavings - 80000);
            s.happiness = Math.max(0, s.happiness - 20);
            s.pathFaith = Math.max(0, s.pathFaith - 12);
            s.health = Math.max(0, s.health - 5);
            return { log: '你做了半年，产品上线后用户留存不到5%。钱烧完了，合伙人走了，服务器下个月就停。你在最后一天导出了所有数据，一个人在空荡荡的办公室坐到天亮。投出去的简历石沉大海，HR问你"这一年空窗期在做什么"，你不知道怎么开口。你妈打电话问你最近怎么样，你说"还行"，挂了电话盯着天花板看了很久。', cost: 80000 };
          }
        },
      },
      {
        id: 'ai2_side_hustle',
        label: '不辞职，业余时间做MVP试水',
        description: '保留主业，用业余时间做产品，稳扎稳打',
        hint: '安全但速度慢，可能错过窗口',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 15);
          s.health = Math.max(0, s.health - 5);
          s.pathFaith = Math.min(100, s.pathFaith + 5);

          const roll = Math.random();
          if (roll < 0.30) {
            s.hasSideHustle = true;
            s.passiveIncome += 3000;
            s.happiness = Math.min(100, s.happiness + 10);
            return { log: '你白天上班，晚上写代码到凌晨，周末从不休息。八个月后你上线了一个极简版产品，出乎意料地有了一小批死忠用户。它没让你暴富，但每月带来几千块的被动收入。更重要的是，你证明了自己的想法不是空中楼阁。你还在犹豫要不要辞职All in，但至少你有筹码了。', cost: 10000 };
          } else {
            s.happiness = Math.max(0, s.happiness - 10);
            return { log: '你白天上班晚上写代码，坚持了三个月后发现根本做不完。主业的需求越来越多，产品进度像蜗牛爬。等你终于凑出一个能看的版本时，市场上已经有三个类似的产品了，而且都做得比你好。你关掉了代码仓库，有些遗憾但也松了口气。也许你只是需要一个更好的时机——你这样安慰自己。', cost: 10000 };
          }
        },
      },
      {
        id: 'ai2_join_bigco',
        label: '加入头部AI公司，借平台做大产品',
        description: '不自己创业，加入大公司内部创业',
        hint: '稳定但失去控制权',
        hintColor: 'positive',
        effect: (s: GameState) => {
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.5);
          s.stress = Math.min(100, s.stress + 5);
          s.pathFaith = Math.max(0, s.pathFaith - 5);
          s.happiness = Math.min(100, s.happiness + 5);
          return { log: '你加入了一家头部AI公司，带着你的想法进了内部孵化器。资源是充足的——算力、团队、流量都不用愁。但你的想法被改得面目全非，老板说要加这个功能，运营说要面向那个用户群。上线后数据还行，但你看着产品，觉得它既像你的孩子又不像。你拿到了大公司的薪资和股票，但那种"我创造了什么"的感觉，始终差了一点。', cost: 0 };
        },
      },
      {
        id: 'ai2_give_up',
        label: '放弃这个念头，继续打工攒钱',
        description: '承认自己不是创业的料，安心积累',
        hint: '最安全，但心里那团火可能灭了',
        hintColor: 'negative',
        effect: (s: GameState) => {
          s.pathFaith = Math.max(0, s.pathFaith - 10);
          s.stress = Math.max(0, s.stress - 10);
          s.happiness = Math.max(0, s.happiness - 5);
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.1);
          return { log: '你把那份写满想法的文档归档了，告诉自己"不是现在"。你继续上班、攒钱、学习，日子过得安稳。但每次看到AI圈又出了新的爆款产品，你都会停下来看很久。你知道自己曾经有一个类似的想法，也许更好，也许更差，但你永远不会知道了。那团火没灭透，但也没再烧起来。', cost: 0 };
        },
      },
    ],
  },

  // AI-3: 35岁 AI伦理困境
  {
    id: 'ai_ethics_dilemma',
    title: '对齐的代价',
    narrative: '{age}岁，你已经是AI领域的资深从业者了。\n公司接到一个大订单——某政府部门要用你团队开发的模型做社会信用评分系统，报酬是你们全年营收的三倍。\n你知道这个模型一旦部署，会被用来监控普通人的行为、预测"犯罪倾向"、自动生成信用评级。技术上完全可行，甚至可以说这是最能发挥模型能力的场景之一。\n团队里有人兴奋，有人沉默，有人私下找你说"老大，这个我们不能做"。老板的态度很明确：不做？有的是公司愿意做。你不接这个单子，竞争对手接，结果是一样的，只是钱不是你赚。\n合同摆在你桌上，笔在旁边。你想起当初入行时说过的"AI应该让人更自由"。窗外是灰蒙蒙的天。',
    ageRange: [38, 48],
    priority: 9,
    cooldown: 999,
    tag: 'ai_ethics',
    conditions: (s: GameState) => s.retirementPath === 'ai_symbiote' && s.isAllInPath && !s.crossroadFired['ai_ethics'],
    options: [
      {
        id: 'ai3_refuse',
        label: '拒绝合作，辞职走人',
        description: '坚守底线，离开公司',
        hint: '良心安宁，但代价巨大',
        hintColor: 'danger',
        effect: (s: GameState) => {
          s.isUnemployed = true;
          s.preUnemployedSalary = s.currentMonthlySalary;
          s.currentMonthlySalary = 0;
          s.pathFaith = Math.min(100, s.pathFaith + 20);
          s.happiness = Math.min(100, s.happiness + 10);
          s.stress = Math.min(100, s.stress + 10);
          s.currentSavings = Math.max(0, s.currentSavings - 30000);
          return { log: '你在会议上站起来说"这个项目我不做"。全场安静了三秒，老板的脸黑了。你当天就被HR请出了公司，没有N+1，因为你是"主动辞职"。走出写字楼的时候阳光很刺眼，你不知道下份工作在哪里，但你感到一种奇异的轻松。晚上你翻到大学时写的博客，标题是"技术应该向善"。你截了个图发了条动态圈，很多人点赞，但没人给你内推。', cost: 0 };
        },
      },
      {
        id: 'ai3_compromise',
        label: '接下项目，但在内部争取加入伦理约束',
        description: '不做极端对抗，在系统里嵌入安全阀',
        hint: '灰色地带，两边都不讨好',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.currentSavings += 100000;
          s.stress = Math.min(100, s.stress + 20);
          s.happiness = Math.max(0, s.happiness - 15);
          s.pathFaith = Math.max(0, s.pathFaith - 10);
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.3);
          return { log: '你接下了项目，但花了两周时间写了一份三十页的伦理评估报告，在模型里加了一层又一层的约束和人工审核机制。上线那天你盯着监控面板，看着系统运行——它确实在工作，但你知道那些约束随时可以被一行配置关掉。你拿到了奖金，升了职，但每次新闻里出现相关报道，你都会下意识地关掉。你安慰自己至少比让那些毫无顾忌的人来做要好，但这个"至少"越来越轻了。', cost: 0 };
        },
      },
      {
        id: 'ai3_full_compliance',
        label: '全力配合，把项目做到最好',
        description: '技术是中立的，做好自己的事就行',
        hint: '收益最大，但良心有债',
        hintColor: 'danger',
        effect: (s: GameState) => {
          s.currentSavings += 300000;
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.5);
          s.pathFaith = Math.max(0, s.pathFaith - 30);
          s.happiness = Math.max(0, s.happiness - 25);
          s.stress = Math.min(100, s.stress + 15);
          s.passiveIncome += 5000;
          return { log: '你告诉自己"技术只是工具"，全身心投入了项目。系统上线后效果"显著"，领导在表彰大会上点名表扬你，奖金是七位数。你买了更好的车，换了更大的房子。但你开始失眠，闭上眼就想起那些模型参数和权重——它们不是数字，它们在决定真实的人的命运。有一天你在网上看到一个人因为系统评分丢了工作，你关掉页面，给自己倒了一杯酒。那瓶酒之后还有很多瓶。', cost: 0 };
        },
      },
      {
        id: 'ai3_whistleblow',
        label: '匿名曝光，向媒体披露项目细节',
        description: '做吹哨人，让公众知道真相',
        hint: '正义但危险，可能影响整个行业生涯',
        hintColor: 'danger',
        effect: (s: GameState) => {
          s.pathFaith = Math.min(100, s.pathFaith + 25);
          s.happiness = Math.min(100, s.happiness + 5);

          const roll = Math.random();
          if (roll < 0.40) {
            s.currentSavings += 20000;
            s.stress = Math.min(100, s.stress + 10);
            return { log: '你整理了所有文档，匿名发给了调查记者。报道引起了轩然大波，项目被叫停审查，公众讨论铺天盖地。你没被发现，保住了工作，但公司内部开始严查泄密者，气氛压抑得让人喘不过气。你坐在工位上，看着同事们互相猜忌，不知道自己做对了还是做错了。但至少那个系统没有按原计划运行——这一点，你确定。', cost: 0 };
          } else {
            s.isUnemployed = true;
            s.preUnemployedSalary = s.currentMonthlySalary;
            s.currentMonthlySalary = 0;
            s.currentSavings = Math.max(0, s.currentSavings - 50000);
            s.stress = Math.min(100, s.stress + 30);
            s.happiness = Math.max(0, s.happiness - 20);
            return { log: '你匿名发了材料，但公司通过日志和访问记录查到了你。你被开除了，行业里悄悄传开了"这个人不能用"的消息。你投了几十份简历，要么石沉大海，要么面试时对方客气地说"我们再考虑考虑"。你做了正确的事，但正确的事代价很高。你开始怀疑，这个世界是不是不奖励说真话的人。', cost: 0 };
          }
        },
      },
    ],
  },

  // ============================================================
  // 路径二：链上原住民 (chain_native)
  // ============================================================

  // Chain-1: 27岁 交易所暴雷
  {
    id: 'chain_exchange_crash',
    title: '交易所的讣告',
    narrative: '{age}岁的某个深夜，你手机疯狂震动。\n你常用的那家交易所——那个你存了80%资产、每天都要刷十几次的平台——发了一条公告：暂停提币，等待进一步通知。\n电报群和推特瞬间炸了。有人截图显示交易所钱包里的资金在链上被大额转出，有人说创始人已经在机场了。你打开APP，页面还在加载，但数字已经定格了——那些你以为是"你的"币，现在只是一串数据库里的记录。\n你算了一下，里面有你这几年攒的工资、牛市赚的钱、还有上个月刚打进去准备抄底的子弹。手指发凉，你想起那句老话：Not your keys, not your coins。你以前觉得这是极端主义者的口号，现在你觉得这是你这辈子最贵的一堂课。\n天快亮了，群里还在刷消息，有人组织维权，有人已经开始写"我是怎么亏掉xxx万的"复盘帖。',
    ageRange: [24, 27],
    priority: 10,
    cooldown: 999,
    tag: 'chain_crash',
    conditions: (s: GameState) => s.retirementPath === 'chain_native' && !s.isAllInPath && !s.crossroadFired['chain_crash'],
    options: [
      {
        id: 'ch1_hold_rumor',
        label: '相信交易所会恢复，不提币不割肉',
        description: '等待事件平息，相信只是短期流动性问题',
        hint: '信仰坚定，但可能归零',
        hintColor: 'danger',
        effect: (s: GameState) => {
          const roll = Math.random();
          if (roll < 0.15) {
            s.pathFaith = Math.min(100, s.pathFaith + 15);
            s.happiness = Math.min(100, s.happiness + 15);
            s.currentSavings += 50000;
            return { log: '你没动。一周后交易所居然恢复了提币，虽然限额但至少能转出来。官方说是"技术性流动性危机"，你不知道真相是什么，但你的钱回来了。群里那些恐慌割肉的人骂骂咧咧，你默默把大部分资产转到了自己的硬件钱包。你还是相信这个行业，但你不再相信任何人替你管钱。', cost: 0 };
          } else {
            s.currentSavings = Math.round(s.currentSavings * 0.3);
            s.pathFaith = Math.max(0, s.pathFaith - 20);
            s.stress = Math.min(100, s.stress + 25);
            s.happiness = Math.max(0, s.happiness - 25);
            return { log: '你等了一周又一周，公告从"暂停提币"变成"重组方案"，再变成"进入破产清算"。你的资产在清算中排在最后，最终拿回来不到三成。群里的维权群变成了讨债群，又变成了死人群。你把APP删了，盯着那个几近归零的账户余额发呆。那些数字曾经是你的首付、你的底气、你提前退休的梦。现在它们变成了一个教训，写在链上，不可篡改。', cost: 0 };
          }
        },
      },
      {
        id: 'ch1_sell_discount',
        label: '在场外打折卖掉平台内的资产',
        description: '通过OTC折价套现，能拿回多少是多少',
        hint: '割肉求生，保住剩余资本',
        hintColor: 'negative',
        effect: (s: GameState) => {
          s.currentSavings = Math.round(s.currentSavings * 0.55);
          s.pathFaith = Math.max(0, s.pathFaith - 5);
          s.stress = Math.min(100, s.stress + 15);
          s.happiness = Math.max(0, s.happiness - 10);
          return { log: '你在Telegram上找了OTC贩子，以四五折的价格把平台里的币"卖"了出去——实际上是把账户权限转给了对方，对方在海外有关系能慢慢提出来。钱到账那天你亏了将近一半，但至少是真金白银。你在链上买了一个硬件钱包，把剩下的币提到了自己掌握私钥的地址。按确认键的那一刻，你第一次真正理解了"主权"这个词在加密世界里的重量。', cost: 0 };
        },
      },
      {
        id: 'ch1_legal_action',
        label: '组织/参与维权，联合其他受害者',
        description: '不接受损失，走法律途径追讨',
        hint: '耗时耗力，但有可能追回部分',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 20);
          s.currentSavings = Math.max(0, s.currentSavings - 15000);
          s.happiness = Math.max(0, s.happiness - 10);

          const roll = Math.random();
          if (roll < 0.25) {
            s.currentSavings += 80000;
            s.pathFaith = Math.min(100, s.pathFaith + 5);
            s.happiness = Math.min(100, s.happiness + 10);
            return { log: '你拉了一个两百人的维权群，请了律师，搜集了所有证据，定期去有关部门递交材料。大半年后案件有了进展，部分资产被冻结追回，你按比例拿回了大约六成。钱到账那天群里发了红包，但没人高兴得起来——这大半年的焦虑和时间成本，不是钱能衡量的。你把维权群退了，不想再回忆那些日子。', cost: 15000 };
          } else {
            s.pathFaith = Math.max(0, s.pathFaith - 15);
            s.happiness = Math.max(0, s.happiness - 15);
            return { log: '你投入了大量时间精力维权，请律师、做笔录、跟进案件。但跨国资产追索太难了，人跑了，钱分散了，程序走了一年又一年。群里的人越来越少，最后连律师都不太回消息了。你学会了一个词叫"法律风险"——在去中心化的世界里，法律有时候是最无力的东西。你把案卷材料装进一个文件夹，不再打开。', cost: 15000 };
          }
        },
      },
      {
        id: 'ch1_leave_crypto',
        label: '把剩下的钱全部提出来，离开币圈',
        description: '被伤透了心，认赔离场回归正常生活',
        hint: '彻底退出，睡个安稳觉',
        hintColor: 'negative',
        effect: (s: GameState) => {
          s.currentSavings = Math.round(s.currentSavings * 0.4);
          s.pathFaith = Math.max(0, s.pathFaith - 35);
          s.stress = Math.max(0, s.stress - 15);
          s.happiness = Math.max(0, s.happiness - 5);
          return { log: '你在场外把能卖的都卖了，把所有交易所APP都删了，取关了所有币圈博主。亏了六成，但你第一次睡了个整觉。你把钱存进了银行定期，开始定投指数基金。朋友问你还炒不炒币，你摇摇头说"不碰了"。有时候深夜你还是会看一眼比特币价格，心跳还是会漏一拍，但你知道自己不会再回去了。那个狂野的梦，醒了。', cost: 0 };
        },
      },
    ],
  },

  // Chain-2: 30岁 深熊要不要扛
  {
    id: 'chain_bear_market',
    title: '凛冬已至',
    narrative: '{age}岁，加密市场进入了第三个深熊年头。\n比特币从高点跌了80%，山寨币更是尸横遍野。你的持仓缩水到巅峰时的十分之一，如果按人民币计价，你这三年等于白干还倒贴。\n身边的人陆续走了。那个天天喊"比特币到20万"的大V开始卖课了，一起挖矿的朋友去开网约车了，你常去的线下Meetup从每月五十人变成了三个人凑一桌吃火锅。\n更要命的是现实压力——你不年轻了，同龄人开始买房结婚，你爸妈不知道你在搞什么但总觉得你"不务正业"。女朋友没明说但你知道她在等一个交代。\n链上一片死寂，但你的硬件钱包里还有币。你可以卖掉它们回归正常生活，也可以继续等待——但等多久？会不会永远等不到下一个牛市？你盯着K线图，那条向下的曲线像一把刀，悬在你所有的信念之上。',
    ageRange: [35, 42],
    priority: 9,
    cooldown: 999,
    tag: 'chain_bear',
    conditions: (s: GameState) => s.retirementPath === 'chain_native' && s.isAllInPath && !s.crossroadFired['chain_bear'],
    options: [
      {
        id: 'ch2_hold_diamond',
        label: '钻石手，持有到底，甚至加仓',
        description: '相信周期，越跌越买，等下一轮牛市',
        hint: '信仰最大化，风险也最大化',
        hintColor: 'danger',
        // 加仓以存款百分比计（与叙事事件 investPercent 口径一致），持仓归零后也能继续投入
        prerequisites: (s: GameState) => s.currentSavings >= 10000,
        disabledReason: '没有余粮加仓',
        effect: (s: GameState) => {
          // 加仓金额 = 存款的20%，按百分比随玩家存款体量缩放
          const invest = Math.round(s.currentSavings * 0.20);
          s.currentSavings = Math.max(0, s.currentSavings - invest);
          (s as any).chainHoldings = ((s as any).chainHoldings || 0) + invest; // 加仓的钱计入链上持仓
          s.stress = Math.min(100, s.stress + 15);
          s.pathFaith = Math.min(100, s.pathFaith + 20);
          s.happiness = Math.max(0, s.happiness - 10);
          s.health = Math.max(0, s.health - 5);

          const roll = Math.random();
          if (roll < 0.35) {
            s.currentSavings += 300000;
            s.passiveIncome += 5000;
            s.happiness = Math.min(100, s.happiness + 30);
            s.pathFaith = Math.min(100, s.pathFaith + 25);
            return { log: '你把能省的钱都省了，甚至打了一份零工赚子弹，在最黑暗的月份里持续定投。两年后市场回暖，那些你在底部攒的筹码翻了十几倍。你在牛市的顶点分批套现，钱到账的时候你手在抖——不是因为激动，是因为你想起那些深夜怀疑自己的时刻。你扛过来了。不是因为你比别人聪明，只是因为你比别人能扛。', cost: invest };
          } else {
            s.pathFaith = Math.max(0, s.pathFaith - 15);
            s.happiness = Math.max(0, s.happiness - 15);
            return { log: '你加仓了，但市场继续跌。你加仓的钱也被套了，生活变得拮据，你开始计算每一顿饭的花费。又过了两年，行业没有像你期待的那样复苏，反而出了更多监管和黑天鹅。你手里的币还在，但它们的购买力又跌了一半。你开始怀疑自己是不是在一个沉没成本的陷阱里越陷越深。信仰还在，但钱包瘪了。', cost: invest };
          }
        },
      },
      {
        id: 'ch2_partial_exit',
        label: '卖掉大部分仓位，保留一小部分观察',
        description: '拿回生活本钱，用利润继续玩',
        hint: '进可攻退可守',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.currentSavings = Math.round(s.currentSavings * 0.7);
          s.pathFaith = Math.max(0, s.pathFaith - 5);
          s.stress = Math.max(0, s.stress - 10);
          s.happiness = Math.min(100, s.happiness + 5);
          return { log: '你做了一个痛苦的决定：卖掉70%的仓位，把本金和部分利润提回了银行账户。剩下30%留在链上，就当是一张牛市彩票。钱到银行卡的那一刻你百感交集——那些币你拿了三年，卖的时候价格是买入时的三分之一。但至少你现在有了生活的底气，不用每天盯盘到凌晨。你还在圈内，但你不再被市场绑架了。', cost: 0 };
        },
      },
      {
        id: 'ch2_build_bear',
        label: '熊市建设，投身Web3项目赚币',
        description: '不炒币了，进Web3公司/DAO打工/build',
        hint: '赚现金流同时保持行业敏感度',
        hintColor: 'positive',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 5);
          s.pathFaith = Math.min(100, s.pathFaith + 10);
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.1);
          s.happiness = Math.min(100, s.happiness + 5);
          return { log: '你关掉了行情软件，加入了一个还在BUIDL的Web3团队。工资不高但发稳定币，团队里都是真正在做事的人。你在熊市里学了新技能，认识了真正的builder，也不再每天焦虑价格。两年后市场回暖，你发现自己不仅攒了一笔钱，还在行业里积累了真正的人脉和能力——这些东西，熊市长出来的，比牛市追高赚的钱更踏实。', cost: 0 };
        },
      },
      {
        id: 'ch2_full_exit',
        label: '全部清仓，彻底离开这个圈子',
        description: '不玩了，回归正常生活，找份稳定工作',
        hint: '放弃暴富梦，但获得内心平静',
        hintColor: 'negative',
        effect: (s: GameState) => {
          s.currentSavings = Math.round(s.currentSavings * 0.35);
          s.pathFaith = Math.max(0, s.pathFaith - 40);
          s.stress = Math.max(0, s.stress - 20);
          s.happiness = Math.min(100, s.happiness + 10);
          s.health = Math.min(100, s.health + 10);
          return { log: '你在一个清晨把所有币卖成了USDT，又全部换成了人民币，提到了银行卡。看着账户里那个不大不小的数字，你没有狂喜也没有大悲，只有一种长跑结束后的虚脱感。你找了一份普通的互联网工作，朝十晚七，周末不看盘。半年后你胖了五斤，睡眠好了，头发也不掉了。你偶尔还会听到比特币创新高的消息，但你只是笑笑，继续吃你的晚饭。', cost: 0 };
        },
      },
    ],
  },

  // Chain-3: 33岁 监管清退
  {
    id: 'chain_regulation_crackdown',
    title: '达摩克利斯之剑',
    narrative: '{age}岁，一纸文件下来，你所在的司法管辖区宣布全面清退加密货币业务。\n交易所关停、OTC被禁、矿场断电、社交媒体上的币圈大V集体失声。银行账户如果被监测到和加密平台有资金往来，可能被冻结甚至面临法律风险。\n你不是没想过这一天会来，但你以为还远。现在你的硬件钱包里有七位数的数字资产，但在你生活的这片土地上，它们正在变成"赃物"——持有不算违法，但变现通道正在一条条被堵死。\n有人在群里分享"肉身翻墙"的攻略，有人在研究去中心化交易所和跨链桥的新路径，有人说这只是暂时的严打很快会过去。\n你站在阳台上，手机里是刚收到的交易所清退通知，楼下是你住了五年的小区。走还是留？你的资产在链上，但你的生活在这里。',
    ageRange: [40, 50],
    priority: 9,
    cooldown: 999,
    tag: 'chain_regulation',
    conditions: (s: GameState) => s.retirementPath === 'chain_native' && s.isAllInPath && !s.crossroadFired['chain_regulation'],
    options: [
      {
        id: 'ch3_emigrate',
        label: '肉身翻墙，移民到对加密友好的国家',
        description: '去新加坡/迪拜/葡萄牙等地，继续做链上人',
        hint: '彻底解决合规问题，但代价极大',
        hintColor: 'danger',
        prerequisites: (s: GameState) => s.currentSavings >= 100000,
        disabledReason: '移民至少需要十万启动资金',
        effect: (s: GameState) => {
          s.currentSavings = Math.max(0, s.currentSavings - 100000);
          s.isGeoArbitrage = true;
          s.currentCity = '海外低成本';
          s.annualBaseCost = Math.round(s.annualBaseCost * 0.7);
          s.pathFaith = Math.min(100, s.pathFaith + 15);
          s.stress = Math.min(100, s.stress + 20);
          s.happiness = Math.max(0, s.happiness - 10);
          if (s.parents.isAlive) s.parents.relationShip = Math.max(0, s.parents.relationShip - 20);
          return { log: '你卖了国内能卖的一切，办了签证，拖着两个行李箱降落在了樟宜机场。前半年很难——语言、文化、身份认同，所有事情都要重新来。但当你第一次在合规交易所用法币买入比特币的那一刻，你觉得值了。你在新的城市找到了同类，他们来自世界各地，和你一样相信一个去中心化的未来。只是视频里父母越来越白的头发，让你有时候会怀疑自己是不是走得太远了。', cost: 100000 };
        },
      },
      {
        id: 'ch3_defi_dark',
        label: '转入DeFi地下通道，用去中心化方式继续',
        description: '不离开，用DEX、跨链桥、混币器等工具暗度陈仓',
        hint: '技术解决，但法律灰色地带',
        hintColor: 'danger',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 25);
          s.pathFaith = Math.min(100, s.pathFaith + 10);
          s.happiness = Math.max(0, s.happiness - 15);

          const roll = Math.random();
          if (roll < 0.60) {
            s.currentSavings += 30000;
            return { log: '你把资产全部提到了自己的钱包，学会了使用去中心化交易所、跨链桥和隐私工具。你不再用任何中心化服务，在DeFi的世界里自管自钥。这条路很野——你踩过一次rugpull的坑损失了20%，也用过混币器后紧张了好几天。但你活下来了，你的资产还在链上，没有人能冻结它们。你变成了真正的"链上原住民"，虽然这片土地不再承认你。', cost: 0 };
          } else {
            s.currentSavings = Math.max(0, s.currentSavings - 50000);
            s.health = Math.max(0, s.health - 10);
            return { log: '你在DeFi的世界里摸索，但一次操作签名错误导致你在一个钓鱼合约上丢失了一半资产。更糟的是，一笔大额跨链交易触发了银行风控，账户被冻结了三个月去配合调查。你请了律师，交了罚款，折腾了大半年才解冻。你变得多疑和紧张，每一笔交易都要检查十遍地址。去中心化给了你自由，但自由的代价是永恒的警惕。', cost: 0 };
          }
        },
      },
      {
        id: 'ch3_otc_selloff',
        label: '通过地下OTC慢慢变现，然后持币观望',
        description: '找信任的人在场外慢慢出金，落袋为安',
        hint: '灰色操作，变现困难但可行',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.currentSavings = Math.round(s.currentSavings * 0.6);
          s.pathFaith = Math.max(0, s.pathFaith - 15);
          s.stress = Math.min(100, s.stress + 15);
          s.happiness = Math.max(0, s.happiness - 5);
          return { log: '你通过几个信得过的老币圈朋友，用地下OTC的方式一点点把币换成了现金。价格比市场价低了15%，每次交易都像做贼，约在不同的咖啡馆，用现金转账。花了大半年才出完大部分仓位，银行卡里终于有了看得见的数字。你留了一小部分币在钱包里——不是为了暴富，是为了纪念。你不知道这个行业在这片土地上还有没有未来，但你知道自己尽力了。', cost: 0 };
        },
      },
      {
        id: 'ch3_comply_exit',
        label: '配合监管清退，在截止日前全部卖出',
        description: '按官方渠道清退，合法合规退出',
        hint: '最安全，但卖在低点',
        hintColor: 'negative',
        effect: (s: GameState) => {
          s.currentSavings = Math.round(s.currentSavings * 0.45);
          s.pathFaith = Math.max(0, s.pathFaith - 30);
          s.stress = Math.max(0, s.stress - 10);
          s.happiness = Math.max(0, s.happiness - 10);
          return { log: '你在清退截止日前把所有币通过官方指定渠道卖了出去——价格被砸到了地板上，因为所有人都在卖。你看着最终到账的金额，大约是高点时的两成不到。你注销了交易所账户，删掉了所有相关APP。你没被约谈，没被冻卡，安全落地了。但每次看到国际新闻里加密市场的消息，你的心还是会抽动一下。你选择了安全，但安全也有价格。', cost: 0 };
        },
      },
    ],
  },

  // ============================================================
  // 路径三：数字游牧民 (digital_nomad)
  // ============================================================

  // Nomad-1: 28岁 居住证收紧
  {
    id: 'nomad_visa_crackdown',
    title: '城市的门槛',
    narrative: '{age}岁，你正在大理的咖啡馆里写代码，手机弹出一条推送：你目前所在的旅居城市短租政策收紧了。\n不是一座城市的问题——多个热门旅居城市开始整顿短租市场，居住证审查变严，违规短租被查到将面临高额罚款甚至被清退。你常去的 co-working space 里有人被有关部门带走了，传言是房东举报的。\n你翻了翻身份证，上面的暂住登记办了一个又一个，但没有一座城市给你真正的归属感。你是"数字游民"——这是你博客上的自我介绍，但此刻你意识到，数字游民的另一个意思是：哪里都不是你的家。\n机票搜索页面开着，你可以去另一个还没收紧的城市继续游牧，也可以选择办一张需要花钱的"长期居住证"，或者——回来。\n咖啡馆外的暴雨倾盆而下，你桌上的冰咖啡已经不冰了。',
    ageRange: [25, 28],
    priority: 10,
    cooldown: 999,
    tag: 'nomad_visa',
    conditions: (s: GameState) => s.retirementPath === 'digital_nomad' && !s.isAllInPath && !s.crossroadFired['nomad_visa'],
    options: [
      {
        id: 'nm1_golden_visa',
        label: '花钱办长期居住证',
        description: '投资获得合法居留身份，解决根本问题',
        hint: '花钱买身份，一劳永逸',
        hintColor: 'danger',
        prerequisites: (s: GameState) => s.currentSavings >= 150000,
        disabledReason: '长期居住证至少需要15万资金证明和费用',
        effect: (s: GameState) => {
          s.currentSavings = Math.max(0, s.currentSavings - 80000);
          s.isGeoArbitrage = true;
          s.pathFaith = Math.min(100, s.pathFaith + 15);
          s.stress = Math.max(0, s.stress - 15);
          s.happiness = Math.min(100, s.happiness + 10);
          return { log: '你研究了三个月，选择了一个对数字游民友好的城市办了长期居住证。准备材料、开证明、办手续花了不少钱和时间，但当你拿到居住证的那一刻，你终于不再害怕敲门声了。你在那座城市租了一间小公寓，有了固定地址，可以收快递、办银行卡、甚至约家庭医生。自由不是没有门槛的——但你用钱给自己买了一块可以落脚的地方。', cost: 80000 };
        },
      },
      {
        id: 'nm1_keep_moving',
        label: '继续走，换个政策宽松的城市',
        description: '游击战术，哪里宽松去哪里',
        hint: '保持自由但永远在路上',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.currentSavings = Math.max(0, s.currentSavings - 20000);
          s.stress = Math.min(100, s.stress + 15);
          s.pathFaith = Math.min(100, s.pathFaith + 5);
          s.health = Math.max(0, s.health - 5);
          s.happiness = Math.max(0, s.happiness - 5);
          return { log: '你收拾行李去了另一个政策更宽松的城市，然后是下一个，再下一个。你学会了在高铁上写代码、在候车厅开视频会议、用不同城市的共享办公空间。你见识了更多的风景和文化，但行李箱的轮子换了两次，你已经记不清上次在一张床上连续睡超过一个月是什么时候了。自由的代价是永远的漂泊——有时候你觉得这是浪漫，有时候你觉得这是逃亡。', cost: 20000 };
        },
      },
      {
        id: 'nm1_return_home',
        label: '回来待一段时间，重新规划',
        description: '暂时回去，避避风头再出来',
        hint: '安全但可能被"稳定"吸回去',
        hintColor: 'negative',
        effect: (s: GameState) => {
          s.currentCity = '中坚大后方';
          s.isGeoArbitrage = false;
          s.annualBaseCost = Math.round(s.annualBaseCost * 1.4);
          s.pathFaith = Math.max(0, s.pathFaith - 15);
          s.stress = Math.max(0, s.stress - 5);
          s.happiness = Math.min(100, s.happiness + 5);
          if (s.parents.isAlive) s.parents.relationShip = Math.min(100, s.parents.relationShip + 15);

          const roll = Math.random();
          if (roll < 0.40) {
            s.pathFaith = Math.min(100, s.pathFaith + 10);
            return { log: '你回来了，住在父母家。熟悉的食物、熟悉的口音、不用每次买东西都重新适应物价，日子确实舒服。但三个月后你开始焦躁——地铁太挤、空气太差、加班文化让你窒息。你开始重新看机票，这次你做了更充分的准备。你知道游牧生活不容易，但你更知道自己已经过不惯朝九晚五的日子了。', cost: 0 };
          } else {
            s.pathFaith = Math.max(0, s.pathFaith - 15);
            s.stress = Math.min(100, s.stress + 10);
            return { log: '你回来了，朋友介绍了一份不错的工作，爸妈天天给你做吃的。你本来打算待三个月就走，但三个月变成了半年，半年变成了一年。你买了些家具，养了只猫，生活有了"根"的感觉。有时候你翻到以前在各地拍的照片，心里会有个声音说"你本来可以过另一种生活"。但你已经不确定那是不是你真正想要的了。', cost: 0 };
          }
        },
      },
      {
        id: 'nm1_remote_company',
        label: '入职一家支持远程的海外公司',
        description: '签正式合同/办工作居住证，获得合法身份',
        hint: '用工作换身份，失去部分自由',
        hintColor: 'positive',
        effect: (s: GameState) => {
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.2);
          s.stress = Math.min(100, s.stress + 10);
          s.pathFaith = Math.max(0, s.pathFaith - 5);
          s.isGeoArbitrage = true;
          s.happiness = Math.min(100, s.happiness + 5);
          return { log: '你面试了一家 fully remote 的海外公司，拿到了offer和工作居住证。你不再是一个"漂"在某座城市的游民了——你有合法的工作身份、纳税记录、社保账户。代价是你不能再随心所欲地选择居住地，团队有时区要求，你需要固定时间上线开会。你少了一些自由，但多了一份踏实。你把这当作游牧生活的2.0版本——不再流浪，而是选择一片草地扎营。', cost: 0 };
        },
      },
    ],
  },

  // Nomad-2: 31岁 伴侣想定居
  {
    id: 'nomad_partner_settle',
    title: '停留的理由',
    narrative: '{age}岁，你在丽江认识了TA。\n一开始只是旅途中的邂逅——你们在同一个骑行团，在同一个cafe办公，在同一片湖边看日落。但不知道从什么时候开始，你们的行程开始同步，机票买同一个目的地，短租平台订两居室而不是两个单间。\n现在TA说："我想停下来了。"\nTA不是游牧民，TA有积蓄，想在大理或者成都买个小房子，过有花园的生活。TA说："你也可以settle down啊，我们远程工作不影响赚钱，但我不想一辈子住酒店。"\n你理解TA——你自己也有过厌倦打包行李的时刻。但"定居"这两个字让你本能地想逃。你选择这条路就是为了不被任何地方拴住，而现在有一个你在乎的人，请求你为TA停留。\n晚餐桌上蜡烛在摇曳，TA在等你的回答。',
    ageRange: [35, 42],
    priority: 9,
    cooldown: 999,
    tag: 'nomad_settle',
    conditions: (s: GameState) => s.retirementPath === 'digital_nomad' && s.isAllInPath && !s.crossroadFired['nomad_settle'],
    options: [
      {
        id: 'nm2_settle_together',
        label: '为TA停留，一起找个地方定居',
        description: '在喜欢的城市买房/长租，结束游牧',
        hint: '爱情至上，但可能后悔',
        hintColor: 'positive',
        prerequisites: (s: GameState) => s.currentSavings >= 100000,
        disabledReason: '定居需要至少10万首付/启动资金',
        effect: (s: GameState) => {
          s.currentSavings = Math.max(0, s.currentSavings - 100000);
          s.isMarried = true;
          s.isGeoArbitrage = true;
          s.hasProperty = true;
          s.propertyValue = 200000;
          s.pathFaith = Math.max(0, s.pathFaith - 20);
          s.stress = Math.max(0, s.stress - 15);
          s.happiness = Math.min(100, s.happiness + 25);
          s.partner = {
            name: '旅途伴侣',
            age: s.currentAge - 2,
            affection: 80,
            trust: 75,
            marriedYear: s.currentAge,
            hasDivorced: false,
            personality: '浪漫型',
            datingStage: 'married',
            meetYear: s.currentAge - 1,
            trait: '喜欢骑行和烹饪',
            memories: [{ age: s.currentAge, event: '在丽江相遇', emoji: '🌊' }],
            crushFrom: 'travel',
          };
          return { log: '你们在成都老城区买了一间带小阳台的公寓。你第一次去宜家买家具，第一次有了自己的厨房，第一次在同一个地址收到了信件。早上你在阳台写代码，TA在厨房煮咖啡，阳光洒在地板上。你偶尔还会想起以前在路上的日子，看到游牧群里的朋友在新的城市打卡，心里会痒一下。但当TA从身后抱住你的时候，你知道有些东西比自由更重——或者说，那是另一种自由。', cost: 100000 };
        },
      },
      {
        id: 'nm2_compromise_base',
        label: '建立一个"基地"，但保留游牧自由',
        description: '在一个便宜的城市租/买小公寓作为base，依然定期出行',
        hint: '折中方案，有根也有翅膀',
        hintColor: 'neutral',
        prerequisites: (s: GameState) => s.currentSavings >= 50000,
        disabledReason: '需要5万建立基地',
        effect: (s: GameState) => {
          s.currentSavings = Math.max(0, s.currentSavings - 50000);
          s.isMarried = true;
          s.isGeoArbitrage = true;
          s.hasProperty = true;
          s.propertyValue = 80000;
          s.pathFaith = Math.min(100, s.pathFaith + 5);
          s.stress = Math.max(0, s.stress - 5);
          s.happiness = Math.min(100, s.happiness + 15);
          s.partner = {
            name: '旅途伴侣',
            age: s.currentAge - 2,
            affection: 75,
            trust: 70,
            marriedYear: s.currentAge,
            hasDivorced: false,
            personality: '独立型',
            datingStage: 'married',
            meetYear: s.currentAge - 1,
            trait: '热爱旅行但也需要归属',
            memories: [{ age: s.currentAge, event: '在丽江相遇', emoji: '🌊' }],
            crushFrom: 'travel',
          };
          return { log: '你们在大理租了一间带花园的小别墅作为base，签了长约，买了些植物和一只猫。每年你们依然会出行三四个月，但有一个地方永远等着你们回来。你学会了在"出发"和"回家"之间找平衡。朋友说你们是"半游牧"，你觉得挺好——你有了可以回去的地方，也保留了随时出发的勇气。', cost: 50000 };
        },
      },
      {
        id: 'nm2_convince_nomad',
        label: '说服TA继续和你一起游牧',
        description: '尝试让TA爱上在路上的生活',
        hint: '你觉得自由是可以分享的',
        hintColor: 'danger',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 10);
          s.pathFaith = Math.min(100, s.pathFaith + 10);

          const roll = Math.random();
          if (roll < 0.35) {
            s.isMarried = true;
            s.happiness = Math.min(100, s.happiness + 20);
            s.partner = {
              name: '旅途伴侣',
              age: s.currentAge - 2,
              affection: 85,
              trust: 80,
              marriedYear: s.currentAge,
              hasDivorced: false,
              personality: '冒险型' as any,
              datingStage: 'married',
              meetYear: s.currentAge - 1,
              trait: '被你带上路的游牧新人',
              memories: [{ age: s.currentAge, event: '在丽江相遇', emoji: '🌊' }],
              crushFrom: 'travel',
            };
            return { log: '你花了很多个夜晚和TA长谈，分享你在路上见过的极光、沙漠、雪山和那些改变了你世界观的人和事。你答应TA每到一个地方至少待两个月，不再走马观花。慢慢地，TA也开始享受这种生活了——在重庆学川剧，在成都学茶艺，在景德镇学陶艺。你们成了路上的伴侣，一起走，一起停，一起把远方当成家。', cost: 0 };
          } else {
            s.pathFaith = Math.max(0, s.pathFaith - 10);
            s.happiness = Math.max(0, s.happiness - 20);
            s.stress = Math.min(100, s.stress + 20);
            return { log: '你试图说服TA继续上路，但TA说"我已经漂了够久了"。你们大吵了一架，TA说你爱的不是自由是逃避。你一个人去了下一个城市，但这一次风景都变得索然无味。你在陌生的酒店房间里刷TA的动态圈，看到TA在你们一起去过的湖边发了一张照片，配文是"some people are just passing through"。你关上手机，第一次觉得路上的夜特别冷。', cost: 0 };
          }
        },
      },
      {
        id: 'nm2_let_go',
        label: '尊重TA的选择，但你继续走',
        description: '和平分手，各自走各自的路',
        hint: '自由的代价是孤独',
        hintColor: 'negative',
        effect: (s: GameState) => {
          s.pathFaith = Math.min(100, s.pathFaith + 10);
          s.happiness = Math.max(0, s.happiness - 20);
          s.stress = Math.min(100, s.stress + 10);
          s.health = Math.max(0, s.health - 5);
          return { log: '你们在丽江的古城里做了最后的告别。TA说"你是一只候鸟，不要为我折翼"，你说"对不起"。你们拥抱了很久，然后你拖着行李箱走向了相反的方向。飞机起飞的时候你哭了，旁边的老奶奶递给你一张纸巾。你继续飞，去了更多的城市，看了更多的风景，但有时候在某个陌生城市的清晨醒来，你会想：如果那天你说了"好，我们settle down"，现在会是什么样子？', cost: 0 };
        },
      },
    ],
  },

  // Nomad-3: 34岁 税务追讨
  {
    id: 'nomad_tax_pursuit',
    title: '万里追税',
    narrative: '{age}岁，你收到了一封来自户籍地税务局的邮件。\n不是诈骗——你的名字、身份证号、异地收入估算都写得清清楚楚。新出台的个税申报新规意味着，即使你长期在外地旅居，即使你的收入来自远程客户，你依然需要向户籍地申报并补缴税款，加上罚金和滞纳金，数字大得让你头晕。\n你以为离开那个系统就不再受它管辖，你以为数字游民的收入"隐于链上"就查不到。但大数据税务稽查早就把你的异地账户信息关联起来了——你在上海开的银行账户、你在成都收的租金、你在交易所里的交易记录，它们比你更"忠于"你的家乡。\n游牧群里炸了锅，有人说已经收到了类似的信件，有人在讨论要不要迁户籍，有人说"跑得了和尚跑不了庙"。你父母在老家，你不可能永远不回去。\n你点开那封邮件的附件，是一张限期补报通知书。',
    ageRange: [33, 36],
    priority: 9,
    cooldown: 999,
    tag: 'nomad_tax',
    conditions: (s: GameState) => s.retirementPath === 'digital_nomad' && s.isAllInPath && !s.crossroadFired['nomad_tax'],
    options: [
      {
        id: 'nm3_pay_up',
        label: '乖乖补税，合法合规',
        description: '请税务师协助申报，补缴税款和罚金',
        hint: '破财消灾，最安全',
        hintColor: 'negative',
        prerequisites: (s: GameState) => s.currentSavings >= 80000,
        disabledReason: '需要至少8万支付税款和罚金',
        effect: (s: GameState) => {
          s.currentSavings = Math.max(0, s.currentSavings - 80000);
          s.pathFaith = Math.max(0, s.pathFaith - 10);
          s.stress = Math.max(0, s.stress - 10);
          s.happiness = Math.max(0, s.happiness - 5);
          return { log: '你请了一个专门处理异地税务的会计师，花了两个月整理了所有异地收入记录，补缴了税款和滞纳金。钱出去的那一刻你心疼了很久，但你收到了税务局的结清证明——你终于可以光明正大地回家了，不用再担心被查。你明白了一件事：在这个世界上，只有死亡和税收是不可避免的，哪怕你跑到天涯海角。', cost: 80000 };
        },
      },
      {
        id: 'nm3_change_citizenship',
        label: '迁户籍，放弃原籍',
        description: '通过人才引进落户获得新户籍，一劳永逸',
        hint: '彻底解决税务问题，但与过去切割',
        hintColor: 'danger',
        prerequisites: (s: GameState) => s.currentSavings >= 300000,
        disabledReason: '人才引进落户至少需要30万资金',
        effect: (s: GameState) => {
          s.currentSavings = Math.max(0, s.currentSavings - 250000);
          s.isGeoArbitrage = true;
          s.pathFaith = Math.min(100, s.pathFaith + 10);
          s.stress = Math.min(100, s.stress + 15);
          s.happiness = Math.max(0, s.happiness - 10);
          if (s.parents.isAlive) s.parents.relationShip = Math.max(0, s.parents.relationShip - 25);
          return { log: '你卖了一些资产，通过海南自贸港的人才引进落户政策拿到了新户口本和税收优惠资格。落户那天，你拿着那本全新的户口本，心情复杂得像打翻了五味瓶。你不再受原籍地税务机关管辖了，但你也不再是老家的注册居民了。回老家探亲成了走亲戚，父母在视频里沉默了很久。你获得了税务上的优惠，但失去了某种更深层的东西——你成了真正的数字游民，而数字游民的代价是没有根。', cost: 250000 };
        },
      },
      {
        id: 'nm3_go_dark',
        label: '关掉所有实名账户，完全转入加密/现金经济',
        description: '用加密货币、现金、匿名工具生活，脱离系统',
        hint: '极端自由，极端风险',
        hintColor: 'danger',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 30);
          s.pathFaith = Math.min(100, s.pathFaith + 5);
          s.happiness = Math.max(0, s.happiness - 15);
          s.health = Math.max(0, s.health - 10);

          const roll = Math.random();
          if (roll < 0.50) {
            s.passiveIncome += 3000;
            return { log: '你关掉了所有实名银行账户，收入全部走加密货币，日常消费用匿名借记卡和现金。你学会了使用隐私币、混币器和去中心化金融，在系统的缝隙里生活。日子过得提心吊胆——每次大额消费都要绕三圈，每次跨境都要精心规划路线。但你成功地"消失"了，税务局的信件再也追不上你。只是你再也不能用自己的名字签合同、买房、坐飞机了。你是自由的，也是透明的——不对，是隐形的。', cost: 0 };
          } else {
            s.currentSavings = Math.max(0, s.currentSavings - 120000);
            s.happiness = Math.max(0, s.happiness - 25);
            s.stress = Math.min(100, s.stress + 20);
            return { log: '你试图转入地下经济，但操作远没有你想的那么简单。一次大额跨链转账被标记了，你的信息被上报给了税务机关。这次不仅要补税，还有逃税的罚款和可能的刑事追诉。你花了大价钱请税务律师谈判，最终缴了巨额罚款才免于起诉，但你已经上了重点监控名单。你输了——在国家机器面前，个人的小伎俩太脆弱了。', cost: 0 };
          }
        },
      },
      {
        id: 'nm3_return_negotiate',
        label: '回来和税务局协商，主动投案',
        description: '主动回来配合调查，争取宽大处理',
        hint: '面对问题，争取最好结果',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.currentCity = '中坚大后方';
          s.isGeoArbitrage = false;
          s.annualBaseCost = Math.round(s.annualBaseCost * 1.4);
          s.currentSavings = Math.max(0, s.currentSavings - 50000);
          s.pathFaith = Math.max(0, s.pathFaith - 20);
          s.stress = Math.min(100, s.stress + 20);

          const roll = Math.random();
          if (roll < 0.60) {
            s.stress = Math.max(0, s.stress - 10);
            s.happiness = Math.max(0, s.happiness - 5);
            if (s.parents.isAlive) s.parents.relationShip = Math.min(100, s.parents.relationShip + 10);
            return { log: '你买了回来的机票，带着所有材料主动去了税务局。因为是首次申报且态度良好，税务人员给了你比较宽松的补税方案，罚金减了大半。你在老家待了三个月处理这些事，住在父母家。爸妈没说什么但每天给你做你爱吃的菜。处理完后你又可以出行了，但你决定先在老家待一段时间。也许世界再大，你还是需要一个可以安心回去的地方。', cost: 50000 };
          } else {
            s.happiness = Math.max(0, s.happiness - 20);
            s.pathFaith = Math.max(0, s.pathFaith - 25);
            return { log: '你主动回来配合调查，但流程比你想象的复杂得多。补税加罚金比你预估的多了一倍，而且你的身份证被限制出行六个月。你被困在老家，住在父母家，每天去税务局和银行跑腿。你看着窗外的灰色天空，想起在洱海边骑行的日子，像上辈子的事。你不确定自己还能不能出去了，或者说，还想不想出去了。', cost: 50000 };
          }
        },
      },
    ],
  },

  // ============================================================
  // 路径四：超级IP (super_ip)
  // ============================================================

  // IP-1: 28岁 第一次舆论危机
  {
    id: 'ip_first_crisis',
    title: '风暴初临',
    narrative: '{age}岁，你第一次尝到了"红"的代价。\n你发了一条随口吐槽的社交平台/视频——可能是对某个热点事件的评论，可能是对某个品牌的评价，可能只是一个不太恰当的比喻。一觉醒来，评论区炸了。\n截图被转发了几万次，断章取义的版本开始流传。有人扒出了你三年前的动态圈，有人翻出了你还没出名时的贴吧发言。#某某某道歉#的话题冲上了热搜，品牌方开始私信问你"怎么回事"，经纪人（如果有的话）电话被打爆了。\n你坐在电脑前手心出汗，第一次意识到：你说的每一句话不再只是"你说的话"，它们是弹药，是呈堂证供，是可以被无限放大和解读的公共文本。\n手机还在不停震动，你有三个选择：道歉、硬刚、装死。每个选择都有代价。',
    ageRange: [27, 30],
    priority: 10,
    cooldown: 999,
    tag: 'ip_crisis_1',
    conditions: (s: GameState) => s.retirementPath === 'super_ip' && !s.isAllInPath && !s.crossroadFired['ip_crisis_1'],
    options: [
      {
        id: 'ip1_apologize',
        label: '迅速道歉，诚恳认错',
        description: '第一时间发道歉声明，承认考虑不周',
        hint: '止损最快，但显得软弱',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 10);
          s.pathFaith = Math.max(0, s.pathFaith - 5);
          s.happiness = Math.max(0, s.happiness - 10);
          s.currentSavings = Math.max(0, s.currentSavings - 20000);
          return { log: '你在两小时内发了一条长文道歉，态度诚恳、措辞克制、不辩解不甩锅。热搜在挂了一天后慢慢降了下去，品牌方表示"理解年轻人的失误"。但你的评论区里开始有人叫你"道歉博主"，说你"没有骨气"。你学会了在公众面前说话的第一条规则：永远不要以为自己只是在"随便聊聊"。你的声音不再属于你自己。', cost: 20000 };
        },
      },
      {
        id: 'ip1_fight_back',
        label: '硬刚回去，据理力争',
        description: '不道歉，发长文/视频反驳，指出被断章取义',
        hint: '可能吸粉也可能招黑，赌一把',
        hintColor: 'danger',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 20);
          s.pathFaith = Math.min(100, s.pathFaith + 5);

          const roll = Math.random();
          if (roll < 0.40) {
            s.passiveIncome += 2000;
            s.happiness = Math.min(100, s.happiness + 10);
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.2);
            return { log: '你发了一条二十分钟的视频，逐帧分析自己的话是怎么被曲解的，有理有据不卑不亢。视频播放量破了千万，路人倒向你这边，觉得你被网暴了。"真性情"的人设反而让你涨了一波粉，品牌方觉得你有态度。但你也第一次见识了网络暴力的可怕——你的家人被人肉，私信里全是诅咒。你赢了这一仗，但伤疤在那里。', cost: 0 };
          } else {
            s.currentSavings = Math.max(0, s.currentSavings - 80000);
            s.happiness = Math.max(0, s.happiness - 25);
            s.pathFaith = Math.max(0, s.pathFaith - 15);
            s.stress = Math.min(100, s.stress + 15);
            return { log: '你硬刚了，但舆论不买账。你的反驳被认为是"狡辩"，更多黑料被挖出来，热搜从一个变成了三个。两个品牌方直接解约，一个正在谈的合作告吹。评论区变成了大型翻车现场。你一个星期没敢打开社交软件，掉了十万粉。你这才明白：在互联网上，真相不重要，情绪才重要。你以为你在讲道理，但观众看的是戏。', cost: 0 };
          }
        },
      },
      {
        id: 'ip1_silent',
        label: '沉默是金，冷处理等风头过去',
        description: '不回应，停更一周，让时间冲淡一切',
        hint: '安全但可能被解读为心虚',
        hintColor: 'negative',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 15);
          s.happiness = Math.max(0, s.happiness - 15);
          s.pathFaith = Math.max(0, s.pathFaith - 10);
          return { log: '你关掉了手机，去了一个没有信号的地方待了一周。等你回来的时候，热搜已经换了新的话题，大部分人已经忘了这件事。但也有人说你"缩头乌龟""心虚了"，掉了一些粉，失去了一个合作机会。你发现互联网的记忆确实短暂，但不是没有代价——你的沉默被一些人当作了默认。你学到了：不回应本身也是一种回应。', cost: 0 };
        },
      },
      {
        id: 'ip1_legal',
        label: '发律师函，起诉造谣者',
        description: '用法律武器维护自己的名誉',
        hint: '强硬但成本高',
        hintColor: 'danger',
        prerequisites: (s: GameState) => s.currentSavings >= 30000,
        disabledReason: '请律师和打官司至少需要3万',
        effect: (s: GameState) => {
          s.currentSavings = Math.max(0, s.currentSavings - 30000);
          s.stress = Math.min(100, s.stress + 20);
          s.pathFaith = Math.min(100, s.pathFaith + 10);

          const roll = Math.random();
          if (roll < 0.50) {
            s.happiness = Math.min(100, s.happiness + 10);
            s.passiveIncome += 3000;
            return { log: '你请了律师，对几个带头造谣和人肉的账号发了律师函，还起诉了两个情节最严重的。官司打了半年，你赢了，对方公开道歉并赔偿。虽然赔偿款还不够律师费，但这一仗打出了你的态度——你不是可以随便捏的软柿子。之后黑你的人确实收敛了很多。但你也意识到，当一个人红到需要用律师函来保护自己的时候，有些东西已经永远改变了。', cost: 30000 };
          } else {
            s.happiness = Math.max(0, s.happiness - 20);
            s.pathFaith = Math.max(0, s.pathFaith - 10);
            return { log: '你发了律师函，但起诉过程比你想象的漫长和痛苦。对方请了律师反诉你"滥用诉权打压言论自由"，官司变成了拉锯战。你的律师函反而给对方带去了流量，一个被你起诉的小号靠骂你涨了五万粉。一年后官司和解了，没有赢家。你花了钱和精力，只得到了一个删帖的结果。法律是最后的武器，但法律不一定是最好的武器。', cost: 30000 };
          }
        },
      },
    ],
  },

  // IP-2: 31岁 要不要接争议广告
  {
    id: 'ip_controversial_ad',
    title: '金币的温度',
    narrative: '{age}岁，一个金融APP（或P2P/医美/保健品/游戏——你最讨厌的那类产品）找到了你的商务。\n代言费是你目前所有收入来源加起来的三倍，够你在二线城市付个首付。\n但你知道这个产品有问题——利息高得离谱、用户投诉一大堆、坊间传闻它在割韭菜。你的粉丝很多是因为信任你才关注你的，他们中不少是学生和刚入社会的年轻人。如果接了这个广告，他们可能因为信任你而去使用一个会伤害他们的产品。\n商务说"成年人要有自己的判断力，你只是打个广告"；朋友说"你不接别人也会接，钱让别人赚不如让你赚"；你的良心说"你知道那是错的"；你的银行卡余额说"你确定要拒绝七位数吗"。\n合同在邮箱里躺着，三天后是最后期限。',
    ageRange: [30, 33],
    priority: 9,
    cooldown: 999,
    tag: 'ip_ad_dilemma',
    conditions: (s: GameState) => s.retirementPath === 'super_ip' && s.isAllInPath && !s.crossroadFired['ip_ad_dilemma'],
    options: [
      {
        id: 'ip2_refuse',
        label: '拒绝，不赚违背良心的钱',
        description: '婉拒合作，保持人设一致性',
        hint: '守住底线，可能错过最大的一笔钱',
        hintColor: 'positive',
        effect: (s: GameState) => {
          s.pathFaith = Math.min(100, s.pathFaith + 20);
          s.happiness = Math.min(100, s.happiness + 15);
          s.stress = Math.max(0, s.stress - 5);
          return { log: '你回了邮件说"抱歉，这个产品我不接"。商务在电话里急了，说你是不是傻。你挂了电话，看着银行卡余额，心里空了一下——七位数，够你做好多事。但三个月后那个产品暴雷了，上了315晚会，几个接了广告的博主被骂上热搜，评论区里有人说"幸亏XX没接"。你截了个图发给自己，这是你今年收到的最好的"报酬"。穷是穷了点，但你晚上睡得着觉。', cost: 0 };
        },
      },
      {
        id: 'ip2_accept_careful',
        label: '接，但要求严格审核和风险提示',
        description: '接广告但在内容中加入充分的风险提示',
        hint: '折中方案，两边都不彻底',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.currentSavings += 150000;
          s.pathFaith = Math.max(0, s.pathFaith - 10);
          s.stress = Math.min(100, s.stress + 15);
          s.happiness = Math.max(0, s.happiness - 10);
          return { log: '你接了广告，但在脚本里加了明确的风险提示，在视频开头和结尾都强调"投资有风险"、"请根据自身情况判断"。视频发出去了，钱到账了，但评论区有人夸你"实在"，也有人骂你"又当又立"。你觉得自己已经尽力了，但那个"尽力"的感觉很微妙——你还是把粉丝引向了那个产品，不管你加了多少免责声明。钱在卡里，但每次看到它你都想起那些可能被影响的年轻人。', cost: 0 };
        },
      },
      {
        id: 'ip2_accept_full',
        label: '接，按品牌方要求全力配合',
        description: '商业合作就按商业规则来，不纠结',
        hint: '赚到大钱，但消耗信任',
        hintColor: 'danger',
        effect: (s: GameState) => {
          s.currentSavings += 300000;
          s.pathFaith = Math.max(0, s.pathFaith - 25);
          s.happiness = Math.max(0, s.happiness - 20);
          s.stress = Math.min(100, s.stress + 10);
          s.passiveIncome += 5000;

          const roll = Math.random();
          if (roll < 0.30) {
            return { log: '你按脚本拍了广告，满脸真诚地推荐了那个产品。钱到账那天你去付了首付，搬进了新家。产品一直没出什么大事——或者说出了事但没闹大。你的粉丝没有大面积流失，商务合作反而越来越多，因为品牌方觉得你"配合度高"。但你知道自己在粉丝心里的那个位置，已经悄悄挪了一点点。夜深人静的时候你会想：如果有一天它暴雷了呢？', cost: 0 };
          } else {
            s.happiness = Math.max(0, s.happiness - 20);
            s.pathFaith = Math.max(0, s.pathFaith - 20);
            s.currentSavings = Math.max(0, s.currentSavings - 50000);
            return { log: '你接了广告，按品牌方要求全力推销。半年后那个产品暴雷了，无数用户因为信任你投了钱结果血本无归。你的评论区变成了大型屠版现场，#某某某还我血汗钱#上了热搜。你掉了几十万粉，被全网骂"骗子"，多个品牌方和你解约。你把广告费退了也没用——有些信任一旦碎了，多少钱都粘不回去。你坐在空荡荡的新房子里，看着银行卡里的钱，第一次觉得钱是烫的。', cost: 0 };
          }
        },
      },
      {
        id: 'ip2_expose',
        label: '不接，反手做一期曝光视频',
        description: '把这个产品的问题做成内容，反向涨粉',
        hint: '得罪金主爸爸，但可能赢得口碑',
        hintColor: 'danger',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 15);
          s.pathFaith = Math.min(100, s.pathFaith + 15);

          const roll = Math.random();
          if (roll < 0.55) {
            s.passiveIncome += 4000;
            s.happiness = Math.min(100, s.happiness + 15);
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.3);
            return { log: '你不仅拒绝了广告，还花了两周时间深度调查，做了一期曝光视频。视频爆了，播放量破纪录，评论区全是"三观正""这才是我关注的博主"。你涨了一大波粉，好几个价值观正的品牌主动来找你合作。你赚了一笔七位数的广告费——只是这次，广告主是那些你真正认可的品牌。你证明了一件事：良心和赚钱不总是矛盾的。但你也上了某些品牌的黑名单，有些钱你永远赚不到了。', cost: 0 };
          } else {
            s.happiness = Math.max(0, s.happiness - 15);
            s.stress = Math.min(100, s.stress + 20);
            s.currentSavings = Math.max(0, s.currentSavings - 20000);
            return { log: '你做了曝光视频，但品牌方的法务团队不是吃素的。他们发了律师函告你诽谤，平台收到投诉后给你限流了一周。视频虽然传播了，但你被几个大经纪公司联合"软封杀"，一段时间内商业合作骤减。你做了正确的事，但正确的事在商业世界里不总是被奖励。你安慰自己"问心无愧"，但房租还是要交的。', cost: 0 };
          }
        },
      },
    ],
  },

  // IP-3: 34岁 被翻旧账Cancel
  {
    id: 'ip_cancel_culture',
    title: '社死时刻',
    narrative: '{age}岁，你已经是一个有影响力的大IP了。但你没想到，最致命的一刀来自你青涩的大学时代。\n有人扒出了你大学时期在社交媒体上的发言——那时候你还不是公众人物，你说过一些现在看来政治不正确的话、开过一些不合时宜的玩笑、表达过一些已经改变的观点。这些言论被截图、拼凑、加上"细思极恐"的解读，一夜之间传遍了全网。\n#某某某塌房#冲上热搜第一。这一次比第一次危机严重得多——因为你"人设崩塌"了，那个"三观正""独立思考"的公众形象和当年那个口无遮拦的年轻人形成了"反差"。曾经捧你的人开始踩你，"脱粉回踩"比单纯的黑粉更伤人。合作方纷纷解约，平台开始限流，你的名字后面被加上了"（已塌房）"。\n你盯着那些截图，有些你已经完全不记得自己说过，有些被断章取义了，但也有一些——你不得不承认——放在今天的语境下确实不妥。你想说"那时候我才二十出头"，但你知道互联网不接受成长叙事。\n窗外的天黑了，你的手机在静音，但你能想象它在怎么震动。',
    ageRange: [38, 45],
    priority: 9,
    cooldown: 999,
    tag: 'ip_cancel',
    conditions: (s: GameState) => s.retirementPath === 'super_ip' && s.isAllInPath && !s.crossroadFired['ip_cancel'],
    options: [
      {
        id: 'ip3_full_apology',
        label: '彻底道歉，承认过去的错误，接受一切后果',
        description: '不辩解、不甩锅、不装死，诚恳面对',
        hint: '失去一切但可能保住重新开始的机会',
        hintColor: 'danger',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 25);
          s.pathFaith = Math.max(0, s.pathFaith - 20);
          s.happiness = Math.max(0, s.happiness - 30);
          s.currentSavings = Math.max(0, s.currentSavings - 100000);
          s.passiveIncome = Math.max(0, s.passiveIncome - 5000);
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 0.5);

          const roll = Math.random();
          if (roll < 0.30) {
            s.happiness = Math.min(100, s.happiness + 15);
            s.pathFaith = Math.min(100, s.pathFaith + 10);
            return { log: '你发了一封长长的道歉信，不为自己辩解，承认年轻时的无知和错误，宣布无限期停更反思。你赔了几个品牌的违约金，退网了半年。等你再回来的时候，粉丝只剩三成，但留下来的是真正愿意给你第二次机会的人。你不再是那个"完美"的博主，但你是一个真实的人。你的内容比以前更有深度了——因为你从深渊里看过一眼，知道了从高处坠落是什么感觉。', cost: 100000 };
          } else {
            s.pathFaith = Math.max(0, s.pathFaith - 15);
            s.health = Math.max(0, s.health - 10);
            return { log: '你道歉了，但舆论不接受。"现在才道歉？早干嘛去了？""鳄鱼的眼泪。""如果没被扒出来你会道歉吗？"你的道歉被解读为"危机公关"，解约和掉粉仍在继续。你停更了三个月，尝试发新内容但评论区全是"滚"。你第一次理解了什么叫"社会性死亡"——不是死亡，是你还活着，但世界已经当你不存在了。', cost: 100000 };
          }
        },
      },
      {
        id: 'ip3_contextualize',
        label: '不道歉，解释时代背景和语境',
        description: '承认言论不当但指出被断章取义，还原上下文',
        hint: '据理力争，可能被认为是狡辩',
        hintColor: 'danger',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 30);
          s.pathFaith = Math.max(0, s.pathFaith - 10);

          const roll = Math.random();
          if (roll < 0.25) {
            s.happiness = Math.max(0, s.happiness - 10);
            s.pathFaith = Math.min(100, s.pathFaith + 10);
            return { log: '你做了一期长视频，把每条"黑料"都放回到当时的完整语境中，展示了被截掉的前后文，解释了十年前的网络环境和今天的不同。一些理性的人开始理解，但更多人说你"洗"。事件最终没有完全平息，但慢慢地，有独立思考能力的人开始为你说话。你没有塌房，但你身上永远有了这个"黑点"——互联网不会忘，但互联网也会累。', cost: 0 };
          } else {
            s.currentSavings = Math.max(0, s.currentSavings - 80000);
            s.happiness = Math.max(0, s.happiness - 35);
            s.pathFaith = Math.max(0, s.pathFaith - 25);
            s.passiveIncome = Math.max(0, s.passiveIncome - 3000);
            s.health = Math.max(0, s.health - 15);
            return { log: '你试图解释，但每一句解释都引来更多的愤怒。"都这个时候了还在狡辩？""你就不能像个成年人一样道歉吗？"你的解释被剪成新的"罪证"，二次传播。品牌方全部跑路，平台把你从推荐列表中移除。你像一只困在笼子里的动物，每一次挣扎都让笼子收得更紧。你终于明白了：在Cancel Culture面前，辩护权是奢侈品。', cost: 0 };
          }
        },
      },
      {
        id: 'ip3_disappear_reinvent',
        label: '注销账号，隐退一段时间再换个身份重来',
        description: '彻底离开公众视野，以后用新身份重新开始',
        hint: '放弃现有一切，但留一条命',
        hintColor: 'negative',
        effect: (s: GameState) => {
          s.pathFaith = Math.max(0, s.pathFaith - 15);
          s.happiness = Math.max(0, s.happiness - 20);
          s.stress = Math.max(0, s.stress - 10);
          s.passiveIncome = Math.max(0, s.passiveIncome - 8000);
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 0.3);
          return { log: '你没有回应。在一个凌晨，你注销了所有社交账号，删掉了APP，从互联网上消失了。最开始的日子很难熬——你习惯了被关注，突然的安静让你耳鸣。但三个月后你发现天没有塌，你还活着，你在便利店买东西没人认出你。一年后你开始用新ID发一些完全不同的内容，从零开始。你不再是那个大IP了，但你找回了某种自由——那种在成名之前，你曾经拥有过的，说话不用想三遍的自由。', cost: 0 };
        },
      },
      {
        id: 'ip3_ride_out',
        label: '什么都不做，等下一个热点覆盖',
        description: '不回应不道歉不解释，硬扛过去',
        hint: '互联网没有记忆，但可能有烙印',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 20);
          s.happiness = Math.max(0, s.happiness - 15);
          s.pathFaith = Math.max(0, s.pathFaith - 10);

          const roll = Math.random();
          if (roll < 0.40) {
            s.stress = Math.max(0, s.stress - 10);
            return { log: '你什么都没做。热搜挂了五天，然后被一个更大的娱乐新闻盖过去了。一个月后大部分人已经忘了这件事，你的账号慢慢恢复了更新。但你知道有什么东西变了——评论区里永远有几个ID在刷旧截图，有些合作方对你的态度变得微妙。你活下来了，但你背上永远有一个印记。你学会了一件事：在互联网上，你可以被原谅，但你不会被遗忘。', cost: 0 };
          } else {
            s.happiness = Math.max(0, s.happiness - 30);
            s.passiveIncome = Math.max(0, s.passiveIncome - 5000);
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 0.4);
            s.pathFaith = Math.max(0, s.pathFaith - 20);
            s.health = Math.max(0, s.health - 10);
            return { log: '你以为沉默会让事情过去，但这一次没有。你的沉默被解读为"傲慢"和"不认错"，舆情持续发酵，更多的"黑料"被挖出来——有些是真的，有些是编的，但没人在乎真假。品牌方不仅解约还开始索赔，平台给了你永久限流。你看着粉丝数每天掉五位数，像看着自己在流血。互联网确实没有记忆——但在忘记你之前，它会先杀死你。', cost: 0 };
          }
        },
      },
    ],
  },

  // ============================================================
  // 路径五：银发守夜人 (silver_economy)
  // ============================================================

  // Silver-1: 30岁 巨头下场
  {
    id: 'silver_giants_entry',
    title: '鲨鱼入水',
    narrative: '{age}岁，你在银发产业里深耕了几年，刚摸到了一点门道，巨头来了。\n不是小打小闹——是那些你在新闻里才看到的互联网大厂、保险巨头、地产上市公司。他们带着百亿资金、政府关系、流量入口和地推铁军，高调宣布"All in银发经济"。\n你做的社区养老驿站旁边，下个月要开一家央企背景的养老服务中心，补贴后价格是你的三分之一。你服务了两年的老客户被各种免费体检、免费鸡蛋拉去参加"推介会"。你维护了很久的社区关系，在巨头的银弹攻势下不堪一击。\n更可怕的是他们的数据能力——他们有老人的健康档案、消费记录、子女信息。你有的只是一腔热情和几张熟面孔。\n你站在自己的小店里，看着对面正在装修的"银发综合体"，觉得自己像一条小鱼，看着鲨鱼游进了自己的池塘。',
    ageRange: [27, 30],
    priority: 10,
    cooldown: 999,
    tag: 'silver_giants',
    conditions: (s: GameState) => s.retirementPath === 'silver_economy' && !s.isAllInPath && !s.crossroadFired['silver_giants'],
    options: [
      {
        id: 'sv1_compete_niche',
        label: '深耕细分领域，做巨头做不了的重服务',
        description: '转向高端定制/临终关怀/失智照护等重服务领域',
        hint: '避开正面竞争，做深做透',
        hintColor: 'positive',
        prerequisites: (s: GameState) => s.currentSavings >= 30000,
        disabledReason: '转型需要至少3万资金',
        effect: (s: GameState) => {
          s.currentSavings = Math.max(0, s.currentSavings - 30000);
          s.stress = Math.min(100, s.stress + 15);
          s.pathFaith = Math.min(100, s.pathFaith + 10);
          s.happiness = Math.min(100, s.happiness + 5);
          s.passiveIncome += 3000;
          return { log: '你退出了和巨头正面竞争的大众市场，转型做失智老人的专业照护。这是巨头不愿意碰的领域——太重、太脏、太难标准化、利润薄。但你有耐心，你和每一个失智老人的家庭深聊，你培训了一批真正懂行的护理员。一年后你在这个细分领域做出了口碑，大医院的医生开始把病人推荐给你。巨头有流量和资本，但他们没有你手上的温度。有些生意，不是大就能赢的。', cost: 30000 };
        },
      },
      {
        id: 'sv1_join_giant',
        label: '加入巨头，把自己的业务卖给他们或成为合作方',
        description: '打不过就加入，利用巨头的资源做大',
        hint: '失去独立但获得平台',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.currentSavings += 120000;
          s.pathFaith = Math.max(0, s.pathFaith - 10);
          s.stress = Math.min(100, s.stress + 10);
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.5);
          s.passiveIncome += 2000;
          s.happiness = Math.max(0, s.happiness - 5);
          return { log: '你联系了那家巨头的战略投资部，经过几个月谈判，他们收购了你60%的业务，你成了他们生态里的"合作伙伴"。你拿到了钱和资源，门店扩了三倍，但很多决策你说了不算了。总部要求你推他们的金融产品、用他们的供应商、完成KPI。你有时候觉得自己从一个创业者变成了一个店长，但你不得不承认——在巨头的体系里，你服务的老人比以前多了十倍。你安慰自己：这也是在做善事。', cost: 0 };
        },
      },
      {
        id: 'sv1_pivot_tech',
        label: '转型做银发产业的技术服务商',
        description: '不直接服务老人，做To B给巨头和同行卖工具',
        hint: '从运动员变成卖水人',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 15);
          s.pathFaith = Math.max(0, s.pathFaith - 5);
          s.currentSavings = Math.max(0, s.currentSavings - 20000);

          const roll = Math.random();
          if (roll < 0.45) {
            s.passiveIncome += 6000;
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.4);
            s.happiness = Math.min(100, s.happiness + 10);
            s.pathFaith = Math.min(100, s.pathFaith + 10);
            return { log: '你发现自己在行业里积累的经验和认知是最大的资产。你关了门店，组建了一个小团队，开发了一套养老机构管理SaaS和老人健康监测系统。巨头正好需要这样的工具——他们有钱但不懂一线。你从和他们竞争变成了赚他们的钱。三年后你的系统服务了几百家养老机构，你不再需要亲手给老人换尿布了，但你依然在这个行业里——只是换了一种方式。', cost: 20000 };
          } else {
            s.currentSavings = Math.max(0, s.currentSavings - Math.round(s.currentSavings * 0.25) - 30000);
            s.happiness = Math.max(0, s.happiness - 20);
            s.pathFaith = Math.max(0, s.pathFaith - 15);
            s.stress = Math.min(100, s.stress + 10);
            return { log: '你尝试做To B服务，但技术开发比你想象的难，客户需求千差万别，巨头自己也在做类似的系统。你烧了钱做了产品但卖不出去几个客户，团队散了，又赔了一笔钱。你又回到了原点，但积蓄少了一大截，时间浪费了一年多。你不得不承认：不是所有人都能从做服务转型成做产品的。有些能力是跨界的，有些坑是必须自己踩的。', cost: 20000 };
          }
        },
      },
      {
        id: 'sv1_fight_guerrilla',
        label: '和巨头打游击战，靠人情和口碑守住地盘',
        description: '不转型不投降，用社区关系对抗资本',
        hint: '悲壮但可能是螳臂当车',
        hintColor: 'danger',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 25);
          s.pathFaith = Math.min(100, s.pathFaith + 15);
          s.happiness = Math.max(0, s.happiness - 5);

          const roll = Math.random();
          if (roll < 0.30) {
            s.passiveIncome += 4000;
            s.happiness = Math.min(100, s.happiness + 15);
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.2);
            return { log: '你没退。你一家一户地走访老客户，记住每个老人的生日、病史、子女电话。巨头的销售叫老人"阿姨叔叔"，你叫他们"张阿姨""李伯伯"——因为你真的认识他们。老人们嘴上贪小便宜去领免费鸡蛋，但真有事的时候还是给你打电话。巨头半年后因为亏损缩减了站点，你还在。你赢了不是因为你更强，是因为这个行业里有些东西资本买不到——信任。', cost: 0 };
          } else {
            // 打价格战一年积蓄损失惨重：损失40%存款+额外5万补贴成本
            const loss = Math.max(80000, Math.round(s.currentSavings * 0.4));
            s.currentSavings = Math.max(0, s.currentSavings - loss);
            s.happiness = Math.max(0, s.happiness - 25);
            s.pathFaith = Math.max(0, s.pathFaith - 20);
            s.stress = Math.min(100, s.stress + 15);
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 0.5);
            return { log: '你拼尽全力和巨头竞争——降价、加服务、延长营业时间。但你的补贴是自己的积蓄，他们的补贴是融资的零头。你撑了一年，积蓄烧掉了大半，你的客户还是一个一个流失了，不是因为你服务不好，是因为免费的东西真香。最后店还是关了。你坐在空荡荡的店里最后一次锁门，对面的综合体灯火通明。你意识到：在绝对的资本力量面前，情怀和努力有时候只是自我感动。', cost: 0 };
          }
        },
      },
    ],
  },

  // Silver-2: 33岁 父母生病亲手照顾
  {
    id: 'silver_parent_illness',
    title: '角色反转',
    narrative: '{age}岁，你在银发行业摸爬滚打，服务过几百个老人，以为自己已经看惯了生老病死。\n直到你自己的父亲/母亲倒下了——脑梗，半边身子不能动，需要24小时有人陪护。\n你突然从"养老从业者"变成了"病人家属"。你给客户讲过一百遍"要尽早做康复训练""要注意压疮""要关注老人心理"，但当那个人是你妈的时候，你的专业知识全部失灵了。你扶她走路的时候手抖，你给她喂饭的时候鼻子酸，你在医院走廊里看到账单的时候才意识到——你每天帮别人规划的养老，就是你自己正在面对的现实。\n护工不好找，好的护工比白领工资还高；兄弟姐妹在分摊费用上有了分歧；你的工作也受影响——合伙人暗示你"最近心思不在业务上"。\n你在医院的长椅上坐了一整夜，听着病房里的鼾声和监护仪的滴滴声。你服务了那么多老人，现在轮到你了。',
    ageRange: [38, 45],
    priority: 9,
    cooldown: 999,
    tag: 'silver_parent_care',
    conditions: (s: GameState) => s.retirementPath === 'silver_economy' && s.isAllInPath && s.parents.isAlive && !s.crossroadFired['silver_parent_care'],
    options: [
      {
        id: 'sv2_personal_care',
        label: '亲自照顾，把业务暂时交给合伙人',
        description: '放下工作，亲手陪护父母做康复',
        hint: '尽孝但事业可能受重创',
        hintColor: 'danger',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 25);
          s.health = Math.max(0, s.health - 10);
          s.happiness = Math.max(0, s.happiness - 5);
          s.pathFaith = Math.min(100, s.pathFaith + 15);
          s.currentSavings = Math.max(0, s.currentSavings - 60000);
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 0.7);
          if (s.parents.isAlive) {
            s.parents.health = Math.min(100, s.parents.health + 20);
            s.parents.relationShip = Math.min(100, s.parents.relationShip + 30);
          }
          return { log: '你把业务交给了合伙人，自己搬到了父母家。每天五点起床帮老人做康复、做饭、擦身、推出去晒太阳。你以前觉得这些是护理员的工作，现在才知道亲手给自己父母做这些是什么感觉——累、烦、有时候想逃，但每次看到老人因为你扶着她多走了一步而笑的时候，你觉得一切都值。半年后老人能自己走路了，你瘦了十五斤，业务下滑了30%。但你妈逢人就说"我孩子孝顺"，你觉得这是你这辈子最好的口碑。', cost: 60000 };
        },
      },
      {
        id: 'sv2_hire_professional',
        label: '请最好的护工/送高端护理院，自己出钱',
        description: '用你在行业内的资源找最好的照护',
        hint: '花钱解决，继续工作但有亏欠',
        hintColor: 'negative',
        prerequisites: (s: GameState) => s.currentSavings >= 80000,
        disabledReason: '高端护理至少需要8万',
        effect: (s: GameState) => {
          s.currentSavings = Math.max(0, s.currentSavings - 80000);
          s.stress = Math.min(100, s.stress + 15);
          s.pathFaith = Math.max(0, s.pathFaith - 5);
          s.happiness = Math.max(0, s.happiness - 10);
          if (s.parents.isAlive) {
            s.parents.health = Math.min(100, s.parents.health + 15);
            s.parents.relationShip = Math.min(100, s.parents.relationShip + 5);
          }
          return { log: '你用行业内的人脉找了最好的康复护工，把父亲送进了你考察过的最好的护理院。你每周去三次，每次待半天。护工很专业，设施很完善，老人恢复得不错。但有一次你去探望，护工刚好不在，你爸拉着你的手说"你能不能多陪陪我"，你喉咙一下子哽住了。你知道给了他最好的物质条件，但有些东西钱买不到——比如你在身边的时间。你服务了那么多老人，却"委托"别人照顾自己的父亲。这个讽刺你消化了很久。', cost: 80000 };
        },
      },
      {
        id: 'sv2_work_harder',
        label: '拼命工作赚钱，用收入覆盖最好的医疗',
        description: '相信钱能解决大部分问题，先搞钱',
        hint: '理性但冷漠，可能后悔',
        hintColor: 'danger',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 20);
          s.pathFaith = Math.max(0, s.pathFaith - 10);
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.3);
          s.currentSavings = Math.max(0, s.currentSavings - 40000);
          s.happiness = Math.max(0, s.happiness - 20);
          if (s.parents.isAlive) {
            s.parents.health = Math.min(100, s.parents.health + 10);
            s.parents.relationShip = Math.max(0, s.parents.relationShip - 15);
          }
          s.health = Math.max(0, s.health - 5);
          return { log: '你请了普通护工，自己更加拼命地工作——你知道最好的康复和医疗都需要钱。你把业务扩张了，收入涨了不少，给老人用的都是进口药和最好的设备。但你三个月里只去看了父亲六次，每次都是匆匆来去。有一天你妈在电话里说"你爸昨天叫你的名字叫了一晚上"，你挂了电话在办公室哭了。你赚了更多的钱，但你不确定这些钱能不能买回错过的时间。', cost: 40000 };
        },
      },
      {
        id: 'sv2_insight_reform',
        label: '把这次经历转化为事业升级的动力',
        description: '亲身经历让你更理解老人需求，改进自己的服务',
        hint: '化痛苦为力量，但需要极强的心理',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 15);
          s.pathFaith = Math.min(100, s.pathFaith + 20);
          s.currentSavings = Math.max(0, s.currentSavings - 30000);
          s.passiveIncome += 5000;
          s.happiness = Math.max(0, s.happiness - 5);
          if (s.parents.isAlive) {
            s.parents.health = Math.min(100, s.parents.health + 15);
            s.parents.relationShip = Math.min(100, s.parents.relationShip + 20);
          }
          return { log: '你一边照顾父亲一边反思自己做的服务。你发现了很多以前作为"从业者"看不到的盲区——家属的焦虑、护工的不易、老人的恐惧。你把这些洞察融入了自己的业务，推出了"家属陪伴计划"和"康复透明化"服务。你的品牌口碑一下子上了一个台阶，很多客户说"你是真的懂"。你把父亲的康复过程拍成了纪录片（征得同意），看哭了无数人。你把人生中最痛苦的一段经历，变成了照亮更多人的光。', cost: 30000 };
        },
      },
    ],
  },

  // Silver-3: 36岁 政策变化
  {
    id: 'silver_policy_change',
    title: '风向转变',
    narrative: '{age}岁，行业突然变了天。\n国家出台了新的养老产业监管政策——提高了准入门槛、规范了预付费模式、限制了养老金融产品的销售、加强了对民办养老机构的资质审查。\n你的店在新规下需要重新申请资质，消防要改造、人员要持证、预收费要纳入监管账户。你算了一笔账，合规成本至少需要五十万，而且你之前卖过的一些养老理财类产品现在被定性为"不合规"，可能面临客户投诉和退款。\n同行里有人拍手叫好说"终于要洗牌了"，有人在群里骂"这是要逼死小机构"，有人已经开始转让店面准备离场。\n你在这个行业深耕了很多年，经历了野蛮生长的草莽时代，现在游戏规则突然变了。你桌上放着两份文件：一份是合规整改通知书，一份是连锁机构发来的收购邀约。\n窗外是老年活动广场，一群爷爷奶奶在跳广场舞。他们不知道这个行业正在地震，他们只关心谁能给他们一碗热饭、一张干净的床。',
    ageRange: [42, 52],
    priority: 9,
    cooldown: 999,
    tag: 'silver_policy',
    conditions: (s: GameState) => s.retirementPath === 'silver_economy' && s.isAllInPath && !s.crossroadFired['silver_policy'],
    options: [
      {
        id: 'sv3_comply_upgrade',
        label: '贷款/筹钱合规整改，升级设施和资质',
        description: '按新规要求全面改造，拿到新牌照',
        hint: '投入大但门槛也高了，洗掉竞争对手',
        hintColor: 'positive',
        prerequisites: (s: GameState) => s.currentSavings >= 500000,
        disabledReason: '合规改造至少需要50万',
        effect: (s: GameState) => {
          s.currentSavings = Math.max(0, s.currentSavings - 500000);
          s.stress = Math.min(100, s.stress + 20);
          s.pathFaith = Math.min(100, s.pathFaith + 15);
          s.passiveIncome += 6000;
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.2);
          s.happiness = Math.max(0, s.happiness - 5);
          return { log: '你花了半年时间做合规改造——消防升级、人员培训、系统对接、预付费监管账户，还退还了不合规理财产品的预付款。过程很痛苦，花了五十万，但拿到新牌照的那一刻你知道，那些拿不出钱改造的小机构要被清退了。行业门槛高了，你的竞争反而少了。你又投入资金做了适老化升级，收费提高了20%但入住率反而更高了——因为老人和家属现在更看重"合规"和"安全"。洗牌之后，活下来的都是认真做事的人。', cost: 500000 };
        },
      },
      {
        id: 'sv3_sell_business',
        label: '趁还有价值，把业务卖给连锁机构',
        description: '在政策落地前套现离场',
        hint: '落袋为安，但放弃了十年心血',
        hintColor: 'negative',
        effect: (s: GameState) => {
          s.currentSavings += 200000;
          s.pathFaith = Math.max(0, s.pathFaith - 25);
          s.stress = Math.max(0, s.stress - 20);
          s.happiness = Math.max(0, s.happiness - 15);
          s.passiveIncome += 4000;
          return { log: '你接受了连锁机构的收购邀约，在政策正式落地前把业务卖了出去。钱到账那天你没有太多喜悦——这家店是你十年的心血，你认识每一个老人，记得每一张床的故事。你在店门口站了很久，最后摸了摸门口那块你亲手挂的招牌，转身走了。你财务自由了一大截，但你心里空了一块。后来你偶尔路过，看到招牌换成了连锁品牌，里面的护理员你都不认识了。你没有进去。', cost: 0 };
        },
      },
      {
        id: 'sv3_pivot_consulting',
        label: '转型做养老行业合规咨询',
        description: '帮其他机构做合规改造，卖铲子给淘金者',
        hint: '用经验变现，轻资产运营',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 10);
          s.pathFaith = Math.max(0, s.pathFaith - 5);
          s.passiveIncome += 5000;
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 0.9);
          s.happiness = Math.min(100, s.happiness + 5);
          return { log: '你关闭了自己的门店，利用自己多年的行业经验和对新规的理解，开了一家养老行业合规咨询公司。你帮中小机构做整改方案、培训人员、对接监管部门。生意比你想象的好——太多同行不知道怎么合规了，他们需要走过这条路的人带路。你不再亲手照顾老人了，但你帮助更多机构变得更好，间接服务了更多老人。你从一个经营者变成了一个赋能者。', cost: 0 };
        },
      },
      {
        id: 'sv3_downsize_gray',
        label: '缩小规模，做黑区/灰色地带的小生意',
        description: '转到监管不到的社区小微服务，不申请牌照',
        hint: '生存第一，但在灰色地带走钢丝',
        hintColor: 'danger',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 25);
          s.pathFaith = Math.max(0, s.pathFaith - 20);
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 0.6);
          s.happiness = Math.max(0, s.happiness - 10);

          const roll = Math.random();
          if (roll < 0.40) {
            s.passiveIncome += 2000;
            s.happiness = Math.min(100, s.happiness + 10);
            return { log: '你关了大店，在社区里租了个小门面做"日间照料中心"——不做全托、不收大额预付费、只做白天的送餐和陪伴服务。规模小到不需要那些复杂的牌照，但你和老人们的关系更近了。你赚不到大钱了，但每个月的收入够活，而且你还在做你觉得有意义的事。你成了社区里那个"热心的小X"，老人们有什么事都找你。这也许不是你当初设想的事业，但它真实、踏实、有温度。', cost: 0 };
          } else {
            // 无牌照经营被查处：罚款+整改+停业，损失约20%存款（最低5万）
            const fine = Math.max(50000, Math.round(s.currentSavings * 0.2));
            s.currentSavings = Math.max(0, s.currentSavings - fine);
            s.happiness = Math.max(0, s.happiness - 25);
            s.stress = Math.min(100, s.stress + 20);
            s.pathFaith = Math.max(0, s.pathFaith - 10);
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 0.5);
            return { log: '你试图打擦边球做无牌照经营，但一次检查中被举报了。罚款、整改、停业整顿，罚掉了你一大笔钱，还在行业内留下了不良记录。社区里的老人看你的眼神也变了——他们不关心政策，他们只觉得你"被查了"就是"有问题"。你发现灰色地带的代价是永远的提心吊胆，而你已经不是二十多岁输得起的年纪了。', cost: 0 };
          }
        },
      },
    ],
  },

  // ============================================================
  // 路径六：生物赌徒 (bio_gambler)
  // ============================================================

  // Bio-1: 29岁 重仓公司临床失败
  {
    id: 'bio_clinical_failure',
    title: '数据崩塌',
    narrative: '{age}岁，你All in的那家生物科技公司宣布了三期临床数据。\n你盯着屏幕上的新闻通稿，逐字逐句地读——"未达到主要临床终点""无统计学差异""将评估下一步战略"。这些词翻译成人话就是：失败了。\n你不仅把积蓄押在了这家公司的股票/期权上，你还辞掉了工作全职参与，你甚至说服了两个朋友一起投钱。你曾经那么相信这个靶点、这个团队、这个诺贝尔奖得主的科学顾问。你在脑海里推演过无数次成功的场景——药物上市、患者得救、你财富自由。\n现在盘前股价跌了90%，你手机里是朋友发来的"怎么回事"，邮箱里是HR的"团队优化"通知。你坐在电脑前，屏幕的蓝光映在你脸上，你觉得自己像一个输光了筹码的赌徒——只不过你赌的不是牌，是科学，而科学没有义务让你赢。\n窗外面是早晨，你一夜没睡，新的一天开始了，但你的世界刚刚塌了。',
    ageRange: [26, 29],
    priority: 10,
    cooldown: 999,
    tag: 'bio_clinic_fail',
    conditions: (s: GameState) => s.retirementPath === 'bio_gambler' && !s.isAllInPath && !s.crossroadFired['bio_clinic_fail'],
    options: [
      {
        id: 'bio1_double_down',
        label: '不信邪，押注同领域另一个方向/公司',
        description: '相信这个赛道，只是这家公司不行',
        hint: '继续赌，但你还有筹码吗',
        hintColor: 'danger',
        prerequisites: (s: GameState) => s.currentSavings >= 30000,
        disabledReason: '你已经没多少筹码了',
        effect: (s: GameState) => {
          s.currentSavings = Math.max(0, s.currentSavings - 30000);
          s.stress = Math.min(100, s.stress + 20);
          s.pathFaith = Math.min(100, s.pathFaith + 10);
          s.health = Math.max(0, s.health - 5);

          const roll = Math.random();
          if (roll < 0.25) {
            s.currentSavings += 400000;
            s.passiveIncome += 8000;
            s.happiness = Math.min(100, s.happiness + 25);
            s.pathFaith = Math.min(100, s.pathFaith + 20);
            return { log: '你仔细分析了失败原因——不是靶点不行，是给药方式和剂量有问题。你把剩下的钱押在了另一家用不同路径做同一靶点的小公司。两年后那家公司的临床数据出奇地好，被大药厂高价收购。你不仅翻了本，还赚了十倍。你请两个亏了钱的朋友吃了顿大餐，把他们的损失也补上了。你证明了自己的判断是对的——只是你比科学需要的时间，多撑了两年。', cost: 30000 };
          } else {
            s.currentSavings = Math.max(0, s.currentSavings - 20000);
            s.happiness = Math.max(0, s.happiness - 20);
            s.pathFaith = Math.max(0, s.pathFaith - 15);
            return { log: '你又投了另一家公司，但这一次你心太急了，没有做足够的尽调。那家公司的数据也出了问题，管理层甚至被曝出造假。你剩下的钱又亏了大半。你这才意识到：第一次失败也许是运气不好，第二次失败说明你可能真的不适合这个游戏。科学的成功率本来就不到10%，你凭什么觉得自己是那个天选之人？', cost: 30000 };
          }
        },
      },
      {
        id: 'bio1_cut_losses',
        label: '认赔出局，找份工作重新开始',
        description: '接受失败，回归正常收入轨道',
        hint: '最痛但最稳',
        hintColor: 'negative',
        effect: (s: GameState) => {
          s.currentSavings = Math.max(0, Math.round(s.currentSavings * 0.2));
          s.pathFaith = Math.max(0, s.pathFaith - 30);
          s.stress = Math.max(0, s.stress - 5);
          s.happiness = Math.max(0, s.happiness - 20);
          s.isUnemployed = true;
          s.currentMonthlySalary = 0;
          s.preUnemployedSalary = s.currentMonthlySalary;
          s.health = Math.max(0, s.health - 5);
          return { log: '你清掉了所有相关的持仓，把账户里剩下的钱转了出来。你给投了钱的朋友一个个打电话道歉，虽然他们没说什么但你知道那笔钱对他们也不是小数。你重新开始投简历，面试的时候被问"这一年空白期在做什么"，你说"参与了一个创业项目，失败了"。你找了一份普通的工作，朝九晚六，工资不高但每个月固定到账。你不再做一夜暴富的梦了，代价是你损失了90%的积蓄和两年的时间。', cost: 0 };
        },
      },
      {
        id: 'bio1_stay_industry',
        label: '留在生物科技行业做打工人，从内部学习',
        description: '不赌了，但不离开这个行业，积累认知',
        hint: '用时间换空间',
        hintColor: 'positive',
        effect: (s: GameState) => {
          s.stress = Math.max(0, s.stress - 5);
          s.pathFaith = Math.max(0, s.pathFaith - 5);
          s.currentMonthlySalary = Math.round(s.careerStartSalary * 0.9);
          s.happiness = Math.max(0, s.happiness - 10);
          s.isUnemployed = false;
          return { log: '你在另一家生物科技公司找了一份研发相关的工作，从基层做起。工资比你以前低，但你第一次从内部看到了药物研发的真实流程——不是新闻里的"重大突破"，是无数次失败实验、数不清的数据复盘、和一个个深夜的实验室灯光。你慢慢理解了当初那家公司为什么会失败，你也看到了真正有希望的方向在哪里。你不再all in单家公司了，但你开始用工资系统性地定投一篮子生物医药标的。这一次，你不是在赌，你是在投资。', cost: 0 };
        },
      },
      {
        id: 'bio1_become_skeptic',
        label: '转行做生物科技做空者/行业评论家',
        description: '被坑过一次后，反过来割韭菜',
        hint: '灰色收入，但价值观扭曲',
        hintColor: 'danger',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 10);
          s.pathFaith = Math.max(0, s.pathFaith - 20);
          s.hasSideHustle = true;

          const roll = Math.random();
          if (roll < 0.45) {
            s.currentSavings += 80000;
            s.passiveIncome += 3000;
            s.happiness = Math.max(0, s.happiness - 5);
            return { log: '你开了一个自媒体账号，专门分析生物科技公司的临床数据，揭露泡沫和造假。你踩过的坑成了你最好的素材——你知道这个行业的套路在哪里。你的分析精准狠辣，很快积累了一批粉丝，有人付费请你做尽调，也有做空机构找你合作。你赚了钱，比你当初投资赚的还多。但有时候你看着镜子里的自己，想：你是在帮投资者避雷，还是在用别人的痛苦赚钱？这个问题你不太敢深想。', cost: 0 };
          } else {
            s.happiness = Math.max(0, s.happiness - 20);
            s.stress = Math.min(100, s.stress + 20);
            s.currentSavings = Math.max(0, s.currentSavings - 20000);
            return { log: '你尝试做空和爆料，但被一家公司发了律师函告你诽谤。你的分析虽然方向对了但细节有瑕疵，官司打了一年，赔了钱还丢了声誉。行业里把你当成了"叛徒"，正经公司不敢用你，你的粉丝也因为你打输官司而流失。你想报复这个伤害了你的行业，但你发现自己还太嫩——在资本和法律面前，一个受伤的散户什么都不是。', cost: 0 };
          }
        },
      },
    ],
  },

  // Bio-2: 32岁 补剂肝损伤
  {
    id: 'bio_supplement_damage',
    title: '反噬',
    narrative: '{age}岁，你为了抗衰老和保持精力，长期服用一堆补剂——NMN、白藜芦醇、辅酶Q10、PQQ、各种肽类，还有你从海外海淘的"研究级化学物"。你信奉"生物黑客"哲学：你的身体是一个系统，通过精准输入可以优化它。\n直到一次体检，你的转氨酶指标亮了红灯——药物性肝损伤。医生说你的肝脏负荷过重，那些"纯天然""抗衰老"的补剂大部分要经过肝脏代谢，叠加在一起就是在伤肝。你停掉所有补剂后指标恢复了一些，但医生说你已经比同龄人的肝脏老了五到十岁。\n更讽刺的是，你一直在吃的几种"抗衰老神药"，最新的大型临床研究显示不仅无效，长期服用还可能增加某些疾病风险。你花了那么多钱、那么多精力优化自己的身体，结果反而把它搞坏了。\n你看着桌上那一堆瓶瓶罐罐——有些一瓶就几千块，有些是你托人从国外带回来的。你曾经那么相信科学的力量，但你忘了科学也包括"不知道"和"可能错了"。\n右上腹隐隐作痛，不知道是心理作用还是真的有问题。',
    ageRange: [36, 43],
    priority: 9,
    cooldown: 999,
    tag: 'bio_liver',
    conditions: (s: GameState) => s.retirementPath === 'bio_gambler' && s.isAllInPath && !s.crossroadFired['bio_liver'],
    options: [
      {
        id: 'bio2_quit_all',
        label: '停掉所有补剂，回归自然生活',
        description: '承认自己过度了，好好吃饭睡觉运动',
        hint: '最安全的选择',
        hintColor: 'positive',
        effect: (s: GameState) => {
          s.pathFaith = Math.max(0, s.pathFaith - 15);
          s.health = Math.min(100, s.health + 10);
          s.stress = Math.max(0, s.stress - 10);
          s.happiness = Math.min(100, s.happiness + 5);
          s.annualBaseCost = Math.max(0, s.annualBaseCost - 8000);
          return { log: '你把所有补剂装进了一个大箱子，锁进了储物柜。你开始好好吃饭——不是精准计算宏量营养素的那种"好好吃饭"，是妈妈做的那种好好吃饭。你早睡、散步、减少屏幕时间。三个月后复查，肝功能指标恢复了大半。你失去了"生物黑客"的身份认同，但你找回了身体的本能感觉——累了就休息，饿了就吃饭，不需要任何药丸来告诉你什么是"优化"。也许人体比你想象的更聪明，也更简单。', cost: 0 };
        },
      },
      {
        id: 'bio2_medical_supervision',
        label: '在医生指导下精准使用，做全面体检后调整',
        description: '不放弃但更科学，找抗衰医生做精准方案',
        hint: '花钱买安全',
        hintColor: 'neutral',
        prerequisites: (s: GameState) => s.currentSavings >= 30000,
        disabledReason: '精准体检和私人医生至少需要3万/年',
        effect: (s: GameState) => {
          s.currentSavings = Math.max(0, s.currentSavings - 30000);
          s.stress = Math.min(100, s.stress + 5);
          s.pathFaith = Math.min(100, s.pathFaith + 5);
          s.health = Math.min(100, s.health + 5);
          s.annualBaseCost += 5000;
          return { log: '你花了一大笔钱做了全套的精准体检和基因检测，找了一位功能医学医生，根据你的具体指标制定了精简的补剂方案——从每天二十几粒减到了四五粒，每一种都有明确的血液指标追踪。你开始每季度复查，根据数据调整。肝慢慢恢复了，你也学到了教训：没有监控的"自我实验"不是科学，是鲁莽。真正的生物黑客不是往嘴里塞各种化学物，是精确地知道自己在做什么，并且谦卑地承认自己不知道的更多。', cost: 30000 };
        },
      },
      {
        id: 'bio2_ignore_warnings',
        label: '医生太保守了，继续优化加入护肝方案',
        description: '加入奶蓟草等护肝补剂，继续原方案',
        hint: '一意孤行，可能付出更大代价',
        hintColor: 'danger',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 10);
          s.pathFaith = Math.min(100, s.pathFaith + 5);
          s.annualBaseCost += 3000;

          const roll = Math.random();
          if (roll < 0.25) {
            s.health = Math.min(100, s.health + 5);
            s.happiness = Math.min(100, s.happiness + 5);
            return { log: '你加了护肝补剂继续原方案，奇迹般地肝功能居然稳住了。你更加坚信"医生不懂优化医学"，继续在生物黑客的路上越走越远。精力确实比同龄人好，体检指标也还行。但你不知道这是真的安全，还是在累积一场更大的风暴——时间会告诉你答案，只是那个答案可能来得太晚。', cost: 0 };
          } else {
            s.health = Math.max(0, s.health - 20);
            s.happiness = Math.max(0, s.happiness - 15);
            s.stress = Math.min(100, s.stress + 15);
            s.pathFaith = Math.max(0, s.pathFaith - 20);
            return { log: '你没听医生的话，加了点护肝片继续吃。一年后复查，肝功能指标恶化了，还查出了早期脂肪肝和胆囊问题。医生严肃地告诉你必须立刻停掉所有非必要补剂，否则可能面临不可逆的肝损伤。你这次真的怕了——那些曾经让你觉得"走在时代前沿"的药丸，现在看起来像一个个小炸弹。你停了所有东西，但肝脏的损伤可能需要很多年才能恢复，如果能恢复的话。', cost: 0 };
          }
        },
      },
      {
        id: 'bio2_become_skeptic',
        label: '自己做补剂测评/打假，帮别人避坑',
        description: '亲身教训变成内容，做补剂行业的吹哨人',
        hint: '化教训为价值，但需要勇气',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.pathFaith = Math.min(100, s.pathFaith + 5);
          s.stress = Math.min(100, s.stress + 5);
          s.hasSideHustle = true;
          s.passiveIncome += 2000;
          s.health = Math.min(100, s.health + 5);
          s.happiness = Math.min(100, s.happiness + 10);
          return { log: '你停掉了所有不必要的补剂后，把自己的经历和检测结果做成了系列内容——自费送检各种热门抗衰老补剂，公布真实成分和有效剂量。你的内容因为"自曝式"的真实感火了，很多人感谢你帮他们省了钱避了坑。也有人骂你"叛徒"，补剂厂商威胁要告你。但你第一次觉得自己在这条路上找到了真正的使命——不是往自己嘴里塞各种化学物，而是帮更多人在混乱的信息中找到安全的路。', cost: 0 };
        },
      },
    ],
  },

  // Bio-3: 35岁 要不要孩子(寿命剧变世界观)
  {
    id: 'bio_have_child_decision',
    title: '永生者的困境',
    narrative: '{age}岁，你在生物科技领域深耕多年，看到了普通人看不到的东西。\n你跟踪的几个长寿技术方向正在突破——基因编辑、senolytics（清理剂）、细胞重编程、器官克隆。你的行业判断告诉你：如果这些技术按目前的速度发展，你这一代人有可能活到120岁甚至更长，而且不是在病床上躺到120岁，是健康寿命大幅延长。\n这个认知改变了你的时间观。如果你的生命将是一百年甚至更长，那"现在就要孩子"是不是太早了？你还有六七十年的职业生涯、六七十年的探索和自由。但另一方面，如果你真的能活那么久，没有一个延续你基因和记忆的人，会不会在一百年后感到彻底的孤独？\n你的伴侣（如果有的话）在等你的决定。你父母在催。你的理性在告诉你"等技术成熟了再说"，但你的生物本能在说"不要错过窗口期"。更现实的是：如果长寿技术真的来了，你的孩子可能活150岁——你真的有权把一个人带到这么长的生命里吗？\n深夜你读着最新的论文，屏幕的光映在你脸上。',
    ageRange: [40, 48],
    priority: 9,
    cooldown: 999,
    tag: 'bio_child',
    conditions: (s: GameState) => s.retirementPath === 'bio_gambler' && s.isAllInPath && !s.crossroadFired['bio_child'],
    options: [
      {
        id: 'bio3_have_child_now',
        label: '不管未来怎样，现在就要孩子',
        description: '相信生命自有其意义，不被未来技术绑架',
        hint: '传统选择，但在长寿时代可能是另一种冒险',
        hintColor: 'positive',
        effect: (s: GameState) => {
          s.hasChild = true;
          s.pathFaith = Math.max(0, s.pathFaith - 10);
          s.stress = Math.min(100, s.stress + 20);
          s.happiness = Math.min(100, s.happiness + 20);
          s.annualBaseCost += 20000;
          s.currentSavings = Math.max(0, s.currentSavings - 30000);
          s.children.push({
            birthYear: s.currentAge,
            gender: Math.random() > 0.5 ? '男' : '女',
            growthStage: '婴儿',
            academicPerformance: 50,
            rebelliousness: 0,
            monthlyExpense: 2000,
          });
          // 状态同步：有孩子时确保伴侣/婚姻状态一致
          ensureChildParentPartner(s);
          return { log: '孩子出生了，小小的，皱巴巴的，握着你的手指不放。你在产房里哭了——不是因为激动，是因为你突然意识到：不管未来人类能活多久，这一刻是真实的。这个小生命的未来可能是150年，也可能是医学突破之前的普通长度，但你决定给他/她最好的开始。夜里你起来喂奶，看着窗外的星空，想：也许长寿最大的意义不是活多久，而是你在有限的时间里爱过谁。', cost: 30000 };
        },
      },
      {
        id: 'bio3_freeze_wait',
        label: '冻卵/冻精，等技术更成熟再决定',
        description: '保存生育能力，争取10年决策时间',
        hint: '花钱买时间，但不能无限期推迟',
        hintColor: 'neutral',
        prerequisites: (s: GameState) => s.currentSavings >= 50000,
        disabledReason: '辅助生殖至少需要5万',
        effect: (s: GameState) => {
          s.currentSavings = Math.max(0, s.currentSavings - 50000);
          s.stress = Math.min(100, s.stress + 10);
          s.pathFaith = Math.min(100, s.pathFaith + 10);
          s.happiness = Math.max(0, s.happiness - 5);
          return { log: '你做了冷冻保存的手术/取精，把生育能力"存"了起来。这给了你十年的缓冲期——十年里你可以继续观察长寿技术的发展，也可以再想想自己到底要不要孩子。只是"再想想"有时候是理性，有时候是拖延。你安慰自己至少没有关上那扇门，但门不会永远开着——生物学的窗口是有限的，技术的窗口也是。你给自己买了时间，时间会告诉你这是不是正确的决定。', cost: 50000 };
        },
      },
      {
        id: 'bio3_dink_forever',
        label: '坚定丁克，把资源投入延寿和体验',
        description: '不要孩子，把钱和时间花在自己的寿命和体验上',
        hint: '最大化个人生命，但老了可能孤独',
        hintColor: 'negative',
        effect: (s: GameState) => {
          s.pathFaith = Math.min(100, s.pathFaith + 15);
          s.happiness = Math.min(100, s.happiness + 10);
          s.stress = Math.max(0, s.stress - 15);
          s.passiveIncome += 3000;
          s.health = Math.min(100, s.health + 5);
          return { log: '你做了一个坚定的决定：不要孩子。你把省下的钱投入到健康管理、精准医疗、健身和旅行上。你去了更多地方，学了更多东西，身体状态比很多有孩子的同龄人好得多。你和伴侣（如果有的话）有充分的时间相处和成长。只是有时候在公园看到别人一家三口，你会多看两眼。你告诉自己那是哺乳动物的本能，不是理性的选择。但理性和本能的战争，可能要打到你死的那一天——如果你真能活那么久的话。', cost: 0 };
        },
      },
      {
        id: 'bio3_longevity_baby',
        label: '等基因筛查/编辑技术成熟后再要"完美宝宝"',
        description: '用生物技术优化后代，等技术安全再生育',
        hint: '前沿但伦理争议大',
        hintColor: 'danger',
        prerequisites: (s: GameState) => s.currentSavings >= 200000,
        disabledReason: '基因筛查和辅助生殖需要至少20万',
        effect: (s: GameState) => {
          s.currentSavings = Math.max(0, s.currentSavings - 150000);
          s.stress = Math.min(100, s.stress + 15);
          s.pathFaith = Math.min(100, s.pathFaith + 20);
          s.hasChild = true;
          s.children.push({
            birthYear: s.currentAge + 2,
            gender: Math.random() > 0.5 ? '男' : '女',
            growthStage: '婴儿',
            academicPerformance: 80,
            rebelliousness: 0,
            monthlyExpense: 3000,
          });
          // 状态同步：有孩子时确保伴侣/婚姻状态一致
          ensureChildParentPartner(s);
          s.happiness = Math.min(100, s.happiness + 15);

          const roll = Math.random();
          if (roll < 0.50) {
            s.health = Math.min(100, s.health + 5);
            return { log: '你等了两年，利用PGD（胚胎植入前遗传学诊断）筛选了健康的胚胎，孩子出生后非常健康，各项指标都很优秀。你相信这个孩子将带着最好的基因来到这个长寿时代——他/她可能真的能活150岁。但你有时候也会想：你替孩子做了这么多选择，他/她会感激吗？当他/她知道自己是"被筛选过的"，会怎么看待自己？这些问题没有答案，就像生命本身一样。', cost: 150000 };
          } else {
            s.happiness = Math.max(0, s.happiness - 10);
            s.health = Math.max(0, s.health - 5);
            return { log: '你等了两年，花了很多钱做辅助生殖和基因筛查，但过程并不顺利——多次尝试后才成功，孩子出生了但有些早产。医生说不影响长期健康，但你在保温箱外面看着那个小小的身影的时候，突然觉得自己是不是太傲慢了？你以为自己在"优化"生命，但生命的本质是不完美的。孩子健康长大，但你再也不会轻易说"完美"这个词了。', cost: 150000 };
          }
        },
      },
    ],
  },

  // ============================================================
  // 通用十字路口（任何路径都可能触发）
  // ============================================================

  // Universal-3: 前任突然联系 (26-40岁)
  {
    id: 'ex_contact',
    title: '来自过去的消息',
    narrative: '深夜，手机屏幕亮了一下。\n是一个你以为早就忘了的人——那个曾经和你规划过未来、最后却在某个雨天消失在你世界里的前任。\n消息很简单："最近还好吗？"\n四个字，但你的心跳瞬间加速了。你点开他/她的动态圈——他/她看起来过得不错，好像瘦了/胖了，好像换了城市，身边好像没有别人。\n你们当初分手的原因你已经记不太清了——是异地？是误会？是某件现在想起来微不足道的小事？还是你们都太年轻不知道怎么爱一个人？\n你盯着那四个字看了很久。窗外是城市的夜景，房间里只有手机屏幕的光。你可以不回，可以礼貌回复，可以问他/她为什么突然找你，也可以——\n你的手指悬在屏幕上方，迟迟没有落下。',
    ageRange: [26, 40],
    priority: 5,
    cooldown: 8,
    tag: 'ex_contact',
    conditions: (s: GameState) => !s.crossroadFired['ex_contact'],
    options: [
      {
        id: 'ub3_meet_up',
        label: '回复并约出来见面',
        description: '看看TA想干什么，也许是未了的缘分',
        hint: '危险的诱惑',
        hintColor: 'danger',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 10);

          const roll = Math.random();
          if (roll < 0.20) {
            s.happiness = Math.min(100, s.happiness + 20);
            s.pathFaith = Math.max(0, s.pathFaith - 5);
            return { log: '你们约在了以前常去的咖啡馆。见面的那一刻仿佛时光倒流——他/她还是你记忆中的样子，只是眼角多了一些成熟。你们聊了一整个下午，发现彼此都变了，但那些默契还在。之后你们慢慢重新联系，几个月后你发现，兜兜转转这么多年，最适合你的人还是他/她。你们重新开始了，这一次你们都更成熟了。', cost: 0 };
          } else if (roll < 0.55) {
            s.happiness = Math.max(0, s.happiness - 10);
            return { log: '你们见了面，吃了饭，聊了很多过去和现在。但你发现记忆中的那个人和眼前这个人已经对不上了——不是谁变了，是时间把你们都改变了。吃完饭你们礼貌地道别，他/她说"以后常联系"，但你们都知道不会了。你走在回家的路上觉得释然：有些东西放在记忆里才是最好的。', cost: 0 };
          } else {
            s.happiness = Math.max(0, s.happiness - 20);
            s.stress = Math.min(100, s.stress + 15);
            if (s.partner) s.partner.trust = Math.max(0, s.partner.trust - 20);
            return { log: '你去见了他/她，结果发现他/她只是想借钱/推销/找你帮忙办事。那些你以为的"旧情复燃"全是你自己的脑补。更糟的是，你去见前任的事被现任知道了（如果你有的话），大吵了一架。你觉得自己像个傻子——深夜的情绪波动不值得你付出这么大的代价。你删了那个联系方式，告诉自己这是最后一次犯这种错。', cost: 0 };
          }
        },
      },
      {
        id: 'ub3_casual_chat',
        label: '礼貌回复，但保持距离',
        description: '像普通朋友一样聊几句，不越界',
        hint: '最安全的成年人方式',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 5);
          s.happiness = Math.max(0, s.happiness - 3);
          return { log: '你回复了"挺好的，你呢？"你们有一搭没一搭地聊了几句近况，像两个普通的老朋友。你得知他/她结婚了/换工作了/搬去了另一个城市，你也简单说了说自己的情况。聊天在"有空聚聚"中结束了，但你们都知道不会聚。你放下手机，心里有一丝涟漪，但很快平静了。成年人的告别不需要仪式感，不联系就是最好的祝福。', cost: 0 };
        },
      },
      {
        id: 'ub3_ignore',
        label: '不回复，当作没看到',
        description: '过去的就让它过去',
        hint: '冷酷但清醒',
        hintColor: 'negative',
        effect: (s: GameState) => {
          s.happiness = Math.max(0, s.happiness - 5);
          s.stress = Math.max(0, s.stress - 5);
          return { log: '你盯着那条消息看了很久，最后锁屏把手机翻了过去。不是恨，不是怨，只是觉得没必要了。那些已经翻篇的故事，不需要再写续集。你不知道他/她为什么突然找你，也不想知道。有些人出现在你的生命里是为了陪你走一段路，路走完了，就该各自前行。你翻了个身睡着了，明天还有明天的事。', cost: 0 };
        },
      },
      {
        id: 'ub3_block',
        label: '直接删除/拉黑，彻底断联',
        description: '不留任何余地',
        hint: '决绝但可能后悔',
        hintColor: 'danger',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 5);
          s.happiness = Math.max(0, s.happiness - 10);
          return { log: '你看到消息的瞬间就删除了对方的联系方式。你不想知道他/她为什么来找你，也不想给任何可能的故事留开头。不是因为你还在意，而是因为你好不容易才把碎掉的自己拼回来，不想再冒一次碎掉的风险。那晚你失眠了一会儿，天亮后你觉得自己做对了。不是所有门都需要再打开。', cost: 0 };
        },
      },
    ],
  },

  // Universal-6: 意外之财/诈骗 (23-45岁)
  {
    id: 'windfall_or_scam',
    title: '"稳赚不赔"',
    narrative: '有人告诉你一个机会。\n可能是一个"内部消息"的股票/币，可能是一个"保本高息"的理财产品，可能是一个"国家扶持"的投资项目，可能是一个朋友拉你入伙的"稳赚不赔"的生意。\n回报率高得离谱——月化10%、年化50%、"投十万一年变三十万"。对方说得头头是道，有数据有案例有"已经赚到钱的人"的聊天截图。他/她可能是你信任的朋友、亲戚、同事，也可能是一个刚认识但特别投缘的"贵人"。\n你心里有个声音在说"天上不会掉馅饼"，但另一个声音在说"万一呢？万一这次是真的呢？"你看了看自己的存款——离你想要的数字还很远，靠工资慢慢攒不知道要攒到什么时候。如果这个机会是真的，可能少奋斗十年。\n对方说"名额有限，后天截止"。你只有两天时间做决定。',
    ageRange: [23, 45],
    priority: 4,
    cooldown: 8,
    tag: 'windfall_scam',
    conditions: (s: GameState) => !s.crossroadFired['windfall_scam'],
    options: [
      {
        id: 'ub6_all_in',
        label: '重仓投入，错过这次就没了',
        description: '信了，把大笔积蓄投进去',
        hint: '贪字头上一把刀',
        hintColor: 'danger',
        prerequisites: (s: GameState) => s.currentSavings >= 50000,
        disabledReason: '你没多少积蓄可投',
        effect: (s: GameState) => {
          s.currentSavings = Math.max(0, s.currentSavings - 50000);
          s.stress = Math.min(100, s.stress + 10);

          const roll = Math.random();
          if (roll < 0.10) {
            s.currentSavings += 150000;
            s.happiness = Math.min(100, s.happiness + 20);
            return { log: '你投了五万块进去。第一个月真的收到了5000块"收益"，第二个月又是5000。你后悔没多投点的时候，第三个月收益率涨到了12%。一年后你投的五万变成了十五万——这次居然是真的！你兴奋地请朋友吃了顿大餐。但你后来才知道，这种项目十有八九是庞氏骗局，你只是运气好及时下了车。你不知道自己该庆幸还是后怕。', cost: 50000 };
          } else {
            s.happiness = Math.max(0, s.happiness - 15);
            s.pathFaith = Math.max(0, s.pathFaith - 5);
            s.stress = Math.min(100, s.stress + 10);
            s.health = Math.max(0, s.health - 5);
            return { log: '你投了五万块进去。前两个月确实收到了"收益"，你兴奋地追加了更多。第三个月APP打不开了，联系人失联了，群解散了。你去报警，警察做了笔录说"这种骗局很难追回"。你坐在派出所门口，脑子里一片空白——那是你攒了好几年的钱。你想抽自己一耳光，但疼的不是脸，是心。你终于明白了：天上不会掉馅饼，掉下来的都是陷阱。', cost: 50000 };
          }
        },
      },
      {
        id: 'ub6_small_bet',
        label: '投一小笔试试水，亏了也不心疼',
        description: '拿闲钱参与，不影响生活',
        hint: '理性试水，控制风险',
        hintColor: 'neutral',
        prerequisites: (s: GameState) => s.currentSavings >= 5000,
        disabledReason: '你连试水的钱都没有',
        effect: (s: GameState) => {
          s.currentSavings = Math.max(0, s.currentSavings - 5000);
          s.stress = Math.min(100, s.stress + 5);

          const roll = Math.random();
          if (roll < 0.25) {
            s.currentSavings += 10000;
            s.happiness = Math.min(100, s.happiness + 10);
            return { log: '你投了五千块试水。没想到真的赚了，几个月后翻了一倍变成一万。你见好就收把钱提了出来，没有追加投资——你知道这种运气不会一直有。你用赚来的钱请自己吃了顿好的，然后把这个APP删了。小赌怡情，你控制住了自己的贪念。', cost: 5000 };
          } else {
            s.happiness = Math.max(0, s.happiness - 10);
            return { log: '你投了五千块试水。一开始确实有收益，但很快平台就出了问题，五千块打了水漂。还好你投得不多，心疼了几天就过去了。你安慰自己"花五千块买了个教训"，这个教训比那些倾家荡产的人便宜多了。从此以后看到"稳赚不赔"四个字你就直接拉黑。', cost: 5000 };
          }
        },
      },
      {
        id: 'ub6_investigate',
        label: '先不投，花时间调查清楚再说',
        description: '查资质、查背景、问专业人士',
        hint: '最理性的选择',
        hintColor: 'positive',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 5);
          s.happiness = Math.max(0, s.happiness - 3);

          const roll = Math.random();
          if (roll < 0.30) {
            s.currentSavings += 5000;
            s.passiveIncome += 1000;
            return { log: '你花了一周时间调查——查公司注册信息、查监管牌照、问金融行业的朋友。结果发现这居然是一个合规的、刚推出的高收益产品（虽然有门槛和锁定期）。你在搞清楚风险后适度参与了，赚了一笔小钱。更重要的是你养成了"先调查再决定"的习惯，这个习惯未来可能帮你避免更大的损失。', cost: 0 };
          } else {
            s.happiness = Math.min(100, s.happiness + 5);
            return { log: '你花时间一查，发现这个项目漏洞百出——假资质、假地址、假背书，典型的庞氏骗局。你把调查结果告诉了拉你入伙的朋友，他/她一开始不信，后来自己也发现了问题，及时撤了出来没亏大钱。他/她请你吃饭道谢，说你救了他/她一命。你守住了自己的钱包，还帮了朋友。理性永远是最好的投资策略。', cost: 0 };
          }
        },
      },
      {
        id: 'ub6_refuse',
        label: '直接拒绝，不信天上掉馅饼',
        description: '高回报必然高风险，不碰',
        hint: '最安全，不会被骗',
        hintColor: 'positive',
        effect: (s: GameState) => {
          s.happiness = Math.max(0, s.happiness + 5);
          s.stress = Math.max(0, s.stress - 5);
          return { log: '你直接拒绝了。不管对方说得多么天花乱坠，你始终相信一个道理：年化超过10%的无风险收益都是骗局。对方觉得你"不识好歹""没魄力"，你笑了笑没争辩。几个月后你听说那个项目爆雷了，不少人血本无归。你一点都不意外，也一点都不幸灾乐祸——你只是庆幸自己守住了底线。财富的积累没有捷径，那些看起来像捷径的，多半是弯路或者绝路。', cost: 0 };
        },
      },
    ],
  },
];
