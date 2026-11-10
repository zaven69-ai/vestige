import { type Material, type Mesh, type Object3D, type Texture } from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
/** Each GL context owns an instance; disposing it cannot damage a cached scene or the next viewer. */
export function catiaScene(source: Object3D) {
  const instance = clone(source);
  const geometries = new Map<Mesh["geometry"], Mesh["geometry"]>();
  const materials = new Map<Material, Material>();
  const textures = new Map<Texture, Texture>();
  function copyMaterial(sourceMaterial: Material) {
    let result = materials.get(sourceMaterial);
    if (!result) {
      result = sourceMaterial.clone();
      materials.set(sourceMaterial, result);
      for (const [key, value] of Object.entries(sourceMaterial))
        if (value && (value as Texture).isTexture) {
          const texture = value as Texture;
          let copied = textures.get(texture);
          if (!copied) {
            copied = texture.clone();
            // Fiber's Expo loader marks URI-backed textures as data textures for EXGL uploads.
            if (
              (texture as Texture & { isDataTexture?: boolean }).isDataTexture
            )
              Object.assign(copied, { isDataTexture: true });
            textures.set(texture, copied);
          }
          Object.assign(result, { [key]: copied });
        }
    }
    return result;
  }
  instance.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;
    const original = mesh.geometry;
    let geometry = geometries.get(original);
    if (!geometry) {
      geometry = original.clone();
      geometries.set(original, geometry);
    }
    mesh.geometry = geometry;
    mesh.material = Array.isArray(mesh.material)
      ? mesh.material.map(copyMaterial)
      : copyMaterial(mesh.material);
  });
  return instance;
}
