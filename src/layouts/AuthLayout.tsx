import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAppSelector } from '@/app/store-hooks';
import { selectAccessToken } from '@/features/auth/store/auth-slice';
import { getAdminReturnTo } from '@/features/auth/route-redirect';

export function AuthLayout() {
  const accessToken = useAppSelector(selectAccessToken);
  const location = useLocation();

  if (accessToken)
    return (
      <Navigate
        to={getAdminReturnTo(location.state)}
        replace
      />
    );

  return <Outlet />;
}
