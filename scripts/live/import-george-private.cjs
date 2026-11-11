/* global __dirname */
// Local-only import for a user-owned prototype. Never adds it to approved audio or Git.
const fs = require("node:fs"),
  path = require("node:path");
const root = path.resolve(__dirname, "../..");
const input = process.argv[2],
  transcript = process.argv[3];
if (!input || !fs.existsSync(input))
  throw Error(
    'Usage: node scripts/live/import-george-private.cjs "C:\\audio\\george.mp3" ["C:\\audio\\transcription.txt"]',
  );
const bytes = fs.readFileSync(input);
if (
  bytes.length < 1024 ||
  bytes.length > 20 * 1024 * 1024 ||
  !(
    bytes.subarray(0, 3).toString() === "ID3" ||
    (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)
  )
)
  throw Error("Expected an MP3 under 20 MiB.");
const expected =
  "499c8d05fa2e4662dba1216bcf1aa2976631b5830b3377cdd50c4ec62fd03bb9";
if (
  require("node:crypto").createHash("sha256").update(bytes).digest("hex") !==
  expected
)
  throw Error(
    "The MP3 does not match the original Rue Mercière prototype; import its original file.",
  );
const target = path.join(root, "assets/audio/private/george-demo.mp3");
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, bytes);
const output = "src/data/live/georgePrivateAsset.native.ts";
fs.writeFileSync(
  path.join(root, output),
  '// PRIVATE LOCAL OVERRIDE. Do not publish without rights verification.\nexport const georgePrivateSource: number | null = __DEV__ ? require("../../../assets/audio/private/george-demo.mp3") : null;\n',
);
if (transcript) {
  const text = fs.readFileSync(transcript, "utf8").trim();
  fs.writeFileSync(
    path.join(root, "src/data/live/georgePrivateTranscript.native.ts"),
    `// User-supplied text, not an editorial approval.\nexport const georgePrivateTranscript: string | null = ${JSON.stringify(text)};\n`,
  );
}
console.log(
  "Private local MP3 imported. Restart Metro with --clear. No editorial approval or publication rights granted.",
);
