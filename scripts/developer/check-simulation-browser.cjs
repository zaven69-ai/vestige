/* global __dirname, process */
/* Integration harness: real React/providers/hooks, DOM substitutes for native services.
   Requires Playwright in the maintainer environment; never used by the mobile app. */
const fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os");
const http = require("node:http"),
  ts = require("typescript");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "../..");
const source = (file) => fs.readFileSync(path.join(root, file), "utf8");
const points = JSON.parse(source("src/data/monuments.json")).filter((m) =>
  ["auguste", "cybele", "theatre-vienne"].includes(m.id),
);
const mocks = new Map();
const mock = (id, code) => mocks.set(id, code);
mock(
  "react-native",
  `const React=require('react');
const flatten=s=>Array.isArray(s)?Object.assign({},...s.filter(Boolean).map(flatten)):s||{};
function View(p){const origin=React.useRef(null);const style={...flatten(p.style)};delete style.transform;if(typeof style.lineHeight==='number')style.lineHeight+='px';return React.createElement('div',{style,
 onPointerDown:e=>{if(p.onStartShouldSetPanResponder?.()){origin.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);p.onPanResponderGrant?.(e)}},
 onPointerMove:e=>{if(origin.current)p.onPanResponderMove?.(e,{dx:e.clientX-origin.current.x,dy:e.clientY-origin.current.y})},
 onPointerUp:e=>{origin.current=null;p.onPanResponderRelease?.(e)},onPointerCancel:e=>{origin.current=null;p.onPanResponderTerminate?.(e)},
 'aria-label':p.accessibilityLabel},p.children)}
function Text(p){return React.createElement('span',{style:flatten(p.style)},p.children)}
exports.View=View;exports.Text=Text;exports.ScrollView=View;exports.Modal=p=>p.visible?React.createElement('section',{'aria-label':'Developer dialog'},p.children):null;
exports.Animated={ValueXY:class{setValue(){} getTranslateTransform(){return []}},View};
exports.PanResponder={create:c=>({panHandlers:c})};exports.StyleSheet={create:s=>s};
exports.Platform={OS:'ios'};exports.Alert={alert:(title,message,buttons)=>{window.confirmation={title,message,buttons}}};
exports.AppState={currentState:'active',addEventListener:(_,f)=>{window.appListeners.push(f);return {remove(){window.appListeners=window.appListeners.filter(x=>x!==f)}}}};`,
);
mock(
  "react-native-safe-area-context",
  "exports.useSafeAreaInsets=()=>({top:0,bottom:0,left:0,right:0});",
);
mock(
  "@react-native-async-storage/async-storage",
  `module.exports={getItem:async k=>window.storage[k]??null,setItem:async(k,v)=>{window.storageWrites.push([k,v]);window.storage[k]=v}};`,
);
mock(
  "expo-location",
  `exports.Accuracy={High:1};exports.requestForegroundPermissionsAsync=async()=>({status:window.permission?'granted':'denied'});exports.getForegroundPermissionsAsync=exports.requestForegroundPermissionsAsync;exports.hasServicesEnabledAsync=async()=>true;exports.watchPositionAsync=async(_,f)=>{window.gpsCallback=f;return {remove(){window.gpsCallback=null}}};`,
);
mock(
  "expo-router",
  `exports.useLocalSearchParams=()=>window.routeParams;exports.router={navigate:p=>{window.routeParams=p.params}};`,
);
mock(
  path.join(root, "src/lib/progress.ts"),
  `exports.initializeProgress=async()=>{};exports.loadProgress=async()=>({journal:window.journal,xp:window.xp});exports.recordDiscovery=async(_,id,at,xp)=>{window.journal[id]=at;window.xp+=xp;window.discoveryWrites++};`,
);
mock(
  path.join(root, "src/lib/progressDatabase.ts"),
  "exports.progressDatabase=async()=>({});",
);
mock(
  path.join(root, "src/data/monuments.ts"),
  `exports.monuments=${JSON.stringify(points)};exports.trails=[];exports.cities={Vienne:{latitude:45.525698,longitude:4.874218}};`,
);
mock(
  path.join(root, "src/components/live/NativeNarration.tsx"),
  "exports.NativeNarration=()=>null;",
);
mock(
  path.join(root, "src/components/ui.tsx"),
  `const React=require('react');exports.s={heading:{color:'white'},body:{color:'#ccc'},caption:{color:'#aaa'}};exports.Button=p=>React.createElement('button',{disabled:p.disabled,onClick:p.onPress,style:{padding:12,margin:4}},p.title);`,
);
const entry = "/simulation-harness.js";
mock(
  entry,
  `const React=require('react'),{createRoot}=require('react-dom/client');
const {DeveloperLocationProvider,useSimulation}=require('${root}/src/lib/developer/DeveloperLocation.tsx');
const {GameProvider,useGame}=require('${root}/src/lib/store.tsx');
const {LiveProvider,useLive}=require('${root}/src/lib/live/LiveProvider.tsx');
const {useExplorationLocation}=require('${root}/src/hooks/useExplorationLocation.ts');
const {useExplorerGuidance}=require('${root}/src/hooks/useExplorerGuidance.ts');
const {DeveloperControls}=require('${root}/src/components/developer/DeveloperControls.tsx');
window.appListeners=[];window.storage={};window.storageWrites=[];window.journal={};window.xp=0;window.discoveryWrites=0;window.permission=true;window.routeParams={};
function Harness(){const simulation=useSimulation(),game=useGame(),live=useLive(),location=useExplorationLocation(),guide=useExplorerGuidance(true,location.position);const [open,setOpen]=React.useState(true),[pulse,force]=React.useState(0);
 window.harness={simulation,game,live,guide,open:()=>setOpen(true),force:()=>force(pulse+1),snapshot:()=>({enabled:simulation.enabled,fix:location.fix,session:live.session,preview:live.preview,ready:live.ready,xp:game.xp,journal:game.journal,storage:window.storage,writes:window.storageWrites.length,discoveryWrites:window.discoveryWrites,status:guide.navigation.status,arrived:guide.navigation.arrived,route:!!guide.navigation.route})};
 return React.createElement('main',null,React.createElement('h1',null,'Contrôle React — substituts DOM, pas un rendu iPhone'),React.createElement('p',null,simulation.enabled?'MODE TEST — GPS SIMULÉ':'GPS réel'),React.createElement(DeveloperControls,{open,close:()=>setOpen(false),active:true,mapHeading:0,bottom:20,onTeleport(){},onReturnGPS:()=>game.requestGPS()}))}
createRoot(document.getElementById('root')).render(React.createElement(DeveloperLocationProvider,null,React.createElement(GameProvider,null,React.createElement(LiveProvider,null,React.createElement(Harness)))));`,
);
const modules = new Map();
function resolve(id, from) {
  if (mocks.has(id)) return id;
  if (id.startsWith(".") || id.startsWith("/")) {
    const candidate = id.startsWith("/")
      ? id
      : path.resolve(path.dirname(from), id);
    for (const suffix of ["", ".ts", ".tsx", ".js", ".json"])
      if (
        mocks.has(candidate + suffix) ||
        (fs.existsSync(candidate + suffix) &&
          fs.statSync(candidate + suffix).isFile())
      )
        return candidate + suffix;
  }
  return require.resolve(id, { paths: [path.dirname(from), root] });
}
function collect(id) {
  if (modules.has(id)) return;
  modules.set(id, "");
  let code = mocks.get(id) ?? fs.readFileSync(id, "utf8");
  if (id.endsWith(".json")) code = "module.exports=" + code;
  else if (/\.tsx?$/.test(id))
    code = ts.transpileModule(code, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText;
  code = code.replace(/require\(["']([^"']+)["']\)/g, (_, dep) => {
    const resolved = resolve(dep, id);
    collect(resolved);
    return `require(${JSON.stringify(resolved)})`;
  });
  modules.set(id, code);
}
collect(entry);
const bundle = `const process={env:{NODE_ENV:'development'}};const __DEV__=true;const modules={${[...modules].map(([id, code]) => JSON.stringify(id) + ":function(require,module,exports){\n" + code + "\n}").join(",")}};const cache={};function require(id){if(cache[id])return cache[id].exports;const m=cache[id]={exports:{}};modules[id](require,m,m.exports);return m.exports}require(${JSON.stringify(entry)});`;
(async () => {
  const server = http
    .createServer((req, res) => {
      res.setHeader(
        "Content-Type",
        req.url === "/bundle.js" ? "application/javascript" : "text/html",
      );
      res.end(
        req.url === "/bundle.js"
          ? bundle
          : '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#14223a;font:14px system-ui;color:white}button{min-height:44px}main{padding:14px}</style><div id="root"></div><script src="/bundle.js"></script>',
      );
    })
    .listen(0, "127.0.0.1");
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage({
        viewport: { width: 390, height: 844 },
      }),
      errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    const fixtures = ["temple-cybele", "cybele-theatre"].map((n) =>
      JSON.parse(source(`tests/fixtures/navigation/${n}.json`)),
    );
    await page.route(
      "https://valhalla1.openstreetmap.de/route**",
      async (route) => {
        const request = JSON.parse(
          new URL(route.request().url()).searchParams.get("json"),
        );
        const fixture =
          request.locations[1].lon > 4.877 ? fixtures[1] : fixtures[0];
        await route.fulfill({ json: fixture });
      },
    );
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.waitForFunction(() => window.harness?.live.ready);
    // A real saved session exists before testing; stale handlers must not mutate it in simulation.
    await page.evaluate(() => {
      window.harness.live.begin();
      window.savedAdvance = window.harness.live.advance;
    });
    await page.waitForFunction(
      () =>
        window.harness.live.session && window.harness.snapshot().writes >= 3,
    );
    await page.evaluate(async () => {
      await window.harness.game.requestGPS();
      window.gpsCallback({
        coords: {
          latitude: 45.525698,
          longitude: 4.874218,
          accuracy: 5,
          heading: 0,
          speed: 0,
        },
        timestamp: Date.now(),
      });
    });
    await page.waitForFunction(() => window.harness.game.fix);
    await page
      .getByRole("button", { name: "Activer le mode test à Vienne" })
      .click();
    await page.evaluate(() =>
      window.confirmation.buttons.find((b) => b.text === "Activer").onPress(),
    );
    await page.waitForFunction(
      () =>
        window.harness.live.preview &&
        window.harness.live.ready &&
        window.harness.guide.active,
    );
    const before = await page.evaluate(() => window.harness.snapshot());
    const result = await page.evaluate(async () => {
      window.savedAdvance("consulted");
      return window.harness.game.discover("auguste");
    });
    if (result !== "simulation") throw Error("Discovery was not blocked");
    const joystick = page.getByLabel(
        "Joystick de test : faites glisser pour déplacer Catia",
      ),
      box = await joystick.boundingBox();
    await page.mouse.move(box.x + 54, box.y + 54);
    await page.mouse.down();
    await page.mouse.move(box.x + 88, box.y + 54);
    await page.waitForTimeout(1300);
    await page.mouse.up();
    await page.waitForTimeout(300);
    const moved = await page.evaluate(() => window.harness.snapshot());
    if (!(moved.fix.longitude > before.fix.longitude) || moved.fix.speed !== 0)
      throw Error("Joystick did not move/stop");
    await page.evaluate(() => window.harness.open());
    await page
      .getByRole("button", { name: "Téléporter · Théâtre antique" })
      .click();
    await page.waitForFunction(
      () => Math.abs(window.harness.snapshot().fix.longitude - 4.878314) < 1e-8,
    );
    await page.evaluate(() => window.harness.open());
    await page
      .getByRole("button", {
        name: "Téléporter · Temple d’Auguste et de Livie",
      })
      .click();
    await page.waitForFunction(() => window.harness.guide.navigation.arrived);
    await page.evaluate(() => window.harness.live.advance("consulted"));
    await page.waitForFunction(
      () =>
        window.harness.live.session.index === 1 &&
        window.harness.guide.navigation.status === "ready" &&
        window.harness.guide.navigation.route,
    );
    await page.evaluate(() => window.harness.live.play());
    await page.waitForFunction(() =>
      window.harness.live.audioError?.includes("préparation"),
    );
    const after = await page.evaluate(() => window.harness.snapshot());
    if (
      JSON.stringify(before.storage) !== JSON.stringify(after.storage) ||
      before.writes !== after.writes ||
      after.xp !== before.xp ||
      after.discoveryWrites !== before.discoveryWrites
    )
      throw Error("Simulation wrote real progress");
    await page.screenshot({
      path: path.join(os.tmpdir(), "vestige-issue7-dom-check.png"),
    });
    await page.evaluate(() => window.harness.open());
    await page.getByRole("button", { name: "Revenir au GPS réel" }).click();
    await page.waitForFunction(
      () => !window.harness.live.preview && !window.harness.simulation.enabled,
    );
    const restored = await page.evaluate(() => window.harness.snapshot());
    if (restored.session.index !== 0 || restored.fix !== null)
      throw Error("Real state was contaminated or GPS restart failed");
    await page.evaluate(() =>
      window.gpsCallback({
        coords: {
          latitude: 45.525698,
          longitude: 4.874218,
          accuracy: 5,
          heading: 0,
          speed: 0,
        },
        timestamp: Date.now(),
      }),
    );
    await page.waitForFunction(() => window.harness.game.fix);
    const realClaim = await page.evaluate(() =>
      window.harness.game.discover("auguste"),
    );
    if (realClaim !== "ok")
      throw Error("Real discoveries failed after returning from simulation");
    // Denied permission must be safe after returning from simulation.
    await page.evaluate(async () => {
      window.permission = false;
      await window.harness.game.requestGPS();
    });
    await page.waitForFunction(() =>
      window.harness.game.gps.includes("refusée"),
    );
    const denied = await page.evaluate(() => ({
      gps: window.harness.game.gps,
      fix: window.harness.game.fix,
    }));
    if (denied.fix !== null || !denied.gps.includes("refusée"))
      throw Error("GPS denial not handled");
    if (errors.length) throw Error(errors.join("\n"));
    console.log(
      JSON.stringify(
        {
          passed: true,
          checks: [
            "actual React providers/hooks mounted",
            "joystick pointer move/release",
            "theatre teleport preset",
            "stale real handler rejected",
            "XP/discovery and Live storage unchanged",
            "confirmed simulated arrival and pedestrian route",
            "ephemeral next step",
            "honest missing audio state",
            "restore real session",
            "real discovery works again",
            "denied GPS safe",
          ],
          beforeWrites: before.writes,
          afterWrites: after.writes,
          screenshot: path.join(os.tmpdir(), "vestige-issue7-dom-check.png"),
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
