# Photor Image Wiring Guide

## Card Media Specs
- **Aspect ratio**: 16:9 (locked via CSS)
- **Object fit**: `cover` with centered crop (no stretch/distort)
- **Placeholder**: Empty slots show "[ 16:9 PHOTOR ]" hatched background

## Data Model
Add image fields to report objects in `data/reports.json`:

```json
{
  "href": "f1/2026/example-race.html",
  "league": "f1",
  "type": "race",
  "title": "Example Race Report",
  "image": "assets/media/f1/example-race.jpg",
  "imageAlt": "Descriptive alt text",
  "srcset": "assets/media/f1/example-race.jpg 1x, assets/media/f1/example-race@2x.jpg 2x",
  "sizes": "(min-width: 768px) 400px, 100vw"
}
```

### Fields
- **`image`** (required if showing photo): Path to image, e.g. `assets/media/f1/...`
- **`imageAlt`** (optional): Alt text for accessibility
- **`srcset`** (optional): Responsive image variants (1x/2x or width-based)
- **`sizes`** (optional): Viewport-based size hints

## F1 Photor Assets
When F1 photor files arrive in `photor-f1-last-week/`:
1. Copy files to `assets/media/f1/` (or similar organized path)
2. Keep originals reasonably sized (no over-compression)
3. Prefer WebP/JPEG as provided
4. Update corresponding F1 reports in `data/reports.json` with `image` paths
5. Run `node scripts/build-site.mjs` to rebuild `index.html`

## Example Wiring
For recent F1 reports (e.g. hungary-race, belgium-race, max-vs-100-feature):
```json
{
  "href": "f1/2026/max-vs-100-feature.html",
  "league": "f1",
  "type": "feature",
  "date": "2026-09-18",
  "title": "Max vs 100：Verstappen 在 Silverstone 贏下最特別的勝利",
  "image": "assets/media/f1/max-vs-100-silverstone.jpg",
  "imageAlt": "Verstappen kart challenge at Silverstone",
  "srcset": "assets/media/f1/max-vs-100-silverstone.jpg 1x, assets/media/f1/max-vs-100-silverstone@2x.jpg 2x"
}
```

## Notes
- Empty media slots are intentional (16:9 reserved space)
- Halftone filter applied via CSS (can be adjusted with filter strength control)
- Cards inherit league accent colors for shadows (F1 = orange)
