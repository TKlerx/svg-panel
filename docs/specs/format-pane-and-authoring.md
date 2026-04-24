# Format Pane And Authoring

## Purpose

The visual exposes authoring controls through the modern Power BI format pane and in-visual authoring UI.

## Format Pane Cards

- `Implemented`: `General` card is present.
- `Implemented`: `Toolbar` card is present.
- `Implemented`: `Data Colors` card is present.
- `Implemented`: `States` card is present.
- `Implemented`: `Data labels` card is present.
- `Implemented`: `Color Blindness by OKViz` card is present.
- `Partial`: Some exposed properties are not yet wired to runtime behavior.

## General Card

- `Implemented`: `Unmatched areas` controls whether unmatched indexed SVG areas are shown.
- `Implemented`: `Diagnostic console log` enables console/status diagnostics.
- `Legacy parity target`: Restore full general effects behavior, including transparent/no-background rendering controls.

## Toolbar Card And In-Visual Toolbar

- `Implemented`: The in-visual `Change` button is visible only in `Edit` and `InFocusEdit` modes.
- `Implemented`: The `Change` button opens a local SVG file picker.
- `Implemented`: Uploaded maps are persisted through `host.persistProperties()`.
- `Implemented`: The `Change` button is positioned top-right to avoid the status overlay.
- `Partial`: `toolbar.keep`, `toolbar.zoom`, `toolbar.filter`, and `toolbar.scale` are exposed but not fully wired.
- `Legacy parity target`: Restore zoom in/out/reset controls.
- `Legacy parity target`: Restore persisted interactive zoom/pan.
- `Legacy parity target`: Restore multi-map picker UI.

## Data Colors Card

- `Implemented`: `Borders` controls basic border rendering.
- `Implemented`: `Unmatched color` controls unmatched area fill when unmatched areas are visible.
- `Implemented`: `Default color` is used as fallback fill.
- `Partial`: `Show all` is exposed but not fully wired.
- `Legacy parity target`: Restore per-data-point and category color override behavior.

## States Card

- `Implemented`: Manual state colors and values are exposed.
- `Implemented`: State comparison is exposed.
- `Partial`: `calculate`, saturation settings, and `baseFill` are exposed in capabilities or settings but not fully wired.

## Data Labels Card

- `Implemented`: Label visibility, unmatched-label visibility, label style, position, and font size are exposed.
- `Partial`: Label placement and wrapping are simplified.
- `Legacy parity target`: Restore unit/precision formatting and best-fit placement parity.

## Color Blindness Card

- `Partial`: The card is present.
- `Legacy parity target`: Restore runtime color-blindness simulation if still product-relevant.

## Test Targets

The first tests should cover extracted settings readers and runtime decisions:

- toolbar visibility by `ViewMode`
- unmatched visibility decisions
- default setting values
- SVG upload map payload shape after extraction
