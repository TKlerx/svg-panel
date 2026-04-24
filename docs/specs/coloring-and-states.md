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

1. `Implemented`: Use a matching state color when state coloring is enabled and a state rule matches.
2. `Implemented`: Fall back to the Power BI host palette for the category key.
3. `Implemented`: Fall back to the configured default fill color.

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

- `Legacy parity target`: Restore `states.calculate` modes: `absolute`, `percentage`, and `modifier`.
- `Legacy parity target`: Restore saturation behavior using `states.saturate`, `states.saturateMin`, and `states.saturateMax`.
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
