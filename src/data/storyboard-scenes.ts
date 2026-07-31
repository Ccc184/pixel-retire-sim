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

// ===== 新增趣味专属场景 =====

// 演讲/领奖/上台：聚光灯下讲台+人物，观众席小点头
function sceneSpeech(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.dark)
    // 聚光灯效果（从上方照下来）
    for (let r = 0; r < 12; r++) {
      const w = Math.max(1, r);
      for (let col = Math.max(0, 11-w); col <= Math.min(23, 12+w); col++) {
        if (fr[r][col] === T.dark) S(fr, r, col, T.gold)
      }
    }
    // 地面（舞台）
    for (let col = 0; col < W; col++) { S(fr, 17, col, T.brown); S(fr, 18, col, T.dark) }
    // 观众席（几个小点头）
    S(fr, 16, 3, T.hair_dark); S(fr, 16, 7, T.hair_dark); S(fr, 16, 16, T.hair_light); S(fr, 16, 20, T.hair_dark)
  })
  // 讲台（在人物前面，后画形成遮挡）
  // 人物站在讲台后 y=8（脚在15，讲台在13-15）
  drawPerson(f[0], 10, 8, T.hair_dark, T.skin, T.cloth_blue, 'front', 'happy', 'cheer')
  drawPerson(f[1], 10, 8, T.hair_dark, T.skin, T.cloth_blue, 'front', 'happy', 'armsup')
  drawPerson(f[2], 10, 8, T.hair_dark, T.skin, T.cloth_red, 'front', 'happy', 'cheer')
  drawPerson(f[3], 10, 8, T.hair_dark, T.skin, T.cloth_red, 'front', 'happy', 'armsup')
  // 讲台
  f.forEach(fr => {
    for (let col = 8; col <= 15; col++) { S(fr, 13, col, T.brown); S(fr, 14, col, T.brown) }
    S(fr, 15, 8, T.dark); S(fr, 15, 15, T.dark)
    S(fr, 13, 11, T.white); S(fr, 13, 12, T.white) // 麦克风
  })
  // 奖杯/证书
  S(f[2], 7, 15, T.gold); S(f[3], 7, 15, T.gold)
  S(f[2], 8, 14, T.gold); S(f[2], 8, 16, T.gold); S(f[3], 8, 14, T.gold); S(f[3], 8, 16, T.gold)
  // 掌声（小点点）
  S(f[1], 15, 2, T.white); S(f[1], 15, 5, T.white); S(f[1], 15, 18, T.white); S(f[1], 15, 22, T.white)
  S(f[3], 15, 1, T.gold); S(f[3], 15, 6, T.gold); S(f[3], 15, 17, T.gold); S(f[3], 15, 22, T.gold)
  return f
}

// 哭泣/崩溃：人物坐着，手擦眼泪，纸巾
function sceneCry(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.gray)
    drawGround(fr, T.gray)
  })
  // 人物坐在地上/床边 y=12（坐姿位置）
  drawPerson(f[0], 9, 11, T.hair_dark, T.skin, T.cloth_blue, 'front', 'sad', 'sit')
  drawPerson(f[1], 9, 11, T.hair_dark, T.skin, T.cloth_blue, 'front', 'sad', 'sit')
  drawPerson(f[2], 9, 11, T.hair_dark, T.skin, T.cloth_blue, 'front', 'sad', 'sit')
  drawPerson(f[3], 9, 11, T.hair_dark, T.skin, T.cloth_blue, 'front', 'sad', 'sit')
  // 眼泪（蓝色水滴，动画：掉落）
  S(f[0], 12, 10, T.sky); S(f[0], 12, 13, T.sky)
  S(f[1], 13, 10, T.sky); S(f[1], 13, 13, T.sky)
  S(f[2], 12, 10, T.sky); S(f[2], 12, 13, T.sky); S(f[2], 13, 11, T.sky)
  S(f[3], 13, 10, T.sky); S(f[3], 13, 13, T.sky); S(f[3], 14, 12, T.sky)
  // 纸巾（白色方块）
  f.forEach(fr => { S(fr, 13, 14, T.white); S(fr, 14, 14, T.white) })
  return f
}

// 雨天撑伞：人物撑伞走路，雨滴下落
function sceneRainUmbrella(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.sky)
    drawGround(fr, T.theme)
  })
  // 雨滴动画（蓝色细线，位置逐帧变化）
  for (let i = 0; i < 12; i++) {
    const col = (i * 2 + 1) % W
    S(f[0], 1 + (i*3)%14, col, T.sky)
    S(f[0], 2 + (i*3)%14, col, T.white)
    const col2 = (i * 2 + 5) % W
    S(f[1], 3 + (i*3)%12, col2, T.white)
    S(f[1], 4 + (i*3)%12, col2, T.sky)
    const col3 = (i * 3 + 3) % W
    S(f[2], 2 + (i*2)%13, col3, T.sky)
    S(f[2], 3 + (i*2)%13, col3, T.white)
    const col4 = (i * 2 + 7) % W
    S(f[3], 4 + (i*3)%11, col4, T.white)
    S(f[3], 5 + (i*3)%11, col4, T.sky)
  }
  // 伞（弧形红色伞面 + 伞柄），伞在y=5-7位置
  function drawUmbrella(fr: PixelFrame, cx: number, cy: number) {
    // 伞面（弧形）
    S(fr, cy, cx-3, T.cloth_red); S(fr, cy, cx-2, T.cloth_red); S(fr, cy, cx-1, T.cloth_red)
    S(fr, cy, cx, T.cloth_red); S(fr, cy, cx+1, T.cloth_red); S(fr, cy, cx+2, T.cloth_red); S(fr, cy, cx+3, T.cloth_red)
    S(fr, cy+1, cx-4, T.cloth_red); S(fr, cy+1, cx-3, T.cloth_red); S(fr, cy+1, cx-2, T.cloth_red)
    S(fr, cy+1, cx-1, T.cloth_red); S(fr, cy+1, cx, T.cloth_red); S(fr, cy+1, cx+1, T.cloth_red)
    S(fr, cy+1, cx+2, T.cloth_red); S(fr, cy+1, cx+3, T.cloth_red); S(fr, cy+1, cx+4, T.cloth_red)
    S(fr, cy+1, cx, T.dark) // 伞尖
    // 伞柄
    S(fr, cy+2, cx, T.brown); S(fr, cy+3, cx, T.brown); S(fr, cy+4, cx, T.brown)
    S(fr, cy+5, cx+1, T.brown)
  }
  // 人物撑伞走路 y=11（脚在18），伞在上方
  drawPerson(f[0], 10, 11, T.hair_dark, T.skin, T.cloth_blue, 'front', 'normal', 'walk1')
  drawUmbrella(f[0], 12, 5)
  drawPerson(f[1], 10, 11, T.hair_dark, T.skin, T.cloth_blue, 'front', 'happy', 'walk2')
  drawUmbrella(f[1], 12, 5)
  drawPerson(f[2], 10, 11, T.hair_dark, T.skin, T.cloth_blue, 'front', 'normal', 'walk1')
  drawUmbrella(f[2], 12, 5)
  drawPerson(f[3], 10, 11, T.hair_dark, T.skin, T.cloth_blue, 'front', 'happy', 'walk2')
  drawUmbrella(f[3], 12, 5)
  // 水洼（地面上的小蓝色块）
  f.forEach(fr => {
    S(fr, 17, 3, T.sky); S(fr, 17, 4, T.sky); S(fr, 17, 19, T.sky); S(fr, 17, 20, T.sky)
  })
  return f
}

// 情侣牵手散步：夕阳下两人牵手走
function sceneCoupleWalk(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    // 夕阳渐变天空（上半深蓝，下半橙红）
    for (let r = 0; r < 8; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.purple)
    for (let r = 8; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.peach)
    // 夕阳（圆形）
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
      if (dr*dr + dc*dc <= 4) S(fr, 12+dr, 18+dc, T.gold)
    }
    drawGround(fr, T.brown)
  })
  // 两个人牵手走（左边男蓝，右边女红）
  drawPerson(f[0], 5, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'walk1')
  drawPerson(f[0], 14, 11, T.hair_light, T.skin, T.cloth_red, 'left', 'happy', 'walk1')
  drawPerson(f[1], 5, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'walk2')
  drawPerson(f[1], 14, 11, T.hair_light, T.skin, T.cloth_red, 'left', 'happy', 'walk2')
  drawPerson(f[2], 5, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'walk1')
  drawPerson(f[2], 14, 11, T.hair_light, T.skin, T.cloth_red, 'left', 'happy', 'walk1')
  drawPerson(f[3], 5, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'walk2')
  drawPerson(f[3], 14, 11, T.hair_light, T.skin, T.cloth_red, 'left', 'happy', 'walk2')
  // 牵手效果（中间画一个肤色像素连接）
  f.forEach(fr => S(fr, 14, 10, T.skin))
  // 小爱心飘起
  S(f[1], 9, 9, T.bright_red); S(f[3], 8, 11, T.bright_red)
  return f
}

// 烟花：夜空中烟花绽放
function sceneFireworks(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.dark)
    drawGround(fr, T.dark)
  })
  // 人物抬头看烟花 y=11（背影/侧脸）
  drawPerson(f[0], 10, 11, T.hair_dark, T.skin, T.cloth_blue, 'back', 'happy', 'stand')
  drawPerson(f[1], 10, 11, T.hair_dark, T.skin, T.cloth_blue, 'back', 'happy', 'stand')
  drawPerson(f[2], 10, 11, T.hair_dark, T.skin, T.cloth_red, 'back', 'happy', 'cheer')
  drawPerson(f[3], 10, 11, T.hair_dark, T.skin, T.cloth_red, 'back', 'happy', 'cheer')
  drawPerson(f[4], 10, 11, T.hair_dark, T.skin, T.cloth_blue, 'back', 'happy', 'armsup')
  drawPerson(f[5], 10, 11, T.hair_dark, T.skin, T.cloth_blue, 'back', 'happy', 'jump')
  // 烟花绽放动画
  const c1 = T.bright_red, c2 = T.gold, c3 = T.cloth_blue, c4 = T.teal, c5 = T.peach
  // Frame 0-1: 烟花上升（小点往上）
  S(f[0], 14, 5, c2); S(f[0], 13, 5, c2); S(f[1], 10, 5, c2); S(f[1], 9, 5, c2)
  // Frame 2: 第一朵烟花绽放（中心在(5,5)）
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2
    S(f[2], 5+Math.round(Math.sin(angle)*2), 5+Math.round(Math.cos(angle)*2), [c1,c2,c3][i%3])
    S(f[2], 5+Math.round(Math.sin(angle)*3), 5+Math.round(Math.cos(angle)*3), [c1,c2,c3][i%3])
  }
  S(f[2], 5, 5, c2)
  // Frame 3: 更大绽放
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2
    S(f[3], 5+Math.round(Math.sin(angle)*2), 5+Math.round(Math.cos(angle)*2), [c1,c2,c3,c4][i%4])
    S(f[3], 5+Math.round(Math.sin(angle)*3), 5+Math.round(Math.cos(angle)*3), [c1,c2,c3,c4][i%4])
    S(f[3], 5+Math.round(Math.sin(angle)*4), 5+Math.round(Math.cos(angle)*4), [c1,c2,c3,c4][i%4])
  }
  S(f[3], 5, 5, c2)
  // 第二朵烟花（在右侧）
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2
    S(f[3], 18+Math.round(Math.sin(angle)*2), 8+Math.round(Math.cos(angle)*2), [c5,c1,c2][i%3])
    S(f[3], 18+Math.round(Math.sin(angle)*3), 8+Math.round(Math.cos(angle)*3), [c5,c1,c2][i%3])
  }
  S(f[3], 18, 8, c5)
  // Frame 4: 烟花散落（小点点）
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2
    S(f[4], 5+Math.round(Math.sin(angle)*4), 5+Math.round(Math.cos(angle)*4), [c1,c2,c3,c4,c5][i%5])
    S(f[4], 18+Math.round(Math.sin(angle)*3), 8+Math.round(Math.cos(angle)*3), [c1,c2,c5][i%3])
  }
  // Frame 5: 最后一朵大烟花
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2
    S(f[5], 12+Math.round(Math.sin(angle)*2), 3+Math.round(Math.cos(angle)*2), [c1,c2,c3,c4,c5][i%5])
    S(f[5], 12+Math.round(Math.sin(angle)*3), 3+Math.round(Math.cos(angle)*3), [c1,c2,c3,c4,c5][i%5])
    S(f[5], 12+Math.round(Math.sin(angle)*4), 3+Math.round(Math.cos(angle)*4), [c1,c2,c3,c4,c5][i%5])
  }
  S(f[5], 12, 3, c2)
  return f
}

// 拍照：人物举手机拍照
function scenePhoto(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.sky)
    drawGround(fr, T.theme)
    drawCloud(fr, 1, 3, true); drawCloud(fr, 2, 18, false)
    drawTree(fr, 2, 12); drawTree(fr, 20, 12)
  })
  // 人物举着手机拍照 y=11（armsup姿势）
  drawPerson(f[0], 9, 11, T.hair_dark, T.skin, T.cloth_blue, 'front', 'happy', 'armsup')
  drawPerson(f[1], 9, 11, T.hair_dark, T.skin, T.cloth_blue, 'front', 'happy', 'armsup')
  drawPerson(f[2], 9, 11, T.hair_dark, T.skin, T.cloth_red, 'front', 'happy', 'armsup')
  drawPerson(f[3], 9, 11, T.hair_dark, T.skin, T.cloth_red, 'front', 'happy', 'cheer')
  // 手机（黑色方块举在手上）
  f.forEach(fr => {
    S(fr, 9, 10, T.dark); S(fr, 9, 11, T.dark); S(fr, 10, 10, T.dark); S(fr, 10, 11, T.dark)
    S(fr, 9, 10, T.sky) // 屏幕亮光
  })
  // 拍照闪光效果
  S(f[1], 0, 0, T.white); for (let r = 0; r < H; r++) for (let col = 0; col < W; col++) if (f[1][r][col] === T.dark || f[1][r][col] === T.sky) S(f[1], r, col, T.white)
  drawPerson(f[1], 9, 11, T.hair_dark, T.skin, T.cloth_blue, 'front', 'surprised', 'armsup')
  S(f[1], 9, 10, T.dark); S(f[1], 9, 11, T.dark); S(f[1], 10, 10, T.dark); S(f[1], 10, 11, T.dark)
  drawGround(f[1], T.theme)
  return f
}

// 温暖拥抱：两人相拥
function sceneHug(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.peach)
    drawGround(fr, T.brown)
    drawHeart(fr, 2, 3, T.bright_red, 0); drawHeart(fr, 1, 19, T.bright_red, 0)
  })
  // 两人拥抱（部分重叠，左边人偏右，右边人偏左）
  // 先用蓝色画左边人
  drawPerson(f[0], 7, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'stand')
  drawPerson(f[0], 12, 11, T.hair_light, T.skin, T.cloth_red, 'left', 'happy', 'stand')
  drawPerson(f[1], 7, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'stand')
  drawPerson(f[1], 12, 11, T.hair_light, T.skin, T.cloth_red, 'left', 'happy', 'stand')
  drawPerson(f[2], 7, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'stand')
  drawPerson(f[2], 12, 11, T.hair_light, T.skin, T.cloth_red, 'left', 'happy', 'stand')
  drawPerson(f[3], 7, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'stand')
  drawPerson(f[3], 12, 11, T.hair_light, T.skin, T.cloth_red, 'left', 'happy', 'stand')
  // 拥抱时手臂环住（肤色连接）
  f.forEach(fr => {
    S(fr, 14, 11, T.skin); S(fr, 14, 12, T.cloth_blue)
    S(fr, 14, 8, T.skin); S(fr, 14, 8, T.cloth_red)
  })
  // 大爱心在头顶
  drawHeart(f[1], 6, 9, T.bright_red, 1)
  drawHeart(f[3], 5, 8, T.bright_red, 1); drawHeart(f[3], 7, 14, T.peach, 0)
  return f
}

// 冥想/阳台发呆：人物盘腿/安静坐着，阳光
function sceneMeditation(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.sky)
    // 阳台栏杆
    for (let col = 0; col < W; col++) S(fr, 14, col, T.gray)
    for (let col = 2; col < W; col += 4) { S(fr, 15, col, T.gray); S(fr, 16, col, T.gray) }
    // 太阳
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) S(fr, 3+dr, 19+dc, T.gold)
    S(fr, 2, 19, T.gold); S(fr, 4, 19, T.gold)
    drawGround(fr, T.brown)
  })
  // 人物盘腿坐着（用sit姿势，y=11位置比地面高因为在椅子/垫子上）
  drawPerson(f[0], 10, 10, T.hair_dark, T.skin, T.cloth_blue, 'back', 'happy', 'sit')
  drawPerson(f[1], 10, 10, T.hair_dark, T.skin, T.cloth_blue, 'back', 'happy', 'sit')
  drawPerson(f[2], 10, 10, T.hair_dark, T.skin, T.teal, 'back', 'happy', 'sit')
  drawPerson(f[3], 10, 10, T.hair_dark, T.skin, T.teal, 'back', 'happy', 'sit')
  // 深呼吸动画（圆圈扩散）
  S(f[1], 8, 12, T.white); S(f[3], 7, 11, T.white); S(f[3], 7, 13, T.white); S(f[3], 9, 11, T.white); S(f[3], 9, 13, T.white)
  // 花盆/绿萝
  f.forEach(fr => {
    S(fr, 16, 2, T.teal); S(fr, 15, 2, T.teal); S(fr, 16, 3, T.teal); S(fr, 15, 1, T.teal)
    S(fr, 17, 1, T.brown); S(fr, 17, 2, T.brown); S(fr, 17, 3, T.brown)
  })
  // 鸟飞过
  S(f[0], 2, 5, T.dark); S(f[0], 2, 6, T.dark); S(f[0], 3, 7, T.dark)
  S(f[2], 3, 8, T.dark); S(f[2], 3, 9, T.dark); S(f[2], 4, 10, T.dark)
  return f
}

// 讲课/教学：黑板+人物讲课+学生
function sceneTeach(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.white)
    // 黑板（深绿色）
    for (let r = 1; r <= 7; r++) for (let col = 2; col <= 21; col++) S(fr, r, col, T.teal)
    S(fr, 1, 2, T.brown); S(fr, 7, 2, T.brown); S(fr, 1, 21, T.brown); S(fr, 7, 21, T.brown)
    // 粉笔字
    S(fr, 3, 5, T.white); S(fr, 3, 6, T.white); S(fr, 3, 7, T.white)
    S(fr, 4, 10, T.white); S(fr, 5, 15, T.white); S(fr, 5, 16, T.white)
    drawGround(fr, T.brown)
  })
  // 老师站在黑板前 y=8
  drawPerson(f[0], 10, 8, T.hair_dark, T.skin, T.cloth_blue, 'front', 'happy', 'stand')
  drawPerson(f[1], 10, 8, T.hair_dark, T.skin, T.cloth_blue, 'front', 'happy', 'armsup')
  drawPerson(f[2], 10, 8, T.hair_dark, T.skin, T.cloth_blue, 'front', 'happy', 'stand')
  drawPerson(f[3], 10, 8, T.hair_dark, T.skin, T.cloth_blue, 'front', 'happy', 'armsup')
  // 粉笔（在手上）
  f.forEach((fr, i) => { if (i % 2 === 1) S(fr, 10, 7, T.white) })
  // 学生（坐在下方，小一点的头）
  f.forEach(fr => {
    S(fr, 15, 3, T.hair_dark); S(fr, 16, 3, T.skin); S(fr, 16, 4, T.skin); S(fr, 16, 2, T.hair_dark); S(fr, 16, 5, T.hair_dark)
    S(fr, 15, 8, T.hair_light); S(fr, 16, 8, T.skin); S(fr, 16, 9, T.skin); S(fr, 16, 7, T.hair_light); S(fr, 16, 10, T.hair_light)
    S(fr, 15, 16, T.hair_dark); S(fr, 16, 16, T.skin); S(fr, 16, 17, T.skin); S(fr, 16, 15, T.hair_dark); S(fr, 16, 18, T.hair_dark)
    // 课桌
    for (let col = 1; col <= 6; col++) S(fr, 17, col, T.brown)
    for (let col = 14; col <= 19; col++) S(fr, 17, col, T.brown)
  })
  return f
}

// 签售/出书：人物坐在桌前签名，桌上有书
function sceneBookSign(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.peach)
    drawGround(fr, T.brown)
  })
  // 桌子（在人物前面）桌面y=14
  // 人物坐着 y=10
  drawPerson(f[0], 9, 10, T.hair_dark, T.skin, T.cloth_red, 'front', 'happy', 'sit')
  drawPerson(f[1], 9, 10, T.hair_dark, T.skin, T.cloth_red, 'front', 'happy', 'sit')
  drawPerson(f[2], 9, 10, T.hair_dark, T.skin, T.cloth_red, 'front', 'happy', 'sit')
  drawPerson(f[3], 9, 10, T.hair_dark, T.skin, T.cloth_red, 'front', 'happy', 'sit')
  // 桌子（后画遮挡）
  f.forEach(fr => {
    for (let col = 5; col <= 18; col++) S(fr, 14, col, T.brown)
    S(fr, 15, 5, T.dark); S(fr, 15, 18, T.dark); S(fr, 16, 5, T.dark); S(fr, 16, 18, T.dark)
  })
  // 书堆（桌上）
  f.forEach((fr, i) => {
    S(fr, 12, 7, T.cloth_blue); S(fr, 12, 8, T.cloth_blue); S(fr, 13, 7, T.cloth_blue); S(fr, 13, 8, T.cloth_blue)
    S(fr, 13, 7, T.white); S(fr, 13, 8, T.white)
    S(fr, 12, 15, T.bright_red); S(fr, 12, 16, T.bright_red); S(fr, 13, 15, T.bright_red); S(fr, 13, 16, T.bright_red)
    S(fr, 13, 15, T.gold); S(fr, 13, 16, T.gold)
    // 笔（在手上，签名动作）
    if (i % 2 === 0) S(fr, 12, 11, T.dark)
  })
  // 排队的读者（小点头）
  f.forEach(fr => {
    S(fr, 16, 20, T.hair_dark); S(fr, 17, 20, T.cloth_blue); S(fr, 17, 21, T.cloth_blue)
    S(fr, 16, 22, T.hair_light); S(fr, 17, 22, T.cloth_red); S(fr, 17, 23, T.cloth_red)
  })
  // 星星/好评
  S(f[1], 4, 4, T.gold); S(f[3], 3, 6, T.gold); S(f[3], 5, 3, T.gold)
  return f
}

// 网暴：人物看手机，周围愤怒符号
function sceneCyberbully(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.gray)
    drawGround(fr, T.dark)
  })
  // 人物坐在沙发上看手机 y=10，难过表情
  drawSofa(f[0], T.brown); drawPerson(f[0], 9, 9, T.hair_dark, T.skin, T.cloth_blue, 'front', 'sad', 'sit')
  drawSofa(f[1], T.brown); drawPerson(f[1], 9, 9, T.hair_dark, T.skin, T.cloth_blue, 'front', 'sad', 'sit')
  drawSofa(f[2], T.brown); drawPerson(f[2], 9, 9, T.hair_dark, T.skin, T.cloth_blue, 'front', 'sad', 'sit')
  drawSofa(f[3], T.gray); drawPerson(f[3], 9, 9, T.hair_dark, T.skin, T.dark, 'front', 'angry', 'sit')
  // 手机（发光的屏幕）
  f.forEach(fr => {
    S(fr, 11, 8, T.dark); S(fr, 11, 9, T.dark); S(fr, 12, 8, T.dark); S(fr, 12, 9, T.dark)
    S(fr, 11, 8, T.white); S(fr, 11, 9, T.white)
  })
  // 愤怒符号/恶评（红色感叹号和叉号围绕）
  S(f[0], 3, 3, T.bright_red); S(f[0], 3, 20, T.bright_red)
  S(f[0], 5, 6, T.bright_red); S(f[0], 6, 17, T.bright_red)
  S(f[1], 2, 5, T.bright_red); S(f[1], 4, 18, T.bright_red); S(f[1], 6, 2, T.bright_red)
  S(f[2], 3, 2, T.bright_red); S(f[2], 3, 21, T.bright_red); S(f[2], 5, 19, T.bright_red); S(f[2], 7, 4, T.bright_red)
  S(f[3], 1, 4, T.bright_red); S(f[3], 2, 12, T.bright_red); S(f[3], 4, 19, T.bright_red); S(f[3], 6, 7, T.bright_red); S(f[3], 7, 16, T.bright_red)
  // 红色X和感叹号
  function drawAnger(fr: PixelFrame, r: number, c: number) {
    S(fr, r, c, T.bright_red); S(fr, r, c+1, T.bright_red)
    S(fr, r+1, c, T.bright_red); S(fr, r+2, c+1, T.bright_red)
  }
  drawAnger(f[1], 3, 3); drawAnger(f[2], 2, 18); drawAnger(f[3], 4, 2)
  return f
}

// 机场告别/飞机窗：飞机窗外的云+靠窗坐着的人
function sceneAirport(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    // 机舱内部（深色）
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.dark)
    // 椭圆形窗户
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
      if (dr*dr + dc*dc <= 4) S(fr, 8+dr, 12+dc, T.sky)
    }
    S(fr, 8, 12, T.dark); S(fr, 8, 13, T.dark); S(fr, 8, 14, T.dark) // 窗框
    S(fr, 7, 12, T.dark); S(fr, 7, 13, T.dark); S(fr, 7, 14, T.dark)
    S(fr, 9, 12, T.dark); S(fr, 9, 13, T.dark); S(fr, 9, 14, T.dark)
    S(fr, 10, 13, T.dark)
    // 窗外蓝天白云（透过窗户）
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
      if (dr*dr + dc*dc <= 4) S(fr, 8+dr, 12+dc, T.sky)
    }
    // 云朵在窗外
    S(fr, 7, 13, T.white); S(fr, 8, 12, T.white); S(fr, 8, 14, T.white)
    S(fr, 9, 13, T.white)
  })
  // 人物坐在靠窗座位 y=10（侧脸朝右看窗外）
  drawPerson(f[0], 3, 10, T.hair_dark, T.skin, T.cloth_blue, 'right', 'sad', 'sit')
  drawPerson(f[1], 3, 10, T.hair_dark, T.skin, T.cloth_blue, 'right', 'normal', 'sit')
  drawPerson(f[2], 3, 10, T.hair_dark, T.skin, T.cloth_red, 'right', 'sad', 'sit')
  drawPerson(f[3], 3, 10, T.hair_dark, T.skin, T.cloth_red, 'right', 'normal', 'sit')
  // 座椅（人物后面的椅背）
  f.forEach(fr => {
    for (let col = 0; col <= 4; col++) { S(fr, 15, col, T.brown); S(fr, 16, col, T.brown) }
    S(fr, 16, 0, T.dark); S(fr, 16, 4, T.dark)
  })
  // 飞机飞过（窗外小飞机或云朵移动）
  S(f[1], 6, 14, T.white); S(f[1], 7, 15, T.white); S(f[1], 8, 14, T.white)
  S(f[3], 9, 12, T.white); S(f[3], 8, 11, T.white)
  // 眼泪（告别场景）
  S(f[0], 11, 6, T.sky); S(f[2], 12, 6, T.sky)
  return f
}

// 兴趣爱好（画画/烘焙/弹琴）：人物在画架前画画
function sceneHobby(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.white)
    drawGround(fr, T.brown)
    // 画架（三角架）
    S(fr, 4, 17, T.brown); S(fr, 5, 17, T.brown); S(fr, 6, 17, T.brown)
    S(fr, 7, 16, T.brown); S(fr, 7, 18, T.brown)
    S(fr, 8, 15, T.brown); S(fr, 8, 19, T.brown)
    S(fr, 9, 15, T.brown); S(fr, 9, 19, T.brown)
  })
  // 画布（白色带色块）
  f.forEach(fr => {
    for (let r = 5; r <= 8; r++) for (let col = 15; col <= 19; col++) S(fr, r, col, T.white)
    S(fr, 5, 15, T.brown); S(fr, 8, 15, T.brown); S(fr, 5, 19, T.brown); S(fr, 8, 19, T.brown)
    // 色块（画作内容）
    S(fr, 6, 16, T.sky); S(fr, 6, 17, T.teal); S(fr, 7, 17, T.gold); S(fr, 7, 18, T.bright_red)
  })
  // 人物坐着画画 y=10
  drawPerson(f[0], 7, 10, T.hair_light, T.skin, T.peach, 'right', 'happy', 'sit')
  drawPerson(f[1], 7, 10, T.hair_light, T.skin, T.peach, 'right', 'happy', 'sit')
  drawPerson(f[2], 7, 10, T.hair_light, T.skin, T.cloth_red, 'right', 'happy', 'sit')
  drawPerson(f[3], 7, 10, T.hair_light, T.skin, T.cloth_red, 'right', 'happy', 'sit')
  // 画笔（在手上）
  f.forEach((fr, i) => {
    S(fr, 12, 13, T.brown);
    if (i % 2 === 0) S(fr, 11, 14, T.bright_red)
    else S(fr, 11, 14, T.sky)
  })
  // 音符/创意符号（表示享受）
  S(f[1], 3, 4, T.gold); S(f[3], 2, 6, T.gold); S(f[3], 4, 3, T.purple)
  return f
}

// 地铁/高铁靠窗：人物坐着看窗外，窗外景色后退
function sceneMetro(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.gray)
    // 大窗户（右半侧）
    for (let r = 1; r <= 13; r++) for (let col = 12; col <= 22; col++) S(fr, r, col, T.dark)
    S(fr, 0, 12, T.gray); S(fr, 14, 12, T.gray); S(fr, 0, 22, T.gray); S(fr, 14, 22, T.gray)
    // 窗框竖条
    for (let r = 1; r <= 13; r++) { S(fr, r, 17, T.gray) }
    drawGround(fr, T.dark)
  })
  // 窗外景色（深色中的灯光/建筑轮廓，逐帧移动表示速度）
  // 窗外景色用深色+偶尔的黄色灯光
  f.forEach(fr => {
    for (let r = 2; r <= 13; r++) for (let col = 13; col <= 21; col++) {
      if (col !== 17) S(fr, r, col, T.dark)
    }
  })
  // 移动的灯光
  S(f[0], 5, 14, T.gold); S(f[0], 8, 19, T.gold); S(f[0], 11, 15, T.gold)
  S(f[1], 5, 16, T.gold); S(f[1], 7, 20, T.gold); S(f[1], 10, 13, T.gold)
  S(f[2], 5, 13, T.gold); S(f[2], 9, 18, T.gold); S(f[2], 11, 20, T.gold)
  S(f[3], 5, 18, T.gold); S(f[3], 8, 14, T.gold); S(f[3], 10, 19, T.gold)
  // 人物坐着靠窗 y=10（侧脸朝右看窗外）
  drawPerson(f[0], 5, 10, T.hair_dark, T.skin, T.cloth_blue, 'right', 'normal', 'sit')
  drawPerson(f[1], 5, 10, T.hair_dark, T.skin, T.cloth_blue, 'right', 'sad', 'sit')
  drawPerson(f[2], 5, 10, T.hair_dark, T.skin, T.cloth_blue, 'right', 'normal', 'sit')
  drawPerson(f[3], 5, 10, T.hair_dark, T.skin, T.cloth_blue, 'right', 'sad', 'sit')
  // 座椅
  f.forEach(fr => {
    for (let col = 3; col <= 11; col++) S(fr, 15, col, T.brown)
    S(fr, 16, 3, T.dark); S(fr, 16, 11, T.dark)
  })
  // 耳机线
  f.forEach(fr => {
    S(fr, 11, 7, T.white); S(fr, 12, 7, T.white); S(fr, 13, 7, T.white)
  })
  return f
}

// 便利店门口独处：站在路灯下喝啤酒
function sceneConvenienceStore(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.dark)
    // 便利店灯光（右侧，亮白/青色）
    for (let r = 2; r <= 14; r++) for (let col = 15; col <= 22; col++) S(fr, r, col, T.teal)
    // 招牌条纹（红蓝白）
    S(fr, 2, 15, T.bright_red); S(fr, 2, 16, T.bright_red); S(fr, 2, 17, T.white); S(fr, 2, 18, T.white)
    S(fr, 2, 19, T.cloth_blue); S(fr, 2, 20, T.cloth_blue)
    // 路灯（左侧）
    S(fr, 1, 5, T.gold); S(fr, 1, 4, T.gold); S(fr, 1, 6, T.gold)
    S(fr, 2, 5, T.gold); S(fr, 3, 5, T.gold)
    for (let r = 4; r <= 15; r++) S(fr, r, 5, T.gray)
    // 灯光光晕
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
      if (dr*dr + dc*dc <= 4) S(fr, 2+dr, 5+dc, T.gold)
    }
    S(fr, 3, 5, T.gold) // 灯泡
    drawGround(fr, T.dark)
  })
  // 人物站在路灯下 y=11，手持啤酒罐
  drawPerson(f[0], 8, 11, T.hair_dark, T.skin, T.cloth_blue, 'front', 'sad', 'stand')
  drawPerson(f[1], 8, 11, T.hair_dark, T.skin, T.cloth_blue, 'front', 'normal', 'stand')
  drawPerson(f[2], 8, 11, T.hair_dark, T.skin, T.cloth_blue, 'front', 'sad', 'stand')
  drawPerson(f[3], 8, 11, T.hair_dark, T.skin, T.cloth_blue, 'front', 'normal', 'stand')
  // 啤酒罐（在手上）
  f.forEach(fr => {
    S(fr, 14, 6, T.gold); S(fr, 15, 6, T.gold); S(fr, 14, 7, T.white); S(fr, 15, 7, T.white)
  })
  return f
}

// ========== V13: 卡片选择新场景 ==========

// 辞职/递辞职信
function sceneResign(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.white)
    drawGround(fr, T.gray)
    // 窗户
    for (let r = 2; r <= 7; r++) for (let col = 16; col <= 22; col++) S(fr, r, col, T.sky)
    S(fr, 2, 16, T.brown); S(fr, 7, 16, T.brown)
  })
  // 你从递信到转身离开
  drawPerson(f[0], 5, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'normal', 'stand')
  drawPerson(f[1], 5, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'normal', 'armsup')
  drawPerson(f[2], 5, 11, T.hair_dark, T.skin, T.cloth_red, 'left', 'happy', 'walk2')
  drawPerson(f[3], 3, 11, T.hair_dark, T.skin, T.cloth_red, 'left', 'happy', 'walk1')
  // 辞职信信封（白色+红封条），递出→放下→人走了信留在桌上
  f.forEach(fr => {
    // 桌子（右侧）
    for (let col = 13; col <= 22; col++) S(fr, 14, col, T.brown)
    S(fr, 15, 14, T.brown); S(fr, 15, 21, T.brown); S(fr, 16, 14, T.dark); S(fr, 16, 21, T.dark)
  })
  S(f[0], 10, 8, T.white); S(f[0], 11, 8, T.white); S(f[0], 10, 9, T.white); S(f[0], 11, 9, T.white)
  S(f[1], 12, 9, T.white); S(f[1], 13, 9, T.white); S(f[1], 12, 10, T.white); S(f[1], 13, 10, T.white); S(f[1], 12, 9, T.bright_red)
  S(f[2], 13, 16, T.white); S(f[2], 13, 17, T.white); S(f[2], 13, 18, T.white); S(f[2], 13, 16, T.bright_red)
  S(f[3], 13, 16, T.white); S(f[3], 13, 17, T.white); S(f[3], 13, 18, T.white); S(f[3], 13, 16, T.bright_red)
  // 自由小鸟飞出
  drawBird(f[2], 3, 2, 0); drawBird(f[3], 2, 6, 1)
  // 门（左侧，第3、4帧你走出门）
  S(f[2], 4, 0, T.brown); for (let r = 5; r <= 16; r++) S(f[2], r, 0, T.brown); S(f[2], 10, 1, T.gold)
  S(f[3], 4, 0, T.sky); for (let r = 5; r <= 16; r++) S(f[3], r, 0, T.sky) // 门开了
  return f
}

// 体检/医院
function sceneHealthCheck(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.white)
    drawGround(fr, T.theme)
    // 医院十字标志（右上角）
    S(fr, 1, 20, T.bright_red); S(fr, 2, 20, T.bright_red); S(fr, 3, 20, T.bright_red)
    S(fr, 2, 19, T.bright_red); S(fr, 2, 21, T.bright_red)
  })
  // 医生坐在诊桌后（先画人）
  drawPerson(f[0], 15, 10, T.hair_dark, T.skin, T.white, 'left', 'normal', 'sit')
  drawPerson(f[1], 15, 10, T.hair_dark, T.skin, T.white, 'left', 'happy', 'sit')
  drawPerson(f[2], 15, 10, T.hair_dark, T.skin, T.white, 'left', 'happy', 'sit')
  drawPerson(f[3], 15, 10, T.hair_dark, T.skin, T.white, 'left', 'happy', 'sit')
  // 你从紧张到开心，体检完离开
  drawPerson(f[0], 4, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'normal', 'stand')
  drawPerson(f[1], 4, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'surprised', 'stand')
  drawPerson(f[2], 3, 11, T.hair_dark, T.skin, T.cloth_blue, 'left', 'happy', 'walk2')
  drawPerson(f[3], 1, 11, T.hair_dark, T.skin, T.cloth_red, 'left', 'happy', 'walk1')
  // 诊桌（画在人前面遮挡）
  f.forEach((fr, i) => {
    for (let col = 9; col <= 22; col++) { S(fr, 13, col, T.brown); S(fr, 14, col, T.brown) }
    S(fr, 15, 10, T.brown); S(fr, 15, 21, T.brown); S(fr, 16, 10, T.dark); S(fr, 16, 21, T.dark)
    // 体检表
    for (let col = 11; col <= 14; col++) { S(fr, 12, col, T.white) }
    if (i >= 2) S(fr, 12, 13, T.teal) // 勾选标记
    // 听诊器
    S(fr, 12, 16, T.teal); S(fr, 12, 17, T.teal)
  })
  return f
}

// 心理咨询/治疗
function sceneTherapy(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.peach)
    drawGround(fr, T.brown)
    // 咨询师沙发（左）
    for (let col = 1; col <= 8; col++) { S(fr, 10, col, T.teal); S(fr, 11, col, T.teal); S(fr, 12, col, T.teal) }
    S(fr, 9, 1, T.teal); S(fr, 9, 8, T.teal)
    // 来访者沙发（右）
    for (let col = 15; col <= 22; col++) { S(fr, 10, col, T.cloth_blue); S(fr, 11, col, T.cloth_blue); S(fr, 12, col, T.cloth_blue) }
    S(fr, 9, 15, T.cloth_blue); S(fr, 9, 22, T.cloth_blue)
    // 中间小茶几
    for (let col = 10; col <= 13; col++) S(fr, 12, col, T.brown)
    S(fr, 13, 10, T.brown); S(fr, 13, 13, T.brown); S(fr, 14, 10, T.dark); S(fr, 14, 13, T.dark)
    // 纸巾盒
    S(fr, 11, 11, T.white); S(fr, 11, 12, T.white); S(fr, 10, 11, T.white); S(fr, 10, 12, T.white)
  })
  // 咨询师（戴眼镜=额外点，坐左侧沙发）
  drawPerson(f[0], 3, 8, T.hair_dark, T.skin, T.teal, 'right', 'normal', 'sit')
  drawPerson(f[1], 3, 8, T.hair_dark, T.skin, T.teal, 'right', 'happy', 'sit')
  drawPerson(f[2], 3, 8, T.hair_dark, T.skin, T.teal, 'right', 'happy', 'sit')
  drawPerson(f[3], 3, 8, T.hair_dark, T.skin, T.teal, 'right', 'happy', 'sit')
  // 来访者（从难过到释然）
  drawPerson(f[0], 17, 8, T.hair_light, T.skin, T.cloth_blue, 'left', 'sad', 'sit')
  drawPerson(f[1], 17, 8, T.hair_light, T.skin, T.cloth_blue, 'left', 'sad', 'sit')
  drawPerson(f[2], 17, 8, T.hair_light, T.skin, T.cloth_blue, 'left', 'normal', 'sit')
  drawPerson(f[3], 17, 8, T.hair_light, T.skin, T.cloth_blue, 'left', 'happy', 'sit')
  // 对话气泡
  S(f[1], 7, 8, T.white); S(f[1], 7, 9, T.white); S(f[1], 7, 10, T.white)
  S(f[2], 6, 16, T.white); S(f[2], 6, 17, T.white); S(f[2], 6, 18, T.white)
  // 爱心/释然
  drawHeart(f[3], 5, 18, T.bright_red, 0)
  return f
}

// 外卖骑手/骑电动车送餐
function sceneRider(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.sky)
    drawGround(fr, T.gray)
    // 路边建筑
    for (let r = 4; r <= 16; r++) for (let col = 0; col <= 4; col++) S(fr, r, col, T.theme)
    for (let r = 6; r <= 14; r++) { S(fr, r, 1, T.sky); S(fr, r, 3, T.sky) }
    // 路灯
    S(fr, 3, 20, T.gold); for (let r = 4; r <= 15; r++) S(fr, r, 20, T.gray)
  })
  // 先画外卖箱（在人后面），再画骑手，再画电动车车身覆盖腿部
  f.forEach((fr, i) => {
    const bx = 3 + i * 3
    const px = bx + 1
    // 外卖箱（后座蓝色，在人后面）
    S(fr, 11, bx, T.cloth_blue); S(fr, 12, bx, T.cloth_blue); S(fr, 11, bx+1, T.cloth_blue); S(fr, 12, bx+1, T.cloth_blue)
    S(fr, 11, bx, T.gold) // logo
    // 骑手
    drawPerson(fr, px, 10, T.bright_red, T.skin, T.bright_red, 'right', 'happy', 'sit')
    // 电动车车身（画在人前面，覆盖腿部和椅子白色）
    for (let col = bx; col <= bx+6; col++) { S(fr, 13, col, T.dark); S(fr, 14, col, T.dark); S(fr, 15, col, T.dark) }
    S(fr, 16, bx+1, T.dark); S(fr, 16, bx+5, T.dark) // 轮子
    // 车把（在人前方）
    S(fr, 11, bx+5, T.dark); S(fr, 11, bx+6, T.dark); S(fr, 12, bx+6, T.dark)
  })
  // 速度线
  S(f[1], 10, 2, T.white); S(f[1], 12, 1, T.white)
  S(f[2], 10, 4, T.white); S(f[2], 12, 3, T.white); S(f[3], 10, 7, T.white); S(f[3], 12, 6, T.white)
  return f
}

// 摆摊/小摊贩
function sceneVendor(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.dark)
    drawGround(fr, T.dark)
    // 路灯
    S(fr, 2, 2, T.gold); for (let r = 3; r <= 15; r++) S(fr, r, 2, T.gray)
    S(fr, 2, 21, T.gold); for (let r = 3; r <= 15; r++) S(fr, r, 21, T.gray)
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
      if (dr*dr + dc*dc <= 4) { S(fr, 2+dr, 2+dc, T.gold); S(fr, 2+dr, 21+dc, T.gold) }
    }
  })
  // 摊主站在摊后（先画人，再画摊位遮挡）
  drawPerson(f[0], 9, 11, T.hair_dark, T.skin, T.cloth_red, 'front', 'happy', 'stand')
  drawPerson(f[1], 9, 11, T.hair_dark, T.skin, T.cloth_red, 'front', 'happy', 'armsup')
  drawPerson(f[2], 9, 11, T.hair_dark, T.skin, T.white, 'front', 'happy', 'cheer')
  drawPerson(f[3], 9, 11, T.hair_dark, T.skin, T.white, 'front', 'happy', 'cheer')
  // 小摊车（画在人前面遮挡下半身）
  f.forEach(fr => {
    // 顶棚条纹（红白）
    S(fr, 7, 5, T.bright_red); S(fr, 7, 6, T.white); S(fr, 7, 7, T.bright_red); S(fr, 7, 8, T.white)
    S(fr, 7, 9, T.bright_red); S(fr, 7, 10, T.white); S(fr, 7, 11, T.bright_red); S(fr, 7, 12, T.white)
    S(fr, 7, 13, T.bright_red); S(fr, 7, 14, T.white); S(fr, 7, 15, T.bright_red); S(fr, 7, 16, T.white)
    S(fr, 7, 17, T.bright_red); S(fr, 7, 18, T.white)
    // 支柱
    S(fr, 8, 5, T.brown); S(fr, 9, 5, T.brown); S(fr, 10, 5, T.brown)
    S(fr, 8, 18, T.brown); S(fr, 9, 18, T.brown); S(fr, 10, 18, T.brown)
    // 摊位台面
    for (let col = 4; col <= 19; col++) { S(fr, 13, col, T.brown); S(fr, 14, col, T.brown) }
    // 食物（烤肠=金色）
    S(fr, 12, 9, T.gold); S(fr, 12, 10, T.gold); S(fr, 12, 11, T.gold); S(fr, 12, 12, T.gold); S(fr, 12, 13, T.gold); S(fr, 12, 14, T.gold)
    S(fr, 11, 10, T.bright_red); S(fr, 11, 13, T.bright_red) // 热气/香气
    // 轮子
    S(fr, 15, 6, T.dark); S(fr, 15, 17, T.dark); S(fr, 16, 6, T.dark); S(fr, 16, 17, T.dark)
  })
  // 顾客从右边走来
  drawPerson(f[0], 20, 11, T.hair_light, T.skin, T.cloth_blue, 'left', 'normal', 'stand')
  drawPerson(f[1], 19, 11, T.hair_light, T.skin, T.cloth_blue, 'left', 'happy', 'walk2')
  drawPerson(f[2], 18, 11, T.hair_light, T.skin, T.cloth_blue, 'left', 'happy', 'walk1')
  // 顾客拿到食物开心离开（第3帧顾客在左边走远）
  drawPerson(f[3], 2, 11, T.hair_light, T.skin, T.cloth_blue, 'right', 'happy', 'walk2')
  // 金币/交易
  S(f[2], 12, 17, T.gold); S(f[3], 12, 17, T.gold); S(f[3], 11, 17, T.gold)
  return f
}

// 考公/备考/书桌前学习
function sceneStudyExam(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.white)
    drawGround(fr, T.brown)
    // 书桌
    for (let col = 3; col <= 18; col++) S(fr, 13, col, T.brown)
    S(fr, 14, 4, T.brown); S(fr, 14, 17, T.brown); S(fr, 15, 4, T.dark); S(fr, 15, 17, T.dark)
    // 台灯（右侧）
    S(fr, 9, 16, T.gold); S(fr, 10, 16, T.brown); S(fr, 11, 16, T.brown); S(fr, 12, 16, T.brown)
    for (let dr = -1; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
      if (dr*dr + dc*dc <= 4) S(fr, 9+dr, 16+dc, T.gold)
    }
    S(fr, 9, 16, T.gold)
    // 窗外月亮（表示熬夜）
    S(fr, 2, 2, T.gold); S(fr, 2, 3, T.gold); S(fr, 1, 2, T.gold); S(fr, 3, 2, T.gold)
  })
  // 人物坐姿看书（先画人再画桌子遮挡）
  drawPerson(f[0], 8, 10, T.hair_dark, T.skin, T.cloth_blue, 'front', 'normal', 'sit')
  drawPerson(f[1], 8, 10, T.hair_dark, T.skin, T.cloth_blue, 'front', 'normal', 'sit')
  drawPerson(f[2], 8, 10, T.hair_dark, T.skin, T.cloth_blue, 'front', 'normal', 'type')
  drawPerson(f[3], 8, 10, T.hair_dark, T.skin, T.cloth_red, 'front', 'happy', 'sit')
  // 书本/试卷（在桌上）
  f.forEach((fr, i) => {
    for (let col = 7; col <= 12; col++) { S(fr, 12, col, T.white); S(fr, 11, col, T.white) }
    S(fr, 11, 8, T.dark); S(fr, 11, 10, T.dark); S(fr, 12, 9, T.dark) // 字
    if (i >= 2) {
      S(fr, 11, 13, T.white); S(fr, 11, 14, T.white); S(fr, 12, 13, T.white); S(fr, 12, 14, T.white)
      S(fr, 11, 13, T.dark)
    }
  })
  // 咖啡杯
  f.forEach(fr => drawCup(fr, 14, 11, T.brown))
  // 最后一帧打勾（通过了！）
  S(f[3], 10, 10, T.teal); S(f[3], 9, 11, T.teal); drawConfetti(f[3], 1, [T.bright_red, T.gold, T.cloth_blue, T.teal])
  return f
}

// 直播/拍视频/自媒体
function sceneStreaming(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.dark)
    drawGround(fr, T.dark)
    // 补光灯（左右）
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
      if (dr*dr + dc*dc <= 4) { S(fr, 5+dr, 2+dc, T.gold); S(fr, 5+dr, 21+dc, T.gold) }
    }
    S(fr, 5, 2, T.white); S(fr, 5, 21, T.white)
    for (let r = 7; r <= 14; r++) { S(fr, r, 2, T.gray); S(fr, r, 21, T.gray) }
  })
  // 人物坐在手机前（手机在三角架上）
  drawPerson(f[0], 9, 10, T.hair_light, T.skin, T.cloth_red, 'front', 'happy', 'sit')
  drawPerson(f[1], 9, 10, T.hair_light, T.skin, T.cloth_red, 'front', 'happy', 'armsup')
  drawPerson(f[2], 9, 10, T.hair_light, T.skin, T.peach, 'front', 'happy', 'cheer')
  drawPerson(f[3], 9, 10, T.hair_light, T.skin, T.peach, 'front', 'happy', 'cheer')
  // 手机/直播画面（三脚架上）
  f.forEach(fr => {
    S(fr, 8, 13, T.gray); S(fr, 9, 13, T.gray); S(fr, 10, 13, T.gray); S(fr, 11, 13, T.gray)
    for (let col = 14; col <= 17; col++) { S(fr, 8, col, T.dark); S(fr, 9, col, T.sky); S(fr, 10, col, T.sky); S(fr, 11, col, T.dark) }
    S(fr, 9, 15, T.skin); S(fr, 9, 16, T.cloth_red) // 屏幕里的小人
    S(fr, 12, 15, T.gray); S(fr, 13, 15, T.gray)
  })
  // 直播数据/爱心弹幕
  S(f[1], 3, 5, T.bright_red); S(f[1], 4, 19, T.gold)
  drawHeart(f[2], 2, 6, T.bright_red, 0); drawHeart(f[2], 3, 18, T.gold, 0)
  drawHeart(f[3], 2, 4, T.bright_red, 1); drawHeart(f[3], 4, 17, T.gold, 1); S(f[3], 6, 10, T.gold)
  return f
}

// 做义工/志愿/帮助他人
function sceneVolunteer(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.sky)
    drawGround(fr, T.theme)
    drawCloud(fr, 2, 3, false); drawCloud(fr, 3, 16, true)
    drawTree(fr, 0, 7); drawTree(fr, 0, 20)
    // 社区中心/房子（背景）
    drawSmallHouse(fr, 14, 7, T.bright_red, T.white)
  })
  // 志愿者（穿红马甲=cloth_red over cloth_blue? 用cloth_red）
  drawPerson(f[0], 5, 11, T.hair_dark, T.skin, T.cloth_red, 'right', 'happy', 'stand')
  drawPerson(f[1], 7, 11, T.hair_dark, T.skin, T.cloth_red, 'right', 'happy', 'walk1')
  drawPerson(f[2], 9, 11, T.hair_dark, T.skin, T.cloth_red, 'right', 'happy', 'walk2')
  drawPerson(f[3], 10, 11, T.hair_dark, T.skin, T.cloth_red, 'right', 'happy', 'stand')
  // 老人（白发=gray，接受帮助）
  drawPerson(f[0], 16, 11, T.gray, T.skin, T.brown, 'left', 'normal', 'stand')
  drawPerson(f[1], 15, 11, T.gray, T.skin, T.brown, 'left', 'happy', 'stand')
  drawPerson(f[2], 14, 11, T.gray, T.skin, T.brown, 'left', 'happy', 'stand')
  drawPerson(f[3], 13, 11, T.gray, T.skin, T.brown, 'left', 'happy', 'stand')
  // 爱心在两人之间
  drawHeart(f[2], 8, 11, T.bright_red, 0)
  drawHeart(f[3], 6, 10, T.bright_red, 1)
  // 志愿袖标/袋子
  S(f[0], 12, 6, T.bright_red); S(f[1], 12, 8, T.bright_red); S(f[2], 12, 10, T.bright_red); S(f[3], 12, 11, T.white)
  return f
}

// 拆快递/包裹
function scenePackage(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.white)
    drawGround(fr, T.brown)
    // 门口/玄关
    for (let col = 0; col <= 23; col++) S(fr, 16, col, T.brown)
    S(fr, 5, 0, T.brown); S(fr, 5, 1, T.brown)
  })
  // 人物站着拆快递
  drawPerson(f[0], 3, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'normal', 'stand')
  drawPerson(f[1], 3, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'stand')
  drawPerson(f[2], 3, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'armsup')
  drawPerson(f[3], 3, 11, T.hair_dark, T.skin, T.peach, 'right', 'happy', 'cheer')
  // 快递盒（棕色纸箱）从完整到打开
  S(f[0], 13, 10, T.brown); S(f[0], 14, 10, T.brown); S(f[0], 13, 11, T.brown); S(f[0], 14, 11, T.brown)
  S(f[0], 13, 12, T.brown); S(f[0], 14, 12, T.brown); S(f[0], 13, 13, T.brown); S(f[0], 14, 13, T.brown)
  S(f[0], 12, 10, T.brown); S(f[0], 12, 11, T.brown); S(f[0], 12, 12, T.brown); S(f[0], 12, 13, T.brown)
  S(f[0], 12, 11, T.bright_red) // 封条
  // 第二帧：正在拆
  S(f[1], 12, 10, T.brown); S(f[1], 12, 11, T.brown); S(f[1], 12, 12, T.brown); S(f[1], 12, 13, T.brown)
  for (let col = 10; col <= 13; col++) { S(f[1], 13, col, T.brown); S(f[1], 14, col, T.brown) }
  S(f[1], 12, 11, T.bright_red)
  S(f[1], 11, 9, T.gray) // 剪刀
  // 第三帧：打开了
  for (let col = 10; col <= 14; col++) { S(f[2], 13, col, T.brown); S(f[2], 14, col, T.brown) }
  S(f[2], 12, 10, T.brown); S(f[2], 12, 14, T.brown)
  S(f[2], 11, 11, T.gold); S(f[2], 11, 12, T.gold); S(f[2], 11, 13, T.gold) // 金色物品露出
  // 第四帧：物品取出，闪亮
  for (let col = 10; col <= 14; col++) { S(f[3], 13, col, T.brown); S(f[3], 14, col, T.brown) }
  S(f[3], 12, 10, T.brown); S(f[3], 12, 14, T.brown)
  S(f[3], 9, 11, T.gold); S(f[3], 9, 12, T.gold); S(f[3], 9, 13, T.gold)
  S(f[3], 10, 11, T.gold); S(f[3], 10, 12, T.gold); S(f[3], 10, 13, T.gold)
  drawConfetti(f[3], 1, [T.gold, T.bright_red, T.teal, T.cloth_blue])
  // 剪刀（手上）
  S(f[0], 11, 7, T.gray); S(f[1], 11, 8, T.gray); S(f[2], 10, 7, T.gray); S(f[3], 11, 6, T.gray)
  return f
}

// 健身房撸铁/举哑铃
function sceneGym(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.gray)
    drawGround(fr, T.dark)
    // 镜子墙（右侧，白色反光）
    for (let r = 3; r <= 15; r++) for (let col = 17; col <= 22; col++) S(fr, r, col, T.sky)
    S(fr, 16, 17, T.dark); S(fr, 16, 22, T.dark)
    // 瑜伽球（左后方）
    S(fr, 12, 2, T.teal); S(fr, 11, 2, T.teal); S(fr, 11, 3, T.teal); S(fr, 12, 3, T.teal); S(fr, 13, 2, T.teal); S(fr, 13, 3, T.teal)
  })
  // 人物举哑铃（cheer动作=双手举起，从stand到cheer循环）
  drawPerson(f[0], 10, 11, T.hair_dark, T.skin, T.cloth_red, 'front', 'normal', 'stand')
  drawPerson(f[1], 10, 11, T.hair_dark, T.skin, T.cloth_red, 'front', 'normal', 'armsup')
  drawPerson(f[2], 10, 11, T.hair_dark, T.skin, T.cloth_red, 'front', 'happy', 'cheer')
  drawPerson(f[3], 10, 11, T.hair_dark, T.skin, T.cloth_red, 'front', 'happy', 'cheer')
  // 哑铃（黑色+银色杆）
  f.forEach((fr, i) => {
    const dy = i <= 1 ? 13 : 8
    S(fr, dy, 8, T.dark); S(fr, dy, 9, T.dark); S(fr, dy, 10, T.gray); S(fr, dy, 11, T.gray)
    S(fr, dy, 14, T.gray); S(fr, dy, 15, T.gray); S(fr, dy, 15, T.dark); S(fr, dy, 16, T.dark)
  })
  // 汗水（第2、3帧）
  S(f[1], 8, 13, T.sky); S(f[2], 7, 13, T.sky); S(f[2], 9, 8, T.sky); S(f[3], 7, 9, T.sky); S(f[3], 8, 14, T.sky)
  // 肌肉/星星
  S(f[3], 3, 5, T.gold); S(f[3], 4, 18, T.gold)
  return f
}

// 带父母/孝敬父母（陪父母旅游/吃饭）
function sceneTreatParents(): PixelFrame[] {
  const f: PixelFrame[] = [emptyCanvas(), emptyCanvas(), emptyCanvas(), emptyCanvas()]
  f.forEach(fr => {
    for (let r = 0; r < GY; r++) for (let col = 0; col < W; col++) S(fr, r, col, T.sky)
    drawGround(fr, T.theme)
    drawTree(fr, 1, 2); drawCloud(fr, 2, 18, false)
    // 远处山
    S(fr, 14, 10, T.gray); S(fr, 13, 11, T.gray); S(fr, 14, 11, T.gray); S(fr, 13, 12, T.gray)
    S(fr, 14, 12, T.gray); S(fr, 14, 13, T.gray); S(fr, 15, 13, T.gray)
  })
  // 三人同行：你（中间年轻）扶着两边父母
  // 父亲（左，白发）
  drawPerson(f[0], 3, 11, T.gray, T.skin, T.brown, 'right', 'happy', 'walk1')
  drawPerson(f[1], 4, 11, T.gray, T.skin, T.brown, 'right', 'happy', 'walk2')
  drawPerson(f[2], 5, 11, T.gray, T.skin, T.brown, 'right', 'happy', 'walk1')
  drawPerson(f[3], 6, 11, T.gray, T.skin, T.brown, 'right', 'happy', 'walk2')
  // 你（中间，年轻人，搀扶姿态）
  drawPerson(f[0], 8, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'walk2')
  drawPerson(f[1], 9, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'walk1')
  drawPerson(f[2], 10, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'walk2')
  drawPerson(f[3], 11, 11, T.hair_dark, T.skin, T.cloth_blue, 'right', 'happy', 'walk1')
  // 母亲（右，花白发=hair_light+gray，穿红色）
  drawPerson(f[0], 13, 11, T.hair_light, T.skin, T.cloth_red, 'right', 'happy', 'walk2')
  drawPerson(f[1], 14, 11, T.hair_light, T.skin, T.cloth_red, 'right', 'happy', 'walk1')
  drawPerson(f[2], 15, 11, T.hair_light, T.skin, T.cloth_red, 'right', 'happy', 'walk2')
  drawPerson(f[3], 16, 11, T.hair_light, T.skin, T.cloth_red, 'right', 'happy', 'walk1')
  // 爱心/花朵
  drawFlower(f[0], 16, 1, T.bright_red); drawFlower(f[1], 15, 1, T.gold)
  drawHeart(f[2], 6, 9, T.bright_red, 0); drawHeart(f[3], 5, 12, T.bright_red, 1)
  return f
}

// ===== 场景映射表 =====
export const STORYBOARD_SCENES: StoryboardScene[] = [
  // ===== 里程碑事件（priority: 10）=====
  { id: 'retire', category: 'career', name: '退休', keywords: ['决定退休','正式退休了','你决定退休了','告别职场','荣休','你要退休。这笔钱够你','退休了。不是因为你做完了','不工作活一辈子','办退休','退休手续办好了','彻底退休','享受退休','你退休了','你正式退休了','光荣退休','正式办理退休','办完了退休手续'], palette: CAREER_PALETTE, frames: sceneRetire(), frameDelay: 200, animIn: 'pop', priority: 10, requires: { minAge: 40 } },
  { id: 'graduate', category: 'life', name: '毕业', keywords: ['大学毕业','毕业典礼','毕业证','学位证','毕业证拿到','拿到学位证','毕业了','研究生毕业','本科毕业','硕士毕业','答辩通过'], palette: LIFE_PALETTE, frames: sceneGraduate(), frameDelay: 200, animIn: 'bounce', priority: 10, requires: { maxAge: 30 } },
  { id: 'first-job', category: 'career', name: '入职', keywords: ['入职','第一天上班','报到','初入职场','入职第一天','崭新的工牌','正式入职','走进写字楼','考公考上了','公示名单','入职报到','拿到offer','正式上班'], palette: CAREER_PALETTE, frames: sceneFirstJob(), frameDelay: 300, animIn: 'fade', priority: 10 },
  { id: 'first-salary', category: 'career', name: '第一笔工资', keywords: ['第一笔工资','第一份薪水','发工资','领到工资','工资到账','第一张工资条','第一次看到工资条','固定工资','工资入账','第一次发工资','第一个月工资','第一份工资'], palette: CAREER_PALETTE, frames: sceneFirstSalary(), frameDelay: 180, animIn: 'bounce', priority: 10 },
  { id: 'marry', category: 'family', name: '结婚', keywords: ['求婚','领证','领了证','我们结婚了','订婚','办婚礼','嫁给我吧','准备了戒指','掏出了戒指','我愿意','你怎么才问','第一次约会的地方','跨年夜烟花','看日出','结婚证','登记','拍登记照','彩礼','婚礼上你看着','你和TA结婚了','你们结婚了','娶你','嫁给你','结婚吧','你结婚了','就结婚了','你娶了','你嫁了','娶了她','嫁给他','娶了TA','嫁给TA','单膝跪地','两个人的日子'], palette: FAMILY_PALETTE, frames: sceneWedding(), frameDelay: 200, animIn: 'pop', priority: 10, requires: { dating: true, married: false } },
  { id: 'baby', category: 'family', name: '生子', keywords: ['宝宝出生','生孩子','当爸','当妈','新生儿','婴儿','出生','孩子降生','降生','怀孕','二胎','当爸爸','当妈妈','孩子出生','喜得贵子','喜得千金','第一次叫出','叫爸爸','叫妈妈','孩子第一次叫','一声啼哭','世界多了一个软肋'], palette: FAMILY_PALETTE, frames: sceneBaby(), frameDelay: 200, animIn: 'bounce', priority: 10, requires: { married: true } },
  { id: 'buy-house', category: 'family', name: '买房', keywords: ['交房','装修','搬进新家','房产证','买房了','签完那叠厚厚的贷款合同','钥匙冰凉','自己的几十平米','有你一盏灯','房贷合同','贷款合同','买了房','买一套房','买了一套','房贷','月供','还房贷','交房贷','房贷月供','二套房','第二套房','买了第二套房','商铺','买商铺','自己的房子','自己的阳台','签了一套小户型','总价50万','交了首付','付了首付','首付交了','首付付了'], palette: FAMILY_PALETTE, frames: sceneBuyHouse(), frameDelay: 200, animIn: 'fade', priority: 10 },
  { id: 'buy-car', category: 'life', name: '买车', keywords: ['提车','新车','第一辆车','喜提','提回一辆','开回一辆','提了一辆','轿车落地','代步车','买了经济代步车','买了中级轿车','买了豪车','开走B级车','买车了','第一次开车','自己开车','关上车门','4S店','二手车','把车卖了','卖了车','手里多了一笔现金','试驾','订车','买了车','买了一辆车'], palette: LIFE_PALETTE, frames: sceneBuyCar(), frameDelay: 200, animIn: 'slide', priority: 10 },
  { id: 'promotion', category: 'career', name: '升职加薪', keywords: ['晋升','提拔','升值','带项目','项目你来带','升职了','加了薪','推广给全部门','X总','给护理员涨工资','主动提出续约','提拔你','升你为主管','成为部门负责人','升了职','提拔为','晋升为','升职加薪','涨了薪','加薪了','晋升了','被提拔','得到提拔','升任','升迁','升职通知'], palette: CAREER_PALETTE, frames: scenePromotion(), frameDelay: 180, animIn: 'bounce', priority: 10, requires: { employed: true } },
  { id: 'gaokao', category: 'life', name: '高考', keywords: ['高考','高考结束','高考成绩','考上大学','录取通知书','金榜题名'], palette: LIFE_PALETTE, frames: sceneGaokao(), frameDelay: 300, animIn: 'pop', priority: 10, requires: { maxAge: 19 } },
  { id: 'startup', category: 'career', name: '创业', keywords: ['创业','开公司','下海','合伙创业','创业项目','创业了','创业公司','拉你入伙','合伙人','风投','All In','辞职全力','递了辞职信','全职投入','买那张单程票','递交了辞职信','共享办公室','MRR','被并购','公司被收购','分到了八百万','自己当老板','庆功宴','公司被收购','拿到八十万','创业很苦','活了下来','小股东','投了一万块','没辞职','庆功宴上','月流水','盈亏平衡','投了资','合伙人各让一步','业务线','分成两条业务线','关掉了核心产品','垂直行业','工业质检','细分领域','把公司卖给了大厂','收购协议','签字','加入了年轻人的团队','CTO兼导师','火炬传下去','拒了500万','跟投资人磨','200万换10%','保住了股份','全部预算砸进了投放','系统崩了两次','差评满天飞','裂变机制','分享生成结果','零投放成本','重新设计了付费墙','数据面板','增长曲线','关掉了核心产品','团队转了'], palette: CAREER_PALETTE, frames: sceneStartup(), frameDelay: 250, animIn: 'fade', priority: 10 },
  { id: 'ipo', category: 'career', name: '上市', keywords: ['IPO','敲钟','股票上市','公司上市','上市敲钟','挂牌上市'], palette: CAREER_PALETTE, frames: sceneIPO(), frameDelay: 180, animIn: 'bounce', priority: 10 },
  { id: 'digital-immortality', category: 'career', name: '数字永生', keywords: ['数字永生','意识上传','赛博永生','数字化永生','意识数字化'], palette: CAREER_PALETTE, frames: sceneDigitalImmortality(), frameDelay: 250, animIn: 'blink', priority: 10 },
  { id: 'fire', category: 'life', name: '财务自由', keywords: ['FIRE','财务自由','财务自由了','实现了财务自由','财富自由','财富自由的感觉','迈出了财务自由','Fire运动','财务独立','退休按钮已经亮起','攒够了退休的资本','你已经攒够了退休的资本','被动收入终于覆盖了所有开支','被动收入覆盖了所有开支','不工作也能活下去','不工作也能活得很好','这辈子够了','这笔钱够你不工作活一辈子'], palette: LIFE_PALETTE, frames: sceneFIRE(), frameDelay: 300, animIn: 'fade', priority: 10, requires: { minAge: 30 } },
  { id: 'lottery-win', category: 'life', name: '中奖', keywords: ['中奖了','头奖','五百万','彩票中奖','彩票','买了张彩票','中彩票','开奖日','中了一等奖','兑奖','末等奖','开奖','彩票店','彩票站','买了几注','机选','没中的彩票','中了头奖','路过彩票店','随手买了一注','彩票中了'], palette: LIFE_PALETTE, frames: sceneLottery(), frameDelay: 180, animIn: 'bounce', priority: 10 },
  // ===== 负面事件（priority: 9）=====
  { id: 'fired', category: 'career', name: '被裁', keywords: ['被裁','被公司裁员','被开除','被辞退','丢工作','被炒鱿鱼','收拾纸箱','公司倒闭','HR找你谈','被优化','裁员名单','裁员通知','被裁了','被开了','被辞了','丢了工作','炒了你','你被裁','你被开','你被辞'], palette: CAREER_PALETTE, frames: sceneFired(), frameDelay: 400, animIn: 'shake', priority: 9, requires: { employed: true } },
  { id: 'divorce', category: 'family', name: '离婚', keywords: ['离婚','离婚了','分开','离婚协议','婚姻破裂','财产分割','闹离婚','婚姻走到了尽头','冷暴力','民政局','朝相反方向走','合租的陌生人','去民政局','盖章','两本证'], palette: FAMILY_PALETTE, frames: sceneDivorce(), frameDelay: 400, animIn: 'shake', priority: 9, requires: { married: true } },
  { id: 'breakup', category: 'family', name: '分手', keywords: ['分手','失恋','被甩','感情破裂','我们分手吧','你们分手了','分手了','和平分手','最终还是分开了','要的东西不一样','因现实问题分手','谈不拢','彩礼和房子','分手了。没有谁对谁错'], palette: FAMILY_PALETTE, frames: sceneBreakup(), frameDelay: 400, animIn: 'fade', priority: 9, requires: { dating: true } },
  { id: 'couple-fight', category: 'family', name: '吵架', keywords: ['吵架','争吵','夫妻吵架','大吵一架','吵架摔东西','两口子吵架','激烈争吵','闹矛盾','冷战','吵了一架','吵了','吵架了','为钱的事又吵了一架','和老婆吵架','和对象吵架'], palette: FAMILY_PALETTE, frames: sceneCoupleFight(), frameDelay: 400, animIn: 'shake', priority: 9, requires: { dating: true } },
  { id: 'parent-sick', category: 'family', name: '父母生病', keywords: ['父母生病','父亲生病','母亲生病','爸妈住院','家人重病','陪床','爸住院','妈住院','父亲住院','母亲住院','陪床守夜','医院走廊','父亲走了','母亲走了','爸走了','妈走了','病逝','病危','心梗','离世','120','你爸','带爸妈去','父母背影','爸拍照','妈笑得','不跟你说话','血压计','买了新的血压计','葬礼','子欲养','护理床','换胃管','翻身拍背','没能留住','父亲接回了家','守着他','电话那头传来父亲住院','连夜赶回','病床上缩小的身影','李爷爷','陈爷爷','张奶奶','照顾老人','卧床','康复操','端碗','康复训练','护理手册','操作规范','鼻饲','胰腺癌晚期','疼得整夜','走的时候很安静','睡梦中走的','没受罪','白头发不少了','老年','临终关怀','安宁疗护','永远失去了','至亲','不再温暖的手','走廊里的白光','握着那双','喉咙像被堵住'], palette: FAMILY_PALETTE, frames: sceneParentSick(), frameDelay: 400, animIn: 'fade', priority: 9 },
  { id: 'surgery', category: 'life', name: '手术', keywords: ['动手术','进手术室','开刀','外科手术','住院手术','重大手术','住院做手术','手术同意书','手术很成功','推上手术台','做了手术','做完手术','需要手术','安排手术'], palette: LIFE_PALETTE, frames: sceneSurgery(), frameDelay: 400, animIn: 'fade', priority: 9 },
  { id: 'bankruptcy', category: 'life', name: '破产', keywords: ['破产','负债','欠债','赔光','亏钱','血本无归','倒闭','积蓄花光','账户蒸发','爆仓','窟窿','归零','期货爆仓','账户归零','交易软件','期货群','亏了','赔了','跑路','项目跑路','打了水漂','时间和金钱好像打了水漂','存款往下掉','余额往下掉','账户瞬间蒸发','化为一串冰冷'], palette: LIFE_PALETTE, frames: sceneBankruptcy(), frameDelay: 400, animIn: 'shake', priority: 9 },
  { id: 'lend-money', category: 'life', name: '借钱不还', keywords: ['借钱','欠钱不还','讨债','朋友借钱','借出去','发小借钱','转了账','这钱要不回来','借钱的亲戚','怕借钱','没要回来','不回消息','转了五万'], palette: LIFE_PALETTE, frames: sceneLendMoney(), frameDelay: 400, animIn: 'fade', priority: 9 },
  { id: 'burnout', category: 'career', name: '倦怠', keywords: ['倦怠','躺平','厌班','抑郁','情绪崩溃','不想上班','心理阴影','情绪低落','职场焦虑','喘不过气','压力太大','空得发慌','快乐面具','裂开了一道缝','笑不出来','心里空','撑不住了','身心俱疲','累到','不想动','什么都不想做'], palette: CAREER_PALETTE, frames: sceneBurnout(), frameDelay: 500, animIn: 'fade', priority: 9, requires: { employed: true } },
  { id: 'sick', category: 'life', name: '生病', keywords: ['生病','发烧','感冒','卧病在床','病倒','请病假','生病卧床','医药费','住院','体检','复查','血压','血脂','脂肪肝','颈椎病','脱发','吃药','膏药','降压药','膝盖疼','眼药水','急诊','挂号','药店','咳嗽','胃疼','头疼','腰椎','腰酸','背痛','肩膀疼','手腕疼','干眼症','关节痛','酸痛','腰疼','扭伤','腰酸背痛','不舒服','卧床','食物中毒','打点滴','躺在病床上','上吐下泻','腰椎间盘','腰突','理疗','天旋地转','眼前一黑','救护车','脑梗','病床上','躺在异国','偏头痛','心悸','挂了急诊','过度刺激','补剂','诊断书','自费部分','营养费','误工费','感冒把你按在床上','医药费像水','生病住院','保费','保险','退保','交保费','重疾险','保险合约','临床试验','双盲试验','受试者','生物年龄','长寿研究','抗衰','抗衰老','基因检测','走出医院','阳光照在脸上','颈椎','腰椎','身体发出警告','被迫放慢脚步','受伤','心脏检查','异常','保修','身体的保修期','心肌梗死','追悼会','去世','享年','离开了'], palette: LIFE_PALETTE, frames: sceneSick(), frameDelay: 400, animIn: 'fade', priority: 8 },
  // ===== 路径专属场景（priority: 6-9）=====
  { id: 'write', category: 'career', name: '写作创作', keywords: ['写书','写文章','写教程','写课程','写专栏','写BP','写文档','写报告','写PPT','写方案','写代码审查工具','开源了一个','开源项目','写了一本书','畅销书','签售会','出版','出版社','写文案','内容创作','写脚本','拍视频','录课','做课程','做内容','写公众号','写博客','写长文','写日记','写回忆录','写信','写公开信','提笔','下笔','码字','撰稿','笔耕','写作','写了一篇','写了本','写了门课','录了一门','录课程','知识付费','卖课','做讲师','开讲座','演讲','商业演讲','演讲邀约','签售','读书会','专栏作家','撰稿人','写了一本专著','思想领袖','讲师孵化营','课程','学员','开课','招生','课程收入','做一门课','年更一门课','精品课','9800','私享圈','星球','社群运营'], palette: CAREER_PALETTE, frames: sceneRead(), frameDelay: 300, animIn: 'fade', priority: 6 },
  { id: 'research', category: 'career', name: '科研实验', keywords: ['实验室','做实验','实验数据','N=1实验','自体实验','临床试验','一期临床','二期临床','三期临床','双盲试验','安慰剂','分析数据','血检','抽血','送检','检测','指标','炎症因子','自噬','端粒','表观遗传','线粒体','干细胞','衰老细胞','雷帕霉素','NMN','NAD+','白藜芦醇','达沙替尼','非瑟酮','槲皮素','多肽','基因疗法','基因重编程','CGM','心率变异性','生物标记','生理年龄','生物黑客','生物科技','长寿研究','衰老研究','PI','课题组','组会','论文','作者列表','ORCID','学术','科研','科学家','研究者','研究团队','协作网络','国际协作','样本','质控','论文发表','预印本','文献','读文献','查文献','ELISA','质谱','p值','效应量','小鼠实验','动物实验','细胞','基因','蛋白质','临床数据','受试者','剂量','药物','补剂','药盒','药瓶','药片','服用','监测','抽血的日子','日历上标满了抽血','公开文档','N=1','数据清洗','数据分析','统计','显著性','对照组'], palette: CAREER_PALETTE, frames: sceneWork(), frameDelay: 350, animIn: 'fade', priority: 6 },
  { id: 'coding', category: 'career', name: '编程开发', keywords: ['编程','写代码','代码','coding','debug','调试','重构','技术栈','部署','产品上线','服务器','后端','前端','AI模型','大模型','LLM','GPT','Transformer','微调','fine-tune','prompt工程','提示词','量化','INT8','推理加速','延迟','P99','缓存','框架','开源','GitHub','star','PR','commit','代码审查','代码审核','code review','技术周会','技术分享','技术方案','系统设计','写测试','测试代码','单元测试','集成测试','合约','智能合约','Solidity','合约部署','合约审计','漏洞赏金','黑客松','MVP','产品迭代','v1','v2','v3','用户增长','留存率','付费墙','转化率','裂变','SOP','自动化','AI自动化','AI工具','AI代码审查工具','技术博客','技术教程','AI教程','量化模型','模型优化','工程优化','绞杀者模式','旧系统替换','技术管理','Individual Contributor','带团队','CTO','技术顾问','股份','顾问费','架构师','资深工程师','代码把键盘','脸印着按键','趴在键盘上','逐行拆解','画流程图','开源了一个自己写的','star冲到','技术直觉','系统一块一块地替换','加了一层缓存','把模型量化','引入了推理加速框架','把文案生成质量做到了','微调+prompt工程','系统架构','技术架构','架构设计'], palette: CAREER_PALETTE, frames: sceneWork(), frameDelay: 250, animIn: 'fade', priority: 7, requires: { employed: true } },
  { id: 'lawsuit', category: 'life', name: '法律纠纷', keywords: ['律师','官司','法院','起诉','应诉','判决','判决书','维权','维权群','追偿','法务','律所','法律咨询','被告','原告','诉讼','仲裁','反诉','诽谤','抄袭指控','被抄袭','侵权','知识产权','版权','商标','合规','合规申报','罚款','交了罚款','税务','税务局','罚款比顾问费贵','请了律师','律师函','传票','开庭','庭外和解','赔偿','索赔','医疗纠纷','AI误诊','误诊官司','认知清洗','神经广告','脑机接口','广告弹窗','记忆碎片','认知干扰','后遗症'], palette: LIFE_PALETTE, frames: sceneSick(), frameDelay: 400, animIn: 'fade', priority: 9 },
  // ===== 新增趣味专属场景（priority: 7-9）=====
  { id: 'speech', category: 'career', name: '演讲领奖', keywords: ['演讲','上台','主题演讲','开场演讲','领奖','颁奖典礼','领奖台','获奖','年度影响力','掌声雷动','全场起立鼓掌','千人掌声','走上台','灯光打下来','台下安静','大会讲完','一个年轻人过来说','火就是这么传的','公开课','讲台上','大学的讲台','第一堂课','讲师孵化营','粉丝见面会','读者见面会','签售会','线下见面会','做开场','站上AI前沿峰会','两千人','二十分钟','上台前一秒你腿还在抖','恐惧突然消失了','宣布你获奖'], palette: CAREER_PALETTE, frames: sceneSpeech(), frameDelay: 250, animIn: 'pop', priority: 8 },
  { id: 'cry', category: 'life', name: '哭泣崩溃', keywords: ['哭了','哭了一整晚','哭了一场','崩溃','眼泪','眼眶','蹲在走廊','蹲了很久','哭了','泪','偷偷擦了擦眼角','眼眶有点热','挂掉电话你哭了','眼泪差点掉下来','说着说着就哭了','突然崩溃','蹲在地上','回家哭了','你哭了','痛哭','泪流满面','在走廊里蹲了很久','在门口坐了很久','坐了很久'], palette: LIFE_PALETTE, frames: sceneCry(), frameDelay: 500, animIn: 'fade', priority: 8 },
  { id: 'rain', category: 'life', name: '雨天撑伞', keywords: ['下雨','下雨天','撑伞','淋了雨','没带伞','淋雨','湿透','大雨','暴雨','雨打在','雨声','窗外雨声','姜茶','冲进了雨里','忘带伞','雨水','打湿','全身湿透','雨季','连下一周雨','被雨打湿','石板路被雨打湿','雨越下越大','雨里','雨停了','雨伞'], palette: LIFE_PALETTE, frames: sceneRainUmbrella(), frameDelay: 300, animIn: 'fade', priority: 6 },
  { id: 'couple-walk', category: 'family', name: '情侣散步', keywords: ['手牵手','牵手','牵着手','手一直牵着','握紧了她的手','握紧了他的手','沿着沙滩走','河边走','走在河边','沿着河边','夕阳下影子拉得很长','两个人的影子','靠在你肩上','一起走了很久','散步回家','晚饭后散步','靠在肩上','她靠在你肩上','一起在阳台看日落','阳台看夕阳','坐在一起','依偎','肩并肩','散步的时候','一起慢慢走','两人散步','浪花打在脚踝'], palette: FAMILY_PALETTE, frames: sceneCoupleWalk(), frameDelay: 300, animIn: 'fade', priority: 7, requires: { dating: true } },
  { id: 'fireworks', category: 'life', name: '烟花庆祝', keywords: ['烟花','跨年','新年','除夕','年夜饭','过年','春晚','红包飞了','放烟花','看烟花','窗外烟花','新年快乐','举杯','庆祝','群里炸了','拿下','烟花表情','庆祝的','鞭炮','烟火','烟花绽放','放了烟花','对着窗户上自己的影子说新年快乐','一个人在家煮了饺子','窗外烟花响起来','家族群里红包'], palette: LIFE_PALETTE, frames: sceneFireworks(), frameDelay: 200, animIn: 'bounce', priority: 8 },
  { id: 'photo', category: 'life', name: '拍照合影', keywords: ['拍照','合影','自拍','拍了张照片','拍了一张','举着手机','拍了三十遍','手抖得看不清','照片','合影留念','拍了几张糊了的照片','粉丝合影','要合影','掏出手机拍照','拍照留念','拍了一张自拍','镜子前','健身房镜子前','发了条动态圈配','录视频','录了三十遍','全家福','翻到一张全家福','相册','翻出以前的老照片','相机'], palette: LIFE_PALETTE, frames: scenePhoto(), frameDelay: 300, animIn: 'pop', priority: 5 },
  { id: 'hug', category: 'family', name: '温暖拥抱', keywords: ['抱了很久','紧紧抱着','抱在一起','机场见面抱了很久','交换了一个很长的拥抱','拥抱告别','她扑进你怀里','抱住','抱了','TA抱','拥抱了一下','抱一下','给了一个拥抱','重逢','机场重逢','拥抱了很久','很久的拥抱','拥抱比什么都真实','他看到你第一句话','手紧紧攥着你的手','握手','拉着你的手','攥着你的手'], palette: FAMILY_PALETTE, frames: sceneHug(), frameDelay: 300, animIn: 'fade', priority: 8 },
  { id: 'airport', category: 'life', name: '机场飞机', keywords: ['机场','坐飞机','飞机','起飞','落地','登机','候机厅','候机','单程票','飞了','飞往','航班','登机口','素万那普机场','萧山机场','飞机穿过云层','靠窗坐','靠窗的位置','飞机落地','机票','飞第三国','签证跑','返程机票','机场哭了','机场等了十二个小时','飞了二十八个小时','又一次降落在一个陌生的机场','中文标识','方便面的味道','眼泪差点掉下来','在机场站了很久','送他走时','临走那天你妈在机场哭了','机场告别','拥抱告别没哭'], palette: LIFE_PALETTE, frames: sceneAirport(), frameDelay: 400, animIn: 'slide', priority: 7 },
  { id: 'meditation', category: 'life', name: '冥想发呆', keywords: ['冥想','发呆','坐了一整个下午','阳台上坐了一下午','什么也没想','什么也没做','看了一个小时的夕阳','看了很久','坐了很久','站了很久','在阳台上站了很久','深呼吸','平静','松弛','阳光从左边移到右边','天色变暗','晒太阳','发了会儿呆','坐着','安静','午后','阳光暖洋洋','一盆绿萝','去山里待了两周','没有WiFi','风声和鸟叫','脑子终于不抖了','在台阶上多坐了十分钟','巷子里的灯一盏盏亮起来','坐了一晚上'], palette: LIFE_PALETTE, frames: sceneMeditation(), frameDelay: 600, animIn: 'fade', priority: 5 },
  { id: 'teach', category: 'career', name: '讲课传承', keywords: ['讲课','教学生','带徒弟','带新人','教学','讲师','老师','教老人','教他们','教一群老人','学了五遍','传承','接力棒','列了一张学习清单','带了三个徒弟','教他们读文献','站上了大学的讲台','引路人','讲师孵化营','我也带新人了','长大了','教他们用智能手机','视频通话','你在旁边假装看资料','带新人问你问题','我百度一下','实习生问','你带的那个新人拿了','最佳新人奖','感谢我的师傅','给师父发了一条消息','第一堂课','把你的方法论教给','从自己讲变成了让别人讲','开始在社区里带新人','review PR','解答问题','带出了五个core contributor'], palette: CAREER_PALETTE, frames: sceneTeach(), frameDelay: 300, animIn: 'fade', priority: 7 },
  { id: 'book-sign', category: 'career', name: '签售出书', keywords: ['书出版了','你的书','出版了','首印','卖光','签售会','签售','畅销书','当当科技榜','抚摸着书的封面','推荐教材','比任何爆款视频都持久','书店里那本印着你名字的书','入门必读','《HODLer手册》','预付了版税','写了一本行业方法论的书','出版社编辑','私信你','约您出一本书','系列长文','书架','印着你名字','读者说','因为你的书我转行','拍了两小时的队','有大学教授把它列为','三个月卖光'], palette: CAREER_PALETTE, frames: sceneBookSign(), frameDelay: 300, animIn: 'fade', priority: 8 },
  { id: 'cyberbully', category: 'life', name: '网暴恶评', keywords: ['网暴','恶评','评论区被攻陷','私信全是辱骂','死亡威胁','人肉','掉粉','热搜','负面','恶意','骂你','拉黑','卸载了所有社交APP','三天没出门','评论区翻到凌晨三点','每一条骂你的话都像一根针','手贱点进评论区','一条恶评精准扎在','删了App又装回来','反复看了二十遍','长篇私信骂你','从内容骂到长相','创作者的心是被骂大的','每一刀都留疤','断章取义','转了十万次','他们不知道前因后果','风险标签','合作品牌全部暂停','私信箱塞满','语言真的可以杀人','拉上窗帘的房间','家人信息被人肉'], palette: LIFE_PALETTE, frames: sceneCyberbully(), frameDelay: 400, animIn: 'shake', priority: 9 },
  { id: 'hobby', category: 'life', name: '兴趣爱好', keywords: ['兴趣班','学画画','学弹琴','烘焙','画画','弹琴','陶艺','茶艺','川剧','种花','种菜','阳台种菜','小葱冒出来','蛋糕歪歪扭扭','学做','学了一门手艺','做了一件手工','弹吉他','弹起《夜来香》','跟着哼','画架','水彩','弹唱','写了一首歌','做蛋糕','做手工','做陶艺','学茶艺','做的蛋糕','做的菜','自己的作品','手工作品','每个周末都有了一件值得期待的事','安安静静地做一件事','两个小时后你出来','觉得自己活过来了','整周最放松的时刻'], palette: LIFE_PALETTE, frames: sceneHobby(), frameDelay: 300, animIn: 'fade', priority: 5 },
  { id: 'metro', category: 'life', name: '地铁高铁', keywords: ['地铁','高铁','末班地铁','回程的高铁','回城的高铁','靠窗位置','靠窗坐','坐在靠窗','戴耳机','听着歌','二十分钟发呆','车厢里没几个人','靠在门边','窗外飞过的隧道灯光','玻璃里自己的倒影','手机在口袋里','窗外飞速后退','周日晚上十点半','旁边的人以为你们不认识','最后一班高铁','玻璃里自己','不知道该打给谁','耳机里的歌'], palette: LIFE_PALETTE, frames: sceneMetro(), frameDelay: 400, animIn: 'slide', priority: 5 },
  { id: 'convenience-store', category: 'life', name: '便利店独处', keywords: ['便利店','便利店买了瓶啤酒','买了瓶啤酒','楼下便利店','站在路灯下','喝了很久','在门口站了一会儿','回家路上没敢听歌','买了瓶啤酒一个人站在路灯下','offer到的那天你在楼下便利店','割肉离场那天坐在便利店门口','喝了罐啤酒','路灯下','一个人站在','啤酒罐','喝了两杯','默默喝了两杯','便利店门口','在楼下站了一会儿'], palette: LIFE_PALETTE, frames: sceneConvenienceStore(), frameDelay: 500, animIn: 'fade', priority: 7 },
  // ===== 路径/重要生活事件（priority: 8）=====
  { id: 'date', category: 'family', name: '约会', keywords: ['约会','恋爱','表白','第一次约会','烛光晚餐','找对象','脱单','谈恋爱','女朋友','男朋友','鼓起勇气表白','表白了','我也是','只把你当朋友','让我再想想','精心准备的惊喜','礼物','微醺','哼着歌','认识了一个人','缘分','社交软件','认识了一些有趣的人','加了几个社交软件','一起健身','一起吃饭','TA说','TA没说话','回家的时候你微醺','准备了惊喜','给TA准备','TA笑了','那个笑容','新朋友','聚会上认识','新来的同事','对视','聊了一整晚','心跳漏了一拍','交换了联系方式','正式约会','暧昧','在一起了','正式在一起了','见了父母','见家长','带你见了ta的父母','见了ta的父母','手心全是汗','紧紧握着你的手','我表现怎么样','加个社交软件','撑伞送你','故意选了同一个时间','聊了整整','你发现自己在笑','心跳','脸红','心动','约会了','一起看电影','约你周末','想和这个人过一辈子','介绍给了ta所有的朋友','第一次一起旅行'], palette: FAMILY_PALETTE, frames: sceneDate(), frameDelay: 300, animIn: 'fade', priority: 8 },
  { id: 'job-hop', category: 'career', name: '跳槽', keywords: ['跳槽','跳槽去新公司','辞职跳槽','换工作','拿到新offer','跳槽涨薪','离职入职','猎头','内推','刷招聘','三轮面试','终面','职业社交网络','面试','拿到了offer','投简历'], palette: CAREER_PALETTE, frames: sceneJobHop(), frameDelay: 250, animIn: 'slide', priority: 8, requires: { employed: true } },
  // ===== 日常事件（priority: 7-3）=====
  { id: 'blind-date', category: 'family', name: '相亲', keywords: ['相亲','相亲见面','媒人介绍','被安排相亲','相亲饭局','去相亲','见对象','安排了相亲','周末相亲','有房有车'], palette: FAMILY_PALETTE, frames: sceneBlindDate(), frameDelay: 300, animIn: 'fade', priority: 7, requires: { single: true } },
  { id: 'parent-visit', category: 'family', name: '父母探望', keywords: ['父母来看我','爸妈从老家来','父母过来探望','父母到访','爸妈来看我','父母登门看望','回老家','过年回家','妈妈打电话','爸妈打电话','视频电话','和爸妈视频','教爸妈用','妈在家族群','带父母去','带爸妈去','你妈在电话里哭了','爸拍照的时候手抖','妈笑得像个孩子','给你做饭','我爸','我妈','不跟你说话','回老家整理旧物','翻出','妈妈颤抖的手','听她讲了一下午年轻时的故事','好好说说话','准备告别','延长寿命的终极意义','陪陈爷爷聊了会儿','讲他年轻时的事','下次来多坐会儿','AI助手提醒你','三周没联系家人了','拨通了家里的电话','什么时候回来','快了','挂掉电话你哭了一场','爸妈从老家来看你'], palette: FAMILY_PALETTE, frames: sceneParentVisit(), frameDelay: 300, animIn: 'fade', priority: 7 },
  { id: 'play-kid', category: 'family', name: '陪孩子玩', keywords: ['陪孩子玩','陪孩子玩耍','亲子时光','陪儿子玩','陪女儿玩','亲子互动','陪娃玩','带孩子去公园','玩积木','陪孩子','带孩子','陪娃','周末陪孩子','亲子','辅导作业','陪孩子写作业','孩子第一次写作文','孩子叛逆','课外班','奥数班','接送','等课','交费','报了课外班','给孩子报','写作业','削了个苹果','书桌上','起跑线','接送孩子','孩子开始叛逆了','孩子上幼儿园','送孩子上幼儿园','孩子叫出了爸爸','孩子第一次叫'], palette: FAMILY_PALETTE, frames: scenePlayKid(), frameDelay: 250, animIn: 'fade', priority: 7, requires: { hasChild: true } },
  { id: 'work', category: 'career', name: '工作', keywords: ['上班','搬砖','打工','开干','干活','到公司','工位','办公室','工牌','下班','打卡','社畜','周报','KPI','赶需求','改bug','写代码','对接','汇报','工位上','办公桌','远程工作','在公司','会议室','自由职业','数字游民','接一些小活','接单','处理邮件','回邮件','搞AI','AI工具','晚上搞副业','朝九晚五','写脚本','拍视频','剪视频','商务','续约','完播率','互动率','写提案','做顾问','共享空间','在任何地方都能做','AI模型','提示词','和AI共舞','提示词方法论','交付周期','开源项目','SaaS','订阅收入','MRR','ARR','独立开发者','出海','跨境','地理套利','Notion','Zapier','异步沟通','远程助理','雇人','SOP','公司运营','签合同','项目报价','商务报价','proposal','交付物','咨询公司','德勤','排他协议','限时排他','差异化定位','商业咨询','知识变现','独立产品','一人公司','小而美','盈亏平衡','月流水','付费墙','转化率','裂变'], palette: CAREER_PALETTE, frames: sceneWork(), frameDelay: 300, animIn: 'fade', priority: 4, requires: { employed: true } },
  { id: 'overtime', category: 'career', name: '加班', keywords: ['深夜加班','加到深夜','还在加班','加班','通宵','加班到很晚','加班到凌晨','通宵整晚','deadline','赶项目','红牛','加班到深夜','总是加班到深夜','凌晨两点前睡过觉','熬夜写代码','熬夜赶','通宵加班'], palette: CAREER_PALETTE, frames: sceneOvertime(), frameDelay: 350, animIn: 'fade', priority: 7, requires: { employed: true } },
  { id: 'midnight-baby', category: 'family', name: '半夜喂奶', keywords: ['半夜喂奶','夜醒喂奶','冲奶粉','哄睡','哄孩子睡觉','夜奶'], palette: FAMILY_PALETTE, frames: sceneMidnightBaby(), frameDelay: 500, animIn: 'fade', priority: 7, requires: { hasChild: true } },
  { id: 'travel', category: 'life', name: '旅行', keywords: ['旅游','旅行','出去玩','度假','出游','出国','去旅行','海边度假','碧海蓝天','风景照','打卡景点','一个人旅行','旅行回来','旅行的照片','翻照片','长途旅行','去了郊外','清迈','里斯本','大理','洱海','越南','夜市','海边','带爸妈去了','带父母去了','路上遇到了一个人','一起看了长城','星空下跳舞','机场告别','拥抱告别','陌生的机场','办电话卡','找公寓','试新餐馆','又一次降落','在路上','游牧路上','曼谷','丽江','厦门','昆明','重庆','素万那普机场','登机口','候机','机票','飞到了一个','落地那天','陌生的街道','登机箱','下一张机票','旅行艳遇','异地恋','视频维系','距离','重逢','机场哭','去了曼谷','在曼谷待了','去迪拜','在巴西','在东南亚','街头','双条车','芒果糯米饭','farang','泰语','点菜砍价','AI翻译耳机','英语工作','地理套利','数字游民','Discord','游民生存指南','换了新的城市','搬到','新城市不适应','找不到好吃的馆子','听不懂方言','交不到新朋友','想念以前的城市','回家的距离','地图APP'], palette: LIFE_PALETTE, frames: sceneTravel(), frameDelay: 250, animIn: 'slide', priority: 7 },
  { id: 'grandchild', category: 'family', name: '抱孙', keywords: ['孙女','抱孙子','带孙','隔代亲','当爷爷','当奶奶','带孙子','带了一天孙子','小孙子','大孙子'], palette: FAMILY_PALETTE, frames: sceneGrandchild(), frameDelay: 250, animIn: 'fade', priority: 7, requires: { minAge: 50, hasChild: true } },
  { id: 'sunset', category: 'life', name: '夕阳晚年', keywords: ['晚年','白头偕老','一起变老','黄昏恋','暮年','白发苍苍','老花镜','上了年纪','爬楼喘气','含饴弄孙','颐养天年','敬老院','养老院','养老站','老年生活','像退休老头','像退休老太太','活得像退休','老年活动','快乐不分年龄','公办养老院','回头看这半生','与生活和解','承认自己的普通','还站在这里','剩下的路','慢慢走','写回忆录','翻到二十岁写的日记','那个二十岁的你','旧日记','写信给自己','给22岁的自己','回一封信','不惑','知天命','耳顺','六十岁','古来稀','白发越来越多','看我这辈子最对的决定','学会了带着那个空缺继续过日子','不再追了','不再等了'], palette: LIFE_PALETTE, frames: sceneSunset(), frameDelay: 500, animIn: 'fade', priority: 7, requires: { minAge: 50 } },
  { id: 'move', category: 'life', name: '搬家', keywords: ['搬家','搬去','移居','迁徙','搬迁','北漂','沪漂','深漂','去外地','房租上涨','涨房租','房东','新租的房子','租的房子','准备搬家','要搬家','卖掉了大部分家当','清空了半个家','清空半个家','轻装上阵','搬到新城市','新城市','一切从头开始','降落在新的城市','世界又展开了一页'], palette: LIFE_PALETTE, frames: sceneMove(), frameDelay: 250, animIn: 'slide', priority: 7 },
  { id: 'bonus', category: 'career', name: '发奖金', keywords: ['发奖金','年终奖','项目奖金','年终分红','绩效奖金','发了一大笔奖金','奖金到手','年终奖到账'], palette: CAREER_PALETTE, frames: sceneBonus(), frameDelay: 200, animIn: 'bounce', priority: 7, requires: { employed: true } },
  { id: 'friend-drink', category: 'life', name: '朋友聚会', keywords: ['朋友聚会','和朋友聚餐','兄弟喝酒','闺蜜聚会','喝酒撸串','饭局举杯','老友重逢','酒吧喝酒','同事喝酒','拼酒','同学聚餐','份子钱','结婚请柬','聚餐','干杯','撸串','烧烤','喝啤酒','白酒','喝了一晚上啤酒','喝了两杯酒','默默喝了两杯','喝了很多','醉得不省人事','Chang啤酒','喝着','路边摊喝','吃了一碗面','和朋友','和巴西人','约你聚会','请几个朋友吃了饭','朋友约你','忘年交','喝了顿酒','聊行业','约前辈喝酒','一起骂','小酒馆','酒馆','喝到凌晨','老友喝','矫情了一把'], palette: LIFE_PALETTE, frames: sceneFriendDrink(), frameDelay: 300, animIn: 'fade', priority: 6 },
  { id: 'pet', category: 'life', name: '养宠物', keywords: ['养宠物','养了只小狗','养了只小猫','遛狗','养猫','毛孩子','宠物狗','宠物猫','铲屎','领养','收养','宠物医院','抱回家','带回家养'], palette: LIFE_PALETTE, frames: scenePet(), frameDelay: 250, animIn: 'fade', priority: 6 },
  { id: 'investment', category: 'career', name: '投资炒股', keywords: ['炒股','买基金','投资理财','股市涨跌','买入股票','理财收益','股票基金','币圈投资','股市','牛市','熊市','持仓','持仓仓位','仓位过重','爆仓','暴跌','行情','币圈','交易所','K线','炒币','比特币','加密货币','基金','定投','绿成草原','腰斩','加仓','暴涨','币跌','TVL','DeFi','DAO','治理代币','钱包数零','基金大涨','基金腰斩','对冲','期权','基金账户','股票账户','账户缩水','账户浮盈','正收益','负收益','价值投资','被套的韭菜','期货','期货账户','期货市场','开户','区块链项目','投10万','翻五倍','项目跑路','炒币赚了','生物科技','临床失败','股价跌了','数据造假','重仓','币翻了十倍','收益截图','信我者得永生','指数基金','存进了定期','理财','银行理财','对冲期权','期权费','炒期货','商铺','租金按时到账','租客','收租','好租客','入账通知','开了期货账户','股灾','黄金','止损','止盈','盯盘','交易所被墙','割肉','死扛','抄底','追高','纸上富贵','回调','金店','回收价','买了黄金','去中心化钱包','硬件钱包','助记词','在血流成河的市场','别人恐惧时贪婪','按下了买入键','暴富故事','无人问津时','天天盯盘','账户里的数字翻了倍','金价','金条','黄金涨了','横盘','卖又觉得亏','定期存款','三年期定期','银行柜员','利率','余额宝','年化收益','系统维护中','提币通道','链上','智能合约投资','DeFi协议','巨鲸','巨鲸追踪','链上数据','监控面板','巨鲸跟随者','聪明钱','胜率','交易系统','交易记录','交易前辈','扳回来','离岸信托','税务架构','结构化安排','资产配置','跨司法辖区','主权个人','第二身份','海外银行账户','HODL','钻石手','退出计划','每涨50%卖','白皮书','Solidity','加密友好国家','签证','合规申报','架构重组','维权群','私钥','多签','跨链','零知识证明','ZK','黑客松','赏金','漏洞','套利者','薅走','协议','fork','迭代速度','冷启动','共创者','链上身份'], palette: CAREER_PALETTE, frames: sceneInvestment(), frameDelay: 300, animIn: 'fade', priority: 6 },
  { id: 'cook', category: 'family', name: '做饭', keywords: ['做饭','炒菜','下厨房','烹饪','做饭菜','烧菜','做了顿好饭','红烧肉','煮面','炖汤','煲汤','厨艺','菜谱','围裙','家常菜','下厨','学做饭','炒糊了','外卖APP消失','给自己吃','体重轻了','做的菜','做了一桌子菜','你妈每天给你做饭','做了一大桌子菜'], palette: FAMILY_PALETTE, frames: sceneCook(), frameDelay: 250, animIn: 'fade', priority: 6 },
  { id: 'shopping', category: 'life', name: '购物', keywords: ['逛街','血拼','买买买','商场购物','超市采购','剁手','扫货','逛商场','购物车','电商平台','报复性消费','超市','价签','纸币','大几千块','拿铁因子','隐形消费'], palette: LIFE_PALETTE, frames: sceneShopping(), frameDelay: 250, animIn: 'slide', priority: 4 },
  { id: 'phone', category: 'life', name: '刷手机', keywords: ['刷手机','刷短视频','刷抖音','刷朋友圈','手机不离手','刷剧','窝沙发刷手机','躺着刷','刷动态圈','小红书','手机没电','截图','发动态圈','设闹钟','刷微博','刷B站','刷手机到深夜','玩手机','打开手机','打开银行App','打开贝壳','打开APP','打开后台','看MRR曲线','打开电商','打开机票App','翻看相册','手机撑不住','电池一天要充三次','打开APP要等十秒','旧手机','新手机','拿起手机','手机屏幕','AI助手弹出','弹出一条消息','翻了翻通讯录','打开招聘App','打开二手平台','刷到','小红书上刷到','放下手机','手机塞进抽屉','关掉手机','退出了所有','群聊','你死死盯着屏幕','Discord','私信','群里','开发者论坛','评论区','发了条动态圈','关掉动态圈','注销了所有账号','消失了半年','全新身份','网暴','舆论','舆论分化','录音','被录音','转发','大V转发','上了热搜','负面评论','恶评','差评','口碑','退群断舍离','断舍离','清净了','退群','钱包和手机都清净'], palette: LIFE_PALETTE, frames: scenePhone(), frameDelay: 300, animIn: 'fade', priority: 4 },
  { id: 'walk', category: 'family', name: '散步', keywords: ['散步','走路','遛弯','走走','漫步','小区散步','晚饭后散步','溜达','公园散步','饭后散步','江边散步','散步回来','走十分钟','公园长椅','傍晚的风','发呆','看书、散步'], palette: FAMILY_PALETTE, frames: sceneWalk(), frameDelay: 300, animIn: 'fade', priority: 4 },
  { id: 'exercise', category: 'life', name: '锻炼', keywords: ['锻炼','跑步','运动','晨跑','晨练','太极','米字操','颈椎操','走路上班','瑜伽','游泳','打球','篮球','羽毛球','马拉松','骑行','骑车','动感单车','跑步机','普拉提','练瑜伽','坚持健身','五公里','跑步成为解压方式','公园跑步','去公园跑步','两块半','跑步成了','解压方式','半马','跑完了','冲过终点','跑完','跑完今年的第二个半马','比去年快了两分钟'], palette: LIFE_PALETTE, frames: sceneExercise(), frameDelay: 200, animIn: 'pop', priority: 4 },
  { id: 'fishing', category: 'life', name: '钓鱼', keywords: ['去钓鱼','垂钓','钓到大鱼','去河边钓鱼','钓鱼回来'], palette: LIFE_PALETTE, frames: sceneFishing(), frameDelay: 400, animIn: 'fade', priority: 5 },
  { id: 'square-dance', category: 'life', name: '广场舞', keywords: ['广场舞','跳广场舞','大妈跳舞','广场跳广场舞'], palette: LIFE_PALETTE, frames: sceneSquareDance(), frameDelay: 200, animIn: 'bounce', priority: 5 },
  { id: 'read', category: 'life', name: '看书', keywords: ['看书','读书','阅读','翻书','学习新技能','教学视频','收藏夹','论文','备考','考研','考证','书架','图书馆','借书','写东西','在网上写','写的东西','写了一篇','文章','发表了','阅读量','出书','出版社','出版社编辑','写作','继续写下去','记录本身','每天花两小时看书','下午看书','公交上看书','学的东西','兴趣班','学画画','学弹琴','烘焙','新技能','学做饭','周末都有了一件值得期待的事','白皮书','读了三十多份白皮书','研究','复盘','学习新技术','学最新的技术','技术底层重新学了一遍','椭圆曲线加密','零知识证明','共识机制','状态通道','学泰语','学语言','学弹琴','学烘焙','学做','学了','学最新的','研究透','研究了','花一周研究到通透','把每个方法论都拿去实战','被证伪','删掉重写','公开课','免费课程','三十讲','衰老科学公开课'], palette: LIFE_PALETTE, frames: sceneRead(), frameDelay: 400, animIn: 'fade', priority: 3 },
  { id: 'tv', category: 'family', name: '看电视', keywords: ['看电视','追剧','看剧','看节目','电视机前','窝在沙发','看电影','看电视连续剧','综艺','频道','遥控器','沙发看电视'], palette: FAMILY_PALETTE, frames: sceneTV(), frameDelay: 350, animIn: 'fade', priority: 3 },
  { id: 'sleep', category: 'family', name: '睡觉', keywords: ['睡觉','入睡','晚安','睡着','睡眠','失眠','睡过头','闹钟响了','睡了','困','深睡','一觉睡到天亮','睡个好觉','自然醒','睡到自然醒','睡懒觉','失眠了'], palette: FAMILY_PALETTE, frames: sceneSleep(), frameDelay: 600, animIn: 'fade', priority: 3 },
  { id: 'eat', category: 'family', name: '吃饭', keywords: ['吃饭','吃晚饭','吃饭了','用餐','晚饭','吃火锅','早餐','午饭','外卖','聚餐','饭局','一个人吃饭','下馆子','吃外卖','宵夜','吃米线','吃东西','一起吃','吃了一碗面','筷子没停过','喝了两杯酒','出来吃挺好','做了顿','煮了碗面','方便面','吃到第15天'], palette: FAMILY_PALETTE, frames: sceneEat(), frameDelay: 300, animIn: 'fade', priority: 3 },
  // ===== V13: 卡片选择新场景（priority: 7-8）=====
  { id: 'resign', category: 'career', name: '辞职', keywords: ['递交辞职信','向老板递交辞职信','辞职信放在老板桌上','辞职信放在','辞职信轻轻放在','递了辞职信','递出辞职信','拥抱自由','把时间买了回来','把时间买回了自己手里','头也不回地走出写字楼','收拾工位','走出写字楼那一刻','你走出写字楼','裸辞','辞职报告','把辞职信','辞职信'], palette: CAREER_PALETTE, frames: sceneResign(), frameDelay: 250, animIn: 'fade', priority: 8, requires: { employed: true } },
  { id: 'health-check', category: 'life', name: '体检', keywords: ['全面体检','牙科检查','体检加牙科','做了一次全面体检','做了体检','体检中心','去做了体检','冰冷的仪器','抽了五管血','做了三个CT','洗完牙','体检报告','飘红','未见异常','医生说总体还行','医生推了推眼镜','牙医让你张大嘴','牙科钻头'], palette: LIFE_PALETTE, frames: sceneHealthCheck(), frameDelay: 300, animIn: 'fade', priority: 8 },
  { id: 'therapy', category: 'life', name: '心理咨询', keywords: ['心理咨询师','看心理咨询师','做冥想','心理咨询室','第一次走进心理咨询室','咨询师说','说了很多平时不敢说的话','凌晨三点还在刷手机','天空好像蓝了一点','去找了心理咨询师'], palette: LIFE_PALETTE, frames: sceneTherapy(), frameDelay: 400, animIn: 'fade', priority: 8 },
  { id: 'rider', category: 'career', name: '骑手', keywords: ['全职骑手','成为全职骑手','外卖骑手','骑手APP','跑了十二单','等餐时蹲在路边','风里雨里','注册成为全职','送外卖','跑外卖','外卖箱','成为骑手','开始跑外卖'], palette: CAREER_PALETTE, frames: sceneRider(), frameDelay: 180, animIn: 'slide', priority: 8 },
  { id: 'vendor', category: 'career', name: '摆摊', keywords: ['摆摊卖烤肠','支起烤肠摊','租借简陋档口摆摊','开始摆摊','摆摊','推着小推车去摆摊','隔壁大哥','你得吆喝','憋了半天喊出声','卖的不是烤肠','摆摊创业','卖烤肠','卖了三根烤肠','摊位','档口'], palette: CAREER_PALETTE, frames: sceneVendor(), frameDelay: 250, animIn: 'fade', priority: 8 },
  { id: 'study-exam', category: 'career', name: '备考学习', keywords: ['备战考公','考公','考公考上了','公示名单','公考教材','报了培训班','千军万马过独木桥','笔试差0.5分','进面','你居然真的考上了','考上了','朝九晚五不用担惊受怕','把教材塞进柜子','每天学到凌晨两点','头发一把一把掉','在职读研','在职研究生','在职读MBA','架构师进阶班','硬核技术架构进阶训练营','合上最后一本教材','证书到手的那一刻','啃下一本本技术砖头','训练营里你年纪最大','连续三个月周末泡在培训班','发际线又退了一厘米','刷题','夜以继日地复习','看书看到凌晨','备考'], palette: CAREER_PALETTE, frames: sceneStudyExam(), frameDelay: 300, animIn: 'fade', priority: 7 },
  { id: 'gym-workout', category: 'life', name: '健身房撸铁', keywords: ['报健身年卡','办了张健身卡','办了健身卡','健身房挥汗如雨','健身房','在健身房','肌肉猛男','跑步机上','撸铁','举哑铃','看到腹肌','健身房镜子前','跑步机上耳机','哑铃','杠铃','健身卡'], palette: LIFE_PALETTE, frames: sceneGym(), frameDelay: 200, animIn: 'pop', priority: 8 },
  { id: 'streaming', category: 'career', name: '自媒体直播', keywords: ['做自媒体','开始在网上写','开始在网上分享','内容火了','视频火了','广告收入','35岁被裁后的自救指南','开直播','拍视频','录视频','对着镜头','主播','自媒体','写回忆录','35岁才明白的事','评论区有人说写的就是我','每条动态都有人等','直播带货','开了直播','直播间','你开始拍'], palette: CAREER_PALETTE, frames: sceneStreaming(), frameDelay: 250, animIn: 'fade', priority: 7 },
  { id: 'volunteer', category: 'life', name: '做义工', keywords: ['你周末去了','你去做义工','做义工','帮助别人的快乐','被需要也是一种快乐','橘猫在你腿上趴了一下午','你周末去做义工','流浪动物救助站做义工','养老院做义工','社区图书馆做义工'], palette: LIFE_PALETTE, frames: sceneVolunteer(), frameDelay: 300, animIn: 'fade', priority: 8 },
  { id: 'package', category: 'life', name: '拆快递', keywords: ['拆快递','拆包裹','快递到了','拆包装','拆新手机包装','拆开新手机包装','快递盒','包裹到了','拆快递的快感','网购','下单买了'], palette: LIFE_PALETTE, frames: scenePackage(), frameDelay: 200, animIn: 'pop', priority: 7 },
  { id: 'treat-parents', category: 'family', name: '孝敬父母', keywords: ['带爸妈去了','带父母去了','带爸妈出去旅游','带父母出去旅游','带父母出去旅游一趟','带爸妈去吃','带父母去吃','请爸妈吃了顿好的','你妈嘴上说太贵了','你妈嘴上说太贵了太贵了','说太贵了筷子没停','我爸临走偷偷打包','爸默默喝了两杯酒','出来吃挺好的','爸拍照的时候手抖','妈笑得像个孩子','你爸拍照手抖','你妈每到景点就找垃圾桶','在他们身后看着这两个渐渐老去的背影','带父母去','带爸妈去'], palette: FAMILY_PALETTE, frames: sceneTreatParents(), frameDelay: 300, animIn: 'fade', priority: 8 },
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
