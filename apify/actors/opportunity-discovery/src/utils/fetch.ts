import { Actor } from "apify";

export async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "AfriScout Discovery Actor (https://afriscout.example)",
    },
  });
  if (!response.ok) {
    await Actor.setStatusMessage(`Fetch failed: ${response.status} ${url}`);
    throw new Error(`Fetch failed with status ${response.status} for ${url}`);
  }
  return response.text();
}