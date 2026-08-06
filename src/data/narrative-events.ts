/**
 * AI共生者路径 · 完整叙事事件库
 *
 * 三条分支：
 *   tech_expert    — 技术专家线，深耕AI技术，成为不可替代的大牛
 *   ai_startup     — AI创业线，用AI做产品，搏一个独角兽
 *   ai_evangelist  — 布道师线，做培训/内容，成为AI领域的KOL
 *
 * 三个技能维度：
 *   aiSkill        — AI技术能力（编程、架构、系统设计）
 *   promptMastery  — 提示词技巧（提示词工程、AI沟通、内容创作）
 *   aiTraining     — 模型训练能力（数据标注、微调、训练pipeline）
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
import type { NarrativeEvent, GameState } from '../types/global.d.js';
import { getAllExtraEvents } from './narrative-registry.js';
import { clamp } from '../utils/clamp.js';

// 加载其他路径的叙事数据（模块自注册到 narrative-registry）
import './narrative-data-chain.js';
import './narrative-data-nomad.js';
import './narrative-data-ip.js';
import './narrative-data-silver.js';
import './narrative-data-bio.js';
import './narrative-unemployed.js';
import './narrative-allin.js';
import './narrative-company.js';
import './narrative-breakthrough.js';
import './narrative-data-mbti.js';
import './narrative-data-philosophy.js';
import './narrative-recurring.js';

// ============================================================
// 辅助函数
// ============================================================

/** 安全读取技能值（pathSkills 可能为空） */
function getSkill(state: GameState, skill: string): number {
  return state.pathSkills?.[skill] || 0;
}

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

  // 22岁：初入职场，接触AI工具
  {
    id: 'ai_first_contact',
    title: '初见深渊',
    pathId: 'ai_symbiote',
    ageRange: [22, 22],
    priority: 7,
    weight: 10,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '入职第三天，前辈扔过来一份文档："让通用大模型跑一遍，整理成周报。"你敲下第一行指令，AI秒回了一段比你写得更通顺的文字。你盯着屏幕，后背微微发凉——与其说是恐惧，不如说是兴奋。\n' +
      '你隐约觉得这东西会改变一切，而你是办公室里最早摸到它的人之一。下班后你没走，把公司公开文档全喂给了AI，看它怎么"思考"。',
    options: [
      {
        id: 'dive_into_ai',
        label: '把业余时间全砸进AI工具',
        description: '买API额度、注册各种AI平台、熬夜研究，做那个"最先懂"的人',
        hint: 'AI技能+12 · 提示词+8 · 压力+6 · 存款-2000 · 信念+3',
        hintColor: 'positive',
        skillGains: { aiSkill: 12, promptMastery: 8 },
        savingsChange: -2000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '22岁，你把工资的三分之一花在了API和订阅上，把全部夜晚交给了对话框。同事们还在抱怨加班，你已经在用AI把加班时间砍掉了一半。',
      },
      {
        id: 'observe_cautiously',
        label: '先观察，按需使用',
        description: '不急着投入，先看这东西到底能干什么、不能干什么',
        hint: '提示词+5 · 幸福+3 · 信念+2',
        hintColor: 'neutral',
        skillGains: { promptMastery: 5 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 2, 0, 100);
        },
        log: '22岁，你没跟风，而是默默记录AI每次回答的准确率和翻车模式。三个月后你心里有了一本账：哪些活能交给它，哪些绝不能。',
      },
      {
        id: 'teach_colleagues',
        label: '教同事们一起用AI',
        description: '做办公室里的"AI小老师"，用人情换影响力',
        hint: '提示词+6 · 幸福+5 · 压力+3',
        hintColor: 'neutral',
        skillGains: { promptMastery: 6 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.stress = clamp(s.stress + 3, 0, 100);
        },
        log: '22岁，你成了办公室的"AI客服"。同事问你什么都先帮你跑一遍，你嘴上抱怨但心里暗爽——你正在成为那个"不可替代"的人。',
      },
    ],
  },

  // 23岁：同事质疑/嘲讽AI
  {
    id: 'ai_coworker_mockery',
    title: '异类',
    pathId: 'ai_symbiote',
    ageRange: [23, 23],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '午休时你又在调AI，老员工老周端着保温杯路过瞟了一眼："又玩那个玩具呢？真干活还得靠人脑子，那代码我一行都不敢上线。"旁边几个同事笑了。你没反驳，但胸口堵得慌。\n' +
      '你知道老周错了，可你不确定自己是对的——也许三年后老周还在领工资，而你押错了宝，已经在失业队列里排队了。',
    options: [
      {
        id: 'prove_with_result',
        label: '做出一个让老周闭嘴的成果',
        description: '用AI做一个老周一周都搞不定的东西，甩在他脸上',
        hint: 'AI技能+10 · 提示词+5 · 压力+8 · 幸福+5 · 月薪+1000',
        hintColor: 'positive',
        skillGains: { aiSkill: 10, promptMastery: 5 },
        salaryChange: 1000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '23岁，你用AI两天写完了老周预估要一周的报表系统。演示那天老周全程黑脸，但主管在会上点了你的名。你赢了，但老周此后再没跟你说过话。',
      },
      {
        id: 'stay_quiet',
        label: '默默继续，不争辩',
        description: '燕雀安知鸿鹄之志，等结果说话',
        hint: 'AI技能+5 · 提示词+3 · 信念+4',
        hintColor: 'neutral',
        skillGains: { aiSkill: 5, promptMastery: 3 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          s.stress = clamp(s.stress + 2, 0, 100);
        },
        log: '23岁，你学会了一件事：在别人不理解的时候闭嘴。你把节省下来的口水全喂给了AI，半年后你的效率是老周的三倍，但你什么都没说。',
      },
      {
        id: 'learn_from_veteran',
        label: '跟老周学点"土办法"',
        description: 'AI是快刀，但老周的行业经验是你没有的磨刀石',
        hint: 'AI技能+3 · 幸福+4 · 信念+2 · 双保险',
        hintColor: 'neutral',
        skillGains: { aiSkill: 3 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 2, 0, 100);
        },
        log: '23岁，你主动请老周喝了顿酒。他嘴上说你"不务正业"，但酒后教了你一堆文档里没有的业务门道。你发现AI能写代码，但写不出人情世故。',
      },
    ],
  },

  // 23-24岁：第一个AI小项目
  {
    id: 'ai_first_project',
    title: '第一把火',
    pathId: 'ai_symbiote',
    ageRange: [23, 24],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '你用AI写了一个自动化脚本，把部门耗时两天的流程压缩到二十分钟。主管看演示时眼睛亮了，当场说"这周给你加绩效"。\n' +
      '可第二天，脚本出了个bug——王姐的订单没了，你翻了三遍数据库，确认数据无法恢复。你熬了一整夜手动重建，第二天顶着黑眼圈交差，主管的脸色从"有前途"变成"还是太嫩"。AI给了你一把快刀，但你还没学会刀法：快刀切菜快，切到手也快。',
    options: [
      {
        id: 'audit_every_line',
        label: '复盘bug，逐行审查AI代码',
        description: '把AI生成的每行代码都过一遍，搞懂"为什么"而不只是"能用"',
        hint: 'AI技能+12 · 提示词+4 · 压力+10 · 健康-3 · 月薪+1000',
        hintColor: 'positive',
        skillGains: { aiSkill: 12, promptMastery: 4 },
        salaryChange: 1000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '23岁，你用三天三夜把那段AI代码逐行拆解，画了十几页流程图。你终于明白：AI给你的是答案，但你要为答案负责。此后再没出过同样的错。',
      },
      {
        id: 'add_human_check',
        label: '低调处理，以后AI结果都先人工验证',
        description: '不求快，求稳，每次都先自己验一遍再交',
        hint: '提示词+8 · 压力+4 · 幸福-2 · 月薪+500',
        hintColor: 'neutral',
        skillGains: { promptMastery: 8 },
        salaryChange: 500,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.happiness = clamp(s.happiness - 2, 0, 100);
        },
        log: '23岁，你给所有AI产出加了一道人工校验。速度慢了一半，但再没翻过车。同事笑你"谨慎过头"，你笑而不语——翻过车的人才知道安全带的好。',
      },
      {
        id: 'build_full_tool',
        label: '干脆做成带校验的完整工具',
        description: '既然出问题了，就把它做成一个有容错、有日志、有回滚的系统',
        hint: 'AI技能+12 · 模型训练+5 · 压力+12 · 存款-3000 · 月薪+1500',
        hintColor: 'positive',
        skillGains: { aiSkill: 12, aiTraining: 5 },
        savingsChange: -3000,
        salaryChange: 1500,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '24岁，你花了一个月把那个脚本重构成了一个完整的自动化工具，带异常处理、日志追踪和一键回滚。主管把它推广到了全部门，你的名字第一次出现在了季度表彰名单上。',
        blindBoxTrigger: 'ai_automate_self',
      },
    ],
  },

  // 24岁：看到AI取代传统岗位的新闻
  {
    id: 'ai_replacement_news',
    title: '前夜',
    pathId: 'ai_symbiote',
    ageRange: [24, 24],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '地铁上你刷到一条新闻：某大厂裁掉了整个翻译团队换成AI。评论区炸了锅，但你往下翻，看到一条高赞评论："取代你的不是AI，是会用AI的人。"\n' +
      '你盯着这句话看了很久，直到坐过了站。你就是那个"会用AI的人"——但这到底是护身符，还是另一张催命符？当你也会被更好的AI、更年轻的人取代时，谁来替你说话？',
    options: [
      {
        id: 'accelerate_learning',
        label: '加速学习，争做"驾驭者"',
        description: '与其担心被取代，不如让自己成为那个操纵AI的人',
        hint: 'AI技能+8 · 提示词+5 · 信念+8 · 压力+6 · 月薪+1000',
        hintColor: 'positive',
        skillGains: { aiSkill: 8, promptMastery: 5 },
        salaryChange: 1000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.stress = clamp(s.stress + 6, 0, 100);
        },
        log: '24岁，那条新闻像一针肾上腺素。你卸载了所有娱乐APP，把通勤时间全用来读AI论文。你告诉自己：跑得比浪潮快，才不会被卷走。',
      },
      {
        id: 'stockpile_savings',
        label: '开始疯狂存钱，为不确定的未来囤粮',
        description: '不管AI怎么变，兜里有钱心里不慌',
        hint: '存款+8000 · 幸福-2 · 信念-2',
        hintColor: 'neutral',
        savingsChange: 8000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness - 2, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 2, 0, 100);
        },
        log: '24岁，你把消费降到了最低，外卖换成了食堂，新衣服一件没买。室友说你"抠门"，你心想：等潮水退去，没穿裤子的不会是我。',
      },
      {
        id: 'study_replacement_boundary',
        label: '研究AI到底能取代什么、不能取代什么',
        description: '搞清楚边界，才能找到安全区',
        hint: 'AI技能+6 · 提示词+8 · 信念+5',
        hintColor: 'neutral',
        skillGains: { aiSkill: 6, promptMastery: 8 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '24岁，你花了一个月做了一张"AI能力地图"——哪些岗位高危，哪些暂时安全，哪些会被增强而非取代。你把它贴在床头，每天看一眼，提醒自己往安全区走。',
      },
    ],
  },
];

// ============================================================
// 分支选择事件（age 25）
// ============================================================

const branchSelectEvent: NarrativeEvent[] = [

  {
    id: 'ai_branch_select',
    title: '岔路',
    pathId: 'ai_symbiote',
    ageRange: [25, 25],
    priority: 10,
    weight: 10,
    oncePerGame: true,
    eventType: 'branch_select',
    conditions: (s) => !s.narrativeBranch || s.narrativeBranch === 'unassigned',
    narrative:
      '三年了。你从那个对着大模型发呆的新人，变成公司里"最懂AI"的人。但"懂"是个很虚的字——你懂技术却还没深到不可替代，会用AI却还没用它赚到过真正的钱。\n' +
      '25岁这年，AI的浪潮越来越大，你不能再以"什么都会一点"的姿态漂着。深夜你打开备忘录，写下三个词：技术、产品、影响力。你知道选了哪条路，就意味着暂时放下另外两条。光标一闪一闪，像在等你做一个不会反悔的决定。',
    options: [
      {
        id: 'choose_tech_expert',
        label: '深耕技术，成为不可替代的大牛',
        description: '死磕AI底层原理，做架构、做系统、做那些"别人看不懂但离不开"的东西。你赌的是：技术深度是最后的护城河。',
        hint: 'AI技能+12 · 月薪+2000 · 压力+5 · 信念+5',
        hintColor: 'positive',
        skillGains: { aiSkill: 12 },
        salaryChange: 2000,
        branchSwitch: 'tech_expert',
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '25岁，你选了最难走的那条路——往技术的深渊里钻。你把所有精力砸进了AI底层架构，别人在追应用风口，你在啃论文、读源码。你赌的是：浪会退，但礁石不会动。',
      },
      {
        id: 'choose_ai_startup',
        label: '用AI做产品，搏一个独角兽',
        description: '技术够用了，是时候把它变成钱。你赌的是：AI时代的产品窗口期很短，现在不上车就永远没机会了。',
        hint: 'AI技能+8 · 模型训练+8 · 存款-20000 · 压力+10 · 信念+5',
        hintColor: 'danger',
        skillGains: { aiSkill: 8, aiTraining: 8 },
        savingsChange: -20000,
        branchSwitch: 'ai_startup',
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
          (s as any).startedStartup = true;
        },
        log: '25岁，你没辞职——但你在工位上偷偷跑着你的AI产品。午休时间部署服务器，下班后写代码到凌晨，周末全泡在产品迭代上。你把积蓄砸进了API账单，同事以为你在加班赶项目，其实你在给自己赶。没有退路，但目前还有退路——你清楚，这只是时间问题。',
      },
      {
        id: 'choose_ai_evangelist',
        label: '做AI布道师，用影响力变现',
        description: '与其自己写代码，不如教一万个人写代码。你赌的是：在AI时代，"谁先懂"比"谁懂得深"更值钱。',
        hint: '提示词+12 · 被动收入+5000/年 · 信念+6 · 压力+3',
        hintColor: 'positive',
        skillGains: { promptMastery: 12 },
        passiveIncomeChange: 5000,
        branchSwitch: 'ai_evangelist',
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '25岁，你发了第一条系统性的AI教程，转发破了两千。评论区有人说"这是我见过最清晰的入门指南"。你盯着那条评论，心想：也许教别人用AI，比自己用AI更值钱。',
      },
    ],
  },
];

// ============================================================
// 技术专家线事件（ages 26-38）
// ============================================================

const techExpertEvents: NarrativeEvent[] = [

  // 26岁：架构设计挑战
  {
    id: 'tech_arch_challenge',
    title: '图纸',
    pathId: 'ai_symbiote',
    branch: 'tech_expert',
    ageRange: [26, 26],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    narrative:
      '公司要做AI驱动的推荐系统，技术总监把架构设计的活派给了你——你头一回独立负责一个完整系统的骨架。\n' +
      '你在白板上画了三天，擦了改、改了擦。AI模型怎么部署、数据怎么流转、推理延迟怎么压、冷启动怎么扛——每一个箭头都连着一个可能崩溃的深夜。你这才懂了什么叫"架构师的笔，比程序员的键盘更重"。',
    options: [
      {
        id: 'study_classic_arch',
        label: '啃经典论文和大厂架构文档',
        description: '把Google、Meta、字节的技术博客翻了个底朝天，站在巨人肩膀上',
        hint: 'AI技能+12 · 提示词+3 · 压力+8 · 健康-3',
        hintColor: 'positive',
        skillGains: { aiSkill: 12, promptMastery: 3 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '26岁，你把十几篇经典架构论文打印出来贴满了工位。两周后你交出了一份让总监挑不出大毛病的架构图。他说"有进步"，你把这四个字当成了勋章。',
      },
      {
        id: 'use_ai_to_design',
        label: '用AI辅助推演架构方案',
        description: '让AI当你的"架构评审官"，模拟各种极端场景',
        hint: 'AI技能+10 · 提示词+12 · 压力+4 · 信念+3',
        hintColor: 'positive',
        skillGains: { aiSkill: 10, promptMastery: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '26岁，你让AI扮演了"刁钻的架构评审委员会"，把你的方案喷了个体无完肤。修补三轮后，方案比原来稳健了一倍。你第一次觉得AI不是工具，是同事。',
      },
      {
        id: 'ask_senior_review',
        label: '厚着脸皮找总监手把手带',
        description: '承认自己不会，请教前辈，用 humility 换 mentorship',
        hint: 'AI技能+8 · 幸福+5 · 压力-3 · 但欠人情',
        hintColor: 'neutral',
        skillGains: { aiSkill: 8 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.stress = clamp(s.stress - 3, 0, 100);
        },
        log: '26岁，你端着咖啡去找总监："我画的架构图您能帮我看一眼吗？"他看了半小时，红笔改了一半，但最后拍了拍你的肩说"方向对了"。那天你学到的东西比读十篇论文都多。',
      },
    ],
  },

  // 27岁：开源贡献
  {
    id: 'tech_open_source',
    title: '星光',
    pathId: 'ai_symbiote',
    branch: 'tech_expert',
    ageRange: [27, 27],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '你在开源社区发现一个热门AI框架的bug，随手提了个PR，三天后maintainer合并了你的代码："clean fix, thanks"。你盯着那条评论傻笑了五分钟。\n' +
      '然后你开始翻issue列表，周末花两天修了三个，又被合并了两个。开源主页上开始出现绿色方块，像夜空里慢慢亮起来的星星。你想：也许技术人真正的名片是commit history，职级反倒是虚的。',
    options: [
      {
        id: 'contribute_regularly',
        label: '坚持每周贡献开源项目',
        description: '把业余时间投入开源，建立行业内的技术声誉',
        hint: 'AI技能+12 · 压力+8 · 幸福+5 · 健康-4 · 存款-3000 · 副业+3000',
        hintColor: 'positive',
        skillGains: { aiSkill: 12 },
        savingsChange: -3000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.health = clamp(s.health - 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.currentYearSideHustle += 3000; // 项目方发的一笔bug赏金
        },
        log: '27岁，你的开源社区连续绿了半年。有人开始在issue里@你帮忙看代码，有人在Twitter上转你的技术博客。一个项目方请你修了个关键bug，打来3000刀赏金。你第一次感觉到，技术声誉是可以脱离公司独立存在的资产。',
      },
      {
        id: 'fork_own_project',
        label: '自己开一个AI工具开源项目',
        description: '从贡献者变成owner，赌一个star破千的项目',
        hint: 'AI技能+12 · 提示词+5 · 压力+10 · 存款-5000 · 可能破圈',
        hintColor: 'neutral',
        skillGains: { aiSkill: 12, promptMastery: 5 },
        savingsChange: -5000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '27岁，你开源了一个自己写的AI代码审查工具。第一个月只有23个star，你差点放弃。第二个月某大V转发了，star冲到了800。你每天醒来第一件事是看star数，像养了一个电子宠物。',
        blindBoxTrigger: 'ai_open_source_tool',
      },
      {
        id: 'focus_day_job',
        label: '专注公司项目，不碰开源',
        description: '开源是情怀，饭碗是现实，先把KPI搞定',
        hint: 'AI技能+8 · 月薪+1500 · 压力+2 · 但错失声誉积累',
        hintColor: 'neutral',
        skillGains: { aiSkill: 8 },
        salaryChange: 1500,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 2, 0, 100);
        },
        log: '27岁，你关掉了开源社区通知，把全部精力投到了公司项目上。年终拿了A绩效，涨了薪。但偶尔刷到同行晒star破千的截图，你心里会闪过一丝"如果当初"。',
      },
    ],
  },

  // 28岁：技术债
  {
    id: 'tech_debt_war',
    title: '技术债',
    pathId: 'ai_symbiote',
    branch: 'tech_expert',
    ageRange: [28, 28],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '你接手了一个祖传系统——三年前的AI推理服务，被七个团队改过，文档全过期，注释是谎言，没人敢动。\n' +
      '每回上线都像拆炸弹，监控面板天天飘红。产品经理催你加新功能，你看着那堆意大利面条代码，血压飙升。你知道不动它迟早出大事，可重构需要两周，而产品说"下周五就要上线"。你站在代码仓库前，像一个站在沼泽边的将军，决定是修桥还是绕路。',
    options: [
      {
        id: 'refactor_head_on',
        label: '顶住压力，硬重构',
        description: '向老板要两周时间，把核心模块彻底重写',
        hint: 'AI技能+12 · 压力+12 · 幸福-3 · 信念+5 · 月薪+1000',
        hintColor: 'positive',
        skillGains: { aiSkill: 12 },
        salaryChange: 1000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.happiness = clamp(s.happiness - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '28岁，你和产品经理拍桌子吵了一架，然后跟总监立了军令状：两周重构，延期我负责。两周后系统上线，bug减少了70%。总监看你的眼神变了，你成了那个"敢接烂摊子"的人。',
      },
      {
        id: 'incremental_fix',
        label: '渐进式改造，边还债边加功能',
        description: '不赌大的，每周偷偷改一点，润物细无声',
        hint: 'AI技能+8 · 压力+5 · 幸福+2 · 月薪+500',
        hintColor: 'neutral',
        skillGains: { aiSkill: 8 },
        salaryChange: 500,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.happiness = clamp(s.happiness + 2, 0, 100);
        },
        log: '28岁，你用了三个月时间把系统从屎山改成了勉强能看的丘陵。没人夸你，但也没人骂你了。你安慰自己：技术债就像房贷，慢慢还总比断供强。',
      },
      {
        id: 'wrap_legacy_layer',
        label: '加一层AI适配层，新功能走新路',
        description: '不动祖传代码，在它上面包一层新架构，隔离风险',
        hint: 'AI技能+10 · 提示词+5 · 压力+3 · 但旧债仍在',
        hintColor: 'neutral',
        skillGains: { aiSkill: 10, promptMastery: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 3, 0, 100);
        },
        log: '28岁，你在屎山上盖了一层干净的新楼。新产品跑得飞起，但你知道地基还是烂的。你把这个秘密藏在了心里，祈祷退休前不要塌。',
      },
    ],
  },

  // 29岁：团队技术分享
  {
    id: 'tech_team_share',
    title: '传灯',
    pathId: 'ai_symbiote',
    branch: 'tech_expert',
    ageRange: [29, 29],
    priority: 4,
    weight: 6,
    oncePerGame: true,
    narrative:
      '总监让你做一场全员技术分享，主题是"AI辅助开发的最佳实践"。你准备了三天PPT，从prompt设计讲到部署优化。分享那天会议室坐满了人，连其他部门都来了，你讲了一个半小时，问答环节又延长了四十分钟。\n' +
      '散场后有个实习生跑过来说"师兄你讲得太好了，PPT能给我一份吗"。你忽然意识到：你不知不觉已经从"学的人"变成了"教的人"。',
    options: [
      {
        id: 'build_tech_community',
        label: '在公司内部建技术社区',
        description: '定期分享、搞读书会、带新人，做技术文化的布道者',
        hint: 'AI技能+8 · 提示词+10 · 幸福+8 · 月薪+1000 · 信念+5',
        hintColor: 'positive',
        skillGains: { aiSkill: 8, promptMastery: 10 },
        salaryChange: 1000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.stress = clamp(s.stress - 3, 0, 100);
        },
        log: '29岁，你牵头搞了公司第一个"AI工程实践"技术社区，每月一期。半年后连VP都来听了。你在公司里不再只是"那个技术好的人"，而是"那个让大家都变好的人"。',
      },
      {
        id: 'write_tech_blog',
        label: '把分享内容写成系列技术博客',
        description: '输出倒逼输入，用写作深化技术理解',
        hint: 'AI技能+10 · 提示词+5 · 压力+4 · 被动收入+3000/年 · 副业+5000',
        hintColor: 'positive',
        skillGains: { aiSkill: 10, promptMastery: 5 },
        passiveIncomeChange: 3000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
          s.currentYearSideHustle += 5000; // 一家AI公司付费请写的技术评测稿费
        },
        log: '29岁，你的技术博客在掘金和问答社区上慢慢积累了关注。有猎头通过博客找到了你，有公司请你去内部分享。一家AI公司付费5000块请你写了一篇技术框架的深度评测。你发现写出来的东西比留在脑子里的更值钱。',
      },
      {
        id: 'keep_low_profile',
        label: '低调搞技术，不搞这些虚的',
        description: '分享浪费时间，不如多写两行代码',
        hint: 'AI技能+12 · 压力+2 · 但影响力有限',
        hintColor: 'neutral',
        skillGains: { aiSkill: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 2, 0, 100);
        },
        log: '29岁，你拒绝了后续的分享邀请，把自己埋进了代码里。技术确实精进了，但你在公司里始终是"那个埋头干活的"，晋升答辩时发现自己缺少"影响力"这一栏的素材。',
      },
    ],
  },

  // 30岁：大厂面试准备
  {
    id: 'tech_bigtech_interview',
    title: '渡口',
    pathId: 'ai_symbiote',
    branch: 'tech_expert',
    ageRange: [30, 30],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    narrative:
      '一个猎头找上你，某一线大厂AI架构岗，薪资翻倍，股票期权另算。你心动了，但很清楚大厂面试是什么量级——算法、系统设计、AI原理深挖，每一轮都是扒一层皮。\n' +
      '你翻开LeetCode，发现上次刷题还是三年前；打开系统设计题库，只会做一半。30岁了，这是一次跳龙门的机会，也是一面照出你技术短板的镜子。',
    options: [
      {
        id: 'intensive_prep',
        label: '辞职/请假，全职备战两个月',
        description: '背水一战，把所有时间投入面试准备',
        hint: 'AI技能+12 · 提示词+5 · 压力+15 · 健康-5 · 存款-8000 · 月薪+3000(若成功)',
        hintColor: 'positive',
        skillGains: { aiSkill: 12, promptMastery: 5 },
        savingsChange: -8000,
        salaryChange: 3000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '30岁，你请了长假，把自己关在家里刷了两个月的题。面试那天你提前半小时到，手心全是汗。四面过后HR说"恭喜通过"，你在厕所里无声地挥了下拳头。',
      },
      {
        id: 'side_prep',
        label: '边工作边准备，每天挤两小时',
        description: '稳住当前饭碗，用碎片时间备战',
        hint: 'AI技能+10 · 压力+8 · 健康-3 · 月薪+2500(若成功)',
        hintColor: 'neutral',
        skillGains: { aiSkill: 10 },
        salaryChange: 2500,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
        },
        log: '30岁，你白天上班、晚上刷题，连续两个月没在12点前睡过。面试那天状态一般，系统设计环节卡了壳，但算法题全A了。最后压线通过，你长舒一口气。',
      },
      {
        id: 'skip_interview',
        label: '不跳了，留在当前公司深耕',
        description: '大厂的工牌很光鲜，但你知道自己的价值不在那张牌上',
        hint: 'AI技能+8 · 幸福+5 · 压力-5 · 信念+4 · 但错失薪资跃迁',
        hintColor: 'neutral',
        skillGains: { aiSkill: 8 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '30岁，你拒了猎头。你算了一笔账：大厂薪资翻倍但强度也翻倍，你现在的公司虽小但你是技术核心。你选了留，虽然偶尔会后悔，但大多数夜晚睡得着。',
      },
    ],
  },

  // 31岁：系统性能优化
  {
    id: 'tech_system_optimize',
    title: '毫秒',
    pathId: 'ai_symbiote',
    branch: 'tech_expert',
    ageRange: [31, 31],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '线上AI推理服务的P99延迟从200ms飙到800ms，用户投诉暴增。排查发现是模型升级后计算量翻倍，但业务方说"用户体验不能降"。\n' +
      '你面前有几条路：量化压缩模型、上推理加速框架、加缓存层、还是改架构做异步。每条都是一周以上的工作量，每条都有翻车风险。你盯着那条像心电图一样跳动的延迟线，开始和毫秒较劲。',
    options: [
      {
        id: 'model_quantization',
        label: '量化压缩模型，用精度换速度',
        description: '深入研究模型量化技术，在精度损失可控的前提下砍掉一半推理时间',
        hint: 'AI技能+12 · 模型训练+10 · 压力+10 · 信念+5 · 月薪+1500',
        hintColor: 'positive',
        skillGains: { aiSkill: 12, aiTraining: 10 },
        salaryChange: 1500,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '31岁，你把模型量化到了INT8，P99延迟降回了250ms，精度只掉了0.3%。你在技术周会上展示了对比数据，全场安静了三秒后掌声响起来。这是你技术生涯最骄傲的时刻之一。',
      },
      {
        id: 'inference_framework',
        label: '上推理加速框架，不改模型',
        description: '引入TensorRT等推理优化框架，工程层面提速',
        hint: 'AI技能+12 · 压力+6 · 月薪+1000',
        hintColor: 'neutral',
        skillGains: { aiSkill: 12 },
        salaryChange: 1000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
        },
        log: '31岁，你引入了推理加速框架，延迟降了一半。没动模型一行代码，纯工程手段解决。你很满意，但隐约觉得自己回避了更难也更值钱的模型优化方向。',
      },
      {
        id: 'add_cache_layer',
        label: '加缓存层，快速止血',
        description: '用缓存挡住80%的重复请求，先把延迟降下来再说',
        hint: 'AI技能+6 · 压力+3 · 月薪+500 · 治标不治本',
        hintColor: 'neutral',
        skillGains: { aiSkill: 6 },
        salaryChange: 500,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 3, 0, 100);
        },
        log: '31岁，你加了一层缓存，延迟数据好看了，投诉也少了。但你知道这只是创可贴，模型还是那个臃肿的模型。你把"真正优化"写进了TODO，但一直没来得及做。',
      },
    ],
  },

  // 32岁：带新人
  {
    id: 'tech_mentor_junior',
    title: '回声',
    pathId: 'ai_symbiote',
    branch: 'tech_expert',
    ageRange: [32, 32],
    priority: 4,
    weight: 6,
    oncePerGame: true,
    narrative:
      '组里来了个应届生，名校硕士，简历上有两篇AI顶会论文，但工程能力约等于零。总监让他跟你做项目，你成了他的mentor。\n' +
      '他第一天就把测试环境搞崩了，第二天给你看的代码你差点心梗——变量名用拼音，AI生成的代码他不审查直接提交。你深吸一口气，想起自己23岁翻车的那天晚上。你忽然懂了：技术能力的尽头，在能让身边的人多强——自己多强，反倒其次了。',
    options: [
      {
        id: 'patient_mentor',
        label: '手把手带，从code review开始',
        description: '花时间陪他成长，把他培养成能扛事的人',
        hint: 'AI技能+6 · 提示词+8 · 幸福+8 · 压力+5 · 月薪+1000',
        hintColor: 'positive',
        skillGains: { aiSkill: 6, promptMastery: 8 },
        salaryChange: 1000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '32岁，你花了三个月把那个应届生从"灾难"带成了"能干活"。他第一次独立上线功能那天给你买了杯咖啡说"谢谢师兄"。你看着他，像看到了十年前的自己。',
      },
      {
        id: 'give_hard_tasks',
        label: '扔难题给他，让他自己撞墙成长',
        description: '温室里长不出好工程师，放手让他犯错',
        hint: 'AI技能+4 · 压力+8 · 幸福+2 · 但新人可能崩',
        hintColor: 'neutral',
        skillGains: { aiSkill: 4 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.happiness = clamp(s.happiness + 2, 0, 100);
        },
        log: '32岁，你把一个棘手的模块扔给了应届生，只说了一句"有问题来找我"。他果然搞砸了两次，但第三次交上来的代码竟然不错。他成长得很快，但你中间替他擦了不少屁股。',
      },
      {
        id: 'focus_own_work',
        label: '让带新人的活分给别人，自己专注技术',
        description: '带人太耗精力，你的核心竞争力还是技术深度',
        hint: 'AI技能+12 · 压力+2 · 但团队影响力停滞',
        hintColor: 'neutral',
        skillGains: { aiSkill: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 2, 0, 100);
        },
        log: '32岁，你跟总监说"带新人太影响效率"，把他转给了别人。你的技术产出确实更多了，但年终晋升时评审说"缺少团队影响力"。你第一次意识到，技术人的天花板不只是技术。',
      },
    ],
  },

  // 34岁：架构师晋升（里程碑）
  {
    id: 'tech_architect_promo',
    title: '加冕',
    pathId: 'ai_symbiote',
    branch: 'tech_expert',
    ageRange: [34, 34],
    priority: 7,
    weight: 9,
    oncePerGame: true,
    eventType: 'milestone',
    conditions: (s) => getSkill(s, 'aiSkill') >= 60,
    narrative:
      '晋升答辩的日子到了。你准备了半年——整理了过去八年的所有项目，画了12页架构演进图，准备了30个深水区问题。\n' +
      '答辩室里坐着五位评委。你讲了四十分钟，被追问了二十分钟。有个问题问到你系统的某个设计取舍，你停下来想了五秒，然后给出了一个连自己都满意的回答。评委们交换了一下眼神。你知道，这可能是你技术生涯的一个转折点。',
    options: [
      {
        id: 'aim_principal',
        label: '冲击Principal架构师，走纯技术路线',
        description: '拒绝转管理，做那个"全公司技术风向标"的人',
        hint: 'AI技能+12 · 信念+10 · 压力+8 · 月薪+3000 · 健康-3',
        hintColor: 'positive',
        skillGains: { aiSkill: 12 },
        salaryChange: 3000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
          s.happiness = clamp(s.happiness + 10, 0, 100);
        },
        log: '34岁，你成了公司最年轻的Principal架构师。工牌换了颜色，邮箱里塞满了恭喜的邮件。你站在落地窗前看着楼下的车流，玻璃上映出一个穿西装的身影——和那个穿着拖鞋在出租屋里对着通用大模型熬夜的年轻人，是同一个人。那条路，你走到了一个别人没走到的地方。',
      },
      {
        id: 'tech_lead_path',
        label: '接受Tech Lead，技术管理两手抓',
        description: '架构师带团队，既有技术深度又有管理广度',
        hint: 'AI技能+10 · 提示词+5 · 月薪+3000 · 压力+10 · 幸福+5',
        hintColor: 'positive',
        skillGains: { aiSkill: 10, promptMastery: 5 },
        salaryChange: 3000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '34岁，你成了Tech Lead，带一个15人的AI团队。一半时间写代码，一半时间开会。你不习惯开会，但你发现自己还挺擅长把一群聪明人拧成一股绳。',
      },
      {
        id: 'independent_consultant',
        label: '婉拒晋升，转型独立技术顾问',
        description: '用积累的声誉接咨询，时间自由，收入更高',
        hint: 'AI技能+8 · 被动收入+15000/年 · 幸福+8 · 压力-5 · 但失去平台 · 副业+20000',
        hintColor: 'neutral',
        skillGains: { aiSkill: 8 },
        passiveIncomeChange: 15000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.currentYearSideHustle += 20000; // 第一笔技术咨询项目费到账
        },
        log: '34岁，你做了一个让所有人意外的决定：不升职，离职做独立顾问。你的技术博客和开源声誉帮你接到了第一批客户，第一笔项目费20000块到账。你第一次发现，没有公司的牌子，你的名字也值钱。',
      },
    ],
  },

  // 36岁：技术vs管理抉择
  {
    id: 'tech_vs_mgmt',
    title: '分水岭',
    pathId: 'ai_symbiote',
    branch: 'tech_expert',
    ageRange: [36, 36],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '36岁了。你的发际线后退了两厘米，但技术直觉比任何时候都敏锐。可公司给你抛来一个选择：转技术管理带更大的团队，还是继续做Individual Contributor。\n' +
      '管理意味着权力、预算、话语权，但也意味着越来越少碰代码；IC意味着技术纯粹，但天花板通常更低。你翻看过去一年的日历——60%的时间在开会，30%在review别人的代码，只有10%在亲手写代码。你问自己：你还爱写代码吗？还是你只是习惯了被叫"技术大牛"的感觉？',
    options: [
      {
        id: 'stay_ic',
        label: '坚守IC，做"最后一个写代码的架构师"',
        description: '拒绝管理岗，把技术深度走到极致',
        hint: 'AI技能+12 · 信念+8 · 幸福+5 · 压力+3 · 但天花板有限',
        hintColor: 'positive',
        skillGains: { aiSkill: 12 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.stress = clamp(s.stress + 3, 0, 100);
        },
        log: '36岁，你在晋升表上勾了"Individual Contributor"。有人说你傻，说"不做管理就是死路"。你笑了笑，回去打开IDE写了一个下午的代码。那种心流的感觉，开一百个会都换不来。',
      },
      {
        id: 'transition_mgmt',
        label: '转技术管理，扩大影响力',
        description: '接受现实，用管理杠杆放大你的技术判断力',
        hint: 'AI技能+5 · 提示词+8 · 月薪+3000 · 压力+12 · 幸福-3',
        hintColor: 'neutral',
        skillGains: { aiSkill: 5, promptMastery: 8 },
        salaryChange: 3000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.happiness = clamp(s.happiness - 3, 0, 100);
        },
        log: '36岁，你转了管理。第一个月你开了过去一年量的会，第二个月你开始怀念写代码的下午。但你慢慢发现，一个好的技术管理者能让十个工程师变强——这也是一种创造。',
      },
      {
        id: 'start_consulting',
        label: '两边都不选，出来做技术咨询',
        description: '用多年积累的技术声誉，做自由的技术顾问',
        hint: 'AI技能+10 · 被动收入+20000/年 · 幸福+8 · 压力+5 · 存款-15000 · 副业+15000',
        hintColor: 'neutral',
        skillGains: { aiSkill: 10 },
        passiveIncomeChange: 20000,
        savingsChange: -15000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.currentYearSideHustle += 15000; // 首个咨询项目的首付款到账
        },
        log: '36岁，你离开了大厂，注册了一家一人咨询公司。第一个客户给你开了日薪八千的价，首个项目预付了15000块。你坐在联合办公空间里，第一次觉得：技术这件事，原来可以这么自由地做。',
      },
    ],
  },

  // 37岁：遗留系统迁移
  {
    id: 'tech_legacy_migration',
    title: '迁徒',
    pathId: 'ai_symbiote',
    branch: 'tech_expert',
    ageRange: [37, 37],
    priority: 4,
    weight: 6,
    oncePerGame: true,
    narrative:
      '公司决定把核心AI系统从旧框架迁移到新架构。这是一个涉及上百个服务、几十万行代码的世纪工程，你是技术负责人。\n' +
      '没人愿意干这活——脏、累、出力不讨好，做好了没人夸，搞砸了全公司追杀。但你知道再不迁移，两年内必出大事故。你站在白板前画出迁移路线图，像在给一头衰老的大象做心脏搭桥手术。你清楚每一步都可能要命，但更清楚不动手一定会死。',
    options: [
      {
        id: 'full_migration',
        label: '一次性整体迁移，长痛不如短痛',
        description: '集中三个月全力迁移，风险高但彻底解决',
        hint: 'AI技能+12 · 压力+15 · 健康-5 · 信念+8 · 月薪+2000',
        hintColor: 'positive',
        skillGains: { aiSkill: 12 },
        salaryChange: 2000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        log: '37岁，你带队三个月完成了核心系统迁移，全程零事故。上线那天你喝了半瓶威士忌才睡着。CTO在全员会上说"这是公司近年最漂亮的工程战役"，你假装平静地点了点头。',
      },
      {
        id: 'strangler_pattern',
        label: '绞杀者模式，逐步替换',
        description: '新功能走新系统，旧功能逐步迁移，降低风险',
        hint: 'AI技能+10 · 压力+6 · 信念+4 · 月薪+1000',
        hintColor: 'neutral',
        skillGains: { aiSkill: 10 },
        salaryChange: 1000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '37岁，你用了半年时间，把旧系统一块一块地"绞杀"替换。没有轰轰烈烈的上线日，但也没有惊心动魄的故障。你选了最稳的路，虽然少了些传奇色彩。',
      },
      {
        id: 'delegate_team',
        label: '组建专项小组，自己只做架构把关',
        description: '把执行交给团队，自己专注技术决策',
        hint: 'AI技能+8 · 压力+4 · 幸福+3 · 但团队压力大',
        hintColor: 'neutral',
        skillGains: { aiSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
        },
        log: '37岁，你把迁移执行交给了三个得力干将，自己只做架构评审和风险把控。项目如期完成，但有个干将私下说"这次差点累死"。你在庆功宴上多敬了他两杯。',
      },
    ],
  },

  // 38岁：技术深耕的终极反思
  {
    id: 'tech_deep_reflection',
    title: '灯塔',
    pathId: 'ai_symbiote',
    branch: 'tech_expert',
    ageRange: [38, 38],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '38岁了。你写了十六年代码，从最初的CRUD到现在的AI系统架构，名字出现在好几项专利上，开源项目有几千个star。\n' +
      '但深夜你看着镜子里的自己，忽然问了一个从没问过的问题：你是在追求技术，还是在用技术逃避别的什么？你的通讯录里"朋友"越来越少，"同事"越来越多。你已经很久没有因为"有趣"而不是"有用"去学一个新东西了。第一次看到AI秒回答案时后脖颈发麻的感觉，你有多久没体会过了？',
    options: [
      {
        id: 'rekindle_passion',
        label: '重新找回技术的好奇心',
        description: '放下功利，花时间研究那些"没用但有趣"的技术',
        hint: 'AI技能+8 · 提示词+5 · 幸福+10 · 压力-8 · 健康+3 · 信念+6',
        hintColor: 'positive',
        skillGains: { aiSkill: 8, promptMastery: 5 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.stress = clamp(s.stress - 8, 0, 100);
          s.health = clamp(s.health + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '38岁，你花了一个月研究了一个和KPI完全无关的AI方向——用AI生成音乐。你坐在深夜的房间里，听着AI根据你的prompt生成的旋律，笑了。这是你十六年来最快乐的一个月。',
      },
      {
        id: 'double_down',
        label: '趁还能拼，再冲一波技术巅峰',
        description: '38岁还不算老，再写几年硬核代码',
        hint: 'AI技能+12 · 压力+10 · 健康-5 · 月薪+2000 · 信念+5',
        hintColor: 'neutral',
        skillGains: { aiSkill: 12 },
        salaryChange: 2000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '38岁，你拒绝了"该歇歇了"的劝说，继续在技术一线冲锋。你带了一个前沿AI项目，连续三个月996。项目成功了，但体检报告多了两个箭头。你把报告塞进抽屉，假装没看见。',
      },
      {
        id: 'give_back',
        label: '开始回馈行业，做技术教育',
        description: '把积累的经验传授给更多年轻人',
        hint: 'AI技能+5 · 提示词+10 · 幸福+8 · 被动收入+8000/年 · 压力-5',
        hintColor: 'positive',
        skillGains: { aiSkill: 5, promptMastery: 10 },
        passiveIncomeChange: 8000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '38岁，你开了一个技术专栏，把十六年的踩坑经验写成系列文章。第一条评论是"前辈写的比我导师讲的还清楚"。你盯着屏幕，觉得这些年的苦总算有了点不一样的意义。',
      },
    ],
  },
];

// ============================================================
// AI创业线事件（ages 26-36）
// ============================================================

const aiStartupEvents: NarrativeEvent[] = [

  // 26岁：找合伙人
  {
    id: 'startup_cofounder',
    title: '同路人',
    pathId: 'ai_symbiote',
    branch: 'ai_startup',
    ageRange: [26, 26],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你一个人扛了半年，白天写代码、晚上做产品、深夜回用户消息。你知道这样下去不行——你需要一个合伙人。\n' +
      '候选人有三个：前同事老张技术扎实但保守，大学室友阿杰销售出身嘴皮子溜但不懂技术，还有AI社区认识的极客小林技术天才但性格古怪。你坐在咖啡馆里，面前三杯咖啡凉了两杯。你清楚选错合伙人比选错老婆还致命——技术可迭代，产品可重做，但信任裂了就补不回来。',
    options: [
      {
        id: 'pick_tech_guru',
        label: '选极客小林，技术最强',
        description: '两个技术疯子一起all in，赌产品力碾压一切',
        hint: 'AI技能+12 · 模型训练+10 · 压力+8 · 信念+5 · 但缺商业能力',
        hintColor: 'positive',
        skillGains: { aiSkill: 12, aiTraining: 10 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '26岁，你和小林窝在民房里写代码，外卖盒堆到天花板。你们做出来的东西确实惊艳，但谁来卖？你看着小林跟投资人演示时全程不看对方的眼睛，心里咯噔一下。',
      },
      {
        id: 'pick_sales',
        label: '选销售阿杰，补齐商业短板',
        description: '你负责产品，他负责搞钱，黄金搭档',
        hint: 'AI技能+5 · 提示词+8 · 压力+5 · 信念+3 · 月薪+2000 · 但技术可能拖后腿',
        hintColor: 'neutral',
        skillGains: { aiSkill: 5, promptMastery: 8 },
        salaryChange: 2000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '26岁，阿杰第一周就帮你谈下了三个试用客户。你负责交付，他负责画饼。配合越来越默契，但你偶尔会在深夜想：如果技术再强一点，是不是就不用这么依赖销售了？',
      },
      {
        id: 'go_solo_longer',
        label: '再扛半年，等对的人',
        description: '宁缺毋滥，继续一个人跑',
        hint: 'AI技能+10 · 压力+12 · 健康-5 · 信念+4 · 但可能错过窗口期',
        hintColor: 'neutral',
        skillGains: { aiSkill: 10 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '26岁，你一个人又扛了半年。产品迭代到了v3，用户涨到了500，但你瘦了十斤。某天凌晨四点你趴在键盘上醒来，脸上印着一排按键的痕迹。你问自己：还能撑多久？',
      },
    ],
  },

  // 27岁：MVP开发
  {
    id: 'startup_mvp',
    title: '雏形',
    pathId: 'ai_symbiote',
    branch: 'ai_startup',
    ageRange: [27, 27],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你的AI产品终于跑出了MVP——一个能自动生成营销文案的工具。你用AI写AI工具，用魔法打败魔法。\n' +
      '你找了20个种子用户试用，反馈两极分化：一半说"这东西改变了我的人生"，一半说"这就是个套壳GPT"。你知道他们都没说错。问题是：你要在有限的弹药里决定，接下来往哪个方向打。你盯着那两张反馈表格，像一个在迷雾里看地图的船长。',
    options: [
      {
        id: 'polish_core',
        label: '打磨核心功能，把"套壳"变成"套得好"',
        description: '不急着加功能，把生成质量做到行业第一',
        hint: 'AI技能+12 · 模型训练+12 · 压力+10 · 存款-5000 · 信念+5',
        hintColor: 'positive',
        skillGains: { aiSkill: 12, aiTraining: 12 },
        savingsChange: -5000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '27岁，你花了三个月把文案生成质量做到了行业前三。你用微调+prompt工程的双重优化，让输出从"能用"变成了"好用"。种子用户的留存率从40%升到了70%。',
      },
      {
        id: 'expand_features',
        label: '快速铺功能，抢占品类心智',
        description: 'MVP够用了，先占市场再优化',
        hint: 'AI技能+8 · 提示词+10 · 压力+8 · 存款-8000 · 月薪-1000',
        hintColor: 'neutral',
        skillGains: { aiSkill: 8, promptMastery: 10 },
        savingsChange: -8000,
        salaryChange: -1000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
        },
        log: '27岁，你一个月加了五个功能，从文案扩展到图片、视频脚本、SEO优化。用户数涨了，但口碑开始下滑——"什么都能做，但什么都做不好"。你在增长和质量之间走钢丝。',
      },
      {
        id: 'pivot_niche',
        label: '砍掉一半功能，聚焦一个垂直场景',
        description: '不做"万能工具"，做"某个场景最好的工具"',
        hint: 'AI技能+10 · 模型训练+8 · 压力+6 · 存款-3000 · 信念+6',
        hintColor: 'positive',
        skillGains: { aiSkill: 10, aiTraining: 8 },
        savingsChange: -3000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '27岁，你砍掉了80%的功能，只保留"电商详情页文案"这一个场景。用户从500掉到了200，但留下来的人付费意愿翻了三倍。你第一次理解了什么叫"少即是多"。',
      },
    ],
  },

  // 28岁：种子轮
  {
    id: 'startup_seed',
    title: '弹药',
    pathId: 'ai_symbiote',
    branch: 'ai_startup',
    ageRange: [28, 28],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你的产品有了2000个付费用户，月流水3万，但烧钱速度是月流水的两倍。积蓄快见底了，必须融资。\n' +
      '一个天使投资人约你喝咖啡，问了三个问题："你的壁垒是什么？""大厂做了你怎么办？""你打算什么时候盈利？"你准备了五十页BP，但他只听了三分钟就打断了。"我投人，不投PPT，"他说，"你让我看到了十年前的自己——穷、饿、但眼睛里有光。给你500万，别让我失望。"',
    options: [
      {
        id: 'take_the_money',
        label: '接受500万，出让20%股份',
        description: '拿了钱加速增长，但开始替别人打工了',
        hint: 'AI技能+5 · 模型训练+5 · 存款+30000 · 压力+10 · 信念+3 · 出让20%股份',
        hintColor: 'positive',
        skillGains: { aiSkill: 5, aiTraining: 5 },
        savingsChange: 30000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        log: '28岁，你签了TS，银行账户多了一串零。你终于走出了那一步——从兼职做产品到全职创业，从一个人在工位上偷偷写代码到有人给你投钱让你把它做大。你给团队发了第一笔正式工资，换了办公室，招了三个人。但你知道，从今天起你的每一个决定都要对投资人负责了。',
      },
      {
        id: 'bootstrap_longer',
        label: '拒绝融资，靠用户付费自我造血',
        description: '不拿别人的钱，保持100%的控制权',
        hint: 'AI技能+8 · 压力+12 · 健康-4 · 信念+8 · 但资金紧张',
        hintColor: 'neutral',
        skillGains: { aiSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.health = clamp(s.health - 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '28岁，你拒了500万。你在出租屋里精打细算，每一分钱掰成两半花。三个月后月流水终于超过了支出，你实现了盈亏平衡。你发了条动态圈："自由不是免费的，但值得。"',
      },
      {
        id: 'negotiate_better',
        label: '谈判压价，只要200万出让10%',
        description: '少拿钱少让股份，保持控制力的同时获得弹药',
        hint: 'AI技能+5 · 提示词+5 · 存款+15000 · 压力+8 · 信念+5',
        hintColor: 'neutral',
        skillGains: { aiSkill: 5, promptMastery: 5 },
        savingsChange: 15000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '28岁，你跟投资人磨了一周，最终以200万换10%成交。投资人笑着说"你小子比我想的硬"。你保住了更多股份，也保住了更多话语权。但200万能撑多久，你心里没底。',
      },
    ],
  },

  // 29岁：产品迭代
  {
    id: 'startup_iterate',
    title: '磨刀',
    pathId: 'ai_symbiote',
    branch: 'ai_startup',
    ageRange: [29, 29],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '竞品像蘑菇一样冒出来，三个月内市面上出现了七个几乎一样的产品，有两个还背靠大厂。你的用户增长开始放缓，有大客户在比价。\n' +
      '你把自己关在办公室看了一整天的用户反馈，把300条留言贴满了墙，发现了一个被所有人忽略的痛点——功能早够了，真正缺的是AI生成内容的"品牌一致性"。你像发现新大陆一样兴奋，但三秒就冷静了：这个方向需要大量定制化训练，技术难度高，而且没人验证过用户愿不愿意为此付费。',
    options: [
      {
        id: 'build_brand_ai',
        label: 'All in"品牌一致性"方向',
        description: '做别人没做的，用技术壁垒甩开竞品',
        hint: 'AI技能+12 · 模型训练+12 · 压力+12 · 存款-10000 · 信念+8',
        hintColor: 'positive',
        skillGains: { aiSkill: 12, aiTraining: 12 },
        savingsChange: -10000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '29岁，你用两个月开发出了"品牌AI"功能——用户上传品牌资料后，AI能自动学习品牌调性并保持一致输出。上线第一个月，三个大客户因此续约，客单价翻倍。竞品还在卷价格，你已经在卷价值了。',
      },
      {
        id: 'compete_on_price',
        label: '降价应战，用价格拖死竞品',
        description: '你有先发优势的成本结构，打价格战你不怕',
        hint: 'AI技能+5 · 压力+8 · 存款-5000 · 月薪-1500 · 信念-3',
        hintColor: 'negative',
        skillGains: { aiSkill: 5 },
        savingsChange: -5000,
        salaryChange: -1500,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 3, 0, 100);
        },
        log: '29岁，你把价格砍了40%，竞品跟进后你再砍。三个月后两个小竞品倒闭了，但你的利润也归零了。你赢了价格战，但赢得像惨胜。',
      },
      {
        id: 'pivot_to_b2b',
        label: '从C端转向B端，做企业定制',
        description: 'C端卷不过大厂，B端才是小公司的活路',
        hint: 'AI技能+8 · 模型训练+10 · 提示词+5 · 压力+10 · 存款-8000 · 信念+5',
        hintColor: 'neutral',
        skillGains: { aiSkill: 8, aiTraining: 10, promptMastery: 5 },
        savingsChange: -8000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '29岁，你砍掉了C端免费版，全力做B端定制。第一个企业客户合同50万，你签到手抖。你发现B端虽然慢，但一旦签下来就是稳定的现金流。你不再是那个追DAU的创业者了。',
      },
    ],
  },

  // 30岁：用户增长
  {
    id: 'startup_growth',
    title: '病毒',
    pathId: 'ai_symbiote',
    branch: 'ai_startup',
    ageRange: [30, 30],
    priority: 8,
    weight: 7,
    oncePerGame: true,
    narrative:
      '一个用户发的使用视频播放量破百万，服务器差点被冲垮，注册用户一夜涨了三万。你既兴奋又恐慌——兴奋的是终于看到增长的曙光，恐慌的是系统还没准备好承载这么多用户。\n' +
      '客服消息爆了，bug反馈刷屏，服务器账单在飙升。你站在流量的浪尖上，必须立刻决定：是稳住系统保住口碑，还是趁热打铁继续推增长？',
    options: [
      {
        id: 'stabilize_first',
        label: '暂停推广，先稳系统保口碑',
        description: '磨刀不误砍柴工，别让新用户第一印象就是崩溃',
        hint: 'AI技能+10 · 模型训练+8 · 压力+6 · 存款-6000 · 信念+4',
        hintColor: 'positive',
        skillGains: { aiSkill: 10, aiTraining: 8 },
        savingsChange: -6000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '30岁，你花了一周扩容系统、修bug、优化体验。流量回落了一些，但留下来的用户口碑很好。你后来才知道，如果那天继续推增长，系统会在48小时内彻底崩溃。',
      },
      {
        id: 'ride_the_wave',
        label: '趁热打铁，加大投放收割流量',
        description: '流量窗口稍纵即逝，先圈地再优化',
        hint: 'AI技能+5 · 提示词+8 · 压力+12 · 存款-15000 · 健康-3 · 信念+3',
        hintColor: 'danger',
        skillGains: { aiSkill: 5, promptMastery: 8 },
        savingsChange: -15000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '30岁，你把全部预算砸进了投放，用户冲到了十万。但系统三天崩了两次，差评满天飞。你花了两个月才把口碑修复回来。增长是爽，但你要为冲动买单。',
      },
      {
        id: 'viral_mechanism',
        label: '设计裂变机制，让用户帮你传播',
        description: '不花钱买量，用产品机制驱动自然增长',
        hint: 'AI技能+8 · 提示词+10 · 压力+5 · 存款-3000 · 信念+3',
        hintColor: 'positive',
        skillGains: { aiSkill: 8, promptMastery: 10 },
        savingsChange: -3000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '30岁，你设计了"分享生成结果解锁高级功能"的裂变机制。用户为了免费用高级模板，自发在动态圈传播你的产品。零投放成本，月增长稳定在30%。你第一次尝到了"增长黑客"的甜头。',
      },
    ],
  },

  // 31岁：商业化
  {
    id: 'startup_monetize',
    title: '变血',
    pathId: 'ai_symbiote',
    branch: 'ai_startup',
    ageRange: [31, 31],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你有5万用户，但只有3%付费。投资人开始问"什么时候能看到盈利模型"。你知道再不解决商业化，下一轮融资就没戏了。\n' +
      '你试过涨价，付费用户掉三分之一；试过加广告，C端用户骂街；试过推企业版，但销售周期太长，现金流等不起。你在白板上画满定价模型，擦了又写、写了又擦。商业化是创业的成人礼——你可以靠讲故事活到A轮，但之后必须用数字说话。',
    options: [
      {
        id: 'enterprise_focus',
        label: '砍掉免费版，全面转向企业客户',
        description: '少而精的高客单价，才是小公司的生存之道',
        hint: 'AI技能+8 · 模型训练+8 · 存款+20000 · 月薪+3000 · 压力+10 · 信念+5',
        hintColor: 'positive',
        skillGains: { aiSkill: 8, aiTraining: 8 },
        savingsChange: 20000,
        salaryChange: 3000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '31岁，你关掉了免费版，5万C端用户骂着你离开了。但留下的200个企业客户，每个年付5万。月流水从15万涨到了80万。你第一次看到了盈利的曙光——虽然路上了很多用户的骂。',
      },
      {
        id: 'freemium_tune',
        label: '优化免费转付费漏斗',
        description: '不砍免费版，但设计更聪明的付费触点',
        hint: 'AI技能+5 · 提示词+10 · 存款+10000 · 压力+6 · 信念+3',
        hintColor: 'neutral',
        skillGains: { aiSkill: 5, promptMastery: 10 },
        savingsChange: 10000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '31岁，你重新设计了付费墙——让用户免费用到"刚好不够用"的时候弹出付费。转化率从3%升到了8%。你在数据面板前盯着那个曲线看了半小时，像看自己孩子考试及格了一样。',
      },
      {
        id: 'api_platform',
        label: '开放API，把产品变成平台',
        description: '不只卖工具，还卖能力，让开发者在你的生态上建东西',
        hint: 'AI技能+12 · 模型训练+10 · 压力+12 · 存款-8000 · 信念+8 · 赌生态',
        hintColor: 'neutral',
        skillGains: { aiSkill: 12, aiTraining: 10 },
        savingsChange: -8000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '31岁，你开放了API平台，第一个月就有300个开发者接入。你从"卖工具"变成了"卖水电"。收入还没起来，但你赌的是生态——一旦建成，护城河比任何功能都深。',
      },
    ],
  },

  // 32岁：A轮融资
  {
    id: 'startup_series_a',
    title: '赌桌',
    pathId: 'ai_symbiote',
    branch: 'ai_startup',
    ageRange: [32, 32],
    priority: 7,
    weight: 9,
    oncePerGame: true,
    eventType: 'milestone',
    conditions: (s) => s.currentSavings >= 30000 || getSkill(s, 'aiSkill') >= 50,
    narrative:
      '月流水破了百万，你在VC圈开始有了名气。三家头部基金同时找你谈A轮，估值从5000万到2亿不等。\n' +
      '你坐在顶级律所的会议室里，对面三家基金的代表在抢你。这让你既兴奋又警惕——估值越高，期望越高，一旦达不到下一轮估值，你手里的股份就变成废纸。"选我，最高的估值""选我，最好的资源""选我，我不干涉你"。你面前摆着三张牌，每张都通向不同的未来。',
    options: [
      {
        id: 'highest_valuation',
        label: '选最高估值2亿，拿最多的钱',
        description: '弹药充足才能打赢仗，贵点没关系',
        hint: 'AI技能+5 · 模型训练+5 · 存款+50000 · 压力+15 · 健康-3 · 信念+5 · 但期望极高',
        hintColor: 'danger',
        skillGains: { aiSkill: 5, aiTraining: 5 },
        savingsChange: 50000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '32岁，你签了2亿估值的A轮。庆功宴上你喝了很多，回家后吐了。你不确定是因为酒精还是因为恐惧——从今天起，你必须让这家公司值10亿，否则你就输了。',
      },
      {
        id: 'strategic_investor',
        label: '选估值适中但有产业资源的基金',
        description: '钱够用就行，但资源能帮你拿下大客户',
        hint: 'AI技能+5 · 提示词+5 · 存款+30000 · 压力+8 · 信念+6 · 月薪+2000',
        hintColor: 'positive',
        skillGains: { aiSkill: 5, promptMastery: 5 },
        savingsChange: 30000,
        salaryChange: 2000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '32岁，你选了一家产业基金，估值1亿。他们帮你对接了三个500强客户，你的B端业务直接起飞。你后来想：如果当初选了最高的估值，可能现在还在为凑业绩焦虑得睡不着。',
      },
      {
        id: 'bootstrap_profitable',
        label: '暂停融资，先做到盈利再融',
        description: '不卖太便宜，等盈利了估值翻倍再谈',
        hint: 'AI技能+8 · 压力+10 · 健康-4 · 信念+10 · 但资金紧张',
        hintColor: 'neutral',
        skillGains: { aiSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.health = clamp(s.health - 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
        },
        log: '32岁，你拒绝了所有基金，决定先做到盈利。又熬了半年，你实现了月度盈利。你拿着更好的数据重新融资，估值翻了三倍。你赌对了——但那半年你瘦了十五斤。',
      },
    ],
  },

  // 33岁：团队冲突
  {
    id: 'startup_team_conflict',
    title: '裂痕',
    pathId: 'ai_symbiote',
    branch: 'ai_startup',
    ageRange: [33, 33],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '融了资、招了人、搬了办公室，公司从5人变成30人。但成长的阵痛来了——你的联合创始人在战略方向上和你产生严重分歧。\n' +
      '你主张继续深耕现有产品做深护城河，他主张快速扩张品类抢市场。争论从会议室延伸到下班后的社交软件，再延伸到凌晨三点的电话。最严重的一次他摔门而去，留下一句"你太保守了，早晚被淘汰"。你坐在空荡的办公室里，想起当初在咖啡馆选合伙人的那个下午：你选对人了吗？还是人是对的，只是路走到了分岔口？',
    options: [
      {
        id: 'buy_out_partner',
        label: '用融资回购他的股份，和平分手',
        description: '方向不合强扭的瓜不甜，花钱买回控制权',
        hint: 'AI技能+5 · 存款-20000 · 压力+12 · 信念+3 · 月薪-2000 · 但完全掌控',
        hintColor: 'neutral',
        skillGains: { aiSkill: 5 },
        savingsChange: -20000,
        salaryChange: -2000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
          s.happiness = clamp(s.happiness - 5, 0, 100);
        },
        log: '33岁，你和联合创始人签了分手协议。他带着股份折现的钱离开了，你成了公司唯一的掌舵人。送他下楼那天你们都没说话，只是拍了拍对方的肩。有些路，只能一个人走。',
      },
      {
        id: 'compromise_split',
        label: '折中：一半资源守存量，一半资源探增量',
        description: '各退一步，双线并行',
        hint: 'AI技能+8 · 模型训练+5 · 压力+10 · 存款-10000 · 信念+2',
        hintColor: 'neutral',
        skillGains: { aiSkill: 8, aiTraining: 5 },
        savingsChange: -10000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 2, 0, 100);
        },
        log: '33岁，你和他各让一步，公司分成了两条业务线。精力被分散了，但至少没散伙。三个月后新业务没跑出来，存量业务也受到了影响。你开始怀疑折中是不是最差的选项。',
      },
      {
        id: 'let_partner_lead',
        label: '让出部分决策权，让他试他的方向',
        description: '信任你的合伙人，给他半年证明自己',
        hint: 'AI技能+5 · 提示词+5 · 压力+6 · 信念+5 · 月薪+1000',
        hintColor: 'positive',
        skillGains: { aiSkill: 5, promptMastery: 5 },
        salaryChange: 1000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '33岁，你把新业务交给了他主导。出乎你意料的是，他用了四个月就跑出了一个增长不错的新产品。你在复盘会上说"这次你是对的"，他笑了——这是半年来你们第一次相视而笑。',
      },
    ],
  },

  // 35岁：战略转型
  {
    id: 'startup_pivot',
    title: '换道',
    pathId: 'ai_symbiote',
    branch: 'ai_startup',
    ageRange: [35, 35],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    narrative:
      '大厂终于下场了。你的核心产品被某巨头免费平替，三个月内流失了40%的客户。你站在窗前看着楼下的车流，像看着自己融化的冰淇淋。\n' +
      '你有两条路：和大厂正面硬刚（几乎必败），或者转型到一个大厂看不上的、但你有认知优势的垂直领域。转型意味着抛弃三年积累从零开始；不转型意味着温水煮青蛙慢慢等死。你想起一句话："创业者最危险的时刻，不是没钱的时候，而是舍不得放弃的时候。"',
    options: [
      {
        id: 'pivot_vertical',
        label: '果断转型垂直领域，从零开始',
        description: '壮士断腕，找一个大厂看不上的脏活累活',
        hint: 'AI技能+10 · 模型训练+12 · 压力+15 · 健康-5 · 存款-20000 · 信念+10',
        hintColor: 'positive',
        skillGains: { aiSkill: 10, aiTraining: 12 },
        savingsChange: -20000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
        },
        log: '35岁，你关掉了核心产品，带着团队转到了一个垂直行业——用AI做工业质检。大厂不屑于做，但工厂愿意付大钱。半年后你成了这个细分领域的第一，虽然市场小，但全是你的。',
      },
      {
        id: 'differentiate_deep',
        label: '不转型，用深度差异化死磕',
        description: '大厂免费又怎样？你做得比它深十倍',
        hint: 'AI技能+12 · 模型训练+10 · 压力+12 · 存款-15000 · 信念+5 · 但前途未卜',
        hintColor: 'neutral',
        skillGains: { aiSkill: 12, aiTraining: 10 },
        savingsChange: -15000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '35岁，你没有跑，而是把产品做到了大厂免费功能做不到的深度——企业级定制、私有化部署、行业知识库。流失的客户回来了一半，他们发现免费的东西果然是最贵的。',
      },
      {
        id: 'sell_company',
        label: '把公司卖给大厂，套现离场',
        description: '打不过就加入，拿钱走人也是一种赢',
        hint: 'AI技能+3 · 存款+50000 · 压力-10 · 幸福+8 · 信念-5 · 但失去公司',
        hintColor: 'neutral',
        skillGains: { aiSkill: 3 },
        savingsChange: 50000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 10, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
        },
        log: '35岁，你把公司卖给了那个下场的大厂。签协议那天你的手在抖——不是因为害怕，是因为不舍。你看着自己三年前注册的公司名字变成了大厂的一个产品线，五味杂陈。但银行卡里的数字，让你稍微好受了一点。',
      },
    ],
  },

  // 36岁：规模化挑战
  {
    id: 'startup_scale',
    title: '天花板',
    pathId: 'ai_symbiote',
    branch: 'ai_startup',
    ageRange: [36, 36],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '公司活下来了，年收入2000万，团队50人。但你遇到了新的天花板——你个人的能力边界。\n' +
      '你是技术出身，擅长做产品、写代码、跟客户聊需求。但现在公司需要的是：融资节奏管理、组织架构设计、企业文化塑造……这些你没有一样擅长。你坐在CEO的位置上，却越来越像一个被架空的figurehead。你知道公司要继续长大，你得变成一个你不认识的人——或者，找一个这样的人来替你。',
    options: [
      {
        id: 'hire_pro_ceo',
        label: '请职业经理人当CEO，自己退居技术',
        description: '承认自己的边界，让专业的人做专业的事',
        hint: 'AI技能+12 · 模型训练+8 · 压力-8 · 幸福+5 · 信念+4 · 但失去控制权',
        hintColor: 'positive',
        skillGains: { aiSkill: 12, aiTraining: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 8, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '36岁，你从某大厂挖了一个VP来当CEO，自己退居CTO。新CEO来了第一周就砍掉了你三个宠儿项目。你心疼，但不得不承认他的判断比你准。你终于可以做回你最擅长的事——写代码。',
      },
      {
        id: 'grow_into_ceo',
        label: '硬学CEO技能，逼自己成长',
        description: '没有人天生是CEO，学就是了',
        hint: 'AI技能+5 · 提示词+8 · 压力+15 · 健康-5 · 信念+8 · 月薪+3000',
        hintColor: 'neutral',
        skillGains: { aiSkill: 5, promptMastery: 8 },
        salaryChange: 3000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '36岁，你报了EMBA，请了高管教练，每周读三本管理书。你从"写代码的人"慢慢变成了"管写代码的人的人"。这个过程痛苦但你撑下来了——或者说，你没有退路所以只能撑下来。',
      },
      {
        id: 'stay_small_profitable',
        label: '不追求规模化，做一家"小而美"的公司',
        description: '不一定要做独角兽，持续盈利的慢公司也是一种成功',
        hint: 'AI技能+8 · 压力-10 · 幸福+10 · 健康+5 · 信念+3 · 被动收入+10000/年',
        hintColor: 'positive',
        skillGains: { aiSkill: 8 },
        passiveIncomeChange: 10000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 10, 0, 100);
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.health = clamp(s.health + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '36岁，你做了一个反直觉的决定：不融资、不扩张、不招人。公司保持在30人，每年稳定盈利500万。投资人骂你"浪费机会"，但你的员工从不加班，你自己每天六点下班。你终于想通了：独角兽不是唯一的终点。',
      },
    ],
  },

  // 37岁：生死转型
  {
    id: 'startup_pivot_or_die',
    title: '生死转型',
    pathId: 'ai_symbiote',
    branch: 'ai_startup',
    ageRange: [37, 37],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    sceneTag: 'startup',
    narrative:
      '产品增长停滞了。月活连续三个月原地踏步，投资人开始每周打一个电话"关心进度"。你看着仪表盘上那条平得像死人心电图的曲线，知道再不转型就是等死。\n' +
      '一个投资人拉你喝咖啡，建议加个企业版——"你们技术底子不错，B2B才能赚钱"。你的联合创始人阿坤却红着眼说："消费级AI Agent才是未来，我们不能错过这波浪潮。"账上的钱还够撑六个月。你站在白板前，左边写"企业"，右边写"消费"，中间写"合并"。哪一个都是赌命。',
    options: [
      {
        id: 'enterprise_pivot',
        label: '转型企业级AI解决方案',
        description: '押注B2B，用企业客户的长约换生存时间',
        hint: 'AI技能+10 · 模型训练+8 · 存款-20000 · 压力+12 · 信念+10',
        hintColor: 'positive',
        skillGains: { aiSkill: 10, aiTraining: 8 },
        savingsChange: -20000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
        },
        log: '37岁，你把产品线劈成两半，主力All In企业版。前两个月颗粒无收，团队人心惶惶。第三个月，第一个企业客户签了。你看着合同上的数字，长出了一口气——赌对了。',
      },
      {
        id: 'consumer_agents',
        label: '做消费级AI Agent',
        description: '追消费浪潮，做面向C端用户的AI助手',
        hint: 'AI技能+12 · 提示词+8 · 存款-15000 · 压力+15 · 信念+8',
        hintColor: 'neutral',
        skillGains: { aiSkill: 12, promptMastery: 8 },
        savingsChange: -15000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '37岁，你和阿坤一起押注消费级AI Agent。你们用两周时间做出了Demo，发在新品发布榜上，第一天就冲到了前三。阿坤激动得睡不着，你却盯着服务器账单发呆——流量来了，但变现还遥遥无期。',
      },
      {
        id: 'merge_competitor',
        label: '与竞品合并求生',
        description: '放下身段，和最大的竞争对手合并',
        hint: '模型训练+10 · AI技能+6 · 存款+30000 · 压力+5 · 信念-5',
        hintColor: 'neutral',
        skillGains: { aiTraining: 10, aiSkill: 6 },
        savingsChange: 30000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
        },
        log: '37岁，你咽下骄傲，和那个你骂了三年的竞品坐到了谈判桌前。合并协议签完那天，你没喝酒，独自在办公室坐到天亮。你告诉自己：活下来的人才有资格谈骄傲。',
      },
    ],
  },

  // 38岁：拐点
  {
    id: 'startup_breakthrough_moment',
    title: '拐点',
    pathId: 'ai_symbiote',
    branch: 'ai_startup',
    ageRange: [38, 38],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    sceneTag: 'breakthrough',
    narrative:
      '转型之后，有什么东西开始"咬合"了。\n' +
      '一封邮件躺在收件箱里——某行业头部企业的CIO亲自发来的，标题写着"全集团AI部署意向"。他要你在两周内拿出能覆盖三万人的方案。交付得了，这就是你的拐点；交付不了，这个行业里再没人给你第二次机会。你盯着那封邮件，心跳得厉害。这不是一个订单，这是一张生死状。',
    options: [
      {
        id: 'scale_aggressively',
        label: '全力扩张，赌一把大的',
        description: 'All In交付，押上全部资源赌规模',
        hint: 'AI技能+12 · 模型训练+10 · 存款-30000 · 被动收入+20000/年 · 压力+15 · 信念+12 · 幸福+8',
        hintColor: 'positive',
        skillGains: { aiSkill: 12, aiTraining: 10 },
        savingsChange: -30000,
        passiveIncomeChange: 20000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
        },
        log: '38岁，你把全部身家押上了这个项目。团队三班倒，你睡在办公室。交付那天，客户CTO看完Demo只说了一句："这就是我们要的。"你走出大楼，阳光刺眼，你蹲在路边哭了五分钟。',
      },
      {
        id: 'scale_carefully',
        label: '稳健扩张，先证明ROI',
        description: '先做一个部门试点，用数据说服集团推广',
        hint: 'AI技能+8 · 模型训练+8 · 存款-10000 · 被动收入+10000/年 · 压力+5 · 信念+8',
        hintColor: 'neutral',
        skillGains: { aiSkill: 8, aiTraining: 8 },
        savingsChange: -10000,
        passiveIncomeChange: 10000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '38岁，你拒绝了"一口吃成胖子"的方案，坚持先在一个部门试点三个月。客户CIO皱了眉头，但同意了。三个月后，试点部门效率提升40%，数据会说话。集团全员推广的合同，比预期来得更快。',
      },
      {
        id: 'license_technology',
        label: '技术授权，让客户自建团队',
        description: '把技术授权给客户的内部团队，做技术供应商',
        hint: 'AI技能+6 · 提示词+10 · 存款+50000 · 被动收入+15000/年 · 压力-2 · 信念+5',
        hintColor: 'neutral',
        skillGains: { aiSkill: 6, promptMastery: 10 },
        savingsChange: 50000,
        passiveIncomeChange: 15000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 2, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '38岁，你做了一个"反创业"的决定——不接大单，而是把技术授权给客户的内部团队。你成了技术供应商，每年收授权费。有人说你"格局小"，但你看着稳定的现金流和不再996的团队，觉得这才是可持续的生意。',
      },
    ],
  },

  // 39岁：行业灯塔
  {
    id: 'startup_industry_recognition',
    title: '行业灯塔',
    pathId: 'ai_symbiote',
    branch: 'ai_startup',
    ageRange: [39, 39],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    sceneTag: 'startup',
    narrative:
      '你的公司开始被当案例研究了。行业大会的邀请函雪片般飞来，某本你能叫出名字的科技杂志想给你做封面专题。猎头开始挖你的核心员工——这反而是个好信号，说明你的人"值钱"了。\n' +
      '你从那个"在咖啡馆蹭WiFi写BP的nobody"，变成了"AI创业圈的somebody"。但你心里清楚：聚光灯是双刃剑，照得你多亮，就投下多长的影子。',
    options: [
      {
        id: 'embrace_thought_leader',
        label: '拥抱思想领袖角色',
        description: '接受专访、登台演讲，用影响力为公司背书',
        hint: '提示词+10 · AI技能+6 · 被动收入+8000/年 · 信念+12 · 幸福+10 · 压力+5',
        hintColor: 'positive',
        skillGains: { promptMastery: 10, aiSkill: 6 },
        passiveIncomeChange: 8000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.stress = clamp(s.stress + 5, 0, 100);
        },
        log: '39岁，你登上了那本杂志的封面。封面上你穿着连帽衫，背景是你们公司的Logo。标题写着"AI创业的中国答案"。你把杂志寄给了妈妈，她在电话里哭了——她终于知道你这几年到底在干什么。',
      },
      {
        id: 'focus_product_only',
        label: '拒绝聚光灯，专注产品',
        description: '婉拒所有采访，让产品自己说话',
        hint: 'AI技能+10 · 模型训练+8 · 存款+20000 · 信念+6 · 压力-5',
        hintColor: 'neutral',
        skillGains: { aiSkill: 10, aiTraining: 8 },
        savingsChange: 20000,
        isRestOption: true,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
        },
        log: '39岁，你拒绝了所有采访邀请，把精力全砸在产品上。团队私下说你"不会营销自己"，但你不在乎。一年后，产品口碑成了你最好的广告——客户主动帮你传播，比你上十次杂志都管用。',
      },
      {
        id: 'mentor_next_gen',
        label: '用平台扶持下一代AI创业者',
        description: '把经验和资源分享给年轻创业者',
        hint: 'AI技能+4 · 提示词+8 · 信念+10 · 幸福+12',
        hintColor: 'positive',
        skillGains: { aiSkill: 4, promptMastery: 8 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.happiness = clamp(s.happiness + 12, 0, 100);
        },
        log: '39岁，你做了一个"反直觉"的决定：花时间带三个年轻的AI创业者。不收钱，不占股，只是每周聊一小时。有人说你"浪费精力"，但你想起了当年那个在咖啡馆写BP、没人理的自己。你不想让下一个你那么孤独。',
      },
    ],
  },

  // 40岁：十年
  {
    id: 'startup_legacy_decision',
    title: '十年',
    pathId: 'ai_symbiote',
    branch: 'ai_startup',
    ageRange: [40, 40],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    sceneTag: 'breakthrough',
    narrative:
      '距离你开始这段旅程，快十年了。公司活下来了，稳定盈利，团队成熟，你不用再睡办公室了。但你40岁了——镜子里的发际线比30岁高了两厘米，膝盖下楼梯会响，通宵一次要缓三天。\n' +
      '一封收购意向书躺在桌上，数字不错。一个26岁的年轻创业者约你喝咖啡，想请你做CTO兼导师。或者，你可以继续独立经营下去，做一家"百年老店"。"成功"到底是什么？你30岁那年以为是上市敲钟，现在你不那么确定了。',
    options: [
      {
        id: 'accept_acquisition',
        label: '接受收购，实现财务自由',
        description: '把公司卖掉，兑现十年的赌注',
        hint: 'AI技能+4 · 存款+200000 · 被动收入+30000/年 · 信念+8 · 幸福+15 · 压力-10',
        hintColor: 'positive',
        skillGains: { aiSkill: 4 },
        savingsChange: 200000,
        passiveIncomeChange: 30000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.happiness = clamp(s.happiness + 15, 0, 100);
          s.stress = clamp(s.stress - 10, 0, 100);
        },
        log: '40岁，你在收购协议上签了字。笔尖落下的那一刻，你想起30岁那个在咖啡馆写BP的夜晚——那时候你一无所有，只有一腔孤勇。十年了，你赌赢了。账户里的数字让你余生无忧，但真正让你平静的是：你知道自己没有辜负那个夜晚的自己。',
        triggersRetirementCheck: true,
      },
      {
        id: 'keep_independent',
        label: '保持独立，继续造物',
        description: '不卖、不加入、继续做自己的公司',
        hint: 'AI技能+8 · 模型训练+6 · 被动收入+10000/年 · 信念+12 · 幸福+5',
        hintColor: 'neutral',
        skillGains: { aiSkill: 8, aiTraining: 6 },
        passiveIncomeChange: 10000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        log: '40岁，你把收购意向书退了回去。投资人骂你"不识抬举"，但你知道自己不是为钱创业的。你想做一家能活二十年的公司，哪怕它永远不是独角兽。你回到工位，打开IDE，写下了新版本的第一行代码——像个十年前的年轻人。',
      },
      {
        id: 'become_cto_mentor',
        label: '加入年轻创业者，做CTO+导师',
        description: '把火炬传给下一代，自己做技术+导师',
        hint: 'AI技能+6 · 模型训练+10 · 提示词+6 · 存款+80000 · 被动收入+12000/年 · 信念+10 · 幸福+8 · 压力-5',
        hintColor: 'neutral',
        skillGains: { aiSkill: 6, aiTraining: 10, promptMastery: 6 },
        savingsChange: 80000,
        passiveIncomeChange: 12000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
        },
        log: '40岁，你卖掉了公司，加入了那个26岁年轻人的团队，做CTO兼导师。第一次全员会上，年轻人介绍你："这位是我们的CTO，也是我的老师。"你看着他眼里的光，想起了十年前的阿坤，想起了十年前的自己。火炬，传下去了。',
      },
    ],
  },
];

// ============================================================
// 布道师线事件（ages 26-38）
// ============================================================

const aiEvangelistEvents: NarrativeEvent[] = [

  // 26岁：写教程
  {
    id: 'evangelist_tutorial',
    title: '火种',
    pathId: 'ai_symbiote',
    branch: 'ai_evangelist',
    ageRange: [26, 26],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你写了一篇"AI提示词入门指南"，发在公众号和问答社区上。你没什么期待，只是觉得网上那些教程要么太水要么太装。\n' +
      '第二天醒来，阅读量破五万，第三天十万。评论区全是"终于有人讲人话了"。你的手机被私信挤爆，有人问你接不接付费咨询。你盯着那些数字，心跳加速——你意识到：你掌握的"常识"，对大多数人来说是"稀缺品"。信息差，就是钱。',
    options: [
      {
        id: 'series_content',
        label: '趁热打铁，做成系列教程',
        description: '保持更新频率，把流量变成粉丝',
        hint: '提示词+12 · AI技能+5 · 压力+6 · 被动收入+3000/年 · 信念+5 · 副业+5000',
        hintColor: 'positive',
        skillGains: { promptMastery: 12, aiSkill: 5 },
        passiveIncomeChange: 3000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.currentYearSideHustle += 5000; // 第一个付费咨询客户私信找上门
        },
        log: '26岁，你开始每周更新一篇AI教程，三个月攒了5万粉丝。有MCN找你签约，有出版社问你要不要出书。有个创业者私信付费请你做AI选型咨询，5000块落袋——你第一次觉得，"写东西"这件事，也许真的能养活你。',
      },
      {
        id: 'video_format',
        label: '转型视频，做视频平台/短视频平台',
        description: '图文流量见顶了，视频才是未来',
        hint: '提示词+8 · AI技能+3 · 压力+10 · 存款-5000 · 被动收入+2000/年',
        hintColor: 'neutral',
        skillGains: { promptMastery: 8, aiSkill: 3 },
        savingsChange: -5000,
        passiveIncomeChange: 2000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '26岁，你买了相机和麦克风，开始录AI教学视频。第一个视频你NG了二十遍，剪辑到凌晨四点。发出去后播放量只有800，但有一条弹幕说"讲得比官方文档清楚多了"。你决定继续。',
      },
      {
        id: 'deep_technical',
        label: '不追热点，写深度技术文章',
        description: '做小众但高价值的内容，吸引高质量读者',
        hint: 'AI技能+12 · 提示词+8 · 压力+4 · 被动收入+1000/年 · 信念+6',
        hintColor: 'neutral',
        skillGains: { aiSkill: 12, promptMastery: 8 },
        passiveIncomeChange: 1000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '26岁，你拒绝了追热点，开始写AI底层原理的深度长文。每篇只有几千阅读，但评论区全是行业大佬。有CTO私信你"招不招人"，有教授把你的文章列进了推荐阅读。你的粉丝少，但每一个都值钱。',
      },
    ],
  },

  // 27岁：社群运营
  {
    id: 'evangelist_community',
    title: '部落',
    pathId: 'ai_symbiote',
    branch: 'ai_evangelist',
    ageRange: [27, 27],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '你的粉丝涨到了十万，私信每天爆满。你意识到一对一回答问题不可持续，于是建了一个AI学习社群。\n' +
      '第一天涌入500人，第二天800人。群里热闹非凡，有人分享prompt技巧，有人求助debug。你看着消息列表滚动，像看着自己点燃的篝火——温暖，但也可能失控。社群是资产，也是枷锁。管得好它是护城河，管不好它会吞掉你所有时间。',
    options: [
      {
        id: 'paid_community',
        label: '设付费门槛，筛选高质量成员',
        description: '免费群注定水化，付费才能沉淀价值',
        hint: '提示词+8 · AI技能+3 · 被动收入+8000/年 · 压力+5 · 信念+4',
        hintColor: 'positive',
        skillGains: { promptMastery: 8, aiSkill: 3 },
        passiveIncomeChange: 8000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '27岁，你的付费社群定价199/年，首日有300人付费。你用这笔钱请了两个兼职管理员，自己只负责每周一次的干货分享。社群质量远超免费群，口碑反过来又带来了更多付费用户。飞轮转起来了。',
      },
      {
        id: 'free_grow_fast',
        label: '保持免费，用规模换影响力',
        description: '先把盘子做大，影响力大了钱自然来',
        hint: '提示词+5 · AI技能+3 · 压力+10 · 健康-3 · 被动收入+2000/年 · 信念+3',
        hintColor: 'neutral',
        skillGains: { promptMastery: 5, aiSkill: 3 },
        passiveIncomeChange: 2000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '27岁，你的免费社群涨到了5000人，但消息量也涨到了你每天要花三小时管理。你请了志愿者帮忙，但群还是越来越水。影响力是大了，但你开始怀念当初那500人时的纯粹。',
      },
      {
        id: 'delegate_community',
        label: '培养核心用户自治，自己当精神领袖',
        description: '让铁粉帮你管，你只做顶层内容',
        hint: '提示词+10 · 幸福+5 · 压力-3 · 被动收入+4000/年 · 信念+5',
        hintColor: 'positive',
        skillGains: { promptMastery: 10 },
        passiveIncomeChange: 4000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.stress = clamp(s.stress - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '27岁，你从社群里选了五个活跃用户当"长老"，把日常管理交给了他们。你只在每周三晚上出现一次做分享。社群自己运转得比你管时还好——你第一次理解了"社区自治"的力量。',
      },
    ],
  },

  // 28岁：付费课程
  {
    id: 'evangelist_paid_course',
    title: '变现',
    pathId: 'ai_symbiote',
    branch: 'ai_evangelist',
    ageRange: [28, 28],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    narrative:
      '粉丝催了你半年："出课吧，我们愿意付费。"你终于决定做一门系统的AI实战课。你花了两个月写大纲、录视频、做课件，定价499纠结了一周——太贵怕没人买，太便宜怕显得不值。\n' +
      '上架那天你刷新了二十次后台，直到第一个订单通知弹出，你差点从椅子上跳起来。第一个月卖了800份。你盯着那个数字——39.9万。你头一回用"知识"赚到了比你一年工资还多的钱。',
    options: [
      {
        id: 'scale_course',
        label: '加大投入，把课程做成体系',
        description: '一门课不够，做成一个课程矩阵',
        hint: '提示词+10 · AI技能+5 · 压力+8 · 存款-10000 · 被动收入+15000/年 · 信念+5',
        hintColor: 'positive',
        skillGains: { promptMastery: 10, aiSkill: 5 },
        savingsChange: -10000,
        passiveIncomeChange: 15000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        log: '28岁，你一口气做了三门课——入门、进阶、实战。矩阵化运营后年收入破了50万。你还在上班，但所有人都知道你的重心早就不在工位上了。你妈打电话问你"到底在干什么工作"，你说"当老师"，她终于放心了。你心想：等副业收入再稳定一点，就正式辞职。',
      },
      {
        id: 'high_ticket_coaching',
        label: '推高客单价私教服务',
        description: '不卷低价课，做1对1高净值服务',
        hint: '提示词+8 · AI技能+8 · 压力+6 · 被动收入+12000/年 · 信念+4 · 月薪+2000 · 副业+10000',
        hintColor: 'positive',
        skillGains: { promptMastery: 8, aiSkill: 8 },
        passiveIncomeChange: 12000,
        salaryChange: 2000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          s.currentYearSideHustle += 10000; // 首批私教客户预付的季费集中到账
        },
        log: '28岁，你推出了9800/人的AI私教服务，专接企业高管和创业者。第一个月只签了5个人，但首期预付的10000块到账时你盯着手机看了很久。你发现：卖知识不如卖"陪跑"，高净值客户要的不是内容，是信心。',
      },
      {
        id: 'free_content_first',
        label: '继续做免费内容，课程只做精品',
        description: '不贪多，一年只做一门课，但做到最好',
        hint: '提示词+12 · AI技能+5 · 压力+4 · 被动收入+8000/年 · 信念+6 · 幸福+5',
        hintColor: 'neutral',
        skillGains: { promptMastery: 12, aiSkill: 5 },
        passiveIncomeChange: 8000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        log: '28岁，你拒绝了MCN"月更一门课"的提议，坚持一年只做一门精品课。你的课被学员称为"AI课的天花板"，口碑带来了稳定的自然增长。赚的没有矩阵多，但你睡得着觉。',
      },
    ],
  },

  // 29岁：直播带货AI工具
  {
    id: 'evangelist_livestream',
    title: '聚光灯',
    pathId: 'ai_symbiote',
    branch: 'ai_evangelist',
    ageRange: [29, 29],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '一个AI工具品牌找你直播带货，坑位费2万+分成。你犹豫了——你一直以"干货博主"自居，带货会不会掉粉？但你也清楚，光靠课程收入增长快见顶了，你需要更大的现金流。而且说实话，那个工具你确实用过，确实好用。\n' +
      '你站在镜子前练习"大家好，今天给大家推荐一款……"练了十遍，每一遍都觉得尴尬。你问自己：你是在分享好东西，还是在卖人设？',
    options: [
      {
        id: 'do_livestream',
        label: '接！赚钱不丢人',
        description: '只要推的东西确实好，带货也是分享',
        hint: '提示词+5 · AI技能+3 · 存款+30000 · 压力+10 · 信念-3 · 幸福-2',
        hintColor: 'positive',
        skillGains: { promptMastery: 5, aiSkill: 3 },
        savingsChange: 30000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 3, 0, 100);
          s.happiness = clamp(s.happiness - 2, 0, 100);
        },
        log: '29岁，你第一次直播卖了400单，分成加坑位费赚了8万。下播后你看评论区，有人说"终于接广了，取关"，也有人说"推荐的工具确实好用，已上车"。你数了数掉粉数，然后看了眼银行卡——算了，值。',
      },
      {
        id: 'selective_endorse',
        label: '只接真正好用的，限量带货',
        description: '一年只带3次货，但每次都亲自深度测评',
        hint: '提示词+8 · AI技能+5 · 存款+15000 · 压力+5 · 信念+3 · 幸福+3',
        hintColor: 'positive',
        skillGains: { promptMastery: 8, aiSkill: 5 },
        savingsChange: 15000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
        },
        log: '29岁，你定了一条规矩：只推荐自己用了一个月以上的工具。一年只带了三次货，但因为测评太实在，粉丝反而更信任你了。有粉丝说"你推荐的我闭眼买"，你知道这是最高的赞誉。',
      },
      {
        id: 'refuse_monetize',
        label: '不带货，保持内容纯粹',
        description: '声誉是最大的资产，不能为了快钱消耗它',
        hint: '提示词+10 · 信念+8 · 幸福+5 · 压力-3 · 但收入受限',
        hintColor: 'neutral',
        skillGains: { promptMastery: 10 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.stress = clamp(s.stress - 3, 0, 100);
        },
        log: '29岁，你拒绝了所有带货邀约。粉丝夸你"有风骨"，但你心里清楚：纯粹是贵，但也是穷。你靠课程和社群勉强维持，但看着同行带货月入百万，说不心动是假的。',
      },
    ],
  },

  // 30岁：知识星球
  {
    id: 'evangelist_planet',
    title: '星球',
    pathId: 'ai_symbiote',
    branch: 'ai_evangelist',
    ageRange: [30, 30],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '你开了知识星球，年费365——一块钱一天。你在简介里写"每天一个AI实战技巧，有问必答"。第一天涌入2000人，你兴奋了一整天，然后开始害怕——你答应了"每天更新"和"有问必答"，2000个人的问题你答得过来吗？\n' +
      '你看后台的消息红点越来越多，像一个不断膨胀的气球。你知道这是你最大的资产，但你也知道如果服务质量下降，气球会爆。',
    options: [
      {
        id: 'daily_grind',
        label: '信守承诺，每天更新每天答',
        description: '用命换口碑，把星球做成你的核心竞争力',
        hint: '提示词+10 · AI技能+5 · 压力+15 · 健康-8 · 被动收入+20000/年 · 信念+5',
        hintColor: 'positive',
        skillGains: { promptMastery: 10, aiSkill: 5 },
        passiveIncomeChange: 20000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.health = clamp(s.health - 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '30岁，你连续365天没断更。最后一个月你每天只睡四小时，靠咖啡和意志力撑着。星球续费率85%，你成了行业标杆。但体检报告上多了四个箭头，医生说"再这样下去要出事"。',
      },
      {
        id: 'batch_content',
        label: '批量制作内容，用AI辅助回答',
        description: '用你自己的AI工作流提升效率',
        hint: '提示词+12 · AI技能+8 · 压力+6 · 被动收入+15000/年 · 信念+4',
        hintColor: 'positive',
        skillGains: { promptMastery: 12, aiSkill: 8 },
        passiveIncomeChange: 15000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '30岁，你用AI搭了一套内容生产pipeline——AI帮你收集热点、生成初稿、整理问答，你只做最终审核。效率提升了五倍，你终于不用熬夜了。你笑着说：AI布道师，果然得用AI武装自己。',
      },
      {
        id: 'tiered_service',
        label: '分层服务，高阶用户才有一对一',
        description: '普通星球+高端私享圈，精力分配给高净值用户',
        hint: '提示词+8 · AI技能+3 · 压力+4 · 被动收入+18000/年 · 信念+3',
        hintColor: 'neutral',
        skillGains: { promptMastery: 8, aiSkill: 3 },
        passiveIncomeChange: 18000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '30岁，你推出了9800/年的高端私享圈，只收50人。普通星球只做日常分享，不再承诺一对一。有人骂你"割韭菜"，但高端圈的50个人每次续费都毫不犹豫。你学会了：精力是有限的，要分配给最值钱的人。',
      },
    ],
  },

  // 31岁：品牌合作
  {
    id: 'evangelist_brand',
    title: '牌面',
    pathId: 'ai_symbiote',
    branch: 'ai_evangelist',
    ageRange: [31, 31],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '一家AI大厂的市场部找到你，想请你做品牌大使——真正深度合作而非挂名：有专属频道、参与产品内测、出席发布会。合作费每年50万，外加活动出场费。\n' +
      '这是让同行眼红的offer。但你也清楚，拿了这家大厂的钱，你对它的竞品还能客观评价吗？你的"独立客观"人设，值多少钱？你看着合同上的数字，又看着粉丝群里那条"你最信任的AI博主"的置顶消息。',
    options: [
      {
        id: 'accept_ambassador',
        label: '接受品牌大使，深度绑定',
        description: '50万年薪+资源，傻子才拒绝',
        hint: '提示词+5 · AI技能+8 · 存款+30000 · 月薪+3000 · 压力+8 · 信念-5',
        hintColor: 'positive',
        skillGains: { promptMastery: 5, aiSkill: 8 },
        savingsChange: 30000,
        salaryChange: 3000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
        },
        log: '31岁，你签了品牌大使。第一次以"大使"身份出席发布会时你穿着品牌方的定制T恤，台下有粉丝喊你的名字。你很有面子，但回家后刷到一条评论"他已经不是当初那个独立的博主了"，你盯着屏幕看了很久。',
      },
      {
        id: 'multi_brand_neutral',
        label: '不绑一家，做多品牌中立评测',
        description: '同时接多家，但保持评测中立性',
        hint: '提示词+8 · AI技能+10 · 存款+20000 · 压力+5 · 信念+3',
        hintColor: 'positive',
        skillGains: { promptMastery: 8, aiSkill: 10 },
        savingsChange: 20000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '31岁，你拒绝了独家绑定，改做"多品牌联合评测"。你同时和三家公司合作，但每期评测都给出真实优缺点。粉丝说"你是唯一敢说大厂不好的人"，反而更信任你了。你发现：中立，也是一种品牌。',
      },
      {
        id: 'stay_independent',
        label: '拒绝，做一个完全独立的博主',
        description: '不拿任何一家的钱，只对粉丝负责',
        hint: '提示词+10 · 信念+10 · 幸福+5 · 压力-3 · 但少赚30万',
        hintColor: 'neutral',
        skillGains: { promptMastery: 10 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.stress = clamp(s.stress - 3, 0, 100);
        },
        log: '31岁，你拒了50万的品牌大使。你在粉丝群说"我不拿任何一家的钱，只对你们负责"。群里刷屏了一整夜的" Respect"。你少赚了30万，但你觉得自己的脊梁骨值这个价。',
      },
    ],
  },

  // 32岁：演讲巡讲
  {
    id: 'evangelist_speaking',
    title: '聚光灯下',
    pathId: 'ai_symbiote',
    branch: 'ai_evangelist',
    ageRange: [32, 32],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你开始被请去各大AI峰会演讲。从最初500人的分会场，到后来3000人的主会场。你的PPT被同行传阅，你的金句被截图传播。\n' +
      '但你也发现了一个问题——你越来越忙，越来越少真正深入研究AI技术。你的内容开始"二手化"：不是在分享自己的实践，而是在转述别人的论文。在一次演讲后台，一个学生问你一个技术细节，你支支吾吾答不上来。你看到他眼里的失望，那个眼神刺痛了你。',
    options: [
      {
        id: 'reduce_speaking',
        label: '减少演讲，回归深度研究',
        description: '影响力够了，是时候回补技术了',
        hint: 'AI技能+12 · 提示词+5 · 压力+6 · 健康-3 · 信念+8 · 被动收入-5000/年',
        hintColor: 'positive',
        skillGains: { aiSkill: 12, promptMastery: 5 },
        passiveIncomeChange: -5000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '32岁，你推掉了80%的演讲邀请，回到书桌前啃论文、做实验。三个月后你写出了一篇万字长文，被行业大佬转发并评论"这才是真懂AI的人写的"。你发现：影响力是浮沫，深度才是礁石。',
      },
      {
        id: 'leverage_speaking',
        label: '趁势而上，用演讲扩大影响力版图',
        description: '热度不等人，先把地盘占住再说',
        hint: '提示词+12 · AI技能+3 · 压力+10 · 健康-5 · 存款+20000 · 信念+3',
        hintColor: 'neutral',
        skillGains: { promptMastery: 12, aiSkill: 3 },
        savingsChange: 20000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '32岁，你一年做了40场演讲，飞了60次航班。你的名字成了AI圈的"流量密码"，出场费涨到了5万一场。但你在飞机上补觉的时间比写代码的时间多。你知道你在透支，但你停不下来。',
      },
      {
        id: 'speaking_plus_research',
        label: '演讲和研究并行，用演讲倒逼输入',
        description: '每场演讲准备的过程就是学习的过程',
        hint: '提示词+10 · AI技能+10 · 压力+12 · 健康-4 · 信念+6 · 月薪+1000',
        hintColor: 'positive',
        skillGains: { promptMastery: 10, aiSkill: 10 },
        salaryChange: 1000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.health = clamp(s.health - 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '32岁，你把每场演讲当成一次深度学习的机会——为了讲清楚一个话题，你会花一周研究到通透。演讲质量越来越高，你的技术也没落下。你累得像条狗，但你觉得值。',
      },
    ],
  },

  // 34岁：出书
  {
    id: 'evangelist_book',
    title: '铅字',
    pathId: 'ai_symbiote',
    branch: 'ai_evangelist',
    ageRange: [34, 34],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '一家出版社找你出书，书名暂定《AI生存指南》。你犹豫了——出书赚不了多少钱，版税还没你一场直播多。但你知道书的意义不在钱：它是你思想的纪念碑，是你从"网红"到"作者"的成人礼。\n' +
      '你用了六个月写完12万字。交稿那天你翻着打印出来的厚厚一摞纸，摸着自己名字的封面，有一种跟发爆款视频完全不同的满足感——视频是消费完即弃的快餐，书是可以放在书架上十年的存粮。',
    options: [
      {
        id: 'serious_book',
        label: '写一本严肃的技术著作',
        description: '不写口水书，写一本十年后还有人翻的硬核书',
        hint: 'AI技能+12 · 提示词+10 · 压力+10 · 健康-4 · 被动收入+5000/年 · 信念+8',
        hintColor: 'positive',
        skillGains: { aiSkill: 12, promptMastery: 10 },
        passiveIncomeChange: 5000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.health = clamp(s.health - 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
        },
        log: '34岁，你的书出版了，首印5000册三个月卖光。有大学教授把它列为了推荐教材，有读者说"这是我AI书架上最厚也最常翻的一本"。你抚摸着书的封面，觉得这比任何爆款视频都持久。',
      },
      {
        id: 'mass_market_book',
        label: '写一本面向大众的畅销书',
        description: '通俗易懂，冲销量和影响力',
        hint: '提示词+12 · AI技能+3 · 压力+6 · 被动收入+8000/年 · 信念+4 · 月薪+1000',
        hintColor: 'neutral',
        skillGains: { promptMastery: 12, aiSkill: 3 },
        passiveIncomeChange: 8000,
        salaryChange: 1000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '34岁，你的畅销书卖了8万册，上了当当科技榜TOP10。你在签售会上排了两小时的队，有读者说"因为你的书我转行做了AI"。你笑了笑，但心里有点虚——你知道那本书的深度配不上这句话。',
      },
      {
        id: 'self_publish',
        label: '自出版电子书，保持完全控制',
        description: '不走传统出版，自己掌握内容和利润',
        hint: '提示词+10 · AI技能+8 · 压力+4 · 被动收入+10000/年 · 信念+5',
        hintColor: 'neutral',
        skillGains: { promptMastery: 10, aiSkill: 8 },
        passiveIncomeChange: 10000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '34岁，你跳过出版社，自己在平台发布了电子书。没有实体书的仪式感，但利润是传统出版的五倍，而且可以随时更新。你把"持续更新"做成了卖点——买一次，终身免费看新版。粉丝很买账。',
      },
    ],
  },

  // 36岁：导师计划
  {
    id: 'evangelist_mentor_prog',
    title: '回声',
    pathId: 'ai_symbiote',
    branch: 'ai_evangelist',
    ageRange: [36, 36],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '你做了十年AI布道，粉丝50万，课程学员过万。但你开始问自己一个问题：你到底改变了什么？\n' +
      '你翻看学员反馈，有人因为你转行AI月入三万，有人买了课从来没看完。你意识到，内容的传播不等于知识的传递——你能让十万人看到，但真正能帮到多少人？你决定做一个"导师计划"——不是录课，是真正带人。每年只收20个，手把手带一年。你不知道这能不能scale，但你知道这是你真正想做的事。',
    options: [
      {
        id: 'elite_mentorship',
        label: '做精英导师计划，每年只带20人',
        description: '深度陪伴，真正改变一小群人',
        hint: 'AI技能+10 · 提示词+10 · 压力+8 · 幸福+12 · 被动收入+20000/年 · 信念+10',
        hintColor: 'positive',
        skillGains: { aiSkill: 10, promptMastery: 10 },
        passiveIncomeChange: 20000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.happiness = clamp(s.happiness + 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
        },
        log: '36岁，你的导师计划首期20人毕业了。有人拿到了大厂offer，有人创业融到了资，有人只是终于敢在团队里开口讲AI了。结业典礼上有人哭着说"谢谢你改变了我的人生"，你也红了眼眶。这一刻，你觉得一切都值了。',
      },
      {
        id: 'scale_mentorship',
        label: '用AI做规模化导师系统',
        description: '用AI分身同时带1000人',
        hint: 'AI技能+12 · 提示词+12 · 压力+10 · 被动收入+25000/年 · 信念+5',
        hintColor: 'neutral',
        skillGains: { aiSkill: 12, promptMastery: 12 },
        passiveIncomeChange: 25000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '36岁，你用AI做了一个"导师分身"系统——它能模拟你的回答风格、引用你的过往内容、甚至模仿你的语气。1000个学员同时学习，你只做高阶答疑。有人说"这不像AI，像你本人"。你笑了，也有一丝说不清的失落。',
      },
      {
        id: 'free_mentorship',
        label: '做免费导师计划，回馈行业',
        description: '不收费，专门带那些付不起课的人',
        hint: '提示词+8 · AI技能+5 · 幸福+12 · 压力-5 · 信念+12 · 健康+3 · 无直接收入',
        hintColor: 'positive',
        skillGains: { promptMastery: 8, aiSkill: 5 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 12, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.health = clamp(s.health + 3, 0, 100);
        },
        log: '36岁，你开了一个免费的AI导师计划，专收那些买不起课的年轻人。你用周末时间带他们，没有一分钱回报。有人说你傻，但你想起了22岁时那个没人带、自己摸黑的自己。你不想让下一个人也那么孤独。',
      },
    ],
  },

  // 37岁：一本书
  {
    id: 'evangelist_book_deal',
    title: '一本书',
    pathId: 'ai_symbiote',
    branch: 'ai_evangelist',
    ageRange: [37, 37],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    sceneTag: 'breakthrough',
    narrative:
      '一家大出版社的编辑找上门来，开口就是版税预付三十万。选题已经替你想好了——《AI时代的人》，一本写给普通人的"与AI共生指南"。编辑说："你的课程已经证明你能讲清楚这件事，现在把它变成一本书，影响会大十倍。"\n' +
      '预付款很诱人，但你盯着那个选题发呆。你的课程里该讲的都讲了，写一本书——你真的有什么新东西要说吗？还是只是把旧内容换个载体再卖一次？',
    options: [
      {
        id: 'write_definitive_book',
        label: '写一本定义时代的书',
        description: '把十年的思考结晶成一份"时代证词"',
        hint: '提示词+12 · AI技能+6 · 存款+30000 · 被动收入+10000/年 · 信念+12 · 压力+10',
        hintColor: 'positive',
        skillGains: { promptMastery: 12, aiSkill: 6 },
        savingsChange: 30000,
        passiveIncomeChange: 10000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.stress = clamp(s.stress + 10, 0, 100);
        },
        log: '37岁，你关掉所有社交软件，用半年时间写完了那本书。交稿那天你瘦了八斤，但稿子比预想的厚一倍。编辑看完只说了一句："这不是一本课程讲义，这是一份时代证词。"上市第一周加印三次。',
      },
      {
        id: 'refuse_stay_courses',
        label: '拒绝，继续专注课程',
        description: '不写书，把精力放在打磨课程上',
        hint: '提示词+8 · 存款+15000 · 信念+5 · 压力-3',
        hintColor: 'neutral',
        skillGains: { promptMastery: 8 },
        savingsChange: 15000,
        isRestOption: true,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.stress = clamp(s.stress - 3, 0, 100);
        },
        log: '37岁，你婉拒了出版社。你说："我还没有非说不可的话。"编辑遗憾地走了。你把那笔预付款的数字从脑子里赶走，继续打磨你的课程。有人笑你"不识抬举"，但你知道：在没有想清楚之前出书，是对读者的不负责。',
      },
      {
        id: 'write_practitioner_handbook',
        label: '写一本实战手册',
        description: '不写宣言，写一本可操作的实用手册',
        hint: '提示词+10 · AI技能+4 · 存款+20000 · 被动收入+6000/年 · 信念+8 · 幸福+5',
        hintColor: 'neutral',
        skillGains: { promptMastery: 10, aiSkill: 4 },
        savingsChange: 20000,
        passiveIncomeChange: 6000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        log: '37岁，你没写"时代宣言"，而是写了一本《AI实战手册》——100个场景、100个prompt模板、100个避坑清单。没有宏大叙事，全是能直接用的东西。读者反馈"这是唯一一本我看完就能上手的书"。你笑了：实用，也是一种态度。',
      },
    ],
  },

  // 38岁：上书房
  {
    id: 'evangelist_policy_advisor',
    title: '上书房',
    pathId: 'ai_symbiote',
    branch: 'ai_evangelist',
    ageRange: [38, 38],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    sceneTag: 'breakthrough',
    narrative:
      '一封盖着红头的邀请函到了你手里——某政府智库邀请你担任AI素养政策顾问。这意味着你的建议可能影响千万人学习AI的方式。但也意味着：无休止的会议、冗长的公文、被删改得面目全非的方案，以及——你必须收起你那套"直言不讳"的风格。\n' +
      '你想起自己最得意的一条视频标题："AI不会淘汰你，但会用AI的人会。"这种话在体制内是写不进文件的。你能忍受吗？',
    options: [
      {
        id: 'join_policy_advisor',
        label: '加入智库，推动政策',
        description: '进入体制，用系统的方式影响更多人',
        hint: '提示词+8 · AI技能+6 · 被动收入+8000/年 · 信念+12 · 压力+8 · 幸福+5',
        hintColor: 'positive',
        skillGains: { promptMastery: 8, aiSkill: 6 },
        passiveIncomeChange: 8000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        log: '38岁，你成了智库最年轻的特邀顾问。第一次开会你差点和司长吵起来——你的方案被砍掉了一半。但半年后，你起草的"全民AI素养倡议"写进了文件。你看着那份红头文件，第一次觉得：改变系统，比改变一个人难一万倍，但值得。',
      },
      {
        id: 'refuse_stay_independent',
        label: '拒绝，保持独立发声',
        description: '不进体制，继续做自由的布道者',
        hint: '提示词+10 · AI技能+4 · 存款+20000 · 信念+8 · 压力-3',
        hintColor: 'neutral',
        skillGains: { promptMastery: 10, aiSkill: 4 },
        savingsChange: 20000,
        isRestOption: true,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.stress = clamp(s.stress - 3, 0, 100);
        },
        log: '38岁，你退回了邀请函。朋友说你"错失了上岸机会"，但你知道自己是什么人——你的价值在于敢说真话，进了体制你就不是你了。你继续做你的独立内容，骂该骂的，夸该夸的。自由，是你的护城河。',
      },
      {
        id: 'informal_advisor',
        label: '做非正式外部顾问',
        description: '不入编，以外部专家身份提供建议',
        hint: '提示词+8 · AI技能+6 · 存款+10000 · 被动收入+4000/年 · 信念+10 · 压力+3',
        hintColor: 'neutral',
        skillGains: { promptMastery: 8, aiSkill: 6 },
        savingsChange: 10000,
        passiveIncomeChange: 4000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.stress = clamp(s.stress + 3, 0, 100);
        },
        log: '38岁，你和智库谈了一个"中间方案"：不挂职、不入编、不领工资，以外部专家身份参与研讨。你保留了说真话的自由，又能影响政策方向。有人笑你"既要又要"，你笑了：成年人的智慧，就是在两条路之间走出第三条。',
      },
    ],
  },

  // 39岁：星火
  {
    id: 'evangelist_movement',
    title: '星火',
    pathId: 'ai_symbiote',
    branch: 'ai_evangelist',
    ageRange: [39, 39],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    sceneTag: 'breakthrough',
    narrative:
      '你的学员开始教别人了。你的认证体系已经毕业了五百人，他们在二十多个城市开了自己的AI工作坊。你打开地图，那些城市的小红点连成了一片——像星火燎原。\n' +
      '但"运动"这个词让你既兴奋又警惕。运动需要结构，否则就会碎片化、变味、甚至反噬创始人。你看着那片星火，问自己：你是要做一个"教主"，还是一个"火种"？',
    options: [
      {
        id: 'formalize_movement',
        label: '正式化，成立组织',
        description: '把运动变成一个有结构的机构',
        hint: '提示词+10 · AI技能+4 · 被动收入+15000/年 · 信念+12 · 压力+8 · 幸福+5',
        hintColor: 'positive',
        skillGains: { promptMastery: 10, aiSkill: 4 },
        passiveIncomeChange: 15000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        log: '39岁，你注册了一个"AI素养推广联盟"，制定了认证标准、讲师体系、课程审核流程。有人说你"把自己变成了教主"，但你知道：没有结构的运动活不过三年。一年后，联盟覆盖了五十个城市，你看着那张地图，觉得星火终于不会熄灭了。',
      },
      {
        id: 'let_it_grow_organically',
        label: '让它自然生长，只做引路人',
        description: '不设组织，保持松散的师徒关系',
        hint: '提示词+8 · AI技能+6 · 被动收入+8000/年 · 信念+10 · 幸福+8',
        hintColor: 'neutral',
        skillGains: { promptMastery: 8, aiSkill: 6 },
        passiveIncomeChange: 8000,
        isRestOption: true,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
        },
        log: '39岁，你拒绝了所有"成立组织"的建议。你说："火不需要总部。"你继续做你的引路人，谁来找你你就教谁。运动松散但活跃，没有KPI，没有层级，只有一个个独立燃烧的火点。有人担心它"会散"，你觉得：散了也没关系，重要的是火曾经燃过。',
      },
      {
        id: 'create_open_platform',
        label: '做开放平台，谁都能贡献课程',
        description: '把课程体系开源，让所有人共建',
        hint: '提示词+12 · AI技能+4 · 被动收入+5000/年 · 信念+10 · 压力+5',
        hintColor: 'neutral',
        skillGains: { promptMastery: 12, aiSkill: 4 },
        passiveIncomeChange: 5000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.stress = clamp(s.stress + 5, 0, 100);
        },
        log: '39岁，你把课程体系做成了开放平台——任何人都可以贡献课程、修改内容、本地化适配。有人担心"质量失控"，但你相信：开源的力量大于封闭。三个月后，平台上有了一百多门由学员贡献的课程，覆盖了你一个人永远做不完的场景。',
      },
    ],
  },

  // 40岁：回响
  {
    id: 'evangelist_legacy',
    title: '回响',
    pathId: 'ai_symbiote',
    branch: 'ai_evangelist',
    ageRange: [40, 40],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    sceneTag: 'breakthrough',
    narrative:
      '40岁了。你回头看。你的课程累计学员过了十万，书出到第三版，认证毕业生遍布二十个城市。你的名字在AI圈里几乎人人都听过——大家记住你，靠的是让十万个普通人"敢用AI了"，而非什么惊天动地的技术。\n' +
      '一所大学想聘你做讲席教授，一家VC想请你做EIR，或者继续做你现在做的事。问题不再是"下一步做什么"，而是"什么才是重要的"。',
    options: [
      {
        id: 'accept_professorship',
        label: '接受大学讲席教授',
        description: '进入学术体制，做有根的布道者',
        hint: '提示词+8 · AI技能+4 · 存款+50000 · 被动收入+15000/年 · 信念+10 · 幸福+12 · 压力-8',
        hintColor: 'positive',
        skillGains: { promptMastery: 8, aiSkill: 4 },
        savingsChange: 50000,
        passiveIncomeChange: 15000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.happiness = clamp(s.happiness + 12, 0, 100);
          s.stress = clamp(s.stress - 8, 0, 100);
        },
        log: '40岁，你站上了大学的讲台。第一堂课，台下坐满了比你年轻十几岁的学生。你想起26岁那年写第一篇教程的自己——那时候你只是想"把网上那些水教程替掉"。十四年过去，你成了别人教程里的人。你对着学生说："欢迎来到AI时代，我是你们的引路人。"这句话，你练了十四年。',
        triggersRetirementCheck: true,
      },
      {
        id: 'keep_independent_evangelist',
        label: '继续独立布道',
        description: '不进体制，继续做自由的KOL',
        hint: '提示词+10 · AI技能+6 · 被动收入+12000/年 · 信念+12 · 幸福+8',
        hintColor: 'neutral',
        skillGains: { promptMastery: 10, aiSkill: 6 },
        passiveIncomeChange: 12000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
        },
        log: '40岁，你拒绝了所有"上岸"邀请。你继续做你的独立内容，继续在各个平台发声，继续带你的学员。有人说你"到了该稳定的年纪"，但你觉得：布道者本就没有终点。你打开了一个新的文档，标题写着"下一个十年——AI时代的人2.0"。',
      },
      {
        id: 'become_vc_partner',
        label: '加入VC做EIR，投资下一代AI',
        description: '用资本和经验扶持下一代AI创业者',
        hint: 'AI技能+8 · 提示词+6 · 存款+100000 · 被动收入+20000/年 · 信念+8 · 幸福+5 · 压力-3',
        hintColor: 'neutral',
        skillGains: { aiSkill: 8, promptMastery: 6 },
        savingsChange: 100000,
        passiveIncomeChange: 20000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.stress = clamp(s.stress - 3, 0, 100);
        },
        log: '40岁，你成了VC的EIR。你看过太多BP，也看过太多创业者眼里那种"改变世界"的光。你投了三个项目，其中一个founder是你曾经的学员。他在签约时说："老师，我学你的课的时候，没想到有一天会被你投资。"你笑了：这就是回响——你种下的种子，长成了你能乘凉的树。',
      },
    ],
  },
];

// ============================================================
// 跨分支事件（所有分支均可触发，可导致分支切换）
// ============================================================

const crossBranchEvents: NarrativeEvent[] = [

  // 28岁：朋友拉你创业
  {
    id: 'cross_friend_recruit',
    title: '橄榄枝',
    pathId: 'ai_symbiote',
    ageRange: [28, 28],
    priority: 5,
    weight: 6,
    oncePerGame: true,
    narrative:
      '大学室友阿坤约你喝酒，酒过三巡他掏出一份BP："我要做一个AI产品，缺个技术合伙人。你来了CTO，股份对半分。"\n' +
      '你看着那份BP，产品方向确实有意思，市场分析也扎实。但你知道创业是什么——你现在的日子虽平淡但安稳，跳进坑就是九死一生。阿坤看着你，眼睛里是十年前大学宿舍里那种"我们要改变世界"的光。你想起大二时一起通宵写代码的那个晚上——那时候你们什么都没有，但什么都敢。',
    options: [
      {
        id: 'join_friend',
        label: '业余加入，下班后一起干',
        description: '兄弟+AI+风口，先不辞职，用下班时间验证产品',
        hint: 'AI技能+10 · 模型训练+8 · 存款-15000 · 压力+12 · 信念+8 · 切换至创业线',
        hintColor: 'danger',
        skillGains: { aiSkill: 10, aiTraining: 8 },
        savingsChange: -15000,
        branchSwitch: 'ai_startup',
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        log: '28岁，你没辞职——你跟阿坤说"先下班干，验证了再说"。你们在中关村租了间民房当据点，每天下班后挤过去干到凌晨。吃着泡面相视而笑——像回到了大学宿舍。白天你在公司打着卡，脑子里全是晚上的代码。你知道前面的路很难，但至少身边有个信得过的人。',
      },
      {
        id: 'decline_stay',
        label: '婉拒，留在现在的轨道上',
        description: '兄弟归兄弟，生意归生意',
        hint: 'AI技能+5 · 压力-2 · 信念+2 · 维持当前分支',
        hintColor: 'neutral',
        skillGains: { aiSkill: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 2, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 2, 0, 100);
        },
        log: '28岁，你拒了阿坤。他拍了拍你的肩说"理解"。后来他的公司融了A轮，你刷到新闻时心里闪过一丝涟漪，但很快就过去了——你有你的路，他有他的。',
      },
      {
        id: 'advise_instead',
        label: '不加入但做技术顾问，拿少量股份',
        description: '不上船但要船票，两头都不耽误',
        hint: 'AI技能+8 · 提示词+5 · 被动收入+3000/年 · 压力+4 · 信念+3 · 副业+8000',
        hintColor: 'positive',
        skillGains: { aiSkill: 8, promptMastery: 5 },
        passiveIncomeChange: 3000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
          s.currentYearSideHustle += 8000; // 技术顾问首笔顾问费到账
        },
        log: '28岁，你成了阿坤公司的技术顾问，每周花一个晚上帮他们看代码，换了3%的股份。首笔顾问费8000块到账，你的日常工作没受影响，但晚上多了一件让人兴奋的事。',
      },
    ],
  },

  // 30岁：AI行业大会
  {
    id: 'cross_conference',
    title: '众生相',
    pathId: 'ai_symbiote',
    ageRange: [30, 30],
    priority: 5,
    weight: 6,
    oncePerGame: true,
    narrative:
      '你参加了一场万人AI行业大会。展厅里人山人海，每个展台都在讲"颠覆""赋能""范式转移"——你听了半天发现十个有九个是套壳。\n' +
      '但在角落的一个小展台前，你遇到了一个做AI+医疗的团队。他们的技术不花哨，但解决了一个真实的问题：用AI辅助基层医生读X光片。创始人是个四十多岁的医生，半路出家学AI，眼神里没有焦虑和野心，是使命感。他问你："要不要来我们这看看？我们缺一个懂AI架构的人。"这不是猎头话术，这是一个真诚的邀请。',
    options: [
      {
        id: 'switch_to_medical',
        label: '考虑转行AI+医疗',
        description: '从追风口变成解决真问题',
        hint: 'AI技能+8 · 模型训练+10 · 压力+8 · 信念+10 · 可能切换方向',
        hintColor: 'positive',
        skillGains: { aiSkill: 8, aiTraining: 10 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        log: '30岁，你在大会上遇到了那个AI+医疗团队。回去后你失眠了三天，最终发了一条消息："我去你们那看看。"你不确定这是不是对的路，但你知道追风口的日子该结束了。',
      },
      {
        id: 'network_only',
        label: '只交换名片，保持观察',
        description: '好机会不急着接，先看看水深',
        hint: '提示词+5 · AI技能+3 · 压力+2 · 信念+3',
        hintColor: 'neutral',
        skillGains: { promptMastery: 5, aiSkill: 3 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 2, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '30岁，你和那个医生交换了名片。大会结束后你偶尔回想那天的对话，觉得心里有个东西被触动了。但你还是回到了自己的轨道上，名片躺在钱包里，偶尔硌一下你的手。',
      },
      {
        id: 'reaffirm_path',
        label: '被大会刺激，更坚定当前路线',
        description: '看了别人的路，反而更清楚自己的',
        hint: 'AI技能+8 · 信念+8 · 压力+3 · 幸福+3',
        hintColor: 'positive',
        skillGains: { aiSkill: 8 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.stress = clamp(s.stress + 3, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
        },
        log: '30岁，大会上的众生相让你更清楚了一件事：大部分人都在追AI的浪，但真正能活下来的是那些知道自己为什么上船的人。你回到工位，打开了自己的项目——你比出发时更笃定了。',
      },
    ],
  },

  // 32岁：猎头挖人
  {
    id: 'cross_headhunter',
    title: '龙门',
    pathId: 'ai_symbiote',
    ageRange: [32, 32],
    priority: 6,
    weight: 7,
    oncePerGame: true,
    narrative:
      '一个顶级猎头找上门，手里拿着一个你无法忽视的offer：某AI独角兽的技术VP岗位，年薪200万+股票，带100人团队。\n' +
      '但条件是：你要放弃现在所有的积累——如果你在创业，要放弃公司；如果你在深耕技术，要开始做管理；如果你在做内容，要从聚光灯下退回办公室。猎头说"这是你职业生涯最后一次跳龙门的机会"。你知道他说得对。但你也知道，接了这个offer，你就不再是"你自己"了，你是"某公司VP"。',
    options: [
      {
        id: 'take_vp_offer',
        label: '接受VP offer，去大平台',
        description: '200万年薪+100人团队+上市期权',
        hint: 'AI技能+5 · 提示词+8 · 月薪+3000 · 压力+15 · 信念-5 · 切换至技术线',
        hintColor: 'positive',
        skillGains: { aiSkill: 5, promptMastery: 8 },
        salaryChange: 3000,
        branchSwitch: 'tech_expert',
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 15, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
        },
        log: '32岁，你签了VP的offer。第一天上班你坐在独立办公室里，窗外是城市天际线。皮质办公椅比出租屋里那把转椅舒服太多，你却忽然想起那种穿着拖鞋改bug到凌晨的劲头——觉得像是另一个人的人生。但你知道，你选了一条更"安全"的路。',
      },
      {
        id: 'counter_offer',
        label: '拿offer当筹码，跟当前公司谈加薪',
        description: '不去，但用这个offer给自己争取更好的条件',
        hint: 'AI技能+3 · 月薪+3000 · 压力+8 · 信念+2 · 维持当前分支',
        hintColor: 'neutral',
        skillGains: { aiSkill: 3 },
        salaryChange: 3000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 2, 0, 100);
        },
        log: '32岁，你拿着offer去找老板谈。老板黑着脸批了加薪，但你知道他心里记了一笔。你保住了现在的位置也涨了薪，但办公室里的气氛微妙地变了——你成了一个"随时可能走"的人。',
      },
      {
        id: 'refuse_stay_true',
        label: '拒绝，继续走自己的路',
        description: '200万买不到自由，你不需要那张名片',
        hint: '信念+12 · 幸福+8 · 压力-5 · 健康+3 · 维持当前分支',
        hintColor: 'positive',
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
          s.health = clamp(s.health + 3, 0, 100);
        },
        log: '32岁，你拒了200万的VP offer。猎头说你疯了。但你知道：你赌AI这条路，不是为了变成某个公司的VP。你要的是自由，不是头衔。你关掉邮件，打开了IDE——代码比offer更让你安心。',
      },
    ],
  },
];

// ============================================================
// 后期收束事件（ages 41-43，弥补40+岁叙事断崖）
// 所有分支通用，聚焦"中年回望"与"持续价值"
// ============================================================

const lateStageEvents: NarrativeEvent[] = [

  // 41岁：身体发出的信号
  {
    id: 'late_body_signal',
    title: '那根白头发',
    pathId: 'ai_symbiote',
    ageRange: [41, 41],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'illness',
    narrative:
      '早晨洗漱时你在镜子里发现了一根白头发。你拔下来，放在白色瓷砖上看了一会儿。这不算什么——你同事三十出头就白了。但你确实感觉到了变化：连续加班两天后第三天脑子是木的；看屏幕久了眼睛干得像进了沙子；体检报告上"建议复查"从一项变成了三项。\n' +
      '你把那根白发冲进了下水道。手机亮了，是团队群里有人@你——线上出了个bug。你看了眼时间，早上六点四十。',
    options: [
      {
        id: 'push_through',
        label: '先扛着，bug不等人',
        description: '身体的事以后再说，眼下的事最急',
        hint: 'AI技能+6 · 压力+10 · 健康-6 · 月薪+1000 · 信念+3',
        hintColor: 'danger',
        skillGains: { aiSkill: 6 },
        salaryChange: 1000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.health = clamp(s.health - 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '41岁，你修完bug已经快九点。你泡了杯浓茶，继续处理白天积压的需求。体检报告还压在键盘底下，你假装没看见。',
      },
      {
        id: 'slow_down',
        label: '调整节奏，开始认真对待身体',
        description: '买人体工学椅、设屏幕时间限制、每周跑两次步',
        hint: 'AI技能+3 · 压力-8 · 健康+8 · 幸福+5 · 存款-5000 · 信念+2',
        hintColor: 'positive',
        skillGains: { aiSkill: 3 },
        savingsChange: -5000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 8, 0, 100);
          s.health = clamp(s.health + 8, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 2, 0, 100);
        },
        log: '41岁，你下单了一把两千多的人体工学椅，在手机里设了每两小时起来走动的闹钟。第一周跑步你只跑了八百米就喘得不行，但第二周好了一些。体检报告你打开看了，复查项目约了下个月的号。',
      },
      {
        id: 'delegate_more',
        label: '把手上的活分出去，做减法',
        description: '培养年轻人顶上，自己退到架构和判断层面',
        hint: '提示词+8 · AI技能+4 · 压力-5 · 健康+3 · 被动收入+5000/年 · 信念+5',
        hintColor: 'positive',
        skillGains: { promptMastery: 8, aiSkill: 4 },
        passiveIncomeChange: 5000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 5, 0, 100);
          s.health = clamp(s.health + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '41岁，你把两个核心模块交给了团队里最靠谱的年轻人。第一次review时他犯了三个你三年前也犯过的错，你忍住没插手，只在关键节点提了一句。两周后他独立上线了一个功能，你看了眼代码——比你想的要好。',
      },
    ],
  },

  // 42岁：被取代的焦虑
  {
    id: 'late_replacement_anxiety',
    title: '那个23岁的人',
    pathId: 'ai_symbiote',
    ageRange: [42, 42],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '新来的实习生叫林野，23岁，硕士刚毕业。他用的工具栈你只认识一半，另一半是你没听过名字的开源项目。他搭一个AI Agent pipeline只用了两天——你当年做类似的事花了两周。不是他不认真，是工具确实进化了。\n' +
      '更让你说不清滋味的是：林野在站会上提出的架构方案，和你心里想的几乎一样，但他的版本更新、更轻。你看着投影上那张图，有一瞬间分不清自己是在欣赏还是在嫉妒。散会后林野跑来请教："前辈，我那个方案是不是有问题？您帮我看看。"他眼睛里没有挑衅，是真的在请教。',
    options: [
      {
        id: 'mentor_openly',
        label: '认真带他，把经验倾囊相授',
        description: '被取代是迟早的事，不如主动培养接班人',
        hint: '提示词+10 · AI技能+5 · 幸福+8 · 压力-5 · 被动收入+6000/年 · 信念+6',
        hintColor: 'positive',
        skillGains: { promptMastery: 10, aiSkill: 5 },
        passiveIncomeChange: 6000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '42岁，你花了一下午帮林野理清了架构里的三个坑。他走的时候说"前辈你讲得比我导师清楚多了"。你笑了笑，想起自己23岁时也有个前辈这样带过你。',
      },
      {
        id: 'compete_head_on',
        label: '不服气，证明自己不可替代',
        description: '学新工具、做更难的项目、把年轻人比下去',
        hint: 'AI技能+12 · 压力+12 · 健康-5 · 月薪+2000 · 信念+4',
        hintColor: 'danger',
        skillGains: { aiSkill: 12 },
        salaryChange: 2000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '42岁，你用了三个周末学会了林野用的那套工具链。你在下一个项目里用新工具+老经验做出了一个比他更稳的方案。领导在周会上表扬了你，你看着林野低头记笔记的样子，心里没有赢的快感。',
      },
      {
        id: 'pivot_upward',
        label: '不再比手速，转向战略和人脉层面',
        description: '年轻人拼执行，你拼判断和资源整合',
        hint: 'AI技能+4 · 提示词+6 · 被动收入+10000/年 · 压力+3 · 信念+8 · 存款-8000',
        hintColor: 'neutral',
        skillGains: { aiSkill: 4, promptMastery: 6 },
        savingsChange: -8000,
        passiveIncomeChange: 10000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '42岁，你开始把时间花在以前觉得"虚"的事上——见客户、谈合作、做行业判断。林野在写代码，你在决定代码为谁而写。你不确定这算不算进步，但你知道：和23岁的人比手速，你赢不了太久。',
      },
    ],
  },

  // 43岁：行业的转折
  {
    id: 'late_industry_shift',
    title: '潮水的方向',
    pathId: 'ai_symbiote',
    ageRange: [43, 43],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    narrative:
      '你入行二十年了。这一年行业出了两件大事：某大模型厂商把API价格砍到原来的十分之一，靠API套壳的创业公司死了一片；监管出了新规，好几个你认识的同行被迫转型。\n' +
      '你认识的老张——以前做AI培训的——转行去卖保险了。你认识的老李——做AI绘画工具的——公司关了，发了条"感谢大家支持"就再没更新过。你坐在书房里看着窗外。二十年前大家说"AI是未来"，现在AI确实是未来了，但"未来"和"你的未来"之间隔着一道你不确定的沟。',
    options: [
      {
        id: 'double_down_ai',
        label: 'All in更深层的AI——做基础设施',
        description: '应用层会死，但基础设施不会。往深处走',
        hint: 'AI技能+10 · 模型训练+8 · 压力+10 · 健康-4 · 信念+10 · 存款-20000',
        hintColor: 'danger',
        skillGains: { aiSkill: 10, aiTraining: 8 },
        savingsChange: -20000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.health = clamp(s.health - 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
        },
        log: '43岁，你投了一笔钱和一个做AI推理加速的朋友合伙。应用层今天火明天凉，但只要有人用AI，就需要更快更便宜的推理。你赌的是水管，不是水龙头。',
      },
      {
        id: 'diversify',
        label: '分散押注，不只靠AI吃饭',
        description: '把鸡蛋分到几个篮子里——AI、投资、教学',
        hint: '提示词+6 · AI技能+4 · 被动收入+15000/年 · 压力-3 · 信念+5 · 存款-15000',
        hintColor: 'positive',
        skillGains: { promptMastery: 6, aiSkill: 4 },
        savingsChange: -15000,
        passiveIncomeChange: 15000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '43岁，你花了些时间整理自己的收入结构——AI项目占一半，课程和咨询占三成，投资理财占两成。老张卖保险的消息让你想了很多：单一赛道的人，潮水一变就搁浅。你不想搁浅。',
      },
      {
        id: 'step_back_observe',
        label: '退一步，花半年看清方向再动',
        description: '不急着做决定，先看清潮水到底往哪流',
        hint: 'AI技能+3 · 提示词+5 · 压力-8 · 幸福+6 · 健康+4 · 信念+3',
        hintColor: 'neutral',
        skillGains: { aiSkill: 3, promptMastery: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 8, 0, 100);
          s.happiness = clamp(s.happiness + 6, 0, 100);
          s.health = clamp(s.health + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '43岁，你给自己放了一个"观察假"。你减少了接单，花了三个月走访了十几家AI公司，和一些你佩服的人聊了聊。半年后你看清了一些事：不是AI不行了，是"用AI讲故事骗钱"不行了。你重新打开了笔记本。',
      },
    ],
  },

  // 45岁：徒弟超过了你
  {
    id: 'ai_midlife_apprentice_surpass',
    title: '后浪',
    pathId: 'ai_symbiote',
    ageRange: [45, 45],
    priority: 7,
    weight: 9,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'startup',
    narrative:
      '你带了三年的徒弟林野独立带队做了一个项目，上线两周用户破百万。行业媒体在写他，投资人在找他，朋友圈有人转发他的采访——标题是"AI时代的新物种"。\n' +
      '你点开那个视频。镜头里的林野侃侃而谈，讲的东西你懂，但你说不出那种锐气。他提到你时说"感谢我的导师"，你盯着那四个字，心里五味杂陈。你想起自己25岁的时候，也是这样眼睛发亮。现在你45岁，世界确实变了——但改变它的人里，有你带出来的徒弟。这算成功还是失败？你说不清楚。',
    options: [
      {
        id: 'embrace_mentor_role',
        label: '坦然接受——成为他背后的人',
        description: '徒弟超越师傅，是师傅最大的成功',
        hint: '提示词+10 · 幸福+10 · 信念+8 · 压力-8 · 被动收入+8000/年',
        hintColor: 'positive',
        skillGains: { promptMastery: 10 },
        passiveIncomeChange: 8000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.stress = clamp(s.stress - 8, 0, 100);
        },
        log: '45岁，你给林野发了条消息："干得好。"他秒回："师傅，晚上一起吃饭？"饭桌上他跟你聊新的方向，你听着，偶尔插一句。你发现自己不再嫉妒了——你曾经想成为最亮的那颗星，但现在你知道，点亮更多的星，比自己亮更久。',
      },
      {
        id: 'compete_with_protege',
        label: '不服——你也要做出一个现象级产品',
        description: '徒弟能做到的，你也能，而且做得更好',
        hint: 'AI技能+10 · 压力+12 · 信念+6 · 健康-5 · 存款-15000',
        hintColor: 'danger',
        skillGains: { aiSkill: 10 },
        savingsChange: -15000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
        },
        log: '45岁，你默默启动了一个新项目。你熬了三个月的夜，用最新的工具链做出了一个Demo。Demo确实不错，但上线后反响平平。你看着林野的产品用户数继续飙升，第一次承认：有些东西不是经验能补的，比如对新时代的直觉。但你没后悔——至少你试过。',
      },
      {
        id: 'step_back_reflect',
        label: '停下来想一想——你真正想要什么',
        description: '中年不是终点，是重新选择的起点',
        hint: '幸福+8 · 压力-10 · 健康+5 · 信念+5',
        hintColor: 'neutral',
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress - 10, 0, 100);
          s.health = clamp(s.health + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '45岁，你休了两周假。你没去什么地方，就在家附近的公园坐着，看老人下棋、看小孩跑。你想了很多：22岁入行时你想要什么？30岁All In时你赌什么？现在你还剩什么？假期结束你回到工位，没做任何重大决定，但心里那块堵了很久的石头，轻了一些。',
      },
    ],
  },
];

// ============================================================
// 危机事件（高优先级，打断正常流程）
// ============================================================

const crisisEvents: NarrativeEvent[] = [

  // 29岁：AI技能贬值（GPT新版本发布）
  {
    id: 'crisis_gpt_upgrade',
    title: '跃迁之痛',
    pathId: 'ai_symbiote',
    ageRange: [29, 29],
    priority: 9,
    weight: 10,
    oncePerGame: true,
    eventType: 'crisis',
    narrative:
      '新版本发布了。不是小更新，是代际跃迁——你赖以吃饭的技能，prompt技巧、调参经验、甚至部分代码能力，在新模型面前突然变得像五笔打字一样过时。新来的实习生用一句话就写出了你调了三天才调通的功能，招聘网站上的JD一夜之间全换了关键词。\n' +
      '你打开自己过去一年的工作记录，发现那些曾让你骄傲的"高级技巧"看起来像个笑话。深夜你坐在屏幕前，第一次感到真正的恐惧——不是被AI取代的恐惧，而是发现自己一直在和一列火车赛跑、而火车突然加速了的恐惧。',
    options: [
      {
        id: 'chase_frontier',
        label: 'All in最新技术栈，每天学16小时',
        description: '用命追赶，赌自己跑得比模型迭代快',
        hint: 'AI技能+12 · 提示词+5 · 压力+15 · 健康-10 · 幸福-8 · 信念+10 · 月薪+2000',
        hintColor: 'danger',
        skillGains: { aiSkill: 12, promptMastery: 5 },
        salaryChange: 2000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.health = clamp(s.health - 10, 0, 100);
          s.happiness = clamp(s.happiness - 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
        },
        log: '29岁，你把自己锁在房间里三个月，卸载了所有社交APP。你重新掌握了新技术栈，在公司做了一次惊艳的技术分享。但体检报告上多了三个箭头，你已经两个月没和人面对面吃过饭了。你赢了这一局，但你不知道还能赢几局。',
        blindBoxTrigger: 'ai_prompt_dojo',
      },
      {
        id: 'pivot_to_system_thinking',
        label: '转向系统思维，不拼技术拼判断力',
        description: '技术会贬值，但架构思维和业务理解不会',
        hint: 'AI技能+8 · 提示词+10 · 压力+8 · 信念+4 · 月薪+1000',
        hintColor: 'positive',
        skillGains: { aiSkill: 8, promptMastery: 10 },
        salaryChange: 1000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
        },
        log: '29岁，你没有去追最新的模型，而是花了三个月重新审视自己的能力树。你发现：具体的技巧会过时，但"知道AI能做什么、不能做什么、应该用在哪里"的判断力不会。你开始转型做AI架构和策略，那些比你年轻的人技术比你新，但他们听你的。',
      },
      {
        id: 'accept_devaluation',
        label: '接受贬值，降低预期躺平',
        description: '不追了，用AI辅助做基础工作，接受平庸',
        hint: 'AI技能+3 · 压力-15 · 幸福+8 · 健康+5 · 信念-8 · 月薪-2000',
        hintColor: 'negative',
        skillGains: { aiSkill: 3 },
        salaryChange: -2000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 15, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.health = clamp(s.health + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 8, 0, 100);
        },
        log: '29岁，你不再追新模型了。每天上班用AI完成任务，到点下班，回家做饭看剧。工资降了但你第一次发现晚上的时间可以这么长。同事们讨论最新论文时你插不上话，但也不焦虑了——虽然月底看到工资条，心还是揪了一下。',
      },
    ],
  },

  // 31岁：健康亮红灯
  {
    id: 'crisis_health_redlight',
    title: '红灯',
    pathId: 'ai_symbiote',
    ageRange: [31, 31],
    priority: 9,
    weight: 10,
    oncePerGame: true,
    eventType: 'crisis',
    conditions: (s) => s.stress >= 50 || s.health <= 60,
    narrative:
      '你在工位上突然眼前一黑，醒来时已经躺在医院走廊的临时床上。医生说你长期高压、睡眠不足、颈椎严重劳损，再这样下去"不是猝死就是中风"。\n' +
      '你盯着天花板上的日光灯，想起昨晚又熬到凌晨三点。手机在口袋里震动——是工作群的消息。这一次，你没有立刻去摸手机。护士推着药车走过，轮子发出吱呀声。你28岁的同事上周刚查出甲状腺结节，你30岁的前同事去年心梗进了ICU。你今年31，下一个会不会是你？',
    options: [
      {
        id: 'health_first',
        label: '听从身体，休养半年',
        description: '向公司请长假，把健康放在第一位',
        hint: '压力-15 · 健康+12 · 幸福+10 · 信念+5 · 月薪-3000 · AI技能+3',
        hintColor: 'positive',
        skillGains: { aiSkill: 3 },
        salaryChange: -3000,
        isRestOption: true,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 15, 0, 100);
          s.health = clamp(s.health + 12, 0, 100);
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '31岁，你请了三个月病假。前两周你焦虑得睡不着——不工作比工作更让你不安。但慢慢地你开始每天散步、按时吃饭、十一点睡觉。三个月后复查，指标好了一半。你重新理解了一个词：留得青山在。',
        blindBoxTrigger: 'ai_health_warning',
      },
      {
        id: 'balance_work_health',
        label: '调整节奏，严格控工作时长',
        description: '不休假，但每天最多工作10小时，雷打不动运动',
        hint: 'AI技能+5 · 压力-10 · 健康+10 · 信念+3 · 月薪-1000',
        hintColor: 'neutral',
        skillGains: { aiSkill: 5 },
        salaryChange: -1000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 10, 0, 100);
          s.health = clamp(s.health + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '31岁，你在日历上锁死了每天的运动时间和睡眠时间，任何人不能侵占。同事们觉得你"佛系了"，但你的体检指标在好转。你发现：每天少工作两小时，产出并没有少多少——以前那两小时你只是在低效地焦虑。',
        blindBoxTrigger: 'ai_health_warning',
      },
      {
        id: 'push_through',
        label: '吃点药扛过去，不能停',
        description: '现在停下来就前功尽弃了，再撑撑',
        hint: 'AI技能+10 · 压力+10 · 健康-12 · 幸福-5 · 信念+3 · 月薪+1500',
        hintColor: 'danger',
        skillGains: { aiSkill: 10 },
        salaryChange: 1500,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.health = clamp(s.health - 12, 0, 100);
          s.happiness = clamp(s.happiness - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '31岁，你开了点药就回公司了。你跟自己说"年轻扛得住"。但半年后你又进了一次医院，这次是在会议室晕倒的。醒来后你看着床边哭泣的伴侣，第一次认真想：也许有些东西比代码更重要。',
        blindBoxTrigger: 'ai_health_warning',
      },
    ],
  },

  // 33岁：信念动摇（同龄人考公上岸）
  {
    id: 'crisis_faith_civil_service',
    title: '彼岸',
    pathId: 'ai_symbiote',
    ageRange: [33, 33],
    priority: 9,
    weight: 10,
    oncePerGame: true,
    eventType: 'crisis',
    conditions: (s) => s.pathFaith <= 60,
    narrative:
      '动态圈刷到一条消息：大学室友考上公务员了，晒出录取通知和工牌。底下全是"上岸了""铁饭碗""从此安稳"。你看着那条动态圈，手指停在点赞按钮上，最终没点——你想起大三时你们一起翘课打游戏的日子，他现在上岸了，你还在浪里扑腾。\n' +
      '他的生活看起来平淡但稳定：朝九晚五、五险一金、食堂三餐、下班钓鱼。你的生活看起来精彩但飘摇：自由但焦虑，走在前面但不知道前面是陆地还是悬崖。深夜你问自己：你赌的那条路，真的是对的吗？',
    options: [
      {
        id: 'reaffirm_conviction',
        label: '坚定信念，这条路是自己选的',
        description: '上岸有上岸的好，但你要的是海，不是岸',
        hint: '信念+12 · 幸福+5 · AI技能+5 · 压力-5',
        hintColor: 'positive',
        skillGains: { aiSkill: 5 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
        },
        log: '33岁，你关掉了动态圈，在备忘录里写了一句话："岸上的人看海里的人是冒险，海里的人看岸上的人是平庸。你选了海，就要接受浪。"写完你笑了——也许这就是信念的样子：不是不怀疑，是怀疑完了还继续走。',
      },
      {
        id: 'hedged_bet',
        label: '对冲风险，考个证/存笔安全基金',
        description: '不完全放弃，但给自己留一条后路',
        hint: 'AI技能+3 · 存款+10000 · 信念-3 · 压力+5 · 幸福+2',
        hintColor: 'neutral',
        skillGains: { aiSkill: 3 },
        savingsChange: 10000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith - 3, 0, 100);
          s.stress = clamp(s.stress + 5, 0, 100);
          s.happiness = clamp(s.happiness + 2, 0, 100);
        },
        log: '33岁，你开始每月固定存一笔"安全基金"，还考了个云计算架构师证书。你跟自己说这叫"风险对冲"，但你知道：对冲的本质是不够笃定。不过没关系，这世上没有人是完全笃定的。',
      },
      {
        id: 'consider_civil_service',
        label: '认真考虑考公/进体制',
        description: '也许安稳才是最终的答案',
        hint: '信念-10 · 幸福+8 · 压力-10 · 健康+5 · 月薪-3000 · 可能退出路径',
        hintColor: 'negative',
        salaryChange: -3000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith - 10, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress - 10, 0, 100);
          s.health = clamp(s.health + 5, 0, 100);
        },
        log: '33岁，你买了行测和申论的教材，每天下班后学两小时。学了两个月你发现：你做不到像室友那样安于一眼望到头的生活。你把教材收进了柜子，但你知道那个念头会再来——在你最疲惫的深夜，在你最脆弱的瞬间。',
      },
    ],
  },
];

// ============================================================
// 失败预警事件（isAllInPath=true 且 pathFaith<40 或存款告急时触发）
// ============================================================

const aiWarningEvents: NarrativeEvent[] = [

  // 预警1：产品上线没人用，日活只有自己和测试号
  {
    id: 'ai_warning_product_fail',
    title: '零日活',
    sceneTag: 'home',
    pathId: 'ai_symbiote',
    ageRange: [28, 50],
    priority: 15,
    weight: 10,
    oncePerGame: true,
    eventType: 'crisis',
    conditions: (s) => s.isAllInPath === true && (s.pathFaith < 40 || s.currentSavings < 50000),
    narrative:
      '产品上线第七天，后台数据面板上的DAU停在"2"——你和你的测试号。你刷新了三次，数字没变。唯一一个真实用户注册后停留47秒，再也没有回来。你甚至想给他发邮件问"你为什么走了"，但忍住了。\n\n' +
      '你做了六个月的产品，辞职后的每一天都在写代码、调prompt、改UI、部署、测bug。你推掉所有社交，连头发都是自己对着镜子剪的。你告诉自己"build it and they will come"，但他们没有来——新品榜尾端12个赞，黑客新闻零评论，推文被自己的小号转了一次。服务器每月烧你八百块，存款从六位数变四位数，而你埋头做产品的这半年，GPT又迭代了两个版本。\n\n' +
      '凌晨两点，你对着那个"2"发呆。你开始怀疑：是我做的东西没人需要，还是我根本就不是做产品的料？',
    options: [
      {
        id: 'pivot_and_interview',
        label: '用户访谈，找到PMF再重来',
        description: '不放弃，但先停下来找一百个用户聊，搞清楚到底谁需要这个',
        hint: 'AI技术+8 · 提示词+8 · 存款-10000 · 信念+5 · 压力+10 · 幸福-3',
        hintColor: 'neutral',
        skillGains: { aiSkill: 8, promptMastery: 8 },
        savingsChange: -10000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.stress = clamp(s.stress + 10, 0, 100);
          s.happiness = clamp(s.happiness - 3, 0, 100);
        },
        log: '你停掉了广告投放，开始在各个社群里找人聊。你跟四十多个人通了电话，每次聊一个小时以上。你发现你做的东西确实解决了一个问题——但不是你以为的那个问题，解决的人群也不是你以为的人群。你砍掉了70%的功能，围绕一个核心场景重新做了一个版本。新版本上线第三天，DAU破了一百。你对着那个"100"哭了——不是因为数字小，是因为你终于知道自己在为谁做东西了。',
      },
      {
        id: 'open_source_give_up',
        label: '开源放手，承认这个产品做不起来',
        description: '把代码开源，然后去找工作，先活下来再谈理想',
        hint: 'AI技术+12 · 信念-20 · 压力-5 · 健康+5 · 幸福+5 · 存款-5000',
        hintColor: 'negative',
        skillGains: { aiSkill: 12 },
        savingsChange: -5000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith - 20, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
          s.health = clamp(s.health + 5, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        log: '你在开源社区上开源了全部代码，写了一篇很长的README，讲述你为什么做这个产品、为什么它失败了、你学到了什么。帖子意外地火了——在黑客新闻上拿到了三百个赞，有人fork了你的仓库去做自己的版本，甚至有两家公司因为这篇帖子给你发了offer。你接了其中一个，回去上班了。工资不如你辞职前高，但每个月有钱进账的感觉让你踏实了很多。你没有放弃AI——你只是学会了：不是每艘船都要自己当船长。',
        isRestOption: true,
      },
      {
        id: 'market_harder',
        label: '加大营销投入，花钱买用户',
        description: '投广告、做SEO、找KOL推广，不信东西好没人用',
        hint: '模型训练+5 · 存款-50000 · 信念-8 · 压力+20 · 健康-10 · 幸福-8',
        hintColor: 'danger',
        skillGains: { aiTraining: 5 },
        savingsChange: -50000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith - 8, 0, 100);
          s.stress = clamp(s.stress + 20, 0, 100);
          s.health = clamp(s.health - 10, 0, 100);
          s.happiness = clamp(s.happiness - 8, 0, 100);
        },
        log: '你把最后的五万块全砸进了广告投放。Google Ads、Twitter推广、找了两个小KOL做测评。DAU确实涨了——最高到过三百，但留存率不到5%。钱烧完的那天，DAU回落到了23。你坐在电脑前看着账单，第一次承认了一个事实：你在用营销掩盖产品的问题。就像给一道不好吃的菜加更多的盐——咸是咸了，但还是不好吃。你关了广告账户，决定先把产品做好，再谈增长。',
      },
    ],
  },

  // 预警2：技术迭代太快，每天都在追，追不动了
  {
    id: 'ai_warning_burnout_tech',
    title: '追不上',
    sceneTag: 'home',
    pathId: 'ai_symbiote',
    ageRange: [28, 50],
    priority: 14,
    weight: 10,
    oncePerGame: true,
    eventType: 'crisis',
    conditions: (s) => s.isAllInPath === true && (s.pathFaith < 40 || s.currentSavings < 50000),
    narrative:
      '你打开Twitter，又看到了一个新模型发布。这是这周第三个了——周一OpenAI更新，上下文窗口翻倍；周二Google出多模态模型，碾压竞品；今天周三，一家你没听过的创业公司开源了免费追平GPT的模型。你收藏了那条推文，告诉自己"周末看"。但你的收藏夹里已经有两百多条"周末看"了。\n\n' +
      '你订阅的AI新闻通讯有十七封未读，Notion里有个"学"页面列了六十多个想学但还没学的技术。你打开一个新出的AI编程工具文档，看了三页就关掉了——不是看不懂，是太累了。你的大脑像一个跑满进程的CPU，内存占用99%。你上周学的框架这周被宣布"不再维护"，你上个月优化的prompt在新模型下表现更差了。\n\n' +
      '你关掉所有窗口，桌面壁纸是你三年前设的一张山景照片，你已经很久没看过真的山了。你突然想：如果我停下来一周不看任何AI新闻，我会被淘汰吗？如果落后了，我还能做什么？',
    options: [
      {
        id: 'focus_deep_ignore_fomo',
        label: '关掉信息流，专注做自己的事',
        description: '退订所有新闻通讯，Twitter取关AI话题，按自己的节奏走',
        hint: '提示词+15 · 幸福+12 · 压力-18 · 健康+8 · 信念+8 · AI技术-5',
        hintColor: 'positive',
        skillGains: { promptMastery: 15 },
        stateEffect: (s) => {
          ensureSkills(s);
          s.happiness = clamp(s.happiness + 12, 0, 100);
          s.stress = clamp(s.stress - 18, 0, 100);
          s.health = clamp(s.health + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '你退订了所有通讯，Twitter取关了五十个AI大V，把收藏夹里两百条"待读"全删了。第一天你焦虑得每隔十分钟就想刷Twitter。第三天你习惯了。第二周你发现你在做的项目其实不需要最新的模型——GPT-4的能力已经足够了。你把省下来的时间用来深度思考架构、打磨prompt、和用户聊天。一个月后你的产品反而进步得更快了。你明白了一个道理：在信息海啸里，最重要的能力不是"追"，是"停"——知道什么该忽略，比知道什么该学更重要。',
        isRestOption: true,
      },
      {
        id: 'double_down_learning',
        label: '拼了，熬夜也要跟上',
        description: '每天少睡两小时，把新出的技术全学一遍，不能被淘汰',
        hint: 'AI技术+15 · 模型训练+10 · 压力+22 · 健康-18 · 信念+3 · 幸福-12',
        hintColor: 'danger',
        skillGains: { aiSkill: 15, aiTraining: 10 },
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 22, 0, 100);
          s.health = clamp(s.health - 18, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
          s.happiness = clamp(s.happiness - 12, 0, 100);
        },
        log: '你把作息调到了极致：早上五点起来看论文，通勤听AI播客，午休看技术博客，晚上学到十二点。你确实跟上了——你知道每个新模型的参数和基准测试成绩，你在社群里第一个回答别人的技术问题。但你开始偏头疼，右眼经常跳，有一次洗澡的时候发现头上有一块硬币大小的斑秃。你老婆说你"像一台永远在散热的电脑"。你心里清楚这种状态不可持续，但你不敢停——在AI这个赛道上，停下来就意味着被碾过去。',
      },
      {
        id: 'niche_down_focus',
        label: '放弃追全栈，在一个细分领域做深',
        description: '不追新技术，专注一个垂直场景做到最好',
        hint: '提示词+10 · AI技术+5 · 信念+10 · 压力-5 · 幸福+5 · 存款+15000',
        hintColor: 'positive',
        skillGains: { promptMastery: 10, aiSkill: 5 },
        savingsChange: 15000,
        stateEffect: (s) => {
          ensureSkills(s);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        log: '你决定不再追每一个新模型了。你选了一个很窄的方向——用AI帮助中小律所做合同审查。这个方向不需要多模态、不需要Agent、不需要最前沿的模型，只需要把RAG和prompt工程做到极致。你花了两个月把合同审查的准确率做到了95%以上，签下了三家律所的年框合同。钱不多，但稳定。你发现：在AI淘金热里，卖铲子的人不一定赚得最多，但一定是睡得最好的。技术会过时，但对具体问题的理解不会。',
      },
    ],
  },

];

// ============================================================
// 合并所有事件
// ============================================================

export const AI_NARRATIVE_EVENTS: NarrativeEvent[] = [
  ...commonEvents,
  ...branchSelectEvent,
  ...techExpertEvents,
  ...aiStartupEvents,
  ...aiEvangelistEvents,
  ...crossBranchEvents,
  ...aiWarningEvents,
  ...lateStageEvents,
  ...crisisEvents,
];

// ============================================================
// 导出函数
// ============================================================

/**
 * 所有路径的叙事事件汇总
 * AI共生者事件已内置；其他路径的事件通过 registerNarrativeEvents 注册
 * （extraEventArrays 和 registerNarrativeEvents 已在文件顶部定义）
 */

/** 获取所有叙事事件（内置 + 动态注册） */
function getAllEvents(): NarrativeEvent[] {
  return [...AI_NARRATIVE_EVENTS, ...getAllExtraEvents()];
}

/**
 * 获取当前可用的叙事事件
 *
 * 筛选条件：
 * 1. pathId 匹配当前路径
 * 2. 年龄在 ageRange 范围内
 * 3. branch 匹配（undefined=所有分支可用；否则需与 state.narrativeBranch 一致）
 * 4. oncePerGame 事件不能重复触发（firedMap 中已存在则排除）
 * 5. conditions 函数返回 true
 */
export function getAvailableEvents(
  state: GameState,
  firedMap: Record<string, number>,
): NarrativeEvent[] {
  return getAllEvents().filter((event) => {
    // 1. 路径匹配（跨路径事件跳过此检查）
    if (!event.crossPath && event.pathId !== state.retirementPath) return false;

    // 1b. MBTI专属事件：仅当玩家mbtiType匹配时可用
    if (event.mbtiExclusive && (state as any).mbtiType !== event.mbtiExclusive) return false;

    // 2. 年龄范围
    if (
      state.currentAge < event.ageRange[0] ||
      state.currentAge > event.ageRange[1]
    ) {
      return false;
    }

    // 3. 分支匹配
    if (event.branch !== undefined) {
      const currentBranch = state.narrativeBranch || 'unassigned';
      if (currentBranch !== event.branch) return false;
    }

    // 4. 一次性事件检查
    if (event.oncePerGame && firedMap[event.id] !== undefined) return false;

    // 5. 自定义条件
    if (event.conditions && !event.conditions(state)) return false;

    return true;
  });
}

/**
 * 加权随机选择一个事件
 */
function weightedPick(events: NarrativeEvent[]): NarrativeEvent | null {
  if (events.length === 0) return null;
  if (events.length === 1) return events[0];

  const totalWeight = events.reduce(
    (sum, e) => sum + (e.weight ?? 1),
    0,
  );
  let roll = Math.random() * totalWeight;
  for (const e of events) {
    roll -= e.weight ?? 1;
    if (roll <= 0) return e;
  }
  return events[events.length - 1];
}

/** 可重复事件冷却年数：触发后N年内不再被选中 */
const RECURRING_COOLDOWN = 5;

/**
 * 过滤可重复事件的冷却期
 * 对于 oncePerGame !== true 的事件，如果最近N年内触发过，则暂时排除。
 * 如果所有可重复事件都在冷却期，返回空数组（调用方需回退到原始列表）。
 */
function filterRecurringCooldown(
  events: NarrativeEvent[],
  firedMap: Record<string, number>,
  currentAge: number,
): NarrativeEvent[] {
  const cooled = events.filter((e) => {
    if (e.oncePerGame) return true; // 一次性事件不受冷却期影响
    const lastFired = firedMap[e.id];
    if (lastFired === undefined) return true; // 从未触发过
    return currentAge - lastFired >= RECURRING_COOLDOWN;
  });
  return cooled;
}

/**
 * 随机选择一个叙事事件（考虑优先级和权重）
 *
 * 选择逻辑：
 * 1. 获取所有可用事件
 * 2. 若分支未选择且存在 branch_select 事件，强制返回该事件
 * 3. 若存在精确年龄事件（今年必须触发），优先选择
 * 4. 若存在高优先级事件（priority >= 8），优先从中加权选择
 * 5. 若存在中优先级事件（priority >= 6），从中加权选择
 * 6. 从低优先级filler事件中加权选择（可重复事件应用冷却期去重）
 * 7. 若无可用事件，返回 null（store 处理为"休养生息"）
 */
export function selectNarrativeEvent(
  state: GameState,
  firedMap: Record<string, number>,
): NarrativeEvent | null {
  const available = getAvailableEvents(state, firedMap);
  if (available.length === 0) return null;

  // 1. 分支未选择时，强制返回 branch_select 事件
  const currentBranch = state.narrativeBranch || 'unassigned';
  if (currentBranch === 'unassigned') {
    const branchSelect = available.find(
      (e) => e.eventType === 'branch_select',
    );
    if (branchSelect) return branchSelect;
  }

  // 2. 精确年龄事件（ageRange上下限相等，即"今年必须触发"的剧情）
  //    这类事件是编剧安排的关键剧情节拍，必须在对应年龄触发
  const exactAge = available.filter((e) => e.ageRange[0] === e.ageRange[1]);
  if (exactAge.length > 0) {
    return weightedPick(exactAge);
  }

  // 3. 最高优先级事件（哲学/灵魂拷问等 meta-level 事件）
  //    这些是人生中最深层的思考时刻，优先级高于普通路径事件
  const highestPriority = available.filter((e) => e.priority >= 10);
  if (highestPriority.length > 0) {
    return weightedPick(highestPriority);
  }

  // 4. 高优先级事件优先（crisis / milestone / 关键剧情等）
  const highPriority = available.filter((e) => e.priority >= 8);
  if (highPriority.length > 0) {
    return weightedPick(highPriority);
  }

  // 5. 中优先级（路径核心剧情事件 priority=6-7）
  const midPriority = available.filter((e) => e.priority >= 6);
  if (midPriority.length > 0) {
    return weightedPick(midPriority);
  }

  // 6. 低优先级filler事件（日常精进、可重复通用事件等）
  //    对可重复事件应用冷却期过滤，避免短期内重复触发同一事件
  const cooled = filterRecurringCooldown(available, firedMap, state.currentAge);
  // 如果冷却后还有事件，从冷却后的列表选；否则回退到原始列表（避免休养生息）
  const pool = cooled.length > 0 ? cooled : available;
  return weightedPick(pool);
}