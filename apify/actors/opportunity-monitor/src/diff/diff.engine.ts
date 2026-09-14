export interface DiffInput {
  previous: Record<string, unknown>;
  current: Record<string, unknown>;
}

export interface DiffResult {
  changed: boolean;
  field?: string;
  oldValue?: unknown;
  newValue?: unknown;
}

const TRACKED_FIELDS = [
  "title",
  "deadline",
  "requirements",
  "eligibility",
  "description",
  "valueMin",
  "valueMax",
  "referenceNumber",
];

export function diffSnapshots(input: DiffInput): DiffResult {
  for (const field of TRACKED_FIELDS) {
    const oldValue = input.previous[field];
    const newValue = input.current[field];
    if (JSON.stringify(oldValue ?? null) !== JSON.stringify(newValue ?? null)) {
      return { changed: true, field, oldValue, newValue };
    }
  }
  return { changed: false };
}