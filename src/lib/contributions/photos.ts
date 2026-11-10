import * as ImagePicker from "expo-image-picker";
import { Directory, File, Paths } from "expo-file-system";
export async function pickDraftPhoto(id: string) {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.8,
    allowsEditing: true,
    exif: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0],
    file = new File(asset.uri);
  if (file.size <= 0 || file.size > 5 * 1024 * 1024)
    throw Error("Choisissez une photo de 5 Mo maximum.");
  const bytes = await file.bytes();
  const mime =
    bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      ? "image/jpeg"
      : bytes[0] === 137 &&
          bytes[1] === 80 &&
          bytes[2] === 78 &&
          bytes[3] === 71
        ? "image/png"
        : String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
            String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP"
          ? "image/webp"
          : null;
  if (!mime)
    throw Error("Format non pris en charge. Choisissez JPEG, PNG ou WebP.");
  const directory = new Directory(
    Paths.document,
    "vestige-contribution-photos",
  );
  directory.create({ idempotent: true, intermediates: true });
  const extension =
    mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  const target = new File(directory, `${id}-${Date.now()}.${extension}`);
  file.copy(target);
  return { photoUri: target.uri, photoMime: mime, photoBytes: target.size };
}
export function removeDraftPhoto(uri?: string) {
  const directory = new Directory(
    Paths.document,
    "vestige-contribution-photos",
  );
  if (uri?.startsWith(directory.uri.replace(/\/?$/, "/"))) {
    const file = new File(uri);
    if (file.exists) file.delete();
  }
}

export function clearDraftPhotos() {
  const directory = new Directory(
    Paths.document,
    "vestige-contribution-photos",
  );
  if (directory.exists) directory.delete();
}
