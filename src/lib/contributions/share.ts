import { httpsUrl } from "./model.ts";
/** No universal Vestige host exists yet: use a working public source fallback.
 * Only catalogue fields enter this function; no GPS fix, account or journal.
 */
export function publicShare(poi: {
  name: string;
  source: string;
  sourceRefs?: { url: string }[];
}) {
  const candidates = [poi.source, ...(poi.sourceRefs ?? []).map((s) => s.url)];
  const url = candidates.find(
    (value) =>
      httpsUrl(value) &&
      /^(https:\/\/)([a-z-]+\.)?(wikipedia\.org|openstreetmap\.org|wikidata\.org|pop\.culture\.gouv\.fr)\//.test(
        value,
      ),
  );
  if (!url)
    throw Error("Aucun lien public de référence disponible pour ce lieu.");
  const parsed = new URL(url);
  parsed.search = "";
  parsed.hash = "";
  const publicUrl = parsed.toString();
  return {
    title: poi.name,
    message: `${poi.name}\nDécouvert avec Vestige · fiche source publique\n${publicUrl}`,
    url: publicUrl,
  };
}
