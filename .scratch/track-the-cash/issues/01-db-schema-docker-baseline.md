# 01: DB schema + Docker Compose baseline

**What to build:** A running PostgreSQL instance with all six tables created, and a Docker Compose file that declares the `api`, `frontend`, and `ml-runner` services with a `.env`-backed config. No application logic yet — just the structural foundation every other ticket builds on.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] PostgreSQL has all six tables: `complaints`, `mule_accounts`, `atm_locations`, `atm_risk_history`, `predictions`, `alerts` with the correct columns and types as defined in the spec
- [x] All enum fields (`crime_type`, `status`, `severity`, `triggered_by`) are represented as CHECK constraints or PostgreSQL enums
- [x] A migration script (or SQLAlchemy `metadata.create_all`) runs idempotently — re-running does not duplicate or error
- [x] `docker-compose.yml` declares `api`, `frontend`, and `ml-runner` services (stubs are fine at this stage)
- [x] A `.env.example` file documents all required environment variables: `DATABASE_URL`, `JWT_SECRET`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`
- [x] `.env` is gitignored; `.env.example` is committed
- [x] `docker compose up` starts without errors (services may exit immediately at this stage; they just must not crash on config)
- [x] **No Docker containers are used in tests** — schema correctness is verified by running the migration script against a local SQLite or throwaway Postgres instance directly, not via Docker
