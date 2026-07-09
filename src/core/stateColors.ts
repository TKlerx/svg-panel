export type StateStyle = "gradient" | "rules";

export interface StateColorRule {
    value: number;
    color: string | null;
}

export interface GradientStop {
    color: string;
    value: number;
}

export interface GradientSettings {
    diverging: boolean;
    min: GradientStop;
    center: GradientStop;
    max: GradientStop;
}

export interface StateColorSettings {
    show: boolean;
    comparison: string;
    style?: StateStyle;
    gradient?: GradientSettings;
}

export function resolveStateColor(
    stateValue: number | undefined,
    resolvedStates: StateColorRule[],
    stateSettings: StateColorSettings
): string | undefined {
    if (!stateSettings.show || stateValue == null || resolvedStates.length === 0) {
        return undefined;
    }

    const comparison = stateSettings.comparison;

    if (comparison === "=") {
        const match = resolvedStates.find((state) => state.color && stateValue === state.value);
        return match?.color ?? undefined;
    }

    if (comparison === ">=" || comparison === ">") {
        const descending = [...resolvedStates].sort((a, b) => b.value - a.value);
        const match = descending.find((state) => state.color && (comparison === ">" ? stateValue > state.value : stateValue >= state.value));
        return match?.color ?? undefined;
    }

    const ascending = [...resolvedStates].sort((a, b) => a.value - b.value);
    const match = ascending.find((state) => {
        if (!state.color) return false;
        return comparison === "<" ? stateValue < state.value : stateValue <= state.value;
    });
    if (match?.color) {
        return match.color;
    }

    // Legacy behavior: for < and <= rules, the final configured state is the
    // catch-all bucket for values above the highest threshold.
    return [...ascending].reverse().find((state) => state.color)?.color ?? undefined;
}

export function resolveGradientColor(
    stateValue: number | undefined,
    gradient: GradientSettings
): string | undefined {
    if (stateValue == null) {
        return undefined;
    }

    if (gradient.diverging) {
        if (stateValue <= gradient.center.value) {
            const span = gradient.center.value - gradient.min.value;
            const t = span <= 0 ? 1 : clamp((stateValue - gradient.min.value) / span);
            return mixColors(gradient.min.color, gradient.center.color, t);
        }

        const upperSpan = gradient.max.value - gradient.center.value;
        const tUpper = upperSpan <= 0 ? 0 : clamp((stateValue - gradient.center.value) / upperSpan);
        return mixColors(gradient.center.color, gradient.max.color, tUpper);
    }

    const span = gradient.max.value - gradient.min.value;
    const t = span <= 0 ? 0 : clamp((stateValue - gradient.min.value) / span);
    return mixColors(gradient.min.color, gradient.max.color, t);
}

export function resolveDataPointColor(
    stateValue: number | undefined,
    resolvedStates: StateColorRule[],
    stateSettings: StateColorSettings,
    paletteColor: string | undefined,
    defaultFill: string
): string {
    if (stateSettings.show && stateSettings.style === "gradient" && stateSettings.gradient) {
        const gradientColor = resolveGradientColor(stateValue, stateSettings.gradient);
        if (gradientColor) {
            return gradientColor;
        }
    } else {
        const stateColor = resolveStateColor(stateValue, resolvedStates, stateSettings);
        if (stateColor) {
            return stateColor;
        }
    }

    return paletteColor ?? defaultFill;
}

function clamp(value: number): number {
    return Math.min(1, Math.max(0, value));
}

export function mixColors(fromColor: string, toColor: string, t: number): string {
    const from = parseHexColor(fromColor);
    const to = parseHexColor(toColor);
    if (!from || !to) {
        return t < 0.5 ? fromColor : toColor;
    }

    const r = Math.round(from[0] + (to[0] - from[0]) * t);
    const g = Math.round(from[1] + (to[1] - from[1]) * t);
    const b = Math.round(from[2] + (to[2] - from[2]) * t);
    return toHexColor(r, g, b);
}

function parseHexColor(color: string): [number, number, number] | null {
    const value = color.trim().replace(/^#/, "");
    if (/^[0-9a-f]{6}$/i.test(value)) {
        const numeric = parseInt(value, 16);
        return [(numeric >> 16) & 0xff, (numeric >> 8) & 0xff, numeric & 0xff];
    }

    if (/^[0-9a-f]{3}$/i.test(value)) {
        return [
            parseInt(value[0] + value[0], 16),
            parseInt(value[1] + value[1], 16),
            parseInt(value[2] + value[2], 16)
        ];
    }

    return null;
}

function toHexColor(r: number, g: number, b: number): string {
    const toPart = (channel: number): string => Math.min(255, Math.max(0, channel)).toString(16).padStart(2, "0");
    return `#${toPart(r)}${toPart(g)}${toPart(b)}`;
}
