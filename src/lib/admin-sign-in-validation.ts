export type AdminSignInAttempt = {
  email: string;
  password: string;
};

export type AdminSignInErrors = Partial<
  Record<keyof AdminSignInAttempt, string>
>;

function validateEmail(email: string) {
  if (email.trim().length === 0) {
    return 'Enter your email address.';
  }

  const atIndex = email.indexOf('@');
  const hasOneAtSign = atIndex > 0 && atIndex === email.lastIndexOf('@');
  const hasDomain = atIndex < email.length - 1;
  const containsWhitespace = /\s/.test(email);

  if (!hasOneAtSign || !hasDomain || containsWhitespace) {
    return 'Enter a valid email address.';
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
  email,
  password,
}: AdminSignInAttempt): AdminSignInErrors {
  const errors: AdminSignInErrors = {};
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);

  if (emailError) {
    errors.email = emailError;
  }

  if (passwordError) {
    errors.password = passwordError;
  }

  return errors;
}
