import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Visual analysis result from GPT-4o Vision
 */
export interface VisualAnalysis {
  layout: string // e.g., "Centered text with logo above"
  textPlacement: string // e.g., "Center of image"
  colorScheme: string[] // Hex colors extracted
  background: string // e.g., "Solid color with gradient"
  visualElements: string[] // e.g., ["Company logo (house icon)", "decorative lines"]
  typographyStyle: string // e.g., "Bold sans-serif headline"
  composition: string // e.g., "Minimalist, lots of white space"
  textToImageRatio: string // e.g., "70% text, 30% visuals"
}

/**
 * Analyze reference image to extract visual style and composition
 * Uses GPT-4o Vision to understand layout, colors, typography, and elements
 *
 * @param imageUrl - Signed URL to reference image
 * @param retries - Number of retry attempts (default 1)
 */
export async function analyzeImageStyle(
  imageUrl: string,
  retries = 1
): Promise<VisualAnalysis> {
  let lastError: Error | null = null

  // Retry loop
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(
        `[Vision] Analyzing image style (attempt ${attempt + 1}/${retries + 1})...`
      )

      const response = await openai.chat.completions.create({
        model: 'gpt-4o', // Use GPT-4o for vision capabilities
        messages: [
          {
            role: 'system',
            content: `You are a visual design analyst. Analyze advertisement images and extract their visual structure, composition, and style.

Your goal is to help recreate the SAME visual style but with different brand content.

Return ONLY valid JSON with this exact structure:
{
  "layout": "Brief description of overall layout (e.g., 'Centered text with logo above', 'Split-screen with image left, text right')",
  "textPlacement": "Where text appears (e.g., 'Top third', 'Center', 'Bottom with overlay')",
  "colorScheme": ["#hex1", "#hex2", "#hex3"],
  "background": "Background style (e.g., 'Solid blue', 'Gradient blue to white', 'Photo with dark overlay')",
  "visualElements": ["Element 1", "Element 2"],
  "typographyStyle": "Font style description (e.g., 'Bold sans-serif headline, thin body text')",
  "composition": "Overall feel (e.g., 'Minimalist with white space', 'Bold and colorful', 'Professional and clean')",
  "textToImageRatio": "Approximate ratio (e.g., '70% text 30% visuals', '50/50 split')"
}

Focus on STRUCTURE and STYLE that can be replicated, not the specific content.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this advertisement image. Extract the visual structure, layout, colors, typography, and composition so we can recreate the same style with different brand content.

Focus on:
1. Layout and composition (how elements are arranged)
2. Text placement and hierarchy
3. Color scheme (extract hex codes if possible, or describe colors)
4. Background style
5. Visual elements (logos, icons, shapes, decorative elements)
6. Typography style (bold, thin, script, modern, etc.)
7. Overall aesthetic (minimalist, bold, professional, playful, etc.)

Return ONLY the JSON object, no other text.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'high', // High detail for better analysis
                },
              },
            ],
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent analysis
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No content in Vision response')
      }

      console.log('[Vision] Raw response received, parsing JSON...')

      // Parse JSON
      let analysis: VisualAnalysis
      try {
        analysis = JSON.parse(content) as VisualAnalysis
      } catch (parseError) {
        console.error('[Vision] JSON parse error:', parseError)
        throw new Error('Failed to parse Vision response as JSON')
      }

      console.log('[Vision] ✅ Analysis complete!')
      console.log(`  Layout: ${analysis.layout}`)
      console.log(`  Colors: ${analysis.colorScheme?.join(', ')}`)
      console.log(`  Composition: ${analysis.composition}`)

      return analysis
    } catch (error: any) {
      lastError = error
      console.error(
        `[Vision] Attempt ${attempt + 1} failed:`,
        error.message || error
      )

      // If this is not the last attempt, wait before retrying
      if (attempt < retries) {
        const delayMs = 2000 * (attempt + 1) // Exponential backoff: 2s, 4s, etc.
        console.log(`[Vision] Retrying in ${delayMs}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }

  // All retries failed
  console.error('[Vision] All retry attempts failed')
  throw new Error(
    `Vision analysis failed after ${retries + 1} attempts: ${lastError?.message || 'Unknown error'}`
  )
}
