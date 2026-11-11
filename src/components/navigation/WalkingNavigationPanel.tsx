import React from "react";
import { Text, Linking, Platform, Alert } from "react-native";
import { Badge, Button, Card, s } from "../ui";
import type { WalkingNavigation } from "../../hooks/useWalkingNavigation";
import { formatDistance, type Point } from "../../lib/game";
import {
  phoneNavigationURL,
  formatWalkingTime,
} from "../../lib/navigation/walking";
export function WalkingNavigationPanel({
  navigation,
  destination,
  first,
  last,
  target,
  onNarration,
  onNext,
}: {
  navigation: WalkingNavigation;
  destination: string;
  first: boolean;
  last: boolean;
  target: Point;
  onNarration: () => void;
  onNext: () => void;
}) {
  const n = navigation;
  const drive = () =>
    void Linking.openURL(phoneNavigationURL(target, Platform.OS)).catch(() =>
      Alert.alert(
        "Navigation indisponible",
        "Aucune application de navigation n’a pu être ouverte.",
      ),
    );
  return (
    <Card>
      <Badge tone="blue">Guidage piéton · V1</Badge>
      <Text style={s.heading}>{destination}</Text>
      {!n.enabled ? (
        <>
          <Text style={s.body}>
            Calculer un vrai trajet à pied depuis votre GPS. Départ et
            destination sont transmis au service public Valhalla/FOSSGIS.
          </Text>
          <Button
            title={
              first ? "Rejoindre le départ à pied" : "Guider vers cette étape"
            }
            onPress={n.start}
          />
        </>
      ) : (
        <>
          {n.status === "paused" && (
            <Text style={s.body}>
              Guidage en pause : reprenez la visite avec cet écran au premier
              plan.
            </Text>
          )}
          {n.status === "gps" && (
            <Text style={s.body}>
              GPS non autorisé, périmé ou imprécis : en attente d’une position
              récente (précision ≤ 50 m). Aucun trajet fictif n’est affiché.
            </Text>
          )}
          {n.status === "loading" && (
            <Text style={s.body}>
              Calcul du trajet piéton sur les rues et chemins…
            </Text>
          )}
          {n.status === "near" && !n.arrived && (
            <Text style={s.body}>
              Vous êtes près du repère. Vérification de proximité avec un GPS
              précis et plusieurs mesures.
            </Text>
          )}
          {n.error && (
            <Text style={s.body}>
              {n.error}
              {n.route
                ? " Le dernier trajet calculé reste visible ; sa mise à jour a échoué."
                : ""}
            </Text>
          )}
          {n.offRoute && (
            <Text style={s.body}>
              Vous vous êtes écarté du trajet. Recalcul après confirmation GPS ;
              les anciennes instructions sont suspendues.
            </Text>
          )}
          {n.route &&
            n.status === "ready" &&
            n.valid &&
            !n.offRoute &&
            !n.arrived && (
              <>
                <Text style={s.body}>
                  {formatDistance(
                    n.progress?.remainingMeters ?? n.route.meters,
                  )}{" "}
                  · ≈{" "}
                  {formatWalkingTime(
                    n.progress?.remainingSeconds ?? n.route.seconds,
                  )}{" "}
                  à pied restantes
                </Text>
                <Text style={s.caption}>
                  Restant estimé par projection GPS sur le trajet calculé ;
                  durée issue de l’estimation du moteur.
                </Text>
                {n.progress && (
                  <>
                    <Text accessibilityLiveRegion="polite" style={s.heading}>
                      {n.progress.instruction}
                    </Text>
                    {n.progress.nextInstruction && (
                      <Text style={s.body}>
                        Dans {formatDistance(n.progress.metersToTurn)} :{" "}
                        {n.progress.nextInstruction}
                      </Text>
                    )}
                  </>
                )}
              </>
            )}
          {n.arrived && (
            <>
              <Badge>À proximité du monument</Badge>
              <Text style={s.body}>
                Le GPS confirme la proximité du repère. Consultez la narration ;
                le mode automatique respecte les validations éditoriales
                existantes.
              </Text>
              <Button title="Ouvrir la narration" onPress={onNarration} />
              <Button
                title={
                  last
                    ? "Étape consultée · terminer le parcours"
                    : "Étape consultée · guider vers la suivante"
                }
                secondary
                onPress={onNext}
              />
            </>
          )}
          <Button
            title="Recalculer l’itinéraire"
            secondary
            disabled={
              !n.valid || n.status === "loading" || n.status === "paused"
            }
            onPress={n.retry}
          />
          <Button title="Arrêter le guidage" secondary onPress={n.stop} />
        </>
      )}
      <Button
        title={
          first
            ? "Rejoindre le départ avec Plans / Maps (voiture)"
            : "Ouvrir Plans / Maps vers cette étape (voiture)"
        }
        secondary
        onPress={drive}
      />
      <Text style={s.caption}>
        Pour un long trajet vers Vienne, utilisez la navigation du téléphone,
        puis activez le guidage à pied sur place. Service public sans garantie
        de disponibilité ; accès selon les données OpenStreetMap et la
        signalisation locale.
      </Text>
    </Card>
  );
}
