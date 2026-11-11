import type { MonumentState } from "./markerState";
export const POI_MAP_RENDERER = "V2.3 · zoom progressif";
export const POI_MARKER_SIZE = { width: 64, height: 72 } as const;
export const nativePoiModes = [
  "idle",
  "nearby",
  "discovered",
  "selected",
  "discovered-selected",
] as const;
export type NativePoiMode = (typeof nativePoiModes)[number];
export function nativePoiMode(
  state: MonumentState,
  selected: boolean,
): NativePoiMode {
  if (state === "discovered")
    return selected ? "discovered-selected" : "discovered";
  if (selected) return "selected";
  return state === "nearby" ? "nearby" : "idle";
}
