# FBX Inspector Workbench Design

Date: 2026-06-18

## Product Positioning

FBX Inspector Workbench is a local, browser-based FBX debugging tool built with Vue, Vite, TypeScript, and Three.js. It is aimed at developers and technical artists who need to inspect what an FBX file contains, verify animation and skinning data, diagnose material and texture setup, and communicate concrete field-level problems.

The first version focuses on local `.fbx` file loading through drag-and-drop or file selection. It does not upload files to a server and does not manage an asset library.

The product is an inspector, not only a viewer. The central value is rendering the model while exposing structured data by dimension, using original runtime field paths, values, and short tips that explain what each field means and how it affects rendering, animation, or diagnosis.

## Core Product Shape

The application is a single-page workbench:

```text
+------------------------------------------------------------+
| Top Bar: open file / filename / loading state / view tools  |
+---------------+------------------------------+-------------+
| Left Sidebar  | Main Viewport                | Inspector   |
| file summary  | Three.js FBX render area      | data tabs   |
| scene tree    | orbit controls                | field table |
| filters       | grid/axis/bbox/skeleton       | tips/raw    |
+---------------+------------------------------+-------------+
| Bottom Timeline: clip / playback / stepping / track stats   |
+------------------------------------------------------------+
```

The first screen is the usable tool surface. There is no landing page.

## Data Display Principles

The Inspector does not use a plain JSON dump as its primary experience. Data is grouped into dimensions and rendered as field tables with consistent rows:

| Column | Meaning |
| --- | --- |
| Field path | Original or derived runtime path, such as `geometry.attributes.position.count` |
| Value | Current value formatted for scanning |
| Source | The runtime source, such as `THREE.BufferGeometry`, `THREE.Texture`, or `THREE.AnimationClip` |
| Tip | A short explanation of what the field means, what it affects, and common abnormal cases |
| Actions | Copy field path, copy value, focus related object when possible |

The UI should preserve original field names where Three.js exposes them. When a value is inferred from imported runtime structures rather than raw FBX AST data, the source should make that clear.

### Inspector Dimensions

The right-side Inspector uses these tabs:

- `Overview`
- `Node`
- `Mesh`
- `Materials`
- `Textures`
- `Skeleton`
- `Animation`
- `Performance`
- `Raw`

Each tab uses collapsible sections so large files remain navigable.

## Data Scope

### Overview

Overview shows global file and scene statistics:

- File name
- File size
- Load duration
- Object count
- Mesh count
- SkinnedMesh count
- Material count
- Texture count
- Animation clip count
- Bone count
- Vertex count
- Triangle count
- Scene bounding box
- Scene dimensions
- Warning count

### Scene And Nodes

The scene tree and Node tab expose:

- `object.name`
- `object.uuid`
- `object.type`
- `object.visible`
- `object.position`
- `object.rotation`
- `object.quaternion`
- `object.scale`
- `object.matrix`
- `object.matrixWorld`
- Parent name and UUID
- Children count
- Node depth
- User data summary

Clicking a node in the tree selects it, highlights it in the viewport when possible, and opens its corresponding Inspector data.

### Mesh And Geometry

Mesh data includes:

- Mesh name, type, UUID
- Geometry UUID
- `geometry.attributes.position.count`
- `geometry.attributes.normal`
- `geometry.attributes.uv`
- `geometry.attributes.uv2`
- `geometry.attributes.color`
- `geometry.attributes.skinIndex`
- `geometry.attributes.skinWeight`
- `geometry.index.count`
- Triangle count
- Draw range
- Groups
- Bounding box
- Bounding sphere
- Morph target names and counts

Typed arrays are summarized by type, length, item size, and small samples. They are not fully expanded by default.

### Materials And Textures

Material fields include:

- Material name
- Material UUID
- Material type
- `material.color`
- `material.emissive`
- `material.opacity`
- `material.transparent`
- `material.alphaTest`
- `material.side`
- `material.depthTest`
- `material.depthWrite`
- `material.blending`
- `material.roughness`
- `material.metalness`
- `material.envMapIntensity`
- `material.wireframe`

Texture slot fields include:

- `material.map`
- `material.normalMap`
- `material.roughnessMap`
- `material.metalnessMap`
- `material.emissiveMap`
- `material.aoMap`
- `material.alphaMap`
- `material.bumpMap`
- `material.displacementMap`
- `material.lightMap`

Texture fields include:

- `texture.name`
- `texture.uuid`
- `texture.image.width`
- `texture.image.height`
- `texture.mapping`
- `texture.channel`
- `texture.wrapS`
- `texture.wrapT`
- `texture.magFilter`
- `texture.minFilter`
- `texture.anisotropy`
- `texture.format`
- `texture.type`
- `texture.colorSpace`
- `texture.offset`
- `texture.repeat`
- `texture.center`
- `texture.rotation`
- `texture.flipY`
- `texture.generateMipmaps`

Tips should explain texture intent and common issues. For example:

- `texture.colorSpace`: color textures usually need sRGB; data textures such as normal, roughness, and metalness usually should not use sRGB.
- `texture.wrapS` and `texture.wrapT`: controls how UVs outside the 0-1 range sample the texture.
- `material.normalMap`: affects surface shading direction but does not change mesh geometry.

### Skeleton And Skinning

Skeleton data includes:

- Bone count
- Bone hierarchy
- `bone.name`
- `bone.uuid`
- Parent bone
- Child bones
- SkinnedMesh associations
- `skinnedMesh.bindMatrix`
- `skinnedMesh.bindMatrixInverse`
- `skeleton.bones`
- `skeleton.boneInverses`
- Presence of `skinIndex`
- Presence of `skinWeight`

The viewport can show a skeleton helper and focus selected bones where possible.

### Animation

Animation is a first-class diagnostic area, not only a playback control.

Clip fields include:

- `clip.name`
- `clip.duration`
- `clip.tracks.length`
- Total keyframe count
- Involved node count
- Involved property types

Track fields include:

- `track.name`
- `track.ValueTypeName`
- `track.times.length`
- `track.values.length`
- Start time
- End time
- Keyframe count
- Bound object name inferred from the track name
- Bound property inferred from the track name
- Interpolation factory or interpolation type where accessible

Track tips should explain common animation concepts:

- `track.name`: usually combines the target object name and animated property, such as `Armature_Hips.position`.
- `track.times`: keyframe time array in seconds.
- `track.values`: flattened keyframe value array. Position and scale usually use 3 values per keyframe; quaternion rotation usually uses 4 values per keyframe.
- `clip.duration`: total playback duration for the animation clip.

Animation UI supports filtering by:

- Clip
- Node name
- Property type: `position`, `quaternion`, `scale`, morph target, or other
- Track value type

### Performance And Diagnostics

Performance data includes:

- Frames per second
- Renderer calls
- Renderer triangles
- Renderer geometries
- Renderer textures
- Scene object count
- Visible object count
- Current helper state

Diagnostics are informational in the first version. They do not block rendering. Examples:

- A mesh has very high triangle count.
- A texture is unusually large.
- A texture is not power-of-two sized.
- A node has very small or very large scale.
- An animation track appears to target a missing object.
- A SkinnedMesh has missing or suspicious skin attributes.

### Raw

The Raw tab provides a safe tree view of the selected runtime object. It filters functions, DOM objects, WebGL contexts, circular references, and very large typed arrays. Large values are summarized and expandable.

This is not a complete FBX AST viewer in the first version. Three.js `FBXLoader` exposes imported runtime structures rather than every private field in the FBX file. The UI should use source labels to distinguish stable Three.js runtime fields from inferred fields.

## Core Interactions

1. User drags or selects a `.fbx` file.
2. The app shows loading progress and status.
3. On success, the model is added to the Three.js scene, centered, and framed by the camera.
4. Overview statistics populate immediately.
5. The left scene tree lists imported nodes and supports search and type filters.
6. Selecting a scene node highlights it in the viewport and updates Inspector tabs.
7. Selecting a mesh, material, texture, skeleton, or animation track shows related fields and tips.
8. Timeline controls allow animation playback, scrubbing, stepping, speed changes, looping, and clip switching.
9. Viewport debug toggles help inspect mesh, skeleton, material, texture, and scale issues.
10. Field paths and values can be copied for issue reports or communication with artists.

## Viewport Features

The Three.js viewport includes:

- Orbit controls
- Grid helper
- Axis helper
- Automatic model centering
- Automatic camera framing
- Reset camera
- Focus selected object
- Bounding box helper
- Skeleton helper
- Wireframe mode
- Normal helper
- Material override
- Texture visibility toggle
- Exposure control
- Screenshot command

Debug helpers are managed separately from the loaded model so the imported object is not mutated unnecessarily.

## Timeline Features

The bottom timeline is shown when an imported model has animation clips. If there are no clips, it shows a compact no-animation state.

Controls include:

- Clip selector
- Play and pause
- Stop
- Jump to start
- Jump to end
- Step previous frame
- Step next frame
- Loop toggle
- Playback speed from `0.1x` to `2x`
- Scrubbable progress
- Current time and duration
- Track count
- Keyframe count
- Involved node count

## Technical Architecture

Recommended stack:

- Vue 3
- Vite
- TypeScript
- Three.js
- `FBXLoader`
- `OrbitControls`
- `lucide-vue-next` for icons

Recommended source layout:

```text
src/
  app/
    App.vue
    layout/
  components/
    viewport/
      FbxViewport.vue
      ViewportToolbar.vue
      TimelineControls.vue
    inspector/
      InspectorPanel.vue
      FieldTable.vue
      FieldTip.vue
      RawObjectTree.vue
    scene/
      SceneTree.vue
      NodeTypeBadge.vue
    upload/
      FileDropZone.vue
  composables/
    useFbxLoader.ts
    useThreeScene.ts
    useAnimationMixer.ts
    useSelection.ts
    useInspectorData.ts
    useViewportDiagnostics.ts
  domain/
    extractors/
      overviewExtractor.ts
      sceneExtractor.ts
      meshExtractor.ts
      materialExtractor.ts
      textureExtractor.ts
      skeletonExtractor.ts
      animationExtractor.ts
      performanceExtractor.ts
    tips/
      fieldTips.ts
    types.ts
  utils/
    format.ts
    threeObjectSerialize.ts
```

Primary data flow:

```text
File
  -> useFbxLoader
  -> root Object3D + AnimationClip[]
  -> extractor modules
  -> InspectorModel
  -> SceneTree / Viewport / Inspector / Timeline
```

### Loader

`useFbxLoader` should:

- Accept a `File`.
- Create an object URL.
- Call `FBXLoader.loadAsync`.
- Release the object URL after loading.
- Return root object, animations, file metadata, load stats, and warnings.
- Surface clear errors for invalid file type, empty file, parse failure, missing resources, and likely memory pressure.

### Three Scene

`useThreeScene` should manage:

- Renderer
- Camera
- Scene
- Orbit controls
- Resize handling
- Render loop
- Model replacement
- Camera framing
- Debug helper lifecycle

### Animation

`useAnimationMixer` should manage:

- `AnimationMixer`
- Current clip
- Current action
- Playback state
- Loop state
- Speed
- Scrubbing
- Stepping
- Current time
- Duration

### Inspector Model

Components should not directly traverse arbitrary Three.js object internals. Extractor modules convert runtime objects into a stable display model.

```ts
type InspectorField = {
  path: string;
  label?: string;
  value: unknown;
  displayValue: string;
  source: string;
  tip?: string;
  severity?: 'info' | 'warning';
  copyValue?: string;
};
```

Tips are resolved by exact path, prefix, or pattern. Examples:

- Exact: `material.roughness`
- Prefix: `texture.`
- Pattern: `animation.tracks.*.times.length`

## Error Handling

Loading errors:

- Non-FBX file
- Empty file
- Parse failure
- Browser memory pressure

Resource warnings:

- Referenced external texture not available
- Texture slot exists in source intent but runtime texture is null, when detectable

Data warnings:

- High triangle count
- Very large texture
- Non-power-of-two texture
- Abnormal scale
- Missing animation target
- Suspicious skinning attributes

Errors are shown in context. Loading failures appear in the viewport and top bar. Data warnings appear next to relevant fields and in Performance.

## Performance Strategy

- Do not expand large typed arrays by default.
- Summarize typed arrays with type, length, item size, and small samples.
- Keep Raw tree deeply collapsed by default.
- Avoid recomputing extracted data during the render loop.
- Extract global static data once after load.
- Extract selected-node details on selection change.
- Create and dispose helpers only when their toggles change.
- Update performance counters at a limited cadence, such as every 500ms or 1s.
- Keep field tables searchable and collapsible.
- Leave room for virtual scrolling if very large files require it.

## Testing Strategy

Unit tests:

- Overview extractor returns correct aggregate counts.
- Mesh extractor reads geometry attributes and triangle counts.
- Material extractor reads material properties and texture slots.
- Texture extractor reads image and sampling fields.
- Skeleton extractor reads bone hierarchy and skinning fields.
- Animation extractor parses clips, tracks, keyframe counts, and property bindings.
- Field tips resolve exact, prefix, and pattern matches.
- Raw serializer handles cycles and large typed arrays safely.

Component tests:

- FieldTable renders path, value, source, tip, warning state, and copy action.
- Inspector tabs switch correctly.
- SceneTree selects nodes and filters by name/type.
- Timeline controls emit playback, scrub, speed, loop, and stepping actions.

Browser acceptance tests:

- App starts.
- File entry point exists.
- Empty state is visible.
- Error state is visible for invalid file input.
- Layout renders top bar, left tree, viewport, inspector, and timeline regions.
- Canvas renders non-empty content when a test model is available.
- Inspector tabs are switchable.

If no sample FBX asset is available in the repository, the first version can test UI with mock data and keep real FBX validation as a documented manual verification step.

## First Version Scope

Included:

- Local `.fbx` file selection and drag-and-drop
- Three.js FBX rendering
- Animation clip playback
- Animation track analysis
- Scene tree
- Selection linkage between tree, viewport, inspector, and animation data
- Dimension-based Inspector tabs
- Original field paths, values, sources, and tips
- Mesh, material, texture, skeleton, animation, performance, and raw data views
- Debug viewport helpers
- Lightweight diagnostics
- Copy field path and value

Excluded:

- Server upload or storage
- Asset library management
- Batch processing
- Multi-FBX comparison
- FBX editing or saving
- Automatic external texture folder relinking
- Full raw FBX AST parsing
- Other 3D formats such as glTF, OBJ, or STL

## Future Extensions

- Drag in `.fbx` plus texture files or zip packages and relink external textures.
- Export diagnostics as JSON or CSV.
- Add asset audit rules and pass/fail reports.
- Compare multiple animation clips.
- Add skeleton naming and retargeting checks.
- Add project-specific naming convention validation.
- Support glTF and OBJ after the FBX workflow is stable.
