export interface RetryOptions {
  /** Maximum number of attempts (default: 3) */
  attempts?: number;
  /** Base delay in milliseconds (default: 1000) */
  delayMs?: number;
  /** Whether to use exponential backoff (default: true) */
  exponential?: boolean;
}

/**
 * Executes a function, retrying it if it throws an error.
 *
 * @param fn - The async function to retry
 * @param options - Configurable options for attempts and backoff
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const attempts = options.attempts ?? 3;
  let delay = options.delayMs ?? 1000;
  const exponential = options.exponential ?? true;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === attempts) {
        throw error;
      }

      // Delay before next attempt
      await new Promise((resolve) => setTimeout(resolve, delay));

      if (exponential) {
        delay *= 2;
      }
    }
  }

  throw new Error("Unreachable");
}
