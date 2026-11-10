import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const require = createRequire(import.meta.url);

test("native Metro resolves CJS and ESM requests for three to one ESM file", () => {
  const config = require("../metro.config.js");
  const fallback = { type: "sourceFile", filePath: "fallback" };
  const calls: unknown[] = [];
  const context = {
    resolveRequest: (...args: unknown[]) => {
      calls.push(args);
      return fallback;
    },
  };
  for (const platform of ["ios", "android"]) {
    const resolved = config.resolver.resolveRequest(context, "three", platform);
    assert.equal(resolved.type, "sourceFile");
    assert.match(
      resolved.filePath,
      /[/\\]three[/\\]build[/\\]three\.module\.js$/,
    );
    assert.doesNotMatch(
      readFileSync(resolved.filePath, "utf8"),
      /process\.emitWarning/,
    );
    assert.equal(
      config.resolver.resolveRequest(context, "three", platform).filePath,
      resolved.filePath,
    );
    assert.equal(
      config.resolver.resolveRequest(context, "expo-gl", platform),
      fallback,
    );
  }
  assert.equal(
    config.resolver.resolveRequest(context, "three", "web"),
    fallback,
  );
  assert.equal(calls.length, 3);
  assert.ok(config.resolver.assetExts.includes("glb"));
});

test("real Three CJS failure is swallowed by Metro's fatal guard and returns undefined", () => {
  const fatal: Error[] = [];
  const context = vm.createContext({
    __DEV__: false,
    __METRO_GLOBAL_PREFIX__: "",
    process: { env: { NODE_ENV: "production" } }, // RN has no Node emitWarning.
    ErrorUtils: { reportFatalError: (error: Error) => fatal.push(error) },
  });
  context.global = context;
  const runtime = readFileSync(
    require.resolve("metro-runtime/src/polyfills/require.js"),
    "utf8",
  );
  const three = readFileSync(require.resolve("three"), "utf8");
  vm.runInContext(runtime, context);
  vm.runInContext(
    `__d(function(global, require, _i, _a, module, exports) { ${three} }, 2, []);
    __d(function(global, require, _i, _a, module, exports) {
      require(2); exports.default = function Catia() {};
    }, 1, [2]);`,
    context,
  );
  assert.equal(context.__r(1), undefined);
  assert.equal(fatal.length, 1);
  assert.match(fatal[0].message, /process.emitWarning is not a function/);
});
