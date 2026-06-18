import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TimelineControls from '../../src/components/viewport/TimelineControls.vue';

describe('TimelineControls', () => {
  const baseProps = {
    clips: ['Idle', 'Run'],
    currentClip: 'Idle',
    isPlaying: false,
    currentTime: 1.25,
    duration: 3.5,
    speed: 1,
    loop: true,
    trackCount: 6,
    keyframeCount: 48,
    nodeCount: 3,
  };

  it('renders clips, transport controls, scrubber, stats, and time readout', () => {
    const wrapper = mount(TimelineControls, {
      props: baseProps,
    });

    expect(wrapper.get('select[aria-label="Animation clip"]').text()).toContain('Idle');
    expect(wrapper.get('select[aria-label="Animation clip"]').text()).toContain('Run');
    expect(wrapper.find('button[aria-label="Play"]').exists()).toBe(true);
    expect(wrapper.find('button[aria-label="Stop"]').exists()).toBe(true);
    expect(wrapper.get('input[aria-label="Animation time"]').attributes('max')).toBe('3.5');
    expect(wrapper.text()).toContain('1.250s / 3.500s');
    expect(wrapper.text()).toContain('6 tracks');
    expect(wrapper.text()).toContain('48 keys');
    expect(wrapper.text()).toContain('3 nodes');
  });

  it('emits controls for playback, stepping, scrubbing, clip, speed, and loop changes', async () => {
    const wrapper = mount(TimelineControls, {
      props: baseProps,
    });

    await wrapper.get('button[aria-label="Play"]').trigger('click');
    await wrapper.get('button[aria-label="Stop"]').trigger('click');
    await wrapper.get('button[aria-label="Previous frame"]').trigger('click');
    await wrapper.get('button[aria-label="Next frame"]').trigger('click');
    await wrapper.get('input[aria-label="Animation time"]').setValue('2');
    await wrapper.get('select[aria-label="Animation clip"]').setValue('Run');
    await wrapper.get('select[aria-label="Playback speed"]').setValue('0.5');
    await wrapper.get('input[aria-label="Loop animation"]').setValue(false);

    expect(wrapper.emitted('play')).toHaveLength(1);
    expect(wrapper.emitted('stop')).toHaveLength(1);
    expect(wrapper.emitted('step')?.[0]).toEqual([-1]);
    expect(wrapper.emitted('step')?.[1]).toEqual([1]);
    expect(wrapper.emitted('scrub')?.[0]).toEqual([2]);
    expect(wrapper.emitted('clip-change')?.[0]).toEqual(['Run']);
    expect(wrapper.emitted('speed-change')?.[0]).toEqual([0.5]);
    expect(wrapper.emitted('loop-change')?.[0]).toEqual([false]);
  });

  it('shows pause when already playing', () => {
    const wrapper = mount(TimelineControls, {
      props: { ...baseProps, isPlaying: true },
    });

    expect(wrapper.find('button[aria-label="Pause"]').exists()).toBe(true);
  });
});
