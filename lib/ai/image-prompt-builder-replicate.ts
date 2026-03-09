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
  memeContext?: MemeContext | null,
  stylePrompt?: string | null
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
    const offerLine = userContext ? `\n• Offer / context: "${userContext}"` : ''

    const prompt = `Recreate this exact visual format and style as an advertisement for ${brand.company_name}.

WHAT TO TAKE FROM THE REFERENCE (visual style only):
• Layout, composition, and structural format (panels, grid, proportions)
• Design language: color palette, typography style, spacing, graphic elements
• Mood, tone, and aesthetic quality

WHAT TO IGNORE FROM THE REFERENCE (never reproduce):
• Any text, headlines, taglines, or body copy visible in the reference image
• Any prices, discounts, or promotional offers (e.g. "15% Off", "Starting at $9.99", "Sale", "Free Shipping")
• Any brand names, logos, or product details belonging to the reference brand
• Any CTAs from the reference

USE ONLY THIS COPY (place no other text on the ad):
• Headline (bold, prominent): "${copy.hook}"
• CTA: "${copy.cta}"${offerLine}${colorLine}

Treat the reference as a visual template only — all text and promotional details must come from the instructions above, never from the reference image.`

    console.log('[ReplicatePrompt] Mode: REFERENCE (format-preserving)')
    console.log(`  Brand: ${brand.company_name}`)
    console.log(`  Hook: ${copy.hook}`)
    console.log(`  Prompt length: ${prompt.length} chars`)

    return prompt
  }

  // MODE 3: PRODUCT MOCKUP (lifestyle scene placement)
  if (mode === 'product_mockup') {
    // Split out an embedded CAMERA ANGLE directive if present (injected by photo shoot batch mode).
    // Format: "<scene text>\n\nCAMERA ANGLE: <directive>"  OR  "CAMERA ANGLE: <directive>" (no scene)
    let sceneDescription = userContext || ''
    let cameraAngle = ''

    const cameraMarker = '\n\nCAMERA ANGLE:'
    if (sceneDescription.includes(cameraMarker)) {
      const splitIdx = sceneDescription.indexOf(cameraMarker)
      cameraAngle = sceneDescription.slice(splitIdx + cameraMarker.length).trim()
      sceneDescription = sceneDescription.slice(0, splitIdx).trim()
    } else if (sceneDescription.startsWith('CAMERA ANGLE:')) {
      cameraAngle = sceneDescription.replace('CAMERA ANGLE:', '').trim()
      sceneDescription = ''
    }

    const scene = sceneDescription || 'a clean, natural lifestyle setting that suits the product'

    const colorHint =
      brand.brand_colors && brand.brand_colors.length > 0
        ? `\nSubtly incorporate the brand colors (${brand.brand_colors.join(', ')}) in the background or environment where natural.`
        : ''

    const cameraSection = cameraAngle
      ? `\nCAMERA ANGLE: ${cameraAngle}\n`
      : ''

    const prompt = `Create a photorealistic lifestyle photo for ${brand.company_name}.

SCENE: ${scene}

TASK: Generate this scene exactly as described, with the product from the reference image naturally placed into it. The scene description defines the environment, mood, and setting — build a completely new world around the product. If the scene describes a person wearing or using the product, show the full person/environment; do NOT zoom into the product or reframe as a close-up product shot.
${cameraSection}
PRODUCT ACCURACY:
• Reproduce the product exactly — same shape, label, colors, and branding. Do not alter the product.
• The product should look naturally worn, held, or placed — not composited or photoshopped in.

COMPOSITION:
• Frame and compose to match the described scene and camera angle.
• The product is visible and recognizable within the scene — but the scene environment drives the shot, not the other way around.

VISUAL STYLE:
• Photorealistic — no illustrations, no stylized renders
• Natural lighting appropriate to the described setting
• NO text overlays, NO ad copy, NO headlines — pure visual${colorHint}

Quality benchmark: editorial lifestyle photography — authentic, aspirational, social-media-ready.`.trim()

    console.log('[ReplicatePrompt] Mode: PRODUCT MOCKUP')
    console.log(`  Brand: ${brand.company_name}`)
    console.log(`  Scene: ${scene}`)
    if (cameraAngle) console.log(`  Camera angle: ${cameraAngle}`)
    console.log(`  Prompt length: ${prompt.length} chars`)

    return prompt
  }

  // MODE 2: ORIGINAL (Framework-driven or style-prompted creative generation)
  const offerHint = userContext
    ? `• Promotional context / offer to weave into the copy: "${userContext}"\n`
    : ''

  // If a reverse-engineered style prompt is provided, it drives the visual direction
  const visualSection = stylePrompt
    ? `VISUAL STYLE (extracted from reference ad — follow closely):
${stylePrompt}`
    : `VISUAL REQUIREMENTS:
• Professional, modern design suitable for ${copy.target_platform}
• Use brand colors (${brandColors}) as primary color scheme
• Clean, uncluttered layout with strong text hierarchy
• Typography: bold headline, clear CTA — minimal copy, punchy and direct
• High-quality, polished aesthetic that matches the reference ad's tone`

  const prompt = `
Create a high-quality advertisement image for ${brand.company_name}.

BRAND CONTEXT (for your creative direction — do NOT display these as-is):
• Company: ${brand.company_name}
• What they sell: ${industry}
• Target audience: ${brand.target_audience}
• Brand colors: ${brandColors}
• Creative angle (inspiration only): ${copy.positioning_angle}
• Hook idea (inspiration only — rewrite into punchy ad copy): ${copy.hook}
${offerHint}
COPY INSTRUCTIONS:
• Write SHORT, punchy, original ad copy inspired by the creative angle and hook idea above
• Do NOT copy the angle or hook word-for-word — use them as creative direction only
• Match the copy length and style of the reference ad (if short and bold, keep it short and bold)
• Include a clear CTA (e.g. "${copy.cta}")
• Tone: ${copy.brand_voice_match}

${visualSection}

Generate a visually compelling, on-brand advertisement. Let the creative angle inform the energy and message — but write fresh, natural copy that feels like a real ad.
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
