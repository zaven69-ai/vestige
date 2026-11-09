import { useEffect, useState } from "react";
import { Asset } from "expo-asset";
import { avatarSprites } from "./sprites";
import type { AvatarFacing } from "../../../lib/avatar";
const cached = new Map<AvatarFacing, Promise<void>>();
function warm(facing: AvatarFacing) {
  let pending = cached.get(facing);
  if (!pending) {
    const modules = [
      ...avatarSprites[facing].idle,
      ...avatarSprites[facing].walk,
    ] as number[];
    pending = Asset.loadAsync(modules)
      .then(() => {})
      .catch((error) => {
        cached.delete(facing);
        throw error;
      });
    cached.set(facing, pending);
  }
  return pending;
}
/** Preload just the current direction. Static fallback on failure; never block the map. */
export function useAvatarAssets(facing: AvatarFacing, enabled: boolean) {
  const [ready, setReady] = useState<AvatarFacing | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void warm(facing)
      .then(() => {
        if (!cancelled) setReady(facing);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [facing, enabled]);
  return enabled && ready === facing;
}
