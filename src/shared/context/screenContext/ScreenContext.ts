import { createContext, useContext } from 'react';

import { type ScreenType } from '@/shared/config';

export type ScreenStateType = {
  selectedField?: string;
  searchQuery?: string;
  page?: number;
  offset?: number;
};

interface IScreenContextProps {
  getScreenState: (key: ScreenType) => ScreenStateType;
  setScreenState: (key: ScreenType, state: Partial<ScreenStateType>) => void;
}

export const ScreenContext = createContext<IScreenContextProps | null>(null);

export const useScreenContext = (): IScreenContextProps => {
  const context = useContext(ScreenContext);
  if (!context) {
    console.warn('Screen context not initialized');
    return {
      getScreenState: () => ({}),
      setScreenState: () => {
        console.warn('Cannot update screen context: not initialized');
      },
    };
  }
  return context;
};
