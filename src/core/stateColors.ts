export interface StateColorRule {
    value: number;
    color: string | null;
}

export interface StateColorSettings {
    show: boolean;
    comparison: string;
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

export function resolveDataPointColor(
    stateValue: number | undefined,
    resolvedStates: StateColorRule[],
    stateSettings: StateColorSettings,
    paletteColor: string | undefined,
    defaultFill: string
): string {
    const stateColor = resolveStateColor(stateValue, resolvedStates, stateSettings);
    if (stateColor) {
        return stateColor;
    }

    return paletteColor ?? defaultFill;
}
