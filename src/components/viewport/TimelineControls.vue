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

const playbackLabel = computed(() => (props.isPlaying ? 'Pause' : 'Play'));

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
      aria-label="Animation clip"
      :value="currentClipId"
      @change="emit('clip-change', ($event.target as HTMLSelectElement).value)"
    >
      <option v-for="clip in clips" :key="clip.id" :value="clip.id">
        {{ clip.label }}
      </option>
    </select>

    <button type="button" aria-label="Previous frame" @click="emit('step', -1)">Prev</button>
    <button type="button" :aria-label="playbackLabel" @click="togglePlayback">
      {{ playbackLabel }}
    </button>
    <button type="button" aria-label="Stop" @click="emit('stop')">Stop</button>
    <button type="button" aria-label="Next frame" @click="emit('step', 1)">Next</button>

    <input
      class="timeline-scrub"
      type="range"
      aria-label="Animation time"
      min="0"
      :max="duration"
      step="0.001"
      :value="currentTime"
      @input="emitScrub"
    />

    <span class="timeline-time">{{ currentTime.toFixed(3) }}s / {{ duration.toFixed(3) }}s</span>

    <select
      class="timeline-speed"
      aria-label="Playback speed"
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
        aria-label="Loop animation"
        :checked="loop"
        @change="emit('loop-change', ($event.target as HTMLInputElement).checked)"
      />
      Loop
    </label>

    <span class="timeline-stat">{{ trackCount }} tracks</span>
    <span class="timeline-stat">{{ keyframeCount }} keys</span>
    <span class="timeline-stat">{{ nodeCount }} nodes</span>
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
