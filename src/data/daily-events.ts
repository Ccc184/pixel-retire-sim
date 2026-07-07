import type { GameState, DailyEvent } from '../types/global.d.ts';

// ============================================================
// 日常琐事事件数据库
// 覆盖 22-60 岁人生各阶段，共 96 条事件
// ============================================================

const dailyEvents: DailyEvent[] = [
  // ==================== 22-27岁：刚工作 ====================

  {
    id: 'daily_001',
    text: '刷朋友圈看到大学同学晒了订婚照，九宫格配文"余生请多指教"。你点赞的手指悬了三秒，默默退出去继续改PPT，群里还在弹"什么时候轮到你"。',
    label: '同学订婚',
    ageRange: [23, 27],
    conditions: (state) => !state.isMarried,
    priority: 1,
    effects: { stress: 4, happiness: -3 },
  },

  {
    id: 'daily_002',
    text: '房东微信发来"下个月涨200"，你盯着屏幕看了半天，默默打开58同城搜搬家攻略，又算了下中介费——算了，继续住吧。',
    label: '房租上涨',
    ageRange: [22, 27],
    priority: 2,
    effects: { stress: 4, happiness: -3 },
  },

  {
    id: 'daily_003',
    text: '加班到凌晨一点出公司，地铁早收车了。你扫辆共享单车骑四十分钟回家，路上刷到"00后已年薪百万"的短视频，默默把手机塞回兜里。',
    label: '深夜加班',
    ageRange: [22, 30],
    priority: 2,
    effects: { stress: 3, health: -1 },
  },

  {
    id: 'daily_004',
    text: '年终奖到账，你请爸妈去了那家他们念叨半年的馆子。妈妈嘴上"太浪费了"，筷子却没停过，最后还打包了半只烧鹅。',
    label: '年终奖金',
    ageRange: [22, 28],
    priority: 2,
    effects: { happiness: 5, stress: -3 },
  },

  {
    id: 'daily_005',
    text: '妈电话里说周末安排了相亲，对方"有房有车体制内"。你犹豫三秒说"行吧"，挂了电话打开小红书搜"相亲穿搭避雷指南"。',
    label: '周末相亲',
    ageRange: [24, 30],
    conditions: (state) => !state.isMarried && !state.partner,
    priority: 1,
    effects: { stress: 3 },
  },

  {
    id: 'daily_006',
    text: '周末两天没出门，外卖盒堆了半张桌。周日晚上你意识到整周只说了两句话——给外卖员"谢谢"，给Siri"明天几点下雨"。',
    label: '宅家周末',
    ageRange: [22, 35],
    priority: 1,
    effects: { happiness: -3, health: -2 },
  },

  {
    id: 'daily_007',
    text: '闹钟响时你在心里把辞职信打了一百遍。爬起来挤上地铁——花呗账单昨晚刚发，本月最低还款还差三百，班还是得上。',
    label: '花呗未还',
    ageRange: [22, 35],
    priority: 2,
    effects: { stress: 4, happiness: -2 },
  },

  {
    id: 'daily_008',
    text: '同事拉你下班喝酒，本想拒绝，听到"AA制"就去了。聊到凌晨两点，散场时一致认为老板有病。第二天全员迟到。',
    label: '同事拼酒',
    ageRange: [22, 35],
    priority: 1,
    effects: { happiness: 3, stress: -2 },
  },

  {
    id: 'daily_009',
    text: '过年回家，七大姑八大姨轮番"有对象没""工资多少""啥时买房"。你全程微笑点头，内心已演完三集宫斗剧。',
    label: '亲戚盘问',
    ageRange: [23, 32],
    conditions: (state) => !state.isMarried,
    priority: 3,
    effects: { stress: 3, happiness: -4 },
  },

  {
    id: 'daily_010',
    text: '洗完澡照镜子，发际线比大学时高了两厘米。你打开淘宝搜"防脱洗发水"，销量第一那瓶评论写着"没用"——你还是下单了。',
    label: '发际线高',
    ageRange: [24, 35],
    priority: 1,
    effects: { stress: 3 },
  },

  {
    id: 'daily_011',
    text: '同事发现你下午三点准时点奶茶，给你起了外号"奶茶侠"。你嘴上抗议，三点一到又默默打开外卖App，顺手拼了杯第二杯半价。',
    label: '奶茶侠',
    ageRange: [22, 30],
    priority: 1,
    effects: { happiness: 3 },
  },

  {
    id: 'daily_012',
    text: '妈打电话问吃了没、穿暖没、忙不忙。你"嗯嗯"五分钟就挂了。挂完又愧疚，点开她朋友圈发现她转了篇《经常熬夜的年轻人要注意》。',
    label: '妈妈的电话',
    ageRange: [22, 40],
    conditions: (state) => state.parents.isAlive,
    priority: 1,
    effects: { happiness: -2 },
  },

  {
    id: 'daily_013',
    text: '你不小心瞄到同办公室同事的工资条，比你高3000，活儿却一样多。你盯着抽屉看了很久，默默打开Boss直聘刷了半小时又卸了。',
    label: '工资差距',
    ageRange: [22, 35],
    priority: 1,
    effects: { stress: 4, happiness: -3 },
  },

  {
    id: 'daily_014',
    text: '下班路过钢琴店你站了五分钟，看了看余额转身进了蜜雪冰城。四块钱一杯柠檬水，喝完你也觉得灵魂被治愈了——甜水胜过一切。',
    label: '柠檬水治愈',
    ageRange: [22, 35],
    priority: 1,
    effects: { happiness: 2 },
  },

  {
    id: 'daily_015',
    text: '手机剩2%，你一路小跑找充电器。突然觉得生活也是这样——永远在找充电的地方，永远充不满。充上电，你刷了会儿短视频压惊。',
    label: '手机没电',
    ageRange: [22, 40],
    priority: 1,
    effects: {},
  },

  // ==================== 28-32岁：事业上升期 ====================

  {
    id: 'daily_016',
    text: '领导把你叫进办公室"这个项目你来带"。你表面镇定，出来才发现手心全是汗。升职了，但工位上多了一摞永远做不完的需求文档。',
    label: '升职带项目',
    ageRange: [26, 35],
    priority: 3,
    effects: { stress: 3, happiness: 3 },
  },

  {
    id: 'daily_017',
    text: '项目上线你通宵整晚，凌晨五点看到"发布成功"四个字时，办公室只剩你和一盏日光灯，还有三罐空了的红牛。',
    label: '项目上线',
    ageRange: [25, 38],
    priority: 2,
    effects: { stress: 3, health: -2, happiness: 4 },
  },

  {
    id: 'daily_018',
    text: '公司体检报告多了两个朝上箭头，医生说"问题不大注意休息"。你塞进包里发了条朋友圈"愿检尽检"配健身房自拍——秒删。',
    label: '体检异常',
    ageRange: [27, 40],
    priority: 3,
    effects: { stress: 3, health: -3 },
  },

  {
    id: 'daily_019',
    text: '过年回家，妈妈说隔壁张阿姨女儿二胎都满月了。你低头扒饭不说话，筷子夹了三次才夹起一块豆腐，心里默念"催生话术又升级了"。',
    label: '催生压力',
    ageRange: [28, 35],
    conditions: (state) => state.isMarried && !state.hasChild,
    priority: 2,
    effects: { stress: 4 },
  },

  {
    id: 'daily_020',
    text: '你和伴侣为"谁洗碗"吵了一架，冷战到第二天才假装没事。洗碗机早买好了，但谁也不愿把碗摆进去——这成了新时代家务盲区。',
    label: '家务争执',
    ageRange: [25, 45],
    conditions: (state) => !!state.partner && !state.partner.hasDivorced,
    effects: { stress: 3, happiness: -3 },
    priority: 2,
  },

  {
    id: 'daily_021',
    text: '你打开贝壳算了首付和月供，默默关掉App。发了条微博"房价什么时候跌"，评论区回"等你退休的时候"。',
    label: '房价焦虑',
    ageRange: [26, 35],
    conditions: (state) => !state.hasProperty,
    priority: 3,
    effects: { stress: 3, happiness: -4 },
  },

  {
    id: 'daily_022',
    text: '大学室友聚会，有人聊创业拿了风投，有人换了宝马。你安静喝茶，回家路上脚步比来时慢了些，默默把朋友圈那条"岁月静好"删了。',
    label: '室友聚会',
    ageRange: [27, 38],
    priority: 2,
    effects: { stress: 4, happiness: -3 },
  },

  {
    id: 'daily_023',
    text: '搬进新租的房子，这是工作以来第N次搬家。你看着客厅堆的纸箱发呆，闲鱼上挂的"搬家甩卖"浏览量又涨了三个。',
    label: '又一次搬家',
    ageRange: [24, 35],
    conditions: (state) => !state.hasProperty,
    priority: 2,
    effects: { stress: 3 },
  },

  {
    id: 'daily_024',
    text: '生日你给自己买了个小蛋糕，在出租屋插上一根蜡烛。许愿时突然不知道该许什么，最后许了"明年别一个人过"——这愿望已经许了三年。',
    label: '孤独生日',
    ageRange: [25, 35],
    conditions: (state) => !state.partner,
    priority: 2,
    effects: { happiness: -2, stress: 2 },
  },

  {
    id: 'daily_025',
    text: '收到"恭喜中奖100万"的短信差点点链接。还好反应过来——100万长啥样你都没见过。打开余额宝看了眼，安慰自己"至少还有三位数"。',
    label: '诈骗短信',
    ageRange: [22, 55],
    priority: 1,
    effects: {},
  },

  {
    id: 'daily_026',
    text: '跟爸妈视频，发现妈妈皱纹多了几条，爸爸白头发藏不住了。你截图存下来，又删掉——不忍心看。',
    label: '爸妈变老',
    ageRange: [26, 45],
    conditions: (state) => state.parents.isAlive,
    priority: 2,
    effects: { stress: 3, happiness: -2 },
  },

  {
    id: 'daily_027',
    text: '逛商场看中一件外套，翻吊牌1680，默默放回去去了优衣库。结账发现也涨了20，你在心里算了算这个月的恩格尔系数。',
    label: '优衣库涨价',
    ageRange: [22, 35],
    conditions: (state) => state.currentMonthlySalary < 15000,
    priority: 1,
    effects: {},
  },

  {
    id: 'daily_028',
    text: '你开始早上喝黑咖啡代替奶茶，下了健身App。三天后打开又关掉——"自律"相关帖子你已经收藏了87篇，篇篇吃灰。',
    label: '健身Flag',
    ageRange: [25, 40],
    priority: 1,
    effects: {},
  },

  {
    id: 'daily_029',
    text: '伴侣问"我们什么时候能买房"，你沉默五秒说"会有的"。当晚你偷偷打开房贷计算器算到凌晨一点，越算越清醒。',
    label: '买房追问',
    ageRange: [26, 35],
    conditions: (state) => !!state.partner && !state.partner.hasDivorced && !state.hasProperty,
    priority: 2,
    effects: { stress: 3 },
  },

  {
    id: 'daily_030',
    text: '妈电话里说"你爸最近老咳嗽"，你说过两天带他去医院。挂了电话才想起上次说过两天，已经是半年前了。',
    label: '老爸咳嗽',
    ageRange: [28, 50],
    conditions: (state) => state.parents.isAlive && state.parents.age >= 55,
    effects: { stress: 3, happiness: -3 },
    priority: 3,
  },

  {
    id: 'daily_031',
    text: '你在手机上算退休前能攒多少——算了三遍越算越不想看。关掉计算器打开短视频，今朝有酒今朝醉，反正也攒不下。',
    label: '退休算账',
    ageRange: [25, 40],
    priority: 2,
    effects: { stress: 4 },
  },

  {
    id: 'daily_032',
    text: '下班去便利店买水，看到一个小男孩牵着他爸的手出来。你在门口站了一会儿，买了瓶啤酒，回家路上没敢听歌。',
    label: '便利店偶遇',
    ageRange: [27, 38],
    conditions: (state) => !state.hasChild,
    priority: 1,
    effects: {},
  },

  // ==================== 33-40岁：中年起步 ====================

  {
    id: 'daily_033',
    text: '今年体检报告又多了两项异常。你盯着那些上上下下的箭头，第一次认真考虑要不要开始跑步——然后打开外卖App点了份沙拉。',
    label: '体检异常',
    ageRange: [33, 45],
    priority: 3,
    effects: { stress: 3, health: -3 },
  },

  {
    id: 'daily_034',
    text: '群里家长又在聊奥数班和学区房，你假装没看到，偷偷打开"如何接受孩子是普通人"的帖子。读完觉得说的就是自己。',
    label: '学区房焦虑',
    ageRange: [30, 45],
    conditions: (state) => state.children.length > 0,
    priority: 2,
    effects: { stress: 4 },
  },

  {
    id: 'daily_035',
    text: '搬一箱快递上楼，腰椎"咔嚓"一声脆响。你站在楼道缓了好一会儿——想起二十岁扛四楼都不带喘，现在拆个快递都费劲。',
    label: '腰椎咔嚓',
    ageRange: [33, 50],
    priority: 2,
    effects: { health: -3, stress: 3 },
  },

  {
    id: 'daily_036',
    text: '妈说膝盖不好上下楼都疼。你网上搜了半天护膝买了三副，自己留了一副——毕竟天天挤地铁站着，膝盖也快不行了。',
    label: '妈妈膝盖',
    ageRange: [30, 50],
    conditions: (state) => state.parents.isAlive,
    priority: 2,
    effects: { stress: 3 },
  },

  {
    id: 'daily_037',
    text: '同学聚会上有人聊孩子补习班，有人聊换的车。你低头喝茶庆幸这次没喝酒，回家路上把群消息设成了免打扰。',
    label: '同学攀比',
    ageRange: [33, 50],
    priority: 2,
    effects: { stress: 4, happiness: -3 },
  },

  {
    id: 'daily_038',
    text: '凌晨三点醒来盯着天花板想"我这辈子就这样了吗"。翻身闹钟六点半就响，你打了个哈欠看眼余额，决定继续躺平五分钟。',
    label: '凌晨失眠',
    ageRange: [33, 50],
    priority: 3,
    effects: { stress: 3, happiness: -4 },
  },

  {
    id: 'daily_039',
    text: '理了个光头试图挽救发际线，同事都说"挺精神的"。你笑着说为了凉快——其实是为了省那瓶防脱洗发水的钱。',
    label: '剃光头',
    ageRange: [33, 45],
    priority: 1,
    effects: {},
  },

  {
    id: 'daily_040',
    text: '午休刷到"35岁后跳槽有多难"看了三遍，把招聘App卸载了。同事问你在干嘛，你说"清理手机内存"——清理的是对人生的幻想。',
    label: '跳槽焦虑',
    ageRange: [33, 42],
    conditions: (state) => !state.isUnemployed,
    priority: 3,
    effects: { stress: 3 },
  },

  {
    id: 'daily_041',
    text: '孩子问"为什么别的小朋友暑假去旅游，我们只能在家"。你顿了下说"因为我们家更温馨"——这借口已经用了三年。',
    label: '孩子的疑问',
    ageRange: [30, 48],
    conditions: (state) => state.children.length > 0 && state.currentSavings < 200000,
    priority: 2,
    effects: { stress: 3, happiness: -3 },
  },

  {
    id: 'daily_042',
    text: '你开始每天吃保健品，桌上摆了一排瓶瓶罐罐。同事调侃"提前养生"，你笑说"保温杯泡枸杞算啥，我泡脚都加艾草了"。',
    label: '养生模式',
    ageRange: [35, 55],
    priority: 1,
    effects: { health: 1 },
  },

  {
    id: 'daily_043',
    text: '颈椎病让你在办公室做起"米字操"。同事经过被你伸长脖子的样子吓一跳"要叫救护车吗"，你说没事继续画米字。',
    label: '颈椎米字操',
    ageRange: [30, 50],
    priority: 1,
    effects: {},
  },

  {
    id: 'daily_044',
    text: '陪孩子写作业到晚上十一点，第三遍讲同一道数学题时你深呼吸五次才没发火。孩子怯怯问"妈妈你是不是生气了"，你说"没有"。',
    label: '陪写作业',
    ageRange: [30, 48],
    conditions: (state) => state.children.length > 0 && state.children.some(c => c.growthStage === '小学' || c.growthStage === '初中'),
    priority: 2,
    effects: { stress: 3, happiness: 2 },
  },

  {
    id: 'daily_045',
    text: '孩子班主任打电话说"最近上课老走神"。你挂了电话深吸一口气，今晚又少不了一场谈话——剧本已经背好了。',
    label: '班主任来电',
    ageRange: [30, 45],
    conditions: (state) => state.children.length > 0 && state.children.some(c => c.growthStage === '小学' || c.growthStage === '初中'),
    effects: { stress: 3 },
    priority: 2,
  },

  {
    id: 'daily_046',
    text: '饭桌上讨论孩子补习班，你和伴侣在费用上分歧很大。最后谁也没说服谁，结账时两人都没说话。',
    label: '补习班分歧',
    ageRange: [30, 48],
    conditions: (state) => !!state.partner && !state.partner.hasDivorced && state.children.length > 0,
    priority: 2,
    effects: { stress: 3 },
  },

  {
    id: 'daily_047',
    text: '发现父母冰箱里放了个月前的剩菜，你趁他们不注意偷偷倒了。妈发现后心疼半天，说"我们那时候哪舍得"。',
    label: '过期剩菜',
    ageRange: [30, 50],
    conditions: (state) => state.parents.isAlive && state.parents.livingWithPlayer,
    priority: 1,
    effects: {},
  },

  {
    id: 'daily_048',
    text: '你买了张彩票，对完号码揉成团扔进垃圾桶。五块钱的梦想就此终结——看了看手里的泡面，心想这五块还不如加个蛋。',
    label: '彩票梦碎',
    ageRange: [22, 55],
    priority: 1,
    effects: {},
  },

  // ==================== 41-50岁：中年危机 ====================

  {
    id: 'daily_049',
    text: '凌晨两点接到电话爸/妈住院了。你穿着睡衣冲下楼，滴滴司机看你一眼没说话，一路开得比导航还快。',
    label: '父母住院',
    ageRange: [40, 55],
    conditions: (state) => state.parents.isAlive && state.parents.age >= 65,
    priority: 3,
    effects: { stress: 5, happiness: -3, savings: -5000 },
  },

  {
    id: 'daily_050',
    text: '孩子开始跟你顶嘴动不动摔门。你想起自己当年也这样，突然理解了父母——当年你妈大概也是攥着拳头站在门外。',
    label: '孩子顶嘴',
    ageRange: [38, 52],
    conditions: (state) => state.children.length > 0 && state.children.some(c => c.growthStage === '初中' || c.growthStage === '高中'),
    priority: 2,
    effects: { stress: 3, happiness: -3 },
  },

  {
    id: 'daily_051',
    text: '部门来了个00后，做事又快又好工资还比你低。你端着保温杯的手紧了紧，枸杞好像也没那么甜了——被时代抛弃连招呼都不打。',
    label: '00后同事',
    ageRange: [40, 55],
    conditions: (state) => !state.isUnemployed,
    priority: 3,
    effects: { stress: 3, happiness: -4 },
  },

  {
    id: 'daily_052',
    text: '医生说血压偏高让你少盐少油。你点头出诊室，在煎饼摊前站了两秒转身走了——路过奶茶店没忍住，安慰自己"少盐就行"。',
    label: '血压偏高',
    ageRange: [40, 55],
    priority: 2,
    effects: { stress: 4, health: -3 },
  },

  {
    id: 'daily_053',
    text: '你开始早起散步，公园里一群老头在打太极。你看了半天，第二天带了双布鞋来——结果被拉进队伍，成了最年轻的那个。',
    label: '公园太极',
    ageRange: [42, 60],
    priority: 1,
    effects: { health: 2, happiness: 2 },
  },

  {
    id: 'daily_054',
    text: '手机系统更新后你研究半天也没搞明白新界面，第一次有了"我是不是老了"的念头。后来发现隔壁95后也没搞明白，心里平衡了不少。',
    label: '系统更新',
    ageRange: [40, 55],
    priority: 1,
    effects: {},
  },

  {
    id: 'daily_055',
    text: '同事老李退休了，欢送会上大家喝了很多酒。你看着老李收拾办公桌的背影，那个空位有点刺眼——再过几年就是你。',
    label: '同事退休',
    ageRange: [45, 58],
    priority: 2,
    effects: { stress: 3, happiness: -2 },
  },

  {
    id: 'daily_056',
    text: '孩子大学放假回来，比你高了半个头。饭桌上聊了很多，但总觉得有层隔阂——他嘴里那些"内卷""躺平"你都得现查。',
    label: '孩子归来',
    ageRange: [42, 55],
    conditions: (state) => state.children.length > 0 && state.children.some(c => c.growthStage === '大学' || c.growthStage === '成年'),
    priority: 2,
    effects: { happiness: 3, stress: 2 },
  },

  {
    id: 'daily_057',
    text: '你开始每天吃药——降压的、护肝的、补钙的，床头柜像个小型药房。同事问你在吃啥，你苦笑"中年人的仪式感，饭后三粒风雨无阻"。',
    label: '日常吃药',
    ageRange: [42, 60],
    priority: 2,
    effects: { health: -1 },
  },

  {
    id: 'daily_058',
    text: '午休刷到"20岁年轻人的一天"，看了三十秒就关了心里堵得慌。打开外卖App想点杯奶茶压惊——发现今天已经喝了三杯。',
    label: '奶茶压惊',
    ageRange: [40, 55],
    priority: 1,
    effects: {},
  },

  {
    id: 'daily_059',
    text: '公司推"数字化办公"新系统，培训听了三遍也没搞明白。年轻同事帮你操作了一次，你在心里默念"被裁了就去送外卖"——发现骑手也要会用App。',
    label: '新系统培训',
    ageRange: [42, 58],
    conditions: (state) => !state.isUnemployed,
    priority: 2,
    effects: { stress: 4, happiness: -3 },
  },

  {
    id: 'daily_060',
    text: '翻了翻手机相册，最近的照片全是工作截图和各种通知。你决定明天拍一张天空——结果第二天忙到忘了，后天补上了。',
    label: '拍天空',
    ageRange: [35, 55],
    priority: 1,
    effects: { happiness: 2 },
  },

  {
    id: 'daily_061',
    text: '晚饭后和伴侣在小区散步，走了一圈又一圈。谁也没说话但手一直牵着，你突然觉得这样也挺好——比朋友圈秀恩爱踏实多了。',
    label: '小区散步',
    ageRange: [35, 60],
    conditions: (state) => !!state.partner && !state.partner.hasDivorced,
    priority: 2,
    effects: { happiness: 3, stress: -3 },
  },

  {
    id: 'daily_062',
    text: '孩子说毕业后想留在大城市发展。你嘴上说"好啊有出息"，心里却空了一块——回家的路上把车停在路边坐了十分钟。',
    label: '孩子离家',
    ageRange: [45, 58],
    conditions: (state) => state.children.length > 0 && state.children.some(c => c.growthStage === '大学' || c.growthStage === '成年'),
    priority: 2,
    effects: { happiness: -2, stress: 3 },
  },

  {
    id: 'daily_063',
    text: '你帮父母装了视频通话App，教了三遍怎么接电话。第二天妈发来消息"刚才是你打的视频吗？我不知道怎么接"——你叹了口气又教了一遍。',
    label: '教爸妈用App',
    ageRange: [35, 55],
    conditions: (state) => state.parents.isAlive,
    priority: 1,
    effects: {},
  },

  {
    id: 'daily_064',
    text: '单位体检，医生看着你的报告皱眉说"建议复查"。你追问两句，医生只说"别想太多"——这三个字让你想了整整一周。',
    label: '建议复查',
    ageRange: [43, 55],
    priority: 3,
    effects: { stress: 3, health: -3, happiness: -4 },
  },

  // ==================== 51-60岁：退休前 ====================

  {
    id: 'daily_065',
    text: '你算了下退休金和每月开销，差距不小。把计算器放进抽屉，发了条朋友圈"车到山前必有路"——然后默默打开淘宝搜"适合退休老人的兼职"。',
    label: '退休金算账',
    ageRange: [50, 60],
    priority: 3,
    effects: { stress: 3 },
  },

  {
    id: 'daily_066',
    text: '上楼梯开始喘了，以前一口气爬五楼不费劲，现在三楼就得歇会儿。你对着楼梯叹了口气——电梯又坏了三天了。',
    label: '爬楼喘气',
    ageRange: [50, 60],
    priority: 2,
    effects: { health: -3, happiness: -3 },
  },

  {
    id: 'daily_067',
    text: '孩子打电话说要结婚了，你高兴说"太好了"，挂了电话才发现眼眶是湿的。当晚你打开记账App，把那笔礼金记成了"投资"。',
    label: '孩子结婚',
    ageRange: [50, 60],
    conditions: (state) => state.children.length > 0 && state.children.some(c => c.growthStage === '成年'),
    priority: 3,
    effects: { happiness: 3, savings: -10000 },
  },

  {
    id: 'daily_068',
    text: '父母老房子越来越安静。你回去收拾遗物时翻到一张全家福，照片里所有人都在笑——你擦了擦灰，把它装进了相框。',
    label: '遗物整理',
    ageRange: [50, 60],
    conditions: (state) => !state.parents.isAlive,
    priority: 3,
    effects: { happiness: -3, stress: 3 },
  },

  {
    id: 'daily_069',
    text: '翻出年轻时写的日记，看了几页觉得当年的自己又傻又天真。看到"30岁前要财务自由"那段你笑了——笑着笑着就哭了，嘴角还是上扬的。',
    label: '翻旧日记',
    ageRange: [50, 60],
    priority: 2,
    effects: { happiness: 3 },
  },

  {
    id: 'daily_070',
    text: '你开始研究退休计划：学画画、种花、钓鱼、旅游。做了个清单贴冰箱上，光是看就觉得退休也没那么可怕——就是不知道能不能坚持。',
    label: '退休计划',
    ageRange: [52, 60],
    priority: 2,
    effects: { happiness: 3, stress: -3 },
  },

  {
    id: 'daily_071',
    text: '单位通知你可以办提前退休手续了。你盯着通知看了很久，又放进了抽屉——退还是不退，这事比当年选专业还难。',
    label: '提前退休通知',
    ageRange: [55, 60],
    conditions: (state) => !state.isUnemployed,
    priority: 3,
    effects: { stress: 4 },
  },

  {
    id: 'daily_072',
    text: '你和伴侣坐在阳台看夕阳，谁也没说话。伴侣突然说"下辈子还一起过吧"，你愣了下说"好"——然后两人都没再开口，直到天黑。',
    label: '阳台夕阳',
    ageRange: [50, 60],
    conditions: (state) => !!state.partner && !state.partner.hasDivorced,
    priority: 3,
    effects: { happiness: 3 },
  },

  {
    id: 'daily_073',
    text: '你开始觉得办公室越来越安静了——不是工作少了，是熟悉的面孔越来越少。新来的年轻人都喊你"老师"，你第一次觉得这称呼有点重。',
    label: '办公室变空',
    ageRange: [53, 60],
    conditions: (state) => !state.isUnemployed,
    priority: 2,
    effects: {},
  },

  {
    id: 'daily_074',
    text: '你开始认真研究养生文章，收藏了上百条"中老年保健小知识"。孩子说"少看营销号"，你说"我知道是假的，但看着安心"。',
    label: '养生文章',
    ageRange: [50, 60],
    priority: 1,
    effects: {},
  },

  {
    id: 'daily_075',
    text: '退休倒计时，你开始清理办公桌。抽屉翻出十年前的工牌照片，那时的你头发还是黑的——你举着照片对了对镜子，半天没说话。',
    label: '清理办公桌',
    ageRange: [57, 60],
    conditions: (state) => !state.isUnemployed,
    priority: 3,
    effects: { happiness: 3, stress: 3 },
  },

  {
    id: 'daily_076',
    text: '你帮孩子带了一天孙子，累得比上班还累。但小家伙笑着喊你的时候，又觉得值了——晚上回家腰都直不起来，却睡得特别香。',
    label: '带孙子',
    ageRange: [52, 60],
    conditions: (state) => state.children.length > 0 && state.children.some(c => c.growthStage === '成年'),
    priority: 2,
    effects: { happiness: 3, health: -2 },
  },

  {
    id: 'daily_077',
    text: '你试着学手机新功能搞了一下午也没学会。打电话让孩子教，孩子说"你发个截图给我看看"——你想了半天，"截图"这个按钮在哪来着？',
    label: '学用新手机',
    ageRange: [50, 60],
    priority: 1,
    effects: {},
  },

  // ==================== 伴侣/家庭关系相关（全年龄段） ====================

  {
    id: 'daily_078',
    text: '结婚纪念日你偷偷订了餐厅，伴侣说"今天不是纪念日啊"——你才发现记错日期了。尴尬说"就当提前过"，默默设了个日历提醒——明年的。',
    label: '纪念日搞错',
    ageRange: [28, 55],
    conditions: (state) => !!state.partner && !state.partner.hasDivorced,
    priority: 2,
    effects: {},
  },

  {
    id: 'daily_079',
    text: '你和伴侣为房贷又吵了一架。冷静下来发现彼此都在为这个家焦虑——月供短信比闹钟还准时，谁也躲不掉。',
    label: '房贷争吵',
    ageRange: [26, 50],
    conditions: (state) => !!state.partner && !state.partner.hasDivorced && state.hasProperty,
    priority: 2,
    effects: { stress: 3, happiness: -3 },
  },

  {
    id: 'daily_080',
    text: '孩子第一次叫"爸爸/妈妈"，你激动得举着手机录了三十遍，最后发现每遍都手抖得看不清。当晚你把最糊的那段发到家族群，配文"天才"。',
    label: '第一次叫爸妈',
    ageRange: [24, 40],
    conditions: (state) => state.children.length > 0 && state.children.some(c => c.growthStage === '婴儿'),
    priority: 3,
    effects: { happiness: 3, stress: -3 },
  },

  {
    id: 'daily_081',
    text: '半夜被孩子哭声吵醒，你迷迷糊糊爬起来哄了半小时才睡。第二天上班打了三个喷嚏，同事问"感冒了"，你说"是幸福的喷嚏"。',
    label: '半夜哄娃',
    ageRange: [24, 38],
    conditions: (state) => state.children.length > 0 && state.children.some(c => c.growthStage === '婴儿' || c.growthStage === '幼儿'),
    priority: 2,
    effects: { stress: 3, happiness: 2 },
  },

  {
    id: 'daily_082',
    text: '周末全家去了趟公园，孩子跑来跑去开心得不得了。你坐长椅上看，突然觉得一切都值了——虽然停车费花了三十。',
    label: '全家逛公园',
    ageRange: [26, 50],
    conditions: (state) => !!state.partner && !state.partner.hasDivorced && state.children.length > 0,
    priority: 2,
    effects: { happiness: 3, stress: -3 },
  },

  {
    id: 'daily_083',
    text: '你发现伴侣偷偷转了笔钱给老家，为"给谁家多少"冷战两天。最后你先开口"算了都是一家人"——这俩字咽了好几次才说出来。',
    label: '偷偷转账',
    ageRange: [28, 55],
    conditions: (state) => !!state.partner && !state.partner.hasDivorced && state.parents.isAlive,
    priority: 2,
    effects: { stress: 3 },
  },

  // ==================== 朋友/社交相关 ====================

  {
    id: 'daily_084',
    text: '发小打电话借钱说要做生意，你犹豫半天还是转了。转完盯着转账记录看了半天，心里默念"这钱大概率是要不回来了"。',
    label: '发小借钱',
    ageRange: [25, 50],
    conditions: (state) => state.friends.some(f => f.type === '发小'),
    priority: 2,
    effects: { savings: -5000, stress: 3 },
  },

  {
    id: 'daily_085',
    text: '同事离职群里发了"江湖再见"，你回了个表情包其实有点羡慕。后来你在招聘网站刷了十分钟又默默关掉——留下的人继续搬砖。',
    label: '同事离职',
    ageRange: [25, 50],
    conditions: (state) => !state.isUnemployed,
    priority: 1,
    effects: {},
  },

  {
    id: 'daily_086',
    text: '约老朋友吃饭，到了发现他提前走了"太忙了改天再约"。你独自吃完刷朋友圈，发现他刚发了"和客户愉快用餐"配文"越努力越幸运"。你给那条点了个赞。',
    label: '朋友爽约',
    ageRange: [30, 55],
    conditions: (state) => state.friends.length > 0,
    priority: 2,
    effects: {},
  },

  {
    id: 'daily_087',
    text: '邻居送了一篮自家种的菜过来，你回赠一箱水果。两人在楼道聊了十分钟，约了下次一起遛狗——这年头有个好邻居比中彩票还难。',
    label: '邻居送菜',
    ageRange: [28, 60],
    conditions: (state) => state.friends.some(f => f.type === '邻居'),
    priority: 1,
    effects: { happiness: 3 },
  },

  // ==================== 财务焦虑相关 ====================

  {
    id: 'daily_088',
    text: '打开银行App看眼余额，又打开信用卡账单。两个数字的差距让你默默关掉手机，打开闲鱼——开始认真考虑卖掉那些"总有一天会用上"的东西。',
    label: '余额焦虑',
    ageRange: [22, 50],
    conditions: (state) => state.currentSavings < 50000,
    priority: 2,
    effects: { stress: 3, happiness: -3 },
  },

  {
    id: 'daily_089',
    text: '你看到"35岁前财务自由"的帖子，评论区全是骂声。你点了赞，又翻了翻自己余额，觉得骂声还不够响——应该加上你。',
    label: '财务自由帖',
    ageRange: [30, 42],
    priority: 1,
    effects: {},
  },

  {
    id: 'daily_090',
    text: '你开始记账每笔都记，坚持三天发现光是"交通"就花了不少。决定以后走路上班，第二天又坐了地铁——走路上班的flag已经倒了87次。',
    label: '记账三天',
    ageRange: [22, 45],
    priority: 1,
    effects: {},
  },

  // ==================== 通用全年龄段 ====================

  {
    id: 'daily_091',
    text: '下雨天忘带伞淋了一路回家。洗完热水澡你发了条朋友圈"岁月是一场没有伞的雨"，删了觉得矫情——改成"今天雨真大"配了张糊照。',
    label: '淋雨回家',
    ageRange: [22, 55],
    priority: 1,
    effects: {},
  },

  {
    id: 'daily_092',
    text: '路边看到一只流浪猫，蹲下摸了摸它的头。猫蹭了蹭你的手然后跑了，你愣了一会儿才站起来——突然想养只猫，又想起物业不让。',
    label: '路遇流浪猫',
    ageRange: [22, 60],
    priority: 1,
    effects: { happiness: 2 },
  },

  {
    id: 'daily_093',
    text: '你尝试学习一项新技能，看了三个教学视频点了收藏。然后这个收藏夹就再也没打开过——和那82篇"自律"帖子一个下场。',
    label: '收藏夹吃灰',
    ageRange: [22, 55],
    priority: 1,
    effects: {},
  },

  {
    id: 'daily_094',
    text: '半夜醒来喝了杯水，看了一眼窗外。城市灯光映在玻璃上，月亮成了模糊的光斑。你站了一会儿才回去睡——明天还得早起挤地铁。',
    label: '半夜看月亮',
    ageRange: [25, 60],
    priority: 1,
    effects: {},
  },

  {
    id: 'daily_095',
    text: '你清理衣柜把穿不上的旧衣服整理出来准备捐。翻到一件十年前的T恤，上面还印着大学社团的logo——你比划了一下，已经塞不进去了。',
    label: '清理衣柜',
    ageRange: [30, 60],
    priority: 1,
    effects: { happiness: 2 },
  },

  {
    id: 'daily_096',
    text: '你开始习惯在手机上设各种闹钟：吃药的、浇花的、给爸妈打电话的。生活变成了一串提醒事项——忘了哪个都会出事。',
    label: '闹钟提醒',
    ageRange: [35, 60],
    priority: 1,
    effects: {},
  },

  // ========== 伏笔日常事件（为盲盒系统埋种子）==========
  {
    id: 'daily_cat',
    text: '下班路上，一只脏兮兮的小猫蹲在路边冲你叫。你犹豫了一下，从便利店买了一根火腿肠。小猫吃完后蹭了蹭你的裤腿，然后消失在了夜色里。你不知道为什么，心里有一种莫名的温暖。',
    label: '喂小猫',
    ageRange: [22, 55],
    priority: 2,
    effects: {},
  },
  {
    id: 'daily_book',
    text: '你在书店闲逛，随手翻到一本冷门书。书里有一句话让你停了下来，你反复读了三遍。虽然现在还不太懂，但你还是买了下来——放在床头，也许有一天会读懂。',
    label: '书店偶遇',
    ageRange: [22, 55],
    priority: 2,
    effects: {},
  },
  {
    id: 'daily_neighbor',
    text: '隔壁新搬来一户人家。第二天早上六点，一阵有节奏的剁馅声把你从梦中惊醒。你翻了个身，在枕头上演了十分钟内心戏，最后还是决定——忍吧。毕竟是邻居。',
    label: '邻居剁馅',
    ageRange: [22, 55],
    priority: 2,
    effects: {},
  },
  {
    id: 'daily_old_colleague',
    text: '你在电梯里遇到了一个似曾相识的面孔。聊了几句才想起来——是前同事。你们加了微信，约定改天吃饭。你预感这次重逢可能会在未来某个时刻产生某种意想不到的影响。',
    label: '电梯偶遇',
    ageRange: [25, 55],
    priority: 2,
    effects: {},
  },
  {
    id: 'daily_midnight',
    text: '凌晨三点你突然醒了，心跳得很快。窗外很安静，你的脑子里却嗡嗡作响。你看着天花板数羊，数到第327只的时候终于迷迷糊糊睡着了。第二天你精神恍惚，开始认真考虑要不要去医院查查。',
    label: '凌晨惊醒',
    ageRange: [22, 55],
    priority: 2,
    effects: {},
  },
  {
    id: 'daily_recipe',
    text: '你在一个美食博主那里看到一道菜谱，看起来很简单。你截了图，告诉自己"周末试试"。你不知道的是，这道菜将来会成为你家餐桌上出现频率最高的菜。',
    label: '收藏菜谱',
    ageRange: [22, 55],
    priority: 2,
    effects: {},
  },
  {
    id: 'daily_childhood_friend',
    text: '你在超市遇到了小学同学。你们在水果区聊了十分钟，加了微信。你记得小时候你们是无话不谈的玩伴，后来因为升学各奔东西。你发了一条朋友圈"世界真小"，然后设了仅部分人可见。',
    label: '超市偶遇同学',
    ageRange: [25, 50],
    priority: 2,
    effects: {},
  },
  {
    id: 'daily_rain',
    text: '下班的时候突然下起了大雨。你没带伞，站在公交站台等了二十分钟。雨越下越大，你最后还是冲进了雨里。回到家全身湿透，但你忽然觉得——淋一场雨也不全是坏事。',
    label: '暴雨下班',
    ageRange: [22, 55],
    priority: 2,
    effects: {},
  },
  {
    id: 'daily_star',
    text: '加班到很晚，你走出公司大楼时抬头看了一眼天空——竟然看到了几颗星星。在这个光污染严重的城市里，能看到星星已经算是一种奢侈。你站在楼下看了五分钟，然后默默走回家。',
    label: '加班看星星',
    ageRange: [22, 55],
    priority: 2,
    effects: {},
  },
  {
    id: 'daily_stray',
    text: '小区楼下有一只流浪猫，瘦得能看到肋骨。你从便利店买了一根火腿肠放在地上，它犹豫了一下，还是吃了。你蹲在旁边看着它吃，心里莫名其妙地柔软了一下。',
    label: '喂流浪猫',
    ageRange: [22, 60],
    priority: 2,
    effects: {},
  },

  // ========== 车房日常事件 ==========

  // 车辆保养事件（有车时触发，age 25-55，概率通过priority控制）
  {
    id: 'daily_car_maintenance',
    text: '车该保养了，4S店报价不菲。你咬咬牙做了全套，技师说"再拖发动机要出大问题"。',
    label: '车辆保养',
    ageRange: [25, 55],
    conditions: (state) => state.hasCar,
    priority: 2,
    effects: { savings: -2500, stress: 2 },
  },
  // 车辆保养变体2
  {
    id: 'daily_car_maintenance_2',
    text: '轮胎磨得差不多了，换了四条花了不小一笔。你看着新轮胎上的毛刺，心想这就是生活。',
    label: '车辆保养',
    ageRange: [25, 55],
    conditions: (state) => state.hasCar,
    priority: 2,
    effects: { savings: -3000, stress: 1 },
  },
  // 车辆保养变体3
  {
    id: 'daily_car_maintenance_3',
    text: '车出了点小毛病，去修理厂检查了一下花了些钱。师傅说"这车保养得还行，再开几年没问题"。',
    label: '车辆保养',
    ageRange: [25, 55],
    conditions: (state) => state.hasCar,
    priority: 2,
    effects: { savings: -2000 },
  },

  // 停车难事件（一线城市+有车时触发）
  {
    id: 'daily_parking_hell',
    text: '在公司附近绕了三圈才找到车位，迟到了十分钟。你跑到工位上气不接下气，领导看了你一眼没说话。每个月800块的停车费，买的不是便利，是焦虑。',
    label: '停车难',
    ageRange: [25, 50],
    conditions: (state) => state.hasCar && state.currentCity === '资本修罗场',
    priority: 2,
    effects: { stress: 3, happiness: -2 },
  },

  // 物业费事件（有房时触发）
  {
    id: 'daily_property_fee',
    text: '物业费又涨了，你看着缴费通知叹了口气。买房时没人告诉你，房子的钱不是一次性花完的。',
    label: '物业费上涨',
    ageRange: [25, 55],
    conditions: (state) => state.hasProperty,
    priority: 2,
    effects: { stress: 2, happiness: -1, savings: -1000 },
  },
  // 物业费变体2
  {
    id: 'daily_property_fee_2',
    text: '楼下邻居装修把水管弄裂了，物业说"需要全体业主分摊维修费"。你转了800块，心想住个房怎么这么多事。',
    label: '物业维修',
    ageRange: [25, 55],
    conditions: (state) => state.hasProperty,
    priority: 2,
    effects: { stress: 3, savings: -800 },
  },
  // 物业费变体3
  {
    id: 'daily_property_fee_3',
    text: '电梯坏了半个月了，物业发通知说"零件需要从厂家调货"。你每天爬8楼回家，腿都要断了。',
    label: '电梯维修',
    ageRange: [25, 55],
    conditions: (state) => state.hasProperty,
    priority: 2,
    effects: { stress: 3, health: -1 },
  },

  // 房贷压力事件（有房贷时触发）
  {
    id: 'daily_mortgage_pressure',
    text: '打开手机银行看了看余额，又看了看房贷还款提醒，算了算这个月还完房贷还能剩多少生活费——不太够。',
    label: '房贷压力',
    ageRange: [25, 45],
    conditions: (state) => state.hasProperty && state.mortgageRemainingYears > 0,
    priority: 2,
    effects: { stress: 2 },
  },
  // 房贷压力变体2
  {
    id: 'daily_mortgage_pressure_2',
    text: '房贷快到头了，你开始幻想还清的那天会是什么感觉。那一天应该像拿到毕业证一样吧——终于熬过来了。',
    label: '房贷快结束',
    ageRange: [40, 55],
    conditions: (state) => state.hasProperty && state.mortgageRemainingYears > 0 && state.mortgageRemainingYears <= 5,
    priority: 2,
    effects: { happiness: 2 },
  },
];

// ============================================================
// 导出函数
// ============================================================

/**
 * 每轮随机抽取日常琐事事件
 * @param state 当前游戏状态
 * @param count 抽取数量，默认 3 条
 * @returns 抽取到的日常琐事数组
 */
export function rollDailyEvents(state: GameState, count: number = 3): DailyEvent[] {
  const age = state.currentAge;

  // 筛选符合年龄段和触发条件的事件
  const eligible = dailyEvents.filter((event) => {
    if (age < event.ageRange[0] || age > event.ageRange[1]) {
      return false;
    }
    if (event.conditions && !event.conditions(state)) {
      return false;
    }
    return true;
  });

  // 按 priority 降序排列
  eligible.sort((a, b) => b.priority - a.priority);

  // 同 priority 内随机打乱
  const grouped: Map<number, DailyEvent[]> = new Map();
  for (const event of eligible) {
    const group = grouped.get(event.priority) ?? [];
    group.push(event);
    grouped.set(event.priority, group);
  }

  // Fisher-Yates 洗牌辅助函数
  function shuffle<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  // 在每个 priority 组内随机打乱，然后按 priority 顺序拼接
  const sortedGroups = Array.from(grouped.entries()).sort(([a], [b]) => b - a);
  const shuffled: DailyEvent[] = [];
  for (const [, group] of sortedGroups) {
    shuffled.push(...shuffle(group));
  }

  // 返回前 count 条，且当轮内不重复
  const usedIds = new Set<string>();
  const result: DailyEvent[] = [];
  for (const event of shuffled) {
    if (!usedIds.has(event.id)) {
      usedIds.add(event.id);
      result.push(event);
      if (result.length >= count) {
        break;
      }
    }
  }

  return result;
}

/**
 * 应用日常琐事事件的效果到游戏状态
 * @param state 当前游戏状态（会被原地修改）
 * @param event 要应用的事件
 * @returns 日志数组，描述产生的效果
 */
export function applyDailyEventEffects(state: GameState, event: DailyEvent): string[] {
  const logs: string[] = [];

  if (!event.effects) {
    return logs;
  }

  const { effects } = event;

  // 压力值
  if (effects.stress !== undefined) {
    const oldStress = state.stress;
    state.stress = Math.max(0, Math.min(100, state.stress + effects.stress));
    if (effects.stress > 0) {
      logs.push(`压力 +${effects.stress}（${oldStress} -> ${state.stress}）`);
    } else {
      logs.push(`压力 ${effects.stress}（${oldStress} -> ${state.stress}）`);
    }
  }

  // 幸福感
  if (effects.happiness !== undefined) {
    const oldHappiness = state.happiness;
    state.happiness = Math.max(0, Math.min(100, state.happiness + effects.happiness));
    if (effects.happiness > 0) {
      logs.push(`幸福感 +${effects.happiness}（${oldHappiness} -> ${state.happiness}）`);
    } else {
      logs.push(`幸福感 ${effects.happiness}（${oldHappiness} -> ${state.happiness}）`);
    }
  }

  // 健康值
  if (effects.health !== undefined) {
    const oldHealth = state.health;
    state.health = Math.max(0, Math.min(100, state.health + effects.health));
    if (effects.health > 0) {
      logs.push(`健康 +${effects.health}（${oldHealth} -> ${state.health}）`);
    } else {
      logs.push(`健康 ${effects.health}（${oldHealth} -> ${state.health}）`);
    }
  }

  // 储蓄
  if (effects.savings !== undefined) {
    state.currentSavings += effects.savings;
    logs.push(`储蓄 ${effects.savings > 0 ? '+' : ''}${effects.savings}（当前：${state.currentSavings}）`);
  }

  // 父母状态
  if (effects.parents) {
    if (effects.parents.health !== undefined) {
      const oldHealth = state.parents.health;
      state.parents.health = Math.max(0, Math.min(100, state.parents.health + effects.parents.health));
      logs.push(`父母健康 ${effects.parents.health > 0 ? '+' : ''}${effects.parents.health}（${oldHealth} -> ${state.parents.health}）`);
    }
    if (effects.parents.relationShip !== undefined) {
      const oldRel = state.parents.relationShip;
      state.parents.relationShip = Math.max(0, Math.min(100, state.parents.relationShip + effects.parents.relationShip));
      logs.push(`父母关系度 ${effects.parents.relationShip > 0 ? '+' : ''}${effects.parents.relationShip}（${oldRel} -> ${state.parents.relationShip}）`);
    }
  }

  // 伴侣状态
  if (effects.partner && state.partner) {
    if (effects.partner.affection !== undefined) {
      const oldAff = state.partner.affection;
      state.partner.affection = Math.max(0, Math.min(100, state.partner.affection + effects.partner.affection));
      logs.push(`伴侣感情 ${effects.partner.affection > 0 ? '+' : ''}${effects.partner.affection}（${oldAff} -> ${state.partner.affection}）`);
    }
    if (effects.partner.trust !== undefined) {
      const oldTrust = state.partner.trust;
      state.partner.trust = Math.max(0, Math.min(100, state.partner.trust + effects.partner.trust));
      logs.push(`伴侣信任 ${effects.partner.trust > 0 ? '+' : ''}${effects.partner.trust}（${oldTrust} -> ${state.partner.trust}）`);
    }
  }

  return logs;
}
