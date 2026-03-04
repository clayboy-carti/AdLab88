// Copy generation (frameworks-driven)
export { generateAdCopy, generateBatchAdCopy, analyzeReferenceAndCreatePrompt } from './openai'

// Meme template detection (GPT-4o Vision)
export { detectMemeTemplate, type MemeContext, type MemePanel } from './meme-detector'

// Visual analysis (GPT-4o Vision)
export { analyzeImageStyle, type VisualAnalysis } from './vision'

// Image prompt builders
export { buildImagePrompt, type GeneratedCopy } from './image-prompt-builder'
export { buildReplicatePrompt } from './image-prompt-builder-replicate'

// Image generation (DALL-E)
export { generateImageWithDalle, type DalleGenerationResult } from './dalle'

// Image generation (Seedream 4 via Replicate)
export { generateImageWithSeedream } from './replicate'

// Image generation (Gemini 2.0 Flash - text-to-image and image-to-image)
export { generateImageWithGemini, type GeminiGenerationResult } from './gemini-image'

// Brand intelligence profile generation
export { generateBrandIntelligence, type IntelligenceProfile } from './intelligence'

// Prompt composition from brand intelligence + assets
export { composePrompt, type ComposePromptParams, type ComposedPrompt } from './prompt-composer'

// Reverse engineer a winning ad into style prompt + variants
export { reverseEngineerAd, type ReverseEngineerResult } from './reverse-engineer'

// Creative concept direction generation
export { generateConcepts, type ConceptDirection, type GenerateConceptsParams } from './concepts'
