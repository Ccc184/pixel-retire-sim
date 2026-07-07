<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import type { CSSProperties } from 'vue'
import { useGameStore } from './store/game.store.js'
import { CITY_CONFIGS } from './utils/math-engine.js'
import type { CityType } from './types/global.d.js'

import GameSetup from './components/narrative/GameSetup.vue'
import EndingScreen from './components/narrative/EndingScreen.vue'

import CRTBezel from './components/game-board/CRTBezel.vue'
import PixelCanvas from './components/game-board/PixelCanvas.vue'
import CardTransition from './components/game-board/CardTransition.vue'
import StatsPanel from './components/dashboard/StatsPanel.vue'
import CardDeck from './components/cards/CardDeck.vue'
import LifeLog from './components/dashboard/LifeLog.vue'
import CrossroadPanel from './components/crossroad/CrossroadPanel.vue'
import YearEndPanel from './components/narrative/YearEndPanel.vue'
import AchievementToast from './components/ui/AchievementToast.vue'

import { playClick, playAchievement } from './utils/audio.js'

const store = useGameStore()
const toastRef = ref<InstanceType<typeof AchievementToast> | null>(null)

const gamePhase = computed(() => store.state.gamePhase)
const showCitySelect = computed(() => store.showCitySelect)

const cityList: CityType[] = ['资本修罗场', '中坚大后方', '避风低洼地']

function handleStart(): void {
  playClick()
  // originChoices 将在 startNewGame 中随机生成（不再经过问卷）
  store.startNewGame()
}

function handleTestSkip(): void {
  playClick()
  store.testSkipToRetirement()
}

function handleRestart(): void {
  if (confirm('确定要放弃当前人生，重新开始吗？')) {
    store.resetGame()
  }
}

function handleCityPick(city: CityType): void {
  store.applyGeoArbitrage(city)
}

function cycleLabel(cycle: number): string {
  if (cycle === 0) return '繁荣'
  if (cycle === 2) return '萧条'
  return '平稳'
}

function cycleColor(cycle: number): string {
  if (cycle === 0) return 'var(--neon-green)'
  if (cycle === 2) return 'var(--neon-pink)'
  return 'var(--neon-orange)'
}

// 年度结算显示时，弹出新成就
watch(() => store.showYearEnd, (show) => {
  if (show && store.lastYearResult) {
    const achs = (store.lastYearResult as any).newAchievements as any[] || []
    if (achs.length > 0 && toastRef.value) {
      nextTick(() => {
        achs.forEach((a, i) => {
          setTimeout(() => {
            playAchievement()
            toastRef.value?.addToast(a.icon, a.title, a.desc)
          }, 500 + i * 800)
        })
      })
    }
  }
})

// ---- 伪随机工具（固定种子，保证 SSR/每次渲染一致） ----
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6D2B79F5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---- 星星数据与样式 ----
interface StarData { style: CSSProperties }
function makeStars(n: number): StarData[] {
  const arr: StarData[] = []
  const rand = mulberry32(1337)
  for (let i = 0; i < n; i++) {
    const size = 1 + Math.floor(rand() * 3)
    arr.push({
      style: {
        left: rand() * 100 + '%',
        top: rand() * 70 + '%',
        width: size + 'px',
        height: size + 'px',
        ['--tw-dur' as any]: (2 + rand() * 4).toFixed(2) + 's',
        ['--tw-delay' as any]: (rand() * 5).toFixed(2) + 's',
      } as CSSProperties,
    })
  }
  return arr
}
const stars = makeStars(50)

// ---- 漂浮 $ / ¥ 符号数据与样式 ----
interface DollarData { char: string; style: CSSProperties }
function makeDollars(n: number): DollarData[] {
  const chars = ['$', '¥', '$', '¥', '$', '¢', '£', '$']
  const colors = ['var(--neon-green)', 'var(--neon-orange)', 'var(--neon-pink)', 'var(--neon-blue)', 'var(--neon-purple)']
  const arr: DollarData[] = []
  const rand = mulberry32(4242)
  for (let i = 0; i < n; i++) {
    const size = 14 + Math.floor(rand() * 18)
    arr.push({
      char: chars[Math.floor(rand() * chars.length)],
      style: {
        left: (rand() * 94 + 3) + '%',
        bottom: '-40px',
        color: colors[Math.floor(rand() * colors.length)],
        fontSize: size + 'px',
        ['--fd-dur' as any]: (10 + rand() * 10).toFixed(2) + 's',
        ['--fd-delay' as any]: (rand() * 15).toFixed(2) + 's',
      } as CSSProperties,
    })
  }
  return arr
}
const dollars = makeDollars(12)

// ---- 欢迎界面专属粒子 ----
interface ParticleData { char: string; style: CSSProperties }
const introParticles: ParticleData[] = (() => {
  const colors = ['var(--neon-green)', 'var(--neon-pink)', 'var(--neon-orange)', 'var(--neon-blue)', 'var(--neon-purple)']
  const arr: ParticleData[] = []
  for (let i = 0; i < 8; i++) {
    arr.push({
      char: i % 2 === 0 ? '$' : '¥',
      style: {
        left: (i * 12 + 3) + '%',
        bottom: '-40px',
        color: colors[i % 5],
        fontSize: (14 + (i % 3) * 6) + 'px',
        ['--fd-dur' as any]: (10 + (i % 4) * 3) + 's',
        ['--fd-delay' as any]: (i * 1.2) + 's',
      } as CSSProperties,
    })
  }
  return arr
})()

// ---- 标题字符动画延迟 ----
const titleChars = '像素退休模拟器'.split('')
const titleCharStyles: CSSProperties[] = titleChars.map((_, idx) => ({
  animationDelay: (idx * 0.08) + 's',
} as CSSProperties))
</script>

<template>
  <div class="app-root">
    <!-- ============ 背景层：星星 + 漂浮$ ============ -->
    <div class="bg-layer" aria-hidden="true">
      <div class="star-field">
        <span
          v-for="(s, i) in stars"
          :key="'s'+i"
          class="star"
          :style="s.style"
        />
      </div>
      <div class="dollar-field">
        <span
          v-for="(d, i) in dollars"
          :key="'d'+i"
          class="floating-dollar"
          :style="d.style"
        >{{ d.char }}</span>
      </div>
    </div>

    <!-- ============ 顶部标题条（playing 时显示） ============ -->
    <header v-if="gamePhase === 'playing'" class="top-bar">
      <div class="top-left">
        <h1 class="top-title">像素退休模拟器</h1>
        <button class="btn-restart" @click="handleRestart" title="重新开始">
          ↻ 重来
        </button>
      </div>
      <div class="top-info">
        <span
          class="cycle-tag"
          :style="{ color: cycleColor(store.state.economicCycle), textShadow: '0 0 6px ' + cycleColor(store.state.economicCycle) }"
        >
          ◆ 经济周期：{{ cycleLabel(store.state.economicCycle) }}
        </span>
        <span v-if="store.state.isUnemployed" class="status-tag unemployed">失业中</span>
        <span v-if="store.state.isMarried" class="status-tag married">已婚</span>
        <span v-if="store.state.hasChild" class="status-tag child">有娃</span>
        <span v-if="store.state.hasProperty" class="status-tag house">有房</span>
      </div>
    </header>

    <!-- ===================== 欢迎界面 ===================== -->
    <section v-if="gamePhase === 'intro'" class="intro-screen">
      <!-- 欢迎界面专属额外漂浮粒子（更多） -->
      <div class="intro-particles" aria-hidden="true">
        <span class="floating-dollar" v-for="(p, i) in introParticles" :key="'ip'+i"
          :style="p.style"
        >{{ p.char }}</span>
      </div>

      <div class="intro-inner">
        <!-- 装饰角标 -->
        <div class="intro-corner tl" />
        <div class="intro-corner tr" />
        <div class="intro-corner bl" />
        <div class="intro-corner br" />

        <div class="intro-eyebrow">
          <span class="eyebrow-line" />
          <span class="eyebrow-text">SYSTEM BOOT // v2.077</span>
          <span class="eyebrow-line" />
        </div>

        <h1 class="intro-title">
          <span
            class="title-char"
            v-for="(ch, idx) in titleChars"
            :key="idx"
            :style="titleCharStyles[idx]"
          >{{ ch }}</span>
        </h1>

        <p class="intro-tagline">
          ▌PIXEL RETIREMENT SIMULATOR▐
        </p>

        <p class="intro-desc">
          22 岁开局，一张问卷定义宿命，<br>
          选择城市、职业、理财与人生选择，<br>
          在霓虹像素的赛博世界里，<br>
          看看你能否安然活到退休。
        </p>

        <button class="btn-start-big" @click="handleStart">
          <span class="btn-arrow">▶</span>
          <span class="btn-text">PRESS START</span>
          <span class="btn-cursor">_</span>
        </button>

        <button class="btn-test-skip" @click="handleTestSkip">
          [测试] 直接看退休结局 →
        </button>

        <p class="intro-foot">
          // 每一步都不可逆 · 每一年都在结算 //
        </p>
      </div>
    </section>

    <!-- ===================== 开局设置 ===================== -->
    <GameSetup v-if="gamePhase === 'setup'" />

    <!-- ===================== 游戏主界面 ===================== -->
    <main v-if="gamePhase === 'playing' || gamePhase === 'ending'" class="game-main">
      <div class="game-layout">
        <!-- 左：统计面板 -->
        <aside class="col-left neon-side-panel">
          <StatsPanel />
        </aside>

        <!-- 中：CRT + 像素画布 + 卡片 -->
        <section class="col-center">
          <!-- CRT 电视机霓虹外框 -->
          <div class="crt-stage">
            <!-- 电视机外层霓虹光晕 -->
            <div class="crt-halo" />
            <!-- 绿色荧光地面反光 -->
            <div class="crt-floor-glow" />
            <!-- 电视本体 -->
            <div class="crt-wrapper">
              <CRTBezel>
                <PixelCanvas />
                <CardTransition
                  :type="store.cardTransitionType"
                  @complete="store.setCardTransition(null)"
                />
              </CRTBezel>
              <!-- 电视机底座 -->
              <div class="crt-stand" />
              <div class="crt-stand-base" />
            </div>
            <!-- 左右小霓虹装饰点 -->
            <div class="crt-deco-led led-left" />
            <div class="crt-deco-led led-right" />
          </div>

          <CardDeck />
        </section>

        <!-- 右：人生日志 -->
        <aside class="col-right neon-side-panel">
          <LifeLog />
        </aside>
      </div>
    </main>

    <!-- ===================== 城市选择弹窗 ===================== -->
    <div v-if="showCitySelect" class="city-select-overlay">
      <div class="city-select-modal pixel-panel">
        <!-- 弹窗霓虹边框装饰 -->
        <div class="modal-neon-corner modal-corner-tl" />
        <div class="modal-neon-corner modal-corner-tr" />
        <div class="modal-neon-corner modal-corner-bl" />
        <div class="modal-neon-corner modal-corner-br" />

        <h3 class="cs-title">◈ 选择要前往的城市 ◈</h3>
        <p class="cs-sub">搬家安置费 ¥20,000，薪资将按比例折算。</p>
        <div class="cs-grid">
          <div
            v-for="city in cityList"
            :key="city"
            class="pixel-card cs-card"
            @click="handleCityPick(city)"
          >
            <div class="cs-name">{{ city }}</div>
            <div class="cs-stats">
              <span class="cs-stat-item">成本 ×{{ CITY_CONFIGS[city].costMultiplier }}</span>
              <span class="cs-stat-item">薪资 ×{{ CITY_CONFIGS[city].salaryMultiplier }}</span>
            </div>
            <div class="cs-enter-hint">► 进入</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===================== 十字路口面板 ===================== -->
    <CrossroadPanel v-if="store.showCrossroad" />

    <!-- ===================== 年度结算弹窗 ===================== -->
    <YearEndPanel v-if="store.showYearEnd && !store.cardTransitionType" />

    <!-- ===================== 结局画面 ===================== -->
    <EndingScreen v-if="gamePhase === 'ending'" />

    <!-- ===================== 成就弹窗 ===================== -->
    <AchievementToast ref="toastRef" />
  </div>
</template>

<style scoped>
.app-root {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  color: var(--pico-white);
  overflow: hidden;
}

/* ============================================================
   背景层（星星 + 漂浮$）
   ============================================================ */
.bg-layer {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.bg-layer .star-field {
  position: absolute;
  inset: 0;
}

.bg-layer .dollar-field {
  position: absolute;
  inset: 0;
}

/* ============================================================
   顶部条 - 霓虹风格
   ============================================================ */
.top-bar {
  position: relative;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 16px;
  flex-shrink: 0;
  background: linear-gradient(90deg,
    rgba(20, 10, 40, 0.92) 0%,
    rgba(40, 10, 60, 0.88) 50%,
    rgba(20, 10, 40, 0.92) 100%);
  border-bottom: 2px solid var(--neon-purple);
  box-shadow:
    0 0 12px var(--neon-purple),
    0 0 24px rgba(201, 0, 255, 0.3),
    inset 0 -1px 0 rgba(0, 212, 255, 0.4);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  flex-wrap: wrap;
  gap: 10px;
}

.top-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.top-title {
  font-size: 16px;
  color: var(--neon-pink);
  margin: 0;
  letter-spacing: 3px;
  text-shadow:
    0 0 6px var(--neon-pink),
    0 0 14px var(--neon-pink),
    0 0 22px var(--neon-purple);
  animation: neonPulse 3s ease-in-out infinite;
}

.btn-restart {
  font-family: 'DotGothic16', monospace;
  font-size: 12px;
  color: var(--neon-orange);
  background: transparent;
  border: 1px solid var(--neon-orange);
  padding: 2px 10px;
  border-radius: 3px;
  cursor: pointer;
  text-shadow: 0 0 4px var(--neon-orange);
  box-shadow: 0 0 4px rgba(255, 136, 0, 0.3);
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-restart:hover {
  background: rgba(255, 136, 0, 0.15);
  box-shadow: 0 0 10px rgba(255, 136, 0, 0.5);
  transform: scale(1.05);
}

.top-info {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.cycle-tag {
  font-size: 14px;
  letter-spacing: 1px;
  font-weight: bold;
}

.status-tag {
  font-size: 12px;
  padding: 3px 10px;
  border: 1px solid currentColor;
  letter-spacing: 1px;
  text-shadow: 0 0 4px currentColor;
  box-shadow: 0 0 6px currentColor, inset 0 0 4px rgba(255,255,255,0.1);
}

.status-tag.unemployed {
  color: var(--neon-pink);
  background: rgba(255, 45, 149, 0.15);
}

.status-tag.married {
  color: var(--neon-pink);
  background: rgba(255, 45, 149, 0.15);
}

.status-tag.child {
  color: var(--neon-orange);
  background: rgba(255, 136, 0, 0.15);
}

.status-tag.house {
  color: var(--neon-green);
  background: rgba(0, 255, 136, 0.15);
}

/* ============================================================
   欢迎界面 - 赛博朋克霓虹冲击
   ============================================================ */
.intro-screen {
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  min-height: 100vh;
  overflow: hidden;
}

.intro-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.intro-inner {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  text-align: center;
  max-width: 680px;
  padding: 48px 40px;
  background: rgba(10, 5, 25, 0.55);
  border: 2px solid var(--neon-purple);
  box-shadow:
    0 0 20px var(--neon-purple),
    0 0 50px rgba(201, 0, 255, 0.4),
    0 0 100px rgba(0, 212, 255, 0.2),
    inset 0 0 40px rgba(201, 0, 255, 0.08);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

/* 四角霓虹装饰 */
.intro-corner {
  position: absolute;
  width: 28px;
  height: 28px;
  border: 3px solid var(--neon-pink);
  box-shadow: 0 0 8px var(--neon-pink);
}
.intro-corner.tl { top: -3px; left: -3px; border-right: none; border-bottom: none; }
.intro-corner.tr { top: -3px; right: -3px; border-left: none; border-bottom: none; border-color: var(--neon-blue); box-shadow: 0 0 8px var(--neon-blue); }
.intro-corner.bl { bottom: -3px; left: -3px; border-right: none; border-top: none; border-color: var(--neon-blue); box-shadow: 0 0 8px var(--neon-blue); }
.intro-corner.br { bottom: -3px; right: -3px; border-left: none; border-top: none; border-color: var(--neon-orange); box-shadow: 0 0 8px var(--neon-orange); }

.intro-eyebrow {
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
  width: 40px;
  height: 1px;
  background: var(--neon-blue);
  box-shadow: 0 0 6px var(--neon-blue);
}

.intro-title {
  font-size: 56px;
  margin: 4px 0 0 0;
  letter-spacing: 6px;
  line-height: 1.1;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}

.title-char {
  display: inline-block;
  color: var(--neon-pink);
  text-shadow:
    0 0 6px var(--neon-pink),
    0 0 14px var(--neon-pink),
    0 0 28px var(--neon-purple),
    0 0 48px rgba(201, 0, 255, 0.6),
    2px 2px 0 #000;
  animation: titleCharFlicker 3s ease-in-out infinite;
}

@keyframes titleCharFlicker {
  0%, 100% {
    opacity: 1;
    transform: translateY(0);
  }
  45% {
    opacity: 1;
  }
  47% {
    opacity: 0.5;
  }
  49% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
    transform: translateY(-2px);
  }
  52% {
    opacity: 1;
    transform: translateY(0);
  }
}

.intro-tagline {
  font-size: 16px;
  color: var(--neon-blue);
  letter-spacing: 6px;
  margin: 0;
  text-shadow: 0 0 8px var(--neon-blue), 0 0 20px var(--neon-blue);
  animation: subtitleFlicker 4s ease-in-out infinite;
}

.intro-desc {
  font-size: 15px;
  color: var(--pico-peach);
  line-height: 2;
  letter-spacing: 1.5px;
  margin: 8px 0 0 0;
  text-shadow: 0 0 6px rgba(255, 204, 170, 0.4);
}

/* ---- PRESS START 大按钮 ---- */
.btn-start-big {
  position: relative;
  font-size: 22px;
  padding: 18px 56px;
  margin-top: 12px;
  background: rgba(0, 30, 10, 0.85);
  color: var(--neon-green);
  border: 3px solid var(--neon-green);
  box-shadow:
    0 0 10px var(--neon-green),
    0 0 24px rgba(0, 255, 136, 0.5),
    0 0 48px rgba(0, 255, 136, 0.25),
    inset 0 0 16px rgba(0, 255, 136, 0.2);
  letter-spacing: 4px;
  text-shadow:
    0 0 8px var(--neon-green),
    0 0 20px var(--neon-green),
    0 0 36px var(--neon-green);
  animation: pressStartBlink 1.6s ease-in-out infinite;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  gap: 14px;
}

.btn-start-big::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px,
    transparent 3px,
    rgba(0, 255, 136, 0.08) 3px,
    rgba(0, 255, 136, 0.08) 4px
  );
  pointer-events: none;
}

.btn-start-big::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(90deg,
    transparent,
    rgba(255, 255, 255, 0.15),
    transparent);
  animation: btnSweep 2.5s ease-in-out infinite;
}

@keyframes btnSweep {
  0% { left: -100%; }
  60% { left: 120%; }
  100% { left: 120%; }
}

.btn-start-big:hover:not(:disabled) {
  background: rgba(0, 255, 136, 0.2);
  color: #fff;
  border-color: var(--neon-pink);
  box-shadow:
    0 0 14px var(--neon-pink),
    0 0 32px var(--neon-pink),
    0 0 60px rgba(255, 45, 149, 0.4),
    inset 0 0 20px rgba(255, 45, 149, 0.25);
  text-shadow:
    0 0 8px var(--neon-pink),
    0 0 20px var(--neon-pink),
    0 0 36px var(--neon-pink);
  transform: scale(1.04);
}

.btn-arrow {
  animation: arrowPulse 0.8s ease-in-out infinite;
}

@keyframes arrowPulse {
  0%, 100% { transform: translateX(0); opacity: 1; }
  50% { transform: translateX(4px); opacity: 0.6; }
}

.btn-text {
  position: relative;
  z-index: 1;
}

.btn-cursor {
  font-size: 24px;
  animation: cursorBlink 1s steps(2) infinite;
  color: var(--neon-green);
}

.btn-start-big:hover:not(:disabled) .btn-cursor {
  color: var(--neon-pink);
  text-shadow: 0 0 8px var(--neon-pink);
}

@keyframes cursorBlink {
  50% { opacity: 0; }
}

.intro-foot {
  font-size: 12px;
  color: var(--neon-purple);
  margin: 0;
  letter-spacing: 2px;
  text-shadow: 0 0 6px var(--neon-purple);
  opacity: 0.8;
}

.btn-test-skip {
  display: block;
  margin: 12px auto 0;
  padding: 6px 16px;
  background: transparent;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.35);
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-test-skip:hover {
  border-color: var(--neon-blue);
  color: var(--neon-blue);
  background: rgba(0, 212, 255, 0.05);
}

/* ============================================================
   游戏主布局
   ============================================================ */
.game-main {
  position: relative;
  z-index: 2;
  flex: 1;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.game-layout {
  display: grid;
  grid-template-columns: 220px 1fr 240px;
  gap: 12px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  align-items: stretch;
  height: 100%;
  overflow: hidden;
  min-height: 0;
}

.col-left,
.col-center,
.col-right {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  z-index: 2;
  min-height: 0;
  overflow: hidden;
}

.col-left,
.col-right {
  overflow-y: auto;
}

.col-center {
  min-width: 0;
  align-items: center;
  overflow: hidden;
}

/* 侧边面板霓虹容器（包裹子组件） */
.neon-side-panel {
  position: relative;
}

.neon-side-panel :deep(> div) {
  background: rgba(15, 8, 35, 0.78) !important;
  border-color: var(--neon-purple) !important;
  box-shadow:
    0 0 10px var(--neon-purple),
    0 0 24px rgba(201, 0, 255, 0.3),
    inset 0 0 16px rgba(201, 0, 255, 0.08) !important;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* ============================================================
   CRT 电视机舞台（居中霓虹视觉焦点）
   ============================================================ */
.crt-stage {
  position: relative;
  width: 100%;
  max-width: min(400px, 38vh);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 4px 2px;
  flex-shrink: 0;
}

/* 外层紫/橙/粉霓虹光晕 */
.crt-halo {
  position: absolute;
  inset: -10px -20px 20px -20px;
  border-radius: 40px / 28px;
  background: transparent;
  box-shadow:
    0 0 20px var(--neon-purple),
    0 0 40px var(--neon-pink),
    0 0 80px rgba(255, 136, 0, 0.4),
    0 0 120px rgba(201, 0, 255, 0.25);
  pointer-events: none;
  z-index: 0;
  animation: crtHaloPulse 4s ease-in-out infinite;
}

@keyframes crtHaloPulse {
  0%, 100% {
    opacity: 0.85;
    filter: brightness(1);
  }
  50% {
    opacity: 1;
    filter: brightness(1.2);
  }
}

/* 绿色荧光地面反光 */
.crt-floor-glow {
  position: absolute;
  bottom: -6px;
  left: 10%;
  right: 10%;
  height: 40px;
  background: radial-gradient(
    ellipse 70% 100% at 50% 0%,
    rgba(0, 255, 136, 0.35) 0%,
    rgba(0, 255, 136, 0.12) 30%,
    transparent 70%
  );
  pointer-events: none;
  z-index: 0;
  filter: blur(4px);
}

.crt-wrapper {
  position: relative;
  z-index: 2;
  width: 100%;
}

/* 覆盖 CRTBezel 内部样式，加入紫橙霓虹边框 */
.crt-wrapper :deep(.crt-bezel) {
  background: linear-gradient(145deg, #1a0f35 0%, #2a1250 40%, #1a0a2e 100%);
  box-shadow:
    inset 0 0 50px rgba(0, 0, 0, 0.95),
    inset 0 0 20px rgba(201, 0, 255, 0.25),
    0 0 0 2px var(--neon-purple),
    0 0 0 5px #0a0518,
    0 0 0 7px var(--neon-orange),
    0 0 20px var(--neon-purple),
    0 0 40px rgba(255, 136, 0, 0.4),
    0 10px 50px rgba(0, 0, 0, 0.8);
}

/* 隐藏 CRTBezel 内部自带的底座（App.vue 有霓虹版底座） */
.crt-wrapper :deep(.crt-stand) {
  display: none !important;
}

/* 电视机底座 */
.crt-stand {
  width: 35%;
  height: 12px;
  margin: -2px auto 0;
  background: linear-gradient(180deg, #2a1250 0%, #0f0820 100%);
  border: 2px solid var(--neon-purple);
  border-top: none;
  box-shadow:
    0 0 8px var(--neon-purple),
    inset 0 2px 4px rgba(201, 0, 255, 0.2);
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}

.crt-stand-base {
  width: 55%;
  height: 8px;
  margin: -1px auto 0;
  background: linear-gradient(180deg, #1a0a2e 0%, #050210 100%);
  border: 2px solid var(--neon-orange);
  border-top: none;
  box-shadow:
    0 3px 10px rgba(0, 0, 0, 0.7),
    0 0 8px rgba(255, 136, 0, 0.4);
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}

/* CRT 两侧小LED装饰 */
.crt-deco-led {
  position: absolute;
  top: 48px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  z-index: 3;
  animation: ledBlink 1.8s ease-in-out infinite;
}

.led-left {
  left: 14px;
  background: var(--neon-pink);
  box-shadow: 0 0 8px var(--neon-pink), 0 0 16px var(--neon-pink);
}

.led-right {
  right: 14px;
  background: var(--neon-orange);
  box-shadow: 0 0 8px var(--neon-orange), 0 0 16px var(--neon-orange);
  animation-delay: 0.9s;
}

@keyframes ledBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ============================================================
   响应式布局
   ============================================================ */
/* 窄屏：缩小侧栏 */
@media (max-width: 1100px) {
  .game-layout {
    grid-template-columns: 180px 1fr 200px;
    gap: 10px;
  }
}

/* 超窄屏：单栏布局（小窗口） */
@media (max-width: 820px) {
  .game-layout {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
    gap: 4px;
  }
  .col-left, .col-right {
    display: none;
  }
  .crt-stage {
    max-width: min(220px, 32vh);
    flex-shrink: 1;
  }
}

/* ============================================================
   城市选择弹窗 - 霓虹风格
   ============================================================ */
.city-select-overlay {
  position: fixed;
  inset: 0;
  background: rgba(5, 0, 15, 0.82);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.city-select-modal {
  position: relative;
  width: min(600px, 100%);
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: modalPopIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modalPopIn {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-neon-corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid var(--neon-pink);
  box-shadow: 0 0 8px var(--neon-pink);
  pointer-events: none;
}
.modal-corner-tl { top: -2px; left: -2px; border-right: none; border-bottom: none; }
.modal-corner-tr { top: -2px; right: -2px; border-left: none; border-bottom: none; border-color: var(--neon-blue); box-shadow: 0 0 8px var(--neon-blue); }
.modal-corner-bl { bottom: -2px; left: -2px; border-right: none; border-top: none; border-color: var(--neon-blue); box-shadow: 0 0 8px var(--neon-blue); }
.modal-corner-br { bottom: -2px; right: -2px; border-left: none; border-top: none; border-color: var(--neon-orange); box-shadow: 0 0 8px var(--neon-orange); }

.cs-title {
  margin: 0;
  font-size: 22px;
  color: var(--neon-pink);
  text-align: center;
  letter-spacing: 3px;
  text-shadow:
    0 0 6px var(--neon-pink),
    0 0 14px var(--neon-pink),
    0 0 24px var(--neon-purple);
}

.cs-sub {
  margin: 0;
  font-size: 13px;
  color: var(--neon-blue);
  text-align: center;
  letter-spacing: 1px;
  text-shadow: 0 0 4px var(--neon-blue);
  opacity: 0.85;
}

.cs-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 8px;
}

@media (max-width: 520px) {
  .cs-grid {
    grid-template-columns: 1fr;
  }
}

.cs-card {
  padding: 18px 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.cs-name {
  font-size: 17px;
  color: var(--neon-pink);
  letter-spacing: 2px;
  text-shadow: 0 0 6px var(--neon-pink);
  font-weight: bold;
}

.cs-card:hover .cs-name {
  color: var(--neon-orange);
  text-shadow: 0 0 8px var(--neon-orange);
}

.cs-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--neon-blue);
  text-shadow: 0 0 3px var(--neon-blue);
}

.cs-card:hover .cs-stats {
  color: var(--neon-orange);
  text-shadow: 0 0 4px var(--neon-orange);
}

.cs-enter-hint {
  font-size: 12px;
  color: var(--neon-green);
  letter-spacing: 2px;
  opacity: 0;
  transition: opacity 0.2s, text-shadow 0.2s;
  text-shadow: 0 0 4px var(--neon-green);
  margin-top: 2px;
}

.cs-card:hover .cs-enter-hint {
  opacity: 1;
  text-shadow: 0 0 8px var(--neon-green);
}
</style>
