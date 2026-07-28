<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted } from 'vue'
import type { CSSProperties } from 'vue'
import { useGameStore } from './store/game.store.js'
import { CITY_CONFIGS } from './utils/math-engine.js'
import type { CityType } from './types/global.d.js'

import GameSetup from './components/narrative/GameSetup.vue'
import PathSelect from './components/narrative/PathSelect.vue'
import EndingScreen from './components/narrative/EndingScreen.vue'

import CRTBezel from './components/game-board/CRTBezel.vue'
import StoryboardScene from './components/game-board/StoryboardScene.vue'
import CardTransition from './components/game-board/CardTransition.vue'
import StatsPanel from './components/dashboard/StatsPanel.vue'
import NarrativeEventPanel from './components/narrative/NarrativeEventPanel.vue'
import LifeLog from './components/dashboard/LifeLog.vue'
import CrossroadPanel from './components/crossroad/CrossroadPanel.vue'
import YearEndPanel from './components/narrative/YearEndPanel.vue'
import AchievementToast from './components/ui/AchievementToast.vue'
import CyberConfirm from './components/ui/CyberConfirm.vue'

import { playClick, playAchievement } from './utils/audio.js'
import { registerHintToggleShortcut } from './utils/ui-prefs.js'
import { getPath } from './data/retirement-paths.js'

const store = useGameStore()
const toastRef = ref<InstanceType<typeof AchievementToast> | null>(null)
const confirmRef = ref<InstanceType<typeof CyberConfirm> | null>(null)

// 注册数值提示切换快捷键（Ctrl+Shift+H）
onMounted(() => {
  registerHintToggleShortcut()
})

const gamePhase = computed(() => store.state.gamePhase)
const showCitySelect = computed(() => store.showCitySelect)

const cityList: CityType[] = ['资本修罗场', '中坚大后方', '避风低洼地']

// ---- 顶部状态栏数据 ----
const currentPath = computed(() => store.state.retirementPath ? getPath(store.state.retirementPath) : null)
const faithLevel = computed(() => store.state.pathFaith ?? 0)

// 婚姻/家庭状态摘要
const lifeStatusText = computed(() => {
  const parts: string[] = []
  if (store.state.isUnemployed) parts.push('失业')
  else if (store.state.isMarried) parts.push('已婚')
  if (store.state.hasChild) parts.push('有娃')
  if (store.state.hasProperty) parts.push('有房')
  return parts.length > 0 ? parts.join('·') : '单身'
})

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
  playClick()
  confirmRef.value?.open()
}

function handleRestartConfirm(): void {
  store.resetGame()
}

function handleCityPick(city: CityType): void {
  store.applyGeoArbitrage(city)
}

function cycleLabel(cycle: number): string {
  if (cycle === 0) return '繁荣'
  if (cycle === 2) return '萧条'
  return '平稳'
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

    <!-- ============ 顶部状态栏（playing 时显示） ============ -->
    <header v-if="gamePhase === 'playing'" class="top-bar">
      <div class="top-left">
        <span class="top-title">像素退休模拟器</span>
        <button class="btn-restart" @click="handleRestart" title="重新开始">↻ 重来</button>
      </div>
      <div class="top-center">
        <div class="stat-badge badge-age">
          <span class="icon icon-age">◈</span><span class="label">年龄</span>
          <span class="value">{{ store.state.currentAge }}岁</span>
        </div>
        <div class="stat-badge badge-prof">
          <span class="icon icon-prof">◆</span><span class="label">职业</span>
          <span class="value">{{ store.state.isUnemployed ? '待业' : store.state.currentProfession }}</span>
        </div>
        <div class="stat-badge badge-city">
          <span class="icon icon-city">▣</span><span class="label">城市</span>
          <span class="value">{{ store.state.currentCity }}</span>
        </div>
        <div class="stat-badge badge-cycle">
          <span class="icon icon-cycle">◆</span><span class="label">周期</span>
          <span class="value">{{ cycleLabel(store.state.economicCycle) }}</span>
        </div>
        <div class="stat-badge badge-status">
          <span class="icon icon-status">◇</span><span class="label">状态</span>
          <span class="value">{{ lifeStatusText }}</span>
        </div>
      </div>
      <div class="top-right">
        <div v-if="currentPath" class="faith-meter">
          <span class="faith-label">信念</span>
          <div class="faith-bar"><div class="faith-fill" :style="{ width: faithLevel + '%' }" /></div>
          <span class="faith-value">{{ faithLevel }}</span>
        </div>
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
          22岁，你走出校门，口袋里装着第一份offer。<br>
          城市、行业、起薪——这些选择将决定你未来三十年的轨迹。<br>
          买房还是攒钱？跳槽还是熬着？结婚还是一个人？<br>
          每一年都在结算，每一步都不可逆。<br>
          你需要在60岁之前，攒够退休的资本。<br><br>
          <span class="intro-hint">// 没有正确答案，只有你的选择 //</span>
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

    <!-- ===================== 退休路径选择 ===================== -->
    <PathSelect v-if="gamePhase === 'path_select'" />

    <!-- ===================== 游戏主界面 ===================== -->
    <main v-if="gamePhase === 'playing' || gamePhase === 'ending'" class="game-main">
      <!-- 左：统计面板 -->
      <aside class="col-left">
        <StatsPanel />
      </aside>

      <!-- 中：CRT + 叙事 -->
      <section class="col-center">
        <!-- 极简CRT电视舞台 -->
        <div class="crt-stage">
          <CRTBezel>
            <StoryboardScene />
            <CardTransition
              :type="store.cardTransitionType"
              @complete="store.setCardTransition(null)"
            />
          </CRTBezel>
        </div>

        <NarrativeEventPanel />
      </section>

      <!-- 右：人生日志 -->
      <aside class="col-right">
        <LifeLog />
      </aside>
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
        <p class="cs-sub">搬家安置费 ¥20,000，薪资和生活成本将按城市水平调整。</p>
        <div class="cs-grid">
          <div
            v-for="city in cityList"
            :key="city"
            class="pixel-card cs-card"
            @click="handleCityPick(city)"
          >
            <div class="cs-name">{{ city }}</div>
            <div class="cs-stats">
              <span class="cs-stat-item" v-if="CITY_CONFIGS[city].costMultiplier >= 1.5">生活成本高</span>
              <span class="cs-stat-item" v-else-if="CITY_CONFIGS[city].costMultiplier <= 0.5">生活成本低</span>
              <span class="cs-stat-item" v-else>成本适中</span>
              <span class="cs-stat-item" v-if="CITY_CONFIGS[city].salaryMultiplier >= 1.2">薪资水平高</span>
              <span class="cs-stat-item" v-else-if="CITY_CONFIGS[city].salaryMultiplier <= 0.6">薪资水平低</span>
              <span class="cs-stat-item" v-else>薪资适中</span>
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

    <!-- ===================== 赛博确认弹窗 ===================== -->
    <CyberConfirm
      ref="confirmRef"
      title="系统警告"
      message="确定要放弃当前人生，重新开始吗？所有进度将被清除。"
      @confirm="handleRestartConfirm"
    />
  </div>
</template>

<style scoped>
.app-root {
  width: 100%;
  height: 100vh;
  height: 100dvh;
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
   顶部状态栏 - 紧凑霓虹风格
   ============================================================ */
.top-bar {
  position: relative;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 14px;
  flex-shrink: 0;
  background: rgba(15, 8, 35, 0.85);
  border-bottom: 2px solid var(--neon-pink);
  box-shadow: 0 0 12px rgba(255, 45, 149, 0.15);
  gap: 10px;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.top-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.top-title {
  font-size: 15px;
  color: var(--neon-pink);
  letter-spacing: 2px;
  text-shadow: 0 0 8px var(--neon-pink);
  font-family: 'DotGothic16', monospace;
}

.btn-restart {
  font-family: 'DotGothic16', monospace;
  font-size: 10px;
  color: var(--neon-red);
  background: rgba(50, 10, 10, 0.8);
  border: 1px solid var(--neon-red);
  padding: 3px 10px;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-restart:hover {
  background: rgba(255, 68, 68, 0.2);
  color: #fff;
}

.top-center {
  display: flex;
  gap: 5px;
  align-items: center;
  flex-wrap: wrap;
  flex: 1;
  justify-content: center;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 11px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-dim, rgba(255, 255, 255, 0.08));
}
.stat-badge .icon { font-size: 12px; }
.stat-badge .label { color: var(--text-dim, #6a6a8a); font-size: 9px; }
.stat-badge .value { font-weight: 700; font-size: 11px; }

.icon-age { color: var(--neon-blue); text-shadow: 0 0 4px var(--neon-blue), 0 0 8px var(--neon-blue); }
.icon-prof { color: var(--neon-orange); text-shadow: 0 0 4px var(--neon-orange), 0 0 8px var(--neon-orange); }
.icon-city { color: var(--neon-green); text-shadow: 0 0 4px var(--neon-green), 0 0 8px var(--neon-green); }
.icon-cycle { color: var(--neon-yellow); text-shadow: 0 0 4px var(--neon-yellow), 0 0 8px var(--neon-yellow); }
.icon-status { color: var(--neon-pink); text-shadow: 0 0 4px var(--neon-pink), 0 0 8px var(--neon-pink); }

.badge-age { border-color: var(--neon-blue); }
.badge-age .value { color: var(--neon-blue); text-shadow: 0 0 4px var(--neon-blue); }
.badge-prof { border-color: var(--neon-orange); }
.badge-prof .value { color: var(--neon-orange); }
.badge-city { border-color: var(--neon-green); }
.badge-city .value { color: var(--neon-green); }
.badge-cycle { border-color: var(--neon-yellow); }
.badge-cycle .value { color: var(--neon-yellow); }
.badge-status { border-color: var(--neon-pink); }
.badge-status .value { color: var(--neon-pink); }

.top-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.faith-meter {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--neon-purple);
}
.faith-label { font-size: 9px; color: var(--text-dim, #6a6a8a); }
.faith-value {
  font-size: 13px;
  font-weight: 700;
  color: var(--neon-purple);
  text-shadow: 0 0 6px var(--neon-purple);
}
.faith-bar {
  width: 50px;
  height: 5px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}
.faith-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--neon-red), var(--neon-orange), var(--neon-green));
  border-radius: 3px;
  transition: width 0.5s ease;
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
  min-height: 100dvh;
  overflow-x: hidden;
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

.intro-hint {
  font-size: 12px;
  color: var(--neon-purple);
  letter-spacing: 2px;
  opacity: 0.8;
  text-shadow: 0 0 6px var(--neon-purple);
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
   游戏主布局 - flex三栏（大屏自适应，无 max-width 限制）
   ============================================================ */
.game-main {
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  gap: 8px;
  padding: 8px;
  overflow: hidden;
  min-height: 0;
  width: 100%;
}

.col-left {
  width: clamp(200px, 15vw, 300px);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}

.col-center {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: hidden;
  min-height: 0;
}

.col-right {
  width: clamp(220px, 17vw, 340px);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

/* ============================================================
   CRT 电视舞台（极简）—— 占满中间栏，无左右留白
   ============================================================ */
.crt-stage {
  flex-shrink: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 100%;
  margin: 0 auto;
  min-height: 0;
  overflow: hidden;
}

/* 保障叙事面板有足够高度显示卡片 */
.col-center :deep(.narrative-panel) {
  min-height: 45%;
  flex-shrink: 0;
}

/* 覆盖 CRTBezel 内部样式，保持极简 */
.crt-stage :deep(.crt-screen-wrap) {
  width: 100%;
}

.crt-stage :deep(.crt-screen-frame) {
  box-shadow:
    inset 0 3px 8px rgba(0, 0, 0, 0.9),
    inset 0 -1px 4px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(201, 0, 255, 0.15),
    0 0 12px rgba(201, 0, 255, 0.12),
    0 4px 20px rgba(0, 0, 0, 0.6);
}

.crt-stage :deep(.crt-screen) {
  aspect-ratio: 21 / 9;
  max-height: 55vh;
}

/* 大屏下 CRT 屏幕用更宽的比例填满空间 */
@media (min-width: 1600px) {
  .crt-stage :deep(.crt-screen) {
    aspect-ratio: 24 / 9;
    max-height: 50vh;
  }
}

/* ============================================================
   响应式布局 — 大屏使用 zoom 等比放大（简洁高效，无遗漏）
   ============================================================ */

/* 大屏（≥1400px，27寸1080p等）：整体放大1.1倍 */
@media (min-width: 1400px) {
  .app-root {
    height: calc(100dvh / 1.1);
    zoom: 1.1;
  }
}

/* 超大屏（≥1900px，27寸2K等）：整体放大1.25倍 */
@media (min-width: 1900px) {
  .app-root {
    height: calc(100dvh / 1.25);
    zoom: 1.25;
  }
}

/* 4K（≥2400px）：整体放大1.5倍 */
@media (min-width: 2400px) {
  .app-root {
    height: calc(100dvh / 1.5);
    zoom: 1.5;
  }
}

/* 平板：收窄侧栏 */
@media (max-width: 1100px) {
  .col-left { width: 200px; }
  .col-right { width: 220px; }
}

/* 平板竖屏 / 小桌面：切换为纵向堆叠 */
@media (max-width: 900px) {
  .app-root {
    height: auto;
    min-height: 100dvh;
    overflow-y: auto;
    overflow-x: hidden;
  }
  .game-main {
    flex-direction: column;
    overflow: visible;
    padding: 6px;
  }
  .col-left, .col-right {
    width: 100%;
    flex-shrink: 0;
  }
  .col-left {
    order: 1;
    max-height: none;
  }
  .col-center {
    order: 0;
  }
  /* 日志面板在移动端限制高度，内部滚动，避免无限拉长页面 */
  .col-right {
    order: 2;
    max-height: 400px;
  }
  .crt-stage { max-width: 100%; }
  .crt-stage :deep(.crt-screen) {
    aspect-ratio: 16 / 9;
  }
}

/* 手机：进一步紧凑化 */
@media (max-width: 600px) {
  .top-bar {
    flex-wrap: wrap;
    padding: 4px 8px;
    gap: 4px;
  }
  .top-left {
    gap: 6px;
  }
  .top-title {
    font-size: 13px;
    letter-spacing: 1px;
  }
  .btn-restart {
    font-size: 9px;
    padding: 2px 6px;
  }
  .top-center {
    order: 3;
    width: 100%;
    gap: 3px;
    overflow-x: auto;
    flex-wrap: nowrap;
    justify-content: flex-start;
    -webkit-overflow-scrolling: touch;
  }
  .top-center::-webkit-scrollbar {
    display: none;
  }
  .stat-badge {
    padding: 2px 6px;
    font-size: 10px;
    flex-shrink: 0;
  }
  .stat-badge .label { font-size: 8px; }
  .stat-badge .value { font-size: 10px; }
  .stat-badge .icon { font-size: 10px; }
  .top-right {
    gap: 4px;
  }
  .faith-meter {
    padding: 2px 6px;
    gap: 3px;
  }
  .faith-label { font-size: 8px; }
  .faith-value { font-size: 11px; }
  .faith-bar { width: 36px; }

  /* 欢迎界面 */
  .intro-screen {
    padding: 20px 10px;
  }
  .intro-inner {
    padding: 24px 16px;
    gap: 16px;
  }
  .intro-title {
    font-size: 32px;
    letter-spacing: 3px;
  }
  .intro-tagline {
    font-size: 12px;
    letter-spacing: 3px;
  }
  .intro-desc {
    font-size: 13px;
    letter-spacing: 0.5px;
    line-height: 1.8;
  }
  .btn-start-big {
    font-size: 16px;
    padding: 12px 32px;
    letter-spacing: 2px;
  }
  .btn-cursor { font-size: 18px; }

  /* 游戏主界面紧凑化 */
  .game-main {
    padding: 4px;
    gap: 6px;
  }
  .col-left, .col-right {
    gap: 4px;
  }
  /* 手机端日志面板再缩短 */
  .col-right {
    max-height: 300px;
  }
}

/* 超小屏（≤380px） */
@media (max-width: 380px) {
  .intro-title {
    font-size: 26px;
    letter-spacing: 2px;
  }
  .intro-inner {
    padding: 16px 10px;
    gap: 12px;
  }
  .intro-desc {
    font-size: 12px;
  }
  .btn-start-big {
    font-size: 14px;
    padding: 10px 20px;
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
