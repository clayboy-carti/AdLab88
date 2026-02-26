import OpenAI from 'openai'
import type { Brand } from '@/types/database'
import type { GeneratedAd } from '@/lib/validations/generation'

// Lazy-initialize to avoid module-scope instantiation during Next.js build
let _openai: OpenAI | null = null
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _openai
}

/**
 * A single text panel within a meme template.
 * Each panel has a semantic role (rejection, approval, contrast, etc.)
 * and brand-specific copy written for that role.
 */
export interface MemePanel {
  position: string // "top", "bottom", "left", "right", "top-left", etc.
  sentiment: 'negative' | 'positive' | 'neutral' | 'escalating' | 'contrast'
  role: string // e.g., "thing being rejected", "preferred alternative"
  suggestedCopy: string // brand-specific copy written for this panel's role
}

/**
 * Detected meme template with panel-level semantic structure and copy.
 */
export interface MemeContext {
  templateName: string // e.g., "Drake Pointing Meme"
  description: string // one-sentence semantic description of the meme
  panels: MemePanel[]
}

/**
 * Analyse a reference image to detect if it is a meme template.
 * If it is, returns a MemeContext with panel-specific copy written for the brand.
 * If it is not a meme, returns null so the caller falls back to standard reference mode.
 *
 * Uses GPT-4o Vision so it handles any meme — common or obscure — without a static library.
 */
export async function detectMemeTemplate(
  imageUrl: string,
  brand: Brand,
  generatedCopy: GeneratedAd,
  userContext?: string
): Promise<MemeContext | null> {
  console.log('[MemeDetector] Analysing reference image for meme template...')

  const contextLine = userContext ? `\nAd context / offer: "${userContext}"` : ''

  const prompt = `You are an expert in internet meme culture and advertising.

Analyse this image and determine whether it is a recognisable meme template.

BRAND CONTEXT (use this to write panel copy):
- Company: ${brand.company_name}
- What they do: ${brand.what_we_do}
- Target audience: ${brand.target_audience}${contextLine}

If this IS a meme template, return JSON with this structure:
{
  "isMeme": true,
  "templateName": "Exact common name of the meme (e.g. 'Drake Pointing Meme', 'Distracted Boyfriend', 'This Is Fine', 'Two Buttons', 'Expanding Brain')",
  "description": "One sentence explaining the semantic structure — what each panel means to a viewer",
  "panels": [
    {
      "position": "top | bottom | left | right | top-left | top-right | bottom-left | bottom-right | center",
      "sentiment": "negative | positive | neutral | escalating | contrast",
      "role": "Semantic role of this panel (e.g. 'thing being rejected / disliked', 'preferred alternative / solution', 'the temptation', 'the ignored problem')",
      "suggestedCopy": "EXACT short text for this panel — written specifically for the brand above, fitting the panel's semantic role. MAX 8 words. For a rejection/negative panel: write something the audience wants to move AWAY from (a pain point or old way). For an approval/positive panel: write the brand solution or benefit."
    }
  ]
}

If this is NOT a meme template (regular photo, graphic, or ad), return:
{ "isMeme": false }

RULES FOR suggestedCopy:
- Must be short (3–8 words) — memes use punchy, clipped phrases
- Must be semantically correct for the panel's role
- Must be specific to the brand, not generic filler
- Negative/rejection panels: a real pain point the target audience has
- Positive/approval panels: the brand's clear benefit or differentiator

Return ONLY the JSON object, no other text.`

  try {
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
      max_tokens: 800,
      temperature: 0.3, // low temp = consistent structural analysis
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('Empty response from meme detection')

    const parsed = JSON.parse(content)

    if (!parsed.isMeme) {
      console.log('[MemeDetector] Not a meme template — standard reference mode will be used')
      return null
    }

    // Validate panels array exists
    if (!Array.isArray(parsed.panels) || parsed.panels.length === 0) {
      console.warn('[MemeDetector] Meme detected but no panels returned — falling back')
      return null
    }

    const memeContext: MemeContext = {
      templateName: parsed.templateName ?? 'Unknown Meme',
      description: parsed.description ?? '',
      panels: parsed.panels as MemePanel[],
    }

    console.log(`[MemeDetector] ✅ Meme detected: ${memeContext.templateName}`)
    console.log(`[MemeDetector]   Structure: ${memeContext.description}`)
    memeContext.panels.forEach((p) => {
      console.log(
        `[MemeDetector]   ${p.position.toUpperCase()} (${p.sentiment} — ${p.role}): "${p.suggestedCopy}"`
      )
    })

    return memeContext
  } catch (error: any) {
    // Non-fatal: if detection fails, fall back to standard reference mode
    console.error('[MemeDetector] Detection failed (falling back to standard reference):', error.message)
    return null
  }
}
