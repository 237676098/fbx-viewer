<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { InspectorField } from '../../domain/types';

const props = defineProps<{
  fields: InspectorField[];
  variant?: 'table' | 'inspector';
}>();

const visibleLimit = ref(160);
const visibleFields = computed(() => props.fields.slice(0, visibleLimit.value));
const hiddenCount = computed(() => Math.max(props.fields.length - visibleLimit.value, 0));

watch(
  () => props.fields,
  () => {
    visibleLimit.value = 160;
  },
);

function copyText(field: InspectorField): void {
  const text = field.copyValue ?? field.displayValue;
  void navigator.clipboard?.writeText(text);
}
</script>

<template>
  <p v-if="fields.length === 0" class="field-table-empty">暂无字段</p>
  <div v-else-if="props.variant === 'inspector'" class="inspector-field-list">
    <div
      v-for="field in visibleFields"
      :key="field.path"
      class="inspector-field-row"
      :class="{ warning: field.severity === 'warning' }"
    >
      <div
        class="inspector-field-name"
        data-testid="inspector-field-name"
        :title="field.tip || field.path"
      >
        {{ field.label || field.path }}
      </div>
      <div class="inspector-field-value" data-testid="inspector-field-value">
        {{ field.displayValue }}
      </div>
    </div>
  </div>
  <table v-else class="field-table field-table-table">
    <thead>
      <tr>
        <th scope="col">字段</th>
        <th scope="col">值</th>
        <th scope="col">来源</th>
        <th v-if="visibleFields.some((field) => field.copyValue)" scope="col">复制</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="field in visibleFields"
        :key="field.path"
        class="field-row"
        :class="{ warning: field.severity === 'warning' }"
      >
        <td data-testid="field-path">
          <code :title="field.tip || field.path">{{ field.path }}</code>
        </td>
        <td data-testid="field-value">
          {{ field.displayValue }}
        </td>
        <td data-testid="field-source">
          {{ field.source }}
        </td>
        <td v-if="visibleFields.some((candidate) => candidate.copyValue)">
          <button
            v-if="field.copyValue"
            class="field-copy"
            type="button"
            :aria-label="`复制 ${field.path}`"
            @click="copyText(field)"
          >
            复制
          </button>
        </td>
      </tr>
    </tbody>
  </table>
  <button
    v-if="hiddenCount > 0"
    class="field-more"
    type="button"
    @click="visibleLimit += 160"
  >
    再显示 160 项（剩余 {{ hiddenCount }}）
  </button>
</template>

<style scoped>
.field-table-empty {
  margin: 0;
  color: #8c95a6;
}

.field-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.field-table th,
.field-table td {
  padding: 6px 8px;
  vertical-align: top;
  overflow-wrap: anywhere;
}

.field-row.warning {
  background: rgba(255, 190, 80, 0.08);
}

.field-copy {
  white-space: nowrap;
}

.field-more {
  margin: 8px;
}

.inspector-field-list {
  display: grid;
  min-width: 0;
  padding: 0 8px;
}

.inspector-field-row {
  display: grid;
  grid-template-columns: minmax(112px, 0.9fr) minmax(0, 1.35fr);
  align-items: start;
  min-height: 30px;
  border-bottom: 1px solid rgba(78, 91, 112, 0.16);
  border-radius: 2px;
}

.inspector-field-row:last-child {
  border-bottom: 0;
}

.inspector-field-row.warning {
  background: rgba(210, 148, 58, 0.12);
}

.inspector-field-name,
.inspector-field-value {
  min-width: 0;
  padding: 6px 6px;
  overflow-wrap: anywhere;
}

.inspector-field-name {
  color: #abc0df;
  cursor: help;
  font-family: "Cascadia Code", "SFMono-Regular", Consolas, monospace;
  font-size: 11px;
}

.inspector-field-value {
  color: #f2f6fb;
  font-variant-numeric: tabular-nums;
}
</style>
