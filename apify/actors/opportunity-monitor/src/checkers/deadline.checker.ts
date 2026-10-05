export function checkDeadlineChange(
  previous: string | null | undefined,
  current: string | null | undefined,
): boolean {
  if (!previous && !current) return false;
  return (previous ?? "") !== (current ?? "");
}