import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import InspectorPanel from '../../src/components/inspector/InspectorPanel.vue';
import type { InspectorSection } from '../../src/domain/types';

type InspectorTab = {
  id: string;
  label: string;
  sections: InspectorSection[];
};

function section(id: string, title: string, path: string): InspectorSection {
  return {
    id,
    title,
    fields: [
      {
        path,
        value: path,
        displayValue: `value:${path}`,
        source: 'test',
      },
    ],
  };
}

describe('InspectorPanel', () => {
  it('switches tabs and renders active tab sections with field tables', async () => {
    const tabs: InspectorTab[] = [
      { id: 'overview', label: 'Overview', sections: [section('stats', 'Stats', 'overview.meshCount')] },
      { id: 'raw', label: 'Raw', sections: [section('raw-node', 'Raw Node', 'raw.uuid')] },
    ];

    const wrapper = mount(InspectorPanel, {
      props: { tabs },
    });

    expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe('Overview');
    expect(wrapper.text()).toContain('Stats');
    expect(wrapper.text()).toContain('overview.meshCount');

    await wrapper.get('[role="tab"][data-tab-id="raw"]').trigger('click');

    expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe('Raw');
    expect(wrapper.text()).toContain('Raw Node');
    expect(wrapper.text()).toContain('raw.uuid');
    expect(wrapper.text()).not.toContain('overview.meshCount');
  });

  it('selects a valid tab when the tab list changes', async () => {
    const wrapper = mount(InspectorPanel, {
      props: {
        tabs: [
          { id: 'overview', label: 'Overview', sections: [section('stats', 'Stats', 'overview.meshCount')] },
          { id: 'mesh', label: 'Mesh', sections: [section('mesh-stats', 'Mesh Stats', 'mesh.vertexCount')] },
        ],
      },
    });

    await wrapper.get('[role="tab"][data-tab-id="mesh"]').trigger('click');
    await wrapper.setProps({
      tabs: [{ id: 'overview', label: 'Overview', sections: [section('stats', 'Stats', 'overview.meshCount')] }],
    });
    await nextTick();

    expect(wrapper.get('[role="tab"][aria-selected="true"]').attributes('data-tab-id')).toBe('overview');
    expect(wrapper.text()).toContain('overview.meshCount');
    expect(wrapper.text()).not.toContain('mesh.vertexCount');
  });

  it('renders an empty state when no tabs are provided', () => {
    const wrapper = mount(InspectorPanel, {
      props: { tabs: [] },
    });

    expect(wrapper.text()).toContain('No inspector data');
  });
});
