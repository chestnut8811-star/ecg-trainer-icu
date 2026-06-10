import { useEffect, useRef, useState } from 'react'
import type { WaveformDef } from '../types'
import { createEngine } from '../engine/ecg'
import { ensureAudio, playQrsBeep, startCriticalAlarm } from '../engine/audio'
import { useApp } from '../store'

interface Props {
  def: WaveformDef
  /** モニター左下に波形名を出すか(クイズではfalse) */
  showLabel?: boolean
  /** 緊急アラームバナーを出すか(クイズではfalse) */
  showAlarm?: boolean
  className?: string
}

const TRACE = '#36ff9c'

function hashSeed(s: string): number {
  let h = 9
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 387420489)
  return (h >>> 0) || 1
}

function drawGrid(c: CanvasRenderingContext2D, w: number, h: number, pxPerMm: number) {
  c.clearRect(0, 0, w, h)
  const major = pxPerMm * 5
  if (pxPerMm >= 3.4) {
    c.strokeStyle = 'rgba(86, 255, 170, 0.05)'
    c.lineWidth = 1
    c.beginPath()
    for (let x = 0; x <= w; x += pxPerMm) {
      const xx = Math.round(x) + 0.5
      c.moveTo(xx, 0)
      c.lineTo(xx, h)
    }
    for (let y = 0; y <= h; y += pxPerMm) {
      const yy = Math.round(y) + 0.5
      c.moveTo(0, yy)
      c.lineTo(w, yy)
    }
    c.stroke()
  }
  c.strokeStyle = 'rgba(86, 255, 170, 0.11)'
  c.lineWidth = 1
  c.beginPath()
  for (let x = 0; x <= w; x += major) {
    const xx = Math.round(x) + 0.5
    c.moveTo(xx, 0)
    c.lineTo(xx, h)
  }
  for (let y = 0; y <= h; y += major) {
    const yy = Math.round(y) + 0.5
    c.moveTo(0, yy)
    c.lineTo(w, yy)
  }
  c.stroke()
}

/**
 * ベッドサイドモニター風スイープ描画。
 * 描画ヘッドが左→右へ走り、ヘッドの先の消去バーが古い波形を消していく。
 */
export default function EcgMonitor({
  def,
  showLabel = true,
  showAlarm = true,
  className = '',
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLCanvasElement>(null)
  const traceRef = useRef<HTMLCanvasElement>(null)
  const frozenRef = useRef(false)
  const [frozen, setFrozen] = useState(false)
  const [hrText, setHrText] = useState('--')
  const soundOn = useApp((s) => s.soundOn)
  const toggleSound = useApp((s) => s.toggleSound)

  useEffect(() => {
    frozenRef.current = frozen
  }, [frozen])

  // 緊急アラーム音: 致死性波形を表示中だけ繰り返し再生(クイズ等showAlarm=false時は鳴らさない)
  useEffect(() => {
    if (!soundOn || !showAlarm || def.danger !== 'critical') return
    ensureAudio()
    return startCriticalAlarm()
  }, [soundOn, showAlarm, def.danger, def.id])

  useEffect(() => {
    const wrap = wrapRef.current
    const gridCv = gridRef.current
    const traceCv = traceRef.current
    if (!wrap || !gridCv || !traceCv) return

    const engine = createEngine(def.gen, hashSeed(def.id))
    let tNow = 0
    let W = 0
    let H = 0
    let pxPerSec = 120
    let pxPerMv = 48
    let midY = 60

    const sizeUp = () => {
      // poweronのscaleY中でも正しい寸法を得るため、transformの影響を受けない offsetWidth/Height を使う
      W = Math.max(140, wrap.offsetWidth)
      H = Math.max(90, wrap.offsetHeight)
      const dpr = Math.min(2.5, window.devicePixelRatio || 1)
      for (const cv of [gridCv, traceCv]) {
        cv.width = W * dpr
        cv.height = H * dpr
        cv.style.width = `${W}px`
        cv.style.height = `${H}px`
        cv.getContext('2d')!.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
      const windowSec = W < 520 ? 4 : 6
      pxPerSec = W / windowSec
      const pxPerMm = pxPerSec / 25 // 標準紙送り 25mm/s
      pxPerMv = pxPerMm * 10 // 標準感度 10mm/mV
      midY = H * 0.56
      drawGrid(gridCv.getContext('2d')!, W, H, pxPerMm)
      traceCv.getContext('2d')!.clearRect(0, 0, W, H)
      tNow = 0
    }
    sizeUp()
    const ro = new ResizeObserver(sizeUp)
    ro.observe(wrap)

    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min(0.09, Math.max(0, (now - last) / 1000))
      last = now
      if (frozenRef.current || dt <= 0) return
      const t0 = tNow
      const t1 = t0 + dt
      tNow = t1

      const c = traceCv.getContext('2d')!
      const stepT = 1 / pxPerSec
      const p0 = Math.floor(t0 / stepT)
      const p1 = Math.floor(t1 / stepT)
      if (p1 <= p0) return

      // 1) ヘッドの先を消去(消去バー)
      const headX = p1 % W
      const gap = Math.max(18, Math.round(W * 0.035))
      c.clearRect(headX + 1, 0, gap, H)
      if (headX + 1 + gap > W) c.clearRect(0, 0, headX + 1 + gap - W, H)

      // 2) 新しく通過したピクセル列を描画
      c.save()
      c.lineWidth = 2
      c.lineJoin = 'round'
      c.lineCap = 'round'
      c.strokeStyle = TRACE
      c.shadowColor = TRACE
      c.shadowBlur = 8
      c.beginPath()
      let pen = false
      for (let p = p0; p <= p1; p++) {
        const x = p % W
        const y = Math.max(2, Math.min(H - 2, midY - engine.sample(p * stepT) * pxPerMv))
        if (!pen || x === 0) {
          c.moveTo(x, y)
          pen = true
        } else {
          c.lineTo(x, y)
        }
      }
      c.stroke()
      c.restore()

      // 3) QRS同期音
      if (useApp.getState().soundOn) {
        for (const _bt of engine.beatsBetween(t0, t1)) playQrsBeep()
      }
    }
    raf = requestAnimationFrame(loop)

    const hrIv = window.setInterval(() => {
      const hr = engine.hr(tNow)
      setHrText(hr === null ? '---' : String(hr))
    }, 600)
    setHrText('--')

    return () => {
      cancelAnimationFrame(raf)
      clearInterval(hrIv)
      ro.disconnect()
    }
  }, [def.id, def.gen])

  // AudioContextはユーザー操作(クリック)起点で生成する必要がある
  const onSoundClick = () => {
    ensureAudio()
    toggleSound()
  }

  const critical = def.danger === 'critical'
  const btn = (active: boolean) =>
    `pointer-events-auto rounded border px-2 py-0.5 font-dot text-[10px] tracking-wider transition-colors ${
      active
        ? 'border-phos/60 bg-phos/15 text-phos'
        : 'border-line2 text-mute hover:border-mute/70 hover:text-ink'
    }`

  return (
    <div
      key={def.id}
      ref={wrapRef}
      className={`animate-poweron relative h-full w-full origin-center overflow-hidden rounded-xl border border-line2 bg-[#020604] shadow-[0_0_40px_rgba(54,255,156,0.06)_inset,0_10px_40px_rgba(0,0,0,0.5)] ${className}`}
    >
      <canvas ref={gridRef} className="absolute inset-0" />
      <canvas ref={traceRef} className="absolute inset-0" />
      <div className="scanlines pointer-events-none absolute inset-0 z-20" />

      {/* 左上: 誘導・紙送り速度 */}
      <div className="absolute top-2 left-3 z-30 flex items-baseline gap-2">
        <span className="font-mono text-sm font-bold text-phos/90">II</span>
        <span className="font-dot text-[10px] tracking-wider text-mute">25mm/s ×1.0</span>
        {frozen && (
          <span className="animate-blink font-dot text-[10px] tracking-wider text-amber">
            FREEZE
          </span>
        )}
      </div>

      {/* 右上: HR表示 */}
      <div className="absolute top-1.5 right-3 z-30 text-right leading-none">
        <div className="font-dot text-[10px] tracking-wider text-mute">
          HR <span className="text-[9px]">bpm</span>
        </div>
        <div
          className={`font-mono text-3xl font-bold tabular-nums md:text-4xl ${
            critical ? 'text-red' : 'text-phos'
          }`}
        >
          {hrText}
        </div>
      </div>

      {/* 中央上: 緊急アラーム */}
      {showAlarm && critical && (
        <div className="animate-blink absolute top-2 left-1/2 z-30 -translate-x-1/2 rounded border border-red/70 bg-red/15 px-2.5 py-0.5 font-dot text-xs tracking-widest text-red">
          ⚠ {def.alarmLabel ?? 'ALARM'}
        </div>
      )}

      {/* 左下: 波形名 */}
      {showLabel && (
        <div className="absolute bottom-2 left-3 z-30 font-dot text-[11px] tracking-wider text-phos/70">
          {def.abbr}｜{def.name}
        </div>
      )}

      {/* 右下: 操作 */}
      <div className="absolute right-2 bottom-1.5 z-30 flex gap-1.5">
        <button type="button" onClick={onSoundClick} className={btn(soundOn)}>
          {soundOn ? '♪ SOUND ON' : 'SOUND'}
        </button>
        <button type="button" onClick={() => setFrozen((f) => !f)} className={btn(frozen)}>
          {frozen ? 'RUN' : 'FREEZE'}
        </button>
      </div>
    </div>
  )
}
