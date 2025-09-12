import { toaster } from '@/shared/ui/toaster';

export function handleApiError(error: unknown, fallbackMessage = 'Произошла ошибка') {
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : fallbackMessage;

  toaster.create({
    title: 'Ошибка',
    description: message,
    closable: true,
    type: 'error',
  });
}
