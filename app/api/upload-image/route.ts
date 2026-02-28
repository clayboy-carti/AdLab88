import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // 1. Validate authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get the file from form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // 3. Validate file type
    const allowedTypes = ['image/jpeg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPEG and PNG files are allowed' },
        { status: 400 }
      )
    }

    // 4. Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be under 5MB' },
        { status: 400 }
      )
    }

    // 5. Upload to Supabase Storage
    const fileName = `${user.id}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('reference-images')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // 6. Save metadata to database
    const { data: imageRecord, error: dbError } = await supabase
      .from('reference_images')
      .insert({
        user_id: user.id,
        storage_path: fileName,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single()

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('reference-images').remove([fileName])
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save image metadata' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Image uploaded successfully',
        image: imageRecord,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
