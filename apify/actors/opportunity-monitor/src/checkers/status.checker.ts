export function checkStatusChange(input: {
  previousDeadline: string | null;
  currentDeadline: string | null;
}): boolean {
  if (!input.currentDeadline) return false;
  const current = new Date(input.currentDeadline).getTime();
  return Number.isFinite(current) && current < Date.now();
}