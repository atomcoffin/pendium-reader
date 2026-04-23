# Tomen — Session Handoff

## What is Tomen?
An ebook reader PWA built by AJ. Working title "Tomen" (from "tome"). The spine view — a horizontal scrollable bookshelf — is the signature feature and default view. The app is local-first with IndexedDB storage, no backend yet. Planning to wrap with Capacitor (Android) and Tauri (desktop) later.

## Repo
- GitHub: atomcoffin/tomen
- Live: https://atomcoffin.github.io/tomen/

## Files in the repo
- `index.html` — the entire app (single file, ~1700 lines)
- `sw.js` — service worker for PWA caching/updates
- `manifest.json` — PWA manifest
- `icon-192.png`, `icon-512.png` — app icons
- `fonts/` — self-hosted Thow font (5 woff2 files)
- `DESIGN.md` — design language spec
- `PRICING.md` — free vs pro feature tiers

## Key design references
- See DESIGN.md for full spec
- Brand color: `--brand: #D4654A` (warm orangish-red)
- Font: Thow (licensed from Future Fonts) for everything — reading, UI, and spines
- Thow Mono for data/stats
- Three themes: light (Paper/Linen), sepia, dark

## Architecture
- **Storage**: IndexedDB with two stores — `books` (lightweight metadata) and `content` (full chapter HTML, loaded on demand)
- **Spine dimensions**: Volume-based system — each book gets a hash-seeded "format" (tall/slim vs short/thick) that distributes content size between height and width inversely
- **Spine text sizing**: Binary search with DOM measurement — creates hidden probe elements to find the largest font size fitting within 45% width × 70% height constraints
- **Spine colors**: Extracted from cover art during import using canvas sampling, persisted in metadata. Fallback hash-based colors for books without covers.
- **Title truncation**: Titles with `: ` or ` — ` or ` - ` are shortened on spines (full title preserved in data)

## What needs work next (spine view polish)
1. **Text placement** — currently always centered, could vary (top-aligned, bottom-aligned) per book for more personality
2. **Bookmark ribbons** — need more visual separation from the spine surface. Currently feel like part of the book rather than sitting on top
3. **Spine texture** — colors feel flat. Subtle noise, grain, or linen texture would add depth
4. **Lighting** — top of spines should have a lighter gradient (light from above), bottom should have a sharper darker gradient (sitting on shelf/ground). Currently has a gradient but it's too subtle
5. **Background** — has a top-to-bottom dark gradient but could be richer
6. **Text shadow** — currently `1px 1px 0` sharp shadow. Might need refinement
7. **Text size** — close but still slightly too large on average. Short titles (≤5 chars) should be bigger than medium titles

## What NOT to build (Pro features, per PRICING.md)
- Cloud sync / accounts
- Highlights / annotations
- Reading statistics
- Custom theme creator
- Full-text search
- Additional format parsers (PDF, MOBI, CBZ)
- Collections / tags

## AJ's preferences
- Performance over animation — snappy, no jank
- Titles should render as the author intended (no auto-caps)
- Design references: Everand, Webtoon, Cursor, Arc browser
- Spine view should be the hero feature — "the first thing users see"
- Local-first philosophy — users own their data
