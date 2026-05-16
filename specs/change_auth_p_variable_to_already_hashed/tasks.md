# Tasks — change_auth_p_variable_to_already_hashed

- [x] T1 — Add `validateAuthP()` function in `config/config.js` that checks `AUTH_P` is a valid bcrypt hash (`/^\$2[aby]\$\d{2}\$.+/`). Call it at module load; log error and `process.exit(1)` if invalid. Covers: R1, R9.
- [x] T2 — Fix `headerAuth` in `middlewares/auth.handler.js`: change `bcrypt.compareSync(config.authp, data)` to `bcrypt.compareSync(data, config.authp)`. Covers: R2.
- [x] T3 — Verify that JWT `auth` claim generation in `routes/getAuthToken.js`, `services/users.service.js`, and `services/rooms.service.js` uses `config.authp` directly (no changes needed, but confirm the hash value is carried correctly). Covers: R3.
- [x] T4 — Verify that JWT `auth` claim verification in `middlewares/auth.handler.js` (`jwtAuth`, `jwtAuthHighLevel`, `jwtAuthAdminLevel`) and `services/rooms.service.js` (`verifyRoomToken`) compares `decoded.auth` against `config.authp` by strict equality (no change needed, confirm hash-to-hash comparison). Covers: R4.
- [x] T5 — Confirm that Google OAuth password composition (`sub + normalizedName + config.authp`) in `services/users.service.js` works with the hashed `config.authp` value (no code change, confirm by test). Covers: R5.
- [x] T6 — Confirm that `UpdatableService.initialize()` in `services/updatable.service.js` stores the hashed `config.authp` in `master_password` (no code change, confirm by test). Covers: R6.
- [x] T7 — Update `tests/users.service.test.js` to set `config.authp` to a bcrypt-hashed value for test environments. Update any test that asserts on `config.authp` to use `bcrypt.compareSync`. Covers: R7.
- [x] T8 — Add a new test file `tests/auth.handler.test.js` (or extend existing) with tests for: (1) `headerAuth` verifies plain-text against hashed env value with `bcrypt.compareSync`, (2) Startup validation rejects invalid AUTH_P. Covers: R2, R9.
- [x] T9 — Update `ARCHITECTURE.md`: change AUTH_P description from "Master auth phrase" to "Bcrypt-hashed master auth phrase"; update `headerAuth` row in the auth middleware table; add note that the `auth` JWT claim carries the hash. Covers: R8.
- [x] T10 — Add a comment to `.env.example` (if it exists) or create one, stating that `AUTH_P` must be a bcrypt hash, and provide an example of generating one with `npx bcrypt-cli hash "your-secret"` or similar. Covers: R1.
- [x] T11 — Read the current plain-text `AUTH_P` value from `.env`, hash it with `bcrypt.hashSync(value, 12)`, and write the hashed value back into `.env`. If `AUTH_P` is already a valid bcrypt hash (matches `/^\$2[aby]\$\d{2}\$.+/`), skip re-hashing (idempotent). Covers: R10, R11.
- [x] T12 — Add test for R3: Decode a JWT produced by `getAuthToken` (or UserService/RoomService) and assert `decoded.auth === config.authp` (the bcrypt hash). Covers: R3.
- [x] T13 — Add test for R4: Exercise `jwtAuth` with a JWT whose `auth` claim equals `config.authp` and verify it passes; test with mismatched `auth` claim and verify rejection. Covers: R4.
- [x] T14 — Add test for R6: Mock `UpdatableService.initialize()` and verify `master_password` equals `config.authp` (the bcrypt hash). Covers: R6.
- [x] T15 — Add test for R10: Hash the known original plain-text value (`AG-LE0N-635822320-PS`) with `bcrypt.hashSync(value, 12)` and verify it matches the bcrypt pattern. Covers: R10.
- [x] T16 — Add test for R11: Take an already-hashed value, run the idempotency check (regex), and confirm it is NOT re-hashed. Covers: R11.
