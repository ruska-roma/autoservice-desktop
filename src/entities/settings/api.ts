import { errorMiddleware } from '@/shared/lib/error/errorMiddleware';

import type { SettingsType } from './types';

export const getSettingsDetails = () => {
  return errorMiddleware(() => window.api.settingsDetails());
};

export const updateSettings = (data: Partial<SettingsType>) => {
  return errorMiddleware(() => window.api.settingsUpdate(data));
};
