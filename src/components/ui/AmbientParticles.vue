<script setup lang="ts">
/**
 * 环境氛围粒子层
 *
 * 在游戏主界面背景上渲染一片缓慢漂移的霓虹像素尘埃，
 * 增强"生活剧场"的氛围感。纯 Canvas 实现，性能开销极低。
 * 颜色取自游戏霓虹色板（蓝/紫/粉），随粒子缓慢闪烁下沉。
 */
import { onMounted, onUnmounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

interface Particle {
  x: number
  y: number
  r: number
  vx: number
  vy: number
  alpha: number
  alphaMax: number
  phase: number
  color: string
  twinkle: number
}

const COLORS = ['#00d4ff', '#c900ff', '#ff2d95', '#00ff88', '#ffec27']

let ctx: CanvasRenderingContext2D | null = null
let particles: Particle[] = []
let raf = 0
let running = false
let width = 0
let height = 0

function resize() {
  const canvas = canvasRef.value
  if (!canvas) return
  const parent = canvas.parentElement
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  width = parent ? parent.clientWidth : window.innerWidth
  height = parent ? parent.clientHeight : window.innerHeight
  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = width + 'px'
  canvas.style.height = height + 'px'
  ctx = canvas.getContext('2d')
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  spawn()
}

function spawn() {
  const count = Math.min(60, Math.floor((width * height) / 22000))
  particles = []
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.6 + 0.6,
      vx: (Math.random() - 0.5) * 0.16,
      vy: Math.random() * 0.14 + 0.04,
      alpha: Math.random() * 0.5 + 0.15,
      alphaMax: Math.random() * 0.4 + 0.3,
      phase: Math.random() * Math.PI * 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      twinkle: Math.random() * 2 + 1,
    })
  }
}

function tick() {
  if (!ctx) return
  ctx.clearRect(0, 0, width, height)
  const now = performance.now() / 1000
  for (const p of particles) {
    p.x += p.vx
    p.y += p.vy
    if (p.y > height + 4) { p.y = -4; p.x = Math.random() * width }
    if (p.x > width + 4) p.x = -4
    if (p.x < -4) p.x = width + 4
    // 呼吸闪烁
    const breath = 0.5 + 0.5 * Math.sin(now * p.twinkle + p.phase)
    const a = p.alpha * (0.55 + 0.45 * breath)
    ctx.globalAlpha = Math.max(0, Math.min(1, a))
    ctx.fillStyle = p.color
    ctx.shadowBlur = 4
    ctx.shadowColor = p.color
    ctx.fillRect(p.x, p.y, p.r, p.r)
    ctx.shadowBlur = 0
  }
  raf = requestAnimationFrame(tick)
}

function start() {
  if (running) return
  running = true
  resize()
  raf = requestAnimationFrame(tick)
}

function stop() {
  running = false
  cancelAnimationFrame(raf)
}

onMounted(start)
onUnmounted(stop)
</script>

<template>
  <canvas ref="canvasRef" class="ambient-particles" aria-hidden="true" />
</template>

<style scoped>
.ambient-particles {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
  opacity: 0.55;
}

@media (prefers-reduced-motion: reduce) {
  .ambient-particles {
    display: none;
  }
}
</style>