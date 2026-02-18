# Supabase Setup Guide

Follow these steps to set up your Supabase project for AdLab88.

## Prerequisites
- ✅ Supabase project created
- Your project URL and API keys ready

## Step 1: Enable Email/Password Authentication

1. Go to **Authentication** → **Providers** in your Supabase dashboard
2. Find **Email** provider
3. Enable **Email** authentication
4. **Disable** "Confirm email" (for easier MVP testing - can enable later)
5. Save changes

## Step 2: Run Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **New query**
3. Copy and paste the contents of `supabase/schema.sql`
4. Click **Run** to execute
5. Verify tables created:
   - `brands`
   - `reference_images`
   - `generated_ads`

## Step 3: Create Storage Buckets

### Option A: Create via Dashboard (Recommended)

1. Go to **Storage** in your Supabase dashboard
2. Click **Create a new bucket**

**Bucket 1: reference-images**
- Name: `reference-images`
- Public: **NO** (keep private)
- Click "Create bucket"
- After creation, click the bucket → Settings:
  - File size limit: `5242880` (5MB)
  - Allowed MIME types: `image/jpeg, image/png`

**Bucket 2: generated-ads**
- Name: `generated-ads`
- Public: **NO** (keep private)
- Click "Create bucket"
- After creation, click the bucket → Settings:
  - File size limit: `10485760` (10MB)
  - Allowed MIME types: `image/png`

### Option B: Create via SQL

1. Go to **SQL Editor**
2. Run the first part of `supabase/storage-setup.sql` (the INSERT statements)

## Step 4: Set Up Storage RLS Policies

1. Go to **SQL Editor**
2. Run the storage RLS policies from `supabase/storage-setup.sql`
   (The CREATE POLICY statements)

## Step 5: Get Your Environment Variables

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy these values to your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=<your-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-public-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-secret-key>
```

**Important:**
- ⚠️ Never commit `.env.local` to git
- The service role key should only be used server-side

## Step 6: Verify Setup

### Verify Tables
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```
Should return: `brands`, `reference_images`, `generated_ads`

### Verify RLS Policies
```sql
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
```
Should return policies for all three tables

### Verify Storage Buckets
```sql
SELECT * FROM storage.buckets;
```
Should return: `reference-images`, `generated-ads`

### Verify Storage Policies
```sql
SELECT * FROM pg_policies WHERE schemaname = 'storage';
```
Should return upload/view/delete policies for both buckets

## Step 7: Test Authentication

1. Make sure your `.env.local` is set up
2. Run `pnpm dev`
3. Go to http://localhost:3000
4. Try signing up with a test account
5. Check **Authentication** → **Users** in Supabase to see the new user

## Troubleshooting

### "Column does not exist" errors
- Make sure you ran `supabase/schema.sql` completely
- Check that all tables have the correct columns

### "Permission denied" errors
- Check that RLS policies are created correctly
- Verify the user is authenticated

### Storage upload fails
- Verify storage buckets exist
- Check that storage RLS policies are set up
- Ensure file size and MIME type restrictions are correct

### Can't sign up or login
- Check that Email provider is enabled in Authentication settings
- Verify your environment variables are correct
- Check browser console for error messages

## Next Steps

After completing this setup, you're ready to:
1. Test the full auth flow (signup → login → logout)
2. Move to Phase 4: Brand Setup Wizard
3. Start building the core features!
