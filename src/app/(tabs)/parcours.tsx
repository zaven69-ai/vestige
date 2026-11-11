import { AdventureCard } from "../../components/live/AdventureCard";
import { lyonAdventures } from "../../data/adventures";
import React from "react";
import { Text } from "react-native";
import { Page, s } from "../../components/ui";
import { TourCard } from "../../components/live/TourCard";
import { guidedTours } from "../../data/live/tours";
export default function Parcours() {
  return (
    <Page eyebrow="Choisir une expédition" title="Les histoires vous attendent">
      <Text style={s.body}>
        Choisissez un parcours. Toute l’exploration et le guidage se déroulent
        ensuite dans Explorer.
      </Text>
      {lyonAdventures.map((adventure, index) => (
        <AdventureCard key={adventure.id} adventure={adventure} index={index} />
      ))}
      <Text style={s.heading}>Vienne · parcours conservés</Text>
      {guidedTours
        .filter((t) => t.id !== "trail-lyon")
        .map((tour) => (
          <TourCard key={tour.id} tour={tour} />
        ))}
    </Page>
  );
}
