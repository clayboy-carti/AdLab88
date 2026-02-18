# Generation Test Checklist

## 1. Prerequisites Check

### Browser Console Test
```javascript
// Paste in browser console on /create page
console.log('Selected Image:', document.querySelector('[title="Deselect"]') ? 'YES' : 'NO')
console.log('API Key:', localStorage.getItem('supabase.auth.token') ? 'Session exists' : 'No session')
```

### Manual API Test
```bash
# Test the API directly (replace IMAGE_ID with yours)
curl -X POST http://localhost:3000/api/generate-ad \
  -H "Content-Type: application/json" \
  -d '{"reference_image_id": "YOUR_IMAGE_ID_HERE"}'
```

## 2. Dev Server Check

```bash
# Make sure dev server is running
pnpm dev
```

## 3. Environment Variables

Check `.env.local` has:
```bash
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 4. Console Output Pattern

When you click GENERATE, you should see:
```
🚀 Generate button clicked!
Selected image ID: [uuid]
✅ Starting generation...
📡 Calling /api/generate-ad...
Response status: 200
Response data: { message: "Ad generated successfully", ad: {...} }
```

If you don't see ANY logs, the button click isn't firing.

## 5. Quick Fixes

### Fix 1: Hard Refresh
- Press `Ctrl + Shift + R` (or `Cmd + Shift + R` on Mac)
- Clears cached JavaScript

### Fix 2: Check Button State
```javascript
// In console on /create page
const button = document.querySelector('button.btn-primary')
console.log('Button exists:', !!button)
console.log('Button disabled:', button?.disabled)
console.log('Has onClick:', button?.onclick || button?.hasAttribute('onclick'))
```

### Fix 3: Restart Everything
```bash
# Kill dev server
# Ctrl + C

# Clear Next.js cache
rm -rf .next

# Restart
pnpm dev
```
