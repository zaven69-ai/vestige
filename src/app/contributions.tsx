import React, { useCallback, useState } from "react";
import { Alert, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Page, Card, Badge, Button, s } from "../components/ui";
import {
  emptyCommunity,
  kindLabels,
  type CommunityLocal,
} from "../lib/contributions/model";
import { communityStore } from "../lib/contributions/native";
import {
  removeDraftPhoto,
  clearDraftPhotos,
} from "../lib/contributions/photos";
import { monuments } from "../data/monuments";
export default function Contributions() {
  const [state, setState] = useState<CommunityLocal>(emptyCommunity),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      void communityStore
        .read()
        .then((value) => {
          if (active) {
            setState(value);
            setError("");
          }
        })
        .catch(() => {
          if (active)
            setError(
              "Lecture des brouillons impossible. Les données sont conservées.",
            );
        });
      return () => {
        active = false;
      };
    }, []),
  );
  async function remove(id: string) {
    setBusy(true);
    try {
      const draft = state.drafts.find((d) => d.id === id);
      const next = await communityStore.remove(id);
      setState(next);
      if (!next.drafts.some((d) => d.photoUri === draft?.photoUri))
        removeDraftPhoto(draft?.photoUri);
    } catch {
      setError(
        "Suppression incomplète. Vérifiez les brouillons avant de réessayer.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page eyebrow="Votre espace privé" title="Mes contributions">
      <Card>
        <Badge tone="coral">Local uniquement · aucun envoi</Badge>
        <Text style={s.body}>
          Vos brouillons et favoris restent sur cet iPhone. Aucun compte, aucune
          soumission et aucune validation ne sont simulés. Ils ne modifient pas
          les fiches publiques et ne donnent pas d’XP.
        </Text>
        <Button
          title="Préparer un nouveau lieu"
          onPress={() => router.push("/contribuer")}
        />
      </Card>
      {error && (
        <Text accessibilityRole="alert" style={s.body}>
          {error}
        </Text>
      )}
      <Text style={s.heading}>Mes brouillons ({state.drafts.length})</Text>
      {state.drafts.length === 0 && (
        <Text style={s.body}>
          Aucun brouillon enregistré. Vous pouvez préparer un lieu ou enrichir
          une fiche.
        </Text>
      )}
      {state.drafts.map((draft) => (
        <Card key={draft.id}>
          <Badge>Brouillon · non publié</Badge>
          <Text style={s.heading}>{draft.name || "Lieu sans nom"}</Text>
          <Text style={s.body}>
            {kindLabels[draft.kind]} · enregistré le{" "}
            {new Date(draft.updatedAt).toLocaleString("fr-FR")}
          </Text>
          {draft.alias && (
            <Text style={s.caption}>
              Pseudo souhaité : {draft.alias} · privé tant que non publié
            </Text>
          )}
          <Button
            title="Reprendre le brouillon"
            secondary
            onPress={() =>
              router.push({ pathname: "/contribuer", params: { id: draft.id } })
            }
          />
          <Button
            title="Supprimer ce brouillon"
            secondary
            disabled={busy}
            onPress={() =>
              Alert.alert(
                "Supprimer ce brouillon local ?",
                "Votre progression et les fiches publiques restent inchangées.",
                [
                  { text: "Annuler", style: "cancel" },
                  {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: () => void remove(draft.id),
                  },
                ],
              )
            }
          />
        </Card>
      ))}
      <Text style={s.heading}>
        Mes favoris privés ({state.favorites.length})
      </Text>
      {state.favorites.length === 0 && (
        <Text style={s.body}>
          Ajoutez un lieu à vos favoris depuis sa fiche.
        </Text>
      )}
      {state.favorites.map((id) => {
        const poi = monuments.find((m) => m.id === id);
        return poi ? (
          <Button
            key={id}
            secondary
            title={poi.name}
            onPress={() => router.push(`/monument/${poi.id}`)}
          />
        ) : (
          <View key={id}>
            <Text style={s.body}>Lieu devenu indisponible</Text>
          </View>
        );
      })}
      <Card>
        <Text style={s.heading}>Confidentialité et suppression</Text>
        <Text style={s.body}>
          Aucun profil public n’existe encore. Le pseudo choisi reste dans vos
          brouillons. Sans compte distant, il n’y a aucun compte à supprimer ;
          vous pouvez effacer vos brouillons, leurs photos locales et vos
          favoris ci-dessous.
        </Text>
        <Button
          secondary
          disabled={busy}
          title="Effacer mes données de contribution locales"
          onPress={() =>
            Alert.alert(
              "Effacer brouillons, photos et favoris ?",
              "Le carnet, les XP et Catia ne seront pas effacés.",
              [
                { text: "Annuler", style: "cancel" },
                {
                  text: "Effacer",
                  style: "destructive",
                  onPress: () => {
                    setBusy(true);
                    void communityStore
                      .clear()
                      .then((next) => {
                        setState(next);
                        clearDraftPhotos();
                        setError("");
                      })
                      .catch(() => setError("Effacement incomplet. Réessayez."))
                      .finally(() => setBusy(false));
                  },
                },
              ],
            )
          }
        />
      </Card>
    </Page>
  );
}
