export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function sleepSeconds(seconds: number): Promise<void> {
  return sleep(seconds * 1000);
}