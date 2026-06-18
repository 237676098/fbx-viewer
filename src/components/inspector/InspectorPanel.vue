<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { InspectorSection } from '../../domain/types';
import FieldTable from './FieldTable.vue';

export type InspectorTab = {
  id: string;
  label: string;
  sections: InspectorSection[];
};

const props = defineProps<{
  tabs: InspectorTab[];
}>();

const activeTabId = ref<string | null>(props.tabs[0]?.id ?? null);

const activeTab = computed(
  () => props.tabs.find((tab) => tab.id === activeTabId.value) ?? props.tabs[0] ?? null,
);

watch(
  () => props.tabs.map((tab) => tab.id).join('\n'),
  () => {
    if (!props.tabs.some((tab) => tab.id === activeTabId.value)) {
      activeTabId.value = props.tabs[0]?.id ?? null;
    }
  },
);

function selectTab(id: string): void {
  activeTabId.value = id;
}
</script>

<template>
  <aside class="inspector-panel">
    <p v-if="tabs.length === 0" class="inspector-empty">No inspector data</p>
    <template v-else>
      <div class="tab-row" role="tablist" aria-label="Inspector dimensions">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-button"
          :class="{ active: tab.id === activeTab?.id }"
          type="button"
          role="tab"
          :data-tab-id="tab.id"
          :aria-selected="tab.id === activeTab?.id"
          @click="selectTab(tab.id)"
        >
          {{ tab.label }}
        </button>
      </div>

      <div v-if="activeTab" class="tab-body" role="tabpanel" :aria-label="activeTab.label">
        <details v-for="section in activeTab.sections" :key="section.id" open class="inspector-section">
          <summary>{{ section.title }}</summary>
          <FieldTable :fields="section.fields" />
        </details>
        <p v-if="activeTab.sections.length === 0" class="inspector-empty">No sections available</p>
      </div>
    </template>
  </aside>
</template>

<style scoped>
.inspector-panel {
  min-height: 0;
}

.inspector-empty {
  margin: 12px;
  color: #8c95a6;
}

.tab-row {
  display: flex;
  gap: 4px;
  padding: 8px;
  overflow-x: auto;
}

.tab-button.active {
  background: #30415c;
}

.tab-body {
  padding: 8px;
}

.inspector-section {
  margin-bottom: 8px;
}
</style>
