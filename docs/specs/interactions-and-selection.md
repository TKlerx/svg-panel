# Interactions And Selection

## Purpose

The visual participates in Power BI selection and cross-filtering.

## Selection IDs

- `Implemented`: Each data point creates a Power BI selection ID from the `Category` row.
- `Implemented`: Matched SVG elements store the selection key as `data-selection-key`.
- `Implemented`: Matched SVG elements receive pointer cursor behavior.

## User Interaction

- `Implemented`: Clicking a matched SVG area selects the corresponding Power BI category.
- `Implemented`: `Ctrl`/`Meta` clicking supports multi-select through the host selection manager.
- `Implemented`: Clicking the SVG background clears the selection.
- `Partial`: Context menu behavior is not implemented.
- `Legacy parity target`: Keyboard interaction and accessibility behavior should be added if certification/support goals require it.

## Cross-Filtering And Highlighting

- `Implemented`: The visual supports Power BI highlights (`supportsHighlight: true`).
- `Implemented`: Highlight values are treated as active only when non-null and non-zero.
- `Implemented`: When highlights are present, non-highlighted matched areas are dimmed and highlighted areas stay active.
- `Implemented`: When this visual selects an area, other visuals can be filtered.
- `Implemented`: When another visual highlights rows, this visual receives highlight information and updates area emphasis.
- `Partial`: CSS dimming is functional but not necessarily pixel-identical to the legacy visual.

## Tooltips

- `Implemented`: Tooltips use the host tooltip service.
- `Implemented`: Tooltip data includes category, value, state value, and bound `tooltips` fields where present.
- `Partial`: Tooltip formatting supports common numeric/percentage cases but is not a full Power BI formatting engine.

## Diagnostics

- `Implemented`: `General > Diagnostic console log` enables console diagnostics.
- `Implemented`: Diagnostic output includes matched area count, data point count, SVG area count, indexed key count, highlight status, and map name.
- `Implemented`: The visual shows a compact status overlay.
- `Partial`: Diagnostic status placement and verbosity are development-oriented and may need product UX cleanup.

## Test Targets

The first tests should cover:

- active highlight detection
- selection key matching
- dimming decision rules
- tooltip item construction after extraction
