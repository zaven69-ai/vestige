import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// @ts-ignore Node asset scripts are ES modules.
import {
  validatePack,
  validateRgbaPng,
} from "../scripts/avatars/register-pack.mjs";
import {
  avatarCharacters,
  readAvatarChoice,
  serializeAvatarChoice,
} from "../src/lib/avatars/catalogue.ts";
import { avatarSpec } from "../src/lib/avatar.ts";
// @ts-ignore Node scripts are intentionally dependency-free ES modules.
import { inspectGlb, contract } from "../scripts/avatars/validate-glb.mjs";
function glb(data: unknown) {
  const text = Buffer.from(JSON.stringify(data));
  const padded = Buffer.alloc(Math.ceil(text.length / 4) * 4, 32);
  text.copy(padded);
  const bytes = Buffer.alloc(28 + padded.length + 16);
  bytes.write("glTF");
  bytes.writeUInt32LE(2, 4);
  bytes.writeUInt32LE(bytes.length, 8);
  bytes.writeUInt32LE(padded.length, 12);
  bytes.writeUInt32LE(0x4e4f534a, 16);
  padded.copy(bytes, 20);
  bytes.writeUInt32LE(16, 20 + padded.length);
  bytes.writeUInt32LE(0x004e4942, 24 + padded.length);
  return bytes;
}
function structuralFixture() {
  // Structural parser fixture, not a character or artistic asset.
  return {
    asset: { version: "2.0" },
    buffers: [{ byteLength: 16 }],
    nodes: [
      ...contract.requiredBones.map((name: string) => ({ name })),
      { skin: 0, mesh: 0 },
    ],
    skins: [
      {
        joints: contract.requiredBones.map((_: string, index: number) => index),
      },
    ],
    meshes: [
      {
        primitives: [
          { attributes: { POSITION: 0, JOINTS_0: 1, WEIGHTS_0: 2 } },
        ],
      },
    ],
    accessors: [{ count: 3 }, { count: 3 }, { count: 3 }, { count: 2 }],
    animations: ["idle", "walk"].map((name) => ({
      name,
      channels: [{ sampler: 0 }],
      samplers: [{ input: 3 }],
    })),
  };
}
test("six unique characters, with only Alex and Léa in the prototype", () => {
  assert.equal(new Set(avatarCharacters.map((c) => c.id)).size, 6);
  assert.deepEqual(
    avatarCharacters.filter((c) => c.stage === "prototype").map((c) => c.id),
    ["alex", "lea"],
  );
  assert.equal(avatarCharacters.find((c) => c.id === "nova")!.stage, "future");
});
test("avatar preference persists independently, never defaults silently to a new character", () => {
  assert.equal(readAvatarChoice(null), "legacy");
  for (const choice of ["legacy", "alex", "lea"] as const)
    assert.equal(readAvatarChoice(serializeAvatarChoice(choice)), choice);
  for (const raw of [
    "{broken",
    '{"version":1,"choice":"nova"}',
    '{"version":2,"choice":"alex"}',
    "[]",
  ])
    assert.throws(() => readAvatarChoice(raw));
});
test("a PNG, an unrigged GLB and external textures cannot masquerade as an animated character", () => {
  assert.throws(() => inspectGlb(Buffer.from("PNG file is not a 3D model")));
  const valid = structuralFixture();
  assert.equal(inspectGlb(glb(valid)).valid, true);
  assert.equal(inspectGlb(glb({ ...valid, skins: [] })).valid, false);
  assert.equal(
    inspectGlb(
      glb({ ...valid, images: [{ uri: "https://example.com/texture.png" }] }),
    ).valid,
    false,
  );
  assert.equal(
    inspectGlb(glb({ ...valid, animations: valid.animations.slice(0, 1) }))
      .valid,
    false,
  );
  assert.equal(
    inspectGlb(glb({ ...valid, nodes: [{ name: "WrongRig" }] })).valid,
    false,
  );
});
test("render contract preserves legacy size, feet anchor and animation frame counts", () => {
  assert.equal(contract.pixelWidth, avatarSpec.width * 2);
  assert.equal(contract.pixelHeight, avatarSpec.height * 2);
  assert.equal(contract.feetPixelY / contract.pixelHeight, avatarSpec.anchor.y);
  assert.equal(contract.phases.idle.frames, avatarSpec.idleFrames);
  assert.equal(contract.phases.walk.frames, avatarSpec.walkFrames);
  assert.equal(contract.phases.idle.frameMs, avatarSpec.idleFrameMs);
  assert.equal(contract.phases.walk.frameMs, avatarSpec.walkFrameMs);
});
test("unapproved or source-mismatched packs are rejected before integration", () => {
  const folder = mkdtempSync(join(tmpdir(), "vestige-pack-test-"));
  try {
    const meta = {
      version: 1,
      sourceKind: "rigged-glb-render",
      artApprovedBy: "",
      artApprovedAt: "",
      license: "",
    };
    writeFileSync(join(folder, "pack.json"), JSON.stringify(meta));
    assert.throws(
      () => validatePack(folder, glb(structuralFixture())),
      /Validation artistique/,
    );
    writeFileSync(
      join(folder, "pack.json"),
      JSON.stringify({
        ...meta,
        artApprovedBy: "test",
        artApprovedAt: "2026-11-09",
        license: "test-fixture-only",
        sourceSha256: "wrong",
      }),
    );
    assert.throws(
      () => validatePack(folder, glb(structuralFixture())),
      /ne correspond pas/,
    );
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

test("a PNG header without image pixels cannot pass the pack gate", () => {
  const header = Buffer.alloc(33);
  Buffer.from("89504e470d0a1a0a", "hex").copy(header);
  header.writeUInt32BE(160, 16);
  header.writeUInt32BE(208, 20);
  header[24] = 8;
  header[25] = 6;
  assert.throws(() => validateRgbaPng(header, 160, 208));
});
