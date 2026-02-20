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
    <div className="max-w-4xl mx-auto p-8">
      {step === 'url_input' && (
        <div className="space-y-8">
          <div className="card">
            <BrandURLInput onScanComplete={handleScanComplete} />
          </div>

          <div className="relative flex items-center gap-4">
            <div className="flex-1 h-px bg-outline" />
            <span className="text-xs font-mono uppercase tracking-widest text-gray-400 flex-shrink-0">
              or
            </span>
            <div className="flex-1 h-px bg-outline" />
          </div>

          <div className="text-center">
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
        <BrandDNACards
          data={scannedDNA}
          onApply={handleApply}
          onRescan={handleRescan}
        />
      )}

      {step === 'wizard' && (
        <div>
          <div className="mb-6 flex items-center justify-between">
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
