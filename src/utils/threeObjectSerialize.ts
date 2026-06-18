import { summarizeTypedArray } from './format';

type NumericTypedArray = ArrayBufferView & {
  readonly length: number;
  readonly [index: number]: number | bigint;
};

export type SerializeThreeObjectOptions = {
  maxDepth?: number;
};

const DEFAULT_MAX_DEPTH = 4;

function isTypedArray(value: unknown): value is NumericTypedArray {
  return ArrayBuffer.isView(value) && !(value instanceof DataView) && 'length' in value;
}

function isDomElement(value: unknown): value is { nodeName?: string } {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as { nodeType?: unknown; nodeName?: unknown };
  return candidate.nodeType === 1 && typeof candidate.nodeName === 'string';
}

function serializeFunction(value: { name?: string }): string {
  return value.name ? `[Function ${value.name}]` : '[Function]';
}

function serializeValue(value: unknown, depth: number, maxDepth: number, seen: WeakSet<object>): unknown {
  if (value === null || typeof value !== 'object') {
    return typeof value === 'function' ? serializeFunction(value) : value;
  }

  if (isTypedArray(value)) return summarizeTypedArray(value);
  if (value instanceof ArrayBuffer) return `ArrayBuffer byteLength=${value.byteLength}`;
  if (isDomElement(value)) return `[DOMElement ${value.nodeName ?? 'Element'}]`;
  if (seen.has(value)) return '[Circular]';
  if (depth >= maxDepth) return '[MaxDepth]';

  seen.add(value);

  if (Array.isArray(value)) {
    const output = value.map((item) => serializeValue(item, depth + 1, maxDepth, seen));
    seen.delete(value);
    return output;
  }

  const output: Record<string, unknown> = {};

  for (const key of Object.keys(value)) {
    const child = (value as Record<string, unknown>)[key];
    output[key] = serializeValue(child, depth + 1, maxDepth, seen);
  }

  seen.delete(value);
  return output;
}

export function serializeThreeObject(value: unknown, options: SerializeThreeObjectOptions = {}): unknown {
  return serializeValue(value, 0, options.maxDepth ?? DEFAULT_MAX_DEPTH, new WeakSet<object>());
}
