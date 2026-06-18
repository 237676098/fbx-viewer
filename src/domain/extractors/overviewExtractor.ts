import * as THREE from 'three';
import type { InspectorField, InspectorSection } from '../types';
import { getFieldTip } from '../tips/fieldTips';
import { displayUnknown, formatBytes, formatDuration, formatTuple } from '../../utils/format';
import { getTriangleCount } from './meshExtractor';

type OverviewInput = {
  fileName: string;
  fileSize: number;
  loadMs: number;
  root: THREE.Object3D;
  animations: THREE.AnimationClip[];
  warnings: string[];
};

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

type MaterialWithTextures = THREE.Material & Partial<Record<(typeof textureSlots)[number], THREE.Texture | null>>;

function field(
  path: string,
  value: unknown,
  displayValue = displayUnknown(value),
  source = 'FBX overview',
): InspectorField {
  return { path, value, displayValue, source, tip: getFieldTip(path), copyValue: displayValue };
}

function materialsFromObject(object: THREE.Object3D): THREE.Material[] {
  const maybeMesh = object as THREE.Mesh;
  if (!('material' in maybeMesh)) return [];

  return Array.isArray(maybeMesh.material) ? maybeMesh.material : [maybeMesh.material].filter(Boolean);
}

function textureSetFromMaterials(materials: Iterable<THREE.Material>): Set<THREE.Texture> {
  const textures = new Set<THREE.Texture>();

  for (const material of materials) {
    const typedMaterial = material as MaterialWithTextures;
    for (const slot of textureSlots) {
      const texture = typedMaterial[slot];
      if (texture) textures.add(texture);
    }
  }

  return textures;
}

function isMesh(object: THREE.Object3D): object is THREE.Mesh {
  return 'isMesh' in object && object.isMesh === true;
}

function isSkinnedMesh(object: THREE.Object3D): object is THREE.SkinnedMesh {
  return 'isSkinnedMesh' in object && object.isSkinnedMesh === true;
}

function getSceneDimensions(root: THREE.Object3D): number[] {
  const box = new THREE.Box3();
  const point = new THREE.Vector3();

  root.updateMatrixWorld(true);
  root.traverse((object) => {
    if (!isMesh(object)) return;

    const position = object.geometry.getAttribute('position');
    if (!position) return;

    for (let index = 0; index < position.count; index += 1) {
      point.fromBufferAttribute(position, index).applyMatrix4(object.matrixWorld);
      box.expandByPoint(point);
    }
  });

  if (box.isEmpty()) return [0, 0, 0];

  return box.getSize(new THREE.Vector3()).toArray();
}

export function extractOverview(input: OverviewInput): InspectorSection[] {
  const materials = new Set<THREE.Material>();
  const bones = new Set<THREE.Bone>();
  let objectCount = 0;
  let meshCount = 0;
  let skinnedMeshCount = 0;
  let vertexCount = 0;
  let triangleCount = 0;

  input.root.traverse((object) => {
    objectCount += 1;
    if (object.type === 'Bone') bones.add(object as THREE.Bone);

    for (const material of materialsFromObject(object)) {
      materials.add(material);
    }

    if (isMesh(object)) {
      meshCount += 1;
      vertexCount += object.geometry.getAttribute('position')?.count ?? 0;
      triangleCount += getTriangleCount(object.geometry);
    }

    if (isSkinnedMesh(object)) {
      skinnedMeshCount += 1;
      for (const bone of object.skeleton.bones) bones.add(bone);
    }
  });

  const sceneDimensions = getSceneDimensions(input.root);

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
        field('overview.textureCount', textureSetFromMaterials(materials).size),
        field('overview.animationClipCount', input.animations.length),
        field('overview.boneCount', bones.size),
        field('overview.vertexCount', vertexCount),
        field('overview.triangleCount', triangleCount),
        field('overview.warningCount', input.warnings.length),
        field('overview.sceneDimensions', sceneDimensions, formatTuple(sceneDimensions)),
      ],
    },
  ];
}
