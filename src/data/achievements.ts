// ================================================================
//  微成就系统 - 小里程碑给玩家高频多巴胺反馈
// ================================================================
import type { GameState } from '../types/global.d.js';

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  desc: string;
  check: (state: GameState, prev: {
    prevSavings: number;
    prevPassiveIncome: number;
    prevHealth: number;
    prevUnemployed: boolean;
    wasMarried: boolean;
    hadProperty: boolean;
    age: number;
  }) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_10k',
    icon: '💰',
    title: '第一桶金',
    desc: '存款首次突破1万元',
    check: (s, p) => s.currentSavings >= 10000 && p.prevSavings < 10000,
  },
  {
    id: 'first_100k',
    icon: '💵',
    title: '小有积蓄',
    desc: '存款首次突破10万元',
    check: (s, p) => s.currentSavings >= 100000 && p.prevSavings < 100000,
  },
  {
    id: 'first_500k',
    icon: '🏦',
    title: '半百万富翁',
    desc: '存款首次突破50万元',
    check: (s, p) => s.currentSavings >= 500000 && p.prevSavings < 500000,
  },
  {
    id: 'first_1m',
    icon: '👑',
    title: '百万富翁',
    desc: '存款首次突破100万元',
    check: (s, p) => s.currentSavings >= 1000000 && p.prevSavings < 1000000,
  },
  {
    id: 'homeowner',
    icon: '🏠',
    title: '安居乐业',
    desc: '第一次买房',
    check: (s, p) => s.hasProperty && !p.hadProperty,
  },
  {
    id: 'just_married',
    icon: '💒',
    title: '喜结连理',
    desc: '结婚了',
    check: (s, p) => s.isMarried && !p.wasMarried,
  },
  {
    id: 'double_happiness',
    icon: '🎎',
    title: '双喜临门',
    desc: '买房和结婚在同一年发生',
    check: (s, p) => s.hasProperty && !p.hadProperty && s.isMarried && !p.wasMarried,
  },
  {
    id: 'passive_20pct',
    icon: '📈',
    title: '财源广进',
    desc: '被动收入首次覆盖年支出的20%',
    check: (s, p) => {
      const expense = s.annualBaseCost + s.currentMortgageCost + s.insurancePremium;
      const prevExpenseRatio = p.prevPassiveIncome / Math.max(1, expense);
      return s.passiveIncome >= expense * 0.2 && prevExpenseRatio < 0.2;
    },
  },
  {
    id: 'financial_freedom',
    icon: '🦅',
    title: '财务自由',
    desc: '被动收入首次覆盖全部年支出',
    check: (s, p) => {
      const expense = s.annualBaseCost + s.currentMortgageCost + s.insurancePremium;
      return s.passiveIncome >= expense && p.prevPassiveIncome < expense;
    },
  },
  {
    id: 'five_years_married',
    icon: '🪵',
    title: '木婚纪念',
    desc: '结婚满5周年',
    check: (s) => !!s.isMarried && !!s.partner && s.partner.marriedYear > 0 && s.currentAge - s.partner.marriedYear === 5,
  },
  {
    id: 'ten_years_work',
    icon: '💼',
    title: '十年磨一剑',
    desc: '工作满10年（未失业）',
    check: (s, p) => !s.isUnemployed && !p.prevUnemployed && s.currentAge - 22 >= 10,
  },
  {
    id: 'comeback',
    icon: '🔄',
    title: '不倒翁',
    desc: '失业后重新找到工作',
    check: (s, p) => !s.isUnemployed && p.prevUnemployed,
  },
  {
    id: 'minimalist',
    icon: '🍃',
    title: '极简主义者',
    desc: '践行断舍离后年支出低于2万元',
    check: (s) => s.usedMinimalism && s.annualBaseCost < 20000,
  },
  {
    id: 'bull_market_win',
    icon: '🐂',
    title: '牛市幸运儿',
    desc: '单年投资收益超过5万元',
    check: (s, p) => {
      // 估算投资收益 = 存款增量 - 工资 + 支出（粗略判断）
      const savingsDelta = s.currentSavings - p.prevSavings;
      const salary = s.isUnemployed ? 0 : s.currentMonthlySalary * 12;
      const expense = s.annualBaseCost + s.currentMortgageCost + s.insurancePremium;
      const investGain = savingsDelta - salary + expense;
      return investGain > 50000;
    },
  },
  {
    id: 'health_comeback',
    icon: '💪',
    title: '命硬',
    desc: '健康值降到40以下又恢复到70以上',
    check: (s, p) => s.health >= 70 && p.prevHealth < 40,
  },
  {
    id: 'first_crush',
    icon: '😳',
    title: '心动的感觉',
    desc: '第一次遇见喜欢的人',
    check: (s, p) => !!s.partner && s.partner.datingStage === 'crush' && !p.wasMarried,
  },
  {
    id: 'first_date',
    icon: '💕',
    title: '第一次约会',
    desc: '和喜欢的人开始约会',
    check: (s) => !!s.partner && s.partner.datingStage === 'dating' && s.partner.meetYear === s.currentAge - 1,
  },
  {
    id: 'survivor',
    icon: '🛡️',
    title: '大难不死',
    desc: '经历黑天鹅事件后存款仍为正',
    check: (s, p) => s.currentSavings > 0 && p.prevSavings > s.currentSavings * 1.3,
  },
  {
    id: 'debt_free',
    icon: '🎉',
    title: '无债一身轻',
    desc: '还清房贷',
    check: (s) => s.currentMortgageCost === 0 && s.hasProperty && s.propertyValue > 0,
  },
  {
    id: 'age_30',
    icon: '🎂',
    title: '三十而立',
    desc: '迎来了30岁',
    check: (s) => s.currentAge === 30,
  },
];

// 检查本年新解锁的成就
export function checkAchievements(
  state: GameState,
  prev: {
    prevSavings: number;
    prevPassiveIncome: number;
    prevHealth: number;
    prevUnemployed: boolean;
    wasMarried: boolean;
    hadProperty: boolean;
    age: number;
  },
  unlockedIds: Set<string>,
): Achievement[] {
  const newlyUnlocked: Achievement[] = [];
  for (const ach of ACHIEVEMENTS) {
    if (unlockedIds.has(ach.id)) continue;
    try {
      if (ach.check(state, prev)) {
        newlyUnlocked.push(ach);
        unlockedIds.add(ach.id);
      }
    } catch {
      // ignore check errors
    }
  }
  return newlyUnlocked;
}
