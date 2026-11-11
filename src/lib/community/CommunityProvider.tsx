import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { monuments } from "../../data/monuments";
import { communityTours, emptySocial, type SocialState } from "./model";
import { createSocialStore } from "./store";
const store = createSocialStore(
  AsyncStorage,
  new Set(monuments.map((p) => p.id)),
);
const initial = {
  state: emptySocial(),
  ready: true,
  error: "",
  store,
  update: (_s: SocialState) => {},
};
const Context = createContext(initial);
export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(emptySocial),
    [ready, setReady] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    void store
      .read()
      .then((s) => {
        if (alive) setState(s);
      })
      .catch(() => {
        if (alive)
          setError(
            "Stockage communautaire indisponible. Les données existantes sont conservées.",
          );
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);
  const update = useCallback((next: SocialState) => {
    setState(next);
    setError("");
  }, []);
  const value = useMemo(
    () => ({ state, ready, error, store, update }),
    [state, ready, error, update],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useCommunity = () => useContext(Context);
export function useCommunityTours() {
  const { state, ready } = useCommunity();
  const tours = useMemo(
    () => communityTours(state.items, monuments),
    [state.items],
  );
  return { tours, ready };
}
