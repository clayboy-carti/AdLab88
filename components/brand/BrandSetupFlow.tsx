'use client'

import { useState } from 'react'
import BrandURLInput from './BrandURLInput'
import BrandDNACards from './BrandDNACards'
import BrandWizard from './BrandWizard'
import type { BrandDNA } from '@/types/database'

type FlowStep = 'url_input' | 'review' | 'wizard'

export default function BrandSetupFlow() {
  const [step, setStep] = useState<FlowStep>('url_input')
  const [scannedDNA, setScannedDNA] = useState<BrandDNA | null>(null)

  const handleScanComplete = (data: BrandDNA) => {
    setScannedDNA(data)
    setStep('review')
  }

  const handleApply = (data: BrandDNA) => {
    setScannedDNA(data)
    setStep('wizard')
  }

  const handleRescan = () => {
    setScannedDNA(null)
    setStep('url_input')
  }

  const handleSkip = () => {
    setScannedDNA(null)
    setStep('wizard')
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">

      {/* ── Idea 8: Hero URL input screen ── */}
      {step === 'url_input' && (
        <div className="space-y-8">
          {/* Large animated hero header */}
          <div className="text-center pt-6 pb-2">
            <p
              className="text-xs font-mono uppercase tracking-widest text-rust animate-fade-in-up"
              style={{ animationDelay: '0ms' }}
            >
              Let&apos;s get you set up
            </p>
            <h1
              className="text-4xl sm:text-5xl font-mono font-bold text-graphite uppercase mt-3 leading-tight animate-fade-in-up"
              style={{ animationDelay: '80ms' }}
            >
              Build Your<br />
              <span className="text-rust">Brand DNA.</span>
            </h1>
            {/* Rust accent line grows in from center */}
            <div
              className="w-16 h-0.5 bg-rust mx-auto mt-4 animate-line-grow"
              style={{ animationDelay: '220ms' }}
            />
            <p
              className="text-sm text-gray-500 mt-5 max-w-md mx-auto leading-relaxed animate-fade-in-up"
              style={{ animationDelay: '300ms' }}
            >
              Paste your website URL and we&apos;ll automatically extract your brand voice,
              visual identity, and messaging — in seconds.
            </p>
          </div>

          {/* URL input card */}
          <div
            className="card animate-fade-in-up"
            style={{ animationDelay: '400ms' }}
          >
            <BrandURLInput onScanComplete={handleScanComplete} />
          </div>

          <div
            className="relative flex items-center gap-4 animate-fade-in-up"
            style={{ animationDelay: '500ms' }}
          >
            <div className="flex-1 h-px bg-outline/20" />
            <span className="text-xs font-mono uppercase tracking-widest text-gray-400 flex-shrink-0">
              or
            </span>
            <div className="flex-1 h-px bg-outline/20" />
          </div>

          <div
            className="text-center animate-fade-in-up"
            style={{ animationDelay: '560ms' }}
          >
            <button
              onClick={handleSkip}
              className="text-xs font-mono uppercase tracking-widest text-gray-400 hover:text-graphite underline transition-colors"
            >
              Set up brand manually instead
            </button>
          </div>
        </div>
      )}

      {step === 'review' && scannedDNA && (
        <div>
          <div className="mb-6 flex flex-wrap items-start gap-2 justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">
                Scan Results
              </p>
              <h1 className="text-3xl uppercase font-mono header-accent">
                {scannedDNA.company_name ?? 'Brand Detected'}
              </h1>
            </div>
            <p className="text-xs font-mono text-gray-400 pt-1">{scannedDNA.source_url}</p>
          </div>
          <div className="card">
            <BrandDNACards
              data={scannedDNA}
              onApply={handleApply}
              onRescan={handleRescan}
            />
          </div>
        </div>
      )}

      {step === 'wizard' && (
        <div>
          <div className="mb-6 flex flex-wrap items-start gap-2 justify-between">
            <h1 className="text-3xl uppercase font-mono header-accent">Brand Setup</h1>
            {scannedDNA && (
              <p className="text-xs font-mono text-gray-400">
                Pre-filled from {scannedDNA.source_url}
              </p>
            )}
          </div>
          <div className="card">
            <BrandWizard initialData={scannedDNA ?? undefined} />
          </div>
        </div>
      )}
    </div>
  )
}
