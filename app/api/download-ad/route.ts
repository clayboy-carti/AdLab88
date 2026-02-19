import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const adId = searchParams.get('adId')

  if (!adId) {
    return NextResponse.json({ error: 'adId is required' }, { status: 400 })
  }

  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch the ad, enforcing ownership via user_id
  const { data: ad, error: adError } = await supabase
    .from('generated_ads')
    .select('id, storage_path, created_at')
    .eq('id', adId)
    .eq('user_id', user.id)
    .single()

  if (adError || !ad) {
    return NextResponse.json({ error: 'Ad not found or access denied' }, { status: 404 })
  }

  if (!ad.storage_path) {
    return NextResponse.json({ error: 'No image file for this ad' }, { status: 404 })
  }

  // Download the file from storage server-side
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('generated-ads')
    .download(ad.storage_path)

  if (downloadError || !fileData) {
    console.error('[Download] Storage error:', downloadError)
    return NextResponse.json({ error: 'Failed to download image' }, { status: 500 })
  }

  const date = new Date(ad.created_at).toISOString().split('T')[0]
  const filename = `adlab88_ad_${date}.png`

  return new NextResponse(fileData, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'x-filename': filename,
    },
  })
}
