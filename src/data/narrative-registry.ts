/**
 * 叙事事件注册中心（独立模块，打破循环依赖）
 *
 * 所有路径的叙事数据文件通过 registerNarrativeEvents 注册事件，
 * narrative-events.ts 通过 getAllExtraEvents 获取已注册的事件。
 */
import type { NarrativeEvent } from '../types/global.d.js';

const extraEventArrays: NarrativeEvent[][] = [];

export function registerNarrativeEvents(events: NarrativeEvent[]) {
  extraEventArrays.push(events);
}

export function getAllExtraEvents(): NarrativeEvent[] {
  return extraEventArrays.flat();
}
