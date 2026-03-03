'use client'

import { useState } from 'react'

const CATEGORIES = ['hero', 'testimonial', 'product', 'lifestyle', 'promotion', 'awareness']

interface Props {
  adId: string
  defaultName?: string
  onSaved: () => void
  onClose: () => void
}

export default function SaveAsTemplateModal({ adId, defaultName = '', onSaved, onClose }: Props) {
  const [name, setName] = useState(defaultName)
  const [category, setCategory] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ad_id: adId, name: name.trim(), category: category || null }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save template')
      onSaved()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-graphite/40">Library</p>
            <h2 className="font-mono text-base font-semibold text-graphite mt-0.5">
              Save as Template
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-graphite/30 hover:text-graphite transition-colors text-xl leading-none px-1"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-mono uppercase tracking-widest text-graphite/40 block mb-1.5">
              Template Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer Hero Ad"
              required
              className="field-input w-full"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-mono uppercase tracking-widest text-graphite/40 block mb-1.5">
              Category <span className="text-graphite/25 normal-case tracking-normal">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(category === cat ? '' : cat)}
                  className={`font-mono text-xs px-3 py-1 rounded-full border transition-colors capitalize ${
                    category === cat
                      ? 'bg-forest text-white border-forest'
                      : 'border-forest/30 text-forest/60 hover:border-forest hover:text-forest'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs font-mono text-rust border border-rust/20 bg-rust/5 px-3 py-2 rounded">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 text-xs">
              Cancel
            </button>
            <button type="submit" disabled={saving || !name.trim()} className="btn-primary flex-1 text-xs disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
