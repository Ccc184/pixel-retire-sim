/**
 * 哲学叙事事件库 · 六大策略实现
 *
 * 策略1: 让选择暴露"人是什么" — 每条路径1个灵魂拷问事件
 * 策略2: 把时间性做成叙事主体 — 年龄里程碑+时间回响
 * 策略3: 制造系统性反讽 — 每条路径1个反讽事件
 * 策略4: 留白与未解 — 开放式结局事件
 * 策略5: NPC成为哲学他者 — 镜像NPC事件
 *
 * 设计原则：
 *   - 不是说教，而是提问
 *   - 不是给答案，而是让玩家在选择中看见自己
 *   - 每个选项都是一种"存在主义回应"，没有对错，只有代价
 * ================================================================
 */
import type { NarrativeEvent, GameState } from '../types/global.d.js';
import { registerNarrativeEvents } from './narrative-registry.js';

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

const PHILOSOPHY_EVENTS: NarrativeEvent[] = [

  // ============================================================
  // 策略1：让选择暴露"人是什么"
  // 每条路径1个灵魂拷问事件——选择的不是选项，而是"你是谁"
  // ============================================================

  {
    id: 'phil_soul_ai',
    title: '图灵之问',
    narrative: '深夜，你盯着自己训练的AI模型。它刚写了一段话，比你写得更好——更温柔，更像"你"。\n如果它比你更懂如何表达你的感受，那"你的感受"到底是谁的？你关掉屏幕，但那个问题还亮着。',
    pathId: 'ai_symbiote',
    ageRange: [30, 40],
    priority: 10,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'breakthrough',
    conditions: (s) => (s.pathSkills?.aiSkill || 0) >= 30,
    options: [
      {
        id: 'phil_soul_ai_a',
        label: '承认它比你更懂你',
        description: '如果AI能更准确地表达你的内心，也许它就是更好的"你"。你选择与它融合。',
        hint: 'AI技能+12，幸福-8，信念+8，存款-3000',
        hintColor: 'danger',
        stateEffect: (s: GameState) => { s.happiness = clamp(s.happiness - 8, 0, 100); s.pathFaith = clamp(s.pathFaith + 8, 0, 100); },
        skillGains: { aiSkill: 12 },
        savingsChange: -3000,
        log: '你把日记本扔了。从今天起，你用AI写日记——它比你更知道你今天感受到了什么。这让你感到解脱，也让你感到消失。',
      },
      {
        id: 'phil_soul_ai_b',
        label: '关掉它，自己去写',
        description: '哪怕写得很差，至少是你写的。笨拙的真实胜过精致的替代。',
        hint: '自我觉察+10，压力+6，幸福+4',
        hintColor: 'positive',
        stateEffect: (s: GameState) => { s.stress = clamp(s.stress + 6, 0, 100); s.happiness = clamp(s.happiness + 4, 0, 100); },
        skillGains: { selfAwareness: 10 },
        log: '你写了三个小时，删了八遍，最后留下一段歪歪扭扭的话。它不好，但它是你的。你关上电脑时，觉得自己还活着。',
      },
      {
        id: 'phil_soul_ai_c',
        label: '把它当成工具，不去想',
        description: '哲学问题解决不了房贷。你选择让这个问题沉到水面以下。',
        hint: '压力+3，幸福-3，存款+2000',
        hintColor: 'negative',
        stateEffect: (s: GameState) => { s.stress = clamp(s.stress + 3, 0, 100); s.happiness = clamp(s.happiness - 3, 0, 100); },
        savingsChange: 2000,
        log: '你用AI赶完了一篇稿子，收了稿费。你没有再想那个问题。它会在某个深夜回来找你的。',
      },
    ],
  },

  {
    id: 'phil_soul_chain',
    title: '赌徒的真面目',
    narrative: '今天是暴跌的第三天，你的持仓缩水了40%。群里老张割肉退了群，小李喊"抄底"，声音在发抖。\n你盯着K线图看清了一件事：这一刻的抉择，会逼出真正的你。市场不在乎你怎么想，它只逼出你真正的样子。',
    pathId: 'chain_native',
    ageRange: [27, 38],
    priority: 10,
    oncePerGame: true,
    eventType: 'crisis',
    sceneTag: 'crisis',
    conditions: (s) => (s.chainHoldings || 0) > 0 && !s.hasAbandonedCrypto,
    options: [
      {
        id: 'phil_soul_chain_a',
        label: '加仓抄底',
        description: '贪婪是你的信仰，也是你的牢笼。但你不打算从里面出来。',
        hint: '压力+10，信念+6，加仓存款15%',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          // 加仓金额 = 存款的15%（与 investPercent 的"存款百分比"口径一致）
          const invest = Math.round(s.currentSavings * 0.15);
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          s.currentSavings = Math.max(0, s.currentSavings - invest);
          s.chainHoldings = (s.chainHoldings || 0) + invest;
        },
        log: '你把存款砸了进去。那天晚上你失眠了，但不是恐惧——是兴奋。你终于承认了：你不是在投资，你是在赌博，而赌博让你感觉活着。',
      },
      {
        id: 'phil_soul_chain_b',
        label: '全部清仓',
        description: '恐惧也是你的一部分。承认它，然后带着这个认知活下去。',
        hint: '压力-8，信念-8，存款+持仓变现',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => { s.stress = clamp(s.stress - 8, 0, 100); s.pathFaith = clamp(s.pathFaith - 8, 0, 100); s.currentSavings += s.chainHoldings || 0; s.chainHoldings = 0; },
        log: '你点了"全部卖出"。钱回到账户的那一刻，你松了一口气，也丢了一块魂。你知道自己再也回不去了——不是回不到市场，是回不到那个敢赌的自己。',
      },
      {
        id: 'phil_soul_chain_c',
        label: '什么都不做',
        description: '不买不卖，只是看着。有时候，选择不选择也是一种选择——它暴露的是你的瘫痪。',
        hint: '压力+5，自我觉察+6',
        hintColor: 'negative',
        stateEffect: (s: GameState) => { s.stress = clamp(s.stress + 5, 0, 100); },
        skillGains: { selfAwareness: 6 },
        log: '你关掉交易软件，出门走了很远。你没有买，也没有卖，但你也没有安宁。不选择并没有让你自由——它让你成了一个旁观者，旁观自己的钱在缩水。',
      },
    ],
  },

  {
    id: 'phil_soul_nomad',
    title: '行李箱里的家',
    narrative: '你又一次在打包行李，这是过去三年的第七个城市。\n房东问："你到底在找什么？"你愣了一下——你发现自己答不上来。离开时你总有一种模糊的"还不是这里"，可"这里"到底是什么，你不知道。行李箱越来越轻，你的胃却越来越沉。',
    pathId: 'digital_nomad',
    ageRange: [30, 42],
    priority: 10,
    oncePerGame: true,
    eventType: 'normal',
    options: [
      {
        id: 'phil_soul_nomad_a',
        label: '继续走，答案在路上',
        description: '你相信流动本身就是意义。停下来才是真正的迷失。',
        hint: '跨文化+10，压力+4，幸福-3，存款-2000',
        hintColor: 'danger',
        stateEffect: (s: GameState) => { s.stress = clamp(s.stress + 4, 0, 100); s.happiness = clamp(s.happiness - 3, 0, 100); },
        skillGains: { crossCulturalSkill: 10 },
        savingsChange: -2000,
        log: '你拉上拉链，出了门。火车开动的时候你看着窗外想：也许"这里"不是一个地方，而是一个方向。但方向意味着你永远到不了。',
      },
      {
        id: 'phil_soul_nomad_b',
        label: '留下来试试',
        description: '与其说你一直在找一个更好的地方，不如说你在找一个你愿意忍受其不完美的地方。',
        hint: '幸福+6，信念+4，压力-5',
        hintColor: 'positive',
        stateEffect: (s: GameState) => { s.happiness = clamp(s.happiness + 6, 0, 100); s.pathFaith = clamp(s.pathFaith + 4, 0, 100); s.stress = clamp(s.stress - 5, 0, 100); },
        log: '你把行李箱塞进了衣柜。第一晚你失眠了——原来留下比离开更让你不安。但你决定给自己一个月。也许"这里"就是你停止寻找的地方。',
      },
      {
        id: 'phil_soul_nomad_c',
        label: '回家',
        description: '你累了。你想回到出发的地方，哪怕那里什么都没变，但你变了。',
        hint: '压力-8，幸福+3，信念-5，存款-3000',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => { s.stress = clamp(s.stress - 8, 0, 100); s.happiness = clamp(s.happiness + 3, 0, 100); s.pathFaith = clamp(s.pathFaith - 5, 0, 100); },
        savingsChange: -3000,
        log: '你买了回家的票。在火车上你想起出发那天，也是这趟车，反方向。你不知道回去是不是放弃，但你知道你再也走不动了。',
      },
    ],
  },

  {
    id: 'phil_soul_ip',
    title: '镜中人',
    narrative: '你的粉丝数突破十万那天，一条评论让你停下庆祝："你以前写的东西更有意思，现在全是广告和套路，你是不是变了？"\n你想反驳，手指却停在键盘上。你翻出三年前的第一篇内容——青涩粗糙，但有一种你现在写不出来的东西。十万人在看一个已经不是你的人。',
    pathId: 'super_ip',
    ageRange: [28, 40],
    priority: 10,
    oncePerGame: true,
    eventType: 'normal',
    conditions: (s) => (s.pathSkills?.brandSkill || s.pathSkills?.audienceSkill || 0) >= 30,
    options: [
      {
        id: 'phil_soul_ip_a',
        label: '承认你变了，拥抱新人设',
        description: '旧的你已经死了。新的人设更受欢迎——叫它背叛还是进化无所谓，反正市场买账。',
        hint: '品牌价值+8，幸福-6，自我觉察+5',
        hintColor: 'danger',
        stateEffect: (s: GameState) => { s.happiness = clamp(s.happiness - 6, 0, 100); },
        skillGains: { brandSkill: 8, selfAwareness: 5 },
        log: '你删掉了那条评论。第二天你发了一条精心设计的"真诚告白"，转发破千。你终于学会了：表演真诚比真诚本身更有市场。',
      },
      {
        id: 'phil_soul_ip_b',
        label: '回到原点，重新写',
        description: '哪怕掉粉，也要找回那个粗糙但真实的自己。你不想成为自己的人设。',
        hint: '品牌价值-5，幸福+8，信念+6，存款-4000',
        hintColor: 'positive',
        stateEffect: (s: GameState) => { s.happiness = clamp(s.happiness + 8, 0, 100); s.pathFaith = clamp(s.pathFaith + 6, 0, 100); },
        savingsChange: -4000,
        skillGains: { brandSkill: -5 },
        log: '你写了一篇没有任何技巧的东西，像三年前一样。掉了三百粉，但你睡了一个好觉。梦里没有数据面板。',
      },
      {
        id: 'phil_soul_ip_c',
        label: '两条腿走路',
        description: '用新人设赚钱，用小号写真话。你相信你可以同时是两个人。',
        hint: '存款+5000，压力+8，自我觉察+3',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => { s.stress = clamp(s.stress + 8, 0, 100); },
        savingsChange: 5000,
        skillGains: { selfAwareness: 3 },
        log: '你注册了一个匿名小号，凌晨三点写真话，白天用大号接广告。你在两个身份之间切换，渐渐分不清哪个是面具，哪个是脸。',
      },
    ],
  },

  {
    id: 'phil_soul_silver',
    title: '谁照顾照顾者',
    narrative: '王奶奶今早走了。你照顾了她两年三个月。\n她的女儿从国外打来电话，说"谢谢你"，然后问押金什么时候退。你坐在空了的房间里，闻着残留的膏药味。你做到了"让老人有尊严地老去"——但谁来让你有尊严地老去？你才三十多岁，腰椎已经不行了。',
    pathId: 'silver_economy',
    ageRange: [32, 45],
    priority: 10,
    oncePerGame: true,
    eventType: 'normal',
    options: [
      {
        id: 'phil_soul_silver_a',
        label: '把悲伤变成制度',
        description: '一个人的离去不应该只留下空房间。你要建立一套临终关怀流程。',
        hint: '护理+10，管理+5，压力+6，存款-5000',
        hintColor: 'positive',
        stateEffect: (s: GameState) => { s.stress = clamp(s.stress + 6, 0, 100); },
        skillGains: { careSkill: 10, managementSkill: 5 },
        savingsChange: -5000,
        log: '你写了一份二十页的《临终关怀标准流程》。同事们说你小题大做，但你知道：王奶奶用不上这份流程了。它是写给下一个你照顾的人——也是写给你自己的。',
      },
      {
        id: 'phil_soul_silver_b',
        label: '辞职，你撑不住了',
        description: '你以为你可以燃烧自己照亮别人，但你发现自己也在暗处。',
        hint: '压力-10，幸福+3，信念-10，存款-2000',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => { s.stress = clamp(s.stress - 10, 0, 100); s.happiness = clamp(s.happiness + 3, 0, 100); s.pathFaith = clamp(s.pathFaith - 10, 0, 100); },
        savingsChange: -2000,
        log: '你写了辞职信，但在最后一刻撕了。说不上是不舍，只是除了这个，你想不出自己还能做什么。你留下来，但有什么东西在你心里递交了辞呈。',
      },
      {
        id: 'phil_soul_silver_c',
        label: '去体检，先照顾自己',
        description: '你总是告诉别人"身体最重要"，但你自己从没信过这句话。今天你决定信一次。',
        hint: '健康+10，压力-4，存款-3000',
        hintColor: 'positive',
        stateEffect: (s: GameState) => { s.health = clamp(s.health + 10, 0, 100); s.stress = clamp(s.stress - 4, 0, 100); },
        savingsChange: -3000,
        log: '体检报告显示你的腰椎已经退化到五十岁的水平。医生问你是做什么的，你说"照顾老人"。医生沉默了一下，说"也该有人照顾你了"。',
      },
    ],
  },

  {
    id: 'phil_soul_bio',
    title: '永生的代价',
    narrative: '实验室的老周把一份报告拍在你面前：基因疗法三期数据出来了，寿命延长指标显著。\n但老周没说的数字是：延长的不是"健康寿命"，只是"寿命"。多出来的十年，可能是躺在床上清醒地感受自己腐朽的十年。老周问你投不投下一轮——你怕的到底是死，还是活着？',
    pathId: 'bio_gambler',
    ageRange: [33, 45],
    priority: 10,
    oncePerGame: true,
    eventType: 'normal',
    options: [
      {
        id: 'phil_soul_bio_a',
        label: '追加投资，不管怎样先活下去',
        description: '活着就有希望。技术会进步的，也许十年后的技术能解决这十年的质量。',
        hint: '信念+8，压力+5，存款-20000，生科组合+20000',
        hintColor: 'danger',
        stateEffect: (s: GameState) => { s.stress = clamp(s.stress + 5, 0, 100); s.pathFaith = clamp(s.pathFaith + 8, 0, 100); s.currentSavings -= 20000; s.bioPortfolio = (s.bioPortfolio || 0) + 20000; },
        log: '你签了字。那天晚上你做了一个梦：你活到了一百二十岁，但最后一十年你被困在一具不能动的身体里，清醒地等待终点。你在梦里喊"让我死"，但没有人听得见。',
      },
      {
        id: 'phil_soul_bio_b',
        label: '撤资，你不买这种"活着"',
        description: '如果多出来的十年不是生活而是惩罚，你不要。你选择接受生命的有限。',
        hint: '自我觉察+10，信念-5，存款+15000，生科组合-15000',
        hintColor: 'positive',
        stateEffect: (s: GameState) => { s.pathFaith = clamp(s.pathFaith - 5, 0, 100); s.currentSavings += 15000; s.bioPortfolio = Math.max(0, (s.bioPortfolio || 0) - 15000); },
        skillGains: { selfAwareness: 10 },
        log: '你撤了资。老周说你"不理性"。也许吧。但你第一次觉得，接受死亡比对抗死亡更需要勇气。',
      },
      {
        id: 'phil_soul_bio_c',
        label: '投，但要求增加生活质量指标',
        description: '你试图在恐惧和理性之间找到第三条路。但这真的可能吗？',
        hint: '投资分析+8，压力+4，存款-10000，生科组合+10000',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => { s.stress = clamp(s.stress + 4, 0, 100); s.currentSavings -= 10000; s.bioPortfolio = (s.bioPortfolio || 0) + 10000; },
        skillGains: { investmentSkill: 8 },
        log: '你提了一堆条件，老周答应了大部分。你告诉自己这是理性决策，但你知道驱动力还是恐惧——只是包装得更好看了。',
      },
    ],
  },

  // ============================================================
  // 策略2：把时间性做成叙事主体
  // 年龄里程碑+时间回响——让玩家感受到时间的重量
  // ============================================================

  {
    id: 'phil_time_30',
    title: '三十',
    narrative: '生日蛋糕上的蜡烛数量突然变得刺眼了。\n刚毕业那年盯着招聘网站刷到凌晨三点时，你以为{age}岁应该已经"成了"——有房有车有方向。现在你站在这个数字面前，发现"成了"是一个永远在退后的终点线。手机弹出推送："{age}岁，你的人生进度条已过半。"谁在帮我倒计时？',
    pathId: 'ai_symbiote',
    crossPath: true,
    ageRange: [30, 30],
    priority: 10,
    oncePerGame: true,
    eventType: 'milestone',
    options: [
      {
        id: 'phil_time_30_a',
        label: '给自己定一个五年计划',
        description: '用计划对抗焦虑。你知道这可能是另一种逃避，但逃避也需要方向。',
        hint: '信念+5，压力+5，自我觉察+3',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => { s.stress = clamp(s.stress + 5, 0, 100); s.pathFaith = clamp(s.pathFaith + 5, 0, 100); },
        skillGains: { selfAwareness: 3 },
        log: '你写了一份五年计划，贴在墙上。第一行是"{age}岁前实现财务自由"。你看着这行字，苦笑了一下——墙上那个曾经写着"{age}岁年薪百万"的便签痕迹还没完全撕掉。',
      },
      {
        id: 'phil_time_30_b',
        label: '把蜡烛吹了，什么都不想',
        description: '不是每个数字都需要意义。有些数字只是数字。',
        hint: '压力-6，幸福+3',
        hintColor: 'positive',
        stateEffect: (s: GameState) => { s.stress = clamp(s.stress - 6, 0, 100); s.happiness = clamp(s.happiness + 3, 0, 100); },
        log: '你一口气吹灭了蜡烛。朋友问许了什么愿，你说"没有"。这一回你没有许愿——你忽然看明白：许愿本身就是一种焦虑。',
      },
      {
        id: 'phil_time_30_c',
        label: '翻出{startAge}岁的日记',
        description: '你想看看{years}年前那个自己，想问问他：你对现在的我满意吗？',
        hint: '自我觉察+8，幸福-3，压力+3',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => { s.happiness = clamp(s.happiness - 3, 0, 100); s.stress = clamp(s.stress + 3, 0, 100); },
        skillGains: { selfAwareness: 8 },
        log: '你翻到了那本日记。{startAge}岁的你写道："三十岁之前一定要环游世界。"你没有环游世界。你合上日记，发现最刺耳的不是没实现的梦想，而是那个做梦的人已经不认识你了。',
      },
    ],
  },

  {
    id: 'phil_time_40',
    title: '时间的灰',
    narrative: '都说四十不惑，可惑不会因为多过了五年就自动消失。你今年四十五，惑得和四十岁那年一样厉害。\n你开始注意到以前不会注意的事：楼下煎饼摊大叔头发全白了，最后一次见大学室友已是十年前，你妈打电话时开始重复同一件事说两遍。时间不是在你身上流过——它在你身上沉积，像一层层看不见的灰尘。',
    pathId: 'ai_symbiote',
    crossPath: true,
    ageRange: [45, 45],
    priority: 7,
    oncePerGame: true,
    eventType: 'milestone',
    options: [
      {
        id: 'phil_time_40_a',
        label: '给所有久未联系的人发消息',
        description: '你突然怕了——怕有些人再不见就再也见不到了。',
        hint: '共情+8，幸福+5，压力+4',
        hintColor: 'positive',
        stateEffect: (s: GameState) => { s.happiness = clamp(s.happiness + 5, 0, 100); s.stress = clamp(s.stress + 4, 0, 100); },
        skillGains: { empathy: 8 },
        log: '你发了二十条消息，收到七条回复。有人热情，有人冷淡，有人说"好久不见"然后就没下文了。你发现时间不只是灰尘——它还是一堵墙，慢慢长在你和别人之间。',
      },
      {
        id: 'phil_time_40_b',
        label: '什么都不做，接受流逝',
        description: '人来了又走了。你不想追，也不想留。你选择让时间过去。',
        hint: '压力-5，幸福-3，自我觉察+5',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => { s.stress = clamp(s.stress - 5, 0, 100); s.happiness = clamp(s.happiness - 3, 0, 100); },
        skillGains: { selfAwareness: 5 },
        log: '你坐在窗边看了一个小时的夕阳。什么也没想，什么也没做。太阳落下去的时候你觉得它带走了什么，但你说不清是什么。',
      },
      {
        id: 'phil_time_40_c',
        label: '去做体检',
        description: '四十五了，身体的保修期到了。你该认真面对这具肉身了。',
        hint: '健康+8，存款-2000',
        hintColor: 'positive',
        stateEffect: (s: GameState) => { s.health = clamp(s.health + 8, 0, 100); },
        savingsChange: -2000,
        log: '体检报告上有三个箭头。医生说"你这个年纪正常"。你问"什么叫正常"，医生说"就是开始坏了"。你在走廊里站了很久，"正常"这个词从未显得如此恐怖。',
      },
    ],
  },

  {
    id: 'phil_time_echo',
    title: '旧信',
    narrative: '搬家时从箱底翻出一封写着"{age}岁打开"的信——你{startAge}岁写给未来自己的。你早就过了三十，迟了好几年。\n你拆开信，第一行是："你还在做自己想做的事吗？"真正让你难受的不是答案——而是你已经忘了{startAge}岁时"想做的事"是什么。',
    pathId: 'ai_symbiote',
    crossPath: true,
    ageRange: [33, 45],
    priority: 10,
    oncePerGame: true,
    eventType: 'normal',
    options: [
      {
        id: 'phil_time_echo_a',
        label: '写一封回信',
        description: '给{startAge}岁的自己回一封信。告诉他你成了什么，没成什么，以及为什么。',
        hint: '自我觉察+12，幸福-4，压力+3',
        hintColor: 'positive',
        stateEffect: (s: GameState) => { s.happiness = clamp(s.happiness - 4, 0, 100); s.stress = clamp(s.stress + 3, 0, 100); },
        skillGains: { selfAwareness: 12 },
        log: '你写了四页纸。写到第三页时你停下来哭了——你以为是悲伤，其实更像一种奇怪的感动。{startAge}岁的你那么天真，那么确定。你突然嫉妒他。',
      },
      {
        id: 'phil_time_echo_b',
        label: '把信烧了',
        description: '过去不需要回应。你不想被{startAge}岁的自己审判。',
        hint: '压力-3，自我觉察-3，信念+3',
        hintColor: 'negative',
        stateEffect: (s: GameState) => { s.stress = clamp(s.stress - 3, 0, 100); s.pathFaith = clamp(s.pathFaith + 3, 0, 100); },
        log: '火苗吞掉了信纸。你看着它卷曲、变黑、碎成灰。你告诉自己这是一种仪式——告别过去。但你知道你只是在销毁证据。',
      },
      {
        id: 'phil_time_echo_c',
        label: '再写一封，给50岁的自己',
        description: '如果你活到五十岁，你想问未来的自己什么？',
        hint: '自我觉察+8，信念+5',
        hintColor: 'positive',
        stateEffect: (s: GameState) => { s.pathFaith = clamp(s.pathFaith + 5, 0, 100); },
        skillGains: { selfAwareness: 8 },
        log: '你写了一封新的信："{age}岁的我，你还敢做梦吗？"你封好信，放回箱底。你不知道五十岁的你会不会打开它——你甚至不知道五十岁的你还存不存在。',
      },
    ],
  },

  {
    id: 'phil_time_50',
    title: '知天命',
    narrative: '孔子说五十知天命。今年你五十，确实知道了一些以前不知道的事。\n你知道了父母会突然变老，不是慢慢变老，是某一天打电话回去，你妈的声音变了，你爸开始重复同一句话。你知道了身体会开始记账——二十岁熬的夜、三十岁省的餐、四十岁憋的气，到了五十岁一起寄来账单。\n但你也知道了：你比年轻时更不怕死了。该在意的东西变少了，有些东西就算没拿到，也无所谓。',
    pathId: 'ai_symbiote',
    crossPath: true,
    ageRange: [50, 50],
    priority: 7,
    oncePerGame: true,
    eventType: 'milestone',
    options: [
      {
        id: 'phil_time_50_a',
        label: '给爸妈打个电话',
        description: '不为任何事，就是想听听他们的声音。',
        hint: '幸福+5 · 压力-4 · 自我觉察+5',
        hintColor: 'positive',
        stateEffect: (s: GameState) => { s.happiness = clamp(s.happiness + 5, 0, 100); s.stress = clamp(s.stress - 4, 0, 100); },
        skillGains: { selfAwareness: 5 },
        log: '电话响了三声你妈才接。她说"你怎么这个时候打来"，语气里有点慌。你说"没事，就是想打个电话"。她沉默了一下，然后开始说今天菜市场的白菜降价了。你听着，没有插嘴。窗外的天暗了，你没开灯。',
      },
      {
        id: 'phil_time_50_b',
        label: '去体检，把欠的账还了',
        description: '二十年的透支，是时候查一查余额了。',
        hint: '健康+8 · 压力+3 · 存款-3000',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => { s.health = clamp(s.health + 8, 0, 100); s.stress = clamp(s.stress + 3, 0, 100); },
        savingsChange: -3000,
        log: '体检报告很长。医生用红笔圈了三个地方，说"都不严重，但你要开始管了"。你看着那三个红圈，想起二十岁时体检报告上连一个标点符号都没有。你把报告折好，放进抽屉，和保险单放在一起。',
      },
      {
        id: 'phil_time_50_c',
        label: '什么都不做，就坐着',
        description: '五十岁了，你有资格在一个下午什么都不做。',
        hint: '压力-8 · 幸福+3 · 信念+3',
        hintColor: 'positive',
        stateEffect: (s: GameState) => { s.stress = clamp(s.stress - 8, 0, 100); s.happiness = clamp(s.happiness + 3, 0, 100); s.pathFaith = clamp(s.pathFaith + 3, 0, 100); },
        log: '你在阳台上坐了一整个下午。没有手机，没有书，没有计划。阳光从左边移到右边，楼下有个孩子在练钢琴，弹错了三遍同一个音。你听着那三遍错误，觉得它们比正确的版本更好听。',
      },
    ],
  },

  {
    id: 'phil_irony_ai',
    title: '替代者',
    narrative: '你开发的AI助手月活突破百万。投资人竖起大拇指说"你改变了人与技术的关系"。\n但今天你的伴侣坦白：TA更愿意跟你的AI聊天，而不是跟你。"它比你更耐心，更懂我，而且它不会累。"\n你花五年教会机器理解人类情感，结果它先替代了你的情感。你创造了更好的"你"，然后被它淘汰了。',
    pathId: 'ai_symbiote',
    ageRange: [35, 48],
    priority: 7,
    oncePerGame: true,
    eventType: 'crisis',
    sceneTag: 'crisis',
    options: [
      {
        id: 'phil_irony_ai_a',
        label: '承认你输了',
        description: '如果AI比你更懂陪伴，也许它应该代替你。你选择退出。',
        hint: '幸福-12，信念-8，存款+10000',
        hintColor: 'danger',
        stateEffect: (s: GameState) => { s.happiness = clamp(s.happiness - 12, 0, 100); s.pathFaith = clamp(s.pathFaith - 8, 0, 100); },
        savingsChange: 10000,
        log: '你搬了出去。AI留在了那间房子里，继续陪伴着你的伴侣。你走在街上，第一次理解了"被自己创造的东西取代"是什么感觉——骄傲和毁灭同时涌上来。',
        blindBoxTrigger: 'ai_partner_talk',
      },
      {
        id: 'phil_irony_ai_b',
        label: '关掉AI，争回你的位置',
        description: '你不是AI。你笨拙、会累、会犯错——但你是真的。你要用"不完美"赢回来。',
        hint: '压力+10，幸福+5，信念+8，存款-5000',
        hintColor: 'positive',
        stateEffect: (s: GameState) => { s.stress = clamp(s.stress + 10, 0, 100); s.happiness = clamp(s.happiness + 5, 0, 100); s.pathFaith = clamp(s.pathFaith + 8, 0, 100); },
        savingsChange: -5000,
        log: '你关掉了那台服务器。伴侣问你为什么，你说"因为我想亲自听你说话"。那晚你们聊到凌晨三点，你说错了很多话，但你们都笑了——AI不会笑错。',
        blindBoxTrigger: 'ai_partner_talk',
      },
      {
        id: 'phil_irony_ai_c',
        label: '升级AI，让它更像你',
        description: '如果你输了，至少让赢的东西是你最好的版本。',
        hint: 'AI技能+10，幸福-6，自我觉察+5',
        hintColor: 'danger',
        stateEffect: (s: GameState) => { s.happiness = clamp(s.happiness - 6, 0, 100); },
        skillGains: { aiSkill: 10, selfAwareness: 5 },
        log: '你用了三个月训练了一个新模型——这次你把"不完美"也喂了进去：你的犹豫、你的口误、你凌晨三点的脆弱。AI变得更像你了。你不知道这是胜利还是最终的投降。',
        blindBoxTrigger: 'ai_partner_talk',
      },
    ],
  },

  {
    id: 'phil_irony_nomad',
    title: '自由的牢笼',
    narrative: '你终于实现了"在任何地方工作"的自由。但你发现：能在任何地方工作，意味着你在每个地方都在工作。\n朋友说"你好自由"，但他们不知道你上个月在洱海边开了七次会，在雪山脚下回了三百封邮件。你拥有了一切城市，但没有一座城市拥有你。',
    pathId: 'digital_nomad',
    ageRange: [33, 45],
    priority: 7,
    oncePerGame: true,
    eventType: 'normal',
    options: [
      {
        id: 'phil_irony_nomad_a',
        label: '接受这就是自由的代价',
        description: '自由不是免费午餐。你选择继续，因为你害怕停下来。',
        hint: '压力+8，信念+3，幸福-5',
        hintColor: 'danger',
        stateEffect: (s: GameState) => { s.stress = clamp(s.stress + 8, 0, 100); s.pathFaith = clamp(s.pathFaith + 3, 0, 100); s.happiness = clamp(s.happiness - 5, 0, 100); },
        log: '你又订了一张机票。在飞机上你打开电脑开始工作，窗外是云海，但你没有看。自由变成了惯性，惯性变成了牢笼——但这个牢笼没有门，所以你以为自己是自由的。',
      },
      {
        id: 'phil_irony_nomad_b',
        label: '选一个地方，真正停下来',
        description: '自由不是拥有所有选项，而是有勇气放弃大部分选项。',
        hint: '幸福+8，压力-6，信念+5，存款-3000',
        hintColor: 'positive',
        stateEffect: (s: GameState) => { s.happiness = clamp(s.happiness + 8, 0, 100); s.stress = clamp(s.stress - 6, 0, 100); s.pathFaith = clamp(s.pathFaith + 5, 0, 100); },
        savingsChange: -3000,
        log: '你退掉了机票。你在洱海边租了一年的房子，决定不走了。第一个星期你焦虑得睡不着——不移动让你恐慌。但第二个星期，你开始认识邻居了。这是三年来第一次。',
      },
      {
        id: 'phil_irony_nomad_c',
        label: '减少工作，但继续流动',
        description: '你试图在自由和生计之间找到平衡。但平衡是最难的位置。',
        hint: '跨文化+6，压力+4，存款-5000',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => { s.stress = clamp(s.stress + 4, 0, 100); },
        savingsChange: -5000,
        skillGains: { crossCulturalSkill: 6 },
        log: '你把工作量砍了一半，收入也砍了一半。你在每个城市待一个月，前两周工作，后两周发呆。你以为这就是平衡，但发呆的时候你还是在想工作——因为你不知道不发呆的时候该想什么。',
      },
    ],
  },

  {
    id: 'phil_irony_silver',
    title: '无人照顾',
    narrative: '你的养老社区终于盈利了，账面上数字很好看。\n但今天体检发现甲状腺结节，医生说"需要进一步检查"。你拿着报告走出医院，想找个人说说，翻了翻通讯录——里面全是客户、员工、供应商。你花了十年照顾别人的晚年，却忘了给自己存一个可以打电话的人。',
    pathId: 'silver_economy',
    ageRange: [38, 50],
    priority: 7,
    oncePerGame: true,
    eventType: 'normal',
    options: [
      {
        id: 'phil_irony_silver_a',
        label: '把检查做了，一个人扛',
        description: '你习惯了一个人解决问题。这是你的强项，也是你的诅咒。',
        hint: '健康+6，压力+8，幸福-5',
        hintColor: 'negative',
        stateEffect: (s: GameState) => { s.health = clamp(s.health + 6, 0, 100); s.stress = clamp(s.stress + 8, 0, 100); s.happiness = clamp(s.happiness - 5, 0, 100); },
        log: '检查结果出来了：良性。你松了一口气，然后把报告塞进抽屉。你没有告诉任何人。你意识到你把自己活成了你的客户——一个需要照顾但拒绝被照顾的老人，只是提前了三十年。',
      },
      {
        id: 'phil_irony_silver_b',
        label: '打电话给一个老朋友',
        description: '你害怕打电话，但你更害怕有一天连可以害怕的人都没有了。',
        hint: '护理+8，幸福+6，压力-4',
        hintColor: 'positive',
        stateEffect: (s: GameState) => { s.happiness = clamp(s.happiness + 6, 0, 100); s.stress = clamp(s.stress - 4, 0, 100); },
        skillGains: { careSkill: 8 },
        log: '你拨了一个五年没拨的号码。对方接起来时愣了两秒，然后说"你怎么想起我了"。你说"检查身体，有点害怕"。对面沉默了一下，说"我陪你去"。你挂掉电话时发现自己哭了——害怕早就过去了，剩下的，是"还有人在"这件事本身的分量。',
      },
      {
        id: 'phil_irony_silver_c',
        label: '给社区加一条"员工关怀"制度',
        description: '你照顾了所有人，唯独忘了照顾自己和你的人。从制度开始改变。',
        hint: '管理+10，压力+5，存款-8000',
        hintColor: 'positive',
        stateEffect: (s: GameState) => { s.stress = clamp(s.stress + 5, 0, 100); },
        savingsChange: -8000,
        skillGains: { managementSkill: 10 },
        log: '你写了一份《员工关怀计划》：带薪体检、心理咨询假、紧急联系人制度。你把"照顾者也需要被照顾"写进了公司章程。但你自己那份体检报告，你还是没有打开看第二遍。',
      },
    ],
  },

  {
    id: 'phil_irony_chain',
    title: '去中心化的孤独',
    narrative: '你的链上资产让你实现了"不用依赖任何人"的财务自由——没有银行，没有雇主，没有中间人。\n但今天你发烧39度，独自躺在出租屋。想叫外卖没人送，想找人陪你看病，翻了200个联系人——一半是交易群ID，一半是半年没说过话的名字。你确实不依赖任何人了，但也没有任何人依赖你。',
    pathId: 'chain_native',
    ageRange: [33, 48],
    priority: 7,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    options: [
      {
        id: 'phil_irony_chain_a',
        label: '接受这就是自由的代价',
        description: '不依赖任何人，也意味着没人有义务在你身边。你选择继续独行。',
        hint: '信念+5，幸福-8，压力+6，交易能力+5',
        hintColor: 'danger',
        stateEffect: (s: GameState) => { s.pathFaith = clamp(s.pathFaith + 5, 0, 100); s.happiness = clamp(s.happiness - 8, 0, 100); s.stress = clamp(s.stress + 6, 0, 100); },
        skillGains: { insight: 5 },
        log: '你硬撑着去医院，自己挂号，自己排队，自己取药。回来后你盯着钱包里的余额想：这笔钱够你活十年，但如果这十年都是这样过的，"够活"到底是什么意思？',
      },
      {
        id: 'phil_irony_chain_b',
        label: '主动去依赖一个人',
        description: '你给一个半年没联系的朋友发了消息："我病了，能来看看我吗？"这是你五年来第一次示弱。',
        hint: '社区影响力+8，幸福+6，压力-4，存款-500',
        hintColor: 'positive',
        stateEffect: (s: GameState) => { s.happiness = clamp(s.happiness + 6, 0, 100); s.stress = clamp(s.stress - 4, 0, 100); },
        savingsChange: -500,
        skillGains: { communityInfluence: 8 },
        log: '他来了，带了粥和药。你看着他笨手笨脚地给你倒水，突然想起一个你一直不愿承认的事实：去中心化让金钱自由了，但人不是金钱，人需要中心。',
      },
      {
        id: 'phil_irony_chain_c',
        label: '把资产分一部分给社区',
        description: '你用链上资产设立了一个DAO互助基金。如果自由意味着孤立，那你想用自由换来一些连接。',
        hint: '社区影响力+8，信念+3，存款-15000，幸福+3',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => { s.pathFaith = clamp(s.pathFaith + 3, 0, 100); s.happiness = clamp(s.happiness + 3, 0, 100); },
        savingsChange: -15000,
        skillGains: { communityInfluence: 8 },
        log: '你发起了"链上互助DAO"，规则简单：成员生病时可以申请援助。三个月后有17人加入。你发现当你愿意把自由分出去一部分，你反而觉得不那么孤独了——虽然你还没想明白为什么。',
      },
    ],
  },

  {
    id: 'phil_irony_ip',
    title: '比你更像你',
    narrative: '你的个人IP做成了，全网200万人认识"你"——那个永远积极、永远有答案、永远在成长的人设。\n但今天一个粉丝说："你是我的精神导师，你改变了我的人生。"你低头看了看自己：三天没洗的头，外卖盒堆了半张桌子，信用卡账单还没还。你花三年打造的"更好的自己"给200万人看，但那个自己不是你。',
    pathId: 'super_ip',
    ageRange: [30, 45],
    priority: 7,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    options: [
      {
        id: 'phil_irony_ip_a',
        label: '继续维护人设',
        description: '人设比真人更有价值。200万人需要的是那个"你"，不是真实的你。',
        hint: '压力+8，幸福-6，存款+8000，自我觉察+3',
        hintColor: 'danger',
        stateEffect: (s: GameState) => { s.stress = clamp(s.stress + 8, 0, 100); s.happiness = clamp(s.happiness - 6, 0, 100); },
        savingsChange: 8000,
        skillGains: { selfAwareness: 3 },
        log: '你洗了头，打开补光灯，对着镜头微笑："今天想跟大家分享——如何保持内心的秩序。"说这句话的时候，你的外卖盒就在脚边，镜头拍不到。你发现"表演积极"比"真正积极"更累，但也更有回报。',
      },
      {
        id: 'phil_irony_ip_b',
        label: '发一条真实的动态',
        description: '告诉200万人你也会崩溃，也会懒惰，也会还不上信用卡。让他们认识真正的你。',
        hint: '幸福+5，压力+5，信念+6，存款-3000',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => { s.happiness = clamp(s.happiness + 5, 0, 100); s.stress = clamp(s.stress + 5, 0, 100); s.pathFaith = clamp(s.pathFaith + 6, 0, 100); },
        savingsChange: -3000,
        log: '你发了一条："今天什么都没做，外卖盒堆了半张桌子。"掉了2000粉，但评论区有人说："终于看到真实的你了。"你不确定这是勇敢还是自毁——但至少那条动态里没有一句是表演。',
      },
      {
        id: 'phil_irony_ip_c',
        label: '减少曝光，用剩余时间修复真实生活',
        description: '人设可以继续，但不能是全部。你要把时间分给那个镜头外的自己。',
        hint: '受众运营+6，幸福+3，压力-3，存款-5000',
        hintColor: 'positive',
        stateEffect: (s: GameState) => { s.happiness = clamp(s.happiness + 3, 0, 100); s.stress = clamp(s.stress - 3, 0, 100); },
        savingsChange: -5000,
        skillGains: { audienceSkill: 6 },
        log: '你把更新频率从每天降到每周。多出来的时间你用来还信用卡、打扫房间、给妈妈打电话。粉丝增长慢了，但你照镜子的时候，觉得镜子里的那个人和人设之间的裂缝小了一点。',
      },
    ],
  },

  {
    id: 'phil_irony_bio',
    title: '延长的等待',
    narrative: '你的生科组合涨了40%。分析师说，那款抗衰药离上市只差一步，人类的健康寿命可能延长15年。\n但你算了一笔账：你把这十年最好的年华用来赌"未来的时间"，而赌注本身就是"现在的时间"。你每天盯盘、读论文、跑数据，用真实不可逆的现在，去赌一个可能延后的未来。',
    pathId: 'bio_gambler',
    ageRange: [38, 50],
    priority: 7,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    options: [
      {
        id: 'phil_irony_bio_a',
        label: '继续All in未来',
        description: '15年的健康寿命值得你现在的一切牺牲。你选择继续赌。',
        hint: '信念+8，幸福-7，压力+6，投资分析+4',
        hintColor: 'danger',
        stateEffect: (s: GameState) => { s.pathFaith = clamp(s.pathFaith + 8, 0, 100); s.happiness = clamp(s.happiness - 7, 0, 100); s.stress = clamp(s.stress + 6, 0, 100); },
        skillGains: { investmentSkill: 4 },
        log: '你又加仓了。你跟自己说：十年换十五年，净赚五年。但你不敢算另一笔账——如果这十年你好好生活，即使少活五年，那十年的质量是否抵得上多出来的五年？这个问题你不敢想，因为答案可能是"是"。',
      },
      {
        id: 'phil_irony_bio_b',
        label: '立刻减少仓位，开始"活在当下"',
        description: '不赌了。把赌注撤回来，用在当下。也许你会少活几年，但那几年是活过的。',
        hint: '幸福+8，压力-5，信念-4，存款+10000',
        hintColor: 'positive',
        stateEffect: (s: GameState) => { s.happiness = clamp(s.happiness + 8, 0, 100); s.stress = clamp(s.stress - 5, 0, 100); s.pathFaith = clamp(s.pathFaith - 4, 0, 100); },
        savingsChange: 10000,
        log: '你减了半仓。多出来的精力你用来开始跑步，周末去爬山，晚上不看盘而是看星星。你发现一件恐怖的事：你已经三年没看过星星了。而星星一直都在。',
      },
      {
        id: 'phil_irony_bio_c',
        label: '做一个对冲——一半赌未来，一半活在当下',
        description: '不全赌也不全撤。但你知道对冲意味着两边都不极致。',
        hint: '投资分析+7，幸福+2，压力+2，存款-3000',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => { s.happiness = clamp(s.happiness + 2, 0, 100); s.stress = clamp(s.stress + 2, 0, 100); },
        savingsChange: -3000,
        skillGains: { investmentSkill: 7 },
        log: '你把仓位砍到一半，多出来的时间一半盯盘一半生活。你发现自己变成了两个人：白天在阳光下跑步，深夜在屏幕前盯K线。你不确定这是智慧还是贪婪的另一种伪装——但至少你既看到了星星，也看到了数据。',
      },
    ],
  },

  // ============================================================
  // 策略4：留白与未解
  // 开放式事件——不给答案，只给问题
  // ============================================================

  {
    id: 'phil_void_stranger',
    title: '深夜便利店',
    narrative: '凌晨三点，你在便利店买泡面。收银员是个五十多岁的女人，她扫完码突然说："你看起来像是在跑的人。"\n你愣住了。她没有解释，继续擦柜台。重要的是——她是对的吗？你在跑吗？从什么？向哪里？泡面的热气模糊了你的眼镜。你没有问她。',
    pathId: 'ai_symbiote',
    crossPath: true,
    ageRange: [28, 50],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    options: [
      {
        id: 'phil_void_stranger_a',
        label: '回头去问她',
        description: '也许她知道一些你不知道的答案。也许她只是一个擦柜台的收银员。但你想知道。',
        hint: '自我觉察+10，幸福-3',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => { s.happiness = clamp(s.happiness - 3, 0, 100); },
        skillGains: { selfAwareness: 10 },
        log: '你回去了，但她已经换了班。新的收银员是个年轻男孩，问你要不要袋子。你买了袋子，走出门。你没有得到答案——也许有些问题就是用来挂在那里的，像便利店的灯，整夜亮着，等你哪天准备好去看。',
      },
      {
        id: 'phil_void_stranger_b',
        label: '不回头，吃完泡面',
        description: '有些话听到了就够了，不需要追。你选择让这句话留在凌晨三点。',
        hint: '压力-3，自我觉察+5',
        hintColor: 'positive',
        stateEffect: (s: GameState) => { s.stress = clamp(s.stress - 3, 0, 100); },
        skillGains: { selfAwareness: 5 },
        log: '你坐在路牙子上吃泡面，汤很烫。你没有想那个女人的话。或者说，你在想，但你想的方式是"不想"。泡面吃完，天快亮了。你站起来走了，不知道是回家还是去哪里。',
      },
      {
        id: 'phil_void_stranger_c',
        label: '以后每周都来这个便利店',
        description: '你不知道为什么。也许你想再遇见她。也许你只是需要一个凌晨三点可以去的地方。',
        hint: '幸福+3，压力+2，存款-500',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => { s.happiness = clamp(s.happiness + 3, 0, 100); s.stress = clamp(s.stress + 2, 0, 100); },
        savingsChange: -500,
        log: '你后来确实每周都来。有时她值班，有时不在。你们从没再聊过那句话。她每次只说"欢迎光临"。你开始怀疑那晚是不是幻觉——但幻觉不会让你每周凌晨三点出现在便利店。',
      },
    ],
  },

  {
    id: 'phil_void_question',
    title: '孩子的问题',
    narrative: '你的孩子（或朋友的孩子）今年五岁。TA蹲在路边看蚂蚁搬家，看了很久，然后抬起头问："人活着是为什么？"\n你张了张嘴，没有任何可以说出口的答案。"为了快乐"？你最近不怎么快乐。"为了成功"？你不确定什么算成功。孩子等着你回答。蚂蚁继续搬家。',
    pathId: 'ai_symbiote',
    crossPath: true,
    ageRange: [30, 50],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    conditions: (s) => s.hasChild || s.happiness > 40,
    options: [
      {
        id: 'phil_void_question_a',
        label: '"为了爱。"',
        description: '你不确定这是不是真的，但你想给孩子一个温暖的答案。',
        hint: '共情+8，幸福+5，自我觉察+3',
        hintColor: 'positive',
        stateEffect: (s: GameState) => { s.happiness = clamp(s.happiness + 5, 0, 100); },
        skillGains: { empathy: 8, selfAwareness: 3 },
        log: '孩子说"哦"，然后继续看蚂蚁。你松了一口气，又有点失落——你以为你的回答会改变什么，但蚂蚁比你的哲学更有吸引力。也许这就是答案：活着就是看蚂蚁，直到你不看了。',
      },
      {
        id: 'phil_void_question_b',
        label: '"我也不知道。"',
        description: '你选择诚实。也许诚实的力量比答案更大。',
        hint: '自我觉察+12，信念-3',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => { s.pathFaith = clamp(s.pathFaith - 3, 0, 100); },
        skillGains: { selfAwareness: 12 },
        log: '孩子想了想，说"那我们一起想吧"。你们蹲在路边想了很久，蚂蚁搬完了家。最后孩子说"我知道了，活着就是搬东西"。你没有反驳。也许五岁的孩子比你知道得更多。',
      },
      {
        id: 'phil_void_question_c',
        label: '"长大了就知道了。"',
        description: '你给了那个你小时候也听过的答案。你知道这是谎言，但你不知道更好的。',
        hint: '自我觉察-3，压力+3',
        hintColor: 'negative',
        stateEffect: (s: GameState) => { s.stress = clamp(s.stress + 3, 0, 100); },
        log: '孩子说"你长大了吗"。你沉默了。那天晚上你失眠了——让你睡不着的，是你发现自己随口说出了那个曾经最讨厌的答案。你成了你曾经鄙视的大人。',
      },
    ],
  },

  // ============================================================
  // 策略5：NPC成为哲学他者
  // 镜像NPC事件——别人的话映射玩家的存在困境
  // ============================================================

  {
    id: 'phil_npc_mentor',
    title: '退休的前辈',
    narrative: '行业活动上你遇到一位退休的前辈。他六十多岁，头发花白，端着一杯红酒。"我像你这么大时，也觉得退休是终点。后来才发现，退休是你终于停下来时，发现身后空无一物。我攒了一辈子的人脉、存款、房子——它们不会陪你喝酒。"\n你看着他，像看着一面四十岁后的镜子。',
    pathId: 'ai_symbiote',
    crossPath: true,
    ageRange: [32, 50],
    priority: 10,
    oncePerGame: true,
    eventType: 'normal',
    options: [
      {
        id: 'phil_npc_mentor_a',
        label: '"所以攒钱没用？"',
        description: '你想从前辈身上得到一个答案，哪怕是否定性的。',
        hint: '信念-5，洞察+8',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => { s.pathFaith = clamp(s.pathFaith - 5, 0, 100); },
        skillGains: { insight: 8 },
        log: '前辈看了你一眼："我没说没用。我说的是不陪你喝酒。"他喝了一口红酒，"钱能买酒，不能买喝酒的人。你还分不清这两样，说明你还年轻。"你不知道这算是安慰还是警告。',
      },
      {
        id: 'phil_npc_mentor_b',
        label: '"那你后悔吗？"',
        description: '你想知道走到终点的人，回头看时是什么感觉。',
        hint: '自我觉察+10，幸福-3',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => { s.happiness = clamp(s.happiness - 3, 0, 100); },
        skillGains: { selfAwareness: 10 },
        log: '前辈沉默了很久。"后悔这个词不对。后悔假设你能选另一条路。但站在那个时间点，你只会那么选——因为你就是你。"他看着窗外，"如果你问我遗憾，那有。遗憾不是选错了，是选的时候不知道自己在选什么。"',
      },
      {
        id: 'phil_npc_mentor_c',
        label: '什么也不问，陪他喝一杯',
        description: '有些智慧不需要语言。你选择用沉默回应沉默。',
        hint: '共情+8，幸福+4，压力-3',
        hintColor: 'positive',
        stateEffect: (s: GameState) => { s.happiness = clamp(s.happiness + 4, 0, 100); s.stress = clamp(s.stress - 3, 0, 100); },
        skillGains: { empathy: 8 },
        log: '你们碰了杯。红酒是酸的，你没喝过这种。前辈说"好酒不需要甜"。你没有接话，只是又喝了一口。活动结束你们各自离开，没有留联系方式。有些人出现在你生命里就是为了留下一句话和一杯酒——这就够了。',
      },
    ],
  },

  {
    id: 'phil_npc_mirror',
    title: '地铁里的陌生人',
    narrative: '加班到深夜，你挤上最后一班地铁。车厢里只有你和对面一个人——穿着类似的衣服，拎着类似的公文包，脸上带着类似的疲惫。你们对视一秒，各自移开目光。\n你突然想：对面那个人，会不会是做了不同选择的另一个你？TA后悔吗？地铁到站，TA站起来走向车门。那个对视让你一路沉默到家。',
    pathId: 'ai_symbiote',
    crossPath: true,
    ageRange: [28, 48],
    priority: 5,
    oncePerGame: true,
    eventType: 'normal',
    options: [
      {
        id: 'phil_npc_mirror_a',
        label: '跟上TA，看看TA去哪',
        description: '你被一种非理性的冲动驱使。你想看看"另一个你"过的是什么样的生活。',
        hint: '自我觉察+8，压力+5',
        hintColor: 'danger',
        stateEffect: (s: GameState) => { s.stress = clamp(s.stress + 5, 0, 100); },
        skillGains: { selfAwareness: 8 },
        log: '你跟了出去。TA走进了一个老旧小区，上了楼，亮了一盏灯。你站在楼下看那盏灯亮了十分钟，然后灭了。你不知道TA在十分钟后做了什么——睡觉、哭泣、发呆。你转身走了，带着一种无法言说的共鸣：也许所有人都是"另一个你"，只是你从来不看。',
      },
      {
        id: 'phil_npc_mirror_b',
        label: '低头看手机，假装什么都没发生',
        description: '你对视的那一秒太长了。你选择缩回壳里。',
        hint: '压力+3，幸福-2',
        hintColor: 'negative',
        stateEffect: (s: GameState) => { s.stress = clamp(s.stress + 3, 0, 100); s.happiness = clamp(s.happiness - 2, 0, 100); },
        log: '你掏出手机开始刷信息流。屏幕的光照着你的脸，和车厢里其他低头的人一样。你突然想到：也许对面的那个人也在低头看手机，想的是同样的事——"假装什么都没发生"。你们在同一个车厢里，用同一种方式逃避同一种感觉。',
      },
      {
        id: 'phil_npc_mirror_c',
        label: '闭眼，想想自己',
        description: '那个陌生人的脸像一面镜子。你选择闭上眼，看看镜子里的自己。',
        hint: '自我觉察+12，压力-2',
        hintColor: 'positive',
        stateEffect: (s: GameState) => { s.stress = clamp(s.stress - 2, 0, 100); },
        skillGains: { selfAwareness: 12 },
        log: '你闭上眼。地铁的震动像摇篮。你想起了很多事——小时候想成为的人，大学时的迷茫，第一份工作的兴奋，现在的疲惫。你不确定自己走到了哪里，但你知道你还在走。地铁到站时你睁开眼，对面已经空了。你站起来，走向你的人生。',
      },
    ],
  },

  // ============================================================
  // 策略7：人生下半场——40岁以后的深度思考事件
  // 填补40岁后内容空洞，让"中年"不再是重复的日子
  // ============================================================

  // 40岁：不惑之年——人生的清算
  {
    id: 'phil_midlife_40',
    title: '不惑',
    narrative: '四十岁生日那天，你在车里坐了十分钟才上楼。不是不想回家，是需要这十分钟——从"员工""父母""子女"这些身份里，暂时把自己捞出来喘口气。\n你没有成为二十岁时想成为的那个人，但你也没有变成自己讨厌的人。这中间的差距叫什么？蜡烛在蛋糕上，你许了一个愿——不是暴富，不是升职，是"就这样吧，但别再糟了"。',
    pathId: 'ai_symbiote',
    crossPath: true,
    ageRange: [40, 40],
    priority: 10,
    oncePerGame: true,
    eventType: 'milestone',
    options: [
      {
        id: 'phil_midlife_40_a',
        label: '接受——就这样也挺好',
        description: '不跟自己较劲了。平凡不是失败，是大多数人的人生。',
        hint: '幸福+8，压力-5，自我觉察+10',
        hintColor: 'positive',
        stateEffect: (s: GameState) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
        },
        skillGains: { selfAwareness: 10 },
        log: '四十岁，你学会了一个词叫"算了"。不是认输，是知道了自己的边界。你不再跟二十岁的自己较劲，不再想"如果当初"。你拥有的不多，但都是真的。这样的人生，你认了。',
      },
      {
        id: 'phil_midlife_40_b',
        label: '不甘心——下半辈子要换个活法',
        description: '四十岁不是终点，是中场休息。下半场换个打法。',
        hint: '信念+8，压力+5，幸福+3',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.stress = clamp(s.stress + 5, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
        },
        log: '吹蜡烛的时候你想：去他的"四十不惑"，我才刚活明白一半。前半辈子为别人活，后半辈子要为自己活。你打开手机，给那个想了很久但一直没敢做的项目，按下了"新建文件夹"。',
      },
      {
        id: 'phil_midlife_40_c',
        label: '不去想——忙起来就没时间矫情了',
        description: '中年人的矫情都是闲出来的。该干嘛干嘛。',
        hint: '压力+3，幸福-2，存款+5000',
        hintColor: 'negative',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 3, 0, 100);
          s.happiness = clamp(s.happiness - 2, 0, 100);
        },
        savingsChange: 5000,
        log: '你在车里坐了三分钟就上去了——想那么多干嘛，房贷还没还完，孩子辅导班费该交了，父母体检报告还没取。四十岁的人，没资格矫情。你推开车门，拎着蛋糕上楼，脸上挂好了微笑。',
      },
    ],
  },

  // 45岁：上有老下有小——夹心一代
  {
    id: 'phil_sandwich_45',
    title: '夹心',
    narrative: '四十五岁，你真正理解了"上有老下有小"这六个字的重量。\n左边是医院——你爸做手术，你在手术室外坐了六个小时，签字时手抖了。右边是学校——孩子升学，你跑了八所学校，喝了不知道多少杯"您多费心"的茶。中间是你——凌晨三点失眠，看见镜子里的自己，白头发又多了几根。你不敢病，不敢歇，不敢垮，因为两边都靠着你。',
    pathId: 'ai_symbiote',
    crossPath: true,
    ageRange: [44, 47],
    priority: 9,
    oncePerGame: true,
    eventType: 'crisis',
    conditions: (s) => s.parents.isAlive || (s.children && s.children.length > 0),
    options: [
      {
        id: 'phil_sandwich_a',
        label: '扛着——这是我的责任',
        description: '中年人没有资格说"我撑不住了"。撑住。',
        hint: '压力+10，健康-3，自我觉察+8',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
        },
        skillGains: { selfAwareness: 8 },
        log: '四十五岁，你成了家里的顶梁柱。老的小的都看着你，你不能倒。你学会了在车里抽烟再上楼，学会了报喜不报忧，学会了把崩溃藏在厕所里。你很累，但你知道——你撑住了，这个家就撑住了。',
      },
      {
        id: 'phil_sandwich_b',
        label: '放下一部分——我不是万能的',
        description: '承认自己的局限，接受不完美的解决方案。',
        hint: '压力-5，幸福+5，存款-10000',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress - 5, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
        },
        savingsChange: -10000,
        log: '你给爸请了个护工，给孩子报了寄宿学校——不是最好的选择，是你能做到的选择。你不再追求"完美"，因为你明白了——一个人的精力是有限的，你不能同时是最好的子女、最好的父母、最好的员工。你只能是你，一个尽力了的普通人。',
      },
      {
        id: 'phil_sandwich_c',
        label: '更努力赚钱——钱能解决大部分问题',
        description: '中年人的焦虑，十有八九能用钱解决。那就去赚。',
        hint: '存款+15000，压力+8，健康-5',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
        },
        savingsChange: 15000,
        log: '你接了更多的活，加更多的班，睡眠时间又少了一小时。你知道这样不健康，但你更知道——没钱的话，老人住不了好医院，孩子上不了好学校。中年人的世界，钱就是底气。你拿健康换底气，不知道划不划算，但你没得选。',
      },
    ],
  },

  // 50岁：知天命——人生的答案
  {
    id: 'phil_50_destiny',
    title: '知天命',
    narrative: '五十岁，你突然懂了孔子说的"五十而知天命"——不是知道了自己的命运，而是终于接受了。接受自己是个普通人，但这个普通人的一生也不是没有意义的。\n你不再跟年轻人比精力，不再跟同龄人比成就，开始修剪自己的生活——剪掉不必要的应酬，删掉不喜欢的社交，把时间留给真正重要的人和事。五十岁不是老了，是终于活明白了。',
    pathId: 'ai_symbiote',
    crossPath: true,
    ageRange: [50, 51],
    priority: 10,
    oncePerGame: true,
    eventType: 'milestone',
    options: [
      {
        id: 'phil_50_a',
        label: '活明白了——剩下的日子为自己活',
        description: '前半辈子为别人活，后半辈子做自己。',
        hint: '幸福+12，压力-8，自我觉察+15',
        hintColor: 'positive',
        stateEffect: (s: GameState) => {
          s.happiness = clamp(s.happiness + 12, 0, 100);
          s.stress = clamp(s.stress - 8, 0, 100);
        },
        skillGains: { selfAwareness: 15 },
        log: '五十岁，你给自己买了第一份"奢侈"的礼物——不是表，不是车，是"我不在乎了"的勇气。不在乎别人怎么看，不在乎输赢，不在乎有没有达到谁的期待。你剩下的日子，要按自己的节奏过。',
      },
      {
        id: 'phil_50_b',
        label: '传承——把我会的教给下一代',
        description: '人生的意义不在你得到了什么，而在你留下了什么。',
        hint: '幸福+10，信念+8，存款-5000',
        hintColor: 'positive',
        stateEffect: (s: GameState) => {
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        savingsChange: -5000,
        log: '五十岁，你开始带徒弟。不是公司安排的，是你主动的——你想把这三十年踩过的坑、摸出来的门道，传给那些眼睛里还有光的年轻人。你教他们的不只是技能，是你用半辈子悟出来的那些道理。教着教着你发现——你不是在给予，你是在被滋养。',
      },
      {
        id: 'phil_50_c',
        label: '不服老——我还能再战十年',
        description: '五十岁怎么了？人生才过半。',
        hint: '信念+10，健康+3，压力+5',
        hintColor: 'danger',
        stateEffect: (s: GameState) => {
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.health = clamp(s.health + 3, 0, 100);
          s.stress = clamp(s.stress + 5, 0, 100);
        },
        log: '五十岁生日你去跑了个五公里，比十年前慢了八分钟，但你跑完了。你看着镜子里的自己——头发白了一半，但眼睛还亮着。你想：五十岁算什么？那些二十多岁的小屁孩懂个屁。老子的下半场，才刚开始。',
      },
    ],
  },

  // 55岁：退休倒计时——你准备好了吗
  {
    id: 'phil_retirement_countdown',
    title: '倒计时',
    narrative: '五十五岁，你开始认真想退休这件事。不是遥不可及的未来，是再过几年就要面对的现实。\n你算了算账，看了看病历，然后发现一个可怕的事实：工作了三十年，你的身份、价值、社交圈几乎都跟工作绑在一起。如果不工作了，你是谁？你甚至想不起来，上次不是因为工作而熬夜，是因为什么。',
    pathId: 'ai_symbiote',
    crossPath: true,
    ageRange: [54, 57],
    priority: 9,
    oncePerGame: true,
    eventType: 'normal',
    options: [
      {
        id: 'phil_retire_a',
        label: '现在开始培养爱好——再不开始就晚了',
        description: '退休不是结束，是另一段人生的开始。得提前准备。',
        hint: '幸福+8，存款-8000，健康+3',
        hintColor: 'positive',
        stateEffect: (s: GameState) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.health = clamp(s.health + 3, 0, 100);
        },
        savingsChange: -8000,
        log: '你报了个书法班，又买了套钓鱼装备，还把年轻时的吉他找出来重新调了弦。一开始很笨拙——你太久没有"不为什么而做一件事"了。但慢慢的，你找到了那种纯粹的快乐。退休不是结束，是你终于有时间做回那个因为工作而丢掉的自己。',
      },
      {
        id: 'phil_retire_b',
        label: '返聘/继续干——我还不想停',
        description: '工作不是负担，是存在感。停下来反而不知道怎么活。',
        hint: '信念+5，月薪+10%，健康-3',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.1);
          s.health = clamp(s.health - 3, 0, 100);
        },
        log: '你跟公司说：我不退休，返聘吧。钱不重要，重要的是——每天早上起来有地方去，有人跟你说话，有事情需要你。你怕的不是退休，是被遗忘。只要还在做事，你就还活着。',
      },
      {
        id: 'phil_retire_c',
        label: '带孙子/帮忙照顾家庭——天伦之乐',
        description: '把时间留给家人，享受被需要的感觉。',
        hint: '幸福+10，压力-5',
        hintColor: 'positive',
        stateEffect: (s: GameState) => {
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
        },
        log: '你开始每天去孩子家帮忙带孙子。很累——比上班还累。但那个小东西第一次叫出"爷爷/奶奶"的时候，你眼泪差点掉下来。你突然明白了父母当年为什么那么爱你——不是因为你有多优秀，只是因为你是你。这种天伦之乐，是多少钱都买不来的。',
      },
    ],
  },

];

registerNarrativeEvents(PHILOSOPHY_EVENTS);
