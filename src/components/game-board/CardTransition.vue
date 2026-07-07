<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useGameStore } from '../../store/game.store.js';
import { playDing, playConfirm, playTurn, playBigGain, playBigLoss } from '../../utils/audio.js';

const props = defineProps<{
  type: string | null;
}>();

const emit = defineEmits<{
  (e: 'complete'): void;
}>();

const store = useGameStore();
const transitionType = ref<string | null>(null);
const isAnimating = ref(false);
const showContent = ref(false);

// 车的颜色根据 carValue 推断
const carColor = computed(() => {
  const val = store.state.carValue;
  if (val >= 300000) return { body: '#f0f0f0', accent: '#ffd700', name: '豪车' };
  if (val >= 100000) return { body: '#ff88aa', accent: '#ff2d95', name: '中级车' };
  return { body: '#8899aa', accent: '#00d4ff', name: '经济车' };
});

// 监听 type 变化
watch(() => props.type, (newType) => {
  if (newType && !isAnimating.value) {
    startTransition(newType);
  }
});

function startTransition(type: string) {
  isAnimating.value = true;
  transitionType.value = type;
  showContent.value = true;

  // 播放音效
  switch (type) {
    case 'house': playDing(); break;
    case 'car': playConfirm(); break;
    case 'money': playBigGain(); break;
    case 'crisis': playBigLoss(); break;
    default: playTurn(); break;
  }

  // 1.8秒后结束
  setTimeout(() => {
    showContent.value = false;
    // 等待淡出动画完成
    setTimeout(() => {
      transitionType.value = null;
      isAnimating.value = false;
      emit('complete');
    }, 350);
  }, 1800);
}
</script>

<template>
  <div
    v-if="transitionType"
    class="card-transition-overlay"
    :class="{ 'is-fading': !showContent }"
  >
    <!-- 背景遮罩 -->
    <div class="transition-backdrop" />

    <!-- 转场动画内容区 -->
    <div class="transition-stage">
      <!-- ======== 买房 ======== -->
      <template v-if="transitionType === 'house'">
        <div class="tf-house">
          <div class="tf-house-ground" />
          <div class="tf-house-body" />
          <div class="tf-house-roof" />
          <div class="tf-house-window tf-house-window--l" />
          <div class="tf-house-window tf-house-window--r" />
          <div class="tf-house-door" />
        </div>
        <p class="tf-text">安家落户</p>
      </template>

      <!-- ======== 买车 ======== -->
      <template v-else-if="transitionType === 'car'">
        <div class="tf-car">
          <div class="tf-car-body" :style="{ background: carColor.body, boxShadow: '0 0 12px ' + carColor.accent + '60' }" />
          <div class="tf-car-roof" :style="{ background: carColor.body }" />
          <div class="tf-car-wheel tf-car-wheel--l" />
          <div class="tf-car-wheel tf-car-wheel--r" />
          <div class="tf-car-light" />
        </div>
        <p class="tf-text">驰骋四方</p>
      </template>

      <!-- ======== 健身/健康 ======== -->
      <template v-else-if="transitionType === 'health'">
        <div class="tf-health">
          <div class="tf-health-person">
            <div class="tf-health-head" />
            <div class="tf-health-torso" />
            <div class="tf-health-arm tf-health-arm--l" />
            <div class="tf-health-arm tf-health-arm--r" />
            <div class="tf-health-barbell" />
          </div>
          <div class="tf-health-particles">
            <span v-for="i in 6" :key="i" class="tf-health-particle" :style="{ left: (20 + i * 12) + '%', animationDelay: (i * 0.1) + 's' }" />
          </div>
        </div>
        <p class="tf-text">强身健体</p>
      </template>

      <!-- ======== 旅行 ======== -->
      <template v-else-if="transitionType === 'travel'">
        <div class="tf-travel">
          <div class="tf-travel-scene tf-travel-scene--1">
            <div class="tf-travel-mountain" />
            <div class="tf-travel-mountain tf-travel-mountain--2" />
          </div>
          <div class="tf-travel-scene tf-travel-scene--2">
            <div class="tf-travel-wave" />
            <div class="tf-travel-wave tf-travel-wave--2" />
            <div class="tf-travel-wave tf-travel-wave--3" />
          </div>
          <div class="tf-travel-scene tf-travel-scene--3">
            <div class="tf-travel-building" />
            <div class="tf-travel-building tf-travel-building--tall" />
            <div class="tf-travel-building tf-travel-building--wide" />
          </div>
        </div>
        <p class="tf-text">诗和远方</p>
      </template>

      <!-- ======== 辞职/换工作 ======== -->
      <template v-else-if="transitionType === 'job'">
        <div class="tf-job">
          <div class="tf-job-briefcase">
            <div class="tf-job-briefcase-body" />
            <div class="tf-job-briefcase-handle" />
          </div>
          <div class="tf-job-impact" />
        </div>
        <p class="tf-text">新的征程</p>
      </template>

      <!-- ======== 恋爱/婚姻 ======== -->
      <template v-else-if="transitionType === 'love'">
        <div class="tf-love">
          <div class="tf-love-person tf-love-person--l">
            <div class="tf-love-head" />
            <div class="tf-love-body" />
          </div>
          <div class="tf-love-person tf-love-person--r">
            <div class="tf-love-head" />
            <div class="tf-love-body" />
          </div>
          <div class="tf-love-hearts">
            <span v-for="i in 5" :key="i" class="tf-love-heart" :style="{ left: (30 + i * 10) + '%', animationDelay: (0.3 + i * 0.08) + 's' }" />
          </div>
        </div>
        <p class="tf-text">怦然心动</p>
      </template>

      <!-- ======== 暴富/彩票 ======== -->
      <template v-else-if="transitionType === 'money'">
        <div class="tf-money">
          <div class="tf-money-rain">
            <span v-for="i in 12" :key="i" class="tf-money-drop" :style="{ left: (Math.random() * 90 + 5) + '%', animationDelay: (Math.random() * 0.6) + 's', animationDuration: (0.6 + Math.random() * 0.4) + 's' }">$</span>
          </div>
          <div class="tf-money-counter">
            <span class="tf-money-digit">¥</span>
            <span class="tf-money-digit">9</span>
            <span class="tf-money-digit">9</span>
            <span class="tf-money-digit">9</span>
            <span class="tf-money-digit">9</span>
            <span class="tf-money-digit">9</span>
          </div>
        </div>
        <p class="tf-text">天降横财</p>
      </template>

      <!-- ======== 日常琐事 ======== -->
      <template v-else-if="transitionType === 'daily'">
        <div class="tf-daily">
          <div class="tf-daily-icon tf-daily-icon--coffee">
            <div class="tf-daily-cup" />
            <div class="tf-daily-steam" />
          </div>
          <div class="tf-daily-icon tf-daily-icon--book">
            <div class="tf-daily-book-cover" />
            <div class="tf-daily-book-pages" />
          </div>
          <div class="tf-daily-icon tf-daily-icon--pan">
            <div class="tf-daily-pan" />
            <div class="tf-daily-pan-handle" />
          </div>
          <div class="tf-daily-icon tf-daily-icon--sofa">
            <div class="tf-daily-sofa" />
          </div>
        </div>
        <p class="tf-text">生活点滴</p>
      </template>

      <!-- ======== 进修学习 ======== -->
      <template v-else-if="transitionType === 'study'">
        <div class="tf-study">
          <div class="tf-study-book">
            <div class="tf-study-cover tf-study-cover--l" />
            <div class="tf-study-cover tf-study-cover--r" />
            <div class="tf-study-page tf-study-page--l" />
            <div class="tf-study-page tf-study-page--r" />
          </div>
          <div class="tf-study-sparkles">
            <span v-for="i in 6" :key="i" class="tf-study-sparkle" :style="{ left: (20 + i * 12) + '%', animationDelay: (0.5 + i * 0.1) + 's' }" />
          </div>
        </div>
        <p class="tf-text">学海无涯</p>
      </template>

      <!-- ======== 黑天鹅/危机 ======== -->
      <template v-else-if="transitionType === 'crisis'">
        <div class="tf-crisis">
          <div class="tf-crisis-bang">
            <span class="tf-crisis-mark">!</span>
          </div>
          <div class="tf-crisis-red-edge" />
        </div>
        <p class="tf-text">风云突变</p>
      </template>

      <!-- ======== 默认 ======== -->
      <template v-else>
        <div class="tf-default">
          <div class="tf-default-bar">
            <span v-for="i in 12" :key="i" class="tf-default-block" :style="{ animationDelay: (i * 0.08) + 's' }" />
          </div>
        </div>
        <p class="tf-text">时光流逝</p>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* ================================================================
   基础覆盖层
   ================================================================ */
.card-transition-overlay {
  position: absolute;
  inset: 0;
  z-index: 15;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  overflow: hidden;
}

.transition-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(5, 5, 15, 0.92);
  animation: backdropIn 0.3s ease-out forwards;
}

.card-transition-overlay.is-fading .transition-backdrop {
  animation: backdropOut 0.3s ease-in forwards;
}

.transition-stage {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  width: 100%;
  max-width: 240px;
}

.tf-text {
  font-family: 'DotGothic16', monospace;
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 4px;
  color: #fff;
  text-shadow: 0 0 8px currentColor, 0 0 16px currentColor;
  margin: 0;
  opacity: 0;
  animation: textPop 0.4s ease-out 1.0s forwards;
}

@media (prefers-reduced-motion: no-preference) {
  @keyframes backdropIn {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }

  @keyframes backdropOut {
    0% { opacity: 1; }
    100% { opacity: 0; }
  }

  @keyframes textPop {
    0% { transform: scale(0.5); opacity: 0; }
    60% { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }
}

@media (prefers-reduced-motion: reduce) {
  .transition-backdrop {
    animation: none;
    opacity: 1;
  }
  .tf-text {
    animation: none;
    opacity: 1;
  }
}

/* ================================================================
   买房 - 像素房子建造
   ================================================================ */
.tf-house {
  position: relative;
  width: 80px;
  height: 70px;
}

.tf-house-ground {
  position: absolute;
  bottom: 0;
  left: -8px;
  right: -8px;
  height: 4px;
  background: #4a4a4a;
  animation: houseGround 0.3s ease-out 0.2s both;
}

.tf-house-body {
  position: absolute;
  bottom: 4px;
  left: 10px;
  width: 60px;
  height: 40px;
  background: #c8b89a;
  animation: houseBuild 0.6s ease-out 0.4s both;
}

.tf-house-roof {
  position: absolute;
  bottom: 44px;
  left: 2px;
  width: 0;
  height: 0;
  border-left: 38px solid transparent;
  border-right: 38px solid transparent;
  border-bottom: 28px solid #8b4513;
  animation: houseRoof 0.4s ease-out 0.8s both;
}

.tf-house-window {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #1a1a2e;
  animation: houseWindow 0.3s ease-out 1.1s both;
}

.tf-house-window--l { bottom: 20px; left: 18px; }
.tf-house-window--r { bottom: 20px; right: 18px; }

.tf-house-door {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 14px;
  height: 22px;
  background: #5c3a1e;
  animation: houseDoor 0.3s ease-out 1.2s both;
}

@media (prefers-reduced-motion: no-preference) {
  @keyframes houseGround {
    0% { transform: scaleX(0); opacity: 0; }
    100% { transform: scaleX(1); opacity: 1; }
  }

  @keyframes houseBuild {
    0% { clip-path: inset(100% 0 0 0); }
    100% { clip-path: inset(0 0 0 0); }
  }

  @keyframes houseRoof {
    0% { transform: translateY(10px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }

  @keyframes houseWindow {
    0% { background: #1a1a2e; box-shadow: none; }
    100% { background: #ffd700; box-shadow: 0 0 8px #ffd700, 0 0 16px #ffd70060; }
  }

  @keyframes houseDoor {
    0% { opacity: 0; transform: translateX(-50%) scaleY(0); }
    100% { opacity: 1; transform: translateX(-50%) scaleY(1); }
  }
}

/* ================================================================
   买车 - 像素车驶入
   ================================================================ */
.tf-car {
  position: relative;
  width: 90px;
  height: 50px;
  animation: carDriveIn 0.7s ease-out 0.2s both;
}

.tf-car-body {
  position: absolute;
  bottom: 10px;
  left: 0;
  width: 80px;
  height: 22px;
  background: #8899aa;
}

.tf-car-roof {
  position: absolute;
  bottom: 32px;
  left: 18px;
  width: 40px;
  height: 14px;
  background: #8899aa;
}

.tf-car-wheel {
  position: absolute;
  bottom: 2px;
  width: 14px;
  height: 14px;
  background: #222;
  border: 2px solid #555;
  animation: carWheelSpin 0.3s linear infinite;
}

.tf-car-wheel--l { left: 12px; }
.tf-car-wheel--r { right: 12px; }

.tf-car-light {
  position: absolute;
  bottom: 18px;
  right: -2px;
  width: 6px;
  height: 6px;
  background: #ffec27;
  animation: carLightBlink 0.3s ease-in-out 0.9s 2;
  box-shadow: 0 0 6px #ffec27;
}

@media (prefers-reduced-motion: no-preference) {
  @keyframes carDriveIn {
    0% { transform: translateX(-180px); opacity: 0; }
    60% { transform: translateX(0); opacity: 1; }
    80% { transform: translateX(-4px); }
    100% { transform: translateX(0); }
  }

  @keyframes carWheelSpin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes carLightBlink {
    0%, 100% { opacity: 1; box-shadow: 0 0 6px #ffec27; }
    50% { opacity: 0.3; box-shadow: none; }
  }
}

/* ================================================================
   健身 - 小人举重 + 绿色粒子
   ================================================================ */
.tf-health {
  position: relative;
  width: 80px;
  height: 70px;
}

.tf-health-person {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 50px;
  animation: healthLift 0.6s ease-in-out 0.2s infinite alternate;
}

.tf-health-head {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 12px;
  height: 12px;
  background: #00ff88;
}

.tf-health-torso {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  width: 16px;
  height: 20px;
  background: #00cc6a;
}

.tf-health-arm {
  position: absolute;
  top: 16px;
  width: 10px;
  height: 4px;
  background: #00ff88;
}

.tf-health-arm--l { left: 2px; }
.tf-health-arm--r { right: 2px; }

.tf-health-barbell {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 44px;
  height: 4px;
  background: #888;
}

.tf-health-barbell::before,
.tf-health-barbell::after {
  content: '';
  position: absolute;
  top: -4px;
  width: 6px;
  height: 12px;
  background: #555;
}

.tf-health-barbell::before { left: 0; }
.tf-health-barbell::after { right: 0; }

.tf-health-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.tf-health-particle {
  position: absolute;
  bottom: 0;
  width: 4px;
  height: 4px;
  background: #00ff88;
  animation: healthParticle 0.8s ease-out infinite;
  opacity: 0;
}

@media (prefers-reduced-motion: no-preference) {
  @keyframes healthLift {
    0% { transform: translateX(-50%) translateY(0); }
    100% { transform: translateX(-50%) translateY(-6px); }
  }

  @keyframes healthParticle {
    0% { transform: translateY(0); opacity: 1; }
    100% { transform: translateY(-50px); opacity: 0; }
  }
}

/* ================================================================
   旅行 - 三场景快速切换
   ================================================================ */
.tf-travel {
  position: relative;
  width: 100px;
  height: 70px;
  overflow: hidden;
}

.tf-travel-scene {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  opacity: 0;
}

.tf-travel-scene--1 {
  animation: travelScene1 0.9s ease-in-out 0.2s both;
}

.tf-travel-scene--2 {
  animation: travelScene2 0.9s ease-in-out 0.5s both;
}

.tf-travel-scene--3 {
  animation: travelScene3 0.9s ease-in-out 0.8s both;
}

.tf-travel-mountain {
  width: 0;
  height: 0;
  border-left: 24px solid transparent;
  border-right: 24px solid transparent;
  border-bottom: 36px solid #2d8a4e;
}

.tf-travel-mountain--2 {
  border-bottom-color: #1e6b3a;
  margin-left: -16px;
  margin-bottom: -4px;
  transform: scale(0.8);
}

.tf-travel-wave {
  position: absolute;
  bottom: 10px;
  width: 80px;
  height: 6px;
  background: #00d4ff;
  animation: waveBob 0.5s ease-in-out infinite alternate;
}

.tf-travel-wave--2 {
  bottom: 18px;
  width: 60px;
  animation-delay: 0.15s;
  opacity: 0.7;
}

.tf-travel-wave--3 {
  bottom: 26px;
  width: 40px;
  animation-delay: 0.3s;
  opacity: 0.4;
}

.tf-travel-building {
  width: 16px;
  height: 30px;
  background: #7a7a8a;
  margin: 0 2px;
}

.tf-travel-building--tall {
  height: 48px;
  background: #6a6a7a;
}

.tf-travel-building--wide {
  width: 24px;
  height: 22px;
  background: #8a8a9a;
}

@media (prefers-reduced-motion: no-preference) {
  @keyframes travelScene1 {
    0% { opacity: 0; transform: scale(1.2); }
    20% { opacity: 1; transform: scale(1); }
    70% { opacity: 1; }
    100% { opacity: 0; }
  }

  @keyframes travelScene2 {
    0% { opacity: 0; transform: translateX(20px); }
    20% { opacity: 1; transform: translateX(0); }
    70% { opacity: 1; }
    100% { opacity: 0; }
  }

  @keyframes travelScene3 {
    0% { opacity: 0; transform: translateY(10px); }
    20% { opacity: 1; transform: translateY(0); }
    70% { opacity: 1; }
    100% { opacity: 0; }
  }

  @keyframes waveBob {
    0% { transform: translateX(-3px); }
    100% { transform: translateX(3px); }
  }
}

/* ================================================================
   辞职/换工作 - 公文包落下
   ================================================================ */
.tf-job {
  position: relative;
  width: 80px;
  height: 70px;
}

.tf-job-briefcase {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  animation: jobDrop 0.7s ease-in 0.2s both;
}

.tf-job-briefcase-body {
  width: 36px;
  height: 26px;
  background: #8b6914;
  border: 2px solid #5c4510;
}

.tf-job-briefcase-handle {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 14px;
  height: 8px;
  border: 2px solid #5c4510;
  border-bottom: none;
}

.tf-job-impact {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 4px;
  background: #444;
  animation: jobImpact 0.2s ease-out 0.7s both;
}

.tf-job-impact::before,
.tf-job-impact::after {
  content: '';
  position: absolute;
  bottom: 2px;
  width: 8px;
  height: 2px;
  background: #444;
}

.tf-job-impact::before { left: -6px; transform: rotate(-20deg); }
.tf-job-impact::after { right: -6px; transform: rotate(20deg); }

@media (prefers-reduced-motion: no-preference) {
  @keyframes jobDrop {
    0% { transform: translateX(-50%) translateY(-60px); }
    70% { transform: translateX(-50%) translateY(34px); }
    85% { transform: translateX(-50%) translateY(24px); }
    100% { transform: translateX(-50%) translateY(34px); }
  }

  @keyframes jobImpact {
    0% { opacity: 0; transform: translateX(-50%) scaleX(0.5); }
    50% { opacity: 1; transform: translateX(-50%) scaleX(1.2); }
    100% { opacity: 1; transform: translateX(-50%) scaleX(1); }
  }
}

/* ================================================================
   恋爱/婚姻 - 两人相遇 + 心形粒子
   ================================================================ */
.tf-love {
  position: relative;
  width: 100px;
  height: 60px;
}

.tf-love-person {
  position: absolute;
  bottom: 0;
  width: 20px;
  height: 32px;
}

.tf-love-person--l {
  left: 10px;
  animation: loveMoveL 0.6s ease-out 0.2s both;
}

.tf-love-person--r {
  right: 10px;
  animation: loveMoveR 0.6s ease-out 0.2s both;
}

.tf-love-head {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 10px;
  height: 10px;
  background: #ff88aa;
}

.tf-love-body {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 14px;
  height: 20px;
  background: #ff2d95;
}

.tf-love-hearts {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.tf-love-heart {
  position: absolute;
  top: 50%;
  left: 50%;
  font-size: 14px;
  color: #ff2d95;
  text-shadow: 0 0 8px #ff2d95;
  animation: heartBurst 0.6s ease-out both;
  opacity: 0;
}

@media (prefers-reduced-motion: no-preference) {
  @keyframes loveMoveL {
    0% { transform: translateX(0); opacity: 0; }
    100% { transform: translateX(24px); opacity: 1; }
  }

  @keyframes loveMoveR {
    0% { transform: translateX(0); opacity: 0; }
    100% { transform: translateX(-24px); opacity: 1; }
  }

  @keyframes heartBurst {
    0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
    50% { transform: translate(-50%, -50%) scale(1.4); opacity: 1; }
    100% { transform: translate(-50%, -60%) scale(1); opacity: 0.8; }
  }
}

/* ================================================================
   暴富/彩票 - 金币雨 + 数字滚动
   ================================================================ */
.tf-money {
  position: relative;
  width: 120px;
  height: 70px;
  overflow: hidden;
}

.tf-money-rain {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.tf-money-drop {
  position: absolute;
  top: -16px;
  font-size: 14px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 6px #ffd700;
  animation: moneyDrop 0.6s linear infinite;
}

.tf-money-counter {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 1px;
  animation: moneyCounterIn 0.3s ease-out 0.4s both;
}

.tf-money-digit {
  font-family: 'DotGothic16', monospace;
  font-size: 16px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 8px #ffd700;
  animation: moneyDigitRoll 0.15s steps(1) infinite;
}

.tf-money-digit:first-child {
  animation: none;
}

@media (prefers-reduced-motion: no-preference) {
  @keyframes moneyDrop {
    0% { transform: translateY(0); opacity: 1; }
    100% { transform: translateY(90px); opacity: 0; }
  }

  @keyframes moneyCounterIn {
    0% { transform: translateX(-50%) scale(0.5); opacity: 0; }
    100% { transform: translateX(-50%) scale(1); opacity: 1; }
  }

  @keyframes moneyDigitRoll {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
}

/* ================================================================
   日常琐事 - 四图标快速闪烁
   ================================================================ */
.tf-daily {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  height: 50px;
}

.tf-daily-icon {
  position: relative;
  width: 28px;
  height: 28px;
  opacity: 0;
}

.tf-daily-icon--coffee { animation: dailyFlash 0.5s ease-in-out 0.2s both; }
.tf-daily-icon--book { animation: dailyFlash 0.5s ease-in-out 0.45s both; }
.tf-daily-icon--pan { animation: dailyFlash 0.5s ease-in-out 0.7s both; }
.tf-daily-icon--sofa { animation: dailyFlash 0.5s ease-in-out 0.95s both; }

.tf-daily-cup {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 14px;
  height: 16px;
  background: #c8a265;
}

.tf-daily-cup::before {
  content: '';
  position: absolute;
  top: 2px;
  right: -6px;
  width: 6px;
  height: 8px;
  border: 2px solid #c8a265;
  border-left: none;
}

.tf-daily-steam {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 6px;
  background: rgba(255, 255, 255, 0.4);
  animation: dailySteam 0.6s ease-in-out infinite alternate;
}

.tf-daily-book-cover {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 16px;
  height: 20px;
  background: #8b4513;
}

.tf-daily-book-pages {
  position: absolute;
  bottom: 4px;
  left: 52%;
  width: 10px;
  height: 16px;
  background: #ddd;
}

.tf-daily-pan {
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  width: 18px;
  height: 10px;
  background: #555;
}

.tf-daily-pan-handle {
  position: absolute;
  bottom: 8px;
  right: 2px;
  width: 10px;
  height: 4px;
  background: #777;
}

.tf-daily-sofa {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 22px;
  height: 12px;
  background: #5c7a3a;
}

.tf-daily-sofa::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 2px;
  right: 2px;
  height: 8px;
  background: #5c7a3a;
}

@media (prefers-reduced-motion: no-preference) {
  @keyframes dailyFlash {
    0% { opacity: 0; transform: scale(0.6); }
    50% { opacity: 1; transform: scale(1.1); }
    100% { opacity: 0.6; transform: scale(1); }
  }

  @keyframes dailySteam {
    0% { transform: translateX(-50%) translateY(0); opacity: 0.4; }
    100% { transform: translateX(-50%) translateY(-3px); opacity: 0.7; }
  }
}

/* ================================================================
   进修学习 - 书本打开 + 光点
   ================================================================ */
.tf-study {
  position: relative;
  width: 80px;
  height: 60px;
}

.tf-study-book {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 48px;
  height: 32px;
  animation: studyBookIn 0.5s ease-out 0.2s both;
}

.tf-study-cover {
  position: absolute;
  bottom: 0;
  width: 24px;
  height: 32px;
  background: #8b4513;
}

.tf-study-cover--l { left: 0; transform-origin: right center; animation: studyCoverOpenL 0.5s ease-out 0.5s both; }
.tf-study-cover--r { right: 0; transform-origin: left center; animation: studyCoverOpenR 0.5s ease-out 0.5s both; }

.tf-study-page {
  position: absolute;
  bottom: 2px;
  width: 20px;
  height: 26px;
  background: #ddd;
}

.tf-study-page--l { left: 2px; }
.tf-study-page--r { right: 2px; }

.tf-study-sparkles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.tf-study-sparkle {
  position: absolute;
  top: 50%;
  width: 4px;
  height: 4px;
  background: #00d4ff;
  box-shadow: 0 0 6px #00d4ff;
  animation: studySparkle 0.8s ease-out both;
  opacity: 0;
}

@media (prefers-reduced-motion: no-preference) {
  @keyframes studyBookIn {
    0% { transform: translateX(-50%) scale(0.5); opacity: 0; }
    100% { transform: translateX(-50%) scale(1); opacity: 1; }
  }

  @keyframes studyCoverOpenL {
    0% { transform: rotateY(0deg); }
    100% { transform: rotateY(-30deg); }
  }

  @keyframes studyCoverOpenR {
    0% { transform: rotateY(0deg); }
    100% { transform: rotateY(30deg); }
  }

  @keyframes studySparkle {
    0% { transform: translateY(0) scale(0); opacity: 1; }
    100% { transform: translateY(-30px) scale(1); opacity: 0; }
  }
}

/* ================================================================
   黑天鹅/危机 - 红色感叹号 + 震动 + 边缘变红
   ================================================================ */
.tf-crisis {
  position: relative;
  width: 80px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tf-crisis-bang {
  animation: crisisShake 0.3s ease-in-out 0.2s 3;
}

.tf-crisis-mark {
  font-family: 'DotGothic16', monospace;
  font-size: 48px;
  font-weight: bold;
  color: #ff2d2d;
  text-shadow: 0 0 12px #ff2d2d, 0 0 24px #ff0000;
  animation: crisisBlink 0.2s ease-in-out 0.2s 5;
}

.tf-crisis-red-edge {
  position: absolute;
  inset: 0;
  border: 3px solid #ff2d2d;
  box-shadow: inset 0 0 20px #ff2d2d40, 0 0 20px #ff2d2d40;
  animation: crisisEdge 0.3s ease-out 0.2s both;
  pointer-events: none;
}

@media (prefers-reduced-motion: no-preference) {
  @keyframes crisisShake {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(-3px, 2px); }
    50% { transform: translate(3px, -2px); }
    75% { transform: translate(-2px, -1px); }
  }

  @keyframes crisisBlink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  @keyframes crisisEdge {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
}

/* ================================================================
   默认 - 进度条
   ================================================================ */
.tf-default {
  width: 120px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tf-default-bar {
  display: flex;
  gap: 3px;
  width: 100%;
}

.tf-default-block {
  flex: 1;
  height: 16px;
  background: #333;
  animation: defaultBlockOn 0.4s ease-out both;
}

@media (prefers-reduced-motion: no-preference) {
  @keyframes defaultBlockOn {
    0% { background: #333; box-shadow: none; }
    100% { background: #00d4ff; box-shadow: 0 0 6px #00d4ff; }
  }
}

@media (prefers-reduced-motion: reduce) {
  .tf-default-block {
    background: #00d4ff;
    box-shadow: 0 0 6px #00d4ff;
  }
}
</style>
