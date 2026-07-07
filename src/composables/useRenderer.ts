import { ref, onMounted, type Ref } from 'vue';
import { rasterize } from '../utils/rasterizer.js';
import { RENDER_WIDTH, RENDER_HEIGHT } from '../types/renderer.js';
import type { GameState } from '../types/global.d.js';
import { useSceneBuilder } from './useSceneBuilder.js';

export function useRenderer(
  canvasRef: Ref<HTMLCanvasElement | null>,
  stateGetter: () => GameState
) {
  const isRendering = ref(false);
  let animationId: number | null = null;
  let lastTime = 0;
  let renderDirty = true;
  
  const sceneBuilder = useSceneBuilder();
  
  // 离屏Canvas缓存（背景层）
  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = RENDER_WIDTH;
  offscreenCanvas.height = RENDER_HEIGHT;
  // 离屏上下文保留供后续背景缓存使用
  void offscreenCanvas.getContext('2d', { willReadFrequently: true });
  
  // 脏区标记
  const dirtyFlags = {
    background: true,
    furniture: true,
    character: true,
    effects: true,
  };
  
  function markAllDirty() {
    dirtyFlags.background = true;
    dirtyFlags.furniture = true;
    dirtyFlags.character = true;
    dirtyFlags.effects = true;
    renderDirty = true;
  }
  
  // 渲染像素场景（手动触发）
  function renderPixelScene() {
    renderDirty = true;
  }
  
  // 主渲染循环（仅在状态变化时更新，不做无限动画循环）
  function renderLoop(time: number) {
    if (!canvasRef.value) {
      animationId = requestAnimationFrame(renderLoop);
      return;
    }
    
    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;
    
    const state = stateGetter();
    
    // 更新粒子
    sceneBuilder.updateParticles(dt, state);
    
    // 更新事件动画
    sceneBuilder.updateAnimations(dt);
    
    if (renderDirty || state.gamePhase === 'playing' || sceneBuilder.hasActiveAnimations()) {
      const primitives = sceneBuilder.generateScenePrimitives(state, time / 1000);
      const imageData = rasterize(primitives, RENDER_WIDTH, RENDER_HEIGHT);
      
      const ctx = canvasRef.value.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.putImageData(imageData, 0, 0);
      }
      
      renderDirty = false;
      dirtyFlags.effects = true; // 粒子持续运动，特效层持续脏
    }
    
    animationId = requestAnimationFrame(renderLoop);
  }
  
  function startRenderer() {
    if (animationId) return;
    lastTime = performance.now();
    animationId = requestAnimationFrame(renderLoop);
  }
  
  function stopRenderer() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }
  
  onMounted(() => {
    if (canvasRef.value) {
      canvasRef.value.width = RENDER_WIDTH;
      canvasRef.value.height = RENDER_HEIGHT;
      const ctx = canvasRef.value.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
      }
    }
    startRenderer();
  });
  
  return {
    isRendering,
    renderPixelScene,
    markAllDirty,
    startRenderer,
    stopRenderer,
    triggerShockwave: sceneBuilder.triggerShockwave,
    triggerAssetChange: sceneBuilder.triggerAssetChange,
    triggerEventAnimation: sceneBuilder.triggerEventAnimation,
    resetParticles: sceneBuilder.resetParticles,
  };
}
