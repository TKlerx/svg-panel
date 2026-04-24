# Test Cases

## Smoke Tests

### Package Build

Steps:
1. Run `npm install`
2. Run `npm run package`

Expected:
- build completes successfully
- `.pbiviz` package is produced in `dist/`

### About Dialog

Steps:
1. Import the built `.pbiviz` into Power BI Desktop
2. Open the visual About dialog

Expected:
- name is `SVG Panel`
- ID is `PBI_CV_07C304C8_34D8_45BC_AE03_B2864A3DB425`
- version matches the package under test

## Aldi Sample Report

### Basic Render

Steps:
1. Open the Aldi sample report
2. Ensure Synoptic visuals render after importing the current package

Expected:
- SVG renders
- mapped areas fill
- status message shows matched areas

### Cross-Filtering

Steps:
1. Click an area inside the Synoptic visual
2. Observe other visuals
3. Click a non-Synoptic visual that filters the same data
4. Observe the Synoptic visual

Expected:
- Synoptic filters other visuals
- other visuals highlight/filter Synoptic back

### Format Pane

Steps:
1. Select the Synoptic visual
2. Open the format pane

Expected:
- cards appear for `General`, `Toolbar`, `Data Colors`, `States`, `Data labels`, `Color Blindness`

## G+D Machine Health Report

### Fallback Matching

Steps:
1. Open the G+D report
2. Select one Synoptic instance after importing the current package

Expected:
- mapped count is greater than zero
- named equipment areas such as `PDG 11`, `PDE 01`, or `Stacker 1` can receive fills

### Interaction

Steps:
1. Click a visibly matched equipment area
2. Click a related external visual

Expected:
- matched equipment area reacts to clicks
- external filtering feeds back into the Synoptic visual

### Empty-Metadata Regression

Purpose:
- confirm that SVGs with empty `areas[]` still work

Expected:
- no dependency on precomputed Synoptic `areas[]`
- SVG `id` and `<title>` fallback matching remains active

## Formatting Tests

### General

Expected:
- `Unmatched areas` affects whether unmatched elements remain visible
- `Diagnostic console log` can be toggled without crashing the visual

### Data Colors

Expected:
- `Borders` toggles border styling
- `Unmatched color` affects unmatched elements when shown
- `Default color` affects fallback fill color

### States

Expected:
- enabling/disabling states affects threshold coloring
- comparison operator changes which threshold is selected
- manual state color/value pairs are honored

### Data Labels

Expected:
- enabling labels renders text
- label style changes the displayed content
- font size changes the text size

## Regression Checklist

Before merging behavior changes, verify:
1. package still builds
2. Aldi report still cross-filters both ways
3. G+D report still maps non-zero areas
4. format pane cards still appear
