/* global __dirname */
// Real React marker with DOM substitutes for react-native-maps. Not a native iPhone test.
const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http"),
  os = require("node:os");
const ts = require("typescript"),
  { chromium } = require("playwright");
const root = path.resolve(__dirname, "../.."),
  mocks = new Map(),
  modules = new Map();
const testPoi = process.env.VESTIGE_MINIATURE_POI || "auguste";
const testMonument = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/monuments.json"), "utf8"),
).find((m) => m.id === testPoi);
const mock = (id, s) => mocks.set(id, s);
mock(
  "react-native",
  `const React=require('react');const style=s=>{const out={display:'flex',flexDirection:'column',boxSizing:'border-box',...(s||{})};if(out.opacity&&typeof out.opacity==='object')out.opacity=out.opacity.v;return out};function View(p){return React.createElement('div',{style:style(p.style)},p.children)}exports.View=View;exports.Text=p=>React.createElement('span',{style:p.style},p.children);exports.Image=p=>React.createElement('img',{src:p.source,srcSet:p.source.replace('.png','@2x.png')+' 2x, '+p.source.replace('.png','@3x.png')+' 3x',style:p.style,onLoad:p.onLoad,onError:()=>p.onError({nativeEvent:{error:'test resource unavailable'}})});exports.Animated={Value:class{constructor(v){this.v=v}},View,timing:(value,config)=>({start(){window.animations.push(config.duration);value.v=config.toValue},stop(){}})};`,
);
mock(
  "react-native-maps",
  `const React=require('react');exports.Marker=React.forwardRef((p,ref)=>{React.useImperativeHandle(ref,()=>({redraw(){window.redraws++}}),[]);return React.createElement('button',{'aria-label':p.accessibilityLabel,'data-tracking':String(p.tracksViewChanges),'data-latitude':p.coordinate.latitude,'data-longitude':p.coordinate.longitude,onClick:p.onPress,style:{background:'transparent',padding:0,border:0}},p.children)});`,
);
mock(
  path.join(root, "src/components/exploration/IllustratedPoiMarker.tsx"),
  `const React=require('react');exports.IllustratedPoiMarker=p=>React.createElement('button',{'aria-label':'gold-fallback',onClick:()=>p.onSelect(p.monument)},'Marqueur doré de secours');`,
);
const entry = "/miniature-test.js";
mock(
  entry,
  `const React=require('react'),{createRoot}=require('react-dom/client');const {MonumentMiniatureMarker}=require('${root}/src/components/exploration/MonumentMiniatureMarker.tsx');window.redraws=0;window.animations=[];
function App(){const [heading,setHeading]=React.useState(0),[enabled,setEnabled]=React.useState(true),[reduced,setReduced]=React.useState(false),[key,setKey]=React.useState(0),[selected,setSelected]=React.useState(false);window.test={heading:setHeading,enabled:setEnabled,reduced:v=>{setReduced(v);setKey(x=>x+1)},reset:()=>{setHeading(0);setKey(x=>x+1)}};return React.createElement('main',null,React.createElement('h1',null,'Contrôle React — miniature 2.5D'),React.createElement('p',null,'Substituts DOM : ce contrôle ne valide ni MapKit ni un rendu physique iPhone.'),React.createElement('section',{style:{minHeight:350,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:20,background:'repeating-linear-gradient(28deg,#14283d 0px,#14283d 40px,#243e51 42px,#14283d 47px)'}},React.createElement(MonumentMiniatureMarker,{key,monument:{...${JSON.stringify(testMonument)},origin:'editorial',reviewStatus:'unreviewed'},selected,state:'undiscovered',mapHeading:heading,plan:{enabled,size:128},reducedMotion:reduced,onSelect:()=>setSelected(true),onOpenMiniature:m=>{window.opened=m;setSelected(true)}})),selected?React.createElement('p',null,'Fiche existante sélectionnée · ${testPoi}'):null)}createRoot(document.getElementById('root')).render(React.createElement(App));`,
);
function resolve(id, from) {
  if (mocks.has(id)) return id;
  if (id.startsWith(".") || id.startsWith("/")) {
    const p = id.startsWith("/") ? id : path.resolve(path.dirname(from), id);
    for (const ext of ["", ".ts", ".tsx", ".js", ".json"])
      if (
        mocks.has(p + ext) ||
        (fs.existsSync(p + ext) && fs.statSync(p + ext).isFile())
      )
        return p + ext;
  }
  return require.resolve(id, { paths: [path.dirname(from), root] });
}
function collect(id) {
  if (modules.has(id)) return;
  modules.set(id, "");
  let code = mocks.get(id);
  if (id.endsWith(".png"))
    code = "module.exports=" + JSON.stringify("/" + path.relative(root, id));
  else if (code === undefined) code = fs.readFileSync(id, "utf8");
  if (id.endsWith(".json")) code = "module.exports=" + code;
  else if (/\.tsx?$/.test(id))
    code = ts.transpileModule(code, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText;
  code = code.replace(/require\(["']([^"']+)["']\)/g, (_, dep) => {
    const p = resolve(dep, id);
    collect(p);
    return `require(${JSON.stringify(p)})`;
  });
  modules.set(id, code);
}
collect(entry);
const bundle = `const process={env:{NODE_ENV:'development'}},__DEV__=true;const modules={${[...modules].map(([p, s]) => JSON.stringify(p) + ":function(require,module,exports){\n" + s + "\n}").join(",")}};const cache={};function require(p){if(cache[p])return cache[p].exports;const m=cache[p]={exports:{}};modules[p](require,m,m.exports);return m.exports}require(${JSON.stringify(entry)});`;
(async () => {
  const server = http
    .createServer((req, res) => {
      if (req.url.startsWith("/assets/")) {
        const p = path.resolve(root, "." + decodeURIComponent(req.url));
        if (!p.startsWith(root + "/assets/")) {
          res.statusCode = 403;
          return res.end();
        }
        if (!fs.existsSync(p)) {
          res.statusCode = 404;
          return res.end();
        }
        res.setHeader("Content-Type", "image/png");
        return res.end(fs.readFileSync(p));
      }
      res.setHeader(
        "Content-Type",
        req.url === "/bundle.js" ? "application/javascript" : "text/html",
      );
      res.end(
        req.url === "/bundle.js"
          ? bundle
          : '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:14px;box-sizing:border-box;background:#07152c;color:#d8c59c;font:14px system-ui}h1{font-size:18px}main{max-width:430px;margin:auto}</style><div id="root"></div><script src="/bundle.js"></script>',
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
        deviceScaleFactor: 2,
      }),
      errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    const marker = page.getByRole("button", {
      name: new RegExp(testMonument.name),
    });
    await page.waitForFunction(() =>
      document.querySelector('[data-tracking="false"]'),
    );
    if (
      (await marker.getAttribute("data-latitude")) !==
      String(testMonument.latitude)
    )
      throw Error("Canonical latitude changed");
    await marker.click();
    await page.getByText("Fiche existante sélectionnée · " + testPoi).waitFor();
    await page.evaluate(() => window.test.heading(45));
    await page.waitForFunction(
      () =>
        document.querySelector("img").src.includes("view-1.png") &&
        document.querySelector('[data-tracking="false"]'),
    );
    await page.evaluate(() => window.test.heading(0));
    await page.waitForFunction(
      () =>
        document.querySelector("img").src.includes("view-0.png") &&
        document.querySelector('[data-tracking="false"]'),
    );
    for (const width of [320, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      if (
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        )
      )
        throw Error("Horizontal overflow");
      await page.screenshot({
        path: path.join(
          os.tmpdir(),
          "vestige-" + testPoi + "-" + width + ".png",
        ),
      });
    }
    await page.evaluate(() => window.test.enabled(false));
    await page.getByRole("button", { name: "gold-fallback" }).waitFor();
    await page.evaluate(() => {
      window.test.reduced(true);
      window.test.enabled(true);
    });
    await page.waitForFunction(() =>
      document.querySelector('[data-tracking="false"]'),
    );
    if (!(await page.evaluate(() => window.animations.includes(0))))
      throw Error("Reduced motion ignored");
    await page.route("**/view-3*.png", (route) => route.abort());
    await page.evaluate(() => window.test.heading(135));
    await page.getByRole("button", { name: "gold-fallback" }).waitFor();
    if (errors.length) throw Error(errors.join("\n"));
    console.log(
      JSON.stringify(
        {
          passed: true,
          checks: [
            "real React miniature component",
            "canonical coordinates",
            "press opens existing id",
            "rotation changes bitmap",
            "snapshot tracking stops after load",
            "320/390/430 layout",
            "opt-out fallback",
            "reduced animation",
            "failed image fallback",
          ],
          screenshots: "/tmp/vestige-temple-{320,390,430}.png",
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
