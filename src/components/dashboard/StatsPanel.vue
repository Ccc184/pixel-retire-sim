<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useGameStore } from '../../store/game.store.js';
import { getPath } from '../../data/retirement-paths.js';
import { fmt, fmtExact, fmtWan, fmtSigned, fmtNum } from '../../utils/format.js';

const store = useGameStore();
const s = store.state;

// 年度变化值（简化弹跳动画）
const savingsDelta = ref(0);
const showDelta = ref(false);

// 当前路径信息
const currentPath = computed(() => s.retirementPath ? getPath(s.retirementPath) : null);
const faithLevel = computed(() => s.pathFaith ?? 0);

function faithEmoji(val: number): string {
  if (val >= 70) return '▲';
  if (val >= 50) return '◆';
  if (val >= 30) return '◇';
  return '○';
}

function faithColor(val: number): string {
  if (val >= 70) return '#00ff88';
  if (val >= 50) return '#ffec27';
  if (val >= 30) return '#ff8800';
  return '#ff2d95';
}

function faithLabel(val: number): string {
  if (val >= 80) return '坚定';
  if (val >= 60) return '确信';
  if (val >= 40) return '动摇';
  if (val >= 20) return '怀疑';
  return '崩塌';
}

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

// 数字格式化（使用公共 utils/format.ts）
const formatMoney = fmt;       // 自动万/亿，带¥
const formatMoneyWan = fmtWan; // 强制万为单位
const formatExact = fmtExact;  // 精确到元，带¥（用于月薪）

// ================================================================
//  核心指标
// ================================================================
const isBankrupt = computed(() => s.currentSavings < 0);

const yearsToRetire = computed(() => Math.max(0, s.targetAge - s.currentAge));
const retireAgeLabel = computed(() => `${s.targetAge}岁封顶`);
const canRetireNow = computed(() => s.canRetire);

// 上年副业收入（从年终结算结果取，副业由剧情事件驱动、不稳定）
const lastYearSideHustle = computed(() => (store as any).lastYearResult?.sideHustleIncome || 0);

// 月被动收入（年被动收入/12）
const monthlyPassiveIncome = computed(() => Math.round((s.passiveIncome || 0) / 12));

// 年支出估算：基础生活费+房贷+保险+车辆+子女（尽量与年度结算实际支出对齐）
const annualExpense = computed(() => {
  let total = s.annualBaseCost + s.currentMortgageCost + s.insurancePremium;
  // 车辆年开销
  if (s.hasCar) total += s.annualCarCost || 0;
  // 子女月开销×12
  const children = (s as any).children || [];
  for (const child of children) {
    if (child.monthlyExpense) total += child.monthlyExpense * 12;
  }
  return total;
});

// ================================================================
//  身心状态
// ================================================================
const stressLevel = computed(() => s.stress ?? 30);
const happinessLevel = computed(() => s.happiness ?? 60);
const healthLevel = computed(() => s.health ?? 80);

function healthEmoji(val: number): string {
  if (val >= 70) return '●';
  if (val >= 50) return '●';
  if (val >= 30) return '●';
  return '●';
}

function stressEmoji(val: number): string {
  if (val >= 70) return '●';
  if (val >= 40) return '●';
  return '●';
}

function happinessEmoji(val: number): string {
  if (val >= 70) return '◆';
  if (val >= 40) return '◇';
  return '○';
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
    return { emoji: '◇', label: '单身' };
  }
  if (p.datingStage === 'divorced' || p.hasDivorced) {
    return { emoji: '○', label: '离异' };
  }
  switch (p.datingStage) {
    case 'crush': return { emoji: '◈', label: '暧昧中' };
    case 'dating': return { emoji: '◆', label: '约会中' };
    case 'serious': return { emoji: '◉', label: '恋爱中' };
    case 'married': return { emoji: '◇', label: '已婚' };
    default: return { emoji: '◆', label: '有对象' };
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

// 伴侣状态摘要（独立片段，与父母状态分开，避免歧义）
const relPartnerSummary = computed(() => {
  if (hasPartner.value && !isDivorced.value) {
    if (partner.value!.datingStage === 'married') return '已婚';
    if (partner.value!.datingStage === 'serious') return '热恋中';
    if (partner.value!.datingStage === 'dating') return '约会中';
    if (partner.value!.datingStage === 'crush') return '暧昧中';
    return '有对象';
  }
  if (isDivorced.value) return '离异';
  return '单身';
});

// 父母状态摘要（独立片段）
const relParentSummary = computed(() => {
  if (parentsAlive.value) return '父母健在';
  if (parents.value) return '父母已故';
  return '';
});

// 子女 / 朋友数量摘要（独立片段）
const relKinshipSummary = computed(() => {
  const parts: string[] = [];
  if (children.value.length > 0) parts.push(`${children.value.length}子`);
  if (friends.value.length > 0) parts.push(`${friends.value.length}友`);
  return parts.length > 0 ? parts.join(' · ') : '';
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
  const chainHoldings = (v as any).chainHoldings || 0
  const bioPortfolio = (v as any).bioPortfolio || 0

  // 总流动资产 = 现金存款 + 独立持仓（链上/生科）
  const totalLiquid = v.currentSavings + chainHoldings + bioPortfolio
  if (totalLiquid <= 0) {
    return [{ icon: '◈', name: '余额宝', pct: 100, color: '#00d4ff', rate: '1.5%', active: true }]
  }

  // 各现金渠道的实际金额（基于 currentSavings 的百分比）
  const bankValue = v.currentSavings * (v.bankDepositPct / 100)
  const fixedValue = v.currentSavings * ((v as any).fixedDepositPct || 0) / 100
  const fundValue = v.currentSavings * (v.indexFundPct / 100)
  const goldValue = v.currentSavings * ((v as any).goldPct || 0) / 100

  const channels: FinanceChannel[] = []

  // 现金渠道：显示占总流动资产的比例
  if (bankValue > 0) channels.push({ icon: '◈', name: '余额宝', pct: Math.round((bankValue / totalLiquid) * 100), color: '#00d4ff', rate: '1.5%', active: true })
  if (fixedValue > 0) channels.push({ icon: '▣', name: '定期', pct: Math.round((fixedValue / totalLiquid) * 100), color: '#00ff88', rate: '3.0%', active: true })
  if (fundValue > 0) channels.push({ icon: '◆', name: '基金', pct: Math.round((fundValue / totalLiquid) * 100), color: '#ffec27', rate: '波动', active: true })

  if (v.retirementPath === 'chain_native') {
    // 链上持仓是独立资产，直接按实际值占总流动资产比例显示
    if (chainHoldings > 0) channels.push({ icon: '◇', name: '链上持仓', pct: Math.round((chainHoldings / totalLiquid) * 100), color: '#ff8800', rate: '极端波动', active: true })
  } else if (v.retirementPath === 'bio_gambler') {
    // 生科投资是独立资产，直接按实际值占总流动资产比例显示
    if (bioPortfolio > 0) channels.push({ icon: '◊', name: '生科投资', pct: Math.round((bioPortfolio / totalLiquid) * 100), color: '#ff2d95', rate: '高风险', active: true })
  } else {
    // 其他路径：股票和比特币在 currentSavings 中
    const stockValue = v.currentSavings * ((v as any).stockPct || 0) / 100
    const cryptoValue = v.currentSavings * (v.speculationPct / 100)
    if (stockValue > 0) channels.push({ icon: '▲', name: '股票', pct: Math.round((stockValue / totalLiquid) * 100), color: '#ff2d95', rate: '极高', active: true })
    if (cryptoValue > 0) channels.push({ icon: '₿', name: '比特币', pct: Math.round((cryptoValue / totalLiquid) * 100), color: '#ff8800', rate: '疯狂', active: true })
  }

  if (goldValue > 0) channels.push({ icon: '★', name: '黄金', pct: Math.round((goldValue / totalLiquid) * 100), color: '#ffd700', rate: '避险', active: true })

  // 修正 rounding 导致总和不为 100%
  const sum = channels.reduce((acc, c) => acc + c.pct, 0)
  if (channels.length > 0 && sum !== 100) {
    const maxIdx = channels.reduce((maxI, c, i) => c.pct > channels[maxI].pct ? i : maxI, 0)
    channels[maxIdx].pct += (100 - sum)
  }

  return channels
})

const assetItems = computed<{ icon: string; name: string; value: number; active: boolean }[]>(() => {
  const v = s
  const items: { icon: string; name: string; value: number; active: boolean }[] = []

  // 金融资产（流动）
  if (v.currentSavings > 0 || v.currentSavings < 0) {
    items.push({ icon: '¥', name: '现金存款', value: v.currentSavings, active: true })
  }
  const chainHoldings = (v as any).chainHoldings || 0
  if (chainHoldings > 0) {
    items.push({ icon: '◇', name: '链上持仓', value: chainHoldings, active: true })
  }
  const bioPortfolio = (v as any).bioPortfolio || 0
  if (bioPortfolio > 0) {
    items.push({ icon: '◊', name: '生科投资', value: bioPortfolio, active: true })
  }

  // 不动产
  if (v.hasProperty && v.propertyValue > 0) {
    items.push({ icon: '▣', name: '自住房产', value: v.propertyValue, active: true })
  }
  const shopValue = (v as any).shopValue || 0
  if (shopValue > 0) {
    items.push({ icon: '◆', name: '商铺产权', value: shopValue, active: true })
  }

  // 车辆（使用实际carValue字段）
  const carValue = (v as any).carValue || 0
  if (v.hasCar && carValue > 0) {
    items.push({ icon: '◎', name: '车辆市值', value: carValue, active: true })
  }

  // 路径专属经营资产
  // 银发创业：生意估值 = 月营收 × 12 × 2倍PE（服务业估值）
  if (v.retirementPath === 'silver_economy') {
    const sb = (v as any).silverBusiness
    if (sb && sb.monthlyRevenue > 0) {
      const businessValue = Math.round(sb.monthlyRevenue * 12 * 2)
      items.push({ icon: '★', name: '银发生意估值', value: businessValue, active: true })
    }
  }
  // 超级IP：无形资产估值 = 粉丝数 × 单粉价值（按粉丝阶段）
  if (v.retirementPath === 'super_ip') {
    const followers = (v as any).ipFollowers || 0
    const reputation = (v as any).ipReputation || 0
    if (followers > 1000) {
      // 单粉价值：1万粉以下约2元/粉，10万粉约5元/粉，100万粉约10元/粉
      let perFanValue = 2
      if (followers > 1000000) perFanValue = 10
      else if (followers > 100000) perFanValue = 5
      const ipValue = Math.round(followers * perFanValue * (reputation / 100))
      if (ipValue > 0) {
        items.push({ icon: '☆', name: 'IP无形资产', value: ipValue, active: true })
      }
    }
  }

  return items
})

const totalNetWorth = computed(() => {
  // 总资产 = 所有资产项价值之和（现金存款可以是负数即负债）
  return assetItems.value.reduce((sum, a) => sum + a.value, 0)
})

// 资产明细数字格式（无¥，自动万/元）
const formatWan = fmtNum;

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
  <div class="stats-panel">
    <!-- Panel 1: 身心状态 -->
    <div class="panel">
      <div class="panel-title">身心状态</div>
      <div class="wb-list">
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
          <span class="wb-emoji" :style="{ color: barColor(healthLevel, 'health'), textShadow: '0 0 4px ' + barColor(healthLevel, 'health') }">{{ healthEmoji(healthLevel) }}</span>
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
          <span class="wb-emoji" :style="{ color: barColor(stressLevel, 'stress'), textShadow: '0 0 4px ' + barColor(stressLevel, 'stress') }">{{ stressEmoji(stressLevel) }}</span>
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
          <span class="wb-emoji" :style="{ color: barColor(happinessLevel, 'happiness'), textShadow: '0 0 4px ' + barColor(happinessLevel, 'happiness') }">{{ happinessEmoji(happinessLevel) }}</span>
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
    </div>

    <!-- Panel 2: 财务总览 -->
    <div class="panel">
      <div class="panel-title">财务总览</div>
      <div class="finance-list">
        <div class="finance-row savings-row" :class="{ bankrupt: isBankrupt }">
          <span class="finance-label">存款</span>
          <span class="finance-value savings-value" :class="isBankrupt ? 'text-red' : 'text-green'">
            {{ formatMoney(s.currentSavings) }}
          </span>
          <span
            v-if="showDelta && savingsDelta !== 0"
            class="delta-badge"
            :class="savingsDelta > 0 ? 'delta-up' : 'delta-down'"
          >
            {{ fmtSigned(savingsDelta) }}
          </span>
        </div>

        <!-- 总资产（高亮显示） -->
        <div class="finance-row net-worth-row">
          <span class="finance-label">总资产</span>
          <span class="finance-value text-blue" style="font-weight: 700; font-size: 1.05em;">
            {{ formatMoneyWan(totalNetWorth) }}
          </span>
        </div>

        <!-- 月薪：精确到元，最直观 -->
        <div class="finance-row">
          <span class="finance-label">月薪</span>
          <span class="finance-value text-blue">
            {{ s.isUnemployed ? '失业中' : formatExact(s.currentMonthlySalary) }}
          </span>
        </div>

        <!-- 被动收入/月：退休核心指标 -->
        <div class="finance-row">
          <span class="finance-label">被动收入</span>
          <span class="finance-value" :class="monthlyPassiveIncome > 0 ? 'text-green' : ''">
            {{ monthlyPassiveIncome > 0 ? formatExact(monthlyPassiveIncome) : '¥0' }}
            <span style="font-size:0.75em;color:#888;font-weight:normal;">/月</span>
          </span>
        </div>

        <div v-if="lastYearSideHustle > 0" class="finance-row">
          <span class="finance-label">上年副业</span>
          <span class="finance-value text-green">{{ formatMoney(lastYearSideHustle) }}</span>
        </div>

        <div class="finance-row">
          <span class="finance-label">年支出(估)</span>
          <span class="finance-value text-orange">{{ formatMoney(annualExpense) }}</span>
        </div>
      </div>

      <div class="target-section">
        <div class="target-info">
          <span :class="{ 'can-retire-hint': canRetireNow }">
            {{ canRetireNow ? '◆ 可退休' : retireAgeLabel }} · 剩{{ yearsToRetire }}年
          </span>
          <span>目标 {{ formatMoneyWan(s.targetWealth) }}</span>
        </div>
        <div class="target-bar">
          <div
            class="target-fill"
            :style="{ width: Math.max(0, Math.min(100, (totalNetWorth / Math.max(1, s.targetWealth)) * 100)) + '%' }"
          />
        </div>
        <div class="target-note" style="font-size: 0.7em; color: #888; text-align: center; margin-top: 2px;">
          （按总资产计算退休进度）
        </div>
      </div>
    </div>

    <!-- Panel 3: 资产分布 -->
    <div class="panel">
      <div class="panel-title">资产明细</div>

      <!-- 流动资产分布（理财渠道） -->
      <div class="asset-dot-list">
        <div
          v-for="(ch, ci) in depositChannels"
          :key="'dc-' + ci"
          class="asset-dot-row"
          :title="ch.name + ' ' + ch.pct + '%'"
        >
          <span class="asset-dot" :style="{ background: ch.color, boxShadow: '0 0 4px ' + ch.color }"></span>
          <span class="asset-dot-name">{{ ch.icon }} {{ ch.name }}</span>
          <span class="asset-dot-rate">{{ ch.rate }}</span>
          <span class="asset-dot-pct" :style="{ color: ch.color }">{{ ch.pct }}%</span>
        </div>
      </div>

      <!-- 全部资产项明细 -->
      <button
        v-if="assetItems.length > 0"
        class="collapse-header asset-collapse"
        type="button"
        @click="financeOpen = !financeOpen"
      >
        <span class="collapse-arrow" :class="{ rotated: financeOpen }">▼</span>
        <span class="collapse-title">全部资产明细</span>
      </button>
      <div v-if="financeOpen && assetItems.length > 0" class="collapse-body asset-body open">
        <div v-for="(a, ai) in assetItems" :key="'asset-' + ai" class="asset-row">
          <span class="asset-icon">{{ a.icon }}</span>
          <span class="asset-name">{{ a.name }}</span>
          <span class="asset-value" :class="a.value < 0 ? 'text-red' : ''">{{ formatWan(a.value) }}</span>
        </div>
      </div>
    </div>

    <!-- Panel 4: 退休路径 -->
    <div v-if="currentPath" class="panel path-panel" :style="{ '--path-color': currentPath.color }">
      <div class="panel-title">退休路径</div>
      <div class="path-header">
        <span class="path-icon">{{ currentPath.icon }}</span>
        <span class="path-name">{{ currentPath.name }}</span>
      </div>
      <div class="path-desc">{{ currentPath.description }}</div>
      <div class="skill-chips">
        <span class="skill-chip">{{ currentPath.subtitle }}</span>
        <span class="skill-chip">◎ 退休由你决定</span>
      </div>
      <div class="faith-row">
        <span class="faith-label">信念</span>
        <div class="faith-track">
          <div
            class="faith-fill"
            :style="{
              width: Math.max(0, Math.min(100, faithLevel)) + '%',
              background: faithColor(faithLevel),
            }"
          />
        </div>
        <span class="faith-value" :style="{ color: faithColor(faithLevel) }">
          {{ Math.round(faithLevel) }}
        </span>
        <span class="faith-emoji" :style="{ color: faithColor(faithLevel), textShadow: '0 0 4px ' + faithColor(faithLevel) }">{{ faithEmoji(faithLevel) }}</span>
        <span class="faith-tag" :style="{ color: faithColor(faithLevel) }">{{ faithLabel(faithLevel) }}</span>
      </div>
    </div>

    <!-- Panel 5: 人际关系（折叠） -->
    <div class="panel">
      <button
        class="panel-title is-toggle"
        type="button"
        @click="relOpen = !relOpen"
      >
        <span class="toggle-text">人际关系</span>
        <span class="toggle-summary">
          <span v-if="relParentSummary" class="sum-parent"><span class="sum-emoji">👴</span>{{ relParentSummary }}</span>
          <span class="sum-partner"><span class="sum-emoji">💑</span>{{ relPartnerSummary }}</span>
          <span v-if="relKinshipSummary" class="sum-kinship">{{ relKinshipSummary }}</span>
        </span>
        <span class="toggle-arrow" :class="{ open: relOpen }">▾</span>
      </button>
      <div class="collapse-body rel-body" :class="{ open: relOpen }">
        <!-- 父母 -->
        <div class="rel-group">
          <div class="rel-group-label">◆ 父母</div>
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
            † 已故 · 享年{{ parents.age || '??' }}岁
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
            ○ {{ partner?.exName ? '与' + partner.exName + '分开了' : '已离异' }}
          </div>
          <!-- 单身 -->
          <div v-else class="rel-na">— 单身中 —</div>
        </div>

        <!-- 子女 -->
        <div v-if="children.length > 0" class="rel-group">
          <div class="rel-group-label">◇ 子女</div>
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
              <span class="rel-cost">{{ fmtExact(child.monthlyExpense ?? 0) }}/月</span>
            </div>
          </div>
        </div>

        <!-- 朋友 -->
        <div v-if="friends.length > 0" class="rel-group">
          <div class="rel-group-label">◈ 朋友</div>
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
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px;
  position: relative;
}

/* ── 通用面板卡片 ── */
.panel {
  background: rgba(15, 8, 35, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 8px 10px;
  position: relative;
}

.panel-title {
  font-size: 11px;
  color: #8a8aaa;
  letter-spacing: 2px;
  text-transform: uppercase;
  font-family: 'DotGothic16', monospace;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.panel-title::before {
  content: '▸';
  color: var(--neon-blue);
  letter-spacing: 0;
}

/* ── 身心状态 ── */
.wb-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
  overflow: visible;
}

.wb-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  position: relative;
}

.wb-label {
  color: #94b0c2;
  width: 24px;
  flex-shrink: 0;
  letter-spacing: 1px;
  font-size: 10px;
}

.wb-track {
  flex: 1;
  height: 6px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  padding: 1px;
  overflow: hidden;
}

.wb-fill {
  height: 100%;
  border-radius: 2px;
  position: relative;
  overflow: hidden;
  transition: width 0.38s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 渐变光泽 + shimmer */
.wb-fill::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0) 45%, rgba(0, 0, 0, 0.25) 100%);
  pointer-events: none;
}

.wb-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%);
  animation: shimmer 2.2s linear infinite;
  pointer-events: none;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.wb-value {
  width: 22px;
  text-align: right;
  font-weight: bold;
  font-size: 10px;
  flex-shrink: 0;
}

.wb-emoji {
  font-size: 10px;
  width: 16px;
  text-align: center;
  flex-shrink: 0;
  text-shadow: inherit;
}

/* wellbeing tooltip */
.wb-tooltip {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 4px;
  z-index: 100;
  background: rgba(10, 5, 30, 0.96);
  border: 1px solid #c900ff80;
  border-radius: 4px;
  padding: 6px 8px;
  min-width: 150px;
  box-shadow: 0 0 12px rgba(201, 0, 255, 0.3);
  font-size: 9px;
  pointer-events: none;
}

.wb-tip-title {
  color: #c900ff;
  font-weight: bold;
  font-size: 9px;
  letter-spacing: 1px;
  margin-bottom: 3px;
  padding-bottom: 2px;
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

.wb-tip-enter-active,
.wb-tip-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.wb-tip-enter-from,
.wb-tip-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ── 财务总览 ── */
.finance-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-bottom: 6px;
}

.finance-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  padding: 2px 4px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.2);
  position: relative;
  font-size: 11px;
}

.finance-row:hover {
  background: rgba(0, 0, 0, 0.35);
}

.savings-row {
  background: rgba(0, 255, 136, 0.06);
  border: 1px solid rgba(0, 255, 136, 0.2);
}
.savings-row.bankrupt {
  background: rgba(255, 45, 149, 0.06);
  border-color: rgba(255, 45, 149, 0.25);
}

.net-worth-row {
  background: rgba(0, 212, 255, 0.08);
  border: 1px solid rgba(0, 212, 255, 0.25);
  border-radius: 4px;
  padding: 4px 6px;
  margin: 2px 0;
}

.finance-label {
  color: #94b0c2;
  font-size: 11px;
  letter-spacing: 1px;
  flex-shrink: 0;
}

.finance-value {
  margin-left: auto;
  text-align: right;
  font-weight: bold;
  font-size: 13px;
}

/* 存款数字特别突出 */
.savings-value {
  font-size: 16px;
  text-shadow: 0 0 8px currentColor;
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

/* 存款变化弹跳徽章 */
.delta-badge {
  position: absolute;
  top: -7px;
  right: 4px;
  font-size: 9px;
  padding: 0 4px;
  font-weight: bold;
  border-radius: 2px;
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

/* 退休目标进度条 */
.target-section {
  margin-top: 2px;
}

.target-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 9px;
  color: #6a6a8a;
  letter-spacing: 0.5px;
  margin-bottom: 3px;
}

.can-retire-hint {
  color: #00ff88;
  text-shadow: 0 0 4px rgba(0, 255, 136, 0.6);
  animation: retire-pulse 2s ease-in-out infinite;
}

@keyframes retire-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.target-bar {
  height: 8px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  padding: 1px;
  overflow: hidden;
}

.target-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, #00d4ff 0%, #c900ff 50%, #ff2d95 100%);
  box-shadow: 0 0 6px rgba(201, 0, 255, 0.6);
  transition: width 0.4s ease;
}

/* ── 资产分布 ── */
.asset-dot-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.asset-dot-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 10px;
}

.asset-dot-row:hover {
  background: rgba(255, 255, 255, 0.03);
}

.asset-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.asset-dot-name {
  color: #c2c3c7;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.asset-dot-rate {
  font-size: 9px;
  color: #6a6a8a;
  flex-shrink: 0;
}

.asset-dot-pct {
  font-weight: bold;
  font-size: 10px;
  flex-shrink: 0;
}

/* ── 折叠头（资产 / 通用） ── */
.collapse-header {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  background: rgba(201, 0, 255, 0.05);
  border: 1px solid rgba(201, 0, 255, 0.25);
  border-radius: 4px;
  padding: 4px 6px;
  margin-top: 6px;
  cursor: pointer;
  font-family: 'DotGothic16', monospace;
  color: #f4f4f4;
  text-align: left;
  transition: all 0.15s ease;
}

.collapse-header:hover {
  background: rgba(201, 0, 255, 0.12);
  border-color: #c900ff;
  box-shadow: 0 0 6px rgba(201, 0, 255, 0.3);
}

.collapse-arrow {
  display: inline-block;
  color: #c900ff;
  font-size: 9px;
  text-shadow: 0 0 4px #c900ff;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  flex-shrink: 0;
}

.collapse-arrow.rotated {
  transform: rotate(-90deg);
}

.collapse-title {
  font-size: 10px;
  color: #c900ff;
  letter-spacing: 1px;
  text-shadow: 0 0 4px #c900ff;
  font-weight: bold;
  flex-shrink: 0;
}

.collapse-body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.collapse-body.open {
  max-height: 600px;
}

.asset-body {
  padding: 0;
  margin-top: 4px;
  animation: panelFadeIn 0.2s ease-out;
}

@keyframes panelFadeIn {
  from { opacity: 0; transform: translateY(-2px); }
  to { opacity: 1; transform: translateY(0); }
}

.asset-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 6px;
  font-size: 10px;
}

.asset-icon {
  width: 16px;
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

/* ── 退休路径面板 ── */
.path-panel {
  border-color: rgba(201, 0, 255, 0.4);
  /* v2 spec: 紫色 5% 叠在深色底之上，保持可读性 */
  background: linear-gradient(rgba(201, 0, 255, 0.05), rgba(201, 0, 255, 0.05)), rgba(15, 8, 35, 0.85);
  box-shadow: inset 0 0 14px rgba(201, 0, 255, 0.08), 0 0 6px rgba(201, 0, 255, 0.12);
}

.path-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  padding-bottom: 4px;
  border-bottom: 1px dashed rgba(201, 0, 255, 0.2);
}

.path-icon {
  font-size: 13px;
}

.path-name {
  font-size: 12px;
  font-weight: bold;
  color: var(--path-color, #00d4ff);
  text-shadow: 0 0 6px var(--path-color, #00d4ff);
  letter-spacing: 1px;
}

.path-desc {
  font-size: 9px;
  color: #94b0c2;
  line-height: 1.5;
  margin-bottom: 6px;
  letter-spacing: 0.3px;
}

.skill-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
}

.skill-chip {
  font-size: 9px;
  color: #00ff88;
  border: 1px solid rgba(0, 255, 136, 0.5);
  background: rgba(0, 255, 136, 0.06);
  padding: 1px 5px;
  border-radius: 3px;
  letter-spacing: 0.3px;
  white-space: nowrap;
  text-shadow: 0 0 3px rgba(0, 255, 136, 0.4);
}

/* 信念条 */
.faith-row {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 9px;
  padding-top: 4px;
  border-top: 1px dashed rgba(201, 0, 255, 0.15);
}

.faith-label {
  color: #94b0c2;
  width: 22px;
  flex-shrink: 0;
  letter-spacing: 1px;
}

.faith-track {
  flex: 1;
  height: 6px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  padding: 1px;
  overflow: hidden;
}

.faith-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.38s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 0 6px currentColor;
}

.faith-value {
  width: 20px;
  text-align: right;
  font-weight: bold;
  font-size: 10px;
  flex-shrink: 0;
}

.faith-emoji {
  font-size: 10px;
  width: 14px;
  text-align: center;
  flex-shrink: 0;
  text-shadow: inherit;
}

.faith-tag {
  font-size: 9px;
  flex-shrink: 0;
  font-weight: bold;
  letter-spacing: 1px;
}

/* ── 人际关系折叠面板 ── */
.panel-title.is-toggle {
  width: 100%;
  background: rgba(0, 212, 255, 0.08);
  border: 1px solid rgba(0, 212, 255, 0.28);
  border-radius: 4px;
  cursor: pointer;
  padding: 6px 8px;
  margin-bottom: 0;
  text-align: left;
  font-family: 'DotGothic16', monospace;
  font-size: 10px;
  color: #b8d8ff;
  letter-spacing: 2px;
  text-transform: uppercase;
  transition: all 0.2s ease;
}

.panel-title.is-toggle:hover {
  background: rgba(0, 212, 255, 0.16);
  border-color: var(--neon-blue);
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.45);
  color: #ffffff;
}

.panel-title.is-toggle:active {
  transform: translateY(1px);
}

.panel-title.is-toggle .toggle-text {
  color: #b8d8ff;
  font-weight: bold;
  letter-spacing: 2px;
  transition: color 0.2s ease;
}

.panel-title.is-toggle:hover .toggle-text {
  color: #ffffff;
}

.toggle-summary {
  margin-left: auto;
  font-size: 9px;
  color: #7f8fae;
  letter-spacing: 0.5px;
  text-transform: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60%;
  display: flex;
  align-items: center;
  gap: 6px;
}

.panel-title.is-toggle:hover .toggle-summary {
  color: #cfe6ff;
}

/* 摘要片段：父母 / 伴侣 / 子女友 各自独立着色，避免误读 */
.toggle-summary .sum-emoji {
  font-size: 10px;
  margin-right: 2px;
}

.toggle-summary .sum-parent {
  color: #7cd69a;
  display: inline-flex;
  align-items: center;
}

.toggle-summary .sum-partner {
  color: #ff9ec7;
  display: inline-flex;
  align-items: center;
}

.toggle-summary .sum-kinship {
  color: #8fb8ff;
  display: inline-flex;
  align-items: center;
}

.toggle-arrow {
  color: var(--neon-blue);
  font-size: 12px;
  flex-shrink: 0;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform: rotate(-90deg);
  text-shadow: 0 0 5px rgba(0, 212, 255, 0.6);
}

/* 收起状态：箭头脉冲，暗示可点击展开 */
.toggle-arrow:not(.open) {
  animation: relArrowPulse 1.6s ease-in-out infinite;
}

@keyframes relArrowPulse {
  0%, 100% {
    opacity: 0.55;
    transform: rotate(-90deg) translateX(0);
  }
  50% {
    opacity: 1;
    transform: rotate(-90deg) translateX(2px);
  }
}

.toggle-arrow.open {
  transform: rotate(0deg);
  animation: none;
}

.rel-body {
  margin-top: 4px;
}

.rel-body.open {
  padding-top: 4px;
  border-top: 1px dashed rgba(255, 255, 255, 0.06);
}

.rel-group {
  padding: 4px 2px;
  border-bottom: 1px dashed rgba(201, 0, 255, 0.12);
}

.rel-group:last-child {
  border-bottom: none;
}

.rel-group-label {
  font-size: 10px;
  color: #c900ff;
  letter-spacing: 1px;
  text-shadow: 0 0 4px #c900ff;
  font-weight: bold;
  margin-bottom: 3px;
}

.rel-detail {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.rel-detail-row {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 9px;
}

.rel-key {
  color: #94b0c2;
  width: 28px;
  flex-shrink: 0;
  letter-spacing: 0.5px;
}

.rel-bar-track {
  flex: 1;
  height: 5px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  padding: 1px;
  overflow: hidden;
}

.rel-bar-track.rel-bar-sm {
  max-width: 70px;
}

.rel-bar-fill {
  height: 100%;
  border-radius: 1px;
  transition: width 0.38s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.rel-val {
  width: 18px;
  text-align: right;
  color: #c2c3c7;
  font-weight: bold;
  font-size: 9px;
  flex-shrink: 0;
}

.rel-tag {
  font-size: 8px;
  color: #94b0c2;
  flex-shrink: 0;
}

.rel-age-text {
  font-size: 9px;
  color: #c2c3c7;
}

.rel-cost {
  font-size: 9px;
  color: #ff8800;
  text-shadow: 0 0 4px #ff8800;
}

.rel-deceased {
  font-size: 9px;
  color: #566c86;
  padding: 2px 0;
  letter-spacing: 1px;
}

.rel-deceased.divorced {
  color: #ff2d95;
  text-shadow: 0 0 4px #ff2d95;
}

.rel-na {
  font-size: 9px;
  color: #566c86;
  padding: 2px 0;
  letter-spacing: 1px;
}

.partner-name-row {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 2px;
}

.partner-name {
  font-size: 10px;
  font-weight: bold;
  color: #ff2d95;
  text-shadow: 0 0 6px #ff2d95;
}

.personality-tag {
  font-size: 8px;
  color: #c900ff;
  border: 1px solid #c900ff80;
  padding: 0 4px;
  border-radius: 2px;
  background: rgba(201, 0, 255, 0.1);
}

.partner-trait {
  font-size: 9px;
  color: #ff8cc8;
  margin-bottom: 3px;
  font-style: italic;
}

.memories-row {
  display: flex;
  gap: 3px;
  margin-top: 3px;
  padding-top: 3px;
  border-top: 1px dashed #ff2d9530;
}

.memory-tag {
  font-size: 11px;
  cursor: default;
  transition: transform 0.2s;
}

.memory-tag:hover {
  transform: scale(1.3);
}

.rel-child-block {
  margin-top: 3px;
  padding-top: 3px;
  border-top: 1px dashed rgba(201, 0, 255, 0.2);
}

.rel-child-header {
  font-size: 9px;
  color: #00d4ff;
  text-shadow: 0 0 4px #00d4ff;
  margin-bottom: 2px;
}

.rel-friend-row {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 9px;
  padding: 1px 0;
}

.rel-friend-name {
  color: #e0e0e8;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rel-friend-val {
  width: 16px;
  text-align: right;
  font-weight: bold;
  font-size: 9px;
  flex-shrink: 0;
}
</style>
