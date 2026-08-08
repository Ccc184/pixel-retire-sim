<script setup lang="ts">
import { ref } from 'vue'
import { playClick } from '../../utils/audio.js'

const STORAGE_KEY = 'pixel_retire_tutorial_seen'

const visible = ref<boolean>(() => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== '1'
  } catch {
    return true
  }
})

// 引导提示：贴合本作"路径赌局 + 纯剧情 + 退休自由"的核心特色
const tips: { icon: string; title: string; desc: string; color: string }[] = [
  {
    icon: '◈',
    title: '六条人生路径',
    desc: '开局选一条，就是赌一个未来。没有对错，走到底才知道值不值。',
    color: 'var(--neon-pink)',
  },
  {
    icon: '▲',
    title: '剧情才是主角',
    desc: '每年结算，先看你那年的选择勾出了什么故事，数字只是顺带的账。',
    color: 'var(--neon-blue)',
  },
  {
    icon: '★',
    title: '退休自由',
    desc: '退休键从一开始就是亮的，想按随时按。60岁是硬上限，不是终点。',
    color: 'var(--neon-yellow)',
  },
]

function dismiss(): void {
  playClick()
  visible.value = false
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    /* ignore */
  }
}
</script>

<template>
  <Transition name="tut">
    <div v-if="visible" class="tutorial-overlay">
      <div class="tutorial-modal pixel-panel">
        <div class="tut-corner tl" />
        <div class="tut-corner tr" />
        <div class="tut-corner bl" />
        <div class="tut-corner br" />

        <div class="tut-eyebrow">
          <span class="eyebrow-line" />
          <span class="eyebrow-text">SYSTEM BOOT // 新手须知</span>
          <span class="eyebrow-line" />
        </div>

        <h2 class="tut-title">开始你的人生</h2>

        <div class="tut-list">
          <div v-for="(t, i) in tips" :key="i" class="tut-item">
            <span class="tut-icon" :style="{ color: t.color, borderColor: t.color }">{{ t.icon }}</span>
            <div class="tut-body">
              <div class="tut-item-title">{{ t.title }}</div>
              <div class="tut-item-desc">{{ t.desc }}</div>
            </div>
          </div>
        </div>

        <button class="tut-start" @click="dismiss">
          <span class="btn-arrow">▶</span>
          <span class="btn-text">开始人生</span>
          <span class="btn-cursor">_</span>
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.tutorial-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(5, 0, 15, 0.78);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.tutorial-modal {
  position: relative;
  width: min(520px, 100%);
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 28px 30px;
  background: rgba(10, 5, 25, 0.92);
  border: 2px solid var(--neon-purple);
  box-shadow:
    0 0 24px var(--neon-purple),
    0 0 60px rgba(201, 0, 255, 0.35),
    inset 0 0 30px rgba(201, 0, 255, 0.08);
  animation: tutPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes tutPop {
  from { opacity: 0; transform: scale(0.88) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.tut-corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid var(--neon-pink);
  box-shadow: 0 0 8px var(--neon-pink);
  pointer-events: none;
}
.tut-corner.tl { top: -2px; left: -2px; border-right: none; border-bottom: none; }
.tut-corner.tr { top: -2px; right: -2px; border-left: none; border-bottom: none; border-color: var(--neon-blue); box-shadow: 0 0 8px var(--neon-blue); }
.tut-corner.bl { bottom: -2px; left: -2px; border-right: none; border-top: none; border-color: var(--neon-blue); box-shadow: 0 0 8px var(--neon-blue); }
.tut-corner.br { bottom: -2px; right: -2px; border-left: none; border-top: none; border-color: var(--neon-orange); box-shadow: 0 0 8px var(--neon-orange); }

.tut-eyebrow {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 11px;
  color: var(--neon-blue);
  letter-spacing: 3px;
  text-shadow: 0 0 6px var(--neon-blue);
}
.eyebrow-line {
  display: inline-block;
  width: 34px;
  height: 1px;
  background: var(--neon-blue);
  box-shadow: 0 0 6px var(--neon-blue);
}

.tut-title {
  margin: 0;
  font-size: 26px;
  color: var(--neon-pink);
  letter-spacing: 4px;
  text-align: center;
  text-shadow:
    0 0 6px var(--neon-pink),
    0 0 16px var(--neon-pink),
    0 0 28px var(--neon-purple);
}

.tut-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.tut-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid rgba(201, 0, 255, 0.25);
  background: rgba(0, 0, 0, 0.25);
}

.tut-icon {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  border: 1px solid;
  text-shadow: 0 0 6px currentColor;
}

.tut-body {
  flex: 1;
  min-width: 0;
}
.tut-item-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--pico-white);
  letter-spacing: 1px;
  margin-bottom: 3px;
}
.tut-item-desc {
  font-size: 12px;
  line-height: 1.7;
  color: var(--pico-peach);
  opacity: 0.9;
}

.tut-start {
  align-self: center;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  padding: 12px 36px;
  margin-top: 4px;
  background: rgba(0, 30, 10, 0.85);
  color: var(--neon-green);
  border: 2px solid var(--neon-green);
  box-shadow:
    0 0 10px rgba(0, 255, 136, 0.5),
    0 0 24px rgba(0, 255, 136, 0.25),
    inset 0 0 12px rgba(0, 255, 136, 0.15);
  letter-spacing: 3px;
  text-shadow:
    0 0 8px var(--neon-green),
    0 0 18px var(--neon-green);
  cursor: pointer;
  transition: all 0.2s;
}
.tut-start:hover {
  background: rgba(0, 255, 136, 0.18);
  color: #fff;
  transform: scale(1.04);
}
.btn-arrow { animation: arrowPulse 0.8s ease-in-out infinite; }
@keyframes arrowPulse {
  0%, 100% { transform: translateX(0); opacity: 1; }
  50% { transform: translateX(4px); opacity: 0.6; }
}
.btn-cursor {
  font-size: 17px;
  animation: cursorBlink 1s steps(2) infinite;
}
@keyframes cursorBlink { 50% { opacity: 0; } }

.tut-enter-active, .tut-leave-active { transition: opacity 0.25s ease; }
.tut-enter-from, .tut-leave-to { opacity: 0; }
</style>