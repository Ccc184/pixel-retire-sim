<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameStore } from '../../store/game.store.js'
import { generateLifeAudit, type LifeAudit } from '../../utils/life-audit.js'

const store = useGameStore()
const expanded = ref(true)

const audit = computed<LifeAudit>(() => generateLifeAudit(store.state))

const riskBarColor = computed(() => {
  const s = audit.value.decisionProfile.riskScore
  if (s >= 75) return '#ff2d95'
  if (s >= 60) return '#ff8800'
  if (s >= 40) return '#00ff88'
  if (s >= 25) return '#00d4ff'
  return '#94b0c2'
})

const biasSeverityColor: Record<string, string> = {
  high: '#ff004d',
  medium: '#ff8800',
  low: '#ffec27',
  none: '#00ff88',
}

const toneColor: Record<string, string> = {
  positive: '#00ff88',
  warning: '#ff8800',
  critical: '#ff004d',
  neutral: '#94b0c2',
}

function toggle() {
  expanded.value = !expanded.value
}
</script>

<template>
  <div class="life-audit">
    <!-- 折叠触发器 -->
    <button class="audit-trigger" @click="toggle">
      <span class="audit-icon">◈</span>
      <span class="audit-title">人生审计报告</span>
      <span class="audit-arrow">{{ expanded ? '▲' : '▼' }}</span>
    </button>

    <!-- 展开内容 -->
    <transition name="audit-expand">
      <div v-if="expanded" class="audit-content">

        <!-- 1. 决策画像 -->
        <div class="audit-section">
          <div class="section-header">
            <span class="section-tag">◆ DECISION PROFILE</span>
            <span class="section-title">决策画像</span>
          </div>
          <div class="profile-grid">
            <div class="profile-item">
              <div class="profile-label">风险偏好</div>
              <div class="profile-value" :style="{ color: riskBarColor }">{{ audit.decisionProfile.riskAppetite }}</div>
              <div class="risk-bar">
                <div class="risk-bar-track">
                  <div class="risk-bar-fill" :style="{ width: audit.decisionProfile.riskScore + '%', background: riskBarColor }"></div>
                </div>
                <div class="risk-bar-labels">
                  <span>保守</span>
                  <span>{{ audit.decisionProfile.riskScore }}/100</span>
                  <span>激进</span>
                </div>
              </div>
            </div>
            <div class="profile-item">
              <div class="profile-label">消费观</div>
              <div class="profile-value num-cyan">{{ audit.decisionProfile.spendingPattern }}</div>
            </div>
            <div class="profile-item">
              <div class="profile-label">工作观</div>
              <div class="profile-value num-green">{{ audit.decisionProfile.workAttitude }}</div>
            </div>
          </div>
        </div>

        <!-- 2. 量化指标 -->
        <div class="audit-section">
          <div class="section-header">
            <span class="section-tag">◆ KEY METRICS</span>
            <span class="section-title">量化复盘</span>
          </div>
          <div class="metrics-list">
            <div v-for="m in audit.metrics" :key="m.label" class="metric-row">
              <div class="metric-label">{{ m.label }}</div>
              <div class="metric-value" :style="{ color: toneColor[m.tone] }">{{ m.value }}</div>
              <div class="metric-insight">{{ m.insight }}</div>
            </div>
          </div>
        </div>

        <!-- 3. 现实锚点 -->
        <div class="audit-section">
          <div class="section-header">
            <span class="section-tag">◆ REALITY ANCHORS</span>
            <span class="section-title">现实锚点</span>
          </div>
          <div class="anchors-list">
            <div v-for="(a, i) in audit.realityAnchors" :key="i" class="anchor-card">
              <div class="anchor-label">{{ a.label }}</div>
              <div class="anchor-vals">
                <div class="anchor-game">
                  <span class="anchor-tag">游戏中</span>
                  <span class="anchor-text">{{ a.gameValue }}</span>
                </div>
                <div class="anchor-real">
                  <span class="anchor-tag">现实中</span>
                  <span class="anchor-text">{{ a.realValue }}</span>
                </div>
              </div>
              <div class="anchor-comparison">{{ a.comparison }}</div>
              <div class="anchor-source">数据来源：{{ a.source }}</div>
            </div>
          </div>
        </div>

        <!-- 4. 认知偏差 -->
        <div class="audit-section">
          <div class="section-header">
            <span class="section-tag">◆ COGNITIVE BIASES</span>
            <span class="section-title">认知偏差检测</span>
          </div>
          <div class="biases-list">
            <div v-for="(b, i) in audit.cognitiveBiases" :key="i" class="bias-card">
              <div class="bias-header">
                <span class="bias-name" :style="{ color: biasSeverityColor[b.severity] }">{{ b.name }}</span>
                <span class="bias-severity" :style="{ color: biasSeverityColor[b.severity], borderColor: biasSeverityColor[b.severity] }">
                  {{ b.severity === 'none' ? '良好' : b.severity === 'high' ? '高风险' : b.severity === 'medium' ? '中等' : '轻微' }}
                </span>
              </div>
              <div class="bias-desc">{{ b.description }}</div>
              <div class="bias-evidence">▸ 证据：{{ b.evidence }}</div>
              <div class="bias-tip">💡 {{ b.realWorldTip }}</div>
            </div>
          </div>
        </div>

        <!-- 5. 人生启示 -->
        <div class="audit-section">
          <div class="section-header">
            <span class="section-tag">◆ LIFE LESSONS</span>
            <span class="section-title">人生启示</span>
          </div>
          <div class="lessons-list">
            <div v-for="(l, i) in audit.lifeLessons" :key="i" class="lesson-item">
              <span class="lesson-num">{{ i + 1 }}</span>
              <span class="lesson-text">{{ l }}</span>
            </div>
          </div>
        </div>

      </div>
    </transition>
  </div>
</template>

<style scoped>
.life-audit {
  width: 100%;
}

/* 触发按钮（面板标题栏风格） */
.audit-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(255, 45, 149, 0.16), rgba(0, 212, 255, 0.10));
  border: 1px solid rgba(255, 45, 149, 0.45);
  border-radius: 6px;
  color: #ffb0d8;
  font-family: 'DotGothic16', monospace;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 0 12px rgba(255, 45, 149, 0.12), inset 0 0 16px rgba(0, 212, 255, 0.06);
}

.audit-trigger:hover {
  background: linear-gradient(135deg, rgba(255, 45, 149, 0.24), rgba(0, 212, 255, 0.14));
  box-shadow: 0 0 16px rgba(255, 45, 149, 0.3);
}

.audit-icon {
  font-size: 18px;
  color: #ffec27;
  text-shadow: 0 0 8px rgba(255, 236, 39, 0.6);
}

.audit-title {
  flex: 1;
  text-align: center;
  font-size: 15px;
  letter-spacing: 3px;
  color: #ffffff;
  text-shadow: 0 0 8px rgba(255, 45, 149, 0.6);
}

.audit-arrow {
  font-size: 11px;
  color: #94b0c2;
  transition: transform 0.3s ease;
}

/* 展开内容 */
.audit-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 16px;
}

/* 折叠动画 */
.audit-expand-enter-active, .audit-expand-leave-active {
  transition: all 0.4s ease;
  overflow: hidden;
}
.audit-expand-enter-from, .audit-expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.audit-expand-enter-to, .audit-expand-leave-from {
  opacity: 1;
  max-height: 3000px;
}

/* 区块通用 */
.audit-section {
  background: rgba(12, 6, 34, 0.55);
  border: 1px solid rgba(0, 212, 255, 0.22);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.3);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  background: linear-gradient(90deg, rgba(0, 212, 255, 0.12), rgba(0, 212, 255, 0.02));
  border-bottom: 1px solid rgba(0, 212, 255, 0.18);
}

.section-tag {
  font-size: 10px;
  color: #00d4ff;
  letter-spacing: 2px;
  text-shadow: 0 0 4px #00d4ff;
  font-family: 'DotGothic16', monospace;
}

.section-title {
  font-size: 13px;
  color: #e0e0f0;
}

/* 决策画像 */
.profile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  padding: 12px;
}
@media (max-width: 480px) {
  .profile-grid { grid-template-columns: 1fr; }
}

.profile-item {
  text-align: center;
  padding: 8px 4px;
}

.profile-label {
  font-size: 11px;
  color: #94b0c2;
  margin-bottom: 4px;
}

.profile-value {
  font-size: 15px;
  font-weight: bold;
  margin-bottom: 6px;
}

.num-cyan { color: #00d4ff; text-shadow: 0 0 4px #00d4ff; }
.num-green { color: #00ff88; text-shadow: 0 0 4px #00ff88; }

.risk-bar {
  padding: 0 4px;
}

.risk-bar-track {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.risk-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s ease;
}

.risk-bar-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #94b0c2;
  margin-top: 3px;
}

/* 量化指标 */
.metrics-list {
  padding: 8px 12px;
}

.metric-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  flex-wrap: wrap;
}
.metric-row:last-child { border-bottom: none; }

.metric-label {
  font-size: 12px;
  color: #94b0c2;
  min-width: 90px;
}

.metric-value {
  font-size: 13px;
  font-weight: bold;
  font-family: 'DotGothic16', monospace;
}

.metric-insight {
  font-size: 11px;
  color: #8888aa;
  flex-basis: 100%;
  padding-left: 98px;
}

/* 现实锚点 */
.anchors-list {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.anchor-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 10px;
  transition: all 0.2s ease;
}

.anchor-card:hover {
  border-color: rgba(0, 212, 255, 0.3);
  box-shadow: 0 0 8px rgba(0, 212, 255, 0.1);
}

.anchor-label {
  font-size: 12px;
  color: #00d4ff;
  margin-bottom: 6px;
  font-weight: 600;
}

.anchor-vals {
  display: flex;
  gap: 12px;
  margin-bottom: 6px;
}
@media (max-width: 480px) {
  .anchor-vals { flex-direction: column; gap: 4px; }
}

.anchor-game, .anchor-real {
  flex: 1;
}

.anchor-tag {
  display: inline-block;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 2px;
  margin-right: 4px;
  font-family: 'DotGothic16', monospace;
}

.anchor-game .anchor-tag {
  background: rgba(255, 45, 149, 0.2);
  color: #ff2d95;
}

.anchor-real .anchor-tag {
  background: rgba(0, 255, 136, 0.15);
  color: #00ff88;
}

.anchor-text {
  font-size: 11px;
  color: #e0e0f0;
}

.anchor-comparison {
  font-size: 12px;
  color: #ffccaa;
  line-height: 1.6;
  padding: 4px 0;
}

.anchor-source {
  font-size: 10px;
  color: #5f574f;
  font-style: italic;
}

/* 认知偏差 */
.biases-list {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bias-card {
  background: rgba(255, 255, 255, 0.03);
  border-left: 3px solid;
  border-radius: 0 6px 6px 0;
  padding: 10px 12px;
  transition: all 0.2s ease;
}

.bias-card:hover {
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
}

.bias-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.bias-name {
  font-size: 13px;
  font-weight: bold;
}

.bias-severity {
  font-size: 10px;
  padding: 1px 8px;
  border: 1px solid;
  border-radius: 2px;
  font-family: 'DotGothic16', monospace;
}

.bias-desc {
  font-size: 12px;
  color: #e0e0f0;
  margin-bottom: 4px;
}

.bias-evidence {
  font-size: 11px;
  color: #94b0c2;
  margin-bottom: 4px;
}

.bias-tip {
  font-size: 11px;
  color: #00d4ff;
  background: rgba(0, 212, 255, 0.05);
  padding: 6px 8px;
  border-radius: 3px;
  line-height: 1.6;
}

/* 人生启示 */
.lessons-list {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lesson-item {
  display: flex;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.lesson-item:last-child { border-bottom: none; }

.lesson-num {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 45, 149, 0.2);
  color: #ff2d95;
  font-size: 11px;
  font-family: 'DotGothic16', monospace;
  border-radius: 50%;
}

.lesson-text {
  font-size: 12px;
  color: #ffccaa;
  line-height: 1.7;
}
</style>
