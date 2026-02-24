'use client'

import { useRef } from 'react'

export interface VideoItem {
  id: string
  source_ad_id: string | null
  motion_prompt: string | null
  storage_path: string
  created_at: string
  signedUrl: string | null
}

export default function VideoCard({ video }: { video: VideoItem }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  const formattedDate = new Date(video.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const handleClick = () => {
    const el = videoRef.current
    if (!el) return
    if (el.paused) {
      el.play()
    } else {
      el.pause()
    }
  }

  return (
    <div className="border border-outline bg-white flex flex-col text-left w-full">
      {/* Video */}
      <div
        className="border-b border-outline overflow-hidden bg-gray-900 aspect-video w-full relative cursor-pointer group"
        onClick={handleClick}
      >
        {video.signedUrl ? (
          <>
            <video
              ref={videoRef}
              src={video.signedUrl}
              className="w-full h-full object-cover"
              muted
              playsInline
              preload="metadata"
              loop
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="bg-black/60 text-white text-xs font-mono uppercase px-3 py-1.5">
                Click to play
              </span>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs font-mono text-gray-400 uppercase">No video</span>
          </div>
        )}
        <span className="absolute top-2 right-2 text-xs font-mono bg-black text-white px-2 py-0.5 uppercase">
          Video
        </span>
      </div>

      {/* Info */}
      <div className="p-5 flex flex-col gap-2 flex-1 w-full">
        {video.motion_prompt ? (
          <div>
            <p className="text-xs uppercase font-mono text-gray-400 tracking-widest mb-1">Motion</p>
            <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{video.motion_prompt}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500 font-mono uppercase">Product video</p>
        )}
      </div>

      <div className="flex items-center justify-between px-5 py-3 border-t border-outline bg-gray-50 w-full">
        <span className="text-xs font-mono text-gray-400">{formattedDate}</span>
        <span className="text-xs font-mono text-gray-400 uppercase">Product Video</span>
      </div>
    </div>
  )
}
