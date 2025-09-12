export const SCREENS = {
  Login: '/',
  ClientList: '/client',
  ClientDetails: '/client/:id',
  AutoList: '/auto',
  AccountList: '/account',
  AccountDetails: '/account/:id',
  Settings: '/settings',
  Error: '/404',
} as const;

export const SCREENS_LIST = Object.values(SCREENS);

export const SCREENS_PATHS = SCREENS_LIST.map((path) => ({ path }));

export type ScreenType = (typeof SCREENS_LIST)[number];
