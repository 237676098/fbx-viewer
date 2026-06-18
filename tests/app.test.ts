import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import App from '../src/app/App.vue';

describe('App', () => {
  it('renders the no-file workbench shell', () => {
    const wrapper = mount(App);

    expect(wrapper.find('.app-shell').exists()).toBe(true);
    expect(wrapper.get('.top-bar strong').text()).toBe('FBX Inspector Workbench');
    expect(wrapper.get('h1').text()).toBe('FBX Inspector Workbench');
    expect(wrapper.get('.scene-pane').text()).toContain('Scene');
    expect(wrapper.get('.inspector-pane').text()).toContain('Inspector');
    expect(wrapper.get('.viewport-empty').text()).toContain('No FBX loaded');
    expect(wrapper.get('.timeline-empty').text()).toContain('No animation clips in the current file.');
    expect(wrapper.text()).toContain('No file loaded');
  });
});
