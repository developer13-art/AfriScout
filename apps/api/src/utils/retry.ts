export interface RetryOptions {
  attempts: number;
  backoffMs: number;
  maxBackoffMs?: number;
  onError?: (error: unknown, attempt: number) => void;
}

export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const { attempts, backoffMs, maxBackoffMs = 60000, onError } = options;
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      onError?.(error, attempt);
      if (attempt === attempts) break;
      const delay = Math.min(maxBackoffMs, backoffMs * 2 ** (attempt - 1));
      await sleep(delay);
    }
  }
  throw lastError;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}