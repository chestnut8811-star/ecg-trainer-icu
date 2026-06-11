/**
 * モニター音響モジュール(Web Audio API)
 * - QRS同期音: 心拍に同期した「ピッ」
 * - 緊急アラーム: IEC 60601-1-8の高優先度アラームを模した5連音パターン
 * AudioContextはブラウザの自動再生制限のため、ユーザー操作(ボタン)から生成する。
 */

let ctx: AudioContext | null = null

export function ensureAudio(): void {
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new Ctor()
  }
  void ctx.resume()
}

/**
 * 最初のユーザー操作(クリック/キー/タッチ)でAudioContextを解錠する。
 * サウンドONで起動しても、ブラウザの自動再生制限により実際の発音には
 * 一度の操作が必要なため、画面に触れた瞬間から鳴り始めるようにする。
 * 戻り値でリスナーを解除できる。
 */
export function installAudioUnlock(): () => void {
  const events = ['pointerdown', 'keydown', 'touchstart'] as const
  const unlock = () => {
    ensureAudio()
    events.forEach((e) => window.removeEventListener(e, unlock))
  }
  events.forEach((e) => window.addEventListener(e, unlock, { passive: true }))
  return () => events.forEach((e) => window.removeEventListener(e, unlock))
}

/** 心拍同期音(ピッ) */
export function playQrsBeep(): void {
  if (!ctx || ctx.state !== 'running') return
  const t = ctx.currentTime
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = 'triangle'
  o.frequency.value = 880
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(0.09, t + 0.004)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07)
  o.connect(g)
  g.connect(ctx.destination)
  o.start(t)
  o.stop(t + 0.09)
}

function alarmTone(at: number): void {
  if (!ctx) return
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = 'square'
  o.frequency.value = 790
  g.gain.setValueAtTime(0, at)
  g.gain.linearRampToValueAtTime(0.045, at + 0.006)
  g.gain.setValueAtTime(0.045, at + 0.09)
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.13)
  o.connect(g)
  g.connect(ctx.destination)
  o.start(at)
  o.stop(at + 0.15)
}

/**
 * 高優先度アラーム(タ・タ・タ…タ・タ)を繰り返し再生する。
 * 戻り値の関数で停止。
 */
export function startCriticalAlarm(): () => void {
  if (!ctx) return () => {}
  let alive = true
  const burst = () => {
    if (!alive || !ctx || ctx.state !== 'running') return
    const t = ctx.currentTime + 0.02
    for (const off of [0, 0.21, 0.42, 0.78, 0.99]) alarmTone(t + off)
  }
  burst()
  const iv = window.setInterval(burst, 2600)
  return () => {
    alive = false
    clearInterval(iv)
  }
}
