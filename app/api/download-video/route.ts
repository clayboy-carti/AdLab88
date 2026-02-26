import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get('videoId')

  if (!videoId) {
    return NextResponse.json({ error: 'videoId is required' }, { status: 400 })
  }

  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: video, error: videoError } = await supabase
    .from('generated_videos')
    .select('id, storage_path, created_at')
    .eq('id', videoId)
    .eq('user_id', user.id)
    .single()

  if (videoError || !video) {
    return NextResponse.json({ error: 'Video not found or access denied' }, { status: 404 })
  }

  if (!video.storage_path) {
    return NextResponse.json({ error: 'No video file for this entry' }, { status: 404 })
  }

  const { data: fileData, error: downloadError } = await supabase.storage
    .from('generated-ads')
    .download(video.storage_path)

  if (downloadError || !fileData) {
    console.error('[DownloadVideo] Storage error:', downloadError)
    return NextResponse.json({ error: 'Failed to download video' }, { status: 500 })
  }

  const date = new Date(video.created_at).toISOString().split('T')[0]
  const filename = `adlab88_video_${date}.mp4`

  return new NextResponse(fileData, {
    status: 200,
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'x-filename': filename,
    },
  })
}
