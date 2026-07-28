/**
 * 人生里程碑小结生成器
 *
 * 三个节点的情感弧线：
 *   30岁 —— 回望与承认：第一个十年过去了，你成为了什么样的人，承认自己可能不会成为想象中的人
 *   40岁 —— 承重与失去：父母老去、身体走下坡、朋友变少、梦想褪色，但有具体的东西在支撑你
 *   50岁 —— 放下与平静：不是认命，是看清什么重要什么不重要
 *
 * 60岁不再生成小结——那属于退休结局的舞台。
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

/** 十年间发生的重大事件 */
interface DecadeEvents {
  married: boolean;
  divorced: boolean;
  hadChild: boolean;
  boughtHouse: boolean;
  unemployed: boolean;
  seriousIllness: boolean;
  fatherDied: boolean;
  motherDied: boolean;
  parentDiedGeneric: boolean; // "永远失去了至亲" 等不区分父母的表述
  parentHospitalized: boolean;
  bankrupt: boolean;
  allInQuit: boolean;
  startedBusiness: boolean;
  moved: boolean;
  businessFailed: boolean;
}

/** 从 lifeLog 中提取十年间的重大事件 */
function extractKeyEvents(state: GameState, sinceAge: number): DecadeEvents {
  const ev: DecadeEvents = {
    married: false,
    divorced: false,
    hadChild: false,
    boughtHouse: false,
    unemployed: false,
    seriousIllness: false,
    fatherDied: false,
    motherDied: false,
    parentDiedGeneric: false,
    parentHospitalized: false,
    bankrupt: false,
    allInQuit: false,
    startedBusiness: false,
    moved: false,
    businessFailed: false,
  };

  for (const log of state.lifeLog) {
    const match = log.match(/^第(\d+)岁/);
    if (!match) continue;
    const age = parseInt(match[1]);
    if (age < sinceAge) continue;

    if (/结婚|婚礼/.test(log)) ev.married = true;
    if (/离婚|离婚证/.test(log)) ev.divorced = true;
    if (/宝宝|出生|为人父|为人母|孩子出生/.test(log)) ev.hadChild = true;
    if (/买房|购房|入住新房/.test(log)) ev.boughtHouse = true;
    if (/裁员|失业|被裁|解雇|辞退/.test(log)) ev.unemployed = true;

    // 重病/住院：区分自己与父母
    if (/重病|大病|住院|手术|癌症|肿瘤|确诊|急性阑尾/.test(log)) {
      const mentionsFather = /父亲|爸爸/.test(log);
      const mentionsMother = /母亲|妈妈/.test(log);
      const mentionsParent = mentionsFather || mentionsMother || /父母|爸妈/.test(log);
      if (mentionsParent) {
        ev.parentHospitalized = true;
        // 如果同时出现了"走了/不在了/去世"等死亡词，标记为离世
        if (/(走了|不在了|去世|离世|过世|病逝|没了|永别|没能留住)/.test(log)) {
          if (mentionsFather && !mentionsMother) ev.fatherDied = true;
          else if (mentionsMother && !mentionsFather) ev.motherDied = true;
          else ev.parentDiedGeneric = true;
        }
      } else {
        ev.seriousIllness = true;
      }
    }

    // 亲情离世：父亲/爸爸/母亲/妈妈/爸妈/父母 + 走了/不在了/去世/离世/过世/病逝/没了/永别
    if (/(父亲|爸爸).{0,4}(走了|不在了|去世|离世|过世|病逝|没了|永别|咽气)/.test(log)) ev.fatherDied = true;
    if (/(母亲|妈妈).{0,4}(走了|不在了|去世|离世|过世|病逝|没了|永别|咽气)/.test(log)) ev.motherDied = true;
    if (/(爸妈|父母).{0,4}(走了|不在了|去世|离世|过世|病逝|没了|永别|咽气)/.test(log)) ev.parentDiedGeneric = true;
    if (/永远失去了.{0,6}至亲|子欲养而亲不待|没能留住他|没能留住她/.test(log)) ev.parentDiedGeneric = true;

    if (/黑天鹅|爆仓|破产|存款归零/.test(log)) ev.bankrupt = true;
    if (/解散了团队|创业失败|公司倒闭|关掉公司/.test(log)) ev.businessFailed = true;
    if (/All In|辞职全力/.test(log)) ev.allInQuit = true;
    if (/创业|注册公司|成立公司/.test(log)) ev.startedBusiness = true;
    if (/搬家|移居|迁居|搬去/.test(log)) ev.moved = true;
  }
  return ev;
}

/** 父母离世的叙述短语 */
function parentDeathPhrase(ev: DecadeEvents): string | null {
  if (ev.fatherDied && ev.motherDied) return '父母都走了';
  if (ev.fatherDied) return '父亲走了';
  if (ev.motherDied) return '母亲不在了';
  if (ev.parentDiedGeneric) return '至亲走了';
  return null;
}

// ============================================================
// 30岁小结：回望与承认
// 第一个十年过去了，你成为了什么样的人，承认自己可能不会成为想象中的人
// ============================================================
function summaryAt30(state: GameState): string[] {
  const lines: string[] = [];
  const savings = state.currentSavings;
  const salary = state.currentMonthlySalary;
  const startSalary = state.careerStartSalary;
  const pathName = state.retirementPath ? PATH_NAMES[state.retirementPath] : null;
  const ev = extractKeyEvents(state, 22);
  const p = state.partner;

  // —— 开篇：十年
  if (pathName) {
    if (state.isAllInPath) {
      lines.push(`三十岁。你辞了职All In做${pathName}，到现在好几年了。收入不稳定，好的月份和差的月份差好几倍，你已经不跟家里人说具体数字了。`);
    } else {
      lines.push(`三十岁。白天上班，晚上和周末做${pathName}，两份工叠在一起，你很久没有在十二点前睡过觉了。`);
    }
  } else {
    const mult = startSalary > 0 ? (salary / startSalary) : 1;
    const salaryDesc = mult >= 3 ? '翻了三倍' : mult >= 2 ? '翻了一倍多' : '涨了一些';
    const jobDesc = ev.unemployed ? '中间被裁过一次，在家待了两个月才找到下家' : '没跳过槽';
    lines.push(`三十岁。月薪从${fmtWan(startSalary)}到${fmtWan(salary)}，${salaryDesc}，${jobDesc}。第一个十年，就这么过来了。`);
  }

  // —— 具体人生事件（编织进叙事，不罗列）
  const eventPieces: string[] = [];

  // 感情/婚姻
  if (ev.divorced) {
    eventPieces.push('结了婚又离了，搬走那天你帮着把箱子拎到楼下，你们谁都没说保重');
  } else if (p && p.datingStage === 'married' && !p.hasDivorced) {
    const years = 30 - p.marriedYear;
    eventPieces.push(`结婚${years > 0 ? years + '年' : '不到一年'}，日子过得比恋爱时安静`);
  } else if (p && p.datingStage === 'serious') {
    eventPieces.push('在一段认真的关系里，但你还没下定决心');
  } else if (p && (p.datingStage === 'divorced' || p.hasDivorced)) {
    eventPieces.push('经历过一段婚姻，现在一个人住');
  }

  // 房子
  if (ev.boughtHouse) {
    eventPieces.push('买了房，房贷每个月从工资里扣走一大块');
  }
  // 搬家
  if (ev.moved && !ev.boughtHouse) {
    eventPieces.push('搬了好几次家，东西越搬越少');
  }
  // 父母住院
  if (ev.parentHospitalized && !ev.fatherDied && !ev.motherDied && !ev.parentDiedGeneric) {
    eventPieces.push('爸住过一次院，你连夜赶回去，在病房外的走廊上坐了半宿');
  }
  // 父母离世
  const deathPhrase = parentDeathPhrase(ev);
  if (deathPhrase) {
    eventPieces.push(`${deathPhrase}，你有时候拿起手机想拨那个号码，拨到一半想起来`);
  }
  // 自己重病
  if (ev.seriousIllness) {
    eventPieces.push('自己也住过一次院，一个人签的手术同意书');
  }
  // 破产/爆仓
  if (ev.bankrupt) {
    eventPieces.push('那年爆了仓，存款一夜清零，你不敢告诉家里人');
  }
  // 创业
  if (ev.startedBusiness && !ev.businessFailed) {
    eventPieces.push('跟朋友注册了家小公司，还没赚钱，但也没倒');
  }

  if (eventPieces.length >= 2) {
    lines.push(eventPieces.slice(0, 2).join('。') + '。');
  } else if (eventPieces.length === 1) {
    lines.push(eventPieces[0] + '。');
  } else {
    // 没有重大事件：写日常
    if (p && p.datingStage === 'dating') {
      lines.push('谈着一段不咸不淡的恋爱，租着一间不大的房子，周末偶尔和朋友吃饭。');
    } else if (!p || p.datingStage === 'single') {
      lines.push('还是一个人，租着房子，周末加班或者睡觉，没有什么特别的事发生。');
    } else {
      lines.push('日子过得不紧不慢，没有大起，也没有大落。');
    }
  }

  // —— 财务现实
  if (ev.bankrupt || savings < 0) {
    lines.push(`存款是负的。三十岁的你比二十二岁时还穷，信用卡还欠着钱。你不再跟大学同学聊理想了——不是不想聊，是聊不起。`);
  } else if (savings > 500000) {
    lines.push(`存款${fmtWan(savings)}。你有了一点底气，但你见过同事被裁后三个月找不到工作的样子，知道这点底气经不住什么风浪。`);
  } else if (savings > 100000) {
    lines.push(`存款${fmtWan(savings)}。饿不死，也撑不起什么野心。`);
  } else {
    lines.push(`存款${fmtWan(savings)}。你已经不做三十岁财务自由的梦了。`);
  }

  // —— 收尾：承认
  const hasScars = ev.divorced || ev.seriousIllness || ev.bankrupt || ev.fatherDied || ev.motherDied || ev.parentDiedGeneric;
  if (hasScars) {
    lines.push('三十岁，你没活成十八岁时想象的样子。那些疤还在，但你不再试图遮掩它们了。');
  } else {
    lines.push('三十岁。你承认自己大概率不会成为十八岁时想象的那个人了。这个承认花了十年，但说出口的时候，反而松了口气。');
  }

  return lines.slice(0, 6);
}

// ============================================================
// 40岁小结：承重与失去
// 父母老去、身体走下坡、朋友变少、梦想褪色，但有具体的东西在支撑你
// 直面伤痕，不用"和解"搪塞
// ============================================================
function summaryAt40(state: GameState): string[] {
  const lines: string[] = [];
  const savings = state.currentSavings;
  const pathName = state.retirementPath ? PATH_NAMES[state.retirementPath] : null;
  const ev = extractKeyEvents(state, 30);
  const p = state.partner;
  const hasChild = state.hasChild && state.children.length > 0;
  const hasMortgage = state.currentMortgageCost > 0;
  const parentAlive = state.parents.isAlive;
  const deathPhrase = parentDeathPhrase(ev);

  // —— 开篇：身体先说话
  lines.push('四十岁。身体先告诉你的——腰开始酸了，体检报告上箭头一年比一年多，熬一次夜要两天才能缓过来。');

  // —— 父母
  if (!parentAlive || deathPhrase) {
    const who = deathPhrase || '父母不在了';
    lines.push(`${who}。过年不用再抢票回家，但年夜饭桌上永远多了一副碗筷。你没有走出来，只是学会了带着那个空缺继续过日子。`);
  } else if (state.parents.health < 40 || ev.parentHospitalized) {
    lines.push(`父母${state.parents.age}岁了，住过院，身体明显不如从前。你开始害怕手机在深夜响起，每次看到老家的号码心跳都会漏一拍。`);
  } else {
    lines.push(`父母${state.parents.age}岁了，头发白了大半。你回家的次数比三十岁时多了，每次走都塞一车吃的回来。`);
  }

  // —— 这十年的伤（直面，不和解）
  const scars: string[] = [];
  if (ev.divorced) {
    scars.push('离了婚，财产分走了一部分，孩子每周见一次');
  }
  if (ev.unemployed) {
    scars.push('被裁过，投出去的简历石沉大海，最后那份工作薪水不如以前');
  }
  if (ev.bankrupt || ev.businessFailed) {
    scars.push('创业失败，赔了钱，解散了团队，有个朋友至今没再联系');
  }
  if (ev.seriousIllness) {
    scars.push('生了一场大病，出院后你把烟戒了，也把那些不必要的酒局推了');
  }

  let pathLine: string | null = null;
  if (scars.length > 0) {
    lines.push(`这十年，${scars.slice(0, 2).join('。')}。你没有和这些事和解。有些夜晚你还是会想"如果当初"，但天亮了你还是得爬起来。`);
  } else {
    if (pathName) {
      if (state.isAllInPath) {
        if (state.pathFaith < 30) {
          pathLine = `${pathName}这条路快走不下去了。收入不稳定，信心在磨损，但你已经四十了，回头的成本比往前走还高。`;
        } else {
          pathLine = `All In ${pathName}这些年，你没赚到什么大钱，但也没饿死。你不再跟人解释这条路对不对了——解释了他们也不懂。`;
        }
      } else {
        pathLine = `${pathName}还在做，不温不火。它没能让你财务自由，但它是你在工作和家庭之外，唯一留给自己的东西。`;
      }
    } else {
      pathLine = '这十年没什么大起大落。上班、下班、还贷、陪孩子写作业，每天都差不多。';
    }
    if (pathLine) lines.push(pathLine);
  }

  // —— 支撑你的具体东西
  const pillars: string[] = [];
  if (p && p.datingStage === 'married' && !p.hasDivorced) {
    pillars.push('身边那个人');
  }
  if (hasChild) {
    const eldest = state.children[0];
    const childAge = 40 - eldest.birthYear;
    pillars.push(`${childAge}岁的孩子`);
  }
  if (pathName && !ev.businessFailed && !(state.isAllInPath && state.pathFaith < 30)) {
    pillars.push(`你做了十几年的${pathName}`);
  }
  if (hasMortgage) {
    pillars.push('那套还在还贷的房子');
  }
  if (savings > 1000000) {
    pillars.push(`存款里的${fmtWan(savings)}`);
  }
  if (ev.startedBusiness && !ev.businessFailed) {
    pillars.push('那家还活着的小公司');
  }

  if (pillars.length > 0) {
    lines.push(`撑着你的不是什么信念，是具体的东西：${pillars.slice(0, 3).join('、')}。你成了那个不能倒下的人——身后有人等着吃饭、等着交学费、等着有人扛事。`);
  } else {
    lines.push(`存款${fmtWan(savings)}。你没什么退路，也没什么指望，但你还是每天早上闹钟响了就爬起来。四十岁的人，不靠热血了。`);
  }

  // —— 收尾
  if (scars.length > 1) {
    lines.push('四十岁。你没有和生活和解，你只是学会了在负重下呼吸。');
  } else {
    lines.push('四十岁。年轻时想做的事大多没做成，但你还站在这里。日子还得过。');
  }

  return lines.slice(0, 6);
}

// ============================================================
// 50岁小结：放下与平静
// 不是认命，是看清什么重要什么不重要
// ============================================================
function summaryAt50(state: GameState): string[] {
  const lines: string[] = [];
  const savings = state.currentSavings;
  const pathName = state.retirementPath ? PATH_NAMES[state.retirementPath] : null;
  const ev = extractKeyEvents(state, 40);
  const totalWealth = savings + (state.propertyValue || 0) + (state.shopValue || 0);
  const p = state.partner;
  const hasChild = state.hasChild && state.children.length > 0;
  const parentAlive = state.parents.isAlive;
  const dream = state.retirementDream;
  const deathPhrase = parentDeathPhrase(ev);

  // —— 开篇：五十岁
  lines.push('五十岁。退休看得见了。你不再刷招聘软件了——不是不想，是知道没人会要一个五十岁的人。');

  // —— 父母/代际
  if (!parentAlive || deathPhrase) {
    lines.push('父母走了有些年了。你现在做饭的味道越来越像你妈，说话的语气越来越像你爸。有些东西他们留给了你，不是存折上的数字，是你身上改不掉的习惯。');
  } else {
    lines.push(`父母${state.parents.age}岁了，你越来越频繁地回去看他们。你不再嫌他们啰嗦了——你知道还能听几年是几年。`);
  }

  // —— 这十年发生的事，编织进叙事
  const fiftiesEvents: string[] = [];
  if (ev.seriousIllness || state.health < 50) {
    fiftiesEvents.push('身体亮过红灯，住过院，你终于把医生的话当回事了');
  }
  if (ev.divorced) {
    fiftiesEvents.push('婚姻还是没撑住，你们在这十年里办了手续');
  }
  if (ev.bankrupt || ev.businessFailed) {
    fiftiesEvents.push('生意亏了大钱，你把商铺挂了出去');
  }
  if (ev.unemployed) {
    fiftiesEvents.push('被裁了，找不到像样的工作，最后接了份零工');
  }
  if (hasChild) {
    const eldest = state.children[0];
    const childAge = 50 - eldest.birthYear;
    if (childAge >= 22) {
      fiftiesEvents.push(`孩子${childAge}岁了，参加了工作，不再需要你操心学费`);
    } else if (childAge >= 18) {
      fiftiesEvents.push('孩子上大学了，家里忽然安静了很多');
    }
  }
  if (deathPhrase && !parentAlive) {
    fiftiesEvents.push('送走了最后一位老人，你彻底成了家里辈分最大的人');
  }

  if (fiftiesEvents.length > 0) {
    lines.push(fiftiesEvents.slice(0, 2).join('。') + '。');
  } else {
    // 没有大事发生：写身体感知
    if (state.health < 60) {
      lines.push('血压高了，膝盖不如从前，爬三层楼要歇一次。你开始按时吃药，不再逞强。');
    } else {
      lines.push('身体还算争气，同龄人有的已经拄上了拐，你还能自己买菜做饭。');
    }
  }

  // —— 看清什么重要，什么不重要
  const important: string[] = [];
  if (p && p.datingStage === 'married' && !p.hasDivorced) {
    important.push('每天晚上给你留灯的那个人');
  }
  if (hasChild) {
    important.push('孩子偶尔打来的电话');
  }
  if (state.health > 60) {
    important.push('还算能走能跳的身体');
  } else {
    important.push('还能自己做饭、自己下楼买菜的日子');
  }
  if (totalWealth > state.targetWealth * 0.6) {
    important.push(`账上那${fmtWan(totalWealth)}——不多，但够你不用看别人脸色`);
  }

  const notImportant: string[] = ['别人怎么看你', '同学聚会上谁赚得多'];
  if (pathName && !state.isAllInPath) {
    notImportant.push(`${pathName}能不能做成大事业`);
  }

  lines.push(`你终于分清了什么重要——${important.slice(0, 2).join('、')}。什么不重要——${notImportant.slice(0, 2).join('、')}。这个分清楚花了你五十年。`);

  // —— 路径/事业回顾
  if (pathName) {
    if (state.isAllInPath && state.pathFaith >= 30 && !ev.businessFailed && !ev.bankrupt) {
      lines.push(`${pathName}这条路你走了大半辈子。没赚到什么大钱，也没做成什么大事，但你知道那些时间没有白花。`);
    } else if (state.isAllInPath && (state.pathFaith < 30 || ev.businessFailed || ev.bankrupt)) {
      lines.push(`${pathName}这条路最后没走通。账面上的数字告诉你该停了，你停了。`);
    } else {
      lines.push(`${pathName}你做了很多年，它没变成主业，但它让你在那些最难熬的夜晚有个地方可去。`);
    }
  } else {
    lines.push('上了一辈子班，没做成什么大事，但把该尽的责任尽了。你不再觉得这是失败。');
  }

  // —— 收尾：平静，不是认命
  if (dream) {
    const dreamNames: Record<string, string> = {
      world_traveler: '环游世界',
      farm_hermit: '田园归隐',
      lifelong_scholar: '终身学者',
      ultimate_otaku: '终极宅神',
      square_dance_king: '广场舞之王',
      silver_volunteer: '银发志愿者',
    };
    const dreamName = dreamNames[dream] || '那个想了很多年的事';
    lines.push(`五十岁，你开始认真准备退休后的日子了。${dreamName}还在清单上，排在第一位。`);
  } else {
    lines.push('五十岁。你不再追了，也不再等了。剩下的路，慢慢走。');
  }

  return lines.slice(0, 6);
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
