import { createContext, useEffect, useState } from 'react';

import { api } from '@/configs/api-config';
import { getOwnProfile } from '@/features/user/redux/user-slice';
import { useAppDispatch } from '@/redux/hooks';

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshAuth: () => void;
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  refreshAuth: () => {},
});

const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(() => api.getToken());
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = Boolean(accessToken);
  const dispatch = useAppDispatch();

  const refreshAuth = () => {
    const token = api.getToken();
    setAccessToken(token);
  };

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getOwnProfile({ showGlobalLoading: false })).finally(() => setIsLoading(false));
    }
  }, [dispatch, isAuthenticated]);

  return <AuthContext.Provider value={{ isAuthenticated, isLoading, refreshAuth }}>{children}</AuthContext.Provider>;
};

export { AuthContext, AuthContextProvider };
