<template>
  <Teleport to="body">
    <Transition name="cyber-confirm-fade">
      <div v-if="visible" class="cyber-confirm-overlay" @click.self="handleCancel">
        <div class="cyber-confirm-box">
          <div class="cyber-confirm-header">
            <span class="cyber-confirm-icon">⚠</span>
            <span class="cyber-confirm-title">{{ title }}</span>
          </div>
          <div class="cyber-confirm-body">
            <p class="cyber-confirm-message">{{ message }}</p>
          </div>
          <div class="cyber-confirm-footer">
            <button class="cyber-btn cyber-btn-cancel" @click="handleCancel">
              <span>取消</span>
            </button>
            <button class="cyber-btn cyber-btn-confirm" @click="handleConfirm">
              <span>确认</span>
            </button>
          </div>
          <div class="cyber-confirm-scanline"></div>
          <div class="cyber-confirm-corner tl"></div>
          <div class="cyber-confirm-corner tr"></div>
          <div class="cyber-confirm-corner bl"></div>
          <div class="cyber-confirm-corner br"></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  title?: string;
  message: string;
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
  'update:visible': [value: boolean];
}>();

const visible = ref(false);

function open() {
  visible.value = true;
}

function close() {
  visible.value = false;
  emit('update:visible', false);
}

function handleConfirm() {
  close();
  emit('confirm');
}

function handleCancel() {
  close();
  emit('cancel');
}

defineExpose({ open, close });
</script>

<style scoped>
.cyber-confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.cyber-confirm-box {
  position: relative;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a0a2a 100%);
  border: 1px solid #ff2d78;
  padding: 24px 28px;
  max-width: 400px;
  width: 90%;
  box-shadow:
    0 0 20px rgba(255, 45, 120, 0.4),
    inset 0 0 20px rgba(255, 45, 120, 0.05);
  font-family: 'Courier New', 'DotGothic16', monospace;
}

.cyber-confirm-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 45, 120, 0.3);
}

.cyber-confirm-icon {
  font-size: 20px;
  color: #ff2d78;
  text-shadow: 0 0 8px #ff2d78;
}

.cyber-confirm-title {
  color: #ff2d78;
  font-size: 14px;
  font-weight: bold;
  letter-spacing: 2px;
  text-transform: uppercase;
  text-shadow: 0 0 6px rgba(255, 45, 120, 0.5);
}

.cyber-confirm-body {
  margin-bottom: 20px;
}

.cyber-confirm-message {
  color: #c0c0d0;
  font-size: 13px;
  line-height: 1.7;
  margin: 0;
}

.cyber-confirm-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cyber-btn {
  position: relative;
  padding: 8px 20px;
  font-family: inherit;
  font-size: 12px;
  letter-spacing: 1px;
  cursor: pointer;
  border: 1px solid;
  background: transparent;
  transition: all 0.2s;
}

.cyber-btn-cancel {
  color: #8a8aaa;
  border-color: #3a3a5a;
}

.cyber-btn-cancel:hover {
  color: #c0c0d0;
  border-color: #5a5a7a;
  background: rgba(255, 255, 255, 0.05);
}

.cyber-btn-confirm {
  color: #ff2d78;
  border-color: #ff2d78;
  text-shadow: 0 0 4px rgba(255, 45, 120, 0.5);
}

.cyber-btn-confirm:hover {
  background: rgba(255, 45, 120, 0.15);
  box-shadow: 0 0 12px rgba(255, 45, 120, 0.4);
}

.cyber-confirm-scanline {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #ff2d78, transparent);
  animation: scanline 2s linear infinite;
  pointer-events: none;
}

@keyframes scanline {
  0% { top: 0; opacity: 1; }
  100% { top: 100%; opacity: 0; }
}

.cyber-confirm-corner {
  position: absolute;
  width: 10px;
  height: 10px;
  border-color: #ff2d78;
  border-style: solid;
}

.cyber-confirm-corner.tl { top: -1px; left: -1px; border-width: 2px 0 0 2px; }
.cyber-confirm-corner.tr { top: -1px; right: -1px; border-width: 2px 2px 0 0; }
.cyber-confirm-corner.bl { bottom: -1px; left: -1px; border-width: 0 0 2px 2px; }
.cyber-confirm-corner.br { bottom: -1px; right: -1px; border-width: 0 2px 2px 0; }

.cyber-confirm-fade-enter-active,
.cyber-confirm-fade-leave-active {
  transition: all 0.2s ease;
}

.cyber-confirm-fade-enter-from,
.cyber-confirm-fade-leave-to {
  opacity: 0;
}

.cyber-confirm-fade-enter-from .cyber-confirm-box,
.cyber-confirm-fade-leave-to .cyber-confirm-box {
  transform: scale(0.9);
}
</style>
