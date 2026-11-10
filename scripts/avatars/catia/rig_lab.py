"""Experimental rig and real keyframed motion trials. Never approves or registers Catia.
Results must be reviewed/retargeted by an artist before production use.
"""
import hashlib,json,math,statistics,sys
from pathlib import Path
import bpy
from mathutils import Vector
from mathutils.kdtree import KDTree
ROOT=Path(__file__).resolve().parents[3];SOURCE=ROOT/'assets/avatars/catia/mobile/catia-25000.glb';OUT=ROOT/'assets/avatars/catia/rig-lab';QA=ROOT/'docs/avatars/catia/rig-lab'
def main():
 if (OUT/'rig-audit.json').exists():raise RuntimeError('Rig trial exists; preserve it before a new attempt')
 OUT.mkdir(parents=True,exist_ok=True);QA.mkdir(parents=True,exist_ok=True)
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(SOURCE));scene=bpy.context.scene
 mesh=next(o for o in scene.objects if o.type=='MESH');mesh.name='CatiaOptimized';bpy.context.view_layer.objects.active=mesh;mesh.select_set(True);bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
 # Initial landmarks fitted to Catia's original arms-down, hands-near-pockets pose.
 # This is a draft, not a certified retarget of the neutral T-pose template.
 bpy.ops.object.armature_add(location=(0,0,0));rig=bpy.context.object;rig.name='CatiaRigDraft';rig.show_in_front=True
 bpy.ops.object.mode_set(mode='EDIT');rig.data.edit_bones.remove(rig.data.edit_bones[0])
 bones=[('Hips',None,(-.01,0,.9),(-.01,0,1.02)),('Spine','Hips',(-.01,0,1.02),(-.01,0,1.2)),('Chest','Spine',(-.01,0,1.2),(-.005,0,1.43)),('Neck','Chest',(-.005,0,1.43),(.005,0,1.53)),('Head','Neck',(.005,0,1.53),(.04,0,1.74)),('LeftUpperArm','Chest',(.16,0,1.43),(.18,-.015,1.2)),('LeftLowerArm','LeftUpperArm',(.18,-.015,1.2),(.145,-.08,1.055)),('LeftHand','LeftLowerArm',(.145,-.08,1.055),(.12,-.08,.995)),('RightUpperArm','Chest',(-.16,0,1.43),(-.18,0,1.17)),('RightLowerArm','RightUpperArm',(-.18,0,1.17),(-.14,-.08,1.04)),('RightHand','RightLowerArm',(-.14,-.08,1.04),(-.12,-.09,.99)),('LeftUpperLeg','Hips',(.075,0,.92),(.04,.015,.5)),('LeftLowerLeg','LeftUpperLeg',(.04,.015,.5),(.08,0,.115)),('LeftFoot','LeftLowerLeg',(.08,0,.115),(.08,-.13,.065)),('RightUpperLeg','Hips',(-.075,0,.92),(-.08,.025,.5)),('RightLowerLeg','RightUpperLeg',(-.08,.025,.5),(-.07,0,.115)),('RightFoot','RightLowerLeg',(-.07,0,.115),(-.07,-.13,.065))]
 for name,parent,head,tail in bones:
  bone=rig.data.edit_bones.new(name);bone.head=head;bone.tail=tail;bone.roll=0
  if parent:bone.parent=rig.data.edit_bones[parent]
 bpy.ops.object.mode_set(mode='OBJECT')
 for o in scene.objects:o.select_set(False)
 mesh.select_set(True);rig.select_set(True);bpy.context.view_layer.objects.active=rig
 weighting_error=None
 try:bpy.ops.object.parent_set(type='ARMATURE_AUTO')
 except Exception as error:weighting_error=str(error)
 group_names={g.index:g.name for g in mesh.vertex_groups};required=set(rig.data.bones.keys())
 sums=[sum(g.weight for g in v.groups if group_names.get(g.group) in required) for v in mesh.data.vertices]
 covered=sum(v>1e-6 for v in sums);coverage=covered/len(sums)
 report={'status':'experimental-not-approved','sourceSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'rigBones':len(rig.data.bones),'vertices':len(sums),'initialWeightedVertices':covered,'initialWeightCoverage':coverage,'weightingError':weighting_error,'productionApproved':False,'deviceTested':False,'clips':[],'requiresManualSkinningReview':True,'landmarks':'Approximate fit to posed original; not a validated T-pose/retarget'}
 missing=[v for v in mesh.data.vertices if sums[v.index]<=1e-6]
 if missing and covered and not weighting_error:
  tree=KDTree(covered)
  for v in mesh.data.vertices:
   if sums[v.index]>1e-6:tree.insert(v.co,v.index)
  tree.balance();repairs=[(v,tree.find(v.co)) for v in missing];max_gap=max(item[1][2] for item in repairs)
  report['unweightedRepairMaxDistanceMeters']=max_gap
  if max_gap<=.04:
   for vertex,(_,nearest,distance) in repairs:
    weights=[(g.group,g.weight) for g in mesh.data.vertices[nearest].groups if group_names.get(g.group) in required and g.weight>0]
    for group,weight in weights:mesh.vertex_groups[group].add([vertex.index],weight,'REPLACE')
   report['proximityRepairedVertices']=len(repairs)
 sums=[sum(g.weight for g in v.groups if group_names.get(g.group) in required) for v in mesh.data.vertices]
 covered=sum(v>1e-6 for v in sums);coverage=covered/len(sums);report['weightedVertices']=covered;report['weightCoverage']=coverage
 if coverage<1 or weighting_error:
  bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'catia-unbound-draft.blend'));report['status']='weighting-incomplete';(OUT/'rig-audit.json').write_text(json.dumps(report,indent=2));print('Automatic weights incomplete; no motion clips or production skin claimed');return
 # glTF splits vertices at UV/normal seams. Equal rest positions must retain identical skin weights.
 clusters={}
 for vertex in mesh.data.vertices:clusters.setdefault(tuple(round(c*100000) for c in vertex.co),[]).append(vertex.index)
 seam_clusters=[indices for indices in clusters.values() if len(indices)>1]
 for indices in clusters.values():
  totals={}
  for index in indices:
   for g in mesh.data.vertices[index].groups:
    if group_names.get(g.group) in required:totals[g.group]=totals.get(g.group,0)+g.weight
  weights=sorted(totals.items(),key=lambda item:item[1],reverse=True)[:4];total=sum(weight for _,weight in weights)
  for group in mesh.vertex_groups:
   if group.name in required:group.remove(indices)
  for group,weight in weights:mesh.vertex_groups[group].add(indices,weight/total,'REPLACE')
 report['synchronizedSeamClusters']=len(seam_clusters);report['maxInfluencesPerVertex']=4
 rig.animation_data_create();scene.render.fps=24
 for phase,duration in [('idle',72),('walk',24),('run',18)]:
  action=bpy.data.actions.new(phase);rig.animation_data.action=action
  for frame in range(duration+1):
   t=2*math.pi*frame/duration
   for bone in rig.pose.bones:bone.rotation_mode='XYZ';bone.rotation_euler=(0,0,0);bone.location=(0,0,0);bone.scale=(1,1,1)
   rig.pose.bones['Chest'].scale.y=1+.008*math.sin(t)
   rig.pose.bones['Head'].rotation_euler.z=.012*math.sin(t)
   if phase!='idle':
    run=phase=='run';stride=.65 if run else .32;knee=.95 if run else .45;arm=.35 if run else .13
    rig.pose.bones['Hips'].location.y=(.035 if run else .012)*(1-math.cos(2*t))
    rig.pose.bones['Chest'].rotation_euler.x=.08 if run else .015
    for side,offset in [('Left',0),('Right',math.pi)]:
     a=t+offset;rig.pose.bones[side+'UpperLeg'].rotation_euler.x=stride*math.sin(a);rig.pose.bones[side+'LowerLeg'].rotation_euler.x=knee*max(0,-math.sin(a));rig.pose.bones[side+'Foot'].rotation_euler.x=-.1*math.sin(a)
     rig.pose.bones[side+'UpperArm'].rotation_euler.x=-arm*math.sin(a);rig.pose.bones[side+'LowerArm'].rotation_euler.x=.35 if run else .05
   for bone in rig.pose.bones:
    bone.keyframe_insert(data_path='rotation_euler',frame=frame+1,group=bone.name);bone.keyframe_insert(data_path='location',frame=frame+1,group=bone.name);bone.keyframe_insert(data_path='scale',frame=frame+1,group=bone.name)
  for curve in action.fcurves:
   for key in curve.keyframe_points:key.interpolation='LINEAR'
  track=rig.animation_data.nla_tracks.new();track.name=phase;track.strips.new(phase,1,action)
  report['clips'].append({'name':phase,'frames':duration+1,'fps':24,'actualKeyframes':sum(len(curve.keyframe_points) for curve in action.fcurves),'status':'experimental-real-motion-not-production'})
 rig.animation_data.action=None;scene.frame_set(1)
 for o in scene.objects:o.select_set(False)
 rig.select_set(True);mesh.select_set(True);bpy.context.view_layer.objects.active=rig
 bpy.ops.export_scene.gltf(filepath=str(OUT/'catia-motion-trials.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_skins=True,export_def_bones=False,export_all_influences=False)
 for track in rig.animation_data.nla_tracks:track.mute=True
 # Keep a neutral editable project; motions are trials, not automatic approval.
 rig.animation_data.action=None
 for bone in rig.pose.bones:bone.rotation_euler=(0,0,0);bone.location=(0,0,0);bone.scale=(1,1,1)
 rig['production_approved']=False;rig['note']='Experimental heat weights; inspect mesh, blazer, hair, heels and pockets before any real use.'
 rig.animation_data.action=bpy.data.actions['idle'];scene.frame_start=1;scene.frame_end=73;scene.frame_set(1)
 bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'catia-rig-workbench.blend'))
 # Sample deformation and ground penetration; report failures instead of hiding them.
 scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=False;scene.render.threads_mode='FIXED';scene.render.threads=2;scene.render.resolution_x=480;scene.render.resolution_y=640;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True
 world=bpy.data.worlds.new('RigQA');scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[1].default_value=.7
 for pos,power in [((-3,-4,5),450),((3,1,5),250)]:
  d=bpy.data.lights.new('Studio','AREA');d.energy=power;d.size=4;o=bpy.data.objects.new('Studio',d);scene.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
 d=bpy.data.cameras.new('Camera');camera=bpy.data.objects.new('Camera',d);scene.collection.objects.link(camera);scene.camera=camera;d.type='ORTHO';d.ortho_scale=2.3;camera.location=(0,-4,1);camera.rotation_euler=(Vector((0,0,.9))-camera.location).to_track_quat('-Z','Y').to_euler()
 baseline=[(mesh.data.vertices[e.vertices[0]].co-mesh.data.vertices[e.vertices[1]].co).length for e in mesh.data.edges]
 for clip in report['clips']:
  action=bpy.data.actions[clip['name']];rig.animation_data.action=action;stats=[]
  for fraction in [0,.125,.25,.375,.5,.625,.75,.875]:
   frame=1+fraction*(clip['frames']-1);scene.frame_set(int(frame),subframe=frame-int(frame));bpy.context.view_layer.update();evaluated=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get());temp=evaluated.to_mesh()
   positions=[evaluated.matrix_world@v.co for v in temp.vertices];ratios=sorted((temp.vertices[e.vertices[0]].co-temp.vertices[e.vertices[1]].co).length/max(baseline[i],1e-9) for i,e in enumerate(temp.edges));stats.append({'fraction':fraction,'minZ':min(v.z for v in positions),'maxEdgeStretch':max(ratios),'p99EdgeStretch':ratios[int(.99*(len(ratios)-1))],'maxSeamGapMeters':max(((positions[index]-positions[indices[0]]).length for indices in seam_clusters for index in indices[1:]),default=0)});evaluated.to_mesh_clear()
  clip['deformationSamples']=stats;clip['groundCheckPassed']=all(r['minZ']>=-.02 for r in stats);clip['stretchCheckPassed']=all(r['p99EdgeStretch']<2 for r in stats)
  for fraction in [.25,.75]:
   scene.frame_set(1+round(fraction*(clip['frames']-1)));scene.render.filepath=str(QA/f"{clip['name']}-{int(fraction*100)}.png");bpy.ops.render.render(write_still=True)
 report['requiresManualFootContactCorrection']=any(not c['groundCheckPassed'] for c in report['clips']);(OUT/'rig-audit.json').write_text(json.dumps(report,indent=2)+'\n');print('CATIA RIG LAB COMPLETE, NOT APPROVED')
if __name__=='__main__':main()
