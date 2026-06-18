import { computed, type ComputedRef, type Ref } from 'vue';
import type * as THREE from 'three';
import type {
  AssetPanelData,
  InspectorSection,
  LoadedFbx,
  TexturePreviewItem,
} from '../domain/types';
import { extractAnimationSections } from '../domain/extractors/animationExtractor';
import { collectMaterialTextures, collectMaterials } from '../domain/extractors/materialExtractor';
import { extractMaterialSections } from '../domain/extractors/materialExtractor';
import { extractMeshSections } from '../domain/extractors/meshExtractor';
import { extractOverview } from '../domain/extractors/overviewExtractor';
import { extractNodeSections } from '../domain/extractors/sceneExtractor';
import { extractSkeletonSections } from '../domain/extractors/skeletonExtractor';
import { extractTextureSections } from '../domain/extractors/textureExtractor';

export type InspectorTab = {
  id: string;
  label: string;
  sections: InspectorSection[];
  texturePreviews?: TexturePreviewItem[];
};

function isMesh(object: THREE.Object3D): object is THREE.Mesh {
  return 'isMesh' in object && object.isMesh === true;
}

function isSkinnedMesh(object: THREE.Object3D): object is THREE.SkinnedMesh {
  return 'isSkinnedMesh' in object && object.isSkinnedMesh === true;
}

export type CollectedTexture = {
  texture: THREE.Texture;
  slot: string;
  materialName: string;
};

export function collectObjectTextures(object: THREE.Object3D): CollectedTexture[] {
  const textures = new Map<string, CollectedTexture>();

  object.traverse((child) => {
    for (const material of collectMaterials((child as { material?: unknown }).material)) {
      for (const [slot, texture] of collectMaterialTextures(material)) {
        const key = texture.uuid || `${material.uuid}:${slot}`;
        if (!textures.has(key)) {
          textures.set(key, {
            texture,
            slot,
            materialName: material.name || material.type,
          });
        }
      }
    }
  });

  return Array.from(textures.values());
}

function imageDimension(image: unknown, dimension: 'width' | 'height'): number | null {
  if (!image || typeof image !== 'object') return null;

  const candidate = image as {
    width?: number;
    height?: number;
    videoWidth?: number;
    videoHeight?: number;
    naturalWidth?: number;
    naturalHeight?: number;
  };
  const values =
    dimension === 'width'
      ? [candidate.width, candidate.videoWidth, candidate.naturalWidth]
      : [candidate.height, candidate.videoHeight, candidate.naturalHeight];

  return values.find((value): value is number => typeof value === 'number') ?? null;
}

function texturePreviewUrl(texture: THREE.Texture): string | null {
  const image = texture.image;
  if (!image || typeof image !== 'object') return null;

  const candidate = image as { src?: unknown; currentSrc?: unknown };
  return (
    (typeof candidate.currentSrc === 'string' && candidate.currentSrc) ||
    (typeof candidate.src === 'string' && candidate.src) ||
    null
  );
}

function textureFileName(texture: THREE.Texture): string | null {
  const userData = texture.userData as Record<string, unknown>;
  const candidates = [
    userData.relativeFilename,
    userData.RelativeFilename,
    userData.FileName,
    userData.filename,
    userData.fileName,
    texture.name,
  ];
  const value = candidates.find((candidate): candidate is string => typeof candidate === 'string' && candidate.length > 0);
  if (!value) return null;

  return value.split(/[\\/]/).filter(Boolean).at(-1) ?? value;
}

export function texturePreviewItem(entry: CollectedTexture, index: number): TexturePreviewItem {
  const previewUrl = texturePreviewUrl(entry.texture);
  const width = imageDimension(entry.texture.image, 'width');
  const height = imageDimension(entry.texture.image, 'height');

  return {
    id: entry.texture.uuid || `${entry.materialName}-${entry.slot}-${index}`,
    name: entry.texture.name,
    slot: entry.slot,
    materialName: entry.materialName,
    width,
    height,
    previewUrl,
    fileName: textureFileName(entry.texture),
    status: previewUrl || (width && height) ? 'ready' : 'missing',
  };
}

type FbxAssetInput = {
  fileName: string;
  fileSize: number;
  loadMs: number;
  root: THREE.Group;
  animations: THREE.AnimationClip[];
  warnings: string[];
};

export function collectFbxAssets(input: FbxAssetInput): AssetPanelData {
  const textures = collectObjectTextures(input.root);
  return {
    overview: {
      sections: extractOverview(input),
    },
    animations: {
      sections:
        input.animations.length > 0
          ? extractAnimationSections(input.animations, { includeTracks: false })
          : [],
    },
    textures: textures.map(texturePreviewItem),
    textureSections: textures.flatMap((entry, index) =>
      extractTextureSections(entry.texture, {
        slot: entry.slot,
        materialName: entry.materialName,
      }).map((section) => ({
        ...section,
        id: textures.length === 1 ? section.id : `${section.id}-${index}`,
        title: `${entry.slot} - ${entry.texture.name || entry.materialName || `纹理 ${index + 1}`}`,
      })),
    ),
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
        id: 'node',
        label: '节点',
        sections: extractNodeSections(selectedObject),
      },
    ];

    if (isMesh(selectedObject)) {
      tabs.push({
        id: 'mesh',
        label: '网格',
        sections: extractMeshSections(selectedObject),
      });

      tabs.push({
        id: 'materials',
        label: '材质',
        sections: extractMaterialSections(selectedObject.material),
      });
    }

    if (isSkinnedMesh(selectedObject)) {
      tabs.push({
        id: 'skeleton',
        label: '骨骼',
        sections: extractSkeletonSections(selectedObject),
      });
    }
    const textures = collectObjectTextures(selectedObject);
    if (textures.length > 0) {
      tabs.push({
        id: 'textures',
        label: '纹理',
        texturePreviews: textures.map(texturePreviewItem),
        sections: textures.flatMap((entry, index) =>
          extractTextureSections(entry.texture, {
            slot: entry.slot,
            materialName: entry.materialName,
          }).map((section) => ({
            ...section,
            id: textures.length === 1 ? section.id : `${section.id}-${index}`,
            title: `${entry.slot} - ${entry.texture.name || entry.materialName || `纹理 ${index + 1}`}`,
          })),
        ),
      });
    }

    return tabs;
  });
}

export function useAssetPanelData(loaded: Ref<LoadedFbx | null>): ComputedRef<AssetPanelData | null> {
  return computed(() => {
    const fbx = loaded.value;
    if (!fbx) return null;

    return collectFbxAssets({
      fileName: fbx.file.name,
      fileSize: fbx.file.size,
      loadMs: fbx.loadMs,
      root: fbx.root,
      animations: fbx.animations,
      warnings: fbx.warnings,
    });
  });
}
