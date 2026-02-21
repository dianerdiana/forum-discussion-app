import { useContext } from 'react';

import { AuthContext } from '../context/auth-context';

export const useAuth = () => {
  const { isAuthenticated, isLoading, refreshAuth } = useContext(AuthContext);

  return { isAuthenticated, isLoading, refreshAuth };
};
