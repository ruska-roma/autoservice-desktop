import { createContext, useContext } from 'react';

interface IAuthContextProps {
  isAuth: boolean;
  setIsAuth: (value: boolean) => void;
}

export const AuthContext = createContext<IAuthContextProps | undefined>(undefined);

export const useAuth = (): IAuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      isAuth: false,
      setIsAuth: () => {
        console.warn('AuthContext not initialized');
      },
    };
  }
  return context;
};
