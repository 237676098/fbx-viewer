<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type * as THREE from 'three';
import { useThreeScene } from '../../composables/useThreeScene';
import type { ViewportDebugFlags } from '../../composables/useViewportDiagnostics';
import ViewportToolbar from './ViewportToolbar.vue';

const props = defineProps<{
  root: THREE.Object3D | null;
  flags: ViewportDebugFlags;
}>();

const container = ref<HTMLElement | null>(null);
const scene = useThreeScene(container, props.flags);

function updateFlag(key: keyof ViewportDebugFlags, value: boolean | number): void {
  if (key === 'exposure') {
    props.flags.exposure = Number(value);
    return;
  }

  props.flags[key] = Boolean(value);
}

function downloadScreenshot(): void {
  const dataUrl = scene.screenshot();
  if (!dataUrl) return;

  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = 'fbx-viewport.png';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

function handleResize(): void {
  scene.resize();
}

onMounted(() => {
  scene.mount();
  scene.setRoot(props.root);
  scene.resize();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});

watch(
  () => props.root,
  (root) => {
    scene.setRoot(root);
  },
);
</script>

<template>
  <section class="fbx-viewport" aria-label="FBX viewport">
    <ViewportToolbar
      :flags="flags"
      @update:flag="updateFlag"
      @screenshot="downloadScreenshot"
    />
    <div ref="container" class="viewport-canvas" aria-label="3D scene viewport" />
  </section>
</template>

<style scoped>
.fbx-viewport {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 8px;
}

.viewport-canvas {
  min-height: 320px;
  flex: 1;
  overflow: hidden;
}

.viewport-canvas :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
