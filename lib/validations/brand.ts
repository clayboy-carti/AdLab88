import { z } from 'zod'

export const brandSchema = z.object({
  // Step 1: Core Identity
  company_name: z.string().min(1, 'Company name is required'),
  what_we_do: z.string().min(10, 'Please provide at least 10 characters'),
  target_audience: z.string().min(5, 'Target audience is required'),
  unique_differentiator: z.string().optional(),

  // Step 2: Voice & Messaging
  voice_summary: z.string().optional(),
  personality_traits: z.string().optional(), // Will be split into array
  words_to_use: z.string().optional(), // Will be split into array
  words_to_avoid: z.string().optional(), // Will be split into array

  // Step 3: Visual Identity
  brand_colors: z.string().optional(), // Will be split and validated
  typography_notes: z.string().optional(),

  // Step 4: Sample Copy
  sample_copy: z.string().min(20, 'Please provide at least one example (minimum 20 characters)'),
})

export type BrandFormData = z.infer<typeof brandSchema>

// Helper function to parse comma-separated strings into arrays
export function parseCommaSeparated(value: string | undefined): string[] | undefined {
  if (!value || value.trim() === '') return undefined
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item !== '')
}

// Helper function to validate hex colors
export function parseColors(value: string | undefined): string[] | undefined {
  if (!value || value.trim() === '') return undefined
  const colors = value
    .split(',')
    .map((color) => color.trim())
    .filter((color) => color !== '')

  // Validate hex format
  const hexRegex = /^#[0-9A-F]{6}$/i
  const validColors = colors.filter((color) => hexRegex.test(color))

  return validColors.length > 0 ? validColors : undefined
}
