import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { extractOverview } from '../../src/domain/extractors/overviewExtractor';

function fieldValue(sections: ReturnType<typeof extractOverview>, path: string): unknown {
  return sections.flatMap((section) => section.fields).find((field) => field.path === path)?.value;
}

describe('extractOverview', () => {
  it('counts scene contents and geometry totals', () => {
    const root = new THREE.Group();
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
    geometry.setIndex([0, 1, 2]);
    const texture = new THREE.Texture();
    texture.image = { width: 32, height: 16 };
    const material = new THREE.MeshStandardMaterial({ name: 'Body', map: texture });
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

    expect(fieldValue(sections, 'overview.fileName')).toBe('model.fbx');
    expect(fieldValue(sections, 'overview.fileSize')).toBe(2048);
    expect(fieldValue(sections, 'overview.loadMs')).toBe(12);
    expect(fieldValue(sections, 'overview.objectCount')).toBe(2);
    expect(fieldValue(sections, 'overview.meshCount')).toBe(1);
    expect(fieldValue(sections, 'overview.materialCount')).toBe(1);
    expect(fieldValue(sections, 'overview.textureCount')).toBe(1);
    expect(fieldValue(sections, 'overview.vertexCount')).toBe(3);
    expect(fieldValue(sections, 'overview.triangleCount')).toBe(1);
    expect(fieldValue(sections, 'overview.animationClipCount')).toBe(1);
    expect(fieldValue(sections, 'overview.warningCount')).toBe(1);
  });

  it('counts skinned meshes, bones, material arrays, and scene dimensions', () => {
    const root = new THREE.Group();
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([-1, -2, -3, 4, 5, 6, 4, -2, 6], 3));
    geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute([0, 0, 0, 0], 4));
    geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute([1, 0, 0, 0], 4));
    const bone = new THREE.Bone();
    const skinnedMesh = new THREE.SkinnedMesh(geometry, [
      new THREE.MeshBasicMaterial({ name: 'A' }),
      new THREE.MeshBasicMaterial({ name: 'B' }),
    ]);
    skinnedMesh.add(bone);
    skinnedMesh.bind(new THREE.Skeleton([bone]));
    root.add(skinnedMesh);

    const sections = extractOverview({
      fileName: 'rig.fbx',
      fileSize: 4096,
      loadMs: 20,
      root,
      animations: [],
      warnings: [],
    });

    expect(fieldValue(sections, 'overview.skinnedMeshCount')).toBe(1);
    expect(fieldValue(sections, 'overview.boneCount')).toBe(1);
    expect(fieldValue(sections, 'overview.materialCount')).toBe(2);
    expect(fieldValue(sections, 'overview.sceneDimensions')).toEqual([5, 7, 9]);
  });
});
