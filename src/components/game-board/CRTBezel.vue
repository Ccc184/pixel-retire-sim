<script setup lang="ts">
// CRTBezel: 纯CSS复古CRT电视机边框组件
// 通过默认插槽放置Canvas内容，扫描线层作为独立合成层叠加
// 外观元素：V形天线、频道指示灯、霓虹四角装饰、调谐旋钮、喇叭格栅、底座支架、紫橙外发光
</script>

<template>
  <div class="crt-tv-set">
    <!-- V形天线 -->
    <div class="crt-antenna crt-antenna--left" aria-hidden="true"></div>
    <div class="crt-antenna crt-antenna--right" aria-hidden="true"></div>

    <!-- 电视机主体（厚壳） -->
    <div class="crt-bezel">
      <!-- 外发光层 -->
      <div class="crt-glow-outer" aria-hidden="true"></div>

      <!-- 顶部频道指示灯凸起 -->
      <div class="crt-indicator" aria-hidden="true">
        <div class="crt-indicator__bulge"></div>
        <div class="crt-indicator__light"></div>
      </div>

      <!-- 屏幕内凹边框 -->
      <div class="crt-screen-frame">
        <div class="crt-screen">
          <!-- 四角霓虹装饰线 -->
          <div class="crt-neon-corner crt-neon-corner--tl" aria-hidden="true"></div>
          <div class="crt-neon-corner crt-neon-corner--tr" aria-hidden="true"></div>
          <div class="crt-neon-corner crt-neon-corner--bl" aria-hidden="true"></div>
          <div class="crt-neon-corner crt-neon-corner--br" aria-hidden="true"></div>

          <!-- 插槽内容（PixelCanvas） -->
          <slot />

          <!-- 扫描线叠加层（仅覆盖屏幕区域） -->
          <div class="crt-scanlines" aria-hidden="true"></div>

          <!-- 屏幕玻璃反光 -->
          <div class="crt-glass-shine" aria-hidden="true"></div>

          <!-- 电视开机特效 -->
          <div class="crt-power-on" aria-hidden="true"></div>

          <!-- 信号干扰glitch特效 -->
          <div class="crt-glitch" aria-hidden="true"></div>
        </div>
      </div>

      <!-- 底部控制面板：旋钮 + 喇叭 -->
      <div class="crt-control-panel" aria-hidden="true">
        <div class="crt-knob crt-knob--left">
          <div class="crt-knob__highlight"></div>
          <div class="crt-knob__indicator"></div>
        </div>
        <div class="crt-knob crt-knob--right">
          <div class="crt-knob__highlight"></div>
          <div class="crt-knob__indicator"></div>
        </div>
        <div class="crt-speaker">
          <div class="crt-speaker__grid"></div>
        </div>
      </div>
    </div>

    <!-- 底座支架 -->
    <div class="crt-stand" aria-hidden="true">
      <div class="crt-stand-neck"></div>
      <div class="crt-stand-base"></div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================================
   颜色常量
   ============================================================ */
:root {
  --neon-blue: #00d4ff;
  --neon-pink: #ff2d95;
  --glow-purple: #c900ff;
  --glow-orange: #ff8800;
  --indicator-on: #ff4400;
  --tv-shell-dark: #1e2030;
  --tv-shell-mid: #2a2d42;
  --tv-shell-light: #3a3e58;
  --tv-shell-edge: #454a68;
  --screen-frame: #0a0b12;
  --screen-inner: #050608;
}

/* ============================================================
   外层容器：透视角度 + 定位上下文
   ============================================================ */
.crt-tv-set {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: 'DotGothic16', monospace;
  transform: perspective(1400px) rotateX(4deg);
  transform-origin: center bottom;
  margin: 0 auto;
  padding-top: 45px; /* 给天线留空间 */
  padding-bottom: 12px; /* 给底座留空间 */
}

/* ============================================================
   V形天线（紫橙渐变）
   ============================================================ */
.crt-antenna {
  position: absolute;
  top: 0;
  width: 4px;
  height: 60px;
  border-radius: 2px;
  z-index: 5;
  transform-origin: bottom center;
}

.crt-antenna--left {
  left: calc(50% - 30px);
  transform: rotate(-28deg);
  background: linear-gradient(
    to top,
    var(--glow-purple) 0%,
    #d94dff 35%,
    var(--glow-orange) 70%,
    #ffaa44 100%
  );
  box-shadow:
    0 0 6px rgba(201, 0, 255, 0.6),
    0 0 12px rgba(255, 136, 0, 0.3);
}

.crt-antenna--right {
  right: calc(50% - 30px);
  transform: rotate(28deg);
  background: linear-gradient(
    to top,
    var(--glow-purple) 0%,
    #d94dff 35%,
    var(--glow-orange) 70%,
    #ffaa44 100%
  );
  box-shadow:
    0 0 6px rgba(201, 0, 255, 0.6),
    0 0 12px rgba(255, 136, 0, 0.3);
}

/* 天线顶部小球 */
.crt-antenna::after {
  content: '';
  position: absolute;
  top: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #ffcc66, var(--glow-orange) 50%, #cc5500 100%);
  box-shadow:
    0 0 8px rgba(255, 136, 0, 0.7),
    0 0 16px rgba(255, 136, 0, 0.4);
}

/* 天线底部固定座 */
.crt-antenna::before {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 14px;
  height: 10px;
  border-radius: 3px 3px 2px 2px;
  background: linear-gradient(to bottom, var(--tv-shell-light), var(--tv-shell-dark));
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.5);
  z-index: 6;
}

/* ============================================================
   电视机主体（厚壳）
   ============================================================ */
.crt-bezel {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  padding: 14px 18px 10px 18px;
  border-radius: 24px / 18px;
  background: linear-gradient(
    170deg,
    var(--tv-shell-light) 0%,
    var(--tv-shell-mid) 25%,
    var(--tv-shell-dark) 70%,
    #151722 100%
  );
  box-shadow:
    /* 外壳立体感 */
    inset 0 2px 0 rgba(255, 255, 255, 0.08),
    inset 0 -3px 0 rgba(0, 0, 0, 0.4),
    inset 3px 0 0 rgba(255, 255, 255, 0.04),
    inset -3px 0 0 rgba(0, 0, 0, 0.3),
    /* 底部投影 */
    0 12px 40px rgba(0, 0, 0, 0.7),
    0 4px 12px rgba(0, 0, 0, 0.5);
  width: 100%;
  overflow: visible;
}

/* ============================================================
   外发光层（紫→橙渐变外发光）
   ============================================================ */
.crt-glow-outer {
  position: absolute;
  inset: -6px;
  border-radius: 32px / 26px;
  background: linear-gradient(
    135deg,
    var(--glow-purple) 0%,
    #a033ff 30%,
    var(--glow-orange) 70%,
    #ff6600 100%
  );
  z-index: -1;
  filter: blur(18px);
  opacity: 0.65;
  animation: glowPulse 3s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% {
    opacity: 0.55;
    filter: blur(18px);
  }
  50% {
    opacity: 0.75;
    filter: blur(22px);
  }
}

/* ============================================================
   顶部频道指示灯凸起区域
   ============================================================ */
.crt-indicator {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 3;
}

.crt-indicator__bulge {
  width: 48px;
  height: 14px;
  border-radius: 6px 6px 3px 3px;
  background: linear-gradient(
    to bottom,
    var(--tv-shell-light) 0%,
    var(--tv-shell-mid) 60%,
    var(--tv-shell-dark) 100%
  );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    inset 0 -1px 0 rgba(0, 0, 0, 0.3),
    0 2px 4px rgba(0, 0, 0, 0.4);
}

.crt-indicator__light {
  position: absolute;
  top: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #ffaa44, var(--indicator-on) 50%, #991100 100%);
  box-shadow:
    0 0 6px var(--indicator-on),
    0 0 14px rgba(255, 68, 0, 0.7),
    0 0 28px rgba(255, 68, 0, 0.35),
    inset 0 1px 2px rgba(255, 200, 100, 0.5);
  animation: indicatorFlicker 4s ease-in-out infinite;
}

@keyframes indicatorFlicker {
  0%, 92%, 100% {
    opacity: 1;
    box-shadow:
      0 0 6px var(--indicator-on),
      0 0 14px rgba(255, 68, 0, 0.7),
      0 0 28px rgba(255, 68, 0, 0.35);
  }
  94% {
    opacity: 0.5;
    box-shadow:
      0 0 3px var(--indicator-on),
      0 0 7px rgba(255, 68, 0, 0.4);
  }
  96% {
    opacity: 1;
    box-shadow:
      0 0 8px var(--indicator-on),
      0 0 18px rgba(255, 68, 0, 0.8),
      0 0 32px rgba(255, 68, 0, 0.45);
  }
  98% {
    opacity: 0.7;
  }
}

/* ============================================================
   屏幕内凹边框
   ============================================================ */
.crt-screen-frame {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  padding: 8px;
  border-radius: 14px / 10px;
  background: linear-gradient(
    175deg,
    #0f1018 0%,
    var(--screen-frame) 50%,
    #06070c 100%
  );
  box-shadow:
    inset 0 4px 12px rgba(0, 0, 0, 0.9),
    inset 0 -2px 6px rgba(0, 0, 0, 0.6),
    inset 2px 0 4px rgba(0, 0, 0, 0.5),
    inset -2px 0 4px rgba(0, 0, 0, 0.5),
    0 1px 0 rgba(255, 255, 255, 0.05);
}

/* ============================================================
   屏幕玻璃区域
   ============================================================ */
.crt-screen {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  border-radius: 10px / 8px;
  overflow: hidden;
  background: var(--screen-inner);
  box-shadow:
    /* 屏幕玻璃内凹效果 */
    inset 0 0 30px rgba(0, 0, 0, 0.95),
    inset 0 0 60px rgba(0, 0, 0, 0.6),
    /* 屏幕边缘微亮 */
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

/* 插槽内容容器：确保canvas正确填充 */
.crt-screen :deep(.canvas-container) {
  border-radius: 0 !important;
}

/* ============================================================
   四角霓虹装饰线
   L形：每个角只显示两条边
   ============================================================ */
.crt-neon-corner {
  position: absolute;
  width: 32px;
  height: 32px;
  z-index: 8;
  pointer-events: none;
}

/* 左上角 - 蓝色 */
.crt-neon-corner--tl {
  top: 6px;
  left: 6px;
  border-top: 2px solid var(--neon-blue);
  border-left: 2px solid var(--neon-blue);
  border-radius: 4px 0 0 0;
  box-shadow:
    -1px -1px 6px var(--neon-blue),
    0 0 10px rgba(0, 212, 255, 0.5),
    inset 1px 1px 4px rgba(0, 212, 255, 0.3);
}

.crt-neon-corner--tl::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  width: 6px;
  height: 6px;
  border-top: 2px solid var(--neon-blue);
  border-left: 2px solid var(--neon-blue);
  border-radius: 2px 0 0 0;
  opacity: 0.5;
}

/* 右上角 - 粉色 */
.crt-neon-corner--tr {
  top: 6px;
  right: 6px;
  border-top: 2px solid var(--neon-pink);
  border-right: 2px solid var(--neon-pink);
  border-radius: 0 4px 0 0;
  box-shadow:
    1px -1px 6px var(--neon-pink),
    0 0 10px rgba(255, 45, 149, 0.5),
    inset -1px 1px 4px rgba(255, 45, 149, 0.3);
}

.crt-neon-corner--tr::after {
  content: '';
  position: absolute;
  top: -2px;
  right: -2px;
  width: 6px;
  height: 6px;
  border-top: 2px solid var(--neon-pink);
  border-right: 2px solid var(--neon-pink);
  border-radius: 0 2px 0 0;
  opacity: 0.5;
}

/* 左下角 - 蓝色 */
.crt-neon-corner--bl {
  bottom: 6px;
  left: 6px;
  border-bottom: 2px solid var(--neon-blue);
  border-left: 2px solid var(--neon-blue);
  border-radius: 0 0 0 4px;
  box-shadow:
    -1px 1px 6px var(--neon-blue),
    0 0 10px rgba(0, 212, 255, 0.5),
    inset 1px -1px 4px rgba(0, 212, 255, 0.3);
}

.crt-neon-corner--bl::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: -2px;
  width: 6px;
  height: 6px;
  border-bottom: 2px solid var(--neon-blue);
  border-left: 2px solid var(--neon-blue);
  border-radius: 0 0 0 2px;
  opacity: 0.5;
}

/* 右下角 - 粉色 */
.crt-neon-corner--br {
  bottom: 6px;
  right: 6px;
  border-bottom: 2px solid var(--neon-pink);
  border-right: 2px solid var(--neon-pink);
  border-radius: 0 0 4px 0;
  box-shadow:
    1px 1px 6px var(--neon-pink),
    0 0 10px rgba(255, 45, 149, 0.5),
    inset -1px -1px 4px rgba(255, 45, 149, 0.3);
}

.crt-neon-corner--br::after {
  content: '';
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 6px;
  height: 6px;
  border-bottom: 2px solid var(--neon-pink);
  border-right: 2px solid var(--neon-pink);
  border-radius: 0 0 2px 0;
  opacity: 0.5;
}

/* ============================================================
   扫描线层（仅覆盖屏幕内部）
   ============================================================ */
.crt-scanlines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  pointer-events: none;
  will-change: transform, opacity;
  border-radius: 12px / 10px;
  background-image:
    /* 水平扫描线 - 密度加倍，更细腻 */
    repeating-linear-gradient(
      to bottom,
      transparent 0px,
      transparent 1px,
      rgba(0, 0, 0, 0.22) 1px,
      rgba(0, 0, 0, 0.22) 2px
    ),
    /* 垂直像素网格线 */
    repeating-linear-gradient(
      to right,
      transparent 0px,
      transparent 2px,
      rgba(0, 0, 0, 0.07) 2px,
      rgba(0, 0, 0, 0.07) 3px
    );
  animation: scanlineBreathe 4s ease-in-out infinite, scanlineFlicker 6s ease-in-out infinite;
}

/* 禁用全局 ::before 伪元素扫描线，避免双重叠加 */
.crt-scanlines::before {
  content: none !important;
}

/* 扫描线呼吸动画 */
@keyframes scanlineBreathe {
  0%, 100% {
    opacity: 0.85;
  }
  50% {
    opacity: 0.95;
  }
}

/* ============================================================
   屏幕玻璃反光效果
   ============================================================ */
.crt-glass-shine {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 11;
  pointer-events: none;
  border-radius: 12px / 10px;
  background:
    /* 顶部高光带 */
    linear-gradient(
      175deg,
      rgba(255, 255, 255, 0.08) 0%,
      rgba(255, 255, 255, 0.02) 15%,
      transparent 30%
    ),
    /* 左下斜反光 */
    radial-gradient(
      ellipse at 20% 90%,
      rgba(100, 150, 255, 0.04) 0%,
      transparent 50%
    ),
    /* 右上微反光 */
    radial-gradient(
      ellipse at 85% 10%,
      rgba(255, 255, 255, 0.03) 0%,
      transparent 40%
    );
}

/* ============================================================
   底部控制面板
   ============================================================ */
.crt-control-panel {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px 2px 12px;
  margin-top: 0;
  width: 100%;
  box-sizing: border-box;
}

/* ============================================================
   调谐旋钮（radial-gradient立体感）
   ============================================================ */
.crt-knob {
  position: relative;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  flex-shrink: 0;
  background: radial-gradient(
    circle at 35% 30%,
    #5a5f7a 0%,
    var(--tv-shell-mid) 30%,
    var(--tv-shell-dark) 65%,
    #0e0f18 100%
  );
  box-shadow:
    inset 0 -3px 6px rgba(0, 0, 0, 0.6),
    inset 0 2px 4px rgba(255, 255, 255, 0.1),
    0 3px 8px rgba(0, 0, 0, 0.6),
    0 1px 2px rgba(255, 255, 255, 0.05);
}

/* 旋钮高光点 */
.crt-knob__highlight {
  position: absolute;
  top: 6px;
  left: 8px;
  width: 10px;
  height: 7px;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at 40% 30%,
    rgba(255, 255, 255, 0.35) 0%,
    rgba(255, 255, 255, 0.08) 50%,
    transparent 100%
  );
}

/* 旋钮指示线 */
.crt-knob__indicator {
  position: absolute;
  top: 4px;
  left: 50%;
  width: 2px;
  height: 10px;
  border-radius: 2px;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.3),
    rgba(255, 255, 255, 0.08)
  );
  transform: translateX(-50%) rotate(var(--knob-rotate, 0deg));
  transform-origin: center 13px;
}

.crt-knob--left {
  --knob-rotate: -35deg;
}

.crt-knob--right {
  --knob-rotate: 20deg;
}

.crt-knob:active .crt-knob__indicator,
.crt-knob--spinning .crt-knob__indicator {
  animation: knobSpin 0.5s ease-in-out;
}

/* 旋钮外圈细环 */
.crt-knob::before {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.4);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
}

/* 旋钮防滑齿纹（用conic-gradient模拟） */
.crt-knob::after {
  content: '';
  position: absolute;
  inset: 6px;
  border-radius: 50%;
  background: repeating-conic-gradient(
    rgba(0, 0, 0, 0.15) 0deg 3deg,
    transparent 3deg 15deg
  );
  opacity: 0.5;
}

/* ============================================================
   喇叭/显示屏区域
   ============================================================ */
.crt-speaker {
  flex: 1;
  height: 30px;
  border-radius: 6px;
  background: linear-gradient(
    to bottom,
    #0d0e15 0%,
    #12141e 50%,
    #0a0b10 100%
  );
  box-shadow:
    inset 0 2px 6px rgba(0, 0, 0, 0.8),
    inset 0 -1px 2px rgba(255, 255, 255, 0.03),
    0 1px 0 rgba(255, 255, 255, 0.05);
  position: relative;
  overflow: hidden;
  margin-left: 8px;
}

/* 喇叭格栅网格 */
.crt-speaker__grid {
  position: absolute;
  inset: 4px;
  border-radius: 3px;
  background-image:
    repeating-linear-gradient(
      to right,
      transparent 0px,
      transparent 3px,
      rgba(0, 0, 0, 0.35) 3px,
      rgba(0, 0, 0, 0.35) 4px
    ),
    repeating-linear-gradient(
      to bottom,
      transparent 0px,
      transparent 3px,
      rgba(0, 0, 0, 0.25) 3px,
      rgba(0, 0, 0, 0.25) 4px
    );
  opacity: 0.8;
}

/* 喇叭品牌文字位（暗纹） */
.crt-speaker::after {
  content: 'PIXEL-TV';
  position: absolute;
  bottom: 2px;
  right: 6px;
  font-size: 7px;
  color: rgba(255, 255, 255, 0.12);
  letter-spacing: 1px;
  font-family: 'DotGothic16', monospace;
}

/* ============================================================
   底座支架
   ============================================================ */
.crt-stand {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: -1;
  margin-top: -4px;
}

.crt-stand-neck {
  width: 50px;
  height: 12px;
  background: linear-gradient(
    to bottom,
    var(--tv-shell-mid) 0%,
    var(--tv-shell-dark) 100%
  );
  clip-path: polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
}

.crt-stand-base {
  width: 130px;
  height: 10px;
  border-radius: 0 0 6px 6px;
  background: linear-gradient(
    to bottom,
    var(--tv-shell-mid) 0%,
    var(--tv-shell-dark) 50%,
    #12141e 100%
  );
  box-shadow:
    0 6px 20px rgba(0, 0, 0, 0.6),
    0 2px 6px rgba(0, 0, 0, 0.5);
  margin-top: -1px;
}

/* 底座底部阴影椭圆 */
.crt-stand-base::after {
  content: '';
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 20px;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at center,
    rgba(0, 0, 0, 0.5) 0%,
    transparent 70%
  );
}

/* ============================================================
   电视开机特效
   ============================================================ */
.crt-power-on {
  position: absolute;
  inset: 0;
  z-index: 20;
  pointer-events: none;
  border-radius: 12px / 10px;
  animation: crtPowerOn 1.2s ease-out forwards;
}

.crt-power-on::before {
  content: '';
  position: absolute;
  inset: 0;
  background: #ffffff;
  opacity: 0;
  border-radius: inherit;
  animation: crtPowerOnGlow 1.2s ease-out forwards;
}

.crt-power-on::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 6px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow:
    0 0 16px rgba(255, 255, 255, 0.9),
    0 0 40px rgba(255, 255, 255, 0.5);
  opacity: 0;
  animation: crtPowerOnSweep 1.2s ease-out forwards;
}

@keyframes crtPowerOn {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

@keyframes crtPowerOnGlow {
  0% {
    opacity: 1;
    clip-path: circle(0% at 50% 50%);
  }
  35% {
    opacity: 1;
    clip-path: circle(150% at 50% 50%);
  }
  60% {
    opacity: 0.85;
  }
  100% {
    opacity: 0;
    clip-path: circle(150% at 50% 50%);
  }
}

@keyframes crtPowerOnSweep {
  0%, 28% {
    opacity: 0;
    transform: translateY(-10px);
  }
  32% {
    opacity: 1;
  }
  52% {
    transform: translateY(100vh);
    opacity: 1;
  }
  58%, 100% {
    opacity: 0;
    transform: translateY(100vh);
  }
}

/* ============================================================
   信号干扰glitch特效
   ============================================================ */
.crt-glitch {
  position: absolute;
  inset: 0;
  z-index: 15;
  pointer-events: none;
  border-radius: 12px / 10px;
  overflow: hidden;
  opacity: 0;
  animation: glitchTrigger 5s infinite;
}

.crt-glitch::before,
.crt-glitch::after {
  content: '';
  position: absolute;
  left: -8px;
  right: -8px;
  top: 0;
  bottom: 0;
  opacity: 0;
  mix-blend-mode: screen;
}

.crt-glitch::before {
  background: rgba(255, 0, 80, 0.18);
  animation: glitchShift 5s infinite, glitchRGB 5s infinite;
}

.crt-glitch::after {
  background: rgba(0, 212, 255, 0.18);
  animation: glitchShift 5s infinite reverse, glitchRGB 5s infinite reverse;
  animation-delay: 0.05s;
}

@keyframes glitchTrigger {
  0%, 92%, 94%, 96%, 98%, 100% {
    opacity: 0;
  }
  93%, 95%, 97% {
    opacity: 1;
  }
}

@keyframes glitchShift {
  0%, 92%, 100% {
    clip-path: inset(0 0 100% 0);
    transform: translateX(0);
  }
  93% {
    clip-path: inset(10% 0 70% 0);
    transform: translateX(-8px);
  }
  94% {
    clip-path: inset(35% 0 45% 0);
    transform: translateX(6px);
  }
  95% {
    clip-path: inset(60% 0 25% 0);
    transform: translateX(-5px);
  }
  96% {
    clip-path: inset(80% 0 5% 0);
    transform: translateX(7px);
  }
  97% {
    clip-path: inset(20% 0 60% 0);
    transform: translateX(-3px);
  }
  98% {
    clip-path: inset(0 0 100% 0);
    transform: translateX(0);
  }
}

@keyframes glitchRGB {
  0%, 92%, 100% {
    opacity: 0;
  }
  93% {
    opacity: 1;
    transform: translateX(-4px);
  }
  94% {
    opacity: 0.7;
    transform: translateX(4px);
  }
  95% {
    opacity: 1;
    transform: translateX(-3px);
  }
  96% {
    opacity: 0.6;
    transform: translateX(5px);
  }
  97% {
    opacity: 0.8;
    transform: translateX(-2px);
  }
  98% {
    opacity: 0;
  }
}

/* ============================================================
   屏幕震动（黑天鹅事件）
   ============================================================ */
.crt-shake {
  animation: crtShake 0.3s ease-in-out;
}

@keyframes crtShake {
  0% { transform: perspective(1400px) rotateX(4deg) translate(0, 0); }
  10% { transform: perspective(1400px) rotateX(4deg) translate(-2px, 1px); }
  20% { transform: perspective(1400px) rotateX(4deg) translate(2px, -2px); }
  30% { transform: perspective(1400px) rotateX(4deg) translate(-1px, -1px); }
  40% { transform: perspective(1400px) rotateX(4deg) translate(2px, 2px); }
  50% { transform: perspective(1400px) rotateX(4deg) translate(-2px, -2px); }
  60% { transform: perspective(1400px) rotateX(4deg) translate(1px, -1px); }
  70% { transform: perspective(1400px) rotateX(4deg) translate(-1px, 2px); }
  80% { transform: perspective(1400px) rotateX(4deg) translate(2px, -1px); }
  90% { transform: perspective(1400px) rotateX(4deg) translate(-2px, 1px); }
  100% { transform: perspective(1400px) rotateX(4deg) translate(0, 0); }
}

/* ============================================================
   扫描线间歇性闪烁
   ============================================================ */
@keyframes scanlineFlicker {
  0%, 90%, 92%, 100% {
    opacity: 1;
  }
  91% {
    opacity: 1.3;
    filter: brightness(1.15);
  }
}

/* ============================================================
   旋钮旋转动画
   ============================================================ */
@keyframes knobSpin {
  0% {
    transform: translateX(-50%) rotate(var(--knob-rotate, 0deg));
  }
  100% {
    transform: translateX(-50%) rotate(calc(var(--knob-rotate, 0deg) + 360deg));
  }
}
</style>
