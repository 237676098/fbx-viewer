import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import InspectorPanel from '../../src/components/inspector/InspectorPanel.vue';
import type { InspectorSection } from '../../src/domain/types';

type InspectorTab = {
  id: string;
  label: string;
  sections: InspectorSection[];
  texturePreviews?: Array<{
    id: string;
    name: string;
    slot: string;
    materialName: string;
    width: number | null;
    height: number | null;
    previewUrl: string | null;
  }>;
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
  it('renders node-related sections as vertical groups without tabs', () => {
    const tabs: InspectorTab[] = [
      { id: 'node', label: '节点', sections: [section('node', '节点', 'object.name')] },
      { id: 'mesh', label: '网格', sections: [section('mesh-stats', '网格统计', 'geometry.attributes.position.count')] },
    ];

    const wrapper = mount(InspectorPanel, {
      props: { tabs },
    });

    expect(wrapper.find('[role="tablist"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('节点');
    expect(wrapper.text()).toContain('object.name');
    expect(wrapper.text()).toContain('网格统计');
    expect(wrapper.text()).toContain('geometry.attributes.position.count');
  });

  it('uses collapsible inspector components and keeps texture previews inside their component', () => {
    const tabs: InspectorTab[] = [
      { id: 'node', label: '节点', sections: [section('node', '基础属性', 'object.name')] },
      {
        id: 'textures',
        label: '纹理',
        texturePreviews: [
          {
            id: 'base',
            name: 'base_color_texture',
            slot: 'map',
            materialName: 'Atlas',
            width: 512,
            height: 512,
            previewUrl: 'blob:texture',
          },
        ],
        sections: [section('texture-map', 'map', 'texture.name')],
      },
    ];

    const wrapper = mount(InspectorPanel, {
      props: { tabs },
    });

    const components = wrapper.findAll('[data-inspector-component]');
    expect(components).toHaveLength(2);
    expect(components[0].element.tagName).toBe('DETAILS');
    expect(components[0].attributes('open')).toBeDefined();
    expect(components[0].find('[data-inspector-component-icon]').exists()).toBe(true);
    expect(components[0].find('.node-property-count').exists()).toBe(false);
    expect(components[0].find('details.inspector-section').exists()).toBe(false);
    expect(components[0].find('[data-inspector-section-title]').text()).toBe('基础属性');
    expect(components[1].find('[data-texture-preview]').exists()).toBe(true);
    expect(components[1].text()).toContain('base_color_texture');
  });

  it('renders an empty state when no tabs are provided', () => {
    const wrapper = mount(InspectorPanel, {
      props: { tabs: [] },
    });

    expect(wrapper.text()).toContain('暂无属性数据');
  });
});
