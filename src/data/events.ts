import type { BlackSwanEvent, GameState, AftermathType } from '../types/global.d.js';

// 全量12个黑天鹅事件（严格按照设计书第五章）
export const BLACK_SWAN_EVENTS: BlackSwanEvent[] = [
  // 事件1：急性小病侵袭
  {
    id: 'minor_illness',
    eventName: '急性小病侵袭',
    description: '一场小病让你卧床数日，医药费不菲。',
    probability: () => 0.20,
    condition: (state: GameState) => !state.didHealthCheck,
    effect: (state: GameState) => {
      const cost = 6000;
      const log = `第${state.currentAge}岁，一场来势汹汹的感冒把你按在床上三天，医药费像水一样流走。你看着天花板，突然觉得健康才是最贵的奢侈品。`;
      return { log, loss: cost };
    },
  },
  // 事件2：不幸罹患重大疾病
  {
    id: 'critical_illness',
    eventName: '不幸罹患重大疾病',
    description: '诊断书如晴天霹雳，你感到生命与存款的双重重压。',
    probability: () => 0.025, // v9从4%降到2.5%，约62%概率在38年职业生涯中遇到一次
    condition: () => true,
    effect: (state: GameState) => {
      state.hadCriticalIllness = true;
      if (state.isInsured) {
        // v9：保险报销大部分但非全部——自费部分仍痛（约5万），但不至于直接破产
        const selfPay = 50000;
        const log = `第${state.currentAge}岁，你生病住院。保险报销了大部分费用，但自费部分加上营养费、误工费，还是掏了${selfPay}元。你看着缴费单，感慨"有保险真好，但健康才是真的好"。`;
        return { log, loss: selfPay, aftermath: '健康警示' as AftermathType };
      } else {
        const cost = 180000;
        const log = `第${state.currentAge}岁，诊断书上的那几个字像冰锥刺进心脏。你的人生被劈成了两半：生病前，生病后。${cost}元的窟窿，你不知要用多少年才能填平。`;
        return { log, loss: cost, aftermath: '健康警示' as AftermathType };
      }
    },
    aftermath: '健康警示' as AftermathType,
    aftermathDuration: 3,
  },
  // 事件2.5：大模型误诊事故
  {
    id: 'ai_misdiagnosis',
    eventName: '大模型误诊事故',
    description: 'AI诊断系统误判了你的检查报告，等发现时病情已经延误——算法的置信度是99%，而你是那1%。',
    probability: () => 0.02,
    condition: (state: GameState) => state.isInsured || state.health < 70,
    effect: (state: GameState) => {
      state.health = Math.max(0, state.health - 10);
      state.happiness = Math.max(0, state.happiness - 5);
      const medicalCost = 10000 + Math.floor(Math.random() * 20001); // 1-3万
      state.currentSavings -= medicalCost;
      state.stress = Math.min(100, state.stress + 10);
      const log = `第${state.currentAge}岁，你在全自动体检舱做了年度筛查，AI诊断系统给出了"一切正常"的结论，置信度99.7%。你放心地去忙工作了。三个月后一次偶然的人工复查发现了问题——病灶已经扩散，错过了最佳干预期。你躺在病床上盯着天花板，想起那份报告上绿色的"健康"标签，第一次对算法产生了深深的不信任。治疗加维权花了${medicalCost}元，身体和钱包都挨了一刀。`;
      return { log, loss: medicalCost, aftermath: '医疗纠纷' as AftermathType };
    },
    aftermath: '医疗纠纷' as AftermathType,
    aftermathDuration: 1,
  },
  // 事件3：遭遇行业寒冬裁员
  {
    id: 'layoff',
    eventName: '遭遇行业寒冬裁员',
    description: 'HR的语气很官方，但你明白，这是行业的冬天。',
    probability: (state: GameState) => {
      // All In后、开公司后、自由职业/实体创业不会被裁员
      if (state.isAllInPath || state.hasCompany) return 0;
      if (state.currentProfession === '体制内' || state.currentProfession === '自由职业' || state.currentProfession === '实体创业') return 0;
      // 28岁前不触发裁员（给玩家足够积累期，避免早期失业导致破产死亡螺旋）
      if (state.currentAge < 28) return 0;
      // 再就业稳定期：曾经失业过且当前薪资明显低于失业前薪资的玩家，裁员概率大幅降低
      // 这避免"失业→再就业→立刻又失业"的死亡螺旋
      if (state.preUnemployedSalary > 0 && state.currentMonthlySalary > 0 &&
          state.currentMonthlySalary < state.preUnemployedSalary * 0.85 &&
          state.totalUnemployedYears > 0) {
        return 0.02; // 再就业稳定期：裁员概率降到2%
      }
      let baseRate = 0.08; // 红利行业基础
      if (state.currentProfession === '传统私企') {
        baseRate = state.currentAge >= 40 ? 0.15 : 0.06;
      }
      if (state.currentProfession === '一线蓝领') baseRate = 0.04;
      if (state.currentCity === '资本修罗场') baseRate += 0.05;
      if (state.currentCity === '避风低洼地') baseRate *= 0.5;
      if (state.isUpskilled) baseRate *= 0.5;
      // 路径技能等效保护：路径技能达到一定水平时，裁员概率降低（等效isUpskilled）
      // 这确保通过叙事事件积累技能的玩家也能获得职业安全感
      const pathSkillLevel = Math.max(
        state.pathSkills?.aiSkill || 0,
        state.pathSkills?.tradingSkill || 0,
        state.pathSkills?.brandSkill || 0,
        state.pathSkills?.careSkill || 0,
        state.pathSkills?.bioKnowledge || 0,
        state.pathSkills?.crossCulturalSkill || 0,
      );
      if (!state.isUpskilled && pathSkillLevel >= 30) baseRate *= 0.6;
      if (!state.isUpskilled && pathSkillLevel >= 50) baseRate *= 0.5;
      if (state.economicCycle === 2) baseRate *= 2;
      // 35岁危机
      if (state.currentProfession === '红利行业' && state.currentAge >= 35) baseRate = 0.25;
      return baseRate;
    },
    condition: (state: GameState) => !state.isUnemployed && !state.isAllInPath && !state.hasCompany,
    effect: (state: GameState) => {
      state.preUnemployedSalary = state.currentMonthlySalary;
      state.currentMonthlySalary = 0;
      state.isUnemployed = true;
      const log = `第${state.currentAge}岁，HR的语气平稳得像在念天气预报，你平静地收拾纸箱。电梯门关上的瞬间，你发现自己手里除了一杯凉透的咖啡，空无一物。`;
      return { log, aftermath: '心理阴影' as AftermathType };
    },
    aftermath: '心理阴影' as AftermathType,
    aftermathDuration: 2,
  },
  // 事件4：技术过时与中年技术危机
  {
    id: 'tech_crisis',
    eventName: '技术过时与中年技术危机',
    description: '新技术浪潮来袭，你发现自己跟不上了。',
    probability: () => 0.10,
    condition: (state: GameState) => 
      (state.currentProfession === '红利行业' || state.currentProfession === '传统私企') && 
      state.currentAge >= 38 && !state.isUpskilled,
    effect: (state: GameState) => {
      state.currentMonthlySalary = Math.round(state.currentMonthlySalary * 0.7);
      const log = `第${state.currentAge}岁，你发现新来的实习生用一行脚本代替了你曾经引以为傲的手艺。你的经验突然变成了废纸，薪资被砍掉了30%。`;
      return { log };
    },
  },
  // 事件5：父母突发重病赡养责任
  {
    id: 'parent_illness',
    eventName: '父母突发重病赡养责任',
    description: '父母身体告急，你倾尽全力为他们治疗。',
    probability: () => 0.05,
    condition: (state) => state.parents.isAlive,
    effect: (state: GameState) => {
      const cost = 50000; // v2平衡：从10万降至5万
      const log = `第${state.currentAge}岁，电话那头传来父亲住院的消息。你放下工作连夜赶回，看着病床上缩小的身影，第一次觉得他们是那么轻，轻得像一片落叶。`;
      return { log, loss: cost };
    },
  },
  // 事件6：传统私企大面积降薪风暴
  {
    id: 'salary_cut',
    eventName: '传统私企大面积降薪风暴',
    description: '公司全员降薪，你的收入一夜退回五年前。',
    probability: () => 0.15,
    condition: (state: GameState) => state.currentProfession === '传统私企' && state.currentAge >= 35,
    effect: (state: GameState) => {
      state.currentMonthlySalary = Math.round(state.currentMonthlySalary * 0.8);
      const log = `第${state.currentAge}岁，全员大会上，老板的声音低沉而无奈。你看着邮件里的降薪通知，想起十年前那个意气风发的自己。`;
      return { log };
    },
  },
  // 事件7：遭遇AI深度伪造诈骗
  {
    id: 'scam',
    eventName: '遭遇AI深度伪造诈骗',
    description: '视频电话里是你妈哭泣的脸，声音也是她的——那是AI用她动态圈三分钟视频训练出来的。',
    probability: () => 0.03,
    condition: () => true,
    effect: (state: GameState) => {
      const loss = Math.min(Math.round(state.currentSavings * 0.15), 80000); // 损失存款15%，封顶8万
      const log = `第${state.currentAge}岁，你接到了一个视频电话，屏幕上是你妈哭泣的脸，声音也是她的。你二话不说转了账。后来你才知道，那是AI用她动态圈三分钟视频训练出来的深度伪造。回过神来，账户里蒸发了${loss}元。`;
      return { log, loss, aftermath: '心理阴影' as AftermathType };
    },
    aftermath: '心理阴影' as AftermathType,
    aftermathDuration: 2,
  },
  // 事件7.5：神经黑客攻击
  {
    id: 'neuro_hack',
    eventName: '神经黑客攻击',
    description: '你的脑机接口被黑客入侵，记忆被窃取、广告被强行植入——数字时代的入侵不再止于屏幕。',
    probability: () => 0.02,
    condition: (state: GameState) => state.retirementPath === 'ai_symbiote' && state.pathFaith >= 50 || state.currentAge >= 35,
    effect: (state: GameState) => {
      state.stress = Math.min(100, state.stress + 20);
      state.happiness = Math.max(0, state.happiness - 10);
      const loss = Math.min(Math.round(state.currentSavings * 0.05), 20000); // 存款损失5%，封顶2万
      state.currentSavings -= loss;
      const log = `第${state.currentAge}岁，你清晨醒来时发现视野边缘浮动着陌生的霓虹广告——不是AR弹窗，是直接投射在你的视觉皮层上的。你的脑机接口被黑客入侵了。记忆碎片像被人翻过的抽屉：童年的片段被替换成产品植入，昨晚的梦境里多了一段你从未去过的购物中心。你花了${loss}元做紧急认知清洗，但闭上眼睛仍能听见那些低语般的推销话术。`;
      return { log, loss, aftermath: '认知干扰' as AftermathType };
    },
    aftermath: '认知干扰' as AftermathType,
    aftermathDuration: 2,
  },
  // 事件8：遭遇婚变导致财产分割
  {
    id: 'divorce',
    eventName: '遭遇婚变导致财产分割',
    description: '爱情走到尽头，你们平分了所有资产——存款、房子、持仓，也平分了过往。',
    probability: () => 0.03,
    condition: (state: GameState) => state.isMarried,
    effect: (state: GameState) => {
      // 离婚分割所有资产（loss字段会由store统一从存款扣除，其他资产直接修改）
      const savingsLoss = Math.round(state.currentSavings * 0.3);
      // 房产分割：有房则房产价值折损30%（归并补偿）
      if (state.hasProperty && state.propertyValue) {
        state.propertyValue = Math.round(state.propertyValue * 0.7);
      }
      // 链上持仓分割
      const chainHoldings = (state as any).chainHoldings || 0;
      if (chainHoldings > 0) {
        (state as any).chainHoldings = Math.round(chainHoldings * 0.7);
      }
      // 生物投资组合分割
      const bioPortfolio = (state as any).bioPortfolio || 0;
      if (bioPortfolio > 0) {
        (state as any).bioPortfolio = Math.round(bioPortfolio * 0.7);
      }
      // 被动收入也受影响（赡养费）
      if (state.passiveIncome > 0) {
        state.passiveIncome = Math.round(state.passiveIncome * 0.8);
      }
      state.isMarried = false;
      if (state.partner) {
        state.partner.datingStage = 'divorced';
        state.partner.hasDivorced = true;
      }
      // 幸福和压力冲击
      state.happiness = Math.max(0, state.happiness - 15);
      state.stress = Math.min(100, state.stress + 15);
      const log = `第${state.currentAge}岁，那张曾经写满誓言的纸被撕成两半。你们平分了房子、存款、持仓，也平分了那些回不去的夜晚。你重新变成了一个人。`;
      return { log, loss: savingsLoss, aftermath: '情感创伤' as AftermathType };
    },
    aftermath: '情感创伤' as AftermathType,
    aftermathDuration: 3,
  },
  // 事件9：全球宏观恶性通胀爆发年
  {
    id: 'inflation',
    eventName: '全球宏观恶性通胀爆发年',
    description: '超市的价签一天一换，你的钱就像融化的冰块。',
    probability: (state: GameState) => {
      // 一生最多触发2次，概率3%
      const hits = (state as any)._inflationHits || 0;
      return hits >= 2 ? 0 : 0.03;
    },
    condition: () => true,
    effect: (state: GameState) => {
      state.annualBaseCost = Math.round(state.annualBaseCost * 1.3);
      (state as any)._inflationHits = ((state as any)._inflationHits || 0) + 1;
      const log = `第${state.currentAge}岁，超市价签飞涨的速度超过了你的心跳。你推着购物车，第一次觉得手里的纸币像刚从火炉里抢出来的雪片。`;
      return { log };
    },
  },
  // 事件10：指数基金全球大牛市红利
  {
    id: 'bull_market',
    eventName: '指数基金全球大牛市红利',
    description: '股市一片红火，你赚得盆满钵满。',
    probability: (state: GameState) => state.economicCycle === 0 ? 0.15 : 0.06,
    condition: (state: GameState) => state.indexFundPct > 20,
    effect: (state: GameState) => {
      const gain = Math.round(state.currentSavings * (state.indexFundPct / 100) * 1.0);
      const log = `第${state.currentAge}岁，股市疯了一样向上冲，你的账户数字在几天内翻了番。你差点以为自己是股神，但你知道，这只是时代的电梯上升了而已。`;
      return { log, loss: -gain }; // 负loss=收益
    },
  },
  // 事件11：高风险投机/链上/生物持仓暴跌爆仓
  {
    id: 'spec_crash',
    eventName: '高风险仓位一夜爆仓',
    description: '你盯着屏幕上的断崖线，账户瞬间变成废墟。',
    probability: (state: GameState) => {
      // 触发条件：传统投机>20%、链上持仓>年收入2倍、生物持仓>年收入2倍
      const chainH = (state as any).chainHoldings || 0;
      const bioP = (state as any).bioPortfolio || 0;
      const annualIncome = state.currentMonthlySalary * 12;
      const hasRiskyPosition = state.speculationPct > 20 || chainH > annualIncome * 2 || bioP > annualIncome * 2;
      if (!hasRiskyPosition) return 0;
      return state.economicCycle === 2 ? 0.40 : 0.20;
    },
    condition: (state: GameState) => {
      const chainH = (state as any).chainHoldings || 0;
      const bioP = (state as any).bioPortfolio || 0;
      const annualIncome = state.currentMonthlySalary * 12;
      return state.speculationPct > 20 || chainH > annualIncome * 2 || bioP > annualIncome * 2;
    },
    effect: (state: GameState) => {
      const lossRate = state.hasHedgeOption ? 0.10 : 0.60;
      let loss = Math.round(state.currentSavings * (state.speculationPct / 100) * lossRate);
      // 链上持仓暴跌
      const chainH = (state as any).chainHoldings || 0;
      const annualIncome = state.currentMonthlySalary * 12;
      if (chainH > annualIncome * 2) {
        const chainLossRate = state.hasHedgeOption ? 0.12 : 0.35;
        const chainLoss = Math.round(chainH * chainLossRate);
        (state as any).chainHoldings = chainH - chainLoss;
        loss += Math.round(chainLoss * 0.2); // 部分连锁反应到存款
      }
      // 生物持仓临床失败暴跌
      const bioP = (state as any).bioPortfolio || 0;
      if (bioP > annualIncome * 2) {
        const bioLossRate = state.hasHedgeOption ? 0.15 : 0.35;
        const bioLoss = Math.round(bioP * bioLossRate);
        (state as any).bioPortfolio = bioP - bioLoss;
        loss += Math.round(bioLoss * 0.15);
      }
      state.hasHedgeOption = false;
      state.happiness = Math.max(0, state.happiness - 10);
      state.stress = Math.min(100, state.stress + 12);
      const log = `第${state.currentAge}岁，你死死盯着屏幕，那根断崖线像断头台一样落下。账户瞬间蒸发，你关掉屏幕，房间里只剩下心跳和耳鸣。`;
      return { log, loss };
    },
  },
  // 事件11.5：加密交易所跑路
  {
    id: 'exchange_collapse',
    eventName: '加密交易所跑路',
    description: '你存币的中心化交易所一夜之间卷款跑路，提币页面变成了404——链上的资产，留在了中心化的口袋里。',
    probability: () => 0.015,
    condition: (state: GameState) => {
      const chainH = (state as any).chainHoldings || 0;
      return chainH > 100000;
    },
    effect: (state: GameState) => {
      const chainH = (state as any).chainHoldings || 0;
      const chainLoss = Math.round(chainH * 0.25);
      (state as any).chainHoldings = chainH - chainLoss;
      state.stress = Math.min(100, state.stress + 15);
      state.happiness = Math.max(0, state.happiness - 10);
      const log = `第${state.currentAge}岁，你像往常一样打开交易所APP想看看行情，却发现页面一片空白——官方社群已解散，创始人的社交账号全部注销，提币通道永远停留在"系统维护中"。你存在里面的${chainLoss.toLocaleString()}元等值加密货币，一夜之间化为一串冰冷的哈希值。你想起那句"Not your keys, not your coins"，苦笑了一下——道理你都懂，只是没想到跑路的剧本会轮到自己。`;
      return { log, loss: 0 };
    },
  },
  // 事件12：固定资产估值物价重估暴跌
  {
    id: 'property_crash',
    eventName: '固定资产估值物价重估暴跌',
    description: '房市寒冬，你的房子估值缩水。',
    probability: () => 0.05,
    condition: (state: GameState) => state.hasProperty,
    effect: (state: GameState) => {
      const crashRate = 0.10 + Math.random() * 0.10; // -10%~-20%
      const oldPropertyValue = state.propertyValue;
      state.propertyValue = Math.round(state.propertyValue * (1 - crashRate));
      const loss = oldPropertyValue - state.propertyValue;
      const log = `第${state.currentAge}岁，新闻报道里说楼市遇冷。你的房子贬值了约${Math.round(crashRate * 100)}%，损失了约${loss.toLocaleString()}元。那座你为之奋斗了半生的水泥盒子，正在缓慢地缩水。`;
      return { log };
    },
  },
  // 事件：交通事故（有车时触发）
  {
    id: 'car_accident',
    eventName: '交通事故',
    description: '你的车被追尾了。',
    probability: (state: GameState) => state.hasCar ? 0.04 : 0,
    condition: (state: GameState) => state.hasCar,
    effect: (state: GameState) => {
      const roll = Math.random();
      if (roll < 0.30) {
        // 小事故，保险全赔
        const carValueBefore = state.carValue || 50000;
        state.carValue = Math.max(5000, Math.round(carValueBefore * 0.95));
        return { log: `第${state.currentAge}岁，等红灯的时候被后面的车追尾了。还好保险全赔，修了三天拿回来了。车虽然修好了，但你知道这辆车的二手价又跌了一截。`, loss: 0 };
      } else if (roll < 0.60) {
        // 事故需要自费
        const repairCost = 3000 + Math.floor(Math.random() * 7000);
        state.currentSavings -= repairCost;
        state.stress = Math.min(100, state.stress + 8);
        return { log: `第${state.currentAge}岁，倒车的时候蹭了柱子，保险不赔（你只买了交强险）。修车花了${repairCost}元，你心疼了好几天。`, loss: repairCost };
      } else {
        // 严重事故，可能造成健康影响
        const medicalCost = 5000 + Math.floor(Math.random() * 15000);
        state.currentSavings -= medicalCost;
        state.health = Math.max(0, state.health - 5);
        state.stress = Math.min(100, state.stress + 15);
        state.happiness = Math.max(0, state.happiness - 10);
        return { log: `第${state.currentAge}岁，高速上爆胎了。车失控撞上了护栏，你被120拉进了急诊。好在人没大事，但医药费花了${medicalCost}元，车基本报废了。`, loss: medicalCost };
      }
    },
  },
  // 事件：房产升值（经济繁荣期，有房时触发）
  {
    id: 'property_appreciation',
    eventName: '房产升值',
    description: '你所在的城市房价涨了一波。',
    probability: (state: GameState) => {
      if (!state.hasProperty) return 0;
      if (state.economicCycle === 0) return 0.15; // 繁荣期15%
      if (state.economicCycle === 1) return 0.05; // 平稳期5%
      return 0; // 萧条期不会涨
    },
    condition: (state: GameState) => state.hasProperty,
    effect: (state: GameState) => {
      const rate = 1.05 + Math.random() * 0.15; // +5%~+20%
      const gain = Math.round(state.propertyValue * (rate - 1));
      state.propertyValue = Math.round(state.propertyValue * rate);
      state.happiness = Math.min(100, state.happiness + 5);
      return { log: `第${state.currentAge}岁，你小区旁边要建地铁了，房价一夜之间涨了不少。你打开房产APP看了看，自己的房子估值涨了${gain.toLocaleString()}元。虽然不打算卖，但看着数字往上涨还是忍不住笑了。`, loss: -gain };
    },
  },
  // 事件：房屋损坏（有房时触发）
  {
    id: 'house_damage',
    eventName: '房屋损坏',
    description: '楼上漏水/管道爆裂/外墙脱落',
    probability: (state: GameState) => state.hasProperty ? 0.05 : 0,
    condition: (state: GameState) => state.hasProperty,
    effect: (state: GameState) => {
      const roll = Math.random();
      if (roll < 0.50) {
        // 小修
        const cost = 2000 + Math.floor(Math.random() * 3000);
        state.currentSavings -= cost;
        state.stress = Math.min(100, state.stress + 3);
        return { log: `第${state.currentAge}岁，楼上邻居家的水管爆了，你家天花板遭了殃。物业协调赔偿了一半，你自费${cost}元修好了天花板。`, loss: cost };
      } else {
        // 大修
        const cost = 8000 + Math.floor(Math.random() * 12000);
        state.currentSavings -= cost;
        state.stress = Math.min(100, state.stress + 8);
        state.happiness = Math.max(0, state.happiness - 3);
        return { log: `第${state.currentAge}岁，一场暴雨后你发现外墙渗水，墙皮大面积脱落。找了施工队来修，花了${cost}元。你站在脚手架旁边想，买了房才知道，房子的钱永远花不完。`, loss: cost };
      }
    },
  },

  // ========== 机遇事件（失业/低谷时的转机）==========

  // 事件13：前同事内推好机会
  {
    id: 'opportunity_referral',
    eventName: '前同事内推好机会',
    description: '一个许久不联系的前同事突然发来消息，说他们公司正在招人。',
    probability: (state: GameState) => {
      if (!state.isUnemployed) return 0;
      // 失业越久概率越高（但不会无限涨）
      const unempYears = Math.min(3, Math.floor((state.currentSavings < state.preUnemployedSalary * 6 ? 3 : 1)));
      let base = 0.12 + unempYears * 0.05;
      if (state.isUpskilled) base += 0.10; // 进修过更容易被推
      if (state.economicCycle === 0) base += 0.10; // 经济繁荣期机会多
      if (state.economicCycle === 2) base -= 0.05; // 萧条期少
      if (state.friends.length === 0) base *= 0.3; // 没朋友没人推
      return Math.min(0.45, base);
    },
    condition: (state: GameState) => state.isUnemployed && state.currentAge < 55,
    effect: (state: GameState) => {
      const roll = Math.random();
      // 内推成功率：不是推了就成
      if (roll < 0.35) {
        // 大成功：薪资甚至超过之前
        state.isUnemployed = false;
        state.currentProfession = state.preUnemployedSalary > 20000 ? '红利行业' : '传统私企';
        state.currentMonthlySalary = Math.round(state.preUnemployedSalary * (1.0 + Math.random() * 0.2));
        state.stress = Math.max(0, state.stress - 15);
        state.happiness = Math.min(100, state.happiness + 15); // v2：+20→+15
        const log = `第${state.currentAge}岁，一个许久不联系的前同事突然发来消息："我们团队在招人，你要不要试试？"你抱着试试看的心态去面试，居然一路过了。薪资比之前还高了一截，offer到的那天你在楼下便利店买了瓶啤酒，一个人站在路灯下喝了很久。`;
        return { log, loss: 0 };
      } else if (roll < 0.70) {
        // 普通成功：薪资回到之前的80-95%
        state.isUnemployed = false;
        state.currentProfession = '传统私企';
        state.currentMonthlySalary = Math.round(state.preUnemployedSalary * (0.8 + Math.random() * 0.15));
        state.stress = Math.max(0, state.stress - 10);
        state.happiness = Math.min(100, state.happiness + 10);
        const log = `第${state.currentAge}岁，前同事给你推了个岗位。面试聊了两个小时，对方对你挺满意。薪资比之前略低，但至少不用再投简历了。入职第一天你早早到了公司，看着崭新的工牌，心里一块石头落了地。`;
        return { log, loss: 0 };
      } else {
        // 推了但没成
        state.happiness = Math.max(0, state.happiness - 3);
        const log = `第${state.currentAge}岁，前同事热心给你内推了一家公司。你认真准备了一周，面到终面还是挂了。你发消息感谢同事，他回了句"没事，机会还多"。你放下手机，继续刷招聘网站。`;
        return { log, loss: 0 };
      }
    },
  },

  // 事件14：猎头主动联系
  {
    id: 'opportunity_headhunter',
    eventName: '猎头主动联系',
    description: '一个猎头在职业社交网络上找到你，说有个岗位很适合你。',
    probability: (state: GameState) => {
      if (!state.isUnemployed) return 0;
      if (state.currentAge > 45) return 0.03; // 45岁后猎头不怎么找了
      if (state.isUpskilled) return 0.20;
      let base = 0.08;
      if (state.preUnemployedSalary >= 20000) base += 0.08; // 高薪人才更容易被猎
      if (state.economicCycle === 0) base += 0.10;
      if (state.economicCycle === 2) base -= 0.04;
      return Math.min(0.35, base);
    },
    condition: (state: GameState) => state.isUnemployed && state.currentAge < 50,
    effect: (state: GameState) => {
      const roll = Math.random();
      if (roll < 0.30) {
        // 好机会：薪资持平或涨
        state.isUnemployed = false;
        state.currentProfession = '红利行业';
        state.currentMonthlySalary = Math.round(state.preUnemployedSalary * (0.95 + Math.random() * 0.25));
        state.happiness = Math.min(100, state.happiness + 15);
        state.stress = Math.max(0, state.stress - 12);
        const log = `第${state.currentAge}岁，一个猎头在职业社交网络上找到你。你本来没抱希望，没想到对方公司开的条件相当不错。三轮面试后你拿到了offer，薪资不比之前差。你给猎头发了条"谢谢"，他回了个"恭喜，这是你应得的"。`;
        return { log, loss: 0 };
      } else if (roll < 0.60) {
        // 一般机会：薪资低一点
        state.isUnemployed = false;
        state.currentProfession = '传统私企';
        state.currentMonthlySalary = Math.round(state.preUnemployedSalary * (0.7 + Math.random() * 0.15));
        state.happiness = Math.min(100, state.happiness + 5);
        const log = `第${state.currentAge}岁，猎头给你推了个岗位。公司不大，但岗位匹配度还可以。薪资开得比预期低，但你已经投了三个月简历了，决定先接了再说。`;
        return { log, loss: 0 };
      } else {
        // 不靠谱的机会
        state.stress = Math.min(100, state.stress + 3);
        const log = `第${state.currentAge}岁，猎头给你推了个岗位，说得天花乱坠。去了才发现是家不靠谱的创业公司，工资都发不出来。你礼貌地拒绝了，心里暗骂猎头不靠谱。`;
        return { log, loss: 0 };
      }
    },
  },

  // 事件15：副业/自由职业意外起色
  {
    id: 'opportunity_side_hustle',
    eventName: '副业意外起色',
    description: '之前随手做的副业突然有了起色。',
    probability: (state: GameState) => {
      if (!state.isUnemployed && !state.hasSideHustle) return 0;
      if (state.hasSideHustle && state.passiveIncome > 0) return 0.10;
      if (state.isUnemployed) return 0.12;
      return 0;
    },
    condition: (state: GameState) => state.isUnemployed || state.hasSideHustle,
    effect: (state: GameState) => {
      const roll = Math.random();
      if (roll < 0.25) {
        // 大转机：副业变主业，收入甚至超过工资
        const newIncome = Math.round(state.preUnemployedSalary * (0.8 + Math.random() * 0.5));
        state.isUnemployed = false;
        state.currentProfession = '自由职业';
        state.currentMonthlySalary = newIncome;
        state.passiveIncome = Math.max(state.passiveIncome, Math.round(newIncome * 0.3));
        state.happiness = Math.min(100, state.happiness + 15); // v2：+20→+15
        state.stress = Math.max(0, state.stress - 15);
        const log = `第${state.currentAge}岁，你之前随手做的副业突然火了。订单/咨询一个接一个来，你一个人忙不过来。算了算月收入，居然比之前上班还高。你笑了——原来人生的转机，有时候就是无心插柳。`;
        return { log, loss: 0 };
      } else if (roll < 0.65) {
        // 小起色：额外收入（通过loss机制统一处理，不在effect中直接加）
        const bonus = 5000 + Math.floor(Math.random() * 15000);
        state.happiness = Math.min(100, state.happiness + 8);
        const log = `第${state.currentAge}岁，你之前做的小项目/副业意外接到了几个单子，赚了${bonus}元。钱不算多，但至少这个月不用那么焦虑了。你决定继续做下去，说不定哪天就能养活自己。`;
        return { log, loss: -bonus };
      } else {
        // 昙花一现
        state.stress = Math.max(0, state.stress - 2);
        const log = `第${state.currentAge}岁，你做的副业突然有了一单大的，你激动了好几天。但之后又沉寂了。你安慰自己"至少有过希望"。`;
        return { log, loss: 0 };
      }
    },
  },

  // 事件16：老朋友拉你入伙
  {
    id: 'opportunity_friend_venture',
    eventName: '老朋友拉你合伙',
    description: '老朋友打电话说他创业了，想拉你入伙。',
    probability: (state: GameState) => {
      if (!state.isUnemployed) return 0;
      // 有朋友才有人拉
      const hasCloseFriend = state.friends.some(f => f.type === '发小' || f.type === '大学同学');
      if (!hasCloseFriend) return 0.03;
      return 0.10;
    },
    condition: (state: GameState) => state.isUnemployed && state.currentAge >= 28 && state.currentAge < 50,
    effect: (state: GameState) => {
      const roll = Math.random();
      if (roll < 0.20) {
        // 创业成功（小概率）
        state.isUnemployed = false;
        state.currentProfession = '实体创业';
        state.currentMonthlySalary = Math.round(state.preUnemployedSalary * (1.0 + Math.random() * 0.5));
        state.currentSavings += 20000; // v2：从30000降至20000
        state.happiness = Math.min(100, state.happiness + 15); // v2：+20→+15
        state.stress = Math.max(0, state.stress - 10);
        const log = `第${state.currentAge}岁，老朋友打电话说他创业了，缺个靠谱的搭档。你犹豫了很久还是去了。没想到公司发展得不错，第一年你们就实现了盈利。你感慨——人生有时候要赌一把。`;
        return { log, loss: 0 };
      } else if (roll < 0.55) {
        // 勉强维持
        state.isUnemployed = false;
        state.currentProfession = '实体创业';
        state.currentMonthlySalary = Math.round(state.preUnemployedSalary * (0.5 + Math.random() * 0.2));
        state.stress = Math.min(100, state.stress + 5);
        const log = `第${state.currentAge}岁，你加入了朋友的创业公司。钱不多，事不少，但至少不用打卡，也不用看HR脸色。公司还在生死线上挣扎，你告诉自己"先干着看吧"。`;
        return { log, loss: 0 };
      } else {
        // 创业失败，亏了钱
        const loss = 10000 + Math.floor(Math.random() * 20000);
        state.currentSavings -= loss;
        state.stress = Math.min(100, state.stress + 10);
        state.happiness = Math.max(0, state.happiness - 10);
        const log = `第${state.currentAge}岁，你被老朋友拉去合伙创业，还投了${loss}元。半年后公司倒闭了，朋友也联系不上了。你坐在空荡荡的办公室里，不知道该怪谁。`;
        return { log, loss };
      }
    },
  },

  // ========== 暴富黑天鹅事件 ==========
  // 事件17：意外中彩票
  {
    id: 'windfall_lottery_win',
    eventName: '意外中彩票',
    description: '你随手买的彩票居然中了大奖！',
    probability: () => 0.005,
    condition: (state: GameState) => state.currentSavings > 0,
    effect: (state: GameState) => {
      const roll = Math.random();
      if (roll < 0.03) {
        // 3%概率中头奖
        const gain = 5000000;
        state.happiness = Math.min(100, state.happiness + 25); // v2：头奖狂喜+25（从40降低）
        state.stress = Math.max(0, state.stress - 20);
        return { log: `第${state.currentAge}岁，你路过彩票店随手买了一注，号码是机选的。第二天你发现自己中了头奖——${gain.toLocaleString()}元。你盯着屏幕看了十分钟，手在发抖。钱到账的那天，你辞了职，站在阳台上抽了人生中第一根烟。`, loss: -gain };
      } else if (roll < 0.15) {
        // 12%概率中二等奖
        const gain = 200000;
        state.happiness = Math.min(100, state.happiness + 18); // v2：二等奖+18（从25降低）
        return { log: `第${state.currentAge}岁，你买的那注彩票中了二等奖——${gain.toLocaleString()}元。虽然不够财务自由，但足够让你松一口气。你请了假带家人吃了一顿好的，结账的时候不用看菜单价格。`, loss: -gain };
      } else {
        // 85%概率中个小奖
        const gain = 5000 + Math.floor(Math.random() * 20000);
        state.happiness = Math.min(100, state.happiness + 10);
        return { log: `第${state.currentAge}岁，你买的彩票中了${gain.toLocaleString()}元。不多，但足够让这个月的房贷轻松一点。你买了杯平时舍不得喝的咖啡，觉得运气这东西，偶尔也是会眷顾普通人的。`, loss: -gain };
      }
    },
  },
  // 事件18：踩中风口（意外的投资机遇）
  {
    id: 'windfall_market_opportunity',
    eventName: '踩中风口',
    description: '你无意中持有/参与的项目突然成了风口。',
    probability: (state: GameState) => {
      if (state.currentProfession === '红利行业') return 0.03;
      if (state.hasSideHustle || state.speculationPct > 0) return 0.02;
      return 0.01;
    },
    condition: () => true,
    effect: (state: GameState) => {
      const roll = Math.random();
      if (roll < 0.08) {
        // 8%概率真暴富
        const gain = 200000 + Math.floor(Math.random() * 300000);
        state.happiness = Math.min(100, state.happiness + 15); // v2：+20→+15
        return { log: `第${state.currentAge}岁，你几年前随手买的一点股票/币/副业，突然成了风口。媒体上全是它的新闻，动态圈人人都在讨论。你打开账户——涨了${gain.toLocaleString()}元。你关掉手机，去楼下吃了碗面，加了个蛋。`, loss: -gain };
      } else if (roll < 0.30) {
        // 22%概率小赚一笔
        const gain = 20000 + Math.floor(Math.random() * 50000);
        state.happiness = Math.min(100, state.happiness + 10);
        return { log: `第${state.currentAge}岁，你持有的项目突然涨了一波。虽然不是暴富，但也赚了${gain.toLocaleString()}元。你截了个图发了条动态圈又删了——低调也是一种幸福。`, loss: -gain };
      } else {
        // 70%概率只是虚惊一场，风口一过又跌了
        return { log: `第${state.currentAge}岁，你持有的项目突然被媒体报道成了"下一个风口"。你看着账户涨了一天，第二天就跌回去了。你苦笑——风口上飞起来的猪，风一停摔得比谁都惨。`, loss: 0 };
      }
    },
  },
  // 事件19：意外发现值钱老物件
  {
    id: 'windfall_old_item',
    eventName: '意外之财',
    description: '你在老家翻出了一件值钱的东西。',
    probability: () => 0.008,
    condition: (state: GameState) => state.parents.isAlive,
    effect: (state: GameState) => {
      const gain = 50000 + Math.floor(Math.random() * 150000);
      state.happiness = Math.min(100, state.happiness + 15);
      return { log: `第${state.currentAge}岁，回老家整理旧物时，你翻出了一个落满灰的木盒子。里面有几张老邮票、一枚旧戒指，还有一本你爷爷的字帖。拿给行家一看——那枚戒指居然是民国时期的，字帖是名家手迹。你卖了${gain.toLocaleString()}元。你站在老家的院子里，第一次觉得"传家宝"这三个字不只是说说。`, loss: -gain };
    },
  },
];

// 随机触发事件
export function rollRandomEvents(state: GameState): { logs: string[]; totalLoss: number; eventNames: string[]; newAftermath?: AftermathType; aftermathDuration?: number } {
  const logs: string[] = [];
  const eventNames: string[] = [];
  let totalLoss = 0;
  let newAftermath: AftermathType | undefined;
  let aftermathDuration = 0;

  // 先判断常规黑天鹅事件（负面+牛市等），每年最多一个
  const regularEvents = BLACK_SWAN_EVENTS.filter(e => !e.id.startsWith('opportunity_'));
  for (const event of regularEvents) {
    try {
      if (event.condition && !event.condition(state)) continue;
      const prob = event.probability(state);
      if (Math.random() < prob) {
        const result = event.effect(state);
        logs.push(result.log);
        eventNames.push(event.eventName);
        if (result.loss) totalLoss += result.loss;
        if (result.aftermath) {
          newAftermath = result.aftermath;
          aftermathDuration = event.aftermathDuration || 2;
        }
        break; // 常规事件每年最多一个
      }
    } catch {
      // 忽略错误
    }
  }

  // 再单独判断机遇事件（失业时的转机），不受常规事件break影响，但每年也最多一个
  // 如果常规事件已经导致失业，当年不再触发机遇事件（留到下一年）
  const becameUnemployedThisYear = logs.some(log => log.includes('裁员') || log.includes('倒闭') || log.includes('优化'));
  if (!becameUnemployedThisYear) {
    const opportunityEvents = BLACK_SWAN_EVENTS.filter(e => e.id.startsWith('opportunity_'));
    for (const event of opportunityEvents) {
      try {
        if (event.condition && !event.condition(state)) continue;
        const prob = event.probability(state);
        if (Math.random() < prob) {
          const result = event.effect(state);
          logs.push(result.log);
          eventNames.push(event.eventName);
          if (result.loss) totalLoss += result.loss;
          if (result.aftermath && !newAftermath) {
            newAftermath = result.aftermath;
            aftermathDuration = event.aftermathDuration || 2;
          }
          break;
        }
      } catch {
        // 忽略错误
      }
    }
  }

  return { logs, totalLoss, eventNames, newAftermath, aftermathDuration };
}
