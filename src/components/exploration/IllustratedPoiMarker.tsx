import React, { memo } from "react";
import { Marker } from "react-native-maps";
import type { Monument } from "../../data/monuments";
import type { MonumentState } from "../../lib/markerState";
import {
  categoryLabels,
  poiCategory,
  poiStatus,
  statusLabels,
} from "../../lib/poi";
import { POI_MARKER_SIZE } from "../../lib/poiMapRendering";
import { nativePoiImage } from "../poi/nativeMapAssets";
/** Active map renderer: a local, already composed PNG sent to the native API.
 * No custom children to snapshot, no font or image-load race in Marker views.
 */
export const IllustratedPoiMarker = memo(function IllustratedPoiMarker({
  monument,
  selected,
  state,
  onSelect,
}: {
  monument: Monument;
  selected: boolean;
  state: MonumentState;
  onSelect: (monument: Monument) => void;
  reducedMotion: boolean;
}) {
  const category = poiCategory(monument),
    status = poiStatus(monument);
  return (
    <Marker
      identifier={`illustrated-${monument.id}`}
      coordinate={{
        latitude: monument.latitude,
        longitude: monument.longitude,
      }}
      image={nativePoiImage(category, status, state, selected)}
      style={POI_MARKER_SIZE}
      anchor={{ x: 0.5, y: 0.9 }}
      centerOffset={{ x: 0, y: -27 }}
      tracksViewChanges={false}
      stopPropagation
      zIndex={
        selected
          ? 30
          : state === "nearby"
            ? 20
            : state === "discovered"
              ? 5
              : 10
      }
      accessibilityLabel={`${monument.name}, ${categoryLabels[category]}, ${statusLabels[status]}, ${state === "discovered" ? "déjà découvert" : state === "nearby" ? "à portée" : "non découvert"}`}
      onPress={(event) => {
        event.stopPropagation();
        onSelect(monument);
      }}
    />
  );
});
