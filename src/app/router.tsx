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
        path: 'users',
        lazy: async () => {
          const { UsersPage } =
            await import('@/features/users/pages/UsersPage');

          return { Component: UsersPage };
        },
      },
      {
        path: 'ingredients',
        lazy: async () => {
          const { IngredientsPage } =
            await import('@/features/ingredients/pages/IngredientsPage');

          return { Component: IngredientsPage };
        },
      },
      {
        path: 'ingredients/new',
        lazy: async () => {
          const { IngredientFormPage } =
            await import('@/features/ingredients/pages/IngredientFormPage');

          return { Component: IngredientFormPage };
        },
      },
      {
        path: 'ingredients/:id/edit',
        lazy: async () => {
          const { IngredientFormPage } =
            await import('@/features/ingredients/pages/IngredientFormPage');

          return { Component: IngredientFormPage };
        },
      },
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
