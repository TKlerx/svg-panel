# Porting Audit

## Purpose

This document compares the historical Synoptic Panel implementation in [legacy/src-legacy/visual.ts](../legacy/src-legacy/visual.ts) with the current modern implementation in [src/visual.ts](../src/visual.ts) and [src/settings.ts](../src/settings.ts).

It answers one question:

What was in the old visual, what is already ported, and what still needs work?

## Summary

The modern visual has a fork-specific visual identity, builds successfully, renders saved SVG maps, supports core matching, restores basic format cards, and now supports cross-filtering in the Aldi report.

However, the historical visual had a much larger surface area than the current port. The current port is best described as:

- core rendering: mostly ported
- compatibility matching: partially ported
- host interaction: partially ported
- format pane presence: restored
- format pane behavior parity: partially ported
- authoring / map-management UX: mostly missing
- advanced state / labeling / coloring logic: partially ported

## Audit Matrix

| Area | Legacy Visual | Current Visual | Status |
|---|---|---|---|
| Visual GUID / identity | Historical GUID | New fork-specific GUID | Product decision |
| Package/build with current pbiviz | No | Yes | Ported |
| Inline SVG render | Yes | Yes | Ported |
| URL-based SVG load | Yes | Yes | Ported |
| Persisted `general.imageData` load | Yes | Yes | Ported |
| Persisted `areas[]` support | Yes | Yes | Ported |
| Fallback when `areas[]` is empty | Yes | Yes | Partially validated |
| Legacy SVG ID normalization | Yes | Yes | Ported |
| Two-way cross-filtering | Yes | Yes | Ported |
| Custom format cards visible | Yes | Yes | Ported |
| Local SVG upload button | Yes | No | Missing |
| Persist uploaded maps back into properties | Yes | No | Missing |
| Gallery browse UX | Yes | No | Missing |
| Multi-map picker UI | Yes | No | Missing |
| Map-switch filter behavior | Yes | No runtime support | Missing |
| Zoom toolbar UI | Yes | No | Missing |
| Zoom/pan interaction | Yes | No | Missing |
| Saved zoom persistence after user interaction | Yes | No | Missing |
| `Series` role behavior | Yes | Mostly ignored | Missing |
| `target` role behavior | Yes | Mostly ignored | Missing |
| `states` measure role behavior | Yes | Partial | Partial |
| State calculation modes (`absolute` / `percentage` / `modifier`) | Yes | No | Missing |
| Saturation logic | Yes | No | Missing |
| Dynamic state colors from bound state measures | Yes | Yes (from `states` role) | Ported |
| Manual state thresholds | Yes | Yes | Partial |
| Unmatched area show/hide | Yes | Yes | Partial |
| Unmatched fill fallback to source style | Yes | No | Missing |
| `showAll` category/group color expansion | Yes | No | Missing |
| `colorByCategory` | Yes | No | Missing |
| Per-category/per-series color overrides | Yes | No | Missing |
| Tooltips from bound tooltip measures | Yes | Yes | Ported |
| Power BI tooltip service integration | Yes (`ITooltipServiceWrapper`) | Yes (`host.tooltipService` direct) | Ported |
| `host.persistProperties()` support | Yes (lines 1720, 2052) | No | Missing |
| Edit mode awareness (`viewMode`) | Yes (toolbar show/hide) | No | Missing |
| Dual `State` + `states` role binding | Yes (distinct semantics) | Yes (separate columns) | Ported |
| `states.baseFill` property | Yes (capabilities.json) | Not in settings.ts or visual.ts | Missing |
| `dataPoint.fill` per-object overrides | Yes (via `enumerateObjectInstances`) | No | Missing |
| Dynamic `enumerateObjectInstances` | Yes (per-datapoint colors, conditional props) | No (static `getFormattingModel` only) | Missing |
| Label content modes | Yes | Yes | Partial |
| Label placement quality (`top`, `centroid`, `best`) | Yes | Simplified | Partial |
| Label wrap/enclose behavior | Yes | Simplified | Partial |
| Label numeric formatting (`unit`, `precision`) | Yes | No | Missing |
| Color blindness simulation | Yes | No runtime behavior | Missing |
| Diagnostics logging toggle | Yes | Partial | Partial |
| Welcome / empty-state UX | Yes | Simplified | Partial |

## Detailed Findings

### 1. Map Authoring And Map Management Are Mostly Missing

Legacy visual capabilities:
- local SVG file chooser button in the visual toolbar
- multi-file local map import
- persistence back into `general.imageData` via `persistMaps`
- community gallery browser backed by `synoptic.design`
- map selector combo for multiple maps
- map-switch filtering

Legacy references:
- [visual.ts](../legacy/src-legacy/visual.ts:1628)
- [visual.ts](../legacy/src-legacy/visual.ts:1860)
- [visual.ts](../legacy/src-legacy/visual.ts:2049)

Current state:
- no in-visual toolbar
- no local file chooser
- no gallery
- no map switching UI
- no property persistence path for newly chosen maps

Current references:
- [visual.ts](../src/visual.ts)

Impact:
- users can consume saved or bound maps, but they cannot recreate the old workflow for loading/changing SVGs from inside the visual

### 2. Format Cards Exist, But Many Properties Still Don’t Drive Runtime Behavior

The format pane now exists in [settings.ts](../src/settings.ts), which is good. But many properties from [capabilities.json](../capabilities.json) are not read or used in [visual.ts](../src/visual.ts).

Examples currently not wired through runtime:
- `toolbar.keep`
- `toolbar.scale`
- `toolbar.filter`
- `toolbar.zoom`
- `dataPoint.showAll`
- `dataPoint.colorByCategory`
- object-level `dataPoint.fill`
- `states.calculate`
- `states.saturate`
- `states.saturateMin`
- `states.saturateMax`
- object-level `states.fill`
- `dataLabels.unit`
- `dataLabels.precision`
- `colorBlind.vision`

Impact:
- Power BI shows controls that look available, but changing them often has no effect yet

### 3. Data Role Support Is Still Incomplete

Legacy transform logic supported:
- category-only
- group/series-driven data points
- target measure handling
- separate state measure handling
- bound state definitions via `states`
- tooltip measure accumulation

Legacy references:
- [visual.ts](../legacy/src-legacy/visual.ts:230)
- [visual.ts](../legacy/src-legacy/visual.ts:680)

Current transform logic mainly supports:
- `Category`
- `MapSeries`
- `Y`
- one state-like measure for color thresholds

Current references:
- [visual.ts](../src/visual.ts:148)

What is still effectively missing:
- meaningful use of `Series`
- meaningful use of `target`
- measure-driven `states` lists and state legends
- tooltip role aggregation
- category/group fallback datapoints for `showAll`

Impact:
- reports depending on grouped series logic, targets, or rich tooltip/state behavior may still render incorrectly or lose information

### 4. State Logic Is Only Partially Ported

Ported now:
- basic manual threshold states
- comparison operator handling

Not yet ported:
- `calculate` modes
- target-based difference / variance logic
- saturation ramps
- state colors bound from measure metadata
- target state ordering nuances

Legacy references:
- [visual.ts](../legacy/src-legacy/visual.ts:1267)

Current references:
- [visual.ts](../src/visual.ts:735)

Impact:
- reports may show “some” state coloring while still being semantically wrong for target- or saturation-driven dashboards

### 5. Labels Are Present But Simplified

Ported now:
- show/hide labels
- basic label styles
- font size
- unmatched label support

Still missing or simplified:
- display-unit formatting
- decimal precision formatting
- legacy best-fit placement using geometric analysis
- legacy centroid placement fidelity
- text-tailoring behavior for enclosure/wrapping
- automatic text color parity

Legacy references:
- [visual.ts](../legacy/src-legacy/visual.ts:1267)
- [visual.ts](../legacy/src-legacy/visual.ts:2022)

Current references:
- [visual.ts](../src/visual.ts:325)

Impact:
- labels can appear, but they are not yet on par with the old visual for dense or irregular shapes

### 6. Coloring Behavior Is Only Partially Ported

Ported now:
- default fill
- unmatched fill
- manual threshold fills
- border toggle

Still missing:
- category or group-specific fill overrides
- `showAll`
- `colorByCategory`
- source-style restoration for unmatched/excluded elements
- richer border/fill-opacity parity

Legacy references:
- [visual.ts](../legacy/src-legacy/visual.ts:1267)
- [visual.ts](../legacy/src-legacy/visual.ts:2065)

Current references:
- [visual.ts](../src/visual.ts:236)

Impact:
- color semantics may diverge from old reports that depended on explicit object-level overrides

### 7. Tooltips — PORTED

Tooltip support has been restored:
- Uses `host.tooltipService` directly (show/move/hide) instead of the legacy `ITooltipServiceWrapper`
- Builds `VisualTooltipDataItem[]` per data point from: Category, Y measure, State measure, and all `tooltips` role columns
- Added `tooltips` capability section to `capabilities.json` (enables default + canvas tooltips)
- Removed plain `title` attribute approach

Still simplified compared to legacy:
- No group/details tooltip from `Series` role (Series role not yet ported)
- No target tooltip (target role not yet ported)
- Unmatched areas do not show area-name tooltips yet

### 8. Zoom And Toolbar Behavior Are Missing

Legacy visual had:
- hover/fixed toolbar behavior
- zoom in / zoom out / reset
- persisted map scale and translation after user interaction

Legacy references:
- [visual.ts](../legacy/src-legacy/visual.ts:1628)
- [visual.ts](../legacy/src-legacy/visual.ts:2049)

Current visual:
- can apply saved scale
- cannot change scale interactively
- does not expose toolbar controls

Current references:
- [visual.ts](../src/visual.ts:620)

Impact:
- previously-authored dashboards that relied on interactive zoom lose that behavior

### 9. Color Blindness Card Is Format-Only Right Now

Legacy visual actively applied color vision simulation:
- `OKVizUtility.applyColorBlindVision(...)`

Legacy references:
- [visual.ts](../legacy/src-legacy/visual.ts:1032)

Current visual:
- exposes the card in [settings.ts](../src/settings.ts)
- does not implement any runtime effect in [visual.ts](../src/visual.ts)

Impact:
- the control is visible but not functional yet

### 10. Conditional Format-Pane Behavior Is Incomplete

Legacy enumerate logic dynamically hid or showed properties depending on:
- whether unmatched areas were shown
- whether there were multiple maps
- whether maps were bound by measure
- whether targets existed
- whether states were manual or bound
- whether `showAll` was enabled

Legacy references:
- [visual.ts](../legacy/src-legacy/visual.ts:2065)

Current format pane:
- has some top-level visibility handling
- does not yet replicate most of the legacy conditional logic

Current references:
- [settings.ts](../src/settings.ts)

Impact:
- the pane is cleaner than before, but still not as context-aware as the historical visual

### 11. Power BI Tooltip Service — PORTED

Tooltip service integration restored. See section 7 for details.

### 12. `host.persistProperties()` Not Called

Legacy visual persisted map data back into visual properties so maps survived save/reload without external data binding:
- `self.host.persistProperties(...)` at lines 1720 and 2052

Current visual:
- never calls `persistProperties`

Impact:
- maps loaded via the (missing) upload UX would not persist into the report file

### 13. Edit Mode Awareness Missing

Legacy visual tracked `options.viewMode == ViewMode.Edit` and conditionally showed/hid toolbar and authoring UI.

Legacy references:
- [visual.ts](../legacy/src-legacy/visual.ts:951)
- [visual.ts](../legacy/src-legacy/visual.ts:1673)

Current visual:
- does not read `viewMode` from update options

Impact:
- when toolbar/upload are restored, they need edit-mode gating to avoid showing authoring controls in view mode

### 14. Dual `State` + `states` Role Binding — PORTED

`State` and `states` roles are now handled as distinct columns:
- `State` role → `stateMeasureColumn`: the numeric value compared against thresholds
- `states` role → `boundStateColumns[]`: define state thresholds from data (replacing manual thresholds when present)
- When `states` role columns are bound, bound states take precedence over manual threshold settings
- State values from bound columns include per-state colors from object-level `states.fill` property
- When `State` is not bound, `stateValue` falls back to `Y` measure value (matching legacy behavior at line 656–658)

### 15. `states.baseFill` Property Missing From Runtime

`capabilities.json` defines `states.baseFill` (base color for state calculation). Neither `settings.ts` nor `visual.ts` read or use this property.

### 16. Per-Object Color Overrides Via `enumerateObjectInstances`

Legacy visual dynamically generated per-data-point color picker instances through `enumerateObjectInstances` (line 2065+). This enabled users to set individual colors for each category/series entry in the format pane.

Current visual uses static `getFormattingModel()` — no dynamic per-object instances.

Impact:
- users cannot override colors for individual data points in the format pane

## G+D Machine Health Report — Feature Usage Analysis

The target report (`G+D - Machine Health Report`) contains **4 Synoptic Panel visual instances** across 4 pages. All share a consistent configuration pattern:

### Data Roles Used

| Role | Binding | All 4 visuals? |
|---|---|---|
| `Category` | `Dim Machine Location.Machine Location Identifier` | Yes |
| `MapSeries` | `Dim Machine.Machine Picture Svg` (SVG from data column) | Yes |
| `State` | `Location Mapping.Alert Type` (measure) | Yes |
| `Y` | Measure (varies per visual) | Yes |
| `states` | Bound (varies per visual) | 3 of 4 |
| `tooltips` | Bound tooltip measures | All 4 |
| `Series` | Not bound | — |
| `target` | Not bound | — |

### Properties Configured

All 4 visuals set:
- `comparison: "="` (exact match states)
- `showUnmatched: false`
- `borders: false`
- `saturate: false`
- `showAll: false`
- Manual states 1–5 with specific colors and numeric thresholds
- `imageData` contains embedded SVG (fallback if `MapSeries` column unavailable)
- `imageSelected: 0`

### Critical Path For G+D Report

Features required for this report to work correctly:
1. **MapSeries SVG loading from data column** — ported ✓
2. **Manual state thresholds with `=` comparison** — ported ✓
3. **`tooltips` role** — ported ✓
4. **Dual `State` + `states` binding** — ported ✓
5. **Cross-filtering** — ported ✓
6. **`showUnmatched: false` hiding** — ported ✓
7. **Fallback matching on G+D SVG element IDs** — needs validation

## Aldi Sample Report — Feature Usage Analysis

The Aldi sample report contains **3 Synoptic Panel visual instances**. Configuration differs from G+D:

### Data Roles Used

| Role | Visual 1 | Visuals 2 & 3 |
|---|---|---|
| `Category` | Yes | Yes |
| `MapSeries` | No | No |
| `Y` | Yes (`Sum(Value)`) | Yes |
| `State` | No | Yes |
| `states` | Yes (same column as Y) | No |
| `tooltips` | No | No |
| `Series` | No | No |
| `target` | No | No |

### Key Differences From G+D

- SVG comes from persisted `imageData` (no `MapSeries` data binding)
- Visual 1 uses bound `states` from data (no manual thresholds, no `State` measure — relies on Y→stateValue fallback)
- Visuals 2 & 3 use `State` measure with manual thresholds
- No tooltip measures bound
- Uses `labelStyle`, `saturate`, `showAll` properties
- Cross-filtering is the primary interaction model

### Critical Path For Aldi Report

1. **Persisted imageData SVG loading** — ported ✓
2. **Manual state thresholds** — ported ✓
3. **Y→stateValue fallback when State not bound** — ported ✓ (found via this report analysis)
4. **Cross-filtering** — ported ✓

## What Is Already Strong Enough To Build On

These are in decent shape:
- fork-specific visual identity plus legacy behavior compatibility
- modern packaging/build pipeline
- persisted map loading
- legacy ID normalization fallback
- core render path
- cross-filtering in the Aldi sample report
- restored presence of the main format cards

## Recommended Port Order

### Tier 0: Required For G+D Report

1. ~~Integrate Power BI tooltip service (`host.tooltipService`) and wire `tooltips` data role~~ — DONE
2. ~~Handle dual `State` + `states` role bindings correctly (distinct semantics, not merged)~~ — DONE
3. Validate and refine fallback matching on G+D report SVGs

### Tier 1: Required For Feature Completeness

1. Restore local SVG upload and `host.persistProperties()` map authoring workflow
2. Restore runtime use of visible format-pane properties (wire all settings.ts → visual.ts)
3. Add edit mode awareness (`viewMode`) for toolbar/authoring gating
4. Restore per-object color overrides (dynamic formatting model instances)
5. Wire `states.baseFill` property
6. Fix unmatched-area behavior so the unmatched overlay/count excludes SVG areas that are intentionally not mapped to data, and only reports actionable missing mappings.
7. Move the SVG `Change` authoring button to the top right so it does not cover the matched/unmatched diagnostic overlay.

### Tier 2: Required For Behavior Parity

1. Restore zoom toolbar and persisted interactive zoom
2. Restore full state logic including target and saturation
3. Restore label placement/formatting parity (unit, precision, best-fit)
4. Restore show-all and category/group-specific color behavior (`showAll`, `colorByCategory`)
5. Restore general effects behavior so the visual can disable the background color/effect and render only the SVG with transparency.

### Tier 3: Optional Or Product-Decision Dependent

1. Restore gallery UX
2. Restore color blindness simulation
3. Add certification-oriented features (keyboard support, high-contrast)
4. Build a cross-platform companion SVG preparation application that lets users load an SVG, fill/style the relevant areas, create or validate area mappings, and export an SVG/map payload that is ready to display in Synoptic Panel / Synoptic Designer. The app should not be Windows-only; prefer a web-first or otherwise portable architecture that works across Windows, macOS, and Linux.
5. Decide product naming/licensing posture for the fork: verify the old v1 MIT license provenance, retain original copyright/license notices, avoid implying endorsement by the original authors, and choose a renamed product identity that does not conflict with existing OKViz/SQBI trademarks or the commercial v2 branding.

## Bottom Line

The modern visual is not “half the old visual” in the sense of being nonfunctional; the core compatibility path is real and already works for at least one report family.

But it is also true that a large portion of the historical product surface is still unported.

The biggest missing chunks are:
- map authoring/upload/gallery UX + `persistProperties`
- zoom toolbar
- full state/target/saturation behavior
- edit mode awareness
- per-object color overrides
- group/series-driven behavior
- full runtime wiring for many format-pane properties

This document should be treated as the standing migration checklist until the missing items are either ported or explicitly declared out of scope.
