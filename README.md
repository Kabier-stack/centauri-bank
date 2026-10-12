# Centauri Bank

A deliberately vulnerable, full-stack banking web application, built
end-to-end (backend, frontend, database, containerization) to
demonstrate practical application security testing methodology not
just to list bugs.

Centauri Bank is designed the way a real fintech product would be:
authentication, wallets, transfers, an admin surface, tiered account
privileges. Its vulnerabilities are not artificial, each one is the
believable byproduct of a real product decision (a rushed "premium"
feature, a convenience endpoint, an incomplete authorization check),
mirroring how vulnerabilities actually enter production applications.

> **For authorized security testing and education only.** Do not
> deploy this application on a publicly reachable network with real
> user data. All vulnerabilities are intentional.

---

## Why this project exists

Most portfolio "vulnerable apps" are cloned from a tutorial and
patched with textbook bugs. Centauri Bank was built from a blank
repository specifically to practice and demonstrate the full
lifecycle of an AppSec engagement:

1. Building a realistic target with genuine business logic
2. Deliberately designing a **chained** vulnerability narrative,
   not a disconnected checklist
3. Testing it through multiple methodologies manual API testing,
   Burp Suite interception, automated parameter/route discovery
   and reporting the honest results of each, including where tools
   failed
4. Writing findings to a professional report standard: severity
   justification, reproduction steps, evidence, root cause,
   remediation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, Prisma ORM |
| Database | PostgreSQL |
| Frontend | React (Vite), Tailwind CSS, React Router |
| Auth | JWT, bcrypt |
| Containerization | Docker, Docker Compose |

---

## Testing Methodology

Centauri Bank is designed to reward a **black-box-first approach**.
The recommended testing workflow:

1. **Reconnaissance** — register a normal account, use the
   application exactly as intended (deposit, verify a recipient,
   send money, review transaction history). Identify every API
   endpoint this exercises and capture the request/response shape
   for each.
2. **Authorization mapping** — identify the account/privilege model
   (standard vs. premium tiers; user vs. admin roles) purely from
   observed application behavior, before assuming anything about the
   backend.
3. **Input and object analysis** - for each write endpoint, determine
   exactly which fields the client controls versus which the server
   should be deriving independently. Compare what a GET response
   discloses against what the corresponding write endpoint accepts.
4. **Business logic testing** - identify any endpoint with real,
   stateful side effects (balance changes especially) and consider
   both authorization *and* concurrency as attack surfaces, not just
   input validation.
5. **Escalation** — determine whether any finding provides
   reconnaissance value or code-path access toward another finding.
   Not every relationship between findings is a true technical
   dependency state this precisely in your writeup.

This mirrors real API assessment methodology (see OWASP API Security
Top 10, 2023) and is the same process this project's own findings were
developed and documented under.

---

## Running the Application

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/),
  installed and running
- Git

### Setup

```bash
git clone https://github.com/Kabier-stack/centauri-bank.git
cd centauri-bank
```

### Step 2: Configure Environment Variables

Centauri Bank needs a few private configuration values to connect to the database and handle authentication.

An environment file named `.env` stores these values. It must be created in the main project directory, alongside `docker-compose.yml`.

**Create the file:**

```bash
nano .env
```

Add the following lines:

```dotenv
POSTGRES_PASSWORD=replace_with_a_strong_password
JWT_SECRET=replace_with_your_generated_secret
```

| `docker compose stop`            | Stop the running services without removing them. |
| `docker compose up -d`           | Start the services again.                        |
| `docker compose down`            | Stop and remove the containers and network.      |

The PostgreSQL data is stored in a persistent Docker volume, so running `docker compose down` does not normally delete the database data.

**Warning:** Avoid `docker compose down -v` unless you intentionally want to remove the database volume and its stored data.

### Troubleshooting

**The application cannot connect to PostgreSQL**

Check that the services are running:

```bash
docker compose ps
```

Review the logs:

```bash
docker compose logs postgres backend
```

**The backend fails to start**

Check that `.env` exists in the main project directory and contains both `POSTGRES_PASSWORD` and `JWT_SECRET`.

**The website does not load**

Confirm that the frontend container is running and inspect its logs:

```bash
docker compose logs frontend
```

**Database migration fails**

Make sure the backend and PostgreSQL containers are running, then review the error message. Do not repeatedly run commands without understanding the cause.

### Security Notice

Centauri Bank is a security learning and testing project. Use it locally or in an environment you are authorized to test. Do not expose the application or its test data publicly without appropriate security controls.
## Documentation

| Document | Contents |
|---|---|
| [`VULN_LOG.md`](./VULN_LOG.md) | Full internal vulnerability design log: every finding, its OWASP category, and the deliberate design reasoning behind it |
| [`PENTEST_REPORT.md`](./PENTEST_REPORT.md) | Formal assessment report: executive summary, per-finding severity/reproduction/evidence/remediation, attack chain analysis, and honest black-box discovery methodology (including where automated tooling failed and why) |

---

## Vulnerability Summary

| # | Finding | OWASP API Security Top 10 (2023) | Severity |
|---|---|---|---|
| 1 | Recipient lookup information disclosure | API3 — Broken Object Property Level Authorization | Low |
| 2 | Mass assignment on transfer endpoint | API3 — Broken Object Property Level Authorization | High |
| 3 | Race condition / TOCTOU double-spend | API6 — Unrestricted Access to Sensitive Business Flows | Critical |
| 4 | Insufficient session revocation | API2 — Broken Authentication | Medium |
| 5 | Broken function-level authorization on admin action | API5 — Broken Function Level Authorization | Critical |

Findings 2 and 3 form a genuine technical escalation chain: Finding 2
grants access to a code path that Finding 3's flaw lives inside.
Finding 1 provides reconnaissance value toward the chain but is not a
technical prerequisite for exploiting it; this distinction is
addressed explicitly in the full report, since conflating
"discoverability" with "dependency" is a common and here,
deliberately corrected — mistake.

Full detail, reproduction steps, and evidence for every finding are in
[`PENTEST_REPORT.md`](./PENTEST_REPORT.md).

---

## What This Project Demonstrates

- Designing realistic, chained (not checklist) vulnerabilities tied
  to genuine product logic
- Manual and tool-assisted black-box discovery (Burp Suite, Arjun,
  Param Miner), including honest documentation of tool limitations
  and a rejected attempt at a methodologically invalid test result
- Precise vulnerability classification (mass assignment vs. BOLA vs.
  BFLA) and self-correction when initial classification was imprecise
- Professional security report writing, with verified citations and
  justified — not merely asserted — severity ratings
- Full-stack implementation of the *correct*, non-vulnerable version
  of the same logic (`transferFunds`) alongside the intentionally
  flawed one (`expressTransferFunds`), demonstrating the fix is
  understood, not just the bug

---

## Disclaimer

This application is intended solely for personal security education
and portfolio demonstration in an isolated, authorized environment.
The author assumes no responsibility for use of this code outside
that context.
