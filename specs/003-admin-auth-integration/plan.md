# Implementation Plan: Admin Authentication Integration

**Branch**: None (no active feature branch) | **Date**: 2026-09-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-admin-auth-integration/spec.md` plus the requester-specified Redux Toolkit, React Redux, Axios, environment URL, login endpoint, payload, and token-persistence constraints.

## Summary

Replace the existing mock admin sign-in submission with a typed Redux Toolkit authentication flow. A shared Axios client will read `VITE_API_URL`, a dedicated service will post `{ username, password }` to `/api/v1/auth/admin/login`, and an async auth action will normalize the documented response envelope, persist only the access token under `admin_token`, and update shared access-token, user-profile, status, and error state. `AdminSignInPage` will retain its field validation while dispatching the real flow, preventing duplicate submissions, presenting loading and API errors, logging `Login Successful` after a fulfilled dispatch, and navigating to `/admin/ingredients` after success.

## Technical Context

**Language/Version**: TypeScript 5.9.3, React 19.2.0, ECMAScript 2022 target

**Primary Dependencies**: Existing Vite 7.2.4, Tailwind CSS 4.1.17, and shadcn/Radix UI; add `@reduxjs/toolkit`, `react-redux`, and `axios`

**Storage**: In-memory Redux state for the current auth state; browser `localStorage` key `admin_token` for the access token only

**Testing**: Automated Unit and E2E tests are explicitly excluded; verification uses `pnpm type-check`, `pnpm lint`, `pnpm build`, and the manual scenarios in `quickstart.md`

**Target Platform**: Modern desktop and mobile web browsers supported by the existing Vite SPA

**Project Type**: Single frontend web application in `nutripal-admin/`

**Performance Goals**: Loading feedback appears within 500 ms of submission; one pending attempt produces at most one request; success or error UI updates within one second after the service response is received

**Constraints**: Use `{ username, password }`; call `POST /api/v1/auth/admin/login`; source the base URL from `import.meta.env.VITE_API_URL`; persist no password or refresh token; do not restore sessions, refresh tokens, or protect routes; navigate to `/admin/ingredients` after success; preserve the existing shadcn `FieldGroup`/`Field` validation composition, native `disabled` button behavior, and assistive-technology feedback

**Scale/Scope**: One existing page, one validation module, one Axios instance, one auth service adapter, one Redux store, one auth slice/thunk, one typed hooks module, and the application entry point

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

### Pre-Design Gate

- **PASS — Governance**: `.specify/memory/constitution.md` contains only unresolved template placeholders and therefore defines no ratified, enforceable project gates.
- **PASS — Test scope**: The requester explicitly excludes Unit and E2E tests. Static compilation, linting, production build, and documented manual scenarios provide the permitted verification coverage.
- **PASS — Scope**: The design is confined to the existing admin sign-in flow and its required client-side infrastructure; route protection, navigation, refresh, logout, and server changes remain outside scope.
- **PASS — Security boundary**: The access token is persisted only because it is an explicit requirement. Passwords, refresh tokens, raw responses, and user profiles are not written to persistent storage.

### Post-Design Re-check

- **PASS**: Phase 1 artifacts introduce no additional constitutional violation or unresolved clarification.
- **PASS**: The data model limits persistent data to the access token, the interface contract contains only the requested login operation, and the quickstart honors the explicit automated-test exclusion.

## Project Structure

### Documentation (this feature)

```text
specs/003-admin-auth-integration/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── admin-login.openapi.yaml
└── tasks.md                         # Created later by /speckit-tasks
```

### Source Code (repository root)

```text
nutripal-admin/
├── package.json                     # Add Redux Toolkit, React Redux, Axios
├── pnpm-lock.yaml                   # Dependency lock update
└── src/
    ├── main.tsx                     # Wrap App with Redux Provider
    ├── vite-env.d.ts                # Type VITE_API_URL
    ├── lib/
    │   ├── axios.ts                 # Shared configured Axios instance
    │   └── admin-sign-in-validation.ts
    ├── services/
    │   └── admin-auth-api.ts        # Login request/response normalization
    ├── store/
    │   ├── index.ts                 # configureStore and exported store types
    │   ├── hooks.ts                 # Typed dispatch and selector hooks
    │   └── slices/
    │       └── authSlice.ts         # Auth state, thunk lifecycle, clear-error action
    ├── types/
    │   └── auth.ts                  # API and normalized auth types
    └── pages/
        └── AdminSignInPage.tsx      # Dispatch; existing shadcn loading/error UI; success log
```

**Structure Decision**: Keep authentication infrastructure inside the existing `nutripal-admin` SPA. Separate wire-format handling (`services/admin-auth-api.ts`) from shared state (`store/slices/authSlice.ts`) so snake_case API data and error-envelope details do not leak into the page or store model. Keep the thunk with the auth slice because this feature has one mutation and no broader data-caching requirement. Reuse the installed `Button`, `FieldGroup`, `Field`, and `FieldError` components; no new registry component is needed.
