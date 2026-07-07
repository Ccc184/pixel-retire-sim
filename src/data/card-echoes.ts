// 连锁反应（echo）系统
// 当玩家选择某张卡后，延迟1-4年会触发相关后续事件
// structure: { triggerCardId, delayYears, condition?, text, effect }

import type { GameState } from '../types/global.d.js';

export interface CardEcho {
  triggerCardId: string;     // 触发这张卡的id
  delayYears: number;         // 延迟几年触发（1-4）
  condition?: (state: GameState) => boolean;  // 额外条件（可选）
  getText: (state: GameState) => string;       // 叙事文本生成函数
  applyEffect: (state: GameState) => void;    // 效果函数
}

export const CARD_ECHOS: CardEcho[] = [
  // === 辞职连锁 ===
  {
    triggerCardId: 'resign',
    delayYears: 2,
    getText: (s) => `第${s.currentAge}岁，前同事${['老王','小张','阿杰'][Math.floor(Math.random()*3)]}突然发来消息："最近在忙什么？要不要一起吃个饭？"你犹豫了很久回了"好啊"。吃饭时你们聊了很多，主要是互相比较谁更惨。`,
    applyEffect: (s) => { s.happiness = Math.min(100, s.happiness + 5); s.friends.forEach(f => { if (Math.random() < 0.3) f.relation = Math.min(100, f.relation + 5); }); },
  },
  {
    triggerCardId: 'resign',
    delayYears: 3,
    getText: (s) => `第${s.currentAge}岁，你刷朋友圈看到前公司团建照片。曾经的工位已经被一个00后占了，他笑得和你当年一模一样——但工资比你当年高。`,
    applyEffect: (s) => { s.stress = Math.min(100, s.stress + 5); },
  },

  // === 结婚连锁 ===
  {
    triggerCardId: 'marry',
    delayYears: 1,
    getText: (s) => `第${s.currentAge}岁，${s.partner?.name || '伴侣'}开始介意你总是加班到深夜。"你是跟电脑过日子还是跟我过日子？"你关掉了笔记本——然后打开了手机继续加班。`,
    applyEffect: (s) => { if (s.partner) s.partner.affection = Math.max(0, s.partner.affection - 5); s.stress = Math.min(100, s.stress + 3); },
  },
  {
    triggerCardId: 'marry',
    delayYears: 3,
    getText: (s) => `第${s.currentAge}岁，你们为了"谁洗碗"这件事吵了一架。最后两个人坐在沙发上沉默了十分钟，${s.partner?.name || '伴侣'}先笑了："明天买洗碗机吧。"`,
    applyEffect: (s) => { if (s.partner) { s.partner.affection = Math.min(100, s.partner.affection + 3); s.partner.trust = Math.min(100, s.partner.trust + 2); } s.happiness = Math.min(100, s.happiness + 3); },
  },

  // === 买房连锁 ===
  {
    triggerCardId: 'buy_house*',
    delayYears: 1,
    getText: (s) => `第${s.currentAge}岁，搬进新房的第一个周末，你躺在空荡荡的客厅地板上。没有家具、没有窗帘，但你拥有了一个完全属于自己的空间。那一刻你觉得所有的房贷都值了。`,
    applyEffect: (s) => { s.happiness = Math.min(100, s.happiness + 4); },
  },
  {
    triggerCardId: 'buy_house*',
    delayYears: 2,
    getText: (s) => `第${s.currentAge}岁，隔壁装修的电钻声从早上八点持续到晚上六点，整整三个月。你开始理解为什么有人说"买房前先了解一下邻居"比看户型重要一百倍。你甚至认真考虑要不要搬家——但看了看房贷月供，还是算了。`,
    applyEffect: (s) => { s.stress = Math.min(100, s.stress + 3); },
  },

  // === 买车连锁 ===
  {
    triggerCardId: 'buy_car*',
    delayYears: 1,
    getText: (s) => `第${s.currentAge}岁，第一次把车开上高架桥，夕阳透过挡风玻璃洒在仪表盘上。你突然理解了为什么那么多人愿意为一台铁皮盒子花几万块——那是自由的形状。`,
    applyEffect: (s) => { s.happiness = Math.min(100, s.happiness + 4); },
  },
  {
    triggerCardId: 'buy_car*',
    delayYears: 2,
    getText: (s) => `第${s.currentAge}岁，车子第一次被蹭了。你蹲在路边看着那道划痕，心疼得像自己的皮肤被划了一样。修车花了${3000+Math.floor(Math.random()*2000)}块，你在心里发誓以后停最远的位——然后发现最近的停车场一个月停车费400。`,
    applyEffect: (s) => { s.currentSavings -= 3000 + Math.floor(Math.random() * 2000); s.happiness = Math.max(0, s.happiness - 3); },
  },

  // === 炒币连锁 ===
  {
    triggerCardId: 'crypto_bet',
    delayYears: 2,
    getText: (s) => `第${s.currentAge}岁，你又忍不住打开了那个行情APP。红绿交织的K线像心电图——只不过你不确定是市场的还是你自己的。你告诉自己"只是看看"，但手指已经打开了转账页面。`,
    applyEffect: (s) => { s.stress = Math.min(100, s.stress + 4); },
    condition: (s) => s.currentSavings > 20000,
  },
  {
    triggerCardId: 'crypto_bet',
    delayYears: 3,
    getText: (s) => `第${s.currentAge}岁，一个朋友拉你进了"币圈交流群"。群里每天都有人晒收益截图，你开始怀疑自己当初割肉是不是太早了。但你忍住了——至少这次忍住了。你把群设置了免打扰。`,
    applyEffect: (s) => { s.stress = Math.min(100, s.stress + 3); if (Math.random() < 0.3) { s.currentSavings -= 5000 + Math.floor(Math.random() * 10000); s.stress = Math.min(100, s.stress + 5); } },
  },

  // === 创业连锁（副业升级）===
  {
    triggerCardId: 'upgrade_side_hustle',
    delayYears: 2,
    getText: (s) => `第${s.currentAge}岁，副业的某个方向突然起量了。你半夜被手机通知吵醒，一看是收入到账的消息。你笑着翻身继续睡了——梦里都在数钱。`,
    applyEffect: (s) => { s.passiveIncome += 3000 + Math.floor(Math.random() * 5000); s.happiness = Math.min(100, s.happiness + 5); },
  },

  // === MBA连锁 ===
  {
    triggerCardId: 'mba',
    delayYears: 2,
    getText: (s) => `第${s.currentAge}岁，你终于拿到了研究生学位证。毕业典礼上你拍了张照片发给爸妈，他们说"我们儿子/女儿真棒"。简单六个字，你却红了眼眶。`,
    applyEffect: (s) => { s.happiness = Math.min(100, s.happiness + 5); s.stress = Math.max(0, s.stress - 5); },
  },

  // === 生育连锁 ===
  {
    triggerCardId: 'have_child',
    delayYears: 1,
    getText: (s) => `第${s.currentAge}岁，孩子第一次叫出了"爸爸/妈妈"。那声音像一把钥匙，打开了你心里一扇从未知道的门。你拿起手机想录下来，但孩子已经闭嘴了——你录了个空。`,
    applyEffect: (s) => { s.happiness = Math.min(100, s.happiness + 8); s.stress = Math.min(100, s.stress + 3); },
  },

  // === 极简主义连锁 ===
  {
    triggerCardId: 'minimalism',
    delayYears: 2,
    getText: (s) => `第${s.currentAge}岁，朋友来你家做客，看着空荡荡的客厅问"你是不是准备搬家？"你笑着说不是。朋友走后你在小红书上刷到"极简风家居"帖子，发现自己的家比那些"极简博主"的家还空——不是极简，是真的没什么东西。`,
    applyEffect: (s) => { s.happiness = Math.min(100, s.happiness + 3); },
  },

  // === 旅行连锁 ===
  {
    triggerCardId: 'travel',
    delayYears: 1,
    getText: (s) => `第${s.currentAge}岁，你翻看上次旅行的照片，发现自己笑得比最近一年加起来都多。你开始认真考虑每年至少出去一次。`,
    applyEffect: (s) => { s.happiness = Math.min(100, s.happiness + 5); },
  },

  // === 健身连锁 ===
  {
    triggerCardId: 'gym',
    delayYears: 2,
    getText: (s) => `第${s.currentAge}岁，坚持健身的你终于能在镜子里看到腹肌了（虽然只有两块）。但那种"原来我也可以"的感觉，比任何加薪都让人振奋。`,
    applyEffect: (s) => { s.health = Math.min(100, s.health + 5); s.happiness = Math.min(100, s.happiness + 5); },
  },

  // === 心理咨询连锁 ===
  {
    triggerCardId: 'therapy',
    delayYears: 1,
    getText: (s) => `第${s.currentAge}岁，你发现自己开始能安静地坐在公园长椅上发呆了，不再焦虑地刷手机。你发给咨询师一条消息"谢谢"，咨询师回了一个微笑表情。你关掉手机，继续看天空。`,
    applyEffect: (s) => { s.stress = Math.max(0, s.stress - 4); s.happiness = Math.min(100, s.happiness + 3); },
  },

  // === 辞职+旅行 combo连锁 ===
  {
    triggerCardId: 'resign',
    delayYears: 1,
    getText: (s) => `第${s.currentAge}岁，失业的日子里你开始跑步。每天早上六点出门，沿着河堤跑五公里。你不知道自己在追什么，但每次跑完都觉得轻松了一点。`,
    applyEffect: (s) => { s.health = Math.min(100, s.health + 3); s.stress = Math.max(0, s.stress - 3); },
  },

  // === 兴趣班连锁 ===
  {
    triggerCardId: 'hobby_class',
    delayYears: 2,
    getText: (s) => `第${s.currentAge}岁，你学的那门爱好竟然派上了用场——同事请你在公司年会上表演了一段，台下掌声热烈。你发现，有个爱好真好。`,
    applyEffect: (s) => { s.happiness = Math.min(100, s.happiness + 4); },
  },

  // === 彩票连锁 ===
  {
    triggerCardId: 'buy_lottery',
    delayYears: 1,
    getText: (s) => `第${s.currentAge}岁，开奖后的那个早晨，你路过那家彩票店，脚步比平时快了半拍。老板冲你笑了一下，仿佛在说"下次一定"。你掏出钱包，彩票还夹在最里面——你已经忘了它的存在。但命运没忘。`,
    applyEffect: (s) => { s.happiness = Math.max(0, s.happiness - 1); },
  },
  {
    triggerCardId: 'buy_lottery',
    delayYears: 2,
    getText: (s) => `第${s.currentAge}岁，你把那张没中的彩票从钱包里拿出来，端详了一会儿。五十块钱买来的不是一个数字，是一整年的希望——虽然只持续了三天。你把彩票折成纸飞机，从阳台扔了出去。它飞得还挺远。`,
    applyEffect: (s) => { s.happiness = Math.min(100, s.happiness + 2); s.stress = Math.max(0, s.stress - 2); },
  },

  // === 梭哈风口连锁 ===
  {
    triggerCardId: 'windfall_gamble',
    delayYears: 1,
    getText: (s) => `第${s.currentAge}岁，你All-in的那个项目上了新闻。有人说是骗局，有人说是未来。你盯着屏幕上的评论，手心出汗。你对自己说："不管结果怎样，至少我试过了。"这句话你重复了三遍。`,
    applyEffect: (s) => { s.stress = Math.min(100, s.stress + 5); },
  },
];

// 检测并执行当前年应触发的连锁反应
// pendingCardEchoes: { cardId: string, triggerAge: number, delayYears: number }[]
// triggerAge = 注册该连锁时玩家的年龄（即选卡那一年的年龄）
// delayYears  = 该 echo 自身的延迟年数
// 触发条件：state.currentAge === pending.triggerAge + pending.delayYears
// 每个 pending 只在对应 delayYears 的那一年触发一次，触发后从队列移除
export function detectCardEchoes(
  state: GameState,
  pendingCardEchoes: { cardId: string; triggerAge: number; delayYears: number }[]
): { echoes: CardEcho[]; remaining: { cardId: string; triggerAge: number; delayYears: number }[] } {
  const triggered: CardEcho[] = [];
  const remaining: { cardId: string; triggerAge: number; delayYears: number }[] = [];

  for (const pending of pendingCardEchoes) {
    // 该 echo 应该触发的年份 = 注册时年龄 + 延迟年数
    const triggerYear = pending.triggerAge + pending.delayYears;
    if (state.currentAge === triggerYear) {
      // 找到匹配的 echo（同一张卡、同一延迟），每个 pending 只对应一个 echo
      const matches = CARD_ECHOS.filter(e =>
        e.triggerCardId === pending.cardId && e.delayYears === pending.delayYears
      );
      for (const echo of matches) {
        // 检查额外条件（在触发年份检查，更符合"届时才判断"的语义）
        if (echo.condition && !echo.condition(state)) continue;
        triggered.push(echo);
      }
      // 触发后不再保留这个 pending（每个 pending 只触发一次）
    } else if (state.currentAge < triggerYear) {
      // 还没到触发年份，保留
      remaining.push(pending);
    }
    // 如果 state.currentAge > triggerYear，说明错过了触发窗口，丢弃
  }

  return { echoes: triggered, remaining };
}
