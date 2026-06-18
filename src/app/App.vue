<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import type * as THREE from 'three';
import FileDropZone from '../components/upload/FileDropZone.vue';
import AssetPanel from '../components/inspector/AssetPanel.vue';
import InspectorPanel from '../components/inspector/InspectorPanel.vue';
import SceneTree from '../components/scene/SceneTree.vue';
import FbxViewport from '../components/viewport/FbxViewport.vue';
import TimelineControls, { type TimelineClipOption } from '../components/viewport/TimelineControls.vue';
import { useAnimationMixer } from '../composables/useAnimationMixer';
import { useFbxLoader } from '../composables/useFbxLoader';
import { useAssetPanelData, useInspectorData } from '../composables/useInspectorData';
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
  update,
  setSpeed,
  setLoop,
  dispose,
} = useAnimationMixer();

const inspectorTabs = useInspectorData(loaded, selected);
const assetPanelData = useAssetPanelData(loaded);

const root = computed(() => loaded.value?.root ?? null);
const sceneNodes = computed(() => (root.value ? extractSceneNodes(root.value) : []));
const clips = computed(() => loaded.value?.animations ?? []);
const clipOptions = computed<TimelineClipOption[]>(() =>
  clips.value.map((clip, index) => ({
    id: `clip-${index}`,
    label: clip.name || `Clip ${index + 1}`,
  })),
);
const currentClipId = computed(() => {
  const index = currentClip.value ? clips.value.indexOf(currentClip.value) : 0;
  return index >= 0 ? `clip-${index}` : (clipOptions.value[0]?.id ?? '');
});
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
  if (!fbx) return '未加载文件';

  return `${fbx.file.name} (${formatBytes(fbx.file.size)})`;
});
const leftPaneWidth = ref(280);
const rightPaneWidth = ref(360);
const gridStyle = computed(() => ({
  gridTemplateColumns: `${leftPaneWidth.value}px 6px minmax(520px, 1fr) 6px ${rightPaneWidth.value}px`,
}));

async function handleFile(file: File, files: File[] = [file]): Promise<void> {
  select(null);
  loaded.value?.objectUrls?.forEach((url) => URL.revokeObjectURL(url));
  dispose();

  const nextLoaded = await loadFile(file, files);
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

function selectClip(clipId: string): void {
  const match = /^clip-(\d+)$/.exec(clipId);
  const index = match ? Number(match[1]) : -1;
  const nextClip = Number.isInteger(index) ? clips.value[index] ?? null : null;
  setClip(nextClip);
}

function startResize(side: 'left' | 'right', event: MouseEvent): void {
  const startX = event.clientX;
  const startLeft = leftPaneWidth.value;
  const startRight = rightPaneWidth.value;

  function handleMove(moveEvent: MouseEvent): void {
    const delta = moveEvent.clientX - startX;
    if (side === 'left') {
      leftPaneWidth.value = Math.min(Math.max(startLeft + delta, 220), 520);
    } else {
      rightPaneWidth.value = Math.min(Math.max(startRight - delta, 300), 640);
    }
  }

  function handleUp(): void {
    window.removeEventListener('mousemove', handleMove);
    window.removeEventListener('mouseup', handleUp);
  }

  window.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', handleUp);
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
  loaded.value?.objectUrls?.forEach((url) => URL.revokeObjectURL(url));
  dispose();
});
</script>

<template>
  <main class="app-shell">
    <header class="top-bar">
      <div class="top-bar-title">
        <h1><strong>FBX Inspector Workbench</strong></h1>
        <span class="muted">本地模型渲染、动画播放与字段级诊断。</span>
      </div>

      <FileDropZone @file="handleFile" />

      <div class="status-strip" aria-live="polite">
        <span v-if="loading" class="status-pill loading">加载中</span>
        <span v-if="error" class="status-pill error">{{ error }}</span>
        <span class="status-pill">{{ fileStatus }}</span>
      </div>
    </header>

    <section class="workspace-layout">
      <section class="workbench-grid" aria-label="FBX inspector workbench" :style="gridStyle">
        <aside class="workbench-pane scene-pane" aria-label="Scene">
          <div class="pane-header">
            <span>场景节点</span>
            <small>{{ sceneNodes.length }} ROOT</small>
          </div>
          <SceneTree :nodes="sceneNodes" :selected-id="selectedId" @select="selectObject" />
        </aside>

        <button
          class="resize-handle"
          data-resize-handle="left"
          type="button"
          aria-label="调整场景树宽度"
          @mousedown="startResize('left', $event)"
        />

        <section class="viewport-pane" aria-label="Viewport and animation">
          <div class="viewport-frame">
            <FbxViewport
              v-if="root"
              :root="root"
              :flags="flags"
              :on-frame="update"
              @flag-change="handleFlagChange"
            />
            <div v-if="!root" class="viewport-empty">
              <strong>尚未加载 FBX</strong>
              <span>选择或拖入本地 .fbx 文件后，可查看场景层级、动画和资源数据。</span>
            </div>
          </div>

          <TimelineControls
            v-if="hasAnimations"
            :clips="clipOptions"
            :current-clip-id="currentClipId"
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
          <footer v-else class="timeline-empty">当前文件没有动画片段。</footer>
        </section>

        <button
          class="resize-handle"
          data-resize-handle="right"
          type="button"
          aria-label="调整属性面板宽度"
          @mousedown="startResize('right', $event)"
        />

        <aside class="workbench-pane inspector-pane" aria-label="Inspector">
          <div class="pane-header">
            <span>基础属性</span>
            <small>{{ inspectorTabs.length }} 组</small>
          </div>
          <InspectorPanel :tabs="inspectorTabs" />
        </aside>
      </section>

      <section class="asset-dock">
        <div class="pane-header">
          <span>资产面板</span>
          <small>{{ assetPanelData?.textures.length ?? 0 }} 纹理</small>
        </div>
        <AssetPanel :assets="assetPanelData" />
      </section>
    </section>
  </main>
</template>
