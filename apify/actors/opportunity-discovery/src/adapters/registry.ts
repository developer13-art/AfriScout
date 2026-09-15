import type { ActorInput } from "../types.js";
import type { SourceAdapter } from "./base.adapter.js";
import { GovernmentAdapter } from "./government.adapter.js";
import { UniversityAdapter } from "./university.adapter.js";
import { NgoAdapter } from "./ngo.adapter.js";
import { FoundationAdapter } from "./foundation.adapter.js";
import { AcceleratorAdapter } from "./accelerator.adapter.js";
import { ProcurementPortalAdapter } from "./procurementPortal.adapter.js";
import { GrantPortalAdapter } from "./grantPortal.adapter.js";
import { JobBoardAdapter } from "./jobBoard.adapter.js";
import { ScholarshipPortalAdapter } from "./scholarshipPortal.adapter.js";
import { GenericListingAdapter } from "./genericListing.adapter.js";
import { GenericRssAdapter } from "./genericRss.adapter.js";
import { GenericSitemapAdapter } from "./genericSitemap.adapter.js";

const adapters: SourceAdapter[] = [
  new GovernmentAdapter(),
  new UniversityAdapter(),
  new NgoAdapter(),
  new FoundationAdapter(),
  new AcceleratorAdapter(),
  new ProcurementPortalAdapter(),
  new GrantPortalAdapter(),
  new JobBoardAdapter(),
  new ScholarshipPortalAdapter(),
  new GenericListingAdapter(),
  new GenericRssAdapter(),
  new GenericSitemapAdapter(),
];

export function selectAdapter(input: ActorInput): SourceAdapter {
  const found = adapters.find((adapter) => adapter.supports(input));
  if (!found) {
    throw new Error(`No adapter found for key: ${input.adapter}`);
  }
  return found;
}

export function listAdapters(): string[] {
  return adapters.map((adapter) => adapter.key);
}