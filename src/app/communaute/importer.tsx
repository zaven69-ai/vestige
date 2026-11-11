import React, { useState } from "react";
import { Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Page, Button, s } from "../../components/ui";
import {
  Field,
  LocalNotice,
  ErrorNotice,
  useSocialAction,
} from "../../components/community/Common";
import { importCode } from "../../lib/community/model";
import { monuments } from "../../data/monuments";
export default function ImportCreation() {
  const params = useLocalSearchParams<{ code?: string }>();
  return (
    <ImportForm
      key={params.code ?? "empty"}
      initial={typeof params.code === "string" ? params.code : ""}
    />
  );
}
function ImportForm({ initial }: { initial: string }) {
  const [code, setCode] = useState(initial),
    c = useSocialAction();
  let candidate,
    invalid = "";
  try {
    if (code.trim())
      candidate = importCode(
        code,
        new Set(monuments.map((p) => p.id)),
        "social-import-preview",
        0,
      );
  } catch (e) {
    invalid = e instanceof Error ? e.message : "Code invalide.";
  }
  return (
    <Page eyebrow="Une copie, avec votre accord" title="Importer une création">
      <LocalNotice />
      <Text style={s.body}>
        Collez uniquement le code commençant par VESTIGE1: reçu d’un proche.
        L’import n’authentifie pas l’auteur et ne vérifie aucun récit.
      </Text>
      <Field
        label="Code Vestige"
        value={code}
        change={setCode}
        max={16000}
        multiline
      />
      <ErrorNotice message={c.error || invalid} />
      {candidate && (
        <>
          <Text style={s.heading}>{candidate.title}</Text>
          <Text style={s.body}>{candidate.text}</Text>
          <Text style={s.caption}>
            {candidate.author.alias} · {candidate.poiIds.length} lieu(x) · non
            vérifié
          </Text>
          <Button
            title="Confirmer et enregistrer cette copie"
            disabled={c.busy}
            onPress={() => {
              const now = Date.now();
              const item = importCode(
                code,
                new Set(monuments.map((p) => p.id)),
                `social-import-${now}-${Math.random().toString(36).slice(2, 8)}`,
                now,
              );
              void c.run(
                () => c.store.import(item),
                () => router.replace(`/communaute/${item.id}`),
              );
            }}
          />
        </>
      )}
    </Page>
  );
}
