export type LegacySvgIdMode = "illustrator" | "inkscape" | "legacy";

export function normalizeKey(value: string | null | undefined): string {
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

export function toLegacySvgId(value: string, mode: LegacySvgIdMode): string {
    let returnId = value;
    if (mode === "illustrator") {
        returnId = returnId.replace(/[^A-Za-z0-9-:.]/g, (match) => {
            if (match === " ") {
                return "_";
            }

            return `_x${match.charCodeAt(0).toString(16).toUpperCase()}_`;
        });

        if (/^\d/.test(returnId)) {
            returnId = `_x${returnId.charCodeAt(0).toString(16).toUpperCase()}_${returnId.slice(1)}`;
        }
    } else if (mode === "inkscape") {
        returnId = returnId.replace(/[^A-Za-z0-9-:.]/g, "_");
    } else {
        returnId = returnId.replace(/([^A-Za-z0-9[\]{}_.:-])\s?/g, "_");
        if (/^\d/.test(returnId)) {
            returnId = `_${returnId}`;
        }
    }

    return returnId;
}

export function buildMatchVariants(value: string | null | undefined): string[] {
    const variants = new Set<string>();
    const raw = value == null ? "" : String(value);
    if (!raw.trim()) {
        return [];
    }

    const candidates = [
        raw,
        toLegacySvgId(raw, "illustrator"),
        toLegacySvgId(raw, "inkscape"),
        toLegacySvgId(raw, "legacy")
    ];

    for (const candidate of candidates) {
        const normalized = normalizeKey(candidate);
        if (normalized) {
            variants.add(normalized);
        }
    }

    return Array.from(variants);
}
