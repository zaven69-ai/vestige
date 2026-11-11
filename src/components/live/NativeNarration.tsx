import { useEffect, useRef } from "react";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from "expo-audio";
import type { AudioSource } from "expo-audio";
import type { LiveAsset } from "../../lib/live/types";
/** The shared native player: admission is enforced by LiveProvider before mounting. */
export function NativeNarration({
  token,
  asset,
  source,
  playing,
  volume,
  onEnd,
  onError,
  onInterrupted,
  onStatus,
  onProgress,
}: {
  token: number;
  asset?: LiveAsset;
  source?: AudioSource;
  playing: boolean;
  volume: number;
  onEnd: (token: number) => void;
  onError: (token: number, error: string) => void;
  onInterrupted: (token: number) => void;
  onProgress?: (token: number, position: number, duration: number) => void;
  onStatus: (token: number, status: "loading" | "playing" | "paused") => void;
}) {
  const player = useAudioPlayer(source ?? asset?.module ?? null, {
    downloadFirst: true,
    updateInterval: 250,
  });
  const status = useAudioPlayerStatus(player);
  const ended = useRef(false),
    started = useRef(false);
  useEffect(() => {
    // Expo AudioPlayer is a native SharedObject with a documented writable volume setter.
    // eslint-disable-next-line react-hooks/immutability
    player.volume = volume;
  }, [player, volume]);
  useEffect(() => {
    let cancelled = false;
    if (!playing) {
      player.pause();
      return;
    }
    if (!status.isLoaded) return;
    void setAudioModeAsync({
      playsInSilentMode: false,
      shouldPlayInBackground: false,
      allowsRecording: false,
      interruptionMode: "doNotMix",
    })
      .then(() => {
        if (!cancelled) player.play();
      })
      .catch((e) => onError(token, String(e)));
    return () => {
      cancelled = true;
      player.pause();
    };
  }, [playing, status.isLoaded, player, onError, token]);
  useEffect(() => {
    if (status.isLoaded) return;
    const timer = setTimeout(
      () =>
        onError(
          token,
          "Le fichier audio ne se charge pas. Réessayez manuellement.",
        ),
      15000,
    );
    return () => clearTimeout(timer);
  }, [status.isLoaded, onError, token]);
  useEffect(() => {
    onProgress?.(token, status.currentTime, status.duration);
  }, [token, status.currentTime, status.duration, onProgress]);
  useEffect(() => {
    if (status.error) {
      onError(token, status.error);
      return;
    }
    if (status.didJustFinish && !ended.current) {
      ended.current = true;
      onEnd(token);
      return;
    }
    const wasPlaying = started.current;
    started.current = status.playing;
    onStatus(
      token,
      !status.isLoaded ? "loading" : status.playing ? "playing" : "paused",
    );
    if (
      wasPlaying &&
      !status.playing &&
      !status.isBuffering &&
      !status.didJustFinish &&
      playing
    )
      onInterrupted(token);
  }, [
    token,
    status.error,
    status.didJustFinish,
    status.playing,
    status.isLoaded,
    status.isBuffering,
    playing,
    onEnd,
    onError,
    onStatus,
    onInterrupted,
  ]);
  return null;
}
