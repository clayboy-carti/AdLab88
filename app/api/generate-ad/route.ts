import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import {
  generateAdCopy,
  generateImageWithGemini,
  buildReplicatePrompt,
  analyzeReferenceAndCreatePrompt,
} from '@/lib/ai'
import type { Brand } from '@/types/database'

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
    const { reference_image_id, user_context } = body
    const userContext: string | undefined = user_context?.trim() || undefined

    if (userContext) {
      console.log(`[Generate] Ad context provided: "${userContext}"`)
    }

    // Reference image is now OPTIONAL (two modes: reference-based or original)
    const hasReference = !!reference_image_id
    console.log(
      `[Generate] Mode: ${hasReference ? 'Reference-based template swap' : 'Original framework-driven creation'}`
    )

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

    // 4-5. Conditionally fetch and prepare reference image (only if provided)
    let referenceImageUrl: string | null = null

    if (hasReference) {
      const { data: referenceImage, error: imageError } = await supabase
        .from('reference_images')
        .select('*')
        .eq('id', reference_image_id)
        .eq('user_id', user.id)
        .single()

      if (imageError || !referenceImage) {
        console.error('[Generate] Reference image not found:', imageError)
        return NextResponse.json(
          { error: 'Reference image not found or access denied' },
          { status: 404 }
        )
      }

      console.log(`[Generate] Reference image loaded: ${referenceImage.file_name}`)

      // Generate signed URL for reference image
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
      console.log('[Generate] Reference image signed URL created')
    } else {
      console.log('[Generate] No reference image - will generate original ad')
    }

    // 6. Generate ad copy with OpenAI (frameworks for copy only)
    console.log('[Generate] === PHASE 1: Generating copy with frameworks ===')
    const generatedCopy = await generateAdCopy(brand as Brand, 1, userContext)

    console.log('[Generate] ✅ Copy generation complete')
    console.log(`[Generate]   Hook: ${generatedCopy.hook}`)
    console.log(`[Generate]   Positioning: ${generatedCopy.positioning_angle}`)

    // 7. Build Replicate prompt (changes based on mode)
    console.log('[Generate] === PHASE 2: Building image prompt ===')
    let imagePrompt: string

    if (hasReference) {
      // REFERENCE MODE: Use GPT-4o Vision to analyze reference and create detailed prompt
      console.log('[Generate] Analyzing reference image with GPT-4o Vision...')
      imagePrompt = await analyzeReferenceAndCreatePrompt(
        referenceImageUrl!,
        brand as Brand,
        generatedCopy,
        userContext
      )
    } else {
      // ORIGINAL MODE: Use framework-driven detailed prompt
      imagePrompt = buildReplicatePrompt(generatedCopy, brand as Brand, 'original', userContext)
    }

    console.log('[Generate] ✅ Image prompt built')
    console.log(`[Generate]   Prompt length: ${imagePrompt.length} chars`)

    // 8. Generate image with Gemini
    console.log('[Generate] === PHASE 3: Generating image with Gemini 2.0 Flash ===')
    const generatedImage = await generateImageWithGemini(
      referenceImageUrl, // null if no reference (text-to-image mode)
      imagePrompt,
      user.id,
      hasReference ? 0.35 : 0.0,
      1 // 1 retry
    )

    console.log('[Generate] ✅ Image generation complete')
    console.log(`[Generate]   Storage path: ${generatedImage.storagePath}`)

    // 9. Save to generated_ads table
    console.log('[Generate] === PHASE 4: Saving to database ===')
    const { data: adRecord, error: dbError } = await supabase
      .from('generated_ads')
      .insert({
        user_id: user.id,
        brand_id: brand.id,
        reference_image_id: reference_image_id || null,
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
