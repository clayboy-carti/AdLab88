'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import {
  brandSchema,
  type BrandFormData,
  parseCommaSeparated,
  parseColors,
} from '@/lib/validations/brand'
import type { Brand, BrandDNA } from '@/types/database'

type Section = 'core' | 'voice' | 'snapshot' | 'visual'
type RescanStep = 'input' | 'scanning' | 'review'

const SECTION_FIELDS: Record<Section, (keyof BrandFormData)[]> = {
  core: ['company_name', 'what_we_do', 'target_audience', 'unique_differentiator', 'sample_copy'],
  voice: ['voice_summary', 'words_to_use', 'words_to_avoid'],
  snapshot: ['personality_traits'],
  visual: ['brand_colors', 'typography_notes'],
}

function toBrandFormData(b: Brand): BrandFormData {
  return {
    company_name: b.company_name,
    what_we_do: b.what_we_do,
    target_audience: b.target_audience,
    unique_differentiator: b.unique_differentiator ?? '',
    voice_summary: b.voice_summary ?? '',
    personality_traits: b.personality_traits?.join(', ') ?? '',
    words_to_use: b.words_to_use?.join(', ') ?? '',
    words_to_avoid: b.words_to_avoid?.join(', ') ?? '',
    sample_copy: b.sample_copy,
    brand_colors: b.brand_colors?.join(', ') ?? '',
    typography_notes: b.typography_notes ?? '',
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function BrandDashboard({ brand: initial }: { brand: Brand }) {
  const [brand, setBrand] = useState(initial)
  const [editingSection, setEditingSection] = useState<Section | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // ── Rescan state ──────────────────────────────────────────────────
  const [rescanOpen, setRescanOpen] = useState(false)
  const [rescanStep, setRescanStep] = useState<RescanStep>('input')
  const [rescanUrl, setRescanUrl] = useState('')
  const [rescanData, setRescanData] = useState<BrandDNA | null>(null)
  const [rescanError, setRescanError] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)

  const supabase = createClient()

  const {
    register,
    watch,
    formState: { errors },
    reset,
    getValues,
    trigger,
  } = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: toBrandFormData(brand),
  })

  const colorsRaw = watch('brand_colors')
  const liveColors = parseColors(colorsRaw) ?? []

  // ── Shared DB save ────────────────────────────────────────────────
  const persistToDB = async (data: BrandFormData) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const parsed = {
      personality_traits: parseCommaSeparated(data.personality_traits),
      words_to_use: parseCommaSeparated(data.words_to_use),
      words_to_avoid: parseCommaSeparated(data.words_to_avoid),
      brand_colors: parseColors(data.brand_colors),
    }

    const now = new Date().toISOString()
    const dbPayload = {
      company_name: data.company_name,
      what_we_do: data.what_we_do,
      target_audience: data.target_audience,
      unique_differentiator: data.unique_differentiator || null,
      voice_summary: data.voice_summary || null,
      personality_traits: parsed.personality_traits ?? null,
      words_to_use: parsed.words_to_use ?? null,
      words_to_avoid: parsed.words_to_avoid ?? null,
      sample_copy: data.sample_copy,
      brand_colors: parsed.brand_colors ?? null,
      typography_notes: data.typography_notes || null,
      updated_at: now,
    }

    const { error: updateError } = await supabase
      .from('brands')
      .update(dbPayload)
      .eq('user_id', user.id)

    if (updateError) throw updateError

    setBrand((prev) => ({
      ...prev,
      company_name: dbPayload.company_name,
      what_we_do: dbPayload.what_we_do,
      target_audience: dbPayload.target_audience,
      unique_differentiator: dbPayload.unique_differentiator ?? undefined,
      voice_summary: dbPayload.voice_summary ?? undefined,
      sample_copy: dbPayload.sample_copy,
      typography_notes: dbPayload.typography_notes ?? undefined,
      updated_at: dbPayload.updated_at,
      personality_traits: parsed.personality_traits ?? prev.personality_traits,
      words_to_use: parsed.words_to_use ?? prev.words_to_use,
      words_to_avoid: parsed.words_to_avoid ?? prev.words_to_avoid,
      brand_colors: parsed.brand_colors ?? prev.brand_colors,
    }))
  }

  // ── Per-section editing ───────────────────────────────────────────
  const startEdit = (section: Section) => {
    setSaveError(null)
    setEditingSection(section)
  }

  const cancelEdit = () => {
    reset(toBrandFormData(brand))
    setSaveError(null)
    setEditingSection(null)
  }

  const saveSection = async (section: Section) => {
    const valid = await trigger(SECTION_FIELDS[section])
    if (!valid) return
    setSaving(true)
    setSaveError(null)
    try {
      await persistToDB(getValues())
      setEditingSection(null)
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // ── Rescan handlers ───────────────────────────────────────────────
  const openRescan = () => {
    setRescanOpen(true)
    setRescanStep('input')
    setRescanData(null)
    setRescanError(null)
  }

  const closeRescan = () => {
    setRescanOpen(false)
    setRescanUrl('')
    setRescanData(null)
    setRescanError(null)
    setRescanStep('input')
  }

  const runRescan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rescanUrl.trim()) return
    setRescanStep('scanning')
    setRescanError(null)
    try {
      const res = await fetch('/api/brand-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: rescanUrl.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Scan failed')
      setRescanData(json.scan as BrandDNA)
      setRescanStep('review')
    } catch (err: any) {
      setRescanError(err.message || 'Scan failed')
      setRescanStep('input')
    }
  }

  const applyRescan = async () => {
    if (!rescanData) return
    setApplying(true)
    try {
      // Merge scanned data over existing brand values (scan wins where it returned data)
      const merged: BrandFormData = {
        company_name: rescanData.company_name ?? brand.company_name,
        what_we_do: rescanData.what_we_do ?? brand.what_we_do,
        target_audience: rescanData.target_audience ?? brand.target_audience,
        unique_differentiator: rescanData.unique_differentiator ?? brand.unique_differentiator ?? '',
        voice_summary: rescanData.voice_summary ?? brand.voice_summary ?? '',
        personality_traits:
          rescanData.personality_traits?.join(', ') ?? brand.personality_traits?.join(', ') ?? '',
        words_to_use: rescanData.words_to_use?.join(', ') ?? brand.words_to_use?.join(', ') ?? '',
        words_to_avoid:
          rescanData.words_to_avoid?.join(', ') ?? brand.words_to_avoid?.join(', ') ?? '',
        sample_copy: rescanData.sample_copy ?? brand.sample_copy,
        brand_colors: rescanData.brand_colors?.join(', ') ?? brand.brand_colors?.join(', ') ?? '',
        typography_notes: rescanData.typography_notes ?? brand.typography_notes ?? '',
      }
      reset(merged)
      await persistToDB(merged)
      closeRescan()
    } catch (err: any) {
      setRescanError(err.message || 'Failed to apply')
    } finally {
      setApplying(false)
    }
  }

  const isEditing = (s: Section) => editingSection === s
  const canEdit = editingSection === null && !rescanOpen

  return (
    <>
      {/* ── PAGE HEADER ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 lg:mb-8">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-mono text-forest uppercase leading-none tracking-tighter">
          {brand.company_name}
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-mono text-graphite/40">
            Last Updated: {formatDate(brand.updated_at)}
          </span>
          {!rescanOpen && (
            <button
              type="button"
              onClick={openRescan}
              className="border border-forest text-forest font-mono text-xs uppercase tracking-widest px-4 py-2 hover:bg-forest hover:text-white transition-colors"
            >
              ↺ Update Brand
            </button>
          )}
        </div>
      </div>

      {saveError && <p className="text-xs text-rust font-mono mb-4">{saveError}</p>}

      {/* ── RESCAN PANEL ──────────────────────────────────────────── */}
      {rescanOpen && (
        <div className="mb-6 border border-forest/30 bg-white rounded-2xl overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-forest/15">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-graphite/40">
                {rescanStep === 'review' ? `Scan results — ${rescanUrl}` : 'Update Brand'}
              </p>
              <p className="text-sm font-mono text-graphite mt-0.5">
                {rescanStep === 'review'
                  ? 'Review what was detected. Applying will overwrite your current brand profile.'
                  : 'Re-scan your website to pull in updated brand data automatically.'}
              </p>
            </div>
            <button
              type="button"
              onClick={closeRescan}
              className="text-graphite/30 hover:text-graphite transition-colors text-xl leading-none px-2"
            >
              ×
            </button>
          </div>

          {/* URL input step */}
          {(rescanStep === 'input' || rescanStep === 'scanning') && (
            <div className="px-4 sm:px-6 py-5 space-y-4">
              <form onSubmit={runRescan} className="flex gap-3">
                <input
                  type="url"
                  value={rescanUrl}
                  onChange={(e) => setRescanUrl(e.target.value)}
                  placeholder="https://yourcompany.com"
                  disabled={rescanStep === 'scanning'}
                  required
                  className="field-input flex-1"
                />
                <button
                  type="submit"
                  disabled={rescanStep === 'scanning' || !rescanUrl.trim()}
                  className="bg-forest text-white font-mono text-xs uppercase tracking-widest px-5 py-2 hover:bg-forest/90 transition-colors disabled:opacity-50 shrink-0"
                >
                  {rescanStep === 'scanning' ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent animate-spin rounded-full" />
                      Scanning…
                    </span>
                  ) : (
                    '[ Scan ]'
                  )}
                </button>
              </form>

              {rescanStep === 'scanning' && (
                <div className="border border-outline/40 bg-[#F3ECDC]/60 px-4 py-3 font-mono text-xs text-graphite/50 space-y-1">
                  <p>&gt; Fetching website content...</p>
                  <p>&gt; Analyzing brand signals...</p>
                  <p>
                    &gt; Extracting brand DNA
                    <span className="animate-pulse">_</span>
                  </p>
                </div>
              )}

              {rescanError && (
                <p className="text-xs font-mono text-rust border border-rust/20 bg-rust/5 px-3 py-2 rounded">
                  {rescanError}
                </p>
              )}
            </div>
          )}

          {/* Review step */}
          {rescanStep === 'review' && rescanData && (
            <div className="px-4 sm:px-6 py-5 space-y-5">
              {/* Compact preview grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Col 1: Core identity fields */}
                <div className="space-y-3">
                  <RescanField label="Company Name" value={rescanData.company_name} />
                  <RescanField label="What We Do" value={rescanData.what_we_do} />
                  <RescanField label="Target Audience" value={rescanData.target_audience} />
                  <RescanField label="Differentiator" value={rescanData.unique_differentiator} />
                </div>

                {/* Col 2: Voice */}
                <div className="space-y-3">
                  <RescanField label="Voice Summary" value={rescanData.voice_summary} italic />
                  {rescanData.personality_traits && rescanData.personality_traits.length > 0 && (
                    <div>
                      <p className="text-xs font-mono uppercase tracking-widest text-graphite/40 mb-1.5">
                        Personality Traits
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {rescanData.personality_traits.map((t) => (
                          <span
                            key={t}
                            className="bg-sage/20 text-forest border border-sage/50 text-xs font-mono px-2 py-0.5 rounded-full capitalize"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {rescanData.words_to_use && rescanData.words_to_use.length > 0 && (
                    <div>
                      <p className="text-xs font-mono uppercase tracking-widest text-graphite/40 mb-1.5">
                        Words to Use
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {rescanData.words_to_use.map((w) => (
                          <span
                            key={w}
                            className="bg-forest text-white text-xs font-mono px-2 py-0.5 rounded-full capitalize"
                          >
                            {w}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {rescanData.words_to_avoid && rescanData.words_to_avoid.length > 0 && (
                    <div>
                      <p className="text-xs font-mono uppercase tracking-widest text-graphite/40 mb-1.5">
                        Words to Avoid
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {rescanData.words_to_avoid.map((w) => (
                          <span
                            key={w}
                            className="bg-rust text-white text-xs font-mono px-2 py-0.5 rounded-full capitalize"
                          >
                            {w}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Col 3: Visual */}
                <div className="space-y-3">
                  {rescanData.brand_colors && rescanData.brand_colors.length > 0 && (
                    <div>
                      <p className="text-xs font-mono uppercase tracking-widest text-graphite/40 mb-1.5">
                        Brand Colors
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {rescanData.brand_colors.map((c) => (
                          <div key={c} className="flex flex-col items-center gap-1">
                            <div
                              style={{ backgroundColor: c }}
                              className="w-8 h-8 rounded border border-outline/20"
                              title={c}
                            />
                            <span className="text-xs font-mono text-graphite/40">{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <RescanField label="Typography" value={rescanData.typography_notes} />
                  <RescanField label="Sample Copy" value={rescanData.sample_copy} italic />
                </div>
              </div>

              {rescanError && (
                <p className="text-xs font-mono text-rust border border-rust/20 bg-rust/5 px-3 py-2 rounded">
                  {rescanError}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1 border-t border-forest/10">
                <button
                  type="button"
                  onClick={() => {
                    setRescanStep('input')
                    setRescanData(null)
                    setRescanError(null)
                  }}
                  className="font-mono text-xs uppercase tracking-widest text-graphite/50 hover:text-graphite px-4 py-2 border border-outline/30 hover:border-outline/60 transition-colors"
                >
                  ← Re-scan
                </button>
                <button
                  type="button"
                  onClick={applyRescan}
                  disabled={applying}
                  className="flex-1 bg-forest text-white font-mono text-xs uppercase tracking-widest py-2 hover:bg-forest/90 transition-colors disabled:opacity-50"
                >
                  {applying ? 'Applying…' : '[ Apply to Brand Profile ]'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── GRID ──────────────────────────────────────────────────── */}
      <div
        className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start"
        style={{ gridTemplateRows: 'auto auto' }}
      >
        {/* ── Core Identity — row-span-2 ── */}
        <div className="card lg:row-span-2 flex flex-col gap-5">
          <CardHeader
            label="Core Identity"
            editing={isEditing('core')}
            canEdit={canEdit}
            saving={saving}
            onEdit={() => startEdit('core')}
            onSave={() => saveSection('core')}
            onCancel={cancelEdit}
          />

          {isEditing('core') ? (
            <>
              <EditField label="Company Name" error={errors.company_name?.message}>
                <input
                  {...register('company_name')}
                  className="field-input text-base font-bold text-forest uppercase"
                />
              </EditField>
              <hr className="border-forest/15" />
              <EditField label="What We Do" error={errors.what_we_do?.message}>
                <textarea
                  {...register('what_we_do')}
                  rows={3}
                  className="field-input resize-none text-sm"
                  placeholder="Describe your products, solutions, and/or services..."
                />
              </EditField>
              <hr className="border-forest/15" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <EditField label="Target Audience" error={errors.target_audience?.message}>
                  <textarea
                    {...register('target_audience')}
                    rows={3}
                    className="field-input resize-none text-sm"
                  />
                </EditField>
                <EditField label="Differentiator">
                  <textarea
                    {...register('unique_differentiator')}
                    rows={3}
                    className="field-input resize-none text-sm"
                  />
                </EditField>
              </div>
              <hr className="border-forest/15" />
              <EditField label="Sample Copy" error={errors.sample_copy?.message}>
                <textarea
                  {...register('sample_copy')}
                  rows={4}
                  className="field-input resize-none text-xs"
                />
              </EditField>
            </>
          ) : (
            <>
              <h2 className="text-3xl sm:text-4xl font-bold font-mono text-forest uppercase leading-none tracking-tight">
                {brand.company_name}
              </h2>
              <hr className="border-forest/15" />
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-graphite/40 mb-2">
                  What We Do
                </p>
                <p className="text-sm font-mono text-graphite leading-relaxed">{brand.what_we_do}</p>
              </div>
              <hr className="border-forest/15" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-graphite/40 mb-2">
                    Target Audience
                  </p>
                  <p className="text-sm font-mono text-graphite leading-relaxed">
                    {brand.target_audience}
                  </p>
                </div>
                {brand.unique_differentiator && (
                  <div>
                    <p className="text-xs font-mono uppercase tracking-widest text-graphite/40 mb-2">
                      Differentiator
                    </p>
                    <p className="text-sm font-mono text-graphite leading-relaxed">
                      {brand.unique_differentiator}
                    </p>
                  </div>
                )}
              </div>
              {brand.sample_copy && (
                <>
                  <hr className="border-forest/15" />
                  <div>
                    <p className="text-xs font-mono uppercase tracking-widest text-graphite/40 mb-2">
                      Sample Copy
                    </p>
                    <p className="text-xs font-mono text-graphite leading-relaxed italic">
                      {brand.sample_copy}
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* ── Voice & Messaging ── */}
        <div className="card flex flex-col gap-5">
          <CardHeader
            label="Voice &amp; Messaging"
            editing={isEditing('voice')}
            canEdit={canEdit}
            saving={saving}
            onEdit={() => startEdit('voice')}
            onSave={() => saveSection('voice')}
            onCancel={cancelEdit}
          />

          {isEditing('voice') ? (
            <>
              <EditField label="Voice Summary">
                <input
                  {...register('voice_summary')}
                  className="field-input text-sm italic text-forest"
                  placeholder="Our voice is..."
                />
              </EditField>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <EditField label="Words to Use">
                  <textarea
                    {...register('words_to_use')}
                    rows={3}
                    className="field-input resize-none text-xs"
                    placeholder="bold, direct, clear..."
                  />
                  <p className="text-xs text-graphite/40 mt-1 font-mono">comma-separated</p>
                </EditField>
                <EditField label="Words to Avoid">
                  <textarea
                    {...register('words_to_avoid')}
                    rows={3}
                    className="field-input resize-none text-xs"
                    placeholder="cheap, basic, easy..."
                  />
                  <p className="text-xs text-graphite/40 mt-1 font-mono">comma-separated</p>
                </EditField>
              </div>
            </>
          ) : (
            <>
              {brand.voice_summary && (
                <p className="text-xl font-mono font-semibold italic text-forest leading-snug">
                  &ldquo;{brand.voice_summary}&rdquo;
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {brand.words_to_use && brand.words_to_use.length > 0 && (
                  <div>
                    <p className="text-xs font-mono uppercase tracking-widest text-graphite/40 mb-2">
                      Words to Use
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {brand.words_to_use.map((w) => (
                        <span
                          key={w}
                          className="bg-forest text-white text-xs font-mono px-2.5 py-1 rounded-full capitalize"
                        >
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {brand.words_to_avoid && brand.words_to_avoid.length > 0 && (
                  <div>
                    <p className="text-xs font-mono uppercase tracking-widest text-graphite/40 mb-2">
                      Words to Avoid
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {brand.words_to_avoid.map((w) => (
                        <span
                          key={w}
                          className="bg-rust text-white text-xs font-mono px-2.5 py-1 rounded-full capitalize"
                        >
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Brand Snapshot ── */}
        <div className="card flex flex-col gap-3">
          <CardHeader
            label="Brand Snapshot"
            editing={isEditing('snapshot')}
            canEdit={canEdit}
            saving={saving}
            onEdit={() => startEdit('snapshot')}
            onSave={() => saveSection('snapshot')}
            onCancel={cancelEdit}
          />

          {isEditing('snapshot') ? (
            <EditField label="Personality Traits">
              <textarea
                {...register('personality_traits')}
                rows={4}
                className="field-input resize-none text-xs"
                placeholder="innovative, bold, direct..."
              />
              <p className="text-xs text-graphite/40 mt-1 font-mono">comma-separated</p>
            </EditField>
          ) : (
            brand.personality_traits && brand.personality_traits.length > 0 && (
              <div className="flex flex-col gap-2 mt-1">
                {brand.personality_traits.map((trait) => (
                  <span
                    key={trait}
                    className="bg-sage/20 text-forest border border-sage/50 text-xs font-mono px-3 py-1.5 rounded-full self-start capitalize"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            )
          )}
        </div>

        {/* ── Visual Identity — col-span-2 ── */}
        <div className="card lg:col-span-2 flex flex-col gap-5">
          <CardHeader
            label="Visual Identity"
            editing={isEditing('visual')}
            canEdit={canEdit}
            saving={saving}
            onEdit={() => startEdit('visual')}
            onSave={() => saveSection('visual')}
            onCancel={cancelEdit}
          />

          {isEditing('visual') ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <EditField label="Brand Colors">
                <div className="flex gap-2 mb-2 flex-wrap min-h-[2rem]">
                  {liveColors.map((c) => (
                    <div
                      key={c}
                      style={{ backgroundColor: c }}
                      className="w-8 h-8 rounded border border-outline/20"
                      title={c}
                    />
                  ))}
                </div>
                <input
                  {...register('brand_colors')}
                  className="field-input text-xs"
                  placeholder="#1F3A32, #B55233, ..."
                />
                <p className="text-xs text-graphite/40 mt-1 font-mono">comma-separated hex codes</p>
              </EditField>
              <EditField label="Typography Notes">
                <textarea
                  {...register('typography_notes')}
                  rows={4}
                  className="field-input resize-none text-xs"
                  placeholder="Font families, weights, usage notes..."
                />
              </EditField>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-graphite/40 mb-3">
                  Brand Colors
                </p>
                {brand.brand_colors && brand.brand_colors.length > 0 ? (
                  <div className="flex gap-4 flex-wrap">
                    {brand.brand_colors.map((color) => (
                      <div key={color} className="flex flex-col items-center gap-1.5">
                        <div
                          style={{ backgroundColor: color }}
                          className="w-12 h-12 rounded border border-outline/10"
                        />
                        <span className="text-xs font-mono text-graphite/40">{color}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-mono text-graphite/40 italic">No colors defined</p>
                )}
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-graphite/40 mb-3">
                  Typography
                </p>
                <p className="text-3xl font-bold font-mono text-graphite/10 leading-none select-none">
                  The quick br
                </p>
                <p className="text-xs font-mono text-graphite/40 mt-1.5">
                  Body copy — regular weight
                </p>
                {brand.typography_notes && (
                  <>
                    <p className="text-xs font-mono uppercase tracking-widest text-graphite/40 mt-4 mb-1">
                      Font Stack
                    </p>
                    <p className="text-xs font-mono text-graphite">{brand.typography_notes}</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Card Header with per-section Edit / Save / Cancel ────────────────────────

function CardHeader({
  label,
  editing,
  canEdit,
  saving,
  onEdit,
  onSave,
  onCancel,
}: {
  label: string
  editing: boolean
  canEdit: boolean
  saving: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="flex items-center justify-between">
      <p
        className="text-xs font-mono uppercase tracking-widest text-graphite/40"
        dangerouslySetInnerHTML={{ __html: label }}
      />
      {editing ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-mono text-graphite/50 hover:text-graphite uppercase tracking-widest px-3 py-1 border border-outline/30 hover:border-outline/60 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="text-xs font-mono text-white bg-forest uppercase tracking-widest px-3 py-1 hover:bg-forest/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      ) : canEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-mono text-graphite/40 hover:text-forest uppercase tracking-widest px-2 py-1 rounded hover:bg-forest/5 transition-colors"
        >
          Edit
        </button>
      ) : null}
    </div>
  )
}

// ─── Edit field wrapper ────────────────────────────────────────────────────────

function EditField({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="text-xs font-mono uppercase tracking-widest text-graphite/50 mb-1.5">{label}</p>
      {children}
      {error && <p className="text-xs text-rust font-mono mt-1">{error}</p>}
    </div>
  )
}

// ─── Rescan preview field ──────────────────────────────────────────────────────

function RescanField({
  label,
  value,
  italic = false,
}: {
  label: string
  value?: string | null
  italic?: boolean
}) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs font-mono uppercase tracking-widest text-graphite/40 mb-1">{label}</p>
      <p className={`text-xs font-mono text-graphite leading-relaxed ${italic ? 'italic' : ''}`}>
        {value}
      </p>
    </div>
  )
}
