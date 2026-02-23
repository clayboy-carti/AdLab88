'use client'

import type { Ad } from './AdCard'

interface AdSetCardProps {
  ads: Ad[]
  onClick: () => void
}

export default function AdSetCard({ ads, onClick }: AdSetCardProps) {
  const formattedDate = new Date(ads[0].created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  // Up to 4 images for the collage
  const previews = ads.slice(0, 4)

  return (
    <button
      onClick={onClick}
      className="border border-outline bg-white flex flex-col text-left w-full hover:border-rust transition-colors group cursor-pointer"
    >
      {/* 2×2 image collage */}
      <div className="border-b border-outline overflow-hidden bg-gray-100 aspect-video w-full grid grid-cols-2 grid-rows-2 gap-px">
        {previews.map((ad, i) => (
          <div key={ad.id} className="overflow-hidden bg-gray-200 relative">
            {ad.signedUrl ? (
              <img
                src={ad.signedUrl}
                alt={ad.positioning_angle}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-xs font-mono text-gray-400">—</span>
              </div>
            )}
            {/* Label each quadrant with its angle */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1.5 py-0.5">
              <p className="text-[9px] font-mono text-white uppercase truncate leading-tight">
                {ad.positioning_angle}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-3 flex-1 w-full">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-rust uppercase tracking-widest">
            A/B Test Set
          </span>
          <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 uppercase">
            {ads.length} variants
          </span>
        </div>

        {/* Title derived from the first variant's hook */}
        <div>
          <p className="text-xs uppercase font-mono text-gray-400 tracking-widest mb-1">Hook</p>
          <p className="font-bold text-graphite leading-snug line-clamp-2">{ads[0].hook}</p>
        </div>

        <p className="text-xs text-gray-400 font-mono line-clamp-1 mt-auto">
          {ads.map((a) => a.positioning_angle).join(' · ')}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-outline bg-gray-50 w-full">
        <span className="text-xs font-mono text-gray-400">{formattedDate}</span>
        <span className="text-xs font-mono text-gray-400 uppercase group-hover:text-rust transition-colors">
          View Set →
        </span>
      </div>
    </button>
  )
}
