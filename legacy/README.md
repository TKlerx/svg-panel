This folder keeps a single legacy source snapshot for migration reference.

Kept on purpose:
- `src-legacy/visual.ts`: original Synoptic Panel implementation used to port behavior feature by feature

Removed from source control:
- old Power BI API schema copies
- old typings
- bundled legacy libraries
- obsolete build scaffolding

The legacy code in this folder is not expected to build. It is here only as a reference while porting behavior into the modern implementation in `src/visual.ts`.
