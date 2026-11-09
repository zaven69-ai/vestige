import React from "react";
import { Text, View, Linking } from "react-native";
import { useGame } from "../../lib/store";
import { levelFor } from "../../lib/game";
import { Page, Button, Icon, colors, s } from "../../components/ui";
export default function Profil() {
  const { xp, journal, gps, fix, requestGPS, storageError } = useGame();
  return (
    <Page eyebrow="Votre aventure" title="Passeur de mémoire">
      <View style={[s.card, { alignItems: "center", paddingVertical: 30 }]}>
        <Icon name="compass-outline" size={58} />
        <Text style={s.eyebrow}>Explorateur · Niveau {levelFor(xp)}</Text>
        <Text style={s.title}>{xp} XP</Text>
        <Text style={s.body}>
          {Object.keys(journal).length} monuments découverts
        </Text>
        <View style={[s.track, { width: "100%" }]}>
          <View
            style={{
              height: 5,
              width: `${((xp % 400) / 400) * 100}%`,
              backgroundColor: colors.gold,
            }}
          />
        </View>
        <Text style={s.body}>
          {400 - (xp % 400)} XP avant le prochain niveau
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.heading}>Votre boussole</Text>
        <Text style={s.body}>
          {gps}
          {fix ? ` · précision ±${Math.round(fix.accuracy ?? 0)} m` : ""}
        </Text>
        <Button
          title="Actualiser ma position"
          secondary
          onPress={() => void requestGPS()}
        />
        <Button
          title="Ouvrir les réglages de localisation"
          secondary
          onPress={() => {
            void Linking.openSettings();
          }}
        />
      </View>
      <View style={s.card}>
        <Text style={s.heading}>Une aventure locale</Text>
        <Text style={s.body}>
          Votre carnet et vos XP sont conservés sur ce téléphone. Aucun compte
          ni serveur. Votre position n’est pas enregistrée par VESTIGE. Les
          fonds de carte sont fournis par Apple ou Google ; leur chargement
          nécessite Internet.
        </Text>
        <Text style={s.body}>
          La localisation fonctionne uniquement lorsque l’application est au
          premier plan. Les photos et les fiches intégrées restent lisibles sans
          connexion. Désinstaller l’application efface la progression locale.
        </Text>
        {storageError && <Text style={s.body}>{storageError}</Text>}
      </View>
    </Page>
  );
}
