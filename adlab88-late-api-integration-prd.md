# AdLab88 - Late API Integration PRD
## Social Media Scheduling Implementation

**Version:** 1.0  
**Date:** February 16, 2026  
**Implementation Time:** 3-4 days  

---

## EXECUTIVE SUMMARY

### What We're Building
Social media scheduling functionality allowing users to schedule generated ads to Instagram, TikTok, Facebook, LinkedIn, and other platforms using the Late API.

### Why Late API
- No platform API approvals needed (Late handles all OAuth)
- Single endpoint for 13 platforms
- $19/month vs 8-12 months building custom integrations
- 99.97% uptime

### Value Proposition
After generating an ad, users schedule it to auto-post to social platforms at a specific date/time without leaving AdLab88.

---

## TECHNICAL ARCHITECTURE

### Current Stack
- Frontend: Next.js 14+ with TypeScript
- Backend: Next.js API routes
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth
- Storage: Supabase Storage

### New Components Required
1. Late API integration (server-side only)
2. Social account OAuth connection flow
3. Scheduling UI on `/create` page
4. Scheduled posts view on `/library` page
5. Two new database tables
6. Webhook handler for status updates

---

## DATABASE CHANGES

### New Table 1: `connected_accounts`
**Purpose:** Store user's connected social media accounts from Late

**Key Fields:**
- `user_id` (foreign key to auth.users)
- `late_account_id` (unique ID from Late API)
- `platform` (instagram, tiktok, facebook, etc.)
- `account_name` and `account_username`
- `is_active` (boolean)
- Timestamps

**RLS:** Users can only see/modify their own accounts

---

### New Table 2: `scheduled_posts`
**Purpose:** Track all scheduled social media posts

**Key Fields:**
- `user_id` (foreign key to auth.users)
- `ad_id` (foreign key to generated_ads)
- `late_post_id` (ID from Late API)
- `connected_account_id` (foreign key)
- `platform` (text)
- `scheduled_for` (timestamp)
- `status` (scheduled, processing, published, failed, cancelled)
- `caption` and `media_url`
- `error_message` (if failed)

**RLS:** Users can only see/modify their own scheduled posts

---

## LATE API INTEGRATION

### Authentication
Late uses OAuth for social account connections. Flow:
1. User clicks "Connect Instagram" in AdLab88
2. Redirect to Late's OAuth URL
3. User logs into Instagram and approves
4. Late redirects back to AdLab88 callback URL
5. Store account details in database

### Key Late API Endpoints

**Get OAuth URL:**
```
GET https://getlate.dev/api/v1/connect/{platform}
```

**Create Scheduled Post:**
```
POST https://getlate.dev/api/v1/posts
Body: { accountId, content, mediaUrls, scheduledFor }
```

**Cancel Post:**
```
DELETE https://getlate.dev/api/v1/posts/{postId}
```

**Webhooks:**
Late sends webhooks when posts publish or fail:
- `post.published`
- `post.failed`

---

## IMPLEMENTATION PHASES

### PHASE 1: Database Setup (2-3 hours)
**What:**
- Create `connected_accounts` table with proper indexes
- Create `scheduled_posts` table with proper indexes
- Set up Row Level Security policies for both tables
- Test policies work correctly

**Deliverable:** Database migrations applied, RLS working

---

### PHASE 2: API Routes (4-5 hours)
**What:**
Create 6 server-side API routes:

1. **POST /api/social/connect**
   - Generate Late OAuth URL for a platform
   - Return URL to frontend

2. **GET /api/social/callback**
   - Handle OAuth redirect from Late
   - Save connected account to database

3. **GET /api/social/accounts**
   - Fetch user's connected accounts
   - Return list for platform selector

4. **POST /api/social/schedule**
   - Accept: adId, accountId, scheduledFor, timezone
   - Build caption from ad's hook, caption, CTA
   - Call Late API to schedule post
   - Save scheduled post to database

5. **DELETE /api/social/schedule/[postId]**
   - Cancel a scheduled post
   - Call Late API to cancel
   - Update status in database

6. **POST /api/webhooks/late**
   - Receive webhook from Late
   - Update post status in database

**Deliverable:** All API routes working, tested with Postman/curl

---

### PHASE 3: Connect Account UI (3-4 hours)
**What:**
Build social account connection flow:

1. **ConnectAccountButton Component**
   - Shows buttons for Instagram, TikTok, Facebook, LinkedIn
   - Calls `/api/social/connect` to get OAuth URL
   - Redirects user to Late OAuth

2. **OAuth Callback Handler**
   - Late redirects back to `/api/social/callback`
   - Success message shown to user
   - Connected account appears in list

3. **Connected Accounts Display**
   - Show list of connected accounts
   - Platform icon + username
   - "Disconnect" option

**Deliverable:** User can connect Instagram account via OAuth

---

### PHASE 4: Scheduling UI (4-5 hours)
**What:**
Add scheduling interface to `/create` page:

1. **SchedulePostModal Component**
   - Opens after ad generation
   - Platform selector (dropdown of connected accounts)
   - Date picker
   - Time picker
   - Timezone selector
   - Caption preview (hook + caption + CTA)
   - "Schedule" button

2. **Integration on /create Page**
   - "Schedule Post" button next to download
   - Opens modal with generated ad data
   - Calls `/api/social/schedule` on submit
   - Shows success/error message

3. **Error Handling**
   - No connected accounts: Show "Connect Account First" message
   - Past date selected: Show error
   - API failure: Show user-friendly error

**Deliverable:** User can schedule posts from `/create` page

---

### PHASE 5: Scheduled Posts View (3-4 hours)
**What:**
Add scheduled posts section to `/library` page:

1. **ScheduledPostsList Component**
   - Query `scheduled_posts` for user
   - Show only scheduled/processing posts (not published/cancelled)
   - Grid/list view with:
     - Post image thumbnail
     - Platform badge
     - Scheduled date/time
     - Status badge
     - Caption preview
     - Cancel button

2. **Cancel Functionality**
   - Click cancel button
   - Confirm dialog
   - Call `/api/social/schedule/[postId]` DELETE
   - Remove from list
   - Show success message

3. **Real-time Updates**
   - Refresh list every 30 seconds
   - Or use Supabase realtime subscriptions

**Deliverable:** User can view and cancel scheduled posts

---

### PHASE 6: Webhook Integration (2-3 hours)
**What:**
Set up webhook to receive post status updates:

1. **Webhook Endpoint**
   - Already created in Phase 2
   - Receives POST from Late API
   - Updates `scheduled_posts` status

2. **Late Dashboard Configuration**
   - Login to Late dashboard
   - Go to Settings → Webhooks
   - Add webhook URL: `https://your-domain.com/api/webhooks/late`
   - Select events: post.published, post.failed

3. **Testing**
   - Schedule post for 2 minutes from now
   - Wait for it to publish
   - Verify webhook updates status
   - Check status shows correctly in UI

**Deliverable:** Webhooks update post status automatically

---

### PHASE 7: Testing & Polish (3-4 hours)
**What:**
End-to-end testing and polish:

1. **Complete User Flow Test**
   - Sign up new user
   - Connect Instagram account
   - Generate ad
   - Schedule post
   - View in scheduled posts
   - Cancel post
   - Schedule another and let it publish
   - Verify status updates

2. **Error Scenarios**
   - Try scheduling without connected account
   - Try scheduling to past date
   - Test with invalid API key
   - Test webhook with failed post

3. **UI Polish**
   - Loading states on all buttons
   - Success/error messages
   - Proper spacing and styling
   - Mobile responsive
   - Empty states

**Deliverable:** Production-ready feature

---

## ENVIRONMENT SETUP

### Required Environment Variables
```bash
LATE_API_KEY=your_late_api_key
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### Late Account Setup
1. Sign up at https://getlate.dev/signup
2. Choose Build plan ($19/month, 300 posts)
3. Get API key from dashboard
4. Add to environment variables

---

## DEPLOYMENT CHECKLIST

- [ ] Database migrations applied to production
- [ ] RLS policies enabled
- [ ] All environment variables set in Vercel
- [ ] Webhook URL configured in Late dashboard
- [ ] Test OAuth callback works with production URL
- [ ] Schedule test post and verify it publishes
- [ ] Verify webhook updates work

---

## SUCCESS CRITERIA

Feature is complete when:
- [ ] User can connect Instagram account via OAuth
- [ ] User can schedule generated ad to Instagram
- [ ] Scheduled post appears in database and UI
- [ ] Post publishes at scheduled time
- [ ] Status updates to "published" automatically
- [ ] User can cancel scheduled posts
- [ ] All error cases handled gracefully

---

## COST BREAKDOWN

**Late API:**
- Build Plan: $19/month for 300 posts
- Cost per post: $0.063

**Total Cost Per Ad:**
- Ad generation: ~$1.71 (existing)
- Scheduling: $0.063
- **Total: ~$1.77 per scheduled ad**

---

## FILE STRUCTURE

**New API Routes:**
```
/app/api/social/connect/route.ts
/app/api/social/callback/route.ts
/app/api/social/accounts/route.ts
/app/api/social/schedule/route.ts
/app/api/social/schedule/[postId]/route.ts
/app/api/webhooks/late/route.ts
```

**New Components:**
```
/components/ConnectAccountButton.tsx
/components/SchedulePostModal.tsx
/components/ScheduledPostsList.tsx
```

**Modified Files:**
```
/app/create/page.tsx (add schedule button)
/app/library/page.tsx (add scheduled posts view)
```

---

## TROUBLESHOOTING

**OAuth not working:**
- Verify callback URL is HTTPS in production
- Check URL matches exactly in Late dashboard

**Posts not scheduling:**
- Verify Late API key is valid
- Check scheduled time is in future (UTC)
- Look at error in Late dashboard

**Webhook not updating:**
- Test webhook endpoint is publicly accessible
- Check webhook URL configured in Late dashboard
- Verify no firewall blocking Late's IPs

---

## NEXT STEPS AFTER MVP

Once working:
1. Add analytics (fetch performance from Late API)
2. Bulk scheduling (same ad to multiple platforms)
3. Calendar view of scheduled posts
4. Platform-specific caption customization
5. Recurring queue system

---

**End of Document**
