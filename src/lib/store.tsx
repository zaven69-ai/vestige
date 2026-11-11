import { useSimulationController } from "./developer/DeveloperLocation";
import { initializeProgress, loadProgress, recordDiscovery } from "./progress";
import { progressDatabase } from "./progressDatabase";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { AppState } from "react-native";
import { monuments } from "../data/monuments";
import { Fix, canDiscover } from "./game";
type Journal = Record<string, number>;
type State = {
  journal: Journal;
  ready: boolean;
  storageError: string | null;
  fix: Fix | null;
  gps: string;
  requestGPS: () => Promise<void>;
  discover: (
    id: string,
  ) => Promise<"ok" | "already" | "gps" | "storage" | "simulation">;
  xp: number;
};
const Context = createContext<State | null>(null);
const KEY = "vestige.journal.v1";
export function GameProvider({ children }: { children: React.ReactNode }) {
  const simulation = useSimulationController();
  const [xp, setXP] = useState(0);
  const [journal, setJournal] = useState<Journal>({});
  const journalRef = useRef<Journal>({});
  const [ready, setReady] = useState(false),
    [storageError, setStorageError] = useState<string | null>(null);
  const [fix, setFix] = useState<Fix | null>(null),
    [gps, setGPS] = useState("GPS inactif");
  const watch = useRef<Location.LocationSubscription | null>(null),
    generation = useRef(0),
    mounted = useRef(true);
  const saving = useRef(false);
  useEffect(() => {
    progressDatabase()
      .then(async (db) => {
        await initializeProgress(
          db,
          () => AsyncStorage.getItem(KEY),
          monuments,
        );
        const snapshot = await loadProgress(db);
        journalRef.current = snapshot.journal;
        setJournal(snapshot.journal);
        setXP(snapshot.xp);
        setReady(true);
      })
      .catch(() =>
        setStorageError(
          "Carnet illisible. Relancez l’application pour réessayer. Les découvertes sont suspendues afin de préserver vos données.",
        ),
      );
  }, []);
  const requestGPS = useCallback(async () => {
    const token = ++generation.current;
    watch.current?.remove();
    watch.current = null;
    setFix(null);
    setGPS("Recherche du GPS…");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!mounted.current || token !== generation.current) return;
      if (permission.status !== "granted") {
        setGPS("Localisation refusée · activez-la dans Réglages");
        return;
      }
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!mounted.current || token !== generation.current) return;
      if (!servicesEnabled) {
        setGPS("Services de localisation désactivés");
        return;
      }
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 0,
          timeInterval: 5000,
        },
        (location) => {
          if (mounted.current && token === generation.current) {
            setFix({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy,
              heading: location.coords.heading,
              speed: location.coords.speed,
              timestamp: location.timestamp,
            });
            setGPS("GPS actif");
          }
        },
        () => {
          if (mounted.current && token === generation.current) {
            setFix(null);
            setGPS("GPS indisponible · réessayez");
          }
        },
      );
      if (mounted.current && token === generation.current)
        watch.current = subscription;
      else subscription.remove();
    } catch {
      if (mounted.current && token === generation.current) {
        setFix(null);
        setGPS("GPS indisponible · réessayez");
      }
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        generation.current++;
        watch.current?.remove();
        watch.current = null;
        setFix(null);
        setGPS("GPS en pause");
      } else {
        void Location.getForegroundPermissionsAsync()
          .then((p) => {
            if (p.granted && mounted.current) void requestGPS();
          })
          .catch(() => {
            if (mounted.current) setGPS("GPS indisponible · réessayez");
          });
      }
    });
    return () => {
      mounted.current = false;
      watch.current?.remove();
      sub.remove();
    };
  }, [requestGPS]);
  const discover: State["discover"] = async (id) => {
    if (!simulation.canCommitRealProgress()) return "simulation";
    if (!ready || storageError || saving.current) return "storage";
    if (journalRef.current[id]) return "already";
    const monument = monuments.find((m) => m.id === id);
    if (!monument || !canDiscover(fix, monument)) return "gps";
    const next = { ...journalRef.current, [id]: Date.now() };
    saving.current = true;
    try {
      const database = await progressDatabase();
      if (!simulation.canCommitRealProgress()) return "simulation";
      await recordDiscovery(database, id, next[id], monument.xp);
      journalRef.current = next;
      setJournal(next);
      setXP((value) => value + monument.xp);
      return "ok";
    } catch {
      setStorageError(
        "Échec de sauvegarde. Aucun XP ajouté. Relancez l’application pour réessayer.",
      );
      return "storage";
    } finally {
      saving.current = false;
    }
  };

  return (
    <Context.Provider
      value={{
        journal,
        ready,
        storageError,
        fix,
        gps,
        requestGPS,
        discover,
        xp,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useGame() {
  const context = useContext(Context);
  if (!context) throw new Error("GameProvider manquant");
  return context;
}
