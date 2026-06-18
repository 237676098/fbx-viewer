import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { parseFbxTextureFileRefs, useFbxLoader } from '../../src/composables/useFbxLoader';

const loadAsync = vi.fn();

vi.mock('three/examples/jsm/loaders/FBXLoader.js', () => ({
  FBXLoader: vi.fn(function FBXLoaderMock(this: { loadAsync: typeof loadAsync }) {
    this.loadAsync = loadAsync;
  }),
}));

describe('useFbxLoader texture files', () => {
  it('extracts texture-to-file references from FBX text metadata', () => {
    const refs = parseFbxTextureFileRefs(
      'TextureNameS....base_color_texture..Texture.L...........MediaS....Atlas_Monsters.png..Video.L...........RelativeFilenameS....Atlas_Monsters.png',
    );

    expect(refs.get('base_color_texture')).toBe('Atlas_Monsters.png');
  });

  it('binds selected external image files to unresolved FBX textures by filename', async () => {
    const texture = new THREE.Texture();
    texture.name = 'base_color_texture';
    texture.userData = { relativeFilename: 'Atlas_Monsters.png' };
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const root = new THREE.Group();
    root.add(new THREE.Mesh(new THREE.BoxGeometry(), material));
    loadAsync.mockResolvedValueOnce(root);

    const fbx = new File(
      ['TextureNameS....base_color_texture..Texture.L...........RelativeFilenameS....Atlas_Monsters.png'],
      'Bunny.fbx',
      { type: 'application/octet-stream' },
    );
    const image = new File(['png'], 'Atlas_Monsters.png', { type: 'image/png' });
    const loader = useFbxLoader();

    const loaded = await loader.loadFile(fbx, [image]);

    expect(loaded).not.toBeNull();
    expect(texture.image).toBeInstanceOf(Image);
    expect(texture.version).toBeGreaterThan(0);
    expect(loaded?.warnings).toHaveLength(0);
  });
});
