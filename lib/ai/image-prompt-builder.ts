import type { Brand } from '@/types/database'
import type { VisualAnalysis } from './vision'

/**
 * Generated ad copy from OpenAI
 */
export interface GeneratedCopy {
  positioning_angle: string
  angle_justification: string
  hook: string
  caption: string
  cta: string
  brand_voice_match: string
  framework_applied: string
  target_platform: string
  estimated_performance?: string
}

/**
 * Build DALL-E prompt that combines:
 * 1. Visual style from reference image analysis
 * 2. Generated copy (hook, caption, CTA)
 * 3. Brand-specific elements
 *
 * Goal: Keep the same layout/style, swap industry-specific elements
 *
 * @param visualAnalysis - Style analysis from reference image
 * @param copy - Generated ad copy
 * @param brand - Brand profile
 */
export function buildImagePrompt(
  visualAnalysis: VisualAnalysis,
  copy: GeneratedCopy,
  brand: Brand
): string {
  // Use brand colors or fallback to analyzed colors
  const brandColors = brand.brand_colors && brand.brand_colors.length > 0
    ? brand.brand_colors.join(', ')
    : visualAnalysis.colorScheme.join(', ')

  const prompt = `
RECREATE this exact advertisement layout, but customize it for ${brand.company_name}:

REFERENCE LAYOUT TO COPY:
- Overall Structure: ${visualAnalysis.layout}
- Text Position: ${visualAnalysis.textPlacement}
- Background: ${visualAnalysis.background}
- Visual Balance: ${visualAnalysis.textToImageRatio}
- Typography: ${visualAnalysis.typographyStyle}
- Composition Style: ${visualAnalysis.composition}

CUSTOMIZE THESE ELEMENTS FOR ${brand.company_name.toUpperCase()}:

1. REPLACE industry-specific visuals:
   - Reference had: ${visualAnalysis.visualElements.join(', ')}
   - Replace with: ${brand.what_we_do}-related elements (same style, same placement)
   - Example: If reference has a house logo, use a relevant ${brand.what_we_do.toLowerCase()} icon instead

2. USE THESE BRAND COLORS (instead of original colors):
   ${brandColors}

3. DISPLAY THIS TEXT (same font style and hierarchy as reference):
   Headline: "${copy.hook}"
   Body: "${copy.caption}"
   CTA: "${copy.cta}"

CRITICAL RULES:
✓ Copy the exact layout structure and composition
✓ Copy the typography hierarchy and style
✓ Copy the text placement and sizing
✓ Keep the same visual balance and spacing
✗ DO NOT change the overall design or layout
✗ ONLY swap: colors → brand colors, industry elements → ${brand.what_we_do} elements, text → new copy

Think of this as a template swap: same design, different brand content.

Company: ${brand.company_name}
Industry: ${brand.what_we_do}
Target: ${brand.target_audience}
`.trim()

  console.log('[ImagePrompt] Built DALL-E prompt:')
  console.log(`  Brand: ${brand.company_name}`)
  console.log(`  Layout: ${visualAnalysis.layout}`)
  console.log(`  Hook: ${copy.hook}`)
  console.log(`  Prompt length: ${prompt.length} chars`)
  console.log('\n[ImagePrompt] FULL PROMPT BEING SENT TO DALL-E:')
  console.log('---START PROMPT---')
  console.log(prompt)
  console.log('---END PROMPT---\n')

  return prompt
}
