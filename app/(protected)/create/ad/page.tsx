'use client'

import { emitCreditsUpdated } from '@/lib/credits-event'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import BatchResultsGrid, { type BatchAdResult } from '@/components/create/BatchResultsGrid'
import type { BrandAsset } from '@/types/database'

export const dynamic = 'force-dynamic'

interface AssetWithUrl extends BrandAsset {
  signedUrl: string
}

// Style reference is upload-only — stored in reference_images, we only track the id locally
interface StyleRef {
  id: string
  fileName: string
  previewUrl: string
}

export default function AdPage() {
  // ── Inputs ──────────────────────────────────────────────────────────
  const [contextText, setContextText] = useState('')
  const [imageQuality, setImageQuality] = useState<'1K' | '2K'>('1K')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [creativity, setCreativity] = useState(2)
  const [title, setTitle] = useState('')

  // ── Style reference (upload-only) ───────────────────────────────────
  const [styleRef, setStyleRef] = useState<StyleRef | null>(null)
  const [uploadingStyle, setUploadingStyle] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // ── Product asset (from brand assets) ───────────────────────────────
  const [assets, setAssets] = useState<AssetWithUrl[]>([])
  const [loadingAssets, setLoadingAssets] = useState(true)
  const [productId, setProductId] = useState<string | null>(null)

  // ── Generation ──────────────────────────────────────────────────────
  const [generating, setGenerating] = useState(false)
  const [generationStage, setGenerationStage] = useState('')
  const [generatedBatch, setGeneratedBatch] = useState<BatchAdResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // ── Load brand assets ───────────────────────────────────────────────
  useEffect(() => {
    loadAssets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadAssets() {
    setLoadingAssets(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('brand_assets')
      .select('id, user_id, storage_path, file_name, file_size, mime_type, category, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data && data.length > 0) {
      const { data: urlData } = await supabase.storage
        .from('brand-assets')
        .createSignedUrls(data.map((a) => a.storage_path), 604800)
      const urlMap = new Map((urlData ?? []).map((u) => [u.path, u.signedUrl]))
      setAssets(data.map((asset) => ({ ...asset, signedUrl: urlMap.get(asset.storage_path) ?? '' })))
    }
    setLoadingAssets(false)
  }

  // ── Upload style reference ───────────────────────────────────────────
  async function handleStyleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    setUploadingStyle(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload-image', { method: 'POST', body: formData })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Upload failed')

      const newId = result.image?.id ?? result.id
      const previewUrl = result.image?.signedUrl ?? result.signedUrl ?? ''
      if (newId) {
        setStyleRef({ id: newId, fileName: file.name, previewUrl })
      }
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed')
    } finally {
      setUploadingStyle(false)
      e.target.value = ''
    }
  }

  // ── Generate ────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    setGeneratedBatch(null)
    setGenerationStage('Loading brand profiles...')

    const t1 = setTimeout(() => setGenerationStage('Analyzing reference ad style...'), 3000)
    const t2 = setTimeout(() => setGenerationStage('Building persona-driven prompts...'), 10000)
    const t3 = setTimeout(() => setGenerationStage('Generating images in parallel...'), 18000)
    const t4 = setTimeout(() => setGenerationStage('Saving to library...'), 70000)
    const t5 = setTimeout(() => setGenerationStage('Almost done...'), 95000)
    const clearAll = () => [t1, t2, t3, t4, t5].forEach(clearTimeout)

    try {
      const res = await fetch('/api/generate-persona-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          style_reference_image_id: styleRef?.id,
          product_asset_id: productId,
          user_context: contextText.trim() || undefined,
          image_quality: imageQuality,
          aspect_ratio: aspectRatio,
          creativity,
          title: title.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')

      clearAll()
      setGeneratedBatch(data.ads)
      emitCreditsUpdated()
      setGenerationStage(`Done — ${data.succeeded}/${data.total} generated!`)
    } catch (err: any) {
      clearAll()
      setError(err.message || 'Generation failed')
      setGenerationStage('')
    } finally {
      setGenerating(false)
    }
  }

  const canGenerate = !generating && !!styleRef && !!productId && !!title.trim()

  return (
    <div className="w-full p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <Link
            href="/create"
            className="font-mono text-xs text-gray-400 uppercase tracking-widest hover:text-rust transition-colors"
          >
            ← The Lab Bench
          </Link>
          <h1 className="text-3xl font-mono header-accent mt-1">Ad Generation</h1>
          <p className="font-mono text-xs text-gray-400 mt-1">
            Upload a reference ad + select your product — generates one variation per persona profile.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">

        {/* ── LEFT COLUMN ── */}
        <div className="flex flex-col gap-3">

          {/* Post Title */}
          <div className="border border-outline">
            <div className="px-4 py-1.5 border-b border-outline bg-[#e4dcc8] flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-widest">Post Title</span>
              <span className="font-mono text-[10px] text-rust uppercase tracking-widest">Required</span>
            </div>
            <div className="p-3 bg-white">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Summer Sale — Persona Set"
                maxLength={80}
                className="w-full text-sm font-mono bg-transparent focus:outline-none placeholder:text-gray-300"
              />
            </div>
          </div>

          {/* ── Style Reference (upload-only) ── */}
          <div className="border border-outline">
            <div className="bg-[#e4dcc8] border-b border-outline px-4 py-1.5 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest">Style Reference</span>
                <span className="font-mono text-[10px] text-gray-500 ml-3">The ad to style after</span>
              </div>
              <span className="font-mono text-[10px] text-rust uppercase tracking-widest">Required</span>
            </div>
            <div className="p-4 bg-white">
              {styleRef ? (
                <div className="flex items-start gap-3">
                  {styleRef.previewUrl && (
                    <img
                      src={styleRef.previewUrl}
                      alt={styleRef.fileName}
                      className="w-20 h-20 object-cover border border-outline flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-rust uppercase tracking-widest mb-0.5">✓ Uploaded</p>
                    <p className="font-mono text-[10px] text-gray-500 truncate">{styleRef.fileName}</p>
                    <button
                      onClick={() => setStyleRef(null)}
                      className="mt-2 font-mono text-[10px] text-gray-400 hover:text-rust uppercase tracking-widest border border-outline px-2 py-1 hover:border-rust transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed border-outline p-6 cursor-pointer hover:border-rust hover:bg-rust/5 transition-colors ${uploadingStyle ? 'opacity-60 pointer-events-none' : ''}`}>
                  <span className="font-mono text-xs text-gray-400 text-center">
                    {uploadingStyle ? 'Uploading…' : 'Drop an ad image here or click to upload'}
                  </span>
                  <span className="font-mono text-[10px] text-gray-300">JPEG or PNG</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={handleStyleUpload}
                    disabled={uploadingStyle}
                  />
                </label>
              )}
            </div>
          </div>

          {/* ── Product Asset (from brand assets) ── */}
          <div className="border border-outline">
            <div className="bg-[#e4dcc8] border-b border-outline px-4 py-1.5 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest">Product Asset</span>
                <span className="font-mono text-[10px] text-gray-500 ml-3">From your brand assets</span>
              </div>
              <div className="flex items-center gap-3">
                {productId && (
                  <button
                    onClick={() => setProductId(null)}
                    className="font-mono text-[10px] text-gray-400 hover:text-rust uppercase tracking-widest"
                  >
                    clear
                  </button>
                )}
                <Link
                  href="/brand"
                  className="font-mono text-[10px] text-gray-400 hover:text-forest uppercase tracking-widest"
                >
                  + Add assets →
                </Link>
                <span className="font-mono text-[10px] text-rust uppercase tracking-widest">Required</span>
              </div>
            </div>
            <div className="p-4 bg-white">
              {loadingAssets ? (
                <div className="h-20 bg-gray-50 animate-pulse" />
              ) : assets.length === 0 ? (
                <div className="text-center py-4">
                  <p className="font-mono text-[10px] text-gray-400 mb-2">No brand assets found.</p>
                  <Link href="/brand" className="font-mono text-[10px] uppercase tracking-widest text-forest hover:underline">
                    Go to Brand → Assets to upload your products
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-1.5">
                  {assets.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => setProductId(asset.id === productId ? null : asset.id)}
                      title={asset.file_name}
                      className={`relative aspect-square border-2 overflow-hidden transition-all ${
                        productId === asset.id
                          ? 'border-forest scale-[0.97]'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img src={asset.signedUrl} alt={asset.file_name} className="w-full h-full object-cover" />
                      {productId === asset.id && (
                        <div className="absolute inset-0 bg-forest/20 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {productId && (
                <p className="font-mono text-[10px] text-forest uppercase tracking-widest mt-2">
                  ✓ {assets.find((a) => a.id === productId)?.file_name}
                </p>
              )}
            </div>
          </div>

          {uploadError && (
            <p className="font-mono text-xs text-rust border border-rust/20 bg-rust/5 px-3 py-2">{uploadError}</p>
          )}

          {/* Ad Context */}
          <div className="border border-outline">
            <div className="px-4 py-1.5 border-b border-outline bg-white">
              <span className="font-mono text-xs text-gray-400 tracking-wider">— CONTEXT BRIEF —</span>
            </div>
            <div className="p-4 bg-white">
              <textarea
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                placeholder="e.g. 10% off first order · Free shipping · Summer sale"
                rows={2}
                maxLength={300}
                className="w-full text-sm font-mono bg-transparent resize-none focus:outline-none placeholder:text-gray-300"
              />
              <div className="text-right mt-1">
                <span className="font-mono text-xs text-gray-400">{contextText.length} / 300</span>
              </div>
            </div>
          </div>

          {/* Image Settings */}
          <div className="border border-outline bg-white">
            <div className="px-4 py-1.5 border-b border-outline">
              <span className="font-mono text-xs text-gray-400 tracking-wider">— IMAGE SETTINGS —</span>
            </div>

            {/* Quality */}
            <div className="flex items-center border-b border-outline">
              <div className="w-32 shrink-0 px-4 py-2.5 border-r border-outline">
                <span className="font-mono text-xs uppercase text-gray-500">Quality</span>
              </div>
              <div className="px-4 py-2 flex gap-2">
                {(['1K', '2K'] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => setImageQuality(q)}
                    className={`font-mono text-xs uppercase px-3 py-1 border transition-colors ${
                      imageQuality === q
                        ? 'border-rust text-rust'
                        : 'border-outline text-gray-400 hover:border-gray-400'
                    }`}
                  >
                    [ {q} ]
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="flex items-center border-b border-outline">
              <div className="w-32 shrink-0 px-4 py-2.5 border-r border-outline">
                <span className="font-mono text-xs uppercase text-gray-500">Aspect Ratio</span>
              </div>
              <div className="px-4 py-1.5 flex-1">
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full font-mono text-xs bg-transparent focus:outline-none border-none p-0 text-gray-700"
                >
                  <option value="1:1">1:1 — Square</option>
                  <option value="4:5">4:5 — Feed Portrait</option>
                  <option value="4:3">4:3 — Standard</option>
                  <option value="3:4">3:4 — Portrait</option>
                  <option value="16:9">16:9 — Landscape</option>
                  <option value="9:16">9:16 — Story / Reel</option>
                </select>
              </div>
            </div>

            {/* Creativity */}
            <div className="flex items-start">
              <div className="w-32 shrink-0 px-4 py-3 border-r border-outline self-stretch">
                <span className="font-mono text-xs uppercase text-gray-500">Creativity</span>
              </div>
              <div className="px-4 pt-2.5 pb-3 flex-1">
                <div className="flex justify-between mb-1.5">
                  {(['Strict', 'Balanced', 'Creative', 'Loose'] as const).map((label, i) => (
                    <span
                      key={label}
                      className={`font-mono text-xs transition-colors ${
                        creativity === i + 1 ? 'text-rust font-bold' : 'text-gray-300'
                      }`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <input
                  type="range"
                  min={1}
                  max={4}
                  step={1}
                  value={creativity}
                  onChange={(e) => setCreativity(Number(e.target.value))}
                  className="w-full accent-rust cursor-pointer"
                />
                <div className="flex justify-between mt-1.5">
                  <span className="font-mono text-xs text-gray-400">Closely follows style</span>
                  <span className="font-mono text-xs text-gray-400">Freely reimagined</span>
                </div>
              </div>
            </div>
          </div>

          {/* Validation hints */}
          {!styleRef && (
            <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
              ↑ Upload a style reference ad to continue
            </p>
          )}
          {styleRef && !productId && (
            <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
              ↑ Select a product asset to continue
            </p>
          )}

          {/* Generate */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {generating ? 'GENERATING PERSONA BATCH...' : 'GENERATE PERSONA BATCH'}
          </button>

          {error && (
            <div className="border border-red-300 bg-red-50 p-3">
              <p className="font-mono text-xs uppercase text-red-700 mb-1">Error</p>
              <p className="font-mono text-xs text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="font-mono text-xs uppercase tracking-widest text-gray-500">
              [ LIVE OUTPUT ENGINE ]
            </p>
            <span className="font-mono text-xs border border-rust text-rust px-2 py-0.5">
              [ MODEL: READY ]
            </span>
          </div>

          <div className="border border-outline flex flex-col">
            <div className="bg-[#e4dcc8] border-b border-outline px-4 py-2">
              <span className="font-mono text-xs uppercase tracking-widest">Generated Preview</span>
            </div>

            <div className="flex-1 min-h-[480px] relative bg-white">

              {/* Loading */}
              {generating && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center p-8"
                  style={{
                    backgroundImage: 'radial-gradient(circle, #d4cbb8 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                >
                  <div className="bg-white border border-outline p-6 text-center w-full max-w-xs">
                    <div className="animate-spin h-6 w-6 border-2 border-rust border-t-transparent mx-auto mb-4" />
                    <p className="font-mono text-xs text-gray-600 mb-4">{generationStage}</p>
                    <div className="space-y-1.5 text-left">
                      <p className="font-mono text-xs text-gray-500">✓ Brand profiles loaded</p>
                      <p className="font-mono text-xs text-rust animate-pulse">→ Reverse-engineering style reference...</p>
                      <p className="font-mono text-xs text-gray-300">→ Generating per-persona images...</p>
                      <p className="font-mono text-xs text-gray-300">→ Saving to library...</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Batch results */}
              {!generating && generatedBatch && (
                <BatchResultsGrid
                  ads={generatedBatch}
                  succeeded={generatedBatch.filter((a) => !a.imageGenerationFailed).length}
                  onReset={() => { setGeneratedBatch(null); setError(null) }}
                />
              )}

              {/* Empty state */}
              {!generating && !generatedBatch && !error && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                  style={{
                    backgroundImage: 'radial-gradient(circle, #d4cbb8 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                >
                  <p className="font-mono text-xs text-gray-500 text-center leading-relaxed">
                    Awaiting input.<br />
                    <span className="text-gray-400">
                      Upload style ref + select product, then generate.
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Status bar */}
            <div className="border-t border-outline px-4 py-2 bg-[#e4dcc8]">
              <span className="font-mono text-xs text-gray-500 tracking-wider">
                FORMAT: {aspectRatio}&nbsp;&nbsp;|&nbsp;&nbsp;QUALITY: {imageQuality}&nbsp;&nbsp;|&nbsp;&nbsp;CREATIVITY: {['', 'STRICT', 'BALANCED', 'CREATIVE', 'LOOSE'][creativity]}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
