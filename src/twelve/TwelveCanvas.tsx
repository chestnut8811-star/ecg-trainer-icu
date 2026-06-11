import { useEffect, useRef } from 'react'
import { createTwelve, type LeadId } from './engine'
import type { TwelveCase } from './cases'

/**
 * 12誘導を実機プリントアウト風(心電図ペーパー)に描画する。
 * 標準の3列×4段レイアウト(I/II/III, aVR/aVL/aVF, V1–V3, V4–V6)＋
 * 最下段に第II誘導の調律記録(rhythm strip)。
 * 全誘導は同一時間軸で同期スイープし、「動く12誘導」として表示する。
 */

// モニター版に合わせた配色(暗い背景＋蛍光グリーンのトレース)
const PAPER = '#020604'
const GRID_MINOR = 'rgba(54, 255, 156, 0.06)'
const GRID_MAJOR = 'rgba(54, 255, 156, 0.15)'
const TRACE = '#36ff9c'
const LABEL = '#36ff9c'
const HILITE = 'rgba(255, 206, 64, 0.12)'

// 3列×4段の誘導配置(縦に積む)
const COLUMNS: LeadId[][] = [
  ['I', 'II', 'III'],
  ['aVR', 'aVL', 'aVF'],
  ['V1', 'V2', 'V3'],
  ['V4', 'V5', 'V6'],
]

function hashSeed(s: string): number {
  let h = 7
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return (h >>> 0) || 1
}

export default function TwelveCanvas({
  def,
  highlightOn,
}: {
  def: TwelveCase
  /** 所見誘導をハイライトするか(クイズ中はfalse) */
  highlightOn: boolean
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLCanvasElement>(null)
  const traceRef = useRef<HTMLCanvasElement>(null)
  const hiOn = useRef(highlightOn)
  hiOn.current = highlightOn

  useEffect(() => {
    const wrap = wrapRef.current
    const gridCv = gridRef.current
    const traceCv = traceRef.current
    if (!wrap || !gridCv || !traceCv) return

    const engine = createTwelve(def.spec, def.rhythm, hashSeed(def.id))
    const hi = new Set(def.highlight)

    let W = 0
    let H = 0
    let mm = 4 // 1mmあたりのpx
    let panelW = 0
    let panelH = 0
    let gridTop = 0
    let rhythmTop = 0
    let rhythmH = 0
    const padX = 8
    const labelH = 16

    // パネル原点(小窓12個)
    type Panel = { lead: LeadId; x: number; y: number; midY: number }
    let panels: Panel[] = []
    let pxPerSec = 0
    let pxPerMv = 0
    let rhythmPxPerSec = 0
    let rhythmMid = 0

    const layout = () => {
      W = Math.max(320, wrap.offsetWidth)
      // 高さは幅から算出(プリントアウトのアスペクト)
      H = Math.round(W * (W < 640 ? 1.15 : 0.72))
      const dpr = Math.min(2.5, window.devicePixelRatio || 1)
      for (const cv of [gridCv, traceCv]) {
        cv.width = Math.round(W * dpr)
        cv.height = Math.round(H * dpr)
        cv.style.width = `${W}px`
        cv.style.height = `${H}px`
        cv.getContext('2d')!.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
      gridTop = 10
      rhythmH = Math.round((H - gridTop) * 0.2)
      rhythmTop = H - rhythmH - 6
      const gridBodyH = rhythmTop - gridTop - 8
      panelH = gridBodyH / 3
      panelW = (W - padX * 2) / 4

      // 横軸は紙送り25mm/s基準でグリッドを整合(1窓=2.5秒)
      pxPerSec = panelW / 2.5
      mm = pxPerSec / 25
      // 縦軸ゲインは小画面でも読めるようパネル高に合わせて決定。
      // 校正波(左端の┌┐)が1mVを示すので、表示倍率が変わっても波高の基準は保たれる。
      pxPerMv = (panelH - labelH) * 0.2
      rhythmPxPerSec = pxPerSec // 調律記録も同じ紙送り速度
      rhythmMid = rhythmTop + rhythmH / 2

      panels = []
      COLUMNS.forEach((col, ci) => {
        col.forEach((lead, ri) => {
          const x = padX + ci * panelW
          const y = gridTop + ri * panelH
          panels.push({ lead, x, y, midY: y + labelH + (panelH - labelH) / 2 })
        })
      })
      drawGrid()
      traceCv.getContext('2d')!.clearRect(0, 0, W, H)
      smallPrev = {}
      rhythmPrev = null
      tNow = 0
    }

    const drawGrid = () => {
      const c = gridCv.getContext('2d')!
      c.clearRect(0, 0, W, H)
      c.fillStyle = PAPER
      c.fillRect(0, 0, W, H)

      // ハイライト下地(所見の出る誘導)
      if (hiOn.current) {
        for (const p of panels) {
          if (!hi.has(p.lead)) continue
          c.fillStyle = HILITE
          c.fillRect(p.x, p.y, panelW, panelH)
          c.strokeStyle = 'rgba(230, 153, 60, 0.9)'
          c.lineWidth = 2
          c.strokeRect(p.x + 1, p.y + 1, panelW - 2, panelH - 2)
        }
      }

      // マス目(細:1mm / 太:5mm)
      const drawLines = (step: number, color: string, lw: number) => {
        c.strokeStyle = color
        c.lineWidth = lw
        c.beginPath()
        for (let x = padX; x <= W - padX + 0.5; x += step) {
          c.moveTo(Math.round(x) + 0.5, gridTop)
          c.lineTo(Math.round(x) + 0.5, H - 4)
        }
        for (let y = gridTop; y <= H - 4; y += step) {
          c.moveTo(padX, Math.round(y) + 0.5)
          c.lineTo(W - padX, Math.round(y) + 0.5)
        }
        c.stroke()
      }
      drawLines(mm, GRID_MINOR, 1)
      drawLines(mm * 5, GRID_MAJOR, 1)

      // ラベルと誘導間の区切り
      c.fillStyle = LABEL
      c.font = `700 ${Math.max(11, Math.round(mm * 3.2))}px "IBM Plex Mono", monospace`
      c.textBaseline = 'top'
      for (const p of panels) {
        c.fillText(p.lead, p.x + 6, p.y + 3)
        // 各窓の左端に1mVキャリブレーション(┌┐)
        const caloX = p.x + 2
        const base = p.midY
        c.strokeStyle = TRACE
        c.lineWidth = 1.4
        c.beginPath()
        c.moveTo(caloX, base)
        c.lineTo(caloX + mm, base)
        c.lineTo(caloX + mm, base - pxPerMv)
        c.lineTo(caloX + mm * 2, base - pxPerMv)
        c.lineTo(caloX + mm * 2, base)
        c.stroke()
      }
      // 調律記録ラベル
      c.fillStyle = LABEL
      c.fillText('II（調律記録）', padX + 6, rhythmTop + 3)
      // 紙の縁
      c.strokeStyle = GRID_MAJOR
      c.lineWidth = 1.5
      c.strokeRect(padX + 0.5, gridTop + 0.5, W - padX * 2 - 1, H - gridTop - 5)
    }

    // 前フレームの最終描画点(フレームをまたいで線をつなぐため)
    type Pt = { x: number; y: number }
    let smallPrev: Partial<Record<LeadId, Pt>> = {}
    let rhythmPrev: Pt | null = null
    let tNow = 0
    layout()

    const ro = new ResizeObserver(layout)
    ro.observe(wrap)

    let raf = 0
    let last = performance.now()
    const clampY = (y: number, top: number, bot: number) =>
      Math.max(top, Math.min(bot, y))

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min(0.06, Math.max(0, (now - last) / 1000))
      last = now
      if (dt <= 0) return
      const c = traceCv.getContext('2d')!
      const t0 = tNow
      const t1 = t0 + dt
      tNow = t1

      // --- 小窓12誘導(2.5秒窓・同期スイープ) ---
      const sStep = 1 / pxPerSec
      const sP0 = Math.floor(t0 / sStep)
      const sP1 = Math.floor(t1 / sStep)
      if (sP1 > sP0) {
        const headLocal = sP1 % Math.round(panelW)
        const gap = Math.max(10, Math.round(panelW * 0.05))
        // 消去(各窓のヘッド先)
        for (const p of panels) {
          const ex = p.x + headLocal + 1
          c.clearRect(ex, p.y + labelH, gap, panelH - labelH)
          if (ex + gap > p.x + panelW)
            c.clearRect(p.x, p.y + labelH, ex + gap - (p.x + panelW), panelH - labelH)
          // 消した所はペーパー＆グリッドを復元するため下のgridを見せる→traceは透明
        }
        c.lineWidth = 1.7
        c.lineJoin = 'round'
        c.lineCap = 'round'
        c.strokeStyle = TRACE
        c.shadowColor = TRACE
        c.shadowBlur = 6
        const pw = Math.round(panelW)
        for (const p of panels) {
          const top = p.y + labelH + 1
          const bot = p.y + panelH - 1
          c.beginPath()
          let prev = smallPrev[p.lead]
          let moved = false
          for (let sp = sP0 + 1; sp <= sP1; sp++) {
            const local = sp % pw
            const x = p.x + local
            const y = clampY(p.midY - engine.sample(p.lead, sp * sStep) * pxPerMv, top, bot)
            if (local === 0 || !prev) {
              c.moveTo(x, y) // 折り返し or 初回はペンを上げて開始
              moved = true
            } else {
              if (!moved) c.moveTo(prev.x, prev.y) // 前フレーム末尾から連結
              c.lineTo(x, y)
              moved = true
            }
            prev = { x, y }
          }
          c.stroke()
          smallPrev[p.lead] = prev
        }
        c.shadowBlur = 0
      }

      // --- 調律記録(10秒窓・II誘導) ---
      const rStep = 1 / rhythmPxPerSec
      const rP0 = Math.floor(t0 / rStep)
      const rP1 = Math.floor(t1 / rStep)
      if (rP1 > rP0) {
        const span = Math.round((W - padX * 2))
        const headLocal = rP1 % span
        const gap = Math.max(12, Math.round(span * 0.02))
        const ex = padX + headLocal + 1
        const top = rhythmTop + labelH
        const bot = rhythmTop + rhythmH - 2
        c.clearRect(ex, top, gap, bot - top)
        if (ex + gap > W - padX) c.clearRect(padX, top, ex + gap - (W - padX), bot - top)
        c.lineWidth = 1.9
        c.lineCap = 'round'
        c.lineJoin = 'round'
        c.strokeStyle = TRACE
        c.shadowColor = TRACE
        c.shadowBlur = 6
        c.beginPath()
        let prev = rhythmPrev
        let moved = false
        for (let rp = rP0 + 1; rp <= rP1; rp++) {
          const local = rp % span
          const x = padX + local
          const y = clampY(rhythmMid - engine.sample('II', rp * rStep) * pxPerMv, top, bot)
          if (local === 0 || !prev) {
            c.moveTo(x, y)
            moved = true
          } else {
            if (!moved) c.moveTo(prev.x, prev.y)
            c.lineTo(x, y)
            moved = true
          }
          prev = { x, y }
        }
        c.stroke()
        c.shadowBlur = 0
        rhythmPrev = prev
      }
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [def, highlightOn])

  return (
    <div
      ref={wrapRef}
      className="relative w-full overflow-hidden rounded-xl border border-line2 bg-[#020604] shadow-[0_0_40px_rgba(54,255,156,0.06)_inset,0_10px_40px_rgba(0,0,0,0.5)]"
    >
      <canvas ref={gridRef} className="block w-full" />
      <canvas ref={traceRef} className="absolute inset-0" />
      <div className="scanlines pointer-events-none absolute inset-0" />
    </div>
  )
}
