/**
 * Uses OpenAI to extract brand DNA from crawled website content.
 */

import OpenAI from 'openai'
import type { BrandDNA } from '@/types/database'
import type { CrawledContent } from './crawl'

let _openai: OpenAI | null = null
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _openai
}

const EXTRACTION_SYSTEM_PROMPT = `You are a brand intelligence analyst. Given raw content scraped from a company website, extract structured brand DNA.

Return ONLY valid JSON with this exact structure (omit any field you cannot confidently determine):

{
  "company_name": "string — the company or brand name",
  "what_we_do": "string — 1-2 sentences describing the business and its core offering",
  "target_audience": "string — who the company serves (e.g., 'small business owners', 'enterprise marketing teams')",
  "unique_differentiator": "string — what makes them different or better than alternatives",
  "voice_summary": "string — how the brand communicates (e.g., 'Direct, confident, no-nonsense')",
  "personality_traits": ["string", "..."],
  "words_to_use": ["string", "..."],
  "words_to_avoid": ["string", "..."],
  "sample_copy": "string — pull a short passage (2-4 sentences) from the website that best represents their brand voice",
  "brand_colors": ["#RRGGBB", "..."],
  "typography_notes": "string — describe typography style if detectable"
}

Rules:
- personality_traits: max 5 single words or short phrases
- words_to_use: max 8 words/phrases that match their tone
- words_to_avoid: max 5 words/phrases that conflict with their voice
- brand_colors: only include if a theme-color meta tag is found or colors are clearly branded. Use valid #RRGGBB hex format only.
- If you cannot reliably extract a field, omit it entirely — do not guess.
- Return ONLY the JSON object. No markdown fences, no explanation.`

export async function extractBrandDNA(
  content: CrawledContent
): Promise<BrandDNA> {
  const userContent = `
WEBSITE URL: ${content.url}
PAGE TITLE: ${content.title}
META DESCRIPTION: ${content.description}
${content.themeColor ? `THEME COLOR: ${content.themeColor}` : ''}

BODY TEXT (first 3000 chars):
${content.bodyText}
`.trim()

  console.log('[BrandScan] Sending to OpenAI for extraction...')

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
    temperature: 0.3, // Low temp for factual extraction
    max_tokens: 1000,
    response_format: { type: 'json_object' },
  })

  const raw = response.choices[0]?.message?.content
  if (!raw) throw new Error('No content in OpenAI response')

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Failed to parse OpenAI extraction response as JSON')
  }

  // Sanitize brand_colors: keep only valid #RRGGBB hex strings
  if (Array.isArray(parsed.brand_colors)) {
    const hexRegex = /^#[0-9A-F]{6}$/i
    parsed.brand_colors = (parsed.brand_colors as string[]).filter(
      (c) => typeof c === 'string' && hexRegex.test(c)
    )
    if ((parsed.brand_colors as string[]).length === 0) {
      delete parsed.brand_colors
    }
  }

  // If theme color present and no colors extracted yet, add it
  if (
    content.themeColor &&
    /^#[0-9A-F]{6}$/i.test(content.themeColor) &&
    !parsed.brand_colors
  ) {
    parsed.brand_colors = [content.themeColor]
  }

  console.log(`[BrandScan] Extraction complete: ${parsed.company_name ?? '(unnamed)'}`)

  return {
    ...(parsed as BrandDNA),
    source_url: content.url,
  }
}
