'use client'

import { useState, useEffect } from 'react'
import type { AdTemplate } from '@/types/database'

type TemplateWithUrl = AdTemplate & { url: string | null }

export default function TemplatesGrid() {
  const [templates, setTemplates] = useState<TemplateWithUrl[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/templates')
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error)
        setTemplates(json.templates)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Delete failed')
      }
      setTemplates((prev) => prev.filter((t) => t.id !== id))
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="aspect-square bg-forest/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <p className="text-xs font-mono text-rust border border-rust/20 bg-rust/5 px-3 py-2 rounded">
        {error}
      </p>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="py-16 text-center border border-dashed border-forest/20 rounded-2xl">
        <p className="font-mono text-sm text-graphite/40 mb-1">No templates yet</p>
        <p className="font-mono text-xs text-graphite/30">
          Save a winning ad from your library to use it as a style reference
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {templates.map((template) => (
        <TemplateCard key={template.id} template={template} onDelete={handleDelete} />
      ))}
    </div>
  )
}

function TemplateCard({
  template,
  onDelete,
}: {
  template: TemplateWithUrl
  onDelete: (id: string) => void
}) {
  return (
    <div className="group bg-white rounded-2xl border border-forest/20 shadow-sm overflow-hidden">
      <div className="aspect-square bg-paper/60 overflow-hidden">
        {template.url ? (
          <img
            src={template.url}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-mono text-xs text-graphite/20">
            No preview
          </div>
        )}
      </div>

      <div className="px-3 py-2.5">
        <p className="font-mono text-xs font-semibold text-graphite truncate mb-1">
          {template.name}
        </p>
        {template.positioning_angle && (
          <p className="font-mono text-[10px] text-graphite/50 truncate mb-2">
            {template.positioning_angle}
          </p>
        )}
        {template.hook && (
          <p className="font-mono text-[10px] text-forest/70 italic leading-relaxed line-clamp-2 mb-2">
            &ldquo;{template.hook}&rdquo;
          </p>
        )}
        {template.category && (
          <span className="inline-block font-mono text-[9px] uppercase tracking-widest text-forest/60 bg-paper border border-forest/20 rounded-full px-2 py-0.5">
            {template.category}
          </span>
        )}
        <div className="flex justify-end mt-2">
          <button
            type="button"
            onClick={() => onDelete(template.id)}
            className="font-mono text-[10px] text-graphite/30 hover:text-rust uppercase tracking-widest transition-colors opacity-0 group-hover:opacity-100"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
