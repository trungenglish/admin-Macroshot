import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { AdminSignInBrand } from '@/features/auth/components/AdminSignInBrand';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  validateAdminSignIn,
  type AdminSignInErrors,
} from '@/features/auth/auth.validation';
import { useAppDispatch, useAppSelector } from '@/app/store-hooks';
import {
  clearAuthError,
  loginAdmin,
  selectAuthError,
  selectAuthStatus,
} from '@/features/auth/store/auth-slice';
import type { AdminSignInCredentials } from '@/features/auth/auth.types';
import { getAdminReturnTo } from '@/features/auth/route-redirect';

export function AdminSignInPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const authError = useAppSelector(selectAuthError);
  const authStatus = useAppSelector(selectAuthStatus);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<AdminSignInErrors>({});
  const isLoading = authStatus === 'loading';

  function clearFieldError(field: keyof AdminSignInCredentials) {
    setErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });

    if (authError) {
      dispatch(clearAuthError());
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    const credentials: AdminSignInCredentials = { username, password };
    const nextErrors = validateAdminSignIn(credentials);

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (authError) {
      dispatch(clearAuthError());
    }

    try {
      await dispatch(loginAdmin(credentials)).unwrap();
      console.log('Login Successful');
      navigate(getAdminReturnTo(location.state), { replace: true });
    } catch {
      // The Redux error state is rendered below for a recoverable retry.
    }
  }

  return (
    <main className='bg-muted/30 relative flex min-h-svh items-center justify-center overflow-hidden p-4 sm:p-6'>
      <div
        aria-hidden='true'
        className='bg-primary/10 absolute -top-24 -left-24 size-80 rounded-full blur-3xl'
      />
      <div
        aria-hidden='true'
        className='bg-primary/10 absolute -right-32 -bottom-32 size-96 rounded-full blur-3xl'
      />

      <Card className='relative w-full max-w-md shadow-xl'>
        <CardHeader className='flex flex-col gap-5 text-center'>
          <AdminSignInBrand />
          <div className='flex flex-col gap-2'>
            <CardTitle
              className='text-2xl tracking-tight'
              id='admin-sign-in-title'
            >
              Welcome back
            </CardTitle>
            <CardDescription>
              Enter your credentials to access the admin workspace.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form
            aria-busy={isLoading}
            aria-describedby={authError ? 'admin-sign-in-error' : undefined}
            aria-labelledby='admin-sign-in-title'
            id='admin-sign-in-form'
            noValidate
            onSubmit={handleSubmit}
          >
            <FieldGroup className='gap-5'>
              <Field data-invalid={Boolean(errors.username)}>
                <FieldLabel htmlFor='admin-username'>Username</FieldLabel>
                <Input
                  aria-describedby={
                    errors.username ? 'admin-username-error' : undefined
                  }
                  aria-invalid={Boolean(errors.username)}
                  id='admin-username'
                  name='username'
                  type='text'
                  autoCapitalize='none'
                  autoComplete='username'
                  placeholder='admin'
                  spellCheck={false}
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    clearFieldError('username');
                  }}
                />
                {errors.username ? (
                  <FieldError id='admin-username-error'>
                    {errors.username}
                  </FieldError>
                ) : null}
              </Field>

              <Field data-invalid={Boolean(errors.password)}>
                <FieldLabel htmlFor='admin-password'>Password</FieldLabel>
                <Input
                  aria-describedby={
                    errors.password ? 'admin-password-error' : undefined
                  }
                  aria-invalid={Boolean(errors.password)}
                  id='admin-password'
                  name='password'
                  type='password'
                  autoComplete='current-password'
                  placeholder='Enter your password'
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    clearFieldError('password');
                  }}
                />
                {errors.password ? (
                  <FieldError id='admin-password-error'>
                    {errors.password}
                  </FieldError>
                ) : null}
              </Field>

              {authError ? (
                <Field data-invalid>
                  <FieldError id='admin-sign-in-error'>{authError}</FieldError>
                </Field>
              ) : null}

              <Button
                className='w-full'
                disabled={isLoading}
                type='submit'
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>

        <CardFooter className='flex-col gap-2'>
          <p className='text-muted-foreground text-center text-xs'>
            Authorized NutriPal administrators only
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
