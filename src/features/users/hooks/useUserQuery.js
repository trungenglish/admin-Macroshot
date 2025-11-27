import { useEffect, useState } from 'react';
import { usersService } from '../services';

export const useUserQuery = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    usersService
      .list()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  return { users, loading };
};
