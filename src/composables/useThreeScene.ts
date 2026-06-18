import { onBeforeUnmount, shallowRef, type Ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { ViewportDebugFlags } from './useViewportDiagnostics';

type DisposableObject = THREE.Object3D & { dispose?: () => void };

function disposeObject(object: THREE.Object3D): void {
  const disposable = object as DisposableObject;
  disposable.dispose?.();
}

function disposeGroupChildren(group: THREE.Group): void {
  for (const child of [...group.children]) {
    group.remove(child);
    child.traverse(disposeObject);
    disposeObject(child);
  }
}

export function useThreeScene(container: Ref<HTMLElement | null>, flags: ViewportDebugFlags) {
  const renderer = shallowRef<THREE.WebGLRenderer | null>(null);
  const scene = shallowRef(new THREE.Scene());
  const camera = shallowRef(new THREE.PerspectiveCamera(45, 1, 0.01, 10000));
  const controls = shallowRef<OrbitControls | null>(null);

  const helperGroup = new THREE.Group();
  const clock = new THREE.Clock();
  const resizeObserver =
    typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(() => resize());
  let frame = 0;
  let root: THREE.Object3D | null = null;
  let mounted = false;

  scene.value.background = new THREE.Color(0x111318);
  scene.value.add(new THREE.HemisphereLight(0xffffff, 0x303040, 2));
  scene.value.add(helperGroup);
  camera.value.position.set(2, 2, 4);

  function mount(): void {
    const host = container.value;
    if (!host || renderer.value) return;

    const nextRenderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    nextRenderer.outputColorSpace = THREE.SRGBColorSpace;
    nextRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    nextRenderer.toneMappingExposure = flags.exposure;

    if (typeof window !== 'undefined') {
      nextRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    }

    host.appendChild(nextRenderer.domElement);
    renderer.value = nextRenderer;
    controls.value = new OrbitControls(camera.value, nextRenderer.domElement);
    resizeObserver?.observe(host);
    mounted = true;
    resize();
    rebuildHelpers();
    render();
  }

  function resize(): void {
    const host = container.value;
    const activeRenderer = renderer.value;
    if (!host || !activeRenderer) return;

    const rect = host.getBoundingClientRect();
    const width = Math.max(Math.floor(rect.width), 1);
    const height = Math.max(Math.floor(rect.height), 1);

    camera.value.aspect = width / height;
    camera.value.updateProjectionMatrix();
    activeRenderer.setSize(width, height, false);
  }

  function setRoot(nextRoot: THREE.Object3D | null): void {
    if (root) scene.value.remove(root);
    root = nextRoot;

    if (root) {
      scene.value.add(root);
      frameObject(root);
    }

    rebuildHelpers();
  }

  function frameObject(object: THREE.Object3D): void {
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const maxDimension = Math.max(size.x, size.y, size.z, 1);
    const distance = maxDimension / (2 * Math.tan(THREE.MathUtils.degToRad(camera.value.fov / 2)));
    const direction = new THREE.Vector3(1, 0.75, 1).normalize();

    camera.value.position.copy(center).addScaledVector(direction, distance * 1.8);
    camera.value.near = Math.max(distance / 1000, 0.001);
    camera.value.far = Math.max(distance * 1000, 1000);
    camera.value.updateProjectionMatrix();

    controls.value?.target.copy(center);
    controls.value?.update();
  }

  function rebuildHelpers(): void {
    disposeGroupChildren(helperGroup);

    if (flags.grid) helperGroup.add(new THREE.GridHelper(10, 10));
    if (flags.axes) helperGroup.add(new THREE.AxesHelper(1));
    if (flags.bounds && root) {
      helperGroup.add(new THREE.Box3Helper(new THREE.Box3().setFromObject(root), 0x58a6ff));
    }
    if (flags.skeleton && root) helperGroup.add(new THREE.SkeletonHelper(root));

    if (renderer.value) {
      renderer.value.toneMappingExposure = flags.exposure;
    }
  }

  function render(): void {
    if (!mounted) return;

    frame = requestAnimationFrame(render);
    clock.getDelta();
    controls.value?.update();
    renderer.value?.render(scene.value, camera.value);
  }

  function screenshot(): string | null {
    return renderer.value?.domElement.toDataURL('image/png') ?? null;
  }

  function dispose(): void {
    mounted = false;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    resizeObserver?.disconnect();
    controls.value?.dispose();
    controls.value = null;
    disposeGroupChildren(helperGroup);

    const activeRenderer = renderer.value;
    if (activeRenderer) {
      activeRenderer.domElement.remove();
      activeRenderer.dispose();
      renderer.value = null;
    }
  }

  onBeforeUnmount(dispose);

  return {
    renderer,
    scene,
    camera,
    controls,
    mount,
    resize,
    setRoot,
    frameObject,
    rebuildHelpers,
    screenshot,
    dispose,
  };
}
