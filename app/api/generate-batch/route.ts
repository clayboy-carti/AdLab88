import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import {
  generateBatchAdCopy,
  generateImageWithGemini,
  buildReplicatePrompt,
  detectMemeTemplate,
} from '@/lib/ai'
import type { MemeContext } from '@/lib/ai/meme-detector'
import type { Brand } from '@/types/database'
import type { GeneratedAd } from '@/lib/validations/generation'

export const maxDuration = 120

const BATCH_ANGLES = [
  'The Specialist',
  'The Results',
  'The Anti-Category',
  'The Speed',
  'The Simplicity',
] as const

const CREATIVITY_TEMPERATURES: Record<number, number> = {
  1: 0.2,
  2: 0.6,
  3: 1.0,
  4: 1.4,
}

export async function POST(request: Request) {
  console.log('[Batch] Starting batch ad generation...')

  try {
    const supabase = createClient()

    // 1. Auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`[Batch] User authenticated: ${user.id}`)

    // 2. Parse request body
    const body = await request.json()
    const { user_context, image_quality, aspect_ratio, creativity } = body
    const userContext: string | undefined = user_context?.trim() || undefined
    const imageQuality: '1K' | '2K' = image_quality === '2K' ? '2K' : '1K'
    const imageAspectRatio: string = aspect_ratio || '1:1'
    const creativityNotch = Number(creativity) || 2
    const imageTemperature = CREATIVITY_TEMPERATURES[creativityNotch] ?? 0.6

    console.log(`[Batch] Quality: ${imageQuality}, Aspect: ${imageAspectRatio}, Creativity: ${creativityNotch}`)

    // 3. Fetch brand
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (brandError || !brand) {
      return NextResponse.json(
        { error: 'Brand profile required. Please complete brand setup first.' },
        { status: 400 }
      )
    }

    console.log(`[Batch] Brand loaded: ${brand.company_name}`)

    // 4. Auto-fetch latest reference image (if any)
    let referenceImageUrl: string | null = null
    let usedReferenceImageId: string | null = null

    const { data: referenceImages } = await supabase
      .from('reference_images')
      .select('id, file_name, storage_path')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    const referenceImage = referenceImages?.[0] ?? null
    const hasReference = !!referenceImage

    if (hasReference) {
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('reference-images')
        .createSignedUrl(referenceImage!.storage_path, 3600)

      if (urlError || !signedUrlData?.signedUrl) {
        return NextResponse.json({ error: 'Failed to access reference image' }, { status: 500 })
      }

      referenceImageUrl = signedUrlData.signedUrl
      usedReferenceImageId = referenceImage!.id
      console.log(`[Batch] Reference image loaded: ${referenceImage!.file_name}`)
    } else {
      console.log('[Batch] No reference image — original mode')
    }

    // 5. Generate 5 copy variants in ONE GPT call
    console.log('[Batch] === PHASE 1: Batch copy generation ===')
    const variants: GeneratedAd[] = await generateBatchAdCopy(brand as Brand, BATCH_ANGLES, userContext)
    console.log(`[Batch] ✅ ${variants.length} copy variants generated`)

    // 6. Meme detection — run ONCE using variants[0] as representative
    let memeContext: MemeContext | null = null
    if (hasReference) {
      console.log('[Batch] === PHASE 2a: Meme detection (once, shared) ===')
      memeContext = await detectMemeTemplate(
        referenceImageUrl!,
        brand as Brand,
        variants[0],
        userContext
      )
      if (memeContext) {
        console.log(`[Batch] ✅ Meme detected: ${memeContext.templateName}`)
      } else {
        console.log('[Batch] No meme detected — standard reference mode')
      }
    }

    // 7. Build 5 image prompts
    console.log('[Batch] === PHASE 2b: Building image prompts ===')
    const imagePrompts: string[] = variants.map((copy) =>
      buildReplicatePrompt(
        copy,
        brand as Brand,
        hasReference ? 'reference' : 'original',
        userContext,
        memeContext
      )
    )
    console.log('[Batch] ✅ 5 image prompts built')

    // 8. Generate 5 images in parallel — use allSettled for partial success
    console.log('[Batch] === PHASE 3: Parallel image generation ===')
    const imageResults = await Promise.allSettled(
      variants.map((_, i) =>
        generateImageWithGemini(
          referenceImageUrl,
          imagePrompts[i],
          user.id,
          hasReference ? 0.35 : 0.0,
          0, // 0 retries in batch — retrying 5 parallel calls risks timeout stacking
          imageQuality,
          imageAspectRatio,
          imageTemperature
        )
      )
    )

    const successCount = imageResults.filter((r) => r.status === 'fulfilled').length
    console.log(`[Batch] Image generation: ${successCount}/5 succeeded`)

    if (successCount < 3) {
      return NextResponse.json(
        { error: `Too many image generation failures (${5 - successCount}/5 failed). Please try again.` },
        { status: 500 }
      )
    }

    // 9. Build variant result objects
    type VariantResult = {
      copy: GeneratedAd
      storagePath: string | null
      imageError: string | null
    }

    const variantResults: VariantResult[] = imageResults.map((result, i) => ({
      copy: variants[i],
      storagePath: result.status === 'fulfilled' ? result.value.storagePath : null,
      imageError: result.status === 'rejected' ? String(result.reason?.message ?? 'Unknown') : null,
    }))

    // 10. Save successful variants to DB in parallel
    console.log('[Batch] === PHASE 4: Saving to database ===')
    const batchId = crypto.randomUUID()
    const dbInserts = await Promise.allSettled(
      variantResults.map((v, i) => {
        if (!v.storagePath) return Promise.resolve(null)
        return supabase
          .from('generated_ads')
          .insert({
            user_id: user.id,
            brand_id: brand.id,
            reference_image_id: usedReferenceImageId,
            positioning_angle: v.copy.positioning_angle,
            angle_justification: v.copy.angle_justification,
            hook: v.copy.hook,
            caption: v.copy.caption,
            cta: v.copy.cta,
            image_generation_prompt: imagePrompts[i],
            brand_voice_match: v.copy.brand_voice_match,
            framework_applied: v.copy.framework_applied,
            target_platform: v.copy.target_platform,
            estimated_performance: v.copy.estimated_performance,
            storage_path: v.storagePath,
            image_quality: imageQuality,
            aspect_ratio: imageAspectRatio,
            batch_id: batchId,
          })
          .select()
          .single()
      })
    )

    // 11. Generate signed URLs for previews
    const signedUrlResults = await Promise.allSettled(
      variantResults.map((v) => {
        if (!v.storagePath) return Promise.resolve(null)
        return supabase.storage
          .from('generated-ads')
          .createSignedUrl(v.storagePath, 3600)
      })
    )

    // 12. Build response
    const ads = variantResults.map((v, i) => {
      const dbResult = dbInserts[i]
      const urlResult = signedUrlResults[i]

      const dbRecord =
        dbResult.status === 'fulfilled' && dbResult.value !== null
          ? (dbResult.value as any).data
          : null

      const signedUrl =
        urlResult.status === 'fulfilled' && urlResult.value !== null
          ? (urlResult.value as any).data?.signedUrl ?? null
          : null

      return {
        ...(dbRecord ?? {}),
        positioning_angle: v.copy.positioning_angle,
        hook: v.copy.hook,
        caption: v.copy.caption,
        cta: v.copy.cta,
        framework_applied: v.copy.framework_applied,
        target_platform: v.copy.target_platform,
        generatedImageUrl: signedUrl,
        imageGenerationFailed: v.storagePath === null,
      }
    })

    const savedCount = ads.filter((a) => !a.imageGenerationFailed).length
    console.log(`[Batch] ✅ Complete — ${savedCount}/5 ads saved to library`)

    return NextResponse.json(
      {
        message:
          savedCount === 5
            ? 'Batch generated successfully'
            : `Batch partially generated (${savedCount}/5)`,
        total: 5,
        succeeded: savedCount,
        failed: 5 - savedCount,
        ads,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[Batch] ERROR:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate batch',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
