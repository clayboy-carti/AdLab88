'use client'

import { useState } from 'react'
import type { BrandDNA } from '@/types/database'

interface BrandURLInputProps {
  onScanComplete: (data: BrandDNA) => void
}

export default function BrandURLInput({ onScanComplete }: BrandURLInputProps) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError(null)

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

      onScanComplete(json.scan as BrandDNA)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">
          Auto-detect
        </p>
        <h2 className="text-xl font-mono font-bold text-graphite uppercase">
          Scan Your Website
        </h2>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          Paste your website URL and we&apos;ll extract your brand identity automatically. You can review and edit everything before saving.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block text-xs uppercase font-mono tracking-widest mb-2 text-gray-600">
            Website URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://yourcompany.com"
            className="w-full"
            disabled={loading}
            required
          />
        </div>

        {error && (
          <p className="text-xs font-mono text-red-600 border border-red-200 bg-red-50 px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="btn-primary w-full"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent animate-spin" />
              Scanning...
            </span>
          ) : (
            '[ SCAN WEBSITE ]'
          )}
        </button>
      </form>

      {loading && (
        <div className="border border-outline p-4 bg-paper font-mono text-xs text-gray-400 space-y-1">
          <p>&gt; Fetching website content...</p>
          <p>&gt; Analyzing brand signals...</p>
          <p>&gt; Extracting brand DNA<span className="animate-pulse">_</span></p>
        </div>
      )}
    </div>
  )
}
