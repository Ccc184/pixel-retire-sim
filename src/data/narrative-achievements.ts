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
  // 初级：架构之手
  {
    id: 'ai_symbiote_tech_expert_1',
    title: '架构之手',
    narrative: `你被团队推举为AI技术负责人。白板上画下第一根架构线的那一刻，你突然意识到——以前你是被指挥的人，现在你是那个画方向的人。`,
    pathId: 'ai_symbiote',
    branch: 'tech_expert',
    level: 1,
    skillRequirements: { aiSkill: 40 },
    stateEffect: (state) => {
      state.currentMonthlySalary = Math.round(state.currentMonthlySalary * 1.3);
      state.pathFaith = Math.min(100, state.pathFaith + 5);
    },
    log: `你被推举为AI技术负责人。从今天起，你决定写什么代码。`,
  },

  // 中级：范式铸币
  {
    id: 'ai_symbiote_tech_expert_2',
    title: '范式铸币',
    narrative: `你随手把用了一年的方法论整理后开源，一周后引用数像脱缰的野马。私信箱塞满"求合作""求内推""求讲座"。你第一次明白：在AI时代，最好的简历是你公开的作品。`,
    pathId: 'ai_symbiote',
    branch: 'tech_expert',
    level: 2,
    skillRequirements: { promptMastery: 60 },
    passiveIncomeChange: 3000,
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 3);
    },
    log: `你的提示词范式在开发者社区爆火。猎头开始频繁联系你。`,
  },

  // 终极：人机合鸣
  {
    id: 'ai_symbiote_tech_expert_3',
    title: '人机合鸣',
    narrative: `头部AI集团的HR亲自飞来，开出你不敢想的价码。"我们能为您做点什么？"你端起咖啡，想起出租屋里第一次让AI跑通"Hello World"的夜晚——那时你赌的未来，正在向你兑现。`,
    pathId: 'ai_symbiote',
    branch: 'tech_expert',
    level: 3,
    skillRequirements: { aiSkill: 70, aiTraining: 50, promptMastery: 50 },
    savingsChange: 200000,
    stateEffect: (state) => {
      state.currentMonthlySalary = Math.round(state.currentMonthlySalary * 2);
    },
    log: `头部AI集团邀你出山，开出天价offer。你签下了那份合约。`,
    // 注：移除triggersRetirementCheck——突破是高光不是终点，玩家应继续体验后续内容
  },
];

// ============================================================
// AI创业线 (ai_startup) —— All in 自己的产品
// ============================================================
const aiStartupAchievements: NarrativeAchievement[] = [
  // 初级：冷启动
  {
    id: 'ai_symbiote_startup_1',
    title: '冷启动',
    narrative: `你的AI产品上线了。凌晨两点你刷新后台，数字从0跳到1，再到5、12、23——每一个新增用户都像一束微光。你盯着天花板想：这23个人，可能就是你撬动世界的支点。`,
    pathId: 'ai_symbiote',
    branch: 'ai_startup',
    level: 1,
    skillRequirements: { aiSkill: 30, aiTraining: 20 },
    savingsChange: -10000,
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 8);
    },
    log: `你的AI产品上线了。第一天23个用户，但你激动得失眠。服务器费花掉一万。`,
  },

  // 中级：资本注血
  {
    id: 'ai_symbiote_startup_2',
    title: '资本注血',
    narrative: `投资人看了你的数据后说"我投了"。白发前辈把名片推过来："500万，占股15%。"你签字的手没抖，出了门却在电梯里靠着墙笑了整整一分钟。这不再是你一个人的赌局了。`,
    pathId: 'ai_symbiote',
    branch: 'ai_startup',
    level: 2,
    skillRequirements: { aiTraining: 40, aiSkill: 40 },
    savingsChange: 500000,
    passiveIncomeChange: 20000,
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 10);
    },
    log: `投资人一句"我投了"，你拿到了500万天使轮。你第一次坐上老板椅。`,
  },

  // 终极：奇点降临
  {
    id: 'ai_symbiote_startup_3',
    title: '奇点降临',
    narrative: `凌晨四点，报警短信把你的手机震成一条响不停的虫。你看着近乎垂直的用户增长曲线，先是慌，然后笑出了声——多年前那个23个用户的夜晚，原来真的是支点。`,
    pathId: 'ai_symbiote',
    branch: 'ai_startup',
    level: 3,
    skillRequirements: { aiSkill: 60, aiTraining: 60, promptMastery: 40 },
    savingsChange: 1000000,
    passiveIncomeChange: 100000,
    log: `你的产品登顶开源榜单。服务器差点被挤爆——你赌对了。`,
    // 注：移除triggersRetirementCheck——突破是高光不是终点，玩家应继续体验后续内容
  },
];

// ============================================================
// 布道师线 (ai_evangelist) —— 教别人用AI，比自己用AI更赚钱
// ============================================================
const aiEvangelistAchievements: NarrativeAchievement[] = [
  // 初级：第一道音
  {
    id: 'ai_symbiote_evangelist_1',
    title: '第一道音',
    narrative: `你的AI课程上线，定价299，首日卖出100份。你刷新三遍确认销售额不是bug——原来分享本身就是一种复利。`,
    pathId: 'ai_symbiote',
    branch: 'ai_evangelist',
    level: 1,
    skillRequirements: { promptMastery: 30, aiSkill: 20 },
    passiveIncomeChange: 5000,
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 5);
    },
    log: `你的AI课程上线，定价299，首日卖出100份。教别人用AI比自用更赚钱。`,
  },

  // 中级：信众十万
  {
    id: 'ai_symbiote_evangelist_2',
    title: '信众十万',
    narrative: `你的频道突破十万关注。你截了图，又默默删掉——评论区最高赞是"谢谢老师改变了我"，第二高赞是"又一个割韭菜的"。你关掉手机，第一次认真地想：被看见，是有代价的。`,
    pathId: 'ai_symbiote',
    branch: 'ai_evangelist',
    level: 2,
    skillRequirements: { promptMastery: 50, aiSkill: 40 },
    passiveIncomeChange: 20000,
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 5);
      state.stress = Math.min(100, state.stress + 10);
    },
    log: `你的频道突破十万关注。有人叫你老师，有人骂你割韭菜。影响力是双刃剑。`,
  },

  // 终极：先知登台
  {
    id: 'ai_symbiote_evangelist_3',
    title: '先知登台',
    narrative: `聚光灯很烫，你握着翻页笔的手心全是汗。你说出"谢谢大家"时，掌声像潮水涌上来。你望向黑压压的人头，恍惚间看见那个深夜里第一次被AI震撼到的年轻人，坐在最后一排冲你点头。`,
    pathId: 'ai_symbiote',
    branch: 'ai_evangelist',
    level: 3,
    skillRequirements: { promptMastery: 65, aiSkill: 55, aiTraining: 30 },
    savingsChange: 200000,
    passiveIncomeChange: 50000,
    log: `你站上AI前沿峰会的舞台，千人掌声雷动。那一刻你知道，你不再是追随者。`,
    // 注：移除triggersRetirementCheck——突破是高光不是终点，玩家应继续体验后续内容
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
