import React from "react";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, colors } from "../../components/ui";
const tabs = [
  { name: "index", title: "Explorer", icon: "compass-outline" },
  { name: "parcours", title: "Parcours", icon: "trail-sign-outline" },
  { name: "carnet", title: "Carnet", icon: "book-outline" },
  { name: "defis", title: "Défis", icon: "ribbon-outline" },
  { name: "profil", title: "Profil", icon: "person-circle-outline" },
] as const;
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          position: "absolute",
          bottom: insets.bottom + 8,
          left: Math.max(insets.left, 12),
          right: Math.max(insets.right, 12),
          height: 64,
          paddingTop: 7,
          paddingBottom: 7,
          backgroundColor: "#101e20fa",
          borderRadius: 22,
          borderWidth: 1,
          borderColor: colors.line,
          borderTopColor: colors.line,
          elevation: 6,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      {tabs.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color }) => (
              <Icon
                name={t.icon}
                color={typeof color === "string" ? color : colors.muted}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
