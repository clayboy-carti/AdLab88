'use client'

import { useState } from 'react'
import AdCard, { type Ad } from './AdCard'
import AdModal from './AdModal'

export default function LibraryGrid({ initialAds }: { initialAds: Ad[] }) {
  const [ads, setAds] = useState<Ad[]>(initialAds)
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null)

  const handleCaptionUpdate = (adId: string, newCaption: string) => {
    setAds((prev) =>
      prev.map((ad) => (ad.id === adId ? { ...ad, caption: newCaption } : ad))
    )
    // Keep the modal open with fresh caption
    setSelectedAd((prev) => (prev?.id === adId ? { ...prev, caption: newCaption } : prev))
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {ads.map((ad) => (
          <AdCard key={ad.id} ad={ad} onClick={() => setSelectedAd(ad)} />
        ))}
      </div>

      {selectedAd && (
        <AdModal
          ad={selectedAd}
          onClose={() => setSelectedAd(null)}
          onCaptionUpdate={handleCaptionUpdate}
        />
      )}
    </>
  )
}
