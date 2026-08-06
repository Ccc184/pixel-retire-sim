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
import { applyChainHoldingScale } from '../utils/math-engine.js';

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
    getText: (s) => `第${s.currentAge}岁，你发现自己的生活变简单后，时间变多了。你开始每天花两小时看书、散步、发呆。动态圈里别人在晒新包新车新旅行，你在晒阳台上的夕阳。有人评论"好羡慕你的从容"，你回复两个字："省钱"。`,
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
    getText: (s) => `第${s.currentAge}岁，你终于扛不住了。白天上班晚上搞副业的日子已经持续了太久，你的身体开始用各种方式抗议——偏头痛、失眠、突然的心悸。你做了一个决定：把副业规模砍掉一半。"赚钱是无限的，命只有一条"，你发了一条仅自己可见的动态圈。`,
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
    getText: (s) => `第${s.currentAge}岁，你在健身房镜子前发现腹肌了——虽然只有两块半。你拍了一张自拍发了动态圈，收获了人生中最多的一次互动。评论区有人说"这是P的吧"，你回复"健身房的镜子自带滤镜"。但你心里美滋滋的。`,
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
      return `第${s.currentAge}岁，失业了。你坐在车里发呆，看着挡风玻璃上的灰。车不养人是真的——保险、保养、油费，一个月至少两千块。你打开二手平台搜了一下同款二手车价，比买入价低了${loss}。你关掉了二手平台。车还在，面子也还在。`;
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
    getText: (s) => `第${s.currentAge}岁，你一个人旅行回来了。照片拍了很多，动态圈也发了，但回家打开门，空荡荡的房间让你停了两秒。旅行让你暂时逃离了孤独，但旅行的终点永远是——回到一个人的房间。`,
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
    getText: (s) => `第${s.currentAge}岁，市场崩了，基金账户缩水了一大半。你看着动态圈里哀嚎遍野，打开自己的账户——还好，有那笔对冲期权，你只亏了20%。你第一次理解什么叫"花钱买安心"。虽然当时买的时候被同事嘲笑"赌博"，现在你就是笑到最后的人。`,
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
      return `第${s.currentAge}岁，你看了看那份对冲期权的成本——每年${annualFee}块的期权费已经交了三年了，市场一直好好的。你开始怀疑自己是不是白花了这笔钱。然后你打开动态圈看了看那些没买对冲就爆仓的人——安慰自己"花钱买个万一"。`;
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
    getText: (s) => `第${s.currentAge}岁，MBA的毕业证终于拿到了。拿到学位证那天你发了一条动态圈，收获了有史以来最多的赞。更重要的是——你的简历上终于有了那个金光闪闪的"硕士"字样。猎头开始主动联系你了。你才知道——原来学历是打开某些门的钥匙，而不是终点。`,
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
    getText: (s) => `第${s.currentAge}岁，你想约上次一起吃饭的朋友再聚一聚。发了社交软件——"最近有空吗？"等了一天才收到回复："最近太忙了，下次一定。"你打开动态圈，看到对方昨天发了和别人的聚餐照片。你关掉手机，忽然明白——有些人走着走着就散了，不是因为什么大事，就是因为"忙"。`,
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
    getText: (s) => `第${s.currentAge}岁，你兴趣班学的东西居然变现了！你开始周末接一些小活，虽然赚的不多，但那种"爱好也能赚钱"的感觉让你觉得自己是全能选手。你发了条动态圈"人生没有白走的路"，配图是你兴趣班的作品。朋友评论"所以你到底学的是什么？"`,
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
    getText: (s) => `第${s.currentAge}岁，你发现退出那些无效社交后，省下来的份子钱和聚餐费加起来居然有两万多。你用这笔钱给自己买了一件想了很久的东西。打开动态圈，看到那些你退掉的群里还在发抢红包的消息。你笑了笑，关掉了手机。清净真好。`,
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
    getText: (s) => `第${s.currentAge}岁，你打开基金账户——红了！这一年定投终于看到正收益了。你截了个图想发动态圈炫耀，又觉得不体面。最后你发了条"坚持就是胜利"，配了一个健身的自拍。朋友在评论区问"这跟基金有关系吗？"你说"有关系——都是坚持"。`,
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
    getText: (s) => `第${s.currentAge}岁，接私活熬的那些夜终于有了代价。你的颈椎出了问题，医生说"长期低头工作导致的"。你看着医疗账单——治疗费比接私活赚的还多。你发了一条动态圈"出来混迟早要还的"，配图是医院走廊。`,
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
    getText: (s) => `第${s.currentAge}岁，省钱挑战结束后的第一个月，你报复性消费了三千块。你打开电商平台看了看购物车——全是之前想买但忍住没买的东西。你告诉自己"犒劳自己一下"，但付款的时候还是有种"上个月白省了"的感觉。`,
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
    getText: (s) => `第${s.currentAge}岁，你坚持了两年的养生终于有了回报——体检报告比两年前好了不少。医生说"你的同龄人很少有这个指标水平的"。你笑了笑，没说自己每天早起打太极、泡枸杞、拒绝宵夜的生活有多自律。回家路上你发了条动态圈"养生两年，感觉赚了"。`,
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
    getText: (s) => `第${s.currentAge}岁，你的孩子看到你打太极的视频发到了动态圈，配文"我爸/我妈提前进入老年生活"。评论区一堆哈哈哈。你假装生气说"这是养生你懂不懂"，但你也笑了——孩子说得也没错。你确实开始活得像退休老头/老太太了。但你的身体知道答案。`,
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
    getText: (s) => `第${s.currentAge}岁，股市一片哀嚎，基金账户绿成草原。但你看了看银行理财——稳稳的4.2%收益，一分没少。你第一次理解了"稳健"这两个字的含金量。动态圈里别人在哀嚎"亏了多少"，你默默地喝了口枸杞茶。不刺激，但安心。`,
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
    getText: (s) => `第${s.currentAge}岁，你看了一眼银行理财的收益——4.2%。再看了一眼动态圈里晒"基金翻倍"的截图。你算了算：如果当初把钱全投基金，现在可能多赚一倍。但如果你当初全投基金，也可能亏一半。你关掉手机，安慰自己"稳健也是一种策略"。但你心里清楚——这是穷人对自己最好的安慰。`,
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
      return `第${s.currentAge}岁，你打开了股票账户——红了！这一年股市行情不错，你的账户浮盈${gain}元。你截了个图想发动态圈炫耀，又觉得不体面。最后你发了条"价值投资永远是对的"，配了一个跑步的自拍。但你知道——如果不是行情好，你现在就是那个"被套的韭菜"。`;
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
      return `第${s.currentAge}岁，股市崩了。你打开账户——绿色铺满了整个屏幕。当初转进去的20%仓位腰斩了还多，浮亏${loss}元。你关掉APP又打开，重复了十几次，希望数字会变。它没有变。你发了条动态圈"我再也不炒股了"，三天后又打开了盯盘。`;
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

  // =========================================================================
  // AI共生者路径专属盲盒（6张卡片，18条分支）
  // 设计原则：反差打脸、伏笔回收、爽虐交织、AI时代感
  // =========================================================================

  // --- ai_prompt_dojo 闭关修炼提示词工程 ---
  {
    id: 'ai_prompt_dojo_branch_A',
    triggerCardId: 'ai_prompt_dojo',
    delayYears: 3,
    condition: (s) => (s.aiSkillLevel ?? 0) >= 25 && !s.isUnemployed,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，公司搞了一次"AI提效大赛"。你用三年前闭关时总结的那套提示词方法论，带着团队把项目交付周期压缩了40%。领奖的时候总监说"你是我们公司最懂AI的人"。你想起三年前同事笑你"不务正业天天跟通用大模型聊天"——那些人现在排队问你"这个prompt怎么写"。你笑了笑，没提当年外卖盒堆成小山的那个月。`,
    applyEffect: (s) => {
      s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.25);
      s.pathFaith = Math.min(100, s.pathFaith + 10);
      s.happiness = Math.min(100, s.happiness + 12);
      s.stress = Math.max(0, s.stress - 5);
    },
  },
  {
    id: 'ai_prompt_dojo_branch_B',
    triggerCardId: 'ai_prompt_dojo',
    delayYears: 1,
    condition: (s) => (s.aiSkillLevel ?? 0) < 25 || s.isUnemployed,
    emotion: 'salty',
    getText: (s) => `第${s.currentAge}岁，AI模型又更新了。你发现你花了一个月摸清的那些"提示词黑魔法"，新版本里一句话就能实现。更新日志里轻描淡写地写着"优化了指令遵循能力"。你盯着屏幕沉默了半分钟，然后笑了——不是苦笑，是真的觉得好笑。你学会的从来不是某几个提示词，而是和AI共舞的感觉。这个，更新不掉。`,
    applyEffect: (s) => {
      s.aiSkillLevel = Math.min(100, (s.aiSkillLevel ?? 0) + 5);
      s.pathFaith = Math.max(0, s.pathFaith - 3);
      s.happiness = Math.max(0, s.happiness - 2);
    },
  },
  {
    id: 'ai_prompt_dojo_branch_C',
    triggerCardId: 'ai_prompt_dojo',
    delayYears: 2,
    condition: (s) => s.happiness < 50 && (s.aiSkillLevel ?? 0) >= 20,
    emotion: 'warm',
    getText: (s) => `第${s.currentAge}岁，部门新来的实习生问你"怎么让AI写代码不胡说八道"。你在D盘那个叫"乱七八糟"的文件夹里翻了半天，找到了当年那个"杂记.docx"。犹豫了一下，还是发了过去。两周后她发消息说"师姐/师兄你的文档救了我的命"，后面跟着一长串感叹号。你忽然意识到：你当年一个人在出租屋啃着披萨换来的东西，正在变成别人的捷径。`,
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 10);
      s.pathFaith = Math.min(100, s.pathFaith + 5);
      s.passiveIncome += 2000;
    },
  },

  // --- ai_automate_self 用AI自动化自己80%的工作 ---
  {
    id: 'ai_automate_self_branch_A',
    triggerCardId: 'ai_automate_self',
    delayYears: 1,
    condition: (s) => s.stress > 65, // 20%被发现的概率会导致stress+12
    emotion: 'spicy',
    getText: (s) => `第${s.currentAge}岁，你的秘密终于被发现了。不是因为bug，是主管发现你"效率太高了"——他翻了你的提交记录，发现那些完美的代码不可能是人写的。你坐在会议室里等着被骂，结果主管说"把这套方法推广给全部门"。你升职了，加了薪。但你的脚本让两个老同事被"优化"掉了。他们走的那天没跟你说再见。你第一次怀疑：效率到底是解放，还是淘汰？`,
    applyEffect: (s) => {
      s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.3);
      s.stress = Math.min(100, s.stress + 15);
      s.pathFaith = Math.max(0, s.pathFaith - 8);
      s.happiness = Math.max(0, s.happiness - 10);
    },
  },
  {
    id: 'ai_automate_self_branch_B',
    triggerCardId: 'ai_automate_self',
    delayYears: 2,
    condition: (s) => s.passiveIncome > 30000,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，你每天下午三点到晚上十点做的那些"私事"，终于长出了翅膀。你用省下来的时间打磨的那个AI小工具，这个月的收入第一次超过了你的工资。到账短信来的时候你正在开周会，主管在上面讲Q3目标，你在下面盯着手机银行的数字，嘴角怎么也压不下去。你没辞职——还不到时候。但你知道，那张安全网，已经织好了。`,
    applyEffect: (s) => {
      s.pathFaith = Math.min(100, s.pathFaith + 12);
      s.happiness = Math.min(100, s.happiness + 15);
      s.stress = Math.max(0, s.stress - 8);
    },
  },
  {
    id: 'ai_automate_self_branch_C',
    triggerCardId: 'ai_automate_self',
    delayYears: 2,
    condition: (s) => s.stress <= 65 && s.passiveIncome <= 30000,
    emotion: 'salty',
    getText: (s) => `第${s.currentAge}岁，你的自动化脚本在一个周五晚上出了bug——它给全公司的客户发了一封测试邮件，标题是"亲爱的{客户姓名}"。周一你被叫到办公室，主管的脸色像吃了苍蝇。你花了整整一周道歉、修复、写检讨。那套脚本你没删，但加了三重检查和一个红色的"危险"按钮。你学到了一课：能省时间的东西，也能省掉你的工作。`,
    applyEffect: (s) => {
      s.stress = Math.min(100, s.stress + 10);
      s.happiness = Math.max(0, s.happiness - 5);
      s.currentSavings = Math.max(0, s.currentSavings - 5000);
    },
  },

  // --- ai_open_source_tool 开源一个AI开发工具 ---
  {
    id: 'ai_open_source_tool_branch_A',
    triggerCardId: 'ai_open_source_tool',
    delayYears: 3,
    condition: (s) => (s.aiSkillLevel ?? 0) >= 55,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，你收到了一封邮件，标题是"来自XX大厂的邀请函"。三年前你开源的那个小工具，现在已经是圈内有名的项目了。他们说"我们团队一直在用你的开源项目，想请你过来带队"。薪资是你现在的三倍。你盯着那封邮件看了很久，想起第一年只有12个star、其中10个是自己点的那些夜晚。你翻了翻最早的star列表，那只猫头像的账号还在——后来成了你最重要的核心贡献者。原来最好的简历，真的不是履历表。`,
    applyEffect: (s) => {
      s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 2.0);
      s.pathFaith = Math.min(100, s.pathFaith + 15);
      s.happiness = Math.min(100, s.happiness + 20);
      s.stress = Math.max(0, s.stress - 5);
      s.passiveIncome += 10000;
    },
  },
  {
    id: 'ai_open_source_tool_branch_B',
    triggerCardId: 'ai_open_source_tool',
    delayYears: 2,
    condition: (s) => (s.aiSkillLevel ?? 0) >= 40 && (s.aiSkillLevel ?? 0) < 55,
    emotion: 'warm',
    getText: (s) => `第${s.currentAge}岁，你收到了一封用蹩脚英文写的邮件，来自尼日利亚的一个开发者。他说他用你的工具找到了第一份远程工作，"因为你的开源项目，我现在能养活我的家人了"。邮件末尾附着一张照片——他和两个孩子站在一栋简陋的房子前面，笑得露出白牙。你忽然觉得鼻子有点酸。你造的东西在你睡觉的时候，正在改变千里之外一个人的人生。这比任何star都值钱。`,
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 18);
      s.pathFaith = Math.min(100, s.pathFaith + 10);
      s.stress = Math.max(0, s.stress - 8);
    },
  },
  {
    id: 'ai_open_source_tool_branch_C',
    triggerCardId: 'ai_open_source_tool',
    delayYears: 2,
    condition: (s) => (s.aiSkillLevel ?? 0) < 40,
    emotion: 'spicy',
    getText: (s) => `第${s.currentAge}岁，你发现一家市值百亿的公司把你的开源工具集成进了他们的商业产品——代码连注释都没改，版权信息被抹掉了。你气得手抖，把开源社区提交记录截图发了出去。三天后舆论炸了。那家公司发了道歉声明，给你的项目打了一笔钱，还发来了offer。你看着道歉信和offer并排躺在邮箱里，觉得荒诞又真实。在AI时代，代码会说话，但有时候得你帮它喊。`,
    applyEffect: (s) => {
      s.currentSavings += 80000;
      s.stress = Math.min(100, s.stress + 10);
      s.pathFaith = Math.min(100, s.pathFaith + 8);
      s.happiness = Math.max(0, s.happiness - 3);
    },
  },

  // --- ai_health_warning 颈椎罢工：身体的抗议 ---
  {
    id: 'ai_health_warning_branch_A',
    triggerCardId: 'ai_health_warning',
    delayYears: 2,
    condition: (s) => s.health < 40,
    emotion: 'crying',
    getText: (s) => `第${s.currentAge}岁，医生的预言成真了。你在一个重要的产品发布现场突然天旋地转，脖子像被钢筋锁住，眼前一黑就栽了下去。救护车来的时候你还在想"演示还没完"。在医院躺了一周，轻度脑梗前兆。你妈在病床边红着眼眶说"你要是瘫了谁管你"。你盯着天花板终于承认：身体不是成本，是本金。你想起那天从诊室出来，在便利店买了一杯冰美式，觉得"没事，还年轻"。`,
    applyEffect: (s) => {
      s.health = Math.max(0, s.health - 15);
      s.stress = Math.max(0, s.stress - 20);
      s.happiness = Math.max(0, s.happiness - 15);
      s.pathFaith = Math.max(0, s.pathFaith - 10);
    },
  },
  {
    id: 'ai_health_warning_branch_B',
    triggerCardId: 'ai_health_warning',
    delayYears: 1,
    condition: (s) => s.health >= 40 && s.health < 65,
    emotion: 'warm',
    getText: (s) => `第${s.currentAge}岁，你被迫养成了每小时站起来走十分钟的习惯。一开始觉得麻烦，后来慢慢发现——这十分钟成了你一天中最好的思考时间。很多解不开的技术难题，都是在阳台做颈椎操的时候想通的。你甚至开始去公园散步，发现傍晚的风比空调房里的空气甜。医生是对的：身体不是机器，你对它好，它才会对你好。`,
    applyEffect: (s) => {
      s.health = Math.min(100, s.health + 8);
      s.happiness = Math.min(100, s.happiness + 8);
      s.stress = Math.max(0, s.stress - 10);
      s.aiSkillLevel = Math.min(100, (s.aiSkillLevel ?? 0) + 3);
    },
  },
  {
    id: 'ai_health_warning_branch_C',
    triggerCardId: 'ai_health_warning',
    delayYears: 1,
    condition: (s) => s.health >= 65,
    emotion: 'funny',
    getText: (s) => `第${s.currentAge}岁，你在理疗室遇到了一个同样颈椎不好的姑娘/小伙子。你们一边做牵引一边吐槽产品经理和 deadline，从"你是做什么的"聊到"你觉得AGI还要几年"。三个月后你们开始一起健身、一起吃饭、一起骂AI生成的bug。你没想到——颈椎罢工换来的不是病假，是一个同病相怜的朋友，或者说，更多。医生说"颈椎不好的人脾气都倔"，你们俩都笑了。`,
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 12);
      s.stress = Math.max(0, s.stress - 8);
      s.health = Math.min(100, s.health + 5);
    },
  },

  // --- ai_partner_talk 伴侣的质问 ---
  {
    id: 'ai_partner_talk_branch_A',
    triggerCardId: 'ai_partner_talk',
    delayYears: 3,
    condition: (s) => s.partner !== null && s.partner.affection >= 60, // 选了伴侣
    emotion: 'crying',
    getText: (s) => `第${s.currentAge}岁，你创业/All in最困难的那几个月，存款快见底了。一天晚上TA坐在你对面，把一张银行卡推到你面前："这里面是我攒的嫁妆/私房钱，先用着。"你想说什么，TA打断你："当年你为我合上电脑的那个晚上，我就知道你值得。"你握着那张卡，觉得自己是世界上最幸运的混蛋。有些人不是不理解你的梦想，只是在等你也理解他们。`,
    applyEffect: (s) => {
      if (s.partner) {
        s.partner.affection = Math.min(100, s.partner.affection + 20);
        s.partner.trust = Math.min(100, s.partner.trust + 15);
      }
      s.currentSavings += 50000;
      s.happiness = Math.min(100, s.happiness + 20);
      s.pathFaith = Math.min(100, s.pathFaith + 12);
      s.stress = Math.max(0, s.stress - 15);
    },
  },
  {
    id: 'ai_partner_talk_branch_B',
    triggerCardId: 'ai_partner_talk',
    delayYears: 2,
    condition: (s) => s.partner !== null && s.partner.affection <= 40, // 选了AI
    emotion: 'cold',
    getText: (s) => `第${s.currentAge}岁，你们分手了。TA收拾东西的时候说"我不是在和AI谈恋爱"，门关上的声音很轻，但像一记重锤。阳台上那个烟灰缸还在原来的位置，里面的烟头早就灭了。你一个人坐在空荡荡的房间里，AI助手弹出一条消息："检测到您的情绪低落，需要播放音乐吗？"你盯着屏幕笑了——笑出眼泪。连安慰你的都是AI。你没后悔选了这条路，只是有些空。有些东西赢了世界也补不回来。`,
    applyEffect: (s) => {
      if (s.partner) {
        s.partner.datingStage = 'divorced';
        s.partner.affection = 0;
        s.partner.trust = 0;
      }
      s.happiness = Math.max(0, s.happiness - 20);
      s.stress = Math.min(100, s.stress + 15);
      s.pathFaith = Math.max(0, s.pathFaith - 8);
      s.aiSkillLevel = Math.min(100, (s.aiSkillLevel ?? 0) + 8);
    },
  },
  {
    id: 'ai_partner_talk_branch_C',
    triggerCardId: 'ai_partner_talk',
    delayYears: 3,
    condition: (s) => s.partner !== null && s.partner.affection > 40 && s.partner.affection < 60, // 中间状态（勉强平衡）
    emotion: 'warm',
    getText: (s) => `第${s.currentAge}岁，你的AI小有所成。TA偷偷用你做的AI工具帮自己做PPT，效率翻倍，被领导表扬了。回家后TA装作不经意地说"你那个AI……还挺好用的"，耳朵红了。你忍住笑说"那当然，也不看是谁做的"。那天晚上你们第一次聊起AI的未来——不是争论，是真正的对话。有些人的理解不是一次谈话能达成的，需要时间，和一个让他们亲身体验的机会。`,
    applyEffect: (s) => {
      if (s.partner) {
        s.partner.affection = Math.min(100, s.partner.affection + 15);
        s.partner.trust = Math.min(100, s.partner.trust + 10);
      }
      s.happiness = Math.min(100, s.happiness + 15);
      s.pathFaith = Math.min(100, s.pathFaith + 8);
      s.stress = Math.max(0, s.stress - 5);
    },
  },

  // --- ai_all_in_product 辞职All in做AI产品 ---
  {
    id: 'ai_all_in_product_branch_A',
    triggerCardId: 'ai_all_in_product',
    delayYears: 1,
    condition: (s) => s.isUnemployed && !s.isAllInPath, // 失败了，一年后还在挣扎
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，存款以肉眼可见的速度往下掉。你每天打开后台看MRR曲线，像看心电图——涨了几块钱就狂喜，一天没新用户就失眠。你妈打电话来问"最近怎么样"，你说"还行"。你已经说了十个月"还行"了。冰箱里只剩鸡蛋和挂面，但你不敢告诉任何人。你开始怀疑自己是不是太自大了——但你还没打算认输。`,
    applyEffect: (s) => {
      s.stress = Math.min(100, s.stress + 15);
      s.happiness = Math.max(0, s.happiness - 8);
      s.pathFaith = Math.max(0, s.pathFaith - 5);
    },
  },
  {
    id: 'ai_all_in_product_branch_B',
    triggerCardId: 'ai_all_in_product',
    delayYears: 2,
    condition: (s) => s.isAllInPath === true, // 成功All In了，两年后大成
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，你的产品被一个科技自媒体报道了。你刷动态圈，看到前公司的同事在转发那篇文章，说"这个AI工具太牛了，谁做的？"他们不知道创始人就是当年坐在工位角落那个沉默寡言、整天"不务正业"搞AI的你。你没去评论，只是下楼去便利店，鬼使神差又买了一包烟。这次你点了根，真的抽了。烟雾散开的时候，那些质疑你的声音，现在变成了用户付费时"叮"的到账声。这是世界上最好听的声音。`,
    applyEffect: (s) => {
      s.passiveIncome += 20000;
      s.pathFaith = Math.min(100, s.pathFaith + 20);
      s.happiness = Math.min(100, s.happiness + 25);
      s.stress = Math.max(0, s.stress - 10);
      s.currentSavings += 100000;
    },
  },

  // =========================================================================
  // 链上原住民路径专属盲盒（6组 triggerCardId，18条分支）
  // =========================================================================

  // --- chain_first_bet 第一次重仓下注 ---
  {
    id: 'chain_first_bet_branch_A',
    triggerCardId: 'chain_first_bet',
    delayYears: 2,
    condition: (s) => (s.economicCycle || 0) === 2,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，你重仓的那个币跌了70%。你翻出两年前写的定投笔记，上面写着"长期看好，不看短期"。你盯着这句话看了很久，然后把笔记本合上了。群里有人割肉了，有人在喊"信仰呢"，你什么都没说。你终于理解了那句话：在这个市场里，活下来比什么都重要。`,
    applyEffect: (s) => {
      const holdings = (s as any).chainHoldings || 0;
      (s as any).chainHoldings = Math.max(0, Math.round(holdings * 0.3));
      s.stress = Math.min(100, s.stress + 15);
      s.happiness = Math.max(0, s.happiness - 10);
    },
  },
  {
    id: 'chain_first_bet_branch_B',
    triggerCardId: 'chain_first_bet',
    delayYears: 2,
    condition: (s) => (s.economicCycle || 0) !== 2,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，你两年前重仓的那个项目发了空投，代币翻了五倍。你看着账户里的数字，手有点抖。你想起第一次买入时那个深夜，窗外的路灯和你犹豫的手指。你没卖——你告诉自己这只是开始。但你下楼买了一碗最贵的泡面，加了两根肠。`,
    applyEffect: (s) => {
      const holdings = (s as any).chainHoldings || 0;
      (s as any).chainHoldings = applyChainHoldingScale(holdings, 3);
      s.happiness = Math.min(100, s.happiness + 15);
      s.pathFaith = Math.min(100, s.pathFaith + 10);
    },
  },

  // --- chain_hodl_crisis 暴跌中坚持HODL ---
  {
    id: 'chain_hodl_crisis_branch_A',
    triggerCardId: 'chain_hodl_crisis',
    delayYears: 2,
    condition: (s) => s.pathFaith >= 60,
    emotion: 'warm',
    getText: (s) => `第${s.currentAge}岁，市场回来了。你两年前在暴跌中没有卖出的那些币，现在不仅回本了，还涨了30%。你翻出当时在群里发的那句"HODL"，有人截图回了你："还在？"你回了一个字："在。"这个字比任何技术分析都有力量。`,
    applyEffect: (s) => {
      const holdings = (s as any).chainHoldings || 0;
      (s as any).chainHoldings = applyChainHoldingScale(holdings, 1.5);
      s.pathFaith = Math.min(100, s.pathFaith + 12);
      s.happiness = Math.min(100, s.happiness + 10);
      s.stress = Math.max(0, s.stress - 10);
    },
  },
  {
    id: 'chain_hodl_crisis_branch_B',
    triggerCardId: 'chain_hodl_crisis',
    delayYears: 2,
    condition: (s) => s.pathFaith < 60,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，市场还在底部。你坚持了两年，终于还是在又一次暴跌后卖了一半。卖完第二天它涨了15%，你盯着屏幕想笑，笑不出来。你不是输给了市场，你是输给了自己的恐惧。`,
    applyEffect: (s) => {
      const holdings = (s as any).chainHoldings || 0;
      (s as any).chainHoldings = Math.round(holdings * 0.4);
      s.pathFaith = Math.max(0, s.pathFaith - 10);
      s.stress = Math.min(100, s.stress + 12);
    },
  },

  // --- chain_build_defi 开发DeFi协议 ---
  {
    id: 'chain_build_defi_branch_A',
    triggerCardId: 'chain_build_defi',
    delayYears: 2,
    condition: (s) => (s.pathSkills?.defiSkill || 0) >= 40,
    emotion: 'spicy',
    getText: (s) => `第${s.currentAge}岁，你写的那个DeFi协议被一个白帽黑客发现了一个小漏洞，他通过漏洞报告渠道联系了你，没有偷钱，还给你写了详细的修复方案。你给他发了一笔赏金，他回了一句"代码即法律，但法律需要好的律师"。你的协议TVL突破了一亿。`,
    applyEffect: (s) => {
      s.pathSkills = s.pathSkills || {};
      s.pathSkills.defiSkill = (s.pathSkills.defiSkill || 0) + 8;
      s.pathFaith = Math.min(100, s.pathFaith + 10);
      s.currentSavings += 50000;
    },
  },
  {
    id: 'chain_build_defi_branch_B',
    triggerCardId: 'chain_build_defi',
    delayYears: 3,
    condition: (s) => (s.pathSkills?.defiSkill || 0) < 40,
    emotion: 'crying',
    getText: (s) => `第${s.currentAge}岁，你部署的智能合约被黑了。不是大资金——总共损失了大概80万，但那是你和几个朋友凑的全部流动性。你在Discord里发了长篇道歉，有人骂你，有人说"代码就是这样"。你关了服务器，坐在电脑前坐了一整夜。天亮的时候你开始重写代码。`,
    applyEffect: (s) => {
      s.currentSavings = Math.max(0, s.currentSavings - 80000);
      s.stress = Math.min(100, s.stress + 20);
      s.happiness = Math.max(0, s.happiness - 15);
      s.pathSkills = s.pathSkills || {};
      s.pathSkills.defiSkill = (s.pathSkills.defiSkill || 0) + 12;
    },
  },

  // --- chain_all_in All In辞职做链上 ---
  {
    id: 'chain_all_in_branch_A',
    triggerCardId: 'chain_all_in',
    delayYears: 1,
    condition: (s) => s.stress > 70 || s.currentSavings < 30000,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，辞职一年了。你的链上收入不稳定——上个月赚了三万，这个月只有三千。你开始焦虑地刷行情，半夜醒来第一件事是看手机。你以前上班的时候至少每个月有固定的工资到账，现在你才明白：自由职业最贵的不是时间，是安全感。`,
    applyEffect: (s) => {
      s.stress = Math.min(100, s.stress + 15);
      s.happiness = Math.max(0, s.happiness - 8);
      s.pathFaith = Math.max(0, s.pathFaith - 5);
    },
  },
  {
    id: 'chain_all_in_branch_B',
    triggerCardId: 'chain_all_in',
    delayYears: 2,
    condition: (s) => s.isAllInPath && s.pathFaith >= 60,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，你参与的那个DAO给你发了一笔治理代币奖励。你打开钱包数零——一百万。不是人民币，是U。你坐在椅子上很久没动。两年前你辞职的时候有人说你疯了，现在你看着那个数字，想起那天走出公司大门时的阳光。你没卖，你知道这只是开始。`,
    applyEffect: (s) => {
      (s as any).chainHoldings = ((s as any).chainHoldings || 0) + 1000000;
      s.passiveIncome += 15000;
      s.pathFaith = Math.min(100, s.pathFaith + 20);
      s.happiness = Math.min(100, s.happiness + 20);
    },
  },

  // --- chain_friend_call 朋友喊单 ---
  {
    id: 'chain_friend_call_branch_A',
    triggerCardId: 'chain_friend_call',
    delayYears: 2,
    condition: (s) => s.stress > 50,
    emotion: 'crying',
    getText: (s) => `第${s.currentAge}岁，两年前那个"确定涨"的币归零了。项目方跑路，Telegram群解散，你那个朋友也失联了。你损失了五万块——不多，但够你看清一件事：在这个市场里，友谊和K线一样不可靠。你把他的社交软件删了，然后给自己定了一条规矩：永远不为别人的信仰买单。`,
    applyEffect: (s) => {
      s.currentSavings = Math.max(0, s.currentSavings - 50000);
      s.stress = Math.min(100, s.stress + 15);
      s.pathSkills = s.pathSkills || {};
      s.pathSkills.tradingSkill = (s.pathSkills.tradingSkill || 0) + 5;
    },
  },
  {
    id: 'chain_friend_call_branch_B',
    triggerCardId: 'chain_friend_call',
    delayYears: 3,
    condition: (s) => s.stress <= 50,
    emotion: 'salty',
    getText: (s) => `第${s.currentAge}岁，你两年前没跟的那个币翻了十倍。你那个朋友在群里晒收益截图，配文"信我者得永生"。你看着截图，心里不是滋味——但你也没后悔。你见过太多翻十倍之后归零的，这个市场不缺机会，缺的是不被机会杀死的耐心。`,
    applyEffect: (s) => {
      s.pathSkills = s.pathSkills || {};
      s.pathSkills.tradingSkill = (s.pathSkills.tradingSkill || 0) + 8;
      s.pathFaith = Math.min(100, s.pathFaith + 5);
    },
  },

  // --- chain_regulation 监管来了 ---
  {
    id: 'chain_regulation_branch_A',
    triggerCardId: 'chain_regulation',
    delayYears: 2,
    condition: (s) => (s.pathSkills?.communityInfluence || 0) >= 30,
    emotion: 'warm',
    getText: (s) => `第${s.currentAge}岁，监管落地了。你两年前选择拥抱合规的决定被证明是对的——你的协议成了第一批获得牌照的DeFi项目，机构资金开始涌入。那些嘲笑你"背叛去中心化"的人现在来问你怎么申请牌照。你想起一句话：真正的自由不是无法无天，是在规则里跳舞。`,
    applyEffect: (s) => {
      s.pathFaith = Math.min(100, s.pathFaith + 15);
      s.currentSavings += 200000;
      s.passiveIncome += 20000;
    },
  },
  {
    id: 'chain_regulation_branch_B',
    triggerCardId: 'chain_regulation',
    delayYears: 2,
    condition: (s) => (s.pathSkills?.communityInfluence || 0) < 30,
    emotion: 'cold',
    getText: (s) => `第${s.currentAge}岁，监管收紧，你常用的那个交易所被墙了。你花了三天时间把资产转到去中心化钱包，过程中差点丢了一笔。你坐在屏幕前想：中本聪发明比特币是为了摆脱监管，但摆脱监管的代价是你必须自己对每一分钱负责。这是自由的代价，你愿意付。`,
    applyEffect: (s) => {
      s.stress = Math.min(100, s.stress + 12);
      s.pathSkills = s.pathSkills || {};
      s.pathSkills.defiSkill = (s.pathSkills.defiSkill || 0) + 6;
    },
  },

  // =========================================================================
  // 数字游牧民路径专属盲盒（6组 triggerCardId，17条分支）
  // =========================================================================

  // --- nomad_first_trip 第一次远程旅行 ---
  {
    id: 'nomad_first_trip_branch_A',
    triggerCardId: 'nomad_first_trip',
    delayYears: 2,
    condition: (s) => s.happiness >= 60,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，你在清迈遇到的那个德国设计师给你介绍了一个柏林的客户。报价是你国内时薪的三倍。你在夜市喝着Chang啤酒回邮件，旁边有人在弹吉他。你突然意识到：你两年前买的那张单程票，带你到的不只是一个城市，而是一整个世界。`,
    applyEffect: (s) => {
      s.passiveIncome += 8000;
      s.pathSkills = s.pathSkills || {};
      s.pathSkills.crossCulturalSkill = (s.pathSkills.crossCulturalSkill || 0) + 10;
      s.happiness = Math.min(100, s.happiness + 12);
      s.pathFaith = Math.min(100, s.pathFaith + 10);
    },
  },
  {
    id: 'nomad_first_trip_branch_B',
    triggerCardId: 'nomad_first_trip',
    delayYears: 1,
    condition: (s) => s.stress > 60,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，你在巴厘岛食物中毒了。一个人在民宿上吐下泻，没有家人在身边，民宿老板帮你叫了摩托车送医院。你躺在异国的病床上打点滴，看着天花板想：自由的代价之一是你生病的时候没有人给你倒一杯热水。`,
    applyEffect: (s) => {
      s.health = Math.max(0, s.health - 10);
      s.currentSavings = Math.max(0, s.currentSavings - 8000);
      s.stress = Math.min(100, s.stress + 10);
    },
  },

  // --- nomad_client_referral 客户转介绍 ---
  {
    id: 'nomad_client_referral_branch_A',
    triggerCardId: 'nomad_client_referral',
    delayYears: 2,
    condition: (s) => (s.pathSkills?.remoteSkill || 0) >= 35,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，两年前那个满意的客户给你推荐了三个新客户。你的档期排到了半年后，你不得不涨价30%。你在里斯本的共享空间里处理邮件，旁边一个美国开发者问你是做什么的，你说"我做的事就是在任何地方都能做的事"。他笑了，说他也是。`,
    applyEffect: (s) => {
      s.passiveIncome += 12000;
      s.pathSkills = s.pathSkills || {};
      s.pathSkills.remoteSkill = (s.pathSkills.remoteSkill || 0) + 8;
      s.pathFaith = Math.min(100, s.pathFaith + 10);
    },
  },
  {
    id: 'nomad_client_referral_branch_B',
    triggerCardId: 'nomad_client_referral',
    delayYears: 1,
    condition: (s) => (s.pathSkills?.remoteSkill || 0) < 35,
    emotion: 'spicy',
    getText: (s) => `第${s.currentAge}岁，你转介绍来的客户跑了单。不是因为你做得不好——是他们公司倒闭了。你损失了两万块的尾款，也学到了一个教训：远程合作，定金永远要收50%以上。你在咖啡馆更新了你的合同模板，窗外是陌生城市的街景。`,
    applyEffect: (s) => {
      s.currentSavings = Math.max(0, s.currentSavings - 20000);
      s.stress = Math.min(100, s.stress + 8);
      s.pathSkills = s.pathSkills || {};
      s.pathSkills.remoteSkill = (s.pathSkills.remoteSkill || 0) + 6;
    },
  },

  // --- nomad_all_in 买单程票All In ---
  {
    id: 'nomad_all_in_branch_A',
    triggerCardId: 'nomad_all_in',
    delayYears: 1,
    condition: (s) => s.stress > 60 || s.currentSavings < 30000,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，到大理半年了。远程收入不稳定——有一个大客户拖了三个月的款，你开始动用存款。青寺的月租便宜，但每天吃米线也会腻。你站在洱海边发呆，不是不自由，是自由里混着一种你以前没尝过的味道：不确定。`,
    applyEffect: (s) => {
      s.stress = Math.min(100, s.stress + 12);
      s.happiness = Math.max(0, s.happiness - 5);
      s.pathFaith = Math.max(0, s.pathFaith - 5);
    },
  },
  {
    id: 'nomad_all_in_branch_B',
    triggerCardId: 'nomad_all_in',
    delayYears: 2,
    condition: (s) => s.isAllInPath && s.pathFaith >= 55,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，你在大理的生活步入正轨。三个长期客户，月租一千二，每天早上在洱海边跑步，下午在共享空间工作。你妈视频的时候说"你看起来比以前开心"，你说是的。你终于理解了数字游民的真正含义——不是旅行，是选择在哪里生活。`,
    applyEffect: (s) => {
      s.passiveIncome += 10000;
      s.happiness = Math.min(100, s.happiness + 18);
      s.stress = Math.max(0, s.stress - 15);
      s.pathFaith = Math.min(100, s.pathFaith + 15);
    },
  },

  // --- nomad_health_issue 身体抗议 ---
  {
    id: 'nomad_health_issue_branch_A',
    triggerCardId: 'nomad_health_issue',
    delayYears: 2,
    condition: (s) => s.health < 50,
    emotion: 'crying',
    getText: (s) => `第${s.currentAge}岁，你的腰椎间盘突出急性发作了。在一个语言不通的城市里找理疗师，你用翻译软件比划了半天才说清楚哪里疼。你趴在治疗床上想：你可以远程工作，但你不能远程生病。身体有它自己的国籍，它不承认你的数字游民签证。`,
    applyEffect: (s) => {
      s.health = Math.max(0, s.health - 15);
      s.stress = Math.min(100, s.stress + 15);
      s.currentSavings = Math.max(0, s.currentSavings - 5000);
    },
  },
  {
    id: 'nomad_health_issue_branch_B',
    triggerCardId: 'nomad_health_issue',
    delayYears: 2,
    condition: (s) => s.health >= 50,
    emotion: 'warm',
    getText: (s) => `第${s.currentAge}岁，你开始每天早上练瑜伽了。不是因为你突然爱上了运动，是因为去年在墨西哥城犯的那次背痛让你意识到：如果你想在路上走得久，身体就是你唯一的行李。你现在能做头倒立了。`,
    applyEffect: (s) => {
      s.health = Math.min(100, s.health + 10);
      s.stress = Math.max(0, s.stress - 8);
      s.happiness = Math.min(100, s.happiness + 5);
    },
  },

  // --- nomad_community 建立游民社区 ---
  {
    id: 'nomad_community_branch_A',
    triggerCardId: 'nomad_community',
    delayYears: 3,
    condition: (s) => (s.pathSkills?.crossCulturalSkill || 0) >= 40,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，你三年前建的那个游民互助群现在有两千人了。有人在群里找到了伴侣，有人在群里找到了联合创始人，有人在群里找到了在异国机场接他的人。你在群里不怎么说话，但每次看到这些消息你都觉得：你建的不是群，是路上的家。`,
    applyEffect: (s) => {
      s.pathSkills = s.pathSkills || {};
      s.pathSkills.crossCulturalSkill = (s.pathSkills.crossCulturalSkill || 0) + 12;
      s.passiveIncome += 5000;
      s.happiness = Math.min(100, s.happiness + 15);
    },
  },
  {
    id: 'nomad_community_branch_B',
    triggerCardId: 'nomad_community',
    delayYears: 2,
    condition: (s) => (s.pathSkills?.crossCulturalSkill || 0) < 40,
    emotion: 'salty',
    getText: (s) => `第${s.currentAge}岁，你组织的第一次游民聚会来了三个人：你、一个巴西人、一个中途放鸽子的。你和巴西人喝了一晚上啤酒，用蹩脚的英语聊了彼此的故事。第二天他走了，你们再也没联系。但那天晚上你不觉得失败——至少你试了。`,
    applyEffect: (s) => {
      s.pathSkills = s.pathSkills || {};
      s.pathSkills.crossCulturalSkill = (s.pathSkills.crossCulturalSkill || 0) + 5;
      s.stress = Math.min(100, s.stress + 5);
    },
  },

  // --- nomad_culture_shock 跨文化冲突 ---
  {
    id: 'nomad_culture_shock_branch_A',
    triggerCardId: 'nomad_culture_shock',
    delayYears: 1,
    condition: (s) => (s.pathSkills?.languageSkill || 0) >= 25,
    emotion: 'warm',
    getText: (s) => `第${s.currentAge}岁，你在日本小镇住了半年，终于能听懂邻居老奶奶的方言了。她给你送了一盒自己做的和菓子，你用日语说了谢谢，她笑得眼睛眯成了一条线。你突然明白：融入一个文化不是靠打卡景点，是靠听得懂一个老人的闲话。`,
    applyEffect: (s) => {
      s.pathSkills = s.pathSkills || {};
      s.pathSkills.languageSkill = (s.pathSkills.languageSkill || 0) + 8;
      s.pathSkills.crossCulturalSkill = (s.pathSkills.crossCulturalSkill || 0) + 6;
      s.happiness = Math.min(100, s.happiness + 10);
    },
  },
  {
    id: 'nomad_culture_shock_branch_B',
    triggerCardId: 'nomad_culture_shock',
    delayYears: 2,
    condition: (s) => (s.pathSkills?.languageSkill || 0) < 25,
    emotion: 'cold',
    getText: (s) => `第${s.currentAge}岁，你在越南住了一年还是不会点菜。每次去餐厅都用手指着别人的桌子，服务员笑着点头但经常上错。你开始只去有英文菜单的游客餐厅，价格贵一倍但至少不会出错。你告诉自己"慢慢来"，但孤独感在听不懂的语言里越来越浓。`,
    applyEffect: (s) => {
      s.stress = Math.min(100, s.stress + 8);
      s.happiness = Math.max(0, s.happiness - 5);
      s.pathSkills = s.pathSkills || {};
      s.pathSkills.languageSkill = (s.pathSkills.languageSkill || 0) + 3;
    },
  },

  // =========================================================================
  // 超级IP路径专属盲盒（6组 triggerCardId，16条分支）
  // =========================================================================

  // --- ip_first_viral 第一条爆款 ---
  {
    id: 'ip_first_viral_branch_A',
    triggerCardId: 'ip_first_viral',
    delayYears: 2,
    condition: (s) => s.stress > 55,
    emotion: 'spicy',
    getText: (s) => `第${s.currentAge}岁，你两年前那条爆款被人翻出来断章取义了。截图在社交平台上转了十万次，评论区全是骂你的——他们不知道前因后果，也不想知道。你发了长文解释，但没有人看长文。你第一次体会到：流量是甜的，但也是烫的。`,
    applyEffect: (s) => {
      (s as any).ipReputation = Math.max(0, ((s as any).ipReputation || 50) - 20);
      s.stress = Math.min(100, s.stress + 18);
      s.happiness = Math.max(0, s.happiness - 12);
    },
  },
  {
    id: 'ip_first_viral_branch_B',
    triggerCardId: 'ip_first_viral',
    delayYears: 2,
    condition: (s) => s.stress <= 55,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，你两年前那条爆款还在持续涨粉。有个出版社编辑通过那条内容找到你，问你要不要出书。你看着邮件想：你当初写那条内容只用了四十分钟，现在它可能变成一本书。内容的半衰期比你想象的长得多。`,
    applyEffect: (s) => {
      (s as any).ipFollowers = ((s as any).ipFollowers || 500) + 50000;
      s.currentSavings += 30000;
      s.pathFaith = Math.min(100, s.pathFaith + 10);
    },
  },

  // --- ip_brand_deal 接大广告 ---
  {
    id: 'ip_brand_deal_branch_A',
    triggerCardId: 'ip_brand_deal',
    delayYears: 2,
    condition: (s) => (s.pathSkills?.brandSkill || 0) < 30,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，你两年前接的那个广告翻车了。产品有问题，粉丝在评论区说"你变了""恰烂钱"。你掉了八千粉，掉粉的速度比涨粉快十倍。你终于理解了前辈说的那句话：接广告是用信任换钱，信任花完了就什么都没了。`,
    applyEffect: (s) => {
      (s as any).ipReputation = Math.max(0, ((s as any).ipReputation || 50) - 15);
      (s as any).ipFollowers = Math.max(0, ((s as any).ipFollowers || 500) - 8000);
      s.pathFaith = Math.max(0, s.pathFaith - 8);
    },
  },
  {
    id: 'ip_brand_deal_branch_B',
    triggerCardId: 'ip_brand_deal',
    delayYears: 2,
    condition: (s) => (s.pathSkills?.brandSkill || 0) >= 30,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，你两年前接的那个品牌合作成了案例。你花了三周研究产品、写脚本、拍了五版才满意，广告发出去后品牌方说销量涨了40%。他们主动提出续约，价格翻了一倍。你证明了一件事：恰饭不可耻，可耻的是不用心恰饭。`,
    applyEffect: (s) => {
      s.currentSavings += 80000;
      (s as any).ipReputation = Math.min(100, ((s as any).ipReputation || 50) + 10);
      s.pathSkills = s.pathSkills || {};
      s.pathSkills.brandSkill = (s.pathSkills.brandSkill || 0) + 8;
    },
  },

  // --- ip_all_in All In做全职创作者 ---
  {
    id: 'ip_all_in_branch_A',
    triggerCardId: 'ip_all_in',
    delayYears: 1,
    condition: (s) => s.stress > 65 || s.currentSavings < 30000,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，辞职一年了。这个月收入只有三千块——一个广告都没接到。你开始疯狂更新，一天发三条，质量下降了，数据更差了。你坐在出租屋里盯着后台，终于理解了什么叫"创作焦虑"：以前上班至少有人告诉你今天该做什么，现在你是自己的老板，也是自己的员工，还是自己的KPI。`,
    applyEffect: (s) => {
      s.stress = Math.min(100, s.stress + 18);
      s.happiness = Math.max(0, s.happiness - 10);
      s.pathFaith = Math.max(0, s.pathFaith - 8);
    },
  },
  {
    id: 'ip_all_in_branch_B',
    triggerCardId: 'ip_all_in',
    delayYears: 2,
    condition: (s) => s.isAllInPath && s.pathFaith >= 60,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，你的课程上线半年卖了一万份。你算了一下版税——七十万。你去便利店买了一瓶水，坐在路边喝，看着下班高峰的人流。两年前你是他们中的一员，现在你靠自己的名字活着。手机弹出一条评论："你的课改变了我的人生。"你觉得值了。`,
    applyEffect: (s) => {
      s.currentSavings += 700000;
      s.passiveIncome += 25000;
      s.happiness = Math.min(100, s.happiness + 20);
      s.pathFaith = Math.min(100, s.pathFaith + 18);
    },
  },

  // --- ip_controversy 舆论危机 ---
  {
    id: 'ip_controversy_branch_A',
    triggerCardId: 'ip_controversy',
    delayYears: 2,
    condition: (s) => (s.pathSkills?.audienceSkill || 0) >= 40,
    emotion: 'warm',
    getText: (s) => `第${s.currentAge}岁，两年前那次危机帮你筛选出了真正的粉丝。走了三万人，留下的十万人是铁杆。你的社群活跃度比以前更高了——不是因为你完美，是因为你在最狼狈的时候没有逃跑。你明白了：IP不是人设，是你在最低谷时还愿意站在你这边的人。`,
    applyEffect: (s) => {
      (s as any).ipFollowers = Math.max(0, ((s as any).ipFollowers || 500) - 30000);
      (s as any).ipReputation = Math.min(100, ((s as any).ipReputation || 50) + 15);
      s.pathFaith = Math.min(100, s.pathFaith + 12);
      s.happiness = Math.min(100, s.happiness + 8);
    },
  },
  {
    id: 'ip_controversy_branch_B',
    triggerCardId: 'ip_controversy',
    delayYears: 2,
    condition: (s) => (s.pathSkills?.audienceSkill || 0) < 40,
    emotion: 'crying',
    getText: (s) => `第${s.currentAge}岁，你还没从两年前那次网暴中恢复过来。你现在发内容之前会反复检查每一个字，怕又被人挑毛病。数据一直回不到从前，你偶尔会想：如果当初没红就好了。但你知道你回不去了——见过光的人，没法假装没见过。`,
    applyEffect: (s) => {
      s.stress = Math.min(100, s.stress + 12);
      s.happiness = Math.max(0, s.happiness - 10);
      (s as any).ipReputation = Math.max(0, ((s as any).ipReputation || 50) - 10);
    },
  },

  // --- ip_algorithm_change 平台算法变更 ---
  {
    id: 'ip_algorithm_change_branch_A',
    triggerCardId: 'ip_algorithm_change',
    delayYears: 2,
    condition: (s) => (s.pathSkills?.contentSkill || 0) >= 45,
    emotion: 'spicy',
    getText: (s) => `第${s.currentAge}岁，平台算法又变了，但你不再慌了。两年前你选择深耕内容质量而不是追算法风口，现在证明是对的——你的完播率、互动率远超同行，算法变了你照样有流量。你终于理解了：平台是河流，内容是河床。河流会改道，河床不动。`,
    applyEffect: (s) => {
      s.pathSkills = s.pathSkills || {};
      s.pathSkills.contentSkill = (s.pathSkills.contentSkill || 0) + 10;
      s.pathFaith = Math.min(100, s.pathFaith + 12);
      (s as any).ipFollowers = ((s as any).ipFollowers || 500) + 20000;
    },
  },
  {
    id: 'ip_algorithm_change_branch_B',
    triggerCardId: 'ip_algorithm_change',
    delayYears: 1,
    condition: (s) => (s.pathSkills?.contentSkill || 0) < 45,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，算法变了，你的流量断崖式下跌。以前随便发一条都有十万播放，现在精心做的内容只有五千。你开始研究新算法、跟风做短视频，但越追越累。你第一次觉得：你不是在做内容，你是在给算法打工。`,
    applyEffect: (s) => {
      s.stress = Math.min(100, s.stress + 15);
      s.pathFaith = Math.max(0, s.pathFaith - 8);
      (s as any).ipFollowers = Math.max(0, ((s as any).ipFollowers || 500) - 5000);
    },
  },

  // --- ip_mentor_betrayal 搭档/合作者背叛 ---
  {
    id: 'ip_mentor_betrayal_branch_A',
    triggerCardId: 'ip_mentor_betrayal',
    delayYears: 2,
    condition: (s) => s.happiness >= 50,
    emotion: 'warm',
    getText: (s) => `第${s.currentAge}岁，你从那次背叛中学到的比你预想的多。你学会了签合同、学会了保留证据、学会了在合作之前先谈好散伙的方式。你没有变成一个不信任别人的人，但你不再天真。有粉丝问你成功的秘诀是什么，你说"学会被背叛后还能站起来"。`,
    applyEffect: (s) => {
      s.pathSkills = s.pathSkills || {};
      s.pathSkills.brandSkill = (s.pathSkills.brandSkill || 0) + 8;
      s.pathSkills.audienceSkill = (s.pathSkills.audienceSkill || 0) + 5;
      s.pathFaith = Math.min(100, s.pathFaith + 8);
    },
  },
  {
    id: 'ip_mentor_betrayal_branch_B',
    triggerCardId: 'ip_mentor_betrayal',
    delayYears: 2,
    condition: (s) => s.happiness < 50,
    emotion: 'cold',
    getText: (s) => `第${s.currentAge}岁，你还是没有从那件事中走出来。你现在不跟任何人合作，所有事都自己做——自己写脚本、自己拍、自己剪、自己谈商务。效率低了，但你觉得安全。你偶尔会想：你防住了背叛，也防住了连接。`,
    applyEffect: (s) => {
      s.stress = Math.min(100, s.stress + 10);
      s.happiness = Math.max(0, s.happiness - 8);
    },
  },

  // =========================================================================
  // 银发守夜人路径专属盲盒（6组 triggerCardId，16条分支）
  // =========================================================================

  // --- silver_first_death 第一个照顾的老人去世 ---
  {
    id: 'silver_first_death_branch_A',
    triggerCardId: 'silver_first_death',
    delayYears: 2,
    condition: (s) => (s.pathSkills?.careSkill || 0) >= 30,
    emotion: 'warm',
    getText: (s) => `第${s.currentAge}岁，王奶奶的女儿给你送来了一面锦旗。她说妈妈走之前一直念叨你的名字，说"那个小伙子比亲儿子还贴心"。你接过锦旗的时候手在抖。你把它挂在办公室墙上，不是为了展示，是为了提醒自己：你做的事有人记得。`,
    applyEffect: (s) => {
      const biz = (s as any).silverBusiness || { clients: 0, reputation: 20, monthlyRevenue: 0 };
      biz.reputation = Math.min(100, biz.reputation + 20);
      biz.clients += 5;
      (s as any).silverBusiness = biz;
      s.pathFaith = Math.min(100, s.pathFaith + 15);
      s.happiness = Math.min(100, s.happiness + 5);
    },
  },
  {
    id: 'silver_first_death_branch_B',
    triggerCardId: 'silver_first_death',
    delayYears: 2,
    condition: (s) => (s.pathSkills?.careSkill || 0) < 30,
    emotion: 'crying',
    getText: (s) => `第${s.currentAge}岁，张奶奶的家属把你告了。他们说你照顾不周导致老人摔倒，要求赔偿二十万。你知道那是老人自己下床时摔的——但你没有监控，没有书面记录，没有证据。你在调解室里坐着，第一次觉得：光有心不够，还要有保护自己的能力。`,
    applyEffect: (s) => {
      s.currentSavings = Math.max(0, s.currentSavings - 50000);
      s.stress = Math.min(100, s.stress + 20);
      s.pathSkills = s.pathSkills || {};
      s.pathSkills.careSkill = (s.pathSkills.careSkill || 0) + 10;
    },
  },

  // --- silver_expand 扩张/开分店 ---
  {
    id: 'silver_expand_branch_A',
    triggerCardId: 'silver_expand',
    delayYears: 2,
    condition: (s) => (s.pathSkills?.managementSkill || 0) >= 35,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，第二家养老站盈利了。你招的那个站长比你还细心——她以前是三甲医院的护士长，退休后闲不住。你把标准化流程交给她，自己腾出手来准备第三家。你站在新店门口看老人们在院子里打太极，觉得这才叫"老有所养"。`,
    applyEffect: (s) => {
      const biz = (s as any).silverBusiness || { clients: 0, reputation: 20, monthlyRevenue: 0 };
      biz.clients += 20;
      biz.monthlyRevenue += 30000;
      (s as any).silverBusiness = biz;
      s.passiveIncome += 15000;
      s.pathFaith = Math.min(100, s.pathFaith + 12);
    },
  },
  {
    id: 'silver_expand_branch_B',
    triggerCardId: 'silver_expand',
    delayYears: 2,
    condition: (s) => (s.pathSkills?.managementSkill || 0) < 35,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，第二家站出问题了。新招的护理员没培训好，给老人喂饭时呛到了，家属来闹了一场。你赔了钱、道了歉、关了那家站。你终于明白：做养老，扩张的速度不能超过你培养人的速度。一个不合格的护理员能毁掉你十年攒的口碑。`,
    applyEffect: (s) => {
      const biz = (s as any).silverBusiness || { clients: 0, reputation: 20, monthlyRevenue: 0 };
      biz.reputation = Math.max(0, biz.reputation - 15);
      biz.clients = Math.max(0, biz.clients - 8);
      (s as any).silverBusiness = biz;
      s.stress = Math.min(100, s.stress + 15);
      s.currentSavings = Math.max(0, s.currentSavings - 30000);
    },
  },

  // --- silver_all_in All In回老家做养老 ---
  {
    id: 'silver_all_in_branch_A',
    triggerCardId: 'silver_all_in',
    delayYears: 1,
    condition: (s) => s.stress > 65 || s.currentSavings < 30000,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，回来一年了。民政局的补贴没批下来，你自己垫了三个月的房租。你妈每天给你做饭但嘴上说"白读了大学"。你夜里躺在老家的床上，听着窗外的虫鸣，想过放弃——但早上起来看到门口排队等开门的老人，你又穿上了工作服。`,
    applyEffect: (s) => {
      s.stress = Math.min(100, s.stress + 15);
      s.pathFaith = Math.max(0, s.pathFaith - 5);
    },
  },
  {
    id: 'silver_all_in_branch_B',
    triggerCardId: 'silver_all_in',
    delayYears: 2,
    condition: (s) => s.isAllInPath && s.pathFaith >= 60,
    emotion: 'crying',
    getText: (s) => `第${s.currentAge}岁，你的养老站上了本地新闻。市民政局的领导来考察，说你的模式"值得推广"。你爸那天特意穿了新衣服在门口等，领导走了之后他背过身去擦眼睛。你妈做了一桌子菜，席间她说"儿子，妈以前不懂你，现在懂了"。你端着碗，眼泪掉进了饭里。`,
    applyEffect: (s) => {
      const biz = (s as any).silverBusiness || { clients: 0, reputation: 20, monthlyRevenue: 0 };
      biz.reputation = Math.min(100, biz.reputation + 25);
      biz.clients += 15;
      biz.monthlyRevenue += 20000;
      (s as any).silverBusiness = biz;
      s.currentSavings += 100000;
      s.pathFaith = Math.min(100, s.pathFaith + 20);
      s.happiness = Math.min(100, s.happiness + 20);
    },
  },

  // --- silver_family_doubt 家人质疑 ---
  {
    id: 'silver_family_doubt_branch_A',
    triggerCardId: 'silver_family_doubt',
    delayYears: 2,
    condition: (s) => s.pathFaith >= 55,
    emotion: 'warm',
    getText: (s) => `第${s.currentAge}岁，你爸主动来养老站帮忙了。他不说什么"我支持你"之类的话，只是每天默默来修椅子、换灯泡、陪老人下棋。你妈开始给站里的老人送午饭。他们从不说出口，但你知道——他们用行动说了。`,
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 15);
      s.pathFaith = Math.min(100, s.pathFaith + 10);
      s.stress = Math.max(0, s.stress - 10);
    },
  },
  {
    id: 'silver_family_doubt_branch_B',
    triggerCardId: 'silver_family_doubt',
    delayYears: 3,
    condition: (s) => s.pathFaith < 55,
    emotion: 'cold',
    getText: (s) => `第${s.currentAge}岁，过年回家你爸还是不跟你说话。他跟亲戚说你"在外面伺候人"，语气里有你听不惯的东西。你没有争辩。你给他买了新的血压计，放在桌上就走了。有些理解你等不到，有些路你必须一个人走。`,
    applyEffect: (s) => {
      s.stress = Math.min(100, s.stress + 8);
      s.happiness = Math.max(0, s.happiness - 8);
    },
  },

  // --- silver_policy_win 争取政策支持 ---
  {
    id: 'silver_policy_win_branch_A',
    triggerCardId: 'silver_policy_win',
    delayYears: 3,
    condition: (s) => (s.pathSkills?.policySkill || 0) >= 30,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，你三年前提的社区养老补贴提案通过了。第一批补贴打到账上的时候，你数了三遍——十五万，够你给护理员涨工资、添新设备。你去区政府开会，有人叫你"X总"，你不太习惯，但你知道这意味着你的声音被听到了。`,
    applyEffect: (s) => {
      s.currentSavings += 150000;
      s.pathSkills = s.pathSkills || {};
      s.pathSkills.policySkill = (s.pathSkills.policySkill || 0) + 10;
      s.pathFaith = Math.min(100, s.pathFaith + 15);
    },
  },
  {
    id: 'silver_policy_win_branch_B',
    triggerCardId: 'silver_policy_win',
    delayYears: 2,
    condition: (s) => (s.pathSkills?.policySkill || 0) < 30,
    emotion: 'salty',
    getText: (s) => `第${s.currentAge}岁，你写的提案石沉大海。你跑了三趟民政局，每次都说"研究研究"。你慢慢懂了：政策不是你写得好就能通过的，它需要时间、人脉、和无数次会议的磨。但你没有停止——你改了第六版，又交上去了。`,
    applyEffect: (s) => {
      s.stress = Math.min(100, s.stress + 8);
      s.pathSkills = s.pathSkills || {};
      s.pathSkills.policySkill = (s.pathSkills.policySkill || 0) + 5;
    },
  },

  // --- silver_accident 老人意外 ---
  {
    id: 'silver_accident_branch_A',
    triggerCardId: 'silver_accident',
    delayYears: 2,
    condition: (s) => (s.pathSkills?.careSkill || 0) >= 40,
    emotion: 'warm',
    getText: (s) => `第${s.currentAge}岁，你在那次意外后建立的安全流程成了行业标准。民政部的人来调研，把你的《跌倒预防与应急手册》印发给了全市所有养老机构。你没想过自己会写"标准"——你只是不想再经历一次那种害怕。`,
    applyEffect: (s) => {
      s.pathSkills = s.pathSkills || {};
      s.pathSkills.careSkill = (s.pathSkills.careSkill || 0) + 12;
      s.pathSkills.managementSkill = (s.pathSkills.managementSkill || 0) + 8;
      const biz = (s as any).silverBusiness || { clients: 0, reputation: 20, monthlyRevenue: 0 };
      biz.reputation = Math.min(100, biz.reputation + 15);
      (s as any).silverBusiness = biz;
    },
  },
  {
    id: 'silver_accident_branch_B',
    triggerCardId: 'silver_accident',
    delayYears: 1,
    condition: (s) => (s.pathSkills?.careSkill || 0) < 40,
    emotion: 'crying',
    getText: (s) => `第${s.currentAge}岁，家属索赔了三十万。你把所有存款都赔了进去，站在空荡荡的养老站里，看着墙上老人们送的字画，你哭了。你不怪任何人——你怪自己准备得不够。你锁上门，在门口坐了很久。但你没有把钥匙扔掉。`,
    applyEffect: (s) => {
      s.currentSavings = Math.max(0, s.currentSavings - 300000);
      s.stress = Math.min(100, s.stress + 25);
      s.happiness = Math.max(0, s.happiness - 20);
      s.pathFaith = Math.max(0, s.pathFaith - 10);
    },
  },

  // =========================================================================
  // 生物赌徒路径专属盲盒（6组 triggerCardId，17条分支）
  // =========================================================================

  // --- bio_first_protocol 第一次补剂方案 ---
  {
    id: 'bio_first_protocol_branch_A',
    triggerCardId: 'bio_first_protocol',
    delayYears: 2,
    condition: (s) => s.health < 50,
    emotion: 'crying',
    getText: (s) => `第${s.currentAge}岁，体检报告出来了。你的肝功能指标异常——医生说可能跟你长期吃的那些补剂有关。你把桌上那瓶NMN拿起来看了很久，然后放进了抽屉。你开始明白：在长寿这件事上，"可能有用"和"经过验证"之间隔着无数人的肝脏。`,
    applyEffect: (s) => {
      s.health = Math.max(0, s.health - 12);
      s.stress = Math.min(100, s.stress + 15);
      (s as any).supplementRegime = false;
      s.pathSkills = s.pathSkills || {};
      s.pathSkills.healthOptSkill = (s.pathSkills.healthOptSkill || 0) + 8;
    },
  },
  {
    id: 'bio_first_protocol_branch_B',
    triggerCardId: 'bio_first_protocol',
    delayYears: 2,
    condition: (s) => s.health >= 50 && s.health < 75,
    emotion: 'warm',
    getText: (s) => `第${s.currentAge}岁，第二次生物年龄检测显示你比实际年龄年轻3岁。你不知道这是补剂的作用、运动的作用、还是安慰剂效应——但你的睡眠确实变好了，起床时不再腰酸背痛。你决定继续，但开始更严格地记录每一项指标。`,
    applyEffect: (s) => {
      (s as any).biologicalAge = ((s as any).biologicalAge || 0) - 3;
      s.pathSkills = s.pathSkills || {};
      s.pathSkills.healthOptSkill = (s.pathSkills.healthOptSkill || 0) + 8;
      s.happiness = Math.min(100, s.happiness + 8);
    },
  },
  {
    id: 'bio_first_protocol_branch_C',
    triggerCardId: 'bio_first_protocol',
    delayYears: 2,
    condition: (s) => s.health >= 75,
    emotion: 'funny',
    getText: (s) => `第${s.currentAge}岁，你在健身房遇到一个十年前的同事。他看着你问"你整容了？"你说没有，只是调整了补剂方案和睡眠。他不信，非要你推荐"秘方"。你给了他一份三页纸的方案，他看完说"太麻烦了"。你笑了——长寿的代价之一是大多数人不愿意付出这个代价。`,
    applyEffect: (s) => {
      (s as any).biologicalAge = ((s as any).biologicalAge || 0) - 2;
      s.happiness = Math.min(100, s.happiness + 5);
      s.pathSkills = s.pathSkills || {};
      s.pathSkills.healthOptSkill = (s.pathSkills.healthOptSkill || 0) + 5;
    },
  },

  // --- bio_big_bet 重仓投资生科 ---
  {
    id: 'bio_big_bet_branch_A',
    triggerCardId: 'bio_big_bet',
    delayYears: 2,
    condition: (s) => (s.economicCycle || 0) === 2,
    emotion: 'crying',
    getText: (s) => `第${s.currentAge}岁，你重仓的那家公司三期临床失败了。股价一天跌了80%，你的二十万变成了四万。你盯着公告看了很久，上面写着"未达到主要终点"——七个字，蒸发了你两年的积蓄。你第一次真切地感受到：在生物科技领域，失败是常态，成功是例外。`,
    applyEffect: (s) => {
      const portfolio = (s as any).bioPortfolio || 0;
      (s as any).bioPortfolio = Math.round(portfolio * 0.2);
      s.currentSavings = Math.max(0, s.currentSavings - 50000);
      s.stress = Math.min(100, s.stress + 20);
      s.pathFaith = Math.max(0, s.pathFaith - 10);
    },
  },
  {
    id: 'bio_big_bet_branch_B',
    triggerCardId: 'bio_big_bet',
    delayYears: 3,
    condition: (s) => (s.economicCycle || 0) !== 2 && (s.pathSkills?.investmentSkill || 0) >= 25,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，你投的那家基因疗法公司被大药厂收购了。你的五万块投资变成了七十五万。你没有全卖——你留了一半股份，因为你信的不是收购，是技术本身。但你给自己放了一周假，去了趟日本做精密体检，用收益给自己的身体做了一次全面升级。`,
    applyEffect: (s) => {
      const portfolio = (s as any).bioPortfolio || 0;
      (s as any).bioPortfolio = Math.round(portfolio * 4);
      s.currentSavings += 300000;
      s.pathFaith = Math.min(100, s.pathFaith + 15);
      s.happiness = Math.min(100, s.happiness + 12);
    },
  },

  // --- bio_self_experiment 自体实验 ---
  {
    id: 'bio_self_experiment_branch_A',
    triggerCardId: 'bio_self_experiment',
    delayYears: 1,
    condition: (s) => s.health < 55,
    emotion: 'crying',
    getText: (s) => `第${s.currentAge}岁，你试的那个新补剂方案出问题了。连续三天失眠、心悸，你半夜挂了急诊。医生说你是过度刺激神经系统，让你立刻停掉所有"不明来源的补剂"。你躺在急诊室的床上想：N=1实验的风险不在于没有效果，在于你不知道效果是好是坏。`,
    applyEffect: (s) => {
      s.health = Math.max(0, s.health - 15);
      s.stress = Math.min(100, s.stress + 18);
      (s as any).supplementRegime = false;
    },
  },
  {
    id: 'bio_self_experiment_branch_B',
    triggerCardId: 'bio_self_experiment',
    delayYears: 2,
    condition: (s) => s.health >= 55,
    emotion: 'spicy',
    getText: (s) => `第${s.currentAge}岁，你坚持记录了两年的自体实验数据引起了一个研究小组的注意。他们邀请你作为公民科学家参与他们的衰老标志物研究，给你提供免费的检测和专业指导。你意识到：真正的生物黑客不是乱吃药，是用严谨的方法对待自己的身体。`,
    applyEffect: (s) => {
      s.pathSkills = s.pathSkills || {};
      s.pathSkills.bioKnowledge = (s.pathSkills.bioKnowledge || 0) + 12;
      s.pathSkills.healthOptSkill = (s.pathSkills.healthOptSkill || 0) + 8;
      (s as any).biologicalAge = ((s as any).biologicalAge || 0) - 2;
      s.pathFaith = Math.min(100, s.pathFaith + 10);
    },
  },

  // --- bio_all_in All In全力投入长寿事业 ---
  {
    id: 'bio_all_in_branch_A',
    triggerCardId: 'bio_all_in',
    delayYears: 1,
    condition: (s) => s.stress > 65 || s.currentSavings < 30000,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，辞职一年了。你参加了三个学术会议、读了两百篇论文，但没有产生任何收入。存款在缩水，你开始怀疑自己是不是太理想主义了。深夜你对着镜子看自己——比同龄人年轻，但你的银行账户不关心你看起来多少岁。`,
    applyEffect: (s) => {
      s.stress = Math.min(100, s.stress + 15);
      s.pathFaith = Math.max(0, s.pathFaith - 8);
    },
  },
  {
    id: 'bio_all_in_branch_B',
    triggerCardId: 'bio_all_in',
    delayYears: 2,
    condition: (s) => s.isAllInPath && s.pathFaith >= 60,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，你写的一篇长寿研究综述被一个知名科普平台发表了。阅读量破百万，三家抗衰机构来找你做顾问。你的咨询费是每小时2000块，但你最开心的不是钱——是评论区里有人说"这篇文章改变了我对衰老的认知"。你在和时间赛跑，但你不是一个人在跑。`,
    applyEffect: (s) => {
      s.passiveIncome += 18000;
      s.currentSavings += 80000;
      s.pathSkills = s.pathSkills || {};
      s.pathSkills.bioKnowledge = (s.pathSkills.bioKnowledge || 0) + 10;
      s.pathFaith = Math.min(100, s.pathFaith + 18);
      s.happiness = Math.min(100, s.happiness + 15);
    },
  },

  // --- bio_breakthrough_news 领域突破 ---
  {
    id: 'bio_breakthrough_news_branch_A',
    triggerCardId: 'bio_breakthrough_news',
    delayYears: 3,
    condition: (s) => (s.pathSkills?.bioKnowledge || 0) >= 40,
    emotion: 'sweet',
    getText: (s) => `第${s.currentAge}岁，你三年前关注的那个表观遗传重编程技术进入了人体临床试验。你是第一批申请入组的志愿者之一——不是因为你不怕风险，是因为你比任何人都清楚：如果这个技术有效，你多等一年就少活一年。体检时护士问你年龄，你说"比你以为的年轻"。`,
    applyEffect: (s) => {
      (s as any).biologicalAge = ((s as any).biologicalAge || 0) - 5;
      s.pathFaith = Math.min(100, s.pathFaith + 20);
      s.happiness = Math.min(100, s.happiness + 15);
      s.health = Math.min(100, s.health + 8);
    },
  },
  {
    id: 'bio_breakthrough_news_branch_B',
    triggerCardId: 'bio_breakthrough_news',
    delayYears: 2,
    condition: (s) => (s.pathSkills?.bioKnowledge || 0) < 40,
    emotion: 'salty',
    getText: (s) => `第${s.currentAge}岁，那个"革命性突破"被证实是数据造假。你损失了十万块投资，但更大的损失是心理上的——你曾经以为人类离长寿只差一层窗户纸，现在你发现窗户纸后面还有十道门。你没有放弃，但你学会了：科学的进步不是直线，是螺旋。`,
    applyEffect: (s) => {
      s.currentSavings = Math.max(0, s.currentSavings - 100000);
      s.stress = Math.min(100, s.stress + 10);
      s.pathSkills = s.pathSkills || {};
      s.pathSkills.bioKnowledge = (s.pathSkills.bioKnowledge || 0) + 8;
    },
  },

  // --- bio_friend_warning 朋友/医生警告 ---
  {
    id: 'bio_friend_warning_branch_A',
    triggerCardId: 'bio_friend_warning',
    delayYears: 2,
    condition: (s) => s.pathFaith >= 65,
    emotion: 'warm',
    getText: (s) => `第${s.currentAge}岁，你的体检数据比两年前更好了。那个曾经警告你的医生朋友看着你的报告沉默了一会儿，然后说"把你的方案发我看看"。你笑了——你不需要别人相信你，你只需要数据。但多一个人理解总是好的。`,
    applyEffect: (s) => {
      s.happiness = Math.min(100, s.happiness + 10);
      s.pathFaith = Math.min(100, s.pathFaith + 8);
      s.pathSkills = s.pathSkills || {};
      s.pathSkills.healthOptSkill = (s.pathSkills.healthOptSkill || 0) + 5;
    },
  },
  {
    id: 'bio_friend_warning_branch_B',
    triggerCardId: 'bio_friend_warning',
    delayYears: 2,
    condition: (s) => s.pathFaith < 65,
    emotion: 'bitter',
    getText: (s) => `第${s.currentAge}岁，你减少了一半的补剂用量。不是因为朋友说对了——是因为你自己的数据没有显示出明显的效果。你开始接受一个可能性：也许在你有生之年，真正的长寿技术不会到来。但你还是每天运动、按时睡觉——不是因为你能活150岁，是因为今天值得好好过。`,
    applyEffect: (s) => {
      s.pathFaith = Math.max(0, s.pathFaith - 8);
      s.stress = Math.max(0, s.stress - 5);
      s.happiness = Math.min(100, s.happiness + 5);
      (s as any).supplementRegime = false;
    },
  },

];

// ========== 盲盒检测与触发函数 ==========

/**
 * 待触发的盲盒条目
 */
export interface PendingBlindBox {
  /** 盲盒分支ID（注册时根据当时状态选定的分支，作为兜底） */
  outcomeId: string;
  /** 触发时的玩家年龄 */
  triggerAge: number;
  /** 修复#4：触发卡片ID——用于揭晓时重新评估条件分支 */
  triggerCardId?: string;
  /** 修复#4：延迟年数——用于揭晓时匹配同卡同年限的分支 */
  delayYears?: number;
}

/**
 * 检测当前年度应触发的盲盒分支
 *
 * 修复#4：揭晓时复查条件——如果 pendingBlindBox 带有 triggerCardId，
 * 则重新遍历该卡片的所有分支，根据当前状态选择最合适的分支。
 * 这确保了"选卡时的决定"不会因为状态变化而出现叙事矛盾
 * （如选卡时有10万存款选了"富裕"分支，3年后破产了却仍触发"富裕"叙事）。
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
      // 修复#4：优先使用 triggerCardId 重新评估条件
      if (pending.triggerCardId) {
        // 找到该卡片的所有分支，按 delayYears 匹配并排序
        const candidates = BLIND_BOX_OUTCOMES
          .filter(o => matchTriggerId(o.triggerCardId, pending.triggerCardId!) && o.delayYears === pending.delayYears)
          .sort((a, b) => a.delayYears - b.delayYears);

        // 重新评估条件，选第一个匹配当前状态的分支
        const matched = candidates.find(o => o.condition(state));
        if (matched) {
          triggered.push(matched);
        } else if (candidates.length > 0) {
          // 所有条件都不满足时，用最后一个分支作为兜底（通常是 condition: () => true）
          triggered.push(candidates[candidates.length - 1]);
        } else {
          // 没有匹配的分支定义，尝试用 outcomeId 兜底
          const fallback = BLIND_BOX_OUTCOMES.find(o => o.id === pending.outcomeId);
          if (fallback) triggered.push(fallback);
        }
      } else {
        // 旧格式兼容：直接用 outcomeId 查找
        const outcome = BLIND_BOX_OUTCOMES.find(o => o.id === pending.outcomeId);
        if (!outcome) {
          continue;
        }
        triggered.push(outcome);
      }
    } else {
      remaining.push(pending);
    }
  }

  return { outcomes: triggered, remaining };
}

/**
 * 模糊匹配卡片ID（支持前缀匹配，与 game.store.ts 中的 matchTrigger 逻辑一致）
 */
function matchTriggerId(outcomeCardId: string, pendingCardId: string): boolean {
  if (outcomeCardId === pendingCardId) return true;
  // 支持前缀匹配：如 outcomeCardId='buy_house' 匹配 pendingCardId='buy_house_a'
  if (outcomeCardId.length < pendingCardId.length && pendingCardId.startsWith(outcomeCardId)) return true;
  if (pendingCardId.length < outcomeCardId.length && outcomeCardId.startsWith(pendingCardId)) return true;
  return false;
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
