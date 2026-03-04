import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const VALID_CATEGORIES = ['product', 'packaging', 'lifestyle', 'logo', 'other']

export async function GET() {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: assets, error } = await supabase
      .from('brand_assets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[BrandAssets] DB error:', error)
      return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
    }

    if (!assets || assets.length === 0) {
      return NextResponse.json({ assets: [] })
    }

    // Generate signed URLs for all assets
    const paths = assets.map((a) => a.storage_path)
    const { data: signedUrls, error: urlError } = await supabase.storage
      .from('brand-assets')
      .createSignedUrls(paths, 604800)

    if (urlError) {
      console.error('[BrandAssets] Signed URL error:', urlError)
      return NextResponse.json({ error: 'Failed to generate asset URLs' }, { status: 500 })
    }

    const urlMap = new Map(signedUrls?.map((s) => [s.path, s.signedUrl]) ?? [])
    const assetsWithUrls = assets.map((a) => ({
      ...a,
      url: urlMap.get(a.storage_path) ?? null,
    }))

    return NextResponse.json({ assets: assetsWithUrls })
  } catch (error: any) {
    console.error('[BrandAssets] GET error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const category = (formData.get('category') as string) || 'other'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, and WebP files are allowed' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size must be under 10MB' }, { status: 400 })
    }

    const safeCategory = VALID_CATEGORIES.includes(category) ? category : 'other'
    const storagePath = `${user.id}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('brand-assets')
      .upload(storagePath, file, { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error('[BrandAssets] Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    const { data: asset, error: dbError } = await supabase
      .from('brand_assets')
      .insert({
        user_id: user.id,
        storage_path: storagePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        category: safeCategory,
      })
      .select()
      .single()

    if (dbError) {
      await supabase.storage.from('brand-assets').remove([storagePath])
      console.error('[BrandAssets] DB error:', dbError)
      return NextResponse.json({ error: 'Failed to save asset' }, { status: 500 })
    }

    const { data: signedUrlData } = await supabase.storage
      .from('brand-assets')
      .createSignedUrl(storagePath, 604800)

    return NextResponse.json(
      { asset: { ...asset, url: signedUrlData?.signedUrl ?? null } },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[BrandAssets] POST error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
