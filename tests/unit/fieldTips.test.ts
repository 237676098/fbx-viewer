import { describe, expect, it } from 'vitest';
import { getFieldTip } from '../../src/domain/tips/fieldTips';

describe('field tips', () => {
  it('returns exact tips', () => {
    expect(getFieldTip('clip.duration')).toContain('总播放时长');
  });

  it('returns prefix tips', () => {
    expect(getFieldTip('texture.wrapS')).toContain('UV');
  });

  it('returns pattern tips', () => {
    expect(getFieldTip('animation.tracks.0.times.length')).toContain(
      '关键帧时间点数量',
    );
  });

  it('does not match prefixes inside longer field names', () => {
    expect(getFieldTip('material.mapExtra')).toBeUndefined();
    expect(getFieldTip('object.matrixWorldInverse')).toBeUndefined();
  });

  it('returns undefined when no tip exists', () => {
    expect(getFieldTip('unknown.field')).toBeUndefined();
  });
});
