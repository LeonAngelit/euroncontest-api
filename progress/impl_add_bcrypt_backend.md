# Implementation Report — add_bcrypt_backend

> Feature #2, implemented 2026-05-16

## Summary

Implemented bcrypt password hashing on the backend to replace plain-text password storage and removed the password reversal pattern from login methods.

## Changes Made

### Source: `services/users.service.js`

1. **Added `hashPassword(plainPassword)` method** (T1, R1/R2/R6)
   - Returns `bcrypt.hashSync(plainPassword, bcrypt.genSaltSync(12))`
   - Centralises hashing logic with bcrypt cost factor 12 (matching `accessWithGoogle`)

2. **Updated `create()` method** (T2, R1/R2)
   - Added `data.password = this.hashPassword(data.password)` before `models.User.create(data)`
   - Passwords are now stored as bcrypt hashes

3. **Updated `loginByEmail()` method** (T3, R3/R5)
   - Replaced `bcrypt.compareSync(password.split('').reverse().join(''), user.password)` with `bcrypt.compareSync(password, user.password)`
   - Plain-text passwords from the client are compared directly against the stored hash

4. **Updated `loginByName()` method** (T4, R4/R5)
   - Replaced `bcrypt.compareSync(password.split('').reverse().join(''), user.password)` with `bcrypt.compareSync(password, user.password)`
   - Same fix as `loginByEmail()`

5. **Updated `update()` method** (T5, R6)
   - Added `if (data.password) { data.password = this.hashPassword(data.password); }` before `user.update(data)`
   - Password updates are now hashed before persistence

### No changes made to:
- `accessWithGoogle()` — verified unchanged (T6, R7)
- `middlewares/auth.handler.js` — verified unchanged (T6, R7)

### Test: `tests/users.service.test.js`

10 tests covering all password-related requirements (9 original + 1 added for R7).

### R7 Review Fix (2026-05-16)

Added a concrete test for R7 ("WHERE a user authenticates via Google OAuth, the system SHALL continue to generate and store bcrypt-hashed passwords as currently implemented"):
- Uses `vi.spyOn(OAuth2Client.prototype, 'verifyIdToken')` to mock Google OAuth verification
- Creates a new Google user scenario (mock `models.User.findOne` returns null for no existing user)
- Asserts that `models.User.create()` receives a `password` field matching the bcrypt hash format (`/^\$2[aby]\$/`)
- Asserts that `bcrypt.compareSync(sub + normalizedName + config.authp, hash)` returns `true` for the stored hash

## Requirement Traceability (R<n> → Test)

| Requirement | Description | Test(s) |
|---|---|---|
| R1 | Password hashed with bcrypt (cost 12) before persisting | `create() — password hashing on creation > should hash the password with bcrypt before storing the user` |
| R2 | Stored password is a bcrypt hash, not plain-text | `create() — password hashing on creation > should hash the password with bcrypt before storing the user` |
| R3 | `loginByEmail()` authenticates with plain-text against stored hash | `loginByEmail() — plain-text password comparison > should authenticate with a plain-text password against the stored bcrypt hash` and `should reject an incorrect plain-text password` |
| R4 | `loginByName()` authenticates with plain-text against stored hash | `loginByName() — plain-text password comparison > should authenticate with a plain-text password against the stored bcrypt hash` and `should reject an incorrect plain-text password` |
| R5 | No password reversal/transformation applied | `No password reversal or transformation > should not reverse or transform the password before comparison` |
| R6 | Password hashed on update | `update() — password hashing on update > should hash the new password with bcrypt before updating the user`, `should not modify other fields when updating password`, `should not hash the password field when it is not provided` |
| R7 | `accessWithGoogle()` generates bcrypt-hashed password for new Google users | `accessWithGoogle() — bcrypt password generation for new Google users > should generate and store a bcrypt-hashed password when creating a new Google user` |
| R8 | Project builds and starts without errors | `./init.sh` passes — all 39 tests green |

## Verification

- `./init.sh` — all checks pass (environment, harness, specs, tests)
- All 39 tests pass (29 existing + 10 bcrypt tests)
- R7 now has a concrete test verifying `accessWithGoogle()` stores bcrypt-hashed passwords