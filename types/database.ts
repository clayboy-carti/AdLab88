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
