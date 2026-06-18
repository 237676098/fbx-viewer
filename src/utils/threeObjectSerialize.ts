import { summarizeTypedArray } from './format';

type NumericTypedArray = ArrayBufferView & {
  readonly length: number;
  readonly [index: number]: number | bigint;
};

export type SerializeThreeObjectOptions = {
  maxDepth?: number;
  maxArrayItems?: number;
  maxObjectKeys?: number;
};

const DEFAULT_MAX_DEPTH = 4;
const DEFAULT_MAX_ARRAY_ITEMS = 100;
const DEFAULT_MAX_OBJECT_KEYS = 100;

type ResolvedSerializeOptions = Required<SerializeThreeObjectOptions>;

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

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function serializeValue(
  value: unknown,
  depth: number,
  options: ResolvedSerializeOptions,
  seen: WeakSet<object>,
): unknown {
  if (value === null || typeof value !== 'object') {
    return typeof value === 'function' ? serializeFunction(value) : value;
  }

  if (isTypedArray(value)) return summarizeTypedArray(value);
  if (value instanceof ArrayBuffer) return `ArrayBuffer byteLength=${value.byteLength}`;
  if (isDomElement(value)) return `[DOMElement ${value.nodeName ?? 'Element'}]`;
  if (seen.has(value)) return '[Circular]';
  if (depth >= options.maxDepth) return '[MaxDepth]';

  seen.add(value);

  if (Array.isArray(value)) {
    const output: unknown[] = [];
    const itemCount = Math.min(value.length, options.maxArrayItems);

    for (let index = 0; index < itemCount; index += 1) {
      try {
        output.push(serializeValue(value[index], depth + 1, options, seen));
      } catch (error) {
        output.push(`[Unreadable: ${getErrorMessage(error)}]`);
      }
    }

    const remainingItems = value.length - output.length;
    if (remainingItems > 0) output.push(`[Truncated ${remainingItems} more items]`);

    seen.delete(value);
    return output;
  }

  const output: Record<string, unknown> = {};
  const keys = Object.keys(value);
  const serializedKeys = keys.slice(0, options.maxObjectKeys);

  for (const key of serializedKeys) {
    try {
      const child = (value as Record<string, unknown>)[key];
      output[key] = serializeValue(child, depth + 1, options, seen);
    } catch (error) {
      output[key] = `[Unreadable: ${getErrorMessage(error)}]`;
    }
  }

  const remainingKeys = keys.length - serializedKeys.length;
  if (remainingKeys > 0) {
    output['[Truncated]'] = `${remainingKeys} more keys`;
  }

  seen.delete(value);
  return output;
}

export function serializeThreeObject(value: unknown, options: SerializeThreeObjectOptions = {}): unknown {
  return serializeValue(
    value,
    0,
    {
      maxDepth: options.maxDepth ?? DEFAULT_MAX_DEPTH,
      maxArrayItems: options.maxArrayItems ?? DEFAULT_MAX_ARRAY_ITEMS,
      maxObjectKeys: options.maxObjectKeys ?? DEFAULT_MAX_OBJECT_KEYS,
    },
    new WeakSet<object>(),
  );
}
