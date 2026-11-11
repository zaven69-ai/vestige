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
const glyph = (category, mode = "idle") =>
  `<img width="64" height="72" alt="" src="../../assets/poi/map-pins/${category}-${mode}@3x.png">`;
const html = `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vestige · Repères de carte</title><style>*{box-sizing:border-box}body{margin:0;background:#081626;color:#fff;font:15px system-ui}main{max-width:720px;margin:auto;padding:24px 18px}h1,h2{color:#F4DEAA}h1{font:600 28px Georgia}h2{font-size:18px;margin-top:30px}p{color:#B4C0D9;line-height:1.6}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.cell{padding:12px;background:#10233A;border:1px solid #304565;border-radius:18px;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;font-size:13px;line-height:1.4}.row{display:flex;align-items:center;gap:14px;padding:6px 0}.cluster{width:42px;height:42px;border-radius:21px;border:1.5px solid #DECBA4;background:#162639;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:800;flex:none}.cluster small{font-weight:400;font-size:9px;color:#E8CD8E}</style><main><h1>Repères de carte</h1><p>Pictogrammes des catégories et états de découverte utilisés sur la carte.</p><div class="grid">${Object.entries(
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
      `<div class="row">${glyph("temple", mode)}<span>${label}</span></div>`,
  )
  .join(
    "",
  )}<p>Le statut de vérification est indiqué dans la fiche du lieu.</p><h2>Regroupement</h2><div class="row"><div class="cluster"><span>8</span></div><span>Dans l’application, le chiffre indique le nombre réel de membres du groupe. Toucher pour agrandir ou choisir un lieu.</span></div><p>Dans Options de la carte → Rendu des lieux : version et nombres réels de lieux isolés et regroupements de la zone.</p></main></html>`;
fs.writeFileSync(path.join(root, "docs/design/poi-native-preview.html"), html);
