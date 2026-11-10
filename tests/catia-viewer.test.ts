import { catiaScene } from "../src/lib/avatars/catiaScene.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AnimationClip,
  NumberKeyframeTrack,
  Object3D,
  Group,
  Mesh,
  BufferGeometry,
  MeshBasicMaterial,
  Texture,
} from "three";
import { catiaPlayback } from "../src/lib/avatars/catiaPlayback.ts";
import {
  hasCatiaClips,
  viewerCamera,
  viewerDistance,
  viewerTilt,
} from "../src/lib/avatars/catiaViewer.ts";
const clips = ["idle", "walk", "run"].map(
  (name, index) =>
    new AnimationClip(name, 1, [
      new NumberKeyframeTrack(
        ".position[y]",
        [0, 1],
        [index * 2, index * 2 + 1],
      ),
    ]),
);
test("the actual viewer controller plays, freezes its current pose on pause and resumes", () => {
  const model = new Object3D();
  const player = catiaPlayback(model, clips);
  player.select("walk", false);
  assert.equal(model.position.y, 2);
  player.select("walk", true);
  player.update(0.05, true);
  const pose = model.position.y;
  assert.ok(pose > 2);
  player.select("walk", false);
  player.update(0.1, false);
  assert.equal(model.position.y, pose);
  player.select("walk", true);
  player.update(0.05, true);
  assert.ok(model.position.y > pose);
  player.dispose();
});
test("changing a paused clip displays its real first pose, and cleanup restores the model", () => {
  const model = new Object3D();
  const player = catiaPlayback(model, clips);
  player.select("run", false);
  assert.equal(model.position.y, 4);
  player.select("idle", false);
  assert.equal(model.position.y, 0);
  player.select("walk", false);
  assert.equal(model.position.y, 2);
  player.dispose();
  assert.equal(model.position.y, 0);
});
test("the viewer rejects missing animations and ignores invalid time steps", () => {
  assert.equal(hasCatiaClips(clips), true);
  assert.equal(hasCatiaClips(clips.slice(0, 2)), false);
  assert.throws(() => catiaPlayback(new Object3D(), clips.slice(0, 2)));
  const model = new Object3D();
  const player = catiaPlayback(model, clips);
  player.select("walk", false);
  for (const delta of [NaN, Infinity, -1]) player.update(delta, true);
  assert.equal(model.position.y, 2);
  player.dispose();
});
test("camera zoom and tilt remain finite, including malformed input", () => {
  for (const distance of [NaN, Infinity, -100, 100, 2])
    for (const tilt of [NaN, Infinity, -50, 50, 0.1]) {
      assert.ok(
        viewerDistance(distance) >= 1.4 && viewerDistance(distance) <= 4.5,
      );
      assert.ok(viewerTilt(tilt) >= -0.12 && viewerTilt(tilt) <= 0.5);
      const camera = viewerCamera(distance, tilt);
      assert.ok(Object.values(camera).every(Number.isFinite));
    }
});

test("viewer instances own their disposable resources without altering the loaded model", () => {
  const source = new Group();
  const texture = new Texture();
  Object.assign(texture, { isDataTexture: true });
  const original = new Mesh(
    new BufferGeometry(),
    new MeshBasicMaterial({ map: texture }),
  );
  source.add(original);
  const instance = catiaScene(source);
  const copy = instance.children[0] as Mesh<BufferGeometry, MeshBasicMaterial>;
  assert.notEqual(copy, original);
  assert.notEqual(copy.geometry, original.geometry);
  assert.notEqual(copy.material, original.material);
  assert.notEqual(copy.material.map, texture);
  assert.equal(
    (copy.material.map as Texture & { isDataTexture?: boolean }).isDataTexture,
    true,
  );
  assert.equal(original.material.map, texture);
});
