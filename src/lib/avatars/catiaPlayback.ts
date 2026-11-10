import {
  AnimationMixer,
  LoopRepeat,
  type AnimationAction,
  type AnimationClip,
  type Object3D,
} from "three";
import { catiaViewerClips, type CatiaViewerClip } from "./catiaViewer.ts";
/** Same controller used by the native viewer and its animation/pause tests. */
export function catiaPlayback(root: Object3D, clips: AnimationClip[]) {
  if (
    !catiaViewerClips.every((item) =>
      clips.some((clip) => clip.name === item.id),
    )
  )
    throw Error("Animations de Catia incomplètes.");
  const mixer = new AnimationMixer(root);
  let current: AnimationAction | null = null;
  return {
    select(clip: CatiaViewerClip, playing: boolean) {
      const action = mixer.clipAction(
        clips.find((item) => item.name === clip)!,
      );
      if (current !== action) {
        if (!playing) {
          mixer.stopAllAction();
          action.reset().setLoop(LoopRepeat, Infinity).play();
          mixer.update(0);
        } else {
          current?.fadeOut(0.18);
          action.reset().setLoop(LoopRepeat, Infinity).fadeIn(0.18).play();
        }
      } else if (playing) action.play();
      current = action;
    },
    update(delta: number, playing: boolean) {
      if (playing && Number.isFinite(delta) && delta > 0)
        mixer.update(Math.min(delta, 0.1));
    },
    dispose() {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      current = null;
    },
  };
}
