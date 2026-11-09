import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  PREFERENCE_KEY,
  readAvatarChoice,
  serializeAvatarChoice,
  type AvatarChoice,
} from "./catalogue";
import { characterPacks } from "../../data/avatars/packs";
import {
  avatarPortrait,
  avatarSprites,
} from "../../components/exploration/avatar/sprites";
const legacyPack = { portrait: avatarPortrait, sprites: avatarSprites };
const Context = createContext<{
  choice: AvatarChoice;
  ready: boolean;
  error: string | null;
  save: (choice: AvatarChoice) => Promise<boolean>;
} | null>(null);
export function AvatarPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [choice, setChoice] = useState<AvatarChoice>("legacy");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(false);
  const saving = useRef(false);
  useEffect(() => {
    mounted.current = true;
    void AsyncStorage.getItem(PREFERENCE_KEY)
      .then((raw) => {
        if (mounted.current) {
          setChoice(readAvatarChoice(raw));
          setReady(true);
        }
      })
      .catch(() => {
        if (mounted.current)
          setError(
            "La préférence est illisible. Elle est conservée ; l’avatar actuel reste actif.",
          );
      });
    return () => {
      mounted.current = false;
    };
  }, []);
  async function save(next: AvatarChoice) {
    if (!ready || saving.current) return false;
    saving.current = true;
    try {
      await AsyncStorage.setItem(PREFERENCE_KEY, serializeAvatarChoice(next));
      if (mounted.current) {
        setChoice(next);
        setError(null);
      }
      return true;
    } catch {
      if (mounted.current)
        setError(
          "La préférence n’a pas pu être sauvegardée. Votre choix précédent est conservé.",
        );
      return false;
    } finally {
      saving.current = false;
    }
  }
  return (
    <Context.Provider value={{ choice, ready, error, save }}>
      {children}
    </Context.Provider>
  );
}
export function useAvatarPreferences() {
  const context = useContext(Context);
  if (!context) throw Error("AvatarPreferencesProvider manquant");
  const pack =
    context.choice === "legacy" ? undefined : characterPacks[context.choice];
  return {
    ...context,
    pack: pack ?? legacyPack,
    packVersion: pack?.sourceSha256 ?? "legacy-v1",
    activeChoice: pack ? context.choice : ("legacy" as const),
    pending: context.choice !== "legacy" && !pack,
  };
}
