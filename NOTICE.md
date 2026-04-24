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

## Potential Repository Move

The project may later move from this GitHub fork repository to a standalone repository such as `TKlerx/svg-panel`.

Reason:

- GitHub fork repositories tend to default pull requests toward the fork network/upstream, which can make normal GitHub flow awkward.
- A standalone repository would provide a cleaner project identity while still preserving full git history if pushed from this repository.

If/when the maintainers decide to move, the preferred process is:

1. Wait until active collaborators are ready.
2. Create an empty standalone repository.
3. Push the full existing git history, branches, and tags to the new repository.
4. Update `origin`, package metadata, README links, and visual support URLs.
5. Recreate branch protection on `main`.
6. Recreate or migrate open pull requests.
7. Leave this repository with a pointer to the new home, or archive it.

No repository move has been performed yet.
