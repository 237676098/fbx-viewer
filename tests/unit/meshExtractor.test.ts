import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { extractMeshSections, getTriangleCount } from '../../src/domain/extractors/meshExtractor';

function fieldValue(sections: ReturnType<typeof extractMeshSections>, path: string): unknown {
  return sections.flatMap((section) => section.fields).find((field) => field.path === path)?.value;
}

describe('mesh extractor', () => {
  it('extracts geometry attributes and triangle counts', () => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(12), 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(8), 2));
    geometry.setIndex([0, 1, 2, 0, 2, 3]);
    geometry.addGroup(0, 3, 0);
    geometry.boundingBox = new THREE.Box3(new THREE.Vector3(0, 1, 2), new THREE.Vector3(3, 4, 5));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(1, 2, 3), 4);
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());

    const sections = extractMeshSections(mesh);

    expect(fieldValue(sections, 'geometry.attributes.position.count')).toBe(4);
    expect(fieldValue(sections, 'geometry.attributes.position.itemSize')).toBe(3);
    expect(fieldValue(sections, 'geometry.attributes.normal.count')).toBe(4);
    expect(fieldValue(sections, 'geometry.attributes.uv.itemSize')).toBe(2);
    expect(fieldValue(sections, 'geometry.index.count')).toBe(6);
    expect(fieldValue(sections, 'geometry.triangleCount')).toBe(2);
    expect(fieldValue(sections, 'geometry.groups.length')).toBe(1);
    expect(fieldValue(sections, 'geometry.boundingBox.min')).toEqual([0, 1, 2]);
    expect(fieldValue(sections, 'geometry.boundingSphere.radius')).toBe(4);
  });

  it('gets triangle count from non-indexed position attributes', () => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(18), 3));

    expect(getTriangleCount(geometry)).toBe(2);
  });
});
