import { ref } from 'vue';
import type { PixelPrimitive, Particle, PicoColorIndex } from '../types/renderer.js';
import type { GameState } from '../types/global.d.js';
import { generateDualSkyline, createSeededRandom } from '../utils/procedural.js';

// 粒子池（按设计书规约）
const MAX_PARTICLES = 60;
const PARTICLE_MAX_LIFE = 120;

// ================================================================
// 事件动画系统类型
// ================================================================
export type SceneAnimationType = 'rain' | 'fireworks' | 'hearts' | 'money_rain' | 'lightning' | 'tears' | 'confetti' | 'skull' | 'gold_burst' | 'house_build';

interface SceneAnimation {
  type: SceneAnimationType;
  timer: number;        // 动画持续时间（秒），-1表示持续到手动清除
  maxTimer: number;     // 初始持续时间
  intensity: number;   // 强度 0-1
  // 每种动画的内部粒子状态（用于持续性动画的种子/进度）
  seed: number;
  particles: AnimationParticle[];
}

interface AnimationParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  colorIndex: PicoColorIndex;
  extra?: number; // 用于摇摆/闪烁等额外参数
}

// 场景常量
const GROUND_Y = 216;       // 地面顶边 Y 坐标（地面覆盖 y=216~255）
const GROUND_H = 40;        // 地面高度
const CANVAS_W = 256;
const CANVAS_H = 256;
const SUN_CX = 172;         // 夕阳中心 X
const SUN_CY = 162;         // 夕阳中心 Y
const SUN_R_INNER = 12;     // 夕阳内圈半径（色盘2）
const SUN_R_OUTER = 20;     // 夕阳外圈光晕半径（色盘7）
const PERSON_X = 128;       // 主角中心 X
const STAR_SEED = 4201;     // 星星固定种子
const BASE_STAR_COUNT = 50; // 基础星星数量
const SCENE_SEED = 2024;    // 天际线种子

export function useSceneBuilder() {
  const particles = ref<Particle[]>([]);
  const shockwave = ref<{ radius: number; active: boolean }>({ radius: 0, active: false });
  const assetParticles = ref<Particle[]>([]); // 资产变动粒子

  // 事件动画队列
  const activeAnimations = ref<SceneAnimation[]>([]);

  // 粒子生成计时器
  let particleAccum = 0;

  // 根据游戏状态生成场景图元
  function generateScenePrimitives(state: GameState, time: number = 0): PixelPrimitive[] {
    const primitives: PixelPrimitive[] = [];

    // 从state中读取身心状态（由其他agent添加的字段，使用 ?? 提供默认值）
    const stress = (state as any).stress ?? 30;
    const happiness = (state as any).happiness ?? 60;
    const health = (state as any).health ?? 80;
    const partner = (state as any).partner as any;
    const children = (state as any).children as any[] ?? [];
    const savings = state.currentSavings;

    // ================================================================
    // Layer 1: 天空氛围 —— 夕阳渐变 + 星空 + 夕阳
    // ================================================================

    // --- 1a. 天空渐变带 ---
    drawSunsetGlow(primitives);

    // --- 1b. 夕阳 ---
    drawSun(primitives);

    // --- 1c. 星星（存款越高，星星越多越亮）---
    const extraStars = savings >= 2000000 ? 40 : savings >= 500000 ? 20 : savings >= 100000 ? 10 : 0;
    drawStars(primitives, BASE_STAR_COUNT + extraStars);

    // 闪烁星星（5颗，用sin波控制显隐）
    for (let i = 0; i < 5; i++) {
      const phase = i * 1.7 + time * (0.8 + i * 0.3);
      const alpha = Math.sin(phase);
      if (alpha > 0.3) {
        const sx = 20 + i * 50;
        const sy = 10 + (i % 3) * 8;
        primitives.push({ type: 'point', x: sx, y: sy, colorIndex: 7, layer: 1 });
      }
    }

    // --- 1d. 压力高时：画面边缘红色脉动（用角落散点模拟）---
    if (stress > 70) {
      drawStressVignette(primitives);
    }

    // ================================================================
    // Layer 2 & 3: 建筑 + 地面
    // ================================================================
    // 根据城市选择天际线颜色
    let skyFarColor: PicoColorIndex, skyNearColor: PicoColorIndex, skyWindowColor: PicoColorIndex;
    if (state.currentCity === '资本修罗场') {
      skyFarColor = 1 as PicoColorIndex;    // 深蓝紫
      skyNearColor = 0 as PicoColorIndex;   // 黑
      skyWindowColor = 7 as PicoColorIndex; // 白灯，更亮
    } else if (state.currentCity === '避风低洼地') {
      skyFarColor = 5 as PicoColorIndex;    // 深蓝灰
      skyNearColor = 6 as PicoColorIndex;   // 灰
      skyWindowColor = 2 as PicoColorIndex; // 暖黄灯
    } else {
      // 中坚大后方（默认）
      skyFarColor = 6 as PicoColorIndex;    // 灰蓝
      skyNearColor = 0 as PicoColorIndex;   // 深色剪影
      skyWindowColor = 2 as PicoColorIndex; // 暖黄
    }
    const skyline = generateDualSkyline(
      CANVAS_W,
      GROUND_Y,
      state.economicCycle,
      SCENE_SEED,
      state.currentCity,
      skyFarColor,
      skyNearColor,
      skyWindowColor,
    );
    primitives.push(...skyline);

    // --- 3a. 地面基底（色盘6深灰蓝）---
    primitives.push({ type: 'rect', x: 0, y: GROUND_Y, w: CANVAS_W, h: GROUND_H, colorIndex: 6, layer: 3 });

    // --- 3b. 地面深色纹理斑块 ---
    drawGroundTexture(primitives);

    // --- 3c. 地面绿色荧光反光区域（幸福感高时更亮）---
    drawGroundGlow(primitives, happiness);

    // --- 3d. 地平线分割线 ---
    for (let x = 0; x < CANVAS_W; x += 2) {
      primitives.push({ type: 'point', x, y: GROUND_Y - 1, colorIndex: 0, layer: 3 });
    }

    // --- 3e. 街道小道具：小车（如果购车，停在右侧地面）---
    if (state.hasCar) {
      drawCar(primitives, 200, GROUND_Y, (state as any).carType);
    }

    // --- 3f. 街道小灯 ---
    drawStreetLights(primitives, time);

    // --- 3f-2. 城市特色地面元素 ---
    if (state.currentCity === '资本修罗场') {
      // 斑马线：2-3组白色横线，每组3条短横线
      const zebraCrossings = [
        { cx: 90 },   // x=80-100
        { cx: 150 },  // x=140-160
        { cx: 220 },  // 第三组
      ];
      for (const zc of zebraCrossings) {
        for (let strip = 0; strip < 3; strip++) {
          const sy = GROUND_Y + 2 + strip * 3;
          for (let dx = -4; dx <= 4; dx += 2) {
            primitives.push({ type: 'point', x: zc.cx + dx, y: sy, colorIndex: 7, layer: 3 });
          }
        }
      }
      // 更多路灯（资本修罗场街道灯更密集）
      const extraLights = [
        { x: 110, y: GROUND_Y - 18 },
        { x: 160, y: GROUND_Y - 20 },
        { x: 190, y: GROUND_Y - 16 },
      ];
      for (const l of extraLights) {
        primitives.push({ type: 'rect', x: l.x, y: l.y + 4, w: 1, h: GROUND_Y - l.y - 4, colorIndex: 6, layer: 3 });
        primitives.push({ type: 'point', x: l.x, y: l.y, colorIndex: 7, layer: 3 });
        primitives.push({ type: 'point', x: l.x - 1, y: l.y + 1, colorIndex: 7, layer: 3 });
        primitives.push({ type: 'point', x: l.x + 1, y: l.y + 1, colorIndex: 7, layer: 3 });
      }
    } else if (state.currentCity === '避风低洼地') {
      // 草丛：绿色小点散点，在房子周围和空地上
      const grassRng = createSeededRandom(8801);
      const grassPositions: { x: number; y: number }[] = [];
      // 房子周围草丛
      for (let i = 0; i < 12; i++) {
        const gx = Math.floor(grassRng() * CANVAS_W);
        const gy = GROUND_Y - 1;
        grassPositions.push({ x: gx, y: gy });
      }
      for (const g of grassPositions) {
        primitives.push({ type: 'point', x: g.x, y: g.y, colorIndex: 5, layer: 3 });
        // 草丛偶尔有小高点
        if (grassRng() < 0.4) {
          primitives.push({ type: 'point', x: g.x, y: g.y - 1, colorIndex: 5, layer: 3 });
        }
      }
      // 低矮栅栏（几段小栅栏）
      const fenceSegments = [
        { startX: 100, len: 12 },
        { startX: 160, len: 10 },
        { startX: 220, len: 8 },
      ];
      for (const fs of fenceSegments) {
        for (let fx = fs.startX; fx < fs.startX + fs.len; fx += 3) {
          primitives.push({ type: 'rect', x: fx, y: GROUND_Y - 4, w: 1, h: 4, colorIndex: 4, layer: 3 });
        }
        // 横梁
        primitives.push({ type: 'rect', x: fs.startX, y: GROUND_Y - 3, w: fs.len, h: 1, colorIndex: 4, layer: 3 });
      }
    }

    // --- 3g. 买房后：前景出现小房子/公寓轮廓 ---
    if (state.hasProperty) {
      drawHouse(primitives, 40, GROUND_Y, (state as any).houseType);
    }

    // --- 3h. 有子女后：小房子旁出现玩具/滑梯 ---
    if (children.length > 0 && state.hasProperty) {
      drawPlayground(primitives, 55, GROUND_Y);
    }

    // ================================================================
    // Layer 4: 人物 + 家人 + 粒子 + 冲击波
    // ================================================================

    // --- 4a. 主角像素小人（衣服颜色随存款变化）---
    const shirtColor = getShirtColorBySavings(savings);
    const isStressed = stress > 70;
    const isHappy = happiness > 70;
    const isSick = health < 30;

    drawPerson(primitives, PERSON_X, GROUND_Y, {
      hairColor: 7,     // 橙色头发 #ef7d57
      shirtColor,
      skinColor: isSick ? 6 : 2,     // 健康低时面色苍白(灰色)
      pantsColor: 6,    // 深灰裤子
      layer: 4,
      pose: isStressed ? 'head-hold' : isHappy ? 'jump' : 'normal',
    });

    // 主角呼吸微动（只有normal姿态才浮动）
    if (!isStressed && !isHappy) {
      const breathOffset = Math.round(Math.sin(time * 1.5) * 0.8);
      if (breathOffset !== 0) {
        // 在主角头顶画一个微移的点来表示浮动
        primitives.push({ type: 'point', x: PERSON_X, y: GROUND_Y - 20 + breathOffset, colorIndex: shirtColor, layer: 4 });
      }
    }

    // --- 4b. 失业时：头顶灰色乌云粒子 ---
    if (state.isUnemployed) {
      drawRainCloud(primitives, PERSON_X, GROUND_Y - 28);
    }

    // --- 4c. 伴侣（有伴侣时站在主角右侧，不同发色）---
    if (partner && !partner.divorced) {
      drawPerson(primitives, PERSON_X + 16, GROUND_Y, {
        hairColor: 3,    // 粉红头发
        shirtColor: 5,   // 绿色上衣
        skinColor: 2,
        pantsColor: 6,
        layer: 4,
        scale: 0.9,
      });
    }

    // --- 4d. 子女（根据成长阶段显示不同大小）---
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const childAge = child.age ?? 6;
      let childScale: number;
      if (childAge < 3) childScale = 0.4;
      else if (childAge < 6) childScale = 0.5;
      else if (childAge < 12) childScale = 0.6;
      else if (childAge < 15) childScale = 0.75;
      else childScale = 0.85;

      const childX = PERSON_X - 14 - i * 12;
      drawPerson(primitives, childX, GROUND_Y, {
        hairColor: 2,
        shirtColor: 3,   // 粉红色
        skinColor: 2,
        pantsColor: 6,
        layer: 4,
        scale: childScale,
      });
    }

    // --- 4e. 幸福感高：绿色音符粒子 ---
    if (isHappy) {
      for (const p of particles.value) {
        if (p.colorIndex === 5) {
          drawMusicNote(primitives, p);
        }
      }
    }

    // --- 4f. $符号粒子（副业）---
    for (const p of particles.value) {
      if (p.colorIndex !== 5 || !isHappy) {
        drawDollarParticle(primitives, p);
      }
    }

    // --- 4g. 资产变动粒子 ---
    for (const p of assetParticles.value) {
      const alpha = p.life / p.maxLife;
      const flicker = alpha < 0.3 ? (Math.floor(p.life) % 2 === 0 ? 1 : 0) : 1;
      if (flicker) {
        primitives.push({ type: 'point', x: Math.round(p.x), y: Math.round(p.y), colorIndex: p.colorIndex, layer: 4 });
      }
    }

    // --- 4h. 冲击波圆环 ---
    if (shockwave.value.active && shockwave.value.radius < 130) {
      const r = Math.round(shockwave.value.radius);
      const cx = 128, cy = 128;
      for (let angle = 0; angle < 360; angle += 8) {
        const rad = angle * Math.PI / 180;
        const px = Math.round(cx + Math.cos(rad) * r);
        const py = Math.round(cy + Math.sin(rad) * r);
        if (px >= 0 && px < CANVAS_W && py >= 0 && py < CANVAS_H) {
          const colorIdx: PicoColorIndex = (angle % 16 === 0) ? 7 : 2;
          primitives.push({ type: 'point', x: px, y: py, colorIndex: colorIdx, layer: 4 });
        }
      }
    }

    // ================================================================
    // Layer 5: 事件动画叠加层
    // ================================================================
    for (const anim of activeAnimations.value) {
      drawEventAnimation(primitives, anim);
    }

    return primitives;
  }

  // ================================================================
  //  根据存款决定衣服颜色
  // ================================================================
  function getShirtColorBySavings(savings: number): PicoColorIndex {
    if (savings >= 2000000) return 2;    // 金边(暖黄)
    if (savings >= 500000) return 1;    // 西装(白色)
    if (savings >= 100000) return 4;    // 普通蓝
    return 6;                            // 破旧灰
  }

  // ================================================================
  //  天空绘制辅助
  // ================================================================

  /** 绘制夕阳渐变天空带 */
  function drawSunsetGlow(primitives: PixelPrimitive[]): void {
    // 紫色过渡带
    primitives.push({ type: 'rect', x: 0, y: 80, w: CANVAS_W, h: 50, colorIndex: 6, layer: 1 });
    // 橙色主带
    primitives.push({ type: 'rect', x: 0, y: 120, w: CANVAS_W, h: 60, colorIndex: 7, layer: 1 });
    // 黄色地平线亮带
    primitives.push({ type: 'rect', x: 0, y: 165, w: CANVAS_W, h: 51, colorIndex: 2, layer: 1 });

    // 边界抖动
    const ditherRng = createSeededRandom(3301);
    for (let y = 72; y < 85; y++) {
      const density = y < 80 ? (80 - y) * 0.04 : (y - 80) * 0.06;
      for (let x = 0; x < CANVAS_W; x += 2) {
        if (ditherRng() < density) {
          primitives.push({ type: 'point', x, y, colorIndex: 6, layer: 1 });
        }
      }
    }
    for (let y = 112; y < 128; y++) {
      for (let x = 0; x < CANVAS_W; x += 2) {
        const r = ditherRng();
        if (y < 120) {
          if (r < 0.2) primitives.push({ type: 'point', x, y, colorIndex: 7, layer: 1 });
        } else {
          if (r < 0.15) primitives.push({ type: 'point', x, y, colorIndex: 6, layer: 1 });
        }
      }
    }
    for (let y = 155; y < 175; y++) {
      for (let x = 0; x < CANVAS_W; x += 2) {
        const r = ditherRng();
        if (y < 165) {
          if (r < 0.25) primitives.push({ type: 'point', x, y, colorIndex: 2, layer: 1 });
        } else {
          if (r < 0.2) primitives.push({ type: 'point', x, y, colorIndex: 7, layer: 1 });
        }
      }
    }
  }

  /** 绘制夕阳 */
  function drawSun(primitives: PixelPrimitive[]): void {
    const sunRng = createSeededRandom(91011);

    for (let dy = -SUN_R_OUTER; dy <= SUN_R_OUTER; dy++) {
      for (let dx = -SUN_R_OUTER; dx <= SUN_R_OUTER; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= SUN_R_INNER || dist > SUN_R_OUTER) continue;
        const x = SUN_CX + dx;
        const y = SUN_CY + dy;
        if (x < 0 || x >= CANVAS_W || y < 0 || y >= CANVAS_H) continue;
        const outerFactor = 1 - (dist - SUN_R_INNER) / (SUN_R_OUTER - SUN_R_INNER);
        if (sunRng() < outerFactor * 0.55) {
          primitives.push({ type: 'point', x, y, colorIndex: 7, layer: 1 });
        }
      }
    }

    for (let dy = -SUN_R_INNER; dy <= SUN_R_INNER; dy++) {
      for (let dx = -SUN_R_INNER; dx <= SUN_R_INNER; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > SUN_R_INNER) continue;
        const x = SUN_CX + dx;
        const y = SUN_CY + dy;
        if (x < 0 || x >= CANVAS_W || y < 0 || y >= CANVAS_H) continue;
        primitives.push({ type: 'point', x, y, colorIndex: 2, layer: 1 });
      }
    }

    primitives.push({ type: 'point', x: SUN_CX - 3, y: SUN_CY - 3, colorIndex: 1, layer: 1 });
    primitives.push({ type: 'point', x: SUN_CX - 2, y: SUN_CY - 3, colorIndex: 1, layer: 1 });
    primitives.push({ type: 'point', x: SUN_CX - 3, y: SUN_CY - 2, colorIndex: 1, layer: 1 });

    for (let i = 0; i < 5; i++) {
      const ry = GROUND_Y - 1 - i * 2;
      const rw = 10 + i * 6;
      const rx = SUN_CX - Math.floor(rw / 2);
      for (let x = rx; x < rx + rw; x++) {
        if (x < 0 || x >= CANVAS_W) continue;
        const d = Math.abs(x - SUN_CX);
        const prob = (1 - d / (rw / 2)) * 0.55;
        if (sunRng() < prob) {
          primitives.push({ type: 'point', x, y: ry, colorIndex: i % 2 === 0 ? 2 : 7, layer: 1 });
        }
      }
    }
  }

  /** 绘制星星（可配置数量） */
  function drawStars(primitives: PixelPrimitive[], count: number): void {
    const rng = createSeededRandom(STAR_SEED);
    const actualCount = Math.max(BASE_STAR_COUNT, count);
    for (let i = 0; i < actualCount; i++) {
      const x = Math.floor(rng() * CANVAS_W);
      const y = Math.floor(rng() * 110);
      const bright = rng() < (count > BASE_STAR_COUNT ? 0.35 : 0.2);
      primitives.push({ type: 'point', x, y, colorIndex: 1, layer: 1 });
      if (bright && x + 1 < CANVAS_W) {
        primitives.push({ type: 'point', x: x + 1, y, colorIndex: 1, layer: 1 });
      }
      // 存款高时额外高亮
      if (count > BASE_STAR_COUNT + 20 && x + 2 < CANVAS_W && rng() < 0.1) {
        primitives.push({ type: 'point', x: x + 2, y, colorIndex: 2, layer: 1 });
      }
    }
  }

  /** 压力高时画面边缘红色脉动（角落和边缘红色散点） */
  function drawStressVignette(primitives: PixelPrimitive[]): void {
    const rng = createSeededRandom(7773);
    const intensity = 0.15; // 红色脉动密度
    // 四个角落
    const corners = [
      { x0: 0, y0: 0, x1: 20, y1: 20 },
      { x0: CANVAS_W - 20, y0: 0, x1: CANVAS_W, y1: 20 },
      { x0: 0, y0: CANVAS_H - 20, x1: 20, y1: CANVAS_H },
      { x0: CANVAS_W - 20, y0: CANVAS_H - 20, x1: CANVAS_W, y1: CANVAS_H },
    ];
    for (const c of corners) {
      for (let y = c.y0; y < c.y1; y++) {
        for (let x = c.x0; x < c.x1; x++) {
          if (rng() < intensity) {
            primitives.push({ type: 'point', x, y, colorIndex: 3, layer: 4 });
          }
        }
      }
    }
    // 边缘散点（左右和上下）
    for (let i = 0; i < 30; i++) {
      const x = rng() < 0.5 ? Math.floor(rng() * 6) : CANVAS_W - 1 - Math.floor(rng() * 6);
      const y = Math.floor(rng() * CANVAS_H);
      if (rng() < 0.3) {
        primitives.push({ type: 'point', x, y, colorIndex: 3, layer: 4 });
      }
    }
  }

  // ================================================================
  //  地面绘制辅助
  // ================================================================

  function drawGroundTexture(primitives: PixelPrimitive[]): void {
    const rng = createSeededRandom(7777);
    for (let y = GROUND_Y; y < CANVAS_H; y++) {
      const distFromGround = (y - GROUND_Y) / GROUND_H;
      const prob = 0.08 + distFromGround * 0.12;
      for (let x = 0; x < CANVAS_W; x += 2) {
        if (rng() < prob) {
          primitives.push({ type: 'point', x, y, colorIndex: 0, layer: 3 });
        }
      }
    }
  }

  /** 地面绿色荧光反光（幸福感越高越亮） */
  function drawGroundGlow(primitives: PixelPrimitive[], happiness: number): void {
    const glowRng = createSeededRandom(5555);
    const glowCX = PERSON_X;
    const baseGlowR = 60;
    const glowR = happiness > 70 ? 80 : baseGlowR;
    const baseProb = happiness > 70 ? 0.5 : 0.35;

    for (let dy = 0; dy < GROUND_H - 4; dy++) {
      for (let dx = -glowR; dx <= glowR; dx += 2) {
        const x = glowCX + dx;
        const y = GROUND_Y + 2 + dy;
        if (x < 0 || x >= CANVAS_W) continue;

        const dist = Math.sqrt(dx * dx * 0.8 + dy * dy * 3);
        if (dist > glowR) continue;

        const prob = (1 - dist / glowR) * baseProb;
        if (glowRng() < prob) {
          primitives.push({ type: 'point', x, y, colorIndex: 5, layer: 3 });
        }
      }
    }

    // 散落小荧光点
    const dotCount = happiness > 70 ? 40 : 25;
    for (let i = 0; i < dotCount; i++) {
      const x = Math.floor(glowRng() * CANVAS_W);
      const y = GROUND_Y + 3 + Math.floor(glowRng() * (GROUND_H - 6));
      primitives.push({ type: 'point', x, y, colorIndex: 5, layer: 3 });
    }
  }

  function drawStreetLights(primitives: PixelPrimitive[], time: number = 0): void {
    const lights = [
      { x: 30, y: GROUND_Y - 20 },
      { x: 70, y: GROUND_Y - 16 },
      { x: 210, y: GROUND_Y - 22 },
      { x: 240, y: GROUND_Y - 14 },
    ];
    for (const l of lights) {
      primitives.push({ type: 'rect', x: l.x, y: l.y + 4, w: 1, h: GROUND_Y - l.y - 4, colorIndex: 6, layer: 3 });
      const flicker = Math.sin(time * 2 + l.x * 0.5) > 0.3 ? 7 : 2;
      primitives.push({ type: 'point', x: l.x, y: l.y, colorIndex: flicker, layer: 3 });
      primitives.push({ type: 'point', x: l.x - 1, y: l.y + 1, colorIndex: 2, layer: 3 });
      primitives.push({ type: 'point', x: l.x + 1, y: l.y + 1, colorIndex: 2, layer: 3 });
      primitives.push({ type: 'point', x: l.x, y: l.y - 1, colorIndex: flicker, layer: 3 });
      primitives.push({ type: 'point', x: l.x - 1, y: l.y, colorIndex: 2, layer: 3 });
      primitives.push({ type: 'point', x: l.x + 1, y: l.y, colorIndex: 2, layer: 3 });
    }
  }

  function drawCar(primitives: PixelPrimitive[], x: number, groundY: number, carType?: string): void {
    const type = carType || '中级车';
    const tireColor: PicoColorIndex = 0;
    const wheelColor: PicoColorIndex = 1;

    if (type === '经济车') {
      // 经济代步车：小巧紧凑，宽22高6，灰色车身
      const bodyColor: PicoColorIndex = 6;
      const windowColor: PicoColorIndex = 1;
      // 下车身
      primitives.push({ type: 'rect', x, y: groundY - 6, w: 22, h: 5, colorIndex: bodyColor, layer: 3 });
      // 上车顶（较窄小）
      primitives.push({ type: 'rect', x: x + 5, y: groundY - 10, w: 12, h: 4, colorIndex: bodyColor, layer: 3 });
      // 小窗户
      primitives.push({ type: 'rect', x: x + 6, y: groundY - 9, w: 4, h: 3, colorIndex: windowColor, layer: 3 });
      primitives.push({ type: 'rect', x: x + 12, y: groundY - 9, w: 4, h: 3, colorIndex: windowColor, layer: 3 });
      // 前车灯
      primitives.push({ type: 'point', x: x - 1, y: groundY - 4, colorIndex: 2, layer: 3 });
      // 后轮
      primitives.push({ type: 'rect', x: x + 2, y: groundY - 2, w: 5, h: 2, colorIndex: tireColor, layer: 3 });
      primitives.push({ type: 'point', x: x + 4, y: groundY - 1, colorIndex: wheelColor, layer: 3 });
      // 前轮
      primitives.push({ type: 'rect', x: x + 15, y: groundY - 2, w: 5, h: 2, colorIndex: tireColor, layer: 3 });
      primitives.push({ type: 'point', x: x + 17, y: groundY - 1, colorIndex: wheelColor, layer: 3 });
    } else if (type === '豪车') {
      // 豪车/跑车：宽34高8，白色车身，更低矮流线型，大轮子，前灯，尾翼
      const bodyColor: PicoColorIndex = 1;
      const windowColor: PicoColorIndex = 0;
      const accentColor: PicoColorIndex = 6; // 深灰装饰线
      // 下车身（宽34，高5，更贴地）
      primitives.push({ type: 'rect', x, y: groundY - 5, w: 34, h: 5, colorIndex: bodyColor, layer: 3 });
      // 车身流线装饰线（1px高）
      primitives.push({ type: 'rect', x: x + 2, y: groundY - 3, w: 30, h: 1, colorIndex: accentColor, layer: 3 });
      // 上车顶（流线型，宽20）
      primitives.push({ type: 'rect', x: x + 7, y: groundY - 10, w: 20, h: 5, colorIndex: bodyColor, layer: 3 });
      // 前挡风玻璃（斜度更大，用散点）
      primitives.push({ type: 'rect', x: x + 8, y: groundY - 9, w: 7, h: 4, colorIndex: windowColor, layer: 3 });
      // 后挡风玻璃
      primitives.push({ type: 'rect', x: x + 19, y: groundY - 9, w: 7, h: 4, colorIndex: windowColor, layer: 3 });
      // 车身高光点
      primitives.push({ type: 'point', x: x + 3, y: groundY - 4, colorIndex: 7 as PicoColorIndex, layer: 3 });
      primitives.push({ type: 'point', x: x + 30, y: groundY - 4, colorIndex: 7 as PicoColorIndex, layer: 3 });
      // 前灯（2个亮黄色点）
      primitives.push({ type: 'point', x: x - 1, y: groundY - 4, colorIndex: 2, layer: 3 });
      primitives.push({ type: 'point', x: x - 1, y: groundY - 3, colorIndex: 2, layer: 3 });
      // 尾灯（红色）
      primitives.push({ type: 'point', x: x + 34, y: groundY - 4, colorIndex: 8 as PicoColorIndex, layer: 3 });
      primitives.push({ type: 'point', x: x + 34, y: groundY - 3, colorIndex: 8 as PicoColorIndex, layer: 3 });
      // 尾翼（车尾2个像素小突起）
      primitives.push({ type: 'point', x: x + 31, y: groundY - 11, colorIndex: bodyColor, layer: 3 });
      primitives.push({ type: 'point', x: x + 33, y: groundY - 11, colorIndex: bodyColor, layer: 3 });
      primitives.push({ type: 'rect', x: x + 30, y: groundY - 10, w: 4, h: 1, colorIndex: bodyColor, layer: 3 });
      // 大轮子（宽8高3）
      primitives.push({ type: 'rect', x: x + 2, y: groundY - 3, w: 8, h: 3, colorIndex: tireColor, layer: 3 });
      primitives.push({ type: 'rect', x: x + 24, y: groundY - 3, w: 8, h: 3, colorIndex: tireColor, layer: 3 });
      // 轮毂
      primitives.push({ type: 'rect', x: x + 4, y: groundY - 2, w: 4, h: 1, colorIndex: wheelColor, layer: 3 });
      primitives.push({ type: 'rect', x: x + 26, y: groundY - 2, w: 4, h: 1, colorIndex: wheelColor, layer: 3 });
    } else {
      // 中级车（默认，保持原有样式）：宽30高6，粉红/红色车身
      const bodyColor: PicoColorIndex = 3;
      const windowColor: PicoColorIndex = 4;
      primitives.push({ type: 'rect', x, y: groundY - 8, w: 30, h: 6, colorIndex: bodyColor, layer: 3 });
      primitives.push({ type: 'rect', x: x + 6, y: groundY - 14, w: 18, h: 6, colorIndex: bodyColor, layer: 3 });
      primitives.push({ type: 'rect', x: x + 8, y: groundY - 12, w: 6, h: 4, colorIndex: windowColor, layer: 3 });
      primitives.push({ type: 'rect', x: x + 16, y: groundY - 12, w: 6, h: 4, colorIndex: windowColor, layer: 3 });
      primitives.push({ type: 'point', x: x - 1, y: groundY - 6, colorIndex: 2, layer: 3 });
      primitives.push({ type: 'point', x: x + 30, y: groundY - 6, colorIndex: 3, layer: 3 });
      primitives.push({ type: 'rect', x: x + 3, y: groundY - 3, w: 6, h: 3, colorIndex: tireColor, layer: 3 });
      primitives.push({ type: 'rect', x: x + 21, y: groundY - 3, w: 6, h: 3, colorIndex: tireColor, layer: 3 });
      primitives.push({ type: 'point', x: x + 5, y: groundY - 2, colorIndex: wheelColor, layer: 3 });
      primitives.push({ type: 'point', x: x + 23, y: groundY - 2, colorIndex: wheelColor, layer: 3 });
    }
  }

  // ================================================================
  //  新增场景元素：房子、游乐场、雨云、音符
  // ================================================================

  /** 绘制前景小房子（买房后），支持四种房型 */
  function drawHouse(primitives: PixelPrimitive[], x: number, groundY: number, houseType?: string): void {
    const type = houseType || '改善首选';

    if (type === '刚需上车') {
      // 老公房/老破小：宽16高14，灰色墙壁，红褐屋顶，小窗户，没有烟囱，房体偏左下方
      const wallColor: PicoColorIndex = 6;
      const roofColor: PicoColorIndex = 7;
      const windowColor: PicoColorIndex = 2;
      const doorColor: PicoColorIndex = 4;
      const houseW = 16, houseH = 14;
      const houseTop = groundY - houseH;
      // 房体
      primitives.push({ type: 'rect', x, y: houseTop, w: houseW, h: houseH, colorIndex: wallColor, layer: 3 });
      // 屋顶（三角形，较小）
      for (let dy = 0; dy < 7; dy++) {
        const w = 6 + dy * 1.3;
        const left = x + 8 - Math.floor(w / 2);
        for (let dx = 0; dx < Math.floor(w); dx++) {
          primitives.push({ type: 'point', x: left + dx, y: houseTop - 7 + dy, colorIndex: roofColor, layer: 3 });
        }
      }
      // 小窗户（两扇小窗）
      primitives.push({ type: 'rect', x: x + 2, y: houseTop + 3, w: 3, h: 3, colorIndex: windowColor, layer: 3 });
      primitives.push({ type: 'rect', x: x + 11, y: houseTop + 3, w: 3, h: 3, colorIndex: windowColor, layer: 3 });
      // 小门
      primitives.push({ type: 'rect', x: x + 6, y: houseTop + 7, w: 3, h: 7, colorIndex: doorColor, layer: 3 });
      // 门把手
      primitives.push({ type: 'point', x: x + 8, y: houseTop + 10, colorIndex: 2, layer: 3 });
    } else if (type === '品质生活') {
      // 三居室洋房：宽30高28，米白墙壁，红色屋顶，三扇窗户，大门，门前小路，旁边小树
      const wallColor: PicoColorIndex = 1;
      const roofColor: PicoColorIndex = 8 as PicoColorIndex;
      const windowColor: PicoColorIndex = 2;
      const doorColor: PicoColorIndex = 4;
      const houseW = 30, houseH = 28;
      const houseTop = groundY - houseH;
      // 房体
      primitives.push({ type: 'rect', x, y: houseTop, w: houseW, h: houseH, colorIndex: wallColor, layer: 3 });
      // 屋顶（大三角形）
      for (let dy = 0; dy < 12; dy++) {
        const w = 12 + dy * 1.3;
        const left = x + 15 - Math.floor(w / 2);
        for (let dx = 0; dx < Math.floor(w); dx++) {
          primitives.push({ type: 'point', x: left + dx, y: houseTop - 12 + dy, colorIndex: roofColor, layer: 3 });
        }
      }
      // 三扇窗户（上层）
      primitives.push({ type: 'rect', x: x + 3, y: houseTop + 4, w: 5, h: 5, colorIndex: windowColor, layer: 3 });
      primitives.push({ type: 'rect', x: x + 12, y: houseTop + 4, w: 5, h: 5, colorIndex: windowColor, layer: 3 });
      primitives.push({ type: 'rect', x: x + 22, y: houseTop + 4, w: 5, h: 5, colorIndex: windowColor, layer: 3 });
      // 窗户框（深色分隔）
      primitives.push({ type: 'point', x: x + 5, y: houseTop + 6, colorIndex: 0, layer: 3 });
      primitives.push({ type: 'point', x: x + 14, y: houseTop + 6, colorIndex: 0, layer: 3 });
      primitives.push({ type: 'point', x: x + 24, y: houseTop + 6, colorIndex: 0, layer: 3 });
      // 大门（更宽）
      primitives.push({ type: 'rect', x: x + 12, y: houseTop + 14, w: 6, h: 14, colorIndex: doorColor, layer: 3 });
      // 门把手
      primitives.push({ type: 'point', x: x + 16, y: houseTop + 20, colorIndex: 2, layer: 3 });
      // 烟囱
      primitives.push({ type: 'rect', x: x + 23, y: houseTop - 8, w: 3, h: 8, colorIndex: 4, layer: 3 });
      // 门前小路（2-3个点）
      primitives.push({ type: 'point', x: x + 14, y: groundY - 1, colorIndex: 6, layer: 3 });
      primitives.push({ type: 'point', x: x + 15, y: groundY - 1, colorIndex: 6, layer: 3 });
      primitives.push({ type: 'point', x: x + 16, y: groundY, colorIndex: 6, layer: 3 });
      // 旁边小树（绿色竖线3-4px高，在房子右侧）
      const treeX = x + houseW + 3;
      primitives.push({ type: 'rect', x: treeX, y: groundY - 5, w: 1, h: 5, colorIndex: 0, layer: 3 }); // 树干
      primitives.push({ type: 'point', x: treeX - 1, y: groundY - 7, colorIndex: 5, layer: 3 });
      primitives.push({ type: 'point', x: treeX, y: groundY - 8, colorIndex: 5, layer: 3 });
      primitives.push({ type: 'point', x: treeX + 1, y: groundY - 7, colorIndex: 5, layer: 3 });
      primitives.push({ type: 'point', x: treeX - 1, y: groundY - 6, colorIndex: 5, layer: 3 });
      primitives.push({ type: 'point', x: treeX + 1, y: groundY - 6, colorIndex: 5, layer: 3 });
    } else if (type === '终极改善') {
      // 别墅/大平层：宽38高32，米白墙壁，蓝色屋顶，四扇大窗户，双开门，花坛，车库，两棵树
      const wallColor: PicoColorIndex = 1;
      const roofColor: PicoColorIndex = 4;
      const windowColor: PicoColorIndex = 2;
      const doorColor: PicoColorIndex = 4;
      const garageColor: PicoColorIndex = 0;
      const houseW = 38, houseH = 32;
      const houseTop = groundY - houseH;
      // 房体主体
      primitives.push({ type: 'rect', x, y: houseTop, w: houseW, h: houseH, colorIndex: wallColor, layer: 3 });
      // 屋顶（更宽的三角形）
      for (let dy = 0; dy < 14; dy++) {
        const w = 16 + dy * 1.4;
        const left = x + 19 - Math.floor(w / 2);
        for (let dx = 0; dx < Math.floor(w); dx++) {
          primitives.push({ type: 'point', x: left + dx, y: houseTop - 14 + dy, colorIndex: roofColor, layer: 3 });
        }
      }
      // 四扇大窗户（两上两下）
      // 上层
      primitives.push({ type: 'rect', x: x + 3, y: houseTop + 4, w: 6, h: 6, colorIndex: windowColor, layer: 3 });
      primitives.push({ type: 'rect', x: x + 13, y: houseTop + 4, w: 6, h: 6, colorIndex: windowColor, layer: 3 });
      primitives.push({ type: 'rect', x: x + 23, y: houseTop + 4, w: 6, h: 6, colorIndex: windowColor, layer: 3 });
      // 下层（第四扇窗）
      primitives.push({ type: 'rect', x: x + 3, y: houseTop + 16, w: 6, h: 6, colorIndex: windowColor, layer: 3 });
      // 窗户十字框
      primitives.push({ type: 'point', x: x + 6, y: houseTop + 7, colorIndex: 0, layer: 3 });
      primitives.push({ type: 'point', x: x + 16, y: houseTop + 7, colorIndex: 0, layer: 3 });
      primitives.push({ type: 'point', x: x + 26, y: houseTop + 7, colorIndex: 0, layer: 3 });
      primitives.push({ type: 'point', x: x + 6, y: houseTop + 19, colorIndex: 0, layer: 3 });
      // 双开门（更大）
      primitives.push({ type: 'rect', x: x + 13, y: houseTop + 16, w: 4, h: 16, colorIndex: doorColor, layer: 3 });
      primitives.push({ type: 'rect', x: x + 17, y: houseTop + 16, w: 4, h: 16, colorIndex: doorColor, layer: 3 });
      // 门把手
      primitives.push({ type: 'point', x: x + 16, y: houseTop + 24, colorIndex: 2, layer: 3 });
      primitives.push({ type: 'point', x: x + 18, y: houseTop + 24, colorIndex: 2, layer: 3 });
      // 车库（房子侧面，宽6高8，在左侧）
      primitives.push({ type: 'rect', x: x + 26, y: houseTop + 14, w: 10, h: 18, colorIndex: garageColor, layer: 3 });
      // 车库门横纹
      primitives.push({ type: 'rect', x: x + 27, y: houseTop + 17, w: 8, h: 1, colorIndex: 0, layer: 3 });
      primitives.push({ type: 'rect', x: x + 27, y: houseTop + 21, w: 8, h: 1, colorIndex: 0, layer: 3 });
      primitives.push({ type: 'rect', x: x + 27, y: houseTop + 25, w: 8, h: 1, colorIndex: 0, layer: 3 });
      // 烟囱
      primitives.push({ type: 'rect', x: x + 28, y: houseTop - 10, w: 3, h: 10, colorIndex: 4, layer: 3 });
      // 门前花坛（2个彩色点）
      primitives.push({ type: 'point', x: x + 12, y: groundY - 1, colorIndex: 8 as PicoColorIndex, layer: 3 });
      primitives.push({ type: 'point', x: x + 22, y: groundY - 1, colorIndex: 3, layer: 3 });
      primitives.push({ type: 'point', x: x + 13, y: groundY, colorIndex: 7 as PicoColorIndex, layer: 3 });
      primitives.push({ type: 'point', x: x + 21, y: groundY, colorIndex: 8 as PicoColorIndex, layer: 3 });
      // 门前小路
      for (let i = 0; i < 4; i++) {
        primitives.push({ type: 'point', x: x + 15 + i, y: groundY - 1, colorIndex: 6, layer: 3 });
      }
      // 两棵树（左右各一棵）
      const treePositions = [x - 8, x + houseW + 3];
      for (const tx of treePositions) {
        primitives.push({ type: 'rect', x: tx, y: groundY - 6, w: 1, h: 6, colorIndex: 0, layer: 3 }); // 树干
        // 树冠（三角形叶丛）
        primitives.push({ type: 'point', x: tx, y: groundY - 10, colorIndex: 5, layer: 3 });
        primitives.push({ type: 'point', x: tx - 1, y: groundY - 9, colorIndex: 5, layer: 3 });
        primitives.push({ type: 'point', x: tx, y: groundY - 9, colorIndex: 5, layer: 3 });
        primitives.push({ type: 'point', x: tx + 1, y: groundY - 9, colorIndex: 5, layer: 3 });
        primitives.push({ type: 'point', x: tx - 2, y: groundY - 8, colorIndex: 5, layer: 3 });
        primitives.push({ type: 'point', x: tx - 1, y: groundY - 8, colorIndex: 5, layer: 3 });
        primitives.push({ type: 'point', x: tx, y: groundY - 8, colorIndex: 5, layer: 3 });
        primitives.push({ type: 'point', x: tx + 1, y: groundY - 8, colorIndex: 5, layer: 3 });
        primitives.push({ type: 'point', x: tx + 2, y: groundY - 8, colorIndex: 5, layer: 3 });
        primitives.push({ type: 'point', x: tx - 1, y: groundY - 7, colorIndex: 5, layer: 3 });
        primitives.push({ type: 'point', x: tx, y: groundY - 7, colorIndex: 5, layer: 3 });
        primitives.push({ type: 'point', x: tx + 1, y: groundY - 7, colorIndex: 5, layer: 3 });
      }
    } else {
      // 改善首选（默认样式）：宽24高24，深灰墙壁，暖色屋顶，两扇窗户一个门，小烟囱
      const wallColor: PicoColorIndex = 6;
      const roofColor: PicoColorIndex = 7;
      const windowColor: PicoColorIndex = 2;
      const doorColor: PicoColorIndex = 4;
      // 房体
      primitives.push({ type: 'rect', x: x, y: groundY - 24, w: 24, h: 24, colorIndex: wallColor, layer: 3 });
      // 屋顶（三角形用散点模拟）
      for (let dy = 0; dy < 10; dy++) {
        const w = 10 + dy * 1.2;
        const left = x + 12 - Math.floor(w / 2);
        for (let dx = 0; dx < Math.floor(w); dx++) {
          primitives.push({ type: 'point', x: left + dx, y: groundY - 24 - 10 + dy, colorIndex: roofColor, layer: 3 });
        }
      }
      // 窗户（2x2亮黄格子）
      primitives.push({ type: 'rect', x: x + 4, y: groundY - 18, w: 4, h: 4, colorIndex: windowColor, layer: 3 });
      primitives.push({ type: 'rect', x: x + 16, y: groundY - 18, w: 4, h: 4, colorIndex: windowColor, layer: 3 });
      // 门
      primitives.push({ type: 'rect', x: x + 10, y: groundY - 10, w: 4, h: 10, colorIndex: doorColor, layer: 3 });
      // 门把手
      primitives.push({ type: 'point', x: x + 13, y: groundY - 5, colorIndex: 2, layer: 3 });
      // 小烟囱
      primitives.push({ type: 'rect', x: x + 18, y: groundY - 30, w: 2, h: 6, colorIndex: 4, layer: 3 });
    }
  }

  /** 绘制小游乐场（有子女且买房后） */
  function drawPlayground(primitives: PixelPrimitive[], x: number, groundY: number): void {
    const slideColor: PicoColorIndex = 5;   // 绿色滑梯
    const swingColor: PicoColorIndex = 7;   // 橙色秋千

    // 滑梯（斜线散点模拟）
    for (let i = 0; i < 8; i++) {
      primitives.push({ type: 'point', x: x + i, y: groundY - 12 - i, colorIndex: slideColor, layer: 3 });
    }
    // 滑梯底座
    primitives.push({ type: 'rect', x: x - 1, y: groundY - 4, w: 2, h: 4, colorIndex: 6, layer: 3 });
    primitives.push({ type: 'rect', x: x + 7, y: groundY - 4, w: 2, h: 4, colorIndex: 6, layer: 3 });

    // 秋千架子
    primitives.push({ type: 'rect', x: x + 14, y: groundY - 16, w: 1, h: 16, colorIndex: 6, layer: 3 });
    primitives.push({ type: 'rect', x: x + 20, y: groundY - 16, w: 1, h: 16, colorIndex: 6, layer: 3 });
    // 横梁
    primitives.push({ type: 'rect', x: x + 14, y: groundY - 16, w: 7, h: 1, colorIndex: 6, layer: 3 });
    // 秋千绳（两条线）
    primitives.push({ type: 'point', x: x + 16, y: groundY - 15, colorIndex: swingColor, layer: 3 });
    primitives.push({ type: 'point', x: x + 16, y: groundY - 12, colorIndex: swingColor, layer: 3 });
    primitives.push({ type: 'point', x: x + 18, y: groundY - 15, colorIndex: swingColor, layer: 3 });
    primitives.push({ type: 'point', x: x + 18, y: groundY - 12, colorIndex: swingColor, layer: 3 });
    // 秋千座
    primitives.push({ type: 'rect', x: x + 15, y: groundY - 11, w: 4, h: 1, colorIndex: swingColor, layer: 3 });

    // 小球玩具
    primitives.push({ type: 'point', x: x + 3, y: groundY - 1, colorIndex: 3, layer: 3 });
  }

  /** 绘制失业头顶灰色乌云 */
  function drawRainCloud(primitives: PixelPrimitive[], cx: number, topY: number): void {
    const cloudColor: PicoColorIndex = 6;
    // 云朵形状（椭圆散点簇）
    for (let dy = -6; dy <= 0; dy++) {
      const w = 14 + dy * 1.5;
      for (let dx = -Math.floor(w / 2); dx <= Math.floor(w / 2); dx++) {
        const x = cx + dx;
        const y = topY + dy;
        if (x < 0 || x >= CANVAS_W || y < 0) continue;
        const dist = Math.sqrt(dx * dx / (w * w / 4) + dy * dy / 9);
        if (dist <= 1) {
          primitives.push({ type: 'point', x, y, colorIndex: cloudColor, layer: 4 });
        }
      }
    }
    // 雨滴（几条垂直灰线）
    for (let i = 0; i < 5; i++) {
      const rx = cx - 6 + i * 3;
      const ry = topY + 2;
      for (let j = 0; j < 4; j++) {
        primitives.push({ type: 'point', x: rx, y: ry + j * 2, colorIndex: 6, layer: 4 });
      }
    }
  }

  /** 绘制音符粒子（幸福感高时） */
  function drawMusicNote(primitives: PixelPrimitive[], p: Particle): void {
    const x = Math.round(p.x);
    const y = Math.round(p.y);
    const alpha = p.life / p.maxLife;
    if (alpha < 0.25 && Math.floor(p.life * 4) % 2 === 0) return;
    if (x >= 0 && x < CANVAS_W && y >= 0 && y < CANVAS_H) {
      // 音符：一个小竖线 + 顶部圆点
      primitives.push({ type: 'point', x: x, y: y, colorIndex: 5, layer: 4 });
      primitives.push({ type: 'point', x: x, y: y - 1, colorIndex: 5, layer: 4 });
      primitives.push({ type: 'point', x: x, y: y - 2, colorIndex: 5, layer: 4 });
      primitives.push({ type: 'point', x: x + 1, y: y - 2, colorIndex: 5, layer: 4 });
      primitives.push({ type: 'point', x: x + 2, y: y - 1, colorIndex: 5, layer: 4 });
    }
  }

  // ================================================================
  //  人物绘制辅助
  // ================================================================

  interface PersonOptions {
    hairColor: PicoColorIndex;
    shirtColor: PicoColorIndex;
    skinColor: PicoColorIndex;
    pantsColor: PicoColorIndex;
    layer: number;
    scale?: number;
    pose?: 'normal' | 'head-hold' | 'jump';
  }

  function drawPerson(
    primitives: PixelPrimitive[],
    centerX: number,
    groundY: number,
    opts: PersonOptions,
  ): void {
    const s = opts.scale ?? 1.0;
    const L = opts.layer;

    if (Math.abs(s - 1.0) < 0.05) {
      const ox = centerX - 128;
      const y0 = groundY;
      const pose = opts.pose ?? 'normal';

      // 跳跃姿势：整体上移4px
      const jumpOffset = pose === 'jump' ? -4 : 0;
      const yBase = y0 + jumpOffset;

      // 头发主体
      primitives.push({ type: 'rect', x: 123 + ox, y: yBase - 24, w: 10, h: 3, colorIndex: opts.hairColor, layer: L });
      // 头发侧边/刘海
      primitives.push({ type: 'point', x: 122 + ox, y: yBase - 22, colorIndex: opts.hairColor, layer: L });
      primitives.push({ type: 'point', x: 133 + ox, y: yBase - 23, colorIndex: opts.hairColor, layer: L });
      primitives.push({ type: 'point', x: 124 + ox, y: yBase - 21, colorIndex: opts.hairColor, layer: L });
      primitives.push({ type: 'point', x: 131 + ox, y: yBase - 21, colorIndex: opts.hairColor, layer: L });

      // 脸
      primitives.push({ type: 'rect', x: 125 + ox, y: yBase - 21, w: 6, h: 6, colorIndex: opts.skinColor, layer: L });
      // 眼睛（抱头姿势时闭眼/痛苦：用1px横线）
      if (pose === 'head-hold') {
        primitives.push({ type: 'point', x: 127 + ox, y: yBase - 19, colorIndex: 0, layer: L });
        primitives.push({ type: 'point', x: 128 + ox, y: yBase - 19, colorIndex: 0, layer: L });
        primitives.push({ type: 'point', x: 129 + ox, y: yBase - 19, colorIndex: 0, layer: L });
        primitives.push({ type: 'point', x: 130 + ox, y: yBase - 19, colorIndex: 0, layer: L });
      } else {
        primitives.push({ type: 'point', x: 127 + ox, y: yBase - 19, colorIndex: 0, layer: L });
        primitives.push({ type: 'point', x: 130 + ox, y: yBase - 19, colorIndex: 0, layer: L });
      }
      // 嘴
      primitives.push({ type: 'point', x: 128 + ox, y: yBase - 17, colorIndex: opts.hairColor, layer: L });

      // 脖子
      primitives.push({ type: 'rect', x: 127 + ox, y: yBase - 15, w: 2, h: 2, colorIndex: opts.skinColor, layer: L });

      // 身体/衣服
      primitives.push({ type: 'rect', x: 123 + ox, y: yBase - 13, w: 10, h: 7, colorIndex: opts.shirtColor, layer: L });
      // 衣服领口
      primitives.push({ type: 'point', x: 127 + ox, y: yBase - 12, colorIndex: opts.skinColor, layer: L });
      primitives.push({ type: 'point', x: 128 + ox, y: yBase - 12, colorIndex: opts.skinColor, layer: L });

      // 手臂
      if (pose === 'head-hold') {
        // 抱头姿势：手臂向上弯曲到头顶
        primitives.push({ type: 'rect', x: 121 + ox, y: yBase - 22, w: 2, h: 6, colorIndex: opts.skinColor, layer: L });
        primitives.push({ type: 'rect', x: 133 + ox, y: yBase - 22, w: 2, h: 6, colorIndex: opts.skinColor, layer: L });
        // 手放在头上
        primitives.push({ type: 'point', x: 121 + ox, y: yBase - 23, colorIndex: opts.skinColor, layer: L });
        primitives.push({ type: 'point', x: 134 + ox, y: yBase - 23, colorIndex: opts.skinColor, layer: L });
      } else {
        primitives.push({ type: 'rect', x: 121 + ox, y: yBase - 12, w: 2, h: 6, colorIndex: opts.skinColor, layer: L });
        primitives.push({ type: 'rect', x: 133 + ox, y: yBase - 12, w: 2, h: 6, colorIndex: opts.skinColor, layer: L });
      }

      // 腿/裤子
      primitives.push({ type: 'rect', x: 125 + ox, y: yBase - 6, w: 3, h: 6, colorIndex: opts.pantsColor, layer: L });
      primitives.push({ type: 'rect', x: 129 + ox, y: yBase - 6, w: 3, h: 6, colorIndex: opts.pantsColor, layer: L });
      // 鞋子
      primitives.push({ type: 'rect', x: 124 + ox, y: yBase - 1, w: 4, h: 1, colorIndex: 0, layer: L });
      primitives.push({ type: 'rect', x: 128 + ox, y: yBase - 1, w: 4, h: 1, colorIndex: 0, layer: L });

      // 金边效果（存款 >= 200万，衣服颜色2=暖黄时，给衣服边缘加金色边框）
      if (opts.shirtColor === 2) {
        primitives.push({ type: 'point', x: 122 + ox, y: yBase - 13, colorIndex: 7, layer: L });
        primitives.push({ type: 'point', x: 122 + ox, y: yBase - 7, colorIndex: 7, layer: L });
        primitives.push({ type: 'point', x: 133 + ox, y: yBase - 13, colorIndex: 7, layer: L });
        primitives.push({ type: 'point', x: 133 + ox, y: yBase - 7, colorIndex: 7, layer: L });
      }
    } else {
      // 缩小尺寸的家人
      const bodyH = Math.floor(10 * s);
      const headH = Math.floor(7 * s);
      const headW = Math.floor(7 * s);
      const legH = Math.floor(6 * s);
      const bodyW = Math.floor(9 * s);
      const hairH = Math.floor(3 * s);
      const armW = Math.max(1, Math.floor(2 * s));
      const armH = Math.floor(5 * s);

      const topY = groundY - legH - bodyH - headH;
      const leftX = centerX - Math.floor(bodyW / 2);

      primitives.push({ type: 'rect', x: leftX - 1, y: topY, w: bodyW + 2, h: hairH, colorIndex: opts.hairColor, layer: L });
      primitives.push({ type: 'rect', x: leftX + 1, y: topY + hairH, w: headW, h: headH - hairH, colorIndex: opts.skinColor, layer: L });
      if (headW >= 4) {
        primitives.push({ type: 'point', x: leftX + 2, y: topY + hairH + 1, colorIndex: 0, layer: L });
        primitives.push({ type: 'point', x: leftX + headW - 1, y: topY + hairH + 1, colorIndex: 0, layer: L });
      }
      primitives.push({ type: 'rect', x: leftX, y: topY + headH, w: bodyW, h: bodyH, colorIndex: opts.shirtColor, layer: L });
      primitives.push({ type: 'rect', x: leftX - armW, y: topY + headH + 1, w: armW, h: armH, colorIndex: opts.skinColor, layer: L });
      primitives.push({ type: 'rect', x: leftX + bodyW, y: topY + headH + 1, w: armW, h: armH, colorIndex: opts.skinColor, layer: L });
      const legW = Math.max(1, Math.floor(3 * s));
      primitives.push({ type: 'rect', x: leftX + 1, y: groundY - legH, w: legW, h: legH, colorIndex: opts.pantsColor, layer: L });
      primitives.push({ type: 'rect', x: leftX + bodyW - legW - 1, y: groundY - legH, w: legW, h: legH, colorIndex: opts.pantsColor, layer: L });
    }
  }

  // ================================================================
  //  粒子绘制辅助
  // ================================================================

  function drawDollarParticle(primitives: PixelPrimitive[], p: Particle): void {
    const x = Math.round(p.x);
    const y = Math.round(p.y);
    const alpha = p.life / p.maxLife;

    if (alpha < 0.25 && Math.floor(p.life * 4) % 2 === 0) return;

    const mainColor: PicoColorIndex = p.colorIndex;
    const brightColor: PicoColorIndex = 1;

    const size = alpha > 0.8 ? 1 : (alpha > 0.3 ? 2 : 1);

    if (size >= 2) {
      const pattern = [
        [0, 1, 0],
        [1, 0, 1],
        [0, 1, 0],
        [1, 0, 1],
        [0, 1, 0],
      ];
      for (let py = 0; py < 5; py++) {
        for (let px = 0; px < 3; px++) {
          if (pattern[py][px]) {
            const drawX = x + px - 1;
            const drawY = y + py - 2;
            const col = (px === 1 && py === 2) ? brightColor : mainColor;
            if (drawX >= 0 && drawX < CANVAS_W && drawY >= 0 && drawY < CANVAS_H) {
              primitives.push({ type: 'point', x: drawX, y: drawY, colorIndex: col, layer: 4 });
            }
          }
        }
      }
    } else {
      if (x >= 0 && x < CANVAS_W && y >= 0 && y < CANVAS_H) {
        primitives.push({ type: 'point', x, y, colorIndex: mainColor, layer: 4 });
      }
    }

    const trailColor: PicoColorIndex = 6;
    for (let i = 0; i < p.trail.length; i++) {
      const t = p.trail[i];
      const tx = Math.round(t.x);
      const ty = Math.round(t.y);
      const ta = (i + 1) / p.trail.length;
      if (ta < 0.4) continue;
      if (tx >= 0 && tx < CANVAS_W && ty >= 0 && ty < CANVAS_H) {
        primitives.push({ type: 'point', x: tx, y: ty, colorIndex: trailColor, layer: 4 });
      }
    }
  }

  // ================================================================
  //  粒子更新
  // ================================================================

  function updateParticles(dt: number, state: GameState) {
    // 冲击波更新
    if (shockwave.value.active) {
      shockwave.value.radius += 130 * dt / 0.38;
      if (shockwave.value.radius >= 130) {
        shockwave.value.active = false;
        shockwave.value.radius = 0;
      }
    }

    const happiness = (state as any).happiness ?? 60;

    // --- 服务器数据流 → $ 符号粒子（副业开启时）---
    particleAccum += dt;
    if (state.hasSideHustle && particleAccum >= 0.2) {
      particleAccum = 0;
      if (particles.value.length < MAX_PARTICLES) {
        particles.value.push({
          x: PERSON_X + (Math.random() - 0.5) * 20,
          y: GROUND_Y - 8,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.5 - Math.random() * 0.5,
          life: PARTICLE_MAX_LIFE,
          maxLife: PARTICLE_MAX_LIFE,
          size: 1,
          colorIndex: 5,
          trail: [],
        });
      }
    }

    // --- 幸福感高 → 绿色音符粒子从人物位置升起 ---
    if (happiness > 70 && particles.value.length < MAX_PARTICLES && Math.random() < 0.05) {
      particles.value.push({
        x: PERSON_X + (Math.random() - 0.5) * 20,
        y: GROUND_Y - 20,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -0.4 - Math.random() * 0.3,
        life: PARTICLE_MAX_LIFE,
        maxLife: PARTICLE_MAX_LIFE,
        size: 1,
        colorIndex: 5,
        trail: [],
      });
    }

    // --- 失业灰尘粒子 ---
    if (state.isUnemployed && particles.value.length < MAX_PARTICLES && Math.random() < 0.08) {
      particles.value.push({
        x: Math.random() * CANVAS_W,
        y: 0,
        vx: (Math.random() - 0.5) * 0.3,
        vy: 0.15 + Math.random() * 0.2,
        life: PARTICLE_MAX_LIFE,
        maxLife: PARTICLE_MAX_LIFE,
        size: 1,
        colorIndex: 6,
        trail: [],
      });
    }

    // --- 更新粒子位置和寿命 ---
    for (let i = particles.value.length - 1; i >= 0; i--) {
      const p = particles.value[i];
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 8) p.trail.shift();

      p.x += p.vx;
      p.y += p.vy;
      if (p.colorIndex === 5) {
        p.vy -= 0.002;
        p.vx *= 0.99;
      } else {
        p.vy += 0.001;
        p.vx *= 0.97;
      }
      p.life -= dt * 60;

      if (p.life <= 0 || p.y > CANVAS_H + 4 || p.y < -10 || p.x < -10 || p.x > CANVAS_W + 10) {
        particles.value.splice(i, 1);
      }
    }

    // --- 资产变动粒子 ---
    for (let i = assetParticles.value.length - 1; i >= 0; i--) {
      const p = assetParticles.value[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.008;
      p.vx *= 0.98;
      p.life -= dt * 60;
      if (p.life <= 0) {
        assetParticles.value.splice(i, 1);
      }
    }
  }

  // ================================================================
  //  事件动画触发与更新
  // ================================================================

  function triggerEventAnimation(type: SceneAnimationType, duration: number = 2.5) {
    const seed = Math.floor(Math.random() * 100000);
    const anim: SceneAnimation = {
      type,
      timer: duration,
      maxTimer: duration,
      intensity: 1.0,
      seed,
      particles: [],
    };
    // 初始化粒子
    initAnimationParticles(anim);
    activeAnimations.value.push(anim);
  }

  function updateAnimations(dt: number) {
    for (let i = activeAnimations.value.length - 1; i >= 0; i--) {
      const anim = activeAnimations.value[i];
      anim.timer -= dt;
      anim.intensity = Math.max(0, anim.timer / anim.maxTimer);

      // 更新内部粒子
      for (let j = anim.particles.length - 1; j >= 0; j--) {
        const p = anim.particles[j];
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;
        p.life -= dt * 60;
        if (p.extra !== undefined) {
          p.extra += dt * 3; // 用于摇摆相位
        }
        if (p.life <= 0 || p.y > CANVAS_H + 10 || p.y < -20 || p.x < -20 || p.x > CANVAS_W + 20) {
          anim.particles.splice(j, 1);
        }
      }

      // 持续生成新粒子（非skull/lightning类）
      if (anim.type !== 'skull' && anim.type !== 'lightning') {
        spawnAnimationParticles(anim, dt);
      }

      // 动画结束
      if (anim.timer <= 0) {
        activeAnimations.value.splice(i, 1);
      }
    }
  }

  function initAnimationParticles(anim: SceneAnimation) {
    const rng = createSeededRandom(anim.seed);
    switch (anim.type) {
      case 'rain':
        for (let i = 0; i < 20; i++) {
          anim.particles.push({
            x: rng() * CANVAS_W,
            y: rng() * CANVAS_H * 0.8,
            vx: -0.3,
            vy: 1.5 + rng() * 1.0,
            life: 999, maxLife: 999,
            colorIndex: 4 as PicoColorIndex,
          });
        }
        break;
      case 'fireworks':
        // 初始时生成2-3个爆炸
        for (let b = 0; b < 3; b++) {
          const bx = 50 + rng() * 156;
          const by = 30 + rng() * 60;
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const speed = 1.5 + rng() * 1.0;
            anim.particles.push({
              x: bx, y: by,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 40 + Math.floor(rng() * 20), maxLife: 60,
              colorIndex: (i % 2 === 0 ? 7 : 2) as PicoColorIndex,
            });
          }
        }
        break;
      case 'hearts':
        for (let i = 0; i < 15; i++) {
          anim.particles.push({
            x: rng() * CANVAS_W,
            y: -rng() * 80,
            vx: (rng() - 0.5) * 0.3,
            vy: 0.3 + rng() * 0.4,
            life: 999, maxLife: 999,
            colorIndex: 3 as PicoColorIndex,
            extra: rng() * Math.PI * 2,
          });
        }
        break;
      case 'money_rain':
        for (let i = 0; i < 15; i++) {
          anim.particles.push({
            x: rng() * CANVAS_W,
            y: -rng() * 60,
            vx: (rng() - 0.5) * 0.2,
            vy: 1.0 + rng() * 0.8,
            life: 999, maxLife: 999,
            colorIndex: (rng() < 0.5 ? 5 : 2) as PicoColorIndex,
          });
        }
        break;
      case 'lightning':
        // 闪电不需要持续粒子，在渲染时实时计算
        break;
      case 'tears':
        for (let i = 0; i < 8; i++) {
          anim.particles.push({
            x: PERSON_X - 3 + rng() * 6,
            y: GROUND_Y - 24 + rng() * 4,
            vx: (rng() - 0.5) * 0.1,
            vy: 0.3 + rng() * 0.3,
            life: 80 + Math.floor(rng() * 40), maxLife: 120,
            colorIndex: 4 as PicoColorIndex,
          });
        }
        break;
      case 'confetti':
        for (let i = 0; i < 25; i++) {
          anim.particles.push({
            x: rng() * CANVAS_W,
            y: -rng() * 100,
            vx: (rng() - 0.5) * 0.4,
            vy: 0.8 + rng() * 0.6,
            life: 999, maxLife: 999,
            colorIndex: (Math.floor(rng() * 7)) as PicoColorIndex,
            extra: rng() * Math.PI * 2,
          });
        }
        break;
      case 'skull':
        // 骷髅不需要粒子，渲染时直接绘制像素图案
        break;
      case 'gold_burst': {
        for (let i = 0; i < 40; i++) {
          anim.particles.push({
            x: Math.random() * CANVAS_W,
            y: -Math.random() * 60,
            vx: (Math.random() - 0.5) * 0.5,
            vy: 1.5 + Math.random() * 2,
            life: 60 + Math.random() * 60,
            maxLife: 120,
            colorIndex: 7 as PicoColorIndex,
            extra: 0,
          });
        }
        break;
      }
      case 'house_build': {
        // house_build 不需要粒子，用逐行填充代替
        break;
      }
    }
  }

  function spawnAnimationParticles(anim: SceneAnimation, dt: number) {
    const rng = createSeededRandom(anim.seed + Math.floor(performance.now() / 100));
    switch (anim.type) {
      case 'rain':
        // 补充雨滴
        if (anim.particles.length < 20) {
          for (let i = 0; i < 2; i++) {
            anim.particles.push({
              x: rng() * CANVAS_W,
              y: -2,
              vx: -0.3,
              vy: 1.5 + rng() * 1.0,
              life: 999, maxLife: 999,
              colorIndex: 4 as PicoColorIndex,
            });
          }
        }
        break;
      case 'fireworks':
        // 周期性生成新的爆炸（每0.6秒）
        if (rng() < dt * 1.7 && anim.particles.length < 30) {
          const bx = 50 + rng() * 156;
          const by = 30 + rng() * 60;
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const speed = 1.5 + rng() * 1.0;
            anim.particles.push({
              x: bx, y: by,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 40 + Math.floor(rng() * 20), maxLife: 60,
              colorIndex: (i % 2 === 0 ? 7 : 2) as PicoColorIndex,
            });
          }
        }
        break;
      case 'hearts':
        if (anim.particles.length < 15 && rng() < dt * 2) {
          anim.particles.push({
            x: rng() * CANVAS_W,
            y: -5,
            vx: (rng() - 0.5) * 0.3,
            vy: 0.3 + rng() * 0.4,
            life: 999, maxLife: 999,
            colorIndex: 3 as PicoColorIndex,
            extra: rng() * Math.PI * 2,
          });
        }
        break;
      case 'money_rain':
        if (anim.particles.length < 15 && rng() < dt * 2) {
          anim.particles.push({
            x: rng() * CANVAS_W,
            y: -5,
            vx: (rng() - 0.5) * 0.2,
            vy: 1.0 + rng() * 0.8,
            life: 999, maxLife: 999,
            colorIndex: (rng() < 0.5 ? 5 : 2) as PicoColorIndex,
          });
        }
        break;
      case 'tears':
        if (anim.particles.length < 8 && rng() < dt * 3) {
          anim.particles.push({
            x: PERSON_X - 3 + rng() * 6,
            y: GROUND_Y - 24 + rng() * 4,
            vx: (rng() - 0.5) * 0.1,
            vy: 0.3 + rng() * 0.3,
            life: 80 + Math.floor(rng() * 40), maxLife: 120,
            colorIndex: 4 as PicoColorIndex,
          });
        }
        break;
      case 'confetti':
        if (anim.particles.length < 25 && rng() < dt * 2.5) {
          anim.particles.push({
            x: rng() * CANVAS_W,
            y: -5,
            vx: (rng() - 0.5) * 0.4,
            vy: 0.8 + rng() * 0.6,
            life: 999, maxLife: 999,
            colorIndex: (Math.floor(rng() * 7)) as PicoColorIndex,
            extra: rng() * Math.PI * 2,
          });
        }
        break;
      case 'gold_burst': {
        // 持续补充新金币
        if (anim.particles.length < 30 && anim.intensity > 0.3) {
          anim.particles.push({
            x: Math.random() * CANVAS_W,
            y: -5,
            vx: (Math.random() - 0.5) * 0.5,
            vy: 1.5 + Math.random() * 2,
            life: 60 + Math.random() * 60,
            maxLife: 120,
            colorIndex: 7 as PicoColorIndex,
            extra: 0,
          });
        }
        break;
      }
      case 'house_build': {
        // 不需要粒子
        break;
      }
    }
  }

  // ================================================================
  //  事件动画渲染
  // ================================================================

  function drawEventAnimation(primitives: PixelPrimitive[], anim: SceneAnimation): void {
    const fadeAlpha = anim.intensity; // 整体淡出
    switch (anim.type) {
      case 'rain':
        drawRainAnimation(primitives, anim, fadeAlpha);
        break;
      case 'fireworks':
        drawFireworksAnimation(primitives, anim, fadeAlpha);
        break;
      case 'hearts':
        drawHeartsAnimation(primitives, anim, fadeAlpha);
        break;
      case 'money_rain':
        drawMoneyRainAnimation(primitives, anim, fadeAlpha);
        break;
      case 'lightning':
        drawLightningAnimation(primitives, anim, fadeAlpha);
        break;
      case 'tears':
        drawTearsAnimation(primitives, anim, fadeAlpha);
        break;
      case 'confetti':
        drawConfettiAnimation(primitives, anim, fadeAlpha);
        break;
      case 'skull':
        drawSkullAnimation(primitives, anim, fadeAlpha);
        break;
      case 'gold_burst': {
        // 大量金色粒子从上方飘落
        for (const p of anim.particles) {
          const alpha = p.life / p.maxLife;
          if (alpha > 0.1 && Math.floor(p.life) % 2 === 0) {
            primitives.push({ type: 'point', x: Math.round(p.x), y: Math.round(p.y), colorIndex: 7, layer: 5 });
            // $符号形状：在点上方多画一个点模拟$的竖线
            if (p.life % 3 < 1.5) {
              primitives.push({ type: 'point', x: Math.round(p.x), y: Math.round(p.y) - 1, colorIndex: 7, layer: 5 });
              primitives.push({ type: 'point', x: Math.round(p.x) - 1, y: Math.round(p.y) - 1, colorIndex: 7, layer: 5 });
            }
          }
        }
        break;
      }
      case 'house_build': {
        // 从下往上逐行填充像素，模拟房子"建造"过程
        const progress = 1 - anim.intensity;
        const buildHeight = Math.floor(progress * 32);
        const baseX = 40;
        const baseY = GROUND_Y;
        for (let dy = 0; dy < Math.min(buildHeight, 32); dy++) {
          for (let dx = 0; dx < 38; dx++) {
            // 砖块纹理
            const isGrout = (dy % 4 === 0) || ((dx + (Math.floor(dy / 4) % 2) * 8) % 8 === 0);
            const colorIdx = isGrout ? 6 : 7;
            primitives.push({ type: 'point', x: baseX + dx, y: baseY - dy, colorIndex: colorIdx as PicoColorIndex, layer: 5 });
          }
        }
        // 顶部闪光
        if (progress < 0.2) {
          for (let i = 0; i < 5; i++) {
            const fx = baseX + Math.floor(Math.random() * 38);
            primitives.push({ type: 'point', x: fx, y: baseY - buildHeight + Math.floor(Math.random() * 3), colorIndex: 2, layer: 5 });
          }
        }
        break;
      }
    }
  }

  function drawRainAnimation(primitives: PixelPrimitive[], anim: SceneAnimation, _fade: number): void {
    for (const p of anim.particles) {
      const x = Math.round(p.x);
      const y = Math.round(p.y);
      // 每个雨滴是一条3像素长的竖线
      for (let i = 0; i < 3; i++) {
        const py = y + i;
        if (py >= 0 && py < CANVAS_H && x >= 0 && x < CANVAS_W) {
          primitives.push({ type: 'point', x, y: py, colorIndex: p.colorIndex, layer: 5 });
        }
      }
    }
  }

  function drawFireworksAnimation(primitives: PixelPrimitive[], anim: SceneAnimation, fade: number): void {
    for (const p of anim.particles) {
      const alpha = p.life / p.maxLife;
      if (alpha < 0.3 && Math.floor(p.life) % 2 === 0) continue; // 闪烁消失
      const x = Math.round(p.x);
      const y = Math.round(p.y);
      if (x >= 0 && x < CANVAS_W && y >= 0 && y < CANVAS_H) {
        // 爆炸点随时间扩散，亮度随life衰减
        if (fade > 0.3) {
          primitives.push({ type: 'point', x, y, colorIndex: p.colorIndex, layer: 5 });
        }
      }
    }
  }

  function drawHeartsAnimation(primitives: PixelPrimitive[], anim: SceneAnimation, _fade: number): void {
    for (const p of anim.particles) {
      const cx = Math.round(p.x + Math.sin(p.extra ?? 0) * 2); // 轻微摇摆
      const cy = Math.round(p.y);
      if (cy < 0 || cy >= CANVAS_H || cx < 0 || cx >= CANVAS_W) continue;
      // 简单的像素爱心（3x3像素点阵）
      const heartPattern = [
        [0, 1, 0],
        [1, 0, 1],
        [0, 1, 0],
      ];
      for (let py = 0; py < 3; py++) {
        for (let px = 0; px < 3; px++) {
          if (heartPattern[py][px]) {
            const dx = cx + px - 1;
            const dy = cy + py - 1;
            if (dx >= 0 && dx < CANVAS_W && dy >= 0 && dy < CANVAS_H) {
              primitives.push({ type: 'point', x: dx, y: dy, colorIndex: p.colorIndex, layer: 5 });
            }
          }
        }
      }
    }
  }

  function drawMoneyRainAnimation(primitives: PixelPrimitive[], anim: SceneAnimation, _fade: number): void {
    for (const p of anim.particles) {
      const x = Math.round(p.x);
      const y = Math.round(p.y);
      if (x < 0 || x >= CANVAS_W || y < 0 || y >= CANVAS_H) continue;
      // 简化的 $ 符号（3x5像素）
      const dollarPattern = [
        [0, 1, 0],
        [1, 0, 1],
        [0, 1, 0],
        [1, 0, 1],
        [0, 1, 0],
      ];
      for (let py = 0; py < 5; py++) {
        for (let px = 0; px < 3; px++) {
          if (dollarPattern[py][px]) {
            const dx = x + px - 1;
            const dy = y + py - 2;
            if (dx >= 0 && dx < CANVAS_W && dy >= 0 && dy < CANVAS_H) {
              primitives.push({ type: 'point', x: dx, y: dy, colorIndex: p.colorIndex, layer: 5 });
            }
          }
        }
      }
    }
  }

  function drawLightningAnimation(primitives: PixelPrimitive[], anim: SceneAnimation, fade: number): void {
    // 闪烁效果：只在奇数帧显示
    if (Math.floor(performance.now() / 80) % 2 === 0 && fade > 0.5) return;
    // 从顶部到中间的锯齿形闪电
    const rng = createSeededRandom(anim.seed);
    const startX = 80 + Math.floor(rng() * 96);
    let x = startX;
    let y = 0;
    while (y < 128) {
      const nx = x + Math.floor((rng() - 0.5) * 12);
      const ny = y + 6 + Math.floor(rng() * 6);
      // 画锯齿线段
      const steps = Math.max(Math.abs(nx - x), Math.abs(ny - y));
      for (let s = 0; s <= steps; s++) {
        const t = s / Math.max(steps, 1);
        const px = Math.round(x + (nx - x) * t);
        const py = Math.round(y + (ny - y) * t);
        if (px >= 0 && px < CANVAS_W && py >= 0 && py < CANVAS_H) {
          primitives.push({ type: 'point', x: px, y: py, colorIndex: 1, layer: 5 }); // 白色
          // 闪电周围辉光
          if (px + 1 < CANVAS_W) {
            primitives.push({ type: 'point', x: px + 1, y: py, colorIndex: 2, layer: 5 }); // 暖黄辉光
          }
        }
      }
      x = nx;
      y = ny;
    }
  }

  function drawTearsAnimation(primitives: PixelPrimitive[], anim: SceneAnimation, fade: number): void {
    for (const p of anim.particles) {
      const alpha = p.life / p.maxLife;
      if (alpha < 0.2 && Math.floor(p.life * 3) % 2 === 0) continue;
      const x = Math.round(p.x);
      const y = Math.round(p.y);
      if (x >= 0 && x < CANVAS_W && y >= 0 && y < CANVAS_H) {
        // 泪滴：2像素点
        primitives.push({ type: 'point', x, y, colorIndex: p.colorIndex, layer: 5 });
        if (y + 1 < CANVAS_H && fade > 0.4) {
          primitives.push({ type: 'point', x, y: y + 1, colorIndex: p.colorIndex, layer: 5 });
        }
      }
    }
  }

  function drawConfettiAnimation(primitives: PixelPrimitive[], anim: SceneAnimation, _fade: number): void {
    for (const p of anim.particles) {
      // 左右摇摆
      const sway = Math.sin(p.extra ?? 0) * 1.5;
      const x = Math.round(p.x + sway);
      const y = Math.round(p.y);
      if (x < 0 || x >= CANVAS_W || y < 0 || y >= CANVAS_H) continue;
      // 小方块（1x1或2x1）
      primitives.push({ type: 'point', x, y, colorIndex: p.colorIndex, layer: 5 });
      if ((Math.floor(p.extra ?? 0) % 2 === 0) && x + 1 < CANVAS_W) {
        primitives.push({ type: 'point', x: x + 1, y, colorIndex: p.colorIndex, layer: 5 });
      }
    }
  }

  function drawSkullAnimation(primitives: PixelPrimitive[], anim: SceneAnimation, _fade: number): void {
    // 只在前1秒内显示，之后闪烁消失
    const elapsed = anim.maxTimer - anim.timer;
    if (elapsed > 1.0 && Math.floor(performance.now() / 120) % 2 === 0) return;

    const cx = PERSON_X;
    const cy = GROUND_Y - 44; // 人物头顶上方

    // 像素骷髅图案（9x10像素）
    const skullPattern: (PicoColorIndex | 0)[][] = [
      [0, 0, 1, 1, 1, 1, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 0, 1, 1, 0, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 1, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 1, 1, 0, 0, 0, 0],
    ];
    for (let py = 0; py < skullPattern.length; py++) {
      for (let px = 0; px < skullPattern[py].length; px++) {
        if (skullPattern[py][px] === 1) {
          const dx = cx - 4 + px;
          const dy = cy + py;
          if (dx >= 0 && dx < CANVAS_W && dy >= 0 && dy < CANVAS_H) {
            primitives.push({ type: 'point', x: dx, y: dy, colorIndex: 1, layer: 5 });
          }
        }
      }
    }
  }

  function triggerShockwave() {
    shockwave.value = { radius: 0, active: true };
  }

  function triggerAssetChange(amount: number, originX?: number, originY?: number) {
    const isGain = amount > 0;
    const colorIdx: PicoColorIndex = isGain ? 5 : 3;
    const count = Math.min(12, Math.max(4, Math.floor(Math.abs(amount) / 1000)));

    const ox = originX ?? PERSON_X;
    const oy = originY ?? 190;

    for (let i = 0; i < count; i++) {
      if (assetParticles.value.length >= MAX_PARTICLES) break;
      const angle = (Math.random() - 0.5) * Math.PI * 0.6 - Math.PI / 2;
      const speed = 0.5 + Math.random() * 0.6;
      assetParticles.value.push({
        x: ox,
        y: oy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 48,
        maxLife: 48,
        size: 1,
        colorIndex: colorIdx,
        trail: [],
      });
    }
  }

  function resetParticles() {
    particles.value = [];
    assetParticles.value = [];
    shockwave.value = { radius: 0, active: false };
  }

  function hasActiveAnimations(): boolean {
    return activeAnimations.value.length > 0;
  }

  return {
    generateScenePrimitives,
    updateParticles,
    updateAnimations,
    triggerShockwave,
    triggerAssetChange,
    triggerEventAnimation,
    resetParticles,
    hasActiveAnimations,
  };
}
