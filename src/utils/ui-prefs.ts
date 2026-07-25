/**
 * UI 偏好 —— 数值提示显示开关
 *
 * 设计意图：
 * 正式游玩时隐藏选项的数值影响（如"洞察+8，压力+5，存款+3000"），
 * 让玩家沉浸在剧情中而非算计数字。数值仍在后台通过 stateEffect /
 * skillGains / savingsChange 生效，只是不向玩家展示。
 *
 * 测试时可通过以下方式临时打开：
 *  - URL 参数：?debug=hints
 *  - 键盘快捷键：Ctrl+Shift+H
 *  - localStorage：localStorage.setItem('prs_show_hints', '1')
 */
import { ref } from 'vue'

const STORAGE_KEY = 'prs_show_hints'

function readInitial(): boolean {
  if (typeof window === 'undefined') return false
  // URL 参数优先（一次性，不持久化）
  const params = new URLSearchParams(window.location.search)
  if (params.get('debug') === 'hints') return true
  if (params.get('debug') === 'nohints') return false
  // localStorage 次之
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) return stored === '1'
  } catch {
    // 忽略
  }
  // 默认隐藏
  return false
}

/** 是否向玩家显示选项的数值提示 */
export const showNumericalHints = ref<boolean>(readInitial())

/** 切换数值提示显示（供快捷键调用） */
export function toggleNumericalHints(): void {
  showNumericalHints.value = !showNumericalHints.value
  try {
    localStorage.setItem(STORAGE_KEY, showNumericalHints.value ? '1' : '0')
  } catch {
    // 忽略
  }
}

/**
 * 注册全局快捷键：Ctrl+Shift+H 切换数值提示
 * 在 App.vue 的 onMounted 中调用一次即可。
 */
export function registerHintToggleShortcut(): void {
  if (typeof window === 'undefined') return
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'H' || e.key === 'h')) {
      e.preventDefault()
      toggleNumericalHints()
    }
  })
}
