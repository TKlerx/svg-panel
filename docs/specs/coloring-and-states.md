# Coloring And States

## Purpose

The visual assigns fill colors to matched SVG areas from state rules, bound state measures, or fallback palette colors.

## Data Values

- `Implemented`: `Category` provides the SVG matching key.
- `Implemented`: `Y` provides the primary value.
- `Implemented`: `State` provides the state-driving value when bound.
- `Implemented`: If `State` is not bound, the visual falls back to `Y` as the state-driving value.
- `Partial`: `Series` is present in capabilities but not yet a full behavior driver.
- `Partial`: `target` is present in capabilities but not yet fully implemented.

## Color Priority

The current color resolution order is:

1. `Implemented`: When state coloring is enabled and `states.style` is `gradient`, interpolate the area color across the configured gradient.
2. `Implemented`: When state coloring is enabled and `states.style` is `rules`, use a matching state rule color.
3. `Implemented`: Fall back to the Power BI host palette for the category key.
4. `Implemented`: Fall back to the configured default fill color.

## Format Style

- `Implemented`: `states.style` selects between `gradient` (default) and `rules`, mirroring the Power BI conditional-formatting dialog.
- `Implemented`: The `State` measure role drives the value used for coloring; when unbound the visual falls back to the `Y` measure.

## Gradient Coloring

- `Implemented`: `states.gradientMinFill` and `states.gradientMaxFill` define the two-color gradient endpoints.
- `Implemented`: `states.gradientDiverging` adds a middle color (`states.gradientCenterFill`) for diverging gradients.
- `Implemented`: `states.gradientAutoRange` derives the minimum/maximum value bounds from the data domain.
- `Implemented`: When automatic range is off, `states.gradientMinValue`, `states.gradientCenterValue`, and `states.gradientMaxValue` set the bounds explicitly.
- `Implemented`: Values outside the configured range are clamped to the nearest endpoint color.

## Manual State Rules

- `Implemented`: Manual state thresholds are read from `states.manualState1..5`.
- `Implemented`: Manual state colors are read from `states.manualState1Fill..5Fill`.
- `Implemented`: `states.show` disables/enables state coloring.
- `Implemented`: `states.comparison` supports `=`, `<`, `<=`, `>`, and `>=`.
- `Implemented`: For `<` and `<=`, the final configured state color acts as the catch-all bucket for values above the highest threshold, matching observed legacy behavior.
- `Partial`: State sorting and comparison behavior is implemented for the known report cases, but needs executable tests before refactoring.

## Bound State Measures

- `Implemented`: The `states` measure role can provide bound state thresholds.
- `Implemented`: Bound state colors are read from the measure source object `states.fill` when available.
- `Partial`: Bound states are currently read from the first row of each bound state column.
- `Legacy parity target`: Fully restore the legacy state legend and all state calculation modes.

## Saturation And Effects

- `Implemented`: Gradient mode replaces the legacy saturation behavior with explicit min/center/max color interpolation.
- `Legacy parity target`: Restore `states.calculate` modes: `absolute`, `percentage`, and `modifier`.
- `Legacy parity target`: Restore `states.baseFill` runtime behavior.
- `Legacy parity target`: Restore transparent/effects behavior so the visual can render only the SVG with no unwanted background.

## Category And Object Colors

- `Partial`: Palette fallback uses the category key.
- `Legacy parity target`: Restore `dataPoint.colorByCategory`.
- `Legacy parity target`: Restore `dataPoint.showAll`.
- `Legacy parity target`: Restore dynamic per-category/per-series color overrides through the modern formatting model.
- `Legacy parity target`: Match bar chart colors when both visuals are driven by the same data/color semantics.

## Test Targets

The first tests should cover:

- state comparison operators
- terminal bucket behavior for `<` and `<=`
- fallback to palette/default fill
- `State` value fallback from `Y`
- bound state color extraction
