# AdLab88 – MVP Feature List & Workflow (Page-Mapped)

---

# Page 1: /login – Authentication

## Purpose
Secure user access and isolate brand and ad data per account.

## Features
- Email + password signup (Supabase Auth)
- Login
- Persistent session management
- Protected routes
- Logout functionality

## Workflow
1. User lands on /login.
2. User signs up or logs in.
3. After authentication:
   - If brand exists → redirect to /create.
   - If brand does not exist → redirect to /brand.

---

# Page 2: /brand – Brand Profile Setup

## Purpose
Collect structured brand inputs that drive AI output quality.

## Key Idea
Ad quality is directly dependent on the quality of brand inputs.

---

## Features

### Multi-Step Onboarding Wizard
- Step progress indicator
- Validation on required fields
- Save to database
- Edit mode available after initial creation
- One brand per user (MVP constraint)

---

## Inputs Collected

### Step 1 – Core Identity
- Company name (required)
- What we do (1–2 sentences, required)
- Target audience (required)
- Unique differentiator

### Step 2 – Voice & Messaging
- Voice summary
- 3–5 personality traits
- Words to use
- Words to avoid
- Sample copy examples

### Step 3 – Visual Identity
- Brand colors (hex codes)
- Typography notes

---

## Workflow

1. User completes wizard steps.
2. System validates required fields.
3. Brand saved to `brands` table.
4. User redirected to /create.
5. User can return later to edit brand.

---

# Page 3: /create – Ad Creation

## Purpose
Generate AI-powered advertising image + copy.

This is the core value page.

---

## Section 1: Reference Image Management (within /create)

### Features
- Upload JPEG or PNG
- Store image in Supabase Storage
- Save in `reference_images` table
- Display thumbnail selector
- Limit: 5 images per user (MVP cap)

### Workflow
1. User uploads reference image.
2. Image stored securely.
3. Image appears in selector.
4. User selects image before generating ad.

---

## Section 2: Ad Generation Engine

### Input Required
- Existing brand profile
- Selected reference image

---

## Backend Process

### Step 1 – Load Context
System loads:
- Brand profile
- Copy frameworks
- Visual frameworks
- Positioning frameworks
- System prompt

---

### Step 2 – Strategy Selection
AI selects positioning angle based on:
- Target audience
- Differentiator
- Market assumptions

---

### Step 3 – Copy Generation
AI generates:
- Hook (5–10 words)
- Caption (1–3 sentences)
- CTA (3–5 words)

Copy must:
- Match brand voice
- Respect vocabulary rules
- Follow structured marketing frameworks

---

### Step 4 – Image Prompt Creation
AI creates structured visual instructions:
- Composition structure
- Text placement logic
- Brand color usage
- Visual hierarchy rules

---

### Step 5 – Image Generation
- Image generated via Replicate (Flux)
- Styled to match reference image
- Text embedded within the image

---

### Step 6 – Store in Database
System saves:
- Positioning angle
- Hook
- Caption
- CTA
- Generated image URL
- Timestamp

Saved to `generated_ads`.

---

## User Workflow on /create

1. User selects reference image.
2. User clicks "Generate Ad".
3. Loading state appears.
4. Within ~30 seconds:
   - Image renders
   - Copy displays
5. Ad automatically saved.
6. User can navigate to /library.

---

# Page 4: /library – Ad Library

## Purpose
Central location for viewing and downloading generated ads.

---

## Features

### Grid Display
Each ad card displays:
- Generated image
- Hook
- Caption
- CTA
- Positioning angle
- Date created

Sorted newest first.

---

## One-Click Download Feature (on /library)

### UI Requirement
- Visible download icon on each ad card
- Recommended placement: top-right corner of image

### Behavior
- Clicking icon triggers immediate download
- No redirect
- No new tab
- Direct file download

### Filename Format
companyname_ad_YYYY-MM-DD.png

### Security Requirement
- User can only download their own generated ads.
- Download endpoint validates ownership.

---

# Optional (MVP Extension): Manual Metrics (on /library)

## Purpose
Allow basic campaign tracking input.

## Features
- “Add Metrics” button on ad card
- Modal opens
- Fields:
  - Ad Spend
  - Impressions
  - Clicks
  - Conversions
- Save updates to `generated_ads`

No automated analysis in MVP.

---

# System Constraints (MVP)

- One brand per user
- One ad per generation click
- No batch generation
- No copy section regeneration
- No A/B testing tools
- No analysis page
- No dashboard
- No ad platform integration
- No billing system

---

# Complete End-to-End User Journey

1. User signs up on /login.
2. User configures brand on /brand.
3. User uploads reference image on /create.
4. User generates first ad.
5. Ad appears instantly.
6. User downloads image from /library.
7. User returns later and generates additional ads.
8. Library grows over time.

---

# MVP Definition of Done

MVP is complete when:

- Authentication works.
- Brand setup saves and edits properly.
- Reference image upload works.
- Ad generation works end-to-end.
- Ads appear in /library.
- Download icon works instantly.
- No critical generation or download failures.

Ship at this point.
