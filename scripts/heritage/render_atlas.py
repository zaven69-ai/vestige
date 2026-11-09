"""Original offline XYZ cartography from the retained OSM extract (ODbL).
Cartographic 2.5D shading only; not a real-time vector extrusion engine.
Requires Python + Pillow, only when regenerating the already-bundled tiles.
"""
import json,math,hashlib
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'data/import/osm-pilot.json'; OUT=ROOT/'assets/atlas';OUT.mkdir(parents=True,exist_ok=True)
# Bounding coverage intentionally limits the first offline atlas to the pilot sector.
BOUNDS={'south':45.511,'west':4.855,'north':45.539,'east':4.891}
SIZE=256
P={'land':'#EAF0E8','park':'#CEE6BA','forest':'#BCD9AE','water':'#8BCEDC','waterEdge':'#71B5C8','road':'#FFFFFF','roadEdge':'#D1D9D7','path':'#E1DCCF','building':'#D1D7E6','edge':'#B4BDCE','roof':'#F2F1ED','wall':'#A5B1C7','shadow':'#BFCAC6'}
def project(lat,lon,z):
 n=2**z;return ((lon+180)/360*n,(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*n)
def bounds_xy(z):
 x0,y1=project(BOUNDS['south'],BOUNDS['west'],z);x1,y0=project(BOUNDS['north'],BOUNDS['east'],z)
 return math.floor(x0),math.floor(y0),math.floor(x1),math.floor(y1)
data=json.loads(SOURCE.read_text()); features=[]
for e in data['elements']:
 tags=e.get('tags',{});g=[p for p in e.get('geometry',[]) if p]
 if len(g)<2:continue
 if tags.get('waterway') in ['river','stream']:kind='river'
 elif tags.get('natural')=='water' and len(g)>3:kind='water'
 elif tags.get('leisure') in ['park','garden'] or tags.get('landuse') in ['grass','forest','meadow'] or tags.get('natural')=='wood':kind='park'
 elif 'highway' in tags and tags['highway'] not in ['platform','construction','proposed']:kind='road'
 elif tags.get('building') not in [None,'no'] and len(g)>3:kind='building'
 else:continue
 features.append({'kind':kind,'tags':tags,'g':g,'id':e['id']})
alltiles=[];height_count=0
for z in range(14,19):
 x0,y0,x1,y1=bounds_xy(z);tiles={};draws={}
 for x in range(x0,x1+1):
  for y in range(y0,y1+1):
   im=Image.new('RGB',(SIZE,SIZE),P['land']);tiles[(x,y)]=im;draws[(x,y)]=ImageDraw.Draw(im)
 # Order keeps paths on top and buildings readable without using fictitious POIs.
 order={'park':0,'water':1,'river':2,'road':3,'building':4}
 labels={k:[] for k in tiles}
 for f in sorted(features,key=lambda f:order[f['kind']]):
  points=[project(p['lat'],p['lon'],z) for p in f['g']];xs=[p[0] for p in points];ys=[p[1] for p in points];tags=f['tags'];kind=f['kind']
  width=0; height=0
  if kind=='road':
   road=tags['highway'];width={'motorway':14,'trunk':12,'primary':11,'secondary':9,'tertiary':8,'residential':6,'unclassified':6,'living_street':5,'pedestrian':6,'footway':2,'path':2,'steps':2,'cycleway':2,'service':3}.get(road,3)*2**(z-17)
  if kind=='building':
   try:height=float(tags.get('height','0').replace('m','').strip())
   except (ValueError,AttributeError):height=0
   if not 0<height<150:height=0
   if z==18 and height:height_count+=1
  margin=max(width/SIZE,0.04)
  for x in range(max(x0,math.floor(min(xs)-margin)),min(x1,math.floor(max(xs)+margin))+1):
   for y in range(max(y0,math.floor(min(ys)-margin)),min(y1,math.floor(max(ys)+margin))+1):
    d=draws[(x,y)];xy=[((px-x)*SIZE,(py-y)*SIZE) for px,py in points]
    if kind=='park':d.polygon(xy,fill=P['forest'] if tags.get('natural')=='wood' or tags.get('landuse')=='forest' else P['park'])
    elif kind=='water':d.polygon(xy,fill=P['water'])
    elif kind=='river':
     # Stroke is cartographic symbology, not a surveyed bank boundary.
     w=(130 if tags.get('waterway')=='river' else 7)/ (math.cos(math.radians(45.525))*2*math.pi*6378137/(2**z*SIZE))
     d.line(xy,fill=P['waterEdge'],width=max(1,round(w+2)),joint='curve');d.line(xy,fill=P['water'],width=max(1,round(w)),joint='curve')
    elif kind=='road':
     if width>=2:d.line(xy,fill=P['roadEdge'],width=max(1,round(width+2)),joint='curve')
     d.line(xy,fill=P['path'] if tags['highway'] in ['path','footway','steps'] else P['road'],width=max(1,round(width)),joint='curve')
     if z>=17 and tags.get('name') and tags['highway'] in ['primary','secondary','tertiary']:
      mid=xy[len(xy)//2]
      if 15<mid[0]<SIZE-30 and 15<mid[1]<SIZE-15:labels[(x,y)].append((mid,tags['name']))
    elif kind=='building':
     d.polygon(xy,fill=P['building'],outline=P['edge'])
     if height and z>=17:
      mpp=math.cos(math.radians(45.525))*2*math.pi*6378137/(2**z*SIZE);shift=min(18,height/mpp*.22)
      roof=[(a-shift*.55,b-shift) for a,b in xy]
      d.polygon([(a+shift*.4,b+shift*.35) for a,b in xy],fill=P['shadow'])
      for i in range(len(xy)-1):d.polygon([xy[i],xy[i+1],roof[i+1],roof[i]],fill=P['wall'])
      d.polygon(roof,fill=P['roof'],outline=P['edge'])
 for (x,y),im in tiles.items():
  d=ImageDraw.Draw(im)
  for point,name in labels[(x,y)][:3]:d.text(point,name[:26],fill='#69778B',stroke_width=1,stroke_fill='#FFFFFF')
  folder=OUT/str(z)/str(x);folder.mkdir(parents=True,exist_ok=True);p=folder/f'{y}.png';im.save(p,optimize=True);alltiles.append({'z':z,'x':x,'y':y,'file':str(p.relative_to(ROOT))})
 print('zoom',z,len(tiles),'tiles',flush=True)
# Extract-based source attribution and reproducibility are bundled with the tiles.
manifest={'version':hashlib.sha256(SOURCE.read_bytes()+Path(__file__).read_bytes()).hexdigest()[:12],'bounds':BOUNDS,'minZoom':14,'maxZoom':18,'tileSize':256,'count':len(alltiles),'features':len(features),'heightTaggedBuildings':height_count,'source':'OpenStreetMap contributors','license':'ODbL-1.0','copyright':'https://www.openstreetmap.org/copyright','notes':'Original raster cartography. Heights shaded only where OSM height is explicit; no real-time 3D extrusion. Waterway strokes are stylized line symbols.','tiles':alltiles}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
ts='// Generated offline from OSM. © OpenStreetMap contributors, ODbL 1.0.\nexport const atlasTiles = [\n'
for t in alltiles:ts+=f" {{ z:{t['z']}, x:{t['x']}, y:{t['y']}, asset:require('../../{t['file']}') as number }},\n"
ts+='];\n';(ROOT/'src/data/atlasTiles.ts').write_text(ts)
# A geographic preview, not a mobile screenshot.
z=16;x0,y0,x1,y1=bounds_xy(z);board=Image.new('RGB',((x1-x0+1)*256,(y1-y0+1)*256),P['land'])
for x in range(x0,x1+1):
 for y in range(y0,y1+1):board.paste(Image.open(OUT/str(z)/str(x)/f'{y}.png'),((x-x0)*256,(y-y0)*256))
preview=ROOT/'docs/v3/atlas-preview.png';preview.parent.mkdir(parents=True,exist_ok=True);board.thumbnail((1400,1400));board.save(preview)
print(len(alltiles),'tiles,',height_count,'height-tagged buildings')
