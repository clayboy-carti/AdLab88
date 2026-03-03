import OpenAI from 'openai'
import type { Brand, BrandIntelligence } from '@/types/database'

let _openai: OpenAI | null = null
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _openai
}

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
 * Uses gpt-4o (vision) when assets are provided, gpt-4o-mini otherwise.
 */
export async function composePrompt(params: ComposePromptParams): Promise<ComposedPrompt> {
  const { brand, intelligenceProfile, assetUrls, campaignGoal } = params
  const hasAssets = assetUrls.length > 0

  console.log(`[PromptComposer] Composing prompt (assets: ${assetUrls.length}, model: ${hasAssets ? 'gpt-4o' : 'gpt-4o-mini'})...`)

  const systemPrompt = `You are an expert AI image generation prompt engineer for advertising. Your prompts are sent directly to Gemini image generation to produce high-quality ad visuals.`

  const textPrompt = `Compose a detailed image generation prompt for an ad campaign with this context:

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

  const userContent: any = hasAssets
    ? [
        { type: 'text', text: textPrompt },
        ...assetUrls.slice(0, 2).map((url) => ({
          type: 'image_url',
          image_url: { url, detail: 'low' as const },
        })),
      ]
    : textPrompt

  const response = await getOpenAI().chat.completions.create({
    model: hasAssets ? 'gpt-4o' : 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    temperature: 0.7,
    max_tokens: 1500,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('No content from OpenAI')

  const parsed = JSON.parse(content)
  console.log('[PromptComposer] ✅ Prompt composed')

  return {
    prompt: parsed.prompt ?? '',
    rationale: parsed.rationale ?? '',
  }
}
