export interface ParsedDocument {
  text: string;
  mimeType: string | null;
  warnings: string[];
}

export async function parseDocument(buffer: Buffer, mimeType: string | null): Promise<ParsedDocument> {
  const warnings: string[] = [];

  if (!mimeType) {
    return { text: buffer.toString("utf8"), mimeType: null, warnings: ["Unknown mime type"] };
  }

  if (mimeType.includes("pdf")) {
    // PDF text extraction is delegated to the Apify document-extractor actor.
    // The API keeps the raw buffer and lets the actor handle heavy parsing.
    return { text: "", mimeType, warnings: ["PDF parsing delegated to actor"] };
  }

  if (mimeType.includes("html")) {
    const html = buffer.toString("utf8");
    return {
      text: html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      mimeType,
      warnings,
    };
  }

  return { text: buffer.toString("utf8"), mimeType, warnings };
}