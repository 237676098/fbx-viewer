import type * as THREE from 'three';
import type { InspectorField, InspectorSection } from '../types';
import { getFieldTip } from '../tips/fieldTips';
import { displayUnknown, formatTuple } from '../../utils/format';

type TextureImage = {
  width?: number;
  height?: number;
  videoWidth?: number;
  videoHeight?: number;
  naturalWidth?: number;
  naturalHeight?: number;
};

export type TextureExtractionContext = {
  slot?: string;
  materialName?: string;
};

function field(
  path: string,
  value: unknown,
  displayValue = displayUnknown(value),
  source = 'THREE.Texture',
): InspectorField {
  return { path, value, displayValue, source, tip: getFieldTip(path), copyValue: displayValue };
}

function imageDimension(image: unknown, dimension: 'width' | 'height'): number | null {
  if (!image || typeof image !== 'object') return null;

  const textureImage = image as TextureImage;
  const values =
    dimension === 'width'
      ? [textureImage.width, textureImage.videoWidth, textureImage.naturalWidth]
      : [textureImage.height, textureImage.videoHeight, textureImage.naturalHeight];

  return values.find((value): value is number => typeof value === 'number') ?? null;
}

export function extractTextureSections(
  texture: THREE.Texture,
  context: TextureExtractionContext = {},
): InspectorSection[] {
  return [
    {
      id: 'texture',
      title: context.slot ? `纹理属性：${context.slot}` : '纹理属性',
      fields: [
        field('texture.slot', context.slot ?? null, context.slot ?? 'unknown'),
        field('texture.material', context.materialName ?? null, context.materialName ?? 'unknown'),
        field('texture.name', texture.name, texture.name || '(unnamed)'),
        field('texture.uuid', texture.uuid),
        field('texture.image.width', imageDimension(texture.image, 'width')),
        field('texture.image.height', imageDimension(texture.image, 'height')),
        field('texture.mapping', texture.mapping),
        field('texture.channel', texture.channel),
        field('texture.wrapS', texture.wrapS),
        field('texture.wrapT', texture.wrapT),
        field('texture.magFilter', texture.magFilter),
        field('texture.minFilter', texture.minFilter),
        field('texture.anisotropy', texture.anisotropy),
        field('texture.format', texture.format),
        field('texture.type', texture.type),
        field('texture.colorSpace', texture.colorSpace),
        field('texture.offset', texture.offset.toArray(), formatTuple(texture.offset.toArray())),
        field('texture.repeat', texture.repeat.toArray(), formatTuple(texture.repeat.toArray())),
        field('texture.center', texture.center.toArray(), formatTuple(texture.center.toArray())),
        field('texture.rotation', texture.rotation),
        field('texture.flipY', texture.flipY),
        field('texture.generateMipmaps', texture.generateMipmaps),
      ],
    },
  ];
}
