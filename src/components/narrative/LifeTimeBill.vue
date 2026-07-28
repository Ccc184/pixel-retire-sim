<script setup lang="ts">
import { computed, ref } from 'vue'
import type { GameState } from '../../types/global.d.js'
import { fmt, fmtNum } from '../../utils/format.js'
import { getDream } from '../../data/retirement-dreams.js'
import type { DreamItem } from '../../data/retirement-dreams.js'

const props = defineProps<{
  state: GameState
}>()

const s = computed(() => props.state)
const fmtMoney = fmt

// ========== 收支明细 ==========
const incomeItems = computed(() => {
  const items: { label: string; value: number }[] = []
  if (s.value.lifetimeSalary > 0) items.push({ label: '工资', value: s.value.lifetimeSalary })
  if (s.value.lifetimeInvestmentGain !== 0) items.push({ label: '理财收益', value: s.value.lifetimeInvestmentGain })
  if (s.value.lifetimeSideHustle > 0) items.push({ label: '副业', value: s.value.lifetimeSideHustle })
  return items
})

const totalIncome = computed(() =>
  s.value.lifetimeSalary + s.value.lifetimeInvestmentGain + s.value.lifetimeSideHustle
)

const foodCost = computed(() => Math.max(0, s.value.lifetimeLivingCost - s.value.lifetimeChildCost))

const expenseItems = computed(() => {
  const items: { label: string; value: number }[] = []
  if (foodCost.value > 0) items.push({ label: '吃饭', value: foodCost.value })
  if (s.value.lifetimeMortgage > 0) items.push({ label: '房贷', value: s.value.lifetimeMortgage })
  if (s.value.lifetimeChildCost > 0) items.push({ label: '养娃', value: s.value.lifetimeChildCost })
  if (s.value.lifetimeParentCost > 0) items.push({ label: '给父母', value: s.value.lifetimeParentCost })
  if (s.value.lifetimeMedicalCost > 0) items.push({ label: '医院', value: s.value.lifetimeMedicalCost })
  if (s.value.lifetimeGiftMoney > 0) items.push({ label: '份子钱', value: s.value.lifetimeGiftMoney })
  if (s.value.lifetimeInsuranceCost > 0) items.push({ label: '保险', value: s.value.lifetimeInsuranceCost })
  if (s.value.lifetimeCardCost > 0) items.push({ label: '健身卡等', value: s.value.lifetimeCardCost })
  return items
})

const totalExpense = computed(() => expenseItems.value.reduce((sum, item) => sum + item.value, 0))

// ========== 净资产 ==========
const netAssets = computed(() => Math.max(0, s.value.currentSavings + s.value.propertyValue))
const isNegative = computed(() => s.value.currentSavings + s.value.propertyValue < 0)
const rawNetAssets = computed(() => s.value.currentSavings + s.value.propertyValue)

// ========== 梦想数据 ==========
const dream = computed(() => getDream(s.value.retirementDream))
const dreamAchieved = computed(() => dream.value !== null && netAssets.value >= dream.value.targetWealth)

// 还差多少实现梦想
const dreamGap = computed(() => {
  if (!dream.value || dreamAchieved.value) return 0
  return dream.value.targetWealth - netAssets.value
})

// ========== 退休等级（fallback 用，没有选梦想时）==========
interface RankInfo { icon: string; level: string; desc: string }

const retirementRank = computed<RankInfo>(() => {
  const net = netAssets.value
  if (net < 0) return { icon: '💀', level: '还得搬砖', desc: '退休是别人的传说' }
  if (net < 100000) return { icon: '🥲', level: '泡面自由', desc: '继续加油' }
  if (net < 500000) return { icon: '🫡', level: '广场舞后排', desc: '慢慢攒' }
  if (net < 1000000) return { icon: '😌', level: '菜市场自由', desc: '还行' }
  if (net < 3000000) return { icon: '😎', level: '超市自由', desc: '不错' }
  if (net < 7000000) return { icon: '🏆', level: '遛鸟级', desc: '可以了' }
  if (net < 15000000) return { icon: '👑', level: '半自由', desc: '舒坦' }
  if (net < 30000000) return { icon: '💎', level: '财务自由', desc: '赢了' }
  return { icon: '🐉', level: '赛博富豪', desc: '钱只是数字' }
})

// ========== 梦想换算卡片（总量大数字！）==========
interface BigCard {
  emoji: string
  title: string
  number: string
  unit: string
  joke: string
  cls: string
}

function pickJoke(jokes: [number, string][], val: number): string {
  for (const [threshold, text] of jokes) {
    if (val >= threshold) return text
  }
  return jokes[jokes.length - 1][1]
}

function fmtBig(n: number): string {
  if (n >= 1_0000_0000) return (n / 1_0000_0000).toFixed(1) + '亿'
  if (n >= 1000_0000) return (n / 100_00).toFixed(0) + '万'
  if (n >= 100_0000) return (n / 100_00).toFixed(1) + '万'
  if (n >= 1_0000) return Math.floor(n / 1_0000) + '万'
  return fmtNum(Math.floor(n))
}

const bigCards = computed<BigCard[]>(() => {
  const net = netAssets.value
  const d = dream.value

  if (net <= 0) {
    return [
      { emoji: '💸', title: '净资产', number: '0', unit: '元', joke: '梦碎了，打工去', cls: 'danger' },
      { emoji: '🏃', title: '还得打工', number: '∞', unit: '年', joke: '梦想先存着吧', cls: 'danger' },
      { emoji: '🪦', title: '退休', number: 'NO', unit: '', joke: '梦想是奢侈品', cls: 'danger' },
    ]
  }

  if (!d) {
    return [
      { emoji: '💰', title: '存款', number: fmtBig(net), unit: '元', joke: '数字而已', cls: 'green' },
      { emoji: '🍚', title: '够吃饭', number: fmtBig(Math.floor(net / 30)), unit: '天', joke: '民以食为天', cls: 'orange' },
      { emoji: '🏠', title: '总资产', number: fmtBig(net), unit: '元', joke: '还行吧', cls: 'cyan' },
    ]
  }

  const cardColors = ['orange', 'pink', 'cyan', 'purple', 'green', 'yellow']

  return d.items.map((item: DreamItem, i: number) => {
    const count = Math.floor(net / item.unitPrice)
    return {
      emoji: item.emoji,
      title: item.title,
      number: fmtBig(count),
      unit: item.unit,
      joke: pickJoke(item.jokes, count),
      cls: cardColors[i % cardColors.length],
    }
  })
})

// 翻牌状态
const flippedSet = ref<Set<number>>(new Set())
function toggleFlip(idx: number) {
  const next = new Set(flippedSet.value)
  if (next.has(idx)) next.delete(idx)
  else next.add(idx)
  flippedSet.value = next
}
function flipAll() {
  if (flippedSet.value.size === bigCards.value.length) {
    flippedSet.value = new Set()
  } else {
    flippedSet.value = new Set(bigCards.value.map((_, i) => i))
  }
}

const showDetail = ref(false)
</script>

<template>
  <div class="retirement-bill" :class="dream ? 'dream-' + dream.id : ''">
    <div class="scanlines" />

    <!-- ====== 梦想横幅 ====== -->
    <div v-if="dream" class="dream-banner" :class="{ achieved: dreamAchieved }">
      <div class="banner-glow" />
      <div class="banner-content">
        <div class="banner-emoji">{{ dream.emoji }}</div>
        <div class="banner-text">
          <div class="banner-name">{{ dream.name }}</div>
          <div class="banner-tagline">{{ dream.tagline }}</div>
        </div>
        <div class="banner-status">
          <div v-if="dreamAchieved" class="status-achieved">
            <span class="status-star">★</span> 梦想达成 <span class="status-star">★</span>
          </div>
          <div v-else class="status-gap">
            <div class="gap-label">还差</div>
            <div class="gap-amount">{{ fmtBig(dreamGap) }} <span class="gap-unit">元</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ====== 净资产 HERO ====== -->
    <div class="wealth-hero" :class="{ 'negative': isNegative }">
      <div class="wealth-bg-glow" />
      <div class="wealth-label">退 休 净 资 产</div>
      <div class="wealth-amount">
        <span class="currency">¥</span>{{ isNegative ? '0' : fmtNum(rawNetAssets) }}
      </div>
      <div v-if="isNegative" class="wealth-debt">负债 {{ fmtMoney(Math.abs(rawNetAssets)) }}</div>
    </div>

    <!-- 退休等级（无梦想时显示） -->
    <div v-if="!dream" class="rank-badge">
      <span class="rank-icon">{{ retirementRank.icon }}</span>
      <div class="rank-text">
        <div class="rank-level">{{ retirementRank.level }}</div>
        <div class="rank-desc">{{ retirementRank.desc }}</div>
      </div>
    </div>

    <!-- ====== 换算卡片 ====== -->
    <div class="cards-section">
      <div class="cards-header" @click="flipAll">
        <span class="cards-title">💎 你的退休购买力</span>
        <span class="cards-toggle">{{ flippedSet.size === bigCards.length && bigCards.length > 0 ? '收起' : '全翻' }}</span>
      </div>
      <div class="cards-grid">
        <div
          v-for="(card, idx) in bigCards"
          :key="idx"
          class="flip-card"
          :class="['card-' + card.cls, { flipped: flippedSet.has(idx) }]"
          @click="toggleFlip(idx)"
        >
          <div class="flip-inner">
            <div class="flip-face flip-front">
              <div class="fc-emoji">{{ card.emoji }}</div>
              <div class="fc-number">{{ card.number }}<span class="fc-unit"> {{ card.unit }}</span></div>
              <div class="fc-title">{{ card.title }}</div>
            </div>
            <div class="flip-face flip-back">
              <div class="fc-emoji-back">{{ card.emoji }}</div>
              <div class="fc-joke">{{ card.joke }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="cards-hint">点击卡片翻面看梗 · 点标题全翻</div>
    </div>

    <!-- ====== 收支明细 ====== -->
    <div class="detail-toggle" @click="showDetail = !showDetail">
      <span class="toggle-arrow">{{ showDetail ? '▼' : '▶' }}</span>
      {{ showDetail ? '收起明细' : '收支明细' }}
      <span class="toggle-arrow">{{ showDetail ? '▼' : '▶' }}</span>
    </div>

    <div v-if="showDetail" class="detail-bill">
      <div class="detail-section">
        <div class="detail-row detail-total">
          <span class="detail-label">总收入</span>
          <span class="detail-dots" />
          <span class="detail-val val-income">{{ fmtMoney(totalIncome) }}</span>
        </div>
        <div v-for="item in incomeItems" :key="item.label" class="detail-row detail-sub">
          <span class="detail-label">{{ item.label }}</span>
          <span class="detail-dots" />
          <span class="detail-val">{{ fmtMoney(item.value) }}</span>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-row detail-total">
          <span class="detail-label">总支出</span>
          <span class="detail-dots" />
          <span class="detail-val val-expense">{{ fmtMoney(totalExpense) }}</span>
        </div>
        <div v-for="item in expenseItems" :key="item.label" class="detail-row detail-sub">
          <span class="detail-label">{{ item.label }}</span>
          <span class="detail-dots" />
          <span class="detail-val">{{ fmtMoney(item.value) }}</span>
        </div>
      </div>

      <div class="detail-net">
        <div class="detail-row detail-net-row">
          <span class="detail-label">净资产</span>
          <span class="detail-dots" />
          <span class="detail-val" :class="isNegative ? 'val-negative' : 'val-net'">{{ fmtMoney(rawNetAssets) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.retirement-bill {
  position: relative;
  background: #0a0518;
  background-image:
    radial-gradient(ellipse at 20% 0%, rgba(201, 0, 255, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(0, 212, 255, 0.12) 0%, transparent 50%);
  border: 2px solid #c900ff;
  border-radius: 6px;
  padding: 24px 22px 20px;
  font-family: 'DotGothic16', 'Courier New', monospace;
  color: #f0e6ff;
  box-shadow:
    0 0 24px rgba(201, 0, 255, 0.4),
    inset 0 0 40px rgba(201, 0, 255, 0.06);
  overflow-y: auto;
  max-height: 82vh;
}

/* 梦想主题色覆盖 */
.dream-world_traveler { border-color: #00d4ff; box-shadow: 0 0 24px rgba(0,212,255,0.4), inset 0 0 40px rgba(0,212,255,0.06); }
.dream-farm_hermit { border-color: #00ff88; box-shadow: 0 0 24px rgba(0,255,136,0.4), inset 0 0 40px rgba(0,255,136,0.06); }
.dream-lifelong_scholar { border-color: #c900ff; box-shadow: 0 0 24px rgba(201,0,255,0.4), inset 0 0 40px rgba(201,0,255,0.06); }
.dream-ultimate_otaku { border-color: #ff8800; box-shadow: 0 0 24px rgba(255,136,0,0.4), inset 0 0 40px rgba(255,136,0,0.06); }
.dream-square_dance_king { border-color: #ffec27; box-shadow: 0 0 24px rgba(255,236,39,0.4), inset 0 0 40px rgba(255,236,39,0.06); }
.dream-silver_volunteer { border-color: #ff2d95; box-shadow: 0 0 24px rgba(255,45,149,0.4), inset 0 0 40px rgba(255,45,149,0.06); }

.scanlines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px,
    transparent 2px,
    rgba(0, 0, 0, 0.1) 2px,
    rgba(0, 0, 0, 0.1) 4px
  );
  z-index: 10;
  border-radius: 4px;
}

.retirement-bill > * {
  position: relative;
  z-index: 2;
}

/* ====== 梦想横幅 ====== */
.dream-banner {
  position: relative;
  margin-bottom: 20px;
  padding: 20px 22px;
  background: rgba(10, 5, 30, 0.8);
  border: 2px solid #c900ff;
  border-radius: 6px;
  overflow: hidden;
}

.dream-world_traveler .dream-banner { border-color: #00d4ff; }
.dream-farm_hermit .dream-banner { border-color: #00ff88; }
.dream-lifelong_scholar .dream-banner { border-color: #c900ff; }
.dream-ultimate_otaku .dream-banner { border-color: #ff8800; }
.dream-square_dance_king .dream-banner { border-color: #ffec27; }
.dream-silver_volunteer .dream-banner { border-color: #ff2d95; }

.banner-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 30% 50%, rgba(201,0,255,0.12), transparent 70%);
  pointer-events: none;
}

.dream-world_traveler .banner-glow { background: radial-gradient(ellipse at 30% 50%, rgba(0,212,255,0.12), transparent 70%); }
.dream-farm_hermit .banner-glow { background: radial-gradient(ellipse at 30% 50%, rgba(0,255,136,0.12), transparent 70%); }
.dream-ultimate_otaku .banner-glow { background: radial-gradient(ellipse at 30% 50%, rgba(255,136,0,0.12), transparent 70%); }
.dream-square_dance_king .banner-glow { background: radial-gradient(ellipse at 30% 50%, rgba(255,236,39,0.12), transparent 70%); }
.dream-silver_volunteer .banner-glow { background: radial-gradient(ellipse at 30% 50%, rgba(255,45,149,0.12), transparent 70%); }

.banner-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 18px;
}

.banner-emoji {
  font-size: 64px;
  flex-shrink: 0;
  line-height: 1;
  filter: drop-shadow(0 0 12px rgba(255,255,255,0.4));
}

.banner-text {
  flex: 1;
  min-width: 0;
}

.banner-name {
  font-size: 28px;
  font-weight: bold;
  color: #fff;
  letter-spacing: 3px;
  text-shadow: 0 0 10px rgba(255,255,255,0.4);
  margin-bottom: 4px;
  line-height: 1.2;
}

.banner-tagline {
  font-size: 16px;
  color: #b0a0d0;
  letter-spacing: 1px;
}

.banner-status {
  flex-shrink: 0;
  text-align: center;
  min-width: 140px;
}

.status-achieved {
  font-size: 22px;
  font-weight: bold;
  color: #ffec27;
  text-shadow: 0 0 12px #ffec27, 0 0 24px rgba(255,236,39,0.6);
  letter-spacing: 2px;
  animation: achievedGlow 1.2s ease-in-out infinite alternate;
}

.status-star {
  display: inline-block;
  animation: starSpin 2s linear infinite;
}

@keyframes starSpin {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.2); }
  100% { transform: rotate(360deg) scale(1); }
}

@keyframes achievedGlow {
  0% { text-shadow: 0 0 10px #ffec27; }
  100% { text-shadow: 0 0 16px #ffec27, 0 0 32px #ff8800; }
}

.gap-label {
  font-size: 14px;
  color: #8a7aaa;
  letter-spacing: 2px;
  margin-bottom: 2px;
}

.gap-amount {
  font-size: 26px;
  font-weight: bold;
  color: #ff8800;
  text-shadow: 0 0 8px rgba(255,136,0,0.5);
  line-height: 1.1;
}

.gap-unit {
  font-size: 16px;
  font-weight: normal;
  opacity: 0.8;
}

/* ====== 净资产 HERO ====== */
.wealth-hero {
  position: relative;
  text-align: center;
  margin-bottom: 24px;
  padding: 28px 20px;
  background: linear-gradient(135deg, rgba(0,255,136,0.08), rgba(255,236,39,0.08));
  border: 2px solid #00ff88;
  border-radius: 6px;
  box-shadow: 0 0 16px rgba(0,255,136,0.3), inset 0 0 30px rgba(0,255,136,0.06);
  overflow: hidden;
}

.wealth-bg-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(255,236,39,0.08), transparent 70%);
  pointer-events: none;
}

.wealth-hero.negative {
  background: linear-gradient(135deg, rgba(255,0,77,0.1), rgba(255,45,149,0.1));
  border-color: #ff004d;
  box-shadow: 0 0 16px rgba(255,0,77,0.3), inset 0 0 30px rgba(255,0,77,0.06);
}

.wealth-hero.negative .wealth-bg-glow {
  background: radial-gradient(ellipse at center, rgba(255,0,77,0.1), transparent 70%);
}

.wealth-label {
  font-size: 18px;
  color: #8a7aaa;
  letter-spacing: 6px;
  margin-bottom: 10px;
  font-weight: bold;
}

.wealth-amount {
  font-size: 60px;
  font-weight: bold;
  color: #ffec27;
  text-shadow: 0 0 16px #ffec27, 0 0 40px rgba(255,236,39,0.6);
  letter-spacing: 2px;
  line-height: 1.1;
}

.wealth-amount .currency {
  font-size: 36px;
  color: #00ff88;
  text-shadow: 0 0 12px #00ff88;
  margin-right: 4px;
}

.wealth-hero.negative .wealth-amount {
  color: #ff004d;
  text-shadow: 0 0 14px #ff004d;
}

.wealth-hero.negative .currency { color: #ff2d95; }

.wealth-debt {
  font-size: 18px;
  color: #ff6b6b;
  margin-top: 8px;
  font-weight: bold;
}

/* ====== 退休等级 ====== */
.rank-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: rgba(201, 0, 255, 0.1);
  border: 2px solid #c900ff;
  border-radius: 6px;
}

.rank-icon { font-size: 48px; flex-shrink: 0; filter: drop-shadow(0 0 8px rgba(201,0,255,0.6)); }
.rank-text { text-align: left; }

.rank-level {
  font-size: 26px;
  color: #c900ff;
  font-weight: bold;
  text-shadow: 0 0 10px #c900ff;
  letter-spacing: 2px;
  margin-bottom: 2px;
}

.rank-desc { font-size: 16px; color: #8a7aaa; }

/* ====== 换算卡片 ====== */
.cards-section { margin-bottom: 20px; }

.cards-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  cursor: pointer;
  user-select: none;
}

.cards-title {
  font-size: 20px;
  font-weight: bold;
  color: #00d4ff;
  letter-spacing: 2px;
  text-shadow: 0 0 8px rgba(0,212,255,0.5);
}

.cards-toggle {
  font-size: 16px;
  color: #c900ff;
  letter-spacing: 1px;
  text-shadow: 0 0 6px rgba(201,0,255,0.5);
  padding: 6px 16px;
  border: 1px solid rgba(201,0,255,0.4);
  border-radius: 4px;
  transition: all 0.2s;
}

.cards-toggle:hover { background: rgba(201,0,255,0.15); }

.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.flip-card {
  perspective: 800px;
  height: 180px;
  cursor: pointer;
}

.flip-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.flip-card.flipped .flip-inner { transform: rotateY(180deg); }

.flip-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 2px solid;
  border-radius: 6px;
  background: rgba(15, 8, 35, 0.9);
  padding: 12px 8px;
}

.flip-back { transform: rotateY(180deg); }

/* 卡片颜色 */
.card-orange, .card-orange .flip-face { border-color: #ff8800; box-shadow: 0 0 12px rgba(255,136,0,0.25); }
.card-pink, .card-pink .flip-face { border-color: #ff2d95; box-shadow: 0 0 12px rgba(255,45,149,0.25); }
.card-cyan, .card-cyan .flip-face { border-color: #00d4ff; box-shadow: 0 0 12px rgba(0,212,255,0.25); }
.card-purple, .card-purple .flip-face { border-color: #c900ff; box-shadow: 0 0 12px rgba(201,0,255,0.25); }
.card-yellow, .card-yellow .flip-face { border-color: #ffec27; box-shadow: 0 0 12px rgba(255,236,39,0.25); }
.card-green, .card-green .flip-face { border-color: #00ff88; box-shadow: 0 0 12px rgba(0,255,136,0.25); }
.card-danger, .card-danger .flip-face { border-color: #ff004d; box-shadow: 0 0 12px rgba(255,0,77,0.25); }

/* 正面 */
.fc-emoji {
  font-size: 44px;
  line-height: 1;
  filter: drop-shadow(0 0 6px rgba(255,255,255,0.3));
}

.fc-number {
  font-size: 38px;
  font-weight: bold;
  line-height: 1.1;
  letter-spacing: 1px;
}

.fc-unit {
  font-size: 18px;
  font-weight: normal;
  opacity: 0.8;
}

.card-orange .fc-number { color: #ff8800; text-shadow: 0 0 12px rgba(255,136,0,0.6); }
.card-pink .fc-number { color: #ff2d95; text-shadow: 0 0 12px rgba(255,45,149,0.6); }
.card-cyan .fc-number { color: #00d4ff; text-shadow: 0 0 12px rgba(0,212,255,0.6); }
.card-purple .fc-number { color: #c900ff; text-shadow: 0 0 12px rgba(201,0,255,0.6); }
.card-yellow .fc-number { color: #ffec27; text-shadow: 0 0 12px rgba(255,236,39,0.6); }
.card-green .fc-number { color: #00ff88; text-shadow: 0 0 12px rgba(0,255,136,0.6); }
.card-danger .fc-number { color: #ff004d; text-shadow: 0 0 12px rgba(255,0,77,0.6); }

.fc-title {
  font-size: 16px;
  color: #b0a0c0;
  letter-spacing: 1px;
  text-align: center;
  line-height: 1.3;
}

/* 背面 */
.fc-emoji-back { font-size: 40px; opacity: 0.7; }

.fc-joke {
  font-size: 18px;
  color: #f0e6ff;
  text-align: center;
  line-height: 1.5;
  padding: 0 10px;
  font-style: italic;
}

.card-orange.flipped .flip-back { background: rgba(255,136,0,0.15); }
.card-pink.flipped .flip-back { background: rgba(255,45,149,0.15); }
.card-cyan.flipped .flip-back { background: rgba(0,212,255,0.15); }
.card-purple.flipped .flip-back { background: rgba(201,0,255,0.15); }
.card-yellow.flipped .flip-back { background: rgba(255,236,39,0.15); }
.card-green.flipped .flip-back { background: rgba(0,255,136,0.15); }
.card-danger.flipped .flip-back { background: rgba(255,0,77,0.15); }

.cards-hint {
  text-align: center;
  font-size: 14px;
  color: #6a5a8a;
  margin-top: 10px;
  letter-spacing: 1px;
}

/* ====== 收支明细 ====== */
.detail-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 14px;
  background: rgba(0,212,255,0.08);
  border: 1px dashed rgba(0,212,255,0.4);
  color: #00d4ff;
  font-size: 18px;
  letter-spacing: 3px;
  cursor: pointer;
  text-shadow: 0 0 6px rgba(0,212,255,0.5);
  transition: all 0.2s;
  user-select: none;
  border-radius: 4px;
  font-weight: bold;
}

.detail-toggle:hover {
  background: rgba(0,212,255,0.15);
  border-color: #00d4ff;
  box-shadow: 0 0 12px rgba(0,212,255,0.25);
}

.toggle-arrow {
  font-size: 14px;
  opacity: 0.7;
}

.detail-bill {
  margin-top: 12px;
  padding: 18px;
  background: #050505;
  border: 1px dashed #444;
  font-family: 'Courier New', 'Consolas', monospace;
  font-size: 17px;
  line-height: 2.1;
  color: #b0ffb0;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.8);
  border-radius: 4px;
}

.detail-section { margin-bottom: 6px; }
.detail-row { display: flex; align-items: baseline; width: 100%; }
.detail-total { font-weight: bold; color: #ffffff; font-size: 19px; }
.detail-sub { padding-left: 12px; color: #b0ffb0; }
.detail-net-row { font-weight: bold; font-size: 20px; padding: 8px 0; }
.detail-label { white-space: nowrap; flex-shrink: 0; }

.detail-dots {
  flex: 1;
  border-bottom: 1px dotted #555;
  margin: 0 10px 5px;
  min-width: 20px;
}

.detail-val { white-space: nowrap; text-align: right; flex-shrink: 0; }
.val-income { color: #00ff88; }
.val-expense { color: #ff8800; }
.val-net { color: #ffec27; text-shadow: 0 0 6px rgba(255,236,39,0.5); }
.val-negative { color: #ff6b6b; }

.detail-net {
  margin: 10px 0;
  padding-top: 10px;
  border-top: 1px solid #555;
}

/* ====== 响应式 ====== */
@media (max-width: 600px) {
  .retirement-bill { padding: 18px 14px 16px; }
  .wealth-amount { font-size: 44px; }
  .wealth-amount .currency { font-size: 26px; }
  .wealth-label { font-size: 15px; letter-spacing: 4px; }
  .wealth-hero { padding: 20px 16px; }
  .banner-emoji { font-size: 52px; }
  .banner-name { font-size: 24px; }
  .banner-tagline { font-size: 14px; }
  .banner-status { min-width: 110px; }
  .status-achieved { font-size: 18px; }
  .gap-amount { font-size: 22px; }
  .gap-unit { font-size: 14px; }
  .cards-grid { gap: 8px; }
  .flip-card { height: 150px; }
  .fc-number { font-size: 30px; }
  .fc-unit { font-size: 15px; }
  .fc-emoji { font-size: 36px; }
  .fc-title { font-size: 14px; }
  .fc-joke { font-size: 16px; }
  .cards-title { font-size: 17px; }
  .cards-toggle { font-size: 14px; }
  .detail-bill { font-size: 15px; padding: 14px; }
  .detail-toggle { font-size: 16px; }
}
</style>
