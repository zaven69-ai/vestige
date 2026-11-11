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
import {
  communityTours,
  emptySocial,
  type SocialState,
  type CommunityItem,
} from "./model";
import { useSupabaseSession } from "../supabase/SessionProvider";
import { getRemoteRoutes, remoteRouteItem } from "../supabase/community";
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
  remoteItems: [] as CommunityItem[],
  refreshRemote: async () => {},
  toursReady: false,
  update: (_s: SocialState) => {},
};
const Context = createContext(initial);
export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const { session, ready: authReady } = useSupabaseSession();
  const account = session?.user.id;
  const [remote, setRemote] = useState<{
    account?: string;
    items: CommunityItem[];
  }>({ items: [] });
  const [settledAccount, setSettledAccount] = useState<string>();
  const remoteReady = !account || settledAccount === account;
  const remoteItems =
    remote.account === account ? remote.items : initial.remoteItems;
  const refreshRemote = useCallback(async () => {
    if (!account) return;
    const routes = await getRemoteRoutes();
    setRemote({
      account,
      items: routes.map((route) => remoteRouteItem(route, account)),
    });
  }, [account]);
  useEffect(() => {
    if (!account) return;
    let active = true;
    void getRemoteRoutes()
      .then((routes) => {
        if (active)
          setRemote({
            account,
            items: routes.map((route) => remoteRouteItem(route, account)),
          });
      })
      .catch(() => {})
      .finally(() => {
        if (active) setSettledAccount(account);
      });
    return () => {
      active = false;
    };
  }, [account]);
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
    () => ({
      state,
      ready,
      error,
      store,
      update,
      remoteItems,
      refreshRemote,
      toursReady: ready && authReady && remoteReady,
    }),
    [
      state,
      ready,
      error,
      update,
      remoteItems,
      refreshRemote,
      authReady,
      remoteReady,
    ],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useCommunity = () => useContext(Context);
export function useCommunityTours() {
  const { state, remoteItems, toursReady } = useCommunity();
  const tours = useMemo(
    () => communityTours([...state.items, ...remoteItems], monuments),
    [state.items, remoteItems],
  );
  return { tours, ready: toursReady };
}
