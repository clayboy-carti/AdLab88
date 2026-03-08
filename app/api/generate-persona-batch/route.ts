import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import {
  generateImageWithGemini,
  buildReplicatePrompt,
  reverseEngineerAd,
  type GeminiModel,
} from '@/lib/ai'
import type { Brand } from '@/types/database'
import type { GeneratedAd } from '@/lib/validations/generation'

export const maxDuration = 120

const CREATIVITY_TEMPERATURES: Record<number, number> = {
  1: 0.2,
  2: 0.6,
  3: 1.0,
  4: 1.4,
}

export async function POST(request: Request) {
  console.log('[PersonaBatch] Starting persona-driven batch generation...')

  let spentCredits = 0

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

    console.log(`[PersonaBatch] User authenticated: ${user.id}`)

    // 2. Parse request body
    const body = await request.json()
    const { style_reference_image_id, product_asset_id, user_context, image_quality, aspect_ratio, creativity, title, ads_per_persona, gemini_model } = body

    if (!style_reference_image_id) {
      return NextResponse.json({ error: 'style_reference_image_id is required' }, { status: 400 })
    }
    if (!product_asset_id) {
      return NextResponse.json({ error: 'product_asset_id is required' }, { status: 400 })
    }

    const userContext: string | undefined = user_context?.trim() || undefined
    const imageQuality: '1K' | '2K' = image_quality === '2K' ? '2K' : '1K'
    const imageAspectRatio: string = aspect_ratio || '1:1'
    const creativityNotch = Number(creativity) || 2
    const imageTemperature = CREATIVITY_TEMPERATURES[creativityNotch] ?? 0.6
    const adsPerPersona = Math.min(Math.max(Number(ads_per_persona) || 1, 1), 5)
    const geminiModelKey: 'pro' | 'flash' = gemini_model === 'gemini-flash' ? 'flash' : 'pro'

    console.log(`[PersonaBatch] Quality: ${imageQuality}, Aspect: ${imageAspectRatio}, Creativity: ${creativityNotch}, Model: gemini-${geminiModelKey}`)

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

    console.log(`[PersonaBatch] Brand loaded: ${brand.company_name}`)

    // 4. Fetch brand intelligence profiles
    const { data: intelligenceProfiles, error: intelligenceError } = await supabase
      .from('brand_intelligence')
      .select('*')
      .eq('user_id', user.id)
      .eq('brand_id', brand.id)
      .order('created_at', { ascending: true })

    if (intelligenceError || !intelligenceProfiles || intelligenceProfiles.length === 0) {
      return NextResponse.json(
        { error: 'No brand intelligence profiles found. Please generate them in the Brand section first.' },
        { status: 400 }
      )
    }

    const profiles = intelligenceProfiles.slice(0, 5) // cap at 5
    console.log(`[PersonaBatch] Found ${profiles.length} intelligence profile(s), ${adsPerPersona} ad(s) per persona`)

    // Flatten profiles × adsPerPersona into a flat job list
    const jobs = profiles.flatMap((profile, pi) =>
      Array.from({ length: adsPerPersona }, (_, vi) => ({ profile, profileIndex: pi, variationIndex: vi }))
    )
    const batchSize = jobs.length

    // 5. Spend credits upfront
    const { error: creditError } = await supabase.rpc('spend_credit', { p_user_id: user.id, p_amount: batchSize })
    if (!creditError) spentCredits = batchSize
    if (creditError) {
      const insufficient = creditError.message?.includes('insufficient_credits')
      return NextResponse.json(
        { error: insufficient ? `You need at least ${batchSize} credits to run this generation.` : 'Failed to process credit' },
        { status: insufficient ? 402 : 500 }
      )
    }

    // 6. Resolve signed URLs for both images (separate tables/buckets)
    console.log('[PersonaBatch] === PHASE 1: Resolving image URLs ===')

    // Style reference — from reference_images / reference-images bucket
    const { data: styleRefRow, error: styleRefError } = await supabase
      .from('reference_images')
      .select('id, file_name, storage_path')
      .eq('user_id', user.id)
      .eq('id', style_reference_image_id)
      .single()

    if (styleRefError || !styleRefRow) {
      await supabase.rpc('refund_credit', { p_user_id: user.id, p_amount: batchSize })
      return NextResponse.json({ error: 'Style reference image not found' }, { status: 400 })
    }

    const { data: styleUrlData, error: styleUrlError } = await supabase.storage
      .from('reference-images')
      .createSignedUrl(styleRefRow.storage_path, 604800)

    if (styleUrlError || !styleUrlData?.signedUrl) {
      await supabase.rpc('refund_credit', { p_user_id: user.id, p_amount: batchSize })
      return NextResponse.json({ error: 'Failed to access style reference image' }, { status: 500 })
    }

    const styleRefUrl = styleUrlData.signedUrl
    console.log(`[PersonaBatch] Style ref: ${styleRefRow.file_name}`)

    // Product asset — from brand_assets / brand-assets bucket
    const { data: productRow, error: productError } = await supabase
      .from('brand_assets')
      .select('id, file_name, storage_path')
      .eq('user_id', user.id)
      .eq('id', product_asset_id)
      .single()

    if (productError || !productRow) {
      await supabase.rpc('refund_credit', { p_user_id: user.id, p_amount: batchSize })
      return NextResponse.json({ error: 'Product asset not found' }, { status: 400 })
    }

    const { data: productUrlData, error: productUrlError } = await supabase.storage
      .from('brand-assets')
      .createSignedUrl(productRow.storage_path, 604800)

    if (productUrlError || !productUrlData?.signedUrl) {
      await supabase.rpc('refund_credit', { p_user_id: user.id, p_amount: batchSize })
      return NextResponse.json({ error: 'Failed to access product asset' }, { status: 500 })
    }

    const productUrl = productUrlData.signedUrl
    console.log(`[PersonaBatch] Product asset: ${productRow.file_name}`)

    // 7. Reverse-engineer the style reference ad
    console.log('[PersonaBatch] === PHASE 2: Reverse engineering style reference ===')
    let stylePrompt: string | null = null
    try {
      const reverseResult = await reverseEngineerAd(styleRefUrl, brand as Brand)
      stylePrompt = reverseResult.stylePrompt || null
      console.log('[PersonaBatch] ✅ Style prompt extracted')
      console.log(`[PersonaBatch]   Style prompt length: ${stylePrompt?.length ?? 0} chars`)
    } catch (err: any) {
      console.warn('[PersonaBatch] Reverse engineer failed — continuing without style prompt:', err.message)
    }

    // 8. Build copy and image prompts for each persona profile
    console.log('[PersonaBatch] === PHASE 3: Building prompts per persona ===')

    const copyVariants: GeneratedAd[] = jobs.map(({ profile, variationIndex }) => ({
      positioning_angle: profile.angle ?? 'Brand Benefit',
      angle_justification: `Targeting persona: ${profile.persona ?? 'General audience'}`,
      hook: profile.copy_hook ?? `Discover ${brand.company_name}`,
      caption: [
        profile.pain_point ? `${profile.pain_point}` : '',
        profile.angle ? `${profile.angle}` : '',
        userContext ? `${userContext}` : '',
      ]
        .filter(Boolean)
        .join(' '),
      cta: 'Shop Now',
      brand_voice_match: profile.emotion ?? 'Authentic',
      framework_applied: `Persona: ${(profile.persona ?? 'General').slice(0, 40)}${adsPerPersona > 1 ? ` · V${variationIndex + 1}` : ''}`,
      target_platform: 'Instagram / Social',
      estimated_performance: undefined,
    }))

    const imagePrompts: string[] = jobs.map((_, i) => {
      return buildReplicatePrompt(copyVariants[i], brand as Brand, 'original', userContext, null, stylePrompt)
    })

    console.log('[PersonaBatch] ✅ Prompts built for all personas')

    // 9. Generate images in parallel — product image + style prompt sent together
    console.log('[PersonaBatch] === PHASE 4: Parallel image generation ===')
    const imageResults = await Promise.allSettled(
      imagePrompts.map((prompt) =>
        generateImageWithGemini(
          [productUrl], // inject the product asset as reference
          prompt,
          user.id,
          0.35, // moderate reference adherence — show product but follow style prompt
          0, // no retries in batch
          imageQuality,
          imageAspectRatio,
          imageTemperature,
          geminiModelKey
        )
      )
    )

    const successCount = imageResults.filter((r) => r.status === 'fulfilled').length
    console.log(`[PersonaBatch] Image generation: ${successCount}/${batchSize} succeeded`)

    if (successCount === 0) {
      await supabase.rpc('refund_credit', { p_user_id: user.id, p_amount: batchSize })
      return NextResponse.json(
        { error: 'All image generations failed. Please try again.' },
        { status: 500 }
      )
    }

    // 10. Generate signed URLs for generated images
    console.log('[PersonaBatch] === PHASE 5: Generating signed URLs ===')
    const signedUrlExpiry = 604800
    const signedUrlExpiresAt = new Date(Date.now() + signedUrlExpiry * 1000).toISOString()

    const generatedStoragePaths = imageResults.map((r) =>
      r.status === 'fulfilled' ? r.value.storagePath : null
    )

    const outSignedUrlResults = await Promise.allSettled(
      generatedStoragePaths.map((path) => {
        if (!path) return Promise.resolve(null)
        return supabase.storage
          .from('generated-ads')
          .createSignedUrl(path, signedUrlExpiry)
      })
    )

    // 11. Save to DB
    console.log('[PersonaBatch] === PHASE 6: Saving to database ===')
    const batchId = crypto.randomUUID()

    const dbInserts = await Promise.allSettled(
      jobs.map(({ profile }, i) => {
        const storagePath = generatedStoragePaths[i]
        if (!storagePath) return Promise.resolve(null)

        const urlResult = outSignedUrlResults[i]
        const signedUrl =
          urlResult.status === 'fulfilled' && urlResult.value !== null
            ? (urlResult.value as any).data?.signedUrl ?? null
            : null

        return supabase
          .from('generated_ads')
          .insert({
            user_id: user.id,
            brand_id: brand.id,
            reference_image_id: style_reference_image_id,
            positioning_angle: copyVariants[i].positioning_angle,
            angle_justification: copyVariants[i].angle_justification,
            hook: copyVariants[i].hook,
            caption: copyVariants[i].caption,
            cta: copyVariants[i].cta,
            image_generation_prompt: imagePrompts[i],
            brand_voice_match: copyVariants[i].brand_voice_match,
            framework_applied: copyVariants[i].framework_applied,
            target_platform: copyVariants[i].target_platform,
            estimated_performance: copyVariants[i].estimated_performance,
            storage_path: storagePath,
            image_quality: imageQuality,
            aspect_ratio: imageAspectRatio,
            batch_id: batchId,
            title: title?.trim() || null,
            signed_url: signedUrl,
            signed_url_expires_at: signedUrl ? signedUrlExpiresAt : null,
          })
          .select()
          .single()
      })
    )

    // 12. Build response
    const ads = jobs.map(({ profile }, i) => {
      const dbResult = dbInserts[i]
      const urlResult = outSignedUrlResults[i]

      const dbRecord =
        dbResult.status === 'fulfilled' && dbResult.value !== null
          ? (dbResult.value as any).data
          : null

      const signedUrl =
        urlResult.status === 'fulfilled' && urlResult.value !== null
          ? (urlResult.value as any).data?.signedUrl ?? null
          : null

      const failed = generatedStoragePaths[i] === null

      return {
        ...(dbRecord ?? {}),
        positioning_angle: copyVariants[i].positioning_angle,
        hook: copyVariants[i].hook,
        caption: copyVariants[i].caption,
        cta: copyVariants[i].cta,
        framework_applied: copyVariants[i].framework_applied,
        target_platform: copyVariants[i].target_platform,
        generatedImageUrl: signedUrl,
        imageGenerationFailed: failed,
        persona: profile.persona,
      }
    })

    const savedCount = ads.filter((a) => !a.imageGenerationFailed).length

    // Refund credits for failed generations
    const failedCount = batchSize - savedCount
    if (failedCount > 0) {
      await supabase.rpc('refund_credit', { p_user_id: user.id, p_amount: failedCount })
      console.log(`[PersonaBatch] Refunded ${failedCount} credit(s) for failed generations`)
    }

    console.log(`[PersonaBatch] ✅ Complete — ${savedCount}/${batchSize} ads saved`)

    return NextResponse.json(
      {
        message:
          savedCount === batchSize
            ? 'Persona batch generated successfully'
            : `Persona batch partially generated (${savedCount}/${batchSize})`,
        total: batchSize,
        succeeded: savedCount,
        failed: failedCount,
        ads,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[PersonaBatch] ERROR:', error)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user && spentCredits > 0) await supabase.rpc('refund_credit', { p_user_id: user.id, p_amount: spentCredits })
    } catch (_) {}
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate persona batch',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
