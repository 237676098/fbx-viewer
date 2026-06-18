import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ViewportToolbar from '../../src/components/viewport/ViewportToolbar.vue';
import type { ViewportDebugFlags } from '../../src/composables/useViewportDiagnostics';

function flags(overrides: Partial<ViewportDebugFlags> = {}): ViewportDebugFlags {
  return {
    grid: true,
    axes: true,
    bounds: false,
    skeleton: false,
    wireframe: false,
    normals: false,
    materialOverride: false,
    textures: true,
    exposure: 1,
    ...overrides,
  };
}

describe('ViewportToolbar', () => {
  it('renders diagnostics controls with current state', () => {
    const wrapper = mount(ViewportToolbar, {
      props: {
        flags: flags({ grid: true, bounds: false, textures: true, exposure: 1.25 }),
      },
    });

    expect(wrapper.get('button[aria-label="隐藏网格"]').attributes('aria-pressed')).toBe('true');
    expect(wrapper.get('button[aria-label="显示包围盒"]').attributes('aria-pressed')).toBe('false');
    expect(wrapper.get('button[aria-label="隐藏贴图"]').attributes('aria-pressed')).toBe('true');
    expect(wrapper.get('input[aria-label="曝光"]').element).toHaveProperty('value', '1.25');
    expect(wrapper.find('button[aria-label="下载截图"]').exists()).toBe(true);
  });

  it('emits flag, exposure, and screenshot changes without mutating props', async () => {
    const initialFlags = flags({ grid: true, exposure: 1 });
    const wrapper = mount(ViewportToolbar, {
      props: {
        flags: initialFlags,
      },
    });

    await wrapper.get('button[aria-label="隐藏网格"]').trigger('click');
    await wrapper.get('button[aria-label="显示线框"]').trigger('click');
    await wrapper.get('input[aria-label="曝光"]').setValue('1.5');
    await wrapper.get('button[aria-label="下载截图"]').trigger('click');

    expect(initialFlags.grid).toBe(true);
    expect(initialFlags.wireframe).toBe(false);
    expect(wrapper.emitted('flag-change')?.[0]).toEqual([{ key: 'grid', value: false }]);
    expect(wrapper.emitted('flag-change')?.[1]).toEqual([{ key: 'wireframe', value: true }]);
    expect(wrapper.emitted('flag-change')?.[2]).toEqual([{ key: 'exposure', value: 1.5 }]);
    expect(wrapper.emitted('screenshot')).toHaveLength(1);
  });
});
