<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

interface Toast {
  id: number;
  icon: string;
  title: string;
  desc: string;
}

const toasts = ref<Toast[]>([]);
let nextId = 1;

function addToast(icon: string, title: string, desc: string) {
  const id = nextId++;
  toasts.value.push({ id, icon, title, desc });
  // 3.5秒后自动移除
  setTimeout(() => {
    const idx = toasts.value.findIndex(t => t.id === id);
    if (idx >= 0) toasts.value.splice(idx, 1);
  }, 3500);
}

// 暴露给全局
if (typeof window !== 'undefined') {
  (window as any).__showAchievement = addToast;
}

defineExpose({ addToast });
</script>

<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="achievement-toast"
      >
        <div class="toast-icon">{{ toast.icon }}</div>
        <div class="toast-body">
          <div class="toast-title">
            <span class="toast-badge">★ ACHIEVEMENT</span>
            {{ toast.title }}
          </div>
          <div class="toast-desc">{{ toast.desc }}</div>
        </div>
        <div class="toast-scanlines" />
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
  font-family: 'DotGothic16', monospace;
}

.achievement-toast {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(10, 5, 30, 0.95);
  border: 2px solid #ffd700;
  padding: 12px 16px;
  min-width: 260px;
  max-width: 340px;
  position: relative;
  overflow: hidden;
  box-shadow:
    0 0 12px #ffd700,
    0 0 30px #ffd70040,
    inset 0 0 20px #ffd70015;
  animation: toastPulse 0.6s ease-out;
}

.toast-icon {
  font-size: 32px;
  flex-shrink: 0;
  filter: drop-shadow(0 0 6px #ffd70080);
  animation: iconBounce 0.5s ease-out;
}

.toast-body {
  flex: 1;
  min-width: 0;
}

.toast-badge {
  display: block;
  font-size: 9px;
  color: #ffd700;
  letter-spacing: 2px;
  text-shadow: 0 0 4px #ffd700;
  margin-bottom: 2px;
}

.toast-title {
  font-size: 14px;
  font-weight: bold;
  color: #ffffff;
  text-shadow: 0 0 6px #ffffff;
}

.toast-desc {
  font-size: 11px;
  color: #c8d8e8;
  margin-top: 2px;
}

.toast-scanlines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px,
    transparent 2px,
    rgba(255, 255, 255, 0.03) 2px,
    rgba(255, 255, 255, 0.03) 3px
  );
}

@keyframes toastPulse {
  0% { transform: translateX(120%); opacity: 0; }
  60% { transform: translateX(-8px); opacity: 1; }
  100% { transform: translateX(0); opacity: 1; }
}

@keyframes iconBounce {
  0% { transform: scale(0) rotate(-180deg); }
  60% { transform: scale(1.3) rotate(10deg); }
  100% { transform: scale(1) rotate(0deg); }
}

.toast-enter-active {
  transition: all 0.4s ease-out;
}
.toast-leave-active {
  transition: all 0.4s ease-in;
}
.toast-enter-from {
  transform: translateX(120%);
  opacity: 0;
}
.toast-leave-to {
  transform: translateX(120%);
  opacity: 0;
}
</style>
