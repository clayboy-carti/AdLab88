import type { Brand } from '@/types/database'
import type { GeneratedCopy } from './image-prompt-builder'
import type { MemeContext } from './meme-detector'

/**
 * Build Replicate prompt for image generation.
 * FOUR MODES:
 * 1. Reference mode (meme detected): Panel-specific text placement, preserves meme format
 * 2. Reference mode (no meme): Generic format-preserving prompt
 * 3. Original mode: Detailed framework-driven prompt for creative generation
 * 4. Product mockup mode: Places the reference product into a lifestyle scene
 *
 * @param copy - Generated ad copy
 * @param brand - Brand profile
 * @param mode - 'reference' | 'original' | 'product_mockup'
 * @param userContext - Optional user-provided offer/context or scene description
 * @param memeContext - Optional meme detection result (panel structure + copy)
 */
export function buildReplicatePrompt(
  copy: GeneratedCopy,
  brand: Brand,
  mode: 'reference' | 'original' | 'product_mockup' = 'reference',
  userContext?: string,
  memeContext?: MemeContext | null
): string {
  const brandColors =
    brand.brand_colors && brand.brand_colors.length > 0
      ? brand.brand_colors.join(', ')
      : 'professional brand colors'

  const industry = brand.what_we_do.toLowerCase()

  // MODE 1: REFERENCE-BASED
  if (mode === 'reference') {
    const colorLine =
      brand.brand_colors && brand.brand_colors.length > 0
        ? `\nSubtly incorporate brand colors (${brand.brand_colors.join(', ')}) where natural.`
        : ''

    // 1a. Meme-aware: panel-specific text placement
    if (memeContext) {
      const panelLines = memeContext.panels
        .map(
          (p) =>
            `  • ${p.position.toUpperCase()} PANEL (${p.role}): "${p.suggestedCopy}"`
        )
        .join('\n')

      const prompt = `Recreate this ${memeContext.templateName} as an advertisement for ${brand.company_name}.

CRITICAL: Preserve the EXACT same meme format, layout, panels, and visual style from the reference image. Do NOT replace it with an infographic or generic ad template.

Place the following text in each panel EXACTLY as specified — the text must match the semantic role of that panel:
${panelLines}

Keep everything else (character images, panel borders, background, font style) identical to the reference.${colorLine}`

      console.log(`[ReplicatePrompt] Mode: REFERENCE — MEME (${memeContext.templateName})`)
      memeContext.panels.forEach((p) =>
        console.log(`  ${p.position.toUpperCase()}: "${p.suggestedCopy}"`)
      )
      console.log(`  Prompt length: ${prompt.length} chars`)

      return prompt
    }

    // 1b. Standard reference: preserve format, swap copy
    const offerLine = userContext ? ` The ad is promoting: "${userContext}".` : ''

    const prompt = `Recreate this exact visual format and style as an advertisement for ${brand.company_name}.

CRITICAL: Preserve the EXACT same layout, composition, and visual format from the reference image. If the reference is a meme, keep the meme format. If it is a two-panel image, keep the two panels. If it is a product shot, keep that structure. Do NOT replace the format with a generic infographic or marketing template.

Use this copy:
• Headline (bold, prominent): "${copy.hook}"
• CTA: "${copy.cta}"
${offerLine}${colorLine}

Keep the visual format identical to the reference. Only swap in the new brand copy.`

    console.log('[ReplicatePrompt] Mode: REFERENCE (format-preserving)')
    console.log(`  Brand: ${brand.company_name}`)
    console.log(`  Hook: ${copy.hook}`)
    console.log(`  Prompt length: ${prompt.length} chars`)

    return prompt
  }

  // MODE 3: PRODUCT MOCKUP (lifestyle scene placement)
  if (mode === 'product_mockup') {
    const scene = userContext || 'a clean, natural lifestyle setting that suits the product'
    const colorHint =
      brand.brand_colors && brand.brand_colors.length > 0
        ? `\nSubtly incorporate the brand colors (${brand.brand_colors.join(', ')}) in the background or environment where natural.`
        : ''

    const prompt = `Create a photorealistic product lifestyle photo for ${brand.company_name}.

TASK: Place the product shown in the reference image into the following scene:
"${scene}"

CRITICAL RULES:
• Keep the product EXACTLY as it appears — same shape, label, colors, and branding. Do not alter the product itself.
• The product should look naturally placed in the scene, not composited or photoshopped
• Professional commercial product photography quality — sharp focus, well-lit, polished
• The product is the clear focal point of the image
• NO text overlays, NO ad copy, NO headlines on the image — pure visual
• Photorealistic render, not illustrated or stylized${colorHint}

Style reference: high-end lifestyle product photography. Think editorial, aspirational, social-media-ready.`.trim()

    console.log('[ReplicatePrompt] Mode: PRODUCT MOCKUP')
    console.log(`  Brand: ${brand.company_name}`)
    console.log(`  Scene: ${scene}`)
    console.log(`  Prompt length: ${prompt.length} chars`)

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
• Call-to-action (prominent button/text): "${copy.cta}"
${offerLine}

VISUAL REQUIREMENTS:
• Professional, modern design suitable for ${copy.target_platform}
• Use brand colors (${brandColors}) as primary color scheme
• Include relevant ${industry} imagery or icons
• Clean, uncluttered layout with good whitespace
• Typography should be bold and readable
• Ensure text hierarchy (headline > CTA)
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
