<script setup lang="ts">
import { computed } from 'vue'
import {
  collectionState,
  getEndingCatalog,
  collectionAchievements,
  type CollectionAchievement,
} from '../../utils/collection.js'
import { fmtBig } from '../../utils/life-fun.js'

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const c = computed(() => collectionState.value)
const catalog = computed(() => getEndingCatalog())
const unlockedCount = computed(() => Object.keys(c.value.unlockedEndings).length)

const achievements = computed<CollectionAchievement[]>(() => collectionAchievements(c.value))
const achEarned = computed(() => achievements.value.filter((a) => a.earned).length)

// 评级配色
const gradeColor: Record<string, string> = {
  S: '#ffec27', A: '#00d4ff', B: '#00ff88', C: '#ff8800', D: '#ff004d',
}

// 生涯统计卡
const stats = computed(() => {
  const paths = ['ai_symbiote', 'chain_native', 'digital_nomad', 'super_ip', 'silver_economy', 'bio_gambler']
  const played = paths.filter((p) => (c.value.totalPathFrequencies[p] || 0) > 0).length
  const cleared = paths.filter((p) => (c.value.pathClears[p] || 0) > 0).length
  return [
    { icon: '📜', label: '人生已过', value: `${c.value.totalRuns} 局`, sub: `${c.value.totalYearsSimulated} 年` },
    { icon: '🏆', label: '历史最佳', value: c.value.bestGrade || '—', sub: '评级' },
    { icon: '💎', label: '单局最高资产', value: fmtBig(c.value.bestNetWealth), sub: '元' },
    { icon: '💰', label: '累计资产', value: fmtBig(c.value.totalNetWealth), sub: '元' },
    { icon: '🎯', label: '体验路径', value: `${played}/${paths.length}`, sub: `${cleared} 条成功` },
    { icon: '🚀', label: '最早退休', value: c.value.bestRetireAge <= 60 ? `${c.value.bestRetireAge}岁` : '—', sub: '岁' },
  ]
})

function close(): void {
  emit('close')
}
</script>

<template>
  <div v-if="show" class="coll-overlay" @click.self="close">
    <div class="coll-modal pixel-panel">
      <!-- 霓虹边框角 -->
      <div class="modal-corner ct" /><div class="modal-corner cb" />
      <div class="coll-head">
        <h2 class="coll-title">◈ 人生图鉴 ◈</h2>
        <button class="coll-close" @click="close" title="关闭">✕</button>
      </div>
      <div class="coll-sub">
        <span class="coll-progress">已解锁 {{ unlockedCount }} / {{ catalog.length }} 结局</span>
        <span class="coll-bar"><span class="coll-fill" :style="{ width: (unlockedCount / catalog.length * 100) + '%' }" /></span>
      </div>

      <div class="coll-scroll">
        <!-- ============ 路径结局 ============ -->
        <section class="coll-sec">
          <div class="sec-title">🧭 提前退休路径</div>
          <div class="path-group">
            <template v-for="slot in catalog.filter(s => s.pathId)" :key="slot.id">
              <div
                class="slot"
                :class="[c.unlockedEndings[slot.id] ? 'slot-unlocked' : 'slot-locked', slot.isPathSuccess ? 'slot-path-succ' : 'slot-path-fail']"
              >
                <div class="slot-icon">{{ slot.pathIcon }}</div>
                <div class="slot-body">
                  <div class="slot-title">{{ c.unlockedEndings[slot.id] ? slot.title : '？？？' }}</div>
                  <div class="slot-name">{{ slot.isPathSuccess ? '成功' : '未竟' }}</div>
                </div>
                <div v-if="c.unlockedEndings[slot.id]" class="slot-grade" :style="{ color: gradeColor[c.unlockedEndings[slot.id].grade], textShadow: `0 0 8px ${gradeColor[c.unlockedEndings[slot.id].grade]}` }">
                  {{ c.unlockedEndings[slot.id].grade }}
                </div>
                <div v-else class="slot-lock">🔒</div>
              </div>
            </template>
          </div>
        </section>

        <!-- ============ 普通结局 ============ -->
        <section class="coll-sec">
          <div class="sec-title">◆ 寻常人生</div>
          <div class="normal-group">
            <div
              v-for="slot in catalog.filter(s => !s.pathId)"
              :key="slot.id"
              class="slot"
              :class="c.unlockedEndings[slot.id] ? 'slot-unlocked' : 'slot-locked'"
            >
              <div class="slot-icon">{{ slot.pathIcon }}</div>
              <div class="slot-body">
                <div class="slot-title">{{ c.unlockedEndings[slot.id] ? slot.title : '？？？' }}</div>
                <div class="slot-name">{{ c.unlockedEndings[slot.id] ? slot.name : '未解锁' }}</div>
              </div>
              <div v-if="c.unlockedEndings[slot.id]" class="slot-grade" :style="{ color: gradeColor[c.unlockedEndings[slot.id].grade], textShadow: `0 0 8px ${gradeColor[c.unlockedEndings[slot.id].grade]}` }">
                {{ c.unlockedEndings[slot.id].grade }}
              </div>
              <div v-else class="slot-lock">🔒</div>
            </div>
          </div>
        </section>

        <!-- ============ 生涯统计 ============ -->
        <section class="coll-sec">
          <div class="sec-title">📊 生涯统计</div>
          <div class="stats-grid">
            <div v-for="s in stats" :key="s.label" class="stat-card">
              <div class="stat-icon">{{ s.icon }}</div>
              <div class="stat-value">{{ s.value }}</div>
              <div class="stat-label">{{ s.label }}</div>
              <div class="stat-sub">{{ s.sub }}</div>
            </div>
          </div>
        </section>

        <!-- ============ 元成就 ============ -->
        <section class="coll-sec">
          <div class="sec-title">
            🏅 收藏成就
            <span class="sec-count">{{ achEarned }}/{{ achievements.length }}</span>
          </div>
          <div class="ach-grid">
            <div
              v-for="a in achievements"
              :key="a.id"
              class="ach"
              :class="{ earned: a.earned, locked: !a.earned }"
              :title="a.desc"
            >
              <div class="ach-icon">{{ a.earned ? a.icon : '❓' }}</div>
              <div class="ach-title">{{ a.earned ? a.title : '？？？' }}</div>
              <div class="ach-desc">{{ a.earned ? a.desc : '尚未达成' }}</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.coll-overlay {
  position: fixed;
  inset: 0;
  background: rgba(5, 0, 15, 0.88);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 20px;
}
.coll-modal {
  position: relative;
  width: min(760px, 100%);
  max-height: 92%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 22px 22px 26px;
  animation: collPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  background: linear-gradient(160deg, #120830 0%, #1a0b3a 60%, #2a1058 100%);
  border: 2px solid var(--neon-purple);
  box-shadow: 0 0 24px rgba(201, 0, 255, 0.35), inset 0 0 40px rgba(0, 0, 0, 0.4);
}
@keyframes collPop {
  from { opacity: 0; transform: scale(0.9) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.modal-corner { position: absolute; width: 22px; height: 22px; border: 3px solid var(--neon-pink); box-shadow: 0 0 8px var(--neon-pink); pointer-events: none; }
.modal-corner.ct { top: -3px; left: -3px; border-right: none; border-bottom: none; }
.modal-corner.cb { bottom: -3px; right: -3px; border-left: none; border-top: none; border-color: var(--neon-blue); box-shadow: 0 0 8px var(--neon-blue); }

.coll-head { display: flex; align-items: center; justify-content: space-between; }
.coll-title { margin: 0; font-size: 22px; color: var(--neon-pink); letter-spacing: 3px; text-shadow: 0 0 8px var(--neon-pink); }
.coll-close { background: none; border: 1px solid var(--neon-blue); color: var(--neon-blue); width: 30px; height: 30px; cursor: pointer; font-size: 15px; border-radius: 4px; transition: all 0.2s; }
.coll-close:hover { background: rgba(0, 212, 255, 0.2); color: #fff; }

.coll-sub { display: flex; align-items: center; gap: 10px; }
.coll-progress { font-size: 12px; color: var(--neon-blue); letter-spacing: 1px; white-space: nowrap; }
.coll-bar { flex: 1; height: 8px; background: rgba(255, 255, 255, 0.1); border-radius: 4px; overflow: hidden; }
.coll-fill { height: 100%; background: linear-gradient(90deg, var(--neon-blue), var(--neon-purple), var(--neon-pink)); border-radius: 4px; transition: width 0.6s ease; box-shadow: 0 0 8px rgba(0, 212, 255, 0.5); }

.coll-scroll { overflow-y: auto; display: flex; flex-direction: column; gap: 18px; padding-right: 4px; scrollbar-gutter: stable; }
.coll-scroll::-webkit-scrollbar { width: 6px; }
.coll-scroll::-webkit-scrollbar-thumb { background: rgba(201, 0, 255, 0.4); border-radius: 3px; }

.coll-sec { display: flex; flex-direction: column; gap: 10px; }
.sec-title { font-size: 14px; color: var(--neon-purple); letter-spacing: 2px; text-shadow: 0 0 6px var(--neon-purple); display: flex; align-items: center; gap: 8px; }
.sec-count { font-size: 11px; color: var(--neon-green); font-family: 'DotGothic16', monospace; }

.path-group { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.normal-group { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }

.slot {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid;
  min-height: 58px;
}
.slot-unlocked { border-color: rgba(0, 212, 255, 0.4); background: rgba(0, 212, 255, 0.08); box-shadow: 0 0 10px rgba(0, 212, 255, 0.12); }
.slot-locked { border-style: dashed; border-color: rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.02); opacity: 0.6; }
.slot-locked .slot-title { color: #5f574f; }
.slot-path-succ.slot-unlocked { border-color: rgba(0, 255, 136, 0.4); background: rgba(0, 255, 136, 0.06); }
.slot-path-fail.slot-unlocked { border-color: rgba(255, 136, 0, 0.4); background: rgba(255, 136, 0, 0.06); }

.slot-icon { font-size: 24px; filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.3)); flex-shrink: 0; }
.slot-locked .slot-icon { filter: grayscale(1); opacity: 0.5; }
.slot-body { flex: 1; min-width: 0; }
.slot-title { font-size: 13px; color: #e0e0f0; letter-spacing: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.slot-name { font-size: 10px; color: #94b0c2; margin-top: 2px; }
.slot-grade { font-size: 22px; font-weight: bold; font-family: 'DotGothic16', monospace; flex-shrink: 0; }
.slot-lock { font-size: 16px; flex-shrink: 0; }

.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.stat-card { background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(201, 0, 255, 0.25); border-radius: 6px; padding: 12px 10px; text-align: center; }
.stat-icon { font-size: 20px; }
.stat-value { font-size: 18px; font-weight: bold; color: var(--neon-green); text-shadow: 0 0 8px rgba(0, 255, 136, 0.4); font-family: 'DotGothic16', monospace; margin-top: 4px; }
.stat-label { font-size: 10px; color: #c9a8ff; margin-top: 3px; }
.stat-sub { font-size: 10px; color: #5f574f; margin-top: 2px; }

.ach-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
.ach { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 10px 4px; border-radius: 6px; text-align: center; }
.ach.earned { background: rgba(0, 212, 255, 0.08); border: 1px solid rgba(0, 212, 255, 0.35); box-shadow: 0 0 8px rgba(0, 212, 255, 0.15); }
.ach.locked { background: rgba(255, 255, 255, 0.02); border: 1px dashed rgba(255, 255, 255, 0.12); opacity: 0.5; }
.ach-icon { font-size: 22px; }
.ach.locked .ach-icon { filter: grayscale(1); }
.ach-title { font-size: 10px; color: #e0e0f0; }
.ach.locked .ach-title { color: #5f574f; }
.ach-desc { font-size: 9px; color: #94b0c2; line-height: 1.3; }

@media (max-width: 700px) {
  .normal-group { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .path-group { grid-template-columns: 1fr; }
  .normal-group { grid-template-columns: repeat(2, 1fr); }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .ach-grid { grid-template-columns: repeat(3, 1fr); }
}
</style>