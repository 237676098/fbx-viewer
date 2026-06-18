import type * as THREE from 'three';

export type FieldSeverity = 'info' | 'warning';

export type InspectorField = {
  path: string;
  label?: string;
  value: unknown;
  displayValue: string;
  source: string;
  tip?: string;
  severity?: FieldSeverity;
  copyValue?: string;
};

export type InspectorSection = {
  id: string;
  title: string;
  fields: InspectorField[];
};

export type TexturePreviewItem = {
  id: string;
  name: string;
  slot: string;
  materialName: string;
  width: number | null;
  height: number | null;
  previewUrl: string | null;
  fileName?: string | null;
  status?: 'ready' | 'missing' | 'unresolved';
};

export type AssetPanelData = {
  overview: {
    sections: InspectorSection[];
  };
  animations: {
    sections: InspectorSection[];
  };
  textures: TexturePreviewItem[];
  textureSections: InspectorSection[];
};

export type SceneNodeInfo = {
  id: string;
  name: string;
  type: string;
  depth: number;
  object: THREE.Object3D;
  children: SceneNodeInfo[];
};

export type LoadedFbx = {
  file: File;
  root: THREE.Group;
  animations: THREE.AnimationClip[];
  loadMs: number;
  warnings: string[];
  objectUrls?: string[];
};

export type OverviewStats = {
  fileName: string;
  fileSize: number;
  loadMs: number;
  objectCount: number;
  meshCount: number;
  skinnedMeshCount: number;
  materialCount: number;
  textureCount: number;
  animationClipCount: number;
  boneCount: number;
  vertexCount: number;
  triangleCount: number;
  warningCount: number;
};

export type DiagnosticsWarning = {
  id: string;
  message: string;
  path?: string;
};
