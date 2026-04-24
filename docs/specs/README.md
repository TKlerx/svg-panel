# Synoptic Panel Specs

These specs document the expected behavior of the modernized Synoptic Panel visual.

They are intentionally written as product/behavior specs, not implementation notes. Each rule is tagged with one of these states:

- `Implemented`: supported by the current modern visual.
- `Partial`: supported for known reports, but not yet full legacy parity.
- `Legacy parity target`: present in the old visual and still desired.
- `Backlog`: future product direction or non-blocking enhancement.

## Spec Documents

- [Visual identity and compatibility](./visual-identity.md)
- [SVG loading and mapping](./svg-loading-and-mapping.md)
- [Coloring and states](./coloring-and-states.md)
- [Interactions and selection](./interactions-and-selection.md)
- [Format pane and authoring](./format-pane-and-authoring.md)
- [Testing and modularization strategy](./testing-and-modularization.md)

## Working Agreement

For future work, use GitHub flow:

1. Branch from latest `main`.
2. Make focused changes.
3. Add or update specs when behavior changes.
4. Add tests for extracted pure logic where feasible.
5. Open a pull request into `main`.
6. Merge through GitHub after review/checks.

`main` is protected and should represent the currently stable baseline.
