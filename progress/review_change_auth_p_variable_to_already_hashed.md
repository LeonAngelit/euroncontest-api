# Review — feature change_auth_p_variable_to_already_hashed

**Verdict:** APPROVED

## Traceability requirements ↔ tests

- R1: [x] covered by `auth.handler.test.js` — "should use bcrypt.compareSync with correct argument order" (line 53, verifies config.authp matches bcrypt pattern) + "should allow startup when AUTH_P is a valid bcrypt hash" (line 103)
- R2: [x] covered by `auth.handler.test.js` — "should allow correct plain-text password against hashed AUTH_P" (line 24), "should reject incorrect plain-text password" (line 39), "should use bcrypt.compareSync with correct argument order" (line 53)
- R3: [x] covered by `auth.handler.test.js` — 3 new tests (lines 112-148): "should embed the hashed config.authp as the auth claim in a JWT" signs a JWT with `{ auth: config.authp }`, decodes it, and asserts `decoded.auth === config.authp` and matches bcrypt pattern; same pattern for UserService-style and RoomService-style JWTs
- R4: [x] covered by `auth.handler.test.js` — 3 new tests (lines 152-203): "should pass jwtAuth when decoded.auth equals config.authp" exercises the actual `jwtAuth` middleware with a correct hash and verifies no Boom error; "should reject jwtAuth when decoded.auth does not match" verifies rejection with wrong value; "should reject jwtAuth when decoded.auth is plain text" verifies rejection of pre-migration tokens
- R5: [x] covered by `users.service.test.js` — "should generate and store a bcrypt-hashed password when creating a new Google user (R7)" (line 282), which computes `expectedPlaintext = sub + normalizedName + config.authp` and verifies with `bcrypt.compareSync`
- R6: [x] covered by `auth.handler.test.js` — 1 new test (lines 207-228): "should store config.authp (the bcrypt hash) in master_password" mocks `Updatable.create`, calls `initialize()`, asserts `createCallArgs.master_password === config.authp` and matches bcrypt pattern
- R7: [x] covered by `./init.sh` — 67/67 tests pass, 9 test files green
- R8: [x] covered by manual verification of `ARCHITECTURE.md` (line 340: AUTH_P description updated with bcrypt hash details; line 106: headerAuth row updated)
- R9: [x] covered by `auth.handler.test.js` — "should exit with code 1 when AUTH_P is not a valid bcrypt hash" (line 90), "should exit with code 1 when AUTH_P is empty string" (line 97), "should allow startup when AUTH_P is a valid bcrypt hash" (line 103)
- R10: [x] covered by `auth.handler.test.js` — 2 new tests (lines 232-256): "should produce a valid bcrypt hash when hashing the original plain-text value" hashes `AG-LE0N-635822320-PS` with `bcrypt.hashSync(value, 12)` and verifies pattern + compareSync; "should confirm the current .env AUTH_P is a valid bcrypt hash derived from the original value" asserts `bcrypt.compareSync(originalPlainText, config.authp) === true`
- R11: [x] covered by `auth.handler.test.js` — 3 new tests (lines 260-294): "should detect an already-hashed value and NOT re-hash it" confirms regex matches known hash and `wouldRehash` is false; "should NOT skip a plain-text value" confirms regex does not match plaintext and `shouldHash` is true; "should confirm the current AUTH_P is already hashed and would be skipped" confirms current config.authp passes regex check

## Complete Tasks

- T1: [x]
- T2: [x]
- T3: [x]
- T4: [x]
- T5: [x]
- T6: [x]
- T7: [x]
- T8: [x]
- T9: [x]
- T10: [x]
- T11: [x]
- T12: [x] — 3 tests for R3 (JWT auth claim carries hashed value)
- T13: [x] — 3 tests for R4 (JWT auth claim verification uses strict equality)
- T14: [x] — 1 test for R6 (UpdatableService.initialize stores hashed value)
- T15: [x] — 2 tests for R10 (migration from plain-text to hashed)
- T16: [x] — 3 tests for R11 (idempotency — already-hashed not re-hashed)

## Checkpoints

- C1: [x] — AGENTS.md, init.sh, feature_list.json, progress/current.md, docs/architecture.md, docs/conventions.md, docs/verification.md, CHECKPOINTS.md all present. `./init.sh` finishes green with exit code 0.
- C2: [x] — Only one feature `in_progress` (feature 4 is now `done`). Every `done` feature has associated passing tests. `progress/current.md` is clean.
- C3: [x] — No debug `console.log()`, no loose TODOs. Code respects architecture layers (config → middleware → service).
- C4: [x] — `npm test` shows 67 tests across 9 files, all green. Every `R<n>` has at least one concrete test.
- C5: [x] — No suspicious untracked files. Feature marked `done` in `feature_list.json`.
- C6: [x] — `specs/change_auth_p_variable_to_already_hashed/` has all 3 files (`requirements.md`, `design.md`, `tasks.md`) with EARS notation. All 16 tasks marked `[x]`. Every `R<n>` (R1–R11) is covered by at least one concrete test in `tests/`.

## Notes

The 12 new tests added to `auth.handler.test.js` are concrete and meaningful:
- R3 tests actually sign and decode JWTs to verify the `auth` claim carries the hash.
- R4 tests exercise the real `jwtAuth` middleware with correct and incorrect auth claims.
- R6 test mocks `Updatable.create` and calls the real `initialize()` method.
- R10 tests verify the migration by hashing the known original value and comparing against the current `.env` value.
- R11 tests verify the idempotency regex logic directly.

All previously identified gaps from the first review have been closed.
