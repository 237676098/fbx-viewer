import { describe, expect, it } from 'vitest';
import { getFieldTip } from '../../src/domain/tips/fieldTips';

describe('field tips', () => {
  it('returns exact tips', () => {
    expect(getFieldTip('clip.duration')).toContain('playback');
  });

  it('returns prefix tips', () => {
    expect(getFieldTip('texture.wrapS')).toContain('UVs');
  });

  it('returns pattern tips', () => {
    expect(getFieldTip('animation.tracks.0.times.length')).toContain('keyframe');
  });

  it('returns undefined when no tip exists', () => {
    expect(getFieldTip('unknown.field')).toBeUndefined();
  });
});
