/**
 * AI共生者路径 - 叙事成就触发系统
 *
 * 3条分支 × 3个等级 = 9个成就。
 * 技能达标后自动触发，给玩家里程碑式的成就感。
 * 初级/中级成就改变人生轨迹，终极成就触发退休判定。
 *
 * 技能维度：
 *   - aiSkill        AI技术能力 (0-100)
 *   - promptMastery  提示词技巧 (0-100)
 *   - aiTraining     模型训练能力 (0-100)
 */
import type { NarrativeAchievement, GameState } from '../types/global.d.js';

// ============================================================
// 技术专家线 (tech_expert) —— 深耕技术，成为不可替代的人
// ============================================================
const techExpertAchievements: NarrativeAchievement[] = [
  // 初级：技术负责人
  {
    id: 'ai_symbiote_tech_expert_1',
    title: '技术负责人',
    narrative: `你被团队推举为AI技术负责人。从写代码的人变成决定写什么代码的人。\n\n会议室里所有人都在等你开口。你清了清嗓子，在白板上画下第一根架构线的那一刻，你突然意识到——以前你是被指挥的人，现在你是那个画方向的人。`,
    pathId: 'ai_symbiote',
    branch: 'tech_expert',
    level: 1,
    skillRequirements: { aiSkill: 40 },
    // 月薪×1.3 为乘性加薪，无法用加性的 salaryChange 表达，故在 stateEffect 中处理
    stateEffect: (state) => {
      // 月薪×1.3（乘性加薪，在 stateEffect 中直接处理）
      state.currentMonthlySalary = Math.round(state.currentMonthlySalary * 1.3);
      // 信念+10（pathFaith 已在 GameState 中类型化，直接赋值）
      state.pathFaith = Math.min(100, state.pathFaith + 10);
    },
    log: `你被推举为AI技术负责人。从今天起，你决定写什么代码。`,
  },

  // 中级：提示词模板爆红
  {
    id: 'ai_symbiote_tech_expert_2',
    title: '提示词模板爆红',
    narrative: `你开源的提示词模板在GitHub上获得了5000+star。猎头开始频繁联系你。\n\n那天你只是随手把用了一年的模板整理了一下传上去，没想到一周后star数像脱缰的野马。你的私信箱塞满了"求合作""求内推""求讲座"。你第一次明白：在AI时代，最好的简历是你公开的作品。`,
    pathId: 'ai_symbiote',
    branch: 'tech_expert',
    level: 2,
    skillRequirements: { promptMastery: 60 },
    passiveIncomeChange: 3000, // 咨询费，被动收入+3000/年
    stateEffect: (state) => {
      // 信念+5
      state.pathFaith = Math.min(100, state.pathFaith + 5);
    },
    log: `你的提示词模板在GitHub爆红，5000+star。猎头开始频繁联系你。`,
  },

  // 终极：大厂挖人
  {
    id: 'ai_symbiote_tech_expert_3',
    title: '大厂挖人',
    narrative: `大厂HR亲自飞来你的城市，开价年薪80万。你看着offer上的数字，想起了22岁那个在出租屋里调提示词的自己。\n\n"我们能为您做点什么？"对面西装革履的HR问。你端起咖啡，杯壁上映出一张比22岁成熟许多的脸。你没急着回答，只是想起那个凌晨三点对着屏幕自言自语的夜晚——那时你赌的未来，正在向你兑现。`,
    pathId: 'ai_symbiote',
    branch: 'tech_expert',
    level: 3,
    skillRequirements: { aiSkill: 70, aiTraining: 50, promptMastery: 50 },
    savingsChange: 200000, // 签约奖金
    stateEffect: (state) => {
      // 月薪翻倍（乘性加薪，在 stateEffect 中直接处理）
      state.currentMonthlySalary = Math.round(state.currentMonthlySalary * 2);
    },
    log: `大厂HR亲自飞来开价年薪80万。你签下了那份offer，签约奖金20万到账。`,
    triggersRetirementCheck: true,
  },
];

// ============================================================
// AI创业线 (ai_startup) —— All in 自己的产品
// ============================================================
const aiStartupAchievements: NarrativeAchievement[] = [
  // 初级：独立产品上线
  {
    id: 'ai_symbiote_startup_1',
    title: '独立产品上线',
    narrative: `你的AI产品终于上线了。第一天只有23个用户，但你激动得睡不着觉。\n\n凌晨两点你刷新后台，数字从0跳到1，再到5、12、23。每一个新增用户都像一束微光。你躺在工位旁的折叠床上，盯着天花板想：这23个人，可能就是你撬动世界的支点。`,
    pathId: 'ai_symbiote',
    branch: 'ai_startup',
    level: 1,
    skillRequirements: { aiSkill: 30, aiTraining: 20 },
    savingsChange: -10000, // 服务器费
    stateEffect: (state) => {
      // 信念+15
      state.pathFaith = Math.min(100, state.pathFaith + 15);
    },
    log: `你的AI产品上线了。第一天23个用户，但你激动得失眠。服务器费花掉一万。`,
  },

  // 中级：融资成功
  {
    id: 'ai_symbiote_startup_2',
    title: '融资成功',
    narrative: `投资人看了你的数据后说"我投了"。你拿到了500万天使轮。你第一次坐在老板椅上，而不是工位上。\n\n会议室的灯很亮，对面那位头发花白的前辈把名片推过来："500万，占股15%。"你签字的手没抖，但出了门你在电梯里靠着墙笑了整整一分钟。这不再是你一个人的赌局了。`,
    pathId: 'ai_symbiote',
    branch: 'ai_startup',
    level: 2,
    skillRequirements: { aiTraining: 40, aiSkill: 40 },
    savingsChange: 500000, // 融资到账
    passiveIncomeChange: 20000, // 被动收入+20000/年
    stateEffect: (state) => {
      // 信念+20
      state.pathFaith = Math.min(100, state.pathFaith + 20);
    },
    log: `投资人一句"我投了"，你拿到了500万天使轮。你第一次坐上老板椅。`,
  },

  // 终极：产品爆火
  {
    id: 'ai_symbiote_startup_3',
    title: '产品爆火',
    narrative: `你的产品在Product Hunt上拿到了当日第一。服务器差点被挤爆。你看着飙升的用户曲线，知道——你赌对了。\n\n凌晨四点，报警短信把你的手机震成一条响不停的虫。你冲进机房般地打开笔记本，看着那条近乎垂直的增长曲线，先是慌，然后笑出了声。多年前那个23个用户的夜晚，原来真的是支点。`,
    pathId: 'ai_symbiote',
    branch: 'ai_startup',
    level: 3,
    skillRequirements: { aiSkill: 60, aiTraining: 60, promptMastery: 40 },
    savingsChange: 1000000,
    passiveIncomeChange: 100000, // 被动收入+100000/年
    log: `你的产品登顶Product Hunt当日第一。服务器差点被挤爆——你赌对了。`,
    triggersRetirementCheck: true,
  },
];

// ============================================================
// 布道师线 (ai_evangelist) —— 教别人用AI，比自己用AI更赚钱
// ============================================================
const aiEvangelistAchievements: NarrativeAchievement[] = [
  // 初级：第一门付费课
  {
    id: 'ai_symbiote_evangelist_1',
    title: '第一门付费课',
    narrative: `你的AI提示词课程上线了。定价299，第一天卖了100份。你意识到——教别人用AI，比自己用AI赚钱。\n\n后台的销售额从0跳到29900，你刷新了三遍确认不是bug。你想起自己第一次写出能用的提示词时，也是这种心跳加速的感觉。原来分享本身就是一种复利。`,
    pathId: 'ai_symbiote',
    branch: 'ai_evangelist',
    level: 1,
    skillRequirements: { promptMastery: 30, aiSkill: 20 },
    passiveIncomeChange: 5000, // 被动收入+5000/年
    stateEffect: (state) => {
      // 信念+10
      state.pathFaith = Math.min(100, state.pathFaith + 10);
    },
    log: `你的AI提示词课程上线，定价299，首日卖出100份。教别人用AI比自用更赚钱。`,
  },

  // 中级：十万粉丝
  {
    id: 'ai_symbiote_evangelist_2',
    title: '十万粉丝',
    narrative: `你的自媒体账号突破了十万粉丝。评论区有人叫你"老师"，有人骂你"割韭菜"。你发现，影响力是一把双刃剑。\n\n粉丝数跳过100000的那一秒你截了图，发了个朋友圈又默默删掉。评论区最高赞是"谢谢老师改变了我"，第二高赞是"又一个割韭菜的"。你关掉手机，第一次认真地想：被看见，是有代价的。`,
    pathId: 'ai_symbiote',
    branch: 'ai_evangelist',
    level: 2,
    skillRequirements: { promptMastery: 50, aiSkill: 40 },
    passiveIncomeChange: 20000, // 广告+课程
    stateEffect: (state) => {
      // 信念+10，压力+10
      state.pathFaith = Math.min(100, state.pathFaith + 10);
      state.stress = Math.min(100, state.stress + 10);
    },
    log: `你的自媒体突破十万粉丝。有人叫你老师，有人骂你割韭菜。影响力是双刃剑。`,
  },

  // 终极：行业大会演讲
  {
    id: 'ai_symbiote_evangelist_3',
    title: '行业大会演讲',
    narrative: `你站在AI开发者大会的舞台上，台下坐着一千人。你讲完最后一个slide，掌声雷动。你突然想起22岁时那个在出租屋里对着屏幕自言自语的自己。\n\n聚光灯很烫，你握着翻页笔的手心全是汗。你说出最后一句"谢谢大家"时，掌声像潮水一样涌上来。你望向黑压压的人头，恍惚间看见那个22岁的自己坐在最后一排，冲你笑了笑。你对TA点了点头。`,
    pathId: 'ai_symbiote',
    branch: 'ai_evangelist',
    level: 3,
    skillRequirements: { promptMastery: 65, aiSkill: 55, aiTraining: 30 },
    savingsChange: 200000, // 演讲费+赞助
    passiveIncomeChange: 50000, // 被动收入+50000/年
    log: `你站上AI开发者大会的舞台，千人掌声雷动。你想起了22岁的自己。`,
    triggersRetirementCheck: true,
  },
];

// ============================================================
// 汇总：AI共生者全部成就（按 分支 → 等级 排序）
// 排序保证 checkAchievements 优先返回低等级成就，
// 让玩家按 level 1 → 2 → 3 的自然顺序解锁。
// ============================================================
export const AI_SYMBIOTE_ACHIEVEMENTS: NarrativeAchievement[] = [
  ...techExpertAchievements,
  ...aiStartupAchievements,
  ...aiEvangelistAchievements,
];

// ============================================================
// 成就触发检测
// 每年调用一次，返回本年应触发的一个成就（或 null）。
// ============================================================

// 所有路径的成就汇总（后续路径的成就将追加到此数组）
export const ALL_ACHIEVEMENTS: NarrativeAchievement[] = [
  ...AI_SYMBIOTE_ACHIEVEMENTS,
  // 其他路径的成就将在各自文件创建后追加
];

/** 动态注册其他路径的成就（在各自模块加载后调用） */
const extraAchievementArrays: NarrativeAchievement[][] = [];
export function registerAchievements(arr: NarrativeAchievement[]) {
  extraAchievementArrays.push(arr);
}

export function checkAchievements(state: GameState): NarrativeAchievement | null {
  // 1. 分支未选定时不触发
  if (state.narrativeBranch === 'unassigned') return null;

  // 2. 汇总所有成就（内置 + 动态注册）
  const allAchs: NarrativeAchievement[] = [...ALL_ACHIEVEMENTS];
  for (const arr of extraAchievementArrays) {
    allAchs.push(...arr);
  }

  // 3. 遍历所有成就，寻找第一个满足条件的
  const skills = state.pathSkills || {};
  for (const ach of allAchs) {
    // 4. 跳过已触发的成就（每个成就只触发一次）
    if (state.triggeredAchievements.includes(ach.id)) continue;

    // 5. 跳过路径不匹配的成就
    if (ach.pathId !== state.retirementPath) continue;

    // 6. 跳过分支不匹配的成就
    if (ach.branch !== state.narrativeBranch) continue;

    // 7. 检查技能要求：所有技能均需达标
    const requirementsMet = Object.entries(ach.skillRequirements).every(
      ([skill, req]) => (skills[skill] ?? 0) >= req,
    );
    if (!requirementsMet) continue;

    // 8. 返回第一个满足条件的成就
    return ach;
  }

  return null;
}
