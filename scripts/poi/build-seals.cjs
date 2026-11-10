// Separate UI overlays: decorative scene color never implies review or discovery.
const fs = require("node:fs"),
  path = require("node:path");
const { Resvg } = require("@resvg/resvg-js");
const { seal, statuses } = require("./build-markers.cjs");
const root = path.resolve(__dirname, "../..");
function save(folder, name, svg) {
  const dir = path.join(root, "assets/poi", folder);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name + ".svg"), svg);
  fs.writeFileSync(
    path.join(dir, name + ".png"),
    new Resvg(svg).render().asPng(),
  );
}
for (const status of Object.keys(statuses))
  save(
    "review",
    status,
    `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="30 29 24 24"><g fill="none" stroke="#F1F5FB" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${seal(status)}</g></svg>`,
  );
const drawings = {
  undiscovered:
    '<circle cx="12" cy="12" r="9" fill="#081626" stroke="#E5EBF3" stroke-width="1.6"/><path d="m15 8-2 6-5 2 2-6z" fill="none" stroke="#E5EBF3" stroke-width="1.3"/>',
  discovered:
    '<circle cx="12" cy="12" r="9" fill="#081626" stroke="#F6D47D" stroke-width="2"/><path d="m7 12 3 3 7-7" fill="none" stroke="white" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>',
  completed:
    '<circle cx="12" cy="12" r="9" fill="#081626" stroke="#F6D47D" stroke-width="2"/><path d="m5 13 2 2 4-5m0 3 2 2 5-5" fill="none" stroke="#FFF1BA" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
};
for (const [name, drawing] of Object.entries(drawings))
  save(
    "discovery",
    name,
    `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 24 24">${drawing}</svg>`,
  );
