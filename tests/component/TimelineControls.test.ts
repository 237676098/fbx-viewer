import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TimelineControls from '../../src/components/viewport/TimelineControls.vue';

describe('TimelineControls', () => {
  const baseProps = {
    clips: [
      { id: 'clip-0', label: 'CharacterArmature|Idle' },
      { id: 'clip-1', label: 'CharacterArmature|Run' },
      { id: 'clip-2', label: 'Run' },
    ],
    currentClipId: 'clip-0',
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

    expect(wrapper.get('select[aria-label="动画片段"]').text()).toContain('Idle');
    expect(wrapper.get('select[aria-label="动画片段"]').text()).toContain('Run');
    expect(wrapper.findAll('select[aria-label="动画片段"] option').map((option) => option.attributes('value'))).toEqual([
      'clip-0',
      'clip-1',
      'clip-2',
    ]);
    expect(wrapper.get('select[aria-label="动画片段"] option').text()).toBe('Idle');
    expect(wrapper.get('select[aria-label="动画片段"] option').attributes('data-rig')).toBe('CharacterArmature');
    expect(wrapper.find('button[aria-label="播放"]').exists()).toBe(true);
    expect(wrapper.find('button[aria-label="停止"]').exists()).toBe(true);
    expect(wrapper.get('input[aria-label="动画时间"]').attributes('max')).toBe('3.5');
    expect(wrapper.text()).toContain('1.250s / 3.500s');
    expect(wrapper.text()).toContain('6 轨道');
    expect(wrapper.text()).toContain('48 关键帧');
    expect(wrapper.text()).toContain('3 节点');
  });

  it('emits controls for playback, stepping, scrubbing, clip, speed, and loop changes', async () => {
    const wrapper = mount(TimelineControls, {
      props: baseProps,
    });

    await wrapper.get('button[aria-label="播放"]').trigger('click');
    await wrapper.get('button[aria-label="停止"]').trigger('click');
    await wrapper.get('button[aria-label="上一帧"]').trigger('click');
    await wrapper.get('button[aria-label="下一帧"]').trigger('click');
    await wrapper.get('input[aria-label="动画时间"]').setValue('2');
    await wrapper.get('select[aria-label="动画片段"]').setValue('clip-2');
    await wrapper.get('select[aria-label="播放速度"]').setValue('0.5');
    await wrapper.get('input[aria-label="循环播放"]').setValue(false);

    expect(wrapper.emitted('play')).toHaveLength(1);
    expect(wrapper.emitted('stop')).toHaveLength(1);
    expect(wrapper.emitted('step')?.[0]).toEqual([-1]);
    expect(wrapper.emitted('step')?.[1]).toEqual([1]);
    expect(wrapper.emitted('scrub')?.[0]).toEqual([2]);
    expect(wrapper.emitted('clip-change')?.[0]).toEqual(['clip-2']);
    expect(wrapper.emitted('speed-change')?.[0]).toEqual([0.5]);
    expect(wrapper.emitted('loop-change')?.[0]).toEqual([false]);
  });

  it('shows pause when already playing', () => {
    const wrapper = mount(TimelineControls, {
      props: { ...baseProps, isPlaying: true },
    });

    expect(wrapper.find('button[aria-label="暂停"]').exists()).toBe(true);
  });
});
