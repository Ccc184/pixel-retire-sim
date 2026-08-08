// text-interpolate.ts — 叙事文案的动态占位符插值
//
// 支持占位符：
//   {age}       → 当前实际年龄（state.currentAge）
//   {startAge}  → 玩家选定的起始年龄（state.startAge，默认 22）
//   {years}     → 已度过的年数（state.currentAge - state.startAge）
//
// 用途：把叙事文件里硬编码的绝对年龄替换为占位符，
// 使同一段文案能随玩家选定的起始年龄与当前年龄动态变化。

import type { GameState, NarrativeEvent } from '../types/global.d.js'

/** 对单段文本做占位符插值 */
export function interpolateText(text: string, state: GameState): string {
  if (!text) return text
  const startAge = state.startAge || 22
  const years = Math.max(0, (state.currentAge || 0) - startAge)
  return text
    .replace(/\{age\}/g, String(state.currentAge))
    .replace(/\{startAge\}/g, String(startAge))
    .replace(/\{years\}/g, String(years))
}

/** 深度复制叙事事件，并插值所有面向玩家的文本字段（叙事、选项标签/描述/日志） */
export function interpolateEventText(
  event: NarrativeEvent,
  state: GameState,
): NarrativeEvent {
  return {
    ...event,
    narrative: interpolateText(event.narrative, state),
    options: event.options.map((o) => ({
      ...o,
      label: interpolateText(o.label, state),
      description: interpolateText(o.description, state),
      log: interpolateText(o.log, state),
    })),
  }
}