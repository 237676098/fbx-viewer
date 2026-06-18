import type * as THREE from 'three';
import type { InspectorField, InspectorSection } from '../types';
import { getFieldTip } from '../tips/fieldTips';
import { displayUnknown } from '../../utils/format';

function field(
  path: string,
  value: unknown,
  displayValue = displayUnknown(value),
  source = 'THREE.SkinnedMesh',
): InspectorField {
  return { path, value, displayValue, source, tip: getFieldTip(path), copyValue: displayValue };
}

function isSkinnedMesh(object: THREE.Object3D): object is THREE.SkinnedMesh {
  return 'isSkinnedMesh' in object && object.isSkinnedMesh === true;
}

export function extractSkeletonSections(object: THREE.Object3D): InspectorSection[] {
  const skinned = isSkinnedMesh(object);
  const geometry = skinned ? object.geometry : undefined;
  const skeleton = skinned ? object.skeleton : undefined;
  const bones = skeleton?.bones ?? [];

  return [
    {
      id: 'skeleton',
      title: '骨骼绑定',
      fields: [
        field('skeleton.isSkinnedMesh', skinned),
        field('skeleton.bones.length', bones.length),
        field('skeleton.boneInverses.length', skeleton?.boneInverses.length ?? 0),
        ...bones.map((bone, index) =>
          field(`skeleton.bones.${index}.name`, bone.name, bone.name || '(unnamed bone)'),
        ),
        field('geometry.attributes.skinIndex.present', Boolean(geometry?.getAttribute('skinIndex'))),
        field('geometry.attributes.skinWeight.present', Boolean(geometry?.getAttribute('skinWeight'))),
      ],
    },
  ];
}
