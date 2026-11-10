/** Validate the Metro module before handing a component to React.
 * Keep this helper free of native imports so the fallback survives load errors.
 */
export function catiaPreviewExport(module: unknown): () => import("react").ReactNode {
  const exports = module as { Catia3DPreview?: unknown; default?: unknown } | null;
  const component = exports?.Catia3DPreview ?? exports?.default;
  if (typeof component !== "function") {
    throw new Error(
      "[Catia module] Le module du lecteur 3D n’exporte pas de composant valide. Rechargez Expo Go après avoir vidé le cache Metro.",
    );
  }
  return component as () => import("react").ReactNode;
}
