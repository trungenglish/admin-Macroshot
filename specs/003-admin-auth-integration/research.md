# Research: Admin Authentication Integration

**Date**: 2026-09-13

## 1. Shared Authentication State

**Decision**: Create the store with Redux Toolkit `configureStore`, model the login lifecycle in one `authSlice`, and implement `loginAdmin` with `createAsyncThunk`. Export inferred `RootState` and `AppDispatch`, with pre-typed React Redux hooks in a separate `store/hooks.ts` module.

**Rationale**: This directly satisfies the required dependencies and gives the login request explicit pending, fulfilled, and rejected actions. Redux Toolkit includes thunk middleware and development checks in its standard store setup. React Redux recommends pre-typed hooks so thunk-aware dispatch and state types are consistently applied without circular imports.

**Alternatives considered**:

- Component-local state: rejected because authentication must be available globally.
- React Context plus a reducer: rejected because the requester explicitly selected Redux Toolkit and React Redux.
- RTK Query: rejected because Axios is explicitly required and a single login mutation does not justify a second data-fetching abstraction.

**Sources**: [Redux Toolkit `configureStore`](https://redux-toolkit.js.org/api/configureStore), [Redux Toolkit `createAsyncThunk`](https://redux-toolkit.js.org/api/createAsyncThunk), [React Redux TypeScript usage](https://react-redux.js.org/using-react-redux/usage-with-typescript)

## 2. HTTP Client and Environment Configuration

**Decision**: Export one Axios instance from `src/lib/axios.ts` with `baseURL: import.meta.env.VITE_API_URL`, JSON defaults, and a finite 10-second timeout. Treat a missing or blank base URL as configuration failure rather than silently targeting the SPA origin.

**Rationale**: A configured instance centralizes service URL and transport behavior. Vite exposes `VITE_` variables to client code as strings, so the value is appropriate for a public API origin but must never contain a secret. A finite timeout prevents the sign-in UI from remaining pending indefinitely.

**Alternatives considered**:

- Repeating the absolute URL in the service call: rejected because it is environment-specific and duplicates configuration.
- Native `fetch`: rejected because Axios is an explicit dependency requirement.
- No timeout: rejected because a stalled request would leave authentication loading without a deterministic failure.

**Sources**: [Axios instance configuration](https://axios-http.com/docs/instance), [Axios error handling](https://axios-http.com/docs/handling_errors), [Vite environment variables](https://vite.dev/guide/env-and-mode)

## 3. Login Endpoint and Wire Contract

**Decision**: Use `POST /api/v1/auth/admin/login` exactly as requested, with JSON `{ "username": string, "password": string }`. Expect the repository-documented success envelope shape `message` plus `data`, map `data.access_token` to `accessToken`, and map `data.user` to the normalized administrator profile. Additional response fields such as `refresh_token`, `token_type`, and `expires_in` may be present but are not stored by this feature.

**Rationale**: The requester supplied an exact route and payload, which overrides older repository documentation. The repository's admin-auth documentation and existing docs-site client agree on the success envelope and `access_token` field, providing a grounded response model rather than a guessed camelCase response.

**Alternatives considered**:

- `/auth/admin/login`: rejected because it is a legacy route shown in the architecture document, not the route requested for this feature.
- `/api/v1/admin/login`: rejected because the backend now exposes the authentication route under `/api/v1/auth`.
- Storing the raw response envelope in Redux: rejected because it couples UI state to the transport schema and retains unused refresh data.

**Repository evidence**: [Admin authentication contract](../../docs-site/docs/backend/architecture/auth/auth-admin-api.md), [Existing docs-site login client](../../docs-site/src/pages/index.tsx)

## 4. Success, Rejection, and Error Messages

**Decision**: Let the API service normalize a successful response or throw a typed failure. In `loginAdmin`, use `rejectWithValue` for the user-safe message. Extract error text in this order: response `message`, string `detail`, messages from a validation-detail array, then the generic `Unable to sign in. Please try again.` The page dispatches the thunk with `.unwrap()` and logs `Login Successful` only after fulfillment.

**Rationale**: `rejectWithValue` preserves a domain message in the rejected action payload, while `.unwrap()` gives the component ordinary fulfilled/rejected control flow. Axios distinguishes server responses, requests with no response, setup failures, and timeouts; central normalization keeps those technical branches away from the form.

**Alternatives considered**:

- Displaying `error.message` directly: rejected because it can expose technical or inconsistent browser/network text.
- Parsing errors in `AdminSignInPage`: rejected because transport concerns do not belong in the view.
- Logging inside a reducer: rejected because reducers must remain side-effect free.

**Sources**: [Redux Toolkit rejection and unwrap behavior](https://redux-toolkit.js.org/api/createAsyncThunk), [Axios error handling](https://axios-http.com/docs/handling_errors)

## 5. Token Persistence

**Decision**: Persist only the normalized access token under the existing repository convention `admin_token`. Perform `localStorage.setItem` inside the thunk after validating the response and before returning fulfillment. If persistence fails, reject the login so the state cannot claim success without satisfying the persistence requirement.

**Rationale**: Keeping browser storage outside reducers preserves reducer purity. Writing before fulfillment ensures successful Redux state and required persistence cannot diverge. The existing docs-site already uses `admin_token`, avoiding multiple key conventions in the repository.

**Alternatives considered**:

- Persisting the entire auth state or user profile: rejected because it stores unnecessary personal and lifecycle data.
- Persisting `refresh_token`: rejected because refresh behavior is explicitly out of scope.
- Hydrating Redux from the token at startup: rejected because automatic session restoration is explicitly out of scope.
- HttpOnly cookie storage: safer against script access, but rejected for this feature because the requester explicitly requires `localStorage` and changing server cookie behavior is outside scope.

**Security note**: Browser-local tokens are accessible to scripts running on the same origin. The implementation must never log or persist the password, token value, full response, or refresh token.

## 6. Duplicate Submission and State Transitions

**Decision**: Disable the submit button while `auth.status === 'loading'`, guard the page submit handler, and add a thunk `condition` that declines a second request while one is pending. Clear a prior auth error when credentials change or a new attempt begins.

**Rationale**: The disabled button provides visible UX feedback, while handler and thunk guards cover keyboard submission and programmatic double dispatch. Pending and retry transitions remain deterministic.

**Alternatives considered**:

- Button disabling only: rejected because form and programmatic submissions can bypass a pointer-only safeguard.
- Request cancellation/replacement: rejected because the required behavior is to prevent duplicates, not replace an active login.

## 7. Username Validation Migration

**Decision**: Preserve the current validation rules: username is required and contains no whitespace; password is required and cannot be whitespace-only. Verify every form, state, error, label, autocomplete, and payload reference uses `username` and no email-format validation remains.

**Rationale**: The current checked-in sign-in files already use `username`, despite the request describing an Email field. Planning therefore treats this as a required consistency audit plus protection against regression, not as evidence that the requirement can be skipped.

**Alternatives considered**:

- Add email validation: rejected because the API contract requires username.
- Introduce password strength rules: rejected because they are not part of sign-in authentication scope.

## 8. Verification Strategy

**Decision**: Cover the API endpoint and successful-login navigation with focused Vitest tests. Also use TypeScript checking, linting, a production build, and repeatable manual scenarios covering validation, request shape, loading, duplicate prevention, success persistence, response mapping, server errors, generic errors, and navigation to `/admin/ingredients`.

**Rationale**: This follows the explicit test exclusion while still defining evidence needed before completion. The project constitution is an unfilled template and imposes no contrary active test gate.

**Alternatives considered**:

- Add reducer/thunk Unit tests or browser E2E tests: rejected because the requester explicitly excluded both categories.
- Rely on visual inspection alone: rejected because it would not verify types, build integrity, network payload, storage, or Redux transitions.

## 9. Existing shadcn Form Composition

**Decision**: Preserve the installed Radix-based shadcn composition. Keep `FieldGroup` and `Field` around the controls, retain `data-invalid` on invalid fields and `aria-invalid` on inputs, render the API authentication message through the existing `FieldError` live alert, and use the existing `Button` with its native `disabled` prop plus the text `Signing in...`. Do not invent an `isLoading` prop or add a registry component for this change.

**Rationale**: The current page already follows the project's form primitives, and the installed `FieldError` supplies `role="alert"`. Text plus the disabled state satisfies the requested loading indicator without adding a spinner dependency or modifying a shared component.

**Alternatives considered**:

- Custom styled error markup: rejected because the existing form-feedback primitive already provides consistent semantics and styling.
- A new Alert or Spinner registry component: rejected because neither is necessary for the requested behavior and the existing components are sufficient.
- Extending `Button` with an `isLoading` prop: rejected because shadcn buttons are composed using children and native disabled behavior.
