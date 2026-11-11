import React, { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { Text, View } from "react-native";
import { useLive } from "../lib/live/LiveProvider";
/** Compatibility for old bookmarks: all maps and navigation now live in Explorer. */
export default function VisitVienneRedirect() {
  const { ready, session, storageError, begin } = useLive();
  const [command] = useState(() => String(Date.now()));
  useEffect(() => {
    if (ready && !session && !storageError) begin();
  }, [ready, session, storageError, begin]);
  if (!ready || !session)
    return (
      <View>
        <Text>Ouverture du parcours dans Explorer… {storageError}</Text>
      </View>
    );
  return (
    <Redirect
      href={{ pathname: "/(tabs)", params: { guide: "start", command } }}
    />
  );
}
