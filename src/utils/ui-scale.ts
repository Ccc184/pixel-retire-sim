// 全局 UI 等比缩放：以 1600x900 为设计基准，按视口成比例放大整个游戏界面
// （CSS `zoom` 会等比放大字体、面板、间距，让大屏观感更充实、字号更大）
const BASE_W = 1600
const BASE_H = 900
// 最小/最大缩放倍数：小屏保持 1 不缩小，超大屏最多放大 1.7 倍
const MIN_SCALE = 1
const MAX_SCALE = 1.7

export function applyUiScale(): void {
  const w = window.innerWidth
  const h = window.innerHeight
  const s = Math.min(w / BASE_W, h / BASE_H)
  const scale = Math.min(Math.max(s, MIN_SCALE), MAX_SCALE)
  const root = document.documentElement
  // `--ui-w` / `--ui-h` 用于抵消 zoom 对容器尺寸的放大，保证缩放后恰好填满一屏
  root.style.setProperty('--ui-scale', scale.toFixed(3))
  root.style.setProperty('--ui-w', `${Math.round(w / scale)}px`)
  root.style.setProperty('--ui-h', `${Math.round(h / scale)}px`)
}

export function initUiScale(): void {
  applyUiScale()
  window.addEventListener('resize', applyUiScale)
}