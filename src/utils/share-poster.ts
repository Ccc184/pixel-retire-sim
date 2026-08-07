// ================================================================
//  share-poster.ts — 退休年度人生报告 · 可导出分享海报
// ----------------------------------------------------------------
//  用 Canvas 把"人生结算单"渲染成一张竖版分享海报（1080×1520），
//  玩家可一键保存为 PNG，发朋友圈 / 群聊 / 社交平台。
//  风格延续赛博朋克 × 像素：深紫渐变 + 霓虹描边 + 扫描线。
// ================================================================
import type { AnnualReport } from './life-fun.js'

const W = 1080
const H = 1520

const GRADE_COLOR: Record<string, string> = {
  S: '#ffec27', A: '#00d4ff', B: '#00ff88', C: '#ff8800', D: '#ff004d',
}

const CN = "'PingFang SC', 'Microsoft YaHei', 'Noto Sans CJK SC', 'WenQuanYi Micro Hei', sans-serif"
const DOT = "'DotGothic16', 'Courier New', monospace"

interface PosterInput {
  report: AnnualReport
  grade: string
  firstDayScene: string
  pathIcon: string
  pathName: string
}

/** 生成海报 dataURL（PNG） */
export function renderPoster(input: PosterInput): string {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const g = input.grade

  // —— 背景渐变 ——
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#1a0b3a')
  bg.addColorStop(0.5, '#241052')
  bg.addColorStop(1, '#3a1a6a')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // —— 背景光斑 ——
  const glow = (x: number, y: number, r: number, color: string) => {
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r)
    gr.addColorStop(0, color)
    gr.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = gr
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
  glow(140, 200, 360, 'rgba(0,212,255,0.16)')
  glow(940, 260, 380, 'rgba(255,45,149,0.16)')
  glow(540, 1380, 420, 'rgba(255,236,39,0.10)')

  // —— 扫描线 ——
  ctx.save()
  ctx.globalAlpha = 0.05
  ctx.fillStyle = '#000'
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2)
  ctx.restore()

  // —— 霓虹边框 ——
  ctx.strokeStyle = 'rgba(201,0,255,0.6)'
  ctx.lineWidth = 6
  ctx.strokeRect(24, 24, W - 48, H - 48)
  const corner = (cx: number, cy: number, dx: number, dy: number) => {
    ctx.strokeStyle = GRADE_COLOR[g] || '#ffec27'
    ctx.lineWidth = 8
    ctx.beginPath()
    ctx.moveTo(cx, cy + 40 * dy)
    ctx.lineTo(cx, cy)
    ctx.lineTo(cx + 40 * dx, cy)
    ctx.stroke()
  }
  corner(24, 24, 1, 1)
  corner(W - 24, 24, -1, 1)
  corner(24, H - 24, 1, -1)
  corner(W - 24, H - 24, -1, -1)

  // —— 顶部 kicker + 年份 ——
  ctx.textAlign = 'left'
  ctx.fillStyle = '#c9a8ff'
  ctx.font = `20px ${DOT}`
  ctx.fillText('PIXEL LIFE · ANNUAL REPORT', 60, 96)
  ctx.textAlign = 'right'
  ctx.fillStyle = '#ffec27'
  ctx.font = `bold 44px ${DOT}`
  ctx.fillText(input.report.year, W - 60, 104)

  // —— 评级（大字母） ——
  const gColor = GRADE_COLOR[g] || '#ffec27'
  ctx.textAlign = 'center'
  ctx.shadowColor = gColor
  ctx.shadowBlur = 60
  ctx.fillStyle = gColor
  ctx.font = `bold 220px ${DOT}`
  ctx.fillText(g, W / 2, 320)
  ctx.shadowBlur = 0

  // —— 标题 ——
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold 40px ${CN}`
  ctx.fillText(input.report.title, W / 2, 428)

  // —— 主标语 ——
  const hl = input.report.headline
  const hlSize = hl.length <= 4 ? 120 : hl.length <= 6 ? 96 : 76
  ctx.shadowColor = '#ff8800'
  ctx.shadowBlur = 40
  ctx.fillStyle = '#ffec27'
  ctx.font = `bold ${hlSize}px ${DOT}`
  ctx.fillText(hl, W / 2, 560)
  ctx.shadowBlur = 0
  ctx.fillStyle = '#c9a8ff'
  ctx.font = `22px ${CN}`
  ctx.fillText(input.report.headlineUnit, W / 2, 610)

  // —— 副标题 ——
  ctx.fillStyle = '#ffccaa'
  ctx.font = `26px ${CN}`
  ctx.fillText(input.report.subtitle, W / 2, 668)

  // —— 核心数据条（2×2） ——
  const core = input.report.core.slice(0, 4)
  const boxW = 460
  const boxH = 138
  const startY = 720
  core.forEach((item, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = 60 + col * (boxW + 40)
    const y = startY + row * (boxH + 24)
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 2
    roundRect(ctx, x, y, boxW, boxH, 16)
    ctx.fill()
    ctx.stroke()
    ctx.textAlign = 'left'
    ctx.fillStyle = '#00ff88'
    ctx.font = `bold 44px ${DOT}`
    const val = item.value
    ctx.fillText(val, x + 24, y + 58)
    ctx.fillStyle = '#94b0c2'
    ctx.font = `20px ${CN}`
    ctx.fillText(item.unit, x + 24 + measure(ctx, val, `bold 44px ${DOT}`) + 12, y + 58)
    ctx.fillStyle = '#c9a8ff'
    ctx.font = `20px ${CN}`
    ctx.fillText(item.label, x + 24, y + 96)
    ctx.fillStyle = '#94b0c2'
    ctx.font = `18px ${CN}`
    ctx.fillText(item.note, x + 24, y + 124)
  })

  // —— 标签 ——
  const tags = input.report.tags.slice(0, 5)
  let tagX = 60
  const tagRowY = startY + 2 * (boxH + 24) + 16
  ctx.textAlign = 'left'
  for (const t of tags) {
    const w = measure(ctx, t, `20px ${CN}`) + 40
    ctx.fillStyle = 'rgba(0,212,255,0.12)'
    ctx.strokeStyle = 'rgba(0,212,255,0.5)'
    ctx.lineWidth = 2
    roundRect(ctx, tagX, tagRowY, w, 44, 22)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#7fe9ff'
    ctx.font = `20px ${DOT}`
    ctx.fillText(t, tagX + 20, tagRowY + 30)
    tagX += w + 14
  }

  // —— 路径 ——
  const pathY = tagRowY + 96
  ctx.font = `44px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(input.pathIcon, W / 2 - measure(ctx, input.pathName, `bold 30px ${CN}`) / 2 - 30, pathY + 8)
  ctx.fillStyle = '#ff2d95'
  ctx.font = `bold 30px ${CN}`
  ctx.fillText(input.pathName, W / 2 + 6, pathY)

  // —— 分隔线 ——
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(120, pathY + 60)
  ctx.lineTo(W - 120, pathY + 60)
  ctx.stroke()

  // —— 退休第一天金句 ——
  ctx.fillStyle = '#c9a8ff'
  ctx.textAlign = 'center'
  ctx.font = `20px ${DOT}`
  ctx.fillText('RETIREMENT DAY ONE', W / 2, pathY + 100)
  ctx.fillStyle = '#ffccaa'
  ctx.font = `24px ${CN}`
  wrapText(ctx, input.firstDayScene, W / 2, pathY + 150, W - 160, 38, 4)

  // —— 金句 & 落版 ——
  ctx.fillStyle = '#ffffff'
  ctx.font = `26px ${CN}`
  ctx.fillText(input.report.summary, W / 2, H - 250)
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = `20px ${DOT}`
  ctx.fillText('— PIXEL RETIREMENT SIMULATOR —', W / 2, H - 200)

  return canvas.toDataURL('image/png')
}

/** 触发浏览器下载 */
export function downloadPoster(dataUrl: string, filename: string): void {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// —— canvas 工具 ——
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function measure(ctx: CanvasRenderingContext2D, text: string, font: string): number {
  ctx.font = font
  return ctx.measureText(text).width
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string, cx: number, y: number, maxW: number, lineH: number, maxLines: number,
): void {
  ctx.textAlign = 'center'
  const chars = text.split('')
  let line = ''
  let lines = 0
  for (const ch of chars) {
    if (measure(ctx, line + ch, ctx.font) > maxW && line) {
      ctx.fillText(line, cx, y)
      line = ch
      lines++
      y += lineH
      if (lines >= maxLines) return
    } else {
      line += ch
    }
  }
  if (line && lines < maxLines) ctx.fillText(line, cx, y)
}