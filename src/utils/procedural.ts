import type { PixelPrimitive, PicoColorIndex } from '../types/renderer.ts';

// ============================================================
//  可复现种子随机数 (mulberry32)
// ============================================================

/**
 * 创建一个基于种子的可复现伪随机数生成器。
 * 算法: mulberry32, 返回 [0, 1) 区间的 float。
 */
export function createSeededRandom(seed: number): () => number {
  let s = seed | 0;
  return function seededRandom(): number {
    s = (s + 0x6D2B79F5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ============================================================
//  Simplex Noise 2D (Ken Perlin, 2002 改进版)
// ============================================================

const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;

/** 12 个方向梯度向量 (单位圆上均匀分布) */
const GRAD3: ReadonlyArray<readonly [number, number]> = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [-1, 1], [1, -1], [-1, -1],
];

/** 默认置换表 (经典 Perlin 排列, 256 项 + 256 项重复) */
const DEFAULT_PERM: number[] = (() => {
  const base = [
    151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,
    140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,
    247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,
    57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,
    74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,
    60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,
    65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,
    200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,
    52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,
    207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,
    119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,
    129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,
    218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,
    81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,
    184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,
    222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180,
  ];
  const perm = new Array<number>(512);
  for (let i = 0; i < 512; i++) {
    perm[i] = base[i & 255];
  }
  return perm;
})();

/**
 * 2D Simplex Noise。
 * 返回值范围约 [-1, 1]。
 * 若提供 perm 则使用给定置换表, 否则使用默认经典置换表。
 */
export function simplex2D(x: number, y: number, perm?: ArrayLike<number>): number {
  const p = perm ?? DEFAULT_PERM;

  // 偏斜到蜂窝网格
  const s = (x + y) * F2;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);

  const t = (i + j) * G2;
  // 相对于蜂窝原点的坐标
  const X0 = i - t;
  const Y0 = j - t;
  const x0 = x - X0;
  const y0 = y - Y0;

  // 确定第二个点 (i1,j1)
  let i1: number;
  let j1: number;
  if (x0 > y0) {
    i1 = 1;
    j1 = 0;
  } else {
    i1 = 0;
    j1 = 1;
  }

  // 第三个点的偏移
  const x1 = x0 - i1 + G2;
  const y1 = y0 - j1 + G2;
  const x2 = x0 - 1.0 + 2.0 * G2;
  const y2 = y0 - 1.0 + 2.0 * G2;

  const ii = i & 255;
  const jj = j & 255;
  const gi0 = p[ii + p[jj]] % 12;
  const gi1 = p[ii + i1 + p[jj + j1]] % 12;
  const gi2 = p[ii + 1 + p[jj + 1]] % 12;

  let n0 = 0;
  let n1 = 0;
  let n2 = 0;

  let t0 = 0.5 - x0 * x0 - y0 * y0;
  if (t0 >= 0) {
    t0 *= t0;
    const g = GRAD3[gi0];
    n0 = t0 * t0 * (g[0] * x0 + g[1] * y0);
  }

  let t1 = 0.5 - x1 * x1 - y1 * y1;
  if (t1 >= 0) {
    t1 *= t1;
    const g = GRAD3[gi1];
    n1 = t1 * t1 * (g[0] * x1 + g[1] * y1);
  }

  let t2 = 0.5 - x2 * x2 - y2 * y2;
  if (t2 >= 0) {
    t2 *= t2;
    const g = GRAD3[gi2];
    n2 = t2 * t2 * (g[0] * x2 + g[1] * y2);
  }

  // 缩放到 [-1, 1]
  return 70.0 * (n0 + n1 + n2);
}

// ============================================================
//  天际线程序化生成
// ============================================================

/** 天际线生成可选配置 */
export interface SkylineOptions {
  /** 建筑最大高度 (像素), 默认 48 */
  maxHeight?: number;
  /** 建筑最小高度 (像素), 低于此值视为空地, 默认 8 */
  minHeight?: number;
  /** 高度阶梯量化步长, 默认 4 */
  stepQuant?: number;
  /** 孤立柱过滤阈值 (邻居高度 < self*threshold 则抹除), 默认 0.6 */
  isolationThreshold?: number;
  /** 建筑主体颜色, 默认根据经济周期推断 */
  buildingColor?: PicoColorIndex;
  /** 窗户灯光颜色, 默认根据经济周期推断 */
  windowColor?: PicoColorIndex;
  /** 窗户点亮概率 [0,1], 默认根据经济周期推断 */
  windowLitChance?: number;
  /** 窗户最小建筑高度要求, 默认 16 */
  windowMinHeight?: number;
  /** 噪声采样频率 (控制建筑宽度), 默认 0.04 */
  noiseFreq?: number;
  /** fBm 八度数量, 默认 3 */
  octaves?: number;
  /** 图元所在图层, 默认 0 (远建筑层) */
  buildingLayer?: number;
  /** 窗户所在图层, 默认 buildingLayer + 1 */
  windowLayer?: number;
  /** 地面基线 Y 坐标 (建筑底部对齐位置), 默认等于 height 参数 */
  groundY?: number;
}

const DEFAULT_MAX_BUILDING_HEIGHT = 48;
const DEFAULT_MIN_BUILDING_HEIGHT = 8;
const DEFAULT_STEP_QUANT = 4;
const DEFAULT_ISOLATION_THRESHOLD = 0.6;
const DEFAULT_NOISE_FREQ = 0.04;
const DEFAULT_OCTAVES = 3;

/**
 * 内部核心: 根据噪声场生成单层天际线建筑矩形图元。
 *
 * 管线: 采样 -> 周期缩放 -> 量化 -> 连通性过滤 -> 矩形图元生成
 *
 * @param width  画布宽度 (像素列数, 0-255 坐标系)
 * @param height 画布高度 (地面基线默认在此位置)
 * @param cycle  经济周期: 0=繁荣(raw*=1.2), 1=平稳(raw*=1.0), 2=萧条(raw*=0.7)
 * @param seed   随机种子, 用于可复现噪声偏移
 * @param opts   可选配置, 覆盖颜色/高度/图层等参数
 */
export function generateSkylineLayer(
  width: number,
  height: number,
  cycle: 0 | 1 | 2,
  seed: number = 1337,
  opts: SkylineOptions = {},
): PixelPrimitive[] {
  const rng = createSeededRandom(seed);
  const offsetX = rng() * 1000;
  const offsetY = rng() * 1000;

  const maxH = opts.maxHeight ?? DEFAULT_MAX_BUILDING_HEIGHT;
  const minH = opts.minHeight ?? DEFAULT_MIN_BUILDING_HEIGHT;
  const stepQ = opts.stepQuant ?? DEFAULT_STEP_QUANT;
  const isoThresh = opts.isolationThreshold ?? DEFAULT_ISOLATION_THRESHOLD;
  const noiseFreq = opts.noiseFreq ?? DEFAULT_NOISE_FREQ;
  const octaves = opts.octaves ?? DEFAULT_OCTAVES;
  const buildingLayer = opts.buildingLayer ?? 0;
  const windowLayer = opts.windowLayer ?? buildingLayer + 1;
  const groundY = opts.groundY ?? height;
  const windowMinH = opts.windowMinHeight ?? 16;

  // 周期缩放系数
  let cycleMul = 1.0;
  if (cycle === 0) cycleMul = 1.2;
  else if (cycle === 2) cycleMul = 0.7;

  // 默认颜色: 繁荣=蓝(4), 平稳=灰(6), 萧条=铁锈橘(7)
  let buildingColor: PicoColorIndex;
  if (opts.buildingColor !== undefined) {
    buildingColor = opts.buildingColor;
  } else if (cycle === 0) {
    buildingColor = 4;
  } else if (cycle === 2) {
    buildingColor = 7;
  } else {
    buildingColor = 6;
  }

  // 默认窗户: 繁荣/平稳=暖黄(2), 萧条=无灯(阴影6)
  let windowColor: PicoColorIndex;
  if (opts.windowColor !== undefined) {
    windowColor = opts.windowColor;
  } else if (cycle === 2) {
    windowColor = 6;
  } else {
    windowColor = 2;
  }

  // 窗户点亮概率
  let winChance: number;
  if (opts.windowLitChance !== undefined) {
    winChance = opts.windowLitChance;
  } else if (cycle === 0) {
    winChance = 0.65; // 繁荣: 窗户大多亮着
  } else if (cycle === 2) {
    winChance = 0.0;  // 萧条: 无灯
  } else {
    winChance = 0.45; // 平稳: 约半数亮着
  }

  // ---------- 1. 采样原始高度 (多层八度 fBm) ----------
  const heights = new Array<number>(width);
  for (let x = 0; x < width; x++) {
    let raw = 0;
    let amp = 1.0;
    let freq = noiseFreq;
    let norm = 0;
    for (let oct = 0; oct < octaves; oct++) {
      raw += simplex2D((x + offsetX) * freq, offsetY * freq) * amp;
      norm += amp;
      amp *= 0.5;
      freq *= 2.0;
    }
    raw /= norm; // [-1, 1]
    raw = (raw + 1) * 0.5; // [0, 1]
    raw *= cycleMul;
    heights[x] = raw;
  }

  // ---------- 2. 量化到阶梯, 并裁剪 ----------
  const quantHeights = new Array<number>(width);
  for (let x = 0; x < width; x++) {
    let h = Math.round(heights[x] * maxH / stepQ) * stepQ;
    if (h < minH) h = 0;
    if (h > maxH) h = maxH;
    quantHeights[x] = h;
  }

  // ---------- 3. 连通性过滤 (去孤立柱) ----------
  const filtered = new Array<number>(width);
  for (let x = 0; x < width; x++) {
    const h = quantHeights[x];
    if (h === 0) { filtered[x] = 0; continue; }
    const left = x > 0 ? quantHeights[x - 1] : 0;
    const right = x < width - 1 ? quantHeights[x + 1] : 0;
    const threshold = h * isoThresh;
    if (left < threshold && right < threshold) {
      filtered[x] = 0;
    } else {
      filtered[x] = h;
    }
  }

  // ---------- 4. 生成矩形图元 (水平游程编码合并) ----------
  const primitives: PixelPrimitive[] = [];

  let runStart = 0;
  let runHeight = filtered[0];

  for (let x = 1; x <= width; x++) {
    const h = x < width ? filtered[x] : -1;
    if (h !== runHeight || x === width) {
      if (runHeight > 0) {
        const runW = x - runStart;
        // 建筑主体矩形
        primitives.push({
          type: 'rect',
          x: runStart,
          y: groundY - runHeight,
          w: runW,
          h: runHeight,
          colorIndex: buildingColor,
          layer: buildingLayer,
        });

        // 窗户点缀
        if (windowColor !== buildingColor && runHeight >= windowMinH && winChance > 0) {
          const windowRng = createSeededRandom(seed + runStart * 7919 + Math.floor(runHeight));
          const winStrideV = 4; // 垂直间距
          const winStrideH = 3; // 水平间距
          for (let wy = groundY - runHeight + 3; wy < groundY - 2; wy += winStrideV) {
            for (let wx = runStart + 1; wx < runStart + runW - 1; wx += winStrideH) {
              if (windowRng() < winChance) {
                // 窗户为 1x1 像素点灯, 部分为 2x1 双格窗
                const isDouble = windowRng() < 0.3;
                primitives.push({
                  type: 'point',
                  x: wx,
                  y: wy,
                  colorIndex: windowColor,
                  layer: windowLayer,
                });
                if (isDouble && wx + 1 < runStart + runW - 1) {
                  primitives.push({
                    type: 'point',
                    x: wx + 1,
                    y: wy,
                    colorIndex: windowColor,
                    layer: windowLayer,
                  });
                }
              }
            }
          }
        }

        // 建筑顶部天线/装饰 (少量高楼随机添加小天线)
        if (runHeight >= maxH * 0.7) {
          const antRng = createSeededRandom(seed + runStart * 31 + 7);
          const antCount = Math.floor(runW / 12);
          for (let a = 0; a < antCount; a++) {
            const ax = runStart + 2 + Math.floor(antRng() * (runW - 4));
            const antH = 2 + Math.floor(antRng() * 4);
            primitives.push({
              type: 'rect',
              x: ax,
              y: groundY - runHeight - antH,
              w: 1,
              h: antH,
              colorIndex: buildingColor,
              layer: buildingLayer,
            });
            // 天线顶部小红灯 (繁荣期亮)
            if (cycle === 0 && antRng() < 0.5) {
              primitives.push({
                type: 'point',
                x: ax,
                y: groundY - runHeight - antH,
                colorIndex: 3,
                layer: windowLayer,
              });
            }
          }
        }
      }
      runStart = x;
      runHeight = h;
    }
  }

  return primitives;
}

/**
 * 根据噪声场生成天际线建筑矩形图元 (兼容旧接口, 默认单层)。
 *
 * 管线: 采样 -> 周期缩放 -> 量化 -> 连通性过滤 -> 矩形图元生成
 *
 * @param width  画布宽度 (像素列数, 0-255 坐标系)
 * @param height 画布高度 (地面在 y = height - 1, 建筑向上生长)
 * @param cycle  经济周期: 0=繁荣(raw*=1.2), 1=平稳(raw*=1.0), 2=萧条(raw*=0.7)
 * @param seed   随机种子, 用于可复现噪声偏移
 * @param opts   可选配置 (颜色/高度/图层等)
 */
export function generateSkyline(
  width: number,
  height: number,
  cycle: 0 | 1 | 2,
  seed: number = 1337,
  opts?: SkylineOptions,
): PixelPrimitive[] {
  return generateSkylineLayer(width, height, cycle, seed, opts);
}

/**
 * 便捷函数: 生成双层天际线 (远景+近景), 营造城市纵深感。
 *
 * - 远景层: 建筑偏矮, 颜色偏灰蓝, 窗户稀少/暗淡, 图层靠后
 * - 近景层: 建筑偏高, 颜色为深色剪影, 窗户暖黄明亮, 图层靠前
 *
 * 支持三种城市风格:
 * - "资本修罗场": 一线大都市, 摩天楼群, 尖顶天线, 灯光密集
 * - "中坚大后方": 二三线城市(默认), 中等高度住宅楼
 * - "避风低洼地": 小城市/县城, 低矮稀疏建筑
 *
 * @param width  画布宽度
 * @param groundY 地面基线 Y 坐标
 * @param cycle  经济周期
 * @param seed   随机种子
 * @param city   城市风格: "资本修罗场" | "中坚大后方" | "避风低洼地", 默认中坚大后方
 * @param farColor    远景建筑颜色, 未指定城市时默认 6 (浅灰); 指定城市时使用城市配色
 * @param nearColor   近景建筑颜色, 未指定城市时默认 0 (黑); 指定城市时使用城市配色
 * @param windowColor 窗户颜色, 默认 2 (暖黄)
 */
export function generateDualSkyline(
  width: number,
  groundY: number,
  cycle: 0 | 1 | 2,
  seed: number = 1337,
  city?: string,
  farColor: PicoColorIndex = 6,
  nearColor: PicoColorIndex = 0,
  windowColor: PicoColorIndex = 2,
): PixelPrimitive[] {
  const primitives: PixelPrimitive[] = [];

  // ---- 根据城市确定参数配置 ----
  let farMaxH: number, farMinH: number, farFreq: number, farWinChance: number;
  let nearMaxH: number, nearMinH: number, nearFreq: number, nearWinChance: number;
  let addSpires = false;

  if (city === '资本修罗场') {
    // 一线大都市: 非常高的摩天楼群, 灯光密集
    farMaxH = 60;  farMinH = 15; farFreq = 0.03;
    farWinChance = cycle === 2 ? 0 : cycle === 0 ? 0.6 : 0.4;
    nearMaxH = 100; nearMinH = 20; nearFreq = 0.06;
    nearWinChance = cycle === 2 ? 0.05 : cycle === 0 ? 0.85 : 0.6;
    addSpires = true;
  } else if (city === '避风低洼地') {
    // 小城市/县城: 低矮稀疏建筑
    farMaxH = 20;  farMinH = 4;  farFreq = 0.02;
    farWinChance = cycle === 2 ? 0 : cycle === 0 ? 0.2 : 0.1;
    nearMaxH = 40;  nearMinH = 6;  nearFreq = 0.04;
    nearWinChance = cycle === 2 ? 0 : cycle === 0 ? 0.4 : 0.25;
    addSpires = false;
  } else {
    // 中坚大后方 (默认): 二三线城市, 中等高度住宅楼
    farMaxH = 40;  farMinH = 6;  farFreq = 0.025;
    farWinChance = cycle === 2 ? 0 : cycle === 0 ? 0.3 : 0.2;
    nearMaxH = 88;  nearMinH = 10; nearFreq = 0.05;
    nearWinChance = cycle === 2 ? 0.05 : cycle === 0 ? 0.7 : 0.5;
    addSpires = false;
  }

  // 远景层
  const farOptions: SkylineOptions = {
    maxHeight: farMaxH,
    minHeight: farMinH,
    buildingColor: farColor,
    windowColor: windowColor,
    windowLitChance: farWinChance,
    noiseFreq: farFreq,
    octaves: 2,
    buildingLayer: 2,
    windowLayer: 2,
    groundY: groundY,
  };
  primitives.push(...generateSkylineLayer(width, groundY, cycle, seed, farOptions));

  // 近景层
  const nearOptions: SkylineOptions = {
    maxHeight: nearMaxH,
    minHeight: nearMinH,
    buildingColor: nearColor,
    windowColor: windowColor,
    windowLitChance: nearWinChance,
    noiseFreq: nearFreq,
    octaves: 3,
    buildingLayer: 3,
    windowLayer: 3,
    groundY: groundY,
  };
  primitives.push(...generateSkylineLayer(width, groundY, cycle, seed + 9999, nearOptions));

  // 资本修罗场: 在近景建筑顶部添加摩天楼尖顶/天线
  if (addSpires) {
    const spireRng = createSeededRandom(seed + 7777);
    // 收集近景建筑矩形图元 (layer=3, type=rect)
    const nearBuildings: Array<{ x: number; y: number; w: number; h: number }> = [];
    for (const p of primitives) {
      if (p.type === 'rect' && p.layer === 3) {
        nearBuildings.push({ x: p.x, y: p.y, w: p.w!, h: p.h! });
      }
    }
    // 优先选择较高建筑放置尖顶 (高度 >= nearMaxH * 0.5)
    const tallBuildings = nearBuildings.filter(b => b.h >= nearMaxH * 0.5);
    const candidatePool = tallBuildings.length >= 3 ? tallBuildings : nearBuildings;

    const spireCount = 3 + Math.floor(spireRng() * 3); // 3-5个尖顶
    const usedIndices = new Set<number>();
    for (let i = 0; i < spireCount && candidatePool.length > 0; i++) {
      // 随机选取一个未使用过的建筑
      let idx: number;
      let attempts = 0;
      do {
        idx = Math.floor(spireRng() * candidatePool.length);
        attempts++;
      } while (usedIndices.has(idx) && attempts < 20);
      usedIndices.add(idx);

      const b = candidatePool[idx];
      const spireW = 1 + Math.floor(spireRng() * 2);   // 1-2px 宽
      const spireH = 5 + Math.floor(spireRng() * 11);  // 5-15px 高
      const spireX = b.x + Math.floor(spireRng() * Math.max(1, b.w - spireW));
      primitives.push({
        type: 'rect',
        x: spireX,
        y: b.y - spireH,
        w: spireW,
        h: spireH,
        colorIndex: nearColor,
        layer: 3,
      });
    }
  }

  return primitives;
}
