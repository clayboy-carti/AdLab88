export type UserProfile = {
  id: string
  email: string
  full_name: string
  created_at: string
}

export type SubscriptionTier = 'free' | 'pro' | 'business'

export type Brand = {
  id: string
  user_id: string
  company_name: string
  what_we_do: string
  target_audience: string
  unique_differentiator?: string
  voice_summary?: string
  personality_traits?: string[]
  words_to_use?: string[]
  words_to_avoid?: string[]
  sample_copy: string
  brand_colors?: string[]
  typography_notes?: string
  website_url?: string
  late_profile_id?: string
  created_at: string
  updated_at: string
}

/** AI-extracted brand DNA from a URL scan */
export type BrandDNA = {
  company_name?: string
  what_we_do?: string
  target_audience?: string
  unique_differentiator?: string
  voice_summary?: string
  personality_traits?: string[]
  words_to_use?: string[]
  words_to_avoid?: string[]
  sample_copy?: string
  brand_colors?: string[]
  typography_notes?: string
  source_url: string
}

export type BrandScanStatus = 'processing' | 'complete' | 'failed'

export type BrandScan = {
  id: string
  user_id: string
  url: string
  status: BrandScanStatus
  extracted_data?: BrandDNA
  error?: string
  created_at: string
  completed_at?: string
}

export type ReferenceImage = {
  id: string
  user_id: string
  storage_path: string
  file_name: string
  file_size: number
  mime_type: string
  created_at: string
}

export type GeneratedAd = {
  id: string
  user_id: string
  brand_id: string
  reference_image_id?: string
  positioning_angle: string
  angle_justification?: string
  hook: string
  caption: string
  cta: string
  storage_path: string | null
  image_generation_prompt?: string
  brand_voice_match?: string
  framework_applied?: string
  target_platform?: string
  estimated_performance?: string
  created_at: string
}

export type GeneratedVideo = {
  id: string
  user_id: string
  source_ad_id: string | null
  motion_prompt: string | null
  storage_path: string
  content_type: 'product_video'
  created_at: string
}

export type AssetCategory = 'product' | 'packaging' | 'lifestyle' | 'logo' | 'other'

export type BrandAsset = {
  id: string
  user_id: string
  storage_path: string
  file_name: string
  file_size: number
  mime_type: string
  category: AssetCategory
  created_at: string
}

export type IntelligenceSource = 'generated' | 'manual'

export type BrandIntelligence = {
  id: string
  user_id: string
  brand_id: string
  persona: string | null
  pain_point: string | null
  angle: string | null
  visual_direction: string | null
  emotion: string | null
  copy_hook: string | null
  source: IntelligenceSource
  created_at: string
  updated_at: string
}

export type AdTemplate = {
  id: string
  user_id: string
  source_ad_id: string | null
  name: string
  category: string | null
  tags: string[] | null
  storage_path: string
  hook: string | null
  positioning_angle: string | null
  created_at: string
}

export type CampaignStatus = 'planned' | 'generating' | 'complete' | 'partial'

export type CampaignItem = {
  intelligenceId: string
  persona: string
  angle: string
  goal: string
  assetId?: string
  adId?: string
  status: 'pending' | 'success' | 'failed'
  error?: string
}

export type Campaign = {
  id: string
  user_id: string
  name: string
  brief: string | null
  plan: CampaignItem[] | null
  status: CampaignStatus
  created_at: string
  updated_at: string
}
