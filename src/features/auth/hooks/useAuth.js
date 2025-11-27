import { useCallback, useState } from 'react';
import { authService } from '../services';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const response = await authService.login(credentials);
      setUser(response);
      return response;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  return { user, loading, login, logout };
};
