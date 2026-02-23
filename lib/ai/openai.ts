import OpenAI from 'openai'
import type { Brand } from '@/types/database'
import { getFrameworks } from '@/lib/frameworks'
import { parseGeneratedAd, batchAdCopyResponseSchema, type GeneratedAd } from '@/lib/validations/generation'

// Lazy-initialize to avoid module-scope instantiation during Next.js build
let _openai: OpenAI | null = null
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _openai
}

/**
 * Analyze reference image and generate a detailed creative prompt for it
 * This mimics the ChatGPT workflow: analyze the style, then write a prompt
 */
export async function analyzeReferenceAndCreatePrompt(
  referenceImageUrl: string,
  brand: Brand,
  generatedCopy: GeneratedAd,
  userContext?: string
): Promise<string> {
  console.log('[OpenAI] Analyzing reference image to create detailed prompt...')

  const industry = brand.what_we_do.toLowerCase()
  const contextBlock = userContext
    ? `\nAD OFFER / CONTEXT (must be visually reflected): "${userContext}"\n`
    : ''

  const analysisPrompt = `Use this reference image to write an ad prompt for a ${industry} company.

The new ad should be for "${brand.company_name}" and include this copy on the image:
- Headline: "${generatedCopy.hook}"
- CTA: "${generatedCopy.cta}"
${contextBlock}
Write a detailed, specific prompt that captures the visual style of the reference and adapts it for ${industry}. The copy should be direct and hit hard.

Be extremely detailed about:
- Background (color, texture, gradients, shadows)
- Typography (style, weight, positioning, hierarchy)
- Central object/image (what it should be for ${industry}, how it's lit, positioned)
- Layout and spacing
- Overall aesthetic and mood

Return ONLY the prompt - no preamble, no explanation.`

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o', // Use GPT-4o for vision analysis
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: analysisPrompt },
            {
              type: 'image_url',
              image_url: { url: referenceImageUrl },
            },
          ],
        },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    })

    const detailedPrompt = response.choices[0]?.message?.content?.trim()

    if (!detailedPrompt) {
      throw new Error('No prompt generated from reference analysis')
    }

    console.log('[OpenAI] ✅ Reference analysis complete')
    console.log(`[OpenAI] Generated prompt length: ${detailedPrompt.length} chars`)
    console.log('\n[OpenAI] DETAILED PROMPT FROM REFERENCE:')
    console.log('---START---')
    console.log(detailedPrompt)
    console.log('---END---\n')

    return detailedPrompt
  } catch (error: any) {
    console.error('[OpenAI] Reference analysis failed:', error.message)
    throw new Error(`Failed to analyze reference image: ${error.message}`)
  }
}

/**
 * Build the system prompt for ad COPY generation
 * Focus on copy frameworks only - visual style comes from reference image
 */
function buildSystemPrompt(
  frameworks: Record<string, string>,
  brand: Brand
): string {
  const { systemPrompt, positioningAngles, adCopyFramework } = frameworks

  return `
${systemPrompt}

---

# BRAND PROFILE (USE THIS FOR ALL DECISIONS)

COMPANY NAME: ${brand.company_name}
WHAT WE DO: ${brand.what_we_do}
TARGET AUDIENCE: ${brand.target_audience}
UNIQUE DIFFERENTIATOR: ${brand.unique_differentiator || 'Not specified'}

VOICE SUMMARY: ${brand.voice_summary || 'Professional, benefit-driven'}
PERSONALITY TRAITS: ${brand.personality_traits?.join(', ') || 'Professional'}

WORDS TO USE: ${brand.words_to_use?.join(', ') || 'None specified'}
WORDS TO AVOID: ${brand.words_to_avoid?.join(', ') || 'None specified'}

SAMPLE COPY (MATCH THIS STYLE):
${brand.sample_copy || 'No sample copy provided'}

---

# POSITIONING ANGLES LIBRARY

${positioningAngles}

---

# AD COPY FRAMEWORKS

${adCopyFramework}

---

# CRITICAL INSTRUCTIONS

1. You MUST return ONLY valid JSON in the exact structure specified
2. Apply positioning angle selection logic from the frameworks
3. Match the brand voice from sample_copy precisely
4. Use words_to_use naturally, avoid words_to_avoid completely
5. Keep hook under 10 words, caption 20-60 words, CTA 3-5 words
6. The caption is the SOCIAL POST caption (Facebook/Instagram text), NOT text on the image - only the hook and CTA appear on the image itself
7. Focus ONLY on copy - do NOT generate image prompts (visuals handled separately)
7. NO extra commentary outside the JSON structure

Return ONLY the JSON object. No markdown, no explanation, just JSON.
`.trim()
}

/**
 * Build user prompt for copy generation
 */
function buildUserPrompt(userContext?: string): string {
  const contextSection = userContext
    ? `\nCURRENT OFFER / AD CONTEXT (incorporate this into the copy naturally):\n"${userContext}"\n`
    : ''

  return `
Generate compelling ad copy for the brand profile provided in the system prompt.
${contextSection}
Your task:
1. Select the best positioning angle from the frameworks
2. Write a powerful hook (5-10 words, attention-grabbing)
3. Write engaging caption copy for the social post (20-60 words, benefit-driven) — this goes in the post text, NOT on the image
4. Write a clear call-to-action (3-5 words, action-oriented)
5. Explain your strategic choices

${userContext ? 'The hook, caption, and CTA should naturally incorporate the offer/context above.' : ''}
Focus ONLY on the copy. The visual design will be handled separately based on a reference image.

Return ONLY the JSON object as specified in the system prompt.
`.trim()
}

/**
 * Generate ad COPY using OpenAI (copy only, no image prompt)
 * @param brand - Brand profile from database
 * @param retries - Number of retry attempts (default 1)
 */
export async function generateAdCopy(
  brand: Brand,
  retries = 1,
  userContext?: string
): Promise<GeneratedAd> {
  const frameworks = await getFrameworks()
  const systemPrompt = buildSystemPrompt(frameworks, brand)
  const userPrompt = buildUserPrompt(userContext)

  let lastError: Error | null = null

  // Retry loop
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(
        `[OpenAI] Generating ad (attempt ${attempt + 1}/${retries + 1})...`
      )

      const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini', // Use GPT-4o-mini for higher rate limits (128k context)
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' }, // Force JSON output
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No content in OpenAI response')
      }

      console.log('[OpenAI] Raw response received, parsing JSON...')

      // Parse JSON
      let json: unknown
      try {
        json = JSON.parse(content)
      } catch (parseError) {
        console.error('[OpenAI] JSON parse error:', parseError)
        throw new Error('Failed to parse OpenAI response as JSON')
      }

      console.log('[OpenAI] JSON parsed, validating with Zod...')

      // Validate with Zod
      const validated = parseGeneratedAd(json)

      console.log('[OpenAI] ✅ Generation successful!')
      console.log(`  Positioning: ${validated.positioning_angle}`)
      console.log(`  Hook: ${validated.hook}`)
      console.log(`  Framework: ${validated.framework_applied}`)

      return validated
    } catch (error: any) {
      lastError = error
      console.error(
        `[OpenAI] Attempt ${attempt + 1} failed:`,
        error.message || error
      )

      // If this is not the last attempt, wait before retrying
      if (attempt < retries) {
        const delayMs = 2000 * (attempt + 1) // Exponential backoff: 2s, 4s, etc.
        console.log(`[OpenAI] Retrying in ${delayMs}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }

  // All retries failed
  console.error('[OpenAI] All retry attempts failed')
  throw new Error(
    `OpenAI generation failed after ${retries + 1} attempts: ${lastError?.message || 'Unknown error'}`
  )
}

// The 5 positioning angles used for batch generation — one per slot, guaranteed diversity
const BATCH_ANGLES = [
  'The Specialist',
  'The Results',
  'The Anti-Category',
  'The Speed',
  'The Simplicity',
] as const

/**
 * Build user prompt for batch copy generation (5 variants, one per angle)
 */
function buildBatchUserPrompt(angles: readonly string[], userContext?: string): string {
  const contextSection = userContext
    ? `\nCURRENT OFFER / AD CONTEXT (incorporate naturally into all 5 variations):\n"${userContext}"\n`
    : ''

  const angleList = angles
    .map((angle, i) => `  Variation ${i + 1}: ${angle}`)
    .join('\n')

  return `
Generate EXACTLY 5 ad copy variations for the brand profile in the system prompt.
${contextSection}
CRITICAL: Each variation MUST use a DIFFERENT, pre-assigned positioning angle listed below.
You are NOT allowed to choose your own angles. Use each one EXACTLY as written, including "The" prefix:

${angleList}

For each variation:
1. Use ONLY the assigned positioning angle — set it verbatim as the positioning_angle field
2. Write a powerful hook (5-10 words) that expresses THAT specific angle
3. Write an engaging social post caption (20-60 words) — this is the post text, NOT image text
4. Write a CTA (3-5 words) suited to that angle
5. Apply the most appropriate copy framework (PAS/AIDA/BAB/FAB)
6. Match the brand voice from the sample copy

Return ONLY the following JSON object. No markdown, no explanation, just JSON:

{
  "variations": [
    {
      "positioning_angle": "The Specialist",
      "angle_justification": "...",
      "hook": "...",
      "caption": "...",
      "cta": "...",
      "brand_voice_match": "...",
      "framework_applied": "...",
      "target_platform": "...",
      "estimated_performance": "..."
    },
    ... (4 more objects, one per assigned angle)
  ]
}
`.trim()
}

/**
 * Generate 5 ad copy variants in a single GPT call — one per positioning angle.
 * Uses fixed angles to guarantee diversity across the batch.
 */
export async function generateBatchAdCopy(
  brand: Brand,
  angles: readonly string[] = BATCH_ANGLES,
  userContext?: string
): Promise<GeneratedAd[]> {
  const frameworks = await getFrameworks()
  const systemPrompt = buildSystemPrompt(frameworks, brand)
  const userPrompt = buildBatchUserPrompt(angles, userContext)

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      console.log(`[OpenAI Batch] Generating 5 variants (attempt ${attempt + 1}/2)...`)

      const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      })

      const content = response.choices[0]?.message?.content
      if (!content) throw new Error('No content in OpenAI response')

      let root: unknown
      try {
        root = JSON.parse(content)
      } catch {
        throw new Error('Failed to parse OpenAI batch response as JSON')
      }

      // Validate the full { variations: [...] } structure with Zod
      const parsed = batchAdCopyResponseSchema.parse(root)

      // Normalize angle names — ensure each matches the assigned angle (handle missing "The " prefix)
      const knownAngles = [
        'The Specialist', 'The Methodology', 'The Results', 'The Anti-Category',
        'The Simplicity', 'The Speed', 'The Quality Story', 'The Lifestyle/Identity',
      ]
      const normalized = parsed.variations.map((v, i) => {
        let angle = v.positioning_angle
        // If GPT dropped the "The " prefix, restore it
        if (!angle.startsWith('The ')) {
          const match = knownAngles.find((a) => a.replace('The ', '') === angle)
          if (match) angle = match
        }
        return { ...v, positioning_angle: angle || angles[i] }
      })

      console.log('[OpenAI Batch] ✅ Batch copy generation complete')
      normalized.forEach((v, i) => {
        console.log(`[OpenAI Batch]   Slot ${i + 1}: ${v.positioning_angle} — "${v.hook}"`)
      })

      return normalized
    } catch (error: any) {
      lastError = error
      console.error(`[OpenAI Batch] Attempt ${attempt + 1} failed:`, error.message || error)
      if (attempt < 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }
  }

  throw new Error(`Batch copy generation failed: ${lastError?.message || 'Unknown error'}`)
}
