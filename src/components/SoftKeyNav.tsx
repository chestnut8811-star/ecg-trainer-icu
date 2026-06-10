import { useApp, type View } from '../store'

const KEYS: { view: View; jp: string; en: string; icon: string }[] = [
  { view: 'library', jp: '波形ライブラリ', en: 'LIBRARY', icon: 'M3 12h3l2-5 3 10 2.5-7 1.5 2h6' },
  { view: 'quiz', jp: 'クイズ', en: 'QUIZ', icon: 'M9 9a3 3 0 1 1 4.4 2.6c-.9.5-1.4 1-1.4 2.4m0 3v.1' },
  { view: 'stats', jp: '成績・苦手', en: 'RECORD', icon: 'M5 20V10m7 10V4m7 16v-7' },
]

/** 実機モニターの下部ソフトキーを模したナビゲーション */
export default function SoftKeyNav() {
  const view = useApp((s) => s.view)
  const setView = useApp((s) => s.setView)
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg2/92 backdrop-blur-md">
      <div className="mx-auto grid max-w-6xl grid-cols-3 gap-2 px-3 py-2 md:px-6">
        {KEYS.map((k) => {
          const active = view === k.view
          return (
            <button
              key={k.view}
              type="button"
              onClick={() => setView(k.view)}
              aria-current={active ? 'page' : undefined}
              className={`group flex flex-col items-center gap-0.5 rounded-lg border px-2 py-1.5 transition-all ${
                active
                  ? 'border-phos/50 bg-phos/10 shadow-[0_0_18px_rgba(54,255,156,0.15)]'
                  : 'border-line2/60 bg-panel hover:border-mute/50 hover:bg-panel2'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <svg
                  viewBox="0 0 24 24"
                  className={`h-4 w-4 ${active ? 'text-phos' : 'text-mute group-hover:text-ink'}`}
                  aria-hidden="true"
                >
                  <path
                    d={k.icon}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span
                  className={`text-sm font-bold ${active ? 'text-ink' : 'text-mute group-hover:text-ink'}`}
                >
                  {k.jp}
                </span>
              </span>
              <span
                className={`font-dot text-[9px] tracking-[0.3em] ${
                  active ? 'text-phos/80' : 'text-mute/60'
                }`}
              >
                {k.en}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
