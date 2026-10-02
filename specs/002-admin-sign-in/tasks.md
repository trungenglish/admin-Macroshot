---

description: "Dependency-ordered implementation tasks for the Admin Sign-In feature"
---

# Tasks: Admin Sign-In

**Input**: Design documents from `/specs/002-admin-sign-in/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md`

**Tests**: Automated unit and end-to-end tests are explicitly excluded by the feature specification. Story checkpoints use the manual acceptance scenarios in `quickstart.md` only.

**Organization**: Tasks are grouped by user story so each story can be implemented and manually verified as an independent increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it changes a different file and has no dependency on an incomplete task.
- **[Story]**: Maps the task to a user story from `spec.md` (`US1`, `US2`, or `US3`).
- Every task includes an exact repository-relative file path.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the one missing form primitive required by the planned shadcn composition without replacing existing customized components.

- [X] T001 Review the current shadcn documentation for Field, Input, Card, and Button, then add the official Field primitive with the pnpm project runner and review generated changes in `nutripal-admin/src/components/ui/field.tsx`, `nutripal-admin/src/components/ui/label.tsx`, `nutripal-admin/package.json`, and `nutripal-admin/pnpm-lock.yaml`

**Checkpoint**: The existing Vite, Tailwind CSS 4, and shadcn foundation includes the Field and FieldLabel primitives needed by the sign-in form.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Confirm that the existing application foundation is sufficient before story implementation.

No additional foundational implementation is required. The existing theme provider, semantic color tokens, Button, Input, Card, import aliases, and React entry point already satisfy the shared prerequisites documented in `nutripal-admin/components.json` and `nutripal-admin/src/index.css`.

**Checkpoint**: Phase 1 completion unblocks all story work. The standalone validation and branding modules identified below may be prepared in parallel with the main page.

---

## Phase 3: User Story 1 - Submit Valid Sign-In Details (Priority: P1) MVP

**Goal**: Let an administrator enter a valid username and non-empty password and invoke one local mock submission without authentication, persistence, requests, reload, or navigation.

**Independent Test**: Follow Scenario 1 in `specs/002-admin-sign-in/quickstart.md`; verify one console record contains the entered values and the page does not reload or navigate.

### Implementation for User Story 1

- [X] T002 [US1] Create the controlled username/password form and development-only mock submit handler using FieldGroup, Field, Input, and Button in `nutripal-admin/src/pages/AdminSignInPage.tsx`
- [X] T003 [US1] Render AdminSignInPage as the active admin entry screen while retaining ThemeProvider and removing the dashboard shell from the active render path in `nutripal-admin/src/App.tsx`

**Checkpoint**: A valid username and non-empty password can be submitted by button or keyboard, produces exactly one local diagnostic record, and causes no real authentication side effect.

---

## Phase 4: User Story 2 - Correct Invalid Sign-In Details (Priority: P1)

**Goal**: Block malformed or blank values, show specific accessible field feedback, preserve unaffected input, and permit submission after correction.

**Independent Test**: Follow Scenario 2 in `specs/002-admin-sign-in/quickstart.md`; exercise blank, whitespace-only, missing-`@`, missing-local-part, missing-domain-part, and embedded-whitespace cases and verify that only valid corrected input reaches the mock handler.

### Implementation for User Story 2

- [X] T004 [P] [US2] Define AdminSignInAttempt and field-keyed error types plus deterministic username and password validation helpers in `nutripal-admin/src/lib/admin-sign-in-validation.ts`
- [X] T005 [US2] Integrate validation into submission and correction flows, block invalid mock calls, and expose messages through Field data-invalid, Input aria-invalid, and associated descriptions in `nutripal-admin/src/pages/AdminSignInPage.tsx`

**Checkpoint**: Every invalid case is blocked with understandable field-level feedback, both errors can appear together, the other field retains its value, and correction enables the valid mock flow.

---

## Phase 5: User Story 3 - Recognize and Navigate the Admin Sign-In Screen (Priority: P2)

**Goal**: Present a clearly branded, premium, centered, responsive, keyboard-accessible admin sign-in screen with a visible but intentionally non-functional Forgot Password affordance.

**Independent Test**: Follow Scenario 3 in `specs/002-admin-sign-in/quickstart.md`, inspect widths of 320, 768, and 1440 pixels, traverse the form by keyboard, and confirm Forgot Password causes no navigation, recovery state, or value clearing.

### Implementation for User Story 3

- [X] T006 [P] [US3] Compose the existing icon logo with a visible NutriPal Admin identity using semantic theme tokens in `nutripal-admin/src/components/admin-sign-in/AdminSignInBrand.tsx`
- [X] T007 [US3] Integrate AdminSignInBrand and the full Card header/content/footer composition, then add centered responsive layout and premium semantic styling in `nutripal-admin/src/pages/AdminSignInPage.tsx`
- [X] T008 [US3] Add the Forgot Password affordance as a keyboard-operable non-submit Button link variant with no recovery or navigation side effect and verify logical focus order in `nutripal-admin/src/pages/AdminSignInPage.tsx`

**Checkpoint**: The screen is identifiable, polished, centered, overflow-free at all target widths, keyboard operable, and honest about the currently unavailable recovery flow.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Normalize formatting, verify static quality, build the production bundle, and complete the requested manual acceptance pass without introducing automated tests.

- [X] T009 Format only the feature-modified source files with the project formatter, including `nutripal-admin/src/App.tsx`, `nutripal-admin/src/pages/AdminSignInPage.tsx`, `nutripal-admin/src/lib/admin-sign-in-validation.ts`, and `nutripal-admin/src/components/admin-sign-in/AdminSignInBrand.tsx`
- [X] T010 Run the lint, type-check, and production-build scripts declared in `nutripal-admin/package.json` and resolve feature-scoped failures in `nutripal-admin/src/App.tsx`, `nutripal-admin/src/pages/AdminSignInPage.tsx`, `nutripal-admin/src/lib/admin-sign-in-validation.ts`, and `nutripal-admin/src/components/admin-sign-in/AdminSignInBrand.tsx`
- [X] T011 Execute all manual acceptance and responsive scenarios, including keyboard-only operation and the one-second mock response check, and correct any inaccurate instructions in `specs/002-admin-sign-in/quickstart.md`

**Checkpoint**: Formatting, linting, type checking, and the production build succeed; all manual scenarios pass; no unit-test or end-to-end-test files or tasks have been added.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 — Setup**: Starts immediately and blocks UI composition work.
- **Phase 2 — Foundational**: Adds no work; completion follows Phase 1 automatically.
- **Phase 3 — User Story 1**: Starts after Phase 1 and establishes the page that later stories enhance.
- **Phase 4 — User Story 2**: T004 may start after Phase 1 in parallel with User Story 1; T005 depends on T002 and T004.
- **Phase 5 — User Story 3**: T006 may start after Phase 1 in parallel with User Stories 1 and 2; T007 depends on T002 and T006, and T008 depends on T007.
- **Phase 6 — Polish**: Depends on all selected story phases.

### User Story Dependency Graph

```text
Phase 1 Setup
├── User Story 1 page and mock flow (T002 → T003)
├── User Story 2 validation module (T004) ──┐
└── User Story 3 brand module (T006) ──────┼─ parallel preparation
                                          │
User Story 1 page (T002) + T004 ──────────┴→ User Story 2 integration (T005)
User Story 1 page (T002) + T006 ───────────→ User Story 3 integration (T007 → T008)
User Stories 1–3 ───────────────────────────→ Polish (T009 → T010 → T011)
```

### Within Each User Story

- **US1**: Build the page and mock form before wiring it into the application entry point.
- **US2**: Complete the pure validation helper before integrating invalid states into the page.
- **US3**: Complete the standalone brand component before integrating the responsive Card presentation and Forgot Password affordance.
- No automated-test-first sequence applies because automated unit and E2E testing were explicitly excluded.

### Parallel Opportunities

- T004 can run in parallel with T002–T003 because it creates an isolated validation module.
- T006 can run in parallel with T002–T005 because it creates an isolated branding component.
- After T002, T005 and T007 can proceed in parallel only if contributors coordinate their separate edits to `nutripal-admin/src/pages/AdminSignInPage.tsx`; sequential integration is safer in a single working tree.

---

## Parallel Execution Examples

### User Story 1

US1 has no safe intra-story parallel split: T003 imports the page created by T002. Start the independent US2 and US3 preparation tasks alongside it instead:

```text
Task T002: Create the working sign-in page in nutripal-admin/src/pages/AdminSignInPage.tsx
Task T004: Create validation helpers in nutripal-admin/src/lib/admin-sign-in-validation.ts
Task T006: Create the brand component in nutripal-admin/src/components/admin-sign-in/AdminSignInBrand.tsx
```

### User Story 2

```text
Task T004: Create and review deterministic validation helpers while T002 builds the base page
Task T005: Integrate those helpers after T002 and T004 complete
```

### User Story 3

```text
Task T006: Create the isolated NutriPal Admin brand component while T002 builds the base page
Task T007: Integrate the brand and responsive Card after T002 and T006 complete
Task T008: Add and verify the UI-only recovery affordance after T007
```

---

## Implementation Strategy

### MVP First

1. Complete T001 to make the required shadcn Field composition available.
2. Complete T002–T003 for User Story 1.
3. Stop and run the US1 independent manual check.
4. Use this as the smallest demonstrable mock-submission increment.

User Story 1 is the narrow MVP checkpoint. Because User Story 2 is also P1, the complete priority-one sign-in slice consists of both US1 and US2.

### Incremental Delivery

1. **Setup**: Add and review the missing form primitive.
2. **US1**: Deliver valid local mock submission.
3. **US2**: Add invalid-input prevention and accessible correction guidance.
4. **US3**: Add brand clarity, premium responsive presentation, and the UI-only recovery affordance.
5. **Polish**: Format, statically verify, build, and manually validate the complete screen.

### Parallel Team Strategy

1. One contributor completes T001.
2. After setup, contributors can prepare T002, T004, and T006 concurrently because they target different files.
3. Integrate T005, T007, and T008 in dependency order, coordinating because they modify the shared page file.
4. Complete T009–T011 after all desired stories are integrated.

---

## Notes

- `[P]` marks tasks that are safe to start concurrently in different files after their stated phase dependency.
- `[US1]`, `[US2]`, and `[US3]` provide traceability to the specification's user stories.
- Use the repository's `pnpm` package manager and configured `@/` aliases.
- Prefer existing shadcn components and variants, full Card composition, FieldGroup/Field form structure, semantic color tokens, and `gap-*` layout utilities.
- Do not add raw component color overrides, manual dark-mode colors, `space-x-*`, `space-y-*`, or a form library not already required by the plan.
- Do not add unit tests, E2E tests, test dependencies, or test configuration for this feature.
- Commit after each task or cohesive task group if the active development workflow includes commits.
