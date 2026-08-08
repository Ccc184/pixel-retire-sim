<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useGameStore } from '../../store/game.store.js';
import { getPath } from '../../data/retirement-paths.js';
import { fmt, fmtExact, fmtWan, fmtSigned, fmtNum } from '../../utils/format.js';
import AnimatedNumber from '../ui/AnimatedNumber.vue';

const store = useGameStore();
const s = store.state;

// 年度变化值（简化弹跳动画）
const savingsDelta = ref(0);
const showDelta = ref(false);

// 数值格式化（供 AnimatedNumber 使用）
const fmtRaw = (n: number) => fmt(n);
const fmtWanRaw = (n: number) => fmtWan(n);
const fmtRound = (n: number) => String(Math.round(n));

// 身心状态条变化闪烁反馈
const barFlash = ref<Record<string, string>>({ health: '', stress: '', happiness: '' });
function flashBar(key: 'health' | 'stress' | 'happiness') {
  // 用自增标识强制重触发 CSS 动画
  barFlash.value[key] = Date.now() + '-' + Math.random();
}
watch(
  () => [s.health, s.stress, s.happiness],
  ([h, st, hf], [oh, ost, ohf]) => {
    if (oh !== undefined) {
      if (h !== oh) flashBar('health');
      if (st !== ost) flashBar('stress');
      if (hf !== ohf) flashBar('happiness');
    }
  },
);

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
  if (val >= 70) return '♥';
  if (val >= 50) return '●';
  if (val >= 30) return '◐';
  return '○';
}

function stressEmoji(val: number): string {
  if (val >= 70) return '🔥';
  if (val >= 40) return '⚠';
  return '✓';
}

function happinessEmoji(val: number): string {
  if (val >= 70) return '★';
  if (val >= 40) return '◆';
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

// ================================================================
//  存款分布调节（玩家自由配置各渠道占比，总和恒为 100）
//  与人生审计报告中的"认知偏差检测"呼应：
//  全放余额宝 → 触发"损失厌恶"；重仓投机 → 触发"过度自信"
// ================================================================
interface DepositControl {
  key: 'bank' | 'fixed' | 'fund' | 'stock' | 'gold' | 'spec'
  name: string
  icon: string
  color: string
  rate: string
  get: () => number
}

const depositControls = computed<DepositControl[]>(() => {
  const path = s.retirementPath
  const list: DepositControl[] = [
    { key: 'bank', name: '余额宝', icon: '◈', color: '#00d4ff', rate: '+1.4%', get: () => s.bankDepositPct },
    { key: 'fixed', name: '定期', icon: '▣', color: '#00ff88', rate: '+2.7%', get: () => (s as any).fixedDepositPct || 0 },
    { key: 'fund', name: '基金', icon: '◆', color: '#ffec27', rate: '-9~+18%', get: () => s.indexFundPct },
  ]
  // 链上原住民：加密货币在 chainHoldings 中独立存在，存款分布不含比特币
  if (path !== 'chain_native') {
    list.push({ key: 'spec', name: '比特币', icon: '₿', color: '#ff8800', rate: '-72~+180%', get: () => s.speculationPct })
  }
  // 生物赌徒：生科投资在 bioPortfolio 中独立存在，存款分布不含股票
  if (path !== 'bio_gambler') {
    list.push({ key: 'stock', name: '股票', icon: '▲', color: '#ff2d95', rate: '-27~+36%', get: () => (s as any).stockPct || 0 })
  }
  list.push({ key: 'gold', name: '黄金', icon: '★', color: '#ffd700', rate: '避险', get: () => (s as any).goldPct || 0 })
  return list
})

// 当前分布快照（用于归一化与堆叠条）
const depositSnapshot = computed(() => {
  const map: Record<string, number> = {}
  for (const c of depositControls.value) map[c.key] = c.get()
  return map
})

const depositTotal = computed(() => Object.values(depositSnapshot.value).reduce((a, b) => a + b, 0))

// 调整某渠道占比：差值按比例摊到其余渠道，保证总和恒为 100
function adjustDeposit(key: string, value: number) {
  const controls = depositControls.value
  const cur: Record<string, number> = {}
  for (const c of controls) cur[c.key] = c.get()
  const oldVal = cur[key]
  if (oldVal === value) return

  const others = controls.filter((c) => c.key !== key)
  const othersSum = others.reduce((sum, c) => sum + cur[c.key], 0)
  const newOthersSum = 100 - value
  const next: Record<string, number> = { ...cur, [key]: value }

  if (othersSum > 0) {
    const ratio = newOthersSum / othersSum
    for (const c of others) next[c.key] = Math.round(cur[c.key] * ratio)
  } else if (others.length > 0) {
    // 原值 100，新增占比平均分配到其余渠道
    const base = Math.floor(newOthersSum / others.length)
    let rem = newOthersSum - base * others.length
    for (let i = 0; i < others.length; i++) next[others[i].key] = base + (i < rem ? 1 : 0)
  }

  // 修正四舍五入导致的漂移，差值补到最大的其余渠道
  const sum = Object.values(next).reduce((a, b) => a + b, 0)
  const diff = 100 - sum
  if (diff !== 0) {
    const target = others.slice().sort((a, b) => next[b.key] - next[a.key])[0]
    if (target) next[target.key] = Math.max(0, next[target.key] + diff)
  }
  store.setDepositChannels(next)
}

// 一键平均分配
function evenSplit() {
  const controls = depositControls.value
  const base = Math.floor(100 / controls.length)
  let rem = 100 - base * controls.length
  const next: Record<string, number> = {}
  for (let i = 0; i < controls.length; i++) next[controls[i].key] = base + (i < rem ? 1 : 0)
  store.setDepositChannels(next)
}

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
            <span v-if="barFlash.health" :key="barFlash.health" class="wb-track-flash" />
          </div>
          <span class="wb-value" :style="{ color: barColor(healthLevel, 'health') }">
            <AnimatedNumber :value="healthLevel" :format="fmtRound" />
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
            <span v-if="barFlash.stress" :key="barFlash.stress" class="wb-track-flash" />
          </div>
          <span class="wb-value" :style="{ color: barColor(stressLevel, 'stress') }">
            <AnimatedNumber :value="stressLevel" :format="fmtRound" />
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
            <span v-if="barFlash.happiness" :key="barFlash.happiness" class="wb-track-flash" />
          </div>
          <span class="wb-value" :style="{ color: barColor(happinessLevel, 'happiness') }">
            <AnimatedNumber :value="happinessLevel" :format="fmtRound" />
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
            <AnimatedNumber :value="s.currentSavings" :format="fmtRaw" />
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
            <AnimatedNumber :value="totalNetWorth" :format="fmtWanRaw" />
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

    <!-- Panel 3: 资产配置（存款分布调节 + 全部资产明细，整合为一个面板） -->
    <div class="panel deposit-panel">
      <div class="deposit-head">
        <span class="panel-title deposit-title">资产配置</span>
        <button class="even-btn" type="button" @click="evenSplit" title="各渠道平均分配">均衡</button>
      </div>

      <!-- 当前分布堆叠条 -->
      <div class="deposit-stack">
        <div
          v-for="c in depositControls"
          :key="'seg-' + c.key"
          class="deposit-seg"
          :style="{ width: depositTotal ? (depositSnapshot[c.key] / depositTotal * 100) + '%' : 0, background: c.color, boxShadow: '0 0 6px ' + c.color }"
          :title="c.name + ' ' + depositSnapshot[c.key] + '%'"
        />
      </div>

      <!-- 各渠道调节滑杆 -->
      <div v-for="c in depositControls" :key="'row-' + c.key" class="deposit-row">
        <span class="dep-icon" :style="{ color: c.color, textShadow: '0 0 4px ' + c.color }">{{ c.icon }}</span>
        <span class="dep-name">{{ c.name }}</span>
        <span class="dep-rate">{{ c.rate }}</span>
        <input
          type="range"
          class="dep-slider"
          min="0"
          max="100"
          step="1"
          :value="depositSnapshot[c.key]"
          :style="{ '--thumb': c.color }"
          @input="adjustDeposit(c.key, Number(($event.target as HTMLInputElement).value))"
        />
        <span class="dep-pct" :style="{ color: c.color }">{{ depositSnapshot[c.key] }}%</span>
      </div>

      <div class="deposit-note">总和 {{ depositTotal }}% · 调整会使其余渠道按比例变动</div>

      <!-- 全部资产项明细（含房产/车辆/持仓等非现金资产） -->
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
          <AnimatedNumber :value="faithLevel" :format="fmtRound" />
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

/* ── 存款分布调节面板 ── */
.deposit-panel {
  border-color: rgba(0, 212, 255, 0.3);
  background: linear-gradient(rgba(0, 212, 255, 0.04), rgba(0, 212, 255, 0.04)), rgba(15, 8, 35, 0.85);
}

.deposit-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.deposit-title {
  margin-bottom: 0;
}

.even-btn {
  font-family: 'DotGothic16', monospace;
  font-size: 9px;
  color: #00d4ff;
  background: rgba(0, 212, 255, 0.08);
  border: 1px solid rgba(0, 212, 255, 0.4);
  border-radius: 3px;
  padding: 1px 7px;
  cursor: pointer;
  letter-spacing: 1px;
  text-shadow: 0 0 4px rgba(0, 212, 255, 0.6);
  transition: all 0.15s ease;
}

.even-btn:hover {
  background: rgba(0, 212, 255, 0.18);
  box-shadow: 0 0 8px rgba(0, 212, 255, 0.4);
}

.deposit-stack {
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 8px;
}

.deposit-seg {
  height: 100%;
  transition: width 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.deposit-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
  font-size: 10px;
}

.dep-icon {
  width: 14px;
  text-align: center;
  flex-shrink: 0;
}

.dep-name {
  color: #c2c3c7;
  width: 34px;
  flex-shrink: 0;
  white-space: nowrap;
}

.dep-rate {
  font-size: 9px;
  color: #6a6a8a;
  width: 40px;
  flex-shrink: 0;
  white-space: nowrap;
}

.dep-slider {
  flex: 1;
  min-width: 0;
  height: 10px;
  margin: 0 2px;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
}

.dep-slider::-webkit-slider-runnable-track {
  height: 4px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 2px;
}

.dep-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 10px;
  height: 10px;
  margin-top: -3px;
  border-radius: 50%;
  background: var(--thumb, #00d4ff);
  border: 1px solid #fff;
  box-shadow: 0 0 5px var(--thumb, #00d4ff);
}

.dep-slider::-moz-range-track {
  height: 4px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 2px;
}

.dep-slider::-moz-range-thumb {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--thumb, #00d4ff);
  border: 1px solid #fff;
  box-shadow: 0 0 5px var(--thumb, #00d4ff);
}

.dep-pct {
  width: 30px;
  text-align: right;
  font-weight: bold;
  font-size: 10px;
  flex-shrink: 0;
  font-family: 'DotGothic16', monospace;
}

.deposit-note {
  font-size: 9px;
  color: #5f6a7a;
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px dashed rgba(255, 255, 255, 0.06);
  letter-spacing: 0.3px;
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
  position: relative;
}

/* 数值变化时的条内闪烁反馈（keyed 重挂载触发） */
.wb-track-flash {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  border-radius: 2px;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0) 70%);
  animation: trackFlash 0.6s ease-out forwards;
}

@media (prefers-reduced-motion: no-preference) {
  @keyframes trackFlash {
    0% { opacity: 0.9; transform: scale(0.6); }
    100% { opacity: 0; transform: scale(1.15); }
  }
}

@media (prefers-reduced-motion: reduce) {
  .wb-track-flash {
    animation: none;
    opacity: 0;
  }
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
  font-size: 10px;
  pointer-events: none;
}

.wb-tip-title {
  color: #c900ff;
  font-weight: bold;
  font-size: 10px;
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
  font-size: 10px;
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
  font-size: 10px;
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
  font-size: 10px;
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
  font-size: 10px;
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
  font-size: 10px;
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
  font-size: 10px;
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
  font-size: 10px;
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
  font-size: 10px;
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
  font-size: 10px;
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
  padding: 2px 0;
  letter-spacing: 1px;
}

.rel-deceased.divorced {
  color: #ff2d95;
  text-shadow: 0 0 4px #ff2d95;
}

.rel-na {
  font-size: 10px;
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
  font-size: 9px;
  color: #c900ff;
  border: 1px solid #c900ff80;
  padding: 0 4px;
  border-radius: 2px;
  background: rgba(201, 0, 255, 0.1);
}

.partner-trait {
  font-size: 10px;
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
  font-size: 10px;
  color: #00d4ff;
  text-shadow: 0 0 4px #00d4ff;
  margin-bottom: 2px;
}

.rel-friend-row {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
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
  font-size: 10px;
  flex-shrink: 0;
}
</style>
