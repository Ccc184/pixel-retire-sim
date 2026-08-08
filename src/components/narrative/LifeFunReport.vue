<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import type { GameState } from '../../types/global.d.js'
import {
  generateConversionCards,
  generateAnnualReport,
  type ConversionCard,
  type AnnualReport,
} from '../../utils/life-fun.js'

const props = defineProps<{
  state: GameState
  grade: string
  showGrade: boolean
  endingText: string
}>()

const s = computed(() => props.state)

// 评级徽章样式（按评级字母映射颜色与动画，避免依赖父组件 scoped 类）
const gradeStyle = computed(() => {
  const map: Record<string, { color: string; shadow: string; anim?: string }> = {
    S: { color: '#ffec27', shadow: '0 0 8px #ffec27, 0 0 20px #ffec27, 0 0 40px #ff8800, 0 0 80px #ff2d9580, 3px 3px 0 #000', anim: 'gradeS' },
    A: { color: '#00d4ff', shadow: '0 0 8px #00d4ff, 0 0 20px #00d4ff, 0 0 40px #00ff8880, 3px 3px 0 #000', anim: 'gradePulse' },
    B: { color: '#00ff88', shadow: '0 0 8px #00ff88, 0 0 20px #00ff88, 0 0 40px #00d4ff80, 3px 3px 0 #000', anim: 'gradePulse' },
    C: { color: '#ff8800', shadow: '0 0 6px #ff8800, 0 0 14px #ff8800, 3px 3px 0 #000' },
    D: { color: '#ff004d', shadow: '0 0 8px #ff004d, 0 0 20px #ff004d, 0 0 40px #ff2d9580, 3px 3px 0 #000', anim: 'gradeDGlitch' },
  }
  return map[props.grade] || map['B']
})

// 卡片在组件挂载时一次性生成（含随机抽取），保证这一生随机、且展示期间不因状态变化而重排
const cards = ref<ConversionCard[]>(generateConversionCards(s.value))
const report = computed<AnnualReport>(() => generateAnnualReport(s.value))

// 翻牌状态
const flippedSet = ref<Set<number>>(new Set())
function toggleFlip(idx: number) {
  const next = new Set(flippedSet.value)
  if (next.has(idx)) next.delete(idx)
  else next.add(idx)
  flippedSet.value = next
}
function flipAll() {
  if (flippedSet.value.size === cards.value.length) {
    flippedSet.value = new Set()
  } else {
    flippedSet.value = new Set(cards.value.map((_, i) => i))
  }
}

// ====== 自动翻页：翻过去慢、翻回来快，双向灵动 ======
// 每3秒随机翻一张过去（露出背面梗），每1.5秒随机翻回一张（回到正面）
let timerFlip: number | null = null
let timerUnflip: number | null = null

function randomFrom(arr: number[]): number {
  return arr[Math.floor(Math.random() * arr.length)]
}

function flipOneIn() {
  if (cards.value.length === 0) return
  const unflipped: number[] = []
  cards.value.forEach((_, i) => {
    if (!flippedSet.value.has(i)) unflipped.push(i)
  })
  if (unflipped.length === 0) return
  toggleFlip(randomFrom(unflipped))
}

function unflipOneOut() {
  if (cards.value.length === 0) return
  const flipped: number[] = []
  cards.value.forEach((_, i) => {
    if (flippedSet.value.has(i)) flipped.push(i)
  })
  if (flipped.length === 0) return
  toggleFlip(randomFrom(flipped))
}

onMounted(() => {
  timerFlip = window.setInterval(flipOneIn, 3000)
  timerUnflip = window.setInterval(unflipOneOut, 1500)
})
onUnmounted(() => {
  if (timerFlip) window.clearInterval(timerFlip)
  if (timerUnflip) window.clearInterval(timerUnflip)
})
</script>

<template>
  <div class="life-fun">
    <!-- ====== 年度人生报告（可传播海报，放最上面） ====== -->
    <section class="annual-report">
      <div class="ar-bg" />

      <!-- 结局文本（日志摘要），并入年度报告框内 -->
      <div class="ar-log">
        <div class="ar-log-tag">▣ NARRATIVE LOG</div>
        <pre class="ar-log-text">{{ props.endingText }}</pre>
      </div>

      <div class="ar-top">
        <span class="ar-kicker">PIXEL LIFE · ANNUAL REPORT</span>
        <span class="ar-year">{{ report.year }}</span>
      </div>

      <!-- 评级徽章：占位容器防止布局跳跃 -->
      <div class="ar-grade-wrapper">
        <!-- 延迟揭晓，整张结算单的视觉焦点 -->
        <transition name="grade-reveal">
          <div
            v-if="showGrade"
            class="ar-grade"
            :class="gradeStyle.anim || ''"
            :style="{ color: gradeStyle.color, textShadow: gradeStyle.shadow }"
          >
            {{ props.grade }}
          </div>
        </transition>
      </div>

      <div class="ar-title">{{ report.title }}</div>

      <div class="ar-headline">
        <span class="ar-h-num">{{ report.headline }}</span>
        <span class="ar-h-unit">{{ report.headlineUnit }}</span>
      </div>

      <div class="ar-subtitle">{{ report.subtitle }}</div>

      <div class="ar-core">
        <div v-for="(c, i) in report.core" :key="c.label" class="ar-core-item" :style="{ animationDelay: (i * 90) + 'ms' }">
          <div class="ar-core-num">{{ c.value }}<span class="ar-core-unit"> {{ c.unit }}</span></div>
          <div class="ar-core-label">{{ c.label }}</div>
          <div class="ar-core-note">{{ c.note }}</div>
        </div>
      </div>

      <div class="ar-tags">
        <span v-for="t in report.tags" :key="t" class="ar-tag">{{ t }}</span>
      </div>

      <div class="ar-path">
        <span class="ar-path-icon">{{ report.pathIcon }}</span>
        <span class="ar-path-name">{{ report.pathName }}</span>
      </div>

      <div class="ar-summary">{{ report.summary }}</div>
    </section>

    <!-- ====== 数字人生卡片墙（退休购买力 + 一生数字标语 融合） ====== -->
    <section class="fun-section">
      <div class="fun-header">
        <span class="fun-tag">💎 NUMBERS</span>
        <span class="fun-title">数字人生</span>
        <span class="cards-toggle" @click="flipAll">{{ flippedSet.size === cards.length && cards.length > 0 ? '收起' : '全翻' }}</span>
      </div>
      <div class="cards-grid">
        <div
          v-for="(card, idx) in cards"
          :key="idx"
          class="flip-card"
          :class="['card-' + card.cls, card.tag.includes('退休后') ? 'card-tag-retire' : 'card-tag-life', { flipped: flippedSet.has(idx) }]"
          @click="toggleFlip(idx)"
        >
          <div class="flip-inner">
            <div class="flip-face flip-front">
              <div class="card-tag">{{ card.tag }}</div>
              <div class="fc-emoji">{{ card.emoji }}</div>
              <div class="fc-number">{{ card.number }}<span class="fc-unit"> {{ card.unit }}</span></div>
              <div class="fc-title">{{ card.title }}</div>
            </div>
            <div class="flip-face flip-back">
              <div class="fc-emoji-back">{{ card.emoji }}</div>
              <div class="fc-joke">{{ card.joke }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.life-fun {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}

.fun-section {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(201, 0, 255, 0.25);
  border-radius: 4px;
  padding: 12px;
}

.fun-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.fun-tag {
  font-size: 10px;
  color: #c900ff;
  letter-spacing: 2px;
  text-shadow: 0 0 4px #c900ff;
  font-family: 'DotGothic16', monospace;
  flex-shrink: 0;
}

.fun-title {
  font-size: 14px;
  color: #e0e0f0;
  font-weight: bold;
  letter-spacing: 1px;
  flex: 1;
}

/* ====== 数字人生卡片墙 ====== */
.cards-toggle {
  font-size: 12px;
  color: #c900ff;
  letter-spacing: 1px;
  text-shadow: 0 0 6px rgba(201, 0, 255, 0.5);
  padding: 4px 12px;
  border: 1px solid rgba(201, 0, 255, 0.4);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  flex-shrink: 0;
}
.cards-toggle:hover { background: rgba(201, 0, 255, 0.15); }

.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.flip-card {
  perspective: 800px;
  height: 140px;
  cursor: pointer;
}

.flip-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.flip-card.flipped .flip-inner { transform: rotateY(180deg); }

.flip-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 2px solid;
  border-radius: 6px;
  background: rgba(15, 8, 35, 0.9);
  padding: 8px 4px;
}

.flip-back { transform: rotateY(180deg); }

/* 卡片颜色 */
.card-orange, .card-orange .flip-face { border-color: #ff8800; box-shadow: 0 0 12px rgba(255, 136, 0, 0.25); }
.card-pink, .card-pink .flip-face { border-color: #ff2d95; box-shadow: 0 0 12px rgba(255, 45, 149, 0.25); }
.card-cyan, .card-cyan .flip-face { border-color: #00d4ff; box-shadow: 0 0 12px rgba(0, 212, 255, 0.25); }
.card-purple, .card-purple .flip-face { border-color: #c900ff; box-shadow: 0 0 12px rgba(201, 0, 255, 0.25); }
.card-yellow, .card-yellow .flip-face { border-color: #ffec27; box-shadow: 0 0 12px rgba(255, 236, 39, 0.25); }
.card-green, .card-green .flip-face { border-color: #00ff88; box-shadow: 0 0 12px rgba(0, 255, 136, 0.25); }
.card-danger, .card-danger .flip-face { border-color: #ff004d; box-shadow: 0 0 12px rgba(255, 0, 77, 0.25); }

/* 正面 */
.card-tag {
  position: absolute;
  top: 4px;
  left: 6px;
  font-size: 10px;
  color: #94b0c2;
  letter-spacing: 1px;
  opacity: 0.9;
  padding: 1px 5px;
  border-radius: 3px;
  border: 1px solid;
  line-height: 1.4;
}

/* 来源区分：退休后 青色 / 这一生 金色 */
.card-tag-retire .card-tag { color: #00d4ff; border-color: rgba(0, 212, 255, 0.4); background: rgba(0, 212, 255, 0.08); }
.card-tag-life .card-tag { color: #ffec27; border-color: rgba(255, 236, 39, 0.4); background: rgba(255, 236, 39, 0.08); }

.fc-emoji {
  font-size: 30px;
  line-height: 1;
  filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.3));
}

.fc-number {
  font-size: 24px;
  font-weight: bold;
  line-height: 1.1;
  letter-spacing: 1px;
}

.fc-unit {
  font-size: 13px;
  font-weight: normal;
  opacity: 0.8;
}

.card-orange .fc-number { color: #ff8800; text-shadow: 0 0 12px rgba(255, 136, 0, 0.6); }
.card-pink .fc-number { color: #ff2d95; text-shadow: 0 0 12px rgba(255, 45, 149, 0.6); }
.card-cyan .fc-number { color: #00d4ff; text-shadow: 0 0 12px rgba(0, 212, 255, 0.6); }
.card-purple .fc-number { color: #c900ff; text-shadow: 0 0 12px rgba(201, 0, 255, 0.6); }
.card-yellow .fc-number { color: #ffec27; text-shadow: 0 0 12px rgba(255, 236, 39, 0.6); }
.card-green .fc-number { color: #00ff88; text-shadow: 0 0 12px rgba(0, 255, 136, 0.6); }
.card-danger .fc-number { color: #ff004d; text-shadow: 0 0 12px rgba(255, 0, 77, 0.6); }

.fc-title {
  font-size: 12px;
  color: #b0a0c0;
  letter-spacing: 1px;
  text-align: center;
  line-height: 1.3;
}

/* 背面 */
.fc-emoji-back { font-size: 26px; opacity: 0.7; }

.fc-joke {
  font-size: 12px;
  color: #ffccaa;
  text-align: center;
  line-height: 1.5;
  padding: 0 6px;
}

/* ====== 年度人生报告（网易云风格海报） ====== */
.annual-report {
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  padding: 18px 16px 16px;
  background: linear-gradient(160deg, #1a0b3a 0%, #2a1058 45%, #4a1a78 100%);
  border: 1px solid rgba(201, 0, 255, 0.4);
  box-shadow: 0 0 24px rgba(201, 0, 255, 0.18), inset 0 0 40px rgba(0, 0, 0, 0.35);
  color: #fff;
  text-align: center;
}

/* 背景装饰光斑 */
.ar-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 15% 20%, rgba(0, 212, 255, 0.18), transparent 40%),
    radial-gradient(circle at 85% 25%, rgba(255, 45, 149, 0.18), transparent 40%),
    radial-gradient(circle at 50% 90%, rgba(255, 236, 39, 0.10), transparent 45%);
}

/* 结局文本（并入年度报告框顶部） */
.ar-log {
  position: relative;
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(201, 0, 255, 0.3);
  box-shadow: inset 0 0 12px rgba(201, 0, 255, 0.12), 0 0 6px rgba(201, 0, 255, 0.15);
  border-radius: 8px;
  margin-bottom: 14px;
  text-align: left;
  overflow: hidden;
}

.ar-log-tag {
  padding: 6px 12px;
  font-size: 10px;
  color: #c900ff;
  letter-spacing: 2px;
  text-shadow: 0 0 4px #c900ff;
  font-family: 'DotGothic16', monospace;
  background: rgba(201, 0, 255, 0.12);
  border-bottom: 1px solid rgba(201, 0, 255, 0.2);
}

.ar-log-text {
  font-family: 'DotGothic16', monospace;
  font-size: 13px;
  line-height: 1.9;
  color: #ffccaa;
  white-space: pre-wrap;
  word-wrap: break-word;
  letter-spacing: 0.5px;
  padding: 12px 14px;
  margin: 0;
  max-height: 240px;
  overflow-y: auto;
  text-shadow: 0 0 2px rgba(255, 204, 170, 0.3);
}

.ar-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  position: relative;
}

.ar-kicker {
  font-size: 10px;
  letter-spacing: 2px;
  color: #c9a8ff;
  font-family: 'DotGothic16', monospace;
}

.ar-year {
  font-size: 22px;
  font-weight: bold;
  color: #ffec27;
  text-shadow: 0 0 12px rgba(255, 236, 39, 0.6);
  font-family: 'DotGothic16', monospace;
}

.ar-title {
  font-size: 16px;
  font-weight: bold;
  letter-spacing: 3px;
  color: #ffffff;
  margin-bottom: 12px;
  position: relative;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.ar-headline {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  margin-bottom: 6px;
  position: relative;
  animation: arHeadlineIn 0.6s ease both;
}

@keyframes arHeadlineIn {
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
}

.ar-h-num {
  font-size: 44px;
  font-weight: bold;
  line-height: 1;
  background: linear-gradient(90deg, #ffec27, #ff8800, #ff2d95);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 14px rgba(255, 136, 0, 0.5));
  font-family: 'DotGothic16', monospace;
}

.ar-h-unit {
  font-size: 12px;
  color: #c9a8ff;
  letter-spacing: 1px;
}

.ar-subtitle {
  font-size: 12px;
  color: #ffccaa;
  margin-bottom: 14px;
  position: relative;
  letter-spacing: 1px;
}

.ar-core {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 14px;
  position: relative;
}

.ar-core-item {
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 10px 8px;
  animation: arCoreIn 0.5s ease both;
}

@keyframes arCoreIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.ar-core-num {
  font-size: 20px;
  font-weight: bold;
  color: #00ff88;
  text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
  font-family: 'DotGothic16', monospace;
  line-height: 1.1;
}

.ar-core-unit {
  font-size: 11px;
  font-weight: normal;
  color: #94b0c2;
}

.ar-core-label {
  font-size: 10px;
  color: #c9a8ff;
  letter-spacing: 1px;
  margin-top: 2px;
}

.ar-core-note {
  font-size: 10px;
  color: #94b0c2;
  margin-top: 2px;
  line-height: 1.3;
}

.ar-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  margin-bottom: 14px;
  position: relative;
}

.ar-tag {
  font-size: 10px;
  padding: 3px 10px;
  border-radius: 20px;
  background: rgba(0, 212, 255, 0.12);
  border: 1px solid rgba(0, 212, 255, 0.4);
  color: #7fe9ff;
  letter-spacing: 1px;
  font-family: 'DotGothic16', monospace;
}

.ar-path {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 10px;
  position: relative;
}

.ar-path-icon {
  font-size: 22px;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.4));
}

.ar-path-name {
  font-size: 14px;
  font-weight: bold;
  color: #ff2d95;
  letter-spacing: 2px;
  text-shadow: 0 0 10px rgba(255, 45, 149, 0.5);
}

.ar-summary {
  font-size: 12px;
  color: #ffffff;
  letter-spacing: 1px;
  position: relative;
  padding-top: 10px;
  border-top: 1px dashed rgba(255, 255, 255, 0.2);
  line-height: 1.5;
}

/* ====== 结算单内评级徽章 ====== */
.ar-grade-wrapper {
  min-height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 6px 0;
}

.ar-grade {
  font-size: 72px;
  line-height: 1;
  letter-spacing: 4px;
  font-weight: bold;
  font-family: 'DotGothic16', monospace;
  margin: 2px 0 6px;
  position: relative;
}

/* 评级揭晓动画 */
.grade-reveal-enter-active {
  transition: all 0.9s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.grade-reveal-enter-from {
  opacity: 0;
  transform: scale(0.2) rotate(-15deg);
  filter: blur(6px);
}
.grade-reveal-enter-to {
  opacity: 1;
  transform: scale(1) rotate(0deg);
  filter: blur(0);
}

/* 评级持续动画 */
.ar-grade.gradeS {
  animation: arGradeS 2s ease-in-out infinite;
}
@keyframes arGradeS {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.ar-grade.gradePulse {
  animation: arGradePulse 2.5s ease-in-out infinite;
}
@keyframes arGradePulse {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.3); }
}

.ar-grade.gradeDGlitch {
  animation: arGradeDGlitch 0.5s ease-in-out infinite;
}
@keyframes arGradeDGlitch {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(-2px, 0); }
  40% { transform: translate(2px, 0); }
}

@media (max-width: 520px) {
  .cards-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>