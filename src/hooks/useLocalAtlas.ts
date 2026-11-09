import { useEffect, useState } from "react";
import { Asset } from "expo-asset";
import { Directory, File, Paths } from "expo-file-system";
import { atlasTiles } from "../data/atlasTiles";
import manifest from "../../assets/atlas/manifest.json";
// One preparation per version, independent of GPS. Files remain available offline.
let preparation: Promise<string> | null = null;
export function useLocalAtlas(enabled: boolean) {
  const [path, setPath] = useState<string | null>(null);
  const [status, setStatus] = useState(
    "Fond natif disponible pendant la préparation.",
  );
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const root = new Directory(
      Paths.document,
      `vestige-atlas-${manifest.version}`,
    );
    if (!preparation)
      preparation = (async () => {
        root.create({ intermediates: true, idempotent: true });
        for (let i = 0; i < atlasTiles.length; i += 8) {
          await Promise.all(
            atlasTiles.slice(i, i + 8).map(async (tile) => {
              const dir = new Directory(root, `${tile.z}`, `${tile.x}`);
              dir.create({ intermediates: true, idempotent: true });
              const target = new File(dir, `${tile.y}.png`);
              if (!target.exists) {
                const asset = Asset.fromModule(tile.asset);
                await asset.downloadAsync();
                if (!asset.localUri) throw new Error("Tuile indisponible");
                new File(asset.localUri).copy(target);
              }
            }),
          );
          if (alive)
            setStatus(
              `Préparation atlas : ${Math.min(i + 8, atlasTiles.length)}/${atlasTiles.length}`,
            );
        }
        return (
          decodeURIComponent(root.uri.replace(/^file:\/\//, "")) +
          "/{z}/{x}/{y}.png"
        );
      })().catch((error) => {
        preparation = null;
        throw error;
      });
    void preparation
      .then((value) => {
        if (alive) {
          setPath(value);
          setStatus(
            "Atlas local prêt · Vienne et Saint-Romain · 2,5D pré-dessinée.",
          );
        }
      })
      .catch(() => {
        if (alive)
          setStatus(
            "Préparation interrompue : fond natif actif. Désactivez puis réactivez pour réessayer.",
          );
      });
    return () => {
      alive = false;
    };
  }, [enabled]);
  return { path, status, bounds: manifest.bounds };
}
