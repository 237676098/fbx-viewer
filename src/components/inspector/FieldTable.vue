<script setup lang="ts">
import type { InspectorField } from '../../domain/types';

defineProps<{
  fields: InspectorField[];
}>();

function copyText(field: InspectorField): void {
  const text = field.copyValue ?? field.displayValue;
  void navigator.clipboard?.writeText(text);
}
</script>

<template>
  <p v-if="fields.length === 0" class="field-table-empty">No fields available</p>
  <table v-else class="field-table">
    <thead>
      <tr>
        <th scope="col">Path</th>
        <th scope="col">Value</th>
        <th scope="col">Source</th>
        <th scope="col">Tip</th>
        <th v-if="fields.some((field) => field.copyValue)" scope="col">Copy</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="field in fields"
        :key="field.path"
        class="field-row"
        :class="{ warning: field.severity === 'warning' }"
      >
        <td data-testid="field-path">
          <code :title="field.path">{{ field.path }}</code>
        </td>
        <td data-testid="field-value">
          {{ field.displayValue }}
        </td>
        <td data-testid="field-source">
          {{ field.source }}
        </td>
        <td data-testid="field-tip">
          {{ field.tip ?? '' }}
        </td>
        <td v-if="fields.some((candidate) => candidate.copyValue)">
          <button
            v-if="field.copyValue"
            class="field-copy"
            type="button"
            :aria-label="`Copy ${field.path}`"
            @click="copyText(field)"
          >
            Copy
          </button>
        </td>
      </tr>
    </tbody>
  </table>
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
</style>
