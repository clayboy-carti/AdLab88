import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateVideoWithGrok } from '@/lib/ai/replicate'

export const maxDuration = 120

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const body = await req.json()
    const { ad_id, motion_prompt, aspect_ratio } = body as { ad_id: string; motion_prompt?: string; aspect_ratio?: string }

    if (!ad_id) {
      return NextResponse.json({ error: 'ad_id is required' }, { status: 400 })
    }

    // Fetch the source ad so we can build a rich scene-aware video prompt
    const { data: sourceAd, error: adError } = await supabase
      .from('generated_ads')
      .select('id, image_generation_prompt, hook, storage_path')
      .eq('id', ad_id)
      .eq('user_id', user.id)
      .single()

    if (adError || !sourceAd) {
      return NextResponse.json({ error: 'Source ad not found' }, { status: 404 })
    }

    // Build the video prompt from available context
    const sceneContext = sourceAd.image_generation_prompt
    const motionPart = motion_prompt?.trim()
      ? motion_prompt.trim()
      : 'slow cinematic camera movement, subtle product motion, gentle ambient animation'

    let videoPrompt: string
    if (sceneContext) {
      // Condense the original image prompt to key scene details and append motion instructions
      const trimmedScene = sceneContext.substring(0, 400)
      videoPrompt = `${trimmedScene}. Motion: ${motionPart}`
    } else {
      videoPrompt = motionPart
    }

    // Create a signed URL for the source image. Supabase signed URLs are standard
    // HTTPS URLs with auth baked into query params — no extra headers needed —
    // so Replicate's model runner can fetch them directly as a file URL.
    let sourceImageUrl: string | undefined
    if (sourceAd.storage_path) {
      const { data: signedData, error: signedError } = await supabase.storage
        .from('generated-ads')
        .createSignedUrl(sourceAd.storage_path, 600) // 10-min window
      if (signedError || !signedData?.signedUrl) {
        console.warn('[generate-video] Could not create signed URL, falling back to text-to-video:', signedError?.message)
      } else {
        sourceImageUrl = signedData.signedUrl
        console.log('[generate-video] Source image signed URL created')
      }
    }

    console.log('[generate-video] Starting video generation for ad:', ad_id)
    console.log('[generate-video] Video prompt:', videoPrompt.substring(0, 200))

    const { storagePath, videoUrl } = await generateVideoWithGrok(videoPrompt, user.id, sourceImageUrl, aspect_ratio)

    // Save record to generated_videos table
    const { data: videoRecord, error: insertError } = await supabase
      .from('generated_videos')
      .insert({
        user_id: user.id,
        source_ad_id: ad_id,
        motion_prompt: motion_prompt?.trim() || null,
        storage_path: storagePath,
        content_type: 'product_video',
      })
      .select()
      .single()

    if (insertError) {
      console.error('[generate-video] DB insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save video record' }, { status: 500 })
    }

    // Create a signed URL valid for 1 hour so the client can play the video immediately
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('generated-ads')
      .createSignedUrl(storagePath, 3600)

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('[generate-video] Signed URL error:', signedUrlError)
      return NextResponse.json({ error: 'Failed to create video URL' }, { status: 500 })
    }

    console.log('[generate-video] ✅ Complete')

    return NextResponse.json({
      video: {
        id: videoRecord.id,
        storagePath,
        videoUrl: signedUrlData.signedUrl,
      },
    })
  } catch (err: any) {
    console.error('[generate-video] Unhandled error:', err)
    return NextResponse.json(
      { error: err.message || 'Video generation failed' },
      { status: 500 }
    )
  }
}
