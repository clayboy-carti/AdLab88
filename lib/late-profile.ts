/**
 * Server-only helper.
 * Returns the Late profile ID for the given user, creating one lazily if needed.
 *
 * Late profiles map 1-to-1 with our brands. The ID is persisted in
 * brands.late_profile_id so we only call Late's API once per user.
 */

import { createClient } from '@/lib/supabase/server'
import { createLateProfile } from '@/lib/late'

export async function getOrCreateLateProfileId(userId: string): Promise<string> {
  const supabase = createClient()

  const { data: brand, error } = await supabase
    .from('brands')
    .select('id, late_profile_id, company_name')
    .eq('user_id', userId)
    .single()

  if (error || !brand) {
    throw new Error('Brand not found. Complete brand setup before connecting accounts.')
  }

  if (brand.late_profile_id) {
    return brand.late_profile_id
  }

  // First time: create a profile in Late named after the brand
  const lateProfileId = await createLateProfile(brand.company_name)

  await supabase
    .from('brands')
    .update({ late_profile_id: lateProfileId })
    .eq('id', brand.id)

  return lateProfileId
}
