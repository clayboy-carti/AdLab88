import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import ProfileForm from '@/components/profile/ProfileForm'
import ConnectedAccounts from '@/components/profile/ConnectedAccounts'
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

  const initials = profile.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : profile.email.slice(0, 2).toUpperCase()

  return (
    <div className="w-full p-4 lg:p-8 max-w-2xl">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-mono header-accent">Profile</h1>
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mt-2">
          Manage your account settings
        </p>
      </div>

      {/* Avatar + member since */}
      <div className="card flex items-center gap-5 mb-6">
        <div className="w-14 h-14 rounded-full bg-rust flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-mono font-bold text-white leading-none">{initials}</span>
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="font-mono text-base font-semibold text-graphite">
            {profile.full_name || profile.email}
          </p>
          <p className="font-mono text-xs text-graphite/50 uppercase tracking-widest">
            Member since{' '}
            {new Date(profile.created_at).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Account settings form */}
      <ProfileForm profile={profile} />

      {/* Connected social accounts */}
      <Suspense fallback={null}>
        <ConnectedAccounts />
      </Suspense>

    </div>
  )
}
