import { computed, onBeforeUnmount, shallowRef, toValue, watch, type MaybeRef, type Ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VertexNormalsHelper } from 'three/examples/jsm/helpers/VertexNormalsHelper.js';
import type { ViewportDebugFlags } from './useViewportDiagnostics';

type DisposableObject = THREE.Object3D & { dispose?: () => void };
type DisposableResource = { dispose?: () => void };
type MeshWithMaterial = THREE.Mesh & { material: THREE.Material | THREE.Material[] };
type MaterialState = {
  wireframe?: boolean;
  textures: Map<string, THREE.Texture | null>;
};

function disposeObject(object: THREE.Object3D): void {
  const disposable = object as DisposableObject;
  disposable.dispose?.();
}

function isMesh(object: THREE.Object3D): object is MeshWithMaterial {
  return 'isMesh' in object && object.isMesh === true && 'material' in object;
}

function isTexture(value: unknown): value is THREE.Texture {
  return Boolean(value && typeof value === 'object' && 'isTexture' in value && value.isTexture === true);
}

function disposeResource(value: unknown): void {
  const disposable = value as DisposableResource;
  disposable?.dispose?.();
}

function collectMaterials(value: THREE.Material | THREE.Material[]): THREE.Material[] {
  return Array.isArray(value) ? value : [value];
}

function disposeMaterial(material: THREE.Material): void {
  const seenTextures = new Set<THREE.Texture>();

  for (const value of Object.values(material)) {
    if (isTexture(value)) seenTextures.add(value);
  }

  for (const texture of seenTextures) {
    disposeResource(texture);
  }

  material.dispose();
}

function disposeSceneRoot(object: THREE.Object3D): void {
  const seenGeometries = new Set<THREE.BufferGeometry>();
  const seenMaterials = new Set<THREE.Material>();

  object.traverse((child) => {
    if (!isMesh(child)) return;

    if (child.geometry) seenGeometries.add(child.geometry);
    for (const material of collectMaterials(child.material)) {
      seenMaterials.add(material);
    }
  });

  for (const geometry of seenGeometries) {
    geometry.dispose();
  }

  for (const material of seenMaterials) {
    disposeMaterial(material);
  }
}

function disposeGroupChildren(group: THREE.Group): void {
  for (const child of [...group.children]) {
    group.remove(child);
    child.traverse(disposeObject);
    disposeObject(child);
  }
}

export function useThreeScene(container: Ref<HTMLElement | null>, flagsSource: MaybeRef<ViewportDebugFlags>) {
  const flags = computed(() => toValue(flagsSource));
  const renderer = shallowRef<THREE.WebGLRenderer | null>(null);
  const scene = shallowRef(new THREE.Scene());
  const camera = shallowRef(new THREE.PerspectiveCamera(45, 1, 0.01, 10000));
  const controls = shallowRef<OrbitControls | null>(null);

  const helperGroup = new THREE.Group();
  const overrideMaterial = new THREE.MeshNormalMaterial();
  const originalMeshMaterials = new WeakMap<MeshWithMaterial, THREE.Material | THREE.Material[]>();
  const originalMaterialStates = new WeakMap<THREE.Material, MaterialState>();
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

  function activeFlags(): ViewportDebugFlags {
    return flags.value;
  }

  const stopDiagnosticsWatch = watch(
    () =>
      [
        activeFlags().grid,
        activeFlags().axes,
        activeFlags().bounds,
        activeFlags().skeleton,
        activeFlags().wireframe,
        activeFlags().normals,
        activeFlags().materialOverride,
        activeFlags().textures,
        activeFlags().exposure,
      ] as const,
    () => {
      applyMaterialDiagnostics();
      rebuildHelpers();
    },
  );

  function mount(): void {
    const host = container.value;
    if (!host || renderer.value) return;

    const nextRenderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    nextRenderer.outputColorSpace = THREE.SRGBColorSpace;
    nextRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    nextRenderer.toneMappingExposure = flags.value.exposure;

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
    const previousRoot = root;
    if (previousRoot) {
      restoreMaterialDiagnostics(previousRoot);
      scene.value.remove(previousRoot);
    }

    root = nextRoot;

    if (root) {
      scene.value.add(root);
      applyMaterialDiagnostics();
      frameObject(root);
    }

    rebuildHelpers();

    if (previousRoot && previousRoot !== nextRoot) {
      disposeSceneRoot(previousRoot);
    }
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
    const currentFlags = activeFlags();
    disposeGroupChildren(helperGroup);

    if (currentFlags.grid) helperGroup.add(new THREE.GridHelper(10, 10));
    if (currentFlags.axes) helperGroup.add(new THREE.AxesHelper(1));
    if (currentFlags.bounds && root) {
      helperGroup.add(new THREE.Box3Helper(new THREE.Box3().setFromObject(root), 0x58a6ff));
    }
    if (currentFlags.skeleton && root) helperGroup.add(new THREE.SkeletonHelper(root));
    if (currentFlags.normals && root) {
      root.traverse((object) => {
        if (isMesh(object)) helperGroup.add(new VertexNormalsHelper(object, 0.1, 0x7dd3fc));
      });
    }

    if (renderer.value) {
      renderer.value.toneMappingExposure = currentFlags.exposure;
    }
  }

  function rememberMaterialState(material: THREE.Material): MaterialState {
    const existing = originalMaterialStates.get(material);
    if (existing) return existing;

    const state: MaterialState = { textures: new Map() };
    const candidate = material as unknown as Record<string, unknown>;

    if ('wireframe' in candidate && typeof candidate.wireframe === 'boolean') {
      state.wireframe = candidate.wireframe;
    }

    for (const [key, value] of Object.entries(candidate)) {
      if (isTexture(value)) state.textures.set(key, value);
    }

    originalMaterialStates.set(material, state);
    return state;
  }

  function applyMaterialFlags(material: THREE.Material): void {
    const currentFlags = activeFlags();
    const state = rememberMaterialState(material);
    const candidate = material as unknown as Record<string, unknown>;

    if (state.wireframe !== undefined) {
      candidate.wireframe = currentFlags.wireframe;
    }

    for (const key of state.textures.keys()) {
      candidate[key] = currentFlags.textures ? state.textures.get(key) ?? null : null;
    }

    material.needsUpdate = true;
  }

  function applyMaterialDiagnostics(): void {
    if (!root) return;

    const currentFlags = activeFlags();
    overrideMaterial.wireframe = currentFlags.wireframe;
    overrideMaterial.needsUpdate = true;

    root.traverse((object) => {
      if (!isMesh(object)) return;

      if (!originalMeshMaterials.has(object)) {
        originalMeshMaterials.set(object, object.material);
      }

      const originalMaterial = originalMeshMaterials.get(object);
      if (!originalMaterial) return;

      for (const material of collectMaterials(originalMaterial)) {
        applyMaterialFlags(material);
      }

      object.material = currentFlags.materialOverride ? overrideMaterial : originalMaterial;
    });
  }

  function restoreMaterialDiagnostics(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (!isMesh(child)) return;

      const originalMaterial = originalMeshMaterials.get(child);
      if (originalMaterial) child.material = originalMaterial;

      for (const material of collectMaterials(child.material)) {
        const state = originalMaterialStates.get(material);
        if (!state) continue;

        const candidate = material as unknown as Record<string, unknown>;
        if (state.wireframe !== undefined) candidate.wireframe = state.wireframe;
        for (const [key, texture] of state.textures) {
          candidate[key] = texture;
        }
        material.needsUpdate = true;
      }
    });
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
    const previousRoot = root;
    if (previousRoot) {
      restoreMaterialDiagnostics(previousRoot);
      scene.value.remove(previousRoot);
      root = null;
    }

    mounted = false;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    stopDiagnosticsWatch();
    resizeObserver?.disconnect();
    controls.value?.dispose();
    controls.value = null;
    disposeGroupChildren(helperGroup);
    overrideMaterial.dispose();

    if (previousRoot) {
      disposeSceneRoot(previousRoot);
    }

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
