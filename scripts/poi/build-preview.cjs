// Review board of the exact PNG layers consumed by PoiGlyph, not a native map screenshot.
const fs = require("node:fs"),
  path = require("node:path"),
  ts = require("typescript");
const root = path.resolve(__dirname, "../.."),
  p = {};
new Function(
  "exports",
  ts.transpileModule(
    fs.readFileSync(path.join(root, "src/lib/poi.ts"), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText,
)(p);
function glyph(
  category,
  status = "imported_unreviewed",
  progress = "none",
  size = 68,
) {
  const discovery =
    progress === "nearby" || progress === "selected"
      ? "undiscovered"
      : progress === "none"
        ? "undiscovered"
        : progress;
  return `<span class="glyph ${progress}" style="--size:${size}px"><img class="scene" alt="" src="../../assets/poi/illustrated/${category}.png"><img class="review" alt="" src="../../assets/poi/review/${status}.png"><img class="discovery" alt="" src="../../assets/poi/discovery/${discovery}.png"></span>`;
}
const html = `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vestige · illustrations POI</title><style>*{box-sizing:border-box}body{margin:0;background:#081626;color:#fff;font:15px system-ui,sans-serif}main{padding:24px 18px;max-width:850px;margin:auto}h1{font:600 30px Georgia,serif;color:#F4DEAA;letter-spacing:-.5px}h2{font-size:18px;color:#F4DEAA;margin-top:30px}p,small{color:#B4C0D9;line-height:1.6}.label{font-size:11px;letter-spacing:3px;color:#D5B777}.card{padding:18px;background:linear-gradient(140deg,#1d304d,#0b182e);border:1px solid #8A744A;border-radius:22px;margin:20px 0}.categories{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.category{background:#10233A;border:1px solid #304565;border-radius:20px;padding:12px 8px;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;font-size:13px;line-height:1.4}.row{display:flex;gap:16px;align-items:center;min-height:80px}.row span:last-child{flex:1;line-height:1.5}.glyph{position:relative;display:inline-block;flex:none;width:var(--size);height:calc(var(--size)*56/52)}.glyph .scene{width:100%;height:100%;object-fit:contain}.glyph .review{position:absolute;right:-1px;bottom:5px;width:calc(var(--size)*.34);height:calc(var(--size)*.34);object-fit:contain}.glyph .discovery{position:absolute;top:0;left:-1px;width:calc(var(--size)*.3);height:calc(var(--size)*.3);object-fit:contain}.selected:before,.nearby:before{content:'';position:absolute;inset:0;border:1.5px solid #F5D281;border-radius:28px;background:#F5D2810D}.nearby:before{border-color:#F77B54}.map-size{display:flex;flex-wrap:wrap;gap:18px;padding:20px;background:linear-gradient(25deg,#102942,#081626);border-radius:18px}.notice{border-left:2px solid #8596A9;padding-left:12px;font-size:13px}@media(min-width:700px){.categories{grid-template-columns:repeat(4,1fr)}}</style><main><div class="label">VESTIGE · ASSETS DE PRODUCTION</div><h1>Des lieux à explorer.</h1><p>Sept illustrations individuelles à fond transparent. Planche de contrôle des vrais PNG et sceaux utilisés par l’application ; ce n’est pas une capture de carte native.</p><section class="categories">${p.poiCategories.map((id) => `<article class="category">${glyph(id, "imported_unreviewed", "none", 100)}<span>${p.categoryLabels[id]}</span></article>`).join("")}</section><p class="notice">Le cadre doré est décoratif. Ces images illustrent des catégories et ne sont pas des photographies documentaires ou des reconstitutions certifiées de monuments précis.</p><h2>À la taille de la carte · 52–62 px</h2><div class="map-size">${p.poiCategories.map((id, i) => glyph(id, "imported_unreviewed", i === 0 ? "selected" : "none", i === 0 ? 62 : 52)).join("")}</div><h2>Contrôle de l’information</h2>${p.poiStatuses.map((status) => `<div class="row">${glyph("temple", status)}<span>${p.statusLabels[status]}</span></div>`).join("")}<p class="notice">Exemples de légende. Un import OSM reste non vérifié. Aucun lieu du catalogue n’est certifié grâce à son illustration.</p><h2>Progression du joueur</h2>${[
  ["none", "À découvrir · boussole"],
  ["discovered", "Découvert · coche"],
  [
    "completed",
    "Complété · double coche, variante réservée à une future validation de contenu",
  ],
]
  .map(
    ([state, label]) =>
      `<div class="row">${glyph("temple", "imported_unreviewed", state)}<span>${label}</span></div>`,
  )
  .join(
    "",
  )}<p>Le document « ? » reste présent après découverte. Une découverte n’est pas une vérification historique.</p><section class="card"><div class="label">+ CONTRIBUER</div><h2>Préparer un lieu, une photo, une histoire sourcée</h2><p>Formulaire et brouillons locaux disponibles dans l’application. Publication et modération distantes non activées. Le partage natif ouvre une source publique sans transmettre le GPS du joueur.</p></section></main></html>`;
fs.writeFileSync(path.join(root, "docs/design/poi-preview.html"), html);
