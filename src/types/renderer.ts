// Pico-8 艺术色盘索引
export type PicoColorIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

// 像素图元类型
export interface PixelPrimitive {
  type: 'rect' | 'point' | 'hline' | 'vline' | 'sprite' | 'noise';
  x: number;      // 0-255 坐标系
  y: number;      // 0-255 坐标系
  w?: number;     // rect/sprite 专用
  h?: number;     // rect/sprite 专用
  colorIndex: PicoColorIndex;
  layer: number;  // 0=地板, 1=墙壁, 2=家具, 3=人物, 4=特效
  // 噪声专用字段
  noiseScale?: number;
  noiseSeed?: number;
}

// 粒子系统
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: 1 | 2;
  colorIndex: PicoColorIndex;
  trail: Array<{ x: number; y: number }>;
}

// Pico-8 色盘常量 (硬编码不可篡改)
export const PICO_PALETTE: [number, number, number][] = [
  [26, 28, 44],   // 0: 深空夜底色 #1a1c2c
  [244, 244, 244], // 1: 极简白墙 #f4f4f4
  [255, 184, 92],  // 2: 温润灯光 #ffb85c
  [255, 94, 151],  // 3: 霓虹危机红 #ff5e97
  [59, 130, 246],  // 4: 设备发光蓝 #3b82f6
  [0, 255, 170],   // 5: 机箱荧光绿 #00ffaa
  [63, 69, 104],   // 6: 家具阴影灰 #3f4568
  [239, 125, 87],  // 7: 铁锈复古暖橘 #ef7d57
  [255, 50, 50],   // 8: 尾灯警示红 #ff3232
  [100, 200, 80],  // 9: 花坛草绿 #64c850
];

// 渲染分辨率
export const RENDER_WIDTH = 256;
export const RENDER_HEIGHT = 256;
