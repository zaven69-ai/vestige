"""Offline, review-gated import. No network request runs from phone GPS updates.
Commands: candidates, build, fetch-wiki, fetch-osm, pop-csv FILE.
OSM is never automatically approved. Review decisions are required before build.
"""
import argparse,csv,hashlib,json,math,re,urllib.request,urllib.parse,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];CACHE=ROOT/'data/import';OUT=ROOT/'src/data/generated';CACHE.mkdir(parents=True,exist_ok=True);OUT.mkdir(parents=True,exist_ok=True)
UA={'User-Agent':'Vestige/3.0 (offline heritage pilot; cached imports)'}
def read(p,default=None):return json.loads(p.read_text()) if p.exists() else default

def get(url):
 try:return urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=90).read()
 except urllib.error.HTTPError as e:
  if e.code==429:raise RuntimeError('Source rate limited. Retry-After='+str(e.headers.get('Retry-After','unspecified'))+'; cached files retained. No automatic retry.') from e
  raise

def wd_values(e,p):return [r.get('mainsnak',{}).get('datavalue',{}).get('value') for r in e.get('claims',{}).get(p,[]) if r.get('rank')!='deprecated' and r.get('mainsnak',{}).get('datavalue')]
def valid(lat,lon):return isinstance(lat,(int,float)) and isinstance(lon,(int,float)) and math.isfinite(lat) and math.isfinite(lon) and 41<=lat<=52 and -6<=lon<=10

def candidates():
 wd=read(CACHE/'wikidata.json',{}).get('entities',{});osm=read(CACHE/'osm-pilot.json',{}).get('elements',[]);rows=[]
 for q,e in wd.items():
  cs=wd_values(e,'P625');label=e.get('labels',{}).get('fr',{}).get('value');c=next((c for c in cs if isinstance(c,dict) and c.get('globe','').endswith('/Q2') and valid(c.get('latitude'),c.get('longitude'))),None)
  if c and label:rows.append({'key':q,'name':label,'latitude':c['latitude'],'longitude':c['longitude'],'precisionDegrees':c.get('precision'),'popRefs':wd_values(e,'P380'),'wikipedia':e.get('sitelinks',{}).get('frwiki',{}).get('title'),'status':'pending'})
 # Only heritage-labelled features enter the candidate queue; still no auto-approval.
 for e in osm:
  t=e.get('tags',{});name=t.get('name');q=t.get('wikidata');g=[p for p in e.get('geometry',[]) if p]
  if not(name and (t.get('historic') or t.get('heritage') or t.get('tourism')=='museum')):continue
  if q and any(r['key']==q for r in rows):continue
  lat=e.get('lat') if e['type']=='node' else (sum(p['lat'] for p in g)/len(g) if g else None);lon=e.get('lon') if e['type']=='node' else (sum(p['lon'] for p in g)/len(g) if g else None)
  if valid(lat,lon):rows.append({'key':f"osm:{e['type']}/{e['id']}",'name':name,'latitude':lat,'longitude':lon,'popRefs':[t['ref:mhs']] if t.get('ref:mhs') else [],'status':'pending'})
 (CACHE/'candidates.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n');print(len(rows),'candidates; explicit review required')

def build():
 wd=read(CACHE/'wikidata.json',{}).get('entities',{});osm=read(CACHE/'osm-pilot.json',{}).get('elements',[]);decisions=read(CACHE/'review.json',[])
 pages={}
 for file in ['wiki-batch.json','wiki-extra.json']:
  for p in read(CACHE/file,{}).get('query',{}).get('pages',{}).values():
   q=p.get('pageprops',{}).get('wikibase_item')
   if q:pages[q]={**pages.get(q,{}),**{k:v for k,v in p.items() if v}}
 accepted=[];seen=set();report=[]
 for decision in decisions:
  if decision.get('status')!='approved':continue
  q=decision['key'];e=wd.get(q,{});p=pages.get(q,{});matching=[i for i in osm if i.get('tags',{}).get('wikidata')==q]
  if q in seen:raise ValueError('Duplicate source entity '+q)
  seen.add(q)
  refs=wd_values(e,'P380');cs=wd_values(e,'P625');c=next((c for c in cs if isinstance(c,dict) and c.get('globe','').endswith('/Q2') and valid(c.get('latitude'),c.get('longitude'))),None)
  if c and (c.get('precision') or 0)<=.0003:
   lat,lon=c['latitude'],c['longitude'];coord={'provider':'Wikidata','id':q,'url':'https://www.wikidata.org/wiki/'+q,'precisionDegrees':c.get('precision')}
  elif p.get('coordinates'):
   c=p['coordinates'][0];lat,lon=c['lat'],c['lon'];coord={'provider':'Wikipedia','id':p['title'],'url':p.get('fullurl','https://fr.wikipedia.org/wiki/'+urllib.parse.quote(p['title'])),'precisionDegrees':None}
  else:
   node=next((n for n in matching if n['type']=='node' and valid(n.get('lat'),n.get('lon'))),None)
   way=next((n for n in matching if n.get('geometry')),None)
   if node:lat,lon=node['lat'],node['lon'];origin=node;method='source point'
   elif way:
    g=[v for v in way['geometry'] if v];lat=sum(v['lat'] for v in g)/len(g);lon=sum(v['lon'] for v in g)/len(g);origin=way;method='representative mean of source geometry; not an entrance'
   else:raise ValueError('No verified coordinates for '+q)
   coord={'provider':'OpenStreetMap','id':f"{origin['type']}/{origin['id']}",'url':f"https://www.openstreetmap.org/{origin['type']}/{origin['id']}",'method':method,'precisionDegrees':None}
  # Manual coordinate-source selection is allowed; no free-form invented numbers.
  if decision.get('coordinateOsmWay'):
   origin=next(v for v in osm if v['type']=='way' and v['id']==decision['coordinateOsmWay']);g=origin['geometry'][:-1];lat=sum(v['lat'] for v in g)/len(g);lon=sum(v['lon'] for v in g)/len(g);coord={'provider':'OpenStreetMap','id':f"way/{origin['id']}",'url':f"https://www.openstreetmap.org/way/{origin['id']}",'method':'representative mean of verified building footprint; not an entrance','precisionDegrees':None}
  if not valid(lat,lon):raise ValueError('Invalid coordinate '+q)
  sources=[{'provider':'Wikidata','id':q,'url':'https://www.wikidata.org/wiki/'+q,'license':'CC0'}]
  if p.get('title'):sources.append({'provider':'Wikipedia','id':str(p['pageid']),'url':p.get('fullurl','https://fr.wikipedia.org/wiki/'+urllib.parse.quote(p['title'])),'license':'CC BY-SA 4.0'})
  for ref in refs:
   if isinstance(ref,str) and re.fullmatch(r'(PA|IA|PJR)\d+',ref):sources.append({'provider':'POP / Mérimée (reference via Wikidata)','id':ref,'url':'https://pop.culture.gouv.fr/notice/merimee/'+ref,'license':'Identifier referenced from CC0 data; no POP image/text copied'})
  for n in matching:sources.append({'provider':'OpenStreetMap','id':f"{n['type']}/{n['id']}",'url':f"https://www.openstreetmap.org/{n['type']}/{n['id']}",'license':'ODbL 1.0'})
  text=p.get('extract','') if not decision.get('minimalOnly') else ''
  record={'id':decision['id'],'name':decision.get('name') or p.get('title') or e.get('labels',{}).get('fr',{}).get('value'),'city':decision['city'],'era':decision.get('era','Période non précisée'),'category':decision['category'],'xp':100,'latitude':lat,'longitude':lon,'description':text,'source':sources[1]['url'] if len(sources)>1 and sources[1]['provider']=='Wikipedia' else sources[0]['url'],'sourceRefs':sources,'coordinateSource':coord,'contentQuality':'documented' if text else 'minimal','aliases':decision.get('aliases',[]),'timeline':[],'relatedIds':decision.get('relatedIds',[]),'review':{'status':'approved','reviewedAt':'2026-11-09','note':decision['note']},'photoPage':None,'attribution':'','image':None}
  for date in wd_values(e,'P571'):
   if isinstance(date,dict) and date.get('precision',0)>=9 and re.match(r'^[+-]\d+-',date.get('time','')):
    year=int(date['time'].split('-')[0]) if date['time'].startswith('+') else -int(date['time'][1:].split('-')[0])
    record['timeline'].append({'date':str(year) if year>0 else str(abs(year))+' av. J.-C.','label':'Date de création indiquée par Wikidata (peut concerner une phase du site).','source':'https://www.wikidata.org/wiki/'+q})
  if decision.get('legacyId'):record['legacyId']=decision['legacyId']
  record['_photoFile']=next(iter(wd_values(e,'P18')),None) or p.get('pageimage')
  record['_thumbUrl']=p.get('thumbnail',{}).get('source')
  accepted.append(record);report.append({'id':record['id'],'source':q,'quality':record['contentQuality'],'coordinates':coord})
 (OUT/'heritage.json').write_text(json.dumps(accepted,ensure_ascii=False,indent=2)+'\n');(CACHE/'review-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(len(accepted),'reviewed records built; no publication performed')

def main():
 ap=argparse.ArgumentParser();ap.add_argument('command',choices=['candidates','build','fetch-wiki','fetch-osm','pop-csv']);ap.add_argument('--bbox',default='45.505,4.850,45.544,4.903');ap.add_argument('--file');args=ap.parse_args()
 if args.command=='candidates':candidates()
 elif args.command=='build':build()
 elif args.command=='fetch-wiki':
  review=read(CACHE/'review.json',[]);ids=sorted({r['key'] for r in review if r.get('status')=='approved' and r['key'].startswith('Q')})
  url='https://www.wikidata.org/w/api.php?'+urllib.parse.urlencode({'action':'wbgetentities','format':'json','ids':'|'.join(ids),'props':'claims|labels|sitelinks','languages':'fr'})
  raw=get(url);entities=json.loads(raw).get('entities',{});titles=[e['sitelinks']['frwiki']['title'] for e in entities.values() if e.get('sitelinks',{}).get('frwiki')]
  pages={}
  for start in range(0,len(titles),10):
   params={'action':'query','format':'json','titles':'|'.join(titles[start:start+10]),'prop':'extracts|coordinates|pageimages|pageprops|info','exintro':1,'explaintext':1,'exlimit':10,'piprop':'original|thumbnail|name','pithumbsize':960,'inprop':'url','redirects':1,'colimit':'max'}
   batch=json.loads(get('https://fr.wikipedia.org/w/api.php?'+urllib.parse.urlencode(params)))
   pages.update(batch.get('query',{}).get('pages',{}))
  (CACHE/'wikidata.json').write_bytes(raw);(CACHE/'wiki-batch.json').write_text(json.dumps({'query':{'pages':pages}},ensure_ascii=False))
  (CACHE/'wiki-extra.json').write_text('{}')
  print('Wikidata and Wikipedia caches refreshed. Review before build; no automatic publication.')
 elif args.command=='fetch-osm':
  bbox=args.bbox
  if not re.fullmatch(r'[\d., -]+',bbox):raise ValueError('Invalid bbox')
  query=f'[out:json][timeout:90];(way["building"]({bbox});way["highway"]({bbox});way["leisure"]({bbox});way["natural"]({bbox});way["waterway"]({bbox});node["historic"]({bbox});way["historic"]({bbox});node["heritage"]({bbox});node["tourism"="museum"]({bbox}););out geom;'
  (CACHE/'osm-pilot.json').write_bytes(get('https://overpass-api.de/api/interpreter?'+urllib.parse.urlencode({'data':query})));print('OSM cache refreshed; candidates still require review.')
 else:
  if not args.file:raise ValueError('--file official CSV path required')
  # External POP export is staged, never auto-published; rights and column mapping need review.
  with open(args.file,encoding='utf-8-sig',newline='') as f:rows=list(csv.DictReader(f,delimiter=';'))
  (CACHE/'pop-staging.json').write_text(json.dumps({'status':'pending-license-and-schema-review','rows':rows},ensure_ascii=False,indent=2));print(len(rows),'POP rows staged; not included in the app automatically')
if __name__=='__main__':main()
