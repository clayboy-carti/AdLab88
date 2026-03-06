'use client'

import { useState, useEffect } from 'react'
import type { BrandDNA } from '@/types/database'

const SCAN_LINES = [
  'BRAND SCAN INITIATED',
  'FETCHING WEBSITE CONTENT',
  'PARSING STRUCTURE & METADATA',
  'ANALYZING BRAND SIGNALS',
  'DETECTING COLOR PALETTE',
  'EXTRACTING VOICE & TONE',
  'BUILDING BRAND PROFILE',
]

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

interface BrandURLInputProps {
  onScanComplete: (data: BrandDNA) => void
}

export default function BrandURLInput({ onScanComplete }: BrandURLInputProps) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focused, setFocused] = useState(false)
  const [scannerLines, setScannerLines] = useState<string[]>([])
  const [scannerDone, setScannerDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError(null)
    setScannerLines([])
    setScannerDone(false)

    try {
      const res = await fetch('/api/brand-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Scan failed')
      }

      setScannerDone(true)
      await sleep(800)
      onScanComplete(json.scan as BrandDNA)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  // Typewriter effect: runs whenever loading flips to true
  useEffect(() => {
    if (!loading) return

    let cancelled = false
    const revealed: string[] = []

    const run = async () => {
      for (let li = 0; li < SCAN_LINES.length && !cancelled; li++) {
        const line = SCAN_LINES[li]
        let chars = ''
        for (let ci = 0; ci < line.length && !cancelled; ci++) {
          chars += line[ci]
          setScannerLines([...revealed, `> ${chars}█`])
          await sleep(28)
        }
        if (!cancelled) {
          revealed.push(`> ${line}`)
          setScannerLines([...revealed])
          await sleep(380)
        }
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [loading])

  return (
    <>
      {/* ── Idea 1: Full-screen dramatic scan overlay ── */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-paper/96 backdrop-blur-sm">
          <div className="w-full max-w-lg px-4">
            {/* Header */}
            <div className="mb-8 text-center animate-fade-in-up">
              <p className="text-xs font-mono uppercase tracking-widest text-rust mb-2">
                Brand Intelligence
              </p>
              <h2 className="text-2xl font-mono font-bold text-graphite uppercase tracking-wide">
                Scanning Brand DNA
              </h2>
              <p className="text-xs font-mono text-gray-400 mt-2 truncate">{url}</p>
            </div>

            {/* Terminal window */}
            <div
              className="border border-forest/30 bg-graphite rounded-xl overflow-hidden shadow-2xl animate-fade-in-up"
              style={{ animationDelay: '100ms' }}
            >
              {/* Title bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-black/20">
                <div className="w-3 h-3 rounded-full bg-rust/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
                <div className="w-3 h-3 rounded-full bg-forest/70" />
                <span className="ml-3 text-white/30 font-mono text-xs tracking-widest">
                  adlab — brand-scan
                </span>
              </div>

              {/* Scanner output */}
              <div className="p-5 min-h-[200px] font-mono text-sm">
                <div className="space-y-1.5">
                  {scannerLines.map((line, i) => {
                    const isLast = i === scannerLines.length - 1
                    return (
                      <p
                        key={i}
                        className={isLast ? 'text-green-400' : 'text-green-400/55'}
                      >
                        {line}
                      </p>
                    )
                  })}
                  {scannerDone && (
                    <p className="text-rust font-bold mt-4 animate-fade-in">
                      {'> BRAND DNA EXTRACTED ✓'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div
              className="mt-4 h-1 bg-forest/20 rounded-full overflow-hidden animate-fade-in-up"
              style={{ animationDelay: '200ms' }}
            >
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  scannerDone ? 'w-full bg-forest' : 'bg-rust animate-scan-progress'
                }`}
              />
            </div>

            <p
              className="text-center text-xs font-mono text-gray-400 mt-3 animate-fade-in-up"
              style={{ animationDelay: '300ms' }}
            >
              This may take 15–30 seconds
            </p>
          </div>
        </div>
      )}

      {/* ── Normal form (always rendered; overlay covers it during scan) ── */}
      <div className="space-y-6">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">
            Auto-detect
          </p>
          <h2 className="text-xl font-mono font-bold text-graphite uppercase">
            Scan Your Website
          </h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Paste your website URL and we&apos;ll extract your brand identity automatically. You
            can review and edit everything before saving.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs uppercase font-mono tracking-widest mb-2 text-gray-600">
              Website URL
            </label>
            {/* Idea 8: breathing ring wrapper */}
            <div
              className={`rounded transition-all duration-300 ${
                !focused && !loading ? 'animate-breathe-ring' : ''
              }`}
            >
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="https://yourcompany.com"
                className="w-full border border-gray-400 rounded px-3 py-2 focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/20 transition-all duration-200"
                disabled={loading}
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-xs font-mono text-red-600 border border-red-200 bg-red-50 px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="btn-primary w-full disabled:opacity-50"
          >
            [ SCAN WEBSITE ]
          </button>
        </form>
      </div>
    </>
  )
}
