export interface AreaNode {
    contains(other: AreaNode): boolean;
}

export function hasMatchedDescendant<TArea extends AreaNode>(area: TArea, matchedAreas: Set<TArea>): boolean {
    for (const matchedArea of matchedAreas) {
        if (matchedArea !== area && area.contains(matchedArea)) {
            return true;
        }
    }

    return false;
}

export function isRelatedToMatchedArea<TArea extends AreaNode>(area: TArea, matchedAreas: Set<TArea>): boolean {
    for (const matchedArea of matchedAreas) {
        if (area.contains(matchedArea) || matchedArea.contains(area)) {
            return true;
        }
    }

    return false;
}

export function getUnmatchedAreas<TArea extends AreaNode>(indexedAreas: Set<TArea>, matchedAreas: Set<TArea>): Set<TArea> {
    const unmatchedAreas = new Set<TArea>();

    for (const area of indexedAreas) {
        if (matchedAreas.has(area) || hasMatchedDescendant(area, matchedAreas)) {
            continue;
        }

        unmatchedAreas.add(area);
    }

    return unmatchedAreas;
}
