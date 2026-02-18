'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  brandSchema,
  type BrandFormData,
  parseCommaSeparated,
  parseColors,
} from '@/lib/validations/brand'
import type { Brand } from '@/types/database'

interface BrandWizardProps {
  existingBrand?: Brand
}

export default function BrandWizard({ existingBrand }: BrandWizardProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: existingBrand
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
      : {},
  })

  const onSubmit = async (data: BrandFormData) => {
    setLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Prepare payload with parsed arrays
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
        updated_at: new Date().toISOString(),
      }

      if (existingBrand) {
        // Update existing brand
        const { error: updateError } = await supabase
          .from('brands')
          .update(payload)
          .eq('user_id', user.id)

        if (updateError) throw updateError
      } else {
        // Create new brand
        const { error: insertError } = await supabase.from('brands').insert(payload)

        if (insertError) throw insertError
      }

      router.push('/create')
    } catch (err: any) {
      console.error('Brand save error:', err)
      setError(err.message || 'Failed to save brand')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4))
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1))

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto">
      {error && (
        <div className="mb-6 p-4 border border-outline bg-red-50 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Step 1: Core Identity */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl uppercase font-mono header-accent">STEP 1: CORE IDENTITY</h2>

          <div>
            <label className="block text-sm uppercase font-mono mb-2">
              Company Name <span className="text-rust">*</span>
            </label>
            <input {...register('company_name')} className="w-full" />
            {errors.company_name && (
              <p className="text-red-600 text-sm mt-1">{errors.company_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm uppercase font-mono mb-2">
              What We Do <span className="text-rust">*</span>
            </label>
            <p className="text-xs text-gray-600 mb-2">1-2 sentences about your business</p>
            <textarea {...register('what_we_do')} rows={3} className="w-full" />
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
              className="w-full"
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
              className="w-full"
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
        <div className="space-y-6">
          <h2 className="text-xl uppercase font-mono header-accent">
            STEP 2: VOICE & MESSAGING
          </h2>

          <div>
            <label className="block text-sm uppercase font-mono mb-2">Voice Summary</label>
            <p className="text-xs text-gray-600 mb-2">How should your brand sound?</p>
            <textarea
              {...register('voice_summary')}
              rows={3}
              className="w-full"
              placeholder="e.g., Professional yet approachable, witty and bold"
            />
          </div>

          <div>
            <label className="block text-sm uppercase font-mono mb-2">
              Personality Traits (comma-separated, max 5)
            </label>
            <input
              {...register('personality_traits')}
              className="w-full"
              placeholder="e.g., professional, witty, bold"
            />
          </div>

          <div>
            <label className="block text-sm uppercase font-mono mb-2">
              Words to Use (comma-separated)
            </label>
            <input
              {...register('words_to_use')}
              className="w-full"
              placeholder="e.g., innovative, results-driven, strategic"
            />
          </div>

          <div>
            <label className="block text-sm uppercase font-mono mb-2">
              Words to Avoid (comma-separated)
            </label>
            <input
              {...register('words_to_avoid')}
              className="w-full"
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
        <div className="space-y-6">
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
              className="w-full"
              placeholder="#FF5733, #33FF57"
            />
          </div>

          <div>
            <label className="block text-sm uppercase font-mono mb-2">Typography Notes</label>
            <p className="text-xs text-gray-600 mb-2">
              Fonts, weights, styles you prefer (optional)
            </p>
            <textarea
              {...register('typography_notes')}
              rows={3}
              className="w-full"
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
        <div className="space-y-6">
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
              className="w-full"
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
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'SAVING...' : existingBrand ? 'UPDATE BRAND' : 'SAVE BRAND'}
            </button>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="mt-8 flex justify-center gap-2">
        {[1, 2, 3, 4].map((num) => (
          <div
            key={num}
            className={`w-16 h-1 ${num <= step ? 'bg-rust' : 'bg-gray-300'}`}
          />
        ))}
      </div>
    </form>
  )
}
