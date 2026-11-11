import { SessionProvider } from "../lib/supabase/SessionProvider";
import { CommunityProvider } from "../lib/community/CommunityProvider";
import { SimulationBanner } from "../components/developer/SimulationBanner";
import { DeveloperLocationProvider } from "../lib/developer/DeveloperLocation";
import { LiveProvider } from "../lib/live/LiveProvider";
import { AvatarPreferencesProvider } from "../lib/avatars/preferences";
import React from "react";
import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GameProvider, useGame } from "../lib/store";
import { BrandLaunch } from "../components/brand/BrandSignature";
import { colors } from "../theme";
function AppShell() {
  const { ready, storageError } = useGame();
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.ink,
          contentStyle: { backgroundColor: colors.bg },
          headerBackTitle: "Retour",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="monument/[id]"
          options={{ title: "Archives du lieu", presentation: "modal" }}
        />
      </Stack>
      <SimulationBanner />
      {!ready && !storageError && (
        <View style={StyleSheet.absoluteFill}>
          <BrandLaunch />
        </View>
      )}
    </>
  );
}
export default function RootLayout() {
  return (
    <DeveloperLocationProvider>
      <GameProvider>
        <AvatarPreferencesProvider>
          <SessionProvider>
            <CommunityProvider>
              <LiveProvider>
                <AppShell />
              </LiveProvider>
            </CommunityProvider>
          </SessionProvider>
        </AvatarPreferencesProvider>
      </GameProvider>
    </DeveloperLocationProvider>
  );
}
