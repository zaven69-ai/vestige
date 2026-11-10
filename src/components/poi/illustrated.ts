import type { ImageSourcePropType } from "react-native";
import type { PoiCategory, PoiStatus } from "../../lib/poi";
export const illustratedPoi: Record<PoiCategory, ImageSourcePropType> = {
  temple: require("../../../assets/poi/illustrated/temple.png"),
  castle: require("../../../assets/poi/illustrated/castle.png"),
  religious: require("../../../assets/poi/illustrated/religious.png"),
  museum: require("../../../assets/poi/illustrated/museum.png"),
  industrial: require("../../../assets/poi/illustrated/industrial.png"),
  nature: require("../../../assets/poi/illustrated/nature.png"),
  other: require("../../../assets/poi/illustrated/other.png"),
};
export const reviewSeals: Record<PoiStatus, ImageSourcePropType> = {
  editorial_verified: require("../../../assets/poi/review/editorial_verified.png"),
  editorial_unreviewed: require("../../../assets/poi/review/editorial_unreviewed.png"),
  imported_unreviewed: require("../../../assets/poi/review/imported_unreviewed.png"),
  community_unreviewed: require("../../../assets/poi/review/community_unreviewed.png"),
  community_pending: require("../../../assets/poi/review/community_pending.png"),
  community_verified: require("../../../assets/poi/review/community_verified.png"),
};
export const discoverySeals = {
  none: require("../../../assets/poi/discovery/undiscovered.png"),
  discovered: require("../../../assets/poi/discovery/discovered.png"),
  completed: require("../../../assets/poi/discovery/completed.png"),
};
