import { describe, expect, it } from "vitest";
import { buildMatchVariants, normalizeKey, toLegacySvgId } from "./svgMatching";

describe("normalizeKey", () => {
    it("lowercases, trims, and collapses whitespace", () => {
        expect(normalizeKey("  Machine   A  ")).toBe("machine a");
    });

    it("treats underscores as spaces", () => {
        expect(normalizeKey("PDG_11")).toBe("pdg 11");
    });

    it("decodes two-digit SVG hex escape sequences", () => {
        expect(normalizeKey("PDG_x20_11")).toBe("pdg 11");
    });

    it("returns an empty key for nullish or empty input", () => {
        expect(normalizeKey(undefined)).toBe("");
        expect(normalizeKey(null)).toBe("");
        expect(normalizeKey("")).toBe("");
    });
});

describe("toLegacySvgId", () => {
    it("encodes leading digits for illustrator-style IDs", () => {
        expect(toLegacySvgId("18", "illustrator")).toBe("_x31_8");
    });

    it("replaces spaces with underscores for illustrator-style IDs", () => {
        expect(toLegacySvgId("PDG 11", "illustrator")).toBe("PDG_11");
    });

    it("hex-encodes non-space unsupported characters for illustrator-style IDs", () => {
        expect(toLegacySvgId("A/B", "illustrator")).toBe("A_x2F_B");
    });

    it("replaces unsupported characters with underscores for inkscape-style IDs", () => {
        expect(toLegacySvgId("A/B", "inkscape")).toBe("A_B");
    });

    it("prefixes leading digits for legacy IDs", () => {
        expect(toLegacySvgId("18", "legacy")).toBe("_18");
    });
});

describe("buildMatchVariants", () => {
    it("deduplicates numeric legacy ID variants that normalize back to the same key", () => {
        expect(buildMatchVariants("18")).toEqual(["18"]);
    });

    it("includes distinct legacy ID variants when punctuation is encoded differently", () => {
        expect(buildMatchVariants("A/B")).toEqual(["a/b", "a b"]);
    });

    it("deduplicates variants that normalize to the same key", () => {
        expect(buildMatchVariants("PDG 11")).toEqual(["pdg 11"]);
    });

    it("supports illustrator-escaped values matching human-readable names", () => {
        expect(buildMatchVariants("PDG_x20_11")).toContain("pdg 11");
    });
});
