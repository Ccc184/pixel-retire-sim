// 数据持久化：差分比对 + 空闲写入
import type { GameState } from '../types/global.d.js';
import { BLIND_BOX_OUTCOMES } from '../data/blind-box-outcomes.js';
import { CARD_ECHOS } from '../data/card-echoes.js';

const STORAGE_KEY = 'pixel_retire_save';
let pendingSave: number | null = null;
let lastSavedSnapshot: string = '';

// 核心字段比对（只比对关键资产字段）
const KEY_FIELDS: (keyof GameState)[] = [
  'currentAge', 'currentSavings', 'currentMonthlySalary', 'currentProfession',
  'currentCity', 'isUnemployed', 'isMarried', 'hasChild', 'hasProperty',
  'hasSideHustle', 'annualBaseCost', 'passiveIncome', 'currentMortgageCost'
];

function getSnapshot(state: Partial<GameState>): string {
  const snapshot: Partial<GameState> = {};
  for (const key of KEY_FIELDS) {
    (snapshot as Record<string, unknown>)[key] = state[key];
  }
  return JSON.stringify(snapshot);
}

export function scheduleSave(state: GameState): void {
  const newSnapshot = getSnapshot(state);
  if (newSnapshot === lastSavedSnapshot) {
    return; // 无实质变动，取消写入
  }
  
  if (pendingSave) {
    cancelIdleCallback(pendingSave);
  }
  
  pendingSave = requestIdleCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      lastSavedSnapshot = newSnapshot;
    } catch (e) {
      console.warn('存档失败:', e);
    }
    pendingSave = null;
  }, { timeout: 2000 });
}

export function loadSave(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as GameState;
    // 版本兼容：缺少新字段的旧存档视为无效
    if (!state.parents || !state.friends || state.stress === undefined || !state.usedCardHistory) {
      return null;
    }

    // 清理旧存档中已失效的盲盒条目（outcomeId 已不再定义）
    const validOutcomeIds = new Set(BLIND_BOX_OUTCOMES.map(o => o.id));
    if (state.pendingBlindBoxes) {
      const beforeCount = state.pendingBlindBoxes.length;
      state.pendingBlindBoxes = state.pendingBlindBoxes.filter(
        b => validOutcomeIds.has(b.outcomeId)
      );
      const removed = beforeCount - state.pendingBlindBoxes.length;
      if (removed > 0) {
        console.log(`[存档清理] 移除了 ${removed} 个已失效的盲盒条目`);
      }
    }

    // 清理旧存档中已失效的连锁反应条目（cardId 已不再定义，或缺少 delayYears 字段的旧格式条目）
    const validEchoCardIds = new Set(CARD_ECHOS.map(e => e.triggerCardId));
    if (state.pendingCardEchoes) {
      const beforeCount = state.pendingCardEchoes.length;
      state.pendingCardEchoes = state.pendingCardEchoes.filter(
        e => validEchoCardIds.has(e.cardId) && typeof e.delayYears === 'number'
      );
      const removed = beforeCount - state.pendingCardEchoes.length;
      if (removed > 0) {
        console.log(`[存档清理] 移除了 ${removed} 个已失效或旧格式的连锁反应条目`);
      }
    }

    lastSavedSnapshot = getSnapshot(state);
    return state;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(STORAGE_KEY);
  lastSavedSnapshot = '';
}
