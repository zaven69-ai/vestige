import React, { createContext, useContext, useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./client";

const Context = createContext<{ ready: boolean; session: Session | null }>({
  ready: false,
  session: null,
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState({
    ready: !supabase,
    session: null as Session | null,
  });

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      setAuth({ ready: true, session });
    });
    const refresh = (state: string | null) => {
      if (state === "active") void client.auth.startAutoRefresh();
      else void client.auth.stopAutoRefresh();
    };
    const appState =
      Platform.OS !== "web" && AppState.addEventListener("change", refresh);
    if (appState) refresh(AppState.currentState ?? null);
    return () => {
      subscription.unsubscribe();
      if (appState) {
        appState.remove();
        void client.auth.stopAutoRefresh();
      }
    };
  }, []);

  return <Context.Provider value={auth}>{children}</Context.Provider>;
}

export const useSupabaseSession = () => useContext(Context);
