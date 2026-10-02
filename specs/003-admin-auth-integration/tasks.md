# Tasks: Admin Authentication Integration

**Input**: Design documents from `/specs/003-admin-auth-integration/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/admin-login.openapi.yaml`, `quickstart.md`

**Tests**: Unit and E2E tests are explicitly excluded. This task list uses static checks and the documented manual acceptance scenarios instead of creating automated test files.

**Organization**: Tasks are grouped by user story so each story can be implemented and manually validated as an increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it targets a different file and has no dependency on an incomplete task
- **[Story]**: Maps implementation work to a user story in `spec.md`
- Every task names the exact repository path it changes or validates

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the requested dependencies and expose typed environment configuration.

- [X] T001 Install `@reduxjs/toolkit`, `react-redux`, and `axios` with pnpm, updating `nutripal-admin/package.json` and `nutripal-admin/pnpm-lock.yaml`
- [X] T002 [P] Declare required `VITE_API_URL` client environment typing in `nutripal-admin/src/vite-env.d.ts`

**Checkpoint**: Required packages and environment typing are available to the application.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the typed HTTP and Redux infrastructure required by every authentication story.

**CRITICAL**: Complete this phase before integrating any user story into the page.

- [X] T003 [P] Define `AdminSignInCredentials`, wire-response, normalized `AdminUser`, `AuthStatus`, and `AuthState` types from the data model in `nutripal-admin/src/types/auth.ts`
- [X] T004 [P] Create the shared Axios instance with required `import.meta.env.VITE_API_URL`, JSON defaults, and a 10-second timeout in `nutripal-admin/src/lib/axios.ts`
- [X] T005 Implement the typed `POST /api/v1/admin/login` adapter, exact `{ username, password }` body, success-envelope validation, and snake_case-to-camelCase mapping per `specs/003-admin-auth-integration/contracts/admin-login.openapi.yaml` in `nutripal-admin/src/services/admin-auth-api.ts`
- [X] T006 Create `loginAdmin`, the `idle/loading/success/error` lifecycle, `accessToken/user/error` state, and pre-fulfillment `admin_token` persistence with storage-failure rejection in `nutripal-admin/src/store/slices/authSlice.ts`
- [X] T007 Configure the `auth` reducer and export `store`, `RootState`, `AppStore`, and `AppDispatch` types in `nutripal-admin/src/store/index.ts`
- [X] T008 [P] Create pre-typed `useAppDispatch`, `useAppSelector`, and `useAppStore` hooks in `nutripal-admin/src/store/hooks.ts`
- [X] T009 [P] Wrap the existing application with React Redux `Provider` using the configured store in `nutripal-admin/src/main.tsx`

**Checkpoint**: The application has a compiled, globally available authentication lifecycle and a normalized login service, but the page still uses its existing presentation until story integration begins.

---

## Phase 3: User Story 1 - Authenticate with Admin Credentials (Priority: P1) MVP

**Goal**: Replace mock submission with one real authentication attempt that stores normalized auth state, persists the access token, logs success, and does not navigate.

**Independent Test**: Submit valid administrator credentials and verify one request is sent, Redux contains the returned access token and user profile, `admin_token` is persisted, Console records exactly `Login Successful` without sensitive values, and the page remains in place.

### Implementation for User Story 1

- [X] T010 [US1] Replace the mock submit branch with typed `loginAdmin({ username, password })` dispatch after existing client validation in `nutripal-admin/src/pages/AdminSignInPage.tsx`
- [X] T011 [US1] Await the dispatched action with `.unwrap()`, log exactly `Login Successful` only on fulfillment, suppress credential/token logging, and keep success navigation absent in `nutripal-admin/src/pages/AdminSignInPage.tsx`

**Checkpoint**: Valid credentials complete the primary real-authentication flow and satisfy the MVP without navigation.

---

## Phase 4: User Story 2 - Submit Username Rather Than Email (Priority: P1)

**Goal**: Ensure every identifier field, type, validation rule, and submitted credential uses username semantics with no email-format dependency.

**Independent Test**: Confirm the form is labeled Username, a non-email username passes, blank or whitespace-containing usernames fail with field feedback, blank passwords fail, invalid forms send no request, and valid payloads contain `username` rather than `email`.

### Implementation for User Story 2

- [X] T012 [P] [US2] Refactor and audit sign-in attempt/error types and validation to use required whitespace-free `username` plus required non-blank `password`, removing any email-format rules in `nutripal-admin/src/lib/admin-sign-in-validation.ts`
- [X] T013 [US2] Finalize Username label, text input type, `name`, autocomplete, local state, field-error bindings, and submitted property names with no email semantics in `nutripal-admin/src/pages/AdminSignInPage.tsx`

**Checkpoint**: Username semantics are consistent from user input through validation and the API payload.

---

## Phase 5: User Story 3 - Understand Sign-In Progress (Priority: P2)

**Goal**: Present an immediate loading state and prevent duplicate requests while one login is pending.

**Independent Test**: Delay the login response, submit once, and verify auth status becomes loading, the button is disabled with `Signing in...` within 500 ms, repeated pointer/Enter submissions create no second request, and the button resets after settlement.

### Implementation for User Story 3

- [X] T014 [P] [US3] Add a `loginAdmin` condition that declines dispatch while auth status is `loading`, plus focused status selectors, in `nutripal-admin/src/store/slices/authSlice.ts`
- [X] T015 [P] [US3] Bind form busy state and the existing shadcn `Button` disabled/`Signing in...` presentation to Redux loading status, including a submit-handler guard and accessible busy feedback, in `nutripal-admin/src/pages/AdminSignInPage.tsx`

**Checkpoint**: Pending authentication is visible and protected against duplicate submissions through both UI and thunk guards.

---

## Phase 6: User Story 4 - Recover from Authentication Errors (Priority: P2)

**Goal**: Display safe API-provided errors when available, fall back for transport or malformed-response failures, and permit a clean retry without losing the username.

**Independent Test**: Exercise invalid credentials, message-less server failure, connectivity/timeout failure, malformed success data, and blocked storage; verify each ends in error with the correct safe message, writes no new auth data, preserves the entered username, clears stale feedback on edit/retry, and never logs success.

### Implementation for User Story 4

- [X] T016 [P] [US4] Add error normalization in priority order `message`, string `detail`, validation-detail `msg` values, then `Unable to sign in. Please try again.` in `nutripal-admin/src/services/admin-auth-api.ts`
- [X] T017 [P] [US4] Add `clearAuthError` and error/status selectors that reset an error outcome to idle without discarding an existing valid token/profile in `nutripal-admin/src/store/slices/authSlice.ts`
- [X] T018 [US4] Connect normalized failures to `rejectWithValue`, map rejected payloads to safe auth errors, and preserve prior valid auth data on failed retries in `nutripal-admin/src/store/slices/authSlice.ts`
- [X] T019 [US4] Render the shared API error through the existing shadcn `FieldError` alert, clear stale auth errors on credential edits or a new attempt, retain username input, and allow retry in `nutripal-admin/src/pages/AdminSignInPage.tsx`

**Checkpoint**: All defined authentication, response, transport, timeout, and persistence failures produce safe recoverable form behavior.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verify security boundaries, repository quality gates, and all manual acceptance outcomes across stories.

- [X] T020 Review `nutripal-admin/src/services/admin-auth-api.ts`, `nutripal-admin/src/store/slices/authSlice.ts`, and `nutripal-admin/src/pages/AdminSignInPage.tsx` to ensure passwords, tokens, refresh tokens, raw responses, and profiles are neither logged nor persistently stored beyond the required `admin_token`, and confirm no success navigation or session restoration was introduced
- [ ] T021 Run `pnpm format:check`, `pnpm type-check`, `pnpm lint`, and `pnpm build` from `nutripal-admin/`, fixing any failures only in files touched by this feature
- [ ] T022 Execute all static and manual scenarios in `specs/003-admin-auth-integration/quickstart.md`, including request shape, loading timing, duplicate prevention, state mapping, local storage, API/generic errors, storage failure, accessibility, and no-navigation checks

**Checkpoint**: The implementation meets all feature requirements without Unit or E2E test creation.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 — Setup**: Starts immediately.
- **Phase 2 — Foundational**: Depends on Phase 1 and blocks page integration.
- **Phase 3 — US1**: Depends on Phase 2 and forms the suggested MVP.
- **Phase 4 — US2**: Depends on Phase 2. It can be implemented before US1, but page edits must be serialized if both stories are active in one worktree.
- **Phase 5 — US3**: Depends on Phase 2 and the page dispatch integration from US1.
- **Phase 6 — US4**: Depends on Phase 2 and the page dispatch integration from US1.
- **Phase 7 — Polish**: Depends on all user stories selected for delivery.

### User Story Dependency Graph

```text
Setup
  └── Foundational
      ├── US1: Real authentication (MVP)
      │   ├── US3: Loading and duplicate prevention
      │   └── US4: Recoverable API and transport errors
      └── US2: Username-only semantics
```

### User Story Independence

- **US1 (P1)**: Can be delivered after Foundation using the currently checked-in username form; it does not require US2 changes to be complete if the audit finds no residual email semantics.
- **US2 (P1)**: Can be implemented and manually verified after Foundation without a successful backend response; coordinate its page edit with US1.
- **US3 (P2)**: Requires a dispatching page from US1 so the pending lifecycle can be observed, but does not require US2 or US4.
- **US4 (P2)**: Requires a dispatching page from US1 so failures can be observed, but does not require US2 or US3.

### Within-Phase Order

- In Foundation, complete T003 and T004 before T005; T005 before T006; T006 before T007; and T007 before T008/T009.
- In US1, complete T010 before T011 because both modify the submit flow in the same file.
- In US2, T012 may run alongside US1 work, but T013 must be integrated without overwriting the completed submit flow.
- In US3, T014 and T015 may run in parallel after US1 because they target different files and use the already-defined loading status.
- In US4, T016 and T017 may run in parallel; complete T018 after both, then T019.
- Complete the security review before static checks, and static checks before the full manual quickstart.

## Parallel Opportunities

- T001 and T002 can run concurrently because dependency installation and environment typing touch different files.
- T003 and T004 can run concurrently after Setup.
- T008 and T009 can run concurrently after the store is configured.
- T012 can run concurrently with early US1 service/page integration because it changes only the validation module; coordinate T013 separately.
- T014 and T015 can run concurrently for US3.
- T016 and T017 can run concurrently for US4.
- Once Foundation is complete, US2 can progress independently while US1 is implemented; US3 and US4 can progress independently after US1.

## Parallel Examples by User Story

### User Story 1

US1 intentionally serializes T010 and T011 because both edit `nutripal-admin/src/pages/AdminSignInPage.tsx`. In parallel, another contributor may perform US2 task T012 in `nutripal-admin/src/lib/admin-sign-in-validation.ts`.

### User Story 2

```text
Task T012: Refactor username validation in nutripal-admin/src/lib/admin-sign-in-validation.ts
Parallel task from US1: Integrate dispatch in nutripal-admin/src/pages/AdminSignInPage.tsx
```

Merge the page work before T013 to avoid overwriting the completed submit flow.

### User Story 3

```text
Task T014: Add duplicate-dispatch protection in nutripal-admin/src/store/slices/authSlice.ts
Task T015: Add loading presentation in nutripal-admin/src/pages/AdminSignInPage.tsx
```

### User Story 4

```text
Task T016: Normalize transport errors in nutripal-admin/src/services/admin-auth-api.ts
Task T017: Add clear-error state behavior in nutripal-admin/src/store/slices/authSlice.ts
```

After both finish, apply T018 and T019 sequentially.

## Implementation Strategy

### MVP First

1. Complete Setup (T001–T002).
2. Complete Foundation (T003–T009).
3. Complete US1 (T010–T011).
4. Stop and manually validate the US1 success criteria before adding secondary states.

### Incremental Delivery

1. Deliver US1 for the live successful-login path.
2. Complete US2 to guarantee username-only semantics across the form and payload.
3. Complete US3 to expose progress and prevent duplicates.
4. Complete US4 to cover API, transport, malformed-response, and persistence failures.
5. Run the cross-cutting security, static, and manual checks.

### Parallel Team Strategy

1. Complete Setup and Foundation in dependency order, parallelizing only tasks marked `[P]`.
2. After Foundation, assign US1 page integration and US2 validation work to separate contributors.
3. After US1, assign US3 and US4 to separate contributors while serializing their edits to shared files during integration.
4. Run Phase 7 once all selected story branches are integrated.

## Notes

- `[P]` means different files and no dependency on an incomplete task; shared-file edits are deliberately serialized.
- No Unit or E2E test tasks are included, per the feature specification.
- Mark a task complete only after its described behavior is implemented or its validation command/scenario has fresh evidence.
- Keep API wire types, normalized domain types, and page rendering concerns in their planned modules.
- Do not add routing, session restoration, refresh-token handling, logout, or unrelated UI refactors.
