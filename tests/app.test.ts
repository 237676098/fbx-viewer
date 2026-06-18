import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import App from '../src/app/App.vue';

describe('App', () => {
  it('renders the scaffold shell', () => {
    const wrapper = mount(App);

    expect(wrapper.find('.app-shell').exists()).toBe(true);
    expect(wrapper.get('.top-bar strong').text()).toBe('FBX Inspector Workbench');
    expect(wrapper.get('h1').text()).toBe('FBX Inspector Workbench');
    expect(wrapper.text()).toContain('Local model rendering, animation playback, and field-level diagnostics.');
  });
});
