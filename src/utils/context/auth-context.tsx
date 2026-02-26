import { createContext, useEffect, useState } from 'react';

import { toast } from 'sonner';

import { api } from '@/configs/api-config';
import { toApiError } from '@/configs/auth/jwt-service';
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
    dispatch(getOwnProfile());
  };

  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = api.getToken();

      if (!token) {
        setIsLoading(false);
        return;
      }

      setAccessToken(token);

      try {
        await dispatch(getOwnProfile({ showGlobalLoading: false }));
      } catch (err) {
        const apiError = toApiError(err);
        toast.error(apiError.message);

        api.removeToken();
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAuth();
  }, [dispatch]);

  return <AuthContext.Provider value={{ isAuthenticated, isLoading, refreshAuth }}>{children}</AuthContext.Provider>;
};

export { AuthContext, AuthContextProvider };
