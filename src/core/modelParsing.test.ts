import powerbi from "powerbi-visuals-api";
import { describe, expect, it } from "vitest";
import { createSynopticModel, formatNumber, formatTooltipValue, readSettings, resolveMapDefinition, sortBoundStates } from "./modelParsing";

import DataView = powerbi.DataView;
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import DataViewValueColumn = powerbi.DataViewValueColumn;

function categoryColumn(displayName: string, role: string, values: unknown[]): DataViewCategoryColumn {
    return {
        source: { displayName, roles: { [role]: true } },
        values
    } as DataViewCategoryColumn;
}

function valueColumn(displayName: string, role: string, values: unknown[], extras: Partial<DataViewValueColumn> = {}): DataViewValueColumn {
    return {
        ...extras,
        source: {
            ...extras.source,
            displayName,
            roles: { ...extras.source?.roles, [role]: true }
        },
        values,
        highlights: extras.highlights
    } as DataViewValueColumn;
}

function dataView(partial: Partial<DataView>): DataView {
    return partial as DataView;
}

describe("readSettings", () => {
    it("returns legacy-compatible defaults when no objects are configured", () => {
        const settings = readSettings(undefined);

        expect(settings.general.showUnmatched).toBe(true);
        expect(settings.general.showMatchCount).toBe(true);
        expect(settings.dataPoint.defaultFill).toBe("#01B8AA");
        expect(settings.states.comparison).toBe("<=");
        expect(settings.toolbar.zoom).toBe(true);
    });

    it("reads persisted format-pane values", () => {
        const settings = readSettings(dataView({
            metadata: {
                objects: {
                    general: { showDiagnostic: true, imageSelected: 2 },
                    dataPoint: { defaultFill: { solid: { color: "#123456" } }, showAll: true },
                    states: { comparison: ">=", manualState1: 10, manualState1Fill: { solid: { color: "#abcdef" } } },
                    toolbar: { zoom: false }
                }
            }
        }));

        expect(settings.general.showDiagnostic).toBe(true);
        expect(settings.general.imageSelected).toBe(2);
        expect(settings.dataPoint.defaultFill).toBe("#123456");
        expect(settings.dataPoint.showAll).toBe(true);
        expect(settings.states.comparison).toBe(">=");
        expect(settings.states.manual[0]).toEqual({ value: 10, color: "#abcdef" });
        expect(settings.toolbar.zoom).toBe(false);
    });
});

describe("createSynopticModel", () => {
    it("builds data points with colors, tooltips, highlights, and selection ids", () => {
        const category = categoryColumn("Artikel", "Category", ["Klopapier", " ", "Backwaren"]);
        const measure = valueColumn("Fuellstand", "Y", [0, 0.5, 0.75], {
            highlights: [0, 0, 0.75],
            source: { format: "0.0%" }
        });
        const state = valueColumn("State", "State", [0.1, 0.2, 0.7]);
        const tooltip = valueColumn("Extra", "tooltips", ["A", null, "C"]);

        const model = createSynopticModel(dataView({
            metadata: {
                objects: {
                    states: {
                        manualState1: 0.5,
                        manualState1Fill: { solid: { color: "#d6bf00" } },
                        manualState2: 1,
                        manualState2Fill: { solid: { color: "#22aa22" } }
                    }
                }
            },
            categorical: {
                categories: [category],
                values: [measure, state, tooltip]
            }
        }), {
            getColor: (key) => `palette:${key}`,
            createSelectionId: (_column, index) => `selection:${index}`
        });

        expect(model.hasHighlights).toBe(true);
        expect(model.dataPoints).toHaveLength(2);
        expect(model.dataPoints[0]).toMatchObject({
            key: "Klopapier",
            value: 0,
            highlightValue: 0,
            isHighlighted: false,
            stateValue: 0.1,
            color: "#d6bf00",
            selectionId: "selection:0"
        });
        expect(model.dataPoints[0].tooltips).toEqual([
            { displayName: "Artikel", value: "Klopapier" },
            { displayName: "Fuellstand", value: "0.0%" },
            { displayName: "State", value: "0.1" },
            { displayName: "Extra", value: "A" }
        ]);
        expect(model.dataPoints[1]).toMatchObject({
            key: "Backwaren",
            isHighlighted: true,
            color: "#22aa22",
            selectionId: "selection:2"
        });
    });

    it("uses bound states instead of manual states when bound state columns exist", () => {
        const category = categoryColumn("Artikel", "Category", ["A", "B"]);
        const measure = valueColumn("Value", "Y", [0.2, 0.8]);
        const stateA = valueColumn("Low", "states", [0.5], {
            source: { objects: { states: { fill: { solid: { color: "#low" } } } } }
        });
        const stateB = valueColumn("High", "states", [1], {
            source: { objects: { states: { fill: { solid: { color: "#high" } } } } }
        });

        const model = createSynopticModel(dataView({
            metadata: {
                objects: {
                    states: {
                        manualState1: 1,
                        manualState1Fill: { solid: { color: "#manual" } }
                    }
                }
            },
            categorical: {
                categories: [category],
                values: [measure, stateB, stateA]
            }
        }), {
            getColor: () => "#palette",
            createSelectionId: (_column, index) => index
        });

        expect(model.hasBoundStates).toBe(true);
        expect(model.boundStates.map((state) => state.value)).toEqual([0.5, 1]);
        expect(model.dataPoints.map((point) => point.color)).toEqual(["#low", "#high"]);
    });
});

describe("resolveMapDefinition", () => {
    it("treats map category values as URLs unless they contain inline SVG", () => {
        const settings = readSettings(undefined);

        expect(resolveMapDefinition(categoryColumn("Map", "MapSeries", ["https://example.test/map.svg"]), settings)).toEqual({
            URL: "https://example.test/map.svg"
        });
        expect(resolveMapDefinition(categoryColumn("Map", "MapSeries", ["<svg></svg>"]), settings)).toEqual({
            data: "<svg></svg>"
        });
    });

    it("selects saved maps by configured image index", () => {
        const settings = readSettings(dataView({
            metadata: {
                objects: {
                    general: {
                        imageSelected: 1,
                        imageData: JSON.stringify([{ URL: "first.svg" }, { data: "<svg id='second'></svg>" }])
                    }
                }
            }
        }));

        expect(resolveMapDefinition(undefined, settings)).toEqual({ data: "<svg id='second'></svg>" });
    });
});

describe("format helpers", () => {
    it("formats labels and tooltip numbers like the visual", () => {
        expect(formatNumber(10)).toBe("10");
        expect(formatNumber(10.5)).toBe("10.5");
        expect(formatTooltipValue(0.4486, "0.0%")).toBe("44.9%");
        expect(formatTooltipValue(12.345, "0.00")).toBe("12.35");
        expect(formatTooltipValue("Shelf A")).toBe("Shelf A");
    });
});

describe("sortBoundStates", () => {
    it("sorts by comparison direction while preserving equality order", () => {
        const states = [
            { value: 2, color: "#2", displayName: null, sourcePosition: 0, isTarget: false },
            { value: 1, color: "#1", displayName: null, sourcePosition: 1, isTarget: false }
        ];

        expect(sortBoundStates(states, "<=").map((state) => state.value)).toEqual([1, 2]);
        expect(sortBoundStates(states, ">=").map((state) => state.value)).toEqual([2, 1]);
        expect(sortBoundStates(states, "=")).toBe(states);
    });
});
