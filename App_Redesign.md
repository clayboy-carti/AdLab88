# AdLab 88 UI Redesign Direction (Web)
## Goal
Refresh the interface to feel like a modern creative "lab studio" SaaS.
Keep the existing brand colors, but shift the UI from rigid boxed layouts to a lighter, friendlier, more intuitive "floating cards" system with clearer hierarchy.
## Reference Style Characteristics (Adapted)
- Flat vector feel, clean + playful structure
- Lots of whitespace and breathing room
- Rounded cards/panels with soft elevation
- Clear visual hierarchy (title, section, field)
- Micro UI details: badges, chips, subtle icons
- Subtle background grid texture (very low opacity)
---
## Color System
### Keep (Core)
- Background: `#F3ECDC` (warm paper)
- Primary: `#1F3A32` (deep forest)
- Accent: `#B55233` (rust)
- Text: `#2A2A2A` (graphite)
### Add (Secondary Accent)
- Secondary accent: `#8FA99B` (soft sage)
  - Use for: secondary buttons, toggles, selected chips, subtle highlights, status pills
### Reduce Harshness
- Avoid pure black borders everywhere.
- Replace most outlines with forest at lower opacity (ex: `rgba(31,58,50,0.55)`).
- Keep `#111111` only for rare "technical" moments (ex: charts, special dividers) if needed.
---
## Typography + Hierarchy
### Fonts
- Inter for headings + body
- IBM Plex Mono for labels, metadata, "lab" UI flavor
### Sizing (Suggested)
- Page title: 36–44px (Inter, SemiBold)
- Section titles: 18–22px (Inter, SemiBold)
- Field labels: 11–12px uppercase (Plex Mono)
- Body text: 14–16px (Inter)
- Helper text: 12–13px (Inter)
### Rules
- Make hierarchy obvious with spacing and size.
- Labels stay mono; user content stays Inter.
---
## Layout System
### Core Shift
Move from "hard grid of bordered rectangles" to "floating panels on warm paper."
### Base Layout
- Left sidebar: fixed width, deep forest background
- Main content: warm paper background with subtle grid texture
- Content container max width: ~1200–1360px
- Use a consistent 8px spacing scale (8/16/24/32/40)
---
## Components (New Design Language)
### Cards / Panels
- Rounded corners: 16–20px radius
- Soft shadow: subtle, low opacity (forest tint)
- Border: 1px forest @ ~50–60% opacity
- Padding: 20–28px inside panels
- Cards should "float" with whitespace around them
### Inputs
- Inputs sit inside cards (no giant page-wide boxes)
- Rounded: 12–14px
- Background: slightly lighter neutral (`#EFE6D8`) or white
- Border: 1px forest @ ~40–55% opacity
- Focus state: sage outline + faint glow (very subtle)
### Buttons
- Primary button: Rust fill (`#B55233`), white text, rounded 12–14px
- Secondary button: Neutral fill (`#EFE6D8`) with forest text
- Tertiary: text button with underline or subtle hover background
- Always include hover + active states (small elevation or darken)
### Chips / Badges (Important)
Replace dropdown-heavy rows with chip sets where possible:
- Aspect ratio chips (1:1, 4:5, 16:9)
- Resolution chips (1K, 2K)
- Model chips (Gemini, etc.)
Chip behavior:
- Default: neutral background, forest outline
- Selected: sage background + forest text
- Active/primary selection can use rust sparingly
### Icons
- Minimal line icons
- Use sparingly to anchor sections (beaker, image, sliders, clock, folder)
- Keep them monochrome forest; use sage for active state
---
## Sidebar Redesign
### Current Issue
Feels dense and blocky.
### New Sidebar Rules
- More vertical spacing between nav items
- Active nav: rounded pill highlight (rust background)
- Add a thin rust indicator line on the left of active item (optional)
- Sidebar header area: logo + small subtitle (mono)
---
## Page-Level Structure (Create / Product Mockup Page)
### New Layout (Two-Column Workspace)
**Left column (controls):**
- "Mockup Setup" card
  - Title field
  - Description field
  - Photo / Preset row
  - Aspect ratio chips
  - Resolution chips
  - Model selector
  - Primary CTA: Generate Mockup
**Right column (output):**
- Large "Preview Canvas" card
  - Big placeholder state (friendly illustration or grid watermark)
  - States: Empty, Loading, Result
  - Result view includes: image preview + actions (Download, Regenerate, Save to Library)
### Why This Works
It feels like a creative tool (controls + canvas), not a form.
---
## Interaction + UX Rules
- Every page should have one obvious primary action
- Use progressive disclosure:
  - Basic settings visible by default
  - Advanced options tucked behind an "Advanced" accordion
- Add clear system feedback:
  - Loading skeletons inside cards
  - Toast notifications for "Saved", "Downloaded", "Queued"
  - Disabled button states with helper text
---
## Implementation Notes (For Dev)
- Create a small design system of reusable components:
  - Card
  - SectionHeader
  - Input / Textarea
  - Button (primary/secondary/tertiary)
  - ChipGroup
  - SidebarNavItem
  - Toast
  - Skeleton loaders
- Enforce spacing + radii tokens:
  - Radius: 12 / 16 / 20
  - Spacing: 8 / 16 / 24 / 32 / 40
- Replace heavy borders with subtle outlines and card elevation
- Keep the warm paper background and grid texture consistent across pages
---
## Definition of Done (Quick Checklist)
- Card-based layout with rounded panels and whitespace
- Clear typography hierarchy (Inter headings, Mono labels)
- Sidebar uses pill active state and better spacing
- Chip-based selection controls for ratio/resolution/model
- Two-column "controls + canvas" layout on Create page
- Consistent component tokens for spacing/radius/border/shadow
