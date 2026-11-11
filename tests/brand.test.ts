import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { colors, theme } from "../src/theme/index.ts";
import { achievements } from "../src/lib/achievements.ts";
import { monumentState } from "../src/lib/markerState.ts";
const catalogue = JSON.parse(
  readFileSync(new URL("../src/data/monuments.json", import.meta.url), "utf8"),
);
const now = 1_800_000_000_000;
const monument = catalogue.find((m: { id: string }) => m.id === "auguste");
const fix = {
  latitude: monument.latitude,
  longitude: monument.longitude,
  accuracy: 10,
  timestamp: now,
};
function luminance(hex: string) {
  const values = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}
function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((a, b) => a - b);
  return (y + 0.05) / (x + 0.05);
}
test("les libellés principaux restent lisibles sur les surfaces officielles", () => {
  for (const background of [colors.bg, colors.panel, colors.raised])
    for (const foreground of [
      colors.ink,
      colors.muted,
      colors.blue,
      colors.coral,
      colors.turquoise,
    ])
      assert.ok(
        contrast(foreground, background) >= 4.5,
        `${foreground} sur ${background}`,
      );
  for (const endpoint of theme.gradients.primary)
    assert.ok(
      contrast(colors.bg, endpoint) >= 4.5,
      "Texte bleu nuit sur le bouton dégradé",
    );
});
test("un marqueur à portée exige toujours le vrai rayon et un GPS valide", () => {
  assert.equal(monumentState(monument, false, fix, now), "nearby");
  assert.equal(
    monumentState(monument, false, { ...fix, accuracy: 100 }, now),
    "featured",
  );
  assert.equal(
    monumentState(monument, false, { ...fix, timestamp: now - 31000 }, now),
    "featured",
  );
  assert.equal(
    monumentState(
      monument,
      false,
      { ...fix, latitude: fix.latitude + 0.01 },
      now,
    ),
    "featured",
  );
  assert.equal(monumentState(monument, true, fix, now), "discovered");
  assert.equal(
    monumentState({ ...monument, id: "theatre-vienne" }, false, null, now),
    "undiscovered",
  );
});
test("badges et succès se déduisent uniquement du carnet réel, sans récompense supplémentaire", () => {
  assert.ok(achievements({}, catalogue).every((a) => a.value === 0));
  assert.ok(
    achievements({ unknown: now }, catalogue).every((a) => a.value === 0),
  );
  const journal = Object.fromEntries(
    catalogue
      .filter((m: { city: string }) => m.city === "Vienne")
      .map((m: { id: string }) => [m.id, now]),
  );
  const badges = achievements(journal, catalogue);
  assert.equal(badges.find((a) => a.id === "first")?.value, 1);
  assert.equal(badges.find((a) => a.id === "vienne")?.value, 4);
  assert.equal(badges.find((a) => a.id === "lyon")?.value, 0);
  assert.equal(badges.find((a) => a.id === "rome")?.value, 2);
});
