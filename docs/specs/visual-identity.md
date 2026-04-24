# Visual Identity And Compatibility

## Purpose

The visual must remain compatible with reports that were created with the historical Synoptic Panel v1 custom visual.

## Requirements

### Visual Identity

- `Implemented`: The visual GUID must remain `PBI_CV_815282F9_27F5_4950_9430_E910E0A8DB6A`.
- `Implemented`: The visual package must build with the current Power BI custom visual tooling.
- `Implemented`: The visual version is currently `1.5.1.0`.
- `Partial`: The package metadata still uses the historical OKViz naming. Product naming for a fork/rebrand is undecided.

### Report Compatibility

- `Implemented`: Existing reports should load the visual without changing the visual type.
- `Implemented`: Persisted object properties must keep historical property names where possible, including `general.imageData`, `general.imageSelected`, and state/data label settings.
- `Partial`: Existing PBIP/PBIX reports using persisted SVG data are supported for known Aldi and G+D report scenarios.
- `Legacy parity target`: Reports using less common legacy features, such as gallery maps, zoom persistence, target variance, saturation, and per-object data colors, should be evaluated before declaring full parity.

### Licensing And Naming

- `Backlog`: Verify provenance of the old v1 MIT license before publishing a renamed fork.
- `Backlog`: Retain original copyright and MIT license notices.
- `Backlog`: Add project-specific notices for new modifications.
- `Backlog`: Choose a product name that does not imply endorsement by OKViz/SQBI and does not conflict with their current commercial v2 branding.

## Open Questions

- Should the fork preserve the old visual display name for compatibility only, or should exported/package metadata be renamed?
- Should a migration note explain the relationship to the historical MIT-licensed version?
