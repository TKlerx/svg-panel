"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";

import DataView = powerbi.DataView;
import ISelectionId = powerbi.visuals.ISelectionId;
import IColorPalette = powerbi.extensibility.IColorPalette;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ITooltipService = powerbi.extensibility.ITooltipService;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import IVisual = powerbi.extensibility.visual.IVisual;
import PrimitiveValue = powerbi.PrimitiveValue;
import ViewMode = powerbi.ViewMode;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;

import { VisualFormattingSettingsModel } from "./settings";

interface SynopticMapArea {
    displayName?: string;
    elementId?: string;
    selector?: string;
    unmatchable?: boolean;
}

interface SynopticMapScale {
    scale?: number;
    translation?: [number, number];
}

interface SynopticMapDefinition {
    URL?: string | null;
    data?: string | null;
    displayName?: string;
    areas?: SynopticMapArea[];
    scale?: SynopticMapScale;
}

interface SynopticVisualSettings {
    general: {
        imageData?: string;
        imageSelected: number;
        showDiagnostic: boolean;
        showUnmatched: boolean;
    };
    dataPoint: {
        borders: boolean;
        defaultFill: string;
        unmatchedFill?: string;
        showAll: boolean;
    };
    states: {
        show: boolean;
        comparison: string;
        manual: SynopticManualState[];
    };
    dataLabels: {
        show: boolean;
        unmatchedLabels: boolean;
        labelStyle: string;
        position: string;
        fontSize: number;
        enclose: boolean;
        wordWrap: boolean;
    };
}

interface SynopticManualState {
    value?: number;
    color?: string;
}

interface SynopticBoundState {
    value: number;
    color: string | null;
    displayName: string | null;
    sourcePosition: number;
    isTarget: boolean;
}

interface SynopticDataPoint {
    key: string;
    value?: number;
    highlightValue?: number;
    isHighlighted?: boolean;
    stateValue?: number;
    color: string;
    selectionId: ISelectionId;
    tooltips: VisualTooltipDataItem[];
}

interface SynopticModel {
    map?: SynopticMapDefinition;
    dataPoints: SynopticDataPoint[];
    boundStates: SynopticBoundState[];
    hasBoundStates: boolean;
    hasHighlights: boolean;
    settings: SynopticVisualSettings;
}

interface LabelSpec {
    element: SVGElement;
    text: string;
}

type SvgMatchMap = Map<string, SVGElement[]>;

export class Visual implements IVisual {
    private readonly target: HTMLElement;
    private readonly host: powerbi.extensibility.visual.IVisualHost;
    private readonly selectionManager: ISelectionManager;
    private readonly formattingSettingsService: FormattingSettingsService;
    private readonly root: HTMLDivElement;
    private readonly toolbar: HTMLDivElement;
    private readonly fileInput: HTMLInputElement;
    private readonly status: HTMLDivElement;
    private readonly svgHost: HTMLDivElement;
    private readonly tooltipService: ITooltipService;
    private readonly mapCache: Map<string, string>;
    private formattingSettings: VisualFormattingSettingsModel;
    private updateNonce: number;
    private currentSvg: SVGSVGElement | null;
    private currentMatchedElements: Set<SVGElement>;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.target = options.element;
        this.selectionManager = options.host.createSelectionManager();
        this.tooltipService = options.host.tooltipService;
        this.formattingSettingsService = new FormattingSettingsService();
        this.mapCache = new Map<string, string>();
        this.updateNonce = 0;
        this.currentSvg = null;
        this.currentMatchedElements = new Set();

        this.selectionManager.registerOnSelectCallback(() => {
            const ids = this.selectionManager.getSelectionIds() as ISelectionId[];
            if (this.currentSvg) {
                this.applySelectionState(this.currentSvg, this.currentMatchedElements, ids);
            }
        });

        this.root = document.createElement("div");
        this.root.className = "synoptic-modern";

        this.toolbar = document.createElement("div");
        this.toolbar.className = "toolbar synoptic-toolbar";

        const changeButton = document.createElement("button");
        changeButton.type = "button";
        changeButton.textContent = "Change";
        changeButton.title = "Load an SVG map";
        changeButton.addEventListener("click", (event) => {
            event.stopPropagation();
            this.fileInput.click();
        });

        this.fileInput = document.createElement("input");
        this.fileInput.type = "file";
        this.fileInput.accept = ".svg,image/svg+xml";
        this.fileInput.multiple = true;
        this.fileInput.className = "file";
        this.fileInput.addEventListener("click", (event) => event.stopPropagation());
        this.fileInput.addEventListener("change", () => this.handleLocalMapFiles(this.fileInput.files));

        this.toolbar.append(changeButton, this.fileInput);

        this.status = document.createElement("div");
        this.status.className = "synoptic-status";

        this.svgHost = document.createElement("div");
        this.svgHost.className = "synoptic-map-host";

        this.root.append(this.toolbar, this.status, this.svgHost);
        this.target.appendChild(this.root);
    }

    public update(options: VisualUpdateOptions): void {
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(
            VisualFormattingSettingsModel,
            options.dataViews?.[0]
        );

        this.root.style.width = `${options.viewport.width}px`;
        this.root.style.height = `${options.viewport.height}px`;
        this.toolbar.hidden = !this.isEditMode(options.viewMode);

        const model = this.transform(options.dataViews?.[0], this.host.colorPalette);
        const currentNonce = ++this.updateNonce;

        void this.render(model, currentNonce);
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        if (!this.formattingSettings) {
            this.formattingSettings = new VisualFormattingSettingsModel();
        }
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }

    private transform(dataView: DataView | undefined, colorPalette: IColorPalette): SynopticModel {
        const settings = this.readSettings(dataView);
        const categorical = dataView?.categorical;
        const categoryColumn = categorical?.categories?.find((column) => column.source.roles?.Category);
        const mapColumn = categorical?.categories?.find((column) => column.source.roles?.MapSeries);
        const measureColumn = categorical?.values?.find((column) => column.source.roles?.Y);
        const stateMeasureColumn = categorical?.values?.find((column) => column.source.roles?.State);
        const tooltipColumns = categorical?.values?.filter((column) => column.source.roles?.tooltips) ?? [];
        const boundStateColumns = categorical?.values?.filter((column) => column.source.roles?.states) ?? [];

        const boundStates: SynopticBoundState[] = [];
        const hasBoundStates = boundStateColumns.length > 0;

        if (hasBoundStates) {
            for (let s = 0; s < boundStateColumns.length; s++) {
                const col = boundStateColumns[s];
                const val = this.readNumericValue(col.values?.[0]);
                if (val == null) continue;

                const fillObj = col.source.objects?.["states"]?.["fill"] as { solid?: { color?: string } } | undefined;
                boundStates.push({
                    value: val,
                    color: fillObj?.solid?.color ?? null,
                    displayName: col.source.displayName ?? null,
                    sourcePosition: s,
                    isTarget: false
                });
            }
        }

        const resolvedStates = hasBoundStates
            ? this.sortBoundStates(boundStates, settings.states.comparison)
            : settings.states.manual.filter((s) => s.value != null && s.color)
                .map((s, i) => ({ value: s.value!, color: s.color!, displayName: null, sourcePosition: i, isTarget: false }));

        const dataPoints: SynopticDataPoint[] = [];
        const highlights = measureColumn?.highlights;
        const hasHighlights = Array.isArray(highlights) && highlights.some((value) => this.isHighlightActive(this.readNumericValue(value)));
        const categories = categoryColumn?.values ?? [];
        for (let index = 0; index < categories.length; index++) {
            const rawKey = categories[index];
            const key = rawKey == null ? "" : String(rawKey).trim();
            if (!key || !categoryColumn) {
                continue;
            }

            const value = this.readNumericValue(measureColumn?.values?.[index]);
            const highlightValue = this.readNumericValue(highlights?.[index]);
            const rawStateValue = this.readNumericValue(stateMeasureColumn?.values?.[index]);
            const stateValue = rawStateValue ?? value;

            const tooltips: VisualTooltipDataItem[] = [];
            tooltips.push({ displayName: categoryColumn.source.displayName ?? "Category", value: key });
            if (value != null) {
                tooltips.push({
                    displayName: measureColumn!.source.displayName ?? "Value",
                    value: this.formatTooltipValue(value, measureColumn!.source.format)
                });
            }
            if (stateValue != null && stateMeasureColumn) {
                tooltips.push({
                    displayName: stateMeasureColumn.source.displayName ?? "State",
                    value: this.formatTooltipValue(stateValue, stateMeasureColumn.source.format)
                });
            }
            for (const tooltipCol of tooltipColumns) {
                const tooltipVal = tooltipCol.values?.[index];
                if (tooltipVal != null) {
                    tooltips.push({
                        displayName: tooltipCol.source.displayName ?? "",
                        value: this.formatTooltipValue(tooltipVal, tooltipCol.source.format)
                    });
                }
            }

            const color = this.resolveDataPointColor(key, stateValue, resolvedStates, settings, colorPalette);

            dataPoints.push({
                key,
                value,
                highlightValue,
                isHighlighted: this.isHighlightActive(highlightValue),
                stateValue,
                color,
                selectionId: this.host.createSelectionIdBuilder()
                    .withCategory(categoryColumn, index)
                    .createSelectionId(),
                tooltips
            });
        }

        return {
            map: this.resolveMapDefinition(mapColumn, settings),
            dataPoints,
            boundStates: resolvedStates,
            hasBoundStates,
            hasHighlights,
            settings
        };
    }

    private async render(model: SynopticModel, nonce: number): Promise<void> {
        this.status.textContent = "";
        this.svgHost.replaceChildren();

        if (!model.map) {
            this.status.textContent = "Bind a map SVG or provide saved image data to render the synoptic panel.";
            return;
        }

        try {
            const svgMarkup = await this.loadMapMarkup(model.map);
            if (nonce !== this.updateNonce) {
                return;
            }

            const svgElement = this.inflateSvg(svgMarkup);
            this.applySavedScale(svgElement, model.map.scale);

            const areas = model.map.areas && model.map.areas.length > 0
                ? model.map.areas
                : this.inferAreas(svgElement);
            const matchMap = this.indexSvg(svgElement, areas);
            const { matchedElements, labels: labelSpecs } = this.applyData(svgElement, matchMap, model);
            if (model.settings.dataLabels.show) {
                this.renderLabels(svgElement, labelSpecs, model.settings);
            }

            this.svgHost.appendChild(svgElement);
            this.currentSvg = svgElement;
            this.currentMatchedElements = matchedElements;

            const activeIds = this.selectionManager.getSelectionIds() as ISelectionId[];
            if (activeIds.length > 0) {
                this.applySelectionState(svgElement, matchedElements, activeIds);
            }

            const matchedCount = model.dataPoints.filter((point) => this.getMatchingElements(point.key, matchMap).length > 0).length;
            this.status.textContent = this.buildStatusText(model, areas.length, matchMap.size, matchedCount);
            const highlightedCount = model.dataPoints.filter((point) => point.isHighlighted).length;
            this.writeDiagnostic(model.settings, "render", {
                matchedAreas: matchedCount,
                dataPoints: model.dataPoints.length,
                highlightedDataPoints: highlightedCount,
                svgAreas: areas.length,
                indexedKeys: matchMap.size,
                hasMap: Boolean(model.map),
                hasBoundStates: model.hasBoundStates,
                hasHighlights: model.hasHighlights,
                mapName: model.map.displayName ?? model.map.URL ?? "inline SVG"
            });
        } catch (error) {
            if (nonce !== this.updateNonce) {
                return;
            }

            this.status.textContent = "Unable to load the configured SVG map.";
            this.writeDiagnostic(model.settings, "render error", error, true);
        }
    }

    private applyData(svgElement: SVGSVGElement, matchMap: SvgMatchMap, model: SynopticModel): { matchedElements: Set<SVGElement>; labels: LabelSpec[] } {
        const matchedElements = new Set<SVGElement>();
        const labels: LabelSpec[] = [];
        svgElement.setAttribute("data-has-highlights", model.hasHighlights ? "true" : "false");

        for (const point of model.dataPoints) {
            const matches = this.getMatchingElements(point.key, matchMap);
            if (matches.length === 0) {
                continue;
            }

            for (const element of matches) {
                matchedElements.add(element);
                element.style.fill = point.color;
                element.style.cursor = "pointer";
                element.setAttribute("data-selection-key", point.selectionId.getKey());
                if (model.hasHighlights) {
                    element.setAttribute("data-highlighted", point.isHighlighted ? "true" : "false");
                } else {
                    element.removeAttribute("data-highlighted");
                }

                if (model.settings.dataPoint.borders) {
                    element.style.stroke = element.style.stroke || "#5f6b6d";
                    element.style.strokeWidth = element.style.strokeWidth || "1";
                }

                this.attachTooltipEvents(element, point.tooltips, point.selectionId);
                element.addEventListener("click", (event: MouseEvent) => {
                    event.preventDefault();
                    event.stopPropagation();

                    void this.selectionManager.select(point.selectionId, event.ctrlKey || event.metaKey).then(() => {
                        const ids = this.selectionManager.getSelectionIds() as ISelectionId[];
                        this.status.textContent = `sel:${ids.length} has:${this.selectionManager.hasSelection()} svg:${!!this.currentSvg}`;
                        if (this.currentSvg) {
                            this.applySelectionState(this.currentSvg, this.currentMatchedElements, ids);
                        }
                    });
                });

                const labelText = this.buildLabelText(point, element, model.settings);
                if (labelText) {
                    labels.push({
                        element,
                        text: labelText
                    });
                }
            }
        }

        if (model.hasHighlights) {
            svgElement.setAttribute("data-synoptic-dimmed", "true");
            for (const element of matchedElements) {
                const isHighlighted = element.getAttribute("data-highlighted") === "true";
                if (isHighlighted) {
                    element.setAttribute("data-synoptic-active", "true");
                }
            }
        }

        if (model.settings.general.showUnmatched) {
            const unmatchedFill = model.settings.dataPoint.unmatchedFill;
            if (unmatchedFill) {
                for (const element of this.collectRenderableElements(svgElement)) {
                    if (!matchedElements.has(element)) {
                        element.style.fill = unmatchedFill;
                    }
                }
            }
        }

        if (model.settings.dataLabels.show && model.settings.dataLabels.unmatchedLabels) {
            for (const element of this.collectRenderableElements(svgElement)) {
                if (matchedElements.has(element)) {
                    continue;
                }

                const labelText = this.buildUnmatchedLabelText(element, model.settings);
                if (labelText) {
                    labels.push({
                        element,
                        text: labelText
                    });
                }
            }
        }

        svgElement.addEventListener("click", () => {
            void this.selectionManager.clear();
        });

        return { matchedElements, labels };
    }

    private renderLabels(svgElement: SVGSVGElement, labels: LabelSpec[], settings: SynopticVisualSettings): void {
        const labelLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
        labelLayer.setAttribute("class", "synoptic-label-layer");
        labelLayer.setAttribute("pointer-events", "none");

        for (const label of labels) {
            const bbox = this.getElementBounds(label.element);
            const textNode = document.createElementNS("http://www.w3.org/2000/svg", "text");
            const x = settings.dataLabels.position === "top" ? bbox.x + 4 : bbox.x + (bbox.width / 2);
            const y = settings.dataLabels.position === "top" ? bbox.y + 14 : bbox.y + (bbox.height / 2);

            textNode.setAttribute("x", `${x}`);
            textNode.setAttribute("y", `${y}`);
            textNode.setAttribute("font-size", `${settings.dataLabels.fontSize}`);
            textNode.setAttribute("class", "synoptic-label");
            textNode.textContent = label.text;

            if (settings.dataLabels.position === "top") {
                textNode.setAttribute("text-anchor", "start");
            } else {
                textNode.setAttribute("text-anchor", "middle");
                textNode.setAttribute("dominant-baseline", "middle");
            }

            labelLayer.appendChild(textNode);
        }

        svgElement.appendChild(labelLayer);
    }

    private buildLabelText(point: SynopticDataPoint, element: SVGElement, settings: SynopticVisualSettings): string {
        const areaName = this.readElementDisplayName(element);
        switch (settings.dataLabels.labelStyle) {
            case "area":
                return areaName ?? point.key;
            case "value":
                return point.value == null ? "" : this.formatNumber(point.value);
            case "both":
                return point.value == null ? point.key : `${point.key} ${this.formatNumber(point.value)}`;
            case "both2":
                return point.value == null ? (areaName ?? point.key) : `${areaName ?? point.key} ${this.formatNumber(point.value)}`;
            case "category":
            default:
                return point.key;
        }
    }

    private buildUnmatchedLabelText(element: SVGElement, settings: SynopticVisualSettings): string {
        if (settings.dataLabels.labelStyle === "value") {
            return "";
        }

        const areaName = this.readElementDisplayName(element);
        return areaName ?? "";
    }

    private applySelectionState(svgElement: SVGSVGElement, matchedElements: Set<SVGElement>, activeSelections: ISelectionId[]): void {
        const hasSelection = activeSelections.length > 0;
        const hasHighlights = svgElement.getAttribute("data-has-highlights") === "true";
        const activeKeys = new Set(activeSelections.map((s) => s.getKey()));

        if (!hasSelection && !hasHighlights) {
            svgElement.removeAttribute("data-synoptic-dimmed");
            for (const element of matchedElements) {
                element.removeAttribute("data-synoptic-active");
            }
            return;
        }

        svgElement.setAttribute("data-synoptic-dimmed", "true");

        for (const element of matchedElements) {
            if (hasSelection) {
                const selKey = element.getAttribute("data-selection-key");
                const isSelected = selKey != null && activeKeys.has(selKey);
                if (isSelected) {
                    element.setAttribute("data-synoptic-active", "true");
                } else {
                    element.removeAttribute("data-synoptic-active");
                }
            } else {
                const isHighlighted = element.getAttribute("data-highlighted") === "true";
                if (isHighlighted) {
                    element.setAttribute("data-synoptic-active", "true");
                } else {
                    element.removeAttribute("data-synoptic-active");
                }
            }
        }
    }

    private indexSvg(svgElement: SVGSVGElement, areas: SynopticMapArea[]): SvgMatchMap {
        const matchMap: SvgMatchMap = new Map<string, SVGElement[]>();
        const areaBySelector = new Map<string, SynopticMapArea>();

        for (const area of areas) {
            if (area.selector) {
                areaBySelector.set(area.selector.replace(/^\./, ""), area);
            }
        }

        for (const element of this.collectRenderableElements(svgElement)) {
            const area = this.resolveAreaMetadata(element, areaBySelector);
            if (area?.unmatchable) {
                continue;
            }

            if (area?.displayName) {
                element.setAttribute("data-synoptic-display-name", area.displayName);
            }

            const candidateKeys = [
                area?.displayName,
                area?.elementId,
                element.id,
                element.getAttribute("title"),
                this.readTitleNode(element),
                this.readElementDisplayName(element)
            ];

            for (const candidate of candidateKeys) {
                for (const variant of this.buildMatchVariants(candidate)) {
                    const elements = matchMap.get(variant) ?? [];
                    if (!elements.includes(element)) {
                        elements.push(element);
                    }
                    matchMap.set(variant, elements);
                }
            }
        }

        return matchMap;
    }

    private inferAreas(svgElement: SVGSVGElement): SynopticMapArea[] {
        const areas: SynopticMapArea[] = [];

        for (const element of this.collectRenderableElements(svgElement)) {
            const elementId = element.id || undefined;
            const displayName = this.readTitleNode(element)
                ?? element.getAttribute("title")
                ?? elementId;
            const parentMatchableName = this.findMatchableParentName(element);
            const unmatchable = this.isIgnoredOrExcluded(element) || this.isExcludedParent(element);

            if (!elementId && !displayName && !parentMatchableName) {
                continue;
            }

            areas.push({
                selector: elementId ? `#${this.escapeSelector(elementId)}` : undefined,
                elementId,
                displayName: parentMatchableName ?? displayName ?? undefined,
                unmatchable
            });
        }

        return areas;
    }

    private resolveAreaMetadata(element: SVGElement, areaBySelector: Map<string, SynopticMapArea>): SynopticMapArea | undefined {
        const classList = Array.from(element.classList);
        for (const className of classList) {
            const area = areaBySelector.get(className);
            if (area) {
                return area;
            }
        }

        return undefined;
    }

    private collectRenderableElements(svgElement: SVGSVGElement): SVGElement[] {
        const selector = "g, path, polygon, polyline, rect, circle, ellipse, line, text";
        return Array.from(svgElement.querySelectorAll<SVGElement>(selector));
    }

    private getMatchingElements(key: string, matchMap: SvgMatchMap): SVGElement[] {
        const matches: SVGElement[] = [];
        const seen = new Set<SVGElement>();

        for (const variant of this.buildMatchVariants(key)) {
            for (const element of matchMap.get(variant) ?? []) {
                if (!seen.has(element)) {
                    seen.add(element);
                    matches.push(element);
                }
            }
        }

        return matches;
    }

    private buildMatchVariants(value: string | null | undefined): string[] {
        const variants = new Set<string>();
        const raw = value == null ? "" : String(value);
        if (!raw.trim()) {
            return [];
        }

        const candidates = [
            raw,
            this.toLegacySvgId(raw, "illustrator"),
            this.toLegacySvgId(raw, "inkscape"),
            this.toLegacySvgId(raw, "legacy")
        ];

        for (const candidate of candidates) {
            const normalized = this.normalizeKey(candidate);
            if (normalized) {
                variants.add(normalized);
            }
        }

        return Array.from(variants);
    }

    private toLegacySvgId(value: string, appSupport: "illustrator" | "inkscape" | "legacy"): string {
        let returnId = value;
        if (appSupport === "illustrator") {
            returnId = returnId.replace(/[^A-Za-z0-9-:.]/g, (match) => {
                if (match === " ") {
                    return "_";
                }

                return `_x${match.charCodeAt(0).toString(16).toUpperCase()}_`;
            });

            if (/^\d/.test(returnId)) {
                returnId = `_x${returnId.charCodeAt(0).toString(16).toUpperCase()}_${returnId.slice(1)}`;
            }
        } else if (appSupport === "inkscape") {
            returnId = returnId.replace(/[^A-Za-z0-9-:.]/g, "_");
        } else {
            returnId = returnId.replace(/([^A-Za-z0-9[\]{}_.:-])\s?/g, "_");
            if (/^\d/.test(returnId)) {
                returnId = `_${returnId}`;
            }
        }

        return returnId;
    }

    private isIgnoredOrExcluded(element: SVGElement): boolean {
        return element.matches("#_x5F_ignored, #_ignored, .excluded, #_x5F_excluded, #_excluded");
    }

    private isExcludedParent(element: SVGElement): boolean {
        const parent = element.parentElement?.closest("[id], svg");
        if (!parent || parent.tagName.toLowerCase() === "svg") {
            return false;
        }

        return parent.matches(".excluded, #_x5F_excluded, #_excluded");
    }

    private findMatchableParentName(element: SVGElement): string | null {
        const parent = element.parentElement?.closest("[id], svg") as SVGElement | null;
        if (!parent || parent.tagName.toLowerCase() === "svg") {
            return null;
        }

        if (parent.matches("#_x5F_ignored, #_ignored")) {
            return null;
        }

        if (parent.matches(".excluded, #_x5F_excluded, #_excluded")) {
            return null;
        }

        return this.readTitleNode(parent) ?? parent.getAttribute("title") ?? (parent.id || null);
    }

    private escapeSelector(value: string): string {
        const css = (window as Window & typeof globalThis & { CSS?: { escape?(input: string): string } }).CSS;
        if (css?.escape) {
            return css.escape(value);
        }

        return value.replace(/([ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, "\\$1");
    }

    private readTitleNode(element: SVGElement): string | null {
        const titleNode = element.querySelector(":scope > title");
        return titleNode?.textContent?.trim() ?? null;
    }

    private readElementDisplayName(element: SVGElement): string | null {
        return element.getAttribute("data-synoptic-display-name")
            ?? this.readTitleNode(element)
            ?? element.getAttribute("title")
            ?? (element.id || null);
    }

    private getElementBounds(element: SVGElement): DOMRect {
        const graphicsElement = element as unknown as SVGGraphicsElement;
        const box = graphicsElement.getBBox();
        return new DOMRect(box.x, box.y, box.width, box.height);
    }

    private inflateSvg(svgMarkup: string): SVGSVGElement {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgMarkup, "image/svg+xml");
        const svgElement = doc.documentElement as unknown as SVGSVGElement;
        svgElement.style.width = "100%";
        svgElement.style.height = "100%";
        svgElement.style.maxWidth = "100%";
        svgElement.style.maxHeight = "100%";
        svgElement.setAttribute("preserveAspectRatio", svgElement.getAttribute("preserveAspectRatio") || "xMidYMid meet");
        return document.importNode(svgElement, true);
    }

    private applySavedScale(svgElement: SVGSVGElement, scale: SynopticMapScale | undefined): void {
        const value = scale?.scale ?? 1;
        const translation = scale?.translation ?? [0, 0];
        if (value === 1 && translation[0] === 0 && translation[1] === 0) {
            return;
        }

        const wrapper = document.createElementNS("http://www.w3.org/2000/svg", "g");
        wrapper.setAttribute("transform", `translate(${translation[0]}, ${translation[1]}) scale(${value})`);

        while (svgElement.firstChild) {
            wrapper.appendChild(svgElement.firstChild);
        }

        svgElement.appendChild(wrapper);
    }

    private async loadMapMarkup(map: SynopticMapDefinition): Promise<string> {
        const inlineData = map.data?.trim();
        if (this.looksLikeSvgMarkup(inlineData)) {
            return inlineData;
        }

        const url = map.URL?.trim();
        if (!url) {
            throw new Error("No SVG payload is available for this map.");
        }

        const cached = this.mapCache.get(url);
        if (cached) {
            return cached;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Map fetch failed with status ${response.status}`);
        }

        const svgMarkup = await response.text();
        this.mapCache.set(url, svgMarkup);
        return svgMarkup;
    }

    private resolveMapDefinition(
        mapColumn: powerbi.DataViewCategoryColumn | undefined,
        settings: SynopticVisualSettings
    ): SynopticMapDefinition | undefined {
        const categoryValue = mapColumn?.values?.find((value) => value != null && String(value).trim() !== "");
        if (categoryValue != null) {
            const mapValue = String(categoryValue).trim();
            if (this.looksLikeSvgMarkup(mapValue)) {
                return { data: mapValue };
            }

            return { URL: mapValue };
        }

        if (!settings.general.imageData) {
            return undefined;
        }

        const raw = settings.general.imageData.trim();
        if (!raw) {
            return undefined;
        }

        if (!raw.startsWith("[")) {
            return this.looksLikeSvgMarkup(raw) ? { data: raw } : { URL: raw };
        }

        try {
            const maps = JSON.parse(raw) as SynopticMapDefinition[];
            const selectedIndex = Math.max(0, settings.general.imageSelected || 0);
            return maps[selectedIndex] ?? maps[0];
        } catch {
            return this.looksLikeSvgMarkup(raw) ? { data: raw } : { URL: raw };
        }
    }

    private handleLocalMapFiles(fileList: FileList | null): void {
        const files = Array.from(fileList ?? [])
            .filter((file) => file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg"));

        if (files.length === 0) {
            this.status.textContent = "Please select an SVG file.";
            this.fileInput.value = "";
            return;
        }

        Promise.all(files.map((file) => this.readSvgFile(file)))
            .then((maps) => {
                const validMaps = maps.filter((map): map is SynopticMapDefinition => Boolean(map));
                if (validMaps.length === 0) {
                    this.status.textContent = "The selected file did not contain SVG markup.";
                    return;
                }

                this.host.persistProperties({
                    merge: [{
                        objectName: "general",
                        selector: null,
                        properties: {
                            imageData: JSON.stringify(validMaps),
                            imageSelected: 0
                        }
                    }]
                });

                const suffix = validMaps.length === 1 ? "" : "s";
                this.status.textContent = `Loaded ${validMaps.length} SVG map${suffix}.`;
            })
            .catch((error) => {
                this.status.textContent = error instanceof Error ? error.message : "Could not load the selected SVG file.";
            })
            .finally(() => {
                this.fileInput.value = "";
            });
    }

    private readSvgFile(file: File): Promise<SynopticMapDefinition | null> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const data = String(reader.result ?? "").trim();
                if (!this.looksLikeSvgMarkup(data)) {
                    resolve(null);
                    return;
                }

                resolve({
                    URL: null,
                    data,
                    displayName: file.name.replace(/\.svg$/i, ""),
                    areas: [],
                    scale: {
                        scale: 1,
                        translation: [0, 0]
                    }
                });
            };
            reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
            reader.readAsText(file);
        });
    }

    private looksLikeSvgMarkup(value: string | undefined): value is string {
        return Boolean(value && /<svg[\s>]/i.test(value));
    }

    private buildStatusText(model: SynopticModel, svgAreaCount: number, indexedKeyCount: number, matchedCount: number): string {
        const baseStatus = `${matchedCount}/${model.dataPoints.length} areas matched`;
        if (!model.settings.general.showDiagnostic) {
            return baseStatus;
        }

        const highlightedCount = model.dataPoints.filter((point) => point.isHighlighted).length;
        return [
            baseStatus,
            `${highlightedCount} highlighted`,
            `${svgAreaCount} SVG areas`,
            `${indexedKeyCount} indexed keys`,
            model.hasHighlights ? "highlighted" : "no highlights"
        ].join(" | ");
    }

    private isHighlightActive(value: number | undefined): boolean {
        return value != null && value !== 0;
    }

    private isEditMode(viewMode: ViewMode | undefined): boolean {
        return viewMode === ViewMode.Edit || viewMode === ViewMode.InFocusEdit;
    }

    private writeDiagnostic(settings: SynopticVisualSettings, label: string, details: unknown, forceError = false): void {
        if (!settings.general.showDiagnostic) {
            return;
        }

        const prefix = `Synoptic Panel ${label}`;
        if (forceError) {
            console.error(prefix, details);
            return;
        }

        console.info(prefix, details);
    }

    private readSettings(dataView: DataView | undefined): SynopticVisualSettings {
        const objects = dataView?.metadata?.objects;

        return {
            general: {
                imageData: this.getValue<string>(objects, "general", "imageData"),
                imageSelected: this.getValue<number>(objects, "general", "imageSelected", 0),
                showDiagnostic: this.getValue<boolean>(objects, "general", "showDiagnostic", false),
                showUnmatched: this.getValue<boolean>(objects, "general", "showUnmatched", true)
            },
            dataPoint: {
                borders: this.getValue<boolean>(objects, "dataPoint", "borders", true),
                defaultFill: this.getFillColor(objects, "dataPoint", "defaultFill", "#01B8AA"),
                unmatchedFill: this.getFillColor(objects, "dataPoint", "unmatchedFill"),
                showAll: this.getValue<boolean>(objects, "dataPoint", "showAll", false)
            },
            states: {
                show: this.getValue<boolean>(objects, "states", "show", true),
                comparison: this.getValue<string>(objects, "states", "comparison", "<=") ?? "<=",
                manual: [1, 2, 3, 4, 5].map((index) => ({
                    value: this.getValue<number>(objects, "states", `manualState${index}`),
                    color: this.getFillColor(objects, "states", `manualState${index}Fill`)
                }))
            },
            dataLabels: {
                show: this.getValue<boolean>(objects, "dataLabels", "show", false),
                unmatchedLabels: this.getValue<boolean>(objects, "dataLabels", "unmatchedLabels", true),
                labelStyle: this.getValue<string>(objects, "dataLabels", "labelStyle", "category") ?? "category",
                position: this.getValue<string>(objects, "dataLabels", "position", "best") ?? "best",
                fontSize: this.getValue<number>(objects, "dataLabels", "fontSize", 9) ?? 9,
                enclose: this.getValue<boolean>(objects, "dataLabels", "enclose", true),
                wordWrap: this.getValue<boolean>(objects, "dataLabels", "wordWrap", true)
            }
        };
    }

    private resolveDataPointColor(
        key: string,
        stateValue: number | undefined,
        resolvedStates: SynopticBoundState[],
        settings: SynopticVisualSettings,
        colorPalette: IColorPalette
    ): string {
        const stateColor = this.resolveStateColor(stateValue, resolvedStates, settings.states);
        if (stateColor) {
            return stateColor;
        }

        return colorPalette.getColor(key).value ?? settings.dataPoint.defaultFill;
    }

    private resolveStateColor(
        stateValue: number | undefined,
        resolvedStates: SynopticBoundState[],
        stateSettings: SynopticVisualSettings["states"]
    ): string | undefined {
        if (!stateSettings.show || stateValue == null || resolvedStates.length === 0) {
            return undefined;
        }

        const comparison = stateSettings.comparison;

        if (comparison === "=") {
            const match = resolvedStates.find((s) => s.color && stateValue === s.value);
            return match?.color ?? undefined;
        }

        if (comparison === ">=" || comparison === ">") {
            const descending = [...resolvedStates].sort((a, b) => b.value - a.value);
            const match = descending.find((s) => s.color && (comparison === ">" ? stateValue > s.value : stateValue >= s.value));
            return match?.color ?? undefined;
        }

        const ascending = [...resolvedStates].sort((a, b) => a.value - b.value);
        const match = ascending.find((s) => {
            if (!s.color) return false;
            return comparison === "<" ? stateValue < s.value : stateValue <= s.value;
        });
        if (match?.color) {
            return match.color;
        }

        // Legacy Synoptic Panel treats the last configured state as the catch-all
        // bucket for values above the highest <=/< threshold.
        return [...ascending].reverse().find((s) => s.color)?.color ?? undefined;
    }

    private sortBoundStates(states: SynopticBoundState[], comparison: string): SynopticBoundState[] {
        if (comparison === "=") return states;
        const asc = comparison.indexOf("<") > -1;
        return [...states].sort((a, b) => asc ? a.value - b.value : b.value - a.value);
    }

    private attachTooltipEvents(element: SVGElement, tooltipItems: VisualTooltipDataItem[], selectionId: ISelectionId): void {
        if (!this.tooltipService.enabled()) return;

        const getCoords = (event: MouseEvent): number[] => {
            const rect = this.root.getBoundingClientRect();
            return [event.clientX - rect.left, event.clientY - rect.top];
        };

        element.addEventListener("mouseover", (event: MouseEvent) => {
            this.tooltipService.show({
                coordinates: getCoords(event),
                isTouchEvent: false,
                dataItems: tooltipItems,
                identities: [selectionId]
            });
        });

        element.addEventListener("mousemove", (event: MouseEvent) => {
            this.tooltipService.move({
                coordinates: getCoords(event),
                isTouchEvent: false,
                dataItems: tooltipItems,
                identities: [selectionId]
            });
        });

        element.addEventListener("mouseout", () => {
            this.tooltipService.hide({
                isTouchEvent: false,
                immediately: false
            });
        });
    }

    private formatTooltipValue(value: PrimitiveValue, format?: string): string {
        if (value == null) return "";
        if (typeof value === "number") {
            if (format) {
                return this.formatNumberWithPattern(value, format);
            }
            return this.formatNumber(value);
        }
        return String(value);
    }

    private formatNumberWithPattern(value: number, format: string): string {
        if (format.indexOf("%") > -1) {
            return `${(value * 100).toFixed(1)}%`;
        }
        if (format.indexOf("0.0") > -1) {
            const decimals = (format.match(/0\.(0+)/)?.[1] ?? "").length;
            return value.toFixed(decimals);
        }
        return this.formatNumber(value);
    }

    private getFillColor(
        objects: powerbi.DataViewObjects | undefined,
        objectName: string,
        propertyName: string,
        defaultValue?: string
    ): string | undefined {
        const property = this.getValue<{ solid?: { color?: string } }>(objects, objectName, propertyName);
        return property?.solid?.color ?? defaultValue;
    }

    private getValue<T>(
        objects: powerbi.DataViewObjects | undefined,
        objectName: string,
        propertyName: string,
        defaultValue?: T
    ): T | undefined {
        const object = objects?.[objectName] as powerbi.DataViewObject | undefined;
        const property = object?.[propertyName];
        return (property as T | undefined) ?? defaultValue;
    }

    private readNumericValue(value: PrimitiveValue): number | undefined {
        return typeof value === "number" ? value : undefined;
    }

    private formatNumber(value: number): string {
        return Number.isInteger(value) ? `${value}` : value.toFixed(2).replace(/\.?0+$/, "");
    }

    private normalizeKey(value: string | null | undefined): string {
        if (!value) {
            return "";
        }

        return value
            .replace(/_x([A-Fa-f0-9]{2})_/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
            .replace(/_/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
    }
}
