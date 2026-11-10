/** Trust, provenance and player progress are deliberately independent. */
export const poiCategories = [
  "temple",
  "museum",
  "castle",
  "religious",
  "industrial",
  "nature",
  "other",
] as const;
export type PoiCategory = (typeof poiCategories)[number];
export type PoiOrigin = "editorial" | "community" | "import";
export type PoiReview = "unreviewed" | "pending" | "verified" | "rejected";
export type PoiProvenance = {
  origin: PoiOrigin;
  reviewStatus: PoiReview;
  verifiedAt?: string;
  verifiedBy?: string;
  contributorId?: string;
  provenanceHistory?: {
    origin: PoiOrigin;
    sourceUrl: string;
    recordedAt?: string;
  }[];
};
export const poiStatuses = [
  "editorial_verified",
  "community_unreviewed",
  "community_pending",
  "community_verified",
  "imported_unreviewed",
  "editorial_unreviewed",
] as const;
export type PoiStatus = (typeof poiStatuses)[number];
export const categoryLabels: Record<PoiCategory, string> = {
  temple: "Temple et vestiges",
  museum: "Musée",
  castle: "Château et fortifications",
  religious: "Édifice religieux",
  industrial: "Patrimoine industriel",
  nature: "Nature",
  other: "Autre patrimoine",
};
export const statusLabels: Record<PoiStatus, string> = {
  editorial_verified: "Vérifié par la rédaction",
  community_unreviewed: "Communauté · non contrôlé",
  community_pending: "Communauté · en attente",
  community_verified: "Communauté · vérifié",
  imported_unreviewed: "Importé · non vérifié",
  editorial_unreviewed: "Éditorial · à contrôler",
};
export const statusColors: Record<PoiStatus, string> = {
  editorial_verified: "#E6AD4F",
  community_unreviewed: "#26CAD8",
  community_pending: "#F29D38",
  community_verified: "#7BCB56",
  imported_unreviewed: "#8596A9",
  editorial_unreviewed: "#8596A9",
};
export type PoiRecord = Partial<PoiProvenance> & {
  category?: string;
  poiCategory?: PoiCategory;
  contentQuality?: string;
};
export function poiCategory(poi: PoiRecord): PoiCategory {
  if (poi.poiCategory && poiCategories.includes(poi.poiCategory))
    return poi.poiCategory;
  const categories: Record<string, PoiCategory> = {
    "Vestiges archéologiques": "temple",
    "Monument antique": "temple",
    "Musée et site archéologique": "museum",
    Musée: "museum",
    Château: "castle",
    Fortification: "castle",
    "Édifice religieux": "religious",
    "Patrimoine industriel": "industrial",
    Nature: "nature",
  };
  return categories[poi.category ?? ""] ?? "other";
}
export function poiStatus(poi: PoiRecord): PoiStatus {
  const origin = poi.origin ?? "import";
  // A source URL, OSM ID or description is never proof of review.
  const verified =
    poi.reviewStatus === "verified" &&
    !!poi.verifiedBy?.trim() &&
    !!poi.verifiedAt &&
    Number.isFinite(Date.parse(poi.verifiedAt));
  if (origin === "community")
    return verified
      ? "community_verified"
      : poi.reviewStatus === "pending"
        ? "community_pending"
        : "community_unreviewed";
  if (verified) return "editorial_verified";
  return origin === "editorial"
    ? "editorial_unreviewed"
    : "imported_unreviewed";
}
export function isPublicPoi(poi: PoiRecord) {
  return (
    poi.reviewStatus !== "rejected" &&
    !(poi.origin === "community" && poi.reviewStatus === "pending")
  );
}
export type PoiFilters = {
  categories: PoiCategory[];
  statuses: PoiStatus[];
  visits: "all" | "visited" | "unvisited";
};
export const defaultPoiFilters = (): PoiFilters => ({
  categories: [...poiCategories],
  statuses: [...poiStatuses],
  visits: "all",
});
export function matchesPoi(
  poi: PoiRecord,
  visited: boolean,
  filters: PoiFilters,
) {
  return (
    isPublicPoi(poi) &&
    filters.categories.includes(poiCategory(poi)) &&
    filters.statuses.includes(poiStatus(poi)) &&
    (filters.visits === "all" || (filters.visits === "visited") === visited)
  );
}
