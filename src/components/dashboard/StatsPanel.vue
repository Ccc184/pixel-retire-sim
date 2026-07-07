<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useGameStore } from '../../store/game.store.js';

const store = useGameStore();
const s = store.state;

// 年度变化值（简化弹跳动画）
const savingsDelta = ref(0);
const showDelta = ref(false);

watch(
  () => s.currentSavings,
  (v, oldV) => {
    if (oldV !== undefined && v !== oldV) {
      savingsDelta.value = v - oldV;
      showDelta.value = true;
      setTimeout(() => { showDelta.value = false; }, 1200);
    }
  },
);

// 数字格式化：¥xxx,xxx
function formatMoney(n: number): string {
  const v = Math.round(n);
  if (v < 0) return '-¥' + Math.abs(v).toLocaleString('en-US');
  return '¥' + v.toLocaleString('en-US');
}

function formatMoneyWan(n: number): string {
  const v = Math.round(n / 10000);
  if (v < 0) return '-¥' + Math.abs(v) + '万';
  return '¥' + v + '万';
}

// ================================================================
//  核心指标
// ================================================================
const isBankrupt = computed(() => s.currentSavings < 0);

const yearsToRetire = computed(() => Math.max(0, s.targetAge - s.currentAge));

const annualIncome = computed(() => {
  if (s.isUnemployed) return s.passiveIncome;
  return s.currentMonthlySalary * 12 + s.passiveIncome;
});

const annualExpense = computed(() =>
  s.annualBaseCost + s.currentMortgageCost + s.insurancePremium,
);

// ================================================================
//  身心状态
// ================================================================
const stressLevel = computed(() => s.stress ?? 30);
const happinessLevel = computed(() => s.happiness ?? 60);
const healthLevel = computed(() => s.health ?? 80);

function healthEmoji(val: number): string {
  if (val >= 70) return '🟢';
  if (val >= 50) return '🟡';
  if (val >= 30) return '🟠';
  return '🔴';
}

function stressEmoji(val: number): string {
  if (val >= 70) return '🔴';
  if (val >= 40) return '🟡';
  return '🟢';
}

function happinessEmoji(val: number): string {
  if (val >= 70) return '😊';
  if (val >= 40) return '😐';
  return '😔';
}

function barColor(val: number, type: 'health' | 'stress' | 'happiness'): string {
  if (type === 'health') {
    if (val >= 70) return '#00ff88';
    if (val >= 40) return '#ff8800';
    return '#ff2d95';
  }
  if (type === 'stress') {
    if (val >= 70) return '#ff2d95';
    if (val >= 40) return '#ff8800';
    return '#00ff88';
  }
  // happiness
  if (val >= 70) return '#00ff88';
  if (val >= 40) return '#ffec27';
  return '#ff2d95';
}



// ================================================================
//  人际关系面板
// ================================================================
const parents = computed(() => s.parents);
const parentsAlive = computed(() => parents.value?.isAlive ?? false);
const partner = computed(() => s.partner);
const hasPartner = computed(() => !!partner.value);
const isDivorced = computed(() => partner.value?.hasDivorced === true);
const children = computed(() => s.children ?? []);
const friends = computed(() => s.friends ?? []);

// 恋爱状态
const romanceStatus = computed(() => {
  const p = partner.value;
  if (!p || p.datingStage === 'single') {
    return { emoji: '🖤', label: '单身' };
  }
  if (p.datingStage === 'divorced' || p.hasDivorced) {
    return { emoji: '💔', label: '离异' };
  }
  switch (p.datingStage) {
    case 'crush': return { emoji: '😳', label: '暧昧中' };
    case 'dating': return { emoji: '💕', label: '约会中' };
    case 'serious': return { emoji: '💑', label: '恋爱中' };
    case 'married': return { emoji: '💍', label: '已婚' };
    default: return { emoji: '❤️', label: '有对象' };
  }
});

function getRelationLabel(val: number): string {
  if (val >= 80) return '亲密';
  if (val >= 60) return '不错';
  if (val >= 40) return '一般';
  if (val >= 20) return '冷淡';
  return '疏远';
}

function getAcademicLabel(val: number): string {
  if (val >= 80) return '优秀';
  if (val >= 60) return '良好';
  if (val >= 40) return '一般';
  return '较差';
}

const relSummary = computed(() => {
  const parts: string[] = [];
  if (parentsAlive.value) parts.push('父母健在');
  else if (parents.value) parts.push('父母已故');
  if (hasPartner.value && !isDivorced.value) {
    if (partner.value!.datingStage === 'married') parts.push('已婚');
    else if (partner.value!.datingStage === 'serious') parts.push('热恋');
    else if (partner.value!.datingStage === 'dating') parts.push('约会中');
    else if (partner.value!.datingStage === 'crush') parts.push('暧昧中');
    else parts.push('有对象');
  }
  else if (isDivorced.value) parts.push('离异');
  if (children.value.length > 0) parts.push(`${children.value.length}子`);
  if (friends.value.length > 0) parts.push(`${friends.value.length}友`);
  return parts.length > 0 ? parts.join(' · ') : '孤身一人';
});

// ================================================================
//  理财状态面板
// ================================================================
const financeOpen = ref(false)

interface FinanceChannel {
  icon: string
  name: string
  pct: number
  color: string
  rate: string  // 收益率说明
  active: boolean
}

const depositChannels = computed<FinanceChannel[]>(() => {
  const v = s
  return [
    { icon: '🏦', name: '余额宝', pct: v.bankDepositPct, color: '#00d4ff', rate: '1.5%', active: v.bankDepositPct > 0 },
    { icon: '📋', name: '定期', pct: (v as any).fixedDepositPct || 0, color: '#00ff88', rate: '3.0%', active: ((v as any).fixedDepositPct || 0) > 0 },
    { icon: '📊', name: '基金', pct: v.indexFundPct, color: '#ffec27', rate: '波动', active: v.indexFundPct > 0 },
    { icon: '📈', name: '股票', pct: (v as any).stockPct || 0, color: '#ff2d95', rate: '极高', active: ((v as any).stockPct || 0) > 0 },
    { icon: '🥇', name: '黄金', pct: (v as any).goldPct || 0, color: '#ffd700', rate: '避险', active: ((v as any).goldPct || 0) > 0 },
    { icon: '₿', name: '比特币', pct: v.speculationPct, color: '#ff8800', rate: '疯狂', active: v.speculationPct > 0 },
  ].filter(c => c.active)
})

const assetItems = computed<{ icon: string; name: string; value: number; active: boolean }[]>(() => {
  const v = s
  return [
    { icon: '🏠', name: '自住房', value: v.propertyValue, active: v.hasProperty },
    { icon: '🏪', name: '商铺', value: (v as any).shopValue || 0, active: !!(v as any).hasShop },
    { icon: '🚗', name: '汽车', value: v.hasCar ? 80000 : 0, active: v.hasCar },
  ].filter(a => a.active)
})

const totalAssetValue = computed(() => assetItems.value.reduce((sum, a) => sum + a.value, 0))

function formatWan(n: number): string {
  const v = Math.round(n)
  if (v >= 10000) return (v / 10000).toFixed(1).replace(/\.0$/, '') + '万'
  return v.toLocaleString('en-US')
}

// ================================================================
//  身心变化来源提示（悬停显示）
// ================================================================
const wbHover = ref<string | null>(null)

interface WBSource {
  source: string
  val: number
}

const wellbeingSources = computed(() => {
  const r = (store as any).lastYearResult as any
  if (!r) return { health: [] as WBSource[], stress: [] as WBSource[], happiness: [] as WBSource[] }
  
  const healthSrc: WBSource[] = []
  const stressSrc: WBSource[] = []
  const happinessSrc: WBSource[] = []
  
  // 来源名称映射
  const sourceNames: Record<string, string> = {
    cards: '卡片决策',
    relationships: '人际关系',
    naturalDrift: '岁月流逝',
    blackSwan: '突发事件',
    echoes: '连锁反应',
    blindBoxes: '盲盒揭晓',
  }
  
  const wbChanges = r.wellbeingChanges || []
  for (const ch of wbChanges) {
    const name = sourceNames[ch.source] || ch.source
    if (ch.health !== 0) healthSrc.push({ source: name, val: Math.round(ch.health) })
    if (ch.stress !== 0) stressSrc.push({ source: name, val: Math.round(ch.stress) })
    if (ch.happiness !== 0) happinessSrc.push({ source: name, val: Math.round(ch.happiness) })
  }
  
  return { health: healthSrc, stress: stressSrc, happiness: happinessSrc }
})

function formatDelta(n: number): string {
  if (n > 0) return '+' + n
  return String(n)
}

// ================================================================
//  折叠区控制
// ================================================================
const relOpen = ref(false);
</script>

<template>
  <div class="stats-panel pixel-panel">
    <!-- 顶部：第X岁 -->
    <div class="age-header">
      <span class="age-deco left">◢</span>
      <h2 class="age-title">第{{ s.currentAge }}岁</h2>
      <span class="age-deco right">◤</span>
    </div>

    <!-- 核心3指标 -->
    <div class="core-stats">
      <!-- 存款 -->
      <div class="core-row savings-row" :class="{ bankrupt: isBankrupt }">
        <span class="core-icon">💰</span>
        <span class="core-label">存款</span>
        <span class="core-value" :class="isBankrupt ? 'text-red' : 'text-green'">
          {{ formatMoney(s.currentSavings) }}
        </span>
        <span
          v-if="showDelta && savingsDelta !== 0"
          class="delta-badge"
          :class="savingsDelta > 0 ? 'delta-up' : 'delta-down'"
        >
          {{ savingsDelta > 0 ? '+' : '' }}{{ formatMoney(savingsDelta) }}
        </span>
      </div>

      <!-- 年收入 -->
      <div class="core-row">
        <span class="core-icon">📈</span>
        <span class="core-label">年收入</span>
        <span class="core-value text-blue">{{ formatMoney(annualIncome) }}</span>
      </div>

      <!-- 年支出 -->
      <div class="core-row">
        <span class="core-icon">📉</span>
        <span class="core-label">年支出</span>
        <span class="core-value text-orange">{{ formatMoney(annualExpense) }}</span>
      </div>
    </div>

    <!-- 退休信息 -->
    <div class="retire-info">
      <span>距退休：{{ yearsToRetire }}年</span>
      <span class="retire-divider">│</span>
      <span>目标：{{ formatMoneyWan(s.targetWealth) }}</span>
    </div>

    <!-- 理财状态栏（常驻） -->
    <div class="finance-status-section">
      <!-- 存款分布（始终显示） -->
      <div class="finance-mini">
        <div class="finance-mini-title">💰 存款分布</div>
        <div class="finance-bar-row">
          <div
            v-for="(ch, ci) in depositChannels"
            :key="'dc-' + ci"
            class="finance-bar-seg"
            :style="{ width: ch.pct + '%', background: ch.color }"
            :title="ch.name + ' ' + ch.pct + '%'"
          />
        </div>
        <div class="finance-chip-row">
          <span
            v-for="(ch, ci) in depositChannels"
            :key="'dcl-' + ci"
            class="finance-chip"
            :style="{ color: ch.color, borderColor: ch.color }"
          >{{ ch.icon }}{{ ch.name }}{{ ch.pct }}%</span>
        </div>
      </div>

      <!-- 资产分布 -->
      <button v-if="assetItems.length > 0" class="collapse-header asset-collapse" type="button" @click="financeOpen = !financeOpen">
        <span class="collapse-arrow" :class="{ rotated: financeOpen }">▼</span>
        <span class="collapse-title">🏠 资产 ¥{{ formatWan(totalAssetValue) }}</span>
      </button>
      <div v-if="financeOpen && assetItems.length > 0" class="collapse-body asset-body open">
        <div v-for="(a, ai) in assetItems" :key="'asset-' + ai" class="asset-row">
          <span class="asset-icon">{{ a.icon }}</span>
          <span class="asset-name">{{ a.name }}</span>
          <span class="asset-value">{{ formatWan(a.value) }}</span>
        </div>
      </div>
    </div>

    <!-- 身心状态条 -->
    <div class="wellbeing-section">
      <div
        class="wb-row"
        @mouseenter="wbHover = 'health'"
        @mouseleave="wbHover = null"
      >
        <span class="wb-label">健康</span>
        <div class="wb-track">
          <div
            class="wb-fill"
            :style="{
              width: Math.max(0, Math.min(100, healthLevel)) + '%',
              background: barColor(healthLevel, 'health'),
            }"
          />
        </div>
        <span class="wb-value" :style="{ color: barColor(healthLevel, 'health') }">
          {{ Math.round(healthLevel) }}
        </span>
        <span class="wb-emoji">{{ healthEmoji(healthLevel) }}</span>
        <Transition name="wb-tip">
          <div v-if="wbHover === 'health' && wellbeingSources.health.length > 0" class="wb-tooltip">
            <div class="wb-tip-title">上年健康变化来源</div>
            <div v-for="(src, si) in wellbeingSources.health" :key="'hh-' + si" class="wb-tip-row">
              <span class="wb-tip-src">{{ src.source }}</span>
              <span class="wb-tip-val" :class="src.val > 0 ? 'pos' : 'neg'">{{ formatDelta(src.val) }}</span>
            </div>
          </div>
        </Transition>
      </div>

      <div
        class="wb-row"
        @mouseenter="wbHover = 'stress'"
        @mouseleave="wbHover = null"
      >
        <span class="wb-label">压力</span>
        <div class="wb-track">
          <div
            class="wb-fill"
            :style="{
              width: Math.max(0, Math.min(100, stressLevel)) + '%',
              background: barColor(stressLevel, 'stress'),
            }"
          />
        </div>
        <span class="wb-value" :style="{ color: barColor(stressLevel, 'stress') }">
          {{ Math.round(stressLevel) }}
        </span>
        <span class="wb-emoji">{{ stressEmoji(stressLevel) }}</span>
        <Transition name="wb-tip">
          <div v-if="wbHover === 'stress' && wellbeingSources.stress.length > 0" class="wb-tooltip">
            <div class="wb-tip-title">上年压力变化来源</div>
            <div v-for="(src, si) in wellbeingSources.stress" :key="'ss-' + si" class="wb-tip-row">
              <span class="wb-tip-src">{{ src.source }}</span>
              <span class="wb-tip-val" :class="src.val > 0 ? 'neg' : 'pos'">{{ formatDelta(src.val) }}</span>
            </div>
          </div>
        </Transition>
      </div>

      <div
        class="wb-row"
        @mouseenter="wbHover = 'happiness'"
        @mouseleave="wbHover = null"
      >
        <span class="wb-label">幸福</span>
        <div class="wb-track">
          <div
            class="wb-fill"
            :style="{
              width: Math.max(0, Math.min(100, happinessLevel)) + '%',
              background: barColor(happinessLevel, 'happiness'),
            }"
          />
        </div>
        <span class="wb-value" :style="{ color: barColor(happinessLevel, 'happiness') }">
          {{ Math.round(happinessLevel) }}
        </span>
        <span class="wb-emoji">{{ happinessEmoji(happinessLevel) }}</span>
        <Transition name="wb-tip">
          <div v-if="wbHover === 'happiness' && wellbeingSources.happiness.length > 0" class="wb-tooltip">
            <div class="wb-tip-title">上年幸福变化来源</div>
            <div v-for="(src, si) in wellbeingSources.happiness" :key="'sh-' + si" class="wb-tip-row">
              <span class="wb-tip-src">{{ src.source }}</span>
              <span class="wb-tip-val" :class="src.val > 0 ? 'pos' : 'neg'">{{ formatDelta(src.val) }}</span>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- 职业+城市标签 -->
    <div class="badge-row">
      <div class="neon-badge badge-profession" :class="{ 'badge-unemployed': s.isUnemployed }">
        <span class="badge-icon">{{ s.isUnemployed ? '🔍' : '💼' }}</span>
        <span class="badge-text">{{ s.isUnemployed ? '待业中' : s.currentProfession }}</span>
      </div>
      <div class="neon-badge badge-city">
        <span class="badge-icon">📍</span>
        <span class="badge-text">{{ s.currentCity }}</span>
      </div>
    </div>

    <!-- 折叠区：人际关系 -->
    <div class="collapse-section">
      <button class="collapse-header" type="button" @click="relOpen = !relOpen">
        <span class="collapse-arrow" :class="{ rotated: relOpen }">▼</span>
        <span class="collapse-title">人际关系</span>
        <span class="collapse-summary">{{ relSummary }}</span>
      </button>
      <div class="collapse-body" :class="{ open: relOpen }">
        <!-- 父母 -->
        <div class="rel-group">
          <div class="rel-group-label">👴 父母</div>
          <div v-if="parents && parentsAlive" class="rel-detail">
            <div class="rel-detail-row">
              <span class="rel-key">健康</span>
              <div class="rel-bar-track">
                <div
                  class="rel-bar-fill"
                  :style="{
                    width: Math.max(0, Math.min(100, parents.health)) + '%',
                    background: parents.health < 30 ? '#ff2d95' : parents.health < 60 ? '#ff8800' : '#00ff88',
                  }"
                />
              </div>
              <span class="rel-val">{{ parents.health }}</span>
            </div>
            <div class="rel-detail-row">
              <span class="rel-key">关系</span>
              <div class="rel-bar-track">
                <div
                  class="rel-bar-fill"
                  :style="{ width: Math.max(0, Math.min(100, parents.relationShip)) + '%', background: '#ff2d95' }"
                />
              </div>
              <span class="rel-val">{{ parents.relationShip }}</span>
              <span class="rel-tag">{{ getRelationLabel(parents.relationShip) }}</span>
            </div>
            <div class="rel-detail-row">
              <span class="rel-key">年龄</span>
              <span class="rel-age-text">{{ parents.age }}岁</span>
            </div>
          </div>
          <div v-else-if="parents" class="rel-deceased">
            ✝ 已故 · 享年{{ parents.age || '??' }}岁
          </div>
          <div v-else class="rel-na">— 暂无数据 —</div>
        </div>

        <!-- 伴侣/恋爱 -->
        <div class="rel-group">
          <div class="rel-group-label">{{ romanceStatus.emoji }} {{ romanceStatus.label }}</div>
          <!-- 有对象（暧昧/约会/恋爱/已婚） -->
          <div v-if="hasPartner && !isDivorced && partner!.datingStage !== 'single'" class="rel-detail">
            <div class="partner-name-row">
              <span class="partner-name">{{ partner!.name }}</span>
              <span v-if="partner!.personality" class="personality-tag">{{ partner!.personality }}</span>
            </div>
            <div v-if="partner!.trait" class="partner-trait">「{{ partner!.trait }}」</div>
            <div class="rel-detail-row">
              <span class="rel-key">感情</span>
              <div class="rel-bar-track">
                <div
                  class="rel-bar-fill"
                  :style="{ width: Math.max(0, Math.min(100, partner!.affection)) + '%', background: '#ff2d95' }"
                />
              </div>
              <span class="rel-val">{{ partner!.affection }}</span>
            </div>
            <div class="rel-detail-row">
              <span class="rel-key">信任</span>
              <div class="rel-bar-track">
                <div
                  class="rel-bar-fill"
                  :style="{ width: Math.max(0, Math.min(100, partner!.trust)) + '%', background: '#c900ff' }"
                />
              </div>
              <span class="rel-val">{{ partner!.trust }}</span>
            </div>
            <div v-if="partner!.datingStage === 'married'" class="rel-detail-row">
              <span class="rel-key">婚龄</span>
              <span class="rel-age-text">{{ s.currentAge - (partner!.marriedYear || 0) }}年</span>
            </div>
            <div v-else class="rel-detail-row">
              <span class="rel-key">相识</span>
              <span class="rel-age-text">{{ s.currentAge - (partner!.meetYear || s.currentAge) }}年</span>
            </div>
            <!-- 回忆标签（最近3条） -->
            <div v-if="partner!.memories && partner!.memories.length > 0" class="memories-row">
              <span
                v-for="(mem, mi) in partner!.memories.slice(-3)"
                :key="'mem-' + mi"
                class="memory-tag"
                :title="mem.event"
              >{{ mem.emoji }}</span>
            </div>
          </div>
          <!-- 离异 -->
          <div v-else-if="isDivorced || partner?.datingStage === 'divorced'" class="rel-deceased divorced">
            💔 {{ partner?.exName ? '与' + partner.exName + '分开了' : '已离异' }}
          </div>
          <!-- 单身 -->
          <div v-else class="rel-na">— 单身中 —</div>
        </div>

        <!-- 子女 -->
        <div v-if="children.length > 0" class="rel-group">
          <div class="rel-group-label">👶 子女</div>
          <div v-for="(child, idx) in children" :key="'child-' + idx" class="rel-child-block">
            <div class="rel-child-header">
              {{ child.gender === '男' ? '男' : '女' }} · {{ s.currentAge - child.birthYear }}岁 · {{ child.growthStage }}
            </div>
            <div class="rel-detail-row">
              <span class="rel-key">学业</span>
              <div class="rel-bar-track">
                <div
                  class="rel-bar-fill"
                  :style="{ width: Math.max(0, Math.min(100, child.academicPerformance ?? 50)) + '%', background: '#00d4ff' }"
                />
              </div>
              <span class="rel-val">{{ child.academicPerformance ?? 50 }}</span>
              <span class="rel-tag">{{ getAcademicLabel(child.academicPerformance ?? 50) }}</span>
            </div>
            <div class="rel-detail-row">
              <span class="rel-key">月开销</span>
              <span class="rel-cost">¥{{ (child.monthlyExpense ?? 0).toLocaleString('en-US') }}</span>
            </div>
          </div>
        </div>

        <!-- 朋友 -->
        <div v-if="friends.length > 0" class="rel-group">
          <div class="rel-group-label">👥 朋友</div>
          <div v-for="(friend, idx) in friends" :key="'friend-' + idx" class="rel-friend-row">
            <span class="rel-friend-name">{{ friend.name }}({{ friend.type }})</span>
            <div class="rel-bar-track rel-bar-sm">
              <div
                class="rel-bar-fill"
                :style="{
                  width: Math.max(0, Math.min(100, friend.relation)) + '%',
                  background: friend.relation < 35 ? '#ff2d95' : '#00d4ff',
                }"
              />
            </div>
            <span class="rel-friend-val" :style="{ color: friend.relation < 35 ? '#ff2d95' : '#94b0c2' }">{{ friend.relation }}</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.stats-panel {
  font-family: 'DotGothic16', monospace;
  color: #f4f4f4;
  padding: 12px 14px;
  position: relative;
  overflow: hidden;
}

/* ── 顶部年龄标题 ── */
.age-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #c900ff60;
}

.age-title {
  font-size: 20px;
  color: #00d4ff;
  margin: 0;
  letter-spacing: 4px;
  font-weight: bold;
  text-shadow:
    0 0 4px #00d4ff,
    0 0 12px #00d4ff;
  animation: titleFlicker 4s ease-in-out infinite;
}

@keyframes titleFlicker {
  0%, 100% { opacity: 1; }
  48% { opacity: 1; }
  50% { opacity: 0.7; text-shadow: 0 0 2px #00d4ff; }
  52% { opacity: 1; }
}

.age-deco {
  color: #c900ff;
  font-size: 12px;
  text-shadow: 0 0 6px #c900ff;
}

/* ── 核心3指标 ── */
.core-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.core-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(10, 5, 30, 0.5);
  border: 1px solid #c900ff30;
  position: relative;
}

.savings-row {
  border-color: #00ff8860;
}
.savings-row.bankrupt {
  border-color: #ff2d9560;
}

.core-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.core-label {
  font-size: 13px;
  color: #94b0c2;
  width: 48px;
  flex-shrink: 0;
  letter-spacing: 1px;
}

.core-value {
  flex: 1;
  text-align: right;
  font-weight: bold;
}

.core-row:first-child .core-value {
  font-size: 18px;
}

.core-row:not(:first-child) .core-value {
  font-size: 16px;
}

.text-green {
  color: #00ff88;
  text-shadow: 0 0 6px #00ff88, 0 0 12px #00ff8880;
}

.text-red {
  color: #ff2d95;
  text-shadow: 0 0 6px #ff2d95, 0 0 12px #ff2d9580;
  animation: redPulse 1.5s ease-in-out infinite;
}

@keyframes redPulse {
  0%, 100% { text-shadow: 0 0 6px #ff2d95, 0 0 12px #ff2d9580; }
  50% { text-shadow: 0 0 10px #ff2d95, 0 0 20px #ff2d95, 0 0 30px #ff2d9580; }
}

.text-blue {
  color: #00d4ff;
  text-shadow: 0 0 6px #00d4ff, 0 0 12px #00d4ff80;
}

.text-orange {
  color: #ff8800;
  text-shadow: 0 0 6px #ff8800, 0 0 12px #ff880080;
}

/* 变化弹跳徽章 */
.delta-badge {
  position: absolute;
  top: -6px;
  right: 6px;
  font-size: 10px;
  padding: 1px 5px;
  font-weight: bold;
  animation: deltaBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.delta-up {
  color: #00ff88;
  background: rgba(0, 255, 136, 0.15);
  border: 1px solid #00ff88;
  text-shadow: 0 0 4px #00ff88;
  box-shadow: 0 0 6px #00ff8860;
}

.delta-down {
  color: #ff2d95;
  background: rgba(255, 45, 149, 0.15);
  border: 1px solid #ff2d95;
  text-shadow: 0 0 4px #ff2d95;
  box-shadow: 0 0 6px #ff2d9560;
}

@keyframes deltaBounce {
  0% { transform: scale(0) translateY(0); opacity: 0; }
  60% { transform: scale(1.3) translateY(-4px); opacity: 1; }
  100% { transform: scale(1) translateY(-2px); opacity: 1; }
}

/* ── 退休信息 ── */
.retire-info {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #94b0c2;
  margin-bottom: 10px;
  letter-spacing: 0.5px;
}

.retire-divider {
  color: #c900ff80;
}

/* ── 理财状态栏 ── */
.finance-status-section {
  margin-bottom: 10px;
}

.finance-mini {
  margin-bottom: 8px;
}

.finance-mini-title {
  font-size: 11px;
  color: #94b0c2;
  letter-spacing: 1px;
  margin-bottom: 6px;
  text-align: center;
}

.finance-bar-row {
  display: flex;
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
  margin-bottom: 6px;
}

.finance-bar-seg {
  min-width: 4px;
  height: 100%;
  transition: width 0.4s ease;
}

.finance-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}

.finance-chip {
  font-size: 10px;
  padding: 1px 5px;
  border: 1px solid;
  border-radius: 3px;
  letter-spacing: 0.3px;
  white-space: nowrap;
  opacity: 0.85;
}

.asset-collapse {
  padding: 4px 0;
  margin: 0;
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.asset-collapse .collapse-title {
  color: #94b0c2;
  font-size: 11px;
  letter-spacing: 1px;
}

.asset-body {
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 212, 255, 0.1);
  margin-top: 4px;
  animation: panelFadeIn 0.2s ease-out;
}

.asset-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
  font-size: 11px;
}

.asset-icon {
  width: 20px;
  text-align: center;
}

.asset-name {
  color: #94b0c2;
  flex: 1;
}

.asset-value {
  color: #00ff88;
  font-weight: bold;
  letter-spacing: 0.3px;
}

/* ── 身心状态条 ── */
.wellbeing-section {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 12px;
  padding: 8px;
  background: rgba(10, 5, 30, 0.4);
  border: 1px solid #c900ff30;
  position: relative;
  overflow: visible;
}

.wb-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  position: relative;
}

.wb-tooltip {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 4px;
  z-index: 100;
  background: rgba(10, 5, 30, 0.95);
  border: 1px solid #c900ff80;
  padding: 8px 10px;
  min-width: 160px;
  box-shadow: 0 0 12px rgba(201, 0, 255, 0.3);
  font-size: 11px;
  pointer-events: none;
}

.wb-tip-title {
  color: #c900ff;
  font-weight: bold;
  font-size: 10px;
  letter-spacing: 1px;
  margin-bottom: 4px;
  padding-bottom: 3px;
  border-bottom: 1px dashed #c900ff40;
}

.wb-tip-row {
  display: flex;
  justify-content: space-between;
  padding: 1px 0;
}

.wb-tip-src {
  color: #94b0c2;
}

.wb-tip-val {
  font-weight: bold;
  font-family: 'DotGothic16', monospace;
}

.wb-tip-val.pos {
  color: #00ff88;
  text-shadow: 0 0 4px #00ff88;
}

.wb-tip-val.neg {
  color: #ff2d95;
  text-shadow: 0 0 4px #ff2d95;
}

/* Transition for tooltip */
.wb-tip-enter-active,
.wb-tip-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.wb-tip-enter-from,
.wb-tip-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.wb-label {
  color: #94b0c2;
  width: 32px;
  flex-shrink: 0;
  letter-spacing: 1px;
}

.wb-track {
  flex: 1;
  height: 10px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid #333c57;
  padding: 1px;
  overflow: hidden;
}

.wb-fill {
  height: 100%;
  transition: width 0.38s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.wb-value {
  width: 28px;
  text-align: right;
  font-weight: bold;
  font-size: 12px;
  flex-shrink: 0;
}

.wb-emoji {
  font-size: 12px;
  width: 18px;
  text-align: center;
  flex-shrink: 0;
}

/* ── 标签行 ── */
.badge-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.neon-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  font-size: 12px;
  border: 1px solid;
  letter-spacing: 1px;
  backdrop-filter: blur(4px);
}

.badge-profession {
  border-color: #00ff88;
  color: #00ff88;
  background: rgba(0, 255, 136, 0.1);
  box-shadow: 0 0 6px #00ff8860, inset 0 0 6px #00ff8820;
  text-shadow: 0 0 4px #00ff88;
}

.badge-unemployed {
  border-color: #ff2d95;
  color: #ff2d95;
  background: rgba(255, 45, 149, 0.1);
  box-shadow: 0 0 6px #ff2d9560, inset 0 0 6px #ff2d9520;
  text-shadow: 0 0 4px #ff2d95;
  animation: unemployedPulse 2s ease-in-out infinite;
}

@keyframes unemployedPulse {
  0%, 100% { box-shadow: 0 0 6px #ff2d9560, inset 0 0 6px #ff2d9520; }
  50% { box-shadow: 0 0 12px #ff2d95, inset 0 0 8px #ff2d9540; }
}

.badge-city {
  border-color: #00d4ff;
  color: #00d4ff;
  background: rgba(0, 212, 255, 0.1);
  box-shadow: 0 0 6px #00d4ff60, inset 0 0 6px #00d4ff20;
  text-shadow: 0 0 4px #00d4ff;
}

.badge-icon {
  font-size: 11px;
}

/* ── 折叠区 ── */
.collapse-section {
  margin-bottom: 6px;
}

.collapse-header {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  background: rgba(201, 0, 255, 0.06);
  border: 1px solid #c900ff40;
  padding: 7px 10px;
  cursor: pointer;
  font-family: 'DotGothic16', monospace;
  color: #f4f4f4;
  text-align: left;
  transition: all 0.15s ease;
  box-shadow: inset 0 0 6px #c900ff10;
}

.collapse-header:hover {
  background: rgba(201, 0, 255, 0.15);
  border-color: #c900ff;
  box-shadow: 0 0 6px #c900ff30;
}

.collapse-arrow {
  display: inline-block;
  color: #c900ff;
  font-size: 10px;
  text-shadow: 0 0 4px #c900ff;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  flex-shrink: 0;
}

.collapse-arrow.rotated {
  transform: rotate(-90deg);
}

.collapse-title {
  font-size: 12px;
  color: #c900ff;
  letter-spacing: 2px;
  text-shadow: 0 0 4px #c900ff;
  font-weight: bold;
  flex-shrink: 0;
}

.collapse-summary {
  margin-left: auto;
  font-size: 10px;
  color: #94b0c2;
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.collapse-body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  background: rgba(10, 5, 30, 0.3);
  border-left: 1px solid #c900ff30;
  border-right: 1px solid #c900ff30;
  border-bottom: 1px solid #c900ff30;
}

.collapse-body.open {
  max-height: 600px;
}

/* ── 人际关系详情 ── */
.rel-group {
  padding: 6px 10px;
  border-bottom: 1px dashed #c900ff20;
}

.rel-group:last-child {
  border-bottom: none;
}

.rel-group-label {
  font-size: 11px;
  color: #c900ff;
  letter-spacing: 1px;
  text-shadow: 0 0 4px #c900ff;
  font-weight: bold;
  margin-bottom: 5px;
}

.rel-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rel-detail-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
}

.rel-key {
  color: #94b0c2;
  width: 36px;
  flex-shrink: 0;
  letter-spacing: 0.5px;
}

.rel-bar-track {
  flex: 1;
  height: 7px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid #333c57;
  padding: 1px;
  overflow: hidden;
}

.rel-bar-track.rel-bar-sm {
  max-width: 80px;
}

.rel-bar-fill {
  height: 100%;
  transition: width 0.38s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.rel-val {
  width: 24px;
  text-align: right;
  color: #c2c3c7;
  font-weight: bold;
  font-size: 10px;
  flex-shrink: 0;
}

.rel-tag {
  font-size: 9px;
  color: #94b0c2;
  flex-shrink: 0;
}

.rel-age-text {
  font-size: 10px;
  color: #c2c3c7;
}

.rel-cost {
  font-size: 10px;
  color: #ff8800;
  text-shadow: 0 0 4px #ff8800;
}

.rel-deceased {
  font-size: 10px;
  color: #566c86;
  padding: 3px 0;
  letter-spacing: 1px;
}

.rel-deceased.divorced {
  color: #ff2d95;
  text-shadow: 0 0 4px #ff2d95;
}

.rel-na {
  font-size: 10px;
  color: #566c86;
  padding: 3px 0;
  letter-spacing: 1px;
}

.partner-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.partner-name {
  font-size: 12px;
  font-weight: bold;
  color: #ff2d95;
  text-shadow: 0 0 6px #ff2d95;
}

.personality-tag {
  font-size: 9px;
  color: #c900ff;
  border: 1px solid #c900ff80;
  padding: 0 5px;
  border-radius: 2px;
  background: #c900ff15;
}

.partner-trait {
  font-size: 9px;
  color: #ff8cc8;
  margin-bottom: 4px;
  font-style: italic;
}

.memories-row {
  display: flex;
  gap: 4px;
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px dashed #ff2d9530;
}

.memory-tag {
  font-size: 12px;
  cursor: default;
  transition: transform 0.2s;
}

.memory-tag:hover {
  transform: scale(1.3);
}

.rel-child-block {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px dashed #c900ff30;
}

.rel-child-header {
  font-size: 10px;
  color: #00d4ff;
  text-shadow: 0 0 4px #00d4ff;
  margin-bottom: 3px;
}

.rel-friend-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  padding: 2px 0;
}

.rel-friend-name {
  color: #e0e0e8;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rel-friend-val {
  width: 20px;
  text-align: right;
  font-weight: bold;
  font-size: 10px;
  flex-shrink: 0;
}


</style>
