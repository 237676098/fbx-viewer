type NumericTypedArray = ArrayBufferView & {
  readonly length: number;
  readonly [index: number]: number;
};

export function formatNumber(value: number, digits = 3): string {
  if (Number.isNaN(value)) return 'NaN';
  if (!Number.isFinite(value)) return value > 0 ? 'Infinity' : '-Infinity';
  if (Object.is(value, -0)) return '0';
  if (Number.isInteger(value)) return String(value);

  return value.toFixed(digits).replace(/\.?0+$/, '');
}

export function formatTuple(values: Iterable<number>, digits = 3): string {
  return `[${Array.from(values, (value) => formatNumber(value, digits)).join(', ')}]`;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) return formatNumber(bytes);
  if (bytes === 0) return '0 B';

  const sign = bytes < 0 ? '-' : '';
  const absoluteBytes = Math.abs(bytes);
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const unitIndex = Math.min(
    Math.floor(Math.log(absoluteBytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = absoluteBytes / 1024 ** unitIndex;

  return unitIndex === 0
    ? `${sign}${formatNumber(value, 0)} ${units[unitIndex]}`
    : `${sign}${value.toFixed(2)} ${units[unitIndex]}`;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) return `${formatNumber(seconds)}s`;

  return `${seconds.toFixed(3)}s`;
}

export function summarizeTypedArray(array: NumericTypedArray, sampleSize = 4): string {
  const constructorName = array.constructor.name || 'TypedArray';
  const sample = Array.from(
    { length: Math.min(array.length, sampleSize) },
    (_, index) => array[index],
  );

  return `${constructorName} length=${array.length} sample=${formatTuple(sample)}`;
}

export function displayUnknown(value: unknown): string {
  if (typeof value === 'number') return formatNumber(value);
  if (typeof value === 'string') return value;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'symbol') return value.toString();
  if (typeof value === 'function') return value.name ? `[Function ${value.name}]` : '[Function]';
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (ArrayBuffer.isView(value) && 'length' in value) {
    return summarizeTypedArray(value as NumericTypedArray);
  }

  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}
