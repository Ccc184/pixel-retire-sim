import type { GameState, PartnerState, PartnerPersonality, RomanceMemory, DatingStage } from '../types/global.d.js';

// ================================================================
//  恋爱系统 - 从遇见、暧昧、约会、恋爱到结婚的完整感情线
// ================================================================

// 伴侣名字池
const FEMALE_NAMES = ['晓芸', '佳慧', '雨萱', '思琪', '子涵', '若彤', '梦瑶', '欣怡', '可馨', '雅婷'];
const MALE_NAMES = ['浩然', '宇轩', '俊杰', '天翔', '明远', '子轩', '宇航', '子豪', '睿哲', '一诺'];

// 性格对应的特征标签和行为倾向
const PERSONALITY_TRAITS: Record<PartnerPersonality, {
  traits: string[];
  meetWays: string[];
  dateEvents: string[];
  fightEvents: string[];
  sweetEvents: string[];
  proposalReactions: string[];
}> = {
  '温柔型': {
    traits: ['笑起来有酒窝', '做饭超好吃', '会记住你说的每句话', '养猫', '声音温柔'],
    meetWays: ['朋友聚会', '图书馆', '咖啡馆', '志愿者活动'],
    dateEvents: ['在家做了一桌你爱吃的菜等你下班', '手织了一条围巾给你', '你加班到深夜，ta默默点了外卖送到公司'],
    fightEvents: ['不吵架，只是红着眼睛不说话', '写了一封长信给你说自己的感受'],
    sweetEvents: ['半夜你踢被子，ta起来给你盖好', '你生病时请假在家照顾你，煮了一锅粥'],
    proposalReactions: ['捂住嘴哭了，拼命点头', '笑着捶你胸口说"你怎么才问"'],
  },
  '事业型': {
    traits: ['开会时气场两米八', '比你赚得多', '永远在接电话', '高跟鞋走路带风', 'Excel做的贼溜'],
    meetWays: ['公司年会', '行业峰会', '客户拜访', '商务饭局'],
    dateEvents: ['带你去了一家需要提前三个月预约的餐厅', '出差回来给你带了一块限量版手表', '帮你把简历改了，你拿到了涨薪40%的offer'],
    fightEvents: ['冷战三天，然后发一条"晚上回来吃饭吗"', '直接把问题列成PPT跟你辩论'],
    sweetEvents: ['你遇到职场难题，ta三句话给你点透了', '嘴上说不在乎纪念日，却偷偷订了旅行机票'],
    proposalReactions: ['挑了一下眉毛说"戒指呢？拿来我看看"，然后自己戴上了', '沉默了十秒说"我等这句话等了三年"'],
  },
  '浪漫型': {
    traits: ['会弹吉他', '每年记得所有纪念日', '手机里全是你的照片', '写诗', '喜欢在雨天散步'],
    meetWays: ['音乐节', '画展', '旅行途中', '书店', '朋友的婚礼'],
    dateEvents: ['在天台上布置了星星灯和投影，放你们的合照', '突然出现在你公司楼下接你下班，手里拿着一束花', '写了一首歌在你生日那天弹唱给你听'],
    fightEvents: ['摔门而去，两小时后拎着你爱吃的小龙虾回来', '在朋友圈发了一段伤感文案，等你去哄'],
    sweetEvents: ['在你最丧的那天，ta什么都没说，只是紧紧抱着你', '每个月14号都有小惊喜，从不重样'],
    proposalReactions: ['尖叫着说"我愿意！！！"，然后抱着你哭了', '掏出一个小盒子说"其实我也准备了，我先问的！"'],
  },
  '节俭型': {
    traits: ['超市打折永远知道', '记账记得一丝不苟', '会修各种家电', '买东西必比价', '从不乱花钱'],
    meetWays: ['合租室友', '相亲', '社区团购群', '银行办业务'],
    dateEvents: ['用优惠券带你吃了一顿大餐只花了50块', '把你们一起攒的钱拿给你看说"够付首付了"', '把你乱扔的空瓶子收集起来卖了，给你买了个冰淇淋'],
    fightEvents: ['因为你买了一个"没用的东西"唠叨了一晚上', '生闷气但还是给你留了饭'],
    sweetEvents: ['你想要很久的相机，ta攒了三个月零花钱偷偷买给你', '把每一笔你们共同的开销都记在小本本里，备注"幸福基金"'],
    proposalReactions: ['先问"戒指多少钱？退了能换个大点的吗？"然后说"我愿意"', '哭着说"你这个傻子，这么多钱留着买房不好吗"'],
  },
  '独立型': {
    traits: ['有自己的乐队', '背包客去过20个国家', '健身达人', '能自己换灯泡通马桶', '不粘人'],
    meetWays: ['攀岩馆', '马拉松', '独自旅行的青旅', '朋友的饭局'],
    dateEvents: ['拉你去蹦极/跳伞/潜水', '带你去了一个你从没听过的地下乐队演出', '凌晨两点叫你起来看流星雨'],
    fightEvents: ['直接说"我需要冷静一下"，然后去跑了十公里', '不冷战，直接摊开讲清楚，讲完就翻篇'],
    sweetEvents: ['你以为ta不在乎，结果你提过一次的小众电影ta记了半年', '在你最脆弱的时候说"我在"，不多话但一直在'],
    proposalReactions: ['愣了三秒说"你确定？我可是很难搞的"，然后笑了', '说"行啊，反正跟你待着挺舒服的"，然后偷偷发了个朋友圈'],
  },
};

// 遇见方式
const MEET_CUTES: Array<{
  text: (name: string) => string;
  emoji: string;
  from: 'friend' | 'work' | 'blind_date' | 'app' | 'travel';
  minAge: number;
  maxAge: number;
}> = [
  { text: (n) => `朋友聚会上，你认识了${n}。散场的时候ta说"加个微信吧"，你心跳漏了一拍。`, emoji: '💫', from: 'friend', minAge: 23, maxAge: 32 },
  { text: (n) => `公司新来了个同事叫${n}。开会的时候你们对视了一眼，两个人同时移开了目光。`, emoji: '👀', from: 'work', minAge: 23, maxAge: 35 },
  { text: (n) => `你被老妈逼着去相亲，本来想应付一下就走，结果对面坐的是${n}——完全不是你想象中的样子。`, emoji: '😳', from: 'blind_date', minAge: 25, maxAge: 38 },
  { text: (n) => `刷交友软件滑到了${n}，本来以为又是一个无聊的人，结果聊了一整晚，天亮的时候你发现自己在笑。`, emoji: '📱', from: 'app', minAge: 22, maxAge: 35 },
  { text: (n) => `在去云南的火车上，你对面坐着${n}。你们聊了整整二十六个小时，下车的时候交换了联系方式。`, emoji: '🚂', from: 'travel', minAge: 23, maxAge: 33 },
  { text: (n) => `健身房里${n}帮你纠正了动作，你发现自己第二天故意选了同一个时间去。`, emoji: '💪', from: 'friend', minAge: 23, maxAge: 35 },
  { text: (n) => `下雨天你没带伞，${n}撑伞送你到地铁站。你到公司的时候发现肩膀是干的，ta半边身子全湿了。`, emoji: '☔', from: 'friend', minAge: 22, maxAge: 32 },
];

// 暧昧期事件（crush → dating）
const CRUSH_EVENTS: Array<{ text: (n: string) => string; affection: number }> = [
  { text: (n: string) => `你和${n}的微信聊天记录翻到了最上面，你才发现你们已经聊了三个月了。今天ta发了一条朋友圈，你第一个点赞。`, affection: 5 },
  { text: (n: string) => `${n}约你周末去看电影。你翻遍衣柜试了二十件衣服，最后还是穿了第一天见ta时穿的那件。`, affection: 8 },
  { text: (n: string) => `你发现自己开始不自觉地看手机，怕错过${n}的消息。ta发条朋友圈你要反复看好几遍。`, affection: 3 },
  { text: (n: string) => `同事开玩笑说你和${n}是不是在一起了，你嘴上否认，耳朵却红了。`, affection: 4 },
];

// 恋爱期甜蜜事件（dating → serious）
const DATE_SWEET_EVENTS: Array<{ text: (n: string) => string; affection: number; trust: number }> = [
  { text: (n) => `${n}记得你不爱吃香菜，每次吃饭都帮你挑掉。你说"你怎么记得"，ta说"因为是你啊"。`, affection: 6, trust: 3 },
  { text: (n) => `你加班到凌晨回家，${n}在沙发上等你等到睡着了，桌上还有温着的宵夜。`, affection: 8, trust: 5 },
  { text: (n) => `你们第一次一起旅行。旅途中吵架了，但${n}还是默默帮你拎箱子、给你买水。回来的时候你们的感情更好了。`, affection: 5, trust: 8 },
  { text: (n) => `${n}把你介绍给了ta所有的朋友。敬酒的时候ta牵着你的手，你看到ta眼里有光。`, affection: 10, trust: 7 },
  { text: (n) => `你生病了，${n}请假照顾了你三天。你看着ta忙前忙后的样子，第一次有了"想和这个人过一辈子"的念头。`, affection: 12, trust: 10 },
];

// 争吵/危机事件
const FIGHT_EVENTS: Array<{ text: (n: string) => string; affection: number; trust: number; canBreakup: boolean }> = [
  { text: (n) => `你和${n}因为一件小事大吵了一架，冷战了两天。第三天ta发来一条消息："饭做好了，回来吃吧。"`, affection: -5, trust: -3, canBreakup: false },
  { text: (n) => `你发现${n}和前任还有联系，你们吵了很凶的一架。ta删掉了所有联系方式，抱着你说"对不起，我只在乎你"。`, affection: -8, trust: -12, canBreakup: false },
  { text: (n) => `${n}最近工作特别忙，你们已经一周没好好说话了。你怀疑ta是不是不爱你了，但ta在你枕头底下放了一张小纸条："等忙完这阵带你去旅行。"`, affection: -3, trust: -5, canBreakup: false },
  { text: (n) => `因为彩礼/买房的事，两家人闹得很不愉快。你和${n}第一次对未来产生了分歧。`, affection: -10, trust: -8, canBreakup: true },
  { text: (n) => `你犯了一个错，${n}很失望。你们沉默了很久，最后ta说"我原谅你，但下次不许了"。`, affection: -6, trust: -10, canBreakup: true },
];

// 求婚/结婚事件
const PROPOSAL_EVENTS: Array<{ text: (n: string) => string }> = [
  { text: (n: string) => `你在你们第一次约会的地方向${n}求婚了。` },
  { text: (n: string) => `在${n}生日那天，你准备了戒指。` },
  { text: (n: string) => `跨年夜烟花响起的时候，你在${n}面前单膝跪地。` },
  { text: (n: string) => `你们一起看日出的时候，你掏出了戒指，对${n}说"嫁给我吧"。` },
];

// 婚后甜蜜事件
const MARRIAGE_SWEET_EVENTS: Array<{ text: (n: string) => string; affection: number; trust?: number }> = [
  { text: (n: string) => `${n}半夜给你盖被子，你假装睡着，心里暖暖的。`, affection: 3 },
  { text: (n: string) => `你们周末一起逛超市买菜，${n}推车你挑菜，像所有普通夫妻一样。你觉得这就是幸福。`, affection: 5 },
  { text: (n: string) => `结婚纪念日，${n}拿出了一个你念叨了很久但舍不得买的东西。你说"乱花钱"，嘴角却压不住。`, affection: 8 },
  { text: (n: string) => `你半夜做噩梦醒了，${n}迷迷糊糊地抱紧你说"别怕，我在"。`, affection: 6 },
  { text: (n: string) => `你们吵架了，谁也不理谁。饭点的时候${n}默默做了两碗面，把大碗推给你。`, affection: 4, trust: 2 },
];

// 婚后危机事件
const MARRIAGE_CRISIS_EVENTS: Array<{ text: (n: string) => string; affection: number; trust: number }> = [
  { text: (n: string) => `因为孩子教育问题你和${n}大吵一架，摔门而去。在楼下走了一圈，回来的时候ta给你留了门。`, affection: -5, trust: -3 },
  { text: (n: string) => `你发现${n}偷偷给ta家里转了一笔钱没跟你商量。你们吵了很久，最后定了个规矩：大额支出必须商量。`, affection: -8, trust: -10 },
  { text: (n: string) => `七年之痒。你和${n}好像没什么话好说了，吃完饭各自刷手机。你开始怀疑婚姻是不是就是这样。`, affection: -10, trust: -5 },
];

// ================================================================
//  恋爱系统核心逻辑
// ================================================================

export interface RomanceResult {
  logs: string[];
  isBigEvent: boolean;  // 是否需要暂停展示（大事才停）
  affectionChange: number;
  trustChange: number;
  newMemory?: RomanceMemory;
  newStage?: DatingStage;  // 推进到的新恋爱阶段（crush→dating→serious→married）
  triggerMarriage?: boolean;
  triggerBreakup?: boolean;
  triggerCrush?: boolean;  // 新遇见某人
  newPartner?: Partial<PartnerState>;
  sceneAnimation?: 'hearts' | 'heartbreak' | 'wedding';
}

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getRandomName(): string {
  const all = [...FEMALE_NAMES, ...MALE_NAMES];
  return rand(all);
}

function randomPersonality(): PartnerPersonality {
  const ps: PartnerPersonality[] = ['温柔型', '事业型', '浪漫型', '节俭型', '独立型'];
  return rand(ps);
}

// 遇见新的人（crush阶段）
function meetSomeone(state: GameState): RomanceResult | null {
  const age = state.currentAge;
  // 22-32岁遇见概率最高，33-40逐渐降低
  let meetChance = 0;
  if (age >= 22 && age <= 28) meetChance = 0.35;
  else if (age <= 32) meetChance = 0.25;
  else if (age <= 38) meetChance = 0.12;
  else if (age <= 45) meetChance = 0.05;
  else meetChance = 0.02;
  
  // 有伴侣但未婚（在dating/serious阶段），不再遇见新人（克制）
  if (state.partner && state.partner.datingStage !== 'single' && state.partner.datingStage !== 'divorced') {
    // 但有小概率遇见诱惑
    if (Math.random() < 0.03 && state.partner.datingStage !== 'married') {
      return temptationEvent(state);
    }
    return null;
  }
  
  if (Math.random() > meetChance) {
    // 如果玩家今年主动社交了，大幅提高遇见概率
    if ((state as any).socialActiveThisYear && Math.random() < 0.6) {
      (state as any).socialActiveThisYear = false; // consume
      // 继续执行遇见逻辑
    } else {
      return null;
    }
  }
  // 消费社交标记
  (state as any).socialActiveThisYear = false;
  
  // 离婚后冷却2年
  if (state.partner?.datingStage === 'divorced' && age - state.partner.marriedYear < 2) return null;
  
  const eligible = MEET_CUTES.filter(m => age >= m.minAge && age <= m.maxAge);
  if (eligible.length === 0) return null;
  
  const meet = rand(eligible);
  const name = getRandomName();
  const personality = randomPersonality();
  const pInfo = PERSONALITY_TRAITS[personality];
  const trait = rand(pInfo.traits);
  
  const log = meet.text(name);
  const memory: RomanceMemory = { age, event: `遇见了${name}`, emoji: meet.emoji };
  
  const newPartner: PartnerState = {
    name,
    age: age + Math.floor(Math.random() * 4) - 2,
    affection: 20 + Math.floor(Math.random() * 15),  // 初始好感20-35
    trust: 10 + Math.floor(Math.random() * 10),
    marriedYear: 0,
    hasDivorced: false,
    personality,
    datingStage: 'crush',
    meetYear: age,
    trait,
    memories: [memory],
    crushFrom: meet.from,
  };
  
  return {
    logs: [log],
    isBigEvent: true,
    affectionChange: 0,
    trustChange: 0,
    newMemory: memory,
    triggerCrush: true,
    newPartner,
    sceneAnimation: 'hearts',
  };
}

// 诱惑事件（恋爱中遇见别人）
function temptationEvent(state: GameState): RomanceResult | null {
  if (!state.partner) return null;
  const n = state.partner.name;
  const events = [
    { text: `公司新来的同事对你示好，你心动了一下。但回到家看到${n}给你留的灯，你删掉了对方的微信。`, affection: 3, trust: 5 },
    { text: `前任突然联系你，说"还是想你"。你看着身边熟睡的${n}，拉黑了前任。`, affection: 2, trust: 8 },
    { text: `出差时有人搭讪，你礼貌地说"我有对象了"。说这句话的时候你想到了${n}，笑了。`, affection: 5, trust: 3 },
  ];
  const evt = rand(events);
  return {
    logs: [evt.text],
    isBigEvent: false,
    affectionChange: evt.affection,
    trustChange: evt.trust,
  };
}

// 推进恋爱关系
function advanceRomance(state: GameState): RomanceResult | null {
  if (!state.partner) return null;
  const p = state.partner;
  const n = p.name;
  const age = state.currentAge;
  const yearsKnown = age - p.meetYear;
  const pInfo = PERSONALITY_TRAITS[p.personality];
  
  // === crush阶段：暧昧→约会 ===
  if (p.datingStage === 'crush' && yearsKnown >= 1) {
    // 好感度够高才会开始约会
    if (p.affection >= 40 && Math.random() < 0.5) {
      const dateEvt = rand(pInfo.dateEvents);
      const memory: RomanceMemory = { age, event: `和${n}第一次正式约会`, emoji: '💕' };
      return {
        logs: [`${dateEvt}。你们的关系从暧昧变成了正式约会。`],
        isBigEvent: true,
        affectionChange: 10,
        trustChange: 5,
        newMemory: memory,
        newStage: 'dating',
        sceneAnimation: 'hearts',
      };
    }
    // 暧昧期小事件
    if (Math.random() < 0.4) {
      const evt = rand(CRUSH_EVENTS);
      return {
        logs: [evt.text(n)],
        isBigEvent: false,
        affectionChange: evt.affection,
        trustChange: 0,
      };
    }
    return null;
  }
  
  // === dating阶段：约会→认真交往 ===
  if (p.datingStage === 'dating') {
    if (yearsKnown >= 2 && p.affection >= 55 && p.trust >= 40 && Math.random() < 0.3) {
      // 见家长/确立关系
      const memory: RomanceMemory = { age, event: `和${n}确定了关系`, emoji: '💑' };
      return {
        logs: [`${n}带你见了ta的父母。紧张得手心全是汗，但ta全程紧紧握着你的手。出来的时候你问"我表现怎么样"，ta说"完美"。你们正式在一起了。`],
        isBigEvent: true,
        affectionChange: 12,
        trustChange: 10,
        newMemory: memory,
        newStage: 'serious',
        sceneAnimation: 'hearts',
      };
    }
    // 甜蜜日常
    if (Math.random() < 0.35) {
      const evt = rand(DATE_SWEET_EVENTS);
      return {
        logs: [evt.text(n)],
        isBigEvent: false,
        affectionChange: evt.affection,
        trustChange: evt.trust,
      };
    }
    // 争吵
    if (Math.random() < 0.12) {
      const evt = rand(FIGHT_EVENTS);
      const result: RomanceResult = {
        logs: [evt.text(n)],
        isBigEvent: true,
        affectionChange: evt.affection,
        trustChange: evt.trust,
      };
      // 感情太低且是严重争吵，可能分手
      if (evt.canBreakup && p.affection + evt.affection < 20 && p.trust + evt.trust < 15 && Math.random() < 0.4) {
        result.triggerBreakup = true;
        result.logs.push(`你和${n}和平分手了。没有谁对谁错，只是你们要的东西不一样。`);
        result.isBigEvent = true;
        result.sceneAnimation = 'heartbreak';
        result.newMemory = { age, event: `和${n}分手了`, emoji: '💔' };
      }
      return result;
    }
    return null;
  }
  
  // === serious阶段：认真交往→求婚 ===
  if (p.datingStage === 'serious') {
    const yearsDating = yearsKnown - 2; // 大约认真交往了多久
    // 交往1-5年之间有概率求婚
    if (yearsDating >= 1 && p.affection >= 60 && p.trust >= 50) {
      let proposalChance = 0.1;
      if (yearsDating >= 2) proposalChance = 0.2;
      if (yearsDating >= 3) proposalChance = 0.35;
      if (yearsDating >= 5) proposalChance = 0.5;
      // 有房/有存款提高求婚概率
      if (state.hasProperty) proposalChance += 0.15;
      if (state.currentSavings > 100000) proposalChance += 0.1;
      // 年龄越大越急
      if (age >= 30) proposalChance += 0.1;
      
      if (Math.random() < proposalChance) {
        const propose = rand(PROPOSAL_EVENTS);
        const reaction = rand(pInfo.proposalReactions);
        const memory: RomanceMemory = { age, event: `向${n}求婚了`, emoji: '💍' };
        return {
          logs: [propose.text(n) + reaction],
          isBigEvent: true,
          affectionChange: 15,
          trustChange: 15,
          newMemory: memory,
          newStage: 'married',
          triggerMarriage: true,
          sceneAnimation: 'wedding',
        };
      }
    }
    // 日常甜蜜
    if (Math.random() < 0.3) {
      const evt = rand(DATE_SWEET_EVENTS);
      return {
        logs: [evt.text(n)],
        isBigEvent: false,
        affectionChange: evt.affection,
        trustChange: evt.trust,
      };
    }
    // 婚前争吵（彩礼/买房等）
    if (Math.random() < 0.1) {
      const crisis = FIGHT_EVENTS.find(f => f.canBreakup) || FIGHT_EVENTS[3];
      const result: RomanceResult = {
        logs: [crisis.text(n)],
        isBigEvent: true,
        affectionChange: crisis.affection,
        trustChange: crisis.trust,
      };
      if (p.affection + crisis.affection < 25 && p.trust + crisis.trust < 20 && Math.random() < 0.35) {
        result.triggerBreakup = true;
        result.logs.push(`彩礼和房子的问题谈不拢，你和${n}最终还是分开了。`);
        result.isBigEvent = true;
        result.sceneAnimation = 'heartbreak';
        result.newMemory = { age, event: `和${n}因现实问题分手`, emoji: '💔' };
      }
      return result;
    }
    return null;
  }
  
  // === married阶段：婚后生活 ===
  if (p.datingStage === 'married') {
    const marriedYears = age - p.marriedYear;
    // 结婚不到1年不触发婚后事件（避免结婚当年就触发"结婚纪念日"等事件）
    if (marriedYears < 1) return null;
    
    // 婚后甜蜜（概率随年限递减）
    const sweetChance = Math.max(0.08, 0.3 - marriedYears * 0.005);
    if (Math.random() < sweetChance) {
      const evt = rand(MARRIAGE_SWEET_EVENTS);
      return {
        logs: [evt.text(n)],
        isBigEvent: false,
        affectionChange: evt.affection,
        trustChange: evt.trust || 0,
      };
    }
    
    // 婚后危机（七年之痒等）
    const crisisChance = 0.05 + (marriedYears >= 5 && marriedYears <= 10 ? 0.08 : 0);
    if (Math.random() < crisisChance && p.affection > 20) {
      const evt = rand(MARRIAGE_CRISIS_EVENTS);
      return {
        logs: [evt.text(n)],
        isBigEvent: false,
        affectionChange: evt.affection,
        trustChange: evt.trust,
      };
    }
    
    // 严重危机：长期低感情有离婚风险
    if (p.affection < 25 && p.trust < 20 && Math.random() < 0.05 && marriedYears >= 2) {
      return {
        logs: [`你和${n}的婚姻走到了尽头。没有大吵大闹，只是两个人都明白——该结束了。办完手续那天你们吃了最后一顿饭，敬了彼此一杯。`],
        isBigEvent: true,
        affectionChange: 0,
        trustChange: 0,
        triggerBreakup: true,
        sceneAnimation: 'heartbreak',
        newMemory: { age, event: `和${n}离婚了`, emoji: '💔' },
      };
    }
    
    // 长期高感情：金婚式温馨
    if (marriedYears >= 10 && p.affection >= 70 && Math.random() < 0.03) {
      return {
        logs: [`结婚${marriedYears}年了。你看着${n}白发越来越多，忽然想起年轻时的你们。ta问你"看什么"，你说"看我这辈子最对的决定"。`],
        isBigEvent: true,
        affectionChange: 10,
        trustChange: 5,
        sceneAnimation: 'hearts',
        newMemory: { age, event: `结婚${marriedYears}年`, emoji: '💝' },
      };
    }
  }
  
  return null;
}

// ================================================================
//  主入口：每年调用一次，处理恋爱事件
// ================================================================
export function processRomanceYear(state: GameState): RomanceResult {
  const empty: RomanceResult = {
    logs: [],
    isBigEvent: false,
    affectionChange: 0,
    trustChange: 0,
  };
  
  // 已有伴侣，推进关系
  if (state.partner && !state.partner.hasDivorced && state.partner.datingStage !== 'single' && state.partner.datingStage !== 'divorced') {
    const result = advanceRomance(state);
    if (result) {
      // 应用数值变化
      if (state.partner) {
        state.partner.affection = Math.max(0, Math.min(100, state.partner.affection + result.affectionChange));
        state.partner.trust = Math.max(0, Math.min(100, state.partner.trust + result.trustChange));
        
        if (result.newMemory) {
          if (!state.partner.memories) state.partner.memories = [];
          state.partner.memories.push(result.newMemory);
        }
        
        // 阶段推进（crush→dating→serious→married）
        if (result.newStage) {
          state.partner.datingStage = result.newStage;
          if (result.newStage === 'married') {
            state.partner.marriedYear = state.currentAge;
            state.isMarried = true;
          }
        }
        
        // 阶段推进
        if (result.triggerMarriage && state.partner.datingStage !== 'married') {
          state.partner.datingStage = 'married';
          state.partner.marriedYear = state.currentAge;
          state.isMarried = true;
        }
        
        if (result.triggerBreakup) {
          if (state.partner.datingStage === 'married') {
            state.partner.hasDivorced = true;
            state.isMarried = false;
            // 离婚财产分割
            state.currentSavings = Math.round(state.currentSavings * 0.7);
          }
          state.partner.datingStage = 'divorced';
          state.partner.exName = state.partner.name;
        }
      }
      return result;
    }
    return empty;
  }
  
  // 单身/离婚，可能遇见新的人
  const meet = meetSomeone(state);
  if (meet && meet.newPartner) {
    state.partner = meet.newPartner as PartnerState;
    state.isMarried = false;
    if (state.partner.datingStage === 'crush') {
      // happiness boost from meeting someone
      state.happiness = Math.min(100, state.happiness + 5);
    }
    return meet;
  }
  
  return empty;
}

// 获取当前恋爱状态描述
export function getRomanceStatus(state: GameState): { emoji: string; label: string; desc: string } {
  const p = state.partner;
  if (!p || p.datingStage === 'single') {
    return { emoji: '🖤', label: '单身', desc: '一个人也挺好的' };
  }
  if (p.datingStage === 'divorced') {
    return { emoji: '💔', label: '离异', desc: `和${p.exName || '前任'}分开了` };
  }
  if (p.hasDivorced) {
    return { emoji: '💔', label: '离异', desc: `和${p.name}离婚了` };
  }
  switch (p.datingStage) {
    case 'crush':
      return { emoji: '😳', label: '暧昧中', desc: `对${p.name}有好感` };
    case 'dating':
      return { emoji: '💕', label: '约会中', desc: `和${p.name}在约会` };
    case 'serious':
      return { emoji: '💑', label: '恋爱中', desc: `和${p.name}在一起了` };
    case 'married':
      const years = state.currentAge - p.marriedYear;
      return { emoji: '💍', label: `已婚${years}年`, desc: `和${p.name}（${p.personality}）` };
    default:
      return { emoji: '❤️', label: '恋爱中', desc: `和${p.name}` };
  }
}
