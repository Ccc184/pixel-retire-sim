import type { DecisionCard, GameState, PartnerPersonality } from '../types/global.d.js';
import { getRandomName } from './romance.js';

// 城市房产参数（按级别）
interface HouseLevel {
  label: string;           // 级别名称
  tag: string;             // 简短标签
  downPayment: number;     // 首付
  annualMortgage: number;  // 年供
  mortgageYears: number;   // 贷款年限
  propertyValue: number;   // 房产估值
  happinessBonus: number;   // 幸福加成
  hint: string;            // 提示
  minSavings: number;      // 最低存款要求
}

function getHouseLevels(city: string): HouseLevel[] {
  const levels: Record<string, HouseLevel[]> = {
    '资本修罗场': [
      { label: '老破小', tag: '刚需上车', downPayment: 80000, annualMortgage: 55000, mortgageYears: 20, propertyValue: 1200000, happinessBonus: 1, hint: '首付8万 · 年供5.5万 · 面积小但够住', minSavings: 80000 },
      { label: '两居室', tag: '改善首选', downPayment: 200000, annualMortgage: 100000, mortgageYears: 25, propertyValue: 2500000, happinessBonus: 4, hint: '首付20万 · 年供10万 · 70年产权 · 有点挤', minSavings: 200000 },
      { label: '三居室', tag: '品质生活', downPayment: 500000, annualMortgage: 160000, mortgageYears: 25, propertyValue: 4000000, happinessBonus: 8, hint: '首付50万 · 年供16万 · 有小区花园和地下车位', minSavings: 500000 },
      { label: '大平层/江景', tag: '终极改善', downPayment: 1000000, annualMortgage: 280000, mortgageYears: 30, propertyValue: 8000000, happinessBonus: 15, hint: '首付100万 · 年供28万 · 江景房 · 圈层跃迁', minSavings: 1000000 },
    ],
    '中坚大后方': [
      { label: '老小区', tag: '刚需上车', downPayment: 25000, annualMortgage: 25000, mortgageYears: 15, propertyValue: 350000, happinessBonus: 1, hint: '首付2.5万 · 年供2.5万 · 没电梯但便宜', minSavings: 25000 },
      { label: '次新房', tag: '改善首选', downPayment: 80000, annualMortgage: 45000, mortgageYears: 20, propertyValue: 800000, happinessBonus: 4, hint: '首付8万 · 年供4.5万 · 有电梯和地下车位', minSavings: 80000 },
      { label: '洋房', tag: '品质生活', downPayment: 200000, annualMortgage: 80000, mortgageYears: 25, propertyValue: 1500000, happinessBonus: 8, hint: '首付20万 · 年供8万 · 小区有泳池和会所', minSavings: 200000 },
      { label: '别墅', tag: '终极改善', downPayment: 400000, annualMortgage: 150000, mortgageYears: 30, propertyValue: 3000000, happinessBonus: 15, hint: '首付40万 · 年供15万 · 带院子的独栋 · 但物业管理费高', minSavings: 400000 },
    ],
    '避风低洼地': [
      { label: '老公房', tag: '刚需上车', downPayment: 10000, annualMortgage: 10000, mortgageYears: 10, propertyValue: 120000, happinessBonus: 1, hint: '首付1万 · 年供1万 · 墙皮脱落但遮风挡雨', minSavings: 10000 },
      { label: '新楼盘', tag: '改善首选', downPayment: 40000, annualMortgage: 25000, mortgageYears: 15, propertyValue: 350000, happinessBonus: 4, hint: '首付4万 · 年供2.5万 · 新小区 · 物业不错', minSavings: 40000 },
      { label: '花园洋房', tag: '品质生活', downPayment: 100000, annualMortgage: 50000, mortgageYears: 20, propertyValue: 800000, happinessBonus: 8, hint: '首付10万 · 年供5万 · 带院子 · 适合养老', minSavings: 100000 },
      { label: '河景大宅', tag: '终极改善', downPayment: 200000, annualMortgage: 80000, mortgageYears: 25, propertyValue: 1500000, happinessBonus: 12, hint: '首付20万 · 年供8万 · 河边独栋 · 空气好', minSavings: 200000 },
    ],
  };
  return levels[city] || levels['中坚大后方'];
}

// 体检故事描述池（每次随机选取，避免重复感）
const HEALTH_CHECK_STORIES: string[] = [
  '你做了一次全面体检加牙科检查。医生说"总体还行"，但你注意到报告上有几项飘红。花了不少钱，但至少心里有数了。',
  '冰冷的仪器上躺了一个上午，加上牙医让你张大嘴的时候你觉得自己像条鱼。大部分箭头都在安全区，牙也没大问题。',
  '医生推了推眼镜说"还算不错"，你悬着的心终于放了下来。洗完牙后牙齿亮了好几个度。',
  '抽了五管血、做了三个CT，医生说你比同龄人强，牙医也夸你牙不错。你决定今晚加个鸡腿庆祝。',
  '体检中心的咖啡味道一言难尽，牙科钻头的声音更一言难尽。但看到报告上的"未见异常"，你觉得这是世上最好的味道。',
];

// 技能进修故事描述池
const UPSKILL_STORIES: string[] = [
  '你啃下一本本技术砖头，从菜鸟蜕变成骨干。',
  '深夜十一点，你合上最后一本教材，感觉自己又升级了一个版本。',
  '训练营里你年纪最大，但做项目最快，连年轻人都开始叫你"老师"。',
  '证书到手的那一刻，你想起当年高考没考好的自己——原来什么时候开始都不算晚。',
  '连续三个月周末泡在培训班，你的发际线又退了一厘米，但简历上终于多了闪亮的一笔。',
];

// 求职卡（失业时强制注入）
export const JOB_CARDS: Record<string, { cardA: DecisionCard; cardB: DecisionCard }> = {
  '红利行业': {
    cardA: {
      id: 'job_private_mgr',
      title: '【转型二线普通私企主管】',
      description: '你硬着头皮去面试，HR问期望薪资，你报了个比上份低三成的数字。HR说"回去商量"，你心想凉了。结果三天后offer来了，你盯着邮件愣了好久——原来放低身段也没那么难。',
      cost: 0,
      prerequisites: () => true,
      effect: (state: GameState) => {
        state.isUnemployed = false;
        state.currentProfession = '传统私企';
        state.currentMonthlySalary = Math.round(state.preUnemployedSalary * 0.45);
        return { log: `第${state.currentAge}岁，你转型成为私企主管，月薪${state.currentMonthlySalary}元。`, cost: 0 };
      },
      logTemplate: '第{年龄}岁，你放下身段重返职场，成为私企主管。',
    },
    cardB: {
      id: 'job_freelance',
      title: '【承接海外独立技术外包接单】',
      description: '你注册了自由职业平台，第一个月只接到一单，连年费都没赚回来。第二个月好点了。你终于理解了什么叫"自由且职业地失业"——但至少不用再开周会了。',
      cost: 0,
      prerequisites: () => true,
      effect: (state: GameState) => {
        state.isUnemployed = false;
        state.currentProfession = '自由职业';
        state.currentMonthlySalary = Math.round(state.preUnemployedSalary * 0.35);
        return { log: `第${state.currentAge}岁，你成为自由职业者，月薪${state.currentMonthlySalary}元。`, cost: 0 };
      },
      logTemplate: '第{年龄}岁，你成为自由职业者，开始自由且职业地失业。',
    },
  },
  '传统私企': {
    cardA: {
      id: 'job_private_mgr',
      title: '【转型二线普通私企主管】',
      description: '你硬着头皮去面试，HR问期望薪资，你报了个比上份低三成的数字。HR说"回去商量"，你心想凉了。结果三天后offer来了，你盯着邮件愣了好久——原来放低身段也没那么难。',
      cost: 0,
      prerequisites: () => true,
      effect: (state: GameState) => {
        state.isUnemployed = false;
        state.currentProfession = '传统私企';
        state.currentMonthlySalary = Math.round(state.preUnemployedSalary * 0.45);
        return { log: `第${state.currentAge}岁，你转型成为私企主管，月薪${state.currentMonthlySalary}元。`, cost: 0 };
      },
      logTemplate: '第{年龄}岁，你放下身段重返职场，成为私企主管。',
    },
    cardB: {
      id: 'job_freelance',
      title: '【承接海外独立技术外包接单】',
      description: '你注册了自由职业平台，第一个月只接到一单，连年费都没赚回来。第二个月好点了。你终于理解了什么叫"自由且职业地失业"——但至少不用再开周会了。',
      cost: 0,
      prerequisites: () => true,
      effect: (state: GameState) => {
        state.isUnemployed = false;
        state.currentProfession = '自由职业';
        state.currentMonthlySalary = Math.round(state.preUnemployedSalary * 0.35);
        return { log: `第${state.currentAge}岁，你成为自由职业者，月薪${state.currentMonthlySalary}元。`, cost: 0 };
      },
      logTemplate: '第{年龄}岁，你成为自由职业者，开始自由且职业地失业。',
    },
  },
  'default': {
    cardA: {
      id: 'job_rider',
      title: '【注册成为全职网约车/外卖骑手】',
      description: '你下载了骑手APP，第一天跑了十二单赚了两百块，腿像灌了铅。等餐时蹲在路边刷手机，你忽然觉得风吹日晒也比坐办公室开周会强。',
      cost: 0,
      prerequisites: () => true,
      effect: (state: GameState) => {
        state.isUnemployed = false;
        state.currentProfession = '一线蓝领';
        state.currentMonthlySalary = 5500;
        return { log: `第${state.currentAge}岁，你成为全职骑手，月薪5500元。`, cost: 0 };
      },
      logTemplate: '第{年龄}岁，你成为全职骑手，风里雨里都是自由。',
    },
    cardB: {
      id: 'job_vendor',
      title: '【租借简陋档口摆摊卖烤肠】',
      description: '你推着小推车去摆摊，第一天只卖了三根烤肠。隔壁大哥说"你得吆喝"，你憋了半天喊出声来。那一刻你明白——摆摊卖的不是烤肠，是面子。',
      cost: 0,
      prerequisites: () => true,
      effect: (state: GameState) => {
        state.isUnemployed = false;
        state.currentProfession = '实体创业';
        state.currentMonthlySalary = 4000;
        return { log: `第${state.currentAge}岁，你开始摆摊卖烤肠，月入4000元。`, cost: 0 };
      },
      logTemplate: '第{年龄}岁，你支起烤肠摊，开始街头创业。',
    },
  },
};

// 全量15张决策卡（严格按照设计书第五章 + 新增 category/repeatable 等字段）
export const DECISION_CARDS: DecisionCard[] = [
  // 卡1：配置高端重疾住院医疗险（一次性）
  {
    id: 'insurance',
    title: '配置高端重疾住院医疗险',
    description: '保险销售给你算了笔账，你听完有点慌。签字那天你想起妈妈说的"不怕一万就怕万一"，咬咬牙签了。条款看了三遍没看懂，但觉得自己终于像个成年人了。',
    storyDescription: '你签下保单，感到一份沉甸甸的安全感。',
    hint: '年费¥6,000 · 医疗费用报销+50%',
    cost: 6000,
    prerequisites: (state: GameState) => !state.isInsured,
    effect: (state: GameState) => {
      state.isInsured = true;
      state.insurancePremium = 6000;
      const log = `第${state.currentAge}岁，你咬着牙签下那份重疾险合约，墨水还没干透，心里那块悬了多年的石头终于落了地。`;
      return { log, cost: 6000 };
    },
    logTemplate: '第{年龄}岁，你签下重疾险保单，给自己买了一份底气。',
    category: '投资理财',
    repeatable: false,
  },
  // 卡2：奉行断舍离极简主义生活观（一次性）
  {
    id: 'minimalism',
    title: '奉行断舍离极简主义生活观',
    description: '你把家里一半的东西挂上了闲鱼。落灰的跑步机、买来没穿过的衣服、堆了三年的快递盒。卖掉时有点心疼，但看着空了一半的客厅，你突然觉得轻了不少。',
    storyDescription: '你丢掉了大半杂物，房间通透，心也简单了。',
    hint: '年支出永久-30% · 幸福+5',
    cost: 0,
    prerequisites: (state: GameState) => !state.usedMinimalism,
    effect: (state: GameState) => {
      state.usedMinimalism = true;
      state.annualBaseCost = state.annualBaseCost * 0.6;
      const log = `第${state.currentAge}岁，你清空了半个家，丢掉了所有'总有一天会用上'的废物。房间空了，存折的数字却好像更结实了。`;
      return { log, cost: 0 };
    },
    logTemplate: '第{年龄}岁，你清空半个家，生活从此轻装上阵。',
    category: '生活消费',
    repeatable: false,
  },
  // 卡3：布局自动化变现副业脚本（一次性，不可重复）
  {
    id: 'side_hustle',
    title: '布局自动化变现副业脚本',
    description: '你开始在下班后接私活。白天打卡摸鱼，晚上熬夜敲代码，周末也在干。第一个月赚了三千块，你觉得值——直到有一天你在工位上睡着了，口水流在了键盘上。',
    storyDescription: '你在深夜敲下最后一行代码，服务器开始稳定运行，数据流如脉搏般跳动。',
    hint: '月入+¥3,000-8,000 · 压力+8',
    cost: 15000,
    prerequisites: (state: GameState) => !state.hasSideHustle && !state.isUnemployed,
    effect: (state: GameState) => {
      const isFreelance = state.currentProfession === '自由职业';
      const cost = isFreelance ? 10500 : 15000; // 自由职业减少30%
      state.hasSideHustle = true;
      state.passiveIncome += isFreelance ? 36000 : 24000; // 自由职业+50%
      const log = `第${state.currentAge}岁，你在凌晨三点完成了最后的部署测试，屏幕上的绿色数据流开始稳定涌动，那是一台属于你的印钞机。`;
      return { log, cost };
    },
    logTemplate: '第{年龄}岁，你搭建好副业脚本，被动收入开始到账。',
    category: '投资理财',
    repeatable: false,
  },
  // 卡4：结婚（与恋人结婚或闪婚）
  {
    id: 'marry',
    title: '💍 结婚',
    description: '你们去民政局那天她穿了件白裙子。排队时你们一直在笑，工作人员喊名字时你突然有点紧张。盖章那刻你偷偷看了她一眼，心想这辈子就是她了。',
    storyDescription: '那天，你牵起TA的手，许下承诺。',
    hint: '花费¥80,000-120,000 · 年支出+¥25,000',
    cost: 100000,
    prerequisites: (state: GameState) => {
      if (state.isMarried) return false;
      // 有恋人（serious/dating阶段）可以结婚，单身也可以闪婚
      if (state.partner && !state.partner.hasDivorced && 
          ['crush','dating','serious'].includes(state.partner.datingStage)) return true;
      if (!state.partner || state.partner.datingStage === 'divorced' || state.partner.datingStage === 'single') return state.currentAge >= 25;
      return false;
    },
    effect: (state: GameState) => {
      state.annualBaseCost += 25000;
      const weddingCost = 80000 + Math.floor(Math.random() * 40000);
      let name = 'TA';
      if (state.partner && !state.partner.hasDivorced && state.partner.datingStage !== 'divorced') {
        name = state.partner.name;
        state.partner.datingStage = 'married';
        state.partner.marriedYear = state.currentAge;
        state.partner.affection = Math.min(100, state.partner.affection + 20);
        state.partner.trust = Math.min(100, state.partner.trust + 15);
        state.partner.memories.push({ age: state.currentAge, event: '结婚了', emoji: '💍' });
      } else {
        // 闪婚：没有伴侣对象（或已离婚/单身）时，随机生成一个伴侣并直接进入已婚
        const personality = ['温柔型','事业型','浪漫型','节俭型','独立型'][Math.floor(Math.random()*5)] as PartnerPersonality;
        state.partner = {
          name: getRandomName(),
          age: state.currentAge + Math.floor(Math.random() * 3) - 1,
          affection: 60,
          trust: 50,
          datingStage: 'married',
          meetYear: state.currentAge,
          marriedYear: state.currentAge,
          hasDivorced: false,
          personality,
          trait: '相亲认识的',
          memories: [{ age: state.currentAge, event: '闪婚', emoji: '💍' }],
          crushFrom: 'blind_date',
        };
        name = state.partner.name;
      }
      state.isMarried = true;
      const log = `第${state.currentAge}岁，你和${name}结婚了。婚礼上你看着TA的眼睛，忽然觉得这辈子值了。花掉了${weddingCost}元，但你觉得这是最值的一笔开销。`;
      return { log, cost: weddingCost };
    },
    logTemplate: '第{年龄}岁，你们领了证，从此两个人的日子。',
    category: '💝 感情',
    repeatable: false,
  },
  // 卡5：养育第一胎可爱的像素宝宝（一次性）
  {
    id: 'have_child',
    title: '养育第一胎可爱的像素宝宝',
    description: '验孕棒上两条杠那天，你坐在厕所里愣了十分钟。你觉得自己还没长大，就要当爸妈了。孩子出生那晚你抱着那个软软的小人，手都在抖——原来这就是生命的重量。',
    storyDescription: '一声啼哭，你的世界从此多了一个小小人儿。',
    hint: '花费¥50,000 · 年支出永久+¥35,000',
    cost: 50000,
    prerequisites: (state: GameState) => state.isMarried && !state.hasChild,
    effect: (state: GameState) => {
      state.hasChild = true;
      state.annualBaseCost += 35000;
      const log = `第${state.currentAge}岁，一声啼哭划破夜晚，你小心翼翼地把那个不足一克的小小像素人捧在手心。从此，你的世界多了一个软肋。`;
      return { log, cost: 50000 };
    },
    logTemplate: '第{年龄}岁，你的孩子降生，从此世界多了一个软肋。',
    category: '社交关系',
    repeatable: false,
  },
  // 卡6：杠杆贷款购买房产（一次性，按城市生成多个级别）
  // 在getDecisionCards中动态生成，此处不再定义静态卡片
  // 生成逻辑见下方 getHouseCards 函数
  // 卡7：购入高配独立开发集群服务器（一次性）
  {
    id: 'upgrade_server',
    title: '购入高配独立开发集群服务器',
    description: '你给副业升级了服务器，机箱灯亮起风扇狂转。对象问"什么声音"，你说"赚钱的声音"。虽然这月副业收入还不够交服务器费，但看着跑满的进度条，你觉得离暴富就差一步。',
    storyDescription: '性能飙升，你的数字王国愈发稳固。',
    hint: '副业收入+¥5,000/月 · 花费¥15,000',
    cost: 20000,
    prerequisites: (state: GameState) => state.hasSideHustle,
    effect: (state: GameState) => {
      state.passiveIncome = Math.round(state.passiveIncome * 1.3);
      const log = `第${state.currentAge}岁，你为新集群接通电源，机箱灯亮起的瞬间，你的副业帝国像吞了兴奋剂一样开始狂飙。`;
      return { log, cost: 20000 };
    },
    logTemplate: '第{年龄}岁，你升级服务器，副业收入涨了三成。',
    category: '投资理财',
    repeatable: false,
  },
  // 卡8：参与硬核技术架构进阶训练营（可重复，最多3次，冷却4轮）
  {
    id: 'upskill',
    title: '参与硬核技术架构进阶训练营',
    description: '你报了个架构师进阶班，群里整天"赋能""抓手""闭环"。你怀疑报的是技术班还是黑话培训班。结业那天拿到证书，你想起高考没考好的自己——什么时候开始都不算晚。',
    storyDescription: '', // 由effect动态设置
    hint: '裁员率-30%或薪资+5-15% · 花费¥8,000',
    cost: 25000,
    prerequisites: () => true, // 冷却和使用次数由 drawRandomCards 控制
    effect: (state: GameState) => {
      // 随机选择效果
      const rollType = Math.random();
      let log = '';

      // 随机选取故事描述
      const story = UPSKILL_STORIES[Math.floor(Math.random() * UPSKILL_STORIES.length)];

      if (rollType < 0.6) {
        // 60%概率：加薪5-15%
        const raisePct = 5 + Math.floor(Math.random() * 11); // 5-15
        const raiseAmount = Math.round(state.currentMonthlySalary * raisePct / 100);
        state.currentMonthlySalary += raiseAmount;
        log = `第${state.currentAge}岁，${story}你的技术能力显著提升，获得${raisePct}%的加薪，月薪增加了${raiseAmount}元。`;
      } else {
        // 40%概率：裁员率再降10%（通过标记isUpskilled实现，effect由math-engine处理）
        // BUG8修复：如果已经标记过isUpskilled，改为给其他效果（压力-5，健康+3）
        if (!state.isUpskilled) {
          state.isUpskilled = true;
          log = `第${state.currentAge}岁，${story}你在职业安全方面更进一步，裁员概率进一步降低。职场护城河又深了一层。`;
        } else {
          state.stress = Math.max(0, state.stress - 5);
          state.health = Math.min(100, state.health + 3);
          log = `第${state.currentAge}岁，${story}虽然课程内容你已经很熟了，但温故知新让你心态更从容了。`;
        }
      }

      return { log, cost: 25000 };
    },
    logTemplate: '第{年龄}岁，你完成技能进修，简历上又多了一行。',
    category: '技能进修',
    repeatable: true,
    maxUses: 3,
    cooldown: 4,
  },
  // 卡9：执行跨城市地理套利（搬家）（一次性，不可重复）
  {
    id: 'geo_arbitrage',
    title: '执行跨城市地理套利（搬家）',
    description: '你收拾行李搬去新城市，地铁线路研究了三天，外卖口味要重新适应。第一晚躺在出租屋的硬板床上，孤独感是免费的。但房租便宜了一半，你觉得值。',
    storyDescription: '你打包行李，告别旧地，前往新的起点。',
    hint: '薪资x新城市系数 · 生活成本x新城市系数',
    cost: 20000,
    prerequisites: (state: GameState) => !state.isGeoArbitrage,
    effect: (state: GameState) => {
      state.isGeoArbitrage = true;
      // 搬家逻辑：在Store中处理城市选择
      const log = `第${state.currentAge}岁，你卖掉了大部分家当，买了一张单程票。当旧城市的轮廓在后视镜里消失时，你感到前所未有的轻盈。`;
      return { log, cost: 20000 };
    },
    logTemplate: '第{年龄}岁，你搬到新城市，一切从头开始。',
    category: '核心决策',
    repeatable: false,
  },
  // 卡10：配置商业型个人补充养老保险（一次性）
  {
    id: 'commercial_pension',
    title: '配置商业型个人补充养老保险',
    description: '你买了份商业养老金。签完合同你想象六十岁的自己收到养老金的样子——应该在跳广场舞吧。按你现在的存款，不买这个可能真跳不起。',
    storyDescription: '你为老去存下一份底气，未来可期。',
    hint: '55岁起年入+¥30,000 · 年费¥10,000',
    cost: 10000,
    prerequisites: (state: GameState) => !state.hasCommercialPension,
    effect: (state: GameState) => {
      state.hasCommercialPension = true;
      const log = `第${state.currentAge}岁，你开始为自己的老年投下第一枚筹码。虽然现在看不到收益，但你仿佛听见了未来那个白发苍苍的自己说了声'谢谢'。`;
      return { log, cost: 10000 };
    },
    logTemplate: '第{年龄}岁，你配置商业养老险，给未来的自己存底气。',
    category: '投资理财',
    repeatable: false,
  },
  // 卡11：斩断一切无意义的无效应酬（可重复，冷却3轮）
  {
    id: 'cut_social',
    title: '斩断一切无意义的无效应酬',
    description: '你退掉了所有不说话的群和只在抢红包时活跃的同学群。手机终于不震了。省下来的份子钱够吃一个月外卖，你觉得自己赚翻了。',
    storyDescription: '你删掉社交软件，时间与金钱都回归自己。',
    hint: '年支出-¥8,000 · 幸福-3',
    cost: 0,
    prerequisites: () => true,
    effect: (state: GameState) => {
      const log = `第${state.currentAge}岁，你退出了所有热闹却空洞的群聊，把时间和金钱都收回了口袋。世界安静了，存款却开始说话了。`;
      return { log, cost: -5000 }; // 负成本=退款/节省
    },
    logTemplate: '第{年龄}岁，你退群断舍离，钱包和手机都清净了。',
    category: '生活消费',
    repeatable: true,
    cooldown: 3,
  },
  // 卡12a：经济代步车（一次性）
  {
    id: 'buy_car_economy',
    title: '【经济代步车】落地',
    description: '花费60000元，省油省心，年开销约¥12000~15000',
    storyDescription: '你踩下油门，自由的风迎面而来。',
    hint: '花费¥60,000 · 油耗低 · 维修便宜 · 面子一般',
    cost: 60000,
    prerequisites: (state: GameState) => !state.hasCar,
    effect: (state: GameState) => {
      state.hasCar = true;
      state.carValue = 50000;
      state.carAge = 0;
      (state as any).carType = '经济车';
      const log = `第${state.currentAge}岁，你提回了一辆经济代步车，落地6万。排量不大但足够上下班代步。朋友坐了一次说"挺实用的"，你假装没听出弦外之音。但没关系，遮风挡雨才是车的本分。`;
      return { log, cost: 60000 };
    },
    logTemplate: '第{年龄}岁，你买了经济代步车，实用第一。',
    category: '生活消费',
    repeatable: false,
  },
  // 卡12b：中级轿车（一次性）
  {
    id: 'buy_car_mid',
    title: '【中级轿车】落地',
    description: '花费150000元，年开销约¥18000~22000',
    storyDescription: 'B级车的关门声，有一种厚实的安心感。',
    hint: '花费¥150,000 · 舒适度不错 · 偶尔有面子 · 年开销中等',
    cost: 150000,
    prerequisites: (state: GameState) => !state.hasCar && state.currentSavings >= 150000,
    effect: (state: GameState) => {
      state.hasCar = true;
      state.carValue = 125000;
      state.carAge = 0;
      (state as any).carType = '中级车';
      state.happiness = Math.min(100, state.happiness + 3);
      const log = `第${state.currentAge}岁，你咬咬牙提了一辆B级轿车，落地15万。关门声沉甸甸的，座椅包裹感很好。第一次开去公司，同事在停车场多看了两眼——你故作镇定地锁了车，心里美滋滋的。`;
      return { log, cost: 150000 };
    },
    logTemplate: '第{年龄}岁，你买了中级轿车，生活品质上了一档。',
    category: '生活消费',
    repeatable: false,
  },
  // 卡12c：豪华车/跑车（一次性）
  {
    id: 'buy_car_luxury',
    title: '【豪华车/跑车】落地',
    description: '花费350000~500000元，年开销约¥30000~50000，面子拉满但养车压力巨大',
    storyDescription: '引擎的轰鸣声，是你对平庸生活的一次宣战。',
    hint: '花费¥350,000~500,000 · 面子拉满 · 养车极贵 · 失业时压力翻倍',
    cost: 400000,
    prerequisites: (state: GameState) => !state.hasCar && state.currentSavings >= 350000,
    effect: (state: GameState) => {
      state.hasCar = true;
      const actualCost = 350000 + Math.floor(Math.random() * 150000);
      state.carValue = Math.round(actualCost * 0.85);
      state.carAge = 0;
      (state as any).carType = '豪车';
      state.happiness = Math.min(100, state.happiness + 10);
      // 豪车影响社交
      if (state.friends.length > 0) {
        state.friends.forEach(f => { f.relation = Math.min(100, f.relation + 5); });
      }
      const log = `第${state.currentAge}岁，你花了${actualCost.toLocaleString()}元提了那辆梦寐以求的车。启动引擎的瞬间，你觉得自己这些年吃的苦值了。朋友圈发出去，点赞比过年还多。但你心里清楚，每月的车贷和保险会是一笔不小的数字。`;
      return { log, cost: actualCost };
    },
    logTemplate: '第{年龄}岁，你买了豪车，人生的排面拉满了。',
    category: '生活消费',
    repeatable: false,
  },
  // 卡13：全面体检+牙科检查（可重复，冷却2轮）
  {
    id: 'health_check',
    title: '全面体检+牙科检查',
    description: '你终于去做了体检。等报告那几天你把遗嘱都想好了，结果出来只是脂肪肝。你松了口气，决定今晚吃顿好的——然后又 cancel 了，毕竟脂肪肝也是肝。',
    storyDescription: '',
    hint: '健康+6 · 免疫小病1年 · 花费¥8,000-12,000',
    cost: 8000,
    category: '健康养生',
    repeatable: true,
    cooldown: 2,
    prerequisites: () => true,
    effect: (state: GameState) => {
      state.didHealthCheck = true;
      state.health = Math.min(100, state.health + 6);

      // 随机选取故事描述
      const story = HEALTH_CHECK_STORIES[Math.floor(Math.random() * HEALTH_CHECK_STORIES.length)];

      // 价格随年龄变化
      const examCost = state.currentAge >= 45 ? 12000 : 8000;
      const log = `第${state.currentAge}岁，${story}花费${examCost}元。`;

      return { log, cost: examCost };
    },
    logTemplate: '第{年龄}岁，你做了全面体检，虚惊一场后决定好好活。',
  },
  // 卡14：重仓购入黑天鹅风险对冲期权（一次性）
  {
    id: 'hedge_option',
    title: '重仓购入黑天鹅风险对冲期权',
    description: '你买了份对冲期权，跟同事解释了半天什么是期权。同事说"哦就是赌博呗"，你竟然无法反驳。签字时你安慰自己——这叫风险管理，不叫赌。',
    storyDescription: '你像精明的对冲基金经理，给极端风险上了保险。',
    hint: '投机最大亏损限制在50% · 花费¥5,000',
    cost: 15000,
    prerequisites: (state: GameState) => state.speculationPct > 20 && !state.hasHedgeOption,
    effect: (state: GameState) => {
      state.hasHedgeOption = true;
      const log = `第${state.currentAge}岁，你像一个预知未来的巫师，买下了那份昂贵的黑天鹅期权。你祈祷它永远用不上，但你清楚，这世上从不缺黑天鹅。`;
      return { log, cost: 15000 };
    },
    logTemplate: '第{年龄}岁，你买了对冲期权，给极端风险上个锁。',
    category: '投资理财',
    repeatable: false,
  },
  // 卡15：向老板递交辞职信，拥抱自由（可重复——可以反复辞职再就业）
  {
    id: 'resign',
    title: '向老板递交辞职信，拥抱自由',
    description: '你把辞职信放在老板桌上，收拾工位时同事投来各种目光。背起双肩包走出写字楼那一刻，阳光刺眼得让你眯起眼。打工人不需要眼泪，只需要下一个offer。',
    storyDescription: '你将辞职信放在桌上，头也不回地走出写字楼，阳光正好。',
    hint: '立即失去工作 · 需要2-3轮找新工作',
    cost: 0,
    prerequisites: (state: GameState) => !state.isUnemployed,
    effect: (state: GameState) => {
      state.preUnemployedSalary = state.currentMonthlySalary;
      state.currentMonthlySalary = 0;
      state.isUnemployed = true;
      const log = `第${state.currentAge}岁，你把辞职信轻轻放在主管桌上，没有摔门，没有怒吼。你走出写字楼，阳光正好，你终于把时间买了回来。`;
      return { log, cost: 0 };
    },
    logTemplate: '第{年龄}岁，你递了辞职信，把时间买回了自己手里。',
    category: '核心决策',
    repeatable: true,
  },

  // ========== A. 生活消费类（8张） ==========
  // 卡16：报健身年卡
  {
    id: 'gym',
    title: '报健身年卡',
    description: '你办了张健身卡，第一次去发现全是肌肉猛男。你在跑步机上默默走了二十分钟，出来吹风的时候觉得今天还不错。虽然第三天就再没去过。',
    storyDescription: '你办了一张健身卡，第一天在跑步机上只跑了10分钟，但你觉得自己已经赢了过去的自己。',
    hint: '健康+8 · 压力-8 · 花费¥3,000',
    cost: 3000,
    category: '健康养生',
    repeatable: true,
    cooldown: 3,
    prerequisites: () => true,
    effect: (s: GameState) => {
      s.health = Math.min(100, s.health + 8);
      s.stress = Math.max(0, s.stress - 8);
      s.happiness = Math.min(100, s.happiness + 3);
      const logs = [
        `第${s.currentAge}岁，你在健身房挥汗如雨，虽然第一天只能跑十分钟，但三个月后你已经能跑五公里了。`,
        `第${s.currentAge}岁，你办了健身卡。跑步机上耳机里放着歌，你忽然觉得加班的疲惫被汗水冲走了。`,
      ];
      return { log: logs[Math.floor(Math.random() * logs.length)], cost: 3000 };
    },
    logTemplate: '第{年龄}岁，你办了健身卡，至少去过了。',
  },
  // 卡17：来一场说走就走的旅行
  {
    id: 'travel',
    title: '来一场说走就走的旅行',
    description: '你买了张去大理的机票。飞机落地那刻你关掉了工作群，觉得自己活过来了。坐在洱海边发了一下午呆，回来发现邮箱多了三十封未读——但你不急了。',
    hint: '幸福+12 · 压力-10 · 花费¥5,000-15,000',
    cost: 8000,
    category: '生活消费',
    repeatable: true,
    cooldown: 2,
    prerequisites: () => true,
    effect: (s: GameState) => {
      const cost = 5000 + Math.floor(Math.random() * 10000);
      s.happiness = Math.min(100, s.happiness + 12);
      s.stress = Math.max(0, s.stress - 10);
      const destinations = ['云南大理', '青海湖', '厦门', '成都', '西安', '重庆', '丽江', '海南'];
      const dest = destinations[Math.floor(Math.random() * destinations.length)];
      const logs = [
        `第${s.currentAge}岁，你一个人去了${dest}。坐在洱海边发了一个下午的呆，回来后发现邮箱里多了三十封未读邮件。但你不急了。`,
        `第${s.currentAge}岁，你和自己在${dest}的街头走了一天，吃了一碗当地的粉，拍了几张糊了的照片。平凡，但这是属于你的一天。`,
      ];
      return { log: logs[Math.floor(Math.random() * logs.length)], cost };
    },
    logTemplate: '第{年龄}岁，你出了趟远门，把工作群关了几天。',
  },
  // 卡18：换一部新手机/电脑
  {
    id: 'new_phone',
    title: '换一部新手机/电脑',
    description: '你拆开新手机包装，多巴胺飙升了一瞬。第二天快乐消退八成，第三天发现和旧手机没区别。但拍照时美颜好了几个档，你觉得这钱花得——勉强值。',
    hint: '幸福+5 · 花费¥5,000-8,000',
    cost: 6500,
    category: '生活消费',
    repeatable: true,
    cooldown: 4,
    prerequisites: () => true,
    effect: (s: GameState) => {
      const cost = 5000 + Math.floor(Math.random() * 3000);
      s.happiness = Math.min(100, s.happiness + 5);
      const items = ['最新款手机', '一台轻薄笔记本', '一块智能手表', '降噪耳机'];
      const item = items[Math.floor(Math.random() * items.length)];
      return { log: `第${s.currentAge}岁，你买了${item}，拆包装的那一刻有多巴胺分泌的快乐。第二天这种快乐就消退了80%，但剩下的20%也够了。`, cost };
    },
    logTemplate: '第{年龄}岁，你换了新装备，快乐维持了大约两天。',
  },
  // 卡19：带父母去吃顿好的
  {
    id: 'treat_parents',
    title: '带父母去吃顿好的',
    description: '你带爸妈去吃了顿好的。你妈嘴上说太贵了，筷子没停过。你爸临走偷偷打包了剩菜——跟你小时候一模一样。你看着他们花白的头发，鼻子有点酸。',
    hint: '父母关系+12 · 幸福+5 · 花费¥1,000-3,000',
    cost: 2000,
    category: '社交关系',
    repeatable: true,
    cooldown: 2,
    prerequisites: (s: GameState) => s.parents.isAlive,
    effect: (s: GameState) => {
      const cost = 1000 + Math.floor(Math.random() * 2000);
      s.parents.relationShip = Math.min(100, s.parents.relationShip + 12);
      s.happiness = Math.min(100, s.happiness + 5);
      const restaurants = ['一家不错的湘菜馆', '商场里的海鲜自助', '爸妈一直想去的那家店', '街角新开的老字号'];
      const rest = restaurants[Math.floor(Math.random() * restaurants.length)];
      return { log: `第${s.currentAge}岁，你带爸妈去了${rest}。你妈嘴上说"太贵了太贵了"，但筷子没停过。你爸默默喝了两杯酒，说了句"出来吃挺好的"。`, cost };
    },
    logTemplate: '第{年龄}岁，你请爸妈吃了顿好的，他们嘴上嫌贵筷子没停。',
  },
  // 卡20：约朋友聚餐/喝酒
  {
    id: 'dinner_friends',
    title: '约朋友聚餐/喝酒',
    description: '你和老友吃了顿火锅，聊到凌晨两点。话题从"最近怎么样"变成了"你还记得当年吗"。回家路上微醺，你打了条"青春不散场"——然后秒删了。三十岁的人了，矫情。',
    hint: '朋友关系+8 · 幸福+5 · 花费¥500-2,000',
    cost: 1000,
    category: '社交关系',
    repeatable: true,
    cooldown: 2,
    prerequisites: (s: GameState) => s.friends.length > 0,
    effect: (s: GameState) => {
      const cost = 500 + Math.floor(Math.random() * 1500);
      const friendName = s.friends[Math.floor(Math.random() * s.friends.length)].name;
      s.happiness = Math.min(100, s.happiness + 5);
      s.stress = Math.max(0, s.stress - 5);
      for (const f of s.friends) { f.relation = Math.min(100, f.relation + 3); f.lastContactAge = s.currentAge; }
      const activities = ['吃了一顿火锅', '在路边的烧烤摊喝到凌晨', '去了KTV唱了三个小时', '找了个安静的小酒馆聊了一整晚'];
      const act = activities[Math.floor(Math.random() * activities.length)];
      return { log: `第${s.currentAge}岁，你和${friendName}${act}。回家的时候你微醺，路上哼着歌，觉得日子也没那么难。`, cost };
    },
    logTemplate: '第{年龄}岁，你和老友喝到凌晨，矫情了一把。',
  },
  // 卡21：报一个兴趣班
  {
    id: 'hobby_class',
    title: '报一个兴趣班',
    description: '你报了个兴趣班，第一节课发现全班最年轻的是你，老师看你的眼神像在看自己父辈。但每个周末都有了件值得期待的事，这比躺平刷手机强多了。',
    hint: '幸福+10 · 压力-8 · 花费¥3,000-8,000',
    cost: 5000,
    category: '生活消费',
    repeatable: true,
    cooldown: 5,
    prerequisites: () => true,
    effect: (s: GameState) => {
      const cost = 3000 + Math.floor(Math.random() * 5000);
      s.happiness = Math.min(100, s.happiness + 10);
      s.stress = Math.max(0, s.stress - 8);
      const hobbies = ['摄影', '吉他', '烘焙', '画画', '书法', '游泳', '瑜伽'];
      const hobby = hobbies[Math.floor(Math.random() * hobbies.length)];
      if (Math.random() < 0.15 && !s.hasSideHustle) {
        s.passiveIncome += 5000;
        return { log: `第${s.currentAge}岁，你报了一个${hobby}班。没想到学了几个月后，你竟然开始靠${hobby}接活了，每月多了几千块的副业收入！`, cost };
      }
      return { log: `第${s.currentAge}岁，你报了一个${hobby}班。虽然学得一般，但每个周末都有了一件值得期待的事。`, cost };
    },
    logTemplate: '第{年龄}岁，你报了兴趣班，周末终于有了盼头。',
  },
  // 卡22：周末去做义工/社区服务
  {
    id: 'volunteer',
    title: '周末去做义工/社区服务',
    description: '你周末去流浪动物救助站做了一天义工。回来的路上发了条朋友圈，收获三十二个赞。有只橘猫在你腿上趴了一下午，你觉得这比花钱买的快乐实在多了。',
    hint: '幸福+8 · 压力-5 · 免费',
    cost: 0,
    category: '生活消费',
    repeatable: true,
    cooldown: 2,
    prerequisites: () => true,
    effect: (s: GameState) => {
      s.happiness = Math.min(100, s.happiness + 8);
      s.stress = Math.max(0, s.stress - 5);
      const places = ['流浪动物救助站', '社区图书馆', '养老院', '留守儿童中心', '环保活动'];
      const place = places[Math.floor(Math.random() * places.length)];
      return { log: `第${s.currentAge}岁，你周末去了${place}做义工。回来的路上阳光正好，你忽然觉得帮助别人的快乐比花钱实在多了。`, cost: 0 };
    },
    logTemplate: '第{年龄}岁，你去做义工，发现被需要也是一种快乐。',
  },
  // 卡23：给伴侣一个惊喜
  {
    id: 'gift_partner',
    title: '💕 制造浪漫',
    description: '你偷偷准备了个惊喜。一束花加一顿烛光晚餐，花了两千块。TA看到时愣了一下然后笑了，那个笑容让你觉得这月信用卡白刷了也值。',
    hint: '感情+15 · 幸福+10 · 花费¥1,000-5,000',
    cost: 2000,
    category: '💝 感情',
    repeatable: true,
    cooldown: 2,
    prerequisites: (s: GameState) => !!(s.partner && !s.partner.hasDivorced && 
      ['dating','serious','married'].includes(s.partner.datingStage)),
    effect: (s: GameState) => {
      const cost = 1000 + Math.floor(Math.random() * 4000);
      if (s.partner) {
        s.partner.affection = Math.min(100, s.partner.affection + 15);
        s.partner.trust = Math.min(100, s.partner.trust + 5);
      }
      s.happiness = Math.min(100, s.happiness + 10);
      s.stress = Math.max(0, s.stress - 5);
      const gifts = ['一束花', '一条项链', '一顿烛光晚餐', '一次SPA体验', '一本TA念叨很久的书', '一个不期而遇的拥抱'];
      const gift = gifts[Math.floor(Math.random() * gifts.length)];
      return { log: `第${s.currentAge}岁，你准备了${gift}。${s.partner?.name || 'TA'}看到的时候愣了一下，然后笑了。那个笑容让你觉得${cost}块花得太值了。`, cost };
    },
    logTemplate: '第{年龄}岁，你给TA准备了惊喜，TA笑了就够了。',
  },
  // 卡23b：主动表白/推进关系
  {
    id: 'confess_love',
    title: '💌 勇敢表白',
    description: '你决定不再犹豫了。喜欢一个人藏在心里是会发霉的。你深吸一口气点开对话框，打了又删删了又打。最后发了一句"有件事想跟你说"——心跳快得像要猝死。',
    hint: '推进关系 · 可能成功也可能被拒 · 免费',
    cost: 0,
    category: '💝 感情',
    repeatable: false,
    cooldown: 3,
    prerequisites: (s: GameState) => {
      if (!s.partner || s.partner.hasDivorced) return false;
      return s.partner.datingStage === 'crush' || s.partner.datingStage === 'dating';
    },
    effect: (s: GameState) => {
      if (!s.partner) return { log: '', cost: 0 };
      const p = s.partner;
      // 成功率取决于感情值
      const successRate = p.affection / 100;
      if (Math.random() < successRate + 0.2) {
        // 成功
        if (p.datingStage === 'crush') {
          p.datingStage = 'dating';
          p.affection = Math.min(100, p.affection + 15);
          p.trust = Math.min(100, p.trust + 10);
          p.memories.push({ age: s.currentAge, event: '表白成功', emoji: '💕' });
          s.happiness = Math.min(100, s.happiness + 15);
          s.stress = Math.max(0, s.stress - 10);
          return { log: `第${s.currentAge}岁，你鼓起勇气向${p.name}表白了。沉默了三秒，TA说"我也是"。你感觉整个世界都亮了。`, cost: 0 };
        } else {
          // dating → serious
          p.datingStage = 'serious';
          p.affection = Math.min(100, p.affection + 12);
          p.trust = Math.min(100, p.trust + 12);
          p.memories.push({ age: s.currentAge, event: '确定关系', emoji: '💑' });
          s.happiness = Math.min(100, s.happiness + 12);
          return { log: `第${s.currentAge}岁，你认真地对${p.name}说"我想和你在一起"。TA红着眼说"我等这句话等了好久了"。`, cost: 0 };
        }
      } else {
        // 被拒绝
        p.affection = Math.max(0, p.affection - 15);
        s.happiness = Math.max(0, s.happiness - 15);
        s.stress = Math.min(100, s.stress + 12);
        // 如果感情值太低，可能彻底断了
        if (p.affection < 15) {
          p.datingStage = 'single';
          p.exName = p.name;
          s.partner = null;
          return { log: `第${s.currentAge}岁，你鼓起勇气表白了，但${p.name}说"对不起，我只把你当朋友"。你笑着说没关系，回家哭了一整晚。`, cost: 0 };
        }
        return { log: `第${s.currentAge}岁，你鼓起勇气表白了。${p.name}说"让我再想想"。你不知道这是委婉拒绝还是需要时间，忐忑得睡不着觉。压力+20。`, cost: 0 };
      }
    },
    logTemplate: '第{年龄}岁，你鼓起勇气表白了，心跳快得像跑完八百米。',
  },
  // 卡23c：主动社交/拓展圈子（提高遇见概率）
  {
    id: 'socialize',
    title: '🎉 拓展社交圈',
    description: '你决定不再宅着了。去参加了朋友的剧本杀局，拼了一桌陌生人。全程你只说对了两句台词，但加到了三个人的微信。至少比在家刷手机强。',
    hint: '提高遇见TA的概率 · 幸福+5 · 花费¥2,000',
    cost: 2000,
    category: '💝 感情',
    repeatable: true,
    cooldown: 2,
    prerequisites: (s: GameState) => {
      // 单身或刚离异可以社交
      if (!s.partner) return s.currentAge >= 22;
      return s.partner.datingStage === 'single' || s.partner.datingStage === 'divorced';
    },
    effect: (s: GameState) => {
      const cost = 1000 + Math.floor(Math.random() * 2000);
      s.happiness = Math.min(100, s.happiness + 5);
      s.stress = Math.max(0, s.stress - 3);
      // 标记今年社交积极，恋爱系统会在processRomanceYear中检查
      (s as any).socialActiveThisYear = true;
      const activities = ['朋友的生日派对', '行业交流会', '桌游局', '徒步俱乐部', '读书会', '音乐节'];
      const act = activities[Math.floor(Math.random() * activities.length)];
      return { log: `第${s.currentAge}岁，你去参加了${act}。认识了一些有趣的人，加了几个微信。虽然不知道能不能发展，但至少今天很开心。`, cost };
    },
    logTemplate: '第{年龄}岁，你出门社交了，加了几个新微信。',
  },

  // ========== B. 投资理财类（5张） ==========
  // 卡24：存定期存款
  {
    id: 'invest_fixed_deposit',
    title: '存定期存款',
    description: '你把存款转成三年定期，银行柜员说"利率3%，比余额宝高一倍"。你觉得没毛病。存完钱走出银行，觉得自己是理财大师——虽然跑不赢通胀。',
    hint: '年化固定3% · 转移20%到定期',
    cost: 0,
    category: '投资理财',
    repeatable: true,
    cooldown: 3,
    prerequisites: (s: GameState) => s.bankDepositPct >= 20,
    effect: (s: GameState) => {
      const pct = 20; // 转移20%到定期
      s.bankDepositPct = Math.max(0, s.bankDepositPct - pct);
      s.fixedDepositPct += pct;
      const log = `第${s.currentAge}岁，你把存款的${pct}%转成了三年期定期存款。银行柜员说"利率3%，比余额宝高一倍"。你觉得这话说得没毛病。`;
      return { log, cost: 0 };
    },
    logTemplate: '第{年龄}岁，你存了定期，虽然跑不赢通胀但胜在心安。',
  },
  // 卡25：定投指数基金
  {
    id: 'invest_fund',
    title: '定投指数基金',
    description: '同事都在聊基金，你也开了户。第一天涨了两百你开心一整天，第三天跌了五百你差点割肉。一年下来发现平均收益不如银行理财，但你决定坚持——长期持有是信仰。',
    hint: '年化-10%到+20% · 转移15%到基金 · 每月定投¥1,000-3,000',
    cost: 0,
    category: '投资理财',
    repeatable: true,
    cooldown: 3,
    prerequisites: (s: GameState) => s.currentSavings > 10000 && s.currentAge < 55 && s.bankDepositPct >= 15,
    effect: (s: GameState) => {
      const pct = 15;
      s.bankDepositPct = Math.max(0, s.bankDepositPct - pct);
      s.indexFundPct += pct;
      const monthly = 1000 + Math.floor(Math.random() * 2000);
      return { log: `第${s.currentAge}岁，你把存款的${pct}%配置到了指数基金，每月定投${monthly}元。涨了觉得自己是巴菲特，跌了觉得自己是韭菜。`, cost: -(monthly * 12) };
    },
    logTemplate: '第{年龄}岁，你开始定投基金，在巴菲特和韭菜之间反复横跳。',
  },
  // 卡26：接个私活/兼职赚外快
  {
    id: 'side_gig',
    title: '接个私活/兼职赚外快',
    description: '你接了个私活，熬到凌晨两点交了稿。客户说"挺好但能不能再改一版"。你深呼吸三次没摔手机，默默改了。赚的钱刚好够买两杯咖啡续命。',
    hint: '额外收入¥5,000-20,000 · 压力+10 · 健康-5',
    cost: 0,
    category: '投资理财',
    repeatable: true,
    cooldown: 2,
    prerequisites: (s: GameState) => !s.isUnemployed && s.currentAge < 50,
    effect: (s: GameState) => {
      const income = 5000 + Math.floor(Math.random() * 15000);
      s.stress = Math.min(100, s.stress + 6);
      s.health = Math.max(0, s.health - 5);
      const gigs = ['帮朋友做了个网站', '接了个翻译项目', '写了篇稿子', '周末帮人搬家', '帮邻居修了电脑'];
      const gig = gigs[Math.floor(Math.random() * gigs.length)];
      return { log: `第${s.currentAge}岁，你${gig}，赚了${income}元。虽然累，但看着余额增加的感觉真不错。`, cost: -income };
    },
    logTemplate: '第{年龄}岁，你接私活赚了外快，也熬出了黑眼圈。',
  },
  // 卡27：挑战一个月只花1000元
  {
    id: 'save_challenge',
    title: '挑战一个月只花1000元',
    description: '你挑战一个月只花一千块。方便面吃到第十五天时你打开外卖App看了八十七遍。月底省下来的钱发了个朋友圈，配图是空荡荡的冰箱——评论区一片心疼。',
    hint: '节省月生活费50% · 幸福-8 · 压力+5',
    cost: 0,
    category: '生活消费',
    repeatable: true,
    cooldown: 4,
    prerequisites: () => true,
    effect: (s: GameState) => {
      const saved = Math.round(s.annualBaseCost * 0.04); // 约一个月的50%
      s.happiness = Math.max(0, s.happiness - 8);
      s.stress = Math.min(100, s.stress + 5);
      // 不在effect内修改savings，通过return cost统一处理（负值=节省）
      return { log: `第${s.currentAge}岁，你挑战了一个月只花1000元。方便面吃到第15天的时候你差点崩溃，但月底看着省下来的${saved}元，你觉得一切都值了。`, cost: -saved };
    },
    logTemplate: '第{年龄}岁，你挑战极简消费，差点把胃吃坏。',
  },
  // 卡28：买比特币
  {
    id: 'crypto_bet',
    title: '买比特币',
    description: '你把存款换成了比特币，接下来两周每十分钟看一次价格，上厕所都带着手机。同事问你是不是恋爱了，你说"比恋爱刺激"。涨的时候觉得自己是中本聪，跌的时候想报警。',
    hint: '年化-80%~+200%（极端波动）· 转移5-10%到比特币',
    cost: 0,
    category: '投资理财',
    repeatable: true,
    cooldown: 5,
    ageRange: [22, 45],
    prerequisites: (s: GameState) => s.currentSavings > 20000 && s.bankDepositPct >= 5,
    effect: (s: GameState) => {
      const pct = 5 + Math.floor(Math.random() * 6); // 5-10%
      s.bankDepositPct = Math.max(0, s.bankDepositPct - pct);
      s.speculationPct += pct;
      const log = `第${s.currentAge}岁，你把${pct}%的存款换成了比特币。接下来两周你每隔十分钟看一次价格，连上厕所都带着。同事问你是不是恋爱了，你说"比恋爱刺激"。`;
      return { log, cost: 0 };
    },
    logTemplate: '第{年龄}岁，你入了币圈，从此上厕所都要带手机。',
  },

  // ========== E. 投资理财扩展类（6张） ==========
  // 卡43：开户炒股
  {
    id: 'open_stock',
    title: '开户炒股',
    description: '你下载了炒股App，第一天涨了3%觉得自己是巴菲特转世。第三天跌了8%，你删了App又装回来。股票群里人人喊加仓，你不知道该信谁——但大家都说"这次不一样"。',
    hint: '转移20%到股市 · 年化波动极大',
    cost: 0,
    category: '投资理财',
    repeatable: false,
    ageRange: [25, 50],
    prerequisites: (s: GameState) => !(s as any).hasStockAccount && s.currentSavings > 50000,
    effect: (s: GameState) => {
      (s as any).hasStockAccount = true;
      (s as any).bankDepositPct = Math.max(0, (s as any).bankDepositPct - 20);
      (s as any).stockPct = ((s as any).stockPct || 0) + 20;
      const log = `第${s.currentAge}岁，你下载了炒股App，转了20%的余额宝到股市。第一天涨了3%，你觉得自己是巴菲特转世。第三天跌了8%，你删了App又装了回来。盯盘的日子，压力山大。`;
      return { log, cost: 0 };
    },
    logTemplate: '第{年龄}岁，你开户炒股，在巴菲特和韭菜之间反复横跳。',
  },
  // 卡44：买黄金
  {
    id: 'buy_gold',
    title: '买黄金',
    description: '你在金店买了金条，店员问要不要刻字。你想刻"别跌"但没好意思说。拿回家锁进保险箱，你妈说"买黄金不如存银行"，你心想等涨了再跟她解释什么叫资产配置。',
    hint: '转移5%到黄金 · 抗通胀避险',
    cost: 30000,
    category: '投资理财',
    repeatable: true,
    cooldown: 5,
    prerequisites: (s: GameState) => s.currentSavings > 30000,
    effect: (s: GameState) => {
      const goldCost = 10000 + Math.floor(Math.random() * 40000);
      (s as any).hasGold = true;
      (s as any).bankDepositPct = Math.max(0, (s as any).bankDepositPct - 5);
      (s as any).goldPct = ((s as any).goldPct || 0) + 5;
      const logs = [
        `第${s.currentAge}岁，你在金店买了${goldCost}元的金条。店员问"要不要刻字"，你想刻"别跌"但没说出口。黄金不产生利息，但在经济不景气时是避风港。`,
        `第${s.currentAge}岁，你花${goldCost}元买了金条，拿回家锁进保险箱。你妈说"买黄金还不如存银行"，你心想"等我赚了再跟您解释什么叫资产配置"。`,
      ];
      return { log: logs[Math.floor(Math.random() * logs.length)], cost: goldCost };
    },
    logTemplate: '第{年龄}岁，你买了金条，锁进保险箱当传家宝。',
  },
  // 卡45：买商铺
  {
    id: 'buy_shop',
    title: '买商铺',
    description: '你在商业街看中一个铺面，中介拍胸脯说"这位置以后肯定旺"。你交了定金后每天路过看一眼。月租三千不多，但想着躺赚的被动收入，你觉得离财富自由又近了一步。',
    hint: '投入30-80万 · 月租3000-8000',
    cost: 300000,
    category: '投资理财',
    repeatable: false,
    ageRange: [35, 55],
    prerequisites: (s: GameState) => !(s as any).hasShop && s.currentSavings > 300000 && s.currentAge >= 35,
    effect: (s: GameState) => {
      const shopCost = 300000 + Math.floor(Math.random() * 500000);
      const monthlyRent = 3000 + Math.floor(Math.random() * 5000);
      (s as any).hasShop = true;
      (s as any).shopValue = shopCost;
      (s as any).shopMonthlyRent = monthlyRent;
      s.passiveIncome += monthlyRent * 12;
      const log = `第${s.currentAge}岁，你在商业街买了一个${(shopCost / 10000).toFixed(0)}万的商铺。中介说"这位置以后肯定旺"。你交了定金后每天路过看一眼，月租${monthlyRent}元不多，但至少是被动收入。`;
      return { log, cost: shopCost };
    },
    logTemplate: '第{年龄}岁，你买了商铺，开始幻想躺赚的日子。',
  },
  // 卡46：追加基金投资
  {
    id: 'add_fund',
    title: '追加基金投资',
    description: '你打开基金App看到"逢低加仓"四个字，热血上头点了加仓。然后基金又跌了。你安慰自己这是摊低成本，直到你发现成本摊到了地板以下。',
    hint: '基金占比+5% · 年化波动大',
    cost: 12000,
    category: '投资理财',
    repeatable: true,
    cooldown: 2,
    prerequisites: (s: GameState) => s.indexFundPct > 0 && s.currentSavings > 20000,
    effect: (s: GameState) => {
      s.indexFundPct += 5;
      (s as any).bankDepositPct = Math.max(0, (s as any).bankDepositPct - 5);
      const extraInvest = 12000 + Math.floor(Math.random() * 6000);
      s.passiveIncome += 12000; // 每月多投1000，年化12000
      const logs = [
        `第${s.currentAge}岁，你打开基金App看到"逢低加仓"四个字，果断点了加仓按钮。追加了${extraInvest}元。然后基金又跌了。你安慰自己"这是摊低成本"。`,
        `第${s.currentAge}岁，你在基金社区看到一句"别人恐惧我贪婪"，热血上头又加了${extraInvest}元的仓。第二天基金继续跌。你开始怀疑"别人恐惧"的时候，也许你也该恐惧。`,
      ];
      return { log: logs[Math.floor(Math.random() * logs.length)], cost: extraInvest };
    },
    logTemplate: '第{年龄}岁，你逢低加仓，然后发现底在楼下。',
  },
  // 卡47：炒股加仓
  {
    id: 'add_stock',
    title: '炒股加仓',
    description: '你看了三个财经博主的视频，结论是加仓。三分钟后看了第四个，结论变成减仓。你关了手机决定信自己——然后加仓了。第二天就跌了，你安慰自己技术分析需要时间验证。',
    hint: '股票占比+10% · 压力+3',
    cost: 0,
    category: '投资理财',
    repeatable: true,
    cooldown: 3,
    prerequisites: (s: GameState) => !!(s as any).hasStockAccount && (s as any).stockPct < 50 && s.currentSavings > 30000,
    effect: (s: GameState) => {
      (s as any).stockPct = ((s as any).stockPct || 0) + 10;
      (s as any).bankDepositPct = Math.max(0, (s as any).bankDepositPct - 10);
      s.stress = Math.min(100, s.stress + 3);
      const logs = [
        `第${s.currentAge}岁，你看了三个财经博主的视频，结论是加仓。看了第四个博主，结论变成了减仓。你关了手机，决定相信自己的判断——加仓10%。压力又+3。`,
        `第${s.currentAge}岁，你盯着K线图看了两小时，觉得自己看懂了趋势。果断加仓10%。第二天开盘就跌了。你安慰自己"技术分析需要长期验证"。`,
      ];
      return { log: logs[Math.floor(Math.random() * logs.length)], cost: 0 };
    },
    logTemplate: '第{年龄}岁，你看了四个博主后决定加仓，然后亏了。',
  },
  // 卡48：期货投机
  {
    id: 'futures_bet',
    title: '期货投机',
    description: '你开了期货账户，第一周赚了一个月工资，觉得财富自由不过如此。第二周利润全亏回去还倒贴本金。你盯着账户余额，终于理解了什么叫"期货一时爽，爆仓火葬场"。',
    hint: '风险极大 · 可能爆仓归零',
    cost: 5000,
    category: '投资理财',
    repeatable: false,
    ageRange: [28, 45],
    cooldown: 8,
    prerequisites: (s: GameState) => !!(s as any).hasStockAccount && !(s as any).hasFutures && s.currentSavings > 100000,
    effect: (s: GameState) => {
      (s as any).hasFutures = true;
      (s as any).bankDepositPct = Math.max(0, (s as any).bankDepositPct - 10);
      (s as any).stockPct = ((s as any).stockPct || 0) + 10;
      s.stress = Math.min(100, s.stress + 5);
      const log = `第${s.currentAge}岁，你开了期货账户交了5000开户费。第一周赚了一个月工资，你觉得这就是财富自由的感觉。第二周把利润全亏了回去还倒贴本金。期货这个东西，不适合心脏不好的人。压力+8。`;
      return { log, cost: 5000 };
    },
    logTemplate: '第{年龄}岁，你开了期货账户，体验了一把过山车。',
  },

  // ========== B.5 暴富机遇类（2张） ==========
  // 卡49：买彩票
  {
    id: 'buy_lottery',
    title: '🎰 买彩票',
    description: '路过彩票店，你心想"万一呢"。花了几十块买了几注，号码是你生日组合。你把彩票夹在钱包里，告诉自己是"给梦想一个机会"。',
    hint: '花费¥50 · 极低概率一夜暴富 · 1年后开奖',
    cost: 50,
    category: '投资理财',
    repeatable: true,
    cooldown: 1,
    prerequisites: (s: GameState) => s.currentSavings >= 50,
    effect: (s: GameState) => {
      return { log: `第${s.currentAge}岁，你在彩票站买了几注，号码是你和家人的生日组合。老板笑着说"祝你中奖"，你笑了笑没当真——但回家的路上，你已经在想"中了500万该怎么花了"。`, cost: 50 };
    },
    logTemplate: '第{年龄}岁，你买了一张彩票，开始幻想暴富。',
  },
  // 卡50：跟风梭哈（踩风口）
  {
    id: 'windfall_gamble',
    title: '🚀 梭哈风口项目',
    description: '朋友圈所有人都在说一个"千载难逢的机会"——AI、新能源、或者是某个你看不懂的区块链项目。有人翻倍了，有人被套了。你看着账户里的存款，心跳加速。',
    hint: '投入存款30% · 极低概率翻倍 · 极高概率亏损',
    cost: 0,
    category: '投资理财',
    repeatable: false,
    ageRange: [25, 45],
    cooldown: 5,
    prerequisites: (s: GameState) => s.currentSavings > 50000,
    effect: (s: GameState) => {
      const investAmount = Math.round(s.currentSavings * 0.3);
      const roll = Math.random();
      if (roll < 0.05) {
        // 5% 概率踩中真风口，净赚3倍
        const gain = investAmount * 3;
        s.currentSavings += gain;
        s.happiness = Math.min(100, s.happiness + 15);
        return { log: `第${s.currentAge}岁，你All-in了一个谁都看不懂的项目，投入了${investAmount.toLocaleString()}元。三个月后，项目突然上了新闻——估值翻了10倍。你套现离场，净赚${gain.toLocaleString()}元。你看着账户数字，觉得自己就是天选之人。`, cost: 0 };
      } else if (roll < 0.15) {
        // 10% 概率小赚
        const gain = Math.round(investAmount * 0.3);
        s.currentSavings += gain;
        s.happiness = Math.min(100, s.happiness + 8);
        return { log: `第${s.currentAge}岁，你跟了风口，投入了${investAmount.toLocaleString()}元。项目不温不火地推进着，半年后你退出，小赚了${gain.toLocaleString()}元。虽然没暴富，但至少没亏。你安慰自己：在风口上，能活着落地就是胜利。`, cost: 0 };
      } else if (roll < 0.50) {
        // 35% 概率回本
        return { log: `第${s.currentAge}岁，你投了${investAmount.toLocaleString()}元进风口项目。结果项目黄了，但幸好你撤得早，钱全拿回来了。你没亏，但浪费了一年时间和无数焦虑的深夜。`, cost: 0 };
      } else {
        // 50% 概率血亏
        s.currentSavings -= investAmount;
        s.stress = Math.min(100, s.stress + 15);
        s.happiness = Math.max(0, s.happiness - 10);
        return { log: `第${s.currentAge}岁，你All-in了${investAmount.toLocaleString()}元。三个月后项目被曝是骗局，创始人跑路了。你看着归零的账户，想起当初朋友圈那些"已上车"的截图——原来大家都是韭菜，只是收割的时间不同。`, cost: 0 };
      }
    },
    logTemplate: '第{年龄}岁，你跟了风口，命运齿轮开始转动。',
  },

  // ========== C. 健康养生类（4张） ==========
  // 卡29：开始健康饮食/自己做饭
  {
    id: 'health_food',
    title: '开始健康饮食/自己做饭',
    description: '你开始学做饭。第一顿糊了第三顿咸了第五顿终于像样了。外卖App从手机里消失，取而代之的是下厨房里收藏了两百个菜谱。你发了条朋友圈"自己做饭真香"，配图P了很久。',
    hint: '健康+5 · 幸福+3 · 年省¥3,000-6,000',
    cost: 0,
    category: '健康养生',
    repeatable: true,
    cooldown: 3,
    prerequisites: () => true,
    effect: (s: GameState) => {
      const saved = 3000 + Math.floor(Math.random() * 3000);
      s.health = Math.min(100, s.health + 5);
      s.happiness = Math.min(100, s.happiness + 3);
      return { log: `第${s.currentAge}岁，你开始学做饭了。第一顿炒糊了，第三顿终于像样了。外卖APP从你的手机里消失了，省了${saved}块。`, cost: -saved };
    },
    logTemplate: '第{年龄}岁，你开始自己做饭，外卖App终于失业了。',
  },
  // 卡31：看心理咨询师/做冥想
  {
    id: 'therapy',
    title: '看心理咨询师/做冥想',
    description: '你第一次走进心理咨询室，是因为凌晨三点还在刷手机。咨询师说"你不是手机依赖，是逃避"。你沉默了很久。出来时天空好像蓝了一点，你决定明天少加一点班。',
    hint: '压力-15 · 幸福+8 · 花费¥3,000-6,000',
    cost: 4000,
    category: '健康养生',
    repeatable: true,
    cooldown: 3,
    prerequisites: (s: GameState) => s.stress > 40,
    effect: (s: GameState) => {
      const cost = 3000 + Math.floor(Math.random() * 3000);
      s.stress = Math.max(0, s.stress - 15);
      s.happiness = Math.min(100, s.happiness + 8);
      return { log: `第${s.currentAge}岁，你第一次走进心理咨询室。说了很多平时不敢说的话。出来的时候天空好像蓝了一点。`, cost };
    },
    logTemplate: '第{年龄}岁，你去找了心理咨询师，天空蓝了一点。',
  },
  // ========== D. 阶段解锁类（10张） ==========
  // 卡33：在职读MBA/研究生
  {
    id: 'mba',
    title: '在职读MBA/研究生',
    description: '你开始在职读研。白天上班晚上写论文周末上课，头发掉了不少。你妈说花这钱不如存着，你爸说学历是最好的投资——两人为这事吵了一架。你夹在中间想：学历先拿到再说。',
    hint: '薪资+30% · 压力+20 · 健康-8 · 花费¥50,000',
    cost: 50000,
    category: '阶段解锁',
    repeatable: false,
    ageRange: [28, 40],
    prerequisites: (s: GameState) => !s.isUnemployed && !s.hasMBA,
    effect: (s: GameState) => {
      s.hasMBA = true;
      s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.3);
      s.stress = Math.min(100, s.stress + 10);
      s.health = Math.max(0, s.health - 8);
      return { log: `第${s.currentAge}岁，你开始了两年的在职研究生生涯。白天上班，晚上写论文，周末上课。你掉了不少头发，但简历上终于多了一行闪光的字。`, cost: 50000 };
    },
    logTemplate: '第{年龄}岁，你开始在职读研，头发和简历一起在变。',
  },
  // 卡34：投资二套房
  {
    id: 'buy_second_house',
    title: '投资二套房',
    description: '你咬咬牙买了第二套房，朋友说你是房奴中的战斗机。看着两条房贷月供短信同时弹出来，你觉得确实在战斗——而且是跟自己的钱包。但想着以后收租的日子，你又笑了。',
    hint: '首付¥30-80万 · 月租¥2,000-5,000',
    cost: 400000,
    category: '阶段解锁',
    repeatable: false,
    ageRange: [38, 55],
    prerequisites: (s: GameState) => s.hasProperty && s.currentSavings > 500000,
    effect: (s: GameState) => {
      const down = 300000 + Math.floor(Math.random() * 500000);
      if (Math.random() < 0.6) {
        s.passiveIncome += 36000;
        return { log: `第${s.currentAge}岁，你咬了咬牙买了第二套房。首付${down}元，每月租金3000元。你看着租房合同，觉得自己又多了一条退路。`, cost: down };
      } else {
        s.passiveIncome += 24000;
        const extraCost = 50000;
        return { log: `第${s.currentAge}岁，你买了第二套房，首付${down}元。但空置了好几个月没租出去，你还花了5万装修。投资回报没想象中那么美好。`, cost: down + extraCost };
      }
    },
    logTemplate: '第{年龄}岁，你买了二套房，两条房贷短信同时到达。',
  },
  // 卡35：开始养生/太极拳/钓鱼
  {
    id: 'elderly_care',
    title: '开始养生/太极拳/钓鱼',
    description: '你开始每天早上打太极。保温杯里泡枸杞是标配，太极是进阶。以前觉得这些是老年人的专利，现在你提前进入了准退休状态——但看着体检报告，你觉得养生不丢人。',
    hint: '健康+10 · 压力-10 · 幸福+5 · 花费¥3,000',
    cost: 3000,
    category: '阶段解锁',
    repeatable: true,
    cooldown: 3,
    ageRange: [45, 60],
    prerequisites: () => true,
    effect: (s: GameState) => {
      s.health = Math.min(100, s.health + 10);
      s.stress = Math.max(0, s.stress - 10);
      s.happiness = Math.min(100, s.happiness + 5);
      const activities = ['每天早上打太极拳', '周末去河边钓鱼', '加入社区的广场舞队', '开始在阳台上种花养草'];
      return { log: `第${s.currentAge}岁，你${activities[Math.floor(Math.random() * activities.length)]}。以前觉得这些都是老年人的活动，现在你发现——快乐不分年龄。`, cost: 3000 };
    },
    logTemplate: '第{年龄}岁，你开始养生，保温杯和太极一个都不能少。',
  },
  // 卡36：带父母出去旅游一趟
  {
    id: 'parent_travel',
    title: '带父母出去旅游一趟',
    description: '你带父母出去旅游。你爸拍照手抖，你妈每到景点就找垃圾桶——因为带了三个保温杯五袋零食"怕饿着"。你在身后看着他们花白的头发，又暖又酸。',
    hint: '父母关系+25 · 幸福+15 · 花费¥15,000-30,000',
    cost: 20000,
    category: '阶段解锁',
    repeatable: true,
    cooldown: 5,
    ageRange: [30, 58],
    prerequisites: (s: GameState) => s.parents.isAlive && s.parents.health > 30,
    effect: (s: GameState) => {
      const cost = 15000 + Math.floor(Math.random() * 15000);
      s.parents.relationShip = Math.min(100, s.parents.relationShip + 25);
      s.happiness = Math.min(100, s.happiness + 15);
      const dests = ['北京故宫', '三亚海边', '杭州西湖', '桂林山水', '泰山'];
      const dest = dests[Math.floor(Math.random() * dests.length)];
      return { log: `第${s.currentAge}岁，你带父母去了${dest}。你爸拍照的时候手抖，你妈笑得像个孩子。你在他们身后看着这两个渐渐老去的背影，心里又暖又酸。`, cost };
    },
    logTemplate: '第{年龄}岁，你带爸妈出了趟远门，他们笑得像孩子。',
  },
  // 卡37：提前规划退休生活
  {
    id: 'early_retirement_prep',
    title: '提前规划退休生活',
    description: '你花五千块请了退休规划师。看完那张表你沉默了——按规划来你应该十年前就开始存。你问现在还来得及吗，规划师微笑说"种树最好的时间是十年前，其次现在"。',
    hint: '优化财务结构 · 压力-10 · 花费¥5,000',
    cost: 5000,
    category: '阶段解锁',
    repeatable: false,
    ageRange: [48, 58],
    prerequisites: (s: GameState) => !s.hasRetirementPlan,
    effect: (s: GameState) => {
      s.hasRetirementPlan = true;
      s.stress = Math.max(0, s.stress - 10);
      return { log: `第${s.currentAge}岁，你花5000块请了一个退休规划师。看着那张详细的退休财务表，你第一次觉得"退休"不再是遥不可及的词。`, cost: 5000 };
    },
    logTemplate: '第{年龄}岁，你请人规划了退休，发现得从现在开始努力。',
  },
  // 卡38：成为年轻人的导师/带新人
  {
    id: 'mentor',
    title: '成为年轻人的导师/带新人',
    description: '你开始带新人，第一天问"这个怎么操作"你教了三遍他还没懂。你终于理解师父当年为什么总叹气。但看到他学会时的笑容，你觉得也没那么烦——好像看到了当年的自己。',
    hint: '幸福+8 · 压力-5 · 30%概率薪资+8%',
    cost: 0,
    category: '阶段解锁',
    repeatable: true,
    cooldown: 3,
    ageRange: [32, 55],
    prerequisites: (s: GameState) => !s.isUnemployed && s.currentAge >= 32,
    effect: (s: GameState) => {
      s.happiness = Math.min(100, s.happiness + 8);
      s.stress = Math.max(0, s.stress - 5);
      if (Math.random() < 0.3) {
        s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.08);
        return { log: `第${s.currentAge}岁，你开始带新人。看到他们犯错的样子就想起了当年的自己。没想到因为带教成绩突出，你还涨了8%的薪资。`, cost: 0 };
      }
      return { log: `第${s.currentAge}岁，你开始带新人。每天被问无数个问题，你发现自己其实也不全懂。但教别人的过程让你重新理解了很多东西。`, cost: 0 };
    },
    logTemplate: '第{年龄}岁，你开始带新人，在师父和徒弟之间反复横跳。',
  },
  // 卡39：升级副业：探索新方向
  {
    id: 'upgrade_side_hustle',
    title: '升级副业：探索新方向',
    description: '你花了一笔钱探索副业新方向。折腾三个月，经历了"能赚钱？→好像真能→果然不能→再试试→居然行了"的完整心路。你把这段经历发到知识星球，居然有人付费看。',
    hint: '副业收入+¥5,000-15,000/年 · 花费¥10,000-20,000',
    cost: 15000,
    category: '阶段解锁',
    repeatable: true,
    cooldown: 5,
    ageRange: [26, 50],
    prerequisites: (s: GameState) => s.hasSideHustle,
    effect: (s: GameState) => {
      const cost = 10000 + Math.floor(Math.random() * 10000);
      s.passiveIncome += 5000 + Math.floor(Math.random() * 10000);
      const directions = ['短视频', '知识付费', '电商代运营', 'AI工具套件', '独立游戏'];
      const dir = directions[Math.floor(Math.random() * directions.length)];
      return { log: `第${s.currentAge}岁，你花${cost}元探索了${dir}方向。经历了三个月的折腾，终于在副业收入上看到了新的增长曲线。`, cost };
    },
    logTemplate: '第{年龄}岁，你折腾了副业新方向，曲线终于弯了。',
  },
  // 卡40：给孩子报课外辅导班
  {
    id: 'child_tutoring',
    title: '给孩子报课外辅导班',
    description: '你给孩子报了辅导班，学费比你的大学还贵。孩子问"为什么小明不用上"，你说"因为小明爸爸不用还房贷"。接送等课交费的日常开始了，你觉得自己活成了当年最讨厌的样子。',
    hint: '子女学业+15 · 叛逆+8 · 花费¥15,000-30,000',
    cost: 20000,
    category: '阶段解锁',
    repeatable: true,
    cooldown: 3,
    ageRange: [30, 48],
    prerequisites: (s: GameState) => s.hasChild && s.children.some((c: { growthStage: string }) => ['小学', '初中', '高中'].includes(c.growthStage)),
    effect: (s: GameState) => {
      const cost = 15000 + Math.floor(Math.random() * 15000);
      for (const c of s.children) {
        if (['小学', '初中', '高中'].includes(c.growthStage)) {
          c.academicPerformance = Math.min(100, c.academicPerformance + 15);
          c.rebelliousness = Math.min(100, c.rebelliousness + 8);
          c.monthlyExpense += 1000;
        }
      }
      s.stress = Math.min(100, s.stress + 5);
      return { log: `第${s.currentAge}岁，你给孩子报了课外班。接送、等课、交费的日常开始了。孩子不太情愿，但你告诉自己"不能输在起跑线上"。`, cost };
    },
    logTemplate: '第{年龄}岁，你给孩子报了班，房贷和学费一起还。',
  },
  // 卡41：退休后做兼职/返聘
  {
    id: 'part_time',
    title: '退休后做兼职/返聘',
    description: '退休后闲不住你找了份返聘的活。年轻人叫你"老师"，你纠正说叫老张就行。但他们还是叫——你发现你挺喜欢这个称呼的，原来被需要的感觉这么好。',
    hint: '月入¥3,000-6,000 · 健康-3',
    cost: 0,
    category: '阶段解锁',
    repeatable: true,
    cooldown: 3,
    ageRange: [55, 60],
    prerequisites: (s: GameState) => s.currentProfession === '体制内',
    effect: (s: GameState) => {
      const income = 3000 + Math.floor(Math.random() * 3000);
      s.health = Math.max(0, s.health - 3);
      return { log: `第${s.currentAge}岁，退休后你闲不住，找了个返聘的活儿。虽然每月只有${income}元，但有事做的感觉比在家发呆强多了。`, cost: -(income * 12) };
    },
    logTemplate: '第{年龄}岁，你退休后返聘，原来闲着比上班还累。',
  },
  // 卡42：做自媒体/写回忆录
  {
    id: 'social_media',
    title: '做自媒体/写回忆录',
    description: '你开始在网上写人生经历。一条"35岁才明白的事"收获了你这辈子最多的互动。评论区有人说"写的就是我"，你盯着屏幕看了好久——原来这半辈子没白活。',
    hint: '幸福+5 · 20%概率月入+¥8,000',
    cost: 0,
    category: '阶段解锁',
    repeatable: true,
    cooldown: 4,
    ageRange: [45, 60],
    prerequisites: () => true,
    effect: (s: GameState) => {
      s.happiness = Math.min(100, s.happiness + 5);
      if (Math.random() < 0.2) {
        s.passiveIncome += 8000;
        return { log: `第${s.currentAge}岁，你开始在网上分享人生经历。没想到一条"35岁被裁后的自救指南"火了，每月多了几千块广告收入。`, cost: 0 };
      }
      return { log: `第${s.currentAge}岁，你开始在网上写东西。虽然看的人不多，但记录本身就有意义。也许有一天你的子女会读到这些文字。`, cost: 0 };
    },
    logTemplate: '第{年龄}岁，你开始写回忆录，发现有人跟你一样。',
  },
];

// ========== 卡片使用历史追踪 ==========
// 使用 state.usedCardHistory（会被序列化到 localStorage）替代临时属性
// 旧存档兼容：usedCardHistory 值可能是 number（最后使用年龄）
// 新格式：{ lastUsedAge: number; useCount: number }
interface CardUsageRecord {
  lastUsedAge: number;
  useCount: number;
}

function getCardUsageHistory(state: GameState): Map<string, CardUsageRecord> {
  const result = new Map<string, CardUsageRecord>();
  for (const [cardId, value] of Object.entries(state.usedCardHistory)) {
    if (typeof value === 'number') {
      // 旧存档格式：纯 number 表示最后使用年龄
      result.set(cardId, { lastUsedAge: value, useCount: 1 });
    } else if (value && typeof value === 'object') {
      // 新格式
      result.set(cardId, value as CardUsageRecord);
    }
  }
  return result;
}

function recordCardUsage(state: GameState, cardId: string): void {
  const history = getCardUsageHistory(state);
  const existing = history.get(cardId);
  const record: CardUsageRecord = {
    lastUsedAge: state.currentAge,
    useCount: (existing?.useCount || 0) + 1,
  };
  // 写回 state.usedCardHistory（可序列化）
  (state.usedCardHistory as Record<string, any>)[cardId] = record;
}

// ========== 随机抽取卡片（按类别分组，确保多样性）==========
export function drawRandomCards(state: GameState, count: number = 3): DecisionCard[] {
  if (state.isUnemployed) {
    // 失业状态：根据条件提供不同质量的求职卡
    const jobCardsList: DecisionCard[] = [];
    
    // 基础求职卡（降薪再就业）
    const profession = state.preUnemployedSalary > 0 ?
      (state.currentProfession === '红利行业' || state.currentProfession === '传统私企' ? state.currentProfession : 'default')
      : 'default';
    const baseJobCards = JOB_CARDS[profession] || JOB_CARDS['default'];
    
    // 猎头推荐卡：有MBA或技能进修或失业超过1年时有概率出现
    const hasHeadhunterChance = state.hasMBA || state.isUpskilled || state.unemployedTurns >= 1;
    const headhunterRoll = Math.random();
    const showHeadhunter = hasHeadhunterChance && headhunterRoll < 0.5;
    
    // 考公卡：失业超过1年且年龄<=38时出现（机会窗口）
    const showCivilService = state.unemployedTurns >= 1 && state.currentAge <= 38;

    // 人脉社交卡：有朋友时出现，靠人脉找工作
    const hasFriends = state.friends.length > 0;
    const showNetworking = hasFriends && Math.random() < 0.5;

    // 猎头推荐卡（有概率失败，不是100%上岗）
    const headhunterCard: DecisionCard = {
      id: 'job_headhunter',
      title: '【猎头推荐·重返赛道】',
      description: '一个许久没联系的猎头突然来电："X总，有个机会您看看？"薪资比巅峰时低些，但平台不错。你握着电话手微微发抖——原来市场还没有完全忘记你。',
      cost: 0,
      prerequisites: () => true,
      effect: (s: GameState) => {
        // 基础成功率：不是面试了就一定能过
        let successRate = 0.55;
        let ratio = s.hasMBA ? 0.85 : (s.isUpskilled ? 0.78 : 0.70);
        if (s.unemployedTurns >= 3) successRate -= 0.15; // 空窗太久成功率低
        if (s.stress < 40 && s.happiness > 60) successRate += 0.10; // 状态好发挥好
        if (s.economicCycle === 0) successRate += 0.10; // 繁荣期好找工作
        if (s.economicCycle === 2) successRate -= 0.10; // 萧条期难
        successRate = Math.max(0.25, Math.min(0.80, successRate));

        if (Math.random() < successRate) {
          s.isUnemployed = false;
          s.currentProfession = s.preUnemployedSalary > 20000 ? '红利行业' : '传统私企';
          s.currentMonthlySalary = Math.round(s.preUnemployedSalary * ratio);
          s.unemployedTurns = 0;
          s.stress = Math.max(0, s.stress - 10);
          s.happiness = Math.min(100, s.happiness + 10);
          return { log: `第${s.currentAge}岁，猎头推荐的岗位三轮面试后你拿到了offer，月薪${s.currentMonthlySalary}元（之前的${Math.round(ratio*100)}%）。入职第一天你穿了最精神的衬衫，走进写字楼的时候深吸了一口气——终于回来了。`, cost: 0 };
        } else {
          s.stress = Math.min(100, s.stress + 5);
          return { log: `第${s.currentAge}岁，猎头推荐的岗位你面到终面还是挂了。HR说"您很优秀，但和岗位匹配度不太够"。你礼貌地道谢，挂了电话继续投简历。`, cost: 0 };
        }
      },
      logTemplate: '第{年龄}岁，猎头一个电话，你又杀回了职场。',
    };
    
    // 考公卡（现实考公录取率极低）
    const civilServiceCard: DecisionCard = {
      id: 'job_civil_service',
      title: '【破釜沉舟·备战考公】',
      description: '你买了摞公考教材报了培训班。家人说"这把年纪还折腾啥"，但你知道这可能是拿铁饭碗的机会。每天学到凌晨两点头发一把一把掉——但千军万马过独木桥，不一定能上岸。',
      cost: 8000,
      prerequisites: () => true,
      effect: (s: GameState) => {
        // 考公成功率：基础20%，状态好/年轻略高，35岁后断崖式下跌
        let successRate = 0.20;
        if (s.currentAge < 28) successRate += 0.10;
        if (s.stress < 40) successRate += 0.05;
        if (s.isUpskilled) successRate += 0.05; // 学习能力强
        if (s.currentAge >= 33) successRate -= 0.10;
        successRate = Math.max(0.08, Math.min(0.35, successRate));

        if (Math.random() < successRate) {
          s.isUnemployed = false;
          s.currentProfession = '体制内';
          s.currentMonthlySalary = 7000;
          s.unemployedTurns = 0;
          s.stress = Math.max(0, s.stress - 15);
          s.happiness = Math.min(100, s.happiness + 15);
          if (s.parents.isAlive) s.parents.relationShip = Math.min(100, s.parents.relationShip + 20);
          return { log: `第${s.currentAge}岁，你居然真的考上了！公示名单出来那天你盯着屏幕看了三遍才敢相信。月薪7000元，虽然不高，但从此朝九晚五不用担惊受怕。你妈在电话里哭了。`, cost: 8000 };
        } else {
          s.stress = Math.min(100, s.stress + 8);
          s.happiness = Math.max(0, s.happiness - 5);
          return { log: `第${s.currentAge}岁，你备考了一年，笔试差0.5分进面。培训班的钱和一年的时间都打了水漂。你把教材塞进柜子最底层，坐在出租屋里发呆——明年还要再试一次吗？`, cost: 8000 };
        }
      },
      logTemplate: '第{年龄}岁，你踏上了考公之路，头可断铁饭碗不能丢。',
    };

    // 人脉社交卡（通过朋友/前同事找工作）
    const networkingCard: DecisionCard = {
      id: 'job_networking',
      title: '【盘活人脉·托朋友内推】',
      description: '你翻了翻微信通讯录，给几个久未联系的老同事发了消息。有人没回，有人说"帮你问问"，有人直接给你推了个HR微信。人脉这东西，平时不显山露水，失业时才知道谁真的靠谱。',
      cost: 3000, // 请客吃饭/送礼
      prerequisites: () => true,
      effect: (s: GameState) => {
        const friendBonus = Math.min(0.20, s.friends.length * 0.05);
        let successRate = 0.40 + friendBonus;
        if (s.economicCycle === 0) successRate += 0.10;
        if (s.economicCycle === 2) successRate -= 0.10;
        successRate = Math.max(0.20, Math.min(0.70, successRate));

        if (Math.random() < successRate) {
          const roll = Math.random();
          if (roll < 0.25) {
            // 好结果：朋友公司正好缺人，薪资甚至超过之前
            s.isUnemployed = false;
            s.currentProfession = s.preUnemployedSalary > 15000 ? '红利行业' : '传统私企';
            s.currentMonthlySalary = Math.round(s.preUnemployedSalary * (1.0 + Math.random() * 0.15));
            s.unemployedTurns = 0;
            s.happiness = Math.min(100, s.happiness + 15);
            s.stress = Math.max(0, s.stress - 10);
            return { log: `第${s.currentAge}岁，一个老同事直接给你内推到了他们公司，岗位正好对口，薪资比之前还高了一截。你请他吃了顿大餐，那晚喝了不少酒——出门靠朋友，这话真不是说说的。`, cost: 3000 };
          } else {
            // 普通结果：薪资回到70-90%
            s.isUnemployed = false;
            s.currentProfession = '传统私企';
            s.currentMonthlySalary = Math.round(s.preUnemployedSalary * (0.7 + Math.random() * 0.2));
            s.unemployedTurns = 0;
            s.happiness = Math.min(100, s.happiness + 5);
            return { log: `第${s.currentAge}岁，通过朋友内推你找到了一份工作。薪资比之前低一些，但至少不用再海投简历了。你感慨——通讯录里那些以为没用的联系人，关键时刻真能救命。`, cost: 3000 };
          }
        } else {
          s.stress = Math.min(100, s.stress + 5);
          s.happiness = Math.max(0, s.happiness - 3);
          return { log: `第${s.currentAge}岁，你请几个朋友吃了饭，大家都说"帮你留意"。但一个月过去了，没有任何实质性消息。你安慰自己"人情往来本来就不是一朝一夕的事"。`, cost: 3000 };
        }
      },
      logTemplate: '第{年龄}岁，你翻遍通讯录找人帮忙，人脉是失业时最硬的通货。',
    };
    
    // 组装求职卡（3个卡位，优先级：猎头 > 人脉 > 考公 > 基础卡）
    const specialCards: DecisionCard[] = [];
    if (showHeadhunter) specialCards.push(headhunterCard);
    if (showNetworking) specialCards.push(networkingCard);
    if (showCivilService) specialCards.push(civilServiceCard);

    // 先放特殊卡，再补基础卡
    jobCardsList.push(...specialCards.slice(0, 2));
    if (jobCardsList.length < 2) {
      jobCardsList.push(baseJobCards.cardA);
    }
    if (jobCardsList.length < 2) {
      jobCardsList.push(baseJobCards.cardB);
    }
    
    // 确保有2张求职卡
    while (jobCardsList.length < 2) {
      jobCardsList.push(baseJobCards.cardB);
    }
    
    // 再加1张随机可用卡
    const available = DECISION_CARDS.filter(card => {
      try {
        if (card.prerequisites && !card.prerequisites(state)) return false;
        if (card.ageRange) {
          if (state.currentAge < card.ageRange[0] || state.currentAge > card.ageRange[1]) return false;
        }
        return true;
      } catch { return false; }
    });
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return [...jobCardsList.slice(0, 2), ...shuffled.slice(0, 1)];
  }

  // 动态生成卖车卡片（有车且车龄>2年时出现）
  const showSellCar = state.hasCar && state.carAge > 2;

  const sellCarCard: DecisionCard = {
    id: 'sell_car',
    title: '【二手车出售】',
    description: `你的车开了${state.carAge}年了，当前估值约¥${(state.carValue || 50000).toLocaleString()}。要不要卖掉？`,
    cost: 0,
    prerequisites: () => true,
    effect: (s: GameState) => {
      const salePrice = Math.round((s.carValue || 50000) * (0.85 + Math.random() * 0.1)); // 二手卖价是估值的85%-95%
      s.hasCar = false;
      s.carValue = 0;
      s.carAge = 0;
      s.annualCarCost = 0;
      return { log: `第${s.currentAge}岁，你把车挂到了二手车平台，最终以${salePrice.toLocaleString()}元成交。买主是个刚拿到驾照的小年轻，你看着他把车开走，有点舍不得。`, cost: -salePrice };
    },
    logTemplate: '第{年龄}岁，你把开了几年的车卖了，手里多了一笔现金。',
  };

  // 动态生成提前还贷卡片（有房贷且存款足够时出现）
  const showPrepayMortgage = state.hasProperty && state.mortgageRemainingYears > 0 && state.currentSavings > state.currentMortgageCost * 3;

  const prepayMortgageCard: DecisionCard = {
    id: 'prepay_mortgage',
    title: '【提前还贷·无债一身轻】',
    description: `剩余${state.mortgageRemainingYears}年房贷，年供¥${state.currentMortgageCost.toLocaleString()}。提前还清需要一次性支付剩余总供的80%。`,
    cost: Math.round(state.currentMortgageCost * state.mortgageRemainingYears * 0.8),
    prerequisites: () => true,
    effect: (s: GameState) => {
      const prepayCost = Math.round(s.currentMortgageCost * s.mortgageRemainingYears * 0.8);
      s.mortgageRemainingYears = 0;
      s.currentMortgageCost = 0;
      s.stress = Math.max(0, s.stress - 15);
      s.happiness = Math.min(100, s.happiness + 10);
      return { log: `第${s.currentAge}岁，你决定把房贷一次性还清了。转账成功的那一刻，你长长地舒了一口气——从此以后，每个月多出来的钱，都是自己的。`, cost: prepayCost };
    },
    logTemplate: '第{年龄}岁，你还清了房贷，感觉整个人都轻了。',
  };

  const cardHistory = getCardUsageHistory(state);

  const available = DECISION_CARDS.filter(card => {
    try {
      // 1. 前置条件检查
      if (card.prerequisites && !card.prerequisites(state)) return false;

      // 2. 年龄范围检查
      if (card.ageRange) {
        if (state.currentAge < card.ageRange[0] || state.currentAge > card.ageRange[1]) return false;
      }

      // 3. 不可重复卡片：通过 prerequisites 已处理（如 !state.isInsured 等）

      // 4. 可重复卡片：检查冷却
      if (card.repeatable && card.cooldown && card.cooldown > 0) {
        const usage = cardHistory.get(card.id);
        if (usage) {
          const yearsSinceLastUse = state.currentAge - usage.lastUsedAge;
          if (yearsSinceLastUse < card.cooldown) return false;
        }
      }

      // 5. 可重复卡片：检查最大使用次数
      if (card.repeatable && card.maxUses !== undefined) {
        const usage = cardHistory.get(card.id);
        if (usage && usage.useCount >= card.maxUses) return false;
      }

      return true;
    } catch { return false; }
  });

  // 注入动态生成的条件卡片
  if (showSellCar) available.push(sellCarCard);
  if (showPrepayMortgage) available.push(prepayMortgageCard);

  // 注入多级别买房卡片（根据城市生成不同档次的房产）
  if (!state.hasProperty) {
    const levels = getHouseLevels(state.currentCity);
    // 只显示存款够首付的级别，最多显示2档（低一档 + 可能的高一档）
    const affordable = levels.filter(l => state.currentSavings >= l.minSavings);
    // 如果都买不起，至少显示最低档
    const toShow = affordable.length > 0 ? affordable.slice(0, 2) : levels.slice(0, 1);
    
    for (const level of toShow) {
      available.push({
        id: `buy_house_${level.tag}`,
        title: `【${level.label}】·${level.tag}`,
        description: `在${state.currentCity}买一套${level.label}。${level.hint}`,
        cost: level.downPayment,
        prerequisites: (s: GameState) => s.currentSavings >= level.minSavings && !s.hasProperty,
        effect: (s: GameState) => {
          s.hasProperty = true;
          s.currentMortgageCost = level.annualMortgage;
          s.mortgageRemainingYears = level.mortgageYears;
          s.propertyValue = level.propertyValue;
          s.happiness = Math.min(100, s.happiness + level.happinessBonus);
          (s as any).houseType = level.label;
          // 房产级别影响物业费
          if (level.tag === '终极改善') {
            s.annualPropertyMaintenance = (s.annualPropertyMaintenance || 0) + 3000; // 高端物业费更高
          }
          const log = `第${s.currentAge}岁，你签完那叠厚厚的贷款合同，钥匙冰凉，掌心温热。${level.tag === '刚需上车' ? '房子不大，但你站在这属于自己的几十平米里，觉得这城市终于有你一盏灯了。' : level.tag === '改善首选' ? '比上一间大了不少，你躺在沙发上发了会儿呆，心想这些年加班值了。' : level.tag === '品质生活' ? '小区有花园、有地下车位、物业还管得好。你站在阳台上看了会儿城市的天际线，觉得这把赌对了。' : '这是你在这个城市的终极居所。落地窗前的夜景让你站了很久，你拿出手机拍了一张——这是你这辈子买过最贵的东西，也是最贵的自由。'}`;
          return { log, cost: level.downPayment };
        },
        logTemplate: `第{年龄}岁，你在{城市}买了一套${level.label}，${level.tag}。`,
        category: '核心决策',
        repeatable: false,
      });
    }
  }

  // 按 category 分组，确保抽到的3张卡来自不同类别
  const byCategory = new Map<string, DecisionCard[]>();
  for (const card of available) {
    const cat = card.category || '核心决策';
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(card);
  }

  // 从不同类别中各抽一张，确保多样性
  const categories = [...byCategory.keys()].sort(() => Math.random() - 0.5);
  const result: DecisionCard[] = [];

  for (const cat of categories) {
    if (result.length >= count) break;
    const cards = byCategory.get(cat)!;
    const picked = cards[Math.floor(Math.random() * cards.length)];
    if (picked && !result.find(r => r.id === picked.id)) {
      result.push(picked);
    }
  }

  // 如果不够3张，从剩余中补充
  if (result.length < count) {
    const remaining = available.filter(c => !result.find(r => r.id === c.id));
    const shuffled = remaining.sort(() => Math.random() - 0.5);
    for (const card of shuffled) {
      if (result.length >= count) break;
      result.push(card);
    }
  }

  return result.slice(0, Math.min(count, result.length));
}

// ========== 应用卡片时记录使用历史 ==========
// 在 applySelectedCards 之后调用，确保 repeatable 卡的使用被追踪
export function trackCardUsage(state: GameState, cardId: string): void {
  const card = DECISION_CARDS.find(c => c.id === cardId);
  if (card && card.repeatable) {
    recordCardUsage(state, cardId);
  }
}
