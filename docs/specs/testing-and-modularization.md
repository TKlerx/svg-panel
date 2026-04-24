# Testing And Modularization Strategy

## Purpose

The visual now works well enough that future changes should be protected by tests before larger refactors.

## Principles

- Write tests before broad modularization.
- Extract pure logic first.
- Keep Power BI host integration thin and tested indirectly where practical.
- Avoid large "move everything" PRs.
- Prefer small PRs that each improve testability or isolate one behavior area.

## Recommended Test Stack

- `Backlog`: Add `vitest` for fast TypeScript unit tests.
- `Backlog`: Add `npm test`.
- `Backlog`: Add CI checks for lint, test, and package build.

## First Extraction Targets

1. `svgMatching`
   - match variant generation
   - legacy ID normalization
   - candidate key handling
   - unmatched visibility decisions

2. `stateColors`
   - state comparison
   - terminal bucket behavior
   - bound/manual state sorting
   - fallback color order

3. `mapPayload`
   - persisted `imageData` parsing
   - SVG markup detection
   - selected map resolution
   - upload payload creation

4. `interactionState`
   - active highlight detection
   - selection/highlight dimming decisions

5. `settingsReader`
   - default values
   - format pane object value extraction

## Suggested PR Sequence

### PR 1: Add Test Harness And Characterization Tests

- Add `vitest`.
- Add tests for state comparison and highlight detection.
- Extract only the minimum pure functions required.
- Keep visual behavior unchanged.

### PR 2: Modularize SVG Matching

- Move matching and ID normalization into a module.
- Add tests for Aldi/G+D-style names and legacy IDs.
- Add tests for unmatched area visibility.

### PR 3: Modularize State Coloring

- Move state color resolution into a module.
- Add tests for manual states, bound states, and fallback colors.

### PR 4: Modularize Map Loading/Persistence Helpers

- Extract map payload parsing and upload payload creation.
- Add tests for raw SVG, URL, and JSON array `imageData`.

### PR 5: CI

- Add GitHub Actions for lint, test, and package build.
- Make branch protection require the CI checks once stable.

## Non-Goals

- Do not attempt browser-level Power BI integration tests first.
- Do not refactor all of `visual.ts` in one PR.
- Do not add snapshot tests for the entire generated SVG DOM until core pure logic is covered.
