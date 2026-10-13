# CBF-003 Race Condition / TOCTOU Double-Spend

**Severity:** Critical
**OWASP Category:** API6:2023 Unrestricted Access to Sensitive Business Flows
**Affected Endpoint:** `POST /wallet/transfer` (via the express path, requires F-02)

---

## Description

`expressTransferFunds()` validates the sender's balance in
application code, then performs the balance deduction as a separate,
later database write:

```javascript
if (senderWallet.balance < amount) { throw ... }
// ... no atomic guard between check and write ...
await prisma.wallet.update({
  where: { id: senderWallet.id },
  data: { balance: { decrement: amount } },
});
```

This reintroduces a classic time-of-check-to-time-of-use (TOCTOU)
race condition. The application's own standard transfer path,
`transferFunds()`, correctly closes this exact gap using a single
atomic conditional operation:

```javascript
await tx.wallet.updateMany({
  where: { id: senderWallet.id, balance: { gte: amount } },
  data: { balance: { decrement: amount } },
});
```

The presence of the correct pattern elsewhere in the same codebase
confirms this is a path-specific regression, not a systemic
misunderstanding of the problem.

## Steps to Reproduce

1. Fund a wallet with exactly ₦100.
2. Fire two concurrent `POST /wallet/transfer` requests, each for
   ₦100, both including `"expressTransfer": true`, using genuine
   parallel execution (not sequential requests — timing is essential
   to reproduction).
3. Observe both requests return `200 OK`.

## Evidence

Both concurrent requests returned:
```json
{"message": "Transfer successful", "amount": 100, "express": true}
```

Resulting wallet balance, confirmed directly via database inspection:

**-₦99.99**

A negative balance is not a state the application's data model should
ever be able to reach under correct logic.

## Impact

Direct, provable financial-integrity failure. A user can withdraw
more funds than their account holds, given only access to the express
path (F-02). This is the clearest, most concrete evidence of impact
in this assessment.

## Discovery Methodology

This finding required prior access to CBF-002 to reach the vulnerable
code path, it is the one confirmed, genuine technical dependency in
this assessment's finding set (contrast with CBF-001's reconnaissance-
only relationship to this chain).

Reproduction was performed using PowerShell background jobs
(`Start-Job`) to achieve true concurrent request execution. An
attempt was also made using Burp Suite's parallel-request and Turbo
Intruder ("gate" pattern) tooling; the PowerShell method produced the
confirmed result documented above.

## Root Cause

Non-atomic check-then-act balance validation under concurrent request
execution, the express path was implemented independently of the
standard path and did not inherit its atomicity guarantee.

## Remediation

Apply the identical atomic guard pattern already proven correct in
`transferFunds()`: combine the balance check and decrement into a
single conditional database operation, wrapped in an interactive
transaction alongside the credit and transaction-record writes, so
the entire operation succeeds or rolls back as one unit.

## Real-World Parallel

This bug class is the same root cause behind widely-discussed
TOCTOU/race-condition disclosures in real payment and gift-card
systems, where concurrent balance-transfer requests allow value to be
duplicated. 
