<script setup lang="ts">
import type { TexturePreviewItem } from '../../domain/types';

withDefaults(defineProps<{
  textures: TexturePreviewItem[];
  compact?: boolean;
}>(), {
  compact: false,
});
</script>

<template>
  <section class="texture-preview-grid" :class="{ compact }" aria-label="纹理预览">
    <article
      v-for="texture in textures"
      :key="texture.id"
      class="texture-preview-card"
      data-texture-preview
    >
      <div class="texture-thumb">
        <img
          v-if="texture.previewUrl"
          :src="texture.previewUrl"
          :alt="texture.name || texture.slot"
        />
        <span v-else>{{ texture.status === 'missing' ? '缺失' : '无预览图' }}</span>
      </div>
      <div class="texture-meta">
        <strong>{{ texture.name || '未命名纹理' }}</strong>
        <span>{{ texture.slot }}</span>
        <span>{{ texture.materialName || '未命名材质' }}</span>
        <span v-if="texture.fileName">{{ texture.fileName }}</span>
        <span>
          {{
            texture.width && texture.height
              ? `${texture.width} x ${texture.height}`
              : '尺寸未知'
          }}
        </span>
        <span v-if="texture.status === 'missing'" class="texture-status">外部纹理未解析</span>
      </div>
    </article>
  </section>
</template>

<style scoped>
.texture-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
  margin-bottom: 10px;
}

.texture-preview-grid.compact {
  grid-template-columns: 1fr;
  gap: 0;
  margin: 2px 8px 6px;
  overflow: hidden;
  border-radius: 3px;
  border: 0;
  background: transparent;
}

.texture-preview-grid.compact .texture-preview-card {
  grid-template-columns: 44px minmax(0, 1fr);
  min-height: 56px;
  padding: 6px 6px;
  border: 0;
  border-bottom: 1px solid rgba(78, 91, 112, 0.16);
  border-radius: 0;
  background: transparent;
}

.texture-preview-grid.compact .texture-preview-card:last-child {
  border-bottom: 0;
}

.texture-preview-grid.compact .texture-thumb {
  width: 44px;
  height: 44px;
}

.texture-preview-grid.compact .texture-meta {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: baseline;
  column-gap: 8px;
}

.texture-preview-grid.compact .texture-meta strong {
  grid-column: 1 / -1;
}

.texture-preview-grid.compact .texture-status {
  grid-column: 1 / -1;
}

.texture-preview-card {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  gap: 8px;
  min-width: 0;
  padding: 8px;
  border: 1px solid #252c37;
  border-radius: 4px;
  background: #11161d;
}

.texture-thumb {
  display: grid;
  width: 56px;
  height: 56px;
  place-items: center;
  overflow: hidden;
  border: 1px solid #303743;
  border-radius: 3px;
  background:
    linear-gradient(45deg, #19202a 25%, transparent 25%),
    linear-gradient(-45deg, #19202a 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #19202a 75%),
    linear-gradient(-45deg, transparent 75%, #19202a 75%);
  background-color: #0d1118;
  background-position:
    0 0,
    0 8px,
    8px -8px,
    -8px 0;
  background-size: 16px 16px;
  color: #8f9aaa;
  font-size: 11px;
  text-align: center;
}

.texture-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.texture-meta {
  display: grid;
  min-width: 0;
  align-content: start;
  gap: 2px;
  color: #9aa6b7;
  font-size: 11px;
}

.texture-meta strong {
  min-width: 0;
  overflow: hidden;
  color: #edf3fb;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.texture-status {
  color: #f3c46b;
}
</style>
