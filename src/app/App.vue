<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue';
import type * as THREE from 'three';
import FileDropZone from '../components/upload/FileDropZone.vue';
import InspectorPanel from '../components/inspector/InspectorPanel.vue';
import SceneTree from '../components/scene/SceneTree.vue';
import FbxViewport from '../components/viewport/FbxViewport.vue';
import TimelineControls from '../components/viewport/TimelineControls.vue';
import { useAnimationMixer } from '../composables/useAnimationMixer';
import { useFbxLoader } from '../composables/useFbxLoader';
import { useInspectorData } from '../composables/useInspectorData';
import { useSelection } from '../composables/useSelection';
import { useViewportDiagnostics, type ViewportDebugFlags } from '../composables/useViewportDiagnostics';
import { extractSceneNodes } from '../domain/extractors/sceneExtractor';
import { formatBytes } from '../utils/format';

type BooleanViewportFlag = Exclude<keyof ViewportDebugFlags, 'exposure'>;
type ViewportFlagChange =
  | { key: 'exposure'; value: number }
  | { key: BooleanViewportFlag; value: boolean };

const { loaded, loading, error, loadFile } = useFbxLoader();
const { selected, selectedId, select } = useSelection();
const { flags } = useViewportDiagnostics();
const {
  currentClip,
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
  setSpeed,
  setLoop,
  dispose,
} = useAnimationMixer();

const inspectorTabs = useInspectorData(loaded, selected);

const root = computed(() => loaded.value?.root ?? null);
const sceneNodes = computed(() => (root.value ? extractSceneNodes(root.value) : []));
const clips = computed(() => loaded.value?.animations ?? []);
const clipNames = computed(() => clips.value.map((clip, index) => clip.name || `Clip ${index + 1}`));
const currentClipName = computed(() => currentClip.value?.name ?? clipNames.value[0] ?? '');
const selectedClip = computed(() => currentClip.value ?? clips.value[0] ?? null);
const hasAnimations = computed(() => clips.value.length > 0);
const trackCount = computed(() => selectedClip.value?.tracks.length ?? 0);
const keyframeCount = computed(
  () => selectedClip.value?.tracks.reduce((total, track) => total + track.times.length, 0) ?? 0,
);
const animatedNodeCount = computed(
  () => new Set(selectedClip.value?.tracks.map((track) => track.name.split('.')[0]) ?? []).size,
);
const fileStatus = computed(() => {
  const fbx = loaded.value;
  if (!fbx) return 'No file loaded';

  return `${fbx.file.name} (${formatBytes(fbx.file.size)})`;
});

async function handleFile(file: File): Promise<void> {
  select(null);
  dispose();

  const nextLoaded = await loadFile(file);
  if (!nextLoaded) return;

  setRoot(nextLoaded.root);
  setClip(nextLoaded.animations[0] ?? null);
}

function handleFlagChange(change: ViewportFlagChange): void {
  if (change.key === 'exposure') {
    flags.exposure = change.value;
    return;
  }

  flags[change.key] = change.value;
}

function selectObject(object: THREE.Object3D): void {
  select(object);
}

function selectClip(name: string): void {
  const nextClip = clips.value.find((clip, index) => (clip.name || `Clip ${index + 1}`) === name) ?? null;
  setClip(nextClip);
}

watch(
  root,
  (nextRoot) => {
    if (selected.value && nextRoot !== selected.value) {
      select(null);
    }
  },
);

onBeforeUnmount(() => {
  dispose();
});
</script>

<template>
  <main class="app-shell">
    <header class="top-bar">
      <div class="top-bar-title">
        <h1><strong>FBX Inspector Workbench</strong></h1>
        <span class="muted">Local model rendering, animation playback, and field-level diagnostics.</span>
      </div>

      <FileDropZone @file="handleFile" />

      <div class="status-strip" aria-live="polite">
        <span v-if="loading" class="status-pill loading">Loading</span>
        <span v-if="error" class="status-pill error">{{ error }}</span>
        <span class="status-pill">{{ fileStatus }}</span>
      </div>
    </header>

    <section class="workbench-grid" aria-label="FBX inspector workbench">
      <aside class="workbench-pane scene-pane" aria-label="Scene">
        <div class="pane-header">
          <span>Scene</span>
          <small>{{ sceneNodes.length }} root</small>
        </div>
        <SceneTree :nodes="sceneNodes" :selected-id="selectedId" @select="selectObject" />
      </aside>

      <section class="viewport-pane" aria-label="Viewport and animation">
        <div class="viewport-frame">
          <FbxViewport
            v-if="root"
            :root="root"
            :flags="flags"
            @flag-change="handleFlagChange"
          />
          <div v-if="!root" class="viewport-empty">
            <strong>No FBX loaded</strong>
            <span>Choose or drop a local .fbx file to inspect its scene graph and metadata.</span>
          </div>
        </div>

        <TimelineControls
          v-if="hasAnimations"
          :clips="clipNames"
          :current-clip="currentClipName"
          :is-playing="isPlaying"
          :current-time="currentTime"
          :duration="duration"
          :speed="speed"
          :loop="loop"
          :track-count="trackCount"
          :keyframe-count="keyframeCount"
          :node-count="animatedNodeCount"
          @play="play"
          @pause="pause"
          @stop="stop"
          @step="step"
          @scrub="scrub"
          @clip-change="selectClip"
          @speed-change="setSpeed"
          @loop-change="setLoop"
        />
        <footer v-else class="timeline-empty">No animation clips in the current file.</footer>
      </section>

      <aside class="workbench-pane inspector-pane" aria-label="Inspector">
        <div class="pane-header">
          <span>Inspector</span>
          <small>{{ inspectorTabs.length }} tabs</small>
        </div>
        <InspectorPanel :tabs="inspectorTabs" />
      </aside>
    </section>
  </main>
</template>
