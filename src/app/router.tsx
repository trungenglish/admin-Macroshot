import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AuthLayout } from '@/layouts/AuthLayout';

export const appRouter = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        lazy: async () => {
          const { AdminSignInPage } =
            await import('@/features/auth/pages/AdminSignInPage');

          return { Component: AdminSignInPage };
        },
      },
    ],
  },
  {
    path: '/admin',
    lazy: async () => {
      const { AdminLayout } = await import('@/layouts/AdminLayout');

      return { Component: AdminLayout };
    },
    children: [
      {
        path: 'nutrients',
        lazy: async () => {
          const { NutrientsPage } =
            await import('@/features/nutrients/pages/NutrientsPage');

          return { Component: NutrientsPage };
        },
      },
    ],
  },
  {
    path: '/',
    element: (
      <Navigate
        to='/login'
        replace
      />
    ),
  },
  {
    path: '*',
    element: (
      <Navigate
        to='/login'
        replace
      />
    ),
  },
]);
