<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '../../store/game.store.js'
import { CITY_CONFIGS } from '../../utils/math-engine.js'
import type { CityType, Profession } from '../../types/global.d.js'

const store = useGameStore()

interface CityOption {
  id: CityType
  label: string
  costMultiplier: number
  salaryMultiplier: number
  tagline: string
}

interface ProfessionOption {
  id: Profession
  label: string
  blurb: string
}

const cityOptions: CityOption[] = [
  {
    id: '资本修罗场',
    label: '资本修罗场',
    costMultiplier: CITY_CONFIGS['资本修罗场'].costMultiplier,
    salaryMultiplier: CITY_CONFIGS['资本修罗场'].salaryMultiplier,
    tagline: '高风险·高回报·裁员率+5%',
  },
  {
    id: '中坚大后方',
    label: '中坚大后方',
    costMultiplier: CITY_CONFIGS['中坚大后方'].costMultiplier,
    salaryMultiplier: CITY_CONFIGS['中坚大后方'].salaryMultiplier,
    tagline: '基准线·稳中求进',
  },
  {
    id: '避风低洼地',
    label: '避风低洼地',
    costMultiplier: CITY_CONFIGS['避风低洼地'].costMultiplier,
    salaryMultiplier: CITY_CONFIGS['避风低洼地'].salaryMultiplier,
    tagline: '低成本·低薪资·裁员率-50%',
  },
]

const professionOptions: ProfessionOption[] = [
  { id: '体制内',   label: '体制内',   blurb: '年涨3%·上限2.5倍·铁饭碗' },
  { id: '红利行业', label: '红利行业', blurb: '35岁前年涨10%·35岁断崖0.6倍' },
  { id: '传统私企', label: '传统私企', blurb: '年涨4%·上限2.0倍' },
  { id: '自由职业', label: '自由职业', blurb: '1%基础+随机±20%·副业加成' },
  { id: '实体创业', label: '实体创业', blurb: '过山车式收入·连续两年亏损即破产' },
  { id: '一线蓝领', label: '一线蓝领', blurb: '年涨1%·上限1.3倍·45岁身体劳损' },
]

const selectedCity = ref<CityType>('中坚大后方')
const selectedProfession = ref<Profession>('传统私企')
const initSalary = ref<number>(10000)
const targetAge = ref<number>(60)
const targetWealth = ref<number>(3000000)

// 城市推荐目标金额
const recommendedTargets: Record<CityType, number> = {
  '资本修罗场': 5000000,
  '中坚大后方': 3000000,
  '避风低洼地': 1500000,
}

// 切换城市时更新推荐目标
function selectCity(city: CityType) {
  selectedCity.value = city
  // 如果当前目标是默认值（300万）或等于其他城市的推荐值，自动切换
  const isDefaultTarget = Object.values(recommendedTargets).includes(targetWealth.value)
  if (isDefaultTarget) {
    targetWealth.value = recommendedTargets[city]
  }
}

const canStart = computed(() => {
  return (
    initSalary.value > 0 &&
    initSalary.value <= 1000000 &&
    targetAge.value > 22 &&
    targetAge.value <= 80 &&
    targetWealth.value > 0
  )
})

const effectiveStartSalary = computed(() => {
  const mult = CITY_CONFIGS[selectedCity.value].salaryMultiplier
  return Math.round(initSalary.value * mult)
})

function formatWan(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1).replace(/\.0$/, '') + '万'
  }
  return num.toString()
}

function startGame(): void {
  if (!canStart.value) return
  store.setupGame(
    selectedCity.value,
    selectedProfession.value,
    initSalary.value,
    targetAge.value,
    targetWealth.value,
  )
}
</script>

<template>
  <div class="setup-screen">
    <!-- 背景装饰 -->
    <div class="setup-bg-scanlines" />

    <div class="setup-inner pixel-panel">
      <!-- 顶部霓虹标题 -->
      <div class="setup-neon-header">
        <span class="title-deco">◢◤</span>
        <h1 class="setup-title-neon">GAME SETUP</h1>
        <span class="title-deco">◥◣</span>
      </div>
      <p class="setup-neon-sub">设定你的像素人生起点</p>

      <!-- 城市选择 -->
      <section class="setup-section">
        <h3 class="section-title">
          <span class="section-num neon-blue-num">01</span>
          <span class="section-title-text">选择落脚城市</span>
        </h3>
        <div class="city-grid">
          <div
            v-for="city in cityOptions"
            :key="city.id"
            class="neon-card city-card"
            :class="{ selected: selectedCity === city.id }"
            @click="selectCity(city.id)"
          >
            <div class="card-scanlines" />
            <div class="city-name">{{ city.label }}</div>
            <div class="city-stats">
              <span class="stat">
                <span class="stat-label">成本</span>
                <span class="stat-value stat-orange">x{{ city.costMultiplier }}</span>
              </span>
              <span class="stat">
                <span class="stat-label">薪资</span>
                <span class="stat-value stat-green">x{{ city.salaryMultiplier }}</span>
              </span>
            </div>
            <div class="city-tagline">{{ city.tagline }}</div>
            <div v-if="selectedCity === city.id" class="selected-indicator">
              <span class="indicator-dot" />
            </div>
            <!-- 角装饰 -->
            <span class="card-corner cc-tl" />
            <span class="card-corner cc-tr" />
            <span class="card-corner cc-bl" />
            <span class="card-corner cc-br" />
          </div>
        </div>
      </section>

      <!-- 职业选择 -->
      <section class="setup-section">
        <h3 class="section-title">
          <span class="section-num neon-pink-num">02</span>
          <span class="section-title-text">选择初始职业</span>
        </h3>
        <div class="profession-grid">
          <div
            v-for="prof in professionOptions"
            :key="prof.id"
            class="neon-card prof-card"
            :class="{ selected: selectedProfession === prof.id }"
            @click="selectedProfession = prof.id"
          >
            <div class="card-scanlines" />
            <div class="prof-name">{{ prof.label }}</div>
            <div class="prof-blurb">{{ prof.blurb }}</div>
            <div v-if="selectedProfession === prof.id" class="selected-indicator">
              <span class="indicator-dot" />
            </div>
          </div>
        </div>
      </section>

      <!-- 数值输入 -->
      <section class="setup-section">
        <h3 class="section-title">
          <span class="section-num neon-green-num">03</span>
          <span class="section-title-text">设定初始与目标</span>
        </h3>
        <div class="input-grid">
          <div class="input-group">
            <label for="salary">初始月薪（元）</label>
            <input
              id="salary"
              v-model.number="initSalary"
              type="number"
              min="1000"
              max="1000000"
              step="1000"
            />
            <div class="input-hint">
              在{{ selectedCity }}实际起薪约
              <strong class="hint-green">{{ effectiveStartSalary.toLocaleString() }}元</strong>
              （x{{ CITY_CONFIGS[selectedCity].salaryMultiplier }}）
            </div>
          </div>

          <div class="input-group">
            <label for="t-age">目标退休年龄</label>
            <input
              id="t-age"
              v-model.number="targetAge"
              type="number"
              min="30"
              max="80"
              step="1"
            />
            <div class="input-hint">默认60岁</div>
          </div>

          <div class="input-group">
            <label for="t-wealth">目标退休资产（元）</label>
            <input
              id="t-wealth"
              v-model.number="targetWealth"
              type="number"
              min="100000"
              max="100000000"
              step="100000"
            />
            <div class="input-hint">{{ selectedCity }}推荐{{ formatWan(recommendedTargets[selectedCity]) }}元</div>
          </div>
        </div>
      </section>

      <!-- 开始按钮 -->
      <div class="setup-footer">
        <button class="btn-start neon-start-btn" :disabled="!canStart" @click="startGame">
          <span class="btn-scan" />
          <span class="btn-arrows">▶</span>
          开始像素人生
          <span class="btn-arrows">▶</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.setup-screen {
  position: fixed;
  inset: 0;
  background: var(--bg-deep);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
  padding: 40px 16px;
  z-index: 50;
}

.setup-bg-scanlines {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px,
    transparent 2px,
    rgba(201, 0, 255, 0.02) 2px,
    rgba(201, 0, 255, 0.02) 4px
  );
}

.setup-inner {
  position: relative;
  z-index: 1;
  width: min(860px, 100%);
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 28px 28px;
}

/* 顶部霓虹标题 */
.setup-neon-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.setup-title-neon {
  font-size: 28px;
  color: #ff2d95;
  margin: 0;
  letter-spacing: 4px;
  font-weight: bold;
  font-family: 'DotGothic16', monospace;
  text-shadow:
    0 0 6px #ff2d95,
    0 0 14px #ff2d95,
    0 0 28px #ff2d95,
    0 0 50px #c900ff60;
  animation: setupTitleGlow 3s ease-in-out infinite;
}

@keyframes setupTitleGlow {
  0%, 100% {
    text-shadow: 0 0 6px #ff2d95, 0 0 14px #ff2d95, 0 0 28px #ff2d95, 0 0 50px #c900ff60;
  }
  50% {
    text-shadow: 0 0 8px #ff2d95, 0 0 20px #ff2d95, 0 0 36px #c900ff80, 0 0 60px #00d4ff40;
  }
}

.title-deco {
  color: #c900ff;
  font-size: 14px;
  text-shadow: 0 0 8px #c900ff;
}

.setup-neon-sub {
  text-align: center;
  color: #c900ff;
  margin: -14px 0 0;
  letter-spacing: 3px;
  font-size: 12px;
  text-shadow: 0 0 6px #c900ff;
  font-family: 'DotGothic16', monospace;
}

.setup-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 16px;
  color: #f4f4f4;
  margin: 0;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'DotGothic16', monospace;
}

.section-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 13px;
  font-weight: bold;
  border: 2px solid;
  font-family: 'DotGothic16', monospace;
}

.neon-blue-num {
  color: #00d4ff;
  border-color: #00d4ff;
  background: rgba(0, 212, 255, 0.1);
  text-shadow: 0 0 6px #00d4ff;
  box-shadow: 0 0 8px #00d4ff40, inset 0 0 6px #00d4ff20;
}

.neon-pink-num {
  color: #ff2d95;
  border-color: #ff2d95;
  background: rgba(255, 45, 149, 0.1);
  text-shadow: 0 0 6px #ff2d95;
  box-shadow: 0 0 8px #ff2d9540, inset 0 0 6px #ff2d9520;
}

.neon-green-num {
  color: #00ff88;
  border-color: #00ff88;
  background: rgba(0, 255, 136, 0.1);
  text-shadow: 0 0 6px #00ff88;
  box-shadow: 0 0 8px #00ff8840, inset 0 0 6px #00ff8820;
}

.section-title-text {
  text-shadow: 0 0 4px rgba(255,255,255,0.2);
}

/* 城市/职业 霓虹卡片 */
.neon-card {
  position: relative;
  background: rgba(10, 5, 30, 0.6);
  border: 2px solid #00d4ff60;
  box-shadow:
    0 0 4px #00d4ff20,
    inset 0 0 8px #00d4ff10;
  padding: 16px;
  cursor: pointer;
  transition: all 0.15s ease;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  overflow: hidden;
}

.neon-card:hover {
  border-color: #ff8800;
  background: rgba(255, 136, 0, 0.08);
  box-shadow:
    0 0 8px #ff8800,
    0 0 18px #ff880040,
    inset 0 0 10px #ff880015;
  transform: translateY(-2px);
}

.neon-card.selected {
  border-color: #ff2d95;
  background: rgba(255, 45, 149, 0.12);
  box-shadow:
    0 0 10px #ff2d95,
    0 0 22px #ff2d9560,
    0 0 40px #c900ff30,
    inset 0 0 14px #ff2d9520;
}

.card-scanlines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px,
    transparent 3px,
    rgba(255, 255, 255, 0.02) 3px,
    rgba(255, 255, 255, 0.02) 4px
  );
  z-index: 0;
}

/* 城市 */
.city-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

@media (max-width: 640px) {
  .city-grid {
    grid-template-columns: 1fr;
  }
}

.city-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: center;
}

.city-name {
  font-size: 18px;
  color: #00d4ff;
  letter-spacing: 1px;
  font-weight: bold;
  text-shadow: 0 0 6px #00d4ff;
  font-family: 'DotGothic16', monospace;
  position: relative;
  z-index: 1;
}

.city-card.selected .city-name {
  color: #fff;
  text-shadow: 0 0 8px #ff2d95, 0 0 4px #fff;
}

.city-stats {
  display: flex;
  justify-content: center;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat .stat-label {
  font-size: 11px;
  color: #94b0c2;
  letter-spacing: 1px;
}

.stat-value {
  font-size: 15px;
  font-weight: bold;
}

.stat-orange {
  color: #ff8800;
  text-shadow: 0 0 6px #ff8800;
}

.stat-green {
  color: #00ff88;
  text-shadow: 0 0 6px #00ff88;
}

.city-tagline {
  font-size: 11px;
  color: #c2c3c7;
  letter-spacing: 0.5px;
  position: relative;
  z-index: 1;
}

.city-card.selected .city-tagline {
  color: #ffccdd;
}

/* 选中指示器 */
.selected-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.indicator-dot {
  width: 10px;
  height: 10px;
  background: #ff2d95;
  border-radius: 50%;
  box-shadow:
    0 0 6px #ff2d95,
    0 0 14px #ff2d95,
    0 0 20px #ff2d9580;
  animation: dotPulse 1.2s ease-in-out infinite;
}

@keyframes dotPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.3); }
}

/* 卡片角装饰 */
.card-corner {
  position: absolute;
  width: 8px;
  height: 8px;
  z-index: 2;
}
.cc-tl { top: 0; left: 0; border-top: 2px solid #00d4ff80; border-left: 2px solid #00d4ff80; }
.cc-tr { top: 0; right: 0; border-top: 2px solid #00d4ff80; border-right: 2px solid #00d4ff80; }
.cc-bl { bottom: 0; left: 0; border-bottom: 2px solid #00d4ff80; border-left: 2px solid #00d4ff80; }
.cc-br { bottom: 0; right: 0; border-bottom: 2px solid #00d4ff80; border-right: 2px solid #00d4ff80; }

.neon-card.selected .cc-tl,
.neon-card.selected .cc-tr,
.neon-card.selected .cc-bl,
.neon-card.selected .cc-br {
  border-color: #ff2d95;
}

.neon-card:hover .cc-tl,
.neon-card:hover .cc-tr,
.neon-card:hover .cc-bl,
.neon-card:hover .cc-br {
  border-color: #ff8800;
}

/* 职业 */
.profession-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

@media (max-width: 640px) {
  .profession-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.prof-card {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: center;
}

.prof-name {
  font-size: 15px;
  color: #00d4ff;
  letter-spacing: 1px;
  font-weight: bold;
  text-shadow: 0 0 4px #00d4ff;
  font-family: 'DotGothic16', monospace;
  position: relative;
  z-index: 1;
}

.prof-card.selected .prof-name {
  color: #fff;
  text-shadow: 0 0 8px #ff2d95, 0 0 4px #fff;
}

.prof-blurb {
  font-size: 10px;
  color: #94b0c2;
  line-height: 1.4;
  position: relative;
  z-index: 1;
}

.prof-card.selected .prof-blurb {
  color: #ffccdd;
}

/* 输入 */
.input-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 640px) {
  .input-grid {
    grid-template-columns: 1fr;
  }
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-group label {
  font-size: 13px;
  color: #ff2d95;
  letter-spacing: 1px;
  text-shadow: 0 0 4px #ff2d95;
  font-family: 'DotGothic16', monospace;
}

.input-group input {
  width: 100%;
}

.input-hint {
  font-size: 11px;
  color: #94b0c2;
}

.hint-green {
  color: #00ff88;
  text-shadow: 0 0 4px #00ff88;
}

/* 底部 */
.setup-footer {
  display: flex;
  justify-content: center;
  padding-top: 8px;
}

/* 霓虹开始按钮 */
.neon-start-btn {
  position: relative;
  font-size: 18px;
  padding: 16px 40px;
  background: rgba(0, 255, 136, 0.1);
  color: #00ff88;
  border: 2px solid #00ff88;
  box-shadow:
    0 0 10px #00ff88,
    0 0 24px #00ff8840,
    inset 0 0 14px #00ff8820;
  letter-spacing: 3px;
  font-family: 'DotGothic16', monospace;
  font-weight: bold;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  transition: all 0.15s ease;
  text-shadow: 0 0 8px #00ff88;
  overflow: hidden;
}

.btn-scan {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px,
    transparent 3px,
    rgba(255,255,255,0.03) 3px,
    rgba(255,255,255,0.03) 4px
  );
  pointer-events: none;
}

.btn-arrows {
  font-size: 12px;
  opacity: 0.7;
  animation: arrowPulse 1s ease-in-out infinite;
  position: relative;
  z-index: 1;
}
.btn-arrows:last-child {
  animation-delay: 0.5s;
}

@keyframes arrowPulse {
  0%, 100% { opacity: 0.4; transform: translateX(0); }
  50% { opacity: 1; transform: translateX(4px); }
}

.neon-start-btn:hover:not(:disabled) {
  background: rgba(255, 45, 149, 0.15);
  color: #ff2d95;
  border-color: #ff2d95;
  box-shadow:
    0 0 14px #ff2d95,
    0 0 30px #ff2d9580,
    0 0 55px #c900ff40,
    inset 0 0 18px #ff2d9525;
  text-shadow: 0 0 8px #ff2d95, 0 0 16px #ff2d95;
  transform: translateY(-2px);
}

.neon-start-btn:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow:
    0 0 6px #ff2d95,
    0 0 14px #ff2d9560,
    inset 0 0 10px #ff2d9530;
}

.neon-start-btn:disabled {
  background: rgba(50, 50, 70, 0.4);
  color: #566c86;
  border-color: #333c57;
  cursor: not-allowed;
  box-shadow: none;
  text-shadow: none;
  opacity: 0.5;
}
</style>
