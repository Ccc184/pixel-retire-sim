/**
 * 超级IP路径 · 完整叙事事件库
 *
 * 三条分支：
 *   ip_educator       — 知识付费线，做课程、付费社群，把你懂的东西变成可复制的价值
 *   ip_entertainer    — 泛娱乐线，追爆款、接商单、博眼球，用流量撬动商业价值
 *   ip_thought_leader — 思想领袖线，写书、做演讲、塑造观点，把名字变成思想资产
 *
 * 三个技能维度：
 *   contentSkill  内容创作能力（写作、剪辑、讲故事、选题）
 *   audienceSkill 受众运营能力（社群、互动、增长、数据分析）
 *   brandSkill    品牌价值（变现、商务、个人品牌溢价、定价权）
 *
 * 自定义状态字段：
 *   state.ipFollowers   粉丝数（初始500）
 *   state.ipReputation  声誉值 0-100（初始30）
 *
 * ================================================================
 * 效果应用约定：
 *   skillGains / savingsChange / salaryChange / passiveIncomeChange
 *   为声明式字段，由 store 统一应用到 state（pathSkills / currentSavings 等）。
 *   stateEffect 仅负责 stress / happiness / health / pathFaith 以及
 *   条件分支逻辑和自定义字段（ipFollowers / ipReputation），
 *   不重复修改上述声明式字段，以避免双重计算。
 * ================================================================
 */
import type { NarrativeEvent, NarrativeAchievement, GameState } from '../types/global.d.js';
import { registerNarrativeEvents } from './narrative-registry.js';
import { registerAchievements } from './narrative-achievements.js';
import { clamp } from '../utils/clamp.js';

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

/** 读取粉丝数 */
function getFollowers(s: GameState): number {
  return (s as any).ipFollowers ?? 0;
}

/** 增减粉丝数（不会为负） */
function addFollowers(s: GameState, n: number): void {
  (s as any).ipFollowers = Math.max(0, getFollowers(s) + n);
}

/** 读取声誉值 */
function getReputation(s: GameState): number {
  return (s as any).ipReputation ?? 0;
}

/** 增减声誉值（钳制在 0-100） */
function addReputation(s: GameState, n: number): void {
  (s as any).ipReputation = clamp(getReputation(s) + n, 0, 100);
}

// ============================================================
// 通用事件（ages 22-24，分支选择前）
// ============================================================

const commonEvents: NarrativeEvent[] = [

  // 22岁：第一条内容
  {
    id: 'ip_first_post',
    title: '第一条',
    sceneTag: 'home',
    pathId: 'super_ip',
    ageRange: [22, 22],
    priority: 7,
    weight: 10,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '入职第一个周末，你注册了一个内容账号。光标在标题栏里闪了半小时，你写了删、删了写。最后发出去的是一篇三百字的随笔，配了张随手拍的夕阳。\n' +
      '你每隔五分钟刷新一次。一小时后，点赞数停在3——其中两个是你用小号点的。第三个来自一个不认识的ID，头像是只猫。你盯着那个猫头看了很久，心跳得像第一次收到喜欢的人回复。\n' +
      '你想起室友说的"现在做内容太晚了，红利早没了"。但你隐隐觉得，晚不晚不重要，重要的是：你在这张桌子上下了注。从今天起，你不是在给别人打工，你是在给自己攒一个名字。',
    options: [
      {
        id: 'post_daily',
        label: '日更，用数量喂出网感',
        description: '不管有没有人看，每天雷打不动发一条',
        hint: '内容创作+10 · 受众运营+4 · 压力+6 · 健康-3 · 粉丝+200 · 声誉+2',
        hintColor: 'positive',
        skillGains: { contentSkill: 10, audienceSkill: 4 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          addFollowers(s, 200);
          addReputation(s, 2);
        },
        log: '22岁，你开始了日更。前三个月像对着空房间说话，但你咬牙没断。第98天，有一条突然被推上了热门，粉丝一夜涨了八百。你第一次尝到"被算法选中"的甜头。',
      },
      {
        id: 'study_top_creators',
        label: '拆解头部账号，研究方法论',
        description: '不急着发，先搞清楚"为什么有人能火"',
        hint: '内容创作+6 · 受众运营+8 · 信念+3 · 粉丝+80',
        hintColor: 'neutral',
        skillGains: { contentSkill: 6, audienceSkill: 8 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
          addFollowers(s, 80);
        },
        log: '22岁，你没急着发内容，而是把同领域前50个账号的视频逐帧拆解。你建了一张Excel，记下每个爆款的开头钩子、节奏、结尾。三个月后你心里有了一套方法论——发出去的第一条，数据比90%的新人都好。',
      },
      {
        id: 'authentic_voice',
        label: '只写真话，不追热点',
        description: '流量可以慢慢来，但真诚不能打折',
        hint: '内容创作+5 · 信念+6 · 幸福+4 · 粉丝+50 · 声誉+5',
        hintColor: 'neutral',
        skillGains: { contentSkill: 5 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.happiness = clamp(s.happiness + 4, 0, 100);
          addFollowers(s, 50);
          addReputation(s, 5);
        },
        log: '22岁，你做了一个决定：不蹭热点、不标题党、不卖人设。涨粉很慢，但每条评论都让你相信，留下来的都是真懂你的人。你把"真诚"当成护城河——虽然你还不知道，这条河以后也会淹死你。',
      },
    ],
  },

  // 23岁：找到自己的声音
  {
    id: 'ip_find_voice',
    title: '声纹',
    sceneTag: 'studio',
    pathId: 'super_ip',
    ageRange: [23, 23],
    priority: 6,
    weight: 9,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '你模仿过很多人——学过A的文案节奏、抄过B的镜头语言、试过C的犀利人设。但数据一直半死不活，你像一件谁都能穿、但谁都不愿买的衣服。\n' +
      '直到有一天，你剪了一条没经过任何"优化"的视频，素颜出镜，讲到一半卡壳了，你对着镜头说了句"我重说"。那条视频反而爆了。评论区最高赞是："终于有个不像在念稿的博主了。"\n' +
      '你盯着这条评论，突然明白一件事：你一直在找"什么内容能火"，却没问过"什么是只有你能做的"。你的卡壳、你的口头禅、你的不完美——这些才是算法抄不走的指纹。',
    options: [
      {
        id: 'own_style',
        label: '确立个人风格，只做"像你"的内容',
        description: '放弃模仿，把你的怪癖、口癖、视角变成标签',
        hint: '内容创作+12 · 品牌价值+6 · 信念+5 · 粉丝+600 · 声誉+4',
        hintColor: 'positive',
        skillGains: { contentSkill: 12, brandSkill: 6 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          addFollowers(s, 600);
          addReputation(s, 4);
        },
        log: '23岁，你删掉了那些"像别人"的草稿，开始只发"像你"的内容。涨粉速度慢了，但粉丝黏性高得离谱——有人把你每条视频的口头禅做成了表情包。你第一次有了"被认出来"的感觉。',
      },
      {
        id: 'niche_down',
        label: '切入一个极细分的领域，做头部',
        description: '与其在红海里当尾巴，不如在池塘里当王',
        hint: '受众运营+10 · 品牌价值+5 · 信念+4 · 粉丝+400 · 声誉+3',
        hintColor: 'positive',
        skillGains: { audienceSkill: 10, brandSkill: 5 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          addFollowers(s, 400);
          addReputation(s, 3);
        },
        log: '23岁，你从一个泛领域收缩到一个极窄的细分赛道。同行笑话你"把自己做小了"，但三个月后你成了那个赛道里绕不开的名字。你发现：小池塘里的王，比大海里的鱼先上岸。',
      },
      {
        id: 'collab_others',
        label: '找同量级博主互推，抱团涨粉',
        description: '一个人走得快，一群人走得远',
        hint: '受众运营+8 · 品牌价值+4 · 幸福+5 · 粉丝+500',
        hintColor: 'neutral',
        skillGains: { audienceSkill: 8, brandSkill: 4 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 5, 0, 100);
          addFollowers(s, 500);
        },
        log: '23岁，你和五个同量级博主组了个"互推联盟"。每个月互相客串一次，流量共享。你们戏称自己是"内容互助会"。一年后五个人都涨了粉，但你也发现：抱团的代价是，你必须永远配合别人的节奏。',
      },
    ],
  },

  // 23-24岁：早期增长与第一条广告
  {
    id: 'ip_early_growth',
    title: '第一笔钱',
    sceneTag: 'home',
    pathId: 'super_ip',
    ageRange: [23, 24],
    priority: 6,
    weight: 9,
    oncePerGame: true,
    eventType: 'normal',
    conditions: (s) => getFollowers(s) >= 500,
    narrative:
      '一个品牌方私信找上门："博主您好，看您的内容很垂直，想谈个合作。"你心脏漏跳一拍，装作很专业地回了一句"可以的，发下brief"。\n' +
      '对方报价3000块，要你发一条软植入。你盯着这个数字算了半天——这是你三天工资，但只需要拍一条视频。你又兴奋又不安：接了，会不会被粉丝骂"恰烂钱"？不接，下一个机会不知道什么时候来。\n' +
      '你翻遍了同行的接单记录，发现大家都在接，只是接得很"自然"。你第一次面对做内容的人迟早要面对的灵魂拷问：你的关注者，到底是"观众"，还是"资产"？',
    options: [
      {
        id: 'take_ad_carefully',
        label: '接，但严控比例和内容',
        description: '钱要赚，但绝不让广告破坏信任',
        hint: '品牌价值+8 · 存款+3000 · 粉丝+300 · 声誉+2 · 压力+3',
        hintColor: 'positive',
        skillGains: { brandSkill: 8 },
        savingsChange: 3000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 3, 0, 100);
          addFollowers(s, 300);
          addReputation(s, 2);
        },
        log: '23岁，你接了人生第一条广告。你把产品用了三天才写脚本，植入做得克制，粉丝甚至没察觉是广告。品牌方很满意，追加了第二条。你把"恰饭"做成了"信任变现"，但也开始失眠：这条线，你能守住多久？',
      },
      {
        id: 'refuse_pure',
        label: '拒绝，先攒口碑再说',
        description: '现在接广告太早，会伤粉丝基本盘',
        hint: '内容创作+4 · 声誉+6 · 信念+5 · 粉丝+150',
        hintColor: 'neutral',
        skillGains: { contentSkill: 4 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          addReputation(s, 6);
          addFollowers(s, 150);
        },
        log: '23岁，你拒绝了那条广告。粉丝不知道你为他们挡掉了一次"恰饭"，但你的内容纯度保住了。半年后一个更大的品牌找上门，报价翻了三倍——因为"你不乱接广告"这件事，已经成了你的标签。',
      },
      {
        id: 'take_and_double_down',
        label: '接，而且多接几条冲数据',
        description: '趁有人找，赶紧把"商业价值"做出来',
        hint: '品牌价值+6 · 存款+6000 · 压力+5 · 声誉-3 · 粉丝+200',
        hintColor: 'negative',
        skillGains: { brandSkill: 6 },
        savingsChange: 6000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          addReputation(s, -3);
          addFollowers(s, 200);
        },
        log: '23岁，你一口气接了三条广告。钱到账时你很高兴，但评论区开始有人酸"是不是要转型带货号了"。你嘴上说不理，心里却咯噔一下。你赚到了第一桶金，但你也第一次发现：信任是消耗品。',
      },
    ],
  },

  // 24岁：内容苦力
  {
    id: 'ip_content_grind',
    title: '磨刀',
    sceneTag: 'home',
    pathId: 'super_ip',
    ageRange: [24, 24],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '凌晨两点，你还在剪视频。这是今天的第三版，前两版都被你自己否了。白天上班，晚上做内容，你已经连续两个月没在凌晨一点前睡过觉。\n' +
      '你看着播放量，这条又扑了。你想起上周那条精心做的数据一般，随手发的吐槽反而爆了。算法像个喜怒无常的暴君，你永远猜不透它今晚宠幸谁。\n' +
      '你打开备忘录，看到半年前写的"为什么做内容"——第一条是"自由"。你苦笑了一下：你现在比上班还不自由。但你不舍得停，因为你怕一停，就再也起不来了。',
    options: [
      {
        id: 'upgrade_production',
        label: '砸钱升级设备和学习剪辑',
        description: '内容质量是地基，磨刀不误砍柴工',
        hint: '内容创作+12 · 存款-4000 · 压力+4 · 粉丝+400 · 月薪+500',
        hintColor: 'positive',
        skillGains: { contentSkill: 12 },
        savingsChange: -4000,
        salaryChange: 500,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          addFollowers(s, 400);
        },
        log: '24岁，你花光了一个月工资买镜头、麦克风、灯光，又报了个剪辑课。成品质量肉眼可见地提升，开始有粉丝留言"你的画质在进步"。你发现：内容这行没有捷径，只有"做得更好"和"做得更久"。',
      },
      {
        id: 'batch_content',
        label: '建立内容流水线，批量生产',
        description: '不能靠灵感，要靠系统',
        hint: '受众运营+10 · 内容创作+5 · 压力-4 · 信念+3 · 粉丝+300',
        hintColor: 'positive',
        skillGains: { audienceSkill: 10, contentSkill: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
          addFollowers(s, 300);
        },
        log: '24岁，你把内容生产拆成了选题库、脚本模板、拍摄清单、剪辑SOP。周末一天拍五条，工作日只剪不发。你从一个"靠灵感"的创作者变成了一个"靠系统"的运营者。效率上来了，但你偶尔会怀念那种"突然有灵感"的兴奋。',
      },
      {
        id: 'take_break',
        label: '强制休息一周，充电再战',
        description: '人不是机器，弦绷太紧会断',
        hint: '压力-12 · 健康+8 · 幸福+6 · 内容创作+3 · 信念+2',
        hintColor: 'neutral',
        skillGains: { contentSkill: 3 },
        isRestOption: true,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 12, 0, 100);
          s.health = clamp(s.health + 8, 0, 100);
          s.happiness = clamp(s.happiness + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 2, 0, 100);
        },
        log: '24岁，你给自己放了一周假，关掉所有数据后台。前三天你焦虑得手痒，后四天你开始重新注意到窗外的云。回来后你拍了一条"我停更一周的感受"，反而成了那季度数据最好的一条。你明白：内容源于生活，而你已经很久没在生活了。',
      },
    ],
  },
];

// ============================================================
// 分支选择事件（age 25）
// ============================================================

const branchSelectEvent: NarrativeEvent[] = [

  {
    id: 'ip_branch_select',
    title: '你是谁',
    sceneTag: 'home',
    pathId: 'super_ip',
    ageRange: [25, 25],
    priority: 10,
    weight: 10,
    oncePerGame: true,
    eventType: 'branch_select',
    conditions: (s) => !s.narrativeBranch || s.narrativeBranch === 'unassigned',
    narrative:
      '三年了。你从一个对着空房间说话的新人，变成了一个有几千粉丝、接过几条广告、被人认出过两次的"小博主"。但"小博主"是个很尴尬的位置——大不到能养活自己，小不到能随时抽身。\n\n' +
      '25岁这年，你坐在出租屋里复盘。你发现做了三年内容，却还没想清楚一个根本问题：你到底要成为什么样的IP？\n\n' +
      '是教别人你会的东西，靠知识付费吃饭？是做大众喜闻乐见的内容，用流量换商业价值？还是沉下心做思想，让你的名字和某个观点绑在一起？三条路都能走通，但每一条都意味着放弃另外两条的某些可能。深夜，你在备忘录里写下三个词：教、乐、思。光标闪了很久，等你做一个不会反悔的决定。',
    options: [
      {
        id: 'choose_ip_educator',
        label: '做知识付费，把你懂的变成钱',
        description: '做课程、建社群、带学员。你赌的是：知识会贬值，但"教别人"这件事永远有需求。',
        hint: '内容创作+12 · 受众运营+8 · 信念+5 · 压力+3 · 切换至知识付费线',
        hintColor: 'positive',
        skillGains: { contentSkill: 12, audienceSkill: 8 },
        branchSwitch: 'ip_educator',
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '25岁，你选了"教"。你把过去三年踩过的坑整理成了一套方法论，准备做你的第一门付费课。你赌的是：在这个人人焦虑的时代，"让人变好"是一门永不过时的生意。',
      },
      {
        id: 'choose_ip_entertainer',
        label: '做泛娱乐，用流量撬动一切',
        description: '追热点、做爆款、接大单。你赌的是：注意力是这个时代最贵的资源，谁掌握了流量，谁就掌握了定价权。',
        hint: '受众运营+12 · 内容创作+8 · 信念+5 · 压力+5 · 切换至泛娱乐线',
        hintColor: 'positive',
        skillGains: { audienceSkill: 12, contentSkill: 8 },
        branchSwitch: 'ip_entertainer',
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '25岁，你选了"乐"。你把内容节奏调快，开始追热点、做剧情、博眼球。你赌的是：在这个信息过载的时代，谁能抓住眼球，谁就能把流量变成一切。',
      },
      {
        id: 'choose_ip_thought_leader',
        label: '做思想领袖，把名字变成观点',
        description: '写长文、出书、做演讲。你赌的是：流量会散，热点会过，但一个深刻的观点可以活很多年。',
        hint: '内容创作+12 · 品牌价值+8 · 信念+6 · 压力+4 · 切换至思想领袖线',
        hintColor: 'positive',
        skillGains: { contentSkill: 12, brandSkill: 8 },
        branchSwitch: 'ip_thought_leader',
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '25岁，你选了"思"。你停掉了那些追热点的短平快内容，开始写长文、做深度。粉丝增速腰斩，但留下的人开始认真和你讨论。你赌的是：在这个浅薄的时代，"深刻"是一种稀缺资产。',
      },
    ],
  },
];

// ============================================================
// 知识付费线事件 (ip_educator, ages 26-38)
// ============================================================

const educatorEvents: NarrativeEvent[] = [

  // 26岁：第一门付费课
  {
    id: 'ip_edu_first_course',
    title: '开课',
    sceneTag: 'home',
    pathId: 'super_ip',
    branch: 'ip_educator',
    ageRange: [26, 26],
    priority: 6,
    weight: 9,
    oncePerGame: true,
    narrative:
      '你纠结了三个月，终于上架了第一门付费课。定价199，20节，讲你这几年踩过的坑。上架前夜你失眠到四点，反复刷新后台——怕没人买，更怕有人买了骂"割韭菜"。\n' +
      '早上九点，第一单成交。你截图发给自己看。到中午，卖出47份。到月底，836份。你算了一下收入，手都在抖——这是你半年工资。\n' +
      '但开心只持续到第一条差评出现："内容太基础了，感觉不值。"你盯着这条评论看了一下午，开始怀疑：你卖的是知识，还是焦虑？',
    options: [
      {
        id: 'refine_course',
        label: '根据反馈大改课程，做到物超所值',
        description: '把每一条差评都当成免费的顾问',
        hint: '内容创作+12 · 受众运营+6 · 压力+8 · 声誉+6 · 存款-2000 · 被动收入+8000/年',
        hintColor: 'positive',
        skillGains: { contentSkill: 12, audienceSkill: 6 },
        savingsChange: -2000,
        passiveIncomeChange: 8000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          addReputation(s, 6);
        },
        log: '26岁，你把课程推倒重做了三遍。新增了答疑、作业批改、社群陪跑。差评率从8%降到了1%。有学员在结业时给你发了长长的小作文感谢。你第一次觉得，"知识付费"四个字没那么脏。',
      },
      {
        id: 'scale_marketing',
        label: '加大投放，冲销量',
        description: '内容够用了，先用钱换流量',
        hint: '品牌价值+10 · 受众运营+8 · 存款-6000 · 压力+5 · 声誉-2 · 被动收入+12000/年',
        hintColor: 'positive',
        skillGains: { brandSkill: 10, audienceSkill: 8 },
        savingsChange: -6000,
        passiveIncomeChange: 12000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          addReputation(s, -2);
        },
        log: '26岁，你把课程收入的四成砸进了信息流投放。销量翻了三倍，但退课率也上来了。你开始懂一个道理：投放能买来学员，买不来口碑。',
      },
      {
        id: 'free_taster',
        label: '先做免费内容引流，长线养信任',
        description: '不急着变现，先把漏斗顶端做大',
        hint: '内容创作+8 · 受众运营+10 · 信念+4 · 粉丝+1500 · 声誉+4',
        hintColor: 'neutral',
        skillGains: { contentSkill: 8, audienceSkill: 10 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          addFollowers(s, 1500);
          addReputation(s, 4);
        },
        log: '26岁，你把课程里最干的两节免费放了出来。一周播放破百万，粉丝涨了一波，课程销量跟着翻了倍。你发现：最好的广告，是你真金白银的干货。',
      },
    ],
  },

  // 28岁：学员成功故事
  {
    id: 'ip_edu_student_success',
    title: '回信',
    sceneTag: 'home',
    pathId: 'super_ip',
    branch: 'ip_educator',
    ageRange: [28, 28],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    narrative:
      '一封长长的私信躺在你的收件箱里。一个两年前的学员说，因为上了你的课转了行，现在年薪翻倍，刚付了首付。\n' +
      '"老师，谢谢你。如果不是那门课，我现在还在原来的岗位上熬。"结尾是一张他在新公司工牌前的自拍。\n' +
      '你看着这张照片，眼眶突然热了。这两年你被骂过"割韭菜"、被同行嘲讽"培训班讲师"、被算法折磨得想退场。但这一刻你觉得都值了。你第一次真切地感受到：知识真的能改变一个人的命运，而你是那个递梯子的人。',
    options: [
      {
        id: 'amplify_stories',
        label: '把学员案例做成内容，放大影响力',
        description: '用真实结果证明价值',
        hint: '品牌价值+10 · 受众运营+8 · 声誉+5 · 粉丝+1000 · 被动收入+6000/年',
        hintColor: 'positive',
        skillGains: { brandSkill: 10, audienceSkill: 8 },
        passiveIncomeChange: 6000,
        stateEffect: (s) => {
          addReputation(s, 5);
          addFollowers(s, 1000);
        },
        log: '28岁，你把学员的真实案例整理成了一个系列。每期讲一个人的转变，不卖课，只讲故事。结果这些"软广"比硬广还转化高。你明白：最好的招生简章，是别人替你写的人生。',
      },
      {
        id: 'mentor_deeply',
        label: '深度带几个种子学员，做口碑',
        description: '不追求规模，追求"带出来一个是一个"',
        hint: '内容创作+8 · 受众运营+6 · 幸福+8 · 声誉+6 · 信念+5',
        hintColor: 'positive',
        skillGains: { contentSkill: 8, audienceSkill: 6 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          addReputation(s, 6);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '28岁，你从上千学员里挑了十个种子，一对一深度陪跑。半年后这十个人里有三个做出了自己的成绩，逢人就夸你。你赚的钱没变多，但你的"江湖地位"变了——你成了"能带出人"的老师。',
      },
      {
        id: 'stay_humble',
        label: '低调处理，怕被说"消费学员"',
        description: '别人的成功是别人的，你不能拿来当勋章',
        hint: '内容创作+4 · 信念+4 · 幸福+5 · 声誉+3',
        hintColor: 'neutral',
        skillGains: { contentSkill: 4 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          addReputation(s, 3);
        },
        log: '28岁，你没把那条私信发出来。你回了长长的一封邮件恭喜他，然后默默把这件事记在了"继续做下去的理由"清单里。你不想消费学员的成功——但你也知道，这份克制，是另一种更长远的品牌。',
      },
    ],
  },

  // 30岁：课程平台变天
  {
    id: 'ip_edu_platform_change',
    title: '换天',
    sceneTag: 'home',
    pathId: 'super_ip',
    branch: 'ip_educator',
    ageRange: [30, 30],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你深耕了三年的那个课程平台，突然改了分成规则——从三七变成五五，还把"推荐位"改成了竞价。你的课程流量一夜之间腰斩。\n' +
      '你在创作者群里看到一片哀嚎。有人骂平台"过河拆桥"，有人连夜搬家去新平台，有人干脆转行。你打开后台，看着那条断崖式下跌的曲线，第一次真切地理解了一个词：寄人篱下。\n' +
      '你的命脉捏在别人手里。你的学员是平台的用户，不是你的；你的流量是平台的算法给的，不是你挣的。你这几年赚的钱，其实是平台"借"给你的。',
    options: [
      {
        id: 'build_own_platform',
        label: '自建私域，把学员攥在自己手里',
        description: '做小程序、做社群、做自有交付系统',
        hint: '品牌价值+12 · 受众运营+10 · 存款-15000 · 压力+10 · 声誉+3 · 被动收入+10000/年',
        hintColor: 'positive',
        skillGains: { brandSkill: 12, audienceSkill: 10 },
        savingsChange: -15000,
        passiveIncomeChange: 10000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          addReputation(s, 3);
        },
        log: '30岁，你花光了半年的利润，搭了自己的小程序和社群。第一年只有三成学员愿意跟你"搬家"，但留下来的都是死忠。两年后平台又改了两次规则，别人哀嚎时你很平静——因为你的命，终于在自己手里了。',
      },
      {
        id: 'multi_platform',
        label: '多平台分发，鸡蛋不放一个篮子',
        description: '同时铺五个平台，哪边政策好往哪边倾斜',
        hint: '受众运营+12 · 品牌价值+6 · 压力+6 · 粉丝+800 · 被动收入+4000/年',
        hintColor: 'positive',
        skillGains: { audienceSkill: 12, brandSkill: 6 },
        passiveIncomeChange: 4000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          addFollowers(s, 800);
        },
        log: '30岁，你成了"五线作战"的讲师，同一门课在五个平台同步卖。累是真累，但哪个平台抽风你都不慌。你发现：分散的代价是精力被切碎，收益是再也没人能一键掐死你。',
      },
      {
        id: 'pivot_to_community',
        label: '弱化课程，转向高客单社群',
        description: '课程是一次性买卖，社群是长期关系',
        hint: '受众运营+10 · 品牌价值+8 · 存款-5000 · 幸福+4 · 被动收入+8000/年 · 声誉+4',
        hintColor: 'positive',
        skillGains: { audienceSkill: 10, brandSkill: 8 },
        savingsChange: -5000,
        passiveIncomeChange: 8000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 4, 0, 100);
          addReputation(s, 4);
        },
        log: '30岁，你把重心从"卖课"转向了"经营社群"。年费社群定价是课程的五倍，人少但黏。你不再追新学员，而是让老学员续费、转介绍。利润没降，但你从"卖产品的人"变成了"养关系的人"。',
      },
    ],
  },

  // 31岁：冒名顶替综合征
  {
    id: 'ip_edu_imposter',
    title: '名不副实',
    sceneTag: 'home',
    pathId: 'super_ip',
    branch: 'ip_educator',
    ageRange: [31, 31],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '一个行业大佬在朋友圈转发了你的课程，配文"这个年轻人讲得很透彻"。你的私信瞬间爆了，报名数翻了五倍。\n' +
      '但那天晚上你失眠了。你反复看自己的课程目录，越看越心虚：这些内容，你真的"懂"吗？还是只是"会讲"？那个大佬夸你，是因为你讲得好，还是因为他没空细看？\n' +
      '你想起一句话：骗子最怕遇到较真的。你害怕自己就是个包装精美的骗子——一旦有人真的拿你的方法去用，用崩了，你的人设就塌了。冒名顶替的感觉像块冰，贴在你后背上，化不开。',
    options: [
      {
        id: 'deepen_expertise',
        label: '暂停招生，闭关补课',
        description: '把每个知识点都重新实践验证一遍',
        hint: '内容创作+12 · 信念+8 · 压力+8 · 健康-3 · 声誉+5 · 被动收入-2000/年',
        hintColor: 'positive',
        skillGains: { contentSkill: 12 },
        passiveIncomeChange: -2000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          addReputation(s, 5);
        },
        log: '31岁，你关了三个月招生，把课程里每个方法论都拿去实战了一遍。有两条被证伪了，你删掉重写。再开课时你心里踏实了——你知道自己讲的每个字，都是被现实检验过的。',
      },
      {
        id: 'co_learn_with_students',
        label: '坦诚自己也在学，和学员共修',
        description: '不装大师，做"走在前面的同行者"',
        hint: '受众运营+10 · 幸福+6 · 声誉+4 · 信念+4 · 粉丝+500',
        hintColor: 'positive',
        skillGains: { audienceSkill: 10 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          addReputation(s, 4);
          addFollowers(s, 500);
        },
        log: '31岁，你在开课仪式上说："我不是大师，我只是比你们早走了几步，还在走。"学员反而更买账。你发现：承认局限不是示弱，是另一种权威——"知道边界在哪"的人，比"假装无所不知"的人可信。',
      },
      {
        id: 'ride_hype',
        label: '趁势冲量，先收割这波流量',
        description: '机会稍纵即逝，先把钱和名赚到手',
        hint: '品牌价值+10 · 受众运营+6 · 存款+20000 · 压力+8 · 声誉-4 · 信念-3',
        hintColor: 'negative',
        skillGains: { brandSkill: 10, audienceSkill: 6 },
        savingsChange: 20000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          addReputation(s, -4);
          s.pathFaith = clamp(s.pathFaith - 3, 0, 100);
        },
        log: '31岁，你借着大佬的转发疯狂扩招，一个月赚了过去半年的钱。但深夜你看着那些"感谢老师"的评论，心里发虚。你赚到了名和利，却欠下了一笔叫"名不副实"的债——你知道，迟早有人会来讨。',
      },
    ],
  },

  // 33岁：规模化与团队
  {
    id: 'ip_edu_scale',
    title: '分身',
    sceneTag: 'office',
    pathId: 'super_ip',
    branch: 'ip_educator',
    ageRange: [33, 33],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    conditions: (s) => getSkill(s, 'audienceSkill') >= 40 && s.isAllInPath === true,
    narrative:
      '你一个人扛不住了。社群消息回不过来，课程更新跟不上，商务邮件堆成山。你招了第一个全职助理，又陆续招了剪辑、运营、助教。\n' +
      '团队从你一个人变成了七个人，有了办公室，有了早会。你从"一个人做内容"变成了"管理一群人做内容"。但奇怪的是，你反而更累了——以前你只需要对自己负责，现在你要对七个人的工资负责。\n' +
      '更让你不安的是：你的内容开始"不像你"了。助教写的稿、运营定的选题，都打着你的旗号。粉丝没察觉，但你察觉了。你站在办公室窗边想：你还是那个"你"吗？还是"你"已经变成了一个商标？',
    options: [
      {
        id: 'systematize',
        label: '建立标准化体系，自己只做核心',
        description: '把可复制的交给团队，自己只留"不可替代"的部分',
        hint: '品牌价值+12 · 受众运营+10 · 压力+6 · 被动收入+15000/年 · 声誉+2',
        hintColor: 'positive',
        skillGains: { brandSkill: 12, audienceSkill: 10 },
        passiveIncomeChange: 15000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          addReputation(s, 2);
        },
        log: '33岁，你花了半年把课程生产、社群运营、商务对接全部SOP化。你只负责选题和出镜，其余交给团队。产能翻了三倍，你终于能按时睡觉了。但你偶尔会怀念那个凌晨两点自己剪视频的自己——那时的累，是为自己累。',
      },
      {
        id: 'stay_solo',
        label: '砍掉团队，回到一个人',
        description: '宁可少赚，也要保住"个人IP"的"个人"二字',
        hint: '内容创作+8 · 幸福+8 · 信念+6 · 被动收入-3000/年 · 声誉+5',
        hintColor: 'positive',
        skillGains: { contentSkill: 8 },
        passiveIncomeChange: -3000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          addReputation(s, 5);
        },
        log: '33岁，你解散了团队，退了办公室。收入少了三成，但你重新找回了那种"每条内容都是我自己"的感觉。你发现：超级IP的"超级"不在于规模，而在于"不可被替代的独特"。机器可以复制流程，复制不了你。',
      },
      {
        id: 'partner_up',
        label: '找个合伙人，分工共担',
        description: '不失控也不累死，找一个互补的人',
        hint: '品牌价值+8 · 受众运营+8 · 压力-4 · 幸福+4 · 被动收入+10000/年',
        hintColor: 'positive',
        skillGains: { brandSkill: 8, audienceSkill: 8 },
        passiveIncomeChange: 10000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 4, 0, 100);
          s.happiness = clamp(s.happiness + 4, 0, 100);
        },
        log: '33岁，你拉了一个老学员做合伙人——他懂运营，你懂内容。你终于不用再一个人扛。但你也第一次体会到了"分权"的痛：你不再是唯一的决策者。你们为了一条广告吵到凌晨，最后各自退了一步——这也许就是"合伙"的代价与红利。',
      },
    ],
  },

  // 35岁：被抄袭
  {
    id: 'ip_edu_clone_attack',
    title: '镜中人',
    sceneTag: 'home',
    pathId: 'super_ip',
    branch: 'ip_educator',
    ageRange: [35, 35],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '粉丝@你：有个新博主，连课程目录、宣传文案、甚至你的口头禅都照搬，定价还比你便宜一半。你点进去看，心凉了半截——他比你年轻五岁，出镜比你帅，剪辑比你炫，数据已经快追上你了。\n' +
      '评论区有人替你打抱不平，也有人留言："人家讲得比原版还清楚，凭什么不能讲？"你看着这条评论，第一次觉得"知识"这两个字这么无力——你能申请版权的是表达，不是知识本身。\n' +
      '你想起自己25岁刚开课时，也是站在前人的肩膀上。你比那个年轻人，又高贵多少？但你又咽不下这口气——他抄的不只是你的课，是你熬了十年的积累。',
    options: [
      {
        id: 'legal_action',
        label: '发律师函，公开维权',
        description: '用法律和舆论双管齐下',
        hint: '品牌价值+8 · 压力+8 · 声誉+4 · 存款-8000 · 信念+3',
        hintColor: 'neutral',
        skillGains: { brandSkill: 8 },
        savingsChange: -8000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          addReputation(s, 4);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '35岁，你发了律师函，写了篇长文晒出时间线证据。抄袭者下架了课程，但转头换个马甲继续干。你赢了官司，却没赢市场。你明白：在内容行业，维权成本永远高于抄袭成本。',
      },
      {
        id: 'out_innovate',
        label: '不纠缠，用迭代甩开他',
        description: '你抄得走我的旧课，抄不走我的新作',
        hint: '内容创作+12 · 受众运营+6 · 信念+6 · 声誉+5 · 粉丝+800',
        hintColor: 'positive',
        skillGains: { contentSkill: 12, audienceSkill: 6 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          addReputation(s, 5);
          addFollowers(s, 800);
        },
        log: '35岁，你没理那个抄袭者，而是用三个月做出了2.0版课程——加了实战陪跑、行业定制、终身更新。抄袭者还在卖你一年前的旧版。你用"持续进化"回答了"被抄袭"：最好的维权，是让自己永远值得被追。',
      },
      {
        id: 'open_source',
        label: '干脆开源核心方法，让抄无意义',
        description: '把基础内容免费，靠服务和深度变现',
        hint: '内容创作+10 · 受众运营+10 · 信念+8 · 声誉+8 · 粉丝+2000 · 被动收入+6000/年',
        hintColor: 'positive',
        skillGains: { contentSkill: 10, audienceSkill: 10 },
        passiveIncomeChange: 6000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          addReputation(s, 8);
          addFollowers(s, 2000);
        },
        log: '35岁，你把课程的核心方法论全部免费公开了。同行说你疯了，但你的逻辑是：当基础知识人人都有，"跟你学"的价值就变成了陪伴、反馈和圈子——这些抄不走。一年后你的高客单社群反而爆满，因为"跟你"本身成了稀缺品。',
      },
    ],
  },

  // 37岁：成为导师的导师
  {
    id: 'ip_edu_mentor',
    title: '传灯',
    sceneTag: 'conference',
    pathId: 'super_ip',
    branch: 'ip_educator',
    ageRange: [37, 37],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => getSkill(s, 'contentSkill') >= 50,
    narrative:
      '一个你带过三年的学员，现在自己也成了头部讲师，出了书，上了榜。他请你去他的千人大会做嘉宾，介绍你时说："这是我的老师，没有他就没有今天的我。"\n' +
      '台下掌声雷动。你站在聚光灯下，看着这个当年连选题都发愁的年轻人，如今比你当年更耀眼。你突然有一种奇怪的感觉——不是嫉妒，是某种"接力棒交出去了"的释然。\n' +
      '你想起25岁那个在出租屋里录第一门课的自己。十二年了，你教过几千人，其中有些人已经超过了你。你终于理解了做老师的最高境界：不是让自己永远站在前面，是让越来越多的人站到你前面去。',
    options: [
      {
        id: 'train_successors',
        label: '系统培养接班人，把自己解放出来',
        description: '从"讲课的人"变成"培养讲师的人"',
        hint: '品牌价值+12 · 受众运营+8 · 幸福+10 · 声誉+8 · 被动收入+12000/年 · 信念+6',
        hintColor: 'positive',
        skillGains: { brandSkill: 12, audienceSkill: 8 },
        passiveIncomeChange: 12000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 10, 0, 100);
          addReputation(s, 8);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '37岁，你办了一个"讲师孵化营"，把你的方法论教给十几个想成为讲师的人。他们用你的体系开课，分你一部分收益。你的收入没少，但你的时间多了一倍。你从"自己讲"变成了"让别人替你讲"——这也许就是知识付费的终极形态。',
      },
      {
        id: 'write_canon',
        label: '写一本行业教材，沉淀体系',
        description: '把经验变成可传承的文字',
        hint: '内容创作+12 · 品牌价值+10 · 压力+6 · 声誉+10 · 被动收入+8000/年 · 信念+5',
        hintColor: 'positive',
        skillGains: { contentSkill: 12, brandSkill: 10 },
        passiveIncomeChange: 8000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          addReputation(s, 10);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '37岁，你花了一年写了一本行业方法论的书。出版后成了这个细分领域的"入门必读"。你看着书店里那本印着你名字的书，想起25岁那个怕没人买课的自己——原来"沉淀"两个字，是要用十年去兑现的。',
      },
      {
        id: 'step_back',
        label: '主动退到幕后，把舞台让给新人',
        description: '功成不必在我',
        hint: '品牌价值+8 · 幸福+12 · 信念+8 · 声誉+6 · 压力-10 · 健康+5',
        hintColor: 'positive',
        skillGains: { brandSkill: 8 },
        isRestOption: true,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          addReputation(s, 6);
          s.stress = clamp(s.stress - 10, 0, 100);
          s.health = clamp(s.health + 5, 0, 100);
        },
        log: '37岁，你主动减少了出镜，把舞台让给了你带出来的年轻人。有人问你"不怕过气吗"，你笑了：当一个老师最大的成功，是学生不再需要他。你第一次觉得，"退"也是一种前进。',
      },
    ],
  },
];

// ============================================================
// 泛娱乐线事件 (ip_entertainer, ages 26-38)
// ============================================================

const entertainerEvents: NarrativeEvent[] = [

  // 26岁：第一个爆款
  {
    id: 'ip_ent_first_viral',
    title: '起飞',
    sceneTag: 'home',
    pathId: 'super_ip',
    branch: 'ip_entertainer',
    ageRange: [26, 26],
    priority: 7,
    weight: 9,
    oncePerGame: true,
    narrative:
      '那条视频你只花了二十分钟拍，连妆都没化全。发完你就去洗澡了。洗到一半手机狂震，出来一看：播放量从两千跳到了五十万，还在涨。\n' +
      '评论区炸了，有人夸你"天才"，有人骂你"低俗"，有人扒你以前的视频说"早就关注了"。你的私信箱塞满了商务合作、MCN邀约、还有几条"求认识"。\n' +
      '你坐在马桶盖上盯着数字涨了一整夜，像看着一场不属于你的烟花。天亮时播放破了两千万。你发了条朋友圈："火了。"三个字，却失眠到中午。你怕的不是这一夜，是下一夜——你能复制这一次吗？',
    options: [
      {
        id: 'double_down_viral',
        label: '立刻复制爆款公式，趁热打铁',
        description: '流量窗口期短，必须趁势追击',
        hint: '受众运营+12 · 内容创作+6 · 压力+8 · 粉丝+8000 · 被动收入+8000/年 · 声誉-2',
        hintColor: 'positive',
        skillGains: { audienceSkill: 12, contentSkill: 6 },
        passiveIncomeChange: 8000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          addFollowers(s, 8000);
          addReputation(s, -2);
        },
        log: '26岁，你把那条爆款的"钩子+反转+金句"结构拆成了模板，连发十条。八条扑了，两条又爆了。你摸到了爆款的部分规律，但也开始被粉丝说"套路化了"。你换来了流量，但你也开始害怕——你已经不会做"不套路"的内容了。',
      },
      {
        id: 'upgrade_quality',
        label: '借势升级制作，做长线内容',
        description: '不追第二波流量，把第一波转化成存量',
        hint: '内容创作+12 · 品牌价值+8 · 压力+5 · 粉丝+4000 · 声誉+4',
        hintColor: 'positive',
        skillGains: { contentSkill: 12, brandSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          addFollowers(s, 4000);
          addReputation(s, 4);
        },
        log: '26岁，你没急着复制爆款，而是花一个月做了一条制作精良的长视频。数据没爆，但完播率高得吓人，粉丝黏性暴涨。你把"路过的人"变成了"留下的人"——这比一次爆款值钱得多。',
      },
      {
        id: 'monetize_fast',
        label: '立刻接大单，趁流量最贵时变现',
        description: '热度就是金钱，过期作废',
        hint: '品牌价值+10 · 存款+30000 · 压力+6 · 声誉-4 · 粉丝+2000',
        hintColor: 'positive',
        skillGains: { brandSkill: 10 },
        savingsChange: 30000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          addReputation(s, -4);
          addFollowers(s, 2000);
        },
        log: '26岁，你在流量最高点接了三个大广告，账上进账六位数。但三个月后热度退潮，粉丝开始说"你已经不是当初那个你了"。你赚到了第一桶金，也买到了第一波"过气感"——你第一次知道，流量和信任，是两本账。',
      },
    ],
  },

  // 28岁：品牌合作
  {
    id: 'ip_ent_brand_deal',
    title: '金主',
    sceneTag: 'cafe',
    pathId: 'super_ip',
    branch: 'ip_entertainer',
    ageRange: [28, 28],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => getFollowers(s) >= 10000,
    narrative:
      '一个国际品牌的市场总监飞来见你，开价五十万要你做一条定制内容。这是你单条报价的十倍。对方说："我们要的不是曝光，是你这个人设的背书。"\n' +
      '你受宠若惊，但仔细看了brief：品牌要你"自然融入"，但他们的产品和你的人设八竿子打不着。你接了，粉丝会觉得你"恰饭恰到脸都不要"；你不接，这五十万就飞了——而且同行会笑你"不会变现"。\n' +
      '你盯着那份合同，第一次理解了"定价权"三个字的分量。你不只是卖一条视频，你是在给自己的"品牌"定价。定低了，以后都涨不上去；定高了，可能吓跑所有金主。',
    options: [
      {
        id: 'decline_mismatch',
        label: '拒掉，等人设契合的品牌',
        description: '短期的钱不赚，换长期的溢价权',
        hint: '品牌价值+12 · 声誉+8 · 信念+6 · 幸福+4 · 粉丝+500',
        hintColor: 'positive',
        skillGains: { brandSkill: 12 },
        stateEffect: (s) => {
          addReputation(s, 8);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.happiness = clamp(s.happiness + 4, 0, 100);
          addFollowers(s, 500);
        },
        log: '28岁，你拒了那五十万。三个月后一个和你调性完全契合的品牌找上门，开价八十万，还允许你全程参与创意。你明白了：定价权的本质不是"敢报高价"，是"敢拒高价"——拒绝本身，就是在给品牌加码。',
      },
      {
        id: 'renegotiate',
        label: '接，但重新谈创意主导权',
        description: '钱要赚，但内容必须由你把控',
        hint: '品牌价值+10 · 内容创作+8 · 存款+50000 · 压力+6 · 声誉+2',
        hintColor: 'positive',
        skillGains: { brandSkill: 10, contentSkill: 8 },
        savingsChange: 50000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          addReputation(s, 2);
        },
        log: '28岁，你接了那单，但坚持自己写脚本、自己剪。成片出来，粉丝没觉得是广告，反而说"这条拍得真好"。品牌方很满意，把你列进了年度合作名单。你赚了钱，也没掉份——但你心里清楚，这种平衡是走钢丝。',
      },
      {
        id: 'take_full',
        label: '全盘接受，按brief执行',
        description: '甲方给钱甲方说了算',
        hint: '品牌价值+6 · 存款+50000 · 压力+4 · 声誉-6 · 粉丝-500',
        hintColor: 'negative',
        skillGains: { brandSkill: 6 },
        savingsChange: 50000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          addReputation(s, -6);
          addFollowers(s, -500);
        },
        log: '28岁，你按品牌方的要求拍了一条"软广"。钱到账了，但评论区一片"恰饭味太重"。你赚到了这五十万，却赔掉了一部分信任——而信任，是这个行业里最贵的复利资产。',
      },
    ],
  },

  // 29岁：争议
  {
    id: 'ip_ent_controversy',
    title: '引火烧身',
    sceneTag: 'home',
    pathId: 'super_ip',
    branch: 'ip_entertainer',
    ageRange: [29, 29],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你为了追热点，发了一条带强烈观点的内容。本来只是想蹭个流量，没想到踩中了某个群体的雷区。一夜之间评论区被攻陷，私信全是辱骂，你的名字被顶上了热搜——是负面的那种。\n' +
      '营销号开始扒你的历史，把你三年前一句玩笑话断章取义地放大。你的合作方连夜发来"暂停合作"的通知，两个在谈的品牌直接消失。你看着手机屏幕，手心全是汗。\n' +
      '你想辩解，但每一条辩解都被当成"洗白"。你第一次明白：在互联网上，"真相"不重要，"情绪"才重要。你不是在和一个观点战斗，你是在和一整片愤怒的海啸战斗。',
    options: [
      {
        id: 'apologize',
        label: '公开道歉，低头认错',
        description: '不争辩，用姿态平息风波',
        hint: '品牌价值+4 · 压力+10 · 声誉+3 · 信念-3 · 存款-10000 · 粉丝-2000',
        hintColor: 'neutral',
        skillGains: { brandSkill: 4 },
        savingsChange: -10000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          addReputation(s, 3);
          s.pathFaith = clamp(s.pathFaith - 3, 0, 100);
          addFollowers(s, -2000);
        },
        log: '29岁，你发了一条道歉视频，没找任何借口。风波慢慢平息，但你的"立场"被重新定义了——以后你说话，所有人都会拿这次道歉当标尺。你买了教训：泛娱乐可以博眼球，但有些线，一旦越过就回不来。',
      },
      {
        id: 'double_down',
        label: '硬刚，把争议变成流量',
        description: '黑红也是红，越骂越火',
        hint: '受众运营+10 · 品牌价值+4 · 压力+12 · 声誉-8 · 粉丝+5000 · 被动收入+6000/年',
        hintColor: 'danger',
        skillGains: { audienceSkill: 10, brandSkill: 4 },
        passiveIncomeChange: 6000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          addReputation(s, -8);
          addFollowers(s, 5000);
        },
        log: '29岁，你没道歉，反而连发三条"硬刚"内容。流量确实暴涨，黑粉和铁粉一起涌入。但你被几个平台限流了，主流品牌再也不敢找你。你换来了一时的热度，却失去了一辈子的"安全牌"身份。',
      },
      {
        id: 'lay_low',
        label: '停更避风头，等舆论自然降温',
        description: '不回应，让时间冲淡一切',
        hint: '内容创作+4 · 压力-6 · 声誉+2 · 信念+2 · 粉丝-1000',
        hintColor: 'neutral',
        skillGains: { contentSkill: 4 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 6, 0, 100);
          addReputation(s, 2);
          s.pathFaith = clamp(s.pathFaith + 2, 0, 100);
          addFollowers(s, -1000);
        },
        log: '29岁，你停更了一个月，关掉所有通知。等你再回来时，热搜早就换了主角。你损失了一些粉丝，但保住了"不表态"的余地。你学到：有时候不说话，比说任何话都安全。',
      },
    ],
  },

  // 30岁：内容跑步机
  {
    id: 'ip_ent_treadmill',
    title: '仓鼠轮',
    sceneTag: 'studio',
    pathId: 'super_ip',
    branch: 'ip_entertainer',
    ageRange: [30, 30],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '你已经连续547天日更了。每天睁眼第一件事是看数据，闭眼最后一件事是定明天的选题。你的生活被内容切碎：吃饭在想拍不拍，旅行在想剪不剪，连和伴侣吵架都下意识在构思"能不能做成一条"。\n' +
      '你的数据在涨，但你的人在缩水。伴侣说你"眼里没有光了"，朋友说你"除了数据不会聊别的了"。你照镜子，看到一张疲惫、表演、随时准备对镜头笑的脸。\n' +
      '你停不下来——算法只奖励"活跃"，你停一周流量就断崖。你成了一只跑在轮子上的仓鼠，跑得越快，轮子转得越快，但你永远在原地。你第一次问自己：你是在做内容，还是内容在做你？',
    options: [
      {
        id: 'reduce_frequency',
        label: '主动降频，从日更改周更',
        description: '用质量换数量，找回生活',
        hint: '内容创作+10 · 幸福+8 · 健康+6 · 压力-8 · 粉丝-1500 · 信念+4',
        hintColor: 'positive',
        skillGains: { contentSkill: 10 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.health = clamp(s.health + 6, 0, 100);
          s.stress = clamp(s.stress - 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          addFollowers(s, -1500);
        },
        log: '30岁，你咬牙把日更改成了周更。前两周数据暴跌，你焦虑得想反悔。但一个月后，单条质量上来了，完播率翻倍，留下的都是真粉。你重新有了周末，重新能好好吃顿饭。你发现：少做，反而做得更好。',
      },
      {
        id: 'build_team',
        label: '招人分担，自己只做核心',
        description: '用团队对抗跑步机',
        hint: '受众运营+12 · 品牌价值+6 · 压力+4 · 存款-10000 · 粉丝+2000',
        hintColor: 'positive',
        skillGains: { audienceSkill: 12, brandSkill: 6 },
        savingsChange: -10000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          addFollowers(s, 2000);
        },
        log: '30岁，你招了剪辑和运营，自己只负责出镜和选题。产能没降，你终于能睡整觉了。但你很快发现新的累：管理团队比自己做内容还操心。你换了一种累法，但至少不再是孤军奋战。',
      },
      {
        id: 'pivot_format',
        label: '转型做长内容，逃离日更陷阱',
        description: '从短视频转向深度长视频/播客',
        hint: '内容创作+12 · 品牌价值+8 · 压力+6 · 粉丝-800 · 声誉+5 · 信念+5',
        hintColor: 'positive',
        skillGains: { contentSkill: 12, brandSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          addFollowers(s, -800);
          addReputation(s, 5);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '30岁，你停掉了短视频，转型做一小时的长视频播客。粉丝掉了一波，但留下的人开始认真听你说话。你第一次觉得，你不是在"喂"内容，而是在"对话"。短期的数据跌了，但你的"人"终于回来了。',
      },
    ],
  },

  // 32岁：粉丝见面会
  {
    id: 'ip_ent_fan_meetup',
    title: '面对面',
    sceneTag: 'conference',
    pathId: 'super_ip',
    branch: 'ip_entertainer',
    ageRange: [32, 32],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '你办了第一场粉丝见面会。三百人到场，最大的才十九岁，最小的被妈妈领着来。一个女孩排了两小时队，见到你时哭了："你的视频陪我熬过了高三。"\n' +
      '你愣住了。你一直把粉丝当成数据——播放量、点赞数、转化率。但此刻他们变成了一个个具体的人，有名字、有眼泪、有故事。你第一次感到一种沉甸甸的东西压在肩上：你在影响活生生的人。\n' +
      '见面会结束，你一个人坐在空荡的会场。地上还散落着粉丝送的礼物和手写信。你突然很孤独——你被这么多人"认识"，却没有一个人真的"认识"你。他们爱的是那个镜头里的你，不是此刻坐在废纸屑里的你。',
    options: [
      {
        id: 'embrace_responsibility',
        label: '正视影响力，调整内容方向',
        description: '你影响的是活人，得对得起这份信任',
        hint: '品牌价值+10 · 内容创作+8 · 声誉+8 · 信念+6 · 幸福+4 · 粉丝+1000',
        hintColor: 'positive',
        skillGains: { brandSkill: 10, contentSkill: 8 },
        stateEffect: (s) => {
          addReputation(s, 8);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.happiness = clamp(s.happiness + 4, 0, 100);
          addFollowers(s, 1000);
        },
        log: '32岁，你开始有意识地做"对人有帮助"的内容。流量没以前爆，但评论区开始出现"这条救了我"这样的话。你第一次觉得，做内容不只是做生意，是在和别人的生命发生关系。这份重量，你愿意扛。',
      },
      {
        id: 'keep_distance',
        label: '保持距离，避免parasocial',
        description: '太近会反噬，IP需要神秘感',
        hint: '品牌价值+6 · 受众运营+6 · 压力-4 · 声誉+2',
        hintColor: 'neutral',
        skillGains: { brandSkill: 6, audienceSkill: 6 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 4, 0, 100);
          addReputation(s, 2);
        },
        log: '32岁，你办完见面会就减少了线下活动。你害怕那种"被需要"的重量——太近了，粉丝会把对父母、对爱人的期待投射到你身上，而你给不了。你选择保持屏幕的距离，这既保护了他们，也保护了你。',
      },
      {
        id: 'monetize_fandom',
        label: '深耕粉丝经济，做会员和周边',
        description: '把这份情感连接变成商业模式',
        hint: '品牌价值+12 · 受众运营+8 · 存款+15000 · 压力+5 · 声誉-2 · 被动收入+10000/年',
        hintColor: 'positive',
        skillGains: { brandSkill: 12, audienceSkill: 8 },
        savingsChange: 15000,
        passiveIncomeChange: 10000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          addReputation(s, -2);
        },
        log: '32岁，你推出了付费会员和周边产品。核心粉丝很买账，年付会员卖爆了。但也有人说你"消费粉丝感情"。你在"经营关系"和"收割感情"之间反复横跳——这条界线，你至今没画清楚。',
      },
    ],
  },

  // 34岁：MCN邀约
  {
    id: 'ip_ent_mcn',
    title: '橄榄枝',
    sceneTag: 'cafe',
    pathId: 'super_ip',
    branch: 'ip_entertainer',
    ageRange: [34, 34],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    conditions: (s) => getFollowers(s) >= 50000,
    narrative:
      '一家头部MCN的老板约你喝咖啡，开门见山："签我们，给你配十人团队，独家流量倾斜，年保底三百万。条件是独家约、内容方向我们参与、商务归我们统筹。"\n' +
      '你心里算账：十人团队、保底三百万、平台资源——这些是你一个人永远攒不齐的。但"独家""参与方向""统筹商务"这几个词让你后背发凉。你做IP的初衷不就是"不给人打工"吗？签了，你岂不是又回去打工了？\n' +
      '老板看穿了你的犹豫，笑着说："自由是有成本的，一个人扛能扛多久？"你端起咖啡没喝，杯子很烫。你知道他在PUA你，但他说的也是实话——你已经累了，而累，是做IP最大的敌人。',
    options: [
      {
        id: 'reject_mcn',
        label: '拒绝，保住独立',
        description: '宁可慢，也要自己说了算',
        hint: '品牌价值+12 · 信念+8 · 幸福+4 · 压力+4 · 声誉+4',
        hintColor: 'positive',
        skillGains: { brandSkill: 12 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.happiness = clamp(s.happiness + 4, 0, 100);
          s.stress = clamp(s.stress + 4, 0, 100);
          addReputation(s, 4);
        },
        log: '34岁，你拒了那家MCN。三年后他们签的一个同期博主因为合约纠纷被封号，你看着新闻出了一身冷汗。你少赚了钱，但你的号、你的名、你的内容，永远是你自己的。自由很贵，但有些东西比钱贵。',
      },
      {
        id: 'sign_selective',
        label: '签非独家商务约，只分商务',
        description: '要资源不要控制权',
        hint: '品牌价值+10 · 受众运营+6 · 存款+20000 · 压力+3 · 被动收入+8000/年',
        hintColor: 'positive',
        skillGains: { brandSkill: 10, audienceSkill: 6 },
        savingsChange: 20000,
        passiveIncomeChange: 8000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 3, 0, 100);
        },
        log: '34岁，你和MCN签了非独家商务约——他们负责接商单、谈价格，你保留内容主导权。商务收入翻了一倍，但你失去了一些"拒单自由"。你换来了一部分省心，也交出了一部分主权。所有的合作都是交换。',
      },
      {
        id: 'sign_full',
        label: '全签，换资源与规模',
        description: '一个人太累了，背靠大树好乘凉',
        hint: '受众运营+12 · 品牌价值+6 · 存款+30000 · 压力+8 · 声誉-3 · 信念-6',
        hintColor: 'danger',
        skillGains: { audienceSkill: 12, brandSkill: 6 },
        savingsChange: 30000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          addReputation(s, -3);
          s.pathFaith = clamp(s.pathFaith - 6, 0, 100);
        },
        log: '34岁，你签了全约。第一个月数据确实飞起来了，但内容方向越来越不由你。半年后你想解约，违约金是年收入的三倍。你换来了规模，却把自己重新关进了笼子——只是这次笼子镀了金。',
      },
    ],
  },

  // 36岁：内容同质化
  {
    id: 'ip_ent_oversaturation',
    title: '众生相',
    sceneTag: 'home',
    pathId: 'super_ip',
    branch: 'ip_entertainer',
    ageRange: [36, 36],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '你打开推荐页，前五十条里有三十条在用你的梗、你的节奏、你的钩子。一批比你年轻五岁的博主，用更炫的剪辑、更猛的情绪，把你三年前的套路复制了一百遍，数据还都比你新发的要好。\n' +
      '你第一次感到"过气"这两个字的实感。不是没人看了，是"你"这种风格，已经从"独创"变成了"通货"。你曾经引以为傲的个人标签，现在每个新人都会。\n' +
      '你刷到一条评论："这个博主老了，跟不上年轻人了。"你盯着这句话看了很久。你才36岁，但在互联网上，36岁已经是"前浪"。你第一次认真地想：是该转型，还是该认命？',
    options: [
      {
        id: 'reinvent',
        label: '彻底转型，开辟新赛道',
        description: '与其被抄死，不如自己先变',
        hint: '内容创作+12 · 受众运营+8 · 压力+10 · 粉丝-3000 · 声誉+5 · 信念+6',
        hintColor: 'positive',
        skillGains: { contentSkill: 12, audienceSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          addFollowers(s, -3000);
          addReputation(s, 5);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '36岁，你停掉了老赛道，开了一个全新的内容方向。前三个月数据惨淡，老粉骂你"不务正业"。但半年后新赛道跑出来了，你成了那片新土地上的先行者。你证明了一件事：能火一次是运气，能火两次是本事。',
      },
      {
        id: 'go_niche_premium',
        label: '收缩成高客单精品，服务核心粉',
        description: '不再追大众，做一万个人的"唯一"',
        hint: '品牌价值+12 · 受众运营+6 · 压力-4 · 声誉+6 · 粉丝-2000 · 被动收入+8000/年',
        hintColor: 'positive',
        skillGains: { brandSkill: 12, audienceSkill: 6 },
        passiveIncomeChange: 8000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 4, 0, 100);
          addReputation(s, 6);
          addFollowers(s, -2000);
        },
        log: '36岁，你不再追百万播放，转而服务那一万核心粉。你做了高客单会员、线下闭门会、定制咨询。粉丝少了，但每个人为你付的钱多了十倍。你从"大众明星"变成了"小众教主"——后者活得更久。',
      },
      {
        id: 'embrace_elder',
        label: '坦然接受"前浪"身份，做长者视角',
        description: '不再装嫩，用阅历当卖点',
        hint: '内容创作+8 · 品牌价值+8 · 幸福+6 · 声誉+4 · 信念+5',
        hintColor: 'positive',
        skillGains: { contentSkill: 8, brandSkill: 8 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 6, 0, 100);
          addReputation(s, 4);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '36岁，你在一条视频里第一次大方承认"我不年轻了"。没想到这条反而爆了——评论区一堆人说"终于有个不装嫩的博主"。你换了个赛道：不追年轻人的热点，讲你这个年纪的人才懂的事。你输了年轻，赢了厚度。',
      },
    ],
  },

  // 38岁：形式转型与传承
  {
    id: 'ip_ent_format_pivot',
    title: '第二幕',
    sceneTag: 'conference',
    pathId: 'super_ip',
    branch: 'ip_entertainer',
    ageRange: [38, 38],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => getSkill(s, 'brandSkill') >= 50,
    narrative:
      '你站在一场行业颁奖典礼的后台，主持人正在台上念你的名字："年度影响力IP。"你走上台，灯光很亮，台下坐着的有一半是看着你内容长大的年轻创作者。\n' +
      '你握着奖杯，想起12年前那个对着空房间说话的自己。你火过、凉过、被骂过、被模仿过、被超越过。你曾经以为"火"是终点，现在你知道"火"只是过程。真正的问题是：当热度退去，你还剩下什么？\n' +
      '下台后一个年轻博主追上来问："前辈，怎么才能像您一样一直火？"你笑了，说了句你花十年才懂的话："别追一直火，要追‘不火也能活’。"',
    options: [
      {
        id: 'build_ecosystem',
        label: '建内容生态，从创作者变平台',
        description: '孵化新人、做MCN、做工具',
        hint: '品牌价值+12 · 受众运营+10 · 存款-20000 · 压力+8 · 被动收入+20000/年 · 声誉+6',
        hintColor: 'positive',
        skillGains: { brandSkill: 12, audienceSkill: 10 },
        savingsChange: -20000,
        passiveIncomeChange: 20000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          addReputation(s, 6);
        },
        log: '38岁，你把个人IP升级成了一个内容生态：孵化了五个新人、做了个创作者工具、开了个行业峰会。你不靠单条内容赚钱了，你靠"系统"赚钱。你从一个"演员"变成了"剧院老板"——这才是真正的退休自由。',
      },
      {
        id: 'ip_franchise',
        label: '把个人IP资产化，做长青内容',
        description: '做能复看、能复购、能传承的内容',
        hint: '内容创作+12 · 品牌价值+10 · 压力+5 · 声誉+8 · 被动收入+15000/年 · 信念+6',
        hintColor: 'positive',
        skillGains: { contentSkill: 12, brandSkill: 10 },
        passiveIncomeChange: 15000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          addReputation(s, 8);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '38岁，你把过去十年的爆款做成了一套"内容方法论"的系列课和精选合集。这些内容不再追热点，但永远有人需要。它们像不动产一样，在你睡觉时持续产生收益。你终于把"流量"变成了"资产"。',
      },
      {
        id: 'graceful_exit',
        label: '体面收手，回归真实生活',
        description: '在最体面的时候退场',
        hint: '品牌价值+10 · 幸福+12 · 健康+8 · 压力-12 · 声誉+8 · 信念+8',
        hintColor: 'positive',
        skillGains: { brandSkill: 10 },
        isRestOption: true,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 12, 0, 100);
          s.health = clamp(s.health + 8, 0, 100);
          s.stress = clamp(s.stress - 12, 0, 100);
          addReputation(s, 8);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '38岁，你领完那个奖，发了一条"感谢大家，我要歇一阵了"。你没说退圈，但所有人都懂。你把账号交给了团队维护，自己去了趟一直想去的海边。你终于明白：做IP最难的不是火起来，是知道什么时候该松手。',
      },
    ],
  },
];

// ============================================================
// 思想领袖线事件 (ip_thought_leader, ages 26-38)
// ============================================================

const thoughtLeaderEvents: NarrativeEvent[] = [

  // 27岁：第一本书
  {
    id: 'ip_tl_book_deal',
    title: '成书',
    sceneTag: 'home',
    pathId: 'super_ip',
    branch: 'ip_thought_leader',
    ageRange: [27, 27],
    priority: 7,
    weight: 9,
    oncePerGame: true,
    narrative:
      '一家出版社的编辑私信你："您的系列长文我们一直在追，想约您出一本书。"你盯着这条消息看了十遍，确认不是诈骗。\n' +
      '但你兴奋了不到五分钟就陷入恐慌：写文章和写书是两回事。你那些爆火的长文，拆开看每篇都是"观点+案例+金句"的短打，真要撑起一本书的体量，你需要一个完整的思想体系——而你没有。\n' +
      '你打开文档，光标闪了一晚上，一个字没写。你第一次直面思想领袖最深的恐惧：你的"深刻"会不会只是"会写金句"？一旦成书，所有人都会拿放大镜看你的逻辑。',
    options: [
      {
        id: 'write_serious_book',
        label: '闭关一年，写一本真有体系的书',
        description: '不拼金句，拼逻辑和证据',
        hint: '内容创作+12 · 品牌价值+8 · 压力+10 · 健康-4 · 声誉+8 · 被动收入+6000/年 · 信念+6',
        hintColor: 'positive',
        skillGains: { contentSkill: 12, brandSkill: 8 },
        passiveIncomeChange: 6000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.health = clamp(s.health - 4, 0, 100);
          addReputation(s, 8);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '27岁，你推掉了所有商务，闭关一年写书。你重写了四稿，删掉了所有"听起来很爽但站不住"的金句。书出版后销量平平，但被几个学界的人认真讨论了。你第一次觉得，"被少数人认真对待"比"被多数人转发"更珍贵。',
      },
      {
        id: 'compile_articles',
        label: '把爆款长文整理成文集',
        description: '稳妥变现，先有书再说',
        hint: '品牌价值+10 · 内容创作+5 · 存款+15000 · 压力+4 · 声誉+2',
        hintColor: 'positive',
        skillGains: { brandSkill: 10, contentSkill: 5 },
        savingsChange: 15000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          addReputation(s, 2);
        },
        log: '27岁，你把过往爆款长文整理成了一本文集，三个月加印两次。赚到了钱和名，但你自己知道，这只是"文章合集"而非"著作"。你换来了一本书的厚度，却欠下了一本"真正的书"的债。',
      },
      {
        id: 'co_write_expert',
        label: '找个领域专家合著，补足深度',
        description: '你出观点，专家出证据',
        hint: '内容创作+10 · 品牌价值+6 · 压力+5 · 声誉+5 · 被动收入+4000/年',
        hintColor: 'positive',
        skillGains: { contentSkill: 10, brandSkill: 6 },
        passiveIncomeChange: 4000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          addReputation(s, 5);
        },
        log: '27岁，你和一个学界前辈合著了一本书——你出洞察，他出论证。书出版后评价很高，但你心里有点不是滋味：夸这本书的人，多半是夸"论证扎实"，而那不是你的部分。你换来了声誉，也看清了自己的天花板。',
      },
    ],
  },

  // 29岁：主题演讲
  {
    id: 'ip_tl_keynote',
    title: '聚光灯',
    sceneTag: 'conference',
    pathId: 'super_ip',
    branch: 'ip_thought_leader',
    ageRange: [29, 29],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => getReputation(s) >= 40,
    narrative:
      '一个行业大会邀请你做开场主题演讲，两千人，二十分钟。这是你第一次站在这种规格的台上。你准备了一个月，把稿子背得滚瓜烂熟，PPT改了十七版。\n' +
      '上台前一秒你腿还在抖。但当灯光打下来，台下安静下来，你开口的瞬间，那种恐惧突然消失了。你讲的是你思考了三年的那个观点，越讲越顺，金句自然地从嘴里流出来。结束时全场起立鼓掌。\n' +
      '下台后无数人加你微信，有投资人、有CEO、有记者。你第一次尝到"思想变现"的滋味——不是钱，是"被需要"。但你也意识到：台上的二十分钟，是你用三年的孤独思考换来的。聚光灯很亮，但照不到你熬夜的那些夜晚。',
    options: [
      {
        id: 'tour_speaking',
        label: '深耕演讲，做职业keynote speaker',
        description: '把"会讲"变成核心资产',
        hint: '品牌价值+12 · 受众运营+8 · 压力+6 · 声誉+6 · 被动收入+15000/年 · 粉丝+1500',
        hintColor: 'positive',
        skillGains: { brandSkill: 12, audienceSkill: 8 },
        passiveIncomeChange: 15000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          addReputation(s, 6);
          addFollowers(s, 1500);
        },
        log: '29岁，你开始系统接商业演讲，单场报价从五千涨到了五万。你发现"现场感染力"是一种稀缺能力，而你有。但你也发现：演讲越多，你思考的时间越少。你开始警惕——一个不思考的思想领袖，只是个高级复读机。',
      },
      {
        id: 'deepen_thought',
        label: '只接高质量论坛，把时间留给思考',
        description: '演讲是输出，思考才是源头',
        hint: '内容创作+12 · 品牌价值+8 · 声誉+8 · 信念+6 · 被动收入+8000/年',
        hintColor: 'positive',
        skillGains: { contentSkill: 12, brandSkill: 8 },
        passiveIncomeChange: 8000,
        stateEffect: (s) => {
          addReputation(s, 8);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '29岁，你拒掉了八成演讲邀约，只去那些能逼你产出新思考的场合。你的演讲场次少了，但每一场都被行业反复引用。你明白：思想领袖的稀缺资源不是曝光，是"值得被曝光的新观点"。',
      },
      {
        id: 'start_movement',
        label: '借势发起一个行业倡议',
        description: '不止讲，还要推动改变',
        hint: '品牌价值+12 · 受众运营+10 · 压力+8 · 声誉+10 · 信念+8 · 粉丝+2000',
        hintColor: 'positive',
        skillGains: { brandSkill: 12, audienceSkill: 10 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          addReputation(s, 10);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          addFollowers(s, 2000);
        },
        log: '29岁，你在那场演讲结尾宣布了一个行业倡议，号召同行一起做件难事。响应者众，你从一个"演讲者"变成了"发起人"。你第一次摸到了"思想"变"行动"的边——这才是思想领袖该干的事。',
      },
    ],
  },

  // 30岁：思想对手
  {
    id: 'ip_tl_rival',
    title: '论敌',
    sceneTag: 'home',
    pathId: 'super_ip',
    branch: 'ip_thought_leader',
    ageRange: [30, 30],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    narrative:
      '一个学术背景的学者公开写长文反驳你的核心观点，论据扎实、逻辑严密，结尾还客气地祝你"继续求真"。你的评论区炸了，粉丝让你"打回去"，路人让你"认错"。\n' +
      '你把那篇文章读了五遍，越读越心惊——他指出的几个漏洞，你确实没想过。你的观点之所以"火"，是因为它顺了大众情绪；他之所以"冷"，是因为他戳破了那层情绪。\n' +
      '你第一次面对思想领袖最难的考验：是死守"自己是对的"保住人设，还是公开承认"我错了"保住真理？前者保面子，后者保里子。你知道选哪个对，但选了哪个都会掉粉。',
    options: [
      {
        id: 'public_acknowledge',
        label: '公开认错，邀请对方公开辩论',
        description: '真理比面子重要',
        hint: '内容创作+12 · 品牌价值+10 · 压力+6 · 声誉+10 · 信念+8 · 粉丝-1000',
        hintColor: 'positive',
        skillGains: { contentSkill: 12, brandSkill: 10 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          addReputation(s, 10);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          addFollowers(s, -1000);
        },
        log: '30岁，你写了篇长文公开承认自己那个观点的漏洞，并邀请那位学者公开对谈。对谈直播观看破百万，你和对方从论敌变成了惺惺相惜。掉了一批"只想看你赢"的粉，但换来了一批"因为你会认错而信你"的人。你明白：思想领袖的权威，建立在"敢于不权威"之上。',
      },
      {
        id: 'refine_position',
        label: '不认错，但悄悄修正观点',
        description: '保住人设，私下迭代',
        hint: '品牌价值+6 · 内容创作+8 · 压力+5 · 声誉-2 · 信念-3',
        hintColor: 'neutral',
        skillGains: { brandSkill: 6, contentSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          addReputation(s, -2);
          s.pathFaith = clamp(s.pathFaith - 3, 0, 100);
        },
        log: '30岁，你没公开回应，但在后续内容里悄悄修正了那个观点。聪明的粉丝发现了，说你"嘴硬但心虚"；没发现的继续挺你。你保住了面子，却失去了一次"立信"的机会——你心里清楚，这笔账迟早要还。',
      },
      {
        id: 'ignore_attack',
        label: '不理会，继续输出新观点',
        description: '不纠缠，用新作品盖过争议',
        hint: '内容创作+10 · 品牌价值+4 · 压力+3 · 声誉+2 · 信念+3',
        hintColor: 'neutral',
        skillGains: { contentSkill: 10, brandSkill: 4 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 3, 0, 100);
          addReputation(s, 2);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '30岁，你没回应那位学者，而是连发三篇新长文。热度盖过了争议，但那位学者的反驳文章至今还排在搜索引擎前列，时不时被人翻出来。你赢得了当下，却把一颗雷埋在了未来。',
      },
    ],
  },

  // 31岁：被媒体引用
  {
    id: 'ip_tl_quoted',
    title: '破壁',
    sceneTag: 'home',
    pathId: 'super_ip',
    branch: 'ip_thought_leader',
    ageRange: [31, 31],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    conditions: (s) => getReputation(s) >= 50,
    narrative:
      '你在朋友圈刷到一条新闻：某主流媒体在分析一个社会现象时，引用了你提出的一个概念，还标注了你的名字。你截图发了条动态，半小时点赞过千。\n' +
      '但这只是开始。接下来一个月，你的概念被十几家媒体转引，被写进了几份行业报告，甚至出现在某位官员的讲话稿里。你的思想从"网络观点"变成了"公共话语"的一部分。\n' +
      '你既兴奋又惶恐。你想起当初提出这个概念时，只是想解释一个现象，没想到它会被这么多人拿去用——而用的人，未必理解你的本意。你第一次感到"思想失控"的恐惧：观点一旦离开你，就不再属于你了。',
    options: [
      {
        id: 'define_canon',
        label: '出书系统定义这个概念，夺回解释权',
        description: '用一本权威著作钉死定义',
        hint: '内容创作+12 · 品牌价值+12 · 压力+8 · 声誉+10 · 被动收入+10000/年 · 信念+6',
        hintColor: 'positive',
        skillGains: { contentSkill: 12, brandSkill: 12 },
        passiveIncomeChange: 10000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          addReputation(s, 10);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '31岁，你花了半年写了一本专著，把这个概念的前世今生、边界、误读全部讲透。书成了这个领域的"标准定义"，以后所有人引用都得提你的名字。你用一本书，把"被引用"变成了"被定义"——这才是思想资产的终极形态。',
      },
      {
        id: 'ride_influence',
        label: '趁势扩大议题，做公共知识分子',
        description: '从行业破圈到公共讨论',
        hint: '品牌价值+12 · 受众运营+10 · 压力+6 · 声誉+6 · 粉丝+3000 · 信念+5',
        hintColor: 'positive',
        skillGains: { brandSkill: 12, audienceSkill: 10 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          addReputation(s, 6);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          addFollowers(s, 3000);
        },
        log: '31岁，你开始就更多公共议题发声，从行业专家变成了公共知识分子。影响力暴涨，但也招来了更多审视——你说的每句话都被放在显微镜下。你享受破圈的快感，也开始承受"被所有人盯着"的代价。',
      },
      {
        id: 'stay_academic',
        label: '回归学术严谨，避免被滥用',
        description: '主动收缩，保住思想的纯度',
        hint: '内容创作+10 · 声誉+8 · 信念+6 · 粉丝+500',
        hintColor: 'neutral',
        skillGains: { contentSkill: 10 },
        stateEffect: (s) => {
          addReputation(s, 8);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          addFollowers(s, 500);
        },
        log: '31岁，你反而收缩了发声面，回到更严谨的学术写作。你怕你的概念被滥用、被断章取义，于是亲手给它设了边界。掉了一些围观流量，但留下来的都是认真读你字的人。你选择了"小而深"，放弃了"大而浅"。',
      },
    ],
  },

  // 33岁：影响力破圈到线下
  {
    id: 'ip_tl_offline_influence',
    title: '涟漪',
    sceneTag: 'conference',
    pathId: 'super_ip',
    branch: 'ip_thought_leader',
    ageRange: [33, 33],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => getSkill(s, 'brandSkill') >= 45,
    narrative:
      '一个政府智库邀请你做闭门顾问，参与一份政策建议的起草。你坐在全是白发学者的会议室里，你的发言稿被他们逐字讨论、修改、采纳。\n' +
      '半年后，那份政策建议落地了，其中一段话几乎原样保留了你写的措辞。你看着官方文件上那段熟悉的文字，起了一身鸡皮疙瘩——你的思想，真的变成了影响千万人的规则。\n' +
      '但你也在深夜问自己：你成了一个"有权力的人"，哪怕只是思想的权力。这种权力，你担得起吗？你的一个观点，可能让一群人受益，也可能让另一群人受损。思想领袖的最高处，是悬崖。',
    options: [
      {
        id: 'embrace_power',
        label: '深度参与政策，把思想变成行动',
        description: '既然有了影响力，就用它做点实事',
        hint: '品牌价值+12 · 受众运营+8 · 压力+10 · 声誉+10 · 信念+8 · 被动收入+8000/年',
        hintColor: 'positive',
        skillGains: { brandSkill: 12, audienceSkill: 8 },
        passiveIncomeChange: 8000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          addReputation(s, 10);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '33岁，你成了几个智库的常驻顾问。你的思想真的在改变规则。但你也被卷入了你曾批判的"体制"——你开始理解"身在其中的难"。你不再只是个评论者，你成了参与者。这份重量，让你既骄傲又失眠。',
      },
      {
        id: 'stay_outside',
        label: '保持独立身份，只做建言不做执行',
        description: '距离才能保证批判的锋利',
        hint: '品牌价值+10 · 内容创作+8 · 声誉+6 · 信念+6',
        hintColor: 'positive',
        skillGains: { brandSkill: 10, contentSkill: 8 },
        stateEffect: (s) => {
          addReputation(s, 6);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '33岁，你只做"提建议的人"，拒绝进入任何执行机构。你怕被体制收编后失去批判的资格。有人笑你"清高"，但你心里清楚：知识分子的锋芒，往往在被"招安"的那天就钝了。你选择了"永远在野"。',
      },
      {
        id: 'public_educator',
        label: '转向大众启蒙，做思想的传播者',
        description: '不进庙堂，去广场',
        hint: '内容创作+12 · 受众运营+12 · 声誉+8 · 粉丝+4000 · 被动收入+6000/年 · 信念+6',
        hintColor: 'positive',
        skillGains: { contentSkill: 12, audienceSkill: 12 },
        passiveIncomeChange: 6000,
        stateEffect: (s) => {
          addReputation(s, 8);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          addFollowers(s, 4000);
        },
        log: '33岁，你没进庙堂，而是把晦涩的思想翻译成了大众能懂的内容。你做了一档科普节目，把那些智库里的概念讲给普通人听。你的影响面从几百个决策者变成了几百万普通人——你选择了"广场"而非"密室"。',
      },
    ],
  },

  // 35岁：第二本书与经典化
  {
    id: 'ip_tl_second_book',
    title: '正典',
    sceneTag: 'home',
    pathId: 'super_ip',
    branch: 'ip_thought_leader',
    ageRange: [35, 35],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => getSkill(s, 'contentSkill') >= 55,
    narrative:
      '你的第一本书被几所大学列为了推荐读物。一个教授写信告诉你，他把你的书作为课程教材，因为"这是第一本系统讲清楚这个问题的中文著作"。\n' +
      '你看着那封信，想起八年前那个对着空文档一个字写不出的自己。你的思想不再是"网络观点"，它进了课堂，成了"知识"。但你没有沾沾自喜——你反而更焦虑了：被"经典化"意味着被"固化"，而思想一旦固化，就离僵化不远了。\n' +
      '你决定写第二本书，不是为了重复自己，而是为了推翻自己。真正的思想领袖，得敢于亲手拆掉自己盖的庙。',
    options: [
      {
        id: 'self_subvert',
        label: '写一本推翻自己旧观点的书',
        description: '用新作超越旧作，哪怕打自己的脸',
        hint: '内容创作+12 · 品牌价值+12 · 压力+12 · 健康-4 · 声誉+12 · 信念+10',
        hintColor: 'positive',
        skillGains: { contentSkill: 12, brandSkill: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.health = clamp(s.health - 4, 0, 100);
          addReputation(s, 12);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
        },
        log: '35岁，你用两年写了一本"自我反驳"的书，公开推翻了第一本书里的几个核心论点。学界震动，有人说你"朝令夕改"，更多人说你"这才是真学者"。你证明了一件事：能超越自己的，才配叫思想领袖。',
      },
      {
        id: 'expand_scope',
        label: '开辟新领域，写跨学科著作',
        description: '不重复，去新的思想疆域',
        hint: '内容创作+12 · 品牌价值+10 · 压力+8 · 声誉+8 · 被动收入+8000/年 · 信念+6',
        hintColor: 'positive',
        skillGains: { contentSkill: 12, brandSkill: 10 },
        passiveIncomeChange: 8000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          addReputation(s, 8);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '35岁，你跨界写了一本融合两个领域的书。学界有人说你"不务正业"，但这本书反而成了两个领域之间的桥梁，被反复引用。你发现：真正的思想创新，往往发生在学科的缝隙里。',
      },
      {
        id: 'curate_canon',
        label: '主编一套丛书，定义领域标准',
        description: '从"作者"升级为"学术组织者"',
        hint: '品牌价值+12 · 受众运营+10 · 压力+8 · 声誉+10 · 被动收入+12000/年 · 信念+6',
        hintColor: 'positive',
        skillGains: { brandSkill: 12, audienceSkill: 10 },
        passiveIncomeChange: 12000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          addReputation(s, 10);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '35岁，你主编了一套领域丛书，邀请了十几位学者各写一本。你从"一个人写书"变成了"定义一个领域的人"。这套书成了这个领域的入门标配，而你的名字，印在了每一本的封面上。',
      },
    ],
  },

  // 37岁：成为经典
  {
    id: 'ip_tl_canon',
    title: '不朽',
    sceneTag: 'home',
    pathId: 'super_ip',
    branch: 'ip_thought_leader',
    ageRange: [37, 37],
    priority: 7,
    weight: 9,
    oncePerGame: true,
    conditions: (s) => getSkill(s, 'contentSkill') >= 65 && getReputation(s) >= 60,
    narrative:
      '一个研究生引用你的概念写完了博士论文，答辩时评委问："这个概念的提出者还活着吗？"学生说："活着，才37岁。"全场笑了。\n' +
      '你听学生转述这件事时，心情很复杂。你的思想已经"经典化"到被当成"已故大师"来引用了——可你才37岁。你站在思想的巅峰，却忽然感到一种高处的不真实感。\n' +
      '你想起12年前那个在出租屋里写第一篇长文的自己。你赌的是"深刻能活很久"，现在这句话兑现了。但你也发现：当你成为"经典"，你就成了被供奉的牌位，而不是还会犯错的人。你害怕自己被自己的名声困住，再也不能"想错"。',
    options: [
      {
        id: 'keep_subverting',
        label: '主动自我颠覆，拒绝被供起来',
        description: '经典化是坟墓，要一直做活人',
        hint: '内容创作+12 · 品牌价值+12 · 压力+10 · 声誉+8 · 信念+10 · 粉丝-500',
        hintColor: 'positive',
        skillGains: { contentSkill: 12, brandSkill: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          addReputation(s, 8);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          addFollowers(s, -500);
        },
        log: '37岁，你公开发了一篇"自我批判"，质疑自己最出名的那个概念。学界震动，有人说你"晚节不保"，更多人说你"这才是真活人"。你宁愿做一个会犯错的活人，也不做一个被供着的牌位。思想的命，在于流动。',
      },
      {
        id: 'mentor_next_gen',
        label: '培养下一代思想者，开宗立派',
        description: '从"一个人深刻"变成"一群人深刻"',
        hint: '品牌价值+12 · 受众运营+10 · 幸福+10 · 声誉+10 · 信念+8 · 被动收入+10000/年',
        hintColor: 'positive',
        skillGains: { brandSkill: 12, audienceSkill: 10 },
        passiveIncomeChange: 10000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 10, 0, 100);
          addReputation(s, 10);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '37岁，你办了一个青年思想者计划，亲自带十个有潜力的年轻人。你说："我不缺再写一本书的能力，我缺的是把火种传下去的时间。"两年后其中三个人已经崭露头角，被业界称为"你的学派"。你成了"开宗立派"的人。',
      },
      {
        id: 'retire_into_thought',
        label: '退出公共视野，回到纯粹思考',
        description: '功成身退，把舞台让给后来者',
        hint: '内容创作+10 · 幸福+12 · 健康+8 · 压力-12 · 声誉+8 · 信念+10',
        hintColor: 'positive',
        skillGains: { contentSkill: 10 },
        isRestOption: true,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 12, 0, 100);
          s.health = clamp(s.health + 8, 0, 100);
          s.stress = clamp(s.stress - 12, 0, 100);
          addReputation(s, 8);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
        },
        log: '37岁，你宣布停更所有公共平台，回到书房。你说"该说的话说完了，剩下的留给后来人"。你不再追热点、不再发声、不再露面，但你写的书还在被一版再版。你用"消失"完成了最后的"存在"——真正的思想者，连退场都是一种思想。',
      },
    ],
  },
];

// ============================================================
// 跨分支事件 (ages 26-38)
// ============================================================

const crossBranchEvents: NarrativeEvent[] = [

  // 27岁：平台算法末日
  {
    id: 'ip_cross_algorithm_doomsday',
    title: '改天换日',
    sceneTag: 'home',
    pathId: 'super_ip',
    ageRange: [27, 27],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你依赖的那个平台，毫无预兆地改了算法。一夜之间，你的内容触达率掉了70%。你辛苦积累的粉丝，再也刷不到你了。同行群里一片哀嚎，有人一夜回到解放前。\n' +
      '你刷新了一整天后台，数字像被人按了暂停。你想起一句话："在别人的地盘盖房子，房子再好也是别人的。"你的粉丝、你的流量、你的生意，本质都是平台"租"给你的。\n' +
      '你看着那个暴跌的曲线，第一次真切地理解了超级IP这条路的终极命题：怎么把"租来的"变成"自己的"？',
    options: [
      {
        id: 'migrate_private',
        label: '全力把粉丝导入私域',
        description: '把"平台的粉丝"变成"你的粉丝"',
        hint: '受众运营+12 · 品牌价值+8 · 存款-8000 · 压力+8 · 粉丝+500 · 声誉+3',
        hintColor: 'positive',
        skillGains: { audienceSkill: 12, brandSkill: 8 },
        savingsChange: -8000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          addFollowers(s, 500);
          addReputation(s, 3);
        },
        log: '27岁，你花了三个月把平台粉丝导入了自己的社群和邮件列表。迁移率只有三成，但这三成是你真正的资产。半年后平台又改了次算法，别人哀嚎时你很平静——因为你的命，终于在自己手里了。',
      },
      {
        id: 'multi_platform_hedge',
        label: '全平台铺开，分散风险',
        description: '不把鸡蛋放在一个篮子里',
        hint: '受众运营+10 · 内容创作+6 · 压力+6 · 粉丝+800',
        hintColor: 'positive',
        skillGains: { audienceSkill: 10, contentSkill: 6 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          addFollowers(s, 800);
        },
        log: '27岁，你把内容同步到了所有平台。累是真累，但哪个平台抽风你都不慌。你成了"全平台博主"，但也付出了代价：你的精力被切碎，每个平台都做不深。',
      },
      {
        id: 'adapt_new_rule',
        label: '研究新算法，顺应规则',
        description: '打不过就加入',
        hint: '内容创作+10 · 受众运营+8 · 压力+5 · 粉丝+600 · 信念+3',
        hintColor: 'positive',
        skillGains: { contentSkill: 10, audienceSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          addFollowers(s, 600);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '27岁，你花了两周拆解新算法，调整了内容结构。流量回来了七成，但你心里有根刺：你是在"伺候算法"，不是在"做内容"。你赢了这场，但你知道，下个改版还会来。',
      },
    ],
  },

  // 30岁：被抵制企图
  {
    id: 'ip_cross_cancellation_attempt',
    title: '罗生门',
    sceneTag: 'home',
    pathId: 'super_ip',
    ageRange: [30, 30],
    priority: 6,
    weight: 7,
    oncePerGame: true,
    narrative:
      '一个匿名账号发长贴"扒"你，把你五年前的旧发言、断章取义的截图、甚至你和朋友的私下聊天记录全晒了出来，标题是《扒一扒某知名IP的真面目》。一夜之间转发过万。\n' +
      '你最害怕的是那条"私下聊天"——你说过一些当时觉得是朋友间吐槽、现在看完全政治不正确的话。你不知道是谁泄的密，但你信任的圈子裂开了一道缝。\n' +
      '你盯着那条热搜，手脚冰凉。你第一次理解了"互联网是有记忆的"这句话的恐怖——你五年前的一句话，可以今天才来审判你。而审判你的，是一群根本不认识你的人。',
    options: [
      {
        id: 'transparent_response',
        label: '坦诚回应，承认错误并交代背景',
        description: '不躲，把完整上下文摆出来',
        hint: '品牌价值+10 · 受众运营+6 · 压力+10 · 声誉+6 · 信念+5 · 粉丝-1000',
        hintColor: 'positive',
        skillGains: { brandSkill: 10, audienceSkill: 6 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          addReputation(s, 6);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          addFollowers(s, -1000);
        },
        log: '30岁，你发了篇长文，承认那些话确实说过，交代了完整的上下文，为不当言论道歉，但没有为没说过的话认罪。舆论分化，但大部分理性的人站了你。你用"坦诚"扛过了这次——但你也从此学会了"任何话都可能被录音"。',
      },
      {
        id: 'legal_action',
        label: '查泄密者，追究隐私泄露责任',
        description: '私下聊天被曝光是违法的，用法律反击',
        hint: '品牌价值+6 · 压力+8 · 存款-12000 · 声誉+4 · 信念+4',
        hintColor: 'neutral',
        skillGains: { brandSkill: 6 },
        savingsChange: -12000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          addReputation(s, 4);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '30岁，你报了警，查出泄密的是一个曾经合作过又闹翻的前助理。对方被追究了隐私泄露责任，但这件事也让你再不敢轻易信任身边人。你赢得了法律，却输掉了对人的一部分信任。',
      },
      {
        id: 'lay_low_wait',
        label: '冷处理，等风波自己过去',
        description: '互联网记忆只有七天',
        hint: '受众运营+4 · 压力-4 · 声誉-2 · 粉丝-2000',
        hintColor: 'negative',
        skillGains: { audienceSkill: 4 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 4, 0, 100);
          addReputation(s, -2);
          addFollowers(s, -2000);
        },
        log: '30岁，你没回应，停更了两周。热度确实退了，但那篇扒皮文章还在搜索引擎前列。你换来了暂时的平静，却把解释权让给了别人。半年后还有人拿这事问你，你才后悔当初没把话说清楚。',
      },
    ],
  },

  // 32岁：倦怠
  {
    id: 'ip_cross_burnout',
    title: '空了',
    sceneTag: 'home',
    pathId: 'super_ip',
    ageRange: [32, 32],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    conditions: (s) => s.stress >= 50 || s.happiness <= 40,
    narrative:
      '你坐在电脑前，光标闪了两个小时，一个字没写。你打开以前的内容，那种"想表达"的冲动消失了。你不是没灵感，是没热情。\n' +
      '你做了十年内容，把所有想说的都说尽了。你曾经为一条爆款兴奋整夜，现在百万播放只让你觉得"又一条而已"。你的情绪被流量磨平了，你的表达被算法驯化了，你的人被"IP"两个字掏空了。\n' +
      '伴侣说你"像个演员，下了台还在演"。你愣住——你已经分不清，镜头前的你和镜头后的你，哪个是真的。你倦怠了，不是身体，是灵魂。',
    options: [
      {
        id: 'real_sabbatical',
        label: '彻底停更半年，去生活',
        description: '不创作，只生活，重新积攒表达的欲望',
        hint: '压力-15 · 健康+10 · 幸福+10 · 内容创作+6 · 信念+6 · 粉丝-3000',
        hintColor: 'positive',
        skillGains: { contentSkill: 6 },
        isRestOption: true,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 15, 0, 100);
          s.health = clamp(s.health + 10, 0, 100);
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          addFollowers(s, -3000);
        },
        log: '32岁，你停更半年，去了趟没人认识你的地方。前两个月你焦虑得想回来，第三个月你开始重新注意到风吹过树叶的声音。回来后你写的东西变了——多了烟火气，少了表演感。你用"停下来"换回了"想说话"的能力。',
      },
      {
        id: 'change_medium',
        label: '换个媒介，重新找新鲜感',
        description: '从文字转视频，或从视频转播客',
        hint: '内容创作+12 · 受众运营+6 · 压力+6 · 粉丝+1000 · 信念+5',
        hintColor: 'positive',
        skillGains: { contentSkill: 12, audienceSkill: 6 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          addFollowers(s, 1000);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '32岁，你从文字创作者转去做播客。新媒介的笨拙感反而点燃了你——你重新像个新手一样兴奋。倦怠不是没灵感，是太熟练。换个赛道，你又找回了"不会"的快乐。',
      },
      {
        id: 'therapy_support',
        label: '寻求心理咨询，处理内在问题',
        description: '倦怠是表象，内在的空洞需要专业帮助',
        hint: '幸福+12 · 压力-10 · 健康+6 · 信念+4 · 存款-6000',
        hintColor: 'positive',
        savingsChange: -6000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 12, 0, 100);
          s.stress = clamp(s.stress - 10, 0, 100);
          s.health = clamp(s.health + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '32岁，你开始看心理咨询师。你慢慢看清了：你的倦怠源于"把被关注当成了被爱"。当流量不再给你刺激，你就觉得空。你学会了不靠数据定义自己——这比任何爆款都治愈。',
      },
    ],
  },

  // 34岁：遇见偶像
  {
    id: 'ip_cross_meet_idol',
    title: '神坛',
    sceneTag: 'conference',
    pathId: 'super_ip',
    ageRange: [34, 34],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '在一个行业活动上，你被引荐给你入行时的偶像——那个你22岁贴在床头、每条内容都逐字拆解过的前辈。你紧张得手心出汗，准备了一肚子想说的话。\n' +
      '可真见到了，你发现TA比镜头里老、比想象中疲惫、说话带着掩饰不住的倦意。TA客气地夸了你两句"后生可畏"，就低头看手机了。你站在原地，像小时候发现圣诞老人是爸爸扮的那种失落。\n' +
      '你忽然明白了一件事：你崇拜的从来不是那个人，是你想象中的那个"完美的自己"。神坛上没有神，只有一个个和你一样疲惫、一样挣扎、一样会老的人。你跪了十二年，跪的是自己的影子。',
    options: [
      {
        id: 'learn_from_flaws',
        label: '从偶像的"不堪"里学到教训',
        description: '看清前辈的局限，避免重蹈覆辙',
        hint: '内容创作+10 · 品牌价值+8 · 信念+6 · 幸福+4 · 声誉+3',
        hintColor: 'positive',
        skillGains: { contentSkill: 10, brandSkill: 8 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.happiness = clamp(s.happiness + 4, 0, 100);
          addReputation(s, 3);
        },
        log: '34岁，你没失望，反而清醒了。你看着前辈的现状，暗暗记下"我不要变成那样"。你不再追偶像，开始做自己。你明白了：成长不是站到偶像身边，是从偶像身上走开。',
      },
      {
        id: 'befriend_peer',
        label: '把TA当同行而非神，建立平等关系',
        description: '神坛塌了，但你们可以做朋友',
        hint: '品牌价值+10 · 受众运营+8 · 幸福+6 · 信念+4 · 粉丝+500',
        hintColor: 'positive',
        skillGains: { brandSkill: 10, audienceSkill: 8 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          addFollowers(s, 500);
        },
        log: '34岁，你主动约前辈喝了顿酒，聊的都是行业里的难。你们成了忘年交。你发现：去掉光环，TA只是个比你早走了十年的同行。你不再仰望，但多了个能说真话的人。',
      },
      {
        id: 'mentor_others',
        label: '主动去做别人的"前辈"',
        description: '既然神坛是空的，就别让别人再跪',
        hint: '品牌价值+12 · 受众运营+10 · 幸福+8 · 声誉+6 · 信念+6 · 粉丝+1500',
        hintColor: 'positive',
        skillGains: { brandSkill: 12, audienceSkill: 10 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          addReputation(s, 6);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          addFollowers(s, 1500);
        },
        log: '34岁，你开始有意识地提携新人，但从不让他们把你当神。你常说："我也是个会犯错的人。"你把"去神化"当成了传承的一部分——你不想造新的神坛，你想让后辈一开始就站着走路。',
      },
    ],
  },
];

// ============================================================
// 危机事件 (ages 26-38, eventType: 'crisis')
// ============================================================

const crisisEvents: NarrativeEvent[] = [

  // 33岁：大规模取消
  {
    id: 'ip_crisis_mass_cancel',
    title: '众叛',
    sceneTag: 'home',
    pathId: 'super_ip',
    ageRange: [33, 33],
    priority: 9,
    weight: 10,
    oncePerGame: true,
    eventType: 'crisis',
    conditions: (s) => getReputation(s) >= 40,
    narrative:
      '一场完美的风暴砸向你。你的一条内容被断章取义截取，配上煽动性文案被营销号大肆转发。紧接着，有人翻出你七年前的旧账，有人编造你的"黑料"，有人号召"全网抵制"。\n' +
      '48小时内，你掉粉三十万，合作品牌全部暂停，平台给你打了"风险标签"。你的私信箱塞满死亡威胁，你的家人信息被人肉，你的伴侣不敢出门。你坐在拉上窗帘的房间里，手机调成静音，第一次理解了"社死"两个字的分量。\n' +
      '你想起25岁那个雄心勃勃要做"超级IP"的自己。你赌的是"名字是永远的资产"，现在这个名字成了所有人都能踩一脚的靶子。你第一次怀疑：在这场豪赌里，你是不是把灵魂也押了出去？',
    options: [
      {
        id: 'stand_ground',
        label: '硬扛，用事实和法律逐一反击',
        description: '不认罪，逐一辟谣，起诉造谣者',
        hint: '品牌价值+10 · 压力+15 · 健康-10 · 幸福-10 · 声誉+8 · 存款-30000 · 信念+10',
        hintColor: 'danger',
        skillGains: { brandSkill: 10 },
        savingsChange: -30000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.health = clamp(s.health - 10, 0, 100);
          s.happiness = clamp(s.happiness - 10, 0, 100);
          addReputation(s, 8);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
        },
        log: '33岁，你没认怂。你花了半年逐条辟谣、起诉了三个造谣账号、赢了两个。真相慢慢浮出来，掉的粉回来了一部分。但你瘦了十五斤，落下了失眠的毛病。你赢了这场战役，但你的身体替你付了账单。',
      },
      {
        id: 'sincere_apology',
        label: '公开道歉，为可道歉的部分认错',
        description: '不为没做的事认罪，但为做错的事真诚道歉',
        hint: '品牌价值+6 · 压力+12 · 声誉+5 · 幸福-5 · 信念+4 · 粉丝-15000',
        hintColor: 'neutral',
        skillGains: { brandSkill: 6 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.happiness = clamp(s.happiness - 5, 0, 100);
          addReputation(s, 5);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          addFollowers(s, -15000);
        },
        log: '33岁，你发了一篇长文，为你确实说过的不当言论道歉，但拒绝为编造的罪名认罪。舆论分化但逐渐平息。你损失了大量粉丝，却保住了"知错能改"的信誉。你学到：危机里最难的不是反击，是分辨哪些该认、哪些不能认。',
      },
      {
        id: 'disappear_reinvent',
        label: '彻底消失，换个身份重新来过',
        description: '这个名字已经废了，另起炉灶',
        hint: '内容创作+8 · 压力+8 · 声誉-15 · 粉丝-40000 · 信念-10 · 存款-10000',
        hintColor: 'negative',
        skillGains: { contentSkill: 8 },
        savingsChange: -10000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          addReputation(s, -15);
          addFollowers(s, -40000);
          s.pathFaith = clamp(s.pathFaith - 10, 0, 100);
        },
        log: '33岁，你注销了所有账号，消失了半年。半年后你用一个全新的身份重新开始，没人知道你就是当年那个人。你保住了命，却丢了十年的积累。你常常在深夜想：那个被你亲手埋掉的名字，值不值得？',
      },
    ],
  },

  // 35岁：平台封号
  {
    id: 'ip_crisis_platform_ban',
    title: '一键清零',
    sceneTag: 'home',
    pathId: 'super_ip',
    ageRange: [35, 35],
    priority: 9,
    weight: 10,
    oncePerGame: true,
    eventType: 'crisis',
    conditions: (s) => getFollowers(s) >= 20000,
    narrative:
      '没有任何预警。你早上醒来想发条内容，发现账号被永久封禁。理由是"违反社区规范"，但具体哪条没说。你申诉，机器回复；你找客服，永远是排队中。\n' +
      '你经营多年的账号、所有内容、所有数据，一键清零。你打开其他平台，发现因为"主号被封"，其他平台也开始限流你。你辛辛苦苦攒下的数万粉丝、你以为属于自己的"个人品牌"，原来都建立在一串你并不拥有的平台代码上。\n' +
      '你坐在空荡的房间里，第一次彻底理解了"超级IP"这条路最大的谎言：你以为"你是自己的资产"，其实你的资产是平台随时能删的数据。你赌的"名字是永远的"，原来"名字"也需要平台才能被人听见。',
    options: [
      {
        id: 'rebuild_private',
        label: '靠私域社群从头重建',
        description: '你还有那批真粉丝的联系方式',
        hint: '受众运营+12 · 品牌价值+8 · 压力+15 · 健康-6 · 声誉+4 · 粉丝-70% · 被动收入-3000/年',
        hintColor: 'positive',
        skillGains: { audienceSkill: 12, brandSkill: 8 },
        passiveIncomeChange: -3000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.health = clamp(s.health - 6, 0, 100);
          addReputation(s, 4);
          addFollowers(s, -Math.floor(getFollowers(s) * 0.7));
        },
        log: '35岁，你靠着多年前导出的私域名单，一个一个把真粉重新聚起来。一年后你重建了三成规模，但都是死忠。你把这次"清零"当成了教训：从今往后，任何粉丝都先沉淀到自己的池子里。你输了一次，但再不会输第二次。',
      },
      {
        id: 'diversify_everywhere',
        label: '全平台重建，绝不再依赖单一平台',
        description: '在五个平台同时从零开始',
        hint: '受众运营+12 · 内容创作+8 · 压力+12 · 粉丝-80% · 信念+4',
        hintColor: 'positive',
        skillGains: { audienceSkill: 12, contentSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          addFollowers(s, -Math.floor(getFollowers(s) * 0.8));
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '35岁，你在五个平台同时重新开始。前半年每个平台都从零涨，累得脱相。但你立下了铁律：任何一个平台的粉丝都不超过总量四成。你用一次"清零"的代价，换来了真正的"反脆弱"。',
      },
      {
        id: 'sue_platform',
        label: '起诉平台，公开维权',
        description: '你的内容是你的财产，平台无权随便删',
        hint: '品牌价值+10 · 压力+15 · 存款-30000 · 声誉+8 · 信念+8',
        hintColor: 'danger',
        skillGains: { brandSkill: 10 },
        savingsChange: -30000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          addReputation(s, 8);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '35岁，你把平台告上了法庭，案件引起了行业关注。两年后你赢了部分诉求，平台公开道歉并恢复了你的部分内容。你成了一场行业讨论的导火索：创作者的内容到底归谁？你输了两年时间和大量金钱，却赢得了"创作者权利"这块更大的牌。',
      },
    ],
  },

  // 37岁：抄袭指控
  {
    id: 'ip_crisis_plagiarism',
    title: '贼喊捉贼',
    sceneTag: 'home',
    pathId: 'super_ip',
    ageRange: [37, 37],
    priority: 9,
    weight: 10,
    oncePerGame: true,
    eventType: 'crisis',
    conditions: (s) => getReputation(s) >= 50,
    narrative:
      '一个比你更早成名的前辈公开指控你"抄袭"——说你最火的那套理论体系，是搬运了TA十年前一本无人问津的旧书。TA晒出了"时间线证据"，配文《某当红IP的学术不端》。\n' +
      '你的粉丝炸了，路人开始站队。你心里清楚：你的体系确实受过TA那本书的启发，但你做了大量原创重构，并非抄袭。可"启发"和"抄袭"之间的界线，在舆论场上根本说不清。\n' +
      '你最怕的是TA晒出的那张"早期笔记"——你确实在自己的读书笔记里大段摘抄过TA的原话，还标了"金句存档"。这张笔记一旦流出，你就百口莫辩。你做了十几年内容，第一次被逼到墙角：你引以为傲的"原创"，到底有几分是真的？',
    options: [
      {
        id: 'full_transparency',
        label: '公开全部笔记和创作过程，自证清白',
        description: '把启发来源、重构逻辑全摆出来',
        hint: '品牌价值+10 · 内容创作+10 · 压力+15 · 声誉+10 · 信念+10 · 粉丝-2000',
        hintColor: 'positive',
        skillGains: { brandSkill: 10, contentSkill: 10 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          addReputation(s, 10);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          addFollowers(s, -2000);
        },
        log: '37岁，你把十几年的创作笔记、引用来源、重构过程全部公开了。舆论反转——大部分人承认你是"站在巨人肩上"而非"抄袭"。那位前辈也偃旗息鼓。你用"彻底透明"扛过了这次，但也立下了一个规矩：从今往后，任何引用都标注来源。你的"原创"二字，从此经得起放大镜。',
      },
      {
        id: 'settle_privately',
        label: '私下和解，给前辈署名致谢',
        description: '不公开撕，给对方面子也给自己台阶',
        hint: '品牌价值+6 · 压力+8 · 声誉+2 · 存款-20000 · 信念-4',
        hintColor: 'neutral',
        skillGains: { brandSkill: 6 },
        savingsChange: -20000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          addReputation(s, 2);
          s.pathFaith = clamp(s.pathFaith - 4, 0, 100);
        },
        log: '37岁，你私下联系了那位前辈，承认了"启发来源"并在新版书里加了致谢，对方撤回了指控。风波平息了，但"和解"在舆论眼里约等于"心虚"。你保住了体面，却永远洗不掉那层疑云——你知道，这是你为"年轻时不严谨"付的利息。',
      },
      {
        id: 'counter_sue',
        label: '反诉对方诽谤，硬刚到底',
        description: '你说我抄，我就告你毁谤',
        hint: '品牌价值+8 · 压力+15 · 健康-6 · 存款-30000 · 声誉+6 · 信念+6',
        hintColor: 'danger',
        skillGains: { brandSkill: 8 },
        savingsChange: -30000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.health = clamp(s.health - 6, 0, 100);
          addReputation(s, 6);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '37岁，你反诉了那位前辈诽谤。官司打了两年，你赢了，但赢得很难看——法庭认定不构成抄袭，却也指出你"引用规范存在瑕疵"。你赢了法理，输了部分人心。你明白了：有些仗，赢了也是输。',
      },
    ],
  },
];

// ============================================================
// 合并所有事件
// ============================================================

export const IP_NARRATIVE_EVENTS: NarrativeEvent[] = [
  ...commonEvents,
  ...branchSelectEvent,
  ...educatorEvents,
  ...entertainerEvents,
  ...thoughtLeaderEvents,
  ...crossBranchEvents,
  ...crisisEvents,
];

// ============================================================
// 超级IP路径 - 叙事成就触发系统
//
// 3条分支 × 3个等级 = 9个成就。
// 技能达标后自动触发，给玩家里程碑式的成就感。
// 初级/中级成就改变人生轨迹，终极成就触发退休判定。
//
// 技能维度：
//   - contentSkill  内容创作能力 (0-100)
//   - audienceSkill 受众运营能力 (0-100)
//   - brandSkill    品牌价值 (0-100)
// ============================================================

// ------------------------------------------------------------
// 知识付费线 (ip_educator) —— 把你懂的变成可复制的价值
// ------------------------------------------------------------

const educatorAchievements: NarrativeAchievement[] = [
  // 初级：第一门爆款课
  {
    id: 'super_ip_educator_1',
    title: '第一门爆款课',
    narrative: `你的课程销量破了一万份。后台的数字跳过那个临界点时，你盯着屏幕愣了很久。\n\n你想起26岁上架第一门课时失眠到四点的自己，想起那条让你自我怀疑一整天的差评。一万个人愿意为你说的东西付钱——这不是"割韭菜"，这是有人真的相信你能帮到他们。你第一次觉得，"知识付费"四个字，你配得上。`,
    pathId: 'super_ip',
    branch: 'ip_educator',
    level: 1,
    skillRequirements: { contentSkill: 35 },
    stateEffect: (state) => {
      state.passiveIncome = (state.passiveIncome || 0) + 20000;
      state.pathFaith = Math.min(100, state.pathFaith + 10);
      addReputation(state, 8);
    },
    log: `你的课程销量破万。被动收入+20000/年，声誉大涨。你终于把"会的东西"变成了"卖得动的东西"。`,
  },

  // 中级：行业头牌讲师
  {
    id: 'super_ip_educator_2',
    title: '行业头牌讲师',
    narrative: `提到你这个领域的学习，绕不开你的名字。你的课程成了"入门必学"，你的社群成了"圈子门票"。\n\n一个行业前辈在饭局上说："现在这行的新人，十个有八个是你带出来的。"你笑笑没接话，但心里翻江倒海。你想起25岁那个在出租屋里录第一节课的自己——你赌的是"教别人"永远有需求，现在这句话兑现了。你不再是一个"卖课的"，你成了一个领域的"守门人"。`,
    pathId: 'super_ip',
    branch: 'ip_educator',
    level: 2,
    skillRequirements: { contentSkill: 55, audienceSkill: 45 },
    passiveIncomeChange: 25000,
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 8);
      addReputation(state, 10);
    },
    log: `你成了这个领域的头牌讲师，课程成了"入门必学"。被动收入+25000/年。你从"卖课的"变成了"守门人"。`,
  },

  // 终极：开宗立派
  {
    id: 'super_ip_educator_3',
    title: '开宗立派',
    narrative: `你办了一场"毕业生大会"，台下坐着上千个你带出来的人，其中几十个已经成了各自细分领域的头部。他们管自己叫"你的学派"。\n\n你站在台上，看着这些曾经连选题都发愁的年轻人，如今比你当年更耀眼。你想起37岁那个学生问你"老师，怎么才能像您一样"的自己。你说了句你花了十年才懂的话："别学我，去超过我。"台下掌声雷动。你终于理解了做老师的最高境界：不是让自己永远站在前面，是让越来越多的人站到你前面去。超级IP的终点，不是一个人红，是让一群人发光。`,
    pathId: 'super_ip',
    branch: 'ip_educator',
    level: 3,
    skillRequirements: { contentSkill: 75, audienceSkill: 60, brandSkill: 55 },
    savingsChange: 120000,
    stateEffect: (state) => {
      state.passiveIncome = (state.passiveIncome || 0) + 25000;
      state.pathFaith = Math.min(100, state.pathFaith + 10);
      addReputation(state, 15);
    },
    log: `你开宗立派，带出了一整代行业新人。你的"学派"成了这个领域的代名词。品牌估值变现12万，被动收入+25000/年。`,
    triggersRetirementCheck: true,
  },
];

// ------------------------------------------------------------
// 泛娱乐线 (ip_entertainer) —— 用流量撬动一切
// ------------------------------------------------------------

const entertainerAchievements: NarrativeAchievement[] = [
  // 初级：百万播放常客
  {
    id: 'super_ip_entertainer_1',
    title: '百万播放常客',
    narrative: `你最近十条内容里有七条破了百万播放。你不再是"偶尔爆一下"的博主，你成了"稳定产出爆款"的选手。\n\n你打开后台，曲线不再是过山车，而是一条稳步上扬的山脊。粉丝涨到了几十万，私信箱每天爆满。你想起26岁那个对着两千万播放失眠一夜的自己——那时你以为"火"是终点，现在你知道"稳定地火"才是真本事。流量不再是运气，是你的手艺。`,
    pathId: 'super_ip',
    branch: 'ip_entertainer',
    level: 1,
    skillRequirements: { audienceSkill: 35 },
    stateEffect: (state) => {
      state.passiveIncome = (state.passiveIncome || 0) + 15000;
      state.pathFaith = Math.min(100, state.pathFaith + 10);
      addFollowers(state, 50000);
    },
    log: `你成了百万播放常客，粉丝暴涨5万。被动收入+15000/年。流量不再是运气，是你的手艺。`,
  },

  // 中级：品牌方排队
  {
    id: 'super_ip_entertainer_2',
    title: '品牌方排队',
    narrative: `你的商务档期排到了半年后，单条报价六位数起。品牌方不再跟你讨价还价，而是问"您最近有空吗"。\n\n你拒掉了八成邀约，只接那些配得上你名字的。你想起28岁那个为五十万单子纠结的自己——现在你有了说"不"的底气。定价权的本质不是"敢报高价"，是"敢拒高价"。你不再是个"接广告的博主"，你是个"挑品牌的IP"。`,
    pathId: 'super_ip',
    branch: 'ip_entertainer',
    level: 2,
    skillRequirements: { audienceSkill: 55, brandSkill: 45 },
    savingsChange: 80000,
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 8);
      addReputation(state, 8);
    },
    log: `品牌方排队找你，单条报价六位数。商务收入入账8万。你从"接广告的"变成了"挑品牌的"。`,
  },

  // 终极：全民IP
  {
    id: 'super_ip_entertainer_3',
    title: '全民IP',
    narrative: `你的名字成了某种文化符号。走在街上被认出来，上个热搜是日常，连不刷短视频的长辈都知道你。\n\n一个品牌总监在签约仪式上说："我们要的不是曝光，是'你'这个名字本身。"你看着合同上那个比你想象中还大的数字，想起12年前对着空房间说话的自己。你赌的是"注意力是最贵的资源"——现在这句话兑现得超出了你的想象。但你也清楚：全民IP是把双刃剑，你能影响百万人，也能被百万人撕碎。你站在顶峰，既自由，又孤独。这，就是超级IP的代价与荣光。`,
    pathId: 'super_ip',
    branch: 'ip_entertainer',
    level: 3,
    skillRequirements: { audienceSkill: 75, brandSkill: 60, contentSkill: 50 },
    savingsChange: 200000,
    stateEffect: (state) => {
      state.passiveIncome = (state.passiveIncome || 0) + 25000;
      state.pathFaith = Math.min(100, state.pathFaith + 10);
      addReputation(state, 15);
    },
    log: `你成了全民IP，名字成了文化符号。品牌签约入账20万，被动收入+25000/年。你站在顶峰，既自由又孤独。`,
    triggersRetirementCheck: true,
  },
];

// ------------------------------------------------------------
// 思想领袖线 (ip_thought_leader) —— 把名字变成观点
// ------------------------------------------------------------

const thoughtLeaderAchievements: NarrativeAchievement[] = [
  // 初级：著作等身
  {
    id: 'super_ip_thought_leader_1',
    title: '著作等身',
    narrative: `你的第一本书加印了五次，被几所大学列为推荐读物。你在书店看到自己的书摆在显眼的位置，愣了半分钟才敢走过去。\n\n你想起27岁那个对着空文档一个字写不出的自己。你赌的是"深刻能活很久"，现在这句话第一次兑现了。你的思想不再是"网络观点"，它印成了铅字，进了课堂，成了"知识"。你第一次觉得，"思想领袖"四个字，你慢慢配得上了。`,
    pathId: 'super_ip',
    branch: 'ip_thought_leader',
    level: 1,
    skillRequirements: { contentSkill: 35 },
    stateEffect: (state) => {
      state.passiveIncome = (state.passiveIncome || 0) + 12000;
      state.pathFaith = Math.min(100, state.pathFaith + 10);
      addReputation(state, 10);
    },
    log: `你的书加印五次，进了大学课堂。被动收入+12000/年。你的思想从"网络观点"变成了"知识"。`,
  },

  // 中级：公共话语
  {
    id: 'super_ip_thought_leader_2',
    title: '公共话语',
    narrative: `你提出的一个概念被主流媒体反复引用，被写进了行业报告，甚至出现在政策文件里。你的思想，真的成了公共话语的一部分。\n\n一个记者采访时问你："您怎么看自己的观点被这么多人使用、甚至误用？"你沉默了一会儿说："思想一旦离开我，就不再只属于我。我能做的，只有让它尽量清晰。"你想起31岁那个害怕"思想失控"的自己——现在你接受了：真正深刻的思想，注定要被误读，也注定会比它的提出者活得更久。`,
    pathId: 'super_ip',
    branch: 'ip_thought_leader',
    level: 2,
    skillRequirements: { contentSkill: 55, brandSkill: 50 },
    passiveIncomeChange: 25000,
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 8);
      addReputation(state, 12);
    },
    log: `你的概念成了公共话语，被媒体和政策反复引用。被动收入+25000/年，声誉大涨。你的思想比你的名字活得更广。`,
  },

  // 终极：思想不朽
  {
    id: 'super_ip_thought_leader_3',
    title: '思想不朽',
    narrative: `一个研究生在博士论文答辩时被问："这个概念的提出者还活着吗？"学生说："活着，才38岁。"全场笑了，你听转述时却红了眼眶。\n\n你想起12年前那个在出租屋里写第一篇长文的自己。你赌的是"流量会散，热点会过，但一个深刻的观点可以活很多年"——现在这句话兑现得连你自己都惊讶。你的思想进了教材、进了论文、进了后来者的引用。你成了一个"活着就被经典化"的人。但你也清楚：思想的最高处是悬崖，你说的每个字都可能影响千万人的命运。你用"深刻"换来了不朽，也换来了沉甸甸的责任。这，就是思想领袖的归途。`,
    pathId: 'super_ip',
    branch: 'ip_thought_leader',
    level: 3,
    skillRequirements: { contentSkill: 75, brandSkill: 60, audienceSkill: 50 },
    savingsChange: 150000,
    stateEffect: (state) => {
      state.passiveIncome = (state.passiveIncome || 0) + 25000;
      state.pathFaith = Math.min(100, state.pathFaith + 10);
      addReputation(state, 15);
    },
    log: `你的思想被经典化，活着就成了"被引用的大师"。著作版税与讲学变现15万，被动收入+25000/年。你用深刻换来了不朽。`,
    triggersRetirementCheck: true,
  },
];

// ============================================================
// 汇总：超级IP全部成就（按 分支 → 等级 排序）
// 排序保证 checkAchievements 优先返回低等级成就，
// 让玩家按 level 1 → 2 → 3 的自然顺序解锁。
// ============================================================
export const IP_ACHIEVEMENTS: NarrativeAchievement[] = [
  ...educatorAchievements,
  ...entertainerAchievements,
  ...thoughtLeaderAchievements,
];

// ============================================================
// 自动注册（模块加载时执行）
// ============================================================
registerNarrativeEvents(IP_NARRATIVE_EVENTS);
registerAchievements(IP_ACHIEVEMENTS);