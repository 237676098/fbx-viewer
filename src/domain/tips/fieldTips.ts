const exactTips = new Map<string, string>([
  ['clip.name', 'Animation clip name, usually derived from an FBX take or stack.'],
  ['clip.duration', 'Total playback duration in seconds for this animation clip.'],
  ['clip.blendMode', 'Controls how this animation clip blends with other playback actions.'],
  ['track.name', 'Track binding path, usually target object plus animated property.'],
  ['track.ValueTypeName', 'Runtime value type used by Three.js for this keyframe track.'],
  ['track.times.length', 'Number of keyframe timestamps stored by this track.'],
  [
    'track.values.length',
    'Flattened keyframe value count. Position and scale use 3 values per keyframe; quaternion uses 4.',
  ],
  ['material.name', 'Material label from the FBX or assigned by the loader.'],
  ['material.type', 'Three.js material class used to shade this surface.'],
  ['material.color', 'Base material color before texture maps and lighting are applied.'],
  ['material.opacity', 'Surface opacity. Values below 1 usually require transparency to be enabled.'],
  ['material.transparent', 'Allows alpha blending when opacity or texture alpha should be visible.'],
  ['material.roughness', 'Controls how broad and matte reflected light appears on PBR materials.'],
  ['material.metalness', 'Controls whether the surface behaves like a dielectric or metal in PBR shading.'],
  ['texture.name', 'Texture label from the source file or runtime object.'],
  ['texture.image.width', 'Texture image width in pixels when browser image data is available.'],
  ['texture.image.height', 'Texture image height in pixels when browser image data is available.'],
  [
    'texture.colorSpace',
    'Color textures usually need sRGB; normal, roughness, and metalness maps usually do not.',
  ],
  [
    'texture.flipY',
    'Controls vertical texture orientation. Wrong values often make imported textures appear upside down.',
  ],
  ['geometry.index.count', 'Number of indexed vertices. Divide by 3 for triangle count on triangle meshes.'],
  ['object.name', 'Object name imported from the FBX scene hierarchy.'],
  ['object.type', 'Three.js runtime object class for this scene node.'],
  ['object.visible', 'Whether this object and its children are rendered.'],
]);

const prefixTips: Array<[string, string]> = [
  ['animation.tracks', 'Animation track data describing keyframe timing and values for a target property.'],
  ['material.map', 'Base color texture map sampled with the mesh UVs.'],
  ['material.normalMap', 'Normal map that changes lighting without changing geometry.'],
  ['material.roughnessMap', 'Texture map controlling per-pixel surface roughness.'],
  ['material.metalnessMap', 'Texture map controlling per-pixel metalness.'],
  ['texture.wrap', 'Controls how UVs outside the 0-1 range sample the texture.'],
  ['texture.repeat', 'Scales UV sampling for this texture.'],
  ['texture.offset', 'Offsets UV sampling for this texture.'],
  ['texture.center', 'Pivot point used for texture rotation in UV space.'],
  ['geometry.attributes.position', 'Vertex position buffer. Its count is the geometry vertex count.'],
  [
    'geometry.attributes.normal',
    'Vertex normal buffer used for lighting. Missing normals can produce flat or incorrect shading.',
  ],
  ['geometry.attributes.uv', 'Primary UV buffer used by most texture slots.'],
  ['geometry.attributes.color', 'Per-vertex color buffer that can tint material output.'],
  ['geometry.attributes.skinIndex', 'Skinning bone index buffer used by SkinnedMesh animation.'],
  ['geometry.attributes.skinWeight', 'Skinning weight buffer used by SkinnedMesh animation.'],
  ['object.position', 'Local translation relative to the parent object.'],
  ['object.rotation', 'Local Euler rotation relative to the parent object.'],
  ['object.quaternion', 'Local quaternion rotation relative to the parent object.'],
  ['object.scale', 'Local scale relative to the parent object.'],
  ['object.matrix', 'Local transform matrix derived from position, rotation, and scale.'],
  ['object.matrixWorld', 'World transform matrix after parent transforms are applied.'],
];

const patternTips: Array<[RegExp, string]> = [
  [/^animation\.tracks\.\d+\.times\.length$/, 'Number of keyframe timestamps for this animation track.'],
  [
    /^animation\.tracks\.\d+\.values\.length$/,
    'Flattened animated values for this track. Compare with keyframe count and value type.',
  ],
  [
    /^animation\.tracks\.\d+\.name$/,
    'Target binding path for this animation track, typically object name plus animated property.',
  ],
  [
    /^geometry\.attributes\.[^.]+\.count$/,
    'Number of logical items in this geometry attribute buffer.',
  ],
  [
    /^geometry\.attributes\.[^.]+\.itemSize$/,
    'Number of numeric components per attribute item.',
  ],
];

export function getFieldTip(path: string): string | undefined {
  const exact = exactTips.get(path);
  if (exact) return exact;

  const prefix = prefixTips.find(([candidate]) => path.startsWith(candidate));
  if (prefix) return prefix[1];

  const pattern = patternTips.find(([candidate]) => candidate.test(path));
  return pattern?.[1];
}
