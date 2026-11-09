/** Original VESTIGE character artwork. Build-time only; no SVG/3D runtime dependency. */
import { Resvg } from "@resvg/resvg-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "assets/avatars/archaeotech");
fs.mkdirSync(out, { recursive: true });
const directions = ["n", "ne", "e", "se", "s", "sw", "w", "nw", "unknown"];
const states = { idle: 4, walk: 6 };
const defs = `<defs>
 <linearGradient id="coat" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#345078"/><stop offset=".5" stop-color="#17294C"/><stop offset="1" stop-color="#09152E"/></linearGradient>
 <linearGradient id="skin" x1="0" y1="0" x2="1" y2=".6"><stop stop-color="#D99D78"/><stop offset="1" stop-color="#A86B50"/></linearGradient>
 <linearGradient id="hair" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#28344C"/><stop offset="1" stop-color="#080E20"/></linearGradient>
 <linearGradient id="pants" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#213450"/><stop offset="1" stop-color="#0B1730"/></linearGradient>
 <linearGradient id="sleeve" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#3A5275"/><stop offset="1" stop-color="#15223E"/></linearGradient>
 <linearGradient id="shoe" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#F5F8FF"/><stop offset="1" stop-color="#9BACCA"/></linearGradient>
 <radialGradient id="shadow"><stop stop-color="#020D27" stop-opacity=".35"/><stop offset="1" stop-color="#020D27" stop-opacity="0"/></radialGradient>
 </defs>`;
function artwork(dir = "s", state = "idle", frame = 0, { ground = true } = {}) {
  const index = directions.indexOf(dir),
    bearing = index < 8 ? index * 45 : null;
  const back = ["n", "ne", "nw"].includes(dir);
  const side = ["e", "w"].includes(dir);
  const mirror = ["sw", "w", "nw"].includes(dir);
  const t = state === "walk" ? Math.sin((frame / 6) * Math.PI * 2) : 0;
  const breath = state === "idle" ? [0, 0.6, 1.2, 0.6][frame] : 0;
  const bob = state === "walk" ? Math.abs(t) * -1.7 : -breath;
  const limb = state === "walk" ? t * 10 : 0;
  const glow = state === "idle" ? [0.6, 0.8, 1, 0.8][frame] : 0.9;
  const legs = `<g transform="rotate(${limb} 70 128)"><path d="M62 124 Q70 121 78 128 L76 160 Q74 169 62 168 L60 144Z" fill="url(#pants)" stroke="#09152E" stroke-width="1.4"/><path d="M63 141 L72 143 L70 160 L64 161" fill="#30425E"/><path d="M61 161 L74 161 L76 170 Q76 175 70 176 L58 176 Q54 175 56 170Z" fill="url(#shoe)" stroke="#14213A" stroke-width="1.4"/><path d="M56 172 L75 172 L74 176 L58 177Z" fill="#FFFFFF"/><path d="M62 164 L71 164 M60 167 L72 167" stroke="#5E718F" stroke-width="1.4"/></g>
 <g transform="rotate(${-limb} 88 128)"><path d="M80 126 Q88 120 96 127 L98 146 L94 169 L82 169 L80 147Z" fill="url(#pants)" stroke="#09152E" stroke-width="1.4"/><path d="M87 139 L93 138 L92 162 L86 162" fill="#2E405D"/><path d="M82 163 L94 163 L99 171 Q101 176 95 178 L82 178 Q78 176 80 171Z" fill="url(#shoe)" stroke="#14213A" stroke-width="1.4"/><path d="M80 174 L99 173 L97 178 L82 179Z" fill="#FFFFFF"/><path d="M86 166 L93 166 M84 170 L95 169" stroke="#5E718F" stroke-width="1.4"/></g>`;
  const leftArm = `<g transform="rotate(${-limb * 0.8} 60 81)"><path d="M60 76 Q50 77 47 92 L46 115 Q46 121 54 122 L60 115 L65 89Z" fill="url(#sleeve)" stroke="#0B1730" stroke-width="1.5"/><path d="M48 95 L53 94 L53 112 L48 114Z" fill="#269DE4" opacity=".7"/><path d="M47 115 L55 114 L56 123 Q54 129 50 127 L46 124Z" fill="url(#skin)" stroke="#744A3C" stroke-width="1"/><path d="M46 110 L56 109 L57 116 L46 118Z" fill="#0B1730"/><path d="M48 111 L54 111 L54 114 L48 115Z" fill="#32BCC0"/></g>`;
  const rightArm = `<g transform="rotate(${limb * 0.8} 96 82)"><path d="M96 76 Q105 77 109 90 L114 109 Q115 115 110 119 L103 118 L96 98 L92 89Z" fill="url(#sleeve)" stroke="#0B1730" stroke-width="1.5"/><path d="M103 88 L108 93 L111 108 L107 109Z" fill="#405779"/><path d="M105 116 L113 114 L116 122 Q115 127 110 127 L106 124Z" fill="url(#skin)" stroke="#744A3C" stroke-width="1"/><path d="M103 111 L113 108 L115 115 L105 119Z" fill="#101D38"/></g>`;
  const torso = back
    ? `<path d="M61 72 Q79 66 96 75 L101 106 L99 131 Q78 138 58 131 L57 103Z" fill="url(#coat)" stroke="#0B1730" stroke-width="1.6"/><path d="M62 76 L59 91 L63 126 M94 76 L99 94 L95 128" stroke="#4C6385" stroke-width="2" fill="none"/><rect x="64" y="78" width="30" height="43" rx="10" fill="#0B1730" stroke="#3C5072" stroke-width="1.5"/><path d="M68 82 Q79 77 90 83 L91 105 L67 106Z" fill="#253A60"/><path d="M68 109 L90 109 L88 118 L70 118Z" fill="#17294C"/><path d="M73 89 L84 89 M73 94 L84 94 M73 99 L84 99" stroke="#32BCC0" stroke-width="2" stroke-linecap="round"/><path d="M95 78 L100 104" stroke="#F77B54" stroke-width="3"/>`
    : `<path d="M61 73 Q77 67 95 75 L100 101 L99 130 Q78 137 57 130 L57 100Z" fill="url(#coat)" stroke="#0B1730" stroke-width="1.6"/><path d="M65 75 L74 94 L68 123 L58 126 L60 87Z" fill="#2D456B"/><path d="M86 75 L94 80 L99 121 L87 125 L82 92Z" fill="#0C1933"/><path d="M72 75 L85 75 L87 107 L75 113Z" fill="#269DE4"/><path d="M76 83 L81 85 L82 113" stroke="#92D6EC" stroke-width="1.3" fill="none"/><path d="M62 98 L71 100 M88 98 L96 96" stroke="#536685" stroke-width="1.6"/><path d="M60 124 Q80 130 98 124 L99 132 Q78 138 57 131Z" fill="#101B35"/><path d="M65 76 L96 118" stroke="#071126" stroke-width="6"/><path d="M65 76 L96 118" stroke="#F77B54" stroke-width="3.5"/><path d="M61 79 L65 78" stroke="#FFD5C4" stroke-width="1"/><rect x="85" y="109" width="16" height="23" rx="4" fill="#213454" stroke="#627292" stroke-width="1.3" transform="rotate(-9 93 120)"/><rect x="88" y="112" width="10" height="13" rx="2" fill="#10243D" transform="rotate(-9 93 120)"/><path d="M90 118 L93 115 L96 118 L93 122Z" fill="#32BCC0" opacity="${glow}"/><path d="M89 128 L94 127" stroke="#A454ED" stroke-width="2" stroke-linecap="round"/>`;
  const neck = `<path d="M72 62 L85 62 L87 77 Q80 85 70 75Z" fill="url(#skin)" stroke="#83513E" stroke-width="1"/><path d="M72 66 Q80 72 86 67 L86 73 Q78 78 72 73Z" fill="#9E644C"/><path d="M67 74 L72 71 L78 80 L72 86Z M85 72 L90 76 L85 84 L80 80Z" fill="#3E567C" stroke="#152540" stroke-width="1"/>`;
  const head = back
    ? `<path d="M64 42 Q65 26 79 27 Q96 27 98 44 L94 62 Q80 73 66 61Z" fill="url(#hair)" stroke="#0A1125" stroke-width="1.4"/><path d="M67 36 Q77 26 92 36 M69 40 Q80 32 93 41" stroke="#44516B" stroke-width="2" fill="none"/><path d="M66 50 L65 57 L69 62 M96 49 L96 57 L92 62" fill="#B57859"/>`
    : side
      ? `<path d="M67 40 Q73 29 85 34 L91 45 L90 50 L97 55 L91 59 L90 66 Q85 73 77 68 L67 59Z" fill="url(#skin)" stroke="#83513E" stroke-width="1.2"/><path d="M65 49 Q60 43 64 34 Q72 22 87 28 Q96 31 93 42 L87 38 L78 37 L73 46 L73 55 L66 56Z" fill="url(#hair)" stroke="#0A1125" stroke-width="1.4"/><path d="M67 35 Q76 28 87 32" stroke="#42516C" stroke-width="1.6" fill="none"/><path d="M82 47 L88 48 M84 52 L88 52" stroke="#263047" stroke-width="1.7" stroke-linecap="round"/><path d="M85 63 L90 62" stroke="#754A40" stroke-width="1.2"/><path d="M70 49 Q65 47 66 55 Q66 59 71 57" fill="#CD916B" stroke="#9E634B" stroke-width="1"/><circle cx="72" cy="57" r="1.8" fill="#32BCC0"/>`
      : `<path d="M66 40 Q70 28 83 30 Q99 34 97 51 L93 64 Q87 72 77 70 L66 61 L63 50Z" fill="url(#skin)" stroke="#83513E" stroke-width="1.2"/><path d="M84 43 Q90 45 91 52 L95 55 L91 57 L90 64 Q85 70 78 66 L74 60Z" fill="#AD7053"/><path d="M65 49 Q59 44 62 38 Q62 27 74 25 Q89 20 96 31 Q102 36 96 47 L92 43 L90 35 Q80 41 70 36 L68 47 L69 55 L65 55Z" fill="url(#hair)" stroke="#0A1125" stroke-width="1.4"/><path d="M66 33 Q77 24 91 32 M68 35 Q77 30 83 33" stroke="#42516C" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M71 47 L77 46 M86 47 L90 49" stroke="#4B302D" stroke-width="1.6" stroke-linecap="round"/><path d="M73 51 L76 51 M86 52 L89 52" stroke="#182036" stroke-width="1.8" stroke-linecap="round"/><path d="M81 51 L80 57 L83 58" stroke="#9A5E47" stroke-width="1" fill="none"/><path d="M78 63 Q83 65 87 62" stroke="#754A40" stroke-width="1.2" fill="none" stroke-linecap="round"/><path d="M64 50 Q60 49 62 56 L66 58" fill="#CD916B" stroke="#9E634B" stroke-width="1"/><circle cx="68" cy="57" r="1.8" fill="#32BCC0"/>`;
  const transform = mirror
    ? "translate(160 0) scale(-1 1)"
    : side
      ? "translate(18 0) scale(.82 1)"
      : "";
  let halo = "";
  if (ground) {
    const alpha = state === "idle" ? [0.23, 0.27, 0.3, 0.27][frame] : 0.3;
    halo = `<ellipse cx="80" cy="183" rx="38" ry="13" fill="url(#shadow)"/><ellipse cx="80" cy="182" rx="30" ry="10" fill="#269DE4" fill-opacity=".06" stroke="#32BCC0" stroke-opacity="${alpha}" stroke-width="1.5"/><ellipse cx="80" cy="182" rx="20" ry="5" fill="#020D27" fill-opacity=".15"/>`;
    if (bearing !== null) {
      const a = (bearing * Math.PI) / 180;
      const x = 80 + Math.sin(a) * 38,
        y = 182 - Math.cos(a) * 12;
      halo += `<g transform="translate(${x} ${y}) rotate(${bearing})"><path d="M0 -4 L3 3 L0 1 L-3 3Z" fill="#32BCC0" stroke="#FFFFFF" stroke-width=".7"/></g>`;
    }
  }
  return `${halo}<g transform="${transform}">${legs}<g transform="translate(0 ${bob})">${leftArm}${torso}${rightArm}${neck}${head}<path d="M59 83 L60 102" stroke="#FFFFFF" stroke-opacity=".12" stroke-width="1.5" stroke-linecap="round"/></g></g>`;
}
function svg(dir, state, frame, viewBox = "0 0 160 208", ground = true) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="208" viewBox="${viewBox}">${defs}${artwork(dir, state, frame, { ground })}</svg>`;
}
const manifest = {
  id: "archaeotech-v1",
  logicalSize: [80, 104],
  anchor: { x: 0.5, y: 182 / 208 },
  idleFrames: 4,
  walkFrames: 6,
  idleFrameMs: 700,
  walkFrameMs: 125,
  directions,
  illustration:
    "Original hand-authored vector artwork; transparent PNG exports, no 3D engine.",
  frameFiles: [],
};
let ts = `// Generated by scripts/build-avatar.mjs. Local assets only; no external avatar service.\nimport type { AvatarFacing, AvatarPhase } from '../../../lib/avatar';\nexport const avatarSprites: Record<AvatarFacing, Record<AvatarPhase, number[]>> = {\n`;
for (const dir of directions) {
  ts += ` '${dir}': {\n`;
  for (const [state, count] of Object.entries(states)) {
    ts += `  '${state}': [\n`;
    for (let i = 0; i < count; i++) {
      const name = `${dir}-${state}-${i}`;
      const source = svg(dir, state, i);
      for (const scale of [1, 2, 3]) {
        const file = `${name}${scale === 1 ? "" : `@${scale}x`}.png`;
        const render = new Resvg(source, {
          fitTo: { mode: "width", value: 80 * scale },
        }).render();
        fs.writeFileSync(path.join(out, file), render.asPng());
        manifest.frameFiles.push(file);
      }
      ts += `   require('../../../../assets/avatars/archaeotech/${name}.png'),\n`;
    }
    ts += `  ],\n`;
  }
  ts += ` },\n`;
}
ts += `};\nexport const avatarPortrait: number = require('../../../../assets/avatars/archaeotech/portrait.png');\n`;
for (const scale of [1, 2, 3]) {
  const portrait = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="47 18 64 64">${defs}${artwork("s", "idle", 0, { ground: false })}</svg>`;
  fs.writeFileSync(
    path.join(out, `portrait${scale === 1 ? "" : `@${scale}x`}.png`),
    new Resvg(portrait, { fitTo: { mode: "width", value: 96 * scale } })
      .render()
      .asPng(),
  );
}
fs.writeFileSync(path.join(out, "master-front.svg"), svg("s", "idle", 0));
fs.writeFileSync(
  path.join(out, "manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
fs.writeFileSync(
  path.join(root, "src/components/exploration/avatar/sprites.ts"),
  ts,
);
const cards = [
  ["n", "DOS · NORD"],
  ["e", "PROFIL · EST"],
  ["s", "FACE · SUD"],
  ["w", "PROFIL · OUEST"],
];
let board = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700"><rect width="1200" height="700" fill="#020D27"/>${defs}<text x="52" y="62" fill="#FFFFFF" font-family="sans-serif" font-size="26" font-weight="700">VESTIGE — ARCHÉO-TECH</text><text x="52" y="94" fill="#B4C0D9" font-family="sans-serif" font-size="15">Dessin original · sprites locaux · personnage vertical · silhouette adulte</text>`;
cards.forEach(([dir, label], i) => {
  const x = 52 + i * 286;
  board += `<rect x="${x}" y="125" width="258" height="300" rx="22" fill="#0B1B3D" stroke="#304565"/><text x="${x + 20}" y="156" fill="#32BCC0" font-family="sans-serif" font-size="12" font-weight="700">${label}</text><g transform="translate(${x + 49} 182)">${artwork(dir, "idle", 0)}</g>`;
});
board += `<text x="52" y="470" fill="#FFFFFF" font-family="sans-serif" font-size="17" font-weight="700">MARCHE · 6 poses · déclenchée par le GPS réel</text>`;
for (let i = 0; i < 6; i++) {
  board += `<g transform="translate(${70 + i * 185} 485) scale(.8)">${artwork("s", "walk", i)}</g>`;
}
board += "</svg>";
fs.writeFileSync(
  path.join(root, "docs/avatars/archaeotech-preview.png"),
  new Resvg(board).render().asPng(),
);
console.log(
  `Exported ${manifest.frameFiles.length} PNGs (90 poses × 3 densities), portrait and preview. Runtime: 80 × 104 pt.`,
);
