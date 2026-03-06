import { GoogleGenAI } from '@google/genai'
import type { Brand, BrandIntelligence } from '@/types/database'

let _gemini: GoogleGenAI | null = null
function getGemini(): GoogleGenAI {
  if (!_gemini) {
    _gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  }
  return _gemini
}

const TEXT_MODEL = 'gemini-2.5-flash'

export interface ComposePromptParams {
  brand: Brand
  intelligenceProfile: Pick<BrandIntelligence, 'persona' | 'pain_point' | 'angle' | 'visual_direction' | 'emotion' | 'copy_hook'>
  assetUrls: string[]
  campaignGoal: string
}

export interface ComposedPrompt {
  prompt: string
  rationale: string
}

/**
 * Compose a detailed image generation prompt from brand intelligence + assets + campaign goal.
 * Uses Gemini vision when assets are provided, Gemini text otherwise.
 */
export async function composePrompt(params: ComposePromptParams): Promise<ComposedPrompt> {
  const { brand, intelligenceProfile, assetUrls, campaignGoal } = params
  const hasAssets = assetUrls.length > 0

  console.log(`[PromptComposer] Composing prompt (assets: ${assetUrls.length}, model: ${TEXT_MODEL})...`)

  const textPrompt = `You are an expert AI image generation prompt engineer for advertising. Your prompts are sent directly to Gemini image generation to produce high-quality ad visuals.

Compose a detailed image generation prompt for an ad campaign with this context:

BRAND: ${brand.company_name}
INDUSTRY: ${brand.what_we_do}
BRAND COLORS: ${brand.brand_colors?.join(', ') || 'Not specified'}
CAMPAIGN GOAL: ${campaignGoal}

TARGET PERSONA: ${intelligenceProfile.persona || 'General audience'}
PAIN POINT: ${intelligenceProfile.pain_point || 'Not specified'}
STRATEGIC ANGLE: ${intelligenceProfile.angle || 'Not specified'}
VISUAL DIRECTION: ${intelligenceProfile.visual_direction || 'Not specified'}
EMOTION TO EVOKE: ${intelligenceProfile.emotion || 'Not specified'}
COPY HOOK: ${intelligenceProfile.copy_hook || 'Not specified'}

${hasAssets ? `Product/brand assets are attached. Incorporate them naturally into the scene.` : ''}

Write a detailed image generation prompt (200-400 words) that:
1. Describes the scene, composition, and mood precisely
2. Incorporates brand colors naturally
3. Matches the visual direction for this persona
4. Creates the right emotional response
5. Specifies typography style for any on-image text

Return a JSON object with:
- prompt: the full image generation prompt
- rationale: brief explanation of key creative choices (2-3 sentences)

Return ONLY valid JSON.`

  const parts: any[] = []

  if (hasAssets) {
    // Include asset images for visual context
    for (const url of assetUrls.slice(0, 2)) {
      try {
        const res = await fetch(url)
        if (res.ok) {
          const mimeType = res.headers.get('content-type') ?? 'image/jpeg'
          const base64 = Buffer.from(await res.arrayBuffer()).toString('base64')
          parts.push({ inlineData: { mimeType, data: base64 } })
        }
      } catch {
        // skip if image fetch fails
      }
    }
  }

  parts.push({ text: textPrompt })

  const result = await getGemini().models.generateContent({
    model: TEXT_MODEL,
    contents: [{ role: 'user', parts }],
    config: {
      temperature: 0.7,
      responseMimeType: 'application/json',
    },
  })

  const raw = result.candidates?.[0]?.content?.parts?.[0]?.text
  if (!raw) throw new Error('No content from Gemini')

  const parsed = JSON.parse(typeof raw === 'string' ? raw : JSON.stringify(raw))
  console.log('[PromptComposer] ✅ Prompt composed')

  const toStr = (val: unknown): string =>
    typeof val === 'string' ? val : val != null ? JSON.stringify(val) : ''

  return {
    prompt: toStr(parsed.prompt),
    rationale: toStr(parsed.rationale),
  }
}
