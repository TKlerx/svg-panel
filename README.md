# Synoptic Panel for Power BI

Synoptic Panel by OKViz allows you to present one or more images (called maps, not necessarily geographical maps), assigning a meaning to arbitrary parts of them (called areas). You can highlight and color these areas dynamically and display several information over them. To design maps you can use a vector graphic editor or Synoptic Designer, a companion web tool located at https://synoptic.design/

![alt tag](screenshot.png)

Find out more on http://okviz.com/synoptic-panel/

## Modernization status

This repository now contains a modern Power BI custom visual scaffold based on `powerbi-visuals-tools 7.x` and API `5.3.0`.

- The active implementation lives in [src/visual.ts](/C:/dev/SynopticPanel/src/visual.ts).
- The original legacy implementation was preserved in [legacy/src-legacy/visual.ts](/C:/dev/SynopticPanel/legacy/src-legacy/visual.ts) as a migration reference.
- The current modernized renderer focuses on the core path: load an SVG map, match category values to SVG IDs or titles, apply data colors, and package successfully for current Power BI tooling.
- Legacy features such as gallery workflows, advanced labels, state calculations, saturation logic, and the full old format pane still need to be ported.


### Copyrights

Copyright (c) 2016-2017 OKViz - trademark of SQLBI Corp.

See the [LICENSE](/LICENSE) file for license rights and limitations (MIT).
