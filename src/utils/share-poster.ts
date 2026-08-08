// ================================================================
//  share-poster.ts — 退休年度人生报告 · 可导出分享海报
// ----------------------------------------------------------------
//  用 Canvas 把"人生结算单"渲染成一张竖版分享海报（1080×2000），
//  玩家可一键保存为 PNG，发朋友圈 / 群聊 / 社交平台。
//  风格延续赛博朋克 × 像素：深紫渐变 + 霓虹描边 + 扫描线。
//  内容含：评级 / 主标语 / 核心数据 / 人生快照 / 收支账本 /
//  退休第一天 / 官网二维码。
// ================================================================
import QRCode from 'qrcode'
import type { AnnualReport } from './life-fun.js'
import { fmtBig } from './life-fun.js'

const W = 1080
const H = 2040

const GRADE_COLOR: Record<string, string> = {
  S: '#ffec27', A: '#00d4ff', B: '#00ff88', C: '#ff8800', D: '#ff004d',
}

const CN = "'PingFang SC', 'Microsoft YaHei', 'Noto Sans CJK SC', 'WenQuanYi Micro Hei', sans-serif"
const DOT = "'DotGothic16', 'Courier New', monospace"

interface StatItem { label: string; value: string }

interface PosterInput {
  report: AnnualReport
  grade: string
  firstDayScene: string
  pathIcon: string
  pathName: string
  stats: StatItem[]          // 人生快照（终点年龄/工作年限/城市/职业/家庭/路径统计）
  income: number             // 一生总收入
  expense: number            // 一生总支出
  net: number                // 最终净资产
  website: string            // 官网地址（生成二维码）
}

/** 生成海报 dataURL（PNG） */
export async function renderPoster(input: PosterInput): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const g = input.grade
  const gColor = GRADE_COLOR[g] || '#ffec27'

  // —— 背景渐变 ——
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#160a34')
  bg.addColorStop(0.45, '#241052')
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
  glow(140, 180, 340, 'rgba(0,212,255,0.16)')
  glow(940, 240, 360, 'rgba(255,45,149,0.16)')
  glow(540, 1650, 460, 'rgba(255,236,39,0.10)')

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
    ctx.strokeStyle = gColor
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
  ctx.fillText('PIXEL LIFE · ANNUAL REPORT', 60, 92)
  ctx.textAlign = 'right'
  ctx.fillStyle = '#ffec27'
  ctx.font = `bold 44px ${DOT}`
  ctx.fillText(input.report.year, W - 60, 100)

  // —— 评级（大字母） ——
  ctx.textAlign = 'center'
  ctx.shadowColor = gColor
  ctx.shadowBlur = 60
  ctx.fillStyle = gColor
  ctx.font = `bold 180px ${DOT}`
  ctx.fillText(g, W / 2, 252)
  ctx.shadowBlur = 0

  // —— 标题 ——
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold 40px ${CN}`
  ctx.fillText(input.report.title, W / 2, 352)

  // —— 主标语 ——
  const hl = input.report.headline
  const hlSize = hl.length <= 4 ? 108 : hl.length <= 6 ? 90 : 72
  ctx.shadowColor = '#ff8800'
  ctx.shadowBlur = 40
  ctx.fillStyle = '#ffec27'
  ctx.font = `bold ${hlSize}px ${DOT}`
  ctx.fillText(hl, W / 2, 484)
  ctx.shadowBlur = 0
  ctx.fillStyle = '#c9a8ff'
  ctx.font = `22px ${CN}`
  ctx.fillText(input.report.headlineUnit, W / 2, 532)

  // —— 副标题 ——
  ctx.fillStyle = '#ffccaa'
  ctx.font = `26px ${CN}`
  ctx.fillText(input.report.subtitle, W / 2, 582)

  // —— 分隔线 ——
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(120, 612)
  ctx.lineTo(W - 120, 612)
  ctx.stroke()

  // —— 核心数据条（2×2） ——
  const core = input.report.core.slice(0, 4)
  const boxW = 460
  const boxH = 130
  const startY = 642
  core.forEach((item, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = 60 + col * (boxW + 40)
    const y = startY + row * (boxH + 18)
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
    ctx.fillText(val, x + 26, y + 58)
    ctx.fillStyle = '#94b0c2'
    ctx.font = `20px ${CN}`
    ctx.fillText(item.unit, x + 26 + measure(ctx, val, `bold 44px ${DOT}`) + 12, y + 58)
    ctx.fillStyle = '#c9a8ff'
    ctx.font = `20px ${CN}`
    ctx.fillText(item.label, x + 26, y + 94)
    ctx.fillStyle = '#94b0c2'
    ctx.font = `17px ${CN}`
    ctx.fillText(item.note, x + 26, y + 120)
  })

  // —— 路径（普通结局显示结局名，路径结局显示路径名） ——
  const pathY = startY + 2 * (boxH + 18) + 30
  ctx.font = `40px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(input.pathIcon, W / 2 - measure(ctx, input.pathName, `bold 28px ${CN}`) / 2 - 28, pathY + 8)
  ctx.fillStyle = '#ff2d95'
  ctx.font = `bold 28px ${CN}`
  ctx.fillText(input.pathName, W / 2 + 4, pathY)

  // —— 人生快照（3×2 网格） ——
  const snapY = pathY + 52
  sectionLabel(ctx, 'LIFE SNAPSHOT', snapY)
  const snap = input.stats.slice(0, 6)
  const scW = 300
  const scH = 80
  const scGapX = 30
  const scGapY = 14
  const scX0 = 60
  const scY0 = snapY + 30
  snap.forEach((item, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const x = scX0 + col * (scW + scGapX)
    const y = scY0 + row * (scH + scGapY)
    ctx.fillStyle = 'rgba(0,0,0,0.32)'
    ctx.strokeStyle = 'rgba(0,212,255,0.22)'
    ctx.lineWidth = 2
    roundRect(ctx, x, y, scW, scH, 12)
    ctx.fill()
    ctx.stroke()
    ctx.textAlign = 'left'
    ctx.fillStyle = '#7fe9ff'
    ctx.font = `26px ${DOT}`
    ctx.fillText(item.value, x + 18, y + 36)
    ctx.fillStyle = '#94b0c2'
    ctx.font = `17px ${CN}`
    ctx.fillText(item.label, x + 18, y + 64)
  })

  // —— 标签 ——
  const tags = input.report.tags.slice(0, 5)
  const tagRowY = scY0 + 2 * scH + scGapY + 24
  let tagX = 60
  ctx.textAlign = 'left'
  for (const t of tags) {
    const w = measure(ctx, t, `20px ${CN}`) + 40
    ctx.fillStyle = 'rgba(0,212,255,0.12)'
    ctx.strokeStyle = 'rgba(0,212,255,0.5)'
    ctx.lineWidth = 2
    roundRect(ctx, tagX, tagRowY, w, 42, 21)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#7fe9ff'
    ctx.font = `19px ${DOT}`
    ctx.fillText(t, tagX + 20, tagRowY + 28)
    tagX += w + 14
  }

  // —— 收支账本 ——
  const ledgerY = tagRowY + 88
  sectionLabel(ctx, 'LIFETIME LEDGER', ledgerY)
  const lgW = 460
  const lgH = 96
  const lgY = ledgerY + 30
  drawLedger(ctx, '一生总收入', fmtBig(Math.max(0, input.income)), '#00ff88', 60, lgY, lgW, lgH)
  drawLedger(ctx, '一生总支出', fmtBig(Math.max(0, input.expense)), '#ff8800', 60 + lgW + 40, lgY, lgW, lgH)
  const netY = lgY + lgH + 14
  const netPositive = input.net >= 0
  drawLedger(ctx, '最终净资产', fmtBig(input.net), netPositive ? '#00d4ff' : '#ff004d', 60, netY, 960, 84, true)

  // —— 退休第一天金句 ——
  const dayY = netY + 80 + 48
  sectionLabel(ctx, 'RETIREMENT DAY ONE', dayY)
  ctx.fillStyle = '#ffccaa'
  ctx.textAlign = 'center'
  ctx.font = `24px ${CN}`
  wrapText(ctx, input.firstDayScene, W / 2, dayY + 34, W - 180, 40, 3)

  // —— 底部官网 + 二维码 ——
  const footY = dayY + 34 + 3 * 40 + 20
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(120, footY)
  ctx.lineTo(W - 120, footY)
  ctx.stroke()

  const qrSize = 140
  const qrX = 90
  const qrY = footY + 40
  // 二维码白底圆角
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'
  ctx.lineWidth = 2
  roundRect(ctx, qrX - 16, qrY - 16, qrSize + 32, qrSize + 32, 20)
  ctx.fill()
  ctx.stroke()
  // 生成并绘制二维码
  try {
    const qrUrl = await QRCode.toDataURL(input.website, {
      width: qrSize,
      margin: 2,
      color: { dark: '#0a0520', light: '#ffffff' },
    })
    const img = new Image()
    img.src = qrUrl
    await new Promise<void>((res, rej) => {
      img.onload = () => res()
      img.onerror = () => rej(new Error('qr load failed'))
    })
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(qrX, qrY, qrSize, qrSize)
    ctx.drawImage(img, qrX, qrY, qrSize, qrSize)
  } catch {
    // 二维码生成失败时保留占位框
    ctx.fillStyle = '#94b0c2'
    ctx.font = `16px ${CN}`
    ctx.textAlign = 'center'
    ctx.fillText('扫码体验', qrX + qrSize / 2, qrY + qrSize / 2 + 6)
  }

  // 二维码右侧文案
  ctx.textAlign = 'left'
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold 30px ${CN}`
  ctx.fillText('扫码体验 · 重来百样人生', qrX + qrSize + 56, qrY + 46)
  ctx.fillStyle = '#7fe9ff'
  ctx.font = `22px ${DOT}`
  ctx.fillText(input.website, qrX + qrSize + 56, qrY + 92)

  // —— 底部落版 ——
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = `18px ${DOT}`
  ctx.fillText('— PIXEL RETIREMENT SIMULATOR —', W / 2, H - 40)

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

// —— 画一个小节标签（如 LIFE SNAPSHOT） ——
function sectionLabel(ctx: CanvasRenderingContext2D, text: string, y: number): void {
  ctx.save()
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(201,168,255,0.9)'
  ctx.font = `18px ${DOT}`
  ctx.fillText(text, W / 2, y)
  ctx.restore()
}

// —— 画一张账本卡片 ——
function drawLedger(
  ctx: CanvasRenderingContext2D,
  label: string, value: string, color: string,
  x: number, y: number, w: number, h: number, highlight = false,
): void {
  ctx.fillStyle = highlight ? 'rgba(0,212,255,0.08)' : 'rgba(0,0,0,0.32)'
  ctx.strokeStyle = highlight ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.15)'
  ctx.lineWidth = 2
  roundRect(ctx, x, y, w, h, 16)
  ctx.fill()
  ctx.stroke()
  ctx.textAlign = 'left'
  ctx.fillStyle = color
  ctx.font = `bold 38px ${DOT}`
  ctx.fillText(value, x + 26, y + h - 14)
  ctx.fillStyle = '#94b0c2'
  ctx.font = `18px ${CN}`
  ctx.fillText(label, x + 26, y + 24)
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