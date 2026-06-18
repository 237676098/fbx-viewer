import { computed, shallowRef } from 'vue';
import type * as THREE from 'three';

export function useSelection() {
  const selected = shallowRef<THREE.Object3D | null>(null);
  const selectedId = computed(() => selected.value?.uuid ?? null);

  function select(object: THREE.Object3D | null): void {
    selected.value = object;
  }

  return { selected, selectedId, select };
}
