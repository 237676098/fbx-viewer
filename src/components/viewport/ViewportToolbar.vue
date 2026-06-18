<script setup lang="ts">
import type { ViewportDebugFlags } from '../../composables/useViewportDiagnostics';

type ToggleFlag = Exclude<keyof ViewportDebugFlags, 'exposure'>;
type ViewportFlagChange =
  | { key: 'exposure'; value: number }
  | { key: ToggleFlag; value: boolean };

const props = defineProps<{
  flags: ViewportDebugFlags;
}>();

const emit = defineEmits<{
  'flag-change': [change: ViewportFlagChange];
  screenshot: [];
}>();

const toggleControls: { key: ToggleFlag; label: string }[] = [
  { key: 'grid', label: '网格' },
  { key: 'axes', label: '坐标轴' },
  { key: 'bounds', label: '包围盒' },
  { key: 'skeleton', label: '骨骼' },
  { key: 'wireframe', label: '线框' },
  { key: 'textures', label: '贴图' },
  { key: 'normals', label: '法线' },
  { key: 'materialOverride', label: '材质覆盖' },
];

function controlLabel(key: ToggleFlag, label: string): string {
  const action = props.flags[key] ? '隐藏' : '显示';
  return `${action}${label}`;
}

function toggleFlag(key: ToggleFlag): void {
  emit('flag-change', { key, value: !props.flags[key] });
}

function updateExposure(event: Event): void {
  const value = Number((event.target as HTMLInputElement).value);
  emit('flag-change', { key: 'exposure', value });
}
</script>

<template>
  <div class="viewport-toolbar" aria-label="视口诊断控制">
    <div class="viewport-toolbar-group" role="group" aria-label="视口辅助显示">
      <button
        v-for="control in toggleControls"
        :key="control.key"
        class="toolbar-button"
        type="button"
        :aria-label="controlLabel(control.key, control.label)"
        :aria-pressed="flags[control.key]"
        @click="toggleFlag(control.key)"
      >
        {{ control.label }}
      </button>
    </div>

    <label class="exposure-control">
      <span>曝光</span>
      <input
        type="range"
        aria-label="曝光"
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
      aria-label="下载截图"
      @click="emit('screenshot')"
    >
      截图
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
