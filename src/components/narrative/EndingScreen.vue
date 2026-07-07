<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameStore } from '../../store/game.store.js'
import type { Ending } from '../../types/global.d.js'
import LifeTimeBill from './LifeTimeBill.vue'

const store = useGameStore()

const endingInfo = computed<Ending | null>(() => store.getEndingInfo())
const endingText = computed<string>(() => store.getEndingText())

type Grade = 'S' | 'A' | 'B' | 'C' | 'D'

const gradeConfig: Record<Grade, { color: string; glow1: string; glow2: string; glow3: string; cls: string }> = {
  S: {
    color: '#ffec27',
    glow1: '#ffec27',
    glow2: '#ff8800',
    glow3: '#ff2d95',
    cls: 'grade-s',
  },
  A: {
    color: '#00d4ff',
    glow1: '#00d4ff',
    glow2: '#00ff88',
    glow3: '#c900ff',
    cls: 'grade-a',
  },
  B: {
    color: '#00ff88',
    glow1: '#00ff88',
    glow2: '#00d4ff',
    glow3: '#c900ff',
    cls: 'grade-b',
  },
  C: {
    color: '#ff8800',
    glow1: '#ff8800',
    glow2: '#94b0c2',
    glow3: '#5f574f',
    cls: 'grade-c',
  },
  D: {
    color: '#ff004d',
    glow1: '#ff004d',
    glow2: '#ff2d95',
    glow3: '#7e2553',
    cls: 'grade-d',
  },
}

const finalSavings = computed<number>(() => store.state.currentSavings)
const finalAssets = computed<number>(() => store.totalWealth)
const yearsWorked = computed<number>(() => store.state.totalYearsWorked)
const yearsUnemployed = computed<number>(() => store.state.totalUnemployedYears)
const finalHealth = computed<number>(() => Math.round(store.state.health))
const finalStress = computed<number>(() => Math.round(store.state.stress))
const finalHappiness = computed<number>(() => Math.round(store.state.happiness))

function stateColor(val: number, type: 'health' | 'stress' | 'happiness'): string {
  if (type === 'health') {
    if (val >= 70) return '#00ff88'
    if (val >= 40) return '#ff8800'
    return '#ff2d95'
  }
  if (type === 'stress') {
    if (val >= 70) return '#ff2d95'
    if (val >= 40) return '#ff8800'
    return '#00ff88'
  }
  if (val >= 70) return '#00ff88'
  if (val >= 40) return '#ffec27'
  return '#ff2d95'
}

function formatMoney(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 100000000) {
    return (n / 100000000).toFixed(2).replace(/\.?0+$/, '') + '亿'
  }
  if (abs >= 10000) {
    return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万'
  }
  return Math.round(n).toLocaleString()
}

function handleRestart(): void {
  store.resetGame()
}

// 人生总账单区域引用
const billSection = ref<HTMLElement | null>(null)

// 人生总账单显示控制
const showBill = ref(false)

// 查看退休生活：展开/收起账单弹窗
function handleViewRetire(): void {
  showBill.value = !showBill.value
}
</script>

<template>
  <div class="ending-overlay">
    <!-- 背景粒子/扫描线 -->
    <div class="overlay-scanlines" />
    <div class="overlay-vignette" />

    <div
      v-if="endingInfo"
      class="ending-modal"
      :class="gradeConfig[endingInfo.grade as Grade].cls"
      role="dialog"
      aria-modal="true"
    >
      <!-- 多层霓虹边框装饰 -->
      <div class="border-layer border-outer" />
      <div class="border-layer border-mid" />
      <div class="border-layer border-inner" />
      <div class="border-corners">
        <span class="bc bc-tl" />
        <span class="bc bc-tr" />
        <span class="bc bc-bl" />
        <span class="bc bc-br" />
      </div>

      <!-- 标题装饰 -->
      <div class="ending-header-deco">
        <span class="deco-line" />
        <span class="deco-text">◆ ENDING ◆</span>
        <span class="deco-line" />
      </div>

      <!-- 评级与标题 -->
      <div class="ending-header">
        <div
          class="grade-badge"
          :class="gradeConfig[endingInfo.grade as Grade].cls"
        >
          {{ endingInfo.grade }}
        </div>
        <h2 class="ending-name">
          {{ endingInfo.title }} · {{ endingInfo.name }}
        </h2>
      </div>

      <!-- 结局文本（日志摘要区域） -->
      <div class="ending-body">
        <div class="body-header">
          <span class="body-tag">▣ NARRATIVE LOG</span>
        </div>
        <pre class="ending-text">{{ endingText }}</pre>
      </div>

      <!-- 人生总账单（移到独立弹窗，不再嵌在主弹窗里） -->

      <!-- 统计数据 -->
      <div class="ending-stats">
        <div class="stat-item">
          <div class="stat-num num-blue">{{ yearsWorked }}</div>
          <div class="stat-label">工作年限</div>
        </div>
        <div class="stat-item">
          <div class="stat-num num-red">{{ yearsUnemployed }}</div>
          <div class="stat-label">失业年限</div>
        </div>
        <div class="stat-item">
          <div class="stat-num num-green">{{ formatMoney(finalSavings) }}</div>
          <div class="stat-label">最终存款</div>
        </div>
        <div class="stat-item">
          <div class="stat-num num-pink">{{ formatMoney(finalAssets) }}</div>
          <div class="stat-label">最终资产</div>
        </div>
      </div>

      <!-- 身心状态 -->
      <div class="ending-wellbeing">
        <div class="wb-stat-item">
          <span class="wb-stat-label">健康</span>
          <span class="wb-stat-num" :style="{ color: stateColor(finalHealth, 'health'), textShadow: '0 0 6px ' + stateColor(finalHealth, 'health') }">{{ finalHealth }}</span>
        </div>
        <div class="wb-stat-item">
          <span class="wb-stat-label">压力</span>
          <span class="wb-stat-num" :style="{ color: stateColor(finalStress, 'stress'), textShadow: '0 0 6px ' + stateColor(finalStress, 'stress') }">{{ finalStress }}</span>
        </div>
        <div class="wb-stat-item">
          <span class="wb-stat-label">幸福</span>
          <span class="wb-stat-num" :style="{ color: stateColor(finalHappiness, 'happiness'), textShadow: '0 0 6px ' + stateColor(finalHappiness, 'happiness') }">{{ finalHappiness }}</span>
        </div>
      </div>

      <!-- 重新开始 -->
      <div class="ending-footer">
        <button class="btn-retire" @click="handleViewRetire">
          <span class="btn-arrows">{{ showBill ? '▲' : '▼' }}</span>
          {{ showBill ? '收起账单' : '查看退休生活' }}
          <span class="btn-arrows">{{ showBill ? '▲' : '▼' }}</span>
        </button>
        <button class="btn-restart" @click="handleRestart">
          再来一局
        </button>
      </div>

      <!-- D级故障效果层 -->
      <div v-if="endingInfo.grade === 'D'" class="glitch-overlay" />
    </div>

    <!-- 人生总账单独立弹窗 -->
    <div v-if="showBill" class="bill-overlay" @click.self="handleViewRetire">
      <div class="bill-modal">
        <button class="bill-close" @click="handleViewRetire">✕</button>
        <div class="bill-section-header">
          <span class="bill-tag">▣ LIFE TIME BILL</span>
        </div>
        <LifeTimeBill :state="store.state" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.ending-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 24px;
  overflow-y: auto;
}

/* 扫描线覆盖层 */
.overlay-scanlines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px,
    transparent 2px,
    rgba(0, 0, 0, 0.15) 2px,
    rgba(0, 0, 0, 0.15) 4px
  );
  z-index: 1;
}

/* 暗角效果 */
.overlay-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%);
  z-index: 1;
}

.ending-modal {
  position: relative;
  width: min(640px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 28px 24px;
  background: rgba(10, 5, 30, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 2;
  animation: endingPop 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes endingPop {
  0% {
    opacity: 0;
    transform: scale(0.85) translateY(30px);
    filter: blur(4px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
    filter: blur(0);
  }
}

/* 多层霓虹边框 */
.border-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.border-outer {
  border: 2px solid;
  margin: -2px;
}

.border-mid {
  border: 1px solid;
  margin: 4px;
  opacity: 0.6;
}

.border-inner {
  border: 1px dashed;
  margin: 10px;
  opacity: 0.3;
}

/* 像素角装饰 */
.border-corners {
  position: absolute;
  inset: 4px;
  pointer-events: none;
  z-index: 5;
}

.bc {
  position: absolute;
  width: 12px;
  height: 12px;
}
.bc-tl { top: 0; left: 0; border-top: 3px solid; border-left: 3px solid; }
.bc-tr { top: 0; right: 0; border-top: 3px solid; border-right: 3px solid; }
.bc-bl { bottom: 0; left: 0; border-bottom: 3px solid; border-left: 3px solid; }
.bc-br { bottom: 0; right: 0; border-bottom: 3px solid; border-right: 3px solid; }

/* ====== 各级结局颜色配置 ====== */

/* S级：金色+彩虹发光 */
.grade-s {
  border-color: #ffec27;
  box-shadow:
    0 0 10px #ffec27,
    0 0 25px #ffec2780,
    0 0 50px #ff880040,
    0 0 80px #ff2d9520,
    inset 0 0 20px #ffec2720;
  animation: rainbowGlow 3s ease-in-out infinite;
}
.grade-s .border-outer { border-color: #ffec27; box-shadow: 0 0 15px #ffec27; }
.grade-s .border-mid { border-color: #ff8800; }
.grade-s .border-inner { border-color: #ff2d95; }
.grade-s .bc { border-color: #ffec27; }
.grade-s .ending-header-deco .deco-text { color: #ffec27; text-shadow: 0 0 8px #ffec27, 0 0 20px #ff8800; }
.grade-s .ending-header-deco .deco-line { background: linear-gradient(90deg, transparent, #ffec27, transparent); box-shadow: 0 0 6px #ffec27; }

@keyframes rainbowGlow {
  0%, 100% {
    box-shadow: 0 0 10px #ffec27, 0 0 25px #ffec2780, 0 0 50px #ff880040, 0 0 80px #ff2d9520, inset 0 0 20px #ffec2720;
  }
  33% {
    box-shadow: 0 0 12px #00ff88, 0 0 28px #00ff8880, 0 0 55px #00d4ff40, 0 0 85px #c900ff20, inset 0 0 22px #00ff8820;
  }
  66% {
    box-shadow: 0 0 12px #ff2d95, 0 0 28px #ff2d9580, 0 0 55px #c900ff40, 0 0 85px #00d4ff20, inset 0 0 22px #ff2d9520;
  }
}

/* A级：蓝色+绿色发光 */
.grade-a {
  border-color: #00d4ff;
  box-shadow:
    0 0 10px #00d4ff,
    0 0 25px #00d4ff80,
    0 0 50px #00ff8840,
    inset 0 0 20px #00d4ff20;
}
.grade-a .border-outer { border-color: #00d4ff; box-shadow: 0 0 15px #00d4ff; }
.grade-a .border-mid { border-color: #00ff88; }
.grade-a .border-inner { border-color: #c900ff; }
.grade-a .bc { border-color: #00d4ff; }
.grade-a .ending-header-deco .deco-text { color: #00d4ff; text-shadow: 0 0 8px #00d4ff, 0 0 20px #00ff88; }
.grade-a .ending-header-deco .deco-line { background: linear-gradient(90deg, transparent, #00d4ff, transparent); box-shadow: 0 0 6px #00d4ff; }

/* B级：绿色+蓝色发光 */
.grade-b {
  border-color: #00ff88;
  box-shadow:
    0 0 10px #00ff88,
    0 0 25px #00ff8880,
    0 0 50px #00d4ff40,
    inset 0 0 20px #00ff8820;
}
.grade-b .border-outer { border-color: #00ff88; box-shadow: 0 0 15px #00ff88; }
.grade-b .border-mid { border-color: #00d4ff; }
.grade-b .border-inner { border-color: #c900ff; }
.grade-b .bc { border-color: #00ff88; }
.grade-b .ending-header-deco .deco-text { color: #00ff88; text-shadow: 0 0 8px #00ff88, 0 0 20px #00d4ff; }
.grade-b .ending-header-deco .deco-line { background: linear-gradient(90deg, transparent, #00ff88, transparent); box-shadow: 0 0 6px #00ff88; }

/* C级：橙色+灰色 */
.grade-c {
  border-color: #ff8800;
  box-shadow:
    0 0 8px #ff8800,
    0 0 20px #ff880060,
    0 0 40px #5f574f30,
    inset 0 0 15px #ff880015;
}
.grade-c .border-outer { border-color: #ff8800; box-shadow: 0 0 10px #ff8800; }
.grade-c .border-mid { border-color: #94b0c2; }
.grade-c .border-inner { border-color: #5f574f; }
.grade-c .bc { border-color: #ff8800; }
.grade-c .ending-header-deco .deco-text { color: #ff8800; text-shadow: 0 0 6px #ff8800; }
.grade-c .ending-header-deco .deco-line { background: linear-gradient(90deg, transparent, #ff8800, transparent); box-shadow: 0 0 4px #ff8800; }

/* D级：红色+故障闪烁 */
.grade-d {
  border-color: #ff004d;
  box-shadow:
    0 0 10px #ff004d,
    0 0 25px #ff004d80,
    0 0 50px #ff2d9540,
    inset 0 0 20px #ff004d20;
  animation: endingPop 500ms cubic-bezier(0.34, 1.56, 0.64, 1), glitchBorder 0.3s ease-in-out 0.5s 5;
}
.grade-d .border-outer { border-color: #ff004d; box-shadow: 0 0 15px #ff004d; }
.grade-d .border-mid { border-color: #ff2d95; }
.grade-d .border-inner { border-color: #7e2553; }
.grade-d .bc { border-color: #ff004d; }
.grade-d .ending-header-deco .deco-text { color: #ff004d; text-shadow: 0 0 8px #ff004d, 2px 0 0 #ff2d95, -2px 0 0 #00d4ff; }
.grade-d .ending-header-deco .deco-line { background: linear-gradient(90deg, transparent, #ff004d, transparent); box-shadow: 0 0 6px #ff004d; }

@keyframes glitchBorder {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(-2px, 1px); }
  40% { transform: translate(2px, -1px); }
  60% { transform: translate(-1px, -1px); }
  80% { transform: translate(1px, 2px); }
}

/* 故障效果叠加层 */
.glitch-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
  background:
    repeating-linear-gradient(
      0deg,
      transparent 0px,
      rgba(255, 0, 77, 0.03) 1px,
      transparent 2px,
      transparent 4px
    );
  animation: glitchFlash 0.15s ease-in-out infinite;
  mix-blend-mode: overlay;
}

@keyframes glitchFlash {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.7; }
}

/* 标题装饰 */
.ending-header-deco {
  display: flex;
  align-items: center;
  gap: 12px;
}

.deco-line {
  flex: 1;
  height: 1px;
}

.deco-text {
  font-size: 11px;
  letter-spacing: 4px;
  font-weight: bold;
}

.ending-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
}

.grade-badge {
  font-size: 80px;
  line-height: 1;
  letter-spacing: 4px;
  font-weight: bold;
  font-family: 'DotGothic16', monospace;
}

.grade-badge.grade-s {
  color: #ffec27;
  text-shadow:
    0 0 8px #ffec27,
    0 0 20px #ffec27,
    0 0 40px #ff8800,
    0 0 80px #ff2d9580,
    3px 3px 0 #000;
  animation: gradeS 2s ease-in-out infinite;
}

@keyframes gradeS {
  0%, 100% {
    text-shadow: 0 0 8px #ffec27, 0 0 20px #ffec27, 0 0 40px #ff8800, 0 0 80px #ff2d9580, 3px 3px 0 #000;
    transform: scale(1);
  }
  50% {
    text-shadow: 0 0 12px #ffec27, 0 0 30px #ffec27, 0 0 50px #00ff88, 0 0 90px #00d4ff80, 3px 3px 0 #000;
    transform: scale(1.05);
  }
}

.grade-badge.grade-a {
  color: #00d4ff;
  text-shadow:
    0 0 8px #00d4ff,
    0 0 20px #00d4ff,
    0 0 40px #00ff8880,
    3px 3px 0 #000;
  animation: gradePulse 2.5s ease-in-out infinite;
}

.grade-badge.grade-b {
  color: #00ff88;
  text-shadow:
    0 0 8px #00ff88,
    0 0 20px #00ff88,
    0 0 40px #00d4ff80,
    3px 3px 0 #000;
  animation: gradePulse 2.5s ease-in-out infinite;
}

.grade-badge.grade-c {
  color: #ff8800;
  text-shadow:
    0 0 6px #ff8800,
    0 0 14px #ff8800,
    3px 3px 0 #000;
}

.grade-badge.grade-d {
  color: #ff004d;
  text-shadow:
    0 0 8px #ff004d,
    0 0 20px #ff004d,
    0 0 40px #ff2d9580,
    3px 3px 0 #000;
  animation: gradeDGlitch 0.5s ease-in-out infinite;
}

@keyframes gradePulse {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.3); }
}

@keyframes gradeDGlitch {
  0%, 100% {
    text-shadow: 0 0 8px #ff004d, 0 0 20px #ff004d, 0 0 40px #ff2d9580, 3px 3px 0 #000;
    transform: translate(0);
  }
  20% {
    text-shadow: -3px 0 8px #00d4ff, 3px 0 20px #ff004d, 0 0 40px #ff2d9580, 3px 3px 0 #000;
    transform: translate(-2px, 0);
  }
  40% {
    text-shadow: 3px 0 8px #ff2d95, -3px 0 20px #ff004d, 0 0 40px #ff2d9580, 3px 3px 0 #000;
    transform: translate(2px, 0);
  }
}

.ending-name {
  font-size: 22px;
  color: #ffffff;
  margin: 0;
  letter-spacing: 2px;
  text-shadow:
    0 0 6px #ffffff,
    0 0 14px currentColor,
    2px 2px 0 #000;
  text-align: center;
}

/* 结局文本区域 */
.ending-body {
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(201, 0, 255, 0.3);
  box-shadow: inset 0 0 12px rgba(201, 0, 255, 0.1), 0 0 6px rgba(201, 0, 255, 0.2);
  padding: 0;
  max-height: 320px;
  overflow-y: auto;
}

.body-header {
  padding: 6px 12px;
  background: rgba(201, 0, 255, 0.1);
  border-bottom: 1px solid rgba(201, 0, 255, 0.2);
}

.body-tag {
  font-size: 10px;
  color: #c900ff;
  letter-spacing: 2px;
  text-shadow: 0 0 4px #c900ff;
}

.ending-text {
  font-family: 'DotGothic16', monospace;
  font-size: 13px;
  line-height: 1.9;
  color: #ffccaa;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  letter-spacing: 0.5px;
  padding: 14px 16px;
  text-shadow: 0 0 2px rgba(255, 204, 170, 0.3);
}

/* 人生总账单独立弹窗 */
.bill-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.bill-modal {
  position: relative;
  width: min(520px, 95%);
  max-height: 90vh;
  overflow-y: auto;
  background: #0a0a0a;
  border: 1px solid rgba(0, 212, 255, 0.4);
  box-shadow: 0 0 30px rgba(0, 212, 255, 0.15);
  border-radius: 4px;
  padding: 20px;
}

.bill-close {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.2s;
}
.bill-close:hover {
  background: rgba(255, 80, 80, 0.3);
  color: #fff;
}

/* 旧样式保留兼容 */
.ending-bill-wrapper {
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(0, 212, 255, 0.3);
  box-shadow: inset 0 0 12px rgba(0, 212, 255, 0.1), 0 0 6px rgba(0, 212, 255, 0.2);
  padding: 0;
  overflow: hidden;
  scroll-margin-top: 20px;
}

.bill-section-header {
  padding: 6px 12px;
  background: rgba(0, 212, 255, 0.1);
  border-bottom: 1px solid rgba(0, 212, 255, 0.2);
}

.bill-tag {
  font-size: 10px;
  color: #00d4ff;
  letter-spacing: 2px;
  text-shadow: 0 0 4px #00d4ff;
}

/* 统计数据 */
.ending-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

@media (max-width: 520px) {
  .ending-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-item {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(201, 0, 255, 0.25);
  padding: 10px 6px;
  text-align: center;
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.4);
  transition: all 0.2s ease;
}

.stat-item:hover {
  border-color: rgba(0, 212, 255, 0.5);
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.4), 0 0 8px rgba(0, 212, 255, 0.2);
}

.stat-num {
  font-size: 18px;
  letter-spacing: 1px;
  font-weight: bold;
}

.num-blue { color: #00d4ff; text-shadow: 0 0 6px #00d4ff; }
.num-red { color: #ff2d95; text-shadow: 0 0 6px #ff2d95; }
.num-green { color: #00ff88; text-shadow: 0 0 6px #00ff88; }
.num-pink { color: #ff2d95; text-shadow: 0 0 6px #c900ff; }

.stat-label {
  font-size: 11px;
  color: #94b0c2;
  margin-top: 4px;
  letter-spacing: 1px;
}

.ending-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding-top: 8px;
}

/* 查看退休生活按钮 - 主色调大按钮 */
.btn-retire {
  font-size: 16px;
  padding: 14px 36px;
  background: rgba(0, 212, 255, 0.15);
  color: #00d4ff;
  border: 2px solid #00d4ff;
  box-shadow:
    0 0 8px #00d4ff,
    0 0 20px #00d4ff40,
    inset 0 0 12px #00d4ff20;
  letter-spacing: 3px;
  font-family: 'DotGothic16', monospace;
  font-weight: bold;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  transition: all 0.15s ease;
  text-shadow: 0 0 6px #00d4ff;
  position: relative;
  overflow: hidden;
  width: 100%;
  justify-content: center;
}

.btn-retire::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px,
    transparent 3px,
    rgba(255,255,255,0.03) 3px,
    rgba(255,255,255,0.03) 4px
  );
  pointer-events: none;
}

.btn-retire:hover:not(:disabled) {
  background: rgba(0, 212, 255, 0.25);
  color: #fff;
  border-color: #00d4ff;
  box-shadow:
    0 0 12px #00d4ff,
    0 0 28px #00d4ff80,
    0 0 50px #00ff8840,
    inset 0 0 16px #00d4ff30;
  text-shadow: 0 0 8px #00d4ff, 0 0 16px #00d4ff;
  transform: translateY(-2px);
}

.btn-retire:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow:
    0 0 6px #00d4ff,
    0 0 14px #00d4ff60,
    inset 0 0 10px #00d4ff30;
}

/* 再来一局按钮 - 灰色小按钮 */
.btn-restart {
  font-size: 13px;
  padding: 8px 24px;
  background: rgba(100, 100, 100, 0.1);
  color: #94b0c2;
  border: 1px solid #5f574f;
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.3);
  letter-spacing: 2px;
  font-family: 'DotGothic16', monospace;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
}

.btn-restart:hover:not(:disabled) {
  background: rgba(100, 100, 100, 0.2);
  color: #fff;
  border-color: #94b0c2;
  box-shadow: 0 0 6px #94b0c240, inset 0 0 8px rgba(0, 0, 0, 0.3);
}

.btn-restart:active:not(:disabled) {
  transform: translateY(1px);
}

.btn-arrows {
  font-size: 12px;
  opacity: 0.7;
  animation: arrowPulse 1s ease-in-out infinite;
}

.btn-arrows:last-child {
  animation-delay: 0.5s;
}

@keyframes arrowPulse {
  0%, 100% { opacity: 0.4; transform: translateX(0); }
  50% { opacity: 1; transform: translateX(3px); }
}

.btn-arrows:last-child {
  animation-name: arrowPulseRight;
}

@keyframes arrowPulseRight {
  0%, 100% { opacity: 0.4; transform: translateX(0); }
  50% { opacity: 1; transform: translateX(-3px); }
}

/* ---- 身心状态 ---- */
.ending-wellbeing {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(201, 0, 255, 0.25);
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.4);
}

.wb-stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.wb-stat-label {
  font-size: 12px;
  color: #94b0c2;
  letter-spacing: 1px;
}

.wb-stat-num {
  font-size: 22px;
  font-weight: bold;
  font-family: 'DotGothic16', monospace;
  letter-spacing: 1px;
}
</style>
