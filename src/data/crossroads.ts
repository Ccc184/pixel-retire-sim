import type { CrossroadEvent, GameState, PartnerPersonality } from '../types/global.d.js';
import { PATH_CROSSROADS } from './path-crossroads.js';

// ========== 十字路口事件数据库 ==========
// 设计原则：不绑定固定年龄，基于状态条件触发
// 每种人生路线都有专属十字路口（单身、结婚无孩、结婚有孩、丁克等）
// 每个选项的effect函数直接修改state
//
// 重构版：剔除与退休路径冲突的职场/退休类"捣乱"事件，新增生活化彩蛋
// —— 感情类（3个）——
// 1. love_pressure            催婚
// 2. love_confession          表白
// 3. love_dink_vs_child       要不要孩子
// —— 家庭类（2个）——
// 4. family_parent_health     父母生病
// 5. family_marriage_crisis   婚姻危机
// —— 单身类（1个）——
// 6. single_loneliness        深夜空房间
// —— 车房彩蛋（2个）——
// 7. life_first_car           人生第一辆车
// 8. life_first_house         买房的诱惑
// —— 生活彩蛋（2个）——
// 9. life_inheritance         一笔意外之财
// 10. life_midnight_call      那通凌晨的电话
// —— 社交突发（5个）——
// 11. friend_marriage         红色炸弹
// 12. friend_borrow_money     老朋友借钱
// 13. friend_startup_invite   兄弟创业
// 14. parent_illness          父母重病ICU
// 15. friend_gap              同学聚会阶层落差
// + PATH_CROSSROADS           路径专属十字路口

export const CROSSROAD_EVENTS: CrossroadEvent[] = [
  // ============================================================
  // A. 车房彩蛋类（2个）
  // ============================================================

  // 人生第一辆车（没车+存款够+非All In）
  {
    id: 'life_first_car',
    title: '人生第一辆车',
    narrative: '周末你路过一家4S店，本来只是随便看看，销售小哥却热情得像失散多年的亲人。他递上冰可乐，让你坐进那辆亮闪闪的展车里，方向盘握在手里的那一刻，你忽然觉得有辆车好像也不错。试驾回来，他掏出计算器啪啪按了一通，笑着说"月供也就一顿饭钱"。你盯着那个数字，心里开始天人交战。',
    ageRange: [25, 35],
    priority: 5,
    cooldown: 8,
    tag: 'life_car',
    conditions: (s: GameState) => !s.hasCar && s.currentSavings >= 100000 && !s.isAllInPath,
    options: [
      {
        id: 'opt_economy_car',
        label: '买辆经济型代步车',
        description: '落地8万，遮风挡雨，上下班不用挤地铁',
        hint: '存款-80000，养车年开销约1万，幸福+8，压力-5',
        hintColor: 'positive',
        effect: (s: GameState) => {
          s.currentSavings -= 80000;
          s.hasCar = true;
          s.carValue = 64000;
          s.carAge = 0;
          (s as any).carType = '经济车';
          s.happiness = Math.min(100, s.happiness + 8);
          s.stress = Math.max(0, s.stress - 5);
          return { log: `第${s.currentAge}岁，你签了合同，提回一辆经济型小车。第一次自己开车上班那天，你故意绕了远路。晚高峰不用挤地铁的感觉，真好。虽然每月油钱保险停车费算下来也不少，但关上车门的那一刻，整个世界都安静了——这点钱，值。`, cost: 80000 };
        },
      },
      {
        id: 'opt_loan_better_car',
        label: '贷款买辆好点的',
        description: '首付3万开走B级车，月供3000撑面子',
        hint: '存款-30000，车贷年供36000，幸福+12，压力+8',
        hintColor: 'danger',
        effect: (s: GameState) => {
          s.currentSavings -= 30000;
          s.hasCar = true;
          s.carValue = 120000;
          s.carAge = 0;
          (s as any).carType = '中级车';
          s.annualBaseCost += 36000; // 车贷年供
          s.happiness = Math.min(100, s.happiness + 12);
          s.stress = Math.min(100, s.stress + 8);
          return { log: `第${s.currentAge}岁，你咬牙付了首付，开回一辆B级轿车。关门声沉甸甸的，同事在停车场多看了两眼。但每个月还贷日看着银行卡扣款短信，你还是会肉疼——算了，年轻时总得对自己好一次。`, cost: 30000 };
        },
      },
      {
        id: 'opt_no_car',
        label: '算了，公共交通挺好的',
        description: '存款不动，地铁公交环保又省钱',
        hint: '幸福+2，存款不变',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.happiness = Math.min(100, s.happiness + 2);
          return { log: `第${s.currentAge}岁，你在4S店坐了一下午，最后笑着和销售握手说"再考虑考虑"。走出店门的那一刻，你忽然觉得轻松——地铁上看书、公交上发呆，其实也挺自在。钱在卡里，比车在车库里踏实。`, cost: 0 };
        },
      },
    ],
  },

  // 买房的诱惑（没房+存款够+非All In+没公司）
  {
    id: 'life_first_house',
    title: '买房的诱惑',
    narrative: '中介发来一套小户型的链接，总价100万，首付30万——刚好是你全部的积蓄。房东急着出手，价格比同小区低了一截。你想起搬家时扛着箱子上六楼、房东突然涨租时的无奈、深夜被楼上噪音吵醒的烦躁。有个自己的窝，好像真的不一样。但你也算了一笔账：贷款30年，每个月房贷将近四千，还要留钱装修、交税、买家具。签了字，往后三十年你就被绑在这套房子上了；不签，你永远是个"租客"。',
    ageRange: [26, 40],
    priority: 6,
    cooldown: 8,
    tag: 'life_house',
    conditions: (s: GameState) => !s.hasProperty && s.currentSavings >= 300000 && !s.isAllInPath && !s.hasCompany,
    options: [
      {
        id: 'opt_buy_city_house',
        label: '掏空积蓄，首付上车',
        description: '扎根这座城市，从此有个自己的窝，也背上了三十年房贷',
        hint: '存款归零，房产100万，月供房贷，幸福+12，压力+18',
        hintColor: 'danger',
        effect: (s: GameState) => {
          const downPayment = Math.min(s.currentSavings, 300000);
          s.currentSavings -= downPayment;
          s.hasProperty = true;
          s.propertyValue = 1000000;
          s.currentMortgageCost = 48000; // 月供4000，年供4.8万
          s.mortgageRemainingYears = 30;
          (s as any).houseType = '刚需上车';
          s.happiness = Math.min(100, s.happiness + 12);
          s.stress = Math.min(100, s.stress + 18);
          if (Math.random() < 0.3) {
            // 交房后发现问题
            s.happiness = Math.max(0, s.happiness - 8);
            s.stress = Math.min(100, s.stress + 8);
            s.currentSavings = Math.max(0, s.currentSavings - 20000); // 额外维修
            return { log: `第${s.currentAge}岁，你签完那叠厚厚的贷款合同，卡里几乎一分钱不剩。钥匙到手那天你确实高兴了一阵子，但装修超了预算、交房发现墙面渗水、物业扯皮……麻烦事一件接一件。你开始后悔没多留点备用金，每个月工资到账第一件事就是还房贷，连生病都不敢。有了房子是踏实，但"房奴"两个字不是白叫的——你不敢辞职，不敢旅行，甚至不敢生病。这就是扎根的代价吗？`, cost: downPayment + 20000 };
          }
          return { log: `第${s.currentAge}岁，你签完那叠厚厚的贷款合同，卡里几乎一分钱不剩。钥匙冰凉，掌心温热。房子不大，装修简单，但你站在这属于自己的几十平米里，觉得这城市终于有你一盏灯了。从此每个月还贷日准时扣款，你开始关注每一笔开销，不敢随便辞职，也不敢大手大脚花钱。但推开家门的那一刻，疲惫都被这盏灯融化了。有根的感觉，和租房确实不一样。`, cost: downPayment };
        },
      },
      {
        id: 'opt_keep_renting',
        label: '不买，继续租，把钱花在自己身上',
        description: '不被房贷绑死，保持自由和流动性',
        hint: '存款不变，幸福+8，压力-5，信念+8，职场弹性↑',
        hintColor: 'positive',
        effect: (s: GameState) => {
          s.happiness = Math.min(100, s.happiness + 8);
          s.stress = Math.max(0, s.stress - 5);
          s.pathFaith = Math.min(100, s.pathFaith + 8);
          (s as any).careerFlexibility = true; // 标记：职场弹性高，后续可考虑跳槽/转行
          const rentLogs = [
            `第${s.currentAge}岁，你关掉中介的链接，把那笔钱留在了理财账户里。室友笑你"不买房永远是个租客"，你笑了笑没接话。后来你用这笔钱报了个一直想学的课程，年假去了趟一直想去的日本，换工作的时候不用考虑"房子买在这儿不能动"。房东涨租你就换地方住，遇到不开心的工作你敢裸辞。租房是漂泊，但漂泊也意味着随时可以出发。你看着那些被房贷压得不敢喘气的同事，第一次觉得——不买房，不是失败，是另一种活法。`,
            `第${s.currentAge}岁，你没有买房。身边的朋友一个个上车了，每次聚会都在聊房贷利率和学区房，你插不上话。但你也看到他们不敢请假、不敢消费、连离婚都不敢——因为房子绑着两个人。你租的房子不大，但你用省下来的钱办了健身卡、学了新技能、每年出去旅行两次。三十岁这年你甚至gap了三个月去云南住了一阵。有人说你"漂着"，你觉得自己活得比很多"扎根"的人更扎实。房子是资产，但自由也是。`,
          ];
          return { log: rentLogs[Math.floor(Math.random() * rentLogs.length)], cost: 0 };
        },
      },
      {
        id: 'opt_buy_hometown',
        label: '回老家买',
        description: '房价便宜，离父母近，但工作还在大城市租房',
        hint: '存款-15万，房产50万，房贷低，父母关系+15，压力+5',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.currentSavings -= 150000;
          s.hasProperty = true;
          s.propertyValue = 500000;
          s.currentMortgageCost = 18000; // 月供1500，年供1.8万
          s.mortgageRemainingYears = 25;
          (s as any).houseType = '老家安居';
          if (s.parents.isAlive) s.parents.relationShip = Math.min(100, s.parents.relationShip + 15);
          s.happiness = Math.min(100, s.happiness + 6);
          s.stress = Math.min(100, s.stress + 5);
          return { log: `第${s.currentAge}岁，你回老家看了一天的房，最后签了一套小户型，总价50万，首付15万，月供一千五，几乎没什么压力。你妈高兴得做了一大桌子菜，你爸破天荒喝了点酒。但你工作还在大城市，房子空着，自己还在租房。逢年过节回去，推开门就是自己的家——这感觉确实和租房不一样。只是你偶尔也会想：我到底在哪儿安家呢？这房子是退路，还是归宿？你还没想清楚。`, cost: 150000 };
        },
      },
    ],
  },

  // ============================================================
  // B. 感情类（3个）
  // ============================================================

  // 4. 催婚十字路口（未婚+父母在世+年龄>=25）
  {
    id: 'love_pressure',
    title: '催婚的围攻',
    narrative: '除夕那晚，饭桌上七大姑八大姨的追问像鞭炮一样响个不停。你低着头扒饭，假装没听见。你妈一直没说话，只是给你夹菜，筷子碰到碗沿的声音特别轻。饭后你爸在阳台抽了根烟，背对着你说了一句"你也不小了"。风把烟吹散了，你没接话，只是觉得喉咙发紧。',
    ageRange: [25, 38],
    priority: 8,
    cooldown: 5,
    tag: 'family_pressure',
    conditions: (s: GameState) => !s.isMarried && !s.partner && s.parents.isAlive && s.parents.relationShip > 40 && s.currentAge >= 25 && (s.stress > 50 || s.happiness < 55),
    options: [
      {
        id: 'opt_accept_blind_date',
        label: '"行，安排吧"',
        description: '答应相亲，四种随机结局',
        hint: '试试看吧',
        hintColor: 'positive',
        effect: (s: GameState) => {
          (s as any).socialActiveThisYear = true;
          const roll = Math.random();
          if (roll < 0.35) {
            // 遇到还不错的人，触发crush
            const names = ['晓芸', '佳慧', '雨萱', '思琪', '浩然', '宇轩', '俊杰', '子涵', '欣妍', '志远'];
            const personalities: PartnerPersonality[] = ['温柔型', '事业型', '浪漫型', '节俭型', '独立型'];
            const traits = ['爱笑', '做饭好吃', '工作认真', '爱旅行', '猫奴', '话少但暖心'];
            s.partner = {
              name: names[Math.floor(Math.random() * names.length)],
              age: s.currentAge + Math.floor(Math.random() * 4) - 1,
              affection: 35 + Math.floor(Math.random() * 11),
              trust: 30 + Math.floor(Math.random() * 11),
              marriedYear: 0,
              hasDivorced: false,
              personality: personalities[Math.floor(Math.random() * personalities.length)],
              datingStage: 'crush',
              meetYear: s.currentAge,
              trait: traits[Math.floor(Math.random() * traits.length)],
              memories: [{ age: s.currentAge, event: '相亲认识的', emoji: '☕' }],
              crushFrom: 'blind_date',
            };
            s.happiness = Math.min(100, s.happiness + 10);
            s.parents.relationShip = Math.min(100, s.parents.relationShip + 8);
            return { log: '相亲那天你差点不想去，但推开咖啡厅的门时，对面那个人冲你笑了一下。你们聊了很久，话题从工作聊到小时候偷吃零食的事。临走时TA说"下次再约"。你走在路上，忽然觉得今天风挺温柔的。', cost: 0 };
          } else if (roll < 0.60) {
            // 遇到奇葩
            s.stress = Math.min(100, s.stress + 8);
            s.parents.relationShip = Math.min(100, s.parents.relationShip + 5);
            return { log: '对面那个人坐下就问你家几套房、年薪多少、父母退休金多少。你微笑着喝完那杯咖啡，回去发了条消息给你妈："人挺好的，不合适。"你妈回了三个问号。', cost: 0 };
          } else if (roll < 0.85) {
            // 对方没看上你
            s.happiness = Math.max(0, s.happiness - 5);
            s.stress = Math.min(100, s.stress + 5);
            return { log: '你其实挺喜欢对方的聊天方式的。但吃完饭对方发来消息："觉得我们不太合适，抱歉。"你盯着那条消息看了很久，最后只回了个"好的，祝你一切顺利"。', cost: 0 };
          } else {
            // 双方都没感觉
            return { log: '吃完饭你俩在门口客气地道别，说了句"保持联系"。然后你们再也没联系过。就像两条平行线短暂地交叉了一下，又各自走远了。', cost: 0 };
          }
        },
      },
      {
        id: 'opt_resist_gentle',
        label: '"我有自己的生活"',
        description: '温和拒绝，父母关系-10，压力-8',
        hint: '坦诚但不刺耳',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.parents.relationShip = Math.max(0, s.parents.relationShip - 10);
          s.stress = Math.max(0, s.stress - 8);
          s.happiness = Math.min(100, s.happiness + 3);
          return { log: '你深吸一口气说："爸、妈，我知道你们是为我好，但我现在的生活挺好的。该遇到的人总会遇到的。"你爸没说话，把烟掐了。你妈说了一句"你自己看着办吧"，语气比你想的轻。', cost: 0 };
        },
      },
      {
        id: 'opt_resist_explosive',
        label: '"别管我了！"',
        description: '和父母大吵一架，结果取决于你们的关系',
        hint: '爆发之后……',
        hintColor: 'negative',
        effect: (s: GameState) => {
          s.parents.relationShip = Math.max(0, s.parents.relationShip - 30);
          const relationBefore = s.parents.relationShip + 30; // 还原到吵架前的关系值
          if (relationBefore >= 65) {
            // 关系一直很好，爆发后深深内疚
            s.happiness = Math.max(0, s.happiness - 15);
            s.stress = Math.min(100, s.stress + 12);
            return { log: '你吼了一句"别管我了"摔了门出去。夜风灌进来，你在小区长椅上坐了半小时。冷静下来之后你开始后悔——你妈红着眼眶给你夹菜的样子、你爸背对着你抽烟的背影，在脑子里反复转。你想道歉但拉不下脸。手机亮了，是你妈发来的："早点回来，给你热着饭。"你盯着那条消息看了很久，鼻子一酸。这一架吵赢了道理，输了心情。', cost: 0 };
          } else if (relationBefore <= 40) {
            // 关系一直不好，爆发后反而有种解脱感
            s.stress = Math.max(0, s.stress - 20);
            s.happiness = Math.min(100, s.happiness + 3);
            return { log: '你吼了一句"别管我了"摔了门出去。夜风灌进来，你在小区长椅上坐了半小时。奇怪的是你没有后悔，反而觉得胸口闷了好几年的那口气终于吐出来了。他们不是关心你，只是在乎自己的面子——你心里清楚。手机没响，没人叫你回去。你坐了很久，然后站起来去便利店买了罐啤酒。有些关系，吵开了反而轻松。', cost: 0 };
          } else {
            // 关系不好不坏，五味杂陈
            s.stress = Math.max(0, s.stress - 5);
            s.happiness = Math.max(0, s.happiness - 5);
            return { log: '你吼了一句"别管我了"摔了门出去。夜风灌进来，你在小区长椅上坐了半小时。说不上后悔，但也没觉得爽。你知道他们是为你好，但"为你好"这三个字有时候比骂你还难受。回家的时候灯还亮着，桌上留了一碗汤，凉了。你热了热喝了，没人说话。', cost: 0 };
          }
        },
      },
      {
        id: 'opt_fake_comply',
        label: '"好好好，我会留意的"',
        description: '嘴上答应，实际该干嘛干嘛——阳奉阴违',
        hint: '短期好过，长期问题还在，压力+5',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 5);
          (s as any).parentNagCount = ((s as any).parentNagCount || 0) + 1;
          const nagCount = (s as any).parentNagCount || 1;
          if (nagCount <= 2) {
            s.parents.relationShip = Math.min(100, s.parents.relationShip + 3);
            s.happiness = Math.max(0, s.happiness - 2);
            return { log: '你赔着笑说"好好好，我会留意的，有合适的肯定带回来"。你妈满意了，又给你夹了一筷子菜。你低头扒饭，心里清楚自己根本没打算行动。这顿饭算是过了，但你知道下次过节他们还会问。撒谎不难，难的是要一直撒下去。', cost: 0 };
          } else if (nagCount <= 4) {
            s.parents.relationShip = Math.max(0, s.parents.relationShip - 8);
            s.happiness = Math.max(0, s.happiness - 5);
            return { log: `你又说"好好好我知道了"，但你妈已经不信了："你去年也是这么说的！"你打着哈哈糊弄过去，但气氛明显冷了。你爸放下筷子看了你一眼，没说话。你开始觉得这种阳奉阴违的策略快撑不住了——他们又不傻，只是不想拆穿你。`, cost: 0 };
          } else {
            s.parents.relationShip = Math.max(0, s.parents.relationShip - 15);
            s.stress = Math.min(100, s.stress + 10);
            s.happiness = Math.max(0, s.happiness - 8);
            return { log: `"好好好"三个字你已经说了太多遍，连你自己都觉得烦了。这次你妈直接哭了："你是不是就想敷衍我们到老？"你张了张嘴，没说出话来。你爸叹了口气说"算了，别逼他了"。那顿饭吃得极其沉默。你发现阳奉阴违的代价不是一次撒谎，而是你和他们之间慢慢多了一堵看不见的墙。`, cost: 0 };
          }
        },
      },
    ],
  },

  // 5. 暧昧表白
  {
    id: 'love_confession',
    title: '那个人的消息',
    narrative: '凌晨一点，你正准备关灯睡觉，手机屏幕忽然亮了。是那个人——也许是经常一起加班吃夜宵的同事，也许是朋友聚上认识后断断续续聊了大半年的人，也许是认识多年最近忽然走近的老同学。你们谁都没捅破过那层纸，但你心里清楚，有些东西已经不一样了。消息写着："我爸妈下周过来，想见见你一面。"你把手机扣在胸口，听见自己的心跳很响。窗外有车开过，灯光在天花板上一扫而过。你想了很久，打字又删，删了又打。',
    ageRange: [24, 36],
    priority: 11,
    cooldown: 6,
    tag: 'love',
    conditions: (s: GameState) => !s.isMarried && !s.partner && s.currentAge >= 22 && s.friends.length > 0 && (s.happiness < 65 || s.stress > 40),
    options: [
      {
        id: 'opt_confess_yes',
        label: '"我想了很久，答案是我愿意"',
        description: '认真回应，勇敢迈出这一步',
        hint: '双向奔赴或一厢情愿',
        hintColor: 'positive',
        effect: (s: GameState) => {
          const roll = Math.random();
          const meetContexts = [
            { trait: '一起加班的同事', from: 'work' as const },
            { trait: '朋友聚会认识的', from: 'friend' as const },
            { trait: '多年老同学', from: 'friend' as const },
            { trait: '邻居', from: 'friend' as const },
          ];
          const ctx = meetContexts[Math.floor(Math.random() * meetContexts.length)];
          if (roll < 0.40) {
            // 双向奔赴
            const names = ['晓芸', '佳慧', '雨萱', '思琪', '浩然', '宇轩', '俊杰', '子涵', '欣妍', '志远'];
            const personalities: PartnerPersonality[] = ['温柔型', '事业型', '浪漫型', '节俭型', '独立型'];
            s.partner = {
              name: names[Math.floor(Math.random() * names.length)],
              age: s.currentAge + Math.floor(Math.random() * 4) - 1,
              affection: 60 + Math.floor(Math.random() * 16),
              trust: 50 + Math.floor(Math.random() * 16),
              marriedYear: 0,
              hasDivorced: false,
              personality: personalities[Math.floor(Math.random() * personalities.length)],
              datingStage: 'dating',
              meetYear: s.currentAge,
              trait: ctx.trait,
              memories: [{ age: s.currentAge, event: '终于捅破了窗户纸', emoji: '💕' }],
              crushFrom: ctx.from,
            };
            s.happiness = Math.min(100, s.happiness + 15);
            s.stress = Math.max(0, s.stress - 10);
            return { log: '你们终于把话说开了。那个周末，你们手牵手走在河边，夕阳把影子拉得很长。你忽然觉得，一个人走了这么久的路，终于有人愿意一起走了。你不确定未来会怎样，但至少此刻，你不想再犹豫了。', cost: 0 };
          } else if (roll < 0.65) {
            // 对方说"给我点时间想想"
            (s as any).pendingConfession = true;
            s.stress = Math.min(100, s.stress + 5);
            return { log: '你认真回复了很长一段话，说了自己的心意。对方沉默了一会儿说："我有点意外……能给我点时间想想吗？"你点了点头。等待的感觉像考试交完卷但不确定答案对不对。', cost: 0 };
          } else if (roll < 0.85) {
            // 被温柔拒绝
            s.happiness = Math.max(0, s.happiness - 15);
            s.stress = Math.min(100, s.stress + 10);
            return { log: '对方说得很温柔："你对我很好，我一直都知道。但我一直把你当最好的朋友。"你笑着说"没事"。回家的路上你走了很远的弯路，耳机里循环了一首歌。你不后悔说出口，但心里还是空了一块。', cost: 0 };
          } else {
            // 对方已有对象了
            s.happiness = Math.max(0, s.happiness - 18);
            s.stress = Math.min(100, s.stress + 15);
            return { log: '对方很久没回复，最后发来一句"对不起，我其实已经有对象了，之前没好意思说"。你愣了一下，然后说了句"恭喜"。那天晚上你删掉了大半年的聊天记录，也删掉了一个你以为有可能的未来。', cost: 0 };
          }
        },
      },
      {
        id: 'opt_delay_uncertain',
        label: '"现在不确定，再等等"',
        description: '犹豫不决，三种随机结局',
        hint: '犹豫也是一种选择',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          const roll = Math.random();
          if (roll < 0.50) {
            // 对方失望了不再联系
            s.happiness = Math.max(0, s.happiness - 10);
            return { log: '你说了句"现在不太确定，让我想想"。对方说了声"好的"，语气没什么起伏。之后的日子你等了很久，手机一直没响。你后来才明白，有些人只问一次，错过就是错过了。', cost: 0 };
          } else if (roll < 0.80) {
            // 对方等你
            (s as any).pendingConfession = true;
            return { log: '对方说："没关系，我等你。"你不知道该高兴还是难过。这句话既是温柔，也是一把悬在头顶的剑——你知道自己迟早要给一个答案。', cost: 0 };
          } else {
            // 时机已过
            s.happiness = Math.max(0, s.happiness - 18);
            return { log: '你犹豫了太久。等你终于想清楚去找对方的时候，动态圈里看到了TA和别人的合照。你放大看了看，然后关掉手机，盯着天花板发了很久的呆。有些人不是等你准备好才会停留的。', cost: 0 };
          }
        },
      },
      {
        id: 'opt_friendzone',
        label: '"我们还是做朋友吧"',
        description: '明确朋友区，不想破坏现有关系',
        hint: '安全但遗憾，压力-5，幸福-3',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.stress = Math.max(0, s.stress - 5);
          s.happiness = Math.max(0, s.happiness - 3);
          (s as any).friendZoned = true;
          if (s.friends.length > 0) {
            s.friends[0].relation = Math.max(0, s.friends[0].relation - 5);
          }
          return { log: '你说得很认真："你对我来说很重要，我不想失去你这个朋友，但我对你没有那种感觉。"对方沉默了很久，说了声"嗯，我懂了"。之后你们还像从前一样偶尔聊天，但有些东西回不去了——你知道TA看你的眼神变了，你也知道自己可能错过了一个很珍贵的人。但你不想骗人，更不想骗自己。', cost: 0 };
        },
      },
      {
        id: 'opt_decline_gently',
        label: '"谢谢你，但我现在不想谈恋爱"',
        description: '坦诚婉拒，不给对方错觉也不给自己留幻想',
        hint: '压力-3，幸福-8，关系微降但不留后患',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.stress = Math.max(0, s.stress - 3);
          s.happiness = Math.max(0, s.happiness - 8);
          if (s.friends.length > 0) {
            s.friends[0].relation = Math.max(0, s.friends[0].relation - 8);
          }
          const declineLogs = [
            '你想了很久，回了很长一段话："你很好，真的。但我现在的状态不适合进入一段感情，不想耽误你。你值得更好的人。"发完你把手机放在一边，心里有点堵但也松了口气。不是所有好感都要变成爱情，不是所有相遇都要有结果。对方回了个"谢谢你的坦诚"，之后你们默契地少了联系。你偶尔会想起TA，但不后悔自己的选择——不爱却接受，才是最大的不善良。',
            '你认真回复说："对不起，我一直把你当朋友，之前让你误会了是我的不对。"很大度地说了句"没关系"，但你知道你们之间不可能像从前那样自然了。你拒绝了一个真心对你好的人，说不难受是假的。但你更知道，勉强在一起对谁都不公平。有些温柔，恰恰是狠心。',
          ];
          return { log: declineLogs[Math.floor(Math.random() * declineLogs.length)], cost: 0 };
        },
      },
    ],
  },

  // 6. 丁克vs要孩子（已婚无孩）
  {
    id: 'love_dink_vs_child',
    title: '孩子的选择题',
    narrative: '周末晚饭后，伴侣把碗放进水池，转身靠在灶台上说："我妈今天又打电话来了，说再不生就来不及了。"水龙头没关紧，一滴一滴地响。你们都没说话，客厅里的电视还开着，放着一个没人看的节目。这个问题已经悬在头顶很久了，今晚它终于落地了。',
    ageRange: [27, 40],
    priority: 10,
    cooldown: 6,
    tag: 'family',
    conditions: (s: GameState) => s.isMarried && s.partner !== null && !s.partner.hasDivorced && !s.hasChild && s.partner.affection > 40 && s.currentAge >= 26 && (s.happiness < 60 || s.partner.affection < 60 || s.stress > 55),
    options: [
      {
        id: 'opt_have_child',
        label: '我们准备好了，要个孩子吧',
        description: '年支出+35000，但可能怀不上，父母关系+15',
        hint: '缘分和努力各占一半',
        hintColor: 'neutral',
        prerequisites: (s: GameState) => s.currentSavings >= 30000 && s.health >= 35 && s.currentAge <= 42,
        disabledReason: (s: GameState) => s.currentAge > 42 ? '年龄太大，生育风险极高' : s.health < 35 ? '身体状况不适合备孕' : '经济条件不允许',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 5);
          s.currentSavings -= 10000; // 备孕检查、调理身体

          // 成功怀孕概率：年龄越大越低
          let successRate = 0.75;
          if (s.currentAge >= 32) successRate -= 0.10;
          if (s.currentAge >= 36) successRate -= 0.15;
          if (s.currentAge >= 38) successRate -= 0.10;
          if (s.health < 50) successRate -= 0.15;
          successRate = Math.max(0.30, Math.min(0.80, successRate));

          // 5%小概率：流产
          if (Math.random() < 0.05) {
            s.happiness = Math.max(0, s.happiness - 18);
            s.stress = Math.min(100, s.stress + 18);
            if (s.partner) s.partner.affection = Math.min(100, s.partner.affection + 5);
            return { log: '你们确实怀上了，全家人都沉浸在喜悦中。但第八周的时候，伴侣突然腹痛去了医院。医生说"胚胎没有发育好，这是自然淘汰"。你们抱在一起哭了很久——这一次，是心痛的眼泪。但经历了这件事，你们发现彼此是对方最坚实的依靠。', cost: 10000 };
          }

          if (Math.random() < successRate) {
            // 顺利怀上
            s.hasChild = true;
            s.annualBaseCost += 35000;
            s.happiness = Math.min(100, s.happiness + 15);
            if (s.parents.isAlive) s.parents.relationShip = Math.min(100, s.parents.relationShip + 15);
            if (s.partner) s.partner.affection = Math.min(100, s.partner.affection + 10);
            s.stress = Math.max(0, s.stress - 5);
            return { log: '你们开始备孕，戒掉了咖啡和熬夜。几个月后，验孕棒上出现了两条杠。你们抱在一起哭了——这一次，是高兴的眼泪。', cost: 10000 };
          } else {
            // 没怀上
            s.stress = Math.min(100, s.stress + 10);
            s.happiness = Math.max(0, s.happiness - 8);
            if (s.partner) s.partner.affection = Math.max(0, s.partner.affection - 3);
            return { log: '你们开始备孕，叶酸吃了好几个月，排卵期算得比KPI还精确。但肚子一直没消息。去医院检查，医生说"放松心情，缘分到了自然就有了"。你笑着点头，心里却像压了块石头。', cost: 10000 };
          }
        },
      },
      {
        id: 'opt_dink',
        label: '我们不想要孩子',
        description: '伴侣感情可能受影响，双方父母压力增加',
        hint: '自由但孤独',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          if (s.partner) {
            s.partner.affection = Math.max(0, s.partner.affection - 10);
            // 根据伴侣性格产生不同效果
            const personality = s.partner.personality;
            if (personality === '温柔型' || personality === '浪漫型') {
              // 价值观冲突，想要孩子但对方拒绝
              s.partner.affection = Math.max(0, s.partner.affection - 15);
              if (Math.random() < 0.3) {
                // 30%概率伴侣主动提出分手
                s.partner.datingStage = 'divorced';
                s.isMarried = false;
                s.partner.hasDivorced = true;
                s.partner.exName = s.partner.name;
                return { log: '你说"我们不想要孩子"的时候，伴侣的眼神暗了下去。几天后，TA说"我觉得我们想要的东西不一样"。你没想到，一个关于孩子的决定，竟然成了你们感情的终点。', cost: 0 };
              }
            } else if (personality === '事业型' || personality === '独立型') {
              // 价值观一致，感情反而加分
              s.partner.affection = Math.min(100, s.partner.affection + 5);
            }
          }
          if (s.parents.isAlive) s.parents.relationShip = Math.max(0, s.parents.relationShip - 15);
          s.stress = Math.min(100, s.stress + 3);
          s.happiness = Math.min(100, s.happiness + 5);
          return { log: '你们商量后决定：不要孩子，把时间和金钱留给自己。这个决定让两边的父母很失望，但你们觉得，至少这是自己选的。', cost: 0 };
        },
      },
      {
        id: 'opt_delay_again',
        label: '以后再说吧',
        description: '什么都不变，问题继续累积',
        hint: '拖延',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 5);
          if (s.partner) s.partner.affection = Math.max(0, s.partner.affection - 3);
          // 追踪拖延次数
          (s as any).childDelayCount = ((s as any).childDelayCount || 0) + 1;
          if ((s as any).childDelayCount >= 3) {
            // 拖太久了，伴侣开始动摇
            if (s.partner) s.partner.affection = Math.max(0, s.partner.affection - 10);
            return { log: '你又说了一次"再等等吧"。伴侣这次没有沉默，而是看着你说"你已经说了三次了，我分不清你是真的没准备好，还是根本不想要"。那晚你们各刷各的手机，中间隔着半米的距离和一整个沉默。', cost: 0 };
          }
          return { log: '你说"再等等吧"。伴侣没说话，但那个晚上你们各刷各的手机，中间隔着半米的距离和一整个沉默。', cost: 0 };
        },
      },
      {
        id: 'opt_adopt',
        label: '我们领养一个吧',
        description: '花费50000元，年支出+30000，给一个孩子一个家',
        hint: '爱心与责任',
        hintColor: 'positive',
        prerequisites: (s: GameState) => s.currentSavings >= 50000,
        disabledReason: '存款不够领养的花费',
        effect: (s: GameState) => {
          s.currentSavings -= 50000; // 领养费用+手续

          // 20%概率：手续出问题
          if (Math.random() < 0.20) {
            s.happiness = Math.max(0, s.happiness - 18);
            s.stress = Math.min(100, s.stress + 10);
            return { log: '你们跑了三个月的流程，材料交了五次，好不容易等到审批结果——却被驳回了。理由是"条件不符"。你们不服，申请了复议，又等了两个月，还是没通过。五万块的手续费打了水漂，你们坐在民政局的台阶上，谁也不想先说话。', cost: 50000 };
          }

          // 领养成功
          s.hasChild = true;
          s.annualBaseCost += 30000;
          s.happiness = Math.min(100, s.happiness + 15);
          if (s.partner) s.partner.affection = Math.min(100, s.partner.affection + 8);
          if (s.parents.isAlive) s.parents.relationShip = Math.min(100, s.parents.relationShip + 5);
          return { log: '你们去了福利院，一个三岁的小女孩怯生生地躲在阿姨身后，却在你蹲下来的时候主动伸出了手。手续跑了两个月，花了不少钱，但当你们带着她走出福利院大门的时候，伴侣说了一句："领养的也是咱家的孩子。"你妈在电话那头哭了，说"好好养，和亲生的一个样"。', cost: 50000 };
        },
      },
    ],
  },

  // ============================================================
  // C. 家庭类（2个）
  // ============================================================

  // 7. 父母健康危机
  {
    id: 'family_parent_health',
    title: '至亲的健康警报',
    narrative: '周三下午开会的时候，你妈打来电话，你按掉了。开完会回拨过去，电话那头她的声音比平时轻很多："你爸最近老说胸口闷，我让他去医院他死活不肯去。"你愣了一下，翻相册才发现上一次回家已经是去年国庆了。手机里还存着他去年的体检报告截图，几个向上的红色箭头你当时没当回事。',
    ageRange: [30, 55],
    priority: 12,
    cooldown: 8,
    tag: 'parent_health',
    conditions: (s: GameState) => s.parents.isAlive && s.parents.age >= 55 && s.parents.health < 55 && s.parents.health > 10 && (s.stress > 55 || s.parents.health < 45),
    options: [
      {
        id: 'opt_go_home_care',
        label: '请假回家照顾，带爸去做全面检查',
        description: '花费20000元，父母关系+25，但可能丢工作',
        hint: '尽孝有代价',
        hintColor: 'danger',
        prerequisites: (s: GameState) => s.currentSavings >= 20000 && s.currentProfession !== '自由职业' && !s.isAllInPath && !s.hasCompany,
        disabledReason: s => {
          if (s.currentSavings < 20000) return '存款不够请假回家的开销';
          if (s.isAllInPath || s.hasCompany || s.currentProfession === '自由职业') return '你是自己的老板，时间可以自己安排';
          return '';
        },
        effect: (s: GameState) => {
          s.currentSavings -= 20000;
          s.stress = Math.min(100, s.stress + 8);

          const isStableJob = s.currentProfession === '体制内';
          const jobLossChance = isStableJob ? 0.10 : 0.35; // 体制内不太会被开，私企风险高

          const roll = Math.random();
          if (roll < jobLossChance) {
            s.parents.health = Math.min(100, s.parents.health + 25);
            s.parents.relationShip = Math.min(100, s.parents.relationShip + 30);
            if (isStableJob) {
              // 体制内：不会真被开，但被调到闲职/降薪
              s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 0.6);
              s.happiness = Math.max(0, s.happiness - 5);
              return { log: '你请了长假赶回去，强行带老爸去了医院。检查发现早期冠心病，幸好发现得早。你陪了一个月，端屎端尿没一句怨言。回来后领导找你谈话，说"家里事重要，给你调个轻松点的岗"——轻松是轻松了，工资砍了四成，晋升也没戏了。你没后悔。', cost: 20000 };
            } else {
              // 私企：直接被裁
              s.isUnemployed = true;
              s.preUnemployedSalary = s.currentMonthlySalary;
              s.currentMonthlySalary = 0;
              s.happiness = Math.max(0, s.happiness - 15);
              return { log: '你请了长假赶回去，强行带老爸去了医院。检查发现早期冠心病，幸好发现得早。你陪了一个月，端屎端尿没一句怨言。但等你回到公司，你的位置已经被人顶了。HR说"公司不是慈善机构"，你被优化了。你没后悔，只是在招聘网站上刷新简历的时候，叹了口气。', cost: 20000 };
            }
          } else if (roll < 0.50) {
            // 工作保住了，父母好转
            s.parents.health = Math.min(100, s.parents.health + 20);
            s.parents.relationShip = Math.min(100, s.parents.relationShip + 25);
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 0.9); // 请假扣薪
            return { log: '你请了年假加事假赶回去，强行带老爸去了医院。检查结果不算太严重，但医生说"不能再拖了"。你陪着做完所有检查，看着老爸在抽血时别过头的样子，你忽然发现他的头发全白了。回到公司领导虽然没说什么，但年终奖扣了不少。', cost: 20000 };
          } else {
            // 工作保住了，但病情比想象中重
            s.parents.health = Math.max(0, s.parents.health - 5);
            s.parents.relationShip = Math.min(100, s.parents.relationShip + 15);
            s.stress = Math.min(100, s.stress + 10);
            return { log: '你赶回去带老爸做了全面检查。结果比想象中严重——需要长期吃药，定期复查。你安排好了一切才回来上班，但心里一直悬着。工作还在，但你知道以后这种事只会越来越多。', cost: 20000 };
          }
        },
      },
      {
        id: 'opt_send_money',
        label: '转一笔钱回去，让爸妈自己去检查',
        description: '花费10000元，但父母可能舍不得花',
        hint: '远距离尽孝，看缘分',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.currentSavings -= 10000;
          s.stress = Math.min(100, s.stress + 3);

          const roll = Math.random();
          if (roll < 0.45) {
            // 父母听话去检查了
            s.parents.health = Math.min(100, s.parents.health + 15);
            s.parents.relationShip = Math.min(100, s.parents.relationShip + 15);
            return { log: '你转了一万块过去，说"爸，你去医院做个全面检查，钱我来出"。这次你妈盯着他真的去了。检查完你爸打电话说"没事，就是老毛病"，但你听出他声音里的轻松。你妈私下发了条消息"谢谢你，孩子"。', cost: 10000 };
          } else if (roll < 0.75) {
            // 去了，但不彻底
            s.parents.health = Math.min(100, s.parents.health + 5);
            s.parents.relationShip = Math.min(100, s.parents.relationShip + 8);
            return { log: '你转了钱，你爸嘴上说"不用不用"但还是收了。他去社区医院做了个简单体检，开了点药就回来了。大医院他嫌贵不肯去，你打电话催了几次，他都说"好了好了没事了"。', cost: 10000 };
          } else {
            // 钱收了，没去检查（存起来了）
            s.parents.relationShip = Math.min(100, s.parents.relationShip + 5);
            s.stress = Math.min(100, s.stress + 5);
            return { log: '你转了一万块，你爸说"好好好，这周末就去"。一个月后你打电话问检查结果，他支支吾吾。后来你妈告诉你，那钱他一分没动，存起来说"以后给孩子应急用"。你又气又心酸。', cost: 10000 };
          }
        },
      },
      {
        id: 'opt_busy_now',
        label: '最近太忙，等忙完这阵再说',
        description: '什么都不做，父母健康可能恶化',
        hint: '自欺欺人',
        hintColor: 'danger',
        effect: (s: GameState) => {
          s.parents.health = Math.max(0, s.parents.health - 8);
          s.parents.relationShip = Math.max(0, s.parents.relationShip - 10);
          s.stress = Math.min(100, s.stress + 4);
          return { log: '你说"下周一定"。但下周有下周的项目，下个月有下个月的deadline。你把这件事压在了心底最深处，不是不想，是不敢想。', cost: 0 };
        },
      },
    ],
  },

  // 8. 伴侣感情危机
  {
    id: 'family_marriage_crisis',
    title: '感情的裂缝',
    narrative: '起因不过是晚饭谁去买菜这种小事，但话赶话就吵了起来。这一次，伴侣摔了门进卧室，没有像以前那样过一会儿出来倒水道歉。冷战已经第七天了，你们像两条平行线在同一间屋子里走来走去。昨晚你翻到结婚那年的照片，TA笑得眼睛弯弯的，你想不起那种笑容是什么时候消失的。',
    ageRange: [30, 50],
    priority: 10,
    cooldown: 5,
    tag: 'marriage',
    conditions: (s: GameState) => s.isMarried && s.partner !== null && s.partner.datingStage === 'married' && s.partner.affection < 40 && !s.partner.hasDivorced && s.partner.marriedYear > 0 && (s.currentAge - s.partner.marriedYear) >= 3 && (s.stress > 70 || s.partner.affection < 35),
    options: [
      {
        id: 'opt_deep_talk',
        label: '我们坐下来好好谈谈吧',
        description: '不花钱，但成功率取决于信任值',
        hint: '真诚是最后的底牌',
        hintColor: 'positive',
        effect: (s: GameState) => {
          const partnerTrust = s.partner?.trust ?? 0;
          const successRate = partnerTrust > 60 ? 0.50 : 0.30;

          if (Math.random() < successRate) {
            // 深夜谈心成功
            if (s.partner) {
              s.partner.affection = Math.min(100, s.partner.affection + 12);
              s.partner.trust = Math.min(100, s.partner.trust + 8);
            }
            s.happiness = Math.min(100, s.happiness + 10);
            s.stress = Math.max(0, s.stress - 15);
            if (partnerTrust > 60) {
              return { log: '你倒了两杯热茶，端到卧室门口敲了敲门。一开始只是沉默，后来你先开口说了声"对不起"。那个晚上你们聊到凌晨三点，把这几年的委屈都说开了。你才发现对方心里也藏着很多没说出口的话。第二天早上，阳光照进来，你们第一次觉得这个家好像又暖了一点。', cost: 0 };
            } else {
              return { log: '你们试着聊了一次，慢慢地说了一些心里话，虽然有些尴尬，但至少算是迈出了一步。感情有所缓和，但离真正修复还有很长的路要走。', cost: 0 };
            }
          } else {
            // 谈心失败
            if (s.partner) s.partner.affection = Math.max(0, s.partner.affection - 5);
            s.stress = Math.min(100, s.stress + 8);
            return { log: '你们试着聊了一次，但说着说着又吵了起来。对方摔了杯子说"你以为道个歉就完了？"你把想说的话咽了回去，一个人去了阳台吹风。凌晨两点你回来，卧室的门反锁了。', cost: 0 };
          }
        },
      },
      {
        id: 'opt_counseling',
        label: '花钱去做婚姻咨询',
        description: '花费8000元，专业介入修复感情',
        hint: '尝试总比放弃强',
        hintColor: 'neutral',
        prerequisites: (s: GameState) => s.currentSavings >= 8000,
        disabledReason: '存款不够付咨询费',
        effect: (s: GameState) => {
          s.currentSavings -= 8000;
          s.stress = Math.min(100, s.stress + 3); // 去咨询本身需要勇气

          const partnerTrust = s.partner?.trust ?? 0;
          const partnerAffection = s.partner?.affection ?? 0;

          // 信任>50且affection>25时成功率较高
          let successRate = 0.30;
          if (partnerTrust > 50 && partnerAffection > 25) successRate = 0.55;

          if (Math.random() < successRate) {
            // 咨询有效
            if (s.partner) {
              s.partner.affection = Math.min(100, s.partner.affection + 18);
              s.partner.trust = Math.min(100, s.partner.trust + 12);
            }
            s.stress = Math.max(0, s.stress - 12);
            s.happiness = Math.min(100, s.happiness + 8);
            return { log: '你们坐在咨询室的沙发上，一开始都很尴尬。但慢慢地说开了之后，你们发现很多误解其实只是因为没有好好听对方说话。咨询师帮你们找到了沟通的模式，你们第一次意识到——原来对方一直在等自己先开口。回家的路上，伴侣第一次主动牵了你的手。', cost: 8000 };
          } else {
            // 咨询无效
            if (s.partner) {
              s.partner.affection = Math.max(0, s.partner.affection - 5);
              s.partner.trust = Math.max(0, s.partner.trust - 3);
            }
            s.stress = Math.min(100, s.stress + 5);
            return { log: '你们去了三次咨询，每次都在咨询室里吵得更凶。咨询师说"你们需要更多时间"，但你们都知道，有些裂缝不是聊天就能补上的。最后一次咨询结束后，你们在楼下走了很久，谁也没说话。八千块花完了，你们的问题一个都没解决。', cost: 8000 };
          }
        },
      },
      {
        id: 'opt_surprise',
        label: '策划一次旅行/约会，试试重燃火花',
        description: '花费15000元，效果看运气',
        hint: '用心但看运气',
        hintColor: 'neutral',
        prerequisites: (s: GameState) => s.currentSavings >= 15000,
        disabledReason: '存款不够策划浪漫',
        effect: (s: GameState) => {
          s.currentSavings -= 15000;
          const roll = Math.random();
          if (roll < 0.35) {
            // 完美旅行
            if (s.partner) {
              s.partner.affection = Math.min(100, s.partner.affection + 15);
              s.partner.trust = Math.min(100, s.partner.trust + 10);
            }
            s.happiness = Math.min(100, s.happiness + 12);
            s.stress = Math.max(0, s.stress - 10);
            return { log: '你订了一个海边的民宿。那天黄昏你们沿着沙滩走，浪花打在脚踝上凉凉的。她靠在你肩上说"我们好久没这样了"。你没说话，只是握紧了她的手。那一刻你觉得，也许这段婚姻还有救。', cost: 15000 };
          } else if (roll < 0.70) {
            // 旅行中又吵架了
            if (s.partner) s.partner.affection = Math.max(0, s.partner.affection - 8);
            s.stress = Math.min(100, s.stress + 10);
            return { log: '你们在景点门口吵了起来——导览地图该往左走还是往右走。这本来不是什么大事，但积攒了七天的情绪像决堤一样涌了出来。回程的高铁上一句话没说，旁边的人以为你们不认识。一万五花完了，你们的关系更差了。', cost: 15000 };
          } else {
            // 还行但没感觉
            if (s.partner) s.partner.affection = Math.min(100, s.partner.affection + 3);
            s.stress = Math.max(0, s.stress - 3);
            return { log: '旅行还不错，住的地方很干净，吃的也挺好。但你们之间就是少了点什么——那种心动的感觉没有回来。像两个合租的室友去度了个假，客气、礼貌，但不够亲密。', cost: 15000 };
          }
        },
      },
      {
        id: 'opt_let_go',
        label: '也许分开对我们都好',
        description: '感情归零，财产分割30%，开始离婚流程',
        hint: '结束也是一种开始',
        hintColor: 'danger',
        effect: (s: GameState) => {
          s.isMarried = false;
          if (s.partner) {
            s.partner.hasDivorced = true;
            s.partner.datingStage = 'divorced';
            s.partner.exName = s.partner.name;
            s.partner.affection = 0;
            s.partner.trust = 0;
            const splitCost = Math.min(s.currentSavings * 0.3, 50000);
            s.currentSavings -= Math.round(splitCost);
            s.stress = Math.min(100, s.stress + 10);
            s.happiness = Math.max(0, s.happiness - 18);

            // 如果有孩子，额外惩罚
            if (s.hasChild) {
              s.happiness = Math.max(0, s.happiness - 5);
              return { log: '你们坐在沙发上，第一次心平气和地谈了很久。"也许分开对我们都好。"这句话说出来的时候，你们都哭了。孩子在自己房间里画画，不知道这个家正在散掉。你想着以后每个周末才能见到TA，心里像被人挖走了一块。', cost: Math.round(splitCost) };
            }
            return { log: '你们坐在沙发上，第一次心平气和地谈了很久。"也许分开对我们都好。"这句话说出来的时候，你们都哭了。', cost: Math.round(splitCost) };
          }
          return { log: '你决定面对现实。', cost: 0 };
        },
      },
    ],
  },

  // ============================================================
  // D. 单身路线专属（1个）
  // ============================================================

  // 9. 孤独感危机（单身+年龄>=38）
  {
    id: 'single_loneliness',
    title: '深夜的空房间',
    narrative: '加班到十一点，钥匙拧开门的瞬间，屋里黑漆漆的，没人给你留灯。你换鞋的时候听见自己的回声，才意识到这个家太安静了。烧水壶开关"啪"地弹起来，把你吓了一跳。一个人的碗只洗一个，一个人的衣服晾不满一根杆。你坐在沙发上，忽然希望有个人能说说话——不一定是爱人，只要不是这种安静就好。',
    ageRange: [36, 55],
    priority: 8,
    cooldown: 8,
    tag: 'single_life',
    conditions: (s: GameState) => !s.isMarried && !s.partner && s.currentAge >= 35 && (s.happiness < 45 || s.stress > 60),
    options: [
      {
        id: 'opt_dating_app',
        label: '"下载交友软件，认真找对象"',
        description: '主动出击，四种随机结局',
        hint: '技术改变命运？',
        hintColor: 'positive',
        effect: (s: GameState) => {
          (s as any).socialActiveThisYear = true;
          const roll = Math.random();
          if (roll < 0.30) {
            // 匹配到不错的人
            const names = ['晓芸', '佳慧', '雨萱', '思琪', '浩然', '宇轩', '俊杰', '子涵', '欣妍', '志远'];
            const personalities: PartnerPersonality[] = ['温柔型', '事业型', '浪漫型', '节俭型', '独立型'];
            const traits = ['爱笑', '做饭好吃', '爱旅行', '运动达人', '猫奴', '文艺范'];
            s.partner = {
              name: names[Math.floor(Math.random() * names.length)],
              age: s.currentAge + Math.floor(Math.random() * 4) - 1,
              affection: 25 + Math.floor(Math.random() * 11),
              trust: 20 + Math.floor(Math.random() * 11),
              marriedYear: 0,
              hasDivorced: false,
              personality: personalities[Math.floor(Math.random() * personalities.length)],
              datingStage: 'crush',
              meetYear: s.currentAge,
              trait: traits[Math.floor(Math.random() * traits.length)],
              memories: [{ age: s.currentAge, event: '交友软件上认识的', emoji: '📱' }],
              crushFrom: 'app',
            };
            s.happiness = Math.min(100, s.happiness + 15);
            return { log: '你划了无数个 profile，终于和一个人聊了起来。第一次见面时你紧张得差点打翻咖啡杯，但对方笑着帮你擦了桌子。你们聊了三个小时，完全没注意时间。', cost: 0 };
          } else if (roll < 0.55) {
            // 聊了几个人都不合适
            s.stress = Math.min(100, s.stress + 5);
            return { log: '你认真填了资料，认真和每个人聊天。但聊了几个之后你发现，有的聊两句就没下文了，有的见了面完全不是照片上的样子。你叹了口气关掉了APP。', cost: 0 };
          } else if (roll < 0.75) {
            // 遇到骗子
            const loss = 5000 + Math.floor(Math.random() * 6) * 2000;
            s.currentSavings -= loss;
            s.happiness = Math.max(0, s.happiness - 15);
            s.stress = Math.min(100, s.stress + 18);
            return { log: `那个人太完美了——照片好看、收入高、每天早安晚安。直到TA说"投资这个稳赚不赔"的时候你才觉得不对劲。你损失了${loss}块钱。关掉APP的那一刻你想，还是一个人比较安全。`, cost: 0 };
          } else {
            // 没结果但迈出了第一步
            s.stress = Math.max(0, s.stress - 3);
            return { log: '你用了一个月，没遇到什么特别的人，但至少你迈出了这一步。你把APP卸载了，不是因为放弃，而是因为你想先把一个人过好再说。', cost: 0 };
          }
        },
      },
      {
        id: 'opt_adopt_pet',
        label: '"养一只猫/狗陪自己"',
        description: '年花费3000元，三种随机结局',
        hint: '毛茸茸的陪伴',
        hintColor: 'positive',
        effect: (s: GameState) => {
          s.annualBaseCost += 3000;
          const roll = Math.random();
          if (roll < 0.70) {
            // 宠物成了最好的陪伴
            s.happiness = Math.min(100, s.happiness + 15);
            s.stress = Math.max(0, s.stress - 10);
            return { log: '你去了救助站，一只橘猫主动蹭了你的裤腿。你把它抱回家的那天晚上，它窝在你腿上打呼噜。你忽然觉得，家里好像没那么空了。', cost: 0 };
          } else if (roll < 0.90) {
            // 宠物生病花钱
            s.currentSavings -= 5000;
            s.stress = Math.min(100, s.stress + 8);
            s.happiness = Math.min(100, s.happiness + 5);
            return { log: '猫突然不吃东西，你抱着它去了宠物医院，花了不少钱。医生说没事，吃点药就好。你抱着它回家的时候它在你怀里蹭了蹭。你心想，花这点钱也值了。', cost: 0 };
          } else {
            // 宠物跑了/送人了
            s.happiness = Math.max(0, s.happiness - 10);
            return { log: '你发现自己实在没时间照顾它——加班、出差、应酬。最后你把它送给了朋友。朋友发来它在新家玩耍的照片，你看了好几遍，然后把照片存进了收藏夹。', cost: 0 };
          }
        },
      },
      {
        id: 'opt_join_club',
        label: '"报个兴趣班/参加社团"',
        description: '花费5000元，社交拓展，四种随机结局',
        hint: '走出去',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.currentSavings -= 5000;
          (s as any).socialActiveThisYear = true;
          const roll = Math.random();
          if (roll < 0.35) {
            // 认识了一群有趣的人
            s.happiness = Math.min(100, s.happiness + 12);
            s.stress = Math.max(0, s.stress - 8);
            return { log: '你报了一个周末摄影班。拍日出的时候遇到了一群同样早起的家伙，你们聊了很久。虽然只是泛泛之交，但至少每个周末都有了期待。', cost: 0 };
          } else if (roll < 0.65) {
            // 遇到合得来的朋友
            s.happiness = Math.min(100, s.happiness + 8);
            s.stress = Math.max(0, s.stress - 5);
            return { log: '在烘焙课上你和一个同样手残的人笑成一团——你们做的蛋糕歪歪扭扭的。后来你们开始每周约着一起吃早午饭，聊工作吐槽老板。有个人能说说话，真好。', cost: 0 };
          } else if (roll < 0.85) {
            // 没意思不去钱了白花
            s.happiness = Math.max(0, s.happiness - 3);
            return { log: '你去了三次就再也没去。课上的内容和想象的不一样，周围的人也都各忙各的。那5000块钱就像交了一笔"孤独税"。', cost: 0 };
          } else {
            // 在社团遇到有好感的人
            const names = ['晓芸', '佳慧', '雨萱', '思琪', '浩然', '宇轩', '俊杰', '子涵', '欣妍', '志远'];
            const personalities: PartnerPersonality[] = ['温柔型', '事业型', '浪漫型', '节俭型', '独立型'];
            const traits = ['爱笑', '运动达人', '文艺范', '做饭好吃', '安静但有趣'];
            s.partner = {
              name: names[Math.floor(Math.random() * names.length)],
              age: s.currentAge + Math.floor(Math.random() * 4) - 1,
              affection: 20 + Math.floor(Math.random() * 11),
              trust: 15 + Math.floor(Math.random() * 11),
              marriedYear: 0,
              hasDivorced: false,
              personality: personalities[Math.floor(Math.random() * personalities.length)],
              datingStage: 'crush',
              meetYear: s.currentAge,
              trait: traits[Math.floor(Math.random() * traits.length)],
              memories: [{ age: s.currentAge, event: '社团活动认识的', emoji: '🎨' }],
              crushFrom: 'friend',
            };
            s.happiness = Math.min(100, s.happiness + 10);
            return { log: '在读书会上你们因为一本小说争了起来，争完了互相笑了一下。后来你们开始单独约着喝咖啡。你不确定这算不算心动，但至少出门前照了照镜子。', cost: 0 };
          }
        },
      },
      {
        id: 'opt_accept_loneliness',
        label: '"算了，习惯了"',
        description: '接受孤独，幸福变化取决于当前状态',
        hint: '与自己和解',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          if (s.happiness > 60) {
            s.happiness = Math.min(100, s.happiness + 5);
            s.stress = Math.max(0, s.stress - 10);
            return { log: '你躺在床上想了想，其实一个人也没什么不好。你可以按自己的节奏来，不用迁就任何人。窗外的月光洒进来，你忽然觉得，安静也是一种热闹。', cost: 0 };
          }
          s.happiness = Math.max(0, s.happiness - 8);
          s.stress = Math.min(100, s.stress + 5);
          return { log: '你翻了个身，把被子蒙过头顶。你告诉自己"算了"。但"习惯了"和"接受了"是两回事。这一夜你睡得不太踏实。', cost: 0 };
        },
      },
    ],
  },

  // ============================================================
  // E. 生活彩蛋类（2个）
  // ============================================================

  // 突然继承了一笔钱（父母在世+存款<20万，每局仅一次）
  {
    id: 'life_inheritance',
    title: '一笔意外之财',
    narrative: '一个陌生的电话打破了平静——远房的二姑奶奶去世了，膝下无子女，律师说按遗嘱，你分到一笔遗产。金额不算惊天动地，但对你现在来说，绝对是一根救命稻草。你挂了电话愣了好久，说不上是高兴还是难过。那个只在小时候过年见过的老人，最后一次想起你，竟然是用这种方式。',
    ageRange: [28, 50],
    priority: 7,
    cooldown: 999,
    tag: 'life_inheritance',
    conditions: (s: GameState) => s.parents.isAlive && s.currentSavings < 200000,
    options: [
      {
        id: 'opt_save_inheritance',
        label: '存起来理财',
        description: '稳健增值，未雨绸缪',
        hint: '存款+100000，信念+3',
        hintColor: 'positive',
        effect: (s: GameState) => {
          s.currentSavings += 100000;
          s.pathFaith = Math.min(100, s.pathFaith + 3);
          return { log: `第${s.currentAge}岁，你把这笔钱存进了定期，顺手配了点指数基金。你看着银行卡余额跳动的那串数字，长长舒了口气——这段时间紧巴巴的日子，终于能喘口气了。你没告诉任何人，怕借钱的亲戚找上门。`, cost: 0 };
        },
      },
      {
        id: 'opt_improve_life',
        label: '还清贷款，改善生活',
        description: '把钱花在刀刃上，让日子松快点',
        hint: '存款+50000，幸福+15，压力-10',
        hintColor: 'positive',
        effect: (s: GameState) => {
          s.currentSavings += 50000;
          s.happiness = Math.min(100, s.happiness + 15);
          s.stress = Math.max(0, s.stress - 10);
          return { log: `第${s.currentAge}岁，你用这笔钱还清了信用卡和消费贷，给自己换了台新手机，还给爸妈寄了个大红包。剩下的存了起来。钱花出去的那一刻你有点心疼，但看着清爽的账单，整个人都轻快了。原来无债一身轻，是这种感觉。`, cost: 0 };
        },
      },
      {
        id: 'opt_invest_inheritance',
        label: '拿去投资/创业，搏一把',
        description: '50%翻倍，50%亏一半',
        hint: '高风险高回报，可能血本无归',
        hintColor: 'danger',
        effect: (s: GameState) => {
          if (Math.random() < 0.5) {
            // 翻倍
            s.currentSavings += 200000;
            s.happiness = Math.min(100, s.happiness + 12);
            s.pathFaith = Math.min(100, s.pathFaith + 8);
            return { log: `第${s.currentAge}岁，你把这笔钱投了进去。前几个月天天盯盘，半夜惊醒都要看一眼。半年后，账户里的数字翻了倍。你盯着屏幕笑了很久，然后默默关掉——你知道这是运气，不是本事。但这笔钱，确实改变了你的节奏。`, cost: 0 };
          } else {
            // 亏损一半
            s.currentSavings += 50000;
            s.happiness = Math.max(0, s.happiness - 10);
            s.stress = Math.min(100, s.stress + 8);
            return { log: `第${s.currentAge}岁，你把这笔钱投了进去，想着搏一把单车变摩托。三个月后行情急转直下，你眼睁睁看着账户缩水一半。割肉离场那天，你坐在便利店门口喝了罐啤酒。你没告诉任何人，只在心里默默记下：意外之财，原来真的留不住。`, cost: 0 };
          }
        },
      },
    ],
  },

  // 那通凌晨的电话（有朋友+25岁以上，冷却8年）
  {
    id: 'life_midnight_call',
    title: '那通凌晨的电话',
    narrative: '凌晨两点，手机震动把你从梦里拽出来。屏幕上是大学最铁的兄弟/闺蜜的名字。你接起来，那头沉默了几秒，然后你听到一声压抑的抽泣。"我被裁了"／"我们分手了"／"我爸进ICU了"——声音断断续续的，像被人掐住了喉咙。窗外黑漆漆的，你坐起身，握着发烫的手机，忽然意识到：有些时刻，你没法装睡。',
    ageRange: [25, 40],
    priority: 6,
    cooldown: 8,
    tag: 'life_midnight_call',
    conditions: (s: GameState) => s.friends.length > 0 && s.currentAge >= 25,
    options: [
      {
        id: 'opt_rush_over',
        label: '立刻赶过去',
        description: '打车／买机票，现在就到TA身边',
        hint: '压力+5，幸福+8，朋友关系+20，存款-2000',
        hintColor: 'positive',
        effect: (s: GameState) => {
          s.currentSavings -= 2000;
          s.stress = Math.min(100, s.stress + 5);
          s.happiness = Math.min(100, s.happiness + 8);
          if (s.friends.length > 0) {
            s.friends[0].relation = Math.min(100, s.friends[0].relation + 20);
          }
          return { log: `第${s.currentAge}岁，你套上外套就出了门，深夜的出租车在空荡荡的高架桥上飞驰。你赶到TA出租屋楼下时，TA正蹲在路边抽烟。你们什么都没说，你坐下来也点了根。天亮的时候，TA说"谢谢你来了"。你说"废话"。有些友情，不需要语言，凌晨两点的到场就是全部。`, cost: 2000 };
        },
      },
      {
        id: 'opt_phone_all_night',
        label: '电话里陪TA聊到天亮',
        description: '人过不去，但声音可以',
        hint: '压力+3，幸福+5，朋友关系+10',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 3);
          s.happiness = Math.min(100, s.happiness + 5);
          if (s.friends.length > 0) {
            s.friends[0].relation = Math.min(100, s.friends[0].relation + 10);
          }
          return { log: `第${s.currentAge}岁，你靠在床头，电话那头TA絮絮叨叨说了三个小时。你多半在听，偶尔插一句"我在"。挂电话时天已经蒙蒙亮，TA说"好多了，你睡吧"。你放下手机，虽然没睡够，但心里踏实——能为一个人熬夜，说明你还在乎，也还被人在乎。`, cost: 0 };
        },
      },
      {
        id: 'opt_tomorrow',
        label: '明天再说吧',
        description: '太晚了，明天白天再联系',
        hint: '朋友关系-15，幸福-3',
        hintColor: 'danger',
        effect: (s: GameState) => {
          s.happiness = Math.max(0, s.happiness - 3);
          if (s.friends.length > 0) {
            s.friends[0].relation = Math.max(0, s.friends[0].relation - 15);
          }
          return { log: `第${s.currentAge}岁，你盯着震动的手机犹豫了几秒，还是按掉了。你告诉自己"明天再说"。第二天你发消息过去，对方只回了个"嗯"。之后你们聊天的频率肉眼可见地变少了。有些距离，不是空间拉开的，是那些"明天再说"累积出来的。`, cost: 0 };
        },
      },
    ],
  },

  // ============== 引人深思的社交突发事件 ==============

  // 朋友结婚：红包压力+同龄人进度焦虑
  {
    id: 'friend_marriage',
    title: '【红色炸弹·朋友大婚】',
    narrative: '大学室友发来电子请帖，婚纱照里他笑得很灿烂。你算了算——这个月已经是第三张了。红包起步价两千，关系好的要五千到一万。你看着银行卡余额，又看了看请帖上"携眷出席"四个字——你连对象都没有。\n\n更难受的是，你记得毕业时你们站在同一起跑线上。现在他买房结婚生子，按部就班。而你还在赌一个不确定的未来。',
    ageRange: [25, 38],
    priority: 5,
    cooldown: 999,
    tag: 'friend_married',
    conditions: (s) => s.friends.length > 0,
    options: [
      {
        id: 'big_gift',
        label: '包个大红包去',
        description: '5000块，心疼但面子要撑住',
        hint: '存款-5000，幸福+5',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.currentSavings -= 5000;
          s.happiness = Math.min(100, s.happiness + 5);
          return { log: `第${s.currentAge}岁，你包了五千块的红包去参加婚礼。婚礼很排场，你坐在一桌老同学中间，听他们讨论房贷和学区房。你笑着敬酒，但心里有点不是滋味——不是嫉妒，是一种说不上来的孤独。回家的地铁上你想：每个人都有自己的时区。`, cost: 5000 };
        },
      },
      {
        id: 'normal_gift',
        label: '随大流包两千',
        description: '不丢面子也不伤钱包',
        hint: '存款-2000',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.currentSavings -= 2000;
          return { log: `第${s.currentAge}岁，你随了两千的红包。婚礼上你和老同学寒暄，交换了"改天聚聚"的客套话，但你们都知道不会再聚了。有些人，注定只能陪你走一段路。`, cost: 2000 };
        },
      },
      {
        id: 'skip',
        label: '借口不去',
        description: '省钱但可能伤感情',
        hint: '压力+3，关系可能受损',
        hintColor: 'danger',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 3);
          if (s.friends.length > 0) {
            const f = s.friends[0];
            f.relation = Math.max(0, f.relation - 15);
          }
          return { log: `第${s.currentAge}岁，你借口出差没去婚礼，只转了500块。晚上刷动态圈看到婚礼照片，你有点愧疚，但很快被工作消息冲淡了。成年人的友情，有时候就是这么渐行渐远。`, cost: 500 };
        },
      },
    ],
  },

  // 朋友借钱：借还是不借？
  {
    id: 'friend_borrow_money',
    title: '【老朋友开口·借钱救急】',
    narrative: '一个多年没联系的老朋友突然打来电话，语气里全是窘迫。他母亲住院了，手术费还差五万，借遍了亲戚实在没办法了才找你。\n\n你记得上学时他帮你打过架、替你考过到、你失恋时陪你喝了一整宿。但你也记得那些"借了钱就消失"的社会新闻。五万，是你全部积蓄的一部分。借了，可能拿不回来；不借，可能永远失去这个朋友，也永远过不了自己这关。',
    ageRange: [26, 50],
    priority: 6,
    cooldown: 999,
    tag: 'friend_borrow',
    conditions: (s) => s.currentSavings >= 30000 && s.friends.length > 0,
    options: [
      {
        id: 'lend_all',
        label: '借他五万',
        description: '救命要紧，朋友就该雪中送炭',
        hint: '存款-50000，压力-10，55%概率还回来',
        hintColor: 'danger',
        effect: (s: GameState) => {
          s.currentSavings -= 50000;
          s.stress = Math.max(0, s.stress - 10);
          if (Math.random() < 0.55) {
            // 还了
            (s as any).pendingDebtReturn = { amount: 55000, yearsLater: 3 };
            s.happiness = Math.min(100, s.happiness + 10);
            return { log: `第${s.currentAge}岁，你没多想就转了五万给他。他在电话里哭了。你挂了电话后有点慌——那是你攒了好几年的钱。但你不后悔。三年后他不仅还了钱，还多给了五千利息，带着土特产来你家道谢。那天你们喝了很多酒，像回到了二十岁。`, cost: 50000 };
          } else {
            // 没还
            s.happiness = Math.max(0, s.happiness - 15);
            s.stress = Math.min(100, s.stress + 10);
            return { log: `第${s.currentAge}岁，你转了五万给他。他千恩万谢，说半年后一定还。但半年后他没提，一年后他开始不回消息，两年后你听说他去了外地，换了手机号。钱没要回来，朋友也没了。你有时候会想：是我做错了吗？`, cost: 50000 };
          }
        },
      },
      {
        id: 'lend_part',
        label: '借两万，表心意',
        description: '能力范围内帮一把，不指望还',
        hint: '存款-20000，压力-3',
        hintColor: 'danger',
        effect: (s: GameState) => {
          s.currentSavings -= 20000;
          s.stress = Math.max(0, s.stress - 3);
          if (Math.random() < 0.7) {
            (s as any).pendingDebtReturn = { amount: 20000, yearsLater: 4 };
          }
          return { log: `第${s.currentAge}岁，你委婉地说自己也在攒钱买房，只能凑两万。他连声道谢。你不知道这钱能不能回来，但两万块买个心安，值。你想起一句话："不要借朋友钱，也不要欠朋友钱。"但真到了那个份上，哪有那么容易。`, cost: 20000 };
        },
      },
      {
        id: 'refuse',
        label: '婉拒，自己也难',
        description: '如实说自己也在攒钱',
        hint: '幸福-8，压力+5',
        hintColor: 'danger',
        effect: (s: GameState) => {
          s.happiness = Math.max(0, s.happiness - 8);
          s.stress = Math.min(100, s.stress + 5);
          if (s.friends.length > 0) {
            const f = s.friends[0];
            f.relation = Math.max(0, f.relation - 25);
          }
          return { log: `第${s.currentAge}岁，你沉默了很久，说"兄弟我也在攒钱买房，实在拿不出那么多"。电话那头沉默了几秒，说"没事，理解"。挂了电话你坐了很久。你不知道自己做得对不对，但那八万确实是你赌未来的筹码。成年人的世界，没有容易的选择。`, cost: 0 };
        },
      },
    ],
  },

  // 朋友拉你创业
  {
    id: 'friend_startup_invite',
    title: '【兄弟创业·拉你入伙】',
    narrative: '你的好朋友辞了大厂的工作，拉了个团队准备创业。他激情澎湃地给你讲了三个小时的商业计划，说"就差你这个技术合伙人了"。\n\n你知道他是认真的——他已经把房子抵押了。但你也知道创业成功率不到5%。一边是稳定的工作和清晰的上升路径，一边是兄弟情义+财务自由的可能。输了，可能连朋友都没得做；赢了，可能35岁就退休。他看着你的眼睛说："我不逼你，但这次机会错过了就没了。"',
    ageRange: [27, 38],
    priority: 7,
    cooldown: 999,
    tag: 'friend_startup',
    conditions: (s) => !s.retirementPath && !s.isUnemployed && s.friends.length > 0 && s.currentSavings >= 30000,
    options: [
      {
        id: 'join_startup',
        label: '辞职All in入伙',
        description: '赌一把大的，兄弟齐心其利断金',
        hint: '存款-3万入股，薪资减半，压力+20，有暴富可能，也有血本无归风险',
        hintColor: 'danger',
        effect: (s: GameState) => {
          s.currentSavings -= 30000;
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 0.5);
          s.stress = Math.min(100, s.stress + 20);
          if (Math.random() < 0.2) {
            // 20%概率大成功
            (s as any).startupSuccess = true;
            return { log: `第${s.currentAge}岁，你辞职了。入职第一天在破旧的共享办公室里，你看着四个合伙人的笑脸，心想"这就是我赌上一切的选择"。三年后公司被收购，你分到了八百万。那天你请所有人喝了最贵的酒，醉得不省人事。你赌赢了。但你偶尔也会想，那些失败的日夜，那些和老婆吵架摔门而出的凌晨，那些怀疑自己是不是疯了的时刻——如果结果不一样，你还能站在这里说"不后悔"吗？你不知道。`, cost: 30000 };
          } else if (Math.random() < 0.4) {
            // 32%小成，被收购但没暴富
            (s as any).startupModerate = true;
            return { log: `第${s.currentAge}岁，你辞职了。创业很苦，但你们活了下来。第五年公司被并购，你拿到了八十万。不够财务自由，但够付个首付。庆功宴上你喝了很多，兄弟拍着你肩膀说"值了"。你笑着点头，但回家的路上你算了一笔账——这些年降薪的损失、加班到凌晨的健康代价、差点离婚的争吵，八十万好像也没那么多。你和兄弟还是朋友，但你们再也没提过当年改变世界的大话。`, cost: 30000 };
          } else {
            // 48%失败
            s.isUnemployed = true;
            s.preUnemployedSalary = s.currentMonthlySalary * 2;
            s.unemployedTurns = 0;
            s.currentSavings = Math.max(0, s.currentSavings - 50000); // 还欠了债
            s.happiness = Math.max(0, s.happiness - 25);
            s.stress = Math.min(100, s.stress + 25);
            if (s.partner) {
              s.partner.affection = Math.max(0, s.partner.affection - 20);
              s.partner.trust = Math.max(0, s.partner.trust - 15);
            }
            if (s.friends.length > 0) {
              s.friends[0].relation = Math.max(0, s.friends[0].relation - 40);
            }
            const failLogs = [
              `第${s.currentAge}岁，你辞职了。你们烧完了投资人的钱，烧完了自己的积蓄，最后在一个雨夜解散了团队。散伙饭上没人说话，兄弟喝多了拍桌子说"都怪你当初那个技术选型"，你摔了杯子差点打起来。你们再也没联系过。35岁，失业，存款归零还欠了五万信用卡债。老婆跟你冷战了三个月，说"我当初就说不让你去"。你投出去的简历石沉大海，面试官问你"这几年怎么空窗了"，你张了张嘴不知道怎么解释。深夜你坐在阳台上抽烟，想如果当初没辞职，现在应该已经升总监了吧。后悔两个字你不敢说出口，但它每天都在咬你。`,
              `第${s.currentAge}岁，你辞职了。公司撑了两年还是倒了。最后那半年你没拿过工资，连社保都是自己交的。散伙那天兄弟红着眼说"对不起"，你说"没事"，但其实你心里知道——你们回不去了。你不仅丢了工作，还丢了一个认识十五年的朋友。重新找工作的时候你才发现，原来的同事都已经成了你的面试官。他们客客气气地叫你"X总"，但你看得出来他们眼神里的意思：那个赌输了的人。回家面对伴侣的眼神，你第一次觉得自己像个失败者。`,
            ];
            return { log: failLogs[Math.floor(Math.random() * failLogs.length)], cost: 80000 };
          }
        },
      },
      {
        id: 'invest_small',
        label: '投一笔小钱入股，但不辞职',
        description: '出点钱意思一下，主业不丢，赚了有份亏了有限',
        hint: '存款-1万，压力+5，小概率分红，朋友关系+5',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.currentSavings -= 10000;
          s.stress = Math.min(100, s.stress + 5);
          if (s.friends.length > 0) {
            s.friends[0].relation = Math.min(100, s.friends[0].relation + 5);
          }
          const roll = Math.random();
          if (roll < 0.2) {
            // 小成，拿到分红
            s.currentSavings += 50000;
            s.happiness = Math.min(100, s.happiness + 8);
            return { log: `第${s.currentAge}岁，你投了一万块入股，但没辞职，白天上班晚上偶尔帮忙出出主意。三年后公司居然活下来了，还拿到了B轮融资。你那一万块变成了五万，不算多但也翻了几倍。兄弟说"当初要是你All in就好了"，你笑了笑没接话。你知道自己不是赌徒的料，小赚即安，也挺好的。`, cost: 10000 };
          } else if (roll < 0.5) {
            // 不死不活，没亏没赚
            s.happiness = Math.max(0, s.happiness - 3);
            return { log: `第${s.currentAge}岁，你投了一万块，没辞职。公司活得不好不坏，你的钱既没翻倍也没亏光。每次兄弟找你吐槽业务你都听着，但你心里清楚——你只是个小股东，说话不算数。有时候你庆幸自己没跳进去，有时候又觉得自己是不是太保守了。成年人的世界，很多选择没有输赢，只有心安不安。`, cost: 10000 };
          } else {
            // 亏了，但不伤筋动骨
            s.happiness = Math.max(0, s.happiness - 8);
            s.stress = Math.min(100, s.stress + 5);
            if (s.friends.length > 0) {
              s.friends[0].relation = Math.max(0, s.friends[0].relation - 10);
            }
            return { log: `第${s.currentAge}岁，你投了一万块。公司撑了一年半还是倒了，你的钱打了水漂。兄弟很愧疚，说"等我翻身一定还你"，你说算了。一万块不多不少，心疼了一阵子但不至于伤筋动骨。只是偶尔喝醉酒你会想：如果当初All in了，会不会是不一样的结局？你摇摇头——这种如果没有意义。`, cost: 10000 };
          }
        },
      },
      {
        id: 'part_time_help',
        label: '兼职帮忙，不出钱',
        description: '留条后路，业余时间帮他干活，不投钱',
        hint: '压力+10，副业收入+，不影响主业',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 10);
          s.passiveIncome += 10000;
          return { log: `第${s.currentAge}岁，你没辞职也没投钱，但下班后和周末都在帮他。很累，经常到凌晨两点，第二天还要爬起来上班。你给自己留了后路，但你也知道——如果成了，你不会是最大的受益者，你只是个"帮忙的朋友"；如果败了，你至少还有工作，也没亏什么钱。兄弟有时候看你的眼神有点复杂，你假装没看见。成年人的世界，不是非黑即白，但也不是谁都能心安理得地灰着。`, cost: 0 };
        },
      },
      {
        id: 'refuse_startup',
        label: '婉拒，祝他好运',
        description: '你赌不起，稳定最重要',
        hint: '压力不变，朋友关系-10',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          if (s.friends.length > 0) {
            s.friends[0].relation = Math.max(0, s.friends[0].relation - 10);
          }
          return { log: `第${s.currentAge}岁，你说"我这份工作也挺忙的，房贷车贷也压着，就不加入了，但需要帮忙随时说"。他有点失望，但没勉强，拍了拍你肩膀说"理解"。后来他偶尔会在动态圈晒公司的进展，你每次都点赞，但心里有点复杂——如果当初答应了，现在会怎样？你永远不会知道了。又过了两年你听说他公司倒了，你犹豫了很久还是没敢打电话问。有些选择的代价，是你永远不知道自己避开了什么，又错过了什么。`, cost: 0 };
        },
      },
    ],
  },

  // 父母重病
  {
    id: 'parent_illness',
    title: '【父母重病·ICU抉择】',
    narrative: '凌晨三点医院打来电话——父亲突发脑溢血，正在抢救。你赶到医院时，医生在等你签字：手术有风险，费用预计二十万起步，术后可能半身不遂需要长期照顾，也有可能人财两空。\n\n你站在ICU门口，看着"手术中"的红灯。二十万，是你全部积蓄的一半多。医生问你："用进口药还是国产药？进口的贵一倍但效果好一些。"旁边一个家属小声说了句"我们当初也是选了最好的，结果……"没说下去。你妈在旁边哭得说不出话。你突然意识到——你和死亡之间，只隔着父母。而你现在要替他们做决定。',
    ageRange: [28, 55],
    priority: 9,
    cooldown: 999,
    tag: 'parent_critical',
    conditions: (s) => s.parents.isAlive,
    options: [
      {
        id: 'best_treatment',
        label: '用最好的药，请护工',
        description: '钱没了可以再赚，爸只有一个',
        hint: '存款-8万，压力+20，父母健康↑，关系↑',
        hintColor: 'danger',
        effect: (s: GameState) => {
          const cost = Math.min(s.currentSavings, 80000);
          s.currentSavings -= cost;
          s.stress = Math.min(100, s.stress + 20);
          s.parents.health = Math.min(100, s.parents.health + 20);
          s.parents.relationShip = Math.min(100, s.parents.relationShip + 25);
          s.happiness = Math.max(0, s.happiness - 5);
          if (Math.random() < 0.6) {
            return { log: `第${s.currentAge}岁，你在手术同意书上签了字，选了最贵的治疗方案。手术很成功，你爸虽然身体不如从前，半边手脚不太利索，但至少还能陪你说说话。你请了长假照顾他，每天给他擦身喂饭，像小时候他照顾你一样。钱花了很多，卡里空了一大截，但你不后悔——至少你试过了。`, cost: cost };
          } else {
            s.parents.isAlive = false;
            s.parents.health = 0;
            s.happiness = Math.max(0, s.happiness - 22);
            s.stress = Math.min(100, s.stress + 15);
            return { log: `第${s.currentAge}岁，你选了最好的治疗方案，花光了大半积蓄，但还是没能留住他。葬礼那天你没哭，直到回到家看到他常坐的沙发空了、桌上还放着没喝完的茶杯，才突然崩溃。你花了钱，尽了力，可是结果什么都没改变。子欲养而亲不待——这句话你以前觉得是套话，现在知道是真话。钱可以再赚，但人没了就是没了。`, cost: cost };
          }
        },
      },
      {
        id: 'standard_treatment',
        label: '保守治疗，稳定后接回家',
        description: '不做过度抢救，在家人陪伴中走完最后一程',
        hint: '存款-3万，压力+12，父母半年到一年后离世',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          const cost = Math.min(s.currentSavings, 30000);
          s.currentSavings -= cost;
          s.stress = Math.min(100, s.stress + 12);
          s.parents.relationShip = Math.min(100, s.parents.relationShip + 15);
          s.parents.health = Math.max(0, s.parents.health - 30);
          // 标记：父母进入临终关怀期，将在1年内离世
          (s as any).parentHospiceCare = true;
          if (Math.random() < 0.5) {
            s.happiness = Math.max(0, s.happiness - 8);
            return { log: `第${s.currentAge}岁，你选了保守治疗。急性期过后你把父亲接回了家，买了护理床，学着换胃管、翻身拍背。他有时清醒有时糊涂，清醒的时候会拉着你的手说"拖累你了"。你说不出话，只是摇头。八个月后的一个清晨，他在睡梦中走了，很安静。你有时候会想，如果当初进ICU做创伤性抢救，会不会多撑一些日子？但你看着他最后那段时间没有浑身插满管子，又觉得至少他走得没那么痛苦。这个选择是对是错，你大概要想很多年。`, cost: cost };
          } else {
            s.happiness = Math.max(0, s.happiness - 12);
            return { log: `第${s.currentAge}岁，你选了保守治疗，把父亲接回了家。亲戚们在背后议论你"舍不得钱""不孝"，你妈也偷偷哭过几次。你请了护工白天照看，晚上自己守着。他又撑了将近一年，走的时候你在加班，接到电话赶回去已经来不及了。你跪在床边，握着他已经凉了的手，心里说不清是什么滋味——你让他在家中走的，但你甚至没赶上最后一面。有些亲戚到现在都不跟你说话。`, cost: cost };
          }
        },
      },
      {
        id: 'give_up_treatment',
        label: '放弃有创抢救，让他走',
        description: '医生说希望渺茫，你签了拒绝创伤性抢救的同意书',
        hint: '存款保住，父母离世，幸福-25，压力+25，终身遗憾',
        hintColor: 'negative',
        effect: (s: GameState) => {
          s.parents.isAlive = false;
          s.parents.health = 0;
          s.happiness = Math.max(0, s.happiness - 25);
          s.stress = Math.min(100, s.stress + 25);
          s.parents.relationShip = Math.max(0, s.parents.relationShip - 10); // 你妈可能无法原谅你
          (s as any).parentGaveUpTreatment = true;
          const roll = Math.random();
          if (roll < 0.4) {
            return { log: `第${s.currentAge}岁，医生找你谈话，说即使抢救过来也大概率是植物人，后续费用是个无底洞。你在ICU外站了很久，最后签了"拒绝有创抢救"的同意书。你妈当场扇了你一巴掌，骂你"不孝"。拔管那天你没进去，在走廊的椅子上坐了一整夜。之后很多年，你偶尔会梦到那个晚上，梦到那支笔落在纸上的重量。你告诉自己这是理性的选择，是让他少受点罪，但有些深夜你还是会问自己——你到底是舍不得他受罪，还是舍不得钱？这个问题你不敢深想。`, cost: 0 };
          } else if (roll < 0.7) {
            return { log: `第${s.currentAge}岁，你签了字，放弃了创伤性抢救。你爸走的时候你在旁边，监护仪的声音从急促变成一条直线。你妈全程没跟你说话，之后很长一段时间她都住在你姐家。你没有花掉积蓄，生活没有被拖垮，同事们甚至不知道你经历了什么。但每次路过医院、每次看到别人父子吃饭、每次清明扫墓站在墓碑前，你都会想起那个签字的下午。你做了一个"正确"的决定吗？没有人能告诉你。你只是知道，那个签名会跟你一辈子。`, cost: 0 };
          } else {
            return { log: `第${s.currentAge}岁，你签了放弃抢救的同意书。葬礼上来了很多亲戚，有人夸你"想得开""不让老人遭罪"，也有人在背后指指点点说你"心狠"。你都听着，没反驳。之后的日子照常过，你照常上班、吃饭、睡觉。存款没动，生活没塌。但有一次过年，你妈看着空了的座位忽然说了一句"要是当初治了呢"，你放下筷子走到阳台，点了根烟——你戒了五年的烟，那天复吸了。有些决定没有对错，只有后果。`, cost: 0 };
          }
        },
      },
    ],
  },

  // 昔日好友差距拉大
  {
    id: 'friend_gap',
    title: '【同学聚会·阶层落差】',
    narrative: '毕业十周年同学聚会，你本来不想去，但被硬拉了去。当年睡你上铺的兄弟现在是某公司总监，开着宝马来的；当年成绩最差的那个做直播赚了几千万；当年和你一起实习的女生嫁了个有钱人，全职太太环游世界。\n\n你坐在角落里，算着自己还多少年才能攒够退休的钱。有人问你"现在混得怎么样"，你笑着说"还行还行"。那顿饭你没怎么吃，一直在想：大家明明是同一起点，怎么十年后差距这么大？',
    ageRange: [31, 40],
    priority: 4,
    cooldown: 999,
    tag: 'class_reunion_gap',
    conditions: (s) => s.friends.length > 0,
    options: [
      {
        id: 'motivated',
        label: '化落差为动力',
        description: '他们能做到的我也能',
        hint: '压力+8，信念+10',
        hintColor: 'positive',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 8);
          s.pathFaith = Math.min(100, s.pathFaith + 10);
          return { log: `第${s.currentAge}岁，同学聚会回来你失眠了一整夜。但第二天你起得比平时更早，打开电脑继续做你该做的事。你知道每个人的时区不同，别人的成功不代表你的失败。你有你的路，你有你的节奏。`, cost: 800 };
        },
      },
      {
        id: 'depressed',
        label: '难受，怀疑人生',
        description: '觉得自己很失败',
        hint: '幸福-15，压力+10，信念-8',
        hintColor: 'danger',
        effect: (s: GameState) => {
          s.happiness = Math.max(0, s.happiness - 15);
          s.stress = Math.min(100, s.stress + 10);
          s.pathFaith = Math.max(0, s.pathFaith - 8);
          return { log: `第${s.currentAge}岁，聚会回来你把自己关在房间里。你开始怀疑自己选的路是不是错了，怀疑努力有没有意义，怀疑是不是就这样平凡一辈子。这种自我怀疑持续了好几天，但生活不会停下来等你调整好——下周还要交房租。`, cost: 800 };
        },
      },
      {
        id: 'indifferent',
        label: '一笑置之',
        description: '如人饮水冷暖自知',
        hint: '幸福+3',
        hintColor: 'positive',
        effect: (s: GameState) => {
          s.happiness = Math.min(100, s.happiness + 3);
          return { log: `第${s.currentAge}岁，你笑着听大家吹牛，散场后没人知道你心里在想什么。你知道那个开宝马的正在闹离婚，那个做直播的每天睡四小时，那个嫁有钱人的在看心理医生。每个人都在展示自己最好的一面。你回到自己的小出租屋，煮了碗面，觉得这样也挺好。`, cost: 800 };
        },
      },
    ],
  },

  // ============== 6条路径专属十字路口事件 ==============
  ...PATH_CROSSROADS,
];

// ========== 检测当前状态是否触发了十字路口 ==========
export function detectCrossroad(state: GameState, firedTags: Map<string, number>): CrossroadEvent | null {
  // 先遍历所有事件，筛选符合条件的（需在全局冷却检查前计算，以便豁免高优先级路径专属十字路口）
  const eligible = CROSSROAD_EVENTS.filter(evt => {
    // 年龄范围
    if (state.currentAge < evt.ageRange[0] || state.currentAge > evt.ageRange[1]) return false;
    // 条件
    if (!evt.conditions(state)) return false;
    // 同tag冷却检查
    const lastFired = firedTags.get(evt.tag) ?? -Infinity;
    if (state.currentAge - lastFired < evt.cooldown) return false;
    return true;
  });

  // 全局冷却：任意两次十字之间至少间隔3年
  const lastAnyCrossroad = firedTags.size > 0 ? Math.max(...firedTags.values()) : -Infinity;
  const yearsSinceLastCrossroad = state.currentAge - lastAnyCrossroad;
  let selectionPool = eligible;
  if (yearsSinceLastCrossroad < 3) {
    // 路径专属十字路口（priority >= 9）豁免全局冷却
    // 但冷却期内 ONLY 从高优先级中选，防止低优先级事件"蹭车"
    const highPriority = eligible.filter(e => e.priority >= 9);
    if (highPriority.length === 0) return null;
    selectionPool = highPriority;
  }

  if (selectionPool.length === 0) return null;

  // 计算今年是否触发十字（不是必定触发！）
  // 基础概率：进入ageRange的第一年为15%，每过一年递增10%，最高70%
  // 取"最成熟"事件的在range内年数（酝酿越久越可能发生）
  const yearsInRange = Math.max(
    0,
    ...selectionPool.map(e => state.currentAge - e.ageRange[0])
  );
  let fireChance = Math.min(0.70, 0.15 + yearsInRange * 0.10);

  // 保底触发：路径专属十字路口（priority >= 9）在其ageRange的最后一年，触发概率提升到100%
  // 确保玩家在ageRange范围内至少触发一次
  const hasPathCrossroadAtMaxAge = selectionPool.some(e =>
    e.priority >= 9 && state.currentAge >= e.ageRange[1]
  );
  if (hasPathCrossroadAtMaxAge) {
    fireChance = 1.0;
  }

  // 状态加权：人生低谷时更容易面临抉择
  if (state.stress > 65 || state.happiness < 35) {
    fireChance += 0.15; // 高压/低幸福 +15%
  } else if (state.stress < 30 && state.happiness > 70) {
    fireChance -= 0.10; // 顺风顺水 -10%
  }

  // 全局冷却越久，概率越高
  if (yearsSinceLastCrossroad > 8) fireChance += 0.10;
  if (yearsSinceLastCrossroad > 12) fireChance += 0.10;

  fireChance = Math.max(0.05, Math.min(1.0, fireChance));

  // 掷骰子决定今年是否出十字
  if (Math.random() > fireChance) return null;

  // 按priority加权随机选择（优先级越高权重越大，但不是绝对）
  // 权重 = priority * 对应的概率加成
  const weighted = selectionPool.map(evt => {
    let weight = evt.priority;
    // 高优先级(>=15)事件额外加成（如大环境裁员、35岁危机）
    if (evt.priority >= 15) weight *= 1.5;
    // 刚进入ageRange的事件降低权重（给它更多酝酿时间）
    const yearsSinceStart = state.currentAge - evt.ageRange[0];
    if (yearsSinceStart < 2) weight *= 0.6;
    // 快超出ageRange的事件增加权重（避免错过）
    const yearsToEnd = evt.ageRange[1] - state.currentAge;
    if (yearsToEnd <= 2) weight *= 2.0;
    // 保底：路径专属十字路口在ageRange最后一年，权重设为极高确保选中
    if (evt.priority >= 9 && state.currentAge >= evt.ageRange[1]) {
      weight *= 100;
    }
    return { evt, weight };
  });

  const totalWeight = weighted.reduce((s, w) => s + w.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const { evt, weight } of weighted) {
    roll -= weight;
    if (roll <= 0) return evt;
  }

  // 兜底返回最高优先级
  selectionPool.sort((a, b) => b.priority - a.priority);
  return selectionPool[0];
}
