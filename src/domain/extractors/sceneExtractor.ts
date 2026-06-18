import type * as THREE from 'three';
import type { InspectorField, InspectorSection, SceneNodeInfo } from '../types';
import { getFieldTip } from '../tips/fieldTips';
import { displayUnknown, formatTuple } from '../../utils/format';

function field(
  path: string,
  value: unknown,
  displayValue = displayUnknown(value),
  source = 'THREE.Object3D',
): InspectorField {
  return { path, value, displayValue, source, tip: getFieldTip(path), copyValue: displayValue };
}

export function extractSceneNodes(root: THREE.Object3D): SceneNodeInfo[] {
  const visit = (object: THREE.Object3D, depth: number): SceneNodeInfo => ({
    id: object.uuid,
    name: object.name || object.type,
    type: object.type,
    depth,
    object,
    children: object.children.map((child) => visit(child, depth + 1)),
  });

  return [visit(root, 0)];
}

export function extractNodeSections(object: THREE.Object3D): InspectorSection[] {
  const rotation = object.rotation.toArray().slice(0, 3) as number[];
  const parentName = object.parent?.name || object.parent?.uuid || null;

  return [
    {
      id: 'node',
      title: 'Node',
      fields: [
        field('object.name', object.name, object.name || '(unnamed)'),
        field('object.uuid', object.uuid),
        field('object.type', object.type),
        field('object.visible', object.visible),
        field('object.position', object.position.toArray(), formatTuple(object.position.toArray())),
        field('object.rotation', rotation, formatTuple(rotation)),
        field('object.quaternion', object.quaternion.toArray(), formatTuple(object.quaternion.toArray())),
        field('object.scale', object.scale.toArray(), formatTuple(object.scale.toArray())),
        field('object.parent', parentName, parentName ?? 'null'),
        field('object.children.length', object.children.length),
      ],
    },
  ];
}
