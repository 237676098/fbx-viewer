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

    expect(wrapper.get('button[aria-label="Hide grid"]').attributes('aria-pressed')).toBe('true');
    expect(wrapper.get('button[aria-label="Show bounds"]').attributes('aria-pressed')).toBe('false');
    expect(wrapper.get('button[aria-label="Hide textures"]').attributes('aria-pressed')).toBe('true');
    expect(wrapper.get('input[aria-label="Exposure"]').element).toHaveProperty('value', '1.25');
    expect(wrapper.find('button[aria-label="Download screenshot"]').exists()).toBe(true);
  });

  it('emits flag, exposure, and screenshot changes without mutating props', async () => {
    const initialFlags = flags({ grid: true, exposure: 1 });
    const wrapper = mount(ViewportToolbar, {
      props: {
        flags: initialFlags,
      },
    });

    await wrapper.get('button[aria-label="Hide grid"]').trigger('click');
    await wrapper.get('button[aria-label="Show wireframe"]').trigger('click');
    await wrapper.get('input[aria-label="Exposure"]').setValue('1.5');
    await wrapper.get('button[aria-label="Download screenshot"]').trigger('click');

    expect(initialFlags.grid).toBe(true);
    expect(initialFlags.wireframe).toBe(false);
    expect(wrapper.emitted('update:flag')?.[0]).toEqual(['grid', false]);
    expect(wrapper.emitted('update:flag')?.[1]).toEqual(['wireframe', true]);
    expect(wrapper.emitted('update:flag')?.[2]).toEqual(['exposure', 1.5]);
    expect(wrapper.emitted('screenshot')).toHaveLength(1);
  });
});
