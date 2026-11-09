import React from "react";
import { Image } from "react-native";
import { avatarPortrait, avatarSprites } from "./avatar/sprites";
/** Same original character in profile/HUD. Future renderers can replace this presentation API. */
export function ExplorerAvatar({
  size = 54,
  presentation = "portrait",
}: {
  size?: number;
  presentation?: "portrait" | "full";
}) {
  return (
    <Image
      accessible={false}
      pointerEvents="none"
      source={
        presentation === "portrait"
          ? avatarPortrait
          : avatarSprites.unknown.idle[0]
      }
      resizeMode="contain"
      fadeDuration={0}
      style={{ width: size, height: size }}
    />
  );
}
