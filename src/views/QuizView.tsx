import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { CategoryId, WaveformDef } from '../types'
import { CATEGORIES, DANGER_META, WAVEFORMS } from '../data/waveforms'
import { useApp } from '../store'
import EcgMonitor from '../components/EcgMonitor'

type Mode = 'identify' | 'action'

interface Choice {
  label: string
  sub?: string
}

interface Question {
  def: WaveformDef
  choices: Choice[]
  correctIdx: number
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildQuestions(pool: WaveformDef[], count: number, mode: Mode): Question[] {
  return shuffle(pool)
    .slice(0, count)
    .map((def) => {
      // 同カテゴリ→他カテゴリの順で紛らわしい選択肢を選ぶ
      const sameCat = shuffle(WAVEFORMS.filter((w) => w.id !== def.id && w.category === def.category))
      const rest = shuffle(WAVEFORMS.filter((w) => w.id !== def.id && w.category !== def.category))
      const candidates = [...sameCat, ...rest]

      const correctLabel = mode === 'identify' ? def.name : def.firstAction
      const distractors: Choice[] = []
      for (const c of candidates) {
        if (distractors.length >= 3) break
        const label = mode === 'identify' ? c.name : c.firstAction
        if (label === correctLabel) continue
        if (distractors.some((d) => d.label === label)) continue
        distractors.push(
          mode === 'identify' ? { label, sub: c.nameEn } : { label },
        )
      }
      const correct: Choice =
        mode === 'identify'
          ? { label: def.name, sub: def.nameEn }
          : { label: def.firstAction }
      const correctIdx = Math.floor(Math.random() * 4)
      const choices = [...distractors]
      choices.splice(correctIdx, 0, correct)
      return { def, choices, correctIdx }
    })
}

export default function QuizView() {
  const recordAnswer = useApp((s) => s.recordAnswer)
  const finishQuiz = useApp((s) => s.finishQuiz)
  const select = useApp((s) => s.select)
  const preset = useApp((s) => s.quizPreset)

  const [phase, setPhase] = useState<'setup' | 'play' | 'result'>('setup')
  const [mode, setMode] = useState<Mode>('identify')
  const [count, setCount] = useState(10)
  const [cats, setCats] = useState<Set<CategoryId>>(
    () => new Set(CATEGORIES.map((c) => c.id)),
  )
  const [focusIds, setFocusIds] = useState<string[] | null>(null)

  const [questions, setQuestions] = useState<Question[]>([])
  const [qIdx, setQIdx] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [results, setResults] = useState<boolean[]>([])
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const feedbackRef = useRef<HTMLDivElement>(null)

  // ライブラリ・成績画面からのプリセット(カテゴリ指定/苦手復習)を反映
  useEffect(() => {
    if (!preset) return
    if (preset.categories) setCats(new Set(preset.categories))
    if (preset.focusIds) setFocusIds(preset.focusIds)
    useApp.getState().setQuizPreset(null)
  }, [preset])

  const pool = useMemo(() => {
    if (focusIds) return WAVEFORMS.filter((w) => focusIds.includes(w.id))
    return WAVEFORMS.filter((w) => cats.has(w.category))
  }, [cats, focusIds])

  const start = () => {
    const n = Math.min(count, pool.length)
    if (n === 0) return
    setQuestions(buildQuestions(pool, n, mode))
    setQIdx(0)
    setPicked(null)
    setResults([])
    setStreak(0)
    setBestStreak(0)
    setPhase('play')
  }

  const q = questions[qIdx]

  const answer = (i: number) => {
    if (picked !== null || !q) return
    setPicked(i)
    const ok = i === q.correctIdx
    setResults((r) => [...r, ok])
    recordAnswer(q.def.id, ok)
    setStreak((s) => {
      const next = ok ? s + 1 : 0
      setBestStreak((b) => Math.max(b, next))
      return next
    })
    window.setTimeout(
      () => feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }),
      80,
    )
  }

  const next = () => {
    if (qIdx + 1 >= questions.length) {
      finishQuiz()
      setPhase('result')
    } else {
      setQIdx((i) => i + 1)
      setPicked(null)
    }
  }

  // キーボード操作(1-4で回答、Enterで次へ)
  useEffect(() => {
    if (phase !== 'play') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '4') answer(Number(e.key) - 1)
      if (e.key === 'Enter' && picked !== null) next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  /* ============================ 設定画面 ============================ */
  if (phase === 'setup') {
    const toggleCat = (id: CategoryId) => {
      setFocusIds(null)
      setCats((prev) => {
        const nx = new Set(prev)
        if (nx.has(id)) nx.delete(id)
        else nx.add(id)
        return nx
      })
    }
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div>
          <h2 className="text-2xl font-black tracking-wide">クイズモード</h2>
          <p className="mt-1 text-sm text-mute">
            動いているモニター波形を見て判読する実戦形式。繰り返すほど成績画面に苦手が見えてきます。
          </p>
        </div>

        {focusIds && (
          <div className="flex items-center gap-2 rounded-lg border border-amber/50 bg-amber/10 px-3 py-2 text-sm text-amber">
            <span className="font-bold">苦手復習モード</span>
            <span>対象 {pool.length} 波形</span>
            <button
              type="button"
              onClick={() => setFocusIds(null)}
              className="ml-auto rounded border border-amber/50 px-2 py-0.5 text-xs hover:bg-amber/15"
            >
              解除
            </button>
          </div>
        )}

        <section className="rounded-xl border border-line2 bg-panel p-4">
          <h3 className="mb-2 font-dot text-[10px] tracking-[0.25em] text-mute">MODE</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ['identify', '波形判読', 'この波形は何か?を当てる'],
                ['action', '初期対応', '発見時にまず何をするか?を当てる'],
              ] as const
            ).map(([m, label, desc]) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-lg border p-3 text-left transition-all ${
                  mode === m
                    ? 'border-phos/60 bg-phos/10 shadow-[0_0_14px_rgba(54,255,156,0.15)]'
                    : 'border-line2 bg-panel2 hover:border-mute/50'
                }`}
              >
                <span className={`block text-sm font-bold ${mode === m ? 'text-phos' : ''}`}>
                  {label}
                </span>
                <span className="mt-0.5 block text-xs text-mute">{desc}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-line2 bg-panel p-4">
          <h3 className="mb-2 font-dot text-[10px] tracking-[0.25em] text-mute">RANGE</h3>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const on = !focusIds && cats.has(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCat(c.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                    on
                      ? `${c.border} ${c.color} bg-current/10`
                      : 'border-line2 text-mute hover:border-mute/50'
                  }`}
                >
                  {c.label}
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-mute">対象: {pool.length} 波形</p>
        </section>

        <section className="rounded-xl border border-line2 bg-panel p-4">
          <h3 className="mb-2 font-dot text-[10px] tracking-[0.25em] text-mute">QUESTIONS</h3>
          <div className="flex gap-2">
            {[5, 10, 15].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCount(n)}
                className={`rounded-lg border px-4 py-2 font-mono text-sm font-bold transition-all ${
                  count === n
                    ? 'border-phos/60 bg-phos/10 text-phos'
                    : 'border-line2 text-mute hover:border-mute/50'
                }`}
              >
                {n}問
              </button>
            ))}
          </div>
        </section>

        <button
          type="button"
          onClick={start}
          disabled={pool.length === 0}
          className="w-full rounded-xl border border-phos/60 bg-phos/15 py-3.5 text-base font-black tracking-widest text-phos transition-all hover:bg-phos/25 hover:shadow-[0_0_24px_rgba(54,255,156,0.3)] disabled:opacity-40"
        >
          ▶ クイズ開始（{Math.min(count, pool.length)}問）
        </button>
      </div>
    )
  }

  /* ============================ 結果画面 ============================ */
  if (phase === 'result') {
    const total = results.length
    const good = results.filter(Boolean).length
    const pct = total === 0 ? 0 : Math.round((good / total) * 100)
    const [title, msg] =
      pct === 100
        ? ['パーフェクト判読!', '全問正解。この調子で全カテゴリ制覇を目指しましょう。']
        : pct >= 80
          ? ['実戦レベルの判読力', '夜勤のモニター番も安心。間違えた波形だけ復習すればさらに上へ。']
          : pct >= 60
            ? ['基礎は固まってきました', '間違えた波形をライブラリで見直してから再挑戦しましょう。']
            : ['伸びしろ十分', 'まずは致死性不整脈4つ(VF・VT・TdP・心静止)を確実に見抜けるように。']
    const R = 56
    const CIRC = 2 * Math.PI * R
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="rounded-xl border border-line2 bg-panel p-6 text-center">
          <div className="relative mx-auto h-36 w-36">
            <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
              <circle cx="70" cy="70" r={R} fill="none" stroke="#14222e" strokeWidth="10" />
              <motion.circle
                cx="70"
                cy="70"
                r={R}
                fill="none"
                stroke={pct >= 80 ? '#36ff9c' : pct >= 60 ? '#ffb648' : '#ff4d5e'}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                initial={{ strokeDashoffset: CIRC }}
                animate={{ strokeDashoffset: CIRC * (1 - pct / 100) }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-4xl font-bold tabular-nums">{pct}%</span>
              <span className="font-dot text-[10px] tracking-widest text-mute">
                {good}/{total}
              </span>
            </div>
          </div>
          <h2 className="mt-4 text-xl font-black">{title}</h2>
          <p className="mt-1 text-sm text-mute">{msg}</p>
          <p className="mt-2 font-dot text-[11px] tracking-widest text-mute">
            MAX STREAK: {bestStreak}
          </p>
        </div>

        <section className="rounded-xl border border-line2 bg-panel p-4">
          <h3 className="mb-2 font-dot text-[10px] tracking-[0.25em] text-mute">REVIEW</h3>
          <ul className="divide-y divide-line">
            {questions.map((qq, i) => (
              <li key={`${qq.def.id}-${i}`}>
                <button
                  type="button"
                  onClick={() => select(qq.def.id)}
                  className="flex w-full items-center gap-3 px-1 py-2 text-left text-sm hover:bg-panel2"
                >
                  <span
                    className={`font-mono text-base font-bold ${results[i] ? 'text-phos' : 'text-red'}`}
                  >
                    {results[i] ? '○' : '✕'}
                  </span>
                  <span className="font-bold">{qq.def.name}</span>
                  <span className="ml-auto font-mono text-xs text-mute">{qq.def.abbr} →</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={start}
            className="rounded-xl border border-phos/60 bg-phos/15 py-3 font-bold text-phos hover:bg-phos/25"
          >
            同じ設定でもう一度
          </button>
          <button
            type="button"
            onClick={() => setPhase('setup')}
            className="rounded-xl border border-line2 bg-panel py-3 font-bold text-ink hover:bg-panel2"
          >
            設定を変える
          </button>
        </div>
      </div>
    )
  }

  /* ============================ 出題画面 ============================ */
  if (!q) return null
  const answered = picked !== null
  const correct = answered && picked === q.correctIdx

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* 進捗 */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm font-bold tabular-nums">
          Q {qIdx + 1}
          <span className="text-mute">/{questions.length}</span>
        </span>
        <div className="flex h-1.5 flex-1 gap-0.5 overflow-hidden rounded-full bg-panel">
          {questions.map((qq, i) => (
            <div
              key={`${qq.def.id}-bar-${i}`}
              className={`flex-1 ${
                i < results.length
                  ? results[i]
                    ? 'bg-phos'
                    : 'bg-red'
                  : i === qIdx
                    ? 'bg-line2'
                    : 'bg-line'
              }`}
            />
          ))}
        </div>
        <span className="font-dot text-[11px] tracking-widest text-mute">
          STREAK <span className="text-phos">{streak}</span>
        </span>
      </div>

      {/* モニター(答えがバレる表示はオフ) */}
      <div className="h-[200px] md:h-[260px]">
        <EcgMonitor def={q.def} showLabel={false} showAlarm={false} />
      </div>

      <h2 className="text-base font-bold md:text-lg">
        {mode === 'identify'
          ? 'このモニター波形の調律は?'
          : 'この波形を発見。最初に行うべき対応は?'}
        <span className="ml-2 hidden text-xs font-normal text-mute sm:inline">
          (キー1–4で回答 / Enterで次へ)
        </span>
      </h2>

      {/* 選択肢 */}
      <div className={`grid gap-2 ${mode === 'identify' ? 'sm:grid-cols-2' : ''}`}>
        {q.choices.map((c, i) => {
          let cls = 'border-line2 bg-panel hover:border-phos/50 hover:bg-panel2'
          if (answered) {
            if (i === q.correctIdx) cls = 'border-phos bg-phos/15 text-phos'
            else if (i === picked) cls = 'border-red bg-red/10 text-red'
            else cls = 'border-line bg-panel opacity-50'
          }
          return (
            <button
              key={c.label}
              type="button"
              disabled={answered}
              onClick={() => answer(i)}
              className={`flex items-start gap-2.5 rounded-lg border p-3 text-left transition-all ${cls}`}
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-current/40 font-mono text-[11px] font-bold opacity-70">
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold leading-snug">{c.label}</span>
                {c.sub && <span className="mt-0.5 block font-mono text-[10px] opacity-60">{c.sub}</span>}
              </span>
            </button>
          )
        })}
      </div>

      {/* フィードバック */}
      <div ref={feedbackRef}>
        <AnimatePresence>
          {answered && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              className={`rounded-xl border p-4 ${
                correct ? 'border-phos/60 bg-phos/8' : 'border-red/60 bg-red/8'
              }`}
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className={`text-lg font-black ${correct ? 'text-phos' : 'text-red'}`}>
                  {correct ? '○ 正解' : '✕ 不正解'}
                </span>
                <span className="text-sm">
                  正解: <span className="font-bold">{q.def.name}</span>
                  <span className="ml-1.5 font-mono text-xs text-mute">{q.def.nameEn}</span>
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${DANGER_META[q.def.danger].chip}`}
                >
                  {DANGER_META[q.def.danger].label}
                </span>
              </div>
              <ul className="mt-2.5 space-y-1">
                {q.def.keyFeatures.slice(0, 3).map((f) => (
                  <li key={f} className="flex gap-2 text-sm leading-relaxed">
                    <span className="mt-0.5 shrink-0 text-phos">▸</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2.5 rounded-lg border border-amber/40 bg-amber/10 px-3 py-2 text-sm">
                <span className="mr-1.5 font-dot text-[10px] tracking-widest text-amber">
                  FIRST ACTION
                </span>
                {q.def.firstAction}
              </p>
              <button
                type="button"
                onClick={next}
                className="mt-3 w-full rounded-lg border border-phos/60 bg-phos/15 py-2.5 font-bold text-phos transition-all hover:bg-phos/25 sm:w-auto sm:px-8"
              >
                {qIdx + 1 >= questions.length ? '結果を見る ▶' : '次の問題 ▶'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
