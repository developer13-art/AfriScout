export const SYSTEM_LIFECYCLE = {
  DISCOVERED: "DISCOVERED",
  RAW: "RAW",
  NORMALIZED: "NORMALIZED",
  VALIDATED: "VALIDATED",
  DEDUPLICATED: "DEDUPLICATED",
  VERIFIED: "VERIFIED",
  ANALYZED: "ANALYZED",
  PUBLISHED: "PUBLISHED",
  MONITORED: "MONITORED",
  UPDATED: "UPDATED",
  EXPIRED: "EXPIRED",
} as const;

export type SystemLifecycleKey = keyof typeof SYSTEM_LIFECYCLE;

export const SYSTEM_LIFECYCLE_ORDER: SystemLifecycleKey[] = Object.values(SYSTEM_LIFECYCLE);

export const USER_LIFECYCLE = {
  DISCOVERED: "DISCOVERED",
  REVIEWING: "REVIEWING",
  QUALIFIED: "QUALIFIED",
  PREPARING: "PREPARING",
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  WON: "WON",
  LOST: "LOST",
  WITHDRAWN: "WITHDRAWN",
  DISQUALIFIED: "DISQUALIFIED",
  EXPIRED: "EXPIRED",
} as const;

export type UserLifecycleKey = keyof typeof USER_LIFECYCLE;

export const USER_LIFECYCLE_ORDER: UserLifecycleKey[] = Object.values(USER_LIFECYCLE);

export const SYSTEM_LIFECYCLE_LABELS: Record<SystemLifecycleKey, string> = {
  DISCOVERED: "Discovered",
  RAW: "Raw",
  NORMALIZED: "Normalized",
  VALIDATED: "Validated",
  DEDUPLICATED: "Deduplicated",
  VERIFIED: "Verified",
  ANALYZED: "Analyzed",
  PUBLISHED: "Published",
  MONITORED: "Monitored",
  UPDATED: "Updated",
  EXPIRED: "Expired",
};

export const USER_LIFECYCLE_LABELS: Record<UserLifecycleKey, string> = {
  DISCOVERED: "Discovered",
  REVIEWING: "Reviewing",
  QUALIFIED: "Qualified",
  PREPARING: "Preparing",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  WON: "Won",
  LOST: "Lost",
  WITHDRAWN: "Withdrawn",
  DISQUALIFIED: "Disqualified",
  EXPIRED: "Expired",
};