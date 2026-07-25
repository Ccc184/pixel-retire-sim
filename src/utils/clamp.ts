/**
 * 数值钳制函数：将 val 限制在 [min, max] 区间内
 * 无任何外部依赖，可安全被任何模块引用
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
