import OpenAI from 'openai'
import type { Brand } from '@/types/database'

let _openai: OpenAI | null = null
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _openai
}

export interface ConceptDirection {
  type: string
  angle: string
  audienceStage: 'awareness' | 'consideration' | 'conversion' | 'retention'
  whyDistinct: string
  promptTemplate: string
}

export interface GenerateConceptsParams {
  referenceUrl?: string
  campaignContext: string
  brand: Brand
}

/**
 * Generate 5 distinct creative concept directions for a campaign.
 * Uses gpt-4o (vision) when a reference image is provided, gpt-4o-mini otherwise.
 */
export async function generateConcepts(params: GenerateConceptsParams): Promise<ConceptDirection[]> {
  const { referenceUrl, campaignContext, brand } = params
  const hasReference = !!referenceUrl

  console.log(`[Concepts] Generating concepts (reference: ${hasReference}, model: ${hasReference ? 'gpt-4o' : 'gpt-4o-mini'})...`)

  const systemPrompt = `You are a creative director specializing in performance advertising.`

  const userText = `Generate 5 distinct creative concept directions for an ad campaign.

BRAND: ${brand.company_name}
WHAT WE DO: ${brand.what_we_do}
TARGET AUDIENCE: ${brand.target_audience}
BRAND VOICE: ${brand.voice_summary || 'Professional, benefit-driven'}
CAMPAIGN CONTEXT: ${campaignContext}
${hasReference ? `\nA reference image is attached — use it as creative inspiration, not a strict template.` : ''}

Return a JSON object with a "concepts" array of exactly 5 objects. Each must have:
- type: the concept type (e.g. "Social Proof", "Transformation", "Urgency", "Authority", "Lifestyle")
- angle: the strategic positioning angle in 1 sentence
- audienceStage: one of "awareness", "consideration", "conversion", "retention"
- whyDistinct: why this concept stands out from the others in this set (1 sentence)
- promptTemplate: an image generation prompt that captures this concept's visual direction for ${brand.company_name} (80-120 words)

Make each concept genuinely distinct — different emotion, different visual approach, different audience mindset.

Return ONLY valid JSON.`

  const userContent: any = hasReference
    ? [
        { type: 'text', text: userText },
        { type: 'image_url', image_url: { url: referenceUrl, detail: 'low' as const } },
      ]
    : userText

  const response = await getOpenAI().chat.completions.create({
    model: hasReference ? 'gpt-4o' : 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    temperature: 0.9,
    max_tokens: 2500,
    response_format: { type: 'json_object' },
  })

  const msg = response.choices[0]?.message
  if (!msg) throw new Error('No response from OpenAI')
  if (msg.refusal) throw new Error(`OpenAI refused: ${msg.refusal}`)
  const content = msg.content
  if (!content) throw new Error('No content from OpenAI')

  const parsed = JSON.parse(content)
  if (!Array.isArray(parsed.concepts)) throw new Error('Invalid response: expected concepts array')

  console.log(`[Concepts] ✅ Generated ${parsed.concepts.length} concepts`)

  return parsed.concepts.map((c: any) => ({
    type: c.type ?? 'Unknown',
    angle: c.angle ?? '',
    audienceStage: c.audienceStage ?? 'awareness',
    whyDistinct: c.whyDistinct ?? '',
    promptTemplate: c.promptTemplate ?? '',
  }))
}
