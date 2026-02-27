'use client'

export interface Ad {
  id: string
  title?: string | null
  hook: string
  caption: string
  cta: string
  positioning_angle: string
  target_platform?: string
  framework_applied?: string
  image_quality?: string
  aspect_ratio?: string
  created_at: string
  storage_path: string | null
  signedUrl: string | null
  batch_id?: string | null
  folder_id?: string | null
}

export default function AdCard({ ad, onClick }: { ad: Ad; onClick: () => void }) {
  const formattedDate = new Date(ad.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl border border-forest/20 shadow-sm flex flex-col text-left w-full hover:border-rust/50 hover:shadow-md transition-all duration-200 group cursor-pointer overflow-hidden"
    >
      {/* Image */}
      <div className="overflow-hidden bg-sage/10 aspect-video w-full">
        {ad.signedUrl ? (
          <img
            src={ad.signedUrl}
            alt={ad.title ?? ''}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs font-mono text-graphite/30 uppercase">No image</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        {ad.title && (
          <p className="font-semibold text-sm text-graphite leading-snug line-clamp-2">{ad.title}</p>
        )}
        {ad.hook && (
          <p className="text-xs text-graphite/55 leading-relaxed line-clamp-2">{ad.hook}</p>
        )}

        {/* Badges + date */}
        <div className="flex items-center justify-between mt-auto pt-2 gap-2 flex-wrap">
          <div className="flex gap-1 flex-wrap">
            <span className="text-[10px] font-mono text-graphite/50 bg-sage/20 px-2 py-0.5 rounded-full uppercase">
              {ad.positioning_angle}
            </span>
            {ad.target_platform && (
              <span className="text-[10px] font-mono text-graphite/50 bg-sage/20 px-2 py-0.5 rounded-full uppercase">
                {ad.target_platform}
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono text-graphite/35">{formattedDate}</span>
        </div>
      </div>
    </button>
  )
}
