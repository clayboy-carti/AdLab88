import OpenAI from 'openai'
import type { Brand, BrandIntelligence } from '@/types/database'

let _openai: OpenAI | null = null
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _openai
}

export type IntelligenceProfile = Omit<BrandIntelligence, 'id' | 'user_id' | 'brand_id' | 'created_at' | 'updated_at'>

/**
 * Generate 3 brand intelligence profiles (persona/angle/hook) from brand DNA.
 * Uses gpt-4o-mini for structured JSON output.
 */
export async function generateBrandIntelligence(brand: Brand): Promise<IntelligenceProfile[]> {
  console.log('[Intelligence] Generating brand intelligence profiles...')

  const prompt = `You are a brand strategist. Based on this brand profile, generate 3 distinct customer personas and strategic ad angles.

BRAND PROFILE:
Company: ${brand.company_name}
What we do: ${brand.what_we_do}
Target audience: ${brand.target_audience}
Unique differentiator: ${brand.unique_differentiator || 'Not specified'}
Voice: ${brand.voice_summary || 'Not specified'}
Personality: ${brand.personality_traits?.join(', ') || 'Not specified'}

Return a JSON object with a "profiles" array of exactly 3 objects. Each object must have:
- persona: who this customer is (2-3 sentences)
- pain_point: their specific pain this brand solves (1-2 sentences)
- angle: the strategic positioning angle for this persona (1 sentence)
- visual_direction: visual style and aesthetic that resonates with them (1-2 sentences)
- emotion: the primary emotion this ad should trigger (1-3 words)
- copy_hook: a powerful hook line aimed at this persona (5-10 words)
- source: "generated"

Make the 3 personas genuinely distinct — different demographics, mindsets, or use cases.
Return ONLY valid JSON. No markdown, no explanation.`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('No content from OpenAI')

  const parsed = JSON.parse(content)
  if (!Array.isArray(parsed.profiles)) throw new Error('Invalid response: expected profiles array')

  console.log(`[Intelligence] ✅ Generated ${parsed.profiles.length} profiles`)

  return parsed.profiles.map((p: any) => ({
    persona: p.persona ?? null,
    pain_point: p.pain_point ?? null,
    angle: p.angle ?? null,
    visual_direction: p.visual_direction ?? null,
    emotion: p.emotion ?? null,
    copy_hook: p.copy_hook ?? null,
    source: 'generated' as const,
  }))
}
