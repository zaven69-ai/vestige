import React from "react";
import { Tabs } from "expo-router";
import { Icon, colors } from "../../components/ui";
const tabs = [
  { name: "index", title: "Explorer", icon: "compass-outline" },
  { name: "parcours", title: "Parcours", icon: "trail-sign-outline" },
  { name: "carnet", title: "Carnet", icon: "book-outline" },
  { name: "defis", title: "Défis", icon: "ribbon-outline" },
  { name: "profil", title: "Profil", icon: "person-circle-outline" },
] as const;
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.line,
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
