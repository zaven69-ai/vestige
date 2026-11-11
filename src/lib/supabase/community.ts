import { monuments } from "../../data/monuments";
import type { CommunityItem } from "../community/model";
import { supabase } from "./client";

export type RemoteRoute = {
  id: string;
  author_id: string;
  title: string;
  description: string;
  category: string | null;
  visibility: "draft" | "published";
  created_at: string;
  updated_at: string;
  profiles: { username: string | null; display_name: string | null } | null;
  community_route_stops: { position: number; poi_id: string }[];
};

const knownPoiIds = new Set(monuments.map((poi) => poi.id));

export function remoteRouteItem(
  route: RemoteRoute,
  userId: string,
): CommunityItem {
  return {
    id: route.id,
    kind: "route",
    title: route.title,
    text: route.description,
    period: "",
    category: route.category ?? "",
    audience: "",
    poiIds: [...route.community_route_stops]
      .sort((a, b) => a.position - b.position)
      .map((stop) => stop.poi_id),
    sources: [],
    photos: [],
    photoConsent: false,
    author: {
      alias:
        route.profiles?.display_name ??
        route.profiles?.username ??
        "Explorateur",
      bio: "",
      city: "",
      avatar: "compass",
    },
    owned: route.author_id === userId,
    visibility: route.visibility === "published" ? "local_published" : "draft",
    contentStatus: "community_published_unverified",
    createdAt: Date.parse(route.created_at),
    updatedAt: Date.parse(route.updated_at),
  };
}

export function validateCommunityItem(item: CommunityItem) {
  const minimum = item.kind === "route" ? 2 : 1;
  if (
    item.title.trim().length < 3 ||
    item.poiIds.length < minimum ||
    !item.poiIds.every((id) => knownPoiIds.has(id))
  ) {
    throw new Error(
      "Ajoutez un titre de trois caractères et sélectionnez des lieux du catalogue.",
    );
  }
  if (item.kind === "discovery" && !item.text.trim()) {
    throw new Error("Ajoutez le récit de la découverte.");
  }
}

export async function getRemoteRoutes() {
  if (!supabase) return [];
  const result = await supabase
    .from("community_routes")
    .select(
      "id, author_id, title, description, category, visibility, created_at, updated_at, profiles(username, display_name), community_route_stops(position, poi_id)",
    )
    .order("updated_at", { ascending: false })
    .returns<RemoteRoute[]>();
  if (result.error) throw result.error;
  return result.data;
}
