export type LiveMode = "manual" | "automatic";
export type StorySource = {
  title: string;
  url: string;
  publisher: string;
  author: string | null;
  publishedAt: string | null;
  consultedAt: string;
};
export type LiveStory = {
  id: string;
  poiId: string;
  title: string;
  language: "fr";
  version: number;
  script: string;
  contentHash: string;
  origin: "vestige_editorial" | "community" | "osm";
  status:
    | "draft"
    | "historically_verified"
    | "live_editorial_approved"
    | "pending"
    | "rejected";
  sources: StorySource[];
  approval: null | {
    version: number;
    contentHash: string;
    approvedText: string;
    approvedBy: string;
    approvedAt: string;
    humanReview: true;
  };
  audioId: string | null;
};
export type LiveAsset = {
  id: string;
  storyId: string;
  scriptVersion: number;
  contentHash: string;
  sha256: string;
  rightsHolder: string;
  license: string;
  module: number;
};
export type LiveStop = {
  poiId: string;
  storyId: string;
  approach: { latitude: number; longitude: number };
  access: string;
  sourceUrl: string;
  checkedAt: string;
};
export type LiveTour = {
  id: string;
  title: string;
  subtitle: string;
  stops: LiveStop[];
};
export type VisitSession = {
  version: 1;
  tourId: string;
  startedAt: number;
  index: number;
  outcomes: Record<string, "consulted" | "skipped" | "listened">;
  autoTriggered: string[];
  paused: boolean;
  endedAt: number | null;
};
