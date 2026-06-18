<script setup lang="ts">
import type { ViewportDebugFlags } from '../../composables/useViewportDiagnostics';

type ToggleFlag = Exclude<keyof ViewportDebugFlags, 'exposure'>;

const props = defineProps<{
  flags: ViewportDebugFlags;
}>();

const emit = defineEmits<{
  'update:flag': [key: keyof ViewportDebugFlags, value: boolean | number];
  screenshot: [];
}>();

const toggleControls: { key: ToggleFlag; label: string }[] = [
  { key: 'grid', label: 'grid' },
  { key: 'axes', label: 'axes' },
  { key: 'bounds', label: 'bounds' },
  { key: 'skeleton', label: 'skeleton' },
  { key: 'wireframe', label: 'wireframe' },
  { key: 'textures', label: 'textures' },
  { key: 'normals', label: 'normals' },
  { key: 'materialOverride', label: 'material override' },
];

function displayLabel(label: string): string {
  return label.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function controlLabel(key: ToggleFlag, label: string): string {
  const action = props.flags[key] ? 'Hide' : 'Show';
  return `${action} ${label}`;
}

function toggleFlag(key: ToggleFlag): void {
  emit('update:flag', key, !props.flags[key]);
}

function updateExposure(event: Event): void {
  const value = Number((event.target as HTMLInputElement).value);
  emit('update:flag', 'exposure', value);
}
</script>

<template>
  <div class="viewport-toolbar" aria-label="Viewport diagnostics controls">
    <div class="viewport-toolbar-group" role="group" aria-label="Viewport overlays">
      <button
        v-for="control in toggleControls"
        :key="control.key"
        class="toolbar-button"
        type="button"
        :aria-label="controlLabel(control.key, control.label)"
        :aria-pressed="flags[control.key]"
        @click="toggleFlag(control.key)"
      >
        {{ displayLabel(control.label) }}
      </button>
    </div>

    <label class="exposure-control">
      <span>Exposure</span>
      <input
        type="range"
        aria-label="Exposure"
        min="0"
        max="2"
        step="0.05"
        :value="flags.exposure"
        @input="updateExposure"
      />
      <output>{{ flags.exposure.toFixed(2) }}</output>
    </label>

    <button
      class="toolbar-button"
      type="button"
      aria-label="Download screenshot"
      @click="emit('screenshot')"
    >
      Screenshot
    </button>
  </div>
</template>

<style scoped>
.viewport-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.viewport-toolbar-group,
.exposure-control {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.toolbar-button {
  min-height: 32px;
}

.toolbar-button[aria-pressed='true'] {
  font-weight: 700;
}

.exposure-control input {
  width: 120px;
}

.exposure-control output {
  min-width: 4ch;
  font-variant-numeric: tabular-nums;
}
</style>
