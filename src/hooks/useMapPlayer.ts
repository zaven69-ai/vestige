import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  CATIA_MAP_KEY,
  readMapPlayer,
  type MapPlayerChoice,
} from "../lib/avatars/catiaMap";
/** Separate preference: never overwrite avatar packs, XP or saved discoveries. */
export function useMapPlayer() {
  const [choice, setChoice] = useState<MapPlayerChoice>("catia");
  const [ready, setReady] = useState(false),
    [error, setError] = useState<string | null>(null);
  const alive = useRef(false),
    busy = useRef(false);
  useEffect(() => {
    alive.current = true;
    void AsyncStorage.getItem(CATIA_MAP_KEY)
      .then((raw) => {
        if (alive.current) {
          setChoice(readMapPlayer(raw));
          setReady(true);
        }
      })
      .catch(() => {
        if (alive.current)
          setError(
            "Préférence carte illisible ; fichier conservé. Catia reste active pour cette session.",
          );
      });
    return () => {
      alive.current = false;
    };
  }, []);
  async function save(next: MapPlayerChoice) {
    if (!ready || busy.current) return;
    busy.current = true;
    try {
      await AsyncStorage.setItem(
        CATIA_MAP_KEY,
        JSON.stringify({ version: 1, choice: next }),
      );
      if (alive.current) {
        setChoice(next);
        setError(null);
      }
    } catch {
      if (alive.current)
        setError("Choix non enregistré ; préférence précédente conservée.");
    } finally {
      busy.current = false;
    }
  }
  return { choice, ready, error, save };
}
