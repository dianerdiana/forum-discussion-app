import { createContext, useLayoutEffect, useState } from 'react';

import { api } from '@/configs/api-config';

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
  const [accessToken, setAccessToken] = useState(() => api.getToken());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useLayoutEffect(() => {
    if (accessToken) {
      setIsAuthenticated(true);
      setAccessToken(accessToken);
    } else {
      setIsAuthenticated(false);
      setAccessToken(null);
    }

    setIsLoading(false);
  }, [accessToken]);

  const refreshAuth = () => {
    const token = api.getToken();
    setAccessToken(token);
  };

  return <AuthContext.Provider value={{ isAuthenticated, isLoading, refreshAuth }}>{children}</AuthContext.Provider>;
};

export { AuthContext, AuthContextProvider };
