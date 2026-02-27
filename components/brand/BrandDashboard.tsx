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
import type { Brand } from '@/types/database'

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
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: toBrandFormData(brand),
  })

  const colorsRaw = watch('brand_colors')
  const liveColors = parseColors(colorsRaw) ?? []

  const onSave = handleSubmit(async (data) => {
    setSaving(true)
    setSaveError(null)
    try {
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
      setIsEditing(false)
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  })

  const handleCancel = () => {
    reset(toBrandFormData(brand))
    setSaveError(null)
    setIsEditing(false)
  }

  return (
    <>
      {/* ── PAGE HEADER ───────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-6xl font-bold font-sans text-forest uppercase leading-none tracking-tighter">
            {brand.company_name}
          </h1>
          <p className="text-sm text-graphite/60 mt-2 font-sans">{brand.what_we_do}</p>
        </div>
        <div className="flex items-center gap-4 pt-2 shrink-0">
          <span className="text-xs font-mono text-graphite/40">
            Last Updated: {formatDate(brand.updated_at)}
          </span>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="border border-forest text-forest font-mono text-xs uppercase tracking-widest px-4 py-2 hover:bg-forest hover:text-white transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        /* ── EDIT MODE ──────────────────────────────────────────── */
        <form onSubmit={onSave} className="flex flex-col gap-6">
          <div
            className="grid grid-cols-3 gap-4 items-start"
            style={{ gridTemplateRows: 'auto auto' }}
          >
            {/* Core Identity — spans 2 rows */}
            <div className="card row-span-2 flex flex-col gap-5">
              <p className="text-xs font-mono uppercase tracking-widest text-graphite/40">
                Core Identity
              </p>
              <div>
                <FieldLabel>Company Name</FieldLabel>
                <input
                  {...register('company_name')}
                  className="config-input text-lg font-bold text-forest uppercase border-b border-outline/20 pb-1 mt-1"
                />
                {errors.company_name && (
                  <p className="text-xs text-rust font-mono mt-1">{errors.company_name.message}</p>
                )}
              </div>
              <hr className="border-forest/15" />
              <div>
                <FieldLabel>What We Do</FieldLabel>
                <textarea
                  {...register('what_we_do')}
                  rows={3}
                  className="config-input resize-none text-sm mt-1"
                />
                {errors.what_we_do && (
                  <p className="text-xs text-rust font-mono mt-1">{errors.what_we_do.message}</p>
                )}
              </div>
              <hr className="border-forest/15" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Target Audience</FieldLabel>
                  <textarea
                    {...register('target_audience')}
                    rows={3}
                    className="config-input resize-none text-sm mt-1"
                  />
                  {errors.target_audience && (
                    <p className="text-xs text-rust font-mono mt-1">
                      {errors.target_audience.message}
                    </p>
                  )}
                </div>
                <div>
                  <FieldLabel>Differentiator</FieldLabel>
                  <textarea
                    {...register('unique_differentiator')}
                    rows={3}
                    className="config-input resize-none text-sm mt-1"
                  />
                </div>
              </div>
              <hr className="border-forest/15" />
              <div>
                <FieldLabel>Sample Copy</FieldLabel>
                <textarea
                  {...register('sample_copy')}
                  rows={4}
                  className="config-input resize-none text-xs mt-1"
                />
                {errors.sample_copy && (
                  <p className="text-xs text-rust font-mono mt-1">{errors.sample_copy.message}</p>
                )}
              </div>
            </div>

            {/* Voice & Messaging */}
            <div className="card flex flex-col gap-5">
              <p className="text-xs font-mono uppercase tracking-widest text-graphite/40">
                Voice &amp; Messaging
              </p>
              <div>
                <FieldLabel>Voice Summary</FieldLabel>
                <input
                  {...register('voice_summary')}
                  className="config-input border-b border-outline/20 pb-1 text-sm italic text-forest mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Words to Use</FieldLabel>
                  <input
                    {...register('words_to_use')}
                    className="config-input text-xs mt-1"
                    placeholder="bold, direct, ..."
                  />
                  <p className="text-xs text-graphite/40 mt-1 font-mono">comma-separated</p>
                </div>
                <div>
                  <FieldLabel>Words to Avoid</FieldLabel>
                  <input
                    {...register('words_to_avoid')}
                    className="config-input text-xs mt-1"
                    placeholder="cheap, basic, ..."
                  />
                  <p className="text-xs text-graphite/40 mt-1 font-mono">comma-separated</p>
                </div>
              </div>
            </div>

            {/* Brand Snapshot */}
            <div className="card flex flex-col gap-5">
              <p className="text-xs font-mono uppercase tracking-widest text-graphite/40">
                Brand Snapshot
              </p>
              <div>
                <FieldLabel>Personality Traits</FieldLabel>
                <input
                  {...register('personality_traits')}
                  className="config-input text-xs mt-1"
                  placeholder="innovative, bold, ..."
                />
                <p className="text-xs text-graphite/40 mt-1 font-mono">comma-separated</p>
              </div>
            </div>

            {/* Visual Identity — spans 2 cols */}
            <div className="card col-span-2 flex flex-col gap-5">
              <p className="text-xs font-mono uppercase tracking-widest text-graphite/40">
                Visual Identity
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <FieldLabel>Brand Colors</FieldLabel>
                  <div className="flex gap-2 mt-2 mb-2 flex-wrap min-h-[2rem]">
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
                    className="config-input text-xs"
                    placeholder="#1F3A32, #B55233"
                  />
                  <p className="text-xs text-graphite/40 mt-1 font-mono">comma-separated hex codes</p>
                </div>
                <div>
                  <FieldLabel>Typography Notes</FieldLabel>
                  <textarea
                    {...register('typography_notes')}
                    rows={3}
                    className="config-input resize-none text-xs mt-1"
                    placeholder="Font families, weights, usage notes..."
                  />
                </div>
              </div>
            </div>
          </div>

          {saveError && <p className="text-xs text-rust font-mono">{saveError}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 border border-outline/30 text-graphite font-mono text-xs uppercase tracking-widest py-3 hover:border-outline/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-forest text-white font-mono text-xs uppercase tracking-widest py-3 hover:bg-forest/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : '[ Save Changes ]'}
            </button>
          </div>
        </form>
      ) : (
        /* ── VIEW MODE ──────────────────────────────────────────── */
        <div
          className="grid grid-cols-3 gap-4 items-start"
          style={{ gridTemplateRows: 'auto auto' }}
        >
          {/* Core Identity — spans 2 rows */}
          <div className="card row-span-2 flex flex-col gap-5">
            <p className="text-xs font-mono uppercase tracking-widest text-graphite/40">
              Core Identity
            </p>
            <div>
              <h2 className="text-4xl font-bold font-sans text-forest uppercase leading-none tracking-tight">
                {brand.company_name}
              </h2>
              {brand.what_we_do && (
                <p className="text-sm text-graphite/60 mt-1.5 font-sans">{brand.what_we_do}</p>
              )}
            </div>
            <hr className="border-forest/15" />
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-graphite/40 mb-2">
                What We Do
              </p>
              <p className="text-sm font-sans text-graphite leading-relaxed">{brand.what_we_do}</p>
            </div>
            <hr className="border-forest/15" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-graphite/40 mb-2">
                  Target Audience
                </p>
                <p className="text-sm font-sans text-graphite leading-relaxed">
                  {brand.target_audience}
                </p>
              </div>
              {brand.unique_differentiator && (
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-graphite/40 mb-2">
                    Differentiator
                  </p>
                  <p className="text-sm font-sans text-graphite leading-relaxed">
                    {brand.unique_differentiator}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Voice & Messaging */}
          <div className="card flex flex-col gap-5">
            <p className="text-xs font-mono uppercase tracking-widest text-graphite/40">
              Voice &amp; Messaging
            </p>
            {brand.voice_summary && (
              <p className="text-xl font-sans font-semibold italic text-forest leading-snug">
                &ldquo;{brand.voice_summary}&rdquo;
              </p>
            )}
            <div className="grid grid-cols-2 gap-4">
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
          </div>

          {/* Brand Snapshot */}
          <div className="card flex flex-col gap-3">
            <p className="text-xs font-mono uppercase tracking-widest text-graphite/40">
              Brand Snapshot
            </p>
            {brand.personality_traits && brand.personality_traits.length > 0 && (
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
            )}
          </div>

          {/* Visual Identity — spans 2 cols */}
          <div className="card col-span-2 flex flex-col gap-5">
            <p className="text-xs font-mono uppercase tracking-widest text-graphite/40">
              Visual Identity
            </p>
            <div className="grid grid-cols-2 gap-6">
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
                  <p className="text-xs font-sans text-graphite/40 italic">No colors defined</p>
                )}
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-graphite/40 mb-3">
                  Typography
                </p>
                <p className="text-3xl font-bold font-sans text-graphite/10 leading-none select-none">
                  The quick br
                </p>
                <p className="text-xs font-sans text-graphite/40 mt-1.5">
                  Body copy — regular weight
                </p>
                {brand.typography_notes && (
                  <>
                    <p className="text-xs font-mono uppercase tracking-widest text-graphite/40 mt-4 mb-1">
                      Font Stack
                    </p>
                    <p className="text-xs font-sans text-graphite">{brand.typography_notes}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-mono uppercase tracking-widest text-graphite/40">{children}</p>
  )
}
