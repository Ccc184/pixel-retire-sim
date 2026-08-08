<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useGameStore } from '../../store/game.store.js';
import { interpolateText } from '../../utils/text-interpolate.js';

const store = useGameStore();
const s = computed(() => store.state);

// 渲染时插值 {startAge}/{age} 占位符（覆盖开局日志等直接写入 lifeLog 的文案）
function interp(log: string): string {
  return interpolateText(log, s.value);
}

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
type LogCategory = 'danger' | 'success' | 'card' | 'swan' | 'relationship' | 'daily' | 'investment' | 'freedom' | 'normal';

function getLogCategory(log: string): LogCategory {
  // 黑天鹅事件（最高优先级）
  if (/黑天鹅/.test(log)) return 'swan';
  // 危险 / 负面冲击
  if (/(爆仓|重病|破产|裁员|失业|被骗|损失|阴影|创伤|警示|崩盘|债务|亏损|病危|手术|住院|透支|榨干|抗议|卷.*钱|窟窿|取关|难度)/.test(log)) return 'danger';
  // 人际关系事件
  if (/(父母|伴侣|配偶|孩子|子女|朋友|同事|离婚|结婚|恩爱|感情|关系|亲情|恋人|分手|表白|陪伴|供养)/.test(log)) return 'relationship';
  // 投资 / 链上 / 资产运作
  if (/(加密|比特币|代币|持仓|仓位|K线|HODL|TVL|套现|融资|股权|收购|清仓|牛市|熊市|投资|股份|回购|链上|资产|增值|发行|上市|涨了|翻了)/.test(log)) return 'investment';
  // 事业突破 / 成长
  if (/(升职|加薪|宝宝|副业|保险|极简|套利|产品上线|订阅|被动收入|合同|订单|粉丝|付费社区|加盟|示范点|签约|突破|里程碑|成功|赚到|盈利|客户|交付|品牌|声誉|覆盖)/.test(log)) return 'success';
  // 人生转折 / 自由选择
  if (/(辞职|辞职信|离职|出走|单程票|自由|退休|归来|告别|出发|回老家)/.test(log)) return 'freedom';
  // 卡片选择类事件
  if (/(你选择|购入|买入|报名|学习|开启|升级|跳槽|搬家|配置|加入|成立|拜访)/.test(log)) return 'card';
  // 日常琐事
  if (/(体检|看病|感冒|堵车|加班|外卖|房租|水电|通勤|家务|买菜|失眠|咳嗽|发烧)/.test(log)) return 'daily';
  return 'normal';
}

// 提取日常琐事日志（全部展示，避免与主列表重复时丢失旧记录）
const dailyLogs = computed(() => {
  return displayLogs.value.filter(log => getLogCategory(log) === 'daily').reverse();
});

// 提取人际关系日志（全部展示）
const relationshipLogs = computed(() => {
  return displayLogs.value.filter(log => getLogCategory(log) === 'relationship').reverse();
});

// 主日志列表：排除已进入"日常琐事/关系动态"折叠区的日志，避免同一文本重复渲染（P0修复）
const mainLogs = computed(() => {
  return displayLogs.value.filter(log => !['daily', 'relationship'].includes(getLogCategory(log)));
});

// 结局触发时给面板加特殊边框
const isEnding = computed(() => s.value.endingTriggered);

// 日志更新时自动滚动到底部（最新在底部）
watch(
  () => s.value.lifeLog.length,
  async () => {
    await nextTick();
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  },
);

// 提取年龄（兼容"第X岁"与"X岁这年"两种开头），用于显示小标签
function extractAge(log: string): string {
  const match = log.match(/^第?(\d+)岁/);
  return match ? match[1] : '';
}

// 为每条日志计算年龄：无法从自身提取时，继承上一条带年龄日志的年龄（叙事日志同属该年）
const ageOfLog = computed(() => {
  const map = new Map<string, string>();
  let lastAge = '';
  for (const log of displayLogs.value) {
    const own = extractAge(log);
    if (own) lastAge = own;
    map.set(log, lastAge || '—');
  }
  return map;
});
function ageOf(log: string): string {
  return ageOfLog.value.get(log) || '—';
}

// 是否是新日志（最后一条），用于入场动画
function isNewest(idx: number): boolean {
  return idx === mainLogs.value.length - 1;
}
</script>

<template>
  <div
    class="life-log-panel"
    :class="{ 'ending-border': isEnding }"
  >
    <!-- 紧凑头部 -->
    <div class="log-header-bar">
      <span class="header-title">▸ 人生日志</span>
      <span class="header-count">{{ displayLogs.length }}</span>
    </div>

    <!-- 内容滚动区 -->
    <div class="log-body" ref="logContainer">
      <!-- CRT扫描线纹理层（subtle） -->
      <div class="scanline-overlay" />

      <!-- ============================================================ -->
      <!--  日常琐事折叠区（默认收起，只显示最近3条）                     -->
      <!-- ============================================================ -->
      <div v-if="dailyLogs.length > 0" class="fold-section">
        <button class="fold-header" @click="dailyCollapsed = !dailyCollapsed" type="button">
          <span class="fold-arrow" :class="{ rotated: dailyCollapsed }">▶</span>
          <span class="fold-title">日常琐事</span>
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
                <span class="age-num">{{ ageOf(log) }}</span>
              </span>
              <span class="fold-text">{{ interp(log) }}</span>
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
          <span class="fold-title">关系动态</span>
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
                <span class="age-num">{{ ageOf(log) }}</span>
              </span>
              <span class="fold-text">{{ interp(log) }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="displayLogs.length === 0" class="log-empty">
        <span class="empty-cursor">_</span>
        <span class="empty-text"> 日志空空如也，像素人生尚未开始...</span>
      </div>

      <!-- ============================================================ -->
      <!--  主日志列表                                                     -->
      <!-- ============================================================ -->
      <ul class="log-list">
        <li
          v-for="(log, idx) in mainLogs"
          :key="'main-' + idx"
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
            <span class="age-num">{{ ageOf(log) }}</span>
          </span>
          <span class="log-text">{{ interp(log) }}</span>
          <!-- 黑天鹅闪烁边框条 -->
          <span v-if="getLogCategory(log) === 'swan'" class="swan-flash-bar" />
        </li>
      </ul>
    </div>

    <!-- 底部标记 -->
    <div class="log-footer">
      <span class="footer-text">[ END ]</span>
    </div>
  </div>
</template>

<style scoped>
/* ============================================================
   CSS 变量定义
   ============================================================ */
.life-log-panel {
  --color-primary: #e8e0f0;
  --color-secondary: #94a0b8;
  --color-dim: #6a6a8a;
  --bg-panel: rgba(15, 8, 35, 0.85);
  --border-dim: rgba(255, 255, 255, 0.08);
  --border-faint: rgba(255, 255, 255, 0.03);

  background: var(--bg-panel);
  border: 1px solid var(--border-dim);
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  font-family: 'DotGothic16', monospace;
  color: var(--color-secondary);
  flex: 1;
  min-height: 0;
}

/* ============================================================
   结局触发时的特殊霓虹边框效果
   ============================================================ */
.life-log-panel.ending-border {
  animation: endingBorderPulse 2s ease-in-out infinite;
}

@keyframes endingBorderPulse {
  0%, 100% {
    border-color: var(--neon-pink);
    box-shadow:
      0 0 10px var(--neon-pink),
      0 0 25px rgba(255, 45, 149, 0.5),
      0 0 50px rgba(201, 0, 255, 0.25),
      inset 0 0 20px rgba(255, 45, 149, 0.13);
  }
  50% {
    border-color: var(--neon-purple);
    box-shadow:
      0 0 15px var(--neon-purple),
      0 0 35px rgba(201, 0, 255, 0.5),
      0 0 60px rgba(0, 212, 255, 0.25),
      inset 0 0 25px rgba(201, 0, 255, 0.13);
  }
}

/* ============================================================
   紧凑头部
   ============================================================ */
.log-header-bar {
  padding: 6px 10px;
  border-bottom: 1px solid var(--border-dim);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.header-title {
  font-size: 10px;
  color: var(--color-dim);
  letter-spacing: 2px;
  text-transform: uppercase;
  font-family: 'DotGothic16', monospace;
}

.header-count {
  font-size: 10px;
  color: var(--neon-blue);
  font-family: 'DotGothic16', monospace;
  font-weight: 700;
}

/* ============================================================
   内容滚动区
   ============================================================ */
.log-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  padding: 6px 10px;
  position: relative;
  scroll-behavior: smooth;
}

/* 滚动条 - 极简 */
.log-body::-webkit-scrollbar {
  width: 4px;
}
.log-body::-webkit-scrollbar-track {
  background: transparent;
}
.log-body::-webkit-scrollbar-thumb {
  background: rgba(0, 212, 255, 0.2);
  border-radius: 2px;
}
.log-body::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 212, 255, 0.4);
}

/* CRT扫描线叠加 - subtle */
.scanline-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 212, 255, 0.02) 0px,
    rgba(0, 212, 255, 0.02) 1px,
    transparent 1px,
    transparent 4px
  );
}

/* ============================================================
   空状态
   ============================================================ */
.log-empty {
  padding: 20px 8px;
  text-align: center;
  color: var(--color-dim);
  font-size: 10px;
  letter-spacing: 1px;
}

.empty-cursor {
  color: var(--neon-pink);
  animation: blink 1s steps(2) infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}

/* ============================================================
   折叠区：日常琐事 / 关系动态（compact）
   ============================================================ */
.fold-section {
  margin-bottom: 2px;
}

.fold-header {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--border-faint);
  padding: 4px 0;
  cursor: pointer;
  font-family: 'DotGothic16', monospace;
  color: var(--color-dim);
  text-align: left;
  transition: color 0.15s ease;
}

.fold-header:hover {
  color: var(--color-secondary);
}

.fold-arrow {
  display: inline-block;
  font-size: 10px;
  color: var(--color-dim);
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fold-arrow.rotated {
  transform: rotate(-90deg);
}

.fold-title {
  font-size: 10px;
  letter-spacing: 1px;
  text-transform: uppercase;
  flex: 1;
}

.fold-count {
  font-size: 10px;
  padding: 0 2px;
  font-weight: 700;
}

.fold-count.daily-count {
  color: var(--neon-blue);
}

.fold-count.rel-count {
  color: var(--neon-pink);
}

.fold-body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fold-body.open {
  max-height: 320px;
  overflow-y: auto;
  scrollbar-gutter: stable;
}

.fold-list {
  list-style: none;
  margin: 0;
  padding: 2px 0 2px 6px;
}

.fold-item {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  padding: 4px 0;
  font-size: 10px;
  line-height: 1.4;
  border-bottom: 1px solid var(--border-faint);
}

.fold-item:last-child {
  border-bottom: none;
}

.fold-item-daily .fold-text {
  color: var(--color-secondary);
}

.fold-item-rel .fold-text {
  color: #e0a0c8;
}

.fold-text {
  flex: 1;
  word-break: break-word;
  margin-top: 1px;
}

/* ============================================================
   主日志列表
   ============================================================ */
.log-list {
  list-style: none;
  margin: 0;
  padding: 0;
  position: relative;
  z-index: 1;
}

.log-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 4px 6px 6px;
  border-bottom: 1px solid var(--border-faint);
  border-left: 2px solid transparent;
  font-size: 10px;
  line-height: 1.6;
  color: var(--color-secondary);
  transition: background 0.12s, border-color 0.2s;
  position: relative;
}

.log-item.is-new {
  animation: logSlideInNew 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes logSlideIn {
  from {
    opacity: 0;
    transform: translateX(-4px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes logSlideInNew {
  0% {
    opacity: 0;
    background: rgba(0, 212, 255, 0.14);
  }
  60% {
    opacity: 1;
    background: rgba(0, 212, 255, 0.06);
  }
  100% {
    opacity: 1;
    background: transparent;
  }
}

.log-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

/* 年龄 badge - compact pixel block */
.log-age-badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--neon-blue);
  font-weight: 700;
  font-size: 10px;
  font-family: 'DotGothic16', monospace;
  padding: 1px 5px 1px 4px;
  margin-top: 1px;
  background: rgba(0, 212, 255, 0.08);
  border: 1px solid rgba(0, 212, 255, 0.25);
  border-radius: 3px;
  box-shadow: 0 0 6px rgba(0, 212, 255, 0.15) inset;
  line-height: 1.2;
  white-space: nowrap;
}

.age-prefix {
  font-size: 7px;
  opacity: 0.6;
  letter-spacing: 1px;
}

.age-num {
  font-size: 11px;
  text-shadow: 0 0 4px currentColor;
  min-width: 12px;
  text-align: center;
}

.log-text {
  flex: 1;
  word-break: break-word;
  margin-top: 1px;
}

/* ============================================================
   左侧边框颜色分类（bar-*）
   ============================================================ */

/* 人际关系日志：左侧粉色竖条 */
.bar-relationship {
  border-left-color: var(--neon-pink) !important;
}

/* 日常琐事：左侧蓝色竖条 */
.bar-daily {
  border-left-color: rgba(0, 212, 255, 0.5) !important;
}

/* 黑天鹅事件：左侧红色竖条（粗） */
.bar-swan {
  border-left-color: var(--neon-red) !important;
  border-left-width: 3px;
}

/* 卡片选择：左侧橙色竖条 */
.bar-card {
  border-left-color: var(--neon-orange) !important;
}

/* ============================================================
   色调差异（tone-*）- 保留全部分类色彩编码
   ============================================================ */

/* danger - 危险事件 */
.log-item.tone-danger {
  border-left-color: var(--neon-pink);
  background: rgba(255, 45, 149, 0.04);
}
.log-item.tone-danger .log-age-badge {
  color: var(--neon-pink);
  background: rgba(255, 45, 149, 0.1);
  border-color: rgba(255, 45, 149, 0.4);
  box-shadow: 0 0 6px rgba(255, 45, 149, 0.2) inset;
}
.log-item.tone-danger .log-text {
  color: #ff9dcc;
}

/* swan - 黑天鹅闪烁 */
.log-item.tone-swan {
  border-left-color: var(--neon-red);
  border-left-width: 3px;
  background: rgba(255, 68, 68, 0.06);
  animation: logSlideIn 0.3s forwards, swanBorderFlash 1.2s ease-in-out 0.3s 3;
}
.log-item.tone-swan .log-age-badge {
  color: var(--neon-red);
  background: rgba(255, 68, 68, 0.12);
  border-color: rgba(255, 68, 68, 0.45);
  box-shadow: 0 0 6px rgba(255, 68, 68, 0.25) inset;
}
.log-item.tone-swan .log-text {
  color: #ff6688;
  font-weight: 700;
}

@keyframes swanBorderFlash {
  0%, 100% {
    border-left-color: var(--neon-red);
    box-shadow: inset 3px 0 10px rgba(255, 68, 68, 0.25);
  }
  50% {
    border-left-color: var(--neon-pink);
    box-shadow: inset 3px 0 16px rgba(255, 68, 68, 0.5), 0 0 10px rgba(255, 68, 68, 0.4);
  }
}

.swan-flash-bar {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 2px;
  background: var(--neon-red);
  box-shadow: 0 0 6px var(--neon-red);
  animation: swanBarPulse 0.6s ease-in-out infinite;
}

@keyframes swanBarPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* success - 成功事件 */
.log-item.tone-success {
  border-left-color: var(--neon-green);
}
.log-item.tone-success .log-age-badge {
  color: var(--neon-green);
  background: rgba(57, 255, 20, 0.1);
  border-color: rgba(57, 255, 20, 0.4);
  box-shadow: 0 0 6px rgba(57, 255, 20, 0.2) inset;
}
.log-item.tone-success .log-text {
  color: #99ffcc;
}

/* card - 卡片选择事件 */
.log-item.tone-card {
  border-left-color: var(--neon-orange);
}
.log-item.tone-card .log-age-badge {
  color: var(--neon-orange);
  background: rgba(255, 140, 0, 0.12);
  border-color: rgba(255, 140, 0, 0.45);
  box-shadow: 0 0 6px rgba(255, 140, 0, 0.22) inset;
}
.log-item.tone-card .log-text {
  color: #ffcc88;
}

/* relationship - 人际关系事件 */
.log-item.tone-relationship {
  border-left-color: var(--neon-pink);
  background: rgba(255, 45, 149, 0.03);
}
.log-item.tone-relationship .log-age-badge {
  color: var(--neon-pink);
  background: rgba(255, 45, 149, 0.1);
  border-color: rgba(255, 45, 149, 0.4);
  box-shadow: 0 0 6px rgba(255, 45, 149, 0.2) inset;
}
.log-item.tone-relationship .log-text {
  color: #e0a0c8;
}

/* daily - 日常琐事 */
.log-item.tone-daily {
  border-left-color: rgba(0, 212, 255, 0.5);
  background: rgba(0, 212, 255, 0.02);
}
.log-item.tone-daily .log-age-badge {
  color: var(--neon-blue);
  background: rgba(0, 212, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.4);
  box-shadow: 0 0 6px rgba(0, 212, 255, 0.2) inset;
}
.log-item.tone-daily .log-text {
  color: var(--color-secondary);
}

/* normal - 普通日志（中性格调，避免整体偏紫） */
.log-item.tone-normal {
  border-left-color: rgba(148, 160, 184, 0.35);
}
.log-item.tone-normal .log-age-badge {
  color: var(--color-secondary);
  background: rgba(148, 160, 184, 0.1);
  border-color: rgba(148, 160, 184, 0.3);
  box-shadow: 0 0 6px rgba(148, 160, 184, 0.12) inset;
}
.log-item.tone-normal .log-text {
  color: var(--color-secondary);
}

/* investment - 投资 / 链上 / 资产运作（青蓝） */
.log-item.tone-investment {
  border-left-color: var(--neon-blue);
  background: rgba(0, 212, 255, 0.03);
}
.log-item.tone-investment .log-age-badge {
  color: var(--neon-blue);
  background: rgba(0, 212, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.4);
  box-shadow: 0 0 6px rgba(0, 212, 255, 0.2) inset;
}
.log-item.tone-investment .log-text {
  color: #7fd9ff;
}

/* freedom - 人生转折 / 自由选择（温暖金） */
.log-item.tone-freedom {
  border-left-color: #ffd76a;
  background: rgba(255, 215, 106, 0.04);
}
.log-item.tone-freedom .log-age-badge {
  color: #ffd76a;
  background: rgba(255, 215, 106, 0.1);
  border-color: rgba(255, 215, 106, 0.4);
  box-shadow: 0 0 6px rgba(255, 215, 106, 0.2) inset;
}
.log-item.tone-freedom .log-text {
  color: #ffd76a;
}

/* ============================================================
   折叠区 badge 变体
   ============================================================ */
.daily-badge {
  color: var(--neon-blue) !important;
}

.rel-badge {
  color: var(--neon-pink) !important;
}

/* ============================================================
   底部标记
   ============================================================ */
.log-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 0;
  border-top: 1px solid var(--border-dim);
  flex-shrink: 0;
}

.footer-text {
  font-size: 9px;
  color: var(--color-dim);
  letter-spacing: 2px;
  font-family: 'DotGothic16', monospace;
}
</style>
