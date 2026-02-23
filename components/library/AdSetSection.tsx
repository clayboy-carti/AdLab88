'use client'

import AdCard, { type Ad } from './AdCard'

interface AdSetSectionProps {
  ads: Ad[]
  onAdClick: (ad: Ad) => void
}

export default function AdSetSection({ ads, onAdClick }: AdSetSectionProps) {
  const date = new Date(ads[0].created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <section className="border border-outline bg-gray-50">
      {/* Set header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-outline bg-white">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-rust uppercase tracking-widest">
            A/B Test Set
          </span>
          <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">
            {ads.length} Variants
          </span>
        </div>
        <span className="text-xs font-mono text-gray-400">{date}</span>
      </div>

      {/* Cards */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {ads.map((ad) => (
          <AdCard key={ad.id} ad={ad} onClick={() => onAdClick(ad)} />
        ))}
      </div>
    </section>
  )
}
