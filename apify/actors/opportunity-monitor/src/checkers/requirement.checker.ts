export function checkRequirementChange(
  previous: string | null | undefined,
  current: string | null | undefined,
): boolean {
  if (!previous && !current) return false;
  return (previous ?? "").trim() !== (current ?? "").trim();
}