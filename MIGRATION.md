# Synoptic Panel Migration Notes

## What changed

- Migrated the project scaffold to `powerbi-visuals-tools 7.0.3`.
- Updated the visual manifest to API `5.3.0` while keeping the original visual GUID so existing reports can continue to target the same visual identity.
- Preserved the legacy implementation under `legacy/` for reference during feature-by-feature porting.
- Replaced the legacy build inputs that depended on missing `../libraries/*` files with a self-contained TypeScript module setup.

## What works now

- `npm install`
- `npm run package`
- Loading inline SVG markup from persisted `general.imageData`
- Loading a map from the `MapSeries` role when a URL or SVG payload is bound there
- Matching category names to SVG element `id`, `title`, or child `<title>` values
- Applying colors and basic selection behavior to matched shapes

## What is intentionally simplified

- No modern format pane cards yet
- No gallery integration
- No zoom toolbar
- No advanced labels
- No state or target calculations
- No persisted map editing UX

## Recommended next migration slices

1. Port the format pane into `getFormattingModel()`
2. Reintroduce data labels and unmatched-area behavior
3. Port state/target coloring logic
4. Port map gallery and local map management, subject to current WebAccess constraints
5. Add certification-oriented features like tooltips, keyboard support, and high-contrast support
