/**
 * 链上原住民路径 · 完整叙事事件库
 *
 * 三条分支：
 *   chain_trader   — 短线交易线，主动交易，在行情波动中寻找alpha
 *   chain_builder  — DeFi开发者线，构建协议、DApp、智能合约
 *   chain_hodler   — 坚定持有线，长期HODLer，社区建设，DAO治理
 *
 * 三个技能维度：
 *   tradingSkill         交易能力（市场分析、风险管理、择时）
 *   defiSkill            DeFi开发（智能合约、协议设计、安全）
 *   communityInfluence   社区影响力（DAO治理、社区建设、思想引领）
 *
 * 自定义状态字段：
 *   state.chainHoldings  链上持仓价值（加密货币资产市值）
 *
 * ================================================================
 * 效果应用约定：
 *   skillGains / savingsChange / salaryChange / passiveIncomeChange
 *   为声明式字段，由 store 统一应用到 state（pathSkills / currentSavings 等）。
 *   stateEffect 仅负责 stress / happiness / health / pathFaith 以及
 *   条件分支逻辑和自定义字段（chainHoldings）的初始化与调整，不重复修改
 *   上述声明式字段，以避免双重计算。
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

/** 读取链上持仓价值（自定义字段，可能未初始化） */
function getChainHoldings(state: GameState): number {
  return (state as any).chainHoldings || 0;
}

/**
 * 检查玩家是否已放弃链上投资
 * 在"废墟之上"事件中选择"放弃链上"后，此标记为 true，
 * 后续所有持仓相关操作（买入/卖出/缩水/增值）都将被跳过。
 */
function hasAbandonedCrypto(state: GameState): boolean {
  return (state as any).hasAbandonedCrypto === true;
}

/**
 * 按存款百分比买入加密货币
 * @param pct 投入存款的比例（0~1），如 0.25 = 投入存款的25%
 * 注意：如果玩家已放弃链上投资，此函数不执行任何操作
 */
function investPercent(state: GameState, pct: number): void {
  if (hasAbandonedCrypto(state)) return; // 已放弃链上投资，不再买入
  const investAmount = Math.round(state.currentSavings * pct);
  if (investAmount <= 0) return;
  state.currentSavings -= investAmount;
  (state as any).chainHoldings = ((state as any).chainHoldings || 0) + investAmount;
  updateCryptoAllocation(state);
}

/**
 * 按持仓百分比卖出变现
 * @param pct 卖出持仓的比例（0~1），如 0.5 = 卖出一半
 * 注意：如果玩家已放弃链上投资，此函数不执行任何操作
 */
function sellPercent(state: GameState, pct: number): void {
  if (hasAbandonedCrypto(state)) return; // 已放弃链上投资，不再操作持仓
  const cur = (state as any).chainHoldings || 0;
  const sellAmount = Math.round(cur * pct);
  if (sellAmount <= 0) return;
  (state as any).chainHoldings = cur - sellAmount;
  state.currentSavings += sellAmount;
  updateCryptoAllocation(state);
}

/**
 * 卖出指定金额的持仓变现（用于特定用途如交手术费）
 * @param amount 需要变现的金额
 * 注意：如果玩家已放弃链上投资，此函数返回0
 */
function sellForAmount(state: GameState, amount: number): number {
  if (hasAbandonedCrypto(state)) return 0; // 已放弃链上投资，不再操作持仓
  const cur = (state as any).chainHoldings || 0;
  const actualSell = Math.min(amount, cur);
  (state as any).chainHoldings = cur - actualSell;
  state.currentSavings += actualSell;
  updateCryptoAllocation(state);
  return actualSell;
}

/**
 * 爆仓归零（交易所跑路/杠杆爆仓/项目归零）
 * 持仓直接清零，不返还任何资金
 */
function liquidateHoldings(state: GameState): void {
  (state as any).chainHoldings = 0;
  updateCryptoAllocation(state);
}

/**
 * 按持仓百分比丢失（被黑客偷走/被骗，不变现）
 * @param pct 丢失持仓的比例（0~1），如 0.3 = 丢失30%
 * 注意：如果玩家已放弃链上投资，此函数不执行任何操作
 */
function losePercent(state: GameState, pct: number): void {
  if (hasAbandonedCrypto(state)) return; // 已放弃链上投资，不再操作持仓
  const cur = (state as any).chainHoldings || 0;
  const loss = Math.round(cur * pct);
  (state as any).chainHoldings = Math.max(0, cur - loss);
  updateCryptoAllocation(state);
}

/** 按比例调整链上持仓价值（乘数，如 1.5 = +50%，0.6 = -40%）
 * 注意：如果玩家已放弃链上投资，此函数不执行任何操作
 */
function scaleChainHoldings(state: GameState, multiplier: number): void {
  if (hasAbandonedCrypto(state)) return; // 已放弃链上投资，不再操作持仓
  const cur = (state as any).chainHoldings || 0;
  (state as any).chainHoldings = Math.max(0, Math.round(cur * multiplier));
  // 比例变化后也更新分布显示
  updateCryptoAllocation(state);
}

/**
 * 更新存款分布：链上持仓是独立资产（chainHoldings），不占用 currentSavings 的百分比。
 * speculationPct = 0（加密货币不在存款中，而在 chainHoldings 中）
 * bankDepositPct = 100 - 其他渠道百分比
 * UI 显示时再按总流动资产（savings + chainHoldings）重新计算各渠道占比。
 */
function updateCryptoAllocation(state: GameState): void {
  // 链上持仓是独立资产，不占用 currentSavings 的百分比
  state.speculationPct = 0;
  // 其他渠道（基金/股票/黄金/定期）的百分比保持不变，余额宝吸收剩余
  const otherPct = (state.indexFundPct || 0) + (state.stockPct || 0) + (state.goldPct || 0) + (state.fixedDepositPct || 0);
  state.bankDepositPct = Math.max(0, 100 - otherPct);
}

// ============================================================
// 通用事件（ages 22-24，分支选择前）
// ============================================================

const commonEvents: NarrativeEvent[] = [

  // 22岁：第一笔加密货币
  {
    id: 'chain_first_buy',
    title: '创世区块',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    ageRange: [22, 22],
    priority: 7,
    weight: 10,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '你在论坛潜水了三个月，看懂了"不是你的私钥就不是你的币"这句话。入职第一个月发工资的当晚，你把30%换成了一个你研究了很久的代币。\n' +
      '转账确认的那一秒，你盯着区块浏览器的pending转success，手心全是汗。你第一次拥有了一种"没有任何银行、没有任何政府能触碰"的资产——它只认私钥，不认身份证。\n' +
      '室友看你对着一个满屏英文的网站傻笑，问你疯了没有。你把助记词抄在纸上，用胶带贴在床板底下。那天晚上你没睡着，不是因为兴奋，是因为一种奇怪的庄严感——你把自己的命运，交给了一串没人能改的代码。',
    options: [
      {
        id: 'aggressive_dca',
        label: '把能省的钱都换成币',
        description: '信了就别留退路，工资一发就定投',
        hint: '交易能力+10 · DeFi+3 · 压力+8 · 信念+8 · 持仓+存款25%',
        hintColor: 'positive',
        skillGains: { tradingSkill: 10, defiSkill: 3 },
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          investPercent(s, 0.25);
        },
        log: '22岁，你把工资的六成换成了币。外卖换成了食堂，新衣服一件没买。室友说你被传销洗脑了，你笑了笑没解释——有些路，信的人自然会信。',
      },
      {
        id: 'dca_cautiously',
        label: '定投，每月固定买入',
        description: '不梭哈，用纪律对抗波动',
        hint: '交易能力+6 · 信念+5 · 压力+3 · 持仓+存款12%',
        hintColor: 'neutral',
        skillGains: { tradingSkill: 6 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          investPercent(s, 0.12);
        },
        log: '22岁，你在日历上设了每月发薪日的定投闹钟。不管涨跌，雷打不动地买。你告诉自己：这是用时间换复利，用纪律换自由。',
      },
      {
        id: 'learn_before_buy',
        label: '先学透白皮书和技术，少买多看',
        description: '不懂的不碰，把功夫花在认知上',
        hint: 'DeFi+10 · 交易能力+4 · 信念+4 · 持仓+存款6%',
        hintColor: 'neutral',
        skillGains: { defiSkill: 10, tradingSkill: 4 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          investPercent(s, 0.06);
        },
        log: '22岁，你把市面上的白皮书读了三十多份，用Solidity跑通了第一个Hello World合约。你买的币不多，但每一枚你都知道它背后跑着什么逻辑。认知是你的第一笔资产。',
      },
    ],
  },

  // 23岁：第一次暴跌
  {
    id: 'chain_first_crash',
    title: '至暗时刻',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    ageRange: [23, 23],
    priority: 6,
    weight: 9,
    oncePerGame: true,
    eventType: 'normal',
    conditions: (s) => getChainHoldings(s) > 0,
    narrative:
      '凌晨三点你的手机震了。你迷迷糊糊点开行情，以为看错了——持仓跌了35%。\n' +
      '你刷新了三遍，数字没变。社群里炸了锅，有人喊"抄底"，有人喊"归零"，有人发了一连串的蜡烛图说"技术面早就破了"。你的手指悬在"卖出"按钮上方，停了整整两分钟。\n' +
      '这是你第一次真正理解什么叫"波动"。书上写的和亲身经历完全是两回事——你的胃在抽搐，你的脑子在打架，一半的你喊着"割肉保命"，另一半的你喊着"HODL"。',
    options: [
      {
        id: 'hodl_through',
        label: '死扛，HODL到底',
        description: '信了就别在恐慌里松手',
        hint: '交易能力+5 · 信念+10 · 压力+12 · 健康-3 · 持仓先跌35%后反弹一半(净-17.5%)',
        hintColor: 'neutral',
        skillGains: { tradingSkill: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          // 持仓先暴跌35%(×0.65)，三天后反弹一半(从0.65涨到0.825≈0.82)
          scaleChainHoldings(s, 0.82);
        },
        log: '23岁，你没卖。你把手机扣在桌上，强迫自己不去看行情。三天后反弹了一半，你长出一口气。你第一次懂了HODL不是口号，是凌晨三点对抗本能的战争。',
      },
      {
        id: 'cut_loss_learn',
        label: '果断止损，把教训变成经验',
        description: '承认看错了，留得青山在',
        hint: '交易能力+12 · 信念-3 · 压力+6 · 全仓在谷底卖出(约-40%)换成现金',
        hintColor: 'neutral',
        skillGains: { tradingSkill: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 3, 0, 100);
          // 暴跌后在谷底（约-40%位置）全部卖出换现金
          // 先把持仓价值压到谷底的0.6x（比35%暴跌更低一点，即"割在最低点"）
          scaleChainHoldings(s, 0.6);
          // 然后全部卖出换成现金（sellPercent=按持仓比例卖币变现）
          sellPercent(s, 1.0);
        },
        log: '23岁，你按下了卖出。割在最低点附近，疼得倒吸一口凉气。但你把那天的K线截了图，在复盘笔记里写了三页。你告诉自己：亏钱不可怕，亏了还不知道为什么才可怕。',
      },
      {
        id: 'buy_the_dip',
        label: '反向操作，抄底加仓',
        description: '别人恐惧我贪婪',
        hint: '交易能力+8 · 信念+6 · 压力+10 · 花5000抄底·两周后反弹浮盈',
        hintColor: 'danger',
        skillGains: { tradingSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          // 暴跌35%后抄底（investPercent=按存款比例买入，自动从存款扣钱加币）
          scaleChainHoldings(s, 0.65); // 先经历35%暴跌
          investPercent(s, 0.08); // 在谷底加仓（存款8%）
          scaleChainHoldings(s, 1.26); // 两周后反弹26%（和HODL选项一致的反弹幅度）
        },
        log: '23岁，你在血流成河的时候按下了买入。手在抖，但你告诉自己这是别人恐惧时该有的贪婪。两周后涨回来一截，你账面浮盈了。但你知道，这份胆量下一次可能就是灾难。',
      },
    ],
  },

  // 23-24岁：家人的质疑
  {
    id: 'chain_family_skepticism',
    title: '异教徒',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    ageRange: [23, 24],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    narrative:
      '过年回家，饭桌上你爸突然问："听说你买那个什么币？同事说那是传销，把钱都骗光了。"\n' +
      '全桌人看向你。你妈赶紧打圆场："小孩子玩玩，能花几个钱。"你表哥接话："我一个朋友的同事，几十万全亏了，老婆都跑了。"\n' +
      '你张了张嘴，想说"去中心化""通缩""抗通胀"，但看着满桌的亲戚，你一个词都说不出来。他们的世界里，钱应该存在银行、买房子、交社保——你说的那些词，在他们听来和"邪教"没区别。',
    options: [
      {
        id: 'explain_patiently',
        label: '耐心解释，用最通俗的话讲',
        description: '试图让家人理解你信的是什么',
        hint: '社区影响力+8 · 信念+5 · 压力+5 · 幸福+3',
        hintColor: 'neutral',
        skillGains: { communityInfluence: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '23岁，你用了整个年夜饭的时间，用"数字黄金""没有央行能印"这种话解释区块链。你爸听懂了一半，叹了口气说"你自己心里有数就行"。你知道这已经是最大的让步了。',
      },
      {
        id: 'stay_silent',
        label: '不解释，用结果说话',
        description: '燕雀安知鸿鹄之志，等赚到了他们自然懂',
        hint: '交易能力+4 · 信念+8 · 压力+3',
        hintColor: 'neutral',
        skillGains: { tradingSkill: 4 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '23岁，你笑了笑把话题岔开了。你把解释的力气省下来，全部投进了研究和复盘。你告诉自己：三年后拿结果回家，比说一万句"这是未来"都有用。',
      },
      {
        id: 'show_small_profit',
        label: '晒一笔小赚，安抚家人',
        description: '用真金白银的盈利让他们安心',
        hint: '社区影响力+5 · 幸福+5 · 信念+3 · 持仓-15%(卖币买电视)',
        hintColor: 'positive',
        skillGains: { communityInfluence: 5 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
          sellPercent(s, 0.15); // 卖币换现金
          s.currentSavings -= 3000; // 扣除买电视的花费
        },
        log: '23岁，你卖了一小笔币，给爸妈换了台新电视。你爸嘴上说"乱花钱"，但第二天就在亲戚群里显摆了。你发现：让家人理解区块链太难，但让他们看到钱，比什么解释都管用。',
      },
    ],
  },

  // 24岁：深入研究DeFi生态
  {
    id: 'chain_defi_rabbit_hole',
    title: '兔子洞',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    ageRange: [24, 24],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    conditions: (s) => getChainHoldings(s) > 0,
    narrative:
      '你掉进了DeFi的兔子洞。从Uniswap的AMM原理到Compound的清算机制，从闪电贷到流动性挖矿，你发现链上有一整个没有银行、没有券商、没有监管的金融宇宙在运转。\n' +
      '你在某个凌晨两点第一次用MetaMask和智能合约交互——授权、签名、等待确认，gas费扣掉的瞬间，你看到自己的USDC变成了LP代币，开始自动赚取交易手续费。没有客户经理，没有审批流程，没有营业时间。\n' +
      '你盯着那笔自动到账的手续费，突然懂了什么叫"代码即法律"——不是一句口号，是一套真的在运转的机器。但你也看到了新闻：某个协议被黑客盗了上亿，某个稳定币脱锚暴跌。这把刀，两面都是锋。',
    options: [
      {
        id: 'dive_into_code',
        label: '钻进代码，搞懂每个协议的底层逻辑',
        description: '看得懂合约才敢把钱放进去',
        hint: 'DeFi+12 · 交易能力+3 · 压力+8 · 健康-3 · 持仓+存款8%',
        hintColor: 'positive',
        skillGains: { defiSkill: 12, tradingSkill: 3 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          investPercent(s, 0.08);
        },
        log: '24岁，你花了三个月把主流DeFi协议的合约源码逐行读完。你看懂了闪电贷怎么套利、看懂了预言机怎么报价、也看懂了那些黑客怎么找到漏洞。你第一次觉得自己不只是个赌徒，而是个"懂行的人"。',
      },
      {
        id: 'farm_yields',
        label: '参与流动性挖矿，赚高年化',
        description: '把资金效率拉满，撸各种项目的空投和收益',
        hint: '交易能力+10 · DeFi+5 · 压力+6 · 持仓×1.4 · 风险敞口扩大',
        hintColor: 'neutral',
        skillGains: { tradingSkill: 10, defiSkill: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          scaleChainHoldings(s, 1.4);
        },
        log: '24岁，你把资金撒进了五个不同的流动性池，年化收益加起来超过80%。每天醒来先查收益，像养了一群下金蛋的鹅。但你也知道，这些鹅可能随时被黑客端走——高收益从来都是高风险的伪装。',
      },
      {
        id: 'community_voice',
        label: '把研究成果写成文章发到社区',
        description: '边学边输出，用内容建立影响力',
        hint: '社区影响力+12 · DeFi+6 · 信念+5 · 被动收入+2000/年',
        hintColor: 'positive',
        skillGains: { communityInfluence: 12, defiSkill: 6 },
        passiveIncomeChange: 2000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
        },
        log: '24岁，你写的DeFi拆解文章在社区里火了，有人私信问你"能不能带带我"。你第一次发现：在这个圈子里，"懂"本身就是一种资产。你开始有了自己的小粉丝群。',
      },
    ],
  },

  // 23-24岁：双面生活——职场与加密副业的冲突
  {
    id: 'chain_office_caught',
    title: '双面人',
    pathId: 'chain_native',
    ageRange: [23, 24],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    narrative:
      '周三下午，你正盯着屏幕上的K线图，旁边窗口还摊着写了一半的智能合约。你太专注了，没注意到组长什么时候站到了你身后。\n' +
      '"这个……图表，挺专业啊。"组长敲了敲你的工位隔板，语气听不出喜怒。你手忙脚乱地切窗口，可MetaMask的弹窗还是慢了半拍。\n' +
      '你成了双面人：白天是格子间里按部就班的员工，深夜是链上世界里逐浪的赌徒。两条线越绷越紧，像两根随时会崩断的弦。',
    options: [
      {
        id: 'be_honest',
        label: '坦诚相待',
        description: '向组长解释自己在学习区块链技术',
        hint: '交易能力+3 · 社区影响力+5 · 压力+8 · 信念-3 · 领导印象变差',
        hintColor: 'neutral',
        skillGains: { tradingSkill: 3, communityInfluence: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 3, 0, 100);
        },
        log: '组长皱着眉听你解释完，说了句"别耽误正事"就走了。但你知道他心里已经给你贴了标签。',
      },
      {
        id: 'deny_it',
        label: '矢口否认',
        description: '说在看股票行情，掩盖过去',
        hint: '交易能力+2 · 压力+12 · 幸福-5 · 信念+2',
        hintColor: 'danger',
        skillGains: { tradingSkill: 2 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.happiness = clamp(s.happiness - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 2, 0, 100);
        },
        log: '组长半信半疑地走了。你心跳如鼓，赶紧切换回工作页面。但接下来一周你都不敢在工位上打开交易所。',
      },
      {
        id: 'lay_low',
        label: '收敛一段时间',
        description: '暂时收手，专注主业',
        hint: '压力-5 · 幸福+3 · 健康+5 · 信念-5 · 存款+3000',
        hintColor: 'positive',
        savingsChange: 3000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 5, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
          s.health = clamp(s.health + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
        },
        log: '你把交易所APP都卸载了，专心上班。组长在周会上表扬了你。但每到深夜你还是忍不住用手机刷行情——只是再也不敢在工位上看了。',
      },
    ],
  },

  // 24岁：燃烧——白天上班深夜盯盘拖垮身体
  {
    id: 'chain_sleep_deprivation',
    title: '燃烧',
    pathId: 'chain_native',
    ageRange: [24, 24],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    eventType: 'normal',
    sceneTag: 'crisis',
    narrative:
      '你记不清自己多久没睡过一个整觉了。白天对着Excel犯困，深夜对着K线兴奋——你的生物钟被切成两半，一半交给工资，一半交给行情。\n' +
      '今天下午的周会上你实在没撑住，头一点一点地磕下去。会后领导把你叫进办公室，没骂你，只问了一句："最近是不是有什么事？"你没敢说实话。\n' +
      '你照了照镜子，眼圈黑得像被人揍了一拳。你知道这样下去不行，可行情不等人，机会不等人——你停不下来。',
    options: [
      {
        id: 'fix_schedule',
        label: '调整作息',
        description: '保证每天6小时睡眠，凌晨两点强制关掉交易所',
        hint: '健康+10 · 压力-8 · 交易能力-3 · 信念-3',
        hintColor: 'positive',
        skillGains: { tradingSkill: -3 },
        stateEffect: (s) => {
          s.health = clamp(s.health + 10, 0, 100);
          s.stress = clamp(s.stress - 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 3, 0, 100);
        },
        log: '你给自己定了规矩：凌晨两点必须关掉交易所。刚开始很难受，但一周后你发现自己的判断力反而清醒了。',
      },
      {
        id: 'push_through',
        label: '硬扛到底',
        description: '用咖啡和功能饮料续命，在工位和K线之间拼命',
        hint: '交易能力+8 · DeFi+5 · 压力+15 · 健康-10 · 信念+5 · 可能病倒(健康额外-2)',
        hintColor: 'danger',
        skillGains: { tradingSkill: 8, defiSkill: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.health = clamp(s.health - 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          // 熬夜硬扛，有概率病倒
          if (Math.random() < 0.5) {
            s.health = clamp(s.health - 2, 0, 100);
          }
        },
        log: '你用咖啡和功能饮料续命，在工位和K线之间拼命。你的交易记录越来越漂亮，但你的眼圈越来越黑。组长已经找你谈了两次话。',
      },
      {
        id: 'consider_quitting',
        label: '辞职专心做',
        description: '认真考虑要不要干脆辞职全职做链上',
        hint: '压力+5 · 信念+8 · 健康-5 · 继续双线作战',
        hintColor: 'danger',
        prerequisites: (s) => !s.isAllInPath,
        disabledReason: '你已经All In全职做链上，没有主业可以辞了',
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
        },
        log: '你认真想了想，要不要干脆辞职算了。但你看了看银行卡余额，又看了看下个月的房租——还不是时候。你咬咬牙，继续双线作战。',
      },
    ],
  },
];

// ============================================================
// 分支选择事件（age 25）
// ============================================================

const branchSelectEvent: NarrativeEvent[] = [

  {
    id: 'chain_branch_select',
    title: '岔路',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    ageRange: [25, 25],
    priority: 10,
    weight: 10,
    oncePerGame: true,
    eventType: 'branch_select',
    conditions: (s) => getChainHoldings(s) > 0 && (!s.narrativeBranch || s.narrativeBranch === 'unassigned'),
    narrative:
      '三年了。你从那个对着区块浏览器发呆的新手，变成了朋友圈里"最懂币"的那个人。但"懂"是个很虚的字——你懂行情，却还没靠交易实现稳定盈利；你会写合约，却还没上线过一个真正有人用的协议；你HODL了三年，却还在熊市里煎熬。\n\n' +
      '25岁这年，你站在一个岔路口。加密世界的浪潮越来越大，你不能再以"什么都懂一点"的姿态漂着了。你得选一条路，走到黑。\n\n' +
      '深夜你打开钱包，看着那串持仓数字，写下三个词：交易、建造、信仰。你知道选了哪条路，就意味着把赌注押在一个方向。窗外的城市熄了灯，你的屏幕还亮着，光标一闪一闪，像在等你做一个不会反悔的决定。',
    options: [
      {
        id: 'choose_chain_trader',
        label: '做交易员，在波动中猎取alpha',
        description: '死磕交易系统，研究K线、链上数据、情绪周期。你赌的是：在零和博弈里，你能成为收割者而不是被收割者。',
        hint: '交易能力+12 · 持仓×1.3 · 压力+8 · 信念+6',
        hintColor: 'danger',
        skillGains: { tradingSkill: 12 },
        branchSwitch: 'chain_trader',
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          scaleChainHoldings(s, 1.3);
        },
        log: '25岁，你选了最刺激的那条路——把自己变成一台交易机器。你清掉了大部分长线仓位，把资金集中到交易策略上。别人在HODL，你在追逐每一个波动。你赌的是：行情是你的提款机。',
      },
      {
        id: 'choose_chain_builder',
        label: '做DeFi开发者，用代码创造价值',
        description: '不赌行情，赌自己的代码能改变金融。你赌的是：在这个圈子里，造桥的人比过桥的人赚得多。',
        hint: 'DeFi+12 · 存款-10000 · 压力+6 · 信念+8',
        hintColor: 'positive',
        skillGains: { defiSkill: 12 },
        savingsChange: -10000,
        branchSwitch: 'chain_builder',
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '25岁，你把精力砸进了Solidity和协议设计。你不再盯着行情，而是盯着IDE。你赌的是：在这个去中心化的世界里，写代码的人掌握着真正的权力——因为规则是他们写的。',
      },
      {
        id: 'choose_chain_hodler',
        label: '做坚定持有者，用时间换复利',
        description: '不追涨杀跌，不写代码，用信念和时间熬死波动。你赌的是：区块链是十年级别的革命，不是十天级别的行情。',
        hint: '社区影响力+12 · 持仓×1.2 · 信念+10 · 压力+3',
        hintColor: 'positive',
        skillGains: { communityInfluence: 12 },
        branchSwitch: 'chain_hodler',
        stateEffect: (s) => {
          ensureSkills(s);
          s.stress = clamp(s.stress + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          scaleChainHoldings(s, 1.2);
        },
        log: '25岁，你做了一个看起来最"无聊"的决定——继续HODL。你把手机里的行情APP通知关了，开始把精力投向社区和DAO。你赌的是：钻石手不是靠忍，是靠理解。真正信的人，不需要看K线。',
      },
    ],
  },
];

// ============================================================
// 短线交易线事件（ages 26-40）
// ============================================================

const traderEvents: NarrativeEvent[] = [

  // 26岁：第一次稳定盈利
  {
    id: 'trader_first_edge',
    title: '刃',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    branch: 'chain_trader',
    ageRange: [26, 26],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => getChainHoldings(s) > 0,
    narrative:
      '你连续三个月实现了正收益。不是运气——你建了一套基于链上数据和情绪指标的交易系统，每次开仓前都写交易日志，每笔止损都严格执行。\n' +
      '这个月的胜率是61%，盈亏比2.3。数字不大，但你知道这意味着什么：你终于从"赌徒"变成了"有边际优势的交易者"。社群里有人开始问你"怎么看行情"，你的回答永远是那句："我看的不是行情，是概率。"\n' +
      '但你也清楚，三个月的正收益可能是运气，也可能是市场刚好配合你的风格。真正的考验，是当市场风格切换、你的系统开始失效的时候。',
    options: [
      {
        id: 'scale_up',
        label: '加大仓位，扩大战果',
        description: '既然有边际优势，就该用更大的杠杆放大它',
        hint: '交易能力+12 · 压力+12 · 持仓×1.5 · 健康-3 · 信念+5',
        hintColor: 'danger',
        skillGains: { tradingSkill: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          scaleChainHoldings(s, 1.5);
        },
        log: '26岁，你把单笔仓位从2%提到了5%。赚得更快了，但每次开仓前的心跳也更重了。你告诉自己：有边际优势就该放大它。但你隐约知道，杠杆是放大收益的工具，也是放大恐惧的工具。',
      },
      {
        id: 'refine_system',
        label: '保持小仓位，继续打磨系统',
        description: '不急着放大，先把样本量做足验证稳定性',
        hint: '交易能力+12 · 压力+5 · 持仓×1.2 · 信念+6',
        hintColor: 'positive',
        skillGains: { tradingSkill: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          scaleChainHoldings(s, 1.2);
        },
        log: '26岁，你忍住了加仓的冲动，用三个月小仓位跑了200笔交易。你发现你的系统在震荡市表现好，在单边趋势里会挨打。你开始打磨第二套策略——慢，但你知道慢就是快。',
      },
      {
        id: 'share_signals',
        label: '在社群分享交易信号，积累影响力',
        description: '把交易能力变成影响力，两头赚钱',
        hint: '交易能力+8 · 社区影响力+8 · 被动收入+5000/年 · 压力+6',
        hintColor: 'neutral',
        skillGains: { tradingSkill: 8, communityInfluence: 8 },
        passiveIncomeChange: 5000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '26岁，你开始在社群里分享每日交易笔记。有人跟着你操作赚了钱，给你发红包。但也有人亏了钱骂你"带单割韭菜"。你第一次体会到：公开交易是要承受双倍压力的——赔了赔钱，赚了赔名声。',
      },
    ],
  },

  // 27岁：杠杆的诱惑
  {
    id: 'trader_leverage',
    title: '悬崖边的舞步',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    branch: 'chain_trader',
    ageRange: [27, 27],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => getChainHoldings(s) > 0,
    narrative:
      '一个"带单老师"在群里晒了张截图：10倍杠杆，一周翻了四倍。下面一排"求带""牛牛牛"。\n' +
      '你心里清楚那是幸存者偏差——他不会晒爆仓的截图。但那个数字像钩子一样扎在你脑子里。你的系统胜率不错，如果能加上3-5倍杠杆，收益能翻几番。\n' +
      '你打开交易所的合约页面，杠杆滑块从1x拉到10x。你盯着那个数字，想起了那句话："杠杆不会让你变富，只会让你更快地到达你该去的地方。"问题是你不知道那个地方是天堂还是地狱。',
    options: [
      {
        id: 'moderate_leverage',
        label: '用2-3倍杠杆，可控范围内放大',
        description: '不上头，杠杆是工具不是赌注',
        hint: '交易能力+12 · 压力+10 · 持仓×1.35 · 信念+4',
        hintColor: 'neutral',
        skillGains: { tradingSkill: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          scaleChainHoldings(s, 1.35);
        },
        log: '27岁，你给自己的合约交易定了铁律：永不超过3倍杠杆，单笔风险不超过本金的2%。加了杠杆后收益确实快了，但你严格执行止损，没有一次扛单。你告诉自己：活得久比赚得快重要。',
      },
      {
        id: 'high_leverage_gamble',
        label: 'all in高杠杆，搏一把大的',
        description: '富贵险中求，看准了就该重仓',
        hint: '交易能力+8 · 压力+14 · 60%概率持仓×2.0 / 30%小赚 / 10%爆仓归零 · 健康-4',
        hintColor: 'danger',
        skillGains: { tradingSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 14, 0, 100);
          s.health = clamp(s.health - 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          // 真正的杠杆赌博：60%翻倍，30%小赚10%，10%爆仓归零
          const roll = Math.random();
          if (roll < 0.10) {
            liquidateHoldings(s); // 爆仓归零
          } else if (roll < 0.40) {
            scaleChainHoldings(s, 1.1); // 小赚
          } else {
            scaleChainHoldings(s, 2.0); // 翻倍
          }
        },
        log: '27岁，你在一次"确定性极高"的行情里开了8倍杠杆。前三天浮盈40%，你觉得自己是神。第四天一个插针，你的仓位差点被强平——在最后一秒你手动止损平仓，浑身冷汗。这一次你活下来了，但你知道下次可能就没这么幸运。',
      },
      {
        id: 'no_leverage_spot',
        label: '坚持现货，不碰合约',
        description: '杠杆是交易所的镰刀，不碰就不会被割',
        hint: '交易能力+10 · 信念+8 · 压力-3 · 持仓×1.15',
        hintColor: 'positive',
        skillGains: { tradingSkill: 10 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          scaleChainHoldings(s, 1.15);
        },
        log: '27岁，你看着那些晒爆仓截图的人，关掉了合约页面。你坚持只做现货，收益慢但睡得着觉。有人说你"胆小"，你笑笑——爆仓的人没有资格说胆小，活着的人才有。',
      },
    ],
  },

  // 28-29岁：经历完整牛熊周期
  {
    id: 'trader_full_cycle',
    title: '潮汐',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    branch: 'chain_trader',
    ageRange: [28, 29],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => getChainHoldings(s) > 0,
    narrative:
      '你终于熬完了一个完整的牛熊周期。从FOMO追高的疯狂，到山腰抄底被套的绝望，再到底部横盘的窒息——你在每一个阶段都交过学费。\n' +
      '现在你回头看自己的交易记录，像看一部关于贪婪与恐惧的纪录片。牛市里你赚过三倍，又在回调里吐回去一半；熊市里你扛住了没割肉，却在反弹第一波就跑得太早。\n' +
      '你把三年的交易日志摊在桌上，用红笔圈出了所有"情绪化操作"。你发现：你的亏损90%来自不守纪律，你的盈利90%来自严格执行系统。道理你都懂，但在那个当下，懂和做到之间隔着一整个恐惧与贪婪的深渊。',
    options: [
      {
        id: 'codify_discipline',
        label: '把纪律写成交易系统，用程序执行',
        description: '机器没有情绪，让代码替你开平仓',
        hint: '交易能力+12 · DeFi+8 · 压力+8 · 持仓×1.3 · 信念+6',
        hintColor: 'positive',
        skillGains: { tradingSkill: 12, defiSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          scaleChainHoldings(s, 1.3);
        },
        log: '28岁，你用Python写了一个半自动交易机器人，把你的策略变成代码。机器不会在凌晨三点手贱加仓，也不会在暴跌时恐慌平仓。你第一次睡了个整觉——不是因为不关心，是因为你知道你的纪律终于有了执行力。',
      },
      {
        id: 'trade_by_gut_refined',
        label: '坚持手动，但建立交易前checklist',
        description: '机器不懂"盘感"，你的直觉是优势',
        hint: '交易能力+12 · 信念+5 · 压力+6 · 持仓×1.2',
        hintColor: 'neutral',
        skillGains: { tradingSkill: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          scaleChainHoldings(s, 1.2);
        },
        log: '28岁，你做了一张交易checklist卡贴在屏幕边：每次开仓前必须打勾——有没有止损？仓位有没有超标？是不是情绪化操作？你依然手动交易，但每一次按下按钮前，那张卡都在拦着你。',
      },
      {
        id: 'teach_cycle',
        label: '把周期经验写成系列内容，建立品牌',
        description: '经历过完整周期的人太少，你的经验很值钱',
        hint: '社区影响力+12 · 交易能力+6 · 被动收入+8000/年 · 信念+5',
        hintColor: 'positive',
        skillGains: { communityInfluence: 12, tradingSkill: 6 },
        passiveIncomeChange: 8000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          s.happiness = clamp(s.happiness + 4, 0, 100);
        },
        log: '28岁，你写的"一个交易员的牛熊周期复盘"在圈子里刷屏了。有人留言说"这是我看过最诚实的交易分享"。你第一次发现：承认自己亏过、蠢过、怕过，反而比晒盈利截图更能赢得信任。',
      },
    ],
  },

  // 30岁：交易心理战
  {
    id: 'trader_psychology',
    title: '心魔',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    branch: 'chain_trader',
    ageRange: [30, 30],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    conditions: (s) => getChainHoldings(s) > 0,
    narrative:
      '你连续两周亏损。不是大亏，是那种钝刀子割肉的小亏——每次止损都是对的，但每次止损后行情就按你原本判断的方向走了。\n' +
      '你知道这是交易里最折磨人的阶段：你的系统没错，你的判断没错，但你的节奏被市场打乱了。你开始怀疑自己——是不是该换个策略？是不是该休息？还是说，你压根就没有边际优势，之前的盈利只是运气？\n' +
      '凌晨四点你盯着空白的交易终端，第一次承认：交易最难的不是技术，是和自己的人性搏斗。你的多巴胺、你的皮质醇、你的损失厌恶，它们才是你真正的对手。',
    options: [
      {
        id: 'take_break_reset',
        label: '强制休息两周，清空大脑',
        description: '离开盘面，去爬山、睡觉、陪家人',
        hint: '交易能力+5 · 压力-15 · 健康+10 · 幸福+8 · 信念+3',
        hintColor: 'positive',
        skillGains: { tradingSkill: 5 },
        isRestOption: true,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 15, 0, 100);
          s.health = clamp(s.health + 10, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '30岁，你关掉了所有行情软件，去山里待了两周。没有WiFi，没有K线，只有风声和鸟叫。回来后你的第一笔交易就盈利了——不是因为技术变好了，是因为你的脑子终于不抖了。',
      },
      {
        id: 'shrink_position',
        label: '把仓位降到最小，用实战恢复手感',
        description: '不休息，但用最小仓位保持盘感',
        hint: '交易能力+10 · 压力+3 · 持仓×1.05 · 信念+4',
        hintColor: 'neutral',
        skillGains: { tradingSkill: 10 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
          scaleChainHoldings(s, 1.05);
        },
        log: '30岁，你把仓位降到了原来的十分之一，像用小号练手感。两周后你重新找到了节奏，把仓位慢慢加了回来。你学到一件事：手感丢了不可怕，可怕的是带着亏损的怒气加仓。',
      },
      {
        id: 'find_mentor',
        label: '找一个前辈请教，打破认知盲区',
        description: '当局者迷，需要一面镜子',
        hint: '交易能力+12 · 社区影响力+5 · 压力+4 · 存款-3000 · 信念+6',
        hintColor: 'positive',
        skillGains: { tradingSkill: 12, communityInfluence: 5 },
        savingsChange: -3000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '30岁，你付费请了一位做了八年交易的前辈看你的交易记录。他只说了一句："你的系统没问题，但你在亏损后会急着扳回来，这是你所有的病根。"你愣了很久——你知道他说得对。',
      },
    ],
  },

  // 31-32岁：链上数据分析
  {
    id: 'trader_onchain_data',
    title: '深水区',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    branch: 'chain_trader',
    ageRange: [31, 32],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    conditions: (s) => getChainHoldings(s) > 0,
    narrative:
      '你开始研究链上数据——巨鲸地址的异动、交易所流入流出、稳定币市值变化、矿工持仓。你发现K线只是表象，链上数据才是资金的脚印。\n' +
      '你建了一个监控面板，追踪二十个"聪明钱"地址。某天凌晨你发现三个巨鲸同时在向交易所转账——这是他们过去每次大跌前都会做的事。你提前减仓，三天后市场暴跌12%。\n' +
      '你盯着那个监控面板，第一次觉得自己不是在和K线博弈，而是在和一群真实存在的人博弈——那些巨鲸、做市商、交易所，他们手里的信息比你多得多。你靠的不是信息优势，是对公开数据的洞察力。',
    options: [
      {
        id: 'build_dashboard',
        label: '自建链上数据分析工具，建立信息优势',
        description: '把数据洞察产品化，成为你的核心武器',
        hint: '交易能力+12 · DeFi+8 · 压力+8 · 持仓×1.4 · 信念+6',
        hintColor: 'positive',
        skillGains: { tradingSkill: 12, defiSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          scaleChainHoldings(s, 1.4);
        },
        log: '31岁，你花了一个月搭建了自己的链上数据监控面板。从此你不再追着消息跑，而是让数据来找你。你的胜率从61%提到了68%，每一次提前减仓都像拥有了某种预知能力。',
      },
      {
        id: 'monetize_data',
        label: '把数据工具做成付费产品卖给其他交易者',
        description: '交易之外，卖铲子给淘金的人',
        hint: '交易能力+8 · 社区影响力+10 · 被动收入+15000/年 · 压力+6',
        hintColor: 'positive',
        skillGains: { tradingSkill: 8, communityInfluence: 10 },
        passiveIncomeChange: 15000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '31岁，你的链上数据工具有了第一批付费用户。你发现：在淘金热里，最稳赚的是卖铲子的人。交易有亏有赚，但卖铲子的钱是确定的。你第一次有了"两条腿走路"的感觉。',
      },
      {
        id: 'follow_whales',
        label: '专注跟单巨鲸，做趋势跟随者',
        description: '不造工具，直接抄聪明钱的作业',
        hint: '交易能力+10 · 压力+4 · 持仓×1.25 · 信念+3',
        hintColor: 'neutral',
        skillGains: { tradingSkill: 10 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
          scaleChainHoldings(s, 1.25);
        },
        log: '31岁，你成了一个"巨鲸跟随者"。聪明钱买什么你买什么，聪明钱跑你跟着跑。收益不错，但你心里清楚：跟单是偷懒，一旦巨鲸开始反向下套，你就是第一个被收割的。',
      },
    ],
  },

  // 33-34岁：与巨鲸博弈
  {
    id: 'trader_whale_game',
    title: '猎人与猎物',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    branch: 'chain_trader',
    ageRange: [33, 34],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => getChainHoldings(s) > 0,
    narrative:
      '你发现了一个规律：某个地址每次大额转入交易所后48小时内必跌，但最近三次它转入了，行情却没跌，反而涨了。\n' +
      '你恍然大悟——他们在反向操作。他们知道有人在监控他们，于是故意制造假信号诱多，等散户跟进后砸盘。你不是猎人，你是被猎人盯着的猎物。\n' +
      '这让你脊背发凉。你一直以为链上数据是你的透视镜，现在你才发现：当你看深渊的时候，深渊也在看你。那些巨鲸不仅有更多的钱，还有更聪明的人——他们知道你在看，并且利用了你的看。',
    options: [
      {
        id: 'counter_game',
        label: '研究巨鲸的反向操作，制定反收割策略',
        description: '既然他们在钓鱼，那就别咬钩，反向吃他们的诱多',
        hint: '交易能力+12 · 压力+15 · 健康-4 · 持仓×1.5 · 信念+8',
        hintColor: 'danger',
        skillGains: { tradingSkill: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.health = clamp(s.health - 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          scaleChainHoldings(s, 1.5);
        },
        log: '33岁，你花了一个月拆解巨鲸的"假信号"模式，做出了反收割策略。前两次试错亏了钱，第三次终于抓到了他们的诱多陷阱，反向做空赚了一笔大的。你第一次觉得自己在和"对手"下棋，而不是在和运气赌博。',
      },
      {
        id: 'ignore_whales',
        label: '放弃跟单巨鲸，回归自己的系统',
        description: '和聪明钱博弈是死路，赚自己认知范围内的钱',
        hint: '交易能力+10 · 信念+8 · 压力-5 · 持仓×1.2',
        hintColor: 'positive',
        skillGains: { tradingSkill: 10 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          scaleChainHoldings(s, 1.2);
        },
        log: '33岁，你关掉了巨鲸监控面板。你接受了一个事实：你斗不过那些有几十亿资金和顶级团队的人。但没关系，你不需要赢他们，你只需要赢市场上90%的散户。你回归了自己的系统，反而赚得更稳了。',
      },
      {
        id: 'expose_pattern',
        label: '把巨鲸操纵手法公开写成报告',
        description: '既然看穿了，就帮更多散户避坑',
        hint: '社区影响力+12 · 交易能力+6 · 被动收入+10000/年 · 压力+8 · 信念+5',
        hintColor: 'positive',
        skillGains: { communityInfluence: 12, tradingSkill: 6 },
        passiveIncomeChange: 10000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '33岁，你写了一篇"巨鲸如何用假信号收割散户"的深度报告，转发破万。有人说你是"散户的吹哨人"，也有人私信威胁你"少管闲事"。你第一次知道：在这个圈子里，说真话是要付出代价的。',
      },
    ],
  },

  // 35-36岁：纪律vs贪婪
  {
    id: 'trader_discipline_test',
    title: '贪嗔痴',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    branch: 'chain_trader',
    ageRange: [35, 36],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    conditions: (s) => getChainHoldings(s) > 0,
    narrative:
      '牛市来了。你的持仓在三周内翻了四倍。社群里到处是"财务自由""这辈子够了"的声音，有人晒出了买房截图，有人宣布"退休"。\n' +
      '你的系统发出减仓信号，但你的手指停住了。四倍，如果是十倍呢？如果是五十倍呢？你看过太多"卖早了拍大腿"的故事，你不想成为下一个。\n' +
      '你知道这是交易员最危险的时刻——不是亏损时的恐惧，是盈利时的贪婪。恐惧让你止损，贪婪让你不止盈。你盯着那个浮盈数字，它每跳一下，你的理性就崩塌一分。',
    options: [
      {
        id: 'follow_system_exit',
        label: '严格执行系统，分批止盈',
        description: '系统说走就走，不和市场谈恋爱',
        hint: '交易能力+12 · 信念+10 · 压力-5 · 持仓×0.6(止盈) · 存款+40000',
        hintColor: 'positive',
        skillGains: { tradingSkill: 12 },
        savingsChange: 40000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          scaleChainHoldings(s, 0.6);
        },
        log: '35岁，你在牛市高点分批止盈，把四成利润锁进了稳定币。两周后市场暴跌30%，你看着那些没跑的人哀嚎，庆幸自己守住了纪律。你终于信了那句话：会买的是徒弟，会卖的是师傅。',
      },
      {
        id: 'hold_for_more',
        label: '减半仓，留一半搏更高',
        description: '既落袋一部分，又不错过可能的更大行情',
        hint: '交易能力+8 · 压力+10 · 持仓×0.8 · 信念+5 · 存款+20000',
        hintColor: 'neutral',
        skillGains: { tradingSkill: 8 },
        savingsChange: 20000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          scaleChainHoldings(s, 0.8);
        },
        log: '35岁，你卖了一半，留了一半。结果行情又涨了一周你懊恼卖早了，然后暴跌你庆幸还卖了一半。你在贪婪和后悔之间反复横跳，最终明白：没有完美的止盈，只有适合你的止盈。',
      },
      {
        id: 'diamond_hands_greed',
        label: '一毛不拔，死拿到顶峰',
        description: '这次不一样，这次是超级周期',
        hint: '交易能力+5 · 压力+18 · 持仓×1.3(然后暴跌) · 健康-5 · 信念+6',
        hintColor: 'danger',
        skillGains: { tradingSkill: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 18, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          scaleChainHoldings(s, 0.9);
        },
        log: '35岁，你一句"这次不一样"死扛到了顶。结果没顶，只有悬崖。三周涨的全部回吐还倒亏一成。你看着曾经四倍的浮盈变成负数，第一次真正理解什么叫"纸上富贵"。这次教训，比任何止损都贵。',
      },
    ],
  },

  // 37-38岁：税务与合规现实
  {
    id: 'trader_tax_reality',
    title: '账单',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    branch: 'chain_trader',
    ageRange: [37, 38],
    priority: 5,
    weight: 6,
    oncePerGame: true,
    narrative:
      '你请了个会计帮你算这几年的交易税务。算完之后你看着那张表，沉默了很久。\n' +
      '你发现：你赚的钱里，有相当一部分要交给税务局。而且因为你的交易频次极高，每一笔进出都要计税，光是整理交易记录就让会计熬了三个通宵。更麻烦的是，有些链上操作的税务定性模糊不清——是资本利得还是经营所得？没人说得清。\n' +
      '你第一次意识到：在链上世界你可以自由地交易，但回到现实世界，你仍然是一个需要纳税的公民。去中心化的是技术，不是你的纳税义务。',
    options: [
      {
        id: 'full_compliance',
        label: '全面合规，补缴税款请律师',
        description: '花钱买安心，把账做干净',
        hint: '交易能力+6 · 存款-60000 · 压力-8 · 信念+5 · 合规身份',
        hintColor: 'neutral',
        skillGains: { tradingSkill: 6 },
        savingsChange: -60000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '37岁，你补缴了税款，请了律师把这几年的链上交易全部合规化。花了一大笔钱，但晚上终于能睡着了。你明白了：自由不是没有规则，是在规则里找到自己的空间。',
      },
      {
        id: 'offshore_structuring',
        label: '研究离岸结构，合法优化税务',
        description: '在法律框架内，把税务成本降到最低',
        hint: '交易能力+8 · DeFi+5 · 存款-20000 · 压力+6 · 信念+3',
        hintColor: 'neutral',
        skillGains: { tradingSkill: 8, defiSkill: 5 },
        savingsChange: -20000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '37岁，你研究了离岸信托和合规的税务架构，把一部分资产做了结构化安排。省下了不少税，但也搭进去了大量精力和律师费。你第一次觉得：钱赚来难，守住更难。',
      },
      {
        id: 'ignore_taxes',
        label: '继续装作不知道，能拖一天是一天',
        description: '链上交易那么隐蔽，税务局查不到的',
        hint: '交易能力+4 · 压力+15 · 信念-8 · 埋下隐患',
        hintColor: 'danger',
        skillGains: { tradingSkill: 4 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 8, 0, 100);
        },
        log: '37岁，你把税务问题推到了脑后。链上交易确实隐蔽，但你开始失眠——不是怕查，是怕那种"随时可能出事"的不确定性悬在头顶。有些钱省了，是用安宁换的。',
      },
    ],
  },

  // 39-40岁：最后的交易考验
  {
    id: 'trader_final_test',
    title: '收刀',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    branch: 'chain_trader',
    ageRange: [39, 40],
    priority: 7,
    weight: 9,
    oncePerGame: true,
    eventType: 'milestone',
    conditions: (s) => getChainHoldings(s) > 0 && getSkill(s, 'tradingSkill') >= 55,
    narrative:
      '你做了十几年的交易。你见过一夜暴富的人消失在下一个熊市，也见过爆仓归零的人从外卖小哥重新爬起来。你还在。\n' +
      '现在你面临一个交易员最难的决定：什么时候收手？你的系统还在赚钱，但你的反应速度在变慢，你的心脏在抗议，你的伴侣在问你"到底要干到什么时候"。\n' +
      '你打开交易终端，看着那些跳动的数字。它们曾经让你热血沸腾，现在只是数字。你问自己：你是在交易，还是已经成了交易的奴隶？一个真正的交易大师，不是知道什么时候开仓，是知道什么时候关掉屏幕。',
    options: [
      {
        id: 'retire_from_trading',
        label: '金盆洗手，转入被动收益策略',
        description: '把资产转入低风险稳定币理财，不再主动交易',
        hint: '交易能力+10 · 信念+12 · 压力-15 · 健康+8 · 被动收入+15000/年',
        hintColor: 'positive',
        skillGains: { tradingSkill: 10 },
        passiveIncomeChange: 15000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 15, 0, 100);
          s.health = clamp(s.health + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.happiness = clamp(s.happiness + 10, 0, 100);
        },
        log: '39岁，你关闭了合约交易权限，把大部分资产转入了稳定币理财。你不再盯盘，不再设闹钟。第一次醒来不用看行情的早晨，你听了很久窗外的鸟叫。你终于明白：交易是为了自由，不是为了交易本身。',
      },
      {
        id: 'handover_fund',
        label: '转型做量化基金，让别人替你交易',
        description: '把策略交给团队，自己只做风控',
        hint: '交易能力+12 · 社区影响力+10 · 被动收入+40000/年 · 压力+8 · 存款-30000',
        hintColor: 'positive',
        skillGains: { tradingSkill: 12, communityInfluence: 10 },
        savingsChange: -30000,
        passiveIncomeChange: 40000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '39岁，你成立了一个小型量化基金，把你的交易系统交给了三个年轻人。你不再亲自下单，只做风控和策略审核。你的心脏感谢你，你的账户也感谢你——被动收入比你自己交易还稳。',
      },
      {
        id: 'keep_trading',
        label: '继续交易，这是你的热爱',
        description: '只要还有边际优势，就不收手',
        hint: '交易能力+12 · 压力+8 · 健康-5 · 持仓×1.3 · 信念+6',
        hintColor: 'danger',
        skillGains: { tradingSkill: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          scaleChainHoldings(s, 1.3);
        },
        log: '39岁，你没收手。你告诉自己和伴侣"还能再干十年"。交易确实是你的热爱，但你的体检报告上多了两个箭头。你赢着市场，却隐隐觉得自己在和身体做一笔会输的交易。',
      },
    ],
  },
];

// ============================================================
// DeFi开发者线事件（ages 26-40）
// ============================================================

const builderEvents: NarrativeEvent[] = [

  // 26岁：第一个智能合约
  {
    id: 'builder_first_contract',
    title: 'Hello World',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    branch: 'chain_builder',
    ageRange: [26, 26],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => !hasAbandonedCrypto(s),
    narrative:
      '你写完了第一个部署到测试网的智能合约——一个简单的代币质押合约，200行代码。你在Remix里点了Deploy，等待确认的那几秒比任何K线跳动都让你紧张。\n' +
      '合约部署成功。你看着Etherscan上那个绿色的合约地址，像看着自己刚出生的孩子。你转了0.001个测试ETH进去，调用deposit函数——它工作了。你的代码，在一个没有人控制的网络上，自动执行了你写的逻辑。\n' +
      '那一刻你懂了为什么有人说"代码即法律"——不是夸张，是字面意义。你的if和else，就是链上的宪法。但权力越大，责任越大——一行写错的代码，可能烧掉几百万。',
    options: [
      {
        id: 'audit_obsessively',
        label: '反复测试审计，把每个边界条件跑遍',
        description: '安全第一，上线前把合约虐到崩溃',
        hint: 'DeFi+12 · 压力+10 · 健康-4 · 信念+6',
        hintColor: 'positive',
        skillGains: { defiSkill: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.health = clamp(s.health - 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '26岁，你花了三周给那个200行的合约写了500行测试代码，把每个reentrancy、overflow、front-running的边界都测了一遍。上线那天你手心冒汗，但合约稳如磐石。你建立了第一个习惯：上线前先把自己当黑客。',
      },
      {
        id: 'learn_from_hacks',
        label: '研究所有重大黑客事件，学习反面教材',
        description: '从别人的血泪里学安全',
        hint: 'DeFi+12 · 交易能力+3 · 压力+6 · 信念+5',
        hintColor: 'positive',
        skillGains: { defiSkill: 12, tradingSkill: 3 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '26岁，你把过去五年所有重大DeFi黑客事件逐个复盘——The DAO、Poly Network、Wormhole。你把每个漏洞的原理画成图贴在墙上。你告诉自己：这些不是故事，是教训。每一个被黑的合约，都在教你不要犯同样的错。',
      },
      {
        id: 'ship_fast_iterate',
        label: '快速上线，边跑边修',
        description: '完美是优秀的敌人，先让合约跑起来',
        hint: 'DeFi+8 · 压力+4 · 持仓+存款8% · 信念+3',
        hintColor: 'neutral',
        skillGains: { defiSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
          investPercent(s, 0.08);
        },
        log: '26岁，你把合约快速推上了主网。第一周就有几百刀的TVL，你兴奋得睡不着。但第二周你发现一个边界条件没处理好，差点被套利。你连夜打了补丁——快是快了，但心脏受不了这种刺激。',
      },
    ],
  },

  // 27岁：黑客松
  {
    id: 'builder_hackathon',
    title: '集结号',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    branch: 'chain_builder',
    ageRange: [27, 27],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你报名了一个48小时链上黑客松。队友是你在Discord上认识的两个陌生人——一个前端、一个做合约的。你们在共享文档里建了群，开赛前一小时才第一次语音。\n' +
      '"我们要做什么？"前端问。你看了一眼赛道主题"让十亿人上链"，说："做一个能帮小白一键进入DeFi的产品。"\n' +
      '48小时里你们没合眼。咖啡罐子空了五个，外卖盒堆成小山。你写了800行合约代码，前端把UI磨得能看，第四十七小时你们发现了三个bug，疯狂修补。提交前最后一分钟你按下"提交"按钮，然后瘫在椅子上，像一个跑完马拉松的人。',
    options: [
      {
        id: 'win_prize',
        label: '打磨产品冲奖，全力以赴',
        description: '既然来了就奔着第一名去',
        hint: 'DeFi+12 · 社区影响力+10 · 压力+12 · 健康-5 · 存款+15000(奖金)',
        hintColor: 'positive',
        skillGains: { defiSkill: 12, communityInfluence: 10 },
        savingsChange: 15000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '27岁，你们拿了黑客松第一名。奖金1.5万刀，更重要的是，台下的投资人递来了名片。你和队友拥抱的时候，眼里有泪。48小时前你们还是陌生人，现在你们是战友。这就是链上社区的力量——靠代码结盟，不靠关系。',
      },
      {
        id: 'network_focus',
        label: '重在参与，目标是认识人',
        description: '名次不重要，混圈子才是正经事',
        hint: '社区影响力+12 · DeFi+6 · 压力+4 · 信念+4',
        hintColor: 'neutral',
        skillGains: { communityInfluence: 12, defiSkill: 6 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '27岁，你们没拿奖，但你加了三十个人的微信和Discord。一个做协议的团队邀请你加入他们的开发者群，一个KOL说"你那个产品idea不错，要不要聊聊"。你发现：黑客松最大的奖品不是奖金，是人脉。',
      },
      {
        id: 'keep_building',
        label: '赛后继续打磨这个产品',
        description: '黑客松只是起点，把demo变成真产品',
        hint: 'DeFi+12 · 压力+8 · 存款-5000 · 信念+8',
        hintColor: 'positive',
        skillGains: { defiSkill: 12 },
        savingsChange: -5000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '27岁，黑客松结束后你没停下，和队友把demo继续做成了MVP。你们给它起了个名字，注册了域名，发到了开发者论坛。第一个用户留言"这东西有用"——你盯着那条留言，比拿奖还开心。',
      },
    ],
  },

  // 28-29岁：安全审计
  {
    id: 'builder_security_audit',
    title: '拆弹',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    branch: 'chain_builder',
    ageRange: [28, 29],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => !hasAbandonedCrypto(s),
    narrative:
      '你的协议TVL涨到了500万刀。一个资深开发者私信你："兄弟，你这个量级不上审计就是在裸奔。一个reentrancy漏洞，一晚上就能让你上头条。"\n' +
      '你知道他说得对。但你查了查顶级审计公司的报价——一次完整审计要5到15万刀，而且要排队两个月。你的协议还没有收入，这笔钱从哪来？\n' +
      '更纠结的是：审计过程中发现漏洞怎么办？修了要重新审计，不修就是定时炸弹。你第一次理解了为什么DeFi项目方说"安全是奢侈品"——不是不想安全，是安全的代价有时候比被黑的代价还高。',
    options: [
      {
        id: 'top_audit_firm',
        label: '砸钱请顶级审计公司，宁可慢不可错',
        description: 'CertiK、Trail of Bits，用最好的',
        hint: 'DeFi+12 · 存款-80000 · 压力+8 · 信念+10 · 持仓+存款15%(信任溢价)',
        hintColor: 'positive',
        skillGains: { defiSkill: 12 },
        savingsChange: -80000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          investPercent(s, 0.15);
        },
        log: '28岁，你咬牙请了顶级审计公司。审计发现了两个中危漏洞，你修了三天三夜。审计报告挂上官网那天，TVL一天涨了200万——用户用脚投票，安全感就是流量。你明白了：在DeFi里，审计报告是最好的营销。',
      },
      {
        id: 'community_audit',
        label: '发起社区赏金审计，发动群众找bug',
        description: '悬赏找漏洞，用众包代替昂贵审计',
        hint: 'DeFi+10 · 社区影响力+12 · 存款-20000 · 压力+6 · 信念+6',
        hintColor: 'neutral',
        skillGains: { defiSkill: 10, communityInfluence: 12 },
        savingsChange: -20000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '28岁，你在社区发了漏洞赏金计划，最高悬赏5万刀。一周内收到了40份报告，其中3个是真漏洞。你修了漏洞，发了赏金，社区的信任度反而更高了——透明本身就是最好的安全证明。',
      },
      {
        id: 'self_audit_delay',
        label: '自己审计，先省这笔钱',
        description: '我对自己的代码最熟，再过几遍就行',
        hint: 'DeFi+8 · 压力+12 · 信念-3 · 持仓-30%(被盗)',
        hintColor: 'danger',
        skillGains: { defiSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 3, 0, 100);
          losePercent(s, 0.30);
        },
        log: '28岁，你决定自己再审一遍代码。你确实很熟，但"熟悉"恰恰是盲区——你永远看不见自己的逻辑漏洞。三个月后一个小套利者利用了你没发现的边界条件，薅走了几万刀。你看着那笔被转走的资金，悔得肠子都青了。',
      },
    ],
  },

  // 30岁：主网发布
  {
    id: 'builder_mainnet_launch',
    title: '点火',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    branch: 'chain_builder',
    ageRange: [30, 30],
    priority: 7,
    weight: 9,
    oncePerGame: true,
    eventType: 'milestone',
    conditions: (s) => getChainHoldings(s) > 0,
    narrative:
      '主网上线的日子定了。你为此准备了半年——合约审计完成、前端打磨五轮、文档写了80页、社区预热了一个月。\n' +
      '上线前夜你没睡着。你把合约代码又通读了一遍，把部署脚本dry-run了三次，把应急预案演练了两遍。你设了四个闹钟——T-12h、T-6h、T-2h、T-0。\n' +
      'T-0那一刻你按下部署按钮，区块确认的那15秒是你人生最长的15秒。然后——成功。你的协议正式在主网运行。第一笔用户交易进来的那一刻，你在Discord里发了一句："We are live." 群里炸了。你靠在椅背上，眼泪掉了下来。',
    options: [
      {
        id: 'scale_team',
        label: '扩张团队，把协议做成生态',
        description: '从个人开发者转型为团队领导者',
        hint: 'DeFi+12 · 社区影响力+10 · 压力+12 · 月薪+3000 · 存款-20000',
        hintColor: 'positive',
        skillGains: { defiSkill: 12, communityInfluence: 10 },
        savingsChange: -20000,
        salaryChange: 3000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
        },
        log: '30岁，你的协议主网上线后TVL一周破千万。你招了五个全职开发者，从"一个人写代码"变成了"管一群人写代码"。你不习惯开会，但你发现：一个人能写一个合约，但一个生态需要一个团队。',
      },
      {
        id: 'solo_optimize',
        label: '保持精简，一个人继续打磨协议',
        description: '船小好掉头，拒绝膨胀',
        hint: 'DeFi+12 · 压力+8 · 信念+8 · 持仓+存款20%(协议分红)',
        hintColor: 'positive',
        skillGains: { defiSkill: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          investPercent(s, 0.20);
        },
        log: '30岁，你拒绝了VC的钱和扩张的诱惑，保持一个人+两个兼职的配置。协议TVL没爆，但稳定增长，每次更新都是你亲手写的代码。你享受这种"每行代码都是自己的"的感觉——慢，但纯粹。',
      },
      {
        id: 'token_launch',
        label: '发币融资，用代币经济加速增长',
        description: '发治理代币，用激励吸引用户和流动性',
        hint: 'DeFi+10 · 社区影响力+12 · 压力+15 · 持仓×1.8 · 信念+6 · 风险扩大',
        hintColor: 'danger',
        skillGains: { defiSkill: 10, communityInfluence: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          scaleChainHoldings(s, 1.8);
        },
        log: '30岁，你发了治理代币。空投那天社区沸腾，TVL一周翻了五倍。但你多了新的焦虑：代币价格、流动性、社区治理、监管风险——你不再只是个写代码的人，你成了一个"项目方"。权力大了，枷锁也多了。',
      },
    ],
  },

  // 31-32岁：漏洞悬赏与白帽
  {
    id: 'builder_bug_bounty',
    title: '白帽',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    branch: 'chain_builder',
    ageRange: [31, 32],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    conditions: (s) => !hasAbandonedCrypto(s),
    narrative:
      '凌晨两点你收到一封加密邮件："我在你的合约里发现了一个critical漏洞，可以清空所有资金。我没有利用它。请联系。"\n' +
      '你的血凉了半截。你打开合约代码，沿着对方描述的路径推演——是真的。一个你从未想到的重入路径，理论上可以让攻击者提走所有TVL。\n' +
      '对方是白帽黑客，只想要合理的赏金。你面前有两个选择：老实给赏金、修复漏洞、公开致谢；或者赖账、假装没这回事。你知道在这个圈子里，白帽的信誉就是一切——赖一次账，以后再也不会有人提前通知你了。',
    options: [
      {
        id: 'pay_bounty_generously',
        label: '慷慨支付赏金，公开致谢',
        description: '白帽是DeFi的免疫系统，要保护他们',
        hint: 'DeFi+12 · 社区影响力+12 · 存款-50000 · 信念+10 · 持仓+存款15%(信任)',
        hintColor: 'positive',
        skillGains: { defiSkill: 12, communityInfluence: 12 },
        savingsChange: -50000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          investPercent(s, 0.15);
        },
        log: '31岁，你给了白帽5万刀赏金，修复了漏洞，并公开写了一篇复盘。社区的反响出乎意料地好——用户说"这个团队靠谱，出事了敢认"。你花5万刀买了一次危机公关，赚回了十倍的信任。',
      },
      {
        id: 'negotiate_down',
        label: '压价谈判，给最低赏金',
        description: '能省则省，漏洞又没真被利用',
        hint: 'DeFi+8 · 存款-15000 · 信念-5 · 社区影响力-3',
        hintColor: 'neutral',
        skillGains: { defiSkill: 8 },
        savingsChange: -15000,
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
        },
        log: '31岁，你和白帽磨了一周，把赏金从5万砍到了1.5万。白帽收了钱，但再没和你说过话。后来你在别的社区看到他发帖"某些项目方不值得帮"。你省了3.5万，但失去了整个白帽圈的信任。这笔账，你算亏了。',
      },
      {
        id: 'join_whitehat',
        label: '自己也加入白帽社区，开始审计别人的协议',
        description: '从被审计者变成审计者',
        hint: 'DeFi+12 · 社区影响力+8 · 压力+6 · 被动收入+10000/年 · 信念+8',
        hintColor: 'positive',
        skillGains: { defiSkill: 12, communityInfluence: 8 },
        passiveIncomeChange: 10000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '31岁，那次白帽事件让你入了坑——你开始审计别人的协议，找漏洞、拿赏金。你发现：审计比写代码更锻炼安全直觉。你从"造炸弹的人"变成了"拆炸弹的人"，两头的技术都精进了。',
      },
    ],
  },

  // 33-34岁：DeFi协议设计
  {
    id: 'builder_protocol_design',
    title: '造物主',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    branch: 'chain_builder',
    ageRange: [33, 34],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => !hasAbandonedCrypto(s),
    narrative:
      '你开始设计一个全新的DeFi协议——一个你构思了两年的衍生品协议。不是fork别人的代码，是从零设计经济模型、清算机制、预言机集成。\n' +
      '你在白板上画了三十多版架构图。每一个参数都牵动着无数变量：保证金率定高了没人用，定低了清算不完；预言机延迟一秒，套利者就能薅一层。你像一个造物主，在设定一个微型经济体的物理法则。\n' +
      '但你也是最清醒的那个人——你知道每一个DeFi协议都是一场社会实验。你写的不是代码，是一套激励人行为的规则。规则设计得好，人人受益；设计得差，人人互割。你手里的键盘，比任何K线都更接近"改变世界"四个字。',
    options: [
      {
        id: 'rigorous_modeling',
        label: '做严谨的经济模型仿真，反复压力测试',
        description: '用数学和模拟确保极端行情下不崩',
        hint: 'DeFi+12 · 压力+10 · 健康-4 · 信念+8 · 存款-10000',
        hintColor: 'positive',
        skillGains: { defiSkill: 12 },
        savingsChange: -10000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.health = clamp(s.health - 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '33岁，你花了四个月做蒙特卡洛仿真，模拟了一万种极端行情。你发现协议在"闪崩+预言机延迟"的组合下会资不抵债，于是设计了保险池机制。上线后真的遇到了一次闪崩，你的保险池扛住了。你庆幸自己做了那些"无聊"的仿真。',
      },
      {
        id: 'open_design',
        label: '开放设计过程，邀请社区共同打磨',
        description: '把设计文档公开，集思广益',
        hint: 'DeFi+12 · 社区影响力+12 · 压力+6 · 信念+6 · 持仓+存款12%',
        hintColor: 'positive',
        skillGains: { defiSkill: 12, communityInfluence: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          investPercent(s, 0.12);
        },
        log: '33岁，你把协议设计文档发到了论坛，公开征集意见。两周内收到了200条反馈，其中有三条让你拍案叫绝。你把这些贡献者的名字写进了白皮书致谢页。协议还没上线，就有了一批"共创者"——这是最好的冷启动。',
      },
      {
        id: 'fork_existing',
        label: 'fork成熟协议，微调后快速上线',
        description: '不重复造轮子，站在巨人肩膀上',
        hint: 'DeFi+8 · 压力+4 · 持仓+存款10% · 信念+3 · 但缺乏壁垒',
        hintColor: 'neutral',
        skillGains: { defiSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
          investPercent(s, 0.10);
        },
        log: '33岁，你fork了一个成熟的协议代码，改了几个参数就上线了。快是真的快，但你心里清楚：fork来的东西没有灵魂，也没有护城河。三个月后出现了五个一模一样的fork，你的协议泯然众人。',
      },
    ],
  },

  // 35-36岁：团队与开源
  {
    id: 'builder_open_source',
    title: '回声',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    branch: 'chain_builder',
    ageRange: [35, 36],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    conditions: (s) => !hasAbandonedCrypto(s),
    narrative:
      '你把协议的核心合约开源了。GitHub上的star从0涨到了2000，有人开始提PR，有人在上面构建衍生产品，有人fork了你的代码做了改进版。\n' +
      '你看着那些commit记录，有一种奇妙的感觉——你的代码正在被你素未谋面的人使用、修改、传播。它不再只属于你，它属于整个生态。这就是开源的力量：你给出去的越多，你得到的越多。\n' +
      '但开源也有代价——竞争对手可以轻易复制你的创新。有人fork了你的协议，加了更激进的激励，抢走了你30%的用户。你看着那个几乎一模一样的竞品，第一次思考：在链上世界，开源到底是护城河，还是自毁城墙？',
    options: [
      {
        id: 'build_moat',
        label: '用生态和品牌建立护城河，不怕fork',
        description: '代码可以被复制，但社区和信任不能',
        hint: 'DeFi+10 · 社区影响力+12 · 压力+8 · 信念+8 · 持仓+存款18%',
        hintColor: 'positive',
        skillGains: { defiSkill: 10, communityInfluence: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          investPercent(s, 0.18);
        },
        log: '35岁，你没去打fork战，而是把精力投到了社区和生态上——办开发者工坊、设立生态基金、扶持基于你协议的衍生项目。半年后那个fork竞品因为缺乏社区支撑慢慢凉了，你的协议反而因为生态繁荣更强大了。你验证了一个道理：在开源世界，最大的护城河是"被需要"。',
      },
      {
        id: 'keep_iterating',
        label: '用技术迭代速度甩开fork',
        description: '你跑得比复制的人快就行',
        hint: 'DeFi+12 · 压力+10 · 健康-3 · 持仓+存款15% · 信念+5',
        hintColor: 'neutral',
        skillGains: { defiSkill: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          investPercent(s, 0.15);
        },
        log: '35岁，你开始每两周一次大版本更新，用迭代速度碾压fork。竞争对手刚抄完你的v2，你已经发了v3。你累得要死，但确实甩开了追兵。只是你隐隐觉得：靠速度维持的领先，终究是透支。',
      },
      {
        id: 'mentor_community',
        label: '带新人贡献者，把开源社区做大',
        description: '培养更多开发者，让生态自我繁衍',
        hint: '社区影响力+12 · DeFi+8 · 幸福+8 · 被动收入+8000/年 · 信念+6',
        hintColor: 'positive',
        skillGains: { communityInfluence: 12, defiSkill: 8 },
        passiveIncomeChange: 8000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '35岁，你开始在社区里带新人，写教程、review PR、解答问题。半年后你带出了五个core contributor，你的协议不再只靠你一个人维护。你第一次理解了"开源"的深层含义：不是把代码公开，是把权力分发。',
      },
    ],
  },

  // 37-38岁：生态合作与 Grants
  {
    id: 'builder_grants',
    title: '回环',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    branch: 'chain_builder',
    ageRange: [37, 38],
    priority: 5,
    weight: 6,
    oncePerGame: true,
    conditions: (s) => getChainHoldings(s) > 0,
    narrative:
      '你收到了一条消息——某顶级公链生态基金想给你一笔grant，邀请你的协议部署到他们的链上。条件是：你必须跨链，且要适配他们链的技术特性。\n' +
      '你犹豫了。跨链意味着安全风险翻倍——跨链桥是黑客最爱攻击的目标。但grant的钱很实在，而且那条链的用户基数大，是巨大的增量市场。\n' +
      '你想起一句话："在链上世界，孤岛会沉没。" 你的协议在原链上已经触及天花板，跨链是长大的必经之路。但你也知道，每一次跨链，都是在安全和发展之间走钢丝。',
    options: [
      {
        id: 'multi_chain',
        label: '接受grant，多链部署',
        description: '拥抱增量市场，承担跨链风险',
        hint: 'DeFi+12 · 社区影响力+10 · 存款+50000(grant) · 压力+10 · 持仓×1.4',
        hintColor: 'positive',
        skillGains: { defiSkill: 12, communityInfluence: 10 },
        savingsChange: 50000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          scaleChainHoldings(s, 1.4);
        },
        log: '37岁，你接受了grant，开始多链部署。TVL三个月翻了两倍，用户来自五条不同的链。但你每天都要监控跨链桥的安全状态——多链是增长，也是把鸡蛋放进了更多篮子，每个篮子都可能被偷。',
      },
      {
        id: 'stay_single_chain',
        label: '拒绝跨链，深耕单链做深做透',
        description: '不贪多，把一条链吃透',
        hint: 'DeFi+10 · 信念+8 · 压力-3 · 持仓+存款10%',
        hintColor: 'neutral',
        skillGains: { defiSkill: 10 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          investPercent(s, 0.10);
        },
        log: '37岁，你拒了跨链邀请，专注把单链版本做到极致。你成了那条链上最稳的协议，用户黏性极高。你错过了增量市场，但换来了零跨链安全事故。你告诉自己：有些钱不赚，是为了能长久地赚。',
      },
      {
        id: 'build_own_bridge',
        label: '自己研发安全的跨链方案',
        description: '不依赖第三方桥，把安全握在自己手里',
        hint: 'DeFi+12 · 压力+15 · 健康-4 · 存款-20000 · 信念+10 · 持仓×1.3',
        hintColor: 'danger',
        skillGains: { defiSkill: 12 },
        savingsChange: -20000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.health = clamp(s.health - 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          scaleChainHoldings(s, 1.3);
        },
        log: '37岁，你没接受现成的跨链桥，而是花了半年自己研发了一套基于零知识证明的跨链方案。研发过程九死一生，但上线后再没出过安全事故。你的协议因为"最安全的跨链"成了行业标杆。有些路难走，但难走的路上没有挤满人。',
      },
    ],
  },

  // 39-40岁：协议成熟与传承
  {
    id: 'builder_legacy',
    title: '丰碑',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    branch: 'chain_builder',
    ageRange: [39, 40],
    priority: 7,
    weight: 9,
    oncePerGame: true,
    eventType: 'milestone',
    conditions: (s) => getChainHoldings(s) > 0 && getSkill(s, 'defiSkill') >= 55,
    narrative:
      '你的协议在链上运行了五年。经历了两次牛熊、三次黑客攻击尝试（全部挡住）、一次跨链桥事故（不是你的）。TVL稳定在数亿，每天处理着上万笔交易。\n' +
      '你看着GitHub上的commit历史，从第一行"Hello World"到现在的十万行代码，那是你半生的指纹。你写的合约正在替无数陌生人自动执行着借贷、交易、清算——没有你的干预，它自己运转得很好。\n' +
      '现在你要做一个决定：继续亲自掌舵，还是把协议交给社区，让它真正成为"无主"的去中心化协议——就像你当年信奉的那样。',
    options: [
      {
        id: 'full_decentralization',
        label: '完全去中心化，把控制权交给DAO',
        description: '践行你最初的信仰——代码不属于任何人',
        hint: 'DeFi+12 · 社区影响力+12 · 信念+12 · 压力-8 · 被动收入+40000/年',
        hintColor: 'positive',
        skillGains: { defiSkill: 12, communityInfluence: 12 },
        passiveIncomeChange: 40000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.happiness = clamp(s.happiness + 10, 0, 100);
        },
        log: '39岁，你把协议的多签权限移交给了DAO，自己只保留了一个顾问角色。协议在社区治理下继续运转，你终于成了那个"写了代码然后放手"的人。你兑现了最初的信仰：去中心化不是技术，是承诺。你现在可以关掉电脑，因为你的代码已经不需要你了。',
      },
      {
        id: 'stay_as_guardian',
        label: '保留核心技术角色，做协议守护者',
        description: '完全放手不放心，继续做技术守门人',
        hint: 'DeFi+12 · 信念+8 · 压力+6 · 被动收入+15000/年 · 持仓×1.2',
        hintColor: 'neutral',
        skillGains: { defiSkill: 12 },
        passiveIncomeChange: 15000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          scaleChainHoldings(s, 1.2);
        },
        log: '39岁，你保留了协议的紧急多签权限，继续做那个"最后一道防线"。你知道完全去中心化是理想，但现实需要有人守夜。你成了一个既相信去中心化、又接受现实妥协的人。也许这就是成熟：不是放弃理想，是知道理想需要时间。',
      },
      {
        id: 'new_protocol',
        label: '开启新协议，把旧协议交给团队',
        description: '老兵不死，只是换了战场',
        hint: 'DeFi+12 · 压力+12 · 健康-3 · 存款-30000 · 信念+10',
        hintColor: 'danger',
        skillGains: { defiSkill: 12 },
        savingsChange: -30000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
        },
        log: '39岁，你把旧协议交给了团队，自己开始构思一个全新的协议——一个你构思了三年的链上身份系统。你不满足于"守住一个成功"，你要继续造。有人问你"图什么"，你说："造物主停下来的时候，就是世界停止进化的时候。"',
      },
    ],
  },
];

// ============================================================
// 坚定持有线事件（ages 26-40）
// ============================================================

const hodlerEvents: NarrativeEvent[] = [

  // 26岁：深熊考验
  {
    id: 'hodler_deep_bear',
    title: '凛冬',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    branch: 'chain_hodler',
    ageRange: [26, 26],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    conditions: (s) => getChainHoldings(s) > 0,
    narrative:
      '熊市来了，深不见底的那种。你的持仓从高点跌了75%。社群里每天有人宣布"清仓退圈"，曾经热闹的讨论组只剩下几个头像还亮着。\n' +
      '你的家人开始旁敲侧击："那个币的事……还行吧？"你笑着说"没事"，转头打开行情，看着那条绿油油的曲线，胃又开始抽搐。\n' +
      '凌晨三点你刷到一条推文："90%的加密项目活不过这个冬天。"你看着自己持仓里的十几个代币，第一次认真想：哪些是能活过冬天的树，哪些是会被雪压断的枝？HODL不是无脑死扛，HODL是有信仰地选择。',
    options: [
      {
        id: 'rebalance_quality',
        label: '去弱留强，把仓位集中到龙头',
        description: '熊市是洗牌，趁机优化持仓结构',
        hint: '交易能力+8 · 信念+8 · 压力+6 · 持仓×0.9(换仓损耗)但更抗跌',
        hintColor: 'positive',
        skillGains: { tradingSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          scaleChainHoldings(s, 0.9);
        },
        log: '26岁，你花了一周研究每个持仓项目的基本面，清掉了七个你其实不懂的"土狗"，把仓位集中到了三个龙头。换仓有损耗，但你的持仓质量提升了一个档次。你学会了HODL的第一课：不是什么都扛，是扛值得扛的。',
      },
      {
        id: 'diamond_hands_pure',
        label: '一个不卖，纯钻石手',
        description: '最深的黑暗之后就是黎明',
        hint: '信念+12 · 压力+12 · 健康-3 · 持仓不变(×0.25市值)',
        hintColor: 'neutral',
        skillGains: {},
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          scaleChainHoldings(s, 0.7);
        },
        log: '26岁，你一个币都没卖。你在社群里发了一句"Winter is coming, but spring always follows"，获赞无数。但你晚上睡不着——不是怕归零，是怕自己"信仰"错了，却用"坚持"掩饰恐惧。',
      },
      {
        id: 'accumulate_bear',
        label: '逆势定投，在底部加仓',
        description: '最好的HODL是在别人绝望时买入',
        hint: '交易能力+6 · 信念+10 · 压力+8 · 存款-10000 · 持仓×1.3(加仓)',
        hintColor: 'danger',
        skillGains: { tradingSkill: 6 },
        savingsChange: -10000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          scaleChainHoldings(s, 1.3);
        },
        log: '26岁，你在熊市最黑暗的时候继续定投。每次买入都像往深渊里扔钱，但你知道：熊市的每一笔买入，都是牛市的子弹。两年后回过头看，那段时间是你整个持仓成本最低的部分——钻石手不只是握住，是在恐惧中张开。',
      },
    ],
  },

  // 27岁：第一次DAO投票
  {
    id: 'hodler_first_dao_vote',
    title: '一人一票',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    branch: 'chain_hodler',
    ageRange: [27, 27],
    priority: 5,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你持仓的一个协议发起了第一次DAO治理提案——要不要把金库的30%用来做开发者激励？你点开提案，发现投票界面里你的代币数量对应着你的投票权重。\n' +
      '你第一次意识到：HODL不只是"拿着等涨"，你的持仓给了你话语权。你不是一个旁观者，你是一个股东、一个公民、一个治理者。\n' +
      '你认真读了提案、读了论坛里的辩论、读了核心团队的AMA。你发现治理比交易复杂得多——这不是猜涨跌，是在为这个协议的未来做决定。你手里的票，比你的币更重。',
    options: [
      {
        id: 'vote_informed',
        label: '深入研究后投出庄严一票',
        description: '认真履行治理责任',
        hint: '社区影响力+12 · 信念+8 · 压力+4 · 持仓+存款5%(治理奖励)',
        hintColor: 'positive',
        skillGains: { communityInfluence: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          investPercent(s, 0.05);
        },
        log: '27岁，你花了两周研究提案，在论坛发了一篇长文分析利弊，最后投了赞成票。你的分析被核心团队转发了，有人留言"这才是真正的DAO参与者"。你第一次觉得：HODL的最高境界，是用手里的币去塑造你信仰的世界。',
      },
      {
        id: 'delegate_vote',
        label: '把票委托给信得过的代表',
        description: '不是每个人都有时间研究每个提案',
        hint: '社区影响力+6 · 信念+4 · 压力-2',
        hintColor: 'neutral',
        skillGains: { communityInfluence: 6 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 2, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 4, 0, 100);
        },
        log: '27岁，你把投票权委托给了一个你长期关注的KOL。他比你更懂技术细节，也更有时间。你保留了对他的监督权——如果他投得不对，你会撤回委托。你理解了DAO的精髓：代议制不是偷懒，是分工。',
      },
      {
        id: 'run_for_delegate',
        label: '参选DAO代表，争取更大的话语权',
        description: '与其委托别人，不如自己成为被委托的人',
        hint: '社区影响力+12 · 压力+10 · 信念+10 · 持仓+存款8% · 被动收入+3000/年',
        hintColor: 'positive',
        skillGains: { communityInfluence: 12 },
        passiveIncomeChange: 3000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          investPercent(s, 0.08);
        },
        log: '27岁，你竞选了DAO代表，凭借你在社群的长期贡献成功当选。从此你不仅要为自己的币负责，还要为委托给你的几千票负责。压力大了，但你觉得值——你从一个HODLer变成了一个"链上公民"。',
      },
    ],
  },

  // 28-29岁：社区建设
  {
    id: 'hodler_community_build',
    title: '同路人',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    branch: 'chain_hodler',
    ageRange: [28, 29],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '你在社群里待了三年，从潜水者变成了"老人"。新来的小白会@你问问题，恐慌的时候会有人私信你"哥，要不要跑"。\n' +
      '你建了一个小群，三十个人，都是熊市里没走的老HODLer。你们不聊行情，聊信仰、聊技术、聊"为什么我们还在"。群里有人失业了，有人离婚了，有人被家里赶出来了——但所有人都没卖币。\n' +
      '你忽然明白：HODL从来不是一个人的事。在这个充满质疑的世界里，你需要一群"同路人"互相确认"我们没疯"。社区不是工具，社区是信仰的氧气。',
    options: [
      {
        id: 'build_formal_community',
        label: '把小群发展成正式社区',
        description: '做一个有门槛、有文化的HODLer社区',
        hint: '社区影响力+12 · 信念+10 · 压力+6 · 被动收入+5000/年',
        hintColor: 'positive',
        skillGains: { communityInfluence: 12 },
        passiveIncomeChange: 5000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
        },
        log: '28岁，你的小群发展成了一个500人的正式社区，有入群问答、有每周分享、有"钻石手荣誉墙"。你成了这个社区的精神领袖，但你拒绝收任何"会费"——你说"信仰不该标价"。社区的人反而更死心了。',
      },
      {
        id: 'content_creation',
        label: '开始系统创作HODL哲学内容',
        description: '用文字和视频传递长期主义信念',
        hint: '社区影响力+12 · 信念+8 · 压力+4 · 被动收入+8000/年',
        hintColor: 'positive',
        skillGains: { communityInfluence: 12 },
        passiveIncomeChange: 8000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '28岁，你开始写"一个HODLer的熊市日记"，每周一篇。没有喊单、没有预测，只有你作为一个普通持有者的恐惧、坚持和思考。这些文字在熊市里像篝火一样，温暖了一群瑟瑟发抖的人。你发现：真诚的内容，比任何K线分析都有力量。',
      },
      {
        id: 'support_newbies',
        label: '一对一帮新手避坑',
        description: '不让新人重蹈你当年的覆辙',
        hint: '社区影响力+10 · 信念+6 · 幸福+8 · 压力+3',
        hintColor: 'neutral',
        skillGains: { communityInfluence: 10 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '28岁，你成了社区的"新手辅导员"。你帮几十个新人避开了土狗、避开了骗局、避开了冲动杠杆。有人后来赚了钱给你发红包，你退回去了。你说"当年没人帮我，我亏了很多。现在轮到我了。"',
      },
    ],
  },

  // 30岁：信仰的终极考验
  {
    id: 'hodler_conviction_test',
    title: '炼金',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    branch: 'chain_hodler',
    ageRange: [30, 30],
    priority: 7,
    weight: 9,
    oncePerGame: true,
    eventType: 'milestone',
    conditions: (s) => getChainHoldings(s) > 0,
    narrative:
      '牛市回来了。你的持仓从底部翻了近一倍。账面浮盈的数字大到让你手抖——这笔钱够买房、够结婚、够让爸妈闭嘴。\n' +
      '全社群都在喊"卖不卖"。有人说"落袋为安"，有人说"这才刚开始"。你的伴侣看着那个数字问你："要不……卖点？"你妈打电话来："听说你那个币涨了？要不兑现点？"\n' +
      '这是HODLer最难的时刻——不是熊市的恐惧，是牛市的诱惑。熊市里你只需要"不卖"，牛市里你要回答"为什么不卖"。你的信仰到底是"相信区块链的未来"，还是只是"舍不得卖"？这个区别，决定了你是先知还是赌徒。',
    options: [
      {
        id: 'take_some_off',
        label: '卖掉一部分，回收本金',
        description: '落袋为安不是背叛，是活下去的智慧',
        hint: '交易能力+8 · 信念+5 · 压力-10 · 持仓×0.5 · 存款+50000 · 幸福+8',
        hintColor: 'positive',
        skillGains: { tradingSkill: 8 },
        savingsChange: 50000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 10, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          scaleChainHoldings(s, 0.5);
        },
        log: '30岁，你卖掉了一半持仓，收回了本金和一倍利润。剩下的"用利润跑"，心态完全不一样了。你给爸妈转了一笔钱，附言"这不是传销"。你终于理解了HODL的真谛：不是永远不卖，是知道什么时候该卖、卖多少、为什么卖。',
      },
      {
        id: 'diamond_hands_peak',
        label: '一个不卖，信仰到底',
        description: '十倍不算什么，这是百年级别的革命',
        hint: '信念+12 · 压力+15 · 持仓不变 · 健康-5',
        hintColor: 'danger',
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
        },
        log: '30岁，你一个没卖。你在群里发了一句"Diamond hands don\'t fold"。三个月后市场回调40%，你的浮盈缩水了一半。你没后悔——但你也第一次承认：信仰和固执，有时候只有一线之隔。',
      },
      {
        id: 'systematic_exit',
        label: '设计系统化退出计划，分批止盈',
        description: '不靠感觉，靠规则',
        hint: '交易能力+12 · 信念+8 · 压力+4 · 持仓×0.7 · 存款+80000',
        hintColor: 'positive',
        skillGains: { tradingSkill: 12 },
        savingsChange: 80000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          scaleChainHoldings(s, 0.7);
        },
        log: '30岁，你没凭感觉操作，而是写了一份"退出计划"：每涨50%卖10%，触发某指标再卖20%。你像执行交易系统的交易员一样执行自己的HODL策略。你发现：最好的HODLer也需要一点点交易员的纪律。',
      },
    ],
  },

  // 31-32岁：穿越FUD
  {
    id: 'hodler_fud_storm',
    title: '风暴眼',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    branch: 'chain_hodler',
    ageRange: [31, 32],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    conditions: (s) => getChainHoldings(s) > 0,
    narrative:
      '一场巨大的FUD（恐惧、不确定、怀疑）风暴席卷了你重仓的项目。起因是一个KOL发了一条"这个项目要跑路了"的推文，配合几张似是而非的截图。\n' +
      '社群恐慌了，代币一天跌了30%。你打开那个KOL的过往记录，发现他每次唱空某个项目后，都会低位买入。这是典型的"砸盘吃货"。\n' +
      '你面前有几条路：跟着恐慌卖出、加仓抄底、或者站出来用事实回击FUD。你看着社群里那些慌了神的新人，你知道你的每一个动作都会影响他们。HODLer的钻石手，不只是握住自己的币，是在风暴里成为别人的锚。',
    options: [
      {
        id: 'buy_the_fud',
        label: '逆势加仓，FUD是买入机会',
        description: '看穿了操纵，趁机吃货',
        hint: '交易能力+10 · 信念+10 · 压力+10 · 存款-15000 · 持仓×1.4',
        hintColor: 'danger',
        skillGains: { tradingSkill: 10 },
        savingsChange: -15000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          scaleChainHoldings(s, 1.4);
        },
        log: '31岁，你在FUD最猛的时候加仓了。两周后真相大白，项目方公布了完整数据，KOL删帖跑路，币价反弹60%。你的逆势加仓赚了一笔。但你也后怕——如果这次FUD是真的呢？逆向操作是勇气，也可能是傲慢。',
      },
      {
        id: 'debunk_publicly',
        label: '公开写文章拆解FUD，稳定军心',
        description: '用数据和逻辑对抗谣言',
        hint: '社区影响力+12 · 信念+8 · 压力+6 · 被动收入+3000/年',
        hintColor: 'positive',
        skillGains: { communityInfluence: 12 },
        passiveIncomeChange: 3000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '31岁，你花了一整天写了一篇FUD拆解文章，逐条反驳那个KOL的指控，扒出了他过往的砸盘记录。文章在社群刷屏，恐慌被平息了。那个KOL把你拉黑了，但你多了几千个感谢你的私信。',
      },
      {
        id: 'hold_quietly',
        label: '安静持有，不参与口水战',
        description: '事实会证明一切，不需要争辩',
        hint: '信念+8 · 压力+3 · 持仓不变',
        hintColor: 'neutral',
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '31岁，你没发声、没加仓、没卖出。你只是安静地拿着。两周后FUD不攻自破，你什么都没做，却什么都没失去。你学会了一件事：有时候最强大的动作，是不动。',
      },
    ],
  },

  // 33-34岁：成为思想领袖
  {
    id: 'hodler_thought_leader',
    title: '灯塔',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    branch: 'chain_hodler',
    ageRange: [33, 34],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    narrative:
      '你在这个圈子里待了十年。你经历过两次完整的牛熊，扛过无数次暴跌，见证过无数项目归零，也看到过几个改变世界的协议诞生。\n' +
      '不知道从什么时候开始，你成了社群里的"灯塔"。新人入场会来找你"取经"，媒体会找你"采访"，甚至有项目方请你"站台"。你的每一句话都可能影响成千上万人的决策。\n' +
      '这让你既荣幸又恐惧。你说错一句话，可能有人因此亏掉积蓄。你第一次理解了"影响力"的重量——它不是勋章，是责任。HODLer的终极形态，不是持有了多少币，是影响了多少人正确地理解和持有。',
    options: [
      {
        id: 'principled_voice',
        label: '坚持只说真话，不为任何项目站台',
        description: '影响力是公信力，不能用来变现',
        hint: '社区影响力+12 · 信念+12 · 压力+5 · 幸福+5 · 被动收入+12000/年',
        hintColor: 'positive',
        skillGains: { communityInfluence: 12 },
        passiveIncomeChange: 12000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 5, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
        },
        log: '33岁，你立了一条规矩：永远不为任何项目站台，只分享自己的真实判断。有项目方开价六位数请你喊单，你拒了。你的粉丝反而更多了——在这个充满喊单的圈子里，"不收钱说话"的人成了稀缺品。你的公信力，成了你最值钱的资产。',
      },
      {
        id: 'educate_systematically',
        label: '做系统性的区块链教育内容',
        description: '把十年的经验沉淀成课程和书',
        hint: '社区影响力+12 · 信念+8 · 压力+8 · 被动收入+15000/年',
        hintColor: 'positive',
        skillGains: { communityInfluence: 12 },
        passiveIncomeChange: 15000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '33岁，你花了半年写了一本《HODLer手册》，从技术原理到投资心理到社区治理，系统性地讲了一遍。书在圈内卖了两万册，成了新人的"必读"。你看着那些读者反馈"这本书救了我"，觉得比赚十倍还值。',
      },
      {
        id: 'shrink_from_spotlight',
        label: '刻意低调，不想当KOL',
        description: '影响力是枷锁，我只想做安静的持有者',
        hint: '社区影响力+5 · 信念+10 · 压力-5 · 幸福+6',
        hintColor: 'neutral',
        skillGains: { communityInfluence: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 5, 0, 100);
          s.happiness = clamp(s.happiness + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
        },
        log: '33岁，你拒绝了所有采访和站台邀请，把社群管理交给了信任的人，回归了一个"安静的HODLer"。你说"我不想成为别人的信仰，每个人应该有自己的判断"。有人不理解，但你觉得：真正的自由，是不被自己的影响力绑架。',
      },
    ],
  },

  // 35-36岁：DAO治理领导
  {
    id: 'hodler_dao_leadership',
    title: '议事厅',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    branch: 'chain_hodler',
    ageRange: [35, 36],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    narrative:
      '你被选为三个DAO的治理委员会成员。每周你要参加五场治理会议、审阅十份提案、协调两场社区辩论。你从一个"持有者"变成了一个"治理者"。\n' +
      '你发现DAO治理比任何公司政治都复杂。没有CEO拍板，每个决定都要投票；没有上下级，每个人都是"平等的"，但巨鲸的票永远比你多；没有HR，社区里吵架了只能靠"共识"来调停。你在一次激烈的提案辩论后，凌晨三点瘫在椅子上，第一次怀疑：去中心化治理，真的比中心化好吗？\n' +
      '但你又想起那些被中心化权力伤害过的人——被冻结账户的、被滥发货币稀释的、被单方面修改规则的。DAO可能低效、可能混乱，但至少，没人能单方面决定你的命运。这就是你信的东西。',
    options: [
      {
        id: 'governance_reform',
        label: '推动DAO治理改革，提升效率',
        description: '设计更高效的投票和提案机制',
        hint: '社区影响力+12 · DeFi+8 · 压力+10 · 信念+8 · 被动收入+10000/年',
        hintColor: 'positive',
        skillGains: { communityInfluence: 12, defiSkill: 8 },
        passiveIncomeChange: 10000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '35岁，你设计了一套"委托+ quadratic voting"的混合治理机制，在三个DAO推广。效率提升了一倍，巨鲸操纵空间被压缩了。你证明了：去中心化不等于低效，关键是机制设计。你成了DAO治理领域的"架构师"。',
      },
      {
        id: 'moderator_role',
        label: '做社区调和者，化解分裂',
        description: 'DAO最大的敌人不是外部，是内部分裂',
        hint: '社区影响力+12 · 信念+6 · 压力+6 · 幸福+5',
        hintColor: 'neutral',
        skillGains: { communityInfluence: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '35岁，你成了DAO里的"和事佬"。每次社区要分裂的时候，你站出来组织辩论、寻找共识。有人嫌你"和稀泥"，但更多的人感谢你"保住了社区"。你发现：治理的终极智慧，不是分出胜负，是让所有人觉得"虽然没全赢，但没输"。',
      },
      {
        id: 'step_back_governance',
        label: '退出治理一线，回归持有者本位',
        description: '治理太耗精力，我只想安安静静HODL',
        hint: '社区影响力+5 · 信念+10 · 压力-8 · 健康+5',
        hintColor: 'neutral',
        skillGains: { communityInfluence: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 8, 0, 100);
          s.health = clamp(s.health + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
        },
        log: '35岁，你辞去了所有DAO治理职务，退回了一个普通持有者的位置。你说"治理是年轻人的事，我老了，只想拿好我的币"。有人惋惜，有人理解。你看着那些接班的年轻人，觉得放心——火炬总会传下去的。',
      },
    ],
  },

  // 37-38岁：哲学思考
  {
    id: 'hodler_philosophy',
    title: '问号',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    branch: 'chain_hodler',
    ageRange: [37, 38],
    priority: 5,
    weight: 6,
    oncePerGame: true,
    conditions: (s) => getChainHoldings(s) > 0,
    narrative:
      '深夜你失眠了。不是因为行情，是因为一个想了很久的问题：你到底是"相信区块链"，还是只是"赌赢了不想承认是运气"？\n' +
      '你想起这十几年——你信过"去中心化能改变金融"，但DeFi里充满了黑客和骗局；你信过"代码即法律"，但代码是人写的，人会犯错；你信过"社区治理更公平"，但巨鲸永远比你更有话语权。\n' +
      '你坐在黑暗里，第一次诚实地面对自己：也许你信的那些东西，一半是真理，一半是自我安慰。但问题是——哪一半？如果连你自己都分不清，你怎么告诉那些叫你"老师"的人该信什么？',
    options: [
      {
        id: 'honest_essay',
        label: '写一篇"信仰的诚实"公开反思',
        description: '承认困惑，比假装笃定更接近真相',
        hint: '社区影响力+12 · 信念+12 · 幸福+8 · 压力-5',
        hintColor: 'positive',
        skillGains: { communityInfluence: 12 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
        },
        log: '37岁，你写了一篇《一个老HODLer的困惑》，坦白了自己所有的怀疑。你以为会掉粉，结果转发破万。最高赞评论是："终于有人说真话了。原来大佬也会迷茫。"你发现：诚实的困惑，比虚假的笃定更有力量。信仰不是不怀疑，是怀疑完了还选择相信。',
      },
      {
        id: 'study_deeply',
        label: '深入研究技术本质，用知识夯实信仰',
        description: '搞不懂就学懂，别用玄学代替科学',
        hint: 'DeFi+12 · 信念+10 · 压力+6 · 健康-3',
        hintColor: 'neutral',
        skillGains: { defiSkill: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
        },
        log: '37岁，你花了一年把区块链的技术底层重新学了一遍——从椭圆曲线加密到零知识证明，从共识机制到状态通道。你越学越确定一件事：技术是真实的，它确实在解决真实的问题。那些骗局和混乱是人性的，不是技术的。你的信仰从"感觉"变成了"理解"。',
      },
      {
        id: 'diversify_belief',
        label: '分散信仰，不全押在链上',
        description: '也许对冲才是最诚实的态度',
        hint: '交易能力+6 · 信念-3 · 压力-8 · 存款+30000 · 持仓×0.7',
        hintColor: 'neutral',
        skillGains: { tradingSkill: 6 },
        savingsChange: 30000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 3, 0, 100);
          scaleChainHoldings(s, 0.7);
        },
        log: '37岁，你把一部分链上资产转成了法币和指数基金。你跟自己说这叫"资产配置"，但你知道心里有个声音在说"你没那么信了"。不过你接受了这种不纯粹——也许成熟就是承认：没有任何东西值得你赌上全部。',
      },
    ],
  },

  // 39-40岁：最后的坚守
  {
    id: 'hodler_final_stand',
    title: '归途',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    branch: 'chain_hodler',
    ageRange: [39, 40],
    priority: 7,
    weight: 9,
    oncePerGame: true,
    eventType: 'milestone',
    conditions: (s) => getChainHoldings(s) > 0 && getSkill(s, 'communityInfluence') >= 55,
    narrative:
      '快40岁了。你身边的"同路人"换了一茬又一茬——牛市来、熊市走，真正从头到尾都在的，不到十个。你是其中之一。\n' +
      '你的持仓经历了两次牛熊，账面数字起起落落，但你的内核变了。你不再为涨跌心跳加速，不再和别人争论"区块链是不是骗局"，不再需要向任何人证明你是对的。你只是安静地持有，安静地参与，安静地相信。\n' +
      '有人问你"还要HODL多久"。你笑了。这个问题你已经不问了——HODL不是一个有终点的动作，它是一种生活方式。你不是在等一个价格，你是在过一种"相信去中心化"的人生。',
    options: [
      {
        id: 'partial_cash_out',
        label: '把一部分换成稳定币，过自由的生活',
        description: '兑现一部分信仰，但不全部离场',
        hint: '社区影响力+10 · 信念+10 · 压力-10 · 健康+5 · 被动收入+40000/年 · 持仓×0.5',
        hintColor: 'positive',
        skillGains: { communityInfluence: 10 },
        passiveIncomeChange: 40000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 10, 0, 100);
          s.health = clamp(s.health + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          scaleChainHoldings(s, 0.5);
        },
        log: '39岁，你把一半持仓换成了稳定币理财，另一半继续HODL。你第一次有了一种"够了"的感觉——不是贪婪够了，是焦虑够了。你关掉了最后一个行情闹钟，发现自己已经很久没在凌晨三点醒来了。',
      },
      {
        id: 'keep_hodling',
        label: '继续全部持有，HODL是一种信念',
        description: '只要区块链还在，我就不会走',
        hint: '社区影响力+12 · 信念+12 · 压力+3 · 持仓不变',
        hintColor: 'neutral',
        skillGains: { communityInfluence: 12 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
        },
        log: '39岁，你没卖。你看着那些早已变现离场的"聪明人"，和那些死扛到底的"傻子"——你不知道谁是赢家，但你知道自己是谁。你是一个HODLer，从头到尾。这不是固执，这是你和这个世界相处的方式。',
      },
      {
        id: 'mentor_next_gen',
        label: '把火炬交给下一代HODLer',
        description: '退居幕后，培养接班人',
        hint: '社区影响力+12 · 信念+10 · 幸福+10 · 压力-5 · 被动收入+15000/年',
        hintColor: 'positive',
        skillGains: { communityInfluence: 12 },
        passiveIncomeChange: 15000,
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
        },
        log: '39岁，你把社区交给了三个你带出来的年轻人，自己退成了"荣誉顾问"。你看着他们在群里活跃的样子，像看到了十几年前的自己。你没有离开，你只是换了一种存在方式——从台前到幕后，从持有者到传承者。',
      },
    ],
  },
];

// ============================================================
// 跨分支事件（ages 26-40，不限分支）
// ============================================================

const crossBranchEvents: NarrativeEvent[] = [

  // 28岁：大牛市全民狂欢
  {
    id: 'cross_bull_euphoria',
    title: '盛宴',
    sceneTag: 'lottery',
    pathId: 'chain_native',
    ageRange: [28, 28],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    conditions: (s) => getChainHoldings(s) > 0 && !hasAbandonedCrypto(s),
    narrative:
      '牛市来了，是那种"连你妈都问你买什么币"的疯牛。你的持仓一个月翻了三倍，朋友圈里晒收益的截图比晒饭的还多。\n' +
      '出租车司机在聊链上套利，理发店小哥问你"哪个交易所好用"，你妈转发给你一篇《普通人如何抓住加密财富红利》。空气里弥漫着一种"人人都是天才"的幻觉。\n' +
      '你清醒地知道，这正是最危险的时刻。当所有人都觉得自己是股神的时候，镰刀正在磨得锃亮。但你的持仓确实在涨，你的多巴胺确实在分泌——理性和贪婪在你脑子里打架，谁都赢不了谁。',
    options: [
      {
        id: 'take_profit_calmly',
        label: '冷静减仓，落袋一部分',
        description: '盛宴总会散场，先吃饱再说',
        hint: '交易能力+10 · 信念+6 · 压力-5 · 持仓×0.7 · 存款+50000',
        hintColor: 'positive',
        skillGains: { tradingSkill: 10 },
        savingsChange: 50000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
          scaleChainHoldings(s, 0.7);
        },
        log: '28岁，你在全民狂欢的时候悄悄减了仓。朋友们笑你"胆小"，你笑笑不说话。两个月后暴跌来临，那些晒截图的人删了朋友圈，而你的口袋里装着落袋的利润。你又一次验证了那句话：别人贪婪我恐惧。',
      },
      {
        id: 'ride_the_bull',
        label: '顺势加仓，让利润奔跑',
        description: '牛市不赚够，熊市拿什么扛',
        hint: '交易能力+8 · 压力+12 · 持仓×1.5 · 信念+5 · 健康-3',
        hintColor: 'danger',
        skillGains: { tradingSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          scaleChainHoldings(s, 1.5);
        },
        log: '28岁，你在牛市里加了仓。前两周账面又涨了一倍，你觉得自己就是中本聪转世。第三周一个黑天鹅，利润回吐大半。你盯着那条垂直下跌的K线，第一次明白：牛市的利润不是你的，只有落袋的才是。',
      },
      {
        id: 'help_newcomers',
        label: '趁机做新手教育，帮人避坑',
        description: '全民进场时是最需要教育的时候',
        hint: '社区影响力+12 · 信念+8 · 压力+4 · 被动收入+6000/年',
        hintColor: 'positive',
        skillGains: { communityInfluence: 12 },
        passiveIncomeChange: 6000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '28岁，你趁牛市做了一系列"新手避坑指南"，阅读量破百万。有人因此没买土狗、没碰高杠杆、没把私钥交给陌生人。你不知道救了多少人的积蓄，但你知道：在狂欢里泼冷水的人，才是真朋友。',
      },
    ],
  },

  // 31岁：监管大新闻
  {
    id: 'cross_regulation_news',
    title: '铁拳',
    sceneTag: 'crisis',
    pathId: 'chain_native',
    ageRange: [31, 31],
    priority: 6,
    weight: 8,
    oncePerGame: true,
    narrative:
      '早上你刷到一条新闻：某大国宣布全面禁止加密货币交易，要求所有交易所关停。市场应声暴跌15%，社群炸了锅。\n' +
      '有人喊"完了"，有人喊"利好去中心化"，有人开始研究怎么用VPN和海外交易所绕过监管。你的持仓在缩水，但更让你焦虑的是：你所在的地区会不会也跟进？\n' +
      '你第一次认真面对一个现实——你信的"去中心化"是技术的，但你是活在一个有国界、有法律、有执法权的现实世界里的。链上没有央行，但链下有警察。你的自由，到底有多自由？',
    options: [
      {
        id: 'go_global',
        label: '资产和身份全球化，分散 jurisdiction 风险',
        description: '不把鸡蛋放在一个国家的篮子里',
        hint: '交易能力+8 · DeFi+5 · 存款-20000 · 压力+8 · 信念+6',
        hintColor: 'neutral',
        skillGains: { tradingSkill: 8, defiSkill: 5 },
        savingsChange: -20000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '31岁，你开始研究海外银行账户、第二身份、跨司法管辖区的资产配置。花了大半年和不少钱，但你把风险分散到了三个国家。你第一次理解了"主权个人"的含义——自由不是免费的，是用复杂度和成本换来的。',
      },
      {
        id: 'stay_local_compliant',
        label: '留在本地，做好合规准备',
        description: '不跑，但在规则内寻找空间',
        hint: '社区影响力+6 · 信念+5 · 压力+4 · 存款-5000(律师费)',
        hintColor: 'neutral',
        skillGains: { communityInfluence: 6 },
        savingsChange: -5000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '31岁，你请了律师，把自己的持仓和操作做了合规梳理。你没跑，但你做好了"最坏情况"的准备。你告诉自己：真正的去中心化不是逃避法律，是在法律框架内最大化你的自由。',
      },
      {
        id: 'defi_pivot',
        label: '把资产全部转入DeFi，远离中心化交易所',
        description: '监管管得了交易所，管不了智能合约',
        hint: 'DeFi+10 · 信念+10 · 压力+6 · 持仓不变',
        hintColor: 'positive',
        skillGains: { defiSkill: 10 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
        },
        log: '31岁，你把所有资产从中心化交易所提到了自托管钱包，全部转入了DeFi协议。监管能关停交易所，但关不掉智能合约。你第一次真正理解了"去中心化"的价值——它不是效率工具，是抗审查的护身符。',
      },
    ],
  },

  // 33岁：伴侣的压力
  {
    id: 'cross_partner_pressure',
    title: '看不见的钱',
    sceneTag: 'breakup',
    pathId: 'chain_native',
    ageRange: [33, 33],
    priority: 5,
    weight: 7,
    oncePerGame: true,
    conditions: (s) => (s.isMarried || (s.partner !== null)) && !hasAbandonedCrypto(s),
    narrative:
      '深夜你伴侣翻你手机，看到了交易所APP和一堆看不懂的英文界面。第二天早上TA红着眼睛问你："你到底有多少钱是我看不见的？"\n' +
      '你愣住了。你从来没隐瞒，但也从来没主动说过——那些助记词、那些链上地址、那些冷钱包里的资产，在TA眼里像是一个"影子账户"。\n' +
      'TA说："我不是要管你的钱，我是怕你出事了我什么都拿不到。你那些东西，连密码都没告诉过我。"你张了张嘴，发现自己没法反驳——你确实把一切都藏在了"去中心化"的名义下，却忘了，去中心化对你来说是自由，对爱你的人来说是恐惧。',
    options: [
      {
        id: 'full_transparency',
        label: '完全透明，把持仓和备份方案告诉伴侣',
        description: '信任是关系的基础，不能让技术成为隔阂',
        hint: '社区影响力+5 · 幸福+10 · 信念+5 · 压力-8',
        hintColor: 'positive',
        skillGains: { communityInfluence: 5 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 10, 0, 100);
          s.stress = clamp(s.stress - 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '33岁，你花了一个晚上，把所有持仓、地址、助记词的备份位置、紧急提取方案，一五一十告诉了伴侣。TA听完沉默了很久，然后抱住了你。从那天起，你们的争吵少了一半——原来TA要的不是控制你的钱，是参与你的人生。',
      },
      {
        id: 'separate_finances',
        label: '财务分开，链上资产归你管',
        description: '各自有各自的领域，互不干涉',
        hint: '信念+3 · 压力+6 · 幸福-5 · 维持现状',
        hintColor: 'neutral',
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.happiness = clamp(s.happiness - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 3, 0, 100);
        },
        log: '33岁，你跟伴侣说"链上的事我自己负责，亏了算我的"。TA没再追问，但你知道那道裂痕还在。后来每次你盯着行情，TA看你的眼神都带着一丝不安。你赢得了财务独立，却输了一点亲密。',
      },
      {
        id: 'bring_partner_onchain',
        label: '教伴侣上链，让TA理解你在做什么',
        description: '与其解释，不如让TA亲身体验',
        hint: '社区影响力+8 · 信念+8 · 幸福+5 · 压力+4 · 持仓+存款5%',
        hintColor: 'positive',
        skillGains: { communityInfluence: 8 },
        stateEffect: (s) => {
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          investPercent(s, 0.05);
        },
        log: '33岁，你手把手教伴侣注册了钱包、买了第一笔币、参与了第一次链上交互。TA从"看不懂的恐惧"变成了"有点懂的兴奋"。你们有了一个共同的话题——不再是你一个人的秘密，而是两个人的冒险。',
      },
    ],
  },

  // 36岁：机会成本反思
  {
    id: 'cross_opportunity_cost',
    title: '如果当初',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    ageRange: [36, 36],
    priority: 5,
    weight: 6,
    oncePerGame: true,
    conditions: (s) => !hasAbandonedCrypto(s),
    narrative:
      '高中同学聚会。当年成绩不如你的同桌，进了大厂，股票套现买了学区房；另一个同学考了公，处级干部，说话都带着官腔。你呢？你拿着一堆"看不见摸不着"的链上资产，没有一个体面的头衔。\n' +
      '席间有人问你"现在做什么"，你说"投资"。他们点点头，眼神里是"哦，没工作"的意思。你笑了笑，没解释。\n' +
      '回家路上你看着窗外的万家灯火，第一次认真算了一笔"机会成本"：如果你这些年把精力放在主业上，是不是也能爬到中层？如果你没把积蓄砸进币圈，是不是早就付了首付？你不知道答案，但这个问题像一根刺，扎在你"信仰"的软肋上。',
    options: [
      {
        id: 'no_regrets',
        label: '不后悔，这条路是自己选的',
        description: '别人走的是别人的路，你走的是你的',
        hint: '信念+12 · 幸福+5 · 压力-5 · 健康+3',
        hintColor: 'positive',
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
          s.health = clamp(s.health + 3, 0, 100);
        },
        log: '36岁，你在备忘录里写了一句话："别人在岸上看我在海里扑腾，但他们不知道我见过他们没见过的浪。"写完你笑了。你不确定未来会不会后悔，但你确定现在不后悔——这就够了。',
      },
      {
        id: 'hedge_with_real_estate',
        label: '买套房对冲，回到"正常人"轨道',
        description: '一边HODL，一边拥有现实世界的资产',
        hint: '交易能力+5 · 信念-3 · 压力+4 · 存款-80000 · 持仓×0.6',
        hintColor: 'neutral',
        skillGains: { tradingSkill: 5 },
        savingsChange: -80000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 4, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 3, 0, 100);
          scaleChainHoldings(s, 0.6);
        },
        log: '36岁，你卖了一部分币付了首付，买了套房。搬进去那天你站在阳台上，第一次有了一种"落地"的感觉。你的链上资产少了，但你有了一个看得见摸得着的"退路"。也许对冲不是认输，是成熟。',
      },
      {
        id: 'double_down_conviction',
        label: '被刺激，反而更加坚定',
        description: '别人越是安稳，你越要证明自由值得',
        hint: '信念+10 · 交易能力+5 · 压力+8 · 持仓×1.2',
        hintColor: 'danger',
        skillGains: { tradingSkill: 5 },
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          s.stress = clamp(s.stress + 8, 0, 100);
          scaleChainHoldings(s, 1.2);
        },
        log: '36岁，同学聚会反而刺激了你——你回去加仓了。你赌的不是币，是"另一种人生可能性"。但深夜你也会问自己：这份坚定，到底是信念，还是赌徒的不甘心？你给不出答案，但你继续走着。',
      },
    ],
  },
];

// ============================================================
// 危机事件（高优先级，打断正常流程）
// ============================================================

const crisisEvents: NarrativeEvent[] = [

  // 29岁：交易所暴雷
  {
    id: 'crisis_chain_exchange_collapse',
    title: '坍塌',
    sceneTag: 'crisis',
    pathId: 'chain_native',
    ageRange: [29, 29],
    priority: 9,
    weight: 10,
    oncePerGame: true,
    eventType: 'crisis',
    conditions: (s) => getChainHoldings(s) > 0 && !hasAbandonedCrypto(s),
    narrative:
      '凌晨四点你被消息震醒。你常用的那个交易所——行业排名前三、你一直觉得"大到不能倒"的那个——暂停了提现。推特上铺天盖地的爆料：挪用用户资产、资不抵债、CEO已经在删推文。\n' +
      '你的手在抖。你的资产有四成在那个交易所里。你疯狂地点"提现"，页面只有一句冷冰冰的"维护中"。你刷新了一百遍，那句话像墓志铭一样纹丝不动。\n' +
      '你瘫在椅子上，看着社群里成千上万的人在哀嚎。有人哭了，有人骂娘，有人发遗书。你第一次真正理解了那句话——"不是你的私钥，就不是你的币。"你以前觉得这是技术派的矫情，现在你知道，这是用血写成的真理。',
    options: [
      {
        id: 'learn_self_custody',
        label: '痛定思痛，全部转入自托管',
        description: '再也不要把资产放在任何中心化机构',
        hint: 'DeFi+12 · 交易能力+8 · 压力+15 · 健康-5 · 信念+10 · 持仓×0.6',
        hintColor: 'positive',
        skillGains: { defiSkill: 12, tradingSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          scaleChainHoldings(s, 0.6);
        },
        log: '29岁，交易所暴雷，你损失了四成资产。你花了一周把剩余资产全部提到了硬件钱包，从此再不碰中心化交易所。你把助记词刻在钢板上，锁进保险箱。你损失了钱，但换来了一个刻进骨髓的教训：信任代码，不要信任人。',
      },
      {
        id: 'join_class_action',
        label: '加入维权，试图追回损失',
        description: '不能就这么算了，要讨个说法',
        hint: '社区影响力+10 · 压力+12 · 信念-5 · 持仓×0.55 · 存款-5000(律师费)',
        hintColor: 'neutral',
        skillGains: { communityInfluence: 10 },
        savingsChange: -5000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 12, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
          scaleChainHoldings(s, 0.55);
        },
        log: '29岁，你加入了维权群，请了律师，走上了漫长的追偿之路。两年后你拿回了15%的资产，律师费花了不少。你疲惫不堪，但你不后悔站出来——有些事不是为了钱，是为了让作恶的人知道有代价。',
      },
      {
        id: 'give_up_chain',
        label: '心灰意冷，清仓离场',
        description: '这圈子太黑了，我不玩了',
        hint: '压力-5 · 幸福+3 · 信念-15 · 持仓×0(清仓) · 存款+剩余变现',
        hintColor: 'negative',
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 5, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 15, 0, 100);
          sellPercent(s, 1.0);
        },
        log: '29岁，你清仓了。不是不信区块链了，是扛不住这种"随时可能归零"的不确定性。你把变现的钱存进了银行，第一次觉得法币的安全感是真实的。但深夜你还是会刷一眼行情——那条退场的路，比你想象的难走。',
      },
    ],
  },

  // 32岁：深熊毁灭
  {
    id: 'crisis_chain_bear_devastation',
    title: '长夜',
    sceneTag: 'crisis',
    pathId: 'chain_native',
    ageRange: [32, 32],
    priority: 9,
    weight: 10,
    oncePerGame: true,
    eventType: 'crisis',
    conditions: (s) => getChainHoldings(s) > 0,
    narrative:
      '熊市进入了第二年，没有底的那种。你的持仓从上一个高点跌了85%。你身边一半的人已经清仓退场，另一半在假装"我没事"。\n' +
      '你妈住院了，要交手术费。你打开钱包，看着那堆缩水了85%的资产——现在卖，等于在谷底割肉；不卖，你妈的手术怎么办？\n' +
      '你坐在医院走廊的长椅上，手机屏幕亮着行情，对面是缴费窗口。你第一次恨自己——恨自己为什么把救命的钱放在"去中心化"的地方，恨自己赌性太重，恨那个叫"信念"的东西把你架到了这个进退两难的悬崖。',
    options: [
      {
        id: 'sell_for_family',
        label: '割肉卖币，给妈交手术费',
        description: '家人比信仰重要',
        hint: '信念-10 · 压力+10 · 幸福-5 · 在谷底卖出约3万持仓交手术费',
        hintColor: 'negative',
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.happiness = clamp(s.happiness - 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 10, 0, 100);
          // 在谷底卖出约3万的币交手术费（如果持仓不足3万就全卖）
          const sellAmount = Math.min(getChainHoldings(s), 30000);
          sellForAmount(s, sellAmount); // 卖币换现金
          s.currentSavings -= sellAmount; // 扣除手术费（卖币得到的钱全部花掉）
        },
        log: '32岁，你在谷底卖了币，给妈交了手术费。手术很成功，你妈拉着你的手说"钱没了再赚"。你笑着说"没事"，转身在走廊里红着眼眶。你第一次理解了"流动性"的意义——资产再值钱，用的时候拿不出来，就是废纸。',
      },
      {
        id: 'borrow_instead',
        label: '借钱交手术费，币不动',
        description: '扛过这一关，牛市会回来的',
        hint: '信念+8 · 压力+15 · 持仓不变 · 存款-5000(利息)',
        hintColor: 'danger',
        savingsChange: -5000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
        },
        log: '32岁，你跟亲戚借了钱交手术费，币一个没卖。手术后的三个月你被债主追得睡不着觉，但你赌牛市会回来。两年后牛市真的来了，你的持仓翻了五倍。你还清了债，还有盈余。但那三个月的煎熬，你一辈子忘不了。',
      },
      {
        id: 'stablecoin_loan',
        label: '用链上资产做抵押借稳定币',
        description: 'DeFi借贷——不卖币也能拿到现金',
        hint: 'DeFi+12 · 交易能力+5 · 压力+8 · 持仓不变(抵押) · 存款+25000',
        hintColor: 'positive',
        skillGains: { defiSkill: 12, tradingSkill: 5 },
        savingsChange: 25000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 6, 0, 100);
        },
        log: '32岁，你用链上资产在DeFi借贷协议里抵押，借出了稳定币交手术费。你没卖币，也没欠人情。但你知道这是走钢丝——如果币价再跌30%，你的抵押品会被清算。你每天盯着清算线，像走钢丝的人盯着脚下的深渊。',
      },
    ],
  },

  // 35岁：监管铁拳
  {
    id: 'crisis_chain_regulation_crack',
    title: '审判日',
    sceneTag: 'crisis',
    pathId: 'chain_native',
    ageRange: [35, 35],
    priority: 9,
    weight: 10,
    oncePerGame: true,
    eventType: 'crisis',
    conditions: (s) => getChainHoldings(s) > 0 && !hasAbandonedCrypto(s),
    narrative:
      '你所在的地区出台了最严厉的监管政策：禁止所有加密货币与法币的兑换，银行账户涉及加密交易一律冻结。你的法币出入金通道一夜之间全部切断。\n' +
      '社群里一片哀嚎。有人连夜出国，有人开始研究OTC黑市，有人直接认输出局。你看着那纸禁令，第一次觉得"去中心化"在现实权力面前如此脆弱——链上确实没人能冻结你的币，但链下有人能冻结你的银行卡、你的社保、你的一切。\n' +
      '你站在窗前，手里攥着硬件钱包。你的资产在链上，安全；但你在链下，被困住了。你第一次面对加密世界最根本的悖论：技术可以超越国界，但人不能。',
    options: [
      {
        id: 'go_offshore',
        label: '出海，去对加密友好的国家',
        description: '用脚投票，寻找自由的土壤',
        hint: '交易能力+8 · 社区影响力+8 · 压力+15 · 信念+12 · 存款-30000 · 健康-3',
        hintColor: 'danger',
        skillGains: { tradingSkill: 8, communityInfluence: 8 },
        savingsChange: -30000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
        },
        log: '35岁，你办了签证，飞到了一个对加密友好的国家。落地那天你看着陌生的街道，既自由又孤独。你的资产在链上安然无恙，但你的根被拔起来了。你用"主权个人"的方式换来了自由，代价是成为一个没有故乡的人。',
      },
      {
        id: 'otc_underground',
        label: '转入地下，用OTC和P2P继续',
        description: '上有政策下有对策，留得青山在',
        hint: '交易能力+10 · 压力+18 · 信念+5 · 持仓不变 · 风险极高',
        hintColor: 'danger',
        skillGains: { tradingSkill: 10 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 18, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
        },
        log: '35岁，你开始用OTC和P2P出金。每次交易都像谍战片——约在咖啡馆、现金交易、用假名。你没被冻卡，但你每天活在"下一个会不会是钓鱼执法"的恐惧里。你赢了规则，却输了安宁。',
      },
      {
        id: 'comply_and_pivot',
        label: '接受现实，把链上资产转入合规框架',
        description: '不硬刚，在规则里找活路',
        hint: '信念-8 · 压力+6 · 持仓×0.7(合规损耗) · 存款+20000 · 合法身份',
        hintColor: 'neutral',
        savingsChange: 20000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 8, 0, 100);
          scaleChainHoldings(s, 0.7);
        },
        log: '35岁，你请了律师，把链上资产做了合规申报和架构重组。交了罚款，交了税，接受了一部分资产被"锁定"的安排。你的自由少了，但你可以光明正大地活着了。你告诉自己：这不是认输，是换一种方式战斗。',
      },
    ],
  },

  // 39-40岁：税务稽查上门——兑现"装作不知道"的后果
  {
    id: 'crisis_chain_tax_audit',
    title: '清算',
    pathId: 'chain_native',
    ageRange: [39, 40],
    priority: 9,
    weight: 10,
    oncePerGame: true,
    eventType: 'crisis',
    sceneTag: 'crisis',
    conditions: (s) => getChainHoldings(s) > 0 && !hasAbandonedCrypto(s),
    narrative:
      '税务稽查的人上门那天，你正在给客户回邮件。两个穿夹克的人亮了证件，语气客气却不容拒绝："有一些关于您名下资产的情况，需要您配合说明。"\n' +
      '你脑子里"嗡"的一声。那些年你在链上来回倒腾的收益，那些你选择"装作不知道"没申报的利润——它们像埋了多年的地雷，今天终于踩响了。\n' +
      '你请他们坐下，手却止不住地抖。你第一次后悔的不是赚得少，而是当年那个"能拖一天是一天"的侥幸。去中心化的是技术，不是你的纳税义务——这句话你当年听过，只是没当回事。',
    options: [
      {
        id: 'pay_fines',
        label: '补缴罚款',
        description: '请律师，补缴税款和滞纳金，把账做干净',
        hint: '存款-80000 · 压力+18 · 健康-5',
        hintColor: 'neutral',
        savingsChange: -80000,
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 18, 0, 100);
          s.health = clamp(s.health - 5, 0, 100);
        },
        log: '你请了律师，补缴了税款和滞纳金。数字让你肉疼，但至少不用担惊受怕了。你第一次觉得，"合规"两个字值这个价。',
      },
      {
        id: 'fight_in_court',
        label: '据理力争',
        description: '找税务律师，试图证明那些收益的定性存在争议',
        hint: '50%胜诉: 存款-20000 · 压力+15 ｜ 50%败诉: 存款-80000 · 压力+18 · 健康-10',
        hintColor: 'danger',
        stateEffect: (s) => {
          if (Math.random() < 0.5) {
            // 胜诉
            s.currentSavings = Math.max(0, s.currentSavings - 20000);
            s.stress = clamp(s.stress + 15, 0, 100);
          } else {
            // 败诉
            s.currentSavings = Math.max(0, s.currentSavings - 80000);
            s.stress = clamp(s.stress + 18, 0, 100);
            s.health = clamp(s.health - 10, 0, 100);
          }
        },
        log: '你找了税务律师，试图证明那些收益的定性存在争议。律师说有五成把握。你在等待结果的日子里瘦了八斤。',
      },
      {
        id: 'move_assets',
        label: '资产转移',
        description: '连夜把一部分资产转移到冷钱包，想着"大不了出去躲几年"',
        hint: '链上持仓×0.7 · 压力+18 · 信念-10',
        hintColor: 'danger',
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 18, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 10, 0, 100);
          scaleChainHoldings(s, 0.7);
        },
        log: '你连夜把一部分资产转移到冷钱包，想着"大不了出去躲几年"。做完这些你坐在黑暗里，觉得自己不像个区块链革命者，倒像个逃犯。',
      },
    ],
  },

  // 40岁：认清现实——链上持仓远不够退休，继续赌还是认输
  {
    id: 'crisis_chain_reality_check',
    title: '认清现实',
    pathId: 'chain_native',
    ageRange: [40, 40],
    priority: 9,
    weight: 10,
    oncePerGame: true,
    eventType: 'crisis',
    sceneTag: 'crisis',
    conditions: (s) => getChainHoldings(s) > 0 && !hasAbandonedCrypto(s),
    narrative:
      '40岁了。你打开钱包，看着那串链上持仓的数字——它可能曾经让你心跳加速，可现在你把它和"退休"两个字放在一起算，差距大得让你想笑。\n' +
      '同龄人在还房贷、送孩子上补习班，你在算自己的仓位够不够撑过下一个熊市。你妈打电话问你还单不单着，你岔开话题，挂了电话对着K线发呆。\n' +
      '是继续赌，还是认输？你点了根烟，烟雾里浮起这些年所有的决定——每一次加仓、每一次HODL、每一次"再来一轮牛市就够了"。你知道，这一次的选择，可能就是终局。',
    options: [
      {
        id: 'cash_out_and_return',
        label: '认输回归',
        description: '链上持仓全部卖出回血，回归主业',
        hint: '链上持仓清仓 · 存款大幅增加 · 压力-15 · 幸福+5 · 健康+10 · 信念-15',
        hintColor: 'neutral',
        stateEffect: (s) => {
          sellPercent(s, 1.0);
          s.stress = clamp(s.stress - 15, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.health = clamp(s.health + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 15, 0, 100);
        },
        log: '你清掉了最后一批仓位。看着到账的数字，你松了口气，也叹了口气。这些年赚的和亏的加在一起，够你付个首付了。你把硬件钱包放进抽屉最底层，打开招聘网站，开始更新简历。',
      },
      {
        id: 'double_down_again',
        label: '再赌一轮',
        description: '关掉简历，重新打开K线图，押注下一轮牛市',
        hint: '信念+12 · 压力+10 · 链上持仓×1.5',
        hintColor: 'danger',
        stateEffect: (s) => {
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          s.stress = clamp(s.stress + 10, 0, 100);
          scaleChainHoldings(s, 1.5);
        },
        log: '你看着账户里的数字，心想：再来一轮牛市就够了。你把简历关了，重新打开了K线图。你知道这可能是最后的机会，但你已经停不下来了。',
      },
      {
        id: 'half_in_half_out',
        label: '半退半留',
        description: '卖出一半持仓落袋为安，剩下一半留在链上买希望',
        hint: '卖出一半持仓 · 存款增加 · 信念-5 · 压力-5 · 幸福+3',
        hintColor: 'positive',
        stateEffect: (s) => {
          sellPercent(s, 0.5);
          s.pathFaith = clamp(s.pathFaith - 5, 0, 100);
          s.stress = clamp(s.stress - 5, 0, 100);
          s.happiness = clamp(s.happiness + 3, 0, 100);
        },
        log: '你卖出了一半的仓位，落袋为安。剩下的一半你留在链上，就当买个希望。你开始减少盯盘的时间，把精力分一部分给主业和生活。也许你不会在链上自由，但至少你给自己留了退路。',
      },
    ],
  },
];

// ============================================================
// 持仓归零后的重建仓位事件（通用，任何分支都可触发）
// ============================================================
const rebuildEvents: NarrativeEvent[] = [
  {
    id: 'chain_rebuild_after_loss',
    title: '废墟之上',
    sceneTag: 'breakthrough',
    pathId: 'chain_native',
    ageRange: [24, 50],
    priority: 8,
    weight: 10,
    oncePerGame: true, // 首次归零的"废墟之上"仅触发一次
    eventType: 'normal',
    conditions: (s) => getChainHoldings(s) === 0 && s.currentSavings > 5000 && s.pathFaith >= 20 && !hasAbandonedCrypto(s)
      && (s.narrativeEventFired || {})['chain_rebuild_again'] === undefined, // 未触发过二次重建时才用这个
    narrative:
      '你的持仓归零了。不管是因为爆仓、被骗还是割肉退场，链上的那个数字变成了0。\n' +
      '你盯着空空的钱包地址，有一瞬间你想把APP全删了，从此老老实实打工。但你心里那团火还没灭——你知道区块链不会因为你的失败而消失，问题不在技术，在你自己的决策。\n' +
      '你打开存款账户，看着那串数字。重新开始，还是到此为止？',
    options: [
      {
        id: 'rebuild_small',
        label: '小仓位重新开始，这次用纪律',
        description: '不信邪，但这次只投能承受亏损的部分',
        hint: '交易能力+8 · 信念+10 · 压力+8 · 持仓+存款15%',
        hintColor: 'positive',
        skillGains: { tradingSkill: 8 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 10, 0, 100);
          investPercent(s, 0.15);
        },
        log: '你用存款的15%重新建了仓。这一次你把止损线写在便签上贴在屏幕边，把"不碰杠杆"设成了铁律。失败教会你的东西，比任何教程都深刻。链上那串数字又跳动了，但这次你告诉自己：活着比赚钱重要。',
      },
      {
        id: 'rebuild_allin',
        label: '把大部分存款砸进去，赌回来',
        description: '既然已经输了，不如梭哈翻本',
        hint: '交易能力+5 · 信念+12 · 压力+15 · 健康-3 · 持仓+存款40%',
        hintColor: 'danger',
        skillGains: { tradingSkill: 5 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 15, 0, 100);
          s.health = clamp(s.health - 3, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 12, 0, 100);
          investPercent(s, 0.40);
        },
        log: '你把存款的四成全砸了进去。有人说这是赌徒谬误，但你觉得这是破釜沉舟。你的手在颤抖，心跳快得像要炸开。你知道这一次如果再输，就真的什么都没了——但你告诉自己：赌徒的归宿就是赌桌。',
      },
      {
        id: 'rebuild_give_up_crypto',
        label: '放弃链上，把钱留在银行',
        description: '承认这条路不适合自己',
        hint: '信念-20 · 压力-10 · 幸福+5 · 不再投资加密货币',
        hintColor: 'neutral',
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 10, 0, 100);
          s.happiness = clamp(s.happiness + 5, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 20, 0, 100);
          // 标记玩家已放弃链上投资，后续不再触发持仓相关事件和操作
          (s as any).hasAbandonedCrypto = true;
        },
        log: '你关掉了钱包APP，把钱留在了银行。你跟自己说"认输了"，但心里清楚这是一种解脱。凌晨三点你居然睡着了——这半年来的第一次。也许链上自由不适合所有人，承认这一点，也是一种勇气。',
      },
    ],
  },

  // ============================================================
  // 二次废墟：第二次（及以后）持仓归零后的重建事件
  // 可重复触发，3年冷却，体现"又一次失败"的叙事差异
  // ============================================================
  {
    id: 'chain_rebuild_again',
    title: '又一次废墟',
    sceneTag: 'crisis',
    pathId: 'chain_native',
    ageRange: [26, 55],
    priority: 8,
    weight: 10,
    oncePerGame: false, // 可重复触发
    eventType: 'crisis',
    conditions: (s) => {
      if (getChainHoldings(s) !== 0) return false;
      if (s.currentSavings <= 5000) return false;
      if (s.pathFaith < 15) return false; // 二次重建信念门槛略低
      if (hasAbandonedCrypto(s)) return false;
      // 必须已经触发过首次"废墟之上"
      const firedFirst = (s.narrativeEventFired || {})['chain_rebuild_after_loss'];
      if (firedFirst === undefined) return false;
      // 3年冷却：距离上次触发"又一次废墟"至少3年
      const firedAgain = (s.narrativeEventFired || {})['chain_rebuild_again'];
      if (firedAgain !== undefined && s.currentAge - firedAgain < 3) return false;
      return true;
    },
    narrative:
      '又归零了。\n' +
      '你盯着钱包地址上那个刺眼的0，恍惚了一秒——你好像经历过这一幕。不，你不是"好像"，你是确实经历过。上一次你也是这样坐在屏幕前，心跳停了一拍，然后告诉自己"再来"。\n' +
      '但这次不一样。这次你知道了痛的滋味。上次你以为自己能承受，现在你发现"能承受"和"愿意再承受一次"是两码事。\n' +
      '你的存款又少了一些，年纪又大了几岁。链上那串数字不会同情你，市场不知道你是谁。但那个该死的0，又一次出现在你面前——像一道你已经答过一次的题，只是这次分值更高了。',
    options: [
      {
        id: 'rebuild_again_discipline',
        label: '比上次更小的仓位，更严的纪律',
        description: '你输过一次，知道痛了。这次只用存款的10%，把止损线刻在骨子里。',
        hint: '交易能力+10 · 信念+8 · 压力+10 · 持仓+存款10%',
        hintColor: 'positive',
        skillGains: { tradingSkill: 10 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 10, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 8, 0, 100);
          investPercent(s, 0.10);
        },
        log: '你只投了存款的一成。上次的15%你记得清清楚楚——那次的痛让你学会了"更少"。你在笔记本上写下三条铁律：不杠杆、不止损犹豫、不隔夜持仓超三成。你不确定这次能不能成，但至少你比上次更聪明了一点点——虽然"更聪明"在这条路上，常常意味着"输得更慢"。',
      },
      {
        id: 'rebuild_again_doubt',
        label: '问自己：是不是该换个玩法了',
        description: '也许现货不适合你，也许该试试别的链上方式——做Builder、做节点、或者只做套利。换一条路，不换方向。',
        hint: '适应力+10 · 信念+5 · 压力+6 · 持仓+存款8%',
        hintColor: 'neutral',
        skillGains: { adaptability: 10 },
        stateEffect: (s) => {
          s.stress = clamp(s.stress + 6, 0, 100);
          s.pathFaith = clamp(s.pathFaith + 5, 0, 100);
          investPercent(s, 0.08);
        },
        log: '你没有梭哈，也没有放弃。你把一小部分钱投回去，但开始研究DeFi套利和节点运营——不再纯靠行情吃饭。你发现链上的世界不只有"涨跌"两个字，还有一整个你从未认真看过的生态。也许失败的意义，就是逼你换一个角度。',
      },
      {
        id: 'rebuild_again_give_up',
        label: '这次真的放弃了',
        description: '一次是意外，两次是规律。你不想等第三次了。',
        hint: '信念-25 · 压力-12 · 幸福+8 · 不再投资加密货币',
        hintColor: 'neutral',
        stateEffect: (s) => {
          s.stress = clamp(s.stress - 12, 0, 100);
          s.happiness = clamp(s.happiness + 8, 0, 100);
          s.pathFaith = clamp(s.pathFaith - 25, 0, 100);
          (s as any).hasAbandonedCrypto = true;
        },
        log: '你卸载了所有交易所APP。这次没有解脱感，只有一种沉甸甸的平静。你跟自己说"我不是认输，我是止损"——但你分不清这两者的区别。晚上你打开银行APP，看着那串不会再归零的数字，第一次觉得"无聊"也是一种安全。',
      },
    ],
  },
];

// ============================================================
// 合并所有事件
// ============================================================

export const CHAIN_NARRATIVE_EVENTS: NarrativeEvent[] = [
  ...commonEvents,
  ...branchSelectEvent,
  ...traderEvents,
  ...builderEvents,
  ...hodlerEvents,
  ...crossBranchEvents,
  ...crisisEvents,
  ...rebuildEvents,
];

// ============================================================
// 链上原住民路径 - 叙事成就触发系统
//
// 3条分支 × 3个等级 = 9个成就。
// 技能达标后自动触发，给玩家里程碑式的成就感。
// 初级/中级成就改变人生轨迹，终极成就触发退休判定。
//
// 技能维度：
//   - tradingSkill        交易能力 (0-100)
//   - defiSkill           DeFi开发 (0-100)
//   - communityInfluence  社区影响力 (0-100)
// ============================================================

// ------------------------------------------------------------
// 短线交易线 (chain_trader) —— 在波动中猎取alpha
// ------------------------------------------------------------
const traderAchievements: NarrativeAchievement[] = [
  // 初级：稳定盈利的交易者
  {
    id: 'chain_native_trader_1',
    title: '稳定盈利',
    narrative: `你连续六个月实现了正收益。不是暴利，是稳定。你的交易系统跑通了，你的纪律扛住了。\n\n你把六个月的交易记录摊在桌上，胜率62%，盈亏比2.5。每一个数字背后都是一次和自己人性的搏斗。你从一个"赌徒"变成了一个"有边际优势的交易者"。社群里有人开始叫你"老师"，你纠正他们："别叫老师，叫同学。市场是唯一的老师。"`,
    pathId: 'chain_native',
    branch: 'chain_trader',
    level: 1,
    skillRequirements: { tradingSkill: 35 },
    passiveIncomeChange: 8000, // 交易收益转化为稳定被动收入
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 10);
      scaleChainHoldings(state, 1.3);
    },
    log: `你连续六个月稳定盈利。从赌徒变成了有边际优势的交易者。持仓增长30%。`,
  },

  // 中级：周期猎手
  {
    id: 'chain_native_trader_2',
    title: '周期猎手',
    narrative: `你熬过了完整的牛熊周期，并且在周期的每个阶段都做出了正确的判断。你在底部买入，在顶部减仓，在震荡中高抛低吸。\n\n社群里流传着你的交易复盘文章，有人把它打印出来贴在墙上。你成了一个"经历过周期的人"——在这个圈子里，这比任何技术分析都稀缺。一个新人在私信里问你"怎么才能像你一样"，你回复了八个字："活下去，别上头。"`,
    pathId: 'chain_native',
    branch: 'chain_trader',
    level: 2,
    skillRequirements: { tradingSkill: 55, communityInfluence: 30 },
    passiveIncomeChange: 25000,
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 8);
      scaleChainHoldings(state, 1.5);
    },
    log: `你穿越了完整牛熊周期，每个阶段都判断正确。你成了社群里的"周期猎手"。持仓增长50%。`,
  },

  // 终极：交易大师
  {
    id: 'chain_native_trader_3',
    title: '交易大师',
    narrative: `你的交易系统已经不需要你亲自执行了——它成了一台自动运转的机器。你站在屏幕前，看着那些跳动的数字，第一次觉得它们不再让你心跳加速。\n\n你想起了22岁第一次暴跌时颤抖的手，想起了27岁差点爆仓的那个深夜，想起了32岁熊市里割肉给妈交手术费的眼泪。这条路你走了十几年，从一个赌徒走到了一个"不再需要赌"的人。\n\n你关掉交易终端，给自己倒了一杯酒。市场还在波动，但你已经不在浪里了——你在岸上，看着浪。这就是交易大师的境界：不是赢了多少次，是终于学会了什么时候不交易。`,
    pathId: 'chain_native',
    branch: 'chain_trader',
    level: 3,
    skillRequirements: { tradingSkill: 75, communityInfluence: 50, defiSkill: 30 },
    passiveIncomeChange: 40000,
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 12);
      scaleChainHoldings(state, 1.5);
    },
    log: `你的交易系统已能自动运转。你从浪里走到了岸上。被动收入+40000/年，持仓增长50%。`,
    triggersRetirementCheck: true,
  },
];

// ------------------------------------------------------------
// DeFi开发者线 (chain_builder) —— 用代码创造价值
// ------------------------------------------------------------
const builderAchievements: NarrativeAchievement[] = [
  // 初级：合约上线
  {
    id: 'chain_native_builder_1',
    title: '合约上线',
    narrative: `你的智能合约通过了审计，正式部署到了主网。第一笔用户交易进来的那一刻，你在Discord里看着那个绿色的"Success"，手心全是汗。\n\n你的代码，在一个没有人控制的网络上，自动执行着你写的逻辑。你第一次理解了"代码即法律"的重量——不是口号，是字面意义。从此，每一行你写的代码，都在替陌生人自动执行着契约。权力越大，敬畏越深。`,
    pathId: 'chain_native',
    branch: 'chain_builder',
    level: 1,
    skillRequirements: { defiSkill: 35 },
    passiveIncomeChange: 5000, // 协议手续费分红
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 10);
      investPercent(state, 0.25);
    },
    log: `你的智能合约通过审计，主网上线。第一笔用户交易进来了。被动收入+5000/年。`,
  },

  // 中级：协议主网
  {
    id: 'chain_native_builder_2',
    title: '协议主网',
    narrative: `你设计的DeFi协议在主网上线，TVL一周突破千万。你的合约正在替成千上万的用户自动执行借贷、交易、清算——没有你的干预，它自己运转得很好。\n\n你看着GitHub上的commit历史，从第一行"Hello World"到现在的几万行代码。有人在你的协议上构建了衍生产品，有人fork了你的代码做了改进版。你的代码不再只属于你，它属于整个生态。你成了一个"造物主"——不是权力的造物主，是规则的造物主。`,
    pathId: 'chain_native',
    branch: 'chain_builder',
    level: 2,
    skillRequirements: { defiSkill: 55, communityInfluence: 35 },
    passiveIncomeChange: 30000,
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 8);
      investPercent(state, 0.30);
    },
    log: `你的DeFi协议主网上线，TVL破千万。你的代码在替无数人自动执行规则。被动收入+30000/年。`,
  },

  // 终极：DeFi架构师
  {
    id: 'chain_native_builder_3',
    title: 'DeFi架构师',
    narrative: `你的协议在链上运行了五年，经历了两次牛熊、三次黑客攻击尝试（全部挡住）。它成了行业基础设施，每天都有数亿资金在你的代码上流转。\n\n行业大会上，主持人介绍你时用了"DeFi架构师"这个头衔。你站在台上，看着台下黑压压的人头，想起了26岁那个在Remix里点下Deploy的夜晚。那时你只是一个写了200行代码的新人，现在你的代码在替整个行业运转。\n\n你讲完最后一页PPT，说："我不是天才，我只是在这个领域待得比别人久。"掌声响起来的时候，你看见了那个26岁的自己坐在最后一排，冲你点了点头。你对TA笑了笑——这条路，你走通了。`,
    pathId: 'chain_native',
    branch: 'chain_builder',
    level: 3,
    skillRequirements: { defiSkill: 75, communityInfluence: 55, tradingSkill: 30 },
    passiveIncomeChange: 40000,
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 12);
      investPercent(state, 0.35);
    },
    log: `你的协议成了行业基础设施，你被尊为"DeFi架构师"。被动收入+40000/年。`,
    triggersRetirementCheck: true,
  },
];

// ------------------------------------------------------------
// 坚定持有线 (chain_hodler) —— 用时间换复利，用信念换自由
// ------------------------------------------------------------
const hodlerAchievements: NarrativeAchievement[] = [
  // 初级：钻石手
  {
    id: 'chain_native_hodler_1',
    title: '钻石手',
    narrative: `你穿越了第一个深熊，一个币没卖。当90%的人在恐慌中清仓时，你选择了HODL。\n\n社群里有人叫你"钻石手"。你笑了笑，但心里清楚：钻石手不是不害怕，是害怕完了还选择不松手。你第一次明白，HODL不是一种操作，是一种人格——在所有人都动摇的时候，你做那个锚。`,
    pathId: 'chain_native',
    branch: 'chain_hodler',
    level: 1,
    skillRequirements: { communityInfluence: 35 },
    passiveIncomeChange: 5000, // 社区贡献奖励
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 10);
      scaleChainHoldings(state, 1.4);
    },
    log: `你穿越了第一个深熊，一个币没卖。社群叫你"钻石手"。持仓在牛市反弹中增长40%。`,
  },

  // 中级：DAO核心
  {
    id: 'chain_native_hodler_2',
    title: 'DAO核心',
    narrative: `你成了三个DAO的治理委员会成员，你的提案影响着数万人的资产。你从一个"持有者"变成了一个"治理者"。\n\n你设计的治理机制被其他DAO借鉴，你调解的社区分裂成了行业案例。在去中心化的世界里，你成了那个"让共识成为可能"的人。有人叫你"DAO先生"，你纠正他们："不是我的DAO，是我们的DAO。去中心化的核心，就是没有'我的'。"`,
    pathId: 'chain_native',
    branch: 'chain_hodler',
    level: 2,
    skillRequirements: { communityInfluence: 55, defiSkill: 30 },
    passiveIncomeChange: 20000,
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 8);
      scaleChainHoldings(state, 1.5);
    },
    log: `你成了三个DAO的治理核心，你的机制设计被全行业借鉴。被动收入+20000/年。`,
  },

  // 终极：链上精神领袖
  {
    id: 'chain_native_hodler_3',
    title: '链上精神领袖',
    narrative: `你在这个圈子里待了十几年。你穿越了两次完整的牛熊，扛住了无数次暴跌，见证过项目归零，也看到过改变世界的协议诞生。你成了这个领域的"灯塔"——新人入场会来找你，媒体会采访你，行业大会请你做keynote。\n\n你站在大会舞台上，看着台下几千人，想起了22岁那个把工资换成币、被室友说"疯了"的自己。那时你什么都没有，只有一腔不被人理解的信仰。现在，台下几千人都是来听你讲"为什么我们应该相信"的。\n\n你说："我不是先知，我只是一个从来没卖的人。"掌声雷动。你看着那些年轻的脸，眼里有泪。你知道，他们就是当年的你——而这，就是你存在的意义：让每一个"当年的你"知道，他们不孤单。`,
    pathId: 'chain_native',
    branch: 'chain_hodler',
    level: 3,
    skillRequirements: { communityInfluence: 75, defiSkill: 40, tradingSkill: 30 },
    passiveIncomeChange: 40000,
    stateEffect: (state) => {
      state.pathFaith = Math.min(100, state.pathFaith + 12);
      scaleChainHoldings(state, 1.5);
    },
    log: `你成了链上世界的"精神领袖"，站在千人舞台讲述十几年的信仰。被动收入+40000/年，持仓增长50%。`,
    triggersRetirementCheck: true,
  },
];

// ============================================================
// 汇总：链上原住民全部成就（按 分支 → 等级 排序）
// ============================================================
export const CHAIN_ACHIEVEMENTS: NarrativeAchievement[] = [
  ...traderAchievements,
  ...builderAchievements,
  ...hodlerAchievements,
];

// ============================================================
// 自动注册（模块加载时执行）
// ============================================================
registerNarrativeEvents(CHAIN_NARRATIVE_EVENTS);
registerAchievements(CHAIN_ACHIEVEMENTS);