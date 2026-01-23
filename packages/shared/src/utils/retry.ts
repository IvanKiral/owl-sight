import { error, success, type WithError } from "./error.js";

export type DelayStrategy = (attempt: number) => number;

export type RetryPredicate = (error: unknown) => boolean;

export type RetryConfig = {
  readonly maxRetries: number;
  readonly delayStrategy: DelayStrategy;
  readonly isRetryable: RetryPredicate;
  readonly onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const defaultFormatError = (err: unknown): string =>
  err instanceof Error ? err.message : String(err);

export const linearBackoff =
  (baseMs: number): DelayStrategy =>
  (attempt) =>
    baseMs * (attempt + 1);

export const constantDelay =
  (ms: number): DelayStrategy =>
  () =>
    ms;

export const httpStatusRetryable =
  (statuses: readonly number[]): RetryPredicate =>
  (err) => {
    if (!(err instanceof Error)) {
      return false;
    }
    return statuses.some((code) => err.message.includes(String(code)));
  };

export const keywordRetryable =
  (keywords: readonly string[]): RetryPredicate =>
  (err) => {
    if (!(err instanceof Error)) {
      return false;
    }
    const msg = err.message.toLowerCase();
    return keywords.some((kw) => msg.includes(kw.toLowerCase()));
  };

export const anyOf =
  (...predicates: readonly RetryPredicate[]): RetryPredicate =>
  (err) =>
    predicates.some((p) => p(err));

export const withRetry = <T, E = string>(
  operation: () => Promise<T>,
  config: RetryConfig,
  formatError: (err: unknown) => E = defaultFormatError as (err: unknown) => E,
): Promise<WithError<T, E>> => {
  const execute = async (attempt: number): Promise<WithError<T, E>> => {
    try {
      const result = await operation();
      return success(result);
    } catch (err) {
      const isLastAttempt = attempt >= config.maxRetries;

      if (isLastAttempt || !config.isRetryable(err)) {
        return error(formatError(err));
      }

      const delayMs = config.delayStrategy(attempt);
      config.onRetry?.(err, attempt, delayMs);
      await sleep(delayMs);

      return execute(attempt + 1);
    }
  };

  return execute(0);
};

export const createRetry =
  (defaults: RetryConfig) =>
  <T, E = string>(
    operation: () => Promise<T>,
    overrides?: Partial<RetryConfig>,
    formatError?: (err: unknown) => E,
  ): Promise<WithError<T, E>> =>
    withRetry(operation, { ...defaults, ...overrides }, formatError);
