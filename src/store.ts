import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CategoryId } from './types'

export type View = 'library' | 'quiz' | 'stats'

export interface QuizPreset {
  categories?: CategoryId[]
  focusIds?: string[]
}

export interface StatEntry {
  attempts: number
  correct: number
}

interface AppState {
  view: View
  selectedId: string
  quizPreset: QuizPreset | null
  stats: Record<string, StatEntry>
  quizzesDone: number
  /** モニター音(QRS同期音+緊急アラーム)。画面間で維持、セッション内のみ */
  soundOn: boolean
  setView: (v: View) => void
  select: (id: string) => void
  setQuizPreset: (p: QuizPreset | null) => void
  recordAnswer: (id: string, ok: boolean) => void
  finishQuiz: () => void
  resetStats: () => void
  toggleSound: () => void
}

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      view: 'library',
      selectedId: 'nsr',
      quizPreset: null,
      stats: {},
      quizzesDone: 0,
      soundOn: true,
      setView: (view) => set({ view }),
      toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),
      select: (selectedId) => set({ selectedId, view: 'library' }),
      setQuizPreset: (quizPreset) => set({ quizPreset }),
      recordAnswer: (id, ok) =>
        set((s) => {
          const e = s.stats[id] ?? { attempts: 0, correct: 0 }
          return {
            stats: {
              ...s.stats,
              [id]: { attempts: e.attempts + 1, correct: e.correct + (ok ? 1 : 0) },
            },
          }
        }),
      finishQuiz: () => set((s) => ({ quizzesDone: s.quizzesDone + 1 })),
      resetStats: () => set({ stats: {}, quizzesDone: 0 }),
    }),
    {
      name: 'ecg-trainer-icu-v1',
      partialize: (s) => ({ stats: s.stats, quizzesDone: s.quizzesDone }),
    },
  ),
)
