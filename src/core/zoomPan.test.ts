import { describe, expect, it } from "vitest";
import { buildTransformStyle, clampZoom, createZeroPan, nextZoom, shouldResetPanForZoom } from "./zoomPan";

describe("createZeroPan", () => {
    it("returns a fresh zero pan offset", () => {
        const first = createZeroPan();
        const second = createZeroPan();

        expect(first).toEqual({ x: 0, y: 0 });
        expect(first).not.toBe(second);
    });
});

describe("clampZoom", () => {
    it("keeps zoom inside the supported range", () => {
        expect(clampZoom(0)).toBe(0.25);
        expect(clampZoom(1.5)).toBe(1.5);
        expect(clampZoom(10)).toBe(4);
    });
});

describe("nextZoom", () => {
    it("applies deltas before clamping", () => {
        expect(nextZoom(1, 0.25)).toBe(1.25);
        expect(nextZoom(0.3, -0.25)).toBe(0.25);
        expect(nextZoom(3.9, 0.25)).toBe(4);
    });
});

describe("shouldResetPanForZoom", () => {
    it("resets pan only at the default zoom level", () => {
        expect(shouldResetPanForZoom(1)).toBe(true);
        expect(shouldResetPanForZoom(1.25)).toBe(false);
        expect(shouldResetPanForZoom(0.75)).toBe(false);
    });
});

describe("buildTransformStyle", () => {
    it("clears transform styles for default zoom and zero pan", () => {
        expect(buildTransformStyle(1, { x: 0, y: 0 })).toEqual({
            transform: "",
            transformOrigin: ""
        });
    });

    it("creates a scale-only transform when only zoom changes", () => {
        expect(buildTransformStyle(2, { x: 0, y: 0 })).toEqual({
            transform: "scale(2)",
            transformOrigin: "center center"
        });
    });

    it("creates a translate and scale transform when panned", () => {
        expect(buildTransformStyle(1.5, { x: 12, y: -8 })).toEqual({
            transform: "translate(12px, -8px) scale(1.5)",
            transformOrigin: "center center"
        });
    });
});
