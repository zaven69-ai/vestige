import { poiCategories, type PoiCategory } from "../poi.ts";
export const contributionKinds = [
  "place",
  "photo",
  "correction",
  "anecdote",
  "date",
  "report",
] as const;
export type ContributionKind = (typeof contributionKinds)[number];
export const kindLabels: Record<ContributionKind, string> = {
  place: "Nouveau lieu",
  photo: "Photographie",
  correction: "Correction",
  anecdote: "Anecdote sourcée",
  date: "Repère chronologique",
  report: "Signalement",
};
export type Draft = {
  id: string;
  status: "draft";
  kind: ContributionKind;
  poiId?: string;
  name: string;
  category: PoiCategory;
  latitude: string;
  longitude: string;
  content: string;
  historicalDate?: string;
  sources: string;
  alias: string;
  photoUri?: string;
  photoBytes?: number;
  photoMime?: string;
  attribution: string;
  license: string;
  photoRights: boolean;
  privacyConsent: boolean;
  updatedAt: string;
};
export type CommunityLocal = {
  version: 1;
  drafts: Draft[];
  favorites: string[];
};
export const emptyCommunity = (): CommunityLocal => ({
  version: 1,
  drafts: [],
  favorites: [],
});
export const coordinate = (value: string) =>
  value.trim() ? Number(value.trim().replace(",", ".")) : NaN;
export const sourceList = (value: string) =>
  value
    .split(/\r?\n/)
    .map((v) => v.trim())
    .filter(Boolean);
export function httpsUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !!url.hostname.includes(".") &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
export function validateDraft(draft: Draft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!draft.name.trim()) errors.name = "Indiquez le nom du lieu.";
  if (!poiCategories.includes(draft.category))
    errors.category = "Choisissez une catégorie.";
  if (!contributionKinds.includes(draft.kind))
    errors.kind = "Choisissez le type de contribution.";
  const lat = coordinate(draft.latitude),
    lon = coordinate(draft.longitude);
  if (
    !Number.isFinite(lat) ||
    Math.abs(lat) > 90 ||
    !Number.isFinite(lon) ||
    Math.abs(lon) > 180
  )
    errors.position =
      "Choisissez un point valide sur la carte ou saisissez ses coordonnées.";
  if (draft.kind !== "photo" && !draft.content.trim())
    errors.content =
      draft.kind === "report"
        ? "Décrivez le problème signalé."
        : "Décrivez votre proposition.";
  if (draft.kind === "date" && !draft.historicalDate?.trim())
    errors.date =
      "Indiquez la date ou période telle que documentée par votre source.";
  const sources = sourceList(draft.sources);
  if (
    draft.kind !== "report" &&
    (draft.kind !== "photo" || !!draft.content.trim()) &&
    sources.length === 0
  )
    errors.sources =
      "Ajoutez au moins une source pour les informations historiques.";
  if (sources.length > 5 || sources.some((s) => !httpsUrl(s)))
    errors.sources = "Ajoutez au maximum 5 liens HTTPS valides, un par ligne.";
  if (draft.kind === "photo" && !draft.photoUri)
    errors.photo = "Ajoutez une photo.";
  if (
    draft.photoUri &&
    (!draft.photoRights || !draft.attribution.trim() || !draft.license.trim())
  )
    errors.rights =
      "Précisez l’auteur, la licence et confirmez vos droits sur la photo.";
  if (
    draft.photoUri &&
    (!draft.photoBytes ||
      draft.photoBytes > 5 * 1024 * 1024 ||
      !["image/jpeg", "image/png", "image/webp"].includes(
        draft.photoMime ?? "",
      ))
  )
    errors.photo = "Photo JPEG, PNG ou WebP de 5 Mo maximum.";
  if (!draft.privacyConsent)
    errors.privacy =
      "Confirmez avoir vérifié les données personnelles de votre proposition.";
  return errors;
}
export function newDraft(
  point?: { latitude: number; longitude: number },
  poi?: {
    id: string;
    name: string;
    category: PoiCategory;
    latitude: number;
    longitude: number;
  },
): Draft {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 10),
    status: "draft",
    kind: poi ? "correction" : "place",
    poiId: poi?.id,
    name: poi?.name ?? "",
    category: poi?.category ?? "other",
    latitude: poi ? String(poi.latitude) : point ? String(point.latitude) : "",
    longitude: poi
      ? String(poi.longitude)
      : point
        ? String(point.longitude)
        : "",
    content: "",
    historicalDate: "",
    sources: "",
    alias: "",
    attribution: "",
    license: "",
    photoRights: false,
    privacyConsent: false,
    updatedAt: new Date().toISOString(),
  };
}
export function assertDraft(value: unknown): asserts value is Draft {
  if (!value || typeof value !== "object")
    throw Error("Brouillon local invalide.");
  const d = value as Draft;
  if (
    d.status !== "draft" ||
    !contributionKinds.includes(d.kind) ||
    !poiCategories.includes(d.category) ||
    typeof d.id !== "string" ||
    !d.id ||
    d.id.length > 100 ||
    !Number.isFinite(Date.parse(d.updatedAt))
  )
    throw Error("Brouillon local invalide.");
  const limits = {
    name: 200,
    latitude: 30,
    longitude: 30,
    content: 4000,
    sources: 2000,
    alias: 40,
    attribution: 300,
    license: 200,
  };
  for (const [field, limit] of Object.entries(limits)) {
    const value = d[field as keyof typeof limits];
    if (typeof value !== "string" || value.length > limit)
      throw Error("Brouillon trop volumineux ou invalide.");
  }
  if (
    typeof d.photoRights !== "boolean" ||
    typeof d.privacyConsent !== "boolean" ||
    (d.poiId !== undefined &&
      (typeof d.poiId !== "string" || d.poiId.length > 200))
  )
    throw Error("Brouillon local invalide.");
  if (
    d.historicalDate !== undefined &&
    (typeof d.historicalDate !== "string" || d.historicalDate.length > 100)
  )
    throw Error("Date proposée invalide.");
  if (
    d.photoUri !== undefined &&
    (typeof d.photoUri !== "string" ||
      !d.photoUri.startsWith("file://") ||
      d.photoUri.length > 4096)
  )
    throw Error("Photo locale invalide.");
}
export function parseCommunity(raw: string | null): CommunityLocal {
  if (raw === null) return emptyCommunity();
  const state = JSON.parse(raw) as CommunityLocal;
  if (
    !state ||
    state.version !== 1 ||
    !Array.isArray(state.drafts) ||
    state.drafts.length > 50 ||
    !Array.isArray(state.favorites) ||
    state.favorites.length > 2000 ||
    state.favorites.some((v) => typeof v !== "string" || v.length > 200)
  )
    throw Error("Données locales illisibles. Elles ont été conservées.");
  state.drafts.forEach(assertDraft);
  if (new Set(state.drafts.map((d) => d.id)).size !== state.drafts.length)
    throw Error("Identifiants de brouillon en double. Données conservées.");
  return state;
}
