/**
 * 盲盒结果数据库 (Blind Box Outcomes)
 *
 * 设计理念：
 * -----------
 * 盲盒系统是像素退休模拟器的"延迟叙事引擎"。每张决策卡在打出时只揭示即时效果，
 * 但真正的命运转折往往在数年后才浮出水面。
 *
 * 核心特征：
 * 1. **延迟触发**：每条盲盒分支有 delayYears（1-7年），模拟现实中决策的"滞后效应"。
 *    比如健身不会立刻让你看到腹肌，结婚的甜蜜也可能在三年后变成琐碎。
 *
 * 2. **条件分支**：同一张卡的盲盒可能有2-3条分支，由触发时刻的游戏状态决定走哪条路。
 *    有钱时买二套房是投资，经济萧条时买二套房是枷锁。
 *
 * 3. **情感标签**：每条盲盒带有 emotion 标签（sweet/bitter/spicy/salty/warm/cold/funny/crying），
 *    影响UI展示的色调和氛围，让玩家在回顾人生时能直观感受到酸甜苦辣。
 *
 * 4. **叙事驱动**：文本是最重要的部分——要有现实梗、要有情感冲击力、要让人共鸣。
 *    这不是冰冷的数值变化，而是一段段人生片段。
 *
 * 与 card-echoes 的区别：
 * - card-echoes 是简单的"一条延迟消息"，无分支条件。
 * - blind-box-outcomes 是"有条件的延迟叙事分支"，每张卡可能有多个命运走向。
 * - 两者并存，blind-box 是 echo 的升级版，覆盖更重要的卡牌。
 *
 * 使用方式：
 * 1. 玩家选择卡片时，将对应的盲盒分支ID注册到 pendingBlindBoxes 队列。
 * 2. 每年结算时调用 detectBlindBoxOutcomes()，检测到期的盲盒。
 * 3. 对每个到期盲盒，遍历其所有分支，执行第一个 condition 为真的分支。
 * 4. 应用分支的 applyEffect 和 getText，生成叙事并修改状态。
 */

import type { GameState } from '../types/global.d.js';

// ========== 情感标签类型 ==========
export type BlindBoxEmotion =
  | 'sweet'     // 甜蜜：温馨、幸福的小确幸
  | 'bitter'    // 苦涩：现实的打击、无奈的妥协
  | 'spicy'     // 辣味：刺激、冒险、烧脑的选择
  | 'salty'     // 咸味：讽刺、自嘲、哭笑不得
  | 'warm'      // 暖色：治愈、成长、被理解
  | 'cold'      // 冷色：孤独、疏离、理性但残酷
  | 'funny'     // 搞笑：黑色幽默、生活趣事
  | 'crying';   // 催泪：亲情、离别、让人红眼眶

// ========== 盲盒结果接口 ==========
export interface BlindBoxOutcome {
  /** 唯一ID，格式: {cardId}_branch_{A/B/C} */
  id: string;
  /** 触发的卡片ID */
  triggerCardId: string;
  /** 延迟年数（1-7） */
  delayYears: number;
  /** 走这条分支的条件，返回 true 时触发 */
  condition: (state: GameState) => boolean;
  /** 叙事文本生成函数（剧情驱动！要有酸甜苦辣和现实梗） */
  getText: (state: GameState) => string;
  /** 数值效果（直接修改 state） */
  applyEffect: (state: GameState) => void;
  /** 情感标签，影响UI展示颜色 */
  emotion: BlindBoxEmotion;
}

// ========== 工具函数 ==========
/** 生成指定范围的随机整数 [min, max] */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ========== 盲盒分支常量（40张核心卡片，共80条分支） ==========
export const BLIND_BOX_OUTCOMES: BlindBoxOutcome[] = [

  // =========================================================================
  // 1. insurance（重疾险）
  // =========================================================================
  {
    id: 'insurance_branch_A',
    triggerCardId: 'insurance',
    delayYears: 2,
    condition: (s) => s.health < 60,
    emotion: 'warm',
    getText: (s) => {
      const amount = randInt(3000, 8000);
      return `第${s.currentAge}岁，你突然胃痛得在工位上弯成了虾米。检查结果是胃溃疡。你第一次庆幸自己买了那份保险——虽然医保报销了大头，但保险的额外赔付还是让你少花了${amount}块。你躺在病床上给保险公司打电话的时候，觉得自己像个精明的成年人。`;
    },
    applyEffect: (s) => {
      s.health = Math.min(100, s.health + 5);
      s.currentSavings += randInt(3000, 8000);
    },
  },
  {
    id: 'insurance_branch_B',
    triggerCardId: 'insurance',
    delayYears: 3,
    condition: (s) => s.health >= 60,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，你爸妈体检发现了高血压和糖尿病。你突然意识到——保险这东西，该给他们也买一份。你翻了翻他们的体检报告，看着那些红色箭头，第一次觉得"健康"是世界上最贵的奢侈品。`,
    applyEffect: (s) => {
      s.stress = Math.min(100, s.stress + 10);
    },
  },

  // =========================================================================
  // 2. minimalism（极简主义）
  // =========================================================================
  {
    id: 'minimalism_branch_A',
    triggerCardId: 'minimalism',
    delayYears: 1,
    condition: (s) => s.currentSavings < 50000,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，朋友来你家做客，看到空荡荡的客厅问"你是不是要搬家？"你说是极简主义。朋友环顾四周说"极简到这个程度，是不是……缺钱？"你笑了笑没说话，但那个问题像根刺一样扎在心里。`,
    applyEffect: (s) => {
      s.happiness = Math.max(0, s.happiness - 5);
    },
  },
  {
    id: 'minimalism_branch_B',
    triggerCardId: 'minimalism',
    delayYears: 2,
    condition: (s) => s.currentSavings >= 50000,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，你发现自己的生活变简单后，时间变多了。你开始每天花两小时看书、散步、发呆。朋友圈里别人在晒新包新车新旅行，你在晒阳台上的夕阳。有人评论"好羡慕你的从容"，你回复两个字："省钱"。`,
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 10);
      s.stress = Math.max(0, s.stress - 8);
    },
  },

  // =========================================================================
  // 3. side_hustle（副业）
  // =========================================================================
  {
    id: 'side_hustle_branch_A',
    triggerCardId: 'side_hustle',
    delayYears: 2,
    condition: (s) => s.passiveIncome > 30000,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，你的副业收入第一次超过了主业工资。那天你坐在电脑前看着两笔入账短信，心里默念"我再也不怕被裁了"。但你知道，为了这份安全感，你已经两年没在凌晨两点前睡过觉。`,
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 10);
      s.stress = Math.min(100, s.stress + 5);
    },
  },
  {
    id: 'side_hustle_branch_B',
    triggerCardId: 'side_hustle',
    delayYears: 1,
    condition: (s) => s.isUnemployed,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，你失业了。但和其他人不一样，你还有副业收入撑着。虽然不多，但至少交房租没问题。你想起当初熬夜写代码的每个夜晚，忽然觉得——那不是在加班，那是在买自由。`,
    applyEffect: (s) => {
      s.stress = Math.max(0, s.stress - 5);
      s.happiness = Math.min(100, s.happiness + 5);
    },
  },
  {
    id: 'side_hustle_branch_C',
    triggerCardId: 'side_hustle',
    delayYears: 3,
    condition: (s) => s.stress > 60,
    emotion: 'spicy',
    getText: (s) => `第${s.currentAge}岁，你终于扛不住了。白天上班晚上搞副业的日子已经持续了太久，你的身体开始用各种方式抗议——偏头痛、失眠、突然的心悸。你做了一个决定：把副业规模砍掉一半。"赚钱是无限的，命只有一条"，你发了一条仅自己可见的朋友圈。`,
    applyEffect: (s) => {
      s.stress = Math.max(0, s.stress - 15);
      s.passiveIncome = Math.max(0, s.passiveIncome - randInt(10000, 20000));
      s.happiness = Math.min(100, s.happiness + 5);
    },
  },

  // =========================================================================
  // 4. marry（结婚）
  // =========================================================================
  {
    id: 'marry_branch_A',
    triggerCardId: 'marry',
    delayYears: 3,
    condition: (s) => !!s.partner && s.partner.affection > 50,
    emotion: 'warm',
    getText: (s) => {
      const name = s.partner?.name || '伴侣';
      return `第${s.currentAge}岁，${name}下班回来拎了一袋你最爱的水果。你问"今天什么日子？"对方想了想说"没什么日子，就是路过水果店想买了"。你突然觉得，婚姻最好的样子不是轰轰烈烈，而是这种"没什么理由的惦记"。`;
    },
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 12);
      if (s.partner) s.partner.affection = Math.min(100, s.partner.affection + 5);
    },
  },
  {
    id: 'marry_branch_B',
    triggerCardId: 'marry',
    delayYears: 5,
    condition: (s) => s.stress > 50,
    emotion: 'bitter',
    getText: (s) => {
      const name = s.partner?.name || '伴侣';
      const hasChild = s.hasChild ? '你听到孩子在自己房间里把音乐开到了最大声。' : '空气安静得让人窒息。';
      return `第${s.currentAge}岁，你们为钱的事又吵了一架。${name}说"你就知道赚钱，这个家你关心过吗？"你说"我不赚钱谁养家？"客厅里安静了三分钟，${hasChild}你想起当初婚礼上说的"无论贫穷还是富有"，没想到"贫穷"两个字会这么具体。`;
    },
    applyEffect: (s) => {
      s.happiness = Math.max(0, s.happiness - 10);
      s.stress = Math.min(100, s.stress + 10);
      if (s.partner) s.partner.affection = Math.max(0, s.partner.affection - 8);
    },
  },
  {
    id: 'marry_branch_C',
    triggerCardId: 'marry',
    delayYears: 7,
    condition: (s) => !!s.partner && !s.partner.hasDivorced,
    emotion: 'salty',
    getText: (s) => {
      const name = s.partner?.name || '伴侣';
      return `第${s.currentAge}岁，传说中的"七年之痒"来了。不是因为不爱了，而是因为太熟悉了。你们之间的对话从"今晚吃什么"变成了"随便"到最后的沉默。${name}说要出去走走，你问"去哪"，说"不知道"。你突然明白——七年之痒不是痒，是钝痛。`;
    },
    applyEffect: (s) => {
      s.happiness = Math.max(0, s.happiness - 8);
      if (s.partner) s.partner.affection = Math.max(0, s.partner.affection - 12);
    },
  },

  // =========================================================================
  // 5. have_child（生育）
  // =========================================================================
  {
    id: 'have_child_branch_A',
    triggerCardId: 'have_child',
    delayYears: 2,
    condition: (s) => s.currentSavings < 100000,
    emotion: 'bitter',
    getText: (s) => {
      const tuition = s.currentCity === '资本修罗场' ? 5000 : 2000;
      return `第${s.currentAge}岁，孩子该上幼儿园了。你打开收费页面——一个月${tuition}块。你看了看自己的存款，打开招聘App看了三秒又关了。以前觉得"赚钱"是为了自己，现在才知道——赚钱是为了这个小小的、什么都不懂的人。`;
    },
    applyEffect: (s) => {
      s.stress = Math.min(100, s.stress + 12);
      s.happiness = Math.min(100, s.happiness + 3);
    },
  },
  {
    id: 'have_child_branch_B',
    triggerCardId: 'have_child',
    delayYears: 4,
    condition: (s) => s.children.some(c => c.growthStage === '小学'),
    emotion: 'funny',
    getText: (s) => `第${s.currentAge}岁，孩子第一次写作文《我的爸爸/妈妈》。你满怀期待地打开——"我的爸爸/妈妈总是在看手机，我觉得手机才是他们的孩子"。你放下手机，沉默了很久。然后你打开手机——设了一个"每天陪伴一小时"的定时提醒。`,
    applyEffect: (s) => {
      s.happiness = Math.max(0, s.happiness - 5);
      s.stress = Math.min(100, s.stress + 5);
    },
  },
  {
    id: 'have_child_branch_C',
    triggerCardId: 'have_child',
    delayYears: 3,
    condition: (s) => s.currentSavings >= 200000,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，孩子第一次在家长会上念作文，题目是"我最幸福的事"。你坐在台下，听到孩子说"最幸福的事就是爸爸/妈妈下班回来抱我"。你偷偷擦了擦眼角，旁边家长递过来一张纸巾。`,
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 15);
    },
  },

  // =========================================================================
  // 6. buy_house（买房）
  // =========================================================================
  {
    id: 'buy_house_branch_A',
    triggerCardId: 'buy_house*',
    delayYears: 3,
    condition: (s) => s.economicCycle === 2,
    emotion: 'bitter',
    getText: (s) => {
      const dropWan = Math.round(s.propertyValue * 0.15 / 10000);
      return `第${s.currentAge}岁，房价跌了。你打开贝壳看了看小区的挂牌价，比你买入时低了${dropWan}万。你把手机塞进抽屉，跟自己说"反正自己住又不卖"。但你知道，每个月还的那个数字，现在变得更沉重了。`;
    },
    applyEffect: (s) => {
      s.stress = Math.min(100, s.stress + 15);
      s.propertyValue = Math.round(s.propertyValue * 0.85);
    },
  },
  {
    id: 'buy_house_branch_B',
    triggerCardId: 'buy_house*',
    delayYears: 4,
    condition: (s) => s.currentSavings > s.currentMortgageCost * 2,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，你还完了一整年的房贷。虽然还有十几年要走，但你在日历上画了一个小小的勾。那天晚上你在自己的阳台上喝了一罐啤酒，看城市的灯光。这是你自己的灯光，哪怕窗外是别人的万家灯火。`,
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 8);
    },
  },

  // =========================================================================
  // 7. resign（辞职）
  // =========================================================================
  {
    id: 'resign_branch_A',
    triggerCardId: 'resign',
    delayYears: 1,
    condition: (s) => s.currentSavings > 80000,
    emotion: 'warm',
    getText: (s) => `第${s.currentAge}岁，失业的日子你开始享受慢生活。每天睡到自然醒，去公园跑步，下午看书发呆。你发现——原来不用定闹钟的日子，才是真正的活着。但你也知道，存款不会自己长大。这种自由，是有保质期的。`,
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 10);
      s.stress = Math.max(0, s.stress - 15);
      s.health = Math.min(100, s.health + 5);
    },
  },
  {
    id: 'resign_branch_B',
    triggerCardId: 'resign',
    delayYears: 2,
    condition: (s) => s.currentSavings < 30000,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，存款快见底了。你开始焦虑地刷招聘App，投了几十份简历，大部分石沉大海。好不容易收到一个面试邀请，薪资只有上份工作的60%。你坐在面试候场区，旁边坐着一个00后，他简历上的项目经历比你还丰富。你开始理解什么叫"年龄焦虑"。`,
    applyEffect: (s) => {
      s.stress = Math.min(100, s.stress + 20);
      s.happiness = Math.max(0, s.happiness - 10);
    },
  },

  // =========================================================================
  // 8. gym（健身）
  // =========================================================================
  {
    id: 'gym_branch_A',
    triggerCardId: 'gym',
    delayYears: 2,
    condition: (s) => s.health > 70,
    emotion: 'funny',
    getText: (s) => `第${s.currentAge}岁，你在健身房镜子前发现腹肌了——虽然只有两块半。你拍了一张自拍发了朋友圈，收获了人生中最多的一次互动。评论区有人说"这是P的吧"，你回复"健身房的镜子自带滤镜"。但你心里美滋滋的。`,
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 8);
      s.health = Math.min(100, s.health + 5);
    },
  },
  {
    id: 'gym_branch_B',
    triggerCardId: 'gym',
    delayYears: 2,
    condition: (s) => s.stress > 50,
    emotion: 'warm',
    getText: (s) => `第${s.currentAge}岁，跑步成了你唯一的解压方式。每次跑完五公里，那些烦心事好像就跟着汗水一起蒸发了。你甚至开始享受跑步时的孤独——只有你和你自己的呼吸声。`,
    applyEffect: (s) => {
      s.stress = Math.max(0, s.stress - 12);
      s.happiness = Math.min(100, s.happiness + 5);
    },
  },

  // =========================================================================
  // 9. buy_car（买车）
  // =========================================================================
  {
    id: 'buy_car_branch_A',
    triggerCardId: 'buy_car*',
    delayYears: 1,
    condition: (s) => s.isUnemployed,
    emotion: 'salty',
    getText: (s) => {
      const loss = 15000;
      return `第${s.currentAge}岁，失业了。你坐在车里发呆，看着挡风玻璃上的灰。车不养人是真的——保险、保养、油费，一个月至少两千块。你打开闲鱼搜了一下同款二手车价，比买入价低了${loss}。你关掉了闲鱼。车还在，面子也还在。`;
    },
    applyEffect: (s) => {
      s.stress = Math.min(100, s.stress + 10);
    },
  },
  {
    id: 'buy_car_branch_B',
    triggerCardId: 'buy_car*',
    delayYears: 2,
    condition: (s) => !!s.partner && !s.partner.hasDivorced,
    emotion: 'sweet',
    getText: (s) => {
      const name = s.partner?.name || '伴侣';
      return `第${s.currentAge}岁，周末你开车带${name}去了郊外。车停在一条安静的小路上，你们靠着车门看夕阳。${name}说"有车真好，不用挤地铁了"。你笑了——为了一句话，觉得当时那笔钱花得真值。`;
    },
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 10);
    },
  },

  // =========================================================================
  // 10. travel（旅行）
  // =========================================================================
  {
    id: 'travel_branch_A',
    triggerCardId: 'travel',
    delayYears: 1,
    condition: (s) => s.stress > 60,
    emotion: 'warm',
    getText: (s) => `第${s.currentAge}岁，你翻看上次旅行的照片，发现自己笑得比最近一年加起来都多。你在工位上打开了机票App看了三遍，默默给自己定了个规矩：每年至少出去一次。毕竟，人不是机器，总得给自己充充电。`,
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 8);
      s.stress = Math.max(0, s.stress - 8);
    },
  },
  {
    id: 'travel_branch_B',
    triggerCardId: 'travel',
    delayYears: 1,
    condition: (s) => !s.isMarried,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，你一个人旅行回来了。照片拍了很多，朋友圈也发了，但回家打开门，空荡荡的房间让你停了两秒。旅行让你暂时逃离了孤独，但旅行的终点永远是——回到一个人的房间。`,
    applyEffect: (s) => {
      s.happiness = Math.max(0, s.happiness - 3);
      s.stress = Math.min(100, s.stress + 3);
    },
  },

  // =========================================================================
  // 11. crypto_bet（炒币）
  // =========================================================================
  {
    id: 'crypto_bet_branch_A',
    triggerCardId: 'crypto_bet',
    delayYears: 2,
    condition: (s) => s.currentSavings < 100000,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，你又忍不住打开了行情APP。上次割肉的那个币涨了三倍。你在群里看到有人晒收益截图，手痒得不行。但上次的教训还烫着——你打开了银行App看了看余额，冷静了。你把行情APP卸载了。三天后又装回来了。`,
    applyEffect: (s) => {
      s.stress = Math.min(100, s.stress + 10);
    },
  },
  {
    id: 'crypto_bet_branch_B',
    triggerCardId: 'crypto_bet',
    delayYears: 3,
    condition: (s) => s.currentSavings >= 200000,
    emotion: 'spicy',
    getText: (s) => `第${s.currentAge}岁，一个朋友拉你做"区块链项目"，说"只要投10万，半年翻五倍"。你差点就信了——毕竟上次炒币赚了。但你冷静想了想，这和上次有什么区别？你拒绝了。一个月后那个项目跑路了。你第一次觉得自己成熟了一点。`,
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 5);
    },
  },

  // =========================================================================
  // 12. therapy（心理咨询）
  // =========================================================================
  {
    id: 'therapy_branch_A',
    triggerCardId: 'therapy',
    delayYears: 1,
    condition: (s) => s.stress < 30,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，你发现自己不再失眠了。以前总是凌晨三点醒来刷手机，现在能一觉睡到天亮。你给咨询师发了一条消息："谢谢"。咨询师回了一个微笑。你关上手机，第一次觉得——原来睡个好觉也可以是一种奢侈的幸福。`,
    applyEffect: (s) => {
      s.stress = Math.max(0, s.stress - 5);
      s.happiness = Math.min(100, s.happiness + 5);
      s.health = Math.min(100, s.health + 3);
    },
  },
  {
    id: 'therapy_branch_B',
    triggerCardId: 'therapy',
    delayYears: 2,
    condition: (s) => s.stress > 50,
    emotion: 'crying',
    getText: (s) => {
      const cost = randInt(500, 1500);
      return `第${s.currentAge}岁，压力又回来了。工作和生活的夹击让你喘不过气，你又一次打开手机想约咨询。但上次的费用让你犹豫了一下——一次咨询就要${cost}块。你在"花这个钱值不值"和"不花这个钱我还能撑多久"之间纠结了很久。最后你还是打了电话。有些事情，不花钱解决不了。`;
    },
    applyEffect: (s) => {
      s.currentSavings -= randInt(500, 1500);
      s.stress = Math.max(0, s.stress - 8);
    },
  },

  // =========================================================================
  // 13. upskill（技能进修）
  // =========================================================================
  {
    id: 'upskill_branch_A',
    triggerCardId: 'upskill',
    delayYears: 2,
    condition: (s) => !s.isUnemployed,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，你因为技术能力突出被点名负责一个重要项目。你站在会议室里讲方案的时候，底下的年轻人都记着笔记。你想起两年前坐在培训班最后一排的自己——原来 investing in yourself 永远不会亏。你妈说"花这钱值了"，这是她第一次肯定你的消费观。`,
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 10);
    },
  },
  {
    id: 'upskill_branch_B',
    triggerCardId: 'upskill',
    delayYears: 2,
    condition: (s) => s.isUnemployed,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，你拿着那张培训证书去面试。HR看了一眼说"嗯不错"。但下一句是"你的期望薪资太高了，我们这个岗位预算只有你要求的70%"。你发现——证书可以证明你学过，但证明不了你值多少。`,
    applyEffect: (s) => {
      s.stress = Math.min(100, s.stress + 5);
    },
  },

  // =========================================================================
  // 14. hedge_option（对冲期权）
  // =========================================================================
  {
    id: 'hedge_option_branch_A',
    triggerCardId: 'hedge_option',
    delayYears: 1,
    condition: (s) => s.economicCycle === 2,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，市场崩了，基金账户缩水了一大半。你看着朋友圈里哀嚎遍野，打开自己的账户——还好，有那笔对冲期权，你只亏了20%。你第一次理解什么叫"花钱买安心"。虽然当时买的时候被同事嘲笑"赌博"，现在你就是笑到最后的人。`,
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 10);
    },
  },
  {
    id: 'hedge_option_branch_B',
    triggerCardId: 'hedge_option',
    delayYears: 3,
    condition: (s) => s.economicCycle !== 2,
    emotion: 'salty',
    getText: (s) => {
      const annualFee = Math.round(s.speculationPct * 1000);
      return `第${s.currentAge}岁，你看了看那份对冲期权的成本——每年${annualFee}块的期权费已经交了三年了，市场一直好好的。你开始怀疑自己是不是白花了这笔钱。然后你打开朋友圈看了看那些没买对冲就爆仓的人——安慰自己"花钱买个万一"。`;
    },
    applyEffect: (s) => {
      s.happiness = Math.max(0, s.happiness - 3);
    },
  },

  // =========================================================================
  // 15. mba（读MBA）
  // =========================================================================
  {
    id: 'mba_branch_A',
    triggerCardId: 'mba',
    delayYears: 3,
    condition: (s) => s.currentProfession !== '体制内',
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，MBA的毕业证终于拿到了。拿到学位证那天你发了一条朋友圈，收获了有史以来最多的赞。更重要的是——你的简历上终于有了那个金光闪闪的"硕士"字样。猎头开始主动联系你了。你才知道——原来学历是打开某些门的钥匙，而不是终点。`,
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 12);
    },
  },
  {
    id: 'mba_branch_B',
    triggerCardId: 'mba',
    delayYears: 2,
    condition: (s) => s.stress > 70,
    emotion: 'crying',
    getText: (s) => `第${s.currentAge}岁，白天上班晚上写论文的日子终于结束了。但你也发现自己两鬓多了几根白发，体重涨了十斤，颈椎出了问题。你拿着学位证书，苦笑着说"这是用命换的"。你妈说"值得"，你爸说"别把自己搞垮了"。你把证书锁进抽屉，决定好好睡一觉——一觉就睡到了第二天中午。`,
    applyEffect: (s) => {
      s.health = Math.max(0, s.health - 5);
      s.stress = Math.max(0, s.stress - 10);
      s.happiness = Math.min(100, s.happiness + 5);
    },
  },

  // =========================================================================
  // 16. buy_second_house（二套房）
  // =========================================================================
  {
    id: 'buy_second_house_branch_A',
    triggerCardId: 'buy_second_house',
    delayYears: 2,
    condition: (s) => s.economicCycle === 2,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，二套房空置了半年。中介打电话来说"要不要降价租？"你咬牙说"不降"。又过了一个月还是没租出去。你打开银行App看了看月供——两套房子的月供加起来，比你的工资还高。你开始理解什么叫"投资有风险，入市需谨慎"这句废话。`,
    applyEffect: (s) => {
      s.stress = Math.min(100, s.stress + 15);
      s.currentSavings -= randInt(20000, 50000);
    },
  },
  {
    id: 'buy_second_house_branch_B',
    triggerCardId: 'buy_second_house',
    delayYears: 2,
    condition: (s) => s.economicCycle !== 2,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，二套房的租金涨了。你打开银行App看到入账通知，美滋滋地截了个图发给朋友——配文"多一条现金流"。朋友回复"房奴中的战斗机还兼职收租？"你回了两个字"谢谢"。被动收入的感觉真好，虽然你知道——这份"被动"来自当初的"主动"贷款。`,
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 8);
    },
  },

  // =========================================================================
  // 17. treat_parents（请父母吃饭）
  // =========================================================================
  {
    id: 'treat_parents_branch_A',
    triggerCardId: 'treat_parents',
    delayYears: 2,
    condition: (s) => s.parents.health < 50,
    emotion: 'crying',
    getText: (s) => `第${s.currentAge}岁，你爸妈住院了。你赶到医院看到他们躺在病床上的样子——比你记忆中瘦了一圈。你想起上次请他们吃饭时的场景，他们把没吃完的打包带走。你忍着泪说"以后天天给你们做好的"。他们笑了笑说"不用天天，偶尔就行"。你出了病房，在走廊里蹲了很久。`,
    applyEffect: (s) => {
      s.stress = Math.min(100, s.stress + 15);
      s.happiness = Math.max(0, s.happiness - 10);
    },
  },

  // =========================================================================
  // 18. dinner_friends（约朋友吃饭）
  // =========================================================================
  {
    id: 'dinner_friends_branch_A',
    triggerCardId: 'dinner_friends',
    delayYears: 2,
    condition: (s) => s.friends.length < 3,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，你想约上次一起吃饭的朋友再聚一聚。发了微信——"最近有空吗？"等了一天才收到回复："最近太忙了，下次一定。"你打开朋友圈，看到对方昨天发了和别人的聚餐照片。你关掉手机，忽然明白——有些人走着走着就散了，不是因为什么大事，就是因为"忙"。`,
    applyEffect: (s) => {
      s.happiness = Math.max(0, s.happiness - 5);
    },
  },
  {
    id: 'dinner_friends_branch_B',
    triggerCardId: 'dinner_friends',
    delayYears: 1,
    condition: (s) => s.friends.length >= 3,
    emotion: 'warm',
    getText: (s) => `第${s.currentAge}岁，上次一起吃饭的那个朋友突然给你发了一条消息："上次聊的那个事，我帮你问了，有戏。"你们隔着手机屏幕互相道谢。你发现——有些朋友不是"吃饭才联系"的关系，是那种关键时刻能帮上忙的。你默默在心里给这段友谊加了分。`,
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 5);
    },
  },

  // =========================================================================
  // 19. hobby_class（兴趣班）
  // =========================================================================
  {
    id: 'hobby_class_branch_A',
    triggerCardId: 'hobby_class',
    delayYears: 2,
    condition: (s) => !s.hasSideHustle && Math.random() < 0.15,
    emotion: 'funny',
    getText: (s) => `第${s.currentAge}岁，你兴趣班学的东西居然变现了！你开始周末接一些小活，虽然赚的不多，但那种"爱好也能赚钱"的感觉让你觉得自己是全能选手。你发了条朋友圈"人生没有白走的路"，配图是你兴趣班的作品。朋友评论"所以你到底学的是什么？"`,
    applyEffect: (s) => {
      s.passiveIncome += randInt(2000, 5000);
      s.happiness = Math.min(100, s.happiness + 10);
    },
  },
  {
    id: 'hobby_class_branch_B',
    triggerCardId: 'hobby_class',
    delayYears: 1,
    condition: (s) => s.stress > 50,
    emotion: 'warm',
    getText: (s) => `第${s.currentAge}岁，你发现每周去兴趣班的那两个小时，是整周最放松的时刻。不需要看邮件、不需要回消息、不需要假装忙碌。你只是安安静静地做一件事——可能是画画、可能是弹琴、可能是烘焙。两个小时后你出来，觉得自己活过来了。`,
    applyEffect: (s) => {
      s.stress = Math.max(0, s.stress - 10);
      s.happiness = Math.min(100, s.happiness + 8);
    },
  },

  // =========================================================================
  // 20. health_food（自己做饭）
  // =========================================================================
  {
    id: 'health_food_branch_A',
    triggerCardId: 'health_food',
    delayYears: 2,
    condition: (s) => s.health > 70,
    emotion: 'warm',
    getText: (s) => `第${s.currentAge}岁，你发现了自己做饭的隐藏好处——体重轻了五斤，体检报告上的箭头少了两根。朋友问你"怎么瘦的"，你说"做饭"。朋友不信。你给他看了你做的菜的照片，朋友说"原来减肥秘诀是……做给自己吃"。`,
    applyEffect: (s) => {
      s.health = Math.min(100, s.health + 8);
      s.happiness = Math.min(100, s.happiness + 5);
    },
  },
  {
    id: 'health_food_branch_B',
    triggerCardId: 'health_food',
    delayYears: 1,
    condition: (s) => s.stress > 60,
    emotion: 'funny',
    getText: (s) => `第${s.currentAge}岁，你发现切菜是一种很好的解压方式。刀落砧板的声音有节奏感，像在给压力做手术。你甚至在厨房自言自语："今天想剁什么？剁压力还是剁洋葱？"——洋葱。你哭了，分不清是因为洋葱还是因为累。`,
    applyEffect: (s) => {
      s.stress = Math.max(0, s.stress - 8);
      s.happiness = Math.min(100, s.happiness + 3);
    },
  },

  // =========================================================================
  // 21. cut_social（斩断社交）
  // =========================================================================
  {
    id: 'cut_social_branch_A',
    triggerCardId: 'cut_social',
    delayYears: 2,
    condition: (s) => s.currentSavings > 100000,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，你发现退出那些无效社交后，省下来的份子钱和聚餐费加起来居然有两万多。你用这笔钱给自己买了一件想了很久的东西。打开朋友圈，看到那些你退掉的群里还在发抢红包的消息。你笑了笑，关掉了手机。清净真好。`,
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 8);
    },
  },
  {
    id: 'cut_social_branch_B',
    triggerCardId: 'cut_social',
    delayYears: 1,
    condition: (s) => s.isUnemployed,
    emotion: 'salty',
    getText: (s) => `第${s.currentAge}岁，你失业了想找朋友帮忙介绍工作，翻了翻通讯录发现——你之前退的那些群里的人，好像就是最有可能帮上忙的人。你尴尬地想重新加回去，但不知道该说什么。你发了条好友申请——"好久不见"，对方秒通过了，问"你是？"`,
    applyEffect: (s) => {
      s.stress = Math.min(100, s.stress + 10);
      s.happiness = Math.max(0, s.happiness - 5);
    },
  },

  // =========================================================================
  // 22. geo_arbitrage（跨城搬家）
  // =========================================================================
  {
    id: 'geo_arbitrage_branch_A',
    triggerCardId: 'geo_arbitrage',
    delayYears: 2,
    condition: (s) => s.currentCity === '避风低洼地' || s.currentCity === '中坚大后方',
    emotion: 'warm',
    getText: (s) => `第${s.currentAge}岁，你已经适应了新城市的生活。虽然工资低了，但生活成本也低了很多——你发现每个月能多存下30%的钱。最意外的是，你在这里认识了一群新朋友，他们不像大城市的人那样忙着焦虑，而是悠闲地过着小日子。你第一次觉得——"慢下来"也不错。`,
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 10);
      s.stress = Math.max(0, s.stress - 8);
    },
  },
  {
    id: 'geo_arbitrage_branch_B',
    triggerCardId: 'geo_arbitrage',
    delayYears: 2,
    condition: (s) => s.currentCity === '资本修罗场',
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，你在新城市的头两年过得很不适应。找不到好吃的馆子、听不懂当地方言、交不到新朋友。你开始想念以前的城市——虽然贵，但至少有人陪你喝到凌晨两点。你打开地图APP看了看回家的距离，又关掉了。`,
    applyEffect: (s) => {
      s.stress = Math.min(100, s.stress + 10);
      s.happiness = Math.max(0, s.happiness - 8);
    },
  },

  // =========================================================================
  // 23. parent_travel（带父母旅游）
  // =========================================================================
  {
    id: 'parent_travel_branch_A',
    triggerCardId: 'parent_travel',
    delayYears: 1,
    condition: (s) => s.parents.health < 40,
    emotion: 'crying',
    getText: (s) => `第${s.currentAge}岁，那次旅行的照片成了你最珍贵的记忆。因为半年后，你爸妈的身体就不太允许长途旅行了。你翻看照片，他们在景点笑得像个孩子，你站在身后。你把那几张照片冲洗了出来，放在钱包里——每次打开就能看到。有些风景，错过就真的错过了。`,
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 10);
      s.stress = Math.min(100, s.stress + 5);
    },
  },

  // =========================================================================
  // 24. child_tutoring（给孩子报班）
  // =========================================================================
  {
    id: 'child_tutoring_branch_A',
    triggerCardId: 'child_tutoring',
    delayYears: 2,
    condition: (s) => s.children.some(c => c.academicPerformance > 70),
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，孩子的成绩进了班级前十。家长群里老师点名表扬，你终于不用在群里"潜水"了。你把成绩单截图发给了爸妈，他们回了一个竖大拇指的表情。你看了看账单——那些课外班的钱，好像花得值了。虽然孩子嘴上说着"不想上课外班"，但你看到ta拿着奖状回家时的那个笑容——值了。`,
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 12);
    },
  },
  {
    id: 'child_tutoring_branch_B',
    triggerCardId: 'child_tutoring',
    delayYears: 1,
    condition: (s) => s.children.some(c => c.rebelliousness > 50),
    emotion: 'spicy',
    getText: (s) => `第${s.currentAge}岁，孩子开始叛逆了。课外班不想去，作业不想写，跟你说话不超过三个字。你报的那个奥数班，孩子直接说"你为什么什么都要管"。你气得想打人，但忍住了。你坐在沙发上发呆，想起自己的青春期——好像也没比ta好到哪去。你给ta削了个苹果，放在书桌上。没说话。`,
    applyEffect: (s) => {
      s.stress = Math.min(100, s.stress + 10);
      s.happiness = Math.max(0, s.happiness - 5);
    },
  },

  // =========================================================================
  // 25. invest_fund（定投基金）
  // =========================================================================
  {
    id: 'invest_fund_branch_A',
    triggerCardId: 'invest_fund',
    delayYears: 2,
    condition: (s) => s.indexFundPct > 20 && s.currentSavings > 100000,
    emotion: 'spicy',
    getText: (s) => `第${s.currentAge}岁，你打开基金账户——红了！这一年定投终于看到正收益了。你截了个图想发朋友圈炫耀，又觉得不体面。最后你发了条"坚持就是胜利"，配了一个健身的自拍。朋友在评论区问"这跟基金有关系吗？"你说"有关系——都是坚持"。`,
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 8);
    },
  },
  {
    id: 'invest_fund_branch_B',
    triggerCardId: 'invest_fund',
    delayYears: 2,
    condition: (s) => s.economicCycle === 2,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，基金账户绿成了一片草原。你定投了两年，现在总收益是负的。你在基金社区发帖"定投到底有用吗"，底下全是"有用！""坚持！""我在坚持！"。但你发现——说"有用"的人主页也在发"基金亏了怎么办"。`,
    applyEffect: (s) => {
      s.stress = Math.min(100, s.stress + 8);
      s.happiness = Math.max(0, s.happiness - 5);
    },
  },

  // =========================================================================
  // 26. side_gig（接私活）
  // =========================================================================
  {
    id: 'side_gig_branch_A',
    triggerCardId: 'side_gig',
    delayYears: 1,
    condition: (s) => s.health > 60,
    emotion: 'funny',
    getText: (s) => {
      return `第${s.currentAge}岁，你上次的那个客户又找你了——这次加了价。你心里窃喜但嘴上说"最近比较忙"。客户说"加价50%"。你说"好，下周交"。你挂了电话对着镜子练了一下"我可是专业人士"的表情。然后打开电脑——又要熬到凌晨了。`;
    },
    applyEffect: (s) => {
      s.currentSavings += randInt(5000, 15000);
      s.stress = Math.min(100, s.stress + 5);
    },
  },
  {
    id: 'side_gig_branch_B',
    triggerCardId: 'side_gig',
    delayYears: 1,
    condition: (s) => s.health < 50,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，接私活熬的那些夜终于有了代价。你的颈椎出了问题，医生说"长期低头工作导致的"。你看着医疗账单——治疗费比接私活赚的还多。你发了一条朋友圈"出来混迟早要还的"，配图是医院走廊。`,
    applyEffect: (s) => {
      s.health = Math.max(0, s.health - 8);
      s.currentSavings -= randInt(3000, 8000);
    },
  },

  // =========================================================================
  // 27. volunteer（义工）
  // =========================================================================
  {
    id: 'volunteer_branch_A',
    triggerCardId: 'volunteer',
    delayYears: 1,
    condition: (s) => !s.isMarried,
    emotion: 'warm',
    getText: (s) => `第${s.currentAge}岁，你在义工活动中认识了一个人。你们因为同一个理由来到这里——想在这个忙碌的城市里做一些有意义的事。你们一起整理物资、一起陪老人聊天、一起在结束后的路边摊吃了一碗面。你突然觉得——有些缘分，是在做好事的时候遇到的。`,
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 12);
    },
  },
  {
    id: 'volunteer_branch_B',
    triggerCardId: 'volunteer',
    delayYears: 2,
    condition: (s) => s.happiness < 40,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，你发现自己越来越享受做义工的日子了。在养老院陪老人聊天的那个下午，一位奶奶拉着你的手说"你像我孙子"。你鼻子一酸，想起了远方的父母。你决定——下个月带爸妈也来。`,
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 10);
      s.stress = Math.max(0, s.stress - 5);
    },
  },

  // =========================================================================
  // 28. gift_partner（给伴侣惊喜）
  // =========================================================================
  {
    id: 'gift_partner_branch_A',
    triggerCardId: 'gift_partner',
    delayYears: 1,
    condition: (s) => !!s.partner && s.partner.affection > 60,
    emotion: 'sweet',
    getText: (s) => {
      const name = s.partner?.name || '伴侣';
      return `第${s.currentAge}岁，${name}在朋友面前说"我家那个偶尔还挺浪漫的"。你装作不在意，但嘴角偷偷翘了一下。那个惊喜的"投资回报率"真的很高——它不仅让${name}开心了好几天，还让你自己觉得自己是个好伴侣。`;
    },
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 8);
      if (s.partner) s.partner.affection = Math.min(100, s.partner.affection + 5);
    },
  },
  {
    id: 'gift_partner_branch_B',
    triggerCardId: 'gift_partner',
    delayYears: 1,
    condition: (s) => !!s.partner && s.partner.affection < 40,
    emotion: 'salty',
    getText: (s) => {
      const name = s.partner?.name || '伴侣';
      return `第${s.currentAge}岁，你精心准备的惊喜，${name}看了两秒说了句"谢谢"，然后继续看手机。你站在那里觉得自己像个傻子——精心策划了三天，换来了一个"谢谢"两个字。你开始想：到底是礼物不够好，还是这段关系已经凉了？`;
    },
    applyEffect: (s) => {
      s.happiness = Math.max(0, s.happiness - 8);
      s.stress = Math.min(100, s.stress + 5);
    },
  },

  // =========================================================================
  // 29. mentor（带新人）
  // =========================================================================
  {
    id: 'mentor_branch_A',
    triggerCardId: 'mentor',
    delayYears: 2,
    condition: () => Math.random() < 0.3,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，你带的那个新人拿了部门最佳新人奖。领奖的时候他/她说"最想感谢的是我的师傅"。你坐在台下，眼眶有点热。你想起当年的师父——原来传承是这个意思。你打开手机给师父发了一条消息："老师，我也带新人了。"回复很快："恭喜你，长大了。"`,
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 15);
    },
  },
  {
    id: 'mentor_branch_B',
    triggerCardId: 'mentor',
    delayYears: 1,
    condition: (s) => s.stress > 50,
    emotion: 'spicy',
    getText: (s) => `第${s.currentAge}岁，你带的新人问你一个问题，你答不上来。新人说"没事，我百度一下"。那一刻你觉得自己被时代抛弃了——你花了十年积累的经验，在搜索引擎面前一文不值。你回到家打开电脑，开始学最新的技术——不是为了新人，是为了自己不被淘汰。`,
    applyEffect: (s) => {
      s.stress = Math.min(100, s.stress + 8);
      s.happiness = Math.max(0, s.happiness - 3);
    },
  },

  // =========================================================================
  // 30. upgrade_side_hustle（升级副业）
  // =========================================================================
  {
    id: 'upgrade_side_hustle_branch_A',
    triggerCardId: 'upgrade_side_hustle',
    delayYears: 2,
    condition: (s) => s.passiveIncome > 50000,
    emotion: 'sweet',
    getText: (s) => {
      const monthly = Math.round(s.passiveIncome / 12);
      return `第${s.currentAge}岁，你的副业收入已经稳定在每月${monthly}了。你开始认真考虑——要不要辞职全职做？你算了算：如果副业收入能再翻一倍，你就可以跟老板说再见。但你也知道"稳定"和"自由"之间永远隔着一个"万一"。`;
    },
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 8);
    },
  },
  {
    id: 'upgrade_side_hustle_branch_B',
    triggerCardId: 'upgrade_side_hustle',
    delayYears: 1,
    condition: (s) => s.passiveIncome < 30000,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，你探索的新方向没有起色。投入的时间和金钱好像打了水漂。你安慰自己"试错也是成本"，但看着银行卡余额往下掉的时候还是心疼。你把这个方向关了，告诉自己"下一个方向会更好"——虽然你已经说了三次同样的话。`,
    applyEffect: (s) => {
      s.currentSavings -= randInt(5000, 15000);
      s.stress = Math.min(100, s.stress + 8);
    },
  },

  // =========================================================================
  // 31. upgrade_server（升级服务器）
  // =========================================================================
  {
    id: 'upgrade_server_branch_A',
    triggerCardId: 'upgrade_server',
    delayYears: 2,
    condition: (s) => s.passiveIncome > 30000,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，升级后的服务器终于开始赚钱了。你打开副业后台——收入曲线像一架起飞的飞机。当初升级服务器花的那两万块，现在看来是最划算的一笔投资。你决定给服务器起个名字——就叫"吞金兽"。`,
    applyEffect: (s) => {
      s.passiveIncome += randInt(3000, 8000);
      s.happiness = Math.min(100, s.happiness + 8);
    },
  },
  {
    id: 'upgrade_server_branch_B',
    triggerCardId: 'upgrade_server',
    delayYears: 1,
    condition: (s) => s.passiveIncome <= 30000,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，升级后的服务器电费和带宽费每个月都在涨，但副业收入还没跟上。你看着账单，发现维护成本快赶上收入了。你开始怀疑——这到底是"升级"还是"给自己挖了个坑"。`,
    applyEffect: (s) => {
      s.passiveIncome = Math.max(0, s.passiveIncome - randInt(2000, 5000));
      s.stress = Math.min(100, s.stress + 8);
    },
  },

  // =========================================================================
  // 32. commercial_pension（商业养老）
  // =========================================================================
  {
    id: 'commercial_pension_branch_A',
    triggerCardId: 'commercial_pension',
    delayYears: 5,
    condition: (s) => s.currentAge >= 50,
    emotion: 'warm',
    getText: (s) => {
      const amount = Math.round(s.currentAge >= 55 ? 30000 : 20000);
      return `第${s.currentAge}岁，你收到了商业养老险的第一笔返还年金——${amount}元。你看着银行到账短信愣了两秒，然后笑了。十年前的自己做了一个正确的决定。你打开手机想告诉爸妈——他们已经不在了。你对着到账短信说了声"谢谢自己"。`;
    },
    applyEffect: (s) => {
      s.currentSavings += randInt(20000, 30000);
      s.happiness = Math.min(100, s.happiness + 10);
    },
  },
  {
    id: 'commercial_pension_branch_B',
    triggerCardId: 'commercial_pension',
    delayYears: 2,
    condition: (s) => s.stress > 60,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，交保费的日子又到了。你打开银行App准备转账，看到余额——不多了。你犹豫了一下要不要退保，最后还是转了。你安慰自己"就当强制储蓄了"，但你知道，每个月多出来的这笔支出，在你最缺钱的时候格外扎眼。`,
    applyEffect: (s) => {
      s.stress = Math.min(100, s.stress + 5);
    },
  },

  // =========================================================================
  // 33. new_phone（换手机）
  // =========================================================================
  {
    id: 'new_phone_branch_A',
    triggerCardId: 'new_phone',
    delayYears: 2,
    condition: () => Math.random() < 0.3,
    emotion: 'funny',
    getText: (s) => `第${s.currentAge}岁，你的旧手机终于撑不住了——电池一天要充三次，打开APP要等十秒。你庆幸自己两年前换了新手机——旧手机虽然还能用，但那种"每操作一步都要等"的感觉，足以让人崩溃。你把旧手机放在抽屉里，和之前的旧手机们排成一排——它们像一部你的消费进化史。`,
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 3);
    },
  },
  {
    id: 'new_phone_branch_B',
    triggerCardId: 'new_phone',
    delayYears: 1,
    condition: (s) => s.happiness < 40,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，你打开新手机，翻看相册——全是工作截图和备忘录。你突然意识到，你花了大几千块买的这个东西，陪你度过的全是加班和焦虑。新手机带来的快乐只持续了两天，但绑定的分期付款要持续十二个月。`,
    applyEffect: (s) => {
      s.happiness = Math.max(0, s.happiness - 3);
      s.stress = Math.min(100, s.stress + 3);
    },
  },

  // =========================================================================
  // 34. save_challenge（省钱挑战）
  // =========================================================================
  {
    id: 'save_challenge_branch_A',
    triggerCardId: 'save_challenge',
    delayYears: 1,
    condition: (s) => s.currentSavings > 50000,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，那个月只花1000块的挑战结束后，你养成了记账的习惯。半年下来你发现——原来每月的"隐形消费"加起来居然有两千多。一杯奶茶、一次打车、一个"打折也用不上的东西"……你开始理解什么叫"拿铁因子"。`,
    applyEffect: (s) => {
      s.currentSavings += randInt(2000, 5000);
      s.happiness = Math.min(100, s.happiness + 5);
    },
  },
  {
    id: 'save_challenge_branch_B',
    triggerCardId: 'save_challenge',
    delayYears: 1,
    condition: (s) => s.stress > 60,
    emotion: 'salty',
    getText: (s) => `第${s.currentAge}岁，省钱挑战结束后的第一个月，你报复性消费了三千块。你打开淘宝看了看购物车——全是之前想买但忍住没买的东西。你告诉自己"犒劳自己一下"，但付款的时候还是有种"上个月白省了"的感觉。`,
    applyEffect: (s) => {
      s.currentSavings -= randInt(2000, 4000);
      s.happiness = Math.min(100, s.happiness + 3);
      s.stress = Math.max(0, s.stress - 3);
    },
  },

  // =========================================================================
  // 35. elderly_care（养生）
  // =========================================================================
  {
    id: 'elderly_care_branch_A',
    triggerCardId: 'elderly_care',
    delayYears: 2,
    condition: (s) => s.health > 50,
    emotion: 'warm',
    getText: (s) => `第${s.currentAge}岁，你坚持了两年的养生终于有了回报——体检报告比两年前好了不少。医生说"你的同龄人很少有这个指标水平的"。你笑了笑，没说自己每天早起打太极、泡枸杞、拒绝宵夜的生活有多自律。回家路上你发了条朋友圈"养生两年，感觉赚了"。`,
    applyEffect: (s) => {
      s.health = Math.min(100, s.health + 10);
      s.happiness = Math.min(100, s.happiness + 8);
    },
  },
  {
    id: 'elderly_care_branch_B',
    triggerCardId: 'elderly_care',
    delayYears: 1,
    condition: (s) => s.hasChild,
    emotion: 'funny',
    getText: (s) => `第${s.currentAge}岁，你的孩子看到你打太极的视频发到了朋友圈，配文"我爸/我妈提前进入老年生活"。评论区一堆哈哈哈。你假装生气说"这是养生你懂不懂"，但你也笑了——孩子说得也没错。你确实开始活得像退休老头/老太太了。但你的身体知道答案。`,
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 5);
    },
  },

  // =========================================================================
  // 36. early_retirement_prep（退休规划）
  // =========================================================================
  {
    id: 'early_retirement_prep_branch_A',
    triggerCardId: 'early_retirement_prep',
    delayYears: 2,
    condition: (s) => s.currentSavings > 100000,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，你按照退休规划师的方案执行了两年。虽然过程痛苦——每个月强制储蓄、削减消费、优化投资——但打开存款App的时候，数字的增长曲线让你觉得一切都值了。规划师说的那句话你终于理解了："种一棵树最好的时间是十年前，其次是现在。"`,
    applyEffect: (s) => {
      s.currentSavings += randInt(10000, 30000);
      s.happiness = Math.min(100, s.happiness + 8);
      s.stress = Math.max(0, s.stress - 5);
    },
  },
  {
    id: 'early_retirement_prep_branch_B',
    triggerCardId: 'early_retirement_prep',
    delayYears: 1,
    condition: (s) => s.currentSavings < 50000,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，你打开那份退休规划表，发现自己离目标还差很远。规划师建议的那些方案，你大部分都做不到——因为"省不下钱"这三个字比任何规划都更有力。你把规划表折起来塞进了抽屉。也许以后再看。也许不会。`,
    applyEffect: (s) => {
      s.stress = Math.min(100, s.stress + 10);
      s.happiness = Math.max(0, s.happiness - 5);
    },
  },

  // =========================================================================
  // 37. part_time（退休返聘）
  // =========================================================================
  {
    id: 'part_time_branch_A',
    triggerCardId: 'part_time',
    delayYears: 1,
    condition: (s) => s.health > 60,
    emotion: 'warm',
    getText: (s) => `第${s.currentAge}岁，你在返聘的岗位上越干越顺。年轻人叫你"老师"，有什么问题都先来问你。你发现，退休后反而比退休前更有存在感了——也许是因为不再需要证明什么，反而更放松了。`,
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 10);
      s.stress = Math.max(0, s.stress - 5);
    },
  },
  {
    id: 'part_time_branch_B',
    triggerCardId: 'part_time',
    delayYears: 1,
    condition: (s) => s.health < 50,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，返聘的工作让你的身体有点吃不消。年轻人一天能坐八小时不动，你坐四个小时就腰酸背痛。你开始想——也许该真的退休了。但"闲下来"这三个字比任何工作都更让你害怕。`,
    applyEffect: (s) => {
      s.health = Math.max(0, s.health - 5);
      s.stress = Math.min(100, s.stress + 8);
    },
  },

  // =========================================================================
  // 38. social_media（自媒体）
  // =========================================================================
  {
    id: 'social_media_branch_A',
    triggerCardId: 'social_media',
    delayYears: 2,
    condition: (s) => s.happiness > 50,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，你在网上写的那些东西，竟然帮助了一些人。有读者私信你"看了你的文章后决定不辞职了""你的经历给了我勇气"。你第一次发现——原来你的人生经历，对别人来说也有价值。你决定继续写下去。`,
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 12);
      s.passiveIncome += randInt(3000, 8000);
    },
  },
  {
    id: 'social_media_branch_B',
    triggerCardId: 'social_media',
    delayYears: 1,
    condition: (s) => s.stress > 60,
    emotion: 'salty',
    getText: (s) => `第${s.currentAge}岁，你发了一篇文章后收到一条评论："有什么资格教别人怎么活？你自己不也混成这样？"你盯着这条评论看了五分钟，然后删掉了自己的文章。你关掉电脑，在阳台上站了很久。写作是一件需要勇气的事——尤其是在网络上。`,
    applyEffect: (s) => {
      s.happiness = Math.max(0, s.happiness - 8);
      s.stress = Math.min(100, s.stress + 5);
    },
  },

  // =========================================================================
  // 39. health_check（体检）
  // =========================================================================
  {
    id: 'health_check_branch_A',
    triggerCardId: 'health_check',
    delayYears: 1,
    condition: (s) => s.health < 50,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，上次体检飘红的那几项指标，你一直没放在心上。今天身体发出了更强烈的信号——你不得不承认，"拖着不看"是最蠢的策略。你翻出去年体检报告，上面那几个箭头像是在嘲笑你。你终于拿起电话预约了复查。`,
    applyEffect: (s) => {
      s.stress = Math.min(100, s.stress + 8);
      s.currentSavings -= randInt(2000, 5000);
    },
  },
  {
    id: 'health_check_branch_B',
    triggerCardId: 'health_check',
    delayYears: 1,
    condition: (s) => s.health >= 70,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，你按时做了体检。报告比去年还好——去年那些小问题都消失了。医生说"你最近生活习惯改善了不少"。你笑了——想起当年开始体检的时候，报告上的箭头比你工资涨得还快。坚持这件事，果然有回报。`,
    applyEffect: (s) => {
      s.health = Math.min(100, s.health + 5);
      s.happiness = Math.min(100, s.happiness + 5);
    },
  },

  // =========================================================================
  // 40. invest_fixed_deposit（定期存款）
  // =========================================================================
  {
    id: 'invest_fixed_deposit_branch_A',
    triggerCardId: 'invest_fixed_deposit',
    delayYears: 2,
    condition: (s) => s.economicCycle === 2,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，股市一片哀嚎，基金账户绿成草原。但你看了看银行理财——稳稳的4.2%收益，一分没少。你第一次理解了"稳健"这两个字的含金量。朋友圈里别人在哀嚎"亏了多少"，你默默地喝了口枸杞茶。不刺激，但安心。`,
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 8);
    },
  },
  {
    id: 'invest_fixed_deposit_branch_B',
    triggerCardId: 'invest_fixed_deposit',
    delayYears: 2,
    condition: (s) => s.currentSavings > 200000,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，你看了一眼银行理财的收益——4.2%。再看了一眼朋友圈里晒"基金翻倍"的截图。你算了算：如果当初把钱全投基金，现在可能多赚一倍。但如果你当初全投基金，也可能亏一半。你关掉手机，安慰自己"稳健也是一种策略"。但你心里清楚——这是穷人对自己最好的安慰。`,
    applyEffect: (s) => {
      s.happiness = Math.max(0, s.happiness - 3);
      s.stress = Math.min(100, s.stress + 3);
    },
  },

  // =========================================================================
  // 41. open_stock（开户炒股）
  // =========================================================================
  {
    id: 'open_stock_branch_A',
    triggerCardId: 'open_stock',
    delayYears: 2,
    condition: (s) => s.economicCycle !== 2,
    emotion: 'spicy',
    getText: (s) => {
      const gain = randInt(20000, 80000);
      return `第${s.currentAge}岁，你打开了股票账户——红了！这一年股市行情不错，你的账户浮盈${gain}元。你截了个图想发朋友圈炫耀，又觉得不体面。最后你发了条"价值投资永远是对的"，配了一个跑步的自拍。但你知道——如果不是行情好，你现在就是那个"被套的韭菜"。`;
    },
    applyEffect: (s) => {
      s.currentSavings += randInt(20000, 80000);
      s.happiness = Math.min(100, s.happiness + 10);
    },
  },
  {
    id: 'open_stock_branch_B',
    triggerCardId: 'open_stock',
    delayYears: 3,
    condition: (s) => s.economicCycle === 2,
    emotion: 'crying',
    getText: (s) => {
      const loss = randInt(30000, 100000);
      return `第${s.currentAge}岁，股市崩了。你打开账户——绿色铺满了整个屏幕。当初转进去的20%仓位腰斩了还多，浮亏${loss}元。你关掉APP又打开，重复了十几次，希望数字会变。它没有变。你发了条朋友圈"我再也不炒股了"，三天后又打开了盯盘。`;
    },
    applyEffect: (s) => {
      s.currentSavings -= randInt(30000, 100000);
      s.stress = Math.min(100, s.stress + 20);
      s.happiness = Math.max(0, s.happiness - 15);
    },
  },

  // =========================================================================
  // 42. buy_gold（买黄金）
  // =========================================================================
  {
    id: 'buy_gold_branch_A',
    triggerCardId: 'buy_gold',
    delayYears: 3,
    condition: (s) => s.economicCycle === 2,
    emotion: 'sweet',
    getText: (s) => {
      const gainWan = randInt(1, 3);
      return `第${s.currentAge}岁，经济不景气，但你买的黄金涨了不少——每克比你买入时高了将近${gainWan * 50}块。你打开金店的官网看了看回收价，心里美滋滋的。你妈说"还好你买了黄金，不然这些钱全在股市里亏了"。你第一次觉得——原来"保守"也可以是一种胜利。`;
    },
    applyEffect: (s) => {
      s.currentSavings += randInt(10000, 30000);
      s.happiness = Math.min(100, s.happiness + 10);
    },
  },
  {
    id: 'buy_gold_branch_B',
    triggerCardId: 'buy_gold',
    delayYears: 2,
    condition: (s) => s.economicCycle !== 2,
    emotion: 'salty',
    getText: (s) => `第${s.currentAge}岁，你打开金价走势图，发现黄金已经横盘两年了。当初花好几万买的金条，现在价格几乎没动。你想卖又觉得亏了"机会成本"，不卖又占着资金。你打开银行理财看了看4%的年化收益——如果当初没买黄金，现在已经赚了不少利息。你把金价走势图关了，打开了炒股App。`,
    applyEffect: (s) => {
      s.happiness = Math.max(0, s.happiness - 5);
      s.stress = Math.min(100, s.stress + 5);
    },
  },

  // =========================================================================
  // 43. buy_shop（买商铺）
  // =========================================================================
  {
    id: 'buy_shop_branch_A',
    triggerCardId: 'buy_shop',
    delayYears: 2,
    condition: (s) => s.economicCycle !== 2,
    emotion: 'sweet',
    getText: (s) => {
      const monthlyRent = (s as any).shopMonthlyRent || 4000;
      return `第${s.currentAge}岁，你的商铺迎来了一位好租客——开了一家网红奶茶店。生意火爆，租金按时到账，每月${monthlyRent}元的被动收入让你感觉自己迈出了"财务自由"的第一小步。你路过商铺的时候看到排队的长龙，觉得当初那个中介虽然嘴油了点，但这话确实没说错。`;
    },
    applyEffect: (s) => {
      s.passiveIncome += randInt(6000, 12000);
      s.happiness = Math.min(100, s.happiness + 12);
    },
  },
  {
    id: 'buy_shop_branch_B',
    triggerCardId: 'buy_shop',
    delayYears: 2,
    condition: (s) => s.economicCycle === 2,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，商铺的租客跑路了——走的时候还欠了三个月租金没给。你去找物业，物业说"这不归我们管"。你去找中介，中介说"这个价位再找租客可能要等一阵子"。你站在空荡荡的商铺门口，看着墙上贴的"旺铺转让"自己写的电话号码。当初中介说"这位置以后肯定旺"——也许"以后"还没到。`,
    applyEffect: (s) => {
      s.passiveIncome = Math.max(0, s.passiveIncome - randInt(12000, 36000));
      s.stress = Math.min(100, s.stress + 15);
      s.currentSavings -= randInt(10000, 30000);
    },
  },

  // =========================================================================
  // 44. futures_bet（期货投机）
  // =========================================================================
  {
    id: 'futures_bet_branch_A',
    triggerCardId: 'futures_bet',
    delayYears: 2,
    condition: (s) => s.stress > 50,
    emotion: 'crying',
    getText: (s) => {
      const loss = randInt(50000, 200000);
      return `第${s.currentAge}岁，期货爆仓了。那个深夜你看着账户归零的数字，手在发抖。${loss}块，说没就没了。你想起当初开户时客服说的"期货有风险，投资需谨慎"——当时你觉得自己会是那个例外。现在你明白了：在期货市场，没有人是例外。你关掉了交易软件，删掉了所有期货群的聊天记录。`;
    },
    applyEffect: (s) => {
      s.currentSavings -= randInt(50000, 200000);
      s.stress = Math.min(100, s.stress + 25);
      s.happiness = Math.max(0, s.happiness - 20);
    },
  },
  {
    id: 'futures_bet_branch_B',
    triggerCardId: 'futures_bet',
    delayYears: 1,
    condition: (s) => s.stress <= 50,
    emotion: 'spicy',
    getText: (s) => {
      const gain = randInt(30000, 150000);
      return `第${s.currentAge}岁，你在期货上赚了一波大的——${gain}块入账。你激动得在办公室拍了桌子。同事问你是不是中了彩票，你神秘一笑说"这是实力"。你做了一个明智的决定——见好就收，把利润转回了银行理财。你知道期货上的钱来得快去得更快。这一刻的克制，比赚钱更值得骄傲。`;
    },
    applyEffect: (s) => {
      s.currentSavings += randInt(30000, 150000);
      s.happiness = Math.min(100, s.happiness + 15);
      s.stress = Math.max(0, s.stress - 5);
    },
  },

  // =========================================================================
  // 45. add_fund（追加基金投资）
  // =========================================================================
  {
    id: 'add_fund_branch_A',
    triggerCardId: 'add_fund',
    delayYears: 2,
    condition: (s) => s.economicCycle === 2,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，基金腰斩了。你当初加仓的那些钱，现在只剩一半。你在基金社区发帖"还要不要继续定投"，底下有人说"现在是最好的加仓时机"。你看了下自己的账户，又看了下银行卡余额——决定继续。不是因为相信那些评论，而是因为你已经没有退路了。"死扛到底"听起来很英勇，其实是没得选。`,
    applyEffect: (s) => {
      s.currentSavings -= randInt(10000, 40000);
      s.stress = Math.min(100, s.stress + 10);
    },
  },
  {
    id: 'add_fund_branch_B',
    triggerCardId: 'add_fund',
    delayYears: 3,
    condition: (s) => s.economicCycle !== 2 && s.indexFundPct > 20,
    emotion: 'salty',
    getText: (s) => {
      const gain = randInt(15000, 60000);
      return `第${s.currentAge}岁，基金大涨了！你的累计收益有${gain}元。但问题是——你没卖。你每天都对自己说"再涨一点就卖"，结果等来了一波回调。你看着从最高点回落了20%的收益曲线，第一次理解了什么叫"纸上富贵"。你在基金App里设了一个止盈提醒，但心里知道——下次你还是会犹豫。`;
    },
    applyEffect: (s) => {
      s.currentSavings += randInt(10000, 30000);
      s.happiness = Math.min(100, s.happiness + 5);
      s.stress = Math.min(100, s.stress + 3);
    },
  },

  // =========================================================================
  // 46. add_stock（炒股加仓）
  // =========================================================================
  {
    id: 'add_stock_branch_A',
    triggerCardId: 'add_stock',
    delayYears: 2,
    condition: (s) => s.economicCycle === 2,
    emotion: 'crying',
    getText: (s) => {
      const loss = randInt(20000, 80000);
      return `第${s.currentAge}岁，股灾来了。你打开股票App发现所有股票都是绿的，像一片悲伤的森林。你加仓的那些钱亏了${loss}元。你在"割肉"和"死扛"之间纠结了三天，最后在最低点那天扛不住了，全部卖出。三天后股市反弹——你完美错过了反弹，精准踩中了每一个坑。`;
    },
    applyEffect: (s) => {
      s.currentSavings -= randInt(20000, 80000);
      s.stress = Math.min(100, s.stress + 20);
      s.happiness = Math.max(0, s.happiness - 15);
    },
  },
  {
    id: 'add_stock_branch_B',
    triggerCardId: 'add_stock',
    delayYears: 3,
    condition: (s) => s.economicCycle !== 2,
    emotion: 'warm',
    getText: (s) => `第${s.currentAge}岁，经过这几年的起起落落，你终于学会了止损。你给自己定了一个铁律：亏10%必卖，不抄底不追高。你发现——当你不再每天盯盘的时候，生活变得轻松了很多。你把炒股App放进了手机第二屏，偶尔打开看一眼。投资不是赌博，而是修行。你觉得自己终于从一个韭菜，进化成了……稍微聪明一点的韭菜。`,
    applyEffect: (s) => {
      s.stress = Math.max(0, s.stress - 10);
      s.happiness = Math.min(100, s.happiness + 8);
    },
  },

  // =========================================================================
  // 47. buy_lottery（买彩票）
  // =========================================================================
  {
    id: 'lottery_branch_A',
    triggerCardId: 'buy_lottery',
    delayYears: 1,
    condition: () => true,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，开奖日。你坐在沙发上，手里攥着那张皱巴巴的彩票，对着电视上的开奖号码一个一个核对——没有一个对上的。你把彩票折好塞进钱包夹层，叹了口气。明天还要上班，房贷还要还，生活还是要继续。那50块钱，就当是给梦想交的税了。`,
    applyEffect: (s) => {
      s.stress = Math.min(100, s.stress + 2);
      s.happiness = Math.max(0, s.happiness - 2);
    },
  },
  {
    id: 'lottery_branch_B',
    triggerCardId: 'buy_lottery',
    delayYears: 1,
    condition: (s) => s.currentSavings < 100000 && Math.random() < 0.30,
    emotion: 'sweet',
    getText: (s) => {
      const gain = 200 + Math.floor(Math.random() * 800);
      return `第${s.currentAge}岁，开奖日。你漫不经心地对着号码——中了！虽然只是个末等奖，${gain}元。但你笑得像个孩子，跑到楼下便利店兑了奖，用这钱买了杯奶茶和一包薯片。这种小小的快乐，比中大奖还真实。`;
    },
    applyEffect: (s) => {
      const gain = 200 + Math.floor(Math.random() * 800);
      s.currentSavings += gain;
      s.happiness = Math.min(100, s.happiness + 8);
      s.stress = Math.max(0, s.stress - 3);
    },
  },
  {
    id: 'lottery_branch_C',
    triggerCardId: 'buy_lottery',
    delayYears: 1,
    condition: (s) => s.happiness > 60 && Math.random() < 0.05,
    emotion: 'warm',
    getText: (s) => {
      const gain = 50000 + Math.floor(Math.random() * 150000);
      return `第${s.currentAge}岁，开奖日。你本来已经不抱希望了，随意瞥了一眼——等等，好像……对上了三个？五个？六个？！你手在抖，心脏快跳出嗓子眼。你中了一等奖——${gain.toLocaleString()}元！你坐在地上笑了五分钟，然后哭了。这不是电影，这是你的生活。`;
    },
    applyEffect: (s) => {
      const gain = 50000 + Math.floor(Math.random() * 150000);
      s.currentSavings += gain;
      s.happiness = Math.min(100, s.happiness + 30);
      s.stress = Math.max(0, s.stress - 15);
    },
  },

];

// ========== 盲盒检测与触发函数 ==========

/**
 * 待触发的盲盒条目
 */
export interface PendingBlindBox {
  /** 盲盒分支ID */
  outcomeId: string;
  /** 触发时的玩家年龄 */
  triggerAge: number;
}

/**
 * 检测当前年度应触发的盲盒分支
 *
 * @param state 当前游戏状态
 * @param pendingBlindBoxes 待触发的盲盒队列
 * @returns { outcomes: 已触发的盲盒分支, remaining: 尚未到期的盲盒 }
 */
export function detectBlindBoxOutcomes(
  state: GameState,
  pendingBlindBoxes: PendingBlindBox[]
): {
  outcomes: BlindBoxOutcome[];
  remaining: PendingBlindBox[];
} {
  const triggered: BlindBoxOutcome[] = [];
  const remaining: PendingBlindBox[] = [];

  for (const pending of pendingBlindBoxes) {
    if (state.currentAge >= pending.triggerAge) {
      // 查找对应的盲盒分支定义
      const outcome = BLIND_BOX_OUTCOMES.find(o => o.id === pending.outcomeId);
      if (!outcome) {
        // 未找到定义，跳过
        continue;
      }

      // 注册时已根据选卡时的状态确定了唯一分支，揭晓时直接触发
      // 不再重复检查条件，确保"选卡时的决定决定未来"
      triggered.push(outcome);
    } else {
      remaining.push(pending);
    }
  }

  return { outcomes: triggered, remaining };
}

/**
 * 根据卡片ID注册所有对应的盲盒分支到待触发队列
 * 在玩家选择卡片后调用此函数，将盲盒注册到 pendingBlindBoxes
 *
 * @param cardId 被选择的卡片ID
 * @returns 需要注册的待触发盲盒列表
 */
export function registerBlindBoxesForCard(cardId: string): PendingBlindBox[] {
  const outcomes = BLIND_BOX_OUTCOMES.filter(o => o.triggerCardId === cardId);
  return outcomes.map(o => ({
    outcomeId: o.id,
    // 注意：triggerAge 在注册时不确定（需要当前年龄 + delayYears）
    // 实际注册时由调用者填入
    triggerAge: 0,
  }));
}

/**
 * 注册盲盒的完整版本（已知当前年龄）
 *
 * @param cardId 被选择的卡片ID
 * @param currentAge 当前年龄
 * @returns 需要注册的待触发盲盒列表（含正确 triggerAge）
 */
export function registerBlindBoxesForCardAtAge(
  cardId: string,
  currentAge: number
): PendingBlindBox[] {
  const outcomes = BLIND_BOX_OUTCOMES.filter(o => o.triggerCardId === cardId);
  return outcomes.map(o => ({
    outcomeId: o.id,
    triggerAge: currentAge + o.delayYears,
  }));
}
