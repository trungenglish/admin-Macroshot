# Quickstart: Validate Admin Authentication Integration

**Purpose**: Run static checks and manually verify the end-to-end sign-in behavior. Unit and E2E tests are explicitly excluded.

## Prerequisites

- Node.js 18 or newer
- pnpm 8 or newer
- The NutriPal authentication service running and reachable
- A valid admin or moderator username/password pair
- Browser developer tools with Network, Console, Application/Storage, and Redux DevTools access
- The service implements the consumed [admin login contract](./contracts/admin-login.openapi.yaml)

## Configure and Run

From the repository root:

```powershell
Set-Location nutripal-admin
pnpm install
Set-Content -LiteralPath .env.local -Value 'VITE_API_URL=http://localhost:8000'
pnpm dev
```

Replace `http://localhost:8000` with the API origin for the active environment. Do not append the login path: the client adds `/api/v1/auth/admin/login`. Restart the development server after changing `.env.local`.

Open the URL printed by Vite, normally `http://localhost:5173`.

## Static Verification

Run each command from `nutripal-admin/`:

```powershell
pnpm type-check
pnpm lint
pnpm build
```

Expected result: all three commands exit successfully. No Unit or E2E command or test file is required for this feature.

## Manual Validation Scenarios

### 1. Username semantics and validation

1. Confirm the identifier field is labeled **Username**, uses username autocomplete semantics, and contains no email-specific prompt or validation.
2. Submit both fields empty.
3. Submit a username containing whitespace and a non-empty password.
4. Submit a valid non-email username such as `admin_master` with a non-empty password.

Expected:

- Empty and whitespace-containing usernames show the existing field-specific errors.
- Empty or whitespace-only passwords show the password error.
- Invalid form submissions create no network request.
- A valid non-email username passes client-side validation.

### 2. Request contract

1. Open the browser Network panel and submit valid credentials.
2. Inspect the single login request.

Expected:

- Method is `POST`.
- URL is `${VITE_API_URL}/api/v1/auth/admin/login`.
- Content type is JSON.
- Body contains exactly the credential fields `username` and `password`, not `email`.
- One submit action produces one request.

### 3. Pending state and duplicate prevention

1. Apply network throttling or delay the login response.
2. Submit valid credentials.
3. While the request is pending, press Enter repeatedly and attempt to activate the button.

Expected:

- The button becomes disabled and displays `Signing in...` within 500 ms.
- Redux auth status is `loading`.
- No second login request is created.
- The button leaves the loading state after success or failure.

### 4. Successful authentication

1. Submit credentials accepted by the service.
2. Inspect Redux state, Console, Network response, and browser local storage.

Expected:

- The response maps `data.access_token` to `auth.accessToken`.
- `data.user` maps to `auth.user` with `id`, `fullName`, and `email`.
- Auth status becomes `success` and error is `null`.
- Local storage contains `admin_token` equal to the returned access token.
- Local storage contains no password, refresh token, user profile, status, or error record from this feature.
- Console includes the exact message `Login Successful` without printing credentials or token values.
- The browser navigates to `/admin/ingredients`.

### 5. API-provided authentication error

1. Submit invalid credentials that produce a service error with a user-safe `message` or string `detail`.

Expected:

- Auth status becomes `error`.
- The API-provided user-safe message appears on the form.
- No new token or user is written to state or local storage.
- Editing credentials clears the stale message and permits retry.

### 6. Generic connectivity and malformed-response errors

Exercise each case separately:

- Stop the service or point `VITE_API_URL` at an unreachable origin.
- Delay the service beyond the configured timeout.
- Return a successful HTTP status without `data.access_token`.
- Return a successful HTTP status without a usable `data.user`.

Expected:

- Each case ends in `error`, not `success` or permanent `loading`.
- The form displays `Unable to sign in. Please try again.` when no usable service message exists.
- No `Login Successful` message is logged.
- No new token or profile is stored.

### 7. Storage failure

1. Use browser controls to block storage for the site, then submit valid credentials.

Expected:

- The attempt is reported as an error because the access token could not be retained.
- Redux does not enter the successful state for the new response.
- No success message or navigation occurs.

## Cleanup

Remove the manually stored access token after validation:

```javascript
localStorage.removeItem('admin_token')
```

Stop the Vite development server with `Ctrl+C`.
