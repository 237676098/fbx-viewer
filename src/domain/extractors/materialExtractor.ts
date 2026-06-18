import type * as THREE from 'three';
import type { InspectorField, InspectorSection } from '../types';
import { getFieldTip } from '../tips/fieldTips';
import { displayUnknown, formatTuple } from '../../utils/format';

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

type TextureSlot = (typeof textureSlots)[number];
type MaterialWithOptionalFields = THREE.Material & {
  color?: THREE.Color;
  emissive?: THREE.Color;
  opacity?: number;
  transparent?: boolean;
  roughness?: number;
  metalness?: number;
} & Partial<Record<TextureSlot, THREE.Texture | null>>;

function field(
  path: string,
  value: unknown,
  displayValue = displayUnknown(value),
  source = 'THREE.Material',
): InspectorField {
  return { path, value, displayValue, source, tip: getFieldTip(path), copyValue: displayValue };
}

function colorValue(color: THREE.Color | undefined): number[] | null {
  return color ? color.toArray() : null;
}

function textureDisplay(texture: THREE.Texture | null | undefined): string {
  if (!texture) return 'null';
  return texture.name || texture.uuid || '(unnamed texture)';
}

function extractSingleMaterialFields(material: THREE.Material, prefix: string): InspectorField[] {
  const typedMaterial = material as MaterialWithOptionalFields;
  const fields: InspectorField[] = [
    field(`${prefix}.name`, material.name, material.name || '(unnamed)'),
    field(`${prefix}.uuid`, material.uuid),
    field(`${prefix}.type`, material.type),
    field(`${prefix}.color`, colorValue(typedMaterial.color), colorValue(typedMaterial.color) ? formatTuple(colorValue(typedMaterial.color) ?? []) : 'null'),
    field(`${prefix}.emissive`, colorValue(typedMaterial.emissive), colorValue(typedMaterial.emissive) ? formatTuple(colorValue(typedMaterial.emissive) ?? []) : 'null'),
    field(`${prefix}.opacity`, typedMaterial.opacity ?? null),
    field(`${prefix}.transparent`, typedMaterial.transparent ?? null),
    field(`${prefix}.roughness`, typedMaterial.roughness ?? null),
    field(`${prefix}.metalness`, typedMaterial.metalness ?? null),
  ];

  for (const slot of textureSlots) {
    const texture = typedMaterial[slot] ?? null;
    fields.push(field(`${prefix}.${slot}`, texture, textureDisplay(texture)));
  }

  return fields;
}

export function extractMaterialSections(
  materialOrMaterials: THREE.Material | THREE.Material[],
): InspectorSection[] {
  const materials = Array.isArray(materialOrMaterials) ? materialOrMaterials : [materialOrMaterials];

  if (materials.length === 1 && !Array.isArray(materialOrMaterials)) {
    return [
      {
        id: 'material',
        title: 'Material',
        fields: extractSingleMaterialFields(materials[0], 'material'),
      },
    ];
  }

  return [
    {
      id: 'materials',
      title: 'Materials',
      fields: [
        field('material.count', materials.length),
        ...materials.flatMap((material, index) => extractSingleMaterialFields(material, `materials.${index}`)),
      ],
    },
  ];
}
