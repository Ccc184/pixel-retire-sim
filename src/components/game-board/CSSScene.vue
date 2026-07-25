<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../../store/game.store.js'
import type { RetirementPathId } from '../../types/global.d.js'

const store = useGameStore()
const s = computed(() => store.state)

const pathId = computed<RetirementPathId | null>(() => s.value.retirementPath)
const pathClass = computed(() => pathId.value || 'ai_symbiote')

// 场景情绪：从当前叙事事件类型推断
const moodClass = computed(() => {
  const evt = store.currentNarrativeEvent
  if (evt?.eventType === 'crisis') return 'mood-crisis'
  if (evt?.eventType === 'milestone') return 'mood-milestone'
  if (evt?.eventType === 'branch_select') return 'mood-branch'
  const m = store.yearMood
  if (m === 'rain') return 'mood-rain'
  if (m === 'hearts') return 'mood-hearts'
  if (m === 'gold') return 'mood-gold'
  if (m === 'gloom') return 'mood-gloom'
  if (m === 'thunder') return 'mood-thunder'
  if (m === 'vignette') return 'mood-vignette'
  return 'mood-default'
})

// 场景标签：从当前叙事事件的sceneTag推断特定场景效果
const sceneTagClass = computed(() => {
  const tag = store.currentNarrativeEvent?.sceneTag
  if (!tag) return ''
  return 'scene-tag-' + tag
})

// 年龄季节色调
const ageTone = computed(() => {
  const age = s.value.currentAge
  if (age <= 28) return 'tone-spring'
  if (age <= 40) return 'tone-summer'
  if (age <= 50) return 'tone-autumn'
  return 'tone-winter'
})

// ============ 生活状态 ============
const isMarried = computed(() => s.value.isMarried)
const hasChild = computed(() => s.value.hasChild)
const hasProperty = computed(() => s.value.hasProperty)
const isUnemployed = computed(() => s.value.isUnemployed)
const isOld = computed(() => s.value.currentAge >= 50)

// 昼夜：年轻=白天, 中年=黄昏, 老年=夜晚
const timeOfDay = computed(() => {
  const age = s.value.currentAge
  if (age <= 30) return 'tod-day'
  if (age <= 45) return 'tod-dusk'
  return 'tod-night'
})

// 预生成粒子数据
const rainDrops = Array.from({ length: 20 }, (_, i) => ({
  id: i, left: Math.random() * 100, delay: Math.random() * 2,
  duration: 0.5 + Math.random() * 0.4, opacity: 0.3 + Math.random() * 0.4,
}))
const codeStreams = Array.from({ length: 12 }, (_, i) => ({
  id: i, left: (i * 8.3) % 100, delay: Math.random() * 3,
  duration: 2 + Math.random() * 3, chars: '01AI<>/{}[]'.charAt(Math.floor(Math.random() * 10)),
}))
const candleData = Array.from({ length: 14 }, (_, i) => ({
  id: i, left: 5 + i * 6.5, height: 20 + Math.random() * 50,
  green: Math.random() > 0.4, delay: Math.random() * 2,
}))
const hearts = Array.from({ length: 10 }, (_, i) => ({
  id: i, left: 10 + Math.random() * 80, delay: Math.random() * 4,
  duration: 4 + Math.random() * 3, size: 8 + Math.random() * 6,
}))
const goldParticles = Array.from({ length: 12 }, (_, i) => ({
  id: i, left: Math.random() * 100, delay: Math.random() * 5,
  duration: 5 + Math.random() * 4, size: 3 + Math.random() * 3,
}))
const dnaDots = Array.from({ length: 16 }, (_, i) => ({
  id: i, offset: i * 0.4, side: i % 2,
}))
const commentData = Array.from({ length: 8 }, (_, i) => ({
  id: i, delay: i * 0.8, text: ['666', '关注了', '学到了', '牛!', '已三连', '催更', '泪目', '这也太真实了'][i],
}))
const bubbles = Array.from({ length: 6 }, (_, i) => ({
  id: i, left: 15 + i * 12, delay: i * 0.5, size: 4 + Math.random() * 6,
}))
// AI 神经网络节点
const neuralNodes = Array.from({ length: 7 }, (_, i) => ({
  id: i, x: 15 + i * 12, y: 20 + (i % 3) * 25, delay: i * 0.4,
}))
// 服务器LED灯
const serverLeds = Array.from({ length: 10 }, (_, i) => ({
  id: i, delay: i * 0.3 + Math.random() * 0.5,
}))
// 链上矿机GPU灯
const gpuLeds = Array.from({ length: 8 }, (_, i) => ({
  id: i, delay: i * 0.25 + Math.random() * 0.3,
}))
// 弹幕额外数据
const liveComments = Array.from({ length: 6 }, (_, i) => ({
  id: i, delay: i * 1.2, top: 20 + i * 8,
  text: ['哈哈哈', '主播好强', 'awsl', '前排', '6666', '关注了'][i],
}))
// 飞鸟（游牧民）
const birds = Array.from({ length: 3 }, (_, i) => ({
  id: i, delay: i * 3, top: 10 + i * 8,
}))
// 星星（夜晚）
const nightStars = Array.from({ length: 20 }, (_, i) => ({
  id: i, left: (i * 17.3) % 100, top: (i * 11.7) % 50,
  delay: (i * 0.3) % 3, size: 1 + (i % 3),
}))
// 萤火虫（银发场景夜晚）
const fireflies = Array.from({ length: 8 }, (_, i) => ({
  id: i, left: 10 + i * 10, delay: i * 0.8,
  duration: 3 + Math.random() * 2,
}))
// 数据流字符（生物赌徒）
const geneSeq = Array.from({ length: 6 }, (_, i) => ({
  id: i, delay: i * 0.5,
  text: ['ATCG', 'GCTA', 'TTAG', 'CCGA', 'ATGC', 'GTAC'][i],
}))
</script>

<template>
  <div class="css-scene" :class="[pathClass, moodClass, ageTone, timeOfDay, sceneTagClass, { 'is-married': isMarried, 'has-child': hasChild, 'has-property': hasProperty, 'is-unemployed': isUnemployed }]">
    <!-- ============ 背景 ============ -->
    <div class="scene-bg" />

    <!-- ============ AI共生者：深夜代码之海 ============ -->
    <template v-if="pathId === 'ai_symbiote'">
      <!-- 代码雨 -->
      <div class="ai-rain-layer">
        <span
          v-for="r in codeStreams" :key="'cr'+r.id"
          class="ai-code-stream"
          :style="{ left: r.left + '%', animationDelay: r.delay + 's', animationDuration: r.duration + 's' }"
        >{{ r.chars }}</span>
      </div>
      <!-- 左侧服务器机架 -->
      <div class="ai-server-rack ai-server-left">
        <div class="server-unit" v-for="i in 4" :key="'su'+i">
          <span class="server-led" v-for="l in serverLeds.slice(0,3)" :key="'sl'+i+l.id"
            :style="{ animationDelay: l.delay + 's' }" />
        </div>
      </div>
      <!-- 右侧服务器机架 -->
      <div class="ai-server-rack ai-server-right">
        <div class="server-unit" v-for="i in 4" :key="'su2'+i">
          <span class="server-led" v-for="l in serverLeds.slice(3,6)" :key="'sl2'+i+l.id"
            :style="{ animationDelay: l.delay + 's' }" />
        </div>
      </div>
      <!-- 神经网络节点 -->
      <div class="ai-neural-net">
        <span
          v-for="n in neuralNodes" :key="'nn'+n.id"
          class="neural-node"
          :style="{ left: n.x + '%', top: n.y + '%', animationDelay: n.delay + 's' }"
        />
        <svg class="neural-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line v-for="n in neuralNodes.slice(0,6)" :key="'nl'+n.id"
            :x1="n.x" :y1="n.y" :x2="neuralNodes[(n.id+1)%7].x" :y2="neuralNodes[(n.id+1)%7].y"
            stroke="rgba(0,212,255,0.12)" stroke-width="0.3" />
        </svg>
      </div>
      <!-- 终端窗口光 -->
      <div class="ai-terminal">
        <div class="ai-terminal-bar">
          <span class="ai-term-dot" /><span class="ai-term-dot" /><span class="ai-term-dot" />
        </div>
        <div class="ai-terminal-body">
          <span class="ai-cursor">█</span>
        </div>
      </div>
      <!-- AI核心球 -->
      <div class="ai-orb">
        <div class="ai-orb-core" />
        <div class="ai-orb-ring" />
      </div>
      <!-- 咖啡杯（冒热气） -->
      <div class="ai-coffee">
        <div class="coffee-cup" />
        <div class="coffee-steam coffee-steam-1" />
        <div class="coffee-steam coffee-steam-2" />
      </div>
      <!-- 训练进度条 -->
      <div class="ai-training-bar">
        <div class="training-label">TRAINING</div>
        <div class="training-track"><div class="training-fill" /></div>
      </div>
    </template>

    <!-- ============ 链上原住民：K线深渊 ============ -->
    <template v-else-if="pathId === 'chain_native'">
      <!-- K线图 -->
      <div class="chain-chart">
        <div
          v-for="c in candleData" :key="'cd'+c.id"
          class="chain-candle"
          :class="c.green ? 'candle-green' : 'candle-red'"
          :style="{ left: c.left + '%', height: c.height + 'px', animationDelay: c.delay + 's' }"
        />
      </div>
      <!-- 网格线 -->
      <div class="chain-grid" />
      <!-- 矿机机架（带GPU闪烁灯） -->
      <div class="chain-mining-rig">
        <div class="rig-frame" />
        <div class="rig-gpu" v-for="i in 3" :key="'rg'+i">
          <span class="gpu-led" v-for="l in gpuLeds.slice(0,3)" :key="'gl'+i+l.id"
            :style="{ animationDelay: l.delay + 's' }" />
        </div>
        <div class="rig-fan" />
      </div>
      <!-- 金色币光 -->
      <div class="chain-coin-glow" />
      <!-- 钻石手图标 -->
      <div class="chain-diamond">
        <div class="diamond-gem" />
        <div class="diamond-shine" />
      </div>
      <!-- 恐惧贪婪指数仪表 -->
      <div class="chain-fear-gauge">
        <div class="gauge-label">FEAR/GREED</div>
        <div class="gauge-bar">
          <div class="gauge-needle" />
        </div>
      </div>
      <!-- 行情数字流 -->
      <div class="chain-ticker">
        <span>BTC 67,234 ↑5.2%</span>
        <span>ETH 3,456 ↑2.1%</span>
        <span>SOL 198 ↓1.3%</span>
      </div>
      <!-- HODL文字闪烁 -->
      <div class="chain-hodl">HODL</div>
    </template>

    <!-- ============ 数字游牧民：日落天涯 ============ -->
    <template v-else-if="pathId === 'digital_nomad'">
      <!-- 太阳 -->
      <div class="nomad-sun" />
      <!-- 太阳水面倒影 -->
      <div class="nomad-sun-reflect" />
      <!-- 飞机尾迹 -->
      <div class="nomad-contrail" />
      <!-- 飞鸟 -->
      <div class="nomad-birds">
        <span
          v-for="b in birds" :key="'bd'+b.id"
          class="nomad-bird"
          :style="{ top: b.top + '%', animationDelay: b.delay + 's' }"
        >~</span>
      </div>
      <!-- 棕榈树左 -->
      <div class="nomad-palm nomad-palm-left">
        <div class="palm-trunk" />
        <div class="palm-frond f1" /><div class="palm-frond f2" />
        <div class="palm-frond f3" /><div class="palm-frond f4" />
      </div>
      <!-- 棕榈树右 -->
      <div class="nomad-palm nomad-palm-right">
        <div class="palm-trunk" />
        <div class="palm-frond f1" /><div class="palm-frond f2" />
        <div class="palm-frond f3" /><div class="palm-frond f4" />
      </div>
      <!-- 海浪线 -->
      <div class="nomad-ocean">
        <div class="wave wave-1" /><div class="wave wave-2" /><div class="wave wave-3" />
      </div>
      <!-- 沙滩桌+笔记本 -->
      <div class="nomad-workdesk">
        <div class="desk-laptop" />
        <div class="desk-screen-glow" />
      </div>
      <!-- 吊床 -->
      <div class="nomad-hammock">
        <div class="hammock-curve" />
      </div>
      <!-- 椰子饮料 -->
      <div class="nomad-coconut">
        <div class="coconut-cup" />
        <div class="coconut-straw" />
      </div>
    </template>

    <!-- ============ 超级IP：聚光灯下 ============ -->
    <template v-else-if="pathId === 'super_ip'">
      <!-- 环形灯 -->
      <div class="ip-ring-light">
        <div class="ip-ring-glow" />
      </div>
      <!-- 左补光灯架 -->
      <div class="ip-light-stand ip-light-left">
        <div class="light-bulb" />
        <div class="light-pole" />
        <div class="light-base" />
      </div>
      <!-- 右补光灯架 -->
      <div class="ip-light-stand ip-light-right">
        <div class="light-bulb" />
        <div class="light-pole" />
        <div class="light-base" />
      </div>
      <!-- 摄像机三脚架 -->
      <div class="ip-camera">
        <div class="cam-body" />
        <div class="cam-lens" />
        <div class="cam-tripod-1" />
        <div class="cam-tripod-2" />
        <div class="cam-rec-led" />
      </div>
      <!-- 麦克风 -->
      <div class="ip-mic">
        <div class="mic-head" /><div class="mic-stem" />
      </div>
      <!-- 弹幕流 -->
      <div class="ip-comments">
        <span
          v-for="c in commentData" :key="'cm'+c.id"
          class="ip-comment"
          :style="{ animationDelay: c.delay + 's' }"
        >{{ c.text }}</span>
      </div>
      <!-- 额外弹幕 -->
      <div class="ip-live-comments">
        <span
          v-for="c in liveComments" :key="'lc'+c.id"
          class="live-comment"
          :style="{ top: c.top + '%', animationDelay: c.delay + 's' }"
        >{{ c.text }}</span>
      </div>
      <!-- 订阅数字 -->
      <div class="ip-sub-counter">
        <span class="sub-label">订阅</span>
        <span class="sub-num">12.3K</span>
      </div>
      <!-- LIVE标志 -->
      <div class="ip-live-badge">
        <span class="live-dot" />LIVE
      </div>
      <!-- 奖杯架 -->
      <div class="ip-trophy-shelf">
        <div class="trophy" v-for="i in 3" :key="'tr'+i" :style="{ animationDelay: (i * 0.5) + 's' }">
          <div class="trophy-cup" /><div class="trophy-base" />
        </div>
      </div>
    </template>

    <!-- ============ 银发收割者：暖光之家 ============ -->
    <template v-else-if="pathId === 'silver_economy'">
      <!-- 暖光窗 -->
      <div class="silver-window">
        <div class="window-light" />
        <div class="window-cross-h" /><div class="window-cross-v" />
      </div>
      <!-- 暖光球 -->
      <div class="silver-warm-glow" />
      <!-- 床铺剪影 -->
      <div class="silver-bed">
        <div class="bed-frame" /><div class="bed-pillow" />
      </div>
      <!-- 心电波 -->
      <div class="silver-ecg" />
      <!-- 药品柜（红十字） -->
      <div class="silver-medicine-cabinet">
        <div class="cabinet-box" />
        <div class="cabinet-cross-h" /><div class="cabinet-cross-v" />
      </div>
      <!-- 摇椅 -->
      <div class="silver-rocker">
        <div class="rocker-seat" />
        <div class="rocker-back" />
        <div class="rocker-curve" />
      </div>
      <!-- 落地钟 -->
      <div class="silver-clock">
        <div class="clock-body" />
        <div class="clock-face" />
        <div class="clock-pendulum" />
      </div>
      <!-- 盆栽 -->
      <div class="silver-plant">
        <div class="plant-pot" />
        <div class="plant-leaf plant-leaf-1" />
        <div class="plant-leaf plant-leaf-2" />
        <div class="plant-leaf plant-leaf-3" />
      </div>
      <!-- 萤火虫（夜晚氛围） -->
      <div class="silver-fireflies">
        <span
          v-for="f in fireflies" :key="'ff'+f.id"
          class="firefly"
          :style="{ left: f.left + '%', animationDelay: f.delay + 's', animationDuration: f.duration + 's' }"
        />
      </div>
      <!-- 氧气瓶 -->
      <div class="silver-oxygen">
        <div class="oxygen-tank" />
        <div class="oxygen-mask" />
      </div>
    </template>

    <!-- ============ 生物赌徒：基因迷宫 ============ -->
    <template v-else-if="pathId === 'bio_gambler'">
      <!-- DNA双螺旋 -->
      <div class="bio-dna">
        <div
          v-for="d in dnaDots" :key="'dna'+d.id"
          class="dna-dot"
          :class="d.side ? 'dna-right' : 'dna-left'"
          :style="{ animationDelay: d.offset + 's' }"
        />
      </div>
      <!-- 试管 -->
      <div class="bio-tube bio-tube-1">
        <div class="tube-body">
          <span
            v-for="b in bubbles" :key="'bb'+b.id"
            class="tube-bubble"
            :style="{ left: b.left + '%', animationDelay: b.delay + 's', width: b.size + 'px', height: b.size + 'px' }"
          />
        </div>
      </div>
      <div class="bio-tube bio-tube-2">
        <div class="tube-body" />
      </div>
      <!-- 数据屏 -->
      <div class="bio-screen">
        <div class="bio-screen-line" v-for="i in 4" :key="'bs'+i" :style="{ animationDelay: (i * 0.3) + 's' }">
          ATCG_{{ i }}: ████{{ (i * 23) % 100 }}%
        </div>
      </div>
      <!-- 显微镜 -->
      <div class="bio-microscope">
        <div class="micro-scope" />
        <div class="micro-tube" />
        <div class="micro-base" />
        <div class="micro-lens-glow" />
      </div>
      <!-- 培养皿排列 -->
      <div class="bio-petri-row">
        <div class="petri-dish" v-for="i in 3" :key="'pd'+i" :style="{ animationDelay: (i * 0.4) + 's' }">
          <div class="petri-content" />
        </div>
      </div>
      <!-- 离心机 -->
      <div class="bio-centrifuge">
        <div class="centrifuge-body" />
        <div class="centrifuge-rotor" />
      </div>
      <!-- 基因序列滚动 -->
      <div class="bio-gene-stream">
        <span
          v-for="g in geneSeq" :key="'gs'+g.id"
          class="gene-seq-text"
          :style="{ animationDelay: g.delay + 's' }"
        >{{ g.text }}</span>
      </div>
      <!-- 警告灯 -->
      <div class="bio-warning-light" />
    </template>

    <!-- ============ 默认（未选路径） ============ -->
    <template v-else>
      <div class="default-stars">
        <span v-for="i in 30" :key="'st'+i" class="default-star" :style="{
          left: (i * 7.3) % 100 + '%', top: (i * 13.7) % 60 + '%',
          animationDelay: (i * 0.2) + 's'
        }" />
      </div>
    </template>

    <!-- ============ 地面 ============ -->
    <div class="scene-ground" />

    <!-- ============ 像素小人 ============ -->
    <div class="scene-char" :class="[pathClass, { 'char-old': isOld }]">
      <div class="char-head" />
      <div class="char-body" />
      <div class="char-arm-l" />
      <div class="char-arm-r" />
      <div class="char-leg-l" />
      <div class="char-leg-r" />
      <!-- 路径专属配件 -->
      <div v-if="pathId === 'ai_symbiote'" class="char-hoodie-hood" />
      <div v-else-if="pathId === 'super_ip'" class="char-headphones" />
      <div v-else-if="pathId === 'silver_economy'" class="char-stethoscope" />
      <div v-else-if="pathId === 'bio_gambler'" class="char-goggles" />
      <div v-else-if="pathId === 'digital_nomad'" class="char-strap" />
    </div>

    <!-- ============ 生活状态修饰器 ============ -->
    <!-- 伴侣剪影（已婚） -->
    <div v-if="isMarried" class="life-partner" :class="pathClass">
      <div class="partner-head" />
      <div class="partner-body" />
      <div class="partner-arm-l" />
      <div class="partner-arm-r" />
      <div class="partner-leg-l" />
      <div class="partner-leg-r" />
      <div class="partner-heart">♥</div>
    </div>
    <!-- 孩子剪影（有娃） -->
    <div v-if="hasChild" class="life-child" :class="pathClass">
      <div class="child-head" />
      <div class="child-body" />
      <div class="child-arm-l" />
      <div class="child-arm-r" />
      <div class="child-leg-l" />
      <div class="child-leg-r" />
    </div>
    <!-- 房产剪影（有房） -->
    <div v-if="hasProperty" class="life-house">
      <div class="house-roof" />
      <div class="house-wall" />
      <div class="house-door" />
      <div class="house-window-l" />
      <div class="house-window-r" />
      <div class="house-chimney" />
      <div class="house-smoke" />
    </div>
    <!-- 失业指示牌 -->
    <div v-if="isUnemployed" class="life-unemployed">
      <div class="unemployed-sign">待业</div>
      <div class="unemployed-gloom" />
    </div>

    <!-- ============ 情绪叠加层 ============ -->
    <!-- 雨 -->
    <div v-if="moodClass === 'mood-rain'" class="weather-rain">
      <span v-for="d in rainDrops" :key="'rd'+d.id" class="rain-drop" :style="{
        left: d.left + '%', animationDelay: d.delay + 's',
        animationDuration: d.duration + 's', opacity: d.opacity
      }" />
    </div>
    <!-- 飘心 -->
    <div v-if="moodClass === 'mood-hearts'" class="weather-hearts">
      <span v-for="h in hearts" :key="'ht'+h.id" class="heart-particle" :style="{
        left: h.left + '%', animationDelay: h.delay + 's',
        animationDuration: h.duration + 's', fontSize: h.size + 'px'
      }">♥</span>
    </div>
    <!-- 金光 -->
    <div v-if="moodClass === 'mood-gold' || moodClass === 'mood-milestone'" class="weather-gold">
      <span v-for="g in goldParticles" :key="'gp'+g.id" class="gold-particle" :style="{
        left: g.left + '%', animationDelay: g.delay + 's',
        animationDuration: g.duration + 's', width: g.size + 'px', height: g.size + 'px'
      }" />
    </div>
    <!-- 危机红光 -->
    <div v-if="moodClass === 'mood-crisis'" class="crisis-overlay" />
    <!-- 暗角 -->
    <div v-if="moodClass === 'mood-vignette'" class="vignette-overlay" />
    <!-- 雷电 -->
    <div v-if="moodClass === 'mood-thunder'" class="thunder-overlay" />
    <!-- 分支选择光波 -->
    <div v-if="moodClass === 'mood-branch'" class="branch-overlay" />

    <!-- ============ 夜晚星空（老年/夜晚时段） ============ -->
    <div v-if="timeOfDay === 'tod-night'" class="night-sky">
      <span
        v-for="ns in nightStars" :key="'ns'+ns.id"
        class="night-star"
        :style="{ left: ns.left + '%', top: ns.top + '%', animationDelay: ns.delay + 's', width: ns.size + 'px', height: ns.size + 'px' }"
      />
    </div>

    <!-- ============ 年龄色调 ============ -->
    <div class="age-tone-overlay" :class="ageTone" />

    <!-- ============ 资产获得闪光 ============ -->
    <transition name="asset-flash">
      <div v-if="store.assetAcquired" class="asset-acquire" :key="store.assetAcquired?.label">
        <span class="asset-text">{{ store.assetAcquired?.label }}</span>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* ================================================================
   场景容器
   ================================================================ */
.css-scene {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: 8px / 7px;
  background: #050608;
}

/* ================================================================
   通用背景层
   ================================================================ */
.scene-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

/* ================================================================
   通用地面
   ================================================================ */
.scene-ground {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 18%;
  z-index: 5;
}

/* ================================================================
   AI共生者：深夜代码之海
   ================================================================ */
.ai_symbiote .scene-bg {
  background: linear-gradient(180deg, #0a0e27 0%, #0d1a3a 40%, #050818 100%);
}
.ai_symbiote .scene-ground {
  background: linear-gradient(180deg, #0a1525 0%, #050810 100%);
  border-top: 1px solid rgba(0, 212, 255, 0.15);
  box-shadow: 0 -2px 8px rgba(0, 212, 255, 0.08);
}

/* 代码雨 */
.ai-rain-layer { position: absolute; inset: 0; z-index: 1; overflow: hidden; }
.ai-code-stream {
  position: absolute;
  top: -20px;
  font-family: 'DotGothic16', monospace;
  font-size: 10px;
  color: rgba(0, 212, 255, 0.5);
  text-shadow: 0 0 4px rgba(0, 212, 255, 0.4);
  animation: codeFall linear infinite;
  white-space: pre;
  letter-spacing: 2px;
}
@keyframes codeFall {
  0% { transform: translateY(-20px); opacity: 0; }
  10% { opacity: 0.6; }
  90% { opacity: 0.6; }
  100% { transform: translateY(100%); opacity: 0; }
}

/* 终端窗口 */
.ai-terminal {
  position: absolute;
  top: 12%;
  left: 12%;
  width: 45%;
  height: 30%;
  z-index: 2;
  background: rgba(0, 15, 30, 0.85);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 4px 4px 0 0;
  box-shadow: 0 0 12px rgba(0, 212, 255, 0.15), inset 0 0 20px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}
.ai-terminal-bar {
  height: 14%;
  background: rgba(0, 30, 50, 0.9);
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 0 5px;
  border-bottom: 1px solid rgba(0, 212, 255, 0.15);
}
.ai-term-dot {
  width: 4px; height: 4px; border-radius: 50%;
  background: rgba(0, 212, 255, 0.4);
}
.ai-term-dot:first-child { background: rgba(255, 100, 100, 0.5); }
.ai-term-dot:nth-child(2) { background: rgba(255, 200, 100, 0.5); }
.ai-terminal-body {
  padding: 4px 6px;
  font-family: 'DotGothic16', monospace;
  font-size: 7px;
  color: rgba(0, 255, 136, 0.6);
}
.ai-cursor {
  animation: cursorBlink 1s step-end infinite;
}
@keyframes cursorBlink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* AI核心球 */
.ai-orb {
  position: absolute;
  top: 20%;
  right: 15%;
  width: 36px;
  height: 36px;
  z-index: 3;
}
.ai-orb-core {
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, rgba(0, 212, 255, 0.8), rgba(0, 100, 200, 0.4) 60%, transparent 100%);
  box-shadow: 0 0 12px rgba(0, 212, 255, 0.5), 0 0 24px rgba(0, 212, 255, 0.25);
  animation: orbPulse 3s ease-in-out infinite;
}
.ai-orb-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid rgba(0, 212, 255, 0.3);
  animation: orbRing 3s ease-in-out infinite;
}
@keyframes orbPulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.15); opacity: 1; }
}
@keyframes orbRing {
  0%, 100% { transform: scale(1); opacity: 0.3; }
  50% { transform: scale(1.3); opacity: 0; }
}

/* ================================================================
   链上原住民：K线深渊
   ================================================================ */
.chain_native .scene-bg {
  background: linear-gradient(180deg, #1a0e00 0%, #120800 50%, #080400 100%);
}
.chain_native .scene-ground {
  background: linear-gradient(180deg, #150a00 0%, #0a0500 100%);
  border-top: 1px solid rgba(255, 136, 0, 0.15);
}

/* K线网格 */
.chain-grid {
  position: absolute;
  inset: 0;
  z-index: 1;
  background-image:
    linear-gradient(rgba(255, 136, 0, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 136, 0, 0.04) 1px, transparent 1px);
  background-size: 20px 20px;
}

/* K线蜡烛 */
.chain-chart {
  position: absolute;
  bottom: 18%;
  left: 0;
  right: 0;
  height: 55%;
  z-index: 2;
}
.chain-candle {
  position: absolute;
  bottom: 0;
  width: 3px;
  border-radius: 1px;
  animation: candleRise ease-out forwards;
  opacity: 0;
}
.candle-green {
  background: linear-gradient(180deg, #00ff88, #00cc66);
  box-shadow: 0 0 4px rgba(0, 255, 136, 0.4);
}
.candle-red {
  background: linear-gradient(180deg, #ff4466, #cc2244);
  box-shadow: 0 0 4px rgba(255, 68, 102, 0.4);
}
@keyframes candleRise {
  0% { opacity: 0; transform: scaleY(0); transform-origin: bottom; }
  20% { opacity: 1; }
  100% { opacity: 0.7; transform: scaleY(1); }
}

/* 金色币光 */
.chain-coin-glow {
  position: absolute;
  top: 10%;
  right: 10%;
  width: 40px;
  height: 40px;
  z-index: 2;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 200, 0, 0.15), transparent 70%);
  animation: coinGlow 4s ease-in-out infinite;
}
@keyframes coinGlow {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

/* 行情滚动条 */
.chain-ticker {
  position: absolute;
  top: 4%;
  left: 0;
  right: 0;
  z-index: 3;
  display: flex;
  gap: 12px;
  font-family: 'DotGothic16', monospace;
  font-size: 7px;
  padding: 2px 6px;
  overflow: hidden;
  animation: tickerScroll 8s linear infinite;
  white-space: nowrap;
}
.chain-ticker span {
  flex-shrink: 0;
}
@keyframes tickerScroll {
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}

/* ================================================================
   数字游牧民：日落天涯
   ================================================================ */
.digital_nomad .scene-bg {
  background: linear-gradient(180deg, #ff6b6b 0%, #ff8e53 25%, #feca57 45%, #48dbfb 70%, #0a5a8a 100%);
}
.digital_nomad .scene-ground {
  background: linear-gradient(180deg, #c89b5e 0%, #8a6d3f 50%, #5a4520 100%);
}

/* 太阳 */
.nomad-sun {
  position: absolute;
  top: 25%;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 50px;
  z-index: 1;
  border-radius: 50%;
  background: radial-gradient(circle, #fff8dc, #ffcc66 40%, #ff8800 80%);
  box-shadow: 0 0 30px rgba(255, 200, 100, 0.6), 0 0 60px rgba(255, 150, 50, 0.3);
  animation: sunGlow 4s ease-in-out infinite;
}
@keyframes sunGlow {
  0%, 100% { box-shadow: 0 0 30px rgba(255, 200, 100, 0.6), 0 0 60px rgba(255, 150, 50, 0.3); }
  50% { box-shadow: 0 0 40px rgba(255, 200, 100, 0.8), 0 0 80px rgba(255, 150, 50, 0.4); }
}

/* 太阳水面倒影 */
.nomad-sun-reflect {
  position: absolute;
  bottom: 12%;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 8px;
  z-index: 4;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(255, 200, 100, 0.3), transparent 70%);
  animation: reflectShimmer 3s ease-in-out infinite;
}
@keyframes reflectShimmer {
  0%, 100% { opacity: 0.4; width: 30px; }
  50% { opacity: 0.7; width: 36px; }
}

/* 棕榈树 */
.nomad-palm {
  position: absolute;
  bottom: 18%;
  z-index: 3;
}
.nomad-palm-left { left: 5%; }
.nomad-palm-right { right: 5%; transform: scaleX(-1); }
.palm-trunk {
  width: 5px;
  height: 40px;
  background: linear-gradient(180deg, #3d2817, #2a1a0e);
  border-radius: 2px;
  margin: 0 auto;
}
.palm-frond {
  position: absolute;
  top: -2px;
  width: 22px;
  height: 4px;
  background: linear-gradient(90deg, #1a3a1a, #2d5a2d);
  border-radius: 50% 50% 0 0;
  transform-origin: right center;
}
.palm-frond.f1 { left: -20px; transform: rotate(-30deg); }
.palm-frond.f2 { left: -18px; top: 2px; transform: rotate(-10deg); }
.palm-frond.f3 { left: 2px; top: 2px; transform: rotate(10deg) scaleX(-1); transform-origin: left center; }
.palm-frond.f4 { left: 4px; top: -2px; transform: rotate(30deg) scaleX(-1); transform-origin: left center; }

/* 海洋 */
.nomad-ocean {
  position: absolute;
  bottom: 18%;
  left: 0;
  right: 0;
  height: 8%;
  z-index: 4;
  overflow: hidden;
}
.wave {
  position: absolute;
  left: -50%;
  right: -50%;
  height: 2px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}
.wave-1 { top: 20%; animation: waveMove 3s ease-in-out infinite; }
.wave-2 { top: 50%; animation: waveMove 4s ease-in-out infinite reverse; }
.wave-3 { top: 80%; animation: waveMove 3.5s ease-in-out infinite; }
@keyframes waveMove {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(15px); }
}

/* ================================================================
   超级IP：聚光灯下
   ================================================================ */
.super_ip .scene-bg {
  background: radial-gradient(ellipse at 50% 30%, #2a1045 0%, #1a0a2e 40%, #0a0518 100%);
}
.super_ip .scene-ground {
  background: linear-gradient(180deg, #1a0a2e 0%, #0a0518 100%);
  border-top: 1px solid rgba(255, 45, 149, 0.1);
}

/* 环形灯 */
.ip-ring-light {
  position: absolute;
  top: 8%;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 50px;
  z-index: 2;
}
.ip-ring-glow {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid rgba(255, 220, 100, 0.3);
  box-shadow:
    0 0 15px rgba(255, 200, 100, 0.3),
    inset 0 0 15px rgba(255, 200, 100, 0.15);
  animation: ringPulse 2s ease-in-out infinite;
}
@keyframes ringPulse {
  0%, 100% { opacity: 0.5; box-shadow: 0 0 15px rgba(255, 200, 100, 0.3), inset 0 0 15px rgba(255, 200, 100, 0.15); }
  50% { opacity: 0.8; box-shadow: 0 0 25px rgba(255, 200, 100, 0.5), inset 0 0 20px rgba(255, 200, 100, 0.25); }
}

/* 麦克风 */
.ip-mic {
  position: absolute;
  bottom: 20%;
  right: 15%;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.mic-head {
  width: 8px;
  height: 14px;
  background: linear-gradient(180deg, #444, #222);
  border-radius: 4px 4px 2px 2px;
  box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.5);
}
.mic-stem {
  width: 2px;
  height: 16px;
  background: linear-gradient(180deg, #333, #111);
}

/* 弹幕 */
.ip-comments {
  position: absolute;
  top: 25%;
  left: 0;
  right: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 8px;
  overflow: hidden;
  height: 30%;
}
.ip-comment {
  font-size: 7px;
  color: rgba(255, 255, 255, 0.5);
  font-family: 'DotGothic16', monospace;
  animation: commentFloat 6s linear infinite;
  opacity: 0;
  white-space: nowrap;
}
@keyframes commentFloat {
  0% { opacity: 0; transform: translateX(-20px); }
  10% { opacity: 0.5; }
  80% { opacity: 0.5; }
  100% { opacity: 0; transform: translateX(20px); }
}

/* 订阅数 */
.ip-sub-counter {
  position: absolute;
  top: 5%;
  right: 6%;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-family: 'DotGothic16', monospace;
}
.sub-label { font-size: 6px; color: rgba(255, 255, 255, 0.3); }
.sub-num { font-size: 10px; color: rgba(255, 45, 149, 0.6); text-shadow: 0 0 4px rgba(255, 45, 149, 0.3); }

/* ================================================================
   银发收割者：暖光之家
   ================================================================ */
.silver_economy .scene-bg {
  background: linear-gradient(180deg, #2d1b00 0%, #1a1000 50%, #0d0800 100%);
}
.silver_economy .scene-ground {
  background: linear-gradient(180deg, #2a1c08 0%, #150f04 100%);
  border-top: 1px solid rgba(255, 180, 80, 0.1);
}

/* 暖光窗 */
.silver-window {
  position: absolute;
  top: 10%;
  left: 10%;
  width: 30%;
  height: 35%;
  z-index: 2;
}
.window-light {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse, rgba(255, 200, 100, 0.25), transparent 70%);
  border: 2px solid rgba(255, 180, 80, 0.15);
  border-radius: 3px;
  animation: windowGlow 4s ease-in-out infinite;
}
@keyframes windowGlow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}
.window-cross-h {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(255, 180, 80, 0.1);
}
.window-cross-v {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(255, 180, 80, 0.1);
}

/* 暖光球 */
.silver-warm-glow {
  position: absolute;
  top: 20%;
  right: 15%;
  width: 50px;
  height: 50px;
  z-index: 2;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 180, 80, 0.12), transparent 70%);
  animation: warmBreath 5s ease-in-out infinite;
}
@keyframes warmBreath {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

/* 床铺剪影 */
.silver-bed {
  position: absolute;
  bottom: 18%;
  right: 8%;
  width: 25%;
  height: 12%;
  z-index: 3;
  display: flex;
  align-items: flex-end;
}
.bed-frame {
  flex: 1;
  height: 8px;
  background: linear-gradient(180deg, #3d2e1a, #2a1f0e);
  border-radius: 2px;
}
.bed-pillow {
  width: 10px;
  height: 5px;
  background: #4a3a20;
  border-radius: 2px;
  margin-right: 2px;
}

/* 心电波 */
.silver-ecg {
  position: absolute;
  bottom: 8%;
  left: 5%;
  width: 30%;
  height: 16px;
  z-index: 3;
  background:
    repeating-linear-gradient(
      90deg,
      transparent 0px, transparent 8px,
      rgba(0, 255, 136, 0.3) 8px, rgba(0, 255, 136, 0.3) 9px,
      transparent 9px, transparent 12px,
      rgba(0, 255, 136, 0.5) 12px, rgba(0, 255, 136, 0.5) 13px,
      transparent 13px, transparent 30px
    );
  animation: ecgScroll 2s linear infinite;
}
@keyframes ecgScroll {
  0% { background-position: 0 0; }
  100% { background-position: -30px 0; }
}

/* ================================================================
   生物赌徒：基因迷宫
   ================================================================ */
.bio_gambler .scene-bg {
  background: linear-gradient(180deg, #001a0e 0%, #000d1a 50%, #000810 100%);
}
.bio_gambler .scene-ground {
  background: linear-gradient(180deg, #001510 0%, #000805 100%);
  border-top: 1px solid rgba(0, 255, 136, 0.1);
}

/* DNA双螺旋 */
.bio-dna {
  position: absolute;
  top: 8%;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 50%;
  z-index: 2;
}
.dna-dot {
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  left: 50%;
  animation: dnaRotate 3s ease-in-out infinite;
}
.dna-left {
  background: rgba(0, 255, 136, 0.5);
  box-shadow: 0 0 4px rgba(0, 255, 136, 0.3);
}
.dna-right {
  background: rgba(0, 212, 255, 0.5);
  box-shadow: 0 0 4px rgba(0, 212, 255, 0.3);
}
@keyframes dnaRotate {
  0%, 100% { transform: translateX(-12px); z-index: 2; }
  50% { transform: translateX(8px); z-index: 3; }
}
.dna-dot:nth-child(odd) { animation-delay: var(--delay, 0s); }
.dna-dot { top: calc(var(--n, 0) * 12px); }

/* 试管 */
.bio-tube {
  position: absolute;
  bottom: 18%;
  z-index: 3;
}
.bio-tube-1 { left: 12%; }
.bio-tube-2 { left: 20%; }
.tube-body {
  width: 8px;
  height: 30px;
  background: linear-gradient(180deg, transparent 20%, rgba(0, 255, 136, 0.2) 30%, rgba(0, 255, 136, 0.3) 100%);
  border: 1px solid rgba(0, 255, 136, 0.2);
  border-radius: 0 0 4px 4px;
  position: relative;
  overflow: hidden;
}
.tube-bubble {
  position: absolute;
  bottom: 0;
  border-radius: 50%;
  background: rgba(0, 255, 136, 0.4);
  animation: bubbleRise linear infinite;
}
@keyframes bubbleRise {
  0% { transform: translateY(0); opacity: 0; }
  20% { opacity: 0.6; }
  100% { transform: translateY(-25px); opacity: 0; }
}

/* 数据屏 */
.bio-screen {
  position: absolute;
  top: 10%;
  right: 8%;
  width: 35%;
  z-index: 2;
  background: rgba(0, 20, 10, 0.7);
  border: 1px solid rgba(0, 255, 136, 0.15);
  border-radius: 3px;
  padding: 4px;
  font-family: 'DotGothic16', monospace;
  font-size: 6px;
}
.bio-screen-line {
  color: rgba(0, 255, 136, 0.4);
  line-height: 1.4;
  animation: screenFlicker 4s ease-in-out infinite;
}
@keyframes screenFlicker {
  0%, 90%, 100% { opacity: 0.4; }
  93% { opacity: 0.2; }
  96% { opacity: 0.5; }
}

/* ================================================================
   默认场景（未选路径）
   ================================================================ */
.default-stars { position: absolute; inset: 0; z-index: 1; }
.default-star {
  position: absolute;
  width: 2px;
  height: 2px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  animation: starTwinkle 3s ease-in-out infinite;
}
@keyframes starTwinkle {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.7; }
}

/* ================================================================
   像素小人
   ================================================================ */
.scene-char {
  position: absolute;
  bottom: 16%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 6;
  width: 16px;
  height: 28px;
  animation: charBreath 3s ease-in-out infinite;
}
@keyframes charBreath {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-1px); }
}
.char-head {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 7px;
  height: 7px;
  background: #e8c4a0;
  border-radius: 2px;
  z-index: 2;
}
.char-body {
  position: absolute;
  top: 7px;
  left: 50%;
  transform: translateX(-50%);
  width: 9px;
  height: 11px;
  border-radius: 2px 2px 1px 1px;
  z-index: 1;
}
.char-arm-l, .char-arm-r {
  position: absolute;
  top: 8px;
  width: 2px;
  height: 8px;
  border-radius: 1px;
  z-index: 3;
}
.char-arm-l { left: 1px; }
.char-arm-r { right: 1px; }
.char-leg-l, .char-leg-r {
  position: absolute;
  top: 18px;
  width: 3px;
  height: 8px;
  border-radius: 0 0 1px 1px;
  z-index: 0;
}
.char-leg-l { left: 4px; }
.char-leg-r { right: 4px; }

/* 老年角色：灰发+驼背 */
.char-old .char-head { background: #c0c0c0; }
.char-old { animation: charBreathOld 4s ease-in-out infinite; }
@keyframes charBreathOld {
  0%, 100% { transform: translateX(-50%) translateY(0) rotate(0deg); }
  50% { transform: translateX(-50%) translateY(-1px) rotate(1deg); }
}

/* 路径专属身体颜色 */
.ai_symbiote .char-body { background: #1a3a5a; }
.ai_symbiote .char-arm-l, .ai_symbiote .char-arm-r { background: #1a3a5a; }
.ai_symbiote .char-leg-l, .ai_symbiote .char-leg-r { background: #1a2535; }

.chain_native .char-body { background: #3a2a00; }
.chain_native .char-arm-l, .chain_native .char-arm-r { background: #3a2a00; }
.chain_native .char-leg-l, .chain_native .char-leg-r { background: #2a1f00; }

.digital_nomad .char-body { background: #2d6a4f; }
.digital_nomad .char-arm-l, .digital_nomad .char-arm-r { background: #2d6a4f; }
.digital_nomad .char-leg-l, .digital_nomad .char-leg-r { background: #1a4030; }

.super_ip .char-body { background: #6a1a4a; }
.super_ip .char-arm-l, .super_ip .char-arm-r { background: #6a1a4a; }
.super_ip .char-leg-l, .super_ip .char-leg-r { background: #3a0a2a; }

.silver_economy .char-body { background: #e8e8e8; }
.silver_economy .char-arm-l, .silver_economy .char-arm-r { background: #e8e8e8; }
.silver_economy .char-leg-l, .silver_economy .char-leg-r { background: #3a3a3a; }

.bio_gambler .char-body { background: #e8e8e8; }
.bio_gambler .char-arm-l, .bio_gambler .char-arm-r { background: #e8e8e8; }
.bio_gambler .char-leg-l, .bio_gambler .char-leg-r { background: #2a2a2a; }

/* 配件 */
.char-hoodie-hood {
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 9px;
  height: 4px;
  background: #1a3a5a;
  border-radius: 5px 5px 0 0;
  z-index: 3;
}
.char-headphones {
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 11px;
  height: 5px;
  border: 1px solid #ff2d95;
  border-bottom: none;
  border-radius: 6px 6px 0 0;
  z-index: 3;
}
.char-stethoscope {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 4px;
  border: 1px solid #4488aa;
  border-top: none;
  border-radius: 0 0 4px 4px;
  z-index: 3;
}
.char-goggles {
  position: absolute;
  top: 1px;
  left: 50%;
  transform: translateX(-50%);
  width: 9px;
  height: 3px;
  background: rgba(0, 255, 136, 0.3);
  border: 1px solid rgba(0, 255, 136, 0.5);
  border-radius: 2px;
  z-index: 3;
}
.char-strap {
  position: absolute;
  top: 6px;
  left: 50%;
  transform: translateX(-50%);
  width: 12px;
  height: 2px;
  background: #8a6d3f;
  border-radius: 1px;
  z-index: 3;
}

/* ================================================================
   天气/情绪叠加层
   ================================================================ */
.weather-rain { position: absolute; inset: 0; z-index: 7; overflow: hidden; }
.rain-drop {
  position: absolute;
  top: -10px;
  width: 1px;
  height: 10px;
  background: linear-gradient(to bottom, transparent, rgba(100, 180, 255, 0.6));
  animation: rainFall linear infinite;
}
@keyframes rainFall {
  0% { transform: translateY(-10px); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translateY(100%); opacity: 0; }
}

.weather-hearts { position: absolute; inset: 0; z-index: 7; overflow: hidden; }
.heart-particle {
  position: absolute;
  bottom: -20px;
  text-shadow: 0 0 4px currentColor;
  color: #ff2d95;
  animation: heartFloat ease-in-out infinite;
  opacity: 0;
}
@keyframes heartFloat {
  0% { transform: translateY(0) scale(0.5); opacity: 0; }
  10% { opacity: 0.7; }
  100% { transform: translateY(-100%) scale(0.8); opacity: 0; }
}

.weather-gold { position: absolute; inset: 0; z-index: 7; overflow: hidden; }
.gold-particle {
  position: absolute;
  bottom: -5px;
  background: #ffd700;
  box-shadow: 0 0 4px #ffd700;
  border-radius: 50%;
  animation: goldRise ease-out infinite;
  opacity: 0;
}
@keyframes goldRise {
  0% { transform: translateY(0); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translateY(-100%); opacity: 0; }
}

/* 危机红光 */
.crisis-overlay {
  position: absolute;
  inset: 0;
  z-index: 8;
  pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 30%, rgba(255, 0, 0, 0.15) 100%);
  animation: crisisPulse 1.5s ease-in-out infinite;
}
@keyframes crisisPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* 暗角 */
.vignette-overlay {
  position: absolute;
  inset: 0;
  z-index: 8;
  pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 35%, rgba(0, 0, 0, 0.5) 100%);
  animation: vignettePulse 3s ease-in-out infinite alternate;
}
@keyframes vignettePulse {
  from { opacity: 0.5; }
  to { opacity: 0.8; }
}

/* 雷电 */
.thunder-overlay {
  position: absolute;
  inset: 0;
  z-index: 8;
  pointer-events: none;
  background: rgba(255, 255, 255, 0.8);
  opacity: 0;
  animation: thunderFlash 1.5s ease-out infinite;
}
@keyframes thunderFlash {
  0% { opacity: 0; }
  5% { opacity: 0.6; }
  10% { opacity: 0; }
  15% { opacity: 0.3; }
  20% { opacity: 0; }
  100% { opacity: 0; }
}

/* 分支选择光波 */
.branch-overlay {
  position: absolute;
  inset: 0;
  z-index: 8;
  pointer-events: none;
  background: radial-gradient(ellipse at center, rgba(255, 136, 0, 0.1), transparent 60%);
  animation: branchWave 2s ease-in-out infinite;
}
@keyframes branchWave {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 0.6; transform: scale(1.1); }
}

/* ================================================================
   年龄色调
   ================================================================ */
.age-tone-overlay {
  position: absolute;
  inset: 0;
  z-index: 9;
  pointer-events: none;
  mix-blend-mode: overlay;
  opacity: 0.08;
}
.tone-spring { background: radial-gradient(ellipse at 30% 20%, rgba(100, 255, 150, 0.3), transparent 60%); }
.tone-summer { background: radial-gradient(ellipse at 50% 10%, rgba(255, 200, 50, 0.3), transparent 60%); }
.tone-autumn { background: radial-gradient(ellipse at 50% 10%, rgba(255, 120, 30, 0.3), transparent 60%); }
.tone-winter { background: radial-gradient(ellipse at 50% 50%, rgba(100, 150, 255, 0.3), transparent 60%); }

/* ================================================================
   资产获得闪光
   ================================================================ */
.asset-acquire {
  position: absolute;
  inset: 0;
  z-index: 12;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%);
}
.asset-text {
  color: #ffd700;
  font-size: 14px;
  font-weight: bold;
  text-shadow: 0 0 6px #ffd700, 0 0 12px #ffaa00;
}
.asset-flash-enter-active { transition: all 0.3s ease-out; }
.asset-flash-enter-from { opacity: 0; transform: scale(0.5); }
.asset-flash-enter-to { opacity: 1; transform: scale(1); }

/* ================================================================
   昼夜变化
   ================================================================ */
.tod-day .scene-bg { filter: brightness(1); }
.tod-dusk .scene-bg { filter: brightness(0.85) sepia(0.15); }
.tod-night .scene-bg { filter: brightness(0.6) hue-rotate(200deg); }

/* 夜晚星空 */
.night-sky { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
.night-star {
  position: absolute;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  animation: starTwinkle 3s ease-in-out infinite;
}

/* ================================================================
   AI共生者 - 扩展元素
   ================================================================ */
/* 服务器机架 */
.ai-server-rack {
  position: absolute;
  bottom: 18%;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ai-server-left { left: 2%; }
.ai-server-right { right: 2%; }
.server-unit {
  width: 16px;
  height: 8px;
  background: rgba(10, 20, 40, 0.8);
  border: 1px solid rgba(0, 212, 255, 0.1);
  border-radius: 1px;
  display: flex;
  gap: 2px;
  align-items: center;
  padding: 0 2px;
}
.server-led {
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: rgba(0, 255, 136, 0.4);
  animation: serverLedBlink 1s ease-in-out infinite;
}
.server-led:nth-child(2) { background: rgba(0, 212, 255, 0.4); animation-delay: 0.3s; }
.server-led:nth-child(3) { background: rgba(255, 200, 0, 0.4); animation-delay: 0.6s; }
@keyframes serverLedBlink {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; box-shadow: 0 0 3px currentColor; }
}

/* 神经网络 */
.ai-neural-net { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
.neural-node {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(0, 212, 255, 0.4);
  box-shadow: 0 0 4px rgba(0, 212, 255, 0.3);
  animation: neuralPulse 2s ease-in-out infinite;
}
@keyframes neuralPulse {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 0.8; transform: scale(1.3); }
}
.neural-lines { position: absolute; inset: 0; width: 100%; height: 100%; }

/* 咖啡杯 */
.ai-coffee {
  position: absolute;
  bottom: 20%;
  left: 8%;
  z-index: 3;
}
.coffee-cup {
  width: 8px;
  height: 7px;
  background: linear-gradient(180deg, #d4a060, #8a6030);
  border-radius: 0 0 3px 3px;
  border: 1px solid #5a3a20;
}
.coffee-steam {
  position: absolute;
  width: 2px;
  height: 6px;
  background: rgba(200, 200, 220, 0.2);
  border-radius: 50%;
  animation: steamRise 2s ease-out infinite;
}
.coffee-steam-1 { top: -8px; left: 2px; }
.coffee-steam-2 { top: -8px; left: 5px; animation-delay: 0.5s; }
@keyframes steamRise {
  0% { transform: translateY(0) scale(0.5); opacity: 0; }
  30% { opacity: 0.5; }
  100% { transform: translateY(-10px) scale(1.5); opacity: 0; }
}

/* 训练进度条 */
.ai-training-bar {
  position: absolute;
  bottom: 6%;
  right: 8%;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 3px;
}
.training-label {
  font-family: 'DotGothic16', monospace;
  font-size: 5px;
  color: rgba(0, 255, 136, 0.4);
}
.training-track {
  width: 30px;
  height: 3px;
  background: rgba(0, 30, 20, 0.6);
  border-radius: 1px;
  overflow: hidden;
}
.training-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ff88, #00cc66);
  box-shadow: 0 0 3px rgba(0, 255, 136, 0.5);
  animation: trainProgress 4s ease-in-out infinite;
}
@keyframes trainProgress {
  0% { width: 20%; }
  50% { width: 85%; }
  100% { width: 20%; }
}

/* ================================================================
   链上原住民 - 扩展元素
   ================================================================ */
/* 矿机 */
.chain-mining-rig {
  position: absolute;
  bottom: 20%;
  left: 6%;
  z-index: 2;
}
.rig-frame {
  width: 20px;
  height: 24px;
  background: rgba(20, 10, 0, 0.7);
  border: 1px solid rgba(255, 136, 0, 0.15);
  border-radius: 2px;
}
.rig-gpu {
  position: absolute;
  left: 2px;
  width: 16px;
  height: 5px;
  background: rgba(30, 15, 0, 0.8);
  border: 1px solid rgba(0, 255, 136, 0.1);
  border-radius: 1px;
  display: flex;
  gap: 2px;
  align-items: center;
  padding: 0 2px;
}
.rig-gpu:nth-child(2) { top: 3px; }
.rig-gpu:nth-child(3) { top: 10px; }
.rig-gpu:nth-child(4) { top: 17px; }
.gpu-led {
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: rgba(0, 255, 136, 0.5);
  animation: gpuBlink 0.5s ease-in-out infinite;
}
@keyframes gpuBlink {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; box-shadow: 0 0 3px rgba(0, 255, 136, 0.6); }
}
.rig-fan {
  position: absolute;
  right: 2px;
  top: 2px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  border: 1px solid rgba(255, 136, 0, 0.2);
  animation: fanSpin 0.3s linear infinite;
}
.rig-fan::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(255, 136, 0, 0.3);
}
@keyframes fanSpin {
  100% { transform: rotate(360deg); }
}

/* 钻石手 */
.chain-diamond {
  position: absolute;
  top: 15%;
  left: 8%;
  z-index: 3;
}
.diamond-gem {
  width: 10px;
  height: 10px;
  background: linear-gradient(135deg, #00ffff, #0088ff);
  clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);
  box-shadow: 0 0 6px rgba(0, 255, 255, 0.4);
  animation: diamondFloat 3s ease-in-out infinite;
}
.diamond-shine {
  position: absolute;
  top: 1px;
  left: 3px;
  width: 3px;
  height: 3px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  animation: diamondShine 2s ease-in-out infinite;
}
@keyframes diamondFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-3px) rotate(5deg); }
}
@keyframes diamondShine {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

/* 恐惧贪婪仪表 */
.chain-fear-gauge {
  position: absolute;
  bottom: 6%;
  right: 6%;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.gauge-label {
  font-family: 'DotGothic16', monospace;
  font-size: 5px;
  color: rgba(255, 136, 0, 0.4);
}
.gauge-bar {
  width: 30px;
  height: 4px;
  background: linear-gradient(90deg, #ff4466, #ffaa00, #00ff88);
  border-radius: 2px;
  position: relative;
}
.gauge-needle {
  position: absolute;
  top: -2px;
  left: 60%;
  width: 1px;
  height: 8px;
  background: rgba(255, 255, 255, 0.6);
  animation: needleSway 3s ease-in-out infinite;
}
@keyframes needleSway {
  0%, 100% { left: 50%; }
  50% { left: 75%; }
}

/* HODL文字 */
.chain-hodl {
  position: absolute;
  top: 30%;
  right: 12%;
  z-index: 3;
  font-family: 'DotGothic16', monospace;
  font-size: 8px;
  font-weight: bold;
  color: rgba(0, 255, 136, 0.3);
  text-shadow: 0 0 4px rgba(0, 255, 136, 0.2);
  animation: hodlBlink 2s ease-in-out infinite;
}
@keyframes hodlBlink {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.6; }
}

/* ================================================================
   数字游牧民 - 扩展元素
   ================================================================ */
/* 飞机尾迹 */
.nomad-contrail {
  position: absolute;
  top: 15%;
  left: -10%;
  width: 40%;
  height: 1px;
  z-index: 1;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: contrailMove 8s linear infinite;
}
@keyframes contrailMove {
  0% { transform: translateX(0); opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { transform: translateX(250%); opacity: 0; }
}

/* 飞鸟 */
.nomad-birds { position: absolute; inset: 0; z-index: 2; pointer-events: none; }
.nomad-bird {
  position: absolute;
  left: -5%;
  font-size: 6px;
  color: rgba(50, 50, 50, 0.5);
  animation: birdFly 10s linear infinite;
}
@keyframes birdFly {
  0% { transform: translateX(0) translateY(0); opacity: 0; }
  10% { opacity: 0.6; }
  50% { transform: translateX(50vw) translateY(-10px); }
  90% { opacity: 0.6; }
  100% { transform: translateX(100vw) translateY(5px); opacity: 0; }
}

/* 沙滩桌+笔记本 */
.nomad-workdesk {
  position: absolute;
  bottom: 19%;
  left: 15%;
  z-index: 4;
}
.desk-laptop {
  width: 12px;
  height: 8px;
  background: linear-gradient(180deg, #555, #333);
  border-radius: 1px 1px 0 0;
  position: relative;
}
.desk-laptop::before {
  content: '';
  position: absolute;
  top: 1px;
  left: 1px;
  right: 1px;
  height: 5px;
  background: rgba(0, 200, 255, 0.15);
  border-radius: 1px;
}
.desk-screen-glow {
  position: absolute;
  top: -4px;
  left: -2px;
  width: 16px;
  height: 12px;
  background: radial-gradient(ellipse, rgba(0, 200, 255, 0.08), transparent 70%);
  animation: screenFlickerDesk 3s ease-in-out infinite;
}
@keyframes screenFlickerDesk {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}

/* 吊床 */
.nomad-hammock {
  position: absolute;
  bottom: 22%;
  right: 12%;
  z-index: 3;
}
.hammock-curve {
  width: 24px;
  height: 6px;
  background: linear-gradient(180deg, #c89b5e, #8a6d3f);
  border-radius: 0 0 50% 50%;
  animation: hammockSway 4s ease-in-out infinite;
}
@keyframes hammockSway {
  0%, 100% { transform: rotate(-2deg); }
  50% { transform: rotate(2deg); }
}

/* 椰子饮料 */
.nomad-coconut {
  position: absolute;
  bottom: 19%;
  right: 25%;
  z-index: 4;
}
.coconut-cup {
  width: 6px;
  height: 6px;
  background: radial-gradient(circle at 30% 30%, #6b4226, #3d2817);
  border-radius: 50%;
}
.coconut-straw {
  position: absolute;
  top: -5px;
  left: 3px;
  width: 1px;
  height: 6px;
  background: #ff2d95;
  transform: rotate(15deg);
}

/* ================================================================
   超级IP - 扩展元素
   ================================================================ */
/* 补光灯架 */
.ip-light-stand {
  position: absolute;
  bottom: 18%;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.ip-light-left { left: 6%; }
.ip-light-right { right: 6%; }
.light-bulb {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 240, 200, 0.6), rgba(255, 200, 100, 0.2));
  box-shadow: 0 0 8px rgba(255, 220, 150, 0.3);
  animation: lightBulbGlow 2s ease-in-out infinite;
}
@keyframes lightBulbGlow {
  0%, 100% { box-shadow: 0 0 6px rgba(255, 220, 150, 0.2); }
  50% { box-shadow: 0 0 12px rgba(255, 220, 150, 0.4); }
}
.light-pole {
  width: 1px;
  height: 20px;
  background: linear-gradient(180deg, #555, #333);
}
.light-base {
  width: 6px;
  height: 2px;
  background: #333;
  border-radius: 50%;
}

/* 摄像机 */
.ip-camera {
  position: absolute;
  bottom: 19%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
}
.cam-body {
  width: 10px;
  height: 6px;
  background: linear-gradient(180deg, #333, #222);
  border-radius: 2px;
  position: relative;
}
.cam-lens {
  position: absolute;
  top: 1px;
  left: -2px;
  width: 4px;
  height: 4px;
  background: radial-gradient(circle, #0a0a0a, #1a1a2a);
  border: 1px solid #333;
  border-radius: 50%;
}
.cam-rec-led {
  position: absolute;
  top: 1px;
  right: 1px;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: #ff0044;
  box-shadow: 0 0 3px rgba(255, 0, 68, 0.6);
  animation: recBlink 1s ease-in-out infinite;
}
@keyframes recBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.cam-tripod-1, .cam-tripod-2 {
  position: absolute;
  top: 6px;
  width: 1px;
  height: 12px;
  background: #333;
}
.cam-tripod-1 { left: 2px; transform: rotate(-10deg); transform-origin: top; }
.cam-tripod-2 { right: 2px; transform: rotate(10deg); transform-origin: top; }

/* 额外弹幕 */
.ip-live-comments { position: absolute; inset: 0; z-index: 3; pointer-events: none; overflow: hidden; }
.live-comment {
  position: absolute;
  left: -30%;
  font-size: 6px;
  color: rgba(255, 255, 255, 0.4);
  font-family: 'DotGothic16', monospace;
  white-space: nowrap;
  animation: liveCommentScroll 8s linear infinite;
  opacity: 0;
}
@keyframes liveCommentScroll {
  0% { transform: translateX(0); opacity: 0; }
  10% { opacity: 0.5; }
  90% { opacity: 0.5; }
  100% { transform: translateX(130%); opacity: 0; }
}

/* LIVE标志 */
.ip-live-badge {
  position: absolute;
  top: 5%;
  left: 6%;
  z-index: 4;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 1px 4px;
  background: rgba(255, 0, 68, 0.2);
  border: 1px solid rgba(255, 0, 68, 0.4);
  border-radius: 2px;
  font-family: 'DotGothic16', monospace;
  font-size: 6px;
  color: rgba(255, 50, 80, 0.7);
}
.live-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #ff0044;
  animation: recBlink 1s ease-in-out infinite;
}

/* 奖杯架 */
.ip-trophy-shelf {
  position: absolute;
  bottom: 6%;
  left: 6%;
  z-index: 3;
  display: flex;
  gap: 4px;
  align-items: flex-end;
}
.trophy {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: trophyShine 4s ease-in-out infinite;
}
.trophy-cup {
  width: 6px;
  height: 5px;
  background: linear-gradient(180deg, #ffd700, #cc9900);
  clip-path: polygon(0 0, 100% 0, 90% 60%, 60% 60%, 50% 100%, 40% 60%, 10% 60%);
  filter: drop-shadow(0 0 2px rgba(255, 215, 0, 0.4));
}
.trophy-base {
  width: 5px;
  height: 2px;
  background: #8a6030;
  border-radius: 1px;
}
@keyframes trophyShine {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}

/* ================================================================
   银发收割者 - 扩展元素
   ================================================================ */
/* 药品柜 */
.silver-medicine-cabinet {
  position: absolute;
  top: 12%;
  right: 12%;
  width: 16px;
  height: 18px;
  z-index: 2;
}
.cabinet-box {
  width: 100%;
  height: 100%;
  background: rgba(60, 40, 20, 0.5);
  border: 1px solid rgba(255, 180, 80, 0.15);
  border-radius: 2px;
}
.cabinet-cross-h {
  position: absolute;
  top: 40%;
  left: 30%;
  right: 30%;
  height: 2px;
  background: rgba(255, 100, 100, 0.4);
  border-radius: 1px;
}
.cabinet-cross-v {
  position: absolute;
  left: 45%;
  top: 25%;
  bottom: 25%;
  width: 2px;
  background: rgba(255, 100, 100, 0.4);
  border-radius: 1px;
}

/* 摇椅 */
.silver-rocker {
  position: absolute;
  bottom: 19%;
  left: 30%;
  z-index: 3;
}
.rocker-seat {
  width: 12px;
  height: 3px;
  background: #5a3a20;
  border-radius: 1px;
}
.rocker-back {
  position: absolute;
  top: -8px;
  left: 0;
  width: 2px;
  height: 10px;
  background: #5a3a20;
  border-radius: 1px;
}
.rocker-curve {
  position: absolute;
  bottom: -2px;
  left: -1px;
  width: 14px;
  height: 4px;
  border-bottom: 2px solid #5a3a20;
  border-radius: 0 0 50% 50%;
  animation: rockerSway 3s ease-in-out infinite;
}
@keyframes rockerSway {
  0%, 100% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
}

/* 落地钟 */
.silver-clock {
  position: absolute;
  bottom: 18%;
  right: 30%;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.clock-body {
  width: 8px;
  height: 20px;
  background: linear-gradient(180deg, #3d2e1a, #2a1f0e);
  border-radius: 2px 2px 0 0;
}
.clock-face {
  position: absolute;
  top: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 5px;
  height: 5px;
  background: rgba(255, 200, 100, 0.15);
  border: 1px solid rgba(255, 180, 80, 0.2);
  border-radius: 50%;
}
.clock-pendulum {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  height: 6px;
  background: rgba(255, 180, 80, 0.2);
  animation: pendulumSwing 2s ease-in-out infinite;
  transform-origin: top;
}
@keyframes pendulumSwing {
  0%, 100% { transform: translateX(-50%) rotate(-15deg); }
  50% { transform: translateX(-50%) rotate(15deg); }
}

/* 盆栽 */
.silver-plant {
  position: absolute;
  bottom: 18%;
  left: 10%;
  z-index: 3;
}
.plant-pot {
  width: 8px;
  height: 5px;
  background: linear-gradient(180deg, #8a6030, #5a3a20);
  border-radius: 0 0 2px 2px;
}
.plant-leaf {
  position: absolute;
  bottom: 5px;
  width: 4px;
  height: 6px;
  background: rgba(60, 120, 40, 0.4);
  border-radius: 50% 50% 0 0;
}
.plant-leaf-1 { left: 0; transform: rotate(-15deg); animation: leafSway 4s ease-in-out infinite; }
.plant-leaf-2 { left: 2px; transform: rotate(0deg); animation: leafSway 4s ease-in-out infinite 0.5s; }
.plant-leaf-3 { left: 4px; transform: rotate(15deg); animation: leafSway 4s ease-in-out infinite 1s; }
@keyframes leafSway {
  0%, 100% { transform-origin: bottom; }
  50% { transform-origin: bottom; }
}

/* 萤火虫 */
.silver-fireflies { position: absolute; inset: 0; z-index: 4; pointer-events: none; }
.firefly {
  position: absolute;
  top: 30%;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: rgba(255, 255, 150, 0.6);
  box-shadow: 0 0 4px rgba(255, 255, 100, 0.4);
  animation: fireflyFloat ease-in-out infinite;
}
@keyframes fireflyFloat {
  0%, 100% { transform: translate(0, 0); opacity: 0.2; }
  25% { transform: translate(10px, -5px); opacity: 0.8; }
  50% { transform: translate(5px, 10px); opacity: 0.4; }
  75% { transform: translate(-8px, 3px); opacity: 0.6; }
}

/* 氧气瓶 */
.silver-oxygen {
  position: absolute;
  bottom: 19%;
  right: 8%;
  z-index: 3;
}
.oxygen-tank {
  width: 5px;
  height: 14px;
  background: linear-gradient(180deg, #4a7a9a, #2a5a7a);
  border-radius: 3px 3px 1px 1px;
  border: 1px solid rgba(100, 150, 200, 0.2);
}
.oxygen-mask {
  position: absolute;
  top: 4px;
  right: -6px;
  width: 6px;
  height: 4px;
  background: rgba(100, 100, 100, 0.3);
  border: 1px solid rgba(150, 150, 150, 0.2);
  border-radius: 2px;
}

/* ================================================================
   生物赌徒 - 扩展元素
   ================================================================ */
/* 显微镜 */
.bio-microscope {
  position: absolute;
  bottom: 19%;
  right: 10%;
  z-index: 3;
}
.micro-scope {
  position: absolute;
  top: 0;
  left: 2px;
  width: 6px;
  height: 4px;
  background: linear-gradient(180deg, #2a2a2a, #1a1a1a);
  border-radius: 3px 3px 0 0;
}
.micro-tube {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 2px;
  height: 8px;
  background: #2a2a2a;
}
.micro-base {
  position: absolute;
  bottom: 0;
  width: 12px;
  height: 4px;
  background: linear-gradient(180deg, #2a2a2a, #1a1a1a);
  border-radius: 1px;
}
.micro-lens-glow {
  position: absolute;
  top: 1px;
  left: 3px;
  width: 4px;
  height: 2px;
  background: rgba(0, 255, 136, 0.15);
  border-radius: 50%;
  animation: microGlow 3s ease-in-out infinite;
}
@keyframes microGlow {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

/* 培养皿 */
.bio-petri-row {
  position: absolute;
  bottom: 20%;
  left: 15%;
  z-index: 3;
  display: flex;
  gap: 3px;
}
.petri-dish {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(0, 30, 15, 0.5);
  border: 1px solid rgba(0, 255, 136, 0.15);
  position: relative;
  animation: petriPulse 3s ease-in-out infinite;
}
.petri-content {
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  bottom: 2px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 255, 136, 0.15), transparent 70%);
}
@keyframes petriPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.9; }
}

/* 离心机 */
.bio-centrifuge {
  position: absolute;
  top: 15%;
  left: 8%;
  z-index: 3;
}
.centrifuge-body {
  width: 12px;
  height: 14px;
  background: linear-gradient(180deg, #1a2a1a, #0a1a0a);
  border: 1px solid rgba(0, 255, 136, 0.1);
  border-radius: 2px;
}
.centrifuge-rotor {
  position: absolute;
  top: 3px;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1px solid rgba(0, 255, 136, 0.2);
  animation: rotorSpin 0.4s linear infinite;
}
.centrifuge-rotor::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(0, 255, 136, 0.3);
}
@keyframes rotorSpin {
  100% { transform: translateX(-50%) rotate(360deg); }
}

/* 基因序列流 */
.bio-gene-stream {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  z-index: 2;
  display: flex;
  gap: 4px;
  padding: 0 8px;
  overflow: hidden;
  height: 8px;
  animation: geneScroll 6s linear infinite;
}
.gene-seq-text {
  font-family: 'DotGothic16', monospace;
  font-size: 5px;
  color: rgba(0, 255, 136, 0.25);
  white-space: nowrap;
  flex-shrink: 0;
}
@keyframes geneScroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

/* 警告灯 */
.bio-warning-light {
  position: absolute;
  top: 8%;
  right: 50%;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255, 200, 0, 0.3);
  box-shadow: 0 0 6px rgba(255, 200, 0, 0.2);
  z-index: 4;
  animation: warningPulse 2s ease-in-out infinite;
}
@keyframes warningPulse {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.6; box-shadow: 0 0 8px rgba(255, 200, 0, 0.4); }
}

/* ================================================================
   生活状态修饰器
   ================================================================ */
/* 伴侣剪影 */
.life-partner {
  position: absolute;
  bottom: 16%;
  left: 42%;
  z-index: 6;
  width: 14px;
  height: 26px;
  animation: charBreath 3s ease-in-out infinite 0.5s;
}
.partner-head {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 6px;
  background: #d8b890;
  border-radius: 2px;
  z-index: 2;
}
.partner-body {
  position: absolute;
  top: 6px;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 10px;
  border-radius: 2px;
  z-index: 1;
}
.partner-arm-l, .partner-arm-r {
  position: absolute;
  top: 7px;
  width: 2px;
  height: 7px;
  border-radius: 1px;
  z-index: 3;
}
.partner-arm-l { left: 1px; }
.partner-arm-r { right: 1px; }
.partner-leg-l, .partner-leg-r {
  position: absolute;
  top: 16px;
  width: 3px;
  height: 8px;
  border-radius: 0 0 1px 1px;
  z-index: 0;
}
.partner-leg-l { left: 3px; }
.partner-leg-r { right: 3px; }
.partner-heart {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 6px;
  color: rgba(255, 45, 149, 0.5);
  text-shadow: 0 0 3px rgba(255, 45, 149, 0.3);
  animation: heartBeat 1.5s ease-in-out infinite;
}
@keyframes heartBeat {
  0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.4; }
  50% { transform: translateX(-50%) scale(1.2); opacity: 0.7; }
}
/* 伴侣路径配色 */
.ai_symbiote .partner-body, .ai_symbiote .partner-arm-l, .ai_symbiote .partner-arm-r { background: #2a4a6a; }
.ai_symbiote .partner-leg-l, .ai_symbiote .partner-leg-r { background: #1a2a45; }
.chain_native .partner-body, .chain_native .partner-arm-l, .chain_native .partner-arm-r { background: #4a3a00; }
.chain_native .partner-leg-l, .chain_native .partner-leg-r { background: #2a2000; }
.digital_nomad .partner-body, .digital_nomad .partner-arm-l, .digital_nomad .partner-arm-r { background: #3a7a5f; }
.digital_nomad .partner-leg-l, .digital_nomad .partner-leg-r { background: #1a5040; }
.super_ip .partner-body, .super_ip .partner-arm-l, .super_ip .partner-arm-r { background: #7a2a5a; }
.super_ip .partner-leg-l, .super_ip .partner-leg-r { background: #4a1a3a; }
.silver_economy .partner-body, .silver_economy .partner-arm-l, .silver_economy .partner-arm-r { background: #d0d0d0; }
.silver_economy .partner-leg-l, .silver_economy .partner-leg-r { background: #5a5a5a; }
.bio_gambler .partner-body, .bio_gambler .partner-arm-l, .bio_gambler .partner-arm-r { background: #d0d0d0; }
.bio_gambler .partner-leg-l, .bio_gambler .partner-leg-r { background: #4a4a4a; }

/* 孩子剪影 */
.life-child {
  position: absolute;
  bottom: 17%;
  left: 56%;
  z-index: 6;
  width: 10px;
  height: 18px;
  animation: childBounce 1.5s ease-in-out infinite;
}
.child-head {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 5px;
  height: 5px;
  background: #e8c4a0;
  border-radius: 2px;
  z-index: 2;
}
.child-body {
  position: absolute;
  top: 5px;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 7px;
  border-radius: 1px;
  background: #e87a3a;
  z-index: 1;
}
.child-arm-l, .child-arm-r {
  position: absolute;
  top: 6px;
  width: 2px;
  height: 5px;
  background: #e87a3a;
  border-radius: 1px;
  z-index: 3;
}
.child-arm-l { left: 0; }
.child-arm-r { right: 0; }
.child-leg-l, .child-leg-r {
  position: absolute;
  top: 12px;
  width: 2px;
  height: 5px;
  background: #3a3a3a;
  border-radius: 0 0 1px 1px;
  z-index: 0;
}
.child-leg-l { left: 3px; }
.child-leg-r { right: 3px; }
@keyframes childBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

/* 房产剪影 */
.life-house {
  position: absolute;
  bottom: 30%;
  right: 8%;
  z-index: 2;
  animation: houseSettle 0.5s ease-out;
}
@keyframes houseSettle {
  0% { transform: translateY(-20px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
.house-roof {
  width: 0;
  height: 0;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-bottom: 10px solid rgba(120, 80, 40, 0.4);
  margin: 0 auto;
}
.house-wall {
  width: 20px;
  height: 14px;
  background: rgba(80, 60, 30, 0.3);
  margin: 0 auto;
}
.house-door {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 5px;
  height: 7px;
  background: rgba(60, 40, 20, 0.5);
  border-radius: 2px 2px 0 0;
}
.house-window-l, .house-window-r {
  position: absolute;
  top: 4px;
  width: 4px;
  height: 4px;
  background: rgba(255, 200, 100, 0.15);
  border: 1px solid rgba(255, 180, 80, 0.1);
  border-radius: 1px;
  animation: windowWarm 4s ease-in-out infinite;
}
.house-window-l { left: 2px; }
.house-window-r { right: 2px; }
@keyframes windowWarm {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}
.house-chimney {
  position: absolute;
  top: -6px;
  right: 4px;
  width: 3px;
  height: 6px;
  background: rgba(100, 70, 30, 0.4);
}
.house-smoke {
  position: absolute;
  top: -12px;
  right: 5px;
  width: 2px;
  height: 6px;
  background: rgba(200, 200, 200, 0.15);
  border-radius: 50%;
  animation: smokeRise 3s ease-out infinite;
}
@keyframes smokeRise {
  0% { transform: translateY(0) scale(0.5); opacity: 0; }
  30% { opacity: 0.3; }
  100% { transform: translateY(-8px) scale(1.5); opacity: 0; }
}

/* 失业指示 */
.life-unemployed {
  position: absolute;
  inset: 0;
  z-index: 7;
  pointer-events: none;
}
.unemployed-sign {
  position: absolute;
  top: 15%;
  left: 50%;
  transform: translateX(-50%);
  padding: 2px 6px;
  background: rgba(60, 20, 20, 0.6);
  border: 1px solid rgba(255, 80, 80, 0.3);
  border-radius: 2px;
  font-family: 'DotGothic16', monospace;
  font-size: 7px;
  color: rgba(255, 100, 100, 0.6);
  animation: signSway 3s ease-in-out infinite;
}
@keyframes signSway {
  0%, 100% { transform: translateX(-50%) rotate(-2deg); }
  50% { transform: translateX(-50%) rotate(2deg); }
}
.unemployed-gloom {
  position: absolute;
  inset: 0;
  background: rgba(40, 40, 60, 0.15);
  mix-blend-mode: multiply;
}

/* ================================================================
   场景标签特效（叙事事件驱动）
   ================================================================ */
/* 失业：纸箱+灰暗 */
.scene-tag-job_loss::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 7;
  background: rgba(30, 30, 40, 0.2);
  pointer-events: none;
}
.scene-tag-job_loss .scene-char { animation: charBreath 5s ease-in-out infinite; filter: grayscale(0.3); }

/* 危机：红色警告+抖动 */
.scene-tag-crisis .scene-bg { filter: brightness(0.6) saturate(0.7) sepia(0.3); }
.scene-tag-crisis::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 7;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 3px,
    rgba(220, 38, 38, 0.05) 3px,
    rgba(220, 38, 38, 0.05) 4px
  );
  pointer-events: none;
  animation: crisisFlicker 0.5s ease-in-out infinite alternate;
}
@keyframes crisisFlicker {
  0% { opacity: 0.7; }
  100% { opacity: 1; }
}
.scene-tag-crisis .scene-char { animation: charShake 2s ease-in-out infinite; }
@keyframes charShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-1px); }
  75% { transform: translateX(1px); }
}

/* 升职：金光+礼花 */
.scene-tag-promotion::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 8;
  background: radial-gradient(ellipse at center top, rgba(255, 215, 0, 0.15), transparent 60%);
  pointer-events: none;
  animation: promotionGlow 2s ease-in-out infinite;
}
@keyframes promotionGlow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* 分手/离婚：心碎+冷色调 */
.scene-tag-breakup .scene-bg { filter: brightness(0.7) saturate(0.5); }
.scene-tag-breakup::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 7;
  background: rgba(50, 50, 80, 0.15);
  pointer-events: none;
}

/* 中奖/暴富：金雨 */
.scene-tag-lottery::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 8;
  background:
    radial-gradient(circle at 20% 30%, rgba(255, 215, 0, 0.1), transparent 20%),
    radial-gradient(circle at 70% 60%, rgba(255, 215, 0, 0.08), transparent 25%),
    radial-gradient(circle at 50% 80%, rgba(255, 215, 0, 0.06), transparent 20%);
  pointer-events: none;
  animation: lotteryShimmer 3s ease-in-out infinite;
}
@keyframes lotteryShimmer {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* 生病：暗角+红光脉冲 */
.scene-tag-illness::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 7;
  background: radial-gradient(ellipse at center, transparent 30%, rgba(80, 0, 0, 0.15) 100%);
  pointer-events: none;
  animation: illnessPulse 2s ease-in-out infinite;
}
@keyframes illnessPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}

/* 婚礼：花瓣+暖光 */
.scene-tag-wedding::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 8;
  background: radial-gradient(ellipse at center, rgba(255, 180, 200, 0.12), transparent 70%);
  pointer-events: none;
  animation: weddingGlow 3s ease-in-out infinite;
}
@keyframes weddingGlow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}

/* 买房：暖光+入住感 */
.scene-tag-buy_house::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 8;
  background: radial-gradient(ellipse at 70% 40%, rgba(255, 200, 100, 0.1), transparent 50%);
  pointer-events: none;
}

/* 创业：紧张红光 */
.scene-tag-startup::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 7;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(120, 20, 20, 0.1) 100%);
  pointer-events: none;
  animation: startupTension 3s ease-in-out infinite;
}
@keyframes startupTension {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

/* 出国/旅行：蓝色光晕 */
.scene-tag-travel::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 8;
  background: radial-gradient(ellipse at center top, rgba(100, 180, 255, 0.1), transparent 60%);
  pointer-events: none;
  animation: travelShimmer 4s ease-in-out infinite;
}
@keyframes travelShimmer {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}

/* 突破/成就：彩虹光波 */
.scene-tag-breakthrough::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 8;
  background: linear-gradient(135deg,
    rgba(255, 45, 149, 0.06),
    rgba(0, 212, 255, 0.06),
    rgba(0, 255, 136, 0.06),
    rgba(255, 215, 0, 0.06));
  pointer-events: none;
  animation: breakthroughWave 3s ease-in-out infinite;
}
@keyframes breakthroughWave {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}
</style>
