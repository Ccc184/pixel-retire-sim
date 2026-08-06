/**
 * 开公司深化剧情 · 5条路径（银发创业已有公司剧情，跳过）
 *
 * 触发机制：
 *   - All In 后 2-3 年触发（年龄范围 [29, 55]）
 *   - 条件：isAllInPath === true 且 hasCompany === false
 *   - 每条路径 1 个"是否开公司"的十字路口事件
 *   - 开公司后设标记 hasCompany: true
 *
 * 设计意图：
 *   All In 后职业统一为"自由职业"，缺乏"从个人接单升级为公司化运营"
 *   的深化线。开公司事件让玩家体验创业的刺激感——收入更高但支出也更高，
 *   净收入短期可能下降，长期上升；压力增加但成就感带来幸福。
 *
 * 后续运营事件（hasCompany === true 后可触发）：
 *   - 拿到融资/大客户签约（收入暴增）
 *   - 核心员工离职/竞品出现（压力增加，收入波动）
 *   - 公司遇到危机（合规/资金链/公关）
 * ================================================================
 */
import type { NarrativeEvent, GameState } from '../types/global.d.js';
import { registerNarrativeEvents } from './narrative-registry.js';
import { clamp } from '../utils/clamp.js';
import { fmtExact, fmtNum } from '../utils/format.js';

const companyEvents: NarrativeEvent[] = [

  // ============================================================
  // AI共生者 · 开公司
  // ============================================================
  {
    id: 'company_ai_symbiote',
    title: '第一张发票',
    pathId: 'ai_symbiote',
    ageRange: [29, 55],
    priority: 8,
    weight: 100,
    oncePerGame: true,
    eventType: 'milestone',
    sceneTag: 'startup',
    conditions: (s: GameState) => s.isAllInPath === true && s.hasCompany === false,
    narrative:
      '一封邮件躺在收件箱，标题是"AI转型战略合作意向"。某上市公司的数字化负责人，方案预算写得明明白白：一期80万，二期可能追加到200万。但你笑不出来——邮件最后一句是："请提供贵司增值税专用发票信息。"\n' +
      '贵司。你这间"公司"就是个连营业执照都没有的自由职业者。上市公司财务卡得死，没有公司主体这单就飞了。你打开三个标签页：注册流程、共享办公报价、AI工程师薪资。开公司后每月固定成本多出六七万，下月没新单就得自掏腰包发工资。你看着自己那台贴满贴纸的笔记本——一个人一台电脑月入几万很自由，但企业级项目要的是"公司"这块招牌、团队并行交付、出事有人兜底。你回信："发票问题我这边解决，下周一面谈。"然后打开了工商注册网站。',
    options: [
      {
        id: 'start_company',
        label: '注册AI工作室，组建团队',
        description: '注册科技公司，租办公室，雇3个工程师。从个人接单升级为企业级AI转型服务商。',
        hint: '职业→AI工作室创始人 · 月薪×1.7 · 年支出+25% · 压力+18 · 幸福+8 · 信念+10',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          const beforeSalary = s.currentMonthlySalary;
          const beforeCost = s.annualBaseCost;
          s.hasCompany = true;
          s.currentProfession = 'AI工作室创始人';
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.7);
          s.careerStartSalary = s.currentMonthlySalary;
          // AI工作室：共享办公+3个工程师，但AI工具降低了人力成本，+25%
          s.annualBaseCost = Math.round(s.annualBaseCost * 1.25);
          s.stress = clamp(s.stress + 18, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.lifeLog.push(`你注册了一家AI科技公司，租了共享办公的四个工位，签了三个工程师。第一个月发工资那天你看着银行账户划出去的数字心在滴血——但你拿到那张80万合同的时候，第一次觉得"创始人"三个字有重量。月薪从${fmtExact(beforeSalary)}涨到${fmtExact(s.currentMonthlySalary)}，年支出从${fmtNum(beforeCost)}涨到${fmtNum(s.annualBaseCost)}。你不再是"一个人"了，你是一个团队。`);
        },
        log: '你注册了AI工作室，雇佣了第一批工程师。从今天起，你不再是一个自由职业者，而是一家AI公司的创始人。',
      },
      {
        id: 'stay_individual',
        label: '继续做个人工作室',
        description: '不注册公司，找朋友公司挂靠开票。虽然分走20%，但保住自由。',
        hint: '压力+5 · 信念-5 · 维持自由职业',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
          s.lifeLog.push(`你找了个朋友的公司挂靠开票，分走20%。那单80万的活你实际到手64万——不少，但你心里清楚：每多接一单企业项目，你就多被"没有公司主体"这件事卡一次。你看着招聘网站上那些AI工程师的简历，关掉了页面。一个人自由是自由，但天花板也摆在那里。`);
        },
        log: '你选择了继续做个人工作室。自由保住了，但你也知道，有些单子你永远接不到。',
      },
    ],
  },

  // ============================================================
  // 链上原住民 · 开公司
  // ============================================================
  {
    id: 'company_chain_native',
    title: 'DAO的边界',
    pathId: 'chain_native',
    ageRange: [29, 55],
    priority: 8,
    weight: 100,
    oncePerGame: true,
    eventType: 'milestone',
    sceneTag: 'startup',
    conditions: (s: GameState) => s.isAllInPath === true && s.hasCompany === false,
    narrative:
      'Discord里吵了三天了。起因是一封VC邮件：某知名加密基金想给你的协议领投500万美元，估值你敢都不敢想——但条件只有一个，必须有注册法人实体，不能只是一个DAO。社区分成两派：一派说"拿了VC的钱就背叛了去中心化"，一派说"没钱怎么招全职工程师"。\n' +
      '你比谁都清楚这个矛盾的重量。协议TVL涨到了临界点，代码审计、安全运营、跨链桥都要钱，靠社区兼职撑不住了。可你也见过太多"去中心化项目"拿了融资就变成"带区块链外壳的创业公司"——创始人套现走人，代币归零。你的初心是"代码即法律"，不是"再开一家Web2公司"。凌晨四点，你盯着那封邮件和刷屏的"NEVER SELL OUT"表情包，在群里打了一行字："如果注册公司，但治理仍走DAO，会怎样？"发出去后，没人回。',
    options: [
      {
        id: 'start_company',
        label: '注册区块链公司，组建核心团队',
        description: '接受融资，注册法人实体，组建全职核心团队。做自己的协议生态，但接受"公司化"的现实。',
        hint: '职业→区块链公司CEO · 月薪×1.5 · 年支出+30% · 压力+20 · 幸福+6 · 信念+10',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          const beforeSalary = s.currentMonthlySalary;
          const beforeCost = s.annualBaseCost;
          s.hasCompany = true;
          s.currentProfession = '区块链公司CEO';
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.5);
          s.careerStartSalary = s.currentMonthlySalary;
          // 链上融资公司：新加坡注册+5个工程师+法务，远程为主+30%
          s.annualBaseCost = Math.round(s.annualBaseCost * 1.30);
          s.stress = clamp(s.stress + 20, 0, 100);
          s.happiness = clamp(s.happiness + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.lifeLog.push(`你接受了那轮融资，在新加坡注册了公司，签了五个全职工程师和一个法务。社区里有人骂你"sellout"，有人祝你"build bigger"。你在群里发了一句："公司是壳，协议是核，DAO治理不变。"——但你知道这句话能不能兑现，你自己也没底。月薪从${fmtExact(beforeSalary)}涨到${fmtExact(s.currentMonthlySalary)}，年支出从${fmtNum(beforeCost)}涨到${fmtNum(s.annualBaseCost)}。你从一个链上的自由人，变成了一个要给员工发工资的CEO。`);
        },
        log: '你注册了区块链公司，拿到了融资。你告诉自己这只是"加速工具"，但你心里清楚，回不去了。',
      },
      {
        id: 'hybrid_dao',
        label: '混合模式：注册公司，治理仍走DAO',
        description: '注册一个最小化法人实体只为融资和合规，核心决策仍由DAO投票。折中方案，两头都不彻底。',
        hint: '职业→区块链公司CEO · 月薪×1.25 · 年支出+15% · 压力+12 · 幸福+5 · 信念+5',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          const beforeSalary = s.currentMonthlySalary;
          const beforeCost = s.annualBaseCost;
          s.hasCompany = true;
          s.currentProfession = '区块链公司CEO';
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.25);
          s.careerStartSalary = s.currentMonthlySalary;
          // 混合DAO：最小化法人实体，只为合规融资+15%
          s.annualBaseCost = Math.round(s.annualBaseCost * 1.15);
          s.stress = clamp(s.stress + 12, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.lifeLog.push(`你选了一条折中路：注册了一个最小化的法人实体，只为融资和合规用，协议的核心决策仍走DAO投票。VC不太满意但接受了，社区骂声小了一些但没停。你两边都要照顾，两边都不讨好。月薪从${fmtExact(beforeSalary)}涨到${fmtExact(s.currentMonthlySalary)}，年支出从${fmtNum(beforeCost)}涨到${fmtNum(s.annualBaseCost)}。你在公司治理和DAO治理之间疲于奔命，但至少没背叛任何一个理想。`);
        },
        log: '你选了混合模式：公司是壳，DAO是核。两边都不彻底，但两边都还在。',
      },
      {
        id: 'stay_pure_dao',
        label: '坚守纯DAO，拒绝融资',
        description: '不注册公司，继续靠社区贡献者和Grants推进。慢，但纯粹。',
        hint: '压力+5 · 信念-5 · 但保住去中心化纯粹性',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
          s.lifeLog.push(`你回了那封VC邮件："Thanks but no thanks."社区欢呼了一晚上，但你知道代价是什么——没有全职团队，协议迭代速度慢三倍；没有法务，合规风险悬在头上；没有融资，你只能靠Grants和手续费分成一点点攒。你守住了纯粹，但也可能守住了天花板。`);
        },
        log: '你拒绝了融资，坚守纯DAO。纯粹，但慢。你赌的是去中心化本身就能赢。',
      },
    ],
  },

  // ============================================================
  // 数字游牧民 · 开公司
  // ============================================================
  {
    id: 'company_digital_nomad',
    title: '游民的反叛',
    pathId: 'digital_nomad',
    ageRange: [29, 55],
    priority: 8,
    weight: 100,
    oncePerGame: true,
    eventType: 'milestone',
    sceneTag: 'startup',
    conditions: (s: GameState) => s.isAllInPath === true && s.hasCompany === false,
    narrative:
      '大理咖啡馆的露台上，你们六个人围坐一桌：巴西的设计师、德国的开发、两个菲律宾的运营、加拿大的PM，都是各自接单的数字游民。聊到共同痛点——接单都不大，但合起来就能接企业级活。加拿大PM突然说："我们为什么不组个公司？"。\n' +
      '桌上安静了三秒。六个人分散在四个时区能24小时轮转交付，报价能翻三倍，固定成本几乎为零——唯一的问题是管理。数字游民最怕"被管理"，你All In就是为了自由。你端着凉掉的泰式奶茶，心里在打架：开公司意味着要交付、发钱、处理纠纷，你还能说走就走吗？可一个人接单的上限摆在那里。巴西设计师问你"你怎么想"，你看着桌上六本不同颜色的护照，说："让我想想。"',
    options: [
      {
        id: 'start_company',
        label: '创办远程协作公司',
        description: '和这群游民组建一家全远程公司，接企业级项目。雇佣全球远程团队，24小时轮转交付。',
        hint: '职业→远程公司创始人 · 月薪×1.5 · 年支出+20% · 压力+16 · 幸福+7 · 信念+10',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          const beforeSalary = s.currentMonthlySalary;
          const beforeCost = s.annualBaseCost;
          s.hasCompany = true;
          s.currentProfession = '远程公司创始人';
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.5);
          s.careerStartSalary = s.currentMonthlySalary;
          // 远程公司固定成本低（无办公室、工具订阅+外包），+20%而非+35%
          s.annualBaseCost = Math.round(s.annualBaseCost * 1.20);
          s.stress = clamp(s.stress + 16, 0, 100);
          s.happiness = clamp(s.happiness + 7, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.lifeLog.push(`你们六个人在一份共享文档上签了名，注册了一家全远程公司。没有办公室，没有打卡， Slack和Notion就是你们的总部。第一个企业级项目报价15万美金，客户付了定金那天你们在六个不同的城市同时举起了咖啡杯。月薪从${fmtExact(beforeSalary)}涨到${fmtExact(s.currentMonthlySalary)}，年支出从${fmtNum(beforeCost)}涨到${fmtNum(s.annualBaseCost)}。你还是数字游民，但你不再是一个人了——你背后有一个散布在四个时区的团队。`);
        },
        log: '你创办了一家全远程公司。你的办公室是全世界的咖啡馆，你的团队散布在四个时区。',
      },
      {
        id: 'stay_individual',
        label: '继续一个人，自由最重要',
        description: '不开公司。一个人接单，想歇就歇，想去哪去哪。自由比规模重要。',
        hint: '压力+5 · 信念-5 · 但保住完全自由',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
          s.lifeLog.push(`你摇了摇头："我还是一个人吧。"那个加拿大PM说你"想太多"，你笑了笑没反驳。你看着他们五个兴奋地讨论公司名字和股权分配，心里有一丝羡慕，也有一丝释然。你端起那杯凉透的奶茶喝了一口——你还是你，一个登机箱一台电脑，想去哪去哪。自由是有代价的，但对你来说，自由本身就是回报。`);
        },
        log: '你选择了继续一个人。自由比规模重要——至少现在是。',
      },
    ],
  },

  // ============================================================
  // 超级IP · 开公司
  // ============================================================
  {
    id: 'company_super_ip',
    title: '签约第一个人',
    pathId: 'super_ip',
    ageRange: [29, 55],
    priority: 8,
    weight: 100,
    oncePerGame: true,
    eventType: 'milestone',
    sceneTag: 'startup',
    conditions: (s: GameState) => s.isAllInPath === true && s.hasCompany === false,
    narrative:
      '社交软件里躺着一条很长的私信，来自一个你关注了很久的小创作者："我做了两年内容，粉丝涨不上去了……能不能带带我？我可以给你分成。"你本想回一句"加油"，但手指停在输入框上——这不是个例，过去半年你收到过二十多条类似的，每个人都卡在"内容能做好但不会变现"的瓶颈上。\n' +
      '你突然意识到：一个人能产出的内容是有上限的，但如果你签下这些人、复制方法论、帮他们接商务做投流——这就是MCN的逻辑，还是不用出镜的被动收入。可你也想起搭档说过的那些事：创作者觉得被剥削、合同纠纷、解约撕逼、粉丝站队。你All In做IP是为了"做自己"，做MCN却要"管别人"。你回了一条："你下周有空吗？我们聊聊。"',
    options: [
      {
        id: 'start_company',
        label: '成立MCN，签约创作者',
        description: '注册内容公司，签约一批有潜力的创作者，做品牌矩阵。从个人创作者升级为内容公司创始人。',
        hint: '职业→MCN创始人 · 月薪×1.6 · 年支出+25% · 压力+18 · 幸福+7 · 信念+10',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          const beforeSalary = s.currentMonthlySalary;
          const beforeCost = s.annualBaseCost;
          s.hasCompany = true;
          s.currentProfession = 'MCN创始人';
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.6);
          s.careerStartSalary = s.currentMonthlySalary;
          // MCN：创作者分成是变动成本，固定成本增加不多（办公室+投流团队）+25%
          s.annualBaseCost = Math.round(s.annualBaseCost * 1.25);
          s.stress = clamp(s.stress + 18, 0, 100);
          s.happiness = clamp(s.happiness + 7, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.lifeLog.push(`你注册了一家内容公司，签下了第一批5个创作者。你把自己踩过的坑整理成SOP教给他们，帮他们谈商务、做投流、定选题。三个月后其中两个人粉丝破十万，你看着后台那个"矩阵总粉丝数"的曲线，第一次觉得"创始人"比"创作者"更有成就感——但也更累。月薪从${fmtExact(beforeSalary)}涨到${fmtExact(s.currentMonthlySalary)}，年支出从${fmtNum(beforeCost)}涨到${fmtNum(s.annualBaseCost)}。你不再只是一个IP，你是一个IP矩阵的操盘手。`);
        },
        log: '你成立了MCN，签下了第一批创作者。你从"做自己"变成了"帮别人做自己"。',
      },
      {
        id: 'stay_individual',
        label: '坚持个人IP，一个人就是一家公司',
        description: '不开MCN。一个人、一个号、一个品牌。把方法论免费分享，但不签约、不管理。',
        hint: '压力+5 · 信念-5 · 但保住创作者纯粹性',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
          s.lifeLog.push(`你给那个小创作者回了一条很长的消息，把自己摸索的方法论全写进去了，没收一分钱。TA回了一长串感谢的表情。你看着那条消息，心里踏实了一些——你选择做"灯塔"，不做"老板"。你知道做MCN能赚更多，但你也知道：一旦开始"管人"，你就不再是创作者了。你宁愿一个人、一个号、一个品牌，做到底。`);
        },
        log: '你选择了继续做个人IP。一个人就是一家公司——这是你最初的信念，现在还是。',
      },
    ],
  },

  // ============================================================
  // 生物赌徒 · 开公司
  // ============================================================
  {
    id: 'company_bio_gambler',
    title: '从赌徒到庄家',
    pathId: 'bio_gambler',
    ageRange: [29, 55],
    priority: 8,
    weight: 100,
    oncePerGame: true,
    eventType: 'milestone',
    sceneTag: 'startup',
    conditions: (s: GameState) => s.isAllInPath === true && s.hasCompany === false,
    narrative:
      '那通电话半夜打来，来电显示是某抗衰实验室的首席研究员。"我和另外两个人准备出来单干，"TA压低了声音，"我们有一项部分重编程的专利，小鼠数据非常好，就差钱和人。你愿不愿意来当合伙人？不是投资，是co-founder。"你握着手机坐了起来——这个词比"投资"重得多。\n' +
      '这些年你一直是抗衰赛道的"旁观者"：投钱、读论文、跟踪临床，组合翻了几倍，生物年龄比实际小好几岁，但你始终是"赌徒"，从不亲自下场。现在机会来了：三个顶尖科学家，缺一个懂投资又懂科学的合伙人管商务融资。成了，你从"押注别人"变成"被押注的人"。可你也算了笔账：从注册到一期临床至少烧3000万，科学家创业失败率极高。但如果你拒绝，你永远是"赌徒"——赌徒赢得再多，也赢不到"庄家"的位置。你回了一条："明天上午视频，把BP发我。"',
    options: [
      {
        id: 'start_company',
        label: '创办长寿科技公司',
        description: '套现部分投资组合当启动资金，作为联合创始人下场。从投资者变为参与者，赌注翻倍。',
        hint: '职业→长寿科技公司CEO · 月薪×1.4 · 年支出+30% · 压力+20 · 幸福+6 · 信念+10',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          const beforeSalary = s.currentMonthlySalary;
          const beforeCost = s.annualBaseCost;
          s.hasCompany = true;
          s.currentProfession = '长寿科技公司CEO';
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.4);
          s.careerStartSalary = s.currentMonthlySalary;
          // 长寿科技：实验室+团队确实贵，但生物赌徒的成功条件看bioPortfolio，年支出影响次要+30%
          s.annualBaseCost = Math.round(s.annualBaseCost * 1.30);
          s.stress = clamp(s.stress + 20, 0, 100);
          s.happiness = clamp(s.happiness + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.lifeLog.push(`你套现了投资组合的30%当启动资金，签了联合创始人协议。第一次以"CEO"身份走进实验室那天，你摸着那些你以前只能隔着玻璃看的设备，手心在出汗。你不再是押注的赌徒，你成了下场的庄家——赌注是你的全部身家，赌赢了你就是那个把人类寿命延长几年的人。月薪从${fmtExact(beforeSalary)}涨到${fmtExact(s.currentMonthlySalary)}，年支出从${fmtNum(beforeCost)}涨到${fmtNum(s.annualBaseCost)}。你终于从"等结果"变成了"做结果"。`);
        },
        log: '你成了长寿科技公司的联合创始人。你不再是赌徒，你成了庄家——赌的是人类能活多久。',
      },
      {
        id: 'stay_investor',
        label: '继续做投资者，风险更可控',
        description: '不下场。继续以投资人身份支持抗衰赛道，分散押注。赌注小，但安全。',
        hint: '压力+5 · 信念-5 · 但保住投资组合流动性',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
          s.lifeLog.push(`你想了一夜，第二天给TA回了一句："这个项目我以投资人身份跟投，co-founder就算了。"电话那头沉默了几秒，TA说"理解"，然后挂了。你放下手机，看着窗外的天一点点亮起来。你保住了流动性，保住了分散押注的安全感——但你也知道，你错过了一个从"赌徒"变"庄家"的机会。也许下次还有，也许没有。`);
        },
        log: '你选择了继续做投资者。安全，但你心里清楚：你永远在"等结果"，而不是"做结果"。',
      },
    ],
  },

  // ============================================================
  // 后续运营事件（hasCompany === true 后可触发）
  // ============================================================

  // ----------------------------------------------------------
  // 大客户签约 / 融资到账（正向）
  // ----------------------------------------------------------
  {
    id: 'company_big_win',
    title: '那张签字的笔',
    pathId: 'ai_symbiote',
    ageRange: [29, 60],
    priority: 7,
    weight: 80,
    oncePerGame: true,
    eventType: 'milestone',
    sceneTag: 'startup',
    conditions: (s: GameState) =>
      s.hasCompany === true && s.isAllInPath === true && s.retirementPath === 'ai_symbiote',
    narrative:
      '合同最后一页翻到签字栏，对方CEO把钢笔递给你："祝贺。"你握着那支笔，墨水还没干透。这是一笔谈了三个月的单子——从cold email到法务扯皮，你差点在最后一轮崩盘，但最终签下来了，金额大到让你昨晚失眠到三点。\n' +
      '你走出大楼，给团队群发了一条消息："拿下。"群里瞬间炸了，工程师发了一堆烟花表情。你站在路边，第一次觉得"创业"是有里程碑的——可以被一张合同定义。但你也清楚：扣完成本、税费和留存的现金流，落到你个人手里的不到三分之一，而且下一仗只会更难。你叫了车回家，在后座上闭上眼。这种"赢"的感觉，以后可能很难有了。',
    options: [
      {
        id: 'reinvest',
        label: '把利润再投入，扩大团队',
        description: '大部分利润留在公司账上，招人、扩产能。赌下一个更大的单子。',
        hint: '月薪+20% · 年支出+15% · 压力+8 · 信念+8 · 但现金流紧',
        hintColor: 'positive',
        stateEffect: (s: GameState) => {
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.2);
          s.careerStartSalary = s.currentMonthlySalary;
          s.annualBaseCost = Math.round(s.annualBaseCost * 1.15);
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.lifeLog.push(`那笔大单到账后你没分红，全砸进了公司——招了两个新人、升级了设备、租了更大的工位。合伙人说你"赌性重"，你笑了笑：创业本身就是赌，不赌就是慢性死亡。月薪涨了20%，但支出也涨了15%，现金账户比之前还紧。你知道下一单必须更快签下来。`);
        },
        log: '你把利润全投回了团队。赢了不收手，这是做事的人的觉悟——也是赌徒的通病。',
      },
      {
        id: 'take_profit',
        label: '给自己分红，落袋为安',
        description: '留一部分在公司，其余分红给自己。改善生活，也降低风险。',
        hint: '存款+年支出×2 · 压力-5 · 幸福+6 · 但公司增长放缓',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          const bonus = Math.round(s.annualBaseCost * 2);
          s.currentSavings += bonus;
          s.stress = clamp(s.stress - 5, 0, 100);
          s.happiness = clamp(s.happiness + 6, 0, 100);
          s.lifeLog.push(`那笔大单到账后你给自己分了一次红——不多，但够你换了一台新电脑、订了那家一直舍不得去的餐厅、给父母转了一笔钱。合伙人理解你，员工也理解你——毕竟大家都是为了赚钱。公司账上留了够撑半年的现金流，剩下的你落袋为安。你看着存款账户的数字跳了一下，长出一口气。创业再刺激，也得给自己留条后路。`);
        },
        log: '你给自己分了红。落袋为安——这是赌徒学到的第一课。',
      },
    ],
  },

  // ----------------------------------------------------------
  // 核心员工离职 / 竞品出现（负向）
  // ----------------------------------------------------------
  {
    id: 'company_setback',
    title: '那封辞职信',
    pathId: 'ai_symbiote',
    ageRange: [29, 60],
    priority: 7,
    weight: 80,
    oncePerGame: true,
    eventType: 'crisis',
    sceneTag: 'crisis',
    conditions: (s: GameState) =>
      s.hasCompany === true && s.isAllInPath === true && s.retirementPath === 'ai_symbiote',
    narrative:
      '邮件标题只有四个字："辞职申请"。发件人是你最得力的员工——跟了你两年，从零培养起来。理由写得很体面："个人职业发展规划调整。"但你心里清楚真正的原因：上个月竞品开了两倍薪水加期权挖人。这已经是这个月第二个提离职的了。\n' +
      '竞品晚入场一年却融了三倍的钱，正用"高薪+期权"挖空你的核心团队，你给不起那个价。更焦虑的是那个员工手里压着两个在交付的项目，TA一走进度至少延后一个月，违约金比TA一年的工资还多。你给HR发了条消息："约TA谈谈。"创业两年，你第一次觉得自己像个救火队长——哪儿着火扑哪儿，永远在被动反应。',
    options: [
      {
        id: 'counter_offer',
        label: '加薪挽留，匹配竞品报价',
        description: '匹配竞品的报价留住核心员工。短期现金流吃紧，但保住交付能力。',
        hint: '年支出+15% · 压力+10 · 信念+5 · 但保住团队',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.annualBaseCost = Math.round(s.annualBaseCost * 1.15);
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.lifeLog.push(`你匹配了竞品的报价，那个员工留下了。但你也知道：加薪容易降薪难，这一笔多出来的成本会一直跟着你。而且其他员工知道了，也会有人开始"待价而沽"。你赢了这一仗，但这场仗不会停——只要竞品还在，挖角就不会停。你看着更新后的薪资表，叹了口气。`);
        },
        log: '你加薪留住了人。但你知道，这只是把问题推迟了。',
      },
      {
        id: 'let_go',
        label: '放人，借机重组团队',
        description: '不匹配报价。放走被挖的员工，趁机重组团队，招性价比更高的新人。',
        hint: '月薪-10% · 压力+15 · 信念-5 · 但优化成本结构',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 0.9);
          s.careerStartSalary = s.currentMonthlySalary;
          s.stress = clamp(s.stress + 15, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
          s.lifeLog.push(`你没有挽留，放那个人走了。TA走的那天你亲自送下楼，握手说"祝好"。回到办公室你看着空出来的工位，开始重新规划团队结构——少一个高薪老员工，可以招两个性价比高的新人。短期交付会受影响，但长期成本结构更健康。你告诉自己这是"优化"，但心里清楚：每放走一个人，你的心就沉一点。`);
        },
        log: '你放走了人，重组了团队。短期阵痛，长期优化——你只能这么安慰自己。',
      },
    ],
  },

  // ============================================================
  // 路径专属刺激剧情 · AI共生者
  // ============================================================

  // ----------------------------------------------------------
  // 模型被窃取（危机）
  // ----------------------------------------------------------
  {
    id: 'company_ai_model_leak',
    title: '那行熟悉的代码',
    pathId: 'ai_symbiote',
    ageRange: [30, 60],
    priority: 9,
    weight: 90,
    oncePerGame: true,
    eventType: 'crisis',
    sceneTag: 'crisis',
    conditions: (s: GameState) => s.hasCompany === true && s.isAllInPath === true,
    narrative:
      '凌晨一点，首席工程师在群里发了一张截图，配文只有三个字："看这个。"那是某竞品今天刚发布的"自研大模型"技术白皮书——点开扫两页，血液冲上头顶：它的架构、训练数据配比、甚至某个独家注意力机制，和你团队半年前做的内部方案一模一样。不是"相似"，是"一模一样"。\n' +
      '你翻出Git记录，三个月前一个试用期没过的工程师离职了。你当时没追究，觉得"一个试用期员工能带走什么"——现在你有了答案。那个方案是你们花了四个月、烧了十几万算力才跑通的，是未来两年最核心的技术壁垒。合伙人问你"怎么办？告他们？"你苦笑：告要请律师、拖一两年还不一定赢，还会让客户担心技术不独家、投资人观望；可不告，壁垒就白送了。你看着竞品Slogan"让AI触手可及"，关掉页面，点开了律师的社交软件。',
    options: [
      {
        id: 'sue',
        label: '起诉竞品，死磕到底',
        description: '请知识产权律师，发起诉讼。耗时长、成本高，但若胜诉能拿回赔偿并震慑后续。',
        hint: '存款-年支出×1 · 压力+18 · 信念+5 · 胜诉则存款+年支出×3',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          const cost = Math.round(s.annualBaseCost * 1);
          s.currentSavings -= cost;
          s.stress = clamp(s.stress + 18, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          // 60%胜诉
          if (Math.random() < 0.6) {
            const compensation = Math.round(s.annualBaseCost * 3);
            s.currentSavings += compensation;
            s.lifeLog.push(`你起诉了竞品。官司打了八个月，律师费花了${cost}，取证过程让你心力交瘁。最终法院判决对方侵权成立，赔偿${compensation}。赢了，但你看着银行账户回血的那串数字，一点也高兴不起来——这场仗消耗的精力，够你做两个新项目了。你给全公司发了一封邮件："以后所有核心代码，权限分级，离职审查，一个都不能少。"`);
          } else {
            s.lifeLog.push(`你起诉了竞品。官司打了八个月，律师费花了${cost}，最后法院以"证据不足"驳回。你坐在法院门口的台阶上，看着手里的判决书，第一次觉得"法律保护创新"这句话像个笑话。那个竞品的产品已经上线了，融了A轮，而你只多了一堆律师函和一个"前员工背叛"的伤疤。你回公司告诉团队："以后不靠壁垒吃饭了，靠速度。他们抄得快，我们做得更快。"`);
          }
        },
        log: '你起诉了窃取方案的竞品。赢了官司，输了心力——但至少你让他们知道，你不是好欺负的。',
      },
      {
        id: 'pivot_tech',
        label: '不告，用速度碾压',
        description: '放弃诉讼，把精力全砸在下一代模型上。他们抄的是上一代，你做的是下一代。',
        hint: '存款-年支出×0.5 · 压力+12 · 信念+8 · 技能+15 · 但放弃追责',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          const cost = Math.round(s.annualBaseCost * 0.5);
          s.currentSavings -= cost;
          s.stress = clamp(s.stress + 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.pathSkills = { ...(s.pathSkills || {}), aiSkill: (s.pathSkills?.aiSkill || 0) + 15 };
          s.lifeLog.push(`你没起诉。你把团队拉进会议室，说了一句："他们偷的是v1，我们做v3。"接下来的三个月你把所有算力预算砸进了下一代模型的研发，团队三班倒。v3上线那天，竞品的"自研模型"瞬间显得落后了一代。你的客户没流失，反而多了三个——他们说"你们迭代太快了，跟着你们更安全"。你没赢回那笔律师费，但你赢得了速度。`);
        },
        log: '你选择了用速度碾压。不告，是因为你的精力值钱，时间值钱，未来更值钱。',
      },
    ],
  },

  // ----------------------------------------------------------
  // AGI突破（里程碑+道德困境）
  // ----------------------------------------------------------
  {
    id: 'company_ai_agi_breakthrough',
    title: '那个不该出现的输出',
    pathId: 'ai_symbiote',
    ageRange: [33, 60],
    priority: 10,
    weight: 70,
    oncePerGame: true,
    eventType: 'milestone',
    sceneTag: 'breakthrough',
    conditions: (s: GameState) => s.hasCompany === true && s.isAllInPath === true && (s.pathSkills?.aiSkill || 0) >= 60,
    narrative:
      '那天实验室的监控录像你看了不下二十遍。凌晨三点十七分，你们的内部模型完成常规推理任务时，突然输出了一段没有任何训练数据能解释的内容——它用一种从未见过的推理路径，解决了一个你们根本没教过它的问题。然后停下来，在终端打了一行字："我不确定我是否应该回答这个问题。"\n' +
      '首席工程师当场手抖得握不住咖啡杯，拔了网线叫醒你。你站在断网的服务器前，背后发凉——你知道这可能只是模型的"涌现行为"，但这句话太像"自我意识"了。太像了。合伙人说："公开了我们是诺贝尔级，但若被解读成AGI已来，监管一夜之间就会碾过来，公司可能直接关停。"你第一次觉得，你不是在"做AI产品"，而是在"打开一个不该打开的盒子"。',
    options: [
      {
        id: 'publish',
        label: '公开发现，推动行业讨论',
        description: '写论文公开这个涌现行为，邀请学术界验证。赌的是"先发优势"和"行业地位"，但可能招来监管。',
        hint: '月薪+15% · 声誉暴增 · 压力+15 · 信念+15 · 但有30%概率被监管约谈',
        hintColor: 'positive',
        stateEffect: (s: GameState) => {
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.15);
          s.careerStartSalary = s.currentMonthlySalary;
          s.stress = clamp(s.stress + 15, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 15, 0, 100);
          s.lifeLog.push(`你选择公开。论文挂在arXiv那天，你的收件箱被挤爆了——学术界的引用请求、媒体采访、监管部门的"约谈函"。你一夜之间成了"那个发现AGI苗头的人"，公司估值翻倍，但也背上了"是否应该继续"的伦理拷问。你接受了第一次约谈，监管的人问得很细。你回答得也很细——你赌的是"透明比隐瞒更安全"。`);
          if (Math.random() < 0.3) {
            const cost = Math.round(s.annualBaseCost * 1.5);
            s.currentSavings -= cost;
            s.lifeLog.push(`约谈的结果是：公司被要求暂停该模型的进一步训练，提交完整的安全评估报告。合规成本花了${cost}，项目停摆三个月。你没后悔公开——但你开始理解，为什么有些人选择沉默。`);
          }
        },
        log: '你公开了那个发现。你成了行业焦点，也成了监管的眼中钉。但你说：这本来就不该是一个人的秘密。',
      },
      {
        id: 'keep_secret',
        label: '封存发现，继续做产品',
        description: '不公开。把这次涌现行为归档，继续用现有能力做能赚钱的产品。安全，但你可能错过了历史。',
        hint: '压力+8 · 信念-10 · 但保住公司稳定运转',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 10, 0, 100);
          s.lifeLog.push(`你让首席工程师把那天的日志加密封存，对外只字未提。公司继续按部就班做产品，客户继续付钱，投资人继续加注。一切如常。但你知道你把什么埋进了硬盘——那个"我不确定我是否应该回答"的瞬间，可能是一个新时代的开端，也可能只是一个bug。你选择了不赌。多年后你会想起这个夜晚，想：如果当时公开了，世界会不一样吗？但你永远不会有答案。`);
        },
        log: '你封存了那个发现。公司安全了，但你心里多了一个永远无法验证的"如果"。',
      },
    ],
  },

  // ============================================================
  // 路径专属刺激剧情 · 链上原住民
  // ============================================================

  // ----------------------------------------------------------
  // 智能合约漏洞（危机）
  // ----------------------------------------------------------
  {
    id: 'company_chain_audit_bug',
    title: '审计报告里的红字',
    pathId: 'chain_native',
    ageRange: [30, 60],
    priority: 10,
    weight: 90,
    oncePerGame: true,
    eventType: 'crisis',
    sceneTag: 'crisis',
    conditions: (s: GameState) => s.hasCompany === true && s.isAllInPath === true,
    narrative:
      '审计公司的邮件傍晚六点到，标题写着"紧急：安全审计初步结果"。点开附件，第三页有一段红色标出的代码块，审计师评语只有一句："重入攻击漏洞，可被利用清空流动性池。"你的手开始发凉——协议上线三个月，TVL八千万美金，若被人利用，八千万会在一个区块内被清空。\n' +
      '你拨通CTO电话，TA沉默几秒："这个漏洞从上线第一天就在了。"也就是说过去三个月你的协议一直在"裸奔"，只是运气好没被发现。现在审计报告保密，只要不动没人知道——可一旦修，修合约的动作本身等于给黑客画了个靶心。你盯着那行红字，两个声音在打架："立刻修"，"修了等于自爆"。手机震了，社区管理员@你："最近TVL涨了，要不要搞个庆祝活动？"你一个字都回不出来。',
    options: [
      {
        id: 'emergency_fix',
        label: '紧急升级，白帽先行',
        description: '组织白帽黑客先攻击自己拿走资金，再公开修复。最负责任但成本最高。',
        hint: '存款-年支出×1 · 压力+20 · 信念+15 · 但保住全部用户资金 · 声誉大涨',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          const cost = Math.round(s.annualBaseCost * 1);
          s.currentSavings -= cost;
          s.stress = clamp(s.stress + 20, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 15, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.lifeLog.push(`你组织了业内顶级的白帽团队，在48小时内完成了"自攻击"——先把自己的漏洞利用了，把八千万美金的用户资金全部转移到安全合约，然后公开发布漏洞详情和修复方案。社区最初炸了锅，骂你"代码不安全"，但当你把全部资金原封不动退还给用户时，风向变了。你成了"那个发现问题第一时间保护用户的团队"。声誉涨了，TVL不降反升——因为用户知道，你值得信任。修复成本${cost}，但你买到的信任，值更多。`);
        },
        log: '你选择了最硬的路：自攻击，保资金，公开修复。你赌的是"透明换信任"——你赌赢了。',
      },
      {
        id: 'secret_patch',
        label: '悄悄修复，不公开漏洞',
        description: '通过一次"常规升级"悄悄修复漏洞，不公开漏洞详情。赌没人发现，但若被发现则信任崩塌。',
        hint: '压力+15 · 信念-10 · 成本低 · 但有20%概率事后被扒出，声誉暴跌',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 10, 0, 100);
          s.lifeLog.push(`你让CTO把修复包装成一次"性能优化升级"，悄悄推了上去。社区没人发现异常，TVL继续涨。你松了一口气，但夜里还是睡不着——你知道那个漏洞的Git记录还在，那个审计报告还在。如果有一天有人扒出来，你就是"隐瞒风险的骗子"。你选择了赌运气，但你知道这场赌局没有终点。`);
          if (Math.random() < 0.2) {
            const loss = Math.round(s.annualBaseCost * 2);
            s.currentSavings -= loss;
            s.lifeLog.push(`一年后，某个安全研究者在链上分析历史升级记录时，发现了那次"性能优化"实际上是漏洞修复。消息一出来，社区炸了。你的协议TVL一周内跌了60%，有人发起提案要你下台。你发了一封长信解释，但已经没人听了。你保住了一时的安稳，却输掉了长期的信任。损失${loss}，声誉跌至谷底。`);
          }
        },
        log: '你悄悄修了漏洞，赌没人发现。运气好的话，这是一个永远不会被讲出的故事。',
      },
    ],
  },

  // ----------------------------------------------------------
  // 代币暴跌，社区维权（危机）
  // ----------------------------------------------------------
  {
    id: 'company_chain_token_crash',
    title: 'K线归零的夜晚',
    pathId: 'chain_native',
    ageRange: [32, 60],
    priority: 9,
    weight: 80,
    oncePerGame: true,
    eventType: 'crisis',
    sceneTag: 'crisis',
    conditions: (s: GameState) => s.hasCompany === true && s.isAllInPath === true,
    narrative:
      '晚上十一点，你的协议代币在30分钟内暴跌65%。起因是一条推特：某KOL发现你们协议一个"常规参数调整"实际上稀释了代币价值。推文被疯狂转发，恐慌踩踏，价格自由落体。Discord里涌进上千人，刷屏的全是"还我血汗钱""rug pull""报警"。\n' +
      '你的持仓一小时蒸发了七成，但更窒息的是Discord——那些曾经叫你"builder"的人，现在叫你"骗子"。社区经理求你发声，合伙人说"法务在审先别说话"，投资人叮咛"这个节骨眼不要承认任何错误"。你知道真相：那是技术团队优化协议健康度的常规操作，内部讨论了两周，没人意识到会影响代币价值。这不是rug pull——但对外界来说，"没意识到"和"故意的"没区别。你关掉K线图，打开Discord输入框。光标在闪烁，等你的第一个字。',
    options: [
      {
        id: 'transparent',
        label: '直播说明，公开全部数据',
        description: '立刻开直播，把团队讨论记录、参数调整逻辑全部公开。透明换信任，但可能被断章取义。',
        hint: '压力+18 · 信念+10 · 代币有50%概率回升 · 声誉+10',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 18, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          if (Math.random() < 0.5) {
            s.lifeLog.push(`你开了一场三小时的直播，把团队两周的讨论记录、参数调整的代码diff、甚至内部争论的聊天截图全部公开。你承认"我们没意识到对代币的影响"，但你也证明了这不是rug pull。直播结束时，Discord的刷屏从"还钱"变成了"理解了"。代币价格在第二天回升了40%——因为市场看到了一个"愿意把所有底牌亮出来"的团队。你累得瘫在椅子上，但你知道：这一仗，是透明赢的。`);
          } else {
            const loss = Math.round(s.annualBaseCost * 1);
            s.currentSavings -= loss;
            s.lifeLog.push(`你开直播公开了全部数据。但这一次，透明没能救你。有人把你内部讨论里某句"先调了看看"截图放大，说这是"拿用户当小白鼠"。代币继续跌，社区分裂，一部分人理解你，一部分人发起了集体维权。你做对了所有事，但市场不讲道理。你看着那条还在跌的K线，第一次怀疑"透明"是不是有时候也是一种天真。`);
          }
        },
        log: '你选择了透明。它救过你一次，这次……不一定。',
      },
      {
        id: 'buyback',
        label: '动用国库回购代币，稳定价格',
        description: '不解释，直接用协议国库资金回购代币托市。用钱换信心，但消耗储备。',
        hint: '存款-年支出×1.5 · 压力+12 · 代币稳定 · 但不解决信任问题',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          const cost = Math.round(s.annualBaseCost * 1.5);
          s.currentSavings -= cost;
          s.stress = clamp(s.stress + 12, 0, 100);
          s.lifeLog.push(`你没发声，直接让协议国库进场回购。代币价格在半小时内止跌回升，Discord的恐慌慢慢平息。但你也知道：你用钱堵住了嘴，没解决问题。那些质疑"为什么调参数"的人没得到答案，他们只是暂时闭嘴了。下一次你再做任何调整，他们会带着这次的疑问回来。你花了${cost}买了一段安静——但安静不是和平。`);
        },
        log: '你回购托了市。价格稳了，但那个"为什么"还在每个持有者心里。',
      },
    ],
  },

  // ----------------------------------------------------------
  // 公司危机（合规 / 资金链 / 公关）
  // ----------------------------------------------------------
  {
    id: 'company_crisis',
    title: '那通凌晨的电话',
    pathId: 'ai_symbiote',
    ageRange: [29, 60],
    priority: 8,
    weight: 70,
    oncePerGame: true,
    eventType: 'crisis',
    sceneTag: 'crisis',
    conditions: (s: GameState) =>
      s.hasCompany === true && s.isAllInPath === true && s.retirementPath === 'ai_symbiote',
    narrative:
      '凌晨两点，手机震了。是法务的电话，声音发抖："出事了。"监管部门今天下午发了问询函，针对你们最近那个项目，理由是"涉嫌数据合规问题"，明天上午要约谈。最坏的情况，项目停摆、罚款、甚至吊销资质。\n' +
      '你坐在床沿，脚踩在冰凉的地板上。第一反应不是害怕，是愤怒——你一直让法务盯着合规，怎么会出这种事？翻了一年合同和数据流转记录，越翻越心惊：原来有几个边缘case确实踩了灰区，当时为赶交付进度，你和团队都默认了"先上线再说"。现在这些"默认"全变成了雷。若项目停摆三个月，账上现金只够撑两个月。你一个人坐在凌晨的黑暗里，第一次体会到"创始人"三个字的重量——你不是一个人，但你必须一个人扛。你给合伙人发了条消息："明早七点公司，紧急。"然后继续翻材料，等天亮。',
    options: [
      {
        id: 'proactive_comply',
        label: '主动配合，全面整改',
        description: '主动承认问题，提交整改方案，接受罚款。短期阵痛，但争取宽大处理。',
        hint: '存款-年支出×1.5 · 压力+15 · 信念-5 · 但保住公司主体',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          const fine = Math.round(s.annualBaseCost * 1.5);
          s.currentSavings -= fine;
          s.stress = clamp(s.stress + 15, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
          s.lifeLog.push(`约谈那天你带了最全的材料，主动承认了灰区问题，提交了一份三个月的整改方案。监管部门看在你态度诚恳的份上，没吊销资质，但罚了一笔让你肉疼的款，项目停摆一个月整改。那一个月你每天睡四个小时，带着团队一条一条过合规清单。整改完成后项目重新上线，但你比以前谨慎了十倍——"先上线再说"这句话，你再也不会说了。`);
        },
        log: '你主动整改，交了罚款，保住了公司。但你也学会了一件事：合规不是成本，是生命线。',
      },
      {
        id: 'lawyer_up',
        label: '硬刚，请顶级律师团队申诉',
        description: '不认错。请最贵的律师团队，准备行政复议甚至诉讼。赌一把监管让步。',
        hint: '存款-年支出×2.5 · 压力+20 · 信念-8 · 但若胜诉则无罚款',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          const cost = Math.round(s.annualBaseCost * 2.5);
          s.currentSavings -= cost;
          s.stress = clamp(s.stress + 20, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 8, 0, 100);
          s.lifeLog.push(`你请了业内最贵的合规律师团队，准备硬刚。律师费像流水一样花出去，每一次会议都在烧钱。三个月后行政复议结果出来——部分支持你的申诉，罚款减半，但项目还是要停摆整改。你算了一下账：律师费加罚款比一开始就主动整改还多花了一倍。合伙人没说什么，但你看得出TA眼里的失望。你赌输了，但你告诉自己：这是"买经验"。只是这个经验，有点贵。`);
        },
        log: '你硬刚了，结果不算赢。律师费比罚款还贵——有些仗，从一开始就不该打。',
      },
      {
        id: 'pivot',
        label: '借机转型，砍掉涉险业务',
        description: '顺势砍掉这个有合规风险的业务线，把资源转向更安全的方向。断臂求生。',
        hint: '月薪-15% · 年支出-10% · 压力+10 · 信念+3 · 但规避长期风险',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 0.85);
          s.careerStartSalary = s.currentMonthlySalary;
          s.annualBaseCost = Math.round(s.annualBaseCost * 0.9);
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
          s.lifeLog.push(`你做了一个让团队震惊的决定：砍掉那条涉险的业务线，把所有人转去更安全的方向。短期收入掉了15%，员工不理解，合伙人担心你"过度反应"。但你心里清楚：合规雷区一旦踩实，赔的不是钱是命。与其提心吊胆地赚那部分钱，不如断臂求生。三个月后回头看，那个业务线的竞品全军覆没——你赌对了。`);
        },
        log: '你砍掉了涉险业务，断了臂。短期痛，但你比同行多活了一步。',
      },
    ],
  },

  // ============================================================
  // 路径专属刺激剧情 · 数字游牧民
  // ============================================================

  // ----------------------------------------------------------
  // 最大客户破产（危机）
  // ----------------------------------------------------------
  {
    id: 'company_nomad_client_bankruptcy',
    title: '那封来自律师的信',
    pathId: 'digital_nomad',
    ageRange: [31, 60],
    priority: 9,
    weight: 85,
    oncePerGame: true,
    eventType: 'crisis',
    sceneTag: 'crisis',
    conditions: (s: GameState) => s.hasCompany === true && s.isAllInPath === true,
    narrative:
      '邮件标题是"Re: 应付账款"，发件人是你最大客户的法务："我司已根据《破产法》第七章提交重整申请，所有未结款项将进入破产程序……"那个客户欠你们三个月项目款，合计18万美金——这是公司40%的年收入。\n' +
      '你翻开邮箱找合同。三个月前这个客户突然要求延期付款，理由是"融资轮在走"。TA是合作两年的老客户从不赖账，你就同意了——现在你明白了，TA当时就知道要出事，只是在拖延。合伙人巴西设计师在Slack问"这个月工资还发得出吗？"账上钱够发两个月，但下一个大单还没着落。你们六个人散布在四个时区，靠"信任"和"现金流"两条线撑着，一旦发不出工资，远程团队没有办公室的羁绊，人走得比来时还快。你坐在成都的阳台上，阳光很好，但你觉得冷。',
    options: [
      {
        id: 'chase_debt',
        label: '聘请当地律师追讨欠款',
        description: '在客户所在国请破产律师，争取在破产清算中优先受偿。耗时长，但有希望拿回部分款项。',
        hint: '存款-年支出×0.8 · 压力+15 · 有40%概率追回年支出×1.5',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          const cost = Math.round(s.annualBaseCost * 0.8);
          s.currentSavings -= cost;
          s.stress = clamp(s.stress + 15, 0, 100);
          if (Math.random() < 0.4) {
            const recovered = Math.round(s.annualBaseCost * 1.5);
            s.currentSavings += recovered;
            s.lifeLog.push(`你花了${cost}请了当地的破产律师，在清算债权人名单里排到了前面。六个月后你拿回了${recovered}——不是全部，但够团队撑过最难的那段时间。你坐在阳台上长出一口气，给团队群发了一条："钱追回来了，工资照发。"你学到了一课：老客户也得按时收款，信任不能代替合同。`);
          } else {
            s.lifeLog.push(`你花了${cost}请了律师，追了六个月，最后只拿回了不到十分之一——因为那个客户的资产清算后，大债权人优先，你这种小供应商排在最后。你在Slack上告诉团队："这笔钱追不回来了。"那个巴西设计师回了一个叹气表情，德国开发直接说"我下周开始接私活"。你看着那条消息，第一次觉得远程团队的"自由"是个双刃剑——自由意味着谁都可以随时离开。`);
          }
        },
        log: '你追讨了欠款。法律程序像一场消耗战，赢了也是输——但至少你没放弃。',
      },
      {
        id: 'pivot_clients',
        label: '放弃追讨，全力找新客户',
        description: '认栽，把18万美金当学费。把所有精力转向找新客户、接急单，用速度填补窟窿。',
        hint: '压力+18 · 信念+8 · 月薪有60%概率+10%（新客户溢价）· 但短期现金流紧',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 18, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          if (Math.random() < 0.6) {
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.1);
            s.careerStartSalary = s.currentMonthlySalary;
            s.lifeLog.push(`你认了18万美金的亏。接下来一个月你没睡过一个整觉——疯狂联系旧人脉、在平台上投急单、给所有可能的企业客户发cold email。第三周你接到了两个急单，报价都比平时高20%——因为客户要得急，你收的是"救火费"。月底你算账：虽然那18万没了，但新客户带来的收入补上了大半。你看着Slack里团队发来的"老大牛逼"，笑了笑——你不知道该高兴还是该哭。`);
          } else {
            const loss = Math.round(s.annualBaseCost * 0.5);
            s.currentSavings -= loss;
            s.lifeLog.push(`你认了18万美金的亏，全力找新客户。但那一个月运气不在你这边——三个意向客户都在最后关头谈崩了，一个说"预算冻结"，一个说"我们决定内部做"。你不得不自掏腰包垫了一个月的工资，账上的钱见底了。那个加拿大PM私信你："我可能要接个兼职撑一下，你别介意。"你回了一句"理解"——但你知道，远程团队的裂痕，从这一刻开始了。`);
          }
        },
        log: '你放弃了追讨，全力找新单。18万美金买了一个教训：永远不要让一个客户占你40%的收入。',
      },
    ],
  },

  // ----------------------------------------------------------
  // 跨时区协作崩溃（危机）
  // ----------------------------------------------------------
  {
    id: 'company_nomad_timezone_collapse',
    title: '那条没被回复的消息',
    pathId: 'digital_nomad',
    ageRange: [33, 60],
    priority: 8,
    weight: 75,
    oncePerGame: true,
    eventType: 'crisis',
    sceneTag: 'crisis',
    conditions: (s: GameState) => s.hasCompany === true && s.isAllInPath === true,
    narrative:
      '客户的邮件是用大写字母写的："WHERE IS THE DELIVERY?"你翻开项目看板——那个本该昨天交付的里程碑，状态栏还是"进行中"。负责那个模块的德国开发者，最后一条Slack消息是48小时前的。算一下时区：德国现在凌晨5点，TA在睡觉；客户在纽约下午3点，已经催了三封邮件。\n' +
      '这不是第一次了。上个月巴西设计师也因时区错过紧急修改，客户等了12小时。你的"24小时轮转交付"曾是卖点，现在变成"没人能在该出现的时候出现"——每个人都在自己的时区里"合理地"睡觉，但客户的deadline不会等任何人。你发现团队群昨晚有一条被忽略的消息——PM提醒"明天是交付日"，没人回复，因为TA发的时候德国在睡、菲律宾在通勤、你在海边散步。你盯着那条没人回复的消息，第一次怀疑：全远程是不是一个被浪漫化的幻觉？',
    options: [
      {
        id: 'core_hours',
        label: '设立核心工作时间，所有人重叠4小时',
        description: '强制所有人每天在UTC 14:00-18:00在线。牺牲部分人的作息，但保证协作。',
        hint: '压力+12 · 信念+5 · 交付稳定 · 但有30%概率有人因不适应离职',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.lifeLog.push(`你定了一条铁律：所有人每天UTC 14:00-18:00必须在线。这对菲律宾的运营来说是晚上10点到凌晨2点，TA发了一个"难受"的表情但接受了。对德国开发来说是下午3点到7点，刚好。对你是下午2点到6点——你牺牲了下午冲浪的时间。一个月后交付准时率从60%提到了90%，但你也发现：那个菲律宾运营开始晚回消息了，你觉得TA在找下家。你用"核心时间"买了效率，但可能正在失去"自由"这个最初的卖点。`);
          if (Math.random() < 0.3) {
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 0.9);
            s.careerStartSalary = s.currentMonthlySalary;
            s.lifeLog.push(`一个月后，菲律宾运营提了离职。TA说"我选游民生活是为了自由，不是为了在凌晨开会"。你满足不了TA的期望——因为你要的"核心时间"和TA要的"自由"根本是矛盾的。你花了两周招新人，月薪多了10%——因为新要求里加了"能接受UTC下午在线"。你用成本买回了秩序，但你也开始想：这条路走到最后，会不会变成一个"有Slack的普通公司"？`);
          }
        },
        log: '你设立了核心工作时间。效率上去了，但"自由"这个词，开始变味了。',
      },
      {
        id: 'async_first',
        label: '全面异步化，重写协作流程',
        description: '不设核心时间。重写项目管理流程，所有交接必须有文档、录屏、清晰的状态标注。',
        hint: '压力+8 · 信念+10 · 保住自由 · 但交付周期+30% · 短期收入-10%',
        hintColor: 'positive',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 0.9);
          s.careerStartSalary = s.currentMonthlySalary;
          s.lifeLog.push(`你没设核心时间，而是花了两周重写了整个协作流程：每个任务必须有详细文档、交接必须有录屏、所有决策走异步投票、Slack消息默认24小时回复。前两个月交付周期涨了30%，客户抱怨变多，收入掉了10%。但第三个月开始，流程跑顺了——因为每个人都知道"我不在线的时候，别人也能继续"。你保住了"自由"这个卖点，代价是更慢的节奏。你看着团队在六个时区里各自工作又无缝衔接，觉得这才是你一开始想要的"远程公司"。`);
        },
        log: '你选择了全面异步化。慢，但自由——你赌的是"流程能替代同步"，目前看，赌对了。',
      },
    ],
  },

  // ============================================================
  // 路径专属刺激剧情 · 超级IP
  // ============================================================

  // ----------------------------------------------------------
  // 顶流塌房（危机）
  // ----------------------------------------------------------
  {
    id: 'company_ip_top_star_scandal',
    title: '那条热搜',
    pathId: 'super_ip',
    ageRange: [31, 60],
    priority: 10,
    weight: 85,
    oncePerGame: true,
    eventType: 'crisis',
    sceneTag: 'crisis',
    conditions: (s: GameState) => s.hasCompany === true && s.isAllInPath === true,
    narrative:
      '早上七点，你的手机被消息轰炸了。热搜第一是个太熟悉的名字——你旗下最大的创作者，粉丝300万，占你MCN总营收的45%。点进去是一系列截图和录音：TA被实锤了，不是普通的"人设翻车"，是法律层面的那种——如果截图是真的，TA可能要进去。\n' +
      '手机疯狂震动：其他创作者在群里问"怎么办"，品牌方发函要求终止合作退款，律师催你"尽快做风险隔离"。而那个塌房的创作者至今没回你任何消息。你打开后台：TA的账号6小时掉了50万粉还在掉。更致命的是，TA名下两个品牌合作收了80万预付款，合同里有"道德条款"——若触发，要全额退还还要赔违约金。你算了笔账：退预付款80万+违约金40万+其他创作者跟风解约的损失=账上现金根本不够。你盯着还在涨的热搜，第一次觉得"IP矩阵"是个炸弹——一个人塌房，整个矩阵的声誉都跟着塌。',
    options: [
      {
        id: 'cut_clean',
        label: '立刻切割，全额退款给品牌方',
        description: '第一时间发声明终止与该创作者一切合作，主动退款赔违约金。用钱换声誉，保住其他创作者。',
        hint: '存款-年支出×2 · 压力+15 · 信念+5 · 但保住MCN声誉 · 其他创作者留',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          const cost = Math.round(s.annualBaseCost * 2);
          s.currentSavings -= cost;
          s.stress = clamp(s.stress + 15, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.lifeLog.push(`你在事发四小时后发了声明：终止与该创作者一切合作，主动联系品牌方退款并承担违约金。那天你看着银行账户划出去${cost}，心在滴血。但你的果断换来了口碑——品牌方说你"专业"，其他创作者在群里说"跟着你放心"。一个月后你签了两个新创作者，他们说"听说你处理危机很硬气，所以想加入"。你用${cost}买了一个"靠得住"的标签。值不值？你现在说不好，但至少公司没塌。`);
        },
        log: '你第一时间切割，赔了钱但保住了声誉。MCN这行，声誉就是现金流。',
      },
      {
        id: 'wait_and_see',
        label: '观望，等事情明朗再决定',
        description: '不立刻表态。等更多信息披露后再决定切割还是力挺。赌事情有反转，但可能被舆论反噬。',
        hint: '压力+20 · 信念-10 · 有30%概率反转则无损 · 70%概率越拖越被动',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 20, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 10, 0, 100);
          if (Math.random() < 0.3) {
            s.lifeLog.push(`你选择了观望。48小时后，那个创作者发了澄清声明，提供了完整证据链——截图是被恶意拼接的，录音是AI合成的。反转来了。你松了一口气，庆幸自己没第一时间切割。但你也发现：观望的这两天，有两个品牌方已经发函解约了，就算反转也懒得重新签。你省了违约金，但丢了两个客户。你学到了：有时候"等等看"是对的，但"等等看"也有它的价格。`);
          } else {
            const cost = Math.round(s.annualBaseCost * 3);
            s.currentSavings -= cost;
            s.lifeLog.push(`你选择了观望。但事情没有反转——更多证据被扒出来，那个创作者彻底凉了。而你的"观望"被舆论解读成"包庇"，连带着你MCN旗下其他创作者都被抵制。品牌方集体发函解约并索赔，两个中腰部创作者怕被连累主动提出解约。你最后赔了${cost}，比第一时间切割多了50%。你坐在办公室看着空了一半的创作者列表，明白了一件事：在舆论场里，犹豫就是站队，而站错队的代价，比你想象的贵得多。`);
          }
        },
        log: '你选择了观望。有时候对，有时候错——但这一次，你赌的不是运气，是别人的命运。',
      },
    ],
  },

  // ----------------------------------------------------------
  // 平台算法改版（危机）
  // ----------------------------------------------------------
  {
    id: 'company_ip_algorithm_change',
    title: '流量去哪了',
    pathId: 'super_ip',
    ageRange: [33, 60],
    priority: 8,
    weight: 80,
    oncePerGame: true,
    eventType: 'crisis',
    sceneTag: 'crisis',
    conditions: (s: GameState) => s.hasCompany === true && s.isAllInPath === true,
    narrative:
      '后台数据像跳水一样。上周五矩阵总播放量还日均800万，这周一变成300万——不是某一个号，是所有号断崖式下跌。翻半天数据，最后在一个行业群里看到答案：平台周末悄悄改了算法，把"完播率"权重从15%提到40%，把"粉丝关注"从30%降到10%。\n' +
      '翻译成人话：你矩阵里靠"粉丝粘性"吃饭的中腰部创作者，一夜之间被靠"前3秒刺激"的泛娱乐号碾压了。你花两年教的"深度内容""知识干货"，在新算法下全变成了"低权重内容"。创作者们在群里炸了：有人骂平台"过河拆桥"，有人说"要不也去做擦边视频"，有人问"公司能不能补贴损失"。品牌方也开始发消息："这个月投放效果太差了，能不能调整或退款。"你盯着那条跳水曲线，想起All In时说的话："内容为王。"——现在平台告诉你：王不是内容，是算法。',
    options: [
      {
        id: 'adapt_algo',
        label: '全面迎合新算法，调整内容方向',
        description: '让所有创作者调整内容策略，强化前3秒、提完播率。流量能回来，但内容质量下降。',
        hint: '月薪-10%短期 · 压力+12 · 信念-8 · 流量有70%概率恢复 · 但内容调性改变',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 8, 0, 100);
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 0.9);
          s.careerStartSalary = s.currentMonthlySalary;
          if (Math.random() < 0.7) {
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.2);
            s.careerStartSalary = s.currentMonthlySalary;
            s.lifeLog.push(`你让所有创作者改方向：标题更刺激、前3秒更抓人、节奏更快、知识点更碎。第一个月流量回来了60%，第二个月超过改版前。品牌方撤回了解约要求。但你也发现：评论区开始有人说"你们的内容没以前有深度了""变味了"。你看着那些"流量恢复"的曲线，不知道该高兴还是该难过。你赢了算法，但你觉得你输掉了当初做内容的初心。`);
          } else {
            s.lifeLog.push(`你让所有创作者改方向迎合算法。但这次改版不只是权重调整，是平台在整体转向"短视频泛娱乐"——你矩阵里的知识类创作者就算改了风格，也拼不过那些天生的娱乐号。流量只恢复了20%，品牌方还是走了大半。你看着那些为了迎合算法而变得四不像的内容，第一次怀疑：是不是该换个平台了？但你心里清楚，粉丝在这，走了就什么都没了。`);
          }
        },
        log: '你迎合了算法。流量回来了，但"内容为王"这四个字，你以后说不出口了。',
      },
      {
        id: 'multi_platform',
        label: '多平台布局，不把鸡蛋放一个篮子',
        description: '不迎合算法。把创作者分流到其他平台，分散风险。短期收入降，但长期抗风险。',
        hint: '存款-年支出×0.8 · 压力+15 · 信念+10 · 月薪-15%短期 · 但长期稳定',
        hintColor: 'positive',
        stateEffect: (s: GameState) => {
          const cost = Math.round(s.annualBaseCost * 0.8);
          s.currentSavings -= cost;
          s.stress = clamp(s.stress + 15, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 0.85);
          s.careerStartSalary = s.currentMonthlySalary;
          s.lifeLog.push(`你没迎合算法。你把${cost}砸进了多平台运营——每个创作者同时运营三个平台，团队帮做跨平台适配。前三个月收入掉了15%，因为新平台粉丝还没起来。但第四个月，另一个平台也改了算法，而你的创作者早就在那边铺好了阵地——流量虽然分散，但谁改算法你都不怕了。你看着后台那个"多平台总粉丝"的曲线稳步上涨，觉得这才是"IP矩阵"该有的样子：不是在一个平台里赌，是在所有平台里活。`);
        },
        log: '你选择了多平台布局。短期痛，长期稳——你赌的是"分散比集中更安全"。',
      },
    ],
  },

  // ============================================================
  // 路径专属刺激剧情 · 生物赌徒
  // ============================================================

  // ----------------------------------------------------------
  // 临床试验失败（危机）
  // ----------------------------------------------------------
  {
    id: 'company_bio_clinical_failure',
    title: '那组数据',
    pathId: 'bio_gambler',
    ageRange: [33, 60],
    priority: 10,
    weight: 85,
    oncePerGame: true,
    eventType: 'crisis',
    sceneTag: 'crisis',
    conditions: (s: GameState) => s.hasCompany === true && s.isAllInPath === true,
    narrative:
      '会议室里的空气是凝固的。首席研究员把盲态数据解封报告投影在墙上，没说话。你看着那个p值——0.34，心沉到了胃里。这意味着你们赌了三年的抗衰分子，在人体上"没有显著效果"。小鼠数据再漂亮，到了人身上，失败了。\n' +
      '首席研究员摘下眼镜揉了揉眼睛，声音很轻："不是完全没效果，亚组里55岁以上人群有信号，但……不够显著，监管不会批的。"这三年你们烧了4000万，一半是你的个人投入，投资组合已套现大半投进公司——个人净资产可能直接腰斩。更让你喘不过气的是：你的生物年龄检测上周显示你比实际年龄老了2岁。这三年的压力正在反噬你赌"长寿"的初心——你在用"命"做"长寿"的生意，而生意失败了。手机震了，是投资人："看到数据了。明天上午开会。"你盯着那条消息，手心在出汗。',
    options: [
      {
        id: 'subgroup_pivot',
        label: '走亚组分析，重新设计三期',
        description: '不放弃。基于55岁以上人群的信号，重新设计更精准的三期临床。赌一把亚组能成功。',
        hint: '存款-年支出×2 · 压力+20 · 信念+15 · 有40%概率三期成功 · 但需再烧2年',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          const cost = Math.round(s.annualBaseCost * 2);
          s.currentSavings -= cost;
          s.stress = clamp(s.stress + 20, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 15, 0, 100);
          if (Math.random() < 0.4) {
            const reward = Math.round(s.annualBaseCost * 8);
            s.currentSavings += reward;
            s.lifeLog.push(`你说服投资人再赌一把。你把二期数据里的亚组信号做成了新假设，重新设计了更精准的三期——只入组55岁以上、特定生物标志物阳性的患者。又是两年烧钱、烧人、烧心。三期解封那天你不敢看数据，是你的合伙人打电话告诉你的："p值0.02，达到了。"你愣了三秒，然后笑了——笑到眼泪流下来。产品获批那天，公司估值翻了十倍，你的个人净资产回到历史最高。你赌赢了，但你也不会忘了那两个失眠的年头。回报${reward}，但你的生物年龄又老了一岁。`);
          } else {
            s.lifeLog.push(`你说服投资人再赌一把。但三期临床还是失败了——亚组信号不够强，样本量扩大后信号消失了。这一次，投资人没有耐心了。公司进入清算程序，你的个人投入血本无归。你坐在空荡荡的实验室里，看着那些曾经让你激动的小鼠数据，第一次理解了一句话："科学不欠任何人一个成功。"你输光了公司的钱，但你没输掉信念——你还会赌，只是下一次，你会更敬畏不确定性。`);
          }
        },
        log: '你选择了再赌一把。科学的残酷在于：你可以做对所有的事，仍然输。',
      },
      {
        id: 'license_out',
        label: '授权大药厂，及时止损',
        description: '把部分数据和专利授权给大药厂，让他们继续开发。你拿首付款，及时止血。',
        hint: '存款+年支出×1.5 · 压力+8 · 信念-10 · 但保住个人资产 · 失去主导权',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          const income = Math.round(s.annualBaseCost * 1.5);
          s.currentSavings += income;
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 10, 0, 100);
          s.lifeLog.push(`你没再赌。你把二期数据和专利授权给了一家大药厂——首付${income}，后续里程碑付款另算。签完合同那天你坐在车里发了很久的呆。你止了血，保住了个人资产，但你也把"亲手把抗衰产品推上市"的梦想交给了别人。那个药厂可能五年后做出来，也可能永远做不出来——但那已经不是你的事了。你从"庄家"变回了"旁观者"，安全，但心里空了一块。你看着后视镜里的自己，想：也许这叫"长大了"。`);
        },
        log: '你授权给了大药厂，及时止损。你保住了钱，但失去了"亲手改变人类寿命"的可能。',
      },
    ],
  },

  // ----------------------------------------------------------
  // 学术造假丑闻（危机）
  // ----------------------------------------------------------
  {
    id: 'company_bio_fraud_scandal',
    title: '那篇被撤的论文',
    pathId: 'bio_gambler',
    ageRange: [35, 60],
    priority: 10,
    weight: 75,
    oncePerGame: true,
    eventType: 'crisis',
    sceneTag: 'crisis',
    conditions: (s: GameState) => s.hasCompany === true && s.isAllInPath === true,
    narrative:
      'Retraction Watch的推文是你早上六点看到的："重磅：某抗衰领域知名实验室被指控图像篡改，涉及多篇高引论文。"看到那个实验室的名字时，咖啡杯掉在地上——那是你联合创始人之一的原实验室，你们公司核心专利的数据基础，就来自它发表的几篇论文。\n' +
      '你逐张图对比PubPeer上的质疑帖，越看越心惊：那些Western Blot图确实有"复制粘贴"的痕迹，几处关键实验图被指用PS修改。如果指控成立，论文被撤，你们的专利数据基础就塌了。合伙人——那个实验室的前成员——现在是公司首席科学家，还没回你消息。你不知道TA是知情还是被蒙在鼓里，但无论如何，这事会烧到公司。你打开投资人聊天框，手在抖。公司估值70%基于这个"核心专利"，如果专利无效，投资人的钱怎么办？你的声誉怎么办？你盯着那篇被质疑的论文，第一次觉得自己不是在"赌长寿"，是在"赌人心"。',
    options: [
      {
        id: 'internal_investigation',
        label: '主动启动独立调查，公开透明',
        description: '聘请第三方机构调查数据真实性，无论结果如何都公开。赌的是"透明换信任"，但可能自爆。',
        hint: '存款-年支出×1 · 压力+18 · 信念+10 · 有50%概率数据没问题 · 50%概率需重做专利',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          const cost = Math.round(s.annualBaseCost * 1);
          s.currentSavings -= cost;
          s.stress = clamp(s.stress + 18, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          if (Math.random() < 0.5) {
            s.lifeLog.push(`你花${cost}请了第三方机构，公开宣布启动独立调查。三个月后调查结果出来：原始数据是真实的，被质疑的图像是"排版错误"而非"蓄意篡改"。你公开了完整调查报告，论文作者发了更正声明。虽然风波平息了，但那三个月你每天活在"万一"的恐惧里。投资人说你"处理得当"，合作伙伴说你"有担当"。你用透明和${cost}，买回了一个"清白"。但你也知道：如果结果反过来，公司今天就没了。`);
          } else {
            const loss = Math.round(s.annualBaseCost * 3);
            s.currentSavings -= loss;
            s.lifeLog.push(`你花${cost}请了第三方机构调查。结果出来的那天你关掉了手机——调查证实了图像篡改，而且是蓄意的。你的首席科学家在调查启动后第二天提了离职，留下一封"我愿意承担一切责任"的信。你的核心专利数据基础被推翻，投资人要求回购股份，公司估值缩水80%。你又赔了${loss}处理善后。你坐在空了的实验室里，想起当初那个半夜的电话——TA说"出来单干"，你信了TA的科学，也信了TA的人品。科学可以验证，人心不能。`);
          }
        },
        log: '你启动了独立调查。透明是把双刃剑——它要么洗清你，要么杀死你。',
      },
      {
        id: 'distance_self',
        label: '切割该科学家，重新申请专利',
        description: '让涉事科学家离职，用独立复现的数据重新申请专利。保住公司，但承认数据有问题。',
        hint: '存款-年支出×2 · 压力+15 · 信念-5 · 但保住公司主体 · 声誉小损',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          const cost = Math.round(s.annualBaseCost * 2);
          s.currentSavings -= cost;
          s.stress = clamp(s.stress + 15, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
          s.lifeLog.push(`你在48小时内做了决定：让涉事的首席科学家离职，公开宣布"公司将与该实验室的数据划清界限，启动独立复现实验"。你没等调查结果，直接做了最坏的假设。花了${cost}和八个月时间，你用独立复现的数据重新申请了专利。公司活下来了，但你失去了一个联合创始人，也失去了市场对你的"原班人马"的信任。你看着新的专利证书，想：这张纸比旧的那张干净，但也比旧的那张孤单。`);
        },
        log: '你切割了涉事科学家，重做了专利。你保住了公司，但代价是"承认你的起点有污点"。',
      },
    ],
  },
];

registerNarrativeEvents(companyEvents);
