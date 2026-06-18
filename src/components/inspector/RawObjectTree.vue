<script setup lang="ts">
const props = defineProps<{
  value: unknown;
}>();

function serialize(value: unknown): string {
  const seen = new WeakSet<object>();
  return JSON.stringify(
    value,
    (_key, nestedValue: unknown) => {
      if (typeof nestedValue !== 'object' || nestedValue === null) return nestedValue;
      if (seen.has(nestedValue)) return '[Circular]';
      seen.add(nestedValue);
      return nestedValue;
    },
    2,
  );
}
</script>

<template>
  <pre class="raw-tree">{{ serialize(props.value) }}</pre>
</template>

<style scoped>
.raw-tree {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
