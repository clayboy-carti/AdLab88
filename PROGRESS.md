# Static Ads Generator — Build Progress

Branch: `claude/adlab88-development-hXjhJ`

---

## Status Legend
- [ ] Not started
- [~] In progress
- [x] Complete

---

## Phase 1 — Database Migrations (Supabase SQL Editor)

- [~] `brand_assets` table — *ready to paste*
- [ ] `brand_intelligence` table
- [ ] `ad_templates` table
- [ ] `campaigns` table
- [ ] `campaign_id` column on `generated_ads`

## Phase 2 — Storage

- [ ] Create `brand-assets` bucket in Supabase Storage

## Phase 3 — TypeScript Types

- [ ] Extend `types/database.ts` with `BrandAsset`, `BrandIntelligence`, `AdTemplate`, `Campaign`, `CampaignItem`

## Phase 4 — AI Lib Functions

- [ ] `lib/ai/intelligence.ts` — `generateBrandIntelligence()`
- [ ] `lib/ai/prompt-composer.ts` — `composePrompt()`
- [ ] `lib/ai/reverse-engineer.ts` — `reverseEngineerAd()`
- [ ] `lib/ai/concepts.ts` — `generateConcepts()`

## Phase 5 — Brand Assets (API + UI)

- [ ] `app/api/brand/assets/route.ts` (GET + POST)
- [ ] `app/api/brand/assets/[id]/route.ts` (PATCH + DELETE)
- [ ] `components/brand/BrandAssetsTab.tsx`
- [ ] `components/brand/AssetCategorizationModal.tsx`
- [ ] Extend `BrandDashboard` with tab nav (DNA | Assets | Intelligence)

## Phase 6 — Brand Intelligence (API + UI)

- [ ] `app/api/brand/intelligence/route.ts` (GET + POST)
- [ ] `app/api/brand/intelligence/[id]/route.ts` (PATCH + DELETE)
- [ ] `components/brand/BrandIntelligenceTab.tsx`

## Phase 7 — Ad Templates (API + UI)

- [ ] `app/api/templates/route.ts` (GET + POST)
- [ ] `app/api/templates/[id]/route.ts` (DELETE)
- [ ] `components/library/TemplatesGrid.tsx`
- [ ] `components/library/SaveAsTemplateModal.tsx`
- [ ] Extend `LibraryGrid` with Templates tab + "Save as Template" action

## Phase 8 — Edit/Re-prompt (API + UI)

- [ ] `app/api/generate-edit/route.ts` (POST)
- [ ] `components/library/EditAdModal.tsx`
- [ ] "Iterate" action on library ad cards

## Phase 9 — Prompt Composer (API + Page)

- [ ] `app/api/prompt/compose/route.ts` (POST)
- [ ] `components/create/PromptComposerPanel.tsx`
- [ ] `app/(protected)/create/compose/page.tsx`

## Phase 10 — Reverse Engineer (API + Page)

- [ ] `app/api/prompt/reverse/route.ts` (POST)
- [ ] `components/create/ReverseEngineerPanel.tsx`
- [ ] `app/(protected)/create/reverse/page.tsx`

## Phase 11 — Concept Generator (API + Integration)

- [ ] `app/api/prompt/concepts/route.ts` (POST)
- [ ] Integrate concepts step into `/create/ad` page

## Phase 12 — Campaign Builder (API + Page)

- [ ] `app/api/campaign/plan/route.ts` (POST)
- [ ] `app/api/campaign/generate/route.ts` (POST)
- [ ] `components/create/CampaignBuilder.tsx`
- [ ] `components/create/CampaignResultsGrid.tsx`
- [ ] `app/(protected)/create/campaign/page.tsx`

## Phase 13 — Create Hub Update

- [ ] Add Prompt Composer, Reverse Engineer, Campaign Builder cards to `/create/page.tsx`

---

## Notes

- OpenAI model in use: `gpt-4o-mini` (not `o4-mini` which is a reasoning model — confirm with user if switch is wanted)
- Image model: `gemini-3-pro-image-preview` (no change)
- Supabase bucket `brand-assets`: private, signed URLs (same pattern as `reference-images`)
