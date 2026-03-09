'use client'

import { useState, useEffect } from 'react'
import type { BrandIntelligence, BrandAsset } from '@/types/database'
import CampaignResultsGrid from './CampaignResultsGrid'

type AssetWithUrl = BrandAsset & { url: string | null }

interface CampaignResult {
  intelligenceId: string
  persona: string
  angle: string
  status: 'pending' | 'success' | 'failed'
  adId: string | null
  generatedImageUrl: string | null
  error: string | null
}

type Step = 1 | 2 | 3 | 4 | 5

export default function CampaignBuilder() {
  const [step, setStep] = useState<Step>(1)

  // Step 1 — Brief
  const [name, setName] = useState('')
  const [brief, setBrief] = useState('')

  // Step 2 — Intelligence profiles
  const [profiles, setProfiles] = useState<BrandIntelligence[]>([])
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(false)

  // Step 3 — Assets (optional)
  const [assets, setAssets] = useState<AssetWithUrl[]>([])
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([])
  const [loadingAssets, setLoadingAssets] = useState(false)
  const [showAssetPicker, setShowAssetPicker] = useState(false)

  // Step 4 — Goal
  const [campaignGoal, setCampaignGoal] = useState('')

  // Step 5 — Generate
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [planning, setPlanning] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [results, setResults] = useState<CampaignResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (step === 2 && profiles.length === 0) {
      setLoadingProfiles(true)
      fetch('/api/brand/intelligence')
        .then((r) => r.json())
        .then((data) => setProfiles(data.profiles ?? []))
        .catch((err) => setError(err.message))
        .finally(() => setLoadingProfiles(false))
    }
    if (step === 3 && assets.length === 0) {
      setLoadingAssets(true)
      fetch('/api/brand/assets')
        .then((r) => r.json())
        .then((data) => setAssets(data.assets ?? []))
        .catch((err) => setError(err.message))
        .finally(() => setLoadingAssets(false))
    }
  }, [step])

  function toggleProfile(id: string) {
    setSelectedProfileIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  function toggleAsset(id: string) {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  async function handlePlanAndGenerate() {
    if (!name.trim() || selectedProfileIds.length === 0 || !campaignGoal.trim()) return
    setError(null)
    setPlanning(true)
    try {
      // Step 1: Create plan
      const planRes = await fetch('/api/campaign/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          brief: brief.trim() || undefined,
          intelligence_ids: selectedProfileIds,
          asset_ids: selectedAssetIds.length > 0 ? selectedAssetIds : undefined,
          campaign_goal: campaignGoal.trim(),
        }),
      })
      const planJson = await planRes.json()
      if (!planRes.ok) throw new Error(planJson.error || 'Failed to create plan')

      const newCampaignId = planJson.campaign.id
      setCampaignId(newCampaignId)
      setPlanning(false)
      setGenerating(true)

      // Step 2: Generate
      const genRes = await fetch('/api/campaign/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: newCampaignId }),
      })
      const genJson = await genRes.json()
      if (!genRes.ok) throw new Error(genJson.error || 'Generation failed')

      setResults(genJson.results)
      setStep(5)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPlanning(false)
      setGenerating(false)
    }
  }

  const STEPS = ['Brief', 'Profiles', 'Assets', 'Goal & Generate', 'Results']

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((label, i) => {
          const s = (i + 1) as Step
          const isActive = step === s
          const isDone = step > s
          return (
            <div key={label} className="flex items-center gap-1">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border font-mono text-[10px] uppercase tracking-widest transition-colors ${
                isActive
                  ? 'bg-forest text-white border-forest'
                  : isDone
                    ? 'bg-forest/10 text-forest border-forest/20'
                    : 'bg-paper text-graphite/30 border-forest/10'
              }`}>
                <span>{s}</span>
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-4 h-px ${isDone ? 'bg-forest/40' : 'bg-forest/10'}`} />
              )}
            </div>
          )
        })}
      </div>

      {error && (
        <p className="text-xs font-mono text-rust border border-rust/20 bg-rust/5 px-3 py-2 rounded">
          {error}
        </p>
      )}

      {/* Step 1: Brief */}
      {step === 1 && (
        <div className="card space-y-4">
          <p className="text-xs font-mono uppercase tracking-widest text-graphite/40">
            Campaign Brief
          </p>
          <div className="space-y-3">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-graphite/40 mb-1 block">
                Campaign Name <span className="text-rust">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Summer Sale 2025"
                autoFocus
                className="field-input w-full text-sm"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-graphite/40 mb-1 block">
                Brief <span className="text-graphite/25 normal-case tracking-normal">(optional)</span>
              </label>
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                rows={3}
                placeholder="Any additional context about this campaign..."
                className="field-input resize-none w-full text-sm"
              />
            </div>
          </div>
          <button
            type="button"
            disabled={!name.trim()}
            onClick={() => setStep(2)}
            className="btn-primary disabled:opacity-50"
          >
            Next: Select Profiles →
          </button>
        </div>
      )}

      {/* Step 2: Intelligence Profiles */}
      {step === 2 && (
        <div className="card space-y-4">
          <p className="text-xs font-mono uppercase tracking-widest text-graphite/40">
            Select Intelligence Profiles
          </p>
          <p className="font-mono text-[10px] text-graphite/50">
            Each profile generates one ad. Select 2–5 for best results.
          </p>
          {loadingProfiles ? (
            <div className="h-32 bg-forest/5 rounded-xl animate-pulse" />
          ) : profiles.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-forest/20 rounded-xl">
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
                  onClick={() => toggleProfile(p.id)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    selectedProfileIds.includes(p.id)
                      ? 'border-forest bg-forest/5'
                      : 'border-forest/20 hover:border-forest/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-mono text-xs font-semibold text-graphite line-clamp-1">
                      {p.angle ?? 'Untitled angle'}
                    </p>
                    {selectedProfileIds.includes(p.id) && (
                      <span className="text-forest font-mono text-xs shrink-0">✓</span>
                    )}
                  </div>
                  <p className="font-mono text-[10px] text-graphite/50 line-clamp-2 mt-0.5">
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
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(1)} className="btn-secondary">
              ← Back
            </button>
            <button
              type="button"
              disabled={selectedProfileIds.length === 0}
              onClick={() => setStep(3)}
              className="btn-primary disabled:opacity-50"
            >
              Next: Pick Assets →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Assets (optional) */}
      {step === 3 && (
        <div className="card space-y-4">
          <p className="text-xs font-mono uppercase tracking-widest text-graphite/40">
            Brand Assets <span className="text-graphite/25 normal-case tracking-normal">(optional)</span>
          </p>
          <p className="font-mono text-[10px] text-graphite/50">
            Selected assets will be distributed across your campaign ads.
          </p>

          {/* Select button */}
          {loadingAssets ? (
            <div className="h-10 bg-forest/5 rounded-xl animate-pulse" />
          ) : (
            <button
              type="button"
              onClick={() => setShowAssetPicker(true)}
              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg border border-forest/30 text-forest/70 hover:border-forest hover:text-forest transition-colors"
            >
              <span>+ Select Assets</span>
              {selectedAssetIds.length > 0 && (
                <span className="bg-forest text-white rounded-full px-1.5 py-0.5 text-[9px]">
                  {selectedAssetIds.length}
                </span>
              )}
            </button>
          )}

          {/* Selected asset thumbnails */}
          {selectedAssetIds.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {selectedAssetIds.map((id) => {
                const asset = assets.find((a) => a.id === id)
                if (!asset) return null
                return (
                  <div key={id} className="relative w-20 h-20 rounded-xl overflow-hidden border border-forest/30 shadow-sm group">
                    {asset.url && (
                      <img src={asset.url} alt={asset.file_name} className="w-full h-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => toggleAsset(id)}
                      className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center"
                      title="Remove"
                    >
                      <span className="text-white text-base opacity-0 group-hover:opacity-100 transition-opacity">✕</span>
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(2)} className="btn-secondary">
              ← Back
            </button>
            <button type="button" onClick={() => setStep(4)} className="btn-primary">
              Next: Campaign Goal →
            </button>
          </div>
        </div>
      )}

      {/* Asset picker modal */}
      {showAssetPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAssetPicker(false) }}
        >
          <div className="bg-white rounded-2xl border border-forest/50 shadow-lg w-full max-w-lg flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-forest/15 shrink-0">
              <h2 className="font-mono text-xs uppercase tracking-widest text-forest/70">
                Brand Asset Library
              </h2>
              <button
                onClick={() => setShowAssetPicker(false)}
                className="text-graphite/40 hover:text-graphite transition-colors text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-graphite/40">
                  {assets.length === 0 ? 'No assets saved' : `${assets.length} asset${assets.length !== 1 ? 's' : ''} · ${selectedAssetIds.length} selected`}
                </span>
                {selectedAssetIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedAssetIds([])}
                    className="font-mono text-[10px] uppercase tracking-widest text-graphite/40 hover:text-rust transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
              {assets.length === 0 ? (
                <div className="border border-dashed border-forest/20 rounded-xl py-10 text-center">
                  <p className="font-mono text-xs text-graphite/40">
                    No brand assets yet.{' '}
                    <a href="/brand" className="text-rust hover:underline">Upload in Brand → Assets</a>
                  </p>
                </div>
              ) : (
                <>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-graphite/40">
                    Click assets to select · click again to deselect
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {assets.map((asset) => {
                      const selected = selectedAssetIds.includes(asset.id)
                      return (
                        <button
                          key={asset.id}
                          type="button"
                          onClick={() => toggleAsset(asset.id)}
                          className={`relative aspect-square rounded-xl border-2 overflow-hidden transition-all ${
                            selected
                              ? 'border-forest shadow-md'
                              : 'border-forest/15 hover:border-forest/50'
                          }`}
                          title={asset.file_name}
                        >
                          {asset.url && (
                            <img src={asset.url} alt={asset.file_name} className="w-full h-full object-cover" />
                          )}
                          {selected && (
                            <div className="absolute inset-0 bg-forest/25 flex items-center justify-center">
                              <span className="text-white text-xl font-bold drop-shadow">✓</span>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
            <div className="px-6 py-4 border-t border-forest/10 shrink-0">
              <button
                type="button"
                onClick={() => setShowAssetPicker(false)}
                className="btn-primary w-full"
              >
                Done · {selectedAssetIds.length} selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Goal & Generate */}
      {step === 4 && (
        <div className="card space-y-4">
          <p className="text-xs font-mono uppercase tracking-widest text-graphite/40">
            Campaign Goal
          </p>

          {/* Plan preview */}
          <div className="bg-paper/60 border border-forest/10 rounded-xl p-3 space-y-1">
            <p className="font-mono text-[10px] uppercase tracking-widest text-graphite/40 mb-2">
              Plan Preview — {selectedProfileIds.length} ad{selectedProfileIds.length !== 1 ? 's' : ''}
            </p>
            {profiles
              .filter((p) => selectedProfileIds.includes(p.id))
              .map((p, i) => (
                <div key={p.id} className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-graphite/40 w-4">{i + 1}.</span>
                  <span className="font-mono text-[10px] text-graphite">{p.angle ?? 'Untitled'}</span>
                  {selectedAssetIds[i % selectedAssetIds.length] && (
                    <span className="font-mono text-[9px] text-forest/50">+ asset</span>
                  )}
                </div>
              ))}
          </div>

          <textarea
            value={campaignGoal}
            onChange={(e) => setCampaignGoal(e.target.value)}
            rows={3}
            placeholder="e.g. Drive trial sign-ups for our new summer collection, targeting eco-conscious millennials"
            autoFocus
            className="field-input resize-none w-full text-sm"
          />

          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(3)} className="btn-secondary">
              ← Back
            </button>
            <button
              type="button"
              disabled={!campaignGoal.trim() || planning || generating}
              onClick={handlePlanAndGenerate}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {planning ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                  Creating Plan…
                </span>
              ) : generating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                  Generating {selectedProfileIds.length} Ads…
                </span>
              ) : (
                `🚀 Generate ${selectedProfileIds.length} Ad${selectedProfileIds.length !== 1 ? 's' : ''}`
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Results */}
      {step === 5 && results && (
        <div className="space-y-4">
          <CampaignResultsGrid
            results={results}
            succeeded={results.filter((r) => r.status === 'success').length}
            total={results.length}
          />
          <button
            type="button"
            onClick={() => {
              setStep(1)
              setName('')
              setBrief('')
              setSelectedProfileIds([])
              setSelectedAssetIds([])
              setCampaignGoal('')
              setCampaignId(null)
              setResults(null)
              setError(null)
            }}
            className="btn-secondary w-full"
          >
            Start New Campaign
          </button>
        </div>
      )}
    </div>
  )
}
