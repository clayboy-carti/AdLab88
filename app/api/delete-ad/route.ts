import { createClient } from '@/lib/supabase/server'
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
  const adId = searchParams.get('adId')

  if (!adId) {
    return NextResponse.json({ error: 'adId is required' }, { status: 400 })
  }

  // Fetch the ad to verify ownership and get storage_path
  const { data: ad, error: fetchError } = await supabase
    .from('generated_ads')
    .select('id, storage_path')
    .eq('id', adId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !ad) {
    return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
  }

  // Delete from storage if there's an image
  if (ad.storage_path) {
    const { error: storageError } = await supabase.storage
      .from('generated-ads')
      .remove([ad.storage_path])

    if (storageError) {
      console.error('[DeleteAd] Storage error:', storageError)
      // Continue to delete the DB record even if storage fails
    }
  }

  // Delete the database record
  const { error: deleteError } = await supabase
    .from('generated_ads')
    .delete()
    .eq('id', adId)
    .eq('user_id', user.id)

  if (deleteError) {
    console.error('[DeleteAd] DB error:', deleteError)
    return NextResponse.json({ error: 'Failed to delete ad' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
