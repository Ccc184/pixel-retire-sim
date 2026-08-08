<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue'
import { useGameStore } from '../../store/game.store.js'
import { playSelect, playConfirm, playCrisis, playRetirePulse, playHover } from '../../utils/audio.js'
import { showNumericalHints } from '../../utils/ui-prefs.js'
import { fmtSigned, fmt } from '../../utils/format.js'
import { getKnowledge, getTermKnowledge, getKnowledgeCategoryName } from '../../data/knowledge.js'
import type { NarrativeOption } from '../../types/global.d.js'

const store = useGameStore()

const currentEvent = computed(() => store.currentNarrativeEvent)
const selectedOptionId = computed(() => store.selectedNarrativeOptionId)

// 知识卡片：优先使用事件自带的 knowledge 字段，其次按事件id匹配，最后扫描剧情文本中的专业术语
const knowledgeCard = computed(() => {
  const ev = currentEvent.value
  if (!ev) return null
  // 1. 事件自带知识
  if (ev.knowledge) return ev.knowledge
  // 2. 按事件id匹配
  const byId = getKnowledge(ev.id)
  if (byId) return byId
  // 3. 扫描剧情文本 + 选项描述中的专业术语
  const text = [ev.title, ev.narrative, ...(ev.options || []).map(o => `${o.label} ${o.description}`)].join(' ')
  return getTermKnowledge(text)
})
const knowledgeCategoryName = computed(() => {
  if (!knowledgeCard.value) return ''
  return getKnowledgeCategoryName(knowledgeCard.value.category)
})
// 知识卡片折叠状态：默认折叠，避免分散沉浸剧情的玩家注意力
const knowledgeOpen = ref(false)
function toggleKnowledge() {
  knowledgeOpen.value = !knowledgeOpen.value
}
// 切换事件时自动收起，避免上一段剧情的展开卡片残留
watch(() => currentEvent.value?.id, () => {
  knowledgeOpen.value = false
})
// 岔路口是否激活：激活时下层面板不应显示"平静的一年"占位（P0-4修复）
const isCrossroadActive = computed(() => store.showCrossroad)

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
  playRetirePulse()
  store.chooseRetire()
}

// 危机事件出现时播放警报音
watchEffect(() => {
  if (currentEvent.value?.eventType === 'crisis') playCrisis()
})

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
</script>

<template>
  <div class="narrative-panel">
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
          @mouseenter="playHover"
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

      <!-- 知识卡片：置于事件最底部，默认折叠成细提示条，避免打断剧情阅读 -->
      <div v-if="knowledgeCard" class="knowledge-wrap">
        <button
          class="knowledge-toggle"
          :class="{ open: knowledgeOpen }"
          @click="toggleKnowledge"
          @mouseenter="playHover"
        >
          <span class="toggle-icon">{{ knowledgeOpen ? '▾' : '▸' }}</span>
          <span class="toggle-text">{{ knowledgeOpen ? '收起知识点' : '本段剧情蕴含一个知识点' }}</span>
          <span class="toggle-cat" :class="'cat-' + knowledgeCard.category">{{ knowledgeCategoryName }}</span>
        </button>

        <div v-if="knowledgeOpen" class="knowledge-card">
          <div class="knowledge-head">
            <span class="knowledge-badge">知识</span>
            <span class="knowledge-category" :class="'cat-' + knowledgeCard.category">
              {{ knowledgeCategoryName }}
            </span>
            <span class="knowledge-tagline">可迁移到现实</span>
          </div>
          <h4 class="knowledge-title">{{ knowledgeCard.title }}</h4>
          <div class="knowledge-content">{{ knowledgeCard.content }}</div>
          <div v-if="knowledgeCard.tip" class="knowledge-tip">
            <span class="tip-arrow">▶</span>{{ knowledgeCard.tip }}
          </div>
        </div>
      </div>
    </div>

    <!-- 无事件时显示休养生息（岔路口激活时不显示） -->
    <div v-else-if="!isCrossroadActive" class="no-event-container">
      <!-- 本年度已做出岔路口抉择：展示决策剧情，而非"平静的一年" -->
      <template v-if="store.pendingCrossroadStory">
        <div class="no-event-icon">⚡</div>
        <h3 class="no-event-title crossroad-pending-title">命运岔路口 · 你已做出选择</h3>
        <p class="no-event-desc crossroad-decision-text">{{ store.pendingCrossroadStory }}</p>
      </template>
      <template v-else>
        <div class="no-event-icon">🌙</div>
        <h3 class="no-event-title">平静的一年</h3>
        <p class="no-event-desc">
          没有特别的事情发生。你可以选择休养生息，让身心自然恢复。<br>
          有时候，不折腾就是最好的选择。
        </p>
      </template>
    </div>

    <!-- 岔路口激活时的占位提示 -->
    <div v-else class="no-event-container crossroad-pending">
      <div class="no-event-icon">⚡</div>
      <h3 class="no-event-title crossroad-pending-title">命运岔路口</h3>
      <p class="no-event-desc">
        一个重要的抉择正摆在你的面前。你的回答，将改变之后的走向。
      </p>
    </div>

    <!-- 操作栏 -->
    <div class="commit-area">
      <!-- 左侧：状态提示（不重复按钮文字） -->
      <div class="action-hint">
        <template v-if="currentEvent && !selectedOptionId">▸ 请先选择一个选项</template>
        <template v-else-if="currentEvent && selectedOptionId">▸ 已选择，可以推进</template>
        <template v-else-if="store.pendingCrossroadStory">▸ 你已做出选择，可以推进</template>
        <template v-else-if="!isCrossroadActive">▸ 平静的一年</template>
        <template v-else>▸ 命运岔路口</template>
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
        {{ currentEvent || store.pendingCrossroadStory ? '度过这一年' : '休养生息' }}
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
  font-size: 10px;
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
  padding: 12px 16px;
  background: rgba(10, 5, 25, 0.5);
  border: 1px solid rgba(201, 0, 255, 0.15);
  border-radius: 4px;
  font-size: 15px;
  line-height: 1.85;
  color: #e6e2f0;
}

.event-narrative p {
  margin: 0;
}

.event-narrative p + p {
  margin-top: 8px;
}

/* ============================================================
   知识卡片：把剧情翻译成可迁移的理财/心理/职业/健康知识
   ============================================================ */
.knowledge-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 折叠提示条：极细、不抢注意力，渲染为不可点击的按钮式提示 */
.knowledge-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 4px 10px;
  background: rgba(0, 212, 255, 0.05);
  border: 1px dashed rgba(0, 212, 255, 0.25);
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  font-size: 11px;
  color: rgba(0, 212, 255, 0.75);
  letter-spacing: 0.5px;
  transition: all 0.15s;
  text-align: left;
}

.knowledge-toggle:hover {
  background: rgba(0, 212, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.45);
  color: var(--neon-blue);
}

.knowledge-toggle.open {
  border-color: rgba(0, 212, 255, 0.4);
  color: var(--neon-blue);
}

.toggle-icon {
  font-size: 10px;
  flex-shrink: 0;
}

.toggle-text {
  opacity: 0.85;
}

.toggle-cat {
  margin-left: auto;
  font-family: 'DotGothic16', monospace;
  font-size: 10px;
  font-weight: bold;
  padding: 0 4px;
}

.toggle-cat.cat-financial { color: var(--neon-green); }
.toggle-cat.cat-psychology { color: var(--neon-pink); }
.toggle-cat.cat-career { color: var(--neon-orange); }
.toggle-cat.cat-health { color: #ff6b6b; }

.knowledge-card {
  position: relative;
  padding: 10px 12px;
  background: linear-gradient(135deg, rgba(20, 12, 50, 0.9), rgba(10, 5, 30, 0.9));
  border: 1px solid rgba(0, 212, 255, 0.25);
  border-left: 3px solid var(--neon-blue);
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.7;
  color: #d8d4e8;
  overflow: hidden;
}

.knowledge-card::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg, transparent 0px, transparent 3px,
    rgba(255, 255, 255, 0.012) 3px, rgba(255, 255, 255, 0.012) 4px
  );
}

.knowledge-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.knowledge-badge {
  font-size: 10px;
  font-weight: bold;
  letter-spacing: 1px;
  padding: 1px 6px;
  color: #000;
  background: var(--neon-blue);
  border-radius: 2px;
  font-family: 'DotGothic16', monospace;
}

.knowledge-category {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 2px;
  letter-spacing: 1px;
  font-family: 'DotGothic16', monospace;
  font-weight: bold;
}

.knowledge-category.cat-financial { color: var(--neon-green); border: 1px solid var(--neon-green); }
.knowledge-category.cat-psychology { color: var(--neon-pink); border: 1px solid var(--neon-pink); }
.knowledge-category.cat-career { color: var(--neon-orange); border: 1px solid var(--neon-orange); }
.knowledge-category.cat-health { color: #ff6b6b; border: 1px solid #ff6b6b; }

.knowledge-tagline {
  margin-left: auto;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.35);
  letter-spacing: 1px;
}

.knowledge-title {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 4px;
  letter-spacing: 0.5px;
  text-shadow: 0 0 6px rgba(0, 212, 255, 0.25);
}

.knowledge-content {
  font-size: 12px;
  color: #cfc9e0;
}

.knowledge-tip {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed rgba(255, 255, 255, 0.12);
  font-size: 11px;
  color: var(--neon-green);
}

.tip-arrow {
  margin-right: 4px;
  color: var(--neon-green);
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
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  font-family: 'DotGothic16', monospace;
  padding-top: 3px;
  border-top: 1px dashed rgba(255, 255, 255, 0.1);
}

.option-disabled-reason {
  font-size: 10px;
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

/* 岔路口激活占位标题（橙色霓虹，与"平静的一年"区分） */
.crossroad-pending-title {
  color: var(--neon-orange);
  text-shadow: 0 0 6px var(--neon-orange);
}

.no-event-desc {
  font-size: 11px;
  color: #94b0c2;
  text-align: center;
  line-height: 1.6;
  margin: 0;
}

/* 岔路口决策剧情展示：左对齐、可滚动、字号略大，承载完整叙事 */
.no-event-desc.crossroad-decision-text {
  text-align: left;
  font-size: 12px;
  color: #cdd9e6;
  line-height: 1.8;
  max-height: 180px;
  overflow-y: auto;
  padding-right: 4px;
  white-space: pre-wrap;
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
