"""Revise the EXISTING Catia Blender scene: weights, analytic IK and baked motions.
No mesh/UV/material/image edits; no character generation or remote service.
"""
import argparse,hashlib,json,math,sys
from pathlib import Path
from collections import defaultdict
import bpy
import numpy as np
from mathutils import Vector,Matrix,Quaternion
from mathutils.kdtree import KDTree
ROOT=Path(__file__).resolve().parents[4]
SOURCE=ROOT/'assets/avatars/catia/rig-lab/catia-rig-workbench.blend'
FOOT_FLOOR={}
FOOT_INDICES={}
def smooth(a,b,x):
 t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
def digest_geometry(mesh):
 h=hashlib.sha256()
 for v in mesh.data.vertices:h.update(np.array(v.co,dtype='<f4').tobytes())
 for p in mesh.data.polygons:h.update(np.array(p.vertices,dtype='<u4').tobytes())
 for layer in mesh.data.uv_layers:
  for v in layer.data:h.update(np.array(v.uv,dtype='<f4').tobytes())
 return h.hexdigest()
def reset(rig):
 rig.animation_data.action=None
 for b in rig.pose.bones:b.rotation_mode='QUATERNION';b.rotation_quaternion=(1,0,0,0);b.location=(0,0,0);b.scale=(1,1,1)
 bpy.context.view_layer.update()
def set_bone(rig,name,head,tail,rotation=None):
 rest=rig.data.bones[name];direction=tail-head
 if rotation is None:rotation=(rest.tail_local-rest.head_local).rotation_difference(direction)@rest.matrix_local.to_quaternion()
 rig.pose.bones[name].matrix=Matrix.Translation(head)@rotation.to_matrix().to_4x4()
 bpy.context.view_layer.update()
def solve_chain(rig,upper,lower,end,target,pole):
 top=rig.pose.bones[upper].head.copy();a=rig.data.bones[upper].length;b=rig.data.bones[lower].length
 vector=target-top;length=vector.length;d=vector.normalized();clamped=min(a+b-.0001,max(abs(a-b)+.0001,length))
 effective=top+d*clamped;along=(a*a-b*b+clamped*clamped)/(2*clamped);height=math.sqrt(max(0,a*a-along*along))
 p=pole-d*pole.dot(d)
 if p.length<.00001:p=Vector((1,0,0))
 knee=top+d*along+p.normalized()*height
 set_bone(rig,upper,top,knee);set_bone(rig,lower,knee,effective)
 rotation=rig.data.bones[end].matrix_local.to_quaternion()
 tail=effective+(rig.data.bones[end].tail_local-rig.data.bones[end].head_local)
 set_bone(rig,end,effective,tail,rotation)
 return (effective-target).length

def fit_legs_and_labels(mesh,rig,apply_fit=True):
 # Segment the two existing disconnected lower-leg surfaces; do not split a boot by a world X threshold.
 vertices=mesh.data.vertices;parent=list(range(len(vertices)))
 def find(i):
  while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
  return i
 def union(a,b):
  a=find(a);b=find(b)
  if a!=b:parent[a]=b
 duplicates={}
 for v in vertices:
  if v.co.z>=.78:continue
  key=tuple(round(c*100000) for c in v.co)
  if key in duplicates:union(v.index,duplicates[key])
  else:duplicates[key]=v.index
 for edge in mesh.data.edges:
  a,b=edge.vertices
  if vertices[a].co.z<.78 and vertices[b].co.z<.78:union(a,b)
 parts=defaultdict(list)
 for v in vertices:
  if v.co.z<.78:parts[find(v.index)].append(v.index)
 major=sorted(parts.values(),key=len,reverse=True)[:2]
 if len(major)!=2 or any(len(indices)<1000 for indices in major):raise ValueError('Two independent lower-leg surfaces required')
 major.sort(key=lambda indices:sum(vertices[i].co.x for i in indices)/len(indices))
 labels={i:side for indices,side in zip(major,['Right','Left']) for i in indices}
 tree=KDTree(sum(map(len,major)))
 for index in labels:tree.insert(vertices[index].co,index)
 tree.balance()
 for v in vertices:
  if v.index not in labels:labels[v.index]=labels[tree.find(v.co)[1]]
 for side in ['Left','Right']:
  FOOT_INDICES[side]=[v.index for v in vertices if labels[v.index]==side and v.co.z<.12]
  FOOT_FLOOR[side]=min(vertices[i].co.z for i in FOOT_INDICES[side])
 if not apply_fit:return labels
 centers={}
 for side in ['Left','Right']:
  centers[side]={}
  for z in [.17,.50,.74]:
   points=[v.co for v in vertices if labels[v.index]==side and abs(v.co.z-z)<.025]
   center=sum(points,Vector())/len(points);center.z=z;centers[side][z]=center
 bpy.context.view_layer.objects.active=rig;bpy.ops.object.mode_set(mode='EDIT')
 for side in ['Left','Right']:
  knee=centers[side][.50];ankle=centers[side][.17];hip=centers[side][.74].copy();hip.z=.91
  hip.x=.065 if side=='Left' else -.075;hip.y=.04 if side=='Left' else -.03
  rig.data.edit_bones[side+'UpperLeg'].head=hip;rig.data.edit_bones[side+'UpperLeg'].tail=knee
  rig.data.edit_bones[side+'LowerLeg'].head=knee;rig.data.edit_bones[side+'LowerLeg'].tail=ankle
  rig.data.edit_bones[side+'Foot'].head=ankle;rig.data.edit_bones[side+'Foot'].tail=ankle+Vector((.065 if side=='Left' else -.025,-.12,-.05))
 bpy.ops.object.mode_set(mode='OBJECT');bpy.context.view_layer.update()
 return labels

def reweight(mesh,rig,leg_labels):
 clusters=defaultdict(list)
 for v in mesh.data.vertices:clusters[tuple(round(c*100000) for c in v.co)].append(v.index)
 planned=[]
 for indices in clusters.values():
  position=sum((mesh.data.vertices[i].co for i in indices),Vector())/len(indices);x,y,z=position
  weights=defaultdict(float)
  if z>=1.49:
   weights['Head']=1
  elif z>=1.39:
   h=smooth(1.43,1.49,z);n=smooth(1.39,1.44,z)*(1-h);weights['Head']=h;weights['Neck']=n;weights['Chest']=1-h-n
  else:
   if z<1.04:
    pelvis=smooth(.76,.96,z)
    bag=smooth(-.035,.02,y)*smooth(.135,.19,-x)*smooth(.74,.84,z)
    pelvis=max(pelvis,bag)
    weights['Hips']=pelvis
    # Distinct legs below the crotch; a narrow continuous medial transition avoids discontinuities.
    component_left=1.0 if leg_labels[indices[0]]=='Left' else 0.0
    middle=-.025+.02*smooth(.78,.92,z);blend=smooth(.78,.90,z)
    left=component_left*(1-blend)+smooth(middle-.04,middle+.04,x)*blend
    foot=1-smooth(.19,.29,z);upper=smooth(.43,.62,z)*(1-foot);lower=1-foot-upper
    for side,amount in [('Left',left),('Right',1-left)]:
     for part,value in [('UpperLeg',upper),('LowerLeg',lower),('Foot',foot)]:weights[side+part]+=(1-pelvis)*amount*value
   else:
    if z<1.20:
     spine=smooth(1.04,1.20,z);weights['Hips']=1-spine;weights['Spine']=spine
    else:
     chest=smooth(1.20,1.39,z);weights['Spine']=1-chest;weights['Chest']=chest
   # Blazer sleeves follow a consistent arm chain. Hands stay close to pockets through IK.
   arm=smooth(.13,.19,abs(x+.005))*smooth(1.035,1.12,z)*(1-smooth(1.32,1.39,z))
   if arm>0:
    side='Left' if x>-.005 else 'Right';hand=1-smooth(1.045,1.105,z);upper=smooth(1.155,1.32,z);lower=max(0,1-hand-upper)
    for name in list(weights):weights[name]*=1-arm
    weights[side+'UpperArm']+=arm*upper;weights[side+'LowerArm']+=arm*lower;weights[side+'Hand']+=arm*hand
  nonzero=sorted(((name,value) for name,value in weights.items() if value>1e-7),key=lambda item:item[1],reverse=True)
  if len(nonzero)>4:raise ValueError('More than four authored influences; fix blending instead of truncating weights')
  total=sum(v for _,v in nonzero)
  if total<=0:raise ValueError('Unweighted position')
  planned.append((indices,[(name,v/total) for name,v in nonzero]))
 for g in list(mesh.vertex_groups):mesh.vertex_groups.remove(g)
 groups={name:mesh.vertex_groups.new(name=name) for name in rig.data.bones.keys()}
 for indices,weights in planned:
  for name,value in weights:groups[name].add(indices,value,'REPLACE')
 return [indices for indices in clusters.values() if len(indices)>1]

def pose(rig,phase,t):
 reset(rig);run=phase=='run';moving=phase!='idle'
 rest_hips=rig.data.bones['Hips'];root=Vector((0,0,0));yaw=0
 if moving:
  root.x=.006*math.sin(t);root.z=(-.065 if run else -.030)+(.010 if run else .004)*(1-math.cos(2*t));yaw=(.045 if run else .025)*math.sin(t)
 hips_rot=Quaternion((0,0,1),yaw)@rest_hips.matrix_local.to_quaternion();set_bone(rig,'Hips',rest_hips.head_local+root,rest_hips.tail_local+root,hips_rot)
 for name,angle in [('Spine',(.025 if run else .008) if moving else .003*math.sin(t)),('Chest',(.065 if run else .015) if moving else .004*math.sin(t))]:
  rig.pose.bones[name].rotation_quaternion=Quaternion((1,0,0),angle)
 rig.pose.bones['Head'].rotation_quaternion=Quaternion((0,1,0),.008*math.sin(t))
 bpy.context.view_layer.update();errors=[]
 if moving:
  stride=.44 if run else .24;stance=.45 if run else .62;lift=.095 if run else .055
  for side,offset in [('Left',0),('Right',.5)]:
   cycle=(t/(2*math.pi)+offset)%1
   if cycle<stance:
    u=cycle/stance;fore=-stride/2+stride*u;up=0
   else:
    u=(cycle-stance)/(1-stance);m=stride*(1-stance)/stance
    fore=(2*u**3-3*u**2+1)*stride/2+(u**3-2*u**2+u)*m+(-2*u**3+3*u**2)*(-stride/2)+(u**3-u**2)*m;up=lift*math.sin(math.pi*u)**2
   base=rig.data.bones[side+'Foot'].head_local.copy();base.x=.055 if side=='Left' else -.095;base.y=-.01;base.z-=FOOT_FLOOR[side];target=base+Vector((0,fore,up))
   errors.append(solve_chain(rig,side+'UpperLeg',side+'LowerLeg',side+'Foot',target,Vector((0,-1,0))))
  # Keep the hands/pockets relationship rather than forcing a detached running arm swing.
  for side,offset in [('Left',0),('Right',math.pi)]:
   rest=rig.data.bones[side+'Hand'].head_local.copy();target=rest_hips.head_local+root+Quaternion((0,0,1),yaw)@(rest-rest_hips.head_local)
   target.y+=(.008 if run else .003)*math.sin(t+offset);target.z+=.004 if run else .0015
   a=rig.data.bones[side+'UpperArm'].head_local;b=rig.data.bones[side+'LowerArm'].head_local;c=rig.data.bones[side+'Hand'].head_local
   errors.append(solve_chain(rig,side+'UpperArm',side+'LowerArm',side+'Hand',target,b-(a+c)/2))
 return max(errors,default=0)

def setup_studio(scene):
 for obj in list(scene.objects):
  if obj.type in ['LIGHT','CAMERA']:bpy.data.objects.remove(obj,do_unlink=True)
 scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=False;scene.render.threads_mode='FIXED';scene.render.threads=2;scene.render.resolution_x=480;scene.render.resolution_y=640;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True
 world=bpy.data.worlds.new('CatiaRevisionStudio');scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[1].default_value=.65
 for pos,power in [((-3,-4,5),450),((3,1,5),250)]:
  d=bpy.data.lights.new('Studio','AREA');d.energy=power;d.size=4;o=bpy.data.objects.new('Studio',d);scene.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
 d=bpy.data.cameras.new('Camera');camera=bpy.data.objects.new('Camera',d);scene.collection.objects.link(camera);scene.camera=camera;d.type='ORTHO';d.ortho_scale=2.3
 return camera

def evaluate(scene,mesh,rig,clusters,actions,renders,do_render,measure_feet=False):
 baseline=np.array([(mesh.data.vertices[e.vertices[0]].co-mesh.data.vertices[e.vertices[1]].co).length for e in mesh.data.edges]);result=[];camera=setup_studio(scene);renders.mkdir(parents=True,exist_ok=True)
 for name,action in actions.items():
  rig.animation_data.action=action;samples=[];start,end=action.frame_range
  sample_count=max(32,int(2*(end-start)))
  for i in range(sample_count):
   f=start+(end-start)*i/sample_count;scene.frame_set(int(f),subframe=f-int(f));bpy.context.view_layer.update();evaluated=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get());tmp=evaluated.to_mesh();positions=[evaluated.matrix_world@v.co for v in tmp.vertices]
   ratios=np.array([(tmp.vertices[e.vertices[0]].co-tmp.vertices[e.vertices[1]].co).length/max(baseline[j],1e-9) for j,e in enumerate(tmp.edges)])
   samples.append({'phase':i/sample_count,'minZ':min(v.z for v in positions),'p99EdgeStretch':float(np.percentile(ratios,99)),'maxEdgeStretch':float(ratios.max()),'maxSeamGapMeters':max(((positions[index]-positions[indices[0]]).length for indices in clusters for index in indices[1:]),default=0)})
   if measure_feet and name!='idle':
    soles={}
    for side,offset in [('Left',0),('Right',.5)]:
     cycle=(i/sample_count+offset)%1;stance=.45 if name=='run' else .62
     if cycle<stance:soles[side]=min(positions[index].z for index in FOOT_INDICES[side])
    samples[-1]['stanceSoleZ']=soles
   evaluated.to_mesh_clear()
  # Loop closure uses actual deformed vertices at both ends, not just action names.
  loop=[]
  for frame in [start,end]:
   scene.frame_set(int(frame));bpy.context.view_layer.update();obj=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get());tmp=obj.to_mesh();loop.append(np.array([tuple(obj.matrix_world@v.co) for v in tmp.vertices]));obj.to_mesh_clear()
  loop_error=float(np.linalg.norm(loop[1]-loop[0],axis=1).max())
  result.append({'name':name,'durationSeconds':(end-start)/scene.render.fps,'samples':samples,'groundPassed':all(s['minZ']>=-.002 for s in samples),'stretchPassed':all(s['p99EdgeStretch']<2 for s in samples),'loopMaxPositionErrorMeters':loop_error,'stanceContactPassed':(all(abs(z)<.002 for sample in samples for z in sample.get('stanceSoleZ',{}).values()) if measure_feet and name!='idle' else None)})
  if do_render:
   for view,location in [('front',(0,-4,1)),('side',(-4,0,1))]:
    camera.location=location;camera.rotation_euler=(Vector((0,0,.9))-camera.location).to_track_quat('-Z','Y').to_euler()
    for phase in [.125,.375,.625,.875]:
     f=start+(end-start)*phase;scene.frame_set(int(f),subframe=f-int(f));scene.render.filepath=str(renders/f'{name}-{view}-{int(phase*100)}.png');bpy.ops.render.render(write_still=True)
 return result

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--output',default=str(ROOT/'assets/avatars/catia/rig-lab/revision-2'));ap.add_argument('--renders',default=str(ROOT/'docs/avatars/catia/revision-2'));ap.add_argument('--no-render',action='store_true');args=ap.parse_args(sys.argv[sys.argv.index('--')+1:])
 out=Path(args.output);renders=Path(args.renders);out.mkdir(parents=True,exist_ok=True);renders.mkdir(parents=True,exist_ok=True)
 if (out/'correction-report.json').exists():raise ValueError('Choose a new output; previous work is preserved')
 source_sha=hashlib.sha256(SOURCE.read_bytes()).hexdigest();bpy.ops.wm.open_mainfile(filepath=str(SOURCE));scene=bpy.context.scene;mesh=next(o for o in scene.objects if o.type=='MESH');rig=next(o for o in scene.objects if o.type=='ARMATURE')
 for track in rig.animation_data.nla_tracks:track.mute=True
 # Compare the unchanged legacy actions with exactly the same stretch metric and 32 phases.
 source_clusters=defaultdict(list)
 for vertex in mesh.data.vertices:source_clusters[tuple(round(c*100000) for c in vertex.co)].append(vertex.index)
 source_clusters=[indices for indices in source_clusters.values() if len(indices)>1]
 legacy={name:bpy.data.actions[name] for name in ['idle','walk','run']}
 baseline=evaluate(scene,mesh,rig,source_clusters,legacy,renders/'before',not args.no_render)
 reset(rig);before=digest_geometry(mesh)
 obj=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get());tmp=obj.to_mesh();rest_before=np.array([v.co[:] for v in tmp.vertices]);obj.to_mesh_clear()
 leg_labels=fit_legs_and_labels(mesh,rig);clusters=reweight(mesh,rig,leg_labels);reset(rig)
 obj=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get());tmp=obj.to_mesh();rest_after=np.array([v.co[:] for v in tmp.vertices]);obj.to_mesh_clear();neutral_error=float(np.linalg.norm(rest_after-rest_before,axis=1).max())
 if neutral_error>.00001:raise ValueError('Neutral appearance changed')
 scene.render.fps=30
 for modifier in mesh.modifiers:
  if modifier.type=='ARMATURE':modifier.use_deform_preserve_volume=False
 # Keep the old actions in source control, not overlapping the new animation stack.
 for track in list(rig.animation_data.nla_tracks):rig.animation_data.nla_tracks.remove(track)
 for action in list(bpy.data.actions):bpy.data.actions.remove(action)
 actions={};max_ik_error=0
 for name,duration in [('idle',90),('walk',36),('run',24)]:
  action=bpy.data.actions.new(name);actions[name]=action
  for i in range(duration+1):
   # Bake actual poses; no empty clip names or scale-based breathing.
   max_ik_error=max(max_ik_error,pose(rig,name,2*math.pi*i/duration))
   rig.animation_data.action=action
   for bone in rig.pose.bones:
    bone.keyframe_insert(data_path='rotation_quaternion',frame=i+1,group=bone.name);bone.keyframe_insert(data_path='location',frame=i+1,group=bone.name);bone.keyframe_insert(data_path='scale',frame=i+1,group=bone.name)
   # pose() clears the active action to avoid evaluating obsolete curves while baking.
  for curve in action.fcurves:
   for key in curve.keyframe_points:key.interpolation='LINEAR'
  track=rig.animation_data.nla_tracks.new();track.name=name;track.strips.new(name,1,action);track.mute=True
 report={'sourceBlendSha256':source_sha,'geometryBeforeSha256':before,'geometryAfterSha256':digest_geometry(mesh),'sourcePreserved':hashlib.sha256(SOURCE.read_bytes()).hexdigest()==source_sha,'maxIKReachErrorMeters':max_ik_error,'neutralMaxPositionErrorMeters':neutral_error,'baseline':baseline,'thresholds':{'p99Stretch':2,'groundPenetrationMeters':.002,'stanceSoleErrorMeters':.002,'loopClosureMeters':.00001},'mapEnabled':False,'productionApproved':False,'deviceTested':False}
 if before!=report['geometryAfterSha256']:raise ValueError('Geometry or UV changed')
 report['clips']=evaluate(scene,mesh,rig,clusters,actions,renders/'after',not args.no_render,measure_feet=True)
 for track in rig.animation_data.nla_tracks:track.mute=False
 rig.animation_data.action=None
 for o in scene.objects:o.select_set(False)
 mesh.select_set(True);rig.select_set(True);bpy.context.view_layer.objects.active=rig
 bpy.ops.export_scene.gltf(filepath=str(out/'catia-corrected.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_skins=True,export_def_bones=False,export_all_influences=False,export_rest_position_armature=True,export_reset_pose_bones=True)
 for track in rig.animation_data.nla_tracks:track.mute=True
 rig.animation_data.action=actions['idle'];scene.frame_start=1;scene.frame_end=91;scene.frame_set(1);bpy.context.preferences.filepaths.save_version=0
 bpy.ops.wm.save_as_mainfile(filepath=str(out/'catia-corrected.blend'));(out/'correction-report.json').write_text(json.dumps(report,indent=2)+'\n');print('CORRECTION COMPLETE',[(c['name'],max(s['p99EdgeStretch'] for s in c['samples']),min(s['minZ'] for s in c['samples'])) for c in report['clips']])
if __name__=='__main__':main()
