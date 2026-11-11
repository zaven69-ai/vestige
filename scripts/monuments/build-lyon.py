"""Original present-state Lyon illustrations, same bitmap pipeline as Auguste.
blender -b --python-exit-code 1 --threads 2 --python scripts/monuments/build-lyon.py
"""
import bpy,math,os,json
from mathutils import Vector
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
# Reuse the pilot's original modelling helpers, materials and render configuration only.
helper=open(os.path.join(ROOT,'scripts/monuments/build-auguste.py')).read().split('# Coordinates:')[0]
exec(compile(helper,'build-auguste-helpers','exec'))
scene.cycles.samples=32;scene.render.resolution_x=512;scene.render.resolution_y=512
weathered=mat('Weathered surviving masonry',(.32,.29,.23))
bronze=mat('Present green roof',(.055,.16,.14));grass=mat('Grass between preserved ruins',(.11,.19,.08))
def arch(name,x,y,z,width,height,depth):
 cube(name+' dark recess',(x,y,z+height*.35),(width,depth,height*.7),dark,.02)
 # Semicircular top of a blind recess, frontal plane normal Y.
 verts=[(x,y-depth/2,z+height*.7)]+[(x+width/2*math.cos(a*math.pi/24),y-depth/2,z+height*.7+width/2*math.sin(a*math.pi/24)) for a in range(25)]
 prism(name+' arch head',verts,[tuple(range(len(verts)))],dark)
def fourviere():
 cube('Present basilica nave',(0,0,10),(17,36,20),stone,.12)
 cube('Facade entablature',(0,-18.3,18.8),(18,.8,1),edge,.05)
 # Lower porch and upper arcaded gallery; four corner towers are the defining silhouette.
 for x in [-5.5,0,5.5]:
  arch('Porch',x,-18.55,1,3.8,10,.10)
  cyl('Porch pier',x-2.3,-18.9,5.6,.48,10,edge)
 for x in [-6,-4,-2,0,2,4,6]:arch('Upper gallery',x,-18.6,13,1.1,3.7,.12)
 for x in [-7.6,7.6]:
  for y in [-16,15.5]:
   cyl('Octagonal corner tower',x,y,15.5,2.25,31,stone,8)
   for zz in [6,12,23.4,29.9]:cyl('Tower moulding',x,y,zz,2.4,.45,edge,8)
   for dx in [-.65,.65]:arch('Tower west belfry',x+dx,y-2.12,24, .8,4,.08)
   for k in range(8):
    a=k*math.pi/4;cube('Crown merlon',(x+2.05*math.cos(a),y+2.05*math.sin(a),31.4),(.55,.55,1.0),edge,.03)
   bpy.ops.mesh.primitive_cone_add(vertices=8,radius1=.65,radius2=.08,depth=3,location=(x,y,33));bpy.context.object.data.materials.append(bronze)
   cube('Tower cross upright',(x,y,35.0),(.13,.13,1.8),bronze)
   cube('Tower cross bar',(x,y,35.3),(.85,.13,.13),bronze)
 # Low roof over nave, no invented high Gothic spire.
 prism('Green nave roof',[(-8.4,-18,20),(8.4,-18,20),(0,-18,24),(-8.4,18,20),(8.4,18,20),(0,18,24)],[(0,1,2),(3,5,4),(0,2,5,3),(2,1,4,5)],bronze)
 # Rounded eastern apse and rhythmic flank windows.
 cyl('Eastern apse',0,18,9.5,7.8,19,stone,32)
 for y in range(-12,15,5):
  for x in [-8.65,8.65]:
   cube('Flank buttress',(x,y,9),(.6,.8,18),edge,.04)
   cube('Flank window',(x,y+1.5,13),(.06,1.4,4),dark)
 # Shallow triangular façade gable.
 prism('West gable',[(-7,-18.8,19),(7,-18.8,19),(0,-18.8,23.8)],[(0,1,2)],edge)
def ring(name,cx,cy,r1,r2,z,height,material,start=0,end=math.pi):
 n=64;verts=[]
 for zz in [z,z+height]:
  for r in [r1,r2]:
   verts.extend([(cx+r*math.cos(start+(end-start)*k/n),cy+r*math.sin(start+(end-start)*k/n),zz) for k in range(n+1)])
 count=n+1;faces=[]
 for k in range(n):
  faces += [(k,k+1,count+k+1,count+k),(2*count+k,3*count+k,3*count+k+1,2*count+k+1),(k,2*count+k,2*count+k+1,k+1),(count+k,count+k+1,3*count+k+1,3*count+k)]
 faces.extend([(0,count,3*count,2*count),(n,2*count+n,3*count+n,count+n)])
 return prism(name,verts,faces,material)
def theatres():
 # Present open archaeological remains, not an intact Roman stage building.
 for k in range(19):
  r=7+k*.72
  if k<12:ring('Grand theatre lower seating',-4,-2,r,r+.70,k*.31,.3,stone)
  else:
   for sector in range(7):
    if (sector+k)%5==0:continue
    ring('Fragmented upper seating',-4,-2,r,r+.68,k*.31,.3,weathered,start=sector*math.pi/7+.018,end=(sector+1)*math.pi/7-.018)
 ring('Grand theatre semicircular orchestra',-4,-2,.01,7,.04,.12,edge)
 cube('Low surviving stage foundation',(-4,-5,.4),(33,4,.8),stone,.08)
 # Radial stair aisles distinguish the cavea wedges.
 for a in [math.pi*.2,math.pi*.4,math.pi*.6,math.pi*.8]:
  for k in range(19):
   r=7+k*.72;step=cube('Radial aisle',(-4+r*math.cos(a),-2+r*math.sin(a),k*.31+.32),(.8,.8,.12),edge);step.rotation_euler.z=a
 # Smaller adjacent Odeon, part of the extant archaeological ensemble.
 for k in range(10):
  r=3+k*.48;ring('Odeon present terraces',23,2,r,r+.46,k*.25,.23,stone)
 ring('Odeon semicircular orchestra',23,2,.01,3,.03,.1,edge)
 cube('Odeon stage foundations',(23,.2,.3),(14,2,.6),stone,.05)
 for x,y,sx,sy in [(-4,18,36,2),(13,12,2,15),(22,13,16,1),(-23,7,1,16)]:cube('Low archaeological masonry',(x,y,1),(sx,sy,2),stone,.06)
 # Grass is contemporary landscaping, with no invented Roman roof/columns.
 cyl('Contemporary grass display ground',0,0,-.12,33,.15,grass,96)
def render_pack(poi,builder,scale,centerz,radius):
 global OUT
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 OUT=os.path.join(ROOT,'assets/monuments/miniatures',poi);os.makedirs(OUT,exist_ok=True)
 builder()
 cyl('Vestige navy plinth',0,0,-.7,radius,.7,base,96);cyl('Vestige gold decorative rim',0,0,-.32,radius+.05,.08,gold,96);cyl('Vestige navy top',0,0,-.24,radius-.3,.08,base,96)
 scene.world=bpy.data.worlds.new('Studio '+poi);scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.43,.53,.70,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.5
 for loc,energy,size in [((22,-35,55),38000,30),((-30,-5,30),23000,25),((10,35,40),25000,24)]:
  bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=energy;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,centerz))-o.location).to_track_quat('-Z','Y').to_euler()
 bpy.ops.object.camera_add();camera=bpy.context.object;scene.camera=camera;camera.data.type='ORTHO';camera.data.ortho_scale=scale
 for i in range(8):
  a=math.radians(i*45);x,y=42,-62
  camera.location=(x*math.cos(a)+y*math.sin(a),-x*math.sin(a)+y*math.cos(a),55)
  camera.rotation_euler=(Vector((0,0,centerz))-camera.location).to_track_quat('-Z','Y').to_euler()
  if i==0:bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'miniature-source.blend'))
  scene.render.filepath=os.path.join(OUT,'render.png');bpy.ops.render.render(write_still=True)
  image=bpy.data.images.load(scene.render.filepath,check_existing=False);image.pack()
  if i==0:image.filepath_raw=os.path.join(OUT,'preview.png');image.save()
  for density in [3,2,1]:
   image.scale(128*density,128*density);image.filepath_raw=os.path.join(OUT,'view-%d%s.png'%(i,'' if density==1 else '@%dx'%density));image.save()
  bpy.data.images.remove(image);os.remove(scene.render.filepath)
 bpy.ops.object.select_all(action='DESELECT')
 for o in scene.objects:
  if o.type=='MESH':o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'miniature-source.glb'),export_format='GLB',use_selection=True,export_apply=True)
 with open(os.path.join(OUT,'build-info.json'),'w') as f:json.dump({'poiId':poi,'views':8,'densities':[128,256,384],'kind':'original present-state stylized illustration','license':'MIT','renderer':'Blender Cycles CPU 32 samples'},f,indent=2)
if '--theatre-only' not in sys.argv:render_pack('fourviere',fourviere,65,12,26)
render_pack('theatre-lyon',theatres,78,2,36)
