import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import {
  avatarFacing,
  avatarSpec,
  walkingDeadline,
} from "../src/lib/avatar.ts";
import { playerDirection } from "../src/lib/exploration.ts";
const now = 1_800_000_000_000;
const before = {
  latitude: 45.5255,
  longitude: 4.8742,
  accuracy: 10,
  timestamp: now - 5000,
  speed: 0,
};
const moving = {
  ...before,
  latitude: before.latitude + 0.00008,
  speed: 1.2,
  timestamp: now,
};
test("la marche suit deux relevés réels précis et expire rapidement sans nouvel échantillon", () => {
  const deadline = walkingDeadline(before, moving, now);
  assert.ok(deadline > now && deadline <= now + 6500);
  assert.equal(walkingDeadline(null, moving, now), 0);
  assert.equal(walkingDeadline(moving, moving, now), 0);
  assert.equal(walkingDeadline(before, { ...moving, speed: 0 }, now), 0);
  assert.equal(walkingDeadline(before, { ...moving, speed: 12 }, now), 0);
  assert.equal(
    walkingDeadline(
      before,
      { ...moving, latitude: before.latitude + 0.005 },
      now,
    ),
    0,
  );
  assert.equal(
    walkingDeadline(before, { ...moving, timestamp: now - 31000 }, now),
    0,
  );
});
test("une reprise de précision GPS et les dérives lentes ne déclenchent pas de marche", () => {
  assert.equal(walkingDeadline({ ...before, accuracy: 150 }, moving, now), 0);
  assert.equal(walkingDeadline(before, { ...moving, accuracy: 100 }, now), 0);
  assert.equal(walkingDeadline(before, { ...moving, speed: null }, now), 0);
  assert.ok(
    walkingDeadline(
      { ...before, accuracy: 2 },
      { ...moving, accuracy: 2, speed: null },
      now,
    ) > now,
  );
});
test("le cap de déplacement est prioritaire sur la boussole pendant la marche", () => {
  assert.equal(
    playerDirection(
      { degrees: 270, accuracy: 3, timestamp: now },
      { ...moving, heading: 90 },
      now,
    ),
    90,
  );
  assert.equal(
    playerDirection(
      { degrees: 270, accuracy: 3, timestamp: now },
      { ...moving, heading: 90, speed: 0 },
      now,
    ),
    270,
  );
});
test("les orientations écran tiennent compte de la rotation de carte sur les deux plateformes", () => {
  assert.equal(avatarFacing(0, 0), "n");
  assert.equal(avatarFacing(180, 0), "s");
  assert.equal(avatarFacing(90, 90), "n");
  assert.equal(avatarFacing(0, 90), "w");
  assert.equal(avatarFacing(359, 0), "n");
  assert.equal(avatarFacing(null, 0), "unknown");
  assert.equal(avatarFacing(NaN, 0), "unknown");
});
test("toutes les images locales ont des dimensions fixes et une transparence utilisable par les marqueurs", () => {
  const manifest = JSON.parse(
    readFileSync(
      new URL("../assets/avatars/archaeotech/manifest.json", import.meta.url),
      "utf8",
    ),
  );
  assert.deepEqual(manifest.logicalSize, [avatarSpec.width, avatarSpec.height]);
  assert.equal(manifest.idleFrames, avatarSpec.idleFrames);
  assert.equal(manifest.walkFrames, avatarSpec.walkFrames);
  assert.deepEqual(manifest.anchor, avatarSpec.anchor);
  let bytes = 0;
  for (const name of manifest.frameFiles) {
    const url = new URL(
      "../assets/avatars/archaeotech/" + name,
      import.meta.url,
    );
    const file = readFileSync(url);
    const density = name.includes("@3x") ? 3 : name.includes("@2x") ? 2 : 1;
    assert.equal(file.readUInt32BE(16), avatarSpec.width * density);
    assert.equal(file.readUInt32BE(20), avatarSpec.height * density);
    assert.equal(file[25], 6, "PNG RGBA avec fond transparent");
    bytes += statSync(url).size;
  }
  assert.equal(
    manifest.frameFiles.length,
    9 * (avatarSpec.idleFrames + avatarSpec.walkFrames) * 3,
  );
  assert.ok(
    bytes < 6 * 1024 * 1024,
    "Budget PNG total de 6 Mo sur les trois densités",
  );
});

test("une vitesse native négative est inconnue, pas une marche inventée", () => {
  assert.ok(
    walkingDeadline(
      { ...before, accuracy: 2 },
      { ...moving, accuracy: 2, speed: -1 },
      now,
    ) > now,
  );
  assert.equal(walkingDeadline(before, { ...moving, speed: -1 }, now), 0);
});
