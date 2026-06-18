import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import AssetPanel from '../../src/components/inspector/AssetPanel.vue';
import type { AssetPanelData } from '../../src/domain/types';

const assets: AssetPanelData = {
  overview: {
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        fields: [{ path: 'overview.fileName', value: 'Bunny.fbx', displayValue: 'Bunny.fbx', source: 'test' }],
      },
    ],
  },
  animations: {
    sections: [
      {
        id: 'animation-0',
        title: 'Walk',
        fields: [{ path: 'animations.0.clip.duration', value: 1, displayValue: '1.000s', source: 'test' }],
      },
    ],
  },
  textures: [
    {
      id: 'texture',
      name: 'base_color_texture',
      slot: 'map',
      materialName: 'Atlas',
      width: null,
      height: null,
      previewUrl: null,
      fileName: 'Atlas_Monsters.png',
      status: 'missing',
    },
  ],
  textureSections: [],
};

describe('AssetPanel', () => {
  it('renders global asset groups without node tabs', () => {
    const wrapper = mount(AssetPanel, {
      props: { assets },
    });

    expect(wrapper.find('[role="tablist"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('文件概览');
    expect(wrapper.text()).toContain('动画资源');
    expect(wrapper.text()).toContain('纹理资源');
    expect(wrapper.text()).toContain('Atlas_Monsters.png');
    expect(wrapper.text()).toContain('外部纹理未解析');
  });
});
