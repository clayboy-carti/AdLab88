# ADLAB88 TECHNICAL SPECIFICATION
## MVP Build Document

**Version:** 1.0  
**Date:** February 14, 2026  
**Purpose:** Complete technical blueprint for experienced developer to build AdLab88 MVP

---

## EXECUTIVE SUMMARY

AdLab88 is a web application that generates advertising images with optimized copy using AI. The system loads brand context, applies marketing frameworks, and produces structured ad outputs.

**Build Time Estimate:** 3-4 weeks for experienced full-stack developer  
**Target:** Desktop-first, mobile-optimized SaaS  
**Core Flow:** User creates brand profile → uploads reference image → generates ad → downloads image

---

## RECOMMENDED TECH STACK

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict mode)
- **UI Library:** React 18+
- **Styling:** Tailwind CSS 3.4+
- **State Management:** Zustand or React Context (simple state only)
- **Forms:** React Hook Form + Zod validation
- **HTTP Client:** Native fetch with error boundaries

**Rationale:** Next.js provides SSR, API routes, and optimized builds. TypeScript prevents runtime errors. Tailwind enables rapid UI implementation matching the design system.

### Backend
- **Runtime:** Node.js 20+ LTS
- **Framework:** Next.js API Routes (server-side)
- **Database:** Supabase (PostgreSQL 15+)
- **Authentication:** Supabase Auth
- **File Storage:** Supabase Storage
- **AI Services:**
  - Claude 3.5 Sonnet (Anthropic API) for copy generation
  - Flux (via Replicate API) for image generation

**Rationale:** Supabase provides auth, database, and storage in one service with excellent RLS. Next.js API routes eliminate need for separate backend server.

### Infrastructure
- **Hosting:** Vercel (seamless Next.js deployment)
- **Database:** Supabase Cloud (managed PostgreSQL)
- **CDN:** Vercel Edge Network (automatic)
- **Environment:** Production + Staging environments

**Rationale:** Vercel and Supabase integrate natively. Zero DevOps overhead. Auto-scaling included.

### Development Tools
- **Package Manager:** pnpm (faster than npm/yarn)
- **Code Quality:** ESLint + Prettier
- **Git Hooks:** Husky + lint-staged
- **Type Checking:** TypeScript strict mode
- **Testing:** Playwright (E2E only for critical path)

---

## PROJECT STRUCTURE

```
adlab88/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── (protected)/
│   │   │   ├── brand/
│   │   │   │   └── page.tsx
│   │   │   ├── create/
│   │   │   │   └── page.tsx
│   │   │   └── library/
│   │   │       └── page.tsx
│   │   ├── api/
│   │   │   ├── generate-ad/
│   │   │   │   └── route.ts
│   │   │   ├── upload-image/
│   │   │   │   └── route.ts
│   │   │   └── download-ad/
│   │   │       └── route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── brand/
│   │   │   └── BrandWizard.tsx
│   │   ├── create/
│   │   │   ├── ReferenceImageUpload.tsx
│   │   │   └── AdGenerationForm.tsx
│   │   └── library/
│   │       └── AdCard.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   ├── ai/
│   │   │   ├── claude.ts
│   │   │   └── replicate.ts
│   │   ├── prompts/
│   │   │   ├── system.ts
│   │   │   └── frameworks.ts
│   │   └── utils/
│   │       ├── validation.ts
│   │       └── formatting.ts
│   ├── types/
│   │   ├── database.ts
│   │   ├── brand.ts
│   │   └── ad.ts
│   └── middleware.ts
├── public/
│   └── frameworks/
│       ├── vibe-marketing.md
│       ├── visual-framework.md
│       └── copy-framework.md
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## DATABASE SCHEMA

### Tables

#### users
Managed by Supabase Auth. Do not create manually.

```sql
-- Reference only (managed by Supabase)
CREATE TABLE auth.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### brands
```sql
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Core Identity
  company_name TEXT NOT NULL,
  what_we_do TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  unique_differentiator TEXT,
  
  -- Voice & Messaging
  voice_summary TEXT,
  personality_traits TEXT[], -- Array of 3-5 traits
  words_to_use TEXT[],
  words_to_avoid TEXT[],
  sample_copy TEXT NOT NULL, -- Minimum 1 example required
  
  -- Visual Identity
  brand_colors TEXT[], -- Hex codes
  typography_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brands"
  ON brands FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brands"
  ON brands FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brands"
  ON brands FOR UPDATE
  USING (auth.uid() = user_id);

-- Constraint: One brand per user (MVP limitation)
CREATE UNIQUE INDEX brands_user_id_idx ON brands(user_id);
```

#### reference_images
```sql
CREATE TABLE reference_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  storage_path TEXT NOT NULL, -- Path in Supabase Storage
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL, -- Bytes
  mime_type TEXT NOT NULL, -- 'image/jpeg' or 'image/png'
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE reference_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own images"
  ON reference_images FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own images"
  ON reference_images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own images"
  ON reference_images FOR DELETE
  USING (auth.uid() = user_id);

-- Index for user queries
CREATE INDEX reference_images_user_id_idx ON reference_images(user_id);

-- Enforce max 5 images per user
CREATE FUNCTION check_image_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM reference_images WHERE user_id = NEW.user_id) >= 5 THEN
    RAISE EXCEPTION 'Maximum 5 reference images per user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_image_limit
  BEFORE INSERT ON reference_images
  FOR EACH ROW
  EXECUTE FUNCTION check_image_limit();
```

#### generated_ads
```sql
CREATE TABLE generated_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  reference_image_id UUID REFERENCES reference_images(id) ON DELETE SET NULL,
  
  -- AI Output
  positioning_angle TEXT NOT NULL,
  hook TEXT NOT NULL, -- 5-10 words
  caption TEXT NOT NULL, -- 1-3 sentences
  cta TEXT NOT NULL, -- 3-5 words
  
  -- Generated Assets
  generated_image_url TEXT NOT NULL, -- Supabase Storage URL
  
  -- Optional Metrics (MVP extension)
  ad_spend DECIMAL(10, 2),
  impressions INTEGER,
  clicks INTEGER,
  conversions INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE generated_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ads"
  ON generated_ads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ads"
  ON generated_ads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ads"
  ON generated_ads FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX generated_ads_user_id_idx ON generated_ads(user_id);
CREATE INDEX generated_ads_created_at_idx ON generated_ads(created_at DESC);
```

### Storage Buckets

```sql
-- In Supabase Storage Dashboard, create two buckets:

-- 1. reference-images (private)
-- Max file size: 5MB
-- Allowed MIME types: image/jpeg, image/png

-- 2. generated-ads (private)
-- Max file size: 10MB
-- Allowed MIME types: image/png
```

### RLS Policies for Storage

```sql
-- reference-images bucket
CREATE POLICY "Users can upload own reference images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'reference-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own reference images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'reference-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own reference images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'reference-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- generated-ads bucket (similar policies)
CREATE POLICY "Users can upload own generated ads"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'generated-ads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own generated ads"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'generated-ads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## AUTHENTICATION IMPLEMENTATION

### Environment Setup

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Supabase Client Configuration

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript
// src/lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookie errors in Server Components
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookie errors in Server Components
          }
        },
      },
    }
  )
}
```

### Middleware for Protected Routes

```typescript
// src/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect all routes except /login
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users from /login to /create or /brand
  if (user && request.nextUrl.pathname === '/login') {
    // Check if brand exists
    const { data: brand } = await supabase
      .from('brands')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const redirectTo = brand ? '/create' : '/brand'
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### Login Page Implementation

```typescript
// src/app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        router.push('/brand') // New users go to brand setup
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.refresh() // Middleware handles redirect
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    // UI implementation follows design system
    <div className="min-h-screen bg-[#F3ECDC] flex items-center justify-center">
      <form onSubmit={handleAuth} className="w-full max-w-md p-8 border border-black bg-white">
        <h1 className="text-2xl uppercase font-mono mb-6">
          {isSignup ? 'SIGN UP' : 'LOGIN'}
        </h1>
        
        {error && (
          <div className="mb-4 p-3 border border-black bg-red-50 text-sm">
            {error}
          </div>
        )}
        
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-3 mb-4 border border-black font-mono"
          required
        />
        
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-3 mb-6 border border-black font-mono"
          required
        />
        
        <button
          type="submit"
          disabled={loading}
          className="w-full p-3 bg-[#B55233] border border-black text-white uppercase font-mono hover:bg-[#9a4429] disabled:opacity-50"
        >
          {loading ? 'LOADING...' : isSignup ? 'SIGN UP' : 'LOGIN'}
        </button>
        
        <button
          type="button"
          onClick={() => setIsSignup(!isSignup)}
          className="mt-4 text-sm underline"
        >
          {isSignup ? 'Already have an account? Login' : 'Need an account? Sign up'}
        </button>
      </form>
    </div>
  )
}
```

---

## BRAND PROFILE IMPLEMENTATION

### Multi-Step Form Component

```typescript
// src/components/brand/BrandWizard.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const brandSchema = z.object({
  company_name: z.string().min(1, 'Company name required'),
  what_we_do: z.string().min(10, 'Minimum 10 characters'),
  target_audience: z.string().min(5, 'Target audience required'),
  unique_differentiator: z.string().optional(),
  voice_summary: z.string().optional(),
  personality_traits: z.array(z.string()).max(5).optional(),
  words_to_use: z.array(z.string()).optional(),
  words_to_avoid: z.array(z.string()).optional(),
  sample_copy: z.string().min(20, 'Minimum 1 example required'),
  brand_colors: z.array(z.string().regex(/^#[0-9A-F]{6}$/i)).optional(),
  typography_notes: z.string().optional(),
})

type BrandFormData = z.infer<typeof brandSchema>

export default function BrandWizard({ existingBrand }: { existingBrand?: BrandFormData }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: existingBrand || {},
  })

  const onSubmit = async (data: BrandFormData) => {
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      ...data,
      user_id: user.id,
    }

    const { error } = existingBrand
      ? await supabase.from('brands').update(payload).eq('user_id', user.id)
      : await supabase.from('brands').insert(payload)

    if (error) {
      console.error('Brand save error:', error)
      setLoading(false)
      return
    }

    router.push('/create')
  }

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4))
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1))

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto">
      {/* Step 1: Core Identity */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl uppercase font-mono border-b-2 border-[#B55233] pb-2">
            STEP 1: CORE IDENTITY
          </h2>
          
          <div>
            <label className="block text-sm uppercase font-mono mb-2">Company Name *</label>
            <input
              {...register('company_name')}
              className="w-full p-3 border border-black"
            />
            {errors.company_name && (
              <p className="text-red-600 text-sm mt-1">{errors.company_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm uppercase font-mono mb-2">What We Do *</label>
            <textarea
              {...register('what_we_do')}
              rows={3}
              className="w-full p-3 border border-black"
              placeholder="1-2 sentences"
            />
            {errors.what_we_do && (
              <p className="text-red-600 text-sm mt-1">{errors.what_we_do.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm uppercase font-mono mb-2">Target Audience *</label>
            <input
              {...register('target_audience')}
              className="w-full p-3 border border-black"
            />
            {errors.target_audience && (
              <p className="text-red-600 text-sm mt-1">{errors.target_audience.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm uppercase font-mono mb-2">Unique Differentiator</label>
            <input
              {...register('unique_differentiator')}
              className="w-full p-3 border border-black"
            />
          </div>

          <button
            type="button"
            onClick={nextStep}
            className="w-full p-3 bg-[#B55233] border border-black text-white uppercase font-mono"
          >
            NEXT: VOICE
          </button>
        </div>
      )}

      {/* Step 2: Voice & Messaging */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl uppercase font-mono border-b-2 border-[#B55233] pb-2">
            STEP 2: VOICE & MESSAGING
          </h2>
          
          <div>
            <label className="block text-sm uppercase font-mono mb-2">Voice Summary</label>
            <textarea
              {...register('voice_summary')}
              rows={3}
              className="w-full p-3 border border-black"
              placeholder="How should your brand sound?"
            />
          </div>

          <div>
            <label className="block text-sm uppercase font-mono mb-2">
              Personality Traits (comma-separated, max 5)
            </label>
            <input
              {...register('personality_traits')}
              className="w-full p-3 border border-black"
              placeholder="professional, witty, bold"
            />
          </div>

          <div>
            <label className="block text-sm uppercase font-mono mb-2">
              Words to Use (comma-separated)
            </label>
            <input
              {...register('words_to_use')}
              className="w-full p-3 border border-black"
            />
          </div>

          <div>
            <label className="block text-sm uppercase font-mono mb-2">
              Words to Avoid (comma-separated)
            </label>
            <input
              {...register('words_to_avoid')}
              className="w-full p-3 border border-black"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={prevStep}
              className="flex-1 p-3 border border-black uppercase font-mono"
            >
              BACK
            </button>
            <button
              type="button"
              onClick={nextStep}
              className="flex-1 p-3 bg-[#B55233] border border-black text-white uppercase font-mono"
            >
              NEXT: VISUAL
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Visual Identity */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-xl uppercase font-mono border-b-2 border-[#B55233] pb-2">
            STEP 3: VISUAL IDENTITY
          </h2>
          
          <div>
            <label className="block text-sm uppercase font-mono mb-2">
              Brand Colors (hex codes, comma-separated)
            </label>
            <input
              {...register('brand_colors')}
              className="w-full p-3 border border-black"
              placeholder="#FF5733, #33FF57"
            />
          </div>

          <div>
            <label className="block text-sm uppercase font-mono mb-2">Typography Notes</label>
            <textarea
              {...register('typography_notes')}
              rows={3}
              className="w-full p-3 border border-black"
              placeholder="Fonts, weights, styles you prefer"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={prevStep}
              className="flex-1 p-3 border border-black uppercase font-mono"
            >
              BACK
            </button>
            <button
              type="button"
              onClick={nextStep}
              className="flex-1 p-3 bg-[#B55233] border border-black text-white uppercase font-mono"
            >
              NEXT: SAMPLE COPY
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Sample Copy */}
      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-xl uppercase font-mono border-b-2 border-[#B55233] pb-2">
            STEP 4: SAMPLE COPY
          </h2>
          
          <div>
            <label className="block text-sm uppercase font-mono mb-2">
              Sample Copy Examples *
            </label>
            <p className="text-sm text-gray-600 mb-2">
              Paste examples of copy that represents your brand voice (emails, social posts, website copy)
            </p>
            <textarea
              {...register('sample_copy')}
              rows={8}
              className="w-full p-3 border border-black"
              placeholder="Paste your brand's copy examples here..."
            />
            {errors.sample_copy && (
              <p className="text-red-600 text-sm mt-1">{errors.sample_copy.message}</p>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={prevStep}
              className="flex-1 p-3 border border-black uppercase font-mono"
            >
              BACK
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 p-3 bg-[#B55233] border border-black text-white uppercase font-mono disabled:opacity-50"
            >
              {loading ? 'SAVING...' : 'SAVE BRAND'}
            </button>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="mt-8 flex justify-center gap-2">
        {[1, 2, 3, 4].map((num) => (
          <div
            key={num}
            className={`w-12 h-1 ${
              num <= step ? 'bg-[#B55233]' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </form>
  )
}
```

---

## AD GENERATION API IMPLEMENTATION

### API Route Structure

```typescript
// src/app/api/generate-ad/route.ts
import { createClient } from '@/lib/supabase/server'
import { generateAdCopy } from '@/lib/ai/claude'
import { generateAdImage } from '@/lib/ai/replicate'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    
    // 1. Validate user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse request body
    const { reference_image_id } = await request.json()
    if (!reference_image_id) {
      return NextResponse.json({ error: 'Reference image required' }, { status: 400 })
    }

    // 3. Load brand profile
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand profile not found' }, { status: 404 })
    }

    // 4. Load reference image
    const { data: refImage, error: imageError } = await supabase
      .from('reference_images')
      .select('*')
      .eq('id', reference_image_id)
      .eq('user_id', user.id)
      .single()

    if (imageError || !refImage) {
      return NextResponse.json({ error: 'Reference image not found' }, { status: 404 })
    }

    // 5. Generate ad copy with Claude (with retry)
    let adCopy
    try {
      adCopy = await generateAdCopy(brand, refImage)
    } catch (error) {
      // Retry once
      await new Promise(resolve => setTimeout(resolve, 1000))
      adCopy = await generateAdCopy(brand, refImage)
    }

    // 6. Generate image with Replicate (with retry)
    let imageUrl
    try {
      imageUrl = await generateAdImage(adCopy.imagePrompt, refImage.storage_path)
    } catch (error) {
      // Retry once
      await new Promise(resolve => setTimeout(resolve, 2000))
      imageUrl = await generateAdImage(adCopy.imagePrompt, refImage.storage_path)
    }

    // 7. Save generated ad to database
    const { data: generatedAd, error: saveError } = await supabase
      .from('generated_ads')
      .insert({
        user_id: user.id,
        brand_id: brand.id,
        reference_image_id: reference_image_id,
        positioning_angle: adCopy.positioning_angle,
        hook: adCopy.hook,
        caption: adCopy.caption,
        cta: adCopy.cta,
        generated_image_url: imageUrl,
      })
      .select()
      .single()

    if (saveError) {
      return NextResponse.json({ error: 'Failed to save ad' }, { status: 500 })
    }

    return NextResponse.json({ ad: generatedAd }, { status: 200 })

  } catch (error: any) {
    console.error('Ad generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export const maxDuration = 60 // 60 second timeout for generation
```

### Claude Integration

```typescript
// src/lib/ai/claude.ts
import Anthropic from '@anthropic-ai/sdk'
import { readFile } from 'fs/promises'
import path from 'path'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function generateAdCopy(brand: any, referenceImage: any) {
  // Load framework documents from public/frameworks
  const vibeFramework = await readFile(
    path.join(process.cwd(), 'public/frameworks/vibe-marketing.md'),
    'utf-8'
  )
  const visualFramework = await readFile(
    path.join(process.cwd(), 'public/frameworks/visual-framework.md'),
    'utf-8'
  )
  const copyFramework = await readFile(
    path.join(process.cwd(), 'public/frameworks/copy-framework.md'),
    'utf-8'
  )

  const systemPrompt = `You are an expert advertising copywriter and strategist. You create ads that convert.

FRAMEWORKS TO APPLY:

${vibeFramework}

${visualFramework}

${copyFramework}

BRAND CONTEXT:

Company: ${brand.company_name}
What We Do: ${brand.what_we_do}
Target Audience: ${brand.target_audience}
Differentiator: ${brand.unique_differentiator || 'Not specified'}

Voice Summary: ${brand.voice_summary || 'Not specified'}
Personality Traits: ${brand.personality_traits?.join(', ') || 'Not specified'}
Words to Use: ${brand.words_to_use?.join(', ') || 'Not specified'}
Words to Avoid: ${brand.words_to_avoid?.join(', ') || 'Not specified'}

Sample Brand Copy:
${brand.sample_copy}

Brand Colors: ${brand.brand_colors?.join(', ') || 'Not specified'}
Typography: ${brand.typography_notes || 'Not specified'}

YOUR TASK:

1. Select ONE positioning angle from the frameworks that fits this brand
2. Generate ad copy with:
   - Hook: 5-10 words, attention-grabbing
   - Caption: 1-3 sentences, persuasive
   - CTA: 3-5 words, action-oriented
3. Create a detailed image generation prompt that:
   - Matches the reference image style
   - Incorporates brand colors
   - Places text strategically
   - Follows visual hierarchy principles

Return ONLY a JSON object with this structure:
{
  "positioning_angle": "string",
  "hook": "string",
  "caption": "string",
  "cta": "string",
  "imagePrompt": "string"
}

Match the brand voice precisely. Use the frameworks. No generic AI fluff.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    temperature: 0.7,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Generate an ad for this brand. Reference image style: ${referenceImage.file_name}`,
      },
    ],
  })

  const responseText = message.content[0].type === 'text' 
    ? message.content[0].text 
    : ''

  // Parse JSON response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Invalid response format from Claude')
  }

  const adCopy = JSON.parse(jsonMatch[0])

  // Validate response structure
  if (!adCopy.positioning_angle || !adCopy.hook || !adCopy.caption || !adCopy.cta || !adCopy.imagePrompt) {
    throw new Error('Incomplete ad copy from Claude')
  }

  return adCopy
}
```

### Replicate Integration

```typescript
// src/lib/ai/replicate.ts
import Replicate from 'replicate'
import { createClient } from '@/lib/supabase/server'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

export async function generateAdImage(
  imagePrompt: string,
  referenceImagePath: string
): Promise<string> {
  const supabase = createClient()

  // Get reference image URL
  const { data: urlData } = await supabase.storage
    .from('reference-images')
    .createSignedUrl(referenceImagePath, 3600)

  if (!urlData?.signedUrl) {
    throw new Error('Failed to get reference image URL')
  }

  // Run Flux model on Replicate
  const output = await replicate.run(
    'black-forest-labs/flux-dev',
    {
      input: {
        prompt: imagePrompt,
        image: urlData.signedUrl,
        prompt_strength: 0.8,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_outputs: 1,
        aspect_ratio: '16:9',
        output_format: 'png',
        output_quality: 90,
      },
    }
  )

  if (!Array.isArray(output) || !output[0]) {
    throw new Error('No image generated')
  }

  const imageUrl = output[0] as string

  // Download image from Replicate
  const imageResponse = await fetch(imageUrl)
  const imageBuffer = await imageResponse.arrayBuffer()

  // Upload to Supabase Storage
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const fileName = `${user.id}/${Date.now()}.png`
  
  const { error: uploadError } = await supabase.storage
    .from('generated-ads')
    .upload(fileName, imageBuffer, {
      contentType: 'image/png',
      upsert: false,
    })

  if (uploadError) {
    throw new Error('Failed to upload generated image')
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('generated-ads')
    .getPublicUrl(fileName)

  return publicUrlData.publicUrl
}
```

---

## REFERENCE IMAGE UPLOAD

### Upload Component

```typescript
// src/components/create/ReferenceImageUpload.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ReferenceImageUpload() {
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<any[]>([])
  const supabase = createClient()

  const loadImages = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('reference_images')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setImages(data)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      alert('Only JPEG and PNG files allowed')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be under 5MB')
      return
    }

    setUploading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upload to Supabase Storage
      const fileName = `${user.id}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('reference-images')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('reference_images')
        .insert({
          user_id: user.id,
          storage_path: fileName,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
        })

      if (dbError) throw dbError

      await loadImages()
    } catch (error: any) {
      console.error('Upload error:', error)
      alert(error.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-black p-8 text-center">
        <input
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleUpload}
          disabled={uploading || images.length >= 5}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className={`cursor-pointer uppercase font-mono text-sm ${
            images.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {uploading ? 'UPLOADING...' : 'UPLOAD REFERENCE IMAGE'}
        </label>
        <p className="text-xs mt-2 text-gray-600">
          {images.length}/5 images • JPEG/PNG • Max 5MB
        </p>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {images.map((img) => (
          <div key={img.id} className="aspect-square border border-black">
            <img
              src={supabase.storage
                .from('reference-images')
                .getPublicUrl(img.storage_path).data.publicUrl}
              alt={img.file_name}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## AD LIBRARY & DOWNLOAD IMPLEMENTATION

### Ad Card Component

```typescript
// src/components/library/AdCard.tsx
'use client'

import { useState } from 'react'

interface AdCardProps {
  ad: {
    id: string
    generated_image_url: string
    hook: string
    caption: string
    cta: string
    positioning_angle: string
    created_at: string
  }
  companyName: string
}

export default function AdCard({ ad, companyName }: AdCardProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const response = await fetch(ad.generated_image_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `${companyName.toLowerCase().replace(/\s+/g, '-')}_ad_${
        new Date(ad.created_at).toISOString().split('T')[0]
      }.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
      alert('Download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="border border-black bg-white p-4">
      <div className="relative group">
        <img
          src={ad.generated_image_url}
          alt={ad.hook}
          className="w-full aspect-video object-cover"
        />
        
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="absolute top-2 right-2 p-2 bg-[#B55233] border border-black text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
          title="Download image"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        </button>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-xs uppercase font-mono text-gray-500">
          {ad.positioning_angle}
        </p>
        
        <h3 className="text-lg font-bold">{ad.hook}</h3>
        
        <p className="text-sm">{ad.caption}</p>
        
        <p className="text-sm font-bold uppercase">{ad.cta}</p>
        
        <p className="text-xs text-gray-500">
          {new Date(ad.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}
```

### Library Page

```typescript
// src/app/(protected)/library/page.tsx
import { createClient } from '@/lib/supabase/server'
import AdCard from '@/components/library/AdCard'

export default async function LibraryPage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: brand } = await supabase
    .from('brands')
    .select('company_name')
    .eq('user_id', user.id)
    .single()

  const { data: ads } = await supabase
    .from('generated_ads')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl uppercase font-mono border-b-2 border-[#B55233] pb-2 mb-8">
        AD LIBRARY
      </h1>

      {!ads || ads.length === 0 ? (
        <div className="text-center py-16 border border-black bg-white">
          <p className="text-gray-500 uppercase font-mono text-sm">
            No ads generated yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} companyName={brand?.company_name || 'Ad'} />
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## DESIGN SYSTEM IMPLEMENTATION

### Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F3ECDC',
        forest: '#1F3A32',
        rust: '#B55233',
        graphite: '#2A2A2A',
        outline: '#111111',
      },
      fontFamily: {
        mono: ['IBM Plex Mono', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      spacing: {
        '4': '4px',
        '8': '8px',
        '16': '16px',
        '24': '24px',
        '48': '48px',
      },
    },
  },
  plugins: [],
}

export default config
```

### Global Styles

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #F3ECDC;
  color: #2A2A2A;
  font-family: 'Inter', sans-serif;
}

/* Remove all rounded corners globally */
* {
  border-radius: 0 !important;
}

/* Button base styles */
.btn-primary {
  @apply bg-rust border border-outline text-white uppercase font-mono px-6 py-3;
  @apply hover:bg-[#9a4429] transition-colors;
}

.btn-secondary {
  @apply bg-transparent border border-outline uppercase font-mono px-6 py-3;
  @apply hover:bg-gray-100 transition-colors;
}

/* Input base styles */
input[type="text"],
input[type="email"],
input[type="password"],
textarea,
select {
  @apply border border-outline bg-white p-3 font-mono;
  @apply focus:outline-none focus:border-2;
}

/* Card base styles */
.card {
  @apply border border-outline bg-white p-6;
}

/* Header underline accent */
.header-accent {
  @apply border-b-2 border-rust pb-2;
}
```

### Sidebar Component

```typescript
// src/components/ui/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()
  const supabase = createClient()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const links = [
    { href: '/brand', label: 'BRAND' },
    { href: '/create', label: 'CREATE' },
    { href: '/library', label: 'LIBRARY' },
  ]

  return (
    <aside className="w-[280px] h-screen bg-forest text-paper fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b border-paper/20">
        <h1 className="text-xl uppercase font-mono">
          ADLAB 88
        </h1>
        <div className="w-16 h-0.5 bg-rust mt-1" />
      </div>

      <nav className="flex-1 p-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block px-4 py-3 uppercase font-mono text-sm mb-2 border border-transparent ${
              pathname === link.href
                ? 'bg-rust text-outline border-outline'
                : 'hover:bg-forest/80'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-paper/20">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-3 uppercase font-mono text-sm border border-paper hover:bg-paper hover:text-forest transition-colors"
        >
          LOGOUT
        </button>
      </div>
    </aside>
  )
}
```

---

## ENVIRONMENT CONFIGURATION

### Required Environment Variables

```bash
# .env.example

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Anthropic API
ANTHROPIC_API_KEY=your_anthropic_api_key

# Replicate API
REPLICATE_API_TOKEN=your_replicate_api_token

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## DEPLOYMENT CONFIGURATION

### Vercel Deployment

```json
// vercel.json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role",
    "ANTHROPIC_API_KEY": "@anthropic-key",
    "REPLICATE_API_TOKEN": "@replicate-token"
  }
}
```

### Next.js Configuration

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig
```

---

## CODING BEST PRACTICES

### TypeScript Standards
- Use strict mode
- Define interfaces for all data structures
- No `any` types except in error handling
- Use Zod for runtime validation

### Component Standards
- Server Components by default
- Client Components only when needed (forms, interactivity)
- Extract reusable logic into custom hooks
- Keep components under 200 lines

### Error Handling
- Use try/catch in all async operations
- Provide user-friendly error messages
- Log errors server-side with context
- Implement retry logic for AI APIs

### Performance Optimization
- Lazy load images
- Use Next.js Image component
- Implement proper loading states
- Cache framework documents
- Minimize API calls

### Security Practices
- Never expose API keys client-side
- Use Supabase RLS for all database access
- Validate all user inputs
- Sanitize file uploads
- Implement rate limiting on generation endpoint

---

## TESTING STRATEGY

### Critical Path E2E Tests (Playwright)

```typescript
// tests/e2e/critical-path.spec.ts
import { test, expect } from '@playwright/test'

test('complete user journey', async ({ page }) => {
  // 1. Sign up
  await page.goto('/login')
  await page.fill('input[type="email"]', 'test@example.com')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')

  // 2. Create brand
  await expect(page).toHaveURL('/brand')
  await page.fill('input[name="company_name"]', 'Test Co')
  await page.fill('textarea[name="what_we_do"]', 'We sell widgets')
  await page.fill('input[name="target_audience"]', 'Small businesses')
  await page.click('button:has-text("NEXT")')
  
  // Continue through wizard...
  
  // 3. Upload reference image
  await expect(page).toHaveURL('/create')
  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles('tests/fixtures/test-image.jpg')
  await expect(page.locator('img')).toBeVisible()

  // 4. Generate ad
  await page.click('button:has-text("GENERATE")')
  await expect(page.locator('text=GENERATING')).toBeVisible()
  await expect(page.locator('.generated-ad')).toBeVisible({ timeout: 40000 })

  // 5. Download ad
  await page.goto('/library')
  const downloadPromise = page.waitForEvent('download')
  await page.click('button[title="Download image"]')
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/\.png$/)
})
```

### Manual Testing Checklist

**Authentication**
- [ ] Sign up with valid email/password
- [ ] Login with existing account
- [ ] Logout clears session
- [ ] Protected routes redirect to login

**Brand Profile**
- [ ] All required fields validate correctly
- [ ] Can save and edit brand
- [ ] Form persists between steps
- [ ] Only one brand per user enforced

**Reference Images**
- [ ] Upload JPEG works
- [ ] Upload PNG works
- [ ] File size limit enforced (5MB)
- [ ] Max 5 images enforced
- [ ] Delete image works

**Ad Generation**
- [ ] Generation completes under 30 seconds
- [ ] Copy matches brand voice
- [ ] Image style matches reference
- [ ] Retry works on failure
- [ ] Error states display correctly

**Ad Library**
- [ ] All generated ads display
- [ ] Sorted newest first
- [ ] Download button visible on hover
- [ ] Download filename correct
- [ ] No access to other users' ads

---

## PERFORMANCE TARGETS

### Page Load Times
- Initial page load: < 2s
- Brand wizard navigation: < 200ms
- Library grid render: < 1s

### API Response Times
- `/api/generate-ad`: < 30s (target 20s)
- `/api/upload-image`: < 3s
- Database queries: < 200ms

### Resource Limits
- Image uploads: 5MB max
- Generated images: 10MB max
- Total storage per user: 50MB (MVP)

---

## COST ESTIMATION

### Per Ad Generation
- Claude API: ~$0.20 (2000 tokens input + output)
- Replicate (Flux): ~$1.50 (one image)
- Supabase storage: ~$0.01
- **Total: ~$1.71 per ad**

### Monthly Fixed Costs (100 users, 5 ads each)
- Vercel Pro: $20
- Supabase Pro: $25
- Total generations: 500 ads
- Generation costs: $855
- **Total: ~$900/month**

---

## BUILD SEQUENCE

### Phase 1: Foundation (Week 1)
1. Initialize Next.js project
2. Configure Supabase
3. Set up database schema
4. Implement authentication
5. Create sidebar navigation

### Phase 2: Brand Profile (Week 2)
6. Build multi-step wizard
7. Implement form validation
8. Connect to Supabase
9. Add edit functionality

### Phase 3: Ad Generation (Week 2-3)
10. Set up reference image upload
11. Integrate Claude API
12. Integrate Replicate API
13. Build generation API route
14. Add loading states
15. Implement retry logic

### Phase 4: Ad Library (Week 3-4)
16. Build ad grid component
17. Implement download functionality
18. Add sorting
19. Test end-to-end flow

### Phase 5: Polish & Deploy (Week 4)
20. Implement design system
21. Add error handling
22. Performance optimization
23. E2E testing
24. Deploy to Vercel

---

## CRITICAL IMPLEMENTATION NOTES

### AI Generation
- Always retry Claude/Replicate calls once on failure
- Validate JSON structure from Claude before proceeding
- Set proper timeouts (60s for entire generation route)
- Cache framework documents in memory

### File Handling
- User ID must be part of storage path for RLS
- Always validate MIME types server-side
- Generate signed URLs for temporary access
- Clean up failed uploads

### Database
- Enable RLS on all tables from start
- Use indexes on user_id and created_at
- Enforce constraints at database level, not just app level
- Use UUID v4 for all IDs

### Security
- API keys server-side only
- Validate user ownership for all operations
- Use Supabase service role key only in API routes
- Implement CORS properly

---

## KNOWN LIMITATIONS (MVP)

1. One brand per user (no multi-brand support)
2. One ad per generation (no batch)
3. No ad editing after generation
4. No regeneration of individual components
5. No A/B testing tools
6. No performance analytics
7. No team collaboration
8. No platform integrations
9. 5 reference images max
10. Desktop-first (mobile optimized but not native app)

These are intentional constraints to ship value quickly.

---

## POST-MVP ROADMAP

**Phase 2 Features:**
- Multi-brand support
- Batch generation
- Component regeneration
- Performance dashboard
- Usage analytics
- Team accounts
- Advanced metrics
- Platform integrations (Meta, Google)

**Do not implement Phase 2 features in MVP.**

---

## SUPPORT & MAINTENANCE

### Monitoring
- Vercel Analytics for page performance
- Supabase Dashboard for database metrics
- Sentry for error tracking (add post-launch)

### Logging
- Log all AI API calls with timestamps
- Log generation failures with full context
- Track download success rates

### Backup
- Supabase automatic backups (daily)
- Export brand data weekly
- Keep framework documents in version control

---

## CONCLUSION

This specification provides everything needed to build AdLab88 MVP. The stack is proven, the architecture is straightforward, and the scope is deliberately constrained.

**Do not overengineer.**

Ship the four pages. Test the generation flow. Deploy to production.

Everything else is Phase 2.

Run better experiments.

---

**END OF TECHNICAL SPECIFICATION**
