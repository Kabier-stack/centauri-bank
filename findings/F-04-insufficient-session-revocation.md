# F-04 — Insufficient Session Revocation

**Severity:** Medium
**OWASP Category:** API2:2023 — Broken Authentication
**Affected Endpoint:** `POST /auth/logout`

---

## Description

JWTs are issued with a 24-hour expiry
(`jwt.sign(payload, secret, { expiresIn: "24h" })`) and no
corresponding server-side revocation mechanism exists. `POST
/auth/logout` is implemented but performs no meaningful action:

```javascript
async function logoutUser() {
  return { message: "Logged out successfully" };
}
```

The frontend correctly removes the token from `localStorage` on
logout — but this only affects the browser that performed the logout.
The token itself remains fully valid, and would continue to be
accepted by the API, for up to 24 hours from issuance regardless.

## Steps to Reproduce

1. Authenticate and obtain a valid token.
2. Confirm the token succeeds against a protected route:
   `GET /auth/whoami`.
3. Call `POST /auth/logout` with that token.
4. Reuse the identical token against `GET /auth/whoami` again.

## Evidence

Both calls to `/auth/whoami` — before and after logout — returned
identical successful responses:
```json
{"message": "You are authenticated", "userId": "..."}
```

## Impact

A token obtained through any means other than the legitimate user's
own session (XSS, a shared/public device, log exposure, or any other
token-theft vector) remains fully usable for up to 24 hours,
regardless of the legitimate user believing they have logged out.
This finding does not introduce a token-theft vector on its own — it
extends the impact window of any other compromise.

## Discovery Methodology

Directly observable through intended application use — no special
tooling required. Any tester who checks whether "logout" produces a
real effect (rather than assuming it does) will surface this.

## Root Cause

Stateless JWT authentication was implemented without a corresponding
revocation mechanism — a common and well-understood tradeoff of pure
JWT-based session designs when session termination is a genuine
product requirement.

## Remediation (in order of implementation effort)

1. **Server-side token blocklist** — store a unique token identifier
   on logout, checked on every subsequent authenticated request,
   removed automatically once the token's natural expiry passes.
2. **Shorter-lived access tokens paired with a revocable refresh
   token** — reduces the exposure window significantly without
   requiring a blocklist check on every request.
3. **Migrate to server-side sessions** (session ID in an httpOnly
   cookie, session state stored server-side) — trades JWT's
   statelessness for immediate, genuine revocability.

## Note on Severity

Rated Medium, not High or Critical, because exploitation requires a
separate, prior token-compromise event via another vector — this
finding extends the impact of that prior compromise rather than being
independently exploitable on its own.
