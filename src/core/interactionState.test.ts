import { describe, expect, it } from "vitest";
import { isHighlightActive } from "./interactionState";

describe("isHighlightActive", () => {
    it("treats undefined as inactive", () => {
        expect(isHighlightActive(undefined)).toBe(false);
    });

    it("treats zero as inactive", () => {
        expect(isHighlightActive(0)).toBe(false);
    });

    it("treats positive and negative values as active", () => {
        expect(isHighlightActive(1)).toBe(true);
        expect(isHighlightActive(-1)).toBe(true);
    });
});
