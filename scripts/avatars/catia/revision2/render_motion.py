"""Render real exported GLB animations into local review movies (no generation API)."""
import bpy,math,argparse,sys,tempfile
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[4];SOURCE=ROOT/'assets/avatars/catia/rig-lab/revision-2/catia-corrected.glb'
parser=argparse.ArgumentParser();parser.add_argument('--frames',default=str(Path(tempfile.gettempdir())/'vestige-catia-revision2-frames'));args=parser.parse_args(sys.argv[sys.argv.index('--')+1:]);out=Path(args.frames);out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.context.scene.render.fps=30;bpy.ops.import_scene.gltf(filepath=str(SOURCE));scene=bpy.context.scene;rig=next(o for o in scene.objects if o.type=='ARMATURE')
for bone in rig.pose.bones:
 if bone.custom_shape:bone.custom_shape.hide_render=True
for track in rig.animation_data.nla_tracks:track.mute=True
clips={track.name:track.strips[0].action for track in rig.animation_data.nla_tracks if len(track.strips)==1}
scene.render.engine='CYCLES';scene.cycles.samples=12;scene.cycles.use_denoising=False;scene.render.threads_mode='FIXED';scene.render.threads=2;scene.render.resolution_x=360;scene.render.resolution_y=480;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
world=bpy.data.worlds.new('ReviewWorld');scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.035,.045,.065,1);world.node_tree.nodes['Background'].inputs[1].default_value=.6
for pos,power in [((-3,-4,5),450),((3,1,5),250)]:
 d=bpy.data.lights.new('Studio','AREA');d.energy=power;d.size=4;o=bpy.data.objects.new('Studio',d);scene.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector((0,0,.9))-o.location).to_track_quat('-Z','Y').to_euler()
d=bpy.data.cameras.new('ReviewCamera');camera=bpy.data.objects.new('ReviewCamera',d);scene.collection.objects.link(camera);scene.camera=camera;d.type='ORTHO';d.ortho_scale=2.25;camera.location=(-1.5,-4,1);camera.rotation_euler=(Vector((0,0,.9))-camera.location).to_track_quat('-Z','Y').to_euler()
for name in ['idle','walk','run']:
 action=clips[name];rig.animation_data.action=action;start,end=action.frame_range;count=round(end-start);folder=out/name;folder.mkdir(exist_ok=True)
 for i in range(count):
  f=start+i;scene.frame_set(int(f),subframe=f-int(f));scene.render.filepath=str(folder/f'{i:03d}.png');bpy.ops.render.render(write_still=True)
print('REVIEW FRAMES COMPLETE')
