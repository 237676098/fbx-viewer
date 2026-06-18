import { shallowRef } from 'vue';
import type * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import type { LoadedFbx } from '../domain/types';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function validateFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith('.fbx')) return '请选择 .fbx 文件。';
  if (file.size <= 0) return '选择的 FBX 文件为空。';
  return null;
}

export function parseFbxTextureFileRefs(text: string): Map<string, string> {
  const refs = new Map<string, string>();
  const texturePattern = /TextureNameS\W+([^.\x00\r\n]+).*?(?:RelativeFilename|FileName|Media)S\W+([^.\x00\r\n]+\.(?:png|jpe?g|webp|gif|bmp))/gis;
  let match: RegExpExecArray | null;

  while ((match = texturePattern.exec(text)) !== null) {
    refs.set(match[1].trim(), match[2].trim().split(/[\\/]/).filter(Boolean).at(-1) ?? match[2].trim());
  }

  return refs;
}

async function readTextureRefs(file: File): Promise<Map<string, string>> {
  try {
    return parseFbxTextureFileRefs(await file.text());
  } catch {
    return new Map();
  }
}

function isTexture(value: unknown): value is THREE.Texture {
  return Boolean(value && typeof value === 'object' && 'isTexture' in value && value.isTexture === true);
}

function textureFileCandidates(texture: THREE.Texture, refs: Map<string, string>): string[] {
  const userData = texture.userData as Record<string, unknown>;
  return [
    refs.get(texture.name),
    userData.relativeFilename,
    userData.RelativeFilename,
    userData.FileName,
    userData.filename,
    userData.fileName,
    texture.name,
  ]
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .flatMap((value) => {
      const basename = value.split(/[\\/]/).filter(Boolean).at(-1) ?? value;
      return [value.toLowerCase(), basename.toLowerCase()];
    });
}

function imageFileMap(files: File[]): Map<string, File> {
  const images = new Map<string, File>();
  for (const file of files) {
    if (!file.type.startsWith('image/') && !/\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name)) continue;
    images.set(file.name.toLowerCase(), file);
  }
  return images;
}

function bindExternalTextures(root: THREE.Object3D, files: File[], refs: Map<string, string>): string[] {
  const images = imageFileMap(files);
  if (images.size === 0) return [];

  const objectUrls: string[] = [];

  root.traverse((object) => {
    const material = (object as { material?: unknown }).material;
    const materials = Array.isArray(material) ? material : [material];

    for (const entry of materials) {
      if (!entry || typeof entry !== 'object') continue;
      for (const value of Object.values(entry)) {
        if (!isTexture(value)) continue;

        const fileName = refs.get(value.name);
        if (fileName) {
          value.userData = {
            ...value.userData,
            relativeFilename: fileName,
          };
        }

        const file = textureFileCandidates(value, refs).map((name) => images.get(name)).find(Boolean);
        if (!file) continue;

        const image = new Image();
        const url = URL.createObjectURL(file);
        objectUrls.push(url);
        image.src = url;
        value.image = image;
        value.needsUpdate = true;
      }
    }
  });

  return objectUrls;
}

export function useFbxLoader() {
  const loaded = shallowRef<LoadedFbx | null>(null);
  const loading = shallowRef(false);
  const error = shallowRef<string | null>(null);
  let requestId = 0;

  async function loadFile(file: File, files: File[] = [file]): Promise<LoadedFbx | null> {
    const currentRequestId = ++requestId;
    const validationError = validateFile(file);

    if (validationError) {
      if (currentRequestId === requestId) {
        error.value = validationError;
        loaded.value = null;
        loading.value = false;
      }
      return null;
    }

    error.value = null;
    loading.value = true;
    const loader = new FBXLoader();
    const url = URL.createObjectURL(file);
    const started = performance.now();

    try {
      const [root, textureRefs] = await Promise.all([loader.loadAsync(url), readTextureRefs(file)]);
      const textureUrls = bindExternalTextures(root, files, textureRefs);
      const result: LoadedFbx = {
        file,
        root,
        animations: root.animations ?? [],
        loadMs: performance.now() - started,
        warnings: [],
        objectUrls: textureUrls,
      };

      if (currentRequestId !== requestId) return null;

      loaded.value = result;
      error.value = null;
      return result;
    } catch (caught) {
      const message = `FBX 解析失败：${getErrorMessage(caught)}`;
      if (currentRequestId === requestId) {
        error.value = message;
        loaded.value = null;
      }
      return null;
    } finally {
      URL.revokeObjectURL(url);
      if (currentRequestId === requestId) {
        loading.value = false;
      }
    }
  }

  return { loaded, loading, error, loadFile };
}
