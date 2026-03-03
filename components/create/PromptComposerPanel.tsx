'use client'

import { useState, useEffect } from 'react'
import type { BrandIntelligence, BrandAsset } from '@/types/database'

type AssetWithUrl = BrandAsset & { url: string | null }

export default function PromptComposerPanel() {
  const [profiles, setProfiles] = useState<BrandIntelligence[]>([])
  const [assets, setAssets] = useState<AssetWithUrl[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const [selectedProfileId, setSelectedProfileId] = useState<string>('')
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([])
  const [campaignGoal, setCampaignGoal] = useState('')

  const [composing, setComposing] = useState(false)
  const [result, setResult] = useState<{ prompt: string; rationale: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/brand/intelligence').then((r) => r.json()),
      fetch('/api/brand/assets').then((r) => r.json()),
    ]).then(([intelData, assetData]) => {
      setProfiles(intelData.profiles ?? [])
      setAssets(assetData.assets ?? [])
    }).catch((err) => setError(err.message))
    .finally(() => setLoadingData(false))
  }, [])

  async function handleCompose(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProfileId || !campaignGoal.trim()) return
    setComposing(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/prompt/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intelligence_id: selectedProfileId,
          asset_ids: selectedAssetIds,
          campaign_goal: campaignGoal.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Composition failed')
      setResult(json)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setComposing(false)
    }
  }

  function copyPrompt() {
    if (!result?.prompt) return
    navigator.clipboard.writeText(result.prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function toggleAsset(id: string) {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {error && (
        <p className="text-xs font-mono text-rust border border-rust/20 bg-rust/5 px-3 py-2 rounded">
          {error}
        </p>
      )}

      <form onSubmit={handleCompose} className="space-y-5">

        {/* Step 1: Select Intelligence Profile */}
        <div className="card">
          <p className="text-xs font-mono uppercase tracking-widest text-graphite/40 mb-3">
            1 — Select Intelligence Profile
          </p>
          {loadingData ? (
            <div className="h-20 bg-forest/5 rounded-xl animate-pulse" />
          ) : profiles.length === 0 ? (
            <div className="py-4 text-center border border-dashed border-forest/20 rounded-xl">
              <p className="font-mono text-xs text-graphite/40 mb-2">No intelligence profiles yet</p>
              <a href="/brand" className="font-mono text-xs text-rust hover:underline">
                Generate profiles in Brand → Intelligence →
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProfileId(p.id)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    selectedProfileId === p.id
                      ? 'border-forest bg-forest/5'
                      : 'border-forest/20 hover:border-forest/50'
                  }`}
                >
                  <p className="font-mono text-xs font-semibold text-graphite line-clamp-2 mb-1">
                    {p.angle ?? 'Untitled angle'}
                  </p>
                  <p className="font-mono text-[10px] text-graphite/50 line-clamp-2">
                    {p.persona ?? 'No persona defined'}
                  </p>
                  {p.emotion && (
                    <span className="inline-block mt-1.5 font-mono text-[9px] uppercase tracking-widest text-forest/60 bg-paper border border-forest/20 rounded-full px-2 py-0.5">
                      {p.emotion}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Pick Brand Assets (optional) */}
        <div className="card">
          <p className="text-xs font-mono uppercase tracking-widest text-graphite/40 mb-3">
            2 — Pick Brand Assets <span className="text-graphite/25 normal-case tracking-normal">(optional)</span>
          </p>
          {loadingData ? (
            <div className="h-16 bg-forest/5 rounded-xl animate-pulse" />
          ) : assets.length === 0 ? (
            <p className="font-mono text-xs text-graphite/40 italic">
              No assets uploaded yet.{' '}
              <a href="/brand" className="text-rust hover:underline">Upload in Brand → Assets →</a>
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => toggleAsset(asset.id)}
                  className={`relative w-16 h-16 rounded-xl border-2 overflow-hidden transition-all ${
                    selectedAssetIds.includes(asset.id)
                      ? 'border-forest shadow-md'
                      : 'border-transparent hover:border-forest/40'
                  }`}
                >
                  {asset.url && (
                    <img src={asset.url} alt={asset.file_name} className="w-full h-full object-cover" />
                  )}
                  {selectedAssetIds.includes(asset.id) && (
                    <div className="absolute inset-0 bg-forest/20 flex items-center justify-center">
                      <span className="text-white text-lg">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Step 3: Campaign Goal */}
        <div className="card">
          <p className="text-xs font-mono uppercase tracking-widest text-graphite/40 mb-3">
            3 — Campaign Goal
          </p>
          <textarea
            value={campaignGoal}
            onChange={(e) => setCampaignGoal(e.target.value)}
            rows={3}
            placeholder="e.g. Drive trial sign-ups for our new summer collection, targeting eco-conscious millennials"
            required
            className="field-input resize-none w-full text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={composing || !selectedProfileId || !campaignGoal.trim()}
          className="btn-primary w-full disabled:opacity-50"
        >
          {composing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
              Composing Prompt…
            </span>
          ) : (
            '⚡ Compose Prompt'
          )}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono uppercase tracking-widest text-graphite/40">
              Composed Prompt
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyPrompt}
                className="font-mono text-xs text-forest hover:text-forest/70 border border-forest/30 px-3 py-1 rounded-lg transition-colors"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
              <a
                href="/create/ad"
                className="font-mono text-xs text-white bg-forest px-3 py-1 rounded-lg hover:bg-forest/90 transition-colors"
              >
                Open Ad Generator →
              </a>
            </div>
          </div>

          <div className="bg-paper/60 border border-forest/10 rounded-xl p-4">
            <p className="font-mono text-xs text-graphite leading-relaxed whitespace-pre-wrap">
              {result.prompt}
            </p>
          </div>

          {result.rationale && (
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-graphite/40 mb-1">
                Rationale
              </p>
              <p className="font-mono text-xs text-graphite/60 leading-relaxed italic">
                {result.rationale}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
