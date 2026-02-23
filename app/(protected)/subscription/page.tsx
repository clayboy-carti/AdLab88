import { createClient } from '@/lib/supabase/server'
import SubscriptionManager from '@/components/subscription/SubscriptionManager'
import type { SubscriptionTier } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function SubscriptionPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // When billing is integrated, fetch the tier from a subscriptions table.
  // For now every user starts on the free tier.
  const currentTier: SubscriptionTier =
    (user.user_metadata?.subscription_tier as SubscriptionTier) ?? 'free'

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8 border-b-2 border-rust pb-4">
        <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">Settings</p>
        <h1 className="text-3xl font-mono font-bold text-graphite uppercase">Subscription</h1>
      </div>

      <SubscriptionManager currentTier={currentTier} />
    </div>
  )
}
