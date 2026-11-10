const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
module.exports = defineConfig([
  expoConfig,
  { ignores: ["work/**"] },
  {
    files: ["src/components/avatars/Catia3DPreview.tsx"],
    // This file renders Three.js scene elements, whose JSX properties are not DOM attributes.
    rules: { "react/no-unknown-property": "off" },
  },
]);
