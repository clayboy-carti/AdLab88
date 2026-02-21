import { GoogleGenAI } from '@google/genai'
import { createClient } from '@/lib/supabase/server'

// Lazy-initialize to avoid module-scope instantiation during Next.js build
let _gemini: GoogleGenAI | null = null
function getGemini(): GoogleGenAI {
  if (!_gemini) {
    _gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  }
  return _gemini
}

const IMAGE_MODEL = 'gemini-3-pro-image-preview'

/**
 * Upload image buffer to Supabase Storage
 */
async function uploadToSupabase(
  imageBuffer: Buffer,
  userId: string
): Promise<string> {
  console.log('[Gemini] Uploading to Supabase Storage...')

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
    console.error('[Gemini] Supabase upload error:', uploadError)
    throw new Error(`Failed to upload to storage: ${uploadError.message}`)
  }

  console.log(`[Gemini] ✅ Uploaded to: ${fileName}`)
  return fileName
}

export interface GeminiGenerationResult {
  storagePath: string
  generatedImageUrl: string
}

/**
 * Generate image using Gemini 2.0 Flash image generation.
 * Supports two modes:
 *  1. Text-to-image (referenceImageUrl = null): generates from prompt only
 *  2. Image-to-image (referenceImageUrl provided): edits reference using prompt
 *
 * @param referenceImageUrl - URL of the reference image, or null for text-to-image
 * @param prompt - Text prompt describing the image to generate/edit
 * @param userId - Used to organise the storage path
 * @param strength - Unused (kept for interface compatibility with replicate version)
 * @param retries - Number of retry attempts
 */
export async function generateImageWithGemini(
  referenceImageUrl: string | null,
  prompt: string,
  userId: string,
  strength = 0.5,
  retries = 1,
  imageSize: '1K' | '2K' = '1K',
  aspectRatio = '1:1'
): Promise<GeminiGenerationResult> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const hasReference = !!referenceImageUrl
      console.log(
        `[Gemini] Generating image (attempt ${attempt + 1}/${retries + 1})...`
      )
      console.log(`[Gemini] Model: ${IMAGE_MODEL}`)
      console.log(
        `[Gemini] Mode: ${hasReference ? 'image-to-image (with reference)' : 'text-to-image (original)'}`
      )
      console.log(`[Gemini] Quality: ${imageSize}, Aspect ratio: ${aspectRatio}`)
      console.log(`[Gemini] Prompt length: ${prompt.length} chars`)

      let contents: string | object[]

      if (hasReference) {
        // Image-to-image: fetch reference, encode as base64, send with prompt
        console.log('[Gemini] Fetching reference image...')
        const refResponse = await fetch(referenceImageUrl!)
        if (!refResponse.ok) {
          throw new Error(
            `Failed to fetch reference image: ${refResponse.statusText}`
          )
        }
        const refBuffer = Buffer.from(await refResponse.arrayBuffer())
        const refBase64 = refBuffer.toString('base64')
        const refMimeType =
          refResponse.headers.get('content-type') || 'image/jpeg'
        console.log(
          `[Gemini] Reference image fetched: ${refBuffer.length} bytes (${refMimeType})`
        )

        contents = [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType: refMimeType, data: refBase64 } },
              { text: prompt },
            ],
          },
        ]
      } else {
        // Text-to-image: just the prompt
        contents = prompt
      }

      const result = await getGemini().models.generateContent({
        model: IMAGE_MODEL,
        contents,
        config: {
          responseModalities: ['IMAGE', 'TEXT'],
          imageConfig: {
            imageSize,
            aspectRatio,
          },
        },
      })

      // Find the image part in the response
      const parts = result.candidates?.[0]?.content?.parts ?? []
      const imagePart = parts.find((p: any) => p.inlineData?.data)

      if (!imagePart?.inlineData?.data) {
        console.error('[Gemini] Response parts:', JSON.stringify(parts).substring(0, 300))
        throw new Error('No image data in Gemini response')
      }

      const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64')
      console.log(`[Gemini] ✅ Image generated: ${imageBuffer.length} bytes`)

      // Upload to Supabase Storage
      const storagePath = await uploadToSupabase(imageBuffer, userId)

      // Generate a signed URL for immediate preview
      const supabase = createClient()
      const { data: signedUrlData } = await supabase.storage
        .from('generated-ads')
        .createSignedUrl(storagePath, 3600)

      return {
        storagePath,
        generatedImageUrl: signedUrlData?.signedUrl ?? '',
      }
    } catch (error: any) {
      lastError = error
      console.error(
        `[Gemini] Attempt ${attempt + 1} failed:`,
        error.message || error
      )

      if (attempt < retries) {
        const delayMs = 3000 * (attempt + 1)
        console.log(`[Gemini] Retrying in ${delayMs}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }

  console.error('[Gemini] All retry attempts failed')
  throw new Error(
    `Gemini image generation failed after ${retries + 1} attempts: ${lastError?.message || 'Unknown error'}`
  )
}
