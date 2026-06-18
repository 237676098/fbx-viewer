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

  it('truncates large arrays with a remaining item summary', () => {
    const serialized = serializeThreeObject([1, 2, 3, 4, 5], { maxArrayItems: 2 });

    expect(serialized).toEqual([1, 2, '[Truncated 3 more items]']);
  });

  it('truncates wide objects with a remaining key summary', () => {
    const serialized = serializeThreeObject(
      { first: 1, second: 2, third: 3, fourth: 4 },
      { maxObjectKeys: 2 },
    ) as Record<string, unknown>;

    expect(serialized).toEqual({
      first: 1,
      second: 2,
      '[Truncated]': '2 more keys',
    });
  });

  it('serializes throwing enumerable getters as unreadable values', () => {
    const value: Record<string, unknown> = { safe: true };
    Object.defineProperty(value, 'danger', {
      enumerable: true,
      get() {
        throw new Error('getter failed');
      },
    });

    const serialized = serializeThreeObject(value) as Record<string, unknown>;

    expect(serialized.safe).toBe(true);
    expect(serialized.danger).toBe('[Unreadable: getter failed]');
  });
});
