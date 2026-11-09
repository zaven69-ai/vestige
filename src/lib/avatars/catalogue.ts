/** Artistic reference: user-supplied six-character Vestige board, 2026-11-09. */
export const prototypeIds = ["alex", "lea"] as const;
export type PrototypeAvatarId = (typeof prototypeIds)[number];
export type AvatarChoice = "legacy" | PrototypeAvatarId;
export const avatarCharacters = [
  {
    id: "alex",
    name: "Alex",
    role: "Explorateur urbain",
    stage: "prototype",
    accent: "#32BCC0",
    palette: ["#020D27", "#0B1B3D", "#32BCC0"],
    silhouette:
      "Proportions humaines, épaules naturelles, veste urbaine droite et sac compact.",
    appearance:
      "Jeune homme, cheveux bruns courts légèrement ondulés, expression accessible.",
    outfit: "Veste bleu nuit, haut sobre, cargo foncé, sneakers urbaines.",
    accessories: "Sac à dos compact et montre connectée.",
    personality: "Accessible · curieux · polyvalent",
  },
  {
    id: "lea",
    name: "Léa",
    role: "Aventurière",
    stage: "prototype",
    accent: "#A454ED",
    palette: ["#A454ED", "#F77B54", "#0B1B3D"],
    silhouette:
      "Morphologie athlétique naturelle, veste ajustée, cheveux attachés et chaussures de terrain.",
    appearance: "Jeune femme, cheveux châtains attachés, expression assurée.",
    outfit:
      "Veste violette aux accents corail, pantalon technique, chaussures de randonnée modernes.",
    accessories:
      "Sac à dos et accessoire de navigation ; lunettes sur la tête dans la référence.",
    personality: "Sportive · dynamique · audacieuse",
  },
  {
    id: "noa",
    name: "Noa",
    role: "Voyageur du temps",
    stage: "future",
    accent: "#32BCC0",
    palette: ["#F5F5F2", "#0B1B3D", "#32BCC0"],
    silhouette:
      "Veste claire reconnaissable, tenue urbaine superposée, accessoires peu volumineux.",
    appearance: "Jeune homme, cheveux bruns foncés, regard curieux.",
    outfit: "Veste blanche avec bleu électrique, sweat, cargo et sneakers.",
    accessories: "Bracelet connecté et dispositif holographique discret.",
    personality: "Curieux · technologique · visionnaire",
  },
  {
    id: "camille",
    name: "Camille",
    role: "Archéologue moderne",
    stage: "future",
    accent: "#F77B54",
    palette: ["#BFA98B", "#0B1B3D", "#F77B54"],
    silhouette:
      "Veste technique plus longue, sacoche latérale et lunettes distinctives.",
    appearance:
      "Femme adulte, cheveux bruns ondulés, lunettes, regard analytique.",
    outfit:
      "Veste beige technique, pantalon de terrain et bottines contemporaines.",
    accessories: "Sacoche d’archéologue et tablette numérique.",
    personality: "Érudite · analytique · passionnée",
  },
  {
    id: "sam",
    name: "Sam",
    role: "Aventurier dynamique",
    stage: "future",
    accent: "#F77B54",
    palette: ["#F77B54", "#0B1B3D", "#32BCC0"],
    silhouette: "Veste corail, chevelure courte bouclée et sneakers turquoise.",
    appearance:
      "Jeune homme, cheveux courts bouclés, peau foncée et expression souriante dans la référence.",
    outfit: "Veste corail, pantalon technique sombre et sneakers turquoise.",
    accessories: "Sac à dos et casque audio urbain.",
    personality: "Énergique · positif · explorateur",
  },
  {
    id: "nova",
    name: "Nova",
    role: "Exploratrice d’élite",
    stage: "future",
    accent: "#A454ED",
    palette: ["#020D27", "#A454ED", "#32BCC0"],
    silhouette:
      "Tenue technique sombre, cheveux argentés et accessoires compacts.",
    appearance: "Femme adulte, cheveux argentés, expression stratégique.",
    outfit:
      "Veste sombre aux détails violets, pantalon technique et bottes modernes.",
    accessories: "Bracelet lumineux et équipement holographique discret.",
    personality: "Stratégique · expérimentée · mystérieuse",
  },
] as const;
export const PREFERENCE_KEY = "vestige.avatar.preference.v1";
export function readAvatarChoice(raw: string | null): AvatarChoice {
  if (raw === null) return "legacy";
  const parsed: unknown = JSON.parse(raw);
  if (
    !parsed ||
    typeof parsed !== "object" ||
    !("version" in parsed) ||
    parsed.version !== 1 ||
    !("choice" in parsed)
  )
    throw Error("Préférence avatar illisible");
  if (
    parsed.choice === "legacy" ||
    parsed.choice === "alex" ||
    parsed.choice === "lea"
  )
    return parsed.choice;
  throw Error("Personnage non pris en charge");
}
export function serializeAvatarChoice(choice: AvatarChoice) {
  return JSON.stringify({ version: 1, choice });
}
