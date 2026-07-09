import { describe, expect, it } from "vitest";
import { GradientSettings, mixColors, resolveDataPointColor, resolveGradientColor, resolveStateColor, StateColorRule } from "./stateColors";

const states: StateColorRule[] = [
    { value: 0.33, color: "#cf4a5c" },
    { value: 0.66, color: "#d7b900" },
    { value: 1, color: "#1fad20" }
];

describe("resolveStateColor", () => {
    it("returns undefined when state coloring is disabled", () => {
        expect(resolveStateColor(0.2, states, { show: false, comparison: "<=" })).toBeUndefined();
    });

    it("matches exact values for equality comparison", () => {
        expect(resolveStateColor(0.66, states, { show: true, comparison: "=" })).toBe("#d7b900");
        expect(resolveStateColor(0.7, states, { show: true, comparison: "=" })).toBeUndefined();
    });

    it("uses ascending thresholds for <= comparison", () => {
        expect(resolveStateColor(0.2, states, { show: true, comparison: "<=" })).toBe("#cf4a5c");
        expect(resolveStateColor(0.5, states, { show: true, comparison: "<=" })).toBe("#d7b900");
    });

    it("uses the last state as a catch-all above the highest <= threshold", () => {
        expect(resolveStateColor(1.4, states, { show: true, comparison: "<=" })).toBe("#1fad20");
    });

    it("uses strict thresholds for < comparison", () => {
        expect(resolveStateColor(0.33, states, { show: true, comparison: "<" })).toBe("#d7b900");
    });

    it("uses descending thresholds for >= comparison", () => {
        expect(resolveStateColor(0.8, states, { show: true, comparison: ">=" })).toBe("#d7b900");
        expect(resolveStateColor(1.2, states, { show: true, comparison: ">=" })).toBe("#1fad20");
    });

    it("uses strict thresholds for > comparison", () => {
        expect(resolveStateColor(0.66, states, { show: true, comparison: ">" })).toBe("#cf4a5c");
    });

    it("ignores states without colors", () => {
        const rules = [
            { value: 0.33, color: null },
            { value: 0.66, color: "#d7b900" }
        ];

        expect(resolveStateColor(0.2, rules, { show: true, comparison: "<=" })).toBe("#d7b900");
    });
});

describe("resolveDataPointColor", () => {
    it("prefers a matching state color over palette and default colors", () => {
        expect(resolveDataPointColor(0.2, states, { show: true, comparison: "<=" }, "#palette", "#default"))
            .toBe("#cf4a5c");
    });

    it("falls back to palette color when no state color matches", () => {
        expect(resolveDataPointColor(0.7, states, { show: true, comparison: "=" }, "#palette", "#default"))
            .toBe("#palette");
    });

    it("falls back to default fill when neither state nor palette color is available", () => {
        expect(resolveDataPointColor(0.7, states, { show: true, comparison: "=" }, undefined, "#default"))
            .toBe("#default");
    });

    it("uses the gradient color when style is gradient", () => {
        const gradient: GradientSettings = {
            diverging: false,
            min: { color: "#000000", value: 0 },
            center: { color: "#808080", value: 5 },
            max: { color: "#ffffff", value: 10 }
        };

        expect(resolveDataPointColor(5, states, { show: true, comparison: "<=", style: "gradient", gradient }, "#palette", "#default"))
            .toBe("#808080");
    });
});

describe("mixColors", () => {
    it("returns the start color at t = 0", () => {
        expect(mixColors("#000000", "#ffffff", 0)).toBe("#000000");
    });

    it("returns the end color at t = 1", () => {
        expect(mixColors("#000000", "#ffffff", 1)).toBe("#ffffff");
    });

    it("interpolates linearly at the midpoint", () => {
        expect(mixColors("#000000", "#ffffff", 0.5)).toBe("#808080");
    });

    it("supports shorthand hex colors", () => {
        expect(mixColors("#000", "#fff", 1)).toBe("#ffffff");
    });
});

describe("resolveGradientColor", () => {
    const linear: GradientSettings = {
        diverging: false,
        min: { color: "#000000", value: 0 },
        center: { color: "#808080", value: 5 },
        max: { color: "#ffffff", value: 10 }
    };

    it("returns undefined when the value is missing", () => {
        expect(resolveGradientColor(undefined, linear)).toBeUndefined();
    });

    it("interpolates a two-color gradient across the domain", () => {
        expect(resolveGradientColor(0, linear)).toBe("#000000");
        expect(resolveGradientColor(5, linear)).toBe("#808080");
        expect(resolveGradientColor(10, linear)).toBe("#ffffff");
    });

    it("clamps values outside the domain", () => {
        expect(resolveGradientColor(-5, linear)).toBe("#000000");
        expect(resolveGradientColor(20, linear)).toBe("#ffffff");
    });

    it("uses the center color around the midpoint for diverging gradients", () => {
        const diverging: GradientSettings = { ...linear, diverging: true };
        expect(resolveGradientColor(0, diverging)).toBe("#000000");
        expect(resolveGradientColor(5, diverging)).toBe("#808080");
        expect(resolveGradientColor(10, diverging)).toBe("#ffffff");
        expect(resolveGradientColor(2.5, diverging)).toBe("#404040");
    });

    it("returns the min color when the domain has no span", () => {
        const flat: GradientSettings = {
            diverging: false,
            min: { color: "#123456", value: 4 },
            center: { color: "#808080", value: 4 },
            max: { color: "#654321", value: 4 }
        };

        expect(resolveGradientColor(4, flat)).toBe("#123456");
    });
});
