import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { inspectGlb } from "../validate-glb.mjs";
const root = fileURLToPath(new URL("../../../", import.meta.url));
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
export function readModel(path) {
  const bytes = readFileSync(path);
  const size = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.toString("utf8", 20, 20 + size));
  const binStart = 28 + size;
  function accessor(index) {
    const item = json.accessors[index];
    const view = json.bufferViews[item.bufferView];
    if (item.componentType !== 5126)
      throw Error("Float32 accessor required for motion/weights audit");
    const channels = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }[
      item.type
    ];
    const result = [];
    const offset = binStart + (view.byteOffset ?? 0) + (item.byteOffset ?? 0);
    const stride = view.byteStride ?? channels * 4;
    for (let i = 0; i < item.count; i++)
      for (let j = 0; j < channels; j++)
        result.push(bytes.readFloatLE(offset + i * stride + j * 4));
    return { values: result, channels, count: item.count };
  }
  const image = json.images[0];
  const imageView = json.bufferViews[image.bufferView];
  const imageOffset = binStart + (imageView.byteOffset ?? 0);
  return {
    bytes,
    json,
    accessor,
    textureSha256: digest(
      bytes.subarray(imageOffset, imageOffset + imageView.byteLength),
    ),
    sha256: digest(bytes),
  };
}
export function auditCatia(project = root) {
  const original = readModel(
    resolve(project, "assets/avatars/source/catia/avatar.glb"),
  );
  if (
    original.sha256 !==
    "9c3e5b819423af36553d94b7fc01d7e1f4c4f8ad721074b5e23eb2f01055966c"
  )
    throw Error("Original Catia changed");
  const candidates = [30000, 25000, 20000].map((target) => {
    const file = `assets/avatars/catia/mobile/catia-${target}.glb`;
    const model = readModel(resolve(project, file));
    const structure = inspectGlb(model.bytes);
    if (structure.triangles < 15000 || structure.triangles > 30000)
      throw Error("Triangle budget invalid");
    if (model.textureSha256 !== original.textureSha256)
      throw Error("Original texture changed");
    if ((model.json.skins ?? []).length || (model.json.animations ?? []).length)
      throw Error("Static optimization unexpectedly has a rig/clip");
    return {
      file,
      triangles: structure.triangles,
      bytes: model.bytes.length,
      sha256: model.sha256,
      textureSha256: model.textureSha256,
    };
  });
  const file = "assets/avatars/catia/rig-lab/catia-motion-trials.glb";
  const rig = readModel(resolve(project, file));
  const structure = inspectGlb(rig.bytes);
  if (!structure.valid)
    throw Error(
      "Experimental rig is structurally invalid: " +
        structure.errors.join("; "),
    );
  const clips = rig.json.animations.map((animation) => {
    let movingChannels = 0;
    for (const channel of animation.channels) {
      const data = rig.accessor(animation.samplers[channel.sampler].output);
      if (
        data.values.some(
          (v, i) => Math.abs(v - data.values[i % data.channels]) > 1e-6,
        )
      )
        movingChannels++;
    }
    if (!movingChannels) throw Error("Empty or static clip: " + animation.name);
    return {
      name: animation.name,
      channels: animation.channels.length,
      movingChannels,
    };
  });
  if (
    !["idle", "walk", "run"].every((name) =>
      clips.some((clip) => clip.name === name),
    )
  )
    throw Error("Required clips missing");
  let vertexCount = 0;
  for (const mesh of rig.json.meshes)
    for (const primitive of mesh.primitives) {
      const weights = rig.accessor(primitive.attributes.WEIGHTS_0);
      vertexCount += weights.count;
      for (let i = 0; i < weights.values.length; i += 4) {
        const sum = weights.values.slice(i, i + 4).reduce((a, b) => a + b, 0);
        if (!Number.isFinite(sum) || Math.abs(sum - 1) > 0.001)
          throw Error("Invalid or missing skin weights");
      }
    }
  return {
    originalPreserved: true,
    originalSha256: original.sha256,
    texturePreserved: true,
    candidates,
    selected: candidates[1],
    experimentalRig: {
      file,
      sha256: rig.sha256,
      triangles: structure.triangles,
      bones: structure.bones,
      vertexCount,
      clips,
      bytes: rig.bytes.length,
    },
    mapEnabled: false,
    artApproved: false,
    deviceTested: false,
  };
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const report = auditCatia();
    const rig = JSON.parse(
      readFileSync(
        resolve(root, "assets/avatars/catia/rig-lab/rig-audit.json"),
        "utf8",
      ),
    );
    const qualityIssues = rig.clips
      .filter((clip) => !clip.groundCheckPassed || !clip.stretchCheckPassed)
      .map(
        (clip) =>
          `${clip.name === "walk" ? "Marche" : clip.name === "run" ? "Course" : "Attente"} : déformations ou contacts au sol à corriger.`,
      );
    const status = {
      name: "Catia",
      originalSha256: report.originalSha256,
      sourcePreserved: true,
      optimizedTriangles: report.selected.triangles,
      optimizedBytes: report.selected.bytes,
      textureWidth: 2048,
      textureHeight: 2048,
      hasSkeleton: report.experimentalRig.bones === 17,
      hasWeights: rig.weightCoverage === 1,
      actualClips: report.experimentalRig.clips.map((clip) => clip.name),
      deformationReviewed: false,
      artApproved: false,
      iosDeviceTested: false,
      androidDeviceTested: false,
      mapEnabled: false,
      stage: "experimental",
      qualityIssues,
      note: "Rig et mouvements expérimentaux ; aucune activation sur la carte.",
    };
    writeFileSync(
      resolve(root, "src/data/avatars/catia.json"),
      JSON.stringify(status, null, 2) + "\n",
    );
    writeFileSync(
      resolve(root, "docs/avatars/catia/technical-audit.json"),
      JSON.stringify(report, null, 2) + "\n",
    );
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
