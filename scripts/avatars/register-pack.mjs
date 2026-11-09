import { crc32, inflateSync } from "node:zlib";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { contract, inspectGlb } from "./validate-glb.mjs";
import { createHash } from "node:crypto";
const root = fileURLToPath(new URL("../../", import.meta.url));
export function validateRgbaPng(bytes, width, height) {
  if (
    bytes.length < 33 ||
    bytes.toString("hex", 0, 8) !== "89504e470d0a1a0a" ||
    bytes.readUInt32BE(16) !== width ||
    bytes.readUInt32BE(20) !== height ||
    bytes[24] !== 8 ||
    bytes[25] !== 6 ||
    bytes[28] !== 0
  )
    throw Error("PNG RGBA 8 bits non entrelacé requis");
  const data = [];
  let end = false;
  for (let offset = 8; offset + 12 <= bytes.length;) {
    const length = bytes.readUInt32BE(offset);
    const next = offset + length + 12;
    if (next > bytes.length) throw Error("Chunk PNG tronqué");
    if (
      crc32(bytes.subarray(offset + 4, offset + 8 + length)) !==
      bytes.readUInt32BE(offset + 8 + length)
    )
      throw Error("CRC PNG invalide");
    const kind = bytes.toString("ascii", offset + 4, offset + 8);
    if (kind === "IDAT")
      data.push(bytes.subarray(offset + 8, offset + 8 + length));
    if (kind === "IEND") {
      end = true;
      break;
    }
    offset = next;
  }
  if (!end || !data.length) throw Error("PNG incomplet");
  const expected = height * (1 + width * 4);
  const decoded = inflateSync(Buffer.concat(data), {
    maxOutputLength: expected + 1,
  });
  if (decoded.length !== expected) throw Error("Pixels PNG incomplets");
  for (let row = 0; row < height; row++)
    if (decoded[row * (width * 4 + 1)] > 4) throw Error("Filtre PNG invalide");
}
export function validatePack(folder, source) {
  const metadata = JSON.parse(
    readFileSync(resolve(folder, "pack.json"), "utf8"),
  );
  if (metadata.version !== 1 || metadata.sourceKind !== "rigged-glb-render")
    throw Error("Pack de rendus GLB requis");
  if (
    !metadata.artApprovedBy?.trim() ||
    !metadata.artApprovedAt ||
    !metadata.license?.trim()
  )
    throw Error("Validation artistique et droits requis dans pack.json");
  if (!inspectGlb(source).valid) throw Error("Modèle GLB source invalide");
  if (
    metadata.sourceSha256 !== createHash("sha256").update(source).digest("hex")
  )
    throw Error("Le rendu ne correspond pas au GLB source");
  const files = [
    "portrait.png",
    ...contract.facings.flatMap((f) =>
      Object.entries(contract.phases).flatMap(([p, s]) =>
        Array.from({ length: s.frames }, (_, i) => `${f}-${p}-${i}.png`),
      ),
    ),
  ];
  for (const name of files) {
    const bytes = readFileSync(resolve(folder, name));
    const width =
      name === "portrait.png" ? contract.portraitSize : contract.pixelWidth;
    const height =
      name === "portrait.png" ? contract.portraitSize : contract.pixelHeight;
    try {
      validateRgbaPng(bytes, width, height);
    } catch (error) {
      throw Error(name + ": " + error.message);
    }
  }
  return metadata;
}
export function registerPacks(project = root) {
  const entries = [];
  for (const id of ["alex", "lea"]) {
    const folder = resolve(project, "assets/avatars/characters", id);
    if (!existsSync(resolve(folder, "pack.json"))) continue;
    const source = readFileSync(
      resolve(project, "assets/avatars/source", id, "avatar.glb"),
    );
    const meta = validatePack(folder, source);
    if (meta.character !== id)
      throw Error("Identité du pack incohérente : " + id);
    const prefix = "../../../" + relative(project, folder).split(sep).join("/");
    const spriteCode =
      "{" +
      contract.facings
        .map(
          (f) =>
            `${JSON.stringify(f)}:{${Object.entries(contract.phases)
              .map(
                ([p, s]) =>
                  `${p}:[${Array.from({ length: s.frames }, (_, i) => `require(${JSON.stringify(prefix + "/" + f + "-" + p + "-" + i + ".png")})`).join(",")}]`,
              )
              .join(",")}}`,
        )
        .join(",") +
      "}";
    entries.push(
      `${JSON.stringify(id)}:{sourceKind:'rigged-glb-render',sourceSha256:${JSON.stringify(meta.sourceSha256)},artApprovedBy:${JSON.stringify(meta.artApprovedBy)},portrait:require(${JSON.stringify(prefix + "/portrait.png")}),sprites:${spriteCode}}`,
    );
  }
  // All packs are checked before overwriting the registry. Failed import keeps the working registry.
  writeFileSync(
    resolve(project, "src/data/avatars/packs.ts"),
    `// Generated approved 3D-source renders. Never edit by hand.\nimport type { AvatarPack } from '../../lib/avatars/pack';\nimport type { PrototypeAvatarId } from '../../lib/avatars/catalogue';\nexport const characterPacks: Partial<Record<PrototypeAvatarId, AvatarPack>> = {${entries.join(",\n")}};\n`,
  );
  return entries.length;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    console.log(registerPacks(), "approved packs registered");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
