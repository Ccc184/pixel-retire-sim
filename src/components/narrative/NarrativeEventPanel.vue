<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../../store/game.store.js'
import { playSelect, playConfirm } from '../../utils/audio.js'
import { showNumericalHints } from '../../utils/ui-prefs.js'
import { fmtSigned, fmt } from '../../utils/format.js'
import type { NarrativeOption } from '../../types/global.d.js'

const store = useGameStore()

const currentEvent = computed(() => store.currentNarrativeEvent)
const selectedOptionId = computed(() => store.selectedNarrativeOptionId)

function isOptionAvailable(option: NarrativeOption): boolean {
  if (!option.prerequisites) return true
  return option.prerequisites(store.state)
}

function getDisabledReason(option: NarrativeOption): string {
  return option.disabledReason || '当前状态不满足条件'
}

function handleSelectOption(optionId: string) {
  const option = currentEvent.value?.options.find(o => o.id === optionId)
  if (!option || !isOptionAvailable(option)) return
  playSelect()
  store.selectNarrativeOption(optionId)
}

function handleCommit() {
  playConfirm()
  store.commitYear()
}

function handleRetire() {
  playConfirm()
  store.chooseRetire()
}

// 财务预估
const estimatedAnnualIncome = computed(() => {
  const s = store.state
  if (s.isUnemployed) return s.passiveIncome
  const salary = s.currentMonthlySalary * 12
  const estInvest = Math.round(s.currentSavings * (s.bankDepositPct / 100) * 0.015)
  return salary + s.passiveIncome + estInvest
})

const estimatedAnnualExpense = computed(() => {
  const s = store.state
  let expense = s.annualBaseCost + s.currentMortgageCost + s.insurancePremium
  const childCost = s.children.reduce((sum, c) => sum + c.monthlyExpense * 12, 0)
  expense += childCost
  const cityMult: Record<string, number> = {
    '资本修罗场': 1.8, '中坚大后方': 1.0, '避风低洼地': 0.4
  }
  expense = expense * (cityMult[s.currentCity] || 1.0)
  return Math.round(expense)
})

const estimatedYearEndSavings = computed(() => {
  const s = store.state
  return s.currentSavings + estimatedAnnualIncome.value - estimatedAnnualExpense.value
})

const estimatedDelta = computed(() => {
  return estimatedYearEndSavings.value - store.state.currentSavings
})

const safetyLevel = computed(() => {
  const ratio = estimatedYearEndSavings.value / Math.max(1, estimatedAnnualExpense.value)
  if (estimatedYearEndSavings.value < 0) return 'danger'
  if (ratio < 0.5) return 'danger'
  if (ratio < 1.5) return 'warning'
  return 'safe'
})

// hint颜色映射
const hintColorMap: Record<string, { color: string; shadow: string }> = {
  positive: { color: 'var(--neon-green)', shadow: '0 0 4px var(--neon-green)' },
  negative: { color: 'var(--neon-pink)', shadow: '0 0 4px var(--neon-pink)' },
  neutral: { color: 'var(--neon-blue)', shadow: '0 0 4px var(--neon-blue)' },
  danger: { color: '#ff4444', shadow: '0 0 4px #ff4444' },
}

// 技能值显示
const skillEntries = computed(() => {
  const skills = store.state.pathSkills
  if (!skills) return []
  return Object.entries(skills).filter(([_, v]) => v > 0)
})

const skillLabels: Record<string, string> = {
  // AI共生者
  aiSkill: 'AI技术',
  promptMastery: '提示词',
  aiTraining: '模型训练',
  // 链上原住民
  tradingSkill: '交易',
  defiSkill: 'DeFi开发',
  communityInfluence: '社区影响',
  // 数字游牧民
  remoteSkill: '远程协作',
  languageSkill: '语言能力',
  crossCulturalSkill: '跨文化',
  // 超级IP
  contentSkill: '内容创作',
  audienceSkill: '受众运营',
  brandSkill: '品牌价值',
  // 银发守夜人
  careSkill: '护理专业',
  managementSkill: '运营管理',
  policySkill: '政策资源',
  // 生物赌徒
  healthOptSkill: '健康优化',
  bioKnowledge: '生物知识',
  investmentSkill: '投资分析',
}
</script>

<template>
  <div class="narrative-panel">
    <!-- 年初独白 -->
    <div v-if="store.state.yearOpeningMonologue" class="year-monologue">
      {{ store.state.yearOpeningMonologue }}
    </div>

    <!-- 技能值显示 -->
    <div v-if="skillEntries.length > 0" class="skill-bar">
      <span
        v-for="[skill, val] in skillEntries"
        :key="skill"
        class="skill-chip"
      >
        {{ skillLabels[skill] || skill }} <strong>{{ val }}</strong>
      </span>
    </div>

    <!-- 财务预警条 -->
    <div class="finance-warning-bar" :class="'warn-' + safetyLevel">
      <span class="warn-icon-main">
        <span class="warn-dot" :class="'dot-' + safetyLevel">●</span>
      </span>
      <span class="warn-label">
        <template v-if="safetyLevel === 'danger'">财务预警</template>
        <template v-else-if="safetyLevel === 'warning'">注意收支</template>
        <template v-else>财务健康</template>
      </span>
      <span class="warn-detail">
        预计年末存款
        <strong :class="estimatedDelta >= 0 ? 'text-green' : 'text-red'">
          {{ fmtSigned(estimatedDelta) }}
        </strong>
        → {{ fmt(Math.round(estimatedYearEndSavings)) }}
      </span>
    </div>

    <!-- 叙事事件展示 -->
    <div v-if="currentEvent" class="event-container">
      <!-- 事件标题 -->
      <div class="event-title-bar">
        <span v-if="currentEvent.eventType === 'crisis'" class="event-type-tag crisis">危机</span>
        <span v-else-if="currentEvent.eventType === 'milestone'" class="event-type-tag milestone">里程碑</span>
        <span v-else-if="currentEvent.eventType === 'branch_select'" class="event-type-tag branch">人生岔路</span>
        <h3 class="event-title">{{ currentEvent.title || '日常' }}</h3>
      </div>

      <!-- 事件叙事文本 -->
      <div class="event-narrative">
        <p v-for="(line, i) in currentEvent.narrative.split('\n')" :key="i">{{ line }}</p>
      </div>

      <!-- 选项区域 -->
      <div class="options-grid" :class="'opts-' + currentEvent.options.length">
        <button
          v-for="option in currentEvent.options"
          :key="option.id"
          class="option-card"
          :class="{
            selected: selectedOptionId === option.id,
            disabled: !isOptionAvailable(option),
          }"
          @click="handleSelectOption(option.id)"
        >
          <div class="option-scanlines" />

          <div class="option-top">
            <span class="option-label">{{ option.label }}</span>
            <span v-if="selectedOptionId === option.id" class="select-dot" />
          </div>

          <div class="option-desc">{{ option.description }}</div>

          <div
            v-if="showNumericalHints"
            class="option-hint"
            :style="{
              color: hintColorMap[option.hintColor]?.color || 'var(--neon-blue)',
              textShadow: hintColorMap[option.hintColor]?.shadow || '0 0 4px var(--neon-blue)',
            }"
          >
            {{ option.hint }}
          </div>

          <div v-if="!isOptionAvailable(option)" class="option-disabled-reason">
            {{ getDisabledReason(option) }}
          </div>
        </button>
      </div>
    </div>

    <!-- 无事件时显示休养生息 -->
    <div v-else class="no-event-container">
      <div class="no-event-icon">🌙</div>
      <h3 class="no-event-title">平静的一年</h3>
      <p class="no-event-desc">
        没有特别的事情发生。你可以选择休养生息，让身心自然恢复。<br>
        有时候，不折腾就是最好的选择。
      </p>
    </div>

    <!-- 操作栏 -->
    <div class="commit-area">
      <!-- 左侧：状态提示（不重复按钮文字） -->
      <div class="action-hint">
        <template v-if="currentEvent && !selectedOptionId">▸ 请先选择一个选项</template>
        <template v-else-if="currentEvent && selectedOptionId">▸ 已选择，可以推进</template>
        <template v-else>▸ 平静的一年</template>
      </div>

      <!-- 右侧：退休按钮（次要，左） -->
      <button
        v-if="store.canRetireNow"
        class="btn-retire"
        @click="handleRetire"
      >
        <span class="btn-arrow">★</span>
        退休
        <span class="btn-arrow">★</span>
      </button>

      <!-- 右侧：主操作按钮（最右） -->
      <button
        class="btn-advance"
        :class="{
          ready: selectedOptionId || !currentEvent,
        }"
        :disabled="!!currentEvent && !selectedOptionId"
        @click="handleCommit"
      >
        <span class="btn-arrow">▶</span>
        {{ currentEvent ? '度过这一年' : '休养生息' }}
        <span class="btn-arrow">▶</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* ============================================================
   主面板 —— 紧凑 v2：填充中列剩余纵向空间，整体可滚动
   ============================================================ */
.narrative-panel {
  flex: 1;
  min-height: 0;
  background: rgba(15, 8, 35, 0.85);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 6px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  width: 100%;
  /* 不使用 backdrop-filter，避免破坏成就浮层的 position:fixed 定位 */
  box-shadow: inset 0 0 18px rgba(0, 212, 255, 0.04);
}

.narrative-panel::-webkit-scrollbar {
  width: 6px;
}
.narrative-panel::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}
.narrative-panel::-webkit-scrollbar-thumb {
  background: rgba(0, 212, 255, 0.3);
  border-radius: 3px;
}
.narrative-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 212, 255, 0.5);
}

/* ============================================================
   年初独白
   ============================================================ */
.year-monologue {
  padding: 5px 12px;
  background: rgba(201, 0, 255, 0.04);
  border-left: 3px solid var(--neon-purple);
  border-radius: 0 4px 4px 0;
  font-size: 11px;
  color: #d0c0e0;
  font-style: italic;
  line-height: 1.5;
  flex-shrink: 0;
}

/* ============================================================
   技能值 —— 低调设计，不抢叙事视觉焦点
   ============================================================ */
.skill-bar {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  flex-shrink: 0;
  opacity: 0.55;
}

.skill-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 5px;
  font-size: 9px;
  color: rgba(180, 185, 200, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.03);
  font-family: 'DotGothic16', monospace;
  letter-spacing: 0.5px;
  transition: opacity 0.2s;
}

.skill-chip:hover {
  opacity: 1;
  color: rgba(220, 225, 240, 0.95);
  border-color: rgba(255, 255, 255, 0.15);
}

.skill-chip strong {
  font-size: 9px;
  font-weight: 400;
  color: rgba(200, 210, 230, 0.6);
}

/* ============================================================
   财务预警条（紧凑）
   ============================================================ */
.finance-warning-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 11px;
  flex-shrink: 0;
}

.finance-warning-bar.warn-safe {
  background: rgba(0, 255, 136, 0.08);
  border: 1px solid rgba(0, 255, 136, 0.3);
}

.finance-warning-bar.warn-warning {
  background: rgba(255, 136, 0, 0.08);
  border: 1px solid rgba(255, 136, 0, 0.3);
}

.finance-warning-bar.warn-danger {
  background: rgba(255, 45, 149, 0.08);
  border: 1px solid rgba(255, 45, 149, 0.3);
}

.warn-icon-main {
  font-size: 12px;
  flex-shrink: 0;
}

.warn-dot {
  font-size: 10px;
}
.dot-safe { color: var(--neon-green); text-shadow: 0 0 6px var(--neon-green); }
.dot-warning { color: var(--neon-orange); text-shadow: 0 0 6px var(--neon-orange); }
.dot-danger { color: var(--neon-pink); text-shadow: 0 0 6px var(--neon-pink); }

.warn-label {
  font-weight: bold;
  letter-spacing: 1px;
  flex-shrink: 0;
}

.warn-safe .warn-label { color: var(--neon-green); }
.warn-warning .warn-label { color: var(--neon-orange); }
.warn-danger .warn-label { color: var(--neon-pink); }

.warn-detail {
  color: #c2c3c7;
  margin-left: auto;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.text-green { color: var(--neon-green); }
.text-red { color: var(--neon-pink); }

/* ============================================================
   事件容器
   ============================================================ */
.event-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.event-title-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.event-type-tag {
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 2px;
  letter-spacing: 1px;
  font-weight: bold;
  font-family: 'DotGothic16', monospace;
  flex-shrink: 0;
}

.event-type-tag.crisis {
  color: #ff4444;
  background: rgba(255, 68, 68, 0.15);
  border: 1px solid #ff4444;
  text-shadow: 0 0 4px #ff4444;
}

.event-type-tag.milestone {
  color: var(--neon-green);
  background: rgba(0, 255, 136, 0.15);
  border: 1px solid var(--neon-green);
  text-shadow: 0 0 4px var(--neon-green);
}

.event-type-tag.branch {
  color: var(--neon-orange);
  background: rgba(255, 136, 0, 0.15);
  border: 1px solid var(--neon-orange);
  text-shadow: 0 0 4px var(--neon-orange);
}

.event-title {
  font-size: 14px;
  color: #fff;
  margin: 0;
  letter-spacing: 1px;
  text-shadow: 0 0 6px rgba(255, 255, 255, 0.2);
  flex: 1;
  min-width: 0;
  word-break: break-word;
}

.event-narrative {
  padding: 8px 12px;
  background: rgba(10, 5, 25, 0.5);
  border: 1px solid rgba(201, 0, 255, 0.15);
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.7;
  color: #d4d0e0;
}

.event-narrative p {
  margin: 0;
}

.event-narrative p + p {
  margin-top: 4px;
}

/* ============================================================
   选项网格
   ============================================================ */
.options-grid {
  display: grid;
  gap: 6px;
}

.options-grid.opts-2 {
  grid-template-columns: 1fr 1fr;
}

.options-grid.opts-3 {
  grid-template-columns: 1fr 1fr 1fr;
}

.options-grid.opts-4 {
  grid-template-columns: 1fr 1fr;
}

@media (max-width: 600px) {
  .options-grid.opts-2,
  .options-grid.opts-3,
  .options-grid.opts-4 {
    grid-template-columns: 1fr;
  }
}

.option-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  background: rgba(20, 12, 45, 0.9);
  border: 2px solid rgba(0, 212, 255, 0.2);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  overflow: hidden;
  font-family: inherit;
  color: #c2c3c7;
}

.option-card:hover:not(.disabled) {
  border-color: var(--neon-orange);
  background: rgba(255, 136, 0, 0.06);
  transform: translateY(-1px);
}

.option-card.selected {
  border-color: var(--neon-pink);
  background: rgba(255, 45, 149, 0.15);
  box-shadow: 0 0 16px var(--neon-pink), inset 0 0 16px rgba(255, 45, 149, 0.12);
  transform: translateY(-2px);
}

.option-card.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* 选项扫描线 —— 保留但更微妙 */
.option-scanlines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg, transparent 0px, transparent 3px,
    rgba(255, 255, 255, 0.012) 3px, rgba(255, 255, 255, 0.012) 4px
  );
}

.option-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.option-label {
  font-size: 12px;
  font-weight: 700;
  color: #f4f4f4;
  letter-spacing: 1px;
}

.option-card.selected .option-label {
  color: #fff;
  text-shadow: 0 0 6px var(--neon-pink);
}

.select-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--neon-pink);
  box-shadow: 0 0 8px var(--neon-pink);
  animation: dotPulse 1s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes dotPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(0.85); }
}

.option-desc {
  font-size: 10px;
  color: #b0b0c0;
  line-height: 1.4;
}

.option-hint {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.5px;
  font-family: 'DotGothic16', monospace;
  padding-top: 3px;
  border-top: 1px dashed rgba(255, 255, 255, 0.1);
}

.option-disabled-reason {
  font-size: 9px;
  color: #ff6666;
  font-style: italic;
}

/* ============================================================
   无事件 —— 休养生息
   ============================================================ */
.no-event-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px;
  flex: 1;
  justify-content: center;
}

.no-event-icon {
  font-size: 28px;
  opacity: 0.7;
}

.no-event-title {
  font-size: 14px;
  color: var(--neon-blue);
  margin: 0;
  text-shadow: 0 0 6px var(--neon-blue);
}

.no-event-desc {
  font-size: 11px;
  color: #94b0c2;
  text-align: center;
  line-height: 1.6;
  margin: 0;
}

/* ============================================================
   操作栏
   ============================================================ */
.commit-area {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(15, 8, 35, 0.85);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  flex-shrink: 0;
}

.action-hint {
  font-size: 10px;
  color: #6a6a8a;
  flex: 1;
  letter-spacing: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 推进按钮（绿色霓虹） */
.btn-advance {
  padding: 8px 16px;
  background: rgba(10, 5, 25, 0.7);
  border: 2px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.3);
  font-size: 13px;
  letter-spacing: 2px;
  cursor: not-allowed;
  transition: all 0.2s;
  font-family: 'DotGothic16', monospace;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.btn-advance.ready {
  background: rgba(0, 30, 10, 0.85);
  border-color: var(--neon-green);
  color: var(--neon-green);
  cursor: pointer;
  box-shadow: 0 0 10px rgba(0, 255, 136, 0.3), inset 0 0 12px rgba(0, 255, 136, 0.1);
  text-shadow: 0 0 8px var(--neon-green);
}

.btn-advance.ready:hover {
  background: rgba(0, 255, 136, 0.15);
  color: #fff;
  border-color: var(--neon-pink);
  box-shadow: 0 0 14px var(--neon-pink), 0 0 28px rgba(255, 45, 149, 0.3);
  transform: scale(1.02);
}

/* 退休按钮（粉色霓虹 + 脉冲） */
.btn-retire {
  padding: 8px 16px;
  background: rgba(50, 10, 30, 0.85);
  border: 2px solid var(--neon-pink);
  color: var(--neon-pink);
  font-size: 13px;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'DotGothic16', monospace;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 4px;
  box-shadow: 0 0 12px rgba(255, 45, 149, 0.4), inset 0 0 12px rgba(255, 45, 149, 0.1);
  text-shadow: 0 0 8px var(--neon-pink);
  animation: retirePulse 2s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes retirePulse {
  0%, 100% { box-shadow: 0 0 12px rgba(255, 45, 149, 0.4), inset 0 0 12px rgba(255, 45, 149, 0.1); }
  50% { box-shadow: 0 0 18px rgba(255, 45, 149, 0.6), inset 0 0 16px rgba(255, 45, 149, 0.15); }
}

.btn-retire:hover {
  background: rgba(255, 45, 149, 0.2);
  color: #fff;
  border-color: #fff;
  box-shadow: 0 0 20px var(--neon-pink), 0 0 40px rgba(255, 45, 149, 0.4);
  transform: scale(1.05);
}

.btn-arrow {
  font-size: 10px;
}
</style>
