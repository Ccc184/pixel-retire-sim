<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../../store/game.store.js'
import type { CrossroadEvent } from '../../types/global.d.js'
import { playConfirm, playHover } from '../../utils/audio.js'
import { showNumericalHints } from '../../utils/ui-prefs.js'
import { fmt, fmtExact } from '../../utils/format.js'
import { interpolateText } from '../../utils/text-interpolate.js'

const store = useGameStore()
const s = store.state

const event = computed<CrossroadEvent | null>(() => store.currentCrossroad)

// 解析叙事文本：将 {age}/{startAge}/{years} 占位符替换为实际值，避免硬编码年龄与触发年龄错位
const resolvedNarrative = computed<string>(() => {
  const e = event.value
  if (!e) return ''
  return interpolateText(e.narrative, s)
})

// 解析选项文本（label/description），同样做占位符插值
function resolveOptionText(text: string): string {
  return interpolateText(text || '', s)
}

const optionLetters: Record<number, string> = {
  0: 'A',
  1: 'B',
  2: 'C',
  3: 'D',
}

// 修复#8：财务预估——展示当前财务快照，帮助玩家做决策
const currentSavings = computed(() => s.currentSavings)
const monthlySalary = computed(() => s.currentMonthlySalary)
const monthlyPassiveIncome = computed(() => Math.round((s.passiveIncome || 0) / 12))
const annualMortgage = computed(() => s.currentMortgageCost || 0)
const hasMortgage = computed(() => annualMortgage.value > 0)
const hasCar = computed(() => s.hasCar)

// 年支出预估（基础生活费+房贷+保险+养车+子女）
const annualExpenseEstimate = computed(() => {
  let total = s.annualBaseCost + s.currentMortgageCost + s.insurancePremium
  if (s.hasCar) total += (s as any).annualCarCost || 0
  const children = (s as any).children || []
  for (const child of children) {
    if (child.monthlyExpense) total += child.monthlyExpense * 12
  }
  return total
})

// 年收入预估
const annualIncomeEstimate = computed(() => {
  if (s.isUnemployed) return s.passiveIncome
  return s.currentMonthlySalary * 12 + s.passiveIncome
})

// 年结余预估
const annualNetEstimate = computed(() => annualIncomeEstimate.value - annualExpenseEstimate.value)

// 判断选项是否可用
function isOptionAvailable(option: { prerequisites?: (state: any) => boolean }): boolean {
  if (!option.prerequisites) return true
  try {
    return option.prerequisites(store.state)
  } catch {
    return false
  }
}

function getDisabledReason(option: any): string {
  if (!option.disabledReason) return ''
  try {
    return typeof option.disabledReason === 'function' ? option.disabledReason(store.state) : option.disabledReason
  } catch {
    return '条件不满足'
  }
}

function handleSelect(optionId: string, option: any): void {
  if (option.prerequisites && !option.prerequisites(store.state)) return
  playConfirm()
  store.selectCrossroadOption(optionId)
}
</script>

<template>
  <div v-if="event" class="crossroad-overlay">
    <div class="crossroad-panel">
      <!-- 四角像素装饰 -->
      <div class="pixel-corner corner-tl" />
      <div class="pixel-corner corner-tr" />
      <div class="pixel-corner corner-bl" />
      <div class="pixel-corner corner-br" />

      <!-- 扫描线纹理覆盖 -->
      <div class="scanlines" aria-hidden="true" />

      <!-- 标题区 -->
      <div class="crossroad-header">
        <p class="crossroad-age">◆ 第{{ store.state.currentAge }}岁 ◆ 命运的岔路口 ◆</p>
        <h2 class="crossroad-title">{{ event.title }}</h2>
      </div>

      <!-- 叙事区 -->
      <div class="crossroad-narrative">
        <div class="narrative-bar" aria-hidden="true" />
        <div class="narrative-text">
          <p v-for="(line, idx) in resolvedNarrative.split('\n')" :key="idx">{{ line }}</p>
        </div>
      </div>

      <!-- 修复#8：财务快照——帮助玩家评估选项可行性 -->
      <div class="crossroad-finance-snapshot">
        <div class="finance-snapshot-title">▣ 当前财务状况</div>
        <div class="finance-snapshot-grid">
          <div class="finance-snap-item">
            <span class="snap-label">存款</span>
            <span class="snap-value" :class="currentSavings >= 0 ? 'val-green' : 'val-red'">{{ fmt(currentSavings) }}</span>
          </div>
          <div class="finance-snap-item">
            <span class="snap-label">月薪</span>
            <span class="snap-value val-blue">{{ monthlySalary > 0 ? fmtExact(monthlySalary) : '失业' }}</span>
          </div>
          <div class="finance-snap-item" v-if="monthlyPassiveIncome > 0">
            <span class="snap-label">被动收入</span>
            <span class="snap-value val-green">{{ fmtExact(monthlyPassiveIncome) }}<span class="snap-unit">/月</span></span>
          </div>
          <div class="finance-snap-item" v-if="hasMortgage">
            <span class="snap-label">房贷</span>
            <span class="snap-value val-orange">{{ fmt(annualMortgage) }}<span class="snap-unit">/年</span></span>
          </div>
          <div class="finance-snap-item" v-if="hasCar">
            <span class="snap-label">养车</span>
            <span class="snap-value val-orange">{{ fmt((s as any).annualCarCost || 0) }}<span class="snap-unit">/年</span></span>
          </div>
          <div class="finance-snap-item">
            <span class="snap-label">年结余预估</span>
            <span class="snap-value" :class="annualNetEstimate >= 0 ? 'val-green' : 'val-red'">
              {{ annualNetEstimate >= 0 ? '+' : '' }}{{ fmt(annualNetEstimate) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 选项区 -->
      <div class="crossroad-options" :class="'opts-' + event.options.length">
        <button
          v-for="(option, idx) in event.options"
          :key="option.id"
          class="crossroad-option-btn"
          :class="{ 'option-disabled': !isOptionAvailable(option) }"
          :disabled="!isOptionAvailable(option)"
          @click="handleSelect(option.id, option)"
          @mouseenter="playHover"
        >
          <div class="option-header">
            <span class="option-letter">{{ optionLetters[idx] ?? '' }}</span>
            <span class="option-label">{{ resolveOptionText(option.label) }}</span>
            <span v-if="!isOptionAvailable(option)" class="lock-badge">🔒</span>
          </div>
          <p class="option-description">{{ resolveOptionText(option.description) }}</p>
          <span v-if="showNumericalHints" class="option-hint" :class="'hint-' + option.hintColor">
            {{ option.hint }}
          </span>
          <span v-if="!isOptionAvailable(option) && getDisabledReason(option)" class="option-disabled-reason">
            {{ getDisabledReason(option) }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================================
   全屏遮罩层
   ============================================================ */
.crossroad-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  /* 用子元素 margin:auto 实现垂直居中，避免 align-items:center 在内容超高时
     导致顶部/底部溢出不可滚动（经典 flex 居中 bug） */
  display: flex;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 16px;
  overflow-y: auto;
  animation: crossroadFadeIn 0.35s ease-out;
}

@keyframes crossroadFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* ============================================================
   面板主体
   ============================================================ */
.crossroad-panel {
  position: relative;
  width: min(680px, 100%);
  /* margin:auto 让面板在遮罩层内垂直居中，超高时也能完整滚动到顶部/底部 */
  margin: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 24px 24px;
  background: #0d0e1a;

  /* 外层紫色霓虹 */
  box-shadow:
    0 0 16px var(--neon-purple),
    0 0 40px rgba(201, 0, 255, 0.35),
    0 0 80px rgba(201, 0, 255, 0.15);

  /* 中层蓝色霓虹边框 */
  border: 2px solid var(--neon-blue);
  outline: 1px solid rgba(0, 212, 255, 0.2);
  outline-offset: 4px;

  animation: crossroadSlideIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes crossroadSlideIn {
  from {
    transform: translateY(40px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* ============================================================
   四角像素L形装饰
   ============================================================ */
.pixel-corner {
  position: absolute;
  width: 20px;
  height: 20px;
  pointer-events: none;
}

.pixel-corner.corner-tl {
  top: -2px;
  left: -2px;
  border-top: 3px solid var(--neon-pink);
  border-left: 3px solid var(--neon-pink);
  box-shadow: 0 0 8px var(--neon-pink);
}

.pixel-corner.corner-tr {
  top: -2px;
  right: -2px;
  border-top: 3px solid var(--neon-blue);
  border-right: 3px solid var(--neon-blue);
  box-shadow: 0 0 8px var(--neon-blue);
}

.pixel-corner.corner-bl {
  bottom: -2px;
  left: -2px;
  border-bottom: 3px solid var(--neon-blue);
  border-left: 3px solid var(--neon-blue);
  box-shadow: 0 0 8px var(--neon-blue);
}

.pixel-corner.corner-br {
  bottom: -2px;
  right: -2px;
  border-bottom: 3px solid var(--neon-orange);
  border-right: 3px solid var(--neon-orange);
  box-shadow: 0 0 8px var(--neon-orange);
}

/* ============================================================
   扫描线纹理覆盖
   ============================================================ */
.scanlines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.12) 0px,
    rgba(0, 0, 0, 0.12) 1px,
    transparent 1px,
    transparent 3px
  );
  animation: scanlineBreathe 4s ease-in-out infinite;
}

@keyframes scanlineBreathe {
  0%, 100% {
    opacity: 0.35;
  }
  50% {
    opacity: 0.55;
  }
}

/* ============================================================
   标题区
   ============================================================ */
.crossroad-header {
  position: relative;
  z-index: 2;
  text-align: center;
}

.crossroad-age {
  margin: 0 0 8px 0;
  font-size: 13px;
  letter-spacing: 2px;
  color: var(--neon-pink);
  text-shadow:
    0 0 4px var(--neon-pink),
    0 0 10px var(--neon-pink);
}

.crossroad-title {
  margin: 0;
  font-size: 24px;
  color: #ffffff;
  letter-spacing: 3px;
  text-shadow:
    0 0 8px var(--neon-purple),
    0 0 20px var(--neon-purple),
    0 0 40px rgba(201, 0, 255, 0.5);
}

/* ============================================================
   叙事区
   ============================================================ */
.crossroad-narrative {
  position: relative;
  z-index: 2;
  display: flex;
  gap: 12px;
  max-height: 200px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  padding-right: 4px;
}

.narrative-bar {
  flex-shrink: 0;
  width: 3px;
  background: var(--neon-blue);
  box-shadow: 0 0 6px var(--neon-blue);
  border-radius: 1px;
}

.narrative-text {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  line-height: 1.8;
  color: #ffffff;
  text-shadow: 0 0 3px rgba(255, 255, 255, 0.25);
  word-break: break-word;
}

.narrative-text p {
  margin: 0 0 4px 0;
}

.narrative-text p:last-child {
  margin-bottom: 0;
}

/* ============================================================
   财务快照区（修复#8）
   ============================================================ */
.crossroad-finance-snapshot {
  position: relative;
  z-index: 2;
  padding: 10px 14px;
  background: rgba(0, 30, 20, 0.4);
  border: 1px solid rgba(0, 255, 136, 0.2);
  border-radius: 4px;
}

.finance-snapshot-title {
  font-size: 11px;
  letter-spacing: 2px;
  color: #00ff88;
  text-shadow: 0 0 4px rgba(0, 255, 136, 0.4);
  margin-bottom: 8px;
}

.finance-snapshot-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
}

.finance-snap-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 80px;
}

.snap-label {
  font-size: 10px;
  color: #7a9bb5;
  letter-spacing: 1px;
}

.snap-value {
  font-size: 13px;
  font-weight: bold;
  font-variant-numeric: tabular-nums;
}

.snap-unit {
  font-size: 10px;
  font-weight: normal;
  color: #7a9bb5;
  margin-left: 2px;
}

.val-green { color: #00ff88; text-shadow: 0 0 4px rgba(0, 255, 136, 0.3); }
.val-red { color: #ff2d95; text-shadow: 0 0 4px rgba(255, 45, 149, 0.3); }
.val-blue { color: #00d4ff; text-shadow: 0 0 4px rgba(0, 212, 255, 0.3); }
.val-orange { color: #ff8800; text-shadow: 0 0 4px rgba(255, 136, 0, 0.3); }

/* ============================================================
   选项区
   ============================================================ */
.crossroad-options {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 4个选项时改用2×2网格，压缩纵向高度，避免底部选项被截断 */
.crossroad-options.opts-4 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

@media (max-width: 560px) {
  .crossroad-options.opts-4 {
    grid-template-columns: 1fr;
  }
}

.crossroad-option-btn {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  padding: 14px 16px;
  background: rgba(13, 14, 26, 0.85);
  border: 2px solid var(--neon-blue);
  box-shadow:
    0 0 6px var(--neon-blue),
    inset 0 0 8px rgba(0, 212, 255, 0.1);
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
  font-family: 'DotGothic16', monospace;
  image-rendering: pixelated;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.crossroad-option-btn:hover {
  border-color: var(--neon-orange);
  box-shadow:
    0 0 10px var(--neon-orange),
    0 0 24px rgba(255, 136, 0, 0.4),
    inset 0 0 10px rgba(255, 136, 0, 0.15);
  transform: translateY(-2px);
}

.crossroad-option-btn:active {
  transform: translateY(1px);
  box-shadow:
    0 0 4px var(--neon-orange),
    inset 0 0 8px rgba(255, 136, 0, 0.3);
}

/* 禁用选项 */
.crossroad-option-btn.option-disabled {
  border-color: #333c57;
  box-shadow: none;
  cursor: not-allowed;
  opacity: 0.5;
  background: rgba(13, 14, 26, 0.5);
}

.crossroad-option-btn.option-disabled:hover {
  transform: none;
  border-color: #333c57;
  box-shadow: none;
  opacity: 0.5;
}

.crossroad-option-btn.option-disabled:hover .option-letter {
  background: #333c57;
  box-shadow: none;
}

.crossroad-option-btn.option-disabled:hover .option-label {
  color: #566c86;
  text-shadow: none;
}

.lock-badge {
  margin-left: auto;
  font-size: 14px;
  opacity: 0.7;
}

.option-disabled-reason {
  display: block;
  font-size: 11px;
  color: #ff2d95;
  letter-spacing: 0.5px;
  text-shadow: 0 0 4px rgba(255, 45, 149, 0.4);
  padding-top: 4px;
  border-top: 1px dashed #ff2d9540;
  margin-top: 2px;
}

/* 选项头：序号字母 + 标签 */
.option-header {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.option-letter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  background: var(--neon-blue);
  color: #0d0e1a;
  font-size: 14px;
  font-weight: bold;
  box-shadow: 0 0 6px var(--neon-blue);
}

.option-label {
  font-size: 16px;
  color: #ffffff;
  font-weight: bold;
  letter-spacing: 1px;
  text-shadow: 0 0 4px rgba(255, 255, 255, 0.3);
  flex: 1;
  min-width: 0;
  word-break: break-word;
}

/* 描述 */
.option-description {
  margin: 0;
  font-size: 12px;
  color: #a0a0b0;
  line-height: 1.5;
}

/* 提示 */
.option-hint {
  font-size: 12px;
  letter-spacing: 1px;
}

.hint-positive {
  color: #00ff88;
  text-shadow: 0 0 4px rgba(0, 255, 136, 0.5);
}

.hint-negative {
  color: #ff2d95;
  text-shadow: 0 0 4px rgba(255, 45, 149, 0.5);
}

.hint-neutral {
  color: #00d4ff;
  text-shadow: 0 0 4px rgba(0, 212, 255, 0.5);
}

.hint-danger {
  color: #ff8800;
  text-shadow: 0 0 4px rgba(255, 136, 0, 0.5);
}

/* 选项hover时字母颜色变化 */
.crossroad-option-btn:hover .option-letter {
  background: var(--neon-orange);
  box-shadow: 0 0 8px var(--neon-orange);
}

.crossroad-option-btn:hover .option-label {
  color: var(--neon-orange);
  text-shadow: 0 0 6px var(--neon-orange);
}

/* ============================================================
   响应式微调
   ============================================================ */
@media (max-width: 520px) {
  .crossroad-panel {
    padding: 24px 16px;
    gap: 16px;
  }

  .crossroad-title {
    font-size: 20px;
  }

  .crossroad-option-btn {
    padding: 12px 12px;
  }

  .option-label {
    font-size: 14px;
  }
}
</style>
