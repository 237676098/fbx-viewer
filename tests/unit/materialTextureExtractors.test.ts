import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { extractMaterialSections } from '../../src/domain/extractors/materialExtractor';
import { extractTextureSections } from '../../src/domain/extractors/textureExtractor';

function materialFieldValue(
  sections: ReturnType<typeof extractMaterialSections>,
  path: string,
): unknown {
  return sections.flatMap((section) => section.fields).find((field) => field.path === path)?.value;
}

function textureFieldValue(sections: ReturnType<typeof extractTextureSections>, path: string): unknown {
  return sections.flatMap((section) => section.fields).find((field) => field.path === path)?.value;
}

describe('material and texture extractors', () => {
  it('extracts material fields and texture slots', () => {
    const texture = new THREE.Texture();
    texture.image = { width: 128, height: 64 };
    texture.name = 'Diffuse';
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshStandardMaterial({
      name: 'BodyMat',
      roughness: 0.7,
      metalness: 0.2,
      map: texture,
    });

    const materialSections = extractMaterialSections(material);
    expect(materialFieldValue(materialSections, 'material.name')).toBe('BodyMat');
    expect(materialFieldValue(materialSections, 'material.type')).toBe('MeshStandardMaterial');
    expect(materialFieldValue(materialSections, 'material.roughness')).toBe(0.7);
    expect(materialFieldValue(materialSections, 'material.metalness')).toBe(0.2);
    expect(
      materialSections.flatMap((section) => section.fields).find((field) => field.path === 'material.map')
        ?.displayValue,
    ).toContain('Diffuse');
    expect(materialFieldValue(materialSections, 'material.normalMap')).toBe(null);

    const textureSections = extractTextureSections(texture);
    expect(textureFieldValue(textureSections, 'texture.name')).toBe('Diffuse');
    expect(textureFieldValue(textureSections, 'texture.image.width')).toBe(128);
    expect(textureFieldValue(textureSections, 'texture.image.height')).toBe(64);
    expect(textureFieldValue(textureSections, 'texture.colorSpace')).toBe(THREE.SRGBColorSpace);
    expect(textureFieldValue(textureSections, 'texture.flipY')).toBe(true);
  });

  it('extracts material arrays without throwing on missing textures', () => {
    const materials = [
      new THREE.MeshBasicMaterial({ name: 'One' }),
      new THREE.MeshStandardMaterial({ name: 'Two' }),
    ];

    const sections = extractMaterialSections(materials);

    expect(materialFieldValue(sections, 'material.count')).toBe(2);
    expect(materialFieldValue(sections, 'materials.0.name')).toBe('One');
    expect(materialFieldValue(sections, 'materials.1.name')).toBe('Two');
    expect(materialFieldValue(sections, 'materials.0.map')).toBe(null);
  });

  it('filters invalid material array entries', () => {
    const material = new THREE.MeshBasicMaterial({ name: 'Valid' });

    const sections = extractMaterialSections([material, null, undefined]);

    expect(materialFieldValue(sections, 'material.count')).toBe(1);
    expect(materialFieldValue(sections, 'materials.0.name')).toBe('Valid');
  });

  it('extracts extended texture slots from physical materials', () => {
    const envMap = new THREE.Texture();
    envMap.name = 'StudioEnv';
    const clearcoatMap = new THREE.Texture();
    clearcoatMap.name = 'ClearcoatMask';
    const material = new THREE.MeshPhysicalMaterial({
      name: 'Paint',
      envMap,
      clearcoatMap,
    });

    const sections = extractMaterialSections(material);

    expect(
      sections.flatMap((section) => section.fields).find((field) => field.path === 'material.envMap')
        ?.displayValue,
    ).toContain('StudioEnv');
    expect(
      sections.flatMap((section) => section.fields).find((field) => field.path === 'material.clearcoatMap')
        ?.displayValue,
    ).toContain('ClearcoatMask');
  });

  it('handles textures without browser image dimensions', () => {
    const texture = new THREE.Texture();

    const sections = extractTextureSections(texture);

    expect(textureFieldValue(sections, 'texture.image.width')).toBe(null);
    expect(textureFieldValue(sections, 'texture.image.height')).toBe(null);
  });
});
