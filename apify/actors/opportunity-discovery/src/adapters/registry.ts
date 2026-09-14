import type { ActorInput } from "../types";
import type { SourceAdapter } from "./base.adapter";
import { GovernmentAdapter } from "./government.adapter";
import { UniversityAdapter } from "./university.adapter";
import { NgoAdapter } from "./ngo.adapter";
import { FoundationAdapter } from "./foundation.adapter";
import { AcceleratorAdapter } from "./accelerator.adapter";
import { ProcurementPortalAdapter } from "./procurementPortal.adapter";
import { GrantPortalAdapter } from "./grantPortal.adapter";
import { JobBoardAdapter } from "./jobBoard.adapter";
import { ScholarshipPortalAdapter } from "./scholarshipPortal.adapter";
import { GenericListingAdapter } from "./genericListing.adapter";
import { GenericRssAdapter } from "./genericRss.adapter";
import { GenericSitemapAdapter } from "./genericSitemap.adapter";

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