import { shallowRef } from 'vue';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import type { LoadedFbx } from '../domain/types';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function validateFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith('.fbx')) return 'Please choose a .fbx file.';
  if (file.size <= 0) return 'The selected FBX file is empty.';
  return null;
}

export function useFbxLoader() {
  const loaded = shallowRef<LoadedFbx | null>(null);
  const loading = shallowRef(false);
  const error = shallowRef<string | null>(null);

  async function loadFile(file: File): Promise<LoadedFbx | null> {
    const validationError = validateFile(file);
    error.value = validationError;

    if (validationError) {
      loaded.value = null;
      return null;
    }

    loading.value = true;
    const loader = new FBXLoader();
    const url = URL.createObjectURL(file);
    const started = performance.now();

    try {
      const root = await loader.loadAsync(url);
      const result: LoadedFbx = {
        file,
        root,
        animations: root.animations ?? [],
        loadMs: performance.now() - started,
        warnings: [],
      };

      loaded.value = result;
      error.value = null;
      return result;
    } catch (caught) {
      const message = `Failed to parse FBX: ${getErrorMessage(caught)}`;
      error.value = message;
      loaded.value = null;
      return null;
    } finally {
      URL.revokeObjectURL(url);
      loading.value = false;
    }
  }

  return { loaded, loading, error, loadFile };
}
