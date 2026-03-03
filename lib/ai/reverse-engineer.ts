import OpenAI from 'openai'
import type { Brand } from '@/types/database'

let _openai: OpenAI | null = null
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _openai
}

export interface ReverseEngineerResult {
  stylePrompt: string
  copySkeleton: string
  variants: string[]
}

/**
 * Analyze a winning ad image and extract its creative blueprint.
 * Returns a style prompt, copy structure formula, and 3 variant prompts adapted for the brand.
 * Uses gpt-4o vision.
 */
export async function reverseEngineerAd(imageUrl: string, brand: Brand): Promise<ReverseEngineerResult> {
  console.log('[ReverseEngineer] Analyzing ad image...')

  const prompt = `You are an expert ad analyst and image generation prompt engineer. Analyze this winning ad and extract its creative blueprint.

TARGET BRAND TO ADAPT FOR: ${brand.company_name}
INDUSTRY: ${brand.what_we_do}
BRAND COLORS: ${brand.brand_colors?.join(', ') || 'Not specified'}

Analyze the ad image carefully and return a JSON object with:

- stylePrompt: a detailed image generation prompt (150-250 words) that captures this ad's visual style, layout, typography approach, color palette, composition, lighting, and mood. Describe it generically so it can be applied to ${brand.company_name}'s products. Do NOT reference any brand names from the original.

- copySkeleton: the copy structure or formula used in this ad (e.g. "Bold claim → social proof → urgency CTA" or "Pain question → solution reveal → benefit list"). Describe the pattern, not the specific words. (1-3 sentences)

- variants: array of exactly 3 image generation prompts (100-150 words each), each applying the same core visual style as the original but with a different creative twist:
  - Variant 1: same style, different scene/setting
  - Variant 2: same style, focus on product/result close-up
  - Variant 3: same style, lifestyle/aspirational framing
  All variants must be adapted for ${brand.company_name}.

Do NOT reference or reproduce specific brand names, logos, or trademarked elements from the analyzed ad.

Return ONLY valid JSON.`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
        ],
      },
    ],
    temperature: 0.7,
    max_tokens: 2500,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('No content from OpenAI')

  const parsed = JSON.parse(content)
  console.log('[ReverseEngineer] ✅ Analysis complete')

  return {
    stylePrompt: parsed.stylePrompt ?? '',
    copySkeleton: parsed.copySkeleton ?? '',
    variants: Array.isArray(parsed.variants) ? parsed.variants : [],
  }
}
