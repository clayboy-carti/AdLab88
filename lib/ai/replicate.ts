import Replicate from 'replicate'
import { createClient } from '@/lib/supabase/server'

// Lazy-initialize to avoid module-scope instantiation during Next.js build
let _replicate: Replicate | null = null
function getReplicate(): Replicate {
  if (!_replicate) {
    _replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
  }
  return _replicate
}

/**
 * Download image from URL and return as Buffer
 */
async function downloadImage(url: string): Promise<Buffer> {
  console.log('[Replicate] Downloading generated image...')

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Upload image buffer to Supabase Storage
 */
async function uploadToSupabase(
  imageBuffer: Buffer,
  userId: string
): Promise<string> {
  console.log('[Replicate] Uploading to Supabase Storage...')

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
    console.error('[Replicate] Supabase upload error:', uploadError)
    throw new Error(`Failed to upload to storage: ${uploadError.message}`)
  }

  console.log(`[Replicate] ✅ Uploaded to: ${fileName}`)
  return fileName
}

export interface ReplicateGenerationResult {
  storagePath: string
  generatedImageUrl: string
}

/**
 * Generate image using Replicate Nano Banana Pro (Google Gemini)
 * TWO MODES:
 * 1. Image-to-image (with reference): Uses reference as template, swaps brand elements
 * 2. Text-to-image (no reference): Generates original ad from detailed prompt
 *
 * @param referenceImageUrl - URL to reference image (null for text-to-image mode)
 * @param prompt - Text prompt describing what to generate/change
 * @param userId - User ID for storage organization
 * @param strength - How much to change the image (0.0-1.0, ignored if no reference)
 * @param retries - Number of retry attempts (default 1)
 */
export async function generateImageWithReplicate(
  referenceImageUrl: string | null,
  prompt: string,
  userId: string,
  strength = 0.5,
  retries = 1
): Promise<ReplicateGenerationResult> {
  let lastError: Error | null = null

  // Retry loop
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const hasReference = !!referenceImageUrl
      console.log(
        `[Replicate] Generating image (attempt ${attempt + 1}/${retries + 1})...`
      )
      console.log(`[Replicate] Model: google/nano-banana-pro`)
      console.log(`[Replicate] Mode: ${hasReference ? 'image-to-image (with reference)' : 'text-to-image (original)'}`)
      console.log(`[Replicate] Prompt length: ${prompt.length} chars`)
      if (hasReference) {
        console.log(`[Replicate] Strength: ${strength} (0=exact copy, 1=full reimagine)`)
      }

      // Build input object conditionally based on mode
      const input: any = {
        prompt: prompt,
        guidance_scale: 7.5, // Higher = follow prompt more strictly (swap instructions)
        num_inference_steps: 20,
        output_format: 'png',
        output_quality: 90,
      }

      // Add reference image and strength only if provided (image-to-image mode)
      if (hasReference) {
        input.image_input = [referenceImageUrl] // Nano Banana Pro expects an array of image URLs
        input.prompt_strength = strength
        console.log(`[Replicate] Reference image URL: ${referenceImageUrl?.substring(0, 100)}...`)
      }

      console.log('[Replicate] Full input payload:', JSON.stringify(input, null, 2))

      // Use Nano Banana Pro (Google Gemini)
      const output = await getReplicate().run('google/nano-banana-pro', { input })

      console.log('[Replicate] Raw output type:', typeof output)
      console.log('[Replicate] Raw output:', JSON.stringify(output).substring(0, 200))

      // Handle different output formats
      let imageUrl: string
      if (typeof output === 'string') {
        // Single URL string
        imageUrl = output
      } else if (Array.isArray(output) && output.length > 0) {
        // Array of URLs
        imageUrl = output[0]
      } else if (output && typeof output === 'object' && 'url' in output) {
        // Object with url property
        imageUrl = (output as any).url
      } else {
        console.error('[Replicate] Unexpected output format:', output)
        throw new Error('No valid image URL in Replicate output')
      }

      if (!imageUrl || typeof imageUrl !== 'string') {
        throw new Error(`Invalid image URL: ${imageUrl}`)
      }

      console.log('[Replicate] ✅ Image generated successfully!')
      console.log('[Replicate] Image URL:', imageUrl)

      // Download image from Replicate URL
      const imageBuffer = await downloadImage(imageUrl)
      console.log(`[Replicate] Downloaded ${imageBuffer.length} bytes`)

      // Upload to Supabase Storage
      const storagePath = await uploadToSupabase(imageBuffer, userId)

      return {
        storagePath,
        generatedImageUrl: imageUrl,
      }
    } catch (error: any) {
      lastError = error
      console.error(
        `[Replicate] Attempt ${attempt + 1} failed:`,
        error.message || error
      )

      // If this is not the last attempt, wait before retrying
      if (attempt < retries) {
        const delayMs = 3000 * (attempt + 1) // Exponential backoff: 3s, 6s, etc.
        console.log(`[Replicate] Retrying in ${delayMs}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }

  // All retries failed
  console.error('[Replicate] All retry attempts failed')
  throw new Error(
    `Replicate generation failed after ${retries + 1} attempts: ${lastError?.message || 'Unknown error'}`
  )
}
