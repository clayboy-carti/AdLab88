import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's brand (required for generated_ads table)
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, WebP, and GIF files are allowed' },
        { status: 400 }
      )
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be under 10MB' },
        { status: 400 }
      )
    }

    // Upload to generated-ads bucket (same bucket used by the rest of the library)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const storagePath = `${user.id}/${Date.now()}-upload.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('generated-ads')
      .upload(storagePath, file, { contentType: file.type, upsert: false })

    if (uploadError) {
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Derive a display title from the filename (strip extension)
    const title = file.name.replace(/\.[^.]+$/, '') || 'Uploaded Image'

    const { data: adRow, error: dbError } = await supabase
      .from('generated_ads')
      .insert({
        user_id: user.id,
        brand_id: brand.id,
        storage_path: storagePath,
        title,
        positioning_angle: 'user-upload',
        hook: '',
        caption: '',
        cta: '',
      })
      .select('id, user_id, batch_id, positioning_angle, hook, caption, cta, storage_path, framework_applied, target_platform, created_at, image_quality, aspect_ratio, folder_id, title')
      .single()

    if (dbError) {
      await supabase.storage.from('generated-ads').remove([storagePath])
      return NextResponse.json({ error: 'Failed to save record' }, { status: 500 })
    }

    // Generate a signed URL for immediate display
    const { data: signed } = await supabase.storage
      .from('generated-ads')
      .createSignedUrl(storagePath, 3600)

    return NextResponse.json({
      ad: { ...adRow, signedUrl: signed?.signedUrl ?? null },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
