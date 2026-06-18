import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { useAnimationMixer } from '../../src/composables/useAnimationMixer';

describe('useAnimationMixer', () => {
  it('scrubs by frame step while paused and applies the action time', () => {
    const root = new THREE.Object3D();
    root.name = 'Hips';
    const clip = new THREE.AnimationClip('Step', 1, [
      new THREE.VectorKeyframeTrack('Hips.position', [0, 1], [0, 0, 0, 10, 0, 0]),
    ]);
    const mixer = useAnimationMixer();

    mixer.setRoot(root);
    mixer.setClip(clip);
    mixer.pause();

    mixer.step(1);

    expect(mixer.currentTime.value).toBeCloseTo(1 / 30);
    expect(mixer.currentAction.value?.time).toBeCloseTo(1 / 30);
    expect(root.position.x).toBeGreaterThan(0);
  });
});
