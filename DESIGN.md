# Tomen — Design Language v1

## Philosophy
Quiet confidence. The app disappears when you're reading, and feels intentional when you're not. High-end stationery, not tech startup.

## Principles
- **Breathe** — Generous spacing. Nothing feels cramped.
- **Recede** — UI disappears during reading. Content first.
- **Warm** — Paper tones, not clinical whites. Inviting.
- **Quiet motion** — Soft fades, gentle slides. No bouncing.

## Color Palette

| Name   | Hex       | Usage                                      |
|--------|-----------|---------------------------------------------|
| Paper  | `#FAF6F1` | Primary background (light theme)            |
| Linen  | `#F3EDE5` | Secondary/deeper background                 |
| Card   | `#FFFFFF` | Card surfaces                               |
| Ink    | `#2C2420` | Primary text                                |
| Stone  | `#8A7E76` | Secondary text                              |
| Fog    | `#B8AFA7` | Muted text, placeholders                    |
| Ember  | `#C45D3E` | **Sole accent** — active states, CTAs only  |
| Clay   | `#A94E33` | Accent hover/pressed state                  |

### Rules
- Ember is used sparingly — only for primary actions, active states, and progress indicators
- Everything else lives in the warm neutral range
- Differentiate surfaces through subtle background shifts, not hard borders
- Shadows only on floating elements (modals, toasts, book covers)

### Dark Theme
| Name   | Hex       |
|--------|-----------|
| Paper  | `#1A1614` |
| Linen  | `#121010` |
| Card   | `#242020` |
| Ink    | `#E8E0D8` |
| Stone  | `#9A8E86` |
| Fog    | `#6A5E56` |
| Ember  | `#E07050` |
| Clay   | `#F08060` |

### Sepia Theme
| Name   | Hex       |
|--------|-----------|
| Paper  | `#F4ECD8` |
| Linen  | `#EBE1C8` |
| Card   | `#FAF4E4` |
| Ink    | `#3E3228` |
| Stone  | `#7A6E5E` |
| Fog    | `#A89880` |
| Ember  | `#B85A3A` |

## Typography

| Role    | Font           | Usage                              |
|---------|----------------|------------------------------------|
| Reading | Literata       | Book content, display titles       |
| UI      | DM Sans        | Buttons, labels, navigation        |
| Data    | JetBrains Mono | Progress %, stats, metadata        |

### Hierarchy
- **Display** — Literata, 28-32px, weight 400, letter-spacing -0.5px (text view titles, chapter headings)
- **Title** — DM Sans, 18-22px, weight 600 (screen titles, book names in grid)
- **Body** — Literata, 16-20px (adjustable), line-height 1.8 (reading content)
- **Label** — DM Sans, 11-13px, weight 500-600 (section labels, buttons)
- **Caption** — DM Sans, 11-12px, weight 400 (authors, metadata)
- **Mono** — JetBrains Mono, 11-12px (progress indicators, page counts)

## Surfaces & Elevation
1. **Base** — Paper background, no border
2. **Card** — White/Card background, border 0.5px at 6-8% opacity, radius 12px
3. **Floating** — White/Card background, shadow `0 8px 32px rgba(44,36,32,0.12)`, radius 12px (toasts, modals, settings drawer)

## Motion
- Transitions: `0.25s cubic-bezier(0.4, 0, 0.2, 1)` for most interactions
- Slide panels: `0.35s cubic-bezier(0.4, 0, 0.2, 1)`
- Page/chapter transitions: gentle fade, no sliding content
- Hover lifts: `translateY(-2px)` to `-4px` max on cards
- No bouncing, no spring physics, no attention-grabbing animations

## Icons
- Thin 2px stroke, round caps and joins
- Lucide-style (simple, geometric)
- 20px default size in toolbars, 16px in buttons
- Color: Stone (`#8A7E76`) default, Ember on hover/active

## Spacing
- Generous padding everywhere — 20-28px container padding
- Card internal padding: 16-24px
- Grid gaps: 14-20px
- Section spacing: 20-28px between groups
- Mobile reduces slightly but never feels cramped

## Border Radius
- Cards and panels: 12px
- Buttons and inputs: 8px
- Book covers: 8px (grid), 6px (spine)
- Progress bars: 2px
- Full round: avatars, toggles only

## Library Views

### 1. Text View (Zune-style)
- Large serif titles (Literata, 28px) stacked vertically
- Author name below in Fog, small
- Currently-reading title highlighted in Ember with progress bar
- Minimal — no covers, no cards, just typography
- Tap a title to open

### 2. Grid View (Cover gallery)
- Rectangular book covers, 2:3 aspect ratio
- Grid: `repeat(auto-fill, minmax(150px, 1fr))`
- Book title and author below each cover
- Progress bar at bottom of cover if in-progress
- Subtle shadow on covers: `0 4px 16px rgba(44,36,32,0.08)`

### 3. Spine View (Horizontal bookshelf)
- Books displayed as vertical spines, side by side
- Title text rotated vertically (writing-mode: vertical-rl)
- Spine width varies by book length (thicker = longer book)
- Spine color derived from cover art dominant color
- Inset shadow for depth: `inset -2px 0 4px rgba(0,0,0,0.15)`
- Horizontal scroll — swipe to browse like a real shelf
- Slightly rounded right edges (3px left, 6px right) to simulate spine curvature

## Components

### Buttons
- **Primary** — Ember background, white text, subtle shadow, lifts on hover
- **Ghost** — Ember-tinted background (8% opacity), Ember text, fills on hover
- **Icon** — 36x36px, transparent, Stone color, Ember-soft background on hover

### Settings Drawer
- Slides up from bottom, 20px top radius
- Drag handle: 36x4px centered pill, Fog at 40% opacity
- Overlay: black at 30% opacity

### TOC Panel
- Slides in from left, full height
- Max width: min(320px, 85vw)
- Active chapter highlighted in Ember

### Update Toast
- Fixed bottom-center, slides up
- Card surface with shadow-lg
- "Update" button in Ember, "Later" in muted

### Progress Indicators
- Thin bars (2-3px height)
- Ember fill on neutral track
- Top-of-screen reading progress: full width, 3px
- Book card progress: bottom of cover, 3px
