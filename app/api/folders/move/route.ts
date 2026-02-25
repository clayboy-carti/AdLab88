import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const {
    folderId,
    adIds,
    videoIds,
  }: { folderId: string | null; adIds?: string[]; videoIds?: string[] } = await req.json()

  const updates: Promise<{ error: { message: string } | null }>[] = []

  if (adIds && adIds.length > 0) {
    updates.push(
      supabase
        .from('generated_ads')
        .update({ folder_id: folderId })
        .in('id', adIds)
        .eq('user_id', user.id)
    )
  }

  if (videoIds && videoIds.length > 0) {
    updates.push(
      supabase
        .from('generated_videos')
        .update({ folder_id: folderId })
        .in('id', videoIds)
        .eq('user_id', user.id)
    )
  }

  const results = await Promise.all(updates)
  const err = results.find((r) => r.error)?.error
  if (err) return NextResponse.json({ error: err.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
