export function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) throw new Error("Chunk size must be positive");
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

export async function chunkAsync<T, R>(
  items: T[],
  size: number,
  worker: (batch: T[], index: number) => Promise<R>,
): Promise<R[]> {
  const batches = chunk(items, size);
  const results: R[] = [];
  for (let i = 0; i < batches.length; i += 1) {
    results.push(await worker(batches[i]!, i));
  }
  return results;
}