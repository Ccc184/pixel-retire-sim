/**
 * UI 偏好 —— 数值提示显示开关
 *
 * 设计意图：
 * 正式游玩时隐藏选项的数值影响（如"洞察+8，压力+5，存款+3000"），
 * 让玩家沉浸在剧情中而非算计数字。数值仍在后台通过 stateEffect /
 * skillGains / savingsChange 生效，只是不向玩家展示。
 *
 * 该开关默认恒为关闭，且不通过 URL / localStorage 持久化，确保正式游玩
 * 永远隐藏定量后果。仅保留 Ctrl+Shift+H 作为「当前会话内」的临时调试开关，
 * 刷新页面即恢复隐藏，避免误开残留。
 */
import { ref } from 'vue'

/** 是否向玩家显示选项的数值提示（默认恒为隐藏） */
export const showNumericalHints = ref<boolean>(false)

/** 切换数值提示显示（仅供调试，仅当前会话有效，不持久化） */
export function toggleNumericalHints(): void {
  showNumericalHints.value = !showNumericalHints.value
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
