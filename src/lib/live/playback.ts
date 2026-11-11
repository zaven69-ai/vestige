import type { LiveMode, LiveStory, LiveAsset } from "./types.ts";
import { playableAsset } from "./eligibility.ts";
export function playbackAdmission(input: {
  active: boolean;
  paused: boolean;
  foreground: boolean;
  visible: boolean;
  mode: LiveMode;
  automatic: boolean;
  busy: boolean;
  story: LiveStory;
  assets: Record<string, LiveAsset>;
}): "allowed" | "inactive" | "manual-mode" | "busy" | "unavailable" {
  if (!input.active || input.paused || !input.foreground || !input.visible)
    return "inactive";
  if (input.automatic && input.mode !== "automatic") return "manual-mode";
  if (input.busy) return "busy";
  return playableAsset(input.story, input.assets) ? "allowed" : "unavailable";
}
export function currentPlayback(
  current: { token: number } | null,
  token: number,
) {
  return current !== null && current.token === token;
}
