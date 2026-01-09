export type WithError<T, E> =
  | { success: true; result: T }
  | { success: false; error: E };

export const success = <T>(result: T): WithError<T, never> => ({
  success: true,
  result,
});

export const error = <E>(error: E): WithError<never, E> => ({
  success: false,
  error,
});

export const mapResult = <T, U, E>(
  result: WithError<T, E>,
  fn: (value: T) => U
): WithError<U, E> => (result.success ? success(fn(result.result)) : result);

export const flatMapResult = <T, U, E>(
  result: WithError<T, E>,
  fn: (value: T) => WithError<U, E>
): WithError<U, E> => (result.success ? fn(result.result) : result);

export const flatMapResultAsync = async <T, U, E>(
  result: WithError<T, E>,
  fn: (value: T) => Promise<WithError<U, E>>
): Promise<WithError<U, E>> => (result.success ? fn(result.result) : result);
