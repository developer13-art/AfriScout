export interface SortInput {
  sort?: string;
  order?: "asc" | "desc";
}

const DEFAULT_DIRECTION: "asc" | "desc" = "desc";

export function parseSort<TAllowed extends string>(
  input: SortInput,
  allowed: TAllowed[],
  fallback: TAllowed,
): { field: TAllowed; order: "asc" | "desc" } {
  const requested = (input.sort ?? "").trim();
  const field = (allowed as readonly string[]).includes(requested)
    ? (requested as TAllowed)
    : fallback;
  const order = input.order === "asc" ? "asc" : input.order === "desc" ? "desc" : DEFAULT_DIRECTION;
  return { field, order };
}