/**
 * 12誘導心電図 合成エンジン
 *
 * 肢誘導(I, II, III, aVR, aVL, aVF)は前額面上の各誘導軸へ
 * 平均電気軸ベクトルを投影(余弦則)して振幅・極性を決める。
 * これにより電気軸偏位・梗塞部位による変化が12誘導上で物理的に正しく現れる。
 * 胸部誘導(V1–V6)は水平面でありベクトル投影では表せないため、
 * R波増高(R-wave progression)テンプレートで生成する。
 *
 * 1拍をP・QRS・T等のガウシアン成分の和として合成し、リズムでスケジュールする。
 * 電位はmV、紙送り25mm/s・感度10mm/mV相当。
 */

export type LeadId =
  | 'I' | 'II' | 'III' | 'aVR' | 'aVL' | 'aVF'
  | 'V1' | 'V2' | 'V3' | 'V4' | 'V5' | 'V6'

export const LIMB_LEADS: LeadId[] = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF']
export const PRECORDIAL: LeadId[] = ['V1', 'V2', 'V3', 'V4', 'V5', 'V6']
export const ALL_LEADS: LeadId[] = [...LIMB_LEADS, ...PRECORDIAL]

/** 前額面における各肢誘導の軸角度(度・hexaxial reference system) */
const LIMB_ANGLE: Record<string, number> = {
  I: 0, II: 60, III: 120, aVR: -150, aVL: -30, aVF: 90,
}

const PRECORDIAL_IDX: Record<string, number> = {
  V1: 0, V2: 1, V3: 2, V4: 3, V5: 4, V6: 5,
}

export interface Comp {
  /** R波頂点(時刻0)からの相対時刻(秒) */
  mu: number
  /** 振幅(mV、符号付き) */
  amp: number
  sigma: number
}

export interface CaseSpec {
  /** 平均QRS電気軸(度)。正常 約+60、左軸 約-45、右軸 約+110 */
  qrsAxis: number
  tAxis: number
  pAxis: number
  /** QRS幅の倍率。脚ブロックで1.7前後 */
  widthScale?: number
  /** 肢誘導P波の基準振幅(mV) */
  pAmp?: number
  /** 心房細動など: P波を消してf波基線にする */
  afNoP?: boolean
  /** P波振幅の全誘導一律倍率(高K血症のP平低化など)。既定1 */
  pMul?: number
  /** 胸部誘導R波・S波テンプレートの倍率(長さ6) */
  precordRmul?: number[]
  precordSmul?: number[]
  /** 誘導別ST偏位(mV)。+で上昇、−で低下(対側性変化) */
  st?: Partial<Record<LeadId, number>>
  /** PR部分の低下(mV・心膜炎)。aVRは逆にPR上昇 */
  prDep?: number
  /** 誘導別T波の絶対振幅上書き(陰性T・増高T) */
  tOverride?: Partial<Record<LeadId, number>>
  /** T波振幅の一律倍率(高K血症の増高T)。既定1 */
  tMul?: number
  /** T波の幅(sigma)。小さいほど尖る(高K血症のテント状T)。既定0.05 */
  tSigma?: number
  /** 誘導別にQRS成分を丸ごと差し替え(脚ブロックのrSR'等) */
  special?: Partial<Record<LeadId, Comp[]>>
  /** デルタ波(WPW) */
  delta?: boolean
  /** PR短縮(WPW) */
  prShort?: boolean
}

const D2R = Math.PI / 180
const proj = (angle: number, axis: number) => Math.cos((angle - axis) * D2R)

/** 胸部誘導の基準テンプレート(正常)。index 0=V1 … 5=V6 */
const PRECORD_R = [0.22, 0.32, 0.62, 1.05, 1.25, 1.0]
const PRECORD_S = [0.85, 1.25, 0.72, 0.4, 0.2, 0.14]
const PRECORD_Q = [0, 0, 0, 0, 0.06, 0.07]
const PRECORD_T = [0.08, 0.32, 0.42, 0.46, 0.4, 0.3]
const PRECORD_P = [0.05, 0.09, 0.1, 0.1, 0.08, 0.06]

function limbQRS(angle: number, axis: number, w: number): Comp[] {
  const f = proj(angle, axis)
  if (f >= 0) {
    return [
      { mu: -0.045 * w, amp: -0.06, sigma: 0.012 * w },
      { mu: 0, amp: 1.02 * f + 0.04, sigma: 0.012 * w },
      { mu: 0.05 * w, amp: -0.12, sigma: 0.014 * w },
    ]
  }
  return [
    { mu: -0.03 * w, amp: 0.1, sigma: 0.012 * w },
    { mu: 0.02 * w, amp: 1.02 * f, sigma: 0.016 * w },
  ]
}

function precordQRS(idx: number, w: number, rMul: number, sMul: number): Comp[] {
  const comps: Comp[] = []
  if (PRECORD_Q[idx] > 0)
    comps.push({ mu: -0.045 * w, amp: -PRECORD_Q[idx], sigma: 0.011 * w })
  comps.push({ mu: 0, amp: PRECORD_R[idx] * rMul + 0.02, sigma: 0.012 * w })
  comps.push({ mu: 0.05 * w, amp: -PRECORD_S[idx] * sMul, sigma: 0.013 * w })
  return comps
}

const scaleComps = (comps: Comp[], w: number): Comp[] =>
  comps.map((c) => ({ mu: c.mu * w, amp: c.amp, sigma: c.sigma * w }))

/** 1拍分・指定誘導の成分列を構築 */
export function beatComps(spec: CaseSpec, lead: LeadId): Comp[] {
  const w = spec.widthScale ?? 1
  const isLimb = lead in LIMB_ANGLE
  const comps: Comp[] = []

  // --- QRS ---
  let qrs: Comp[]
  if (spec.special?.[lead]) {
    qrs = scaleComps(spec.special[lead]!, w)
  } else if (isLimb) {
    qrs = limbQRS(LIMB_ANGLE[lead], spec.qrsAxis, w)
  } else {
    const i = PRECORDIAL_IDX[lead]
    qrs = precordQRS(i, w, spec.precordRmul?.[i] ?? 1, spec.precordSmul?.[i] ?? 1)
  }

  // デルタ波(WPW): QRS立ち上がりに緩徐な傾斜を付与
  if (spec.delta) {
    const net = qrs.reduce((s, c) => s + c.amp, 0)
    const sign = net >= 0 ? 1 : -1
    comps.push({ mu: -0.055 * w, amp: 0.24 * sign, sigma: 0.03 * w })
  }
  comps.push(...qrs)

  // --- P波 ---
  const pMul = spec.pMul ?? 1
  if (!spec.afNoP) {
    const pr = spec.prShort ? 0.1 : 0.16
    if (isLimb) {
      const amp = (spec.pAmp ?? 0.15) * pMul * proj(LIMB_ANGLE[lead], spec.pAxis)
      comps.push({ mu: -pr, amp, sigma: 0.022 })
    } else {
      comps.push({ mu: -pr, amp: PRECORD_P[PRECORDIAL_IDX[lead]] * pMul, sigma: 0.022 })
    }
  }

  // --- PR部分の低下(心膜炎)。aVRは逆にPR上昇 ---
  if (spec.prDep) {
    comps.push({ mu: -0.075, amp: lead === 'aVR' ? spec.prDep : -spec.prDep, sigma: 0.035 })
  }

  // --- ST偏位 ---
  const st = spec.st?.[lead]
  if (st) comps.push({ mu: 0.15, amp: st, sigma: 0.062 })

  // --- T波 ---
  const tSig = spec.tSigma ?? 0.05
  const tMul = spec.tMul ?? 1
  const to = spec.tOverride?.[lead]
  if (to !== undefined) {
    comps.push({ mu: 0.32, amp: to, sigma: tSig })
  } else if (isLimb) {
    comps.push({ mu: 0.32, amp: 0.35 * tMul * proj(LIMB_ANGLE[lead], spec.tAxis), sigma: tSig })
  } else {
    comps.push({ mu: 0.32, amp: PRECORD_T[PRECORDIAL_IDX[lead]] * tMul, sigma: tSig })
  }

  return comps
}

export type Rhythm = { type: 'regular'; rate: number } | { type: 'af'; rate: number }

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const gauss = (dt: number, mu: number, sigma: number) =>
  Math.exp(-((dt - mu) * (dt - mu)) / (2 * sigma * sigma))

export interface TwelveEngine {
  sample(lead: LeadId, t: number): number
  beatsBetween(t0: number, t1: number): number[]
  readonly hr: number
}

export function createTwelve(
  spec: CaseSpec,
  rhythm: Rhythm,
  seed = 1,
): TwelveEngine {
  const rnd = mulberry32(seed)
  // 全誘導の成分を事前計算(形態は拍ごとに不変)
  const compsByLead = {} as Record<LeadId, Comp[]>
  for (const l of ALL_LEADS) compsByLead[l] = beatComps(spec, l)

  // 拍の発生時刻を先行スケジュール
  const beats: number[] = []
  let cursor = 0.45
  const ensure = (until: number) => {
    while (cursor < until + 1.5) {
      beats.push(cursor)
      if (rhythm.type === 'af') {
        cursor += 0.5 + rnd() * 0.55 // 絶対性不整脈
      } else {
        cursor += (60 / rhythm.rate) * (1 + (rnd() - 0.5) * 0.03)
      }
    }
    if (beats.length > 80) beats.splice(0, beats.length - 50)
  }

  const afBaseline = (t: number) =>
    0.045 * Math.sin(2 * Math.PI * (5.6 * t + 1.7 * Math.sin(0.8 * t))) +
    0.04 * Math.sin(2 * Math.PI * (7.1 * t + 1.2 * Math.sin(0.55 * t + 1)))

  const sample = (lead: LeadId, t: number): number => {
    ensure(t)
    const comps = compsByLead[lead]
    let v = 0
    for (const bt of beats) {
      const dt = t - bt
      if (dt > 0.6 || dt < -0.32) continue
      for (const c of comps) v += c.amp * gauss(dt, c.mu, c.sigma)
    }
    if (rhythm.type === 'af') v += afBaseline(t) * (lead === 'V1' ? 1.1 : 0.6)
    v += (rnd() - 0.5) * 0.008
    v += 0.012 * Math.sin(2 * Math.PI * 0.25 * t + (lead.charCodeAt(0) % 5))
    return v
  }

  const beatsBetween = (t0: number, t1: number): number[] => {
    ensure(t1)
    return beats.filter((b) => b > t0 && b <= t1)
  }

  return { sample, beatsBetween, hr: rhythm.rate }
}
