export type AudioPlayback = {
  storyId: string;
  kind: "approved" | "private-demo" | "georges-demo";
  token: number;
  intent: "play" | "pause";
  status: "loading" | "playing" | "paused";
  position: number;
  duration: number;
  ended: boolean;
};
export function admitPrivateDemo(
  development: boolean,
  manual: boolean,
  foreground: boolean,
  visible: boolean,
) {
  return development && manual && foreground && visible;
}
export function audioProgress(
  current: AudioPlayback,
  position: number,
  duration: number,
): AudioPlayback {
  if (
    !Number.isFinite(position) ||
    !Number.isFinite(duration) ||
    duration < 0 ||
    position < 0 ||
    current.ended
  )
    return current;
  const total = duration > 0 ? duration : current.duration;
  const next = total > 0 ? Math.min(position, total) : position;
  return Math.abs(current.position - next) < 0.2 && current.duration === total
    ? current
    : { ...current, position: next, duration: total };
}
export function finishedAudio(current: AudioPlayback): AudioPlayback {
  return {
    ...current,
    intent: "pause",
    status: "paused",
    ended: true,
    position: current.duration,
  };
}
export function audioTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "--:--";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}
