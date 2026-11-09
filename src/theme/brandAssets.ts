import type { ImageSourcePropType } from "react-native";
/** The logo is visible in chat but its original file is not mounted in the workspace.
 * Register require('../../assets/brand/vestige-logo.png') only after the exact original is supplied.
 * Never substitute a generated/redrawn pin or a cropped image from a screenshot.
 */
export const officialLogo: ImageSourcePropType | null = null;
