# Switched to Nano Banana Pro (Google Gemini) 🍌

## What Changed

Switched from **Flux Dev** to **Nano Banana Pro** (Google's Gemini image model on Replicate).

---

## Why Nano Banana Pro?

**Better for brand swaps:**
- More precise control with `guidance_scale` parameter
- Better at understanding "keep layout, swap elements" instructions
- Optimized for image-to-image transformations
- Faster inference (20 steps vs Flux's longer processing)

---

## Updated Parameters

### Model Configuration:
```typescript
model: 'google/nano-banana-pro'

input: {
  prompt: prompt,
  image: referenceImageUrl,
  guidance_scale: 3.5,        // How closely to follow the prompt (1-20)
  num_inference_steps: 20,    // Quality vs speed (default: 20)
  prompt_strength: 0.65,      // How much to change from reference (0-1)
  output_format: 'png',
  output_quality: 90,
}
```

### Key Parameters Explained:

**`prompt_strength: 0.65`** (was 0.7 with Flux)
- `0.0` = Exact copy of reference
- `0.5` = Balanced
- `0.65` = Good for industry swaps (our setting)
- `1.0` = Complete reimagination

**`guidance_scale: 3.5`** (new parameter)
- How strictly the model follows the prompt
- `1.0` = Loose interpretation
- `3.5` = Balanced (default, recommended)
- `10.0+` = Very strict adherence

**`num_inference_steps: 20`**
- Quality vs speed tradeoff
- `10` = Fast but lower quality
- `20` = Balanced (default, recommended)
- `50` = Highest quality but slow

---

## Files Modified

- ✅ `lib/ai/replicate.ts` - Updated to use `google/nano-banana-pro`
- ✅ `app/api/generate-ad/route.ts` - Adjusted strength to 0.65

---

## Testing

The dev server is already running with the updated code.

**To test:**
1. Go to `http://localhost:3000/create`
2. Click **GENERATE AD** with your plumbing reference image

**Expected console output:**
```
=== PHASE 3: Generating image with Nano Banana Pro ===
[Replicate] Model: google/nano-banana-pro
[Replicate] Strength: 0.65
✅ Image generated successfully!
```

**Expected result:**
- Plumbing elements (pipes, wrenches) → Roofing elements (shingles, hammers)
- Text updated to roofing copy
- Colors changed to brand color (#ff5733)
- Layout preserved from reference

---

## Adjusting Parameters

If results need tweaking, edit `app/api/generate-ad/route.ts` line ~112:

```typescript
const generatedImage = await generateImageWithReplicate(
  referenceImageUrl,
  imagePrompt,
  user.id,
  0.65, // ← Adjust strength here
  1
)
```

**Strength recommendations:**
- `0.5` - Very conservative (minimal changes)
- `0.65` - Current setting (good balance)
- `0.75` - More aggressive swaps
- `0.85` - Almost complete reimagination

You can also adjust `guidance_scale` in `lib/ai/replicate.ts` line ~93:
```typescript
guidance_scale: 3.5, // ← Increase for stricter prompt adherence (up to 20)
```

---

## Cost Comparison

**Nano Banana Pro:**
- ~$0.003-0.005 per image
- Faster than Flux Dev
- Better control for template-based generation

**Flux Dev (previous):**
- ~$0.003-0.006 per image
- Slower
- More artistic freedom (less strict)

Both are **~90% cheaper** than DALL-E 3 ($0.04 per image).

---

## 🚀 Ready to Test!

The changes are live on your dev server. Generate an ad and see if Nano Banana Pro does a better job swapping industry elements!

If the swaps still aren't aggressive enough, we can:
1. Increase `prompt_strength` to `0.75`
2. Increase `guidance_scale` to `5.0` or higher
3. Add negative prompts ("NO plumbing pipes, NO wrenches")
