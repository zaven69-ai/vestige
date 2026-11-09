import type { AvatarFacing, AvatarPhase } from "../avatar";
export type AvatarPack = {
  sourceKind: "rigged-glb-render";
  sourceSha256: string;
  artApprovedBy: string;
  portrait: number;
  sprites: Record<AvatarFacing, Record<AvatarPhase, number[]>>;
};
