'use client'

import { useState, useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  brandSchema,
  type BrandFormData,
  parseCommaSeparated,
  parseColors,
} from '@/lib/validations/brand'
import type { Brand, BrandDNA } from '@/types/database'

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

// Confetti burst config for the celebration screen
const CONFETTI_PIECES = [
  { keyframe: 'confettiLeft',     color: '#B55233', size: 9,  delay: 0,   dur: 1.2 },
  { keyframe: 'confettiRight',    color: '#1F3A32', size: 6,  delay: 80,  dur: 1.0 },
  { keyframe: 'confettiUp',       color: '#B55233', size: 10, delay: 160, dur: 1.4 },
  { keyframe: 'confettiLeftLow',  color: '#8FA99B', size: 7,  delay: 40,  dur: 1.1 },
  { keyframe: 'confettiRightLow', color: '#2A2A2A', size: 5,  delay: 200, dur: 0.9 },
  { keyframe: 'confettiUpLeft',   color: '#8FA99B', size: 8,  delay: 120, dur: 1.3 },
  { keyframe: 'confettiUpRight',  color: '#B55233', size: 6,  delay: 240, dur: 1.2 },
  { keyframe: 'confettiUp',       color: '#1F3A32', size: 9,  delay: 60,  dur: 1.5 },
  { keyframe: 'confettiLeftLow',  color: '#B55233', size: 5,  delay: 180, dur: 1.0 },
  { keyframe: 'confettiRightLow', color: '#8FA99B', size: 7,  delay: 300, dur: 1.1 },
  { keyframe: 'confettiLeft',     color: '#2A2A2A', size: 6,  delay: 220, dur: 0.9 },
  { keyframe: 'confettiRight',    color: '#B55233', size: 10, delay: 140, dur: 1.4 },
]

// ── Idea 5: Celebration screen shown after brand is saved ──────────────────
function BrandSavedCelebration({ onContinue }: { onContinue: () => void }) {
  const [typedText, setTypedText] = useState('')
  const TARGET = '> BRAND DNA LOCKED IN.'

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      await sleep(400)
      for (let i = 0; i <= TARGET.length && !cancelled; i++) {
        setTypedText(TARGET.slice(0, i))
        await sleep(45)
      }
    }
    run()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="relative overflow-hidden text-center py-16 px-4">
      {/* Confetti burst */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {CONFETTI_PIECES.map((p, i) => (
          <span
            key={i}
            className="absolute"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: i % 3 === 0 ? '50%' : '2px',
              top: '50%',
              left: '50%',
              animationName: p.keyframe,
              animationDuration: `${p.dur}s`,
              animationDelay: `${p.delay}ms`,
              animationFillMode: 'both',
              animationTimingFunction: 'cubic-bezier(0.2, 0.8, 0.3, 1)',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Check circle */}
        <div
          className="w-16 h-16 rounded-full bg-forest/10 border-2 border-forest/40 flex items-center justify-center mx-auto mb-8 animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        >
          <svg
            className="w-7 h-7 text-forest"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Typewriter headline */}
        <div
          className="font-mono text-xl sm:text-2xl text-graphite font-bold animate-fade-in-up"
          style={{ animationDelay: '300ms' }}
        >
          {typedText}
          <span className="animate-pulse opacity-60">█</span>
        </div>

        <p
          className="text-sm text-gray-500 mt-5 max-w-sm mx-auto leading-relaxed animate-fade-in-up"
          style={{ animationDelay: '1800ms' }}
        >
          Your brand profile is ready. Every ad you create will now be tuned to your voice.
        </p>

        <button
          onClick={onContinue}
          className="btn-primary mt-8 animate-fade-in-up"
          style={{ animationDelay: '2400ms' }}
        >
          [ START CREATING → ]
        </button>
      </div>
    </div>
  )
}

// ── Main wizard ────────────────────────────────────────────────────────────
interface BrandWizardProps {
  existingBrand?: Brand
  /** Pre-filled data from a brand URL scan */
  initialData?: BrandDNA
}

export default function BrandWizard({ existingBrand, initialData }: BrandWizardProps) {
  const [step, setStep] = useState(1)
  const [slideDir, setSlideDir] = useState<'forward' | 'back'>('forward')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [celebrated, setCelebrated] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Build default values: existingBrand takes priority, then initialData from scan
  const defaultValues: Partial<BrandFormData> = existingBrand
    ? {
        company_name: existingBrand.company_name,
        what_we_do: existingBrand.what_we_do,
        target_audience: existingBrand.target_audience,
        unique_differentiator: existingBrand.unique_differentiator || '',
        voice_summary: existingBrand.voice_summary || '',
        personality_traits: existingBrand.personality_traits?.join(', ') || '',
        words_to_use: existingBrand.words_to_use?.join(', ') || '',
        words_to_avoid: existingBrand.words_to_avoid?.join(', ') || '',
        sample_copy: existingBrand.sample_copy,
        brand_colors: existingBrand.brand_colors?.join(', ') || '',
        typography_notes: existingBrand.typography_notes || '',
      }
    : initialData
    ? {
        company_name: initialData.company_name || '',
        what_we_do: initialData.what_we_do || '',
        target_audience: initialData.target_audience || '',
        unique_differentiator: initialData.unique_differentiator || '',
        voice_summary: initialData.voice_summary || '',
        personality_traits: initialData.personality_traits?.join(', ') || '',
        words_to_use: initialData.words_to_use?.join(', ') || '',
        words_to_avoid: initialData.words_to_avoid?.join(', ') || '',
        sample_copy: initialData.sample_copy || '',
        brand_colors: initialData.brand_colors?.join(', ') || '',
        typography_notes: initialData.typography_notes || '',
      }
    : {}

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues,
  })

  // Idea 6: watch brand_colors for live swatch preview
  const brandColorsRaw = useWatch({ control, name: 'brand_colors' })
  const livePaletteColors = useMemo(() => {
    if (!brandColorsRaw) return []
    return brandColorsRaw
      .split(',')
      .map((c) => c.trim())
      .filter((c) => /^#[0-9A-Fa-f]{6}$/.test(c))
  }, [brandColorsRaw])

  const onSubmit = async (data: BrandFormData) => {
    setLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const payload = {
        user_id: user.id,
        company_name: data.company_name,
        what_we_do: data.what_we_do,
        target_audience: data.target_audience,
        unique_differentiator: data.unique_differentiator || null,
        voice_summary: data.voice_summary || null,
        personality_traits: parseCommaSeparated(data.personality_traits),
        words_to_use: parseCommaSeparated(data.words_to_use),
        words_to_avoid: parseCommaSeparated(data.words_to_avoid),
        sample_copy: data.sample_copy,
        brand_colors: parseColors(data.brand_colors),
        typography_notes: data.typography_notes || null,
        website_url: initialData?.source_url ?? null,
        updated_at: new Date().toISOString(),
      }

      if (existingBrand) {
        const { error: updateError } = await supabase
          .from('brands')
          .update(payload)
          .eq('user_id', user.id)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from('brands').insert(payload)
        if (insertError) throw insertError
      }

      // Idea 5: show celebration instead of navigating immediately
      setCelebrated(true)
    } catch (err: any) {
      console.error('Brand save error:', err)
      setError(err.message || 'Failed to save brand')
    } finally {
      setLoading(false)
    }
  }

  // Idea 3: track slide direction alongside step
  const nextStep = () => {
    setSlideDir('forward')
    setStep((prev) => Math.min(prev + 1, 4))
  }
  const prevStep = () => {
    setSlideDir('back')
    setStep((prev) => Math.max(prev - 1, 1))
  }

  // Idea 5: celebration screen
  if (celebrated) {
    return (
      <BrandSavedCelebration onContinue={() => router.push('/create')} />
    )
  }

  // Idea 3: animate class based on direction
  const slideClass = slideDir === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto">
      {error && (
        <div className="mb-6 p-4 border border-outline bg-red-50 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Step 1: Core Identity */}
      {step === 1 && (
        <div key="step-1" className={`space-y-6 ${slideClass}`}>
          <h2 className="text-xl uppercase font-mono header-accent">STEP 1: CORE IDENTITY</h2>

          <div>
            <label className="block text-sm uppercase font-mono mb-2">
              Company Name <span className="text-rust">*</span>
            </label>
            <input {...register('company_name')} className="w-full border border-gray-400 rounded px-3 py-2 focus:outline-none focus:border-graphite" />
            {errors.company_name && (
              <p className="text-red-600 text-sm mt-1">{errors.company_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm uppercase font-mono mb-2">
              What We Do <span className="text-rust">*</span>
            </label>
            <p className="text-xs text-gray-600 mb-2">
              Describe the specific products, solutions, and/or services you provide — not your mission statement
            </p>
            <textarea {...register('what_we_do')} rows={3} className="w-full border border-gray-400 rounded px-3 py-2 focus:outline-none focus:border-graphite" />
            {errors.what_we_do && (
              <p className="text-red-600 text-sm mt-1">{errors.what_we_do.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm uppercase font-mono mb-2">
              Target Audience <span className="text-rust">*</span>
            </label>
            <input
              {...register('target_audience')}
              className="w-full border border-gray-400 rounded px-3 py-2 focus:outline-none focus:border-graphite"
              placeholder="e.g., Small business owners, B2B marketers"
            />
            {errors.target_audience && (
              <p className="text-red-600 text-sm mt-1">{errors.target_audience.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm uppercase font-mono mb-2">
              Unique Differentiator
            </label>
            <p className="text-xs text-gray-600 mb-2">What makes you different?</p>
            <input
              {...register('unique_differentiator')}
              className="w-full border border-gray-400 rounded px-3 py-2 focus:outline-none focus:border-graphite"
              placeholder="Optional"
            />
          </div>

          <button type="button" onClick={nextStep} className="btn-primary w-full">
            NEXT: VOICE
          </button>
        </div>
      )}

      {/* Step 2: Voice & Messaging */}
      {step === 2 && (
        <div key="step-2" className={`space-y-6 ${slideClass}`}>
          <h2 className="text-xl uppercase font-mono header-accent">
            STEP 2: VOICE & MESSAGING
          </h2>

          <div>
            <label className="block text-sm uppercase font-mono mb-2">Voice Summary</label>
            <p className="text-xs text-gray-600 mb-2">How should your brand sound?</p>
            <textarea
              {...register('voice_summary')}
              rows={3}
              className="w-full border border-gray-400 rounded px-3 py-2 focus:outline-none focus:border-graphite"
              placeholder="e.g., Professional yet approachable, witty and bold"
            />
          </div>

          <div>
            <label className="block text-sm uppercase font-mono mb-2">
              Personality Traits (comma-separated, max 5)
            </label>
            <input
              {...register('personality_traits')}
              className="w-full border border-gray-400 rounded px-3 py-2 focus:outline-none focus:border-graphite"
              placeholder="e.g., professional, witty, bold"
            />
          </div>

          <div>
            <label className="block text-sm uppercase font-mono mb-2">
              Words to Use (comma-separated)
            </label>
            <input
              {...register('words_to_use')}
              className="w-full border border-gray-400 rounded px-3 py-2 focus:outline-none focus:border-graphite"
              placeholder="e.g., innovative, results-driven, strategic"
            />
          </div>

          <div>
            <label className="block text-sm uppercase font-mono mb-2">
              Words to Avoid (comma-separated)
            </label>
            <input
              {...register('words_to_avoid')}
              className="w-full border border-gray-400 rounded px-3 py-2 focus:outline-none focus:border-graphite"
              placeholder="e.g., synergy, leverage, disrupt"
            />
          </div>

          <div className="flex gap-4">
            <button type="button" onClick={prevStep} className="btn-secondary flex-1">
              BACK
            </button>
            <button type="button" onClick={nextStep} className="btn-primary flex-1">
              NEXT: VISUAL
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Visual Identity */}
      {step === 3 && (
        <div key="step-3" className={`space-y-6 ${slideClass}`}>
          <h2 className="text-xl uppercase font-mono header-accent">
            STEP 3: VISUAL IDENTITY
          </h2>

          <div>
            <label className="block text-sm uppercase font-mono mb-2">
              Brand Colors (hex codes, comma-separated)
            </label>
            <p className="text-xs text-gray-600 mb-2">e.g., #FF5733, #33FF57, #3357FF</p>
            <input
              {...register('brand_colors')}
              className="w-full border border-gray-400 rounded px-3 py-2 focus:outline-none focus:border-graphite"
              placeholder="#FF5733, #33FF57"
            />

            {/* Idea 6: Live color swatch preview */}
            {livePaletteColors.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {livePaletteColors.map((color, i) => (
                  <div
                    key={color}
                    className="flex flex-col items-center gap-1 animate-paint-in"
                    style={{ animationDelay: `${i * 90}ms` }}
                  >
                    <div
                      className="w-12 h-12 border border-outline rounded shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <p className="text-xs font-mono uppercase text-gray-500">{color}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm uppercase font-mono mb-2">Typography Notes</label>
            <p className="text-xs text-gray-600 mb-2">
              Fonts, weights, styles you prefer (optional)
            </p>
            <textarea
              {...register('typography_notes')}
              rows={3}
              className="w-full border border-gray-400 rounded px-3 py-2 focus:outline-none focus:border-graphite"
              placeholder="e.g., Sans-serif, bold headlines, clean and modern"
            />
          </div>

          <div className="flex gap-4">
            <button type="button" onClick={prevStep} className="btn-secondary flex-1">
              BACK
            </button>
            <button type="button" onClick={nextStep} className="btn-primary flex-1">
              NEXT: SAMPLE COPY
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Sample Copy */}
      {step === 4 && (
        <div key="step-4" className={`space-y-6 ${slideClass}`}>
          <h2 className="text-xl uppercase font-mono header-accent">STEP 4: SAMPLE COPY</h2>

          <div>
            <label className="block text-sm uppercase font-mono mb-2">
              Sample Copy Examples <span className="text-rust">*</span>
            </label>
            <p className="text-sm text-gray-600 mb-2">
              Paste examples of copy that represents your brand voice (emails, social posts,
              website copy)
            </p>
            <textarea
              {...register('sample_copy')}
              rows={10}
              className="w-full border border-gray-400 rounded px-3 py-2 focus:outline-none focus:border-graphite"
              placeholder="Paste your brand's copy examples here..."
            />
            {errors.sample_copy && (
              <p className="text-red-600 text-sm mt-1">{errors.sample_copy.message}</p>
            )}
          </div>

          <div className="flex gap-4">
            <button type="button" onClick={prevStep} className="btn-secondary flex-1">
              BACK
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent animate-spin" />
                  Saving...
                </span>
              ) : (
                existingBrand ? 'UPDATE BRAND' : 'SAVE BRAND'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Progress indicator — active segments grow wider */}
      <div className="mt-8 flex justify-center gap-2 items-center">
        {[1, 2, 3, 4].map((num) => (
          <div
            key={num}
            className={`h-1 rounded-full transition-all duration-500 ${
              num <= step ? 'bg-rust w-16' : 'bg-gray-300 w-8'
            }`}
          />
        ))}
      </div>
    </form>
  )
}
