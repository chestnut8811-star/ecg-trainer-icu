import { useMemo } from 'react'
import type { WaveformDef } from '../types'
import { createEngine } from '../engine/ecg'

const cache = new Map<string, string>()

/** 3.2秒分の静止ストリップをSVGパスとして生成(一覧用サムネイル) */
function buildPath(def: WaveformDef): string {
  const hit = cache.get(def.id)
  if (hit) return hit
  const engine = createEngine(def.gen, 7)
  const T0 = 0.4
  const DUR = 3.2
  const W = 320
  const H = 84
  const pts: string[] = []
  for (let i = 0; i <= 800; i++) {
    const t = T0 + (i / 800) * DUR
    const x = ((i / 800) * W).toFixed(1)
    const y = Math.max(3, Math.min(H - 3, H * 0.55 - engine.sample(t) * 26)).toFixed(1)
    pts.push(`${i === 0 ? 'M' : 'L'}${x} ${y}`)
  }
  const d = pts.join('')
  cache.set(def.id, d)
  return d
}

export default function EcgThumbnail({
  def,
  className = '',
}: {
  def: WaveformDef
  className?: string
}) {
  const d = useMemo(() => buildPath(def), [def])
  return (
    <svg
      viewBox="0 0 320 84"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.95"
      />
    </svg>
  )
}
