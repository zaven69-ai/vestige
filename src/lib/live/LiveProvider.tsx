import { georgeDemo } from "../../data/live/georgeDemo";
import { georgePrivateSource } from "../../data/live/georgePrivateAsset";
import {
  admitPrivateDemo,
  audioProgress,
  finishedAudio,
  type AudioPlayback,
} from "./audioPlayback";
import {
  useSimulationController,
  useSimulationMode,
} from "../developer/DeveloperLocation";
import { canUseLiveScope, canPersistLiveScope } from "./scope";
import { navigationTours, guidedTour } from "../../data/live/tours";
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
  useMemo,
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
const georgeSource = georgePrivateSource ?? { uri: georgeDemo.uri };
type Playback = AudioPlayback;
function useLiveState(
  preview: boolean,
  simulationEnabled: boolean,
  simulationEpoch: number,
  initialTourId?: string,
) {
  const simulation = useSimulationController();
  const scopeAllowed = useCallback(
    () => canUseLiveScope(preview, simulation.isEnabled()),
    [preview, simulation],
  );
  const [previewEpoch, setPreviewEpoch] = useState(-1);
  const { fix } = useGame();
  const [session, setSession] = useState<VisitSession | null>(null),
    [loaded, setReady] = useState(false),
    [storageError, setStorageError] = useState<string | null>(null);
  const ready = preview
    ? simulationEnabled && previewEpoch === simulationEpoch
    : loaded;
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
    if (preview)
      return () => {
        mounted.current = false;
      };
    void Promise.all([
      AsyncStorage.getItem(LIVE_SESSION_KEY),
      AsyncStorage.getItem(LIVE_PREFS_KEY),
      AsyncStorage.getItem(LIVE_CHECKPOINTS_KEY),
    ])
      .then(([s, p, saved]) => {
        const { store, session: restored } = restoreTourState(
          saved,
          s,
          navigationTours,
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
  }, [preview]);
  useEffect(() => {
    if (!preview) return;
    const timer = setTimeout(() => {
      checkpoints.current = emptyCheckpoints();
      setSavedVisits(emptyCheckpoints());
      setSession(
        simulationEnabled
          ? startVisit(
              guidedTour(initialTourId ?? vienneAntique.id) ?? vienneAntique,
              Date.now(),
            )
          : null,
      );
      setModeValue("manual");
      setPrefs({ preferredMode: "manual", volume: 1 });
      stopAudio();
      setAudioError(null);
      fence.current = emptyFence();
      setPreviewEpoch(simulationEpoch);
    }, 0);
    return () => clearTimeout(timer);
    // The real tour is captured only when entering a fresh simulation, not when selecting demo steps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, simulationEnabled, simulationEpoch, stopAudio]);
  useEffect(() => {
    if (!ready || writeFailed.current || !scopeAllowed()) return;
    if (preview) {
      if (session)
        checkpoints.current = checkpoint(checkpoints.current, session);
      setSavedVisits(checkpoints.current);
      return;
    }
    if (session) checkpoints.current = checkpoint(checkpoints.current, session);
    const savedSnapshot = checkpoints.current;
    const savedCheckpoints = JSON.stringify(savedSnapshot);
    queue.current = queue.current
      .then(async () => {
        if (
          writeFailed.current ||
          !canPersistLiveScope(preview, simulation.isEnabled())
        )
          return;
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
  }, [
    ready,
    session,
    prefs,
    preview,
    scopeAllowed,
    simulation,
    simulationEnabled,
  ]);
  useEffect(() => {
    // Source changes are external events: invalidate callbacks before consumers can use the new scope.
    let epoch = simulation.getSnapshot().epoch;
    return simulation.subscribe(() => {
      const next = simulation.getSnapshot().epoch;
      if (next === epoch) return;
      epoch = next;
      fence.current = emptyFence();
      fenceStory.current = "";
      if (!scopeAllowed()) stopAudio();
    });
  }, [simulation, scopeAllowed, stopAudio]);
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
      if (value && !scopeAllowed()) return;
      setVisibleValue(value);
      if (!value) {
        fence.current = emptyFence();
        pauseAudio();
      }
    },
    [pauseAudio, scopeAllowed],
  );
  const setMode = useCallback(
    (value: LiveMode) => {
      if (!scopeAllowed()) return;
      pauseAudio();
      fence.current = emptyFence();
      setModeValue(value);
      setPrefs((p) => ({ ...p, preferredMode: value }));
    },
    [pauseAudio, scopeAllowed],
  );
  const begin = useCallback(
    (tourId: string = vienneAntique.id) => {
      if (!ready || storageError || !scopeAllowed()) return;
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
    [ready, storageError, stopAudio, scopeAllowed],
  );
  const advance = useCallback(
    (outcome: "consulted" | "skipped" | "listened") => {
      if (!ready || storageError || !scopeAllowed()) return;
      stopAudio();
      fence.current = emptyFence();
      setSession((s) =>
        s ? advanceVisit(s, guidedTour(s.tourId)!, outcome, Date.now()) : s,
      );
    },
    [ready, storageError, stopAudio, scopeAllowed],
  );
  const leave = useCallback(() => {
    if (!scopeAllowed()) return;
    stopAudio();
    setModeValue("manual");
    fence.current = emptyFence();
    if (session) checkpoints.current = checkpoint(checkpoints.current, session);
    checkpoints.current = { ...checkpoints.current, activeTourId: null };
    setSession(null);
  }, [session, stopAudio, scopeAllowed]);
  const finish = useCallback(() => {
    if (!scopeAllowed()) return;
    stopAudio();
    setModeValue("manual");
    setSession((s) => (s ? { ...s, endedAt: Date.now(), paused: false } : s));
  }, [stopAudio, scopeAllowed]);
  const togglePause = useCallback(() => {
    if (!scopeAllowed()) return;
    pauseAudio();
    fence.current = emptyFence();
    setSession((s) => (s ? { ...s, paused: !s.paused } : s));
  }, [pauseAudio, scopeAllowed]);
  const requestPlay = useCallback(
    (story: LiveStory, automatic = false) => {
      if (!scopeAllowed()) return false;
      const admission = playbackAdmission({
        active: !automatic || (!!session && session.endedAt === null),
        paused: automatic ? (session?.paused ?? true) : false,
        foreground,
        visible,
        mode,
        automatic,
        busy: automatic && !!playbackRef.current && !playbackRef.current.ended,
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
        kind: "approved",
        position: 0,
        duration: 0,
        ended: false,
        token: ++serial.current,
        intent: "play",
        status: "loading",
      });
      return true;
    },
    [session, foreground, visible, mode, updatePlayback, scopeAllowed],
  );
  const playDemo = useCallback(() => {
    if (
      !scopeAllowed() ||
      !ready ||
      !admitPrivateDemo(__DEV__, true, foreground, visible)
    )
      return false;
    setAudioError(null);
    updatePlayback({
      storyId: georgeDemo.id,
      kind: "private-demo",
      token: ++serial.current,
      intent: "play",
      status: "loading",
      position: 0,
      duration: georgeDemo.duration,
      ended: false,
    });
    return true;
  }, [scopeAllowed, ready, foreground, visible, updatePlayback]);
  const replay = useCallback(() => {
    if (!scopeAllowed() || !foreground || !visible) return;
    const current = playbackRef.current;
    if (current) {
      if (current.kind === "private-demo" && !__DEV__) return;
      setAudioError(null);
      updatePlayback({
        ...current,
        token: ++serial.current,
        intent: "play",
        status: "loading",
        position: 0,
        ended: false,
      });
    }
  }, [scopeAllowed, foreground, visible, updatePlayback]);
  const play = useCallback(() => {
    if (!scopeAllowed() || !foreground || !visible) return;
    const current = playbackRef.current;
    if (current) {
      if (current.ended || audioError) {
        replay();
        return;
      }
      updatePlayback({ ...current, intent: "play" });
      return;
    }
    const stop = tour.stops[session?.index ?? 0];
    const story = liveStories.find((s) => s.id === stop?.storyId);
    if (story) requestPlay(story);
  }, [
    session,
    tour,
    requestPlay,
    updatePlayback,
    scopeAllowed,
    foreground,
    visible,
    replay,
    audioError,
  ]);
  const playPoi = useCallback(
    (poiId: string) => {
      const story = liveStories.find((s) => s.poiId === poiId);
      return story ? requestPlay(story) : false;
    },
    [requestPlay],
  );
  useEffect(() => {
    if (!scopeAllowed()) return;
    const tick = () => {
      if (!scopeAllowed()) return;
      const stop = tour.stops[session?.index ?? 0],
        story = liveStories.find((s) => s.id === stop?.storyId);
      if (!stop || !story) return;
      const key = storyKey(story);
      if (fenceStory.current !== key) {
        fence.current = emptyFence();
        fenceStory.current = key;
      }
      const next = tickFence(fence.current, {
        fix: preview ? simulation.getSnapshot().fix : fix,
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
        busy: !!playbackRef.current && !playbackRef.current.ended,
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
    preview,
    simulation,
    scopeAllowed,
    simulationEnabled,
  ]);
  const onEnd = useCallback(
    (token: number) => {
      const current = playbackRef.current;
      if (scopeAllowed() && currentPlayback(current, token) && current)
        updatePlayback(finishedAudio(current));
    },
    [scopeAllowed, updatePlayback],
  );
  const onError = useCallback(
    (token: number, message: string) => {
      if (!currentPlayback(playbackRef.current, token)) return;
      const current = playbackRef.current;
      if (current)
        updatePlayback({ ...current, intent: "pause", status: "paused" });
      setAudioError(message);
    },
    [updatePlayback],
  );
  const onStatus = useCallback(
    (token: number, status: Playback["status"]) => {
      if (!currentPlayback(playbackRef.current, token)) return;
      const p = playbackRef.current;
      if (p && p.status !== status) updatePlayback({ ...p, status });
    },
    [updatePlayback],
  );
  const onProgress = useCallback(
    (token: number, position: number, duration: number) => {
      const current = playbackRef.current;
      if (!currentPlayback(current, token) || !current) return;
      const next = audioProgress(current, position, duration);
      if (next !== current) updatePlayback(next);
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
    preview,
    tour,
    savedVisit: (id: string) => savedVisits.sessions[id] ?? null,
    session: preview && !ready ? null : session,
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
    playDemo,
    playPoi,
    closeAudio: stopAudio,
    pauseAudio,
    replay,
    onEnd,
    onError,
    onStatus,
    onProgress,
    onInterrupted,
    setVolume: (volume: number) => {
      if (scopeAllowed())
        setPrefs((p) => ({ ...p, volume: Math.max(0, Math.min(1, volume)) }));
    },
    effectivePlaying:
      scopeAllowed() &&
      ready &&
      foreground &&
      visible &&
      playback?.intent === "play",
  };
}
type LiveState = ReturnType<typeof useLiveState> & {
  audioStory?: LiveStory | typeof georgeDemo;
};
const Context = createContext<LiveState | null>(null);
export function LiveProvider({ children }: { children: React.ReactNode }) {
  const simulation = useSimulationMode();
  const real = useLiveState(false, simulation.enabled, simulation.epoch);
  const demo = useLiveState(
    true,
    simulation.enabled,
    simulation.epoch,
    real.session?.tourId,
  );
  const value = simulation.enabled ? demo : real;
  const story = liveStories.find((s) => s.id === value.playback?.storyId);
  const demoPlayback = __DEV__ && value.playback?.kind === "private-demo";
  const asset = story ? playableAsset(story, liveAssets) : null;
  const source = useMemo(
    () =>
      demoPlayback
        ? georgeSource
        : asset
          ? (asset.module ?? { uri: asset.uri })
          : null,
    [demoPlayback, asset],
  );
  const audioStory = demoPlayback ? georgeDemo : story;
  return (
    <Context.Provider value={{ ...value, audioStory }}>
      {children}
      {value.playback && source && (
        <NativeNarration
          key={`${value.preview ? "preview" : "real"}:${simulation.epoch}:${value.playback.token}`}
          source={source}
          token={value.playback.token}
          playing={value.effectivePlaying}
          volume={value.prefs.volume}
          onEnd={value.onEnd}
          onError={value.onError}
          onInterrupted={value.onInterrupted}
          onStatus={value.onStatus}
          onProgress={value.onProgress}
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
