// Original miniature illustrations, based on the present-day silhouettes.
// Decorative gold is architecture/light, never proof of verification.
const fs = require("node:fs"),
  path = require("node:path");
const { Resvg } = require("@resvg/resvg-js");
const { artwork, statuses } = require("./build-markers.cjs");
const root = path.resolve(__dirname, "../..");
const miniatures = {
  auguste:
    '<path d="m13 24 13-8 13 8-3 2H16z" fill="#B2A58B"/><path d="m15 23 11-6 11 6z" fill="#E1C889"/><path d="M16 38h20l3 3H13z" fill="#918778"/><path d="M18 26v11m5-11v11m6-11v11m5-11v11" stroke="#E6D2A5" stroke-width="2.4"/>',
  "theatre-vienne":
    '<path d="M12 25q14 21 28 0v7Q26 48 12 32z" fill="#887F77"/><path d="M13 23q13 20 26 0M13 28q13 19 26 0M15 34q11 12 22 0" stroke="#D8C49D"/><path d="M17 23v-4h5v7m5 1v-7h5v5m4 1v-6h3v4" stroke="#AFA28A"/><path d="M22 35q4 3 8 0" stroke="#E6AD4F"/>',
  "saint-maurice":
    '<path d="M15 40V24l8-7h7l7 7v16z" fill="#9A968A"/><path d="M21 39V15h10v24" fill="#B6AD96"/><path d="m19 16 7-6 7 6" fill="#677888"/><path d="M24 20v8m4-8v8M17 28v8m18-8v8M24 40v-7q2-4 4 0v7" stroke="#364659"/><path d="M25 11V8m-2 2h5" stroke="#DAC58C"/>',
  "saint-andre":
    '<path d="M13 31h21v9H13z" fill="#A89B83"/><path d="m12 31 10-6 12 6" fill="#8C7566"/><path d="M29 40V17h8v23z" fill="#C4B38E"/><path d="m28 17 5-6 5 6" fill="#75808D"/><path d="M31 20v5m4-5v5M17 40v-6m5 6v-6m5 6v-6" stroke="#3D4E61"/>',
  fourviere:
    '<path d="M15 40V21h22v19z" fill="#BFC0B4"/><path d="M12 40V18h5v22m18 0V18h5v22" fill="#E2D2AA"/><path d="m11 18 3-7 4 7m16 0 3-7 4 7" fill="#6B8B9E"/><path d="M21 24v-7q5-8 10 0v7" fill="#A1B7B7"/><path d="M22 40v-8q4-6 8 0v8" fill="#384B65"/><path d="M26 12V8m-2 2h4M18 27h16" stroke="#EACF8C"/>',
  "theatre-lyon":
    '<path d="M12 24q14 22 28 0v9Q26 49 12 33z" fill="#848C83"/><path d="M13 23q13 20 26 0m-26 5q13 18 26 0m-24 6q11 11 22 0" stroke="#D7C59F"/><path d="M17 25v-6h7v10m5 0v-8h6v5" stroke="#9B9C89"/><path d="M11 28v-8m-2 3 2-4 3 4" stroke="#4E9B92"/>',
  "saint-jean":
    '<path d="M15 40V21h22v19z" fill="#B0AA94"/><path d="M13 40V16h7v24m12 0V16h7v24" fill="#CFC3A0"/><path d="M13 15v-3m3 3v-3m4 3v-3m12 3v-3m4 3v-3m3 3v-3" stroke="#BDB49D"/><circle cx="26" cy="25" r="3" fill="#4F799A" stroke="#E3CA91"/><path d="M23 40v-7q3-5 6 0v7" fill="#35455F"/>',
  amphitheatre:
    '<ellipse cx="26" cy="30" rx="15" ry="9" fill="#9A9D86"/><ellipse cx="26" cy="28" rx="14" ry="8" stroke="#D5C49B"/><ellipse cx="26" cy="29" rx="10" ry="5" fill="#677A70" stroke="#B6B59A"/><ellipse cx="26" cy="30" rx="6" ry="3" fill="#B7AA89"/><path d="M14 32v5m5-3v6m7-5v6m7-7v6m5-8v5M14 26l3-7h5m11 5-1-5h5" stroke="#DBCCAA"/>',
};
fs.mkdirSync(path.join(root, "assets/poi/landmarks"), { recursive: true });
let registry =
  '// Generated miniature assets. Illustrations, not historical reconstructions.\nimport type { ImageSourcePropType } from "react-native";\nimport type { PoiStatus } from "../../lib/poi";\nexport const landmarkAssets: Record<string, Record<PoiStatus, ImageSourcePropType>> = {\n';
for (const [id, drawing] of Object.entries(miniatures)) {
  registry += `"${id}":{\n`;
  for (const status of Object.keys(statuses)) {
    const svg = artwork("temple", status, drawing),
      file = `assets/poi/landmarks/${id}-${status}`;
    fs.writeFileSync(path.join(root, file + ".svg"), svg);
    fs.writeFileSync(
      path.join(root, file + ".png"),
      new Resvg(svg).render().asPng(),
    );
    registry += `${status}:require("../../../${file}.png"),\n`;
  }
  registry += "},\n";
}
fs.writeFileSync(
  path.join(root, "src/components/poi/landmarks.ts"),
  registry + "};\n",
);
