import { useEffect, useState } from 'react'

function two(n: number) {
  return String(n).padStart(2, '0')
}

export default function Header() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const iv = window.setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(iv)
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg2/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-2.5 md:px-6">
        <div className="flex items-center gap-3">
          <svg
            viewBox="0 0 24 24"
            className="animate-pulsebeat h-7 w-7 shrink-0 text-phos drop-shadow-[0_0_6px_rgba(54,255,156,0.8)]"
            aria-hidden="true"
          >
            <path
              d="M12 21s-7.5-4.6-9.7-9C.8 8.9 2.3 5.6 5.4 5c2-.4 3.9.5 4.9 2.1L12 9.6l1.7-2.5c1-1.6 2.9-2.5 4.9-2.1 3.1.6 4.6 3.9 3.1 7-2.2 4.4-9.7 9-9.7 9z"
              fill="currentColor"
              opacity="0.2"
            />
            <path
              d="M2.5 12.2h4l1.7-4.3 2.9 8.4 2-5.6 1 1.5h7.4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="leading-tight">
            <h1 className="text-base font-black tracking-wide md:text-lg">
              心電図トレーナー
              <span className="ml-2 align-middle rounded border border-phos/40 bg-phos/10 px-1.5 py-0.5 text-[10px] font-bold tracking-widest text-phos">
                ICU EDITION
              </span>
            </h1>
            <p className="font-dot text-[10px] tracking-[0.25em] text-mute">
              RHYTHM TRAINER for CRITICAL CARE NURSES
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-4 sm:flex">
          <span className="rounded border border-line2 px-2 py-1 font-dot text-[11px] tracking-widest text-mute">
            BED-01
          </span>
          <div className="text-right font-mono leading-tight">
            <div className="text-sm font-semibold tabular-nums text-ink">
              {two(now.getHours())}:{two(now.getMinutes())}
              <span className="text-mute">:{two(now.getSeconds())}</span>
            </div>
            <div className="text-[10px] tabular-nums text-mute">
              {now.getFullYear()}-{two(now.getMonth() + 1)}-{two(now.getDate())}
            </div>
          </div>
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-mute" aria-hidden="true">
            <path
              d="M12 3a6 6 0 0 0-6 6v3.5L4.3 16a1 1 0 0 0 .9 1.5h13.6a1 1 0 0 0 .9-1.5L18 12.5V9a6 6 0 0 0-6-6zm-2 16a2 2 0 0 0 4 0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </header>
  )
}
