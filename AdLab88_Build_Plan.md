# AdLab88 Build Plan

Date: February 14, 2026  
Scope: MVP build plan based on the roadmap + page-mapped feature list + technical specification.

---

## 0. Guiding Constraints (MVP)

- Pages: `/login`, `/brand`, `/create`, `/library`
- One brand per user
- Max 5 reference images per user
- One ad per generation click
- Download icon button for generated image on each ad card
- No dashboard, no analytics page, no batch generation, no integrations

---

## 1. Phase 1: Project Bootstrap + Foundations (Day 1–2)

### 1.1 Repo + Tooling
- Initialize Next.js 14+ (App Router) project with TypeScript (strict mode)
- Tailwind CSS configured with AdLab88 palette + fonts
- pnpm setup
- ESLint + Prettier
- Husky + lint-staged (optional but recommended)

**Deliverables**
- Clean build (`pnpm build`)
- CI-ready lint + typecheck scripts

### 1.2 Base App Structure
- Implement directory structure:
  - `src/app/(auth)/login`
  - `src/app/(protected)/brand`
  - `src/app/(protected)/create`
  - `src/app/(protected)/library`
  - `src/app/api/*` routes for generation, upload, download
- Add shared layout with sidebar (protected routes only)
- Add global CSS rules for “no rounded corners” + terminal-ish UI conventions

**Deliverables**
- All routes render placeholder pages
- Sidebar navigation works in protected layout

---

## 2. Phase 2: Supabase Setup (Day 2–3)

### 2.1 Supabase Project
- Create Supabase project (staging first)
- Configure Auth (email/password)
- Create Storage buckets:
  - `reference-images` (private)
  - `generated-ads` (private)

### 2.2 Database Schema + Policies
- Create tables:
  - `brands`
  - `reference_images`
  - `generated_ads`
- Enable Row Level Security (RLS) and add policies for each table
- Add constraint: one brand per user (unique index)
- Add trigger: max 5 reference images per user
- Add indexes on:
  - `generated_ads.user_id`
  - `generated_ads.created_at DESC`
  - `reference_images.user_id`

### 2.3 Storage RLS
- Add storage policies:
  - users can upload/view/delete their own `reference-images`
  - users can upload/view their own `generated-ads`

**Deliverables**
- SQL migrations committed (or stored in `/supabase/migrations`)
- Verified RLS behavior using Supabase SQL editor:
  - user cannot read another user’s rows
  - user cannot access another user’s storage objects

---

## 3. Phase 3: Auth + Route Protection (Day 3–4)

### 3.1 Supabase Client/Server Helpers
- `src/lib/supabase/client.ts` (browser client)
- `src/lib/supabase/server.ts` (server client via cookies)

### 3.2 Middleware Protection
- `src/middleware.ts` to:
  - redirect unauthenticated users to `/login`
  - redirect authenticated users away from `/login`
  - route to `/brand` if no brand exists, otherwise `/create`

### 3.3 Login UI
- Build `/login` with:
  - toggle login/signup
  - error states
  - loading state

**Deliverables**
- Full auth flow works locally:
  - signup → `/brand`
  - login (existing) → `/create` (or `/brand` if missing)

---

## 4. Phase 4: Brand Setup Wizard (Day 4–6)

### 4.1 Form System
- React Hook Form (RHF) + Zod validation
- Stepper UI
- Draft form state across steps

### 4.2 `/brand` Page
- Create brand when missing
- Edit brand when exists (load existing record)
- Enforce “required” constraints:
  - `company_name`, `what_we_do`, `target_audience`, `sample_copy`

### 4.3 Data Shapes + Types
- Add TypeScript types:
  - `Brand` type
  - `ReferenceImage` type
  - `GeneratedAd` type

**Deliverables**
- Brand can be created and updated
- Wizard completes and routes to `/create`

---

## 5. Phase 5: Reference Image Upload (Day 6–7)

### 5.1 Upload UI (inside `/create`)
- Upload control (JPEG/PNG only, <= 5MB)
- Thumbnail list of uploaded images
- Select reference image for generation
- Enforce max 5 images (disable upload button when reached)

### 5.2 Upload API (recommended)
Create `POST /api/upload-image` to:
- validate auth
- validate mime type + size
- upload to `reference-images` bucket with path: `{userId}/{timestamp}-{filename}`
- write metadata row to `reference_images`

(You can also upload directly from client using Supabase Storage, but server route gives you consistent validation and easier auditing.)

**Deliverables**
- Upload works end-to-end
- Reference images appear and can be selected

---

## 6. Phase 6: AI Generation Pipeline (Day 7–12)

### 6.1 Framework Documents Strategy
- Store framework markdown files in project (versioned with Git)
- Server-side loads the documents once and caches them in memory (per server instance)

### 6.2 Claude Integration (copy + prompt)
- Create `src/lib/ai/claude.ts`
- Implement:
  - load brand profile
  - load selected reference image metadata
  - build system prompt using frameworks + brand context
  - request structured JSON output:
    - `positioning_angle`, `hook`, `caption`, `cta`, `imagePrompt`
- Validate Claude output with Zod before continuing
- Retry once on failure (with short delay)

### 6.3 Replicate Integration (Flux image)
- Create `src/lib/ai/replicate.ts`
- Generate signed URL for reference image
- Call Flux on Replicate with:
  - prompt = Claude’s `imagePrompt`
  - image = signed reference image URL
  - aspect ratio = `16:9` for MVP
- Download output image bytes and upload to `generated-ads` bucket
- Store final generated image URL (prefer signed URL for viewing, or store path and sign on-demand)

### 6.4 Generation API Route
`POST /api/generate-ad` should:
- Validate auth
- Fetch brand (single)
- Fetch reference image by id (ensure ownership)
- Call Claude (retry once)
- Call Replicate (retry once)
- Write row to `generated_ads`
- Return the created ad record

**Deliverables**
- Generate ad end-to-end in dev
- Consistent structured outputs
- Error states are visible in UI (no silent failure)

---

## 7. Phase 7: Create Page UI (Day 10–13)

### 7.1 `/create` Page
- Layout:
  - Reference image selector + upload
  - Generate button
  - “Generated Preview” panel with returned image + copy
- Loading states:
  - show step messaging: “Writing copy” then “Generating image” (optional but helpful)
- Disable generate until:
  - brand exists
  - reference image selected

### 7.2 Persist + Display
- After generation returns:
  - show preview on `/create`
  - confirm “Saved to Library”
- Provide a link button to `/library`

**Deliverables**
- User can generate first ad from `/create` without leaving the page

---

## 8. Phase 8: Library + Download (Day 13–15)

### 8.1 `/library` Page
- Query `generated_ads` for user
- Grid list (newest first)
- Ad card includes:
  - image preview
  - positioning angle
  - hook
  - caption
  - CTA
  - created date
  - download icon button

### 8.2 One-Click Download
Two implementation options:

**Option A (simple):** client downloads from a signed URL
- fetch signed URL server-side or via API
- download blob and trigger `a.download`

**Option B (more secure):** `GET /api/download-ad?adId=...`
- validate auth + ownership
- create signed URL internally, stream file back
- set headers: `Content-Disposition: attachment; filename="..."`

MVP recommendation: Option B, because you can enforce ownership and keep storage private.

**Filename**
- `companyname_ad_YYYY-MM-DD.png`

**Deliverables**
- Download icon triggers immediate file download
- Ownership enforced

---

## 9. Phase 9: Hardening, Testing, and Polish (Day 15–18)

### 9.1 Error Handling
- Centralize error UI (toast or inline banners)
- Add server-side logging for:
  - Claude failures
  - Replicate failures
  - DB write failures
- Handle timeouts gracefully

### 9.2 Rate Limiting (MVP minimal)
- Add basic user-based throttle on `/api/generate-ad`
  - example: max 10 generations per hour per user
- Store usage in memory for MVP, or in DB if you prefer

### 9.3 E2E Testing (Playwright)
Write critical path tests:
- signup/login
- brand creation
- upload reference image
- generate ad (mock APIs if needed for CI)
- view library
- download ad

### 9.4 Performance Pass
- Ensure image rendering uses lazy loading
- Keep library query paginated if needed (optional for MVP)
- Cache framework docs on server

**Deliverables**
- Green E2E critical path (at least locally)
- No obvious UX dead-ends

---

## 10. Phase 10: Deploy (Day 18–20)

### 10.1 Environments
- Create Supabase staging + production (or separate projects)
- Configure Vercel:
  - staging branch deploy
  - production deploy
- Set environment variables in Vercel:
  - Supabase keys
  - Anthropic key
  - Replicate token

### 10.2 Storage + RLS Verification (Prod)
- Re-verify policies in production:
  - can’t read other user’s rows
  - can’t download other user’s images
- Smoke test full user journey on production

**Deliverables**
- Production app live
- Verified generation + download flow

---

## 11. Suggested Task Breakdown (Sprint Style)

### Sprint 1 (Foundation)
- Repo bootstrap + UI base
- Supabase schema + RLS + storage
- Auth + middleware redirects

### Sprint 2 (Brand + Upload)
- Brand wizard + edit mode
- Reference image upload + selector

### Sprint 3 (Generation)
- Claude integration + strict JSON validation
- Replicate integration + storage upload
- `/create` UX with loading and preview

### Sprint 4 (Library + Download + Ship)
- Library grid
- Secure download endpoint
- E2E critical path
- Deploy staging → production

---

## 12. MVP Acceptance Checklist

- [ ] /login: signup + login works
- [ ] /brand: create + edit brand works (required fields enforced)
- [ ] /create: upload/select reference images (max 5 enforced)
- [ ] /create: generate ad returns image + copy and saves record
- [ ] /library: shows all generated ads
- [ ] /library: one-click download icon downloads image file
- [ ] RLS: users cannot access others’ brands/images/ads
- [ ] Basic retry logic for Claude + Replicate
- [ ] User sees errors clearly when generation fails

---

## 13. Post-MVP (Explicitly Not in This Build Plan)

- Multi-brand support
- Batch generation
- Component regeneration (copy-only, image-only)
- Performance dashboard + analysis page
- Ad platform integrations (Meta, Google)
- Billing and subscription tiers

