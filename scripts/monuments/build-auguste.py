"""Original procedural illustration of the present restored temple, not a surveyed reconstruction.
Blender 4.3: blender -b --python scripts/monuments/build-auguste.py
No external textures/models. See docs/design/TEMPLE-MINIATURE-V1.md for references.
"""
import bpy, math, os, json, sys
from mathutils import Vector
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
OUT=os.path.join(ROOT,'assets/monuments/miniatures/auguste')
os.makedirs(OUT,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=64
scene.cycles.use_denoising=False
bpy.context.preferences.filepaths.save_version=0
scene.render.resolution_x=768;scene.render.resolution_y=768;scene.render.resolution_percentage=100
scene.render.film_transparent=True
scene.view_settings.view_transform='AgX';scene.view_settings.exposure=-0.7
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
def mat(name,color,rough=.8,metal=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal
 return m
stone=mat('Restored limestone warm grey',(.62,.55,.42))
edge=mat('Cornice light stone',(.80,.72,.56))
dark=mat('Recess and mortar',(.23,.20,.16))
roof=mat('Present roof muted clay',(.27,.16,.105))
gold=mat('Vestige decorative rim not archaeological',(.72,.48,.16),.3,.6)
base=mat('Vestige display base navy',(.018,.036,.063),.5,.1)
def cube(name,loc,size,material,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 o.data.materials.append(material)
 if bevel:
  mod=o.modifiers.new('Soft dressed edges','BEVEL');mod.width=bevel;mod.segments=2
  o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 return o
def cyl(name,x,y,z,radius,depth,material,vertices=32):
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=(x,y,z));o=bpy.context.object;o.name=name;o.data.materials.append(material);return o
def prism(name,verts,faces,material):
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o.data.materials.append(material);return o
# Coordinates: local frontage X=14.25 m, length Y=27 m. Front local -Y; rotate to face east.
parts=[]
def temple():
 cube('Podium main 2.75m', (0,0,1.20),(14.25,27,2.4),stone,.08)
 cube('Podium top moulding',(0,0,2.57),(14.7,27.3,.35),edge,.06)
 # Modern restored broad frontal stairs, deliberately simplified.
 for n in range(9):
  depth=3.6-n*.4; height=(n+1)*2.75/9
  cube('Restored step %02d'%n,(0,-13.5-depth/2,height/2),(12.5,depth,height),stone,.025)
 # Six facade columns and six positions on each flank including corners. No rear colonnade.
 cols=[(x,-11.95) for x in [-5.85,-3.51,-1.17,1.17,3.51,5.85]]
 cols += [(x,y) for x in [-5.85,5.85] for y in [-7.65,-3.35,.95,5.25,9.55]]
 for idx,(x,y) in enumerate(cols):
  cyl('Column %02d square plinth'%idx,x,y,2.97,.76,.38,edge,4)
  cyl('Column %02d base torus'%idx,x,y,3.22,.66,.20,edge)
  # Fluted shafts have actual radial relief, not painted stripes.
  for ring in range(4):
   z=3.35+(ring+.5)*1.95
   verts=[];faces=[]
   for zz,r in [(z-.975,.55-ring*.025),(z+.975,.525-ring*.025)]:
    for k in range(96):
     a=2*math.pi*k/96; rr=r*(1-.065*(.5+.5*math.cos(24*a)))
     verts.append((x+rr*math.cos(a),y+rr*math.sin(a),zz))
   for k in range(96):faces.append((k,(k+1)%96,(k+1)%96+96,k+96))
   faces.extend([tuple(reversed(range(96))),tuple(range(96,192))])
   prism('Column %02d fluted drum %d'%(idx,ring),verts,faces,stone)
  cyl('Column %02d capital basket'%idx,x,y,11.40,.68,.55,edge)
  # Simplified acanthus lobes: ornamental shorthand, not archaeological carving claims.
  for k in range(8):
   a=k*math.pi/4
   leaf=cube('Acanthus stylization',(x+.53*math.cos(a),y+.53*math.sin(a),11.45),(.22,.24,.65),edge,.08);leaf.rotation_euler.z=a
  cube('Column %02d abacus'%idx,(x,y,11.95),(1.55,1.55,.34),edge,.04)
 # Restored cella at rear, with a recessed entrance and no speculative statues.
 cube('Cella restored rear wall',(0,12.15,7.3),(12.1,.75,9.1),stone,.04)
 for x in [-4.45,4.45]:cube('Cella flank',(x,6.05,7.3),(.7,12.3,9.1),stone,.04)
 for x in [-3.45,3.45]:cube('Cella entry jamb',(x,-.12,7.3),(2.0,.75,9.1),stone,.025)
 cube('Cella door lintel',(0,-.12,10.85),(7.3,.8,2.0),stone,.03)
 # Back wall and flank pilasters continue the preserved sine-postico form.
 for x in [-5.85,5.85]:
  for y in [11.9,7.8]:cube('Rear engaged pilaster',(x,y,7.35),(1.1,.9,8.8),edge,.025)
 for z,w,l,h in [(12.38,14.3,26.0,.55),(12.94,14.45,26.15,.5),(13.48,15.1,26.6,.35)]:cube('Entablature and cornice',(0,0,z),(w,l,h),edge,.04)
 # Muted shallow moulded frieze, no invented legible dedication.
 cube('Facade frieze recess',(0,-13.10,12.95),(11.8,.04,.24),stone)
 for x in range(-7,8):
  for y in [-13.27,13.27]:cube('Cornice modillion',(x,y,13.35),(.28,.6,.25),edge,.025)
 for y in range(-12,13,2):
  for x in [-7.4,7.4]:cube('Side modillion',(x,y,13.35),(.55,.32,.25),edge,.025)
 # Low triangular fronton and present roof, not a brightly painted ancient reconstruction.
 verts=[(-7.55,-13.3,13.66),(7.55,-13.3,13.66),(0,-13.3,17.0),(-7.55,-12.85,13.66),(7.55,-12.85,13.66),(0,-12.85,17.0)]
 prism('Triangular east fronton',verts,[(0,1,2),(5,4,3),(0,3,4,1),(1,4,5,2),(2,5,3,0)],stone)
 for side in [-1,1]:
  # Stone raking cornice follows triangular pediment.
  a=Vector((0,-13.35,17.0));b=Vector((side*7.8,-13.35,13.6));mid=(a+b)/2
  beam=cube('Raking pediment cornice',mid,(.38,.70,(a-b).length),edge,.025);beam.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
  prism('Clay roof plane',[(0,-13.1,16.9),(side*7.65,-13.1,13.65),(side*7.65,13.35,13.65),(0,13.35,16.9)],[(0,1,2,3)],roof)
 for y in [i*.7-12.6 for i in range(38)]:
  # Thin lines suggest the present tiled roof without individual costly tiles.
  for side in [-1,1]:
   a=Vector((0,y,16.96));b=Vector((side*7.6,y,13.72));mid=(a+b)/2
   strip=cube('Roof tile seam',mid,(.045,.055,(a-b).length),roof);strip.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
temple()
# Rotate building only, facing +X east; camera's stylized three-quarter bias is documented.
for o in list(bpy.context.scene.objects):
 o.location=Vector((-o.location.y,o.location.x,o.location.z));o.rotation_euler.z+=math.pi/2
# Display base is UI decoration, not an invented archaeological precinct.
cyl('Decorative navy display plinth',0,0,-.32,18.4,.65,base,96)
cyl('Decorative gold rim',0,0,.005,18.45,.10,gold,96)
cyl('Decorative navy top',0,0,.075,18.18,.08,base,96)
world=bpy.data.worlds.new('Soft studio');scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.43,.53,.70,1);world.node_tree.nodes['Background'].inputs[1].default_value=.5
for name,loc,energy,size in [('Warm key',(18,-28,42),30000,24),('Cool fill',(-28,-8,24),17000,20),('Rim',(8,25,30),22000,18)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=energy;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,7))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();camera=bpy.context.object;scene.camera=camera;camera.data.type='ORTHO';camera.data.ortho_scale=49

for i in range(8):
 a=math.radians(i*45);x,y=38,-52
 camera.location=(x*math.cos(a)+y*math.sin(a),-x*math.sin(a)+y*math.cos(a),43)
 camera.rotation_euler=(Vector((0,0,6.0))-camera.location).to_track_quat('-Z','Y').to_euler()
 if i==0:
  bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'temple-miniature-source.blend'))
 scene.render.filepath=os.path.join(OUT,'render-%d.png'%i)
 if not (i==0 and '--reuse-first' in sys.argv and os.path.exists(scene.render.filepath)):bpy.ops.render.render(write_still=True)
 image=bpy.data.images.load(scene.render.filepath,check_existing=False)
 image.pack()
 if i==0: image.filepath_raw=os.path.join(OUT,'preview.png');image.save()
 for scale in [3,2,1]:
  image.scale(128*scale,128*scale)
  image.filepath_raw=os.path.join(OUT,'view-%d%s.png'%(i,'' if scale==1 else '@%dx'%scale));image.save()
 bpy.data.images.remove(image);os.remove(scene.render.filepath)
 # Remove former full-resolution view if this script was run before adding density variants.

print('Temple: 8 transparent 2.5D views rendered')

bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
 if o.type=='MESH':o.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'temple-miniature-source.glb'),export_format='GLB',use_selection=True,export_apply=True)
graph=bpy.context.evaluated_depsgraph_get();triangles=0
for o in scene.objects:
 if o.type=='MESH':
  mesh=o.evaluated_get(graph).to_mesh();mesh.calc_loop_triangles();triangles+=len(mesh.loop_triangles);o.evaluated_get(graph).to_mesh_clear()
with open(os.path.join(OUT,'build-info.json'),'w') as f:json.dump({'renderer':'Blender Cycles CPU','views':8,'densities':[128,256,384],'sourceTriangles':triangles,'geometry':'original procedural approximation of the present restored monument','referenceDimensionsMeters':[27,14.25,17.36],'modelPodiumMeters':[27,14.25],'heightMeters':17.0,'license':'MIT'},f,indent=2)
