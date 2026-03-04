# AdLab88 — Feature Outline

## Overview

This document outlines all planned features beyond the current working state. Use it as a build reference. Work top-to-bottom — each layer depends on the one above it.

---

## 1. Database Migrations

### 1a. `brand_assets`
```sql
CREATE TABLE brand_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other', -- 'product' | 'packaging' | 'lifestyle' | 'logo' | 'other'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE brand_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own assets" ON brand_assets FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 1b. `brand_intelligence`
```sql
CREATE TABLE brand_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  persona TEXT,
  pain_point TEXT,
  angle TEXT,
  visual_direction TEXT,
  emotion TEXT,
  copy_hook TEXT,
  source TEXT NOT NULL DEFAULT 'generated', -- 'generated' | 'manual'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE brand_intelligence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own intelligence" ON brand_intelligence FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 1c. `ad_templates`
```sql
CREATE TABLE ad_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_ad_id UUID REFERENCES generated_ads(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  storage_path TEXT NOT NULL,
  hook TEXT,
  positioning_angle TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE ad_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own templates" ON ad_templates FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 1d. `campaigns`
```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  brief TEXT,
  plan JSONB, -- array of CampaignItem objects
  status TEXT NOT NULL DEFAULT 'planned', -- 'planned' | 'generating' | 'complete' | 'partial'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own campaigns" ON campaigns FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 1e. `generated_ads` — add column
```sql
ALTER TABLE generated_ads ADD COLUMN campaign_id UUID REFERENCES campaigns(id);
```

---

## 2. Storage

**New bucket**: `brand-assets` — private, signed URLs, 10MB limit, JPEG/PNG/WebP only.

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('brand-assets', 'brand-assets', false, 10485760, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own brand assets" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users read own brand assets" ON storage.objects FOR SELECT
  USING (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own brand assets" ON storage.objects FOR DELETE
  USING (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 3. AI Lib Functions

All go in `lib/ai/`, following the lazy-init pattern in `openai.ts`.

### `lib/ai/intelligence.ts`
```ts
generateBrandIntelligence(brand: Brand): Promise<IntelligenceProfile[]>
```
- Calls `gpt-4o-mini` with brand DNA
- Returns 3–5 persona/pain/angle/visual/emotion/hook profiles as structured JSON

### `lib/ai/prompt-composer.ts`
```ts
composePrompt(params: {
  brand: Brand;
  intelligenceProfile: IntelligenceProfile;
  assetUrls: string[];
  campaignGoal: string;
}): Promise<{ prompt: string; rationale: string }>
```
- Uses `gpt-4o` (vision) if asset images provided, else `gpt-4o-mini`
- Fallback: build prompt deterministically from brand colors + profile if AI fails

### `lib/ai/reverse-engineer.ts`
```ts
reverseEngineerAd(imageUrl: string, brand: Brand): Promise<{
  stylePrompt: string;
  copySkeleton: string;
  variants: string[];
}>
```
- Extends `analyzeReferenceAndCreatePrompt()` pattern from `lib/ai/openai.ts:19`
- Calls `gpt-4o` vision on winning ad
- Returns style prompt, copy structure, 3+ variant prompts
- No competitor brand names in output

### `lib/ai/concepts.ts`
```ts
generateConcepts(params: {
  referenceUrl?: string;
  campaignContext: string;
  brand: Brand;
}): Promise<ConceptDirection[]>
```
- Returns 5+ concept objects: `{ type, angle, audienceStage, whyDistinct, promptTemplate }`
- Uses `gpt-4o-mini`, optional vision for reference image

---

## 4. API Routes

All follow the `createClient()` + `supabase.auth.getUser()` + `NextResponse.json()` pattern.

| Route | Method | Purpose | Key Lib |
|-------|--------|---------|---------|
| `/api/brand/assets` | GET | List user's brand assets w/ signed URLs | Supabase |
| `/api/brand/assets` | POST | Upload asset (multipart) → `brand-assets` bucket | Supabase Storage |
| `/api/brand/assets/[id]` | PATCH | Update category | Supabase |
| `/api/brand/assets/[id]` | DELETE | Delete asset + storage file | Supabase |
| `/api/brand/intelligence` | GET | List intelligence profiles | Supabase |
| `/api/brand/intelligence` | POST | Generate (AI) or create manual profile | `intelligence.ts` |
| `/api/brand/intelligence/[id]` | PATCH | Edit profile fields | Supabase |
| `/api/brand/intelligence/[id]` | DELETE | Delete profile | Supabase |
| `/api/templates` | GET | List ad templates w/ signed URLs | Supabase |
| `/api/templates` | POST | Save ad as template (copy storage file) | Supabase Storage |
| `/api/templates/[id]` | DELETE | Delete template + storage copy | Supabase |
| `/api/generate-edit` | POST | Re-prompt variant from existing ad ID + instruction | `gemini-image.ts`, `openai.ts` |
| `/api/prompt/compose` | POST | Compose image gen prompt from profile + assets | `prompt-composer.ts` |
| `/api/prompt/reverse` | POST | Reverse engineer a winning ad | `reverse-engineer.ts` |
| `/api/prompt/concepts` | POST | Generate concept directions | `concepts.ts` |
| `/api/campaign/plan` | POST | Create campaign + generation matrix | Supabase |
| `/api/campaign/generate` | POST | Execute campaign batch (per-item, partial failure OK) | `gemini-image.ts`, `openai.ts` |

---

## 5. Page & Navigation Changes

### `/brand` — add tabs to `BrandDashboard`
Add tab bar to `components/brand/BrandDashboard.tsx`:
- **DNA** — existing brand kit (unchanged)
- **Assets** — new `BrandAssetsTab`
- **Intelligence** — new `BrandIntelligenceTab`

### `/library` — add Templates tab
- Extend `components/library/LibraryGrid.tsx` with a **Templates** tab
- Add **"Save as Template"** to each ad card's action menu → opens `SaveAsTemplateModal`

### `/create` hub — add three new cards
Extend `app/(protected)/create/page.tsx`:
- **Prompt Composer** → `/create/compose`
- **Reverse Engineer** → `/create/reverse`
- **Campaign Builder** → `/create/campaign`

### New pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/create/compose` | `CreateComposePage` | Select intelligence profile + brand assets + goal → get composed prompt |
| `/create/reverse` | `CreateReversePage` | Upload or select a library ad → extract style/copy/variants |
| `/create/campaign` | `CreateCampaignPage` | Step wizard: brief → profiles → assets → plan matrix → batch generate |

---

## 6. New UI Components

All follow existing patterns: custom modals (no UI library), `useState`, `fetch` + JSON, `lucide-react` icons, `.btn-primary` / `.btn-secondary` / `.field-input` / `.card` CSS classes.

| Component | File | Purpose |
|-----------|------|---------|
| `BrandAssetsTab` | `components/brand/BrandAssetsTab.tsx` | Multi-file upload, category grid, categorization modal |
| `BrandIntelligenceTab` | `components/brand/BrandIntelligenceTab.tsx` | Inline-editable profile list, generate button, source tags |
| `AssetCategorizationModal` | `components/brand/AssetCategorizationModal.tsx` | Post-upload category picker |
| `TemplatesGrid` | `components/library/TemplatesGrid.tsx` | Template card grid with filters |
| `SaveAsTemplateModal` | `components/library/SaveAsTemplateModal.tsx` | Name + category form |
| `EditAdModal` | `components/library/EditAdModal.tsx` | Re-prompt modal with instruction input |
| `ReverseEngineerPanel` | `components/create/ReverseEngineerPanel.tsx` | Image upload/select, extracted prompt display, variants list |
| `PromptComposerPanel` | `components/create/PromptComposerPanel.tsx` | Profile selector, asset picker, goal input, prompt output |
| `CampaignBuilder` | `components/create/CampaignBuilder.tsx` | Multi-step wizard |
| `CampaignResultsGrid` | `components/create/CampaignResultsGrid.tsx` | Per-item status cards (pending / success / failed) |

---

## 7. TypeScript Types

Add to `types/database.ts`:

```ts
export type BrandAsset = {
  id: string; user_id: string; storage_path: string; file_name: string;
  file_size: number; mime_type: string; category: string; created_at: string;
}

export type BrandIntelligence = {
  id: string; user_id: string; brand_id: string;
  persona: string | null; pain_point: string | null; angle: string | null;
  visual_direction: string | null; emotion: string | null; copy_hook: string | null;
  source: 'generated' | 'manual'; created_at: string; updated_at: string;
}

export type AdTemplate = {
  id: string; user_id: string; source_ad_id: string | null; name: string;
  category: string | null; tags: string[] | null; storage_path: string;
  hook: string | null; positioning_angle: string | null; created_at: string;
}

export type Campaign = {
  id: string; user_id: string; name: string; brief: string | null;
  plan: CampaignItem[] | null; status: 'planned' | 'generating' | 'complete' | 'partial';
  created_at: string;
}

export type CampaignItem = {
  intelligenceId: string; persona: string; angle: string; goal: string;
  assetId?: string; adId?: string; status: 'pending' | 'success' | 'failed'; error?: string;
}
```

---

## 8. Build Sequence

Build in this order — each step depends on the ones above it:

1. DB migrations — all 4 tables + `campaign_id` column on `generated_ads`
2. Supabase storage bucket — `brand-assets`
3. TypeScript types — extend `types/database.ts`
4. AI lib functions — `intelligence.ts`, `prompt-composer.ts`, `reverse-engineer.ts`, `concepts.ts`
5. Brand Assets — `/api/brand/assets`, `BrandAssetsTab`, `AssetCategorizationModal`, wire into `BrandDashboard`
6. Brand Intelligence — `/api/brand/intelligence`, `BrandIntelligenceTab`, wire into `BrandDashboard`
7. Ad Templates — `/api/templates`, `TemplatesGrid`, `SaveAsTemplateModal`, wire into `LibraryGrid`
8. Edit/Re-prompt — `/api/generate-edit`, `EditAdModal`, action on library cards
9. Prompt Composer — `/api/prompt/compose`, `PromptComposerPanel`, `/create/compose` page
10. Reverse Engineer — `/api/prompt/reverse`, `ReverseEngineerPanel`, `/create/reverse` page
11. Concepts — `/api/prompt/concepts`, integrate into `/create/ad` as optional step
12. Campaign Builder — `/api/campaign/plan`, `/api/campaign/generate`, `CampaignBuilder`, `CampaignResultsGrid`, `/create/campaign` page
13. Create hub — add 3 new cards to `/create/page.tsx`

---

## 9. Existing Files to Reference / Extend

| File | Why |
|------|-----|
| `lib/ai/gemini-image.ts:61` | `generateImageWithGemini()` — reuse for all image gen |
| `lib/ai/openai.ts:178` | `generateAdCopy()` — reuse for copy in campaign gen |
| `lib/ai/openai.ts:19` | `analyzeReferenceAndCreatePrompt()` — base for reverse engineer |
| `app/api/generate-ad/route.ts` | Pattern for new generation routes |
| `app/api/upload-image/route.ts` | Pattern for brand asset upload route |
| `components/brand/BrandDashboard.tsx` | Extend with tab bar |
| `components/library/LibraryGrid.tsx` | Extend with Templates tab + actions |
| `app/(protected)/create/page.tsx` | Extend with new content-type cards |
| `app/globals.css` | `.btn-primary`, `.btn-secondary`, `.field-input`, `.card` classes |
| `types/database.ts` | Extend with new types |
