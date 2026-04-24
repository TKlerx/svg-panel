export interface PanOffset {
    x: number;
    y: number;
}

export interface TransformStyle {
    transform: string;
    transformOrigin: string;
}

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4;
export const DEFAULT_ZOOM = 1;

export function createZeroPan(): PanOffset {
    return { x: 0, y: 0 };
}

export function clampZoom(value: number): number {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export function nextZoom(currentZoom: number, delta: number): number {
    return clampZoom(currentZoom + delta);
}

export function shouldResetPanForZoom(zoomLevel: number): boolean {
    return zoomLevel === DEFAULT_ZOOM;
}

export function buildTransformStyle(zoomLevel: number, panOffset: PanOffset): TransformStyle {
    const hasOffset = panOffset.x !== 0 || panOffset.y !== 0;
    const hasZoom = zoomLevel !== DEFAULT_ZOOM;

    if (!hasOffset && !hasZoom) {
        return { transform: "", transformOrigin: "" };
    }

    return {
        transformOrigin: "center center",
        transform: hasOffset
            ? `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`
            : `scale(${zoomLevel})`
    };
}
