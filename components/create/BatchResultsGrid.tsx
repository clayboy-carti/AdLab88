'use client'

export interface BatchAdResult {
  id?: string
  positioning_angle: string
  hook: string
  caption: string
  cta: string
  generatedImageUrl: string | null
  imageGenerationFailed: boolean
  framework_applied?: string
  target_platform?: string
  created_at?: string
}

interface BatchResultsGridProps {
  ads: BatchAdResult[]
  succeeded: number
  onReset: () => void
}

export default function BatchResultsGrid({ ads, succeeded, onReset }: BatchResultsGridProps) {
  return (
    <div className="p-4 space-y-4">
      {/* Summary row */}
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">
          {succeeded} / {ads.length} Variations Generated
        </p>
        {succeeded < ads.length && (
          <span className="font-mono text-xs text-amber-600 border border-amber-300 px-2 py-0.5">
            Partial
          </span>
        )}
      </div>

      {/* 5-card grid — 2 columns, 2-2-1 layout */}
      <div className="grid grid-cols-2 gap-3">
        {ads.map((ad, i) => (
          <div
            key={i}
            className={`border flex flex-col ${
              ad.imageGenerationFailed
                ? 'border-gray-200 opacity-50'
                : 'border-outline'
            } bg-white`}
          >
            {/* Thumbnail */}
            <div className="border-b border-outline overflow-hidden bg-gray-100" style={{ aspectRatio: '4/3' }}>
              {ad.generatedImageUrl && !ad.imageGenerationFailed ? (
                <img
                  src={ad.generatedImageUrl}
                  alt={ad.hook}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-mono text-xs text-gray-400">
                    {ad.imageGenerationFailed ? 'FAILED' : 'NO IMAGE'}
                  </span>
                </div>
              )}
            </div>

            {/* Copy summary */}
            <div className="p-3 space-y-1 flex-1">
              <p className="font-mono text-[10px] uppercase text-rust tracking-widest leading-none">
                {ad.positioning_angle}
              </p>
              <p className="font-bold text-sm leading-snug line-clamp-2">{ad.hook}</p>
              <p className="font-mono text-[10px] text-gray-400 uppercase">{ad.cta}</p>
              {ad.target_platform && (
                <p className="font-mono text-[10px] text-gray-300 uppercase">{ad.target_platform}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Success bar */}
      <div className="border border-green-300 bg-green-50 p-3">
        <p className="font-mono text-xs uppercase text-green-700 mb-1">
          {succeeded} ad{succeeded !== 1 ? 's' : ''} saved to Library
        </p>
        <a href="/library" className="font-mono text-xs text-green-600 underline">
          View Library →
        </a>
      </div>

      <button
        onClick={onReset}
        className="btn-secondary w-full"
      >
        RUN ANOTHER BATCH
      </button>
    </div>
  )
}
