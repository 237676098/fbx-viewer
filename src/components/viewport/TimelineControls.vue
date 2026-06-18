<script setup lang="ts">
import { computed } from 'vue';

export type TimelineClipOption = {
  id: string;
  label: string;
};

const props = defineProps<{
  clips: TimelineClipOption[];
  currentClipId: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: number;
  loop: boolean;
  trackCount: number;
  keyframeCount: number;
  nodeCount: number;
}>();

const emit = defineEmits<{
  play: [];
  pause: [];
  stop: [];
  step: [direction: -1 | 1];
  scrub: [time: number];
  'clip-change': [clip: string];
  'speed-change': [speed: number];
  'loop-change': [enabled: boolean];
}>();

const playbackText = computed(() => (props.isPlaying ? '暂停' : '播放'));

function splitClipLabel(label: string): { primary: string; secondary: string } {
  const separatorIndex = label.lastIndexOf('|');
  if (separatorIndex < 0) return { primary: label || '未命名动画', secondary: '' };

  const secondary = label.slice(0, separatorIndex).trim();
  const primary = label.slice(separatorIndex + 1).trim();
  return {
    primary: primary || label,
    secondary,
  };
}

function togglePlayback(): void {
  if (props.isPlaying) {
    emit('pause');
  } else {
    emit('play');
  }
}

function emitScrub(event: Event): void {
  const value = Number((event.target as HTMLInputElement | HTMLSelectElement).value);
  emit('scrub', value);
}

function emitSpeed(event: Event): void {
  const value = Number((event.target as HTMLInputElement | HTMLSelectElement).value);
  emit('speed-change', value);
}
</script>

<template>
  <footer class="timeline">
    <select
      class="timeline-clip"
      aria-label="动画片段"
      :value="currentClipId"
      @change="emit('clip-change', ($event.target as HTMLSelectElement).value)"
    >
      <option
        v-for="clip in clips"
        :key="clip.id"
        :value="clip.id"
        :data-rig="splitClipLabel(clip.label).secondary"
        :title="clip.label"
      >
        {{ splitClipLabel(clip.label).primary }}
      </option>
    </select>

    <button type="button" aria-label="上一帧" @click="emit('step', -1)">上一帧</button>
    <button type="button" :aria-label="playbackText" @click="togglePlayback">
      {{ playbackText }}
    </button>
    <button type="button" aria-label="停止" @click="emit('stop')">停止</button>
    <button type="button" aria-label="下一帧" @click="emit('step', 1)">下一帧</button>

    <input
      class="timeline-scrub"
      type="range"
      aria-label="动画时间"
      min="0"
      :max="duration"
      step="0.001"
      :value="currentTime"
      @input="emitScrub"
    />

    <span class="timeline-time">{{ currentTime.toFixed(3) }}s / {{ duration.toFixed(3) }}s</span>

    <select
      class="timeline-speed"
      aria-label="播放速度"
      :value="speed"
      @change="emitSpeed"
    >
      <option :value="0.25">0.25x</option>
      <option :value="0.5">0.5x</option>
      <option :value="1">1x</option>
      <option :value="1.5">1.5x</option>
      <option :value="2">2x</option>
    </select>

    <label class="timeline-loop">
      <input
        type="checkbox"
        aria-label="循环播放"
        :checked="loop"
        @change="emit('loop-change', ($event.target as HTMLInputElement).checked)"
      />
      循环
    </label>

    <span class="timeline-stat">{{ trackCount }} 轨道</span>
    <span class="timeline-stat">{{ keyframeCount }} 关键帧</span>
    <span class="timeline-stat">{{ nodeCount }} 节点</span>
  </footer>
</template>

<style scoped>
.timeline {
  display: flex;
  align-items: center;
  gap: 8px;
}

.timeline-scrub {
  flex: 1;
  min-width: 160px;
}

.timeline-time,
.timeline-stat {
  white-space: nowrap;
}

.timeline-loop {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
