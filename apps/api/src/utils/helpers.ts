export function pick<T extends Record<string, unknown>, K extends keyof T>(
  source: T,
  keys: K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (source[key] !== undefined) result[key] = source[key];
  }
  return result;
}

export function omit<T extends Record<string, unknown>, K extends keyof T>(
  source: T,
  keys: K[],
): Omit<T, K> {
  const result = { ...source };
  for (const key of keys) delete result[key];
  return result;
}

export function uniq<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

export function groupBy<T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K,
): Record<K, T[]> {
  const result = {} as Record<K, T[]>;
  for (const item of items) {
    const key = keyFn(item);
    if (!result[key]) result[key] = [];
    result[key]!.push(item);
  }
  return result;
}

export function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}