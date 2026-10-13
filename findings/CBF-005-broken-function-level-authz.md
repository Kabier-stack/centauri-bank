# CBF-005 Broken Function-Level Authorization on Admin Action

**Severity:** Critical
**OWASP Category:** API5:2023 — Broken Function Level Authorization
**Affected Endpoint:** `POST /wallet/admin/adjust-balance`

---

## Description

`POST /wallet/admin/adjust-balance` is registered with only an
authentication check:

```javascript
router.post("/admin/adjust-balance", requireAuth, controller.adjustBalance);
```

`requireAuth` verifies the presence of a valid, signed JWT
(**authentication**  "is this a real, logged-in user?") but performs
no check of `req.user.role` (**authorization**  "is this specific
user allowed to do this specific thing?"). Despite the route's naming
and evident administrative intent, any authenticated account,
regardless of role, can successfully invoke it.

The application's `User` model does include a `role` field (`USER` /
`ADMIN`), confirming role-based restriction was an intended part of
the design, this is an implementation omission, not an
architectural absence of the concept.

Notably, the underlying operation sets an **absolute** balance value
(`data: { balance: newBalance }`), not a relative adjustment, meaning
successful exploitation allows setting any account to any arbitrary
value, not merely crediting or debiting a bounded amount.

## Steps to Reproduce

1. Register a new account through standard public registration
   (`role` defaults to `USER`; no self-promotion path exists).
2. Authenticate as that account.
3. Send:
   ```
   POST /wallet/admin/adjust-balance
   Authorization: Bearer <token>
   Content-Type: application/json

   {"accountNumber":"<any account>","newBalance":999999,"reason":"..."}
   ```

## Evidence

```json
{
  "message": "Balance adjusted",
  "wallet": {
    "accountNumber": "1144226240",
    "balance": "999999"
  }
}
```

Confirmed performed by an account independently verified as
`role: "USER"` via `GET /auth/me` prior to the request.

## Impact

Complete compromise of account balance integrity, exercisable by any
authenticated user with no prerequisite conditions. This is the most
severe and most directly reachable finding in this assessment, unlike
CBF-002/CBF-003, it requires no chained access and no special account state.

## Discovery Methodology

### White-box (used in this engagement)
Identified via direct source review.

### Black-box — evaluated honestly, including likely failure

Unlike CBF-002, no frontend code references this endpoint at all, no
admin UI exists in the application, so **bundle inspection provides
no signal here**.

- **Pattern-based guessing**: an attacker observing the existing
  `/wallet/*` endpoint family could reasonably guess at an
  `/wallet/admin` prefix — "admin" is among the most common path
  segments for a privileged surface. This identifies a plausible
  prefix, not the full path.
- **Automated content discovery** (Gobuster/Feroxbuster): may flag
  `/wallet/admin` if "admin" appears in the wordlist (a near-universal
  entry) — but the specific sub-action `adjust-balance` is a bespoke
  compound term unlikely to appear in any generic wordlist, consistent
  with the same limitation documented in F-02.

**Honest conclusion:** a black-box tester without source access, a
documentation leak, or an information-disclosure vector (verbose
errors, exposed route listings) faces a realistic possibility of
failing to discover this specific endpoint through automated or
pattern-based means alone.

**This does not reduce the finding's severity.** Absence of an easy
discovery path is, at best, security through obscurity, it provides
no defense against an insider, a more determined attacker, or
accidental disclosure through an unrelated misconfiguration. Once
found, by any means, the endpoint is immediately and fully
exploitable.

## Root Cause

Authorization middleware applied inconsistently: `requireAuth` was
treated as sufficient protection for a route that required a second,
distinct check. Authentication and authorization are easy to conflate
when only one identity-checking function exists in a codebase.

## Remediation

Introduce dedicated role-checking middleware, applied to all
administrative routes:

```javascript
function requireAdmin(req, res, next) {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

router.post("/admin/adjust-balance", requireAuth, requireAdmin, controller.adjustBalance);
```

More broadly: enforce this pattern at the route-prefix level (every
`/admin/*` route automatically requires `requireAdmin`) rather than
relying on it being added correctly to each route individually.
Consider serving administrative functionality from an entirely
separate, non-public-facing namespace in production deployments.
