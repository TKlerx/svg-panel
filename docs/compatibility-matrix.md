# Compatibility Matrix

## Report Fixtures

### Aldi Sample Report

Source:
- [report.json](C:/Users/TimoKlerx/Desktop/AldiSuedAI-Sample.Report/definition/report.json)

Known Synoptic instances:
- [visual.json](C:/Users/TimoKlerx/Desktop/AldiSuedAI-Sample.Report/definition/pages/ReportSection/visuals/3a5f9ef2ccbb4cadb968/visual.json)
- [visual.json](C:/Users/TimoKlerx/Desktop/AldiSuedAI-Sample.Report/definition/pages/ReportSectionb6a4fcecc0c5ebb9e5be/visuals/badf69d6ecc333e32c17/visual.json)
- [visual.json](C:/Users/TimoKlerx/Desktop/AldiSuedAI-Sample.Report/definition/pages/ReportSectione76789831e9701ed1b0e/visuals/3c7a59891e79d2864a6e/visual.json)

Characteristics:
- persisted `imageData`
- populated `areas[]`
- `.OKVizUID_*` selectors
- numeric category names

Observed status:
- renders
- fills areas
- cross-filtering works both ways

### G+D Machine Health Report

Source:
- [report.json](C:/dev/service_smart_maintenance/pbi/G+D - Machine Health Report.Report/definition/report.json)

Known Synoptic instances:
- [visual.json](C:/dev/service_smart_maintenance/pbi/G+D - Machine Health Report.Report/definition/pages/ReportSection3f023ce30f64e9602259/visuals/d1053f56c3e78b80bd9b/visual.json)
- [visual.json](C:/dev/service_smart_maintenance/pbi/G+D - Machine Health Report.Report/definition/pages/ReportSectionba959ae05aaf6aac24a2/visuals/e2a2f2c56c678d7536c8/visual.json)
- [visual.json](C:/dev/service_smart_maintenance/pbi/G+D - Machine Health Report.Report/definition/pages/ReportSectiond97ed0fa4c5f97b5dd74/visuals/bb2dcda6118ca998921e/visual.json)
- [visual.json](C:/dev/service_smart_maintenance/pbi/G+D - Machine Health Report.Report/definition/pages/ReportSectione3ec232f631292701d02/visuals/51a1dd3111e3d1e90d01/visual.json)

Characteristics:
- persisted `imageData`
- empty `areas[]`
- raw SVG `id` and `<title>` names such as `PDG 11`, `PDE 01`, `Stacker 1`
- category values come from machine-location data

Observed status before fallback matcher:
- map rendered
- `0/374 areas mapped`
- no useful click interaction because nothing matched

Expected status after fallback matcher:
- non-zero mapped count
- visible fills on matched machine areas
- click interaction on matched areas

## Feature Matrix

| Feature | Aldi Sample | G+D Machine Health | Current Status |
|---|---|---|---|
| Visual identity preserved | No; fork uses a new GUID | No; fork uses a new GUID | Product decision |
| Persisted `imageData` load | Yes | Yes | Implemented |
| Saved `areas[]` support | Yes | No | Implemented |
| SVG fallback area inference | Not required | Required | Implemented, needs validation |
| Match by raw SVG `id` / `<title>` | Limited | Required | Implemented, needs validation |
| Cross-filtering both directions | Yes | Unknown | Confirmed for Aldi |
| Custom format cards visible | Expected | Expected | Implemented, needs validation |
| Manual states | Yes | Likely | Partial |
| Labels | Yes | Likely | Partial |
| Toolbar behavior | Legacy expected | Legacy expected | Partial |

## Notes

- The most important backward-compat scenarios currently come from the two reports above.
- New fixes should be checked against both reports to avoid solving one shape while regressing the other.
