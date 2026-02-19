// Copy generation (frameworks-driven)
export { generateAdCopy, analyzeReferenceAndCreatePrompt } from './openai'

// Visual analysis (GPT-4o Vision)
export { analyzeImageStyle, type VisualAnalysis } from './vision'

// Image prompt builders
export { buildImagePrompt, type GeneratedCopy } from './image-prompt-builder'
export { buildReplicatePrompt } from './image-prompt-builder-replicate'

// Image generation (DALL-E)
export { generateImageWithDalle, type DalleGenerationResult } from './dalle'

// Image generation (Gemini 2.0 Flash - text-to-image and image-to-image)
export { generateImageWithGemini, type GeminiGenerationResult } from './gemini-image'
