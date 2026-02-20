import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function DELETE(request: Request) {
  // Authenticate the request with the anon client (respects RLS for reads)
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

  // Verify ownership before doing anything destructive
  const { data: ad, error: fetchError } = await supabase
    .from('generated_ads')
    .select('id, storage_path')
    .eq('id', adId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !ad) {
    return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
  }

  // Use service role client for writes — bypasses RLS which would otherwise
  // silently block the delete if no DELETE policy exists on the table.
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Delete from storage if there's an image
  if (ad.storage_path) {
    const { error: storageError } = await admin.storage
      .from('generated-ads')
      .remove([ad.storage_path])

    if (storageError) {
      console.error('[DeleteAd] Storage error:', storageError)
      // Continue to delete the DB record even if storage fails
    }
  }

  // Delete the database record
  const { error: deleteError } = await admin
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
