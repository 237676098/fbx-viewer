import { describe, expect, it } from 'vitest';
import { serializeThreeObject } from '../../src/utils/threeObjectSerialize';

describe('serializeThreeObject', () => {
  it('handles cycles, functions, arrays, and max depth safely', () => {
    const value: Record<string, unknown> = {
      name: 'Root',
      callback: function update() {
        return undefined;
      },
      nested: [{ enabled: true }],
    };
    value.self = value;

    const serialized = serializeThreeObject(value, { maxDepth: 2 }) as Record<string, unknown>;

    expect(serialized.name).toBe('Root');
    expect(serialized.callback).toBe('[Function update]');
    expect(serialized.self).toBe('[Circular]');
    expect(serialized.nested).toEqual(['[MaxDepth]']);
  });

  it('summarizes typed arrays and skips DOM-like internals', () => {
    const canvas = {
      nodeType: 1,
      nodeName: 'CANVAS',
      width: 128,
      getContext: () => undefined,
    };

    expect(serializeThreeObject(new Float32Array([1, 2, 3, 4, 5]))).toBe(
      'Float32Array length=5 sample=[1, 2, 3, 4]',
    );
    expect(serializeThreeObject(canvas)).toBe('[DOMElement CANVAS]');
  });
});
