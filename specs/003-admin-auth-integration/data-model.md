# Data Model: Admin Authentication Integration

**Date**: 2026-09-13

## Entity: AdminSignInCredentials

Transient values collected by the form and sent once per permitted login attempt.

| Field | Type | Required | Validation | Persistence |
|-------|------|----------|------------|-------------|
| `username` | `string` | Yes | Trimmed value must be non-empty; no whitespace characters; no email-format rule | Never persisted by this feature |
| `password` | `string` | Yes | Trimmed value must be non-empty | Never persisted |

**Invariant**: No API call is allowed while either field has a validation error.

## Entity: AdminLoginApiResponse

Wire-format success envelope consumed from the admin login service.

| Field | Type | Required by client | Mapping/use |
|-------|------|--------------------|-------------|
| `message` | `string` | No | Informational only |
| `data.access_token` | `string` | Yes | Validated as non-empty, mapped to `accessToken` |
| `data.user` | `ApiAdminUser` | Yes | Validated and mapped to `AdminUser` |
| `data.refresh_token` | `string` | No | Ignored and never persisted in this feature |
| `data.token_type` | `string` | No | Ignored |
| `data.expires_in` | `number` | No | Ignored; expiry handling is out of scope |

### ApiAdminUser

| Field | Type | Required | Mapping |
|-------|------|----------|---------|
| `id` | `number` | Yes | `AdminUser.id` |
| `full_name` | `string` | Yes | `AdminUser.fullName` |
| `email` | `string` | Yes | `AdminUser.email` |

Extra server fields may be ignored. A response missing a non-empty access token or a usable user object is rejected as a malformed success response.

## Entity: AdminUser

Normalized administrator profile stored in shared application state.

| Field | Type | Required | Source |
|-------|------|----------|--------|
| `id` | `number` | Yes | `data.user.id` |
| `fullName` | `string` | Yes | `data.user.full_name` |
| `email` | `string` | Yes | `data.user.email` |

**Persistence**: In memory only. Session restoration and profile caching are outside scope.

## Entity: AuthState

Single Redux slice representing the current admin authentication lifecycle.

| Field | Type | Initial value | Rules |
|-------|------|---------------|-------|
| `accessToken` | `string \| null` | `null` | Non-null only after a fulfilled login |
| `user` | `AdminUser \| null` | `null` | Set together with `accessToken` |
| `status` | `AuthStatus` | `'idle'` | One of `idle`, `loading`, `success`, `error` |
| `error` | `string \| null` | `null` | User-safe text only; non-null for an error outcome |

### AuthStatus

```text
idle | loading | success | error
```

### State Transitions

| Current state | Event | Next state | Required updates |
|---------------|-------|------------|------------------|
| `idle`, `error`, or `success` | Valid login dispatched | `loading` | Clear `error`; preserve existing token/profile until the new attempt resolves |
| `loading` | Duplicate login dispatched | `loading` | Decline duplicate; send no additional request |
| `loading` | Valid response and token persistence succeed | `success` | Set `accessToken` and `user`; clear `error` |
| `loading` | Service, response-shape, or persistence failure | `error` | Set user-safe `error`; do not write new token/profile values |
| `error` | Credential input changes / clear-error action | `idle` | Clear `error`; keep form values local to the page |

### Cross-Field Invariants

- `status === 'success'` requires non-null `accessToken` and `user`.
- A newly fulfilled access token must equal the value stored under `admin_token`.
- `status === 'loading'` permits only one active login request.
- Error state contains no password, access-token value, response dump, or stack trace.
- A failed attempt does not overwrite a previously valid token/profile; logout and invalidation are separate features.

## Entity: AuthError

User-safe failure information reduced to a message string in `AuthState.error`.

### Message selection order

1. Non-empty server `message`.
2. Non-empty string server `detail`.
3. Joined `msg` values from a validation-detail array.
4. Generic `Unable to sign in. Please try again.`

Technical metadata such as status code and Axios error code may guide selection but is not displayed or stored in shared auth state.

## Browser Storage Record

| Key | Value | Written | Read |
|-----|-------|---------|------|
| `admin_token` | Successful `accessToken` string | After response validation and before fulfilled state | Not read by this feature |

No password, refresh token, user profile, status, or error message is persisted.
