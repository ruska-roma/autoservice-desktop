import { Navigate, Outlet } from 'react-router';

import { SCREENS } from '@/shared/config';
import { useAuth } from '@/shared/context';

export const PrivateRoute = () => {
  const { isAuth } = useAuth();

  return isAuth ? <Outlet /> : <Navigate to={SCREENS.Login} replace />;
};
