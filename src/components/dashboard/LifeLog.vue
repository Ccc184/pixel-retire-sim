<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useGameStore } from '../../store/game.store.js';

const store = useGameStore();
const s = computed(() => store.state);

const collapsed = ref(false);
const logContainer = ref<HTMLElement | null>(null);

// 日常琐事折叠（默认收起）
const dailyCollapsed = ref(true);
// 关系动态折叠（默认收起）
const relCollapsed = ref(true);

// 最多80条（store里已经做了shift，但这里再保险一下）
const displayLogs = computed(() => {
  const logs = s.value.lifeLog;
  if (logs.length > 80) return logs.slice(logs.length - 80);
  return logs;
});

// 日志分类
type LogCategory = 'danger' | 'success' | 'card' | 'swan' | 'relationship' | 'daily' | 'normal';

function getLogCategory(log: string): LogCategory {
  // 黑天鹅事件（最高优先级）
  if (/黑天鹅/.test(log)) return 'swan';
  // 危险事件
  if (/(爆仓|重病|破产|裁员|失业|被骗|损失|阴影|创伤|警示)/.test(log)) return 'danger';
  // 人际关系事件
  if (/(父母|伴侣|配偶|孩子|子女|朋友|同事|离婚|结婚|恩爱|感情|关系|亲情)/.test(log)) return 'relationship';
  // 日常琐事
  if (/(体检|看病|感冒|堵车|加班|外卖|房租|水电|通勤|家务|买菜|失眠|感冒)/.test(log)) return 'daily';
  // 成功事件
  if (/(升职|加薪|结婚|宝宝|副业|保险|极简|套利)/.test(log)) return 'success';
  // 卡片选择类事件
  if (/(你选择|购入|买入|报名|学习|开启|升级|跳槽|搬家|配置)/.test(log)) return 'card';
  return 'normal';
}

// 提取日常琐事日志
const dailyLogs = computed(() => {
  return displayLogs.value.filter(log => getLogCategory(log) === 'daily').slice(-3).reverse();
});

// 提取人际关系日志
const relationshipLogs = computed(() => {
  return displayLogs.value.filter(log => getLogCategory(log) === 'relationship').slice(-5).reverse();
});

// 结局触发时给面板加特殊边框
const isEnding = computed(() => s.value.endingTriggered);

function toggleCollapse() {
  collapsed.value = !collapsed.value;
}

// 日志更新时自动滚动到底部（最新在底部）
watch(
  () => s.value.lifeLog.length,
  async () => {
    if (collapsed.value) return;
    await nextTick();
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  },
);

// 折叠展开时也滚到底
watch(
  () => collapsed.value,
  async (v) => {
    if (v) return;
    await nextTick();
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  },
);

// 提取年龄（从日志开头"第X岁"），用于显示小标签
function extractAge(log: string): string {
  const match = log.match(/^第(\d+)岁/);
  return match ? match[1] : '—';
}

// 是否是新日志（最后一条），用于入场动画
function isNewest(idx: number): boolean {
  return idx === displayLogs.value.length - 1;
}
</script>

<template>
  <div
    class="life-log-panel pixel-panel"
    :class="{ collapsed, 'ending-border': isEnding }"
  >
    <!-- 顶部霓虹标题 -->
    <div class="log-neon-header">
      <span class="title-deco">◢◤</span>
      <h2 class="log-title-neon">LIFE LOG</h2>
      <span class="title-deco">◥◣</span>
    </div>

    <!-- 折叠头部（可点击） -->
    <button class="log-header" @click="toggleCollapse" type="button">
      <span class="header-indicator">
        <span class="arrow" :class="{ rotated: collapsed }">▶</span>
      </span>
      <span class="header-title">▣ 人生日志</span>
      <span class="header-count">
        {{ displayLogs.length }} / 80
      </span>
      <span class="header-spacer" />
      <span class="header-hint">
        {{ collapsed ? '展开' : '折叠' }}
      </span>
    </button>

    <!-- 可折叠内容区 -->
    <div class="log-body" :class="{ open: !collapsed }">
      <!-- ============================================================ -->
      <!--  日常琐事折叠区（默认收起，只显示最近3条）                     -->
      <!-- ============================================================ -->
      <div v-if="dailyLogs.length > 0" class="fold-section">
        <button class="fold-header" @click="dailyCollapsed = !dailyCollapsed" type="button">
          <span class="fold-arrow" :class="{ rotated: dailyCollapsed }">▶</span>
          <span class="fold-title">
            <span class="fold-icon daily-icon">·</span>
            日常琐事
          </span>
          <span class="fold-count daily-count">{{ dailyLogs.length }}</span>
        </button>
        <div class="fold-body" :class="{ open: !dailyCollapsed }">
          <ul class="fold-list">
            <li
              v-for="(log, idx) in dailyLogs"
              :key="'daily-' + idx"
              class="fold-item fold-item-daily"
            >
              <span class="log-age-badge daily-badge">
                <span class="age-prefix">AGE</span>
                <span class="age-num">{{ extractAge(log) }}</span>
              </span>
              <span class="fold-bullet">·</span>
              <span class="fold-text">{{ log }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- ============================================================ -->
      <!--  关系动态折叠区（默认收起）                                     -->
      <!-- ============================================================ -->
      <div v-if="relationshipLogs.length > 0" class="fold-section">
        <button class="fold-header" @click="relCollapsed = !relCollapsed" type="button">
          <span class="fold-arrow" :class="{ rotated: relCollapsed }">▶</span>
          <span class="fold-title">
            <span class="fold-icon rel-icon">♥</span>
            关系动态
          </span>
          <span class="fold-count rel-count">{{ relationshipLogs.length }}</span>
        </button>
        <div class="fold-body" :class="{ open: !relCollapsed }">
          <ul class="fold-list">
            <li
              v-for="(log, idx) in relationshipLogs"
              :key="'rel-' + idx"
              class="fold-item fold-item-rel"
            >
              <span class="log-age-badge rel-badge">
                <span class="age-prefix">AGE</span>
                <span class="age-num">{{ extractAge(log) }}</span>
              </span>
              <span class="fold-bullet">♥</span>
              <span class="fold-text">{{ log }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- ============================================================ -->
      <!--  主日志列表                                                     -->
      <!-- ============================================================ -->
      <div class="log-scroll" ref="logContainer">
        <!-- CRT扫描线纹理层 -->
        <div class="scanline-overlay" />

        <div v-if="displayLogs.length === 0" class="log-empty">
          <span class="empty-cursor">_</span>
          <span> 日志空空如也，像素人生尚未开始...</span>
        </div>

        <ul class="log-list">
          <li
            v-for="(log, idx) in displayLogs"
            :key="idx"
            class="log-item"
            :class="[
              'tone-' + getLogCategory(log),
              'bar-' + getLogCategory(log),
              { 'is-new': isNewest(idx) }
            ]"
          >
            <!-- 时间戳（年龄） -->
            <span class="log-age-badge">
              <span class="age-prefix">AGE</span>
              <span class="age-num">{{ extractAge(log) }}</span>
            </span>
            <span class="log-bullet">»</span>
            <span class="log-text">{{ log }}</span>
            <!-- 黑天鹅闪烁边框条 -->
            <span v-if="getLogCategory(log) === 'swan'" class="swan-flash-bar" />
          </li>
        </ul>
      </div>

      <!-- 底部扫描线装饰 -->
      <div class="log-footer">
        <span class="scan-line" />
        <span class="footer-text">
          [ END OF LOG ]
        </span>
        <span class="scan-line" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.life-log-panel {
  font-family: 'DotGothic16', monospace;
  color: #f4f4f4;
  padding: 14px 16px;
  overflow: hidden;
  position: relative;
}

/* 结局触发时的特殊霓虹边框效果 */
.life-log-panel.ending-border {
  animation: endingBorderPulse 2s ease-in-out infinite;
}

@keyframes endingBorderPulse {
  0%, 100% {
    border-color: #ff2d95;
    box-shadow:
      0 0 10px #ff2d95,
      0 0 25px #ff2d9580,
      0 0 50px #c900ff40,
      inset 0 0 20px #ff2d9520;
  }
  50% {
    border-color: #c900ff;
    box-shadow:
      0 0 15px #c900ff,
      0 0 35px #c900ff80,
      0 0 60px #00d4ff40,
      inset 0 0 25px #c900ff20;
  }
}

/* 顶部霓虹标题 */
.log-neon-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #ff2d9560;
}

.log-title-neon {
  font-size: 18px;
  color: #ff2d95;
  margin: 0;
  letter-spacing: 3px;
  font-weight: bold;
  text-shadow:
    0 0 4px #ff2d95,
    0 0 10px #ff2d95,
    0 0 20px #ff2d95,
    0 0 40px #ff2d9580;
  animation: pinkFlicker 4s ease-in-out infinite;
}

@keyframes pinkFlicker {
  0%, 100% { opacity: 1; }
  45% { opacity: 1; }
  50% { opacity: 0.65; text-shadow: 0 0 2px #ff2d95; }
  55% { opacity: 1; }
}

.title-deco {
  color: #c900ff;
  font-size: 12px;
  text-shadow: 0 0 6px #c900ff;
}

/* 头部按钮 */
.log-header {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  background: rgba(255, 45, 149, 0.08);
  border: 1px solid #ff2d9540;
  padding: 8px 12px;
  cursor: pointer;
  font-family: 'DotGothic16', monospace;
  color: #f4f4f4;
  text-align: left;
  transition: all 0.15s ease;
  margin-bottom: 8px;
  box-shadow: inset 0 0 8px #ff2d9515;
}

.log-header:hover {
  background: rgba(255, 45, 149, 0.18);
  border-color: #ff2d95;
  box-shadow: 0 0 8px #ff2d9540, inset 0 0 10px #ff2d9520;
}

.header-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: rgba(10, 5, 30, 0.8);
  border: 1px solid #ff2d95;
  box-shadow: 0 0 4px #ff2d95;
}

.arrow {
  display: inline-block;
  color: #ff2d95;
  font-size: 10px;
  text-shadow: 0 0 4px #ff2d95;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: center;
}

.arrow.rotated {
  transform: rotate(-90deg);
}

.header-title {
  font-size: 13px;
  color: #ff2d95;
  letter-spacing: 2px;
  text-shadow: 0 0 4px #ff2d95;
}

.header-count {
  font-size: 10px;
  color: #00d4ff;
  padding: 2px 8px;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid #00d4ff60;
  text-shadow: 0 0 4px #00d4ff;
  box-shadow: 0 0 4px #00d4ff30;
}

.header-spacer {
  flex: 1;
}

.header-hint {
  font-size: 10px;
  color: #c900ff;
  letter-spacing: 1px;
  text-shadow: 0 0 4px #c900ff80;
}

/* 折叠主体 */
.log-body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.log-body.open {
  max-height: 600px;
}

/* ============================================================
   折叠区：日常琐事 / 关系动态
   ============================================================ */
.fold-section {
  margin-bottom: 6px;
}

.fold-header {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  background: rgba(10, 5, 30, 0.4);
  border: 1px solid #c900ff30;
  padding: 5px 10px;
  cursor: pointer;
  font-family: 'DotGothic16', monospace;
  color: #f4f4f4;
  text-align: left;
  transition: all 0.15s ease;
}

.fold-header:hover {
  background: rgba(10, 5, 30, 0.6);
  border-color: #c900ff60;
}

.fold-arrow {
  display: inline-block;
  font-size: 9px;
  color: #c900ff;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fold-arrow.rotated {
  transform: rotate(-90deg);
}

.fold-title {
  font-size: 11px;
  color: #94b0c2;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.fold-icon {
  font-size: 12px;
}

.fold-icon.daily-icon {
  color: #00d4ff;
  text-shadow: 0 0 4px #00d4ff;
}

.fold-icon.rel-icon {
  color: #ff2d95;
  text-shadow: 0 0 4px #ff2d95;
}

.fold-count {
  margin-left: auto;
  font-size: 9px;
  padding: 1px 6px;
}

.fold-count.daily-count {
  color: #00d4ff;
  border: 1px solid #00d4ff40;
  background: rgba(0, 212, 255, 0.08);
}

.fold-count.rel-count {
  color: #ff2d95;
  border: 1px solid #ff2d9540;
  background: rgba(255, 45, 149, 0.08);
}

.fold-body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fold-body.open {
  max-height: 200px;
}

.fold-list {
  list-style: none;
  margin: 4px 0;
  padding: 0 4px;
}

.fold-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 4px 8px;
  font-size: 10px;
  line-height: 1.5;
  border-left: 2px solid transparent;
}

.fold-item-daily {
  border-left-color: #00d4ff60;
  background: rgba(0, 212, 255, 0.04);
}

.fold-item-daily .fold-text {
  color: #94b0c2;
  font-size: 10px;
}

.fold-item-rel {
  border-left-color: #ff2d9560;
  background: rgba(255, 45, 149, 0.04);
}

.fold-item-rel .fold-text {
  color: #e0a0c8;
  font-size: 10px;
}

.fold-bullet {
  flex-shrink: 0;
  margin-top: 2px;
}

.fold-item-daily .fold-bullet {
  color: #00d4ff;
  font-size: 14px;
}

.fold-item-rel .fold-bullet {
  color: #ff2d95;
  font-size: 12px;
}

.daily-badge {
  background: rgba(0, 212, 255, 0.08) !important;
  border-color: #00d4ff40 !important;
}

.daily-badge .age-prefix {
  color: #00d4ff60 !important;
}

.daily-badge .age-num {
  color: #00d4ff !important;
  text-shadow: 0 0 4px #00d4ff80 !important;
}

.rel-badge {
  background: rgba(255, 45, 149, 0.08) !important;
  border-color: #ff2d9540 !important;
}

.rel-badge .age-prefix {
  color: #ff2d9560 !important;
}

.rel-badge .age-num {
  color: #ff2d95 !important;
  text-shadow: 0 0 4px #ff2d9580 !important;
}

.fold-text {
  flex: 1;
  word-break: break-word;
}

/* 滚动区域 */
.log-scroll {
  max-height: 320px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 4px;
  background: rgba(5, 2, 15, 0.6);
  border: 1px solid #c900ff40;
  position: relative;
  scroll-behavior: smooth;
  box-shadow: inset 0 0 12px #00000080;
}

/* CRT扫描线叠加 */
.scanline-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 212, 255, 0.03) 0px,
    rgba(0, 212, 255, 0.03) 1px,
    transparent 1px,
    transparent 3px
  );
}

/* 空状态 */
.log-empty {
  padding: 24px 14px;
  text-align: center;
  color: #566c86;
  font-size: 12px;
  letter-spacing: 1px;
}

.empty-cursor {
  color: #ff2d95;
  text-shadow: 0 0 6px #ff2d95;
  animation: blink 1s steps(2) infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}

/* 日志列表 */
.log-list {
  list-style: none;
  margin: 0;
  padding: 0 6px 0 4px;
  position: relative;
  z-index: 1;
}

.log-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 10px;
  font-size: 12px;
  line-height: 1.6;
  border-left: 3px solid transparent;
  border-bottom: 1px dashed rgba(201, 0, 255, 0.1);
  transition: background 0.12s, border-color 0.2s;
  position: relative;
  opacity: 0;
  animation: logSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.log-item.is-new {
  animation: logSlideInNew 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes logSlideIn {
  from {
    opacity: 0;
    transform: translateX(-6px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes logSlideInNew {
  0% {
    opacity: 0;
    transform: translateX(-12px) translateY(-4px);
    background: rgba(0, 212, 255, 0.15);
  }
  60% {
    opacity: 1;
    transform: translateX(2px);
    background: rgba(0, 212, 255, 0.08);
  }
  100% {
    opacity: 1;
    transform: translateX(0) translateY(0);
    background: transparent;
  }
}

.log-item:hover {
  background: rgba(201, 0, 255, 0.08);
}

/* 年龄badge - 蓝色霓虹小字 */
.log-age-badge {
  flex-shrink: 0;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  padding: 2px 4px;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid #00d4ff60;
  margin-top: 1px;
  box-shadow: 0 0 4px #00d4ff30;
}

.age-prefix {
  font-size: 8px;
  color: #00d4ff80;
  letter-spacing: 1px;
  line-height: 1;
}

.age-num {
  font-size: 12px;
  color: #00d4ff;
  font-weight: bold;
  text-shadow: 0 0 4px #00d4ff;
  line-height: 1.2;
}

.log-bullet {
  color: #c900ff80;
  flex-shrink: 0;
  margin-top: 4px;
  text-shadow: 0 0 4px #c900ff;
}

.log-text {
  flex: 1;
  color: #e0e0e8;
  word-break: break-word;
  text-shadow: 0 0 2px rgba(255, 255, 255, 0.1);
}

/* ============================================================
   左侧边框颜色分类
   ============================================================ */

/* 人际关系日志：左侧粉色竖条 */
.bar-relationship {
  border-left-color: #ff2d95 !important;
  border-left-width: 3px;
}

/* 日常琐事：左侧蓝色竖条（更细） */
.bar-daily {
  border-left-color: #00d4ff80 !important;
  border-left-width: 2px;
}
.bar-daily .log-text {
  font-size: 11px;
  color: #94b0c2;
}

/* 黑天鹅事件：左侧红色竖条（粗） */
.bar-swan {
  border-left-color: #ff004d !important;
  border-left-width: 4px;
}

/* 卡片选择：左侧橙色竖条 */
.bar-card {
  border-left-color: #ff8800 !important;
  border-left-width: 3px;
}

/* ============================================================
   色调差异（保留原有样式 + 新增类型）
   ============================================================ */
.log-item.tone-danger {
  border-left-color: #ff2d95;
  background: rgba(255, 45, 149, 0.05);
}
.log-item.tone-danger .log-age-badge {
  background: rgba(255, 45, 149, 0.15);
  border-color: #ff2d95;
  box-shadow: 0 0 6px #ff2d9540;
}
.log-item.tone-danger .log-age-badge .age-prefix {
  color: #ff2d9580;
}
.log-item.tone-danger .log-age-badge .age-num {
  color: #ff2d95;
  text-shadow: 0 0 6px #ff2d95;
}
.log-item.tone-danger .log-bullet {
  color: #ff2d95;
  text-shadow: 0 0 6px #ff2d95;
}
.log-item.tone-danger .log-text {
  color: #ff9dcc;
  text-shadow: 0 0 4px #ff2d9540;
}

/* 黑天鹅：红色边框闪烁 */
.log-item.tone-swan {
  border-left-color: #ff004d;
  border-left-width: 4px;
  background: rgba(255, 0, 77, 0.08);
  animation: logSlideIn 0.35s forwards, swanBorderFlash 1.2s ease-in-out 0.35s 3;
}
.log-item.tone-swan .log-age-badge {
  background: rgba(255, 0, 77, 0.2);
  border-color: #ff004d;
  box-shadow: 0 0 8px #ff004d60;
}
.log-item.tone-swan .log-age-badge .age-prefix {
  color: #ff004d80;
}
.log-item.tone-swan .log-age-badge .age-num {
  color: #ff004d;
  text-shadow: 0 0 8px #ff004d;
}
.log-item.tone-swan .log-bullet {
  color: #ff004d;
  text-shadow: 0 0 8px #ff004d;
}
.log-item.tone-swan .log-text {
  color: #ff6688;
  text-shadow: 0 0 6px #ff004d60;
  font-weight: bold;
}

@keyframes swanBorderFlash {
  0%, 100% {
    border-left-color: #ff004d;
    box-shadow: inset 4px 0 12px #ff004d40;
  }
  50% {
    border-left-color: #ff2d95;
    box-shadow: inset 4px 0 20px #ff004d80, 0 0 12px #ff004d60;
  }
}

.swan-flash-bar {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 3px;
  background: #ff004d;
  box-shadow: 0 0 8px #ff004d;
  animation: swanBarPulse 0.6s ease-in-out infinite;
}

@keyframes swanBarPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.log-item.tone-success {
  border-left-color: #00ff88;
}
.log-item.tone-success .log-age-badge {
  background: rgba(0, 255, 136, 0.12);
  border-color: #00ff88;
  box-shadow: 0 0 6px #00ff8840;
}
.log-item.tone-success .log-age-badge .age-prefix {
  color: #00ff8880;
}
.log-item.tone-success .log-age-badge .age-num {
  color: #00ff88;
  text-shadow: 0 0 6px #00ff88;
}
.log-item.tone-success .log-bullet {
  color: #00ff88;
  text-shadow: 0 0 6px #00ff88;
}
.log-item.tone-success .log-text {
  color: #99ffcc;
  text-shadow: 0 0 4px #00ff8830;
}

/* 卡片选择事件 - 橙色霓虹 */
.log-item.tone-card {
  border-left-color: #ff8800;
}
.log-item.tone-card .log-age-badge {
  background: rgba(255, 136, 0, 0.12);
  border-color: #ff880060;
}
.log-item.tone-card .log-age-badge .age-prefix {
  color: #ff880080;
}
.log-item.tone-card .log-age-badge .age-num {
  color: #ff8800;
  text-shadow: 0 0 4px #ff8800;
}
.log-item.tone-card .log-bullet {
  color: #ff8800;
  text-shadow: 0 0 4px #ff8800;
}
.log-item.tone-card .log-text {
  color: #ffcc88;
}

/* 人际关系事件 - 粉色霓虹 */
.log-item.tone-relationship {
  border-left-color: #ff2d95;
  background: rgba(255, 45, 149, 0.03);
}
.log-item.tone-relationship .log-age-badge {
  background: rgba(255, 45, 149, 0.1);
  border-color: #ff2d9560;
}
.log-item.tone-relationship .log-age-badge .age-prefix {
  color: #ff2d9580;
}
.log-item.tone-relationship .log-age-badge .age-num {
  color: #ff2d95;
  text-shadow: 0 0 4px #ff2d9580;
}
.log-item.tone-relationship .log-bullet {
  color: #ff2d95;
  text-shadow: 0 0 4px #ff2d95;
}
.log-item.tone-relationship .log-text {
  color: #e0a0c8;
}

/* 日常琐事 - 蓝色淡色 */
.log-item.tone-daily {
  border-left-color: #00d4ff60;
  background: rgba(0, 212, 255, 0.02);
}
.log-item.tone-daily .log-age-badge {
  background: rgba(0, 212, 255, 0.08);
  border-color: #00d4ff40;
}
.log-item.tone-daily .log-age-badge .age-prefix {
  color: #00d4ff60;
}
.log-item.tone-daily .log-age-badge .age-num {
  color: #00d4ff80;
  text-shadow: 0 0 2px #00d4ff40;
}
.log-item.tone-daily .log-bullet {
  color: #00d4ff60;
  text-shadow: none;
}
.log-item.tone-daily .log-text {
  color: #94b0c2;
  font-size: 11px;
}

.log-item.tone-normal {
  border-left-color: #c900ff60;
}
.log-item.tone-normal .log-bullet {
  color: #c900ff80;
}

/* 底部 */
.log-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 4px 0;
  margin-top: 6px;
}

.scan-line {
  flex: 1;
  height: 2px;
  background: repeating-linear-gradient(
    90deg,
    #ff2d95 0,
    #ff2d95 4px,
    transparent 4px,
    transparent 8px
  );
  box-shadow: 0 0 4px #ff2d95;
}

.footer-text {
  font-size: 9px;
  color: #ff2d95;
  letter-spacing: 2px;
  text-shadow: 0 0 4px #ff2d95;
}

/* collapsed 状态 */
.life-log-panel.collapsed .log-scroll {
  display: none;
}
.life-log-panel.collapsed .log-neon-header {
  margin-bottom: 0;
}
.life-log-panel.collapsed .fold-section {
  display: none;
}
</style>
