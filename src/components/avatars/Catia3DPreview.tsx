import { catiaScene } from "../../lib/avatars/catiaScene";
import { catiaPlayback } from "../../lib/avatars/catiaPlayback";
import { Asset } from "expo-asset";
import catiaModel from "../../../assets/avatars/catia/rig-lab/revision-2/catia-corrected.glb";
import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, Pressable, StyleSheet, Text, View } from "react-native";
import { useIsFocused } from "expo-router";
import {
  Canvas,
  useFrame,
  useLoader,
  useThree,
} from "@react-three/fiber/native";
import { type Mesh, type Texture, type Material } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { colors, s } from "../ui";
import { useReducedMotion } from "../../hooks/useExplorerSensors";
import {
  catiaViewerClips,
  hasCatiaClips,
  viewerCamera,
  viewerDefaults,
  viewerDistance,
  viewerTilt,
  type CatiaViewerClip,
} from "../../lib/avatars/catiaViewer";
const modelAsset = Asset.fromModule(catiaModel).uri;
const cameraSettings = {
  fov: 38,
  near: 0.05,
  far: 30,
  position: [0, 1, 3.25] as [number, number, number],
};
const rendererSettings = { antialias: false, alpha: false };

function CameraPosition({
  distance,
  tilt,
}: {
  distance: number;
  tilt: number;
}) {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    const pose = viewerCamera(distance, tilt);
    camera.position.set(0, pose.y, pose.z);
    camera.lookAt(0, pose.targetY, 0);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, distance, tilt, invalidate]);
  return null;
}
function Character({
  clip,
  playing,
  onReady,
}: {
  clip: CatiaViewerClip;
  playing: boolean;
  onReady: () => void;
}) {
  const asset = useLoader(GLTFLoader, modelAsset);
  const scene = useMemo(() => catiaScene(asset.scene), [asset.scene]);
  const animations = asset.animations;
  const playback = useMemo(
    () => catiaPlayback(scene, animations),
    [scene, animations],
  );
  const invalidate = useThree((state) => state.invalidate);
  if (!hasCatiaClips(animations))
    throw Error("Le GLB ne contient pas les trois animations de Catia.");
  useEffect(() => {
    playback.select(clip, playing);
    invalidate();
  }, [clip, playing, playback, invalidate]);
  useFrame((_, delta) => playback.update(delta, playing));
  useEffect(() => {
    onReady();
    return () => {
      playback.dispose();
      const geometries = new Set<Mesh["geometry"]>();
      const materials = new Set<Material>();
      const textures = new Set<Texture>();
      scene.traverse((object) => {
        const mesh = object as Mesh;
        if (mesh.isMesh) {
          geometries.add(mesh.geometry);
          for (const material of Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material]) {
            materials.add(material);
            for (const value of Object.values(material))
              if (value && (value as Texture).isTexture)
                textures.add(value as Texture);
          }
        }
        const skeleton = (
          object as unknown as { skeleton?: { boneTexture?: Texture } }
        ).skeleton;
        if (skeleton?.boneTexture) textures.add(skeleton.boneTexture);
      });
      for (const texture of textures) texture.dispose();
      for (const material of materials) material.dispose();
      for (const geometry of geometries) geometry.dispose();
      useLoader.clear(GLTFLoader, modelAsset);
    };
  }, [playback, scene, onReady]);
  return <primitive object={scene} dispose={null} />;
}
function Control({
  title,
  onPress,
  selected = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.control,
        {
          borderColor: selected ? colors.turquoise : colors.line,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Text style={{ color: colors.ink, textAlign: "center", fontSize: 13 }}>
        {title}
      </Text>
    </Pressable>
  );
}
export default function Catia3DPreview() {
  const focused = useIsFocused();
  const reduced = useReducedMotion();
  const [foreground, setForeground] = useState(
    AppState.currentState === "active",
  );
  const [clip, setClip] = useState<CatiaViewerClip>("idle");
  const [playing, setPlaying] = useState(true);
  const [distance, setDistance] = useState(viewerDefaults.distance);
  const [yaw, setYaw] = useState(viewerDefaults.yaw);
  const [tilt, setTilt] = useState(viewerDefaults.tilt);
  const [loading, setLoading] = useState(true);
  const [slow, setSlow] = useState(false);
  const onReady = useCallback(() => setLoading(false), []);
  const onCreated = useCallback(() => {
    setLoading(true);
    setSlow(false);
  }, []);
  const origin = useRef({ yaw: 0, tilt: 0, x: 0, y: 0 });
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) =>
      setForeground(state === "active"),
    );
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setSlow(true), 20000);
    return () => clearTimeout(timer);
  }, [loading]);
  useEffect(
    () => () => {
      useLoader.clear(GLTFLoader, modelAsset);
    },
    [],
  );
  const active = focused && foreground;
  const animate = playing && !reduced;
  return (
    <View style={{ gap: 12 }}>
      <View
        style={styles.viewport}
        onStartShouldSetResponder={() => true}
        onStartShouldSetResponderCapture={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={(event) => {
          origin.current = {
            yaw,
            tilt,
            x: event.nativeEvent.pageX,
            y: event.nativeEvent.pageY,
          };
        }}
        onResponderMove={(event) => {
          setYaw(
            origin.current.yaw +
              (event.nativeEvent.pageX - origin.current.x) * 0.009,
          );
          setTilt(
            viewerTilt(
              origin.current.tilt +
                (event.nativeEvent.pageY - origin.current.y) * 0.003,
            ),
          );
        }}
        accessibilityLabel="Modèle 3D de Catia. Glissez pour tourner, ou utilisez les boutons de rotation et de zoom."
      >
        {active ? (
          <Suspense fallback={null}>
            <Canvas
              onCreated={onCreated}
              pointerEvents="none"
              frameloop={animate ? "always" : "demand"}
              gl={rendererSettings}
              camera={cameraSettings}
            >
              <color attach="background" args={[colors.raised]} />
              <ambientLight intensity={1.2} />
              <hemisphereLight args={["#e9f1ff", "#364054", 1]} />
              <directionalLight position={[-3, 5, 4]} intensity={2.1} />
              <directionalLight position={[3, 3, -2]} intensity={1} />
              <CameraPosition distance={distance} tilt={tilt} />
              <group rotation={[0, yaw, 0]}>
                <Suspense fallback={null}>
                  <Character clip={clip} playing={animate} onReady={onReady} />
                </Suspense>
              </group>
            </Canvas>
          </Suspense>
        ) : (
          <View style={styles.paused}>
            <Text style={s.body}>Prévisualisation suspendue</Text>
          </View>
        )}
        {loading && active && (
          <View pointerEvents="none" style={styles.loading}>
            <Text style={s.body}>
              {slow
                ? "Chargement prolongé… le mode images reste disponible."
                : "Chargement du modèle 3D…"}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.row}>
        {catiaViewerClips.map((item) => (
          <Control
            key={item.id}
            title={item.label}
            selected={clip === item.id}
            onPress={() => setClip(item.id)}
          />
        ))}
      </View>
      <View style={styles.row}>
        <Control
          title={animate ? "Pause" : "Lire"}
          disabled={reduced}
          onPress={() => setPlaying((value) => !value)}
        />
        <Control
          title="Réinitialiser la vue"
          onPress={() => {
            setDistance(viewerDefaults.distance);
            setYaw(viewerDefaults.yaw);
            setTilt(viewerDefaults.tilt);
          }}
        />
      </View>
      <View style={styles.row}>
        <Control
          title="Tourner à gauche"
          onPress={() => setYaw((value) => value - 0.4)}
        />
        <Control
          title="Tourner à droite"
          onPress={() => setYaw((value) => value + 0.4)}
        />
      </View>
      <View style={styles.row}>
        <Control
          title="Zoom +"
          onPress={() => setDistance((value) => viewerDistance(value - 0.3))}
        />
        <Control
          title="Zoom −"
          onPress={() => setDistance((value) => viewerDistance(value + 0.3))}
        />
      </View>
      <Text style={s.caption}>
        Véritable modèle 3D animé · glissez pour tourner. Cette démonstration ne
        modifie ni le GPS, ni l’avatar sur la carte.
      </Text>
      {reduced && (
        <Text style={s.caption}>
          Réduire les animations est activé sur le téléphone : lecture en pause.
        </Text>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  viewport: {
    height: 360,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: colors.raised,
  },
  loading: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: colors.raised,
  },
  paused: { flex: 1, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", gap: 8 },
  control: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: "center",
  },
});
