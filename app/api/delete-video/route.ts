import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function DELETE(request: Request) {
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get('videoId')

  if (!videoId) {
    return NextResponse.json({ error: 'videoId is required' }, { status: 400 })
  }

  // Verify ownership before doing anything destructive
  const { data: video, error: fetchError } = await supabase
    .from('generated_videos')
    .select('id, storage_path')
    .eq('id', videoId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Delete from storage
  if (video.storage_path) {
    const { error: storageError } = await admin.storage
      .from('generated-ads')
      .remove([video.storage_path])

    if (storageError) {
      console.error('[DeleteVideo] Storage error:', storageError)
    }
  }

  // Delete the database record
  const { error: deleteError } = await admin
    .from('generated_videos')
    .delete()
    .eq('id', videoId)
    .eq('user_id', user.id)

  if (deleteError) {
    console.error('[DeleteVideo] DB error:', deleteError)
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
