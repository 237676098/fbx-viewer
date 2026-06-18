<script setup lang="ts">
import { Box, ChevronRight, CircleDot, Cuboid, GitFork, type LucideIcon } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import type * as THREE from 'three';
import type { SceneNodeInfo } from '../../domain/types';

const props = defineProps<{
  nodes: SceneNodeInfo[];
  selectedId: string | null;
}>();

const emit = defineEmits<{
  select: [object: THREE.Object3D];
}>();

const expandedIds = ref(new Set<string>());

const flatNodes = computed(() => {
  const rows: Array<{
    node: SceneNodeInfo;
    depth: number;
    hasChildren: boolean;
    expanded: boolean;
  }> = [];
  const visited = new Set<string>();

  function visit(node: SceneNodeInfo, depth: number): void {
    if (visited.has(node.id)) return;
    visited.add(node.id);

    const children = node.children.filter((child) => !visited.has(child.id));
    const expanded = expandedIds.value.has(node.id);
    rows.push({ node, depth, hasChildren: children.length > 0, expanded });

    if (expanded) {
      for (const child of children) visit(child, depth + 1);
    }
  }

  for (const node of props.nodes) visit(node, 0);
  return rows;
});

function toggleNode(id: string): void {
  const next = new Set(expandedIds.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  expandedIds.value = next;
}

function iconForType(type: string): LucideIcon {
  if (type.includes('Mesh')) return Cuboid;
  if (type.includes('Bone')) return GitFork;
  if (type.includes('Group')) return Box;
  return CircleDot;
}
</script>

<template>
  <nav class="scene-tree" aria-label="场景节点树">
    <p v-if="props.nodes.length === 0" class="scene-tree-empty">暂无场景节点</p>
    <ul v-else class="scene-tree-list">
      <li
        v-for="row in flatNodes"
        :key="row.node.id"
        class="scene-tree-item"
        :style="{ '--tree-depth': row.depth }"
      >
        <button
          type="button"
          class="scene-node-toggle"
          :class="{ hidden: !row.hasChildren, expanded: row.expanded }"
          :aria-label="row.expanded ? `折叠 ${row.node.name}` : `展开 ${row.node.name}`"
          :aria-expanded="row.hasChildren ? row.expanded : undefined"
          :data-toggle-id="row.node.id"
          @click="toggleNode(row.node.id)"
        >
          <ChevronRight :size="14" stroke-width="2.2" />
        </button>

        <button
          type="button"
          class="scene-node"
          :class="{ selected: row.node.id === props.selectedId }"
          :data-node-id="row.node.id"
          @click="emit('select', row.node.object)"
        >
          <component :is="iconForType(row.node.type)" class="scene-node-icon" :size="14" stroke-width="1.9" />
          <span class="scene-node-name">{{ row.node.name || '(unnamed)' }}</span>
          <small class="scene-node-type">{{ row.node.type }}</small>
        </button>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.scene-tree-empty {
  margin: 0;
  color: #8c95a6;
}

.scene-tree-list {
  display: grid;
  gap: 1px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.scene-tree-item {
  --indent: calc(var(--tree-depth) * 18px);
  position: relative;
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  align-items: center;
  padding-left: var(--indent);
}

.scene-tree-item::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(var(--indent) + 10px);
  width: 1px;
  background: rgba(82, 96, 119, 0.22);
  content: '';
}

.scene-node-toggle {
  position: relative;
  z-index: 1;
  display: inline-grid;
  width: 22px;
  min-width: 22px;
  min-height: 26px;
  place-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: #8e9aac;
}

.scene-node-toggle svg {
  transition: transform 120ms ease;
}

.scene-node-toggle.expanded svg {
  transform: rotate(90deg);
}

.scene-node-toggle.hidden {
  visibility: hidden;
}

.scene-node {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  padding: 3px 8px 3px 6px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: #d7deea;
  text-align: left;
}

.scene-node:hover {
  border-color: #2c3849;
  background: #18202b;
}

.scene-node.selected {
  border-color: #40699d;
  background: #243a59;
  color: #ffffff;
}

.scene-node-icon {
  color: #7f8da3;
}

.scene-node.selected .scene-node-icon {
  color: #a9d0ff;
}

.scene-node-name {
  min-width: 0;
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scene-node-type {
  max-width: 86px;
  overflow: hidden;
  padding: 1px 5px;
  border: 1px solid #303947;
  border-radius: 3px;
  background: #121923;
  color: #8f9aaa;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
