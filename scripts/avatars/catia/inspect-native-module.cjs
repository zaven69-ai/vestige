// Execute real Metro module factories and Metro's require/ErrorUtils guard.
// Only native boundaries (RN/Expo, assets, router, UI/sensors) are substituted.
// React, Three, GLTFLoader, R3F, expo-gl JS and Catia are the actual bundle code.
// This diagnoses import evaluation; it does NOT create an iPhone GL context.
const vm = require("node:vm"),
  fs = require("node:fs");
const runtime = fs.readFileSync(
  require.resolve("metro-runtime/src/polyfills/require.js"),
  "utf8",
);
const input = process.argv[2],
  names = new Map(),
  records = new Map(),
  fatals = [],
  threeIds = new Set();
if (!input)
  throw new Error(
    "Usage: node scripts/avatars/catia/inspect-native-module.cjs <Metro modulesOnly development bundle> [--expect-broken]",
  );
const platform = process.argv.includes("--android") ? "android" : "ios";
const context = vm.createContext({
  console,
  performance,
  setTimeout,
  clearTimeout,
  setImmediate,
  clearImmediate,
  queueMicrotask,
  URL,
  Blob,
  TextDecoder,
  TextEncoder,
  ArrayBuffer,
  Uint8Array,
  process: { env: { NODE_ENV: "development" } },
  __DEV__: true,
  __METRO_GLOBAL_PREFIX__: "",
  navigator: { product: "ReactNative" },
  requestAnimationFrame: () => 0,
  cancelAnimationFrame: () => {},
  ErrorUtils: {
    reportFatalError: (e) => fatals.push({ name: e.name, message: e.message }),
  },
});
context.global = context;
vm.runInContext(runtime, context);
const define = context.__d;
context.__d = (factory, id, deps, name) => {
  names.set(name, id);
  records.set(id, { deps, name });
  const wrapped = function (global, realRequire, ...rest) {
    const localRequire = (depId, literal) => {
      if (literal === "react-native")
        return {
          Platform: { OS: platform },
          StyleSheet: { create: (x) => x },
          AppState: { currentState: "active" },
          NativeModules: {},
          Image: {},
          PixelRatio: { get: () => 3 },
        };
      if (literal === "expo")
        return {
          requireNativeModule: () => ({}),
          requireNativeView: () => () => null,
          UnavailabilityError: Error,
          CodedError: Error,
        };
      if (literal === "expo-asset")
        return { Asset: { fromModule: () => ({ uri: "file://catia.glb" }) } };
      if (literal === "expo-router") return { useIsFocused: () => true };
      if (literal === "expo-file-system/legacy") return {};
      if (literal === "../ui") return { colors: { raised: "#112233" }, s: {} };
      if (literal === "../../hooks/useExplorerSensors")
        return { useReducedMotion: () => false };
      if (records.get(depId)?.name.endsWith(".glb")) return 123;
      if (literal === "three") threeIds.add(depId);
      return realRequire(depId);
    };
    Object.assign(localRequire, realRequire);
    return factory(global, localRequire, ...rest);
  };
  return define(wrapped, id, deps, name);
};
vm.runInContext(fs.readFileSync(input, "utf8"), context);
let value = context.__r(names.get("src/components/avatars/Catia3DPreview.tsx"));
const fiber = value
  ? context.__r(
      names.get(
        "node_modules/@react-three/fiber/native/dist/react-three-fiber-native.cjs.js",
      ),
    )
  : null;
const expoGL = value
  ? context.__r(names.get("node_modules/expo-gl/build/index.js"))
  : null;
const nativeExports = value
  ? {
      Canvas: typeof fiber?.Canvas,
      useFrame: typeof fiber?.useFrame,
      useLoader: typeof fiber?.useLoader,
      useThree: typeof fiber?.useThree,
      GLView: typeof expoGL?.GLView,
    }
  : null;
const report = {
  platform,
  nativeExports,
  requireType: typeof value,
  keys: value ? Object.keys(value) : [],
  defaultType: typeof value?.default,
  threeCJS: names.has("node_modules/three/build/three.cjs"),
  threeModuleIds: [...threeIds],
  fatals,
};
console.log(JSON.stringify(report, null, 2));
if (process.argv.includes("--expect-broken")) {
  if (
    value !== undefined ||
    !fatals.some((e) => e.message.includes("process.emitWarning"))
  )
    process.exitCode = 1;
} else if (
  typeof value?.default !== "function" ||
  fatals.length ||
  report.threeCJS ||
  threeIds.size !== 1 ||
  Object.values(nativeExports ?? {}).some((type) => type !== "function")
) {
  process.exitCode = 1;
}
