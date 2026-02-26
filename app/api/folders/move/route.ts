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

  const errors: string[] = []

  if (adIds && adIds.length > 0) {
    const { error } = await supabase
      .from('generated_ads')
      .update({ folder_id: folderId })
      .in('id', adIds)
      .eq('user_id', user.id)
    if (error) errors.push(error.message)
  }

  if (videoIds && videoIds.length > 0) {
    const { error } = await supabase
      .from('generated_videos')
      .update({ folder_id: folderId })
      .in('id', videoIds)
      .eq('user_id', user.id)
    if (error) errors.push(error.message)
  }

  if (errors.length > 0) return NextResponse.json({ error: errors[0] }, { status: 500 })

  return NextResponse.json({ success: true })
}
