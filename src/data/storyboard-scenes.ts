/**
 * 像素场景定义 V12 - 最终完整版
 *
 * 核心特性：
 * - 画布 24×20 像素
 * - 5像素宽Q版小人（高8像素：头3+身3+腿2），2头身比例
 * - V12: happy表情用黑点嘴，无腮红
 * - 统一语义调色板（家庭暖色/生活绿/职业蓝灰）
 * - 多帧动画（里程碑6帧，其他4帧）
 * - 更小的房子、汽车，适配人物比例
 * - 关键词使用4字以上强特征组合词，移除泛词
 * - 人物站位：站姿y=11（脚在18），坐姿y=10（椅子在16）
 * - 深色背景用T.gold/T.hair_light头发避免看不见
 * - 办公场景先画人再画桌子显示器，形成正确遮挡
 * - 毕业场景用两侧立柱+顶部横幅，不框住人物
 * - 白发用T.gray(14)不用T.white
 *
 * 语义调色板索引：
 *   0: transparent  1: 深色头发    2: 浅色头发    3: 蓝色衣服
 *   4: 红色衣服     5: 肤色        6: 主题色      7: 白色
 *   8: 天蓝/紫      9: 金色        10: 棕色       11: 桃色
 *  12: 亮红        13: 青色       14: 灰色       15: 近黑/眼睛
 */

export type StoryboardCategory = 'family' | 'life' | 'career'
type PixelFrame = number[][]

export interface StoryboardScene {
  id: string
  category: StoryboardCategory
  name?: string
  keywords: string[]
  palette: string[]
  frames: PixelFrame[]
  frameDelay: number
  animIn: 'fade' | 'rise' | 'pop' | 'slide' | 'blink' | 'shake' | 'bounce'
  priority?: number
  /** 场景前置条件：不满足则不会被匹配触发 */
  requires?: {
    hasChild?: boolean;       // 需要有孩子
    married?: boolean;        // 需要已婚
    dating?: boolean;         // 需要在约会/恋爱中(含serious)
    single?: boolean;         // 需要单身(含divorced)
    minAge?: number;          // 最低年龄
    maxAge?: number;          // 最高年龄
    employed?: boolean;       // 需要在职（非失业）
    hasProperty?: boolean;    // 需要有房产
  }
}

const W = 24, H = 20, GY = 18

// 调色板
const FAMILY_PALETTE = [
  'transparent', '#7a4a32', '#f5a623', '#3a6bb8', '#d63031', '#fdebd0',
  '#74b9ff', '#ffffff', '#a29bfe', '#fdcb6e', '#8b4513', '#fab1a0',
  '#e17055', '#00b894', '#b2bec3', '#2d3436',
]
const LIFE_PALETTE = [
  'transparent', '#5d4037', '#ff7675', '#0984e3', '#d63031', '#ffeaa7',
  '#55efc4', '#ffffff', '#74b9ff', '#ffeaa7', '#5d4037', '#fab1a0',
  '#e17055', '#00cec9', '#dfe6e9', '#2d3436',
]
const CAREER_PALETTE = [
  'transparent', '#2d3436', '#fdcb6e', '#0984e3', '#d63031', '#ffeaa7',
  '#74b9ff', '#ffffff', '#74b9ff', '#f9ca24', '#5d4037', '#fab1a0',
  '#e17055', '#00cec9', '#95a5a6', '#1e272e',
]

// 语义别名
const T = {
  hair_dark: 1, hair_light: 2, cloth_blue: 3, cloth_red: 4, skin: 5,
  theme: 6, white: 7, sky: 8, gold: 9, brown: 10, peach: 11,
  bright_red: 12, teal: 13, gray: 14, dark: 15, purple: 8,
} as const

function emptyCanvas(): PixelFrame {
  return Array.from({ length: H }, () => Array(W).fill(0))
}

function S(c: PixelFrame, r: number, col: number, v: number) {
  if (r < 0 || r >= H || col < 0 || col >= W) return
  if (!c[r]) c[r] = Array(W).fill(0)
  c[r][col] = v
}

function drawGround(c: PixelFrame, ci: number, y: number = GY) {
  for (let col = 0; col < W; col++) S(c, y, col, ci)
  for (let col = 0; col < W; col++) S(c, y+1, col, T.dark)
}

// V12: 更小的房子，适配人物比例
function drawSmallHouse(c: PixelFrame, hx: number, hy: number, roofC: number, wallC: number) {
  S(c, hy+1, hx+2, roofC); S(c, hy+1, hx+3, roofC); S(c, hy+1, hx+4, roofC); S(c, hy+1, hx+5, roofC)
  S(c, hy+2, hx+1, roofC)
  for (let col = hx+2; col <= hx+6; col++) S(c, hy+2, col, roofC)
  S(c, hy+3, hx, roofC)
  for (let col = hx+1; col <= hx+7; col++) S(c, hy+3, col, wallC)
  S(c, hy+3, hx+8, roofC)
  for (let col = hx; col <= hx+8; col++) { S(c, hy+4, col, wallC); S(c, hy+5, col, wallC) }
  S(c, hy+4, hx+3, T.brown); S(c, hy+5, hx+3, T.brown); S(c, hy+4, hx+4, T.brown); S(c, hy+5, hx+4, T.brown)
  S(c, hy+5, hx+4, T.gold)
  S(c, hy+4, hx+2, T.sky); S(c, hy+4, hx+6, T.sky)
  S(c, hy, hx+6, T.brown); S(c, hy+1, hx+6, T.brown)
  S(c, hy-1, hx+6, T.gray); S(c, hy-2, hx+7, T.gray)
}

// V12: 更小的汽车
function drawCar(c: PixelFrame, cx: number, cy: number, bodyC: number) {
  for (let col = cx; col <= cx+7; col++) { S(c, cy+1, col, bodyC); S(c, cy+2, col, bodyC) }
  S(c, cy, cx+2, bodyC); S(c, cy, cx+3, bodyC); S(c, cy, cx+4, bodyC); S(c, cy, cx+5, bodyC)
  S(c, cy+1, cx+2, T.sky); S(c, cy+1, cx+3, T.sky); S(c, cy+1, cx+4, T.sky); S(c, cy+1, cx+5, T.sky)
  S(c, cy+3, cx+1, T.dark); S(c, cy+3, cx+6, T.dark)
  S(c, cy+2, cx, T.gold); S(c, cy+2, cx+7, T.bright_red)
}

function drawDesk(c: PixelFrame, col1: number, col2: number, y: number, topC: number, legC: number) {
  for (let col = col1; col <= col2; col++) S(c, y, col, topC)
  S(c, y+1, col1, legC); S(c, y+1, col2, legC)
  S(c, y+2, col1, legC); S(c, y+2, col2, legC)
  S(c, y+3, col1, T.dark); S(c, y+3, col2, T.dark)
}

function drawMonitor(c: PixelFrame, cx: number, cy: number, screenC: number, frameC: number = T.dark) {
  for (let col = cx; col <= cx+4; col++) S(c, cy, col, frameC)
  S(c, cy+1, cx, frameC); S(c, cy+1, cx+1, screenC); S(c, cy+1, cx+2, screenC); S(c, cy+1, cx+3, screenC); S(c, cy+1, cx+4, frameC)
  S(c, cy+2, cx, frameC); S(c, cy+2, cx+1, screenC); S(c, cy+2, cx+2, screenC); S(c, cy+2, cx+3, screenC); S(c, cy+2, cx+4, frameC)
  for (let col = cx; col <= cx+4; col++) S(c, cy+3, col, frameC)
  S(c, cy+4, cx+2, frameC)
}

function drawSofa(c: PixelFrame, sofaC: number) {
  for (let col = 6; col <= 18; col++) { S(c, 10, col, sofaC); S(c, 11, col, sofaC); S(c, 12, col, sofaC); S(c, 13, col, sofaC) }
  S(c, 9, 6, sofaC); S(c, 9, 18, sofaC); S(c, 14, 6, T.dark); S(c, 14, 18, T.dark)
  S(c, 11, 9, T.gold); S(c, 11, 15, T.gold)
}

function drawCup(c: PixelFrame, x: number, y: number, ci: number) {
  S(c, y, x, ci); S(c, y, x+1, ci); S(c, y+1, x, ci); S(c, y+1, x+1, ci); S(c, y, x+2, ci)
}

// V12: 人物绘制 - happy用黑点嘴，无腮红；站姿y=11脚在18，坐姿y=10
function drawPerson(
  c: PixelFrame,
  x: number, y: number,
  hc: number, sc: number, cc: number,
  dir: 'front'|'left'|'right'|'back' = 'front',
  mood: 'normal'|'happy'|'sad'|'surprised'|'angry' = 'normal',
  act: 'stand'|'walk1'|'walk2'|'armsup'|'cheer'|'jump'|'sit'|'bow'|'type'|'lie' = 'stand'
) {
  const ec = T.dark
  // 头发 - 5像素宽锅盖头
  S(c, y, x, hc); S(c, y, x+1, hc); S(c, y, x+2, hc); S(c, y, x+3, hc); S(c, y, x+4, hc)
  S(c, y+1, x, hc); S(c, y+1, x+4, hc)
  // 脸
  S(c, y+1, x+1, sc); S(c, y+1, x+2, sc); S(c, y+1, x+3, sc)
  S(c, y+2, x+1, sc); S(c, y+2, x+2, sc); S(c, y+2, x+3, sc)
  // 眼睛
  if (dir === 'front') { S(c, y+1, x+1, ec); S(c, y+1, x+3, ec) }
  else if (dir === 'right') { S(c, y+1, x+3, ec) }
  else if (dir === 'left') { S(c, y+1, x+1, ec) }
  // 嘴/表情（V12: happy用黑点嘴，无腮红）
  if (dir !== 'back') {
    switch (mood) {
      case 'happy': S(c, y+2, x+2, ec); break
      case 'sad': S(c, y+2, x+1, ec); S(c, y+2, x+3, ec); break
      case 'surprised': S(c, y+2, x+2, T.white); S(c, y+2, x+2, ec); break
      case 'angry': S(c, y, x+1, ec); S(c, y, x+3, ec); S(c, y+2, x+1, ec); S(c, y+2, x+3, ec); S(c, y+2, x+2, ec); break
      default: S(c, y+2, x+2, ec)
    }
  } else {
    for (let col = x; col <= x+4; col++) { S(c, y+1, col, hc); S(c, y+2, col, hc) }
  }
  const by = y + 3
  // 身体（3行）
  S(c, by, x+1, cc); S(c, by, x+2, cc); S(c, by, x+3, cc)
  S(c, by+1, x+1, cc); S(c, by+1, x+2, cc); S(c, by+1, x+3, cc)
  S(c, by+2, x+1, cc); S(c, by+2, x+2, cc); S(c, by+2, x+3, cc)
  // 衣服扣子
  if (cc === T.dark) {
    S(c, by, x+2, T.white); S(c, by+1, x+2, T.white)
  } else if (act !== 'lie' && act !== 'bow') {
    S(c, by+1, x+2, T.white)
  }
  // 动作
  switch (act) {
    case 'walk1':
      S(c, by, x, sc); S(c, by, x+4, sc)
      S(c, by+3, x, cc); S(c, by+3, x+1, cc); S(c, by+3, x+3, cc); S(c, by+3, x+4, cc)
      S(c, by+4, x, cc); S(c, by+4, x+4, cc); break
    case 'walk2':
      S(c, by, x, sc); S(c, by, x+4, sc)
      S(c, by+3, x+1, cc); S(c, by+3, x+3, cc)
      S(c, by+4, x+1, cc); S(c, by+4, x+3, cc); break
    case 'armsup':
      S(c, by-1, x, cc); S(c, by-1, x+4, cc)
      S(c, by, x, sc); S(c, by, x+4, sc)
      S(c, by+3, x+1, cc); S(c, by+3, x+3, cc)
      S(c, by+4, x+1, cc); S(c, by+4, x+3, cc); break
    case 'cheer':
      S(c, by-1, x, cc); S(c, by-1, x+1, cc); S(c, by-1, x+3, cc); S(c, by-1, x+4, cc)
      S(c, by, x, sc); S(c, by, x+4, sc)
      S(c, by+3, x, cc); S(c, by+3, x+1, cc); S(c, by+3, x+3, cc); S(c, by+3, x+4, cc)
      S(c, by+4, x, cc); S(c, by+4, x+4, cc); break
    case 'jump':
      S(c, by, x, sc); S(c, by, x+4, sc)
      S(c, by+3, x+1, cc); S(c, by+3, x+3, cc); break
    case 'sit':
      S(c, by+1, x, sc); S(c, by+1, x+4, sc)
      S(c, by, x, cc); S(c, by, x+4, cc)
      for (let col = x; col <= x+4; col++) S(c, y+6, col, T.white); break
    case 'bow':
      for (let col = x; col <= x+4; col++) S(c, by+1, col, cc)
      S(c, by+1, x+2, sc); S(c, by+1, x+1, ec); S(c, by+1, x+3, ec)
      S(c, by+3, x+1, cc); S(c, by+3, x+3, cc)
      S(c, by+4, x+1, cc); S(c, by+4, x+3, cc); break
    case 'type':
      S(c, by+1, x, sc); S(c, by+1, x+4, sc)
      S(c, by, x, cc); S(c, by, x+4, cc)
      S(c, by+2, x+4, sc)
      S(c, by+3, x+1, cc); S(c, by+3, x+3, cc)
      S(c, by+4, x+1, cc); S(c, by+4, x+3, cc); break
    case 'lie':
      for (let r = y; r <= y+7; r++) for (let col = x; col <= x+4; col++) S(c, r, col, 0)
      S(c, y+1, x, hc); S(c, y+1, x+1, hc); S(c, y+1, x+2, hc)
      S(c, y+2, x, hc); S(c, y+2, x+3, hc)
      S(c, y+1, x+3, sc); S(c, y+1, x+4, sc)
      S(c, y+2, x+1, sc); S(c, y+2, x+2, sc)
      S(c, y+1, x+3, ec)
      for (let col = x+5; col <= x+10; col++) { S(c, y+1, col, cc); S(c, y+2, col, cc) }
      S(c, y+3, x+8, cc); S(c, y+3, x+9, cc); break
    default: // stand
      S(c, by+3, x+1, cc); S(c, by+3, x+3, cc)
      S(c, by+4, x+1, cc); S(c, by+4, x+3, cc)
  }
}

// V12: 爱心（size=1大爱心，size=0小爱心）
function drawHeart(c: PixelFrame, y: number, x: number, ci: number, size?: number) {
  if (size === undefined) size = 1
  if (size === 1) {
    S(c, y, x+1, ci); S(c, y, x+2, ci); S(c, y, x+4, ci); S(c, y, x+5, ci)
    S(c, y+1, x, ci); S(c, y+1, x+3, ci); S(c, y+1, x+6, ci)
    S(c, y+2, x+1, ci); S(c, y+2, x+5, ci)
    S(c, y+3, x+2, ci); S(c, y+3, x+4, ci)
    S(c, y+4, x+3, ci)
  } else {
    S(c, y, x+1, ci); S(c, y, x+2, ci)
    S(c, y+1, x, ci); S(c, y+1, x+3, ci)
    S(c, y+2, x+1, ci); S(c, y+2, x+2, ci)
  }
}

function drawFlower(c: PixelFrame, y: number, x: number, petalC: number) {
  S(c, y, x, petalC); S(c, y, x+1, T.gold); S(c, y, x+2, petalC)
  S(c, y+1, x+1, T.teal)
}

function drawTree(c: PixelFrame, tx: number, ty: number) {
  S(c, ty+4, tx+1, T.brown); S(c, ty+5, tx+1, T.brown)
  S(c, ty, tx+1, T.teal); S(c, ty+1, tx, T.teal); S(c, ty+1, tx+1, T.teal); S(c, ty+1, tx+2, T.teal)
  S(c, ty+2, tx-1, T.teal); S(c, ty+2, tx, T.teal); S(c, ty+2, tx+1, T.teal); S(c, ty+2, tx+2, T.teal); S(c, ty+2, tx+3, T.teal)
  S(c, ty+3, tx, T.teal); S(c, ty+3, tx+1, T.teal); S(c, ty+3, tx+2, T.teal)
}

function drawCloud(c: PixelFrame, y: number, x: number, small?: boolean) {
  if (small) {
    S(c, y, x+1, T.white); S(c, y+1, x, T.white); S(c, y+1, x+1, T.white); S(c, y+1, x+2, T.white)
  } else {
    S(c, y, x+1, T.white); S(c, y, x+2, T.white)
    S(c, y+1, x, T.white); S(c, y+1, x+1, T.white); S(c, y+1, x+2, T.white); S(c, y+1, x+3, T.white)
  }
}

function drawBird(c: PixelFrame, y: number, x: number, frame: number) {
  if (frame === 0) {
    S(c, y, x, T.dark); S(c, y, x+1, T.dark); S(c, y+1, x+2, T.dark)
  } else {
    S(c, y+1, x, T.dark); S(c, y+1, x+1, T.dark); S(c, y, x+2, T.dark)
  }
}

// 小狗（尾巴摇摆动画：0=尾右，1=尾摆右，2=尾上/跳）
function drawDog(c: PixelFrame, dx: number, dy: number, ci: number, earC: number, tailWag: number) {
  const jy = tailWag === 2 ? -1 : 0
  const tx = tailWag === 1 ? 4 : (tailWag === 2 ? -1 : 4)
  S(c, dy+jy, dx, ci); S(c, dy+jy, dx+1, ci); S(c, dy+jy, dx+2, ci); S(c, dy+jy, dx+3, ci)
  S(c, dy-1+jy, dx+1, ci); S(c, dy-1+jy, dx+2, ci); S(c, dy-1+jy, dx+3, ci)
  S(c, dy-2+jy, dx, earC); S(c, dy-2+jy, dx+3, earC)
  S(c, dy-1+jy, dx+2, T.dark); S(c, dy-1+jy, dx+3, T.dark)
  S(c, dy-1+jy, dx+4, T.dark)
  S(c, dy+1+jy, dx, T.dark); S(c, dy+1+jy, dx+3, T.dark)
  S(c, dy+jy, dx+tx, ci)
}

function drawDiploma(c: PixelFrame, x: number, y: number) {
  for (let col = x; col <= x+3; col++) { S(c, y, col, T.white); S(c, y+1, col, T.white); S(c, y+2, col, T.white) }
  S(c, y+1, x+1, T.bright_red); S(c, y+1, x+2, T.gold)
}

function drawConfetti(c: PixelFrame, i: number, colors: number[]) {
  for (let j = 0; j < 8; j++) { S(c, 2+i+(j%2), 2+j*3, colors[(i+j)%colors.length]) }
}

// 额外辅助
function drawBed(c: PixelFrame, bx: number, by: number, bc: number) {
  for (let r = by; r <= by+3; r++) S(c, r, bx, T.gray)
  for (let col = bx+1; col <= bx+18; col++) { S(c, by+2, col, bc); S(c, by+3, col, bc) }
  S(c, by+1, bx+1, T.white); S(c, by+1, bx+2, T.white)
  S(c, by+2, bx+1, T.white); S(c, by+2, bx+2, T.white)
  S(c, by+4, bx, T.dark); S(c, by+4, bx+18, T.dark)
}

function drawTable(c: PixelFrame, tx: number, ty: number, topC: number, legC: number) {
  for (let col = tx; col <= tx+16; col++) S(c, ty, col, topC)
  S(c, ty+1, tx, legC); S(c, ty+1, tx+16, legC)
  S(c, ty+2, tx, legC); S(c, ty+2, tx+16, legC)
  S(c, ty+3, tx, T.dark); S(c, ty+3, tx+16, T.dark)
}

// ========== 人生里程碑事件（6帧动画） ==========

// 18岁 高考（先画人再画桌子遮挡，坐姿y=10）
function sceneGaokao(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach((fr) => {
    for (let r = 0; r < H; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.white)
    for (let r = 2; r <= 6; r++) for (let col = 5; col <= 18; col++) S(fr, r, col, T.dark)
    S(fr, 4, 9, T.white); S(fr, 4, 10, T.white); S(fr, 4, 11, T.white); S(fr, 4, 12, T.white)
    S(fr, 4, 13, T.white); S(fr, 4, 14, T.white)
    S(fr, 1, 21, T.white); S(fr, 1, 22, T.white); S(fr, 2, 21, T.white); S(fr, 2, 22, T.white)
    S(fr, 1, 21, T.dark)
    drawGround(fr, T.gray)
  })
  // 先画人物（坐姿y=10）
  drawPerson(f[0], 4, 10, T.hair_dark, T.skin, T.cloth_blue, 'front', 'sad', 'sit')
  drawPerson(f[0], 15, 10, T.hair_light, T.skin, T.cloth_red, 'front', 'surprised', 'sit')
  drawPerson(f[1], 4, 10, T.hair_dark, T.skin, T.cloth_blue, 'front', 'sad', 'sit')
  drawPerson(f[1], 15, 10, T.hair_light, T.skin, T.cloth_red, 'front', 'surprised', 'sit')
  drawPerson(f[2], 4, 10, T.hair_dark, T.skin, T.cloth_blue, 'front', 'normal', 'sit')
  drawPerson(f[2], 15, 10, T.hair_light, T.skin, T.cloth_red, 'front', 'happy', 'sit')
  drawPerson(f[3], 4, 10, T.hair_dark, T.skin, T.cloth_blue, 'front', 'happy', 'sit')
  drawPerson(f[3], 15, 10, T.hair_light, T.skin, T.cloth_red, 'front', 'happy', 'cheer')
  // 再画课桌（遮挡下半身）桌面y=14
  f.forEach((fr, i) => {
    if (i < 4) {
      for (let col = 3; col <= 10; col++) { S(fr, 14, col, T.brown); S(fr, 15, col, T.brown) }
      for (let col = 14; col <= 21; col++) { S(fr, 14, col, T.brown); S(fr, 15, col, T.brown) }
      S(fr, 16, 4, T.dark); S(fr, 16, 9, T.dark); S(fr, 16, 15, T.dark); S(fr, 16, 20, T.dark)
    }
  })
  // 金榜题名（后两帧金色背景庆祝）
  for (let r = 0; r < H; r++) for (let col = 0; col < W; col++) { S(f[4], r, col, T.gold); S(f[5], r, col, T.gold) }
  drawPerson(f[4], 9, 11, T.hair_dark, T.skin, T.cloth_red, 'front', 'happy', 'cheer')
  drawPerson(f[5], 9, 10, T.hair_dark, T.skin, T.cloth_red, 'front', 'happy', 'jump')
  drawDiploma(f[4], 11, 11); drawDiploma(f[5], 11, 11)
  S(f[4], 4, 5, T.bright_red); S(f[4], 4, 18, T.bright_red); S(f[5], 3, 7, T.bright_red); S(f[5], 5, 16, T.bright_red)
  return f
}

// 22岁 大学毕业（两侧立柱+顶部横幅，不框住人物）
function sceneGraduate(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach((fr) => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.sky)
    drawGround(fr, T.theme)
    // 两侧校门立柱（不连横梁）
    for (let r = 4; r <= 14; r++) { S(fr, r, 1, T.brown); S(fr, r, 2, T.brown); S(fr, r, 21, T.brown); S(fr, r, 22, T.brown) }
    S(fr, 3, 1, T.brown); S(fr, 3, 2, T.brown); S(fr, 3, 21, T.brown); S(fr, 3, 22, T.brown)
    // 顶部横幅（红色，在人物上方）
    for (let col = 3; col <= 20; col++) S(fr, 3, col, T.bright_red)
    S(fr, 3, 10, T.white); S(fr, 3, 11, T.white); S(fr, 3, 12, T.white); S(fr, 3, 13, T.white)
    drawCloud(fr, 1, 5, true); drawCloud(fr, 2, 17, false)
  })
  // 人站在草地上 y=11
  drawPerson(f[0], 9, 11, T.hair_dark, T.skin, T.dark, 'front', 'happy', 'cheer')
  drawPerson(f[1], 9, 10, T.hair_dark, T.skin, T.dark, 'front', 'happy', 'jump')
  drawPerson(f[2], 9, 11, T.hair_dark, T.skin, T.dark, 'front', 'happy', 'cheer')
  drawPerson(f[3], 9, 10, T.hair_dark, T.skin, T.dark, 'front', 'happy', 'jump')
  drawPerson(f[4], 9, 11, T.hair_dark, T.skin, T.dark, 'front', 'happy', 'cheer')
  drawPerson(f[5], 9, 10, T.hair_dark, T.skin, T.dark, 'front', 'happy', 'jump')
  // 学士帽飞起来
  S(f[0], 8, 10, T.dark); S(f[0], 8, 13, T.dark)
  S(f[1], 6, 10, T.dark); S(f[1], 6, 13, T.dark)
  S(f[2], 7, 9, T.dark); S(f[2], 7, 14, T.dark)
  S(f[3], 5, 10, T.dark); S(f[3], 5, 13, T.dark)
  S(f[4], 8, 10, T.dark); S(f[4], 8, 13, T.dark)
  S(f[5], 6, 10, T.dark); S(f[5], 6, 13, T.dark)
  S(f[0], 8, 11, T.bright_red); S(f[2], 7, 10, T.bright_red); S(f[4], 8, 12, T.gold)
  drawDiploma(f[0], 9, 11); drawDiploma(f[2], 9, 11); drawDiploma(f[4], 9, 11)
  const colors = [T.bright_red, T.gold, T.cloth_blue, T.purple]
  f.forEach((fr, i) => drawConfetti(fr, i, colors))
  return f
}

// 入职第一天（先画人再画桌子遮挡，坐姿y=10）
function sceneFirstJob(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.white)
    for (let r = 2; r <= 8; r++) for (let col = 10; col <= 20; col++) S(fr, r, col, T.sky)
    for (let col = 10; col <= 20; col++) { S(fr, 2, col, T.brown); S(fr, 8, col, T.brown) }
    drawGround(fr, T.theme)
  })
  // 先画人物（坐姿y=10）
  drawPerson(f[0], 2, 10, T.hair_dark, T.skin, T.white, 'right', 'surprised', 'sit')
  drawPerson(f[1], 2, 10, T.hair_dark, T.skin, T.white, 'right', 'happy', 'sit')
  drawPerson(f[2], 2, 10, T.hair_dark, T.skin, T.white, 'right', 'happy', 'type')
  drawPerson(f[3], 2, 10, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'type')
  S(f[0], 10, 6, T.gold); S(f[0], 11, 6, T.gold)
  // 再画桌子和显示器
  f.forEach((fr, i) => {
    drawDesk(fr, 1, 22, 14, T.brown, T.brown)
    drawMonitor(fr, 13, 11, i < 2 ? T.dark : (i === 2 ? T.cloth_blue : T.teal), T.dark)
  })
  drawCup(f[2], 8, 12, T.cloth_blue); drawCup(f[3], 8, 12, T.cloth_blue)
  S(f[3], 6, 14, T.bright_red); S(f[3], 6, 15, T.bright_red); S(f[3], 6, 16, T.bright_red)
  return f
}

// 第一次发工资
function sceneFirstSalary(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => drawGround(fr, T.gold))
  drawPerson(f[0], 9, 11, T.hair_dark, T.skin, T.cloth_blue, 'front', 'surprised', 'cheer')
  drawPerson(f[1], 9, 10, T.hair_dark, T.skin, T.cloth_blue, 'front', 'happy', 'jump')
  drawPerson(f[2], 9, 11, T.hair_dark, T.skin, T.cloth_blue, 'front', 'happy', 'cheer')
  drawPerson(f[3], 9, 10, T.hair_dark, T.skin, T.cloth_blue, 'front', 'happy', 'jump')
  drawPerson(f[4], 9, 11, T.hair_dark, T.skin, T.cloth_blue, 'front', 'happy', 'cheer')
  drawPerson(f[5], 9, 10, T.hair_dark, T.skin, T.cloth_blue, 'front', 'happy', 'jump')
  const moneyColors = [T.gold, T.bright_red, T.white]
  for (let i = 0; i < 6; i++) {
    const fr = f[i]
    for (let j = 0; j < 10; j++) { S(fr, 1+i*2+j%3, 2+j*2, moneyColors[j%3]) }
    S(fr, 10, 11, T.gold); S(fr, 10, 12, T.gold); S(fr, 11, 11, T.gold); S(fr, 11, 12, T.gold); S(fr, 9, 11, T.brown); S(fr, 9, 12, T.brown)
  }
  return f
}

// 买房
function sceneBuyHouse(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach((fr) => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.sky)
    drawGround(fr, T.theme)
    drawSmallHouse(fr, 2, 5, T.cloth_red, T.skin)
    drawTree(fr, 18, 8)
    drawFlower(fr, 17, 6, T.bright_red); drawFlower(fr, 17, 12, T.gold)
    drawCloud(fr, 2, 14, true)
  })
  drawPerson(f[0], 16, 11, T.hair_dark, T.skin, T.cloth_blue, 'left', 'happy', 'walk1')
  drawPerson(f[1], 14, 11, T.hair_dark, T.skin, T.cloth_blue, 'left', 'happy', 'walk2')
  drawPerson(f[2], 12, 11, T.hair_dark, T.skin, T.cloth_blue, 'left', 'happy', 'walk1')
  drawPerson(f[3], 10, 11, T.hair_dark, T.skin, T.cloth_blue, 'left', 'happy', 'armsup')
  drawPerson(f[4], 9, 10, T.hair_dark, T.skin, T.cloth_blue, 'left', 'happy', 'jump')
  drawPerson(f[5], 9, 11, T.hair_dark, T.skin, T.cloth_blue, 'left', 'happy', 'cheer')
  S(f[3], 7, 13, T.gold); S(f[3], 8, 13, T.gold); S(f[3], 7, 12, T.white); S(f[3], 8, 12, T.white)
  S(f[4], 6, 13, T.gold); S(f[4], 7, 12, T.white); S(f[4], 8, 14, T.gold)
  S(f[5], 5, 11, T.bright_red); S(f[5], 7, 15, T.gold)
  drawBird(f[0], 1, 10, 0); drawBird(f[1], 1, 12, 1); drawBird(f[2], 1, 14, 0); drawBird(f[3], 1, 16, 1)
  drawBird(f[4], 2, 8, 0); drawBird(f[5], 2, 18, 1)
  return f
}

// 买车
function sceneBuyCar(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach((fr) => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.sky)
    drawGround(fr, T.gray)
    drawCloud(fr, 3, 4, true); drawCloud(fr, 5, 15, false)
  })
  drawPerson(f[0], 3, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'surprised', 'stand')
  drawPerson(f[1], 3, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'stand')
  drawPerson(f[2], 3, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'stand')
  drawPerson(f[3], 3, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'cheer')
  drawPerson(f[4], 3, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'cheer')
  drawPerson(f[5], 3, 10, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'jump')
  drawCar(f[0], 17, 14, T.cloth_red)
  drawCar(f[1], 14, 14, T.cloth_red)
  drawCar(f[2], 11, 13, T.cloth_red)
  drawCar(f[3], 8, 13, T.cloth_red)
  drawCar(f[4], 8, 13, T.cloth_red)
  drawCar(f[5], 8, 13, T.cloth_red)
  S(f[4], 5, 10, T.gold); S(f[5], 4, 9, T.bright_red); S(f[5], 6, 16, T.gold)
  return f
}

// 结婚
function sceneWedding(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    drawGround(fr, T.skin)
    for (let col = 3; col <= 20; col++) S(fr, 3, col, T.bright_red)
    for (let r = 0; r <= 3; r++) { S(fr, r, 3, T.bright_red); S(fr, r, 20, T.bright_red) }
  })
  const acts: [string, string][] = [['cheer','cheer'],['armsup','armsup'],['cheer','cheer'],['jump','jump'],['cheer','cheer'],['jump','jump']]
  const ys: [number, number][] = [[11,11],[11,11],[11,11],[10,10],[11,11],[10,10]]
  const heartPos: [number, number][] = [[5,9],[4,9],[5,9],[6,9],[5,9],[4,9]]
  f.forEach((fr, i) => {
    drawHeart(fr, heartPos[i][0], heartPos[i][1], i%2 ? T.gold : T.bright_red)
    drawPerson(fr, 6, ys[i][0], T.hair_light, T.skin, T.cloth_blue, 'right', 'happy', acts[i][0] as any)
    drawPerson(fr, 13, ys[i][1], T.hair_dark, T.skin, T.white, 'left', 'happy', acts[i][1] as any)
  })
  const confettiColors = [T.bright_red, T.gold, T.cloth_blue, T.purple, T.teal]
  f.forEach((fr, i) => drawConfetti(fr, i, confettiColors))
  return f
}

// 生子
function sceneBaby(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.sky)
    drawGround(fr, T.theme)
    drawSmallHouse(fr, 8, 4, T.cloth_red, T.skin)
  })
  drawPerson(f[0], 2, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'stand')
  drawPerson(f[0], 18, 11, T.hair_dark, T.skin, T.purple, 'left', 'happy', 'cheer')
  drawPerson(f[1], 2, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'stand')
  drawPerson(f[1], 18, 11, T.hair_dark, T.skin, T.purple, 'left', 'happy', 'armsup')
  drawPerson(f[2], 2, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'armsup')
  drawPerson(f[2], 18, 11, T.hair_dark, T.skin, T.purple, 'left', 'happy', 'cheer')
  drawPerson(f[3], 2, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'cheer')
  drawPerson(f[3], 18, 11, T.hair_dark, T.skin, T.purple, 'left', 'happy', 'jump')
  drawPerson(f[4], 2, 10, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'jump')
  drawPerson(f[4], 18, 10, T.hair_dark, T.skin, T.purple, 'left', 'happy', 'jump')
  drawPerson(f[5], 2, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'cheer')
  drawPerson(f[5], 18, 11, T.hair_dark, T.skin, T.purple, 'left', 'happy', 'cheer')
  const babyX = 10, babyY = 14
  f.forEach((fr, i) => {
    const by = i%2 === 0 ? 0 : -1
    S(fr, babyY+by, babyX, T.hair_light); S(fr, babyY+by, babyX+1, T.hair_light)
    S(fr, babyY+1+by, babyX, T.skin); S(fr, babyY+1+by, babyX+1, T.skin)
    S(fr, babyY+1+by, babyX, T.dark); S(fr, babyY+1+by, babyX+1, T.dark)
    S(fr, babyY+2+by, babyX-1, T.skin); S(fr, babyY+2+by, babyX, T.skin); S(fr, babyY+2+by, babyX+1, T.skin); S(fr, babyY+2+by, babyX+2, T.skin)
    for (let col = babyX-2; col <= babyX+3; col++) S(fr, babyY+3+by, col, T.white)
  })
  drawHeart(f[0], 11, 12, T.bright_red, 0); drawHeart(f[2], 11, 12, T.gold, 0)
  drawHeart(f[4], 10, 11, T.bright_red); drawHeart(f[5], 12, 13, T.gold, 0)
  S(f[4], 4, 5, T.bright_red); S(f[4], 4, 18, T.gold); S(f[5], 3, 7, T.gold); S(f[5], 5, 16, T.bright_red)
  return f
}

// 升职加薪
function scenePromotion(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => drawGround(fr, T.bright_red))
  drawPerson(f[0], 9, 11, T.gold, T.skin, T.cloth_blue, 'front', 'happy', 'cheer')
  drawPerson(f[1], 9, 10, T.gold, T.skin, T.cloth_blue, 'front', 'happy', 'jump')
  drawPerson(f[2], 9, 11, T.gold, T.skin, T.cloth_blue, 'front', 'happy', 'cheer')
  drawPerson(f[3], 9, 10, T.gold, T.skin, T.cloth_blue, 'front', 'happy', 'jump')
  drawPerson(f[4], 9, 11, T.gold, T.skin, T.cloth_blue, 'front', 'happy', 'cheer')
  drawPerson(f[5], 9, 10, T.gold, T.skin, T.cloth_blue, 'front', 'happy', 'jump')
  const colors = [T.bright_red, T.gold, T.cloth_blue, T.purple, T.teal, T.skin]
  f.forEach((fr, i) => drawConfetti(fr, i, colors))
  return f
}

// 退休（灰发T.gray=14）
function sceneRetire(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < 4; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.bright_red)
    S(fr, 2, 6, T.gold); S(fr, 2, 7, T.gold); S(fr, 2, 9, T.gold); S(fr, 2, 10, T.gold)
    S(fr, 2, 12, T.gold); S(fr, 2, 13, T.gold); S(fr, 2, 15, T.gold); S(fr, 2, 16, T.gold)
    drawGround(fr, T.theme)
    drawDesk(fr, 5, 18, 14, T.brown, T.brown)
  })
  drawPerson(f[0], 9, 11, T.gray, T.skin, T.cloth_blue, 'front', 'happy', 'cheer')
  drawPerson(f[1], 9, 10, T.gray, T.skin, T.cloth_blue, 'front', 'happy', 'jump')
  drawPerson(f[2], 9, 11, T.gray, T.skin, T.cloth_blue, 'front', 'happy', 'cheer')
  drawPerson(f[3], 9, 10, T.gray, T.skin, T.cloth_blue, 'front', 'happy', 'jump')
  drawPerson(f[4], 9, 11, T.gray, T.skin, T.cloth_blue, 'front', 'happy', 'cheer')
  drawPerson(f[5], 9, 10, T.gray, T.skin, T.cloth_blue, 'front', 'happy', 'jump')
  f.forEach(fr => { drawCup(fr, 10, 12, T.cloth_blue); drawCup(fr, 13, 12, T.cloth_blue) })
  const colors = [T.bright_red, T.gold, T.cloth_blue, T.purple, T.teal]
  f.forEach((fr, i) => drawConfetti(fr, i, colors))
  return f
}

// 暮年/夕阳（灰发）
function sceneSunset(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < 4; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.bright_red)
    for (let r = 4; r <= 9; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.gold)
    for (let r = 4; r <= 8; r++) for (let col = 9; col <= 14; col++) S(fr, r, col, T.bright_red)
    S(fr, 5, 10, T.gold); S(fr, 5, 13, T.gold); S(fr, 6, 11, T.skin); S(fr, 6, 12, T.skin)
    drawGround(fr, T.gold)
  })
  drawPerson(f[0], 6, 11, T.gray, T.skin, T.cloth_blue, 'right', 'happy', 'sit')
  drawPerson(f[1], 6, 11, T.gray, T.skin, T.cloth_blue, 'right', 'happy', 'sit')
  drawPerson(f[2], 6, 11, T.gray, T.skin, T.cloth_blue, 'right', 'happy', 'sit')
  drawPerson(f[3], 6, 11, T.gray, T.skin, T.cloth_blue, 'right', 'happy', 'sit')
  drawPerson(f[0], 13, 11, T.gray, T.skin, T.cloth_red, 'left', 'happy', 'sit')
  drawPerson(f[1], 13, 11, T.gray, T.skin, T.cloth_red, 'left', 'happy', 'sit')
  drawPerson(f[2], 13, 11, T.gray, T.skin, T.cloth_red, 'left', 'happy', 'sit')
  drawPerson(f[3], 13, 11, T.gray, T.skin, T.cloth_red, 'left', 'happy', 'sit')
  drawHeart(f[0], 11, 9, T.bright_red, 1); drawHeart(f[2], 11, 9, T.gold, 1)
  return f
}

// ========== 路径专属关键事件 ==========

// 创业起步（车库创业，深色背景金头发）
function sceneStartup(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < H; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.dark)
    drawGround(fr, T.gray)
    drawDesk(fr, 1, 11, 14, T.brown, T.brown)
    for (let r = 2; r <= 6; r++) for (let col = 14; col <= 22; col++) S(fr, r, col, T.white)
  })
  // 先画人
  drawPerson(f[0], 2, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'surprised', 'type')
  drawPerson(f[1], 2, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'type')
  drawPerson(f[2], 2, 11, T.gold, T.skin, T.cloth_blue, 'right', 'happy', 'cheer')
  drawPerson(f[3], 2, 11, T.gold, T.skin, T.cloth_blue, 'right', 'happy', 'cheer')
  S(f[2], 4, 18, T.bright_red); S(f[2], 3, 19, T.bright_red); S(f[2], 3, 20, T.bright_red); S(f[2], 2, 21, T.bright_red)
  S(f[3], 4, 18, T.bright_red); S(f[3], 3, 19, T.bright_red); S(f[3], 3, 20, T.bright_red); S(f[3], 2, 21, T.bright_red)
  S(f[3], 4, 17, T.gold); S(f[3], 5, 17, T.gold)
  // 再画桌子和显示器
  f.forEach((fr, i) => {
    drawMonitor(fr, 5, 11, i < 2 ? T.dark : (i === 2 ? T.cloth_blue : T.teal), T.gray)
  })
  return f
}

// 创业上市敲钟
function sceneIPO(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < 5; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.bright_red)
    drawGround(fr, T.gold)
  })
  f.forEach((fr) => {
    const cy = 7
    S(fr, cy, 11, T.gold); S(fr, cy, 12, T.gold); S(fr, cy, 13, T.gold)
    S(fr, cy+1, 10, T.gold); S(fr, cy+1, 11, T.gold); S(fr, cy+1, 12, T.gold); S(fr, cy+1, 13, T.gold); S(fr, cy+1, 14, T.gold)
    S(fr, cy+2, 11, T.gold); S(fr, cy+2, 12, T.gold); S(fr, cy+2, 13, T.gold)
    S(fr, cy+3, 12, T.brown)
  })
  drawPerson(f[0], 3, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'cheer')
  drawPerson(f[0], 17, 11, T.hair_light, T.skin, T.white, 'left', 'happy', 'cheer')
  drawPerson(f[1], 3, 10, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'jump')
  drawPerson(f[1], 17, 10, T.hair_light, T.skin, T.white, 'left', 'happy', 'jump')
  drawPerson(f[2], 3, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'cheer')
  drawPerson(f[2], 17, 11, T.hair_light, T.skin, T.white, 'left', 'happy', 'cheer')
  drawPerson(f[3], 3, 10, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'jump')
  drawPerson(f[3], 17, 10, T.hair_light, T.skin, T.white, 'left', 'happy', 'jump')
  drawPerson(f[4], 3, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'cheer')
  drawPerson(f[4], 17, 11, T.hair_light, T.skin, T.white, 'left', 'happy', 'cheer')
  drawPerson(f[5], 3, 10, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'jump')
  drawPerson(f[5], 17, 10, T.hair_light, T.skin, T.white, 'left', 'happy', 'jump')
  const colors = [T.bright_red, T.gold, T.cloth_blue, T.purple, T.teal, T.skin]
  f.forEach((fr, i) => drawConfetti(fr, i, colors))
  return f
}

// AI数字永生（深色背景）
function sceneDigitalImmortality(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < H; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.dark)
    for (let r = 0; r < H; r++) { S(fr, r, 0, T.teal); S(fr, r, 23, T.teal) }
    for (let col = 0; col < W; col++) { S(fr, 0, col, T.teal); S(fr, 19, col, T.teal) }
  })
  drawPerson(f[0], 9, 11, T.hair_dark, T.skin, T.cloth_blue, 'front', 'surprised', 'stand')
  drawPerson(f[1], 9, 11, T.hair_dark, T.skin, T.cloth_blue, 'front', 'happy', 'stand')
  drawPerson(f[2], 9, 11, T.teal, T.skin, T.teal, 'front', 'happy', 'stand')
  drawPerson(f[3], 9, 11, T.gold, T.skin, T.gold, 'front', 'happy', 'cheer')
  const pts: [number[], number[], number[], number[]] = [[5,8,16],[7,6,18],[4,10,14],[6,4,20]]
  pts.forEach((p, i) => {
    const fr = f[i]
    p.forEach(pp => { S(fr, 3+i, pp, T.teal); S(fr, 7+i, pp, T.gold); S(fr, 11-i, pp, T.cloth_blue) })
  })
  S(f[0], 2, 3, T.bright_red); S(f[0], 2, 20, T.gold)
  S(f[1], 4, 5, T.gold); S(f[1], 4, 18, T.bright_red)
  S(f[2], 2, 7, T.bright_red); S(f[2], 2, 16, T.gold)
  S(f[3], 5, 3, T.gold); S(f[3], 5, 20, T.bright_red)
  return f
}

// 财务自由FIRE（沙滩度假）
function sceneFIRE(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach((fr) => {
    for (let r = 0; r < 14; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.sky)
    for (let r = 14; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.gold)
    drawGround(fr, T.theme)
    S(fr, 14, 2, T.brown); S(fr, 15, 2, T.brown); S(fr, 16, 2, T.brown)
    S(fr, 12, 1, T.teal); S(fr, 12, 2, T.teal); S(fr, 12, 3, T.teal); S(fr, 13, 1, T.teal); S(fr, 13, 3, T.teal)
  })
  drawPerson(f[0], 8, 10, T.hair_dark, T.skin, T.cloth_red, 'right', 'happy', 'lie')
  drawPerson(f[1], 8, 10, T.hair_dark, T.skin, T.cloth_red, 'right', 'happy', 'lie')
  drawPerson(f[2], 8, 10, T.hair_dark, T.skin, T.cloth_red, 'right', 'happy', 'lie')
  drawPerson(f[3], 8, 10, T.hair_dark, T.skin, T.cloth_red, 'right', 'happy', 'lie')
  drawPerson(f[4], 8, 10, T.hair_dark, T.skin, T.cloth_red, 'right', 'happy', 'lie')
  drawPerson(f[5], 8, 10, T.hair_dark, T.skin, T.cloth_red, 'right', 'happy', 'lie')
  f.forEach((fr, i) => {
    const sx = 18 + (i%2 ? 1 : 0)
    S(fr, 2, sx, T.gold); S(fr, 2, sx+1, T.gold); S(fr, 3, sx, T.gold); S(fr, 3, sx+1, T.gold)
    S(fr, 1, sx, T.gold); S(fr, 4, sx+1, T.gold)
  })
  f.forEach((fr, i) => { if (i%2 === 0) drawCup(fr, 15, 12, T.cloth_blue) })
  return f
}

// ========== 负面事件 ==========

// 离婚（深色背景，背向走开）
function sceneDivorce(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < H; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.dark)
    drawGround(fr, T.gray)
  })
  drawPerson(f[0], 3, 11, T.gold, T.skin, T.cloth_blue, 'right', 'sad', 'walk1')
  drawPerson(f[0], 18, 11, T.gold, T.skin, T.cloth_red, 'left', 'sad', 'walk1')
  drawPerson(f[1], 2, 11, T.gold, T.skin, T.cloth_blue, 'right', 'sad', 'walk2')
  drawPerson(f[1], 19, 11, T.gold, T.skin, T.cloth_red, 'left', 'sad', 'walk2')
  drawPerson(f[2], 1, 11, T.gold, T.skin, T.cloth_blue, 'back', 'sad', 'walk1')
  drawPerson(f[2], 20, 11, T.gold, T.skin, T.cloth_red, 'back', 'sad', 'walk1')
  drawPerson(f[3], 0, 11, T.gold, T.skin, T.cloth_blue, 'back', 'sad', 'walk2')
  drawPerson(f[3], 21, 11, T.gold, T.skin, T.cloth_red, 'back', 'sad', 'walk2')
  S(f[2], 5, 11, T.bright_red); S(f[2], 5, 13, T.bright_red)
  return f
}

// 分手（灰色背景，心碎）
function sceneBreakup(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.gray)
    drawGround(fr, T.gray)
    S(fr, 2, 8, T.white); S(fr, 2, 9, T.white); S(fr, 3, 7, T.white); S(fr, 3, 10, T.white)
  })
  drawPerson(f[0], 5, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'sad', 'stand')
  drawPerson(f[0], 16, 11, T.hair_light, T.skin, T.cloth_red, 'left', 'sad', 'stand')
  drawPerson(f[1], 5, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'sad', 'stand')
  drawPerson(f[1], 16, 11, T.hair_light, T.skin, T.cloth_red, 'left', 'sad', 'stand')
  drawPerson(f[2], 5, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'sad', 'bow')
  drawPerson(f[2], 16, 11, T.hair_light, T.skin, T.cloth_red, 'left', 'sad', 'bow')
  drawPerson(f[3], 5, 11, T.hair_dark, T.skin, T.cloth_blue, 'back', 'sad', 'stand')
  drawPerson(f[3], 16, 11, T.hair_light, T.skin, T.cloth_red, 'back', 'sad', 'stand')
  return f
}

// 父母生病（病床边）
function sceneParentSick(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < H; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.white)
    for (let col = 3; col <= 21; col++) { S(fr, 12, col, T.white); S(fr, 13, col, T.white) }
    S(fr, 14, 3, T.dark); S(fr, 14, 21, T.dark)
  })
  f.forEach(fr => {
    S(fr, 10, 5, T.brown); S(fr, 10, 6, T.brown); S(fr, 10, 7, T.brown)
    S(fr, 11, 5, T.brown); S(fr, 11, 8, T.brown)
    S(fr, 10, 8, T.skin); S(fr, 10, 9, T.skin); S(fr, 11, 6, T.skin); S(fr, 11, 7, T.skin)
    S(fr, 10, 8, T.dark)
    for (let col = 10; col <= 18; col++) { S(fr, 10, col, T.white); S(fr, 11, col, T.white) }
    S(fr, 9, 8, T.gray); S(fr, 9, 9, T.gray); S(fr, 9, 10, T.gray)
  })
  drawPerson(f[0], 19, 11, T.hair_dark, T.skin, T.cloth_blue, 'left', 'sad', 'stand')
  drawPerson(f[1], 19, 11, T.hair_dark, T.skin, T.cloth_blue, 'left', 'sad', 'stand')
  drawPerson(f[2], 19, 11, T.hair_dark, T.skin, T.cloth_blue, 'left', 'sad', 'bow')
  drawPerson(f[3], 19, 11, T.hair_dark, T.skin, T.cloth_blue, 'left', 'sad', 'bow')
  return f
}

// 破产（深色背景，飘落的纸）
function sceneBankruptcy(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < H; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.dark)
    drawGround(fr, T.dark)
  })
  drawPerson(f[0], 9, 11, T.gold, T.skin, T.gray, 'front', 'sad', 'stand')
  drawPerson(f[1], 9, 11, T.gold, T.skin, T.gray, 'front', 'sad', 'bow')
  drawPerson(f[2], 9, 11, T.gold, T.skin, T.gray, 'front', 'sad', 'stand')
  drawPerson(f[3], 9, 11, T.gold, T.skin, T.gray, 'front', 'sad', 'bow')
  f.forEach((fr, i) => {
    const off = i%2
    S(fr, 15, 5+off, T.white); S(fr, 15, 6+off, T.white); S(fr, 16, 5+off, T.white)
    S(fr, 16, 15-off, T.white); S(fr, 17, 14-off, T.white); S(fr, 17, 16-off, T.white)
    S(fr, 4, 3+off, T.bright_red); S(fr, 5, 18+off, T.bright_red)
  })
  return f
}

// 搬家（搬箱子走向火车）
function sceneMove(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach((fr, i) => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, i%2 ? T.sky : T.white)
    drawGround(fr, T.gray)
  })
  // 火车在右边
  f.forEach((fr) => {
    for (let col = 12; col <= 23; col++) S(fr, 10, col, T.dark)
    for (let col = 12; col <= 23; col++) { S(fr, 11, col, T.cloth_blue); S(fr, 12, col, T.cloth_blue) }
    S(fr, 11, 14, T.sky); S(fr, 11, 15, T.sky); S(fr, 11, 16, T.sky)
    S(fr, 11, 19, T.sky); S(fr, 11, 20, T.sky); S(fr, 11, 21, T.sky)
    for (let col = 12; col <= 23; col++) S(fr, 13, col, T.dark)
    S(fr, 14, 13, T.dark); S(fr, 14, 14, T.dark); S(fr, 14, 21, T.dark); S(fr, 14, 22, T.dark)
    S(fr, 9, 22, T.gold)
  })
  drawPerson(f[0], 3, 11, T.hair_dark, T.skin, T.white, 'right', 'normal', 'walk1')
  drawPerson(f[1], 5, 11, T.hair_dark, T.skin, T.white, 'right', 'happy', 'walk2')
  drawPerson(f[2], 7, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'walk1')
  drawPerson(f[3], 9, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'cheer')
  // 抱箱子
  f.forEach((fr, i) => {
    const bx = 1+i*2
    for (let r = 8; r <= 11; r++) for (let col = bx; col <= bx+3; col++) S(fr, r, col, T.brown)
    S(fr, 9, bx+1, T.gold); S(fr, 10, bx+2, T.gold)
  })
  S(f[2], 10, 5, T.bright_red); S(f[2], 9, 6, T.bright_red); S(f[2], 10, 7, T.bright_red)
  S(f[3], 10, 5, T.gold); S(f[3], 9, 6, T.gold); S(f[3], 10, 7, T.gold)
  return f
}

// 中彩票
function sceneLottery(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => drawGround(fr, T.gold))
  drawPerson(f[0], 9, 11, T.hair_dark, T.skin, T.cloth_blue, 'front', 'surprised', 'cheer')
  drawPerson(f[1], 9, 10, T.hair_dark, T.skin, T.cloth_blue, 'front', 'happy', 'jump')
  drawPerson(f[2], 9, 11, T.hair_dark, T.skin, T.cloth_blue, 'front', 'happy', 'cheer')
  drawPerson(f[3], 9, 10, T.hair_dark, T.skin, T.cloth_blue, 'front', 'happy', 'jump')
  const mc = [T.gold, T.bright_red, T.white]
  for (let i = 0; i < 4; i++) { for (let j = 0; j < 8; j++) S(f[i], 1+i+j%3, 2+j*3, mc[j%3]) }
  S(f[3], 5, 5, T.bright_red); S(f[3], 6, 6, T.gold)
  return f
}

// 借钱不还
function sceneLendMoney(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach((fr) => {
    for (let r = 0; r < H; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.white)
    for (let col = 0; col < W; col++) { S(fr, 18, col, T.gray); S(fr, 19, col, T.dark) }
  })
  drawPerson(f[0], 4, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'sad', 'bow')
  drawPerson(f[0], 15, 11, T.hair_dark, T.skin, T.cloth_red, 'left', 'sad', 'stand')
  S(f[0], 9, 9, T.gold); S(f[0], 9, 10, T.gold); S(f[0], 10, 9, T.gold); S(f[0], 10, 10, T.gold)
  S(f[0], 9, 9, T.dark)
  S(f[1], 6, 13, T.dark); S(f[1], 7, 13, T.dark); S(f[1], 8, 13, T.dark); S(f[1], 8, 14, T.dark); S(f[1], 7, 15, T.dark)
  drawPerson(f[2], 4, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'stand')
  drawPerson(f[2], 15, 11, T.hair_dark, T.skin, T.cloth_red, 'left', 'sad', 'stand')
  S(f[2], 9, 7, T.gold); S(f[2], 9, 8, T.gold)
  drawPerson(f[3], 15, 11, T.hair_dark, T.skin, T.cloth_red, 'front', 'sad', 'stand')
  S(f[3], 13, 13, T.skin); S(f[3], 14, 13, T.skin); S(f[3], 13, 14, T.skin); S(f[3], 14, 14, T.skin)
  S(f[3], 13, 13, T.dark)
  return f
}

// 倦怠期（趴在桌上，乌云雨滴）
function sceneBurnout(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach((fr) => {
    for (let r = 0; r < H; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.gray)
    for (let col = 0; col < W; col++) { S(fr, 18, col, T.dark); S(fr, 19, col, T.dark) }
  })
  // 先画人（坐姿y=10）
  drawPerson(f[0], 9, 10, T.hair_dark, T.skin, T.cloth_blue, 'front', 'sad', 'sit')
  drawPerson(f[1], 9, 10, T.hair_dark, T.skin, T.cloth_blue, 'front', 'sad', 'sit')
  drawPerson(f[2], 9, 10, T.hair_dark, T.skin, T.cloth_blue, 'front', 'sad', 'sit')
  drawPerson(f[3], 9, 10, T.hair_dark, T.skin, T.cloth_blue, 'front', 'sad', 'sit')
  // 再画桌子
  f.forEach((fr) => {
    for (let col = 5; col < 19; col++) S(fr, 14, col, T.brown)
    for (let col = 5; col < 19; col++) S(fr, 15, col, T.brown)
    S(fr, 15, 6, T.dark); S(fr, 15, 18, T.dark)
    for (let r = 16; r < 18; r++) { S(fr, r, 6, T.brown); S(fr, r, 18, T.brown) }
  })
  // 散落文件/空咖啡杯
  S(f[0], 13, 7, T.white); S(f[0], 13, 8, T.white); S(f[0], 12, 16, T.white)
  S(f[0], 13, 16, T.brown); S(f[0], 13, 17, T.brown)
  // 乌云
  S(f[0], 2, 8, T.dark); S(f[0], 2, 9, T.dark); S(f[0], 2, 10, T.dark); S(f[0], 2, 11, T.dark); S(f[0], 3, 9, T.dark); S(f[0], 3, 10, T.dark)
  // 雨滴
  S(f[1], 4, 8, T.sky); S(f[1], 5, 9, T.sky); S(f[1], 4, 10, T.sky); S(f[1], 5, 11, T.sky)
  S(f[2], 5, 8, T.sky); S(f[2], 4, 9, T.sky); S(f[2], 5, 10, T.sky); S(f[2], 4, 11, T.sky)
  // Zzz
  S(f[3], 4, 12, T.dark); S(f[3], 4, 13, T.dark); S(f[3], 3, 14, T.dark); S(f[3], 3, 15, T.dark)
  return f
}

// ========== 日常场景 ==========

// 熬夜带娃（深夜喂奶，深色背景金头发）
function sceneMidnightBaby(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < H; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.dark)
    drawGround(fr, T.gray, 16)
    for (let col = 10; col <= 20; col++) S(fr, 13, col, T.white)
    drawPerson(fr, 1, 9, T.gold, T.skin, T.cloth_blue, 'right', 'surprised', 'sit')
  })
  S(f[0], 13, 13, T.skin); S(f[0], 13, 14, T.skin); S(f[0], 13, 13, T.dark); S(f[0], 13, 14, T.dark)
  S(f[1], 13, 13, T.skin); S(f[1], 13, 14, T.skin); S(f[1], 13, 13, T.dark); S(f[1], 13, 14, T.dark)
  S(f[1], 12, 12, T.skin); S(f[1], 12, 15, T.skin)
  S(f[0], 4, 20, T.white); S(f[1], 3, 18, T.bright_red); S(f[1], 4, 19, T.bright_red)
  return f
}

// 日常工作（先画人再画桌子，坐姿y=10）
function sceneWork(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.white)
    drawGround(fr, T.theme)
  })
  // 先画人（坐姿y=10）
  drawPerson(f[0], 2, 10, T.hair_dark, T.skin, T.white, 'right', 'normal', 'type')
  drawPerson(f[1], 2, 10, T.hair_dark, T.skin, T.white, 'right', 'happy', 'type')
  drawPerson(f[2], 2, 10, T.hair_dark, T.skin, T.white, 'right', 'normal', 'type')
  drawPerson(f[3], 2, 10, T.hair_dark, T.skin, T.white, 'right', 'happy', 'type')
  // 再画桌子和显示器
  f.forEach((fr, i) => {
    drawDesk(fr, 1, 22, 14, T.brown, T.brown)
    drawMonitor(fr, 13, 11, [T.cloth_blue, T.teal, T.gold, T.cloth_blue][i], T.dark)
  })
  S(f[1], 8, 10, T.white); S(f[3], 8, 11, T.white)
  f.forEach(fr => drawCup(fr, 8, 12, T.cloth_blue))
  return f
}

// 加班（先画人再画桌子，坐姿y=10，深色背景金头发）
function sceneOvertime(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < H; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.dark)
    drawGround(fr, T.gray)
  })
  // 先画人
  drawPerson(f[0], 2, 10, T.gold, T.skin, T.white, 'right', 'sad', 'type')
  drawPerson(f[1], 2, 10, T.gold, T.skin, T.white, 'right', 'surprised', 'type')
  drawPerson(f[2], 2, 10, T.gold, T.skin, T.white, 'right', 'sad', 'type')
  drawPerson(f[3], 2, 10, T.gold, T.skin, T.white, 'right', 'surprised', 'type')
  // 再画桌子和显示器
  f.forEach((fr, i) => {
    drawDesk(fr, 1, 22, 14, T.gray, T.gray)
    drawMonitor(fr, 13, 11, [T.bright_red, T.gold, T.cloth_blue, T.gold][i], T.gray)
  })
  f.forEach(fr => drawCup(fr, 8, 12, T.cloth_blue))
  // 星星
  S(f[0], 2, 20, T.gold); S(f[0], 3, 20, T.gold); S(f[0], 2, 21, T.gold); S(f[0], 3, 21, T.gold)
  S(f[0], 1, 12, T.white); S(f[0], 4, 15, T.white); S(f[0], 6, 5, T.white)
  S(f[1], 2, 19, T.gold); S(f[1], 3, 19, T.gold); S(f[1], 2, 20, T.gold); S(f[1], 3, 20, T.gold)
  S(f[1], 1, 8, T.white); S(f[1], 4, 6, T.white); S(f[1], 6, 16, T.white)
  S(f[2], 2, 18, T.gold); S(f[2], 3, 18, T.gold); S(f[2], 2, 19, T.gold); S(f[2], 3, 19, T.gold)
  S(f[2], 1, 10, T.white); S(f[2], 4, 14, T.white); S(f[2], 6, 4, T.white)
  S(f[3], 2, 16, T.gold); S(f[3], 3, 16, T.gold); S(f[3], 2, 17, T.gold); S(f[3], 3, 17, T.gold)
  S(f[3], 1, 4, T.white); S(f[3], 4, 20, T.white); S(f[3], 6, 12, T.white)
  return f
}

// 做饭
function sceneCook(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.white)
    drawGround(fr, T.theme)
  })
  drawPerson(f[0], 3, 11, T.hair_dark, T.skin, T.cloth_red, 'right', 'happy', 'stand')
  drawPerson(f[1], 3, 11, T.hair_dark, T.skin, T.cloth_red, 'right', 'happy', 'stand')
  drawPerson(f[2], 3, 11, T.hair_dark, T.skin, T.cloth_red, 'right', 'happy', 'armsup')
  drawPerson(f[3], 3, 11, T.hair_dark, T.skin, T.cloth_red, 'right', 'happy', 'cheer')
  // 灶台
  f.forEach(fr => {
    for (let col = 8; col <= 20; col++) { S(fr, 13, col, T.brown); S(fr, 14, col, T.brown) }
    S(fr, 12, 12, T.gray); S(fr, 12, 13, T.gray); S(fr, 12, 16, T.gray); S(fr, 12, 17, T.gray)
    S(fr, 15, 9, T.dark); S(fr, 15, 19, T.dark)
  })
  // 锅
  S(f[0], 11, 12, T.dark); S(f[0], 11, 13, T.dark)
  S(f[1], 10, 11, T.bright_red); S(f[1], 10, 14, T.bright_red); S(f[1], 9, 12, T.bright_red); S(f[1], 9, 13, T.bright_red)
  S(f[2], 11, 16, T.dark); S(f[2], 11, 17, T.dark)
  S(f[3], 8, 11, T.gold); S(f[3], 9, 13, T.bright_red); S(f[3], 10, 15, T.gold)
  return f
}

// 运动锻炼
function sceneExercise(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.white)
    drawGround(fr, T.theme)
    S(fr, 4, 5, T.dark); S(fr, 4, 18, T.dark); S(fr, 5, 5, T.dark); S(fr, 5, 18, T.dark)
    S(fr, 6, 5, T.dark); S(fr, 6, 18, T.dark); S(fr, 7, 5, T.dark); S(fr, 7, 18, T.dark)
    for (let col = 5; col <= 18; col++) S(fr, 4, col, T.dark)
  })
  drawPerson(f[0], 9, 11, T.hair_dark, T.skin, T.cloth_red, 'front', 'happy', 'jump')
  drawPerson(f[1], 9, 10, T.hair_dark, T.skin, T.cloth_red, 'front', 'happy', 'cheer')
  drawPerson(f[2], 9, 11, T.hair_dark, T.skin, T.cloth_red, 'front', 'happy', 'jump')
  drawPerson(f[3], 9, 10, T.hair_dark, T.skin, T.cloth_red, 'front', 'happy', 'cheer')
  S(f[1], 8, 7, T.sky); S(f[1], 9, 6, T.sky); S(f[3], 8, 16, T.sky); S(f[3], 9, 17, T.sky)
  return f
}

// 旅行
function sceneTravel(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach((fr) => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.sky)
    drawGround(fr, T.theme)
    drawTree(fr, 1, 8)
  })
  const sunX = 19
  f.forEach((fr, i) => {
    S(fr, 2, sunX, T.gold); S(fr, 2, sunX+1, T.gold); S(fr, 3, sunX, T.gold); S(fr, 3, sunX+1, T.gold)
    if (i%2 === 0) { S(fr, 1, sunX, T.gold); S(fr, 4, sunX+1, T.gold); S(fr, 2, sunX-1, T.gold); S(fr, 3, sunX+2, T.gold) }
  })
  drawCloud(f[0], 4, 4, false); drawCloud(f[0], 6, 12, true)
  drawCloud(f[1], 4, 8, false); drawCloud(f[1], 6, 16, true)
  drawCloud(f[2], 4, 12, false); drawCloud(f[2], 6, 20, true)
  drawCloud(f[3], 4, 16, false)
  drawPerson(f[0], 8, 11, T.hair_light, T.skin, T.white, 'right', 'happy', 'walk1')
  drawPerson(f[1], 10, 11, T.hair_light, T.skin, T.white, 'right', 'happy', 'walk2')
  drawPerson(f[2], 12, 11, T.hair_light, T.skin, T.white, 'right', 'happy', 'walk1')
  drawPerson(f[3], 14, 11, T.hair_light, T.skin, T.white, 'right', 'happy', 'walk2')
  const so = [6, 7, 8, 9]
  f.forEach((fr, i) => {
    const sx = so[i]
    S(fr, 9, sx, T.cloth_red); S(fr, 10, sx, T.cloth_red); S(fr, 11, sx, T.cloth_red); S(fr, 12, sx, T.dark)
    S(fr, 12, sx-1, T.dark); S(fr, 12, sx+1, T.dark)
  })
  drawBird(f[0], 3, 10, 0); drawBird(f[1], 3, 13, 1); drawBird(f[2], 3, 16, 0); drawBird(f[3], 3, 19, 1)
  return f
}

// 钓鱼
function sceneFishing(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach((fr, i) => {
    for (let col = 0; col < W; col++) {
      S(fr, 16, col, T.cloth_blue); S(fr, 17, col, T.cloth_blue); S(fr, 18, col, T.sky); S(fr, 19, col, T.sky)
      if (i%2 === 0) { S(fr, 16, col+3, T.sky) } else { S(fr, 16, col+7, T.sky) }
    }
    drawGround(fr, T.teal, 15)
  })
  drawPerson(f[0], 3, 10, T.hair_dark, T.skin, T.teal, 'right', 'happy', 'sit')
  drawPerson(f[1], 3, 10, T.hair_dark, T.skin, T.teal, 'right', 'happy', 'sit')
  drawPerson(f[2], 3, 10, T.hair_dark, T.skin, T.teal, 'right', 'surprised', 'sit')
  drawPerson(f[3], 3, 10, T.hair_dark, T.skin, T.teal, 'right', 'happy', 'sit')
  for (let r = 7; r <= 14; r++) S(f[0], r, 7, T.dark)
  S(f[1], 7, 7, T.dark); S(f[1], 8, 7, T.dark); S(f[1], 9, 8, T.dark); S(f[1], 10, 8, T.dark)
  S(f[1], 11, 8, T.dark); S(f[1], 12, 8, T.dark); S(f[1], 13, 8, T.dark); S(f[1], 14, 8, T.dark)
  S(f[2], 7, 7, T.dark); S(f[2], 8, 7, T.dark); S(f[2], 9, 8, T.dark); S(f[2], 10, 9, T.dark)
  S(f[2], 11, 9, T.dark); S(f[2], 12, 9, T.dark); S(f[2], 13, 9, T.dark); S(f[2], 14, 9, T.dark)
  S(f[3], 7, 7, T.dark); S(f[3], 8, 7, T.dark); S(f[3], 9, 8, T.dark); S(f[3], 10, 8, T.dark)
  S(f[3], 11, 8, T.dark); S(f[3], 12, 8, T.dark); S(f[3], 13, 8, T.dark); S(f[3], 14, 8, T.dark)
  S(f[0], 15, 7, T.bright_red); S(f[0], 15, 8, T.bright_red); S(f[0], 16, 7, T.bright_red)
  S(f[1], 15, 8, T.bright_red); S(f[1], 15, 9, T.bright_red); S(f[1], 16, 8, T.bright_red)
  S(f[2], 14, 9, T.bright_red); S(f[2], 15, 9, T.gold); S(f[2], 16, 9, T.gold)
  S(f[3], 15, 8, T.bright_red); S(f[3], 15, 9, T.bright_red); S(f[3], 16, 8, T.bright_red)
  return f
}

// 带孙/隔代亲
function sceneGrandchild(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.sky)
    drawGround(fr, T.theme)
    drawSmallHouse(fr, 16, 4, T.cloth_red, T.skin)
    drawFlower(fr, 17, 4, T.bright_red); drawFlower(fr, 17, 20, T.gold)
  })
  // 灰发老人 y=11
  drawPerson(f[0], 2, 11, T.gray, T.skin, T.cloth_blue, 'right', 'happy', 'stand')
  drawPerson(f[0], 10, 12, T.hair_dark, T.skin, T.peach, 'left', 'happy', 'cheer')
  drawPerson(f[1], 2, 11, T.gray, T.skin, T.cloth_blue, 'right', 'happy', 'stand')
  drawPerson(f[1], 10, 12, T.hair_dark, T.skin, T.peach, 'left', 'happy', 'armsup')
  drawPerson(f[2], 2, 11, T.gray, T.skin, T.cloth_blue, 'right', 'happy', 'cheer')
  drawPerson(f[2], 10, 12, T.hair_dark, T.skin, T.peach, 'left', 'happy', 'cheer')
  drawPerson(f[3], 2, 11, T.gray, T.skin, T.cloth_blue, 'right', 'happy', 'armsup')
  drawPerson(f[3], 10, 12, T.hair_dark, T.skin, T.peach, 'left', 'happy', 'armsup')
  S(f[0], 14, 7, T.bright_red); S(f[1], 14, 9, T.gold); S(f[2], 13, 11, T.cloth_blue); S(f[3], 14, 6, T.bright_red)
  drawHeart(f[2], 11, 7, T.bright_red, 0)
  return f
}

// 广场舞（灰发）
function sceneSquareDance(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach((fr) => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.sky)
    for (let col = 0; col < W; col++) { S(fr, 18, col, T.gray); S(fr, 19, col, T.dark) }
    drawCloud(fr, 2, 3); drawCloud(fr, 1, 16)
  })
  drawPerson(f[0], 4, 11, T.gray, T.skin, T.cloth_red, 'front', 'happy', 'cheer')
  drawPerson(f[0], 10, 11, T.hair_dark, T.skin, T.peach, 'front', 'happy', 'cheer')
  drawPerson(f[0], 16, 11, T.hair_light, T.skin, T.teal, 'front', 'happy', 'cheer')
  drawPerson(f[1], 4, 11, T.gray, T.skin, T.cloth_red, 'front', 'happy', 'armsup')
  drawPerson(f[1], 10, 11, T.hair_dark, T.skin, T.peach, 'front', 'happy', 'armsup')
  drawPerson(f[1], 16, 11, T.hair_light, T.skin, T.teal, 'front', 'happy', 'armsup')
  drawPerson(f[2], 4, 10, T.gray, T.skin, T.cloth_red, 'front', 'happy', 'jump')
  drawPerson(f[2], 10, 10, T.hair_dark, T.skin, T.peach, 'front', 'happy', 'jump')
  drawPerson(f[2], 16, 10, T.hair_light, T.skin, T.teal, 'front', 'happy', 'jump')
  for (let col = 0; col < W; col++) { S(f[2], 18, col, T.gray); S(f[2], 19, col, T.dark) }
  S(f[2], 3, 2, T.dark); S(f[2], 4, 2, T.dark); S(f[2], 4, 1, T.dark)
  S(f[2], 3, 20, T.dark); S(f[2], 4, 20, T.dark); S(f[2], 4, 21, T.dark)
  drawPerson(f[3], 4, 11, T.gray, T.skin, T.cloth_red, 'front', 'happy', 'cheer')
  drawPerson(f[3], 10, 11, T.hair_dark, T.skin, T.peach, 'front', 'happy', 'cheer')
  drawPerson(f[3], 16, 11, T.hair_light, T.skin, T.teal, 'front', 'happy', 'cheer')
  return f
}

// 约会（烛光晚餐）
function sceneDate(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.dark)
    drawGround(fr, T.brown)
    drawDesk(fr, 4, 19, 14, T.brown, T.brown)
    S(fr, 11, 11, T.gold); S(fr, 12, 11, T.gold); S(fr, 11, 12, T.bright_red); S(fr, 12, 12, T.bright_red)
  })
  drawPerson(f[0], 1, 11, T.gold, T.skin, T.white, 'right', 'happy', 'cheer')
  drawPerson(f[0], 18, 11, T.hair_light, T.skin, T.cloth_red, 'left', 'happy', 'sit')
  drawPerson(f[1], 1, 11, T.gold, T.skin, T.white, 'right', 'happy', 'sit')
  drawPerson(f[1], 18, 11, T.hair_light, T.skin, T.cloth_red, 'left', 'happy', 'sit')
  drawPerson(f[2], 1, 11, T.gold, T.skin, T.white, 'right', 'happy', 'sit')
  drawPerson(f[2], 18, 11, T.hair_light, T.skin, T.cloth_red, 'left', 'happy', 'cheer')
  drawPerson(f[3], 1, 11, T.gold, T.skin, T.white, 'right', 'happy', 'sit')
  drawPerson(f[3], 18, 11, T.hair_light, T.skin, T.cloth_red, 'left', 'happy', 'sit')
  f.forEach(fr => { drawCup(fr, 7, 13, T.cloth_red); drawCup(fr, 15, 13, T.cloth_red) })
  drawHeart(f[0], 2, 10, T.bright_red); drawHeart(f[1], 1, 10, T.bright_red)
  drawHeart(f[2], 2, 10, T.gold); drawHeart(f[3], 1, 10, T.bright_red)
  return f
}

// 散步
function sceneWalk(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.sky)
    drawGround(fr, T.theme)
    drawTree(fr, 1, 8); drawCloud(fr, 2, 4, true); drawCloud(fr, 3, 16, false)
  })
  drawPerson(f[0], 5, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'walk1')
  drawPerson(f[1], 7, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'walk2')
  drawPerson(f[2], 9, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'walk1')
  drawPerson(f[3], 11, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'walk2')
  drawBird(f[0], 3, 10, 0); drawBird(f[2], 2, 14, 1)
  return f
}

// 看书
function sceneRead(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.white)
    drawGround(fr, T.theme)
    drawSofa(fr, T.teal)
    S(fr, 6, 5, T.gold); S(fr, 7, 5, T.gold); S(fr, 8, 5, T.brown); S(fr, 8, 6, T.brown); S(fr, 9, 5, T.brown)
  })
  drawPerson(f[0], 10, 9, T.hair_dark, T.skin, T.cloth_blue, 'front', 'happy', 'sit')
  drawPerson(f[1], 10, 9, T.hair_dark, T.skin, T.cloth_blue, 'front', 'happy', 'sit')
  drawPerson(f[2], 10, 9, T.hair_dark, T.skin, T.cloth_blue, 'front', 'happy', 'sit')
  drawPerson(f[3], 10, 9, T.hair_dark, T.skin, T.cloth_blue, 'front', 'happy', 'sit')
  S(f[0], 11, 13, T.gold); S(f[0], 11, 14, T.gold); S(f[0], 12, 13, T.gold); S(f[0], 12, 14, T.gold)
  S(f[1], 11, 12, T.white); S(f[1], 11, 13, T.gold); S(f[1], 12, 13, T.gold); S(f[1], 12, 14, T.gold)
  S(f[2], 11, 13, T.gold); S(f[2], 11, 14, T.gold); S(f[2], 12, 13, T.gold); S(f[2], 12, 14, T.gold)
  S(f[3], 11, 13, T.gold); S(f[3], 11, 14, T.white); S(f[3], 12, 12, T.gold); S(f[3], 12, 13, T.gold)
  f.forEach(fr => S(fr, 5, 6, T.gold))
  return f
}

// 看电视
function sceneTV(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.white)
    drawGround(fr, T.theme)
    drawSofa(fr, T.cloth_blue)
    // 电视
    for (let col = 8; col <= 15; col++) { S(fr, 4, col, T.dark); S(fr, 7, col, T.dark) }
    for (let r = 4; r <= 7; r++) { S(fr, r, 8, T.dark); S(fr, r, 15, T.dark) }
  })
  drawPerson(f[0], 10, 9, T.hair_dark, T.skin, T.cloth_red, 'front', 'happy', 'sit')
  drawPerson(f[1], 10, 9, T.hair_dark, T.skin, T.cloth_red, 'front', 'happy', 'sit')
  drawPerson(f[2], 10, 9, T.hair_dark, T.skin, T.cloth_red, 'front', 'surprised', 'sit')
  drawPerson(f[3], 10, 9, T.hair_dark, T.skin, T.cloth_red, 'front', 'happy', 'sit')
  S(f[0], 5, 9, T.cloth_blue); S(f[0], 5, 10, T.cloth_blue); S(f[0], 6, 9, T.cloth_blue); S(f[0], 6, 10, T.cloth_blue)
  S(f[0], 5, 13, T.cloth_blue); S(f[0], 5, 14, T.cloth_blue); S(f[0], 6, 13, T.cloth_blue); S(f[0], 6, 14, T.cloth_blue)
  S(f[1], 5, 10, T.gold); S(f[1], 5, 11, T.gold); S(f[1], 5, 12, T.gold); S(f[1], 6, 11, T.gold); S(f[1], 6, 12, T.gold)
  S(f[2], 5, 9, T.bright_red); S(f[2], 5, 14, T.bright_red); S(f[2], 6, 11, T.bright_red); S(f[2], 6, 12, T.bright_red)
  S(f[3], 5, 10, T.teal); S(f[3], 5, 11, T.teal); S(f[3], 6, 12, T.teal); S(f[3], 6, 13, T.teal)
  return f
}

// 睡觉
function sceneSleep(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < H; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.dark)
    drawBed(fr, 3, 10, T.cloth_blue)
  })
  // 先画人（躺姿）
  drawPerson(f[0], 5, 10, T.hair_dark, T.skin, T.cloth_blue, 'right', 'normal', 'lie')
  drawPerson(f[1], 5, 10, T.hair_dark, T.skin, T.cloth_blue, 'right', 'normal', 'lie')
  drawPerson(f[2], 5, 10, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'lie')
  drawPerson(f[3], 5, 10, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'lie')
  // Zzz
  S(f[0], 6, 16, T.white); S(f[0], 7, 17, T.white); S(f[0], 7, 18, T.white)
  S(f[1], 5, 16, T.white); S(f[1], 6, 17, T.white); S(f[1], 6, 18, T.white); S(f[1], 7, 19, T.white)
  S(f[2], 6, 16, T.white); S(f[2], 7, 17, T.white); S(f[2], 7, 18, T.white)
  S(f[3], 5, 16, T.white); S(f[3], 6, 17, T.white); S(f[3], 6, 18, T.white); S(f[3], 7, 19, T.white)
  // 月亮
  f.forEach(fr => {
    S(fr, 2, 19, T.gold); S(fr, 2, 20, T.gold); S(fr, 3, 19, T.gold); S(fr, 3, 20, T.gold)
    S(fr, 1, 20, T.gold); S(fr, 4, 19, T.gold)
  })
  return f
}

// 吃饭
function sceneEat(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.white)
    drawGround(fr, T.theme)
    drawTable(fr, 4, 13, T.brown, T.brown)
  })
  drawPerson(f[0], 2, 10, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'sit')
  drawPerson(f[0], 17, 10, T.hair_light, T.skin, T.cloth_red, 'left', 'happy', 'sit')
  drawPerson(f[1], 2, 10, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'sit')
  drawPerson(f[1], 17, 10, T.hair_light, T.skin, T.cloth_red, 'left', 'happy', 'sit')
  drawPerson(f[2], 2, 10, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'cheer')
  drawPerson(f[2], 17, 10, T.hair_light, T.skin, T.cloth_red, 'left', 'happy', 'cheer')
  drawPerson(f[3], 2, 10, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'sit')
  drawPerson(f[3], 17, 10, T.hair_light, T.skin, T.cloth_red, 'left', 'happy', 'sit')
  // 碗筷
  S(f[0], 12, 10, T.white); S(f[0], 12, 11, T.white); S(f[0], 12, 12, T.white)
  S(f[1], 12, 10, T.white); S(f[1], 12, 11, T.gold); S(f[1], 12, 12, T.white)
  S(f[2], 12, 10, T.white); S(f[2], 12, 11, T.white); S(f[2], 12, 12, T.white)
  S(f[3], 12, 10, T.white); S(f[3], 12, 11, T.white); S(f[3], 12, 12, T.white)
  f.forEach(fr => { drawCup(fr, 7, 12, T.cloth_blue); drawCup(fr, 15, 12, T.cloth_red) })
  S(f[2], 10, 9, T.bright_red); S(f[2], 11, 13, T.bright_red)
  return f
}

// ========== 新增场景函数 V12 补全 ==========

// 相亲（明亮背景，两人对坐初见，从惊讶到开心）
function sceneBlindDate(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.white)
    drawGround(fr, T.theme)
    drawDesk(fr, 4, 19, 14, T.brown, T.brown)
  })
  // 坐姿y=10（桌子在y=14遮挡）
  drawPerson(f[0], 2, 10, T.hair_dark, T.skin, T.cloth_blue, 'right', 'surprised', 'sit')
  drawPerson(f[0], 17, 10, T.hair_light, T.skin, T.cloth_red, 'left', 'surprised', 'sit')
  drawPerson(f[1], 2, 10, T.hair_dark, T.skin, T.cloth_blue, 'right', 'normal', 'sit')
  drawPerson(f[1], 17, 10, T.hair_light, T.skin, T.cloth_red, 'left', 'normal', 'sit')
  drawPerson(f[2], 2, 10, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'sit')
  drawPerson(f[2], 17, 10, T.hair_light, T.skin, T.cloth_red, 'left', 'happy', 'sit')
  drawPerson(f[3], 2, 10, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'cheer')
  drawPerson(f[3], 17, 10, T.hair_light, T.skin, T.cloth_red, 'left', 'happy', 'cheer')
  f.forEach(fr => { drawCup(fr, 8, 12, T.cloth_blue); drawCup(fr, 14, 12, T.cloth_red) })
  drawHeart(f[3], 5, 10, T.bright_red, 0)
  return f
}

// 陪孩子玩（公园/积木，两人+小孩+彩色方块）
function scenePlayKid(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.sky)
    drawGround(fr, T.theme)
    drawSmallHouse(fr, 16, 4, T.cloth_red, T.skin)
    drawFlower(fr, 17, 4, T.bright_red); drawFlower(fr, 17, 20, T.gold)
  })
  // 大人站姿y=11，小孩在中间偏下（y=12更矮小）
  drawPerson(f[0], 2, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'stand')
  drawPerson(f[0], 10, 12, T.hair_dark, T.skin, T.cloth_red, 'left', 'happy', 'cheer')
  drawPerson(f[1], 2, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'stand')
  drawPerson(f[1], 10, 12, T.hair_dark, T.skin, T.cloth_red, 'left', 'happy', 'armsup')
  drawPerson(f[2], 2, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'cheer')
  drawPerson(f[2], 10, 12, T.hair_dark, T.skin, T.cloth_red, 'left', 'happy', 'cheer')
  drawPerson(f[3], 2, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'armsup')
  drawPerson(f[3], 10, 12, T.hair_dark, T.skin, T.cloth_red, 'left', 'happy', 'armsup')
  // 彩色积木方块
  S(f[0], 14, 7, T.bright_red); S(f[1], 14, 9, T.gold); S(f[2], 13, 11, T.cloth_blue); S(f[3], 14, 6, T.bright_red)
  S(f[0], 15, 7, T.gold); S(f[1], 15, 9, T.bright_red); S(f[2], 14, 11, T.gold); S(f[3], 15, 6, T.teal)
  return f
}

// 养宠物（小狗摇尾巴，草地蓝天）
function scenePet(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.sky)
    drawGround(fr, T.theme)
    drawSmallHouse(fr, 16, 4, T.cloth_red, T.skin)
    drawFlower(fr, 17, 4, T.bright_red); drawFlower(fr, 17, 9, T.gold); drawFlower(fr, 17, 20, T.purple)
  })
  // 主人站姿y=11，小狗在前面
  drawPerson(f[0], 2, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'stand')
  drawPerson(f[1], 2, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'stand')
  drawPerson(f[2], 2, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'cheer')
  drawPerson(f[3], 2, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'armsup')
  // 小狗摇尾巴（从远处跑近）
  drawDog(f[0], 6, 15, T.gold, T.brown, 0)
  drawDog(f[1], 8, 15, T.gold, T.brown, 1)
  drawDog(f[2], 10, 14, T.gold, T.brown, 2)
  drawDog(f[3], 12, 15, T.gold, T.brown, 1)
  drawHeart(f[2], 11, 7, T.bright_red, 0)
  return f
}

// 父母探望（父母灰发走来，带食物/礼物，门口场景）
function sceneParentVisit(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.sky)
    drawGround(fr, T.theme)
    drawSmallHouse(fr, 14, 4, T.cloth_red, T.skin)
    drawTree(fr, 0, 8)
  })
  // 父母灰发T.gray=14，从左走过来
  drawPerson(f[0], 0, 11, T.gray, T.skin, T.cloth_blue, 'right', 'happy', 'walk1')
  drawPerson(f[0], 4, 11, T.gray, T.skin, T.cloth_red, 'right', 'happy', 'walk1')
  drawPerson(f[0], 12, 11, T.hair_dark, T.skin, T.cloth_blue, 'left', 'happy', 'cheer')
  drawPerson(f[1], 1, 11, T.gray, T.skin, T.cloth_blue, 'right', 'happy', 'walk2')
  drawPerson(f[1], 5, 11, T.gray, T.skin, T.cloth_red, 'right', 'happy', 'walk2')
  drawPerson(f[1], 12, 11, T.hair_dark, T.skin, T.cloth_blue, 'left', 'happy', 'armsup')
  drawPerson(f[2], 2, 11, T.gray, T.skin, T.cloth_blue, 'right', 'happy', 'walk1')
  drawPerson(f[2], 6, 11, T.gray, T.skin, T.cloth_red, 'right', 'happy', 'walk1')
  drawPerson(f[2], 12, 11, T.hair_dark, T.skin, T.cloth_blue, 'left', 'happy', 'cheer')
  drawPerson(f[3], 3, 11, T.gray, T.skin, T.cloth_blue, 'right', 'happy', 'stand')
  drawPerson(f[3], 7, 11, T.gray, T.skin, T.cloth_red, 'right', 'happy', 'stand')
  drawPerson(f[3], 12, 11, T.hair_dark, T.skin, T.cloth_blue, 'left', 'happy', 'cheer')
  // 礼物/食物包（父母手上提着）
  f.forEach((fr, i) => {
    const bx = 1 + i
    S(fr, 9, bx, T.brown); S(fr, 10, bx, T.brown); S(fr, 9, bx+1, T.brown); S(fr, 10, bx+1, T.brown)
    S(fr, 9, bx, T.bright_red)
  })
  drawHeart(f[3], 6, 8, T.bright_red, 0)
  return f
}

// 跳槽（拎包走+星星，自信走出旧公司）
function sceneJobHop(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.white)
    drawGround(fr, T.theme)
    // 旧公司大楼在背景
    for (let col = 10; col <= 20; col++) for (let r = 2; r <= 8; r++) S(fr, r, col, T.sky)
    for (let col = 10; col <= 20; col++) { S(fr, 2, col, T.brown); S(fr, 8, col, T.brown) }
  })
  // 拎包走人，从左走到右
  drawPerson(f[0], 3, 11, T.hair_dark, T.skin, T.white, 'right', 'normal', 'walk1')
  drawPerson(f[1], 5, 11, T.hair_dark, T.skin, T.white, 'right', 'happy', 'walk2')
  drawPerson(f[2], 7, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'walk1')
  drawPerson(f[3], 9, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'cheer')
  // 公文包
  f.forEach((fr, i) => {
    const bx = 1 + i * 2
    S(fr, 9, bx, T.brown); S(fr, 10, bx, T.brown); S(fr, 9, bx+1, T.brown); S(fr, 10, bx+1, T.brown)
    S(fr, 9, bx, T.gold)
  })
  // 星星闪烁
  S(f[2], 4, 5, T.bright_red); S(f[2], 5, 6, T.bright_red); S(f[2], 4, 7, T.bright_red)
  S(f[3], 4, 5, T.gold); S(f[3], 5, 6, T.gold); S(f[3], 4, 7, T.gold)
  return f
}

// 被裁（收拾箱子走人，深色背景+飘落纸片）
function sceneFired(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < H; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.dark)
    drawGround(fr, T.gray)
  })
  // 深色背景金头发
  drawPerson(f[0], 9, 11, T.gold, T.skin, T.gray, 'front', 'sad', 'stand')
  drawPerson(f[1], 9, 11, T.gold, T.skin, T.gray, 'front', 'sad', 'bow')
  drawPerson(f[2], 9, 11, T.gold, T.skin, T.gray, 'front', 'sad', 'stand')
  drawPerson(f[3], 9, 11, T.gold, T.skin, T.gray, 'front', 'sad', 'bow')
  // 纸箱
  f.forEach(fr => {
    for (let r = 13; r <= 16; r++) for (let col = 7; col <= 11; col++) S(fr, r, col, T.brown)
    S(fr, 14, 7, T.dark); S(fr, 14, 11, T.dark); S(fr, 15, 9, T.dark)
  })
  // 飘落纸片
  S(f[1], 1, 4, T.white); S(f[1], 2, 9, T.white); S(f[1], 3, 15, T.white); S(f[1], 4, 6, T.white); S(f[1], 1, 18, T.white); S(f[1], 2, 12, T.white)
  S(f[3], 1, 3, T.white); S(f[3], 3, 8, T.white); S(f[3], 4, 14, T.white); S(f[3], 2, 19, T.white); S(f[3], 5, 11, T.white); S(f[3], 2, 5, T.white)
  return f
}

// 发奖金（红包/信封+金币，金色地面庆祝）
function sceneBonus(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => drawGround(fr, T.gold))
  drawPerson(f[0], 9, 11, T.gold, T.skin, T.cloth_blue, 'front', 'surprised', 'cheer')
  drawPerson(f[1], 9, 10, T.gold, T.skin, T.cloth_blue, 'front', 'happy', 'jump')
  drawPerson(f[2], 9, 11, T.gold, T.skin, T.cloth_blue, 'front', 'happy', 'cheer')
  drawPerson(f[3], 9, 10, T.gold, T.skin, T.cloth_blue, 'front', 'happy', 'jump')
  // 红包/信封（手中）
  f.forEach(fr => {
    S(fr, 10, 11, T.bright_red); S(fr, 10, 12, T.bright_red)
    S(fr, 11, 11, T.bright_red); S(fr, 11, 12, T.bright_red)
    S(fr, 10, 11, T.gold); S(fr, 11, 12, T.gold)
  })
  // 金币散落
  const mc = [T.gold, T.bright_red, T.white]
  for (let i = 0; i < 4; i++) { for (let j = 0; j < 8; j++) S(f[i], 2+i+j%3, 3+j*2, mc[j%3]) }
  return f
}

// 投资炒股（K线图涨跌，电脑前坐姿）
function sceneInvestment(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.white)
    drawGround(fr, T.theme)
    drawDesk(fr, 1, 22, 14, T.brown, T.brown)
  })
  // 先画人（坐姿y=10）
  drawPerson(f[0], 2, 10, T.hair_dark, T.skin, T.cloth_blue, 'right', 'normal', 'sit')
  drawPerson(f[1], 2, 10, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'sit')
  drawPerson(f[2], 2, 10, T.hair_dark, T.skin, T.cloth_blue, 'right', 'surprised', 'sit')
  drawPerson(f[3], 2, 10, T.hair_dark, T.skin, T.cloth_blue, 'right', 'sad', 'sit')
  // 显示器上K线图：先画屏幕白背景，再画K线
  const kData: [number, number][] = [[T.teal, 4], [T.teal, 2], [T.gold, 5], [T.bright_red, 8]]
  kData.forEach(([c, h], i) => {
    const fr = f[i]
    // 显示器外框（替代drawMonitor，直接画K线屏幕）
    for (let col = 11; col <= 19; col++) S(fr, 10, col, T.dark)
    for (let col = 11; col <= 19; col++) S(fr, 13, col, T.dark)
    for (let r = 10; r <= 13; r++) { S(fr, r, 11, T.dark); S(fr, r, 19, T.dark) }
    for (let col = 12; col <= 18; col++) { S(fr, 11, col, T.dark); S(fr, 12, col, T.dark) }
    // K线柱
    S(fr, 11, 12, c); S(fr, 11-h, 13, c); S(fr, 11, 14, c); S(fr, 11-h+1, 15, c); S(fr, 11, 16, c); S(fr, 10, 17, c)
  })
  return f
}

// 刷手机（沙发上低头+手机发光）
function scenePhone(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.white)
    drawGround(fr, T.theme)
    drawSofa(fr, T.cloth_blue)
  })
  // 沙发坐姿y=9（和read/tv一致）
  drawPerson(f[0], 10, 9, T.hair_dark, T.skin, T.cloth_red, 'front', 'normal', 'sit')
  drawPerson(f[1], 10, 9, T.hair_dark, T.skin, T.cloth_red, 'front', 'happy', 'sit')
  drawPerson(f[2], 10, 9, T.hair_dark, T.skin, T.cloth_red, 'front', 'normal', 'sit')
  drawPerson(f[3], 10, 9, T.hair_dark, T.skin, T.cloth_red, 'front', 'happy', 'sit')
  // 手机屏幕发光（不同颜色）
  S(f[0], 10, 14, T.dark); S(f[0], 11, 14, T.white); S(f[0], 12, 14, T.white); S(f[0], 13, 14, T.dark)
  S(f[1], 10, 14, T.dark); S(f[1], 11, 14, T.gold); S(f[1], 12, 14, T.gold); S(f[1], 13, 14, T.dark)
  S(f[2], 10, 14, T.dark); S(f[2], 11, 14, T.cloth_blue); S(f[2], 12, 14, T.cloth_blue); S(f[2], 13, 14, T.dark)
  S(f[3], 10, 14, T.dark); S(f[3], 11, 14, T.bright_red); S(f[3], 12, 14, T.bright_red); S(f[3], 13, 14, T.dark)
  return f
}

// 生病（床上+体温计+药丸）
function sceneSick(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < H; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.white)
    // 床头
    for (let r = 9; r <= 14; r++) S(fr, r, 2, T.brown)
    // 床（金色被子）
    for (let col = 3; col <= 21; col++) { S(fr, 12, col, T.gold); S(fr, 13, col, T.gold) }
    // 枕头
    S(fr, 10, 3, T.white); S(fr, 10, 4, T.white); S(fr, 11, 3, T.white); S(fr, 11, 4, T.white)
    S(fr, 14, 2, T.dark); S(fr, 14, 21, T.dark)
  })
  // 病人躺在床上
  f.forEach(fr => {
    // 头
    S(fr, 10, 5, T.brown); S(fr, 10, 6, T.brown); S(fr, 10, 7, T.brown)
    S(fr, 11, 5, T.brown); S(fr, 11, 8, T.brown)
    S(fr, 10, 8, T.skin); S(fr, 10, 9, T.skin); S(fr, 11, 6, T.skin); S(fr, 11, 7, T.skin)
    S(fr, 10, 8, T.dark); S(fr, 10, 9, T.dark) // 闭眼
    // 被子盖身
    for (let col = 10; col <= 20; col++) { S(fr, 10, col, T.cloth_red); S(fr, 11, col, T.cloth_red) }
  })
  // 体温计（颜色变化表示体温）
  S(f[0], 11, 2, T.teal); S(f[1], 11, 2, T.gold); S(f[2], 11, 2, T.skin); S(f[3], 11, 2, T.bright_red)
  // 红十字
  f.forEach(fr => {
    S(fr, 6, 1, T.bright_red); S(fr, 6, 2, T.white); S(fr, 6, 3, T.bright_red); S(fr, 5, 2, T.bright_red); S(fr, 7, 2, T.bright_red)
  })
  return f
}

// 手术（手术台+无影灯）
function sceneSurgery(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < H; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.white)
    // 手术台
    for (let col = 2; col <= 21; col++) { S(fr, 12, col, T.gray); S(fr, 13, col, T.gray) }
    S(fr, 14, 2, T.dark); S(fr, 14, 21, T.dark)
  })
  // 病人躺在手术台上
  f.forEach(fr => {
    S(fr, 10, 4, T.brown); S(fr, 10, 5, T.brown); S(fr, 10, 6, T.brown)
    S(fr, 11, 4, T.brown); S(fr, 11, 7, T.brown)
    S(fr, 10, 7, T.skin); S(fr, 10, 8, T.skin); S(fr, 11, 5, T.skin); S(fr, 11, 6, T.skin)
    S(fr, 10, 7, T.dark)
    // 白大褂/白布盖身
    for (let col = 9; col <= 18; col++) { S(fr, 10, col, T.white); S(fr, 11, col, T.white) }
  })
  // 无影灯（逐渐变亮变大）
  S(f[0], 2, 10, T.gold); S(f[0], 2, 11, T.gold); S(f[0], 2, 12, T.gold); S(f[0], 3, 11, T.gold)
  S(f[1], 2, 9, T.gold); S(f[1], 2, 10, T.gold); S(f[1], 2, 11, T.gold); S(f[1], 2, 12, T.gold); S(f[1], 2, 13, T.gold)
  S(f[1], 3, 10, T.gold); S(f[1], 3, 11, T.gold); S(f[1], 3, 12, T.gold)
  S(f[2], 2, 8, T.gold); S(f[2], 2, 9, T.gold); S(f[2], 2, 10, T.gold); S(f[2], 2, 11, T.gold); S(f[2], 2, 12, T.gold); S(f[2], 2, 13, T.gold); S(f[2], 2, 14, T.gold)
  S(f[2], 3, 9, T.gold); S(f[2], 3, 10, T.gold); S(f[2], 3, 11, T.gold); S(f[2], 3, 12, T.gold); S(f[2], 3, 13, T.gold)
  S(f[3], 2, 9, T.white); S(f[3], 2, 10, T.white); S(f[3], 2, 11, T.white); S(f[3], 2, 12, T.white); S(f[3], 2, 13, T.white)
  S(f[3], 3, 10, T.white); S(f[3], 3, 11, T.white); S(f[3], 3, 12, T.white)
  // 红十字
  f.forEach(fr => { S(fr, 1, 1, T.bright_red); S(fr, 1, 2, T.white); S(fr, 1, 3, T.bright_red); S(fr, 0, 2, T.bright_red); S(fr, 2, 2, T.bright_red) })
  return f
}

// 朋友聚会喝酒（举杯+啤酒杯+气泡，深色酒吧背景）
function sceneFriendDrink(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < H; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.dark)
    drawGround(fr, T.brown)
    drawDesk(fr, 2, 21, 14, T.brown, T.brown)
    S(fr, 2, 11, T.gold); S(fr, 2, 12, T.gold)
  })
  // 深色背景金头发，坐姿y=10（桌子在y=14遮挡）
  drawPerson(f[0], 1, 10, T.gold, T.skin, T.cloth_blue, 'right', 'happy', 'sit')
  drawPerson(f[0], 8, 10, T.gold, T.skin, T.white, 'left', 'happy', 'sit')
  drawPerson(f[0], 16, 10, T.hair_dark, T.skin, T.cloth_red, 'front', 'happy', 'sit')
  drawPerson(f[1], 1, 10, T.gold, T.skin, T.cloth_blue, 'right', 'happy', 'sit')
  drawPerson(f[1], 8, 10, T.gold, T.skin, T.white, 'left', 'happy', 'sit')
  drawPerson(f[1], 16, 10, T.hair_dark, T.skin, T.cloth_red, 'front', 'happy', 'cheer')
  drawPerson(f[2], 1, 10, T.gold, T.skin, T.cloth_blue, 'right', 'happy', 'cheer')
  drawPerson(f[2], 8, 10, T.gold, T.skin, T.white, 'left', 'happy', 'cheer')
  drawPerson(f[2], 16, 10, T.hair_dark, T.skin, T.cloth_red, 'front', 'happy', 'cheer')
  drawPerson(f[3], 1, 10, T.gold, T.skin, T.cloth_blue, 'right', 'happy', 'sit')
  drawPerson(f[3], 8, 10, T.gold, T.skin, T.white, 'left', 'happy', 'sit')
  drawPerson(f[3], 16, 10, T.hair_dark, T.skin, T.cloth_red, 'front', 'happy', 'sit')
  // 酒杯/啤酒杯
  drawCup(f[0], 5, 12, T.cloth_blue); drawCup(f[0], 12, 12, T.cloth_blue); drawCup(f[0], 19, 12, T.cloth_blue)
  drawCup(f[1], 5, 12, T.cloth_blue); drawCup(f[1], 12, 12, T.cloth_blue); drawCup(f[1], 19, 11, T.cloth_blue)
  drawCup(f[2], 5, 11, T.cloth_blue); drawCup(f[2], 12, 11, T.cloth_blue); drawCup(f[2], 19, 11, T.cloth_blue)
  drawCup(f[3], 5, 12, T.cloth_blue); drawCup(f[3], 12, 12, T.cloth_blue); drawCup(f[3], 19, 12, T.cloth_blue)
  return f
}

// 购物（购物袋摆动，商场明亮场景）
function sceneShopping(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.white)
    drawGround(fr, T.teal)
    // 商场门框/货架
    for (let r = 3; r <= 12; r++) { S(fr, r, 2, T.brown); S(fr, r, 21, T.brown) }
    for (let col = 2; col <= 21; col++) S(fr, 3, col, T.brown)
    S(fr, 6, 18, T.gold); S(fr, 7, 18, T.gold); S(fr, 8, 18, T.gold)
  })
  // 拎袋走路（从左到右）
  drawPerson(f[0], 9, 11, T.gold, T.skin, T.cloth_red, 'right', 'happy', 'walk1')
  drawPerson(f[1], 11, 11, T.gold, T.skin, T.cloth_red, 'right', 'happy', 'walk2')
  drawPerson(f[2], 13, 11, T.gold, T.skin, T.cloth_red, 'right', 'happy', 'walk1')
  drawPerson(f[3], 15, 11, T.gold, T.skin, T.cloth_red, 'right', 'happy', 'walk2')
  // 购物袋（跟着人物位置摆动）
  const personX = [9, 11, 13, 15]
  f.forEach((fr, i) => {
    const bx = personX[i] - 2
    S(fr, 11, bx, T.cloth_red); S(fr, 12, bx, T.cloth_red); S(fr, 13, bx, T.dark)
    S(fr, 10, bx, T.cloth_red)
  })
  return f
}

// 夫妻吵架（两人对骂+闪电/感叹号，灰色背景）
function sceneCoupleFight(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.gray)
    drawGround(fr, T.gray)
  })
  // 闪电
  S(f[0], 1, 11, T.gold); S(f[0], 1, 12, T.gold)
  S(f[1], 1, 11, T.gold); S(f[1], 1, 12, T.gold); S(f[1], 2, 12, T.gold); S(f[1], 0, 11, T.white)
  S(f[2], 1, 11, T.bright_red); S(f[2], 1, 12, T.bright_red)
  // 两人对立怒目
  drawPerson(f[0], 4, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'angry', 'armsup')
  drawPerson(f[0], 15, 11, T.hair_light, T.skin, T.cloth_red, 'left', 'angry', 'armsup')
  drawPerson(f[1], 4, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'angry', 'cheer')
  drawPerson(f[1], 15, 11, T.hair_light, T.skin, T.cloth_red, 'left', 'angry', 'cheer')
  drawPerson(f[2], 4, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'angry', 'armsup')
  drawPerson(f[2], 15, 11, T.hair_light, T.skin, T.cloth_red, 'left', 'sad', 'stand')
  drawPerson(f[3], 4, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'sad', 'stand')
  drawPerson(f[3], 15, 11, T.hair_light, T.skin, T.cloth_red, 'left', 'sad', 'stand')
  // 感叹号
  S(f[1], 4, 10, T.bright_red); S(f[1], 5, 10, T.bright_red); S(f[1], 6, 10, T.bright_red)
  S(f[1], 4, 14, T.bright_red); S(f[1], 5, 14, T.bright_red); S(f[1], 6, 14, T.bright_red)
  return f
}

// ===== 场景映射表 =====
export const STORYBOARD_SCENES: StoryboardScene[] = [
  // ===== 里程碑事件（priority: 10）=====
  { id: 'retire', category: 'career', name: '退休', keywords: ['退休','荣休','退休金','退休生活','告别职场','退休手续','退休倒计时','清理办公桌','退休计划','养老金'], palette: CAREER_PALETTE, frames: sceneRetire(), frameDelay: 200, animIn: 'pop', priority: 10, requires: { minAge: 40 } },
  { id: 'graduate', category: 'life', name: '毕业', keywords: ['毕业','大学毕业','毕业典礼','毕业证','学位'], palette: LIFE_PALETTE, frames: sceneGraduate(), frameDelay: 200, animIn: 'bounce', priority: 10, requires: { maxAge: 24 } },
  { id: 'first-job', category: 'career', name: '入职', keywords: ['入职','第一天上班','新工作','报到','初入职场','入职第一天','崭新的工牌','职业生涯','正式开局'], palette: CAREER_PALETTE, frames: sceneFirstJob(), frameDelay: 300, animIn: 'fade', priority: 10, requires: { maxAge: 24 } },
  { id: 'first-salary', category: 'career', name: '第一笔工资', keywords: ['第一笔工资','第一份薪水','发工资','领到工资','工资到账','工资条'], palette: CAREER_PALETTE, frames: sceneFirstSalary(), frameDelay: 180, animIn: 'bounce', priority: 10 },
  { id: 'marry', category: 'family', name: '结婚', keywords: ['结婚','婚礼','求婚','领证','娶','嫁','我们结婚了','订婚','办婚礼','娶了','嫁了'], palette: FAMILY_PALETTE, frames: sceneWedding(), frameDelay: 200, animIn: 'pop', priority: 10, requires: { dating: true } },
  { id: 'baby', category: 'family', name: '生子', keywords: ['宝宝出生','生孩子','当爸','当妈','新生儿','婴儿','出生','怀孕','二胎','当爸爸','当妈妈','孩子出生','喜得贵子','喜得千金'], palette: FAMILY_PALETTE, frames: sceneBaby(), frameDelay: 200, animIn: 'bounce', priority: 10, requires: { married: true } },
  { id: 'buy-house', category: 'family', name: '买房', keywords: ['买房','交房','装修','搬进新家','房产证','买房了','签完那叠厚厚的贷款合同','钥匙冰凉','自己的几十平米','有你一盏灯','房贷合同','贷款合同','买了房','买一套房'], palette: FAMILY_PALETTE, frames: sceneBuyHouse(), frameDelay: 200, animIn: 'fade', priority: 10 },
  { id: 'buy-car', category: 'life', name: '买车', keywords: ['买车','提车','新车','第一辆车','喜提','提回一辆','开回一辆','提了一辆','轿车落地','代步车','买了经济代步车','买了中级轿车','买了豪车','开走B级车','买车了'], palette: LIFE_PALETTE, frames: sceneBuyCar(), frameDelay: 200, animIn: 'slide', priority: 10 },
  { id: 'promotion', category: 'career', name: '升职加薪', keywords: ['升职','加薪','晋升','提拔','升值','涨薪','涨工资','带项目','项目你来带','薪资','工资条','薪资比之前高','拿到融资','天使轮','登顶榜单','掌声雷动','十万关注'], palette: CAREER_PALETTE, frames: scenePromotion(), frameDelay: 180, animIn: 'bounce', priority: 10, requires: { employed: true } },
  { id: 'gaokao', category: 'life', name: '高考', keywords: ['高考','高考结束','高考成绩','考上大学','录取通知书','金榜题名'], palette: LIFE_PALETTE, frames: sceneGaokao(), frameDelay: 300, animIn: 'pop', priority: 10, requires: { maxAge: 19 } },
  { id: 'startup', category: 'career', name: '创业', keywords: ['创业','开公司','下海','合伙创业','创业项目','创业了','创业公司','拉你入伙','合伙人','风投','All In','辞职全力','递了辞职信','全职投入','买那张单程票'], palette: CAREER_PALETTE, frames: sceneStartup(), frameDelay: 250, animIn: 'fade', priority: 10 },
  { id: 'ipo', category: 'career', name: '上市', keywords: ['上市','IPO','敲钟','股票上市','公司上市'], palette: CAREER_PALETTE, frames: sceneIPO(), frameDelay: 180, animIn: 'bounce', priority: 10 },
  { id: 'digital-immortality', category: 'career', name: '数字永生', keywords: ['数字永生','意识上传','永生','数字化','赛博永生'], palette: CAREER_PALETTE, frames: sceneDigitalImmortality(), frameDelay: 250, animIn: 'blink', priority: 10 },
  { id: 'fire', category: 'life', name: '财务自由', keywords: ['FIRE','财务自由','提前退休','财务独立','Fire运动','财务自由帖'], palette: LIFE_PALETTE, frames: sceneFIRE(), frameDelay: 300, animIn: 'fade', priority: 10 },
  { id: 'lottery-win', category: 'life', name: '中奖', keywords: ['中奖','中奖了','头奖','五百万','彩票中奖','彩票','买了张彩票','中彩票'], palette: LIFE_PALETTE, frames: sceneLottery(), frameDelay: 180, animIn: 'bounce', priority: 10 },
  // ===== 负面事件（priority: 9）=====
  { id: 'fired', category: 'career', name: '被裁', keywords: ['被裁','被公司裁员','被开除','被辞退','丢工作','被炒鱿鱼','收拾纸箱','失业','公司倒闭','HR找你谈'], palette: CAREER_PALETTE, frames: sceneFired(), frameDelay: 400, animIn: 'shake', priority: 9, requires: { employed: true } },
  { id: 'divorce', category: 'family', name: '离婚', keywords: ['离婚','离婚了','分开','离婚协议','婚姻破裂','财产分割'], palette: FAMILY_PALETTE, frames: sceneDivorce(), frameDelay: 400, animIn: 'shake', priority: 9, requires: { married: true } },
  { id: 'breakup', category: 'family', name: '分手', keywords: ['分手','失恋','被甩','感情破裂','我们分手吧'], palette: FAMILY_PALETTE, frames: sceneBreakup(), frameDelay: 400, animIn: 'fade', priority: 9, requires: { dating: true } },
  { id: 'couple-fight', category: 'family', name: '吵架', keywords: ['吵架','争吵','夫妻吵架','大吵一架','吵架摔东西','两口子吵架','激烈争吵','闹矛盾','冷战','吵了一架'], palette: FAMILY_PALETTE, frames: sceneCoupleFight(), frameDelay: 400, animIn: 'shake', priority: 9, requires: { dating: true } },
  { id: 'parent-sick', category: 'family', name: '父母生病', keywords: ['父母生病','父亲生病','母亲生病','爸妈住院','家人重病','陪床','爸住院','妈住院','父亲住院','母亲住院','陪床守夜','医院走廊','父亲走了','母亲走了','爸走了','妈走了','病逝','病危','心梗','离世','养老院','120'], palette: FAMILY_PALETTE, frames: sceneParentSick(), frameDelay: 400, animIn: 'fade', priority: 9 },
  { id: 'surgery', category: 'life', name: '手术', keywords: ['手术','动手术','进手术室','开刀','外科手术','住院手术','重大手术','做手术','住院做手术'], palette: LIFE_PALETTE, frames: sceneSurgery(), frameDelay: 400, animIn: 'fade', priority: 9 },
  { id: 'bankruptcy', category: 'life', name: '破产', keywords: ['破产','负债','欠债','赔光','亏钱','血本无归','倒闭','积蓄花光','账户蒸发','爆仓','窟窿'], palette: LIFE_PALETTE, frames: sceneBankruptcy(), frameDelay: 400, animIn: 'shake', priority: 9 },
  { id: 'lend-money', category: 'life', name: '借钱不还', keywords: ['借钱','欠钱不还','讨债','朋友借钱','借出去','发小借钱','转了账','这钱要不回来'], palette: LIFE_PALETTE, frames: sceneLendMoney(), frameDelay: 400, animIn: 'fade', priority: 9 },
  { id: 'burnout', category: 'career', name: '倦怠', keywords: ['倦怠','躺平','裸辞','厌班','抑郁','情绪崩溃','不想上班','心理阴影'], palette: CAREER_PALETTE, frames: sceneBurnout(), frameDelay: 500, animIn: 'fade', priority: 9, requires: { employed: true } },
  { id: 'sick', category: 'life', name: '生病', keywords: ['生病','发烧','感冒','卧病在床','病倒','请病假','生病卧床','医药费','住院','体检','复查','血压','血脂','脂肪肝','颈椎病','脱发','吃药','膏药','降压药','膝盖疼','眼药水','急诊','挂号','药店','咳嗽','胃疼','头疼','腰椎','腰酸','背痛','肩膀疼','手腕疼','干眼症','关节痛','酸痛','腰疼','扭伤','腰酸背痛','不舒服','卧床'], palette: LIFE_PALETTE, frames: sceneSick(), frameDelay: 400, animIn: 'fade', priority: 8 },
  // ===== 路径/重要生活事件（priority: 8）=====
  { id: 'date', category: 'family', name: '约会', keywords: ['约会','恋爱','表白','第一次约会','在一起','烛光晚餐','找对象','对象','伴侣','脱单','谈恋爱','女朋友','男朋友'], palette: FAMILY_PALETTE, frames: sceneDate(), frameDelay: 300, animIn: 'fade', priority: 8, requires: { single: true } },
  { id: 'job-hop', category: 'career', name: '跳槽', keywords: ['跳槽','跳槽去新公司','辞职跳槽','换工作','拿到新offer','跳槽涨薪','离职入职','猎头','内推','刷招聘'], palette: CAREER_PALETTE, frames: sceneJobHop(), frameDelay: 250, animIn: 'slide', priority: 8, requires: { employed: true } },
  // ===== 日常事件（priority: 7-3）=====
  { id: 'blind-date', category: 'family', name: '相亲', keywords: ['相亲','相亲见面','媒人介绍','被安排相亲','相亲饭局','去相亲','见对象','安排了相亲','周末相亲','有房有车'], palette: FAMILY_PALETTE, frames: sceneBlindDate(), frameDelay: 300, animIn: 'fade', priority: 7, requires: { single: true } },
  { id: 'parent-visit', category: 'family', name: '父母探望', keywords: ['父母来看我','爸妈从老家来','父母过来探望','父母到访','爸妈来看我','父母登门看望','回老家','过年回家','妈妈打电话','爸妈打电话','视频电话','和爸妈视频','教爸妈用','妈在家族群'], palette: FAMILY_PALETTE, frames: sceneParentVisit(), frameDelay: 300, animIn: 'fade', priority: 7 },
  { id: 'play-kid', category: 'family', name: '陪孩子玩', keywords: ['陪孩子玩','陪孩子玩耍','亲子时光','陪儿子玩','陪女儿玩','亲子互动','陪娃玩','带孩子去公园','玩积木','陪孩子','带孩子','陪娃','周末陪孩子','亲子','辅导作业','陪孩子写作业'], palette: FAMILY_PALETTE, frames: scenePlayKid(), frameDelay: 250, animIn: 'fade', priority: 7, requires: { hasChild: true } },
  { id: 'work', category: 'career', name: '工作', keywords: ['上班','搬砖','打工','开干','干活','到公司','工位','办公室','工牌','领导','老板','同事','下班','打卡','开会','项目','需求','社畜','周报','KPI','赶需求','改bug','写代码','对接','汇报','工位上','办公桌'], palette: CAREER_PALETTE, frames: sceneWork(), frameDelay: 300, animIn: 'fade', priority: 7, requires: { employed: true } },
  { id: 'overtime', category: 'career', name: '加班', keywords: ['深夜加班','加到深夜','还在加班','加班','通宵','凌晨','凌晨三点','凌晨两点','加班到很晚','加班到凌晨','通宵整晚','deadline','赶项目','红牛'], palette: CAREER_PALETTE, frames: sceneOvertime(), frameDelay: 350, animIn: 'fade', priority: 7, requires: { employed: true } },
  { id: 'midnight-baby', category: 'family', name: '半夜喂奶', keywords: ['半夜喂奶','夜醒喂奶','冲奶粉','哄睡','哄孩子睡觉','夜奶'], palette: FAMILY_PALETTE, frames: sceneMidnightBaby(), frameDelay: 500, animIn: 'fade', priority: 7, requires: { hasChild: true } },
  { id: 'travel', category: 'life', name: '旅行', keywords: ['旅游','旅行','出去玩','度假','出游','出国','去旅行','海边度假','碧海蓝天','风景照','打卡景点'], palette: LIFE_PALETTE, frames: sceneTravel(), frameDelay: 250, animIn: 'slide', priority: 7 },
  { id: 'grandchild', category: 'family', name: '抱孙', keywords: ['孙子','孙女','抱孙子','带孙','隔代亲','当爷爷','当奶奶','带孙子','带了一天孙子'], palette: FAMILY_PALETTE, frames: sceneGrandchild(), frameDelay: 250, animIn: 'fade', priority: 7, requires: { minAge: 50, hasChild: true } },
  { id: 'sunset', category: 'life', name: '夕阳晚年', keywords: ['夕阳','晚年','老了','白头偕老','一起变老','黄昏恋','暮年','白发苍苍','老花镜','上了年纪','老头','老太太','爬楼喘气','含饴弄孙','颐养天年','养老','敬老院','看日落'], palette: LIFE_PALETTE, frames: sceneSunset(), frameDelay: 500, animIn: 'fade', priority: 7, requires: { minAge: 50 } },
  { id: 'move', category: 'life', name: '搬家', keywords: ['搬家','搬去','移居','迁徙','搬迁','北漂','沪漂','深漂','去外地','房租上涨','涨房租','房东','新租的房子','租的房子'], palette: LIFE_PALETTE, frames: sceneMove(), frameDelay: 250, animIn: 'slide', priority: 7 },
  { id: 'bonus', category: 'career', name: '发奖金', keywords: ['发奖金','年终奖','项目奖金','年终分红','绩效奖金','发了一大笔奖金','奖金到手','年终奖到账'], palette: CAREER_PALETTE, frames: sceneBonus(), frameDelay: 200, animIn: 'bounce', priority: 7, requires: { employed: true } },
  { id: 'friend-drink', category: 'life', name: '朋友聚会', keywords: ['朋友聚会','和朋友聚餐','兄弟喝酒','闺蜜聚会','喝酒撸串','饭局举杯','老友重逢','酒吧喝酒','同事喝酒','拼酒','同学聚会','份子钱','结婚请柬','聚餐','干杯','撸串','烧烤','喝啤酒','白酒'], palette: LIFE_PALETTE, frames: sceneFriendDrink(), frameDelay: 300, animIn: 'fade', priority: 6 },
  { id: 'pet', category: 'life', name: '养宠物', keywords: ['养宠物','养了只小狗','养了只小猫','遛狗','养猫','毛孩子','宠物狗','宠物猫','铲屎','领养','收养','宠物医院','抱回家','带回家养'], palette: LIFE_PALETTE, frames: scenePet(), frameDelay: 250, animIn: 'fade', priority: 6 },
  { id: 'investment', category: 'career', name: '投资炒股', keywords: ['炒股','买基金','投资理财','股市涨跌','买入股票','理财收益','股票基金','币圈投资','股市','牛市','熊市','持仓','仓位','爆仓','暴跌','行情','币圈','交易所','K线','炒币','比特币','加密货币'], palette: CAREER_PALETTE, frames: sceneInvestment(), frameDelay: 300, animIn: 'fade', priority: 6 },
  { id: 'cook', category: 'family', name: '做饭', keywords: ['做饭','炒菜','下厨房','烹饪','做饭菜','烧菜','做了顿好饭','红烧肉','煮面','炖汤','煲汤','厨艺','菜谱','围裙','家常菜','下厨'], palette: FAMILY_PALETTE, frames: sceneCook(), frameDelay: 250, animIn: 'fade', priority: 6 },
  { id: 'shopping', category: 'life', name: '购物', keywords: ['购物','逛街','血拼','买买买','商场购物','超市采购','剁手','扫货','逛商场','快递','拆包裹','快递到了','网购','下单','取快递'], palette: LIFE_PALETTE, frames: sceneShopping(), frameDelay: 250, animIn: 'slide', priority: 4 },
  { id: 'phone', category: 'life', name: '刷手机', keywords: ['刷手机','刷短视频','刷抖音','刷朋友圈','手机不离手','刷剧','窝沙发刷手机','躺着刷','刷动态圈','小红书','手机没电','截图','发动态圈','设闹钟','刷微博','刷B站','刷手机到深夜','玩手机'], palette: LIFE_PALETTE, frames: scenePhone(), frameDelay: 300, animIn: 'fade', priority: 4 },
  { id: 'walk', category: 'family', name: '散步', keywords: ['散步','走路','遛弯','走走','漫步','小区散步','晚饭后散步','溜达','公园散步','饭后散步','江边散步','散步回来'], palette: FAMILY_PALETTE, frames: sceneWalk(), frameDelay: 300, animIn: 'fade', priority: 4 },
  { id: 'exercise', category: 'life', name: '锻炼', keywords: ['锻炼','跑步','健身','运动','晨跑','晨练','健身房','太极','米字操','颈椎操','走路上班','瑜伽','游泳','打球','篮球','羽毛球','马拉松','撸铁','骑行','骑车','动感单车','跑步机','普拉提','练瑜伽'], palette: LIFE_PALETTE, frames: sceneExercise(), frameDelay: 200, animIn: 'pop', priority: 5 },
  { id: 'fishing', category: 'life', name: '钓鱼', keywords: ['钓鱼','去钓鱼','垂钓','钓到大鱼'], palette: LIFE_PALETTE, frames: sceneFishing(), frameDelay: 400, animIn: 'fade', priority: 5 },
  { id: 'square-dance', category: 'life', name: '广场舞', keywords: ['广场舞','跳广场舞','大妈跳舞','广场跳广场舞'], palette: LIFE_PALETTE, frames: sceneSquareDance(), frameDelay: 200, animIn: 'bounce', priority: 5 },
  { id: 'read', category: 'life', name: '看书', keywords: ['看书','读书','阅读','翻书','书店','学习新技能','教学视频','收藏夹','论文','备考','考研','考证','书架','图书馆','借书'], palette: LIFE_PALETTE, frames: sceneRead(), frameDelay: 400, animIn: 'fade', priority: 3 },
  { id: 'tv', category: 'family', name: '看电视', keywords: ['看电视','追剧','看剧','看节目','电视机前','窝在沙发','看电影','看电视连续剧','综艺','频道','遥控器','沙发看电视'], palette: FAMILY_PALETTE, frames: sceneTV(), frameDelay: 350, animIn: 'fade', priority: 3 },
  { id: 'sleep', category: 'family', name: '睡觉', keywords: ['睡觉','入睡','晚安','睡着','睡眠','失眠','睡过头','闹钟响了','睡了','困','深睡'], palette: FAMILY_PALETTE, frames: sceneSleep(), frameDelay: 600, animIn: 'fade', priority: 3 },
  { id: 'eat', category: 'family', name: '吃饭', keywords: ['吃饭','吃晚饭','吃饭了','用餐','晚饭','吃火锅','早餐','午饭','外卖','聚餐','饭局','一个人吃饭'], palette: FAMILY_PALETTE, frames: sceneEat(), frameDelay: 300, animIn: 'fade', priority: 3 },
]

/**
 * 根据ID获取场景
 */
export function getSceneById(id: string): StoryboardScene | undefined {
  return STORYBOARD_SCENES.find(s => s.id === id)
}

/**
 * 根据关键词匹配最佳场景（返回单个场景对象）
 */
export function matchSceneByKeywords(text: string): StoryboardScene | null {
  if (!text) return null
  const lower = text.toLowerCase()
  let best: StoryboardScene | null = null
  let bestScore = 0
  for (const scene of STORYBOARD_SCENES) {
    let score = 0
    for (const kw of scene.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score += kw.length * (scene.priority || 5)
      }
    }
    if (score > bestScore) {
      bestScore = score
      best = scene
    }
  }
  return best
}

/** 场景匹配上下文（用于前置条件检查） */
export interface SceneContext {
  age: number;
  hasChild: boolean;
  isEmployed: boolean;       // 是否在职（非失业）
  datingStage: 'single' | 'crush' | 'dating' | 'serious' | 'married' | 'divorced' | null;
  hasProperty: boolean;      // 是否有房产
}

function sceneRequiresMet(scene: StoryboardScene, ctx: SceneContext | null): boolean {
  if (!scene.requires || !ctx) return true // 无前置条件或无上下文，默认通过
  const req = scene.requires
  if (req.hasChild !== undefined && req.hasChild !== ctx.hasChild) return false
  if (req.employed !== undefined && req.employed !== ctx.isEmployed) return false
  if (req.hasProperty !== undefined && req.hasProperty !== ctx.hasProperty) return false
  if (req.minAge !== undefined && ctx.age < req.minAge) return false
  if (req.maxAge !== undefined && ctx.age > req.maxAge) return false
  if (req.married !== undefined) {
    const isMarried = ctx.datingStage === 'married'
    if (req.married !== isMarried) return false
  }
  if (req.dating !== undefined) {
    const isDating = ctx.datingStage !== null && ['crush','dating','serious','married'].includes(ctx.datingStage)
    if (req.dating !== isDating) return false
  }
  if (req.single !== undefined) {
    const isSingle = ctx.datingStage === null || ctx.datingStage === 'single' || ctx.datingStage === 'divorced'
    if (req.single !== isSingle) return false
  }
  return true
}

/**
 * 匹配场景并按分类返回ID列表（供游戏store使用）
 * 返回 { family: string[], life: string[], career: string[] }
 */
export function matchStoryboardScenes(
  logs: string | string[],
  ctx?: SceneContext | null,
): { family: string[]; life: string[]; career: string[] } {
  const texts = Array.isArray(logs) ? logs : [logs]
  const result: { family: string[]; life: string[]; career: string[] } = { family: [], life: [], career: [] }
  const scored: { scene: StoryboardScene; score: number }[] = []

  for (const text of texts) {
    if (!text) continue
    const lower = text.toLowerCase()
    for (const scene of STORYBOARD_SCENES) {
      // 前置条件检查：不满足则跳过该场景
      if (!sceneRequiresMet(scene, ctx ?? null)) continue
      let score = 0
      for (const kw of scene.keywords) {
        if (lower.includes(kw.toLowerCase())) {
          score += kw.length * (scene.priority || 5)
        }
      }
      if (score > 0) {
        const existing = scored.find(s => s.scene.id === scene.id)
        if (existing) {
          existing.score += score
        } else {
          scored.push({ scene, score })
        }
      }
    }
  }

  // 按分数降序排列，每个分类只取最高分的场景（避免低优先级场景覆盖高优先级场景）
  scored.sort((a, b) => b.score - a.score)
  const usedCats = new Set<StoryboardCategory>()
  for (const { scene } of scored) {
    const cat = scene.category
    if (cat === 'family' || cat === 'life' || cat === 'career') {
      if (!usedCats.has(cat)) {
        usedCats.add(cat)
        result[cat].push(scene.id)
        if (usedCats.size >= 3) break // 三个分类都已覆盖，提前退出
      }
    }
  }
  return result
}
