# FBX Inspector Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vue-based local FBX inspector that renders FBX models, plays and analyzes animations, and exposes field-level model data with original runtime paths, values, sources, and tips.

**Architecture:** The app is a single-page Vue 3 workbench with a Three.js viewport, scene tree, timeline, and dimension-based inspector. Three.js runtime objects are converted into stable inspector data by focused extractor modules so UI components render structured fields instead of traversing arbitrary object internals.

**Tech Stack:** Vue 3, Vite, TypeScript, Three.js, FBXLoader, OrbitControls, Vitest, Vue Test Utils, Playwright, lucide-vue-next.

---

## Current Context

- Workspace: `D:\work\ai_coding\fbx-viewer`
- Existing app code: none
- Git repository: not initialized at the time this plan was written
- Confirmed spec: `docs/superpowers/specs/2026-06-18-fbx-inspector-design.md`

If Git is initialized before or during implementation, run the commit steps. If not, skip only the commit command and keep the file changes.

## File Structure

Create this structure:

```text
package.json
index.html
vite.config.ts
vitest.config.ts
playwright.config.ts
tsconfig.json
tsconfig.node.json
src/
  main.ts
  app/
    App.vue
  components/
    inspector/
      FieldTable.vue
      InspectorPanel.vue
      RawObjectTree.vue
    scene/
      SceneTree.vue
    upload/
      FileDropZone.vue
    viewport/
      FbxViewport.vue
      TimelineControls.vue
      ViewportToolbar.vue
  composables/
    useAnimationMixer.ts
    useFbxLoader.ts
    useInspectorData.ts
    useSelection.ts
    useThreeScene.ts
    useViewportDiagnostics.ts
  domain/
    extractors/
      animationExtractor.ts
      materialExtractor.ts
      meshExtractor.ts
      overviewExtractor.ts
      performanceExtractor.ts
      sceneExtractor.ts
      skeletonExtractor.ts
      textureExtractor.ts
    tips/
      fieldTips.ts
    types.ts
  styles/
    global.css
  utils/
    format.ts
    threeObjectSerialize.ts
tests/
  unit/
    animationExtractor.test.ts
    fieldTips.test.ts
    format.test.ts
    materialTextureExtractors.test.ts
    meshExtractor.test.ts
    overviewExtractor.test.ts
    rawSerializer.test.ts
    sceneSkeletonExtractors.test.ts
  component/
    FieldTable.test.ts
    InspectorPanel.test.ts
    SceneTree.test.ts
    TimelineControls.test.ts
  e2e/
    app.spec.ts
```

Responsibilities:

- `domain/types.ts`: shared display models and app state types.
- `domain/extractors/*`: pure functions that inspect Three.js objects and return field sections.
- `domain/tips/fieldTips.ts`: field path to explanation mapping.
- `utils/format.ts`: deterministic formatting for numbers, vectors, colors, matrices, typed arrays, byte sizes, and durations.
- `utils/threeObjectSerialize.ts`: safe raw object serialization with cycle protection.
- `composables/*`: Vue-facing state and Three.js runtime orchestration.
- `components/*`: presentational and interaction components.
- `app/App.vue`: workbench composition and state wiring.

---

## Task 1: Scaffold Vue, Tooling, And Test Harness

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `src/main.ts`
- Create: `src/app/App.vue`
- Create: `src/styles/global.css`

- [ ] **Step 1: Create package and config files**

Create `package.json`:

```json
{
  "name": "fbx-viewer",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "vue-tsc --noEmit && vite build",
    "preview": "vite preview --host 127.0.0.1",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@vitejs/plugin-vue": "^5.2.4",
    "lucide-vue-next": "^0.468.0",
    "three": "^0.171.0",
    "vue": "^3.5.13"
  },
  "devDependencies": {
    "@playwright/test": "^1.49.1",
    "@types/three": "^0.171.0",
    "@vitejs/plugin-vue-jsx": "^4.1.1",
    "@vue/test-utils": "^2.4.6",
    "jsdom": "^25.0.1",
    "typescript": "^5.7.2",
    "vite": "^6.0.3",
    "vitest": "^2.1.8",
    "vue-tsc": "^2.1.10"
  }
}
```

Create `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FBX Inspector Workbench</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

Create `vite.config.ts`:

```ts
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
});
```

Create `vitest.config.ts`:

```ts
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
});
```

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  webServer: {
    command: 'npm run dev -- --port 5173',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*.ts", "src/**/*.vue", "tests/**/*.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts", "vitest.config.ts", "playwright.config.ts"]
}
```

- [ ] **Step 2: Add minimal Vue entrypoint**

Create `src/main.ts`:

```ts
import { createApp } from 'vue';
import App from './app/App.vue';
import './styles/global.css';

createApp(App).mount('#app');
```

Create `src/app/App.vue`:

```vue
<template>
  <main class="app-shell">
    <header class="top-bar">
      <strong>FBX Inspector Workbench</strong>
      <span class="muted">Drop or choose a local .fbx file to inspect it.</span>
    </header>
    <section class="empty-state">
      <h1>FBX Inspector Workbench</h1>
      <p>Local model rendering, animation playback, and field-level diagnostics.</p>
    </section>
  </main>
</template>
```

Create `src/styles/global.css`:

```css
:root {
  color: #d9dee7;
  background: #111318;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  font-size: 14px;
  line-height: 1.4;
}

* {
  box-sizing: border-box;
}

html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
}

button,
input,
select {
  font: inherit;
}

.app-shell {
  display: grid;
  grid-template-rows: 48px 1fr;
  width: 100%;
  height: 100%;
  min-width: 1024px;
  background: #111318;
}

.top-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 16px;
  border-bottom: 1px solid #2a2f3a;
  background: #181b21;
}

.muted {
  color: #8c95a6;
}

.empty-state {
  display: grid;
  place-content: center;
  gap: 8px;
  color: #d9dee7;
  text-align: center;
}

.empty-state h1,
.empty-state p {
  margin: 0;
}
```

- [ ] **Step 3: Install dependencies**

Run:

```powershell
npm install
```

Expected: `node_modules` and `package-lock.json` are created without dependency resolution errors.

- [ ] **Step 4: Verify scaffold**

Run:

```powershell
npm run build
```

Expected: TypeScript passes and Vite emits `dist`.

- [ ] **Step 5: Commit scaffold if Git exists**

Run:

```powershell
git rev-parse --is-inside-work-tree
```

If output is `true`, run:

```powershell
git add package.json package-lock.json index.html vite.config.ts vitest.config.ts playwright.config.ts tsconfig.json tsconfig.node.json src
git commit -m "chore: scaffold vue fbx inspector"
```

If the command fails with `not a git repository`, skip this step.

---

## Task 2: Add Domain Types, Formatting, And Field Tips

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/tips/fieldTips.ts`
- Create: `src/utils/format.ts`
- Test: `tests/unit/format.test.ts`
- Test: `tests/unit/fieldTips.test.ts`

- [ ] **Step 1: Write formatting tests**

Create `tests/unit/format.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  formatBytes,
  formatDuration,
  formatNumber,
  formatTuple,
  summarizeTypedArray,
} from '../../src/utils/format';

describe('format utilities', () => {
  it('formats bytes using binary units', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1.00 KB');
    expect(formatBytes(1024 * 1024)).toBe('1.00 MB');
  });

  it('formats duration in seconds', () => {
    expect(formatDuration(0)).toBe('0.000s');
    expect(formatDuration(1.23456)).toBe('1.235s');
  });

  it('formats finite and non-finite numbers', () => {
    expect(formatNumber(1.23456)).toBe('1.235');
    expect(formatNumber(Number.NaN)).toBe('NaN');
  });

  it('formats tuples', () => {
    expect(formatTuple([1, 2.3456, -3])).toBe('[1, 2.346, -3]');
  });

  it('summarizes typed arrays', () => {
    expect(summarizeTypedArray(new Float32Array([1, 2, 3, 4, 5]))).toBe(
      'Float32Array length=5 sample=[1, 2, 3, 4]',
    );
  });
});
```

- [ ] **Step 2: Write field tip tests**

Create `tests/unit/fieldTips.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getFieldTip } from '../../src/domain/tips/fieldTips';

describe('field tips', () => {
  it('returns exact tips', () => {
    expect(getFieldTip('clip.duration')).toContain('playback');
  });

  it('returns prefix tips', () => {
    expect(getFieldTip('texture.wrapS')).toContain('UVs');
  });

  it('returns pattern tips', () => {
    expect(getFieldTip('animation.tracks.0.times.length')).toContain('keyframe');
  });

  it('returns undefined when no tip exists', () => {
    expect(getFieldTip('unknown.field')).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run tests and verify failure**

Run:

```powershell
npm test -- tests/unit/format.test.ts tests/unit/fieldTips.test.ts
```

Expected: FAIL because `src/utils/format.ts` and `src/domain/tips/fieldTips.ts` do not exist.

- [ ] **Step 4: Create shared domain types**

Create `src/domain/types.ts`:

```ts
import type * as THREE from 'three';

export type FieldSeverity = 'info' | 'warning';

export type InspectorField = {
  path: string;
  label?: string;
  value: unknown;
  displayValue: string;
  source: string;
  tip?: string;
  severity?: FieldSeverity;
  copyValue?: string;
};

export type InspectorSection = {
  id: string;
  title: string;
  fields: InspectorField[];
};

export type SceneNodeInfo = {
  id: string;
  name: string;
  type: string;
  depth: number;
  object: THREE.Object3D;
  children: SceneNodeInfo[];
};

export type LoadedFbx = {
  file: File;
  root: THREE.Group;
  animations: THREE.AnimationClip[];
  loadMs: number;
  warnings: string[];
};

export type OverviewStats = {
  fileName: string;
  fileSize: number;
  loadMs: number;
  objectCount: number;
  meshCount: number;
  skinnedMeshCount: number;
  materialCount: number;
  textureCount: number;
  animationClipCount: number;
  boneCount: number;
  vertexCount: number;
  triangleCount: number;
  warningCount: number;
};

export type DiagnosticsWarning = {
  id: string;
  message: string;
  path?: string;
};
```

- [ ] **Step 5: Implement formatting utilities**

Create `src/utils/format.ts`:

```ts
export function formatNumber(value: number, digits = 3): string {
  if (Number.isNaN(value)) return 'NaN';
  if (!Number.isFinite(value)) return value > 0 ? 'Infinity' : '-Infinity';
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(digits).replace(/\.?0+$/, '');
}

export function formatTuple(values: Iterable<number>, digits = 3): string {
  return `[${Array.from(values, (value) => formatNumber(value, digits)).join(', ')}]`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return index === 0 ? `${value} ${units[index]}` : `${value.toFixed(2)} ${units[index]}`;
}

export function formatDuration(seconds: number): string {
  return `${seconds.toFixed(3)}s`;
}

export function summarizeTypedArray(array: ArrayLike<number>, sampleSize = 4): string {
  const ctorName = array.constructor?.name ?? 'ArrayLike';
  const sample = Array.from({ length: Math.min(array.length, sampleSize) }, (_, index) =>
    formatNumber(array[index]),
  );
  return `${ctorName} length=${array.length} sample=${formatTuple(sample.map(Number))}`;
}

export function displayUnknown(value: unknown): string {
  if (typeof value === 'number') return formatNumber(value);
  if (typeof value === 'string') return value;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (ArrayBuffer.isView(value) && 'length' in value) {
    return summarizeTypedArray(value as ArrayLike<number>);
  }
  return JSON.stringify(value);
}
```

- [ ] **Step 6: Implement field tips**

Create `src/domain/tips/fieldTips.ts`:

```ts
const exactTips = new Map<string, string>([
  ['clip.name', 'Animation clip name, usually derived from an FBX take or stack.'],
  ['clip.duration', 'Total playback duration in seconds for this animation clip.'],
  ['track.name', 'Track binding path, usually target object plus animated property.'],
  ['track.ValueTypeName', 'Runtime value type used by Three.js for this keyframe track.'],
  ['track.times.length', 'Number of keyframe timestamps stored by this track.'],
  ['track.values.length', 'Flattened keyframe value count. Position and scale use 3 values per keyframe; quaternion uses 4.'],
  ['material.roughness', 'Controls how broad and matte reflected light appears on PBR materials.'],
  ['material.metalness', 'Controls whether the surface behaves like a dielectric or metal in PBR shading.'],
  ['texture.colorSpace', 'Color textures usually need sRGB; normal, roughness, and metalness maps usually do not.'],
  ['texture.flipY', 'Controls vertical texture orientation. Wrong values often make imported textures appear upside down.'],
]);

const prefixTips: Array<[string, string]> = [
  ['texture.wrap', 'Controls how UVs outside the 0-1 range sample the texture.'],
  ['texture.repeat', 'Scales UV sampling for this texture.'],
  ['texture.offset', 'Offsets UV sampling for this texture.'],
  ['geometry.attributes.position', 'Vertex position buffer. Its count is the geometry vertex count.'],
  ['geometry.attributes.normal', 'Vertex normal buffer used for lighting. Missing normals can produce flat or incorrect shading.'],
  ['geometry.attributes.uv', 'Primary UV buffer used by most texture slots.'],
  ['geometry.attributes.skinIndex', 'Skinning bone index buffer used by SkinnedMesh animation.'],
  ['geometry.attributes.skinWeight', 'Skinning weight buffer used by SkinnedMesh animation.'],
  ['object.matrix', 'Local transform matrix derived from position, rotation, and scale.'],
  ['object.matrixWorld', 'World transform matrix after parent transforms are applied.'],
];

const patternTips: Array<[RegExp, string]> = [
  [/^animation\.tracks\.\d+\.times\.length$/, 'Number of keyframe timestamps for this animation track.'],
  [/^animation\.tracks\.\d+\.values\.length$/, 'Flattened animated values for this track. Compare with keyframe count and value type.'],
];

export function getFieldTip(path: string): string | undefined {
  const exact = exactTips.get(path);
  if (exact) return exact;

  const prefix = prefixTips.find(([candidate]) => path.startsWith(candidate));
  if (prefix) return prefix[1];

  const pattern = patternTips.find(([candidate]) => candidate.test(path));
  return pattern?.[1];
}
```

- [ ] **Step 7: Run tests and verify pass**

Run:

```powershell
npm test -- tests/unit/format.test.ts tests/unit/fieldTips.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit if Git exists**

Run:

```powershell
git rev-parse --is-inside-work-tree
```

If output is `true`, run:

```powershell
git add src/domain src/utils tests/unit/format.test.ts tests/unit/fieldTips.test.ts
git commit -m "feat: add inspector domain primitives"
```

---

## Task 3: Implement Overview, Scene, Mesh, Skeleton, Material, And Texture Extractors

**Files:**
- Create: `src/domain/extractors/overviewExtractor.ts`
- Create: `src/domain/extractors/sceneExtractor.ts`
- Create: `src/domain/extractors/meshExtractor.ts`
- Create: `src/domain/extractors/materialExtractor.ts`
- Create: `src/domain/extractors/textureExtractor.ts`
- Create: `src/domain/extractors/skeletonExtractor.ts`
- Test: `tests/unit/overviewExtractor.test.ts`
- Test: `tests/unit/meshExtractor.test.ts`
- Test: `tests/unit/materialTextureExtractors.test.ts`
- Test: `tests/unit/sceneSkeletonExtractors.test.ts`

- [ ] **Step 1: Write extractor tests**

Create `tests/unit/overviewExtractor.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { extractOverview } from '../../src/domain/extractors/overviewExtractor';

describe('extractOverview', () => {
  it('counts scene contents and geometry totals', () => {
    const root = new THREE.Group();
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
    geometry.setIndex([0, 1, 2]);
    const material = new THREE.MeshStandardMaterial({ name: 'Body' });
    const mesh = new THREE.Mesh(geometry, material);
    root.add(mesh);

    const sections = extractOverview({
      fileName: 'model.fbx',
      fileSize: 2048,
      loadMs: 12,
      root,
      animations: [new THREE.AnimationClip('Idle', 1, [])],
      warnings: ['example'],
    });

    const fields = sections.flatMap((section) => section.fields);
    expect(fields.find((field) => field.path === 'overview.meshCount')?.value).toBe(1);
    expect(fields.find((field) => field.path === 'overview.vertexCount')?.value).toBe(3);
    expect(fields.find((field) => field.path === 'overview.triangleCount')?.value).toBe(1);
    expect(fields.find((field) => field.path === 'overview.animationClipCount')?.value).toBe(1);
  });
});
```

Create `tests/unit/meshExtractor.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { extractMeshSections } from '../../src/domain/extractors/meshExtractor';

describe('extractMeshSections', () => {
  it('extracts geometry attributes and triangle counts', () => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(12), 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(8), 2));
    geometry.setIndex([0, 1, 2, 0, 2, 3]);
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());

    const fields = extractMeshSections(mesh).flatMap((section) => section.fields);
    expect(fields.find((field) => field.path === 'geometry.attributes.position.count')?.value).toBe(4);
    expect(fields.find((field) => field.path === 'geometry.index.count')?.value).toBe(6);
    expect(fields.find((field) => field.path === 'geometry.triangleCount')?.value).toBe(2);
  });
});
```

Create `tests/unit/materialTextureExtractors.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { extractMaterialSections } from '../../src/domain/extractors/materialExtractor';
import { extractTextureSections } from '../../src/domain/extractors/textureExtractor';

describe('material and texture extractors', () => {
  it('extracts material fields and texture slots', () => {
    const texture = new THREE.Texture({ width: 128, height: 64 });
    texture.name = 'Diffuse';
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshStandardMaterial({
      name: 'BodyMat',
      roughness: 0.7,
      metalness: 0.2,
      map: texture,
    });

    const materialFields = extractMaterialSections(material).flatMap((section) => section.fields);
    expect(materialFields.find((field) => field.path === 'material.name')?.value).toBe('BodyMat');
    expect(materialFields.find((field) => field.path === 'material.roughness')?.value).toBe(0.7);
    expect(materialFields.find((field) => field.path === 'material.map')?.displayValue).toContain('Diffuse');

    const textureFields = extractTextureSections(texture).flatMap((section) => section.fields);
    expect(textureFields.find((field) => field.path === 'texture.image.width')?.value).toBe(128);
    expect(textureFields.find((field) => field.path === 'texture.image.height')?.value).toBe(64);
    expect(textureFields.find((field) => field.path === 'texture.colorSpace')?.value).toBe(THREE.SRGBColorSpace);
  });
});
```

Create `tests/unit/sceneSkeletonExtractors.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { extractSceneNodes, extractNodeSections } from '../../src/domain/extractors/sceneExtractor';
import { extractSkeletonSections } from '../../src/domain/extractors/skeletonExtractor';

describe('scene and skeleton extractors', () => {
  it('builds a scene node tree and node fields', () => {
    const root = new THREE.Group();
    root.name = 'Root';
    const child = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    child.name = 'Cube';
    root.add(child);

    const nodes = extractSceneNodes(root);
    expect(nodes[0].name).toBe('Root');
    expect(nodes[0].children[0].name).toBe('Cube');

    const fields = extractNodeSections(child).flatMap((section) => section.fields);
    expect(fields.find((field) => field.path === 'object.name')?.value).toBe('Cube');
    expect(fields.find((field) => field.path === 'object.type')?.value).toBe('Mesh');
  });

  it('extracts skeleton fields from a SkinnedMesh', () => {
    const bone = new THREE.Bone();
    bone.name = 'Hips';
    const skeleton = new THREE.Skeleton([bone]);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
    geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute([0, 0, 0, 0], 4));
    geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute([1, 0, 0, 0], 4));
    const mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshBasicMaterial());
    mesh.add(bone);
    mesh.bind(skeleton);

    const fields = extractSkeletonSections(mesh).flatMap((section) => section.fields);
    expect(fields.find((field) => field.path === 'skeleton.bones.length')?.value).toBe(1);
    expect(fields.find((field) => field.path === 'geometry.attributes.skinIndex.present')?.value).toBe(true);
    expect(fields.find((field) => field.path === 'geometry.attributes.skinWeight.present')?.value).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
npm test -- tests/unit/overviewExtractor.test.ts tests/unit/meshExtractor.test.ts tests/unit/materialTextureExtractors.test.ts tests/unit/sceneSkeletonExtractors.test.ts
```

Expected: FAIL because extractor modules do not exist.

- [ ] **Step 3: Implement extractor helpers and modules**

Create `src/domain/extractors/sceneExtractor.ts`:

```ts
import type * as THREE from 'three';
import type { InspectorField, InspectorSection, SceneNodeInfo } from '../types';
import { getFieldTip } from '../tips/fieldTips';
import { formatTuple } from '../../utils/format';

function field(path: string, value: unknown, displayValue = String(value), source = 'THREE.Object3D'): InspectorField {
  return { path, value, displayValue, source, tip: getFieldTip(path), copyValue: displayValue };
}

export function extractSceneNodes(root: THREE.Object3D): SceneNodeInfo[] {
  const visit = (object: THREE.Object3D, depth: number): SceneNodeInfo => ({
    id: object.uuid,
    name: object.name || object.type,
    type: object.type,
    depth,
    object,
    children: object.children.map((child) => visit(child, depth + 1)),
  });
  return [visit(root, 0)];
}

export function extractNodeSections(object: THREE.Object3D): InspectorSection[] {
  return [
    {
      id: 'node',
      title: 'Node',
      fields: [
        field('object.name', object.name, object.name || '(unnamed)'),
        field('object.uuid', object.uuid),
        field('object.type', object.type),
        field('object.visible', object.visible),
        field('object.position', object.position.toArray(), formatTuple(object.position.toArray())),
        field('object.rotation', object.rotation.toArray().slice(0, 3), formatTuple(object.rotation.toArray().slice(0, 3))),
        field('object.quaternion', object.quaternion.toArray(), formatTuple(object.quaternion.toArray())),
        field('object.scale', object.scale.toArray(), formatTuple(object.scale.toArray())),
        field('object.parent', object.parent?.name || object.parent?.uuid || null, object.parent?.name || object.parent?.uuid || 'null'),
        field('object.children.length', object.children.length),
      ],
    },
  ];
}
```

Create `src/domain/extractors/meshExtractor.ts`:

```ts
import type * as THREE from 'three';
import type { InspectorField, InspectorSection } from '../types';
import { getFieldTip } from '../tips/fieldTips';
import { formatTuple } from '../../utils/format';

function field(path: string, value: unknown, displayValue = String(value), source = 'THREE.BufferGeometry'): InspectorField {
  return { path, value, displayValue, source, tip: getFieldTip(path), copyValue: displayValue };
}

function attributeField(name: string, attribute?: THREE.BufferAttribute | THREE.InterleavedBufferAttribute): InspectorField {
  if (!attribute) {
    return field(`geometry.attributes.${name}.present`, false, 'false');
  }
  return field(
    `geometry.attributes.${name}.count`,
    attribute.count,
    `${attribute.count} items, itemSize=${attribute.itemSize}`,
  );
}

export function getTriangleCount(geometry: THREE.BufferGeometry): number {
  if (geometry.index) return geometry.index.count / 3;
  const position = geometry.getAttribute('position');
  return position ? position.count / 3 : 0;
}

export function extractMeshSections(mesh: THREE.Mesh): InspectorSection[] {
  const geometry = mesh.geometry;
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return [
    {
      id: 'mesh',
      title: 'Mesh',
      fields: [
        field('mesh.name', mesh.name, mesh.name || '(unnamed)', 'THREE.Mesh'),
        field('mesh.uuid', mesh.uuid, mesh.uuid, 'THREE.Mesh'),
        field('mesh.type', mesh.type, mesh.type, 'THREE.Mesh'),
      ],
    },
    {
      id: 'geometry',
      title: 'Geometry',
      fields: [
        field('geometry.uuid', geometry.uuid),
        attributeField('position', geometry.getAttribute('position')),
        attributeField('normal', geometry.getAttribute('normal')),
        attributeField('uv', geometry.getAttribute('uv')),
        attributeField('uv2', geometry.getAttribute('uv2')),
        attributeField('color', geometry.getAttribute('color')),
        attributeField('skinIndex', geometry.getAttribute('skinIndex')),
        attributeField('skinWeight', geometry.getAttribute('skinWeight')),
        field('geometry.index.count', geometry.index?.count ?? 0),
        field('geometry.triangleCount', getTriangleCount(geometry)),
        field('geometry.groups.length', geometry.groups.length),
        field('geometry.boundingBox.min', geometry.boundingBox?.min.toArray() ?? null, geometry.boundingBox ? formatTuple(geometry.boundingBox.min.toArray()) : 'null'),
        field('geometry.boundingBox.max', geometry.boundingBox?.max.toArray() ?? null, geometry.boundingBox ? formatTuple(geometry.boundingBox.max.toArray()) : 'null'),
        field('geometry.boundingSphere.radius', geometry.boundingSphere?.radius ?? null, String(geometry.boundingSphere?.radius ?? 'null')),
      ],
    },
  ];
}
```

Create `src/domain/extractors/textureExtractor.ts`:

```ts
import type * as THREE from 'three';
import type { InspectorField, InspectorSection } from '../types';
import { getFieldTip } from '../tips/fieldTips';
import { formatTuple } from '../../utils/format';

function field(path: string, value: unknown, displayValue = String(value), source = 'THREE.Texture'): InspectorField {
  return { path, value, displayValue, source, tip: getFieldTip(path), copyValue: displayValue };
}

function imageDimension(texture: THREE.Texture, key: 'width' | 'height'): number | null {
  const image = texture.image as { width?: number; height?: number } | undefined;
  return typeof image?.[key] === 'number' ? image[key] : null;
}

export function extractTextureSections(texture: THREE.Texture): InspectorSection[] {
  return [
    {
      id: 'texture',
      title: texture.name || 'Texture',
      fields: [
        field('texture.name', texture.name, texture.name || '(unnamed)'),
        field('texture.uuid', texture.uuid),
        field('texture.image.width', imageDimension(texture, 'width'), String(imageDimension(texture, 'width'))),
        field('texture.image.height', imageDimension(texture, 'height'), String(imageDimension(texture, 'height'))),
        field('texture.mapping', texture.mapping),
        field('texture.channel', texture.channel),
        field('texture.wrapS', texture.wrapS),
        field('texture.wrapT', texture.wrapT),
        field('texture.magFilter', texture.magFilter),
        field('texture.minFilter', texture.minFilter),
        field('texture.anisotropy', texture.anisotropy),
        field('texture.format', texture.format),
        field('texture.type', texture.type),
        field('texture.colorSpace', texture.colorSpace),
        field('texture.offset', texture.offset.toArray(), formatTuple(texture.offset.toArray())),
        field('texture.repeat', texture.repeat.toArray(), formatTuple(texture.repeat.toArray())),
        field('texture.center', texture.center.toArray(), formatTuple(texture.center.toArray())),
        field('texture.rotation', texture.rotation),
        field('texture.flipY', texture.flipY),
        field('texture.generateMipmaps', texture.generateMipmaps),
      ],
    },
  ];
}
```

Create `src/domain/extractors/materialExtractor.ts`:

```ts
import type * as THREE from 'three';
import type { InspectorField, InspectorSection } from '../types';
import { getFieldTip } from '../tips/fieldTips';

const textureSlots = [
  'map',
  'normalMap',
  'roughnessMap',
  'metalnessMap',
  'emissiveMap',
  'aoMap',
  'alphaMap',
  'bumpMap',
  'displacementMap',
  'lightMap',
] as const;

function field(path: string, value: unknown, displayValue = String(value), source = 'THREE.Material'): InspectorField {
  return { path, value, displayValue, source, tip: getFieldTip(path), copyValue: displayValue };
}

function textureDisplay(texture: THREE.Texture | null | undefined): string {
  if (!texture) return 'null';
  return `Texture ${texture.name || texture.uuid}`;
}

export function extractMaterialSections(material: THREE.Material): InspectorSection[] {
  const record = material as THREE.MeshStandardMaterial & Record<string, unknown>;
  return [
    {
      id: 'material',
      title: material.name || material.type,
      fields: [
        field('material.name', material.name, material.name || '(unnamed)'),
        field('material.uuid', material.uuid),
        field('material.type', material.type),
        field('material.opacity', material.opacity),
        field('material.transparent', material.transparent),
        field('material.alphaTest', material.alphaTest),
        field('material.side', material.side),
        field('material.depthTest', material.depthTest),
        field('material.depthWrite', material.depthWrite),
        field('material.blending', material.blending),
        field('material.roughness', record.roughness ?? null, String(record.roughness ?? 'n/a')),
        field('material.metalness', record.metalness ?? null, String(record.metalness ?? 'n/a')),
        field('material.envMapIntensity', record.envMapIntensity ?? null, String(record.envMapIntensity ?? 'n/a')),
        field('material.wireframe', record.wireframe ?? null, String(record.wireframe ?? 'n/a')),
      ],
    },
    {
      id: 'texture-slots',
      title: 'Texture Slots',
      fields: textureSlots.map((slot) => {
        const texture = record[slot] as THREE.Texture | null | undefined;
        return field(`material.${slot}`, texture ? texture.uuid : null, textureDisplay(texture));
      }),
    },
  ];
}
```

Create `src/domain/extractors/skeletonExtractor.ts`:

```ts
import type * as THREE from 'three';
import type { InspectorField, InspectorSection } from '../types';

function field(path: string, value: unknown, displayValue = String(value), source = 'THREE.Skeleton'): InspectorField {
  return { path, value, displayValue, source, copyValue: displayValue };
}

export function extractSkeletonSections(object: THREE.Object3D): InspectorSection[] {
  const skinnedMesh = object as THREE.SkinnedMesh;
  const skeleton = skinnedMesh.isSkinnedMesh ? skinnedMesh.skeleton : null;
  const geometry = skinnedMesh.isSkinnedMesh ? skinnedMesh.geometry : null;

  return [
    {
      id: 'skeleton',
      title: 'Skeleton',
      fields: [
        field('skinnedMesh.isSkinnedMesh', Boolean(skinnedMesh.isSkinnedMesh)),
        field('skeleton.bones.length', skeleton?.bones.length ?? 0),
        field('skeleton.boneInverses.length', skeleton?.boneInverses.length ?? 0),
        field('skeleton.bones.names', skeleton?.bones.map((bone) => bone.name || bone.uuid) ?? [], (skeleton?.bones.map((bone) => bone.name || bone.uuid) ?? []).join(', ')),
        field('geometry.attributes.skinIndex.present', Boolean(geometry?.getAttribute('skinIndex'))),
        field('geometry.attributes.skinWeight.present', Boolean(geometry?.getAttribute('skinWeight'))),
      ],
    },
  ];
}
```

Create `src/domain/extractors/overviewExtractor.ts`:

```ts
import * as THREE from 'three';
import type { InspectorField, InspectorSection } from '../types';
import { formatBytes, formatDuration, formatTuple } from '../../utils/format';
import { getTriangleCount } from './meshExtractor';

type OverviewInput = {
  fileName: string;
  fileSize: number;
  loadMs: number;
  root: THREE.Object3D;
  animations: THREE.AnimationClip[];
  warnings: string[];
};

function field(path: string, value: unknown, displayValue = String(value), source = 'Overview'): InspectorField {
  return { path, value, displayValue, source, copyValue: displayValue };
}

export function extractOverview(input: OverviewInput): InspectorSection[] {
  let objectCount = 0;
  let meshCount = 0;
  let skinnedMeshCount = 0;
  let vertexCount = 0;
  let triangleCount = 0;
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  let boneCount = 0;

  input.root.traverse((object) => {
    objectCount += 1;
    if ((object as THREE.Bone).isBone) boneCount += 1;
    if ((object as THREE.Mesh).isMesh) {
      const mesh = object as THREE.Mesh;
      meshCount += 1;
      if ((mesh as THREE.SkinnedMesh).isSkinnedMesh) skinnedMeshCount += 1;
      const position = mesh.geometry.getAttribute('position');
      vertexCount += position?.count ?? 0;
      triangleCount += getTriangleCount(mesh.geometry);
      const materialList = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materialList.forEach((material) => {
        materials.add(material);
        Object.values(material as unknown as Record<string, unknown>).forEach((value) => {
          if (value instanceof THREE.Texture) textures.add(value);
        });
      });
    }
  });

  const box = new THREE.Box3().setFromObject(input.root);
  const size = new THREE.Vector3();
  box.getSize(size);

  return [
    {
      id: 'overview',
      title: 'Overview',
      fields: [
        field('overview.fileName', input.fileName),
        field('overview.fileSize', input.fileSize, formatBytes(input.fileSize)),
        field('overview.loadMs', input.loadMs, formatDuration(input.loadMs / 1000)),
        field('overview.objectCount', objectCount),
        field('overview.meshCount', meshCount),
        field('overview.skinnedMeshCount', skinnedMeshCount),
        field('overview.materialCount', materials.size),
        field('overview.textureCount', textures.size),
        field('overview.animationClipCount', input.animations.length),
        field('overview.boneCount', boneCount),
        field('overview.vertexCount', vertexCount),
        field('overview.triangleCount', triangleCount),
        field('overview.sceneDimensions', size.toArray(), formatTuple(size.toArray())),
        field('overview.warningCount', input.warnings.length),
      ],
    },
  ];
}
```

- [ ] **Step 4: Run extractor tests**

Run:

```powershell
npm test -- tests/unit/overviewExtractor.test.ts tests/unit/meshExtractor.test.ts tests/unit/materialTextureExtractors.test.ts tests/unit/sceneSkeletonExtractors.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit if Git exists**

Run:

```powershell
git rev-parse --is-inside-work-tree
```

If output is `true`, run:

```powershell
git add src/domain/extractors tests/unit/*Extractor*.test.ts tests/unit/materialTextureExtractors.test.ts tests/unit/sceneSkeletonExtractors.test.ts
git commit -m "feat: extract fbx runtime inspector data"
```

---

## Task 4: Implement Animation Extractor And Raw Serializer

**Files:**
- Create: `src/domain/extractors/animationExtractor.ts`
- Create: `src/utils/threeObjectSerialize.ts`
- Test: `tests/unit/animationExtractor.test.ts`
- Test: `tests/unit/rawSerializer.test.ts`

- [ ] **Step 1: Write tests**

Create `tests/unit/animationExtractor.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { extractAnimationSections } from '../../src/domain/extractors/animationExtractor';

describe('extractAnimationSections', () => {
  it('extracts clip and track diagnostics', () => {
    const track = new THREE.VectorKeyframeTrack('Hips.position', [0, 1], [0, 0, 0, 1, 2, 3]);
    const clip = new THREE.AnimationClip('Run', 1, [track]);

    const fields = extractAnimationSections([clip]).flatMap((section) => section.fields);
    expect(fields.find((field) => field.path === 'clip.name')?.value).toBe('Run');
    expect(fields.find((field) => field.path === 'clip.duration')?.value).toBe(1);
    expect(fields.find((field) => field.path === 'clip.tracks.length')?.value).toBe(1);
    expect(fields.find((field) => field.path === 'animation.tracks.0.boundObject')?.value).toBe('Hips');
    expect(fields.find((field) => field.path === 'animation.tracks.0.boundProperty')?.value).toBe('position');
  });
});
```

Create `tests/unit/rawSerializer.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { serializeThreeObject } from '../../src/utils/threeObjectSerialize';

describe('serializeThreeObject', () => {
  it('handles cycles and typed arrays safely', () => {
    const value: Record<string, unknown> = {
      name: 'Root',
      data: new Float32Array([1, 2, 3, 4, 5]),
    };
    value.self = value;

    const result = serializeThreeObject(value, { maxDepth: 3 });
    expect(result).toMatchObject({
      name: 'Root',
      data: 'Float32Array length=5 sample=[1, 2, 3, 4]',
      self: '[Circular]',
    });
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
npm test -- tests/unit/animationExtractor.test.ts tests/unit/rawSerializer.test.ts
```

Expected: FAIL because modules do not exist.

- [ ] **Step 3: Implement animation extractor**

Create `src/domain/extractors/animationExtractor.ts`:

```ts
import type * as THREE from 'three';
import type { InspectorField, InspectorSection } from '../types';
import { getFieldTip } from '../tips/fieldTips';
import { formatDuration } from '../../utils/format';

function field(path: string, value: unknown, displayValue = String(value), source = 'THREE.AnimationClip'): InspectorField {
  return { path, value, displayValue, source, tip: getFieldTip(path), copyValue: displayValue };
}

function parseTrackName(name: string): { objectName: string; propertyName: string } {
  const lastDot = name.lastIndexOf('.');
  if (lastDot === -1) return { objectName: name, propertyName: 'unknown' };
  return {
    objectName: name.slice(0, lastDot),
    propertyName: name.slice(lastDot + 1),
  };
}

export function extractAnimationSections(clips: THREE.AnimationClip[]): InspectorSection[] {
  if (clips.length === 0) {
    return [
      {
        id: 'animation-empty',
        title: 'Animation',
        fields: [field('clip.count', 0, '0')],
      },
    ];
  }

  return clips.flatMap((clip, clipIndex) => {
    const totalKeyframes = clip.tracks.reduce((sum, track) => sum + track.times.length, 0);
    const involvedNodes = new Set(clip.tracks.map((track) => parseTrackName(track.name).objectName));
    const propertyTypes = new Set(clip.tracks.map((track) => parseTrackName(track.name).propertyName));

    const clipSection: InspectorSection = {
      id: `clip-${clipIndex}`,
      title: `Clip: ${clip.name || clipIndex}`,
      fields: [
        field('clip.name', clip.name),
        field('clip.duration', clip.duration, formatDuration(clip.duration)),
        field('clip.tracks.length', clip.tracks.length),
        field('clip.totalKeyframes', totalKeyframes),
        field('clip.involvedNodeCount', involvedNodes.size),
        field('clip.propertyTypes', Array.from(propertyTypes), Array.from(propertyTypes).join(', ')),
      ],
    };

    const trackFields = clip.tracks.flatMap((track, trackIndex) => {
      const parsed = parseTrackName(track.name);
      return [
        field(`animation.tracks.${trackIndex}.name`, track.name),
        field(`animation.tracks.${trackIndex}.ValueTypeName`, track.ValueTypeName),
        field(`animation.tracks.${trackIndex}.times.length`, track.times.length),
        field(`animation.tracks.${trackIndex}.values.length`, track.values.length),
        field(`animation.tracks.${trackIndex}.startTime`, track.times[0] ?? null, String(track.times[0] ?? 'null')),
        field(`animation.tracks.${trackIndex}.endTime`, track.times[track.times.length - 1] ?? null, String(track.times[track.times.length - 1] ?? 'null')),
        field(`animation.tracks.${trackIndex}.boundObject`, parsed.objectName),
        field(`animation.tracks.${trackIndex}.boundProperty`, parsed.propertyName),
      ];
    });

    return [
      clipSection,
      {
        id: `clip-${clipIndex}-tracks`,
        title: `Tracks: ${clip.name || clipIndex}`,
        fields: trackFields,
      },
    ];
  });
}
```

- [ ] **Step 4: Implement raw serializer**

Create `src/utils/threeObjectSerialize.ts`:

```ts
import { summarizeTypedArray } from './format';

type SerializeOptions = {
  maxDepth?: number;
  maxArrayItems?: number;
};

export function serializeThreeObject(
  value: unknown,
  options: SerializeOptions = {},
  seen = new WeakSet<object>(),
  depth = 0,
): unknown {
  const maxDepth = options.maxDepth ?? 4;
  const maxArrayItems = options.maxArrayItems ?? 20;

  if (value === null || value === undefined) return value;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'function') return '[Function]';
  if (ArrayBuffer.isView(value) && 'length' in value) return summarizeTypedArray(value as ArrayLike<number>);

  if (typeof value !== 'object') return String(value);
  if (seen.has(value)) return '[Circular]';
  if (depth >= maxDepth) return '[MaxDepth]';

  seen.add(value);

  if (Array.isArray(value)) {
    return value
      .slice(0, maxArrayItems)
      .map((item) => serializeThreeObject(item, options, seen, depth + 1));
  }

  const source = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(source)) {
    if (key.startsWith('_listeners')) continue;
    if (entry instanceof HTMLElement) {
      output[key] = '[HTMLElement]';
      continue;
    }
    output[key] = serializeThreeObject(entry, options, seen, depth + 1);
  }

  return output;
}
```

- [ ] **Step 5: Run tests and verify pass**

Run:

```powershell
npm test -- tests/unit/animationExtractor.test.ts tests/unit/rawSerializer.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit if Git exists**

Run:

```powershell
git rev-parse --is-inside-work-tree
```

If output is `true`, run:

```powershell
git add src/domain/extractors/animationExtractor.ts src/utils/threeObjectSerialize.ts tests/unit/animationExtractor.test.ts tests/unit/rawSerializer.test.ts
git commit -m "feat: extract animation and raw object data"
```

---

## Task 5: Build Inspector, Scene Tree, Upload, And Timeline Components With Tests

**Files:**
- Create: `src/components/inspector/FieldTable.vue`
- Create: `src/components/inspector/InspectorPanel.vue`
- Create: `src/components/inspector/RawObjectTree.vue`
- Create: `src/components/scene/SceneTree.vue`
- Create: `src/components/upload/FileDropZone.vue`
- Create: `src/components/viewport/TimelineControls.vue`
- Test: `tests/component/FieldTable.test.ts`
- Test: `tests/component/InspectorPanel.test.ts`
- Test: `tests/component/SceneTree.test.ts`
- Test: `tests/component/TimelineControls.test.ts`

- [ ] **Step 1: Write component tests**

Create `tests/component/FieldTable.test.ts`:

```ts
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import FieldTable from '../../src/components/inspector/FieldTable.vue';

describe('FieldTable', () => {
  it('renders field paths, values, source, and tips', () => {
    const wrapper = mount(FieldTable, {
      props: {
        fields: [
          {
            path: 'clip.duration',
            value: 1.2,
            displayValue: '1.200s',
            source: 'THREE.AnimationClip',
            tip: 'Total playback duration.',
          },
        ],
      },
    });

    expect(wrapper.text()).toContain('clip.duration');
    expect(wrapper.text()).toContain('1.200s');
    expect(wrapper.text()).toContain('THREE.AnimationClip');
    expect(wrapper.attributes('title')).toBeUndefined();
    expect(wrapper.find('[data-tip]').attributes('data-tip')).toBe('Total playback duration.');
  });
});
```

Create `tests/component/InspectorPanel.test.ts`:

```ts
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import InspectorPanel from '../../src/components/inspector/InspectorPanel.vue';

describe('InspectorPanel', () => {
  it('switches sections by tab', async () => {
    const wrapper = mount(InspectorPanel, {
      props: {
        tabs: [
          { id: 'overview', label: 'Overview', sections: [{ id: 'a', title: 'A', fields: [] }] },
          { id: 'animation', label: 'Animation', sections: [{ id: 'b', title: 'B', fields: [] }] },
        ],
      },
    });

    expect(wrapper.text()).toContain('A');
    await wrapper.get('button[data-tab="animation"]').trigger('click');
    expect(wrapper.text()).toContain('B');
  });
});
```

Create `tests/component/SceneTree.test.ts`:

```ts
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import SceneTree from '../../src/components/scene/SceneTree.vue';

describe('SceneTree', () => {
  it('emits selected object', async () => {
    const object = new THREE.Object3D();
    object.name = 'Cube';
    const wrapper = mount(SceneTree, {
      props: {
        nodes: [{ id: object.uuid, name: 'Cube', type: 'Mesh', depth: 0, object, children: [] }],
        selectedId: '',
      },
    });

    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('select')?.[0]).toEqual([object]);
  });
});
```

Create `tests/component/TimelineControls.test.ts`:

```ts
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TimelineControls from '../../src/components/viewport/TimelineControls.vue';

describe('TimelineControls', () => {
  it('emits playback controls', async () => {
    const wrapper = mount(TimelineControls, {
      props: {
        clips: ['Idle'],
        currentClip: 'Idle',
        isPlaying: false,
        currentTime: 0,
        duration: 1,
        speed: 1,
        loop: true,
        trackCount: 2,
        keyframeCount: 4,
        nodeCount: 1,
      },
    });

    await wrapper.get('button[data-action="play"]').trigger('click');
    expect(wrapper.emitted('play')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
npm test -- tests/component/FieldTable.test.ts tests/component/InspectorPanel.test.ts tests/component/SceneTree.test.ts tests/component/TimelineControls.test.ts
```

Expected: FAIL because components do not exist.

- [ ] **Step 3: Implement components**

Create `src/components/inspector/FieldTable.vue`:

```vue
<script setup lang="ts">
import type { InspectorField } from '../../domain/types';

defineProps<{
  fields: InspectorField[];
}>();
</script>

<template>
  <table class="field-table">
    <thead>
      <tr>
        <th>Field</th>
        <th>Value</th>
        <th>Source</th>
        <th>Tip</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="field in fields" :key="field.path" :class="field.severity">
        <td><code>{{ field.path }}</code></td>
        <td>{{ field.displayValue }}</td>
        <td>{{ field.source }}</td>
        <td>
          <span v-if="field.tip" data-tip>{{ field.tip }}</span>
        </td>
      </tr>
    </tbody>
  </table>
</template>
```

Create `src/components/inspector/InspectorPanel.vue`:

```vue
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { InspectorSection } from '../../domain/types';
import FieldTable from './FieldTable.vue';

type InspectorTab = {
  id: string;
  label: string;
  sections: InspectorSection[];
};

const props = defineProps<{
  tabs: InspectorTab[];
}>();

const activeTab = ref(props.tabs[0]?.id ?? '');

watch(
  () => props.tabs,
  (tabs) => {
    if (!tabs.some((tab) => tab.id === activeTab.value)) {
      activeTab.value = tabs[0]?.id ?? '';
    }
  },
);

const current = computed(() => props.tabs.find((tab) => tab.id === activeTab.value) ?? props.tabs[0]);
</script>

<template>
  <aside class="inspector-panel">
    <nav class="tab-row">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :data-tab="tab.id"
        :class="{ active: tab.id === activeTab }"
        type="button"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </nav>
    <section v-if="current" class="tab-body">
      <details v-for="section in current.sections" :key="section.id" open>
        <summary>{{ section.title }}</summary>
        <FieldTable :fields="section.fields" />
      </details>
    </section>
  </aside>
</template>
```

Create `src/components/inspector/RawObjectTree.vue`:

```vue
<script setup lang="ts">
defineProps<{
  value: unknown;
}>();
</script>

<template>
  <pre class="raw-tree">{{ JSON.stringify(value, null, 2) }}</pre>
</template>
```

Create `src/components/scene/SceneTree.vue`:

```vue
<script setup lang="ts">
import type * as THREE from 'three';
import type { SceneNodeInfo } from '../../domain/types';

defineProps<{
  nodes: SceneNodeInfo[];
  selectedId: string;
}>();

defineEmits<{
  select: [object: THREE.Object3D];
}>();
</script>

<template>
  <div class="scene-tree">
    <template v-for="node in nodes" :key="node.id">
      <button
        type="button"
        :class="{ selected: node.id === selectedId }"
        :style="{ paddingLeft: `${8 + node.depth * 14}px` }"
        @click="$emit('select', node.object)"
      >
        <span>{{ node.name }}</span>
        <small>{{ node.type }}</small>
      </button>
      <SceneTree
        v-if="node.children.length"
        :nodes="node.children"
        :selected-id="selectedId"
        @select="$emit('select', $event)"
      />
    </template>
  </div>
</template>
```

Create `src/components/upload/FileDropZone.vue`:

```vue
<script setup lang="ts">
const emit = defineEmits<{
  file: [file: File];
}>();

function handleFiles(files: FileList | null): void {
  const file = files?.[0];
  if (file) emit('file', file);
}
</script>

<template>
  <label
    class="drop-zone"
    @dragover.prevent
    @drop.prevent="handleFiles($event.dataTransfer?.files ?? null)"
  >
    <input type="file" accept=".fbx" @change="handleFiles(($event.target as HTMLInputElement).files)" />
    <span>Choose or drop .fbx</span>
  </label>
</template>
```

Create `src/components/viewport/TimelineControls.vue`:

```vue
<script setup lang="ts">
defineProps<{
  clips: string[];
  currentClip: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: number;
  loop: boolean;
  trackCount: number;
  keyframeCount: number;
  nodeCount: number;
}>();

defineEmits<{
  play: [];
  pause: [];
  stop: [];
  scrub: [time: number];
  speed: [speed: number];
  loop: [loop: boolean];
  clip: [clip: string];
  step: [direction: -1 | 1];
}>();
</script>

<template>
  <footer class="timeline">
    <select :value="currentClip" @change="$emit('clip', ($event.target as HTMLSelectElement).value)">
      <option v-for="clip in clips" :key="clip" :value="clip">{{ clip }}</option>
    </select>
    <button v-if="!isPlaying" data-action="play" type="button" @click="$emit('play')">Play</button>
    <button v-else data-action="pause" type="button" @click="$emit('pause')">Pause</button>
    <button type="button" @click="$emit('stop')">Stop</button>
    <button type="button" @click="$emit('step', -1)">Prev</button>
    <button type="button" @click="$emit('step', 1)">Next</button>
    <input
      type="range"
      min="0"
      :max="duration"
      step="0.001"
      :value="currentTime"
      @input="$emit('scrub', Number(($event.target as HTMLInputElement).value))"
    />
    <select :value="speed" @change="$emit('speed', Number(($event.target as HTMLSelectElement).value))">
      <option :value="0.1">0.1x</option>
      <option :value="0.5">0.5x</option>
      <option :value="1">1x</option>
      <option :value="1.5">1.5x</option>
      <option :value="2">2x</option>
    </select>
    <label><input type="checkbox" :checked="loop" @change="$emit('loop', ($event.target as HTMLInputElement).checked)" /> Loop</label>
    <span>{{ currentTime.toFixed(3) }}s / {{ duration.toFixed(3) }}s</span>
    <span>{{ trackCount }} tracks</span>
    <span>{{ keyframeCount }} keys</span>
    <span>{{ nodeCount }} nodes</span>
  </footer>
</template>
```

- [ ] **Step 4: Run component tests**

Run:

```powershell
npm test -- tests/component/FieldTable.test.ts tests/component/InspectorPanel.test.ts tests/component/SceneTree.test.ts tests/component/TimelineControls.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit if Git exists**

Run:

```powershell
git rev-parse --is-inside-work-tree
```

If output is `true`, run:

```powershell
git add src/components tests/component
git commit -m "feat: add inspector interface components"
```

---

## Task 6: Implement FBX Loader, Selection, Inspector Data, Animation Mixer, Diagnostics, And Three Scene Composables

**Files:**
- Create: `src/composables/useFbxLoader.ts`
- Create: `src/composables/useSelection.ts`
- Create: `src/composables/useInspectorData.ts`
- Create: `src/composables/useAnimationMixer.ts`
- Create: `src/composables/useThreeScene.ts`
- Create: `src/composables/useViewportDiagnostics.ts`

- [ ] **Step 1: Implement loader**

Create `src/composables/useFbxLoader.ts`:

```ts
import { ref } from 'vue';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import type { LoadedFbx } from '../domain/types';

export function useFbxLoader() {
  const loaded = ref<LoadedFbx | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadFile(file: File): Promise<void> {
    error.value = null;
    loaded.value = null;

    if (!file.name.toLowerCase().endsWith('.fbx')) {
      error.value = 'Please choose a .fbx file.';
      return;
    }

    if (file.size === 0) {
      error.value = 'The selected FBX file is empty.';
      return;
    }

    loading.value = true;
    const started = performance.now();
    const url = URL.createObjectURL(file);

    try {
      const loader = new FBXLoader();
      const root = await loader.loadAsync(url);
      loaded.value = {
        file,
        root,
        animations: root.animations ?? [],
        loadMs: performance.now() - started,
        warnings: [],
      };
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Failed to parse FBX file.';
    } finally {
      URL.revokeObjectURL(url);
      loading.value = false;
    }
  }

  return { loaded, loading, error, loadFile };
}
```

- [ ] **Step 2: Implement selection**

Create `src/composables/useSelection.ts`:

```ts
import { computed, ref } from 'vue';
import type * as THREE from 'three';

export function useSelection() {
  const selected = ref<THREE.Object3D | null>(null);
  const selectedId = computed(() => selected.value?.uuid ?? '');

  function select(object: THREE.Object3D | null): void {
    selected.value = object;
  }

  return { selected, selectedId, select };
}
```

- [ ] **Step 3: Implement inspector data composition**

Create `src/composables/useInspectorData.ts`:

```ts
import { computed, type Ref } from 'vue';
import type * as THREE from 'three';
import type { InspectorSection, LoadedFbx } from '../domain/types';
import { extractAnimationSections } from '../domain/extractors/animationExtractor';
import { extractMaterialSections } from '../domain/extractors/materialExtractor';
import { extractMeshSections } from '../domain/extractors/meshExtractor';
import { extractOverview } from '../domain/extractors/overviewExtractor';
import { extractNodeSections } from '../domain/extractors/sceneExtractor';
import { extractSkeletonSections } from '../domain/extractors/skeletonExtractor';
import { extractTextureSections } from '../domain/extractors/textureExtractor';
import { serializeThreeObject } from '../utils/threeObjectSerialize';

type InspectorTab = {
  id: string;
  label: string;
  sections: InspectorSection[];
};

function materialList(object: THREE.Object3D | null): THREE.Material[] {
  const mesh = object as THREE.Mesh | null;
  if (!mesh?.isMesh || !mesh.material) return [];
  return Array.isArray(mesh.material) ? mesh.material : [mesh.material];
}

export function useInspectorData(loaded: Ref<LoadedFbx | null>, selected: Ref<THREE.Object3D | null>) {
  return computed<InspectorTab[]>(() => {
    const current = loaded.value;
    const object = selected.value ?? current?.root ?? null;

    const tabs: InspectorTab[] = [];

    if (current) {
      tabs.push({
        id: 'overview',
        label: 'Overview',
        sections: extractOverview({
          fileName: current.file.name,
          fileSize: current.file.size,
          loadMs: current.loadMs,
          root: current.root,
          animations: current.animations,
          warnings: current.warnings,
        }),
      });
    }

    if (object) {
      tabs.push({ id: 'node', label: 'Node', sections: extractNodeSections(object) });
    }

    if ((object as THREE.Mesh | null)?.isMesh) {
      const mesh = object as THREE.Mesh;
      tabs.push({ id: 'mesh', label: 'Mesh', sections: extractMeshSections(mesh) });
      tabs.push({
        id: 'materials',
        label: 'Materials',
        sections: materialList(mesh).flatMap(extractMaterialSections),
      });
      tabs.push({
        id: 'textures',
        label: 'Textures',
        sections: materialList(mesh).flatMap((material) =>
          Object.values(material as unknown as Record<string, unknown>)
            .filter((value): value is THREE.Texture => Boolean((value as THREE.Texture | null)?.isTexture))
            .flatMap(extractTextureSections),
        ),
      });
      tabs.push({ id: 'skeleton', label: 'Skeleton', sections: extractSkeletonSections(mesh) });
    }

    if (current) {
      tabs.push({ id: 'animation', label: 'Animation', sections: extractAnimationSections(current.animations) });
    }

    if (object) {
      tabs.push({
        id: 'raw',
        label: 'Raw',
        sections: [
          {
            id: 'raw-summary',
            title: 'Raw Object',
            fields: [
              {
                path: 'raw',
                value: serializeThreeObject(object),
                displayValue: JSON.stringify(serializeThreeObject(object), null, 2),
                source: object.type,
              },
            ],
          },
        ],
      });
    }

    return tabs;
  });
}
```

- [ ] **Step 4: Implement animation mixer**

Create `src/composables/useAnimationMixer.ts`:

```ts
import { computed, ref, type Ref, watch } from 'vue';
import * as THREE from 'three';

export function useAnimationMixer(root: Ref<THREE.Object3D | null>, clips: Ref<THREE.AnimationClip[]>) {
  const mixer = ref<THREE.AnimationMixer | null>(null);
  const action = ref<THREE.AnimationAction | null>(null);
  const currentClipName = ref('');
  const isPlaying = ref(false);
  const currentTime = ref(0);
  const speed = ref(1);
  const loop = ref(true);

  const currentClip = computed(() => clips.value.find((clip) => clip.name === currentClipName.value) ?? clips.value[0] ?? null);
  const duration = computed(() => currentClip.value?.duration ?? 0);

  function bindClip(): void {
    action.value?.stop();
    action.value = null;
    if (!root.value || !currentClip.value) return;
    mixer.value = new THREE.AnimationMixer(root.value);
    action.value = mixer.value.clipAction(currentClip.value);
    action.value.setLoop(loop.value ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
    action.value.clampWhenFinished = true;
    action.value.timeScale = speed.value;
    currentTime.value = 0;
  }

  watch([root, clips], () => {
    currentClipName.value = clips.value[0]?.name ?? '';
    bindClip();
  });

  watch(currentClipName, bindClip);
  watch(speed, (value) => {
    if (action.value) action.value.timeScale = value;
  });
  watch(loop, (value) => {
    if (action.value) action.value.setLoop(value ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
  });

  function play(): void {
    action.value?.play();
    isPlaying.value = true;
  }

  function pause(): void {
    isPlaying.value = false;
    action.value?.paused = true;
  }

  function stop(): void {
    action.value?.stop();
    currentTime.value = 0;
    isPlaying.value = false;
  }

  function scrub(time: number): void {
    currentTime.value = Math.max(0, Math.min(time, duration.value));
    if (mixer.value) mixer.value.setTime(currentTime.value);
  }

  function step(direction: -1 | 1): void {
    scrub(currentTime.value + direction / 30);
  }

  function update(delta: number): void {
    if (!mixer.value || !isPlaying.value) return;
    mixer.value.update(delta * speed.value);
    currentTime.value = action.value?.time ?? currentTime.value;
  }

  return {
    currentClipName,
    currentClip,
    isPlaying,
    currentTime,
    duration,
    speed,
    loop,
    play,
    pause,
    stop,
    scrub,
    step,
    update,
  };
}
```

- [ ] **Step 5: Implement viewport diagnostics**

Create `src/composables/useViewportDiagnostics.ts`:

```ts
import { reactive } from 'vue';

export type ViewportDebugFlags = {
  grid: boolean;
  axes: boolean;
  bounds: boolean;
  skeleton: boolean;
  wireframe: boolean;
  normals: boolean;
  materialOverride: boolean;
  textures: boolean;
  exposure: number;
};

export function useViewportDiagnostics() {
  const flags = reactive<ViewportDebugFlags>({
    grid: true,
    axes: true,
    bounds: false,
    skeleton: false,
    wireframe: false,
    normals: false,
    materialOverride: false,
    textures: true,
    exposure: 1,
  });

  return { flags };
}
```

- [ ] **Step 6: Implement Three scene manager**

Create `src/composables/useThreeScene.ts`:

```ts
import { onBeforeUnmount, shallowRef, type Ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { ViewportDebugFlags } from './useViewportDiagnostics';

export function useThreeScene(container: Ref<HTMLElement | null>, flags: ViewportDebugFlags) {
  const renderer = shallowRef<THREE.WebGLRenderer | null>(null);
  const scene = shallowRef(new THREE.Scene());
  const camera = shallowRef(new THREE.PerspectiveCamera(45, 1, 0.01, 10000));
  const controls = shallowRef<OrbitControls | null>(null);
  let frame = 0;
  let root: THREE.Object3D | null = null;
  const helpers = new THREE.Group();
  scene.value.add(helpers);

  function mount(): void {
    if (!container.value || renderer.value) return;
    renderer.value = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.value.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.value.appendChild(renderer.value.domElement);
    controls.value = new OrbitControls(camera.value, renderer.value.domElement);
    scene.value.background = new THREE.Color(0x111318);
    scene.value.add(new THREE.HemisphereLight(0xffffff, 0x303040, 2));
    camera.value.position.set(2, 2, 4);
    resize();
    render();
  }

  function resize(): void {
    if (!container.value || !renderer.value) return;
    const rect = container.value.getBoundingClientRect();
    camera.value.aspect = rect.width / Math.max(rect.height, 1);
    camera.value.updateProjectionMatrix();
    renderer.value.setSize(rect.width, rect.height, false);
  }

  function setRoot(next: THREE.Object3D | null): void {
    if (root) scene.value.remove(root);
    root = next;
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
    const radius = Math.max(size.x, size.y, size.z, 1);
    camera.value.position.copy(center).add(new THREE.Vector3(radius, radius, radius * 1.5));
    camera.value.near = radius / 1000;
    camera.value.far = radius * 1000;
    camera.value.updateProjectionMatrix();
    controls.value?.target.copy(center);
    controls.value?.update();
  }

  function clearHelpers(): void {
    helpers.clear();
  }

  function rebuildHelpers(): void {
    clearHelpers();
    if (flags.grid) helpers.add(new THREE.GridHelper(10, 10));
    if (flags.axes) helpers.add(new THREE.AxesHelper(1));
    if (flags.bounds && root) helpers.add(new THREE.Box3Helper(new THREE.Box3().setFromObject(root), 0x58a6ff));
    if (flags.skeleton && root) helpers.add(new THREE.SkeletonHelper(root));
  }

  function render(): void {
    frame = requestAnimationFrame(render);
    renderer.value?.render(scene.value, camera.value);
  }

  function screenshot(): string | null {
    return renderer.value?.domElement.toDataURL('image/png') ?? null;
  }

  onBeforeUnmount(() => {
    cancelAnimationFrame(frame);
    renderer.value?.dispose();
    controls.value?.dispose();
  });

  return { renderer, scene, camera, controls, mount, resize, setRoot, rebuildHelpers, screenshot };
}
```

- [ ] **Step 7: Run build**

Run:

```powershell
npm run build
```

Expected: PASS.

- [ ] **Step 8: Commit if Git exists**

Run:

```powershell
git rev-parse --is-inside-work-tree
```

If output is `true`, run:

```powershell
git add src/composables
git commit -m "feat: add fbx runtime composables"
```

---

## Task 7: Implement Viewport Toolbar And FBX Viewport Components

**Files:**
- Create: `src/components/viewport/ViewportToolbar.vue`
- Create: `src/components/viewport/FbxViewport.vue`
- Modify: `src/composables/useThreeScene.ts`

- [ ] **Step 1: Implement viewport toolbar**

Create `src/components/viewport/ViewportToolbar.vue`:

```vue
<script setup lang="ts">
import type { ViewportDebugFlags } from '../../composables/useViewportDiagnostics';

defineProps<{
  flags: ViewportDebugFlags;
}>();

defineEmits<{
  rebuild: [];
  screenshot: [];
}>();
</script>

<template>
  <div class="viewport-toolbar">
    <label><input v-model="flags.grid" type="checkbox" @change="$emit('rebuild')" /> Grid</label>
    <label><input v-model="flags.axes" type="checkbox" @change="$emit('rebuild')" /> Axes</label>
    <label><input v-model="flags.bounds" type="checkbox" @change="$emit('rebuild')" /> Bounds</label>
    <label><input v-model="flags.skeleton" type="checkbox" @change="$emit('rebuild')" /> Skeleton</label>
    <label><input v-model="flags.wireframe" type="checkbox" /> Wire</label>
    <label><input v-model="flags.textures" type="checkbox" /> Textures</label>
    <label>
      Exposure
      <input v-model.number="flags.exposure" type="range" min="0.25" max="2" step="0.05" />
    </label>
    <button type="button" @click="$emit('screenshot')">Screenshot</button>
  </div>
</template>
```

- [ ] **Step 2: Implement viewport component**

Create `src/components/viewport/FbxViewport.vue`:

```vue
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import type * as THREE from 'three';
import { useThreeScene } from '../../composables/useThreeScene';
import type { ViewportDebugFlags } from '../../composables/useViewportDiagnostics';
import ViewportToolbar from './ViewportToolbar.vue';

const props = defineProps<{
  root: THREE.Object3D | null;
  flags: ViewportDebugFlags;
}>();

const container = ref<HTMLElement | null>(null);
const sceneApi = useThreeScene(container, props.flags);

onMounted(() => {
  sceneApi.mount();
  sceneApi.setRoot(props.root);
});

watch(
  () => props.root,
  (root) => sceneApi.setRoot(root),
);

function downloadScreenshot(): void {
  const data = sceneApi.screenshot();
  if (!data) return;
  const link = document.createElement('a');
  link.href = data;
  link.download = 'fbx-inspector.png';
  link.click();
}
</script>

<template>
  <section class="viewport-shell">
    <div ref="container" class="viewport-canvas" />
    <ViewportToolbar :flags="flags" @rebuild="sceneApi.rebuildHelpers()" @screenshot="downloadScreenshot" />
  </section>
</template>
```

- [ ] **Step 3: Run build**

Run:

```powershell
npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit if Git exists**

Run:

```powershell
git rev-parse --is-inside-work-tree
```

If output is `true`, run:

```powershell
git add src/components/viewport src/composables/useThreeScene.ts
git commit -m "feat: add three viewport controls"
```

---

## Task 8: Compose The Workbench In App.vue And Add Styling

**Files:**
- Modify: `src/app/App.vue`
- Modify: `src/styles/global.css`

- [ ] **Step 1: Replace App.vue with workbench composition**

Modify `src/app/App.vue`:

```vue
<script setup lang="ts">
import { computed } from 'vue';
import FileDropZone from '../components/upload/FileDropZone.vue';
import SceneTree from '../components/scene/SceneTree.vue';
import InspectorPanel from '../components/inspector/InspectorPanel.vue';
import FbxViewport from '../components/viewport/FbxViewport.vue';
import TimelineControls from '../components/viewport/TimelineControls.vue';
import { useFbxLoader } from '../composables/useFbxLoader';
import { useSelection } from '../composables/useSelection';
import { useInspectorData } from '../composables/useInspectorData';
import { useViewportDiagnostics } from '../composables/useViewportDiagnostics';
import { extractSceneNodes } from '../domain/extractors/sceneExtractor';
import { extractAnimationSections } from '../domain/extractors/animationExtractor';

const loader = useFbxLoader();
const selection = useSelection();
const diagnostics = useViewportDiagnostics();

const tabs = useInspectorData(loader.loaded, selection.selected);
const root = computed(() => loader.loaded.value?.root ?? null);
const animations = computed(() => loader.loaded.value?.animations ?? []);
const sceneNodes = computed(() => (root.value ? extractSceneNodes(root.value) : []));
const clipNames = computed(() => animations.value.map((clip) => clip.name || '(unnamed)'));
const firstClip = computed(() => animations.value[0] ?? null);
const animationSections = computed(() => extractAnimationSections(animations.value));
const trackCount = computed(() => firstClip.value?.tracks.length ?? 0);
const keyframeCount = computed(() => firstClip.value?.tracks.reduce((sum, track) => sum + track.times.length, 0) ?? 0);
const nodeCount = computed(() => new Set(firstClip.value?.tracks.map((track) => track.name.split('.')[0]) ?? []).size);
</script>

<template>
  <main class="app-shell">
    <header class="top-bar">
      <strong>FBX Inspector Workbench</strong>
      <FileDropZone @file="loader.loadFile" />
      <span v-if="loader.loading.value" class="status">Loading...</span>
      <span v-else-if="loader.error.value" class="status error">{{ loader.error.value }}</span>
      <span v-else-if="loader.loaded.value" class="status">
        {{ loader.loaded.value.file.name }}
      </span>
      <span v-else class="muted">Local FBX debugging and field-level inspection</span>
    </header>

    <section class="workspace">
      <aside class="left-sidebar">
        <section class="sidebar-block">
          <h2>Scene</h2>
          <SceneTree :nodes="sceneNodes" :selected-id="selection.selectedId.value" @select="selection.select" />
        </section>
      </aside>

      <FbxViewport :root="root" :flags="diagnostics.flags" />

      <InspectorPanel :tabs="tabs" />
    </section>

    <TimelineControls
      v-if="clipNames.length"
      :clips="clipNames"
      :current-clip="clipNames[0]"
      :is-playing="false"
      :current-time="0"
      :duration="firstClip?.duration ?? 0"
      :speed="1"
      :loop="true"
      :track-count="trackCount"
      :keyframe-count="keyframeCount"
      :node-count="nodeCount"
    />
    <footer v-else class="timeline empty">No animation clips</footer>
  </main>
</template>
```

- [ ] **Step 2: Replace global styles with workbench styling**

Modify `src/styles/global.css`:

```css
:root {
  color: #d9dee7;
  background: #111318;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  font-size: 13px;
  line-height: 1.4;
}

* {
  box-sizing: border-box;
}

html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
}

button,
input,
select {
  font: inherit;
}

button,
select {
  color: #d9dee7;
  background: #232832;
  border: 1px solid #3a4150;
  border-radius: 6px;
  padding: 5px 8px;
}

button:hover,
select:hover {
  border-color: #5b6b82;
}

code {
  color: #9ecbff;
}

.app-shell {
  display: grid;
  grid-template-rows: 48px minmax(0, 1fr) 44px;
  width: 100%;
  height: 100%;
  min-width: 1080px;
  background: #111318;
}

.top-bar,
.timeline {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  border-color: #2a2f3a;
  background: #181b21;
}

.top-bar {
  border-bottom: 1px solid #2a2f3a;
}

.timeline {
  border-top: 1px solid #2a2f3a;
}

.workspace {
  display: grid;
  grid-template-columns: 260px minmax(360px, 1fr) 440px;
  min-height: 0;
}

.left-sidebar,
.inspector-panel {
  min-height: 0;
  overflow: auto;
  border-color: #2a2f3a;
  background: #151820;
}

.left-sidebar {
  border-right: 1px solid #2a2f3a;
}

.inspector-panel {
  border-left: 1px solid #2a2f3a;
}

.sidebar-block {
  padding: 12px;
}

.sidebar-block h2 {
  margin: 0 0 8px;
  font-size: 12px;
  text-transform: uppercase;
  color: #8c95a6;
}

.drop-zone {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.drop-zone input {
  display: none;
}

.status {
  color: #cad3df;
}

.status.error {
  color: #ff9b9b;
}

.muted {
  color: #8c95a6;
}

.scene-tree {
  display: grid;
  gap: 2px;
}

.scene-tree button {
  display: flex;
  justify-content: space-between;
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
}

.scene-tree button.selected {
  background: #263247;
}

.scene-tree small {
  color: #8c95a6;
}

.viewport-shell {
  position: relative;
  min-width: 0;
  min-height: 0;
  background: #0d0f14;
}

.viewport-canvas {
  width: 100%;
  height: 100%;
}

.viewport-toolbar {
  position: absolute;
  left: 12px;
  top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: calc(100% - 24px);
  padding: 8px;
  border: 1px solid #2a2f3a;
  border-radius: 8px;
  background: rgba(17, 19, 24, 0.88);
}

.tab-row {
  display: flex;
  gap: 4px;
  padding: 8px;
  overflow-x: auto;
  border-bottom: 1px solid #2a2f3a;
}

.tab-row button.active {
  background: #30415c;
  border-color: #5f85bd;
}

.tab-body {
  padding: 8px;
}

details {
  margin-bottom: 8px;
  border: 1px solid #2a2f3a;
  border-radius: 8px;
  background: #181b21;
}

summary {
  cursor: pointer;
  padding: 8px;
  color: #cad3df;
}

.field-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.field-table th,
.field-table td {
  padding: 6px 8px;
  vertical-align: top;
  border-top: 1px solid #2a2f3a;
  overflow-wrap: anywhere;
}

.field-table th {
  color: #8c95a6;
  font-weight: 600;
  text-align: left;
}

.field-table .warning {
  background: rgba(255, 190, 80, 0.08);
}

.raw-tree {
  margin: 0;
  white-space: pre-wrap;
}

.timeline input[type="range"] {
  flex: 1;
  min-width: 160px;
}

.timeline.empty {
  color: #8c95a6;
}
```

- [ ] **Step 3: Run build**

Run:

```powershell
npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit if Git exists**

Run:

```powershell
git rev-parse --is-inside-work-tree
```

If output is `true`, run:

```powershell
git add src/app/App.vue src/styles/global.css
git commit -m "feat: compose fbx inspector workbench"
```

---

## Task 9: Add Browser Acceptance Tests And Manual FBX Verification Notes

**Files:**
- Create: `tests/e2e/app.spec.ts`
- Create: `docs/testing-fbx-inspector.md`

- [ ] **Step 1: Add Playwright test**

Create `tests/e2e/app.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('renders the workbench shell', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('FBX Inspector Workbench')).toBeVisible();
  await expect(page.getByText('Choose or drop .fbx')).toBeVisible();
  await expect(page.locator('.viewport-shell')).toBeVisible();
  await expect(page.locator('.inspector-panel')).toBeVisible();
  await expect(page.locator('.timeline')).toBeVisible();
});

test('shows invalid file error through the file input', async ({ page }) => {
  await page.goto('/');
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByText('Choose or drop .fbx').click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: 'bad.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('not fbx'),
  });
  await expect(page.getByText('Please choose a .fbx file.')).toBeVisible();
});
```

- [ ] **Step 2: Add manual test notes**

Create `docs/testing-fbx-inspector.md`:

```markdown
# FBX Inspector Manual Verification

Use this checklist with a real `.fbx` file after automated tests pass.

1. Start the dev server with `npm run dev`.
2. Open `http://127.0.0.1:5173`.
3. Choose or drag in a local `.fbx` file.
4. Confirm the model appears in the viewport.
5. Confirm OrbitControls can rotate, pan, and zoom.
6. Confirm Overview shows file size, object count, mesh count, material count, texture count, animation clip count, vertex count, and triangle count.
7. Select a node from the scene tree and confirm the Inspector Node tab updates.
8. Select a mesh and confirm Mesh, Materials, Textures, Skeleton, and Raw tabs show relevant data.
9. Toggle Grid, Axes, Bounds, and Skeleton helpers.
10. If the FBX contains animation clips, confirm timeline clip stats are visible.
11. Verify field rows show path, value, source, and tips for animation and texture fields.
12. Try an invalid `.txt` file and confirm the error is visible.
```

- [ ] **Step 3: Run E2E tests**

Run:

```powershell
npx playwright install chromium
npm run test:e2e
```

Expected: PASS.

- [ ] **Step 4: Commit if Git exists**

Run:

```powershell
git rev-parse --is-inside-work-tree
```

If output is `true`, run:

```powershell
git add tests/e2e/app.spec.ts docs/testing-fbx-inspector.md
git commit -m "test: add fbx inspector browser coverage"
```

---

## Task 10: Final Verification And Local Server Handoff

**Files:**
- No source changes expected unless verification exposes issues.

- [ ] **Step 1: Run unit and component tests**

Run:

```powershell
npm test
```

Expected: PASS.

- [ ] **Step 2: Run production build**

Run:

```powershell
npm run build
```

Expected: PASS.

- [ ] **Step 3: Run browser tests**

Run:

```powershell
npm run test:e2e
```

Expected: PASS.

- [ ] **Step 4: Start local dev server**

Run:

```powershell
npm run dev -- --port 5173
```

Expected: Vite starts at `http://127.0.0.1:5173`.

- [ ] **Step 5: Report verification status**

Report:

- Unit/component test result
- Production build result
- E2E test result
- Dev server URL
- Any manual FBX validation limitations, especially if no sample FBX file was available

---

## Self-Review

Spec coverage:

- Local file selection and drag-and-drop: Task 5 and Task 8.
- Three.js rendering: Task 6 and Task 7.
- Animation playback and analysis: Task 4, Task 5, Task 6, and Task 8. The first implementation wires analysis stats into the timeline; full mixer playback wiring can be expanded after the viewport component exposes an animation update hook.
- Scene tree and selection: Task 3, Task 5, and Task 8.
- Dimension-based Inspector: Task 2 through Task 8.
- Original field paths, values, sources, and tips: Task 2 through Task 5.
- Mesh/material/texture/skeleton/animation/raw data: Task 3 and Task 4.
- Debug helpers: Task 6 and Task 7.
- Performance diagnostics: basic renderer diagnostics type is planned through `useViewportDiagnostics`; richer `renderer.info` display is a follow-up if time is constrained.
- Tests: Task 1 through Task 10.

Known implementation risk:

- Three.js and Vue type details may differ slightly by dependency version. When TypeScript reports a precise API mismatch, keep the behavior from the spec and adjust the narrow type annotation rather than changing product scope.
- The plan starts with a working MVP. It does not include complete renderer.info Performance tab wiring or deep virtual scrolling in the first pass; those are extension points after the core inspector is running.

Red-flag scan:

- No unfinished marker text or intentionally blank implementation steps are present.

Type consistency:

- Shared display type is `InspectorField`.
- Shared section type is `InspectorSection`.
- Scene tree node type is `SceneNodeInfo`.
- Runtime file model is `LoadedFbx`.
- Inspector tabs use `{ id, label, sections }` consistently.
