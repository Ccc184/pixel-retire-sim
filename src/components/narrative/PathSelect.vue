<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../../store/game.store.js';
import { getAllPaths } from '../../data/retirement-paths.js';
import type { RetirementPathId } from '../../types/global.d.js';
import { playClick } from '../../utils/audio.js';

const store = useGameStore();
const paths = computed(() => getAllPaths());

const emit = defineEmits<{
  (e: 'select', pathId: RetirementPathId): void;
}>();

function selectPath(pathId: RetirementPathId) {
  playClick();
  store.selectRetirementPath(pathId);
}
</script>

<template>
  <div class="path-select-screen">
    <div class="path-select-inner">
      <!-- 装饰角标 -->
      <div class="intro-corner tl" />
      <div class="intro-corner tr" />
      <div class="intro-corner bl" />
      <div class="intro-corner br" />

      <div class="path-eyebrow">
        <span class="eyebrow-line" />
        <span class="eyebrow-text">SELECT YOUR PATH // 选择你的赌注</span>
        <span class="eyebrow-line" />
      </div>

      <h2 class="path-title">你打算怎么提前退休？</h2>

      <p class="path-desc">
        22岁，你不想等到60岁。<br>
        你要赌一个未来。选一条路，然后走到底。<br>
        <span class="path-warn">每条路都有不同的中期崩塌和结局，没有对错。</span>
      </p>

      <div class="path-grid">
        <div
          v-for="path in paths"
          :key="path.id"
          class="path-card"
          :style="{ '--path-color': path.color }"
          @click="selectPath(path.id)"
        >
          <div class="path-icon">{{ path.icon }}</div>
          <div class="path-name">{{ path.name }}</div>
          <div class="path-subtitle">{{ path.subtitle }}</div>
          <div class="path-card-desc">{{ path.description }}</div>
          <div class="path-enter">► 赌这条路</div>
        </div>
      </div>

      <p class="path-foot">
        // 你的选择将决定未来每一年你会看到什么、遇到什么、失去什么 //
      </p>
    </div>
  </div>
</template>

<style scoped>
.path-select-screen {
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 20px 16px;
  overflow-y: auto;
  min-height: 100vh;
}

.path-select-inner {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
  max-width: 960px;
  width: 100%;
  padding: 32px 28px;
  background: rgba(10, 5, 25, 0.72);
  border: 2px solid var(--neon-purple);
  box-shadow:
    0 0 20px var(--neon-purple),
    0 0 50px rgba(201, 0, 255, 0.4),
    0 0 100px rgba(0, 212, 255, 0.15),
    inset 0 0 40px rgba(201, 0, 255, 0.08);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  margin: 20px 0;
}

/* 四角霓虹装饰 */
.intro-corner {
  position: absolute;
  width: 24px;
  height: 24px;
  border: 2px solid var(--neon-pink);
  box-shadow: 0 0 8px var(--neon-pink);
}
.intro-corner.tl { top: -2px; left: -2px; border-right: none; border-bottom: none; }
.intro-corner.tr { top: -2px; right: -2px; border-left: none; border-bottom: none; border-color: var(--neon-blue); box-shadow: 0 0 8px var(--neon-blue); }
.intro-corner.bl { bottom: -2px; left: -2px; border-right: none; border-top: none; border-color: var(--neon-blue); box-shadow: 0 0 8px var(--neon-blue); }
.intro-corner.br { bottom: -2px; right: -2px; border-left: none; border-top: none; border-color: var(--neon-orange); box-shadow: 0 0 8px var(--neon-orange); }

.path-eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  color: var(--neon-blue);
  letter-spacing: 2px;
  text-shadow: 0 0 6px var(--neon-blue);
}

.eyebrow-line {
  display: inline-block;
  width: 30px;
  height: 1px;
  background: var(--neon-blue);
  box-shadow: 0 0 6px var(--neon-blue);
}

.path-title {
  font-size: 32px;
  margin: 4px 0 0 0;
  letter-spacing: 4px;
  color: var(--neon-pink);
  text-shadow:
    0 0 6px var(--neon-pink),
    0 0 14px var(--neon-pink),
    0 0 28px var(--neon-purple);
}

.path-desc {
  font-size: 14px;
  color: var(--pico-peach);
  line-height: 1.9;
  letter-spacing: 1px;
  margin: 4px 0 8px 0;
  text-shadow: 0 0 4px rgba(255, 204, 170, 0.4);
}

.path-warn {
  color: var(--neon-orange);
  font-size: 12px;
  text-shadow: 0 0 4px var(--neon-orange);
}

.path-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  width: 100%;
  margin-top: 8px;
}

@media (max-width: 700px) {
  .path-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .path-grid {
    grid-template-columns: 1fr;
  }
}

.path-card {
  position: relative;
  padding: 20px 14px;
  background: rgba(15, 8, 35, 0.9);
  border: 2px solid var(--path-color, var(--neon-purple));
  box-shadow:
    0 0 8px var(--path-color, var(--neon-purple)),
    inset 0 0 12px rgba(255, 255, 255, 0.04);
  cursor: pointer;
  transition: all 0.25s ease;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.path-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px,
    transparent 3px,
    rgba(255, 255, 255, 0.02) 3px,
    rgba(255, 255, 255, 0.02) 4px
  );
  pointer-events: none;
}

.path-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(90deg,
    transparent,
    rgba(255, 255, 255, 0.08),
    transparent);
  transition: left 0.5s ease;
  pointer-events: none;
}

.path-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow:
    0 0 14px var(--path-color, var(--neon-purple)),
    0 0 30px var(--path-color, var(--neon-purple)),
    inset 0 0 20px rgba(255, 255, 255, 0.08);
  border-color: #fff;
}

.path-card:hover::after {
  left: 120%;
}

.path-icon {
  font-size: 36px;
  line-height: 1;
  filter: drop-shadow(0 0 8px var(--path-color));
}

.path-name {
  font-size: 18px;
  font-weight: bold;
  color: var(--path-color);
  letter-spacing: 2px;
  text-shadow: 0 0 6px var(--path-color), 0 0 14px var(--path-color);
}

.path-subtitle {
  font-size: 11px;
  color: var(--neon-blue);
  letter-spacing: 0.5px;
  line-height: 1.4;
  text-shadow: 0 0 3px var(--neon-blue);
  opacity: 0.85;
}

.path-card-desc {
  font-size: 12px;
  color: rgba(255, 230, 210, 0.75);
  line-height: 1.7;
  letter-spacing: 0.3px;
  flex: 1;
}

.path-enter {
  font-size: 12px;
  color: var(--neon-green);
  letter-spacing: 2px;
  opacity: 0;
  transition: opacity 0.25s, text-shadow 0.25s;
  text-shadow: 0 0 4px var(--neon-green);
  margin-top: 4px;
}

.path-card:hover .path-enter {
  opacity: 1;
  text-shadow: 0 0 8px var(--neon-green), 0 0 16px var(--neon-green);
}

.path-foot {
  font-size: 11px;
  color: var(--neon-purple);
  margin: 12px 0 0 0;
  letter-spacing: 1.5px;
  text-shadow: 0 0 4px var(--neon-purple);
  opacity: 0.75;
}
</style>
