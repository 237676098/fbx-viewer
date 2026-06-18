<script setup lang="ts">
import { defineComponent, h, type Component, type PropType, type VNode } from 'vue';
import type * as THREE from 'three';
import type { SceneNodeInfo } from '../../domain/types';

const props = defineProps<{
  nodes: SceneNodeInfo[];
  selectedId: string | null;
}>();

const emit = defineEmits<{
  select: [object: THREE.Object3D];
}>();

type BranchProps = {
  nodes: SceneNodeInfo[];
  selectedId: string | null;
  visited: Set<string>;
};

const SceneTreeBranch: Component = defineComponent({
  name: 'SceneTreeBranch',
  props: {
    nodes: {
      type: Array as PropType<SceneNodeInfo[]>,
      required: true,
    },
    selectedId: {
      type: String as PropType<string | null>,
      default: null,
    },
    visited: {
      type: Object as PropType<Set<string>>,
      required: true,
    },
  },
  emits: {
    select: (_object: THREE.Object3D) => true,
  },
  setup(branchProps: BranchProps, { emit: branchEmit }) {
    return (): VNode =>
      h(
        'ul',
        { class: 'scene-tree-list' },
        branchProps.nodes.flatMap((node): VNode[] => {
          if (branchProps.visited.has(node.id)) return [];

          const nextVisited = new Set(branchProps.visited);
          nextVisited.add(node.id);
          const hasChildren = node.children.some((child) => !nextVisited.has(child.id));

          return [
            h('li', { key: node.id, class: 'scene-tree-item' }, [
            h(
              'button',
              {
                type: 'button',
                class: ['scene-node', { selected: node.id === branchProps.selectedId }],
                style: { paddingLeft: `${Math.max(node.depth, 0) * 12 + 8}px` },
                'data-node-id': node.id,
                onClick: () => branchEmit('select', node.object),
              },
              [
                h('span', { class: 'scene-node-name' }, node.name || '(unnamed)'),
                h('small', { class: 'scene-node-type' }, node.type),
              ],
            ),
            hasChildren
              ? h(SceneTreeBranch, {
                  nodes: node.children,
                  selectedId: branchProps.selectedId,
                  visited: nextVisited,
                  onSelect: (object: THREE.Object3D) => branchEmit('select', object),
                })
              : null,
          ]),
          ];
        }),
      );
  },
});
</script>

<template>
  <nav class="scene-tree" aria-label="Scene tree">
    <p v-if="props.nodes.length === 0" class="scene-tree-empty">No scene nodes</p>
    <SceneTreeBranch v-else :nodes="props.nodes" :selected-id="props.selectedId" :visited="new Set()" @select="emit('select', $event)" />
  </nav>
</template>

<style scoped>
.scene-tree-empty {
  margin: 0;
  color: #8c95a6;
}

.scene-tree-list {
  display: grid;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.scene-node {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
}

.scene-node.selected {
  background: #263247;
}

.scene-node-name {
  min-width: 0;
  overflow-wrap: anywhere;
}

.scene-node-type {
  color: #8c95a6;
}
</style>
