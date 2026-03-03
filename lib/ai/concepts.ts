import { GoogleGenAI } from '@google/genai'
import type { Brand } from '@/types/database'

let _gemini: GoogleGenAI | null = null
function getGemini(): GoogleGenAI {
  if (!_gemini) {
    _gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  }
  return _gemini
}

const VISION_MODEL = 'gemini-2.0-flash'

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
 * Uses Gemini vision when a reference image is provided, Gemini text otherwise.
 */
export async function generateConcepts(params: GenerateConceptsParams): Promise<ConceptDirection[]> {
  const { referenceUrl, campaignContext, brand } = params
  const hasReference = !!referenceUrl

  console.log(`[Concepts] Generating concepts (reference: ${hasReference}, model: ${VISION_MODEL})...`)

  const userText = `You are a creative director specializing in performance advertising.

Generate 5 distinct creative concept directions for an ad campaign.

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

  const parts: any[] = []

  if (hasReference) {
    let mimeType = 'image/jpeg'
    let base64Data: string

    if (referenceUrl.startsWith('data:')) {
      const commaIdx = referenceUrl.indexOf(',')
      mimeType = referenceUrl.slice(0, commaIdx).replace('data:', '').replace(';base64', '')
      base64Data = referenceUrl.slice(commaIdx + 1)
    } else {
      const res = await fetch(referenceUrl)
      if (!res.ok) throw new Error(`Failed to fetch reference image: ${res.statusText}`)
      mimeType = res.headers.get('content-type') ?? 'image/jpeg'
      base64Data = Buffer.from(await res.arrayBuffer()).toString('base64')
    }

    parts.push({ inlineData: { mimeType, data: base64Data } })
  }

  parts.push({ text: userText })

  const result = await getGemini().models.generateContent({
    model: VISION_MODEL,
    contents: [{ role: 'user', parts }],
    config: {
      temperature: 0.9,
      responseMimeType: 'application/json',
    },
  })

  const text = result.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('No response from Gemini')

  const parsed = JSON.parse(text)
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
