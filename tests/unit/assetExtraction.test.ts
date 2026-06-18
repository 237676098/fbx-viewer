import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { ref } from 'vue';
import { collectFbxAssets, useInspectorData } from '../../src/composables/useInspectorData';

describe('collectFbxAssets', () => {
  it('separates global overview and texture assets from node-specific sections', () => {
    const root = new THREE.Group();
    const texture = new THREE.Texture();
    texture.name = 'base_color_texture';
    texture.userData = {
      relativeFilename: 'Atlas_Monsters.png',
    };
    const material = new THREE.MeshStandardMaterial({ name: 'Atlas', map: texture });
    root.add(new THREE.Mesh(new THREE.BoxGeometry(), material));

    const assets = collectFbxAssets({
      fileName: 'Bunny.fbx',
      fileSize: 100,
      loadMs: 12,
      root,
      animations: [new THREE.AnimationClip('Walk', 1, [])],
      warnings: [],
    });

    expect(assets.overview.sections[0].fields.some((field) => field.path === 'overview.fileName')).toBe(true);
    expect(assets.textures).toHaveLength(1);
    expect(assets.textures[0]).toMatchObject({
      name: 'base_color_texture',
      slot: 'map',
      materialName: 'Atlas',
      status: 'missing',
      fileName: 'Atlas_Monsters.png',
    });
  });
});

describe('useInspectorData', () => {
  it('does not expose serialized raw objects in the node inspector', () => {
    const root = new THREE.Group();
    root.name = 'Bunny';

    const tabs = useInspectorData(
      ref({
        file: new File(['fbx'], 'Bunny.fbx'),
        fileSize: 3,
        root,
        animations: [],
        loadMs: 1,
        warnings: [],
      } as never),
      ref(root),
    );

    expect(tabs.value.some((tab) => tab.id === 'raw')).toBe(false);
    expect(tabs.value.flatMap((tab) => tab.sections).some((section) => section.id === 'raw')).toBe(false);
  });
});
