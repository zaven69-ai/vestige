import React, { useEffect, useState } from "react";
import { Image, View } from "react-native";
import { Asset } from "expo-asset";
import { catiaMapSpec, type CatiaPhase } from "../../lib/avatars/catiaMap";
import type { AvatarFacing } from "../../lib/avatar";
import { catiaSprites } from "./avatar/catiaSprites";
import { useCatiaFrame } from "./avatar/useCatiaFrame";
const loaded = new Map<string, Promise<unknown>>();
export function CatiaSprite({
  facing,
  phase,
  active,
  reducedMotion,
  onLoad,
}: {
  facing: AvatarFacing;
  phase: CatiaPhase;
  active: boolean;
  reducedMotion: boolean;
  onLoad?: () => void;
}) {
  const [ready, setReady] = useState<string | null>(null);
  const angle = facing === "unknown" ? "s" : facing,
    key = `${angle}:${phase}`;
  useEffect(() => {
    let alive = true;
    let promise = loaded.get(key);
    if (!promise) {
      promise = Asset.loadAsync(catiaSprites[angle][phase]).catch((e) => {
        loaded.delete(key);
        throw e;
      });
      loaded.set(key, promise);
    }
    void promise
      .then(() => {
        if (alive) setReady(key);
      })
      .catch((e) => console.warn("[Catia sprites]", e));
    return () => {
      alive = false;
    };
  }, [angle, key, phase]);
  const frame = useCatiaFrame(phase, active && ready === key, reducedMotion);
  return (
    <View
      pointerEvents="none"
      collapsable={false}
      style={{ width: catiaMapSpec.width, height: catiaMapSpec.height }}
    >
      <View
        style={{
          position: "absolute",
          width: 58,
          height: 18,
          borderRadius: 29,
          borderWidth: 1,
          borderColor: "#32BCC099",
          backgroundColor: "#32BCC01A",
          bottom: 5,
          left: 19,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 36,
          height: 9,
          borderRadius: 18,
          backgroundColor: "#0006",
          bottom: 10,
          left: 30,
        }}
      />
      <Image
        source={catiaSprites[angle][phase][frame]}
        resizeMode="contain"
        fadeDuration={0}
        onLoad={onLoad}
        onError={(e) => console.warn("[Catia PNG]", e.nativeEvent.error)}
        style={{ width: catiaMapSpec.width, height: catiaMapSpec.height }}
      />
    </View>
  );
}
