import type { CrossroadEvent, GameState, PartnerPersonality } from '../types/global.d.js';
import { CITY_CONFIGS } from '../utils/math-engine.js';

// ========== 十字路口事件数据库 ==========
// 设计原则：不绑定固定年龄，基于状态条件触发
// 每种人生路线都有专属十字路口（单身、结婚无孩、结婚有孩、丁克等）
// 每个选项的effect函数直接修改state
//
// 精简版：保留10个最核心的人生节点
// 1. career_promotion_early   职场岔路口
// 2. career_35_crisis         35岁危机
// 3. career_layoff_storm      大环境凛冬
// 4. love_pressure            催婚
// 5. love_confession          表白
// 6. love_dink_vs_child       要不要孩子
// 7. family_parent_health     父母生病
// 8. family_marriage_crisis   婚姻危机
// 9. single_loneliness        深夜空房间
// 10. retirement_early_vs_keep 提前退休还是继续

export const CROSSROAD_EVENTS: CrossroadEvent[] = [
  // ============================================================
  // A. 职场类（3个）
  // ============================================================

  // 1. 职场岔路口（非体制内+非创业+工作>=2年）
  {
    id: 'career_promotion_early',
    title: '职场岔路口',
    narrative: '你在公司干了几年，终于做出了一点成绩。那天下午总监把你叫到办公室，倒了一杯茶推到你面前。你知道这不是普通的谈话。',
    ageRange: [24, 32],
    priority: 10,
    cooldown: 8,
    tag: 'career_choice',
    conditions: (s: GameState) => !s.isUnemployed && s.totalYearsWorked >= 2 && s.currentProfession !== '体制内' && s.currentProfession !== '实体创业' && s.currentAge >= 24 && (s.stress > 50 || s.happiness < 50 || s.currentMonthlySalary <= Math.round(s.careerStartSalary * 1.15)),
    options: [
      {
        id: 'opt_accept_transfer',
        label: '接受外派，去大城市闯一闯',
        description: '薪资翻倍，但生活成本+50%，父母关系会疏远',
        hint: '高回报高风险',
        hintColor: 'danger',
        prerequisites: (s: GameState) => s.currentCity !== '资本修罗场' && s.health >= 30,
        disabledReason: s => s.currentCity === '资本修罗场' ? '你已经在一线城市了' : '身体撑不住大城市的节奏',
        effect: (s: GameState) => {
          if (s.currentCity !== '资本修罗场') {
            const oldConfig = CITY_CONFIGS[s.currentCity];
            const newConfig = CITY_CONFIGS['资本修罗场'];
            s.currentCity = '资本修罗场';
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * (newConfig.salaryMultiplier / oldConfig.salaryMultiplier) * 1.5);
            s.annualBaseCost *= newConfig.costMultiplier / oldConfig.costMultiplier;
          } else {
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.5);
          }
          if (s.parents.isAlive) s.parents.relationShip = Math.max(0, s.parents.relationShip - 15);
          s.stress = Math.min(100, s.stress + 6);
          s.happiness = Math.max(0, s.happiness - 3);
          return { log: `你接过了调令，收拾好行李独自去了${s.currentCity}。高铁窗外飞速倒退的风景让你有些恍惚，但你知道，这是你选择的路。`, cost: 0 };
        },
      },
      {
        id: 'opt_join_startup',
        label: '跳槽创业公司，拿期权赌一把',
        description: '薪资+20%，但创业公司可能倒闭，未来3年收入波动大',
        hint: '高风险高回报',
        hintColor: 'danger',
        prerequisites: (s: GameState) => s.currentSavings >= 30000 && s.health >= 25,
        disabledReason: s => s.currentSavings < 30000 ? '存款不够撑过可能的空窗期' : '身体经不起创业公司的折腾',
        effect: (s: GameState) => {
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.2);
          s.careerStartSalary = s.currentMonthlySalary;
          s.stress = Math.min(100, s.stress + 6);

          // 创业公司3年内倒闭/被裁概率60%
          const roll = Math.random();
          if (roll < 0.20) {
            // 20% 期权兑现，大赚一笔
            s.currentSavings += 80000 + Math.floor(Math.random() * 120000);
            s.happiness = Math.min(100, s.happiness + 15);
            s.stress = Math.max(0, s.stress - 10);
            s.currentProfession = '红利行业';
            return { log: '你加入了创业公司。前两年每天工作到凌晨，期权合同上的数字看起来像画饼。第三年公司居然被收购了，你手里的期权变现了六位数。你请所有老同事吃了顿大餐，那晚你喝多了，笑着笑着就哭了。', cost: 0 };
          } else if (roll < 0.50) {
            // 30% 勉强撑着，没大起色
            s.happiness = Math.max(0, s.happiness - 3);
            return { log: '你加入了创业公司，工位还没分到就被告知要做三个人的活。期权合同签了，但公司一直在B轮和C轮之间挣扎。两年过去，公司没倒也没上市，你工资涨了一点，但头发掉了更多。', cost: 0 };
          } else {
            // 50% 倒闭/被裁
            s.isUnemployed = true;
            s.preUnemployedSalary = s.currentMonthlySalary;
            s.currentMonthlySalary = 0;
            s.stress = Math.min(100, s.stress + 15);
            s.happiness = Math.max(0, s.happiness - 15);
            return { log: '你加入了创业公司。前几个月热火朝天，但半年后融资断了，开始拖欠工资。又撑了三个月，HR找你谈话的那天，办公室里已经走了一半人。你收拾东西走人的时候，CEO说"等我们好起来一定找你回来"。你笑了笑没说话。', cost: 0 };
          }
        },
      },
      {
        id: 'opt_stay',
        label: '留在原公司，稳扎稳打',
        description: '正常涨薪，稳定但可能错过风口',
        hint: '低风险低回报',
        hintColor: 'positive',
        effect: (s: GameState) => {
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.15);
          s.stress = Math.max(0, s.stress - 5);
          s.happiness = Math.min(100, s.happiness + 3);
          return { log: '你婉拒了两边的邀请，继续坐在你熟悉的工位上。窗外阳光正好，你觉得稳定也是一种选择。', cost: 0 };
        },
      },
      {
        id: 'opt_go_civil',
        label: '辞职考公务员',
        description: '薪资-30%但极度稳定，但考公录取率低，可能考不上',
        hint: '千军万马过独木桥',
        hintColor: 'danger',
        prerequisites: (s: GameState) => s.currentAge <= 35 && s.currentSavings >= 50000,
        disabledReason: s => s.currentAge > 35 ? '超过35岁，考公年龄限制' : '存款不够裸辞备考',
        effect: (s: GameState) => {
          // 考公成功率约25%（裸辞备考压力大，笔试面试都要过）
          // 受当前状态影响：压力低+幸福度高时状态好，成功率略高
          let successRate = 0.25;
          if (s.stress < 40) successRate += 0.10;
          if (s.happiness > 60) successRate += 0.05;
          if (s.stress > 70) successRate -= 0.10;
          successRate = Math.max(0.10, Math.min(0.45, successRate));

          // 备考期间先失业
          s.isUnemployed = true;
          s.preUnemployedSalary = s.currentMonthlySalary;
          s.currentMonthlySalary = 0;
          s.stress = Math.min(100, s.stress + 8);
          s.currentSavings -= 15000; // 备考开销（报班+资料+生活费）

          if (Math.random() < successRate) {
            // 考上了
            s.isUnemployed = false;
            s.currentProfession = '体制内';
            s.currentMonthlySalary = Math.round(s.preUnemployedSalary * 0.7);
            s.careerStartSalary = s.currentMonthlySalary;
            s.stress = Math.max(0, s.stress - 20);
            s.happiness = Math.min(100, s.happiness + 15);
            if (s.parents.isAlive) s.parents.relationShip = Math.min(100, s.parents.relationShip + 25);
            return { log: '你每天泡在图书馆刷题，大半年没社交。笔试出成绩那天你手抖着点不开网页——进面了。面试那天你穿了最正式的衬衫，说话声音都在抖。几个月后公示名单出来，你看到自己名字的那一刻，坐在电脑前哭了。你妈在电话里反复说"太好了太好了"。', cost: 15000 };
          } else {
            // 没考上
            s.happiness = Math.max(0, s.happiness - 12);
            if (s.parents.isAlive) s.parents.relationShip = Math.max(0, s.parents.relationShip - 5);
            return { log: '你全职备考了大半年，刷题刷到想吐。笔试成绩出来差了0.3分进面。你盯着那个分数看了很久，然后关掉网页开始投简历。空窗期不好解释，积蓄也花了不少。你安慰自己"至少试过了"，但深夜里还是会想，如果多对一道选择题呢。', cost: 15000 };
          }
        },
      },
    ],
  },

  // 2. 35岁危机预警（红利行业专属）
  {
    id: 'career_35_crisis',
    title: '35岁的悬崖',
    narrative: '夜里十一点，行业群里突然刷屏——隔壁部门整组被端了。你盯着手机，手指悬在屏幕上不敢往下翻。第二天一早，直属上司端着咖啡路过你工位，压低声音说了句"做好两手准备"。你打开招聘网站，把年龄那一栏看了很久，忽然觉得35这两个字从来没有这么刺眼过。',
    ageRange: [33, 38],
    priority: 15,
    cooldown: 10,
    tag: 'career_crisis',
    conditions: (s: GameState) => !s.isUnemployed && (s.currentProfession === '红利行业' || s.currentProfession === '传统私企') && s.currentAge >= 30 && !s.isUpskilled && s.totalYearsWorked >= 5 && (s.stress > 65 || s.happiness < 50),
    options: [
      {
        id: 'opt_upskill',
        label: '报班学新技术，转型AI/大数据',
        description: '花费30000元，但学完不代表一定能保住工作',
        hint: '花钱买机会，不是买保险',
        hintColor: 'neutral',
        prerequisites: (s: GameState) => s.currentSavings >= 30000,
        disabledReason: '存款不够报班',
        effect: (s: GameState) => {
          s.currentSavings -= 30000;
          s.stress = Math.min(100, s.stress + 8); // 边上班边学习压力很大

          const roll = Math.random();
          if (roll < 0.45) {
            // 45% 转型成功，保住工作甚至涨薪
            s.isUpskilled = true;
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.15);
            s.stress = Math.max(0, s.stress - 5);
            s.happiness = Math.min(100, s.happiness + 5);
            return { log: '你咬牙报了集训班，每天下班后学到凌晨。结业那天你拿着证书找领导谈了一次。没想到领导正想组一个新方向的团队，你成了最合适的人选。工资涨了，悬着的心终于落地了。', cost: 30000 };
          } else if (roll < 0.75) {
            // 30% 学了但没用上（没被裁也没涨薪）
            s.isUpskilled = true;
            s.happiness = Math.max(0, s.happiness - 3);
            return { log: '你咬牙学完了课程，证书拿到手了。但公司那个新团队编制冻结了，你还是干着原来的活。钱花了，夜熬了，好像什么都没变——但你心里多了一点底气，也许以后用得上。', cost: 30000 };
          } else {
            // 25% 还是被裁了
            s.isUnemployed = true;
            s.preUnemployedSalary = s.currentMonthlySalary;
            s.currentMonthlySalary = 0;
            s.stress = Math.min(100, s.stress + 10);
            s.happiness = Math.max(0, s.happiness - 10);
            return { log: '你花三万报了班，每天学到凌晨，结业证书还热乎着，裁员名单就下来了。领导说"公司很感谢你的努力，但业务调整没办法"。你抱着纸箱走出大楼的时候，手里攥着那张没用的证书。', cost: 30000 };
          }
        },
      },
      {
        id: 'opt_fight',
        label: '主动加班，用业绩证明自己',
        description: '可能涨薪但健康透支，搏命也未必保得住工作',
        hint: '拿命换钱',
        hintColor: 'danger',
        prerequisites: (s: GameState) => s.health >= 30,
        disabledReason: '身体已经亮红灯，再拼可能进医院',
        effect: (s: GameState) => {
          s.health = Math.max(0, s.health - 12);
          s.stress = Math.min(100, s.stress + 8);

          const roll = Math.random();
          if (s.health < 25 && roll < 0.30) {
            // 身体先垮了：病倒住院
            s.currentSavings -= 20000;
            s.isUnemployed = true;
            s.preUnemployedSalary = s.currentMonthlySalary;
            s.currentMonthlySalary = 0;
            s.happiness = Math.max(0, s.happiness - 15);
            return { log: '你开始玩命加班，连续三个月没在十二点前回过家。绩效确实上去了，但某天凌晨你在工位上突然眼前一黑，被同事送进了医院。医生说"再晚来就心梗了"。工作没保住，医药费花了两万。躺在病床上你才明白，命比KPI重要。', cost: 20000 };
          } else if (roll < 0.45) {
            // 努力被看到，涨薪保住工作
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.15);
            s.happiness = Math.min(100, s.happiness + 3);
            return { log: '你开始主动揽活，加班到深夜是常态。季度 review 的时候领导点名表扬了你，工资涨了15%。你松了口气，但照镜子时发现白头发多了不少，体检报告也多了几项异常。', cost: 0 };
          } else if (roll < 0.75) {
            // 白忙一场，没涨薪也没被裁
            return { log: '你玩命加班了大半年，绩效确实上去了，但晋升名额给了老板的嫡系。你安慰自己"至少没被裁"，但深夜加完班打车回家的路上，你望着窗外的路灯，不知道这样的日子什么时候是个头。', cost: 0 };
          } else {
            // 还是被裁了
            s.isUnemployed = true;
            s.preUnemployedSalary = s.currentMonthlySalary;
            s.currentMonthlySalary = 0;
            s.happiness = Math.max(0, s.happiness - 20);
            s.stress = Math.min(100, s.stress + 10);
            return { log: '你天天加班到凌晨，拿了两个季度的A。但裁员名单下来，你的名字赫然在列。HR说"你的绩效很好，但业务线整个砍了"。你抱着纸箱走出大楼的时候，觉得那些熬过的夜都像个笑话。', cost: 0 };
          }
        },
      },
      {
        id: 'opt_lie_flat',
        label: '接受现实，降低预期',
        description: '工资不变，心态平和，压力-15',
        hint: '自我和解',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.stress = Math.max(0, s.stress - 15);
          s.happiness = Math.max(0, s.happiness - 5);
          return { log: '你不再和年轻人比加班时长了。到了点就下班，回家做饭遛弯。同事说你"躺平了"，你觉得自己只是终于活得像个人了。', cost: 0 };
        },
      },
    ],
  },

  // 3. 裁员风暴（非体制内+经济萧条+工作>=5年）
  {
    id: 'career_layoff_storm',
    title: '大环境凛冬',
    narrative: '这个月公司群里陆续有人退群，办公区靠窗那一排工位已经空了大半，连绿植都没人浇水了。周一例会上，领导清了清嗓子说"公司会尽量保住核心团队"。你注意到他说这句话的时候，目光从你这边扫过去，没有停留。你低头记笔记，笔尖在本子上顿了很久。',
    ageRange: [28, 55],
    priority: 16,
    cooldown: 8,
    tag: 'career_crisis',
    conditions: (s: GameState) => !s.isUnemployed && s.currentProfession !== '体制内' && s.currentProfession !== '实体创业' && s.totalYearsWorked >= 3 && (s.stress > 70 || (s.economicCycle === 2 && s.totalYearsWorked >= 3)),
    options: [
      {
        id: 'opt_layoff_prep',
        label: '立即开始找工作，骑驴找马',
        description: '偷偷面试、刷简历，但会分散精力影响当前工作表现',
        hint: '主动出击，祸福相依',
        hintColor: 'positive',
        effect: (s: GameState) => {
          // 骑驴找马需要花钱（交通、请假扣薪、置装）
          const jobHuntCost = 3000 + Math.floor(Math.random() * 2000);
          s.currentSavings -= jobHuntCost;
          s.stress = Math.min(100, s.stress + 5);
          const roll = Math.random();
          if (roll < 0.25) {
            // 大成功：找到更好的工作
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.2);
            s.stress = Math.max(0, s.stress - 15);
            s.happiness = Math.min(100, s.happiness + 15);
            return { log: `你开始偷偷刷招聘网站、约面试。花了几千块交通和请假扣薪，但功夫不负有心人——一家大厂给你发了offer，薪资涨了20%。辞职那天你把辞职信拍在领导桌上，走得昂首挺胸。`, cost: jobHuntCost };
          } else if (roll < 0.55) {
            // 找到平薪工作，但新公司是个坑
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * (0.95 + Math.random() * 0.1));
            s.stress = Math.min(100, s.stress + 10);
            return { log: `你面了七八家，终于有一家给了offer，薪资和原来差不多。你兴冲冲跳了槽，入职才发现加班文化比上家公司还狠，领导天天画饼。你看着新工位，有点后悔。`, cost: jobHuntCost };
          } else {
            // 没找到，还被领导发现了
            s.stress = Math.min(100, s.stress + 15);
            s.happiness = Math.max(0, s.happiness - 8);
            return { log: `你投了几十份简历，面试了三家，都没有下文。更糟糕的是，领导似乎察觉到了什么，重要的会议不再叫你参加，年终review时评语是"需要更专注当前工作"。你坐在工位上，感觉自己像个透明人。`, cost: jobHuntCost };
          }
        },
      },
      {
        id: 'opt_quit_voluntarily',
        label: '主动找HR谈协商离职',
        description: '拿一笔补偿金体面退场，但谈判结果看运气',
        hint: '体面退场，但谈判桌上没有稳赢',
        hintColor: 'neutral',
        prerequisites: (s: GameState) => s.totalYearsWorked >= 1,
        disabledReason: '工作不满一年，补偿金太少谈不了',
        effect: (s: GameState) => {
          const expectedSeverance = Math.round(s.currentMonthlySalary * (Math.min(s.totalYearsWorked, 10) + 1));
          const roll = Math.random();
          if (roll < 0.15) {
            // HR拒绝：你不是裁员名单上的
            s.stress = Math.min(100, s.stress + 20);
            s.happiness = Math.max(0, s.happiness - 10);
            return { log: `你鼓起勇气去找HR谈协商离职。HR看了你一眼说"你不在本轮优化名单上，公司没有义务给你补偿"。你灰溜溜地回到工位，发现隔壁同事看你的眼神都变了——很快全部门都知道你想走但没走成。`, cost: 0 };
          } else if (roll < 0.50) {
            // HR同意，但按最低基数算
            const actualSeverance = Math.round(expectedSeverance * 0.6);
            s.currentSavings += actualSeverance;
            s.isUnemployed = true;
            s.preUnemployedSalary = s.currentMonthlySalary;
            s.currentMonthlySalary = 0;
            s.stress = Math.min(100, s.stress + 8);
            return { log: `HR同意了，但拿出一份协议：补偿按最低社保基数算，到手只有${actualSeverance}元（你预期的60%）。你犹豫了很久还是签了——至少比被裁时撕破脸强。收拾东西走的时候，你听见有人在背后小声说"他主动走的，没被逼"。`, cost: 0 };
          } else if (roll < 0.75) {
            // 顺利拿到足额补偿
            s.currentSavings += expectedSeverance;
            s.isUnemployed = true;
            s.preUnemployedSalary = s.currentMonthlySalary;
            s.currentMonthlySalary = 0;
            s.stress = Math.max(0, s.stress - 5);
            s.happiness = Math.min(100, s.happiness + 5);
            return { log: `HR看了你的档案，叹了口气说"你是个好员工，只是大环境不好"。N+1补偿${expectedSeverance}元顺利到账。离职那天同事们请你吃了顿散伙饭，有人说"你这一步走得对，至少拿了钱"。`, cost: 0 };
          } else {
            // 领导直接说那就现在走，没有N+1
            s.isUnemployed = true;
            s.preUnemployedSalary = s.currentMonthlySalary;
            s.currentMonthlySalary = 0;
            s.stress = Math.min(100, s.stress + 15);
            s.happiness = Math.max(0, s.happiness - 15);
            s.currentSavings += s.currentMonthlySalary; // 只有当月工资
            return { log: `你去找领导谈，没想到领导直接说"既然你想走，那就这周走吧"。你愣了一下说"那补偿呢"，领导说"主动离职没有补偿"。你血压飙升但已经骑虎难下，只拿了当月工资就办了手续。走出大楼的时候你骂了自己一路。`, cost: 0 };
          }
        },
      },
      {
        id: 'opt_hunker_down',
        label: '守在原地，赌自己不会被裁',
        description: '什么都不做，听天由命——但命运从不按剧本出牌',
        hint: '听天由命，四种结局',
        hintColor: 'danger',
        effect: (s: GameState) => {
          const roll = Math.random();
          if (roll < 0.20) {
            // 幸存者升职：人少了活多了，但给你加薪
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 1.15);
            s.stress = Math.min(100, s.stress + 20);
            s.happiness = Math.max(0, s.happiness - 5);
            return { log: '裁员后团队缩编了一半，领导拍拍你肩膀说"以后这个团队就靠你了"。给你涨了15%的工资，但你要干三个人的活。每天凌晨下班，你看着空荡荡的办公室，不知道自己是幸存者还是接盘侠。', cost: 0 };
          } else if (roll < 0.45) {
            // 降薪调岗保住饭碗
            s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 0.75);
            s.stress = Math.min(100, s.stress + 10);
            s.happiness = Math.max(0, s.happiness - 10);
            return { log: 'HR找你谈话，说"公司困难，希望你理解"。你的岗位被取消了，要么接受降薪25%去一个边缘部门，要么领补偿走人。你选择了前者。新工位在楼道尽头，没有窗户，桌上落了一层灰。', cost: 0 };
          } else if (roll < 0.70) {
            // 被裁，拿到补偿（但比主动谈的少）
            const severance = Math.round(s.currentMonthlySalary * Math.min(s.totalYearsWorked, 8));
            s.currentSavings += severance;
            s.isUnemployed = true;
            s.preUnemployedSalary = s.currentMonthlySalary;
            s.currentMonthlySalary = 0;
            s.stress = Math.min(100, s.stress + 10);
            s.happiness = Math.max(0, s.happiness - 25);
            return { log: `你赌自己不会是那个倒霉蛋。但HR的邮件还是来了——"请于本周五前完成交接"。N+1补偿${severance}元，比主动谈的人少拿了近一半。你盯着屏幕看了很久，然后默默地打开了招聘网站。`, cost: 0 };
          } else {
            // 躲过一劫，但提心吊胆
            s.stress = Math.min(100, s.stress + 8);
            s.happiness = Math.max(0, s.happiness - 8);
            return { log: '这轮裁员名单上没有你。你松了口气，但你看到空出来的工位，听到走廊里压抑的哭声，知道这种运气不会一直都在。从那天起，你每天早上进公司第一件事就是看邮箱有没有HR的未读邮件。', cost: 0 };
          }
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
        description: '和父母大吵一架，父母关系-30，压力大幅变化',
        hint: '爆发之后',
        hintColor: 'negative',
        effect: (s: GameState) => {
          s.parents.relationShip = Math.max(0, s.parents.relationShip - 30);
          if (s.stress > 70) {
            s.stress = Math.max(0, s.stress - 5);
            return { log: '你吼了一句"别管我了"摔了门出去。夜风灌进来，你在小区长椅上坐了半小时。冷静下来后你有点后悔，但奇怪的是，胸口那股闷气好像散了不少。你妈后来给你发了条消息："早点回来，给你热着饭。"', cost: 0 };
          }
          s.stress = Math.min(100, s.stress + 15);
          return { log: '你吼了一句"别管我了"摔了门出去。夜风灌进来，你在小区长椅上坐了半小时。回家的路上你开始觉得烦躁——吵架没解决任何问题，反而让你更堵了。', cost: 0 };
        },
      },
      {
        id: 'opt_evade_delay',
        label: '"再说吧再说吧"',
        description: '拖延敷衍，压力+10，催婚计数+1',
        hint: '问题还在那里',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.parents.relationShip = Math.max(0, s.parents.relationShip - 5);
          s.stress = Math.min(100, s.stress + 10);
          (s as any).parentNagCount = ((s as any).parentNagCount || 0) + 1;
          return { log: '你笑了笑说"再说吧再说吧"。你妈叹了口气，你爸默默把烟掐了。这个问题像根刺一样扎在那儿，不疼，但你总知道它在。', cost: 0 };
        },
      },
    ],
  },

  // 5. 暧昧表白
  {
    id: 'love_confession',
    title: '那个人的消息',
    narrative: '凌晨一点，你正准备关灯睡觉，手机屏幕忽然亮了。是那个暧昧了大半年的TA发来的："我爸妈下周过来，想见见你一面。"你把手机扣在胸口，听见自己的心跳很响。窗外有车开过，灯光在天花板上一扫而过。你想了很久，打字又删，删了又打。',
    ageRange: [24, 36],
    priority: 11,
    cooldown: 6,
    tag: 'love',
    conditions: (s: GameState) => !s.isMarried && !s.partner && s.currentAge >= 22 && (s.happiness < 60 || s.stress > 50),
    options: [
      {
        id: 'opt_confess_yes',
        label: '"我想了很久，答案是我愿意"',
        description: '认真回应，多种结局',
        hint: '双向奔赴或一厢情愿',
        hintColor: 'positive',
        effect: (s: GameState) => {
          const roll = Math.random();
          if (roll < 0.40) {
            // 双向奔赴
            const names = ['晓芸', '佳慧', '雨萱', '思琪', '浩然', '宇轩', '俊杰', '子涵', '欣妍', '志远'];
            const personalities: PartnerPersonality[] = ['温柔型', '事业型', '浪漫型', '节俭型', '独立型'];
            const traits = ['暧昧已久的朋友', '温柔的邻居', '有趣的同事', '老同学'];
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
              trait: traits[Math.floor(Math.random() * traits.length)],
              memories: [{ age: s.currentAge, event: '终于在一起了', emoji: '💕' }],
            };
            s.happiness = Math.min(100, s.happiness + 20);
            s.stress = Math.max(0, s.stress - 10);
            return { log: '你们终于把话说开了。那个周末，你们手牵手走在河边，夕阳把影子拉得很长。你忽然觉得，一个人走了这么久的路，终于有人愿意一起走了。', cost: 0 };
          } else if (roll < 0.65) {
            // 对方说"给我点时间想想"
            (s as any).pendingConfession = true;
            s.stress = Math.min(100, s.stress + 5);
            return { log: '对方沉默了一会儿说："我有点意外……能给我点时间想想吗？"你点了点头。等待的感觉像考试交完卷但不确定答案对不对。', cost: 0 };
          } else if (roll < 0.85) {
            // 被温柔拒绝
            s.happiness = Math.max(0, s.happiness - 15);
            s.stress = Math.min(100, s.stress + 10);
            return { log: '对方说得很温柔："你对我很好，我一直都知道。但我一直把你当最好的朋友。"你笑着说"没事"。回家的路上你走了很远的弯路，耳机里循环了一首歌。', cost: 0 };
          } else {
            // 对方已有对象了
            s.happiness = Math.max(0, s.happiness - 20);
            s.stress = Math.min(100, s.stress + 15);
            return { log: '对方低头说了声"对不起，我其实已经有对象了"。你愣了一下，然后说了句"恭喜"。那天晚上你删掉了半年的聊天记录。', cost: 0 };
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
            return { log: '你说了句"现在不太确定"。对方说了声"好的"，语气没什么起伏。之后的日子你等了很久，手机一直没响。你后来才明白，有些人只问一次。', cost: 0 };
          } else if (roll < 0.80) {
            // 对方等你
            (s as any).pendingConfession = true;
            return { log: '对方说："没关系，我等你。"你不知道该高兴还是难过。这句话既是温柔，也是一把悬在头顶的剑。', cost: 0 };
          } else {
            // 时机已过
            s.happiness = Math.max(0, s.happiness - 20);
            return { log: '你犹豫了太久。等你终于想清楚去找对方的时候，朋友圈里看到了TA和别人的合照。你放大看了看，然后关掉手机，盯着天花板发了很久的呆。', cost: 0 };
          }
        },
      },
      {
        id: 'opt_friendzone',
        label: '"我们还是做朋友吧"',
        description: '明确朋友区，压力-8，标记friendZoned',
        hint: '安全但遗憾',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.stress = Math.max(0, s.stress - 8);
          s.happiness = Math.max(0, s.happiness - 5);
          (s as any).friendZoned = true;
          return { log: '你说得很认真："我们是好朋友，我不想破坏这个。"对方说了声"嗯"。之后你们还像从前一样聊天，但你偶尔会想，如果当时说了别的话呢。', cost: 0 };
        },
      },
      {
        id: 'opt_pretend_not_see',
        label: '"假装没看到那条消息"',
        description: '逃避，幸福-12，压力+15',
        hint: '鸵鸟策略',
        hintColor: 'negative',
        effect: (s: GameState) => {
          s.happiness = Math.max(0, s.happiness - 12);
          s.stress = Math.min(100, s.stress + 15);
          return { log: '你把手机翻过去扣在床头柜上，告诉自己"太晚了明天再说"。第二天你也没回，第三天也是。对方再也没发过消息。你偶尔打开对话框，最后一条消息还安静地躺在那儿。', cost: 0 };
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
            s.happiness = Math.max(0, s.happiness - 25);
            s.stress = Math.min(100, s.stress + 20);
            if (s.partner) s.partner.affection = Math.min(100, s.partner.affection + 5);
            return { log: '你们确实怀上了，全家人都沉浸在喜悦中。但第八周的时候，伴侣突然腹痛去了医院。医生说"胚胎没有发育好，这是自然淘汰"。你们抱在一起哭了很久——这一次，是心痛的眼泪。但经历了这件事，你们发现彼此是对方最坚实的依靠。', cost: 10000 };
          }

          if (Math.random() < successRate) {
            // 顺利怀上
            s.hasChild = true;
            s.annualBaseCost += 35000;
            s.happiness = Math.min(100, s.happiness + 20);
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
            s.happiness = Math.max(0, s.happiness - 20);
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
        prerequisites: (s: GameState) => s.currentSavings >= 20000 && s.currentProfession !== '自由职业',
        disabledReason: s => s.currentSavings < 20000 ? '存款不够请假回家的开销' : '自由职业本来就自由，随时能回',
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
            const splitCost = Math.min(s.currentSavings * 0.3, 200000);
            s.currentSavings -= Math.round(splitCost);
            s.stress = Math.min(100, s.stress + 10);
            s.happiness = Math.max(0, s.happiness - 30);

            // 如果有孩子，额外惩罚
            if (s.hasChild) {
              s.happiness = Math.max(0, s.happiness - 10);
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
            s.stress = Math.min(100, s.stress + 20);
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
  // E. 退休规划类（1个）
  // ============================================================

  // 10. 提前退休vs继续干（50岁+有存款+体制外）
  {
    id: 'retirement_early_vs_keep',
    title: '提前退休的诱惑',
    narrative: '深夜你打开记账APP，把存款数字反复算了三遍。如果省着点花，其实现在不工作也能撑下去。你想象了一下不用早起、不用挤早高峰、不用在会议室假装认真听会的日子，嘴角不自觉地上扬。但转念一想——退休金少了好几年，万一生场大病呢？你关掉手机，翻了个身，窗外的天已经有点蒙蒙亮了。',
    ageRange: [48, 58],
    priority: 11,
    cooldown: 8,
    tag: 'retirement',
    conditions: (s: GameState) => !s.isUnemployed && !s.endingTriggered && s.currentAge >= 45 && s.currentSavings > s.targetWealth * 0.3 && s.currentProfession !== '体制内' && (s.stress > 60 || s.happiness < 55),
    options: [
      {
        id: 'opt_retire_early',
        label: '提前退休，享受生活',
        description: '收入归零，靠存款生活，幸福+25，压力-30',
        hint: '自由万岁',
        hintColor: 'positive',
        prerequisites: (s: GameState) => s.currentSavings >= s.targetWealth * 0.5,
        disabledReason: '存款不够提前退休，至少需要目标财富的一半',
        effect: (s: GameState) => {
          s.isUnemployed = true;
          s.preUnemployedSalary = s.currentMonthlySalary;
          s.currentMonthlySalary = 0;
          s.happiness = Math.min(100, s.happiness + 25);
          s.stress = Math.max(0, s.stress - 30);
          s.health = Math.min(100, s.health + 5);
          return { log: '你递交了退休申请。同事们惊讶，领导挽留，但你的心已经飞走了。走出大楼那天，阳光暖洋洋的。你忽然发现，不用赶路的日子，路边花开得真好。', cost: 0 };
        },
      },
      {
        id: 'opt_part_time',
        label: '转为半工半退休模式',
        description: '薪资减半，但保留社保，压力-15',
        hint: '半退休',
        hintColor: 'positive',
        effect: (s: GameState) => {
          s.currentMonthlySalary = Math.round(s.currentMonthlySalary * 0.5);
          s.stress = Math.max(0, s.stress - 15);
          s.happiness = Math.min(100, s.happiness + 10);
          return { log: '你和公司谈了降薪半职的方案。领导同意了，毕竟你还算好用。每周只上三天班，其余时间你自己安排。虽然钱少了，但你发现时间才是最奢侈的东西。', cost: 0 };
        },
      },
      {
        id: 'opt_power_through',
        label: '继续干到法定退休年龄',
        description: '正常收入，压力不变，但可能错过黄金岁月',
        hint: '坚持到底',
        hintColor: 'neutral',
        effect: (s: GameState) => {
          s.stress = Math.min(100, s.stress + 3);
          return { log: '你看了看退休金计算器，咬咬牙决定再干几年。同事们说"你还能扛"。你笑了笑，但晚上回家躺在沙发上的时候，你看着天花板想——还有几年呢？', cost: 0 };
        },
      },
    ],
  },
];

// ========== 检测当前状态是否触发了十字路口 ==========
export function detectCrossroad(state: GameState, firedTags: Map<string, number>): CrossroadEvent | null {
  // 全局冷却：任意两次十字之间至少间隔3年
  const lastAnyCrossroad = firedTags.size > 0 ? Math.max(...firedTags.values()) : -Infinity;
  const yearsSinceLastCrossroad = state.currentAge - lastAnyCrossroad;
  if (yearsSinceLastCrossroad < 3) return null;

  // 遍历所有事件，筛选符合条件的
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

  if (eligible.length === 0) return null;

  // 计算今年是否触发十字（不是必定触发！）
  // 基础概率：进入ageRange的第一年为15%，每过一年递增10%，最高70%
  // 取"最成熟"事件的在range内年数（酝酿越久越可能发生）
  const yearsInRange = Math.max(
    0,
    ...eligible.map(e => state.currentAge - e.ageRange[0])
  );
  let fireChance = Math.min(0.70, 0.15 + yearsInRange * 0.10);

  // 状态加权：人生低谷时更容易面临抉择
  if (state.stress > 65 || state.happiness < 35) {
    fireChance += 0.15; // 高压/低幸福 +15%
  } else if (state.stress < 30 && state.happiness > 70) {
    fireChance -= 0.10; // 顺风顺水 -10%
  }

  // 全局冷却越久，概率越高
  if (yearsSinceLastCrossroad > 8) fireChance += 0.10;
  if (yearsSinceLastCrossroad > 12) fireChance += 0.10;

  fireChance = Math.max(0.05, Math.min(0.85, fireChance));

  // 掷骰子决定今年是否出十字
  if (Math.random() > fireChance) return null;

  // 按priority加权随机选择（优先级越高权重越大，但不是绝对）
  // 权重 = priority * 对应的概率加成
  const weighted = eligible.map(evt => {
    let weight = evt.priority;
    // 高优先级(>=15)事件额外加成（如大环境裁员、35岁危机）
    if (evt.priority >= 15) weight *= 1.5;
    // 刚进入ageRange的事件降低权重（给它更多酝酿时间）
    const yearsSinceStart = state.currentAge - evt.ageRange[0];
    if (yearsSinceStart < 2) weight *= 0.6;
    // 快超出ageRange的事件增加权重（避免错过）
    const yearsToEnd = evt.ageRange[1] - state.currentAge;
    if (yearsToEnd <= 2) weight *= 2.0;
    return { evt, weight };
  });

  const totalWeight = weighted.reduce((s, w) => s + w.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const { evt, weight } of weighted) {
    roll -= weight;
    if (roll <= 0) return evt;
  }

  // 兜底返回最高优先级
  eligible.sort((a, b) => b.priority - a.priority);
  return eligible[0];
}
