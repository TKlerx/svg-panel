# Mapped SVG Panel for Power BI

Mapped SVG Panel allows you to present one or more SVG diagrams (called maps, not necessarily geographical maps), assign meaning to arbitrary parts of them (called areas), and dynamically highlight or color those areas with Power BI data.

![alt tag](screenshot.png)

## Modernization status

This repository now contains a modern Power BI custom visual scaffold based on `powerbi-visuals-tools 7.x` and API `5.3.0`.

- The active implementation lives in [src/visual.ts](/C:/dev/SynopticPanel/src/visual.ts).
- The original legacy implementation was preserved in [legacy/src-legacy/visual.ts](/C:/dev/SynopticPanel/legacy/src-legacy/visual.ts) as a migration reference.
- The current modernized renderer focuses on the core path: load an SVG map, match category values to SVG IDs or titles, apply data colors, and package successfully for current Power BI tooling.
- Legacy features such as gallery workflows, advanced labels, state calculations, saturation logic, and the full old format pane still need to be ported.


### Attribution and license

Copyright (c) 2016-2017 OKViz - trademark of SQLBI Corp.

This project is a modernized fork of the MIT-licensed v1 codebase. The original copyright and MIT permission notice are retained in accordance with the license.

See the [LICENSE](/LICENSE) file for license rights and limitations (MIT).
