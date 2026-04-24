# SVG Loading And Mapping

## Purpose

The visual renders SVG diagrams and binds report rows to named areas inside the SVG.

## Map Sources

- `Implemented`: Load an SVG from the `MapSeries` data role when the value is inline SVG markup.
- `Implemented`: Load an SVG from the `MapSeries` data role when the value is a URL.
- `Implemented`: Load persisted maps from `general.imageData`.
- `Implemented`: Accept `general.imageData` as raw SVG markup, a URL, or a JSON array of saved map definitions.
- `Implemented`: Use `general.imageSelected` to choose the active map from a persisted map array, falling back to the first map if needed.
- `Implemented`: Local SVG upload is available through the `Change` button in edit modes.
- `Implemented`: Uploaded SVG maps are persisted back to `general.imageData` with `host.persistProperties()`.
- `Legacy parity target`: Restore full multi-map picker behavior.
- `Legacy parity target`: Restore gallery browsing if still product-relevant.

## SVG Parsing

- `Implemented`: Inline SVG detection must accept SVG markup even when it does not start exactly with `<svg`, for example files with an XML declaration.
- `Implemented`: SVG parsing errors must produce a visible status message instead of a silent failure.
- `Partial`: External assets referenced by SVGs are not guaranteed to work in the Power BI sandbox.

## Area Metadata

- `Implemented`: Use persisted `areas[]` metadata when available.
- `Implemented`: Infer areas from SVG content when `areas[]` is missing or empty.
- `Implemented`: Infer candidate area names from SVG `id`, `title` attribute, child `<title>`, and parent matchable names.
- `Implemented`: Respect ignored/excluded markers such as `_ignored`, `_excluded`, and `.excluded`.
- `Partial`: Area inference is intentionally conservative but may still treat some decorative shapes as matchable if the SVG contains IDs/titles on decorative elements.

## Matching

- `Implemented`: Match report `Category` values to SVG areas case-insensitively after normalization.
- `Implemented`: Match against saved `displayName`, saved `elementId`, raw SVG `id`, title attribute, child `<title>`, and computed display names.
- `Implemented`: Support legacy ID normalization patterns used by old Synoptic/Illustrator/Inkscape-style IDs.
- `Partial`: Matching has been validated on known Aldi and G+D scenarios, but broader SVG authoring styles need tests.

## Unmatched Areas

- `Implemented`: Matched areas are areas with at least one data point whose category key resolves to an indexed SVG area.
- `Implemented`: When `General > Unmatched areas` is enabled, unmatched indexed areas may be shown with the configured unmatched fill color.
- `Implemented`: When `General > Unmatched areas` is disabled, unmatched indexed areas should be hidden.
- `Implemented`: Unmatched labels are only shown when both data labels and unmatched areas are enabled.
- `Partial`: The status overlay still reports matched data points, not a full authoring-quality "missing mapping" report.
- `Legacy parity target`: Exclude intentionally unmapped/decorative SVG elements from unmatched counts and overlays more reliably.

## Companion SVG Preparation App

- `Backlog`: Build a cross-platform companion app for preparing SVGs.
- `Backlog`: The app should load SVGs, let users fill/style areas, create or validate mappings, and export SVG/map payloads ready for Synoptic Panel or Synoptic Designer.
- `Backlog`: Prefer a web-first or otherwise portable architecture across Windows, macOS, and Linux.
