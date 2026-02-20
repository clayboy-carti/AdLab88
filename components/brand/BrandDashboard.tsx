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

type Section = 'core' | 'voice' | 'visual' | 'copy'

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
  const [brand, setBrand] = useState(initial)
  const [editingSection, setEditingSection] = useState<Section | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: toBrandFormData(brand),
  })

  const handleEdit = (section: Section) => {
    reset(toBrandFormData(brand))
    setSaveError(null)
    setEditingSection(section)
  }

  const handleCancel = () => {
    setEditingSection(null)
    setSaveError(null)
  }

  const onSave = handleSubmit(async (data) => {
    setSaving(true)
    setSaveError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
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

      setBrand((prev) => ({
        ...prev,
        company_name: data.company_name,
        what_we_do: data.what_we_do,
        target_audience: data.target_audience,
        unique_differentiator: data.unique_differentiator || undefined,
        voice_summary: data.voice_summary || undefined,
        personality_traits: parsed.personality_traits,
        words_to_use: parsed.words_to_use,
        words_to_avoid: parsed.words_to_avoid,
        sample_copy: data.sample_copy,
        brand_colors: parsed.brand_colors,
        typography_notes: data.typography_notes || undefined,
        updated_at: dbPayload.updated_at,
      }))

      setEditingSection(null)
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  })

  const isEditing = editingSection !== null

  return (
    <form onSubmit={onSave} className="flex flex-col gap-0 border border-outline">

      {/* ── CORE IDENTITY ──────────────────────────────────────── */}
      <Section
        id="core"
        label="01 — Core Identity"
        editing={editingSection === 'core'}
        disableEdit={isEditing}
        onEdit={() => handleEdit('core')}
        onCancel={handleCancel}
        saving={saving}
        error={editingSection === 'core' ? saveError : null}
      >
        {editingSection === 'core' ? (
          <div className="space-y-4">
            <FormField label="Company Name" required error={errors.company_name?.message}>
              <input {...register('company_name')} className="w-full" />
            </FormField>
            <FormField label="What We Do" hint="1–2 sentences about your business" required error={errors.what_we_do?.message}>
              <textarea {...register('what_we_do')} rows={3} className="w-full" />
            </FormField>
            <FormField label="Target Audience" required error={errors.target_audience?.message}>
              <input {...register('target_audience')} className="w-full" placeholder="e.g., Small business owners, B2B marketers" />
            </FormField>
            <FormField label="Unique Differentiator" hint="What makes you different?">
              <input {...register('unique_differentiator')} className="w-full" placeholder="Optional" />
            </FormField>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left: main fields */}
            <div className="flex-1 flex flex-col gap-6">
              <div>
                <FieldLabel>Company Name</FieldLabel>
                <p className="text-2xl font-mono font-bold text-graphite mt-1 leading-tight">
                  {brand.company_name}
                </p>
              </div>
              <div>
                <FieldLabel>What We Do</FieldLabel>
                <p className="text-sm text-graphite mt-1 leading-relaxed">{brand.what_we_do}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <FieldLabel>Target Audience</FieldLabel>
                  <p className="text-sm text-graphite mt-1">{brand.target_audience}</p>
                </div>
                {brand.unique_differentiator && (
                  <div>
                    <FieldLabel>Differentiator</FieldLabel>
                    <p className="text-sm text-graphite mt-1">{brand.unique_differentiator}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: brand snapshot */}
            {brand.personality_traits?.length ? (
              <div className="md:w-52 flex-shrink-0">
                <div className="border border-outline p-4 bg-paper h-full">
                  <p className="text-xs font-mono uppercase tracking-widest text-rust mb-3">
                    Brand Snapshot
                  </p>
                  <div className="border-t border-outline mb-3" />
                  <ul className="space-y-1">
                    {brand.personality_traits.map((trait) => (
                      <li key={trait} className="text-sm font-mono text-graphite capitalize">
                        {trait}.
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Section>

      {/* ── VOICE & MESSAGING ──────────────────────────────────── */}
      <Section
        id="voice"
        label="02 — Voice & Messaging"
        editing={editingSection === 'voice'}
        disableEdit={isEditing}
        onEdit={() => handleEdit('voice')}
        onCancel={handleCancel}
        saving={saving}
        error={editingSection === 'voice' ? saveError : null}
      >
        {editingSection === 'voice' ? (
          <div className="space-y-4">
            <FormField label="Voice Summary" hint="How should your brand sound?">
              <textarea {...register('voice_summary')} rows={3} className="w-full" placeholder="e.g., Professional yet approachable, witty and bold" />
            </FormField>
            <FormField label="Personality Traits" hint="Comma-separated, max 5">
              <input {...register('personality_traits')} className="w-full" placeholder="e.g., professional, witty, bold" />
            </FormField>
            <FormField label="Words to Use" hint="Comma-separated">
              <input {...register('words_to_use')} className="w-full" placeholder="e.g., innovative, results-driven" />
            </FormField>
            <FormField label="Words to Avoid" hint="Comma-separated">
              <input {...register('words_to_avoid')} className="w-full" placeholder="e.g., synergy, leverage, disrupt" />
            </FormField>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {brand.voice_summary && (
              <div className="flex gap-4">
                <div className="w-1 bg-rust flex-shrink-0" />
                <p className="text-base font-mono text-graphite italic leading-relaxed">
                  &ldquo;{brand.voice_summary}&rdquo;
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-outline">
              <div className="p-4 md:border-r border-outline">
                <FieldLabel>
                  <span className="text-forest">&#10003;</span> Words to Use
                </FieldLabel>
                {brand.words_to_use?.length ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {brand.words_to_use.map((w) => (
                      <span key={w} className="text-xs font-mono uppercase bg-forest text-white px-2 py-1">
                        {w}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-mono text-gray-400 italic mt-2">Not set</p>
                )}
              </div>
              <div className="p-4">
                <FieldLabel>
                  <span className="text-rust">&#215;</span> Words to Avoid
                </FieldLabel>
                {brand.words_to_avoid?.length ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {brand.words_to_avoid.map((w) => (
                      <span key={w} className="text-xs font-mono uppercase bg-rust text-white px-2 py-1">
                        {w}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-mono text-gray-400 italic mt-2">Not set</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* ── VISUAL IDENTITY ────────────────────────────────────── */}
      <Section
        id="visual"
        label="03 — Visual Identity"
        editing={editingSection === 'visual'}
        disableEdit={isEditing}
        onEdit={() => handleEdit('visual')}
        onCancel={handleCancel}
        saving={saving}
        error={editingSection === 'visual' ? saveError : null}
      >
        {editingSection === 'visual' ? (
          <div className="space-y-4">
            <FormField label="Brand Colors" hint="6-digit hex codes, comma-separated (e.g., #FF5733, #33FF57)">
              <input {...register('brand_colors')} className="w-full" placeholder="#FF5733, #33FF57" />
            </FormField>
            <FormField label="Typography Notes" hint="Fonts, weights, styles you prefer">
              <textarea {...register('typography_notes')} rows={3} className="w-full" placeholder="e.g., Sans-serif, bold headlines, clean and modern" />
            </FormField>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8">
            {/* Colors */}
            <div className="flex-1">
              <FieldLabel>Brand Colors</FieldLabel>
              {brand.brand_colors?.length ? (
                <div className="flex flex-wrap gap-4 mt-3">
                  {brand.brand_colors.map((color) => (
                    <div key={color} className="flex flex-col gap-2">
                      <div
                        className="w-16 h-16 border border-outline"
                        style={{ backgroundColor: color }}
                      />
                      <div
                        className="w-16 h-8 border border-outline opacity-60"
                        style={{ backgroundColor: color }}
                      />
                      <p className="text-xs font-mono uppercase tracking-wide text-graphite">
                        {color}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-mono text-gray-400 italic mt-2">Not set</p>
              )}
            </div>

            {/* Typography specimen */}
            <div className="flex-1 border border-outline p-4">
              <FieldLabel>Typography</FieldLabel>
              {brand.typography_notes ? (
                <div className="mt-3 flex flex-col gap-3">
                  <p className="text-xl font-mono font-bold text-graphite leading-tight">
                    The quick brown fox.
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed font-sans">
                    Consistent typography builds recognition. Every headline, body line, and label speaks before words do.
                  </p>
                  <div className="border-t border-outline pt-3">
                    <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">Style Notes</p>
                    <p className="text-xs font-mono text-graphite mt-1 leading-relaxed">{brand.typography_notes}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs font-mono text-gray-400 italic mt-2">Not set</p>
              )}
            </div>
          </div>
        )}
      </Section>

      {/* ── SAMPLE COPY ────────────────────────────────────────── */}
      <Section
        id="copy"
        label="04 — Sample Copy"
        editing={editingSection === 'copy'}
        disableEdit={isEditing}
        onEdit={() => handleEdit('copy')}
        onCancel={handleCancel}
        saving={saving}
        error={editingSection === 'copy' ? saveError : null}
      >
        {editingSection === 'copy' ? (
          <FormField
            label="Sample Copy Examples"
            required
            hint="Emails, social posts, website copy that represents your brand voice"
            error={errors.sample_copy?.message}
          >
            <textarea
              {...register('sample_copy')}
              rows={10}
              className="w-full"
              placeholder="Paste your brand's copy examples here..."
            />
          </FormField>
        ) : (
          <div className="flex gap-0">
            <div className="w-1 bg-rust flex-shrink-0 mr-5" />
            <p className="text-sm text-graphite leading-relaxed whitespace-pre-wrap font-sans">
              {brand.sample_copy}
            </p>
          </div>
        )}
      </Section>

    </form>
  )
}

// ─── Section ─────────────────────────────────────────────────────────────────

interface SectionProps {
  id: Section
  label: string
  editing: boolean
  disableEdit: boolean
  onEdit: () => void
  onCancel: () => void
  saving: boolean
  error: string | null
  children: React.ReactNode
}

function Section({ label, editing, disableEdit, onEdit, onCancel, saving, error, children }: SectionProps) {
  return (
    <div className="border-b border-outline last:border-b-0 bg-white">
      {/* Section header */}
      <div className="flex items-start justify-between px-6 pt-6 pb-4">
        <div>
          <h2 className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">{label}</h2>
          <div className="w-8 h-0.5 bg-rust" />
        </div>
        {!editing && (
          <button
            type="button"
            onClick={onEdit}
            disabled={disableEdit}
            className="text-xs font-mono uppercase border border-outline px-3 py-1.5 hover:bg-paper disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0 ml-4"
          >
            [ Edit ]
          </button>
        )}
      </div>

      {/* Section body */}
      <div className="px-6 pb-6">
        {children}

        {editing && (
          <div className="mt-5 pt-4 border-t border-outline flex flex-col gap-2">
            {error && <p className="text-xs text-red-600 font-mono">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary text-sm px-4 py-2">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={onCancel} disabled={saving} className="btn-secondary text-sm px-4 py-2">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Form helpers ─────────────────────────────────────────────────────────────

function FormField({
  label, hint, required, error, children,
}: {
  label: string; hint?: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs uppercase font-mono tracking-widest mb-1 text-gray-600">
        {label}{required && <span className="text-rust ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-400 font-mono mb-2">{hint}</p>}
      {children}
      {error && <p className="text-red-600 text-xs mt-1 font-mono">{error}</p>}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-mono uppercase tracking-widest text-gray-400">{children}</p>
  )
}
