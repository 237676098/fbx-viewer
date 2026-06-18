import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isRef, nextTick, shallowRef, type Ref } from 'vue';
import * as THREE from 'three';
import FbxViewport from '../../src/components/viewport/FbxViewport.vue';
import type { ViewportDebugFlags } from '../../src/composables/useViewportDiagnostics';

const mountScene = vi.fn();
const resizeScene = vi.fn();
const setRoot = vi.fn();
const screenshot = vi.fn<() => string | null>();
const receivedFlags = vi.fn<(flags: Ref<ViewportDebugFlags>) => void>();
const receivedFrameCallback = vi.fn<(callback?: (deltaSeconds: number) => void) => void>();

vi.mock('../../src/composables/useThreeScene', () => ({
  useThreeScene: vi.fn((_container, flagsSource, options) => {
    receivedFlags(flagsSource);
    receivedFrameCallback(options?.onFrame);
    return {
      renderer: shallowRef(null),
      mount: mountScene,
      resize: resizeScene,
      setRoot,
      screenshot,
    };
  }),
}));

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

describe('FbxViewport', () => {
  let activeWrapper: VueWrapper | null = null;

  afterEach(() => {
    activeWrapper?.unmount();
    activeWrapper = null;
    vi.restoreAllMocks();
    mountScene.mockClear();
    resizeScene.mockClear();
    setRoot.mockClear();
    screenshot.mockReset();
    receivedFlags.mockClear();
    receivedFrameCallback.mockClear();
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
    activeWrapper = wrapper;

    expect(mountScene).toHaveBeenCalledTimes(1);
    expect(resizeScene).toHaveBeenCalled();
    expect(setRoot).toHaveBeenCalledWith(root);

    await wrapper.setProps({ root: nextRoot });

    expect(setRoot).toHaveBeenLastCalledWith(nextRoot);
  });

  it('passes an optional frame callback to the three scene', () => {
    const onFrame = vi.fn();
    const wrapper = mount(FbxViewport, {
      props: {
        root: null,
        flags: flags(),
        onFrame,
      },
    });
    activeWrapper = wrapper;

    const callback = receivedFrameCallback.mock.calls[0][0];
    callback?.(0.25);

    expect(onFrame).toHaveBeenCalledWith(0.25);
  });

  it('emits toolbar flag changes without mutating flags', async () => {
    const diagnosticFlags = flags();
    const wrapper = mount(FbxViewport, {
      props: {
        root: null,
        flags: diagnosticFlags,
      },
    });
    activeWrapper = wrapper;

    await wrapper.get('button[aria-label="Hide grid"]').trigger('click');
    await wrapper.get('input[aria-label="Exposure"]').setValue('1.5');

    expect(diagnosticFlags.grid).toBe(true);
    expect(diagnosticFlags.exposure).toBe(1);
    expect(wrapper.emitted('flagChange')?.[0]).toEqual([{ key: 'grid', value: false }]);
    expect(wrapper.emitted('flagChange')?.[1]).toEqual([{ key: 'exposure', value: 1.5 }]);
  });

  it('passes a flags ref that follows immutable prop replacements', async () => {
    const initialFlags = flags();
    const nextFlags = flags({ grid: false, exposure: 1.5 });
    const wrapper = mount(FbxViewport, {
      props: {
        root: null,
        flags: initialFlags,
      },
    });
    activeWrapper = wrapper;
    const flagsSource = receivedFlags.mock.calls[0][0];

    expect(isRef(flagsSource)).toBe(true);
    expect(flagsSource.value.grid).toBe(initialFlags.grid);
    expect(flagsSource.value.exposure).toBe(initialFlags.exposure);

    await wrapper.setProps({ flags: nextFlags });

    expect(flagsSource.value.grid).toBe(nextFlags.grid);
    expect(flagsSource.value.exposure).toBe(nextFlags.exposure);
  });

  it('resizes on window resize and removes the listener on unmount', () => {
    const wrapper = mount(FbxViewport, {
      props: {
        root: null,
        flags: flags(),
      },
    });
    activeWrapper = wrapper;
    resizeScene.mockClear();

    window.dispatchEvent(new Event('resize'));
    expect(resizeScene).toHaveBeenCalledTimes(1);

    wrapper.unmount();
    activeWrapper = null;
    resizeScene.mockClear();
    window.dispatchEvent(new Event('resize'));

    expect(resizeScene).not.toHaveBeenCalled();
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
    activeWrapper = wrapper;

    await wrapper.get('button[aria-label="Download screenshot"]').trigger('click');
    expect(click).not.toHaveBeenCalled();

    await wrapper.get('button[aria-label="Download screenshot"]').trigger('click');
    await nextTick();

    expect(click).toHaveBeenCalledTimes(1);
    expect(appendChild).toHaveBeenCalled();
    expect(removeChild).toHaveBeenCalled();
  });
});
