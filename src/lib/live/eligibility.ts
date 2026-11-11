import type { LiveAsset, LiveStory } from "./types.ts";
export function editoriallyApproved(story: LiveStory): boolean {
  const a = story.approval;
  return (
    story.origin === "vestige_editorial" &&
    story.status === "live_editorial_approved" &&
    !!a &&
    a.humanReview === true &&
    !!a.approvedBy.trim() &&
    Number.isFinite(Date.parse(a.approvedAt)) &&
    a.version === story.version &&
    a.contentHash === story.contentHash &&
    a.approvedText === story.script &&
    story.sources.length > 0 &&
    story.sources.every((s) => s.url.startsWith("https://"))
  );
}
export function playableAsset(
  story: LiveStory,
  assets: Record<string, LiveAsset>,
): LiveAsset | null {
  if (!editoriallyApproved(story) || !story.audioId) return null;
  const asset = assets[story.audioId];
  return asset &&
    asset.storyId === story.id &&
    asset.scriptVersion === story.version &&
    asset.contentHash === story.contentHash &&
    /^[a-f0-9]{64}$/.test(asset.sha256) &&
    !!asset.rightsHolder.trim() &&
    !!asset.license.trim() &&
    ((Number.isInteger(asset.module) && (asset.module ?? 0) > 0) ||
      (typeof asset.uri === "string" && /^https:\/\/[^\s]+$/.test(asset.uri)))
    ? asset
    : null;
}
export const storyKey = (story: LiveStory) =>
  `${story.id}@${story.version}:${story.contentHash}`;
