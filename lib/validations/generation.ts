import { z } from 'zod'

/**
 * Zod schema for AI-generated ad COPY output
 * Validates the structured JSON response from OpenAI (copy generation only)
 * Image prompt is now built separately from visual analysis
 */
export const generatedAdSchema = z.object({
  // Positioning strategy
  positioning_angle: z.string().min(1, 'Positioning angle required'),
  angle_justification: z.string().min(1, 'Angle justification required'),

  // Copy components
  hook: z
    .string()
    .min(5, 'Hook too short')
    .max(100, 'Hook too long (max 100 chars)'),
  caption: z
    .string()
    .min(20, 'Caption too short')
    .max(500, 'Caption too long (max 500 chars)'),
  cta: z.string().min(3, 'CTA too short').max(50, 'CTA too long (max 50 chars)'),

  // Metadata
  brand_voice_match: z.string().min(1, 'Brand voice match explanation required'),
  framework_applied: z.string().min(1, 'Framework applied required'),
  target_platform: z.string().min(1, 'Target platform required'),
  estimated_performance: z.string().optional(),
})

export type GeneratedAd = z.infer<typeof generatedAdSchema>

/**
 * Helper to parse and validate AI output
 */
export function parseGeneratedAd(json: unknown): GeneratedAd {
  return generatedAdSchema.parse(json)
}
