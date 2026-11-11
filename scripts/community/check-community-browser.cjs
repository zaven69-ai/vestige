/* global __dirname */
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
  [
    "auguste",
    "cybele",
    "theatre-vienne",
    "fourviere",
    "theatre-lyon",
    "saint-jean",
  ].includes(m.id),
);
const mocks = new Map();
const mock = (id, code) => mocks.set(id, code);
mock(
  "react-native",
  `const React=require('react');
const flatten=s=>Array.isArray(s)?Object.assign({},...s.filter(Boolean).map(flatten)):s||{};
function View(p){const origin=React.useRef(null);const style={display:"flex",flexDirection:"column",boxSizing:"border-box",...flatten(p.style)};delete style.transform;if(typeof style.lineHeight==='number')style.lineHeight+='px';return React.createElement('div',{style,
 onPointerDown:e=>{if(p.onStartShouldSetPanResponder?.()){origin.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);p.onPanResponderGrant?.(e)}},
 onPointerMove:e=>{if(origin.current)p.onPanResponderMove?.(e,{dx:e.clientX-origin.current.x,dy:e.clientY-origin.current.y})},
 onPointerUp:e=>{origin.current=null;p.onPanResponderRelease?.(e)},onPointerCancel:e=>{origin.current=null;p.onPanResponderTerminate?.(e)},
 'aria-label':p.accessibilityLabel},p.children)}
function Text(p){return React.createElement('span',{style:flatten(p.style)},p.children)}
exports.View=View;exports.Text=Text;exports.ScrollView=View;exports.Modal=p=>p.visible?React.createElement('section',{'aria-label':'Developer dialog',style:{position:'fixed',inset:0,zIndex:1000,overflow:'auto',display:'flex',flexDirection:'column',background:'#07152C'}},p.children):null;
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
  `exports.monuments=${JSON.stringify(points)};exports.trails=[];exports.cities={Lyon:{latitude:45.7602,longitude:4.826},Vienne:{latitude:45.525698,longitude:4.874218}};`,
);
mock(
  path.join(root, "src/components/live/NativeNarration.tsx"),
  "exports.NativeNarration=()=>null;",
);
mock(
  path.join(root, "src/components/ui.tsx"),
  `const React=require('react');exports.s={heading:{color:'white'},body:{color:'#ccc'},caption:{color:'#aaa'}};exports.Button=p=>React.createElement('button',{disabled:p.disabled,onClick:p.onPress,style:{padding:12,margin:4}},p.title);`,
);
// DOM adapters exercise actual native screens and providers without claiming an iPhone render.
mock(
  "react-native",
  mocks.get("react-native") +
    `
exports.TextInput=p=>React.createElement(p.multiline?'textarea':'input',{'aria-label':p.accessibilityLabel,value:p.value,maxLength:p.maxLength,onChange:e=>p.onChangeText(e.target.value),style:flatten(p.style)});
exports.Image=p=>React.createElement('div',{'aria-label':p.accessibilityLabel},'Photo locale');
exports.Share={share:async p=>{window.shared=p;return {action:'sharedAction'}}};exports.Linking={openURL:async()=>{}};`,
);
mock(
  "expo-linking",
  `exports.createURL=(path,o)=>'exp://127.0.0.1:8088/--'+path+'?'+new URLSearchParams(o.queryParams);`,
);
mock(
  "expo-router",
  `exports.useLocalSearchParams=()=>window.routeParams;const go=p=>{window.routeParams=typeof p==='string'?{}:p.params||{};window.screen=typeof p==='string'?p:p.pathname;window.dispatchEvent(new Event('route'))};exports.router={push:go,navigate:go,replace:go,back:()=>go('/communaute')};`,
);
mock(
  path.join(root, "src/lib/contributions/photos.ts"),
  `exports.pickDraftPhoto=async()=>null;exports.removeDraftPhoto=()=>{};`,
);
mock(
  path.join(root, "src/components/community/RoutePreview.tsx"),
  `const React=require('react');exports.RoutePreview=({ids})=>React.createElement('p',null,'Aperçu carte natif substitué : '+ids.join(', '));`,
);
mock(
  path.join(root, "src/components/ui.tsx"),
  mocks.get(path.join(root, "src/components/ui.tsx")) +
    `
exports.Page=p=>React.createElement('main',null,React.createElement('h1',null,p.title),p.children);
exports.Card=p=>React.createElement('section',{style:{padding:16,border:'1px solid #A98B4E',borderRadius:16,margin:'12px 0',display:'flex',flexDirection:'column',gap:8}},p.children);
exports.Badge=p=>React.createElement('span',{style:{color:'#E3C88E'}},p.children);exports.Icon=()=>React.createElement('span',null,'✦');`,
);
const entry = "/community-harness.js";
mock(
  entry,
  `const React=require('react'),{createRoot}=require('react-dom/client');
const {DeveloperLocationProvider,useSimulation}=require('${root}/src/lib/developer/DeveloperLocation.tsx');
const {GameProvider,useGame}=require('${root}/src/lib/store.tsx');
const {CommunityProvider,useCommunity}=require('${root}/src/lib/community/CommunityProvider.tsx');
const {LiveProvider,useLive}=require('${root}/src/lib/live/LiveProvider.tsx');
const {useExplorationLocation}=require('${root}/src/hooks/useExplorationLocation.ts');
const {useExplorerGuidance}=require('${root}/src/hooks/useExplorerGuidance.ts');
const Feed=require('${root}/src/app/communaute/index.tsx').default;
const Editor=require('${root}/src/app/communaute/creer.tsx').default;
const Detail=require('${root}/src/app/communaute/[id].tsx').default;
const Profile=require('${root}/src/app/communaute/profil.tsx').default;
const Import=require('${root}/src/app/communaute/importer.tsx').default;
const Moderation=require('${root}/src/app/communaute/moderation.tsx').default;
window.appListeners=[];window.storage=JSON.parse(sessionStorage.getItem('saved')||'{}');window.storageWrites=[];window.journal={};window.xp=0;window.discoveryWrites=0;window.permission=true;window.routeParams={};window.screen='/communaute';
function App(){const c=useCommunity(),live=useLive(),game=useGame(),simulation=useSimulation(),location=useExplorationLocation(),guide=useExplorerGuidance(window.screen==='/(tabs)',location.position);const [route,setRoute]=React.useState(window.screen);React.useEffect(()=>{const f=()=>setRoute(window.screen+JSON.stringify(window.routeParams));window.addEventListener('route',f);return()=>window.removeEventListener('route',f)},[]);
window.harness={c,live,game,simulation,guide};
const screen=window.screen;let Screen=screen==='/communaute'?Feed:screen==='/communaute/creer'?Editor:screen==='/communaute/profil'?Profile:screen==='/communaute/importer'?Import:screen==='/communaute/moderation'?Moderation:Detail;
if(screen.startsWith('/communaute/social-'))window.routeParams={id:screen.split('/').pop()};
return screen==='/(tabs)'?React.createElement('main',null,React.createElement('h1',null,'Explorer - moteur réel, carte native substituée'),React.createElement('p',null,live.tour.title),React.createElement('p',null,live.tour.stops.map(s=>s.poiId).join(' > '))):React.createElement(Screen,{key:route});}
createRoot(document.getElementById('root')).render(React.createElement(DeveloperLocationProvider,null,React.createElement(GameProvider,null,React.createElement(CommunityProvider,null,React.createElement(LiveProvider,null,React.createElement(App))))));`,
);
const modules = new Map();
function resolve(id, from) {
  if (mocks.has(id)) return id;
  if (id.startsWith(".") || id.startsWith("/")) {
    const candidate = id.startsWith("/")
      ? id
      : path.resolve(path.dirname(from), id);
    for (const suffix of ["", ".ts", ".tsx", ".js", ".json", "/index.ts"])
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
          : '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:16px;background:#07152C;color:#f5f0e5;font:14px system-ui}button{min-height:44px;background:#142d49;color:#e3c88e;border:1px solid #a98b4e;border-radius:12px}main{display:flex;flex-direction:column;gap:8px}input,textarea{font:16px system-ui}</style><div id="root"></div><script src="/bundle.js"></script>',
      );
    })
    .listen(0, "127.0.0.1");
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const errors = [];
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.waitForFunction(
      () => window.harness?.c.ready && window.harness.live.ready,
    );
    const go = async (path, params = {}) => {
      await page.evaluate(
        ({ path, params }) => {
          window.screen = path;
          window.routeParams = params;
          window.dispatchEvent(new Event("route"));
        },
        { path, params },
      );
    };
    await page
      .getByRole("button", { name: "Mon profil communautaire", exact: true })
      .click();
    await page.getByLabel("Pseudo public").fill("Passeur de test");
    await page.getByLabel("Bio courte").fill("Profil de test local");
    await page
      .getByRole("button", { name: "Enregistrer mon profil local" })
      .click();
    await page
      .getByRole("button", { name: "Créer mon parcours", exact: true })
      .click();
    await page
      .getByLabel("Titre", { exact: true })
      .fill("Deux monuments de test");
    await page
      .getByLabel("Description ou anecdote")
      .fill("Création utilisateur de test, non vérifiée.");
    await page.getByLabel("Catégorie / thème").fill("Architecture");
    await page.getByRole("button", { name: /\+.*Fourvière/ }).click();
    await page.getByRole("button", { name: /\+.*Saint-Jean/ }).click();
    await page
      .getByRole("button", { name: "Enregistrer en brouillon privé" })
      .click();
    await page.getByRole("button", { name: "Modifier ma création" }).click();
    await page
      .getByRole("button", { name: "Monter", exact: true })
      .nth(1)
      .click();
    await page
      .getByRole("button", { name: "Ajouter au fil local · non vérifié" })
      .click();
    await page
      .getByRole("button", { name: "Enregistrer cette création" })
      .click();
    await page
      .getByRole("button", { name: "Partager une copie", exact: true })
      .click();
    const code = await page.evaluate(
      () =>
        window.shared.message.split(
          "Code à coller dans Communauté > Importer :\n",
        )[1],
    );
    if (!code?.startsWith("VESTIGE1:"))
      throw Error("Native share adapter did not receive portable code");
    const ownedId = await page.evaluate(
      () => window.harness.c.state.items[0].id,
    );
    await page
      .getByRole("button", { name: "Lancer ce parcours dans Explorer" })
      .click();
    await page.waitForFunction(() =>
      window.harness.live.session?.tourId.startsWith("social-"),
    );
    if (
      !(await page.evaluate(
        () =>
          window.harness.live.tour.stops[0].poiId === "saint-jean" &&
          window.harness.live.tour.stops.every((s) => s.storyId === ""),
      ))
    )
      throw Error("Order/audio protections lost");
    await page.evaluate(() =>
      sessionStorage.setItem("saved", JSON.stringify(window.storage)),
    );
    await page.reload();
    await page.waitForFunction(
      () => window.harness?.live.ready && window.harness.c.ready,
    );
    if (
      !(await page.evaluate(
        (id) => window.harness.live.session?.tourId === id,
        ownedId,
      ))
    )
      throw Error("Community tour not restored after hydration");
    // A second browser context is a separate local device, not a simulated online account.
    const second = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    second.on("pageerror", (e) => errors.push(String(e)));
    await second.goto(`http://127.0.0.1:${server.address().port}`);
    await second.waitForFunction(
      () => window.harness?.c.ready && window.harness.live.ready,
    );
    if (
      (await second.evaluate(() => window.harness.c.state.items.length)) !== 0
    )
      throw Error("Devices not isolated");
    await second
      .getByRole("button", { name: "Importer une création partagée" })
      .click();
    await second.getByLabel("Code Vestige", { exact: true }).fill(code);
    await second
      .getByRole("button", { name: "Confirmer et enregistrer cette copie" })
      .click();
    await second
      .getByRole("button", { name: "Lancer ce parcours dans Explorer" })
      .click();
    await second.waitForFunction(() =>
      window.harness.live.session?.tourId.startsWith("social-import-"),
    );
    if (
      !(await second.evaluate(
        () =>
          !window.harness.c.state.items[0].owned &&
          window.harness.game.xp === 0 &&
          window.discoveryWrites === 0,
      ))
    )
      throw Error("Import ownership/progression leak");
    await go("/communaute/creer", { kind: "discovery", poi: "saint-jean" });
    await page.getByLabel("Titre", { exact: true }).fill("Découverte de test");
    await page
      .getByLabel("Description ou anecdote")
      .fill("Une note locale sans source validée.");
    await page
      .getByRole("button", { name: "Ajouter au fil local · non vérifié" })
      .click();
    await page.getByRole("button", { name: "Modifier ma création" }).click();
    await page.getByLabel("Description ou anecdote").fill("Texte modifié.");
    await page
      .getByRole("button", { name: "Enregistrer les modifications" })
      .click();
    await page
      .getByLabel("Motif du signalement")
      .fill("Signalement de test local");
    await page
      .getByRole("button", {
        name: "Conserver le signalement local et masquer",
      })
      .click();
    if (await page.getByRole("heading", { name: "Découverte de test" }).count())
      throw Error("Reported item not hidden");
    await page
      .getByRole("button", { name: "Brouillons et signalements locaux" })
      .click();
    await page
      .getByRole("button", { name: "Consulter la création masquée" })
      .click();
    await page
      .getByRole("button", { name: "Supprimer ma création locale" })
      .click();
    await page.evaluate(() =>
      window.confirmation.buttons.find((b) => b.text === "Supprimer").onPress(),
    );
    await page.waitForFunction(
      () =>
        !window.harness.c.state.items.some(
          (i) => i.title === "Découverte de test",
        ),
    );
    await page.screenshot({
      path: path.join(os.tmpdir(), "vestige-community-local.png"),
      fullPage: true,
    });
    if (errors.length) throw Error(errors.join("\n"));
    console.log(
      JSON.stringify(
        {
          passed: true,
          checks: [
            "actual React community screens/providers",
            "profile editing",
            "ordered multi-POI draft and local publication",
            "save and native share payload",
            "launch real Explorer engine",
            "persisted tour restored after provider hydration",
            "second isolated device imports portable code and starts tour",
            "no imported audio/XP",
            "discovery edit/report/hide/delete",
            "no fake remote activity",
          ],
          screenshot: path.join(os.tmpdir(), "vestige-community-local.png"),
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
