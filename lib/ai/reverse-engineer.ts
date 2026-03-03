import { GoogleGenAI } from '@google/genai'
import type { Brand } from '@/types/database'

let _gemini: GoogleGenAI | null = null
function getGemini(): GoogleGenAI {
  if (!_gemini) {
    _gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  }
  return _gemini
}

const VISION_MODEL = 'gemini-2.0-flash-001'

export interface ReverseEngineerResult {
  stylePrompt: string
  copySkeleton: string
  variants: string[]
}

/**
 * Analyze a winning ad image and extract its creative blueprint.
 * Returns a style prompt, copy structure formula, and 3 variant prompts adapted for the brand.
 * Uses Gemini vision.
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

  // Build image part from data URL or fetch from URL
  let mimeType = 'image/jpeg'
  let base64Data: string

  if (imageUrl.startsWith('data:')) {
    const commaIdx = imageUrl.indexOf(',')
    mimeType = imageUrl.slice(0, commaIdx).replace('data:', '').replace(';base64', '')
    base64Data = imageUrl.slice(commaIdx + 1)
  } else {
    const res = await fetch(imageUrl)
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`)
    mimeType = res.headers.get('content-type') ?? 'image/jpeg'
    base64Data = Buffer.from(await res.arrayBuffer()).toString('base64')
  }

  const result = await getGemini().models.generateContent({
    model: VISION_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt },
        ],
      },
    ],
    config: {
      temperature: 0.7,
      responseMimeType: 'application/json',
    },
  })

  const text = result.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('No response from Gemini')

  const parsed = JSON.parse(text)
  console.log('[ReverseEngineer] ✅ Analysis complete')

  return {
    stylePrompt: parsed.stylePrompt ?? '',
    copySkeleton: parsed.copySkeleton ?? '',
    variants: Array.isArray(parsed.variants) ? parsed.variants : [],
  }
}
