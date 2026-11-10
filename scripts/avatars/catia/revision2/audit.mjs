import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { readModel } from "../audit.mjs";
import { inspectGlb } from "../../validate-glb.mjs";
const root = fileURLToPath(new URL("../../../../", import.meta.url));
export function auditRevision(project = root) {
  const folder = resolve(project, "assets/avatars/catia/rig-lab/revision-2");
  const model = readModel(resolve(folder, "catia-corrected.glb"));
  const report = JSON.parse(
    readFileSync(resolve(folder, "correction-report.json"), "utf8"),
  );
  const roundtrip = JSON.parse(
    readFileSync(resolve(folder, "roundtrip-report.json"), "utf8"),
  );
  const original = readModel(
    resolve(project, "assets/avatars/source/catia/avatar.glb"),
  );
  const sourceBlend = readFileSync(
    resolve(project, "assets/avatars/catia/rig-lab/catia-rig-workbench.blend"),
  );
  if (
    original.sha256 !==
    "9c3e5b819423af36553d94b7fc01d7e1f4c4f8ad721074b5e23eb2f01055966c"
  )
    throw Error("Original Catia changed");
  if (
    createHash("sha256").update(sourceBlend).digest("hex") !==
    report.sourceBlendSha256
  )
    throw Error("Source Blender changed");
  if (
    report.geometryBeforeSha256 !== report.geometryAfterSha256 ||
    report.neutralMaxPositionErrorMeters > 1e-5
  )
    throw Error("Neutral geometry/UV/appearance changed");
  if (original.textureSha256 !== model.textureSha256)
    throw Error("Original texture changed");
  const structure = inspectGlb(model.bytes);
  if (
    !structure.valid ||
    structure.triangles !== 24996 ||
    structure.bones !== 17
  )
    throw Error("Mobile GLB structure invalid");
  if (model.sha256 !== roundtrip.sha256 || !roundtrip.roundTripPassed)
    throw Error("Final GLB round-trip missing/mismatched");
  for (const set of [report.clips, roundtrip.clips])
    for (const clip of set) {
      if (
        !clip.stretchPassed ||
        !clip.groundPassed ||
        (clip.name !== "idle" && !clip.stanceContactPassed) ||
        clip.loopMaxPositionErrorMeters > 1e-5
      )
        throw Error("Motion checks failed: " + clip.name);
      if (clip.samples.some((s) => s.maxEdgeStretch >= 2))
        throw Error("Localized >2x edge stretch: " + clip.name);
      if (clip.samples.some((s) => s.maxSeamGapMeters > 0.00002))
        throw Error("UV seam continuity failed");
    }
  for (const mesh of model.json.meshes)
    for (const primitive of mesh.primitives) {
      const data = model.accessor(primitive.attributes.WEIGHTS_0);
      if (data.channels !== 4) throw Error("Four skin influences required");
      for (let i = 0; i < data.values.length; i += 4) {
        const weights = data.values.slice(i, i + 4);
        if (
          weights.some((w) => !Number.isFinite(w) || w < 0) ||
          Math.abs(weights.reduce((a, b) => a + b, 0) - 1) > 0.001
        )
          throw Error("Skin weight normalization failed");
      }
    }
  const clips = model.json.animations.map((animation) => {
    let moving = 0;
    let duration = 0;
    for (const channel of animation.channels) {
      const sampler = animation.samplers[channel.sampler];
      const times = model.accessor(sampler.input).values;
      if (
        times.some(
          (v, i) => !Number.isFinite(v) || (i > 0 && v <= times[i - 1]),
        )
      )
        throw Error("Animation timestamps invalid");
      duration = Math.max(duration, times.at(-1) - times[0]);
      const output = model.accessor(sampler.output);
      if (output.values.some((v) => !Number.isFinite(v)))
        throw Error("Nonfinite animation values");
      if (
        output.values.some(
          (v, i) => Math.abs(v - output.values[i % output.channels]) > 1e-6,
        )
      )
        moving++;
      if (channel.target.path === "rotation")
        for (let i = 0; i < output.values.length; i += 4) {
          const norm = Math.hypot(...output.values.slice(i, i + 4));
          if (Math.abs(norm - 1) > 0.001)
            throw Error("Non-unit animation quaternion");
        }
    }
    if (!moving) throw Error("Empty/static animation " + animation.name);
    return {
      name: animation.name,
      durationSeconds: duration,
      movingChannels: moving,
    };
  });
  if (
    !["idle", "walk", "run"].every((name) => clips.some((c) => c.name === name))
  )
    throw Error("Required corrected clips missing");
  const state = JSON.parse(
    readFileSync(resolve(project, "src/data/avatars/catia.json"), "utf8"),
  );
  if (
    state.mapEnabled !== false ||
    report.mapEnabled !== false ||
    report.productionApproved !== false
  )
    throw Error("Catia must remain inactive");
  return {
    sourcePreserved: true,
    neutralGeometryAndUVPreserved: true,
    texturePreserved: true,
    triangles: structure.triangles,
    bones: structure.bones,
    bytes: model.bytes.length,
    sha256: model.sha256,
    clips,
    blenderChecksPassed: true,
    glbRoundtripPassed: true,
    maximumAllowedEdgeStretch: 2,
    mapEnabled: false,
    deviceTested: false,
    productionApproved: false,
  };
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const result = auditRevision();
    writeFileSync(
      resolve(
        root,
        "assets/avatars/catia/rig-lab/revision-2/verification.json",
      ),
      JSON.stringify(result, null, 2) + "\n",
    );
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
