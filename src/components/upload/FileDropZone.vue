<script setup lang="ts">
const emit = defineEmits<{
  file: [file: File, files: File[]];
}>();

function emitFiles(fileList: FileList | null): void {
  const files = Array.from(fileList ?? []);
  const file = files.find((candidate) => candidate.name.toLowerCase().endsWith('.fbx')) ?? files[0];
  if (file) emit('file', file, files);
}

function onInput(event: Event): void {
  emitFiles((event.target as HTMLInputElement).files);
}

function onDrop(event: DragEvent): void {
  event.preventDefault();
  emitFiles(event.dataTransfer?.files ?? null);
}
</script>

<template>
  <label class="drop-zone" @dragover.prevent @drop="onDrop">
    <span>选择或拖入 .fbx / 贴图</span>
    <input type="file" multiple accept=".fbx,image/*" aria-label="选择 FBX 文件" @change="onInput" />
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
