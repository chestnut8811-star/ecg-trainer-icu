import { motion } from 'motion/react'
import { CATEGORIES, WAVEFORMS } from '../data/waveforms'
import { useApp } from '../store'

export default function StatsView() {
  const stats = useApp((s) => s.stats)
  const quizzesDone = useApp((s) => s.quizzesDone)
  const resetStats = useApp((s) => s.resetStats)
  const setQuizPreset = useApp((s) => s.setQuizPreset)
  const setView = useApp((s) => s.setView)
  const select = useApp((s) => s.select)

  const rows = WAVEFORMS.map((w) => {
    const e = stats[w.id]
    const attempts = e?.attempts ?? 0
    const correct = e?.correct ?? 0
    const acc = attempts > 0 ? Math.round((correct / attempts) * 100) : null
    return { def: w, attempts, correct, acc }
  })
  const answered = rows.filter((r) => r.attempts > 0)
  const totalAttempts = answered.reduce((s, r) => s + r.attempts, 0)
  const totalCorrect = answered.reduce((s, r) => s + r.correct, 0)
  const overall = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : null

  const weak = answered
    .filter((r) => r.attempts >= 2 && (r.acc ?? 100) < 70)
    .sort((a, b) => (a.acc ?? 0) - (b.acc ?? 0))

  const sorted = [...answered].sort(
    (a, b) => (a.acc ?? 0) - (b.acc ?? 0) || b.attempts - a.attempts,
  )
  const untouched = rows.filter((r) => r.attempts === 0)

  const startWeakQuiz = () => {
    setQuizPreset({ focusIds: weak.map((r) => r.def.id) })
    setView('quiz')
  }

  const accColor = (acc: number) =>
    acc >= 80 ? 'text-phos' : acc >= 60 ? 'text-amber' : 'text-red'
  const barColor = (acc: number) =>
    acc >= 80 ? 'bg-phos' : acc >= 60 ? 'bg-amber' : 'bg-red'

  if (answered.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-line2 bg-panel p-8 text-center">
        <p className="font-dot text-xs tracking-[0.3em] text-mute">NO DATA</p>
        <h2 className="mt-2 text-xl font-black">まだ記録がありません</h2>
        <p className="mt-2 text-sm leading-relaxed text-mute">
          クイズに挑戦すると、波形ごとの正答率と苦手がここに蓄積されます。
          データはこの端末のブラウザにだけ保存されます。
        </p>
        <button
          type="button"
          onClick={() => setView('quiz')}
          className="mt-5 rounded-xl border border-phos/60 bg-phos/15 px-6 py-3 font-bold text-phos hover:bg-phos/25"
        >
          ▶ クイズへ
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h2 className="text-2xl font-black tracking-wide">成績・苦手分析</h2>

      {/* サマリー */}
      <div className="grid grid-cols-3 gap-2">
        {[
          ['総回答', `${totalAttempts}`, '問'],
          ['正答率', overall === null ? '--' : `${overall}`, '%'],
          ['完了クイズ', `${quizzesDone}`, '回'],
        ].map(([label, value, unit]) => (
          <div key={label} className="rounded-xl border border-line2 bg-panel p-3 text-center">
            <p className="font-dot text-[10px] tracking-widest text-mute">{label}</p>
            <p className="mt-1 font-mono text-2xl font-bold tabular-nums">
              {value}
              <span className="ml-0.5 text-xs text-mute">{unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* 苦手 */}
      {weak.length > 0 && (
        <section className="rounded-xl border border-red/40 bg-red/5 p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-red">
            <span className="font-dot text-[10px] tracking-[0.25em]">WEAK POINT</span>
            重点復習リスト
          </h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {weak.map((r) => (
              <li key={r.def.id}>
                <button
                  type="button"
                  onClick={() => select(r.def.id)}
                  className="rounded-full border border-red/50 bg-red/10 px-3 py-1 text-xs font-bold text-red hover:bg-red/20"
                >
                  {r.def.name} {r.acc}%
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={startWeakQuiz}
            className="mt-3 rounded-lg border border-red/60 bg-red/15 px-4 py-2 text-sm font-bold text-red hover:bg-red/25"
          >
            ▶ 苦手波形だけでクイズ
          </button>
        </section>
      )}

      {/* 波形別 */}
      <section className="rounded-xl border border-line2 bg-panel p-4">
        <h3 className="mb-3 font-dot text-[10px] tracking-[0.25em] text-mute">
          ACCURACY BY WAVEFORM
        </h3>
        <ul className="space-y-2.5">
          {sorted.map((r, i) => {
            const cat = CATEGORIES.find((c) => c.id === r.def.category)!
            return (
              <li key={r.def.id}>
                <button
                  type="button"
                  onClick={() => select(r.def.id)}
                  className="group w-full text-left"
                >
                  <div className="flex items-baseline gap-2 text-sm">
                    <span className={`font-dot text-[9px] tracking-widest ${cat.color}`}>
                      {r.def.abbr}
                    </span>
                    <span className="font-bold group-hover:text-phos">{r.def.name}</span>
                    <span className="ml-auto font-mono text-xs text-mute">
                      {r.correct}/{r.attempts}
                    </span>
                    <span
                      className={`w-12 text-right font-mono text-sm font-bold tabular-nums ${accColor(r.acc ?? 0)}`}
                    >
                      {r.acc}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
                    <motion.div
                      className={`h-full rounded-full ${barColor(r.acc ?? 0)}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${r.acc}%` }}
                      transition={{ duration: 0.6, delay: i * 0.04, ease: 'easeOut' }}
                    />
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
        {untouched.length > 0 && (
          <div className="mt-4 border-t border-line pt-3">
            <p className="mb-1.5 text-xs text-mute">未出題:</p>
            <div className="flex flex-wrap gap-1.5">
              {untouched.map((r) => (
                <button
                  key={r.def.id}
                  type="button"
                  onClick={() => select(r.def.id)}
                  className="rounded-full border border-line2 px-2.5 py-0.5 text-xs text-mute hover:border-mute/60 hover:text-ink"
                >
                  {r.def.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="text-right">
        <button
          type="button"
          onClick={() => {
            if (window.confirm('学習履歴をすべてリセットしますか?')) resetStats()
          }}
          className="text-xs text-mute underline-offset-2 hover:text-red hover:underline"
        >
          学習履歴をリセット
        </button>
      </div>
    </div>
  )
}
