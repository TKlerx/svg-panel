# Synoptic Panel Specification

## Goal

Synoptic Panel is a custom Power BI visual that renders an SVG-based map or diagram and binds report data to named areas within that SVG. The visual must preserve compatibility with existing reports that already use the historical visual identity `PBI_CV_815282F9_27F5_4950_9430_E910E0A8DB6A`.

## Scope

This specification covers:
- visual identity and backward compatibility
- supported data roles
- map loading and persistence
- area matching behavior
- coloring and state behavior
- selection and cross-filtering behavior
- labels and unmatched-area behavior
- format pane expectations

This specification does not yet fully define:
- gallery and remote map browsing UX
- map authoring or editing workflows inside the visual
- certification-only enhancements such as keyboard focus and high-contrast support

## Compatibility Goals

The visual shall:
- keep the existing visual GUID so previously-authored reports continue to bind to the same visual type
- load persisted visual settings from existing PBIX/PBIP reports without requiring manual reconfiguration
- support reports that persist SVG metadata in different historical shapes, including reports with empty `areas[]` metadata
- preserve cross-filtering with the Power BI host in both directions

The visual should:
- render old reports closely enough that saved report state remains meaningful
- keep property names stable where existing reports already persist them

## Data Roles

The visual shall support these roles as defined in [capabilities.json](C:/dev/SynopticPanel/capabilities.json):
- `Category`: main matching key for SVG areas
- `Series`: optional grouping/subcategory
- `Y`: primary measure for fill/value behavior
- `MapSeries`: SVG source or map reference
- `target`: optional target measure
- `State`: state-driving measure
- `states`: alternate state measure role used by some report shapes
- `tooltips`: extra tooltip fields

## Map Sources

The visual shall support maps from these sources:
- inline SVG bound through `MapSeries`
- URL bound through `MapSeries`
- persisted `general.imageData`

Persisted `general.imageData` may contain:
- a raw SVG string
- a URL
- a JSON array of saved maps

When `general.imageData` is a JSON array, the visual shall use `general.imageSelected` to select the active map, falling back to the first map if needed.

## Map Metadata Shapes

The visual shall support at least these historical patterns:
- SVGs with Synoptic-generated `areas[]` metadata and `.OKVizUID_*` selectors
- SVGs with raw SVG `id` and `<title>` data but no `areas[]`

When `areas[]` metadata is missing or empty, the visual shall infer matchable areas directly from the SVG.

## Area Matching Rules

Matching shall be case-insensitive after normalization.

The visual shall attempt to match data keys against:
- saved Synoptic `displayName`
- saved Synoptic `elementId`
- raw SVG `id`
- element `title` attribute
- child SVG `<title>`

The visual shall include legacy-compatible ID normalization for:
- Illustrator / Synoptic Designer style IDs
- Inkscape style IDs
- older Synoptic legacy IDs

The visual should ignore or exclude elements marked as:
- `#_ignored`
- `#_x5F_ignored`
- `.excluded`
- `#_excluded`
- `#_x5F_excluded`

## Rendering

The visual shall:
- parse and render the selected SVG
- preserve saved map scale and translation when available
- color matched shapes based on measure/state logic
- optionally color unmatched areas
- optionally render labels

If the SVG cannot be loaded, the visual shall show a user-visible status message instead of failing silently.

## Selection And Cross-Filtering

The visual shall:
- create Power BI selection IDs from category rows
- allow clicking matched SVG areas to cross-filter other visuals
- react to cross-filtering/highlighting from other visuals

When Power BI supplies highlights:
- highlighted matched areas shall remain emphasized
- non-highlighted matched areas shall be visually dimmed
- unmatched areas may be dimmed further

## Coloring

The visual shall support:
- default fill color
- unmatched fill color
- border rendering toggle
- Power BI palette-based fallback coloring

The visual should eventually support:
- category color behavior parity with the legacy visual
- saturation behavior parity
- target-driven coloring parity

## States

The visual shall support manual threshold-based states using:
- `states.show`
- `states.comparison`
- `states.manualState1..5`
- `states.manualState1Fill..5Fill`

The visual should eventually support the full legacy state model including:
- `calculate`
- saturation
- target variance behavior
- measure-driven state legends

## Labels

The visual shall support:
- `dataLabels.show`
- `dataLabels.unmatchedLabels`
- `dataLabels.labelStyle`
- `dataLabels.position`
- `dataLabels.fontSize`
- `dataLabels.enclose`
- `dataLabels.wordWrap`

The visual should eventually refine:
- exact centroid/best placement parity
- wrapping and enclosure logic parity
- numeric formatting parity for value labels

## Format Pane

The visual shall expose these cards in the modern format pane:
- `General`
- `Toolbar`
- `Data Colors`
- `States`
- `Data labels`
- `Color Blindness`

The visual should eventually match the legacy card behavior more closely, including conditional visibility and any remaining legacy-only fields that still matter in real reports.

## Diagnostics

The visual shall expose a diagnostic toggle through the format pane.

When diagnostics are enabled, the visual may log additional migration/debug information to the console.

## Non-Goals For Current Phase

The current migration phase does not require:
- editing SVG maps inside the visual
- rebuilding the old gallery UX exactly before core compatibility is stable
- pixel-perfect parity with every historical edge case before the main report scenarios work

## Open Questions

These items still need explicit product decisions:
- whether toolbar UI should be visually restored or only its persisted properties honored
- whether color blindness simulation should become functional again or remain format-only temporarily
- whether local/gallery map browsing is still a required product feature
- whether target/legend behavior must be fully restored for existing customer reports
