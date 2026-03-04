/**
 * image-variants.ts
 *
 * Generates resized variants (thumb, 512, 1024) of a generated ad and stores
 * them in the `generated-ads` bucket under the same user folder.
 *
 * Requires `sharp` to be installed. If sharp is not available (e.g. on dev
 * machines without native binaries), this module silently no-ops and returns
 * null paths so the rest of the pipeline is unaffected.
 */

import { createClient } from '@/lib/supabase/server'

export type VariantPaths = {
  thumb_path: string | null
  preview_512_path: string | null
  preview_1024_path: string | null
}

const VARIANTS = [
  { key: 'thumb_path' as const, suffix: 'thumb', size: 256 },
  { key: 'preview_512_path' as const, suffix: '512', size: 512 },
  { key: 'preview_1024_path' as const, suffix: '1024', size: 1024 },
]

/**
 * Attempt to load sharp. Returns null if not installed.
 */
function tryLoadSharp(): typeof import('sharp') | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('sharp')
  } catch {
    return null
  }
}

/**
 * Download a storage object as a Buffer.
 */
async function downloadStorageObject(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  path: string
): Promise<Buffer | null> {
  const { data, error } = await supabase.storage.from(bucket).download(path)
  if (error || !data) return null
  return Buffer.from(await data.arrayBuffer())
}

/**
 * Generate thumb / 512 / 1024 variants for `storagePath` and upload them.
 * Returns the storage paths of each variant (or null if processing failed).
 *
 * Silent no-op if sharp is not installed — returns `{ null, null, null }`.
 */
export async function generateImageVariants(
  storagePath: string,
  userId: string
): Promise<VariantPaths> {
  const nullResult: VariantPaths = {
    thumb_path: null,
    preview_512_path: null,
    preview_1024_path: null,
  }

  const sharp = tryLoadSharp()
  if (!sharp) {
    console.log('[Variants] sharp not available — skipping variant generation')
    return nullResult
  }

  const supabase = createClient()

  const originalBuffer = await downloadStorageObject(supabase, 'generated-ads', storagePath)
  if (!originalBuffer) {
    console.error('[Variants] Failed to download original image:', storagePath)
    return nullResult
  }

  // Base path without extension, e.g. "userId/abc123"
  const basePath = storagePath.replace(/\.[^.]+$/, '')

  const result: VariantPaths = { thumb_path: null, preview_512_path: null, preview_1024_path: null }

  for (const { key, suffix, size } of VARIANTS) {
    try {
      const resized = await sharp(originalBuffer)
        .resize(size, size, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer()

      const variantPath = `${basePath}_${suffix}.webp`

      const { error: uploadError } = await supabase.storage
        .from('generated-ads')
        .upload(variantPath, resized, {
          contentType: 'image/webp',
          upsert: true,
        })

      if (uploadError) {
        console.error(`[Variants] Upload failed for ${suffix}:`, uploadError.message)
      } else {
        result[key] = variantPath
        console.log(`[Variants] ✅ ${suffix} → ${variantPath}`)
      }
    } catch (err: any) {
      console.error(`[Variants] Processing failed for ${suffix}:`, err.message)
    }
  }

  return result
}
