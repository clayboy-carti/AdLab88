import { createClient } from '@/lib/supabase/server'
import BrandSetupFlow from '@/components/brand/BrandSetupFlow'
import BrandDashboard from '@/components/brand/BrandDashboard'
import type { Brand } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function BrandPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: brand } = await supabase
    .from('brands')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (brand) {
    return (
      <div className="min-h-screen bg-grid-paper">
        <div className="max-w-6xl mx-auto p-4 lg:p-8">
          <BrandDashboard brand={brand as Brand} />
        </div>
      </div>
    )
  }

  return <BrandSetupFlow />
}
