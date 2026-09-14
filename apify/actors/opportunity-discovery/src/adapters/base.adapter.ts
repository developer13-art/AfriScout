import type { ActorInput, ExtractedOpportunity, RawListingItem } from "../types";

export interface SourceAdapter {
  key: string;
  supports(input: ActorInput): boolean;
  list(input: ActorInput): Promise<RawListingItem[]>;
  extract(input: ActorInput, item: RawListingItem): Promise<ExtractedOpportunity>;
}

export abstract class BaseAdapter implements SourceAdapter {
  abstract key: string;

  supports(input: ActorInput): boolean {
    return input.adapter === this.key;
  }

  abstract list(input: ActorInput): Promise<RawListingItem[]>;
  abstract extract(
    input: ActorInput,
    item: RawListingItem,
  ): Promise<ExtractedOpportunity>;

  protected normalize(text: string | null | undefined): string | null {
    if (!text) return null;
    const value = String(text).replace(/\s+/g, " ").trim();
    return value.length > 0 ? value : null;
  }

  protected toIsoOrNull(value: unknown): string | null {
    if (!value) return null;
    const date = new Date(value as never);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
}