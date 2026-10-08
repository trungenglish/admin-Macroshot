# Feature Specification: Admin Authentication Integration

**Feature Branch**: Not created (no pre-specification branch hook configured)

**Created**: 2026-09-13

**Status**: Draft

**Input**: User description: "Connect the existing admin sign-in screen to live authentication using username and password, shared authentication state, visible progress and error feedback, and locally persisted access credentials. Do not add page navigation or automated Unit and E2E tests."

## User Scenarios & Testing *(mandatory)*

The independent checks and acceptance scenarios below define manual acceptance criteria. Creating Unit tests and end-to-end tests is explicitly outside this feature's scope.

### User Story 1 - Authenticate with Admin Credentials (Priority: P1)

As a NutriPal administrator, I want to sign in with my username and password so that the application can establish my authenticated admin state using the existing authentication service.

**Why this priority**: Real authentication replaces the current mock submission and delivers the feature's primary value.

**Independent Test**: Submit credentials for a valid admin account and verify that one authentication attempt succeeds, the returned access credential and administrator profile become available to the application, the credential is retained locally, a development-visible success signal is recorded, and the browser navigates to `/admin/ingredients`.

**Acceptance Scenarios**:

1. **Given** the admin sign-in screen is open, **When** the administrator enters a valid username and password and submits the form, **Then** exactly one authentication attempt is sent with the entered username and password.
2. **Given** the authentication service accepts the credentials and returns an access credential and administrator profile, **When** the response is processed, **Then** the shared authentication state records the credential, profile, and successful status.
3. **Given** authentication succeeds, **When** processing completes, **Then** the access credential is retained in browser-local storage, a development-visible "Login Successful" signal is recorded, and the administrator remains on the current page.

---

### User Story 2 - Submit Username Rather Than Email (Priority: P1)

As a NutriPal administrator, I want the form to request and validate my username rather than an email address so that the credentials match the admin authentication contract.

**Why this priority**: A mismatched identifier prevents valid administrators from authenticating and sends the wrong credential shape to the service.

**Independent Test**: Manually verify the identifier field is labeled and announced as Username, accepts a valid non-email username, rejects invalid username values, and contributes a username value to the submitted credential pair.

**Acceptance Scenarios**:

1. **Given** the sign-in form is displayed, **When** the administrator reviews the fields, **Then** the identifier field is labeled Username and does not request an email address.
2. **Given** a syntactically valid username that is not an email address and a non-empty password, **When** the administrator submits the form, **Then** client-side validation permits the authentication attempt.
3. **Given** the username is blank or contains whitespace, or the password is blank or whitespace-only, **When** the administrator submits, **Then** no authentication attempt is sent and each invalid field shows specific corrective feedback.
4. **Given** a validation error is visible, **When** the administrator corrects the affected field, **Then** the obsolete field error no longer blocks a valid submission.

---

### User Story 3 - Understand Sign-In Progress (Priority: P2)

As a NutriPal administrator, I want clear progress feedback while my sign-in is being checked so that I know the request is active and do not submit it repeatedly.

**Why this priority**: Visible progress prevents uncertainty and accidental duplicate authentication attempts.

**Independent Test**: Manually submit a valid form against a delayed authentication response and verify the action becomes unavailable, displays "Signing in...", and cannot create a second attempt until the first finishes.

**Acceptance Scenarios**:

1. **Given** valid credentials, **When** the administrator submits the form, **Then** the authentication status changes to loading, the submit action is disabled, and its label changes to "Signing in..." while the attempt is pending.
2. **Given** an authentication attempt is pending, **When** the administrator tries to submit again by pointer or keyboard, **Then** no additional authentication attempt is created.
3. **Given** the pending attempt succeeds or fails, **When** it finishes, **Then** the submit action leaves its loading presentation and becomes available for a permitted next attempt.

---

### User Story 4 - Recover from Authentication Errors (Priority: P2)

As a NutriPal administrator, I want an understandable error when sign-in fails so that I can correct my credentials or retry after a service problem.

**Why this priority**: Administrators otherwise cannot distinguish invalid credentials from an unresponsive attempt or recover confidently.

**Independent Test**: Manually exercise an invalid-credentials response, a service response without a usable message, and a connectivity failure; verify the form displays the service message when available, otherwise a generic message, retains the entered username, and permits a retry.

**Acceptance Scenarios**:

1. **Given** the authentication service rejects the credentials with a user-safe message, **When** the failure is processed, **Then** that message is displayed on the form and the authentication status is error.
2. **Given** authentication fails without a usable user-safe message, **When** the failure is processed, **Then** the form displays a generic sign-in error and does not expose technical details.
3. **Given** an authentication error is visible, **When** the administrator edits the credentials or starts another permitted attempt, **Then** stale error feedback is cleared or replaced and the administrator can retry.
4. **Given** authentication fails, **When** failure processing completes, **Then** no new access credential or administrator profile is recorded and no credential from the failed attempt is persisted.

### Edge Cases

- A username containing whitespace is rejected, while a valid username is not required to resemble an email address.
- A password containing only whitespace is treated as empty; additional password strength rules are outside this feature's scope.
- If both fields are invalid, both field-specific messages appear during the same submission attempt and no authentication attempt is sent.
- Repeated pointer, keyboard, or form submissions while an attempt is pending create no duplicate attempt.
- A successful service response without a non-empty access credential is treated as an authentication failure and is not reported as successful.
- A successful response without a usable administrator profile is treated as an authentication failure so the shared state cannot enter a partial success condition.
- If the service is unreachable, times out, or returns no user-safe message, the form shows a generic retryable error.
- A failure to retain the returned access credential locally is treated as an error and is not reported as a completed sign-in.
- The password is never retained after it is submitted; failed attempts also do not persist the username as an authentication credential.
- A failed attempt does not overwrite a previously retained valid credential unless a later session-management feature explicitly defines that behavior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The sign-in form MUST use a visibly labeled Username field instead of an Email field throughout the user-facing sign-in flow.
- **FR-002**: The form MUST provide a Password field whose entered value is visually obscured.
- **FR-003**: The form MUST accept a valid non-email username and MUST NOT apply email-address formatting rules to the username.
- **FR-004**: The form MUST reject a username that is blank or contains whitespace and MUST reject a password that is empty or consists only of whitespace.
- **FR-005**: The form MUST block authentication while any client-side validation error exists and MUST display an understandable message associated with every invalid field.
- **FR-006**: A valid submission MUST send exactly one username-and-password credential pair to the existing admin authentication service.
- **FR-007**: The application MUST maintain shared authentication state containing the current access credential, administrator profile, authentication status, and user-safe authentication error, when each value is applicable.
- **FR-008**: The authentication status MUST distinguish at least the not-started, loading, successful, and error outcomes so every sign-in attempt has one unambiguous current state.
- **FR-009**: While an authentication attempt is pending, the form MUST disable the submit action, show the label "Signing in...", and prevent duplicate submissions.
- **FR-010**: Authentication MUST be considered successful only when the service accepts the credentials and supplies both a non-empty access credential and a usable administrator profile.
- **FR-011**: On successful authentication, the application MUST store the returned access credential and administrator profile in shared authentication state and set the authentication status to successful.
- **FR-012**: On successful authentication, the application MUST retain the access credential in browser-local storage for subsequent authenticated use.
- **FR-013**: The application MUST NOT retain the administrator's password in browser-local storage or other persistent client storage.
- **FR-014**: On successful authentication, the application MUST emit a development-visible "Login Successful" signal and MUST NOT navigate away from the sign-in page.
- **FR-015**: When authentication fails with a user-safe service message, the form MUST display that message and set the authentication status to error.
- **FR-016**: When authentication fails without a usable user-safe message, the form MUST display a generic, non-technical, retryable sign-in error.
- **FR-017**: A failed authentication attempt MUST NOT record or persist a new access credential or administrator profile.
- **FR-018**: The administrator MUST be able to correct credentials and retry after validation, credential, connectivity, service, response-data, or local-persistence failures.
- **FR-019**: The authentication service location MUST be configurable for each deployment environment rather than fixed to one environment.
- **FR-020**: Username, password, progress, and error feedback MUST remain keyboard operable and clearly associated for assistive technology.

### Scope Boundaries

**In scope**:

- Replacing email-oriented sign-in semantics with username-oriented form data and validation.
- Submitting username and password to the existing admin authentication service.
- Shared access-credential, administrator-profile, status, and error state.
- Pending, success, and failure behavior on the existing sign-in page.
- Retaining a successful access credential in browser-local storage.
- Manual verification against the acceptance scenarios in this specification.

**Out of scope**:

- Navigation or route protection after successful authentication.
- Automatic session restoration on page reload, credential refresh, expiration handling, logout, and credential revocation.
- Password recovery behavior, account creation, social sign-in, single sign-on, and multi-factor authentication.
- Changes to the server-side authentication contract or administrator account management.
- Persisting passwords or other raw credential input.
- Unit tests and end-to-end tests for this feature.

### Key Entities *(include if feature involves data)*

- **Admin Credentials**: The transient username and password entered for one sign-in attempt. They are validated before submission and are not retained as a stored credential pair.
- **Authentication State**: The shared current result of authentication, including an access credential, administrator profile, status, and user-safe error when applicable.
- **Access Credential**: The non-empty credential returned after successful authentication and retained locally for subsequent authenticated requests.
- **Administrator Profile**: The authenticated administrator identity and profile data returned with a successful sign-in and made available through shared state.
- **Authentication Error**: A user-safe explanation of a failed sign-in, sourced from the authentication service when available or replaced by a generic retryable message.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 90% of representative administrators can identify the Username field and complete a valid sign-in on their first attempt within 60 seconds.
- **SC-002**: 100% of manually verified valid authentication responses result in one successful authentication state containing the returned access credential and administrator profile, with the credential retained locally and no page navigation.
- **SC-003**: 100% of blank-username, whitespace-containing-username, blank-password, and whitespace-only-password manual checks are blocked before authentication and display the correct field feedback.
- **SC-004**: In 100% of delayed-response manual checks, progress feedback appears within 0.5 seconds of submission and repeated submission attempts produce no duplicate authentication attempt.
- **SC-005**: In 100% of manually verified authentication failures, the form displays the service's user-safe message when available or a generic retryable message otherwise within one second after the failure is received.
- **SC-006**: 100% of successful manual checks record the exact development-visible success signal "Login Successful"; 0% of failed checks record that signal.
- **SC-007**: Across all manual acceptance checks, 0 passwords are found in persistent browser storage and 0 failed attempts persist a new access credential.

## Assumptions

- The existing admin authentication service accepts a username and password and returns a non-empty access credential plus a usable administrator profile for valid credentials.
- Each deployment environment supplies the correct authentication service location.
- Existing username rules remain in force: usernames are required and cannot contain whitespace; passwords are required, with no new strength policy introduced by this feature.
- Credential persistence in this feature means writing the access credential after success. Reading it to restore a session, validating expiration, refreshing it, and clearing it during logout belong to later session-management work.
- The existing sign-in page's branding, responsive layout, forgot-password affordance, and accessibility behavior remain unchanged except where loading and error feedback require updates.
- Manual acceptance verification is sufficient for this feature because the requester explicitly excluded new Unit and end-to-end tests.
