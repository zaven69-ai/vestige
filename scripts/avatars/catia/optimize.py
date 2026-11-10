"""Non-destructive Catia optimization and common-studio comparison renders.
blender --background --python scripts/avatars/catia/optimize.py
Original source is verified by SHA256 and never overwritten.
"""
import argparse,hashlib,json,math,sys
from pathlib import Path
import bpy
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[3]
SOURCE=ROOT/'assets/avatars/source/catia/avatar.glb'
EXPECTED='9c3e5b819423af36553d94b7fc01d7e1f4c4f8ad721074b5e23eb2f01055966c'
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def bounds(mesh):
 points=[mesh.matrix_world@Vector(v) for v in mesh.bound_box]
 return [min(v[i] for v in points) for i in range(3)],[max(v[i] for v in points) for i in range(3)]
def import_normalized():
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(SOURCE));mesh=next(o for o in bpy.context.scene.objects if o.type=='MESH')
 bpy.context.view_layer.objects.active=mesh;mesh.select_set(True)
 mesh.rotation_mode="XYZ";mesh.rotation_euler.z-=math.pi/2;bpy.context.view_layer.update();low,high=bounds(mesh);factor=1.75/(high[2]-low[2]);mesh.scale*=factor
 bpy.ops.object.transform_apply(location=False,rotation=True,scale=True);bpy.context.view_layer.update();low,high=bounds(mesh)
 mesh.location-=Vector(((high[0]+low[0])/2,(high[1]+low[1])/2,low[2]));bpy.ops.object.transform_apply(location=True,rotation=True,scale=True);bpy.context.view_layer.update()
 return mesh

def studio(mesh,out,label):
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=False;scene.render.threads_mode='FIXED';scene.render.threads=2
 scene.render.resolution_x=480;scene.render.resolution_y=640;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.film_transparent=True
 world=bpy.data.worlds.new('CommonStudio');scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.65,.72,.85,1);world.node_tree.nodes['Background'].inputs[1].default_value=.45
 for name,position,power in [('Key',(-3,-4,5),450),('Fill',(3,-1,4),200),('Rim',(0,3,5),250)]:
  data=bpy.data.lights.new(name,'AREA');data.energy=power;data.size=4;obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=position;obj.rotation_euler=(Vector((0,0,1))-obj.location).to_track_quat('-Z','Y').to_euler()
 data=bpy.data.cameras.new('Camera');camera=bpy.data.objects.new('Camera',data);scene.collection.objects.link(camera);scene.camera=camera;data.type='ORTHO'
 for view,location,target,scale in [('front',(0,-4,1.0),(0,0,.9),2.15),('side',(-4,0,1.0),(0,0,.9),2.15),('back',(0,4,1.0),(0,0,.9),2.15),('face',(0,-3,1.57),(0,0,1.57),.47)]:
  camera.location=location;camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler();data.ortho_scale=scale
  scene.render.filepath=str(out/f'{label}-{view}.png');bpy.ops.render.render(write_still=True)

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--output',default=str(ROOT/'assets/avatars/catia/mobile'));ap.add_argument('--renders',default=str(ROOT/'docs/avatars/catia/comparison'));args=ap.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
 assert sha(SOURCE)==EXPECTED,'Original Catia changed: stop'
 out=Path(args.output);renders=Path(args.renders);out.mkdir(parents=True,exist_ok=True);renders.mkdir(parents=True,exist_ok=True)
 if (out/'optimization.json').exists():raise RuntimeError('Comparison already exists; choose a new output to preserve all prior work')
 report={'blenderVersion':bpy.app.version_string,'sourceSha256':EXPECTED,'sourceTriangles':151692,'heightMeters':1.75,'forwardBlender':'-Y','forwardGlTF':'+Z','upGlTF':'+Y','candidates':[],'sourcePreserved':True}
 for target in [None,30000,25000,20000]:
  mesh=import_normalized();label='original' if target is None else str(target)
  if target is not None:
   group=mesh.vertex_groups.new(name='DecimationInfluence')
   for v in mesh.data.vertices:
    # Smaller weights raise edge-collapse cost: protect face/hair, hands and boot outlines.
    weight=.2 if v.co.z>1.43 else (.55 if v.co.z<.2 else 1.0)
    group.add([v.index],weight,'REPLACE')
   modifier=mesh.modifiers.new('WeightedMobileLOD','DECIMATE');modifier.ratio=(target-4)/len(mesh.data.polygons);modifier.use_collapse_triangulate=True;modifier.vertex_group=group.name;modifier.vertex_group_factor=.05
   bpy.ops.object.modifier_apply(modifier=modifier.name)
   remaining=mesh.vertex_groups.get('DecimationInfluence')
   if remaining:mesh.vertex_groups.remove(remaining)
   mesh.data.calc_loop_triangles();triangles=len(mesh.data.loop_triangles)
   for o in bpy.context.scene.objects:o.select_set(False)
   mesh.select_set(True);bpy.context.view_layer.objects.active=mesh
   path=out/f'catia-{target}.glb'
   if path.exists():raise RuntimeError('Refusing to overwrite '+str(path))
   bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_animations=False,export_skins=False,export_yup=True)
   report['candidates'].append({'file':path.name,'target':target,'triangles':triangles,'bytes':path.stat().st_size,'sha256':sha(path),'skins':0,'animations':[],'textures':[list(image.size) for image in bpy.data.images]})
  studio(mesh,renders,label)
 assert sha(SOURCE)==EXPECTED,'Source changed unexpectedly'
 (out/'optimization.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print('CATIA OPTIMIZATION COMPLETE')
if __name__=='__main__':main()
