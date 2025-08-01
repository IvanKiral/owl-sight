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
