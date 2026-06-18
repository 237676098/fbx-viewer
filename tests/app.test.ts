import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import App from '../src/app/App.vue';

describe('App', () => {
  it('renders the no-file workbench shell', () => {
    const wrapper = mount(App);

    expect(wrapper.find('.app-shell').exists()).toBe(true);
    expect(wrapper.get('.top-bar strong').text()).toBe('FBX Inspector Workbench');
    expect(wrapper.get('h1').text()).toBe('FBX Inspector Workbench');
    expect(wrapper.get('.scene-pane').text()).toContain('场景节点');
    expect(wrapper.get('.inspector-pane').text()).toContain('基础属性');
    expect(wrapper.find('.asset-dock').exists()).toBe(true);
    expect(wrapper.get('.asset-dock').text()).toContain('资产面板');
    expect(wrapper.get('.inspector-pane').text()).not.toContain('资产面板');
    expect(wrapper.get('.viewport-empty').text()).toContain('尚未加载 FBX');
    expect(wrapper.get('.timeline-empty').text()).toContain('当前文件没有动画片段。');
    expect(wrapper.text()).toContain('未加载文件');
    expect(wrapper.find('[data-resize-handle="left"]').exists()).toBe(true);
    expect(wrapper.find('[data-resize-handle="right"]').exists()).toBe(true);
  });
});
