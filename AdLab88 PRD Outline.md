1\. Product Overview
--------------------

### Product Name

AdLab 88

### Product Type

Web application (mobile-optimized desktop-first SaaS)

### Core Value Proposition

Generate high-quality advertising images with optimized copy using structured marketing frameworks and brand context.

### Primary User

Founder, small business owner, or marketer who:

*   Needs ads fast
    
*   Does not have design + copy expertise
    
*   Wants framework-driven outputs, not generic AI fluff
    

2\. MVP Goals
=============

### Primary Goal

User can:

1.  Create brand profile
    
2.  Upload reference image
    
3.  Generate ad (image + copy)
    
4.  View and store generated ads
    
5.  Download the generated image with one click
    

That’s it.

Everything else is phase 2.

3\. MVP Feature Scope
=====================

3.1 Authentication
------------------

### Required

*   Email/password signup (Supabase Auth)
    
*   Login
    
*   Protected routes
    
*   Session persistence
    

### Out of Scope (MVP)

*   OAuth providers
    
*   Team accounts
    
*   Role permissions
    

3.2 Brand Setup (Required for Ad Generation)
--------------------------------------------

### Objective

Collect structured brand data to condition AI output.

### Features

### 1\. Create Brand Profile

Multi-step form with:

**Step 1 – Core**

*   Company name (required)
    
*   What we do (required)
    
*   Target audience (required)
    
*   Unique differentiator (optional but recommended)
    

**Step 2 – Voice**

*   Voice summary
    
*   3–5 personality traits
    
*   Words to use
    
*   Words to avoid
    

**Step 3 – Visual**

*   Brand colors (hex)
    
*   Typography notes (free text)
    

**Step 4 – Sample Copy**

*   Large text area
    
*   Minimum 1 example required
    

### Requirements

*   One brand per user (MVP limitation)
    
*   Form validation
    
*   Save to brands table
    
*   Edit functionality
    
*   Redirect to Ad Creation after save
    

### Success Criteria

User can fully configure brand in under 10 minutes.

3.3 Reference Image Upload
==========================

### Objective

Give AI visual grounding.

### Features

*   Upload image (JPEG/PNG)
    
*   Store in Supabase Storage
    
*   Save record in reference\_images table
    
*   Display uploaded images in small selector
    

### Constraints

*   Max 5 stored images per user (MVP cap)
    
*   Max file size: 5MB
    

### Out of Scope

*   Curated library
    
*   Auto-style detection UI
    
*   Image editing
    

3.4 Ad Generation (CORE FEATURE)
================================

This is the product.

Generation Flow
---------------

When user clicks "Generate Ad":

### System Loads:

1.  Brand profile
    
2.  Framework docs (server-side)
    
3.  Reference image
    
4.  System prompt
    

AI Tasks
--------

1.  Select positioning angle
    
2.  Generate:
    
    *   Hook (5–10 words)
        
    *   Caption (1–3 sentences)
        
    *   CTA (3–5 words)
        
3.  Produce structured JSON output
    
4.  Create image generation prompt
    
5.  Generate image via Replicate (Flux)
    
6.  Store everything in DB
    

Output Requirements
-------------------

Each generated ad must include:

*   Positioning angle
    
*   Hook
    
*   Caption
    
*   CTA
    
*   Generated image URL
    
*   Timestamp
    

Saved to generated\_ads table.

Technical Requirements
----------------------

### Backend Route

POST /api/generate-ad

### Server Logic Must:

*   Validate user
    
*   Validate brand exists
    
*   Validate reference image exists
    
*   Handle Claude failures (retry once)
    
*   Handle image failures (retry once)
    
*   Return structured result
    

### Timeout Target

Total generation under 30 seconds.

Constraints (MVP)
-----------------

*   1 ad per generation click
    
*   No batch generation
    
*   No regeneration of parts
    
*   No editing before saving
    

3.5 Ad Library
==============

### Objective

Allow user to see and reuse generated ads.

### Features

*   Grid view of ads
    
*   Display:
    
    *   Image
        
    *   Hook
        
    *   Caption
        
    *   CTA
        
    *   Positioning angle
        
    *   Created date
        
*   One-click download icon on each ad
    

### One-Click Download Requirement

Each ad card must include:

*   A visible download icon button (top-right corner of image recommended)
    
*   Clicking the icon downloads the generated image file locally
    
*   No redirect
    
*   No new tab
    
*   Direct file download
    

### Technical Implementation

*   Use stored generated\_image\_url
    
*   Download via:
    
    *   Direct anchor tag with download attribute
        
    *   Or backend proxy route for secure file delivery
        
*   companyname\_ad\_YYYY-MM-DD.png
    

### Sorting

*   Newest first (default)
    

### Out of Scope

*   Filters
    
*   Performance metrics
    
*   Platform tagging
    
*   Export formats (zip bundles, etc.)
    
*   Deletion bulk actions
    

3.6 Basic Metrics Tracking (Optional MVP Extension)
===================================================

If included in MVP:

### Per Ad Editable Fields:

*   Ad Spend
    
*   Impressions
    
*   Clicks
    
*   Conversions
    

No analysis page yet.

Just manual input.

4\. Database Schema (MVP Required Tables)
=========================================

4.1 brands
----------

(as defined in roadmap)

4.2 reference\_images
---------------------

(as defined in roadmap)

4.3 generated\_ads
------------------

Minimum required fields:

*   ad\_id
    
*   user\_id
    
*   brand\_id
    
*   reference\_image\_id
    
*   positioning\_angle
    
*   hook
    
*   caption
    
*   cta
    
*   generated\_image\_url
    
*   created\_at
    

Metrics fields optional in MVP.

5\. Non-Functional Requirements
===============================

5.1 Performance
---------------

*   Generation under 30 seconds
    
*   UI responsive on mobile
    
*   Loading state visible
    
*   Image download should begin within 1 second of click
    

5.2 Security
------------

*   AI APIs server-side only
    
*   Supabase RLS (Row Level Security) enabled
    
*   Users only see their own ads
    
*   Download endpoint must validate user ownership
    

5.3 Error Handling
------------------

*   Graceful Claude failures
    
*   Graceful Replicate failures
    
*   Clear UI feedback
    
*   No silent crashes
    
*   Graceful fallback if download fails
    

6\. MVP Page Structure
======================

1.  /login
    
2.  /brand
    
3.  /create
    
4.  /library
    

That’s it.

Dashboard and Analysis are Phase 2.

7\. Out of Scope for MVP
========================

Do not build yet:

*   Analysis page
    
*   AI insights
    
*   Performance recommendations
    
*   A/B testing
    
*   Batch generation
    
*   Multi-brand support
    
*   Team collaboration
    
*   Ad platform integration
    
*   Auto website scraping
    
*   Usage billing system
    

Ship core first.

8\. MVP Success Metrics
=======================

### Product

*   Time to first ad < 10 minutes
    
*   95% generation success rate
    
*   2nd ad generated within 7 days
    
*   At least 50% of generated ads downloaded
    

### Technical

*   Error rate < 5%
    
*   Cost per ad < $2
    
*   Image generation success > 95%
    
*   Download success rate > 99%
    

9\. Build Order for MVP
=======================

1.  Auth
    
2.  Brand page
    
3.  Reference image upload
    
4.  API generate route
    
5.  Ad Creation UI
    
6.  Ad Library (with download button)
    

Stop.

Test with real brands.

10\. MVP Definition of Done
===========================

MVP is complete when:

*   User signs up
    
*   Creates brand
    
*   Uploads reference image
    
*   Generates ad
    
*   Sees image + copy
    
*   Clicks download icon
    
*   Image downloads successfully
    
*   Can return later and view in library
    

No analysis.No dashboard.No overengineering.

Ship value.