# Data Model: Admin Sign-In

## Entities

### `Admin Sign-In Attempt` (Ephemeral)

This entity represents the data submitted by the user. It is strictly local state and is never transmitted or persisted.

**Fields**:
- `username` (String): The administrator's username.
  - Validation: Must not be blank or contain whitespace.
- `password` (String): The administrator's password.
  - Validation: Must not be empty or consist only of whitespace.

**State**:
- Exists only in the React component's local state (`useState` or form state).
- When validated and submitted, the mock handler will receive this entity (e.g., via `console.log`), and then the entity will continue to exist in local state until the page is refreshed or navigated away from.
