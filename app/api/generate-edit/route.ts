import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateImageWithGemini } from '@/lib/ai/gemini-image'
import { buildReplicatePrompt } from '@/lib/ai/image-prompt-builder-replicate'
import { generateImageVariants } from '@/lib/image-variants'
import type { Brand } from '@/types/database'
import type { GeneratedAd } from '@/lib/validations/generation'

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { source_ad_id, instruction, aspect_ratio, image_quality } = body

    if (!source_ad_id || !instruction?.trim()) {
      return NextResponse.json({ error: 'source_ad_id and instruction are required' }, { status: 400 })
    }

    const imageQuality: '1K' | '2K' = image_quality === '2K' ? '2K' : '1K'
    const imageAspectRatio: string = aspect_ratio || '1:1'

    // Fetch source ad
    const { data: sourceAd, error: adError } = await supabase
      .from('generated_ads')
      .select('*')
      .eq('id', source_ad_id)
      .eq('user_id', user.id)
      .single()

    if (adError || !sourceAd) {
      return NextResponse.json({ error: 'Source ad not found' }, { status: 404 })
    }

    // Fetch brand
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand profile required' }, { status: 400 })
    }

    // Reuse copy from source ad, inject instruction into the prompt
    const generatedCopy: GeneratedAd = {
      positioning_angle: sourceAd.positioning_angle,
      angle_justification: sourceAd.angle_justification,
      hook: sourceAd.hook,
      caption: sourceAd.caption,
      cta: sourceAd.cta,
      brand_voice_match: sourceAd.brand_voice_match,
      framework_applied: sourceAd.framework_applied,
      target_platform: sourceAd.target_platform,
      estimated_performance: sourceAd.estimated_performance,
    }

    // Build image prompt from original copy + instruction as context
    const basePrompt = buildReplicatePrompt(
      generatedCopy,
      brand as Brand,
      'reference',
      instruction.trim()
    )

    // Append the edit instruction explicitly
    const imagePrompt = `${basePrompt}\n\nEDIT INSTRUCTION: ${instruction.trim()}`

    // Use the original generated image as the reference for editing
    let referenceUrl: string | null = null
    if (sourceAd.storage_path) {
      const { data: signedUrlData } = await supabase.storage
        .from('generated-ads')
        .createSignedUrl(sourceAd.storage_path, 604800)
      referenceUrl = signedUrlData?.signedUrl ?? null
    }

    console.log(`[GenerateEdit] Iterating on ad ${source_ad_id} with instruction: "${instruction}"`)

    const generatedImage = await generateImageWithGemini(
      referenceUrl,
      imagePrompt,
      user.id,
      0.35,
      1,
      imageQuality,
      imageAspectRatio,
      0.8
    )

    // Save variant to generated_ads
    const { data: adRecord, error: dbError } = await supabase
      .from('generated_ads')
      .insert({
        user_id: user.id,
        brand_id: brand.id,
        positioning_angle: sourceAd.positioning_angle,
        angle_justification: sourceAd.angle_justification,
        hook: sourceAd.hook,
        caption: sourceAd.caption,
        cta: sourceAd.cta,
        image_generation_prompt: imagePrompt,
        brand_voice_match: sourceAd.brand_voice_match,
        framework_applied: sourceAd.framework_applied,
        target_platform: sourceAd.target_platform,
        estimated_performance: sourceAd.estimated_performance,
        storage_path: generatedImage.storagePath,
        image_quality: imageQuality,
        aspect_ratio: imageAspectRatio,
        title: `${sourceAd.title ?? sourceAd.hook} (Iteration)`,
        folder_id: sourceAd.folder_id ?? null,
      })
      .select()
      .single()

    if (dbError) {
      console.error('[GenerateEdit] DB error:', dbError)
      return NextResponse.json({ error: 'Failed to save iteration' }, { status: 500 })
    }

    const { data: signedUrlData } = await supabase.storage
      .from('generated-ads')
      .createSignedUrl(generatedImage.storagePath, 604800)

    if (signedUrlData?.signedUrl) {
      const expiresAt = new Date(Date.now() + 604800 * 1000).toISOString()
      await supabase.from('generated_ads').update({
        signed_url: signedUrlData.signedUrl,
        signed_url_expires_at: expiresAt,
      }).eq('id', adRecord.id)
    }

    // Generate image variants (no-op if sharp not installed)
    const variants = await generateImageVariants(generatedImage.storagePath, user.id)
    if (variants.thumb_path || variants.preview_512_path || variants.preview_1024_path) {
      await supabase.from('generated_ads').update(variants).eq('id', adRecord.id)
    }

    return NextResponse.json(
      {
        message: 'Iteration generated successfully',
        ad: {
          ...adRecord,
          generatedImageUrl: signedUrlData?.signedUrl ?? null,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[GenerateEdit] ERROR:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate iteration' },
      { status: 500 }
    )
  }
}
