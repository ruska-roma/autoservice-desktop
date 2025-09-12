import { useEffect, useRef } from 'react';

import type { ScreenType } from '@/shared/config';
import { type ScreenStateType, useScreenContext } from '@/shared/context';

export function useScreenPersistence(key: ScreenType) {
  const { getScreenState, setScreenState } = useScreenContext();
  const ref = useRef<ScreenStateType>(getScreenState?.(key) ?? {});

  const save = () => {
    setScreenState?.(key, ref.current);
  };

  useEffect(() => {
    return () => {
      save();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { stateRef: ref, save };
}
