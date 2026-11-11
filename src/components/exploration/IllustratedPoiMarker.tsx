import React, {
  memo,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Image, Platform } from "react-native";
import { Marker, type MapMarker } from "react-native-maps";
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
/** iOS uses React Native Image (Fabric) rather than the map's legacy image loader.
 * One precomposed image, with tracking stopped only AFTER its actual load event.
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
  const source = nativePoiImage(category, status, state, selected);
  const marker = useRef<MapMarker>(null);
  const [loadedSource, setLoadedSource] = useState<typeof source | null>(null);
  const [snapshotSource, setSnapshotSource] = useState<typeof source | null>(
    null,
  );
  const ios = Platform.OS === "ios";
  useLayoutEffect(() => {
    setLoadedSource(null);
    setSnapshotSource(null);
  }, [source]);
  useEffect(() => {
    if (!ios || loadedSource !== source) return;
    const timer = setTimeout(() => {
      marker.current?.redraw();
      setSnapshotSource(source);
    }, 150);
    return () => clearTimeout(timer);
  }, [source, loadedSource, ios]);
  return (
    <Marker
      ref={marker}
      tappable
      identifier={`illustrated-${monument.id}`}
      coordinate={{
        latitude: monument.latitude,
        longitude: monument.longitude,
      }}
      image={ios ? undefined : source}
      style={POI_MARKER_SIZE}
      anchor={{ x: 0.5, y: 0.9 }}
      centerOffset={{ x: 0, y: -27 }}
      tracksViewChanges={ios && snapshotSource !== source}
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
    >
      {ios ? (
        <Image
          key={source}
          source={source}
          style={POI_MARKER_SIZE}
          resizeMode="contain"
          fadeDuration={0}
          pointerEvents="none"
          onLoad={() => setLoadedSource(source)}
          onError={(event) =>
            console.warn(
              `[Vestige POI ${monument.id}] Chargement PNG impossible`,
              event.nativeEvent.error,
            )
          }
        />
      ) : null}
    </Marker>
  );
});
