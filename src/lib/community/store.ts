import {
  assertItem,
  emptySocial,
  parseSocial,
  profile,
  type CommunityItem,
  type PublicProfile,
  type SocialState,
} from "./model.ts";
export const SOCIAL_KEY = "@vestige/social-local-v1";
export function createSocialStore(
  storage: {
    getItem: (k: string) => Promise<string | null>;
    setItem: (k: string, v: string) => Promise<void>;
  },
  known: ReadonlySet<string>,
) {
  let queue: Promise<unknown> = Promise.resolve();
  const read = async () =>
    parseSocial(await storage.getItem(SOCIAL_KEY), known);
  function change(edit: (s: SocialState) => SocialState) {
    const next = queue.then(async () => {
      const state = edit(await read());
      parseSocial(JSON.stringify(state), known);
      await storage.setItem(SOCIAL_KEY, JSON.stringify(state));
      return state;
    });
    queue = next.catch(() => {});
    return next;
  }
  return {
    read: async () => {
      await queue;
      return read();
    },
    profile: (value: PublicProfile) =>
      change((s) => ({
        ...s,
        profile: profile(value),
        items: s.items.map((i) =>
          i.owned ? { ...i, author: profile(value) } : i,
        ),
      })),
    save: (item: CommunityItem) =>
      change((s) => {
        const prior = s.items.find((i) => i.id === item.id);
        if ((prior && !prior.owned) || !item.owned)
          throw Error("Seul l’auteur local peut modifier cette création.");
        assertItem(item, known);
        // A route's steps are immutable once published, protecting active guidance checkpoints.
        if (
          prior?.visibility === "local_published" &&
          prior.kind === "route" &&
          (prior.visibility !== item.visibility ||
            JSON.stringify(prior.poiIds) !== JSON.stringify(item.poiIds))
        )
          throw Error("Dupliquez un parcours publié pour changer ses étapes.");
        return {
          ...s,
          items: [
            { ...item, author: s.profile },
            ...s.items.filter((i) => i.id !== item.id),
          ],
        };
      }),
    import: (item: CommunityItem) =>
      change((s) => {
        if (item.owned || s.items.some((i) => i.id === item.id))
          throw Error("Import invalide.");
        assertItem(item, known);
        return { ...s, items: [item, ...s.items] };
      }),
    remove: (id: string) =>
      change((s) => ({
        ...s,
        items: s.items.filter((i) => i.id !== id),
        saved: s.saved.filter((i) => i !== id),
        hidden: s.hidden.filter((i) => i !== id),
      })),
    toggleSaved: (id: string) =>
      change((s) => {
        if (
          !s.items.some(
            (i) => i.id === id && i.visibility === "local_published",
          )
        )
          throw Error("Création introuvable.");
        return {
          ...s,
          saved: s.saved.includes(id)
            ? s.saved.filter((i) => i !== id)
            : [...s.saved, id],
        };
      }),
    report: (id: string, reason: string, now: number) =>
      change((s) => {
        if (
          !reason.trim() ||
          reason.length > 300 ||
          !s.items.some((i) => i.id === id)
        )
          throw Error("Précisez un motif de signalement.");
        if (s.reports.filter((r) => r.createdAt > now - 3600000).length >= 10)
          throw Error("Limite locale de signalements atteinte.");
        return {
          ...s,
          hidden: [...new Set([...s.hidden, id])],
          reports: [
            ...s.reports,
            {
              id: `report-${now}-${s.reports.length}`,
              itemId: id,
              reason: reason.trim(),
              createdAt: now,
            },
          ],
        };
      }),
    clear: () => {
      const task = queue.then(async () => {
        const s = emptySocial();
        await storage.setItem(SOCIAL_KEY, JSON.stringify(s));
        return s;
      });
      queue = task.catch(() => {});
      return task;
    },
  };
}
