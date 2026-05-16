# Review — feature #2 add_bcrypt_backend

**Verdict:** APPROVED

## Traceability requirements ↔ tests

- **R1**: [x] covered by `should hash the password with bcrypt before storing the user (R1, R2)` — verifies `create()` stores a bcrypt hash (not plain-text) and that `bcrypt.compareSync(plainPassword, hash)` returns true
- **R2**: [x] covered by `should hash the password with bcrypt before storing the user (R1, R2)` — asserts `createCallArgs.password).not.toBe(plainPassword)` and `createCallArgs.password).toMatch(/^\$2[aby]\$/)`
- **R3**: [x] covered by `should authenticate with a plain-text password against the stored bcrypt hash (R3)` and `should reject an incorrect plain-text password (R3)` — verifies `loginByEmail()` uses `bcrypt.compareSync(password, user.password)` for both success and failure cases
- **R4**: [x] covered by `should authenticate with a plain-text password against the stored bcrypt hash (R4)` and `should reject an incorrect plain-text password (R4)` — verifies `loginByName()` uses `bcrypt.compareSync(password, user.password)` for both success and failure cases
- **R5**: [x] covered by `should not reverse or transform the password before comparison — plain text is compared directly (R5)` — asserts that the reversed password does NOT authenticate, proving no transformation is applied
- **R6**: [x] covered by `should hash the new password with bcrypt before updating the user (R6)` and `should not modify other fields when updating password (R6)` and `should not hash the password field when it is not provided in the update data` — verifies `update()` hashes new passwords and skips absent passwords
- **R7**: [x] covered by `should generate and store a bcrypt-hashed password when creating a new Google user (R7)` — spies on `OAuth2Client.prototype.verifyIdToken`, creates a new Google user scenario, asserts `password` matches bcrypt format (`/^\$2[aby]\$/`) and that `bcrypt.compareSync(sub + normalizedName + config.authp, hash)` returns true
- **R8**: [x] build integrity verified by `./init.sh` — all 39 tests pass (29 pre-existing + 10 new bcrypt tests), project builds and starts without errors

## Code change verification

The git diff of `services/users.service.js` shows exactly 5 changes, all within scope:

| # | Change | Lines | Verified |
|---|--------|-------|----------|
| 1 | Added `hashPassword(plainPassword)` method | +4 lines (19–21) | ✅ Uses `bcrypt.hashSync(plainPassword, bcrypt.genSaltSync(12))` — cost factor 12 |
| 2 | `create()`: added `data.password = this.hashPassword(data.password)` | +1 line (46) | ✅ Hashes before `models.User.create(data)` |
| 3 | `loginByEmail()`: replaced `bcrypt.compareSync(password.split('').reverse().join(''), user.password)` with `bcrypt.compareSync(password, user.password)` | ~1 line (569) | ✅ No reversal, direct comparison |
| 4 | `loginByName()`: replaced `bcrypt.compareSync(password.split('').reverse().join(''), user.password)` with `bcrypt.compareSync(password, user.password)` | ~1 line (594) | ✅ No reversal, direct comparison |
| 5 | `update()`: added `if (data.password) { data.password = this.hashPassword(data.password); }` | +3 lines (628–630) | ✅ Hashes before `user.update(data)` |

**Out-of-scope verification:**
- `accessWithGoogle()`: **NOT modified** — git diff confirms no changes. The method still uses `bcrypt.genSaltSync(12)` and `bcrypt.hashSync(...)` at lines 97–101. ✅
- `middlewares/auth.handler.js`: **NOT modified** — `git diff HEAD -- middlewares/auth.handler.js` returns empty. ✅
- No string reversal (`.split('').reverse().join('')`) remains anywhere in `services/users.service.js`. ✅

## Test quality assessment

- **10 test cases** in `tests/users.service.test.js` covering R1–R7
- **7 describe blocks** organized by method/requirement
- Tests use proper mocking (`vi.fn()`, `mockResolvedValue`, `mockImplementation`) — no real DB connections
- Tests verify both **positive** and **negative** cases (e.g., correct password authenticates, wrong password is rejected)
- R5 test explicitly verifies that the reversed password does NOT authenticate — a direct negation test for the original bug
- R7 test properly mocks `OAuth2Client.prototype.verifyIdToken` and captures `User.create()` call args to verify stored password format
- No `console.log()` statements in source or test files
- No TODOs without context

## Build verification

- `./init.sh`: ✅ All checks pass
  - Environment: node v22.14.0, npm 10.9.2
  - Base harness files: all exist
  - Feature list and specs: valid
  - Tests: **39 passed (7 test files)** — 0 failures
  - Duration: ~5.5s

## Checkpoints

- **C1** — The Harness is Complete: [x] All base files exist, docs exist, `./init.sh` exits 0
- **C2** — The State is Consistent: [x] Feature #2 `add_bcrypt_backend` is `done`; `progress/current.md` describes the completed session
- **C3** — The Code Respects the Architecture: [x] No new external dependencies; no debug `console.log()`; no TODOs without context
- **C4** — Verification is Real: [x] `tests/users.service.test.js` has 10 tests for this feature; `npm test` shows 39 tests green
- **C5** — Session Closed Correctly: [x] No suspicious untracked files (only progress/spec artifacts); `progress/current.md` is updated
- **C6** — Spec Driven Development: [x] `specs/add_bcrypt_backend/` has all 3 files; `requirements.md` uses EARS notation; all T1–T12 marked `[x]`; each R1–R8 has ≥1 concrete test

## Complete Tasks

- T1: [x] — Add `hashPassword()` helper
- T2: [x] — Update `create()` to hash passwords
- T3: [x] — Update `loginByEmail()` to remove reversal
- T4: [x] — Update `loginByName()` to remove reversal
- T5: [x] — Update `update()` to hash passwords
- T6: [x] — Verify `accessWithGoogle()` and `auth.handler.js` not modified
- T7: [x] — Run `./init.sh` and confirm green
- T8: [x] — Add test: create stores bcrypt hash (R1, R2)
- T9: [x] — Add test: loginByEmail with plain-text (R3)
- T10: [x] — Add test: loginByName with plain-text (R4)
- T11: [x] — Add test: no reversal/transformation (R5)
- T12: [x] — Add test: update hashes new password (R6)
- (R7 test added as follow-up fix): [x] — Add test: accessWithGoogle bcrypt hash (R7)

## Notes

The R7 test gap identified in the previous review has been resolved. The test now properly verifies that `accessWithGoogle()` continues to generate and store bcrypt-hashed passwords for new Google OAuth users, confirming the code path was not altered and functions correctly.