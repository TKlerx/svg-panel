# Notice

## Project Status

SVG Panel is an independent modernization fork of an old MIT-licensed Power BI custom visual codebase.

This project is not affiliated with, endorsed by, sponsored by, or maintained by OKViz, SQLBI, or the authors of the current commercial Synoptic Panel product.

## Provenance

The available source history in this repository descends from the public historical fork at:

https://github.com/pravchuk/SynopticPanel

That repository's visible history includes:

- `855d28a` - Initial commit, authored by Daniele Perilli on 2016-12-20
- `a5e89ae` - v1.4.1, authored by Daniele Perilli on 2016-12-24

The original upstream repository for the old visual appears to be unavailable. A packaged v1.5 visual has been observed in historical Power BI visual gallery references, but corresponding v1.5 source code has not been located in the available public source history.

## License And Attribution

The original source was published under the MIT License. The original copyright and permission notice are retained in `LICENSE`.

This fork keeps that attribution while using a new product name and a new Power BI visual GUID.

## Branding

The names OKViz, SQLBI, Synoptic Panel, and related marks may be trademarks or product names of their respective owners. This project avoids using those names as product branding and uses them only where needed for historical attribution, migration notes, or compatibility documentation.

## Repository Move

The project was moved from the GitHub fork repository `TKlerx/SynopticPanel` to the standalone repository `TKlerx/svg-panel`.

Reason:

- GitHub fork repositories tend to default pull requests toward the fork network/upstream, which can make normal GitHub flow awkward.
- A standalone repository would provide a cleaner project identity while still preserving full git history if pushed from this repository.

Completed process:

1. Created the standalone repository.
2. Pushed the full existing `main` history to the new repository.
3. Updated the local `origin` remote to `https://github.com/TKlerx/svg-panel`.
4. Updated package metadata, README links, and visual support URLs.
5. Recreated branch protection on `main`.
