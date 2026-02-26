'use client'

import { useEffect } from 'react'
import type { Ad } from './AdCard'

interface AdSetModalProps {
  ads: Ad[]
  onClose: () => void
  onVariantClick: (ad: Ad) => void
}

export default function AdSetModal({ ads, onClose, onVariantClick }: AdSetModalProps) {
  const formattedDate = new Date(ads[0].created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-outline w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-rust uppercase tracking-widest">
              A/B Test Set
            </span>
            <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 uppercase">
              {ads.length} variants
            </span>
            <span className="text-xs font-mono text-gray-400">{formattedDate}</span>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-mono text-gray-400 uppercase hover:text-rust transition-colors"
          >
            Close ✕
          </button>
        </div>

        {/* Variant grid */}
        <div className="overflow-y-auto p-6">
          <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-4">
            Select a variant to view or edit
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ads.map((ad) => (
              <button
                key={ad.id}
                onClick={() => onVariantClick(ad)}
                className="border border-outline bg-white text-left flex flex-col hover:border-rust transition-colors group cursor-pointer"
              >
                {/* Image */}
                <div className="border-b border-outline overflow-hidden bg-gray-100 aspect-video w-full">
                  {ad.signedUrl ? (
                    <img
                      src={ad.signedUrl}
                      alt={ad.hook}
                      className="w-full h-full object-cover group-hover:opacity-95 transition-opacity"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs font-mono text-gray-400 uppercase">No image</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <span className="text-xs font-mono font-bold text-rust uppercase tracking-wide">
                    {ad.positioning_angle}
                  </span>
                  <p className="text-sm font-bold text-graphite leading-snug line-clamp-2">
                    {ad.hook}
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mt-auto">
                    {ad.caption}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end px-4 py-2 border-t border-outline bg-gray-50 w-full">
                  <span className="text-xs font-mono text-gray-400 uppercase group-hover:text-rust transition-colors">
                    View / Edit →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
