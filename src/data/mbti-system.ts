/**
 * MBTI 人格系统 · 哲学化设计
 *
 * 设计理念：
 *   MBTI 不是性格标签，而是存在主义问卷——
 *   每种类型代表一种"回应世界的方式"，以及这种方式带来的固有困境。
 *   玩家选择的不只是四个字母，而是选择了用哪种哲学视角体验这段人生。
 *
 * 四大气质群（Temperament）：
 *   NT 理性者 — 控制与混沌的张力：理性是盾牌还是牢笼？
 *   NF 理想者 — 意义与现实的撕裂：理想是灯塔还是海市蜃楼？
 *   SJ 守护者 — 责任与欲望的枷锁：坚守是美德还是自我囚禁？
 *   SP 艺术者 — 当下与未来的博弈：活在当下是自由还是逃避？
 *
 * 职业微影响设计原则：
 *   影响极小（2-5%），不改变平衡，只增加"人格感"
 *   每种类型有其优势职业和劣势职业，体现"人职匹配"的真实感
 */

import type { MBTIType, Profession, RetirementPathId, GameState } from '../types/global.d.js';

// ============================================================
// MBTI 类型完整定义
// ============================================================

export interface MBTITrait {
  /** 类型代号 */
  code: MBTIType;
  /** 中文名称 */
  name: string;
  /** 气质群 */
  temperament: 'NT' | 'NF' | 'SJ' | 'SP';
  /** 哲学主题——这个类型终其一生要面对的核心问题 */
  philosophicalTheme: string;
  /** 存在之问——会在独白和事件中回响的问题 */
  existentialQuestion: string;
  /** 核心困境一句话描述 */
  coreDilemma: string;
  /** 优势：这个类型擅长什么 */
  strength: string;
  /** 阴影面：这个类型的盲区是什么 */
  shadow: string;
  /** 独白语气风格 */
  monologueStyle: '冷峻' | '炽热' | '沉稳' | '灵动' | '温柔' | '锐利';
}

export interface MBTIMechanics {
  /** 每年压力自然变化（负=减压，正=加压） */
  stressModifier: number;
  /** 信念值变化倍率（>1=信念更坚定，<1=更易动摇） */
  faithMultiplier: number;
  /** 幸福值自然变化 */
  happinessModifier: number;
  /** 休养生息时额外减压 */
  restBonus: number;
  /** 副业收入倍率 */
  sideHustleMultiplier: number;
}

export interface MBTIProfessionModifier {
  /** 涨薪倍率（1.0=正常，1.02=+2%） */
  salaryGrowthMultiplier: number;
  /** 初始薪资微调（1.0=正常） */
  startingSalaryMultiplier: number;
  /** 该职业下的人格适配描述 */
  fitDescription: string;
}

// ============================================================
// 16 型人格完整数据
// ============================================================

export const MBTI_TRAITS: Record<MBTIType, MBTITrait> = {
  INTJ: {
    code: 'INTJ', name: '建筑师', temperament: 'NT',
    philosophicalTheme: '控制的幻觉',
    existentialQuestion: '当你的每一个计划都实现了，你发现自己仍然空虚——那些计划是你的，还是计划塑造了你？',
    coreDilemma: '你以为掌控一切就能避免痛苦，却发现掌控本身成了最大的痛苦。',
    strength: '能看见别人看不见的系统性因果',
    shadow: '把人当成系统中的变量，忘了人是不可预测的',
    monologueStyle: '冷峻',
  },
  INTP: {
    code: 'INTP', name: '逻辑学家', temperament: 'NT',
    philosophicalTheme: '理解即瘫痪',
    existentialQuestion: '你拆解了世界的每一个齿轮，却再也无法假装它们组合在一起是有意义的——理解，是救赎还是诅咒？',
    coreDilemma: '你越接近真相，越发现自己无法行动——因为每一个行动都建立在你已看穿的幻觉上。',
    strength: '能找到任何问题的逻辑漏洞',
    shadow: '用分析代替行动，用理解代替生活',
    monologueStyle: '冷峻',
  },
  ENTJ: {
    code: 'ENTJ', name: '指挥官', temperament: 'NT',
    philosophicalTheme: '权力的孤独',
    existentialQuestion: '你爬到了山顶，发现那里只有你一个人——你征服的到底是世界，还是自己？',
    coreDilemma: '你用效率替代了情感，用成就替代了关系，最后发现效率本身成了唯一的情感。',
    strength: '能把混乱变成秩序，把愿景变成现实',
    shadow: '把人当资源，把关系当工具，最后被自己的秩序孤立',
    monologueStyle: '锐利',
  },
  ENTP: {
    code: 'ENTP', name: '辩论家', temperament: 'NT',
    philosophicalTheme: '怀疑即信仰',
    existentialQuestion: '你质疑了一切，最后发现连"质疑"本身也需要被质疑——没有根基的自由，是解放还是虚无？',
    coreDilemma: '你的聪明让你看穿了一切立场，但看穿之后，你发现自己无处可站。',
    strength: '能在任何观点中发现漏洞和可能性',
    shadow: '用解构代替建设，用机智逃避承诺',
    monologueStyle: '灵动',
  },
  INFJ: {
    code: 'INFJ', name: '提倡者', temperament: 'NF',
    philosophicalTheme: '预见者的负担',
    existentialQuestion: '你看见了别人看不见的模式和结局，却无法让任何人相信你——先知的代价是孤独，你承受得起吗？',
    coreDilemma: '你的理想太清晰，现实太模糊；你的爱太深，表达太笨拙——你活成了一个别人读不懂的预言。',
    strength: '能看见人的潜力和事件的深层模式',
    shadow: '为理想燃烧自己，却忘了火焰也需要燃料',
    monologueStyle: '温柔',
  },
  INFP: {
    code: 'INFP', name: '调停者', temperament: 'NF',
    philosophicalTheme: '真实的代价',
    existentialQuestion: '你拒绝成为任何你不相信的东西，但世界不给理想主义者发工资——你的纯粹，是盾牌还是牢笼？',
    coreDilemma: '你的内心世界太丰富，外部世界太粗糙；你越忠于自己，越和世界格格不入。',
    strength: '能在任何处境中保持内心的完整性',
    shadow: '用理想隔绝现实，用敏感代替勇气',
    monologueStyle: '温柔',
  },
  ENFJ: {
    code: 'ENFJ', name: '主人公', temperament: 'NF',
    philosophicalTheme: '给予者的枯竭',
    existentialQuestion: '你的价值感来自帮助别人成长，但当你需要帮助时，你发现没人问过你"你还好吗"——给予是爱，还是逃避？',
    coreDilemma: '你太擅长理解别人，以至于忘了如何被理解；你的温暖照亮了所有人，唯独照不到自己。',
    strength: '能激发他人最好的一面',
    shadow: '用照顾别人逃避照顾自己，用连接逃避独处',
    monologueStyle: '炽热',
  },
  ENFP: {
    code: 'ENFP', name: '竞选者', temperament: 'NF',
    philosophicalTheme: '可能性的暴政',
    existentialQuestion: '每一个选择都意味着杀死其他所有可能性——你追逐自由，却发现自由是你最大的牢笼。选了，就不是自由了吗？',
    coreDilemma: '你什么都想体验，结果什么都没深入；你的热情是真实的，但真实的东西需要扎根，而你害怕扎根。',
    strength: '能在任何困境中找到新的可能性和意义',
    shadow: '用新鲜感逃避深度，用可能性逃避承诺',
    monologueStyle: '灵动',
  },
  ISTJ: {
    code: 'ISTJ', name: '物流师', temperament: 'SJ',
    philosophicalTheme: '责任即牢笼',
    existentialQuestion: '你一辈子做"该做的事"，临到终局才问：那些"该做的事"是谁规定的？责任是美德，还是你没敢质疑的暴君？',
    coreDilemma: '你的可靠让所有人依赖你，但没人问过你累不累——你用责任填满时间，可能只是为了逃避"我是谁"这个问题。',
    strength: '能在混乱中建立秩序和可靠性',
    shadow: '用规则替代思考，用责任替代选择',
    monologueStyle: '沉稳',
  },
  ISFJ: {
    code: 'ISFJ', name: '守卫者', temperament: 'SJ',
    philosophicalTheme: '无声的牺牲',
    existentialQuestion: '你把自己缩到最小，好让所有人都有空间——但当你消失在所有人的需求里时，"你"还存在吗？',
    coreDilemma: '你的付出是无声的，所以也是无形的；你用牺牲证明自己的价值，最后发现没人把你的牺牲当回事。',
    strength: '能记住每个人的需求并默默满足',
    shadow: '用付出绑架关系，用沉默积累怨气',
    monologueStyle: '温柔',
  },
  ESTJ: {
    code: 'ESTJ', name: '总经理', temperament: 'SJ',
    philosophicalTheme: '秩序即暴力',
    existentialQuestion: '你用效率丈量一切，发现人也变成了待优化的流程——当一切都井井有条时，为什么你觉得活着的不是你，而是你的系统？',
    coreDilemma: '你的果断让事情运转，但也让身边的人沉默；你赢了效率，输掉了那些无法被量化的东西。',
    strength: '能把任何混乱变成可执行的流程',
    shadow: '把效率当道德，把秩序当正义，忘了人是目的不是手段',
    monologueStyle: '锐利',
  },
  ESFJ: {
    code: 'ESFJ', name: '执政官', temperament: 'SJ',
    philosophicalTheme: '归属的代价',
    existentialQuestion: '你用关系编织了一张网，把自己也困在里面——当你不再被需要时，你还知道你是谁吗？',
    coreDilemma: '你的热情让你成为社交中心，但中心是最孤独的位置——所有人认识你，没人了解你。',
    strength: '能建立和维护复杂的社会关系网络',
    shadow: '用归属感逃避独立，用被需要逃避自我',
    monologueStyle: '炽热',
  },
  ISTP: {
    code: 'ISTP', name: '鉴赏家', temperament: 'SP',
    philosophicalTheme: '行动即真理',
    existentialQuestion: '你不信语言，只信手感；你用手解决问题，用手感知世界——但当手停下来的时候，你是谁？',
    coreDilemma: '你的冷静让你在危机中游刃有余，也让你在亲密关系中寸步难行；你能修好任何机器，修不好任何关系。',
    strength: '能在任何系统中找到关键操作点',
    shadow: '用行动逃避思考，用独立逃避亲密',
    monologueStyle: '冷峻',
  },
  ISFP: {
    code: 'ISFP', name: '探险家', temperament: 'SP',
    philosophicalTheme: '美与无用',
    existentialQuestion: '你用审美代替语言，用感受代替逻辑——在一个只看结果的世界里，你的敏感是天赋还是残疾？',
    coreDilemma: '你活在一个别人看不见的色彩世界里，你的美无人欣赏，你的痛无人理解——你选择了沉默，但沉默不是答案。',
    strength: '能在任何处境中找到美和意义',
    shadow: '用审美逃避现实，用沉默逃避冲突',
    monologueStyle: '温柔',
  },
  ESTP: {
    code: 'ESTP', name: '企业家', temperament: 'SP',
    philosophicalTheme: '此刻即永恒',
    existentialQuestion: '你活在当下，因为只有当下是真实的——但当"当下"一个接一个流逝，你发现自己什么也没留下。此刻的自由，是自由还是遗忘？',
    coreDilemma: '你的胆识让你抓住了每一个机会，也让你错过了每一个需要等待的东西——你赢了当下，输掉了时间。',
    strength: '能在任何瞬间找到最优行动方案',
    shadow: '用刺激逃避无聊，用行动逃避意义',
    monologueStyle: '锐利',
  },
  ESFP: {
    code: 'ESFP', name: '表演者', temperament: 'SP',
    philosophicalTheme: '欢笑的背面',
    existentialQuestion: '你是所有人的光，但你照亮别人的时候，自己的影子谁来照亮——快乐是天赋，还是面具？',
    coreDilemma: '你的活力让所有人快乐，但快乐是最孤独的情绪——因为没人相信快乐的人也会痛。',
    strength: '能在任何氛围中创造快乐和连接',
    shadow: '用欢笑掩盖痛苦，用热闹掩盖孤独',
    monologueStyle: '灵动',
  },
};

// ============================================================
// MBTI 机制影响（数值微调）
// ============================================================

export const MBTI_MECHANICS: Record<MBTIType, MBTIMechanics> = {
  // NT 理性者：低压力恢复，高信念坚定度
  INTJ: { stressModifier: 0, faithMultiplier: 1.15, happinessModifier: -1, restBonus: 2, sideHustleMultiplier: 1.05 },
  INTP: { stressModifier: 1, faithMultiplier: 0.85, happinessModifier: 0, restBonus: 4, sideHustleMultiplier: 1.03 },
  ENTJ: { stressModifier: 2, faithMultiplier: 1.20, happinessModifier: -1, restBonus: 0, sideHustleMultiplier: 1.08 },
  ENTP: { stressModifier: 1, faithMultiplier: 0.80, happinessModifier: 1, restBonus: 2, sideHustleMultiplier: 1.06 },
  // NF 理想者：高幸福感波动，信念易动摇但恢复快
  INFJ: { stressModifier: 1, faithMultiplier: 1.10, happinessModifier: 0, restBonus: 3, sideHustleMultiplier: 1.02 },
  INFP: { stressModifier: 2, faithMultiplier: 0.90, happinessModifier: -1, restBonus: 5, sideHustleMultiplier: 0.98 },
  ENFJ: { stressModifier: 2, faithMultiplier: 1.05, happinessModifier: 1, restBonus: 2, sideHustleMultiplier: 1.04 },
  ENFP: { stressModifier: 1, faithMultiplier: 0.85, happinessModifier: 2, restBonus: 3, sideHustleMultiplier: 1.07 },
  // SJ 守护者：低压力但低幸福感，稳定但易倦怠
  ISTJ: { stressModifier: -1, faithMultiplier: 1.12, happinessModifier: -1, restBonus: 3, sideHustleMultiplier: 0.97 },
  ISFJ: { stressModifier: 0, faithMultiplier: 1.08, happinessModifier: 0, restBonus: 4, sideHustleMultiplier: 1.01 },
  ESTJ: { stressModifier: 1, faithMultiplier: 1.15, happinessModifier: -1, restBonus: 1, sideHustleMultiplier: 1.03 },
  ESFJ: { stressModifier: 1, faithMultiplier: 1.06, happinessModifier: 1, restBonus: 3, sideHustleMultiplier: 1.05 },
  // SP 艺术者：高幸福感但低信念，活在当下但缺乏远见
  ISTP: { stressModifier: -1, faithMultiplier: 0.88, happinessModifier: 1, restBonus: 3, sideHustleMultiplier: 1.04 },
  ISFP: { stressModifier: 0, faithMultiplier: 0.82, happinessModifier: 1, restBonus: 5, sideHustleMultiplier: 0.99 },
  ESTP: { stressModifier: 1, faithMultiplier: 0.85, happinessModifier: 2, restBonus: 1, sideHustleMultiplier: 1.06 },
  ESFP: { stressModifier: 0, faithMultiplier: 0.80, happinessModifier: 3, restBonus: 2, sideHustleMultiplier: 1.03 },
};

// ============================================================
// MBTI × 职业 适配度
// ============================================================

export function getMBTIProfessionModifier(mbti: MBTIType, profession: Profession): MBTIProfessionModifier {
  const temperament = MBTI_TRAITS[mbti].temperament;

  // NT 理性者：技术/分析类职业优势
  if (temperament === 'NT') {
    if (profession === '红利行业' || profession === '体制内') {
      return { salaryGrowthMultiplier: 1.03, startingSalaryMultiplier: 1.0, fitDescription: '你的分析能力在结构化环境中如鱼得水' };
    }
    if (profession === '实体创业') {
      return { salaryGrowthMultiplier: 1.05, startingSalaryMultiplier: 0.98, fitDescription: '你的战略思维让创业少走弯路，但用人是你的短板' };
    }
    return { salaryGrowthMultiplier: 1.01, startingSalaryMultiplier: 1.0, fitDescription: '理性是你的底色，任何岗位都能胜任' };
  }

  // NF 理想者：人文/创意类职业优势
  if (temperament === 'NF') {
    if (profession === '自由职业') {
      return { salaryGrowthMultiplier: 1.04, startingSalaryMultiplier: 0.97, fitDescription: '你的创造力让自由职业开花，但收入波动考验你的信念' };
    }
    if (profession === '体制内') {
      return { salaryGrowthMultiplier: 0.97, startingSalaryMultiplier: 1.0, fitDescription: '体制的规则感让你窒息，但稳定给了你做梦的底气' };
    }
    return { salaryGrowthMultiplier: 1.01, startingSalaryMultiplier: 0.99, fitDescription: '你的共情力是隐形资产' };
  }

  // SJ 守护者：稳定/管理类职业优势
  if (temperament === 'SJ') {
    if (profession === '体制内' || profession === '一线蓝领') {
      return { salaryGrowthMultiplier: 1.04, startingSalaryMultiplier: 1.0, fitDescription: '你的可靠性在需要信任的岗位上价值连城' };
    }
    if (profession === '实体创业') {
      return { salaryGrowthMultiplier: 0.97, startingSalaryMultiplier: 0.98, fitDescription: '创业的不确定性让你焦虑，但你的执行力能弥补' };
    }
    return { salaryGrowthMultiplier: 1.02, startingSalaryMultiplier: 1.0, fitDescription: '你的稳重是任何团队的基石' };
  }

  // SP 艺术者：灵活/行动类职业优势
  if (temperament === 'SP') {
    if (profession === '自由职业' || profession === '实体创业') {
      return { salaryGrowthMultiplier: 1.04, startingSalaryMultiplier: 0.98, fitDescription: '你的行动力和应变能力在不确定中如鱼得水' };
    }
    if (profession === '体制内') {
      return { salaryGrowthMultiplier: 0.96, startingSalaryMultiplier: 1.0, fitDescription: '体制的节奏让你窒息，你的才华需要更自由的舞台' };
    }
    return { salaryGrowthMultiplier: 1.01, startingSalaryMultiplier: 1.0, fitDescription: '你的临场反应是隐形优势' };
  }

  return { salaryGrowthMultiplier: 1.0, startingSalaryMultiplier: 1.0, fitDescription: '' };
}

// ============================================================
// MBTI × 路径 适配度（影响副业收入倍率）
// ============================================================

export function getMBTIPathSynergy(mbti: MBTIType, pathId: RetirementPathId): string {
  const temperament = MBTI_TRAITS[mbti].temperament;

  const synergyMap: Record<string, Record<RetirementPathId, string>> = {
    NT: {
      ai_symbiote: '你与AI的关系更像棋逢对手——你理解它的逻辑，它放大你的野心',
      chain_native: '你把区块链当成一个等待破解的系统，你的理性在这个赌场里是稀缺品',
      digital_nomad: '你选择游牧不是因为浪漫，而是因为远程工作让你的效率最大化',
      super_ip: '你用逻辑构建人设，但逻辑构建的人设最难让人共情',
      silver_economy: '你看到的是银发经济的数据模型，不是老人的脸',
      bio_gambler: '你把生命当成可优化的变量，但有些变量不该被优化',
    },
    NF: {
      ai_symbiote: '你想理解AI是否也有灵魂，这个问题比任何技术都让你着迷',
      chain_native: '你信仰的不是币，是去中心化背后的平等理想',
      digital_nomad: '你游牧是为了寻找——寻找一个配得上你理想的地方',
      super_ip: '你用人设传播信念，但传播多了，你自己也开始分不清哪个是真的',
      silver_economy: '你做养老是因为你真的在乎，这份在乎是你的引擎也是你的软肋',
      bio_gambler: '你赌的不是回报率，是"人类可以战胜衰老"这个信念',
    },
    SJ: {
      ai_symbiote: '你用AI提效不是为了创新，是为了把省下的时间留给家人',
      chain_native: '你在币圈格格不入——你讨厌不确定性，但如果你来了，你的纪律性就是护城河',
      digital_nomad: '你选择游牧的理由很务实：成本更低，效率更高，不是浪漫',
      super_ip: '你把内容创作当成一份该认真做好的工作，这份态度让你走得比天才更远',
      silver_economy: '你天生适合照顾人，银发经济不只是生意，是你的天职',
      bio_gambler: '你投资的逻辑是"这个技术该成熟了"，你比赌徒更像分析师',
    },
    SP: {
      ai_symbiote: '你不在乎AI的哲学含义，你在乎的是它能不能帮你搞定今天的活',
      chain_native: '你炒币不看白皮书，看盘感和直觉——这让你在牛市封神，在熊市破产',
      digital_nomad: '你游牧是因为"此时此刻在这个城市"本身就是理由',
      super_ip: '你的内容不靠深度，靠感染力——你是天生的表演者',
      silver_economy: '你做养老靠的是手感和人情味，不是什么战略',
      bio_gambler: '你赌的是直觉和肾上腺素，这让你赢了刺激，也输了理性',
    },
  };

  return synergyMap[temperament]?.[pathId] || '';
}

// ============================================================
// 获取当前玩家的MBTI机制修正
// ============================================================

export function getActiveMBTIMechanics(state: GameState): MBTIMechanics | null {
  const mbti = (state as any).mbtiType as MBTIType | null;
  if (!mbti) return null;
  return MBTI_MECHANICS[mbti] || null;
}

export function getActiveMBTITrait(state: GameState): MBTITrait | null {
  const mbti = (state as any).mbtiType as MBTIType | null;
  if (!mbti) return null;
  return MBTI_TRAITS[mbti] || null;
}

// ============================================================
// 气质群列表（用于UI展示）
// ============================================================

export const MBTI_GROUPS: { temperament: 'NT' | 'NF' | 'SJ' | 'SP'; label: string; theme: string; types: MBTIType[] }[] = [
  { temperament: 'NT', label: '理性者', theme: '控制与混沌', types: ['INTJ', 'INTP', 'ENTJ', 'ENTP'] },
  { temperament: 'NF', label: '理想者', theme: '意义与现实', types: ['INFJ', 'INFP', 'ENFJ', 'ENFP'] },
  { temperament: 'SJ', label: '守护者', theme: '责任与欲望', types: ['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'] },
  { temperament: 'SP', label: '艺术者', theme: '当下与未来', types: ['ISTP', 'ISFP', 'ESTP', 'ESFP'] },
];
