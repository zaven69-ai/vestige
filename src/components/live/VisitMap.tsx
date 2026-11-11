import React from "react";
import { Redirect } from "expo-router";
/** Legacy entry only. Explorer is the sole map owner for historical guidance. */
export function VisitMap() {
  return <Redirect href="/(tabs)" />;
}
