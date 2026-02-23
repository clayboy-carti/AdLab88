import { createClient } from '@/lib/supabase/server'
import ProfileForm from '@/components/profile/ProfileForm'
import type { UserProfile } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const profile: UserProfile = {
    id: user.id,
    email: user.email ?? '',
    full_name: (user.user_metadata?.full_name as string) ?? '',
    created_at: user.created_at,
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-8 border-b-2 border-rust pb-4">
        <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">Settings</p>
        <h1 className="text-3xl font-mono font-bold text-graphite uppercase">Profile</h1>
      </div>

      <ProfileForm profile={profile} />

      <div className="mt-8 p-4 bg-white border border-outline">
        <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">Member Since</p>
        <p className="font-mono text-graphite text-sm">
          {new Date(profile.created_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>
    </div>
  )
}
