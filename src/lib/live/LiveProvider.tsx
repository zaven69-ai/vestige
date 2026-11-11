import { guidedTours, guidedTour } from "../../data/live/tours";
import {
  LIVE_CHECKPOINTS_KEY,
  emptyCheckpoints,
  restoreTourState,
  checkpoint,
} from "./checkpoints";
import { playbackAdmission, currentPlayback } from "./playback";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGame } from "../store";
import {
  vienneAntique,
  liveStories,
  liveAssets,
} from "../../data/live/vienneAntique";
import { NativeNarration } from "../../components/live/NativeNarration";
import { playableAsset, storyKey } from "./eligibility";
import { emptyFence, tickFence } from "./geofence";
import {
  startVisit,
  advanceVisit,
  restorePreferences,
  LIVE_PREFS_KEY,
  LIVE_SESSION_KEY,
} from "./session";
import type { VisitSession, LiveMode, LiveStory } from "./types";
type Playback = {
  storyId: string;
  token: number;
  intent: "play" | "pause";
  status: "loading" | "playing" | "paused";
};
function useLiveState() {
  const { fix } = useGame();
  const [session, setSession] = useState<VisitSession | null>(null),
    [ready, setReady] = useState(false),
    [storageError, setStorageError] = useState<string | null>(null);
  const tour = guidedTour(session?.tourId ?? vienneAntique.id) ?? vienneAntique;
  const checkpoints = useRef(emptyCheckpoints());
  const [savedVisits, setSavedVisits] = useState(emptyCheckpoints);
  const [mode, setModeValue] = useState<LiveMode>("manual");
  const [prefs, setPrefs] = useState({
    preferredMode: "manual" as LiveMode,
    volume: 1,
  });
  const [foreground, setForeground] = useState(
      AppState.currentState === "active",
    ),
    [visible, setVisibleValue] = useState(false);
  const [playback, setPlayback] = useState<Playback | null>(null),
    [audioError, setAudioError] = useState<string | null>(null);
  const playbackRef = useRef<Playback | null>(null),
    serial = useRef(0),
    fence = useRef(emptyFence()),
    fenceStory = useRef("");
  const queue = useRef(Promise.resolve()),
    mounted = useRef(false),
    writeFailed = useRef(false);
  const updatePlayback = useCallback((next: Playback | null) => {
    playbackRef.current = next;
    setPlayback(next);
  }, []);
  const stopAudio = useCallback(() => updatePlayback(null), [updatePlayback]);
  const pauseAudio = useCallback(() => {
    const p = playbackRef.current;
    if (p) updatePlayback({ ...p, intent: "pause" });
  }, [updatePlayback]);
  useEffect(() => {
    mounted.current = true;
    void Promise.all([
      AsyncStorage.getItem(LIVE_SESSION_KEY),
      AsyncStorage.getItem(LIVE_PREFS_KEY),
      AsyncStorage.getItem(LIVE_CHECKPOINTS_KEY),
    ])
      .then(([s, p, saved]) => {
        const { store, session: restored } = restoreTourState(
          saved,
          s,
          guidedTours,
        );
        checkpoints.current = store;
        const preferences = restorePreferences(p);
        if (mounted.current) {
          setSavedVisits(checkpoints.current);
          setSession(restored);
          setPrefs(preferences);
          setReady(true);
        }
      })
      .catch((e) => {
        if (mounted.current) setStorageError(String(e));
      });
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (!ready || writeFailed.current) return;
    if (session) checkpoints.current = checkpoint(checkpoints.current, session);
    const savedSnapshot = checkpoints.current;
    const savedCheckpoints = JSON.stringify(savedSnapshot);
    queue.current = queue.current
      .then(async () => {
        if (writeFailed.current) return;
        await AsyncStorage.setItem(LIVE_CHECKPOINTS_KEY, savedCheckpoints);
        if (session)
          await AsyncStorage.setItem(LIVE_SESSION_KEY, JSON.stringify(session));
        await AsyncStorage.setItem(
          LIVE_PREFS_KEY,
          JSON.stringify({ version: 1, ...prefs }),
        );
        if (mounted.current) setSavedVisits(savedSnapshot);
      })
      .catch((e) => {
        writeFailed.current = true;
        if (mounted.current)
          setStorageError(
            `Sauvegarde Live impossible : ${String(e)}. Votre journal XP reste intact.`,
          );
      });
  }, [ready, session, prefs]);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      setForeground(state === "active");
      if (state !== "active") {
        fence.current = emptyFence();
        pauseAudio();
      }
    });
    return () => sub.remove();
  }, [pauseAudio]);
  const setVisible = useCallback(
    (value: boolean) => {
      setVisibleValue(value);
      if (!value) {
        fence.current = emptyFence();
        pauseAudio();
      }
    },
    [pauseAudio],
  );
  const setMode = useCallback(
    (value: LiveMode) => {
      pauseAudio();
      fence.current = emptyFence();
      setModeValue(value);
      setPrefs((p) => ({ ...p, preferredMode: value }));
    },
    [pauseAudio],
  );
  const begin = useCallback(
    (tourId: string = vienneAntique.id) => {
      if (!ready || storageError) return;
      stopAudio();
      fence.current = emptyFence();
      setModeValue("manual");
      const chosen = guidedTour(
        typeof tourId === "string" ? tourId : vienneAntique.id,
      );
      if (!chosen) return;
      const prior = checkpoints.current.sessions[chosen.id];
      setSession(
        prior && prior.endedAt === null
          ? { ...prior, paused: false }
          : startVisit(chosen, Date.now()),
      );
      setAudioError(null);
    },
    [ready, storageError, stopAudio],
  );
  const advance = useCallback(
    (outcome: "consulted" | "skipped" | "listened") => {
      if (!ready || storageError) return;
      stopAudio();
      fence.current = emptyFence();
      setSession((s) =>
        s ? advanceVisit(s, guidedTour(s.tourId)!, outcome, Date.now()) : s,
      );
    },
    [ready, storageError, stopAudio],
  );
  const leave = useCallback(() => {
    stopAudio();
    setModeValue("manual");
    fence.current = emptyFence();
    if (session) checkpoints.current = checkpoint(checkpoints.current, session);
    checkpoints.current = { ...checkpoints.current, activeTourId: null };
    setSession(null);
  }, [session, stopAudio]);
  const finish = useCallback(() => {
    stopAudio();
    setModeValue("manual");
    setSession((s) => (s ? { ...s, endedAt: Date.now(), paused: false } : s));
  }, [stopAudio]);
  const togglePause = useCallback(() => {
    pauseAudio();
    fence.current = emptyFence();
    setSession((s) => (s ? { ...s, paused: !s.paused } : s));
  }, [pauseAudio]);
  const requestPlay = useCallback(
    (story: LiveStory, automatic = false) => {
      const admission = playbackAdmission({
        active: !!session && session.endedAt === null,
        paused: session?.paused ?? true,
        foreground,
        visible,
        mode,
        automatic,
        busy: !!playbackRef.current,
        story,
        assets: liveAssets,
      });
      if (admission !== "allowed") {
        if (admission === "unavailable")
          setAudioError(
            "Audio en préparation : script à relire et enregistrement approuvé requis.",
          );
        return false;
      }
      if (automatic)
        setSession((s) =>
          s
            ? {
                ...s,
                autoTriggered: [
                  ...new Set([...s.autoTriggered, storyKey(story)]),
                ],
              }
            : s,
        );
      setAudioError(null);
      updatePlayback({
        storyId: story.id,
        token: ++serial.current,
        intent: "play",
        status: "loading",
      });
      return true;
    },
    [session, foreground, visible, mode, updatePlayback],
  );
  const replay = useCallback(() => {
    const stop = tour.stops[session?.index ?? 0];
    const story = liveStories.find((s) => s.id === stop?.storyId);
    if (!story) return;
    stopAudio();
    requestPlay(story);
  }, [session, tour, stopAudio, requestPlay]);
  const play = useCallback(() => {
    const current = playbackRef.current;
    if (current) {
      updatePlayback({ ...current, intent: "play" });
      return;
    }
    const stop = tour.stops[session?.index ?? 0];
    const story = liveStories.find((s) => s.id === stop?.storyId);
    if (story) requestPlay(story);
  }, [session, tour, requestPlay, updatePlayback]);
  useEffect(() => {
    const tick = () => {
      const stop = tour.stops[session?.index ?? 0],
        story = liveStories.find((s) => s.id === stop?.storyId);
      if (!stop || !story) return;
      const key = storyKey(story);
      if (fenceStory.current !== key) {
        fence.current = emptyFence();
        fenceStory.current = key;
      }
      const next = tickFence(fence.current, {
        fix,
        target: stop.approach,
        now: Date.now(),
        active:
          !!session &&
          session.endedAt === null &&
          !session.paused &&
          ready &&
          !storageError,
        foreground: foreground && visible,
        automatic: mode === "automatic",
        eligible: !!playableAsset(story, liveAssets),
        busy: !!playbackRef.current,
        alreadyTriggered: session?.autoTriggered.includes(key) ?? false,
      });
      fence.current = next.state;
      if (next.play) requestPlay(story, true);
    };
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [
    session,
    tour,
    fix,
    mode,
    foreground,
    visible,
    ready,
    storageError,
    requestPlay,
  ]);
  const onEnd = useCallback(
    (token: number) => {
      if (currentPlayback(playbackRef.current, token)) advance("listened");
    },
    [advance],
  );
  const onError = useCallback(
    (token: number, message: string) => {
      if (!currentPlayback(playbackRef.current, token)) return;
      stopAudio();
      setAudioError(message);
    },
    [stopAudio],
  );
  const onStatus = useCallback(
    (token: number, status: Playback["status"]) => {
      if (!currentPlayback(playbackRef.current, token)) return;
      const p = playbackRef.current;
      if (p && p.status !== status) updatePlayback({ ...p, status });
    },
    [updatePlayback],
  );
  const onInterrupted = useCallback(
    (token: number) => {
      if (currentPlayback(playbackRef.current, token)) pauseAudio();
    },
    [pauseAudio],
  );
  return {
    tour,
    savedVisit: (id: string) => savedVisits.sessions[id] ?? null,
    session,
    ready,
    storageError,
    mode,
    prefs,
    foreground,
    visible,
    playback,
    audioError,
    setVisible,
    setMode,
    begin,
    advance,
    finish,
    leave,
    togglePause,
    play,
    pauseAudio,
    replay,
    onEnd,
    onError,
    onStatus,
    onInterrupted,
    setVolume: (volume: number) =>
      setPrefs((p) => ({ ...p, volume: Math.max(0, Math.min(1, volume)) })),
    effectivePlaying:
      !!session &&
      !session.paused &&
      session.endedAt === null &&
      foreground &&
      visible &&
      playback?.intent === "play",
  };
}
type LiveState = ReturnType<typeof useLiveState>;
const Context = createContext<LiveState | null>(null);
export function LiveProvider({ children }: { children: React.ReactNode }) {
  const value = useLiveState();
  const story = liveStories.find((s) => s.id === value.playback?.storyId);
  const asset = story ? playableAsset(story, liveAssets) : null;
  return (
    <Context.Provider value={value}>
      {children}
      {value.playback && asset && (
        <NativeNarration
          key={value.playback.token}
          asset={asset}
          token={value.playback.token}
          playing={value.effectivePlaying}
          volume={value.prefs.volume}
          onEnd={value.onEnd}
          onError={value.onError}
          onInterrupted={value.onInterrupted}
          onStatus={value.onStatus}
        />
      )}
    </Context.Provider>
  );
}
export function useLive() {
  const value = useContext(Context);
  if (!value) throw Error("LiveProvider manquant");
  return value;
}
