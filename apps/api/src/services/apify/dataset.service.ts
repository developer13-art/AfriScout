import { apifyRequest, apifyRequestWithRetry } from "./apify.service";

export interface DatasetItem {
  id?: string;
  [key: string]: unknown;
}

export interface DatasetListResponse {
  items: DatasetItem[];
  total: number;
  offset: number;
  limit: number;
  desc: boolean;
}

export async function fetchDatasetItems(
  datasetId: string,
  options: { limit?: number; offset?: number; clean?: boolean } = {},
): Promise<DatasetItem[]> {
  if (!datasetId) return [];
  const query: Record<string, string | number | boolean> = {
    limit: options.limit ?? 1000,
  };
  if (options.offset) query.offset = options.offset;
  if (options.clean) query.clean = true;

  const response = await apifyRequestWithRetry<DatasetItem[] | DatasetListResponse>(
    `/datasets/${datasetId}/items`,
    { query, attempts: 3, backoffMs: 1000 },
  );

  if (Array.isArray(response)) return response;
  return response.items ?? [];
}

export async function fetchAllDatasetItems(
  datasetId: string,
  options: { pageSize?: number; maxItems?: number } = {},
): Promise<DatasetItem[]> {
  const pageSize = options.pageSize ?? 1000;
  const maxItems = options.maxItems ?? 10_000;
  const results: DatasetItem[] = [];
  let offset = 0;

  while (results.length < maxItems) {
    const page = await fetchDatasetItems(datasetId, {
      limit: pageSize,
      offset,
    });
    results.push(...page);
    if (page.length < pageSize) break;
    offset += pageSize;
  }

  return results.slice(0, maxItems);
}

export async function deleteDataset(datasetId: string): Promise<void> {
  if (!datasetId) return;
  await apifyRequest(`/datasets/${datasetId}`, { method: "DELETE" });
}