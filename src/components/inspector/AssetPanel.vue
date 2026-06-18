<script setup lang="ts">
import type { AssetPanelData } from '../../domain/types';
import FieldTable from './FieldTable.vue';
import TexturePreviewGrid from './TexturePreviewGrid.vue';

defineProps<{
  assets: AssetPanelData | null;
}>();
</script>

<template>
  <aside class="asset-panel">
    <p v-if="!assets" class="inspector-empty">暂无资产数据</p>
    <div v-else class="asset-stack">
      <section class="asset-group">
        <header class="asset-group-header">
          <span>纹理资源</span>
          <small>{{ assets.textures.length }} 项</small>
        </header>
        <TexturePreviewGrid v-if="assets.textures.length" :textures="assets.textures" />
        <p v-else class="inspector-empty">暂无纹理资源</p>
      </section>

      <section class="asset-group">
        <header class="asset-group-header">
          <span>文件概览</span>
          <small>{{ assets.overview.sections.length }} 组</small>
        </header>
        <details v-for="section in assets.overview.sections" :key="section.id" open class="inspector-section">
          <summary>{{ section.title }}</summary>
          <FieldTable :fields="section.fields" />
        </details>
      </section>

      <section class="asset-group">
        <header class="asset-group-header">
          <span>动画资源</span>
          <small>{{ assets.animations.sections.length }} 组</small>
        </header>
        <details v-for="section in assets.animations.sections" :key="section.id" open class="inspector-section">
          <summary>{{ section.title }}</summary>
          <FieldTable :fields="section.fields" />
        </details>
        <p v-if="assets.animations.sections.length === 0" class="inspector-empty">暂无动画资源</p>
      </section>

      <section v-if="assets.textureSections.length" class="asset-group">
        <header class="asset-group-header">
          <span>纹理字段</span>
          <small>{{ assets.textureSections.length }} 组</small>
        </header>
        <details v-for="section in assets.textureSections" :key="section.id" open class="inspector-section">
          <summary>{{ section.title }}</summary>
          <FieldTable :fields="section.fields" />
        </details>
      </section>
    </div>
  </aside>
</template>

<style scoped>
.asset-panel {
  min-height: 0;
}

.asset-stack {
  display: flex;
  gap: 12px;
  padding: 8px;
  overflow-x: auto;
  overflow-y: hidden;
}

.asset-group {
  display: grid;
  gap: 8px;
  min-width: 280px;
  max-width: 520px;
  align-content: start;
  overflow: auto;
}

.asset-group:first-child {
  min-width: 360px;
}

.asset-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 28px;
  padding: 0 2px;
  color: #eef2f8;
  font-weight: 700;
}

.asset-group-header small {
  color: #8792a3;
  font-size: 11px;
}

.inspector-empty {
  margin: 10px;
  color: #8f9aaa;
}
</style>
