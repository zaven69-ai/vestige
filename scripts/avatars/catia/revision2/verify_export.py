"""Re-import the DELIVERED GLB and independently measure its skin/animations."""
import importlib.util,json,hashlib
from pathlib import Path
import bpy
ROOT=Path(__file__).resolve().parents[4];OUT=ROOT/'assets/avatars/catia/rig-lab/revision-2';QA=ROOT/'docs/avatars/catia/revision-2'
spec=importlib.util.spec_from_file_location('correction',Path(__file__).with_name('correct.py'));module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.context.scene.render.fps=30
path=OUT/'catia-corrected.glb';bpy.ops.import_scene.gltf(filepath=str(path));scene=bpy.context.scene
rig=next(o for o in scene.objects if o.type=='ARMATURE');mesh=max((o for o in scene.objects if o.type=='MESH'),key=lambda o:len(o.data.vertices))
for bone in rig.pose.bones:
 if bone.custom_shape:bone.custom_shape.hide_render=True
for track in rig.animation_data.nla_tracks:track.mute=True
rig.animation_data.action=None
module.fit_legs_and_labels(mesh,rig,apply_fit=False)
clusters={}
for vertex in mesh.data.vertices:clusters.setdefault(tuple(round(c*100000) for c in vertex.co),[]).append(vertex.index)
clusters=[indices for indices in clusters.values() if len(indices)>1]
actions={track.name:track.strips[0].action for track in rig.animation_data.nla_tracks if len(track.strips)==1 and track.name in ['idle','walk','run']}
if len(actions)!=3:raise ValueError('Three real imported actions required')
clips=module.evaluate(scene,mesh,rig,clusters,actions,QA/'roundtrip',False,measure_feet=True)
report={'file':'catia-corrected.glb','sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'rigBones':len(rig.data.bones),'clips':clips,'mapEnabled':False,'deviceTested':False,'roundTripPassed':all(c['groundPassed'] and c['stretchPassed'] and (c['name']=='idle' or c['stanceContactPassed']) and c['loopMaxPositionErrorMeters']<.00001 for c in clips)}
(OUT/'roundtrip-report.json').write_text(json.dumps(report,indent=2)+'\n')
if not report['roundTripPassed']:raise ValueError('GLB round-trip validation failed')
print('EXPORTED GLB ROUNDTRIP PASSED',[(c['name'],max(s['p99EdgeStretch'] for s in c['samples'])) for c in clips])
