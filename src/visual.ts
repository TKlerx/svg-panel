"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";

import DataView = powerbi.DataView;
import ISelectionId = powerbi.visuals.ISelectionId;
import IColorPalette = powerbi.extensibility.IColorPalette;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import IVisual = powerbi.extensibility.visual.IVisual;
import PrimitiveValue = powerbi.PrimitiveValue;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;

import { VisualFormattingSettingsModel } from "./settings";

interface SynopticMapArea {
    displayName?: string;
    elementId?: string;
    selector?: string;
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

interface SynopticDataPoint {
    key: string;
    value?: number;
    highlightValue?: number;
    isHighlighted?: boolean;
    stateValue?: number;
    color: string;
    selectionId: ISelectionId;
}

interface SynopticModel {
    map?: SynopticMapDefinition;
    dataPoints: SynopticDataPoint[];
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
    private readonly status: HTMLDivElement;
    private readonly svgHost: HTMLDivElement;
    private readonly mapCache: Map<string, string>;
    private formattingSettings: VisualFormattingSettingsModel;
    private updateNonce: number;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.target = options.element;
        this.selectionManager = options.host.createSelectionManager();
        this.formattingSettingsService = new FormattingSettingsService();
        this.mapCache = new Map<string, string>();
        this.updateNonce = 0;

        this.root = document.createElement("div");
        this.root.className = "synoptic-modern";

        this.status = document.createElement("div");
        this.status.className = "synoptic-status";

        this.svgHost = document.createElement("div");
        this.svgHost.className = "synoptic-map-host";

        this.root.append(this.status, this.svgHost);
        this.target.appendChild(this.root);
    }

    public update(options: VisualUpdateOptions): void {
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(
            VisualFormattingSettingsModel,
            options.dataViews?.[0]
        );

        this.root.style.width = `${options.viewport.width}px`;
        this.root.style.height = `${options.viewport.height}px`;

        const model = this.transform(options.dataViews?.[0], this.host.colorPalette);
        const currentNonce = ++this.updateNonce;

        void this.render(model, currentNonce);
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }

    private transform(dataView: DataView | undefined, colorPalette: IColorPalette): SynopticModel {
        const settings = this.readSettings(dataView);
        const categorical = dataView?.categorical;
        const categoryColumn = categorical?.categories?.find((column) => column.source.roles?.Category);
        const mapColumn = categorical?.categories?.find((column) => column.source.roles?.MapSeries);
        const measureColumn = categorical?.values?.find((column) => column.source.roles?.Y);
        const stateColumn = categorical?.values?.find((column) => column.source.roles?.State || column.source.roles?.states);

        const dataPoints: SynopticDataPoint[] = [];
        const highlights = measureColumn?.highlights;
        const hasHighlights = Array.isArray(highlights) && highlights.some((value) => value != null);
        const categories = categoryColumn?.values ?? [];
        for (let index = 0; index < categories.length; index++) {
            const rawKey = categories[index];
            const key = rawKey == null ? "" : String(rawKey).trim();
            if (!key || !categoryColumn) {
                continue;
            }

            const value = this.readNumericValue(measureColumn?.values?.[index]);
            const highlightValue = this.readNumericValue(highlights?.[index]);
            const stateValue = this.readNumericValue(stateColumn?.values?.[index]);
            const color = this.resolveDataPointColor(key, stateValue, settings, colorPalette);

            dataPoints.push({
                key,
                value,
                highlightValue,
                isHighlighted: highlightValue != null,
                stateValue,
                color,
                selectionId: this.host.createSelectionIdBuilder()
                    .withCategory(categoryColumn, index)
                    .createSelectionId()
            });
        }

        return {
            map: this.resolveMapDefinition(mapColumn, settings),
            dataPoints,
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

            const matchMap = this.indexSvg(svgElement, model.map.areas ?? []);
            const labelSpecs = this.applyData(svgElement, matchMap, model);
            if (model.settings.dataLabels.show) {
                this.renderLabels(svgElement, labelSpecs, model.settings);
            }

            this.svgHost.appendChild(svgElement);

            const matchedCount = model.dataPoints.filter((point) => matchMap.has(this.normalizeKey(point.key))).length;
            this.status.textContent = `${matchedCount}/${model.dataPoints.length} areas matched`;
        } catch (error) {
            if (nonce !== this.updateNonce) {
                return;
            }

            this.status.textContent = "Unable to load the configured SVG map.";
            if (model.settings.general.showDiagnostic) {
                console.error("Synoptic Panel render error", error);
            }
        }
    }

    private applyData(svgElement: SVGSVGElement, matchMap: SvgMatchMap, model: SynopticModel): LabelSpec[] {
        const matchedElements = new Set<SVGElement>();
        const labels: LabelSpec[] = [];
        svgElement.setAttribute("data-has-highlights", model.hasHighlights ? "true" : "false");

        for (const point of model.dataPoints) {
            const normalizedKey = this.normalizeKey(point.key);
            const matches = matchMap.get(normalizedKey) ?? [];
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

                if (model.hasHighlights) {
                    element.style.opacity = point.isHighlighted ? "1" : "0.25";
                }

                const tooltip = point.value == null ? point.key : `${point.key}: ${point.value}`;
                element.setAttribute("title", tooltip);
                element.addEventListener("click", (event: MouseEvent) => {
                    event.preventDefault();
                    event.stopPropagation();

                    void this.selectionManager.select(point.selectionId, event.ctrlKey || event.metaKey).then(() => {
                        this.applySelectionState(svgElement, matchedElements, point.selectionId);
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

        if (model.settings.general.showUnmatched) {
            const unmatchedFill = model.settings.dataPoint.unmatchedFill;
            if (unmatchedFill) {
                for (const element of this.collectRenderableElements(svgElement)) {
                    if (!matchedElements.has(element)) {
                        element.style.fill = unmatchedFill;
                        if (model.hasHighlights) {
                            element.style.opacity = "0.08";
                        }
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
            void this.selectionManager.clear().then(() => this.applySelectionState(svgElement, matchedElements));
        });

        return labels;
    }

    private renderLabels(svgElement: SVGSVGElement, labels: LabelSpec[], settings: SynopticVisualSettings): void {
        const labelLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
        labelLayer.setAttribute("class", "synoptic-label-layer");

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

    private applySelectionState(svgElement: SVGSVGElement, matchedElements: Set<SVGElement>, activeSelection?: ISelectionId): void {
        const hasSelection = Boolean(activeSelection);
        const hasHighlights = svgElement.getAttribute("data-has-highlights") === "true";
        for (const element of this.collectRenderableElements(svgElement)) {
            const isMatched = matchedElements.has(element);
            const isSelected = hasSelection && element.getAttribute("data-selection-key") === activeSelection!.getKey();
            if (!hasSelection) {
                if (hasHighlights) {
                    const isHighlighted = element.getAttribute("data-highlighted") === "true";
                    element.style.opacity = isHighlighted ? "1" : (isMatched ? "0.25" : "0.08");
                } else {
                    element.style.opacity = "1";
                }
            } else {
                element.style.opacity = isSelected ? "1" : (isMatched ? "0.25" : "0.1");
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
                const normalized = this.normalizeKey(candidate);
                if (!normalized) {
                    continue;
                }

                const elements = matchMap.get(normalized) ?? [];
                elements.push(element);
                matchMap.set(normalized, elements);
            }
        }

        return matchMap;
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
        const selector = "path, polygon, polyline, rect, circle, ellipse, line";
        return Array.from(svgElement.querySelectorAll<SVGElement>(selector));
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
        if (inlineData?.startsWith("<svg")) {
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
            if (mapValue.startsWith("<svg")) {
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
            return raw.startsWith("<svg") ? { data: raw } : { URL: raw };
        }

        try {
            const maps = JSON.parse(raw) as SynopticMapDefinition[];
            const selectedIndex = Math.max(0, settings.general.imageSelected || 0);
            return maps[selectedIndex] ?? maps[0];
        } catch {
            return raw.startsWith("<svg") ? { data: raw } : { URL: raw };
        }
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
        settings: SynopticVisualSettings,
        colorPalette: IColorPalette
    ): string {
        const stateColor = this.resolveStateColor(stateValue, settings.states);
        if (stateColor) {
            return stateColor;
        }

        return colorPalette.getColor(key).value ?? settings.dataPoint.defaultFill;
    }

    private resolveStateColor(stateValue: number | undefined, states: SynopticVisualSettings["states"]): string | undefined {
        if (!states.show || stateValue == null) {
            return undefined;
        }

        const configuredStates = states.manual.filter((entry) => entry.value != null && entry.color);
        if (configuredStates.length === 0) {
            return undefined;
        }

        const orderedStates = [...configuredStates].sort((left, right) => (left.value ?? 0) - (right.value ?? 0));
        if (states.comparison === ">=" || states.comparison === ">") {
            const reversed = [...orderedStates].reverse();
            const match = reversed.find((entry) => states.comparison === ">" ? stateValue > (entry.value ?? 0) : stateValue >= (entry.value ?? 0));
            return match?.color;
        }

        const match = orderedStates.find((entry) => {
            const threshold = entry.value ?? 0;
            switch (states.comparison) {
                case "<":
                    return stateValue < threshold;
                case "=":
                    return stateValue === threshold;
                case "<=":
                default:
                    return stateValue <= threshold;
            }
        });

        return match?.color;
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
