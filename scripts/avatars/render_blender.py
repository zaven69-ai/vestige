"""Blender 4.3+: render a supplied, rigged GLB; never generate substitute humans.
blender --background --python scripts/avatars/render_blender.py -- --character alex
Input: assets/avatars/source/alex/avatar.glb. Output remains UNAPPROVED.
"""
import argparse,hashlib,json,math,sys
from pathlib import Path
import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
ROOT=Path(__file__).resolve().parents[2]
CONTRACT=json.loads((ROOT/'assets/avatars/contract.json').read_text())
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--character',choices=['alex','lea'],required=True);ap.add_argument('--samples',type=int,default=48);ap.add_argument('--denoise',action='store_true');ap.add_argument('--source');ap.add_argument('--output');args=ap.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
 source=Path(args.source).resolve() if args.source else ROOT/'assets/avatars/source'/args.character/'avatar.glb';out=Path(args.output).resolve() if args.output else ROOT/'assets/avatars/characters'/args.character
 if not source.exists():raise ValueError('GLB source absent : '+str(source))
 if out.exists() and any(out.iterdir()):raise ValueError('Sortie non vide : conserver ou archiver le pack existant avant un nouveau rendu. Aucun fichier écrasé.')
 bpy.ops.wm.read_factory_settings(use_empty=True)
 bpy.ops.import_scene.gltf(filepath=str(source))
 scene=bpy.context.scene;rigs=[o for o in scene.objects if o.type=='ARMATURE']
 helpers={bone.custom_shape for r in rigs for bone in r.pose.bones if bone.custom_shape}
 for helper in helpers:helper.hide_render=True
 meshes=[o for o in scene.objects if o.type=='MESH' and o not in helpers]
 if len(rigs)!=1 or not meshes:raise ValueError('Un squelette et des maillages sont requis')
 rig=rigs[0]
 if any(b not in rig.data.bones for b in CONTRACT['requiredBones']):raise ValueError('Squelette canonique incomplet')
 for image in bpy.data.images:
  if max(image.size)>CONTRACT['maxTextureSize']:raise ValueError('Texture supérieure à 2048 px : '+image.name)
 # The canonical source has in-place clips named exactly idle/walk, feet at z=0.
 actions={a.name:a for a in bpy.data.actions}
 # Blender suffixes action names with the rig name on glTF import; the NLA track retains the clip name.
 if rig.animation_data:
  actions.update({track.name:track.strips[0].action for track in rig.animation_data.nla_tracks if len(track.strips)==1})
 if any(p not in actions for p in CONTRACT['phases']):raise ValueError('Actions idle et walk requises')
 rig.animation_data_create()
 for track in rig.animation_data.nla_tracks:track.mute=True
 rig.animation_data.action=actions['idle'];scene.frame_set(int(actions['idle'].frame_range[0]));bpy.context.view_layer.update()
 points=[o.matrix_world@Vector(corner) for o in meshes for corner in o.bound_box]
 low=min(p.z for p in points);high=max(p.z for p in points)
 if not CONTRACT['heightRange'][0]<=high-low<=CONTRACT['heightRange'][1] or abs(low)>.08:raise ValueError(f'Échelle/sol incorrects : hauteur={high-low:.3f} m, sol={low:.3f} m ; source en mètres et pieds au sol requis')
 # Disable source cameras/lights and render only the common studio setup.
 for o in list(scene.objects):
  if o.type in ['CAMERA','LIGHT']:bpy.data.objects.remove(o,do_unlink=True)
 world=bpy.data.worlds.new('VestigeStudio');scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.72,.79,.9,1);world.node_tree.nodes['Background'].inputs[1].default_value=.35
 scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=max(8,min(args.samples,128));scene.cycles.use_denoising=args.denoise
 scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.resolution_percentage=100
 scene.view_settings.view_transform='AgX';scene.render.threads_mode='FIXED';scene.render.threads=2
 def light(name,location,power,size):
  data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);o.location=location;o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
 light('Key',(-3,-4,6),450,4);light('Fill',(3,-1,4),180,3);light('Rim',(1,4,5),300,3)
 bpy.ops.mesh.primitive_plane_add(size=6,location=(0,0,-.006));ground=bpy.context.object;ground.name='ShadowCatcher';ground.is_shadow_catcher=True
 camera_data=bpy.data.cameras.new('VestigeCamera');camera=bpy.data.objects.new('VestigeCamera',camera_data);scene.collection.objects.link(camera);scene.camera=camera;camera_data.type='ORTHO';camera_data.ortho_scale=2.2
 scene.render.resolution_x=CONTRACT['pixelWidth'];scene.render.resolution_y=CONTRACT['pixelHeight']
 def place(angle,target_z=.88,portrait=False):
  distance=6;pitch=math.radians(20);target=Vector((0,0,target_z));camera.location=target+Vector((-math.sin(angle)*distance*math.cos(pitch),-math.cos(angle)*distance*math.cos(pitch),distance*math.sin(pitch)));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();camera_data.shift_y=0
  bpy.context.view_layer.update()
  if not portrait:
   wanted=1-CONTRACT['feetPixelY']/CONTRACT['pixelHeight'];first=world_to_camera_view(scene,camera,Vector((0,0,0))).y;camera_data.shift_y=.1;bpy.context.view_layer.update();second=world_to_camera_view(scene,camera,Vector((0,0,0))).y;camera_data.shift_y=.1*(wanted-first)/(second-first);bpy.context.view_layer.update()
 out.mkdir(parents=True,exist_ok=True)
 # In-place hips translation check on sampled poses; root motion must be retargeted offline.
 for phase,spec in CONTRACT['phases'].items():
  action=actions[phase];rig.animation_data.action=action;start,end=action.frame_range
  positions=[]
  for frame in range(spec['frames']):
   value=start+(end-start)*frame/spec['frames'];scene.frame_set(int(value),subframe=value-int(value));bpy.context.view_layer.update();positions.append(rig.matrix_world@rig.pose.bones['Hips'].head)
  if any((Vector((p.x,p.y,0))-Vector((positions[0].x,positions[0].y,0))).length>.05 for p in positions):raise ValueError('Clip avec déplacement racine : produire une animation sur place')
  for facing in CONTRACT['facings']:
   index=['s','se','e','ne','n','nw','w','sw'].index(facing) if facing!='unknown' else 0;place(math.radians(index*45))
   for frame in range(spec['frames']):
    value=start+(end-start)*frame/spec['frames'];scene.frame_set(int(value),subframe=value-int(value));bpy.context.view_layer.update()
    points=[o.matrix_world@Vector(corner) for o in meshes for corner in o.bound_box]
    projected=[world_to_camera_view(scene,camera,p) for p in points]
    if any(p.x<.025 or p.x>.975 or p.y<.025 or p.y>.975 for p in projected):raise ValueError('Pose hors cadre : ajuster le modèle/cadrage commun, ne pas rogner')
    scene.render.filepath=str(out/f'{facing}-{phase}-{frame}.png');bpy.ops.render.render(write_still=True)
 rig.animation_data.action=actions['idle'];scene.frame_set(int(actions['idle'].frame_range[0]));ground.hide_render=True
 scene.render.resolution_x=scene.render.resolution_y=CONTRACT['portraitSize'];camera_data.ortho_scale=.68;place(0,high-.28,portrait=True)
 scene.render.filepath=str(out/'portrait.png');bpy.ops.render.render(write_still=True)
 metadata={'version':1,'character':args.character,'sourceKind':'rigged-glb-render','sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'rig':CONTRACT['rig'],'renderer':'Blender '+bpy.app.version_string,'artApprovedBy':'','artApprovedAt':'','license':'','notes':'Rendus non validés. Vérifier visage, pieds, anatomie, déformations, orientation, ombre et licence avant enregistrement.'}
 (out/'pack.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
 print('Rendus créés, non approuvés :',out)
if __name__=='__main__':main()
