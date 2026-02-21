/**
 * Brand scan orchestrator.
 * Validates URL → crawls → extracts brand DNA.
 */

import { validateScanURL, URLSecurityError } from './security'
import { crawlURL } from './crawl'
import { extractBrandDNA } from './extract'
import type { BrandDNA } from '@/types/database'

export { URLSecurityError }

export type BrandScanResult = {
  success: true
  data: BrandDNA
} | {
  success: false
  error: string
}

export async function runBrandScan(rawUrl: string): Promise<BrandScanResult> {
  // 1. Security validation
  let validatedUrl: URL
  try {
    validatedUrl = validateScanURL(rawUrl)
  } catch (err: any) {
    return { success: false, error: err.message }
  }

  const url = validatedUrl.toString()
  console.log(`[BrandScan] Starting scan for: ${url}`)

  // 2. Crawl the URL
  let crawled
  try {
    crawled = await crawlURL(url)
  } catch (err: any) {
    console.error('[BrandScan] Crawl failed:', err.message)
    return {
      success: false,
      error: `Could not fetch that URL: ${err.message}`,
    }
  }

  // 3. AI extraction
  let brandDNA: BrandDNA
  try {
    brandDNA = await extractBrandDNA(crawled)
  } catch (err: any) {
    console.error('[BrandScan] Extraction failed:', err.message)
    return {
      success: false,
      error: `Brand analysis failed: ${err.message}`,
    }
  }

  return { success: true, data: brandDNA }
}
