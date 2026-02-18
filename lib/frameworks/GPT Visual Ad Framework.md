# Visual Ad Frameworks - Complete Reference

## Introduction

This document is a reference blueprint for generating high-converting advertising images across common digital placements (feed, stories/reels full-screen, display banners). It turns visual design principles into repeatable rules an image-generation system can apply.

Use it like an algorithm:

1. Define the platform placement, aspect ratio, and primary objective (awareness, consideration, conversion).
2. Choose a layout template (from the layout templates section) that fits the objective and message complexity.
3. Establish a single primary focal point and a strict hierarchy (what the viewer notices first, second, third).
4. Apply composition constraints (grid, safe zones, negative space, balance).
5. Apply color and typography constraints (contrast, readability, accessibility).
6. Enforce platform specs (dimensions, file size, format, animation rules).
7. Run the final checklist before export.

The rules below prioritize measurable outcomes: attention control, comprehension speed, readability, and platform compliance. Research and standards are cited throughout (for example: Web Content Accessibility Guidelines (WCAG), platform specification pages, and peer-reviewed advertising and perception studies). citeturn0search4turn8search2turn5view4turn19view1turn18view5

## Composition rules

Effective ad composition is attention engineering under severe constraints: small screens, fast scroll, cluttered environments, and split-second comprehension. Digital ad clutter and visual complexity measurably change attention distribution and can reduce conversion outcomes, so composition must bias toward clarity and controlled scanning. citeturn19view1turn19view2

image_group{"layout":"carousel","aspect_ratio":"16:9","query":["rule of thirds grid illustration","visual hierarchy infographic design","negative space minimalist advertisement example","split screen advertisement layout template"],"num_per_query":1}

**Rule of thirds**

Definition: Divide the canvas into a 3x3 grid (two vertical and two horizontal lines). The four intersections are high-salience “anchor points” where viewers tend to find compositionally important elements faster than dead-center placement in many layouts. This is a compositional heuristic used across photography, graphic design, and interface layout. citeturn10search6turn10search3

Systematic application to ad images:

- Place the *primary focal object* (product, face, transformation result) on an intersection or along a grid line, then leave the opposite side for headline and CTA (call to action (CTA)) to keep hierarchy clean.
- For 1:1 and 4:5 feed images, the upper-left and upper-right intersections often outperform lower intersections for immediate attention in thumb scroll contexts because the first fixation is frequently in the upper region of a tile in a scrolling feed (a practical extension of common scan behavior). Eye-tracking research shows users often scan content in predictable patterns, including top-heavy scanning when content has text and structure. citeturn2search1turn9search4
- For 9:16 full-screen ads, use the upper third for hook and brand identifier, middle third for hero visual, lower third for CTA, while keeping UI safe zones clear (details in platform section). citeturn12search6turn15search9

Where to place focal points:

- Primary subject: one of the four intersections.
- Headline: along the top third line (left aligned) for text-first ads, or along the lower third for product-first ads.
- CTA: bottom-right area is common for conversion layouts because it aligns with natural “finish” zones in many left-to-right scan patterns, but it must respect safe zones and touch-size constraints. citeturn18view1turn16view4

Examples (described as layout annotations):

- DTC (direct-to-consumer (DTC)) product: product on right intersection; headline on left third; CTA bottom-left with high-contrast accent; logo small top-left.
- SaaS (software as a service (SaaS)): headline top-left; UI screenshot anchored right third; benefit chips stacked left; CTA bottom-right.

When to break rule of thirds intentionally:

- Symmetry-driven trust: centered, symmetrical compositions can read as stable, premium, or “official” for finance, healthcare, and enterprise software, as long as hierarchy remains obvious. Balance and hierarchy still govern outcomes even when the grid heuristic is broken. citeturn9search7turn9search4
- Single-product hero with centered pack-shot: when the product silhouette is the brand’s strongest asset and you want maximal recognizability (common in established brands).
- Before/after splits: the split itself becomes the structure; thirds can conflict with the required comparison symmetry.

**Visual hierarchy**

Definition: Visual hierarchy is the ordering of elements by perceived importance, guiding the viewer to process the ad in the intended sequence. It is built through scale, contrast, grouping, and placement. A clear hierarchy reduces “where do I look?” friction. citeturn9search4turn9search1

Why it matters in advertising: In cluttered environments, the viewer allocates limited attention across many competing stimuli. Ads that fail to impose hierarchy get partial viewing and weak message retention. Digital clutter has been shown to meaningfully moderate ad viewership and conversion outcomes. citeturn19view1turn18view5

Systematic hierarchy rules (apply in this priority order):

- **Size hierarchy** (largest to smallest):
  1. Primary focal (product/face/result): typically 35% to 65% of the canvas area depending on template.
  2. Headline (hook): the largest text element (often 2x to 3x subhead size).
  3. Supporting qualifier (benefit, offer detail): smaller than headline, larger than body.
  4. CTA button and CTA text: button must be visually heavier than body text, but typically lighter than headline.
  5. Logo/brand mark: smallest or tied with CTA label, positioned consistently. NNG (Nielsen Norman Group) guidance on hierarchy emphasizes using limited type sizes (commonly 2-3) and contrast to indicate importance. citeturn9search1turn9search7

- **Placement hierarchy**:
  - Put the most important element in the “first fixation zone” of the template (often upper-left for text-led, center for image-led).
  - Group related items; don’t scatter. Gestalt principles (for example, proximity, similarity) describe how viewers group elements, which can be used to make an ad feel organized and scannable. citeturn10search1turn10search4

- **Color hierarchy**:
  - Use one accent color for the CTA and one for the focal highlight.
  - Use muted or neutral colors for non-essential elements.
  - A practical rule often used in UI and layout is the 60-30-10 distribution: dominant color (60%), secondary (30%), accent (10%) to prevent chaotic color competition. citeturn9search10

Guiding the eye through an ad:

- Use contrast and grouping to create a “path” (headline → focal visual → benefit → CTA).
- Avoid zigzag layouts that force alternating alignment across columns; eye-tracking indicates zigzagging layouts can reduce scanning efficiency compared to aligned layouts. citeturn2search2

F-pattern and Z-pattern (practical ad usage):

- **F-pattern**: Often observed in text-heavy scanning: viewers scan across the top, then down the left side, with shorter horizontal scans. Use it for ads with short headline + short bullet stack (features list). citeturn2search1
- **Z-pattern (simplified)**: For low-text, strong-visual layouts, place key elements at top-left, top-right, bottom-left, bottom-right to encourage coverage of the full canvas. Treat this as a heuristic for distributing anchors, not as permission to alternate alignment every line. Eye-tracking evidence suggests forced zigzag alignment harms scan efficiency, so keep text blocks aligned even if anchors form a Z. citeturn2search2

**Focal point creation**

Goal: Create one dominant focal point unless the layout is inherently comparative (before/after, product grid).

Techniques (systematizable):

- **Contrast**: Raise local contrast around the focal object using luminance (lightness), saturation, and sharpness, keeping background lower contrast. Contrast is a foundational perceptual principle used to distinguish elements. citeturn9search7
- **Isolation**: Increase negative space around the focal by reducing nearby competing elements. White space and simplicity are repeatedly emphasized in advertising practice and research as tools to convey meaning, sophistication, and readability. citeturn18view4turn19view2
- **Leading lines**: Use edges, arms, product diagonals, or perspective lines that point toward the product or CTA to guide gaze flow. citeturn10search9turn10search19
- **Framing within the frame**: Use windows, doorways, circles, or packaging shapes to frame the product or face. This concentrates attention by creating a visual boundary. citeturn10search15
- **Directional gaze**: Faces can pull attention, but gaze direction matters. Eye-tracking research on banner ads found that faces with averted gaze can increase attention to ad text and product, while mutual gaze can trap attention on the face and reduce memory for the message. Use gaze direction to point at the product or CTA. citeturn18view5

Single vs multiple focal points:

- Use **single focal** for conversion ads (one action, one offer).
- Use **multiple focal points** only when the decision requires comparison inside the creative (for example: product grid, before/after, tiered pricing). Be aware that additional focal points increase cognitive load and can reduce clarity, especially in mobile feed contexts. Research on ad complexity shows that visual complexity meaningfully interacts with brand perception and response, and simplicity can improve conceptual fluency in some contexts. citeturn19view2

**Negative space (whitespace)**

Advertising value: Negative space increases legibility, shifts perceived sophistication, and helps the message dominate the canvas. Research on white space in advertising describes it as a deliberate part of commercial visual rhetoric and highlights long-standing tensions between perceived “empty space” and persuasive value. citeturn18view4

Operational rules:

- Use negative space as a buffer around text and CTA, especially on mobile.
- Do not collapse margins to the edge; viewers interpret edge-crowding as low quality and it also creates platform cropping risk.

How much negative space is “optimal”:

- There is no universal ratio, but there are platform constraints and evidence about clutter and complexity.
- For Google responsive display assets, Google explicitly warns that blank space should not exceed 80% of the image, and recommends making the product/service the focus. Treat this as a hard constraint for those placements. citeturn16view6
- For feed and story ads, use negative space to create separation between headline, focal object, and CTA. Overly dense designs contribute to complexity, and research shows complexity moderates ad effectiveness depending on context and brand cues. citeturn19view2turn19view1

Platform differences:

- Mobile-first: increase padding and simplify the scene because small screens and thumb-driven interactions make clutter more punishing. Thumb-zone research and mobile ergonomics show reachability and comfortable interaction zones matter for engagement. citeturn18view1turn16view4

**Balance and symmetry**

Definitions:

- Symmetrical balance: mirrored visual weight across a central axis, often perceived as stable and “clean.”
- Asymmetrical balance: unequal elements that still feel balanced through visual weight distribution, often perceived as dynamic. citeturn10search2turn10search7

When to use in advertising:

- Symmetry: premium, trust, regulated categories, “official” announcements, or when the product is centered and iconic.
- Asymmetry: performance ads, scroll-stopping visuals, lifestyle shots, and situations where you want motion and energy without chaos.

Intentional imbalance and tension:

- Use imbalance only when the CTA and primary message remain obvious. Imbalance should be used to create movement toward the CTA, not to create ambiguity.

## Color psychology and contrast standards

Color influences attention, brand perception, and emotional response, but effects are moderated by context, culture, saturation/value, and the specific behavior you want (click vs trust vs urgency). Reviews of color psychology emphasize real effects on affect, cognition, and behavior, while also warning that strong application claims require attention to boundary conditions and generalizability. citeturn18view2turn34view2turn37view3

### Color meanings and associations by major color

Use these as *probabilistic priors*, not deterministic rules. Color meaning differs across cultures and markets, and cross-cultural research shows both similarities and important differences in meanings and preferences. citeturn39view1turn38search4turn37view3

**Red (urgency, arousal, appetite, intensity)**  
Psychological associations: arousal, intensity, action orientation; valence can be positive or negative depending on context. Systematic review evidence suggests red is often associated with higher arousal and can be valence-ambivalent. citeturn37view3turn18view2  
When to use: urgency offers, limited-time drops, impulse categories, entertainment launches. Use carefully in trust-sensitive contexts because red can signal warning or aggression depending on execution. citeturn37view3turn21search11  
Industries: food, retail, entertainment, sports. Marketing literature discusses how warm colors (including reds/oranges) can be leveraged for appetite and excitement cues. citeturn34view2turn26search9  
Emotional response: energy, urgency, excitement; sometimes threat or error semantics. citeturn37view3turn21search11  
Brand example: entity["company","Netflix","streaming company"] explicitly calls “Netflix Red” its signature brand color. citeturn27search0

**Blue (trust, stability, calm, competence)**  
Psychological associations: lower arousal than red in many reports; commonly perceived as calming and reliable, with trust-linked usage in commerce and interfaces. citeturn37view3turn39view1turn16view4  
When to use: finance, SaaS, healthcare, enterprise, security, warranties, “safe choice” positioning.  
Industries: financial services, B2B (business-to-business (B2B)), government-adjacent, tech.  
Emotional response: calm, safety, competence. citeturn37view3turn14search8  
Brand example: entity["company","PayPal","payments company"] publishes a primary color palette dominated by blues (with specific hex values). citeturn30view3

**Green (health, nature, growth, “go”, sustainability)**  
Psychological associations: commonly linked to low arousal and calm in emotion-color literature; frequently mapped to nature/relaxation contexts. citeturn37view3turn21search2turn21search17  
When to use: wellness, eco claims, finance “growth” cues, productivity, “approved/complete” semantics.  
Industries: health, sustainability, fintech, food, outdoor.  
Emotional response: calm, balance, freshness. citeturn21search2turn37view3  
Brand example: entity["company","Spotify","music streaming company"] specifies its green logo as the primary logo colorway and restricts how it is used for legibility. citeturn34view7

**Yellow (attention, warmth, optimism, caution)**  
Psychological associations: frequently associated with high arousal (especially saturated yellows), attention capture, and “warning” semantics depending on context. citeturn37view3turn23search6  
When to use: youthful energy, highlights, price/offer badges, “new” callouts. Use sparingly as a background for text because bright yellow can reduce readability unless contrast is carefully controlled. citeturn8search2turn8search0  
Industries: youth brands, entertainment, fast-moving consumer categories.  
Emotional response: optimism, activation, warmth; can become fatiguing at high saturation, especially on large areas. citeturn37view3turn23search6  
Brand example: entity["company","Snap Inc.","social media company"] brand standards specify “Snap Yellow” and provide its hex (#FFFC00). citeturn32view1

**Orange (energy, enthusiasm, affordability, friendliness)**  
Psychological associations: warm, active, attention-grabbing; often positioned as approachable and energetic. Warm colors are frequently discussed as more arousing than cool colors. citeturn26search9turn37view3  
When to use: discount/value positioning, onboarding/activation, friendly CTAs, creator economy products.  
Industries: ecommerce, food, tools/DIY, logistics, consumer tech.  
Emotional response: enthusiasm, momentum, playful energy. citeturn37view3turn23search6  
Brand example: entity["company","Amazon","ecommerce company"] brand usage guidelines define corporate colors as black and “Amazon Orange” with hex values. citeturn34view4

**Purple (luxury, creativity, imagination, power)**  
Psychological associations: often reported as higher “power” correspondence alongside red and black in large-scale review findings; can signal premium or imaginative categories depending on shade. citeturn37view3  
When to use: premium upgrades, creator tools, beauty/fragrance, entertainment, “exclusive drop” messaging.  
Industries: beauty, gaming, creator platforms, premium consumer goods.  
Emotional response: creativity, intrigue, premium. citeturn37view3turn23search6  
Brand example: entity["company","Twitch","live streaming company"] describes purple as central to its identity and notes its role across advertising and products. citeturn34view8

**Black (sophistication, power, luxury, authority)**  
Psychological associations: often linked to high power correspondences, and can signal luxury or seriousness depending on contrast and typography. citeturn37view3  
When to use: premium fashion, tech minimalism, luxury services, high-contrast CTA frameworks where white text is required.  
Industries: luxury, premium tech, automotive, nightlife/entertainment.  
Emotional response: authority, elegance, seriousness. citeturn37view3turn23search6  
Brand example: entity["company","Uber","rideshare company"] brand book states primary brand colors are white and black, used for accessibility and consistency. citeturn28search2

**White (purity, cleanliness, simplicity, minimalism)**  
Psychological associations: low arousal correspondences are frequently reported for white in emotion-color literature; in design, white space is also a structural tool for clarity. citeturn37view3turn18view4  
When to use: healthcare, premium minimalism, “clean ingredients,” SaaS clarity, and anywhere you need maximum readability and separation.  
Industries: healthcare, skincare, enterprise software, premium goods.  
Emotional response: cleanliness, calm, openness. citeturn18view4turn37view3  
Brand example: Uber again is a direct example because its primary palette is explicitly black/white for accessibility-focused simplicity. citeturn28search2

**Pink (playful, youthful, modern, feminine-coded in many markets)**  
Psychological associations: color meaning is culturally and socially mediated; “pink” meanings are not universal and are shaped by market norms and context. Cross-cultural research warns against assuming a single meaning globally. citeturn39view1turn37view3  
When to use: youth-coded brands, beauty, lifestyle subscriptions, “fun premium” positioning.  
Industries: beauty, fashion, lifestyle, mobile apps.  
Emotional response: playful warmth, softness, modern pop depending on saturation. citeturn37view3turn23search6  
Brand example: entity["company","T-Mobile","telecom company"] publicly frames “New Magenta” as a defining brand color. citeturn29search15

**Brown (natural, organic, reliable, earthy, “heritage”)**  
Psychological associations: often grouped with black in some meaning-cluster findings; can signal groundedness, ruggedness, or traditional reliability depending on palette pairing. citeturn39view1turn37view3  
When to use: organic goods, coffee/chocolate, outdoor gear, heritage brands, shipping/logistics.  
Industries: food, outdoors, logistics, furniture/home goods.  
Emotional response: groundedness, warmth, stability. citeturn37view3turn39view1  
Brand example: entity["company","UPS","shipping company"] brand guidelines treat “the color brown” as a protectable brand element and require specific trademark language in some uses. citeturn27search6turn27search3

### Color combinations

Use color harmony tools as *structure* for palette generation, then validate with contrast testing.

Core families:

- Complementary: opposite on the color wheel, high contrast and high impact (use to highlight CTA or the focal point). citeturn20search1turn20search15  
- Analogous: adjacent hues, harmony and smoother emotional tone (use for lifestyle, wellness, “calm premium”). citeturn20search1turn20search15  
- Triadic: three evenly spaced hues, vibrant but can become chaotic without strict hierarchy (use one dominant, two accents). citeturn20search1turn20search8  
- Monochromatic: single hue with varied lightness/saturation, sophisticated and minimal (use when typography and product silhouette carry the ad). citeturn20search15

Practical palette generation tools:

- Adobe Color wheel and harmony generator. citeturn20search1turn20search5  
- Coolors palette generator. citeturn20search2

### Color contrast for readability and accessibility

For ad images, the viewer cannot adjust styles, so you must enforce contrast directly in the pixels. Use WCAG contrast targets as the floor.

- WCAG Level AA for normal text: contrast ratio 4.5:1. citeturn0search0turn8search2  
- WCAG Level AA for large text: contrast ratio 3:1. WCAG defines “large” as 18pt or 14pt bold in its contrast rationale. citeturn17search0turn0search0  
- WCAG Level AAA for normal text: 7:1; AAA for large text: 4.5:1. citeturn0search0turn8search20  
- Non-text contrast (buttons, icons, meaningful graphics): 3:1 against adjacent colors (WCAG non-text contrast). citeturn7search3turn8search20  
- WCAG explains that 4.5:1 is chosen to accommodate reduced acuity, color deficiencies, and age-related contrast loss; 3:1 is a minimum recommended by ISO-9241-3 and ANSI-HFES-100-1988 for standard text/vision. citeturn8search2

Testing tools:

- WebAIM contrast checker. citeturn8search0turn8search18  
- Color deficiency simulation tools like Coblis and DaltonLens. citeturn8search1turn8search5

High-performing CTA contrast patterns (principle-driven):

- Put CTA text in white on a dark, saturated button (or black on a light button) and validate 4.5:1 contrast.
- Use one accent color for CTA and keep it under roughly 10% of the canvas to prevent “CTA color becoming the whole ad.” The 60-30-10 distribution is a practical constraint for this. citeturn9search10turn8search2

### Platform-specific color considerations

Instead of claiming universal “best colors,” use *environment constraints* (feed backgrounds, UI overlays, dark mode prevalence, and compression).

- Mobile feeds compress and shrink creatives aggressively; high contrast and large shapes survive better than subtle tonal gradients (a consistent observation across platform creative guidance and display performance best practices emphasizing focus and legibility). citeturn16view6turn18view1  
- For Google responsive display, avoid collage composites and keep product focus; color complexity should not become the message. citeturn16view6  
- For full-screen vertical placements, reserve bright accents for the focal and CTA, because platform UI already contains multiple attention-grabbing controls. Safe zone discipline matters more than palette nuance here. citeturn15search9turn12search6

## Typography principles for advertising

Typography is the ad’s compression codec for meaning: it must remain readable under downscaling, compression, and fast scanning. Even if the image is beautiful, unreadable type kills conversion.

### Font selection (system rules)

- Use at most 2 typefaces and 2-3 weights total in one ad. NNG guidance on hierarchy emphasizes limiting type size variety for clarity. citeturn9search1turn9search7  
- Prefer sans-serif for small-screen readability and short ad copy; serif can work for premium editorial tone but should be tested on mobile (serif fine details can blur under compression).  
- Display fonts: use for short headlines only, not for body text.  
- Script fonts: reserve for single words or logos; avoid for bodies due to legibility.  
- Monospace: use for tech/coding-themed visuals, but keep it large because monospace density can reduce legibility at small sizes.

Where possible, anchor typography choices to tested system scales. Material Design’s published typography scale uses a small set of sizes (12, 14, 16, 20, 34) that balance density and comfort, which aligns with the “few sizes” hierarchy rule. citeturn17search7turn9search1

### Hierarchy in type (measurable sizing)

Use a scaling model instead of arbitrary sizes. Two workable systems:

**System A (pixel-based, for 1080-wide assets)**  
Define sizes against the shortest side of your canvas (S):

- Headline: 6% to 10% of S (example: 1080px canvas → 65px to 108px).
- Subhead: 3.5% to 5.5% of S (38px to 60px).
- Body: 2.2% to 3.2% of S (24px to 35px).
- CTA text: 3% to 4.5% of S (32px to 49px), plus padding.  
These ranges are designed to remain legible after typical platform scaling. Validate on-device.

**System B (contrast-standard-based)**  
Treat “large text” as the typography threshold for relaxed contrast requirements: WCAG considers 18pt (or 14pt bold) as large enough for lower contrast ratios. Use this to decide when you can safely use 3:1 contrast vs requiring 4.5:1, but keep in mind ads are often viewed at a distance and under motion. citeturn17search0turn8search2

### Readability rules

- Keep line length short in ads. For long-form accessibility, WCAG’s “visual presentation” guidance references a maximum of 80 characters per line for readability, but ad copy should stay far below that (often under 30-40 characters per line) due to glance viewing. citeturn5view5  
- Ensure sufficient line spacing for multi-line headlines; overly tight lines reduce recognition under compression.
- Avoid thin weights on busy backgrounds.

### CTA touch targets and interaction sizing

Even in an image ad, the CTA region must be visually large enough to read and click/tap, especially when rendered as an actual button in some placements.

- Android accessibility guidance recommends touch targets at least 48x48dp (density-independent pixels (dp)), about 9mm physical size. citeturn16view4  
- Apple guidance commonly recommends at least 44x44pt hit region for buttons (points (pt)). citeturn1search6  
- WCAG 2.2 target size minimum is 24x24 CSS pixels, with exceptions, and notes larger targets help many people. citeturn16view5turn12search1

Practical ad rule: CTA button height should be at least 8% of the canvas short side for 9:16 creatives (example: 1080 short side → ~86px height) if it is drawn inside the image. For built-in platform CTAs, ensure your image does not visually conflict with the platform’s button area. citeturn12search6turn15search9

### Text placement and safe zones

Text placement must handle two failure modes: platform UI overlays and cropping.

- Full-screen vertical ads (9:16): keep primary text and logos within the central safe area because top and bottom UI overlays can obscure content. Common guidance places key elements within approximately the center 1080x1420 area, leaving about 250px top and bottom. citeturn12search6turn15search9  
- Never place text within 2% to 4% of the edge; even if a platform displays it, it reads as cramped and increases cropping risk.

Text over images techniques (use at least one):

- Add a dark overlay behind text (commonly 30% to 50% opacity) for white text readability.
- Use gradient overlays under text areas.
- Place text in a solid container with padding.
- Use subtle shadow or stroke. Validate contrast with a checker because shadows can create misleading perceived contrast. citeturn8search0turn8search2

### Typographic don’ts (high-frequency failure patterns)

- All caps for long phrases (reduces word-shape recognition); reserve for short labels.
- Too many fonts or weights (breaks hierarchy).
- Decorative/script for body text (compression destroys legibility).
- Centered paragraphs (harder to scan; left alignment supports fast reading patterns in typical left-to-right contexts). Eye-tracking patterns show strong left-anchored scanning in many cases. citeturn2search1  
- Text touching edges (cropping and “cheap” appearance).

## Layout templates that convert

Templates are constrained systems that reduce creative variance while preserving testing flexibility. Use them to generate consistent assets quickly across placements.

Each template below includes: element order, recommended proportions, and mobile adaptation notes.

### Global template calibration rules (apply to all templates)

- Always define the “primary unit” as the short side of the canvas (S).  
- Default padding: 6% of S on all sides for feed; 8% for 9:16 vertical due to UI overlays and thumb-zone constraints. citeturn18view1turn15search9  
- Default corner radius for CTA button (if drawn): 1.5% of S.

### Template set

**Template: Hero image + headline + CTA**  
Best for: direct conversions, app installs, simple value propositions.

- Structure: focal product/face dominates; headline is the hook; CTA is explicit.
- Proportions (1:1 or 4:5):
  - Hero: 50% to 70% of area.
  - Headline: 10% to 20%.
  - CTA: 8% to 12% (button + label).
- Placement:
  - Hero on one rule-of-thirds intersection.
  - Headline on opposite third, left aligned.
  - CTA near bottom, aligned with headline block.
- CTA sizing:
  - Button height 8% to 10% of S; text 3% to 4.5% of S. citeturn16view4turn16view5
- Mobile adaptation:
  - Increase headline size; remove body copy; keep a single benefit line.

**Template: Split screen (image left, text right)**  
Best for: SaaS, explainers, feature-first offers.

- Split: 55/45 or 60/40 depending on whether the visual or copy carries the ad.
- Left panel: product screenshot or lifestyle image (simple, not collage).
- Right panel: headline, 2-3 bullets max, CTA.
- Mobile adaptation:
  - Stack vertically: image on top, text below; keep headline visible in the first screen.
- Risk:
  - Zigzag scanning inefficiency if alignment alternates; keep text blocks aligned. citeturn2search2

**Template: Image background + overlay text**  
Best for: lifestyle, emotional positioning, premium storytelling.

- Background: single strong image, low clutter.
- Overlay: 30% to 50% dark overlay beneath text zone.
- Text color: white with verified 4.5:1 contrast against effective background. citeturn8search2turn8search0  
- Placement: text block in one of the thirds; avoid dead center unless the image is symmetrical.
- CTA: either a button container or high-contrast text label with clear affordance.

**Template: Product grid (multiple products)**  
Best for: ecommerce catalogs, bundles, variety framing.

- Grid: 2x2 for 1:1; 2x3 for 4:5; 3x3 only when products are visually simple and highly distinct.
- Spacing: minimum gutter 2.5% of S between items.
- Headline: top band 12% to 18% of height.
- CTA: bottom band 10% to 12% of height.
- Constraint: avoid collage-like composites for Google responsive display assets; Google discourages collages in those contexts. citeturn16view6

**Template: Carousel narrative structure**  
Best for: education, multi-step persuasion, retargeting sequences.

- Card sequence:
  - Card 1: hook/problem (single sentence + one visual).
  - Card 2-4: features/benefits (one benefit per card).
  - Card 5: proof and CTA (testimonial, rating, results, then CTA).
- Consistency: lock background, font system, and CTA style across all cards; vary only the hero visual and headline.
- Use the same grid and padding every card to reduce cognitive friction.

**Template: Before/after transformation split**  
Best for: beauty, fitness, home improvement, cleaning, UX redesigns.

- Structure: 50/50 split (vertical or diagonal), with a strong “before” label and “after” label.
- Ensure comparable lighting and framing; misleading imagery can damage trust and can be considered deceptive in some regulated categories. Research and professional guidance highlight how inconsistent photography can mislead. citeturn13news43turn14search9  
- CTA: place in a neutral zone that does not overlap the split line; bottom safe area.

**Template: Testimonial card + product**  
Best for: trust-building, high-consideration purchases.

- Top: short quote (1-2 lines).
- Middle: star rating or proof marker.
- Bottom-left: product or brand icon.
- Bottom-right: CTA.
- Typography: use strict hierarchy and ample line spacing.  
- Evidence: trust and emotional response can be measured via facial expression and attention studies; emotional resonance is consistently linked to ad effectiveness in applied research contexts. citeturn13search0turn13search14

**Template: Feature stack with icons**  
Best for: SaaS, apps, tools.

- Left: product UI or hero.
- Right: 3 icons + 3 short benefit lines max (each 3-5 words).
- CTA: below the feature stack.
- This template relies on F-pattern scanning: strong left alignment, short lines. citeturn2search1

**Template: Offer badge (price drop or limited time)**  
Best for: promos, seasonal sales, retargeting.

- Hero product centered or rule-of-thirds.
- Offer badge: bright accent (10% area max) near hero.
- Headline: one line.
- CTA: one line.
- Risk: too many numbers and labels increases complexity; keep it minimal. Research on complexity shows systematic effects on ad response under certain brand contexts. citeturn19view2

**Template: Problem vs solution (two-panel)**  
Best for: services, pain-to-relief framing.

- Left: “problem” visual with muted colors and higher visual friction.
- Right: “solution” visual with cleaner composition and brighter palette.
- Headline spans both panels; CTA anchored on solution side.
- Ensure viewer can understand in under 1 second: the two panels must be visually distinct and labeled.

## Platform best practices and specifications

Platform rules change, so treat the following as current references and verify inside each platform’s preview tools before launch.

### Meta and Facebook feed ads (static images)

Core working sizes and ratios:

- Common “safe” master assets for multi-placement distribution are:
  - 1:1 square: 1080x1080 (widely used as a baseline). citeturn15search3turn24search11  
  - 4:5 vertical feed: many workflows use 1080x1350, but platform documentation often recommends higher minimums for best quality in some placements (for example 1440x1800 in some spec references). citeturn15search3turn24search14  
  - 9:16 vertical stories/reels: 1080x1920. citeturn24search11turn12search6  
- Link-style landscape commonly uses 1200x628 (1.91:1). citeturn15search17turn4search5

File formats and size:

- PNG or JPG are commonly recommended, and a maximum image file size of 30MB is referenced in platform troubleshooting documentation. citeturn24search1turn24search10

Text density guidance:

- The historical “20% text rule” is widely reported as no longer a strict rejection rule; current guidance trends toward “less text is better” for delivery and clarity. Some third-party summaries cite platform statements on this change. citeturn1search2turn8search17  
Operational rule: keep on-image text minimal and push longer explanation into primary text/caption when possible.

Mobile optimization:

- Most impressions are mobile; design for the smallest rendering first (headline bigger, fewer elements). Thumb-driven interaction patterns make bottom or mid-lower CTA emphasis common, but UI overlays must be respected. citeturn18view1turn12search6

### Instagram feed and stories

Working sizes:

- Stories and reels: 1080x1920 (9:16). citeturn12search6turn15search8  
- Feed: common vertical formats include 4:5 (1080x1350) and newer taller variants are increasingly discussed, but ad placements should prioritize supported ratios and avoid relying on nonstandard behavior. citeturn15search8turn24search11

Safe zones (critical):

- Common safe-zone guidance: keep key elements within the center area, leaving about 250px at top and bottom for UI overlays (for example, profile icon, reply bar). citeturn12search6turn15search9  
Operational rule for 1080x1920:
- Keep critical content inside y = 250 to y = 1670 as a baseline safe band.

### Google Display ads

Standard image ad sizes (non-exhaustive but high coverage):

- 300x250 (medium rectangle), 336x280 (large rectangle), 728x90 (leaderboard), 300x600 (half page), 160x600 (wide skyscraper), 320x50 (mobile leaderboard), 970x250 (billboard), and more; Google Ads Help lists sizes and technical limits. citeturn5view4

Image and animation specs:

- Static images: GIF/JPG/PNG; max file size 150KB for uploaded image ads. citeturn5view4  
- Animated GIF: must be 30 seconds or shorter; animation loops should stop after 30 seconds; max 5 frames per second (FPS (frames per second)). citeturn5view4  
- HTML5: max 600KB zipped for some formats and must be SSL-compliant; Google provides detailed requirements. citeturn5view4

Responsive Display Ads (practical creative constraints):

- Google’s best practices emphasize high-quality images, avoiding overlaid text/logos/buttons, avoiding collages, and keeping the product/service the focus. Google also specifies that blank space should not exceed 80% of the image. citeturn16view6  
Implication for AI-generated images: generate clean, single-subject photographs with natural backgrounds rather than composited posters for these placements.

### Mobile-first design constraints

CTA and interaction ergonomics:

- Use thumb-zone placement logic: controls placed lower are easier to reach one-handed, and research cited in thumb-zone discussions reports high rates of one-handed use and thumb-driven interaction. citeturn18view1  
- Respect touch target baselines: 48x48dp on Android; 44x44pt on Apple; WCAG 2.2 minimum 24x24 CSS px. citeturn16view4turn1search6turn16view5

Message compression:

- Mobile ad comprehension is often under 1 second. Reduce to:
  - One hook headline.
  - One supporting benefit line.
  - One CTA.
  - One brand marker.

## Visual storytelling, production specs, and accessibility

### Visual storytelling frameworks (what consistently works)

**Hero shot techniques**

- Product-only hero: highest clarity, best for known products and direct-response offers.
- Lifestyle hero: increases meaning transfer by placing the product “in use,” which can help viewers imagine ownership and context (useful for consideration). Evidence and industry practice strongly bias toward context improving perceived meaning, but the best choice is funnel-stage dependent. citeturn9search2turn13search11

Lighting and authenticity:

- Highly polished vs natural: authenticity is increasingly tied to trust; reports and ethical discussions around AI imagery emphasize transparency and authenticity as trust signals. citeturn14search2turn25search3

**Emotion through imagery**

- Faces: humans attend to faces, but direct gaze can trap attention on the face instead of the product. Use gaze direction to guide attention to the offer. citeturn18view5  
- Emotional expressions: studies in specific domains (for example charitable advertising) show facial emotional expression affects persuasion and inferences about intent. citeturn13search18turn13search3  
Operational rule: pick the expression that matches the promise (relief for problem-solution, joy for lifestyle, focus for productivity).

**Before/after and progression stories**

- Research indicates “before/after” and “progression” formats can differ in persuasiveness depending on consumer mindset and context in health advertising. citeturn13search2  
Operational rule: use before/after for direct transformation proof; use progression for “journey” positioning and when exaggerated contrast would feel untrustworthy.

### Image quality and technical specs (digital + print)

Resolution:

- Digital ads are pixel-based; DPI (dots per inch (DPI)) is mainly meaningful for print. For print, 300 pixels per inch (PPI (pixels per inch)) is commonly treated as a quality standard for close-viewed prints, while larger formats can use lower effective PPI due to viewing distance. citeturn11search2

Formats:

- JPEG: best for photos; smaller files, no transparency.
- PNG: best when transparency or sharp edges are needed; better for precise reproduction than JPEG.
- WebP/AVIF: often provide better compression than older formats; web-focused. citeturn11search0turn11search1turn11search4

Compression and optimization tools:

- Squoosh performs local, in-browser compression and is designed for comparing codecs and reducing file size. citeturn12search3turn12search11  
Operational rule: compress to platform limits while preserving readable text edges and avoiding banding in gradients.

### Accessibility in ad design

Color blindness and “use of color”:

- WCAG states color should not be the only visual means of conveying information, prompting response, or distinguishing elements. Ads frequently violate this by using red/green-only signals for “bad/good” or “off/on.” Always add text labels, icons, or patterns. citeturn24search0turn24search6

Contrast requirements (restate as enforceable constraints):

- Text: 4.5:1 minimum for normal; 3:1 for large; 7:1 for AAA. citeturn0search0turn8search20  
- UI components and meaningful graphics: 3:1. citeturn7search3turn8search20

Target size:

- If the ad includes drawn UI (fake buttons), make them big enough. Even if the platform provides the actual CTA, fake buttons can confuse users and may violate platform best practices (Google specifically discourages overlaying buttons in responsive display images). citeturn16view6

### Design trends vs timeless principles

Trends (relevant to 2024-2025 creative ecosystems):

- Bold minimalism: fewer elements with heavier emphasis on what remains is explicitly cited in trend reporting. citeturn25search1turn25search2  
- Motion elements and dreamy textures: expected in 2025 design trend reporting. citeturn25search2  
- Increased attention to AI image ethics and transparency in visual communication is discussed in academic work and industry reports. citeturn25search3turn14search2

Timeless principles (consistently supported by perception + ad effectiveness research):

- Clarity and single-message dominance (reduces processing friction).
- Hierarchy and readability.
- Contrast for attention and comprehension.
- Simplicity to manage complexity and clutter effects, which materially impact attention distribution and conversion outcomes. citeturn19view1turn9search4turn8search2

### Common visual mistakes to avoid (high-impact list)

1. Too much text: slows comprehension and increases clutter risk; also increases illegibility under compression. citeturn16view6turn19view1  
2. Low contrast text on backgrounds: fails WCAG thresholds and reduces readability. citeturn8search2turn8search0  
3. Multiple competing focal points: breaks hierarchy and increases cognitive load. citeturn9search4turn19view2  
4. Collage composites in display contexts: Google discourages collages for responsive display images. citeturn16view6  
5. Text inside story UI overlays: gets covered by top/bottom bars. citeturn12search6turn15search9  
6. CTA looks like a button but is not clickable: creates confusion; Google discourages overlay buttons in some contexts. citeturn16view6  
7. Over-reliance on color alone for meaning (for example red vs green): violates accessibility guidance. citeturn24search0  
8. Too many fonts/weights: destroys hierarchy discipline. citeturn9search1  
9. Decorative fonts for small copy: compression kills legibility.  
10. Misaligned elements and inconsistent spacing: perceived as low quality; grouping and hierarchy depend on consistent alignment. citeturn9search7turn10search1  
11. Placing tiny logos in noisy backgrounds: brand becomes invisible; use exclusion zones. citeturn34view7  
12. Cropping the product: the product must often be the focus in performance creative; Google explicitly instructs to make the product/service the focus. citeturn16view6  
13. Excessive blank space in Google responsive display: Google warns blank space should not exceed 80%. citeturn16view6  
14. Overly complex backgrounds: increases complexity and can reduce clarity; complexity affects response. citeturn19view2turn19view1  
15. Using direct-gaze faces that steal attention from offer: research shows mutual gaze can reduce attention to product/text in banner ads. citeturn18view5  
16. Before/after photos with inconsistent conditions (lighting/pose): can be misleading and can damage trust. citeturn13news43turn14search9  
17. Failing to validate contrast after adding shadows/gradients: perceived contrast can be deceptive; measure it. citeturn8search0turn8search2  
18. Not testing on-device: desktop previews lie; mobile scaling changes everything (thumb-driven behavior and reachability constraints). citeturn18view1turn16view4  
19. Wrong aspect ratio: forces auto-cropping and kills composition intent.  
20. Inconsistent branding across a carousel: increases cognitive friction and reduces narrative flow.  
21. Tiny CTA text: fails minimum target sizing principles and becomes unreadable under scaling. citeturn16view4turn16view5  
22. Low-quality, pixelated images: reduces credibility; Google emphasizes high quality images. citeturn16view6

### Quick reference guide

**By platform (core working set)**

- Meta/Facebook feed: master at 1080x1080 (1:1) and 1440x1800 (4:5) for higher-resolution vertical feeds; verify placement previews; max image file size 30MB. citeturn15search3turn24search1turn24search14  
- Instagram stories/reels: 1080x1920 (9:16). Keep critical text/logos within center safe band (often cited as leaving ~250px top/bottom). citeturn12search6turn15search9  
- Google display: build a set of standard sizes; ensure image ads are under 150KB; GIF animation max 30 seconds and 5 FPS. citeturn5view4

**By product type**

- SaaS: split-screen, feature stack, UI screenshot hero; prioritize clarity and trust colors (often blues/neutral palettes) but validate with brand strategy and contrast rules. citeturn19view2turn37view3turn8search2  
- Ecommerce: hero + CTA, offer badge, product grid, carousel benefits; keep product focus and avoid collage rules when targeting Google responsive display. citeturn16view6  
- Info products: authority composition (symmetry or clean asymmetry), testimonial template, high-contrast headline, minimal subcopy.

**By ad objective**

- Awareness: lifestyle background + overlay, big hero, minimal text, strong brand marker.
- Consideration: split-screen, feature stack, carousel narrative, proof markers.
- Conversion: hero + headline + CTA, offer badge, tight hierarchy, single action.

### Checklist for generated ads

- [ ] Single, obvious focal point (or clear comparison structure). citeturn9search4turn19view2  
- [ ] Hierarchy is unambiguous: headline → focal → benefit → CTA → logo. citeturn9search4turn9search1  
- [ ] Text contrast validated: 4.5:1 minimum for normal text (AA). citeturn8search2turn0search0  
- [ ] Non-text elements (buttons/icons) meet 3:1 contrast where meaningful. citeturn7search3turn8search20  
- [ ] CTA sizing supports touch interaction norms (48x48dp Android, 44x44pt Apple, WCAG 24x24 CSS px minimum). citeturn16view4turn1search6turn16view5  
- [ ] Critical text/logos are inside safe zones for 9:16 placements. citeturn12search6turn15search9  
- [ ] No collage composites for Google responsive display assets; product is the focus; blank space not over 80%. citeturn16view6  
- [ ] File size and format meet platform limits (Google display 150KB for image ads; GIF rules; Meta guidance references 30MB max). citeturn5view4turn24search1  
- [ ] Color is not the only signal for meaning (WCAG use-of-color rule). citeturn24search0  
- [ ] Visual complexity is controlled (no competing micro-elements). citeturn19view2turn19view1  
- [ ] The ad still reads correctly as a thumbnail and at arm’s length on a phone. citeturn18view1