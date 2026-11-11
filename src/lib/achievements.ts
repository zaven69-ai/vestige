export type DiscoveryRecord = { id: string; city: string; era: string };
export function achievements(
  journal: Record<string, number>,
  catalogue: DiscoveryRecord[],
) {
  const found = catalogue.filter((m) => journal[m.id]);
  return [
    {
      id: "first",
      title: "Le premier pas",
      description: "Découvrez votre premier monument.",
      value: Math.min(found.length, 1),
      goal: 1,
    },
    {
      id: "vienne",
      title: "Mémoire de Vienna",
      description: "Retrouvez les quatre lieux de Vienne.",
      value: found.filter((m) => m.city === "Vienne").length,
      goal: 4,
    },
    {
      id: "lyon",
      title: "Lugdunum vous appelle",
      description: "Retrouvez les quatre lieux de Lyon.",
      value: found.filter((m) => m.city === "Lyon").length,
      goal: 4,
    },
    {
      id: "rome",
      title: "Les gardiens de Rome",
      description: "Découvrez les quatre monuments antiques.",
      value: found.filter((m) => m.era === "Antiquité").length,
      goal: 4,
    },
  ];
}
