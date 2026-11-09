import React from "react";
import { Text, View } from "react-native";
import { monuments } from "../../data/monuments";
import { useGame } from "../../lib/store";
import { Page, MonumentRow, s, Icon } from "../../components/ui";
export default function Carnet() {
  const { journal, ready, storageError } = useGame();
  const found = monuments
    .filter((m) => journal[m.id])
    .sort((a, b) => journal[b.id] - journal[a.id]);
  return (
    <Page eyebrow="Collection personnelle" title="Le carnet des traces">
      <Text style={s.body}>
        {found.length} / {monuments.length} monuments retrouvés. Vos découvertes
        restent sur ce téléphone.
      </Text>
      {storageError && <Text style={s.body}>{storageError}</Text>}
      {!ready && !storageError && (
        <Text style={s.body}>Ouverture du carnet…</Text>
      )}
      {ready && !found.length && (
        <View style={s.card}>
          <Icon name="book-outline" size={36} />
          <Text style={s.heading}>La première page vous attend.</Text>
          <Text style={s.body}>
            Approchez-vous d’un monument et validez sa découverte depuis sa
            fiche pour l’ajouter ici.
          </Text>
        </View>
      )}
      {found.map((m) => (
        <MonumentRow key={m.id} monument={m} discovered />
      ))}
    </Page>
  );
}
