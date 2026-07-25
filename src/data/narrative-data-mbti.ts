/**
 * MBTI 专属叙事事件库 · 哲学化设计
 *
 * 设计理念：
 *   每种 MBTI 类型代表一种"回应世界的方式"以及这种方式带来的固有困境。
 *   这里的 32 个事件（16 型 × 2）让玩家在游戏中亲身体验自己人格类型的核心困境——
 *   不是性格测试，而是存在主义问卷。
 *
 * 事件结构：
 *   - 每型 2 个事件：early（25-33 岁，困境初现）/ mid（38-48 岁，困境达临界点）
 *   - 每事件 3 选项，分别代表对该困境的三种存在主义回应：
 *       A — 顺应天赋（强化优势，但逼近阴影）
 *       B — 对抗本性（代价高昂，但带来成长）
 *       C — 妥协回避（即时省力，但暗藏代价）
 *   - 全部 crossPath=true（跨路径触发）、mbtiExclusive 限定人格、oncePerGame=true
 *
 * 技能维度（跨路径通用的人类成长技能，写入 pathSkills）：
 *   leadership 领导力 · insight 洞察 · empathy 共情 · resilience 韧性
 *   creativity 创造力 · selfAwareness 自我觉察 · adaptability 适应力
 *
 * 状态效果约定：
 *   skillGains / savingsChange 为声明式字段，由 store 统一应用。
 *   stateEffect 仅负责 stress / happiness / health / pathFaith 的钳制调整。
 * ================================================================
 */
import type { NarrativeEvent, GameState } from '../types/global.d.js';
import { registerNarrativeEvents } from './narrative-registry.js';

// ============================================================
// 辅助函数
// ============================================================

/** 数值钳制（所有状态修改必须经过此函数，保证 0-100 区间） */
function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// ============================================================
// MBTI 专属叙事事件（32 个，2 × 16 型）
// ============================================================

const MBTI_NARRATIVE_EVENTS: NarrativeEvent[] = [

  // ============================================================
  // NT 理性者 — 控制与混沌的张力
  // ============================================================

  // ----------------------------------------------------------
  // INTJ · 建筑师 · 控制的幻觉
  // ----------------------------------------------------------
  {
    id: 'mbti_intj_early_puppeteer',
    title: '棋盘上的手',
    narrative:
      '季度复盘会上，所有人都在称赞那个"天衣无缝"的项目。只有你知道，它的成功是因为你提前把搭档调到了边缘——他的意见会拖慢流程，所以你让流程绕开了他。\n' +
      '他上周递了辞呈，临走留下一句："在你眼里，我从来不是一个人，是一个会出错的变量。"\n' +
      '你盯着那份完美的复盘PPT，第一次感到一种说不清的恶心。系统运转得越好，你越觉得自己像个没有体温的操作员——你可以控制每一个变量，却控制不了这种"被自己控制"的空虚。',
    pathId: 'ai_symbiote',
    crossPath: true,
    mbtiExclusive: 'INTJ',
    ageRange: [25, 33],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    options: [
      {
        id: 'intj_puppet_a',
        label: '把他抽象成"人员风险因子"',
        description: '把这次经验沉淀成一套人员风险管控模型，下次更早识别并隔离这类变量。系统不在乎谁离开，只在乎它是否运转。',
        hint: '洞察+8，领导力+5，压力+5，幸福-6，存款+3000',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.happiness = clamp(s.happiness - 6, 0, 100);
        },
        skillGains: { insight: 8, leadership: 5 },
        savingsChange: 3000,
        log: '你把搭档写进了模型，标注为"可隔离变量"。流程更顺了，只是此后再没有人愿意跟你搭档——他们怕成为下一行参数。',
      },
      {
        id: 'intj_puppet_b',
        label: '约他喝杯酒，问他当时到底想说什么',
        description: '放下模型，去听一个你已经"算过"的人。这很低效，但你忽然想知道，被你绕开的那部分世界里有什么。',
        hint: '共情+6，压力+4，幸福+4，存款-800',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.happiness = clamp(s.happiness + 4, 0, 100);
        },
        skillGains: { empathy: 6 },
        savingsChange: -800,
        log: '那晚他喝多了，说你其实很聪明，只是聪明得让人害怕。你第一次发现，承认一个人是"人"，比把他算成变量更难，也更真实。',
      },
      {
        id: 'intj_puppet_c',
        label: '把他的名字加进致谢页，然后翻篇',
        description: '系统已经优化好了，补一个体面的注脚就够了。你不想为一个人，重启整张图纸。',
        hint: '领导力+3，信念-5，压力-3',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
        },
        skillGains: { leadership: 3 },
        log: '致谢页多了一个名字，没人多看一眼。你告诉自己事情解决了，可那个"变量"的眼神，会在每个失眠的夜里回来一次。',
      },
    ],
  },
  {
    id: 'mbti_intj_mid_void',
    title: '山顶的图纸',
    narrative:
      '四十岁那年，你人生的五年计划第一次全部兑现：职位、存款、房产、甚至"合适的伴侣"都按时间表到位了。\n' +
      '可那天夜里你坐在装修好的书房里，看着墙上的甘特图，忽然不知道自己为什么坐在这里。那些计划是你的，还是计划反过来塑造了一个叫"你"的执行程序？\n' +
      '你发现一件事：你从来没有失败过，因为你从来没有真正选择过——你只是在执行那个"最优解"。而最优解里，没有"你"。',
    pathId: 'ai_symbiote',
    crossPath: true,
    mbtiExclusive: 'INTJ',
    ageRange: [38, 48],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'breakthrough',
    options: [
      {
        id: 'intj_void_a',
        label: '再做一个更大的十年计划',
        description: '用规模淹没这种空洞。计划越大，越没有空隙去想"为什么"——这是你最熟悉的解法。',
        hint: '洞察+10，信念+6，压力+8，幸福-7，存款+8000',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.happiness = clamp(s.happiness - 7, 0, 100);
        },
        skillGains: { insight: 10 },
        savingsChange: 8000,
        log: '你用一张更大的图纸盖住了那张空白的内心。十年计划很完美，完美到连"你"都可以省略。',
      },
      {
        id: 'intj_void_b',
        label: '故意搞砸一件事，看看"失控"是什么感觉',
        description: '明知不是最优解，偏偏选它。你想知道，当计划失败的那一刻，留下的那个"你"是谁。',
        hint: '自我觉察+10，韧性+6，压力+6，幸福+5，存款-12000',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        skillGains: { selfAwareness: 10, resilience: 6 },
        savingsChange: -12000,
        log: '搞砸的那一刻你慌了，然后笑了——原来脱离最优解之后，你还活着。这是计划从未给过你的感觉。',
      },
      {
        id: 'intj_void_c',
        label: '什么都不做，等这种感觉自己过去',
        description: '情绪只是神经递质的波动，时间会抚平它。你只需要等系统自检完成。',
        hint: '信念-8，幸福-4，压力+3',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 8, 0, 100);
          s.happiness = clamp(s.happiness - 4, 0, 100);
        },
        log: '那种空虚没有过去，它只是搬到了更深的地方，变成你书房里一块永远擦不掉的阴影。',
      },
    ],
  },

  // ----------------------------------------------------------
  // INTP · 逻辑学家 · 理解即瘫痪
  // ----------------------------------------------------------
  {
    id: 'mbti_intp_early_paralysis',
    title: '拆到停不下来',
    narrative:
      '那个跳槽的机会你研究了整整两个月：行业报告看了四十份，公司架构图画了三版，连新上司的社交媒体你都扒了一遍。\n' +
      'deadline 那天你还在写第十七页的"风险分析矩阵"，HR 发来消息：岗位已关闭。\n' +
      '你这才意识到，你不是在"做准备"，你是在用分析逃避决定——因为一旦行动，你就得承认你看穿了的东西：没有哪个选择是真正合理的，所有的"最优"都是你给自己编的故事。理解得越深，你越无法迈出那一步。',
    pathId: 'ai_symbiote',
    crossPath: true,
    mbtiExclusive: 'INTP',
    ageRange: [25, 33],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    options: [
      {
        id: 'intp_paral_a',
        label: '把这次失败也写进分析',
        description: '建立一套"决策瘫痪预警系统"，下次更早识别自己何时在用分析逃避行动。理解这个bug，就能 patch 它。',
        hint: '洞察+8，压力+5，信念+4，存款-500',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        skillGains: { insight: 8 },
        savingsChange: -500,
        log: '你把"决策瘫痪"也拆解成了一组变量。系统很漂亮，只是下一次机会来时，你又开始拆它了。',
      },
      {
        id: 'intp_paral_b',
        label: '掷硬币决定，三秒内投出简历',
        description: '不看分析，不找最优。强迫自己在"理解"完成之前就行动——这一次，让行动走在前面。',
        hint: '适应力+8，韧性+5，压力+7，幸福+5，存款+2000',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 7, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        skillGains: { adaptability: 8, resilience: 5 },
        savingsChange: 2000,
        log: '简历发出去那一刻你手在抖。后来你才明白，有些事不是想通了才能做，是做了才会想通。',
      },
      {
        id: 'intp_paral_c',
        label: '再给自己一周，"这次一定分析透"',
        description: '一定是分析得还不够深。再深一层，你就能找到那个真正"合理"的答案。',
        hint: '洞察+3，信念-6，压力+4',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 6, 0, 100);
        },
        skillGains: { insight: 3 },
        log: '一周变成一个月，一个月变成一年。你把整个人生都分析透了，唯独没活过其中任何一天。',
      },
    ],
  },
  {
    id: 'mbti_intp_mid_truth',
    title: '看见底牌之后',
    narrative:
      '你用了十几年，终于把"这一切是怎么运转的"彻底想通了——婚姻是契约，工作是交易，连"意义"都不过是大脑分泌的安慰剂。\n' +
      '理论上你获得了自由，实际上你瘫痪了。因为每一个行动都建立在你已经看穿的幻觉上：去爱是激素，去奋斗是多巴胺陷阱，去相信是自我欺骗。\n' +
      '你坐在一堆拆解完毕的齿轮中间，第一次问自己：理解，到底是救赎，还是你给自己判的无期徒刑？',
    pathId: 'ai_symbiote',
    crossPath: true,
    mbtiExclusive: 'INTP',
    ageRange: [38, 48],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    options: [
      {
        id: 'intp_truth_a',
        label: '继续往下拆，连"拆解本身"也拆掉',
        description: '看看到底还剩什么。也许拆到尽头，会有一个拆不掉的东西——也许没有，但你要亲眼确认。',
        hint: '洞察+12，信念-6，压力+9，幸福-5',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 9, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 6, 0, 100);
          s.happiness = clamp(s.happiness - 5, 0, 100);
        },
        skillGains: { insight: 12 },
        log: '你拆到了尽头，那里什么都没有。你得到了终极的清醒，也失去了最后一个能骗自己入睡的故事。',
      },
      {
        id: 'intp_truth_b',
        label: '明知是幻觉，也去认真爱一个人、做一件事',
        description: '既然全是故事，那就亲手写一个你愿意相信的故事。不是因为它是真的，而是因为你选择让它成真。',
        hint: '共情+8，自我觉察+8，压力+6，幸福+7，存款-6000',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.happiness = clamp(s.happiness + 7, 0, 100);
        },
        skillGains: { empathy: 8, selfAwareness: 8 },
        savingsChange: -6000,
        log: '你明知爱是激素，还是认真地爱了一次。那一晚你失眠了——不是因为清醒，是因为很久没这么"活着"。',
      },
      {
        id: 'intp_truth_c',
        label: '"想通了自然就好了"，继续躺着',
        description: '既然一切无意义，那躺着和奋斗有什么区别？清醒的人不需要行动。',
        hint: '信念-8，幸福-5，健康-4',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.pathFaith = clamp(s.pathFaith - 8, 0, 100);
          s.happiness = clamp(s.happiness - 5, 0, 100);
          s.health = clamp(s.health - 4, 0, 100);
        },
        log: '你用"看透了"为自己的停滞辩护。可清醒从不替任何人活过，它只是让你更清楚地看见自己在腐烂。',
      },
    ],
  },

  // ----------------------------------------------------------
  // ENTJ · 指挥官 · 权力的孤独
  // ----------------------------------------------------------
  {
    id: 'mbti_entj_early_throne',
    title: '没人敢跟你吃饭',
    narrative:
      '你升主管后第二个月，团队 KPI 涨了 40%。你把每个人的工作拆成可量化的流程，迟到的、低效的、"情绪化"的，统统优化掉。\n' +
      '那天中午你端着餐盘走进食堂，一整张桌子的人在你坐下前各自找借口散了。你听见背后有人小声说："跟他吃饭像被审计。"\n' +
      '你一个人吃完那顿饭，第一次发现效率有个副作用——它能让事情运转，也能把人变成你不敢接近的东西。你赢了 KPI，输掉了一张能一起吃饭的桌子。',
    pathId: 'ai_symbiote',
    crossPath: true,
    mbtiExclusive: 'ENTJ',
    ageRange: [25, 33],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    options: [
      {
        id: 'entj_throne_a',
        label: '优化掉"吃饭"这个低效环节',
        description: '自己边吃边工作，把社交时间也并入产出。孤独只是效率的副产品，而效率才是你唯一的信仰。',
        hint: '领导力+8，压力+5，幸福-6，存款+4000',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.happiness = clamp(s.happiness - 6, 0, 100);
        },
        skillGains: { leadership: 8 },
        savingsChange: 4000,
        log: '你把午餐也变成了工作。KPI 继续涨，只是食堂里再没有人给你留位置了。',
      },
      {
        id: 'entj_throne_b',
        label: '每周一次不带议程的饭局',
        description: '"低效"地陪他们聊聊生活。这是你第一次主动把时间花在不能被量化的事情上。',
        hint: '共情+7，领导力+4，压力-3，幸福+6，存款-1500',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress - 3, 0, 100);
          s.happiness = clamp(s.happiness + 6, 0, 100);
        },
        skillGains: { empathy: 7, leadership: 4 },
        savingsChange: -1500,
        log: '第一顿没议程的饭你浑身别扭。后来有人开始主动给你留位置了——不是因为你有用，是因为你来了。',
      },
      {
        id: 'entj_throne_c',
        label: '团建发个红包，"意思到了就行"',
        description: '用一笔钱买回"人情"，既不耽误效率，也算给了团队交代。关系也是一种可采购的资源。',
        hint: '领导力+3，信念-4，压力+3',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 4, 0, 100);
        },
        skillGains: { leadership: 3 },
        log: '红包发出去，群里一片"谢谢老板"。你看着那些表情包，忽然觉得它们比食堂的空椅子更冷。',
      },
    ],
  },
  {
    id: 'mbti_entj_mid_summit',
    title: '山顶只有风',
    narrative:
      '四十二岁，你坐进了独立办公室，窗外是整座城市的天际线。你用效率丈量过的一切都到位了：团队、营收、行业地位。\n' +
      '那天体检报告出来，医生说你的心脏在"用四十岁的年龄跑六十岁的节奏"。你挂了电话想找人说说，翻遍通讯录——所有人都是"资源"，没有一个是"人"。\n' +
      '你站在落地窗前，第一次问自己：你爬上来的到底是山，还是你自己垒的牢笼？山顶的风很大，大到听不见任何人声。',
    pathId: 'ai_symbiote',
    crossPath: true,
    mbtiExclusive: 'ENTJ',
    ageRange: [38, 48],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    options: [
      {
        id: 'entj_summit_a',
        label: '把健康也纳入优化系统',
        description: '连身体都要服从效率。给自己排一份精确到分钟的康复计划，心脏不过是又一个待优化的变量。',
        hint: '领导力+10，压力+8，健康-5，信念+5，存款+10000',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        skillGains: { leadership: 10 },
        savingsChange: 10000,
        log: '你把心脏也编进了甘特图。系统依旧完美运转，只是那个运转它的机器，开始漏电了。',
      },
      {
        id: 'entj_summit_b',
        label: '停下手头一切，去见一个被你"优化"掉的老朋友',
        description: '飞一趟，不带目的，不带议程。你想看看，那个被你当成"冗余"删掉的人，现在过得怎么样。',
        hint: '共情+10，自我觉察+8，压力+5，幸福+8，健康+3，存款-18000',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.health = clamp(s.health + 3, 0, 100);
        },
        skillGains: { empathy: 10, selfAwareness: 8 },
        savingsChange: -18000,
        log: '老朋友没怪你，只是说"你终于肯下来了"。那天你睡得很早，山顶的风，第一次没在你梦里吹。',
      },
      {
        id: 'entj_summit_c',
        label: '加班到更晚，用"更忙"盖住这种孤独',
        description: '忙起来就不会想了。效率是唯一的解药，你只需要再爬高一点。',
        hint: '信念-7，健康-6，压力+8',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 7, 0, 100);
          s.health = clamp(s.health - 6, 0, 100);
        },
        log: '你爬得越高，风越大，人越少。最后你站在了所有人都仰视的地方，也站在了没人能听见你的地方。',
      },
    ],
  },

  // ----------------------------------------------------------
  // ENTP · 辩论家 · 怀疑即信仰
  // ----------------------------------------------------------
  {
    id: 'mbti_entp_early_deconstruct',
    title: '拆穿一切的人',
    narrative:
      '部门那个"人人叫好"的新战略，你用三句话拆得粉碎：数据是粉饰的，逻辑是循环的，"愿景"不过是给 PPT 加的滤镜。会议室鸦雀无声，领导的脸绿了。\n' +
      '你赢了那场辩论，却没有赢回任何东西。会后没人找你讨论新项目了——他们说你"什么都能反驳，什么都不信"。\n' +
      '你这才意识到，你的聪明让你看穿了一切立场，但看穿之后，你站在原地，连一个愿意跟你并肩的人都没有。怀疑是你的天赋，也是你给自己挖的坑。',
    pathId: 'ai_symbiote',
    crossPath: true,
    mbtiExclusive: 'ENTP',
    ageRange: [25, 33],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    options: [
      {
        id: 'entp_decon_a',
        label: '继续拆，连"团队信任"也一并解构',
        description: '信任不过是概率游戏，依赖不过是心理软弱。你把所有人都看穿了，也就没人能伤到你——你这样安慰自己。',
        hint: '洞察+8，信念+4，压力+4，幸福-6',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          s.happiness = clamp(s.happiness - 6, 0, 100);
        },
        skillGains: { insight: 8 },
        log: '你拆掉了最后一点人情味，换来一个无人敢反驳也无人愿靠近的位置。你赢了所有辩论，也输光了所有同盟。',
      },
      {
        id: 'entp_decon_b',
        label: '选一个你其实看穿了的项目，认真押一次"相信"',
        description: '明知它有漏洞，也押上去。你想知道，看穿之后还愿意相信，是什么感觉。',
        hint: '韧性+8，领导力+5，压力+6，幸福+5，存款+3000',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        skillGains: { resilience: 8, leadership: 5 },
        savingsChange: 3000,
        log: '你押上了一个不完美的赌注。它后来真的出了漏洞——可那是你第一次，为别人的事熬了夜。',
      },
      {
        id: 'entp_decon_c',
        label: '下次开会装作没看出来',
        description: '给别人留点面子，也给自己留点人缘。看穿不一定要说穿。',
        hint: '洞察+3，信念-5，压力+3',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
        },
        skillGains: { insight: 3 },
        log: '你学会了闭嘴，也学会了在闭嘴时轻蔑地笑。人缘是好了点，可你自己开始讨厌那个笑。',
      },
    ],
  },
  {
    id: 'mbti_entp_mid_nowhere',
    title: '无立场的自由',
    narrative:
      '四十岁，你终于做到了"不被任何立场绑架"——你能在任何一个阵营里找出漏洞，能在任何一个信仰里挖出虚伪。你引以为傲。\n' +
      '可那天一个年轻人郑重地问你："那你相信什么？"你张了张嘴，发现自己答不上来。你质疑了一切，连"质疑"本身也早就被你质疑掉了。\n' +
      '没有根基的自由，原来不是飞翔，是失重。你什么都能站，也就哪里都站不稳。',
    pathId: 'ai_symbiote',
    crossPath: true,
    mbtiExclusive: 'ENTP',
    ageRange: [38, 48],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    options: [
      {
        id: 'entp_nowh_a',
        label: '用更精妙的话术绕开这个问题',
        description: '"相信本身就是一种暴力。"你用一句漂亮的反问，把那个年轻人也拆解了。这招百试百灵。',
        hint: '洞察+10，压力+6，信念-5，幸福-5',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
          s.happiness = clamp(s.happiness - 5, 0, 100);
        },
        skillGains: { insight: 10 },
        log: '年轻人被你问住了，崇拜地看着你。可你转身时，那句"那你相信什么"像根刺，扎在你最得意的地方。',
      },
      {
        id: 'entp_nowh_b',
        label: '认真挑一件事，哪怕有漏洞，也押上一辈子的承诺',
        description: '承认它会让你受伤、会被你将来某天拆穿——然后依然押上。你要试试，"明知不完美仍坚持"是什么滋味。',
        hint: '自我觉察+10，韧性+8，压力+7，幸福+8，存款-8000',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 7, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
        },
        skillGains: { selfAwareness: 10, resilience: 8 },
        savingsChange: -8000,
        log: '你第一次为一件有漏洞的事背书。它后来果然露了怯——可你站住了，没有跑。这就是"相信"的全部秘密。',
      },
      {
        id: 'entp_nowh_c',
        label: '"我什么都不信，这本身就是我的立场"',
        description: '用虚无当盾牌，谁也攻不破一个没有阵地的人。这就是你的终极防御。',
        hint: '信念-8，幸福-4，压力+4',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 8, 0, 100);
          s.happiness = clamp(s.happiness - 4, 0, 100);
        },
        log: '你用虚无给自己筑了座无门无窗的城。没人能攻进来——也没人能进来，包括你自己。',
      },
    ],
  },

  // ============================================================
  // NF 理想者 — 意义与现实的撕裂
  // ============================================================

  // ----------------------------------------------------------
  // INFJ · 提倡者 · 预见者的负担
  // ----------------------------------------------------------
  {
    id: 'mbti_infj_early_cassandra',
    title: '没人信的预言',
    narrative:
      '半年前你就看出来那个新方向是个坑——数据、人心、行业趋势，所有深层模式都指向同一个结局。你写了三封预警邮件，开会提了五次，所有人都点头，没人当回事。\n' +
      '如今那个坑真的塌了，损失惨重。复盘会上，领导却皱着眉看你："你既然早看出来了，为什么不更用力地拦住我们？"\n' +
      '你愣住了。你看见了结局，却无法让任何人相信你；现在结局来了，先知的罪名却要由你来背。这就是看透的代价：你永远是那个"早说过"的人，也永远是那个被怪罪的人。',
    pathId: 'ai_symbiote',
    crossPath: true,
    mbtiExclusive: 'INFJ',
    ageRange: [25, 33],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    options: [
      {
        id: 'infj_cass_a',
        label: '下次看穿了就直接越级上报',
        description: '用更强硬、更激烈的方式阻止灾难。哪怕被当成刺头，也要让别人听见——预言不该只停留在你心里。',
        hint: '洞察+8，领导力+5，压力+7，信念+5，存款-1000',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 7, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        skillGains: { insight: 8, leadership: 5 },
        savingsChange: -1000,
        log: '你开始为每一个预见据理力争。预言成真的次数变多了，可你身边的人也越来越少——没人喜欢一个总在预言灾难的人。',
      },
      {
        id: 'infj_cass_b',
        label: '学会"说人话"，把预言翻译成别人听得懂的方式',
        description: '你看见了模式，可你只会用模式说话。这一次，试着用故事、用人、用他们能接住的方式，把真相递过去。',
        hint: '共情+8，适应力+6，压力+4，幸福+5',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        skillGains: { empathy: 8, adaptability: 6 },
        log: '你第一次没说"我早说过"，而是讲了一个故事。居然有人听进去了。原来孤独不是预言的代价，是不会翻译的代价。',
      },
      {
        id: 'infj_cass_c',
        label: '以后看穿了也别说，"反正说了也没人信"',
        description: '收起那双看太远的眼睛，做个普通人。不被相信，至少不会被怪罪。',
        hint: '洞察+3，信念-6，压力+3',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 6, 0, 100);
        },
        skillGains: { insight: 3 },
        log: '你学会了闭嘴，也学会了在心里冷冷地看着灾难发生。沉默保住了你，却让那双眼睛越来越冷。',
      },
    ],
  },
  {
    id: 'mbti_infj_mid_burn',
    title: '火焰也需要燃料',
    narrative:
      '为了那个你看见了十年的理想，你燃烧了一切：加班、储蓄、健康、连仅有的几段关系都被你"暂时搁置"。你相信只要撑到那天，一切都值得。\n' +
      '那天你晕倒在工位上，醒来时病房里没有一个人。你的理想太清晰，清晰到你看不见自己已经快没了。\n' +
      '护士问你联系谁，你忽然说不出一个名字。你才明白：你可以为理想燃烧自己，但火焰也需要燃料——而你这团火，快要烧到自己的根了。',
    pathId: 'ai_symbiote',
    crossPath: true,
    mbtiExclusive: 'INFJ',
    ageRange: [38, 48],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    options: [
      {
        id: 'infj_burn_a',
        label: '出院后加倍投入',
        description: '"理想没实现之前，我没有资格倒下。"你把医嘱也当成可以被意志压下去的噪音。',
        hint: '洞察+10，信念+8，压力+10，健康-7，幸福-5',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.health = clamp(s.health - 7, 0, 100);
          s.happiness = clamp(s.happiness - 5, 0, 100);
        },
        skillGains: { insight: 10 },
        log: '你出院第二天就回到了工位。理想又往前推了一寸，而你又往后退了一寸——只是这次，没人看见你退。',
      },
      {
        id: 'infj_burn_b',
        label: '停半年，去修补那些被你搁置的关系',
        description: '哪怕理想迟到。你忽然意识到，一个被燃烧殆尽的先知，照亮不了任何人。',
        hint: '共情+10，自我觉察+8，压力-6，幸福+8，健康+5，存款-15000',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress - 6, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.health = clamp(s.health + 5, 0, 100);
        },
        skillGains: { empathy: 10, selfAwareness: 8 },
        savingsChange: -15000,
        log: '你给那些被搁置的名字一个个打了电话。有的还接，有的已经不接了。可你第一次觉得，理想之外，你也有一个值得被照亮的生活。',
      },
      {
        id: 'infj_burn_c',
        label: '嘴上说"会注意身体"，行动上一切照旧',
        description: '承诺很轻，惯性很重。你太习惯燃烧，停下来反而会慌。',
        hint: '信念-5，健康-5，压力+5',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
        },
        log: '你给所有人保证了"会休息"，然后继续熬夜。理想还在远处亮着，而你这团火，已经开始烧出焦味了。',
      },
    ],
  },

  // ----------------------------------------------------------
  // INFP · 调停者 · 真实的代价
  // ----------------------------------------------------------
  {
    id: 'mbti_infp_early_authentic',
    title: '不演的那个',
    narrative:
      '那个能让你升职的项目，要求你在汇报里把一个你自己都不信的"愿景"讲得热血沸腾。你的内心在尖叫：这是假的，这是表演，这是出卖。\n' +
      '同事劝你"大家都这样，fake it till you make it"。你试了一晚上，对着镜子练那句假话，练到反胃。\n' +
      '你拒绝成为任何你不相信的东西——但世界不给理想主义者发工资。第二天汇报，你选择了沉默。你保住了自己，也保住了那份永远在"格格不入"里的孤独。',
    pathId: 'ai_symbiote',
    crossPath: true,
    mbtiExclusive: 'INFP',
    ageRange: [25, 33],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    options: [
      {
        id: 'infp_auth_a',
        label: '坚持不演，哪怕机会飞了',
        description: '"我宁可穷着做自己。"你的纯粹是你的盾牌，哪怕这面盾牌很沉，沉到挡住了一切机会。',
        hint: '自我觉察+8，信念+6，压力+5，幸福+4，存款-3000',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.happiness = clamp(s.happiness + 4, 0, 100);
        },
        skillGains: { selfAwareness: 8 },
        savingsChange: -3000,
        log: '你拒绝了那次汇报，也拒绝了那个职位。镜子里的你很干净，只是账户里的数字，开始替你发抖。',
      },
      {
        id: 'infp_auth_b',
        label: '试着演一次，把"表演"也当成理解世界的练习',
        description: '走出那座只有自己的教堂，去摸一摸粗糙的人间。也许理解"假"，才能更懂"真"。',
        hint: '适应力+8，共情+5，压力+7，幸福-3，存款+4000',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 7, 0, 100);
          s.happiness = clamp(s.happiness - 3, 0, 100);
        },
        skillGains: { adaptability: 8, empathy: 5 },
        savingsChange: 4000,
        log: '你硬着头皮把那句假话讲了。讲完你躲进洗手间干呕——可你第一次知道，原来世界不是非黑即白，你能在灰色里也守住内核。',
      },
      {
        id: 'infp_auth_c',
        label: '把汇报推给同事，躲到幕后',
        description: '"眼不见为净。"既不出卖自己，也不正面硬刚，躲开就好。',
        hint: '信念-5，压力+4，幸福-3',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
          s.happiness = clamp(s.happiness - 3, 0, 100);
        },
        log: '你把话筒递给了别人，也把那份"该不该妥协"的纠结，原封不动留给了以后的自己。',
      },
    ],
  },
  {
    id: 'mbti_infp_mid_sellout',
    title: '纯粹与面包',
    narrative:
      '四十岁，房租涨了，父母病了，你那个"只做我相信的事"的原则，第一次撞上一道算不过来的账。一个你瞧不起的甲方递来一份你十年都赚不到的钱，条件是——把你的名字，署在一篇你鄙视的东西上。\n' +
      '你的内心世界丰富得像一座教堂，外部世界粗糙得像一把锉刀。你站在十字路口：是守住那座空无一人的教堂，还是走进那个熙熙攘攘、却会让你面目模糊的人间？\n' +
      '你的纯粹，到底是盾牌，还是你为自己画的牢？',
    pathId: 'ai_symbiote',
    crossPath: true,
    mbtiExclusive: 'INFP',
    ageRange: [38, 48],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    options: [
      {
        id: 'infp_sell_a',
        label: '拒掉，"宁可饿死，不署假名"',
        description: '守住那座教堂。哪怕它空无一人，哪怕守它的人快饿死了——你的名字，是你最后一块干净的领地。',
        hint: '自我觉察+10，信念+8，压力+8，幸福-4，存款-20000',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.happiness = clamp(s.happiness - 4, 0, 100);
        },
        skillGains: { selfAwareness: 10 },
        savingsChange: -20000,
        log: '你拒绝了那笔钱。夜里你看着父母的医药费单据失眠，可你摸了摸胸口——那个叫"你"的东西，还在。',
      },
      {
        id: 'infp_sell_b',
        label: '接下，但用这笔钱去做一件你真正相信的事',
        description: '让肮脏养活纯粹。你咽下这一次的署名，换一笔能让你的教堂重新亮起来的钱。这是你最痛的一次妥协，也是最清醒的一次选择。',
        hint: '适应力+10，韧性+8，压力+9，幸福-5，存款+25000',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 9, 0, 100);
          s.happiness = clamp(s.happiness - 5, 0, 100);
        },
        skillGains: { adaptability: 10, resilience: 8 },
        savingsChange: 25000,
        log: '你署了那个让你作呕的名字，然后用那笔钱种下了你真正相信的东西。手脏了，可根活了下来——这才是真正的纯粹。',
      },
      {
        id: 'infp_sell_c',
        label: '拖着自己"再想想"，错过 deadline',
        description: '不拒绝，也不接受，让时间替你做决定。这样你谁都不用得罪——包括你自己。',
        hint: '信念-7，幸福-5，压力+6',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 7, 0, 100);
          s.happiness = clamp(s.happiness - 5, 0, 100);
        },
        log: '截止日过了，钱和原则你都没保住。你用"没选"逃避了选择，可"没选"本身，就是最坏的那种选择。',
      },
    ],
  },

  // ----------------------------------------------------------
  // ENFJ · 主人公 · 给予者的枯竭
  // ----------------------------------------------------------
  {
    id: 'mbti_enfj_early_giver',
    title: '没人问你还好吗',
    narrative:
      '这一年你帮同事改简历、帮朋友调解吵架、帮下属争取晋升、帮父母挂号——你是所有人的树洞、军师、保姆。你的价值感就建立在"被需要"上。\n' +
      '那天你发烧到 39 度，躺在床上翻通讯录，想找个人说说难受。划了三百个名字，没一个发出去——因为你太擅长理解别人，以至于没人记得你也会倒下。\n' +
      '给予是爱，还是你逃避"自己也需要被爱"这件事的方式？你烧得迷迷糊糊，第一次问自己这个问题。',
    pathId: 'ai_symbiote',
    crossPath: true,
    mbtiExclusive: 'ENFJ',
    ageRange: [25, 33],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    options: [
      {
        id: 'enfj_giver_a',
        label: '病好了继续当所有人的依靠',
        description: '"被需要就是我存在的理由。"你把这场病也归档为"小插曲"，然后继续把所有人的事，顶在自己肩上。',
        hint: '共情+8，领导力+5，压力+7，健康-5，幸福-4',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 7, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
          s.happiness = clamp(s.happiness - 4, 0, 100);
        },
        skillGains: { empathy: 8, leadership: 5 },
        log: '你退烧第二天就回了所有人的消息。所有人都说"有你真好"，没人问"你为什么瘦了"。',
      },
      {
        id: 'enfj_giver_b',
        label: '第一次主动开口："我今天需要你陪陪我"',
        description: '把那个滚了二十多年的"被需要"翻个面。你想知道，被照顾，是什么感觉。',
        hint: '自我觉察+8，共情+5，压力+4，幸福+7，健康+3',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.happiness = clamp(s.happiness + 7, 0, 100);
          s.health = clamp(s.health + 3, 0, 100);
        },
        skillGains: { selfAwareness: 8, empathy: 5 },
        log: '你颤抖着发出那条消息。十分钟后，有人提着粥出现在你门口。原来被爱不需要理由，你只是太久没开口要了。',
      },
      {
        id: 'enfj_giver_c',
        label: '发条朋友圈"最近有点累"，等人来问',
        description: '还是被动一点安全。让别人主动发现你累了，比你自己开口要轻松得多。',
        hint: '信念-5，压力+4，幸福-3',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
          s.happiness = clamp(s.happiness - 3, 0, 100);
        },
        log: '朋友圈收到一堆点赞和"加油"，没有一条问"你怎么了"。你删除了那条动态，告诉自己下次别这么矫情。',
      },
    ],
  },
  {
    id: 'mbti_enfj_mid_empty',
    title: '照亮所有人的灯',
    narrative:
      '四十岁，你成了所有人眼里的"光"——下属说你改变了他们的人生，朋友说没有你他们撑不下去。你听着一面面锦旗，心里却空得发慌。\n' +
      '那天深夜你一个人坐在客厅，发现一件事：你的温暖照亮了所有人，唯独照不到你自己。你太擅长理解别人，以至于忘了如何被理解。\n' +
      '你忽然很想知道：如果有一天你不再"有用"了，这些人还会留下吗？还是说，你早就用"被需要"，把"我是谁"这个问题，永远地藏起来了？',
    pathId: 'ai_symbiote',
    crossPath: true,
    mbtiExclusive: 'ENFJ',
    ageRange: [38, 48],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    options: [
      {
        id: 'enfj_empty_a',
        label: '再接一个"拯救"任务，用更忙盖住这种空',
        description: '只要还在给予，你就还有价值。空？那是闲出来的病，忙起来就好了。',
        hint: '共情+10，领导力+6，压力+9，健康-6，幸福-5',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 9, 0, 100);
          s.health = clamp(s.health - 6, 0, 100);
          s.happiness = clamp(s.happiness - 5, 0, 100);
        },
        skillGains: { empathy: 10, leadership: 6 },
        log: '你又救了一个人，又丢了一点自己。你照亮的世界越来越大，你站的地方越来越暗。',
      },
      {
        id: 'enfj_empty_b',
        label: '推掉所有"被需要"的事，独处一个月',
        description: '第一次面对那个不被任何人需要的自己。你怕极了，可你想知道，灯关掉之后，里面还有没有东西。',
        hint: '自我觉察+12，韧性+6，压力+7，幸福+8，存款-10000',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 7, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
        },
        skillGains: { selfAwareness: 12, resilience: 6 },
        savingsChange: -10000,
        log: '独处的第一个星期你几乎崩溃——原来你这么怕"不被需要"。可到了第三十天，你第一次喜欢上了这个不需要任何人的自己。',
      },
      {
        id: 'enfj_empty_c',
        label: '继续给所有人当光，"反正我自己也习惯了"',
        description: '灯不能灭，灭了太多人会摔跤。至于灯自己黑不黑，没人看见就不算。',
        hint: '信念-7，健康-5，压力+6',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 7, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
        },
        log: '你继续亮着，亮得所有人都仰视。只是没人发现，这盏灯的芯，已经烧到只剩一截灰了。',
      },
    ],
  },

  // ----------------------------------------------------------
  // ENFP · 竞选者 · 可能性的暴政
  // ----------------------------------------------------------
  {
    id: 'mbti_enfp_early_doors',
    title: '五扇开着的门',
    narrative:
      '你同时报了三个班、谈着两段暧昧、存着一个创业点子、还想着出国读书——每一个都让你心跳加速，每一个都"说不定就是我的真爱"。\n' +
      '半年过去，没有一个班上完，没有一段关系落地，创业计划停在第二页，留学申请过了截止日期。你的热情是真的，可真东西需要扎根，而你害怕扎根——扎根就意味着关上其他所有的门。\n' +
      '你盯着五扇开着的门，第一次害怕起来：每一个选择都意味着杀死其他所有可能性。可一直不选，你是不是正在杀死自己？',
    pathId: 'ai_symbiote',
    crossPath: true,
    mbtiExclusive: 'ENFP',
    ageRange: [25, 33],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    options: [
      {
        id: 'enfp_doors_a',
        label: '再加一扇门，"说不定这个才是对的方向"',
        description: '多一扇门就多一种可能，可能性是你的氧气。关掉任何一扇，你都会窒息。',
        hint: '创造力+8，适应力+5，压力+6，信念+4，存款-2000',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        skillGains: { creativity: 8, adaptability: 5 },
        savingsChange: -2000,
        log: '你又推开了一扇门。门后很精彩，精彩到你忘了回头看——那五扇门里，已经有一扇悄悄关上了。',
      },
      {
        id: 'enfp_doors_b',
        label: '挑一扇门走进去，亲手关上其余四扇',
        description: '"这次我扎根。"你怕得要死，可你更怕一辈子站在走廊里。关门的声响，也许就是你真正活着的证据。',
        hint: '韧性+10，自我觉察+6，压力+8，幸福+6，存款+3000',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.happiness = clamp(s.happiness + 6, 0, 100);
        },
        skillGains: { resilience: 10, selfAwareness: 6 },
        savingsChange: 3000,
        log: '你关上了四扇门，手抖了一整晚。可第二天醒来，你第一次觉得脚下有根——原来扎根不是失去自由，是自由终于有了重量。',
      },
      {
        id: 'enfp_doors_c',
        label: '"再观察一阵"，五扇门都虚掩着',
        description: '"我还没准备好。"让所有的可能性再飞一会儿，等那个"绝对不会错"的信号出现。',
        hint: '信念-6，压力+5，幸福-4',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 6, 0, 100);
          s.happiness = clamp(s.happiness - 4, 0, 100);
        },
        log: '你继续在五扇门之间徘徊，告诉自己"快了，就快决定了"。可门缝里的光，正在一寸一寸地暗下去。',
      },
    ],
  },
  {
    id: 'mbti_enfp_mid_closing',
    title: '门一扇扇关上',
    narrative:
      '四十岁，你忽然发现那些开着的门正在一扇扇自己关上——不是你选的，是时间替你选的。想去的公司不要 35+，想爱的人结了婚，想学的手艺"年纪大了学不动"。\n' +
      '你曾经拥有整个旷野的自由，如今旷野变成了走廊，走廊变成了死胡同。你追逐了半生自由，才发现自由是你最大的牢笼——因为自由从来不是"什么都能选"，而是"必须选一个，然后为它负责"。\n' +
      '你站在最后一扇还没关上的门前，手放在把手上，这一次，你怕的不是选错，是不选。',
    pathId: 'ai_symbiote',
    crossPath: true,
    mbtiExclusive: 'ENFP',
    ageRange: [38, 48],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    options: [
      {
        id: 'enfp_clos_a',
        label: '推开最后一扇门冲进去，不管是什么',
        description: '"至少还在动。"动起来就不会怕，怕的是停下来。你用速度对抗那种走廊变窄的窒息。',
        hint: '创造力+10，适应力+6，压力+8，信念+5，存款-8000',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        skillGains: { creativity: 10, adaptability: 6 },
        savingsChange: -8000,
        log: '你冲进了那扇门，里面是一片新的旷野。你松了口气——可你心里清楚，你只是又一次用"新"盖住了"怕"。',
      },
      {
        id: 'enfp_clos_b',
        label: '停下，认真想清楚自己真正要的那一个',
        description: '然后押上全部。这一次不是逃避无聊，也不是追逐新鲜，是你半生第一次，为一个东西"负责到底"。',
        hint: '自我觉察+12，韧性+8，压力+7，幸福+9，存款+5000',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 7, 0, 100);
          s.happiness = clamp(s.happiness + 9, 0, 100);
        },
        skillGains: { selfAwareness: 12, resilience: 8 },
        savingsChange: 5000,
        log: '你站在门前想了整整三天。第三天你推开了它——不是因为它是新的，而是因为你终于知道，自己为什么推开它。',
      },
      {
        id: 'enfp_clos_c',
        label: '什么都不做，让最后一扇门也自己关上',
        description: '"至少我没选错。"不选就永远不会错——这是你给自己留的最后一种自由。',
        hint: '信念-9，幸福-6，压力+5',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 9, 0, 100);
          s.happiness = clamp(s.happiness - 6, 0, 100);
        },
        log: '最后一扇门"咔"地关上了，走廊终于成了死胡同。你靠在墙上，忽然懂了：不选，才是唯一不可挽回的错。',
      },
    ],
  },

  // ============================================================
  // SJ 守护者 — 责任与欲望的枷锁
  // ============================================================

  // ----------------------------------------------------------
  // ISTJ · 物流师 · 责任即牢笼
  // ----------------------------------------------------------
  {
    id: 'mbti_istj_early_dumped',
    title: '所有人的兜底',
    narrative:
      '你从来不做"不该做的事"——所以当同事甩锅、领导加活、父母要钱、伴侣抱怨时，第一个被想到的永远是你。"交给他最放心"，是夸奖，也是判决。\n' +
      '这个月你连轴转了三十天，没有人问过你累不累。你想拒绝，可"拒绝"在你字典里属于"不该做的事"。\n' +
      '你用责任填满了所有时间，可能只是为了逃避那个空荡荡的问题：如果不做这些"该做的事"，你究竟是谁？责任是美德，还是你不敢质疑的暴君？',
    pathId: 'ai_symbiote',
    crossPath: true,
    mbtiExclusive: 'ISTJ',
    ageRange: [25, 33],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    options: [
      {
        id: 'istj_dumped_a',
        label: '更可靠地接下一切，"扛得住是本事"',
        description: '用责任证明价值。你把"被依赖"当成勋章，把疲惫当成勋章背面必然的划痕。',
        hint: '领导力+6，韧性+5，压力+8，幸福-5，存款+3000',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.happiness = clamp(s.happiness - 5, 0, 100);
        },
        skillGains: { leadership: 6, resilience: 5 },
        savingsChange: 3000,
        log: '你又扛下了一切，所有人都夸你靠谱。只是深夜回到家，你对着空房间，忽然不知道这身"靠谱"是盔甲，还是棺材。',
      },
      {
        id: 'istj_dumped_b',
        label: '生平第一次说"不"',
        description: '哪怕被人说"变自私了"。你想知道，那个会拒绝的"你"，是不是比那个只会扛的"你"更真实。',
        hint: '自我觉察+8，韧性+6，压力+6，幸福+6，存款-1500',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.happiness = clamp(s.happiness + 6, 0, 100);
        },
        skillGains: { selfAwareness: 8, resilience: 6 },
        savingsChange: -1500,
        log: '"不"字出口的那一刻你胃都紧了。可对方只是愣了一下，说"那我找别人"。原来拒绝天不会塌，塌的只是你心里的那个暴君。',
      },
      {
        id: 'istj_dumped_c',
        label: '嘴上不拒绝，"磨洋工"消极应付',
        description: '既不扛，也不反抗。用拖延和低效，无声地表达你不愿意——可你不说出口。',
        hint: '信念-5，压力+5，幸福-4',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
          s.happiness = clamp(s.happiness - 4, 0, 100);
        },
        log: '你学会了消极抵抗，活儿照样堆，怨气却在暗处发酵。你以为自己没得罪谁，其实你得罪了那个最该被善待的自己。',
      },
    ],
  },
  {
    id: 'mbti_istj_mid_rule',
    title: '谁规定的"该"',
    narrative:
      '四十五岁，你照着"该做的事"活了大半辈子：该结婚的年纪结了，该买房的年纪买了，该升职的年纪升了。每一步都对，每一步都不快乐。\n' +
      '那天你翻到二十岁写的日记，里面有一句被你划掉的话："我想去看海。"你算了一下，这二十五年里你一次海都没去看过，因为"那时候该忙事业"，"后来该顾家庭"。\n' +
      '你忽然不明白那些"该"是谁规定的了。你用一辈子的"该"，换来的，到底是自己的人生，还是别人画好让你填的格子？',
    pathId: 'ai_symbiote',
    crossPath: true,
    mbtiExclusive: 'ISTJ',
    ageRange: [38, 48],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'breakthrough',
    options: [
      {
        id: 'istj_rule_a',
        label: '把"看海"也排进日程表',
        description: '"周末两天，效率够用。"你用对付所有"该做的事"的方式，去对付这件"想做的事"——还是按计划来。',
        hint: '领导力+8，韧性+5，压力+6，信念+4，存款+6000',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        skillGains: { leadership: 8, resilience: 5 },
        savingsChange: 6000,
        log: '你按计划看了海，拍了照，打了卡，回来继续填格子。海很蓝，可你心里那个被划掉的句子，还是没被听见。',
      },
      {
        id: 'istj_rule_b',
        label: '请假一个月，什么都不"该"',
        description: '去看海、发呆、问自己。第一次让"应该"闭嘴，听听"想要"说了什么。',
        hint: '自我觉察+12，压力-5，幸福+9，健康+4，存款-12000',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress - 5, 0, 100);
          s.happiness = clamp(s.happiness + 9, 0, 100);
          s.health = clamp(s.health + 4, 0, 100);
        },
        skillGains: { selfAwareness: 12 },
        savingsChange: -12000,
        log: '你在海边坐了一整个下午，什么都没干。回程的火车上你哭了——不是难过，是这二十五年，你第一次允许自己"什么都不该"。',
      },
      {
        id: 'istj_rule_c',
        label: '"等退休再说吧"，把日记锁回抽屉',
        description: '现在不是时候。责任还没尽完，"想"这种事，得排到所有"该"的后面。',
        hint: '信念-7，幸福-5，压力+4',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 7, 0, 100);
          s.happiness = clamp(s.happiness - 5, 0, 100);
        },
        log: '日记锁回去了，那个二十岁的你也被锁回去了。你继续填格子，只是从那天起，每个格子里都渗着一点海水的咸味。',
      },
    ],
  },

  // ----------------------------------------------------------
  // ISFJ · 守卫者 · 无声的牺牲
  // ----------------------------------------------------------
  {
    id: 'mbti_isfj_early_invisible',
    title: '看不见的付出',
    narrative:
      '你记得每个人咖啡加几块糖、记得领导的忌口、记得同事孩子的生日、记得家里每一件该修的东西。你把自己缩到最小，好让所有人都有空间。\n' +
      '那天你累病了请了半天假，回来发现：没人记得你不在的那半天，家里乱成一团，所有人都在问"我的东西你放哪了"。没有一个人问过你"好点了吗"。\n' +
      '你的付出是无声的，所以也是无形的。你用牺牲证明自己的价值，最后发现——没人把你的牺牲当回事，因为根本没人看见。',
    pathId: 'ai_symbiote',
    crossPath: true,
    mbtiExclusive: 'ISFJ',
    ageRange: [25, 33],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    options: [
      {
        id: 'isfj_invis_a',
        label: '病好了加倍付出，"用更多牺牲让他们看见我"',
        description: '既然无声没人听见，那就用更大的声响——更累、更拼、更把自己搭进去。也许牺牲到极致，总会被看见。',
        hint: '共情+8，韧性+4，压力+8，健康-5，幸福-5',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
          s.happiness = clamp(s.happiness - 5, 0, 100);
        },
        skillGains: { empathy: 8, resilience: 4 },
        log: '你把自己累到更狠，可换来的依然是"你怎么今天动作慢了"。原来牺牲从不会被看见，只会被习惯。',
      },
      {
        id: 'isfj_invis_b',
        label: '把你的付出说出来，"请你们也记得我"',
        description: '不再只做不说。你要让那些被你照顾的人知道，你也会累、也会病、也需要被记住。',
        hint: '自我觉察+8，共情+5，压力+5，幸福+7',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.happiness = clamp(s.happiness + 7, 0, 100);
        },
        skillGains: { selfAwareness: 8, empathy: 5 },
        log: '你红着脸说出了"我也累"。有人愣住，有人递了杯水。原来你不需要牺牲到极致才被看见，你只需要开口。',
      },
      {
        id: 'isfj_invis_c',
        label: '什么都不说，把怨气咽下去',
        description: '"说出来就显得我计较了。"你继续无声地付出，把委屈和药一起吞下去。',
        hint: '信念-6，压力+6，健康-4',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 6, 0, 100);
          s.health = clamp(s.health - 4, 0, 100);
        },
        log: '你咽下了所有委屈，脸上还是那个好脾气的你。只是胃开始痛了——医生说没病，你知道，那是咽下去的石头在作响。',
      },
    ],
  },
  {
    id: 'mbti_isfj_mid_resent',
    title: '咽下去的石头',
    narrative:
      '二十年了，你为他们做了一切，他们回报你的方式是——理所当然。你给父母养老、给伴侣兜底、给孩子铺路，自己病了硬扛，累了不说。\n' +
      '那天你听见伴侣对孩子说"你妈/你爸反正闲着也是闲着"。那一刻，你这些年咽下去的所有委屈，突然变成了一块石头，堵在喉咙里，吐不出来，咽不下去。\n' +
      '你用沉默积累怨气，用付出绑架关系——可你绑住的，到底是你爱的人，还是你自己？你忽然想问：如果有一天你不再付出，他们爱的，是你，还是你的"有用"？',
    pathId: 'ai_symbiote',
    crossPath: true,
    mbtiExclusive: 'ISFJ',
    ageRange: [38, 48],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    options: [
      {
        id: 'isfj_resent_a',
        label: '继续付出，但偷偷记账',
        description: '"总有一天让他们知道。"你把每一笔牺牲都刻在心里，等一个清算的时刻。怨气成了你坚持下去的燃料。',
        hint: '共情+6，韧性+4，压力+9，幸福-6，信念-4',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 9, 0, 100);
          s.happiness = clamp(s.happiness - 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 4, 0, 100);
        },
        skillGains: { empathy: 6, resilience: 4 },
        log: '你边付出边记账，账本越来越厚，心越来越冷。那个清算的时刻永远不会来，因为爱一旦变成账，就再也还不清了。',
      },
      {
        id: 'isfj_resent_b',
        label: '把那块石头吐出来，认认真真吵一架',
        description: '哪怕关系裂开。你想知道，那个会发火、会索取、会喊"我也累"的你，是不是更值得被爱。',
        hint: '自我觉察+10，韧性+8，压力+8，幸福+6，健康+4',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.happiness = clamp(s.happiness + 6, 0, 100);
          s.health = clamp(s.health + 4, 0, 100);
        },
        skillGains: { selfAwareness: 10, resilience: 8 },
        log: '你第一次把二十年的委屈吼了出来。吵完家里很安静，可你的喉咙松了——那块石头，终于被你吐出来了。',
      },
      {
        id: 'isfj_resent_c',
        label: '继续咽下去，"一家人何必撕破脸"',
        description: '然后去厨房默默哭。哭完擦干手，继续做饭。明天又是付出的一天。',
        hint: '信念-8，健康-6，压力+8，幸福-5',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 8, 0, 100);
          s.health = clamp(s.health - 6, 0, 100);
          s.happiness = clamp(s.happiness - 5, 0, 100);
        },
        log: '你在厨房哭了一场，把眼泪和菜一起炒了。没人尝出咸味，你也没指望有人尝出来——你只是越来越像一件，用旧了的家具。',
      },
    ],
  },

  // ----------------------------------------------------------
  // ESTJ · 总经理 · 秩序即暴力
  // ----------------------------------------------------------
  {
    id: 'mbti_estj_early_optimize',
    title: '优化掉的那个人',
    narrative:
      '你把整个部门重组成了一条高效流水线：流程、SOP、KPI，每个人都在该在的位置上。效率涨了 50%，你很满意。\n' +
      '直到那个被你"优化"掉岗位的老员工，红着眼来找你："我在这个岗位二十年，你用一张表就把我的全部抹掉了。"你看着他，心里只有一个念头：他的情绪不在这张表的任何一格里。\n' +
      '你赢了效率，输掉了那些无法被量化的东西。你把效率当道德，把秩序当正义，可你忘了——人是目的，不是手段。',
    pathId: 'ai_symbiote',
    crossPath: true,
    mbtiExclusive: 'ESTJ',
    ageRange: [25, 33],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    options: [
      {
        id: 'estj_opt_a',
        label: '按表办事，"流程是对的，难过是他自己的事"',
        description: '表不会错，错的是不适应表的人。你把那双红的眼睛归类为"情绪化"，然后继续推进下一个优化项。',
        hint: '领导力+8，韧性+4，压力+5，幸福-6，存款+4000',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.happiness = clamp(s.happiness - 6, 0, 100);
        },
        skillGains: { leadership: 8, resilience: 4 },
        savingsChange: 4000,
        log: '部门更高效了，那双红眼再没出现过。只是在某个加班的夜里，你忽然想不起自己有没有，被人红着眼看过。',
      },
      {
        id: 'estj_opt_b',
        label: '破例给他留一个过渡岗',
        description: '哪怕拖累效率。"这次，人比表重要。"你第一次让一张完美的表，为一个不完美的人让了步。',
        hint: '共情+8，领导力+5，压力+6，幸福+5，存款-2000',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        skillGains: { empathy: 8, leadership: 5 },
        savingsChange: -2000,
        log: '你在表里加了一行"人情"。效率降了 2%，可那老员工第二天带着自家腌菜来了——你第一次觉得，有些东西比 KPI 更值得算。',
      },
      {
        id: 'estj_opt_c',
        label: '让他走，但多发一个月工资"意思一下"',
        description: '既不破坏流程，也给个体面。用钱买一个心安，这是效率最高的安抚。',
        hint: '领导力+3，信念-5，存款-3000',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
        },
        skillGains: { leadership: 3 },
        savingsChange: -3000,
        log: '那笔钱让他走得体面，却没让你睡得安稳。你用钱买断了愧疚，可愧疚只是换了个地方，住进了你的效率表里。',
      },
    ],
  },
  {
    id: 'mbti_estj_mid_machine',
    title: '系统在跑，人在哪',
    narrative:
      '四十二岁，你设计的管理系统已经能脱离你自动运转——下属按 SOP 行事，KPI 自动生成，连你的位置都被流程"优化"得可有可无。\n' +
      '你赢了：一切都井井有条。可那天你坐在自己搭的系统中央，忽然觉得活着的不是你，是你的系统。你用效率丈量了一切，最后把"你自己"也丈量没了。\n' +
      '你问自己：当一切都优化到极致，那个"多余的你"，是不是也该被优化掉？秩序把你送上了山顶，也把你锁在了山顶。',
    pathId: 'ai_symbiote',
    crossPath: true,
    mbtiExclusive: 'ESTJ',
    ageRange: [38, 48],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    options: [
      {
        id: 'estj_mach_a',
        label: '给自己设计一张"人生 KPI 表"',
        description: '连活着都要量化。健康、家庭、快乐，全部变成可追踪的指标——这样你就又有事可管了。',
        hint: '领导力+10，压力+9，信念+5，幸福-7，存款+10000',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 9, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.happiness = clamp(s.happiness - 7, 0, 100);
        },
        skillGains: { leadership: 10 },
        savingsChange: 10000,
        log: '你把人生也变成了表格。每一格都填得很满，只是填到最后，你发现"自己"这一栏，永远填不上数字。',
      },
      {
        id: 'estj_mach_b',
        label: '亲手拆掉一部分 SOP，留出"无法量化"的空白',
        description: '给自己留一片表管不到的地方。在那里你不必高效，不必正确，不必是那个"总经理"。',
        hint: '自我觉察+10，共情+6，压力+5，幸福+8，存款-8000',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
        },
        skillGains: { selfAwareness: 10, empathy: 6 },
        savingsChange: -8000,
        log: '你删掉了三行 SOP，留下一段空白。下属很慌，你却松了口气——原来"无用"也是一种效率，是留给"人"的效率。',
      },
      {
        id: 'estj_mach_c',
        label: '再加一层"自我管理"流程',
        description: '"只要更高效就不会空虚。"你用更精密的秩序，去填那个秩序本身挖出来的洞。',
        hint: '信念-7，幸福-5，压力+7',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 7, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 7, 0, 100);
          s.happiness = clamp(s.happiness - 5, 0, 100);
        },
        log: '你给空虚也排了优先级。表越来越满，洞越来越深——你终于把自己，优化成了一个最完美的空壳。',
      },
    ],
  },

  // ----------------------------------------------------------
  // ESFJ · 执政官 · 归属的代价
  // ----------------------------------------------------------
  {
    id: 'mbti_esfj_early_center',
    title: '中心的孤岛',
    narrative:
      '你是所有聚会的发起人、所有矛盾的调停者、所有人情的记账员。你的通讯录有一千个名字，你的日历排满了别人的生日。\n' +
      '那天你失恋了，想找个人哭一场。你发现一个奇怪的事实：所有人都"认识"你，没有一个人"了解"你。他们需要的是那个热情的、周到的、永远在场的"中心"，不是会哭的你。\n' +
      '你用关系编织了一张网，把自己也困在了最中间——而中心，恰恰是最孤独的位置。被需要，原来和被爱，是两回事。',
    pathId: 'ai_symbiote',
    crossPath: true,
    mbtiExclusive: 'ESFJ',
    ageRange: [25, 33],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    options: [
      {
        id: 'esfj_center_a',
        label: '把失恋藏起来，照常张罗下一场聚会',
        description: '"中心不能塌。"你的角色是发光，不是流泪。你把眼泪收好，换上笑脸，继续当所有人的太阳。',
        hint: '共情+6，领导力+5，压力+8，幸福-6',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.happiness = clamp(s.happiness - 6, 0, 100);
        },
        skillGains: { empathy: 6, leadership: 5 },
        log: '聚会很成功，所有人都夸你"状态真好"。只有你知道，散场后那杯没喝完的酒里，泡着你一整晚没敢掉的眼泪。',
      },
      {
        id: 'esfj_center_b',
        label: '取消这周的聚会，告诉最熟的朋友"我不想撑了"',
        description: '让那个"中心"歇一天。你想知道，不发光的你，还算不算你。',
        hint: '自我觉察+8，共情+5，压力+5，幸福+7',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.happiness = clamp(s.happiness + 7, 0, 100);
        },
        skillGains: { selfAwareness: 8, empathy: 5 },
        log: '朋友来你家，没说话，只是陪你坐了一晚。原来不发光也有人愿意留下——你第一次相信，被爱和被需要，真的不一样。',
      },
      {
        id: 'esfj_center_c',
        label: '把难过发成朋友圈，等点赞安慰',
        description: '"被关注就够了。"让人看见你的难过，但不必真的让人走进来。',
        hint: '信念-5，压力+5，幸福-3',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
          s.happiness = clamp(s.happiness - 3, 0, 100);
        },
        log: '朋友圈收到 99 个赞和一堆拥抱表情。你笑着删掉了那条动态——热闹是真的，没一个走进你心里，也是真的。',
      },
    ],
  },
  {
    id: 'mbti_esfj_mid_unneeded',
    title: '不再被需要的那天',
    narrative:
      '四十五岁，孩子大了不需要你张罗，伴侣独立了不需要你照顾，朋友们都有了各自的圈子。你那张精心编织的关系网，一夜之间松了。\n' +
      '你忽然不知道自己是谁了。你这辈子的身份，都是"谁的谁"——谁的妈妈、谁的妻子、谁的靠山。当这些"谁"都不再需要你，剩下的那个空壳，叫什么名字？\n' +
      '你用归属感逃避独立，用被需要逃避自我。如今没人需要了，你才发现：你从来没有真正认识过，那个不被任何人需要的自己。',
    pathId: 'ai_symbiote',
    crossPath: true,
    mbtiExclusive: 'ESFJ',
    ageRange: [38, 48],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'breakthrough',
    options: [
      {
        id: 'esfj_unne_a',
        label: '赶紧去找新的"被需要"',
        description: '去社区当志愿者、给邻居帮忙。只要还有人需要你，你就还在。空？那是没找对位置。',
        hint: '共情+8，领导力+5，压力+7，信念+4，存款-3000',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 7, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        skillGains: { empathy: 8, leadership: 5 },
        savingsChange: -3000,
        log: '你又成了社区的中心，又有人需要你了。可深夜回家，那个空壳还在原地等你——它不会被任何"被需要"填满。',
      },
      {
        id: 'esfj_unne_b',
        label: '第一次学着独处，问自己"没有任何角色，我是什么"',
        description: '不张罗，不调停，不记账。就一个人，面对那个被你藏了半生的"自己"。',
        hint: '自我觉察+12，韧性+6，压力+7，幸福+8，存款-5000',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 7, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
        },
        skillGains: { selfAwareness: 12, resilience: 6 },
        savingsChange: -5000,
        log: '独处的第一天你慌得想给所有人打电话。到了第七天，你忽然发现——那个不被任何人需要的你，原来也挺可爱的。',
      },
      {
        id: 'esfj_unne_c',
        label: '疯狂联系旧友，"只要还能被需要，我就还在"',
        description: '把松了的网重新织紧。哪怕网里的人已经不需要你，你也要假装他们还需要。',
        hint: '信念-8，幸福-5，压力+6',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 8, 0, 100);
          s.happiness = clamp(s.happiness - 5, 0, 100);
        },
        log: '你打了三十个电话，约出了三个人。饭桌上你努力活跃气氛，可大家都心不在焉。你终于明白：网织得再紧，也网不住一颗已经离开的心。',
      },
    ],
  },

  // ============================================================
  // SP 艺术者 — 当下与未来的博弈
  // ============================================================

  // ----------------------------------------------------------
  // ISTP · 鉴赏家 · 行动即真理
  // ----------------------------------------------------------
  {
    id: 'mbti_istp_early_hands',
    title: '修不好的人',
    narrative:
      '单位那台谁都搞不定的机器，你二十分钟就让它重新转起来。你不在乎说明书，只信手感——手摸到的地方，就是真相。\n' +
      '可那天伴侣红着眼跟你说"我觉得你根本不在乎我"，你伸出手，却不知道该拧哪颗螺丝。你能修好任何机器，修不好任何一段关系。\n' +
      '你的冷静让你在危机里游刃有余，也让你在亲密关系里寸步难行。当手停下来的时候，你面对的不是机器，是一个会痛的人——而你的手，只会修不会抱。',
    pathId: 'ai_symbiote',
    crossPath: true,
    mbtiExclusive: 'ISTP',
    ageRange: [25, 33],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    options: [
      {
        id: 'istp_hands_a',
        label: '"帮她修好生活中所有坏掉的东西"',
        description: '用行动代替回应。你说不出"我在乎"，但你能把她家的水管、灯泡、门锁全都修好——行动就是你的爱。',
        hint: '韧性+6，适应力+4，压力+5，幸福-5，信念+3',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.happiness = clamp(s.happiness - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        skillGains: { resilience: 6, adaptability: 4 },
        log: '她家的一切都好用了，可她还是红着眼。你终于明白：有些东西坏掉的，不是机器，是你不敢伸出去抱她的那双手。',
      },
      {
        id: 'istp_hands_b',
        label: '放下工具，笨拙地说一句"我不知道怎么说，但我在"',
        description: '不修，不解决，就待着。你试试，用语言和沉默，能不能也算一种"在场"。',
        hint: '共情+8，自我觉察+6，压力+6，幸福+7',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.happiness = clamp(s.happiness + 7, 0, 100);
        },
        skillGains: { empathy: 8, selfAwareness: 6 },
        log: '你干巴巴地说了那句话，自己都觉得别扭。可她忽然靠了过来——原来人不需要被修好，人只需要被抱着。',
      },
      {
        id: 'istp_hands_c',
        label: '借口"我去车库忙会"，躲进机械世界',
        description: '车库比客厅安全。机器不会哭着问你"你爱不爱我"，螺丝拧紧了就是拧紧了。',
        hint: '信念-5，压力+5，幸福-4',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
          s.happiness = clamp(s.happiness - 4, 0, 100);
        },
        log: '你在车库里修到深夜，把一台本没坏的发动机拆了又装。客厅的灯早早灭了——她不等你了，你也学会了不等自己。',
      },
    ],
  },
  {
    id: 'mbti_istp_mid_stillness',
    title: '手停下来的那一刻',
    narrative:
      '四十二岁，你受了伤，三个月不能动手。那三个月，你第一次必须"待着"——没有机器可修，没有危机可解，只有你自己。\n' +
      '你发现自己根本不知道"不做事的我是谁"。你不信语言，只信手感，可现在手被绑住了，你只剩语言，而你的语言贫瘠得吓人。\n' +
      '当手停下来的时候，你是谁？这个问题像一把没把手的扳手，你握不住，也拧不动。你第一次怀疑：你是在用行动感知世界，还是在用行动，逃避认识自己？',
    pathId: 'ai_symbiote',
    crossPath: true,
    mbtiExclusive: 'ISTP',
    ageRange: [38, 48],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'breakthrough',
    options: [
      {
        id: 'istp_still_a',
        label: '伤没好就偷偷动手',
        description: '"我必须做点什么，不然我就不存在。"你绑着绷带也要摸到工具，动作是你存在的证据。',
        hint: '韧性+8，适应力+4，压力+8，健康-6，信念+4',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.health = clamp(s.health - 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        skillGains: { resilience: 8, adaptability: 4 },
        log: '你忍着痛把活干完了，伤口裂开两次。可那只手一停，那种"我不存在"的恐惧又回来了——你用痛，证明自己还活着。',
      },
      {
        id: 'istp_still_b',
        label: '利用这三个月，学着用语言和思考面对自己',
        description: '"手停了，脑该动了。"你第一次试着把那些只会用手表达的东西，翻译成字。',
        hint: '自我觉察+12，共情+6，压力+6，幸福+7，健康+3',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.happiness = clamp(s.happiness + 7, 0, 100);
          s.health = clamp(s.health + 3, 0, 100);
        },
        skillGains: { selfAwareness: 12, empathy: 6 },
        log: '你写了一本很烂的日记，全是拧螺丝的比喻。可写到第三十天，你忽然写下一句"我害怕停下来"——那是你这辈子，第一次用手之外的方式，碰了碰自己。',
      },
      {
        id: 'istp_still_c',
        label: '靠止痛药和短视频熬过这三个月',
        description: '"等手好了再说。"用麻木填满这段不能动手的空白，让时间快点过去。',
        hint: '信念-7，健康-5，幸福-5，压力+5',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 7, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
          s.happiness = clamp(s.happiness - 5, 0, 100);
        },
        log: '三个月你刷秃了两块手机电池。手好了，你立刻冲进车库——可那个"手停下来你是谁"的问题，被你连同止痛药一起，咽回了肚子里。',
      },
    ],
  },

  // ----------------------------------------------------------
  // ISFP · 探险家 · 美与无用
  // ----------------------------------------------------------
  {
    id: 'mbti_isfp_early_color',
    title: '没人看见的颜色',
    narrative:
      '你花了一个月，把那个枯燥的报告做成了你心里那幅画的样子——配色、留白、节奏，每一个细节都是你对"美"的信仰。你递上去，领导三秒翻完："花里胡哨，数据呢？"\n' +
      '你活在一个别人看不见的色彩世界里，你的美无人欣赏，你的痛无人理解。你选择了沉默——因为你知道，解释一个别人天生看不见的颜色，只会让自己更孤独。\n' +
      '可沉默不是答案。在一个只看结果的世界里，你的敏感，到底是天赋，还是一种没人付费的残疾？',
    pathId: 'ai_symbiote',
    crossPath: true,
    mbtiExclusive: 'ISFP',
    ageRange: [25, 33],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    options: [
      {
        id: 'isfp_color_a',
        label: '继续按自己的审美做',
        description: '"哪怕没人懂，美本身就是意义。"你的纯粹是你的信仰，哪怕这份信仰，让你一次次被打回来重做。',
        hint: '创造力+8，自我觉察+4，压力+5，幸福+4，存款-2000',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.happiness = clamp(s.happiness + 4, 0, 100);
        },
        skillGains: { creativity: 8, selfAwareness: 4 },
        savingsChange: -2000,
        log: '你又一次交上了那幅"画"，又一次被退回。可你摸着那份作品，心里是干净的——没人懂，至少你自己懂。',
      },
      {
        id: 'isfp_color_b',
        label: '学一套"让别人看见你美的语言"',
        description: '把审美翻译成对方能懂的价值。不是出卖美，是给美找一扇能被推开的门。',
        hint: '适应力+8，共情+5，压力+6，幸福+5，存款+3000',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        skillGains: { adaptability: 8, empathy: 5 },
        savingsChange: 3000,
        log: '你学会了在美里藏数据，在留白里放结论。领导这次多看了两眼——美没变，只是它终于有了一扇门。',
      },
      {
        id: 'isfp_color_c',
        label: '删了重做一份"难看但安全"的',
        description: '"算了，不值。"把那幅画收进抽屉，交一份灰扑扑的、不会被退回的东西。',
        hint: '信念-6，幸福-5，压力+4',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 6, 0, 100);
          s.happiness = clamp(s.happiness - 5, 0, 100);
        },
        log: '报告过了，领导夸你"终于上道了"。你笑了笑，回家把抽屉里那幅画又看了一眼——它还在，只是你越来越不敢拿出来。',
      },
    ],
  },
  {
    id: 'mbti_isfp_mid_survive',
    title: '美与面包',
    narrative:
      '四十岁，你的审美依然是你最珍贵的东西，也是你最"无用"的东西。一个能让你安心创作的机会摆在面前，代价是放弃一份安稳但窒息的工作——而你的积蓄只够撑半年。\n' +
      '你站在美术馆一幅画前，问自己：美值得用半生安稳去换吗？还是说，在一个只看结果的世界里，追求美本身就是一种不被原谅的奢侈？\n' +
      '你的敏感是天赋还是残疾，答案不取决于你，取决于你敢不敢为它付账。',
    pathId: 'ai_symbiote',
    crossPath: true,
    mbtiExclusive: 'ISFP',
    ageRange: [38, 48],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    options: [
      {
        id: 'isfp_surv_a',
        label: '辞职，去创作',
        description: '"宁可穷死，也不能让心里的颜色熄灭。"你把安稳扔了，换一段可能饿死、但会发光的日子。',
        hint: '创造力+12，自我觉察+6，压力+9，幸福+6，存款-20000',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 9, 0, 100);
          s.happiness = clamp(s.happiness + 6, 0, 100);
        },
        skillGains: { creativity: 12, selfAwareness: 6 },
        savingsChange: -20000,
        log: '你辞职那天阳光很好。前三个月你画了很多，第四个月开始为房租发愁——可你摸着那些画，知道自己这半年，比过去十年都活着。',
      },
      {
        id: 'isfp_surv_b',
        label: '留着工作，把创作变成副业',
        description: '"让面包养着美。"既不下赌，也不放弃。你用八小时换安稳，用剩下的时间养那点光。',
        hint: '适应力+10，韧性+6，压力+7，幸福+5，存款+8000',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 7, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        skillGains: { adaptability: 10, resilience: 6 },
        savingsChange: 8000,
        log: '你白天做着窒息的工作，夜里偷偷画你的画。很累，可你的颜色没熄——它只是躲进了夜里，等着有一天能见光。',
      },
      {
        id: 'isfp_surv_c',
        label: '放弃创作机会，把画笔收进柜子最深处',
        description: '"美不能当饭吃。"你告诉自己这是成熟，然后把那个机会让给了别人。',
        hint: '信念-9，幸福-7，压力+6，健康-3',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 9, 0, 100);
          s.happiness = clamp(s.happiness - 7, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
        },
        log: '你把画笔收进了柜子最深处，告诉自己"以后再说"。从那天起，你看什么都是灰的——不是世界褪了色，是你亲手关掉了那双能看见颜色的眼睛。',
      },
    ],
  },

  // ----------------------------------------------------------
  // ESTP · 企业家 · 此刻即永恒
  // ----------------------------------------------------------
  {
    id: 'mbti_estp_early_thrill',
    title: '赢了一切，空了',
    narrative:
      '你抓住了一个所有人都说"太快了"的机会，三天搞定，赢了。那一刻肾上腺素灌满全身，你觉得自己是世界的主宰。\n' +
      '可庆祝的酒还没醒，那种"活着"的感觉就开始褪色了。你赢了当下，却发现当下已经过去——下一个刺激在哪？你不知道，你只知道没有刺激的时候，你浑身发痒。\n' +
      '你的胆识让你抓住了每一个机会，也让你离不开"抓住"本身。此刻即永恒——可当此刻一个接一个流逝，你回头看，手里竟然什么都没留下。',
    pathId: 'ai_symbiote',
    crossPath: true,
    mbtiExclusive: 'ESTP',
    ageRange: [25, 33],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    options: [
      {
        id: 'estp_thrill_a',
        label: '立刻去找下一个更大的刺激',
        description: '"动起来就不会空虚。"你把那个刚刚赢来的成果丢在脑后，眼睛已经盯上了下一座山头。',
        hint: '适应力+8，韧性+4，压力+5，信念+3，存款+3000',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        skillGains: { adaptability: 8, resilience: 4 },
        savingsChange: 3000,
        log: '你又赢了一次，爽了三秒。然后那种痒又回来了，比上次更凶——你开始怀疑，自己抓的不是机会，是止痒药。',
      },
      {
        id: 'estp_thrill_b',
        label: '停一个月，什么都不"抓"',
        description: '学着和无聊共处。"也许无聊里有东西。"你生平第一次，主动让手空着。',
        hint: '自我觉察+10，韧性+6，压力+7，幸福+5，存款-2000',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 7, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        skillGains: { selfAwareness: 10, resilience: 6 },
        savingsChange: -2000,
        log: '停下来的第一周你差点发疯。到了第三周，你忽然在一个无所事事的下午睡着了——那是你很多年来，睡得最踏实的一觉。',
      },
      {
        id: 'estp_thrill_c',
        label: '用吃喝玩乐把空虚填满',
        description: '"反正当下快乐就够了。"用更密集的刺激，盖住那种说不清的空。',
        hint: '信念-6，健康-4，压力+4，幸福-3',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 6, 0, 100);
          s.health = clamp(s.health - 4, 0, 100);
          s.happiness = clamp(s.happiness - 3, 0, 100);
        },
        log: '你把自己灌满酒精和热闹，每一晚都很嗨。只是每一个宿醉的早晨，那种空都比昨天大一点——刺激治不好痒，只会让痒变成痛。',
      },
    ],
  },
  {
    id: 'mbti_estp_mid_waited',
    title: '等不起的东西',
    narrative:
      '四十岁，你回头看自己的战绩：抓住的机会一个比一个漂亮。可你忽然发现，那些真正珍贵的东西——一段需要慢慢长出来的感情、一个需要十年磨一剑的手艺、一个需要等待的承诺——你一个都没有。\n' +
      '不是你抓不到，是它们都"太慢了"，你等不起。你的胆识让你赢了当下，也让你输掉了所有需要时间的东西。\n' +
      '此刻即永恒——可当无数个此刻堆成半生，你发现自己赢了一切瞬间，却输掉了一整段人生。你想等一次了，却不知道，还等不等得起。',
    pathId: 'ai_symbiote',
    crossPath: true,
    mbtiExclusive: 'ESTP',
    ageRange: [38, 48],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    options: [
      {
        id: 'estp_waited_a',
        label: '再赌一把大的，"用更大的赢盖过这种空"',
        description: '熟悉的解药。你把那种"输掉了时间"的慌，翻译成"该去赢下一个了"的兴奋。',
        hint: '适应力+10，韧性+5，压力+9，信念+4，存款-10000',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 9, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        skillGains: { adaptability: 10, resilience: 5 },
        savingsChange: -10000,
        log: '你又赌了一把，这次输了。可比起输钱，你更怕那种"停下来想想"的安静——安静里全是你等不起的东西。',
      },
      {
        id: 'estp_waited_b',
        label: '挑一件需要十年才能成的事，今天开始',
        description: '"这次我学等。"你生平第一次，选一件快不了的事，押上你最容易跑掉的那样东西——耐心。',
        hint: '自我觉察+12，韧性+8，压力+7，幸福+8，存款+5000',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 7, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
        },
        skillGains: { selfAwareness: 12, resilience: 8 },
        savingsChange: 5000,
        log: '你开始了一件十年才能成的事，第一天就想放弃。可你忍住了——原来"等"也是一种抓，只是这次你抓的，是时间本身。',
      },
      {
        id: 'estp_waited_c',
        label: '"我这人就这样，改不了"',
        description: '继续追下一个刺激。把"等不起"包装成"不需要等"，然后头也不回地跑下去。',
        hint: '信念-8，幸福-6，压力+6',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 8, 0, 100);
          s.happiness = clamp(s.happiness - 6, 0, 100);
        },
        log: '你跑得更快了，快到听不见身后那些需要被等的东西在掉落。你以为自己在追，其实你一直在逃。',
      },
    ],
  },

  // ----------------------------------------------------------
  // ESFP · 表演者 · 欢笑的背面
  // ----------------------------------------------------------
  {
    id: 'mbti_esfp_early_mask',
    title: '派对之后',
    narrative:
      '你是那场派对的灵魂——你让陌生人变成朋友，让沉默变成大笑，让所有人记得"那晚真开心"。你天生就会创造快乐。\n' +
      '可派对散场，你回到家，关上门，笑容像被人按了暂停键一样垮下来。你坐在没开灯的客厅里，第一次承认：你的快乐是给别人看的，不是给自己活的。\n' +
      '你是所有人的光，可没人相信快乐的人也会痛。你用欢笑掩盖痛苦，用热闹掩盖孤独——久而久之，你都快分不清，哪个笑容是真的你了。',
    pathId: 'ai_symbiote',
    crossPath: true,
    mbtiExclusive: 'ESFP',
    ageRange: [25, 33],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    options: [
      {
        id: 'esfp_mask_a',
        label: '明天的派对更用力地笑',
        description: '"只要还在笑，我就没事。"你用更大的音量，盖过那间没开灯的客厅。',
        hint: '共情+6，适应力+5，压力+7，幸福-5，健康-3',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 7, 0, 100);
          s.happiness = clamp(s.happiness - 5, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
        },
        skillGains: { empathy: 6, adaptability: 5 },
        log: '明晚你笑得比谁都大声。没人发现你的笑里多了分用力——包括你自己，直到回到家，那盏没开的灯又亮在你眼里。',
      },
      {
        id: 'esfp_mask_b',
        label: '今晚别演了，给一个信任的人发句"其实我最近不太好"',
        description: '让那盏没开的灯，被另一个人看见。你试试，不笑的你，是不是也值得被喜欢。',
        hint: '自我觉察+8，共情+5，压力+5，幸福+7',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.happiness = clamp(s.happiness + 7, 0, 100);
        },
        skillGains: { selfAwareness: 8, empathy: 5 },
        log: '你颤抖着发了那条消息。对方回："你怎么不早说，我现在过来。"你哭了——原来不笑的你，也有人愿意看。',
      },
      {
        id: 'esfp_mask_c',
        label: '再刷个搞笑视频把自己逗笑',
        description: '"笑出来就好了。"用更廉价的快乐，修补那个刚裂开的口子。',
        hint: '信念-5，压力+5，幸福-4',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
          s.happiness = clamp(s.happiness - 4, 0, 100);
        },
        log: '你被视频逗笑了，笑完却更空。你把手机扣在胸口，在那间没开灯的客厅里，第一次觉得"快乐"是个很累的词。',
      },
    ],
  },
  {
    id: 'mbti_esfp_mid_crack',
    title: '笑不出来的那天',
    narrative:
      '四十三岁，你照常准备上台活跃气氛，可你发现自己这一次，怎么都笑不出来了。那块撑了你半生的"快乐面具"，忽然裂开了一道缝。\n' +
      '底下的人还在等你抖包袱，你的嘴却像被缝住了。你这才看清：你的活力让所有人快乐，可快乐是最孤独的情绪——因为没人相信快乐的人也会痛，所以没人问过你痛不痛。\n' +
      '面具戴了太久，长进了肉里。今天它裂了，你不知道露出来的，是真正的你，还是一个再也笑不出来的空壳。',
    pathId: 'ai_symbiote',
    crossPath: true,
    mbtiExclusive: 'ESFP',
    ageRange: [38, 48],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'breakthrough',
    options: [
      {
        id: 'esfp_crack_a',
        label: '硬把笑容挤出来',
        description: '"大家是来看我笑的，我不能让他们失望。"你把那道裂缝用更大的笑糊住，哪怕嘴角在抖。',
        hint: '共情+8，适应力+5，压力+10，健康-6，幸福-7',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.health = clamp(s.health - 6, 0, 100);
          s.happiness = clamp(s.happiness - 7, 0, 100);
        },
        skillGains: { empathy: 8, adaptability: 5 },
        log: '你硬挤出了那个笑，全场掌声雷动。下了台你躲进洗手间干呕——面具没修好，只是连裂缝一起，笑给了所有人看。',
      },
      {
        id: 'esfp_crack_b',
        label: '第一次在所有人面前承认"我今天笑不出来"',
        description: '让裂缝见见光。你想知道，那个不笑、会痛、真实的你，会不会也有人愿意鼓掌。',
        hint: '自我觉察+12，共情+8，压力+6，幸福+8，健康+3',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.health = clamp(s.health + 3, 0, 100);
        },
        skillGains: { selfAwareness: 12, empathy: 8 },
        log: '你说完那句话，全场安静了两秒——然后有人站起来说"我也是"。那晚你没笑，可那是我这辈子，最不孤独的一个晚上。',
      },
      {
        id: 'esfp_crack_c',
        label: '找借口溜走，"今天状态不好，改天再补上"',
        description: '把裂缝藏回去。等明天，等下一次，等那个"状态好"的自己回来。',
        hint: '信念-8，幸福-6，压力+6，健康-4',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 8, 0, 100);
          s.happiness = clamp(s.happiness - 6, 0, 100);
          s.health = clamp(s.health - 4, 0, 100);
        },
        log: '你溜走了，把舞台让给了别人。回家路上你摸了摸脸——那道裂缝还在，而且每一次藏，它都往肉里又深了一分。',
      },
    ],
  },
];

registerNarrativeEvents(MBTI_NARRATIVE_EVENTS);
