import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

// Lazy-initialize to avoid module-scope instantiation during Next.js build
let _openai: OpenAI | null = null
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _openai
}

/**
 * Download image from URL and return as Buffer
 */
async function downloadImage(url: string): Promise<Buffer> {
  console.log('[DALL-E] Downloading generated image...')

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Upload image buffer to Supabase Storage
 * @param imageBuffer - Image data as Buffer
 * @param userId - User ID for path organization
 * @returns Storage path
 */
async function uploadToSupabase(
  imageBuffer: Buffer,
  userId: string
): Promise<string> {
  console.log('[DALL-E] Uploading to Supabase Storage...')

  const supabase = createClient()
  const timestamp = Date.now()
  const fileName = `${userId}/${timestamp}-generated.png`

  const { error: uploadError } = await supabase.storage
    .from('generated-ads')
    .upload(fileName, imageBuffer, {
      contentType: 'image/png',
      upsert: false,
    })

  if (uploadError) {
    console.error('[DALL-E] Supabase upload error:', uploadError)
    throw new Error(`Failed to upload to storage: ${uploadError.message}`)
  }

  console.log(`[DALL-E] ✅ Uploaded to: ${fileName}`)
  return fileName
}

export interface DalleGenerationResult {
  storagePath: string
  generatedImageUrl: string // Temporary DALL-E URL (expires)
  revisedPrompt?: string // DALL-E may revise the prompt
}

/**
 * Generate image using OpenAI DALL-E 3
 * @param prompt - Image generation prompt from copy generation
 * @param userId - User ID for storage organization
 * @param retries - Number of retry attempts (default 1)
 */
export async function generateImageWithDalle(
  prompt: string,
  userId: string,
  retries = 1
): Promise<DalleGenerationResult> {
  let lastError: Error | null = null

  // Retry loop
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`[DALL-E] Generating image (attempt ${attempt + 1}/${retries + 1})...`)
      console.log(`[DALL-E] Prompt length: ${prompt.length} chars`)

      // Generate image with DALL-E 3
      const response = await getOpenAI().images.generate({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024', // Square format for MVP (Instagram/Meta feed)
        quality: 'standard', // 'standard' or 'hd'
        response_format: 'url', // Get URL to download from
      })

      if (!response.data || response.data.length === 0) {
        throw new Error('No data in DALL-E response')
      }

      const imageData = response.data[0]
      if (!imageData || !imageData.url) {
        throw new Error('No image URL in DALL-E response')
      }

      console.log('[DALL-E] ✅ Image generated successfully!')
      if (imageData.revised_prompt) {
        console.log(`[DALL-E] Revised prompt: ${imageData.revised_prompt.substring(0, 100)}...`)
      }

      // Download image from DALL-E URL
      const imageBuffer = await downloadImage(imageData.url)
      console.log(`[DALL-E] Downloaded ${imageBuffer.length} bytes`)

      // Upload to Supabase Storage
      const storagePath = await uploadToSupabase(imageBuffer, userId)

      return {
        storagePath,
        generatedImageUrl: imageData.url,
        revisedPrompt: imageData.revised_prompt,
      }
    } catch (error: any) {
      lastError = error
      console.error(
        `[DALL-E] Attempt ${attempt + 1} failed:`,
        error.message || error
      )

      // If this is not the last attempt, wait before retrying
      if (attempt < retries) {
        const delayMs = 3000 * (attempt + 1) // Exponential backoff: 3s, 6s, etc.
        console.log(`[DALL-E] Retrying in ${delayMs}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }

  // All retries failed
  console.error('[DALL-E] All retry attempts failed')
  throw new Error(
    `DALL-E generation failed after ${retries + 1} attempts: ${lastError?.message || 'Unknown error'}`
  )
}
