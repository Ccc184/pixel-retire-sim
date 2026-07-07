import type { GameState, ParentState, FriendState } from '../types/global.d.js';

// 已结婚的朋友名字集合，避免重复触发婚礼事件
const marriedFriendSet = new Set<string>();

// 重置已结婚朋友集合（新游戏/重置游戏时调用，避免跨局泄漏）
export function resetMarriedFriendSet() {
  marriedFriendSet.clear();
}

// ============================================================
// 初始化父母状态（22岁玩家，父母约48-55岁）
// ============================================================
export function initParents(): ParentState {
  return {
    age: 48 + Math.floor(Math.random() * 8), // 48-55岁
    health: 70 + Math.floor(Math.random() * 20), // 70-90
    isAlive: true,
    livingWithPlayer: false,
    relationShip: 60 + Math.floor(Math.random() * 30), // 60-90
  };
}

// ============================================================
// 初始化朋友圈（3个朋友）
// ============================================================
export function initFriends(): FriendState[] {
  // 新一局开始时清空已结婚朋友集合，避免上一局残留导致本局朋友不再触发婚礼随份子
  marriedFriendSet.clear();
  const types: FriendState['type'][] = ['大学同学', '同事', '发小'];
  const names = ['老王', '小李', '阿强', '小美', '大刘', '老张'];
  return types.slice(0, 3).map((type, i) => ({
    name: names[i],
    relation: 50 + Math.floor(Math.random() * 40),
    type,
    borrowedAmount: 0,
    lastContactAge: 22,
  }));
}

// ============================================================
// 年度人际关系结算
// ============================================================
export function processRelationships(state: GameState): string[] {
  const logs: string[] = [];

  // === 父母变化 ===
  processParents(state, logs);

  // === 伴侣变化 ===
  processPartner(state, logs);

  // === 子女变化 ===
  processChildren(state, logs);

  // === 朋友变化 ===
  processFriends(state, logs);

  return logs;
}

// ============================================================
// 父母年度处理
// ============================================================
function processParents(state: GameState, logs: string[]) {
  if (!state.parents.isAlive) return;

  // 父母自然衰老
  state.parents.age += 1;

  // 健康自然下降
  let healthDecay = 1; // 基础年衰减
  if (state.parents.age >= 60) healthDecay = 3;
  if (state.parents.age >= 70) healthDecay = 5;
  if (state.parents.age >= 80) healthDecay = 8;
  state.parents.health = Math.max(0, state.parents.health - healthDecay + Math.floor(Math.random() * 3));

  // 关系度变化
  if (state.currentAge > 22) {
    // 距离衰减：如果不在家乡城市
    const homeCity: string = state.originChoices.cityReason === 0 ? '资本修罗场' : '中坚大后方';
    if (state.currentCity !== homeCity) {
      state.parents.relationShip = Math.max(0, state.parents.relationShip - 1);
    }
  }

  // 每年给父母打电话/回家（维护关系）
  if (Math.random() < 0.3) {
    state.parents.relationShip = Math.min(100, state.parents.relationShip + 2);
  }

  // 父母健康事件
  if (state.parents.health < 30 && Math.random() < 0.3) {
    const cost = 10000 + Math.floor(Math.random() * 30000);
    state.currentSavings -= cost;
    logs.push(`你爸住院了，你请了假赶回去。医疗费花了${cost}元，病房里消毒水的味道让你鼻子发酸。——父母健康：${state.parents.health}`);
    state.parents.health = Math.max(0, state.parents.health - 10);
    state.stress = Math.min(100, state.stress + 1);
  }

  // 催婚事件（25-35岁，未婚，父母在世）
  if (state.currentAge >= 25 && state.currentAge <= 35 && !state.isMarried && Math.random() < 0.4) {
    const urgeTexts = [
      `过年回家，你妈又把"你看看隔壁小王"挂在嘴边。你夹了一筷子菜，假装没听见。——父母关系：${state.parents.relationShip}`,
      `你爸喝了口酒，突然说"什么时候带个人回来让我们看看"。客厅安静了三秒。——父母关系：${state.parents.relationShip}`,
      `亲戚聚餐上，三姑六婆轮番轰炸。你躲进厕所刷了十分钟手机才出来。——压力+4，父母关系：${state.parents.relationShip}`,
    ];
    logs.push(urgeTexts[Math.floor(Math.random() * urgeTexts.length)]);
    state.stress = Math.min(100, state.stress + 1);
  }

  // 父母离世
  if (state.parents.health <= 0) {
    state.parents.isAlive = false;
    logs.push(`那天电话响的时候你就知道不对。你赶到医院时，走廊里的白光刺得人睁不开眼。你握着那双已经不再温暖的手，想说点什么，但喉咙像被什么东西堵住了。——你永远失去了${state.parents.age}岁的至亲。`);
    state.stress = Math.min(100, state.stress + 10);
    state.happiness = Math.max(0, state.happiness - 12);
    // 遗产（小额）
    const inheritance = 50000 + Math.floor(Math.random() * 150000);
    state.currentSavings += inheritance;
    logs.push(`你在遗物里翻出一个旧存折，里面有${inheritance}元。你把钱转进了自己的账户，然后对着天花板发了一下午的呆。`);
  }
}

// ============================================================
// 伴侣年度处理
// ============================================================
function processPartner(state: GameState, logs: string[]) {
  if (!state.partner || state.partner.hasDivorced) return;
  // 只处理已婚或恋爱中的伴侣（不处理single/divorced状态）
  if (state.partner.datingStage === 'single' || state.partner.datingStage === 'divorced') return;

  // 伴侣年龄同步增长
  state.partner.age += 1;

  // 感情自然波动（-1到+2，有好有坏）
  state.partner.affection = Math.max(0, Math.min(100, state.partner.affection - 1 + Math.floor(Math.random() * 4)));

  const isMarried = state.partner.datingStage === 'married';
  const marriageYears = isMarried ? state.currentAge - state.partner.marriedYear : 0;

  // 七年之痒（仅结婚7-10年）
  if (isMarried && marriageYears >= 7 && marriageYears <= 10 && Math.random() < 0.2) {
    const crisisTexts = [
      `你发现你们已经很久没有好好说过话了。每天各看各的手机，像两个住在同一个屋檐下的室友。`,
      `你们因为一件小事大吵了一架，冷战了整整一周。你开始怀疑"我们是不是真的合适"。`,
    ];
    logs.push(crisisTexts[Math.floor(Math.random() * crisisTexts.length)]);
    state.partner.affection = Math.max(0, state.partner.affection - 4);
    state.stress = Math.min(100, state.stress + 1);
  }

  // 感情升温事件（恋爱或已婚都适用）
  if (state.partner.affection > 50 && Math.random() < 0.12) {
    const warmTexts = isMarried ? [
      `某个加班到很晚的晚上，你回到家发现餐桌上留着热饭和一张纸条"别太累了"。你忽然觉得，这一切都值了。`,
      `周末你们什么都没做，就窝在沙发上看了一整天电影。你发现最好的时光不需要计划。`,
    ] : [
      `${state.partner.name}给你发了一条消息"今天看到一个东西想到你了"，你盯着屏幕傻乐了半天。`,
      `和${state.partner.name}通电话到凌晨两点，挂了之后你发现手机烫得像块红薯，但心里暖得不像话。`,
    ];
    logs.push(warmTexts[Math.floor(Math.random() * warmTexts.length)]);
    state.partner.affection = Math.min(100, state.partner.affection + 3);
    state.happiness = Math.min(100, state.happiness + 3);
  }

  // 感情破裂离婚（仅已婚，感情<20，婚龄>3年）
  if (isMarried && state.partner.affection < 20 && marriageYears > 3 && Math.random() < 0.15) {
    state.partner.hasDivorced = true;
    state.partner.datingStage = 'divorced';
    state.partner.exName = state.partner.name;
    state.isMarried = false;
    // 财产分割
    const splitCost = Math.min(state.currentSavings * 0.3, 200000);
    state.currentSavings -= Math.round(splitCost);
    logs.push(`你们坐在民政局门口的长椅上，手里的离婚证还没盖章。${state.partner.name}先开口："对不起"。你想说"没关系"，但声音发不出来。——财产分割${Math.round(splitCost)}元，感情归零，信任清空。`);
    state.stress = Math.min(100, state.stress + 1);
    state.happiness = Math.max(0, state.happiness - 15);
    state.partner.affection = 0;
    state.partner.trust = 0;
  }

  // 伴侣压力传递（感情好→缓冲，感情差→叠加）
  if (state.stress > 60 && state.partner.affection < 50) {
    state.stress = Math.min(100, state.stress + 1);
  }
}

// ============================================================
// 子女年度处理
// ============================================================
function processChildren(state: GameState, logs: string[]) {
  for (const child of state.children) {
    const childAge = state.currentAge - child.birthYear;

    // 更新成长阶段
    if (childAge < 1) child.growthStage = '婴儿';
    else if (childAge < 3) child.growthStage = '幼儿';
    else if (childAge < 7) child.growthStage = '幼儿园';  // 3-6岁
    else if (childAge < 13) child.growthStage = '小学';   // 7-12岁
    else if (childAge < 16) child.growthStage = '初中';   // 13-15岁
    else if (childAge < 19) child.growthStage = '高中';   // 16-18岁
    else if (childAge < 23) child.growthStage = '大学';   // 19-22岁
    else child.growthStage = '成年';

    // 更新月开销
    switch (child.growthStage) {
      case '婴儿': child.monthlyExpense = 2000 + Math.floor(Math.random() * 1000); break;
      case '幼儿': child.monthlyExpense = 1500 + Math.floor(Math.random() * 1000); break;
      case '幼儿园': child.monthlyExpense = 1500 + Math.floor(Math.random() * 1500); break;
      case '小学': child.monthlyExpense = 1000 + Math.floor(Math.random() * 2000); break;
      case '初中': child.monthlyExpense = 1500 + Math.floor(Math.random() * 2500); break;
      case '高中': child.monthlyExpense = 2000 + Math.floor(Math.random() * 3000); break;
      case '大学': child.monthlyExpense = 2500 + Math.floor(Math.random() * 1500); break;
      case '成年': child.monthlyExpense = 0; break;
    }

    // 学业表现（小学以上随机波动）
    if (['小学', '初中', '高中'].includes(child.growthStage)) {
      child.academicPerformance = Math.max(0, Math.min(100,
        child.academicPerformance + Math.floor(Math.random() * 20) - 8
      ));
    }

    // 叛逆度（初中以上）
    if (['初中', '高中'].includes(child.growthStage)) {
      child.rebelliousness = Math.max(0, Math.min(100,
        child.rebelliousness + Math.floor(Math.random() * 15) - 5
      ));
    }

    // 子女事件
    if (child.growthStage === '婴儿' && Math.random() < 0.3) {
      const babyTexts = [
        `${child.gender === '男' ? '他' : '她'}半夜哭醒了，你抱着${child.gender === '男' ? '他' : '她'}在客厅走了两个小时才哄睡。你看着窗外的月亮，想：这就是当爹/妈的感觉。`,
        `换第N块尿布的时候你已经驾轻就熟了。奶粉、辅食、维生素，你的手机备忘录全是这些。——幸福+2，压力+2`,
      ];
      logs.push(babyTexts[Math.floor(Math.random() * babyTexts.length)]);
      state.stress = Math.min(100, state.stress + 1);
      state.happiness = Math.min(100, state.happiness + 2);
    }

    // 小学阶段事件
    if (child.growthStage === '小学' && Math.random() < 0.25) {
      const schoolTexts = [
        `${child.gender === '男' ? '他' : '她'}放学回来说"同学都有iPad为什么我没有"。你沉默了三秒，说"等你期末考到前三名"。`,
        `家长群里又在统计课外班报名情况。你数了数，${child.gender === '男' ? '他' : '她'}的同学平均报了4个班。你咬了咬牙，报了一个。`,
        `${child.gender === '男' ? '他' : '她'}拿着数学100分的试卷扑向你，那笑容比任何年终奖都值。`,
      ];
      logs.push(schoolTexts[Math.floor(Math.random() * schoolTexts.length)]);
      if (child.academicPerformance > 70) state.happiness = Math.min(100, state.happiness + 3);
      else state.stress = Math.min(100, state.stress + 1);
    }

    // 初中叛逆期
    if (child.growthStage === '初中' && child.rebelliousness > 60 && Math.random() < 0.3) {
      const rebelTexts = [
        `${child.gender === '男' ? '他' : '她'}把房门摔上了，巨响之后是一片沉默。你站在门外想敲门，手举起来又放下。——叛逆度：${child.rebelliousness}`,
        `你发现${child.gender === '男' ? '他' : '她'}的成绩单藏在书包最底层。你什么都没说，但那天晚上你失眠了。`,
      ];
      logs.push(rebelTexts[Math.floor(Math.random() * rebelTexts.length)]);
      state.stress = Math.min(100, state.stress + 1);
    }

    // 高考
    if (child.growthStage === '高中' && childAge === 18) {
      if (child.academicPerformance > 60) {
        logs.push(`${child.gender === '男' ? '他' : '她'}查到了高考成绩，你比${child.gender === '男' ? '他' : '她'}还紧张。结果出来的一刻，你们抱在一起哭了。——幸福+10`);
        state.happiness = Math.min(100, state.happiness + 10);
      } else {
        logs.push(`高考成绩出来了，数字不太理想。你拍了拍${child.gender === '男' ? '他' : '她'}的肩膀说"没关系，条条大路通罗马"。但你自己心里清楚，你也很在意。——压力+5`);
        state.stress = Math.min(100, state.stress + 1);
      }
    }

    // 子女成年离家
    if (child.growthStage === '成年' && childAge === 22 && Math.random() < 0.5) {
      logs.push(`${child.gender === '男' ? '他' : '她'}要去外地工作了。送${child.gender === '男' ? '他' : '她'}到车站的时候，你忽然觉得这些年过得太快了。——月开销归零，但心多了一块空缺。`);
      child.monthlyExpense = 0;
      state.happiness = Math.max(0, state.happiness - 3);
    }
  }
}

// ============================================================
// 朋友年度处理
// ============================================================
function processFriends(state: GameState, logs: string[]) {
  for (const friend of state.friends) {
    // 关系自然衰减
    const yearsSinceContact = state.currentAge - friend.lastContactAge;
    if (yearsSinceContact > 1) {
      friend.relation = Math.max(0, friend.relation - yearsSinceContact * 2);
    }

    // 随机联系
    if (Math.random() < 0.3) {
      friend.lastContactAge = state.currentAge;
      friend.relation = Math.min(100, friend.relation + 2);
    }

    // 借钱事件
    if (friend.borrowedAmount > 0 && Math.random() < 0.3) {
      if (Math.random() < 0.6) {
        // 还钱了
        const repay = Math.min(friend.borrowedAmount, friend.borrowedAmount * (0.3 + Math.random() * 0.7));
        friend.borrowedAmount = Math.max(0, Math.round(friend.borrowedAmount - repay));
        state.currentSavings += Math.round(repay);
        if (friend.borrowedAmount <= 0) {
          logs.push(`${friend.name}终于把欠你的钱还清了，你约${friend.type === '发小' ? '他' : '他'}喝了顿酒。——朋友关系：${friend.relation}`);
        }
      } else {
        // 失联
        friend.relation = Math.max(0, friend.relation - 10);
        logs.push(`你给${friend.name}发消息没回，打了两个电话也没接。那${Math.round(friend.borrowedAmount)}块钱，你决定不再想了。——朋友关系：${friend.relation}`);
        friend.borrowedAmount = 0; // 放弃
      }
    }

    // 朋友借钱请求
    if (friend.borrowedAmount === 0 && friend.relation > 40 && state.currentAge >= 25 && Math.random() < 0.08) {
      const amount = 5000 + Math.floor(Math.random() * 45000);
      // 简化：自动借出
      if (state.currentSavings > amount * 2) {
        state.currentSavings -= amount;
        friend.borrowedAmount = amount;
        logs.push(`${friend.name}（${friend.type}）突然找你，支支吾吾半天，开口借${amount}元。你二话没说转了账。${friend.name}连说了三声谢谢。——朋友关系+5，但${amount}元不知何时能回。`);
        friend.relation = Math.min(100, friend.relation + 5);
      } else {
        logs.push(`${friend.name}（${friend.type}）突然找你，支支吾吾半天，开口借${amount}元。你翻了翻余额，硬着头皮说"最近手头也紧"。${friend.name}说了声"没事没事"，但你听出那声"没事"里面有事。——朋友关系-8`);
        friend.relation = Math.max(0, friend.relation - 8);
      }
    }

    // 渐行渐远
    if (friend.relation < 15 && Math.random() < 0.1) {
      logs.push(`你发现${friend.name}的朋友圈已经对你不可见了。你们就这样在时间的缝隙里散落了。——渐行渐远`);
    }

    // 朋友结婚随份子（使用 Set 追踪，避免不安全的 (friend as any)）
    if (state.currentAge >= 25 && state.currentAge <= 35 && !marriedFriendSet.has(friend.name) && Math.random() < 0.1) {
      const gift = 500 + Math.floor(Math.random() * 1500);
      state.currentSavings -= gift;
      logs.push(`${friend.name}结婚了！你随了${gift}元份子钱，在婚礼上喝了十杯酒，回来吐了一路。——关系+3，钱包-${gift}`);
      friend.relation = Math.min(100, friend.relation + 3);
      marriedFriendSet.add(friend.name);
    }
  }
}
