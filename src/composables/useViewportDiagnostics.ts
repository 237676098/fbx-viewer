import { reactive } from 'vue';

export type ViewportDebugFlags = {
  grid: boolean;
  axes: boolean;
  bounds: boolean;
  skeleton: boolean;
  wireframe: boolean;
  normals: boolean;
  materialOverride: boolean;
  textures: boolean;
  exposure: number;
};

export function useViewportDiagnostics() {
  const flags = reactive<ViewportDebugFlags>({
    grid: false,
    axes: true,
    bounds: false,
    skeleton: false,
    wireframe: false,
    normals: false,
    materialOverride: false,
    textures: true,
    exposure: 1,
  });

  return { flags };
}
