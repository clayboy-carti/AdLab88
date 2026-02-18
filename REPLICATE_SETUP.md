# Replicate Integration Complete! 🎉

## What Changed

We've switched from **DALL-E text-to-image** to **Replicate Flux image-to-image** generation.

### Key Difference:
- **Before (DALL-E)**: Described the reference image → DALL-E tried to recreate it from description → inconsistent results
- **Now (Replicate Flux)**: Pass the actual reference image → Flux modifies only what you specify → consistent layout/style

---

## New Generation Flow (3 Phases)

### Phase 1: Generate Copy (OpenAI GPT-4o-mini)
- Uses positioning + ad copy frameworks
- Generates: hook, caption, CTA
- No image prompt generation

### Phase 2: Build Replicate Prompt
- Simple prompt describing ONLY what to change
- Much shorter than DALL-E prompts
- Example: "Keep layout, swap logo to plumbing, use brand colors, update text"

### Phase 3: Image-to-Image with Flux
- Passes reference image URL directly to Replicate
- Uses `prompt_strength: 0.5` (balanced between preserving and changing)
- Outputs image that matches reference layout but with your brand

---

## Setup Instructions

### 1. Get Replicate API Token

1. Go to https://replicate.com/account/api-tokens
2. Sign up or log in
3. Create a new API token
4. Copy the token (starts with `r8_...`)

### 2. Add to .env.local

Open `.env.local` and replace the placeholder:

```bash
REPLICATE_API_TOKEN=r8_your_actual_token_here
```

### 3. Restart Dev Server

```bash
pnpm dev
```

---

## Testing

1. Go to `http://localhost:3000/create`
2. Upload a reference image (any ad style you like)
3. Click **GENERATE AD**

### Expected Behavior:

**Console logs will show:**
```
=== PHASE 1: Generating copy with frameworks ===
  ✅ Copy generation complete

=== PHASE 2: Building Replicate prompt ===
  ✅ Image prompt built

=== PHASE 3: Generating image with Replicate Flux ===
  [Replicate] Generating image...
  [Replicate] Strength: 0.5 (0=exact copy, 1=full reimagine)
  ✅ Image generation complete

=== PHASE 4: Saving to database ===

✅ Successfully generated ad with Replicate Flux (image-to-image)!
```

**Result:**
- Generated image matches reference layout
- Swaps industry elements (e.g., house → pipe for plumber)
- Uses your brand colors
- Shows AI-generated hook/caption/CTA

---

## Adjusting Strength Parameter

In `app/api/generate-ad/route.ts` line ~115:

```typescript
const generatedImage = await generateImageWithReplicate(
  referenceImageUrl,
  imagePrompt,
  user.id,
  0.5, // ← Adjust this value
  1
)
```

**Strength values:**
- `0.3` = Keep 70% of original, change 30% (very conservative)
- `0.5` = Balanced (default, recommended)
- `0.7` = More creative interpretation
- `0.9` = Almost completely reimagined

---

## Files Created

- ✅ `lib/ai/replicate.ts` - Replicate Flux integration
- ✅ `lib/ai/image-prompt-builder-replicate.ts` - Simplified prompt builder

## Files Modified

- ✅ `app/api/generate-ad/route.ts` - Switched to 3-phase flow (removed Vision analysis)
- ✅ `lib/ai/index.ts` - Updated exports

---

## Cost Comparison

**DALL-E 3:**
- $0.04 per image (1024x1024)
- Text-to-image only

**Replicate Flux Dev:**
- ~$0.003-0.006 per image (image-to-image)
- **~85-90% cheaper**
- Better control with image-to-image

---

## Troubleshooting

### Error: "Missing Replicate API token"
- Make sure `REPLICATE_API_TOKEN` is in `.env.local`
- Restart the dev server after adding

### Image doesn't match reference well
- Try adjusting strength parameter (lower = more similar)
- Try a more detailed prompt in `buildReplicatePrompt()`

### Replicate timeout/slow
- Flux Dev takes ~20-30 seconds per image
- This is normal for high-quality generation
- Consider switching to `SDXL` model for faster (5-10s) generation

---

## Next Steps

Once you've tested and confirmed it works:
- ✅ Phase 6 complete (AI generation pipeline)
- 📋 Ready for Phase 7 (UI enhancements)
- 📋 Ready for Phase 8 (Library + Download)

🚀 **You're all set! Add your Replicate API token and test it out!**
