export type AdventureStep = {
  poiId: string;
  title: string;
  text: string;
  status: "documented" | "unreviewed";
  checkedAt: string;
  sources: string[];
  approach: { latitude: number; longitude: number };
  access: string;
};
export type Adventure = {
  id: string;
  title: string;
  period: string;
  audience: string;
  difficulty: string;
  publication: "published" | "draft";
  origin: "editorial" | "community";
  version: number;
  summary: string;
  badges: string[];
  sources: string[];
  steps: AdventureStep[];
};
export function playableAdventure(a: Adventure) {
  return (
    a.publication === "published" &&
    a.origin === "editorial" &&
    a.steps.length >= 3 &&
    a.steps.length <= 5 &&
    a.steps.every(
      (s) =>
        s.status === "documented" &&
        !!s.text &&
        !!s.checkedAt &&
        s.sources.length > 0 &&
        s.sources.every((u) => u.startsWith("https://")) &&
        Number.isFinite(s.approach.latitude) &&
        Number.isFinite(s.approach.longitude),
    )
  );
}
