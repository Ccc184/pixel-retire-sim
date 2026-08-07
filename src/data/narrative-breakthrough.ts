/**
 * 大成功事件 · 6条路径
 *
 * 设计意图：
 *   All In 后玩家需要一个"赌赢"的可能——否则只是换种方式慢慢攒钱，没有刺激感。
 *   每条路径一个大成功事件，触发后通过随机结果（大成功/小成功/差一点）
 *   决定玩家是否直接满足退休条件、大幅推进进度、还是只是小有收获。
 *
 * 触发机制：
 *   - All In 后每年有概率触发（年龄>=29，isAllInPath===true）
 *   - 每条路径 oncePerGame: true，最多触发一次
 *   - 技能和信念越高，weight 越大（通过 conditions + weight 动态调节）
 *
 * 结果分档：
 *   - 大成功（约15%）：直接满足退休条件，可立即退休
 *   - 小成功（约35%）：大幅推进退休进度（资产×2-3倍或被动收入大幅提升）
 *   - 差一点（约50%）：有可观收获但不够退休，需继续积累
 * ================================================================
 */
import type { NarrativeEvent, GameState } from '../types/global.d.js';
import { registerNarrativeEvents } from './narrative-registry.js';
import { clamp } from '../utils/clamp.js';
import { applyChainHoldingScale, capBreakthroughGain } from '../utils/math-engine.js';

const breakthroughEvents: NarrativeEvent[] = [

  // ============================================================
  // AI共生者 · 大成功：产品爆红 / 被收购
  // ============================================================
  {
    id: 'breakthrough_ai_symbiote',
    title: '那个刷屏的Demo',
    pathId: 'ai_symbiote',
    ageRange: [29, 55],
    priority: 9,
    weight: 60,
    oncePerGame: true,
    eventType: 'milestone',
    sceneTag: 'breakthrough',
    conditions: (s: GameState) => s.isAllInPath === true && ((s.pathSkills?.aiSkill || 0) + (s.aiSkillLevel || 0)) >= 50,
    narrative:
      '事情是从一个Demo开始的。周三你把团队内部AI Agent的演示视频发到技术社区，周五早上醒来发现播放量过了200万，转发列表里排着一串你认识的名字：某大厂CTO、知名投资人、百万粉科技博主。收件箱炸了——三封大厂"战略合作"邮件、两封VC私信、十几个企业询价。\n' +
      '合伙人冲进视频通话，脸涨得通红："某大厂战略投资部刚打电话来，他们想要——不是投资，是收购。全资。现金。"你看着屏幕上还在涨的播放量，知道机会窗口很短。热度可能两周就散，也可能就此改变你的人生。你必须在散去之前做出决定。',
    options: [
      {
        id: 'sell_company',
        label: '接受大厂全资收购，套现离场',
        description: '把公司卖给大厂，拿现金走人。一夜财富自由，但你的产品不再是你的了。',
        hint: '赌一把收购价 · 大成功则直接满足退休 · 小成功也大幅推进',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          const annualExpense = s.annualBaseCost + (s.currentMortgageCost || 0);
          const roll = Math.random();
          if (roll < 0.15) {
            // 大成功：收购价直接满足退休条件（存款>=年支出×12）
            const windfall = annualExpense * 8;
            s.currentSavings += windfall;
            s.stress = clamp(s.stress - 20, 0, 100);
            s.happiness = clamp(s.happiness + 25, 0, 100);
            s.pathFaith = clamp(s.pathFaith + 20, 0, 100);
            s.lifeLog.push(`谈判桌上对方报出一个数字的时候，你的手在桌下攥紧了。${windfall.toLocaleString()}。全现金。你用了三秒钟假装思考，其实你心里已经在签了。签字那天林野站在你旁边，他已经是独当一面的技术负责人了——你带了三年的徒弟，终究还是接了你的班。大厂的人和你握手说"欢迎加入"，你笑了笑——你不会加入，你要退休。这笔钱够你不工作活一辈子。那个Demo，那个凌晨三点调模型的夜晚，值了。`);
          } else if (roll < 0.5) {
            // 小成功：大幅推进
            const windfall = annualExpense * 6;
            s.currentSavings += windfall;
            s.stress = clamp(s.stress - 10, 0, 100);
            s.happiness = clamp(s.happiness + 15, 0, 100);
            s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
            s.lifeLog.push(`谈判持续了两周。大厂压价，你方争取，最后落在一个双方都"不太满意但能接受"的数字：${windfall.toLocaleString()}。你套现了大部分股权，留了一小部分期权。这笔钱不够你一辈子不工作，但足够让你从容地做下一个项目——如果你还想做的话。你看着银行账户的数字跳了一格，第一次觉得All In这条路，值。`);
          } else {
            // 差一点
            const windfall = annualExpense * 2;
            s.currentSavings += windfall;
            s.stress = clamp(s.stress - 5, 0, 100);
            s.happiness = clamp(s.happiness + 8, 0, 100);
            s.lifeLog.push(`热度散得比你想的快。两周后那个Demo的播放量停了，大厂的态度也从"全资收购"变成了"战略投资"，最后变成了"人才收购"——他们想招你团队的人，但不想买公司。你拿到的只是一个普通的人才安置费：${windfall.toLocaleString()}。聊胜于无。你看着那些曾经兴奋的私信变成了"我们再观望一下"，苦笑了一下。互联网没有记忆，但你有了这笔启动资金，下一仗可以打得更大。`);
          }
        },
        log: '你选择了被收购。互联网的运气来去如风，你接住了那一刻。',
      },
      {
        id: 'raise_funding',
        label: '拒绝收购，拿融资独立做',
        description: '不卖公司。拿VC的钱，把产品做成平台。赌的是估值会更高，但风险也更大。',
        hint: '赌估值翻倍 · 大成功则被动收入暴增 · 小成功则月薪翻倍',
        hintColor: 'positive',
        stateEffect: (s: GameState) => {
          const annualExpense = s.annualBaseCost + (s.currentMortgageCost || 0);
          const roll = Math.random();
          if (roll < 0.15) {
            // 大成功：产品成为平台，被动收入直接覆盖年支出（满足游牧民式自由）
            s.passiveIncome += Math.round(annualExpense * 0.5);
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 2);
            s.careerStartSalary = s.currentMonthlySalary;
            s.stress = clamp(s.stress - 15, 0, 100);
            s.happiness = clamp(s.happiness + 20, 0, 100);
            s.pathFaith = clamp(s.pathFaith + 15, 0, 100);
            s.lifeLog.push(`你拒绝了收购，拿了一笔让你睡不着觉的融资。三个月后产品上线，API调用量第一周就破了你的年度预期。企业客户排队接入，你的SaaS收入从"接单"变成了"订阅"——每个月自动到账的被动收入，直接覆盖了你的全部生活开支。你坐在办公室里看着后台那条陡升的曲线，想起All In那天递辞职信的手抖——原来赌对了的感觉，是这样的。`);
          } else if (roll < 0.5) {
            // 小成功
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.8);
            s.careerStartSalary = s.currentMonthlySalary;
            s.passiveIncome += Math.round(annualExpense * 0.4);
            s.stress = clamp(s.stress - 5, 0, 100);
            s.happiness = clamp(s.happiness + 12, 0, 100);
            s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
            s.lifeLog.push(`你拿了融资，产品上线了。数据不错，但没到"刷屏"的级别——企业客户在稳步增长，订阅收入在慢慢爬。你的月薪翻了将近一倍，被动收入也起来了，但离"不工作也能活"还有距离。你看着后台稳步上涨但不够陡的曲线，安慰自己：至少方向对了，剩下的交给时间。`);
          } else {
            // 差一点
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.3);
            s.careerStartSalary = s.currentMonthlySalary;
            s.stress = clamp(s.stress + 5, 0, 100);
            s.happiness = clamp(s.happiness + 5, 0, 100);
            s.lifeLog.push(`你拿了融资，但产品上线后数据远不及预期。热度过去了，用户留存很差，VC开始催你"调整方向"。你的月薪涨了一些，但你也背上了投资人的期待和压力。你看着那条掉头向下的留存曲线，想：也许应该当初卖掉的。但路已经走了，回头不了。`);
          }
        },
        log: '你选择了独立做。自由是有代价的——你赌的是自己能比大厂估值更高。',
      },
      {
        id: 'convert_clients',
        label: '不融资不卖，把热度转为客户',
        description: '趁热度把询价转化成合同。最稳，但天花板也最低。',
        hint: '稳健变现 · 月薪+50% · 无大成功可能 · 但无风险',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.5);
          s.careerStartSalary = s.currentMonthlySalary;
          s.currentSavings += Math.round(s.annualBaseCost * 2);
          s.stress = clamp(s.stress - 8, 0, 100);
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.lifeLog.push(`你把所有询价转化成了合同。热度散了，但客户留下了——你的团队接到了半年的订单，月薪涨了50%。没有一夜暴富，但你把"运气"变成了"生意"。你看着排到半年后的交付日历，觉得这比收购或融资都踏实：钱是赚到手里的，不是估出来的。`);
        },
        log: '你把热度变成了合同。最不刺激的选择，但你睡得着觉。',
      },
    ],
  },

  // ============================================================
  // 链上原住民 · 大成功：协议成为赛道龙头
  // ============================================================
  {
    id: 'breakthrough_chain_native',
    title: 'TVL破亿的那个早晨',
    pathId: 'chain_native',
    ageRange: [29, 55],
    priority: 9,
    weight: 60,
    oncePerGame: true,
    eventType: 'milestone',
    sceneTag: 'breakthrough',
    conditions: (s: GameState) => s.isAllInPath === true && (s.pathSkills?.tradingSkill || 0) >= 50,
    narrative:
      '你在凌晨四点被Discord吵醒，管理员@了你十七次——满屏火箭表情，你的协议TVL刚突破一亿美金。不是慢慢涨上来的，是某个DeFi鲸鱼一小时注入4000万引发FOMO跟投，你的协议从"小众项目"一夜变成"赛道热点"，媒体开始喊"下一个Uniswap"。\n' +
      '你的代币持仓一夜翻了4倍，还在涨。清仓你就是千万富翁，不清可能一周就跌回去。更麻烦的是三个VC想领投、交易所想上项目——你的代币、协议、社区全在一个临界点上。你盯着跳动的TVL数字，必须在热度散去之前做决定。',
    options: [
      {
        id: 'cash_out',
        label: '高位清仓，落袋为安',
        description: '在代币高点全部卖出，换成稳定币。一夜实现链上财富自由，但放弃协议未来。',
        hint: '赌在最高点卖出 · 大成功则链上资产满足退休条件 · 小成功也大幅推进',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          const annualExpense = s.annualBaseCost + (s.currentMortgageCost || 0);
          const currentHoldings = (s as any).chainHoldings || 0;
          const roll = Math.random();
          if (roll < 0.15) {
            // 大成功：清仓后链上资产直接满足退休条件（>=年支出×20）
            const cashedOut = capBreakthroughGain(Math.max(annualExpense * 25, currentHoldings * 5), s);
            (s as any).chainHoldings = 0;
            s.currentSavings += cashedOut;
            s.stress = clamp(s.stress - 25, 0, 100);
            s.happiness = clamp(s.happiness + 30, 0, 100);
            s.pathFaith = clamp(s.pathFaith + 15, 0, 100);
            s.lifeLog.push(`你在代币还在涨的时候按下了"全部卖出"。那一刻你的手指是抖的——每一秒都在涨，每一秒都在多赚一辆车。但你没有贪。稳定币到账的那个数字让你盯着屏幕看了五分钟：${cashedOut.toLocaleString()}。你关掉所有行情APP，给社区发了一封"我需要休息一段时间"的信。老K给你发了一条私信，是他二十年来第一次主动说话："活着就好。"你终于理解了那句话：会买的是徒弟，会卖的是师父。你是师父了。`);
          } else if (roll < 0.5) {
            // 小成功
            const cashedOut = capBreakthroughGain(Math.max(annualExpense * 8, currentHoldings * 2), s);
            (s as any).chainHoldings = Math.round((s as any).chainHoldings * 0.3);
            s.currentSavings += cashedOut;
            s.stress = clamp(s.stress - 12, 0, 100);
            s.happiness = clamp(s.happiness + 18, 0, 100);
            s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
            s.lifeLog.push(`你卖掉了70%的仓位，留了30%赌继续涨。到账${cashedOut.toLocaleString()}——这笔钱让你离"链上自由"近了一大步，但还没到能退休的程度。你看着剩下的30%仓位在接下来一周又涨了20%然后跌了40%，庆幸自己"至少卖了一部分"。HODL是信仰，卖出是智慧，两者之间你需要找平衡。`);
          } else {
            // 差一点：卖早了，只赚了一点
            const cashedOut = capBreakthroughGain(Math.max(annualExpense * 2, currentHoldings * 0.8), s);
            (s as any).chainHoldings = Math.round((s as any).chainHoldings * 0.5);
            s.currentSavings += cashedOut;
            s.stress = clamp(s.stress - 3, 0, 100);
            s.happiness = clamp(s.happiness + 8, 0, 100);
            s.lifeLog.push(`你卖掉了一半仓位。但卖完之后代币又涨了60%——你少赚了一辆跑车。你看着那个还在涨的K线，想把自己扇一巴掌。但你转念一想：如果没卖，可能明天就跌回来了。你到账了${cashedOut.toLocaleString()}，不多，但够你从容地做下一轮布局。在链上，"少赚"也是一种幸运。`);
          }
        },
        log: '你选择了清仓。链上的钱只有换成稳定币的那一刻，才是真的。',
      },
      {
        id: 'raise_round',
        label: '拿VC融资，把协议做成赛道龙头',
        description: '不清仓。拿融资加速开发，赌协议估值继续涨。代币持仓不动，赌更大的未来。',
        hint: '赌估值继续涨 · 大成功则链上资产×3 · 小成功则月薪翻倍 · 风险高',
        hintColor: 'positive',
        stateEffect: (s: GameState) => {
          const currentHoldings = (s as any).chainHoldings || 0;
          const roll = Math.random();
          if (roll < 0.15) {
            // 大成功：协议成为赛道龙头，代币再翻3倍
            // 增量部分受 capBreakthroughGain 约束：单事件收益最多填满一次退休目标，
            // 杜绝大持仓×3导致单年数千万的复利爆炸与胜率失衡
            const newHoldings = applyChainHoldingScale(currentHoldings, 3);
            const cappedGain = capBreakthroughGain(newHoldings - currentHoldings, s);
            (s as any).chainHoldings = Math.round(currentHoldings + cappedGain);
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 2);
            s.careerStartSalary = s.currentMonthlySalary;
            s.stress = clamp(s.stress - 15, 0, 100);
            s.happiness = clamp(s.happiness + 22, 0, 100);
            s.pathFaith = clamp(s.pathFaith + 18, 0, 100);
            s.lifeLog.push(`你拿了融资，协议在三个月内成了赛道龙头。TVL稳定在5亿以上，代币又翻了3倍。你的持仓现在值${((s as any).chainHoldings).toLocaleString()}——这个数字让你终于敢想"退休"两个字了。社区里有人开始叫你"下一个中本聪"，你笑了笑没接。你知道这不是你一个人的功劳，是整个赛道的红利。但你接住了。`);
          } else if (roll < 0.5) {
            // 小成功
            const growHoldings = applyChainHoldingScale(currentHoldings, 1.6);
            const cappedGrow = capBreakthroughGain(growHoldings - currentHoldings, s);
            (s as any).chainHoldings = Math.round(currentHoldings + cappedGrow);
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.5);
            s.careerStartSalary = s.currentMonthlySalary;
            s.stress = clamp(s.stress - 5, 0, 100);
            s.happiness = clamp(s.happiness + 12, 0, 100);
            s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
            s.lifeLog.push(`你拿了融资，协议稳步发展。TVL没有继续暴涨，但也没崩。代币又涨了60%，你的持仓增值了，月薪也翻了。你离退休又近了一步，但还需要时间。你看着链上数据，觉得这条路虽然慢，但方向是对的。HODL，继续HODL。`);
          } else {
            // 差一点：赛道冷却，代币回落
            (s as any).chainHoldings = Math.round(currentHoldings * 0.7);
            s.stress = clamp(s.stress + 10, 0, 100);
            s.happiness = clamp(s.happiness + 3, 0, 100);
            s.lifeLog.push(`你拿了融资，但赛道热度散得比你预期的快。新链崛起分流了TVL，你的协议从"赛道第一"变成了"赛道前三"。代币从高点回落了30%，你的持仓缩水了。你看着那个跌下来的K线，安慰自己：至少协议还在跑，社区还在，代币还有价值。但你也知道：如果当时清仓了，你现在已经在海滩上了。`);
          }
        },
        log: '你选择了HODL并拿融资。链上的信条是"做时间的朋友"，但有时候时间不是朋友。',
      },
      {
        id: 'partial_exit',
        label: '卖一半留一半，用稳定币建生态基金',
        description: '清仓50%落袋为安，剩下的50%继续赌。用套现的钱建一个生态基金，投资赛道里的其他项目，分散押注。',
        hint: '稳健对冲 · 存款大增 · 持仓减半 · 被动收入+ · 无大成功可能 · 但风险最低',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          const annualExpense = s.annualBaseCost + (s.currentMortgageCost || 0);
          const currentHoldings = (s as any).chainHoldings || 0;
          const cashedOut = capBreakthroughGain(Math.round(currentHoldings * 0.5), s);
          (s as any).chainHoldings = Math.round(currentHoldings * 0.5);
          s.currentSavings += cashedOut;
          s.passiveIncome += Math.round(annualExpense * 0.3);
          s.stress = clamp(s.stress - 8, 0, 100);
          s.happiness = clamp(s.happiness + 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.lifeLog.push(`你卖了一半，留了一半。到账${cashedOut.toLocaleString()}——这笔钱让你不再焦虑"明天暴跌怎么办"。剩下的一半仓位继续在链上跑，你用套现的钱投了三个赛道里的早期项目，其中一个后来也翻了三倍。你没有一夜封神，但你也永远不会归零。你看着稳定币理财的年化收益和链上还在跳动的持仓数字，觉得这才是真正的"去中心化"——不把命运押在一个标的上。`);
        },
        log: '你选择了半仓退出+生态基金。不是最刺激的，但你终于睡了个好觉。',
      },
    ],
  },

  // ============================================================
  // 数字游牧民 · 大成功：硅谷巨头年度框架合同
  // ============================================================
  {
    id: 'breakthrough_digital_nomad',
    title: '那封来自硅谷的邮件',
    pathId: 'digital_nomad',
    ageRange: [29, 55],
    priority: 9,
    weight: 60,
    oncePerGame: true,
    eventType: 'milestone',
    sceneTag: 'breakthrough',
    conditions: (s: GameState) => s.isAllInPath === true && (s.pathSkills?.remoteSkill || 0) >= 50,
    narrative:
      '邮件标题是"Annual Partnership Proposal"，发件人是某硅谷巨头的供应商管理部门。你以为是钓鱼邮件，点开发现是真的：他们签了年度框架合同，把你列为"优选供应商"，年度保底金额是你年薪的8倍——而这只是保底，实际派单可能是保底的2-3倍。\n' +
      '合伙人巴西设计师在视频里激动得语无伦次："这他妈是XX公司啊！签了我们这辈子不用愁了！"但你冷静下来看到小字：要保证"7×24小时响应"、团队随时有人在线，还有排他条款不能用竞品。你坐在大理阳台上，苍山的风很舒服。你All In是为了自由，而现在"自由"和"财富"摆在面前，选一个就要牺牲另一个。',
    options: [
      {
        id: 'sign_exclusive',
        label: '签排他合同，锁定这笔大钱',
        description: '接受所有条件。保底收入让你财务自由，但你必须为这个客户随时待命。',
        hint: '赌保底+派单量 · 大成功则被动收入覆盖退休 · 小成功也大幅推进',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          const annualExpense = s.annualBaseCost + (s.currentMortgageCost || 0);
          const roll = Math.random();
          if (roll < 0.15) {
            // 大成功：派单量远超保底，被动收入直接满足退休条件
            s.passiveIncome += annualExpense;
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 3);
            s.careerStartSalary = s.currentMonthlySalary;
            s.stress = clamp(s.stress - 15, 0, 100);
            s.happiness = clamp(s.happiness + 25, 0, 100);
            s.pathFaith = clamp(s.pathFaith + 15, 0, 100);
            s.lifeLog.push(`你签了合同。第一年的实际派单量是保底的2.5倍——你的团队根本忙不过来，你不得不又招了四个人。但钱像潮水一样涌进来，你的被动收入（框架合同续约性质）直接覆盖了你全年的生活开支。你终于可以认真想"退休"或者"半退休"了。Maya给你发了一张画——是你第一天走进清迈那家咖啡馆的背影，她在背面写了"你终于不用跑了"。你坐在大理的阳台上算了一笔账：就算明天客户不续约，你攒下的钱也够你不工作活十年。你笑了——原来自由不是"不被管"，是"可以不干"。`);
          } else if (roll < 0.5) {
            // 小成功
            s.passiveIncome += Math.round(annualExpense * 0.5);
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 2);
            s.careerStartSalary = s.currentMonthlySalary;
            s.stress = clamp(s.stress - 8, 0, 100);
            s.happiness = clamp(s.happiness + 15, 0, 100);
            s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
            s.lifeLog.push(`你签了合同。第一年派单量不错，大概是保底的1.5倍。你的月薪翻了2倍，被动收入也起来了一部分。离"不工作也能活"还有距离，但你已经不用为"下个月有没有单子"焦虑了。你看着排得满满的交付日历，觉得这是一种幸福的烦恼——至少你在洱海边的咖啡馆里烦恼，而不是在格子间里。`);
          } else {
            // 差一点：派单量不及预期
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.5);
            s.careerStartSalary = s.currentMonthlySalary;
            s.stress = clamp(s.stress + 5, 0, 100);
            s.happiness = clamp(s.happiness + 8, 0, 100);
            s.lifeLog.push(`你签了合同，但实际派单量只有保底的80%——客户内部调整，很多项目走了另一条采购线。你的月薪涨了50%，但你为了"7×24响应"付出了排他性的代价，却没拿到预期的回报。你看着合同上那条排他条款，叹了口气。大公司的合同是蜜糖也是枷锁，你尝到了甜，也感觉到了绑。`);
          }
        },
        log: '你签了硅谷巨头的合同。钱进来了，但"随时待命"这四个字，让自由打了折扣。',
      },
      {
        id: 'negotiate_terms',
        label: '谈判去掉排他条款，少拿保底换自由',
        description: '和客户谈，去掉排他条款和7×24要求。保底减半，但保住接其他单的自由。',
        hint: '赌多客户策略 · 大成功则多客户叠加满足退休 · 小成功月薪翻倍 · 稳健',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          const annualExpense = s.annualBaseCost + (s.currentMortgageCost || 0);
          const roll = Math.random();
          if (roll < 0.15) {
            // 大成功：去掉排他后反而签了更多大客户
            s.passiveIncome += annualExpense;
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 2.5);
            s.careerStartSalary = s.currentMonthlySalary;
            s.stress = clamp(s.stress - 18, 0, 100);
            s.happiness = clamp(s.happiness + 28, 0, 100);
            s.pathFaith = clamp(s.pathFaith + 18, 0, 100);
            s.lifeLog.push(`你去掉了排他条款，保底减了40%。但自由身让你在接下来的半年里又签了两个中型客户——他们的项目加起来比那家硅谷巨头的保底还多。你的被动收入（长期合同）直接覆盖了全部生活开支。你看着Slack里三个不同时区的客户群同时闪烁，觉得这才是你想要的"游民公司"——不绑在一棵树上，而是在森林里飞。你终于可以退休了，但你不想退——这种生活太爽了。`);
          } else if (roll < 0.5) {
            // 小成功
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.8);
            s.careerStartSalary = s.currentMonthlySalary;
            s.passiveIncome += Math.round(annualExpense * 0.3);
            s.stress = clamp(s.stress - 5, 0, 100);
            s.happiness = clamp(s.happiness + 15, 0, 100);
            s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
            s.lifeLog.push(`你去掉了排他条款，保底少了，但你保住了接其他单的自由。接下来半年你又签了一个中型客户，收入比纯保底还多一些。月薪翻了将近一倍，被动收入也起来了。离退休还有距离，但你在对的路上——多客户、不绑死、保持自由。你坐在阳台上喝着咖啡，觉得这才是"地理套利"的正确打开方式。`);
          } else {
            // 差一点
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.3);
            s.careerStartSalary = s.currentMonthlySalary;
            s.stress = clamp(s.stress, 0, 100);
            s.happiness = clamp(s.happiness + 8, 0, 100);
            s.lifeLog.push(`你去掉了排他条款，保底少了40%。但你以为会来的"其他大客户"并没有来——他们觉得你"不是优选供应商"，级别不够。你的月薪比纯保底还低了一些。你安慰自己：至少保住了自由，至少还能接其他单。但你也知道：有时候"自由"是"不够富"的另一个说法。`);
          }
        },
        log: '你选择了谈判保自由。多客户策略是对的，但需要时间验证。',
      },
      {
        id: 'hire_partner',
        label: '接合同但招一个合伙人扛响应',
        description: '签下大合同拿保底，但招一个前同事当COO负责7×24响应。你保住大部分收入，分出去一部分股权，换回自由。',
        hint: '赌合伙人靠谱 · 月薪×2 · 保底到手 · 但分出30%股权 · 中等风险',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          const annualExpense = s.annualBaseCost + (s.currentMortgageCost || 0);
          const roll = Math.random();
          if (roll < 0.15) {
            // 大成功：合伙人极其靠谱
            s.passiveIncome += Math.round(annualExpense * 0.8);
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 2.5);
            s.careerStartSalary = s.currentMonthlySalary;
            s.stress = clamp(s.stress - 15, 0, 100);
            s.happiness = clamp(s.happiness + 25, 0, 100);
            s.pathFaith = clamp(s.pathFaith + 15, 0, 100);
            s.lifeLog.push(`你签了合同，招了老同事当COO。TA比你还能扛事——你负责谈客户和方向，TA负责交付和响应。第一年实际派单量是保底的2倍，你的月薪翻了2.5倍，被动收入也起来了。最重要的是：你保住了自由。你在洱海边的咖啡馆开视频会，COO在办公室协调团队——你终于理解了"杠杆"的含义：不是自己什么都干，是找到对的人替你干。`);
          } else if (roll < 0.5) {
            // 小成功
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.8);
            s.careerStartSalary = s.currentMonthlySalary;
            s.passiveIncome += Math.round(annualExpense * 0.3);
            s.stress = clamp(s.stress - 5, 0, 100);
            s.happiness = clamp(s.happiness + 15, 0, 100);
            s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
            s.lifeLog.push(`你签了合同，招了COO。TA基本靠谱，虽然偶尔需要你救火。月薪翻了将近一倍，被动收入也起来了。你分出去了30%的股权，但你换回了70%的时间。你看着账上的数字和日历上的空白，觉得这笔交易值——钱可以再赚，时间过了就没了。`);
          } else {
            // 差一点：合伙人不太行
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.3);
            s.careerStartSalary = s.currentMonthlySalary;
            s.stress = clamp(s.stress + 8, 0, 100);
            s.happiness = clamp(s.happiness + 5, 0, 100);
            s.lifeLog.push(`你签了合同，招了COO，但TA的能力没撑住。大客户的几次紧急响应你不得不亲自上，半夜被电话叫醒的经历又回来了。你分出去了30%的股权，却没有换回等量的自由。你看着排得满满的日程，想：也许自由这件事，不能外包给别人。`);
          }
        },
        log: '你选择了招合伙人。用股权换自由——这笔交易划不划算，取决于你找到的人。',
      },
    ],
  },

  // ============================================================
  // 超级IP · 大成功：内容破圈 / 现象级传播
  // ============================================================
  {
    id: 'breakthrough_super_ip',
    title: '那条改变一切的短视频',
    pathId: 'super_ip',
    ageRange: [29, 55],
    priority: 9,
    weight: 60,
    oncePerGame: true,
    eventType: 'milestone',
    sceneTag: 'breakthrough',
    conditions: (s: GameState) => s.isAllInPath === true && (s.pathSkills?.contentSkill || 0) >= 50,
    narrative:
      '你在睡梦中被手机震醒——昨晚随手拍的那条短视频，12小时播放量突破了3000万，涨粉80万，评论区全是"这条视频改变了我的人生观"。没有脚本、没有补光、甚至没化妆，但它破圈了——企业家、大学生、退休老人、甚至明星都在转。\n' +
      '私信炸了：出版社问要不要出书，品牌方报价是你以前广告费的10倍，某综艺想让你做主讲师，酬劳是你两年收入的总和。你看着镜子里没洗脸的自己，知道窗口很短——破圈的热度可能两周就散。你必须在这两周里，把"运气"变成"事业"。',
    options: [
      {
        id: 'monetize_hard',
        label: '趁热度疯狂变现，能接的全接',
        description: '接广告、出书、上综艺、做付费课程。趁热度最大化收入，但可能透支声誉。',
        hint: '赌短期变现 · 大成功则被动收入满足退休 · 小成功也大幅推进 · 但有透支风险',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          const annualExpense = s.annualBaseCost + (s.currentMortgageCost || 0);
          const roll = Math.random();
          if (roll < 0.15) {
            // 大成功：破圈持续，变现爆炸
            // 被动收入增量受 capBreakthroughGain 约束：单次突破的被动收入增量不超过"年支出×1.5"，
            // 避免一次事件凭空加两年生活费导致的单年总资产跳变失真（真实人生中一次破圈不会让年被动收入翻数倍）
            const passiveBoost = capBreakthroughGain(Math.round(annualExpense * 1.5), s);
            s.passiveIncome += passiveBoost;
            (s as any).ipReputation = Math.min(100, (s as any).ipReputation + 30);
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 3);
            s.careerStartSalary = s.currentMonthlySalary;
            s.stress = clamp(s.stress - 10, 0, 100);
            s.happiness = clamp(s.happiness + 25, 0, 100);
            s.pathFaith = clamp(s.pathFaith + 18, 0, 100);
            s.lifeLog.push(`破圈的热度没有两周散去——它持续了整整三个月。你接了四个广告、出了一本畅销书、上了一档爆款综艺。付费课程上线第一天卖了200万。你的被动收入（课程+版权+长尾广告）直接覆盖了两年生活费，IP声誉也涨到了行业顶端。小棠给你发了一条私信，只有四个字："我就知道。"后面跟着一个23岁时你卡壳重说的视频截图——那是她关注你的第一天。你看着后台那个"矩阵总粉丝"突破500万的曲线，第一次觉得"超级IP"这四个字名副其实。你可以退休了，但你不退——因为你正在巅峰。`);
          } else if (roll < 0.5) {
            // 小成功
            s.passiveIncome += capBreakthroughGain(Math.round(annualExpense * 0.8), s);
            (s as any).ipReputation = Math.min(100, (s as any).ipReputation + 15);
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 2);
            s.careerStartSalary = s.currentMonthlySalary;
            s.stress = clamp(s.stress - 3, 0, 100);
            s.happiness = clamp(s.happiness + 15, 0, 100);
            s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
            s.lifeLog.push(`热度持续了一个月。你接了两个广告、出了书的提案、综艺邀约谈了一半没成。付费课程卖了50万。被动收入起来了，月薪翻了2倍，声誉涨了不少。离"退休级被动收入"还有一步，但你已经从"中腰部创作者"变成了"头部IP"。你看着粉丝数稳在300万，觉得这一波够你吃两年。`);
          } else {
            // 差一点：过度变现导致反噬
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.5);
            s.careerStartSalary = s.currentMonthlySalary;
            (s as any).ipReputation = Math.max(0, (s as any).ipReputation - 5);
            s.stress = clamp(s.stress + 12, 0, 100);
            s.happiness = clamp(s.happiness + 5, 0, 100);
            s.lifeLog.push(`你接了太多广告和合作，内容质量开始下降。破圈来的新粉丝觉得你"变味了"，评论区开始出现"恰烂饭"的声音。热度散得比你预期的快，粉丝掉了20万。你赚到了一笔钱，月薪也涨了，但你的声誉不升反降。你看着那些"取关"的提醒，明白了一件事：破圈是运气，留住人靠的是内容，而你为了短期变现透支了长期信任。`);
          }
        },
        log: '你选择了疯狂变现。钱进来了，但声誉这东西，丢起来比涨起来快十倍。',
      },
      {
        id: 'build_platform',
        label: '不接广告，趁热度做付费社区',
        description: '把破圈来的粉丝沉淀到付费社区。短期收入少，但建立可持续的被动收入。',
        hint: '赌长期社区 · 大成功则被动收入满足退休 · 小成功被动收入覆盖一半 · 慢但稳',
        hintColor: 'positive',
        stateEffect: (s: GameState) => {
          const annualExpense = s.annualBaseCost + (s.currentMortgageCost || 0);
          const roll = Math.random();
          if (roll < 0.15) {
            // 大成功：付费社区爆发
            // 被动收入增量受 capBreakthroughGain 约束（单次不超过年支出×1.5），避免一次爆社区加两年生活费
            const passiveBoost = capBreakthroughGain(Math.round(annualExpense * 1.5), s);
            s.passiveIncome += passiveBoost;
            (s as any).ipReputation = Math.min(100, (s as any).ipReputation + 25);
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.8);
            s.careerStartSalary = s.currentMonthlySalary;
            s.stress = clamp(s.stress - 18, 0, 100);
            s.happiness = clamp(s.happiness + 28, 0, 100);
            s.pathFaith = clamp(s.pathFaith + 20, 0, 100);
            s.lifeLog.push(`你没接广告，而是开了一个付费社区。破圈来的300万粉里有2%转化成了付费会员——每月199元。你看着后台那个"月度订阅收入"的数字，愣了：这比接广告多5倍，而且是每月持续到账的被动收入。你的社区成了行业里最大的垂直社群，声誉涨到了顶峰。你终于理解了什么叫"IP资产化"——不是卖广告位，是建一个属于你的城池。你可以退休了，因为这座城池自己会转。`);
          } else if (roll < 0.5) {
            // 小成功
            s.passiveIncome += capBreakthroughGain(Math.round(annualExpense * 0.8), s);
            (s as any).ipReputation = Math.min(100, (s as any).ipReputation + 18);
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.5);
            s.careerStartSalary = s.currentMonthlySalary;
            s.stress = clamp(s.stress - 8, 0, 100);
            s.happiness = clamp(s.happiness + 18, 0, 100);
            s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
            s.lifeLog.push(`你开了付费社区，转化率1%，月订阅收入比预期少一些，但也够覆盖你一半的生活开支了。你的被动收入起来了，声誉也涨了。离退休还有距离，但你建了一个"基本盘"——以后不管平台算法怎么变，你的核心粉丝在你的社区里，谁也拿不走。你看着社区里那些活跃的讨论，觉得这才叫"IP"，不是粉丝数，是愿意为你付费的人。`);
          } else {
            // 差一点
            s.passiveIncome += Math.round(annualExpense * 0.3);
            (s as any).ipReputation = Math.min(100, (s as any).ipReputation + 10);
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.2);
            s.careerStartSalary = s.currentMonthlySalary;
            s.stress = clamp(s.stress - 3, 0, 100);
            s.happiness = clamp(s.happiness + 10, 0, 100);
            s.lifeLog.push(`你开了付费社区，但转化率只有0.3%——破圈来的粉丝大多不是你的目标用户，他们只是被那条视频感动了一下，不会持续付费。社区只有几百人，月收入勉强够覆盖运营成本。你的被动收入起来了一点点，声誉也涨了一些。你看着那个冷清的社区论坛，安慰自己：至少种下了一颗种子，能不能长大，看以后的内容能不能接住。`);
          }
        },
        log: '你选择了建付费社区。慢，但种下的是一棵树，不是割一茬韭菜。',
      },
      {
        id: 'open_source_brand',
        label: '不变现，用破圈做行业倡议换长期声誉',
        description: '趁热度发起一个行业公益倡议/标准。不直接赚钱，但把破圈流量沉淀为行业影响力资产。',
        hint: '赌声誉变现 · 声誉大涨 · 月薪+50% · 无直接收入 · 但长期回报最高',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          const annualExpense = s.annualBaseCost + (s.currentMortgageCost || 0);
          const roll = Math.random();
          if (roll < 0.15) {
            // 大成功：倡议成为行业标准
            (s as any).ipReputation = Math.min(100, (s as any).ipReputation + 35);
            s.passiveIncome += annualExpense;
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 2);
            s.careerStartSalary = s.currentMonthlySalary;
            s.stress = clamp(s.stress - 15, 0, 100);
            s.happiness = clamp(s.happiness + 30, 0, 100);
            s.pathFaith = clamp(s.pathFaith + 20, 0, 100);
            s.lifeLog.push(`你没接广告，没建社区，而是趁破圈热度发起了一个行业倡议——为创作者建立版权保护标准。三个月后这个倡议被行业协会采纳，你成了"行业代言人"。你的声誉涨到了顶峰，企业客户排着队找你做顾问，被动收入直接覆盖了生活开支。你看着那些曾经骂你"恰烂饭"的人现在转发你的倡议，笑了——最好的变现不是卖东西，是让别人欠你人情。你可以退休了，因为你已经成了行业基础设施的一部分。`);
          } else if (roll < 0.5) {
            // 小成功
            (s as any).ipReputation = Math.min(100, (s as any).ipReputation + 22);
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.5);
            s.careerStartSalary = s.currentMonthlySalary;
            s.passiveIncome += Math.round(annualExpense * 0.4);
            s.stress = clamp(s.stress - 5, 0, 100);
            s.happiness = clamp(s.happiness + 18, 0, 100);
            s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
            s.lifeLog.push(`你发起了行业倡议，虽然没有成为"标准"，但引起了行业讨论。你的声誉大涨，几个企业客户主动找你做顾问，月薪翻了50%，被动收入也起来了一些。破圈的热度散了，但你的行业影响力留下了。你看着后台那条"虽然热度降了但你的名字被记住了"的评论，觉得这比接十条广告都值。`);
          } else {
            // 差一点：倡议没人理
            (s as any).ipReputation = Math.min(100, (s as any).ipReputation + 8);
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.2);
            s.careerStartSalary = s.currentMonthlySalary;
            s.stress = clamp(s.stress + 3, 0, 100);
            s.happiness = clamp(s.happiness + 8, 0, 100);
            s.lifeLog.push(`你发起了行业倡议，但热度散得太快，倡议没有引起足够的关注。你的声誉涨了一点，月薪也涨了一些，但你错过了破圈带来的最佳变现窗口。你看着那个只有几百转发的倡议帖，想：也许应该先赚钱再谈理想。但你也安慰自己：至少你没有透支信任，至少你的名字在行业里留下了一点正面的痕迹。`);
          }
        },
        log: '你选择了做行业倡议。不赚快钱，赌的是声誉的复利——但复利需要时间。',
      },
    ],
  },

  // ============================================================
  // 银发守夜人 · 大成功：模式全国推广 / 政策红利
  // ============================================================
  {
    id: 'breakthrough_silver_economy',
    title: '那辆停在门口的黑车',
    pathId: 'silver_economy',
    ageRange: [31, 55],
    priority: 9,
    weight: 60,
    oncePerGame: true,
    eventType: 'milestone',
    sceneTag: 'breakthrough',
    conditions: (s: GameState) => s.isAllInPath === true && (s.pathSkills?.managementSkill || 0) >= 50,
    narrative:
      '那辆黑色商务车上午十点停在你养老站门口。下来三个人，为首的是省民政厅养老服务处的副处长，笑着说"路过看看"——但你看到TA身后的人拿着相机和记录本，就知道这不是"路过"。他们在站里待了两小时：看流程、翻档案、和家属聊天、甚至看财务报表，你全程陪着，心里七上八下。\n' +
      '临走时副处长把你拉到一边："你这个模式很好。省里在推社区养老示范点，我想推荐你。评上了有专项补贴、政策背书、还能全省推广。"你手心在出汗——从"开了一家养老站"变成"创造养老模式"，这可能是你事业的转折点。但政府背书是双刃剑：更多监管、更严检查，还要你从"经营者"变成"管理者"，去别处开店、培训、建体系。你All In时只想做好一家养老站，现在机会让你做一百家。你看着下棋的老人们，必须在回复之前想清楚。',
    options: [
      {
        id: 'go_national',
        label: '申请示范点，全省推广加盟',
        description: '接受政策红利，把模式复制到全省。开加盟店、做培训、建标准。从经营者变成模式输出方。',
        hint: '赌扩张成功 · 大成功则月营收满足退休 · 小成功月营收翻倍 · 但管理压力巨大',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          const biz = (s as any).silverBusiness;
          const roll = Math.random();
          if (roll < 0.15) {
            // 大成功：全省推广成功
            if (biz) {
              biz.monthlyRevenue = Math.max(biz.monthlyRevenue * 5, 80000);
              biz.reputation = Math.min(100, biz.reputation + 25);
            }
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 3);
            s.careerStartSalary = s.currentMonthlySalary;
            s.passiveIncome += Math.round(s.annualBaseCost * 0.8);
            s.stress = clamp(s.stress - 10, 0, 100);
            s.happiness = clamp(s.happiness + 25, 0, 100);
            s.pathFaith = clamp(s.pathFaith + 20, 0, 100);
            s.lifeLog.push(`你评上了示范点。接下来半年你在全省开了12家加盟店，你的角色从"经营者"变成了"模式输出方"——每家加盟店交品牌费和管理费，你提供培训、系统和标准。月营收翻了5倍，被动收入（加盟费+品牌使用费）也起来了。你站在第十五家加盟店的开业仪式上，想起当初在老家那个小门面贴第一张招牌的日子——那时候你只是想"伺候好二十几个老人"。现在你管着三百多个老人的幸福，和十二个家庭的生计。你可以退休了，但你不退——因为这件事比退休更有意义。`);
          } else if (roll < 0.5) {
            // 小成功
            if (biz) {
              biz.monthlyRevenue = Math.max(biz.monthlyRevenue * 2.5, 40000);
              biz.reputation = Math.min(100, biz.reputation + 15);
            }
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 2);
            s.careerStartSalary = s.currentMonthlySalary;
            s.stress = clamp(s.stress - 3, 0, 100);
            s.happiness = clamp(s.happiness + 15, 0, 100);
            s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
            s.lifeLog.push(`你评上了示范点，开了4家加盟店。扩张没有预期顺利——有两家加盟店的负责人管理能力不够，老人投诉增多，你不得不亲自去救火。月营收翻了2.5倍，声誉也涨了，但你的精力被分散得很厉害。你看着那四家店的运营报表，觉得"扩张"和"做好"之间，还有一个很长的学习曲线。但至少方向对了，走下去就是。`);
          } else {
            // 差一点：扩张不顺
            if (biz) {
              biz.monthlyRevenue = Math.max(biz.monthlyRevenue * 1.3, 20000);
              biz.reputation = Math.max(0, biz.reputation - 5);
            }
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.3);
            s.careerStartSalary = s.currentMonthlySalary;
            s.stress = clamp(s.stress + 18, 0, 100);
            s.happiness = clamp(s.happiness + 5, 0, 100);
            s.lifeLog.push(`你评上了示范点，但扩张出了问题。第一家加盟店就遇到了管理危机——负责人卷了一笔预收的护理费跑了。你不得不自掏腰包填窟窿，声誉反而受损。民政厅的人虽然没怪你，但你看得出来他们对"推广"的信心打了折扣。月营收只涨了30%，你的压力却翻了一倍。你看着那个烂摊子，想：也许应该先把一家店做到极致，再谈复制。`);
          }
        },
        log: '你选择了全省推广。做一家店是生意，做一百家是事业——但事业比生意难管一百倍。',
      },
      {
        id: 'stay_single',
        label: '不扩张，把这一家做成标杆',
        description: '拒绝推广。拿补贴和背书，但只做这一家，做到极致。稳，但天花板低。',
        hint: '稳健 · 月薪+50% · 声誉大涨 · 被动收入+补贴 · 但不会暴富',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          const biz = (s as any).silverBusiness;
          if (biz) {
            biz.reputation = Math.min(100, biz.reputation + 20);
            biz.monthlyRevenue = Math.max(biz.monthlyRevenue * 1.3, 25000);
          }
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.5);
          s.careerStartSalary = s.currentMonthlySalary;
          s.passiveIncome += Math.round(s.annualBaseCost * 0.3);
          s.currentSavings += Math.round(s.annualBaseCost * 1);
          s.stress = clamp(s.stress - 12, 0, 100);
          s.happiness = clamp(s.happiness + 18, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.lifeLog.push(`你拿了示范点的补贴和背书，但你拒绝了推广。你把这笔资源全砸在了这一家店上——升级了设备、涨了护工工资、扩建了活动室。你的店成了全省的标杆，每个月都有人来参观学习。月营收涨了30%，声誉涨到了行业顶尖，政府补贴也成了一笔稳定的被动收入。你看着那些安心的老人和家属，觉得"做好一件事"比"做一百件半吊子"更对得起自己。你没有暴富，但你睡得着觉。`);
        },
        log: '你选择了只做一家。少赚了钱，但你保住了"做好养老"的初心——这比钱值钱。',
      },
      {
        id: 'partner_with_gov',
        label: '与政府合资，他们出场地你出运营',
        description: '不自己扩张也不只做一家。和民政部门合资，政府出场地和政策，你出团队和标准。共担风险共享收益。',
        hint: '赌政商合作 · 月薪×2 · 被动收入+ · 声誉+ · 但受制于政府效率 · 中等风险',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          const biz = (s as any).silverBusiness;
          const roll = Math.random();
          if (roll < 0.15) {
            // 大成功：政商合作顺畅
            if (biz) {
              biz.monthlyRevenue = Math.max(biz.monthlyRevenue * 3, 60000);
              biz.reputation = Math.min(100, biz.reputation + 20);
            }
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 2);
            s.careerStartSalary = s.currentMonthlySalary;
            s.passiveIncome += Math.round(s.annualBaseCost * 0.6);
            s.stress = clamp(s.stress - 8, 0, 100);
            s.happiness = clamp(s.happiness + 22, 0, 100);
            s.pathFaith = clamp(s.pathFaith + 18, 0, 100);
            s.lifeLog.push(`你和民政部门合资，政府出场地，你出团队和标准。第一年开了5家社区养老站，政府帮你搞定了场地审批、消防检查、医保对接——这些你一个人跑三年都跑不下来的事。月营收翻了3倍，被动收入（管理费分成）也起来了。你站在第五家站的开业仪式上，和副处长一起剪彩。你想：以前你觉得"和政府合作"是束缚，现在你明白了——在这个行业，政府不是对手，是最大的杠杆。`);
          } else if (roll < 0.5) {
            // 小成功
            if (biz) {
              biz.monthlyRevenue = Math.max(biz.monthlyRevenue * 1.8, 35000);
              biz.reputation = Math.min(100, biz.reputation + 12);
            }
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.5);
            s.careerStartSalary = s.currentMonthlySalary;
            s.passiveIncome += Math.round(s.annualBaseCost * 0.3);
            s.stress = clamp(s.stress - 3, 0, 100);
            s.happiness = clamp(s.happiness + 12, 0, 100);
            s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
            s.lifeLog.push(`你和政府合资开了3家站。合作基本顺畅，但政府效率有时候让你抓狂——一个审批等了两个月。月营收翻了将近一倍，被动收入也起来了。你看着那3家站，觉得这条路虽然慢，但不用自己扛全部风险。你学会了和官僚体系打交道——这是做养老绕不过去的一课。`);
          } else {
            // 差一点：合作受阻
            if (biz) {
              biz.monthlyRevenue = Math.max(biz.monthlyRevenue * 1.2, 18000);
              biz.reputation = Math.max(0, biz.reputation - 3);
            }
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.2);
            s.careerStartSalary = s.currentMonthlySalary;
            s.stress = clamp(s.stress + 12, 0, 100);
            s.happiness = clamp(s.happiness + 5, 0, 100);
            s.lifeLog.push(`你和政府合资，但合作比你预期的复杂。领导换了，之前的承诺打了折扣，两个站的建设拖延了半年。月营收只涨了20%，你的精力却被无穷无尽的会议和公文消耗。你看着那份盖了八个章还没批下来的文件，想：也许"和政府合作"四个字说起来轻松，做起来全是摩擦力。`);
          }
        },
        log: '你选择了政商合资。在这个行业，政府是最大的杠杆——但杠杆的另一面是约束。',
      },
    ],
  },

  // ============================================================
  // 生物赌徒 · 大成功：押中的公司被溢价收购 / IPO
  // ============================================================
  {
    id: 'breakthrough_bio_gambler',
    title: '那个你等了五年的电话',
    pathId: 'bio_gambler',
    ageRange: [29, 55],
    priority: 9,
    weight: 60,
    oncePerGame: true,
    eventType: 'milestone',
    sceneTag: 'breakthrough',
    conditions: (s: GameState) => s.isAllInPath === true && (s.pathSkills?.bioKnowledge || 0) >= 50,
    narrative:
      '电话是凌晨两点打来的，是你重仓的NAD+前体公司CEO。TA声音发抖："我们被收购了。某大药厂溢价收购，全现金。"TA报出那个数字时你以为听错了——你的股份按收购价算，是投入的12倍。\n' +
      '你放下电话在黑暗里坐了很久。你等这个电话等了五年——五年前All In时所有人说你疯了，投一个还在二期临床的抗衰公司，但你赌TA们能成。现在赌赢了，却是以你没有准备过的方式：不是IPO，是被收购。你可以拿巨款走人，但如果产品未来卖得更好，你就享受不到了。你有72小时决定：变现离场，还是赌未来IPO。你的生物年龄比实际年轻5岁——身体在说你有时间赌，理智在说12倍已经是奇迹。',
    options: [
      {
        id: 'accept_buyout',
        label: '接受收购，12倍回报套现',
        description: '接受大药厂收购，一次性变现。12倍回报，落袋为安，但放弃未来可能的更高回报。',
        hint: '赌落袋为安 · 大成功则投资组合满足退休 · 小成功也大幅推进',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          const annualExpense = s.annualBaseCost + (s.currentMortgageCost || 0);
          const currentBio = (s as any).bioPortfolio || 0;
          const roll = Math.random();
          if (roll < 0.15) {
            // 大成功：收购价远超预期
            const windfall = capBreakthroughGain(Math.max(annualExpense * 20, currentBio * 12), s);
            (s as any).bioPortfolio = 0;
            s.currentSavings += windfall;
            s.stress = clamp(s.stress - 25, 0, 100);
            s.happiness = clamp(s.happiness + 30, 0, 100);
            s.pathFaith = clamp(s.pathFaith + 18, 0, 100);
            const mirrorLine = (s as any).injectedSelf === true
              ? '那天早上你看着镜子里的自己，白发比同龄人少、皮肤比同龄人紧、眼睛里还有光——赌对了。'
              : '';
            s.lifeLog.push(`你接受了收购。到账那一刻你盯着银行APP上的数字看了十分钟——${windfall.toLocaleString()}。五年前你投进去的钱翻了12倍。你打电话给你妈，说了一句"妈，我以后不用上班了"，然后哭了。你All In这条路是为了赌"长寿"，但最讽刺的是：你赌到的不是长寿技术本身，是别人对你押注的技术愿意出的价格。你不在乎。你赢了。你可以退休了，可以继续投下一个项目，可以去做任何你想做的事。这五年值了。${mirrorLine}`);
          } else if (roll < 0.5) {
            // 小成功
            const windfall = capBreakthroughGain(Math.max(annualExpense * 7, currentBio * 6), s);
            (s as any).bioPortfolio = Math.round(currentBio * 0.4);
            s.currentSavings += windfall;
            s.stress = clamp(s.stress - 12, 0, 100);
            s.happiness = clamp(s.happiness + 18, 0, 100);
            s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
            s.lifeLog.push(`你接受了收购，套现了60%的股份，留了40%赌产品上市后的里程碑付款。到账${windfall.toLocaleString()}——这笔钱让你离"长寿自由"近了一大步。你的生物年龄检测依然年轻，你还有时间投下一个项目。你看着剩下的40%股份，觉得这是最完美的状态：落了一半袋为安，还留了一半赌未来。`);
          } else {
            // 差一点：收购价不及预期
            const windfall = capBreakthroughGain(Math.max(annualExpense * 2, currentBio * 2), s);
            (s as any).bioPortfolio = 0;
            s.currentSavings += windfall;
            s.stress = clamp(s.stress - 5, 0, 100);
            s.happiness = clamp(s.happiness + 10, 0, 100);
            s.lifeLog.push(`你接受了收购，但最终收购价比预期的低——因为二期临床数据在最终谈判阶段被质疑，大药厂压了价。你的回报从12倍缩水到了2倍。到账${windfall.toLocaleString()}——赚了，但远不够退休。你安慰自己：2倍也不错了，至少没亏。但你心里清楚：如果你在二期数据出来前就卖了，回报可能是8倍。在生物科技这条路上，时机就是一切，而你差了一步。`);
          }
        },
        log: '你选择了套现。12倍的梦变成了2-12倍的现实——但至少，你不用再等了。',
      },
      {
        id: 'reject_buyout',
        label: '拒绝收购，赌未来IPO',
        description: '不接受收购。赌产品上市后IPO估值更高。12倍摆在面前不要，赌100倍。',
        hint: '赌IPO · 大成功则投资组合×5 · 小成功也翻倍 · 但有40%概率什么都没有',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          const currentBio = (s as any).bioPortfolio || 0;
          const roll = Math.random();
          if (roll < 0.15) {
            // 大成功：产品上市，IPO暴涨
            (s as any).bioPortfolio = Math.round(currentBio * 5);
            s.stress = clamp(s.stress - 15, 0, 100);
            s.happiness = clamp(s.happiness + 30, 0, 100);
            s.pathFaith = clamp(s.pathFaith + 25, 0, 100);
            s.lifeLog.push(`你拒绝了收购。又等了两年，产品获批上市，公司IPO。你的股份在上市首日翻了5倍——你手里那个数字让你终于敢想"改变人类寿命"不只是口号了。陈医生给你发了一条消息："没白在群里看你们闹。"你All In时赌的是"这个技术会成"，现在它成了，而你没有在12倍的时候卖掉。你赌对了100倍的那个"对的"。你坐在实验室走廊的长椅上（你还在亲自参与），想起那个凌晨两点的电话——如果你当时说了"接受"，一切都不会发生。`);
          } else if (roll < 0.5) {
            // 小成功：IPO但估值一般
            (s as any).bioPortfolio = Math.round(currentBio * 1.8);
            s.stress = clamp(s.stress - 5, 0, 100);
            s.happiness = clamp(s.happiness + 15, 0, 100);
            s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
            s.lifeLog.push(`你拒绝了收购。两年后公司IPO了，但估值不如预期——市场竞争激烈，产品定价压力很大。你的股份翻了1.8倍——比收购价好一些，但没有到"改变人生"的级别。你安慰自己：至少没卖在12倍，多赚了50%。但你也知道：你多等了两年、多承担了两年风险，换来的只是"好一些"。在赌桌上，"好一些"和"翻倍"是两个世界。`);
          } else {
            // 差一点：产品上市失败，股份归零
            (s as any).bioPortfolio = 0;
            s.stress = clamp(s.stress + 25, 0, 100);
            s.happiness = clamp(s.happiness - 10, 0, 100);
            s.pathFaith = clamp(s.pathFaith - 15, 0, 100);
            s.lifeLog.push(`你拒绝了收购。一年后，三期临床失败了。产品无法上市，公司宣布破产清算，你的股份归零。那个12倍的收购价成了你这辈子最后悔的"不"。你坐在空荡荡的办公室里，想起那个凌晨两点的电话——如果你当时说了"接受"，你现在已经在海滩上了。但你说了"不"。在生物科技这条路上，"不"的代价可能是零。你深呼吸，告诉自己：你还有时间，你还有别的投资，你还可以再来。但你心里清楚：那个12倍，不会再来了。`);
          }
        },
        log: '你选择了拒绝。赌100倍的人，要么封神，要么归零——没有中间地带。',
      },
      {
        id: 'reinvest_fund',
        label: '接受收购，但用套现的钱创立长寿基金',
        description: '接受收购落袋为安，但不当退出者——用这笔钱成立一个长寿研究基金，投资赛道里的早期项目。从赌徒变成庄家。',
        hint: '稳健转型 · 存款大增 · 被动收入+ · 生物知识大涨 · 无大成功可能 · 但从"赌"变"经营"',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          const annualExpense = s.annualBaseCost + (s.currentMortgageCost || 0);
          const currentBio = (s as any).bioPortfolio || 0;
          const windfall = Math.max(annualExpense * 8, currentBio * 8);
          (s as any).bioPortfolio = 0;
          s.currentSavings += Math.round(windfall * 0.6);
          s.passiveIncome += Math.round(annualExpense * 0.5);
          s.pathSkills = { ...s.pathSkills, bioKnowledge: (s.pathSkills?.bioKnowledge || 50) + 15 };
          s.stress = clamp(s.stress - 15, 0, 100);
          s.happiness = clamp(s.happiness + 22, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 15, 0, 100);
          s.lifeLog.push(`你接受了收购，到账${Math.round(windfall * 0.6).toLocaleString()}。但你没有像其他套现的人一样买房子、买车子、买自由——你拿出一半成立了一个长寿研究基金，专门投早期抗衰项目。你从"押注一家公司"变成了"押注整个赛道"。你的被动收入（基金管理费+投资回报分成）起来了，你的生物知识也涨了——因为你现在要审每一个来融资的项目。你坐在基金办公室里，看着墙上那行"让人类多活二十年"的标语，想起五年前你All In时也是这句话。区别是：那时候你在赌，现在你在经营。赌徒会归零，庄家不会。你没有一夜封神，但你永远不会出局。`);
        },
        log: '你选择了从赌徒变庄家。不是最刺激的，但你终于掌握了自己的概率。',
      },
    ],
  },
];

registerNarrativeEvents(breakthroughEvents);
