import { describe, expect, it } from "vitest";
import { resolveDataPointColor, resolveStateColor, StateColorRule } from "./stateColors";

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
});
