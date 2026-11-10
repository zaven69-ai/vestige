import React from "react";
import { Pressable, Text, View } from "react-native";
import { Button, Icon, s } from "../ui";
import { PoiGlyph } from "./PoiGlyph";
import {
  categoryLabels,
  defaultPoiFilters,
  poiCategories,
  poiStatuses,
  statusLabels,
  type PoiFilters,
} from "../../lib/poi";
function Choice({
  label,
  checked,
  onPress,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        minHeight: 48,
        gap: 12,
      }}
    >
      <Text style={[s.body, { flex: 1, color: "#FFFFFF" }]}>{label}</Text>
      <Icon name={checked ? "checkbox" : "square-outline"} />
    </Pressable>
  );
}
export function PoiFilterPanel({
  filters,
  onChange,
}: {
  filters: PoiFilters;
  onChange: (value: PoiFilters) => void;
}) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={s.heading}>Catégorie du lieu</Text>
      {poiCategories.map((id) => (
        <Choice
          key={id}
          label={categoryLabels[id]}
          checked={filters.categories.includes(id)}
          onPress={() =>
            onChange({
              ...filters,
              categories: filters.categories.includes(id)
                ? filters.categories.filter((v) => v !== id)
                : [...filters.categories, id],
            })
          }
        />
      ))}
      <Text style={s.heading}>Origine et contrôle</Text>
      {poiStatuses.map((id) => (
        <Choice
          key={id}
          label={statusLabels[id]}
          checked={filters.statuses.includes(id)}
          onPress={() =>
            onChange({
              ...filters,
              statuses: filters.statuses.includes(id)
                ? filters.statuses.filter((v) => v !== id)
                : [...filters.statuses, id],
            })
          }
        />
      ))}
      <Text style={s.caption}>
        Une source OpenStreetMap ou Wikidata ne constitue pas une vérification
        historique.
      </Text>
      <Text style={s.heading}>Votre carnet</Text>
      {(
        [
          ["all", "Tous les lieux"],
          ["visited", "Déjà découverts"],
          ["unvisited", "À découvrir"],
        ] as const
      ).map(([id, label]) => (
        <Pressable
          key={id}
          accessibilityRole="radio"
          accessibilityState={{ selected: filters.visits === id }}
          onPress={() => onChange({ ...filters, visits: id })}
          style={{
            minHeight: 48,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Text style={[s.body, { flex: 1, color: "#FFFFFF" }]}>{label}</Text>
          <Icon
            name={
              filters.visits === id ? "radio-button-on" : "radio-button-off"
            }
          />
        </Pressable>
      ))}
      <Button
        title="Réinitialiser catégories, contrôle et visites"
        secondary
        onPress={() => onChange(defaultPoiFilters())}
      />
      <Text style={s.caption}>
        Ces filtres n’effacent aucune découverte ni aucun XP. Les contributions
        communautaires ne sont pas encore ouvertes. Retrouvez les statuts dans
        la légende.
      </Text>
    </View>
  );
}
export function PoiLegend() {
  return (
    <View style={{ gap: 18 }}>
      <Text style={s.heading}>1 · Le dessin indique la catégorie</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {poiCategories.map((id) => (
          <View
            key={id}
            style={{
              width: "45%",
              flexGrow: 1,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <PoiGlyph category={id} status="imported_unreviewed" size={48} />
            <Text style={[s.body, { flex: 1 }]}>{categoryLabels[id]}</Text>
          </View>
        ))}
      </View>
      <Text style={s.heading}>2 · Le sceau indique le contrôle</Text>
      {poiStatuses.map((id) => (
        <View
          key={id}
          style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
        >
          <PoiGlyph category="other" status={id} />
          <Text style={[s.body, { flex: 1 }]}>
            {statusLabels[id]}
            {id === "editorial_verified"
              ? " · bouclier bleu coché"
              : id === "community_verified"
                ? " · utilisateurs et coche"
                : id === "community_pending"
                  ? " · horloge"
                  : id === "community_unreviewed"
                    ? " · utilisateurs"
                    : id === "editorial_unreviewed"
                      ? " · livre ouvert sans coche"
                      : " · document et point d’interrogation"}
          </Text>
        </View>
      ))}
      <Text style={s.caption}>
        Un import OSM/Wikidata reste non vérifié jusqu’à un contrôle individuel
        explicite. Une source disponible n’est pas une validation. Les fiches
        éditoriales initiales restent elles aussi à contrôler.
      </Text>
      <Text style={s.heading}>3 · Votre progression est indépendante</Text>
      {(
        [
          ["none", "À découvrir · sans marque de progression"],
          ["nearby", "À portée · halo corail"],
          ["discovered", "Découvert · coche blanche en haut à gauche"],
          [
            "completed",
            "Complété · double coche, réservé à une future validation de contenu",
          ],
        ] as const
      ).map(([progress, label]) => (
        <View
          key={progress}
          style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
        >
          <PoiGlyph
            category="temple"
            status="imported_unreviewed"
            progress={progress}
          />
          <Text style={[s.body, { flex: 1 }]}>{label}</Text>
        </View>
      ))}
      <Text style={s.body}>
        La coche de découverte n’est jamais une preuve de vérification
        historique. Le halo blanc désigne le lieu sélectionné ; un cercle avec
        un nombre regroupe plusieurs lieux.
      </Text>
      <Text style={s.caption}>
        Les contributions communautaires ne sont pas encore ouvertes. Les
        auteurs et révisions accompagneront les contributions publiées.
      </Text>
    </View>
  );
}
