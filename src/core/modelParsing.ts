import powerbi from "powerbi-visuals-api";
import { isHighlightActive } from "./interactionState";
import { resolveDataPointColor } from "./stateColors";

import DataView = powerbi.DataView;
import PrimitiveValue = powerbi.PrimitiveValue;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;

export interface SynopticMapArea {
    displayName?: string;
    elementId?: string;
    selector?: string;
    unmatchable?: boolean;
}

export interface SynopticMapScale {
    scale?: number;
    translation?: [number, number];
}

export interface SynopticMapDefinition {
    URL?: string | null;
    data?: string | null;
    displayName?: string;
    areas?: SynopticMapArea[];
    scale?: SynopticMapScale;
}

export interface SynopticManualState {
    value?: number;
    color?: string;
}

export interface SynopticVisualSettings {
    general: {
        imageData?: string;
        imageSelected: number;
        showDiagnostic: boolean;
        showUnmatched: boolean;
        showMatchCount: boolean;
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
    toolbar: {
        zoom: boolean;
    };
}

export interface SynopticBoundState {
    value: number;
    color: string | null;
    displayName: string | null;
    sourcePosition: number;
    isTarget: boolean;
}

export interface SynopticDataPoint<TSelectionId = unknown> {
    key: string;
    value?: number;
    highlightValue?: number;
    isHighlighted?: boolean;
    stateValue?: number;
    color: string;
    selectionId: TSelectionId;
    tooltips: VisualTooltipDataItem[];
}

export interface SynopticModel<TSelectionId = unknown> {
    map?: SynopticMapDefinition;
    dataPoints: SynopticDataPoint<TSelectionId>[];
    boundStates: SynopticBoundState[];
    hasBoundStates: boolean;
    hasHighlights: boolean;
    settings: SynopticVisualSettings;
}

export interface CreateSynopticModelOptions<TSelectionId> {
    getColor: (key: string) => string | undefined;
    createSelectionId: (categoryColumn: powerbi.DataViewCategoryColumn, index: number) => TSelectionId;
}

export function createSynopticModel<TSelectionId>(
    dataView: DataView | undefined,
    options: CreateSynopticModelOptions<TSelectionId>
): SynopticModel<TSelectionId> {
    const settings = readSettings(dataView);
    const categorical = dataView?.categorical;
    const categoryColumn = categorical?.categories?.find((column) => column.source.roles?.Category);
    const mapColumn = categorical?.categories?.find((column) => column.source.roles?.MapSeries);
    const measureColumn = categorical?.values?.find((column) => column.source.roles?.Y);
    const stateMeasureColumn = categorical?.values?.find((column) => column.source.roles?.State);
    const tooltipColumns = categorical?.values?.filter((column) => column.source.roles?.tooltips) ?? [];
    const boundStateColumns = categorical?.values?.filter((column) => column.source.roles?.states) ?? [];

    const boundStates = readBoundStates(boundStateColumns);
    const hasBoundStates = boundStateColumns.length > 0;
    const resolvedStates = hasBoundStates
        ? sortBoundStates(boundStates, settings.states.comparison)
        : settings.states.manual.filter((state) => state.value != null && state.color)
            .map((state, index) => ({
                value: state.value!,
                color: state.color!,
                displayName: null,
                sourcePosition: index,
                isTarget: false
            }));

    const highlights = measureColumn?.highlights;
    const hasHighlights = Array.isArray(highlights) && highlights.some((value) => isHighlightActive(readNumericValue(value)));
    const dataPoints: SynopticDataPoint<TSelectionId>[] = [];
    const categories = categoryColumn?.values ?? [];

    for (let index = 0; index < categories.length; index++) {
        const rawKey = categories[index];
        const key = rawKey == null ? "" : String(rawKey).trim();
        if (!key || !categoryColumn) {
            continue;
        }

        const value = readNumericValue(measureColumn?.values?.[index]);
        const highlightValue = readNumericValue(highlights?.[index]);
        const rawStateValue = readNumericValue(stateMeasureColumn?.values?.[index]);
        const stateValue = rawStateValue ?? value;
        const color = resolveDataPointColor(
            stateValue,
            resolvedStates,
            settings.states,
            options.getColor(key),
            settings.dataPoint.defaultFill
        );

        dataPoints.push({
            key,
            value,
            highlightValue,
            isHighlighted: isHighlightActive(highlightValue),
            stateValue,
            color,
            selectionId: options.createSelectionId(categoryColumn, index),
            tooltips: buildTooltips(categoryColumn, measureColumn, stateMeasureColumn, tooltipColumns, index, key, value, stateValue)
        });
    }

    return {
        map: resolveMapDefinition(mapColumn, settings),
        dataPoints,
        boundStates: resolvedStates,
        hasBoundStates,
        hasHighlights,
        settings
    };
}

export function readSettings(dataView: DataView | undefined): SynopticVisualSettings {
    const objects = dataView?.metadata?.objects;

    return {
        general: {
            imageData: getValue<string>(objects, "general", "imageData"),
            imageSelected: getValue<number>(objects, "general", "imageSelected", 0),
            showDiagnostic: getValue<boolean>(objects, "general", "showDiagnostic", false),
            showUnmatched: getValue<boolean>(objects, "general", "showUnmatched", true),
            showMatchCount: getValue<boolean>(objects, "general", "showMatchCount", true)
        },
        dataPoint: {
            borders: getValue<boolean>(objects, "dataPoint", "borders", true),
            defaultFill: getFillColor(objects, "dataPoint", "defaultFill", "#01B8AA"),
            unmatchedFill: getFillColor(objects, "dataPoint", "unmatchedFill"),
            showAll: getValue<boolean>(objects, "dataPoint", "showAll", false)
        },
        states: {
            show: getValue<boolean>(objects, "states", "show", true),
            comparison: getValue<string>(objects, "states", "comparison", "<=") ?? "<=",
            manual: [1, 2, 3, 4, 5].map((index) => ({
                value: getValue<number>(objects, "states", `manualState${index}`),
                color: getFillColor(objects, "states", `manualState${index}Fill`)
            }))
        },
        dataLabels: {
            show: getValue<boolean>(objects, "dataLabels", "show", false),
            unmatchedLabels: getValue<boolean>(objects, "dataLabels", "unmatchedLabels", true),
            labelStyle: getValue<string>(objects, "dataLabels", "labelStyle", "category") ?? "category",
            position: getValue<string>(objects, "dataLabels", "position", "best") ?? "best",
            fontSize: getValue<number>(objects, "dataLabels", "fontSize", 9) ?? 9,
            enclose: getValue<boolean>(objects, "dataLabels", "enclose", true),
            wordWrap: getValue<boolean>(objects, "dataLabels", "wordWrap", true)
        },
        toolbar: {
            zoom: getValue<boolean>(objects, "toolbar", "zoom", true)
        }
    };
}

export function readBoundStates(boundStateColumns: powerbi.DataViewValueColumn[]): SynopticBoundState[] {
    const states: SynopticBoundState[] = [];
    for (let index = 0; index < boundStateColumns.length; index++) {
        const column = boundStateColumns[index];
        const value = readNumericValue(column.values?.[0]);
        if (value == null) {
            continue;
        }

        const fillObject = column.source.objects?.["states"]?.["fill"] as { solid?: { color?: string } } | undefined;
        states.push({
            value,
            color: fillObject?.solid?.color ?? null,
            displayName: column.source.displayName ?? null,
            sourcePosition: index,
            isTarget: false
        });
    }

    return states;
}

export function sortBoundStates(states: SynopticBoundState[], comparison: string): SynopticBoundState[] {
    if (comparison === "=") {
        return states;
    }

    const ascending = comparison.indexOf("<") > -1;
    return [...states].sort((a, b) => ascending ? a.value - b.value : b.value - a.value);
}

export function resolveMapDefinition(
    mapColumn: powerbi.DataViewCategoryColumn | undefined,
    settings: SynopticVisualSettings
): SynopticMapDefinition | undefined {
    const categoryValue = mapColumn?.values?.find((value) => value != null && String(value).trim() !== "");
    if (categoryValue != null) {
        const mapValue = String(categoryValue).trim();
        if (looksLikeSvgMarkup(mapValue)) {
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
        return looksLikeSvgMarkup(raw) ? { data: raw } : { URL: raw };
    }

    try {
        const maps = JSON.parse(raw) as SynopticMapDefinition[];
        const selectedIndex = Math.max(0, settings.general.imageSelected || 0);
        return maps[selectedIndex] ?? maps[0];
    } catch {
        return looksLikeSvgMarkup(raw) ? { data: raw } : { URL: raw };
    }
}

export function formatTooltipValue(value: PrimitiveValue, format?: string): string {
    if (value == null) {
        return "";
    }

    if (typeof value === "number") {
        if (format) {
            return formatNumberWithPattern(value, format);
        }

        return formatNumber(value);
    }

    return String(value);
}

export function formatNumber(value: number): string {
    return Number.isInteger(value) ? `${value}` : value.toFixed(2).replace(/\.?0+$/, "");
}

function buildTooltips(
    categoryColumn: powerbi.DataViewCategoryColumn,
    measureColumn: powerbi.DataViewValueColumn | undefined,
    stateMeasureColumn: powerbi.DataViewValueColumn | undefined,
    tooltipColumns: powerbi.DataViewValueColumn[],
    index: number,
    key: string,
    value: number | undefined,
    stateValue: number | undefined
): VisualTooltipDataItem[] {
    const tooltips: VisualTooltipDataItem[] = [];
    tooltips.push({ displayName: categoryColumn.source.displayName ?? "Category", value: key });
    if (value != null && measureColumn) {
        tooltips.push({
            displayName: measureColumn.source.displayName ?? "Value",
            value: formatTooltipValue(value, measureColumn.source.format)
        });
    }
    if (stateValue != null && stateMeasureColumn) {
        tooltips.push({
            displayName: stateMeasureColumn.source.displayName ?? "State",
            value: formatTooltipValue(stateValue, stateMeasureColumn.source.format)
        });
    }
    for (const tooltipColumn of tooltipColumns) {
        const tooltipValue = tooltipColumn.values?.[index];
        if (tooltipValue != null) {
            tooltips.push({
                displayName: tooltipColumn.source.displayName ?? "",
                value: formatTooltipValue(tooltipValue, tooltipColumn.source.format)
            });
        }
    }

    return tooltips;
}

function getFillColor(
    objects: powerbi.DataViewObjects | undefined,
    objectName: string,
    propertyName: string,
    defaultValue?: string
): string | undefined {
    const property = getValue<{ solid?: { color?: string } }>(objects, objectName, propertyName);
    return property?.solid?.color ?? defaultValue;
}

function getValue<T>(
    objects: powerbi.DataViewObjects | undefined,
    objectName: string,
    propertyName: string,
    defaultValue?: T
): T | undefined {
    const object = objects?.[objectName] as powerbi.DataViewObject | undefined;
    const property = object?.[propertyName];
    return (property as T | undefined) ?? defaultValue;
}

function readNumericValue(value: PrimitiveValue): number | undefined {
    return typeof value === "number" ? value : undefined;
}

function formatNumberWithPattern(value: number, format: string): string {
    if (format.indexOf("%") > -1) {
        return `${(value * 100).toFixed(1)}%`;
    }
    if (format.indexOf("0.0") > -1) {
        const decimals = (format.match(/0\.(0+)/)?.[1] ?? "").length;
        return value.toFixed(decimals);
    }

    return formatNumber(value);
}

export function looksLikeSvgMarkup(value: string | undefined): value is string {
    return Boolean(value && /<svg[\s>]/i.test(value));
}
