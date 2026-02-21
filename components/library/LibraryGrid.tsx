'use client'

import { useState } from 'react'
import AdCard, { type Ad } from './AdCard'
import AdModal from './AdModal'

export default function LibraryGrid({ initialAds }: { initialAds: Ad[] }) {
  const [ads, setAds] = useState<Ad[]>(initialAds)
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null)

  const handleCaptionUpdate = (adId: string, newCaption: string) => {
    setAds((prev) => prev.map((ad) => (ad.id === adId ? { ...ad, caption: newCaption } : ad)))
    setSelectedAd((prev) => (prev?.id === adId ? { ...prev, caption: newCaption } : prev))
  }

  const handleHookUpdate = (adId: string, newHook: string) => {
    setAds((prev) => prev.map((ad) => (ad.id === adId ? { ...ad, hook: newHook } : ad)))
    setSelectedAd((prev) => (prev?.id === adId ? { ...prev, hook: newHook } : prev))
  }

  const handleCtaUpdate = (adId: string, newCta: string) => {
    setAds((prev) => prev.map((ad) => (ad.id === adId ? { ...ad, cta: newCta } : ad)))
    setSelectedAd((prev) => (prev?.id === adId ? { ...prev, cta: newCta } : prev))
  }

  const handleDelete = (adId: string) => {
    setAds((prev) => prev.filter((ad) => ad.id !== adId))
    setSelectedAd(null)
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
          onHookUpdate={handleHookUpdate}
          onCtaUpdate={handleCtaUpdate}
          onDelete={handleDelete}
        />
      )}
    </>
  )
}
