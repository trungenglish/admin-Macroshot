import type { AdminSignInCredentials } from '@/features/auth/auth.types';

export type AdminSignInErrors = Partial<
  Record<keyof AdminSignInCredentials, string>
>;

function validateUsername(username: string) {
  if (username.trim().length === 0) {
    return 'Enter your username.';
  }

  const containsWhitespace = /\s/.test(username);

  if (containsWhitespace) {
    return 'Username cannot contain spaces.';
  }

  return undefined;
}

function validatePassword(password: string) {
  if (password.trim().length === 0) {
    return 'Enter your password.';
  }

  return undefined;
}

export function validateAdminSignIn({
  username,
  password,
}: AdminSignInCredentials): AdminSignInErrors {
  const errors: AdminSignInErrors = {};
  const usernameError = validateUsername(username);
  const passwordError = validatePassword(password);

  if (usernameError) {
    errors.username = usernameError;
  }

  if (passwordError) {
    errors.password = passwordError;
  }

  return errors;
}
