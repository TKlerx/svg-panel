# Synoptic Panel Migration Notes

## What changed

- Migrated the project scaffold to `powerbi-visuals-tools 7.0.3`.
- Updated the visual manifest to API `5.3.0` while keeping the original visual GUID so existing reports can continue to target the same visual identity.
- Preserved the legacy implementation in `legacy/src-legacy/visual.ts` for reference during feature-by-feature porting.
- Replaced the legacy build inputs that depended on missing `../libraries/*` files with a self-contained TypeScript module setup.

## What works now

- `pnpm install`
- `pnpm package`
- Loading inline SVG markup from persisted `general.imageData`
- Loading a map from the `MapSeries` role when a URL or SVG payload is bound there
- Matching category names to SVG element `id`, `title`, or child `<title>` values
- Falling back to inferred SVG areas when persisted `areas[]` metadata is missing
- Applying colors and selection behavior to matched shapes
- Cross-filtering between Synoptic and other visuals in both directions
- Restored main custom format pane cards through `getFormattingModel()`

## What is intentionally simplified

- No gallery integration
- No restored zoom toolbar UI yet
- Labels are only partially ported
- State and target calculations are only partially ported
- No persisted map editing UX

## Recommended next migration slices

1. Validate fallback matching against the G+D machine-health report
2. Complete label and state/target behavior parity
3. Restore toolbar behavior and zoom UX where still required
4. Port map gallery and local map management, subject to current WebAccess constraints
5. Add certification-oriented features like tooltips, keyboard support, and high-contrast support
