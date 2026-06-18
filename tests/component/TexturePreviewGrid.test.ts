import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TexturePreviewGrid from '../../src/components/inspector/TexturePreviewGrid.vue';
import type { TexturePreviewItem } from '../../src/domain/types';

describe('TexturePreviewGrid', () => {
  it('renders texture previews with slot, material, and dimensions', () => {
    const textures: TexturePreviewItem[] = [
      {
        id: 'diffuse',
        name: 'Bunny_D',
        slot: 'map',
        materialName: 'BunnyBody',
        width: 512,
        height: 256,
        previewUrl: 'blob:preview',
      },
      {
        id: 'normal',
        name: '',
        slot: 'normalMap',
        materialName: 'BunnyBody',
        width: null,
        height: null,
        previewUrl: null,
      },
    ];

    const wrapper = mount(TexturePreviewGrid, {
      props: { textures },
    });

    expect(wrapper.findAll('[data-texture-preview]')).toHaveLength(2);
    expect(wrapper.text()).toContain('map');
    expect(wrapper.text()).toContain('normalMap');
    expect(wrapper.text()).toContain('BunnyBody');
    expect(wrapper.text()).toContain('512 x 256');
    expect(wrapper.get('img[alt="Bunny_D"]').attributes('src')).toBe('blob:preview');
    expect(wrapper.text()).toContain('无预览图');
  });
});
