'use client'

import { useState, useRef } from 'react'
import type { ReverseEngineerResult } from '@/lib/ai/reverse-engineer'

export default function ReverseEngineerPanel() {
  const [imageUrl, setImageUrl] = useState('')
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<ReverseEngineerResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload-library-image', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Upload failed')
      // Get a signed URL for the uploaded image
      setUploadedUrl(json.signedUrl ?? json.url ?? null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const activeUrl = uploadedUrl || imageUrl.trim()

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault()
    if (!activeUrl) return
    setAnalyzing(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/prompt/reverse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: activeUrl }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Analysis failed')
      setResult(json)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  function copy(text: string, idx: number) {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Input */}
      <div className="card space-y-4">
        <p className="text-xs font-mono uppercase tracking-widest text-graphite/40">
          Winning Ad Image
        </p>

        {/* Upload option */}
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="btn-secondary text-xs disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : '↑ Upload Image'}
          </button>
          {uploadedUrl && (
            <div className="mt-3 rounded-xl overflow-hidden border border-forest/10 max-w-xs">
              <img src={uploadedUrl} alt="Uploaded" className="w-full object-cover" />
            </div>
          )}
        </div>

        {/* Or paste URL */}
        {!uploadedUrl && (
          <div>
            <p className="text-xs font-mono text-graphite/40 mb-1.5">or paste a URL</p>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/winning-ad.jpg"
              className="field-input w-full text-sm"
            />
          </div>
        )}

        {uploadedUrl && (
          <button
            type="button"
            onClick={() => { setUploadedUrl(null); setResult(null) }}
            className="text-xs font-mono text-graphite/40 hover:text-rust transition-colors"
          >
            × Clear image
          </button>
        )}

        {error && (
          <p className="text-xs font-mono text-rust border border-rust/20 bg-rust/5 px-3 py-2 rounded">
            {error}
          </p>
        )}

        <form onSubmit={handleAnalyze}>
          <button
            type="submit"
            disabled={analyzing || !activeUrl}
            className="btn-primary w-full disabled:opacity-50"
          >
            {analyzing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                Analyzing…
              </span>
            ) : (
              '🔍 Reverse Engineer'
            )}
          </button>
        </form>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Style Prompt */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-mono uppercase tracking-widest text-graphite/40">
                Style Prompt
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => copy(result.stylePrompt, 0)}
                  className="font-mono text-xs text-forest hover:text-forest/70 border border-forest/30 px-3 py-1 rounded-lg transition-colors"
                >
                  {copiedIdx === 0 ? '✓ Copied' : 'Copy'}
                </button>
                <a
                  href="/create/ad"
                  className="font-mono text-xs text-white bg-forest px-3 py-1 rounded-lg hover:bg-forest/90 transition-colors"
                >
                  Use in Generator →
                </a>
              </div>
            </div>
            <div className="bg-paper/60 border border-forest/10 rounded-xl p-4">
              <p className="font-mono text-xs text-graphite leading-relaxed whitespace-pre-wrap">
                {result.stylePrompt}
              </p>
            </div>
          </div>

          {/* Copy Skeleton */}
          {result.copySkeleton && (
            <div className="card">
              <p className="text-xs font-mono uppercase tracking-widest text-graphite/40 mb-2">
                Copy Formula
              </p>
              <p className="font-mono text-sm text-forest font-semibold italic">
                {result.copySkeleton}
              </p>
            </div>
          )}

          {/* Variants */}
          {result.variants.length > 0 && (
            <div className="card space-y-3">
              <p className="text-xs font-mono uppercase tracking-widest text-graphite/40">
                Variant Prompts
              </p>
              {result.variants.map((variant, i) => (
                <div key={i} className="bg-paper/60 border border-forest/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-forest/60 bg-white border border-forest/20 rounded-full px-2 py-0.5">
                      Variant {i + 1}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => copy(variant, i + 1)}
                        className="font-mono text-xs text-forest hover:text-forest/70 border border-forest/30 px-2 py-0.5 rounded-lg transition-colors"
                      >
                        {copiedIdx === i + 1 ? '✓' : 'Copy'}
                      </button>
                      <a
                        href="/create/ad"
                        className="font-mono text-xs text-rust hover:text-rust/70 transition-colors"
                      >
                        Use →
                      </a>
                    </div>
                  </div>
                  <p className="font-mono text-xs text-graphite leading-relaxed">{variant}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
