<script setup lang="ts">
/**
 * 可复用数字动画组件
 *
 * 当传入的 value 变化时：
 *  - 数字从旧值滚动计数到新值（easeOutCubic，快而顺滑）
 *  - 同时触发一次"弹跳 + 发光"反馈动画，强化数值变化的存在感
 *
 * 用法：
 *   <AnimatedNumber :value="savings" :format="fmt" />
 *   <AnimatedNumber :value="health" :format="(n)=>(~~n)+''" />
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = withDefaults(
  defineProps<{
    value: number
    format?: (n: number) => string
    duration?: number
    /** 是否跳过首次渲染动画（默认 true，避免开局全屏抖动） */
    skipInitial?: boolean
  }>(),
  {
    format: (n: number) => String(Math.round(n)),
    duration: 650,
    skipInitial: true,
  },
)

const displayValue = ref(props.value)
const isPulsing = ref(false)
let raf: number | null = null
let pulseTimer: number | null = null
let mounted = false

function animate(from: number, to: number) {
  if (raf) cancelAnimationFrame(raf)
  const start = performance.now()
  const dur = Math.max(200, props.duration)
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / dur)
    // easeOutCubic：起步快、收尾缓，反馈干脆不拖沓
    const eased = 1 - Math.pow(1 - t, 3)
    displayValue.value = from + (to - from) * eased
    if (t < 1) raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)
}

watch(
  () => props.value,
  (v, oldV) => {
    if (!mounted) return
    if (oldV === undefined || !isFinite(oldV)) {
      displayValue.value = v
      return
    }
    if (v === oldV) return
    animate(oldV, v)
    // 弹跳+发光反馈
    isPulsing.value = false
    // 强制重触发动画（先移除类再同步加回）
    requestAnimationFrame(() => {
      isPulsing.value = true
      if (pulseTimer) clearTimeout(pulseTimer)
      pulseTimer = window.setTimeout(() => {
        isPulsing.value = false
      }, 650)
    })
  },
)

onMounted(() => {
  mounted = true
  displayValue.value = props.value
})

onUnmounted(() => {
  if (raf) cancelAnimationFrame(raf)
  if (pulseTimer) clearTimeout(pulseTimer)
})

const formatted = computed(() => props.format(displayValue.value))
</script>

<template>
  <span class="anim-num" :class="{ 'anim-num--pulse': isPulsing }">{{ formatted }}</span>
</template>

<style scoped>
.anim-num {
  display: inline-block;
  font-variant-numeric: tabular-nums;
  transform-origin: center;
}

.anim-num--pulse {
  animation: numPop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes numPop {
  0% {
    transform: scale(1);
    filter: brightness(1);
  }
  25% {
    transform: scale(1.35);
    filter: brightness(1.9);
  }
  55% {
    transform: scale(0.92);
    filter: brightness(1.35);
  }
  75% {
    transform: scale(1.08);
    filter: brightness(1.12);
  }
  100% {
    transform: scale(1);
    filter: brightness(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .anim-num--pulse {
    animation: none;
  }
}
</style>