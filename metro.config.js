const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);
config.resolver.assetExts = [...new Set([...config.resolver.assetExts, "glb"])];

// R3F's native CJS entry requires "three", while GLTFLoader imports it as ESM.
// Three r187's CJS entry calls Node-only process.emitWarning at import time.
// Native must use one ESM instance, including R3F's loaders/prototype patches.
const threeESM = path.join(
  path.dirname(require.resolve("three")),
  "three.module.js",
);
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === "three" &&
    (platform === "ios" || platform === "android")
  ) {
    return { type: "sourceFile", filePath: threeESM };
  }
  return context.resolveRequest(context, moduleName, platform);
};
module.exports = config;
