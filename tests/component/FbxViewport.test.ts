import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick, shallowRef } from 'vue';
import * as THREE from 'three';
import FbxViewport from '../../src/components/viewport/FbxViewport.vue';
import type { ViewportDebugFlags } from '../../src/composables/useViewportDiagnostics';

const mountScene = vi.fn();
const resizeScene = vi.fn();
const setRoot = vi.fn();
const screenshot = vi.fn<() => string | null>();

vi.mock('../../src/composables/useThreeScene', () => ({
  useThreeScene: vi.fn(() => ({
    renderer: shallowRef(null),
    mount: mountScene,
    resize: resizeScene,
    setRoot,
    screenshot,
  })),
}));

function flags(): ViewportDebugFlags {
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
  };
}

describe('FbxViewport', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mountScene.mockClear();
    resizeScene.mockClear();
    setRoot.mockClear();
    screenshot.mockReset();
  });

  it('mounts the three scene and updates roots reactively', async () => {
    const root = new THREE.Group();
    const nextRoot = new THREE.Group();
    const wrapper = mount(FbxViewport, {
      props: {
        root,
        flags: flags(),
      },
    });

    expect(mountScene).toHaveBeenCalledTimes(1);
    expect(resizeScene).toHaveBeenCalled();
    expect(setRoot).toHaveBeenCalledWith(root);

    await wrapper.setProps({ root: nextRoot });

    expect(setRoot).toHaveBeenLastCalledWith(nextRoot);
  });

  it('downloads screenshots when available and ignores missing renderer output', async () => {
    const click = vi.fn();
    const appendChild = vi.spyOn(document.body, 'appendChild');
    const removeChild = vi.spyOn(document.body, 'removeChild');
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = document.createElementNS('http://www.w3.org/1999/xhtml', tagName) as HTMLElement;
      if (tagName === 'a') {
        Object.assign(element, { click });
      }
      return element;
    });

    screenshot.mockReturnValueOnce(null).mockReturnValueOnce('data:image/png;base64,abc');
    const wrapper = mount(FbxViewport, {
      props: {
        root: null,
        flags: flags(),
      },
    });

    await wrapper.get('button[aria-label="Download screenshot"]').trigger('click');
    expect(click).not.toHaveBeenCalled();

    await wrapper.get('button[aria-label="Download screenshot"]').trigger('click');
    await nextTick();

    expect(click).toHaveBeenCalledTimes(1);
    expect(appendChild).toHaveBeenCalled();
    expect(removeChild).toHaveBeenCalled();
  });
});
