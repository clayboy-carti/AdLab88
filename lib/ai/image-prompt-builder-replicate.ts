import type { Brand } from '@/types/database'
import type { GeneratedCopy } from './image-prompt-builder'

/**
 * Build Replicate prompt for image generation
 * TWO MODES:
 * 1. Reference mode: Simple prompt for template swap (keeps layout, swaps brand)
 * 2. Original mode: Detailed framework-driven prompt for creative generation
 *
 * @param copy - Generated ad copy
 * @param brand - Brand profile
 * @param mode - 'reference' (template swap) or 'original' (framework-driven)
 */
export function buildReplicatePrompt(
  copy: GeneratedCopy,
  brand: Brand,
  mode: 'reference' | 'original' = 'reference',
  userContext?: string
): string {
  const brandColors =
    brand.brand_colors && brand.brand_colors.length > 0
      ? brand.brand_colors.join(', ')
      : 'professional brand colors'

  const industry = brand.what_we_do.toLowerCase()

  // MODE 1: REFERENCE-BASED (Super simple prompt - let the model do the work)
  if (mode === 'reference') {
    const prompt = `Use the reference image to create an ad focused on ${industry}.`

    console.log('[ReplicatePrompt] Mode: REFERENCE (template swap)')
    console.log(`  Brand: ${brand.company_name}`)
    console.log(`  Industry: ${industry}`)
    console.log(`  Prompt: "${prompt}"`)

    return prompt
  }

  // MODE 2: ORIGINAL (Framework-driven creative generation)
  const offerLine = userContext
    ? `• Offer / promotional context (feature prominently): "${userContext}"\n`
    : ''

  const prompt = `
Create a professional, high-quality advertisement for ${brand.company_name}, a ${industry} company.

BRAND DETAILS:
• Company: ${brand.company_name}
• Industry: ${industry}
• What we do: ${brand.what_we_do}
• Target audience: ${brand.target_audience}
• Brand colors: ${brandColors}
• Brand personality: ${brand.personality_traits?.join(', ') || 'Professional, trustworthy'}

AD COPY (Display prominently):
• Main headline (large, bold): "${copy.hook}"
• Body copy (clear, readable): "${copy.caption}"
• Call-to-action (prominent button/text): "${copy.cta}"
${offerLine}

VISUAL REQUIREMENTS:
• Professional, modern design suitable for ${copy.target_platform}
• Use brand colors (${brandColors}) as primary color scheme
• Include relevant ${industry} imagery or icons
• Clean, uncluttered layout with good whitespace
• Typography should be bold and readable
• Ensure text hierarchy (headline > body > CTA)
• High-quality, polished aesthetic
• Square format (1:1 ratio) optimized for social media

STYLE INSPIRATION:
• Modern, professional ${industry} advertising
• Clean, benefit-driven messaging
• Visual appeal that resonates with ${brand.target_audience}
• Framework applied: ${copy.framework_applied}

Create an eye-catching, conversion-focused advertisement that clearly communicates the value proposition.
`.trim()

  console.log('[ReplicatePrompt] Mode: ORIGINAL (framework-driven)')
  console.log(`  Brand: ${brand.company_name}`)
  console.log(`  Hook: ${copy.hook}`)
  console.log(`  Framework: ${copy.framework_applied}`)
  console.log(`  Prompt length: ${prompt.length} chars`)
  console.log('\n[ReplicatePrompt] FULL PROMPT:')
  console.log('---START PROMPT---')
  console.log(prompt)
  console.log('---END PROMPT---\n')

  return prompt
}
