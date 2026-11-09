import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const root = new URL("../", import.meta.url);
const load = (path: string) => readFileSync(new URL(path, root));
const manifest = JSON.parse(load("assets/brand/exports.json").toString());
const hash = (bytes: Buffer) =>
  createHash("sha256").update(bytes).digest("hex");
test("le logo officiel original reste strictement inchangé", () => {
  const source = load(manifest.source);
  assert.equal(
    hash(source),
    "ce19ec5101008381614299b13a867717d1ffaab9736afdd0736670cdbb1e7c9c",
  );
  assert.equal(hash(source), manifest.sourceSha256);
  assert.equal(source.readUInt32BE(16), 1339);
  assert.equal(source.readUInt32BE(20), 1174);
});
test("les exports sont carrés, opaques pour iOS et proportionnels sans recadrage", () => {
  for (const item of manifest.exports) {
    const bytes = load(item.path);
    assert.equal(hash(bytes), item.sha256);
    assert.equal(bytes.readUInt32BE(16), item.canvas[0]);
    assert.equal(bytes.readUInt32BE(20), item.canvas[1]);
    assert.equal(item.canvas[0], item.canvas[1]);
    assert.equal(bytes[25], item.mode === "RGB" ? 2 : 6);
    const expectedHeight =
      (item.content[0] * manifest.sourceSize[1]) / manifest.sourceSize[0];
    assert.ok(Math.abs(expectedHeight - item.content[1]) <= 1);
    for (const axis of [0, 1])
      assert.ok(
        item.offset[axis] >= 0 &&
          item.offset[axis] + item.content[axis] <= item.canvas[axis],
      );
  }
  assert.equal(
    manifest.exports.find((e: { path: string }) =>
      e.path.endsWith("app-icon-1024.png"),
    ).mode,
    "RGB",
  );
});
