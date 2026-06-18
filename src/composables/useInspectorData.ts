import { computed, type ComputedRef, type Ref } from 'vue';
import type * as THREE from 'three';
import type { InspectorField, InspectorSection, LoadedFbx } from '../domain/types';
import { extractAnimationSections } from '../domain/extractors/animationExtractor';
import { collectMaterialTextures, collectMaterials } from '../domain/extractors/materialExtractor';
import { extractMaterialSections } from '../domain/extractors/materialExtractor';
import { extractMeshSections } from '../domain/extractors/meshExtractor';
import { extractOverview } from '../domain/extractors/overviewExtractor';
import { extractNodeSections } from '../domain/extractors/sceneExtractor';
import { extractSkeletonSections } from '../domain/extractors/skeletonExtractor';
import { extractTextureSections } from '../domain/extractors/textureExtractor';
import { serializeThreeObject } from '../utils/threeObjectSerialize';

export type InspectorTab = {
  id: string;
  label: string;
  sections: InspectorSection[];
};

function isMesh(object: THREE.Object3D): object is THREE.Mesh {
  return 'isMesh' in object && object.isMesh === true;
}

function isSkinnedMesh(object: THREE.Object3D): object is THREE.SkinnedMesh {
  return 'isSkinnedMesh' in object && object.isSkinnedMesh === true;
}

function collectObjectTextures(object: THREE.Object3D): THREE.Texture[] {
  const textures = new Set<THREE.Texture>();

  for (const material of collectMaterials((object as { material?: unknown }).material)) {
    for (const [, texture] of collectMaterialTextures(material)) {
      textures.add(texture);
    }
  }

  return Array.from(textures);
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(
      value,
      (_key, child) => (typeof child === 'bigint' ? `${child.toString()}n` : child),
      2,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return `[Unserializable raw object: ${message}]`;
  }
}

function rawSection(object: unknown): InspectorSection {
  const value = serializeThreeObject(object);
  const displayValue = safeStringify(value);
  const field: InspectorField = {
    path: 'raw',
    value,
    displayValue,
    source: 'serializeThreeObject',
    copyValue: displayValue,
  };

  return {
    id: 'raw',
    title: 'Raw Object',
    fields: [field],
  };
}

export function useInspectorData(
  loaded: Ref<LoadedFbx | null>,
  selected: Ref<THREE.Object3D | null>,
): ComputedRef<InspectorTab[]> {
  return computed(() => {
    const fbx = loaded.value;
    if (!fbx) return [];

    const selectedObject = selected.value ?? fbx.root;
    const tabs: InspectorTab[] = [
      {
        id: 'overview',
        label: 'Overview',
        sections: extractOverview({
          fileName: fbx.file.name,
          fileSize: fbx.file.size,
          loadMs: fbx.loadMs,
          root: fbx.root,
          animations: fbx.animations,
          warnings: fbx.warnings,
        }),
      },
      {
        id: 'node',
        label: 'Node',
        sections: extractNodeSections(selectedObject),
      },
    ];

    if (isMesh(selectedObject)) {
      tabs.push({
        id: 'mesh',
        label: 'Mesh',
        sections: extractMeshSections(selectedObject),
      });

      tabs.push({
        id: 'materials',
        label: 'Materials',
        sections: extractMaterialSections(selectedObject.material),
      });

      const textures = collectObjectTextures(selectedObject);
      if (textures.length > 0) {
        tabs.push({
          id: 'textures',
          label: 'Textures',
          sections: textures.flatMap((texture, index) =>
            extractTextureSections(texture).map((section) => ({
              ...section,
              id: textures.length === 1 ? section.id : `${section.id}-${index}`,
              title: textures.length === 1 ? section.title : `${section.title} ${index + 1}`,
            })),
          ),
        });
      }
    }

    if (isSkinnedMesh(selectedObject)) {
      tabs.push({
        id: 'skeleton',
        label: 'Skeleton',
        sections: extractSkeletonSections(selectedObject),
      });
    }

    if (fbx.animations.length > 0) {
      tabs.push({
        id: 'animation',
        label: 'Animation',
        sections: extractAnimationSections(fbx.animations),
      });
    }

    tabs.push({
      id: 'raw',
      label: 'Raw',
      sections: [rawSection(selectedObject)],
    });

    return tabs;
  });
}
