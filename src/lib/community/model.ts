import type { LiveTour } from "../live/types.ts";
export const CONTENT_STATUSES = [
  "community_published_unverified",
  "historically_verified",
  "live_editorial_approved",
] as const;
export type PublicProfile = {
  alias: string;
  bio: string;
  city: string;
  avatar: "compass" | "book" | "temple";
};
export type CommunityItem = {
  id: string;
  kind: "discovery" | "route";
  title: string;
  text: string;
  period: string;
  category: string;
  audience: string;
  poiIds: string[];
  sources: string[];
  photos: string[];
  photoConsent: boolean;
  author: PublicProfile;
  owned: boolean;
  visibility: "draft" | "local_published";
  contentStatus: "community_published_unverified";
  createdAt: number;
  updatedAt: number;
};
export type SocialState = {
  version: 1;
  profile: PublicProfile;
  items: CommunityItem[];
  saved: string[];
  reports: { id: string; itemId: string; reason: string; createdAt: number }[];
  hidden: string[];
};
export const emptySocial = (): SocialState => ({
  version: 1,
  profile: { alias: "Explorateur", bio: "", city: "", avatar: "compass" },
  items: [],
  saved: [],
  reports: [],
  hidden: [],
});
const text = (value: unknown, max: number, required = false): string => {
  if (
    typeof value !== "string" ||
    value.length > max ||
    (required && !value.trim())
  )
    throw Error("Texte absent ou trop long.");
  return value.trim();
};
export function profile(value: any): PublicProfile {
  return {
    alias: text(value.alias, 32, true),
    bio: text(value.bio, 280),
    city: text(value.city, 60),
    avatar: ["compass", "book", "temple"].includes(value.avatar)
      ? value.avatar
      : "compass",
  };
}
export function sourceUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 500) return false;
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      u.hostname.includes(".") &&
      !/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(u.hostname)
    );
  } catch {
    return false;
  }
}
/** Build a whitelist. Never serialize device location, journal, account IDs or audio approval. */
export function contentFields(value: any) {
  if (
    !["discovery", "route"].includes(value.kind) ||
    !Array.isArray(value.poiIds) ||
    value.poiIds.length > 20 ||
    !value.poiIds.every(
      (s: any) => typeof s === "string" && /^[\w-]{1,100}$/.test(s),
    ) ||
    new Set(value.poiIds).size !== value.poiIds.length
  )
    throw Error(
      "Étapes invalides : choisissez des lieux distincts du catalogue.",
    );
  if (
    !Array.isArray(value.sources) ||
    value.sources.length > 5 ||
    !value.sources.every(sourceUrl)
  )
    throw Error("Sources : cinq liens HTTPS maximum.");
  return {
    kind: value.kind as CommunityItem["kind"],
    title: text(value.title, 100, true),
    text: text(value.text, 2000),
    period: text(value.period, 80),
    category: text(value.category, 60),
    audience: text(value.audience, 80),
    poiIds: [...value.poiIds] as string[],
    sources: [...value.sources] as string[],
  };
}
export function assertItem(
  item: CommunityItem,
  knownPoiIds: ReadonlySet<string>,
) {
  contentFields(item);
  profile(item.author);
  if (
    !/^social-[\w-]{1,100}$/.test(item.id) ||
    item.contentStatus !== "community_published_unverified" ||
    !["draft", "local_published"].includes(item.visibility) ||
    typeof item.owned !== "boolean" ||
    !Number.isFinite(item.createdAt) ||
    !Number.isFinite(item.updatedAt)
  )
    throw Error("Publication invalide.");
  if (!item.poiIds.every((id) => knownPoiIds.has(id)))
    throw Error("Un lieu n’existe plus dans ce catalogue.");
  if (
    item.visibility === "local_published" &&
    (item.kind === "route" ? item.poiIds.length < 2 : item.poiIds.length !== 1)
  )
    throw Error(
      "Choisissez au moins deux lieux pour un parcours, un lieu pour une découverte.",
    );
  if (
    !Array.isArray(item.photos) ||
    item.photos.length > 3 ||
    item.photos.some(
      (u) =>
        typeof u !== "string" ||
        !/^file:\/\/.*\/vestige-contribution-photos\/[\w.-]+$/.test(u),
    ) ||
    (item.photos.length > 0 && (!item.photoConsent || !item.owned))
  )
    throw Error("Photos privées invalides ou consentement manquant.");
}
export function parseSocial(
  raw: string | null,
  known: ReadonlySet<string>,
): SocialState {
  if (!raw) return emptySocial();
  const s = JSON.parse(raw);
  if (
    s.version !== 1 ||
    !Array.isArray(s.items) ||
    s.items.length > 100 ||
    !Array.isArray(s.saved) ||
    !Array.isArray(s.hidden) ||
    !Array.isArray(s.reports) ||
    s.reports.length > 100
  )
    throw Error(
      "Stockage communautaire illisible. Aucune donnée n’a été remplacée.",
    );
  s.items.forEach((item: CommunityItem) => assertItem(item, known));
  if (
    new Set(s.items.map((i: CommunityItem) => i.id)).size !== s.items.length ||
    ![...s.saved, ...s.hidden].every((id) => typeof id === "string")
  )
    throw Error("Index communautaire invalide.");
  s.reports.forEach((r: any) => {
    text(r.reason, 300, true);
    if (!Number.isFinite(r.createdAt) || typeof r.itemId !== "string")
      throw Error("Signalement invalide.");
  });
  return { ...s, profile: profile(s.profile) };
}
export function shareCode(item: CommunityItem) {
  if (item.visibility !== "local_published")
    throw Error("Ajoutez d’abord cette création au fil local.");
  const payload = {
    version: 1,
    author: profile(item.author),
    content: contentFields(item),
  };
  const code = "VESTIGE1:" + encodeURIComponent(JSON.stringify(payload));
  if (code.length > 16000)
    throw Error("Contenu trop long pour le partage. Réduisez le texte.");
  return code;
}
export function importCode(
  raw: string,
  known: ReadonlySet<string>,
  id: string,
  now: number,
): CommunityItem {
  const code = raw.trim();
  if (code.length > 16000 || !code.startsWith("VESTIGE1:"))
    throw Error("Code Vestige invalide ou trop long.");
  const data = JSON.parse(decodeURIComponent(code.slice(9)));
  if (data.version !== 1)
    throw Error("Version de partage non prise en charge.");
  const item: CommunityItem = {
    ...contentFields(data.content),
    id,
    owned: false,
    author: profile(data.author),
    visibility: "local_published",
    contentStatus: "community_published_unverified",
    photos: [],
    photoConsent: false,
    createdAt: now,
    updatedAt: now,
  };
  assertItem(item, known);
  return item;
}
export type RoutePoi = {
  id: string;
  latitude: number;
  longitude: number;
  source: string;
};
export function communityTours(
  items: CommunityItem[],
  pois: RoutePoi[],
): LiveTour[] {
  return items
    .filter(
      (i) =>
        i.kind === "route" &&
        i.contentStatus === "community_published_unverified" &&
        i.visibility === "local_published" &&
        i.poiIds.length >= 2 &&
        i.poiIds.every((id) => pois.some((p) => p.id === id)),
    )
    .map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: "Parcours communautaire · non vérifié",
      presenceRequired: true,
      community: {
        author: item.author.alias,
        text: item.text,
        sources: item.sources,
        status: "community_published_unverified" as const,
      },
      stops: item.poiIds.map((id) => {
        const p = pois.find((poi) => poi.id === id)!;
        return {
          poiId: id,
          storyId: "",
          approach: { latitude: p.latitude, longitude: p.longitude },
          access:
            "Étape choisie par un utilisateur. Restez sur les voies publiques ; accès et horaires à vérifier sur place.",
          sourceUrl: p.source,
          checkedAt: "",
        };
      }),
    }));
}
