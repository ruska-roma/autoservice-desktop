import { ChakraProvider, createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';
import { type PropsWithChildren, useState } from 'react';

import type { ScreenType } from '@/shared/config';
import { AuthContext, ScreenContext, type ScreenStateType } from '@/shared/context';

const config = defineConfig({
  theme: {
    tokens: {
      fonts: {
        body: { value: 'Montserrat, sans-serif' },
        heading: { value: 'Montserrat, sans-serif' },
      },
      colors: {
        gray: {
          200: { value: '#d4d4d8' },
        },
      },
    },
  },
});

const system = createSystem(defaultConfig, config);

export const AppProvider = ({ children }: PropsWithChildren) => {
  const [isAuth, setIsAuth] = useState(false);

  const [screenStates, setScreenStates] = useState<Record<string, ScreenStateType>>({
    client: {},
    auto: {},
  });

  const getScreenState = (key: ScreenType) => screenStates[key] ?? {};

  const setScreenState = (key: ScreenType, newState: Partial<ScreenStateType>) => {
    setScreenStates((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...newState },
    }));
  };

  return (
    <AuthContext.Provider value={{ isAuth, setIsAuth }}>
      <ScreenContext.Provider value={{ getScreenState, setScreenState }}>
        <ChakraProvider value={system}>{children}</ChakraProvider>
      </ScreenContext.Provider>
    </AuthContext.Provider>
  );
};
