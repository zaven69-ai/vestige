import {
  assertDraft,
  emptyCommunity,
  parseCommunity,
  type CommunityLocal,
  type Draft,
} from "./model.ts";
export const COMMUNITY_KEY = "@vestige/community-drafts-v2";
export function createCommunityStore(storage: {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
}) {
  let queue: Promise<unknown> = Promise.resolve();
  const read = async () => parseCommunity(await storage.getItem(COMMUNITY_KEY));
  function mutate(edit: (state: CommunityLocal) => CommunityLocal) {
    const task = queue.then(async () => {
      const state = edit(await read());
      parseCommunity(JSON.stringify(state));
      await storage.setItem(COMMUNITY_KEY, JSON.stringify(state));
      return state;
    });
    queue = task.catch(() => {});
    return task;
  }
  return {
    // Explicit user deletion must also work if a stored draft is corrupted.
    clear: () => {
      const task = queue.then(async () => {
        const state = emptyCommunity();
        await storage.setItem(COMMUNITY_KEY, JSON.stringify(state));
        return state;
      });
      queue = task.catch(() => {});
      return task;
    },
    read: async () => {
      await queue;
      return read();
    },
    save: (draft: Draft) => {
      assertDraft(draft);
      return mutate((state) => ({
        ...state,
        drafts: [draft, ...state.drafts.filter((d) => d.id !== draft.id)],
      }));
    },
    remove: (id: string) =>
      mutate((state) => ({
        ...state,
        drafts: state.drafts.filter((d) => d.id !== id),
      })),
    toggleFavorite: (id: string) =>
      mutate((state) => ({
        ...state,
        favorites: state.favorites.includes(id)
          ? state.favorites.filter((v) => v !== id)
          : [...state.favorites, id],
      })),
  };
}
