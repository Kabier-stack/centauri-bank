# CBF-001 Recipient Lookup Information Disclosure

**Severity:** Low
**OWASP Category:** API3:2023 — Broken Object Property Level Authorization
**Affected Endpoint:** `GET /wallet/verify-recipient`

---

## Description

The recipient verification feature allows any authenticated user to
look up basic details about another account before sending money to
it, a legitimate, common banking UX pattern. However, the endpoint
requires only **authentication** (a valid token), not
**authorization** (a check on whether the caller has any legitimate
relationship to the specific account being queried). Any logged-in
user can query any account number.

The response additionally discloses `accountTier`, which exceeds what
a "confirm the payee's name before paying" feature requires.

Account numbers in this application are short (10 digits) and
generated without cryptographic randomness, making them practically
enumerable, compounding the impact of the missing per-query
authorization check.

## Steps to Reproduce

1. Authenticate as any user and obtain a valid token.
2. Send:
   ```
   GET /wallet/verify-recipient?accountNumber=<any valid account number>
   Authorization: Bearer <token>
   ```
3. Observe the response discloses `accountHolderName` and
   `accountTier` for an account with no relationship to the requester.

## Evidence

```json
{
  "accountNumber": "9065753495",
  "accountHolderName": "Recipient User",
  "accountTier": "STANDARD"
}
```

## Impact

Enables reconnaissance: an attacker can enumerate account numbers to
build a map of real account holders and identify higher-tier
(Premium) accounts as preferential targets for further testing (see
CBF-002, CBF-003).

## Discovery Methodology

This finding is directly observable through normal, intended
application use, no special tooling is required. It surfaces
naturally during Step 1 of the recommended testing workflow
(reconnaissance via normal functionality), simply by noting that the
response contains more than the UI displays.

## Root Cause

Missing per-request authorization scoping, combined with excessive
field disclosure in the response payload.

## Remediation

- Remove `accountTier` from the response; return only the fields a
  "confirm payee" feature genuinely requires (account holder name).
- Apply rate limiting to this endpoint to reduce the practical
  feasibility of account number enumeration.
- Consider whether account numbers should be less predictable, or
  whether this endpoint should require an existing relationship
  (e.g., a prior transaction) between the requester and the queried
  account.
