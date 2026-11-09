import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GameProvider } from "../lib/store";
import { colors } from "../components/ui";
export default function RootLayout() {
  return (
    <GameProvider>
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
    </GameProvider>
  );
}
