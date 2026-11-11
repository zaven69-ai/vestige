// Document the exact small bitmaps passed to Marker.image, not the source art alone.
const fs = require("node:fs"),
  path = require("node:path");
const root = path.resolve(__dirname, "../..");
const categories = {
  temple: "Temple et vestiges",
  museum: "Musée",
  castle: "Château",
  religious: "Édifice religieux",
  industrial: "Patrimoine industriel",
  nature: "Nature",
  other: "Autre patrimoine",
};
const glyph = (category, status = "imported_unreviewed", mode = "idle") =>
  `<img width="64" height="72" alt="" src="../../assets/poi/map-native/${category}-${status}-${mode}@3x.png">`;
const html = `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vestige · V2.2 images natives</title><style>*{box-sizing:border-box}body{margin:0;background:#081626;color:#fff;font:15px system-ui}main{max-width:720px;margin:auto;padding:24px 18px}h1,h2{color:#F4DEAA}h1{font:600 28px Georgia}h2{font-size:18px;margin-top:30px}p{color:#B4C0D9;line-height:1.6}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.cell{padding:12px;background:#10233A;border:1px solid #304565;border-radius:18px;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;font-size:13px;line-height:1.4}.row{display:flex;align-items:center;gap:14px;padding:6px 0}.cluster{width:60px;height:60px;border-radius:30px;border:2px solid #CDB67C;background:#102C48;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:800;flex:none}.cluster small{font-weight:400;font-size:9px;color:#E8CD8E}</style><main><h1>V2.2 · Images natives</h1><p>Ces PNG de 64 × 72 points sont les fichiers fournis directement à <code>Marker.image</code>. Aucun assemblage de trois images dans le marqueur. Planche de contrôle, pas une capture iPhone.</p><div class="grid">${Object.entries(
  categories,
)
  .map(
    ([id, label]) =>
      `<div class="cell">${glyph(id)}<span>${label}</span></div>`,
  )
  .join("")}</div><h2>États réels conservés</h2>${[
  ["idle", "À découvrir"],
  ["nearby", "À portée"],
  ["discovered", "Découvert"],
  ["selected", "Sélectionné"],
  ["discovered-selected", "Découvert et sélectionné"],
]
  .map(
    ([mode, label]) =>
      `<div class="row">${glyph("temple", "imported_unreviewed", mode)}<span>${label}</span></div>`,
  )
  .join(
    "",
  )}<p>Le sceau d’import non vérifié reste présent, même après découverte.</p><h2>Contrôle indépendant</h2>${[
  ["editorial_verified", "Vérifié par la rédaction"],
  ["editorial_unreviewed", "Éditorial à contrôler"],
  ["imported_unreviewed", "Importé non vérifié"],
  ["community_unreviewed", "Communauté non contrôlée"],
  ["community_pending", "Communauté en attente (privé)"],
  ["community_verified", "Communauté vérifiée"],
]
  .map(
    ([status, label]) =>
      `<div class="row">${glyph("temple", status)}<span>${label}</span></div>`,
  )
  .join(
    "",
  )}<p>Exemples de variantes, aucune nouvelle vérification attribuée au catalogue.</p><h2>Regroupement</h2><div class="row"><div class="cluster"><span>▯▯▯</span><span>N</span><small>lieux</small></div><span>Dans l’application, N est le nombre réel de membres du groupe. Toucher pour agrandir ou choisir un lieu.</span></div><p>Dans Options de la carte → Rendu des lieux : version et nombres réels de lieux isolés et regroupements de la zone.</p></main></html>`;
fs.writeFileSync(path.join(root, "docs/design/poi-native-preview.html"), html);
