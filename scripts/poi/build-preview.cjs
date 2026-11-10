// Browser review board of production PNGs; not a screenshot of the native map.
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const root = path.resolve(__dirname, "../..");
const exportsObject = {};
new Function(
  "exports",
  ts.transpileModule(
    fs.readFileSync(path.join(root, "src/lib/poi.ts"), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText,
)(exportsObject);
const p = exportsObject;
const glyph = (category, status, progress = "none") =>
  `<span class="glyph ${progress}"><img alt="" src="../../assets/poi/${category}-${status}.png">${progress === "discovered" ? "<b>✓</b>" : ""}</span>`;
const html = `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vestige · contrôle POI</title><style>*{box-sizing:border-box}body{margin:0;background:#081626;color:#fff;font:15px system-ui,sans-serif}main{padding:24px 18px;max-width:620px;margin:auto}small,p{color:#B4C0D9;line-height:1.6}h1{font-size:28px;letter-spacing:-1px;margin:5px 0}h2{font-size:18px;margin-top:28px}.label{font-size:11px;letter-spacing:3px;color:#26CAD8}.card{padding:18px;background:linear-gradient(135deg,#1e2c49,#0b1b32);border:1px solid #304565;border-radius:22px;margin:20px 0}.row{display:flex;align-items:center;gap:14px;padding:7px 0;min-height:64px}.row span:last-child{flex:1;line-height:1.5}.glyph{position:relative;display:inline-flex;width:52px;height:56px;flex:none}.glyph img{width:52px;height:56px}.glyph b{position:absolute;top:1px;left:1px;font-size:10px;border:1px solid white;border-radius:9px;width:17px;height:17px;text-align:center;background:#081626}.nearby:before,.selected:before{content:'';position:absolute;left:0;right:0;top:2px;bottom:3px;border:1.5px solid #F77B54;border-radius:25px}.selected:before{border-color:white}.categories{display:grid;grid-template-columns:1fr 1fr;gap:12px}.categories .row{gap:4px;font-size:12px}a{color:#26CAD8}.notice{border-left:2px solid #8596A9;padding-left:12px;font-size:13px}</style><main><div class="label">VESTIGE · SYSTÈME POI V1</div><h1>Chaque lieu a son histoire.</h1><p>Planche de contrôle des assets de production. Ce n’est pas une capture de carte native ni une validation iPhone.</p><section class="card"><small>VIENNE · ANTIQUITÉ</small><h2>Temple d’Auguste et de Livie</h2><div class="row">${glyph("temple", "editorial_unreviewed", "selected")}<span>Temple et vestiges<br><small>Éditorial · à contrôler</small></span></div><p class="notice">Source disponible ≠ information vérifiée. Les huit fiches initiales ne sont pas marquées vérifiées.</p></section><h2>La catégorie au centre</h2><div class="categories">${p.poiCategories.map((id) => `<div class="row">${glyph(id, "imported_unreviewed")}<span>${p.categoryLabels[id]}</span></div>`).join("")}</div><h2>Le sceau indique le contrôle</h2>${p.poiStatuses.map((id) => `<div class="row">${glyph("other", id)}<span>${p.statusLabels[id]}</span></div>`).join("")}<p class="notice">Exemples de légende. Aucun contributeur ni lieu vérifié n’est inventé dans le catalogue.</p><h2>Votre progression, séparément</h2>${[
  ["none", "À découvrir"],
  ["nearby", "À portée · halo corail"],
  ["discovered", "Découvert · coche blanche"],
  ["selected", "Sélection · halo blanc"],
]
  .map(
    ([progress, label]) =>
      `<div class="row">${glyph("temple", "imported_unreviewed", progress)}<span>${label}</span></div>`,
  )
  .join(
    "",
  )}<p>Le sceau document « ? » reste visible après découverte. Découvrir n’est pas vérifier.</p></main></html>`;
fs.writeFileSync(path.join(root, "docs/design/poi-preview.html"), html);
