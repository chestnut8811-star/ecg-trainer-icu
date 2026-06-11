import type { VesselKey } from './cases'

/**
 * 冠動脈シェーマ(前面像)。
 * 責任血管を赤くハイライトし、閉塞部位に×マーカーを表示する。
 * 模式図であり解剖学的に厳密な走行ではない。
 */

const VESSELS: { key: VesselKey; d: string; label: string; lx: number; ly: number }[] = [
  { key: 'LMT', d: 'M112,42 L94,58', label: '主幹部', lx: 132, ly: 50 },
  { key: 'LAD', d: 'M94,58 C89,92 85,132 90,182', label: 'LAD', lx: 96, ly: 160 },
  { key: 'LCx', d: 'M94,58 C70,62 50,80 49,118 C48,141 57,160 67,171', label: 'LCx', lx: 26, ly: 112 },
  { key: 'RCA', d: 'M112,42 C131,47 145,60 147,86 C149,124 134,164 118,182', label: 'RCA', lx: 162, ly: 96 },
]

// アンギオでの代表的な閉塞部位(模式座標)
const MARKS: Record<string, { x: number; y: number }> = {
  LMT: { x: 103, y: 50 },
  'LAD-prox': { x: 91, y: 76 },
  'LAD-mid': { x: 87, y: 116 },
  'LCx-prox': { x: 63, y: 71 },
  'LCx-dist': { x: 57, y: 152 },
  'RCA-prox': { x: 142, y: 72 },
  'RCA-mid': { x: 148, y: 116 },
}

const CULPRIT = '#ff5d6c'
const DIM = 'rgba(140, 175, 160, 0.4)'

export default function CoronaryDiagram({
  vesselKey,
  mark,
}: {
  vesselKey: VesselKey
  mark: string
}) {
  const m = MARKS[mark]
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden="true">
      {/* 心臓シルエット */}
      <path
        d="M38,58 C38,32 96,26 104,54 C112,26 172,32 170,60 C168,116 112,168 104,182 C96,168 38,114 38,58 Z"
        fill="rgba(54,255,156,0.035)"
        stroke="rgba(54,255,156,0.12)"
        strokeWidth="1.5"
      />
      {/* 大動脈起始 */}
      <path
        d="M104,16 L104,42 M94,42 L114,42"
        fill="none"
        stroke="rgba(160,190,180,0.55)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <text x="104" y="13" fontSize="8.5" fontFamily="monospace" fill="rgba(150,180,170,0.7)" textAnchor="middle">
        Ao
      </text>

      {/* 冠動脈(責任血管以外は淡色) */}
      {VESSELS.map((v) => {
        const culprit = v.key === vesselKey
        return (
          <g key={v.key}>
            <path
              d={v.d}
              fill="none"
              strokeLinecap="round"
              stroke={culprit ? CULPRIT : DIM}
              strokeWidth={culprit ? 4.5 : 2.4}
              style={culprit ? { filter: 'drop-shadow(0 0 4px rgba(255,77,94,0.85))' } : undefined}
            />
            <text
              x={v.lx}
              y={v.ly}
              fontSize="9.5"
              fontFamily="monospace"
              fontWeight={culprit ? 700 : 400}
              fill={culprit ? '#ff9aa1' : 'rgba(150,180,170,0.7)'}
              textAnchor="middle"
            >
              {v.label}
            </text>
          </g>
        )
      })}

      {/* 閉塞マーカー(×) */}
      {m && (
        <g>
          <circle cx={m.x} cy={m.y} r="8.5" fill="#04070b" stroke={CULPRIT} strokeWidth="2" />
          <line x1={m.x - 4} y1={m.y - 4} x2={m.x + 4} y2={m.y + 4} stroke={CULPRIT} strokeWidth="2.4" strokeLinecap="round" />
          <line x1={m.x - 4} y1={m.y + 4} x2={m.x + 4} y2={m.y - 4} stroke={CULPRIT} strokeWidth="2.4" strokeLinecap="round" />
        </g>
      )}
    </svg>
  )
}
