<script setup lang="ts">
// CRTBezel: 极简屏幕边框
// 只保留圆角屏幕框 + 扫描线 + 玻璃反光 + 电源指示灯
// 所有物理外壳（天线/旋钮/喇叭/底座）已移除，让屏幕内容成为绝对主角
</script>

<template>
  <div class="crt-screen-wrap">
    <!-- 屏幕内凹边框 -->
    <div class="crt-screen-frame">
      <div class="crt-screen">
        <!-- 插槽内容（CSSScene） -->
        <slot />

        <!-- 扫描线叠加层 -->
        <div class="crt-scanlines" aria-hidden="true"></div>

        <!-- 屏幕玻璃反光 -->
        <div class="crt-glass-shine" aria-hidden="true"></div>

        <!-- 电源指示灯（右下角微光） -->
        <div class="crt-power-led" aria-hidden="true"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.crt-screen-wrap {
  position: relative;
  width: 100%;
  margin: 0 auto;
}

/* 屏幕内凹边框 */
.crt-screen-frame {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  padding: 6px;
  border-radius: 12px / 10px;
  background: linear-gradient(175deg, #0f1018 0%, #0a0b12 50%, #06070c 100%);
  box-shadow:
    inset 0 3px 8px rgba(0, 0, 0, 0.9),
    inset 0 -1px 4px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(201, 0, 255, 0.15),
    0 0 12px rgba(201, 0, 255, 0.12),
    0 4px 20px rgba(0, 0, 0, 0.6);
}

/* 屏幕区域 */
.crt-screen {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  border-radius: 8px / 7px;
  overflow: hidden;
  background: #050608;
  box-shadow:
    inset 0 0 20px rgba(0, 0, 0, 0.9),
    inset 0 0 40px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

/* 扫描线 */
.crt-scanlines {
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
  border-radius: 8px / 7px;
  background-image:
    repeating-linear-gradient(
      to bottom,
      transparent 0px,
      transparent 1px,
      rgba(0, 0, 0, 0.18) 1px,
      rgba(0, 0, 0, 0.18) 2px
    ),
    repeating-linear-gradient(
      to right,
      transparent 0px,
      transparent 2px,
      rgba(0, 0, 0, 0.05) 2px,
      rgba(0, 0, 0, 0.05) 3px
    );
  animation: scanlineBreathe 4s ease-in-out infinite;
}

@keyframes scanlineBreathe {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 0.92; }
}

/* 屏幕玻璃反光 */
.crt-glass-shine {
  position: absolute;
  inset: 0;
  z-index: 11;
  pointer-events: none;
  border-radius: 8px / 7px;
  background:
    linear-gradient(
      175deg,
      rgba(255, 255, 255, 0.06) 0%,
      rgba(255, 255, 255, 0.01) 12%,
      transparent 25%
    ),
    radial-gradient(
      ellipse at 85% 10%,
      rgba(255, 255, 255, 0.02) 0%,
      transparent 40%
    );
}

/* 电源指示灯 */
.crt-power-led {
  position: absolute;
  bottom: 4px;
  right: 6px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #ffaa44, #ff4400 60%, #991100 100%);
  box-shadow:
    0 0 4px rgba(255, 68, 0, 0.7),
    0 0 10px rgba(255, 68, 0, 0.3);
  z-index: 12;
  animation: ledFlicker 5s ease-in-out infinite;
}

@keyframes ledFlicker {
  0%, 90%, 100% { opacity: 1; }
  92% { opacity: 0.4; }
  94% { opacity: 1; }
  96% { opacity: 0.7; }
}
</style>
