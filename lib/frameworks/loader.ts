import fs from 'fs/promises'
import path from 'path'

// Framework file paths (relative to project root)
const FRAMEWORK_FILES = {
  systemPrompt: 'lib/frameworks/Ad Generation System Prompt.md',
  positioningAngles: 'lib/frameworks/positioning-angles-library.md',
  adCopyFramework: 'lib/frameworks/GPT Ad Copy Framework.md',
  visualAdFramework: 'lib/frameworks/GPT Visual Ad Framework.md',
}

// In-memory cache (persists per server instance)
let frameworkCache: Record<string, string> | null = null

/**
 * Load all framework documents from disk and cache them in memory.
 * This is called once per server instance and reused for all requests.
 */
export async function loadFrameworks(): Promise<Record<string, string>> {
  // Return cached frameworks if already loaded
  if (frameworkCache) {
    return frameworkCache
  }

  console.log('[Frameworks] Loading framework documents...')

  try {
    // Load all framework files in parallel
    const [systemPrompt, positioningAngles, adCopyFramework, visualAdFramework] =
      await Promise.all([
        fs.readFile(path.join(process.cwd(), FRAMEWORK_FILES.systemPrompt), 'utf-8'),
        fs.readFile(
          path.join(process.cwd(), FRAMEWORK_FILES.positioningAngles),
          'utf-8'
        ),
        fs.readFile(path.join(process.cwd(), FRAMEWORK_FILES.adCopyFramework), 'utf-8'),
        fs.readFile(
          path.join(process.cwd(), FRAMEWORK_FILES.visualAdFramework),
          'utf-8'
        ),
      ])

    // Cache the loaded frameworks
    frameworkCache = {
      systemPrompt,
      positioningAngles,
      adCopyFramework,
      visualAdFramework,
    }

    console.log('[Frameworks] Successfully loaded and cached all framework documents')
    console.log(`  - System Prompt: ${systemPrompt.length} chars`)
    console.log(`  - Positioning Angles: ${positioningAngles.length} chars`)
    console.log(`  - Ad Copy Framework: ${adCopyFramework.length} chars`)
    console.log(`  - Visual Ad Framework: ${visualAdFramework.length} chars`)

    return frameworkCache
  } catch (error) {
    console.error('[Frameworks] Error loading framework documents:', error)
    throw new Error('Failed to load framework documents')
  }
}

/**
 * Get cached frameworks. If not loaded, loads them first.
 */
export async function getFrameworks(): Promise<Record<string, string>> {
  if (!frameworkCache) {
    return await loadFrameworks()
  }
  return frameworkCache
}

/**
 * Force reload frameworks from disk (useful for development).
 */
export async function reloadFrameworks(): Promise<Record<string, string>> {
  frameworkCache = null
  return await loadFrameworks()
}
