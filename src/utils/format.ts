/**
 * 统一的金额格式化工具
 * 设计原则：
 * - 月薪、薪资变动等"千级"数字始终用 ¥X,XXX 精确显示（不用万，避免"0.8万"这种反直觉格式）
 * - 存款、总资产等"万级"大数字自动用 ¥X.X万 显示
 * - 过亿用 ¥X.XX亿
 * - 始终带 ¥ 前缀，保持全局一致
 */

/**
 * 智能金额格式化：小额精确、大额简写
 * < 1万 → ¥8,000 | ≥1万 → ¥15.3万 | ≥1亿 → ¥1.23亿
 */
export function fmt(n: number): string {
  if (n === 0 || n == null) return '¥0';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 100000000) {
    return `${sign}¥${(abs / 100000000).toFixed(2)}亿`;
  }
  if (abs >= 10000) {
    return `${sign}¥${(abs / 10000).toFixed(1)}万`;
  }
  return `${sign}¥${Math.round(abs).toLocaleString('zh-CN')}`;
}

/**
 * 精确金额格式：始终显示到元（用于月薪、薪资变动等千级数字）
 * 例：¥8,000 / ¥1,500 / ¥25,000
 */
export function fmtExact(n: number): string {
  if (n === 0 || n == null) return '¥0';
  const sign = n < 0 ? '-' : '';
  return `${sign}¥${Math.round(Math.abs(n)).toLocaleString('zh-CN')}`;
}

/**
 * 强制万为单位（用于总资产、目标财富等大数字标签）
 * 例：¥15.3万 / ¥120万
 */
export function fmtWan(n: number): string {
  if (n === 0 || n == null) return '¥0万';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 100000000) {
    return `${sign}¥${(abs / 100000000).toFixed(2)}亿`;
  }
  return `${sign}¥${(abs / 10000).toFixed(abs >= 100000 ? 0 : 1)}万`;
}

/**
 * 带正负号的金额（用于存款变化、收支差额）
 * 例：+¥1.2万 / -¥5,000 / +¥300
 */
export function fmtSigned(n: number): string {
  if (n === 0 || n == null) return '¥0';
  const sign = n > 0 ? '+' : '-';
  const abs = Math.abs(n);
  if (abs >= 100000000) {
    return `${sign}¥${(abs / 100000000).toFixed(2)}亿`;
  }
  if (abs >= 10000) {
    return `${sign}¥${(abs / 10000).toFixed(1)}万`;
  }
  return `${sign}¥${Math.round(abs).toLocaleString('zh-CN')}`;
}

/**
 * 薪资变动专用：带上下箭头，始终精确到元
 * 例：↑¥1,000 / ↓¥3,000 / ↑¥500
 */
export function fmtSalaryDelta(n: number): string {
  if (n === 0 || n == null) return '';
  const arrow = n > 0 ? '↑' : '↓';
  return `${arrow}¥${Math.round(Math.abs(n)).toLocaleString('zh-CN')}`;
}

/**
 * 纯数字（无¥），用于已经有上下文说明的场景（如"月薪"后面直接跟数字）
 * <1万 → 8,000 | ≥1万 → 15.3万
 */
export function fmtNum(n: number): string {
  if (n === 0 || n == null) return '0';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 100000000) {
    return `${sign}${(abs / 100000000).toFixed(2)}亿`;
  }
  if (abs >= 10000) {
    return `${sign}${(abs / 10000).toFixed(1)}万`;
  }
  return `${sign}${Math.round(abs).toLocaleString('zh-CN')}`;
}

/**
 * 百分比格式化
 * 例：8% / 12.5% / 0.3%
 */
export function fmtPct(n: number, digits = 0): string {
  return `${n.toFixed(digits)}%`;
}
