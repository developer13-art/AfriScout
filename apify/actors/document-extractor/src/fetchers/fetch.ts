export async function fetchBuffer(url: string): Promise<{
  buffer: Buffer;
  mimeType: string | null;
}> {
  const response = await fetch(url, {
    headers: { "User-Agent": "AfriScout Document Extractor" },
  });
  if (!response.ok) throw new Error(`Fetch failed with status ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType: response.headers.get("content-type"),
  };
}