import { useEffect, useState } from "react";
import { Asset } from "expo-asset";
import { avatarSprites } from "./sprites";
import type { AvatarFacing } from "../../../lib/avatar";
const cached = new Map<string, Promise<void>>();
function warm(
  facing: AvatarFacing,
  sprites: typeof avatarSprites,
  key: string,
) {
  let pending = cached.get(key);
  if (!pending) {
    const modules = [
      ...sprites[facing].idle,
      ...sprites[facing].walk,
    ] as number[];
    pending = Asset.loadAsync(modules)
      .then(() => {})
      .catch((error) => {
        cached.delete(key);
        throw error;
      });
    cached.set(key, pending);
  }
  return pending;
}
/** Preload just the current direction. Static fallback on failure; never block the map. */
export function useAvatarAssets(
  facing: AvatarFacing,
  enabled: boolean,
  sprites: typeof avatarSprites,
  packId: string,
) {
  const key = `${packId}:${facing}`;
  const [ready, setReady] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void warm(facing, sprites, key)
      .then(() => {
        if (!cancelled) setReady(key);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [facing, enabled, sprites, key]);
  return enabled && ready === key;
}
