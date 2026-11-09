import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
export const contract = JSON.parse(
  readFileSync(
    new URL("../../assets/avatars/contract.json", import.meta.url),
    "utf8",
  ),
);
export function inspectGlb(bytes) {
  const errors = [];
  if (
    bytes.length < 20 ||
    bytes.toString("ascii", 0, 4) !== "glTF" ||
    bytes.readUInt32LE(4) !== 2 ||
    bytes.readUInt32LE(8) !== bytes.length
  )
    throw Error("GLB 2.0 tronqué ou invalide");
  if (bytes.length > contract.maxSourceBytes)
    errors.push("GLB supérieur à 12 Mo");
  const length = bytes.readUInt32LE(12);
  if (
    bytes.readUInt32LE(16) !== 0x4e4f534a ||
    length % 4 ||
    length + 20 > bytes.length
  )
    throw Error("Chunk JSON GLB invalide");
  const gltf = JSON.parse(bytes.toString("utf8", 20, 20 + length).trim());
  if (gltf.asset?.version !== "2.0") errors.push("Version glTF 2.0 requise");
  if (
    (gltf.buffers ?? []).some((b) => b.uri) ||
    (gltf.images ?? []).some((i) => i.uri)
  )
    errors.push("GLB autonome requis : aucune URI externe ou data URI");
  if ((gltf.extensionsRequired ?? []).length)
    errors.push("Extensions requises non prises en charge dans ce prototype");
  if (
    !gltf.buffers?.length ||
    bytes.length < 28 + length ||
    bytes.readUInt32LE(24 + length) !== 0x004e4942
  )
    errors.push("Chunk BIN embarqué requis");
  if (!gltf.skins?.length) errors.push("Squelette/skin absent");
  const skin = gltf.skins?.[0];
  const bones = (skin?.joints ?? []).map((index) => gltf.nodes?.[index]?.name);
  for (const bone of contract.requiredBones)
    if (!bones.includes(bone)) errors.push("Os canonique manquant : " + bone);
  let triangles = 0;
  let skinned = false;
  for (const mesh of gltf.meshes ?? [])
    for (const primitive of mesh.primitives ?? []) {
      if ((primitive.mode ?? 4) !== 4)
        errors.push("Primitives TRIANGLES requises");
      const accessor =
        gltf.accessors?.[primitive.indices ?? primitive.attributes?.POSITION];
      triangles += (accessor?.count ?? 0) / 3;
      if (
        primitive.attributes?.JOINTS_0 !== undefined &&
        primitive.attributes?.WEIGHTS_0 !== undefined
      )
        skinned = true;
    }
  if (
    !skinned ||
    !gltf.nodes?.some((n) => n.skin === 0 && n.mesh !== undefined)
  )
    errors.push("Maillage relié au squelette absent");
  if (!triangles || triangles > contract.maxTriangles)
    errors.push("Budget triangles invalide (maximum 35000)");
  const clips = (gltf.animations ?? []).map((a) => a.name);
  for (const phase of Object.keys(contract.phases)) {
    const animation = gltf.animations?.find((a) => a.name === phase);
    if (
      !animation ||
      !animation.channels?.length ||
      !animation.samplers?.some(
        (s) => (gltf.accessors?.[s.input]?.count ?? 0) > 1,
      )
    )
      errors.push("Clip animé manquant : " + phase);
  }
  return {
    valid: errors.length === 0,
    errors,
    triangles,
    bones: bones.length,
    clips,
    bytes: bytes.length,
    note: "Contrôle structurel uniquement ; anatomie, textures, déformations et qualité artistique doivent être validées visuellement.",
  };
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const report = inspectGlb(readFileSync(process.argv[2]));
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.valid ? 0 : 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
