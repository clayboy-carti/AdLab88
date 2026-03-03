'use client'

import { useState, useEffect } from 'react'
import type { BrandIntelligence } from '@/types/database'

type IntelField = keyof Pick<
  BrandIntelligence,
  'persona' | 'pain_point' | 'angle' | 'visual_direction' | 'emotion' | 'copy_hook'
>

const FIELDS: { key: IntelField; label: string; rows: number }[] = [
  { key: 'persona', label: 'Persona', rows: 3 },
  { key: 'pain_point', label: 'Pain Point', rows: 2 },
  { key: 'angle', label: 'Strategic Angle', rows: 2 },
  { key: 'visual_direction', label: 'Visual Direction', rows: 2 },
  { key: 'emotion', label: 'Emotion', rows: 1 },
  { key: 'copy_hook', label: 'Copy Hook', rows: 1 },
]

export default function BrandIntelligenceTab() {
  const [profiles, setProfiles] = useState<BrandIntelligence[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Partial<Record<IntelField, string>>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProfiles()
  }, [])

  async function fetchProfiles() {
    setLoading(true)
    try {
      const res = await fetch('/api/brand/intelligence')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load')
      setProfiles(json.profiles)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function generate() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/brand/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'generate' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Generation failed')
      setProfiles((prev) => [...json.profiles, ...prev])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  async function addManual() {
    try {
      const res = await fetch('/api/brand/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'manual' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create')
      const created = json.profiles[0] as BrandIntelligence
      setProfiles((prev) => [created, ...prev])
      startEdit(created)
    } catch (err: any) {
      setError(err.message)
    }
  }

  function startEdit(profile: BrandIntelligence) {
    setEditingId(profile.id)
    setEditDraft({
      persona: profile.persona ?? '',
      pain_point: profile.pain_point ?? '',
      angle: profile.angle ?? '',
      visual_direction: profile.visual_direction ?? '',
      emotion: profile.emotion ?? '',
      copy_hook: profile.copy_hook ?? '',
    })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/brand/intelligence/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDraft),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Save failed')
      setProfiles((prev) => prev.map((p) => (p.id === id ? json.profile : p)))
      setEditingId(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteProfile(id: string) {
    try {
      const res = await fetch(`/api/brand/intelligence/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Delete failed')
      }
      setProfiles((prev) => prev.filter((p) => p.id !== id))
      if (editingId === id) setEditingId(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-graphite/40">
            Brand Intelligence
          </p>
          <p className="text-sm font-mono text-graphite/60 mt-0.5">
            Persona profiles and strategic angles for ad creation
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={addManual} className="btn-secondary text-xs">
            + Manual
          </button>
          <button
            type="button"
            onClick={generate}
            disabled={generating}
            className="btn-primary text-xs disabled:opacity-50"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent animate-spin rounded-full" />
                Generating…
              </span>
            ) : (
              '⚡ Generate'
            )}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs font-mono text-rust border border-rust/20 bg-rust/5 px-3 py-2 rounded">
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-32 bg-forest/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-forest/20 rounded-xl">
          <p className="font-mono text-sm text-graphite/40 mb-4">No profiles yet</p>
          <button
            type="button"
            onClick={generate}
            disabled={generating}
            className="btn-primary text-xs"
          >
            {generating ? 'Generating…' : '⚡ Generate from Brand DNA'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              editing={editingId === profile.id}
              draft={editDraft}
              saving={saving}
              onEdit={() => startEdit(profile)}
              onDraftChange={(field, value) =>
                setEditDraft((d) => ({ ...d, [field]: value }))
              }
              onSave={() => saveEdit(profile.id)}
              onCancel={() => setEditingId(null)}
              onDelete={() => deleteProfile(profile.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ProfileCard({
  profile,
  editing,
  draft,
  saving,
  onEdit,
  onDraftChange,
  onSave,
  onCancel,
  onDelete,
}: {
  profile: BrandIntelligence
  editing: boolean
  draft: Partial<Record<IntelField, string>>
  saving: boolean
  onEdit: () => void
  onDraftChange: (field: string, value: string) => void
  onSave: () => void
  onCancel: () => void
  onDelete: () => void
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <span
          className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${
            profile.source === 'generated'
              ? 'bg-forest/10 text-forest border-forest/20'
              : 'bg-rust/10 text-rust border-rust/20'
          }`}
        >
          {profile.source}
        </span>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
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
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onEdit}
                className="text-xs font-mono text-graphite/40 hover:text-forest uppercase tracking-widest px-2 py-1 rounded hover:bg-forest/5 transition-colors"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="text-xs font-mono text-graphite/30 hover:text-rust uppercase tracking-widest px-2 py-1 rounded hover:bg-rust/5 transition-colors"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FIELDS.map(({ key, label, rows }) => (
            <div key={key} className={rows > 1 ? 'sm:col-span-2' : ''}>
              <p className="text-xs font-mono uppercase tracking-widest text-graphite/40 mb-1">
                {label}
              </p>
              {rows > 1 ? (
                <textarea
                  value={draft[key] ?? ''}
                  onChange={(e) => onDraftChange(key, e.target.value)}
                  rows={rows}
                  className="field-input resize-none text-xs w-full"
                />
              ) : (
                <input
                  type="text"
                  value={draft[key] ?? ''}
                  onChange={(e) => onDraftChange(key, e.target.value)}
                  className="field-input text-xs"
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FIELDS.map(({ key, label }) => {
            const value = profile[key]
            if (!value) return null
            return (
              <div key={key}>
                <p className="text-xs font-mono uppercase tracking-widest text-graphite/40 mb-1">
                  {label}
                </p>
                <p className="text-xs font-mono text-graphite leading-relaxed">{value}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
