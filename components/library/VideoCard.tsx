'use client'

export interface VideoItem {
  id: string
  title?: string | null
  source_ad_id: string | null
  motion_prompt: string | null
  storage_path: string
  created_at: string
  signedUrl: string | null
  folder_id?: string | null
}

export default function VideoCard({ video, onClick }: { video: VideoItem; onClick?: () => void }) {
  const formattedDate = new Date(video.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl border border-forest/20 shadow-sm flex flex-col text-left w-full hover:border-rust/50 hover:shadow-md transition-all duration-200 group overflow-hidden"
    >
      {/* Video thumbnail */}
      <div className="overflow-hidden bg-graphite aspect-video w-full relative">
        {video.signedUrl ? (
          <>
            <video
              src={video.signedUrl}
              className="w-full h-full object-cover opacity-90 group-hover:opacity-70 transition-opacity duration-200"
              muted
              playsInline
              preload="metadata"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#2A2A2A">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs font-mono text-white/30 uppercase">No video</span>
          </div>
        )}
        <span className="absolute top-2.5 right-2.5 text-[10px] font-mono bg-graphite/70 text-white/80 px-2 py-0.5 rounded-full uppercase tracking-wide">
          Video
        </span>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        {video.title && (
          <p className="font-semibold text-sm text-graphite leading-snug line-clamp-2">{video.title}</p>
        )}
        {video.motion_prompt ? (
          <p className="text-xs text-graphite/55 leading-relaxed line-clamp-2">{video.motion_prompt}</p>
        ) : (
          !video.title && <p className="text-xs text-graphite/35 font-mono uppercase">Product video</p>
        )}
        <div className="mt-auto pt-2">
          <span className="text-[10px] font-mono text-graphite/35">{formattedDate}</span>
        </div>
      </div>
    </button>
  )
}
