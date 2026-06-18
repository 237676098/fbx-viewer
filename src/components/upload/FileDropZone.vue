<script setup lang="ts">
const emit = defineEmits<{
  file: [file: File];
}>();

function emitFirstFile(fileList: FileList | null): void {
  const file = fileList?.[0];
  if (file) emit('file', file);
}

function onInput(event: Event): void {
  emitFirstFile((event.target as HTMLInputElement).files);
}

function onDrop(event: DragEvent): void {
  event.preventDefault();
  emitFirstFile(event.dataTransfer?.files ?? null);
}
</script>

<template>
  <label class="drop-zone" @dragover.prevent @drop="onDrop">
    <span>Choose or drop .fbx</span>
    <input type="file" accept=".fbx" aria-label="Choose FBX file" @change="onInput" />
  </label>
</template>

<style scoped>
.drop-zone {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.drop-zone input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}
</style>
