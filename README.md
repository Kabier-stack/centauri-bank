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
   Burp Suite interception, and reporting the results of each.
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

1. **Reconnaissance**: register a normal account, use the
   application exactly as intended (deposit, verify a recipient,
   send money, review transaction history). Identify every API
   endpoint this exercises and capture the request/response shape
   for each.
2. **Authorization mapping**: identify the account/privilege model
   (standard vs. premium tiers; user vs. admin roles) purely from
   observed application behavior, before assuming anything about the
   backend.
3. **Input and object analysis**: for each write endpoint, determine
   exactly which fields the client controls versus which the server
   should be deriving independently. Compare what a GET response
   discloses against what the corresponding write endpoint accepts.
4. **Business logic testing**: identify any endpoint with real,
   stateful side effects (balance changes especially) and consider
   both authorization *and* concurrency as attack surfaces, not just
   input validation.
5. **Escalation**: determine whether any finding provides
   reconnaissance value or code-path access toward another finding.
   Not every relationship between findings is a true technical
   dependency state this precisely in your writeup.

This mirrors real API assessment methodology (see OWASP API Security
Top 10, 2023) and is the same process this project's own findings were
developed and documented under.

---

## Running the Application

### Prerequisites
- Docker Engine
- Docker Compose
- Git
- OpenSSL

### 1. Clone the Repository

```bash
git clone https://github.com/Kabier-stack/centauri-bank.git
cd centauri-bank
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
nano .env
```

Generate secure credentials:

```bash
openssl rand -hex 24
openssl rand -hex 32
```

Add the generated values:

```env
POSTGRES_PASSWORD=your_generated_database_password
JWT_SECRET=your_generated_jwt_secret
```

### 3. Build and Start the Application

```bash
docker compose up -d --build
```

Docker Compose automatically:
- Starts PostgreSQL and waits for it to become healthy.
- Applies Prisma database migrations.
- Starts the backend and frontend services.

### 4. Access the Application

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3001 |

### 5. Useful Docker Commands

```bash
# View container status
docker compose ps

# View application logs
docker compose logs -f

# Stop the application
docker compose down

# Rebuild and restart
docker compose up -d --build
```

**Database persistence:** PostgreSQL data is stored in a Docker volume and is preserved when containers are stopped or removed using `docker compose down`.

To delete the database and all stored data:

```bash
docker compose down -v
```

**Warning:** This permanently deletes all database records.


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
deliberately corrected mistake.

Full detail, reproduction steps, and evidence for every finding are in
[`PENTEST_REPORT.md`](./PENTEST_REPORT.md).

---

## What This Project Demonstrates

- Designing realistic, chained vulnerabilities tied to genuine product logic
- Manual and tool-assisted black-box discovery (Burp Suite)
- Precise vulnerability classification (mass assignment vs. BOLA vs.
  BFLA).
- Professional security report writing, with verified citations and
  justified.
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
