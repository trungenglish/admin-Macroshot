# Quickstart Validation Guide

This guide documents the manual validation scenarios that prove the Admin Sign-In mock works end-to-end as per the specification.

## Prerequisites

1. Ensure dependencies are installed in `nutripal-admin`:
   ```bash
   cd nutripal-admin
   pnpm install
   ```
2. Start the development server:
   ```bash
   pnpm run dev
   ```
3. Open the browser to the local URL (typically `http://localhost:5173`). The admin sign-in page is the application entry screen.

## Manual Validation Scenarios

### Scenario 1: Valid Submission
1. Enter a valid username (e.g., `admin`).
2. Enter a valid password (e.g., `password123`).
3. Click "Sign In".
4. **Expected**: Check the browser's developer console. A log should appear showing the submitted username and password. No navigation or page reload should occur.
5. Repeat the submission by focusing either field and pressing Enter.
6. **Expected**: Exactly one additional log appears within one second. No network request, navigation, or page reload occurs.

### Scenario 2: Invalid Form Blocked
1. Leave both fields blank or enter a username containing whitespace (e.g., `invalid username`).
2. Click "Sign In".
3. **Expected**: The submission is blocked. Field-specific error messages should appear under the Username and Password fields.
4. Correct both values.
5. **Expected**: Stale messages clear without erasing the other field, and the corrected form can use the mock submission flow.

### Scenario 3: Visual & Responsive Check
1. Inspect the page at viewport widths of 320, 768, and 1440 pixels.
2. **Expected**: The form remains centered, legible, fully visible, and does not require horizontal scrolling at any target width.
3. Verify the "NutriPal Admin" identity and "Forgot Password" affordance are present and visually clear.
4. Activate "Forgot Password" after entering values.
5. **Expected**: The URL and entered values remain unchanged, and no recovery request or state is created.

### Scenario 4: Keyboard & Accessibility Check
1. Starting before the form, press Tab repeatedly.
2. **Expected**: Focus moves in order through Username, Password, Sign In, and Forgot Password, with a visible focus indicator on each control.
3. Submit invalid values.
4. **Expected**: Each invalid input reports `aria-invalid="true"` and references its visible field-specific error message.
