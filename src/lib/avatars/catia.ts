export type CatiaReadiness = {
  sourcePreserved: boolean;
  optimizedTriangles: number;
  hasSkeleton: boolean;
  hasWeights: boolean;
  actualClips: string[];
  deformationReviewed: boolean;
  artApproved: boolean;
  iosDeviceTested: boolean;
  androidDeviceTested: boolean;
};
/** Readiness only. Catia is deliberately absent from the activatable avatar registry. */
export function catiaBlockers(state: CatiaReadiness) {
  const reasons: string[] = [];
  if (!state.sourcePreserved)
    reasons.push("Intégrité de la source non vérifiée");
  if (
    !Number.isFinite(state.optimizedTriangles) ||
    state.optimizedTriangles < 15000 ||
    state.optimizedTriangles > 30000
  )
    reasons.push("Budget géométrique à vérifier");
  if (!state.hasSkeleton || !state.hasWeights)
    reasons.push("Squelette et pondérations incomplets");
  if (
    !["idle", "walk", "run"].every((clip) => state.actualClips.includes(clip))
  )
    reasons.push("Animations Idle, Walk et Run incomplètes");
  if (!state.deformationReviewed)
    reasons.push("Déformations et contacts au sol à valider");
  if (!state.artApproved) reasons.push("Rendu artistique à valider");
  if (!state.iosDeviceTested) reasons.push("Essais iPhone à effectuer");
  if (!state.androidDeviceTested) reasons.push("Essais Android à effectuer");
  return reasons;
}
