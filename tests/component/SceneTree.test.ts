import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import SceneTree from '../../src/components/scene/SceneTree.vue';
import type { SceneNodeInfo } from '../../src/domain/types';

function node(id: string, name: string, children: SceneNodeInfo[] = []): SceneNodeInfo {
  const object = new THREE.Object3D();
  object.name = name;
  return {
    id,
    name,
    type: 'Mesh',
    depth: 0,
    object,
    children,
  };
}

describe('SceneTree', () => {
  it('renders recursive nodes and emits the selected object', async () => {
    const child = node('child', 'ChildMesh');
    const root = node('root', 'RootGroup', [child]);

    const wrapper = mount(SceneTree, {
      props: {
        nodes: [root],
        selectedId: 'child',
      },
    });

    expect(wrapper.text()).toContain('RootGroup');
    expect(wrapper.find('[data-node-id="child"]').exists()).toBe(false);

    await wrapper.get('[data-toggle-id="root"]').trigger('click');

    expect(wrapper.text()).toContain('ChildMesh');
    expect(wrapper.get('[data-node-id="child"]').classes()).toContain('selected');

    await wrapper.get('[data-node-id="child"]').trigger('click');

    expect(wrapper.emitted('select')?.[0]).toEqual([child.object]);
  });

  it('does not recurse infinitely when a node appears inside its own descendants', () => {
    const root = node('root', 'RootGroup');
    root.children = [root];

    const wrapper = mount(SceneTree, {
      props: {
        nodes: [root],
        selectedId: null,
      },
    });

    expect(wrapper.findAll('[data-node-id="root"]')).toHaveLength(1);
  });

  it('collapses and expands child nodes without merging node name and type text', async () => {
    const child = node('child', 'RootBone');
    const root = node('root', 'CharacterArmature', [child]);

    const wrapper = mount(SceneTree, {
      props: {
        nodes: [root],
        selectedId: null,
      },
    });

    expect(wrapper.find('[data-node-id="child"]').exists()).toBe(false);

    await wrapper.get('[data-toggle-id="root"]').trigger('click');

    expect(wrapper.find('[data-node-id="child"]').exists()).toBe(true);
    expect(wrapper.get('[data-node-id="child"] .scene-node-name').text()).toBe('RootBone');
    expect(wrapper.get('[data-node-id="child"] .scene-node-type').text()).toBe('Mesh');
    expect(wrapper.get('[data-node-id="child"]').html()).toContain('scene-node-type');
  });
});
