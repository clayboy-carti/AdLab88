import OpenAI from 'openai'
import type { Brand } from '@/types/database'
import { getFrameworks } from '@/lib/frameworks'
import { parseGeneratedAd, type GeneratedAd } from '@/lib/validations/generation'

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
  generatedCopy: GeneratedAd
): Promise<string> {
  console.log('[OpenAI] Analyzing reference image to create detailed prompt...')

  const industry = brand.what_we_do.toLowerCase()

  const analysisPrompt = `Use this reference image to write an ad prompt for a ${industry} company.

The new ad should be for "${brand.company_name}" and include this copy:
- Headline: "${generatedCopy.hook}"
- Body: "${generatedCopy.caption}"
- CTA: "${generatedCopy.cta}"

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
6. Focus ONLY on copy - do NOT generate image prompts (visuals handled separately)
7. NO extra commentary outside the JSON structure

Return ONLY the JSON object. No markdown, no explanation, just JSON.
`.trim()
}

/**
 * Build user prompt for copy generation
 */
function buildUserPrompt(): string {
  return `
Generate compelling ad copy for the brand profile provided in the system prompt.

Your task:
1. Select the best positioning angle from the frameworks
2. Write a powerful hook (5-10 words, attention-grabbing)
3. Write engaging caption copy (20-60 words, benefit-driven)
4. Write a clear call-to-action (3-5 words, action-oriented)
5. Explain your strategic choices

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
  retries = 1
): Promise<GeneratedAd> {
  const frameworks = await getFrameworks()
  const systemPrompt = buildSystemPrompt(frameworks, brand)
  const userPrompt = buildUserPrompt()

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
