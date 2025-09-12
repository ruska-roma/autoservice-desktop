import '@/shared/assets/styles/main.scss';

import React, { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router';

import { SCREENS, type ScreenType } from '@/shared/config';
import { PrivateRoute } from '@/shared/lib';
import { Layout, Preloader, Toaster } from '@/shared/ui';

import { AppProvider } from './appProvider';

const LoginScreen = lazy(() =>
  import('@/screens/login').then((module) => ({ default: module.Login })),
);
const ClientListScreen = lazy(() =>
  import('@/screens/clientList').then((module) => ({ default: module.ClientList })),
);
const ClientDetailsScreen = lazy(() =>
  import('@/screens/clientDetails').then((module) => ({ default: module.ClientDetails })),
);
const AutoListScreen = lazy(() =>
  import('@/screens/autoList').then((module) => ({ default: module.AutoList })),
);
const AccountListScreen = lazy(() =>
  import('@/screens/accountList').then((module) => ({ default: module.AccountList })),
);
const AccountDetailsScreen = lazy(() =>
  import('@/screens/accountDetails').then((module) => ({ default: module.AccountDetails })),
);
const SettingsScreen = lazy(() =>
  import('@/screens/settings').then((module) => ({ default: module.Settings })),
);
const ErrorScreen = lazy(() =>
  import('@/screens/error').then((module) => ({ default: module.Error })),
);

const SCREEN_ELEMENTS_MAP: Partial<Record<ScreenType, React.ReactNode>> = {
  [SCREENS.ClientList]: <ClientListScreen />,
  [SCREENS.ClientDetails]: <ClientDetailsScreen />,
  [SCREENS.AutoList]: <AutoListScreen />,
  [SCREENS.AccountList]: <AccountListScreen />,
  [SCREENS.AccountDetails]: <AccountDetailsScreen />,
  [SCREENS.Settings]: <SettingsScreen />,
  [SCREENS.Error]: <ErrorScreen />,
};

export const App = () => {
  return (
    <div className="auto-service-app">
      <AppProvider>
        <Toaster />
        <HashRouter>
          <Suspense fallback={<Preloader />}>
            <Routes>
              <Route index path={SCREENS.Login} element={<LoginScreen />} />
              <Route element={<PrivateRoute />}>
                <Route element={<Layout />}>
                  {Object.entries(SCREEN_ELEMENTS_MAP).map(([path, element]) => {
                    return <Route key={path} path={path} element={element} />;
                  })}
                </Route>
              </Route>
              <Route path="*" element={<Navigate to={SCREENS.Error} replace />} />
            </Routes>
          </Suspense>
        </HashRouter>
      </AppProvider>
    </div>
  );
};
