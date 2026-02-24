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
    const { ad_id, motion_prompt } = body as { ad_id: string; motion_prompt?: string }

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

    // Download the source image and encode it as a base64 data URI.
    // Passing a Blob/File relies on Replicate's files API which may 4xx and doesn't
    // fall back. A data URI is a plain string — no upload step, no MIME inference.
    let sourceImageDataUri: string | undefined
    if (sourceAd.storage_path) {
      const { data: imageBlob, error: downloadError } = await supabase.storage
        .from('generated-ads')
        .download(sourceAd.storage_path)
      if (downloadError || !imageBlob) {
        console.warn('[generate-video] Could not download source image, falling back to text-to-video:', downloadError?.message)
      } else {
        const ext = sourceAd.storage_path.split('.').pop()?.toLowerCase() ?? 'png'
        const mimeMap: Record<string, string> = {
          png: 'image/png',
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          webp: 'image/webp',
        }
        const mimeType = mimeMap[ext] ?? 'image/png'
        const arrayBuffer = await imageBlob.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        sourceImageDataUri = `data:${mimeType};base64,${base64}`
        console.log('[generate-video] Source image encoded:', mimeType, arrayBuffer.byteLength, 'bytes')
      }
    }

    console.log('[generate-video] Starting video generation for ad:', ad_id)
    console.log('[generate-video] Video prompt:', videoPrompt.substring(0, 200))

    // Generate the video via Grok — passes image data URI as reference when available
    const { storagePath, videoUrl } = await generateVideoWithGrok(videoPrompt, user.id, sourceImageDataUri)

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
