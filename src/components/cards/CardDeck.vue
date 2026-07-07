<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../../store/game.store.js';
import { playSelect, playConfirm } from '../../utils/audio.js';

const store = useGameStore();
const cards = computed(() => store.currentCards);
const selected = computed(() => store.selectedCardIds);

const isSelected = (cardId: string) => selected.value.includes(cardId);

const isCardAvailable = (cardId: string): boolean => {
  const card = cards.value.find(c => c.id === cardId);
  if (!card) return false;
  if (!card.prerequisites) return true;
  return card.prerequisites(store.state);
};

function handleToggle(cardId: string) {
  if (!isCardAvailable(cardId)) return;
  playSelect();
  store.toggleCard(cardId);
}

function handleCommit() {
  playConfirm();
  store.commitYear();
}

function formatMoney(n: number): string {
  if (n === 0) return '免费';
  if (n < 0) return '+¥' + Math.abs(n).toLocaleString('en-US');
  return '-¥' + n.toLocaleString('en-US');
}

function isJobCard(title: string): boolean {
  return title.startsWith('【');
}

// ================================================================
//  财务预警计算
// ================================================================
// 不选卡 = 休养生息，不计算卡片花费
const hasSelectedCards = computed(() => selected.value.length > 0);

const totalCost = computed(() => {
  let total = 0;
  for (const id of selected.value) {
    const card = cards.value.find(c => c.id === id);
    if (card) total += card.cost;
  }
  return total;
});

// 估算年度收支
const estimatedAnnualIncome = computed(() => {
  const s = store.state;
  if (s.isUnemployed) return s.passiveIncome;
  const salary = s.currentMonthlySalary * 12;
  const estInvest = Math.round(s.currentSavings * (s.bankDepositPct / 100) * 0.015);
  return salary + s.passiveIncome + estInvest;
});

const estimatedAnnualExpense = computed(() => {
  const s = store.state;
  let expense = s.annualBaseCost + s.currentMortgageCost + s.insurancePremium;
  const childCost = s.children.reduce((sum, c) => sum + c.monthlyExpense * 12, 0);
  expense += childCost;
  const cityMult: Record<string, number> = {
    '资本修罗场': 1.8, '中坚大后方': 1.0, '避风低洼地': 0.4
  };
  expense = expense * (cityMult[s.currentCity] || 1.0);
  if (s.currentProfession === '一线蓝领' && s.currentAge >= 45) expense *= 1.05;
  return Math.round(expense);
});

// 选卡后预计年末存款
const estimatedYearEndSavings = computed(() => {
  const s = store.state;
  return s.currentSavings - totalCost.value + estimatedAnnualIncome.value - estimatedAnnualExpense.value;
});

const estimatedDelta = computed(() => {
  return estimatedYearEndSavings.value - store.state.currentSavings;
});

const safetyLevel = computed(() => {
  const ratio = estimatedYearEndSavings.value / Math.max(1, estimatedAnnualExpense.value);
  if (estimatedYearEndSavings.value < 0) return 'danger';
  if (ratio < 0.5) return 'danger';
  if (ratio < 1.5) return 'warning';
  return 'safe';
});

// 按钮状态：不选卡=休养生息模式
const btnMode = computed(() => {
  if (hasSelectedCards.value) {
    return safetyLevel.value === 'danger' ? 'danger' : safetyLevel.value === 'warning' ? 'warning' : 'go';
  }
  return 'rest';
});

const categoryColors: Record<string, string> = {
  '核心决策': '#c900ff',
  '生活消费': '#00d4ff',
  '社交关系': '#ff2d95',
  '投资理财': '#00ff88',
  '健康养生': '#00d4cc',
  '技能进修': '#ff8800',
  '阶段解锁': '#ffd700',
  '💝 感情': '#ff2d95',
};

function getCategoryColor(cat: string | undefined): string {
  if (!cat) return '#00d4ff';
  return categoryColors[cat] || '#00d4ff';
}
</script>

<template>
  <div class="card-deck pixel-panel">
    <!-- 顶部霓虹标题 -->
    <div class="deck-neon-header">
      <span class="title-deco">◢◤</span>
      <h2 class="deck-title-neon">SELECT YOUR DECISION</h2>
      <span class="title-deco">◥◣</span>
    </div>

    <div class="deck-header">
      <span class="deck-sub" v-if="store.state.isUnemployed">
        <span class="warn-icon">⚠</span> 待业中 -- 请选择求职卡
      </span>
      <span class="deck-sub" v-else>
        <span class="info-icon">▸</span> 选择今年要做的事，不选就是休养生息
      </span>
    </div>

    <!-- 财务预警条 -->
    <div class="finance-warning-bar" :class="'warn-' + safetyLevel">
      <span class="warn-icon-main">
        <span v-if="safetyLevel === 'danger'">🔴</span>
        <span v-else-if="safetyLevel === 'warning'">🟡</span>
        <span v-else>🟢</span>
      </span>
      <div class="warn-info">
        <span class="warn-label">
          <template v-if="safetyLevel === 'danger'">财务预警</template>
          <template v-else-if="safetyLevel === 'warning'">注意收支</template>
          <template v-else>财务健康</template>
        </span>
        <span class="warn-detail">
          预计年末存款 <strong :class="estimatedDelta >= 0 ? 'text-green' : 'text-red'">
            {{ estimatedDelta >= 0 ? '+' : '' }}¥{{ estimatedDelta.toLocaleString() }}
          </strong>
          → ¥{{ Math.round(estimatedYearEndSavings).toLocaleString() }}
          <span class="warn-sub">（年入≈¥{{ estimatedAnnualIncome.toLocaleString() }} · 年支≈¥{{ estimatedAnnualExpense.toLocaleString() }}）</span>
        </span>
      </div>
    </div>

    <!-- 新手引导提示（前3轮显示） -->
    <div v-if="store.state.currentAge <= 24" class="guide-tip">
      <span class="guide-icon">&#128161;</span>
      <span class="guide-text">不选任何卡直接点按钮就是「休养生息」——不折腾的一年，身心自然恢复。</span>
    </div>

    <!-- 卡片区域（3列） -->
    <div class="cards-row cards-3col">
      <!-- 随机抽到的决策卡 -->
      <div
        v-for="(card, idx) in cards"
        :key="card.id + '-' + idx"
        class="decision-card"
        :class="{
          selected: isSelected(card.id),
          'job-card': isJobCard(card.title),
          disabled: !isCardAvailable(card.id),
        }"
        @click="handleToggle(card.id)"
      >
        <div class="card-scanlines" />

        <div class="card-top-bar" :class="{ 'job-bar': isJobCard(card.title) }">
          <span class="card-index">{{ idx + 1 }}</span>
          <span v-if="isSelected(card.id)" class="select-dot" />
          <span v-else-if="!isCardAvailable(card.id)" class="lock-icon">🔒</span>
        </div>

        <div class="card-body">
          <span
            v-if="card.category"
            class="card-category"
            :style="{
              color: getCategoryColor(card.category),
              borderColor: getCategoryColor(card.category),
              boxShadow: '0 0 6px ' + getCategoryColor(card.category) + '40'
            }"
          >
            {{ card.category }}
          </span>
          <h3 class="card-title">{{ card.title }}</h3>
          <p class="card-desc">{{ card.description }}</p>
          <div v-if="!isCardAvailable(card.id)" class="card-disabled-overlay">
            <span class="lock-text">条件不满足</span>
          </div>
        </div>

        <div class="card-footer">
          <span
            class="card-cost"
            :class="{
              'cost-positive': card.cost < 0,
              'cost-free': card.cost === 0,
              'cost-negative': card.cost > 0,
            }"
          >
            {{ formatMoney(card.cost) }}
          </span>
          <span v-if="isSelected(card.id)" class="selected-hint">
            <span class="check-mark">✓</span> 已选
          </span>
        </div>

        <span class="corner corner-tl" />
        <span class="corner corner-tr" />
        <span class="corner corner-bl" />
        <span class="corner corner-br" />
      </div>
    </div>

    <!-- 汇总与按钮 -->
    <div class="action-row">
      <div class="selection-summary">
        <template v-if="hasSelectedCards">
          已选 <span class="sel-count">{{ selected.length }}</span> 项
          <template v-if="totalCost !== 0">
            · 卡片花费
            <span class="sel-cost" :class="{ 'cost-positive': totalCost < 0 }">
              {{ formatMoney(totalCost) }}
            </span>
          </template>
        </template>
        <template v-else>
          <span class="sel-empty">🌿 就这样过一年（休养生息：压力-5 健康+3 幸福+2）</span>
        </template>
      </div>

      <button
        class="neon-commit-btn"
        :class="{
          disabled: store.state.endingTriggered,
          'btn-rest': btnMode === 'rest',
          'btn-danger': btnMode === 'danger',
          'btn-warning': btnMode === 'warning',
          'btn-go': btnMode === 'go',
        }"
        :disabled="store.state.endingTriggered"
        @click="handleCommit"
      >
        <span class="btn-scanlines" />
        <span class="btn-arrows">
          <span class="arrow-pulse">▶</span>
        </span>
        <span class="btn-text">
          <template v-if="btnMode === 'rest'">🌿 就这样过一年</template>
          <template v-else-if="btnMode === 'danger'">⚠ 仍要继续</template>
          <template v-else>步入下一年</template>
        </span>
        <span class="btn-sub">AGE {{ store.state.currentAge }} → {{ store.state.currentAge + 1 }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.card-deck {
  font-family: 'DotGothic16', monospace;
  color: #f4f4f4;
  padding: 6px 8px;
  position: relative;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  width: 100%;
  max-width: 680px;
  box-sizing: border-box;
}

/* 顶部霓虹标题 */
.deck-neon-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 2px;
}

.deck-title-neon {
  font-size: 14px;
  color: #00d4ff;
  margin: 0;
  letter-spacing: 2px;
  font-weight: bold;
  text-shadow:
    0 0 4px #00d4ff,
    0 0 10px #00d4ff,
    0 0 20px #00d4ff,
    0 0 40px #00d4ff80;
  animation: titleGlow 3s ease-in-out infinite;
}

@keyframes titleGlow {
  0%, 100% {
    text-shadow: 0 0 4px #00d4ff, 0 0 10px #00d4ff, 0 0 20px #00d4ff, 0 0 40px #00d4ff80;
  }
  50% {
    text-shadow: 0 0 6px #00d4ff, 0 0 16px #00d4ff, 0 0 30px #00d4ff, 0 0 50px #00d4ff;
  }
}

.title-deco {
  color: #c900ff;
  font-size: 12px;
  text-shadow: 0 0 6px #c900ff;
}

.deck-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 3px;
  padding-bottom: 2px;
  border-bottom: 1px dashed #00d4ff40;
}

.deck-sub {
  font-size: 11px;
  color: #94b0c2;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.warn-icon {
  color: #ff2d95;
  text-shadow: 0 0 6px #ff2d95;
  animation: warnBlink 1s ease-in-out infinite;
}

@keyframes warnBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.info-icon {
  color: #00d4ff;
  text-shadow: 0 0 4px #00d4ff;
}

/* 财务预警条 */
.finance-warning-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  margin-bottom: 3px;
  border: 1px solid;
  border-radius: 0;
  font-size: 10px;
  letter-spacing: 0.5px;
  animation: warnBarIn 0.3s ease-out;
}

@keyframes warnBarIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.finance-warning-bar.warn-safe {
  background: rgba(0, 255, 136, 0.06);
  border-color: #00ff8860;
  color: #8effc8;
}

.finance-warning-bar.warn-warning {
  background: rgba(255, 236, 39, 0.08);
  border-color: #ffec2760;
  color: #ffe866;
}

.finance-warning-bar.warn-danger {
  background: rgba(255, 45, 149, 0.1);
  border-color: #ff2d95;
  color: #ff8cc8;
  box-shadow: 0 0 12px rgba(255, 45, 149, 0.2);
  animation: dangerPulse 1.5s ease-in-out infinite;
}

@keyframes dangerPulse {
  0%, 100% { box-shadow: 0 0 12px rgba(255, 45, 149, 0.2); }
  50% { box-shadow: 0 0 20px rgba(255, 45, 149, 0.4); }
}

.warn-icon-main {
  font-size: 18px;
  flex-shrink: 0;
}

.warn-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.warn-label {
  font-weight: bold;
  font-size: 12px;
  letter-spacing: 1px;
}

.warn-safe .warn-label { text-shadow: 0 0 6px #00ff88; }
.warn-warning .warn-label { text-shadow: 0 0 6px #ffec27; }
.warn-danger .warn-label { text-shadow: 0 0 6px #ff2d95; }

.warn-detail {
  font-size: 11px;
  color: #c8d6e5;
}

.warn-detail strong {
  font-size: 13px;
}

.warn-sub {
  opacity: 0.7;
  font-size: 10px;
  margin-left: 4px;
}

.text-green { color: #00ff88 !important; text-shadow: 0 0 4px #00ff88; }
.text-red { color: #ff2d95 !important; text-shadow: 0 0 4px #ff2d95; }

/* 卡片排列 - 3列 */
.cards-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-bottom: 4px;
}

@media (max-width: 1100px) {
  .cards-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .cards-row {
    grid-template-columns: 1fr;
  }
}

/* 卡片基础样式 */
.decision-card {
  position: relative;
  background: rgba(26, 28, 44, 0.8);
  border: 2px solid #00d4ff;
  padding: 0;
  cursor: pointer;
  transition: transform 0.15s cubic-bezier(0.2, 0, 0, 1),
              box-shadow 0.15s ease,
              border-color 0.15s ease;
  display: flex;
  flex-direction: column;
  min-height: 90px;
  user-select: none;
  overflow: hidden;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  box-shadow:
    0 0 6px #00d4ff,
    0 0 14px #00d4ff40,
    inset 0 0 10px #00d4ff15;
}

.card-scanlines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px,
    transparent 2px,
    rgba(0, 212, 255, 0.03) 2px,
    rgba(0, 212, 255, 0.03) 3px
  );
}

.card-category {
  display: inline-block;
  font-size: 9px;
  letter-spacing: 1px;
  padding: 1px 5px;
  border: 1px solid;
  border-radius: 2px;
  background: rgba(10, 5, 30, 0.9);
  text-shadow: 0 0 4px currentColor;
  pointer-events: none;
  margin-bottom: 4px;
  align-self: flex-start;
}

.decision-card:hover:not(.disabled) {
  transform: translateY(-4px);
  border-color: #ff8800;
  box-shadow:
    0 0 8px #ff8800,
    0 0 18px #ff880060,
    0 0 30px #ff880030,
    inset 0 0 12px #ff880020;
}

.decision-card:active:not(.disabled) {
  transform: scale(0.97);
  transition-duration: 0.08s;
}

/* 选中：粉色霓虹 */
.decision-card.selected {
  border-color: #ff2d95;
  box-shadow:
    0 0 10px #ff2d95,
    0 0 22px #ff2d9580,
    0 0 40px #ff2d9530,
    inset 0 0 16px #ff2d9525;
}

.decision-card.selected:hover:not(.disabled) {
  transform: translateY(-4px);
  border-color: #ff2d95;
  box-shadow:
    0 0 14px #ff2d95,
    0 0 28px #ff2d95,
    0 0 50px #ff2d9550,
    inset 0 0 20px #ff2d9530;
}

/* 职业卡片：绿色霓虹 */
.decision-card.job-card {
  border-color: #00ff88;
  box-shadow:
    0 0 6px #00ff88,
    0 0 14px #00ff8840,
    inset 0 0 10px #00ff8815;
}

.decision-card.job-card:hover:not(.disabled) {
  border-color: #ff8800;
  box-shadow:
    0 0 8px #ff8800,
    0 0 18px #ff880060,
    inset 0 0 12px #ff880020;
}

.decision-card.job-card.selected {
  border-color: #ff2d95;
  box-shadow:
    0 0 10px #ff2d95,
    0 0 22px #ff2d9580,
    inset 0 0 16px #ff2d9525;
}

/* 禁用卡片 */
.decision-card.disabled {
  border-color: #333c57;
  background: rgba(20, 15, 30, 0.6);
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(0.8);
  box-shadow: none;
}
.decision-card.disabled:hover {
  transform: none;
  border-color: #333c57;
  box-shadow: none;
}

/* 卡片顶部条 */
.card-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background: linear-gradient(90deg, rgba(0, 212, 255, 0.2), rgba(0, 212, 255, 0.05));
  border-bottom: 1px solid #00d4ff60;
  font-size: 10px;
  letter-spacing: 2px;
  position: relative;
  z-index: 2;
}

.card-top-bar.job-bar {
  background: linear-gradient(90deg, rgba(0, 255, 136, 0.2), rgba(0, 255, 136, 0.05));
  border-bottom-color: #00ff8860;
}

.decision-card.selected .card-top-bar {
  background: linear-gradient(90deg, rgba(255, 45, 149, 0.25), rgba(255, 45, 149, 0.05));
  border-bottom-color: #ff2d9560;
}

.card-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: rgba(10, 5, 30, 0.9);
  color: #00d4ff;
  font-weight: bold;
  font-size: 11px;
  border: 1px solid #00d4ff80;
  text-shadow: 0 0 4px #00d4ff;
  box-shadow: 0 0 4px #00d4ff40;
}

.card-top-bar.job-bar .card-index {
  color: #00ff88;
  border-color: #00ff8880;
  text-shadow: 0 0 4px #00ff88;
  box-shadow: 0 0 4px #00ff8840;
}

.decision-card.selected .card-index {
  color: #ff2d95;
  border-color: #ff2d9580;
  text-shadow: 0 0 4px #ff2d95;
  box-shadow: 0 0 4px #ff2d9540;
}

.select-dot {
  width: 10px;
  height: 10px;
  background: #ff2d95;
  border-radius: 50%;
  box-shadow:
    0 0 6px #ff2d95,
    0 0 14px #ff2d95,
    0 0 20px #ff2d9580;
  animation: dotPulse 1.2s ease-in-out infinite;
}

@keyframes dotPulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 6px #ff2d95, 0 0 14px #ff2d95; }
  50% { transform: scale(1.2); box-shadow: 0 0 8px #ff2d95, 0 0 20px #ff2d95, 0 0 30px #ff2d9580; }
}

.lock-icon {
  font-size: 12px;
  opacity: 0.7;
}

/* 卡片主体 */
.card-body {
  flex: 1;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  position: relative;
  z-index: 2;
  overflow: hidden;
}

.card-title {
  font-size: 13px;
  color: #ffffff;
  margin: 0;
  line-height: 1.3;
  font-weight: bold;
  letter-spacing: 0.5px;
  text-shadow:
    0 0 4px #ffffff,
    0 0 10px #00d4ff80;
}

.decision-card.selected .card-title {
  text-shadow:
    0 0 6px #ffffff,
    0 0 14px #ff2d95,
    0 0 20px #ff2d9580;
}

.job-card .card-title {
  text-shadow:
    0 0 4px #ffffff,
    0 0 10px #00ff8880;
}

.card-desc {
  font-size: 10px;
  color: #94b0c2;
  line-height: 1.4;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.disabled .card-desc {
  color: #566c86;
}

.card-disabled-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 5, 30, 0.4);
  z-index: 3;
}

.lock-text {
  font-size: 11px;
  color: #566c86;
  letter-spacing: 2px;
  padding: 4px 10px;
  border: 1px solid #333c57;
}

/* 卡片底部 */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 8px;
  background: rgba(0, 0, 0, 0.4);
  border-top: 1px solid #00d4ff30;
  position: relative;
  z-index: 2;
}

.decision-card.selected .card-footer {
  border-top-color: #ff2d9560;
  background: rgba(255, 45, 149, 0.08);
}

.job-card .card-footer {
  border-top-color: #00ff8830;
}

.card-cost {
  font-size: 13px;
  font-weight: bold;
}

.card-cost.cost-negative {
  color: #ff8800;
  text-shadow: 0 0 6px #ff8800;
}

.card-cost.cost-positive {
  color: #00ff88;
  text-shadow: 0 0 6px #00ff88;
}

.card-cost.cost-free {
  color: #c2c3c7;
  text-shadow: none;
}

.selected-hint {
  font-size: 10px;
  color: #ff2d95;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border: 1px solid #ff2d95;
  letter-spacing: 1px;
  text-shadow: 0 0 4px #ff2d95;
  box-shadow: 0 0 6px #ff2d9540;
  background: rgba(255, 45, 149, 0.1);
}

.check-mark {
  font-size: 12px;
}

/* 像素角装饰 */
.corner {
  position: absolute;
  width: 6px;
  height: 6px;
  background: rgba(26, 28, 44, 0.9);
  z-index: 3;
}
.corner-tl { top: 0; left: 0; border-right: 2px solid #00d4ff; border-bottom: 2px solid #00d4ff; }
.corner-tr { top: 0; right: 0; border-left: 2px solid #00d4ff; border-bottom: 2px solid #00d4ff; }
.corner-bl { bottom: 0; left: 0; border-right: 2px solid #00d4ff; border-top: 2px solid #00d4ff; }
.corner-br { bottom: 0; right: 0; border-left: 2px solid #00d4ff; border-top: 2px solid #00d4ff; }

.job-card .corner-tl, .job-card .corner-tr, .job-card .corner-bl, .job-card .corner-br {
  border-color: #00ff88;
}
.selected .corner-tl, .selected .corner-tr, .selected .corner-bl, .selected .corner-br {
  border-color: #ff2d95;
}
.disabled .corner-tl, .disabled .corner-tr, .disabled .corner-bl, .disabled .corner-br {
  border-color: #333c57;
}

/* 空卡槽 */
.empty-card {
  background: rgba(10, 5, 30, 0.4);
  border: 2px dashed #333c57;
  cursor: default;
  min-height: 130px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: none;
}

.empty-card:hover {
  transform: none;
  box-shadow: none;
  border-color: #333c57;
}

.empty-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0.3;
}

.empty-mark {
  font-size: 40px;
  color: #566c86;
}

.empty-text {
  font-size: 10px;
  color: #566c86;
  letter-spacing: 2px;
}

/* 操作行 */
.action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 4px;
  border-top: 1px dashed #c900ff40;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.selection-summary {
  font-size: 12px;
  color: #94b0c2;
  flex: 1;
  letter-spacing: 0.5px;
}

.sel-count {
  color: #00d4ff;
  font-weight: bold;
  font-size: 14px;
  text-shadow: 0 0 6px #00d4ff;
}

.sel-cost {
  color: #ff8800;
  font-weight: bold;
  font-size: 14px;
  text-shadow: 0 0 6px #ff8800;
}

.sel-cost.cost-positive {
  color: #00ff88;
  text-shadow: 0 0 6px #00ff88;
}

.sel-empty {
  color: #00d4cc;
  font-style: normal;
  text-shadow: 0 0 4px #00d4cc60;
}

/* 霓虹主按钮 */
.neon-commit-btn {
  position: relative;
  background: rgba(0, 255, 136, 0.1);
  color: #00ff88;
  border: 2px solid #00ff88;
  padding: 6px 18px;
  font-family: 'DotGothic16', monospace;
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 1px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  transition: all 0.15s ease;
  box-shadow:
    0 0 8px #00ff88,
    0 0 20px #00ff8840,
    inset 0 0 12px #00ff8820;
  min-width: 120px;
  text-shadow: 0 0 6px #00ff88;
  overflow: hidden;
}

.neon-commit-btn.btn-warning {
  background: rgba(255, 236, 39, 0.1);
  color: #ffec27;
  border-color: #ffec27;
  box-shadow:
    0 0 8px #ffec27,
    0 0 20px #ffec2740,
    inset 0 0 12px #ffec2720;
  text-shadow: 0 0 6px #ffec27;
}

.neon-commit-btn.btn-danger {
  background: rgba(255, 45, 149, 0.12);
  color: #ff2d95;
  border-color: #ff2d95;
  box-shadow:
    0 0 10px #ff2d95,
    0 0 24px #ff2d9560,
    inset 0 0 14px #ff2d9525;
  text-shadow: 0 0 8px #ff2d95;
  animation: btnDangerGlow 1.2s ease-in-out infinite;
}

.neon-commit-btn.btn-rest {
  background: rgba(0, 212, 204, 0.1);
  color: #00d4cc;
  border-color: #00d4cc;
  box-shadow:
    0 0 8px #00d4cc,
    0 0 20px #00d4cc40,
    inset 0 0 12px #00d4cc20;
  text-shadow: 0 0 6px #00d4cc;
}
.neon-commit-btn.btn-rest:hover:not(.disabled):not(:disabled) {
  background: rgba(0, 212, 204, 0.2);
  box-shadow: 0 0 12px #00d4cc, 0 0 28px #00d4cc60;
}
.btn-rest .arrow-pulse { color: #00d4cc; text-shadow: 0 0 6px #00d4cc; }

@keyframes btnDangerGlow {
  0%, 100% { box-shadow: 0 0 10px #ff2d95, 0 0 24px #ff2d9560, inset 0 0 14px #ff2d9525; }
  50% { box-shadow: 0 0 16px #ff2d95, 0 0 36px #ff2d95, inset 0 0 18px #ff2d9535; }
}

.btn-scanlines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px,
    transparent 3px,
    rgba(255, 255, 255, 0.04) 3px,
    rgba(255, 255, 255, 0.04) 4px
  );
  z-index: 1;
}

.btn-arrows {
  position: relative;
  z-index: 2;
}

.arrow-pulse {
  display: inline-block;
  font-size: 10px;
  color: #00ff88;
  animation: arrowPulse 0.8s ease-in-out infinite;
  text-shadow: 0 0 6px #00ff88;
}

.btn-warning .arrow-pulse { color: #ffec27; text-shadow: 0 0 6px #ffec27; }
.btn-danger .arrow-pulse { color: #ff2d95; text-shadow: 0 0 8px #ff2d95; }

@keyframes arrowPulse {
  0%, 100% { transform: translateX(0); opacity: 1; }
  50% { transform: translateX(4px); opacity: 0.6; }
}

.neon-commit-btn:hover:not(.disabled):not(:disabled) {
  background: rgba(255, 45, 149, 0.15);
  color: #ff2d95;
  border-color: #ff2d95;
  box-shadow:
    0 0 12px #ff2d95,
    0 0 28px #ff2d9580,
    0 0 50px #c900ff40,
    inset 0 0 16px #ff2d9525;
  text-shadow: 0 0 8px #ff2d95, 0 0 16px #ff2d95;
  transform: translateY(-2px);
}

.neon-commit-btn.btn-warning:hover:not(.disabled):not(:disabled),
.neon-commit-btn.btn-danger:hover:not(.disabled):not(:disabled) {
  background: rgba(255, 45, 149, 0.2);
  color: #ff2d95;
  border-color: #ff2d95;
}

.neon-commit-btn:hover:not(.disabled):not(:disabled) .arrow-pulse {
  color: #ff2d95;
  text-shadow: 0 0 8px #ff2d95;
}

.neon-commit-btn:active:not(.disabled):not(:disabled) {
  transform: translateY(2px);
  box-shadow:
    0 0 6px #ff2d95,
    0 0 14px #ff2d9560,
    inset 0 0 10px #ff2d9530;
  transition-duration: 0.05s;
}

.neon-commit-btn.disabled,
.neon-commit-btn:disabled {
  background: rgba(50, 50, 70, 0.4);
  color: #566c86;
  border-color: #333c57;
  cursor: not-allowed;
  box-shadow: none;
  text-shadow: none;
}

.btn-text {
  font-size: 14px;
  line-height: 1;
  position: relative;
  z-index: 2;
}

.btn-sub {
  font-size: 9px;
  opacity: 0.7;
  letter-spacing: 1px;
  position: relative;
  z-index: 2;
}

/* 新手引导提示 */
.guide-tip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  margin-bottom: 4px;
  background: rgba(10, 5, 30, 0.85);
  font-size: 10px;
  border-left: 3px solid #ff2d95;
  border-right: 1px solid rgba(255, 45, 149, 0.15);
  border-top: 1px solid rgba(255, 45, 149, 0.15);
  border-bottom: 1px solid rgba(255, 45, 149, 0.15);
  box-shadow:
    0 0 8px rgba(255, 45, 149, 0.2),
    inset 0 0 12px rgba(255, 45, 149, 0.05);
  animation: guideTipFadeIn 0.4s ease-out;
}

@keyframes guideTipFadeIn {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}

.guide-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.guide-text {
  font-size: 11px;
  line-height: 1.6;
  color: #c8d6e5;
  letter-spacing: 0.3px;
}
</style>
