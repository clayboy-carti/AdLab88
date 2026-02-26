import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import {
  generateAdCopy,
  generateImageWithGemini,
  generateImageWithSeedream,
  buildReplicatePrompt,
  detectMemeTemplate,
} from '@/lib/ai'
import type { MemeContext } from '@/lib/ai/meme-detector'
import type { Brand } from '@/types/database'
import type { GeneratedAd } from '@/lib/validations/generation'

export async function POST(request: Request) {
  console.log('[Generate] Starting ad generation...')

  try {
    const supabase = createClient()

    // 1. Validate authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`[Generate] User authenticated: ${user.id}`)

    // 2. Parse request body
    const body = await request.json()
    const { user_context, image_quality, aspect_ratio, creativity, post_type, image_model, title, reference_image_id } = body
    const userContext: string | undefined = user_context?.trim() || undefined
    const imageQuality: '1K' | '2K' = image_quality === '2K' ? '2K' : '1K'
    const imageAspectRatio: string = aspect_ratio || '1:1'
    const postType: 'ad' | 'product_mockup' = post_type === 'product_mockup' ? 'product_mockup' : 'ad'
    const imageModelChoice: 'gemini' | 'seedream' = image_model === 'seedream' ? 'seedream' : 'gemini'

    // Map 4-notch creativity slider (1–4) to Gemini temperature
    const CREATIVITY_TEMPERATURES: Record<number, number> = {
      1: 0.2, // Strict  — closely follows reference
      2: 0.6, // Balanced — default
      3: 1.0, // Creative — more interpretation
      4: 1.4, // Loose   — freely reimagined
    }
    const creativityNotch = Number(creativity) || 2
    const imageTemperature = CREATIVITY_TEMPERATURES[creativityNotch] ?? 0.6

    if (userContext) {
      console.log(`[Generate] Ad context provided: "${userContext}"`)
    }
    console.log(`[Generate] Image quality: ${imageQuality}, Aspect ratio: ${imageAspectRatio}, Creativity: ${creativityNotch} (temp: ${imageTemperature}), Model: ${imageModelChoice}`)

    // 3. Fetch brand (ensure it exists)
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (brandError || !brand) {
      console.error('[Generate] Brand not found:', brandError)
      return NextResponse.json(
        { error: 'Brand profile required. Please complete brand setup first.' },
        { status: 400 }
      )
    }

    console.log(`[Generate] Brand loaded: ${brand.company_name}`)

    // 4-5. Resolve reference image
    // Product mockups: use the explicitly selected reference_image_id from the request body.
    // Ads: auto-fetch the user's most recently uploaded image (legacy behavior).
    let referenceImageUrl: string | null = null
    let usedReferenceImageId: string | null = null

    if (postType === 'product_mockup') {
      const selectedRefId: string | null = reference_image_id || null

      if (selectedRefId) {
        const { data: refImg } = await supabase
          .from('reference_images')
          .select('id, file_name, storage_path')
          .eq('user_id', user.id)
          .eq('id', selectedRefId)
          .single()

        if (refImg) {
          const { data: signedUrlData, error: urlError } = await supabase.storage
            .from('reference-images')
            .createSignedUrl(refImg.storage_path, 3600)

          if (urlError || !signedUrlData?.signedUrl) {
            console.error('[Generate] Failed to create signed URL:', urlError)
            return NextResponse.json(
              { error: 'Failed to access reference image' },
              { status: 500 }
            )
          }

          referenceImageUrl = signedUrlData.signedUrl
          usedReferenceImageId = refImg.id
          console.log(`[Generate] Product mockup: using selected reference (${refImg.file_name})`)
        }
      } else {
        console.log('[Generate] Product mockup: no reference selected — generating without reference')
      }
    } else {
      // Ads: auto-fetch the most recently uploaded reference image
      const { data: referenceImages } = await supabase
        .from('reference_images')
        .select('id, file_name, storage_path')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      const referenceImage = referenceImages?.[0] ?? null

      if (referenceImage) {
        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from('reference-images')
          .createSignedUrl(referenceImage.storage_path, 3600)

        if (urlError || !signedUrlData?.signedUrl) {
          console.error('[Generate] Failed to create signed URL:', urlError)
          return NextResponse.json(
            { error: 'Failed to access reference image' },
            { status: 500 }
          )
        }

        referenceImageUrl = signedUrlData.signedUrl
        usedReferenceImageId = referenceImage.id
        console.log(`[Generate] Ad: auto-using most recent reference (${referenceImage.file_name})`)
      } else {
        console.log('[Generate] No reference images uploaded — will generate original ad')
      }
    }

    const hasReference = !!referenceImageUrl
    console.log(
      `[Generate] Mode: ${hasReference ? `Reference-based (ID: ${usedReferenceImageId})` : 'Original framework-driven creation'}`
    )

    // 6. Generate copy — skip OpenAI for product mockups (visual is the focus)
    let generatedCopy: GeneratedAd

    if (postType === 'product_mockup') {
      console.log('[Generate] === PHASE 1: Product mockup — using default copy ===')
      const sceneLabel = userContext ? userContext.slice(0, 60) : 'lifestyle shot'
      generatedCopy = {
        positioning_angle: 'Product Mockup',
        angle_justification: 'Lifestyle product placement — visual focus',
        hook: `${brand.company_name} — ${sceneLabel}`,
        caption: userContext || `Product lifestyle shot for ${brand.company_name}.`,
        cta: 'Shop Now',
        brand_voice_match: 'Visual-first',
        framework_applied: 'Product Mockup',
        target_platform: 'Instagram / Social',
        estimated_performance: undefined,
      }
      console.log('[Generate] ✅ Mockup defaults set')
    } else {
      console.log('[Generate] === PHASE 1: Generating copy with frameworks ===')
      generatedCopy = await generateAdCopy(brand as Brand, 1, userContext)
      console.log('[Generate] ✅ Copy generation complete')
      console.log(`[Generate]   Hook: ${generatedCopy.hook}`)
      console.log(`[Generate]   Positioning: ${generatedCopy.positioning_angle}`)
    }

    // 7. Detect meme template (ad reference mode only — skip for mockups)
    let memeContext: MemeContext | null = null
    if (hasReference && postType === 'ad') {
      console.log('[Generate] === PHASE 2a: Detecting meme template ===')
      memeContext = await detectMemeTemplate(
        referenceImageUrl!,
        brand as Brand,
        generatedCopy,
        userContext
      )
      if (memeContext) {
        console.log(`[Generate] ✅ Meme detected: ${memeContext.templateName}`)
      } else {
        console.log('[Generate] No meme template detected — using standard reference mode')
      }
    }

    // 8. Build image prompt
    console.log('[Generate] === PHASE 2b: Building image prompt ===')
    let imagePrompt: string

    // Product mockup: place reference product into a scene
    // Reference mode: meme-aware (panel text) or standard format-preserving
    // Original mode: framework-driven creative prompt
    const promptMode =
      postType === 'product_mockup'
        ? 'product_mockup'
        : hasReference
          ? 'reference'
          : 'original'

    imagePrompt = buildReplicatePrompt(
      generatedCopy,
      brand as Brand,
      promptMode,
      userContext,
      memeContext
    )

    console.log('[Generate] ✅ Image prompt built')
    console.log(`[Generate]   Prompt length: ${imagePrompt.length} chars`)

    // 8. Generate image (model selected by caller)
    let generatedImage: { storagePath: string; generatedImageUrl: string }

    if (imageModelChoice === 'seedream') {
      console.log('[Generate] === PHASE 3: Generating image with Seedream 4 (Replicate) ===')
      generatedImage = await generateImageWithSeedream(
        referenceImageUrl,
        imagePrompt,
        user.id,
        imageQuality,
        imageAspectRatio,
        1 // 1 retry
      )
    } else {
      console.log('[Generate] === PHASE 3: Generating image with Gemini 2.0 Flash ===')
      generatedImage = await generateImageWithGemini(
        referenceImageUrl, // null if no reference (text-to-image mode)
        imagePrompt,
        user.id,
        hasReference ? 0.35 : 0.0,
        1, // 1 retry
        imageQuality,
        imageAspectRatio,
        imageTemperature
      )
    }

    console.log('[Generate] ✅ Image generation complete')
    console.log(`[Generate]   Storage path: ${generatedImage.storagePath}`)

    // 9. Save to generated_ads table
    console.log('[Generate] === PHASE 4: Saving to database ===')
    const { data: adRecord, error: dbError } = await supabase
      .from('generated_ads')
      .insert({
        user_id: user.id,
        brand_id: brand.id,
        reference_image_id: usedReferenceImageId,
        positioning_angle: generatedCopy.positioning_angle,
        angle_justification: generatedCopy.angle_justification,
        hook: generatedCopy.hook,
        caption: generatedCopy.caption,
        cta: generatedCopy.cta,
        image_generation_prompt: imagePrompt,
        brand_voice_match: generatedCopy.brand_voice_match,
        framework_applied: generatedCopy.framework_applied,
        target_platform: generatedCopy.target_platform,
        estimated_performance: generatedCopy.estimated_performance,
        storage_path: generatedImage.storagePath,
        image_quality: imageQuality,
        aspect_ratio: imageAspectRatio,
        title: title?.trim() || null,
      })
      .select()
      .single()

    if (dbError) {
      console.error('[Generate] Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save generated ad' },
        { status: 500 }
      )
    }

    console.log('[Generate] ✅ Ad saved to database')
    console.log(`[Generate] Ad ID: ${adRecord.id}`)

    // 10. Generate signed URL for the generated image (for immediate preview)
    const { data: generatedSignedUrl } = await supabase.storage
      .from('generated-ads')
      .createSignedUrl(generatedImage.storagePath, 3600)

    // 11. Return complete ad record with signed URL
    console.log('[Generate] === GENERATION COMPLETE ===')
    console.log(
      `[Generate] Successfully generated ${hasReference ? 'reference-based' : 'original'} ad!`
    )

    return NextResponse.json(
      {
        message: 'Ad generated successfully',
        ad: {
          ...adRecord,
          generatedImageUrl: generatedSignedUrl?.signedUrl || null,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[Generate] ERROR:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate ad',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

export const maxDuration = 60 // Allow up to 60 seconds for generation
