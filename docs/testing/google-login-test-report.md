# RentMatch AI – Google Login Test Report

| | |
|---|---|
| **Tested by** | Naitik Chavda – Testing team |
| **Date** | 19 Nov 2026 |
| **Commit tested** | `c397fc7` (main) |
| **Area** | `POST /api/v1/google` (backend), `GoogleAuthButton.tsx` and the login / signup forms (frontend) |
| **Environment** | Windows 11, Python 3.12, PostgreSQL 17 (local), Node 26, Next.js 16.4.6 dev server, Chromium-based browser |

## 1. Summary

| Area | Result |
|---|---|
| Backend `/google` test cases | **28 / 30 passed**, 2 failed |
| Frontend Google button test cases | **4 / 6 passed**, 2 failed |
| Code review findings | 3 |
| Real end-to-end sign-in with a Google account | ⏳ Not tested – needs the team's Google Web Client ID (section 7) |
| Open bugs | **2 High/Medium** (frontend), **3 Low** (backend) |

**Overall:** the backend sign-in logic is solid – new users, roles, account linking, unverified emails and inactive accounts are all handled correctly. The main problems are in the frontend button: after one failed attempt it stops responding until the page is reloaded, and a missing client ID fails silently.

## 2. How it was tested
- **Backend:** each case calls `POST /api/v1/google` on the real FastAPI app with the local PostgreSQL database. Google's token check (`id_token.verify_oauth2_token`) is replaced with fixed test data so every Google response (verified / unverified email, missing name, missing `sub`, network failure…) can be produced on demand. Bad-token cases use the real Google verifier.
- **Frontend:** the app was run locally against the local backend and checked in the browser on `/login` and `/signup`, once without a client ID and once with a placeholder client ID (Google renders its button, but a real sign-in is not possible with it). A failed attempt was produced by sending a Google-style response with an invalid token to the page's own handler.

## 3. Backend test cases (`POST /api/v1/google`)

| ID | Case | Expected | Actual | Result |
|---|---|---|---|---|
| G01 | `GOOGLE_CLIENT_ID` not configured | 500 "Server OAuth configuration missing" | as expected | ✅ |
| G02 | Garbage token (real Google verifier) | 401 | 401 | ✅ |
| G02b | Error message for a rejected token | Generic message, no internals | `Invalid or expired Google token: Wrong number of segments in token: b'not-a-real-jwt'` | ❌ BUG-GL-03 |
| G02c | Google's servers unreachable (network error) | Retryable error (e.g. 503 "please try again") | 401 `Google token verification failed: simulated network failure` | ❌ BUG-GL-04 |
| G03 | Body without `token` | 422 | 422 | ✅ |
| G04 | `role: "admin"` | 422 | 422 | ✅ |
| G05 | New Google user, no role sent | 200 | 200 | ✅ |
| G05b | Role saved for that user | `tenant` | `tenant` | ✅ |
| G05c | User stored correctly | `google_sub` saved, no password | as expected | ✅ |
| G05d | `GET /profile/` with the returned token | 200 | 200 | ✅ |
| G05e | Profile returns the role the frontend needs | `role: tenant` | `role: tenant` | ✅ |
| G06 | New Google user with `role: "landlord"` | 200, `landlord` role | as expected | ✅ |
| G07 | Account with a single name (no family name) | 200 | 200 | ✅ |
| G07b | Profile of that user | first name set, empty last name | `Cher`, `""` | ✅ |
| G07c | Profile update for a Google user | 200 | 200 | ✅ |
| G08 | Account with no name at all | 200, first name from email | as expected | ✅ |
| G09 | Sign-in with a mixed-case email | 200 | 200 | ✅ |
| G09b | That user stored with a lowercase email | Found by lowercase email | Found | ✅ |
| G10 | `email_verified: false` | 401 | 401 | ✅ |
| G10b | `email_verified: "true"` (string) | Rejected | 401 | ✅ |
| G11 | Token without email | 401 | 401 | ✅ |
| G12 | Token without `sub` | 401 | 401 | ✅ |
| G13 | Returning Google user | 200 | 200 | ✅ |
| G13b | Returning user sends a different role | Role unchanged | unchanged | ✅ |
| G14 | Same email, different Google account | 409 | 409 | ✅ |
| G15 | Existing email/password user signs in with Google | 200, account linked, role kept | as expected | ✅ |
| G15b | Password login after linking | 200 | 200 | ✅ |
| G15c | Linked user's real last name | Kept | Kept | ✅ |
| G16 | Google-only user tries password login | 400 | 400 | ✅ |
| G17 | Inactive user | 403 | 403 | ✅ |
| | **Total** | | | **28 / 30** |

## 4. Frontend test cases

| ID | Case | Expected | Actual | Result |
|---|---|---|---|---|
| F01 | `/login` with a client ID | Google script loads, Google's button is placed over "Continue with Google" | as expected | ✅ |
| F02 | `/signup` with a client ID | Same, "Sign up with Google" | as expected | ✅ |
| F03 | Go from Login to Create Account in the app | Google button still works on the new page | as expected | ✅ |
| F04 | Backend error after choosing a Google account | Error toast shown | "Google Sign-Up Error" toast with the backend message | ✅ |
| F05 | Click "Continue with Google" again after a failed attempt | Google sign-in opens again | **Nothing happens** until the page is reloaded | ❌ BUG-GL-01 |
| F06 | Click "Continue with Google" with no `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Error message | **Nothing happens**, no message | ❌ BUG-GL-02 |
| | **Total** | | | **4 / 6** |

## 5. Bugs

### BUG-GL-01 – Google button stops working after one failed attempt · High · Open
**Where:** `frontend/src/components/auth/GoogleAuthButton.tsx`
**Steps:** open `/login` or `/signup` → choose a Google account → sign-in fails (backend error, expired token, network problem) → click "Continue with Google" again.
**Actual:** nothing happens until the page is reloaded.
**Cause:** the invisible overlay that holds Google's real button is removed while the request runs (`!isButtonDisabled` in the render condition). When it comes back it is empty – Google's button is drawn only once, in an effect that does not run again – but the empty overlay still covers the visible button and catches every click.
**Suggested fix:** keep the overlay mounted and block clicks with `pointer-events-none` while disabled, or re-run the `renderButton` effect when the overlay mounts again.

### BUG-GL-02 – Missing client ID fails silently · Medium · Open
**Where:** `frontend/src/components/auth/GoogleAuthButton.tsx`
**Steps:** run the frontend without `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (for example a deployment where the variable was not set) → click "Continue with Google".
**Actual:** nothing happens. The component already has an error for this case ("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured."), but it is never shown because the empty overlay covers the button.
**Suggested fix:** render the overlay only when a client ID is configured.

### BUG-GL-03 – Rejected-token errors expose internal details · Low · Open
**Where:** `backend/app/api/auth.py`, `google_auth`
**Actual:** the response includes the library's message and part of the submitted token, e.g. `Invalid or expired Google token: Wrong number of segments in token: b'not-a-real-jwt'`.
**Suggested fix:** return a fixed message ("Invalid or expired Google token") and log the details on the server.

### BUG-GL-04 – Network failures reported as an invalid token · Low · Open
**Where:** `backend/app/api/auth.py`, `google_auth` (the generic `except Exception` branch)
**Actual:** if Google's certificate server can't be reached, the user gets 401 "Google token verification failed: …", which looks like a problem with their account.
**Suggested fix:** return 503 with "Could not reach Google to verify the sign-in. Please try again."

## 6. Code review findings

| ID | Finding | Risk |
|---|---|---|
| CR-01 | `verify_oauth2_token` is called without `clock_skew_in_seconds`. If the server clock is a few seconds behind Google, fresh tokens are rejected with "Token used too early". The installed `google-auth` supports the parameter (e.g. `clock_skew_in_seconds=10`). | Low |
| CR-02 | `backend/.env.example` lists `https://rentmatch.vercel.app` in `CORS_ORIGINS`, but the deployed site is `rentmatchai.vercel.app`. If production uses this value, the browser blocks Google sign-in and every other API call from the live site. Please confirm the deployed `CORS_ORIGINS`. | Medium (if copied to production) |
| CR-03 | `auth.py` forces IPv4 for every outgoing HTTP request in the whole backend process (module-level `urllib3` patch), not only for Google verification. | Low |

Other notes:
- The frontend cannot log in an `admin` account – `mapRole` in `authService.ts` accepts only `tenant` and `landlord`.
- The "client ID is not configured" message (once BUG-GL-02 is fixed) is written for developers; a user-friendly text may be better.

## 7. Not tested
**Real sign-in with a Google account** needs the team's Google Web Client ID. To complete it:
1. Get the **Web Client ID** (Google Cloud Console → APIs & Services → Credentials, or from the Vercel / Railway settings).
2. In Google Cloud Console, check that **Authorized JavaScript origins** contain `http://localhost:3000` (local) and `https://rentmatchai.vercel.app` (production).
3. Put the same value in `frontend/.env.local` (`NEXT_PUBLIC_GOOGLE_CLIENT_ID`) and `backend/.env` (`GOOGLE_CLIENT_ID`) and restart both servers.
4. Test: new tenant sign-up, new landlord sign-up, returning user, existing email/password user, closing the popup without choosing an account, retry after an error, logout and sign in again.
