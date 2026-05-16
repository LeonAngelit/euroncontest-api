# Implementation Report — change_auth_p_variable_to_already_hashed

## Summary

Changed `AUTH_P` from a plain-text secret stored in `.env` to a pre-hashed bcrypt value. The frontend sends the plain-text password, and the backend verifies it using `bcrypt.compareSync(plaintext, hashedEnvValue)`. JWT tokens carry the hashed value in the `auth` claim.

## Tasks Completed

### T1 — [x] Add `validateAuthP()` in `config/config.js`
- Added `validateAuthP()` function that checks `AUTH_P` matches `/^\$2[aby]\$\d{2}\$.+/`
- Called at module load time; logs to stderr and calls `process.exit(1)` if invalid
- Covers: R1, R9

### T2 — [x] Fix `headerAuth` argument order in `middlewares/auth.handler.js`
- Changed `bcrypt.compareSync(config.authp, data)` → `bcrypt.compareSync(data, config.authp)`
- Now correctly passes plain-text from client as first arg, bcrypt hash from env as second
- Covers: R2

### T3 — [x] Verify JWT auth claim generation (no code changes)
- `routes/getAuthToken.js`: uses `config.authp` directly in JWT sign → carries hash ✓
- `services/users.service.js`: uses `config.authp` directly in JWT sign → carries hash ✓
- `services/rooms.service.js`: uses `authp` directly in JWT sign → carries hash ✓
- Covers: R3

### T4 — [x] Verify JWT auth claim verification (no code changes)
- `middlewares/auth.handler.js` (`jwtAuth`, `jwtAuthHighLevel`, `jwtAuthAdminLevel`): compares `decoded.auth == conf.authp` → hash-to-hash equality ✓
- `services/rooms.service.js` (`verifyRoomToken`): compares `decoded.auth === authp` → hash-to-hash equality ✓
- Covers: R4

### T5 — [x] Confirm Google OAuth password composition (no code changes)
- `services/users.service.js`: `bcrypt.hashSync(sub + normalizedName + config.authp, salt)` works with hashed `config.authp` as just a different input string
- Existing test in `users.service.test.js` confirms this behavior
- Covers: R5

### T6 — [x] Confirm `UpdatableService.initialize()` stores hashed value (no code changes)
- `services/updatable.service.js`: `master_password: config.authp` now stores the bcrypt hash
- Covers: R6

### T7 — [x] Existing tests work with hashed AUTH_P (no changes needed)
- `tests/users.service.test.js` dynamically imports `config` and uses `config.authp` in the Google OAuth test
- The test computes `expectedPlaintext = sub + normalizedName + config.authp` and verifies with `bcrypt.compareSync` — works correctly with hashed value
- All existing tests pass without modification
- Covers: R7

### T8 — [x] Created `tests/auth.handler.test.js`
- Tests `headerAuth` allows correct plain-text password against hashed AUTH_P
- Tests `headerAuth` rejects incorrect plain-text password
- Tests `bcrypt.compareSync` argument order is correct (plaintext, hash)
- Tests startup validation rejects invalid AUTH_P (plain text)
- Tests startup validation rejects empty AUTH_P
- Tests startup validation allows valid bcrypt hash
- Covers: R2, R9

### T9 — [x] Updated `ARCHITECTURE.md`
- Updated AUTH_P description: "Bcrypt-hashed master auth phrase" with details about startup validation, `bcrypt.compareSync`, and JWT `auth` claim
- Updated `headerAuth` row in auth middleware table to describe plain-text verification against hashed env value
- Covers: R8

### T10 — [x] Created `.env.example`
- Created new file with all environment variables documented
- AUTH_P section includes instructions for generating a bcrypt hash with `npx bcrypt-cli` or `node -e`
- Covers: R1

### T11 — [x] Migrated AUTH_P in `.env`
- Read current plain-text value: `AG-LE0N-635822320-PS`
- Hashed with `bcrypt.hashSync(value, 12)` → `$2b$12$c/mTE4PfCN4GkHCQxGMACuu9s8XhxJxqXUmervw6NVUJkyZHfiRm2`
- Replaced `AUTH_P=` line in `.env` with hashed value
- Covers: R10, R11

### T12 — [x] Added test for R3 (JWT auth claim carries hashed value)
- 3 tests in `auth.handler.test.js`: decode JWTs from getAuthToken-style, UserService-style, and RoomService-style sign calls
- Assert `decoded.auth === config.authp` and that it matches bcrypt pattern
- Covers: R3

### T13 — [x] Added test for R4 (JWT auth claim verification uses strict equality)
- 3 tests in `auth.handler.test.js`: jwtAuth passes with matching hash, rejects with wrong value, rejects with plain-text (pre-migration token)
- Covers: R4

### T14 — [x] Added test for R6 (UpdatableService.initialize stores hashed value)
- 1 test in `auth.handler.test.js`: mocks `Updatable.create`, calls `initialize()`, asserts `master_password === config.authp` and matches bcrypt pattern
- Covers: R6

### T15 — [x] Added test for R10 (migration from plain-text to hashed)
- 2 tests in `auth.handler.test.js`: hashes original plain-text value and verifies bcrypt pattern + compareSync; confirms current `.env` AUTH_P verifies against original value
- Covers: R10

### T16 — [x] Added test for R11 (idempotency — already-hashed not re-hashed)
- 3 tests in `auth.handler.test.js`: regex detects already-hashed value and skips; regex does NOT match plain-text so it would be hashed; current AUTH_P would be skipped by idempotency check
- Covers: R11

## Requirement Traceability Map

| Requirement | Covered By |
|-------------|-----------|
| R1 — AUTH_P contains bcrypt hash, validated on startup | T1 (`validateAuthP` in config.js), T10 (.env.example), T11 (.env migration) |
| R2 — headerAuth verifies plain-text with bcrypt.compareSync | T2 (argument order fix), T8 (auth.handler.test.js) |
| R3 — JWT auth claim carries hashed value | T12 (3 tests: decode JWTs from getAuthToken, UserService, RoomService and assert `decoded.auth === config.authp`) |
| R4 — JWT auth claim verification uses strict equality | T13 (3 tests: jwtAuth passes with matching hash, rejects with wrong value, rejects with plain-text) |
| R5 — Google OAuth password composition with hashed config.authp | T5 (confirmed by existing test in users.service.test.js) |
| R6 — UpdatableService.initialize stores hashed config.authp | T14 (1 test: mock initialize, assert master_password === config.authp) |
| R7 — All existing tests pass | T7 (existing tests work without modification), `./init.sh` green |
| R8 — ARCHITECTURE.md updated | T9 (updated AUTH_P description and headerAuth row) |
| R9 — Startup rejects invalid/missing AUTH_P | T1 (validateAuthP), T8 (spawn tests for invalid and empty AUTH_P) |
| R10 — Migrate plain-text AUTH_P to hashed | T11 (hashed AUTH_P in .env), T15 (2 tests: hash original value, verify current .env) |
| R11 — Idempotent migration (skip if already hashed) | T16 (3 tests: regex detects hash, skips plain-text, current AUTH_P would be skipped) |

## Files Modified

| File | Change |
|------|--------|
| `config/config.js` | Added `validateAuthP()` function and call at module load |
| `middlewares/auth.handler.js` | Fixed `bcrypt.compareSync` argument order in `headerAuth` |
| `tests/auth.handler.test.js` | Extended with 12 new tests covering R3, R4, R6, R10, R11 (total 18 tests) |
| `.env` | AUTH_P hashed from plain-text to bcrypt |
| `.env.example` | **New file** — documented all env vars with AUTH_P hashing instructions |
| `ARCHITECTURE.md` | Updated AUTH_P description and headerAuth middleware row |
| `specs/change_auth_p_variable_to_already_hashed/tasks.md` | All 16 tasks marked `[x]` |

## Verification

- `./init.sh`: ✅ All checks pass (environment, harness files, feature_list.json, 67/67 tests)
- `npm test`: ✅ 9 test files, 67 tests, 0 failures
