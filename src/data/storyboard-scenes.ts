/**
 * 三分镜像素场景定义 v2 - 开罗游戏风格
 *
 * 核心改进：
 * - 画布 24×20 像素，实际渲染 120×100px
 * - 标准2头身Q版小人（高8像素：头3+身3+腿2），有五官有表情
 * - 每个场景2-4帧循环动画（打字/走路/举杯/跳跃等）
 * - 场景=小人+道具+背景，一眼看懂剧情
 * - 赛博朋克霓虹色调，三个分类统一调色板索引
 * - 单年播放模式：新事件替换旧场景，不累积
 *
 * 统一调色板索引（三个分类共用此布局）：
 *   0: transparent  1: 深背景     2: 主题色     3: 高光
 *   4: 深主题色     5: 肤色       6: 副主题色   7: 深棕/黑发
 *   8: 金发/金黄    9: 白色      10: 青色点缀  11: 中主题色
 *  12: 深红/嘴     13: 备用      14: 极暗/灰发 15: 近黑/眼睛/阴影
 */

export type StoryboardCategory = 'family' | 'life' | 'career'

/** 单帧像素数据 */
type PixelFrame = number[][]

export interface StoryboardScene {
  id: string
  category: StoryboardCategory
  name: string
  keywords: string[]
  palette: string[]
  /** 多帧动画，frames[0]为起始帧 */
  frames: PixelFrame[]
  /** 帧间隔（毫秒） */
  frameDelay: number
  /** 入场动画 */
  animIn: 'fade' | 'rise' | 'pop' | 'slide' | 'blink' | 'shake' | 'bounce'
  /** 优先级 */
  priority?: number
}

// ============================================================
// 统一调色板（索引布局一致，颜色按分类主题变化）
// ============================================================

const FAMILY_PALETTE = [
  'transparent',  // 0
  '#1a0a14',      // 1 深紫背景
  '#ff8ab8',      // 2 粉主色
  '#ffd6e7',      // 3 浅粉高光
  '#ff3d7f',      // 4 玫红（深主题）
  '#ffe0c2',      // 5 暖肤色（统一）
  '#ff6b9d',      // 6 中粉（副主题）
  '#5a3040',      // 7 棕发/暗部
  '#ffecb3',      // 8 金发/金黄
  '#ffffff',      // 9 白
  '#00d4ff',      // 10 青点缀
  '#ffb3c6',      // 11 浅粉（中主题）
  '#cc2255',      // 12 深红/嘴
  '#ffc4a0',      // 13 深肤色（备用）
  '#884455',      // 14 深棕/灰发
  '#2a1020',      // 15 阴影/眼睛
]

const LIFE_PALETTE = [
  'transparent',  // 0
  '#080d18',      // 1 深蓝黑背景
  '#00d4ff',      // 2 青主色
  '#8eefff',      // 3 浅青高光
  '#006688',      // 4 深青（深主题）
  '#ffe0c2',      // 5 暖肤色（统一）
  '#ff6b35',      // 6 橙（副主题）
  '#3a2a1a',      // 7 棕发/暗部
  '#ffd700',      // 8 金黄
  '#ffffff',      // 9 白
  '#c900ff',      // 10 紫点缀
  '#0099cc',      // 11 中青（中主题）
  '#ff4466',      // 12 红/嘴
  '#ff8ab8',      // 13 粉点缀
  '#004466',      // 14 暗青/灰发
  '#203040',      // 15 阴影/眼睛
]

const CAREER_PALETTE = [
  'transparent',  // 0
  '#080f0a',      // 1 深绿黑背景
  '#00ff88',      // 2 绿主色
  '#a3ffcc',      // 3 浅绿高光
  '#005533',      // 4 深绿（深主题）
  '#ffe0c2',      // 5 暖肤色（统一）
  '#ff6b35',      // 6 橙（副主题）
  '#3a2a1a',      // 7 棕发/暗部
  '#ffd700',      // 8 金黄
  '#ffffff',      // 9 白
  '#00d4ff',      // 10 青点缀
  '#00cc6a',      // 11 中绿（中主题）
  '#ff3d3d',      // 12 红/嘴
  '#4488ff',      // 13 蓝点缀
  '#003322',      // 14 暗绿/灰发
  '#203028',      // 15 阴影/眼睛
]

// ============================================================
// 画布 & 常量
// ============================================================
const W = 24, H = 20

function emptyCanvas(): PixelFrame {
  return Array.from({ length: H }, () => Array(W).fill(0))
}

// ============================================================
// 像素小人绘制辅助（开罗风格2头身Q版）
// 标准小人高8像素：头(3行) + 身(3行) + 腿(2行)，宽4像素
// ============================================================

/**
 * 在画布上画一个Q版小人
 * 调色板索引约定：5=肤色, 7=深棕发, 8=金发, 9=白, 12=红嘴, 14=灰发, 15=黑眼/阴影
 */
function drawPerson(
  c: PixelFrame,
  x: number, y: number,
  color: number,
  skin: number = 5,
  hair: number = 7,
  dir: 'front'|'left'|'right'|'back' = 'front',
  mood: 'normal'|'happy'|'sad'|'surprised'|'angry' = 'normal',
  action: 'stand'|'walk1'|'walk2'|'armsup'|'sit'|'jump'|'bow'|'cheer'|'type'|'lie' = 'stand'
) {
  // 安全检查：确保行存在
  const ensureRow = (r: number) => {
    if (!c[r]) c[r] = Array(W).fill(0)
  }

  // 头部 (y, y+1, y+2) - 3行高
  // 头发
  ensureRow(y); ensureRow(y+1); ensureRow(y+2)
  c[y][x+1] = hair; c[y][x+2] = hair
  if (dir !== 'back') {
    c[y+1][x] = hair; c[y+1][x+3] = hair
  } else {
    c[y+1][x] = hair; c[y+1][x+1] = hair; c[y+1][x+2] = hair; c[y+1][x+3] = hair
    c[y+2][x] = hair; c[y+2][x+3] = hair
  }
  // 脸
  if (dir !== 'back') {
    c[y+1][x+1] = skin; c[y+1][x+2] = skin
    c[y+2][x+1] = skin; c[y+2][x+2] = skin
    // 五官
    if (dir === 'front') {
      c[y+1][x+1] = 15; c[y+1][x+2] = 15  // 黑眼睛
      switch (mood) {
        case 'happy':
          c[y+2][x+1] = skin; c[y+2][x+2] = skin
          c[y+2][x+1] = 12; c[y+2][x+2] = 12  // 笑嘴（红色）
          break
        case 'sad':
          c[y+2][x+1] = 15; c[y+2][x+2] = 15
          break
        case 'surprised':
          c[y+2][x+1] = 9; c[y+2][x+2] = 9  // O嘴（白）
          break
        case 'angry':
          c[y][x+1] = 12; c[y][x+2] = 12  // 皱眉（红）
          c[y+2][x+1] = 12; c[y+2][x+2] = 12
          break
        default:
          c[y+2][x+1] = 15; c[y+2][x+2] = 15  // 普通小嘴
      }
    } else if (dir === 'left') {
      c[y+1][x+1] = 15
      c[y+2][x+1] = 15
    } else if (dir === 'right') {
      c[y+1][x+2] = 15
      c[y+2][x+2] = 15
    }
  }
  // 身体 (y+3, y+4, y+5) - 3行
  const sy = y + 3
  ensureRow(sy); ensureRow(sy+1); ensureRow(sy+2); ensureRow(sy+3)
  switch (action) {
    case 'stand':
      c[sy][x+1] = color; c[sy][x+2] = color
      c[sy+1][x+1] = color; c[sy+1][x+2] = color
      c[sy+2][x+1] = color; c[sy+2][x+2] = color
      c[sy+1][x] = skin; c[sy+1][x+3] = skin
      // 腿
      c[sy+3][x+1] = 7; c[sy+3][x+2] = 7
      break
    case 'walk1':
      c[sy][x+1] = color; c[sy][x+2] = color
      c[sy+1][x+1] = color; c[sy+1][x+2] = color
      c[sy+2][x+1] = color; c[sy+2][x+2] = color
      c[sy][x] = skin; c[sy+2][x+3] = skin
      c[sy+3][x+1] = 7; c[sy+3][x+3] = 7
      break
    case 'walk2':
      c[sy][x+1] = color; c[sy][x+2] = color
      c[sy+1][x+1] = color; c[sy+1][x+2] = color
      c[sy+2][x+1] = color; c[sy+2][x+2] = color
      c[sy+2][x] = skin; c[sy][x+3] = skin
      c[sy+3][x] = 7; c[sy+3][x+2] = 7
      break
    case 'armsup':
      c[sy][x+1] = color; c[sy][x+2] = color
      c[sy+1][x+1] = color; c[sy+1][x+2] = color
      c[sy+2][x+1] = color; c[sy+2][x+2] = color
      ensureRow(sy-1)
      c[sy-1][x] = skin; c[sy-1][x+3] = skin
      c[sy][x] = color; c[sy][x+3] = color
      c[sy+3][x+1] = 7; c[sy+3][x+2] = 7
      break
    case 'cheer':
      c[sy][x+1] = color; c[sy][x+2] = color
      c[sy+1][x+1] = color; c[sy+1][x+2] = color
      c[sy+2][x+1] = color; c[sy+2][x+2] = color
      ensureRow(sy-1)
      c[sy-1][x+3] = skin
      c[sy][x+3] = color
      c[sy+1][x] = skin
      c[sy+3][x+1] = 7; c[sy+3][x+2] = 7
      break
    case 'jump':
      ensureRow(sy-1)
      c[sy-1][x+1] = color; c[sy-1][x+2] = color
      c[sy][x+1] = color; c[sy][x+2] = color
      c[sy+1][x+1] = color; c[sy+1][x+2] = color
      c[sy][x] = skin; c[sy][x+3] = skin
      c[sy+2][x] = 7; c[sy+2][x+3] = 7
      break
    case 'sit':
      c[sy][x+1] = color; c[sy][x+2] = color
      c[sy+1][x+1] = color; c[sy+1][x+2] = color
      c[sy+2][x] = 7; c[sy+2][x+1] = 7; c[sy+2][x+2] = 7; c[sy+2][x+3] = 7
      c[sy+1][x] = skin
      break
    case 'bow':
      c[y+2][x+1] = color; c[y+2][x+2] = color
      c[sy][x+1] = color; c[sy][x+2] = color
      c[sy+1][x+1] = color; c[sy+1][x+2] = color
      c[sy+2][x+1] = color; c[sy+2][x+2] = color
      c[sy+3][x+1] = 7; c[sy+3][x+2] = 7
      break
    case 'type':
      c[sy][x+1] = color; c[sy][x+2] = color
      c[sy+1][x+1] = color; c[sy+1][x+2] = color
      c[sy+2][x+1] = color; c[sy+2][x+2] = color
      c[sy+1][x+3] = skin
      ensureRow(x+4)
      if (c[sy+1]) c[sy+1][x+4] = skin
      c[sy+3][x+1] = 7; c[sy+3][x+2] = 7
      break
    case 'lie':
      c[y][x+1] = hair; c[y][x+2] = hair
      c[y+1][x+1] = skin; c[y+1][x+2] = skin
      c[y+1][x+1] = 15; c[y+1][x+2] = 15  // 闭眼
      ensureRow(y+2); ensureRow(y+3)
      c[y+2][x] = color; c[y+2][x+1] = color; c[y+2][x+2] = color; c[y+2][x+3] = color
      c[y+3][x] = color; c[y+3][x+1] = color; c[y+3][x+2] = color; c[y+3][x+3] = color
      break
  }
}

// 画地面线
function drawGround(c: PixelFrame, color: number, y: number = H-1) {
  if (!c[y]) c[y] = Array(W).fill(0)
  for (let i = 0; i < W; i++) c[y][i] = color
}

// 画爱心
function drawHeart(c: PixelFrame, cx: number, cy: number, color: number) {
  for (let r = 0; r < 4; r++) if (!c[cy+r]) c[cy+r] = Array(W).fill(0)
  c[cy][cx-1] = color; c[cy][cx] = color; c[cy][cx+1] = color; c[cy][cx+2] = color
  c[cy+1][cx-2] = color; c[cy+1][cx-1] = color; c[cy+1][cx] = color; c[cy+1][cx+1] = color; c[cy+1][cx+2] = color; c[cy+1][cx+3] = color
  c[cy+2][cx-1] = color; c[cy+2][cx] = color; c[cy+2][cx+1] = color; c[cy+2][cx+2] = color
  c[cy+3][cx] = color; c[cy+3][cx+1] = color
}

// 画房子
function drawHouse(c: PixelFrame, x: number, y: number, wallColor: number, roofColor: number, doorColor: number, hasSmoke: boolean = false) {
  for (let r = 0; r < 9; r++) if (!c[y+r]) c[y+r] = Array(W).fill(0)
  c[y][x+3] = roofColor
  c[y+1][x+2] = roofColor; c[y+1][x+3] = roofColor; c[y+1][x+4] = roofColor
  c[y+2][x+1] = roofColor; c[y+2][x+2] = roofColor; c[y+2][x+3] = roofColor; c[y+2][x+4] = roofColor; c[y+2][x+5] = roofColor
  for (let r = y+3; r <= y+7; r++) {
    for (let col = x; col <= x+6; col++) {
      c[r][col] = wallColor
    }
  }
  c[y+6][x+3] = doorColor; c[y+6][x+4] = doorColor
  c[y+7][x+3] = doorColor; c[y+7][x+4] = doorColor
  c[y+7][x+4] = 5  // 门把手（肤色=金属感）
  c[y+4][x+1] = 9; c[y+4][x+5] = 9
  c[y+5][x+1] = 9; c[y+5][x+5] = 9
  c[y+4][x] = 15; c[y+5][x] = 15
  c[y+4][x+6] = 15; c[y+5][x+6] = 15
  if (hasSmoke) {
    c[y+1][x+5] = 15; c[y+2][x+5] = 15
  }
}

// 画电脑/显示器
function drawComputer(c: PixelFrame, x: number, y: number, screenColor: number = 3) {
  for (let r = 0; r < 6; r++) if (!c[y+r]) c[y+r] = Array(W).fill(0)
  c[y][x] = 15; c[y][x+1] = 15; c[y][x+2] = 15; c[y][x+3] = 15; c[y][x+4] = 15
  c[y+1][x] = 15; c[y+1][x+1] = screenColor; c[y+1][x+2] = screenColor; c[y+1][x+3] = screenColor; c[y+1][x+4] = 15
  c[y+2][x] = 15; c[y+2][x+1] = screenColor; c[y+2][x+2] = screenColor; c[y+2][x+3] = screenColor; c[y+2][x+4] = 15
  c[y+3][x] = 15; c[y+3][x+1] = 15; c[y+3][x+2] = 15; c[y+3][x+3] = 15; c[y+3][x+4] = 15
  c[y+4][x+2] = 15
  c[y+5][x+1] = 15; c[y+5][x+2] = 15; c[y+5][x+3] = 15
}

// 画床
function drawBed(c: PixelFrame, x: number, y: number, blanketColor: number) {
  for (let r = 0; r < 5; r++) if (!c[y+r]) c[y+r] = Array(W).fill(0)
  c[y][x] = 14; c[y+1][x] = 14; c[y+2][x] = 14
  for (let r = y; r <= y+3; r++) {
    for (let col = x+1; col <= x+8; col++) {
      c[r][col] = blanketColor
    }
  }
  c[y][x+1] = 9; c[y][x+2] = 9; c[y+1][x+1] = 9; c[y+1][x+2] = 9
}

// 画桌子
function drawTable(c: PixelFrame, x: number, y: number, color: number = 14) {
  for (let r = 0; r < 4; r++) if (!c[y+r]) c[y+r] = Array(W).fill(0)
  for (let col = x; col <= x+7; col++) c[y][col] = color
  c[y+1][x] = color; c[y+1][x+7] = color
  c[y+2][x] = color; c[y+2][x+7] = color
  c[y+3][x] = 15; c[y+3][x+7] = 15
}

// 画椅子
function drawChair(c: PixelFrame, x: number, y: number, color: number = 7) {
  for (let r = 0; r < 4; r++) if (!c[y+r]) c[y+r] = Array(W).fill(0)
  c[y][x] = color; c[y][x+1] = color; c[y][x+2] = color
  c[y+1][x] = color; c[y+1][x+2] = color
  c[y+2][x] = color; c[y+2][x+2] = color
  c[y+3][x] = 15; c[y+3][x+2] = 15
}

// 画酒杯/杯子
function drawCup(c: PixelFrame, x: number, y: number, color: number = 8) {
  for (let r = 0; r < 3; r++) if (!c[y+r]) c[y+r] = Array(W).fill(0)
  c[y][x] = color; c[y][x+1] = color
  c[y+1][x] = color; c[y+1][x+1] = color
  c[y+2][x] = 9; c[y+2][x+1] = 9
}

// 画行李箱
function drawSuitcase(c: PixelFrame, x: number, y: number, color: number = 6) {
  for (let r = 0; r < 4; r++) if (!c[y+r]) c[y+r] = Array(W).fill(0)
  c[y][x+1] = 15
  for (let col = x; col <= x+4; col++) c[y+1][col] = color
  for (let col = x; col <= x+4; col++) c[y+2][col] = color
  for (let col = x; col <= x+4; col++) c[y+3][col] = color
  c[y+2][x+2] = 8; c[y+2][x+3] = 8
}

// 画火车/地铁
function drawTrain(c: PixelFrame, x: number, y: number) {
  for (let r = 0; r < 5; r++) if (!c[y+r]) c[y+r] = Array(W).fill(0)
  for (let col = x; col <= x+12; col++) c[y][col] = 15
  for (let col = x; col <= x+12; col++) c[y+1][col] = 2
  c[y+1][x+2] = 3; c[y+1][x+3] = 3; c[y+1][x+4] = 3
  c[y+1][x+8] = 3; c[y+1][x+9] = 3; c[y+1][x+10] = 3
  for (let col = x; col <= x+12; col++) c[y+2][col] = 2
  for (let col = x; col <= x+12; col++) c[y+3][col] = 15
  c[y+4][x+1] = 15; c[y+4][x+2] = 15; c[y+4][x+10] = 15; c[y+4][x+11] = 15
}

// 画手机
function drawPhone(c: PixelFrame, x: number, y: number, screenColor: number = 3) {
  for (let r = 0; r < 4; r++) if (!c[y+r]) c[y+r] = Array(W).fill(0)
  c[y][x] = 15; c[y][x+1] = 15; c[y][x+2] = 15
  c[y+1][x] = 15; c[y+1][x+1] = screenColor; c[y+1][x+2] = 15
  c[y+2][x] = 15; c[y+2][x+1] = screenColor; c[y+2][x+2] = 15
  c[y+3][x] = 15; c[y+3][x+1] = 15; c[y+3][x+2] = 15
}

// 画钱/钞票
function drawMoney(c: PixelFrame, x: number, y: number, color: number = 8) {
  for (let r = 0; r < 3; r++) if (!c[y+r]) c[y+r] = Array(W).fill(0)
  c[y][x] = color; c[y][x+1] = color; c[y][x+2] = color
  c[y+1][x] = color; c[y+1][x+1] = 9; c[y+1][x+2] = color
  c[y+2][x] = color; c[y+2][x+1] = color; c[y+2][x+2] = color
}

// 画星星/闪光
function drawSparkle(c: PixelFrame, x: number, y: number, color: number = 8) {
  for (let r = 0; r < 3; r++) if (!c[y+r]) c[y+r] = Array(W).fill(0)
  c[y][x+1] = color
  c[y+1][x] = color; c[y+1][x+1] = color; c[y+1][x+2] = color
  c[y+2][x+1] = color
}

// ============================================================
// 场景生成 - 家庭
// ============================================================

function sceneMarriage(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 2, H-1); drawGround(f2, 2, H-1)
  drawPerson(f1, 4, 6, 4, 5, 7, 'front', 'happy', 'stand')
  drawPerson(f1, 14, 6, 9, 5, 8, 'front', 'happy', 'stand')
  drawPerson(f2, 4, 6, 4, 5, 7, 'front', 'happy', 'cheer')
  drawPerson(f2, 14, 6, 9, 5, 8, 'front', 'happy', 'cheer')
  drawHeart(f1, 10, 3, 4); drawHeart(f2, 10, 2, 4)
  f1[1][2] = 4; f1[0][8] = 3; f1[1][18] = 4; f1[2][20] = 3
  f2[2][2] = 4; f2[1][8] = 3; f2[0][18] = 4; f2[1][20] = 3
  return [f1, f2]
}

function sceneHouse(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 2, H-1); drawGround(f2, 2, H-1)
  drawHouse(f1, 14, 5, 11, 4, 7, true)
  drawHouse(f2, 14, 5, 11, 4, 7, true)
  drawPerson(f1, 4, 9, 2, 5, 7, 'right', 'happy', 'cheer')
  drawPerson(f2, 4, 9, 2, 5, 7, 'right', 'happy', 'jump')
  f1[10][9] = 8; f1[11][9] = 8
  f2[8][9] = 8; f2[9][9] = 8
  f1[3][20] = 1; f1[2][20] = 1
  f2[4][20] = 1; f2[3][20] = 1
  return [f1, f2]
}

function sceneBaby(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 2, H-1); drawGround(f2, 2, H-1)
  drawPerson(f1, 8, 6, 2, 5, 7, 'front', 'happy', 'armsup')
  drawPerson(f2, 8, 6, 2, 5, 7, 'front', 'happy', 'cheer')
  f1[6][11] = 9; f1[6][12] = 9; f1[7][11] = 5; f1[7][12] = 5
  f2[6][11] = 9; f2[6][12] = 9; f2[7][11] = 5; f2[7][12] = 5
  f1[2][4] = 8; f1[1][18] = 8; f1[3][20] = 3
  f2[3][4] = 8; f2[2][18] = 8; f2[1][20] = 3
  return [f1, f2]
}

function sceneCar(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 2, H-1); drawGround(f2, 2, H-1)
  // 车身 - 用life调色板的青色系
  for (let col = 8; col <= 19; col++) { f1[13][col] = 2; f2[13][col] = 2 }
  for (let col = 10; col <= 17; col++) { f1[12][col] = 2; f2[12][col] = 2 }
  for (let col = 11; col <= 16; col++) { f1[11][col] = 3; f2[11][col] = 3 }
  // 车轮
  f1[14][9] = 15; f1[14][10] = 15; f1[15][9] = 15; f1[15][10] = 15
  f1[14][17] = 15; f1[14][18] = 15; f1[15][17] = 15; f1[15][18] = 15
  f2[14][9] = 15; f2[14][10] = 15; f2[15][9] = 15; f2[15][10] = 15
  f2[14][17] = 15; f2[14][18] = 15; f2[15][17] = 15; f2[15][18] = 15
  f1[13][19] = 8; f2[13][19] = 8
  drawPerson(f1, 2, 10, 2, 5, 7, 'right', 'happy', 'jump')
  drawPerson(f2, 3, 10, 2, 5, 7, 'right', 'happy', 'stand')
  return [f1, f2]
}

function sceneCoupleFight(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 2, H-1); drawGround(f2, 2, H-1)
  drawPerson(f1, 5, 8, 4, 5, 7, 'right', 'angry', 'armsup')
  drawPerson(f1, 14, 8, 2, 5, 8, 'left', 'angry', 'armsup')
  drawPerson(f2, 5, 8, 4, 5, 7, 'right', 'angry', 'stand')
  drawPerson(f2, 14, 8, 2, 5, 8, 'left', 'angry', 'stand')
  f1[4][11] = 8; f1[5][11] = 8; f1[5][10] = 8; f1[6][11] = 8
  f2[3][11] = 8; f2[4][11] = 8; f2[4][10] = 8; f2[5][11] = 8
  return [f1, f2]
}

function sceneDivorce(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 2, H-1); drawGround(f2, 2, H-1)
  drawPerson(f1, 2, 9, 4, 5, 7, 'left', 'sad', 'walk1')
  drawPerson(f1, 17, 9, 2, 5, 8, 'right', 'sad', 'walk2')
  drawPerson(f2, 1, 9, 4, 5, 7, 'left', 'sad', 'walk2')
  drawPerson(f2, 18, 9, 2, 5, 8, 'right', 'sad', 'walk1')
  f1[11][10] = 12; f1[11][11] = 12; f1[12][9] = 12; f1[12][12] = 12
  f2[11][10] = 12; f2[11][11] = 12; f2[12][9] = 12; f2[12][12] = 12
  return [f1, f2]
}

function sceneOldCouple(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 2, H-1); drawGround(f2, 2, H-1)
  for (let r = 13; r <= 16; r++) {
    for (let col = 2; col <= 20; col++) { f1[r][col] = 4; f2[r][col] = 4 }
  }
  drawPerson(f1, 4, 7, 4, 5, 14, 'front', 'happy', 'sit')
  drawPerson(f1, 12, 7, 2, 5, 14, 'front', 'happy', 'sit')
  drawPerson(f2, 4, 7, 4, 5, 14, 'front', 'happy', 'sit')
  drawPerson(f2, 12, 7, 2, 5, 14, 'front', 'happy', 'sit')
  // 电视
  for (let r = 2; r <= 6; r++) for (let col = 8; col <= 15; col++) { f1[r][col] = 15; f2[r][col] = 15 }
  for (let r = 3; r <= 5; r++) for (let col = 9; col <= 14; col++) { f1[r][col] = 3; f2[r][col] = 3 }
  f1[4][11] = 8; f1[4][12] = 8; f2[4][11] = 8; f2[4][12] = 8
  return [f1, f2]
}

function sceneMidnightBaby(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  for (let r = 12; r <= 15; r++) for (let col = 13; col <= 21; col++) { f1[r][col] = 4; f2[r][col] = 4 }
  f1[13][16] = 5; f1[13][17] = 5; f1[14][16] = 9; f1[14][17] = 9
  f2[13][16] = 5; f2[13][17] = 5; f2[14][16] = 9; f2[14][17] = 9
  drawPerson(f1, 3, 9, 2, 5, 7, 'right', 'surprised', 'sit')
  drawPerson(f2, 3, 10, 2, 5, 7, 'right', 'sad', 'sit')
  f1[4][19] = 9; f1[3][20] = 9; f1[2][21] = 9
  f2[5][19] = 9; f2[4][20] = 9; f2[3][21] = 9
  f1[1][3] = 8; f1[1][4] = 8; f1[2][3] = 8
  f2[1][3] = 8; f2[1][4] = 8; f2[2][3] = 8
  return [f1, f2]
}

function sceneGrandchildren(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 2, H-1); drawGround(f2, 2, H-1)
  drawPerson(f1, 3, 8, 4, 5, 14, 'front', 'happy', 'sit')
  drawPerson(f2, 3, 8, 4, 5, 14, 'front', 'happy', 'stand')
  const cx = 13, cy = 11
  f1[cy][cx] = 5; f1[cy][cx+1] = 5; f1[cy+1][cx] = 5; f1[cy+1][cx+1] = 5
  f1[cy+2][cx] = 2; f1[cy+2][cx+1] = 2; f1[cy+3][cx] = 7; f1[cy+3][cx+1] = 7
  f1[cy][cx] = 15; f1[cy][cx+1] = 15
  f2[cy-1][cx] = 5; f2[cy-1][cx+1] = 5; f2[cy][cx] = 5; f2[cy][cx+1] = 5
  f2[cy+1][cx] = 2; f2[cy+1][cx+1] = 2; f2[cy+2][cx] = 7; f2[cy+2][cx+1] = 7
  f2[cy-1][cx] = 15; f2[cy-1][cx+1] = 15
  f1[2][19] = 8; f1[3][21] = 3
  f2[3][19] = 8; f2[2][21] = 3
  return [f1, f2]
}

function sceneAnniversary(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 4, H-1); drawGround(f2, 4, H-1)
  for (let col = 6; col <= 17; col++) { f1[14][col] = 9; f2[14][col] = 9 }
  for (let col = 6; col <= 17; col++) { f1[15][col] = 15; f2[15][col] = 15 }
  drawPerson(f1, 3, 8, 4, 5, 7, 'right', 'happy', 'sit')
  drawPerson(f1, 16, 8, 2, 5, 8, 'left', 'happy', 'sit')
  drawPerson(f2, 3, 8, 4, 5, 7, 'right', 'happy', 'sit')
  drawPerson(f2, 16, 8, 2, 5, 8, 'left', 'happy', 'sit')
  f1[12][11] = 8; f1[13][11] = 9
  f2[11][11] = 8; f2[12][11] = 8; f2[13][11] = 9
  drawHeart(f1, 10, 3, 4); drawHeart(f2, 10, 2, 4)
  return [f1, f2]
}

// ============================================================
// 场景生成 - 生活
// ============================================================

function sceneWork(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 2, H-1); drawGround(f2, 2, H-1)
  for (let col = 5; col <= 18; col++) { f1[14][col] = 15; f2[14][col] = 15 }
  drawComputer(f1, 9, 7); drawComputer(f2, 9, 7)
  f1[8][10] = 3; f1[8][11] = 3; f1[8][12] = 3
  f2[8][10] = 2; f2[8][11] = 2; f2[8][12] = 2
  drawPerson(f1, 7, 8, 2, 5, 7, 'front', 'normal', 'type')
  drawPerson(f2, 7, 8, 2, 5, 7, 'front', 'normal', 'type')
  f1[12][14] = 5; f2[12][13] = 5
  return [f1, f2]
}

function sceneFriendDrink(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 2, H-1); drawGround(f2, 2, H-1)
  for (let col = 5; col <= 18; col++) { f1[15][col] = 14; f2[15][col] = 14 }
  drawPerson(f1, 4, 8, 9, 5, 7, 'right', 'happy', 'sit')
  drawPerson(f1, 13, 8, 6, 5, 8, 'left', 'happy', 'sit')
  drawPerson(f2, 4, 8, 9, 5, 7, 'right', 'happy', 'cheer')
  drawPerson(f2, 13, 8, 6, 5, 8, 'left', 'happy', 'cheer')
  f1[14][9] = 8; f1[14][10] = 8
  f2[13][9] = 8; f2[13][10] = 8
  f2[12][17] = 8; f2[12][18] = 8
  f1[3][7] = 3; f1[2][15] = 3
  f2[4][7] = 3; f2[3][15] = 3
  return [f1, f2]
}

function sceneTravel(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 2, H-1); drawGround(f2, 2, H-1)
  f1[2][2] = 9; f1[2][3] = 9; f1[2][4] = 9; f1[3][3] = 9
  f1[1][17] = 9; f1[1][18] = 9; f1[1][19] = 9; f1[2][18] = 9
  f2[3][2] = 9; f2[3][3] = 9; f2[3][4] = 9; f2[4][3] = 9
  f2[2][17] = 9; f2[2][18] = 9; f2[2][19] = 9; f2[3][18] = 9
  f1[2][20] = 8; f1[2][21] = 8; f1[3][20] = 8; f1[3][21] = 8
  f2[2][20] = 8; f2[2][21] = 8; f2[3][20] = 8; f2[3][21] = 8
  drawPerson(f1, 9, 7, 2, 5, 7, 'right', 'happy', 'walk1')
  drawPerson(f2, 10, 7, 2, 5, 7, 'right', 'happy', 'walk2')
  f1[8][8] = 6; f1[9][8] = 6; f1[10][8] = 6
  f2[8][9] = 6; f2[9][9] = 6; f2[10][9] = 6
  return [f1, f2]
}

function sceneSickness(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawBed(f1, 4, 10, 4); drawBed(f2, 4, 10, 4)
  drawPerson(f1, 6, 10, 9, 5, 7, 'front', 'sad', 'lie')
  drawPerson(f2, 6, 10, 9, 5, 7, 'front', 'sad', 'lie')
  f1[10][8] = 3; f1[10][9] = 3
  f2[10][8] = 3; f2[10][9] = 3
  f1[2][20] = 12; f1[1][20] = 12; f1[2][19] = 12; f1[2][21] = 12; f1[3][20] = 12
  f2[2][20] = 12; f2[1][20] = 12; f2[2][19] = 12; f2[2][21] = 12; f2[3][20] = 12
  return [f1, f2]
}

function sceneGym(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 2, H-1); drawGround(f2, 2, H-1)
  drawPerson(f1, 9, 7, 6, 5, 7, 'front', 'happy', 'armsup')
  drawPerson(f2, 9, 6, 6, 5, 7, 'front', 'happy', 'armsup')
  f1[6][8] = 15; f1[6][9] = 15; f1[6][14] = 15; f1[6][15] = 15
  f2[5][8] = 15; f2[5][9] = 15; f2[5][14] = 15; f2[5][15] = 15
  f1[5][13] = 3; f1[4][14] = 3
  f2[4][13] = 3; f2[3][14] = 3
  return [f1, f2]
}

function sceneFishing(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  for (let col = 0; col < W; col++) { f1[16][col] = 4; f2[16][col] = 4 }
  for (let col = 0; col < W; col++) { f1[17][col] = 4; f2[17][col] = 4 }
  for (let col = 0; col < W; col++) { f1[18][col] = 14; f2[18][col] = 14 }
  for (let col = 0; col < W; col++) { f1[19][col] = 1; f2[19][col] = 1 }
  drawGround(f1, 2, 15); drawGround(f2, 2, 15)
  drawPerson(f1, 3, 8, 2, 5, 7, 'right', 'normal', 'sit')
  drawPerson(f2, 3, 8, 2, 5, 7, 'right', 'happy', 'sit')
  const rod = [[9,8],[9,9],[9,10],[9,11],[9,12],[10,13],[11,14],[12,15],[13,16],[14,16]]
  for (const [r,c] of rod) { f1[r][c] = 7; f2[r][c] = 7 }
  f2[14][17] = 7
  f1[17][18] = 8; f2[16][18] = 8
  f1[16][15] = 3; f1[16][16] = 3
  f2[16][17] = 3; f2[16][18] = 3
  return [f1, f2]
}

function sceneSquareDance(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 2, H-1); drawGround(f2, 2, H-1)
  drawPerson(f1, 4, 8, 4, 5, 7, 'front', 'happy', 'cheer')
  drawPerson(f1, 10, 8, 2, 5, 8, 'front', 'happy', 'armsup')
  drawPerson(f1, 16, 8, 6, 5, 7, 'front', 'happy', 'jump')
  drawPerson(f2, 4, 8, 4, 5, 7, 'front', 'happy', 'jump')
  drawPerson(f2, 10, 8, 2, 5, 8, 'front', 'happy', 'cheer')
  drawPerson(f2, 16, 8, 6, 5, 7, 'front', 'happy', 'armsup')
  f1[2][2] = 8; f1[3][10] = 8; f1[1][19] = 8
  f2[3][2] = 8; f2[2][10] = 8; f2[2][19] = 8
  return [f1, f2]
}

function sceneLottery(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 8, H-1); drawGround(f2, 8, H-1)
  drawPerson(f1, 9, 8, 2, 5, 7, 'front', 'surprised', 'armsup')
  drawPerson(f2, 9, 8, 2, 5, 7, 'front', 'happy', 'jump')
  for (let i = 0; i < 8; i++) {
    const x = 2 + i * 3
    f1[2 + (i%3)][x] = 8; f1[4 + (i%2)][x+1] = 8
    f2[3 + (i%3)][x] = 8; f2[2 + (i%2)][x+1] = 8
  }
  f1[5][5] = 8; f1[5][18] = 8; f2[6][5] = 8; f2[6][18] = 8
  return [f1, f2]
}

function scenePet(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 2, H-1); drawGround(f2, 2, H-1)
  drawPerson(f1, 5, 8, 2, 5, 7, 'right', 'happy', 'sit')
  drawPerson(f2, 5, 8, 2, 5, 7, 'right', 'happy', 'sit')
  const cx = 14, cy = 13
  f1[cy][cx] = 6; f1[cy][cx+1] = 6; f1[cy][cx+2] = 6; f1[cy+1][cx] = 6
  f1[cy+1][cx+1] = 6; f1[cy+1][cx+2] = 6; f1[cy+2][cx+1] = 6
  f1[cy][cx] = 15; f1[cy][cx+2] = 15
  f1[cy+1][cx] = 3; f1[cy+1][cx+2] = 3
  f2[cy][cx] = 6; f2[cy][cx+1] = 6; f2[cy][cx+2] = 6; f2[cy+1][cx] = 6
  f2[cy+1][cx+1] = 6; f2[cy+1][cx+2] = 6; f2[cy+2][cx] = 6; f2[cy+2][cx+2] = 6
  f2[cy][cx] = 15; f2[cy][cx+2] = 15
  f2[cy+1][cx] = 3; f2[cy+1][cx+2] = 3
  drawHeart(f1, 16, 4, 5); drawHeart(f2, 16, 3, 5)
  return [f1, f2]
}

function sceneReading(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 2, H-1); drawGround(f2, 2, H-1)
  drawPerson(f1, 9, 8, 10, 5, 7, 'front', 'normal', 'sit')
  drawPerson(f2, 9, 8, 10, 5, 7, 'front', 'happy', 'sit')
  f1[13][10] = 9; f1[13][11] = 9; f1[13][12] = 9; f1[13][13] = 9
  f2[13][10] = 9; f2[13][11] = 9; f2[13][12] = 9; f2[13][13] = 9
  f1[6][16] = 8; f1[7][16] = 15; f1[8][16] = 15
  f2[6][16] = 8; f2[7][16] = 15; f2[8][16] = 15
  return [f1, f2]
}

// 恋爱/约会
function sceneDating(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 4, H-1); drawGround(f2, 4, H-1)
  drawTable(f1, 7, 13, 4); drawTable(f2, 7, 13, 4)
  drawCup(f1, 9, 11, 8); drawCup(f1, 12, 11, 8)
  drawCup(f2, 9, 11, 8); drawCup(f2, 12, 11, 8)
  drawPerson(f1, 3, 7, 4, 5, 7, 'right', 'happy', 'sit')
  drawPerson(f1, 16, 7, 6, 5, 8, 'left', 'happy', 'sit')
  drawPerson(f2, 3, 7, 4, 5, 7, 'right', 'happy', 'sit')
  drawPerson(f2, 16, 7, 6, 5, 8, 'left', 'happy', 'sit')
  drawHeart(f1, 11, 3, 4); drawHeart(f2, 11, 2, 4)
  f1[2][2] = 8; f1[1][20] = 8
  f2[1][2] = 8; f2[2][20] = 8
  return [f1, f2]
}

// 表白
function sceneConfess(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 2, H-1); drawGround(f2, 2, H-1)
  drawPerson(f1, 4, 8, 4, 5, 7, 'right', 'happy', 'bow')
  drawPerson(f1, 15, 8, 6, 5, 8, 'left', 'surprised', 'stand')
  drawPerson(f2, 4, 8, 4, 5, 7, 'right', 'happy', 'stand')
  drawPerson(f2, 15, 8, 6, 5, 8, 'left', 'happy', 'stand')
  // 鲜花
  for (let i = 0; i < 3; i++) { f1[7+i][10+i] = 12; f2[7+i][10+i] = 12 }
  f1[9][11] = 8; f2[8][11] = 8
  drawHeart(f1, 18, 3, 4); drawHeart(f2, 18, 2, 4)
  drawSparkle(f1, 1, 2, 8); drawSparkle(f1, 21, 4, 8)
  drawSparkle(f2, 2, 1, 8); drawSparkle(f2, 20, 3, 8)
  return [f1, f2]
}

// 恋爱分手
function sceneBreakup(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 2, H-1); drawGround(f2, 2, H-1)
  drawPerson(f1, 3, 9, 15, 5, 7, 'left', 'sad', 'walk1')
  drawPerson(f1, 16, 9, 15, 5, 8, 'right', 'sad', 'walk2')
  drawPerson(f2, 2, 9, 15, 5, 7, 'left', 'sad', 'walk2')
  drawPerson(f2, 17, 9, 15, 5, 8, 'right', 'sad', 'walk1')
  // 破碎的心
  f1[5][10] = 12; f1[5][13] = 12
  f1[6][9] = 12; f1[6][10] = 12; f1[6][12] = 12; f1[6][13] = 12; f1[6][14] = 12
  f1[7][10] = 12; f1[7][11] = 12; f1[7][13] = 12
  f1[6][11] = 1; f2[6][11] = 1
  f2[4][10] = 12; f2[4][13] = 12
  f2[5][9] = 12; f2[5][10] = 12; f2[5][12] = 12; f2[5][13] = 12; f2[5][14] = 12
  f2[6][10] = 12; f2[6][11] = 12; f2[6][13] = 12
  f2[5][11] = 1
  return [f1, f2]
}

// 搬家/迁移城市
function sceneMove(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 2, H-1); drawGround(f2, 2, H-1)
  drawSuitcase(f1, 4, 12, 6); drawSuitcase(f1, 10, 12, 4); drawSuitcase(f1, 16, 12, 2)
  drawSuitcase(f2, 5, 12, 6); drawSuitcase(f2, 11, 12, 4); drawSuitcase(f2, 17, 12, 2)
  drawPerson(f1, 8, 7, 2, 5, 7, 'right', 'normal', 'walk1')
  drawPerson(f2, 9, 7, 2, 5, 7, 'right', 'happy', 'walk2')
  drawTrain(f1, 2, 2); drawTrain(f2, 1, 2)
  f1[1][21] = 8; f1[0][22] = 8
  f2[0][20] = 8; f2[1][22] = 8
  return [f1, f2]
}

// 父母探望/回家
function sceneParents(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 2, H-1); drawGround(f2, 2, H-1)
  drawHouse(f1, 13, 5, 11, 4, 7, true)
  drawHouse(f2, 13, 5, 11, 4, 7, true)
  // 父母（灰发）
  drawPerson(f1, 3, 9, 4, 5, 14, 'right', 'happy', 'stand')
  drawPerson(f1, 8, 9, 2, 5, 14, 'right', 'happy', 'stand')
  drawPerson(f2, 3, 9, 4, 5, 14, 'right', 'happy', 'cheer')
  drawPerson(f2, 8, 9, 2, 5, 14, 'right', 'happy', 'cheer')
  // 自己
  drawPerson(f1, 14, 9, 6, 5, 7, 'left', 'happy', 'armsup')
  drawPerson(f2, 14, 9, 6, 5, 7, 'left', 'happy', 'jump')
  drawHeart(f1, 11, 3, 4); drawHeart(f2, 11, 2, 4)
  return [f1, f2]
}

// 父母生病
function sceneParentSick(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawBed(f1, 6, 9, 4); drawBed(f2, 6, 9, 4)
  drawPerson(f1, 8, 9, 9, 5, 14, 'front', 'sad', 'lie')
  drawPerson(f2, 8, 9, 9, 5, 14, 'front', 'sad', 'lie')
  drawPerson(f1, 2, 9, 15, 5, 7, 'right', 'sad', 'sit')
  drawPerson(f2, 2, 9, 15, 5, 7, 'right', 'sad', 'bow')
  f1[2][20] = 12; f1[1][20] = 12; f1[2][19] = 12; f1[2][21] = 12; f1[3][20] = 12
  f2[2][20] = 12; f2[1][20] = 12; f2[2][19] = 12; f2[2][21] = 12; f2[3][20] = 12
  return [f1, f2]
}

// 朋友借钱
function sceneLendMoney(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 2, H-1); drawGround(f2, 2, H-1)
  drawPerson(f1, 4, 8, 9, 5, 7, 'right', 'normal', 'stand')
  drawPerson(f1, 15, 8, 15, 5, 8, 'left', 'sad', 'bow')
  drawPerson(f2, 4, 8, 9, 5, 7, 'right', 'normal', 'stand')
  drawPerson(f2, 15, 8, 15, 5, 8, 'left', 'sad', 'bow')
  drawMoney(f1, 10, 10, 8); drawMoney(f1, 10, 11, 8)
  drawMoney(f2, 9, 10, 8); drawMoney(f2, 9, 11, 8); drawMoney(f2, 11, 10, 8)
  f1[3][3] = 6; f1[4][3] = 6
  f2[2][3] = 6; f2[3][3] = 6; f2[4][3] = 6
  return [f1, f2]
}

// 相亲
function sceneBlindDate(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 4, H-1); drawGround(f2, 4, H-1)
  drawTable(f1, 7, 13, 14); drawTable(f2, 7, 13, 14)
  drawCup(f1, 9, 11, 8); drawCup(f1, 12, 11, 8)
  drawCup(f2, 9, 11, 8); drawCup(f2, 12, 11, 8)
  drawPerson(f1, 3, 7, 4, 5, 7, 'right', 'surprised', 'sit')
  drawPerson(f1, 16, 7, 6, 5, 8, 'left', 'surprised', 'sit')
  drawPerson(f2, 3, 7, 4, 5, 7, 'right', 'normal', 'sit')
  drawPerson(f2, 16, 7, 6, 5, 8, 'left', 'normal', 'sit')
  // 问号
  f1[2][11] = 8; f1[3][11] = 8; f1[4][11] = 8; f1[4][12] = 8; f1[5][12] = 8
  f2[3][11] = 8; f2[4][11] = 8; f2[5][11] = 8; f2[5][12] = 8; f2[6][12] = 8
  return [f1, f2]
}

// 加班
function sceneOvertime(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  for (let r = 4; r <= 12; r++) for (let col = 6; col <= 17; col++) { f1[r][col] = 1; f2[r][col] = 1 }
  drawComputer(f1, 9, 6, 3); drawComputer(f2, 9, 6, 12)
  drawPerson(f1, 7, 9, 15, 5, 7, 'front', 'sad', 'type')
  drawPerson(f2, 7, 9, 15, 5, 7, 'front', 'surprised', 'type')
  // 月亮
  f1[1][19] = 8; f1[1][20] = 8; f1[2][19] = 8; f1[2][20] = 8
  f2[1][19] = 8; f2[2][18] = 8; f2[2][19] = 8; f2[2][20] = 8
  // 咖啡杯
  drawCup(f1, 15, 9, 4); drawCup(f2, 15, 9, 4)
  f1[14][5] = 9; f1[13][5] = 9; f2[14][5] = 9; f2[13][5] = 9
  return [f1, f2]
}

// 玩手机/刷手机
function scenePhone(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 2, H-1); drawGround(f2, 2, H-1)
  drawChair(f1, 9, 11, 7); drawChair(f2, 9, 11, 7)
  drawPerson(f1, 9, 5, 2, 5, 7, 'front', 'happy', 'sit')
  drawPerson(f2, 9, 5, 2, 5, 7, 'front', 'happy', 'sit')
  drawPhone(f1, 11, 9, 10); drawPhone(f2, 11, 9, 6)
  // 信号/通知
  f1[3][3] = 10; f1[2][4] = 10; f1[3][20] = 10; f1[2][19] = 10
  f2[4][3] = 10; f2[3][4] = 10; f2[4][20] = 10; f2[3][19] = 10
  return [f1, f2]
}

// 陪孩子玩
function scenePlayWithKid(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 2, H-1); drawGround(f2, 2, H-1)
  drawPerson(f1, 3, 7, 2, 5, 7, 'right', 'happy', 'armsup')
  drawPerson(f2, 3, 6, 2, 5, 7, 'right', 'happy', 'jump')
  // 小孩
  const kx = 12, ky = 11
  f1[ky][kx] = 5; f1[ky][kx+1] = 5; f1[ky+1][kx] = 5; f1[ky+1][kx+1] = 5
  f1[ky][kx] = 15; f1[ky][kx+1] = 15
  f1[ky+2][kx] = 6; f1[ky+2][kx+1] = 6; f1[ky+3][kx] = 7; f1[ky+3][kx+1] = 7
  f2[ky-1][kx] = 5; f2[ky-1][kx+1] = 5; f2[ky][kx] = 5; f2[ky][kx+1] = 5
  f2[ky-1][kx] = 15; f2[ky-1][kx+1] = 15
  f2[ky+1][kx] = 6; f2[ky+1][kx+1] = 6; f2[ky+2][kx] = 7; f2[ky+2][kx+1] = 7
  // 球
  f1[12][17] = 8; f1[12][18] = 8; f1[13][17] = 8; f1[13][18] = 8
  f2[11][16] = 8; f2[11][17] = 8; f2[12][16] = 8; f2[12][17] = 8
  drawHeart(f1, 18, 3, 4); drawHeart(f2, 18, 2, 4)
  return [f1, f2]
}

// 跳槽/换工作
function sceneJobHop(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 2, H-1); drawGround(f2, 2, H-1)
  drawPerson(f1, 4, 9, 15, 5, 7, 'right', 'normal', 'walk1')
  drawPerson(f2, 5, 9, 2, 5, 7, 'right', 'happy', 'walk2')
  // 旧公司（灰暗）
  for (let r = 5; r <= 12; r++) for (let col = 0; col <= 5; col++) f1[r][col] = 15
  for (let r = 6; r <= 11; r++) for (let col = 1; col <= 4; col++) f1[r][col] = 1
  // 新公司（明亮）
  for (let r = 3; r <= 12; r++) for (let col = 16; col <= 23; col++) f2[r][col] = 11
  for (let r = 4; r <= 11; r++) for (let col = 17; col <= 22; col++) f2[r][col] = 3
  f1[8][10] = 8; f1[9][10] = 8; f1[10][10] = 8
  f2[8][11] = 8; f2[9][11] = 8; f2[10][11] = 8
  drawSparkle(f1, 19, 2, 8); drawSparkle(f2, 20, 1, 8)
  return [f1, f2]
}

// ============================================================
// 场景生成 - 事业
// ============================================================

function scenePromotion(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 2, H-1); drawGround(f2, 2, H-1)
  drawPerson(f1, 9, 7, 2, 5, 7, 'front', 'happy', 'jump')
  drawPerson(f2, 9, 8, 2, 5, 7, 'front', 'happy', 'cheer')
  const stars: [number,number][] = [[3,2],[6,1],[12,0],[18,1],[20,3],[2,5],[21,6]]
  for (const [x,y] of stars) { f1[y][x] = 5; f2[y+1][x] = 5 }
  f1[3][10] = 5; f1[3][11] = 5; f1[3][12] = 5; f1[3][13] = 5
  f1[2][11] = 5; f1[2][12] = 5; f1[1][12] = 5
  f2[4][10] = 5; f2[4][11] = 5; f2[4][12] = 5; f2[4][13] = 5
  f2[3][11] = 5; f2[3][12] = 5; f2[2][12] = 5
  return [f1, f2]
}

function sceneStartup(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 8, H-1); drawGround(f2, 8, H-1)
  drawComputer(f1, 7, 4, 6); drawComputer(f2, 7, 4, 8)
  drawPerson(f1, 6, 9, 6, 5, 7, 'front', 'surprised', 'type')
  drawPerson(f2, 6, 9, 6, 5, 7, 'front', 'surprised', 'type')
  f1[13][13] = 5; f1[13][14] = 5
  f2[13][12] = 5; f2[13][15] = 5
  f1[3][5] = 6; f1[2][5] = 8; f1[3][6] = 6; f1[2][6] = 6; f1[4][5] = 6; f1[4][6] = 8
  f2[2][5] = 6; f2[1][5] = 8; f2[2][6] = 6; f2[1][6] = 8; f2[3][5] = 8; f2[3][6] = 6
  f1[3][18] = 6; f1[2][18] = 8; f1[3][19] = 6
  f2[2][18] = 6; f2[1][18] = 8; f2[2][19] = 6
  return [f1, f2]
}

function sceneFired(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 2, H-1); drawGround(f2, 2, H-1)
  drawPerson(f1, 9, 8, 15, 5, 7, 'front', 'sad', 'stand')
  drawPerson(f2, 9, 8, 15, 5, 7, 'front', 'sad', 'bow')
  for (let r = 13; r <= 15; r++) for (let col = 9; col <= 12; col++) { f1[r][col] = 8; f2[r][col] = 8 }
  f1[2][4] = 9; f1[4][18] = 9; f1[6][20] = 9
  f2[3][4] = 9; f2[5][18] = 9; f2[7][20] = 9
  return [f1, f2]
}

function sceneBankruptcy(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 2, H-1); drawGround(f2, 2, H-1)
  drawPerson(f1, 9, 10, 12, 5, 7, 'front', 'sad', 'bow')
  drawPerson(f2, 9, 10, 12, 5, 7, 'front', 'sad', 'bow')
  for (let i = 0; i < 6; i++) {
    const y = 2 + i*2
    f1[y][2+i*3] = 8; f1[y+1][2+i*3] = 5
    f2[y+1][3+i*3] = 8; f2[y+2][3+i*3] = 5
  }
  return [f1, f2]
}

function sceneRetirementParty(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 2, H-1); drawGround(f2, 2, H-1)
  drawPerson(f1, 9, 7, 2, 5, 14, 'front', 'happy', 'cheer')
  drawPerson(f2, 9, 7, 2, 5, 14, 'front', 'happy', 'armsup')
  for (let i = 0; i < 10; i++) {
    const x = i * 2 + 1
    f1[1+i%3][x] = [2,3,4,6,8,10,12][i%7]
    f2[2+i%3][x] = [2,3,4,6,8,10,12][(i+2)%7]
  }
  f1[5][10] = 4; f1[5][11] = 4; f1[5][12] = 4; f1[4][11] = 4
  f2[4][10] = 4; f2[4][11] = 4; f2[4][12] = 4; f2[3][11] = 4
  return [f1, f2]
}

function sceneInvestment(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawGround(f1, 2, H-1); drawGround(f2, 2, H-1)
  drawPerson(f1, 3, 8, 2, 5, 7, 'right', 'normal', 'sit')
  drawPerson(f2, 3, 8, 2, 5, 7, 'right', 'happy', 'sit')
  for (let r = 4; r <= 12; r++) for (let col = 10; col <= 21; col++) { f1[r][col] = 1; f2[r][col] = 1 }
  for (let r = 4; r <= 12; r++) { f1[r][10] = 15; f1[r][21] = 15; f2[r][10] = 15; f2[r][21] = 15 }
  for (let col = 10; col <= 21; col++) { f1[12][col] = 15; f2[12][col] = 15; f1[4][col] = 15; f2[4][col] = 15 }
  const bars1 = [[11,11,6],[12,9,6],[13,10,8],[14,7,6],[15,8,8],[16,6,6],[17,5,8],[18,6,6],[19,4,8]]
  const bars2 = [[11,10,6],[12,8,8],[13,9,6],[14,8,8],[15,7,6],[16,6,8],[17,5,6],[18,4,8],[19,3,6]]
  for (const [x,y,c] of bars1) for (let r = y; r <= 11; r++) f1[r][x] = c
  for (const [x,y,c] of bars2) for (let r = y; r <= 11; r++) f2[r][x] = c
  return [f1, f2]
}

function sceneBurnout(): PixelFrame[] {
  const f1 = emptyCanvas(), f2 = emptyCanvas()
  drawPerson(f1, 7, 8, 15, 5, 7, 'front', 'sad', 'type')
  drawPerson(f2, 7, 8, 15, 5, 7, 'front', 'surprised', 'type')
  drawComputer(f1, 10, 5, 12); drawComputer(f2, 10, 5, 8)
  f1[9][8] = 15; f1[9][9] = 15
  f2[9][8] = 15; f2[9][9] = 15
  f1[14][6] = 9; f1[13][6] = 9
  f2[14][6] = 9; f2[13][6] = 9
  f1[1][20] = 9; f1[1][21] = 9; f1[2][20] = 9
  f2[1][20] = 9; f2[1][21] = 9; f2[2][20] = 9
  return [f1, f2]
}

// ============================================================
// 导出所有场景
// ============================================================

export const STORYBOARD_SCENES: StoryboardScene[] = [
  // 家庭 - 核心关系事件
  { id: 'marriage', category: 'family', name: '结婚', keywords: ['结婚','婚礼','领证','娶','嫁'], palette: FAMILY_PALETTE, frames: sceneMarriage(), frameDelay: 600, animIn: 'pop', priority: 10 },
  { id: 'baby', category: 'family', name: '生子', keywords: ['生孩子','宝宝','婴儿','怀孕','当爸','当妈','出生'], palette: FAMILY_PALETTE, frames: sceneBaby(), frameDelay: 500, animIn: 'bounce', priority: 10 },
  { id: 'house', category: 'family', name: '买房', keywords: ['买房','购房','房子','房贷','月供','安家'], palette: FAMILY_PALETTE, frames: sceneHouse(), frameDelay: 500, animIn: 'pop', priority: 10 },
  { id: 'confess', category: 'family', name: '表白', keywords: ['表白','告白','喜欢','在一起','脱单','谈恋爱','恋爱','初恋'], palette: FAMILY_PALETTE, frames: sceneConfess(), frameDelay: 500, animIn: 'bounce', priority: 9 },
  { id: 'dating', category: 'family', name: '约会', keywords: ['约会','拍拖','交往','谈恋爱','对象'], palette: FAMILY_PALETTE, frames: sceneDating(), frameDelay: 600, animIn: 'fade', priority: 8 },
  { id: 'divorce', category: 'family', name: '离婚', keywords: ['离婚','离异'], palette: FAMILY_PALETTE, frames: sceneDivorce(), frameDelay: 500, animIn: 'fade', priority: 9 },
  { id: 'breakup', category: 'family', name: '分手', keywords: ['分手','分开','散了','失恋','吹了'], palette: FAMILY_PALETTE, frames: sceneBreakup(), frameDelay: 600, animIn: 'shake', priority: 8 },
  { id: 'parents', category: 'family', name: '回家探望', keywords: ['回家','看父母','探望','爸妈','回老家','探亲','团圆'], palette: FAMILY_PALETTE, frames: sceneParents(), frameDelay: 500, animIn: 'rise', priority: 8 },
  { id: 'parent_sick', category: 'family', name: '父母生病', keywords: ['爸病','妈病','父亲病','母亲病','爸妈住院','老人病'], palette: FAMILY_PALETTE, frames: sceneParentSick(), frameDelay: 800, animIn: 'shake', priority: 9 },
  { id: 'car', category: 'family', name: '买车', keywords: ['买车','购车','新车','提车'], palette: FAMILY_PALETTE, frames: sceneCar(), frameDelay: 400, animIn: 'slide', priority: 8 },
  { id: 'play_kid', category: 'family', name: '陪孩子玩', keywords: ['陪孩子','带娃玩','陪娃','亲子','接孩子','送孩子'], palette: FAMILY_PALETTE, frames: scenePlayWithKid(), frameDelay: 400, animIn: 'pop', priority: 7 },
  { id: 'couple_fight', category: 'family', name: '吵架', keywords: ['吵架','争吵','矛盾','冷战','婆媳'], palette: FAMILY_PALETTE, frames: sceneCoupleFight(), frameDelay: 400, animIn: 'shake', priority: 7 },
  { id: 'midnight_baby', category: 'family', name: '熬夜带娃', keywords: ['夜奶','哄睡','带娃','熬夜带','孩子哭'], palette: FAMILY_PALETTE, frames: sceneMidnightBaby(), frameDelay: 700, animIn: 'fade', priority: 7 },
  { id: 'anniversary', category: 'family', name: '纪念日', keywords: ['纪念日','烛光晚餐','周年'], palette: FAMILY_PALETTE, frames: sceneAnniversary(), frameDelay: 600, animIn: 'fade', priority: 7 },
  { id: 'blind_date', category: 'family', name: '相亲', keywords: ['相亲','介绍对象','见一面','媒婆'], palette: FAMILY_PALETTE, frames: sceneBlindDate(), frameDelay: 600, animIn: 'fade', priority: 6 },
  { id: 'grandchildren', category: 'family', name: '含饴弄孙', keywords: ['孙子','孙女','孙辈','抱孙'], palette: FAMILY_PALETTE, frames: sceneGrandchildren(), frameDelay: 500, animIn: 'pop', priority: 6 },
  { id: 'old_couple_tv', category: 'family', name: '白头偕老', keywords: ['白头','老伴','金婚','晚年','退休生活','养老'], palette: FAMILY_PALETTE, frames: sceneOldCouple(), frameDelay: 800, animIn: 'fade', priority: 6 },

  // 生活 - 日常事件
  { id: 'sickness', category: 'life', name: '生病', keywords: ['生病','住院','病倒','手术','身体出','病了'], palette: LIFE_PALETTE, frames: sceneSickness(), frameDelay: 800, animIn: 'shake', priority: 8 },
  { id: 'move', category: 'life', name: '搬家/换城市', keywords: ['搬家','换城市','去北京','去上海','去深圳','去广州','北漂','沪漂','深漂','回老家','迁移','搬去'], palette: LIFE_PALETTE, frames: sceneMove(), frameDelay: 400, animIn: 'slide', priority: 8 },
  { id: 'lottery', category: 'life', name: '中奖', keywords: ['彩票','中奖','奖金','红包','横财'], palette: LIFE_PALETTE, frames: sceneLottery(), frameDelay: 300, animIn: 'pop', priority: 8 },
  { id: 'lend_money', category: 'life', name: '朋友借钱', keywords: ['借钱','欠钱','催债','借点钱','周转','朋友借'], palette: LIFE_PALETTE, frames: sceneLendMoney(), frameDelay: 500, animIn: 'fade', priority: 7 },
  { id: 'travel', category: 'life', name: '旅行', keywords: ['旅行','旅游','出游','度假','出去玩','去趟'], palette: LIFE_PALETTE, frames: sceneTravel(), frameDelay: 300, animIn: 'slide', priority: 7 },
  { id: 'friend_drink', category: 'life', name: '朋友聚会', keywords: ['朋友','喝酒','聚餐','聚会','兄弟','闺蜜','吃酒'], palette: LIFE_PALETTE, frames: sceneFriendDrink(), frameDelay: 500, animIn: 'rise', priority: 6 },
  { id: 'pet', category: 'life', name: '养宠物', keywords: ['养猫','养狗','宠物','猫','狗','收养'], palette: LIFE_PALETTE, frames: scenePet(), frameDelay: 700, animIn: 'pop', priority: 6 },
  { id: 'phone', category: 'life', name: '刷手机', keywords: ['刷手机','玩手机','刷视频','追剧','刷抖音','看手机'], palette: LIFE_PALETTE, frames: scenePhone(), frameDelay: 800, animIn: 'fade', priority: 5 },
  { id: 'gym', category: 'life', name: '健身', keywords: ['健身','锻炼','运动','跑步','健身房','撸铁'], palette: LIFE_PALETTE, frames: sceneGym(), frameDelay: 350, animIn: 'pop', priority: 5 },
  { id: 'fishing', category: 'life', name: '钓鱼', keywords: ['钓鱼','垂钓'], palette: LIFE_PALETTE, frames: sceneFishing(), frameDelay: 600, animIn: 'fade', priority: 5 },
  { id: 'square_dance', category: 'life', name: '广场舞', keywords: ['广场舞','跳舞','广场'], palette: LIFE_PALETTE, frames: sceneSquareDance(), frameDelay: 350, animIn: 'bounce', priority: 5 },
  { id: 'reading', category: 'life', name: '阅读学习', keywords: ['看书','读书','学习','阅读','考','证书','考研','考公'], palette: LIFE_PALETTE, frames: sceneReading(), frameDelay: 2000, animIn: 'fade', priority: 4 },

  // 事业 - 工作事件
  { id: 'fired', category: 'career', name: '被裁', keywords: ['裁员','被裁','解雇','开除','失业','优化','毕业'], palette: CAREER_PALETTE, frames: sceneFired(), frameDelay: 800, animIn: 'shake', priority: 10 },
  { id: 'startup', category: 'career', name: '创业', keywords: ['创业','开公司','下海','自己干','all in','allin','搏一把'], palette: CAREER_PALETTE, frames: sceneStartup(), frameDelay: 250, animIn: 'shake', priority: 10 },
  { id: 'bankruptcy', category: 'career', name: '破产', keywords: ['破产','倒闭','赔光','血本无归','爆仓','欠债','负债'], palette: CAREER_PALETTE, frames: sceneBankruptcy(), frameDelay: 500, animIn: 'fade', priority: 10 },
  { id: 'retirement_party', category: 'career', name: '退休', keywords: ['退休','退役','告老','还乡','不干了','退休了'], palette: CAREER_PALETTE, frames: sceneRetirementParty(), frameDelay: 400, animIn: 'bounce', priority: 10 },
  { id: 'promotion', category: 'career', name: '升职加薪', keywords: ['升职','加薪','晋升','提拔','涨薪','升值'], palette: CAREER_PALETTE, frames: scenePromotion(), frameDelay: 400, animIn: 'bounce', priority: 9 },
  { id: 'job_hop', category: 'career', name: '跳槽', keywords: ['跳槽','换工作','新工作','离职','辞职','裸辞','offer'], palette: CAREER_PALETTE, frames: sceneJobHop(), frameDelay: 400, animIn: 'slide', priority: 8 },
  { id: 'bonus', category: 'career', name: '发奖金', keywords: ['奖金','年终奖','绩效','分红'], palette: CAREER_PALETTE, frames: sceneLottery(), frameDelay: 300, animIn: 'pop', priority: 8 },
  { id: 'overtime', category: 'career', name: '加班', keywords: ['加班','熬夜','996','通宵','赶项目'], palette: CAREER_PALETTE, frames: sceneOvertime(), frameDelay: 600, animIn: 'fade', priority: 7 },
  { id: 'investment', category: 'career', name: '投资', keywords: ['投资','炒股','股票','基金','币圈','理财','K线'], palette: CAREER_PALETTE, frames: sceneInvestment(), frameDelay: 500, animIn: 'slide', priority: 7 },
  { id: 'burnout', category: 'career', name: '倦怠', keywords: ['burnout','倦怠','过劳','熬不动','扛不住','内卷'], palette: CAREER_PALETTE, frames: sceneBurnout(), frameDelay: 1500, animIn: 'fade', priority: 7 },
  { id: 'work', category: 'career', name: '日常工作', keywords: ['上班','工作','搬砖','工位'], palette: CAREER_PALETTE, frames: sceneWork(), frameDelay: 300, animIn: 'fade', priority: 3 },
]

export function getSceneById(id: string): StoryboardScene | undefined {
  return STORYBOARD_SCENES.find(s => s.id === id)
}

/**
 * 从日志文本匹配场景
 * 单年模式：每个分类最多返回1个场景id（取优先级最高的），每年完全替换
 */
export function matchStoryboardScenes(logs: string[]): {
  family: string[]
  life: string[]
  career: string[]
} {
  const family: string[] = []
  const life: string[] = []
  const career: string[] = []
  const matched = new Set<string>()

  // 按优先级排序
  const sorted = [...STORYBOARD_SCENES].sort((a, b) => (b.priority || 0) - (a.priority || 0))

  for (const log of logs) {
    for (const scene of sorted) {
      if (matched.has(scene.id)) continue
      if (scene.keywords.some(kw => log.includes(kw))) {
        if (scene.category === 'family' && family.length === 0) family.push(scene.id)
        else if (scene.category === 'life' && life.length === 0) life.push(scene.id)
        else if (scene.category === 'career' && career.length === 0) career.push(scene.id)
        matched.add(scene.id)
        // 如果三个分类都匹配到了就可以提前退出
        if (family.length && life.length && career.length) return { family, life, career }
        break
      }
    }
  }

  return { family, life, career }
}
