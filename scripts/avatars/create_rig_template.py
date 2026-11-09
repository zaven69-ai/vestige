"""Create the common Blender skeleton only. No human mesh, texture or animation."""
import bpy
from pathlib import Path
root=Path(__file__).resolve().parents[2];target=root/'assets/avatars/source/vestige-humanoid-v1.blend'
if target.exists():raise RuntimeError('Le squelette existe déjà ; aucun écrasement automatique')
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.unit_settings.system='METRIC';bpy.context.scene.unit_settings.scale_length=1
bpy.ops.object.armature_add(location=(0,0,0));rig=bpy.context.object;rig.name='VestigeHumanoidV1';rig.show_in_front=True
bpy.ops.object.mode_set(mode='EDIT');rig.data.edit_bones.remove(rig.data.edit_bones[0])
segments=[('Hips',None,(0,0,.9),(0,0,1.02)),('Spine','Hips',(0,0,1.02),(0,0,1.22)),('Chest','Spine',(0,0,1.22),(0,0,1.4)),('Neck','Chest',(0,0,1.4),(0,0,1.53)),('Head','Neck',(0,0,1.53),(0,0,1.75))]
for side,sign in [('Left',1),('Right',-1)]:
 segments.extend([(side+'UpperArm','Chest',(.17*sign,0,1.4),(.43*sign,0,1.4)),(side+'LowerArm',side+'UpperArm',(.43*sign,0,1.4),(.68*sign,0,1.4)),(side+'Hand',side+'LowerArm',(.68*sign,0,1.4),(.78*sign,0,1.4)),(side+'UpperLeg','Hips',(.1*sign,0,.9),(.1*sign,0,.5)),(side+'LowerLeg',side+'UpperLeg',(.1*sign,0,.5),(.1*sign,0,.08)),(side+'Foot',side+'LowerLeg',(.1*sign,0,.08),(.1*sign,-.18,.06))])
for name,parent,head,tail in segments:
 bone=rig.data.edit_bones.new(name);bone.head=head;bone.tail=tail;bone.roll=0
 if parent:bone.parent=rig.data.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT');rig['purpose']='Shared skeleton template only; no Alex or Lea model supplied';rig['forward_blender']='-Y';rig['forward_gltf']='+Z';rig['version']=1
bpy.ops.wm.save_as_mainfile(filepath=str(target))
print('Canonical skeleton only:',target)
