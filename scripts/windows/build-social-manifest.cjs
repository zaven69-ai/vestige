// Maintainer tool: build a cumulative patch from the last pre-POI application.
// Never use the last delivery commit as the base: that omits unchanged V1 deps.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");
const root = path.resolve(__dirname, "../..");
const manifestPath = "scripts/windows/social-v2-update-files.json";
const base = "2916df9";
const git = (...args) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8" })
    .split("\0")
    .filter(Boolean);
const files = [
  ...new Set([
    ...git("diff", "--name-only", "-z", "--diff-filter=ACMR", base, "--"),
    ...git("ls-files", "--others", "--exclude-standard", "-z"),
  ]),
]
  .filter(
    (file) =>
      file !== manifestPath && fs.statSync(path.join(root, file)).isFile(),
  )
  .sort();
const entries = files.map((file) => ({
  path: file,
  sha256: crypto
    .createHash("sha256")
    .update(fs.readFileSync(path.join(root, file)))
    .digest("hex"),
}));
fs.writeFileSync(
  path.join(root, manifestPath),
  JSON.stringify(entries, null, 2) + "\n",
);
console.log(`Cumulative patch from ${base}: ${entries.length} files.`);
