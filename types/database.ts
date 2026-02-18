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
  created_at: string
  updated_at: string
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
  hook: string
  caption: string
  cta: string
  generated_image_url: string
  ad_spend?: number
  impressions?: number
  clicks?: number
  conversions?: number
  created_at: string
}
