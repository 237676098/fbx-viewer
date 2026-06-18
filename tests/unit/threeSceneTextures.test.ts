import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { renderableTextureOrNull } from '../../src/composables/useThreeScene';

describe('three scene texture rendering helpers', () => {
  it('ignores textures without image data so fallback material color stays visible', () => {
    const texture = new THREE.Texture();
    texture.name = 'base_color_texture';

    expect(renderableTextureOrNull(texture)).toBeNull();
  });

  it('keeps textures with browser image dimensions', () => {
    const texture = new THREE.Texture();
    texture.image = { width: 128, height: 64 };

    expect(renderableTextureOrNull(texture)).toBe(texture);
  });

  it('keeps image textures that have a src while dimensions are still loading', () => {
    const texture = new THREE.Texture();
    texture.image = { src: 'blob:texture' };

    expect(renderableTextureOrNull(texture)).toBe(texture);
  });
});
