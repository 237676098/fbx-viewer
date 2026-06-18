import type * as THREE from 'three';
import type { InspectorField, InspectorSection } from '../types';
import { getFieldTip } from '../tips/fieldTips';
import { displayUnknown, formatTuple } from '../../utils/format';

function field(
  path: string,
  value: unknown,
  displayValue = displayUnknown(value),
  source = 'THREE.BufferGeometry',
): InspectorField {
  return { path, value, displayValue, source, tip: getFieldTip(path), copyValue: displayValue };
}

export function getTriangleCount(geometry: THREE.BufferGeometry): number {
  if (geometry.index) return Math.floor(geometry.index.count / 3);

  const position = geometry.getAttribute('position');
  return position ? Math.floor(position.count / 3) : 0;
}

function extractAttributeFields(geometry: THREE.BufferGeometry): InspectorField[] {
  return Object.entries(geometry.attributes).flatMap(([name, attribute]) => {
    const path = `geometry.attributes.${name}`;
    return [
      field(`${path}.count`, attribute.count),
      field(`${path}.itemSize`, attribute.itemSize),
      field(`${path}.normalized`, attribute.normalized),
    ];
  });
}

function extractBoundsFields(geometry: THREE.BufferGeometry): InspectorField[] {
  const fields: InspectorField[] = [];

  if (geometry.boundingBox) {
    fields.push(
      field('geometry.boundingBox.min', geometry.boundingBox.min.toArray(), formatTuple(geometry.boundingBox.min.toArray())),
      field('geometry.boundingBox.max', geometry.boundingBox.max.toArray(), formatTuple(geometry.boundingBox.max.toArray())),
    );
  } else {
    fields.push(field('geometry.boundingBox', null));
  }

  if (geometry.boundingSphere) {
    fields.push(
      field(
        'geometry.boundingSphere.center',
        geometry.boundingSphere.center.toArray(),
        formatTuple(geometry.boundingSphere.center.toArray()),
      ),
      field('geometry.boundingSphere.radius', geometry.boundingSphere.radius),
    );
  } else {
    fields.push(field('geometry.boundingSphere', null));
  }

  return fields;
}

function extractGroupFields(geometry: THREE.BufferGeometry): InspectorField[] {
  return [
    field('geometry.groups.length', geometry.groups.length),
    ...geometry.groups.flatMap((group, index) => [
      field(`geometry.groups.${index}.start`, group.start),
      field(`geometry.groups.${index}.count`, group.count),
      field(`geometry.groups.${index}.materialIndex`, group.materialIndex ?? null),
    ]),
  ];
}

export function extractMeshSections(mesh: THREE.Mesh): InspectorSection[] {
  const { geometry } = mesh;
  const indexCount = geometry.index?.count ?? 0;

  return [
    {
      id: 'mesh',
      title: '网格摘要',
      fields: [
        field('mesh.name', mesh.name, mesh.name || '(unnamed)', 'THREE.Mesh'),
        field('mesh.type', mesh.type, undefined, 'THREE.Mesh'),
        field('geometry.uuid', geometry.uuid),
        field('geometry.type', geometry.type),
        field('geometry.index.count', indexCount),
        field('geometry.triangleCount', getTriangleCount(geometry)),
      ],
    },
    {
      id: 'geometry-attributes',
      title: '几何属性',
      fields: extractAttributeFields(geometry),
    },
    {
      id: 'geometry-groups',
      title: '几何分组',
      fields: extractGroupFields(geometry),
    },
    {
      id: 'geometry-bounds',
      title: '包围范围',
      fields: extractBoundsFields(geometry),
    },
  ];
}
