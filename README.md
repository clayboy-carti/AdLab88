# AdLab88

AI-powered advertising creative generation platform.

## Phase 1: Project Bootstrap ✅ COMPLETED
## Phase 2: Supabase Setup ✅ COMPLETED
## Phase 3: Auth + Route Protection ✅ COMPLETED

### What We Built

1. **Project Setup**
   - Next.js 14+ with TypeScript (strict mode)
   - Tailwind CSS with custom AdLab88 design system
   - pnpm package manager
   - ESLint and Prettier configured

2. **Directory Structure**
   - App Router with route groups: `(auth)` and `(protected)`
   - API routes: `/api/generate-ad`, `/api/upload-image`, `/api/download-ad`
   - Component structure: UI, brand, create, and library components
   - Library structure for Supabase, AI, prompts, and utilities

3. **Database & Auth**
   - Full database schema with RLS policies
   - Storage buckets for images with RLS
   - Email/password authentication
   - Middleware-based route protection
   - Functional login/signup flow

4. **Design System**
   - Custom color palette (paper, forest, rust, graphite, outline)
   - IBM Plex Mono and Inter fonts
   - Global CSS with no rounded corners
   - Reusable button and input styles

5. **Pages**
   - `/login` - Full auth flow (login/signup)
   - `/brand` - Brand setup wizard (placeholder)
   - `/create` - Ad generation interface (placeholder)
   - `/library` - Generated ads library (placeholder)

6. **Layout**
   - Shared sidebar navigation for protected routes
   - Active route highlighting
   - Working logout functionality

## Development

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Build for production
pnpm build

# Run linting
pnpm lint

# Type checking
pnpm typecheck
```

## Getting Started

### 1. Set Up Supabase

Follow the detailed guide in [SUPABASE_SETUP.md](SUPABASE_SETUP.md) to:
- Configure email/password authentication
- Run the database schema SQL
- Create storage buckets
- Set up RLS policies
- Get your environment variables

### 2. Configure Environment Variables

Update `.env.local` with your actual Supabase credentials from your dashboard:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Run the Development Server

```bash
pnpm dev
```

Visit http://localhost:3000 and test the auth flow:
- Sign up with a new account
- Login with existing credentials
- Navigate through protected routes
- Test logout functionality

## Next Steps (Phase 4: Brand Setup Wizard)

- Build multi-step form wizard
- Implement React Hook Form + Zod validation
- Create/edit brand functionality
- Form state persistence across steps

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Package Manager:** pnpm
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **AI:** Claude 3.5 Sonnet (Anthropic) + Flux (Replicate)

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `REPLICATE_API_TOKEN`
