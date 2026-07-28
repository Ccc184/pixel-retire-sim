<script setup lang="ts">
/**
 * 三分镜场景组件（Demo）
 *
 * 将原单一动画区拆分为三个分镜窗口：
 *   🏠 家庭  — 感情/婚姻/子女/父母
 *   ☕ 生活  — 健康/旅行/日常/居住
 *   💼 事业  — 工作/薪资/创业/路径
 *
 * 当年触发的相关剧情会在次年对应窗口展示分镜动画。
 * 当前为 Demo 阶段：各窗口显示像素网格占位 + 主题标记。
 * 后续将逐个替换为像素动画。
 */

import { computed } from 'vue'
import { useGameStore } from '../../store/game.store.js'

const store = useGameStore()

// ================================================================
//  分镜触发队列（从 store 读取待展示的分镜）
// ================================================================

// 各窗口待展示的分镜列表（由 game.store 在结算时写入）
// pendingStoryboards 格式: { family: string[], life: string[], career: string[] }
const storyboards = computed(() => {
  const sb = (store as any).pendingStoryboards
  if (!sb) return { family: [], life: [], career: [] }
  return {
    family: sb.family || [],
    life: sb.life || [],
    career: sb.career || [],
  }
})

// 各窗口是否有待展示的分镜
const hasFamilyTrigger = computed(() => storyboards.value.family.length > 0)
const hasLifeTrigger = computed(() => storyboards.value.life.length > 0)
const hasCareerTrigger = computed(() => storyboards.value.career.length > 0)

// ================================================================
//  窗口配置
// ================================================================
interface WindowConfig {
  key: 'family' | 'life' | 'career'
  icon: string
  label: string
  subtitle: string
  themeColor: string
  triggerLabel: string
}

const windows: WindowConfig[] = [
  {
    key: 'family',
    icon: '🏠',
    label: '家庭',
    subtitle: 'FAMILY',
    themeColor: '#ff8ab8',
    triggerLabel: '感情 · 婚姻 · 子女 · 父母',
  },
  {
    key: 'life',
    icon: '☕',
    label: '生活',
    subtitle: 'LIFE',
    themeColor: '#00d4ff',
    triggerLabel: '健康 · 旅行 · 日常 · 居住',
  },
  {
    key: 'career',
    icon: '💼',
    label: '事业',
    subtitle: 'CAREER',
    themeColor: '#00ff88',
    triggerLabel: '工作 · 薪资 · 创业 · 路径',
  },
]

// ================================================================
//  像素网格背景数据（用于 Demo 占位展示）
// ================================================================
const gridCols = 8
const gridRows = 5
const gridCells = Array.from({ length: gridCols * gridRows }, (_, i) => i)
</script>

<template>
  <div class="storyboard-scene">
    <!-- 三个分镜窗口 -->
    <div
      v-for="win in windows"
      :key="win.key"
      class="sb-window"
      :class="[
        'sb-' + win.key,
        {
          'is-triggered': win.key === 'family' ? hasFamilyTrigger
            : win.key === 'life' ? hasLifeTrigger
            : hasCareerTrigger,
        }
      ]"
      :style="{ '--theme-color': win.themeColor }"
    >
      <!-- 像素网格占位背景 -->
      <div class="sb-grid-bg">
        <div
          v-for="cell in gridCells"
          :key="cell"
          class="sb-grid-cell"
          :class="{ 'sb-grid-on': cell % 3 === 0 }"
          :style="{
            animationDelay: (cell * 0.08) + 's',
          }"
        />
      </div>

      <!-- 窗口标签 -->
      <div class="sb-label-bar">
        <span class="sb-icon">{{ win.icon }}</span>
        <span class="sb-label-text">{{ win.label }}</span>
        <span class="sb-subtitle">{{ win.subtitle }}</span>
      </div>

      <!-- 中心占位区 -->
      <div class="sb-center">
        <!-- Demo 占位图标 -->
        <div class="sb-placeholder">
          <div class="sb-placeholder-icon">{{ win.icon }}</div>
          <div class="sb-placeholder-text">像素动画待制作</div>
        </div>

        <!-- 触发指示器（有分镜待展示时显示） -->
        <div
          v-if="win.key === 'family' ? hasFamilyTrigger : win.key === 'life' ? hasLifeTrigger : hasCareerTrigger"
          class="sb-trigger-indicator"
        >
          <span class="sb-trigger-dot" />
          <span class="sb-trigger-text">▶ 回味</span>
        </div>
      </div>

      <!-- 底部触发类型标签 -->
      <div class="sb-trigger-label">
        {{ win.triggerLabel }}
      </div>

      <!-- DEMO 水印 -->
      <div class="sb-demo-watermark">DEMO</div>

      <!-- 窗口间分隔线（最右边的窗口不显示） -->
      <div v-if="win.key !== 'career'" class="sb-divider" />
    </div>
  </div>
</template>

<style scoped>
/* ============================================================
   三分镜容器：填满 CRT 屏幕，无留白
   ============================================================ */
.storyboard-scene {
  position: absolute;
  inset: 0;
  display: flex;
  gap: 2px;
  width: 100%;
  height: 100%;
  background: #050608;
  overflow: hidden;
}

/* ============================================================
   单个分镜窗口
   ============================================================ */
.sb-window {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #08080f;
  transition: background 0.4s ease;
}

/* 触发态：窗口微微亮起 */
.sb-window.is-triggered {
  background: #0c0c18;
}

/* ============================================================
   像素网格背景（Demo 占位）
   ============================================================ */
.sb-grid-bg {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(5, 1fr);
  gap: 0;
  opacity: 0.15;
  z-index: 0;
}

.sb-grid-cell {
  border: 0.5px solid rgba(255, 255, 255, 0.06);
}

.sb-grid-on {
  background: var(--theme-color);
  opacity: 0;
  animation: gridPulse 3s ease-in-out infinite;
}

@keyframes gridPulse {
  0%, 100% { opacity: 0; }
  50% { opacity: 0.15; }
}

/* ============================================================
   窗口标签栏（顶部）
   ============================================================ */
.sb-label-bar {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.6), transparent);
  flex-shrink: 0;
}

.sb-icon {
  font-size: 11px;
  line-height: 1;
}

.sb-label-text {
  font-family: 'DotGothic16', monospace;
  font-size: 11px;
  color: var(--theme-color);
  text-shadow: 0 0 4px var(--theme-color);
  letter-spacing: 1px;
}

.sb-subtitle {
  font-family: 'DotGothic16', monospace;
  font-size: 7px;
  color: rgba(255, 255, 255, 0.2);
  letter-spacing: 1px;
  margin-left: auto;
}

/* ============================================================
   中心占位区
   ============================================================ */
.sb-center {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 0;
}

.sb-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  opacity: 0.3;
}

.sb-placeholder-icon {
  font-size: 28px;
  line-height: 1;
  filter: grayscale(0.5);
  animation: placeholderBob 4s ease-in-out infinite;
}

@keyframes placeholderBob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.sb-placeholder-text {
  font-family: 'DotGothic16', monospace;
  font-size: 8px;
  color: rgba(255, 255, 255, 0.2);
  letter-spacing: 1px;
  white-space: nowrap;
}

/* ============================================================
   触发指示器
   ============================================================ */
.sb-trigger-indicator {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid var(--theme-color);
  border-radius: 2px;
  animation: triggerBlink 1.5s ease-in-out infinite;
}

.sb-trigger-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--theme-color);
  box-shadow: 0 0 4px var(--theme-color);
}

.sb-trigger-text {
  font-family: 'DotGothic16', monospace;
  font-size: 7px;
  color: var(--theme-color);
  text-shadow: 0 0 3px var(--theme-color);
  letter-spacing: 0.5px;
}

@keyframes triggerBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ============================================================
   底部触发类型标签
   ============================================================ */
.sb-trigger-label {
  position: relative;
  z-index: 2;
  padding: 3px 6px;
  font-family: 'DotGothic16', monospace;
  font-size: 7px;
  color: rgba(255, 255, 255, 0.15);
  letter-spacing: 0.5px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.5), transparent);
}

/* ============================================================
   DEMO 水印
   ============================================================ */
.sb-demo-watermark {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  font-family: 'DotGothic16', monospace;
  font-size: 7px;
  color: rgba(255, 255, 255, 0.08);
  letter-spacing: 2px;
  pointer-events: none;
  animation: demoBlink 3s ease-in-out infinite;
}

@keyframes demoBlink {
  0%, 70%, 100% { opacity: 0.3; }
  85% { opacity: 0.6; }
}

/* ============================================================
   窗口间分隔线
   ============================================================ */
.sb-divider {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    var(--theme-color) 20%,
    var(--theme-color) 80%,
    transparent 100%
  );
  opacity: 0.2;
  z-index: 5;
}

/* ============================================================
   主题色覆盖
   ============================================================ */
.sb-family {
  --theme-color: #ff8ab8;
}

.sb-life {
  --theme-color: #00d4ff;
}

.sb-career {
  --theme-color: #00ff88;
}

/* ============================================================
   响应式：窄屏优化
   ============================================================ */
@media (max-width: 900px) {
  .sb-icon {
    font-size: 10px;
  }

  .sb-label-text {
    font-size: 10px;
  }

  .sb-subtitle {
    display: none;
  }

  .sb-placeholder-icon {
    font-size: 22px;
  }

  .sb-placeholder-text {
    font-size: 7px;
  }

  .sb-trigger-label {
    font-size: 6px;
  }

  .sb-demo-watermark {
    font-size: 6px;
    bottom: 10px;
  }
}

@media (max-width: 600px) {
  .sb-label-bar {
    padding: 3px 4px;
    gap: 2px;
  }

  .sb-icon {
    font-size: 9px;
  }

  .sb-label-text {
    font-size: 9px;
    letter-spacing: 0.5px;
  }

  .sb-placeholder-icon {
    font-size: 18px;
  }

  .sb-placeholder-text {
    font-size: 6px;
  }

  .sb-trigger-label {
    font-size: 5px;
    padding: 2px 3px;
  }

  .sb-demo-watermark {
    font-size: 5px;
    bottom: 8px;
  }

  .sb-trigger-indicator {
    padding: 1px 4px;
    top: 2px;
    right: 2px;
  }

  .sb-trigger-text {
    font-size: 6px;
  }
}
</style>
