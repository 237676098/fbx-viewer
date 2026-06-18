<script setup lang="ts">
import {
  Box,
  Boxes,
  ChevronRight,
  Cuboid,
  FileSliders,
  GitFork,
  Image,
  type LucideIcon,
} from 'lucide-vue-next';
import type { InspectorSection, TexturePreviewItem } from '../../domain/types';
import FieldTable from './FieldTable.vue';
import TexturePreviewGrid from './TexturePreviewGrid.vue';

export type InspectorTab = {
  id: string;
  label: string;
  sections: InspectorSection[];
  texturePreviews?: TexturePreviewItem[];
};

defineProps<{
  tabs: InspectorTab[];
}>();

function iconForTab(id: string): LucideIcon {
  if (id === 'mesh') return Cuboid;
  if (id === 'materials') return FileSliders;
  if (id === 'skeleton') return GitFork;
  if (id === 'textures') return Image;
  if (id === 'node') return Box;
  return Boxes;
}
</script>

<template>
  <aside class="inspector-panel">
    <p v-if="tabs.length === 0" class="inspector-empty">暂无属性数据</p>
    <div v-else class="node-section-stack">
      <details
        v-for="tab in tabs"
        :key="tab.id"
        class="node-property-component"
        data-inspector-component
        open
      >
        <summary class="node-property-header">
          <ChevronRight class="node-property-chevron" :size="14" stroke-width="2.2" />
          <component
            :is="iconForTab(tab.id)"
            class="node-property-icon"
            data-inspector-component-icon
            :size="14"
            stroke-width="1.9"
          />
          <span>{{ tab.label }}</span>
        </summary>
        <TexturePreviewGrid
          v-if="tab.texturePreviews?.length"
          :textures="tab.texturePreviews"
          compact
        />
        <section v-for="section in tab.sections" :key="section.id" class="inspector-section">
          <h3 class="inspector-section-title" data-inspector-section-title>{{ section.title }}</h3>
          <FieldTable :fields="section.fields" variant="inspector" />
        </section>
        <p v-if="tab.sections.length === 0" class="inspector-empty">暂无分组</p>
      </details>
    </div>
  </aside>
</template>

<style scoped>
.inspector-panel {
  min-height: 0;
}

.node-section-stack {
  display: grid;
  gap: 6px;
  padding: 6px 8px 10px;
}

.node-property-component {
  display: grid;
  min-width: 0;
  overflow: hidden;
  border: 0;
  border-radius: 3px;
  background: #111820;
}

.node-property-header {
  display: grid;
  grid-template-columns: 16px 18px minmax(0, 1fr);
  align-items: center;
  gap: 4px;
  min-height: 32px;
  padding: 6px 9px;
  border-bottom: 1px solid rgba(78, 91, 112, 0.22);
  background: #161d26;
  color: #eef2f8;
  cursor: pointer;
  font-weight: 700;
  list-style: none;
}

.node-property-header::-webkit-details-marker {
  display: none;
}

.node-property-chevron {
  color: #8f9aaa;
  transition: transform 120ms ease;
}

.node-property-icon {
  color: #8fa3bd;
}

.node-property-component:not([open]) .node-property-header {
  border-bottom: 0;
}

.node-property-component[open] .node-property-chevron {
  transform: rotate(90deg);
}

.node-property-header span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inspector-empty {
  margin: 12px;
  color: #8c95a6;
}

.inspector-section {
  margin: 0;
  padding: 4px 0 6px;
  border: 0;
  background: transparent;
}

.inspector-section-title {
  min-height: 24px;
  margin: 0;
  padding: 6px 12px 3px;
  border: 0;
  background: transparent;
  color: #9fb4d2;
  font-size: 11px;
  font-weight: 700;
  text-transform: none;
}
</style>
