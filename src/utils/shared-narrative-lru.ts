// shared-narrative-lru.ts — 跨系统叙事文本去重缓存
//
// 背景：关系动态、恋爱事件、日常琐事、回声连锁等系统各自独立生成日志，
// 彼此没有统一的去重/冷却机制，导致玩家在多年里反复读到一模一样的文本
// （如"窝在沙发上看电影"×(3)、"你们吵架了"×(3)）。
//
// 本模块提供一个共享的"最近 N 次渲染文本"LRU 缓存，供上述可重复系统共用，
// 从调度源头杜绝同一文本短期重复。仅作用于可重复的填充文本，
// 不触碰一次性关键事件（求婚/离婚/离世等，它们本身不会短时间重复）。
//
// 用法：数据库外挂多个系统生成日志时，先 filterSharedRecent(logs) 过滤，
// 再写入 lifeLog。新游戏需调用 resetSharedNarrativeLru() 清空。

// 最近渲染窗口大小：窗口内同文本不再重复出现。
// 每年大约产生 4-8 条日志，窗口 40 约覆盖 5-9 年，能显著压低长局中
// 有限事件池的重复回绕（此前 24 在 40 年长局中仍偏短，银发路径等
// 池子较小者重复率偏高）。一次性关键事件（求婚/离世等）本身
// 短时间不会重复，不受本窗口影响。
const RECENT_WINDOW = 40;

const recentKeys: string[] = [];

/** 新游戏/重置时清空缓存，避免上一局残留导致本局漏渲染 */
export function resetSharedNarrativeLru(): void {
  recentKeys.length = 0;
}

/**
 * 归一化文本：去掉数字/名字等变量，仅保留"骨架"，用于判断是否同一文本。
 * 例如"吵架"事件金额不同也该判重；但带具体人名的对白需保留人名以区分角色。
 */
function normalize(text: string): string {
  return text
    // 去掉千分位数字与纯数字（金额/年龄/百分比等）
    .replace(/\d[\d,.]*/g, 'N')
    // 统一中英文冒号/逗号/空格，避免格式差异漏判
    .replace(/[：:：]/g, ':')
    .replace(/[，,、]/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 过滤与最近渲染文本重复的日志（保持原有顺序）。
 * 太短的文本（<6 归一化字符）不判重，避免误杀简短状态提示。
 */
export function filterSharedRecent(logs: string[]): string[] {
  const result: string[] = [];
  for (const log of logs) {
    const key = normalize(log);
    if (key.length < 6) {
      result.push(log);
      continue;
    }
    if (recentKeys.includes(key)) continue; // 最近已渲染过，跳过本轮
    recentKeys.push(key);
    if (recentKeys.length > RECENT_WINDOW) recentKeys.shift();
    result.push(log);
  }
  return result;
}