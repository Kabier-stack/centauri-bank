# CBF-002 Mass Assignment on Transfer Endpoint

**Severity:** High
**OWASP Category:** API3:2023 Broken Object Property Level Authorization
**Affected Endpoint:** `POST /wallet/transfer`

---

## Description

`POST /wallet/transfer` accepts an optional client-supplied
`expressTransfer` boolean. When present and truthy, the request is
routed to `expressTransferFunds()` a code path intended exclusively
for `PREMIUM`-tier accounts, offering instant, fee-free processing as
a legitimate account benefit.

The server does not independently verify the sender's actual
`accountTier` against the database before honoring this flag. Any
authenticated account regardless of tier can access the
privileged code path simply by including the flag in the request
body.

Review of the frontend implementation confirms `expressTransfer` is a
genuine, application-recognized parameter (not a guessed or invented
one):

```javascript
const body = { recipientAccountNumber: accountNumber, amount: Number(amount) }
if (expressTransfer) body.expressTransfer = true
```

The client-side UI conditionally renders the corresponding checkbox
only for Premium accounts but this is a UX convenience with no
security value, since the flag can be added to the raw HTTP request
regardless of what the UI displays.

## Steps to Reproduce

1. Authenticate as a confirmed `STANDARD`-tier account.
2. Intercept a normal transfer request in Burp Suite, or construct
   one directly:
   ```
   POST /wallet/transfer
   Authorization: Bearer <token>
   Content-Type: application/json

   {"recipientAccountNumber":"9065753495","amount":50,"expressTransfer":true}
   ```
3. Forward/send the request.

## Evidence

Response:
```json
{
  "message": "Transfer successful",
  "reference": "CB-20260909-SNO8S8",
  "amount": 1,
  "express": true
}
```

`"express": true` confirms the vulnerable code path executed.
Independently corroborated via:
- The stored transaction's `description` field using the
  express-path-specific default string ("Express transfer to...")

## Impact

Grants a Standard account unauthorized access to Premium-tier
functionality on a per-request basis (the account's stored
`accountTier` is never changed, this is not an account upgrade, but
a per-request authorization bypass). Critically, this also grants
access to the vulnerable code path documented in CBF-003, escalating
this finding's real-world impact substantially.

## Discovery Methodology

### White-box
Identified via direct review of the frontend's request-construction
logic.

### Black-box equivalents

**Frontend bundle inspection.** The compiled JavaScript
bundle, shipped to every browser regardless of the viewing user's
tier, contains the same conditional logic shown above. This is
discoverable via browser DevTools with no server-side or source
access, and requires no prior knowledge of the parameter name.


## Root Cause

Insufficient server-side control over client-supplied object
properties, the server assumes a property's presence in the request
implies authorization to invoke its associated behavior.

## Remediation

Remove `expressTransfer` as a client-trusted input entirely. Derive
express-transfer eligibility server-side, from `senderWallet.accountTier`
looked up fresh at request time never from a value supplied in the
request body.
