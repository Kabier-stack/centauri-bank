# # Centauri Bank - Vulnerability Design Log

Internal Only, Not for distribution with the public CTF release.

Status Legend: BUILT | PROVEN

---

## Finding 1 - Receipient Lookup Information Disclosure

**OWASP category:** API3:2023 - Broken Object Property Level Authorization / Excessive Data Exposure
**Status:** BUILT

`GET /wallet/verify-receipient` requires authentication but performs no authorization check on WHICH account the caller may query. Any logged-in user can look up any account by `accountNumber`. The response includes `accountTier`, which is more than a "verify before you pay" feature needs todisclose. Account numbers are short and non-random, making them enumerable

**Impact** Enables reconnaissance - an attacker can map real accounts and identify high-value (Premium) targets before attempting further attacks.

---

## Finding 2 - Mass Assignment via `expressTransfer` Flag

**OWASP category:** API3:2023 - Broken Object Level Authorization
**Status:** Proven

`POST /wallet/transfer` accepts a client-supplied `expressTransfer` boolean and trusts it directly to route the requests into `expressTransferFunds()`, a code path intended only for PREMIUM-tier accounts. The sender's real `accountTier` (source of truth: the database) is never checked.

**Proof:** A genuinely STANDARD-tier account successfully invoked the express path by adding `"expressTransfer": true` to an otherwise normal transfer request. Confirmed via API response (`express: true`), database transaction description and live server console log.

---

## Finding 3 - Race Condition / TOCTOU Double-Spend

**OWASP category:** API6:2023 — Unrestricted Access to Sensitive Business Flows
**Status:** PROVEN

`expressTransferFunds()` checks `senderWallet.balance < amount` in
application code, then performs the balance decrement as a SEPARATE
database write. This reintroduces the exact check-then-act gap that
`transferFunds()` (the normal path) was specifically built to close
via an atomic `updateMany` with a `balance: { gte: amount }` guard.

**Proof:** Two concurrent $100 transfer requests were fired against a
wallet holding exactly $100, using PowerShell background jobs. BOTH
requests succeeded. Resulting wallet balance: -$99.99 — a real,
provable negative balance from a double-spend.

**Root cause chain:** Reachable only via Finding 2 (the express path),
making this a genuine escalation chain, not an isolated bug.

---

## Finding 4 — JWT Has No Server-Side Revocation

**OWASP category:** API2:2023 — Broken Authentication
**Status:** PROVEN

Tokens are issued with a 24-hour expiry and no server-side revocation
mechanism (no blocklist, no refresh-token rotation). `POST /auth/logout`
exists but only returns a success message — it does not invalidate the
token.

**Proof:** A token was used successfully against a protected route,
then "logged out" via `/auth/logout`, then used again against the same
protected route — and succeeded identically both times.

---

## Finding 5 — Broken Function-Level Authorization on Admin Action

**OWASP category:** API5:2023 — Broken Function Level Authorization
**Status:** PROVEN

`POST /wallet/admin/adjust-balance` is protected only by `requireAuth`
(valid login required) — it never checks `req.user.role`. The route's
naming and intent are admin-only, but nothing server-side enforces that.

**Proof:** A newly registered, never-promoted account with `role: USER`
successfully called this endpoint and set another user's wallet balance
to $999,999.

---

## Summary

| #   | Finding                           | Category  | Status |
| --- | --------------------------------- | --------- | ------ |
| 1   | Recipient info leak               | API3:2023 | Built  |
| 2   | Mass assignment (expressTransfer) | API3:2023 | Proven |
| 3   | Race condition (double-spend)     | API6:2023 | Proven |
| 4   | JWT / no revocation               | API2:2023 | Proven |
| 5   | BFLA (admin action)               | API5:2023 | Proven |

Findings 2 → 3 form the chain's core escalation narrative:
info disclosure → unauthorized access to a privileged code path →
that path's own flaw enables real financial impact.
