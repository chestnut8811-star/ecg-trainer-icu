import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CASES, CAT_META, caseById, type Cat, type TwelveCase } from './cases'
import { ensureAudio, installAudioUnlock } from '../engine/audio'
import TwelveCanvas from './TwelveCanvas'

/** モニター版(基本/不整脈アプリ)へ戻る。file://とGitHub Pagesの両対応 */
function gotoMonitor() {
  const onFile = window.location.protocol === 'file:'
  window.location.href = onFile ? './心電図トレーナー.html' : '../'
}

function shuffle<T>(a: T[]): T[] {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

function Header({ soundOn, onToggleSound }: { soundOn: boolean; onToggleSound: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg2/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-3 py-2.5 md:px-6">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0 text-cyan" aria-hidden="true">
            <rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M4 13h2l1.3-3 1.8 5 1.3-4 .9 2h2.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 13h1.2l.9-2 1.2 3.4.9-2.4.6 1.4h1.2" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
          </svg>
          <div className="leading-tight">
            <h1 className="text-base font-black tracking-wide md:text-lg">
              12誘導心電図トレーナー
              <span className="ml-2 align-middle rounded border border-cyan/40 bg-cyan/10 px-1.5 py-0.5 text-[10px] font-bold tracking-widest text-cyan">
                12-LEAD
              </span>
            </h1>
            <p className="font-dot text-[10px] tracking-[0.22em] text-mute">
              STANDARD 12-LEAD ECG · 心電図検定対策
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onToggleSound}
            aria-pressed={soundOn}
            title="QRS同期音のON/OFF"
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors ${
              soundOn
                ? 'border-phos/60 bg-phos/15 text-phos'
                : 'border-line2 bg-panel text-mute hover:border-mute/60 hover:text-ink'
            }`}
          >
            {soundOn ? '♪ 音 ON' : '音 OFF'}
          </button>
          <button
            type="button"
            onClick={gotoMonitor}
            className="rounded-lg border border-line2 bg-panel px-2.5 py-1.5 text-xs font-bold text-mute transition-colors hover:border-phos/50 hover:text-phos"
          >
            ← モニター版
          </button>
        </div>
      </div>
    </header>
  )
}

/* ============================ 学習モード ============================ */
function StudyView({ soundOn }: { soundOn: boolean }) {
  const [id, setId] = useState('normal')
  const def = caseById(id)
  const cat = CAT_META[def.cat]

  const grouped = useMemo(() => {
    const order: Cat[] = ['normal', 'ischemia', 'conduction', 'hypertrophy', 'axis', 'other']
    return order.map((c) => ({ cat: c, items: CASES.filter((x) => x.cat === c) }))
  }, [])

  return (
    <div className="space-y-4">
      {/* ケース選択チップ */}
      <div className="space-y-2">
        {grouped.map((g) => (
          <div key={g.cat} className="flex flex-wrap items-center gap-1.5">
            <span className={`font-dot text-[10px] tracking-[0.2em] ${CAT_META[g.cat].color} mr-1 w-20 shrink-0`}>
              {CAT_META[g.cat].label}
            </span>
            {g.items.map((x) => (
              <button
                key={x.id}
                type="button"
                onClick={() => setId(x.id)}
                className={`rounded-full border px-3 py-1 text-xs font-bold transition-all ${
                  x.id === id
                    ? `${CAT_META[x.cat].border} ${CAT_META[x.cat].color} bg-white/5 shadow-[0_0_12px_rgba(255,255,255,0.06)]`
                    : 'border-line2 text-mute hover:border-mute/60 hover:text-ink'
                }`}
              >
                {x.name}
              </button>
            ))}
          </div>
        ))}
      </div>

      <motion.div
        key={def.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <TwelveCanvas def={def} highlightOn soundOn={soundOn} />
        <p className="mt-1.5 text-center font-dot text-[10px] tracking-widest text-mute">
          25mm/s · 左端の校正波=1mV ·{' '}
          <span className="text-amber-300">黄枠＝所見の出る誘導</span>
        </p>
      </motion.div>

      <Reading def={def} cat={cat} />
    </div>
  )
}

function Reading({ def, cat }: { def: TwelveCase; cat: { label: string; color: string; border: string } }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="text-xl font-black md:text-2xl">{def.name}</h2>
        <span className="font-mono text-sm text-mute">{def.nameEn}</span>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${cat.border} ${cat.color}`}>
          {cat.label}
        </span>
        <span className="rounded-full border border-line2 px-2.5 py-0.5 text-xs text-mute">
          検定 {def.grade}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="rounded-lg border border-line2 bg-panel px-3 py-1.5 text-sm">
          <span className="font-dot text-[10px] tracking-widest text-mute">HR </span>
          <span className="font-mono font-bold">{def.hrText}</span>
        </span>
        <span className="rounded-lg border border-line2 bg-panel px-3 py-1.5 text-sm">
          <span className="font-dot text-[10px] tracking-widest text-mute">AXIS </span>
          <span className="font-bold">{def.axisText}</span>
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-line2 bg-panel p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-cyan">
            <span className="font-dot text-[10px] tracking-[0.22em]">12-LEAD FINDINGS</span>
            判読のキー所見
          </h3>
          <ul className="space-y-2">
            {def.features.map((f) => (
              <li key={f} className="flex gap-2 text-sm leading-relaxed">
                <span className="mt-0.5 shrink-0 text-cyan">▸</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-line2 bg-panel p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-300">
            <span className="font-dot text-[10px] tracking-[0.22em]">ABOUT</span>
            病態の解説
          </h3>
          <p className="text-sm leading-relaxed text-ink/90">{def.description}</p>
        </div>
      </div>

      <div className="rounded-xl border border-line2 border-l-4 border-l-amber-300/60 bg-panel2 p-4">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-300">
          <span className="font-dot text-[10px] tracking-[0.22em]">CLINICAL</span>
          臨床・看護のポイント
        </h3>
        <ol className="space-y-2">
          {def.clinical.map((p, i) => (
            <li key={p} className="flex gap-2.5 text-sm leading-relaxed">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-300/50 bg-amber-300/10 text-[11px] font-bold text-amber-300">
                {i + 1}
              </span>
              <span>{p}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

/* ============================ クイズモード ============================ */
interface Q {
  def: TwelveCase
  choices: string[]
  correct: number
}

function buildQuiz(n: number): Q[] {
  return shuffle(CASES)
    .slice(0, n)
    .map((def) => {
      const distract = shuffle(CASES.filter((c) => c.id !== def.id)).slice(0, 3).map((c) => c.name)
      const correct = Math.floor(Math.random() * 4)
      const choices = [...distract]
      choices.splice(correct, 0, def.name)
      return { def, choices, correct }
    })
}

function QuizView({ soundOn }: { soundOn: boolean }) {
  const [phase, setPhase] = useState<'setup' | 'play' | 'result'>('setup')
  const [qs, setQs] = useState<Q[]>([])
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [results, setResults] = useState<boolean[]>([])

  const start = () => {
    setQs(buildQuiz(8))
    setIdx(0)
    setPicked(null)
    setResults([])
    setPhase('play')
  }

  if (phase === 'setup') {
    return (
      <div className="mx-auto max-w-xl space-y-4 text-center">
        <h2 className="text-2xl font-black">12誘導クイズ</h2>
        <p className="text-sm leading-relaxed text-mute">
          動く12誘導心電図を見て診断名を当てる、心電図検定スタイルの実戦形式です。
          梗塞部位や脚ブロックの判読力を鍛えましょう(全8問)。
        </p>
        <button
          type="button"
          onClick={start}
          className="rounded-xl border border-cyan/60 bg-cyan/15 px-8 py-3 font-black tracking-widest text-cyan transition-all hover:bg-cyan/25"
        >
          ▶ クイズ開始
        </button>
      </div>
    )
  }

  if (phase === 'result') {
    const good = results.filter(Boolean).length
    const pct = Math.round((good / results.length) * 100)
    return (
      <div className="mx-auto max-w-xl space-y-4 text-center">
        <div className="rounded-xl border border-line2 bg-panel p-6">
          <p className="font-dot text-[10px] tracking-[0.25em] text-mute">RESULT</p>
          <p className="mt-1 font-mono text-5xl font-bold tabular-nums">{pct}%</p>
          <p className="mt-1 text-sm text-mute">{good} / {results.length} 問正解</p>
        </div>
        <ul className="space-y-1 text-left">
          {qs.map((q, i) => (
            <li key={q.def.id} className="flex items-center gap-2 rounded-lg border border-line2 bg-panel px-3 py-2 text-sm">
              <span className={`font-mono font-bold ${results[i] ? 'text-phos' : 'text-red'}`}>
                {results[i] ? '○' : '✕'}
              </span>
              <span className="font-bold">{q.def.name}</span>
              <span className="ml-auto font-mono text-xs text-mute">{q.def.nameEn}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-center gap-2">
          <button type="button" onClick={start} className="rounded-xl border border-cyan/60 bg-cyan/15 px-6 py-3 font-bold text-cyan hover:bg-cyan/25">
            もう一度
          </button>
        </div>
      </div>
    )
  }

  const q = qs[idx]
  const answered = picked !== null
  const correct = answered && picked === q.correct
  const cat = CAT_META[q.def.cat]

  const answer = (i: number) => {
    if (answered) return
    setPicked(i)
    setResults((r) => [...r, i === q.correct])
  }
  const next = () => {
    if (idx + 1 >= qs.length) setPhase('result')
    else {
      setIdx((i) => i + 1)
      setPicked(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm font-bold">
          Q {idx + 1}<span className="text-mute">/{qs.length}</span>
        </span>
        <div className="flex h-1.5 flex-1 gap-0.5">
          {qs.map((qq, i) => (
            <div
              key={qq.def.id}
              className={`flex-1 rounded-full ${
                i < results.length ? (results[i] ? 'bg-phos' : 'bg-red') : i === idx ? 'bg-line2' : 'bg-line'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 診断名がバレないようハイライトはオフ */}
      <TwelveCanvas def={q.def} highlightOn={false} soundOn={soundOn} />

      <h2 className="text-base font-bold md:text-lg">この12誘導心電図の診断は?</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {q.choices.map((c, i) => {
          let cls = 'border-line2 bg-panel hover:border-cyan/50 hover:bg-panel2'
          if (answered) {
            if (i === q.correct) cls = 'border-phos bg-phos/15 text-phos'
            else if (i === picked) cls = 'border-red bg-red/10 text-red'
            else cls = 'border-line bg-panel opacity-50'
          }
          return (
            <button
              key={c}
              type="button"
              disabled={answered}
              onClick={() => answer(i)}
              className={`rounded-lg border p-3 text-left text-sm font-bold transition-all ${cls}`}
            >
              {c}
            </button>
          )
        })}
      </div>

      <AnimatePresence>
        {answered && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border p-4 ${correct ? 'border-phos/60 bg-phos/8' : 'border-red/60 bg-red/8'}`}
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className={`text-lg font-black ${correct ? 'text-phos' : 'text-red'}`}>
                {correct ? '○ 正解' : '✕ 不正解'}
              </span>
              <span className="text-sm">
                正解: <span className="font-bold">{q.def.name}</span>
              </span>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${cat.border} ${cat.color}`}>
                {cat.label}
              </span>
              {q.def.highlight.length > 0 && (
                <span className="font-dot text-[11px] tracking-widest text-amber-300">
                  KEY: {q.def.highlight.join(' · ')}
                </span>
              )}
            </div>
            <ul className="mt-2 space-y-1">
              {q.def.features.map((f) => (
                <li key={f} className="flex gap-2 text-sm leading-relaxed">
                  <span className="mt-0.5 shrink-0 text-cyan">▸</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={next}
              className="mt-3 w-full rounded-lg border border-cyan/60 bg-cyan/15 py-2.5 font-bold text-cyan hover:bg-cyan/25 sm:w-auto sm:px-8"
            >
              {idx + 1 >= qs.length ? '結果を見る ▶' : '次の問題 ▶'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ============================ ルート ============================ */
export default function TwelveApp() {
  const [mode, setMode] = useState<'study' | 'quiz'>('study')
  // サウンドON起動: 既定でON、最初の操作でオーディオを解錠する
  const [soundOn, setSoundOn] = useState(true)
  useEffect(() => installAudioUnlock(), [])
  const toggleSound = () => {
    ensureAudio()
    setSoundOn((s) => !s)
  }
  return (
    <div className="min-h-screen">
      <Header soundOn={soundOn} onToggleSound={toggleSound} />
      <main className="mx-auto max-w-5xl px-3 pt-4 pb-16 md:px-6">
        <div className="mb-4 grid grid-cols-2 gap-2">
          {([['study', '学習', 'STUDY'], ['quiz', 'クイズ', 'QUIZ']] as const).map(([m, jp, en]) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex flex-col items-center rounded-lg border py-2 transition-all ${
                mode === m ? 'border-cyan/50 bg-cyan/10' : 'border-line2 bg-panel hover:border-mute/50'
              }`}
            >
              <span className={`text-sm font-bold ${mode === m ? 'text-cyan' : 'text-mute'}`}>{jp}</span>
              <span className="font-dot text-[9px] tracking-[0.3em] text-mute">{en}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {mode === 'study' ? <StudyView soundOn={soundOn} /> : <QuizView soundOn={soundOn} />}
          </motion.div>
        </AnimatePresence>

        <footer className="mt-10 space-y-1.5 border-t border-line pt-4 text-center">
          <p className="text-[11px] leading-relaxed text-mute">
            本アプリの12誘導波形はベクトル投影モデルによる教育用シミュレーションで、実症例の記録ではありません。
            電気軸・梗塞部位・脚ブロックの「読み方」を学ぶための様式化された波形です。
            実際の判読は記録された12誘導心電図・患者状態・最新ガイドラインに従ってください。
          </p>
          <p className="text-[11px] text-mute">
            参考:{' '}
            <a href="https://new.jhrs.or.jp/recognition/kentei/" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-cyan">
              心電図検定(日本不整脈心電学会)
            </a>
          </p>
        </footer>
      </main>
    </div>
  )
}
