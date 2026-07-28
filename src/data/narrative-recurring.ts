/**
 * 可重复触发的通用叙事事件
 *
 * 解决的核心问题：
 * 所有路径专属事件均为 oncePerGame，50岁后事件耗尽导致连续"休养生息"。
 * 本文件提供一批跨路径、全年龄段的低优先级可重复事件，
 * 作为事件池的保底供给，确保每年都有情境可选。
 *
 * 设计原则：
 * - oncePerGame: false（可重复触发）
 * - crossPath: true（所有路径可用）
 * - priority: 1（最低优先级，不干扰关键剧情）
 * - ageRange: [22, 60]（全年龄段覆盖）
 * - 内容贴近日常生活，不依赖特定路径技能
 */
import type { NarrativeEvent, GameState } from '../types/global.d.js';
import { registerNarrativeEvents } from './narrative-registry.js';
import { clamp } from '../utils/clamp.js';

const recurringEvents: NarrativeEvent[] = [
  // 1. 加班抉择
  {
    id: 'recurring_overtime',
    title: '又一个加班的夜晚',
    narrative: '项目排期又压缩了。组里都在加班，外卖盒堆了半张桌子。你看着屏幕上还没改完的bug，揉了揉眼睛。九点半了，地铁还有最后一班。',
    pathId: 'ai_symbiote',
    crossPath: true,
    ageRange: [22, 60],
    priority: 1,
    weight: 3,
    oncePerGame: false,
    eventType: 'normal',
    options: [
      {
        id: 'push_through',
        label: '咬牙干完再走',
        description: '今晚搞定这个模块，明天能喘口气',
        hint: '存款+2000 · 压力+8 · 健康-3',
        hintColor: 'neutral',
        savingsChange: 2000,
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
        },
        log: '你干到十一点才打车回家。第二天精神不济，但模块总算提交了。组长在群里点了个赞，你盯着那条消息看了半天，说不上是欣慰还是疲惫。',
      },
      {
        id: 'call_it_a_day',
        label: '明天再说，先回家',
        description: '地铁快没了，身体要紧',
        hint: '压力-4 · 幸福+3 · 健康+2',
        hintColor: 'positive',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress - 4, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
          s.health = clamp(s.health + 2, 0, 100);
        },
        log: '你关掉电脑赶上了末班地铁。车厢里没几个人，你靠在门边看着窗外飞过的隧道灯光。明天的事明天再说，至少今晚你属于自己。',
      },
    ],
  },

  // 2. 健身计划
  {
    id: 'recurring_fitness',
    title: '身体的信号',
    narrative: '爬了四层楼就喘，体检报告上多了两个箭头。你站在镜子前，捏了捏腰上的肉。是该做点什么了——但办了健身卡会不会又去三次就放弃？',
    pathId: 'ai_symbiote',
    crossPath: true,
    ageRange: [22, 60],
    priority: 1,
    weight: 3,
    oncePerGame: false,
    eventType: 'normal',
    options: [
      {
        id: 'join_gym',
        label: '办卡，认真练',
        description: '花钱逼自己动起来',
        hint: '健康+10 · 压力-6 · 存款-3000',
        hintColor: 'positive',
        savingsChange: -3000,
        stateEffect: (s: GameState) => {
          s.health = clamp(s.health + 10, 0, 100);
          s.stress = clamp(s.stress - 6, 0, 100);
        },
        log: '你办了年卡，前两周确实天天去。第三周开始找借口，但你逼着自己至少每周去两次。一个月后，睡眠质量好了不少，上楼也不喘了。这笔钱花得值。',
      },
      {
        id: 'home_workout',
        label: '在家练，零成本',
        description: '跟着视频做，不用出门',
        hint: '健康+5 · 压力-3',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.health = clamp(s.health + 5, 0, 100);
          s.stress = clamp(s.stress - 3, 0, 100);
        },
        log: '你在客厅铺了张瑜伽垫，跟着视频做HIIT。做了十分钟就瘫在地上，但你坚持了下来——每周三次，每次二十分钟。不多，但比什么都不做强。',
      },
      {
        id: 'skip_exercise',
        label: '算了，以后再说',
        description: '工作太忙，实在抽不出时间',
        hint: '健康-2 · 压力+3',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.health = clamp(s.health - 2, 0, 100);
          s.stress = clamp(s.stress + 3, 0, 100);
        },
        log: '你把体检报告塞进了抽屉，决定"下个月开始运动"。下个月变成了下下个月，再变成了明年。身体发出的信号被你按了静音。',
      },
    ],
  },

  // 3. 朋友聚会
  {
    id: 'recurring_social',
    title: '老朋友的邀约',
    narrative: '大学室友在群里喊了一声"周末聚聚？"你看了看日历，周六有个方案要改。但上一次聚会已经是半年前了，群里越来越安静。',
    pathId: 'ai_symbiote',
    crossPath: true,
    ageRange: [22, 60],
    priority: 1,
    weight: 3,
    oncePerGame: false,
    eventType: 'normal',
    options: [
      {
        id: 'go_out',
        label: '去，工作放一边',
        description: '朋友比方案重要',
        hint: '幸福+8 · 压力-5 · 存款-800',
        hintColor: 'positive',
        savingsChange: -800,
        stateEffect: (s: GameState) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
        },
        log: '聚会在一家火锅店，四个人喝到十点。聊了各自的工作、感情、脱发。有人说"咱们以后每个月聚一次"，你知道不太可能，但此刻你是认真的。',
      },
      {
        id: 'stay_home',
        label: '不去了，加班',
        description: '方案周一要交',
        hint: '存款+1000 · 压力+4 · 幸福-3',
        hintColor: 'neutral',
        savingsChange: 1000,
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.happiness = clamp(s.happiness - 3, 0, 100);
        },
        log: '你在群里回了个"下次一定"，然后打开电脑改方案。窗外的夜色很好，但你没抬头看。方案改到凌晨一点，完美无缺——只是没人跟你分享这份满足感。',
      },
    ],
  },

  // 4. 副业机会
  {
    id: 'recurring_sidehustle',
    title: '一个赚外快的机会',
    narrative: '前同事介绍了个私活，预算还行，工期两周。你算了算晚上的时间——如果每天挤出两小时，勉强能接。但最近压力已经不小了。',
    pathId: 'ai_symbiote',
    crossPath: true,
    ageRange: [22, 55],
    priority: 1,
    weight: 2,
    oncePerGame: false,
    eventType: 'normal',
    options: [
      {
        id: 'take_gig',
        label: '接了，多赚一笔',
        description: '辛苦两周，但收入可观',
        hint: '存款+8000 · 压力+10 · 健康-4 · 幸福-2',
        hintColor: 'neutral',
        savingsChange: 8000,
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.health = clamp(s.health - 4, 0, 100);
          s.happiness = clamp(s.happiness - 2, 0, 100);
        },
        log: '你接了私活，每天下班后再干三小时，周末全天加班。两周后交付拿到钱，你躺床上刷了半天手机什么都没看进去。钱到手的那一刻只有解脱，没有喜悦。',
      },
      {
        id: 'decline_gig',
        label: '算了，保命要紧',
        description: '现在的节奏已经够紧了',
        hint: '压力-3 · 幸福+2',
        hintColor: 'positive',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress - 3, 0, 100);
          s.happiness = clamp(s.happiness + 2, 0, 100);
        },
        log: '你婉拒了前同事。晚上下班后，你给自己做了一顿饭，看了两集剧。8000块没赚到，但你保住了自己的晚上。',
      },
    ],
  },

  // 5. 理财审视
  {
    id: 'recurring_finance',
    title: '该理理财了',
    narrative: '你打开银行App，看了看余额。钱躺在活期里吃灰，通胀像温水煮青蛙。朋友说买基金、有人说买黄金、有人说存定期。你犹豫了半天。',
    pathId: 'ai_symbiote',
    crossPath: true,
    ageRange: [24, 60],
    priority: 1,
    weight: 2,
    oncePerGame: false,
    eventType: 'normal',
    options: [
      {
        id: 'index_fund',
        label: '定投指数基金',
        description: '长期稳健，不盯盘',
        hint: '存款-5000 · 被动收入+200/年',
        hintColor: 'positive',
        savingsChange: -5000,
        passiveIncomeChange: 200,
        stateEffect: (s: GameState) => {
          s.happiness = clamp(s.happiness + 2, 0, 100);
        },
        log: '你设了每月定投，选了一只宽基指数。钱不多，但开始有了"在为未来做点什么"的感觉。你不再每天看收益，偶尔想起来看一眼，涨了开心跌了认了。',
      },
      {
        id: 'bank_deposit',
        label: '存定期，安全第一',
        description: '保本保息，不折腾',
        hint: '存款-10000 · 被动收入+150/年',
        hintColor: 'neutral',
        savingsChange: -10000,
        passiveIncomeChange: 150,
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress - 2, 0, 100);
        },
        log: '你把一部分钱存了三年定期。利率不高，但胜在踏实。你不用操心涨跌，银行到期给你利息。这就够了。',
      },
      {
        id: 'keep_liquid',
        label: '先不动，留着灵活',
        description: '说不定什么时候要用钱',
        hint: '压力+1（通胀焦虑）',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 1, 0, 100);
        },
        log: '你关掉App，钱继续躺在活期里。你知道这样不好，但"先研究研究"已经研究了半年。有时候不决定也是一种决定——选了通胀。',
      },
    ],
  },

  // 6. 健康体检
  {
    id: 'recurring_healthcheck',
    title: '体检通知',
    narrative: '公司福利体检的邮件又来了。去年你跳过了，前年也跳过了。你摸了摸后颈——最近总是僵硬。去还是不去？',
    pathId: 'ai_symbiote',
    crossPath: true,
    ageRange: [25, 60],
    priority: 1,
    weight: 2,
    oncePerGame: false,
    eventType: 'normal',
    options: [
      {
        id: 'do_checkup',
        label: '去，查个明白',
        description: '早发现早处理，别拖',
        hint: '健康+5 · 存款-500 · 压力-3',
        hintColor: 'positive',
        savingsChange: -500,
        stateEffect: (s: GameState) => {
          s.health = clamp(s.health + 5, 0, 100);
          s.stress = clamp(s.stress - 3, 0, 100);
          s.didHealthCheck = true;
        },
        log: '体检结果出来，几项指标偏高但没大问题。医生说"少熬夜多运动"，你点头如捣蒜。走出医院时阳光很好，你决定从今天开始——至少今天开始——早睡。',
      },
      {
        id: 'skip_checkup',
        label: '不去了，怕吓自己',
        description: '不查就没病（自欺欺人）',
        hint: '健康-2 · 压力+2',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.health = clamp(s.health - 2, 0, 100);
          s.stress = clamp(s.stress + 2, 0, 100);
        },
        log: '你删了体检邮件。不是不想去，是怕查出什么来。这种心态你自己也觉得荒谬——但不查就还能假装一切正常。至少今天是正常的。',
      },
    ],
  },

  // 7. 家庭联系
  {
    id: 'recurring_family',
    title: '该给家里打个电话了',
    narrative: '妈妈发了条微信："最近忙吗？"你看到的时候是下午三点，想着下班再回。下班后约了饭局，回家已经十一点。这条消息已经躺了三天。',
    pathId: 'ai_symbiote',
    crossPath: true,
    ageRange: [22, 60],
    priority: 1,
    weight: 3,
    oncePerGame: false,
    eventType: 'normal',
    options: [
      {
        id: 'call_home',
        label: '现在就打',
        description: '别等"有空了"',
        hint: '幸福+6 · 压力-4 · 健康+2',
        hintColor: 'positive',
        stateEffect: (s: GameState) => {
          s.happiness = clamp(s.happiness + 6, 0, 100);
          s.stress = clamp(s.stress - 4, 0, 100);
          s.health = clamp(s.health + 2, 0, 100);
        },
        log: '电话响了三声就接了。妈妈说"没事就是问问"，然后聊了半小时——小区的猫、隔壁的装修、你爸的新茶壶。挂掉电话你发现自己在笑。没事就是最大的好事。',
      },
      {
        id: 'text_reply',
        label: '回条微信算了',
        description: '打字比打电话轻松',
        hint: '幸福+1 · 压力+1（内疚）',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.happiness = clamp(s.happiness + 1, 0, 100);
          s.stress = clamp(s.stress + 1, 0, 100);
        },
        log: '你打了句"最近挺忙的，都好"。妈妈秒回了一个"好的注意身体"。对话结束了。你知道她想说的话不止这些，你也知道自己想说的不止这些。但文字装不下那些东西。',
      },
    ],
  },

  // 8. 消费诱惑
  {
    id: 'recurring_splurge',
    title: '想买个大件',
    narrative: '新款手机发布了，你盯着参数表流口水。或者该换台电脑了？又或者——那双看了很久的鞋终于打折了。理性说没必要，感性说对自己好一点。',
    pathId: 'ai_symbiote',
    crossPath: true,
    ageRange: [22, 60],
    priority: 1,
    weight: 3,
    oncePerGame: false,
    eventType: 'normal',
    options: [
      {
        id: 'buy_it',
        label: '买了，犒劳自己',
        description: '赚钱不就是为了花吗',
        hint: '存款-6000 · 幸福+10 · 压力-5',
        hintColor: 'neutral',
        savingsChange: -6000,
        stateEffect: (s: GameState) => {
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
        },
        log: '下单的那一刻是幸福的巅峰。拆快递的时候也很快乐。第三天新鲜感就过去了，但它确实让那个灰暗的星期变得亮了一点。你对自己说：值。',
      },
      {
        id: 'resist_urge',
        label: '忍住，把钱存着',
        description: '旧的不是还能用吗',
        hint: '存款+0 · 幸福-2 · 信念+2',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.happiness = clamp(s.happiness - 2, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 2, 0, 100);
        },
        log: '你关掉了购物App。旧手机还能用，鞋柜里那双也还行。你把那笔钱转进了储蓄账户，数字跳了一下。省钱的快感不如花钱猛烈，但持续得更久。',
      },
    ],
  },

  // 9. 职业反思
  {
    id: 'recurring_career',
    title: '深夜的自我怀疑',
    narrative: '又是一个睡不着的夜晚。你盯着天花板想：这条路到底对不对？同龄人有的已经财务自由，有的进了体制，有的回了老家。你呢？',
    pathId: 'ai_symbiote',
    crossPath: true,
    ageRange: [25, 55],
    priority: 1,
    weight: 2,
    oncePerGame: false,
    eventType: 'normal',
    options: [
      {
        id: 'doubt_stay',
        label: '继续走，不折腾了',
        description: '沉没成本太高，换了也不一定好',
        hint: '信念+5 · 压力+3',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.stress = clamp(s.stress + 3, 0, 100);
        },
        log: '你翻了个身，决定不想了。路是自己选的，跪着也得走完。不是没想过放弃，但你太清楚——换了条路，三年后你还是会问同样的问题。',
      },
      {
        id: 'doubt_explore',
        label: '偷偷看看别的机会',
        description: '不做决定，先了解',
        hint: '压力-2 · 幸福+1',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress - 2, 0, 100);
          s.happiness = clamp(s.happiness + 1, 0, 100);
        },
        log: '你打开招聘App刷了半小时，看了看别的行业、别的岗位。没投简历，但心里踏实了一点——原来选择还在。原来门没关死。你放下手机，终于有了困意。',
      },
    ],
  },

  // 10. 学习充电
  {
    id: 'recurring_learning',
    title: '该学点新东西了',
    narrative: '行业变化太快，你感觉自己像在跑步机上——不跑就会被甩出去。朋友圈有人晒了新证书，有人分享了学习笔记。你也该充充电了。',
    pathId: 'ai_symbiote',
    crossPath: true,
    ageRange: [22, 55],
    priority: 1,
    weight: 3,
    oncePerGame: false,
    eventType: 'normal',
    options: [
      {
        id: 'buy_course',
        label: '报个班系统学',
        description: '花钱买效率，有老师带',
        hint: '存款-4000 · 压力+3 · 信念+4',
        hintColor: 'neutral',
        savingsChange: -4000,
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '你报了一个线上课程，每周两次课。老师讲得不错，作业也多。你咬牙坚持了八周，结业时确实学到了东西——虽然学完发现要学的更多了。但至少方向清晰了一些。',
      },
      {
        id: 'self_study',
        label: '自学，找免费资源',
        description: 'B站和文档就够了',
        hint: '压力+2 · 信念+2',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 2, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 2, 0, 100);
        },
        log: '你收藏了十个教程视频，看了三个。其中一个讲了半小时还在说"今天我们先从环境配置讲起"，你关掉了。但另一个确实讲得不错，你跟着做完了demo。碎片化学习，碎片化进步。',
      },
      {
        id: 'no_time',
        label: '等忙完这阵再说',
        description: '现在实在抽不出时间',
        hint: '压力+1 · 信念-2',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 1, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 2, 0, 100);
        },
        log: '你把学习计划写进了备忘录，然后就没然后了。"忙完这阵"是一个永远不会到来的时刻——因为下一阵永远在路上。',
      },
    ],
  },

  // 11. 情绪低谷
  {
    id: 'recurring_mood',
    title: '提不起劲的日子',
    narrative: '最近什么都不想做。不是累，是空。闹钟响了五次才起来，外卖不知道点什么因为什么都不想吃。你知道自己不是抑郁，但也说不上正常。',
    pathId: 'ai_symbiote',
    crossPath: true,
    ageRange: [22, 60],
    priority: 1,
    weight: 2,
    oncePerGame: false,
    eventType: 'normal',
    options: [
      {
        id: 'seek_help',
        label: '找个心理咨询聊聊',
        description: '专业的事交给专业的人',
        hint: '存款-1500 · 压力-8 · 幸福+5 · 健康+3',
        hintColor: 'positive',
        savingsChange: -1500,
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress - 8, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.health = clamp(s.health + 3, 0, 100);
        },
        log: '咨询师很平静地听你说完，然后问了一个让你愣住的问题："你上一次觉得开心是什么时候？"你张了张嘴，发现自己想不起来。五十分钟的咨询结束了，你走出来，觉得胸口轻了一点。',
      },
      {
        id: 'self_care',
        label: '自己调节，出去走走',
        description: '也许只是需要换换环境',
        hint: '压力-5 · 幸福+3 · 存款-500',
        hintColor: 'positive',
        savingsChange: -500,
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress - 5, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
        },
        log: '你请了半天假，去了一个没去过的公园。坐在长椅上看了一个小时的湖，什么都没想。回去的路上买了一束花，插在桌上。第二天醒来，好像没那么沉了。',
      },
      {
        id: 'push_through',
        label: '硬扛，会好的',
        description: '谁不是这么过来的',
        hint: '压力+3 · 健康-2 · 幸福-2',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 3, 0, 100);
          s.health = clamp(s.health - 2, 0, 100);
          s.happiness = clamp(s.happiness - 2, 0, 100);
        },
        log: '你逼着自己按部就班地过。起床、上班、吃饭、睡觉。日子像灰色的河慢慢流。你知道"会好的"——但什么时候好，你不知道。你只是在等。',
      },
    ],
  },

  // 12. 人脉拓展
  {
    id: 'recurring_network',
    title: '行业活动邀请',
    narrative: '一个行业峰会发来了邀请函，门票不便宜。但嘉宾名单里有几个你关注了很久的大佬。去不去？去了能聊上几句吗？',
    pathId: 'ai_symbiote',
    crossPath: true,
    ageRange: [24, 55],
    priority: 1,
    weight: 2,
    oncePerGame: false,
    eventType: 'normal',
    options: [
      {
        id: 'attend_event',
        label: '去，走出舒适区',
        description: '人脉就是机会',
        hint: '存款-2000 · 压力+4 · 幸福+3 · 信念+3',
        hintColor: 'neutral',
        savingsChange: -2000,
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '你在会场加了七八个微信，聊了三个有料的。有个创始人对你的想法很感兴趣，约了下周电话聊。你在回去的地铁上复盘对话，觉得今天没白来。社交是消耗，但有时也充电。',
      },
      {
        id: 'skip_event',
        label: '不去了，社恐发作',
        description: '线上也能看直播',
        hint: '压力-2 · 幸福+1',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress - 2, 0, 100);
          s.happiness = clamp(s.happiness + 1, 0, 100);
        },
        log: '你在家看了直播回放，快进了三分之二。大佬说的道理你都懂，但没去现场少了一种"被点燃"的感觉。你安慰自己：至少省了两千块和一天的社交电量。',
      },
    ],
  },

  // 13. 生活仪式感
  {
    id: 'recurring_ritual',
    title: '日子需要点仪式感',
    narrative: '今天是个普通的日子。但你突然想——也许该做点什么，让今天不那么普通。哪怕只是换一条路回家，或者给自己买束花。',
    pathId: 'ai_symbiote',
    crossPath: true,
    ageRange: [22, 60],
    priority: 1,
    weight: 3,
    oncePerGame: false,
    eventType: 'normal',
    options: [
      {
        id: 'do_something_special',
        label: '做点不一样的事',
        description: '生活需要偶尔的脱轨',
        hint: '幸福+7 · 压力-4 · 存款-500',
        hintColor: 'positive',
        savingsChange: -500,
        stateEffect: (s: GameState) => {
          s.happiness = clamp(s.happiness + 7, 0, 100);
          s.stress = clamp(s.stress - 4, 0, 100);
        },
        log: '你下班后绕去了海边。夕阳正好，风有点凉。你坐在堤坝上发了十分钟呆，然后去吃了一家一直想去但没去的店。味道一般，但你心情很好。今天确实不太普通了。',
      },
      {
        id: 'keep_routine',
        label: '按部就班就好',
        description: '平淡也是一种安稳',
        hint: '压力-1 · 幸福+1',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress - 1, 0, 100);
          s.happiness = clamp(s.happiness + 1, 0, 100);
        },
        log: '你照常回家、做饭、洗澡、看剧。没有什么特别的，但也没有什么不好的。你关灯的时候想：平淡也没什么不好。至少没有意外。',
      },
    ],
  },

  // 14. 信息焦虑
  {
    id: 'recurring_info',
    title: '刷不完的信息流',
    narrative: '你已经刷了四十分钟手机了。每条都在说"你必须知道的XX""再不看就晚了"。你关掉App，三秒后又打开。信息像洪水，你像一块海绵——吸不动但停不下来。',
    pathId: 'ai_symbiote',
    crossPath: true,
    ageRange: [22, 60],
    priority: 1,
    weight: 2,
    oncePerGame: false,
    eventType: 'normal',
    options: [
      {
        id: 'digital_detox',
        label: '断网一天，清清脑子',
        description: '关掉通知，放下手机',
        hint: '压力-6 · 幸福+4 · 健康+2',
        hintColor: 'positive',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress - 6, 0, 100);
          s.happiness = clamp(s.happiness + 4, 0, 100);
          s.health = clamp(s.health + 2, 0, 100);
        },
        log: '你把手机调成飞行模式，放在抽屉里。前两个小时浑身难受，像少了只手。下午你开始看书、发呆、散步。晚上打开手机，错过了三十条消息——但没有一条是等不了八小时的。',
      },
      {
        id: 'keep_scrolling',
        label: '再刷一会儿就睡',
        description: '万一有什么重要消息呢',
        hint: '压力+3 · 健康-3 · 幸福-2',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 3, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
          s.happiness = clamp(s.happiness - 2, 0, 100);
        },
        log: '你刷到凌晨一点。看了四十条短视频，记住了零条。关掉手机后脑子里嗡嗡响，翻来覆去睡不着。明天的精力被预支了，但你说不清这些信息到底给了你什么。',
      },
    ],
  },

  // 15. 回馈与意义
  {
    id: 'recurring_meaning',
    title: '想做点有意义的事',
    narrative: '下班路上经过一个社区活动中心，门口贴着志愿者招募。你停了几秒。最近总觉得生活像一台只进不出的机器——赚了花了，花了赚了。也许该给点什么出去。',
    pathId: 'ai_symbiote',
    crossPath: true,
    ageRange: [25, 60],
    priority: 1,
    weight: 2,
    oncePerGame: false,
    eventType: 'normal',
    options: [
      {
        id: 'volunteer',
        label: '报名志愿者',
        description: '给出去的东西会以另一种方式回来',
        hint: '幸福+8 · 压力-5 · 健康+2 · 存款-300',
        hintColor: 'positive',
        savingsChange: -300,
        stateEffect: (s: GameState) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
          s.health = clamp(s.health + 2, 0, 100);
        },
        log: '你去教社区老人用智能手机。一个奶奶学了一下午才学会发语音，开心得像个小孩。她拉着你的手说"谢谢你啊年轻人"。你鼻子一酸——好久没有这种感觉了。被需要的感觉。',
      },
      {
        id: 'donate',
        label: '捐点钱就好',
        description: '时间不够，钱来凑',
        hint: '存款-2000 · 幸福+3 · 信念+2',
        hintColor: 'neutral',
        savingsChange: -2000,
        stateEffect: (s: GameState) => {
          s.happiness = clamp(s.happiness + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 2, 0, 100);
        },
        log: '你在一个公益项目上捐了两千块。收到一封感谢邮件，你扫了一眼就归档了。做了一点什么，但感觉还是隔了一层。也许意义不在钱的多少，而在你是否真的在场。',
      },
      {
        id: 'maybe_later',
        label: '等我有空了再说',
        description: '现在自顾不暇',
        hint: '信念-1 · 幸福-1',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.pathFaith = clamp(s.pathFaith - 1, 0, 100);
          s.happiness = clamp(s.happiness - 1, 0, 100);
        },
        log: '你走过了那个活动中心。"等有空了"——这句话你说了很多次。你知道"有空"不会自己来，但今天你确实没有余力。你加快了脚步。',
      },
    ],
  },

  // 16. 搬家抉择
  {
    id: 'recurring_relocate',
    title: '要不要换个住处',
    narrative: '房租又涨了。或者通勤太远了。或者邻居太吵了。总之你又开始刷租房App了——每次刷完都更烦，但又忍不住看。',
    pathId: 'ai_symbiote',
    crossPath: true,
    ageRange: [22, 50],
    priority: 1,
    weight: 2,
    oncePerGame: false,
    eventType: 'normal',
    options: [
      {
        id: 'move_better',
        label: '换个好点的',
        description: '住得舒服值这个钱',
        hint: '存款-5000 · 幸福+6 · 压力-4 · 健康+2',
        hintColor: 'positive',
        savingsChange: -5000,
        stateEffect: (s: GameState) => {
          s.happiness = clamp(s.happiness + 6, 0, 100);
          s.stress = clamp(s.stress - 4, 0, 100);
          s.health = clamp(s.health + 2, 0, 100);
        },
        log: '搬完家你躺在新的床上，窗外比原来安静多了。贵了一千块，但每天少通勤二十分钟、能睡个好觉——这笔账算得过来。',
      },
      {
        id: 'stay_put',
        label: '算了，搬家太累',
        description: '忍忍就习惯了',
        hint: '存款+2000 · 压力+2',
        hintColor: 'neutral',
        savingsChange: 2000,
        stateEffect: (s: GameState) => {
          s.stress = clamp(s.stress + 2, 0, 100);
        },
        log: '你续了租，涨了三百块。搬家太折腾了——找房子、搬东西、改地址、适应新环境。你选择忍受已知的烦恼，而不是面对未知的麻烦。这也是一种生活方式。',
      },
    ],
  },

  // 17. 中年健康警示
  {
    id: 'recurring_midlife_health',
    title: '身体开始记账了',
    narrative: '不是什么大事——只是膝盖开始响了，颈椎总是僵的，偶尔心脏会多跳一拍。年轻时熬的夜、吃的外卖、省掉的体检，好像开始找你结账了。',
    pathId: 'ai_symbiote',
    crossPath: true,
    ageRange: [38, 60],
    priority: 1,
    weight: 3,
    oncePerGame: false,
    eventType: 'normal',
    options: [
      {
        id: 'lifestyle_change',
        label: '认真调整生活方式',
        description: '该改的改，该忌的忌',
        hint: '健康+12 · 压力-4 · 幸福+3 · 存款-2000',
        hintColor: 'positive',
        savingsChange: -2000,
        stateEffect: (s: GameState) => {
          s.health = clamp(s.health + 12, 0, 100);
          s.stress = clamp(s.stress - 4, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
        },
        log: '你开始早睡、戒宵夜、每天走八千步。头两周浑身不自在，像换了个操作系统。但一个月后，那种"身体在慢慢好起来"的感觉让你安心了不少。身体确实记仇——但也记恩。',
      },
      {
        id: 'take_meds',
        label: '吃点药先扛着',
        description: '没时间大改，先治标',
        hint: '健康+3 · 存款-1500 · 压力+1',
        hintColor: 'neutral',
        savingsChange: -1500,
        stateEffect: (s: GameState) => {
          s.health = clamp(s.health + 3, 0, 100);
          s.stress = clamp(s.stress + 1, 0, 100);
        },
        log: '你买了一堆保健品和膏药。贴上确实舒服点，但你心里清楚——这是在用创可贴盖裂缝。医生说的"生活方式干预"你听进去了，但还没准备好执行。',
      },
      {
        id: 'ignore_signals',
        label: '小毛病，别自己吓自己',
        description: '人哪有不零件老化的',
        hint: '健康-5 · 压力+3',
        hintColor: 'neutral',
        stateEffect: (s: GameState) => {
          s.health = clamp(s.health - 5, 0, 100);
          s.stress = clamp(s.stress + 3, 0, 100);
        },
        log: '你选择了无视。膝盖响就响吧，颈椎僵就僵吧——大家不都这样吗？你把不适感归类为"正常老化"，然后继续原来的生活。身体会继续记账，利息也在累积。',
      },
    ],
  },
];

registerNarrativeEvents(recurringEvents);
