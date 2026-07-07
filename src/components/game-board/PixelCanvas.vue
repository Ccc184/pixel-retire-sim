<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useGameStore } from '../../store/game.store.js';
import { useRenderer } from '../../composables/useRenderer.js';
import type { SceneAnimationType } from '../../composables/useSceneBuilder.js';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const gameStore = useGameStore();

const renderer = useRenderer(canvasRef, () => gameStore.state);

onMounted(() => {
  renderer.markAllDirty();
  renderer.renderPixelScene();
});

// 监听 store 的场景动画通知，传递到 renderer
watch(() => gameStore.pendingSceneAnimation, (anim) => {
  if (anim) {
    renderer.triggerEventAnimation(anim.type as SceneAnimationType, anim.duration);
    gameStore.pendingSceneAnimation = null;
  }
});

// 监听场景脏标记——重大状态变化（买房/买车/换城市/结婚/生子/失业等）后立即重绘像素场景
watch(() => gameStore.sceneDirty, () => {
  renderer.markAllDirty();
  renderer.renderPixelScene();
});

// ================================================================
//  剧情驱动的天气/氛围粒子（CSS层，在canvas之上）
//  触发逻辑：根据当年日志内容推断mood，而非纯数值
// ================================================================
const s = computed(() => gameStore.state);
const mood = computed(() => gameStore.yearMood);

// 雨：剧情提到裁员/失业/离婚/生病等苦事
const showRain = computed(() => mood.value === 'rain');
// 飘心：剧情提到恋爱/结婚/升职/买房等喜事
const showHearts = computed(() => mood.value === 'hearts');
// 金光：剧情提到牛市/暴富
const showGold = computed(() => mood.value === 'gold');
// 灰暗落叶：剧情提到萧条/行业寒冬
const showGloom = computed(() => mood.value === 'gloom');
// 暗角：剧情提到重病/健康恶化
const showVignette = computed(() => mood.value === 'vignette');
// 雪花：剧情提到冬天/雪景
const showSnow = computed(() => mood.value === 'snow');
// 雷电：剧情提到风暴/突变
const showThunder = computed(() => mood.value === 'thunder');
// 雾气：剧情提到迷茫/模糊
const showFog = computed(() => mood.value === 'fog');
// 故障：剧情提到错乱/异常
const showGlitch = computed(() => mood.value === 'glitch');
// 年龄季节色调
const ageTone = computed(() => {
  const age = s.value.currentAge;
  if (age <= 28) return 'tone-spring';
  if (age <= 40) return 'tone-summer';
  if (age <= 50) return 'tone-autumn';
  return 'tone-winter';
});

// 预生成雨滴
const rainDrops = Array.from({ length: 25 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  delay: Math.random() * 2,
  duration: 0.6 + Math.random() * 0.4,
  opacity: 0.3 + Math.random() * 0.4,
}));

// 飘心（粉红+金色）
const hearts = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: 10 + Math.random() * 80,
  delay: Math.random() * 4,
  duration: 4 + Math.random() * 3,
  size: 8 + Math.random() * 8,
  color: Math.random() > 0.6 ? '#ffd700' : '#ff2d95',
}));

// 金色粒子
const goldParticles = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  delay: Math.random() * 5,
  duration: 5 + Math.random() * 4,
  size: 3 + Math.random() * 4,
}));

// 萧条落叶
const leaves = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  delay: Math.random() * 6,
  duration: 6 + Math.random() * 4,
}));

// 雪花粒子
const snowFlakes = Array.from({ length: 15 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  delay: Math.random() * 5,
  duration: 5 + Math.random() * 5,
  size: 3 + Math.random() * 5,
}));

// 雷电闪烁
const thunderFlashes = [{ delay: 0 }, { delay: 0.3 }, { delay: 0.8 }];

defineExpose({
  renderPixelScene: renderer.renderPixelScene,
  triggerShockwave: renderer.triggerShockwave,
  triggerAssetChange: renderer.triggerAssetChange,
  triggerEventAnimation: renderer.triggerEventAnimation,
});
</script>

<template>
  <div class="canvas-container" :class="ageTone">
    <canvas ref="canvasRef" class="pixel-canvas"></canvas>

    <!-- 暗角（健康低时） -->
    <div v-if="showVignette" class="weather-overlay vignette" />

    <!-- 雨（压力高） -->
    <div v-if="showRain" class="weather-overlay rain-layer">
      <span
        v-for="d in rainDrops"
        :key="'r'+d.id"
        class="rain-drop"
        :style="{
          left: d.left + '%',
          animationDelay: d.delay + 's',
          animationDuration: d.duration + 's',
          opacity: d.opacity,
        }"
      />
    </div>

    <!-- 飘心（幸福高） -->
    <div v-if="showHearts" class="weather-overlay hearts-layer">
      <span
        v-for="h in hearts"
        :key="'h'+h.id"
        class="heart-particle"
        :style="{
          left: h.left + '%',
          animationDelay: h.delay + 's',
          animationDuration: h.duration + 's',
          fontSize: h.size + 'px',
          color: h.color,
        }"
      >♥</span>
    </div>

    <!-- 金色粒子（经济繁荣） -->
    <div v-if="showGold" class="weather-overlay gold-layer">
      <span
        v-for="g in goldParticles"
        :key="'g'+g.id"
        class="gold-particle"
        :style="{
          left: g.left + '%',
          animationDelay: g.delay + 's',
          animationDuration: g.duration + 's',
          width: g.size + 'px',
          height: g.size + 'px',
        }"
      />
    </div>

    <!-- 萧条落叶/灰暗 -->
    <div v-if="showGloom" class="weather-overlay gloom-layer">
      <span
        v-for="l in leaves"
        :key="'l'+l.id"
        class="leaf-particle"
        :style="{
          left: l.left + '%',
          animationDelay: l.delay + 's',
          animationDuration: l.duration + 's',
        }"
      >·</span>
      <div class="gloom-dim" />
    </div>

    <!-- 雪花（冬天） -->
    <div v-if="showSnow" class="weather-overlay snow-layer">
      <span
        v-for="s in snowFlakes"
        :key="'s'+s.id"
        class="snow-flake"
        :style="{
          left: s.left + '%',
          animationDelay: s.delay + 's',
          animationDuration: s.duration + 's',
          width: s.size + 'px',
          height: s.size + 'px',
        }"
      />
    </div>

    <!-- 雷电（风暴） -->
    <div v-if="showThunder" class="weather-overlay thunder-layer">
      <span
        v-for="(t, i) in thunderFlashes"
        :key="'t'+i"
        class="thunder-flash"
        :style="{ animationDelay: t.delay + 's' }"
      />
    </div>

    <!-- 雾气（迷茫） -->
    <div v-if="showFog" class="weather-overlay fog-layer">
      <div class="fog-cloud fog-cloud-1" />
      <div class="fog-cloud fog-cloud-2" />
      <div class="fog-cloud fog-cloud-3" />
    </div>

    <!-- Glitch故障（错乱） -->
    <div v-if="showGlitch" class="weather-overlay glitch-layer">
      <div
        v-for="i in 6"
        :key="'gl'+i"
        class="glitch-bar"
        :style="{
          top: (i * 14 + Math.random() * 6) + '%',
          width: (40 + Math.random() * 50) + '%',
          left: (Math.random() * 30) + '%',
          animationDelay: (Math.random() * 0.5) + 's',
          animationDuration: (0.2 + Math.random() * 0.3) + 's',
        }"
      />
    </div>

    <!-- 年龄季节色调滤镜 -->
    <div class="weather-overlay tone-filter" :class="ageTone" />

    <!-- 资产获得闪光动画（买房/买车等即时反馈） -->
    <div v-if="gameStore.assetAcquired" class="asset-acquire-flash">
      <span class="asset-acquire-text">{{ gameStore.assetAcquired.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.canvas-container {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #1a1c2c;
  border-radius: 10px / 8px;
  overflow: hidden;
}

.pixel-canvas {
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  position: relative;
  z-index: 1;
}

.weather-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  overflow: hidden;
  border-radius: 24px / 18px;
}

/* 暗角 - 健康低 */
.vignette {
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%);
  animation: vignettePulse 3s ease-in-out infinite alternate;
}
@keyframes vignettePulse {
  from { opacity: 0.5; }
  to { opacity: 0.8; }
}

/* 雨（斜落+水花） */
.rain-layer { z-index: 3; }
.rain-drop {
  position: absolute;
  top: -10px;
  width: 2px;
  height: 12px;
  background: linear-gradient(to bottom, transparent, rgba(100, 180, 255, 0.6));
  animation: rainFall linear infinite;
}
.rain-drop::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 2px;
  background: rgba(100, 180, 255, 0.4);
  border-radius: 50%;
  opacity: 0;
  animation: rainSplash linear infinite;
  animation-delay: inherit;
  animation-duration: inherit;
}
@keyframes rainFall {
  0% { transform: translateY(-10px) translateX(0); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translateY(110%) translateX(20px); opacity: 0; }
}
@keyframes rainSplash {
  0%, 90% { opacity: 0; transform: translateX(-50%) scale(0.5); }
  95% { opacity: 1; transform: translateX(-50%) scale(1.2); }
  100% { opacity: 0; transform: translateX(-50%) scale(1.5); }
}

/* 飘心（粉红+金色） */
.hearts-layer { z-index: 3; }
.heart-particle {
  position: absolute;
  bottom: -20px;
  text-shadow: 0 0 6px currentColor, 0 0 12px currentColor;
  animation: heartFloat ease-in-out infinite;
  opacity: 0;
}
@keyframes heartFloat {
  0% { transform: translateY(0) scale(0.5) rotate(0deg); opacity: 0; }
  10% { opacity: 0.8; }
  50% { transform: translateY(-50%) scale(1) rotate(10deg); }
  90% { opacity: 0.6; }
  100% { transform: translateY(-110%) scale(0.8) rotate(-10deg); opacity: 0; }
}

/* 金色粒子（繁荣+闪烁） */
.gold-layer { z-index: 3; }
.gold-particle {
  position: absolute;
  bottom: -5px;
  background: #ffd700;
  box-shadow: 0 0 6px #ffd700, 0 0 12px #ffd70080;
  border-radius: 50%;
  animation: goldRise ease-out infinite;
  opacity: 0;
}
@keyframes goldRise {
  0% { transform: translateY(0); opacity: 0; }
  10% { opacity: 1; }
  40% { opacity: 1; box-shadow: 0 0 10px #ffd700, 0 0 20px #ffd700cc; }
  50% { opacity: 0.6; box-shadow: 0 0 4px #ffd700, 0 0 8px #ffd70080; }
  60% { opacity: 1; box-shadow: 0 0 10px #ffd700, 0 0 20px #ffd700cc; }
  100% { transform: translateY(-110%); opacity: 0; }
}

/* 萧条灰暗 */
.gloom-layer { z-index: 2; }
.gloom-dim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 20, 0.25);
}
.leaf-particle {
  position: absolute;
  top: -10px;
  color: rgba(100, 100, 120, 0.5);
  font-size: 14px;
  animation: leafFall linear infinite;
}
@keyframes leafFall {
  0% { transform: translateY(-10px) translateX(0) rotate(0deg); opacity: 0; }
  10% { opacity: 0.6; }
  100% { transform: translateY(110%) translateX(30px) rotate(180deg); opacity: 0; }
}

/* 雪花 */
.snow-layer { z-index: 3; }
.snow-flake {
  position: absolute;
  top: -10px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 50%;
  animation: snowFall linear infinite;
  opacity: 0.8;
}
@keyframes snowFall {
  0% { transform: translateY(-10px) translateX(0); opacity: 0; }
  10% { opacity: 0.8; }
  50% { transform: translateY(50%) translateX(15px); }
  100% { transform: translateY(110%) translateX(-10px); opacity: 0; }
}

/* 雷电（屏幕闪烁+震动） */
.thunder-layer { z-index: 5; }
.thunder-flash {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  opacity: 0;
  animation: thunderFlash 1.5s ease-out infinite;
}
.canvas-container:has(.thunder-layer) {
  animation: thunderShake 1.5s ease-out infinite;
}
@keyframes thunderFlash {
  0% { opacity: 0; }
  5% { opacity: 0.8; }
  10% { opacity: 0; }
  15% { opacity: 0.4; }
  20% { opacity: 0; }
  100% { opacity: 0; }
}
@keyframes thunderShake {
  0%, 100% { transform: translate(0, 0); }
  2% { transform: translate(-2px, 1px); }
  4% { transform: translate(2px, -1px); }
  6% { transform: translate(-1px, 2px); }
  8% { transform: translate(1px, -2px); }
  10% { transform: translate(0, 0); }
}

/* 雾气 */
.fog-layer { z-index: 2; }
.fog-cloud {
  position: absolute;
  width: 120%;
  height: 40%;
  background: radial-gradient(ellipse at center, rgba(200, 200, 210, 0.35) 0%, transparent 70%);
  animation: fogDrift linear infinite;
  opacity: 0.6;
}
.fog-cloud-1 { top: 10%; left: -20%; animation-duration: 12s; }
.fog-cloud-2 { top: 35%; left: -40%; animation-duration: 16s; animation-delay: -4s; }
.fog-cloud-3 { top: 60%; left: -10%; animation-duration: 14s; animation-delay: -8s; }
@keyframes fogDrift {
  0% { transform: translateX(0); }
  50% { transform: translateX(20%); }
  100% { transform: translateX(0); }
}

/* Glitch故障 */
.glitch-layer { z-index: 5; pointer-events: none; }
.glitch-bar {
  position: absolute;
  height: 4px;
  background: rgba(0, 255, 100, 0.25);
  mix-blend-mode: screen;
  animation: glitchBar linear infinite;
}
@keyframes glitchBar {
  0% { transform: translateX(0); opacity: 0; }
  20% { opacity: 1; }
  40% { transform: translateX(10px); }
  60% { transform: translateX(-8px); opacity: 0.8; }
  80% { transform: translateX(4px); opacity: 0.4; }
  100% { transform: translateX(0); opacity: 0; }
}

/* 年龄季节色调 */
.tone-filter { z-index: 4; mix-blend-mode: overlay; opacity: 0.08; }
.tone-spring { background: radial-gradient(ellipse at 30% 20%, rgba(100,255,150,0.3), transparent 60%); }
.tone-summer { background: radial-gradient(ellipse at 50% 10%, rgba(255,200,50,0.3), transparent 60%); }
.tone-autumn { background: radial-gradient(ellipse at 50% 10%, rgba(255,120,30,0.3), transparent 60%); }
.tone-winter { background: radial-gradient(ellipse at 50% 50%, rgba(100,150,255,0.3), transparent 60%); }

/* 资产获得闪光动画（买房/买车等即时反馈） */
.asset-acquire-flash {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  border-radius: 24px / 18px;
  background: radial-gradient(circle, rgba(255,215,0,0.4) 0%, transparent 70%);
  animation: assetFlash 1.5s ease-out forwards;
}
.asset-acquire-text {
  color: #ffd700;
  font-size: 16px;
  font-weight: bold;
  text-shadow: 0 0 8px #ffd700, 0 0 16px #ffaa00, 0 0 24px #ff8800;
  animation: assetTextPop 1.5s ease-out forwards;
}
@keyframes assetFlash {
  0% { opacity: 0; }
  20% { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes assetTextPop {
  0% { transform: scale(0.5); opacity: 0; }
  20% { transform: scale(1.2); opacity: 1; }
  40% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1); opacity: 0; }
}
</style>
