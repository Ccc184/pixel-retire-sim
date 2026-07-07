<script setup lang="ts">
import { computed, ref } from 'vue'
import type { GameState } from '../../types/global.d.js'

const props = defineProps<{
  state: GameState
}>()

const s = computed(() => props.state)

// ========== 金额格式化 ==========
function fmtNum(n: number): string {
  return Math.round(n).toLocaleString('en-US')
}

function fmtMoney(n: number): string {
  return '¥' + fmtNum(n)
}

// 简洁金额（万/亿）
function fmtShort(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 100000000) return (n / 100000000).toFixed(2).replace(/\.?0+$/, '') + '亿'
  if (abs >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万'
  return fmtNum(n)
}

// ========== 收入分项 ==========
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

// ========== 支出分项 ==========
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

// ========== 退休等级 ==========
interface RankInfo {
  icon: string
  level: string
  desc: string
  monthly: number
}

const retirementRank = computed<RankInfo>(() => {
  const net = netAssets.value
  // 退休后按25年计算（60岁到85岁）
  const years = 25
  const monthly = net / years / 12

  if (net < 0) {
    return { icon: '💀', level: '还得接着搬砖', desc: '净资产为负，退休是不可能退休的', monthly: 0 }
  }
  if (net < 100000) {
    return { icon: '🥲', level: '低保边缘户', desc: `每月可花 ¥${fmtNum(Math.max(0, monthly))}，泡面自由`, monthly }
  }
  if (net < 500000) {
    return { icon: '🫡', level: '公园溜达级', desc: `每月可花 ¥${fmtNum(monthly)}，广场舞后排选手`, monthly }
  }
  if (net < 1000000) {
    return { icon: '😌', level: '菜市场自由', desc: `每月可花 ¥${fmtNum(monthly)}，买白菜不看价签`, monthly }
  }
  if (net < 3000000) {
    return { icon: '😎', level: '超市自由', desc: `每月可花 ¥${fmtNum(monthly)}，车厘子偶尔整箱买`, monthly }
  }
  if (net < 7000000) {
    return { icon: '🏆', level: '菜市场自由·遛鸟级', desc: `每月可花 ¥${fmtNum(monthly)}，海底捞不用等优惠券`, monthly }
  }
  if (net < 15000000) {
    return { icon: '👑', level: '财务半自由', desc: `每月可花 ¥${fmtNum(monthly)}，环球旅行说走就走`, monthly }
  }
  if (net < 30000000) {
    return { icon: '💎', level: '财务自由', desc: `每月可花 ¥${fmtNum(monthly)}，兴趣就是上班体验生活`, monthly }
  }
  return { icon: '🐉', level: '传说级·赛博富豪', desc: `每月可花 ¥${fmtNum(monthly)}，钱只是个数字`, monthly }
})

// ========== 趣味换算卡片 ==========
interface PowerCard {
  emoji: string
  title: string
  number: string
  unit: string
  joke: string
  cls: string
}

const powerCards = computed<PowerCard[]>(() => {
  const net = netAssets.value
  if (net <= 0) {
    return [
      { emoji: '💸', title: '你的净资产', number: '0', unit: '元', joke: '建议立刻打开招聘APP', cls: 'danger' },
      { emoji: '😭', title: '还能喝星巴克', number: '0', unit: '杯', joke: '速溶都快喝不起了', cls: 'danger' },
      { emoji: '🏃', title: '还得打工', number: '∞', unit: '年', joke: '资本家听了都落泪', cls: 'danger' },
      { emoji: '🪦', title: '退休', number: 'NO', unit: '', joke: '退休只是别人的传说', cls: 'danger' },
    ]
  }

  const cards: PowerCard[] = []

  // ☕ 星巴克：35元/杯，每天1杯
  const starbucksPerDay = 35
  const starbucksYears = Math.floor(net / starbucksPerDay / 365)
  if (starbucksYears >= 100) {
    cards.push({ emoji: '☕', title: '每天一杯星巴克', number: fmtNum(starbucksYears), unit: '年', joke: '大概能喝到人类殖民火星，店员都认识你曾孙', cls: 'orange' })
  } else if (starbucksYears >= 1) {
    cards.push({ emoji: '☕', title: '每天一杯星巴克', number: fmtNum(starbucksYears), unit: '年', joke: `喝到${60 + starbucksYears}岁，牙齿可能先黄了`, cls: 'orange' })
  } else {
    cards.push({ emoji: '☕', title: '星巴克', number: fmtNum(Math.floor(net / starbucksPerDay)), unit: '杯', joke: '喝完这杯，改喝速溶吧', cls: 'orange' })
  }

  // 🍲 海底捞：人均150元，每天一顿
  const hotpotPerMeal = 150
  const hotpotYears = Math.floor(net / hotpotPerMeal / 365)
  if (hotpotYears >= 50) {
    cards.push({ emoji: '🍲', title: '每天一顿海底捞', number: fmtNum(hotpotYears), unit: '年', joke: '店长把你照片挂墙上：VVIP祖宗', cls: 'pink' })
  } else if (hotpotYears >= 1) {
    cards.push({ emoji: '🍲', title: '每天一顿海底捞', number: fmtNum(hotpotYears), unit: '年', joke: '服务员比你子女还了解你的口味', cls: 'pink' })
  } else {
    cards.push({ emoji: '🍲', title: '海底捞', number: fmtNum(Math.floor(net / hotpotPerMeal)), unit: '顿', joke: '偶尔奢侈一下还是可以的', cls: 'pink' })
  }

  // ✈️ 环球旅行：每次约3万元
  const travelCost = 30000
  const travelTimes = Math.floor(net / travelCost)
  if (travelTimes >= 10) {
    cards.push({ emoji: '✈️', title: '环球旅行', number: fmtNum(travelTimes), unit: '次', joke: `绕地球${Math.floor(travelTimes / 4)}圈，空姐能叫出你名字`, cls: 'cyan' })
  } else if (travelTimes >= 1) {
    cards.push({ emoji: '✈️', title: '环球旅行', number: fmtNum(travelTimes), unit: '次', joke: '朋友圈摄影大赛冠军预定', cls: 'cyan' })
  } else {
    cards.push({ emoji: '✈️', title: '国内游', number: fmtNum(Math.floor(net / 3000)), unit: '次', joke: '先把国内景点打卡了再说', cls: 'cyan' })
  }

  // 🎮 手游648充值
  const game648 = 648
  const gameTimes = Math.floor(net / game648)
  if (gameTimes >= 1000) {
    cards.push({ emoji: '🎮', title: '手游648连充', number: fmtNum(gameTimes), unit: '发', joke: '全皮肤全英雄，游戏公司请你当顾问', cls: 'purple' })
  } else if (gameTimes >= 10) {
    cards.push({ emoji: '🎮', title: '手游648充值', number: fmtNum(gameTimes), unit: '发', joke: '氪金大佬，排行榜常驻选手', cls: 'purple' })
  } else {
    cards.push({ emoji: '🎮', title: '手游月卡', number: fmtNum(Math.floor(net / 30)), unit: '个月', joke: '理性消费，月卡党万岁', cls: 'purple' })
  }

  // 🐱 养猫：一辈子约15年，每年6000元 = 9万/只
  const catLifetimeCost = 90000
  const cats = Math.floor(net / catLifetimeCost)
  if (cats >= 5) {
    cards.push({ emoji: '🐱', title: '同时养猫一辈子', number: fmtNum(cats), unit: '世', joke: '猫主子排队等你翻牌子，猫砂盆能堆成山', cls: 'pink2' })
  } else if (cats >= 1) {
    cards.push({ emoji: '🐱', title: '养猫一辈子', number: fmtNum(cats), unit: '只', joke: '猫会把你送走（真的）', cls: 'pink2' })
  } else {
    cards.push({ emoji: '🐱', title: '云吸猫', number: '∞', unit: '', joke: 'B站猫片随便看，还不用铲屎', cls: 'pink2' })
  }

  // 🏥 大病医疗：50万/次
  const medicalCost = 500000
  const medicalTimes = Math.floor(net / medicalCost)
  if (medicalTimes >= 3) {
    cards.push({ emoji: '🏥', title: '大病医疗储备', number: fmtNum(medicalTimes), unit: '次', joke: '别浪，健康才是最大的财富', cls: 'yellow' })
  } else if (medicalTimes >= 1) {
    cards.push({ emoji: '🏥', title: '大病医疗储备', number: fmtNum(medicalTimes), unit: '次', joke: '勉强够一次，记得买保险！', cls: 'yellow' })
  } else {
    cards.push({ emoji: '🏥', title: '大病医疗储备', number: '不足', unit: '', joke: '这...建议赶紧买保险+锻炼身体', cls: 'yellow' })
  }

  // 🍺 啤酒+烤串：每晚60元
  const beerCost = 60
  const beerYears = Math.floor(net / beerCost / 365)
  if (beerYears >= 100) {
    cards.push({ emoji: '🍺', title: '每晚啤酒烤串', number: fmtNum(beerYears), unit: '年', joke: '签子串起来能绕地球两圈半', cls: 'green' })
  } else if (beerYears >= 1) {
    cards.push({ emoji: '🍺', title: '每晚啤酒烤串', number: fmtNum(beerYears), unit: '年', joke: '痛风可能比你先到，注意身体', cls: 'green' })
  } else {
    cards.push({ emoji: '🍺', title: '啤酒烤串', number: fmtNum(Math.floor(net / beerCost)), unit: '晚', joke: '偶尔放纵一下，别天天喝', cls: 'green' })
  }

  // 🚗 买车：特斯拉Model 3约23万
  const carCost = 230000
  const cars = Math.floor(net / carCost)
  if (cars >= 3) {
    cards.push({ emoji: '🚗', title: '买特斯拉Model 3', number: fmtNum(cars), unit: '辆', joke: '一天换一辆，一个月不重样，停车是个问题', cls: 'cyan2' })
  } else if (cars >= 1) {
    cards.push({ emoji: '🚗', title: '买特斯拉Model 3', number: fmtNum(cars), unit: '辆', joke: '恭喜有车一族，记得充电', cls: 'cyan2' })
  } else {
    cards.push({ emoji: '🚲', title: '买电动车', number: fmtNum(Math.floor(net / 3000)), unit: '辆', joke: '绿色出行，还能锻炼身体', cls: 'cyan2' })
  }

  return cards
})

// ========== 底部金句 ==========
const footerQuote = computed(() => {
  const net = rawNetAssets.value
  if (net < 0) return '"钱不是万能的，但没有钱是万万不能的。打工去吧少年。"'
  if (net < 100000) return '"钱少有钱少的活法，健康开心最重要。（说这话的人一般有钱）"'
  if (net < 1000000) return '"够吃够喝够养老，广场舞C位等你。"'
  if (net < 7000000) return '"钱是人的胆，也是退休的腰板。700万不多，但够你把广场舞跳成个人演唱会。"'
  if (net < 15000000) return '"财务半自由的你，可以开始思考人生的意义了。"'
  return '"你赢了。请记得多做慈善，让世界更美好。"'
})

// 展开/收起账单
const showDetail = ref(false)
</script>

<template>
  <div class="retirement-bill">
    <!-- 扫描线效果 -->
    <div class="scanlines" />

    <!-- 顶部标题 -->
    <div class="bill-header">
      <div class="header-label">◆ RETIREMENT PURCHASING POWER ◆</div>
      <div class="header-title">这笔钱能让你...</div>
    </div>

    <!-- 净资产大数字 -->
    <div class="wealth-display" :class="{ 'negative': isNegative }">
      <div class="wealth-label">你的退休净资产</div>
      <div class="wealth-amount">
        <span class="currency">¥</span>{{ isNegative ? '0' : fmtNum(rawNetAssets) }}
      </div>
      <div v-if="isNegative" class="wealth-debt">（实际负债 {{ fmtMoney(Math.abs(rawNetAssets)) }}）</div>
    </div>

    <!-- 退休等级徽章 -->
    <div class="rank-badge">
      <span class="rank-icon">{{ retirementRank.icon }}</span>
      <div class="rank-text">
        <div class="rank-level">{{ retirementRank.level }}</div>
        <div class="rank-desc">{{ retirementRank.desc }}</div>
      </div>
    </div>

    <!-- 分隔线 -->
    <div class="divider">
      <div class="divider-line" />
      <div class="divider-text">▸ 购买力换算 ◂</div>
      <div class="divider-line" />
    </div>

    <!-- 换算卡片网格 -->
    <div class="power-grid">
      <div
        v-for="(card, idx) in powerCards"
        :key="idx"
        class="power-card"
        :class="'card-' + card.cls"
      >
        <div class="card-top">
          <span class="card-emoji">{{ card.emoji }}</span>
          <span class="card-title">{{ card.title }}</span>
        </div>
        <div class="card-number">
          {{ card.number }}<span v-if="card.unit" class="unit"> {{ card.unit }}</span>
        </div>
        <div class="card-joke">{{ card.joke }}<span class="blink">_</span></div>
      </div>
    </div>

    <!-- 底部金句 -->
    <div class="footer-quote">{{ footerQuote }}</div>

    <!-- 详细账单切换 -->
    <div class="detail-toggle" @click="showDetail = !showDetail">
      <span class="toggle-arrow">{{ showDetail ? '▼' : '▶' }}</span>
      {{ showDetail ? '收起明细账单' : '查看收支明细' }}
      <span class="toggle-arrow">{{ showDetail ? '▼' : '▶' }}</span>
    </div>

    <!-- 详细账单（展开后显示） -->
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

      <div class="detail-footer">
        <span>** 人生有限责任 · 数据仅供娱乐 **</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.retirement-bill {
  position: relative;
  background: #0a0518;
  background-image:
    radial-gradient(ellipse at 20% 0%, rgba(201, 0, 255, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(0, 212, 255, 0.1) 0%, transparent 50%);
  border: 2px solid #c900ff;
  border-radius: 4px;
  padding: 18px 16px 14px;
  font-family: 'DotGothic16', 'Courier New', monospace;
  color: #f0e6ff;
  box-shadow:
    0 0 20px rgba(201, 0, 255, 0.35),
    inset 0 0 30px rgba(201, 0, 255, 0.04);
  overflow-y: auto;
  max-height: 80vh;
}

/* 扫描线 */
.scanlines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px,
    transparent 2px,
    rgba(0, 0, 0, 0.12) 2px,
    rgba(0, 0, 0, 0.12) 4px
  );
  z-index: 10;
  border-radius: 2px;
}

/* 内容层级 */
.retirement-bill > * {
  position: relative;
  z-index: 2;
}

/* ====== 标题 ====== */
.bill-header {
  text-align: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px dashed rgba(0, 212, 255, 0.3);
}

.header-label {
  font-size: 10px;
  color: #00d4ff;
  letter-spacing: 3px;
  text-shadow: 0 0 8px #00d4ff;
  margin-bottom: 6px;
}

.header-title {
  font-size: 18px;
  font-weight: bold;
  color: #ff2d95;
  letter-spacing: 3px;
  text-shadow:
    0 0 8px #ff2d95,
    0 0 20px #ff2d95,
    0 0 40px rgba(255, 45, 149, 0.4);
  animation: titlePulse 2.5s ease-in-out infinite;
}

@keyframes titlePulse {
  0%, 100% { text-shadow: 0 0 8px #ff2d95, 0 0 20px #ff2d95; }
  50% { text-shadow: 0 0 12px #ff2d95, 0 0 30px #ff2d95, 0 0 50px rgba(255,45,149,0.6); }
}

/* ====== 净资产大字 ====== */
.wealth-display {
  text-align: center;
  margin: 12px 0;
  padding: 12px;
  background: linear-gradient(135deg, rgba(0,255,136,0.07), rgba(255,236,39,0.07));
  border: 2px solid #00ff88;
  border-radius: 3px;
  box-shadow:
    0 0 10px rgba(0,255,136,0.25),
    inset 0 0 16px rgba(0,255,136,0.04);
}

.wealth-display.negative {
  background: linear-gradient(135deg, rgba(255,0,77,0.08), rgba(255,45,149,0.08));
  border-color: #ff004d;
  box-shadow: 0 0 10px rgba(255,0,77,0.25), inset 0 0 16px rgba(255,0,77,0.04);
}

.wealth-label {
  font-size: 10px;
  color: #8a7aaa;
  letter-spacing: 2px;
  margin-bottom: 4px;
}

.wealth-amount {
  font-size: 28px;
  font-weight: bold;
  color: #ffec27;
  text-shadow:
    0 0 10px #ffec27,
    0 0 25px rgba(255,236,39,0.5);
  letter-spacing: 2px;
  line-height: 1.2;
}

.wealth-amount .currency {
  font-size: 18px;
  color: #00ff88;
  text-shadow: 0 0 8px #00ff88;
}

.wealth-display.negative .wealth-amount {
  color: #ff004d;
  text-shadow: 0 0 10px #ff004d, 0 0 25px rgba(255,0,77,0.5);
}

.wealth-display.negative .currency {
  color: #ff2d95;
  text-shadow: 0 0 8px #ff2d95;
}

.wealth-debt {
  font-size: 10px;
  color: #ff6b6b;
  margin-top: 4px;
}

/* ====== 退休等级徽章 ====== */
.rank-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 10px 0;
  padding: 8px 14px;
  background: rgba(201, 0, 255, 0.08);
  border: 1px solid #c900ff;
  border-radius: 2px;
}

.rank-icon { font-size: 24px; flex-shrink: 0; filter: drop-shadow(0 0 4px rgba(201,0,255,0.5)); }

.rank-text { text-align: left; }

.rank-level {
  font-size: 13px;
  color: #c900ff;
  font-weight: bold;
  text-shadow: 0 0 6px #c900ff;
  letter-spacing: 1px;
}

.rank-desc {
  font-size: 9px;
  color: #8a7aaa;
  margin-top: 2px;
  letter-spacing: 0.3px;
}

/* ====== 分隔线 ====== */
.divider {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 14px 0 10px;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, #00d4ff, transparent);
}

.divider-text {
  font-size: 9px;
  color: #00d4ff;
  letter-spacing: 2px;
  text-shadow: 0 0 6px #00d4ff;
  white-space: nowrap;
}

/* ====== 换算卡片网格 ====== */
.power-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 7px;
}

.power-card {
  background: rgba(15, 8, 35, 0.8);
  border: 1px solid;
  border-radius: 3px;
  padding: 8px;
  position: relative;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.power-card:hover {
  transform: translateY(-2px);
}

.card-orange { border-color: #ff8800; box-shadow: 0 0 6px rgba(255,136,0,0.2); }
.card-pink { border-color: #ff2d95; box-shadow: 0 0 6px rgba(255,45,149,0.2); }
.card-cyan { border-color: #00d4ff; box-shadow: 0 0 6px rgba(0,212,255,0.2); }
.card-purple { border-color: #c900ff; box-shadow: 0 0 6px rgba(201,0,255,0.2); }
.card-pink2 { border-color: #ff2d95; box-shadow: 0 0 6px rgba(255,45,149,0.2); }
.card-yellow { border-color: #ffec27; box-shadow: 0 0 6px rgba(255,236,39,0.2); }
.card-green { border-color: #00ff88; box-shadow: 0 0 6px rgba(0,255,136,0.2); }
.card-cyan2 { border-color: #00d4ff; box-shadow: 0 0 6px rgba(0,212,255,0.2); }
.card-danger { border-color: #ff004d; box-shadow: 0 0 6px rgba(255,0,77,0.2); }

.card-orange:hover { box-shadow: 0 0 12px rgba(255,136,0,0.4), 0 2px 8px rgba(0,0,0,0.3); }
.card-pink:hover { box-shadow: 0 0 12px rgba(255,45,149,0.4), 0 2px 8px rgba(0,0,0,0.3); }
.card-cyan:hover { box-shadow: 0 0 12px rgba(0,212,255,0.4), 0 2px 8px rgba(0,0,0,0.3); }
.card-purple:hover { box-shadow: 0 0 12px rgba(201,0,255,0.4), 0 2px 8px rgba(0,0,0,0.3); }
.card-pink2:hover { box-shadow: 0 0 12px rgba(255,45,149,0.4), 0 2px 8px rgba(0,0,0,0.3); }
.card-yellow:hover { box-shadow: 0 0 12px rgba(255,236,39,0.4), 0 2px 8px rgba(0,0,0,0.3); }
.card-green:hover { box-shadow: 0 0 12px rgba(0,255,136,0.4), 0 2px 8px rgba(0,0,0,0.3); }
.card-cyan2:hover { box-shadow: 0 0 12px rgba(0,212,255,0.4), 0 2px 8px rgba(0,0,0,0.3); }
.card-danger:hover { box-shadow: 0 0 12px rgba(255,0,77,0.4), 0 2px 8px rgba(0,0,0,0.3); }

.card-top {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.card-emoji {
  font-size: 18px;
  flex-shrink: 0;
  line-height: 1;
}

.card-title {
  font-size: 10px;
  color: #8a7aaa;
  letter-spacing: 0.3px;
  line-height: 1.2;
}

.card-number {
  font-size: 18px;
  font-weight: bold;
  line-height: 1.1;
  letter-spacing: 1px;
}

.card-number .unit {
  font-size: 10px;
  font-weight: normal;
  opacity: 0.8;
}

.card-orange .card-number { color: #ff8800; text-shadow: 0 0 8px rgba(255,136,0,0.5); }
.card-pink .card-number { color: #ff2d95; text-shadow: 0 0 8px rgba(255,45,149,0.5); }
.card-cyan .card-number { color: #00d4ff; text-shadow: 0 0 8px rgba(0,212,255,0.5); }
.card-purple .card-number { color: #c900ff; text-shadow: 0 0 8px rgba(201,0,255,0.5); }
.card-pink2 .card-number { color: #ff2d95; text-shadow: 0 0 8px rgba(255,45,149,0.5); }
.card-yellow .card-number { color: #ffec27; text-shadow: 0 0 8px rgba(255,236,39,0.5); }
.card-green .card-number { color: #00ff88; text-shadow: 0 0 8px rgba(0,255,136,0.5); }
.card-cyan2 .card-number { color: #00d4ff; text-shadow: 0 0 8px rgba(0,212,255,0.5); }
.card-danger .card-number { color: #ff004d; text-shadow: 0 0 8px rgba(255,0,77,0.5); }

.card-joke {
  font-size: 8px;
  color: #6a5a8a;
  margin-top: 4px;
  line-height: 1.4;
  font-style: italic;
}

.blink {
  animation: blink 1.2s step-end infinite;
  color: #ff2d95;
  font-style: normal;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* ====== 底部金句 ====== */
.footer-quote {
  margin-top: 12px;
  padding: 8px 10px;
  text-align: center;
  background: rgba(0,0,0,0.25);
  border-left: 3px solid #ff2d95;
  border-right: 3px solid #ff2d95;
  font-size: 10px;
  color: #ff2d95;
  line-height: 1.6;
  text-shadow: 0 0 4px rgba(255,45,149,0.35);
  letter-spacing: 0.3px;
}

/* ====== 详细账单切换 ====== */
.detail-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px;
  background: rgba(0,212,255,0.06);
  border: 1px dashed rgba(0,212,255,0.3);
  color: #00d4ff;
  font-size: 11px;
  letter-spacing: 1px;
  cursor: pointer;
  text-shadow: 0 0 4px rgba(0,212,255,0.4);
  transition: all 0.2s;
  user-select: none;
}

.detail-toggle:hover {
  background: rgba(0,212,255,0.12);
  border-color: #00d4ff;
  box-shadow: 0 0 8px rgba(0,212,255,0.2);
}

.toggle-arrow {
  font-size: 9px;
  opacity: 0.7;
  animation: arrowPulse 1s ease-in-out infinite;
}

@keyframes arrowPulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

/* ====== 详细账单（旧账单样式） ====== */
.detail-bill {
  margin-top: 10px;
  padding: 12px;
  background: #050505;
  border: 1px dashed #333;
  font-family: 'Courier New', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.8;
  color: #b0ffb0;
  box-shadow: inset 0 0 16px rgba(0,0,0,0.8);
}

.detail-section {
  margin-bottom: 4px;
}

.detail-row {
  display: flex;
  align-items: baseline;
  width: 100%;
}

.detail-total {
  font-weight: bold;
  color: #ffffff;
}

.detail-sub {
  padding-left: 8px;
  color: #b0ffb0;
}

.detail-net-row {
  font-weight: bold;
  font-size: 13px;
  padding: 4px 0;
}

.detail-label { white-space: nowrap; flex-shrink: 0; }

.detail-dots {
  flex: 1;
  border-bottom: 1px dotted #444;
  margin: 0 6px 3px;
  min-width: 20px;
}

.detail-val { white-space: nowrap; text-align: right; flex-shrink: 0; }
.val-income { color: #00ff88; }
.val-expense { color: #ff8800; }
.val-net { color: #ffec27; text-shadow: 0 0 4px rgba(255,236,39,0.4); }
.val-negative { color: #ff6b6b; }

.detail-net {
  margin: 6px 0;
  padding-top: 6px;
  border-top: 1px solid #444;
}

.detail-footer {
  text-align: center;
  color: #555;
  font-size: 10px;
  letter-spacing: 1px;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed #333;
}

/* ====== 响应式 ====== */
@media (max-width: 520px) {
  .retirement-bill { padding: 14px 10px 10px; }
  .header-title { font-size: 15px; letter-spacing: 2px; }
  .wealth-amount { font-size: 22px; }
  .card-number { font-size: 15px; }
  .card-title { font-size: 9px; }
  .card-joke { font-size: 7px; }
  .power-grid { gap: 5px; }
  .power-card { padding: 6px; }
  .detail-bill { font-size: 11px; padding: 10px; }
}
</style>
