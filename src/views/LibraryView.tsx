import { motion } from 'motion/react'
import { byCategory, byId, CATEGORIES, DANGER_META } from '../data/waveforms'
import { useApp } from '../store'
import EcgMonitor from '../components/EcgMonitor'
import EcgThumbnail from '../components/EcgThumbnail'

const DOT: Record<string, string> = {
  normal: 'bg-phos',
  watch: 'bg-amber',
  caution: 'bg-orange',
  critical: 'bg-red',
}

export default function LibraryView() {
  const selectedId = useApp((s) => s.selectedId)
  const select = useApp((s) => s.select)
  const setView = useApp((s) => s.setView)
  const setQuizPreset = useApp((s) => s.setQuizPreset)
  const def = byId(selectedId)
  const danger = DANGER_META[def.danger]
  const cat = CATEGORIES.find((c) => c.id === def.category)!

  const startCategoryQuiz = () => {
    setQuizPreset({ categories: [def.category] })
    setView('quiz')
  }

  const fade = (i: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, delay: 0.05 * i, ease: 'easeOut' as const },
  })

  return (
    <div className="gap-5 md:grid md:grid-cols-[300px_1fr]">
      {/* ===== サイドバー(デスクトップ) ===== */}
      <aside className="hidden md:block">
        <div className="sticky top-[72px] max-h-[calc(100vh-170px)] space-y-4 overflow-y-auto pr-1 pb-4">
          {CATEGORIES.map((c) => (
            <section key={c.id}>
              <h2 className={`mb-1.5 flex items-baseline gap-2 px-1 ${c.color}`}>
                <span className="font-dot text-[10px] tracking-[0.25em]">{c.labelEn}</span>
                <span className="text-xs font-bold">{c.label}</span>
              </h2>
              <ul className="space-y-1">
                {byCategory(c.id).map((w) => {
                  const active = w.id === selectedId
                  return (
                    <li key={w.id}>
                      <button
                        type="button"
                        onClick={() => select(w.id)}
                        className={`flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-all ${
                          active
                            ? 'border-phos/50 bg-phos/10 shadow-[0_0_14px_rgba(54,255,156,0.12)]'
                            : 'border-line/80 bg-panel hover:border-line2 hover:bg-panel2'
                        }`}
                      >
                        <EcgThumbnail
                          def={w}
                          className={`h-7 w-20 shrink-0 rounded bg-[#020604] ${c.color}`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-bold leading-tight">
                            {w.name}
                          </span>
                          <span className="font-mono text-[10px] text-mute">{w.abbr}</span>
                        </span>
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${DOT[w.danger]} ${
                            w.danger === 'critical' ? 'animate-blink' : ''
                          }`}
                          title={DANGER_META[w.danger].label}
                        />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      </aside>

      {/* ===== モバイル: セレクタ ===== */}
      <div className="mb-3 md:hidden">
        <label className="mb-1 block font-dot text-[10px] tracking-[0.25em] text-mute">
          SELECT WAVEFORM
        </label>
        <select
          value={selectedId}
          onChange={(e) => select(e.target.value)}
          className="w-full rounded-lg border border-line2 bg-panel px-3 py-2.5 text-sm font-bold text-ink outline-none focus:border-phos/60"
        >
          {CATEGORIES.map((c) => (
            <optgroup key={c.id} label={`■ ${c.label}`}>
              {byCategory(c.id).map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}（{w.abbr}）
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* ===== 詳細 ===== */}
      <motion.section key={def.id} className="min-w-0 space-y-4">
        {/* モニター */}
        <motion.div {...fade(0)} className="h-[220px] md:h-[300px]">
          <EcgMonitor def={def} />
        </motion.div>

        {/* タイトル行 */}
        <motion.div {...fade(1)} className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2 className="text-2xl font-black tracking-wide md:text-3xl">{def.name}</h2>
          <span className="font-mono text-sm text-mute">{def.nameEn}</span>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${danger.chip} ${
              def.danger === 'critical' ? 'animate-blink' : ''
            }`}
          >
            {danger.label}
          </span>
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${cat.border} ${cat.color}`}>
            {cat.label}
          </span>
        </motion.div>

        {/* HR・リズムチップ */}
        <motion.div {...fade(2)} className="flex flex-wrap gap-2">
          <span className="rounded-lg border border-line2 bg-panel px-3 py-1.5 text-sm">
            <span className="font-dot text-[10px] tracking-widest text-mute">HR </span>
            <span className="font-mono font-bold">{def.hr}</span>
          </span>
          <span className="rounded-lg border border-line2 bg-panel px-3 py-1.5 text-sm">
            <span className="font-dot text-[10px] tracking-widest text-mute">RHYTHM </span>
            <span className="font-bold">{def.rhythm}</span>
          </span>
        </motion.div>

        {/* 特徴と解説 */}
        <div className="grid gap-4 lg:grid-cols-2">
          <motion.div
            {...fade(3)}
            className="rounded-xl border border-line2 bg-panel p-4"
          >
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-phos">
              <span className="font-dot text-[10px] tracking-[0.25em]">KEY FEATURES</span>
              判読のポイント
            </h3>
            <ul className="space-y-2">
              {def.keyFeatures.map((f) => (
                <li key={f} className="flex gap-2 text-sm leading-relaxed">
                  <span className="mt-0.5 shrink-0 text-phos">▸</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            {...fade(4)}
            className="rounded-xl border border-line2 bg-panel p-4"
          >
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-cyan">
              <span className="font-dot text-[10px] tracking-[0.25em]">ABOUT</span>
              どんな波形?
            </h3>
            <p className="text-sm leading-relaxed text-ink/90">{def.description}</p>
          </motion.div>
        </div>

        {/* 看護のポイント */}
        <motion.div
          {...fade(5)}
          className={`rounded-xl border-l-4 ${danger.bar} border border-line2 bg-panel2 p-4`}
        >
          <h3 className={`mb-2 flex items-center gap-2 text-sm font-bold ${danger.text}`}>
            <span className="font-dot text-[10px] tracking-[0.25em]">NURSING</span>
            看護のポイント
          </h3>
          <ol className="space-y-2">
            {def.nursingPoints.map((p, i) => (
              <li key={p} className="flex gap-2.5 text-sm leading-relaxed">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${danger.chip}`}
                >
                  {i + 1}
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ol>
        </motion.div>

        {/* 初期対応 */}
        <motion.div
          {...fade(6)}
          className="rounded-xl border border-line2 bg-panel p-4"
        >
          <h3 className="mb-1.5 flex items-center gap-2 text-sm font-bold text-amber">
            <span className="font-dot text-[10px] tracking-[0.25em]">FIRST ACTION</span>
            発見時にまず行うこと
          </h3>
          <p className="text-sm font-bold leading-relaxed">{def.firstAction}</p>
        </motion.div>

        <motion.div {...fade(7)} className="pb-2">
          <button
            type="button"
            onClick={startCategoryQuiz}
            className="rounded-lg border border-phos/50 bg-phos/10 px-4 py-2.5 text-sm font-bold text-phos transition-all hover:bg-phos/20 hover:shadow-[0_0_18px_rgba(54,255,156,0.25)]"
          >
            ▶ 「{cat.label}」をクイズで練習する
          </button>
        </motion.div>
      </motion.section>
    </div>
  )
}
