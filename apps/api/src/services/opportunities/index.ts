export * from "./opportunity.service";
export * from "./ingestion.service";
export * from "./normalization.service";
export * from "./validation.service";
export * from "./deduplication.service";
export * from "./similarity.service";
export * from "./verification.service";
export * from "./changeDetection.service";

// versioning.service exports createVersion and listVersions which also
// exist in canonical.service. Re-export them explicitly from versioning
// under a different name, and let canonical.service own the canonical names.
export {
  createVersion as createOpportunityVersion,
  listVersions as listOpportunityVersions,
} from "./versioning.service";

export {
  createVersion,
  listVersions,
  upsertCanonicalOpportunity,
} from "./canonical.service";

export * from "./expiry.service";
export * from "./search.service";
export * from "./filter.service";