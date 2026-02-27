# WhatsRipe "Market Garden" Visual Redesign

**Date**: 2026-02-26
**Direction**: Warm & Organic — full visual overhaul, light mode hero
**Aesthetic**: Sun-dappled farmers market. Linen textures, earthy palette, serif + humanist sans typography.

## Foundation

### Typography
- **Display/Headings**: Fraunces (Google Fonts) — optical variable serif, warm organic feel
- **Body**: DM Sans (Google Fonts) — humanist sans with rounded terminals
- Scale: Page titles 2xl Fraunces 600, section headings lg Fraunces 500, card titles base DM Sans 600

### Color Palette (Light Mode — OKLCH)

| Token | Value | Hex | Purpose |
|-------|-------|-----|---------|
| background | oklch(0.98 0.005 80) | #FBF7F0 | Warm parchment page bg |
| foreground | oklch(0.28 0.02 55) | #3D3229 | Warm charcoal text |
| card | oklch(0.95 0.01 75) | #F5EDE0 | Soft wheat cards |
| card-foreground | oklch(0.28 0.02 55) | #3D3229 | Card text |
| primary | oklch(0.58 0.16 50) | #C4652A | Terracotta buttons/links |
| primary-foreground | oklch(0.98 0.005 80) | #FBF7F0 | Text on primary |
| secondary | oklch(0.94 0.015 140) | #E8EDE5 | Sage mist surfaces |
| secondary-foreground | oklch(0.4 0.06 145) | #3D5941 | Forest green on secondary |
| accent | oklch(0.62 0.08 150) | #6B8F71 | Sage green highlights |
| accent-foreground | oklch(1 0 0) | #FFFFFF | Text on accent |
| muted | oklch(0.92 0.01 70) | #E8E2D9 | Muted warm backgrounds |
| muted-foreground | oklch(0.6 0.03 60) | #8C7E6E | Secondary text |
| border | oklch(0.88 0.015 70) | #DDD5C8 | Warm tan borders |
| destructive | oklch(0.55 0.18 25) | #C44B3F | Muted red errors |

### Season Accent Colors
- Spring: #5A8F5C (fresh sage)
- Summer: #D4912A (golden amber)
- Fall: #C4652A (terracotta)
- Winter: #5B7B9A (muted steel blue)

### Textures & Effects
- Subtle CSS grain/noise overlay on body (~3-4% opacity, SVG data URI)
- Cards lift off textured background with warm shadows
- Border radius bumped to 0.75rem base

## Component Designs

### Bottom Navigation
- Parchment bg with warm tan top border
- Active: terracotta icon + label + dot indicator above icon
- Inactive: warm muted brown-gray
- Height: h-18 for more breathing room

### Season Indicator
- Soft gradient from season color at 8% opacity
- Season icon with gentle CSS pulse animation
- Ingredient badges: rounded-full, season-colored backgrounds
- Decorative dotted divider line below

### Meal Cards
- Wheat card bg with warm tan border
- Left accent border (3px) in season color
- Hover: translateY(-2px) + deeper shadow
- Meal type in small-caps earthy tone
- Ingredient badges: rounded-full, sage green bg
- Baby adaptation: soft warm peach accent

### Generate Button
- Season-colored with subtle inner gradient
- Rounded-xl pill shape
- Sparkle icon rotates on hover
- Loading: warm pulsing glow

### Page Header
- Fraunces serif, large
- Decorative leaf flourish SVG underneath

### Welcome Card
- Dashed sage green border
- Soft sage background tint
- Earthy CTA button

### Day Headers
- Fraunces medium weight
- Muted date text
- Warm tan horizontal rule after each section

## Scope
Full visual overhaul of all pages and components:
- globals.css (complete color/typography rewrite)
- layout.tsx (font imports, background texture)
- All planner components
- Bottom navigation
- Grocery page components
- Settings page components
- Meal detail page components
- 404 page
