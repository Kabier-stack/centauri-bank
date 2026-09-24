# Findings Index

Individual, browsable finding reports for the Centauri Bank
assessment. See [`../PENTEST_REPORT.md`](../PENTEST_REPORT.md) for the
full report including executive summary and attack chain analysis.

| ID | Finding | Severity | OWASP Category |
|---|---|---|---|
| [F-01](./F-01-recipient-info-disclosure.md) | Recipient lookup information disclosure | Low | API3:2023 |
| [F-02](./F-02-mass-assignment-transfer.md) | Mass assignment on transfer endpoint | High | API3:2023 |
| [F-03](./F-03-race-condition-double-spend.md) | Race condition / TOCTOU double-spend | Critical | API6:2023 |
| [F-04](./F-04-insufficient-session-revocation.md) | Insufficient session revocation | Medium | API2:2023 |
| [F-05](./F-05-broken-function-level-authz.md) | Broken function-level authorization | Critical | API5:2023 |

## Attack Chain

```
F-01 (recon — identifies real accounts/tiers, not a dependency)

F-02 (mass assignment)
   ↓ grants access to a privileged code path
F-03 (race condition)
   ↓ that path's own flaw enables real financial impact
```

F-04 and F-05 are standalone findings, unrelated to the chain above.
