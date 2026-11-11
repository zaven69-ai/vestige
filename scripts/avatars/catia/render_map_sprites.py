"""Render the existing corrected GLB; never edit its mesh, materials or source files."""
import bpy, math, sys, argparse, hashlib, json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[3]
SOURCE=ROOT/'assets/avatars/catia/rig-lab/revision-2/catia-corrected.glb'
parser=argparse.ArgumentParser();parser.add_argument('--limit',type=int,default=0)
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
out=ROOT/'assets/avatars/catia/map-sprites';out.mkdir(parents=True,exist_ok=True)
before=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(SOURCE))
scene=bpy.context.scene;scene.render.fps=30
rig=next(o for o in scene.objects if o.type=='ARMATURE')
clips={t.name:t.strips[0].action for t in rig.animation_data.nla_tracks if len(t.strips)==1}
assert all(n in clips for n in ['idle','walk','run'])
for t in rig.animation_data.nla_tracks:t.mute=True
for bone in rig.pose.bones:
 if bone.custom_shape:bone.custom_shape.hide_render=True
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=False
scene.render.threads_mode='FIXED';scene.render.threads=2
scene.render.resolution_x=192;scene.render.resolution_y=272;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.film_transparent=True
world=bpy.data.worlds.new('Map studio');scene.world=world;world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.75,.8,1,1);world.node_tree.nodes['Background'].inputs[1].default_value=.6
for pos,power in [((-3,-4,5),500),((3,2,5),350)]:
 d=bpy.data.lights.new('Studio','AREA');d.energy=power;d.size=4;o=bpy.data.objects.new('Studio',d);scene.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector((0,0,.9))-o.location).to_track_quat('-Z','Y').to_euler()
d=bpy.data.cameras.new('MapCamera');camera=bpy.data.objects.new('MapCamera',d);scene.collection.objects.link(camera);scene.camera=camera;d.type='ORTHO';d.ortho_scale=2.2
report={'source':'assets/avatars/catia/rig-lab/revision-2/catia-corrected.glb','sourceSha256':before,'renderer':'Blender Cycles 32 samples','pixelSize':[192,272],'displaySize':[96,136],'frames':[],'clips':{}}
count=0
# s=front; n=back. Camera azimuth rotates around the unchanged model.
for facing,angle in [('s',180),('sw',225),('w',270),('nw',315),('n',0),('ne',45),('e',90),('se',135)]:
 a=math.radians(angle);camera.location=(-4*math.sin(a),4*math.cos(a),1.6)
 camera.rotation_euler=(Vector((0,0,.88))-camera.location).to_track_quat('-Z','Y').to_euler()
 for name,frames in [('idle',6),('walk',12),('run',8)]:
  action=clips[name];rig.animation_data.action=action;start,end=action.frame_range
  report['clips'][name]={'sourceFrames':[float(start),float(end)],'sampleCount':frames}
  for i in range(frames):
   frame=float(start)+(float(end)-float(start))*i/frames
   scene.frame_set(math.floor(frame),subframe=frame-math.floor(frame))
   file=out/f'{facing}-{name}-{i}.png';scene.render.filepath=str(file);bpy.ops.render.render(write_still=True)
   report['frames'].append({'file':file.name,'phase':name,'facing':facing,'sampleFrame':frame,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
   count+=1
   print('CATIA_SPRITE',count,file.name,flush=True)
   if args.limit and count>=args.limit:break
  if args.limit and count>=args.limit:break
 if args.limit and count>=args.limit:break
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==before
report['complete']=count==208
(out/'render-report.json').write_text(json.dumps(report,indent=2)+'\n')
print('CATIA_MAP_RENDER_COMPLETE',count,flush=True)
