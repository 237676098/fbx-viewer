import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { extractSceneNodes, extractNodeSections } from '../../src/domain/extractors/sceneExtractor';
import { extractSkeletonSections } from '../../src/domain/extractors/skeletonExtractor';

function nodeFieldValue(sections: ReturnType<typeof extractNodeSections>, path: string): unknown {
  return sections.flatMap((section) => section.fields).find((field) => field.path === path)?.value;
}

function skeletonFieldValue(sections: ReturnType<typeof extractSkeletonSections>, path: string): unknown {
  return sections.flatMap((section) => section.fields).find((field) => field.path === path)?.value;
}

describe('scene and skeleton extractors', () => {
  it('builds a scene node tree and node fields', () => {
    const root = new THREE.Group();
    root.name = 'Root';
    const child = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    child.name = 'Cube';
    child.position.set(1, 2, 3);
    root.add(child);

    const nodes = extractSceneNodes(root);
    expect(nodes[0].name).toBe('Root');
    expect(nodes[0].children[0].name).toBe('Cube');
    expect(nodes[0].children[0].depth).toBe(1);

    const sections = extractNodeSections(child);
    expect(nodeFieldValue(sections, 'object.name')).toBe('Cube');
    expect(nodeFieldValue(sections, 'object.uuid')).toBe(child.uuid);
    expect(nodeFieldValue(sections, 'object.type')).toBe('Mesh');
    expect(nodeFieldValue(sections, 'object.visible')).toBe(true);
    expect(nodeFieldValue(sections, 'object.position')).toEqual([1, 2, 3]);
    expect(nodeFieldValue(sections, 'object.parent')).toBe('Root');
    expect(nodeFieldValue(sections, 'object.children.length')).toBe(0);
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

    const sections = extractSkeletonSections(mesh);

    expect(skeletonFieldValue(sections, 'skeleton.isSkinnedMesh')).toBe(true);
    expect(skeletonFieldValue(sections, 'skeleton.bones.length')).toBe(1);
    expect(skeletonFieldValue(sections, 'skeleton.boneInverses.length')).toBe(1);
    expect(skeletonFieldValue(sections, 'skeleton.bones.0.name')).toBe('Hips');
    expect(skeletonFieldValue(sections, 'geometry.attributes.skinIndex.present')).toBe(true);
    expect(skeletonFieldValue(sections, 'geometry.attributes.skinWeight.present')).toBe(true);
  });

  it('reports absent skeleton data without throwing', () => {
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial());

    const sections = extractSkeletonSections(mesh);

    expect(skeletonFieldValue(sections, 'skeleton.isSkinnedMesh')).toBe(false);
    expect(skeletonFieldValue(sections, 'skeleton.bones.length')).toBe(0);
    expect(skeletonFieldValue(sections, 'geometry.attributes.skinIndex.present')).toBe(false);
  });
});
