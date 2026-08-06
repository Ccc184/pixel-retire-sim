// rating.ts — 统一结局评级计算器
//
// 重构目标：消除"路径成功=固定S、路径失败=固定C"的僵硬评级，
// 让所有结局（普通结局 E1-E9 与路径结局 path_success/path_failure）
// 都基于同一套"终局状态"综合评分，从而口径一致、可解释、无矛盾。
//
// 评分维度（满分100）：
//   财务成就(0-60) + 路径赌注(0-10) + 提前退休(0-10) + 生活圆满(0-30) + 生存底线(0-10)
//
// 评级边界：
//   S: >=80  传奇
//   A: >=65  优就
//   B: >=50  安稳
//   C: >=28  艰困
//   D: <28   崩坏

import type { GameState } from '../types/global.d.js';
import { calculateTotalWealth } from './math-engine.js';

export type FinalGrade = 'S' | 'A' | 'B' | 'C' | 'D';

export interface GradeBreakdown {
  total: number;
  grade: FinalGrade;
  parts: {
    financial: number;
    pathBonus: number;
    earlyBonus: number;
    life: number;
    survival: number;
  };
}

/** 财务成就：按"总财富/目标财富"的覆盖率分档（0-60） */
function financialScore(state: GameState): number {
  const target = state.targetWealth || 1;
  const ratio = clamp(calculateTotalWealth(state) / target, 0, 10);
  if (ratio >= 2.5) return 60;
  if (ratio >= 1.5) return 56;
  if (ratio >= 1.0) return 52;
  if (ratio >= 0.7) return 44;
  if (ratio >= 0.45) return 35;
  if (ratio >= 0.25) return 24;
  if (ratio >= 0.1) return 13;
  return 0;
}

/** 路径赌注：路径成功是对"赌未来"的确认，额外加分（0-10） */
function pathBonusScore(state: GameState): number {
  const eid = state.currentEndingId || '';
  if (eid.startsWith('path_success_')) return 10;
  return 0;
}

/** 提前退休：越早退休越体现"自由"成色（0-10） */
function earlyRetireScore(state: GameState): number {
  const hardCap = state.targetAge || 60;
  const yearsEarly = Math.max(0, hardCap - state.currentAge);
  if (yearsEarly >= 15) return 10;
  if (yearsEarly >= 10) return 8;
  if (yearsEarly >= 5) return 5;
  if (yearsEarly >= 1) return 3;
  return 0;
}

/** 生活圆满：幸福+健康+关系（0-30） */
function lifeScore(state: GameState): number {
  const happiness = clamp(state.happiness || 0, 0, 100);
  const health = clamp(state.health || 0, 0, 100);
  const happinessPts = (happiness / 100) * 12;
  const healthPts = (health / 100) * 10;

  // 关系分（0-8）：不苛刻要求"必须结婚生子"，自由/独身也有出路
  let relationPts = 0;
  const partner = state.partner;
  const hasPartner =
    partner && !partner.hasDivorced && partner.datingStage !== 'single';
  if (hasPartner && partner.affection >= 60) relationPts += 3;
  if (state.hasChild) relationPts += 2;
  const closeFriends = (state.friends || []).filter((f) => f.relation > 30).length;
  if (closeFriends >= 2) relationPts += 2;
  if (happiness >= 70) relationPts += 1; // 自我满足也是"关系"的一种

  return round(happinessPts + healthPts + relationPts);
}

/** 生存底线：未破产、未重病、未长期失业（0-10） */
function survivalScore(state: GameState): number {
  let pts = 0;
  if (state.currentSavings >= -300000) pts += 4; // 未破产
  if (!state.hadCriticalIllness) pts += 3; // 未遭重病
  if ((state.totalUnemployedYears || 0) < 5) pts += 3; // 未长期失业
  return pts;
}

/** 计算统一评级与明细 */
export function computeGradeBreakdown(state: GameState): GradeBreakdown {
  const financial = financialScore(state);
  const pathBonus = pathBonusScore(state);
  const earlyBonus = earlyRetireScore(state);
  const life = lifeScore(state);
  const survival = survivalScore(state);
  const total = clamp(financial + pathBonus + earlyBonus + life + survival, 0, 100);

  let grade: FinalGrade;
  if (total >= 80) grade = 'S';
  else if (total >= 65) grade = 'A';
  else if (total >= 50) grade = 'B';
  else if (total >= 28) grade = 'C';
  else grade = 'D';

  return { total, grade, parts: { financial, pathBonus, earlyBonus, life, survival } };
}

/** 便捷方法：只取评级字母 */
export function computeFinalGrade(state: GameState): FinalGrade {
  return computeGradeBreakdown(state).grade;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
function round(v: number): number {
  return Math.round(v * 10) / 10;
}