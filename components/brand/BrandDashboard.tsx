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

export default function BrandDashboard({ brand: initial }: { brand: Brand }) {
  const [brand] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: toBrandFormData(brand),
  })

  const colorsRaw = watch('brand_colors')
  const traitsRaw = watch('personality_traits')
  const liveColors = parseColors(colorsRaw) ?? []
  const liveTraits = parseCommaSeparated(traitsRaw) ?? []

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
        updated_at: new Date().toISOString(),
      }

      const { error: updateError } = await supabase
        .from('brands')
        .update(dbPayload)
        .eq('user_id', user.id)

      if (updateError) throw updateError

      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  })

  const shortId = brand.id.slice(0, 8).toUpperCase()

  return (
    <form onSubmit={onSave} className="flex flex-col gap-6">

      {/* ── COMPANY PROFILE ────────────────────────────────────── */}
      <ConfigBlock label="Company Profile">
        <div className="grid grid-cols-3 border border-outline">

          {/* Row 1 */}
          <div className="col-span-2 p-3 border-r border-outline">
            <FieldLabel>Company Name</FieldLabel>
            <input {...register('company_name')} className="config-input" />
            {errors.company_name && (
              <p className="text-xs text-rust font-mono mt-1">{errors.company_name.message}</p>
            )}
          </div>
          <div className="p-3">
            <FieldLabel>ID</FieldLabel>
            <input
              value={shortId}
              readOnly
              className="config-input opacity-50 cursor-default"
            />
          </div>

          {/* Row 2 */}
          <div className="p-3 border-t border-r border-outline">
            <FieldLabel>Industry</FieldLabel>
            <input {...register('what_we_do')} className="config-input" placeholder="What your business does" />
            {errors.what_we_do && (
              <p className="text-xs text-rust font-mono mt-1">{errors.what_we_do.message}</p>
            )}
          </div>
          <div className="col-span-2 p-3 border-t border-outline">
            <FieldLabel>Audience</FieldLabel>
            <input {...register('target_audience')} className="config-input" placeholder="Who you're targeting" />
            {errors.target_audience && (
              <p className="text-xs text-rust font-mono mt-1">{errors.target_audience.message}</p>
            )}
          </div>

          {/* Row 3 */}
          <div className="col-span-3 p-3 border-t border-outline">
            <FieldLabel>Differentiator</FieldLabel>
            <input
              {...register('unique_differentiator')}
              className="config-input"
              placeholder="What sets you apart"
            />
          </div>

        </div>
      </ConfigBlock>

      {/* ── BRAND VARIABLES ────────────────────────────────────── */}
      <ConfigBlock label="Brand Variables">
        <div className="grid grid-cols-3 border border-outline">

          {/* Color Palette */}
          <div className="p-4 border-r border-outline">
            <FieldLabel>Color Palette</FieldLabel>
            <div className="flex gap-2 mt-3 mb-3 flex-wrap min-h-[36px]">
              {liveColors.length > 0
                ? liveColors.map((c) => (
                    <div
                      key={c}
                      style={{ backgroundColor: c }}
                      className="w-9 h-9 border border-outline/30"
                      title={c}
                    />
                  ))
                : <div className="w-9 h-9 border border-dashed border-outline/40 bg-paper" />}
            </div>
            <input
              {...register('brand_colors')}
              className="config-input text-xs"
              placeholder="#001717, #B55233"
            />
          </div>

          {/* Post / Voice Summary */}
          <div className="p-4 border-r border-outline flex flex-col">
            <FieldLabel>Post</FieldLabel>
            <textarea
              {...register('voice_summary')}
              rows={5}
              className="config-input text-xs flex-1 resize-none mt-2"
              placeholder="Describe your brand voice..."
            />
          </div>

          {/* Voice Traits */}
          <div className="p-4 flex flex-col">
            <FieldLabel>Voice Traits</FieldLabel>
            <div className="flex flex-col gap-1 mt-3 mb-3 min-h-[36px]">
              {liveTraits.map((t) => (
                <span
                  key={t}
                  className="text-xs font-mono uppercase border border-outline px-2 py-1 self-start tracking-wide"
                >
                  {t}
                </span>
              ))}
            </div>
            <input
              {...register('personality_traits')}
              className="config-input text-xs mt-auto"
              placeholder="bold, trustworthy, direct"
            />
          </div>

        </div>
      </ConfigBlock>

      {/* ── SAMPLE COPY INPUT ──────────────────────────────────── */}
      <ConfigBlock label="Sample Copy Input">
        <div className="border border-outline">
          <textarea
            {...register('sample_copy')}
            rows={7}
            className="config-input w-full resize-none p-3"
            placeholder="Paste sample copy that represents your brand voice..."
          />
        </div>
        {errors.sample_copy && (
          <p className="text-xs text-rust font-mono mt-1">{errors.sample_copy.message}</p>
        )}
      </ConfigBlock>

      {/* ── SAVE ───────────────────────────────────────────────── */}
      {saveError && (
        <p className="text-xs text-rust font-mono -mt-2">{saveError}</p>
      )}
      <button
        type="submit"
        disabled={saving}
        className="w-full bg-forest text-white font-mono uppercase text-xs tracking-widest py-3 border border-forest hover:bg-forest/90 transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : saved ? '[ Saved ]' : '[ Save Configuration ]'}
      </button>

    </form>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ConfigBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-2">{label}</p>
      {children}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-mono uppercase tracking-widest text-gray-400">{children}</p>
  )
}
