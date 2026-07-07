import type { PixelPrimitive, PicoColorIndex } from '../types/renderer.ts';
import { PICO_PALETTE } from '../types/renderer.ts';
import { simplex2D, createSeededRandom } from './procedural.ts';

// ============================================================
//  辅助: 色盘索引 -> RGBA 像素写入
// ============================================================

/** 将色盘颜色写入 RGBA buffer (A 固定 255) */
function putPixel(
  data: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
  colorIndex: PicoColorIndex,
): void {
  const idx = (y * width + x) * 4;
  const c = PICO_PALETTE[colorIndex];
  data[idx] = c[0];
  data[idx + 1] = c[1];
  data[idx + 2] = c[2];
  data[idx + 3] = 255;
}

/** 将任意数值夹到 [0, 255] */
function clampByte(v: number): number {
  if (v < 0) return 0;
  if (v > 255) return 255;
  return v;
}

/** 在色盘中寻找与给定 RGB 最接近的颜色索引 (欧氏距离) */
function nearestPaletteIndex(r: number, g: number, b: number): PicoColorIndex {
  let bestIdx: PicoColorIndex = 0;
  let bestDist = Infinity;
  for (let i = 0; i < PICO_PALETTE.length; i++) {
    const c = PICO_PALETTE[i];
    const dr = r - c[0];
    const dg = g - c[1];
    const db = b - c[2];
    const dist = dr * dr + dg * dg + db * db;
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i as PicoColorIndex;
    }
  }
  return bestIdx;
}

// ============================================================
//  光栅化主函数
// ============================================================

/**
 * 将一组像素图元光栅化为 ImageData。
 *
 * - 按 layer 升序排序 (小值先绘制, 被大值覆盖)
 * - 背景填充色盘索引 0 (深空夜底)
 * - 支持 'point' 与 'rect' 类型, 其他类型跳过
 * - 返回全新的 ImageData, 尺寸为 width x height
 */
export function rasterize(
  primitives: readonly PixelPrimitive[],
  width: number,
  height: number,
): ImageData {
  const imageData = new ImageData(width, height);
  const data = imageData.data;

  // 1. 填充背景色 (索引 0)
  const bg = PICO_PALETTE[0];
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    data[idx] = bg[0];
    data[idx + 1] = bg[1];
    data[idx + 2] = bg[2];
    data[idx + 3] = 255;
  }

  // 2. 按 layer 升序排序 (稳定: 使用数组索引保证同层顺序)
  const sorted = primitives
    .map((p, i) => ({ p, i }))
    .sort((a, b) => {
      if (a.p.layer !== b.p.layer) {
        return a.p.layer - b.p.layer;
      }
      return a.i - b.i;
    });

  // 3. 逐图元绘制
  for (const { p } of sorted) {
    switch (p.type) {
      case 'point': {
        const px = Math.floor(p.x);
        const py = Math.floor(p.y);
        if (px >= 0 && px < width && py >= 0 && py < height) {
          putPixel(data, width, px, py, p.colorIndex);
        }
        break;
      }
      case 'rect': {
        const rx = Math.floor(p.x);
        const ry = Math.floor(p.y);
        const rw = Math.floor(p.w ?? 1);
        const rh = Math.floor(p.h ?? 1);
        const x0 = Math.max(0, rx);
        const y0 = Math.max(0, ry);
        const x1 = Math.min(width, rx + rw);
        const y1 = Math.min(height, ry + rh);
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) {
            putPixel(data, width, x, y, p.colorIndex);
          }
        }
        break;
      }
      default:
        // hline / vline / sprite / noise 类型不在本函数处理范围内, 跳过
        break;
    }
  }

  return imageData;
}

// ============================================================
//  Floyd-Steinberg 误差扩散抖动
// ============================================================

/**
 * 对 RGBA buffer 就地执行 Floyd-Steinberg 误差扩散抖动,
 * 将所有像素量化到 PICO_PALETTE 色盘。
 *
 * 严格四向边界保护:
 *   右(x+1,y) 7/16,  左下(x-1,y+1) 3/16,
 *   下(x,y+1) 5/16,  右下(x+1,y+1) 1/16
 * 超出画布边界的方向不扩散误差。
 *
 * @param data RGBA 像素缓冲 (Uint8ClampedArray, 就地修改)
 * @param w    缓冲宽度 (像素)
 * @param h    缓冲高度 (像素)
 */
export function floydSteinberg(
  data: Uint8ClampedArray,
  w: number,
  h: number,
): void {
  // 使用浮点缓冲累积误差, 避免 Uint8ClampedArray 在过程中反复裁剪
  const buf = new Float32Array(w * h * 3);
  for (let i = 0; i < w * h; i++) {
    const si = i * 4;
    const di = i * 3;
    buf[di] = data[si];
    buf[di + 1] = data[si + 1];
    buf[di + 2] = data[si + 2];
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const di = (y * w + x) * 3;
      const oldR = buf[di];
      const oldG = buf[di + 1];
      const oldB = buf[di + 2];

      const idx = nearestPaletteIndex(oldR, oldG, oldB);
      const pc = PICO_PALETTE[idx];
      const newR = pc[0];
      const newG = pc[1];
      const newB = pc[2];

      // 写回量化后颜色
      buf[di] = newR;
      buf[di + 1] = newG;
      buf[di + 2] = newB;

      // 计算误差
      const errR = oldR - newR;
      const errG = oldG - newG;
      const errB = oldB - newB;

      // 四向扩散, 每个方向独立边界检查
      // 右 (x+1, y)  -> 7/16
      if (x + 1 < w) {
        const ni = (y * w + (x + 1)) * 3;
        buf[ni] += errR * (7 / 16);
        buf[ni + 1] += errG * (7 / 16);
        buf[ni + 2] += errB * (7 / 16);
      }
      // 左下 (x-1, y+1) -> 3/16
      if (x - 1 >= 0 && y + 1 < h) {
        const ni = ((y + 1) * w + (x - 1)) * 3;
        buf[ni] += errR * (3 / 16);
        buf[ni + 1] += errG * (3 / 16);
        buf[ni + 2] += errB * (3 / 16);
      }
      // 下 (x, y+1) -> 5/16
      if (y + 1 < h) {
        const ni = ((y + 1) * w + x) * 3;
        buf[ni] += errR * (5 / 16);
        buf[ni + 1] += errG * (5 / 16);
        buf[ni + 2] += errB * (5 / 16);
      }
      // 右下 (x+1, y+1) -> 1/16
      if (x + 1 < w && y + 1 < h) {
        const ni = ((y + 1) * w + (x + 1)) * 3;
        buf[ni] += errR * (1 / 16);
        buf[ni + 1] += errG * (1 / 16);
        buf[ni + 2] += errB * (1 / 16);
      }
    }
  }

  // 将浮点缓冲写回 Uint8ClampedArray, 夹取并重置 Alpha
  for (let i = 0; i < w * h; i++) {
    const si = i * 4;
    const di = i * 3;
    data[si] = clampByte(buf[di]);
    data[si + 1] = clampByte(buf[di + 1]);
    data[si + 2] = clampByte(buf[di + 2]);
    data[si + 3] = 255;
  }
}

// ============================================================
//  程序化噪声贴图图元应用
// ============================================================

/**
 * 将一个 noise 类型图元以 Simplex 噪声阈值方式应用到 RGBA buffer。
 *
 * - 在 primitive 描述的矩形区域内逐像素采样 2D Simplex 噪声
 * - 噪声值 >= 0 的像素设置为 primitive.colorIndex 对应颜色
 * - 其余像素保持 buffer 原有内容不变
 * - noiseScale 控制频率 (默认 0.1), noiseSeed 控制采样偏移 (默认 0)
 *
 * @param buffer    RGBA 像素缓冲 (就地修改)
 * @param w         缓冲宽度
 * @param h         缓冲高度
 * @param primitive noise 类型的像素图元 (需要 x, y, w?, h?, colorIndex, noiseScale?, noiseSeed?)
 */
export function applyProceduralNoise(
  buffer: Uint8ClampedArray,
  w: number,
  h: number,
  primitive: PixelPrimitive,
): void {
  const px = Math.floor(primitive.x);
  const py = Math.floor(primitive.y);
  const pw = Math.floor(primitive.w ?? 1);
  const ph = Math.floor(primitive.h ?? 1);
  const scale = primitive.noiseScale ?? 0.1;
  const seed = primitive.noiseSeed ?? 0;

  const rng = createSeededRandom(seed);
  const ox = rng() * 10000;
  const oy = rng() * 10000;

  const x0 = Math.max(0, px);
  const y0 = Math.max(0, py);
  const x1 = Math.min(w, px + pw);
  const y1 = Math.min(h, py + ph);

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const n = simplex2D((x + ox) * scale, (y + oy) * scale);
      if (n >= 0) {
        putPixel(buffer, w, x, y, primitive.colorIndex);
      }
    }
  }
}
