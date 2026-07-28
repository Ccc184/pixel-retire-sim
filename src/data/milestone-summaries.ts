/**
 * 人生里程碑小结生成器
 *
 * 设计理念：以小说家的笔触，在30/40/50岁三个节点为玩家书写人生回顾。
 * 每段小结短小精炼（5-6句），力求心生感慨。
 * 60岁不再生成小结——那属于退休结局的舞台。
 *
 * 三个节点的情感弧线：
 *   30岁 —— 回望与确认：第一个十年过去了，你成了谁？
 *   40岁 —— 承重与和解：中年的重量压下来，你还好吗？
 *   50岁 —— 放下与期待：最后一段路，你准备好了吗？
 */

import type { GameState, RetirementPathId } from '../types/global.d.js';

// ============================================================
// 路径名称映射
// ============================================================
const PATH_NAMES: Record<RetirementPathId, string> = {
  ai_symbiote: 'AI共生者',
  chain_native: '链上原住民',
  digital_nomad: '数字游牧民',
  super_ip: '超级IP',
  silver_economy: '银发守夜人',
  bio_gambler: '生物赌徒',
};

// ============================================================
// 工具函数
// ============================================================
function fmtWan(n: number): string {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿';
  if (n >= 10000) return Math.round(n / 10000) + '万';
  return n.toString();
}

/** 从 lifeLog 中提取重大事件关键词 */
function extractKeyEvents(state: GameState, sinceAge: number): string[] {
  const events: string[] = [];
  for (const log of state.lifeLog) {
    const match = log.match(/^第(\d+)岁/);
    if (!match) continue;
    const age = parseInt(match[1]);
    if (age < sinceAge) continue;

    // 提取重大事件
    if (/结婚|婚礼/.test(log)) events.push('结婚');
    if (/离婚/.test(log)) events.push('离婚');
    if (/宝宝|出生|为人父|为人母/.test(log)) events.push('为人父母');
    if (/买房|购房|入住/.test(log)) events.push('买房');
    if (/裁员|失业|被裁/.test(log)) events.push('失业');
    if (/重病|住院|手术/.test(log)) events.push('重病');
    if (/黑天鹅|爆仓|破产/.test(log)) events.push('黑天鹅');
    if (/All In|辞职|全力/.test(log)) events.push('All In辞职');
    if (/创业|注册公司|成立/.test(log)) events.push('创业');
    if (/搬家|移居|迁/.test(log)) events.push('搬家');
    if (/父母.*离世|父亲.*去世|母亲.*去世/.test(log)) events.push('亲人离世');
  }
  // 去重，最多保留5个
  return [...new Set(events)].slice(0, 5);
}

/** 重大事件串成短语 */
function keyEventsPhrase(events: string[]): string | null {
  if (events.length === 0) return null;
  if (events.length <= 3) return events.join('、');
  return events.slice(0, 3).join('、') + '……';
}

// ============================================================
// 30岁小结：回望与确认
// ============================================================
function summaryAt30(state: GameState): string[] {
  const lines: string[] = [];
  const savings = state.currentSavings;
  const salary = state.currentMonthlySalary;
  const startSalary = state.careerStartSalary;
  const pathName = state.retirementPath ? PATH_NAMES[state.retirementPath] : null;
  const keyEvents = extractKeyEvents(state, 22);
  const eventsText = keyEventsPhrase(keyEvents);

  // —— 开篇：时间感
  lines.push('三十岁。没有仪式感，只是某天填表时年龄栏的数字换了——你这才意识到，"年轻"已经不是你的挡箭牌了。');

  // —— 事业与路径
  if (pathName) {
    if (state.isAllInPath) {
      lines.push(`你All In了${pathName}这条路。辞职那天像从悬崖跳进海里，到现在你还没分清自己是在飞还是在坠。`);
    } else {
      lines.push(`你选了${pathName}这条路，白天上班，夜晚和周末喂养它。它还没长大，但你还在喂——这本身就是一种回答。`);
    }
  } else {
    const multiple = startSalary > 0 ? (salary / startSalary).toFixed(1) : '1.0';
    lines.push(`月薪从${fmtWan(startSalary)}到${fmtWan(salary)}，${parseFloat(multiple) >= 2 ? '翻了一倍多' : '涨了一些'}。所谓职业发展，不过是无数个"再撑一年"叠成的台阶。`);
  }

  // —— 财务现实
  if (savings > 500000) {
    lines.push(`存款${fmtWan(savings)}。同龄人还在为房租发愁时，你有了一点底气——但你知道这点底气在一场大病面前什么都不是。`);
  } else if (savings > 100000) {
    lines.push(`存款${fmtWan(savings)}，不多不少。卡在"饿不死也富不了"的中间地带，和大多数人一样。`);
  } else if (savings < 0) {
    lines.push(`存款是负的。三十岁的你比二十岁时更穷了——但你只能告诉自己，这不是终点。`);
  } else {
    lines.push(`存款${fmtWan(savings)}。说多不多，说少……确实少。你在心里把"财务自由"划掉，换成了"活着就行"。`);
  }

  // —— 感情/家庭
  const p = state.partner;
  if (p && p.datingStage === 'married' && !p.hasDivorced) {
    const years = 30 - p.marriedYear;
    lines.push(`${years > 0 ? `结婚${years}年了` : '刚结婚'}。婚姻不是童话的结局，是另一段故事的序章。`);
  } else if (p && p.datingStage === 'serious') {
    lines.push(`你在一段认真的关系里。ta见过你最疲惫的样子，你还没决定要不要让ta见你最老的样子。`);
  } else if (p && (p.datingStage === 'divorced' || p.hasDivorced)) {
    lines.push(`经历过一段婚姻的起落。你不再急着找下一个人——一个人也没什么不好，只是偶尔深夜觉得安静得有点多余。`);
  } else {
    lines.push(`还是一个人。不是不想爱，是越来越难遇到那个让你愿意交出时间和软弱的人。`);
  }

  // —— 重大事件
  if (eventsText) {
    lines.push(`这些年——${eventsText}。有些成了勋章，有些成了疤，都长在你身上了。`);
  }

  // —— 收尾感慨
  lines.push('三十岁。你不再年轻，但也远未老去。最难的从来不是做选择——是做了选择之后不回头。');

  return lines;
}

// ============================================================
// 40岁小结：承重与和解
// ============================================================
function summaryAt40(state: GameState): string[] {
  const lines: string[] = [];
  const savings = state.currentSavings;
  const pathName = state.retirementPath ? PATH_NAMES[state.retirementPath] : null;
  const keyEvents = extractKeyEvents(state, 30);
  const eventsText = keyEventsPhrase(keyEvents);

  // —— 开篇：中年的重量
  lines.push('四十不惑——古人说的。但你不记得从哪天起，"不惑"变成了"不问"。不是想通了，是懒得想了。');

  // —— 路径与信念
  if (pathName) {
    if (state.isAllInPath) {
      const faith = state.pathFaith;
      if (faith > 60) {
        lines.push(`All In ${pathName}好几年了。你瘦了，也硬了。信念还在，只是从燃烧的火变成了闷烧的炭——不亮，但烫。`);
      } else if (faith > 30) {
        lines.push(`All In ${pathName}这些年，你开始怀疑当初的孤注一掷是不是太冲动。但你已经回不去了——不是不能，是不甘心。`);
      } else {
        lines.push(`${pathName}这条路，你快走不下去了。信念像沙漏里最后几粒沙，你看着它们落下去，攥不住。`);
      }
    } else {
      lines.push(`${pathName}这条路你还在走，白天上班，晚上经营。有人说你"不务正业"，你笑笑没说话——他们不知道，正是这条路让你在格子间里撑过了这些年。`);
    }
  } else {
    lines.push('你没有选那条额外的路。生活就是上班、下班、还贷、偶尔旅行。没什么不好——只是偶尔会想：如果当初……算了。');
  }

  // —— 财务与责任
  const hasMortgage = state.currentMortgageCost > 0;
  const hasChild = state.hasChild && state.children.length > 0;
  const parentAlive = state.parents.isAlive;

  let burdens: string[] = [];
  if (hasMortgage) burdens.push('房贷');
  if (hasChild) burdens.push('孩子');
  if (parentAlive && state.parents.health < 50) burdens.push('年迈的父母');
  if (burdens.length > 0) {
    lines.push(`存款${fmtWan(savings)}。${burdens.join('、')}压在肩上，你成了那个"不能倒下"的人。你开始理解父亲当年沉默抽烟的背影。`);
  } else if (savings > 2000000) {
    lines.push(`存款${fmtWan(savings)}。你终于不用看价格标签了，但发现自己已经没什么想买的东西。`);
  } else {
    lines.push(`存款${fmtWan(savings)}。不上不下，不好不坏。四十岁就是这样——没有大起大落，只有日复一日的"还过得去"。`);
  }

  // —— 父母
  if (!parentAlive) {
    lines.push('父母不在了。你在某些瞬间还会习惯性地想拨那个号码，然后停住。有些失去不是疼，是空。');
  } else if (state.parents.health < 40) {
    lines.push(`父母${state.parents.age}岁了，身体大不如前。你开始害怕接到老家的电话，每次铃响心脏都会停一拍。`);
  }

  // —— 重大事件
  if (eventsText) {
    lines.push(`这十年——${eventsText}。你以为过不去的坎，现在都成了简历上一行淡淡的字。`);
  }

  // —— 收尾感慨
  lines.push('四十岁。你不再和命运讨价还价了——不是认命，是终于学会和遗憾坐下来喝杯茶。');

  return lines;
}

// ============================================================
// 50岁小结：放下与期待
// ============================================================
function summaryAt50(state: GameState): string[] {
  const lines: string[] = [];
  const savings = state.currentSavings;
  const pathName = state.retirementPath ? PATH_NAMES[state.retirementPath] : null;
  const keyEvents = extractKeyEvents(state, 40);
  const eventsText = keyEventsPhrase(keyEvents);
  const dream = state.retirementDream;

  // —— 开篇：倒数
  lines.push('五十岁。退休不再是个遥远的概念，你能看见终点线的颜色了。不是所有故事都有好结局——但每个故事都值得有个结局。');

  // —— 路径回顾
  if (pathName) {
    if (state.isAllInPath) {
      lines.push(`${pathName}——这条路你走了半辈子。它给了你自由，也拿走了一些东西。你不再问"值不值得"，因为答案已经长在你身上了。`);
    } else {
      lines.push(`${pathName}这条路你断断续续走了很多年。它没能成为你的全部，但它让你知道：你不只是一份工作。`);
    }
  } else {
    lines.push('大半辈子都在上班。你没有什么"副业"或"梦想"，但你把日子过踏实了——这本身就不容易。');
  }

  // —— 财务终局预判
  const totalWealth = savings + (state.propertyValue || 0) + (state.shopValue || 0);
  if (totalWealth > state.targetWealth) {
    lines.push(`净资产${fmtWan(totalWealth)}。你做到了。这个数字意味着你可以不再为钱工作——虽然你用了三十年才走到这里。`);
  } else if (totalWealth > state.targetWealth * 0.6) {
    lines.push(`净资产${fmtWan(totalWealth)}，离目标还差一口气。你知道这口气得用最后几年拼命吹——或者，学会接受"差不多就够了"。`);
  } else {
    lines.push(`净资产${fmtWan(totalWealth)}。说实话，离退休目标还差不少。但五十岁了，你开始想：也许"够"不是一个数字，是一种心态。`);
  }

  // —— 身体
  if (state.health < 40) {
    lines.push('身体在提醒你它不是永动机。年轻时透支的，现在开始连本带利地还。你开始认真对待"健康"——不是为了活更久，是为了活得像个人。');
  } else if (state.health > 70) {
    lines.push('身体还算争气。同龄人开始各种毛病的时候，你还能跑能跳。你知道这份健康是最大的财富——比存款数字重要得多。');
  }

  // —— 子女
  if (state.hasChild && state.children.length > 0) {
    const eldest = state.children[0];
    const childAge = 50 - eldest.birthYear;
    if (childAge >= 18) {
      lines.push(`孩子${childAge}岁了，有了自己的方向。你看着ta的背影，想起自己二十岁时也这样头也不回地走过。现在你站在路的另一头，终于读懂了当年父母的眼神。`);
    }
  }

  // —— 重大事件
  if (eventsText) {
    lines.push(`最后这段路——${eventsText}。每件事都像命运在提醒你：你活过，你选择过，你没认输过。`);
  }

  // —— 退休梦想
  if (dream) {
    const dreamNames: Record<string, string> = {
      world_traveler: '环游世界',
      farm_hermit: '田园归隐',
      lifelong_scholar: '终身学者',
      ultimate_otaku: '终极宅神',
      square_dance_king: '广场舞之王',
      silver_volunteer: '银发志愿者',
    };
    const dreamName = dreamNames[dream] || '你的退休梦想';
    lines.push(`${dreamName}——这就是你在终点线另一边想看到的东西。光是想着它，这些年就没有白走。`);
  }

  // —— 收尾感慨
  lines.push('五十岁。该放下的放下，该握紧的握紧。最后一程，轻装上阵。');

  return lines;
}

// ============================================================
// 主入口
// ============================================================

/**
 * 生成里程碑人生小结
 * @param state 当前游戏状态
 * @param age 当前年龄（30/40/50）
 * @returns 小结文本行数组
 */
export function generateMilestoneSummary(state: GameState, age: number): string[] {
  if (age === 30) return summaryAt30(state);
  if (age === 40) return summaryAt40(state);
  if (age === 50) return summaryAt50(state);
  return [];
}

/** 判断是否为里程碑年龄 */
export function isMilestoneAge(age: number): boolean {
  return age === 30 || age === 40 || age === 50;
}
