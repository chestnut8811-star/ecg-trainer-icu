import type { GenConfig, ShapeMod } from '../types'

/**
 * 心電図波形合成エンジン
 * P波・QRS・T波をガウシアン成分の和として合成し、
 * 不整脈ごとのリズムロジックで拍動をスケジュールする。
 * 第II誘導・電位はmV単位。
 */

export interface GaussComp {
  amp: number
  mu: number
  sigma: number
}

interface Beat {
  t: number
  comps: GaussComp[]
  /** QRSを含む拍か(心拍数計算・同期音用) */
  qrs: boolean
}

export interface EcgEngine {
  /** 時刻t(秒)の電位(mV)。tは単調増加で呼ぶこと */
  sample(t: number): number
  /** (t0, t1] に含まれるQRS時刻(同期音用) */
  beatsBetween(t0: number, t1: number): number[]
  /** 直近約8秒から推定した心拍数。算出不能ならnull */
  hr(t: number): number | null
}

/** 再現性のある乱数(mulberry32) */
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

/** 正常(narrow QRS)拍。R波頂点が時刻0 */
function narrowComps(m: ShapeMod = {}): GaussComp[] {
  const w = m.widthScale ?? 1
  const comps: GaussComp[] = []
  const pAmp = m.pAmp ?? 0.13
  if (pAmp > 0.001) {
    comps.push({ amp: pAmp, mu: -(m.pr ?? 0.17), sigma: m.pSigma ?? 0.024 })
  }
  comps.push({ amp: -0.08, mu: -0.027 * w, sigma: 0.0095 * w })
  comps.push({ amp: m.rAmp ?? 1.08, mu: 0, sigma: 0.0115 * w })
  comps.push({ amp: -0.18, mu: 0.028 * w, sigma: 0.0105 * w })
  if (m.stDome) comps.push({ amp: m.stDome, mu: 0.17, sigma: 0.075 })
  comps.push({
    amp: m.tAmp ?? 0.28,
    mu: m.tMu ?? 0.31,
    sigma: m.tSigma ?? 0.05,
  })
  return comps
}

/** 幅広QRS拍(心室起源)。scaleに負値を渡すと極性反転 */
function wideComps(scale = 1): GaussComp[] {
  return [
    { amp: 1.3 * scale, mu: 0, sigma: 0.034 },
    { amp: -0.5 * scale, mu: 0.075, sigma: 0.045 },
    { amp: -0.5 * scale, mu: 0.37, sigma: 0.085 },
  ]
}

/** ペーシングスパイク+幅広QRS */
function pacedComps(): GaussComp[] {
  return [
    { amp: 1.15, mu: -0.06, sigma: 0.0022 },
    { amp: 0.95, mu: 0, sigma: 0.036 },
    { amp: -0.42, mu: 0.085, sigma: 0.05 },
    { amp: -0.33, mu: 0.4, sigma: 0.085 },
  ]
}

/** P波のみ(ブロックで脱落したP・房室解離のP) */
function pOnlyComps(amp = 0.13): GaussComp[] {
  return [{ amp, mu: 0, sigma: 0.024 }]
}

const randIn = (rnd: () => number, min: number, max: number) =>
  min + rnd() * (max - min)
const randInt = (rnd: () => number, min: number, max: number) =>
  Math.floor(randIn(rnd, min, max + 0.999))

/** 連続成分(f波・F波・VF・ノイズバースト)の生成 */
function makeBaseline(cfg: GenConfig, rnd: () => number): (t: number) => number {
  switch (cfg.kind) {
    case 'af':
      // 細動波: 複数周波数の揺らぐ正弦波
      return (t) =>
        0.05 * Math.sin(2 * Math.PI * (5.4 * t + 1.9 * Math.sin(0.9 * t))) +
        0.045 * Math.sin(2 * Math.PI * (6.8 * t + 1.3 * Math.sin(0.6 * t + 1)))
    case 'flutter':
      // 鋸歯状F波 300/min: ゆっくり下降して急峻に立ち上がる
      return (t) => {
        const ph = (t * 5) % 1
        return (0.5 - ph) * 0.34
      }
    case 'vf':
      // 無秩序な粗動様の揺れ(coarse VF)
      return (t) => {
        const env = 0.75 + 0.35 * Math.sin(2 * Math.PI * 0.13 * t)
        return (
          env *
          (0.3 * Math.sin(2 * Math.PI * (4.3 * t + 1.9 * Math.sin(0.37 * t))) +
            0.26 *
              Math.sin(2 * Math.PI * (5.9 * t + 1.3 * Math.sin(0.23 * t + 2))) +
            0.18 *
              Math.sin(2 * Math.PI * (3.1 * t + 2.4 * Math.sin(0.51 * t + 4))))
        )
      }
    case 'asystole':
      return (t) => 0.02 * Math.sin(2 * Math.PI * 0.3 * t)
    case 'artifact':
      // 周期的な筋電図様ノイズバースト(中のQRSは透けて見える)
      return (t) => {
        const ph = t % 8
        if (ph >= 3.2) return 0
        const env = Math.sin((Math.PI * ph) / 3.2) ** 2
        return (
          env *
          (0.2 * Math.sin(2 * Math.PI * 23 * t + 3 * Math.sin(7 * t)) +
            0.16 * Math.sin(2 * Math.PI * 31 * t + 5 * Math.sin(3 * t)) +
            (rnd() - 0.5) * 0.34 +
            0.1 * Math.sin(2 * Math.PI * 1.3 * t))
        )
      }
    default:
      return () => 0
  }
}

export function createEngine(cfg: GenConfig, seed = 1): EcgEngine {
  const rnd = mulberry32(seed)
  const beats: Beat[] = []
  const baseline = makeBaseline(cfg, rnd)

  const emit = (t: number, comps: GaussComp[], qrs = true) =>
    beats.push({ t, comps, qrs })

  // ---- 各リズムのスケジューラ(次のイベントを1つ進めて現在カーソルを返す) ----
  let scheduleNext: (cursor: number) => number

  switch (cfg.kind) {
    case 'sinus': {
      const rr = 60 / cfg.rate
      const jitter = cfg.jitter ?? 0.02
      const shape = narrowComps(cfg.shape)
      let nextT = 0.4
      let lastSinus = nextT
      let sinceEct = 0
      let target = cfg.ectopy
        ? randInt(rnd, cfg.ectopy.min, cfg.ectopy.max)
        : Infinity
      scheduleNext = () => {
        if (cfg.ectopy && sinceEct >= target) {
          sinceEct = 0
          target = randInt(rnd, cfg.ectopy.min, cfg.ectopy.max)
          if (cfg.ectopy.type === 'pvc') {
            // 早期の幅広QRS(先行Pなし) → 代償性休止
            const t = lastSinus + rr * 0.55
            emit(t, wideComps(-1.05))
            nextT = lastSinus + 2 * rr
            lastSinus = nextT - rr // 洞周期は保たれる
            return t
          }
          // PAC: 形の違うP'を伴う早期narrow拍 → 非代償性休止
          const t = lastSinus + rr * 0.62
          emit(t, narrowComps({ ...cfg.shape, pAmp: 0.09, pr: 0.14 }))
          nextT = t + rr * 1.12
          lastSinus = t
          return t
        }
        const t = nextT
        emit(t, shape)
        lastSinus = t
        nextT += rr * (1 + (rnd() - 0.5) * 2 * jitter)
        sinceEct++
        return t
      }
      break
    }

    case 'af': {
      const shape = narrowComps({ pAmp: 0 })
      let nextT = 0.4
      scheduleNext = () => {
        const t = nextT
        emit(t, shape)
        nextT += randIn(rnd, cfg.rrMin, cfg.rrMax)
        return t
      }
      break
    }

    case 'flutter': {
      // F波300/minに対し基本4:1伝導(75bpm)、ときどき2:1(150bpm)のラン
      const shape = narrowComps({ pAmp: 0 })
      let nextT = 0.5
      let runLeft = 0
      scheduleNext = () => {
        const t = nextT
        emit(t, shape)
        if (runLeft === 0 && rnd() < 0.1) runLeft = randInt(rnd, 3, 5)
        const ratio = runLeft > 0 ? 2 : 4
        if (runLeft > 0) runLeft--
        nextT += 0.2 * ratio
        return t
      }
      break
    }

    case 'wenckebach': {
      // PP一定0.80s、PQが.18→.27→.36と延長し4拍目で脱落
      const prSeq: (number | null)[] = [0.18, 0.27, 0.36, null]
      const qrst = narrowComps({ pAmp: 0 })
      let nextP = 0.4
      let idx = 0
      scheduleNext = () => {
        const pT = nextP
        emit(pT, pOnlyComps(), false)
        const pr = prSeq[idx % prSeq.length]
        if (pr !== null) emit(pT + pr, qrst)
        idx++
        nextP += 0.8
        return pT
      }
      break
    }

    case 'mobitz2': {
      // PQ一定のままP波が突然脱落(4:3伝導)
      const qrst = narrowComps({ pAmp: 0 })
      let nextP = 0.4
      let idx = 0
      scheduleNext = () => {
        const pT = nextP
        emit(pT, pOnlyComps(), false)
        if (idx % 4 !== 3) emit(pT + 0.17, qrst)
        idx++
        nextP += 0.8
        return pT
      }
      break
    }

    case 'avb3': {
      // P波80/minとwide補充調律36/minが完全に独立
      const escape = wideComps(0.85)
      let nextP = 0.3
      let nextR = 0.62
      scheduleNext = () => {
        if (nextP <= nextR) {
          const t = nextP
          emit(t, pOnlyComps(), false)
          nextP += 0.75
          return t
        }
        const t = nextR
        emit(t, escape)
        nextR += 1.67
        return t
      }
      break
    }

    case 'pause': {
      // 洞調律の途中で突然P-QRS-Tがまるごと欠落(洞停止)
      const rr = 60 / cfg.rate
      const shape = narrowComps()
      let nextT = 0.4
      let count = 0
      let target = randInt(rnd, 5, 8)
      scheduleNext = () => {
        const t = nextT
        emit(t, shape)
        count++
        nextT += rr * (1 + (rnd() - 0.5) * 0.04)
        if (count >= target) {
          nextT += 2.6 // ポーズ
          count = 0
          target = randInt(rnd, 5, 8)
        }
        return t
      }
      break
    }

    case 'vt': {
      const rr = 60 / cfg.rate
      let nextT = 0.4
      scheduleNext = () => {
        const t = nextT
        emit(t, wideComps(1 + (rnd() - 0.5) * 0.14))
        nextT += rr * (1 + (rnd() - 0.5) * 0.03)
        return t
      }
      break
    }

    case 'tdp': {
      // QRS軸・振幅が紡錘状に「ねじれる」多形性VT
      let nextT = 0.4
      scheduleNext = () => {
        const t = nextT
        const env = Math.sin((2 * Math.PI * t) / 4.2)
        const s = Math.sign(env) * Math.max(0.28, Math.abs(env))
        emit(t, wideComps(s * 1.15))
        nextT += 0.28 * (1 + (rnd() - 0.5) * 0.06)
        return t
      }
      break
    }

    case 'vf':
    case 'asystole': {
      // 拍動なし(連続成分のみ)
      scheduleNext = (cursor) => cursor + 1
      break
    }

    case 'paced': {
      const rr = 60 / cfg.rate
      const shape = pacedComps()
      let nextT = 0.5
      scheduleNext = () => {
        const t = nextT
        emit(t, shape)
        nextT += rr
        return t
      }
      break
    }

    case 'artifact': {
      // 基礎調律は正常洞調律。ノイズはbaseline側で重畳
      const rr = 60 / cfg.rate
      const shape = narrowComps()
      let nextT = 0.4
      scheduleNext = () => {
        const t = nextT
        emit(t, shape)
        nextT += rr * (1 + (rnd() - 0.5) * 0.04)
        return t
      }
      break
    }
  }

  let cursor = 0
  const ensure = (until: number) => {
    let guard = 0
    while (cursor < until + 2.5 && guard < 4000) {
      cursor = Math.max(cursor + 1e-4, scheduleNext(cursor))
      guard++
    }
    // 古い拍を間引く
    if (beats.length > 200) beats.splice(0, beats.length - 120)
  }

  const sample = (t: number): number => {
    ensure(t)
    let v = baseline(t)
    for (const b of beats) {
      const dt = t - b.t
      if (dt > 1.3 || dt < -0.9) continue
      for (const c of b.comps) v += c.amp * gauss(dt, c.mu, c.sigma)
    }
    // 微小ノイズ + 呼吸性基線動揺
    v += (rnd() - 0.5) * 0.012
    v += 0.02 * Math.sin(2 * Math.PI * 0.21 * t)
    return v
  }

  const beatsBetween = (t0: number, t1: number): number[] => {
    ensure(t1)
    const out: number[] = []
    for (const b of beats) if (b.qrs && b.t > t0 && b.t <= t1) out.push(b.t)
    return out
  }

  const hr = (t: number): number | null => {
    if (cfg.kind === 'vf' || cfg.kind === 'asystole') return null
    ensure(t)
    const win = beats.filter((b) => b.qrs && b.t >= t - 8 && b.t <= t)
    if (win.length < 3) return null
    const span = win[win.length - 1].t - win[0].t
    if (span <= 0) return null
    return Math.round(Math.min(300, Math.max(15, (60 * (win.length - 1)) / span)))
  }

  return { sample, beatsBetween, hr }
}
