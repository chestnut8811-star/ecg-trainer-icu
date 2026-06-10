import { AnimatePresence, motion } from 'motion/react'
import Header from './components/Header'
import SoftKeyNav from './components/SoftKeyNav'
import LibraryView from './views/LibraryView'
import QuizView from './views/QuizView'
import StatsView from './views/StatsView'
import { useApp } from './store'

export default function App() {
  const view = useApp((s) => s.view)
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-3 pt-4 pb-32 md:px-6 md:pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {view === 'library' ? <LibraryView /> : view === 'quiz' ? <QuizView /> : <StatsView />}
          </motion.div>
        </AnimatePresence>

        <footer className="mt-10 space-y-1.5 border-t border-line pt-4 text-center">
          <p className="text-[11px] leading-relaxed text-mute">
            本アプリは教育目的の波形シミュレーションです。実際の臨床判断は12誘導心電図・患者状態・
            施設のプロトコル・最新ガイドライン(JRC蘇生ガイドライン等)に従ってください。
          </p>
          <p className="text-[11px] text-mute">
            参考:{' '}
            <a
              href="https://new.jhrs.or.jp/recognition/kentei/"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-phos"
            >
              心電図検定(日本不整脈心電学会)
            </a>
            {' ・ '}
            <a
              href="https://www.jrc-cpr.org/jrc-guideline-2025/"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-phos"
            >
              JRC蘇生ガイドライン2025
            </a>
          </p>
        </footer>
      </main>
      <SoftKeyNav />
    </div>
  )
}
