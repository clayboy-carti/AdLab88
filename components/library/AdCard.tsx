'use client'

export interface Ad {
  id: string
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
      className="border border-outline bg-white flex flex-col text-left w-full hover:border-rust transition-colors group cursor-pointer"
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

      {/* Copy */}
      <div className="p-5 flex flex-col gap-3 flex-1 w-full">
        <div>
          <p className="text-xs uppercase font-mono text-gray-400 tracking-widest mb-1">Hook</p>
          <p className="font-bold text-graphite leading-snug">{ad.hook}</p>
        </div>

        <div>
          <p className="text-xs uppercase font-mono text-gray-400 tracking-widest mb-1">Caption</p>
          <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{ad.caption}</p>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-outline mt-auto">
          <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 uppercase">
            {ad.positioning_angle}
          </span>
          {ad.target_platform && (
            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 uppercase">
              {ad.target_platform}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-outline bg-gray-50 w-full">
        <span className="text-xs font-mono text-gray-400">{formattedDate}</span>
        <span className="text-xs font-mono text-gray-400 uppercase group-hover:text-rust transition-colors">
          View →
        </span>
      </div>
    </button>
  )
}
