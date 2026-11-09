"""Optional Commons import. Accept only explicit reusable licenses; retain credits."""
import json,sys,urllib.parse,re,time
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
from import_pois import get,ROOT,CACHE
rows=json.loads((ROOT/'src/data/generated/heritage.json').read_text());files=[r['_photoFile'] for r in rows if r.get('_photoFile')]
url='https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode({'action':'query','format':'json','titles':'|'.join('File:'+f for f in files),'prop':'imageinfo','iiprop':'url|extmetadata','iiurlwidth':720})
raw=get(url);(CACHE/'commons-photos.json').write_bytes(raw)
pages=json.loads(raw)['query']['pages'];out={};folder=ROOT/'assets/monuments/v3';folder.mkdir(parents=True,exist_ok=True)
def plain(text):return re.sub('<[^>]*>','',text or '').strip()
for r in rows:
 page=next((p for p in pages.values() if p.get('title','').removeprefix('File:').replace('_',' ')==str(r.get('_photoFile')).replace('_',' ')),None)
 if not page or not page.get('imageinfo'):continue
 i=page['imageinfo'][0];meta=i.get('extmetadata',{});license=meta.get('LicenseShortName',{}).get('value','');author=plain(meta.get('Artist',{}).get('value',''))
 if not author or not (license.startswith(('CC BY-SA','CC BY ')) or license in ['CC0','Public domain']):continue
 imageurl=i.get('thumburl',i.get('url',''))
 if not imageurl or '.svg' in imageurl.lower():continue
 try:
  data=get(imageurl)
  if not data.startswith(b'\xff\xd8'):continue
  (folder/(r['id']+'.jpg')).write_bytes(data)
  out[r['id']]={'photoPage':i['descriptionurl'],'attribution':author+' · '+license,'license':license,'licenseUrl':meta.get('LicenseUrl',{}).get('value','')}
 except Exception as e:
  print('Photo skipped:',r['id'],str(e));break
 time.sleep(.2)
(CACHE/'photos.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
(ROOT/'src/data/generated/photos.ts').write_text('// Commons photos with reviewed reusable license metadata.\nexport const heritagePhotos: Record<string, { image: number; photoPage: string; attribution: string }> = {\n'+''.join('  '+json.dumps(k)+': { image: require("../../../assets/monuments/v3/'+k+'.jpg"), photoPage: '+json.dumps(v['photoPage'])+', attribution: '+json.dumps(v['attribution'])+' },\n' for k,v in out.items())+'};\n')
print(len(out),'licensed photos retained')
