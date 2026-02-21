'use client'

import type { BrandDNA } from '@/types/database'

interface BrandDNACardsProps {
  data: BrandDNA
  onApply: (data: BrandDNA) => void
  onRescan: () => void
}

export default function BrandDNACards({ data, onApply, onRescan }: BrandDNACardsProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between border-b-2 border-rust pb-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">
            Scan Results
          </p>
          <h2 className="text-2xl font-mono font-bold text-graphite uppercase">
            {data.company_name ?? 'Brand Detected'}
          </h2>
        </div>
        <p className="text-xs font-mono text-gray-400 pb-1 truncate max-w-xs" title={data.source_url}>
          {data.source_url}
        </p>
      </div>

      <p className="text-sm text-gray-500 font-mono">
        Review the extracted brand data below. Click &ldquo;Build Profile&rdquo; to pre-fill the setup wizard — you can edit everything before saving.
      </p>

      {/* Cards grid */}
      <div className="flex flex-col gap-0 border border-outline">

        {/* Core Identity */}
        <DNASection label="01 — Core Identity">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.company_name && (
              <DNAField label="Company Name">{data.company_name}</DNAField>
            )}
            {data.what_we_do && (
              <DNAField label="What We Do" className="md:col-span-2">
                {data.what_we_do}
              </DNAField>
            )}
            {data.target_audience && (
              <DNAField label="Target Audience">{data.target_audience}</DNAField>
            )}
            {data.unique_differentiator && (
              <DNAField label="Differentiator">{data.unique_differentiator}</DNAField>
            )}
          </div>
        </DNASection>

        {/* Voice */}
        <DNASection label="02 — Voice & Messaging">
          <div className="space-y-4">
            {data.voice_summary && (
              <DNAField label="Voice Summary">
                <span className="italic">&ldquo;{data.voice_summary}&rdquo;</span>
              </DNAField>
            )}
            {data.personality_traits?.length ? (
              <DNAField label="Personality Traits">
                <div className="flex flex-wrap gap-2 mt-1">
                  {data.personality_traits.map((t) => (
                    <span key={t} className="text-xs font-mono uppercase border border-outline px-2 py-0.5">
                      {t}
                    </span>
                  ))}
                </div>
              </DNAField>
            ) : null}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-outline">
              <div className="p-3 md:border-r border-outline">
                <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-2">
                  <span className="text-forest">✓</span> Use
                </p>
                {data.words_to_use?.length ? (
                  <div className="flex flex-wrap gap-1">
                    {data.words_to_use.map((w) => (
                      <span key={w} className="text-xs font-mono bg-forest text-white px-2 py-0.5">
                        {w}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-mono text-gray-400 italic">Not detected</p>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-2">
                  <span className="text-rust">×</span> Avoid
                </p>
                {data.words_to_avoid?.length ? (
                  <div className="flex flex-wrap gap-1">
                    {data.words_to_avoid.map((w) => (
                      <span key={w} className="text-xs font-mono bg-rust text-white px-2 py-0.5">
                        {w}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-mono text-gray-400 italic">Not detected</p>
                )}
              </div>
            </div>
          </div>
        </DNASection>

        {/* Visual */}
        {(data.brand_colors?.length || data.typography_notes) && (
          <DNASection label="03 — Visual Identity">
            <div className="flex flex-col md:flex-row gap-6">
              {data.brand_colors?.length ? (
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-3">
                    Colors
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    {data.brand_colors.map((color) => (
                      <div key={color} className="flex flex-col gap-1 items-center">
                        <div
                          className="w-10 h-10 border border-outline"
                          style={{ backgroundColor: color }}
                        />
                        <p className="text-xs font-mono uppercase">{color}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {data.typography_notes && (
                <DNAField label="Typography">{data.typography_notes}</DNAField>
              )}
            </div>
          </DNASection>
        )}

        {/* Sample Copy */}
        {data.sample_copy && (
          <DNASection label="04 — Sample Copy">
            <div className="flex gap-4">
              <div className="w-1 bg-rust flex-shrink-0" />
              <p className="text-sm text-graphite leading-relaxed font-sans italic">
                {data.sample_copy}
              </p>
            </div>
          </DNASection>
        )}
      </div>

      {/* CTA */}
      <div className="flex gap-3">
        <button onClick={() => onApply(data)} className="btn-primary flex-1">
          [ BUILD BRAND PROFILE ]
        </button>
        <button onClick={onRescan} className="btn-secondary px-5">
          Rescan
        </button>
      </div>
    </div>
  )
}

function DNASection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-outline last:border-b-0 bg-white px-6 py-5">
      <h3 className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">{label}</h3>
      <div className="w-8 h-0.5 bg-rust mb-4" />
      {children}
    </div>
  )
}

function DNAField({
  label,
  children,
  className = '',
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">{label}</p>
      <div className="text-sm text-graphite leading-relaxed">{children}</div>
    </div>
  )
}
