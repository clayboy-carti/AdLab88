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
    // Always reset to current saved values before entering edit mode
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

      // Update local state with parsed values
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
    <form onSubmit={onSave} className="flex flex-col gap-5">

      {/* ── Core Identity ── */}
      <SectionShell
        title="Core Identity"
        editing={editingSection === 'core'}
        onEdit={() => handleEdit('core')}
        onCancel={handleCancel}
        saving={saving}
        error={editingSection === 'core' ? saveError : null}
        disableEdit={isEditing}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <DisplayField label="Company Name" value={brand.company_name} large />
            <DisplayField label="Target Audience" value={brand.target_audience} />
            <DisplayField label="What We Do" value={brand.what_we_do} className="md:col-span-2" />
            <DisplayField label="Unique Differentiator" value={brand.unique_differentiator} />
          </div>
        )}
      </SectionShell>

      {/* ── Voice & Messaging ── */}
      <SectionShell
        title="Voice & Messaging"
        editing={editingSection === 'voice'}
        onEdit={() => handleEdit('voice')}
        onCancel={handleCancel}
        saving={saving}
        error={editingSection === 'voice' ? saveError : null}
        disableEdit={isEditing}
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
          <div className="flex flex-col gap-5">
            <DisplayField label="Voice Summary" value={brand.voice_summary} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <TagsField label="Personality Traits" values={brand.personality_traits} />
              <TagsField label="Words to Use" values={brand.words_to_use} />
              <TagsField label="Words to Avoid" values={brand.words_to_avoid} />
            </div>
          </div>
        )}
      </SectionShell>

      {/* ── Visual Identity ── */}
      <SectionShell
        title="Visual Identity"
        editing={editingSection === 'visual'}
        onEdit={() => handleEdit('visual')}
        onCancel={handleCancel}
        saving={saving}
        error={editingSection === 'visual' ? saveError : null}
        disableEdit={isEditing}
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
          <div className="flex flex-col gap-5">
            {brand.brand_colors?.length ? (
              <div>
                <p className="text-xs uppercase font-mono text-gray-400 tracking-widest mb-3">Brand Colors</p>
                <div className="flex flex-wrap gap-4">
                  {brand.brand_colors.map((color) => (
                    <div key={color} className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 border border-outline flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs font-mono text-graphite uppercase">{color}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <DisplayField label="Brand Colors" value={undefined} />
            )}
            <DisplayField label="Typography Notes" value={brand.typography_notes} />
          </div>
        )}
      </SectionShell>

      {/* ── Sample Copy ── */}
      <SectionShell
        title="Sample Copy"
        editing={editingSection === 'copy'}
        onEdit={() => handleEdit('copy')}
        onCancel={handleCancel}
        saving={saving}
        error={editingSection === 'copy' ? saveError : null}
        disableEdit={isEditing}
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
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{brand.sample_copy}</p>
        )}
      </SectionShell>

    </form>
  )
}

// ─── Section shell ────────────────────────────────────────────────────────────

interface SectionShellProps {
  title: string
  editing: boolean
  disableEdit: boolean
  onEdit: () => void
  onCancel: () => void
  saving: boolean
  error: string | null
  children: React.ReactNode
}

function SectionShell({
  title, editing, disableEdit, onEdit, onCancel, saving, error, children,
}: SectionShellProps) {
  return (
    <div className="border border-outline">
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline bg-gray-50">
        <p className="text-xs uppercase font-mono text-gray-500 tracking-widest">{title}</p>
        {!editing && (
          <button
            type="button"
            onClick={onEdit}
            disabled={disableEdit}
            className="flex items-center gap-1.5 text-xs font-mono uppercase border border-outline px-3 py-1.5 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <EditIcon /><span>Edit</span>
          </button>
        )}
      </div>
      <div className="p-5">
        {children}
        {editing && (
          <div className="mt-5 flex flex-col gap-2">
            {error && <p className="text-xs text-red-600 font-mono">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary text-sm px-4 py-2">
                {saving ? 'SAVING...' : 'SAVE'}
              </button>
              <button type="button" onClick={onCancel} disabled={saving} className="btn-secondary text-sm px-4 py-2">
                CANCEL
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Display helpers ──────────────────────────────────────────────────────────

function DisplayField({
  label, value, large, className,
}: {
  label: string
  value?: string
  large?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      <p className="text-xs uppercase font-mono text-gray-400 tracking-widest mb-1">{label}</p>
      {value ? (
        <p className={large ? 'font-bold text-graphite leading-snug' : 'text-sm text-gray-700 leading-snug'}>
          {value}
        </p>
      ) : (
        <p className="text-xs font-mono text-gray-300 italic">Not set</p>
      )}
    </div>
  )
}

function TagsField({ label, values }: { label: string; values?: string[] }) {
  return (
    <div>
      <p className="text-xs uppercase font-mono text-gray-400 tracking-widest mb-2">{label}</p>
      {values?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span key={v} className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1">{v}</span>
          ))}
        </div>
      ) : (
        <p className="text-xs font-mono text-gray-300 italic">Not set</p>
      )}
    </div>
  )
}

// ─── Form field wrapper ───────────────────────────────────────────────────────

function FormField({
  label, hint, required, error, children,
}: {
  label: string
  hint?: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm uppercase font-mono mb-1">
        {label}{required && <span className="text-rust ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}
      {children}
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function EditIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}
