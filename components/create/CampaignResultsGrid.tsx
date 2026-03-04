'use client'

interface CampaignResult {
  intelligenceId: string
  persona: string
  angle: string
  status: 'pending' | 'success' | 'failed'
  adId: string | null
  generatedImageUrl: string | null
  error: string | null
}

interface Props {
  results: CampaignResult[]
  succeeded: number
  total: number
}

export default function CampaignResultsGrid({ results, succeeded, total }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <p className="text-xs font-mono uppercase tracking-widest text-graphite/40">
          Results
        </p>
        <span className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${
          succeeded === total
            ? 'bg-forest/10 text-forest border-forest/20'
            : succeeded > 0
              ? 'bg-amber-50 text-amber-600 border-amber-200'
              : 'bg-rust/10 text-rust border-rust/20'
        }`}>
          {succeeded}/{total} generated
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((result, i) => (
          <div key={result.intelligenceId} className="card space-y-3">
            <div className="flex items-start justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-graphite/40">
                Profile {i + 1}
              </span>
              <span className={`font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border shrink-0 ${
                result.status === 'success'
                  ? 'bg-forest/10 text-forest border-forest/20'
                  : result.status === 'failed'
                    ? 'bg-rust/10 text-rust border-rust/20'
                    : 'bg-paper text-graphite/40 border-forest/10'
              }`}>
                {result.status}
              </span>
            </div>

            <div>
              <p className="font-mono text-xs font-semibold text-graphite line-clamp-1">
                {result.angle || 'No angle'}
              </p>
              <p className="font-mono text-[10px] text-graphite/50 line-clamp-2 mt-0.5">
                {result.persona || 'No persona'}
              </p>
            </div>

            {result.status === 'success' && result.generatedImageUrl && (
              <div className="rounded-xl overflow-hidden border border-forest/10">
                <img
                  src={result.generatedImageUrl}
                  alt={result.angle}
                  className="w-full h-32 object-cover"
                />
              </div>
            )}

            {result.status === 'success' && result.adId && (
              <a
                href="/library"
                className="inline-block font-mono text-xs text-forest hover:text-forest/70 transition-colors"
              >
                View in Library →
              </a>
            )}

            {result.status === 'failed' && result.error && (
              <p className="font-mono text-[10px] text-rust bg-rust/5 border border-rust/20 rounded-lg px-2 py-1">
                {result.error}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
