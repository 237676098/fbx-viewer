import { computed, shallowRef } from 'vue';
import * as THREE from 'three';

const DEFAULT_STEP_SECONDS = 1 / 30;

export function useAnimationMixer() {
  const mixer = shallowRef<THREE.AnimationMixer | null>(null);
  const currentClip = shallowRef<THREE.AnimationClip | null>(null);
  const currentAction = shallowRef<THREE.AnimationAction | null>(null);
  const isPlaying = shallowRef(false);
  const currentTime = shallowRef(0);
  const speed = shallowRef(1);
  const loop = shallowRef(true);
  let activeRoot: THREE.Object3D | null = null;

  const duration = computed(() => currentClip.value?.duration ?? 0);

  function syncMixerTime(time: number): void {
    const activeMixer = mixer.value;
    if (!activeMixer) return;

    activeMixer.setTime(time);
    activeMixer.update(0);
    currentTime.value = activeMixer.time;
  }

  function setRoot(root: THREE.Object3D | null): void {
    const previousMixer = mixer.value;
    const previousRoot = activeRoot;

    stop();
    if (previousMixer && previousRoot) {
      previousMixer.uncacheRoot(previousRoot);
    }

    activeRoot = root;
    mixer.value = root ? new THREE.AnimationMixer(root) : null;
  }

  function setClip(clip: THREE.AnimationClip | null): void {
    if (currentClip.value && mixer.value) {
      mixer.value.uncacheClip(currentClip.value);
    }

    currentAction.value?.stop();
    currentClip.value = clip;
    currentTime.value = 0;

    if (!clip || !mixer.value) {
      currentAction.value = null;
      isPlaying.value = false;
      return;
    }

    const action = mixer.value.clipAction(clip);
    action.loop = loop.value ? THREE.LoopRepeat : THREE.LoopOnce;
    action.clampWhenFinished = !loop.value;
    action.enabled = true;
    action.paused = true;
    action.timeScale = 1;
    action.reset().play();
    currentAction.value = action;
    syncMixerTime(0);
  }

  function play(): void {
    if (!currentAction.value) return;
    if (duration.value > 0 && currentTime.value >= duration.value) {
      scrub(0);
      currentAction.value.reset().play();
    }

    currentAction.value.paused = false;
    isPlaying.value = true;
  }

  function pause(): void {
    if (!currentAction.value) return;
    currentAction.value.paused = true;
    isPlaying.value = false;
  }

  function stop(): void {
    currentAction.value?.reset();
    if (currentAction.value) currentAction.value.paused = true;
    mixer.value?.stopAllAction();
    mixer.value?.setTime(0);
    currentAction.value?.play();
    mixer.value?.update(0);
    currentTime.value = 0;
    isPlaying.value = false;
  }

  function dispose(): void {
    const previousMixer = mixer.value;
    const previousRoot = activeRoot;

    stop();
    if (currentClip.value && previousMixer) {
      previousMixer.uncacheClip(currentClip.value);
    }
    if (previousMixer && previousRoot) {
      previousMixer.uncacheRoot(previousRoot);
    }

    currentClip.value = null;
    mixer.value = null;
    activeRoot = null;
  }

  function scrub(time: number): void {
    const nextTime = THREE.MathUtils.clamp(time, 0, duration.value);
    if (currentAction.value) {
      const wasPaused = currentAction.value.paused;
      currentAction.value.paused = false;
      currentAction.value.time = nextTime;
      syncMixerTime(nextTime);
      currentAction.value.paused = wasPaused;
    } else {
      syncMixerTime(nextTime);
    }
  }

  function step(direction: -1 | 1, seconds = DEFAULT_STEP_SECONDS): void {
    scrub(currentTime.value + direction * seconds);
  }

  function update(deltaSeconds: number): void {
    if (!isPlaying.value || !mixer.value) return;

    mixer.value.update(deltaSeconds * speed.value);

    const clipDuration = duration.value;
    if (clipDuration > 0) {
      currentTime.value = loop.value
        ? mixer.value.time % clipDuration
        : Math.min(mixer.value.time, clipDuration);

      if (!loop.value && mixer.value.time >= clipDuration) {
        pause();
      }
    } else {
      currentTime.value = mixer.value.time;
    }
  }

  function setSpeed(nextSpeed: number): void {
    speed.value = Number.isFinite(nextSpeed) ? Math.max(nextSpeed, 0) : 1;
  }

  function setLoop(enabled: boolean): void {
    loop.value = enabled;
    if (currentAction.value) {
      currentAction.value.loop = enabled ? THREE.LoopRepeat : THREE.LoopOnce;
      currentAction.value.clampWhenFinished = !enabled;
    }
  }

  return {
    mixer,
    currentClip,
    currentAction,
    isPlaying,
    currentTime,
    duration,
    speed,
    loop,
    setRoot,
    setClip,
    play,
    pause,
    stop,
    scrub,
    step,
    update,
    setSpeed,
    setLoop,
    dispose,
  };
}
