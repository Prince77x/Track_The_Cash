# 14: Shift to SQLite default & database consolidation

**What to build:** Configure SQLite (`sqlite:///./track_the_cash.db`) as the standard database across all environments. Ensure table creation, ingestion, synthetic data generation, ML feature extraction, and tests operate cleanly on SQLite without requiring external PostgreSQL services.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Default `DATABASE_URL` in config and `.env.example` points to `sqlite:///./track_the_cash.db`
- [x] SQLAlchemy connection config handles SQLite threading (`check_same_thread: False`) seamlessly
- [x] `init_db.py`, `fetch_atms.py`, `generate.py`, and `train_model.py` run out of the box against SQLite
- [x] All existing 22 automated test suites in `backend/tests/` continue to pass 100%
