import { handleApiError } from './apiError';

export async function errorMiddleware<T>(
  fn: () => Promise<T>,
  fallbackMessage?: string,
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    handleApiError(error, fallbackMessage);
    return null;
  }
}
